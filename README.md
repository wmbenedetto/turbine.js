### NOTE: Docs in progress

In the meantime, see /examples (particularly /examples/js/init.js) for working examples

---

# Turbine

## Why Turbine?

## Core principles

### Declarative
### Expressive
### Event-driven
### Decoupled
### Modular
### Reusable

## Advantages

## Basic features

## Advanced features

## Quick install

## Quick start

## Key concepts

In order to use Turbine, it's important to first define some key concepts. Once we have a common vocabulary and general conceptual understanding established, we can then begin talking about how you can use Turbine to power your app.

### Workflow

The workflow is the jet fuel that powers Turbine. It's an expressive, declarative syntax for defining the control flow of your application. It allows you to define all the logical branching of your app in a single document, in a format that is both human- and machine-readable. 

A workflow is essentially a series of questions (queries) and answers (responses). It's almost like a conversation between Turbine and your app.

>**Turbine:** Is the user signed up?
>
>**Your app:** Nope.
>
>**Turbine:** Okay. Ask him to sign up. I'll wait.
>
>*Your app displays a signup form. The user fills it in and clicks Submit.*
>
>**Your app:** Alrighty, he signed up.
>
>**Turbine:** Great. Is he over 18?
>
>**Your app:** No, he's only 13.
>
>**Turbine:** Damn. Ask him for his parent's email, then let me know.
>
>*Your app asks for the parent's email. The user submits it.*
>
>**Your app:** I got the parent's email.
>
>**Turbine:** Is is valid?
>
>**Your app:** Yep, looks good.
>
>**Turbine:** Great! Let him in. We're done!

Now let's look at the same "conversation" expressed as a workflow:

```javascript
var workflow = {
    
    queries : {
        
        // Turbine: Is the user signed up?
        isUserSignedUp : {
            // Your app: Nope.
            no : {
                // Turbine: Okay. Ask him to sign up. I'll wait.
                publish : {
                    message : 'Signup.stepOne.show'
                },
                waitFor : 'Signup.stepOne.submitted',
                
                // Your app is listening for a Signup.stepOne.show message. It knows to handle
                // that by displaying a signup form. The user fills it in and clicks Submit.
                // This publishes a Signup.stepOne.submitted message. Which is equivalent to:
                //
                // Your app: Alrighty, he signed up.
                // 
                // Turbine moves to its next "question"
                then : 'isOver18'
            },
            
            yes : {
                then : 'stop.'
            },
        },
        
        // Turbine: Great. Is he over 18?
        isOver18 : {
            // Your app: No, he's only 13.
            no : {
                // Turbine: Damn. Ask him for his parent's email, then let me know.
                publish : {
                    message : 'Signup.parentEmail.show'
                },
                waitFor : 'Signup.parentEmail.submitted',
                
                // Your app is listening for a Signup.parentEmail.show message. It knows to handle
                // that by displaying a form that asks the user for his parent's email address.
                // The user enters the email and clicks Submit. This publishes a Signup.parentEmail.submitted message. 
                // Which is equivalent to:
                //
                // Your app: I got the parent's email.
                // 
                // Turbine moves to its next "question"
                then : 'isParentEmailValid'
            },
            
            yes : {
                then : 'stop.'
            }
        },
        
        // Turbine: Is is valid?
        isParentEmailValid : {
            // Your app: Yep, looks good.
            yes : {
                // Turbine: Great! Let him in. We're done!
                publish : {
                    message : 'Signup.form.complete'
                },
                then : 'stop.'
            }, 
            
            no : {
                publish : {
                    message : 'Signup.error.show.INVALID_EMAIL_ADDRESS'
                },
                then : 'isOver18'
            }
        }
    }    
};
```

---

### Queries

Queries are the questions that Turbine asks your app. Therefore, a query is a string typically written as a question, such as:

* isUserLoggedIn
* canOpenGoldDoor
* whichErrorCode
* howManyStars

#### Query phrasing

Generally, queries should be phrased so that the affirmative answer (if there is one) is the answer you want/expect. 

For example, say you want to confirm that a plugin is the latest version. There are two ways you could write the same query: `isPluginOutdated` or `isPluginUpToDate`. 

Since you want and expect the plugin to be up-to-date, the preferred phrasing would be `isPluginUpToDate`. 

Phrasing your queries this way means that the "happy path" through your app is a series of yesses. Is the plugin up to date? Yes! Is the game loaded? Yes! Is the user logged in? Yes! And so on.

#### Query functions

When you instantiate an instance of Turbine, you can (but don't have to) define functions from your app that Turbine can use to execute the query.

For example, if your app only lets magicians open gold doors, you might define a query function like:

```javascript
var initObj = {
    queries : {
        canOpenGoldDoor : user.isMagician.bind(user)
    }  
};
```

When Turbine gets to the `canOpenGoldDoor` query in your workflow, it will execute `user.isMagician()`, which will return `true` or `false`. This is the "response."

---

### Responses

Responses are the answers your app returns for queries.

Responses are often simple booleans: true or false get converted to "yes" or "no" by Turbine. However, the response really can be any arbitrary string or number. Responses for the query examples above might look like:

* isUserLoggedIn
    * yes
    * no
* canOpenGoldDoor
    * yes
    * no
* whichErrorCode
    * INVALID_EMAIL
    * INVALID_CREDIT_CARD
    * MUST_CHECK_TERMS_BOX
* howManyStars
    * 1
    * 2
    * 3
    * 4
    * 5

Responses can be defined in a couple of ways.    

#### Via query functions

The most obvious way to get a response is as a value returned by the query function. When the `canOpenGoldDoor` query executes the `user.isMagician()` function, whatever that function returns gets set as the response to `canOpenGoldDoor`: true, which gets converted to "yes".

#### Via `setResponse()`

The second way a response can be defined is via Turbine's `setResponse()` method. This isn't really the preferred way of doing things, since it requires more tightly coupling your app with Turbine and your workflow. However, it's an option you can use if you need it.

For example, say you have some form validation logic. You could do something like:

```javascript
if (user.email.indexOf('@') < 0){
    turbine.setResponse('whichErrorCode','INVALID_EMAIL');
}
```
When Turbine reaches the `whichErrorCode` query, it will first check if a query function has been defined. It hasn't been, so Turbine then checks to see which response was set via `setResponse()`.

#### Via initialization object

When Turbine is instantiated, you can define default responses in the init object passed to the constructor. Since Turbine defaults all responses to false, you only need to define defaults for non-false values.

```javascript
var initObj = {
    responses : {
        isLoggedIn : true,
        howManyStars : 3
    }  
};
```

When Turbine executes a query and 1.) no query function has been defined, and 2.) no reponse has been set via `setResponse()`, then it will use the response from the init object (or false if none is defined).

---

### Resets

Workflows don't always move inexorably forward in a straight line. Sometimes they need to backtrack, repeat, start over, etc. When this happens, you may need to reset some of the responses you previously set.

Just like query functions and default responses, resets are defined in the init object passed to the Turbine constructor. A reset can be either a function reference, or a simple value.

For example, consider a login form that limits a user to 3 login attempts before locking the login form. By default, the user can attempt to login, so the default response for `canAttemptLogin` is true. 

In addition, a reset function is defined for the `canAttemptLogin` query. This will be executed whenever Turbine moves backwards through the workflow past `canAttemptLogin`.

```javascript
var initObj = {
    responses : {
        canAttemptLogin : true
    },
    resets : {
        canAttemptLogin : user.hasLoginAttemptsRemaining.bind(user)
    }
};
```

The login workflow is very simple. We check if the user can attempt a login. If he can, we publish a message telling the app to show the form, and we wait until the form is submitted. Then we check if the login is valid.

If the login is not valid, then we publish a message telling the app there has been an error, then we wait for a message telling us the user wants to retry. When we get that message, we **rewind** the workflow and replay the `canAttemptLogin` query.

Here's that workflow:

```javascript
var workflow = {
    
    queries : {
        
        canAttemptLogin : {
            yes : {
                publish : {
                    message : 'LoginForm.show'
                },
                waitFor : 'LoginForm.submit',
                then : 'isLoginValid'
            },
            no : {
                // publish message to disable login form
            }
        },
        
        isLoginValid : {
            yes : {
                // publish message to let user into site
            },
            no : {
                publish : {
                    message : 'LoginForm.error'
                },
                waitFor : 'LoginForm.retry',
                then : 'canAttemptLogin'
            }
        }
    }
}
```

The key here is the rewind: whenever we go backwards in the workflow, Turbine checks to see if a reset function (or value) has been defined for each query we have already passed. 

In this example, we defined a reset function for `canAttemptLogin` in our init object. Therefore, each time we rewind from `isLoginValid` back to `canAttemptLogin`, Turbine calls the `user.hasLoginAttemptsRemaining()` function. 

The first time through, this will return true. Second time, true. Third time, true. 

But when we rewind the fourth time, it will return *false.* So when the `canAttemptLogin` query is executed for the fourth time, it will follow the "no" response instead, locking the form against further attempts.

---

### Events/Messages

Turbine is an event-driven workflow engine. In the Turbine world, events are called **messages**. Turbine both **publishes** messages and **waits for** messages.

When Turbine publishes a message, the expectation is that your app is listening for that message. When your app gets the message, it goes off and does whatever it needs to do.

When your app is finished doing its thing, it publishes its own message saying it's done.

If Turbine is waiting for that message, it will pick up where it left off, executing the next query in the workflow.

By using `publish` and `waitFor` together like this, Turbine is basically telling your app, "Hey, go do some stuff, and let me know when you're done. Then I'll keep going."

Of course, there's no requirement that you wait for a return message after you publish. You can just publish and move on through the workflow. Likewise, you can wait for a message without having published one previously.

```javascript
var workflow = {
    
    queries : {
        
        isAppStarted : {
            
            // You can wait for a message without having published one previously
            yes : {
                waitFor : 'App.stepOne.complete',
                then : 'isAfterMidnight'
            },
            no : {
                // do stuff
            }
        },

        isAfterMidnight : {
            
            // You can publish a message without waiting for a return message
            yes : {
                publish : {
                    message : 'App.theme.update.DARK_BACKGROUND'
                },
                then : 'isStepOneComplete'
            },
            no : {
                // do stuff
            }
        },
        
        isStepOneComplete : {
            
            // You can publish a message then wait for a return message
            yes : {
                publish : {
                    message : 'App.stepTwo.show'
                },
                waitFor : 'App.stepTwo.complete'
                then : 'stop.'
            },
            no : {
                // do stuff
            }
        },
    }
};
```

.

## Initializing Turbine

Each instance of Turbine is initialized by calling the Turbine constructor and passing it a single `initObj` object literal.

The documentation below has more detail about what each property means, but here is the basic structure. Note that only `workflow` is required; the rest are optional.

```javascript
// Create initialization object
var initObj = {
    
    // REQUIRED
    workflow    : {},           
    
    // OPTIONAL
    name        : '',           
    logLevel    : '',           
    queries     : {},          
    responses   : {},           
    resets      : {},           
    init        : function(){}, 
    log         : function(){}, 
    publish     : function(){}, 
    listen      : function(){}, 
    remove      : function(){}, 
    report      : function(){} 
};

// Instantiate new Turbine instance using initObj
var turbine = new Turbine(initObj);
```

Now let's look at what each of these properties means.

---

### workflow

*[OBJECT] Defines the control flow of your application*

The workflow is the jet fuel that powers Turbine. It tells your app what to do, and where to go next after doing it.

Since workflows are a whole topic unto themselves, see the [Building a workflow](#building-a-workflow) section for more details.

---

### name 

*[STRING] Gives your Turbine instance a unique name for logging purposes.*

This can be useful when you have multiple Turbine instances running simultaneously (or sequentially) and you want to disambiguate the log messages from each instance. 

For example, if `initObj.name` is set to "CartExample", then the console logs will look like:

```
[CartExample.start()] Starting Turbine
[CartExample.publish()] Publishing message: Turbine|workflow|started
[CartExample.publish()] Publishing message: Turbine|workflow|waiting 
```

If you were to spin up another Turbine instance with an `initObj.name` of "SignupExample", you'd be able to tell the difference from CartExample:

```
[CartExample.publish()] Publishing message: Turbine|workflow|waiting 
[SingupExample.start()] Starting Turbine
[SingupExample.publish()] Publishing message: Turbine|workflow|started
```

If no `name` property is set, then the default value will be "Turbine", i.e. `[Turbine.start()] Starting Turbine`

---

### logLevel

*[STRING] Determines the verbosity of the logs being output to the console.*

**Logging is only available in the non-minified version of Turbine.js.** In the minified version, all logging functionality is stripped out to reduce file size.

Valid values for `initObj.logLevel`, in order of increasing verbosity, are:

* `OFF`
* `ERROR`
* `WARN`
* `INFO`
* `DEBUG`
* `TRACE`

The default value is `ERROR`.

---

### queries

*[OBJECT] Contains functions used to resolve queries and return responses.*

The `initObj.queries` object is a collection of key:value pairs. Each key is the name of a query that appears in your workflow; each corresponding value is a reference to a function that will return the result of the query (a.k.a. the response).

For example:

```javascript
var initObj = {
    
    queries : {
        isFoo               : someGlobalFunction,
        isLoggedIn          : app.isLoggedIn.bind(app),
        isCartEmpty         : cart.isCartEmpty.bind(cart),
        getsSpecialOffer    : cart.getsSpecialOffer.bind(cart),
        whichItemMissing    : cart.getMissingItem.bind(cart)
    }
}
```

As Turbine steps through each query in your workflow, it looks for a corresponding function defined in `initObj.queries`. If found, the query function is executed. The return value tells Turbine which response to process.

Defining query functions here promotes decoupling of your workflow from the rest of your app. The functions don't need to know anything about the workflow or how all the pieces of the app fit together -- they just need to be able to return a valid response, and Turbine (along with your workflow) does the rest.

#### Function references

It's important to note that the functions in `initObj.queries` are just references -- they are not actually called here. You can see this most clearly with the `isFoo : someGlobalFunction` example. Notice that `someGlobalFunction` does not have parentheses after it. That's what makes it a reference instead of an executed function.

#### Binding functions

So what's this `bind` stuff at the end of the other functions? In a nutshell, `bind` tells the function what the scope of `this` should be when it's used inside the function. 

`bind` is actually a [feature](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind) of the Function prototype in ECMAScript 5 (JavaScript 1.8.5), and is supported by all modern browsers. In other words, everything but IE8. 

Never fear though ... Turbine includes an implementation of `bind`, so you can use it even in browsers that don't technically support it.

**To ensure that your function is always being called with `this` scoped correctly, you should always use `bind` when defining your query functions.**

---

### responses

*[OBJECT] Contains default responses to workflow queries.*

The `responses` object is a collection of key:value pairs. Each key is the name of a query that appears in your workflow; each corresponding value is the default response for that query.

For example:

```javascript
var initObj = {
    
    responses : {
        isCartEmpty         : true,
        whichItemMissing    : 'playstation'
    }
}
```

Responses are `false` by default, so `initObj.responses` is your chance to define a non-false default response for a query.

When Turbine is instantiated, it imports these default responses. If no query function is defined in `initObj.queries`, and the response isn't explicitly set in your app via the `setResponse()` method, then the value from `initObj.responses` is used.

---

### resets

*[OBJECT] Contains functions or values used to reset query responses when rewinding a workflow*

The `resets` object is a collection of key:value pairs. Each key is the name of a query that appears in your workflow; each corresponding value is either a function or a value to use when rewinding the workflow.

For example:

```javascript
var initObj = {
    
    resets : {
        isCartEmpty         : cart.isCartEmpty.bind(cart),
        isCheckoutStarted   : true
    }
}
```

Sometimes Turbine executes a query response that requires it to go backwards in the workflow, to an earlier query. For example, a user may get several steps through a checkout process, then decides to backtrack a few steps to remove a product from the cart.

When this happens, it may be necessary to reset some of the responses that are being rewound. For example, if a user is on Step 4 of the checkout, and wants to go back to Step 2, you may need to reset the value of a `isStepThreeComplete` query to false.

To do this you could either set `initObj.resets.isStepThreeComplete = false`, or your could set it to a function to be  called to determine the reset value, i.e. `initObj.resets.isStepThreeComplete = app.isStepThreeComplete.bind(app)`.

If no reset for a query is defined in `initObj.resets`, then the response is not reset during a rewind.

---

### init

*[FUNCTION] Initialization function called at the end of the Turbine constructor*

The `init` function is an optional function that can be defined to be called once Turbine's constructor is complete. It is passed one argument: the Turbine instance that was just instantiated. This might be useful if you want your app to wait for Turbine to be fully instantiated before doing something.

---

### log

*[FUNCTION] Custom logging function*

By default, Turbine outputs all its logs via the standard `console` methods: `log`, `warn`, and `error`. If you would rather send the logs to some other function, you can define it here and Turbine will use that instead.

Note that log messages are only output by the non-minified Turbine.js. Logging is stripped out of the minified version to reduce file size.

---

### publish 

*[FUNCTION] Function to use when publishing events*

By default, Turbine will use `jQuery.trigger()` to publish events. If you would rather use some other event publishing method, such as `Backbone.Events.trigger()`, you can define that method here.

Turbine will pass your `publish` method two arguments: 

* `message` *[String] Event to publish*
* `payload` *[Object] Optional data object*

Your events library may not be expecting those arguments, or in that order, so you may have to wrap your library's function in your own function that translates those arguments into something your library understands.

For example, maybe your fictional PubSub library requires a single object literal defining `event` and `data` instead of two arguments for `message` and `payload`. Then you might wrap it like this:

```javascript
var initObj = {
    
    publish : function(message,payload){
        
        yourPubSub.trigger({
            event : message,
            data : payload
        });
    }
}
```

---

### listen 

*[FUNCTION] Function to use when listening for events*

By default, Turbine will use `jQuery.on()` to listen for events. If you would rather use some other event listener, such as `Backbone.Events.on()`, you can define that method here.

Turbine will pass your `listen` method two arguments: 

* `message` *[String] Event to listen for*
* `handler` *[Function] Function to call when event is triggered*

When the `handler` is triggered, it will be passed two arguments:

* `message` *[String] Event that triggered the handler*
* `payload` *[Object] Optional data object*

Like `publish`, you may need to wrap your own event listener method in a custom function to translate these arguments into something your listener understands.

---

### remove 

*[FUNCTION] Function to use when removing event listeners*

By default, Turbine will use `jQuery.off()` to remove listeners. If you would rather use some other event library, such as `Backbone.Events.off()`, you can define that method here.

Turbine will pass your `remove` method one argument: 

* `message` *[String] Event for which listeners should be removed*

Like `publish` and `listen`, you may need to wrap your own method in a custom function to translate these arguments into something your listener understands.

---

### report

*[FUNCTION] Function to use when reporting errors or events*

By default, Turbine will report any internal errors to the browser console via `console.error()`. 

If you'd rather have issues reported through some event logging or analytics system, you can define your own custom `report` function here.

Turbine will pass your `report` method one argument: 

* `obj` *[Object] Data object*

If an internal Turbine issue is being reported, this object will contain two properties:

* `handle` Short string identifying the issue (WORKFLOW_ISSUE_REPORTED is the default)
* `description` Human-readable description of the issue

The `report` function isn't just for errors though -- it can be used in the workflow to report any arbitrary event or activity. In this case, the data object passed to `report` is entirely defined in your workflow.

For example, say you have a `isUserBanned` query in your workflow. When a banned user tries to access your app, you want to report that activity to a security monitor. You might have this in your workflow:

```javascript

var workflow = {
    
    queries : {
        
        isUserBanned : {
            
            yes : {
                report : {
                    errorType : 'FATAL'
                    handle : 'BANNED_USER_LOGIN',
                    description : 'A banned user tried to log into the site',
                    username : app.getUserName()
                    timestamp : new Date().getTime()
                },
                then : 'stop.'
            },
            
            no : {
                then : 'isUserLoggedIn'
            }
        }
    }
};
```

Your `report` function would be passed whatever is defined in the workflow. You can then use that data to report the issue however your system requires.

.

## Building a workflow

### Config

#### Shortcuts

#### Variables

#### Always

* timeout
* waitFor

### Mixins

### Queries

#### Responses
Responses can be set two ways: via query functions in `initObj.queries`, or via the `setResponse()` method.
* yes
* no
* *values*
* default

#### Each response

* publish
  * message
  * using
* waitFor
* then
  * stop.
  * kill!
* repeat
  * limit
  * publish
  * waitFor
  * then
* report
* timeout
  * after
  * publish
  * then
* delay
  * for
  * publish
  * then

## Examples

## API

---
### start()
---
### isStarted()
---
### stop()
---
### getConfigVar(varName)
---
### setResponse(query, response)
---

## FAQ

### Chaining/nesting workflows?
### Using bind?

## Questions? Bugs? Suggestions?

Please submit all bugs, questions, and suggestions via the [Issues](https://github.com/wmbenedetto/turbine.js/issues) section so everyone can benefit from the answer.

If you need to contact me directly, email warren@transfusionmedia.com.

## MIT License

Copyright (c) 2012 Warren Benedetto <warren@transfusionmedia.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Turbine

Turbine is a JavaScript workflow engine. It vastly simplifies the development, deployment, and testing of complex web applications through the use of declarative workflows that express your app's program logic in a form that is simple to read and to understand.

## Why Turbine?

Turbine is the ideal solution for apps (or parts of apps) with multi-step processes involving many possible branches, sub-flows, or permutations. If your application logic requires a Visio flow diagram to explain it, then Turbine may be right for you. 

In fact, a good way to think of Turbine is as a linear expression of a flow diagram.

Examples include:

* Signup forms
* Login forms
* Interactive tours
* Shopping carts
* Checkout flows
* Asset creation (i.e. upload photo -> add filter -> add caption -> tag friends -> share)
* etc.

The programming of these types of apps can often create a tangled nightmare of conditionals, switches, callbacks, promises, and other strands of spaghetti code. 

This tightly coupled code makes it almost impossible to A/B/n test different flows or variations -- any attempt to do so usually makes the problem even worse. It is also very difficult to follow the program logic to trace all the possible flows through the code.

The end result is code which is dense, brittle, untestable, obtuse, and just plain gross.

Turbine was written to solve these problems by taking the program logic of complex apps and abstracting it out into a simple document (the *workflow*) which is easy to read and understand. 

## Quick install

Turbine is available via a number of popular package managers:

### NPM

```
npm install turbine.js
```

### JamJS
```
jam install turbine.js
```

### Bower
```
bower install turbine.js
```

Or you can download the latest tag from https://github.com/wmbenedetto/turbine.js/tags

## Key concepts

In order to use Turbine, it's important to first define some key concepts. Once we have a common vocabulary and general conceptual understanding established, we can then begin talking about how you can use Turbine to power your app.

### Sequence

The simplest form of workflow is a sequence. A sequence is simply a series of linear steps, executed in order. There's no complex branching logic involved. The flow diagram is a straight line.

For sequences, the relationship between Turbine and your app is like one between a general and a soldier. Turbine tells your app what to do, your app lets Turbine know then it's done, and Turbine tells it what to do next. The instructions bounce back and forth like this until the sequence is complete.

For example, your app may have a simple "Get Started" tour that introduces users to a few new features. The flow might go something like this.

>**Turbine:** Show Step One of the tour. Let me know when the user clicks Next.
> 
>*Your app displays Step One of the tour. The user clicks the Next button.*
>
>**Your app** Sir! The user clicked Next, sir! 
>
>**Turbine** Good. Show Step Two. Let me know when the user clicks Next.
>
>*Your app displays Step Two of the tour. The user clicks the Next button.*
>
>**Your app** Sir! The user clicked Next, sir! 
>
>**Turbine** Excellent. Show Step Three. Let me know when the user clicks Next.
>
>*Your app displays Step Three of the tour. The user clicks the Next button.*
>
>**Your app** Sir! The user clicked Next, sir! 
>
>**Turbine** Nice work, solider! We're done here!

A sequence is defined as an array of object literals called "action objects". Let's take a look at how the conversation above is expressed as a sequence.

```javascript
var workflow = [
    {
        publish : {
            message : 'Tour.stepOne.show'
        },
        waitFor : 'Tour.button.clicked.NEXT',
        then : '@next'
    },
    {
        publish : {
            message : 'Tour.stepTwo.show'
        },
        waitFor : 'Tour.button.clicked.NEXT',
        then : '@next'
    },
    {
        publish : {
            message : 'Tour.stepThree.show'
        },
        waitFor : 'Tour.button.clicked.NEXT',
        then : 'stop.'
    }
];
```
With a few comments added, we can see how the conversation flows between Turbine and your app: 

```javascript
var workflow = [
    {
        // Turbine: Show Step One of the tour.
        publish : {
            message : 'Tour.stepOne.show'
        },
        // Turbine: Let me know when the user clicks Next.
        waitFor : 'Tour.button.clicked.NEXT',

        // Your app is listening for a Tour.stepOne.show message. It knows to handle
        // that by displaying the first screen of the tour. The user clicks a Next button.
        // This publishes a Tour.button.clicked.NEXT message. Which is equivalent to:
        //
        // Your app: Sir! The user clicked Next, sir!
        // 
        // Via the @next shortcut, Turbine moves onto its next directive.
        then : '@next'
    },
    {
        // Turbine: Show Step Two of the tour.
        publish : {
            message : 'Tour.stepTwo.show'
        },
        // Turbine: Let me know when the user clicks Next.
        waitFor : 'Tour.button.clicked.NEXT',
    
        // Your app is listening for a Tour.stepTwo.show message. It knows to handle
        // that by displaying the second screen of the tour. The user clicks a Next button.
        // This publishes a Tour.button.clicked.NEXT message. Which is equivalent to:
        //
        // Your app: Sir! The user clicked Next, sir!
        // 
        // Via the @next shortcut, Turbine moves onto its next directive.
        then : '@next'
    },
    {
        // Turbine: Show Step Three of the tour.
        publish : {
            message : 'Tour.stepThree.show'
        },
        // Turbine: Let me know when the user clicks Next.
        waitFor : 'Tour.button.clicked.NEXT',

        // Your app is listening for a Tour.stepThree.show message. It knows to handle
        // that by displaying the third screen of the tour. The user clicks a Next button.
        // This publishes a Tour.button.clicked.NEXT message. Which is equivalent to:
        //
        // Your app: Sir! The user clicked Next, sir!
        // 
        // Via the stop. query, Turbine knows that the sequence is complete
        
        // Turbine: Nice work, solider! We're done here!
        then : 'stop.'
    }
];
```

### Workflow

The workflow is the jet fuel that powers Turbine. It's an expressive syntax for defining the program flow of your application. It allows you to define all the logical branching of your app in a single document, in a format that is both human- and machine-readable. 

Turbine workflows are declarative -- they are only concerned with *what* your app does, not *how* it does it. Although workflows are written in JavaScript, they should not contain any functional logic. They should be serializable to JSON -- and deserializable from JSON --  without any ill effects.

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

Now let's look at the same conversation expressed as a workflow:

```javascript
var workflow = {
    
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

### Actions

Actions tell Turbine what to do when a particular response has been received.

Actions are defined as object literals, with a variety of special properties that Turbine can execute.

In the example below, `canAttemptLogin` is the query, `yes` is the response, and the object literal that is the value of the `yes` property is the action.

```javascript
var workflow = {
            
    canAttemptLogin : {
        yes : {
            publish : {
                message : 'LoginForm.show'
            },
            waitFor : 'LoginForm.submit',
            then : 'isLoginValid'
        }
    }
}
```
Because the bulk of Turbine's functionality is contained in actions, we'll wait a little longer before delving deeper into what properties an object can contain. If you're curious, you can jump ahead to the [Elements of a workflow](#elements-of-a-workflow) section for more info.

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
    workflow    : {}, // array (sequence) or object literal (workflow)           
    
    // OPTIONAL
    name        : '',           
    logLevel    : '',           
    queries     : {},          
    responses   : {},           
    resets      : {},
    shortcuts   : {},
    variables   : {},
    mixins      : {},
    always      : {},
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

*[ARRAY or OBJECT] Defines the control flow of your application*

The workflow is the jet fuel that powers Turbine. It tells your app what to do, and where to go next after doing it.

Since workflows are a whole topic unto themselves, see the [Elements of a workflow](#elements-of-a-workflow) section for more details.

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

*[OBJECT] Functions used to resolve queries and return responses.*

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

*[OBJECT] Default responses to workflow queries.*

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

*[OBJECT] Functions or values used to reset query responses when rewinding a workflow*

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

### shortcuts

*[OBJECT] Aliases for workflow queries*

Shortcuts are a way for you to reference a query by an alias instead of using it directly. This creates greater flexibility in your workflow by decoupling intention from expression. The shortcut name can be any arbitrary string, and you can define as many shortcuts as you want.

For example, say you sometimes want your workflow to go back to the beginning of the checkout process based on some query response. You can define a `checkout` shortcut like this:

```javascript
var initObj = {
    
    shortcuts : {
        checkout : 'isCheckoutStarted'
    }
}
```

To use the shortcut in your workflow, you would **reference it with an @ symbol**, like `@checkout`:

```javascript
workflow : {
    
    isCheckoutStarted : {
        yes : {
            then : 'isCheckoutCancelled'
        },
        no : {
            // do stuff
        }
    },
    
    isCheckoutCancelled : {
        yes : {
            then : '@checkout'
        },
        no : {
            // do stuff
        }
    }
}
```

By using the shortcut, your workflow doesn't need to know which query is the starting query -- it just needs to know to go back to the query defined by `@checkout`. 

If, in the future, you add additional queries to the beginning of your checkout flow, you only need to change the definition of the `checkout` shortcut in the config.

#### Special shortcuts

You can use any arbitrary string for a shortcut name, with the exception of a few that have special meanings: 

* **@start** If you define a `start` shortcut in your `initObj`, Turbine will automatically use that as the first query to execute when Turbine is started.
* **@next** When defining a sequence, the `@next` shortcut tells Turbine to execute the next step in the sequence. There is no need to define `@next` in your `initObj`.

---

### variables

*[OBJECT] Keys representing scalar values (string, boolean, numeric, null)*

As you might expect, variables in Turbine work just like those in any programming language: the variable is replaced with the value defined in the config. 

```javascript
var initObj = {
    
    variables : {
        cartTimeout : 36000
    }
}
```

To use the variable in your workflow, you would **reference it with an $ symbol**, like `$cartTimeout`:

```javascript
workflow : {
    
    isCheckoutStarted : {
        yes : {
            timeout : {
                after : '$cartTimeout',
                then : {
                    publish : 'Cart.timeout.expired',
                    then : 'stop.'
                }
            }
        },
        no : {
            // do stuff
        }
    }
}
```

The one caveat is that variables can only be used for string, boolean, numeric, or null values. If you want a variable-like way to represent object literals, use a mixin instead.

---

### mixins

*[OBJECT] Keys representing object literals*

A mixin is basically a variable representing an object literal. Mixins are replaced recursively, so you can use mixins within mixins. You can also use variables and shortcuts within mixins.

```javascript
var initObj = {
    
    mixins : {
        invalidLogin : {
            publish : {
                message : 'Cart.login.failed'
            }
        }
    }
}
```

To use the mixin in your workflow, you would **reference it with a + symbol**, like `+invalidLogin`:

```javascript
workflow : {
    
    whichError : {
        USERNAME_NOT_FOUND : '+invalidLogin',
        PASSWORD_INCORRECT : '+invalidLogin',
        CAPTCHA_INCORRECT  : '+invalidLogin'
    }
}
```

When Turbine imports your workflow, it replaces the mixins like this:

```javascript
workflow : {
    
    whichError : {
        USERNAME_NOT_FOUND : {
            publish : {
                message : 'Cart.login.failed'
            }
        },
        PASSWORD_INCORRECT : {
            publish : {
                message : 'Cart.login.failed'
            }
        },
        CAPTCHA_INCORRECT  : {
            publish : {
                message : 'Cart.login.failed'
            }
        }
    }
}
```

For a more complex implementation of mixins, see the example app in the /examples directory.

---

### always

*[OBJECT]*

The `always` object is a way to define things that should be added to every query that is executed. This saves you from needing to duplicate the same code over and over. 

```javascript
var initObj = {
    
    always : {
        timeout : {},
        waitFor : [],
        using   : {}
    }
}
```

#### timeout  
The `timeout` property allows you to define a global timeout for the entire workflow. 

For example, you may want to ask the user if they're still there when there has been no activity for a few minutes. Or you may want to raise an error if you app has become unresponsive for some reason. The format of the `timeout` property is the same as when  `timeout` is defined in an action object (see [docs](#timeout-1) below).

```javascript
timeout : {
    after : 300000,
    then : {
        publish : {
            message : "Cart.issue.detected.GLOBAL_TIMEOUT"
        },
        then : "stop."
    }
},
```

#### waitFor
The `waitFor` property defines messages for which to listen, as well as an optional `then` that tells the workflow where to go when a message is received. Whenever your app is waiting for messages, these global `waitFor` messages will be listened for as well.

The format of the `waitFor` property is the same as when `waitFor` is defined in an action object (see [docs](#waitfor-1) below).

#### using

The `using` property is an object literal that will be merged with the `using` property whenever a message is published from Turbine.

```javascript
using : {
    timestamp : new Date().getTime()
}
```

```javascript
workflow : {
    isAppStarted : {
        yes : {
            publish : {
                message : 'Cart.app.started',
                using : {
                    storeName : 'My Store'
                }
            }
        },
        no : {
            // do stuff
        }
    }
}
```

When this workflow runs and the `yes` response to `isAppStarted` is executed, Turbine will publish the `Cart.app.started` message. The message payload will be an object containing `storeName`, as well as `timestamp` from the global `using` object.

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

* `message`  *[String] Event to publish*
* `payload`  *[Object] Optional data object*
 
Your events library may not be expecting those arguments, or in that order, so you may have to wrap your library's function in your own function that translates those arguments into something your library understands.

For example, maybe your fictional PubSub library requires a single object literal defining `event` and `data` instead of two arguments for `message` and `payload`. Then you might wrap it like this:

```javascript
var initObj = {
    
    publish : function(message,payload,callback){
        
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

* `message` *[String or Array] Event(s) to listen for*
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

* `message` *[String or Array] Event(s) for which listeners should be removed*

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
};
```

Your `report` function would be passed whatever is defined in the workflow. You can then use that data to report the issue however your system requires.

.

## Elements of a workflow

A workflow is an array (for a sequence) or an object literal defined in the init object passed to the Turbine constructor. It is the only mandatory property of the init object.

The workflow is essentially a dialog between Turbine and your app. Turbine executes a **query** and receives a **response**. That response tells Turbine which action object to execute, which in turn tells Turbine which query to execute next.

```javascript
isUserLoggedIn : {
    yes : {
        // do something
    },
    no : {
        // do something different
    }
}
```

In this example:

* `isUserLoggedIn` is the **query**
* `yes` and `no` are the **responses**
* The object literal values of the `yes` and `no` responses are the **action objects**

---

### Queries

When Turbine starts your workflow, it begins with the first query in the workflow (or the `@start` shortcut, if defined).

To get the response to the query, Turbine checks a few things:

* Has a query function been set in `initObj.queries`? If so, Turbine executes the function and processes its response.
* If there's no query function, has a response been set using `Turbine.setResponse()`? If so, Turbine uses that value.
* If no response has been set, has any default response been set in `initObj.responses`? If so, Turbine uses that value.
* If none of the above exist, then Turbine returns false and processes the "no" response.

---

### Responses

Responses can be boolean, strings, or numbers. If a response is boolean, true is converted to "yes" and false is converted to "no". In addition, null and undefined responses are also converted to "no".

A query's responses work similiarly to a JavaScript switch/case statement. If the value of the query's response matches any of the responses in the workflow, that response is processed.

In addition, there is the special **default** response. If `default` is defined, and the query's response doesn't match any of the responses defined in the workflow, Turbine will use the `default` response. 

```javascript
whichError : {
    INVALID_EMAIL : {
        // display invalid email error
    },
    INVALID_USERNAME : {
        // display invalid username error
    },
    default : {
        // display generic error
    }
}
```

In this example, if the `whichError` query doesn't return either INVALID_EMAIL or INVALID_USERNAME, then the default response will be processed.

---

### Actions

Once a query has been executed and a response has been received, Turbine needs to know what to do next. This is expressed in an action object.

We'll get into details about all the things that can go into actions in a minute. For now, let's just focus on the most important property: `then`. 

#### then

At its simplest, the `then` property tells Turbine which query to execute next. When you see it in context, it's pretty self-explanatory:

```javascript
isUserLoggedIn : {
    yes : {
        then : 'isUserOver18'
    },
    no : {
        then : 'doesAccountExist'
    }
},

isUserOver18 : {
    yes : {
        // let the user in
    },
    no : {
        // don't let the user in
    }
},

doesAccountExist : {
    yes : {
        // make the user log in
    },
    no : {
        // ask the user to create an account
    }
}
```

Turbine's expressive workflow syntax makes it simple to see how the program will flow. For example:

* Is the user logged in? Yes. Is the user over 18? Yes. Then let him in.
* Is the user logged in? No. Does an account exist? No. Then ask the user to create one.
* Is the user logged in? No. Does an account exist? Yes. Then ask the user to log in.
* And so on ...

##### `then` is always required (except when it's not)

Because `then` tells your workflow where to go next, it is required for every action object.

(There's a slight caveat to that rule when using the `repeat` or `delay` property -- more on that later.)

If you leave `then` out, your app will basically freeze -- Turbine will get to the response that has no `then` in the action object, and it won't know where to go from there. Instead, it will throw an exception.

##### Special values : `stop.` and `kill!`

Of course, there will be times where your workflow really has no place else to go. In this case, you can set the value of `then` to either `stop.` or `kill!`. Using these special values allows your workflow to clearly indicate that it intends to stop.

Setting `then` to `stop.` tells Turbine to stop. There are no ill effects -- you can restart Turbine later using `start()`, and it will start over from the beginning of the workflow.

Setting `then` to `kill!` not only tells Turbine to stop, but it also prevents it from being started again. If you call `start()` after using `kill!`, Turbine will simply report an error.

*Note that both `stop.` and `kill!` include punctuation -- that's required in order for Turbine to recognize them as special values.*

Continuing to flesh out the example above, we can add `stop.` to `isUserOver18.no`:

```javascript
isUserLoggedIn : {
    yes : {
        then : 'isUserOver18'
    },
    no : {
        then : 'doesAccountExist'
    }
},

isUserOver18 : {
    yes : {
        // let the user in
    },
    no : {
        // don't let the user in
        then : 'stop.'
    }
},

doesAccountExist : {
    yes : {
        // make the user log in
    },
    no : {
        // ask the user to create an account
    }
}
```

##### Advanced `then` usage

There are more complex usages of `then`, but it's hard to explain without first understanding more details about how workflows work. Let's table the idea for a while. We'll come back to it in a minute.

---

### Action sequences

Sometimes, you may want to execute a sequence of actions in response to a single query. To do this, you can define a response's action as a sequence: an array of action objects.

Just like with sequence workflows, the `then` property can be set to the special shortcut `@next` to tell Turbine to execute the next action in the sequence.

```javascript
doesAccountExist : {
    yes : {
        // make the user log in
    },
    // Because the value of the no property is an array, Turbine knows it's a sequence
    no : [
        {
            publish : {
                message : 'App.view.show.SIGNUP'
            },
            then : '@next'
        },
        {
            publish : {
                message : 'App.background.update.N00B'
            },
            then : '@next'
        },
        {
            publish : {
                message : 'App.header.hide'
            },
            then : 'stop.'
        }
    ]
}
```
---

### Action object properties

In addition to `then`, there are a number of other properties that can be defined in an action object. Together, these properties tell Turbine what to do when it receives a particular response.

#### publish

Turbine is an event-driven workflow engine, so it communicates with your app by publishing messages from the workflow using the `publish` function defined in your initObj, or `jQuery.trigger()` by default.

To tell Turbine to publish a message, you define a `publish` object in the action object. This object has two properties: 

* `message` *[String or Array] The message to publish, or an array of messages to publish*
* `using` *[Object] Optional data object to accompany published message*

Let's publish some messages in our example:

```javascript
isUserLoggedIn : {
    yes : {
        then : 'isUserOver18'
    },
    no : {
        then : 'doesAccountExist'
    }
},

isUserOver18 : {
    yes : {
        // let the user in
        publish : {
            message : 'App.view.show',
            using : {
                view : 'loginAccepted',
                content : 'ENTRY_ACCEPTED'
            }
        },
        then : 'stop.'
    },
    no : {
        // don't let the user in
        publish : {
            message : [
                'User.age.rejected', 
                'App.view.show'
            ],
            using : {
                view : 'loginRejected',
                content : 'NOT_OLD_ENOUGH'
            }
        }
        then : 'stop.'
    }
},

doesAccountExist : {
    yes : {
        // make the user log in
        publish : {
            message : 'App.view.show',
            using : {
                view : 'logIn'
            }
        }
    },
    no : {
        // ask the user to create an account
        publish : {
            message : 'App.view.show',
            using : {
                view : 'createAccount'
            }
        }
    }
}
```

Of course, publishing a message doesn't do much if there's nothing listening for it in your app. The expectation is that when your workflow publishes `App.view.show`, your app is listening for that message. Your app can then use the values from the `using` object to determine which view to show, and which content to use when showing it.

---

#### waitFor

In the `isUserOver18` query above, both responses have `then : 'stop.'` in their action objects. In those cases, after the workflow publishes its message, it's done. There's nothing left to do after the appropriate view is shown.

But what about in the `doesAccountExist` query? We want the user to either log in or create an account, so we published an `App.view.show` message from your workflow, your app was listening for it, it showed the view ... now what?

We need a way for the app to tell Turbine that it is done doing whatever it needed to do. For that, we use `waitFor`.

The `waitFor` property accepts either a message or array of messages for which Turbine should listen. Once Turbine receives a message it's waiting for, it continues where it left off, going wherever the `then` property tells it to go.

Let's add some `waitFor` and `then` properties to the `doesAccountExist` action objects. We'll also need to add two new queries: `isLoginValid` and `isAccountValid`:

```javascript
isUserLoggedIn : {
    yes : {
        then : 'isUserOver18'
    },
    no : {
        then : 'doesAccountExist'
    }
},

isUserOver18 : {
    yes : {
        // let the user in
        publish : {
            message : 'App.view.show',
            using : {
                view : 'loginAccepted',
                content : 'ENTRY_ACCEPTED'
            }
        },
        then : 'stop.'
    },
    no : {
        // don't let the user in
        publish : {
            message : [
                'User.age.rejected', 
                'App.view.show'
            ],
            using : {
                view : 'loginRejected',
                content : 'NOT_OLD_ENOUGH'
            }
        }
        then : 'stop.'
    }
},

doesAccountExist : {
    yes : {
        // make the user log in
        publish : {
            message : 'App.view.show',
            using : {
                view : 'logIn'
            }
        },
        waitFor : 'App.login.submitted',
        then : 'isLoginValid'
    },
    no : {
        // ask the user to create an account
        publish : {
            message : 'App.view.show',
            using : {
                view : 'createAccount'
            }
        },
        waitFor : 'App.account.created',
        then : 'isAccountValid'
    }
},

isLoginValid : {
    yes : {
        then : 'isUserOver18'
    },
    no : {
        // show login error
    }
},

isAccountValid : {
    yes : {
        then : 'isUserOver18'
    },
    no : {
        // show login error
    }
}
```

Let's assume our user has an account, so we showed him a login form. When that form is submitted, your app publishes a `App.login.submitted` message. Since Turbine is waiting for that message, it follows then `then` property to `isLoginValid`.

##### Different `then` options

Sometimes you might want your app to execute a different query depending on which `waitFor` message it receives. To do this, you can specify `waitFor` as an object or array of objects containing two properties:

* `message` *[String or Array] The message to wait for, or an array of messages to wait for*
* `then` *[String] Query to execute when one of the messages is received*

For example:

```javascript
isAgeGateRequired : {
    yes : {
        publish : {
            message : 'App.view.show',
            using : {
                view : 'ageGate',
                content : 'Are you over 18?'
            }
        },
        waitFor : [
            {
                message : ['App.button.clicked.YES','App.button.clicked.NO'],
                then : 'isOldEnough'
            }
            {
                message : 'App.button.clicked.HELP',
                then : 'isHelpLoaded'
            }
        ]
    },
    no : {
        // do stuff
    }
},

isOldEnough : {
    yes : {
        // let them in
    },
    no : {
        // don't let them in
    }
}

isHelpLoaded : {
    yes : {
        // show Help
    },
    no : {
        // load Help
    }
}
```

If you specify a `then` to accompany a `waitFor` message, it will **override** any `then` that is specified outside `waitFor`. 

```javascript
isAgeGateRequired : {
    yes : {
        publish : {
            message : 'App.view.show',
            using : {
                view : 'ageGate',
                content : 'Are you over 18?'
            }
        },
        waitFor : [
            {
                message : ['App.button.clicked.YES','App.button.clicked.NO'],
                then : 'isOldEnough'
            },
            {
                message : 'App.button.clicked.HELP',
                then : 'isHelpLoaded'
            }
        ],
        then : 'isLoggedIn' 
    },
    no : {
        // do stuff
    }
}
```

In the example above, `isLoggedIn` will never be executed, because each `waitFor` message has its own `then` property.

However, if you don't specify a `then` to accompany a `waitFor` message, the `then` that is specified outside `waitFor` will be used. 

```javascript
isAgeGateRequired : {
    yes : {
        publish : {
            message : 'App.view.show',
            using : {
                view : 'ageGate',
                content : 'Are you over 18?'
            }
        },
        waitFor : [
            {
                message : ['App.button.clicked.YES','App.button.clicked.NO']
            }
            {
                message : 'App.button.clicked.HELP',
                then : 'isHelpLoaded'
            }
        ],
        then : 'isOldEnough' 
    },
    no : {
        // do stuff
    }
}
```

In the example above, the `App.button.clicked.YES` and `App.button.clicked.NO` will execute `isOldEnough` next, whereas `App.button.clicked.HELP` will execute `isHelpLoaded`. 

While this approach technically will work, it is not recommended -- if you're using multiple `then` options, then each `waitFor` message really should have its own `then`, for clarity's sake.

---

#### Advanced `then` options

Now that we understand a little more about publishing and waiting for message, we can revisit `then` to see how we can use it in more advanced ways.

##### Nested `then` actions

While the simplest use of `then` is to tell Turbine which query to execute next, that may not always make sense in the context of your application. 

For example, what if you don't have a query to execute? What if you just want Turbine to do something without querying your app every time? To do that, you can actually assign additional action objects to the `then` property.

Let's take another look at the `doesAccountExist` query. The original `no` response assumes that the app will be showing a single `createAccount` view.

```javascript
doesAccountExist : {
    yes : {
        // make the user log in
    },
    no : {
        // ask the user to create an account
        publish : {
            message : 'App.view.show',
            using : {
                view : 'createAccount'
            }
        },
        waitFor : 'App.account.created',
        then : 'isAccountValid'
    }
}
```

But what if the account creation process is a multi-step process? *Without* nesting `then` actions, it might look like this:

```javascript
doesAccountExist : {
    yes : {
        // make the user log in
    },
    no : {
        // show the first step of the signup process
        publish : {
            message : 'App.view.show',
            using : {
                view : 'stepOne'
            }
        },
        waitFor : 'App.stepOne.complete',
        then : 'isStepOneComplete'
    }
},
isStepOneComplete : {
    yes : {
        // show the second step of the signup process
        publish : {
            message : 'App.view.show',
            using : {
                view : 'stepTwo'
            }
        },
        waitFor : 'App.stepTwo.complete',
        then : 'isStepTwoComplete'
    }
},
isStepTwoComplete : {
    yes : {
        // show the third step of the signup process
        publish : {
            message : 'App.view.show',
            using : {
                view : 'stepThree'
            }
        },
        waitFor : 'App.stepThree.complete',
        then : 'isAccountValid'
    }
}
```

Ugh. That's really inefficient. We're waiting for a message to say a step is complete, we get that message, then we have to immediately query the app to see if the step is complete. Why?! We already know it's complete. The message just told us.

Instead, let's get right to the action. Literally. 

Instead of defining `then` as a string referencing the next query to execute, you can instead define it as an action object. That action object can itself contain a `then` property, which can also be defined as an action object, and so on. 

This allows you to immediately execute the next action(s), instead of requiring an unnecessary roundtrip to query your app.

```javascript
doesAccountExist : {
    yes : {
        // make the user log in
    },
    no : {
        // show the first step of the signup process
        publish : {
            message : 'App.view.show',
            using : {
                view : 'stepOne'
            }
        },
        waitFor : 'App.stepOne.complete',
        then : {
            // show the second step of the signup process
            publish : {
                message : 'App.view.show',
                using : {
                    view : 'stepTwo'
                }
            },
            waitFor : 'App.stepTwo.complete',
            then :  {
                // show the third step of the signup process
                publish : {
                    message : 'App.view.show',
                    using : {
                        view : 'stepThree'
                    }
                },
                waitFor : 'App.stepThree.complete',
                then : 'isAccountValid'
            }
        }
    }
}
```

##### `then` sequences

Nested `then` actions are nice if you don't have too many actions to nest. However, once you get past 3-4 consecutive actions, the nesting can be kind of obnoxious. In cases like that, you can also define `then` as a sequence of actions.

```javascript
doesAccountExist : {
    yes : {
        // make the user log in
    },
    no : {
        
        then : [
            // show the first step of the signup process
            {
                publish : {
                    message : 'App.view.show',
                    using : {
                        view : 'stepOne'
                    }
                },
                waitFor : 'App.stepOne.complete',
                then :  '@next'
            },
            // show the second step of the signup process
            {
                publish : {
                    message : 'App.view.show',
                    using : {
                        view : 'stepTwo'
                    }
                },
                waitFor : 'App.stepTwo.complete',
                then :  '@next'
            },
            // show the third step of the signup process
            {
                publish : {
                    message : 'App.view.show',
                    using : {
                        view : 'stepThree'
                    }
                },
                waitFor : 'App.stepThree.complete',
                then :  'isAccountValid'
            }
        ]
    }
}
```
---

#### repeat

Sometimes you may want to repeat the same query over and over again, such as when you are polling a server for a particular response. To do this, you can add a `repeat` object in the action object. 

The `repeat` object is used in lieu of `then` -- by using `repeat`, you are implicitly saying "execute this query, *then* execute this query again".

The `repeat` object contains one required property:

* `limit` *[Number or null] The maximum times the query will be repeated. If null, the query will repeat infinitely.*

In addition, unless the limit is `null`, the `repeat` object should contain a `then` property. This tells Turbine what to do once the limit has been reached. The `then` can either point to the next query to be executed, or it can contain an action object of its own.

```javascript
isUploadComplete : {
    no : {
        waitFor : 'App.upload.updated',
        repeat : {
            limit : 100,
            then : {
                publish : {
                    message : 'App.upload.failed',
                    using : {
                        reason : 'UPLOAD_CHECK_LIMIT_EXCEEDED'
                    }
                },
                then :  'stop.'
            }
        }
    },
    yes : {
        // display Done message
    }
}
```

In the example above, Turbine waits for an `App.upload.updated` message. When it gets one, it repeats the `isUploadComplete` query. If the response is still `no`, then it again waits for `App.upload.updated`.

This continues until `isUploadComplete` is `yes`, or the query repeats 100 times. If the limit is reached, then Turbine executes the `then` property, publishing `App.upload.failed` and then stopping.

---

#### timeout

One of the drawbacks of an event-driven workflow engine is that if it's waiting for a message that never comes, it is basically stuck. To help avoid that situation, a `timeout` object is available.

The `timeout` object allows you to specify an alternate action object to process after a certain amount of time elapses. It contains one required property:

* `after` *[Number] The number of milliseconds after which the timeout will fire*

In addition, the `timeout` object should contain a `then` property. This tells Turbine what to do once the timeout has been exceeded. The `then` can either point to the next query to be executed, or it can contain an action object of its own.

```javascript
isTransactionComplete : {
    no : {
        waitFor : 'App.transaction.completed',
        then : 'isTransactionComplete',
        timeout : {
            after : 300000,
            then : {
                publish : {
                    message : 'App.transaction.failed',
                    using : {
                        reason : 'TIMEOUT_EXCEEDED'
                    }
                },
                then :  'stop.'
            }
        }
    },
    yes : {
        // display Done message
    }
}
```

In the example above, Turbine is waiting for an `App.transaction.complete` message. If it doesn't receive it after 300000 milliseconds (5 mins), it publishes an `App.transaction.failed` message, then stops.

Notice that the `no` action object still has its own `then` value -- that is required so Turbine knows where to go if it *does* receive the `App.transaction.complete` message before the timeout.

---

#### delay

Sometimes you may want to wait a little while before processing an action object. For example, say you're using Turbine to prototype a loading screen -- you might want to add a 3-second delay, then publish a message to move to the next screen. That's where the `delay` object is useful.

The `delay` object is used in lieu of `then` -- by using `delay`, you are implicitly saying "wait for a while, *then* process the delayed action".

The `delay` object contains one required property:

* `for` *[Number] The number of milliseconds to wait before processing the delayed action object*

In addition, the `delay` object should contain a `then` property. This tells Turbine what to do once the delay timer has elapsed. The `then` can either point to the next query to be executed, or it can contain an action object of its own.

```javascript
isAppLoaded : {
    no : {
        delay : {
            for : 3000,
            then : {
                publish : {
                    message : 'App.view.show',
                    using : {
                        view : 'appLoaded'
                    }
                },
                then :  'stop.'
            }
        }
    },
    yes : {
        // display Loaded message
    }
}
```

In the example above, `isAppLoaded` gets a `no` response. Turbine waits for 3000 ms (3 seconds), then publishes the `App.view.show` message, then stops.

Note that `delay` doesn't have to live alone in the action object. It can co-exist with other properties as well. For example:

```javascript
isAppLoaded : {
    no : {
        publish : {
            message : 'App.view.show',
            using : {
                view : 'appLoading'
            }
        },
        delay : {
            for : 3000,
            then : {
                publish : {
                    message : 'App.view.show',
                    using : {
                        view : 'appLoaded'
                    }
                },
                then :  'stop.'
            }
        }
    },
    yes : {
        // display Loaded message
    }
}
```

---

#### report

In many ways, Turbine is just a big state machine. As such, it is a centralized mechanism for monitoring the state of your application. If your application is in a state that is worth reporting, you can define `report` in your action object.

The value of `report` can be anything you want: a string, an object, an array, etc.

By default, `report` just passes its value to `console.error()`. However, you can define your own custom `report` function in initObj, allowing you to send reports to Google Analytics, Omniture, or whatever your preferred analytics tool may be.

Consider the example we used for `repeat` earlier. We checked 100 times whether the upload was complete, and it never was. That's the sort of thing you might want to report.

```javascript
isUploadComplete : {
    no : {
        waitFor : 'App.upload.updated',
        repeat : {
            limit : 100,
            then : {
                publish : {
                    message : 'App.upload.failed',
                    using : {
                        reason : 'UPLOAD_CHECK_LIMIT_EXCEEDED'
                    }
                },
                report : 'APP_UPLOAD_FAILURE',
                then :  'stop.'
            }
        }
    },
    yes : {
        // display Done message
    }
}
```

Now `APP_UPLOAD_FAILURE` will be sent to your reporting system so you can investigate why it failed.
.

## API

The Turbine API is extremely simple -- most of the logic and complexity is implemented in the workflow itself. There are just a few methods available:

### start()

Once an instance of Turbine has been created, calling `start()` will actually start the workflow.

```javascript
var turbine = new Turbine(initObj);
turbine.start();
```

You can also chain `start()` directly to the new Turbine instance, if you want it to start right away:

```javascript
var turbine = new Turbine(initObj).start();
```

---
### isStarted()

If you want to know whether Turbine has been started, you can use `isStarted()`.

```javascript
var turbine = new Turbine(initObj);
turbine.isStarted(); // returns false
turbine.start();
turbine.isStarted(); // returns true
```

---
### stop()

To stop Turbine, simple call stop().

```javascript
var turbine = new Turbine(initObj);
turbine.isStarted(); // returns false
turbine.start();
turbine.isStarted(); // returns true
turbine.stop();
turbine.isStarted(); // returns false
```

---
### getVar(varName)

The `getVar()` method retrieves the value of the variable set in Turbine's init object.

* `varName` *[String] The name of the variable to retrieve* 

```javascript
var initObj = {
    variables : {
        maxRetries : 100
    }
};

var turbine = new Turbine(initObj);
turbine.getVar('maxRetries'); // returns 100
```

---
### setResponse(query, response)

The `setResponse` method sets the response to a query.

* `query` *[String] The query to set the response for* 
* `response` *[String or Number or Boolean] The response to the query* 

```javascript
var turbine = new Turbine(initObj);
turbine.setResponse('isLoggedIn',true);
```

## Examples

Inside the /examples directory, you'll find a sample app that uses most of the concepts described in these docs. 

Just open /examples/index.html in a browser, select which type of workflow you want to load, then click Start Turbine. 

The app has a simple list of products, along with a mock shopping cart. You can add and remove items in the cart, do a simulated login and signup, and execute a mock checkout.

Some things to try: 

### When login is required before adding an item to the cart

* Try adding an item without logging in. You'll be prompted to log in. Click the Log In button, then try adding the item again. You'll be able to add it now.
* If you try adding an item 3 times without logging in, you'll be forced to sign up.
* If you add a PlayStation and NBA 2K13, you'll get a discount.
* If, during signup, you select Male and Basketball, you'll get bonus SuperShopper points.

### When login is required before checkout
* You can add items to the cart immediately
* If you add a PlayStation and wait a few seconds, you'll be prompted to add a DualShock controller.
* If you add a DualShock, you'll be prompted to add a charging station.
* If you try to check out without logging in, you'll be prompted to log in first.

To see how this all fits together as workflows, check out /examples/js/init.js. There you'll find the initObj that sets up the workflows.

**IMPORTANT NOTE:** This example app is meant to show how to implement Turbine and its workflows. It is *not* a good example of how to actually write a web app. There's some kludgy code, there's HTML commingled in the JavaScript, etc. It's pretty disgusting.

## FAQ

### Can I chain or nest multiple workflows together?

Sure. As a matter of fact, the signup flow in the example app is a separate workflow from the shopping cart flow. Take a look.

First, instantiate an instance of Turbine and start it up. When you get to the part of the workflow where you want to kick off another workflow, publish a message that tells your app to start the other workflow, then wait for a message that lets you know when the other workflow is done.

For example, your first workflow might have:

```javascript
isSignupRequired : {
    yes : {
        publish : {
            message : 'App.signup.start'
        },
        waitFor : 'App.signup.complete',
        then : 'isSignupValid'
    },
    no : {
        // let them in
    }
}
isSignupValid : {
    yes : {
        // let them in
    },
    no : {
        // don't let them in
    }
}
```

Your app can listen for `App.signup.start`. When it receives that message, it creates a new Turbine instance for the signup workflow. When that workflow is complete, it publishes `App.signup.complete`. Since the first workflow is waiting for that message, it will execute the `isSignupValid` query. *Voila!* Nested workflows!

## Questions? Bugs? Suggestions?

Please submit all bugs, questions, and suggestions via the [Issues](https://github.com/wmbenedetto/turbine.js/issues) section so everyone can benefit from the answer.

If you need to contact me directly, email warren@transfusionmedia.com.

## MIT License

Copyright (c) 2012 Warren Benedetto <warren@transfusionmedia.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

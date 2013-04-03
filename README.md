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

### Overview

### Queries

### Responses

Responses can be set two ways: via query functions in `initObj.queries`, or via the `setResponse()` method.

### Resets

### Workflow

### Shortcuts

### Variables

### Always

### Mixins

## Initializing Turbine

Each instance of Turbine is initialized by calling the Turbine constructor and passing it a single `initObj` object literal.

The documentation below has more detail about what each property means, but here is the basic structure. Note that only `workflow` is required; the rest are optional.

```javascript
// Create initialization object
var initObj = {
    name       : '',   // optional
    logLevel   : '',   // optional
    queries    : {},   // optional
    responses  : {},   // optional
    resets     : {},   // optional
    workflow   : {}    // REQUIRED
};

// Instantiate new Turbine instance using initObj
var turbine = new Turbine(initObj);
```

Now let's look at what each of these properties means.

---

### name 

*Gives your Turbine instance a unique name for logging purposes.*

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

*Determines the verbosity of the logs being output to the console.*

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

*Object containing functions used to resolve queries and return responses.*

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

`bind` is actually a feature of the Function prototype in ECMAScript 5 (JavaScript 1.8.5), and is supported by all modern browsers (see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind). In other words, everything but IE8. 

Never fear though ... Turbine includes an implementation of `bind`, so you can use it even in browsers that don't technically support it.

**To ensure that your function is always being called with `this` scoped correctly, you should always use `bind` when defining your query functions.**

---

### responses

*Object containing default responses to workflow queries.*

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

*Object containing functions or values used to reset query responses when rewinding a workflow*

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

If no reset is defined in `initObj.resets`, then the response is not reset during a rewind.

---

### workflow

---

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

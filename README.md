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

### Resets

### Workflow

### Shortcuts

### Variables

### Always

### Mixins

## Initializing Turbine

Each instance of Turbine is initialized by calling the Turbine constructor and passing it a single `initObj` object literal.

The documentation below has more detail about what each property means, but here is the basic structure. Note that only `queries` and `workflow` are required; the rest are optional.

```javascript
// Create initialization object
var initObj = {
    name       : '',   // optional
    logLevel   : '',   // optional
    queries    : {},   // REQUIRED
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

*[OPTIONAL]* Gives your Turbine instance a unique name for logging purposes. 

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

*[OPTIONAL]* Determines the verbosity of the logs being output to the console.

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

*[REQUIRED]* Object containing functions used to resolve queries and return responses.

The `queries` object is a collection of key:value pairs. Each key is the name of a query that appears in your workflow; each corresponding value is a reference to a function that will return the result of the query (a.k.a. the response).

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

As Turbine steps through each query in your workflow, it executes the corresponding function defined in `initObj.queries`. The return value of that query function tells Turbine which response to process.

If Turbine encounters a query in your workflow that is not defined in `initObj.queries`, it will throw a fatal error. Therefore, you need to be sure that every query in your workflow is accounted for in `initObj.queries`.

#### Function references

It's important to note that the functions in `initObj.queries` are just references -- they are not actually called. You can see this most clearly with the `isFoo : someGlobalFunction` example. Notice that `someGlobalFunction` does not have parentheses after it. That's what makes it a reference instead of an executed function.

#### Binding functions

So what's this `bind` stuff at the end of the other functions? 

`bind` is actually a feature of the Function prototype in ECMAScript 5 (JavaScript 1.8.5), and is supported by all modern browsers (see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind). In other words, everything but IE8. Never fear though ... Turbine includes an implementation of `bind`, so you can use it even in browsers that don't technically support it.

What `bind` does is tell the function what the scope of `this` should be when it is used inside the function. 

**To ensure that your function is always being called with `this` scoped correctly, you should always use `bind` when defining your query functions.**

---

### responses

---

### resets

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

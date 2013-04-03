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

### Name

The `name` is an optional property that allows you to give your Turbine instance a unique name for logging purposes. 

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

### Log level

### Queries

### Responses

### Resets

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

## Questions? Bugs? Suggestions?

Please submit all bugs, questions, and suggestions via the [Issues](https://github.com/wmbenedetto/turbine.js/issues) section so everyone can benefit from the answer.

If you need to contact me directly, email warren@transfusionmedia.com.

## MIT License

Copyright (c) 2012 Warren Benedetto <warren@transfusionmedia.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

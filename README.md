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

### Queries

### Responses

### Resets

### Config

#### Shortcuts

#### Variables

#### Always

* timeout
* waitFor

### Workflow

### Mixins

## Building a workflow

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

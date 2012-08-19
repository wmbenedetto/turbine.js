/**
 *   ________  ______  ____  _____   ________     _______
 *  /_  __/ / / / __ \/ __ )/  _/ | / / ____/    / / ___/
 *   / / / / / / /_/ / __  |/ //  |/ / __/  __  / /\__ \
 *  / / / /_/ / _, _/ /_/ // // /|  / /____/ /_/ /___/ /
 * /_/  \____/_/ |_/_____/___/_/ |_/_____(_)____//____/
 *
 * Turbine : The JavaScript Workflow Engine
 *
 * Copyright (c) 2012 Warren Benedetto <warren@transfusionmedia.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software
 * is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function(window,undefined) {

    var $                                       = window.jQuery  || null;
    var console                                 = window.console || {};

    console.log                                 = console.log   || function() {};
    console.info                                = console.info  || console.log;
    console.error                               = console.error || console.log;
    console.warn                                = console.warn  || console.log;

    /**
     * Add bind() to Function prototype for browsers that don't yet support ECMAScript 5.
     *
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
     */
    Function.prototype.bind = function(scope) {

        var self                                = this;

        return function() {
            return self.apply(scope,arguments);
        }
    };

    /**
     * Initializes Turbine via a single initObj object.
     *
     * This initObj must contain function definitions for publish(),
     * listen(), and remove() as well as an object containing the workflow
     * config, queries, and mixins.
     *
     * In addition to these required items, the initObj can also contain
     * objects containing query and reset functions, default responses, and
     * function definitions for log(), compare(), and report().
     *
     * It can also define the name of this Turbine instance (used for logging),
     * and the logLevel.
     *
     * @param initObj Initialization object
     */
    var Turbine = function Turbine(initObj) {

        this.setDefaults();

        this.setName(initObj.name);
        this.setLogLevel(initObj.logLevel);

        this.importFunctions(initObj);
        this.importObjects(initObj);
        this.importWorkflow(initObj);

        this.queue(this.getStartingQuery(),null);
    };

    Turbine.prototype = {

        defaultGlobalTimeout                    : 3600000, // one hour, in milliseconds
        globalListeners                         : null,
        globalTimeoutAllowed                    : null,
        logLevel                                : null,
        name                                    : null,
        numGlobalListeners                      : null,
        queries                                 : null,
        queryOrder                              : null,
        resets                                  : null,
        responses                               : null,
        stopped                                 : null,
        timers                                  : null,
        waitingFor                              : null,
        workflow                                : null,

        logLevels : {
            OFF                                 : 0,
            ERROR                               : 1,
            WARN                                : 2,
            INFO                                : 3,
            DEBUG                               : 4
        },

        /**
         * Initializes instance properties with default values
         */
        setDefaults : function(){

            this.globalListeners                = {};
            this.globalTimeoutAllowed           = false;
            this.logLevel                       = 'ERROR';
            this.name                           = 'Turbine';
            this.numGlobalListeners             = 0;
            this.queries                        = {};
            this.queryOrder                     = [];
            this.resets                         = {};
            this.responses                      = {};
            this.stopped                        = false;
            this.waitingFor                     = null;
            this.workflow                       = {};

            this.timers = {
                queries                         : {},
                delay                           : null,
                global                          : null
            }
        },

        /**
         * Imports valid functions specified in initObj to Turbine
         *
         * @param initObj Initialization object
         */
        importFunctions : function(initObj) {

            this.log('importFunctions', 'Importing functions');

            var thisFunc                        = null;
            var validFunctions                  = ['log','publish','listen','report','remove','compare'];
            var importedFunctions               = {};

            for (var i=0;i<validFunctions.length;i++) {

                thisFunc                        = validFunctions[i];

                this.log('importFunctions', '--> Importing ' + thisFunc + '() function', null, 'DEBUG');

                if (typeof initObj[thisFunc] === 'function') {

                    this[thisFunc]              = initObj[thisFunc];

                    importedFunctions[thisFunc] = true;
                }
            }

            if (!$ && (!('publish' in importedFunctions) || !('listen' in importedFunctions) || !('remove' in importedFunctions))) {

                var errorMsg                    = '[' + this.name + '.importFunctions()] You must either define publish(), listen(), and remove() functions via Turbine.init(), or include jQuery in the page.';

                this.report('REQUIRED_FUNCTIONS_NOT_DEFINED',errorMsg);

                throw new Error(errorMsg);
            }
        },

        /**
         * Imports valid objects specified in initObj to Turbine
         *
         * @param initObj Initialization object
         */
        importObjects : function(initObj) {

            this.log('importObjects', 'Importing objects');

            var thisObj                         = null;
            var validObjects                    = ['queries','resets','responses'];

            for (var i=0;i<validObjects.length;i++) {

                thisObj                         = validObjects[i];

                this.log('importObjects', '--> Importing ' + thisObj + ' object', null, 'DEBUG');

                if (this.utils.isObjLiteral(initObj[thisObj])) {
                    this[thisObj]               = initObj[thisObj];
                }
            }
        },

        /**
         * Imports workflow
         *
         * @param initObj Initialization object
         */
        importWorkflow : function(initObj) {

            if (this.utils.isObjLiteral(initObj.workflow)) {

                this.log('importWorkflow', 'Importing workflow');

                if (this.utils.isObjLiteral(initObj.workflow.config)) {
                    this.importConfig(initObj.workflow);
                }

                if (this.utils.isObjLiteral(initObj.workflow.queries)) {
                    this.importQueries(initObj.workflow);
                }

                this.workflow                   = initObj.workflow;

            } else {

                var errorMsg                    = '[' + this.name + '.importWorkflow()] Could not import workflow. Workflow must be an object literal.';

                this.report('COULD_NOT_IMPORT_WORKFLOW',errorMsg);

                throw new Error(errorMsg);
            }
        },

        /**
         * Imports workflow config
         *
         * @param workflow The workflow object containing the config
         */
        importConfig : function(workflow) {

            this.log('importConfig', 'Importing config', workflow);

            var self                            = this;

            if (workflow.config.always && workflow.config.always.waitFor) {

                for (var i in workflow.config.always.waitFor) {

                    if (workflow.config.always.waitFor.hasOwnProperty(i)) {

                        (function(listener) {

                            self.importGlobalListener(listener,workflow);

                        }(workflow.config.always.waitFor[i]));
                    }
                }
            }

            /* If a global timeout is specified in the workflow config, then
             * global timeouts are allowed by default */
            this.globalTimeoutAllowed           = typeof workflow.config.always.timeout !== 'undefined';
        },

        /**
         * Imports workflow queries
         *
         * @param workflow The workflow object containing the queries
         */
        importQueries : function(workflow) {

            this.log('importQueries', 'Importing queries', workflow);

            var totalQueries                    = 0;

            /* Imports each query in the workflow */
            for (var query in workflow.queries) {

                if (workflow.queries.hasOwnProperty(query)) {

                    this.importQuery(query,workflow);

                    totalQueries               += 1;
                }
            }

            if (totalQueries === 0) {

                var errorMsg                    = '[' + this.name + '.importQueries()] The workflow has no queries to import';

                this.report('NO_QUERIES_TO_IMPORT',errorMsg);

                throw new Error(errorMsg);
            }
        },

        /**
         * Imports a single query from the workflow
         *
         * @param query The query to import
         * @param workflow The workflow being imported
         */
        importQuery : function(query,workflow) {

            this.log('importQuery', 'Importing workflow query: ' + query, workflow.queries[query], 'DEBUG');

            this.queries[query]                 = this.queries[query] || null;

            /* Store queries in array so they can be accessed numerically */
            this.queryOrder.push(query);

            this.replaceMixins(query,workflow);

            for (var response in workflow.queries[query]) {

                if (workflow.queries[query].hasOwnProperty(response)) {
                    this.importResponse(response,query,workflow);
                }
            }
        },

        /**
         * Imports one response for one workflow query
         *
         * @param response The response to import
         * @param query The query being imported
         * @param workflow The workflow being imported
         */
        importResponse : function(response,query,workflow) {

            var thisResponse                    = workflow.queries[query][response];

            this.log('importResponse', 'Importing ' + response + ' response to ' + query + ' query', thisResponse, 'DEBUG');

            /* Add counter to any repeat object */
            if (thisResponse.repeat) {
                thisResponse.repeat.counter = 0;
            }

            this.replaceShortcuts(thisResponse,workflow);
            this.replaceVariables(thisResponse,workflow);
        },

        /**
         * Default log() implementation
         *
         * This can be overridden by defining a log() function in the initObj passed to
         * init()
         *
         * @param funcName The name of the function generating the log message
         * @param message The message to log
         * @param payload Data object
         * @param level Log level (ERROR, WARN, INFO, DEBUG)
         */
        log : function(funcName,message,payload,level) {

            payload                             = (!payload) ? '' : payload;
            level                               = (!level) ? 'INFO' : level;
            message                             = '[' + this.name + '.' + funcName + '()] ' + message;

            if (this.isLoggable(level)) {

                if (level === 'ERROR') {
                    console.error(message,payload);
                } else if (level === 'WARN') {
                    console.warn(message,payload);
                } else if (level === 'INFO') {
                    console.info(message,payload);
                } else {
                    console.log(message,payload);
                }
            }
        },

        isLoggable : function(level){

            var currentLogLevel                 = this.logLevels[this.logLevel];
            var thisLogLevel                    = this.logLevels[level];

            return thisLogLevel <= currentLogLevel;
        },

        /**
         * Default implementation of report() function. Used to report errors in Turbine.
         * This can be overridden by defining a report() function in the initObj passed to
         * init()
         *
         * @param handle Short identifier of the error, i.e. SOMETHING_BAD_HAPPENED or 100.1111
         * @param desc Human-readable description of the error
         * @param payload Object containing data needed to report or debug the error
         */
        report : function(handle,desc,payload) {

            if (handle === 'REQUIRED_FUNCTIONS_NOT_DEFINED') {
                alert(desc);
            }

            this.log(desc + ' (' + handle + ')',payload,'ERROR');
        },

        /**
         * Default implementation of publish() function, using jQuery's trigger() function
         * to publish messages.
         *
         * This can be overridden by defining a publish() function in the initObj passed to
         * init()
         *
         * @param message The message or array of messages to publish
         * @param payload Data object
         * @param callback Function to call once message(s) is published
         */
        publish : function(message,payload,callback) {

            this.log('publish', 'Publishing message:', message);

            if (typeof message === 'string') {
                message                         = [message];
            }

            for (var i=0;i<message.length;i++) {
                $(this).trigger(message[i],payload);
            }

            if (typeof callback === 'function') {
                callback();
            }
        },

        /**
         * Default implementation of listen() function, using jQuery's bind() function
         * to bind handlers to messages.
         *
         * This can be overridden by defining a listen() function in the initObj passed to
         * init()
         *
         * @param message The message for which to listen
         * @param handler The function to execute upon receiving the message
         */
        listen : function(message,handler) {

            this.log('listen', 'Adding listener for:', message, 'DEBUG');

            if (typeof message === 'string') {
                message                         = [message];
            }

            for (var i=0;i<message.length;i++) {

                $(this).bind(message[i],function(e) {
                    handler(e.type, e.data);
                });
            }
        },

        /**
         * Default implementation of remove() function, using jQuery's unbind() function
         * to unbind handlers from messages.
         *
         * This can be overridden by defining a remove() function in the initObj passed to
         * init()
         *
         * @param message The message for which to stop listening
         */
        remove : function(message) {

            this.log('remove', 'Removing listener for:', message, 'DEBUG');

            if (typeof message === 'string') {
                message                         = [message];
            }

            for (var i=0;i<message.length;i++) {
                 $(this).unbind(message[i]);
            }
        },

        /**
         * Default implementation of compare() function. Used to compare two messages to each
         * other, to determine if they match.
         *
         * This can be overridden by defining a compare() function in the initObj passed to
         * init()
         *
         * @param msg1 The first message to compare
         * @param msg2 The second message to compare
         * @return {Boolean}
         */
        compare : function(msg1,msg2) {
            return msg1 === msg2;
        },

        /**
         * Starts the Turbine by executing the first queued query
         */
        start : function() {

            this.log('start', 'Starting Turbine');

            this.publish('Turbine|workflow|started');

            this.stopped                        = false;

            this.next();
        },

        /**
         * Stops the Turbine
         */
        stop : function() {

            this.log('stop', 'Stopping Turbine');

            this.stopped                        = true;

            this.rewind();

            this.publish('Turbine|workflow|stopped');
        },

        /**
         * Shortcut for executing next query
         */
        next : function() {

            if (this.isStopped() || this.nextQuery === null) {
                return null;
            }

            this.log('next', 'Executing next workflow query:', this.nextQuery);

            this.exec(this.nextQuery);
        },

        /**
         * Executes a query
         *
         * @param query The query to execute
         */
        exec : function(query) {

            this.clearTimers();

            if (this.isStopQuery(query)) {
                this.stop();
            }

            if (this.isStopped()) {
                return null;
            }

            this.nextQuery                      = null;
            this.responses[query]               = this.getResponse(query);

            if (!this.hasResponse(query)) {

                this.report('RESPONSE_NOT_RECEIVED', '[' + this.name + '.exec()] No response received for ' + query + ' query');

                return null;
            }

            var responseName                    = this.responses[query];
            var responseObj                     = this.workflow.queries[query][responseName];

            /* If the response doesn't exist, check if a default response has been specified */
            if (!responseObj) {

                responseName                    = 'default';
                responseObj                     = this.workflow.queries[query][responseName];

                /* If there's no default response specified either, then there's nothing else we can do */
                if (!responseObj) {

                    this.report('RESPONSE_DOES_NOT_EXIST', '[' + this.name + '.exec()] ' + responseName + ' response does not exist for the ' + query + ' query');

                    return null;
                }
            }

            this.log('exec', 'Executing the ' + responseName + ' response to the ' + query + ' query');

            this.publish('Turbine|query|executed',{

                query                           : query,
                response                        : responseName,
                responseObj                     : responseObj
            });

            responseObj.responseName            = responseName;

            this.processResponse(query,responseObj);
        },

        /**
         * Processes a query's response, executing its the workflow logic
         *
         * @param query The query containing the response to process
         * @param response The response to process
         */
        processResponse : function(query,response,preventGlobalTimeout) {

            this.clearTimers();

            if (this.isStopped()) {
                return null;
            }

            this.log('processResponse', 'Processing response', response);

            if (!preventGlobalTimeout) {
                this.startGlobalTimeout(query,response);
            }

            if (response.delay && !response.isAfterDelay) {

                this.startDelay(query,response);

            } else {

                /* "report" tells us to report an issue. We only want to report it once, so
                 * we ignore it if we're processing the response as part of a publish callback */
                if (response.report && !response.isPublishCallback) {

                    var responseName            = this.responses[query];

                    this.report(response.report,'Turbine reported ' + response.report + ' from "' + responseName + '" response of "' + query + '" query',{

                        query                   : query,
                        response                : responseName,
                        responseObj             : this.workflow.queries[query][responseName]
                    });
                }

                /* If we have "publish" with no "waitFor", then just publish the message and move on */
                if (response.publish && !response.waitFor && !response.isPublishCallback) {

                    this.publishNow(query,response);
                }

                /* If we have "publish" with "waitFor", then publish the message and wait for a response
                 * before continuing. */
                if (response.publish && response.waitFor && !response.isPublishCallback) {

                    this.publishAndWait(query,response);

                } else {

                    if (response.repeat) {

                        if (response.isAfterDelay) {

                            try {
                                delete response.isAfterDelay;
                            } catch (e) {
                                response.isAfterDelay       = undefined;
                            }
                        }

                        /* "repeat" repeats query */
                        this.repeat(query,response);

                    } else if (response.then) {

                        /* "waitFor" tells us to wait for an event (or events) before executed "then" query */
                        if (response.waitFor) {

                            if (this.isEarlierQuery(query,response.then)) {

                                this.rewind(query,response.then,response.waitFor);

                            } else {

                                this.queue(response.then,response.waitFor);
                            }
                        }
                        /* Otherwise, "then" query gets executed immediately */
                        else {

                            this.exec(response.then);
                        }
                    }

                    if (response.isPublishCallback) {

                        try {
                            delete response.isPublishCallback;
                        } catch (e) {
                            response.isPublishCallback  = undefined;
                        }
                    }

                    /* If this response has a timeout, set the timer */
                    if (response.timeout) {
                        this.setResponseTimeout(query,response);
                    }

                    if (response.isAfterDelay) {

                        try {
                            delete response.isAfterDelay;
                        } catch (e) {
                            response.isAfterDelay       = undefined;
                        }
                    }
                }
            }
        },

        /**
         * Sets response timeout
         *
         * @param query The query being executed
         * @param response The response containing the timeout
         */
        setResponseTimeout : function(query, response) {

            if (!this.timers.queries[query]) {
                this.timers.queries[query]              = [];
            }

            var self                                    = this;

            var timeout = setTimeout(function() {

                self.onResponseTimeout(query,response);

            },response.timeout.after);

            this.timers.queries[query].push(timeout);
        },

        /**
         * Repeats query on each event until limit is reached, after which the
         * fallback response is performed. If the limit is null, query can repeat infinitely.
         *
         * @param query The query to repeat
         * @param response The response to repeat
         */
        repeat : function(query,response) {

            response.repeat.counter            += 1;

            this.log('repeat', 'Repeating ' + query + ' (' + response.repeat.counter + ' of ' + response.repeat.limit + ' max)');

            /* If the limit is null, repeat query indefinitely */
            if (response.repeat.limit === null) {

                this.queue(query,response.waitFor);
            }
            /* If the limit has been reached, use fallback response */
            else if (response.repeat.counter >= response.repeat.limit) {

                this.log('repeat', 'Maximum repeat limit for ' + query + ' reached or exceeded (' + response.repeat.counter + ' of ' + response.repeat.limit + ' max)');

                this.publish('Turbine|limit|exceeded|REPEAT',{

                    query                       : query,
                    limit                       : response.repeat.limit
                });

                this.processResponse(query,response.repeat);
            }
            /* If limit hasn't been reached, queue or execute same query again */
            else {

                if (response.waitFor) {

                    /* When waitFor is an array, it is passed by reference. Because the global listeners are added
                     * every time we call queue(), and because waitFor is a reference, the global listeners end up
                     * being pushed onto the array over and over. Slicing them off here means they can be added again
                     * without stacking up. */
                    if (this.utils.isArray(response.waitFor) && response.repeat.counter > 1) {
                        response.waitFor        = response.waitFor.slice(0,response.waitFor.length - this.numGlobalListeners);
                    }

                    this.queue(query,response.waitFor);

                } else {

                    this.exec(query);
                }
            }
        },

        /**
         * Rewinds back to earlier query, resetting queries' flags and counters
         * along the way.
         *
         * @param from The query from which to start the rewind
         * @param to The query to which we're rewinding
         * @param eventHandle The event handle to wait for before executing the next query
         */
        rewind : function(from,to,eventHandle) {

            this.clearTimers();

            var clearing                        = false;
            var numQueries                      = this.queryOrder.length;
            from                                = from || this.queryOrder[numQueries-1];
            to                                  = to || this.queryOrder[0];

            this.log('rewind', 'Rewinding from ' + from + ' to ' + to);

            this.publish('Turbine|workflow|rewind',{

                from                            : from,
                to                              : to
            });

            for (var i=numQueries;i>=0;i--) {

                var query                       = this.queryOrder[i];

                if (query === from) {
                    clearing                    = true;
                }

                if (clearing) {
                    this.clear(query);
                }

                if (query === to) {
                    break;
                }
            }

            if (!this.isStopped()) {
                this.queue(to,eventHandle);
            }
        },

        /**
         * Checks whether the new query is earlier than the current query
         * (e.g. we're going backwards in the workflow)
         *
         * @param currentQuery The query we're currently executing
         * @param newQuery The query to execute next
         */
        isEarlierQuery : function(currentQuery,newQuery) {

            if (currentQuery === newQuery) {
                return true;
            }

            for (var i in this.queryOrder) {

                if (this.queryOrder.hasOwnProperty(i)) {

                    if (this.queryOrder[i] === newQuery) {
                        return true;
                    }

                    if (this.queryOrder[i] === currentQuery) {
                        return false;
                    }
                }
            }

            return false;
        },

        /**
         * Clears query's flags and timeouts and resets counters
         *
         * @param query The query to clear
         */
        clear : function(query) {

            this.log('clear', 'Clearing ' + query, null, 'DEBUG');

            this.clearQueryTimer(query);

            this.responses[query]               = null;

            /* Reset counters for repeat queries */
            for (var response in this.workflow.queries[query]) {

                if (this.workflow.queries[query].hasOwnProperty(response) && this.workflow.queries[query][response].repeat) {

                    this.workflow.queries[query][response].repeat.counter = 0;
                }
            }

            this.resetResponse(query);
        },

        /**
         * Checks whether there's a function to get a response to the query
         *
         * @param query The query for which to get a function
         */
        hasQueryFunction : function(query) {
            return typeof this.queries[query] === 'function';
        },

        /**
         * Checks whether there's a function to reset the query response
         *
         * @param query The query for which the response should be reset
         */
        hasResetFunction : function(query) {
            return typeof this.resets[query] === 'function';
        },

        /**
         * Resets the response to a query
         *
         * @param query The query for which the response should be reset
         */
        resetResponse : function(query) {

            if (this.hasResetFunction(query)) {

                this.responses[query]           = this.resets[query]();

            } else {

                this.responses[query]           = null;
            }
        },

        /**
         * Callback executed when query response times out
         *
         * @param query The query being executed
         * @param response The response containing the timeout
         */
        onResponseTimeout : function(query,response) {

            this.log('onResponseTimeout', 'The ' + query + ' response timed out.', response, 'WARN');

            if (this.waitingFor) {
                this.remove(this.waitingFor);
            }

            this.publish('Turbine|timer|expired|WORKFLOW_RESPONSE_TIMEOUT',{

                query                           : query,
                response                        : response.responseName,
                responseObj                     : response
            });

            /* Set flag so delay isn't triggered again during reprocessing */
            response.timeout.isAfterTimeout     = true;

            this.processResponse(query,response.timeout,true);
        },

        /**
         * Publishes workflow message immediately
         *
         * @param query The query being executed
         * @param response The response being processed
         */
        publishNow : function(query,response) {

            var message                         = null;
            var using                           = {};

            if (this.utils.isObjLiteral(response.publish)) {

                message                         = response.publish.message;
                using                           = this.getUsingObject(response.publish.using);

            } else {

                message                         = response.publish;
            }

            this.publish(message,using);
        },

        /**
         * Publishes message, then waits until the callback is called before moving to the next step.
         *
         * @param query The query containing the message to publish
         * @param response The response being processed
         */
        publishAndWait : function(query,response) {

            var self                            = this;
            var message                         = null;
            var using                           = {};

            if (this.utils.isObjLiteral(response.publish)) {

                message                         = response.publish.message;
                using                           = this.getUsingObject(response.publish.using);

            } else {

                message                         = response.publish;
            }

            using.counter                       = (typeof response.repeat !== 'undefined') ? response.repeat.counter : 0;

            this.log('publishAndWait', 'Publishing message and waiting for response', {

                message                         : message,
                using                           : using,
                response                        : response
            });

            /* After message is published, callback must be called to process the rest of the response */
            var callback = function() {

                response.isPublishCallback      = true;

                self.processResponse(query,response);
            };

            this.publish(message,using,callback);
        },

        /**
         * Merges response's "using" object with config's always.using object (if it is defined).
         *
         * @param using The response's "using" object
         */
        getUsingObject : function(using) {

            using                               = (typeof using === 'undefined') ? {} : using;

            /* If the config has an always.using object defined, merge it into the response's using object */
            if (this.workflow.config.always && this.workflow.config.always.using) {

                using                           = this.utils.mergeObjects(using,this.workflow.config.always.using);
            }

            this.log('getUsingObject', 'Getting using object', using, 'DEBUG');

            return using;
        },

        /**
         * Starts delay timer
         *
         * @param query The query being delayed
         * @param response The response being delayed
         */
        startDelay : function(query,response) {

            this.log('startDelay',query + ' delay started. Delayed for ' + response.delay + ' ms', response);

            this.publish('Turbine|delay|started',{

                query                       : query,
                delay                       : response.delay + ' ms'
            });

            var self                        = this;

            this.timers.delay = setTimeout(function() {

                self.onDelayTimeout(query,response);

            },response.delay);
        },

        /**
         * Callback executed when delay timer expires
         *
         * @param query The query being delayed
         * @param response The response being delayed
         */
        onDelayTimeout : function(query,response) {

            this.log('onDelayTimeout',query + ' delay completed after ' + response.delay + ' ms', response);

            this.publish('Turbine|delay|completed',{

                query                       : query,
                delay                       : response.delay + ' ms'
            });

            /* Set flag so delay isn't triggered again during reprocessing */
            response.isAfterDelay           = true;

            this.processResponse(query,response);
        },

        /**
         * Gets the query with which to start the workflow. If a @start shortcut
         * is specified in the workflow config, that is used. Otherwise, the first
         * query in the workflow is used.
         *
         * @return {String}
         */
        getStartingQuery : function() {

            var start                           = this.getConfigShortcut('start');

            return (start) ? start : this.queryOrder[0];
        },

        /**
         * Imports global listener from workflow
         *
         * @param listener The listener to import
         * @param workflow The workflow from which to import it
         */
        importGlobalListener : function(listener,workflow) {

            this.log('importGlobalListener', 'Importing global listener', listener, 'DEBUG');

            this.replaceShortcuts(listener,workflow);
            this.replaceVariables(listener,workflow);

            if (typeof listener.waitFor === 'string') {
                listener.waitFor                = [listener.waitFor];
            }

            for (var i=0;i<listener.waitFor.length;i++) {

                var msg                         = listener.waitFor[i];
                this.globalListeners[msg]       = listener;
                this.numGlobalListeners        += 1;
            }
        },

        /**
         * Queues query to be executed on next event
         *
         * @param query The query to queue
         * @param message The message(s) to wait for before executing the next query
         */
        queue : function(query,message) {

            if (this.waitingFor) {
                this.remove(this.waitingFor);
            }

            this.waitingFor                     = this.buildWaitingForObj(message);
            this.nextQueryObj                   = this.buildNextQueryObj(query,this.waitingFor);
            this.nextQuery                      = query;

            this.log('queue', 'Queuing ' + query + ' query', this.waitingFor);

            this.publish('Turbine|workflow|waiting',{ waitingFor : this.waitingFor });

            this.listen(this.waitingFor,this.handleIncomingMessage.bind(this));
        },

        /**
         * Builds object containing array of the current waitFor messages,
         * along with global listeners.
         *
         * @param message Array of messages to wait for
         */
        buildWaitingForObj : function(message) {

            var waitingFor                      = (message) ? message : [];

            if (!this.utils.isArray(waitingFor)) {
                waitingFor                      = [waitingFor];
            }

            /* Add global listeners to waitingFor object, if they're not already there */
            for (var msg in this.globalListeners) {

                if (this.globalListeners.hasOwnProperty(msg)) {

                    for (var i=0;i<this.globalListeners[msg].waitFor.length;i++) {

                        var globalListener      = this.globalListeners[msg].waitFor[i];

                        if (!this.inMessageArray(globalListener,waitingFor)) {
                            waitingFor.push(globalListener);
                        }
                    }
                }
            }

            return waitingFor;
        },

        /**
         * Checks whether a message is already in an array of messages
         *
         * @param message The message to check
         * @param messageArray The array of messages in which to look
         * @return {Boolean}
         */
        inMessageArray : function(message,messageArray) {

            for (var i=0;i<messageArray.length;i++) {

                if (message === messageArray[i]) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Build object that associates messages with next queries
         *
         * This is required because global listeners have different "then" queries
         * than listeners in the query's waitFor array
         *
         * @param query The default next query for the query's waitFor messages
         * @param waitingFor Array of messages to wait for
         */
        buildNextQueryObj : function(query,waitingFor) {

            var nextQuery                       = {};

            /* Add query waitFor messages to waitingFor object */
            for (var i=0;i<waitingFor.length;i++) {
                nextQuery[waitingFor[i]]        = query;
            }

            /* Add global listeners to waitingFor object */
            for (var msg in this.globalListeners) {

                if (this.globalListeners.hasOwnProperty(msg)) {
                    nextQuery[msg]              = this.globalListeners[msg].then;
                }
            }

            return nextQuery;
        },

        /**
         * Handles an incoming message
         *
         * @param message The message being handled
         * @param payload The message payload
         */
        handleIncomingMessage : function(message,payload) {

            if (this.isStopped()) {
                return null;
            }

            this.log('handleIncomingMessage', 'Handling "'+message+'" message', payload);

            if (this.waitingFor) {

                this.remove(this.waitingFor);

                this.nextQuery                  = this.getNextQuery(message);
            }

            this.publish('Turbine|message|handled',{

                handledMessage                  : message,
                next                            : this.nextQuery
            });

            this.waitingFor                     = null;

            this.next();
        },

        /**
         * Gets the next query to execute based on the message being handled.
         *
         * When a message is handled, we need to determine whether it was handled
         * as a global listener message or a query waitFor message, and then
         * return the next step accordingly.
         *
         * @param message The message being handled
         */
        getNextQuery : function(message) {

            var next                            = null;

            for (var msg in this.nextQueryObj) {

                if (this.nextQueryObj.hasOwnProperty(msg) && this.compare(message,msg)) {
                    next                        = this.nextQueryObj[msg];
                    break;
                }
            }

            this.log('getNextQuery', 'Getting the next query: '+next, null, 'DEBUG');

            return next;
        },

        /**
         * Clears all timers: queries, delays, and global
         */
        clearTimers : function() {

            this.log('clearTimers', 'Clearing all timers', this.timers, 'DEBUG');

            this.clearAllQueryTimers();
            this.clearGlobalTimer();
            this.clearDelayTimer();
        },

        /**
         * Clears all timers for all queries
         */
        clearAllQueryTimers : function() {

            this.log('clearAllQueryTimers', 'Clearing all query timers', this.timers.queries, 'DEBUG');

            for (var query in this.timers.queries) {

                if (this.timers.queries.hasOwnProperty(query)) {

                    this.clearQueryTimer(query);
                }
            }
        },

        /**
         * Clears timers for specified query
         *
         * @param query The query for which to clear timers
         */
        clearQueryTimer : function(query) {

            var timerArray                      = this.timers.queries[query];

            if (timerArray) {

                this.log('clearQueryTimer', 'Clearing '+query+' query timer', this.timers.queries[query], 'DEBUG');

                for (var i=0;i<timerArray.length;i++) {
                    clearTimeout(timerArray[i]);
                }

                try {
                    delete this.timers.queries[query];
                } catch (e) {
                    this.timers.queries[query]  = undefined;
                }
            }
        },

        /**
         * Clears global workflow timer
         */
        clearGlobalTimer : function() {

            if (this.timers.global !== null) {

                this.log('clearGlobalTimer', 'Clearing global timer', this.timers.global, 'DEBUG');

                clearTimeout(this.timers.global);
            }
        },

        /**
         * Clears delay timer
         */
        clearDelayTimer : function() {

            if (this.timers.delay !== null) {

                this.log('clearDelayTimer', 'Clearing delay timer', this.timers.delay, 'DEBUG');

                clearTimeout(this.timers.delay);
            }
        },

        /**
         * Starts global timeout timer, which will fire if the Turbine hasn't reached a stop
         * query within the global timeout limit
         *
         * @param query The active query when the timeout is set
         * @param response The response being processed
         * @return {Boolean}
         */
        startGlobalTimeout : function(query,response) {

            if (!this.isGlobalTimeoutAllowed()) {
                return false;
            }

            this.clearGlobalTimer();

            this.log('startGlobalTimeout', 'Starting global timer', this.workflow.config.always.timeout, 'DEBUG');

            var timeout                         = this.getGlobalTimeout();
            var self                            = this;

            this.timers.global = setTimeout(function() {

                self.onGlobalTimeout(query,response);

            },timeout);

            return true;
        },

        /**
         * Gets the length of the global timeout, in milliseconds
         *
         * @return {Number}
         */
        getGlobalTimeout : function() {
            return this.workflow.config.always.timeout.after || this.defaultGlobalTimeout;
        },

        /**
         * Callback to execute when global timeout timer fires
         *
         * @param query The active query when the timeout was set
         * @param response The response that was being processed when the timeout was set
         */
        onGlobalTimeout : function(query,response) {

            if (this.waitingFor) {
                this.remove(this.waitingFor);
            }

            this.log('onGlobalTimeout', 'Turbine timed out on ' + query + ' query after ' + this.getGlobalTimeout() + ' ms',null,'ERROR');

            this.publish('Turbine|timer|expired|WORKFLOW_GLOBAL_TIMEOUT', {

                query                       : query,
                response                    : response.responseName,
                responseObj                 : response
            });

            /* Set flag so timeout isn't triggered again during reprocessing */
            this.workflow.config.always.timeout.isAfterTimeout = true;

            this.processResponse(null,this.workflow.config.always.timeout,true);
        },

        /**
         * Checks whether global timeout is allowed to be set
         *
         * @return {Boolean}
         */
        isGlobalTimeoutAllowed : function() {
            return this.globalTimeoutAllowed === true;
        },

        /**
         * Checks whether the workflow is stopped
         */
        isStopped : function() {
            return this.stopped === true;
        },

        /**
         * Checks whether the query is a stop query, meaning
         * the workflow should stop when it is encountered.
         *
         * @param query The query to check
         */
        isStopQuery : function(query) {
            return query === 'done'
        },

        /**
         * Sets response to query
         *
         * @param query The query for which to set the response
         * @param response The response to set
         */
        setResponse : function(query,response) {

            this.log('setResponse', 'Setting "' + query + '" response to ' + response);

            this.responses[query]               = response;
        },

        /**
         * Gets the response to a query
         *
         * @param query The query for which to get the response
         */
        getResponse : function(query) {

            this.responses[query]               = (this.hasQueryFunction(query)) ? this.queries[query]() : (this.responses[query] === true || this.responses[query] === 'yes');

            /* Convert boolean result to yes/no string */
            if (typeof this.responses[query] === 'boolean') {
                this.responses[query]       = (this.responses[query]) ? 'yes' : 'no';
            }

            this.log('getResponse',query + '?', this.responses[query]);

            return this.responses[query];
        },

        /**
         * Checks whether query already has a response
         *
         * @param query The query to check
         */
        hasResponse : function(query) {
            return typeof this.responses[query] !== 'undefined' && this.responses[query] !== null && typeof this.responses[query] !== 'boolean';
        },

        /**
         * Gets value of workflow config variable
         *
         * @param varName The name of the variable for which to get the value
         * @return {*}
         */
        getConfigVar : function(varName) {

            /* Prepend dollar sign if not already there */
            varName                             = (varName.indexOf('$') !== 0) ? '$' + varName : varName;

            return (this.utils.isObjLiteral(this.workflow.config.variables)) ? this.workflow.config.variables[varName] : null;
        },

        /**
         * Gets value of workflow config shortcut
         *
         * @param shortcut The name of the shortcut for which to get the value
         * @return {*}
         */
        getConfigShortcut : function(shortcut) {

            /* Prepend @ symbol if not already there */
            shortcut                            = (shortcut.indexOf('@') !== 0) ? '@' + shortcut : shortcut;

            return (this.utils.isObjLiteral(this.workflow.config.shortcuts)) ? this.workflow.config.shortcuts[shortcut] : null;
        },

        /**
         * Replaces variables in workflow with values. Variables are defined in the workflow config and
         * are always prepended with a $. They work just like variables in any other programming language.
         * Define them and then the value of the variable is used in its place.
         *
         * @param response The response in which the variables are being replaced
         * @param workflow The workflow being imported
         */
        replaceVariables : function(response,workflow) {
            this.replace(response,workflow.config.variables,'$',true,'variable');
        },

        /**
         * Replaces shortcuts in workflow with shortcut values. Shortcuts in the workflow config,
         * and are always prepended with an @ symbol.
         *
         * Shortcuts are a way to reference a particular query in the workflow with an alias,
         * rather than explicitly by name. For example, you may define a @start shortcut,
         * and then reference that with "then":
         *
         * "config" : {
         *     "shortcuts" : {
         *         "@start" : "isWorkflowActive"
         *     }
         * }
         *
         * "queries" : {
         *     "isStartOverAllowed" : {
         *         "yes" : {
         *             "then" : "@start" // <-- This is the shortcut
         *         },
         *         "no" : {
         *             "then" : "end"
         *         }
         *     }
         * }
         *
         * If you decide to change the starting query of the workflow, you don't have to find and
         * replace isWorkflowActive everywhere it occurs. Instead, you can just change the value of @start.
         *
         * @param response The response in which the shortcuts are being replaced
         * @param workflow The workflow being imported
         */
        replaceShortcuts : function(response,workflow) {
            this.replace(response,workflow.config.shortcuts,'@',true,'shortcut');
        },

        /**
         * Replaces mixins in workflow with values.
         *
         * Mixins are a way to define an entire response object as a reference, to avoid repeating
         * the same object over and over.
         *
         * Mixins are defined in their own object in the workflow. The mixin name is always
         * prepended with an exclamation point, and the value is always a full response object.
         *
         * For example:
         *
         * "mixins" : {
         *     "!wrongPassword" : {
         *         "publish"               : "UI.fail.show.PASSWORD_INCORRECT",
         *         "then"                  : "end"
         *     }
         * }
         *
         * Then they are used like this:
         *
         * "queries" : {
         *     "isPasswordCorrect" : {
         *         "yes" : {
         *             "then"               : "isCreditCardOnFile"
         *         },
         *         "no"                     : "!wrongPassword" // <-- This is the mixin
         *     }
         * }
         *
         * @param query The query in which the mixins are being replaced
         * @param workflow The workflow being imported
         */
        replaceMixins : function(query,workflow) {
            this.replace(workflow.queries[query],workflow.mixins,'!',true,'mixin');
        },

        /**
         * Multipurpose function for replacing a key that is prepended with a string with a value, in an
         * object (recursively if needed)
         *
         * @param target The target object in which the replacements should be made
         * @param source The source object containing the values that will be inserted
         * @param prepend The string prepended to they key (i.e. $foo, @bar, !baz)
         * @param recursive If true, replacements will be done recursively in all nested objects
         * @param type The type of replacement (mixin, variable, shortcut)
         */
        replace : function(target,source,prepend,recursive,type) {

            for (var item in target) {

                if (target.hasOwnProperty(item)) {

                    var thisItem                    = target[item];

                    /* Replace variables with values defined in config */
                    if (typeof thisItem === 'string' && thisItem.indexOf(prepend) === 0) {

                        if (source[thisItem]) {

                            this.log('replace', 'Replacing ' + thisItem + ' ' + type + ' with', source[thisItem],'DEBUG');

                            target[item]             = source[thisItem];
                        }

                    } else if (recursive && typeof thisItem === 'object') {

                        this.replace(thisItem,source,prepend,recursive,type);
                    }
                }
            }
        },

        /**
         * Sets the name for this Turbine instance
         *
         * @param name Instance name
         */
        setName : function(name) {
            this.name = name || this.name;
        },

        /**
         * Sets the log level
         *
         * @param level Log level (OFF, ERROR, WARN, INFO, or DEBUG)
         */
        setLogLevel : function(level) {
            this.logLevel = level || this.logLevel;
        },

        utils : {

            /**
             * Checks whether obj is an array
             *
             * @param obj The object to check
             */
            isArray : function(obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            },

            /**
             * Checks whether an object is an object literal (non-null, non-array)
             *
             * @param obj The object to check
             * @return {Boolean}
             */
            isObjLiteral : function(obj) {
                return typeof obj === 'object' && obj !== null && !this.isArray(obj);
            },

            /**
             * Recursively merges source object into target object
             *
             * @param target Target object
             * @param source Source object
             * @return {Object} Merged object
             */
            mergeObjects : function(target,source) {

                for (var i in source) {

                    if (source.hasOwnProperty(i)) {

                        if ((typeof target[i] === 'object' && target[i] !== null) && (typeof source[i] === 'object' && source[i] !== null)) {

                            target[i]           = this.mergeObjects(target[i],source[i]);

                        } else {

                            target[i]           = source[i];
                        }
                    }
                }

                return target;
            }
        }
    };

    window.Turbine = Turbine;

}(window));
/** @license Turbine.js | MIT License | https://github.com/wmbenedetto/turbine.js#mit-license */
if (typeof MINIFIED === 'undefined'){
    MINIFIED = false;
}
/**
 *   ________  ______  ____  _____   ________     _______
 *  /_  __/ / / / __ \/ __ )/  _/ | / / ____/    / / ___/
 *   / / / / / / /_/ / __  |/ //  |/ / __/  __  / /\__ \
 *  / / / /_/ / _, _/ /_/ // // /|  / /____/ /_/ /___/ /
 * /_/  \____/_/ |_/_____/___/_/ |_/_____(_)____//____/
 *
 * Turbine.js : The JavaScript Workflow Engine
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

    var $                                       = window.jQuery || null;

    if (!MINIFIED){

        var console                             = window.console || {};
        console.log                             = (typeof console.log   === 'function') ? console.log   : function() {};
        console.info                            = (typeof console.info  === 'function') ? console.info  : console.log;
        console.error                           = (typeof console.error === 'function') ? console.error : console.log;
        console.warn                            = (typeof console.warn  === 'function') ? console.warn  : console.log;
    }

    /**
     * Add bind() to Function prototype for browsers that don't yet support ECMAScript 5.
     *
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
     */
    if (typeof Function.prototype.bind !== 'function'){

        Function.prototype.bind = function(scope) {

            var self                            = this;

            return function() {
                return self.apply(scope,arguments);
            }
        };
    }

    /**
     * Initializes Turbine via initObj object.
     *
     * var initObj = {
     *
     *     // REQUIRED
     *     workflow    : {},
     *
     *     // OPTIONAL
     *     name        : '',
     *     logLevel    : '',
     *     queries     : {},
     *     responses   : {},
     *     resets      : {},
     *     init        : function(){},
     *     log         : function(){},
     *     publish     : function(){},
     *     listen      : function(){},
     *     remove      : function(){},
     *     report      : function(){}
     * };
     *
     * The initObj must define the workflow.
     *
     * It can also optionally define functions for publish(),
     * listen(), and remove(). If these aren't defined, jQuery's
     * trigger/bind/unbind will be used by default.
     *
     * The initObj can also define query and reset functions; default responses;
     * function definitions for init(), log(), and report(); the name of this
     * Turbine instance (used for logging); and the logLevel.
     *
     * @param initObj Initialization object
     */
    var Turbine = function Turbine(initObj) {

        if (typeof initObj !== 'object' || initObj === null){

            var errorMsg                        = 'Turbine constructor must be passed an initialization object';

            this.report({
                handle                          : 'INIT_OBJ_NOT_DEFINED',
                desc                            : errorMsg
            });

            throw new Error(errorMsg);
        }

        if (!MINIFIED){

            this.logLevels = {
                OFF                             : 0,
                ERROR                           : 1,
                WARN                            : 2,
                INFO                            : 3,
                DEBUG                           : 4,
                TRACE                           : 5
            };
        }

        this.always                             = {};
        this.alwaysWaitFor                      = {};
        this.currentQuery                       = null;
        this.dirtyQueries                       = {};
        this.globalTimeoutAllowed               = false;
        this.logLevel                           = initObj.logLevel  || 'ERROR';
        this.name                               = initObj.name      || 'Turbine';
        this.mixins                             = {};
        this.numGlobalListeners                 = 0;
        this.queries                            = {};
        this.queryOrder                         = [];
        this.resets                             = {};
        this.responses                          = {};
        this.shortcuts                          = {};
        this.started                            = false;
        this.killed                             = false;
        this.variables                          = {};
        this.waitingFor                         = null;
        this.workflow                           = {};

        this.timers = {
            queries                             : {},
            delay                               : null,
            global                              : null
        };

        this.initPubSub();
        this.importFunctions(initObj);
        this.importObjects(initObj);
        this.importAlways();
        this.importMixins();
        this.importWorkflow(initObj);

        if (typeof initObj.init === 'function'){
            initObj.init(this);
        }
    };

    /**
     * Turbine class prototype
     */
    Turbine.prototype = {

        DEFAULT_GLOBAL_TIMEOUT                  : 3600000, // one hour, in milliseconds

        /**
         * Initializes default publish/listen/remove functions.
         * These can be overridden by functions defined the initObj
         * passed to the Turbine constructor
         */
        initPubSub : function(){

            var self                            = this;

            this.pubsub = {

                publish : function(message,payload){
                    $(self).trigger(message,payload);
                },

                listen : function(message,handler){
                    $(self).on(message,function(e) {
                        handler(e.type, e.data);
                    });
                },

                remove : function(message){
                    $(self).unbind(message);
                }
            }
        },

        /**
         * Imports valid functions specified in initObj to Turbine
         *
         * @param initObj Initialization object
         */
        importFunctions : function(initObj) {

            if (!MINIFIED){
                this.log('importFunctions', 'Importing functions', null, 'DEBUG');
            }

            var thisFunc                        = null;
            var importedFunctions               = {};
            var validFunctions = [
                'init',
                'log',
                'publish',
                'listen',
                'remove',
                'report'
            ];

            for (var i=0;i<validFunctions.length;i++) {

                thisFunc                        = validFunctions[i];

                if (!MINIFIED){
                    this.log('importFunctions', '--> Importing ' + thisFunc + '() function', null, 'DEBUG');
                }

                if (typeof initObj[thisFunc] === 'function') {

                    this[thisFunc]              = initObj[thisFunc];

                    importedFunctions[thisFunc] = true;
                }
            }

            if (!$ && (!('publish' in importedFunctions) || !('listen' in importedFunctions) || !('remove' in importedFunctions))) {

                var errorMsg                    = '[' + this.name + '.importFunctions()] You must either define publish(), listen(), and remove() functions via the initObj passed to the Turbine constructor, or you must include jQuery in the page.';

                this.report({
                    handle                      : 'REQUIRED_FUNCTIONS_NOT_DEFINED',
                    desc                        : errorMsg
                });

                throw new Error(errorMsg);
            }
        },

        /**
         * Imports valid objects specified in initObj to Turbine
         *
         * @param initObj Initialization object
         */
        importObjects : function(initObj) {

            if (!MINIFIED){
                this.log('importObjects', 'Importing objects', null, 'DEBUG');
            }

            var thisObj                         = null;
            var validObjects = [
                'queries',
                'resets',
                'responses',
                'shortcuts',
                'variables',
                'always',
                'mixins'
            ];

            for (var i=0;i<validObjects.length;i++) {

                thisObj                         = validObjects[i];

                if (!MINIFIED){
                    this.log('importObjects', '--> Importing ' + thisObj + ' object', null, 'DEBUG');
                }

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

                if (!MINIFIED){
                    this.log('importWorkflow', 'Importing workflow', null, 'DEBUG');
                }

                this.workflow                       = initObj.workflow || {};

                this.replaceMixins(this.workflow);

                if (this.utils.isObjLiteral(initObj.workflow)) {
                    this.importQueries(initObj.workflow);
                }

            } else {

                var errorMsg                    = '[' + this.name + '.importWorkflow()] Could not import workflow. Workflow must be an object literal.';

                this.report({
                    handle                      : 'COULD_NOT_IMPORT_WORKFLOW',
                    desc                        : errorMsg
                });

                throw new Error(errorMsg);
            }
        },

        /**
         * Imports "always" from initObj
         */
        importAlways : function() {

            if (!MINIFIED){
                this.log('importAlways', 'Importing always', this.always, 'DEBUG');
            }

            if (typeof this.always.waitFor !== 'undefined'){

                this.replaceShortcuts(this.always.waitFor);
                this.replaceVariables(this.always.waitFor);

                var result                      = this.parseWaitFor(this.always.waitFor);

                this.alwaysWaitFor              = result.nextQueryObj;
                this.numAlwaysWaitFor           = result.waitingFor.length;

                if (!MINIFIED){
                    this.log('importAlways', 'Always wait for', this.alwaysWaitFor, 'DEBUG');
                }
            }

            /* If a global timeout is specified then global timeouts are allowed by default */
            this.globalTimeoutAllowed           = typeof this.always.timeout !== 'undefined';
        },

        /**
         * Imports mixins, recursively replacing any nested mixins
         */
        importMixins : function(){

            if (!MINIFIED){
                this.log('importMixins', 'Importing mixins', this.mixins, 'DEBUG');
            }

            for (var mixin in this.mixins){

                if (this.mixins.hasOwnProperty(mixin)){
                    this.replaceMixins(this.mixins[mixin]);
                }
            }
        },

        /**
         * Imports workflow queries
         *
         * @param workflow The workflow object containing the queries
         */
        importQueries : function(workflow) {

            if (!MINIFIED){
                this.log('importQueries', 'Importing queries', workflow, 'DEBUG');
            }

            var totalQueries                    = 0;

            /* Imports each query in the workflow */
            for (var query in workflow) {

                if (workflow.hasOwnProperty(query)) {

                    this.importQuery(query,workflow);

                    totalQueries               += 1;
                }
            }

            if (totalQueries === 0) {

                var errorMsg                    = '[' + this.name + '.importQueries()] The workflow has no queries to import';

                this.report({
                    handle                      : 'NO_QUERIES_TO_IMPORT',
                    desc                        : errorMsg
                });

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

            if (!MINIFIED){
                this.log('importQuery', 'Importing workflow query: ' + query, workflow[query], 'TRACE');
            }

            this.queries[query]                 = this.queries[query] || null;

            /* Store queries in array so they can be accessed numerically */
            this.queryOrder.push(query);

            this.replaceMixins(query);

            for (var response in workflow[query]) {

                if (workflow[query].hasOwnProperty(response)) {
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

            var thisResponse                    = workflow[query][response];

            if (!MINIFIED){
                this.log('importResponse', 'Importing ' + response + ' response to ' + query + ' query', thisResponse, 'TRACE');
            }

            /* Add counter to any repeat object */
            if (thisResponse.repeat) {
                thisResponse.repeat.counter = 0;
            }

            this.replaceShortcuts(thisResponse);
            this.replaceVariables(thisResponse);
        },

        /**
         * Default log() implementation
         *
         * This can be overridden by defining a log() function in the initObj
         * passed to the constructor
         *
         * @param funcName The name of the function generating the log message
         * @param message The message to log
         * @param payload Data object
         * @param level Log level (ERROR, WARN, INFO, DEBUG)
         */
        log : function(funcName,message,payload,level) {

            if (!MINIFIED){
                payload                         = (!payload) ? '' : payload;
                level                           = (!level) ? 'INFO' : level;
                message                         = '[' + this.name + '.' + funcName + '()] ' + message;

                if (this.isLoggable(level)) {

                    switch (level){

                        case 'ERROR':
                            console.error(message,payload);
                            break;
                        case 'WARN':
                            console.warn(message,payload);
                            break;
                        case 'INFO':
                            console.info(message,payload);
                            break;
                        default:
                            console.log(message,payload);
                            break;
                    }
                }
            }
        },

        /**
         * Checks whether the given level is loggable based on the
         * current log level
         *
         * @param level The level to check
         * @return {Boolean}
         */
        isLoggable : function(level){

            if (!MINIFIED){
                return this.logLevels[level] <= this.logLevels[this.logLevel];
            }

            return false;
        },

        /**
         * Default implementation of report() method. Used to report errors in Turbine.
         * This can be overridden by defining a report() method in the initObj passed to
         * the constructor.
         *
         * @param obj Object containing handle, description, and/or payload
         */
        report : function(obj) {

            if (!MINIFIED){

                obj                             = (this.utils.isObjLiteral(obj)) ? obj : {};
                var handle                      = obj.handle || 'WORKFLOW_ISSUE_REPORTED';
                var desc                        = obj.description || '';

                this.log('report', handle + ': ' + desc, obj, 'ERROR');
            }

            return null;
        },

        /**
         * Default implementation of publish() method, using jQuery's trigger() function
         * to publish messages.
         *
         * This can be overridden by defining a publish() method in the initObj passed to
         * the constructor.
         *
         * @param message The message or array of messages to publish
         * @param payload Data object
         * @param callback Function to call once message(s) is published
         */
        publish : function(message,payload,callback) {

            payload                             = payload || {};

            if (!MINIFIED){
                this.log('publish', 'Publishing message:', message);
            }

            if (typeof message === 'string') {
                message                         = [message];
            }

            for (var i=0;i<message.length;i++) {
                this.pubsub.publish(message[i],payload);
            }

            if (typeof callback === 'function') {
                callback();
            }
        },

        /**
         * Default implementation of listen() method, using jQuery's bind() function
         * to bind handlers to messages.
         *
         * This can be overridden by defining a listen() method in the initObj passed to
         * the constructor.
         *
         * @param message The message for which to listen
         * @param handler The function to execute upon receiving the message
         */
        listen : function(message,handler) {

            if (!MINIFIED){
                this.log('listen', 'Adding listener for:', message, 'TRACE');
            }

            if (typeof message === 'string') {
                message                         = [message];
            }

            for (var i=0;i<message.length;i++) {
                this.pubsub.listen(message[i],handler);
            }
        },

        /**
         * Default implementation of remove() method, using jQuery's unbind() function
         * to unbind handlers from messages.
         *
         * This can be overridden by defining a remove() method in the initObj passed to
         * the constructor.
         *
         * @param message The message for which to stop listening
         */
        remove : function(message) {

            if (!MINIFIED){
                this.log('remove', 'Removing listener for:', message, 'TRACE');
            }

            if (typeof message === 'string') {
                message                         = [message];
            }

            for (var i=0;i<message.length;i++) {
                 this.pubsub.remove(message[i]);
            }
        },

        /**
         * Starts Turbine by executing the first queued query
         */
        start : function() {

            if (this.isKilled()){

                if (!MINIFIED){
                    this.log('start', 'Cannot start Turbine. It has already been killed.', null, 'ERROR');
                }

                return null;
            }

            if (!MINIFIED){
                this.log('start', 'Starting Turbine');
            }

            this.started                        = true;

            this.queue(null,this.getStartingQuery());
            this.next();
        },

        /**
         * Stops Turbine
         */
        stop : function() {

            if (!MINIFIED){
                this.log('stop', 'Stopping Turbine');
            }

            this.started                        = false;

            this.rewind();
        },

        /**
         * Kills Turbine (It is stopped and can't be restarted)
         */
        kill : function(){

            if (!MINIFIED){
                this.log('kill', 'Killing Turbine');
            }

            this.started                        = false;
            this.killed                         = true;

            this.rewind();
        },

        /**
         * Shortcut for executing next query
         */
        next : function() {

            if (this.isKilled() || this.nextQuery === null) {
                return null;
            }

            if (!MINIFIED){
                this.log('next', 'Executing next workflow query:', this.nextQuery, 'TRACE');
            }

            this.exec(this.nextQuery);
        },

        /**
         * Executes a query
         *
         * @param query The query to execute
         */
        exec : function(query) {

            this.clearTimers();

            if (this.isKillQuery(query)) {
                this.kill();
            }

            if (this.isStopQuery(query)) {
                this.stop();
                return null;
            }

            if (this.isKilled()) {
                return null;
            }

            this.currentQuery                   = query;
            this.nextQuery                      = null;
            this.responses[query]               = this.getResponse(query);

            /* If the query doesn't exist, we can't go any further */
            if (!this.utils.isObjLiteral(this.workflow[query])) {

                this.report({
                    handle                      : 'QUERY_DOES_NOT_EXIST',
                    desc                        : '[' + this.name + '.exec()] ' + query + ' query does not exist'
                });

                return null;
            }

            var responseName                    = this.responses[query];
            var responseObj                     = this.workflow[query][responseName];

            /* If the response doesn't exist, check if a default response has been specified */
            if (!responseObj) {

                responseName                    = 'default';
                responseObj                     = this.workflow[query][responseName];

                /* If there's no default response specified either, then there's nothing else we can do */
                if (!responseObj) {

                    this.report({
                        handle                  : 'RESPONSE_DOES_NOT_EXIST',
                        desc                    : '[' + this.name + '.exec()] ' + responseName + ' response does not exist for the ' + query + ' query'
                    });

                    return null;
                }
            }

            if (!MINIFIED){
                this.log('exec', 'Executing the ' + responseName + ' response to the ' + query + ' query', responseObj, 'DEBUG');
            }

            responseObj.responseName            = responseName;

            this.processResponse(query,responseObj);
        },

        /**
         * Processes a query's response, executing its the workflow logic
         *
         * @param query The query containing the response to process
         * @param response The response to process
         * @param preventGlobalTimeout If true, global timeout will not be started
         */
        processResponse : function(query,response,preventGlobalTimeout) {

            this.clearTimers();

            if (this.isKilled()) {
                return null;
            }

            if (!MINIFIED){
                this.log('processResponse', 'Processing response to '+query+' query', response, 'TRACE');
            }

            if (!preventGlobalTimeout) {
                this.startGlobalTimeout(query,response);
            }

            if (response.delay && !response.isAfterDelay) {

                this.startDelayTimeout(query,response);

            } else {

                /* "report" tells us to report an issue. We only want to report it once, so
                 * we ignore it if we're processing the response as part of a publish callback */
                if (response.report && !response.isPublishCallback) {
                    this.reportIssueFromWorkflow(query,response);
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

                        /* Clean up isAfterDelay flag */
                        if (response.isAfterDelay) {

                            try {
                                delete response.isAfterDelay;
                            } catch (e) {
                                response.isAfterDelay       = undefined;
                            }
                        }

                        /* "repeat" repeats query */
                        this.repeat(query,response);

                    }
                    /* "waitFor" tells us to wait for a message (or messages) before executing "then" query */
                    else if (response.waitFor) {

                        this.queue(response.waitFor,response.then);

                    }
                    /* Otherwise, "then" query gets executed immediately */
                    else if (response.then){

                        if (this.isEarlierQuery(response.then,this.currentQuery)){
                            this.rewind(this.currentQuery,response.then);
                        }

                        this.exec(response.then);
                    }

                    /* Clean up isPublishCallback flag */
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

                    /* Clean up isAfterDelay flag */
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
         * Reports an issue from the workflow
         *
         * @param query The query being executed
         * @param response The response containing the report
         */
        reportIssueFromWorkflow : function(query,response){

            var responseName                    = this.responses[query];
            response.report                     = (this.utils.isObjLiteral(response.report)) ? response.report : {};

            /* Add workflow info to report */
            response.report.workflow = {
                name                            : this.name,
                query                           : query,
                response                        : responseName,
                responseObj                     : this.workflow[query][responseName],
                timestamp                       : new Date().getTime()
            };

            this.report(response.report);
        },

        /**
         * Sets response timeout
         *
         * @param query The query being executed
         * @param response The response containing the timeout
         */
        setResponseTimeout : function(query, response) {

            if (!this.timers.queries[query]) {
                this.timers.queries[query]      = [];
            }

            var self                            = this;

            var timeout = setTimeout(function() {

                self.onResponseTimeout(query,response);

            },response.timeout.after);

            this.timers.queries[query].push(timeout);
        },

        /**
         * Repeats query on each message until limit is reached, after which the
         * fallback response is performed. If the limit is null, query can repeat infinitely.
         *
         * @param query The query to repeat
         * @param response The response to repeat
         */
        repeat : function(query,response) {

            response.repeat.counter            += 1;

            if (!MINIFIED){
                this.log('repeat', 'Repeating ' + query + ' (' + response.repeat.counter + ' of ' + response.repeat.limit + ' max)');
            }

            /* If the limit is null, repeat query indefinitely */
            if (response.repeat.limit === null) {

                this.queue(response.waitFor,query);
            }
            /* If the limit has been reached, use fallback response */
            else if (response.repeat.counter >= response.repeat.limit) {

                if (!MINIFIED){
                    this.log('repeat', 'Maximum repeat limit for ' + query + ' reached or exceeded (' + response.repeat.counter + ' of ' + response.repeat.limit + ' max)');
                }

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
                        response.waitFor        = response.waitFor.slice(0,response.waitFor.length - this.numAlwaysWaitFor);
                    }

                    this.queue(response.waitFor,query);

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
         */
        rewind : function(from,to) {

            this.clearTimers();

            var clearing                        = false;
            var numQueries                      = this.queryOrder.length;
            from                                = from || this.queryOrder[numQueries-1];
            to                                  = to || this.queryOrder[0];

            if (!MINIFIED){
                this.log('rewind', 'Rewinding from ' + from + ' to ' + to, null, 'DEBUG');
            }

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
        },

        /**
         * Checks whether the new query is earlier than the current query
         * (e.g. we're going backwards in the workflow)
         *
         * @param nextQuery The query to execute next
         * @param currentQuery The query we're currently executing
         */
        isEarlierQuery : function(nextQuery,currentQuery) {

            if (currentQuery === nextQuery) {
                return false;
            }

            for (var i=0;i<this.queryOrder.length;i++) {

                if (this.queryOrder[i] === nextQuery) {
                    return true;
                }

                if (this.queryOrder[i] === currentQuery) {
                    return false;
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

            if (!MINIFIED){
                this.log('clear', 'Clearing ' + query, null, 'DEBUG');
            }

            this.clearQueryTimer(query);

            /* Reset counters for repeat queries */
            for (var response in this.workflow[query]) {

                if (this.workflow[query].hasOwnProperty(response) && this.workflow[query][response].repeat) {

                    this.workflow[query][response].repeat.counter = 0;
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
         * Resets the response to a query
         *
         * @param query The query for which the response should be reset
         */
        resetResponse : function(query) {

            /* If the query is dirty, just clear the dirty flag. Don't reset the response. */
            if (this.isDirtyQuery(query)){

                this.dirtyQueries[query]        = null;

            }
            /* If the query isn't dirty, reset the response */
            else {

                var didReset                    = false;

                if (typeof this.resets[query] === 'function'){

                    this.responses[query]       = this.resets[query]();
                    didReset                    = true;

                } else if (typeof this.resets[query] !== 'undefined'){

                    this.responses[query]       = this.resets[query];
                    didReset                    = true;
                }

                if (!MINIFIED){

                    if (didReset){
                        this.log('resetResponse', 'Reset ' + query + ' response to', this.responses[query] || 'false', 'DEBUG');
                    }
                }
            }
        },

        /**
         * Callback executed when query response times out
         *
         * @param query The query being executed
         * @param response The response containing the timeout
         */
        onResponseTimeout : function(query,response) {

            if (!MINIFIED){
                this.log('onResponseTimeout', 'The ' + query + ' response timed out.', response, 'WARN');
            }

            if (this.waitingFor) {
                this.remove(this.waitingFor);
            }

            /* Set flag so timeout isn't triggered again during reprocessing */
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

            if (!MINIFIED){
                this.log('publishAndWait', 'Publishing message and waiting for response', {

                    message                     : message,
                    using                       : using,
                    response                    : response
                });
            }

            /* After message is published, callback must be called to process the rest of the response */
            var callback = function() {

                response.isPublishCallback      = true;

                self.processResponse(query,response);
            };

            this.publish(message,using,callback);
        },

        /**
         * Merges response's "using" object with always.using object (if it is defined).
         *
         * @param using The response's "using" object
         */
        getUsingObject : function(using) {

            using                               = (typeof using === 'undefined') ? {} : using;

            /* If an always.using object has been defined, merge it into the response's using object */
            if (this.always.using) {
                using                           = this.utils.mergeObjects(using,this.always.using);
            }

            if (!MINIFIED){
                this.log('getUsingObject', 'Getting using object', using, 'TRACE');
            }

            return using;
        },

        /**
         * Starts delay timer
         *
         * @param query The query being delayed
         * @param response The response being delayed
         */
        startDelayTimeout : function(query,response) {

            if (!MINIFIED){
                this.log('startDelayTimeout',query + ' delay started. Delayed for ' + response.delay.for + ' ms', response);
            }

            var self                            = this;

            this.timers.delay = setTimeout(function() {

                self.onDelayTimeout(query,response);

            },response.delay.for);
        },

        /**
         * Callback executed when delay timer expires
         *
         * @param query The query being delayed
         * @param response The response being delayed
         */
        onDelayTimeout : function(query,response) {

            if (!MINIFIED){
                this.log('onDelayTimeout',query + ' delay completed after ' + response.delay.for + ' ms', response);
            }

            this.processResponse(query,response.delay);
        },

        /**
         * Gets the query with which to start the workflow. If a @start shortcut
         * is specified, that is used. Otherwise, the first query in the workflow is used.
         *
         * @return {String}
         */
        getStartingQuery : function() {

            var start                           = this.getShortcut('start');

            return (start) ? start : this.queryOrder[0];
        },

        /**
         * Queues query to be executed on next message
         *
         * @param waitFor The message(s) to wait for before executing the next query
         * @param nextQuery The query to queue
         */
        queue : function(waitFor,nextQuery) {

            if (this.waitingFor) {
                this.remove(this.waitingFor);
            }

            var result                          = this.parseWaitFor(waitFor,nextQuery,true);

            this.waitingFor                     = result.waitingFor;
            this.nextQueryObj                   = result.nextQueryObj;
            this.nextQuery                      = nextQuery;

            if (this.waitingFor.length > 0){
                this.listen(this.waitingFor,this.handleIncomingMessage.bind(this));
            }

            if (!MINIFIED){

                if (this.waitingFor.length > 0){
                    this.log('queue', 'Waiting for', this.waitingFor);
                }

                this.log('queue', 'Queuing next query', this.nextQueryObj);
            }
        },

        /**
         * Parses waitFor into two forms: an array of the messages to wait for,
         * and an object that maps messages to the next query to execute when the
         * message is received.
         *
         * waitFor can either be a message, an array of messages, an object with a
         * message property, or an array of objects with message properties.
         *
         * @param waitFor Message or array of messages to wait for
         * @param nextQuery The query to queue ("then")
         * @param appendAlwaysWaitFor If true, always waitFor values are included
         */
        parseWaitFor : function(waitFor,nextQuery,appendAlwaysWaitFor) {

            var waitingFor                      = [];
            var nextQueryObj                    = {};

            if (waitFor){

                /* waitFor is a single message, so we map it to nextQuery */
                if (typeof waitFor === 'string'){

                    waitingFor.push(waitFor);
                    nextQueryObj[waitFor] = nextQuery;

                } else {

                    if (this.utils.isObjLiteral(waitFor)) {
                        waitFor                 = [waitFor];
                    }

                    for (var j=0;j<waitFor.length;j++){

                        if (typeof waitFor[j] === 'string'){

                            waitingFor.push(waitFor[j]);
                            nextQueryObj[waitFor[j]] = nextQuery;

                        } else if (typeof waitFor[j].message !== 'undefined'){

                            if (this.utils.isArray(waitFor[j].message)){

                                for (var k=0;k<waitFor[j].message.length;k++){
                                    waitingFor.push(waitFor[j].message[k]);
                                    nextQueryObj[waitFor[j].message[k]] = waitFor[j].then || nextQuery;
                                }

                            } else {

                                waitingFor.push(waitFor[j].message);
                                nextQueryObj[waitFor[j].message] = waitFor[j].then || nextQuery;
                            }
                        }
                    }
                }
            }

            /* Add global listeners to waitingFor array, if they're not already there */
            if (appendAlwaysWaitFor){

                for (var msg in this.alwaysWaitFor) {

                    if (this.alwaysWaitFor.hasOwnProperty(msg)) {

                        waitingFor.push(msg);
                        nextQueryObj[msg] = this.alwaysWaitFor[msg] || nextQuery;
                    }
                }
            }

            return {
                waitingFor   : waitingFor,
                nextQueryObj : nextQueryObj
            }
        },

        /**
         * Handles an incoming message
         *
         * @param message The message being handled
         * @param payload The message payload
         */
        handleIncomingMessage : function(message,payload) {

            if (this.isKilled()) {
                return null;
            }

            if (!MINIFIED){
                this.log('handleIncomingMessage', 'Handling "'+message+'" message', payload);
            }

            if (this.waitingFor) {

                this.remove(this.waitingFor);

                this.nextQuery                  = this.getNextQuery(message);
            }

            this.waitingFor                     = null;

            if (this.isEarlierQuery(this.nextQuery,this.currentQuery)){
                this.rewind(this.currentQuery,this.nextQuery);
            }

            if (!this.isKilled()){
                this.next();
            }

            return true;
        },

        /**
         * Gets the next query to execute based on the message being handled.
         *
         * @param message The message being handled
         */
        getNextQuery : function(message) {

            var next                            = null;

            for (var msg in this.nextQueryObj) {

                if (this.nextQueryObj.hasOwnProperty(msg) && message === msg) {
                    next                        = this.nextQueryObj[msg];
                    break;
                }
            }

            if (!MINIFIED){
                this.log('getNextQuery', 'Getting the next query: '+next, null, 'TRACE');
            }

            return next;
        },

        /**
         * Clears all timers: queries, delays, and global
         */
        clearTimers : function() {

            if (!MINIFIED){
                this.log('clearTimers', 'Clearing all timers', this.timers, 'TRACE');
            }

            this.clearAllQueryTimers();
            this.clearGlobalTimer();
            this.clearDelayTimer();
        },

        /**
         * Clears all timers for all queries
         */
        clearAllQueryTimers : function() {

            if (!MINIFIED){
                this.log('clearAllQueryTimers', 'Clearing all query timers', this.timers.queries, 'TRACE');
            }

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

                if (!MINIFIED){
                    this.log('clearQueryTimer', 'Clearing '+query+' query timer', this.timers.queries[query], 'TRACE');
                }

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

                if (!MINIFIED){
                    this.log('clearGlobalTimer', 'Clearing global timer', this.timers.global, 'TRACE');
                }

                clearTimeout(this.timers.global);

                this.timers.global              = null;
            }
        },

        /**
         * Clears delay timer
         */
        clearDelayTimer : function() {

            if (this.timers.delay !== null) {

                if (!MINIFIED){
                    this.log('clearDelayTimer', 'Clearing delay timer', this.timers.delay, 'TRACE');
                }

                clearTimeout(this.timers.delay);

                this.timers.delay               = null;
            }
        },

        /**
         * Starts global timeout timer, which will fire if Turbine hasn't reached a stop
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

            if (!MINIFIED){
                this.log('startGlobalTimeout', 'Starting global timer', this.always.timeout, 'TRACE');
            }

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

            if (this.utils.isObjLiteral(this.always.timeout) && typeof this.always.timeout.after !== 'undefined'){

                return this.always.timeout.after;

            } else {

                return this.DEFAULT_GLOBAL_TIMEOUT;
            }
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

            if (!MINIFIED){
                this.log('onGlobalTimeout', 'Turbine timed out on ' + query + ' query after ' + this.getGlobalTimeout() + ' ms',null,'ERROR');
            }

            /* Set flag so timeout isn't triggered again during reprocessing */
            this.always.timeout.isAfterTimeout  = true;

            this.processResponse(null,this.always.timeout,true);
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
         * Checks whether Turbine has been killed
         */
        isKilled : function() {
            return this.killed === true;
        },

        /**
         * Checks whether Turbine is stopped
         */
        isStopped : function() {
            return this.started !== true;
        },

        /**
         * Checks whether Turbine is started
         *
         * @return {Boolean}
         */
        isStarted : function(){
            return this.started === true;
        },

        /**
         * Checks whether the query is a stop query, meaning
         * the workflow should stop when it is encountered.
         *
         * @param query The query to check
         */
        isStopQuery : function(query) {
            return query === 'stop.'
        },

        /**
         * Checks whether the query is a kill query, meaning
         * the workflow should be killed when it is encountered.
         *
         * @param query The query to check
         */
        isKillQuery : function(query) {
            return query === 'kill!'
        },

        /**
         * Checks whether a query is "dirty": its response has been set
         * via setResponse() while waiting for a message.
         *
         * @param query The query to check
         * @returns {boolean}
         */
        isDirtyQuery : function(query){
            return this.dirtyQueries[query] === true;
        },

        /**
         * Sets response to query
         *
         * @param query The query for which to set the response
         * @param response The response to set
         */
        setResponse : function(query,response) {

            if (!MINIFIED){
                this.log('setResponse', 'Setting "' + query + '" response to ' + response);
            }

            this.responses[query]               = response;
            this.dirtyQueries[query]            = true;
        },

        /**
         * Gets the response to a query
         *
         * @param query The query for which to get the response
         */
        getResponse : function(query) {

            this.responses[query]               = (this.hasQueryFunction(query)) ? this.queries[query]() : this.responses[query];

            /* Convert boolean result to yes/no string */
            if (typeof this.responses[query] === 'boolean' || this.responses[query] === null || typeof this.responses[query] === 'undefined') {
                this.responses[query]           = (this.responses[query]) ? 'yes' : 'no';
            }

            if (!MINIFIED){
                this.log('getResponse',query + '?', this.responses[query]);
            }

            return this.responses[query];
        },

        /**
         * Gets value of variable
         *
         * @param varName The name of the variable for which to get the value
         * @return {*}
         */
        getVar : function(varName) {

            /* Prepend dollar sign if not already there */
            varName                             = (varName.indexOf('$') === 0) ? varName.substr(1) : varName;

            return (typeof this.variables[varName] !== 'undefined') ? this.variables[varName] : null;
        },

        /**
         * Gets value of  shortcut
         *
         * @param shortcut The name of the shortcut for which to get the value
         * @return {*}
         */
        getShortcut : function(shortcut) {

            /* Prepend @ symbol if not already there */
            shortcut                            = (shortcut.indexOf('@') !== 0) ? '@' + shortcut : shortcut;

            return this.shortcuts[shortcut] || null;
        },

        /**
         * Replaces variables in workflow with values.
         *
         * Variables are defined in the initObj passed to the Turbine constructor. They are always
         * prepended with a $ when referenced in the workflow.
         *
         * They work just like variables in any other programming language. Define them and
         * then the value of the variable is used in its place.
         *
         * NOTE: Variables can only be used for scalar values. To replace non-scalar values,
         * use mixins instead.
         *
         *
         * "variables" : {
         *     "startOverTimeout"       : "30000"
         * }
         *
         * "workflow" : {
         *     "isStartOverAllowed" : {
         *         "yes" : {
         *             "waitFor"            : "App|process|restarted",
         *             "timeout" : {
         *                 "after"          : "$startOverTimeout", // <-- This is the variable
         *                 "then"           : "stop."
         *             },
         *             "then"               : "@start"
         *         },
         *         "no" : {
         *             "then"               : "stop."
         *         }
         *     }
         * }
         *
         * @param target The response in which the variables are being replaced
         */
        replaceVariables : function(target) {

            var thisTarget, thisVar, replaceWith;

            for (var variable in this.variables){

                if (this.variables.hasOwnProperty(variable)){

                    for (var item in target) {

                        if (target.hasOwnProperty(item)) {

                            thisTarget          = target[item];
                            thisVar             = '$'+variable;
                            replaceWith         = this.variables[variable];

                            /* Replace variables with values defined in source */
                            if (typeof thisTarget === 'string' && thisTarget.indexOf(thisVar) > -1) {

                                if (!MINIFIED){
                                    this.log('replace', 'Replacing ' + thisVar + ' variable with "' + replaceWith + '"', null , 'TRACE');
                                }

                                target[item]    = thisTarget.replace(new RegExp('\\'+thisVar,'g'),replaceWith);

                            } else if (this.utils.isObjLiteral(thisTarget)) {

                                this.replaceVariables(thisTarget);
                            }
                        }
                    }
                }
            }
        },

        /**
         * Replaces shortcuts in workflow with shortcut values. Shortcuts are defined in the
         * initObj passed to the Turbine constructor, and are always prepended with an @ symbol
         * when referenced in the workflow.
         *
         * Shortcuts are a way to reference a particular query in the workflow with an alias,
         * rather than explicitly by name. For example, you may define a @start shortcut,
         * and then reference that with "then":
         *
         *
         * "shortcuts" : {
         *     "start"      : "isWorkflowActive"
         * }
         *
         * "workflow" : {
         *
         *     "isStartOverAllowed" : {
         *         "yes" : {
         *             "then"   : "@start" // <-- This is the shortcut
         *         },
         *         "no" : {
         *             "then"   : "stop."
         *         }
         *     }
         * }
         *
         * If you decide to change the starting query of the workflow, you don't have to find and
         * replace isWorkflowActive everywhere it occurs. Instead, you can just change the value of @start.
         *
         * @param response The response in which the shortcuts are being replaced
         */
        replaceShortcuts : function(response) {
            this.replace(response,this.shortcuts,'@',true,'shortcut');
        },

        /**
         * Replaces mixins in workflow with values.
         *
         * Mixins are a way to define an entire object as a reference, to avoid repeating the same
         * object over and over.
         *
         * Mixins are defined in their own object in the workflow. The mixin name is always
         * prepended with a plus sign when referenced in the workflow.
         *
         * For example:
         *
         * "mixins" : {
         *     "wrongPassword" : {
         *         "publish"               : "UI.fail.show.PASSWORD_INCORRECT",
         *         "then"                  : "stop."
         *     },
         *
         *     "DISCOUNT_APPLIED" : {
         *         "message"               : "Cart|discount|applied",
         *          "using" : {
         *              "content"           : "discountApplied",
         *              "discount"          : "$discountAmount"
         *          }
         *      }
         * }
         *
         * Then they are used like this:
         *
         * "queries" : {
         *     "isPasswordCorrect" : {
         *         "yes" : {
         *             "then"               : "isCreditCardOnFile"
         *         },
         *         "no"                     : "+wrongPassword"      // <-- This is a mixin
         *     },
         *     "isDiscountValid" : {
         *         publish                  : "+DISCOUNT_APPLIED",  // <-- This is a mixin
         *         then                     : "isCheckoutStarted"
         *     }
         * }
         *
         * Mixins are replaced recursively, so mixins can be nested within other mixins
         *
         * @param target The target object in which to replace mixins
         */
        replaceMixins : function(target) {
            this.replace(target,this.mixins,'+',true,'mixin');
        },

        /**
         * Multipurpose function for replacing a key that is prepended with a string with a value, in an
         * object (recursively if needed)
         *
         * @param target The target object in which the replacements should be made
         * @param source The source object containing the values that will be inserted
         * @param prepend The string prepended to they key (i.e. $foo, @bar, +baz)
         * @param recursive If true, replacements will be done recursively in all nested objects
         * @param type The type of replacement (mixin, shortcut)
         */
        replace : function(target,source,prepend,recursive,type) {

            for (var item in target) {

                if (target.hasOwnProperty(item)) {

                    var thisItem                = target[item];

                    /* Replace target with values defined in source */
                    if (typeof thisItem === 'string' && thisItem.indexOf(prepend) === 0) {

                        thisItem                = thisItem.substr(1);

                        if (source[thisItem]) {

                            if (!MINIFIED){
                                this.log('replace', 'Replacing ' + prepend + thisItem + ' ' + type + ' with', source[thisItem], 'TRACE');
                            }

                            target[item]        = source[thisItem];
                        }

                    } else if (recursive && typeof thisItem === 'object') {

                        this.replace(thisItem,source,prepend,recursive,type);
                    }
                }
            }
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
             * Checks whether an item is already in the source array
             *
             * @param item The item to check
             * @param source The source array in which to look
             * @return {Boolean}
             */
            inArray : function(item,source) {

                for (var i=0;i<source.length;i++) {

                    if (item === source[i]) {
                        return true;
                    }
                }

                return false;
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

    /* If RequireJS define() is present, use it to export Turbine */
    if (typeof define === "function") {

        define(function() {
            return Turbine;
        });
    }
    /* Otherwise, add Turbine to global namespace as Ron */
    else {

        window.Turbine = Turbine;
    }

}(window));
var TurbineTests = TestCase('TurbineTests', {

    setUp : function() {

        var self = this;

        this.query = {

            yes : {
                publish : {
                    message : ["Turbine|testing|started","Turbine|foo|started"],
                    using : {
                        foo : 'bar'
                    }
                },
                waitFor : "UI|button|clicked",
                repeat : {
                    limit : '$defaultLimit',
                    then : "@complete"
                }
            },
            no : '!testMixin'
        };

        this.queries = {
            isAvailable : self.query,
            isComplete : self.query
        };

        this.workflow = {

            config : {

                shortcuts : {
                    "@start" : "isAvailable",
                    "@complete" : "isComplete"
                },

                variables : {
                    "$testVar" : 1,
                    "$defaultLimit" : 5
                },

                always : {

                    timeout : {
                        after                           : 300000,
                        publish : {
                            message                     : "Turbine|start|transition",
                            using : {
                                module                  : "Status",
                                view                    : "Fail",
                                content                 : "fail.generalError",
                                download 		        : true,
                                tryAgain                : true
                            }
                        },
                        then                            : "done"
                    },

                    waitFor : [

                        {
                            "waitFor"                   : "*|issue|detected|STOP",
                            "then"                      : "done"
                        }
                    ]
                }
            },

            queries : self.queries,

            mixins : {

                "!testMixin" : {
                    waitFor                             : "UI|button|clicked",
                    then                                : 'done'
                }
            }
        };

        this.initObj = {

            name                            : 'TurbineTest',
            logLevel                        : 'DEBUG',
            workflow                        : self.workflow
        };
    },

    tearDown : function() {

    },

    testInvalidConstructor : function(){

        assertException('Exception thrown when Turbine constructed without init object',function(){
            var turbine = new Turbine();
        });
    },

    testIsArray : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('utils.isArray() correctly identifies array',turbine.utils.isArray([1,2,3]));
        assertFalse('utils.isArray() correctly identifies object literal as non-array',turbine.utils.isArray({ foo : 1 }));
        assertFalse('utils.isArray() correctly identifies null as non-array',turbine.utils.isArray(null));
        assertFalse('utils.isArray() correctly identifies string as non-array',turbine.utils.isArray('foo'));
        assertFalse('utils.isArray() correctly identifies number as non-array',turbine.utils.isArray(1));
        assertFalse('utils.isArray() correctly identifies boolean as non-array',turbine.utils.isArray(false));
        assertFalse('utils.isArray() correctly identifies function as non-array',turbine.utils.isArray(function(){}));
    },

    testInArray : function(){

        var turbine = new Turbine(this.initObj);

        var source = ['foo','bar','baz'];

        assertTrue('"foo" exists in array',turbine.utils.inArray('foo',source));
        assertFalse('"nope" doesn\'t exist in array',turbine.utils.inArray('nope',source));
    },

    testIsObjLiteral : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('utils.isObjLiteral() correctly identifies object literal',turbine.utils.isObjLiteral({ foo : 1 }));
        assertFalse('utils.isObjLiteral() correctly identifies array as non-object literal',turbine.utils.isObjLiteral([1,2,3]));
        assertFalse('utils.isObjLiteral() correctly identifies null as non-object literal',turbine.utils.isObjLiteral(null));
        assertFalse('utils.isObjLiteral() correctly identifies string as non-object literal',turbine.utils.isObjLiteral('foo'));
        assertFalse('utils.isObjLiteral() correctly identifies number as non-object literal',turbine.utils.isObjLiteral(1));
        assertFalse('utils.isObjLiteral() correctly identifies boolean as non-object literal',turbine.utils.isObjLiteral(false));
        assertFalse('utils.isObjLiteral() correctly identifies function as non-object literal',turbine.utils.isObjLiteral(function(){}));
    },

    testMergeObjects : function(){

        var obj1 = {

            foo : 1,
            baz : 3,

            quz : {
                qiz : 0
            }
        };

        var obj2 = {

            bar : 2,
            baz : 4,

            quz : {
                qaz : 0
            }
        };

        var turbine     = new Turbine(this.initObj);
        var mergedObj   = turbine.utils.mergeObjects(obj1,obj2);

        assertTrue('mergedObj has properties from both target and source objects', 'foo' in mergedObj && 'bar' in mergedObj && 'baz' in mergedObj && 'quz' in mergedObj);
        assertTrue('When property exists in both target and source objects, mergedObj has value from source',mergedObj.baz === 4);
        assertTrue('Object properties of target and source are merged recursively','qiz' in mergedObj.quz && 'qaz' in mergedObj.quz);
    },

    testReplace : function(){

        var target = {

            foo : "!mixin1",

            bar : {
                baz : "!mixin2"
            }
        };

        var source = {
            "!mixin1" : "This is mixin1",
            "!mixin2" : "This is mixin2"
        };

        var turbine = new Turbine(this.initObj);

        turbine.replace(target,source,'!',true,'mixin');

        assertTrue('Mixin replaced',target.foo === source['!mixin1']);
        assertTrue('Mixin replaced recursively',target.bar.baz === source['!mixin2']);
    },

    testDefaults : function(){

        var turbine = new Turbine(this.initObj);

        turbine.setDefaults();

        assertTrue('name is set to Turbine',turbine.name === 'Turbine');
        assertTrue('logLevel is set to ERROR',turbine.logLevel === 'ERROR');
        assertTrue('globalTimeoutAllowed is false',turbine.globalTimeoutAllowed === false);
        assertTrue('stopped is false',turbine.stopped === false);
        assertTrue('numGlobalListeners is 0',turbine.numGlobalListeners === 0);
        assertTrue('globalListeners is an object literal',turbine.utils.isObjLiteral(turbine.globalListeners));
        assertTrue('queries is an object literal',turbine.utils.isObjLiteral(turbine.queries));
        assertTrue('queryOrder is an array',turbine.utils.isArray(turbine.queryOrder));
        assertTrue('resets is an object literal',turbine.utils.isObjLiteral(turbine.resets));
        assertTrue('responses is an object literal',turbine.utils.isObjLiteral(turbine.responses));
        assertTrue('workflow is an object literal',turbine.utils.isObjLiteral(turbine.workflow));
        assertTrue('timers is an object literal',turbine.utils.isObjLiteral(turbine.timers));
        assertTrue('timers.queries is an object literal',turbine.utils.isObjLiteral(turbine.timers.queries));
        assertTrue('timers.delay is null',turbine.timers.delay === null);
        assertTrue('timers.global is null',turbine.timers.global === null);
        assertTrue('waitingFor is null',turbine.waitingFor === null);
    },

    testSetName : function(){

        var turbine = new Turbine(this.initObj);

        turbine.setName('Foo');

        assertTrue('name is set to Foo',turbine.name === 'Foo');
    },

    testSetLogLevel : function(){

        var turbine = new Turbine(this.initObj);

        turbine.setName('DEBUG');

        assertTrue('logLevel is set to DEBUG',turbine.logLevel === 'DEBUG');
    },

    testGetConfigShortcut : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('getting start via getConfigShortcut returns "isAvailable"',turbine.getConfigShortcut('start') === 'isAvailable');
        assertTrue('getting @start via getConfigShortcut returns "isAvailable"',turbine.getConfigShortcut('@start') === 'isAvailable');
    },

    testGetConfigVar : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('getting testVar via getConfigVar returns 1',turbine.getConfigVar('testVar') === 1);
        assertTrue('getting $testVar via getConfigVar returns 1',turbine.getConfigVar('$testVar') === 1);
    },

    testHasQueryFunction : function(){

        var turbine = new Turbine(this.initObj);

        assertFalse('query has no query function by default',turbine.hasQueryFunction('isAvailable'));
        assertFalse('non-existent query has no query function',turbine.hasQueryFunction('isFakeQuery'));

        turbine.queries.isAvailable = function(){
            return true;
        };

        assertTrue('query has query function',turbine.hasQueryFunction('isAvailable'));
    },

    testHasResetFunction : function(){

        var turbine = new Turbine(this.initObj);

        assertFalse('query has no reset function by default',turbine.hasResetFunction('isAvailable'));
        assertFalse('non-existent query has no reset function',turbine.hasResetFunction('isFakeQuery'));

        turbine.resets.isAvailable = function(){
            return false;
        };

        assertTrue('query has reset function',turbine.hasResetFunction('isAvailable'));
    },

    testResetResponse : function(){

        var turbine = new Turbine(this.initObj);

        turbine.responses.isAvailable = 'no';
        turbine.resetResponse('isAvailable');

        assertTrue('response reset to null when no reset function exists',turbine.responses.isAvailable === null);

        turbine.responses.isAvailable = 'no';

        turbine.resets.isAvailable = function(){
            return 'foo';
        };

        turbine.resetResponse('isAvailable');

        assertTrue('response reset to return value of reset function',turbine.responses.isAvailable === 'foo');
    },

    testGetResponse : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('response is "no" when no response is set',turbine.getResponse('isAvailable') === 'no');

        turbine.responses.isAvailable = true;

        assertTrue('response is "yes" when response is true',turbine.getResponse('isAvailable') === 'yes');

        turbine.responses.isAvailable = false;

        assertTrue('response is "no" when response is false',turbine.getResponse('isAvailable') === 'no');

        turbine.responses.isAvailable = 'TEST_RESPONSE';

        assertTrue('response value is returned directly when it is a string',turbine.getResponse('isAvailable') === 'TEST_RESPONSE');

        turbine.queries.isAvailable = function(){
            return 'foo';
        };

        assertTrue('query function result is returned when query function exists',turbine.getResponse('isAvailable') === 'foo');
    },

    testSetResponse : function(){

        var turbine = new Turbine(this.initObj);

        turbine.setResponse('isAvailable','THE_RESPONSE');

        assertTrue('response matches what was set',turbine.getResponse('isAvailable') === 'THE_RESPONSE');
    },

    testIsStopQuery : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('"done" is stop query',turbine.isStopQuery('done'));
        assertFalse('"other" is not stop query',turbine.isStopQuery('other'));
    },

    testIsStopped : function(){

        var turbine = new Turbine(this.initObj);

        assertFalse('Turbine is not stopped by default',turbine.isStopped());

        turbine.stopped = true;

        assertTrue('Turbine is stopped',turbine.isStopped());
    },

    testIsGlobalTimeoutAllowed : function(){

        var turbine = new Turbine({ workflow : {}});

        assertFalse('global timeout is not allowed by default',turbine.isGlobalTimeoutAllowed());

        turbine.globalTimeoutAllowed = true;

        assertTrue('global timeout is allowed',turbine.isGlobalTimeoutAllowed());
    },

    testGetGlobalTimeout : function(){

        var turbine = new Turbine({ workflow : {}});

        assertTrue('default global timeout is returned when none is set',turbine.getGlobalTimeout() === turbine.defaultGlobalTimeout);

        var turbine2 = new Turbine(this.initObj);

        assertTrue('global timeout from config is returned when one is set',turbine2.getGlobalTimeout() === this.initObj.workflow.config.always.timeout.after);
    },

    testClearDelayTimer : function(){

        var turbine = new Turbine(this.initObj);

        turbine.timers.delay = setTimeout(function(){},10000000);

        assertTrue('delay timer is set',typeof turbine.timers.delay === 'number');

        turbine.clearDelayTimer();

        assertTrue('delay timer is cleared',typeof turbine.timers.delay !== 'number');
    },

    testClearGlobalTimer : function(){

        var turbine = new Turbine(this.initObj);

        turbine.timers.global = setTimeout(function(){},10000000);

        assertTrue('global timer is set',typeof turbine.timers.global === 'number');

        turbine.clearGlobalTimer();

        assertTrue('global timer is cleared',typeof turbine.timers.global !== 'number');
    },

    testClearQueryTimer : function(){

        var turbine = new Turbine(this.initObj);

        turbine.timers.queries.isAvailable = [];
        turbine.timers.queries.isAvailable.push(setTimeout(function(){},10000000));
        turbine.timers.queries.isAvailable.push(setTimeout(function(){},10000000));
        turbine.timers.queries.isAvailable.push(setTimeout(function(){},10000000));

        assertTrue('all timers for query exist',turbine.timers.queries.isAvailable.length === 3);

        turbine.clearQueryTimer('isAvailable');

        assertTrue('all timers for query are deleted',typeof turbine.timers.queries.isAvailable === 'undefined');
    },

    testClearAllQueryTimers : function(){

        var turbine = new Turbine(this.initObj);

        turbine.timers.queries.isAvailable = [];
        turbine.timers.queries.isAvailable.push(setTimeout(function(){},10000000));

        turbine.timers.queries.isComplete = [];
        turbine.timers.queries.isComplete.push(setTimeout(function(){},10000000));

        assertTrue('all timers for isAvailable query exist',turbine.timers.queries.isAvailable.length === 1);
        assertTrue('all timers for isComplete query exist',turbine.timers.queries.isComplete.length === 1);

        turbine.clearAllQueryTimers();

        assertTrue('all query timers have been deleted',typeof turbine.timers.queries.isAvailable === 'undefined' && typeof turbine.timers.queries.isComplete === 'undefined');
    },

    testClearTimers : function(){

        var turbine = new Turbine(this.initObj);

        turbine.timers.global = setTimeout(function(){},10000000);
        turbine.timers.delay = setTimeout(function(){},10000000);

        turbine.timers.queries.isAvailable = [];
        turbine.timers.queries.isAvailable.push(setTimeout(function(){},10000000));

        turbine.timers.queries.isComplete = [];
        turbine.timers.queries.isComplete.push(setTimeout(function(){},10000000));

        assertTrue('delay timer is set',typeof turbine.timers.delay === 'number');
        assertTrue('global timer is set',typeof turbine.timers.global === 'number');
        assertTrue('all timers for isAvailable query exist',turbine.timers.queries.isAvailable.length === 1);
        assertTrue('all timers for isComplete query exist',turbine.timers.queries.isComplete.length === 1);

        turbine.clearTimers();

        assertTrue('delay timer is cleared',typeof turbine.timers.delay !== 'number');
        assertTrue('global timer is cleared',typeof turbine.timers.global !== 'number');
        assertTrue('all query timers have been deleted',typeof turbine.timers.queries.isAvailable === 'undefined' && typeof turbine.timers.queries.isComplete === 'undefined');
    },

    testGetStartingQuery : function(){

        var turbine = new Turbine({
            workflow : {
                queries : this.queries
            }
        });

        assertTrue('first query in query order is returned when no @start shortcut is set',turbine.getStartingQuery() === turbine.queryOrder[0]);

        var turbine2 = new Turbine(this.initObj);

        assertTrue('@start shortcut is returned when set',turbine.getStartingQuery() === this.initObj.workflow.config.shortcuts['@start']);

    },

    testGetUsingObject : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('Empty object is returned if using is undefined',typeof turbine.getUsingObject() === 'object');

        this.initObj.workflow.config.always.using = {
            foo : 1
        };

        var using = turbine.getUsingObject({ bar : 2 });

        assertTrue('Always using object is successfully merged into using object',using.foo === 1 && using.bar === 2);
    },

    testIsEarlierQuery : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('equal queries are earlier than each other',turbine.isEarlierQuery('isAvailable','isAvailable'));
        assertFalse('second query is not earlier than the first',turbine.isEarlierQuery('isComplete','isAvailable'));
        assertTrue('first query is earlier than the second',turbine.isEarlierQuery('isAvailable','isComplete'));
    },

    testSetResponseTimeout : function(){

        var turbine = new Turbine(this.initObj);

        turbine.setResponseTimeout('isAvailable',{ timeout : { after : 1000 }});
        turbine.setResponseTimeout('isAvailable',{ timeout : { after : 1000 }});
        turbine.setResponseTimeout('isAvailable',{ timeout : { after : 1000 }});

        assertTrue('response timeouts set for query',turbine.timers.queries.isAvailable.length === 3 && typeof turbine.timers.queries.isAvailable[0] === 'number');
    },

    testImportFunctions : function(){

        var turbine = new Turbine(this.initObj);

        var functions = {

            log                 : function(){ console.log('log'); },
            publish             : function(){ console.log('publish'); },
            listen              : function(){ console.log('listen'); },
            report              : function(){ console.log('report'); },
            remove              : function(){ console.log('remove'); },
            compare             : function(){ console.log('compare'); },
            invalidFunction     : function(){ console.log('invalidFunction'); }
        };

        turbine.importFunctions(functions);

        assertTrue('log function imported',turbine.log.toString() === functions.log.toString());
        assertTrue('publish function imported',turbine.publish.toString() === functions.publish.toString());
        assertTrue('listen function imported',turbine.listen.toString() === functions.listen.toString());
        assertTrue('report function imported',turbine.report.toString() === functions.report.toString());
        assertTrue('remove function imported',turbine.remove.toString() === functions.remove.toString());
        assertTrue('compare function imported',turbine.compare.toString() === functions.compare.toString());
        assertTrue('invalidFunction function not imported',typeof turbine.invalidFunction === 'undefined');
    },

    testImportObjects : function(){

        var turbine = new Turbine(this.initObj);

        var objects = {

            queries : {

                isAvailable : function(){
                    return true;
                }
            },

            resets : {

                isAvailable : function(){
                    return true;
                }
            },

            responses : {
                isAvailable : true
            },

            invalidObject : {}
        };

        turbine.importObjects(objects);

        assertTrue('queries object imported',typeof turbine.queries.isAvailable === 'function');
        assertTrue('resets object imported',typeof turbine.resets.isAvailable === 'function');
        assertTrue('responses object imported',typeof turbine.responses.isAvailable === 'boolean');
        assertTrue('invalidObject object not imported',typeof turbine.invalidObject === 'undefined');
    },

    testImportWorkflow : function(){

        assertException('missing workflow object in initObj throws exception',function(){
            var turbine = new Turbine({});
        });

        var turbine = new Turbine({

            workflow : {
                foo : 1
            }
        });

        assertTrue('workflow object imported',typeof turbine.workflow.foo !== 'undefined');
    },

    testImportConfig : function(){

        var turbine = new Turbine(this.initObj);

        turbine.importConfig(this.workflow);

        assertTrue('globalTimeoutAllowed is set',turbine.globalTimeoutAllowed === true);
    },

    testImportQueries : function(){

        var turbine = new Turbine(this.initObj);
        var self = this;

        assertException('exception thrown when there are no queries to import', function(){
            turbine.importQueries({});
        });

        assertNoException('No exception thrown when there are queries to import', function(){
            turbine.importQueries(self.workflow);
        });
    },

    testImportQuery : function(){

        var turbine = new Turbine(this.initObj);

        var origQueryOrderLength = turbine.queryOrder.length;

        turbine.importQuery('isAvailable',this.workflow);

        assertTrue('query imported with default value',turbine.queries.isAvailable === null);
        assertTrue('query added to queryOrder array',turbine.queryOrder.length === (origQueryOrderLength + 1) && turbine.queryOrder.pop() === 'isAvailable');
        assertTrue('mixin replaced',this.query.no === this.workflow.mixins['!testMixin']);
    },

    testImportResponse : function(){

        var turbine = new Turbine(this.initObj);

        turbine.importResponse('yes','isAvailable',this.workflow);

        assertTrue('repeat counter added to response',this.query.yes.repeat.counter === 0);
        assertTrue('shortcut replaced',this.query.yes.repeat.then === this.workflow.config.shortcuts['@complete']);
        assertTrue('variable replaced',this.query.yes.repeat.limit === this.workflow.config.variables['$defaultLimit']);
    },

    testCompare : function(){

        var turbine = new Turbine(this.initObj);

        assertTrue('comparing identical messages returns true',turbine.compare('foo','foo'));
        assertFalse('comparing different messages returns false',turbine.compare('foo','bar'));
    },

    testListen : function(){

        var turbine = new Turbine(this.initObj);

        turbine.listen('foo',function(){});

        var events = $._data(turbine, "events");

        assertTrue('single foo listener added',events.foo && events.foo.length === 1);

        turbine.listen('bar',function(){});
        turbine.listen('bar',function(){});
        turbine.listen('bar',function(){});

        var events2 = $._data(turbine, "events");

        assertTrue('multiple bar listeners added individually',events2.bar && events2.bar.length === 3);

        turbine.listen(['foo1','foo2','foo3'],function(){});

        var events3 = $._data(turbine, "events");

        assertTrue('array of listeners added',(typeof events3.foo1 !== 'undefined' && typeof events3.foo2 !== 'undefined' && typeof events3.foo3 !== 'undefined'));
    },

    testRemove : function(){

        var turbine = new Turbine(this.initObj);

        turbine.listen('foo',function(){});

        var events = $._data(turbine, "events");

        assertTrue('single foo listener added',events.foo && events.foo.length === 1);

        turbine.listen('bar',function(){});
        turbine.listen('bar',function(){});
        turbine.listen('bar',function(){});

        var events2 = $._data(turbine, "events");

        assertTrue('multiple bar listeners added individually',events2.bar && events2.bar.length === 3);

        turbine.listen(['foo1','foo2','foo3'],function(){});

        var events3 = $._data(turbine, "events");

        assertTrue('array of listeners added',(typeof events3.foo1 !== 'undefined' && typeof events3.foo2 !== 'undefined' && typeof events3.foo3 !== 'undefined'));

        turbine.remove('foo');
        turbine.remove('bar');

        var events4 = $._data(turbine, "events");

        assertTrue('foo listener removed',!events4.foo);
        assertTrue('bar listeners removed',!events4.bar);

        turbine.remove(['foo1','foo2','foo3']);

        var events5 = $._data(turbine, "events");

        assertTrue('array of listeners removed',(typeof events5.foo1 === 'undefined' && typeof events5.foo2 === 'undefined' && typeof events5.foo3 === 'undefined'));
    },

    testImportGlobalListeners : function(){

        var turbine = new Turbine({ workflow : {} });
        var listener = this.workflow.config.always.waitFor[0];

        turbine.importGlobalListener(listener,this.workflow);

        assertTrue('global listener has been added',typeof turbine.globalListeners[listener.waitFor] !== 'undefined');
        assertTrue('numGlobalListeners is incremented by 1',turbine.numGlobalListeners === 1);
    },

    testBuildWaitingForObj : function(){

        var turbine = new Turbine(this.initObj);
        var waitingFor = turbine.buildWaitingForObj(this.query.yes.waitFor);

        assertTrue('length of waitingFor array includes query waitFor message(s) plus global listeners\' waitFor message(s)',waitingFor.length === (this.workflow.config.always.waitFor.length + 1));
        assertTrue('query waitFor message is in waitingFor array',turbine.utils.inArray(this.query.yes.waitFor,waitingFor));
        assertTrue('global listener waitFor message is in waitingFor array',turbine.utils.inArray(this.workflow.config.always.waitFor[0].waitFor[0],waitingFor));
    },

    testBuildNextQueryObj : function(){

        var turbine = new Turbine(this.initObj);
        var nextQueryObj = turbine.buildNextQueryObj('isComplete',[this.query.yes.waitFor]);

        assertTrue('next query for query waitFor is added to nextQuery object',nextQueryObj[this.query.yes.waitFor] === 'isComplete');
        assertTrue('next query for global listener waitFor is added to nextQuery object',nextQueryObj[this.workflow.config.always.waitFor[0].waitFor[0]] === this.workflow.config.always.waitFor[0].then);
    },

    testGetNextQuery : function(){

        var turbine = new Turbine(this.initObj);
        var nextQuery = turbine.getNextQuery(this.workflow.config.always.waitFor[0].waitFor[0]);

        assertTrue('next query when global listener waitFor message is received is corresponding "then" query',nextQuery === this.workflow.config.always.waitFor[0].then);
    },

    testStartGlobalTimeout : function(){

        var turbine = new Turbine(this.initObj);

        turbine.startGlobalTimeout('isAvailable',this.query.yes);

        assertTrue('global timer var holds timer number',typeof turbine.timers.global === 'number');
    },

    testStartDelayTimeout : function(){

        var turbine = new Turbine(this.initObj);

        turbine.startDelayTimeout('isAvailable',this.query.yes);

        assertTrue('delay timer var holds timer number',typeof turbine.timers.delay === 'number');
    },

    testHandleIncomingMessage : function(){

        var turbine = new Turbine(this.initObj);

        turbine.handleIncomingMessage(this.workflow.config.always.waitFor[0].waitFor[0]);

        assertTrue('next query is "then" query corresponding to global listener waitFor message',turbine.nextQuery === this.workflow.config.always.waitFor[0].then);
        assertTrue('waitingFor is null',turbine.waitingFor === null);

        turbine.stop();

        var result = turbine.handleIncomingMessage(this.workflow.config.always.waitFor[0].waitFor[0]);

        assertTrue('When Turbine is stopped, handleIncomingMessage exits early and returns null',result === null);
    },

    testQueue : function(){

        var turbine = new Turbine(this.initObj);

        turbine.queue('isComplete',this.query.yes.waitFor);

        var events = $._data(turbine, "events");

        assertTrue('Turbine is listening for waitFor message',this.query.yes.waitFor in events);
        assertTrue('isComplete has been added to waitingFor object',turbine.utils.inArray(this.query.yes.waitFor,turbine.waitingFor));
        assertTrue('isComplete has been added to nextQueryObj',turbine.nextQueryObj[this.query.yes.waitFor] === 'isComplete');
        assertTrue('isComplete is stored as nextQuery',turbine.nextQuery === 'isComplete');
    },

    testClear : function(){

        var turbine = new Turbine(this.initObj);

        turbine.clear('isAvailable');

        assertTrue('query timer is cleared',typeof turbine.timers.queries.isAvailable === 'undefined');
        assertTrue('query response has been reset',turbine.responses.isAvailable === null);
        assertTrue('query response repeat counter has been reset',turbine.workflow.queries.isAvailable.yes.repeat.counter === 0);
    },

    testNext : function(){

        var turbine = new Turbine(this.initObj);

        turbine.nextQuery = null;

        var result = turbine.next();

        assertTrue('next() exits early and returns null when nextQuery is null',result === null);

        turbine.stop();

        result = turbine.next();

        assertTrue('next() exits early and returns null when Turbine is stopped',result === null);
    },

    testStart : function(){

        var turbine = new Turbine(this.initObj);

        turbine.start();

        assertTrue('Turbine stopped flag is false once Turbine is started',turbine.stopped === false);
    },

    testExec : function(){

        var turbine = new Turbine(this.initObj);

        var result = turbine.exec('done');

        assertTrue('exec() exits early and returns null when it receives a stop query',result === null);
        assertTrue('stopped flag is set to true when exec() receives a stop query',turbine.stopped === true);

        turbine = new Turbine(this.initObj);

        turbine.stop();

        result = turbine.exec('isAvailable');

        assertTrue('exec() exits early and returns null when Turbine is stopped',result === null);

        turbine = new Turbine(this.initObj);

        turbine.queries['isAvailable'] = function(){
            return 'FOO_BAR';
        };

        result = turbine.exec('isAvailable');

        assertTrue('exec() exits early and returns null when the response doesn\'t exist and there\'s no default response set',result === null);
    },

    "test processResponse when stopped" : function(){

        var turbine = new Turbine(this.initObj);

        turbine.stop();

        var result = turbine.processResponse('isAvailable',this.query.yes);

        assertTrue('processResponse() exits early and returns null when Turbine is stopped',result === null);
    },

    "test processResponse with delay" : function(){

        var turbine = new Turbine(this.initObj);

        turbine.processResponse('isAvailable',{
            delay : 1000,
            then : 'done'
        });

        assertTrue('delay timeout is set',typeof turbine.timers.delay === 'number');
    },

    "test processResponse with report" : function(){

        var turbine = new Turbine(this.initObj);

        turbine.processResponse('isAvailable',{
            report : 'SOMETHING_BAD_HAPPENED',
            then : 'done'
        });
    },

    "test processResponse with earlier query" : function(){

        var turbine = new Turbine(this.initObj);

        turbine.processResponse('isComplete',{
            waitFor : 'UI|button|clicked|STOP',
            then : 'isAvailable'
        });
    },

    "test processResponse with timeout" : function(){

        var turbine = new Turbine(this.initObj);

        turbine.processResponse('isComplete',{
            waitFor : 'UI|button|clicked|STOP',
            timeout : {
                after : 1000,
                then : 'done'
            },
            then : 'done'
        });

        assertTrue('response timeout is set',turbine.timers.queries.isComplete.length > 0);
    }

});
var TurbineTests = TestCase('TurbineTests', {

    setUp : function() {

        this.initObj = {

            name                            : 'TurbineTest',
            logLevel                        : 'DEBUG',

            workflow : {

            }
        }
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
    }
});
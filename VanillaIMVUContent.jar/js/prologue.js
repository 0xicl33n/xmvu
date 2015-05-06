/* Bootstrap a JS test by injecting the relevant YUI includes and defining
 * the runTests() function.
 * 
 * Note: this implementation is expected only to work on Firefox 3.
 * It most assuredly will not work on IE6 or 7, and might, by some
 * miracle of spontaneous convergence of web standards, also run on
 * Chrome or Opera.
 * -- andy 12 Mar 2009
 */

var IMVULoader = {
    root : function() {
        var location = document.location;
        if (location.protocol == 'chrome:') {
            return '/content/';
        } else if(0 === location.pathname.indexOf('/content/')) {
            return '/content/';
        } else if(-1 != location.pathname.indexOf('ui/restricted/')) {
            return '../../chrome/';
        } else {
            var split = location.pathname.split('/');
            for (var i = 0; i < split.length; ++i) {
                if ('chrome' == split[i]) {
                    //alert(split.slice(0, i + 1).join('/'));
                    return split.slice(0, i + 1).join('/') + '/';
                }
            }
            alert('failed to find root');
            return null;
        }
    },

    import_js : function(fname) {
        var root = IMVULoader.root();
        document.write("<script type='text/javascript' src='" + root + fname + "'></script>");
    },
    
    import_css : function(fname) {
        var root = IMVULoader.root();
        document.write('<link rel="stylesheet" type="text/css" href="' + root + fname + '" />');
    },

    // We have to essentially reimplement YUI.util.Event.onDOMReady because we cannot
    // count on it being included by this point. (the whole point of this script is to
    // perform that inclusion!)
    domReady : false,
    onDOMReady : function (cb) {
        function fn(e) {
            cb(e);
            
            // XULRunner fires this event for each iframe (I think?), which is different
            // from Firefox, so it is important to unregister once we are through
            document.removeEventListener('DOMContentLoaded', fn, true);
        }
        if (IMVULoader.domReady) {
            cb({currentTarget:{URL:'aoeuaoeua'}});
        } else {
            document.addEventListener('DOMContentLoaded', fn, true);
        }
    },

    log: function(s) {
        if (typeof parent.imvu != 'undefined') {
            // IMVU
            parent.imvu.call('log', s);
        } else if (typeof console != 'undefined') {
            // Firebug
            console.log(s);
        } else {
            // Last ditch attempt: Find some random div and tack some crap on the end.
            var d = document.getElementById('testLogger');
            if (d) {
                d.innerHTML += s + '\n';
            }
        }
    }
};

IMVULoader.onDOMReady(function() {
    IMVULoader.domReady = true;
});

function areJsonEqual(a, b) {
    return YAHOO.lang.JSON.stringify(a) === YAHOO.lang.JSON.stringify(b);
}

function inArray(needle, haystack) {
    for(var i=0; i<haystack.length; i++) {
        if(YAHOO.lang.JSON.stringify(needle) === YAHOO.lang.JSON.stringify(haystack[i])) {
            return true;
        }
    }
    return false;
}

function getTestMethodToFilterBy(search) {
    var match = /[?|&](test[^?&]*)/.exec(search);
    if (match) {
        return match[1];
    }
    return null;
}

function filterTestMethods(obj, filter) {
    var key;

    if(!obj._should) {
        obj._should = {};
    }
    for (key in obj) {
        if (obj.hasOwnProperty(key) && /^test/.test(key) && !filter(key)) {
            if(!obj._should.ignore) {
                obj._should.ignore = {};
            }
            obj._should.ignore[key] = true;
        }
    }

    return obj;
}

var __testInfo = [];
var __testsAreComplete = false;

function runTestsArray(testCases) {
    IMVULoader.onDOMReady(function(e) {
        var testMethodToFilterBy = getTestMethodToFilterBy(window.location.search),
            filteredTests,
            filter = function () {
                return true;
            };

        if (testMethodToFilterBy) {
            filter = function (method) {
                return method === testMethodToFilterBy;
            };
        }

        var suite = new YAHOO.tool.TestSuite('runTestsArray');
        for (var i = 0; i < testCases.length; i++) {
            filteredTests = filterTestMethods(testCases[i], filter);
            suite.add(new YAHOO.tool.TestCase(filteredTests));
        }
        YAHOO.tool.TestRunner.add(suite);

        function writeLogMessage(type, args, self) {
            if (typeof imvu != 'undefined') {
                imvu.call('log', 'YAHOO.log: ' + args[0].msg);
            }
        }

        YAHOO.widget.Logger.newLogEvent.subscribe(writeLogMessage);
    
        document.body.className = 'yui-skin-sam';

        var logDiv = document.createElement('div');
        logDiv.id = 'testLogger';
        logDiv.style.width = '97%';
        logDiv.style.fontSize = '12pt';
        document.body.appendChild(logDiv);
        var logger = new YAHOO.tool.TestLogger('testLogger');

        logger.formatMsg = function(message /*:Object*/) {
            var category /*:String*/ = message.category;
            var text /*:String*/ = this.html2Text(message.msg);

            text = text.replace(/^Test suite /, '<a href="?">Test suite</a> ');
            text = text.replace(/^test(.*?):/, '<a href="?test$1">test$1</a>:');

            return "<pre><p><span class=\"" + category + "\">" + category.toUpperCase() + "</span> " + text + "</p></pre>";
        };

        var DisabledTestException = function() {
            this.name = "DisabledTestException";
        };
        YAHOO.tool.TestCase.prototype.disable_test = function() {
            throw new DisabledTestException();
        };

        var disabledTests = [];
        logger._runner.subscribe(logger._runner.TEST_PASS_EVENT, function(event) {
            window.__testInfo.push({status: 'pass',
                                    testCaseName: event.testCase.name,
                                    testName: event.testName});
        });

        logger._runner.unsubscribe(logger._runner.TEST_FAIL_EVENT, logger._handleTestRunnerEvent, logger);
        logger._runner.subscribe(logger._runner.TEST_FAIL_EVENT, function(event) {
            if (event.error.cause instanceof DisabledTestException) {
                message = event.testName + ": disabled.";
                messageType = "disable";
                YAHOO.log(message, messageType, "TestRunner");
                disabledTests.push(event.testName);

                window.__testInfo.push({status: 'disabled',
                                        testName: event.testName,
                                        testCaseName: event.testCase.name});
            } else {
                if (!window.__testInfo) {
                    window.__testInfo = [];
                }
                window.__testInfo.push({status: 'fail',
                                        testName: event.testName,
                                        testCaseName: event.testCase.name,
                                        error: event.error});
                logger._handleTestRunnerEvent(event);
            }
        }, logger, true);

        logger._runner.subscribe(logger._runner.COMPLETE_EVENT, function() {
            window.__testsAreComplete = true;
        }, logger, true);

        function rebindLogCompletionEvent(eventName, msgFunction) {
            logger._runner.unsubscribe(eventName, logger._handleTestRunnerEvent, logger);
            logger._runner.subscribe(eventName, function(event) {
                message = msgFunction(event) + "\nPassed:" + 
                    event.results.passed + " Failed:" + event.results.failed + " Disabled: " +
                    event.results.disabled + " Total:" + event.results.total;
                YAHOO.log(message, "info", "TestRunner");
            }, logger, true);
        }
        rebindLogCompletionEvent(logger._runner.TEST_CASE_COMPLETE_EVENT, function(event) {
            return "Test case \"" + event.testCase.name + "\" completed.";
        });
        rebindLogCompletionEvent(logger._runner.TEST_SUITE_COMPLETE_EVENT, function(event) {
            return "Test suite \"" + event.testSuite.name + "\" completed.";
        });
        rebindLogCompletionEvent(logger._runner.COMPLETE_EVENT, function(event) {
            return "Testing completed at " + (new Date()).toString() + ".";
        });

        YAHOO.tool.TestRunner._wrappedHandleTestObjectComplete = YAHOO.tool.TestRunner._handleTestObjectComplete;
        YAHOO.tool.TestRunner._handleTestObjectComplete = function(node) {
            if (YAHOO.lang.isObject(node.testObject)) {
                if (typeof node.parent.results.disabled == 'undefined') {
                    node.parent.results.disabled = 0;
                }
                if (node.testObject instanceof YAHOO.tool.TestCase) {
                    for (var i =0; i < disabledTests.length; ++i) {
                        var name = disabledTests[i];
                        node.results[name].result = 'disabled';
                        node.results[name].message = 'Test disabled';
                    }
                    node.results.disabled = disabledTests.length;
                    node.results.failed -= disabledTests.length;
                    node.parent.results.disabled += disabledTests.length;
                    disabledTests = [];
                } else {
                    node.parent.results.disabled += node.results.disabled;
                }
            }
            YAHOO.tool.TestRunner._wrappedHandleTestObjectComplete(node);
        };

        if (parent.document != document && parent.TestManager) {
            // Running all tests
            parent.TestManager.load();

        } else {
            // Running just one test
            YAHOO.tool.TestRunner.run();
        }
    });
}

function runTests() {
    runTestsArray(arguments);
}

function runTestsWithIframe(url) {
    var scratch = document.createElement('div');
    scratch.style.textAlign = 'left';
    var iframe = document.createElement('iframe');
    var testCaseList = Array.prototype.slice.call(arguments, 1);

    function onIframeLoaded() {
        // must be saved before removing the iframe from document.body
        var pristineHTML = iframe.contentWindow.document.body.innerHTML;
        var headHTML = iframe.contentWindow.document.getElementsByTagName('head')[0].innerHTML;

        function setUpScratch() {
            var $imvujs = $(iframe).contents().find('script[src$="imvu.js"]');
            if (!/restricted/.test(iframe.contentWindow.location) && !$imvujs.length) {
                throw new Error(document.location + ': ' + url + ': The /js/imvu.js script must be included in all HTML files. Client releases will crash without it, due to the way our translation infrastructure works.');
            }

            scratch.innerHTML = pristineHTML;
            $(document).unbind('keypress');
            return scratch;
        }

        function getIframeHeadHTML() {
            return headHTML;
        }

        // make "setUpScratch" accessible via "this" in the passed in TestCase objects
        var tests = [];
        for (var testCase in testCaseList) {
            testCase = testCaseList[testCase];
            // augment
            testCase.setUpScratch = setUpScratch;
            testCase.getIframeHeadHTML = getIframeHeadHTML;

            tests.push(testCase);
        }

        runTestsArray(tests);
    }

    scratch.id = 'scratch';
    document.body.appendChild(scratch); // so global YAHOO.util.Dom.get() calls, etc. still work

    iframe.id = 'scratch-iframe';
    iframe.src = url;
    iframe.addEventListener('load', onIframeLoaded, true);
    document.body.appendChild(iframe); // trigger the load event
}

IMVULoader.import_css("yui/logger/assets/logger.css");
IMVULoader.import_css("yui/logger/assets/skins/sam/logger.css");
IMVULoader.import_css("yui/yuitest/assets/skins/sam/yuitest.css");
IMVULoader.import_css("css/test.css");

IMVULoader.import_js('js/jquery-1.6.js');
IMVULoader.import_js('js/jquery-ui-1.8.7.custom.min.js');
IMVULoader.import_js('js/underscore.js');
IMVULoader.import_js('yui/yahoo-dom-event/yahoo-dom-event.js');

IMVULoader.import_js('yui/element/element.js');
IMVULoader.import_js('yui/datatable/datatable.js');

IMVULoader.import_js('yui/datasource/datasource.js');
IMVULoader.import_js('yui/autocomplete/autocomplete.js');

IMVULoader.import_js('yui/animation/animation.js');
IMVULoader.import_js('yui/button/button.js');
IMVULoader.import_js('yui/carousel/carousel.js');
IMVULoader.import_js('yui/connection/connection.js');
IMVULoader.import_js('yui/container/container.js');
IMVULoader.import_js('yui/dragdrop/dragdrop.js');
IMVULoader.import_js('yui/event-delegate/event-delegate.js');
IMVULoader.import_js('yui/event-mouseenter/event-mouseenter.js');
IMVULoader.import_js('yui/event-simulate/event-simulate.js');
IMVULoader.import_js('yui/json/json.js');
IMVULoader.import_js('yui/paginator/paginator.js');
IMVULoader.import_js('yui/slider/slider.js');

IMVULoader.import_js('yui/logger/logger.js');
IMVULoader.import_js('yui/yuitest/yuitest.js');

IMVULoader.import_js('yui/datasource/datasource.js');
IMVULoader.import_js('yui/autocomplete/autocomplete.js');

IMVULoader.import_js('js/imvu.js');
IMVULoader.import_js('js/eventbus.js');
IMVULoader.import_js('js/synthesizeEvent.js');

IMVULoader.import_js('js/prologue_fixup.js');


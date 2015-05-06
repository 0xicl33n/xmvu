// Depends on Promise.js, EventLoop.js
var IMVU = IMVU || {};
IMVU.FakeRest = function(Promise, xhr) {
    this.xhr = xhr;
    this.Promise = Promise;
    this._requests = [];
    this.__expectations = [];
    this.__alwaysExpectations = [];
    this._invalidated = [];    
    this._canceled = [];
};

IMVU.FakeRest.prototype = {
    invalidateAll: function () {},
    
    invalidate: function (url) {
        this._invalidated.push(url);
    },

    cancelAll: function(url) {
        this._canceled.push(url);
    },       

    get: function (url, options) {
        return this.__request('GET', url, undefined, options);
    },

    post: function (url, body, options) {
        return this.__request('POST', url, body, options);
    },   

    "delete": function (url, options) {
        return this.__request('DELETE', url, undefined, options);
    },

    _assertAllDone: function () {       
        if (this.__expectations.length > 0) {
            if (window.console){
                _(this.__expectations).each(function (expectation) {
                    window.console.log('Rest.fake.js: Unrequested ' + expectation.method + ' to ' + expectation.url + (expectation.body === undefined ? '' : ' with body "' + JSON.stringify(expectation.body) + '"'));
                });
            }
            throw new Error('Rest.fake.js has ' + this.__expectations.length + ' unrequested expectations.  See console.log for details.');
        }
    },

    /* Usage:
     *
     * _expect(method: string, url: string, body?: any) -> PromiseResolver
     *
     * rest._expect('GET', url).resolve({
     *     code: 201,
     *     data: {},
     *     relations: {},
     *     headers: { Location: newUrl }
     * });
     *
     * or
     *
     * rest._expect('POST', url, { key: "val" }).reject({
     *     code: 403,
     *     error: 'ERROR_CODE-001',
     *     message: 'You cannot do that'
     * });
     */
    _expect: function (method, url, body) {
        return this.__addExpectationTo(this.__expectations, method, url, body);
    },

    _alwaysRespond: function (method, url, body) {
        this.__alwaysExpectations = _(this.__alwaysExpectations).reject(function (exp) {
            return exp.method === method && exp.url === url && (exp.body === undefined || _.isEqual(exp.body, body));
        });
        return this.__addExpectationTo(this.__alwaysExpectations, method, url, body);
    },
    
    _isInvalidated: function(url) {
        return _(this._invalidated).find(function(u) { return u === url; }) !== undefined;
    },

    __addExpectationTo: function (list, method, url, body) {
        var testResolver;
        var testPromise = new this.Promise(function (resolver) {
            testResolver = resolver;
        });
        var apiPromise = this.__transformTestPromiseToPublicPromise(url, testPromise);
        
        list.push({
            method: method,
            url: url,
            body: body,
            promise: apiPromise
        });        
        return testResolver;
    },

    __transformTestPromiseToPublicPromise: function (url, testPromise) {
        var xhr = this.xhr;
        return new this.Promise(function (resolver) {
            testPromise.then(function (args) {                
                var r;
                args = args || {};
                if (args.rawResponse !== undefined) {
                    r = args.rawResponse;
                } else {
                    r = {
                        status: 'success',
                        data: args.data || {},
                        relations: args.relations || {}
                    };
                    if ('updates' in args) {
                        r.updates = args.updates;
                    }
                }
                                
                resolver.resolve({
                    error: undefined,
                    response: r,
                    url: ((args.code === 201) ? args.headers.Location : url),
                    xhr: new xhr(args.code || 200, args.headers || {})
                });                
            }, function (args) {
                args = args || {};
                resolver.reject({
                    error: {
                        error: args.error || 'No "error" parameter given on .reject()',
                        message: args.message || 'No "message" parameter given on .reject()'
                    },
                    response: undefined,
                    url: url,
                    xhr: new xhr(args.code || 200, args.headers || {})
                });
            });
        });
    },

    __getExpectation: function (method, url, body) {
        var expectation = _(this.__alwaysExpectations).find(function (exp) {
            return exp.method === method && exp.url === url && (exp.body === undefined || _.isEqual(exp.body, body));
        });
        if (expectation) {
            return expectation;
        }

        expectation = _(this.__expectations).find(function (exp) {
            return exp.method === method && exp.url === url && (exp.body === undefined || _.isEqual(exp.body, body));
        });
        if (!expectation) {
            throw new Error('Unexpected ' + method + ' request to ' + url + (body === undefined ? '' : ' with body "' + JSON.stringify(body) + '"'));
        }
        this.__expectations = _(this.__expectations).without(expectation);
        return expectation;
    },

    __request: function (method, url, body, options) {
        this._requests.push({
            method: method,
            url: url,
            body: body
        });
        if (_.isFunction(options)) {
            onComplete = options;
            options = {};
        }

        var expectation = this.__getExpectation(method, url, body);        
        return expectation.promise;
    }
};
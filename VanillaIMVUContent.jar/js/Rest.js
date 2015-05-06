// Depends on: Promise.js, XMLHttpRequest, EventLoop.js
// This is intended to be an improved, easier way to handle XHR.
// The usage of this will be very similar to ui-core's Rest.js
// Key features include returning a Promise for every network
// request and network caching.
var IMVU = IMVU || {};
IMVU.Rest = function(Promise, xhr, imvu) {
    this.XMLHttpRequest = xhr;
    this.Promise = Promise;
    this.imvu = imvu;
    this.__networkCache = {};
    this.__inFlight = {};
    this.__requestQueue = {};
    this.__requestHeaders = {};
};

IMVU.Rest.prototype = {

    // -- PUBLIC MEMBERS --
    get: function(url, options) {
        return this.__request('GET', url, undefined, options);
    },

    post: function(url, body, options) {
        return this.__request('POST', url, body, options);
    },

    'delete': function(url, options) {
        return this.__request('DELETE', url, undefined, options);
    },

    invalidateAll: function() {
        this.__networkCache = {};
    },

    invalidate: function(url) {
        if (_(this.__networkCache).has(url)) {
            delete this.__networkCache[url];
        }
    },

    cancelAll: function(url) {
        var error = this.ERROR_ABORT;

        if (this.__inFlight[url]) {
            this.__cancelInFlight(url, undefined, error);
        }

        if (this.__requestQueue[url]) {
            _.each(this.__requestQueue[url], function(request) {
                var xhr = new this.XMLHttpRequest();
                xhr.abort();
                request.onComplete(error, undefined, xhr);
            }.bind(this));
            delete this.__requestQueue[url];
        }
    },

    TIMEOUT_MS: 30000,

    // -- PRIVATE MEMBERS --
    __request: function(method, url, body, options) {
        console.log('qqq url: ', url);
        console.log('qqq body: ', body);
        return new this.Promise(function(resolver) {
            function onComplete(error, response, xhr, urlOC) { 
                if (error) {
                    console.log('qqq error: ', error);
                    resolver.reject({
                        error: error,
                        xhr: xhr,
                        url: urlOC
                    });
                } else {
                    console.log('qqq response: ', response);
                    resolver.resolve({
                        response: response,
                        xhr: xhr,
                        url: urlOC
                    });
                }
            };

            if (this.__inCacheAndCacheable(method, url)) {
                onComplete(undefined, this.__networkCache[url].response, this.__networkCache[url].xhr, url);
            } else {
                this.__queueRequest(url, method, function makeRequestMaybeCache(next) {
                    if (this.__inCacheAndCacheable(method, url)) {
                        onComplete(undefined, this.__networkCache[url].response, this.__networkCache[url].xhr, url);
                        next();
                    } else {
                        this.__makeRequest(method, url, body, options, function onCompletedRequest() {
                            delete this.__inFlight[url];                            
                            onComplete.apply(undefined, arguments);
                            next();
                        }.bind(this));
                    }
                }.bind(this), onComplete);
            }
        }.bind(this));
    },

    __inCacheAndCacheable: function(method, url) {
        return method === 'GET' && _.has(this.__networkCache, url);
    },

    __queueRequest: function (url, method, request, onComplete) {
        if (url) {
            url = url.replace(/\/$/, "");
            this.__requestQueue[url] = this.__requestQueue[url] || [];
            this.__requestQueue[url].push({method: method, request: request, onComplete: onComplete});
            if (this.__requestQueue[url].length === 1) {
                this.__pumpRequest(url);
            }
        }
    },

    __pumpRequest: function (url) {
        url = url.replace(/\/$/, "");
        if (this.__requestQueue[url].length > 0) {
            this.__requestQueue[url][0].request(function () {
                this.__requestQueue[url].shift();
                this.__pumpRequest(url);
            }.bind(this));
        }
    },

    __makeRequest: function (method, url, body, options, onComplete) {
            var xhr = new this.XMLHttpRequest();
            url = url.replace(/\/$/, "");
            var hasAcceptHeader = false;
            this.__inFlight[url] = {
                method: method,
                xhr: xhr,
                body: body,
                options: options,
                onComplete: onComplete
            };
            options = options || {};
            var dataType = options.dataType || 'json';
            var contentType = (dataType === 'json') ? 'application/json; charset=utf-8' : 'application/xml; charset=utf-8';

            xhr.open(method, url);

            xhr.timeout = this.TIMEOUT_MS;
            if (options && options.headers) {
                _.each(options.headers, function(value, key) {
                    if (key && key.toUpperCase() === "ACCEPT") {
                        hasAcceptHeader = true;
                    }
                    xhr.setRequestHeader(key, value);
                });
            }
            if (!hasAcceptHeader) {
                xhr.setRequestHeader('Accept', contentType);
            }

            if (method !== 'GET') {
                xhr.setRequestHeader('Content-Type', contentType);
            }

            var auth = this.imvu.call('getAuth', url, (body === undefined) ? null : body);
            var cid   = auth[0];
            var token = auth[1];
            var csid  = auth[2];

            xhr.setRequestHeader('X-imvu-auth', token);
            xhr.setRequestHeader('X-imvu-userid', cid);
            xhr.setRequestHeader('X-imvu-csid', csid);
            xhr.setRequestHeader('User-agent', 'IMVU Client/' + auth[3] + ' XMLHttpRequest');            

            xhr.onabort = wrapError(this.ERROR_ABORT);
            xhr.onerror = wrapError(this.ERROR_NETWORK);
            xhr.ontimeout = wrapError(this.ERROR_TIMEOUT);

            xhr.onreadystatechange = function () {                
                if (xhr.readyState === 4 && xhr.status !== 0) {
                    var parsedResponse;

                    if (xhr.status === 204) { //no content
                        onComplete(undefined, "", xhr);
                        return;
                    }
                    try {
                        if (dataType === 'json') {
                            parsedResponse = JSON.parse(xhr.responseText);
                        } else if(dataType === 'xml') {
                            parsedResponse = xhr.responseXML;
                        }
                    } catch (e) {
                        wrapError(this.ERROR_PARSE)();
                        return;
                    }

                    if (xhr.status >= 200 && xhr.status < 400) {
                        this.__updateCache(url, parsedResponse, xhr);
                        var key = ('id' in parsedResponse) ? parsedResponse.id : url;
                        var directResponse = (this.__networkCache[key] !== undefined) ? this.__networkCache[key] : { response: null, xhr: xhr };
                        onComplete(undefined, directResponse.response, directResponse.xhr, key);
                    } else {
                        wrapError(parsedResponse)();
                    }
                }
            }.bind(this);

            xhr.send((body === undefined) ? null : JSON.stringify(body));

            function wrapError(simulatedResponse) {
                return function () {
                    onComplete(simulatedResponse, undefined, xhr);
                };
            }
        },

        __updateCache: function (initiatingUrl, response, xhr) {
            var self = this;

            if ('id' in response && 'denormalized' in response) {
                var id = response.id.replace(/\/$/, "");
                _(response.denormalized).each(function (response, url) {
                    url = url.replace(/\/$/, "");
                    setCache(url, response, xhr, id);

                    if (initiatingUrl !== url && id !== url) {
                        if (this.__inFlight[url] && this.__inFlight[url].method === 'GET') {
                            // If there is a side-channel read-only response,
                            // abort the in-flight XHR: we have a fresh one.
                            this.__cancelInFlight(url, response);
                        }
                    }
                }.bind(this));
            } else {
                setCache(initiatingUrl, response, xhr, initiatingUrl);
            }

            function setCache(url, response, xhr, id) {
                url = url.replace(/\/$/, "");
                self.__networkCache[url] = {
                    response: response,
                    xhr: xhr,
                    url: url
                };
            };
        },

        __cancelInFlight: function(url, response, error) {
            var inFlightXhr = this.__inFlight[url].xhr;
            var onComplete = this.__inFlight[url].onComplete;
            inFlightXhr.onabort = function () {};
            inFlightXhr.abort();
            inFlightXhr.onreadystatechange = function() {};
            delete this.__inFlight[url];
            onComplete(error, response, inFlightXhr);
        },

        ERROR_ABORT: {
            error: 'AbortError',
            message: 'Connection aborted'
        },
        ERROR_NETWORK: {
            error: 'NetworkError',
            message: 'Network error'
        },
        ERROR_TIMEOUT: {
            error: 'TimeoutError',
            message: 'Network connection timed out'
        },
        ERROR_PARSE: {
            error: 'ParseError',
            message: 'Unable to parse response'
        }
};
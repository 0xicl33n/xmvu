var IMVU = IMVU || {};

IMVU.FakeXMLHttpRequest = function(code, headers) {
    this.requestHeaders = headers || {};
    this.readyState = this._state.UNSENT;
    this.status = code || 0;
    this.timeout = 0;
    this._error = false;    
    this._pending = {};
};

IMVU.FakeXMLHttpRequest._getPending = function(method, url) {
    return IMVU.FakeXMLHttpRequest._pending[method+' '+url];
};

IMVU.FakeXMLHttpRequest._expect =  function (method, url, responseCode, responseHeaders, responseBody) {    
    IMVU.FakeXMLHttpRequest._expectations[method + ' ' + url] = {
        code: responseCode,
        headers: responseHeaders,
        body: responseBody
    };
};

IMVU.FakeXMLHttpRequest._beginResponse = function(method, url) {
    var key = method + ' ' + url;
    
    var xhr = IMVU.FakeXMLHttpRequest._pending[key].xhr;
    if (!xhr) {
        throw new Error('Request never sent: ' + key);
    }
    delete IMVU.FakeXMLHttpRequest._pending[key];

    return xhr;
};

IMVU.FakeXMLHttpRequest._pending = {};
IMVU.FakeXMLHttpRequest._expectations = {};

IMVU.FakeXMLHttpRequest.prototype = {
    _state: {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4
    },
    
    setRequestHeader: function(key, value) {
        this.requestHeaders[key] = value;
    },
    
    getRequestHeader: function(key) {
        return this.requestHeaders[key];
    },
    
    abort: function() {
        this._error = true;
        this.__changeReadyState(this._state.DONE);
        this.onabort();        
        this.readyState = this._state.UNSENT;
    },
    
    open: function(method, url) {
        this.method = method;
        this.url = url;
        this.__changeReadyState(this._state.OPENED);
    },
    
    send: function(body) {
        var key = this.method + ' ' + this.url;        
        
        if (IMVU.FakeXMLHttpRequest._expectations[key]) {
            var expectation = IMVU.FakeXMLHttpRequest._expectations[key];
            delete IMVU.FakeXMLHttpRequest._expectations[key];
            
            this.status = expectation.code;
            this.responseText = expectation.body;                        
            this.__changeReadyState(this._state.DONE);
            return;
        }

        this.onreadystatechange();           
        IMVU.FakeXMLHttpRequest._pending[key] = {
            method: this.method,
            url: this.url,
            body: body,
            xhr: this
        };
    },
    
    __changeReadyState: function(state) {
        this.readyState = state;
        this.onreadystatechange();
    },
    
    onabort:            function() {},
    onerror:            function() {},
    ontimeout:          function() {},
    onreadystatechange: function() {}
};

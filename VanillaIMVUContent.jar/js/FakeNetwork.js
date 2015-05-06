function FakeNetwork() {
    this.responses = {};
    this.blocks = {};
    this._abortCalls = 0;
    this._inProgress = false;
    this.requestEvent = new YAHOO.util.CustomEvent("request");
    this.FAIL = true;
}

// Polymorphic with IMVU.Network.asyncRequest and YAHOO.util.Connect.asyncRequest
FakeNetwork.prototype.asyncRequest = function (method, url, callback, postData) {
    if (method!='POST' && method!='GET' && method!='DELETE') {
        throw new Error('unknown method '+method+'. Offending url was: ' + url );
    }
    if (postData && method!='POST') {
        throw new Error('asyncRequest cannot take postData=' + JSON.stringify(postData) + ' for a GET request. Offending url was: ' + url );
    }
    var logline = 'FakeNetwork.asyncRequest(): '+method+' '+url;
    if (postData) {
        logline += ' '+JSON.stringify(postData);
    }
    IMVU.log(logline);
    if (typeof callback === 'undefined') {
        throw new Error('asyncRequest requires a well-formed callback object. Offending url was: ' + url );
    }
    if (typeof callback.success === 'undefined') {
        throw new Error('asyncRequest callback requires a "success" handler. Offending url was: ' + url);
    }
    if (typeof callback.failure === 'undefined') {
        throw new Error('asyncRequest callback requires a "failure" handler. Offending url was: ' + url);
    }

    this.requestEvent.fire(method, url, callback, postData);

    if (url in this.blocks) {
        this.blocks[url].callbacks.push(callback);
    } else if (url in this.responses) {
        var response = this.responses[url][0];
        var error = true;
        if (typeof postData === 'undefined' || postData===null || postData==={}) {
            error = typeof response.data === 'undefined' || response.data===null || response.data==={};
        }
        else if (typeof response.data !== 'undefined' &&
            (response.data == postData ||
            response.data.toSource() == postData.toSource())) {
            error = false;
        }
        if (error) {
            if (typeof console !== 'undefined') {
                console.log('expect: ' + postData.toSource());
                console.log('actual: ' + response.data.toSource());
            }
            throw new Error(method + " postData " + postData.toSource() + " did not match expected " + response.data.toSource() + '. Check console log for diffs');
        }
        else {
            this.responses[url].shift();
            if (this.responses[url].length === 0) {
                delete this.responses[url];
            }
        }

        if (response.failure == this.FAIL) {
            callback.failure.call(callback.scope, {
                responseText: response.responseText,
                argument : callback.argument
            });
        } else {
            callback.success.call(callback.scope, {
                responseText: response.responseText,
                argument : callback.argument
            });
        }
    } else {
        throw new Error("Unexpected asyncRequest " + [url, postData, callback.toSource()].join(' '));
    }
}

FakeNetwork.prototype.abort = function (cnObj) {
    this._abortCalls++;
}

FakeNetwork.prototype.isCallInProgress = function(cnObj) {
    return this._inProgress;
}

FakeNetwork.prototype._clearResponses = function() {
    this.responses = {};
}

FakeNetwork.prototype._respondOnce = function(url, responseText, postData, failure) {
    if (typeof url != 'string') {
        throw new Error('Invalid url ' + url.toSource());
    }

    if (!(url in this.responses)) {
        this.responses[url] = [];
    }
    postData = postData || {};
    this.responses[url].push({responseText: responseText, data: postData, failure: failure});
}

FakeNetwork.prototype._block = function(url) {
    var future = {
        callbacks: []
    };

    var self = this;

    future.complete = function (responseText) {
        for (var cb in future.callbacks) {
            cb = future.callbacks[cb];
            cb.success.call(cb.scope, {
                responseText: responseText
            });
        }
        delete future.callbacks;
        delete self.blocks[url];
    };

    future.fail = function (responseText) {
        for (var cb in future.callbacks) {
            cb = future.callbacks[cb];
            cb.failure.call(cb.scope, {
                responseText: responseText
            });
        }
        delete future.callbacks;
        delete self.blocks[url];
    };

    this.blocks[url] = future;
    return future;
}

FakeNetwork.prototype._verify = function () {
    for (var url in this.responses) {
        if (this.responses[url].length) {
            throw new Error("Url '" + url + "' was never requested.  (" + this.responses[url].length + " pending requests remain)");
        }
    }
}

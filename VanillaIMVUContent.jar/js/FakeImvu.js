function FakeImvu() {
    this.trace = [];
    this.asyncTrace = [];

    this.responses = {};
    this.alwaysResponses = {};

    this.orderedMode = false;
    this.orderedResponses = {};

    function call() {
        var args = Array.prototype.slice.call(arguments);
        var functionName = args[0];
        this.trace.push(args);
        var response;
        if (functionName in this.responses && this.responses[functionName].length > 0) {
            response = this.responses[functionName].shift();
        } else if (functionName in this.alwaysResponses) {
            response = this.alwaysResponses[functionName][0];
        } else if (functionName == 'translate'){
            return args[1];
        } else {
            // maybe it would be best to throw here
            response = null;
        }
        if (typeof response === 'function') {
            return response(Array.prototype.slice.call(args, 1));
        } else {
            return response;
        }
    }
    this.call = call.bind(this);

    function callAsync(functionName, callbackId, callbackName, args) {
        var funcArgs = Array.prototype.slice.call(arguments);

        this.trace.push(funcArgs);
        this.asyncTrace.push({'name': functionName, 'callbackId': callbackId, 'callbackName': callbackName, 'args': args});

        var response;
        if (functionName in this.responses && this.responses[functionName].length > 0) {
            response = this.responses[functionName].shift();
        } else if (functionName in this.alwaysResponses) {
            response = this.alwaysResponses[functionName][0];
        } else {
            // maybe it would be best to throw here
            response = null;
        }
        if (typeof response === 'function') {
            response.apply(null, [callbackId, args]);
        } else if (typeof callbackId !== 'undefined') {
            var callbackFn = IMVU.Client.getCallback(callbackId);
            callbackFn(response);
            IMVU.Client.deleteCallback(callbackId);
        }
    }
    this.callAsync = callAsync.bind(this);
}

FakeImvu.prototype._respondOrdered = function (functionName, result) {
    this.orderedMode = true;
    if( !this.responses[functionName] ) {
        this.responses[functionName] = [];
    }

    this.responses[functionName].push(result);
};

FakeImvu.prototype._respond = function (functionName, result, callbackType) {
    this.alwaysResponses[functionName] = [result, callbackType];
};

FakeImvu.prototype._wasCalled = function () {
    return this._traceFor(_.toArray(arguments)).length > 0;
};

FakeImvu.prototype._wasCalledAsync = function() {
    var args = Array.prototype.slice.call(arguments);
    var functionName = args.shift();

    for (var call in this.asyncTrace) {
        call = this.asyncTrace[call];
        if (call.name == functionName) {
            if (!args.length || call.args.toSource() == args.toSource()) {
                return true;
            }
        }
    }
    return false;
};

FakeImvu.prototype._getAsyncCalls = function(name) {
    var result = [];
    for (var i = 0; i < this.asyncTrace.length; ++i) {
        if (this.asyncTrace[i].name == name) {
            result.push(this.asyncTrace[i]);
        }
    }
    return result;
};

FakeImvu.prototype._findCall = function() {
    var calls = this._traceFor(_.toArray(arguments));
    if (calls.length == 1) {
        return calls[0];
    } else if (calls.length > 1) {
        Assert.fail("ambiguous matches for " + JSON.stringify(_.toArray(arguments)) + " found in " + JSON.stringify(this.trace));
    }
    Assert.fail("call " + JSON.stringify(_.toArray(arguments)) + " not found in " + JSON.stringify(this.trace));
};

FakeImvu.prototype._countCalls = function() {
    var calls = this._traceFor(_.toArray(arguments));
    return calls.length;
};

FakeImvu.prototype._isPartialMatch = function (args, call) {
    return args.toSource() == call.slice(0, args.length).toSource();
};

FakeImvu.prototype._traceFor = function (args) {
    return _.filter(this.trace, _.bind(this._isPartialMatch, this, args));
};

FakeImvu.prototype._traceForType = function () {
    return this._traceFor(_.toArray(arguments));
};

FakeImvu.prototype._clearTrace = function() {
    this.trace.splice(0);
    this.asyncTrace.splice(0);
};

if (typeof IMVU !== 'undefined') {
    // Should include imvu.js first so _T() is defined
    IMVU.translation = {};
    IMVU.translation.fake = function() {
        // Fake out _T()
        _T = function(s, imvu) {
            return "LS*" + s + "*LS";
        }
    }
    IMVU.translation.isTranslated = function(el) {
        var $el = $(el),
            text = $.trim($el.text());
        return IMVU.translation.isTranslatedString(text);
    }
    IMVU.translation.isTranslatedString = function(text) {
        return /^LS\*(.+?)\*LS$/.test(text);
    }
}

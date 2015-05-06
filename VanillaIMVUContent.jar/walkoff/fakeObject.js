FakeObject = function (funcNames) {
    this._calls = [];
    _.each(funcNames, function (funcName) {
        this._addFunction(funcName);
    }.bind(this));
};

FakeObject.prototype = {
    _wasCalled: function (name, args) {
        return (this._countCalls(name, args) > 0);
    },

    _clearCalls: function () {
        this._calls = [];
    },

    _countCalls: function (name, args) {
        return this._findCalls(name, args).length;
    },

    _findCalls: function (name, args) {
        var nameArgPairs;
        if (args === null || args === undefined) {
            nameArgPairs = _.filter(this._calls, function (call) { return call[0] === name; });
        } else {
            nameArgPairs = _.filter(this._calls, function (call) { return _.isEqual(call, [name, args]); });
        }
        return _.map(nameArgPairs, function (p) { return p[1]; });
    },

    _findCall: function (name, args) {
        return _.first(this._findCalls(name, args));
    },

    _addFunction: function (name) {
        this[name] = (function() {
            this._calls.push([name, _.toArray(arguments)]);
        }).bind(this);
    },
};

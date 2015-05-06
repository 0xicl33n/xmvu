function FakeEventBus() {
    this.trace = [];
    this.subscribers = {}; // event name => list of [scope, callback]
    this.eventNames = [];
    this.events = [];
}

FakeEventBus.prototype = {
    ALL_EVENTNAMES: 'ALL_EVENTNAMES',
    ALL_SENDERS: 'ALL_SENDERS',

    fire : function(eventName, info, imvuCall) {
        this.trace.push([eventName, info]);

        if (eventName in this.subscribers) {
            var s = this.subscribers[eventName];
            for (var i = 0; i < s.length; ++i) {
                var c = s[i];
                var scope = c[0];
                var callback = c[1];
                callback.call(scope, eventName, info);
            }
        }
    },

    fireMockEvent : function(eventName, info) {
    },

    register : function(eventName, callback, fromSender, scope) {
        if (!(eventName in this.subscribers)) {
            this.subscribers[eventName] = [];
        }
        this.subscribers[eventName].push([scope, callback]);
    },

    unregister: function(eventName, callback) {
        if (!eventName in this.subscribers) {
            throw "eventName not in this.subscribers " + eventName.toSource();
        }

        var e = this.subscribers[eventName];
        var i = 0;
        while (i < e.length) {
            var cb = e[i][1];
            if (cb == callback) {
                e.splice(i, 1);
            } else {
                ++i;
            }
        }
    },

    _wasFired: function(eventName) {
        for each (var t in this.trace) {
            if (t[0] == eventName) {
                return true;
            }
        }
        return false;
    }
};

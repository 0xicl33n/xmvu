function EventBus(imvu) {
    this.ALL_EVENTNAMES = 'ALL_EVENTNAMES';
    this.ALL_SENDERS = 'ALL_SENDERS';
    this.storeEvents = false;
    this.events = [];
    this.eventNames = [];
    this.imvu = imvu;
    this.callbacks = [];
}

EventBus.prototype.fire = function(eventName, info) {
    this.imvu.call('eventBusFire', eventName, info);
    if (this.storeEvents){
        this.eventNames.push(eventName);
        this.events.push({eventName:eventName, info:info});
    }
}

EventBus.prototype.fireMockEvent = function(eventName, info) {
    var cb = this.callbacks;
    for(var i in cb) {
        if(eventName == cb[i][1]) {
            this.incomingEvent(i, eventName, info);
        }
    }
}

EventBus.prototype.register = function(eventName, cb, fromSender, scope) {
    if(!fromSender) {
        fromSender = this.ALL_SENDERS;
    }
    var cbKey = this.callbacks.length;
    if (typeof(cb) != "function"){
        throw new Error('EventBus.register requires a function callback. eventName=' + eventName + ' typeof(cb)=' + typeof(cb));
    }

    this.callbacks[cbKey] = [cb, eventName, scope];
    this.imvu.call("eventBusRegister", fromSender, eventName, cbKey);
    return cbKey;
};

EventBus.prototype.unregister = function(eventName, cb) {
    for (var i = 0; i < this.callbacks.length; ++i) {
        var c = this.callbacks[i][0];
        var n = this.callbacks[i][1];
        if (n == eventName && c == cb) {
            this.callbacks[i][0] = function() { };
            this.imvu.call('eventBusUnregister', i);
        }
    }
};

EventBus.prototype.incomingEvent = function(cbKey, eventName, info) {
    var cb = this.callbacks[cbKey];
    if(! cb) {
        return;
    }
    var fn = cb[0];
    var scope;
    if (cb.length == 3) {
        scope = cb[2];
    } else {
        scope = cb;
    }

    try {
        fn.call(scope, eventName, info);
    }
    catch (e) {
        this.imvu.call('log', printStackTrace(e));
        throw e;
    }
}

EventBus.prototype.test_storeEvents = function() {
    this.storeEvents = true;
    this.events = [];
    this.eventNames = [];
}

EventBus.prototype._wasFired = function(eventName) {
    for (var t in this.eventNames) {
        if (this.eventNames[t] == eventName) {
            return true;
        }
    }
    return false;
}

EventBus.prototype.reset = function() { 
    this.storeEvents = false;
    this.events = [];
    this.eventNames = [];
    this.callbacks = [];
}

IMVU.Client.EventBus = new EventBus(imvu);

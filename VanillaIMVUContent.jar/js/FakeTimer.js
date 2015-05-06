
function FakeTimer(args) {
    args = args || {};
    this.autoDispatch = (typeof args.autoDispatch !== 'undefined') ? args.autoDispatch : true;

    this.intervals = {};
    this.timeouts = {};
    this.prevId = 0;
    this.now = 0;
}

FakeTimer.prototype = {
    getNow: function() {
        return this.now;
    },

    _makeUid: function () {
        return 'id_' + (++this.prevId);
    },

    _getLastTimerId: function() {
        if (this.prevId) {
            return 'id_' + this.prevId;
        } else {
            return undefined;
        }
    },

    setInterval: function (fn, interval, uid) {
        if( typeof uid == 'undefined' ) {
            uid = this._makeUid();
        }
    
        this.intervals[uid] = [fn, interval];
        if (this.autoDispatch) {
            fn();
        }
        return uid;
    },
    
    setTimeout: function (fn, interval, uid) {
    
        if( typeof uid == 'undefined' ) {
            uid = this._makeUid();
        }
    
        this.timeouts[uid] = [fn, interval];
        if (this.autoDispatch) {
            fn();
        }
        return uid;
    },

    clearTimeout: function(id) {

        if( typeof this.timeouts[id] != 'undefined' ) {
            delete this.timeouts[id];
        }
    },
    
    clearInterval: function(id) {
        
        if( typeof this.intervals[id] != 'undefined' ) {
            delete this.intervals[id];
        }
    },

    dispatchAll: function() {
        this.dispatchTimeout();
        this.dispatchInterval();
    },
    

    /// dispatch with a timer id to only dispatch 
    dispatchInterval: function(uid) {
        var doAll = (typeof uid == 'undefined');
        
        for( var key in this.intervals ) {
            if( doAll || key === uid ) {
                var fn = this.intervals[key][0];

                fn();
            }
        }
    },
    
    dispatchTimeout: function(uid) {
        if (uid == undefined) {
            var timeouts = {};
            for (var key in this.timeouts) {
                timeouts[key] = this.timeouts[key];
            }
            this.timeouts = {};

            for (var key in timeouts) {
                timeouts[key][0]();
            }
        } else {
            for (var key in this.timeouts) {
                if(key === uid) {
                    this.timeouts[key][0]();
                    this.clearTimeout(uid);
                    break;
                }
            }
        }
    }
}

function CancelableTimer(timer) {
    this.timer = timer || new Timer();
    this.intervals = {};
    this.timeouts = {};
};

CancelableTimer.prototype = {
    getNow: function () {
        return this.timer.getNow();
    },

    setTimeout: function (fn, timespan) {
        var id = this.timer.setTimeout(function () {
            delete this.timeouts[id];
            fn();
        }.bind(this), timespan);
        this.timeouts[id] = true;
        return id;
    },

    setInterval: function (fn, timespan) {
        var id = this.timer.setInterval(fn, timespan);
        this.intervals[id] = true;
        return id;
    },

    clearTimeout: function (id) {
        delete this.timeouts[id];
        return this.timer.clearTimeout(id);
    },

    clearInterval: function (id) {
        delete this.intervals[id];
        return this.timer.clearInterval(id);
    },

    clearAll: function () {
        for (id in this.timeouts) {
            if (this.timeouts.hasOwnProperty(id)) {
                this.timer.clearTimeout(id);
            }
        }
        this.timeouts = {};

        for (id in this.intervals) {
            if (this.intervals.hasOwnProperty(id)) {
                this.timer.clearInterval(id);
            }
        }
        this.intervals = {};
    },
};

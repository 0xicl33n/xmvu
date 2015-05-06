var IMVU = IMVU || {};

IMVU.FakeEventLoop = function() {
    this.queue = [];
};

IMVU.FakeEventLoop.prototype = {
    queueTask: function(fn) {
        this.queue.push(fn);
    },
    
    _flushTasks: function() {
        while (this.queue.length) {
            this.queue.shift()();
        }
    }
};
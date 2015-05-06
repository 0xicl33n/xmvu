(function(oldWindow) {

    function FrameTimer(imvu, timer) {
        this.callbacks = new IdSet();
        this.timer = timer;

        this.prevTickTime = timer.getNow();

        this.lastId = 1;

        oldWindow.onRenderFrame = this.tick.bind(this);
        imvu.call('setStepNotifyCallback', 'onRenderFrame');
    }

    FrameTimer.prototype.addCallback = function(fn) {
        return this.callbacks.add(fn);
    };

    FrameTimer.prototype.cancel = function(callbackId) {
        this.callbacks.remove(callbackId);
    };

    FrameTimer.prototype.tick = function() {
        var n = this.timer.getNow();
        var timeDelta = n - this.prevTickTime;
        this.prevTickTime = n;

        var cb = this.callbacks.elements;
        for (var k in cb) {
            if (!cb.hasOwnProperty(k)) {
                continue;
            }

            cb[k](timeDelta);
        }
    };

    window.FrameTimer = FrameTimer;

})(this);

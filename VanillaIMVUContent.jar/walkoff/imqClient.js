
(function() {

    function ImqClient(imvu, name) {
        this.imvu = imvu;
        this.name = name;
        this.listener = null;
        this.queueName = null;
        this.index = 0;
    }

    ImqClient.prototype.inQueue = function () {
        return !!(this.listener);
    };

    ImqClient.prototype.joinQueue = function(listener, queueName) {
        ++this.index;

        var name = this.name;
        var index = this.index;
        function makeDelegate(n) {
            return name + '.' + n + '.bind(' + name + ', ' + index + ')';
        }

        if (this.listener) {
            // FIXME: I don't know how this is happening, but it seems rare enough that
            // I'm not going to spend more time investigating. -- andy 24 April 2012
            this.leaveQueue(this.queueName);
        }

        this.listener = listener;

        this.queueName = queueName;

        this.imvu.call('joinQueue', queueName, {
            "onCreateMount":  makeDelegate('onGameCreateMount'),
            "onStateChange":  makeDelegate('onGameStateChange'),
            "onMessage":      makeDelegate('onGameMessage'),
            "onLeave":        makeDelegate('onGameLeave')
        });
    };

    ImqClient.prototype.leaveQueue = function(queueName) {
        if (!this.queueName) {
            return;
        }

        if (queueName !== this.queueName) {
            throw new Error("Tried to leave the wrong queue: " + queueName + " is not " + this.queueName);
        }

        this.imvu.call('leaveQueue', queueName);

        this.listener = null;
        this.queueName = null;
    };

    function delegate(name) {
        return function() {
            var a = Array.prototype.slice.call(arguments);
            var index = a.shift();
            if (index === this.index && this.listener) {
                return this.listener[name].apply(this.listener, a);
            } else {
                return null;
            }
        };
    };

    ImqClient.prototype.onGameCreateMount = delegate('onGameCreateMount');
    ImqClient.prototype.onGameStateChange = delegate('onGameStateChange');
    ImqClient.prototype.onGameMessage     = delegate('onGameMessage');
    ImqClient.prototype.onGameLeave       = delegate('onGameLeave');

    window.ImqClient = ImqClient;
})();

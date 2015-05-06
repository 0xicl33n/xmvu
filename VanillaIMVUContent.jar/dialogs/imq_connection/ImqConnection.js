function ImqConnection(args) {
    this.rootEl = args.root || $("#dialog");
    this.imvu = args.imvu || imvuRequired;
    this.timer = args.timer || timeRequired;
    this.eventBus = args.eventBus || eventBusRequired;

    this.waitingInterval = null;

    this.waitingEl = $("#waiting", this.rootEl);
    this.connectingEl = $("#connecting", this.rootEl);
    this.connectedEl = $("#connected", this.rootEl);
    this.failedEl = $("#failed", this.rootEl);

    this.messageElements = [this.waitingEl, this.connectingEl, this.connectedEl, this.failedEl];

    this.tryNowEl = $("#try-now", this.rootEl);

    this.okEl = $("#ok", this.rootEl);
    this.okEl.click(this.onClose.bind(this));
    this.closeTimer = null;

    this.buttonElements = [this.tryNowEl, this.okEl];

    $(".close", this.rootEl).click(this.onClose.bind(this));

    this.eventBus.register("IMQ state change", this.updateDisplay.bind(this));

    this.updateDisplay();
}

ImqConnection.prototype = {
    onClose: function() {
        this.imvu.call("endDialog", {});
    },

    onReconnect: function() {
        this.imvu.call("imqReconnect");
    },

    updateDisplay: function() {
        if (this.closeTimer !== null) {
            this.timer.clearTimeout(this.closeTimer);
            this.closeTimer = null;
        }

        var state = this.imvu.call("imqState");
        if (state[0] === "not_connected") {
            this.showMessage(this.waitingEl);
            this.showButton(this.tryNowEl);
            this.tryNowEl.unbind("click").click(this.onReconnect.bind(this));

            if (typeof(state[1]) === "number") {
                var remaining = Math.max(Math.floor(state[1] - (this.timer.getNow() / 1000.0)), 0);
                $("#remaining", this.waitingEl).text(remaining);
            }
            if (this.waitingInterval === null) {
                this.waitingInterval = this.timer.setInterval(this.updateDisplay.bind(this), 1000);
            }
        } else {
            if (this.waitingInterval !== null) {
                this.timer.clearInterval(this.waitingInterval);
                this.waitingInterval = null;
            }

            if ((state[0] === "connecting") || (state[0] === "authenticating")) {
                this.showMessage(this.connectingEl);
                this.showButton(null);
            } else if (state[0] === "connected") {
                this.showMessage(this.connectedEl);
                this.showButton(this.okEl);

                this.closeTimer = this.timer.setTimeout(this.onClose.bind(this), 1500);
            }
        }
    },

    showMessage: function(message) {
        this.showElement(message, this.messageElements);
    },

    showButton: function(button) {
        this.showElement(button, this.buttonElements);
    },

    showElement: function(item, group) {
        group.forEach(function(element) {
            if (element === item) {
                element.removeClass("hidden");
            } else {
                element.addClass("hidden");
            }
        });
    }
};

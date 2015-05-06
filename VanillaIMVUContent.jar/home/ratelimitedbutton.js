function RateLimitedButton(args) {
    this.init(args);
    this.timer = args.timer;
    this.eventBus = args.eventBus;
    this.__enable();
}

$.extend(RateLimitedButton.prototype, ModeButton.prototype, {

    onClick: function() {
        if (this.__enabled) {
            this.eventBus.fire(this.eventName);
            this.__disable();
            this.timer.setTimeout(this.__enable.bind(this), 1000);
        }
    },

    __disable: function() {
        this.__enabled = false;
        this.$div.addClass('loading');
    },

    __enable: function() {
        this.__enabled = true;
        this.$div.removeClass('loading');
    }
});
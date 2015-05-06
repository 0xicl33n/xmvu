function LearnMoreDialog(spec) {
    this.$root = $(spec.root);
    this.imvu = spec.imvu || imvuRequired;
    this.mode = spec.mode || false;
    var modeContainer = spec.modeContainer || false;

    if (modeContainer && this.mode) {
        $(modeContainer).attr('class', "show-" + this.mode);
    }

    this.$root.find('#cancel').click(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
    
    this.$root.find('#close_button').click(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));

    this.$root.find('#learn-more').click(function () {
        this.imvu.call('endDialog', true);
    }.bind(this));

    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));
}
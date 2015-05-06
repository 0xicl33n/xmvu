function InsufficientCreditsDialog(args) {
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;

    this.$title = $('#title');
    this.$body = $('.bd');
    this.$cancel = $('#insufficientCreditsDialog .ok-button');
    this.$getCredits = $('#insufficientCreditsDialog .get-credits-button');
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));

    new ImvuButton(this.$cancel, {
        grey: true,
        callback: function () {
            this.imvu.call('endDialog', true);
        }.bind(this)
    });

    new ImvuButton(this.$getCredits, {
        callback: function () {
            this.eventBus.fire('HomeMode.CreditsClicked');
            this.imvu.call('endDialog', true);
        }.bind(this)
    });
}
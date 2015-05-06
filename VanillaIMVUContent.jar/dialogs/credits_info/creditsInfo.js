function CreditsInfo(args) {
    this.imvu = args.imvu || imvuMustBeDefined;
    this.dialogInfo = this.imvu.call('getDialogInfo');

    this.setLabel('credits');
    this.setLabel('predits');
    this.setLabel('total');

    this.$getCredits = $('#get-credits-button');
    this.$getCredits.click(function () {
        this.imvu.call('endDialog', {getCredits: true});
    }.bind(this));

    this.$close = $('#click-catcher');
    this.$close.click(this.close.bind(this));
    onEscKeypress(this.close.bind(this));
}

CreditsInfo.prototype = {
    setLabel: function (name) {
        $('#' + name).html(IMVU.Client.util.number_format(this.dialogInfo[name]));
    },
    
    close: function() {
        this.imvu.call('endDialog', {getCredits: false});
    }
}


var Dom = YAHOO.util.Dom;

function AbuseConfirmationDialog(elName, imvu) {
    this.$root = $(elName);
    this.imvu = imvu || imvuMustBeDefined;
    info = this.imvu.call('getDialogInfo');

    this.$close = this.$root.find('.close');
    this.$close.click(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));

    this.$root.find('#other-avname').html(info['other_avname']);

    this.$no = this.$root.find('#no');
    this.$no.click(function () { 
               this.imvu.call('endDialog', false);
    }.bind(this));

    this.$yes = this.$root.find('#yes');
    this.$yes.click(function () {
        this.imvu.call('endDialog', true); 
    }.bind(this));

    this.imvu.call('resize', this.$root.outerWidth(true), this.$root.outerHeight(true));
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

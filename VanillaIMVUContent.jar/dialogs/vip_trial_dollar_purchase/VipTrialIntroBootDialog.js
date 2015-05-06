function VipTrialIntroBootDialog(args) {
    this.imvu = args.imvu;
    this.info = this.imvu.call('getDialogInfo');
    this.imvu.call('log', this.info);
    
    $('.close-button').click(this.cancel.bind(this));
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));
    
    $(".join-vip").click(function() {
        imvu.call('launchNamedUrl', 'vippass');
    }.bind(this));
}

VipTrialIntroBootDialog.prototype = {
    cancel: function () {
        this.imvu.call('cancelDialog');
    }
};
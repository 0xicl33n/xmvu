function WalkOffVipUpsellDialog(imvu, $vipUpsellDialog) {
    this.imvu = imvu;
    
    this.upsellReason = null;

    this.$vipUpsellDialog = $vipUpsellDialog;

    this.$vipUpsellDialog.find('.cancel.button,.close').click(function() {
        this.closeDialog();
    }.bind(this));

    this.$vipUpsellDialog.find('.getvip.button').click(function() {
        this.imvu.call('launchNamedUrl', 'vippass', {src: 'walkoff.' + this.upsellReason});
        this.$vipUpsellDialog.hide();
    }.bind(this));
};

WalkOffVipUpsellDialog.prototype = {
    show: function(upsellReason) {
        this.upsellReason = upsellReason;
        this.imvu.call('recordFact', 'vip_upsell_clicked', {source: upsellReason});
        this.$vipUpsellDialog.show();
    },

    closeDialog: function () {
        this.$vipUpsellDialog.hide();
        this.$vipUpsellDialog.remove();
    }
};


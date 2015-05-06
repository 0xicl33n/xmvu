function CreateButton(args) {
    this.init(args);
    this.eventBus = args.eventBus;

    this.eventBus.register('ServerEvent.updateCreatorStatus', function(eventName, data){
        this.setLocked(!data.isCreator);
    }.bind(this));
}

$.extend(CreateButton.prototype, ModeButton.prototype, {
    decorate: function ($elt) {
        this.vipLockedIcon = document.createElement('div');
        $(this.vipLocked).addClass('vip-locked-icon');
        $elt.append(this.vipLockedIcon);
    },
    
    customOnClick: function() {
        if (!this.imvu.call('hasVIPPass')) {
            this.imvu.call('showCreatorNeedVip');
            return false;
        } else if (!this.imvu.call('isCreator')) {
            this.imvu.call('showVipNeedRegisterForCreator');
            return false;
        }

        return true;
    },

    shouldLock: function() {
        return !this.imvu.call('isCreator');
    }
});
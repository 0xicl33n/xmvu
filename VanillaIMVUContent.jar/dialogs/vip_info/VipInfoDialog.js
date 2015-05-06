function VipInfoDialog(args) {
    this.imvu = args.imvu;
    this.info = this.imvu.call('getDialogInfo');
    this.imvu.call('log', this.info);
    
    if(!this.info.mode) {
        this.info.mode = 'regular';
    }
    
    switch(this.info.mode) {
        case 'regular':
            // do nothing here; everything's set up as 'regular' by default anyway
            break;
        case 'chatrooms':
            $('.regular').hide();
            $('.chatrooms').show();
            break;
    }
    new CancelButton('#cancel', {
        usenewvisdbuttons: true,
        callback: this.cancel.bind(this)
    });
    new ImvuButton('#learn-more', {
        usenewvisdbuttons: true,
        callback: this.learnMore.bind(this)
    });
    $('.close-button').click(this.cancel.bind(this));
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

VipInfoDialog.prototype = {
    cancel: function () {
        this.imvu.call('cancelDialog');
    },

    learnMore: function () {
        this.imvu.call('endDialog', true);
    }
};
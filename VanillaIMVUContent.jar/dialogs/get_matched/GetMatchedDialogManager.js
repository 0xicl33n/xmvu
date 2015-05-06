function GetMatchedDialogManager(spec) {
    spec = spec || {};
    var el = spec.el || rootElementRequired;
    this.$el = $(el);
    this.info = spec.info || infoRequired;
    this.imvu= spec.imvu || imvuRequired;    
    this.eventBus = spec.eventBus;

    $(el).attr('class', this.info.mode);

    if (this.info.mode === 'progress') {
        for (i in this.info.checked) {
            $(el).find('.progress li .box').eq(this.info.checked[i]).addClass('done');
        }
        var progressStr = (this.info.checked.length * 25).toString() + "%";
        $(el).find('.progress .percent').text(progressStr);
        var newOffset = -5 - 36 * ((this.info.checked.length < 1 ? 1 : this.info.checked.length) - 1);
        $(el).find('.progress .bar').attr('style', 'background-position: ' + newOffset + 'px -5px;');
    } else if (this.info.mode === 'its-a-match') {
        $(el).find('.continue-button').click(this.cancelDialog.bind(this));
        $(el).find('.invite-button').toggle(this.info.isOnline).click(this.inviteToChat.bind(this));
        $(el).find('.chat-bubble').toggle(this.info.isOnline);
        $(el).find('.send-message-button').toggle(! this.info.isOnline).click(this.sendMessage.bind(this));
        $(el).find('.match-text .avatarname').text(this.info.avatarname).click(this.showAvatarCard.bind(this));
        $(el).find('.left.picture').attr('style', 'background-image: url("' + this.info.userPics[0] + '");');
        $(el).find('.right.picture').attr('style', 'background-image: url("' + this.info.userPics[1] + '");').click(this.showAvatarCard.bind(this));
    } else if (this.info.mode === 're-order') {
        this.setupPhotos(this.info.photos, $(el));
    }

    $(el).find('.progress span.link').click(this.handleActiveProgressEvent.bind(this));
    this.$close = $(el).find('.action-close');
    this.$ok = $(el).find('.action-ok');
    this.$close.click(this.cancelDialog.bind(this));
    this.$ok.click(this.acceptDialog.bind(this));    

    //Update dialog dimensions
    $bd = $('.bd.'+this.info.mode);
    var dialogHeight = $bd.outerHeight();
    var dialogWidth = $bd.outerWidth(true);
    $(el).css('height', dialogHeight);
    this.imvu.call('resize', dialogWidth, dialogHeight);

    onEscKeypress(this.cancelDialog.bind(this));
}

GetMatchedDialogManager.prototype = {
    showAvatarCard: function() {
        this.imvu.call('showAvatarCard', this.info.userId, {avname: this.info.avatarname});
    },

    handleActiveProgressEvent: function(event) {
        var that = 'getMatched.editPhoto'
        if ($(event.target).hasClass('story')){
            that = 'getMatched.editStory';
        }
        this.cancelDialog();
        this.eventBus.fire(that);
    },

    cancelDialog: function() {
        this.imvu.call("endDialog", false);
    },
    
    acceptDialog: function(event) {
        if (this.info.mode !== 're-order') {
            this.imvu.call("endDialog", true);
            return;
        }

        var result = _.map(this.$el.find('li:not(.empty) .photo'), function(value, key) {
            return {index: parseInt(key, 10).toString(), photo_id: parseInt($(value).attr('data-photo-id'), 10).toString()};
        });
        
        this.imvu.call("endDialog", result);
    },
    
    sendMessage: function() {
        this.imvu.call('showMessageDialog', {cid: this.info.userId, recipient_name: this.info.avatarname, startWithGift: false});
        this.imvu.call("endDialog", false);
    },
    
    inviteToChat: function() {
        this.imvu.call('inviteToChat', this.info.userId);
        this.imvu.call("endDialog", false);
    },
    
    setupPhotos: function(photos, $el) {
        $el.find('.photo').parent().addClass('empty');
        
        _.each(photos, function(item, index) {
            $el.find('.photo').eq(index).parent().removeClass('empty')
            $el.find('.photo').eq(index).attr('style', 'background-image: url("'+item.url+'");').attr('data-photo-id', item.id);
        });
        
        $el.find('.photos').sortable({
            scroll: false,
            cursorAt: {left: 55, top: 55},
            tolerance: 'pointer',
            placeholder: 'placeholder',
            cancel: '.photo.empty'
        });
    }
}

function FriendsTool(args) {
    this.FULL_WIDTH = 317;
    this.FULL_HEIGHT = 369;
    this.COLLAPSED_HEIGHT = 26;

    this.toolEl = YAHOO.util.Dom.get(args.el);

    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.later = args.later || YAHOO.lang.later;
    
    this.shouldShowWalkOffInvite = _.include(['full'], this.imvu.call('getFeatureAccessLevel', 'walkoff'));
    
    this.widget = new TinyFriendsToolAvatarWidget(args.imvu);
    this.friendList = new FriendList(this.toolEl, this.imvu, this.network, this.widget, args.timer);

    this.$messageTray = $('#message_tray');
    this.messageTrayEl = this.toolEl.querySelector('#message_tray');
    this.popupEl = this.toolEl.querySelector('#popup');
    this.$messageTrayOverlay = $('#message_tray_overlay');
    this.messageTrayOverlayEl = this.toolEl.querySelector('#message_tray_overlay');
    this.btnFriendToolEl = this.toolEl.querySelector('#btn_friend_tool');
    this.onlineFriendCountEl = this.toolEl.querySelector('#online_friend_count');
    
    this.modalShadeEl = document.createElement('div');
    this.toolEl.appendChild(this.modalShadeEl);

    this.messageQueue = [];
    this.shownInitialFriendMessage = false;

    this.animating = false;
    this.$messageTrayOverlay.css('opacity', 0);

    this.showInitialPopupState();
    this.hideMessageTray();
    this.updateMessageTrayWidth();
    this.updateWindowSize();

    var self = this;
    function onClick(selector, cb) {
        YAHOO.util.Event.on(self.toolEl.querySelector(selector), 'click', cb, self, true);
    }

    onClick('#btn_add', this.onAddFriend);
    onClick('#btn_view_friends', this.onShowFriends);
    onClick('#invite-friend', this.onInviteByName);
    onClick('#btn_close', this.onClose);

    onClick('#btn_friend_tool', this.togglePopupVisibility);
    onClick('#online_friend_count', this.togglePopupVisibility);

    this.eventBus.register('PrefChanged-friendToolVisible', this.visibilityPrefChanged.bind(this));
    this.eventBus.register('BuddiesChanged', this.updateOnlineCount.bind(this));
    this.eventBus.register('FriendOnline', this.notifyFriendOnline.bind(this));
    this.eventBus.register('WalkOffGameStart', this.hideWalkOff.bind(this));
    this.eventBus.register('WalkOffGameEnd', this.showWalkOffIfPermitted.bind(this));
    
    this.showWalkOffIfPermitted();
}

FriendsTool.prototype = {
    setInitialBuddyState: function(buddyState) {
        this.friendList.createInitialBuddyState(buddyState);
    },
    
    handleBuddyStateEvent: function(evt, userInfo) {
        this.friendList.handleBuddyStateEvent(evt, userInfo);
    },
    
    onAddFriend: function(evt) {
        this.imvu.call('showAddFriendDialog');
    },
    
    onShowFriends: function(evt) {
        this.eventBus.fire('HomeMode.FriendsClicked');
    },

    onInviteByName: function(evt) {
        this.imvu.call('inviteByName');
    },
    
    onClose: function(evt) {
        this.setPopupVisibility(false);
    },

    setDisabledButtons: function(buttons) {
        var buttonEls = this.toolEl.querySelectorAll('#invite-friend');
        var el;
        for (var i = 0; i < buttonEls.length; i++) {
            $(buttonEls[i]).removeClass('disabled');
        }
        for each(var id in buttons) {
            el = this.toolEl.querySelector('#' + id);
            $(el).addClass('disabled');
        }
    },

    __isPopupVisible: function() {
        return $(this.toolEl).hasClass('open');
    },

    showInitialPopupState: function() {
        this.showPopupVisibility(this.imvu.call('getPref', 'friendToolVisible'));
    },

    showPopupVisibility: function(v) {
        $(this.toolEl).toggleClass('open', !!v);
        this.updateWindowSize();
    },

    setPopupVisibility: function(v) {
        this.imvu.call('setPref','friendToolVisible', v);
    },

    togglePopupVisibility: function() {
        this.setPopupVisibility(!this.__isPopupVisible());
    },

    visibilityPrefChanged: function(eventName, data) {
        this.showPopupVisibility(data.newValue);
    },

    __getButtonWidth: function() {
        return this.onlineFriendCountEl.clientWidth + this.btnFriendToolEl.clientWidth;
    },

    updateWindowSize: function() {
        if (this.__isPopupVisible()) {
            this.imvu.call('setWindowSize', this.FULL_WIDTH, this.FULL_HEIGHT);
        } else if (this.animating) {
            this.imvu.call('setWindowSize', this.FULL_WIDTH, this.COLLAPSED_HEIGHT);
        } else {
            this.imvu.call('setWindowSize', this.__getButtonWidth(), this.COLLAPSED_HEIGHT);
        }
    },

    updateMessageTrayWidth: function(){
        var bw = this.__getButtonWidth();

        var width = ''+ (this.FULL_WIDTH - bw - 10) + 'px';
        this.$messageTray.width(width);
        this.$messageTrayOverlay.width(width);

        var right = '' + bw + 'px';
        this.$messageTray.css('right', right);
        this.$messageTrayOverlay.css('right', right);
    },

    updateOnlineCount: function(eventName, data) {
        this.onlineFriendCountEl.innerHTML = data.onlineBuddyCount.toString();

        if (!this.shownInitialFriendMessage && data.onlineBuddyCount > 0){
            this.updateMessageTray(_T("You have")+' <span>' + data.onlineBuddyCount + '</span> '+((data.onlineBuddyCount == 1)?_T("friend online."):_T("friends online.")));
        }
        this.shownInitialFriendMessage = true;
        this.updateWindowSize();
    },

    notifyFriendOnline: function(eventName, data){
        this.updateMessageTray('<span>'+data.avatarName+'</span> '+_T("is now online."));
    },
    
    hideWalkOff: function(){
        $(this.toolEl).removeClass('has-walkoff');
    },
    
    showWalkOffIfPermitted: function(){
        if (this.shouldShowWalkOffInvite) {
            $(this.toolEl).addClass('has-walkoff');
        }
    },

    updateMessageTray: function(message){        
        this.messageQueue.push(message);

        if (!this.animating){
            this.animateNextMessage();
        }
    },

    animateNextMessage: function(){
        this.animating = true;
        this.$messageTray.html(this.messageQueue.shift());

        this.updateMessageTrayWidth();
        this.updateWindowSize();
        
        this.$messageTray.fadeIn('slow', function(){
            var flashTime = 400;
            var waitTime = 800;
            var flashOpacity = 0.4
            this.$messageTrayOverlay.fadeTo(waitTime, 0)
                                    .fadeTo(flashTime, flashOpacity).fadeTo(flashTime, 0).delay(waitTime)
                                    .fadeTo(flashTime, flashOpacity).fadeTo(flashTime, 0).delay(waitTime)
                                    .fadeTo(flashTime, flashOpacity).fadeTo(flashTime, 0).delay(waitTime)
                                    .fadeTo(waitTime, 0, function(){
                                        this.$messageTray.fadeOut('slow', function() {
                                            this.hideMessageTray();
                                        }.bind(this));
                                    }.bind(this));
        }.bind(this));
    },

    hideMessageTray: function(){
        this.$messageTray.hide();

        if (this.messageQueue[0]){
            this.animateNextMessage();
        } else {
            this.animating = false;

        }
        this.updateWindowSize();
    }
};

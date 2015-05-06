
function TinyFriendsToolAvatarWidget(imvu, timer) {
    this.imvu = imvu;
    this.timer = timer || new Timer();

    this.SPINNY_TIME = 5000; //5 seconds
}

TinyFriendsToolAvatarWidget.prototype = {

    getParentAvatarDiv : function(node) {
        while (node != document.body && !$(node).hasClass('avatar')) {
            node = node.parentNode;
        }
        return node;
    },

    create: function(userId, userInfo, additionalClass) {
        var avname = (userInfo.buddy_guest ? '<span class="guest">Guest_</span>' : '') + userInfo.buddy_name;

        var div = document.createElement('div');
        YAHOO.util.Dom.setAttribute(div, 'cid', userId);
        YAHOO.util.Dom.setAttribute(div, 'avname', userInfo.buddy_name);

        $(div).addClass('avatar')
              .toggleClass('friend', userInfo.buddy_type == 'BUDDY')
              .toggleClass('recent-chat', userInfo.buddy_type == 'RECENT_CHAT')
              .toggleClass(ONLINE_CLASS_NAME, !!userInfo.is_online)
              .toggleClass('vip', !!userInfo.has_vip)
              .toggleClass('mp', !!userInfo.is_married)
              .toggleClass('ap', !!userInfo.has_ap && !this.imvu.call('isTeen'));

        var url = userInfo.avpic_url,
            shopTogetherHTML = '';
        if (this.imvu.call('canInviteToShopTogether')) {
            shopTogetherHTML = '<div class="shop-together ui-event" data-ui-name="shop-together" data-ui-section="' + additionalClass + '"></div>';
        }
        div.innerHTML = [
            '<div class="tn ui-event" data-ui-name="thumbnail" data-ui-section="' + additionalClass + '"><img class="avpic" src="'+ url +'"></div>',
            '<div class="details ui-event" data-ui-name="details" data-ui-section="' + additionalClass + '">',
                '<div class="name">',
                    '<span class="avatar-name ui-event" data-ui-name="avatar-name" data-ui-section="' + additionalClass + '">'+ avname +'</span>',
                    '<div class="vip-icon ui-event" data-ui-name="vip-icon" data-ui-section="' + additionalClass + '"></div>',
                    '<div class="ap-icon ui-event" data-ui-name="ap-icon" data-ui-section="' + additionalClass + '"></div>',
                    '<div class="mp-icon ui-event" data-ui-name="mp-icon" data-ui-section="' + additionalClass + '"></div>',
                '</div>',
                '<div class="availability">',
                    '<div class="available-icon"></div>',
                    '<span class="location-details no-location">',
                        '<span class="online-text">'+_T("Online")+'</span>',
                        '<span class="location-text">',
                            '<span class="now-at ui-event" data-ui-name="now-at" data-ui-section="' + additionalClass + '">',
                            '<span class="now-at-text ui-event" data-ui-name="now-at-text" data-ui-section="' + additionalClass + '">'+_T("Now at")+': </span>',
                            '<span class="location ui-event" data-ui-name="location" data-ui-section="' + additionalClass + '">',
                        '</span>',
                        '</span>',
                            '<div class="vip-icon ui-event" data-ui-name="vip-icon" data-ui-section="' + additionalClass + '"></div>',
                            '<div class="ap-icon ui-event" data-ui-name="ap-icon" data-ui-section="' + additionalClass + '"></div>',
                            '<div class="mp-icon ui-event" data-ui-name="mp-icon" data-ui-section="' + additionalClass + '"></div>',
                        '</span>',
                        '<span class="locating-text">'+_T("Locating")+'...</span>',
                    '</span>',
                '</div>',
                '<div class="actions">',
                       '<div class="invite ui-event" data-ui-name="invite" data-ui-section="' + additionalClass + '"></div>',
                       '<div class="walkoff-invite ui-event" data-ui-name="walkoff-invite" data-ui-section="' + additionalClass + '"></div>',
                       shopTogetherHTML,
                       '<div class="message ui-event" data-ui-name="message" data-ui-section="' + additionalClass + '"></div>',
                       '<div class="info ui-event" data-ui-name="info" data-ui-section="' + additionalClass + '"></div>',
                '</div>',
            '</div>'
        ].join('');

        return div;
    },

    registerEventHandlers: function(elParent) {
        var self = this;
        YAHOO.util.Event.on(elParent, 'mouseover',
           function (e) {
                var $node = $(self.getParentAvatarDiv(e.target));
                if ($node.hasClass('avatar')) {
                    $node.addClass('mouseover');
                }
            }
        );

        YAHOO.util.Event.on(elParent, 'mouseout',
           function (e) {
                var $node = $(self.getParentAvatarDiv(e.target));
                if ($node.hasClass('avatar')) {
                    $node.removeClass('mouseover');
                }
            }
        );

        YAHOO.util.Event.on(elParent, 'click', this.onClick, this, true);
    },

    updateRecentChatFriendLink: function (userId, div, isFriend, inviteSent) {
    },

    onClick: function(evt) {
        var elTarg = YAHOO.util.Event.getTarget(evt),
            elPar = this.getParentAvatarDiv(elTarg),
            targetClassName = '';
        if(!elPar) {
            return;
        }

        var avname = YAHOO.util.Dom.getAttribute(elPar, 'avname');
        var cid = parseInt(YAHOO.util.Dom.getAttribute(elPar, 'cid'), 10);
        if (!cid) {
            return;
        }

        targetClassName = elTarg.className.replace('ui-event', '').replace(' ', '');
        switch (targetClassName) {
            case 'avatar-name':
            case 'avpic':
            case 'info': this.showAvatarCard(cid); return;
            case 'message': this.showMessageDialog(cid, avname); return;
            case 'vip-icon': this.showVipCard(); return;
            case 'ap-icon': this.showApCard(); return;
            case 'mp-icon': this.showMpInfoDialog(); return;
            case 'location': this.showRoomCard(elTarg.roomInstanceId); return;
            case 'invite': 
                this.invokeSpinnerAnimation(elTarg);
                this.inviteToChat(cid); 
                return;
            case 'walkoff-invite':
                this.imvu.call('inviteToWalkoff', cid);
                return;
            case 'shop-together':
                this.imvu.call('shopTogether', cid);
                return;
            default: return;
        }
    },
    
    invokeSpinnerAnimation : function(el) {
        var that_el = el;
        
        $(that_el).removeClass('invite')
                  .addClass('spinning');
        
        this.timer.setTimeout( 
            function() {
                $(that_el).addClass('invite')
                          .removeClass('spinning');
            }, 
            this.SPINNY_TIME
        ); // 5 seconds
    },
    
    showAvatarCard : function(cid) {
        // avname is not always correct - it is "ClientTest6" when it should be "guest_ClientTest6".
        // AvatarCard() will anyway populate info from the server.
        this.imvu.call('showAvatarCard', cid, {avname: null});
    },

    showVipCard : function() {
        this.imvu.call('showVipInfo');
    },

    showApCard : function() {
        this.imvu.call('showApInfo');
    },

    showMpInfoDialog : function() {
        this.imvu.call('showMarriagePackageInfo');
    },

    showRoomCard : function(roomInstanceId) {
        this.imvu.call('showRoomCard', roomInstanceId);
    },

    inviteToChat : function(cid) {
        this.imvu.call('inviteToChat', cid);
    },

    showMessageDialog : function(cid, avname) {
        this.imvu.call('showMessageDialog', {cid: cid, recipient_name: avname});
    }
};

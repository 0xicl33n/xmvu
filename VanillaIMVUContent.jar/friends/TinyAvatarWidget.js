
function TinyAvatarWidget(imvu, friendList) {
    this.imvu = imvu;
    this.friendList = friendList;
}

TinyAvatarWidget.prototype = {
    getParentAvatarDiv : function(node) {
        while (node != document.body && !$(node).hasClass('avatar')) {
            node = node.parentNode;
        }
        return node;
    },

    create: function(userId, userInfo, additionalClass) {
        var avname = userInfo.buddy_guest ? 'Guest_'+ userInfo.buddy_name : userInfo.buddy_name;
        var div = document.createElement('div');
        $(div).addClass('avatar');
        YAHOO.util.Dom.setAttribute(div, 'cid', userId);
        YAHOO.util.Dom.setAttribute(div, 'avname', userInfo.buddy_name);

        if(userInfo.is_online) {
            $(div).addClass(ONLINE_CLASS_NAME);
        }
        if(userInfo.has_vip) {
            $(div).addClass('vip');
        }
        if(userInfo.has_ap && !this.imvu.call('isTeen')) {
            $(div).addClass('ap');
        }
        if(userInfo.is_married) {
            $(div).addClass('mp');
        }
        
        $(div).addClass(additionalClass);
        var url = userInfo.avpic_url,
            friend_action_class = userInfo['is_recommended_friend'] ? 'add' : 'remove',
            friend_action_text = userInfo['is_recommended_friend'] ? _T('Add friend') : _T('Unfriend');
        div.innerHTML = '\
            <div class="tn"><img class="avpic" src="'+ url +'"></div>\
            <div class="details">\
                <div class="name">\
                    <span class="avatar-name">'+ avname +'</span>\
                    <span class="vip-icon"></span>\
                    <span class="ap-icon"></span>\
                    <span class="mp-icon"></span>\
                </div>\
                <div class="birthday-content">\
                    <div>\
                        <span class="birthday-icon"></span>\
                        <span class="birthday-text">'+_T("Birthday")+' ' + userInfo.birthday + '!</span>\
                    </div>\
                    <div id="' + avname + '-birthday" class="gift">'+_T("Send Gift")+'</div>\
                </div>\
                <div class="availability">\
                    <span class="online-icon"></span>\
                    <span class="location-details no-location">\
                    <span class="location-text"><span class="now-at ui-event" data-ui-name="NowAt" data-ui-section="' + additionalClass + '"><span class="now-at-text">'+_T("Now at:")+' </span><span class="location"></span></span>\
                            <span class="vip-icon"></span>\
                            <span class="ap-icon"></span>\
                            <span class="mp-icon"></span>\
                        </span>\
                        <span class="online-text">'+_T("Online")+'</span>\
                        <span class="locating-text">'+_T("Locating...")+'</span>\
                    </span>\
                </div>\
                <div class="actions">\
                    <ul>\
                       <li class="invite ui-event" data-ui-name="Invite" data-ui-section="' + additionalClass + '">'+_T("Invite")+'</li>\
                       <li class="message ui-event" data-ui-name="Message" data-ui-section="' + additionalClass + '">'+_T("Message")+'</li>\
                    </ul>\
                    <span class="' + friend_action_class + ' ui-event" data-ui-name="' + friend_action_text + '" data-ui-section="' + additionalClass + '">' + friend_action_text + '</span>\
                </div>\
            </div>\
            <span class="info-icon"></span>';

        return div;
    },

    registerEventHandlers: function(elParent) {
        var self = this,
            targetClassName = '';
        YAHOO.util.Event.on(
           elParent,
           'click',
           function(e) {
                var elTarg = YAHOO.util.Event.getTarget(e);
                var elPar = self.getParentAvatarDiv(elTarg);
                if(!elPar) {
                    return;
                }
                var cid = parseInt(YAHOO.util.Dom.getAttribute(elPar, 'cid'), 10);
                if(cid) {
                    var avname = YAHOO.util.Dom.getAttribute(elPar, 'avname');
                    targetClassName = elTarg.className.replace('ui-event', '').replace(' ', '');
                    switch(targetClassName) {
                        // avname is not always correct - it is "ClientTest6" when it should be "guest_ClientTest6".
                        // AvatarCard() will anyway populate info from the server.
                        case 'avpic': self.showAvatarCard(cid, null);
                            break;
                        case 'avatar-name': self.showAvatarCard(cid, null);
                            break;
                        case 'vip-icon': self.showVipCard();
                            break;
                        case 'ap-icon': self.showApCard();
                            break;
                        case 'mp-icon': self.showMpInfoDialog();
                            break;

                        case 'location': self.showRoomCard(elTarg.roomInstanceId);
                            break;
                        case 'invite': self.inviteToChat(cid);
                            break;
                        case 'message': self.showMessageDialog(cid, avname, false);
                            break;
                        case 'remove': self.removeFriend(cid, elPar);
                            break;
                        case 'add': self.addFriend(cid, elPar);
                            break;
                        case 'info-icon': self.showAvatarCard(cid, null);
                            break;
                        default:
                            if($(elPar).hasClass('birthday')) {
                                self.showMessageDialog(cid, avname, true);
                            }
                            break;
                    }

                    IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
                }
            }
        );

        YAHOO.util.Event.on(elParent, 'mouseover',
           function (e) {
                var $node = $(self.getParentAvatarDiv(e.target));
                if ($node.hasClass('avatar')) {
                    if ($node.hasClass('birthday')) {
                        $node.addClass('birthday-mouseover');
                    } else {
                        $node.addClass('mouseover');
                    }
                }
            }
        );

        YAHOO.util.Event.on(elParent, 'mouseout',
           function (e) {
                var $node = $(self.getParentAvatarDiv(e.target));
                if ($node.hasClass('avatar')) {
                    if ($node.hasClass('birthday')) {
                        $node.removeClass('birthday-mouseover');
                    } else {
                        $node.removeClass('mouseover');
                    }
                }
            }
        );
    },
    
    updateRecentChatFriendLink: function (userId, div, isFriend, inviteSent) {
        var el = div.querySelector('.actions span');

        $(el).removeClass('add remove pending');
        if (isFriend) {
            $(el).addClass('remove');
            el.innerHTML = _T("Unfriend");
        } else {
            if (inviteSent) {
                $(el).addClass('pending');
                el.innerHTML = _T("Pending");
            } else {
                $(el).addClass('add');
                el.innerHTML = _T("Add friend");
            }
        }
    },


    showAvatarCard : function(cid, avname) {
        this.imvu.call('showAvatarCard', cid, {avname: avname});
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

    showMessageDialog : function(cid, avname, gift) {
        this.imvu.call('showMessageDialog', {cid: cid, recipient_name: avname, startWithGift: gift});
    },

    addFriend : function(cid, elPar) {
        this.friendList.addFriend(cid, elPar);
    },

    removeFriend : function(cid, elPar) {
        this.friendList.removeFriend(cid, elPar);
    }
};

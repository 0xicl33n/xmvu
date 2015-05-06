function WalkOffInviteDialog(imvu, eventBus, $dialog) {
    this.$dialog = $dialog || $('.invite-dialog');
    this.$friendList = $('.friend-list .scrollable', this.$dialog);
    this.$friendTemplate = $('.template .friend-box', this.$dialog);
    this.imvu = imvu;

    $('.close', this.$dialog).click(this.hide.bind(this));

    this.$onlineFilterCheck = $('.online-filter', this.$dialog);
    this.$onlineFilterCheck.click( function() {
        this.$onlineFilterCheck.toggleClass('checked');
        this.updateFriendList(this.allFriends);
    }.bind(this));
    this.allFriends = [];
    eventBus.register('InviteRequestComplete', this.hide, 'InviteHandler', this);
}

WalkOffInviteDialog.prototype = {
    show: function() {
        this.enableButtons(true);
        this.$dialog.show();
    },

    hide: function() {
        this.$dialog.hide();
    },

    enableButtons: function(enable) {
        $('.friend-invite.button', this.$dialog).each(function(){
            this.style.opacity = (enable ? '1.0' : '0.8');
            this.disabled = !enable;
        });
    },

    compareFriends: function(a, b) {
        if (a.is_online !== b.is_online) {
            return a.is_online ? -1 : 1;
        }
        return a.buddy_name.localeCompare(b.buddy_name);
    },

    updateFriendList: function(friendList) {
        this.allFriends = friendList;
        var friends = [];
        this.countOnline = 0;
        for (var userId in friendList.BUDDIES) {
            if (friendList.BUDDIES[userId].is_online || !this.$onlineFilterCheck.hasClass('checked')){
                friends.push(friendList.BUDDIES[userId]);
            }
            if (friendList.BUDDIES[userId].is_online) {
                this.countOnline++;
            }
        }
        friends.sort(this.compareFriends);

        this.$friendList.empty();
        for (var index in friends) {
            var info = friends[index];
            this.addFriend(info.buddyItemId, info);
        }
        this.sortedFriends = friends;
        this.updateOnlineCount();
    },

    updateOnlineCount: function(adjust){
        if (adjust){
            this.countOnline += adjust;
        }
        $('.online-count').text(this.countOnline);
    },

    handleBuddyStateEvent: function(eventData, userInfo) {
        var updateType = eventData[0];

        switch(updateType) {
            case "ADD_BUDDY":
                this.addSortedBuddy(userInfo);
                break;

            case "REMOVE_BUDDY":
                this.removeSortedBuddy(userInfo);
                break;

            case "BUDDY_ONLINE_STATUS":
                this.removeSortedBuddy(userInfo);
                this.addSortedBuddy(userInfo);
                break;
        }
    },

    removeSortedBuddy: function(userInfo){
        for (var index in this.sortedFriends){
            if (this.sortedFriends[index].buddyItemId === userInfo.buddyItemId){
                $(this.$friendList.children()[index]).remove();
                if (this.sortedFriends[index].is_online){
                    this.updateOnlineCount(-1);
                }
                this.sortedFriends.splice(index, 1);
            }
        }
    },

    addSortedBuddy: function(userInfo){
        if (this.$onlineFilterCheck.hasClass('checked') && !userInfo.is_online){
            return;
        }

        var insertBefore = null;
        var index = 0;
        for (index in this.sortedFriends){
            if (this.compareFriends(userInfo, this.sortedFriends[index]) < 0){
                insertBefore = this.$friendList.children()[index];
                break;
            }
        }
        this.sortedFriends.splice(index, 0, userInfo);

        if (userInfo.is_online){
            this.updateOnlineCount(1);
        }
        this.addFriend(userInfo.buddyItemId, userInfo, insertBefore);
    },

    addFriend: function(cid, info, insertBefore) {
        var numFriends = this.$friendList.children().length;
        var buddyName = (info.buddy_guest ? 'guest_' : '') + info.buddy_name;

        var $friend = this.$friendTemplate.clone();
        $('.name', $friend).text(buddyName);
        $('.portrait', $friend).css('background-image', 'url(' + info.avpic_url + ')');
        if (info.is_online) {
            $('.status.online', $friend).css('display', 'block');
        } else {
            $('.status.offline', $friend).css('display', 'block');
        }
        var $button = $('.friend-invite.button', $friend);
        $button.click(function() {
            this.imvu.call('playSound', 'menu_click');
            this.enableButtons(false);
            this.imvu.call('sendWalkOffInvite', cid);
        }.bind(this));
        
        if (!insertBefore){
            this.$friendList.append($friend);
        } else {
            $friend.insertBefore(insertBefore);
        }
    }
};

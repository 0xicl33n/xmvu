
function FriendToolbar(imvu, friendList) {
    this.imvu = imvu;
    this.friendList = friendList;

    var showOfflineUsers = this.imvu.call("getPref", "showOfflineInFriendsMode");
    this.showOfflineCheckbox = document.querySelector('#show_offline_friends');
    this.showOfflineCheckbox.checked = showOfflineUsers;
    this.friendList.setOfflineFriendsVisible(showOfflineUsers);

    var self = this;

    YAHOO.util.Event.on(
        this.showOfflineCheckbox,
        'click',
        function () {
            this.imvu.call("setPref", "showOfflineInFriendsMode", this.showOfflineCheckbox.checked);
            this.friendList.setOfflineFriendsVisible(this.showOfflineCheckbox.checked);
            IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
        }.bind(this)
    );

    YAHOO.util.Event.addListener('refresh-button', 'click', function () {
        self.friendList.updateLocationsForAll();
        self.friendList.refreshRecommendation();
    });

    this.toolTip = new YAHOO.widget.Tooltip("toolTip", { context:['friend_settings', 'friend_search'], showDelay:500, xyoffset:[-60, 0]});

    this.searchField = document.querySelector('#search_field');
    YAHOO.util.Event.on(
        'search_field',
        'keyup',
        function(evt) {
            self.friendList.updateUserDisplayForSearch(this.value);
        }
    );

    var openMenu = null;
    YAHOO.util.Event.on(
        ['friend_settings', 'friend_search'],
        'click',
        function() {
            YAHOO.util.Dom.batch(
                [document.querySelectorAll('#util_links li'), YAHOO.util.Dom.getElementsByClassName('util-menu', 'div', 'header_menus')],
                function(el) {
                    $(el).removeClass('open');
                }
            );

            var prevOpenMenu = openMenu;

            if (this.id == openMenu) {
                $(this).removeClass('open');
                $('#'+this.id +'_menu').removeClass('open');
                $('#friend_list').removeClass('open');
                openMenu = null;
            } else {
                $(this).addClass('open');
                $('#'+this.id +'_menu').addClass('open');
                $('#friend_list').addClass('open');
                openMenu = this.id;
            }

            if (this.id == 'friend_settings' || prevOpenMenu == 'friend_search') {
                self.searchField.value = "";
                self.friendList.updateUserDisplayForSearch(self.searchField.value);
            }

            IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
        }
    );

    YAHOO.util.Event.on(
        'friend_search',
        'click',
        function() {
            document.querySelector('#search_field').focus()
        }
    );

    YAHOO.util.Event.on(
        'friend_add',
        'click',
        this.friendAddButton = new ImvuButton(
                "#friend_add",
                {
                    callback: function() {
                        this.imvu.call('showAddFriendDialog');
                        IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
                    }.bind(this),
                    small: true,
                    grey: true,
                } 
            )

    );

    YAHOO.util.Event.on(
        'friend_settings_view',
        'click',
        function() {
            self.friendList.toggleViewMode();
            IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
        }
    );
}

FriendToolbar.prototype = {
    handleShowOfflineCheckboxUpdate: function(checkedValue) {
        if (checkedValue != this.showOfflineCheckbox.checked) {
            this.showOfflineCheckbox.checked = checkedValue;
            this.friendList.setOfflineFriendsVisible(checkedValue);
        }
    }
};

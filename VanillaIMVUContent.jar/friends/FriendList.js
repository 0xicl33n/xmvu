var ONLINE_CLASS_NAME = 'online';

function FriendList(friendListEl, imvu, network, widget, timer) {
    this.imvu = imvu;
    this.network = network;
    this.widget = widget || new TinyAvatarWidget(this.imvu, this);
    this.timer = timer || new Timer();

    var self = this;

    this.shouldShowRecommendedFriend = this.imvu.call('shouldSeeRecommendedFriends');
    if(!this.shouldShowRecommendedFriend) {
        friendListEl.querySelector('#recommended_friends_container').style.display="none";
    }

    this.noFriendNoChatContainer = friendListEl.querySelector('#no_friend_no_chat_container');
    
    this.recentChatsData = {};
    this.friendBuckets = {};
    this.recentChatBuckets = {};
    this.invitesSent = {};
    var friendContainer = friendListEl.querySelector('#friends_container');
    var friendsHeader = friendContainer.querySelector('.title');
    this.friendsSubsection = {
        parent: this,
        container: friendContainer,
        el: friendContainer.querySelector('.people-list'),
        header: friendsHeader,
        headerStr: friendsHeader.innerHTML,
        count: 0,
        onlineCount: 0,
        avatars: {},
        userIdsOrdered: [],
        buckets: {},
        avatarClass: 'friend',
        loaded: false,
        getBucket: function(userInfo) {
            if(userInfo.is_online) {
                return this.buckets.online_bucket.div;
            }

            var namePrefix = userInfo.buddy_name.toLowerCase().substring(0, 2);
            var bucketKeyA = namePrefix[0];
            var bucketKeyB = (namePrefix.length > 1) ? namePrefix[1] : "_";

            if (!this.buckets[bucketKeyA]) {
                self.createBucket(this.buckets, bucketKeyA, this.el, parent.__showOfflineUsers);
            }

            if(!this.buckets[bucketKeyA][bucketKeyB]) {
                self.insertBucket(this.buckets[bucketKeyA], bucketKeyB);
            }

            return this.buckets[bucketKeyA][bucketKeyB];
        }
    };

    this.setupCollapsingSection('friends_header', 'friends_container');
    this.updateSubsectionHasPeople(this.friendsSubsection);

    YAHOO.util.Event.addListener(friendContainer.querySelector('.no-people a'), 'click', function () {
        IMVU.Client.EventBus.fire('FriendsMode.jumpToFindPeople');
        IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
    }.bind(this));

    this.animateImages = function (animate) {
        window.QueryInterface(window.Components.interfaces.nsIInterfaceRequestor).getInterface(window.Components.interfaces.nsIDOMWindowUtils).imageAnimationMode = animate ?
            window.Components.interfaces.imgIContainer.kNormalAnimMode : window.Components.interfaces.imgIContainer.kDontAnimMode;
    };

    this.startRefreshSpinner = function() {
        var button = document.querySelector('#refresh-button');
        $(button).addClass('spinning');
        self.animateImages(true);
    };

    this.stopRefreshSpinner = function() {
        var button = document.querySelector('#refresh-button');
        if (button){
            $(button).removeClass('spinning');
        }
        self.animateImages(false);
    };

    IMVU.Client.EventBus.register('FriendsRefreshStart', this.startRefreshSpinner.bind(this));
    IMVU.Client.EventBus.register('FriendsRefreshEnd', this.stopRefreshSpinner.bind(this));

    var recentChatsContainer = friendListEl.querySelector('#recent_chats_container');
    var recentChatsHeader = recentChatsContainer.querySelector('.title');
    this.recentChatsSubsection = {
        container: recentChatsContainer,
        el: recentChatsContainer.querySelector('.people-list'),
        header: recentChatsHeader,
        headerStr: recentChatsHeader.innerHTML,
        count: 0,
        onlineCount: 0,
        avatars: {},
        userIdsOrdered: [],
        buckets: {},
        avatarClass: 'recent-chat',
        loaded: false,
        getBucket: function(userInfo) {
            if(userInfo.is_online) {
                return this.buckets.online_bucket.div;
            } else {
                return this.buckets.offline_bucket.div;
            }
        }
    };

    this.setupCollapsingSection('recent_chats_header', 'recent_chats_container');
    this.updateSubsectionHasPeople(this.recentChatsSubsection);

    var birthdaysContainer = friendListEl.querySelector('#birthdays_container');
    var birthdaysHeader = birthdaysContainer.querySelector('.title');
    this.birthdaysSubsection = {
        container: birthdaysContainer,
        el: birthdaysContainer.querySelector('.people-list'),
        header: birthdaysHeader,
        headerStr: birthdaysHeader.innerHTML,
        count: 0,
        onlineCount: 0,
        avatars: {},
        userIdsOrdered: [],
        buckets: {},
        avatarClass: 'birthday',
        loaded: false,
        getBucket: function(userInfo) {
            var bucketKey = userInfo.bday_countdown;
            if(!this.buckets.main_bucket[bucketKey]) {
                self.insertBucket(this.buckets.main_bucket, bucketKey);
            }

            return this.buckets.main_bucket[bucketKey];
        }
    };

    this.setupCollapsingSection('birthdays_header', 'birthdays_container');
    this.updateSubsectionHasPeople(this.birthdaysSubsection);

    if (this.shouldShowRecommendedFriend) {
        this.recommendedFriendsList = {};
        var recommendedFriendsContainer = friendListEl.querySelector('#recommended_friends_container');
        var recommendedFriendsHeader = recommendedFriendsContainer.querySelector('.title');
        this.recommendedFriendsSubsection = {
            container: recommendedFriendsContainer,
            el: recommendedFriendsContainer.querySelector('.people-list'),
            header: recommendedFriendsHeader,
            headerStr: recommendedFriendsHeader.innerHTML,
            count: 0,
            onlineCount: 0,
            avatars: {},
            userIdsOrdered: [],
            buckets: {},
            avatarClass: 'recommended-friends',
            loaded: false,
            getBucket: function(userInfo) {
                var namePrefix = userInfo.buddy_name.toLowerCase().substring(0, 2);
                var bucketKeyA = namePrefix[0];
                var bucketKeyB = (namePrefix.length > 1) ? namePrefix[1] : "_";

                if (!this.buckets[bucketKeyA]) {
                    self.createBucket(this.buckets, bucketKeyA, this.el, true);
                }

                if(!this.buckets[bucketKeyA][bucketKeyB]) {
                    self.insertBucket(this.buckets[bucketKeyA], bucketKeyB);
                }
                return this.buckets[bucketKeyA][bucketKeyB];
            }
        };

        this.setupCollapsingSection('recommended_friends_header', 'recommended_friends_container');
        this.updateSubsectionHasPeople(this.recommendedFriendsSubsection);

        this.refreshRecommendation();
    }

    YAHOO.util.Event.addListener(recentChatsContainer.querySelector('.no-people button'), 'click', function () {
        IMVU.Client.EventBus.fire('FriendsMode.jumpToChat');
        IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
    });

    this.prepopulateInitialBuckets();

    this.__showOfflineUsers = false;
    this.__updateLocationsForAllTimerSet = false;

    this.updateOnlineUsersDisplay();

    if ( YAHOO.util.Dom.get("friend_invite") != null ) {
        this.friendInviteButton = new ImvuButton(
            "#friend_invite",
            {
                callback: function() {
                    this.imvu.call('launchNamedUrl', 'invite_your_friends');
                    IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
                }.bind(this),
                small: true,
                grey: true,
            }
        );
    }

    var listOfFriends = this.shouldShowRecommendedFriend ? ['friends', 'recent_chats', 'birthdays', 'recommended_friends'] : ['friends', 'recent_chats', 'birthdays'];
    this.widget.registerEventHandlers(listOfFriends);
}

FriendList.prototype = {
    toggleViewMode: function() {
        $('#friend_mode').toggleClass('list-view');
    },

    recommended_friends_populated : function(result, error) {
        if (error) {
            return;
        }
        if (result && (result.result == "success")) {
            for (userId in this.recommendedFriendsSubsection.avatars){
                this.removePersonDiv(userId, this.recommendedFriendsSubsection);
            }
            
            this.recommendedFriendsList = {};
            this.recommendedFriendsSubsection.avatars = {};
            this.recommendedFriendsSubsection.userIdsOrdered = [];
            this.recommendedFriendsSubsection.buckets = {};
            this.recommendedFriendsSubsection.count = 0;
            
            $.each(result.recommendations, function(index, recommendation) {
                //massage data to fit buddy object. /api/friend_recommend returns only online users.
                this.recommendedFriendsList[recommendation['cid']] = {"buddy_name" : recommendation['avatar_name'],
                                                                      "has_vip" : recommendation['is_vip'] ? 1 : 0,
                                                                      "has_ap" : recommendation['is_ap'] ? 1 : 0,
                                                                      "is_recommended_friend": true,
                                                                      "avpic_url" : recommendation['image_url'],
                                                                      "is_online" : recommendation['is_online'] ? 1 : 0
                                                                     };
                this.recommendedFriendsSubsection.userIdsOrdered.push(recommendation['cid']);
                this.recommendedFriendsSubsection.avatars[recommendation['cid']] = {userInfo: this.recommendedFriendsList[recommendation['cid']]};
            }.bind(this));
            IMVU.callJSAsync(this.imvu, this.populatePeopleList.bind(this, this.recommendedFriendsSubsection, true));
        }
    },

    addFriend : function(cid, elPar) {
        this.imvu.call('addBuddy', cid, 'client friendlist');
        this.invitesSent[cid] = true;
        this.updateRecentChatFriendLink(cid);
    },

    removeFriend : function(cid, elPar) {
        this.imvu.call('removeBuddy', cid);
        this.removePersonDiv(cid, this.friendsSubsection);
        this.updateRecentChatFriendLink(cid);
    },

    _updateLocation: function(userId, locationList, subsection) {
        var location = locationList[0];
        var data = subsection.avatars[userId];
        if (data) {
            var $locationDetails = $('.location-details', data.div),
                $locationText = $('.location', $locationDetails);

            $locationText.html(location.name);
            if (!this.imvu.call('hasAccessPass') && location.is_ap){
            }
            else {
                $locationDetails.addClass('has-location');
                $locationDetails.removeClass('no-location');
            }
            $locationText[0].roomInstanceId = location.room_instance_id;
            $locationDetails.toggleClass('ap',  location.is_ap  == '1');
            $locationDetails.toggleClass('vip', location.is_vip == '1');
            $locationDetails.toggleClass('mp', location.is_married == '1');
        }
    },

    _resetAllLocations: function(className) {
        for each (var subsection in [this.friendsSubsection, this.recentChatsSubsection, this.birthdaysSubsection]) {
            $('.online .location-details', subsection.el).each(function (index, div) {
                var $div = $(div);
                $div.removeClass('has-location');
                $div.removeClass('no-location');
                $div.removeClass('locating');
                $div.addClass(className);
            });
        }
    },

    findLocationsForPeople: function(customerIdList, callback) {
        this._resetAllLocations('locating');
        var self = this;
        function cb(locationList, error) {
            if (error) {
                IMVU.log('There was a failure fetching the locationList data.');
            } else {
                self._resetAllLocations('no-location');

                if (locationList.error) {
                    IMVU.log(' the FriendList locationlist had an error: '+locationList.error);
                    for(var x in locationList.error) {
                        IMVU.log(' locationlist.error['+x+']: '+locationList.error[x] );
                    }
                    return;
                }
                locationList = locationList.result;
                for (var index in locationList) {
                    IMVU.callJSAsync(self.imvu, self._updateLocation.bind(self, index, locationList[index], self.friendsSubsection));
                    IMVU.callJSAsync(self.imvu, self._updateLocation.bind(self, index, locationList[index], self.recentChatsSubsection));
                    IMVU.callJSAsync(self.imvu, self._updateLocation.bind(self, index, locationList[index], self.birthdaysSubsection));
                }
            }
        }
        serviceRequest({
            method: 'GET',
            uri: '/api/find_locations.php?cid='+this.imvu.call('getCustomerId')+'&cids='+customerIdList.join(','),
            callback: cb,
            json: true,
            network: this.network,
            imvu: this.imvu
        });
    },

    setupCollapsingSection: function(header_id, container_id) {
        YAHOO.util.Event.addListener(header_id, 'click', function () {
            $('#' + container_id).toggleClass('collapsed');
            IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
        });
    },

    isFriend: function (userId) {
        var isFriend = typeof this.friendsSubsection.avatars[userId] == 'object' ? true : false;
        return isFriend || !this.recentChatsSubsection.avatars[userId];
    },

    updateRecentChatFriendLink: function (userId) {
        if (this.shouldShowRecommendedFriend) {
            if (this.recommendedFriendsSubsection.avatars[userId]) {
                this.widget.updateRecentChatFriendLink(
                    userId,
                    this.recommendedFriendsSubsection.avatars[userId].div,
                    false,  //  not a friend, was recommended
                    this.invitesSent[userId]
                );
            }
        }
        if(this.recentChatsSubsection.avatars[userId]) {
            this.widget.updateRecentChatFriendLink(
                userId,
                this.recentChatsSubsection.avatars[userId].div,
                this.isFriend(userId),
                this.invitesSent[userId]
            );
        }
    },

    updateCount: function(subsection, isOnline, countDiff) {
        if (isOnline) {
            subsection.onlineCount += countDiff;
        }
        subsection.count += countDiff;
        return subsection.count;
    },

    updateHeaders: function(subsection) {
        if (subsection.count > 0) {
            if (subsection.avatarClass == 'recommended-friends') {
                subsection.header.innerHTML = [
                    subsection.headerStr,
                    '<span class="count">(<span class="number-online">',
                    subsection.count,
                    '</span>)</span>'
                ].join('');
            } else {
                subsection.header.innerHTML = [
                    subsection.headerStr,
                    '<span class="count">',
                    ' (<span class="number-online">',
                    subsection.onlineCount,
                    '</span><span class="number-total">',
                    subsection.count,
                    '</span>)',
                    '</span>'
                ].join('');
            }
        } else {
            subsection.header.innerHTML = subsection.headerStr +
                '<span class="count"> (0)</span>';
            }
    },

    insertPersonDiv: function(div, userId, subsection) {
        var userInfo = subsection.avatars[userId].userInfo;
        subsection.avatars[userId].div = div;
        div.userId = userId;

        this.binaryInsertInContainer(div, subsection.getBucket(userInfo),
            function(div) {
                return subsection.avatars[div.userId].userInfo.buddy_name.toLowerCase();
            }
        );

        this.updateCount(subsection, userInfo.is_online, 1);
        this.updateHeaders(subsection);
        this.updateRecentChatFriendLink(userId);

        this.updateSubsectionHasPeople(subsection);
    },

    updateSubsectionHasPeople: function(subsection) {
        $(subsection.container).toggleClass('has-people', (subsection.count > 0));
    },

    removePersonDiv: function(userId, subsection) {
        var peopleCount, orderedIndex;
        if(subsection.avatars[userId]) {
            var div = subsection.avatars[userId].div;

            var isOnline = $(div).hasClass(ONLINE_CLASS_NAME);
            peopleCount = this.updateCount(subsection, isOnline, -1);
            this.updateHeaders(subsection);

            if (div && div.parentNode) {
                div.parentNode.removeChild(div);
            }
            delete subsection.avatars[userId];
            orderedIndex = _.indexOf(subsection.userIdsOrdered, userId);
            if (orderedIndex >= 0) {
                subsection.userIdsOrdered.splice(orderedIndex, 1);
            }
        }

        if(peopleCount === 0) {
            this.updateSubsectionHasPeople(subsection);
            if (subsection === this.birthdaysSubsection) {
                IMVU.Client.EventBus.fire('hideBirthdayNotification');
            }
        }
    },

    getOnlinePeople: function(subsection) {
        var onlinePeople = [];
        var personList = subsection.avatars;
        for (var userId in personList) {
            if (personList[userId].userInfo.is_online) {
                onlinePeople.push(userId);
            }
        }
        return onlinePeople;
    },
    
    refreshRecommendation: function() {
        if (this.shouldShowRecommendedFriend) {
            serviceRequest({
                method: 'GET',
                uri: IMVU.SERVICE_DOMAIN + '/api/friend_recommend.php?offset=0&limit=100&page=1',
                data: null,
                network: this.network,
                imvu: this.imvu,
                callback: this.recommended_friends_populated.bind(this)
            });
        }
    },
    
    updateLocationsForAll: function() {
        if (!this.__updateLocationsForAllTimerSet) {
            this.__updateLocationsForAllTimerSet = true;
            IMVU.log('setTimeout for updateLocationsForAll');
            this.timer.setTimeout(this.updateLocationsForAllLazy.bind(this), 1000);
            IMVU.Client.EventBus.fire('FriendsRefreshStart');
        }
    },

    updateLocationsForAllLazy: function() {
        this.__updateLocationsForAllTimerSet = false;
        var onlinePeople = this.getOnlinePeople(this.friendsSubsection).concat(this.getOnlinePeople(this.recentChatsSubsection));

        IMVU.log('updateLocationsForAll NOW, num people online: ' + onlinePeople.length);

        if (onlinePeople.length > 0) {
            this.findLocationsForPeople(onlinePeople);
        }
        IMVU.Client.EventBus.fire('FriendsRefreshEnd');
    },

    orderPeopleInSubsection: function(subsection) {
        subsection.userIdsOrdered = _.sortBy(subsection.userIdsOrdered, function(userId) {
            if (!subsection.avatars[userId]) { return ""; }
            return subsection.avatars[userId].userInfo.buddy_name.toLowerCase();
        });
        return subsection;
    },

    // This is kind of Weird in order to break up non-fast DOM manipulations to keep the client responsive while building avatar lists.
    continuableCreatePersonDivs: function(subsection, updateRecent, index) {
        if (index >= subsection.userIdsOrdered.length) {
            // these only need to happen once per section, not once per avatar in the section
            this.updateHeaders(subsection);
            this.updateSubsectionHasPeople(subsection);
            subsection.loaded = true;
            this.shouldShowNoFriendNoRecentChatMessage();
            return;
        }

        // add the div.
        var userId = subsection.userIdsOrdered[index];
        var div = this.widget.create(userId, subsection.avatars[userId].userInfo, subsection.avatarClass);
        subsection.avatars[userId].div = div;
        div.userId = userId;
        var container = subsection.getBucket(subsection.avatars[userId].userInfo);
        container.appendChild(div);
        this.updateCount(subsection, subsection.avatars[userId].userInfo.is_online, 1);
        if (updateRecent) {
            this.updateRecentChatFriendLink(userId);
        }
        this.processBirthdayForNewDiv(div, userId, subsection);

        // process next.
        IMVU.callJSAsync(this.imvu, this.continuableCreatePersonDivs.bind(this, subsection, updateRecent, index+1));
    },

    shouldShowNoFriendNoRecentChatMessage: function() {
        if (this.noFriendNoChatContainer && this.friendsSubsection.loaded && this.recentChatsSubsection.loaded && this.friendsSubsection.count == 0 && this.recentChatsSubsection.count == 0) {
            YAHOO.util.Event.addListener(this.noFriendNoChatContainer.querySelector('button'), 'click', function () {
                IMVU.Client.EventBus.fire('FriendsMode.jumpToChat');
                IMVU.Client.EventBus.fire('FriendsMode.ReloadAd',{});
            });
            this.friendsSubsection.container.style.display = "none";
            this.recentChatsSubsection.container.style.display = "none";
            this.noFriendNoChatContainer.style.display = "block";
        }
    },
    
    processBirthdayForNewDiv: function(div, userId, subsection) {
        var avname = subsection.avatars[userId].userInfo.buddy_guest ?
            'Guest_'+ subsection.avatars[userId].userInfo.buddy_name :
            subsection.avatars[userId].userInfo.buddy_name;
        if (subsection.avatars[userId].userInfo.birthday) {
            this.birthdayButton = new ImvuButton(
                $('#' + avname + "-birthday",div),
                {
                    gift: true
                }
            );
        }
    },

    createPersonDivs: function(subsection, updateRecent) {
        // order users in subsection
        subsection = this.orderPeopleInSubsection(subsection);
        //start processing.
        IMVU.callJSAsync(this.imvu, this.continuableCreatePersonDivs.bind(this, subsection, updateRecent, 0));
    },

    createPersonDiv: function(userId, subsection) {
        var div = this.widget.create(userId, subsection.avatars[userId].userInfo, subsection.avatarClass);
        this.insertPersonDiv(div, userId, subsection);
        this.processBirthdayForNewDiv(div, userId, subsection);
    },

    populatePeopleList: function(subsection, updateRecent) {
        this.createPersonDivs(subsection, updateRecent);

        if (subsection.count === 0) {
            this.updateCount(subsection, false, 0);
            this.updateHeaders(subsection);
            this.updateSubsectionHasPeople(subsection);
        }
    },

    handleBuddyStateEvent: function(eventData, userInfo) {
        userInfo.buddy_name = userInfo.buddy_name.toString();
        var updateType = eventData[0];
        var userId = eventData[1];

        var subsection = this.friendsSubsection;
        if (this.isRecentChatId(userId)) {
            userId = this.getUserIdForRecentChatId(userId);
            subsection = this.recentChatsSubsection;
        }

        switch(updateType) {
            case "ADD_BUDDY":
                if (eventData[2] == 'INVITE_SENT') {
                    this.invitesSent[userId] = true;
                    this.updateRecentChatFriendLink(userId);
                } else if (!subsection.avatars[userId]) {
                    subsection.avatars[userId] = {userInfo: userInfo};
                    this.createPersonDiv(userId, subsection);
                    if (subsection == this.friendsSubsection && userInfo.birthday) {
                        this.birthdaysSubsection.avatars[userId] = {userInfo: userInfo};
                        this.createPersonDiv(userId, this.birthdaysSubsection);
                    }
                }
                if (userInfo.is_online) {
                    this.updateLocationsForAll();
                }
                break;
            case "REMOVE_BUDDY":
                this.removePersonDiv(userId, subsection);
                if (subsection == this.friendsSubsection) {
                    this.removePersonDiv(userId, this.birthdaysSubsection);
                }
                if (this.invitesSent[userId]) {
                    delete this.invitesSent[userId];
                }
                this.updateRecentChatFriendLink(userId);
                break;
            case "BUDDY_ONLINE_STATUS":
                if (subsection.avatars[userId]) {
                    this.removePersonDiv(userId, subsection);
                    subsection.avatars[userId] = {userInfo: userInfo};
                    this.createPersonDiv(userId, subsection);
                    if (subsection == this.friendsSubsection && this.birthdaysSubsection.avatars[userId]) {
                        this.removePersonDiv(userId, this.birthdaysSubsection);
                        this.birthdaysSubsection.avatars[userId] = {userInfo: userInfo};
                        this.createPersonDiv(userId, this.birthdaysSubsection);
                    }
                }
                break;
        }
    },

    createInitialBuddyState: function(buddyState) {
        var userId;

        for (userId in buddyState.BUDDIES) {
            buddyState.BUDDIES[userId].buddy_name = buddyState.BUDDIES[userId].buddy_name.toString();
            this.friendsSubsection.userIdsOrdered.push(userId);
            this.friendsSubsection.avatars[userId] = {userInfo: buddyState.BUDDIES[userId]};
            if(buddyState.BUDDIES[userId].birthday) {
                this.birthdaysSubsection.userIdsOrdered.push(userId);
                this.birthdaysSubsection.avatars[userId] = {userInfo: buddyState.BUDDIES[userId]};
            }
        }
        for (userId in buddyState.RECENT_CHATS) {
            buddyState.RECENT_CHATS[userId].buddy_name = buddyState.RECENT_CHATS[userId].buddy_name.toString();
            this.recentChatsSubsection.userIdsOrdered.push(userId);
            this.recentChatsSubsection.avatars[userId] = {userInfo: buddyState.RECENT_CHATS[userId]};
        }

        for (userId in buddyState.INVITE_SENT) {
            this.invitesSent[userId] = true;
        }
        IMVU.log("Calling JS asynchronously in createInitialBuddyState");
        IMVU.callJSAsync(this.imvu, this.populatePeopleList.bind(this, this.friendsSubsection, false));
        IMVU.callJSAsync(this.imvu, this.populatePeopleList.bind(this, this.birthdaysSubsection, false));
        IMVU.callJSAsync(this.imvu, this.populatePeopleList.bind(this, this.recentChatsSubsection, true));
        IMVU.callJSAsync(this.imvu, this.updateLocationsForAll.bind(this));
        IMVU.log("Done dispatching asynchronous JS calls for createInitialBuddyState");
    },

    refreshBirthdays: function(buddyState) {
        var userId;
        for (userId in this.birthdaysSubsection.avatars){
            this.removePersonDiv(userId, this.birthdaysSubsection);
        }

        for (userId in buddyState.BUDDIES) {
            if(buddyState.BUDDIES[userId].birthday) {
                this.birthdaysSubsection.userIdsOrdered.push(userId);
                this.birthdaysSubsection.avatars[userId] = {userInfo: buddyState.BUDDIES[userId]};
            }
        }
        this.populatePeopleList(this.birthdaysSubsection, true);
    },

    binaryInsertInContainer: function(newDiv, container, keyForDivFunc) {
        var divList = container.children;
        var newKey = keyForDivFunc(newDiv);

        var left = 0;
        var right = divList.length - 1;

        while (left <= right){
            var mid = parseInt((left + right)/2, 10);
            var keyTest = keyForDivFunc(divList[mid]);

            if (keyTest == newKey) {
                return divList[mid];
            }
            else if (keyTest < newKey) {
                left = mid + 1;
            }
            else {
                right = mid - 1;
            }
        }

        if(divList[left]) {
            container.insertBefore(newDiv, divList[left]);
        } else {
            container.appendChild(newDiv);
        }
    },

    insertBucket: function(bucketList, key) {
        var bucket = document.createElement('div');
        $(bucket).addClass('people-bucket');

        bucket.key = key;
        bucketList[key] = bucket;

        this.binaryInsertInContainer(bucket, bucketList.div, function(div) { return div.key; } );
    },

    createBucket: function(bucketList, key, parentContainer, show) {
        var bucket = document.createElement('div');
        $(bucket).addClass('people-bucket');
        bucket.style.display = show ? "block" : "none";
        bucketList[key] = {'div':bucket};
        parentContainer.appendChild(bucket);
    },


    prepopulateInitialBuckets: function() {
        this.createBucket(this.friendsSubsection.buckets, "online_bucket", this.friendsSubsection.el, true);

        orderedAvatarNameValidChars = "0123456789abcdefghijklmnopqrstuvwxyz";
        for each(var letter1 in orderedAvatarNameValidChars) {
            this.createBucket(this.friendsSubsection.buckets, letter1, this.friendsSubsection.el, this.__showOfflineUsers);
        }

        this.createBucket(this.recentChatsSubsection.buckets, "online_bucket", this.recentChatsSubsection.el, true);
        this.createBucket(this.recentChatsSubsection.buckets, "offline_bucket", this.recentChatsSubsection.el, this.__showOfflineUsers);

        this.createBucket(this.birthdaysSubsection.buckets, "main_bucket", this.birthdaysSubsection.el, true);

        if (this.shouldSeeRecommendedFriends) {
            this.createBucket(this.recommendedFriendsSubsection.buckets, "main_bucket", this.recommendedFriendsSubsection.el, true);
        }
    },

    setOfflineFriendsVisible: function(v) {
        this.__showOfflineUsers = v;
        this.updateOnlineUsersDisplay();
    },

    updateOnlineUsersDisplay: function() {
        var display = this.__showOfflineUsers ? "block" : "none";

        for (var bucketKey in this.friendsSubsection.buckets) {
            if (bucketKey != "online_bucket") {
                this.friendsSubsection.buckets[bucketKey].div.style.display = display;
            }
        }

        this.recentChatsSubsection.buckets.offline_bucket.div.style.display = display;
    },

    updateUserDisplayForSearch: function(searchString) {
        searchString = YAHOO.lang.trim(searchString);

        for each(var friend in this.friendsSubsection.avatars) {
            if (friend.userInfo.buddy_name.toLowerCase().indexOf(searchString) == -1) {
                friend.div.style.display = "none";
            } else {
                friend.div.style.display = "";
            }
        }

        for each(var recentChat in this.recentChatsSubsection.avatars) {
            if (recentChat.userInfo.buddy_name.toLowerCase().indexOf(searchString) == -1) {
                recentChat.div.style.display = "none";
            }
            else {
                recentChat.div.style.display = "";
            }
        }

        for each(var birthday in this.birthdaysSubsection.avatars) {
            if (birthday.userInfo.buddy_name.toLowerCase().indexOf(searchString) == -1) {
                birthday.div.style.display = "none";
            }
            else {
                birthday.div.style.display = "";
            }
        }

        if (this.shouldSeeRecommendedFriends) {
            for each(var recommendation in this.recommendedFriendsSubsection.avatars) {
                if (recommendation.userInfo.buddy_name.toLowerCase().indexOf(searchString) == -1) {
                    recommendation.div.style.display = "none";
                }
                else {
                    recommendation.div.style.display = "";
                }
            }
        }
    },

    RECENT_CHAT_OFFSET: 1000000000,

    getUserIdForRecentChatId: function(recentChatId) {
        return recentChatId - this.RECENT_CHAT_OFFSET;
    },

    isRecentChatId: function(userId) {
        return userId >= this.RECENT_CHAT_OFFSET;
    }
};

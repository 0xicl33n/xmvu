function createShopTogetherInvite(args) {
    var imvu = args.imvu;
    var $root = args.$root;
    var network = args.network;
    var functionHelpers = new IMVU.Client.util.FunctionHelpers({
        timer: args.timer
    });
    var $avatarListsWrapper = $root.find('#avatar-list')
    var $friendsResultsList = $root.find('#avatar-list #friend-results');
    var $nonFriendsResultsList = $root.find('#avatar-list #non-friend-results');
    var $avatars = null;
    var emptyFriendsResultsTemplate = null;
    var emptyNonFriendsResultsTemplate = null;
    var $avatarTemplate = $root.find('.template-avatar');
    var $searchInput = $root.find('input#search');
    var selectedFriendId = null;
    var fuzzy_match = IMVU.Client.util.fuzzy_match;
    var avatars = null
    var friendMatchCount = 0;
    $root.bind('friendsListReady', populateAvatarList);
    $root.bind('nonFriendSearchResults', handleNonFriendSearchResults);
    $root.bind('friendSearchResults', handleFriendSearchResults);
    var localUserCid = imvu.call('getCustomerId');
    var friendsListView = new AvatarListView({
        $root: $friendsResultsList,
        avatarTemplateGenerator: $avatarTemplate.clone.bind($avatarTemplate)
    });
    var nonFriendsListView = new AvatarListView({
        $root: $nonFriendsResultsList,
        avatarTemplateGenerator: $avatarTemplate.clone.bind($avatarTemplate)
    });

    setUpAvatarSelect();
    setUpButtons();
    setUpSearch();
    setUpEmptySearch();
    doNonFriendSearch = null;
    setUpNonFriendSearch();

    $root.height($(window).height());
    onEscKeypress(function() {
        imvu.call('cancelDialog');
    });
    $root.find('.close').click(function() {
        imvu.call('cancelDialog');
    })
    imvu.call('fetchFriendsList');

    function toggleLoading(bool) {
        $root.find('#throbber-holder').toggle(bool);
    }


    function populateAvatarList(e, friendsList) {
        toggleLoading(false);
        friendsList = _.chain(friendsList)
            .map(normalizeBuddyName)
            .sortBy(function(friend) {
                return friend.normalized_name
            })
            .map(function(friend) {
                friend.customer_id = friend.buddyItemId;
                friend.avatarname = friend.buddy_name;
                return friend;
            })
            .filter(function(friend) {
                return !!friend.is_online;
            })
            .value();

        avatars = friendsList;

        if(friendsList.length) { 
            friendsListView.setAvatarList(friendsList);
            friendMatchCount = friendsList.length;
        } else {
            friendsListView.setEmptyMessage('Meet new friends and add them to your list.', 'no-match');
        }


        $avatars = $friendsResultsList.find('.avatar');
    }

    function handleNonFriendSearchResults(e, results, searchString) {
        if(results.length) { 
            nonFriendsListView.setAvatarList(results);
            if(friendMatchCount === 0) { 
                friendsListView.setEmptyMessage('Meet new friends and add them to your list.', 'no-match');
            }
        } else { 
            nonFriendsListView.$root.empty();
            nonFriendsListView.setEmptyMessage(emptyNonFriendsResultsTemplate({name:searchString}), 'no-match');
        }
    }

    function handleFriendSearchResults(e, matches,searchString) {
        $friendsResultsList.find('.avatar').hide();
        friendMatchCount = matches.length;
        if(matches.length) { 
            friendsListView.removeEmptyMessage();
            _.each(matches, function(match) {
                match.$el.css('display', 'inline-block');
            });
        } else { 
            friendsListView.setEmptyMessage(emptyFriendsResultsTemplate({name:searchString}), 'no-match');
        }
    }

    function setUpEmptySearch() {
        _.templateSettings = {
            interpolate: /\{\{(.+?)\}\}/g
        };

        emptyFriendsResultsTemplate = _.template('"{{name}}" is not on your friends list.');
        emptyNonFriendsResultsTemplate = _.template('"{{name}}" did not match any results');

    }

    function getAvatarElement(buddyId) {
        return $avatarListsWrapper.find('#' + buddyId);
    }

    function isMatch(name, searchString) {
        return fuzzy_match(name, searchString);
    }

    function toggleResultsLoading(bool) {
        $root.find('.search-submit').toggleClass('loading', bool);
    }

    function setUpSearch() {
        IMVU.Client.util.hint([$root.find('#search')]);

        $searchInput.keyup(function(e) {
            if (!avatars) return;

            toggleResultsLoading(true);
            doNonFriendSearch();

            var $input = $(e.target);
            var searchString = $input.val();
            searchString = searchString.toLowerCase();
            var matches = _.filter(avatars, function(avatar) {
                return isMatch(avatar.normalized_name, searchString);
            });
            //TODO: empty search state
            $root.trigger('friendSearchResults', [matches, searchString])
        });

    }


    function setUpNonFriendSearch() {
        doNonFriendSearch = functionHelpers.throttle(function() {
            var url = IMVU.SERVICE_DOMAIN + '/api/find_people.php?online=1&cid=' + localUserCid;
            var searchString = $root.find('#search').val();
            if (searchString !== $root.find('#search').attr('hint')) {
                url += '&interests=' + escape(searchString);
            }
            network.asyncRequest('GET', url, {
                success: function(response) {
                    toggleResultsLoading(false);
                    _.each(response.responseText.result, function(data) {
                        data.is_online = data.online;
                        data.customer_id = data.customers_id;
                    });
                    $root.trigger('nonFriendSearchResults', [response.responseText.result, searchString]);
                },
                failure: networkError
            });
        }, 1000);
        toggleResultsLoading(true);
        doNonFriendSearch.call();
    }

    function networkError() {
        imvu.call(
            'showErrorDialog',
            _T('Network Error'),
            _T('We were not able to load more rooms.')
        );
    }

    function setUpAvatarSelect() {
        $avatarListsWrapper.delegate('.avatar', 'click', function(e) {
            var $avatar = $(e.target).closest('.avatar');
            var buddyId = $avatar.attr('id');
            if (selectedFriendId !== buddyId) {
                getAvatarElement(selectedFriendId).removeClass('selected');
                getAvatarElement(buddyId).addClass('selected');
                selectedFriendId = buddyId;
            }
            $root.trigger('friendSelected');
        });
    }

    function setUpButtons() {
        var $inviteButton = $root.find('button#invite');
        var $cancelButton = $root.find('button#cancel');

        $root.bind('friendSelected', function() {
            $inviteButton.prop('disabled', false);
        });

        $cancelButton.click(function() {
            imvu.call('cancelDialog');
        });
        $inviteButton.click(function() {
            if (!selectedFriendId) {
                return;
            }
            console.log(selectedFriendId);
            imvu.call('inviteToShopTogether', selectedFriendId);
            imvu.call('cancelDialog');
        });
    }

    function normalizeBuddyName(friend) {
        friend.normalized_name = friend.buddy_name.toLowerCase();
        return friend;
    }

    return {
        triggerFriendsListReady: function(friends) {
            $root.trigger('friendsListReady', [friends]);
        }
    };
}

function AvatarListView(args) {
    this.$root = args.$root;
    this.avatarList = [];
    this.avatarTemplateGenerator = args.avatarTemplateGenerator;
}
AvatarListView.prototype.generateAvatarElement = function(info) {
    var $avatar = this.avatarTemplateGenerator();
    $avatar.attr('id', info.customer_id);
    $avatar.toggleClass('ap', !! info.has_ap);
    $avatar.toggleClass('vip', !! info.has_vip);
    $avatar.removeClass('template-friend');
    $avatar.addClass('avatar');
    $avatar.find('.name').text(info.avatarname);
    $avatar.find('img.avatar-img').attr('src', info.avpic_url);
    return $avatar;
}
AvatarListView.prototype.setAvatarList = function(avatarList) {
    this.avatarList = avatarList;
    this.removeEmptyMessage();
    this.$root.empty();
    var $avatarsHolder = $('<span>').addClass('document-fragment');
    _.each(avatarList, function(avatar) {
        var $avatar = this.generateAvatarElement(avatar);
        avatar.$el = $avatar;
        $avatarsHolder.append($avatar);
    }.bind(this));
    this.$root.append($avatarsHolder);
}
AvatarListView.prototype.removeEmptyMessage = function() { 
    this.$root.find('.avatar-list-message').remove();
}

AvatarListView.prototype.setEmptyMessage = function(message,class_) {
    this.removeEmptyMessage();
    $('<div>')
        .addClass(class_)
        .addClass('avatar-list-message')
        .append(message)
        .appendTo(this.$root);
}

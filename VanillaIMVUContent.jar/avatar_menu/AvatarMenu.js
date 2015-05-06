function AvatarMenu(args) {
    this.elt = $(args.elt)[0];
    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    
    this.$avatarNameDiv = $('#avatarName');
    this.$badgeDiv = $('#badge');
    this.$flagMenuDiv = $('#flag-menu');
    this.$actionsDiv = $('#actions');
    this.$triggersDiv = $('#triggers');

    $('#actions-section-title').click(function(){
        this.$actionsDiv.toggleClass('hidden');
        this.$triggersDiv.toggleClass('expanded');
    }.bind(this));
    $('#triggers-section-title').click(function(){
        this.$triggersDiv.toggleClass('hidden');
        this.$actionsDiv.toggleClass('expanded');
    }.bind(this));
    
    this.$actionsDiv.click(this.handleListClick.bind(this));
    this.$triggersDiv.click(this.handleListClick.bind(this));
    
    $('#dismiss').click(this.dismiss.bind(this));
    
    $('#title', $(this.elt)).mousedown(this.startDragging.bind(this));
    $(document).mouseup(this.stopDragging.bind(this));
    
    this.selectedButtonHighlightTime = 300;
    this.wireButtonEvents();
    this.showFlagginOutfit = this.imvu.call('showFlaggingOutfit');
    
    this.eventBus.register('WalkOffGameStart', this.onWalkOffGameStarted.bind(this));
    this.eventBus.register('WalkOffGameEnd', this.onWalkOffGameEnded.bind(this));
}

AvatarMenu.prototype = {
    show : function(args) {
        this.isTargetMyself = args.is_self;
        this.cid = args.target_id;
        this.avatarName = args.target_name;
        isOwner = args.is_owner;
        isLieutenant = args.is_lieutenant;
        showBoot = args.show_boot;
        actionColor = args.action_color;
        twoPartyPrefs = args.two_party_prefs;

        this.$avatarNameDiv.text(this.avatarName);
        this.$actionsDiv.css('color', 'rgb('+actionColor[0]+','+actionColor[1]+','+actionColor[2]+')');
        
        this.resetTriggers();
        this.setBadge(isOwner, isLieutenant);

        if (!this.isTargetMyself) {
            var rollout = this.imvu.call('getImvuConfigVariable', 'client.RENEW_Coop') == 'active';
            if (rollout) {
                if (!$.isEmptyObject(twoPartyPrefs)) {
                    for(var pref in twoPartyPrefs) {
                        var pref_val = parseInt(twoPartyPrefs[pref]);
                        $('div[actionid="'+pref+'"]').toggleClass('twoPartyDisable', 0 == pref_val);
                    }
                    $(this.elt).toggleClass('showSpinner', false);
                } else {
                    $(this.elt).toggleClass('showSpinner', true);
                }
                this.disableCategoriesWithNoEnabledActions();
                this.showNoActionsAvailableWhenAllCategoriesAreDisabled();
            }
        }
        $(this.elt).toggleClass('forOtherUser', !this.isTargetMyself);

        if (showBoot) {
            $('.context-button.boot').toggle(true);
        } else {
            $('.context-button.boot').toggle(false);
        }
        
        if (this.hasWalkOffAccess() && !this.inWalkOffGame()) {
            $('.context-button.invite').css('display', 'inline-block');
        } else {
            $('.context-button.invite').css('display', 'none');
        }
        
        this.styleDisplayedButtons();
        
        this.alreadyFriend = this.imvu.call('isFriend');
        this.shouldShowShopTogetherIcon = this.imvu.call('shouldShowShopTogetherIcon');
        this.showOrHideAddFriendAndShopTogetherButtons(this.alreadyFriend, this.isTargetMyself);

        this.requestedFriend = false;
        this.isMuted = false;
        this.isBooted = false;
        this.isBlocked = this.imvu.call('isBlocked');
        this.updateBlockButton();
        
        $('#context-message').text('Select menu below');
        this.restoreCollapsedState('avatar_menu_html.actions_collapsed_categories', this.$actionsDiv);
        this.restoreHiddenTitleState();
        this.restoreScrollState();
    },

    showOrHideAddFriendAndShopTogetherButtons : function(alreadyFriend, isTargetMyself) {
        if (isTargetMyself) {
            $('.context-button.friend').hide();
            $('.context-button.shop-together').hide();
        } else if (alreadyFriend && this.shouldShowShopTogetherIcon) {
            $('.context-button.friend').hide();
            $('.context-button.shop-together').show();
        } else {
            $('.context-button.friend').show();
            $('.context-button.shop-together').hide();
        }
    },
    
    onWalkOffGameStarted: function() {
        $('.context-button.invite').css('display', 'none');
        this.styleDisplayedButtons();
    },
    
    onWalkOffGameEnded: function() {
        if (this.hasWalkOffAccess()) {
            $('.context-button.invite').css('display', 'inline-block');
            this.styleDisplayedButtons();
        }
    },
    
    hasWalkOffAccess: function() {
        return !this.isTargetMyself && _.include(['full'], this.imvu.call('getFeatureAccessLevel', 'walkoff'));
    },
    
    inWalkOffGame: function() {
        return this.imvu.call('inWalkOffGame');
    },
    
    styleDisplayedButtons: function() {
        var bootShowing = ($('.context-button.boot:visible').length > 0);
        var inviteShowing = ($('.context-button.invite:visible').length > 0);
        
        if (bootShowing && inviteShowing) {
            $('#context-buttons').addClass('show-seven-buttons');
            $('.context-button.flag').addClass('show-seven-buttons');
        } else if (bootShowing || inviteShowing) {
            $('#context-buttons').addClass('show-six-buttons');
            $('.context-button.flag').addClass('show-six-buttons');
        } else {
            $('#context-buttons').addClass('show-five-buttons');
            $('.context-button.flag').addClass('show-five-buttons');
        }
    },
    
    disableCategoriesWithNoEnabledActions: function() {
        $('#actions div.category.two_party').each(function (i, category) {
            if ($('div.action:not(.twoPartyDisable)', category).length === 0) {
                $(category).addClass('twoPartyDisable');
            }
        });
    },

    showNoActionsAvailableWhenAllCategoriesAreDisabled: function () {
        if ($('#actions div.category.two_party:not(.twoPartyDisable)').length === 0) {
            $('#no_actions_available').show();
        }
    },

    setBadge : function(isOwner, isLieutenant) {
        this.$badgeDiv.toggleClass('owner', isOwner);
        this.$badgeDiv.toggleClass('lieutenant', isLieutenant && !isOwner);
        if (isOwner || isLieutenant) {
            $('#avatarName').css('width', '145px');
        } else {
            $('#avatarName').css('width', '170px');
        }
    },
    
    updateAddFriendMessage: function(alreadyFriend, requestedFriendBefore, requestedFriendAfter) {
        if (alreadyFriend) {
            $('#context-message').text('Already Friend');
        } else if (requestedFriendBefore && requestedFriendAfter) {
            $('#context-message').text('Already Requested');
        } else if (!requestedFriendBefore && requestedFriendAfter) {
            $('#context-message').text('Requested Add Friend');
        } else {
            $('#context-message').text('Add Friend');
        }
    },
    
    updateBootMessageAndButton: function(clicked) {
        if (this.isBooted) {
            $('#context-message').text('Booted Out');                
        } else {
            if (clicked) {
                this.flashButtonOnClick('.context-button.boot');
                $('#context-message').text('Booted Out');      
            } else {
                $('#context-message').text('Boot Out');                
            }            
        }
    },
    
    updateBlockMessage: function(clicked) {
        if (this.isBlocked) {
            if (clicked) {
                $('#context-message').text('Blocked');
            } else {
                $('#context-message').text('Unblock');
            }
        } else {
            if (clicked) {
                $('#context-message').text('Unblocked');
            } else {
                $('#context-message').text('Block');
            }
        }
        this.updateBlockButton();
    },
    
    updateBlockButton: function() {
        if (this.isBlocked) {
            $('.context-button.block').addClass('selected');
        } else {
            $('.context-button.block').removeClass('selected');
        }
    },
    
    wireButtonEvents: function() {
        $('.context-button.info').click(this.handleProfileClicked.bind(this));
        $('.context-button.friend').click(this.handleAddFriendClicked.bind(this));
        $('.context-button.gift').click(this.handleGiftClicked.bind(this));
        $('.context-button.invite').click(this.handleInviteClicked.bind(this));
        $('.context-button.shop-together').click(this.handleShopTogetherClicked.bind(this));
        $('.context-button.flag').click(this.handleFlagButtonClicked.bind(this));
        $('.context-button.boot').click(this.handleBootClicked.bind(this));
        $('.context-button.block').click(this.handleBlockClicked.bind(this));
        
        $('#context-buttons .context-button.info').mouseover(function() {$('#context-message').text('Profile');});
        $('#context-buttons .context-button.friend').mouseover(function() {
            this.updateAddFriendMessage(this.alreadyFriend, this.requestedFriend, this.requestedFriend)}.bind(this));
        $('#context-buttons .context-button.shop-together').mouseover(function() {$('#context-message').text('Shop Together!');});
        $('#context-buttons .context-button.gift').mouseover(function() {$('#context-message').text('Gift');});
        $('#context-buttons .context-button.invite').mouseover(function() {$('#context-message').text('Invite to play Walk Off');});
        $('#context-buttons .context-button.flag').mouseover(function() {
            if (this.showFlagginOutfit) {
                $('#context-message').text('Flag Avatar');
            } else {
                $('#context-message').text('Flag Chat');
            }
        }.bind(this));
        $('#context-buttons .context-button.boot').mouseover(function() {
            this.updateBootMessageAndButton(false)}.bind(this));
        $('#context-buttons .context-button.block').mouseover(function() {
            this.updateBlockMessage(false)}.bind(this));
        $('#flag-outfit').click(this.handleFlagOutfitClicked.bind(this));
        $('#flag-chat').click(this.handleFlagChatClicked.bind(this));
    },
    
    flashButtonOnClick: function(selector) {
        $(selector).addClass('selected');
        setTimeout(function() {$(selector).removeClass('selected');}, this.selectedButtonHighlightTime);
    },
    
    getCollapsedCategories : function($container) {
        var categories = [];
        $('.category.collapsed', $container).each(function (index, el) {
            categories.push($(el).attr('categoryName'));
        });
        return categories.join(',');
    },
    
    storeState : function() {
        this.imvu.call('setLocalStoreValue', 'avatar_menu_html.actions_collapsed_categories', this.getCollapsedCategories(this.$actionsDiv));

        this.imvu.call('setLocalStoreValue', 'avatar_menu_html.actions_hidden', this.$actionsDiv.hasClass('hidden'));
        this.imvu.call('setLocalStoreValue', 'avatar_menu_html.triggers_hidden', this.$triggersDiv.hasClass('hidden'));

        if (this.isTargetMyself) {
            this.imvu.call('setLocalStoreValue', 'avatar_menu_html.solo_scroll_pos', this.$actionsDiv[0].scrollTop);            
            this.imvu.call('setLocalStoreValue', 'avatar_menu_html.trigger_collapsed_categories', this.getCollapsedCategories(this.$triggersDiv));
            this.imvu.call('setLocalStoreValue', 'avatar_menu_html.trigger_scroll_pos', this.$triggersDiv[0].scrollTop);
        }
        else {
            this.imvu.call('setLocalStoreValue', 'avatar_menu_html.coop_scroll_pos', this.$actionsDiv[0].scrollTop);
        }
    },
    
    restoreCollapsedState : function(localStoreKey, $container) {
        var collapsedCategories = this.imvu.call('getLocalStoreValue', localStoreKey, '').split(',');

        $('.category', $container).each(function (index, category) {
            var $category = $(category);
            if ((collapsedCategories.indexOf($category.attr('categoryName')) != -1) && !$category.hasClass('collapsed')) {
                $category.addClass('collapsed');
            }
        });
    },

    restoreHiddenTitleState : function() {
        var actionsHidden = this.imvu.call('getLocalStoreValue', 'avatar_menu_html.actions_hidden', 0);
        this.$actionsDiv.toggleClass('hidden', !!actionsHidden);
        this.$triggersDiv.toggleClass('expanded', !!actionsHidden);

        var triggersHidden = this.imvu.call('getLocalStoreValue', 'avatar_menu_html.triggers_hidden', 0);
        this.$triggersDiv.toggleClass('hidden', !!triggersHidden);
        this.$actionsDiv.toggleClass('expanded', !!triggersHidden);
    },
        
    restoreScrollState : function() {
        var actionsScrollKey = (this.isTargetMyself ? 'avatar_menu_html.solo_scroll_pos' : 'avatar_menu_html.coop_scroll_pos');
        this.$actionsDiv[0].scrollTop = this.imvu.call('getLocalStoreValue', actionsScrollKey, 0);
        this.$triggersDiv[0].scrollTop = this.imvu.call('getLocalStoreValue', 'avatar_menu_html.trigger_scroll_pos', 0);
    },
    
    dismiss : function() {
        this.storeState();
        this.imvu.call('dismiss');
    },
    
    handleProfileClicked : function() {
        this.hideFlagMenuIfShown();
        this.flashButtonOnClick('.context-button.info');
        this.imvu.call('showAvatarCard', this.cid, {avname: this.avatarName});
    },
    
    handleAddFriendClicked : function() {
        this.hideFlagMenuIfShown();
        if (this.alreadyFriend) {
            this.updateAddFriendMessage(true)
        } else if (this.requestedFriend) {
            this.updateAddFriendMessage(false, true, true)
        } else {
            this.imvu.call('addBuddy', this.cid, 'client avatarmenu');
            this.flashButtonOnClick('.context-button.friend');
            this.requestedFriend = true;

            this.showOrHideAddFriendAndShopTogetherButtons(true);

            this.updateAddFriendMessage(false, false, this.requestedFriend)
        }
    },
    
    handleGiftClicked : function() {
        this.hideFlagMenuIfShown();
        this.flashButtonOnClick('.context-button.gift');
        this.imvu.call('showMessageDialog', {cid: this.cid, recipient_name: this.avatarName, startWithGift: true});
    },
    
    handleInviteClicked : function() {
        this.hideFlagMenuIfShown();
        this.flashButtonOnClick('.context-button.invite');
        this.imvu.call('inviteToWalkoff', this.cid);
    },
    
    handleShopTogetherClicked : function() {
        this.hideFlagMenuIfShown();
        this.flashButtonOnClick('.context-button.shop-together');
        this.imvu.call('shopTogether', this.cid);
    },
    
    handleFlagButtonClicked : function() {
        if (this.showFlagginOutfit) {
            this.$flagMenuDiv.toggle();
            if (this.$flagMenuDiv.css('display') == 'none') {
                $('.context-button.flag').removeClass('selected');
            } else {
                $('.context-button.flag').addClass('selected');
            }
        } else {
            this.flashButtonOnClick('.context-button.flag');
            this.handleFlagChatClicked();
        }
    },
    
    hideFlagMenuIfShown : function() {
        if (this.$flagMenuDiv.css('display') != 'none') {
            this.handleFlagButtonClicked();
        }        
    },
    
    handleFlagOutfitClicked : function() {
        console.log('handleFlagOutfitClicked');
    },
    
    handleFlagChatClicked : function() {
        this.imvu.call('showChatLogFlaggingDialog', this.cid, 0);
    },
    
    handleBootClicked : function() {
        this.updateBootMessageAndButton(true);
        if (!this.isBooted) {
            this.imvu.call('bootClick');
        }
        this.isBooted = true;
    },
    
    handleBlockClicked : function() {
        this.hideFlagMenuIfShown();
        this.imvu.call('blockClick', !this.isBlocked);
        this.isBlocked = !this.isBlocked;
        this.updateBlockMessage(true);
    },
    
    startDragging : function(e) {
        this.imvu.call('startDragging', e.clientX, e.clientY);
    },
    
    stopDragging : function() {
        this.imvu.call('stopDragging');
    },
    
    getCategoryHtml : function(categoryName, actions, actionClass, categoryClass) {
        var actionHtmlArray = []
        for each(var action in actions) {
            actionHtmlArray.push(this.getActionHtml(action, actionClass));
        }
        var html = "<div categoryName='"+categoryName+"' class='category ui-event";
        if (categoryClass) {
            html += " " + categoryClass;
        }
        html += "' data-ui-name='" + categoryName + "'><div class='title'><span class='tick'></span>" + categoryName + "</div>" + actionHtmlArray.join('') + "</div>"
        return html;
    },
    
    getActionHtml : function(action, actionClass) {
        var html = "<div class='" + actionClass + " ui-event' data-ui-name='"+actionClass+"-"+action.name+"' actionName='"+action.name+"' actionId='"+action.id+"'>"+action.name;
        if (action.requiresAP) {
            html += "<span class='apIcon'></span>";
        }
        if (action.requiresVIP) {
            html += "<span class='vipIcon'></span>";
        }
        if (action.requiresFriend) {
            html += "<span class='friendIcon'></span>";
        }
        html += "</div>";
        return html;
    },
    
    populateActionList : function(soloActions, twoPartyActions) {
        var categoryHtmlArray = [];
        
        for each (var categoryActionList in soloActions) {
            var category = categoryActionList.category;
            var actionList = categoryActionList.actionList;
            categoryHtmlArray.push(this.getCategoryHtml(category, actionList, 'action'));
        }
        
        for each (var categoryActionList in twoPartyActions) {
            var category = categoryActionList.category;
            var actionList = categoryActionList.actionList;
            categoryHtmlArray.push(this.getCategoryHtml(category, actionList, 'action', 'two_party'));
        }
        
        var no_actions = '<div id="no_actions_available">no actions available</div>';

        this.$actionsDiv.html(categoryHtmlArray.join('') + no_actions);
    },
    
    resetTriggers : function() {
        $(this.elt).removeClass('hasTriggers');
    },
    
    updateTriggers : function(triggers, resetState) {
        if (triggers.length) {
            $(this.elt).addClass('hasTriggers');
        } else {
            this.resetTriggers();
        }
        
        categoryHtmlArray = []
        for each(var product in triggers) {
            categoryHtmlArray.push(this.getCategoryHtml(product.name, product.children, 'trigger'));
        }
        
        this.$triggersDiv.html(categoryHtmlArray.join(''));
        
        if (resetState) {
            this.restoreCollapsedState('avatar_menu_html.trigger_collapsed_categories', this.$triggersDiv);
            this.restoreScrollState();
        }
    },
    
    handleListClick : function(e) {
        var elTarget = e.target;
        if ($(elTarget).hasClass('title')) {
            this.handleCategoryClick(elTarget);
        }
        else if ($(elTarget).hasClass('tick')) {
            this.handleCategoryClick(elTarget);
        }
        else if ($(elTarget).hasClass('action')) {
            this.handleActionClick(elTarget.getAttribute('actionName'));
        }
        else if ($(elTarget).hasClass('trigger')) {
            this.handleTriggerClick(elTarget.getAttribute('actionName'));
        }
    },
    
    handleActionClick : function(actionName) {
        this.imvu.call('actionClick', actionName);
    },
    
    handleTriggerClick : function(triggerName) {
        this.imvu.call('triggerClick', triggerName);
    },
    
    handleCategoryClick : function(elt) {
        $(elt).closest('.category').toggleClass('collapsed');
    },
    
    _getActionElem : function(categoryIndex, actionIndex) {
        var categories = this.actinsDiv.querySelectorAll('.category');
        if (categories.length <= categoryIndex) {
            return null;
        }
        var actions = categories[categoryIndex].querySelectorAll('.action');
        if (actions.length <= actionIndex) {
            return null;
        }
        return actions[actionIndex];
    }
};

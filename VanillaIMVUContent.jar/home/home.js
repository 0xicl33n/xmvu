function MissingExpectedModesException(message) {
    this.message = message;
}

function HomeMode(args) {
    // The root element is crucial (!) in avoiding subtle and difficult to debug
    // issues in our automated tests when using runTestsWithIframe.
    // Please do not remove it.
    this.$root = $(args.root || rootElementRequired);

    this.$buttonContainer = $(args.buttonContainer);
    this.imvu = args.imvu;
    this.rest = args.rest;
    this.eventBus = args.eventBus;
    this.network = args.network;
    this.timer = args.timer;
    this.pulseButton = args.pulseButton;
    this.anim = args.anim || YAHOO.util.Anim;

    this.sledgehammerEl = YAHOO.util.Dom.get('sledgehammer');
    this.giftEl = YAHOO.util.Dom.get('gift');
    this.titleEl = YAHOO.util.Dom.get('title');
    this.count_playUnlockAnimations = 0;
    this.isNewUser = this.imvu.call('isNewUser');
    this.isFirstLogin = this.imvu.call('getIsFirstLogin');
    this.railButtonOrder= true;

    this.BUTTONS_PER_PAGE = 9;

    this.canSeeWipModes             = !!(this.imvu.call('isQA') || this.imvu.call('isAdmin'));
    this.canSeeCreatorMode          = !!this.imvu.call('shouldShowMode', 'creator');
    this.canSeePulseMode            = !!this.imvu.call('shouldShowMode', 'Pulse');
    this.canSeePhotosMode           = !!this.imvu.call('shouldShowMode', 'photos');
    this.canSeeMusicMode            = !!this.imvu.call('shouldShowMode', 'music');
    this.canSeeDealOfTheDay         = !!this.imvu.call('shouldShowMode', 'DotD');
    this.canSeeOurRoom              = !!this.imvu.call('shouldShowMode', 'ourRoom');
    this.isMarried                  = !!this.imvu.call('isMarried');
    this.canSeeSharedRoom           = !!this.imvu.call('shouldShowMode', 'sharedRoom');
    this.canSeeChatNow              = !!this.imvu.call('shouldSeeChatNow');
    this.canSeeGetMatched           = !!this.imvu.call('shouldSeeGetMatched');
    this.canSeeQuests               = !!(this.imvu.call('canSeeQuests') && this.imvu.call('showQuests'));

    var walkoffAccess = this.imvu.call('getFeatureAccessLevel', 'walkoff');
    this.canSeeWalkOffMode          = _.include(['limited', 'full'], walkoffAccess);

    var self = this;
    function defaults(args) {
        return $.extend({
            isNew: false,
            isLook: false,
            isUpdated: false,
            visible: true,
            eventBus: self.eventBus,
            imvu: self.imvu,
            translateFriendlyName: true,
            timer: self.timer,
            eventName: false
        }, args);
    }

    this.createButton = new CreateButton(defaults({name: 'create', friendlyName: 'Create'}));

    this.rail_exp_buttons = {
        'dressUp':      {depends: null,        needsFullFlow: false, award:100},
        'shop':         {depends: 'dressUp',   needsFullFlow: false, award:200},
        'credits2':     {depends: 'shop',      needsFullFlow: false, award:300},
        'chatRooms':    {depends: 'credits2',  needsFullFlow: false, award:400},
        'myRoom':       {depends: 'chatRooms', needsFullFlow: false, award:500},
        'inbox':        {depends: null,        needsFullFlow: true}
    };

    var ourRoomGenders = this.imvu.call('getOurRoomGenders');
    this.ourRoomButton = new LockedDialogButton(defaults({showDialog: 'showOurRoomInfo', name: 'ourRoom',  friendlyName: 'Our Room', visible: this.canSeeOurRoom, image: 'ourroom-' + ourRoomGenders}));
    var buttons = [
        new ModeButton(defaults({name: 'dressUp',        friendlyName: 'Dress Up'        })),
        new ModeButton(defaults({name: 'shop',           friendlyName: 'Shop'})),
        new ModeButton(defaults({name: 'credits2',       friendlyName: 'Credits',         image: 'credits'})),

        new ModeButton(defaults({name: 'chatNow',        friendlyName: 'Chat Now',         visible: this.canSeeChatNow})),
        new ModeButton(defaults({name: 'chatRooms',      friendlyName: 'Chat Rooms'})),

        this.ourRoomButton,

        new ModeButton(defaults({name: 'myRoom',         friendlyName: 'My Room'})),
        new ModeButton(defaults({name: 'inbox',          friendlyName: 'Inbox'})),

        new RateLimitedButton(defaults({name: 'DotD',           friendlyName: 'Deal of the Day', visible: this.canSeeDealOfTheDay})),
        new ModeButton(defaults({name: 'walkOff',        friendlyName: 'Walk Off',        visible: this.canSeeWalkOffMode})),
        new FriendsButton(defaults({name: 'friends',     friendlyName: 'Friends'})),
        new RateLimitedButton(defaults({name: 'photostream',    friendlyName: 'Photo Stream'})),

        new ModeButton(defaults({name: 'Photos',         friendlyName: 'Photos',          visible: this.canSeePhotosMode})),
        new ModeButton(defaults({name: 'findPeople',     friendlyName: 'Find People'})),
        new ModeButton(defaults({name: 'myProfile',      friendlyName: 'My Profile'})),

        new ModeButton(defaults({name: 'settings',       friendlyName: 'Settings'})),
        new ModeButton(defaults({name: 'quests', friendlyName: 'Quests', visible: this.canSeeQuests, eventName: 'QuestsTool.ShowDialog'})),
        new RateLimitedButton(defaults({name: 'music',          friendlyName: 'Music',           visible: this.canSeeMusicMode})),
        new RateLimitedButton(defaults({name: 'groups',         friendlyName: 'Groups'})),
        this.createButton,

        this.pulseButton,
        new RateLimitedButton(defaults({name: 'credits_free',   friendlyName: 'Earn Credits'})),
        new ModeButton(defaults({name: 'URLdemo',        friendlyName: 'URLDemo',         visible: this.canSeeWipModes})),

        new ModeButton(defaults({name: 'ui-consistency', friendlyName: 'UI Consistency',  visible: this.canSeeWipModes})),
        new ModeButton(defaults({name: 'GetMatched', image: 'getmatched', friendlyName: 'Get Matched',  isImproved:true, visible: this.canSeeGetMatched})),

        new LockedDialogButton(defaults({showDialog: 'showSharedRoomInfo', name: 'sharedRoom', friendlyName: 'Shared Room',  visible: this.canSeeSharedRoom})),
    ];

    this.pulseButton.visible = this.canSeePulseMode;

    this.buttons = {};
    for each (var button in buttons) {
        this.buttons[button.name] = button;
    }

    this.startButtonText = _T("Start exploring! Get credits as you unlock new features");

    this.eventBus.register('SharedRoomsUpdated', this.updateModeButtons.bind(this));
    if (this.imvu.call('shouldSeeChatNowOrGetMatchedAsFTUX')) {
        $('#chat-ftux-skip').click(function(){
            this.imvu.call('setSkipChatNowOrGetMatchedAsFTUX');
            this.doButtons();
            $('.chat-ftux-mode').hide();
            $('#home-mode').show();
        }.bind(this));

        $('#go-one-one').click(function(){
            this.imvu.call('setModeInChatNowOrGetMatchedAsFTUX', 'chatNow');
            this.eventBus.fire('HomeMode.ChatNowClicked');
            this.doButtons();
            $('.chat-ftux-mode').fadeOut('slow', function() {
                $('#home-mode').show();
            });
        }.bind(this));

        $('#go-get-matched').click(function(){
            this.imvu.call('setModeInChatNowOrGetMatchedAsFTUX', 'GetMatched');
            this.eventBus.fire('HomeMode.GetMatchedClicked');
            this.doButtons();
            $('.chat-ftux-mode').fadeOut('slow', function() {
                $('#home-mode').show();
            });
        }.bind(this));
        $('#home-mode').hide();
        $('.chat-ftux-mode').show();

        $('.chat-as-ftux-hint').fadeIn(1500, function() {
            $('.chat-as-ftux-hint').delay(8000).fadeOut(1500);
        });
    } else {
        this.doButtons();
    }
}

HomeMode.prototype = {
    $: function(s) {
        return this.$root[0].querySelector(s);
    },

    showSpinner: function() {
        $('#loading-mask', this.$root).show();
    },

    hideSpinner: function() {
        $('#loading-mask', this.$root).hide();
    },

    
    buildButtonOrder: function() {
        this.buttons_order = ['dressUp', 'shop', 'credits2', 'chatRooms'];

        var sharedRoomBumpsWalkoff = this.canSeeWalkOffMode && !this.canSeeDealOfTheDay && this.canSeeSharedRoom;

        if (this.isMarried) { this.buttons_order.push(this.ourRoomButton.name); }
        this.buttons_order.push('myRoom');
        this.buttons_order.push('inbox');
        if (!this.isMarried) {
            this.buttons_order.push(this.ourRoomButton.name);
        }

        this.buttons_order.push(this.canSeeDealOfTheDay ? 'DotD' : sharedRoomBumpsWalkoff ? 'sharedRoom' : 'walkOff');

        this.buttons_order.push('chatNow');
        this.buttons_order.push('friends');

        if (!sharedRoomBumpsWalkoff) {
            this.buttons_order.push('sharedRoom');
        }

        this.buttons_order.push('photostream');
        this.buttons_order.push('Photos');
        this.buttons_order.push('findPeople');
        this.buttons_order.push('myProfile');

        if (this.canSeeDealOfTheDay || sharedRoomBumpsWalkoff) { this.buttons_order.push('walkOff'); }

        this.buttons_order.push('settings');
        this.buttons_order.push('quests');
        this.buttons_order.push('music');
        this.buttons_order.push('groups');
        this.buttons_order.push(this.createButton.name);
        this.buttons_order.push(this.pulseButton.name);
        this.buttons_order.push('credits_free');
        this.buttons_order.push('URLdemo');
        this.buttons_order.push('ui-consistency');
        this.buttons_order.push('GetMatched');
    },    
    
    buildButtonOrderNew: function() {
        this.buttons_order = ['dressUp', 'shop', 'credits2', 'chatRooms'];
        this.buttons_order.push('myRoom');
        this.buttons_order.push('inbox');       
        this.buttons_order.push('chatNow');
        this.buttons_order.push('friends');
        this.buttons_order.push('GetMatched');
        
        this.buttons_order.push(this.canSeeDealOfTheDay ? 'DotD' : 'myProfile'); 
        this.buttons_order.push(this.ourRoomButton.name);
        this.buttons_order.push('sharedRoom');
        this.buttons_order.push('findPeople');
        this.buttons_order.push('photostream');
        this.buttons_order.push('Photos');
        this.buttons_order.push('walkOff');
        this.buttons_order.push('settings');
        this.buttons_order.push('groups');
        
        this.buttons_order.push(this.createButton.name);
        this.buttons_order.push('music');
        this.buttons_order.push(this.pulseButton.name);
        this.buttons_order.push('credits_free');
        this.buttons_order.push('quests');
        this.buttons_order.push('URLdemo');   
        this.buttons_order.push('ui-consistency');      
        
    },
    
    buildButtons_rail_exp: function () {
        this.railButtonOrder = true;
        for(var k in this.rail_exp_buttons) {
            var button = this.buttons[k];

            if (typeof(button) == 'undefined' || !button.visible) { continue; }

            this.addModeButton(button);
            if (this.rail_exp_buttons[k].needsFullFlow) {
                button.hide();
            }
        }
        for each(k in this.buttons_order) {
            var button = this.buttons[k];
            var modeDisabled = this.imvu.call('isModeDisabled', button.name);
            if (modeDisabled) {
                button.disable();
            }
            if (button.name in this.rail_exp_buttons) { continue; }
            if (!button.visible) { continue; }
            this.addModeButton(button);
            button.hide();
        }
        this.updateModeButtons();
        this.setPaginatorVisibility(false);
    },

    updateStartHere: function() {
        var hasSkippedChatNowOrGetMatchedAsFTUX = this.imvu.call('getSkipChatNowOrGetMatchedAsFTUX');
        var shouldSeeChatNowOrGetMatchedAsFTUX = this.imvu.call('shouldSeeChatNowOrGetMatchedAsFTUX');
        var ChatNowOrGetMatchedAsFTUXBranch = this.imvu.call('getChatNowOrGetMatchedAsFTUXModeSeen');
        var standardFTUX = this.isNewUser &&
                !this.hasDoneFullRailedExp() &&
                !this.hasOpenedModeBefore('dressUp');
        var ChatNowOrGetMatchedAsFTUX = this.isNewUser &&
                !this.hasDoneFullRailedExp() &&
                !this.hasOpenedModeBefore('dressUp') &&
                ChatNowOrGetMatchedAsFTUXBranch;
        var ChatNowOrGetMatchedAsFTUXSkip = this.isNewUser &&
                !this.hasDoneFullRailedExp() &&
                !this.hasOpenedModeBefore('dressUp') &&
                hasSkippedChatNowOrGetMatchedAsFTUX &&
                !shouldSeeChatNowOrGetMatchedAsFTUX &&
                !ChatNowOrGetMatchedAsFTUXBranch;

        var $startHere = $('#start-here', this.$root);
        var showStartHere = false;
        if((standardFTUX || ChatNowOrGetMatchedAsFTUXSkip) && !ChatNowOrGetMatchedAsFTUX) {
            showStartHere = true;
        }
        $startHere.toggle(showStartHere);
        $startHere.html(this.startButtonText + "<div id='start-here-tail'></div>");
    },

    hasDoneFullRailedExp: function() {
        if (!this.isNewUser) {
            return true;
        }
        for each(var b in this.rail_exp_buttons) {
            if (b.depends && !this.hasOpenedModeBefore(b.depends)) {
                return false;
            }
        }
        for(var k in this.rail_exp_buttons) {
            if (this.rail_exp_buttons[k].depends &&
                !this.rail_exp_buttons[k].needsFullFlow &&
                !this.hasOpenedModeBefore(k)) {
                return false;
            }
        }
        return true;
    },

    maybeOpenUpFullExperience: function() {
        if (this.isNewUser) {
            if (!this.hasDoneFullRailedExp()) return;
            this.imvu.call('recordFtuxCompleteFact');

            this.imvu.call('showDiscoverTheRestOfImvuDialog');
        }
        this.setPaginatorVisibility(true);
        for each(var button in this.modeButtons) {
            button.show()
        }
        if(this.railButtonOrder) {
            this.reorderButtons();
        }
    },

    addModeButton: function(button) {
        this.addPageIfNecessary();
        $('.button-page:last', this.$root).append(button.$div);
        this.modeButtons.push(button);
    },

    reorderButtons: function() {
        var button;
        var oldButtons = [];
        for each(button in this.modeButtons) {
            oldButtons.push(button.name);
        }
        this.modeButtons = [];
        var pageIdx = 1;
        var buttonsAdded = 0;
        for each(k in this.buttons_order) {
            button = this.buttons[k];
            if(oldButtons.indexOf(button.name) != -1) {
                $('.button-page:nth-child('+pageIdx+')', this.$root).append(button.$div);
                this.modeButtons.push(button);
                if (this.modeButtons.length % this.BUTTONS_PER_PAGE == 0) {
                    ++pageIdx;
                }
            }
        }
        this.railButtonOrder = false;
    },

    hasOpenedModeBefore: function(modeName) {
        return !!this.imvu.call('hasOpenedModeBefore', modeName);
    },

    updateFriendRequestsNumber: function() {
        var friendCount = this.imvu.call('getFriendRequestCount');
        this.buttons.inbox.setNumber(0, friendCount);
        $('.new-button.inbox .pill0').click(function(){
            this.imvu.call('showInboxMode', 'friend-requests');
        }.bind(this));
    },
    
    updateUnreadGetMatchedNotificationsNumber: function() {
        if (! this.canSeeGetMatched) {
            return false;
        }
        var getMatchedMatchesSummaryUrl = this.imvu.call('getGetMatchedMatchesUrl') + '?summary=true';

        this.rest.get(getMatchedMatchesSummaryUrl, {})
            .then(function(r) {
                this.buttons.inbox.setNumber(1, r.response.data.total_count);
                this.rest.invalidate(getMatchedMatchesSummaryUrl);
                this.eventBus.fire('getMatchedNotificationNumber', {'totalCount':r.response.data.total_count});
            }.bind(this));
        $('.new-button.inbox .pill1').click(function(){
            this.imvu.call('showInboxMode', 'get-matched');
        }.bind(this));
    },

    setIsActiveMode: function(active) {
        if (active) {
            this.updateStartHere();
            this.updateModeButtons();
            this.playUnlockAnimations();
            this.maybeOpenUpFullExperience();
        }
    },

    isLocked: function(button_name) {
        if (button_name == 'create') {
            return this.createButton.shouldLock();
        }

        if (button_name == 'ourRoom') {
            return !this.imvu.call('isMarried');
        }

        if (button_name == 'sharedRoom') {
            return !this.imvu.call('hasEnterableSharedRooms');
        }

        if (!this.isNewUser) {
            return false;
        }
        var railed_exp_info = this.rail_exp_buttons[button_name];
        if (!railed_exp_info) return false;
        var dependsOn = railed_exp_info.depends;
        if (!dependsOn) {
            return false;
        }
        return !this.hasOpenedModeBefore(dependsOn);
    },

    isAnimated: function(button_name) {
        return button_name === 'credits2';
    },

    updateModeButtons: function() {
        for each(var button in this.modeButtons) {
            var isLocked = this.isLocked(button.name);
            button.setLocked(isLocked);
            if (!isLocked){
                var isAnimated = this.isAnimated(button.name);
                button.setAnimated(isAnimated);
            }
            if (button.name == 'ourRoom' && !isLocked){
                $('.ourRoom .our_room_banner').show();
            }
        }
    },

    playUnlockAnimations: function() {
        if (!this.isNewUser) {
            return;
        }
        if (this.hasDoneFullRailedExp()) {
            return;
        }
        this.count_playUnlockAnimations++;
        for each(var button in this.modeButtons) {
            var railed_exp_info = this.rail_exp_buttons[button.name];
            if (!railed_exp_info) continue;
            var dependsOn = railed_exp_info.depends;
            if (!dependsOn) continue;
            var isLocked = !this.hasOpenedModeBefore(dependsOn);
            if (!isLocked) {
                if (!this.hasOpenedModeBefore(button.name)) {
                    //mode is unlocked but never opened...
                    button.playUnlockAnimation();

                    var depends = this.rail_exp_buttons[button.name].depends;
                    var preditsAwardNewMode = this.rail_exp_buttons[depends].award;
                    this.addFtuxModeButtonBubble(button, preditsAwardNewMode);
                }
            }
        }
    },

    addFtuxModeButtonBubble: function(button, predits) {
        var lastShownMode = this.imvu.call('getLocalStoreValueForUser', "lastShownFtuxYouWonBubble", "nothing");
        if (lastShownMode == button.name) {
            return;
        }

        if (this.$animDiv) {
            this.$animDiv.remove();
        }

        var $bubble = $('.button-bubble-template').clone().show();
        var $bubbleLine2 = $('.button-bubble-msg-2', $bubble);
        $bubbleLine2.html(predits.toString() + " Credits");
        button.$div.append($bubble);

        this.$animDiv = $bubble;
        var anim = new this.anim(this.$animDiv[0], {opacity: {from: 8.0, to:0.0}}, 8, YAHOO.util.Easing.easeOut);
        anim.animate();

        this.imvu.call('setLocalStoreValueForUser', "lastShownFtuxYouWonBubble", button.name);
    },

    doButtons: function() {
        this.rail_exp_buttons = {};
        var ChatNowOrGetMatchedAsFTUXBranch = this.imvu.call('getChatNowOrGetMatchedAsFTUXModeSeen');
        if (ChatNowOrGetMatchedAsFTUXBranch == 'GetMatched') {
            this.rail_exp_buttons['GetMatched']= {depends: null,       needsFullFlow: false, award: 100};
            this.rail_exp_buttons['dressUp']   = {depends: 'GetMatched', needsFullFlow: false, award: 200};
            this.rail_exp_buttons['shop']      = {depends: 'dressUp',   needsFullFlow: false, award:300};
            this.rail_exp_buttons['credits2']  = {depends: 'shop',      needsFullFlow: false, award:400};
            this.rail_exp_buttons['myRoom']    = {depends: 'credits2', needsFullFlow: false, award:500};
            this.rail_exp_buttons['inbox']     = {depends: null,        needsFullFlow: true};
        } else if (ChatNowOrGetMatchedAsFTUXBranch == 'chatNow') {
            this.rail_exp_buttons['chatNow']   = {depends: null,         needsFullFlow: false, award: 100};
            this.rail_exp_buttons['dressUp']   = {depends: 'chatNow',    needsFullFlow: false, award: 200};
            this.rail_exp_buttons['shop']      = {depends: 'dressUp',   needsFullFlow: false, award:300};
            this.rail_exp_buttons['credits2']  = {depends: 'shop',      needsFullFlow: false, award:400};
            this.rail_exp_buttons['myRoom']    = {depends: 'credits2', needsFullFlow: false, award:500};
            this.rail_exp_buttons['inbox']     = {depends: null,        needsFullFlow: true};
        } else {
            this.rail_exp_buttons['dressUp']   = {depends: null,       needsFullFlow: false, award: 100};
            this.rail_exp_buttons['shop']      = {depends: 'dressUp',   needsFullFlow: false, award:200};
            this.rail_exp_buttons['credits2']  = {depends: 'shop',      needsFullFlow: false, award:300};
            this.rail_exp_buttons['chatRooms'] = {depends: 'credits2', needsFullFlow: false, award:400};
            this.rail_exp_buttons['myRoom']    = {depends: 'chatRooms',  needsFullFlow: false, award: 500};
            this.rail_exp_buttons['inbox']     = {depends: null,        needsFullFlow: true};
        }

        if (this.canSeeGetMatched) {
            this.buildButtonOrderNew();
        } else {
            this.buildButtonOrder();
        }
        if (!this.canSeeChatNow) {
            delete this.rail_exp_buttons['chatNow'];
        }

        var pulseCssLink = document.createElement("link");
        pulseCssLink.setAttribute("rel", "stylesheet");
        pulseCssLink.setAttribute("type", "text/css");
        pulseCssLink.setAttribute("href", IMVU.SERVICE_DOMAIN + '/css/pulse/base.css');
        document.getElementsByTagName("head")[0].appendChild(pulseCssLink);

        this.modeButtons = [];
        this.hideSledgehammer();

        this.setPaginatorVisibility(false);

        this.buildButtons_rail_exp();
        this.updateStartHere();
        this.maybeOpenUpFullExperience();

        this.buildPaginator();

        this.eventBus.register('BuddiesChanged', this.updateFriendRequestsNumber.bind(this));
        this.updateFriendRequestsNumber();

        this.eventBus.register('getMatchedNotification', this.updateUnreadGetMatchedNotificationsNumber.bind(this));
        this.updateUnreadGetMatchedNotificationsNumber();

        this.showVipLapsedReminderTimeout = null;
        if (this.imvu.call('shouldSeeVIPReminder')) {
            this.showVipLapsedReminderTimeout = setTimeout(function() { this.imvu.call('showVipLapsedReminder'); }.bind(this), 0);
        }
    },

    setPaginatorVisibility: function(v) {
        $('#home-paginator, #prev-page, #next-page', this.$root).css('visibility', v ? 'visible' : 'hidden');
    },

    addPageIfNecessary: function() {
        if (this.modeButtons.length % this.BUTTONS_PER_PAGE == 0) {
            this.addBlankPage();
            if (this.modeButtons.length > 0) {
                this.setPaginatorVisibility(true);
            }
        }
    },

    addBlankPage: function() {
        this.$buttonContainer.append('<div class="button-page"/>');
    },

    buildPaginator: function(visible) {
        this.pagin = new SlidingPaginator(
                'home-paginator',
                'prev-page',
                'next-page',
                document.querySelectorAll('.button-page'),
                600
        );

        if (this.modeButtons.length <= this.BUTTONS_PER_PAGE) {
            this.pagin.hide();
        }

        this.$prev_page_div = this.$root.find('#prev-page-box');
        this.$prev_page_img = this.$root.find('#prev-page-img');
        this.$root.find('#prev-page').mouseenter(function(e) {this.$prev_page_div[0].style.opacity = '0.5';}.bind(this));
        this.$root.find('#prev-page').mouseleave(function(e) {this.$prev_page_div[0].style.opacity = '0';}.bind(this));
        this.$root.find('#prev-page').mousedown(function(e) {this.$prev_page_img.addClass('mousedown');}.bind(this));
        this.$root.find('#prev-page').mouseup(function(e) {this.$prev_page_img.removeClass('mousedown');}.bind(this));

        this.$next_page_div = this.$root.find('#next-page-box');
        this.$next_page_img = this.$root.find('#next-page-img');
        this.$root.find('#next-page').mouseenter(function(e) {this.$next_page_div[0].style.opacity = '0.5';}.bind(this));
        this.$root.find('#next-page').mouseleave(function(e) {this.$next_page_div[0].style.opacity = '0';}.bind(this));
        this.$root.find('#next-page').mousedown(function(e) {this.$next_page_img.addClass('mousedown');}.bind(this));
        this.$root.find('#next-page').mouseup(function(e) {this.$next_page_img.removeClass('mousedown');}.bind(this));

        YAHOO.util.Event.addListener('prev-page', 'click', this.recordPageFact.bind(this));
        YAHOO.util.Event.addListener('next-page', 'click', this.recordPageFact.bind(this));
    },

    recordPageFact: function() {
        var page = this.pagin.curPage + 1;
        this.imvu.call('recordFact', 'HomeMode.paged_to_' + page, {});
    },

    setIsLoading: function(state) {
        $('#loading-mask', this.$root).toggleClass('visible', state);
    },

    showSledgehammer: function(info) {
        if (this.sledgehammerEl.style.display == 'none') {
            this.eventBus.fire('StartTabFlashing', {'id':'home'});
        }

        var sledgehammer = this.createSledgehammer(info.banner_url, info.link, 485, 60);

        this.sledgehammerEl.appendChild(sledgehammer);

        this.sledgehammerEl.style.display = 'block';
        this.titleEl.style.display = 'none';

        this.giftEl.style.left = '275px';
        this.giftEl.style.top = '65px';

        IMVU.Client.util.turnLinksIntoLaunchUrls(this.sledgehammerEl, this.imvu);
    },

    createSledgehammer: function(banner_url, link_url, container_width, container_height) {
        var link = document.createElement('a');
        link.href = link_url;

        var banner = document.createElement('img');
        if (banner_url[0] == '/') {
            banner_url = 'http://www.imvu.com' + banner_url;
        }

        banner.onload = function() {
            var left = -(this.width - container_width)/2;
            var top = -(this.height - container_height)/2;

            this.style.left = left + "px";
            this.style.top = top + "px";
        };

        banner.src = banner_url;
        link.appendChild(banner);

        return link;
    },

    hideSledgehammer: function() {
        this.sledgehammerEl.style.display = 'none';
        this.titleEl.style.display = 'block';
        this.giftEl.style.left = '305px';
        this.giftEl.style.top = '22px';
    }
};

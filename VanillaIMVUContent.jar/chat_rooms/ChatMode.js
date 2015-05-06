function ChatMode(args) {
    this.$root = args.root;
    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.timer = args.timer;
    this.$window = args.$window || $(window);
    this.$document = args.$document || $(document);
    this.ChatModeThemes = args.ChatModeThemes || ChatModeThemes;
    this.ChatModeAllRooms = args.ChatModeAllRooms || ChatModeAllRooms;
    this.ChatModeMyRooms = args.ChatModeMyRooms || ChatModeMyRooms;
    this.translatedThemeNames = args.translatedThemeNames || {};
    
    this.isFeatured = this.imvu.call('isFeaturedRoomsMode');

    this.tabModules = {};

    this.bindElements();
    this.bindListeners();
    this.bindDelegates();
    this.preventScrolling();

    this.maybeSetupRevertToaster();

    this.setupWindowResizeRouter();

    this.createLanguageLookup();
    IMVU.Client.widget.ChatRoom.languageLookup = this.languageLookup;

    if (this.isFeatured) { 
        this.$header.hide();
        this.tabButtons.$themes.click();
    } else {
        if (this.imvu.call('isNewUser', 3)) {
            this.tabButtons.$themes.click();
        } else {
            this.tabButtons.$all.click();
        }
    }
}

ChatMode.prototype = {
    $: function(selector) {
        return this.$root.find(selector);
    },

    setupWindowResizeRouter: function() {
        this.$window.resize(function() {
            this.$window.trigger(this.activeTab+'-resize');
        }.bind(this));
    },

    createLanguageLookup: function() {
        this.languageLookup = {};
        var supportLanguages = this.imvu.call('getSupportedLanguages');
        _.each(supportLanguages, function(lang) {
            this.languageLookup[lang[1]] = lang[0];
        }.bind(this));
        this.languageLookup[''] = _T('Unspecified');
    },

    bindElements: function() {
        this.$background = this.$('img.background');
        this.$allTabs = this.$('.tab');
        this.$header = this.$('.header');
        this.$revertToaster = this.$('.revert-toaster');
        this.tabButtons = {
            $all: this.$header.find('.all'),
            $themes: this.$header.find('.themes'),
            $myrooms: this.$header.find('.myrooms'),
            $favorites: this.$header.find('.favorites'),
            $visited: this.$header.find('.visited')
        };
        this.tabs = {
            $themesTab: this.$('.tab.themes'),
            $allTab: this.$('.tab.all'),
            $myroomsTab: this.$('.tab.myrooms'),
            $favoritesTab: this.$('.tab.favorites'),
            $visitedTab: this.$('.tab.visited'),
        };

        this.$viewButton = this.$header.find('.view');
        new IMVU.Client.widget.Arrow({root: this.$viewButton, align: 'right', 'size': {width: 10, height: 6}, margin: 7});
        this.viewWidget = new IMVU.Client.widget.ChatModeViewWidget({
            imvu: this.imvu,
            $root: this.$('.view-widget'),
            $viewButton: this.$viewButton
        });

        this.activeTab = null;

        this.$templates = this.$('.templates');
    },
    maybeSetupRevertToaster: function() {
        if(this.imvu.call('shouldShowNewChatModeRevertToaster')) {
            this.$revertToaster.show();
            this.$revertToaster.find('button.okay').click(function() {
                this.imvu.call('dismissNewChatModeRevertToaster');
                this.$revertToaster.hide();
            }.bind(this));
        }
    },
    preventScrolling: function() {
        this.$document.keypress(function(e) {
            if ($('.search input').is(':focus')) {
                return;
            }

            //Prevent scrolling using arrow keys
            if(e.keyCode >= 37 && e.keyCode <= 40) {
                e.preventDefault();
            }
        });
    },

    activate: function() {
        var curTab = this.tabModules[this.activeTab];
        curTab.onActivate(this.activeTab);
    },

    activateTab: function(e) {
        var $button = $(e.target);
        var $tab = $button.data('$tab');
        var TabConstructor = $button.data('TabConstructor');
        var getOrCreateInstance = $button.data('getOrCreateInstance');
        var tabName = $button.data('name');

        $('body').attr('class', tabName + '-active');

        $('.active-tab').removeClass('active-tab');
        $button.addClass('active-tab');

        if(_.isUndefined(this.tabModules[tabName])) {
            this.tabModules[tabName] = getOrCreateInstance(TabConstructor);
            $button.removeData('TabConstructor');
        }

        if(this.activeTab == tabName) {
            return;
        }

        if (this.activeTab !== null) {
            var activeTabObject = this.tabModules[this.activeTab];
            if (activeTabObject && activeTabObject.onDeactivate) {
                activeTabObject.onDeactivate();
            }
        }

        this.$allTabs.removeClass('active');
        $tab.addClass('active');
        this.activeTab = tabName;

        if (this.tabModules[tabName].onActivate) {
            this.tabModules[tabName].onActivate(tabName);
        }
    },
    bindTabButtonData: function() {
        var defaultArgs = {
            imvu: this.imvu,
            network:this.network,
            $window: this.$window,
            eventBus: this.eventBus,
            templates: this.$templates
        };

        var allRoomsTab = null;
        var getAllRoomsInstance = function(Constructor) {
            if(allRoomsTab) {
                return allRoomsTab;
            }
            return allRoomsTab = new Constructor();
        };
        var chatModeAllRoomsConstructor = this.ChatModeAllRooms.bind(null, $.extend({
            root: this.tabs.$allTab,
            viewWidget: this.viewWidget,
            timer: this.timer,
            search: this.$('.header div.search'),
            view: this.$('.header div.view'),
            scrollBottomFetchMoreResults: 1
        }, defaultArgs));
        this.tabButtons.$all.data({
            '$tab': this.tabs.$allTab,
            'name': 'all',
            'getOrCreateInstance': getAllRoomsInstance,
            'TabConstructor': chatModeAllRoomsConstructor
        });
        this.tabButtons.$favorites.data({
            '$tab': this.tabs.$allTab,
            'name': 'favorites',
            'getOrCreateInstance': getAllRoomsInstance,
            'TabConstructor': chatModeAllRoomsConstructor
        });
        this.tabButtons.$visited.data({
            '$tab': this.tabs.$allTab,
            'name': 'visited',
            'getOrCreateInstance': getAllRoomsInstance,
            'TabConstructor': chatModeAllRoomsConstructor
        });

        var themesTab = null;
        var getThemesTabInstance = function(Constructor) {
            if(themesTab) {
                return themesTab;
            }
            return themesTab = new Constructor();
        };
        this.tabButtons.$themes.data({
            '$tab': this.tabs.$themesTab,
            'name': 'themes',
            timer: this.timer,
            'getOrCreateInstance': getThemesTabInstance,
            'TabConstructor': this.ChatModeThemes.bind(null, $.extend({
                background: this.$background,
                translatedThemeNames: this.translatedThemeNames,
                timer: this.timer,
                root: this.tabs.$themesTab,
                upsell: 'AP',
                viewWidget: this.viewWidget
            }, defaultArgs))
        });

        var myroomsTab = null;
        var getAllRoomsTabInstance = function(Constructor) {
            if(myroomsTab) {
                return myroomsTab;
            }
            return myroomsTab = new Constructor();
        };
        this.tabButtons.$myrooms.data({
            '$tab': this.tabs.$myroomsTab,
            'name': 'myrooms',
            'getOrCreateInstance': getAllRoomsTabInstance,
            'TabConstructor': this.ChatModeMyRooms.bind(null, $.extend({
                root: this.tabs.$myroomsTab,
                viewWidget: this.viewWidget
            }, defaultArgs))
        });
    },
    bindListeners: function() {
        this.bindTabButtonData();
        _.each(this.tabButtons, function($tabButton) {
            $tabButton.click(function(e) {
                this.viewWidget.toggle(false);
                this.activateTab(e);
            }.bind(this));
        }.bind(this));
        this.$viewButton.click(this.viewWidget.toggle.bind(this.viewWidget, null));
    },

    bindDelegates: function() {
       this.$root.undelegate('button.go', 'click');
        this.$root.delegate('button.go','click', function(e) {
            var $chatroom = $(e.currentTarget).closest('.chatroom');
            var type = $chatroom.attr('chatroomtype');
            if (type == 'ChatRoom' || type == 'ChatRoomManage') {
                var room_instance_id = $chatroom.attr('roomInstanceId');
                if (type == 'ChatRoomManage' || !$(e.currentTarget).hasClass('tryAgain')) {
                    this.imvu.call('joinPublicRoom', room_instance_id);
                } else {
                    console.log("tried to join a room that is full.");
                }
            } else if (type == 'ChatRoomWelcome') {
                var $button = $(e.currentTarget);

                // Avoid opening multiple welcome rooms if the user presses the button quickly
                if(! this.$root.data('ignoringJoinWelcomeRoom')) {
                    var cid = $chatroom.attr('cid');
                    this.imvu.call('joinWelcomeRoom', cid);

                    this.$root.data('ignoringJoinWelcomeRoom', true);

                    setTimeout(function() {
                        this.$root.data('ignoringJoinWelcomeRoom', false);
                    }.bind(this), 4000);
                }
            } else if (type == 'UpsellRoom') {
                this.imvu.call('showApInfo');
            }
            e.stopPropagation();
        }.bind(this));
        this.$root.undelegate('chatrooms-list .ap.icon', 'click');
        this.$root.delegate('.chatrooms-list .ap.icon','click', function(e) {
            if(! this.imvu.call('hasAccessPass')) {
                this.imvu.call('showApInfo');
                e.stopPropagation();
            }
        }.bind(this));
        this.$root.undelegate('chatrooms-list .vip.icon', 'click');
        this.$root.delegate('.chatrooms-list .vip.icon','click', function(e) {
            if(! this.imvu.call('hasVIPPass')) {
                this.imvu.call('showVipInfo');
                e.stopPropagation();
            }
        }.bind(this));
    },
    updateRoomOccupancy: function(room_id, occupancy) {
        var $tile = $("[roomInstanceId='" + room_id + "']"),
            $occupancyBubble = $tile.find('.occupancy-bubble'),
            $actualOccupancy = $tile.find('.actual-occupancy'),
            maxOccupancy = $occupancyBubble.find('.max-occupancy').text(),
            currentOccupancy = $actualOccupancy.text(),
            shouldFade = occupancy != currentOccupancy;

        if($occupancyBubble.find('.full').is(':visible')) {
            $occupancyBubble.find('.full').fadeOut(0);
            $occupancyBubble.find('.occupancy-c').fadeIn(1000);
            $tile.find('button.go.tryAgain').text('Go').toggleClass('tryAgain enabled');
        }
        if(parseInt(maxOccupancy) > parseInt(occupancy)) {
            if(shouldFade) {
                $actualOccupancy.fadeOut(0);
            }
            $actualOccupancy.text(occupancy);
            if(shouldFade) {
                $actualOccupancy.fadeIn(1000);
            }
        } else {
            $occupancyBubble.find('.occupancy-c').fadeOut(0);
            $occupancyBubble.find('.full').fadeIn(1000);
            $tile.find('button.go').text('Full').toggleClass('tryAgain enabled');
        }
    }
}

function ChatModeThemes(args) {
    this.$root = args.root;
    this.imvu = args.imvu;
    this.network = args.network;
    this.timer = args.timer;
    this.$window = args.$window || $(window);
    this.Math = args.Math || Math;
    this.viewWidget = args.viewWidget;
    this.userInfo = {};
    this.themedRoomsUri = this.imvu.call('getThemedRoomsViewUri');
    this.upsell = args.upsell;
    this.translatedThemeNames = args.translatedThemeNames;
    this.$themesList = this.$('.themes-list');
    this.$themeOption = args.templates.find('.theme-option');
    this.$chatRoomTemplate = args.templates.find('#chatroom-template');
    this.$tileTemplate = args.templates.find('#tile-template');
    this.$welcomeRoomBubble = args.templates.find('#welcome-room-bubble');
    this.$themedRoomsList = this.$('.themed-rooms-list');
    this.$themedScrollPane = this.$('.scrollable');
    this.$background = args.background.first();
    this.themedRoomTiles = [];
    this.tilesWithThemedChatRooms = [];
    this.currentSubscriptions = [];

    this.isFeatured = this.imvu.call('isFeaturedRoomsMode');
    
    this.arrowScrollDelay = 100;
    this.wheelScrollDelay = 50;
    this.selectScrollDelay = 150;

    this.maxCountThemedRooms = 0;
    this.countLoadedThemedRooms = 0;
    this.setUpScrollPane();
    this.setupThemedRoomInfiniteScroll();
    this.loadThemesAndFirstThemeRooms();
    this.setUpSliderHelper();

    this.registerDelegates();
    this.addScrollEvents();

    this.viewWidget.hideFilterButton();
}

ChatModeThemes.MAX_NUMBER_WIDGETS = 48;

ChatModeThemes.prototype = {
    $: function(selector) {
        return this.$root.find(selector);
    },

    setUpSliderHelper: function() {
        this.sliderHelper = new ChatRoomsSliderHelper({
            $roomList: this.$themedRoomsList,
            $scrollPane: this.$themedScrollPane
        });
    },

    scrollThemesList: function(delta, duration) {
        $('.themes-list-wrapper').animate({
            scrollTop: "-=" + delta + "px"
        },duration, null, function(){
            if($('.themes-list-wrapper').scrollTop() <= 0) {
                this.$welcomeRoomBubble.css('display','');
                $('.up-button').toggleClass('disabled', true);
            } else {
                this.$welcomeRoomBubble.hide();
                $('.up-button').toggleClass('disabled', false);
            }

            if($('.themes-list-wrapper').scrollTop() + $('.themes-list-wrapper').height() >= $('.themes-list').height()) {
                $('.down-button').toggleClass('disabled', true);
            } else {
                $('.down-button').toggleClass('disabled', false);
            }
        }.bind(this));
    },

    addScrollEvents: function() {        
        var step = this.$window.height() - 90; //FIXME compute the actual step size        
        $('.up-button').bind('click', function(event) {
            event.preventDefault();
            var $theme = this.$themesList.find('.theme-option').first();
            this.scrollThemesList($theme.height() + 12, this.arrowScrollDelay);
        }.bind(this));

        $('.down-button').bind('click', function(event) {
            event.preventDefault();
            var $theme = this.$themesList.find('.theme-option').first();
            this.scrollThemesList(-$theme.height() - 12, this.arrowScrollDelay);
        }.bind(this));

        $('.themes-list-wrapper').bind('mousewheel', function(event, delta, deltaX, deltaY) {
            event.preventDefault();            
            this.scrollThemesList(deltaY * 40, this.wheelScrollDelay);
        }.bind(this));
    },

    resizeThemesList: function() {
        this.$('.themes-list-wrapper').height(this.$window.height() - 90);
    },

    networkFailure: function() {
        this.imvu.call(
            'showErrorDialog',
            _T('Network Error'),
            _T('We were not able to load more rooms.')
        );
        return;
    },

    resizeScrollPane: function() {
        var offset = this.$themedScrollPane.offset();
        var windowHeight = this.$window.height();
        this.$('.room-scrollarea-holder').height(windowHeight-offset.top);
        this.$themedScrollPane.height(windowHeight-offset.top-24);

        this.$('div.themes-wrapper').width(1070);
        var marginRight = this.$window.width() - 329;
        var padding = -(Math.floor((marginRight/370))-1)*24;
        this.$('.room-scrollarea-holder').css('width',marginRight - marginRight%370 +padding);

    },

    setUpScrollPane: function() {
        this.$window.bind('themes-resize',function() {
            this.resizeScrollPane();
            this.resizeThemesList();
            this.makeSureScrollpaneIsScrollable();
        }.bind(this));
    },
    scrollPaneScrollable: function() { 
        return this.$themedScrollPane.outerHeight() < this.$themedScrollPane.attr('scrollHeight');
    },
    makeSureScrollpaneIsScrollable: function() { 
        if(!this.scrollPaneScrollable()) { 
            this.infiniteScroll.loadMoreResults();
        }
    },

    setupThemedRoomInfiniteScroll: function() {
        this.infiniteScroll = new InfiniteScrolling({
            scrollPane: this.$themedScrollPane,
            countEntriesLoaded: this.countLoadedThemedRooms,
            maxCountEntries: this.maxCountThemedRooms,
            loadMoreEntries: this.loadThemedRooms.bind(this),
            canLoadMoreEntries: function() {
                return this.countLoadedThemedRooms < this.maxCountThemedRooms;
            }.bind(this),
            getOffset: function() {
                return this.countLoadedThemedRooms;
            }.bind(this),
            getUri: function() {
                return this.currentThemeUri;
            }.bind(this),
            loadMoreEntriesArgs: {
                clear: false
            },
            startLoadingState: this.startLoadingState.bind(this),
            endLoadingState: this.endLoadingState.bind(this),
        });
    },

    loadThemedRooms: function(args) {
        var clear = args.clear;
        var onChatRoomWidgetsVisible = args.onChatRoomWidgetsVisible;
        var offset = args.offset;
        var uri = args.uri;
        if(_.isUndefined(clear)) clear = true;
        if(_.isUndefined(onChatRoomWidgetsVisible)) onChatRoomWidgetsVisible = function() {};
        if(!_.isUndefined(offset)) {
            uri += '?offset='+offset;
        }


        this.network.asyncRequest('GET', uri, {
            success: function(response) {
                if (response.responseText.status !== 'success') {
                    this.networkFailure();
                } else {
                    this.populateThemedRooms(response.responseText.data.rooms, clear, onChatRoomWidgetsVisible);
                    this.maxCountThemedRooms = response.responseText.data.total_number_of_rooms;
                }
            }.bind(this),
            failure: this.networkFailure.bind(this),
            scope: this
        }, undefined);

    },

    registerDelegates: function() {
        this.$themesList.undelegate('.theme-option','click');
        this.$themesList.delegate('.theme-option','click', function(e) {
            var $target = $(e.currentTarget);
            if($target.is('.selected')) {
                return;
            }

            var themeHeight = $target.height();
            var themesListHeight = this.$('.themes-list-wrapper').height();
            var maxHeight = themesListHeight - 2 * themeHeight - themesListHeight / 8;
            var minHeight = themeHeight + themesListHeight / 8;
            if($target.position().top > maxHeight) {
                this.scrollThemesList(maxHeight - $target.position().top, this.selectScrollDelay);
            } else if($target.position().top < minHeight) {
                this.scrollThemesList(minHeight - $target.position().top, this.selectScrollDelay);
            }

            $('.theme-option').removeClass('selected');
            $target.addClass('selected');
            var uri = $target.data('uri');
            var loadTheme = $target.data('loadTheme');
            if (loadTheme !== undefined) {
                this.currentThemeUri = uri;
                this.countLoadedThemedRooms = 0;
                this.$themedRoomsList.empty();
                this.startLoadingState();
                loadTheme();
                this.resizeThemesList();
                this.resizeScrollPane();
            }
        }.bind(this));
    },

    setUpThemeOptionsLoadingState: function() {
        for(var i = 0; i < 10; i++) {
            this.addTheme({
                name: "Loading"
            });
        }
    },
    startLoadingState: function() {
        if(this.$themedRoomsList.find('.tile.loading.throbber').length > 0) {
            return;
        }
        if(_.isUndefined(this.$loadingTile)) {
            var $loading = $('<div>').addClass('loading').append('<img src="../img/throbber_black.gif');
            this.$loadingTile = $('<div>').addClass('tile loading throbber').append($loading);
        }
        this.$themedRoomsList.append(this.$loadingTile.clone());
    },

    endLoadingState: function() {
        this.$themedRoomsList.find('.tile.loading.throbber').remove();
    },

    setupWelcomeRooms: function() {
        this.addTheme({
            name: 'Welcome'
        }, this.loadWelcomeRooms.bind(this));
        this.$themesList.find('.Welcome').append(this.$welcomeRoomBubble);
        this.$themesList.find('.Welcome').addClass('selected');
    },

    moderatorJoinWelcomeRoom: function() {
        var roomsToEnter = this.allWelcomeRooms;
        var room = roomsToEnter[this.Math.floor(this.Math.random()*roomsToEnter.length)];
        this.imvu.call('joinWelcomeRoom', room);
    },

    loadWelcomeRooms: function() {
        this.$themedRoomsList.empty();
        this.countLoadedThemedRooms = this.maxCountThemedRooms = 1;  //Prevent infinite scrolling from happening
        if(this.userInfo.is_welcome_room_moderator) {
            this.$welcomeRoomBubble.hide();
            var $tile = this.$tileTemplate.clone();
            $tile.attr('id');
            var tile = new Tile({
                type: 'welcome-room-moderator',
                tile: $tile,
                buttonCallback: this.moderatorJoinWelcomeRoom.bind(this)
            });
            this.$themedRoomsList.append(tile.$tile);
        } else {
            _.each(this.welcomeRooms, function(roomInfo, name) {
                roomInfo.large_image = roomInfo.image;
                roomInfo.image_url = roomInfo.image;
                var tile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomWelcome, {
                    roomInfo: roomInfo,
                    timer: this.timer
                });
                this.$themedRoomsList.append(tile.$tile);
            }.bind(this));
        }
    },

    addTheme: function(theme, loadTheme) {
        var $themeOption = this.$themeOption.clone();
        $themeOption.data('themeId', theme.public_room_themes_id);
        var cleanName = theme.name.replace(/ /g, '');
        cleanName = cleanName.replace('&', '');
        cleanName = cleanName.replace('\'', '');
        cleanName = cleanName.replace('.', '');
        $themeOption.addClass(cleanName);
        $themeOption.find('.image').css('background-image','url(img/themes/'+cleanName+'.jpg').attr('data-ui-theme-name', cleanName);
        $themeOption.data('uri', theme.uri);
        $themeOption.data('loadTheme', loadTheme);
        $themeOption.find('.name').attr('data-ui-theme-name', cleanName).text(this.translatedThemeNames[theme.name]);
        this.$themesList.append($themeOption);
        if (this.upsell && !!theme.show_upsell) {
            $themeOption.click(function () {
                this.imvu.call('showApInfo');
            }.bind(this));
        }
    },
    populateThemes: function(themes) {
        _.each(themes, function(theme) {
            if(this.translatedThemeNames.hasOwnProperty(theme.name)) {
                this.addTheme(theme, this.loadThemedRooms.bind(this, {
                    uri: theme.uri,
                    onChatRoomWidgetsVisible: function() { 
                        this.makeSureScrollpaneIsScrollable();
                    }.bind(this)
                }));
            }
        }.bind(this));
    },

    loadThemesAndFirstThemeRooms: function() {
        var callback = {
            success: function(response) {
                if (response.responseText.status !== 'success') {
                    this.networkFailure();
                } else {
                    var responseData = response.responseText.data;
                    this.userInfo.is_welcome_room_moderator = responseData.is_welcome_room_moderator;
                    if(!_.isUndefined(responseData.welcome_rooms)) {
                        if(this.userInfo.is_welcome_room_moderator) {
                            this.allWelcomeRooms = _.pluck(responseData.welcome_rooms.adult, 'cid');
                            this.allWelcomeRooms = this.allWelcomeRooms.concat(_.pluck(responseData.welcome_rooms.teen, 'cid'));
                        }
                        if(this.imvu.call('isTeen')) {
                            this.welcomeRooms = responseData.welcome_rooms.teen;
                        } else {
                            this.welcomeRooms = responseData.welcome_rooms.adult;
                        }
                    }
                    this.$themesList.empty();
                    var shouldShowWelcomeTheme = !this.isFeatured && (this.userInfo.is_welcome_room_moderator || !_.isUndefined(this.welcomeRooms));
                    if(shouldShowWelcomeTheme) {
                        this.setupWelcomeRooms();
                        this.loadWelcomeRooms();
                    } else {
                        this.maxCountThemedRooms = responseData.first_theme_rooms.total_number_of_rooms;
                        this.currentThemeUri = responseData.themes[0].uri;                        
                        this.populateThemedRooms(responseData.first_theme_rooms.rooms, true/*clear*/, function() {
                            this.makeSureScrollpaneIsScrollable();
                        }.bind(this));
                        this.resizeScrollPane();
                    }
                    this.populateThemes(responseData.themes);
                    this.resizeThemesList();
                    $('.up-button').toggleClass('disabled', true);
                    $('.tab.themes').addClass('ready');

                    this.$themesList.find('.theme-option').first().addClass('selected');
                }
            }.bind(this),
            failure: this.networkFailure.bind(this),
            scope: this
        };
        this.startLoadingState();
        this.setUpThemeOptionsLoadingState();
        url = this.themedRoomsUri;
        if (this.upsell) {
            url += (url.split('?')[1] ? '&': '?') + 'upsell=' + this.upsell;
        }
        this.network.asyncRequest('GET', url, callback, undefined);
    },

    cloneChatRoomWidgetTemplate: function() {
        var $chatRoom = this.$chatRoomTemplate.clone();
        $chatRoom.removeAttr('id');
        return $chatRoom;
    },
    createChatRoomTile: function(ChatRoomConstructor, chatRoomParams) {
        $chatRoomBody = this.cloneChatRoomWidgetTemplate();
        $.extend(chatRoomParams, {
            root: $chatRoomBody
        });
        chatRoom = new ChatRoomConstructor(chatRoomParams);
        var $tile = this.$tileTemplate.clone();
        $tile.removeAttr('id');
        var tile = new Tile({
            type: 'chat-room',
            tile: $tile,
            chatRoom: chatRoom,
            body: $chatRoomBody
        });
        return tile;
    },

    update_subscriptions: function() {
        this.imvu.call('clobberRoomOccupancySubscriptions', this.currentSubscriptions);
    },

    populateThemedRooms: function(rooms,clear, onChatRoomWidgetsVisible) {
        if(!_.isUndefined(clear) && clear) {
            this.$themedRoomsList.empty();
            this.$themedScrollPane.scrollTop(0);
            this.themedRoomTiles = [];
            this.tilesWithThemedChatRooms = [];
        }
        var chatRoomTiles = [];

        this.countLoadedThemedRooms += rooms.length;

        _.each(rooms, function(room,key) {
            var chatRoomTile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomThemed, {
                imvu: this.imvu,
                network: this.network,
                roomInfo: room,
                timer: this.timer,
                background: this.$background,
                dontPositionBackgroundImage: true
            });
            chatRoomTile.$tile.css('visibility', 'hidden');
            this.$themedRoomsList.append(chatRoomTile.$tile);

            chatRoomTiles.push(chatRoomTile.$tile);
            this.themedRoomTiles.push(chatRoomTile);
            this.tilesWithThemedChatRooms.push(this.themedRoomTiles.length-1);
        }.bind(this));

        this.currentSubscriptions = [];
        for (var i=0; i<rooms.length; ++i) {
            this.currentSubscriptions.push(rooms[i].room_instance_id);
        }
        this.update_subscriptions();

        var timer = this.timer;
        function dominoFadeIn() {
            var $tile = _.first(chatRoomTiles);
            chatRoomTiles = _.rest(chatRoomTiles);
            var onAppear = function() {};
            if(chatRoomTiles.length == 0) { //After the last tile appears
                onAppear = onChatRoomWidgetsVisible;
            }
            $tile.css('visibility','visible').hide().fadeIn(300);
            timer.setTimeout(onAppear, 300);
            if(chatRoomTiles.length > 0) {
                timer.setTimeout(dominoFadeIn, 200);
            }
        }
        if(chatRoomTiles.length > 0) {
            dominoFadeIn();
        } else {
            onChatRoomWidgetsVisible();
        }
    },

    refreshUI: function() {
        this.resizeThemesList();
        this.resizeScrollPane();
    },

    onActivate: function() {
        this.update_subscriptions();
        this.refreshUI();
    },

    onDeactivate: function() {
    }
}

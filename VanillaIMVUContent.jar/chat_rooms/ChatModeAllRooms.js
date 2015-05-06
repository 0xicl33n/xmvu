function ChatModeAllRooms(args) {
    this.$root = args.root;
    this.imvu = args.imvu;
    this.network = args.network;
    this.timer = args.timer;
    this.templateBufferSize = args.templateBufferSize || 50;
    this.$window = args.$window || $(window);
    this.$chatRoomTemplate = args.templates.find('#chatroom-template');
    this.$adTemplate = args.templates.find('#ad-template');
    this.$tileTemplate = args.templates.find('#tile-template');

    this.tileGenerator = new TemplateGenerator({
        $template: this.$tileTemplate,
        maintainBufferSize: this.templateBufferSize,
        refillBufferThreshold: 25
    });
    this.chatRoomGenerator = new TemplateGenerator({
        $template: this.$chatRoomTemplate,
        maintainBufferSize: this.templateBufferSize,
        refillBufferThreshold: 25
    });
    this.$allRoomsList = this.$('.all-rooms-list');
    this.$allRoomsScrollPane = this.$('.scrollable');
    this.$search = args.search;
    this.$view = args.view;
    this.viewWidget = args.viewWidget;
    this.scrollBottomFetchMoreResults = args.scrollBottomFetchMoreResults;

    this.allRoomTiles = [];
    this.tilesWithThemedChatRooms = [];
    this.currentSubscriptions = [];
    this.hashOfSubscriptionState = [];

    this.numTilesWide = Math.floor(this.$window.width() - 35 / 352);
    this.numTilesTall = Math.ceil(this.$window.height() / 352);

    this.setUpScrollPane();
    this.resizeScrollPaneAndNpIMVU();
    this.setupInfiniteScroll();

    this.dataSource = new IMVU.ChatRoomsDataSource({abortExistingRequests: true}, this.network, this.imvu.call);
    this.dataOffset = 0;
    this.dataRows = null;
    this.dataSource.subscribe('requestResult', this.onRequestResult.bind(this));
    this.onRequestResultExtraCallback = null;
    this.filterTypes = ['occupancy', 'language', 'roomtype', 'vip'];
    this.setupSearch();
}

ChatModeAllRooms.prototype = {
    $: function(selector) { 
        return this.$root.find(selector);
    },


    setupNullResults: function() {
        if (this.shouldShowAds) {
            var adTile = this.createAdTile();
            this.$allRoomsList.append(adTile.$tile);
        }

        var $tile = this.$tileTemplate.clone();
        $tile.removeAttr('id');
        var tileOptions = { 
            type: 'show-no-results',
            tile: $tile,
            buttonCallback: function() { 
                this.viewWidget.selectDefaults();
                this.updateFilters(this.viewWidget.getValues());
                $tile.find('.check-filters').hide();
            }.bind(this),
        };
        if(this.viewWidget.isNoFilters()) {
            $.extend(tileOptions, { 
                noFilters: true
            });
        }
        var tile = new Tile(tileOptions);
        this.$allRoomsList.append($tile);

    },

    saveFilters: function(filters) {
        $.each(this.filterTypes, function(k, v) {
            this.imvu.call('setPref', 'chatRoomSearchFilter.' + this.tabName + '.' + v, filters[v]);
        }.bind(this));
    },

    getFilters: function() {
        var retVal = {};
        $.each(this.filterTypes, function(k, v) {
            var value = this.imvu.call('getPref', 'chatRoomSearchFilter.' + this.tabName + '.' + v);
            if (value) {
                retVal[v] = value;
            }
        }.bind(this));
        return retVal;
    },

    onRequestResult: function (result) {
        if(result.error) { 
            this.networkFailure();
            if (this.onRequestResultExtraCallback) {
                this.onRequestResultExtraCallback();
                this.onRequestResultExtraCallback = null;
            }
            return;
        }
        rooms = [];
        var tileCount = 1;

        if(result.response.results.length == 0) {
            // AP Upsell if present
            if(result.response.meta.null_search_results && result.response.meta.null_search_results.number_of_rooms > 0) {
                var apTile = this.createApUpsellTile(result.response);
                this.$allRoomsList.append(apTile.$tile);
                tileCount+=2;
                for(var i=0; i< result.response.meta.null_results_formatted.length && tileCount <= 9; i++) {
                    var tile = this.createUpsellRoomTile(IMVU.Client.widget.ChatRoom, { roomInfo: result.response.meta.null_results_formatted[i] }, i + result.response.meta.null_search_results.number_of_rooms);
                    this.$allRoomsList.append(tile.$tile);
                    tileCount++;
                }
            } else {
                // Null Result if no upsell
                this.setupNullResults();
            }
        } else {
            // Display results if present
            var adFrequency = this.numTilesWide * this.numTilesTall;
            if (adFrequency <= 2) {
                adFrequency = 6;
            }
            var anyRoomsAdded = false;
            var chatRooms = $('<span>');
            for (var i = 0; i < result.response.results.length; i++) {
                var roomInfo = result.response.results[i];
                var roomInstanceId = roomInfo['customers_id']+'-'+roomInfo['customers_room_id'];
                roomInfo['room_instance_id'] = roomInstanceId;

                if (!(roomInstanceId in this.allRoomInstanceIds)) {
                    anyRoomsAdded = true;
                    var $tile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomPublic, { roomInfo:  roomInfo});
                    chatRooms.append($tile);
                    tileCount++;
                    if (tileCount % adFrequency === 1 && this.shouldShowAds) {
                        var adTile = this.createAdTile();
                        chatRooms.append(adTile.$tile);
                        tileCount++;
                    }
                    rooms.push(roomInfo);
                    this.allRoomInstanceIds[roomInstanceId] = true;
                } else {
                    console.log("discarded duplicate room", roomInstanceId);
                }
            }
            if(!anyRoomsAdded) { 
                console.log('NO ROOMS WERE ADDED, ALL WERE DUPLICATES!');
            }
            this.$allRoomsList.append(chatRooms);
        }

        this.dataRows = result.response.meta.totalRows;
        this.dataOffset += rooms.length;


        if (this.onRequestResultExtraCallback) {
            this.onRequestResultExtraCallback();
            this.onRequestResultExtraCallback = null;
        }
    },

    emptyRoomList: function() {
        this.$allRoomsList.find('.tile:not(.loading)').remove();
        this.$allRoomsScrollPane.scrollTop(0);
    },

    $: function(selector) {
        return this.$root.find(selector);
    },

    networkFailure: function() {
        this.imvu.call(
            'showErrorDialog',
            _T('Network Error'),
            _T('We were not able to load more rooms.')
        );
        return;
    },

    resizeScrollPaneAndNpIMVU: function() {
        var prevScrollPositionY = this.$allRoomsScrollPane.scrollTop();
        var offset = this.$allRoomsScrollPane.offset();
        var windowHeight = this.$window.height();
        this.$allRoomsScrollPane.height(windowHeight-offset.top);
        //For some reason, scrollTop is intermittently not maintained setting the scrolling area's height --Hayden Dec 2013
        this.$allRoomsScrollPane.scrollTop(prevScrollPositionY);

        // Derive from mode width, so min-width is observed.
        var windowWidth = $('body').outerWidth() - 35;

        var marginRight = windowWidth % 345;
        if ($('div#avview-holder').hasClass('hasNpIMVUContent') && windowWidth > 704) {
            marginRight += 352;
            $('div#avview-holder').css('right', (-($('div#avview-holder').width() / 2) + (marginRight / 2)) + "px");
        }
        marginRight += 12;
        this.$allRoomsScrollPane.css('margin-right', marginRight + "px");

        var width = Math.floor(windowWidth / 352);
        var height = Math.ceil(windowHeight / 352);
        if(this.numTilesTall != height || this.numTilesWide != width) {
            this.numTilesWide = width;
            this.numTilesTall = height;
            if (this.shouldShowAds) {
                var $ads = this.$allRoomsList.find('.ad');
                var detachedAds = $ads.detach();
                var numRooms = this.$allRoomsList.find('.chat-room').length;
                var tilesOnScreen = width * height;
                for(var i = 0; i < numRooms / tilesOnScreen; i++) {
                    var adTile = this.createAdTile();
                    var $nthTile = this.$allRoomsList.find('.tile:nth-child('+ (i * tilesOnScreen - width)+')');
                    adTile.$tile.insertAfter($nthTile);
                }
            }
        }

    },

    setUpScrollPane: function() {
        var resize = function() {
            this.resizeScrollPaneAndNpIMVU();
        }.bind(this)
        this.$window.bind('all-resize',resize);
        this.$window.bind('visited-resize',resize);
        this.$window.bind('favorites-resize',resize);
    },

    startLoadingState: function() { 
        if(this.$allRoomsList.find('.tile.loading.throbber').length > 0) { 
            return;
        }
        if(_.isUndefined(this.$loadingTile)) { 
            var $loading = $('<div>').addClass('loading').append('<img src="../img/throbber_black.gif').append('Loading');
            this.$loadingTile = $('<div>').addClass('tile loading throbber').append($loading); 
        }
        this.$allRoomsList.append(this.$loadingTile.clone());
    },

    endLoadingState: function() { 
        this.$allRoomsList.find('.tile.loading.throbber').remove();
    },

    setupInfiniteScroll: function() {
        this.infiniteScrolling = new InfiniteScrolling({
            scrollBottomFetchMoreResults: this.scrollBottomFetchMoreResults,
            scrollPane: this.$allRoomsScrollPane,
            loadMoreEntries: function(args) {
                this.dataSource.setQueryParameter('offset', args.offset ? args.offset : null);
                this.onRequestResultExtraCallback = args.onChatRoomWidgetsVisible;
                this.onSearchCancelled = args.onSearchCancelled;
                this.tryRefreshDataSource(args.clear);
            }.bind(this),
            canLoadMoreEntries: function() {
                return this.dataRows === null || this.dataOffset < this.dataRows;
            }.bind(this),
            getOffset: function() {
                return this.dataOffset;
            }.bind(this),

            startLoadingState: this.startLoadingState.bind(this),
            endLoadingState: this.endLoadingState.bind(this),
        });
    },

    cloneChatRoomWidgetTemplate: function() {
        var $chatRoom = this.chatRoomGenerator.get();
        $chatRoom.removeAttr('id');
        return $chatRoom;
    },
    createChatRoomTile: function(ChatRoomConstructor, chatRoomParams) {
        var $tile = this.tileGenerator.get();
        $tile.removeAttr('id');
        $tile.empty();
        $chatRoomBody = this.cloneChatRoomWidgetTemplate();
        $.extend(chatRoomParams, {
            root: $chatRoomBody,
            imvu: this.imvu,
            network: this.network,
            tabName: this.tabName
        });
        var chatRoom = new ChatRoomConstructor(chatRoomParams);
        new Tile({
            type: 'chat-room',
            tile: $tile,
            chatRoom: chatRoom,
            body: $chatRoomBody
        });
        var room_instance_id = chatRoomParams.roomInfo.room_instance_id;
        this.currentSubscriptions = [];
        if (this.tabName in this.hashOfSubscriptionState) {
            this.currentSubscriptions = this.hashOfSubscriptionState[this.tabName].slice(0);
        }
        if (!_.contains(this.currentSubscriptions, room_instance_id)){
            this.currentSubscriptions.push(room_instance_id);
            this.update_subscriptions();
            this.hashOfSubscriptionState[this.tabName] = this.currentSubscriptions.slice(0);
        }
        return $tile;
    },

    update_subscriptions: function() {
        console.log("currentSubscriptions:", this.currentSubscriptions);
        this.imvu.call('clobberRoomOccupancySubscriptions', this.currentSubscriptions);
    },

    getUpsellImg: function(index) {
        index = index % 10 + 1;
        return "img/ap_locked/ap_locked_room" + index + ".png";
    },

    createUpsellRoomTile: function(ChatRoomConstructor, chatRoomParams, imgIndex) {
        $chatRoomBody = this.cloneChatRoomWidgetTemplate();
        if(chatRoomParams['roomInfo']) {
            chatRoomParams['roomInfo']['image_url'] = this.getUpsellImg(imgIndex);
        }
        $.extend(chatRoomParams, {
            root: $chatRoomBody,
            imvu: this.imvu,
            network: this.network,
            isUpsellOnly: true
        });
        chatRoom = new ChatRoomConstructor(chatRoomParams);
        var $tile = this.$tileTemplate.clone();
        $tile.removeAttr('id');
        var tile = new Tile({
            type: 'upsell-room',
            tile: $tile,
            chatRoom: chatRoom,
            body: $chatRoomBody
        });
        return tile;
    },

    cloneAdTemplate: function() {
        var $ad = this.$adTemplate.clone();
        $ad.removeAttr('id');
        var adSpaceUrl = this.imvu.call('getChatRoomsModeAdSpaceUrl');
        $ad.find('.adframe').attr('src', adSpaceUrl);
        return $ad;
    },

    createAdTile: function() {
        $adBody = this.cloneAdTemplate();

        var $tile = this.$tileTemplate.clone();
        $tile.removeAttr('id');
        var tile = new Tile({
            type: 'ad',
            tile: $tile,
            body: $adBody
        });
        return tile;
    },

    createApUpsellTile: function(response) {
        var $tile = this.$tileTemplate.clone();
        $tile.removeAttr('id');
        var tile = new Tile({
            type: 'show-ap-upsell',
            tile: $tile,
        });

        var numRooms = 0;
        var searchWord = '';
        if(this.$search) {
            searchWord = this.$search.find('input').val();
            if(searchWord == 'Search all rooms...') {
                searchWord = '';
            }
        }
        if(response.meta.null_search_results) {
            numRooms = response.meta.null_search_results.number_of_rooms;
        }
        $tile.find(".room-numbers").text(numRooms);
        $tile.find(".keywords-text").text(searchWord);
        $tile.find(".get-ap.imvu-button").unbind('click').bind('click', function() {
            this.imvu.call('launchNamedUrl', 'accesspass_null_search');
        }.bind(this));

        return tile;
    },

    refreshUI: function() {
        this.resizeScrollPaneAndNpIMVU();
    },

    onActivate: function(tabName) {
        this.tabName = tabName;
        this.setNoResultsMessage(tabName);
        this.allRoomInstanceIds = Object.create(null);
        this.showRemoveAllFilters();
        var savedFilters = this.getFilters();
        if (! _.size(savedFilters)) {
            savedFilters = this.viewWidget.getDefaults();
            this.saveFilters(savedFilters);
        }
        this.viewWidget.setFilters(savedFilters);
        this.filters = savedFilters || {};
        this.viewWidget.showFilterButton();
        this.viewWidget.showSearchOptions();
        switch(tabName) { 
            case 'all':
                this.$search.show();
                this.shouldShowAds = true;
                break;
            case 'favorites': 
            case 'visited': 
                this.filters[tabName] = true;
                this.shouldShowAds = false;
                break;
        }
        if (!this.imvu.call('showClientAds')) {
            this.shouldShowAds = false;
        }
        this.dataOffset = 0;
        this.dataRows = null;
        this.dataSource.setQueryParameter('offset', null);
        this.update_subscriptions();
        this.rebuildQueryParameter();
        this.refreshUI();
    },

    setNoResultsMessage: function(tabName) {
        $('.sorry-msg').hide();
        $('.sorry-msg.' + tabName).show();
    },
    
    showRemoveAllFilters: function() {
        $('.remove-all-filters').toggle(true);
    },
    
    hideRemoveAllFilters: function() {
        $('.remove-all-filters').toggle(false);
    },

    hideRoomImages: function() {
        this.$root.find('img.room-image').each(function(i) {
            $(this).attr('src', '');
        });
    },

    onDeactivate: function() {
        this.hideRoomImages();
        this.$search.hide();
        this.emptyRoomList();
        this.viewWidget.hideSearchOptions();

        var $avview_background = $('div.#avview-holder #avview-background');
    },

    setupSearch: function() {
        this.filters = {};
        this.filters.searchCriteria = "";
        this.viewWidget.on("change:vip", this.updateFilter.bind(this, "vip"));
        this.viewWidget.on("change:occupancy", this.updateFilter.bind(this, "occupancy"));
        this.viewWidget.on("change:roomtype", this.updateFilter.bind(this, "roomtype"));
        this.viewWidget.on("change:language", this.updateFilter.bind(this, "language"));

        var $searchInput = this.$search.find('input');
        var $searchButton = this.$search.find('button');
        createSearchWidget({
            $searchInput: $searchInput,
            $searchButton: $searchButton,
            default_text: "Search all rooms...",
            enterSearch: this.enterSearch.bind(this)
        });
    },

    updateFilter: function(field, value) {
        this.filters[field] = value;
        this.rebuildQueryParameter();
        this.imvu.call('setPref', 'chatRoomSearchFilter.' + this.tabName  + '.' + field, value);
    },

    updateFilters: function(newVals) { 
        $.extend(this.filters, newVals);
        this.rebuildQueryParameter();
        this.saveFilters(this.filters);
    },

    rebuildQueryParameter: function() {
        this.dataSource.setQueryParameter('search', this.filters.searchCriteria || null);
        this.dataSource.setQueryParameter('vip', this.filters.vip === "only" ? 1 : null);
        this.dataSource.setQueryParameter('occupancy', this.filters.occupancy != "all" ? this.filters.occupancy : null);
        this.dataSource.setQueryParameter('ap', this.filters.roomtype === "ga" ? "0" : (this.filters.roomtype === "ap" ? 1 : null));
        this.dataSource.setQueryParameter('language', (this.filters.language !== "" ? this.filters.language : null));

        this.dataSource.setQueryParameter('favorite', (this.filters.favorites)?1:null);
        this.dataSource.setQueryParameter('recent', (this.filters.visited)?1:null);
        this.allRoomInstanceIds = Object.create(null);


        if(this.filters.searchCriteria && this.tabName == "all") {
            this.dataSource.setQueryParameter('null_upsell', 1);
        }

        this.dataOffset = 0;
        this.dataSource.setQueryParameter('offset', null);
        this.infiniteScrolling.reloadResults();
    },

    tryRefreshDataSource: function(clearRoomList) {
        var queryArgs = this.dataSource.generateRequestArguments();
        if(clearRoomList || !this.lastQueryArgs || this.lastQueryArgs != queryArgs) {
            if(clearRoomList) {
                this.$allRoomsScrollPane.scrollTop(0);
                this.emptyRoomList();
            }

            this.dataSource.refresh();

            this.lastQueryArgs = queryArgs;
        } else { 
            if (this.onSearchCancelled) {
                this.onSearchCancelled();
                this.onSearchCancelled = null;
            }
        }
    },

    enterSearch: function(searchInput) {
        this.allRoomInstanceIds = Object.create(null);
        this.filters.searchCriteria = searchInput;

        this.$allRoomsScrollPane.scrollTop(0);
        this.dataOffset = 0;
        this.dataSource.setQueryParameter('offset', null);

        this.rebuildQueryParameter();
    },


}

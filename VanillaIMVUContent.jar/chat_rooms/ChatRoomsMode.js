function ChatRoomsMode(args) {
    this.$root = $(args.root);
    this.$results = this.$root.find('.search-results > .bd');
    this.$template = this.$root.find('.template').clone();
    this.firstPage = true;
    this._window = args._window || window;

    this.highlights = {};
    this.search = args.search;
    this.search.$root.bind('searchTabClicked', function () {
        this.$manageResultScreen.hide();
        this.$searchResultScreen.show();
        this.imvu.call('toggleHint', true);
    }.bind(this));
    this.search.$root.bind('manageTabClicked', function () {
        if(this.$manageResultList.html() == '') this.update_manage_screen();
        this.imvu.call('toggleHint', false);
        this.$searchResultScreen.hide();
        this.$manageResultScreen.show();
    }.bind(this));
    this.$root.bind('roomCreated', function (e, roomInfo) {
        if(this.$manageResultList.find('li:first .vip-create').is(':visible') || this.$manageResultList.find('li:first .free-create').is(':visible')) {
            this.$manageResultList.find('li:first').remove();
        } else {
            this.$manageResultList.find('li:last').remove();
        }

        var room = this.add_manage_room(roomInfo);
        room.highlight('new');

        if(this.$manageResultList.find('li .room.panel:visible').length >= this.roomManagementInfo.limit) {
            this.search.createRoomButton.disable();
            while ($('.room-widget .panel.vip-available:visible').length){
                var li = $($('.room-widget .panel.vip-available:visible')[0].parentNode.parentNode).remove();
                this.$manageResultList.append(this.create_manage_cell({ panel: 'free-unavailable', managementinfo: this.roomManagementInfo }).$container);
            }
        }
    }.bind(this));
    this.$root.bind('roomUpdated', function (e, roomInfo) {
        this.update_manage_room(roomInfo);
    }.bind(this));

    this.network = args.network;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;

    this.dataSource = args.dataSource;
    this.dataSource.subscribe('requestEvent', function (result) {
        this.$spinner.show();
    }.bind(this));
    this.dataSource.subscribe('requestResult', function (result) {
        this.$spinner.hide();

        var response = {};
        if ('error' in result) {
            this.imvu.call('showErrorDialog', _T("Search Error"), _T("We are currently experiencing problems returning chat room results.  Please check your network connection and try again."));
        } else {
            response = result.response;
            this.$root.find(".welcome-rooms").hide();

            this.toggleNullSearchUpsell(response, false);
            this.toggleMiniNullSearchUpsell(response, false);
            var has_null_search_results = response.meta.null_search_results && response.meta.null_search_results.number_of_rooms > 0;
            if (has_null_search_results) {
                if (response.results.length < 1 && !response.meta.should_hide_upsell_panel) {
                    this.toggleNullSearchUpsell(response, true);
                } else {
                    this.toggleMiniNullSearchUpsell(response, true);
                }
            } else if (response.meta
                        && this.imvu.call('shouldSeeWelcomeRooms')
                        && (response.meta.new_enough || response.meta.is_welcome_room_moderator)
                    ){

                //set the room instance ids
                this.$root.find('.adult .room1 .go_button').data('room_instance', response.meta.welcome_room_instance_ids.adult.room1);
                this.$root.find('.adult .room2 .go_button').data('room_instance', response.meta.welcome_room_instance_ids.adult.room2);
                this.$root.find('.adult .room3 .go_button').data('room_instance', response.meta.welcome_room_instance_ids.adult.room3);
                this.$root.find('.teen .room1 .go_button').data('room_instance', response.meta.welcome_room_instance_ids.teen.room1);
                this.$root.find('.teen .room2 .go_button').data('room_instance', response.meta.welcome_room_instance_ids.teen.room2);
                this.$root.find('.teen .room3 .go_button').data('room_instance', response.meta.welcome_room_instance_ids.teen.room3);

                if (response.meta.is_welcome_room_moderator) {
                    if (this.firstPage) {
                        this.eventBus.fire('HintWidget.requestShiftPosition',{'deltaX': 0, 'deltaY':110});
                        this.eventBus.fire('ChatRoomSearch.initialNumOnFilter', {'additional_offsetY' : 110})
                    }              
                    this.$root.find('.moderator_panel').show();
                    this.$root.find('#moderator_separator').show();
                } else {
                    if (response.meta.should_hide_welcome_rooms) {
                        $('#guest-friendly-rooms').show();
                    } else {
                        this.showWelcomeRooms(false);
                        $('#guest-friendly-rooms').hide();
                    }
                }
                var self = this;

                this.$root.find('.go_button').data('ignoringJoinWelcomeRoom', false);
                // add the listeners
                this.$root.find('.go_button').unbind('click').click(function () {
                    if($(this).data('ignoringJoinWelcomeRoom')) { //Prevents multiple instances of 1 welcome room being opened when clicking quickly on "Go"
                        return;
                    }
                    var base_room_instance = $(this).data('room_instance');
                    var parts = base_room_instance.split('-');
                    var room_owner = parts[0];

                    self.imvu.call('joinWelcomeRoom', room_owner);
                    $(this).data('ignoringJoinWelcomeRoom',true)
                    setTimeout(function() {
                        $(this).data('ignoringJoinWelcomeRoom',false)
                    }.bind(this), 2000);
                });

                this.$root.find('.dont-show-this-panel').unbind('click').click(function () {
                    $('#guest-friendly-rooms').fadeIn();
                    self.imvu.call('hideWelcomeRooms');
                    $('.welcome-rooms').slideUp(400, function () {});
                });

                this.$root.find('.welcome-rooms .close_button').unbind('click').click(function () {
                    $('#guest-friendly-rooms').fadeIn();
                    self.imvu.call('hideWelcomeRooms');
                    $('.welcome-rooms').slideUp(400, function () {});
                });

                this.$root.find('.moderator_panel #moderator-go').unbind('click').click(function () {
                    var rand_key = Math.floor(Math.random()*6); // random key between 0 and 5
                    var room_instances = $('.welcome_room .go_button').map(function() {
                        return $(this).data('room_instance').split('-')[0];
                    });
                    self.imvu.call('joinWelcomeRoom', room_instances[rand_key%room_instances.length]);
                });

                this.$root.find('#guest-friendly-rooms').unbind('click').click(function () {
                    self.showWelcomeRooms(true);
                    $('#guest-friendly-rooms').fadeOut();
                });
            }
        }
        this.populate(response);
    }.bind(this));

    this.$spinner = $('<div id="loading-mask"><div id="loading-spinner"></div></div>');
    this.$spinner.hide();
    this.$root.append(this.$spinner);
    
    this.$featuredRoomLink = $('.featured-rooms');
    this.$newTag = $('.new-tag');
    this.$featuredRoomLink.unbind('click').click(function() {
        this.eventBus.fire('HintWidget.closeHintOperation');
        this.eventBus.fire('ChatRoomMode.FeaturedRoomsClicked',{});
    }.bind(this));

    this.$searchResultScreen = this.$root.find('.search-results');
    this.$manageResultScreen = this.$root.find('.manage-results');

    this.$manageResultList = this.$manageResultScreen.find('ul.bd');

    this.$upsellBanner = this.$manageResultScreen.find('.upsell');
    this.$upsellBanner.click(function () { this.show_vip_upsell(); }.bind(this));

    this.subscriptions = [];
    this.roomManagementInfo = [];

    this.users_name = this.imvu.call('getAvatarName');

    this.eventBus.register('updateVipStatus', function (eventName, data) {
        this.handleUpdateVipStatus(eventName, data);
    }.bind(this));

    this.eventBus.register('updateAPStatus', function (eventName, data) {
        this.handleUpdateAPStatus(eventName, data);
    }.bind(this));

    IMVU.Client.util.turnLinksIntoLaunchUrls($('.tips'), this.imvu);
}

ChatRoomsMode.prototype = {
    populate: function (response) {
        var result = (response.results ? response.results : []);
        var null_search_results = (response.meta ? response.meta.null_search_results : null);
        this.$results.html('');
        this.chatRooms = [];
        this.$searchResultScreen.toggleClass('no_result', false);
        if (result.length > 0) {
            console.log("Cloning templates for search results");
            for each (var info in result) {
                var languageName = this.search.filterMenus['language'].getLabelByValue(info.language);
                if (typeof(languageName) == 'undefined') {
                    languageName = _T('Unspecified');
                }
                info.language = languageName;
                var $item = this.$template.clone().removeClass('template'),
                     room = new IMVU.Client.widget.ChatRoom_deprecated({
                        root: $item.find('.room-widget'),
                        network: this.network,
                        imvu: this.imvu,
                        eventBus: this.eventBus,
                        name: info.name,
                        owner: {cid: info.customers_id, name: info.customers_name},
                        thumbnail: info.image_url,
                        occupancy: {participants: info.num_participants, maximum: info.max_users},
                        room: {ap: info.is_ap, vip: info.is_vip, av: info.is_av, favorite: info.is_favorite, cid: info.customers_id, roomId: info.customers_room_id},
                        language: languageName,
                        info: info
                    });
                this.$results.append($item);
                this.chatRooms.push(room);
            }
            console.log("Done cloning templates for search results");
        } else if (null_search_results && null_search_results.number_of_rooms > 0) {
            for each (var info in response.meta.null_results_formatted) {
                var languageName = this.search.filterMenus['language'].getLabelByValue(info.language);
                if (typeof(languageName) == 'undefined') {
                    languageName = _T('Unspecified');
                }
                info.language = languageName;
                var $item = this.$template.clone().removeClass('template'),
                     room = new IMVU.Client.widget.ChatRoom_deprecated({
                        root: $item.find('.room-widget'),
                        network: this.network,
                        imvu: this.imvu,
                        eventBus: this.eventBus,
                        name: info.name,
                        owner: {cid: info.customers_id, name: info.customers_name},
                        thumbnail: info.image_url,
                        occupancy: {participants: info.num_participants, maximum: info.max_users},
                        room: {ap: info.is_ap, vip: info.is_vip, av: info.is_av, favorite: info.is_favorite, cid: info.customers_id, roomId: info.customers_room_id},
                        language: languageName,
                        info: info,
                        panel: 'room-null-upsell'
                    });
                this.$results.append($item);
                this.chatRooms.push(room);
            }
        } else {
            this.$searchResultScreen.toggleClass('no_result', true);
            var numberOfActiveFilters = this.search.$activeFilters.find('.active:visible').length;
            $('#remove-all-filters').toggle(numberOfActiveFilters > 0);
        }
        this.update_subscriptions();
        this.stopGifAnimationWhenMouseOver();
        this.$root.find('.search-results').scrollTop(0);
        if (this.firstPage) {
            this.firstPage = false;
        } else {
            this.eventBus.fire('ChatRoomsMode.ReloadAd',{});
        }
    },

    updateRoomOccupancy: function(room_id, occupancy) {
        for each(room in this.chatRooms) {
            if(room != undefined) {
                if(room.roomInstance == room_id) {
                    room.updateOccupancy(occupancy);
                }
            }
        }
    },

    update_subscriptions: function() {
        var subscribe = [];
        for each (var room in this.chatRooms) {
            subscribe.push(room.roomInstance);
        }
        this.imvu.call('clobberRoomOccupancySubscriptions', subscribe);
    },

    showWelcomeRooms : function(slide) {
        if (slide) {
            $('.welcome-rooms').slideDown(400, function () {});
        } else {
            $('.welcome-rooms').show();
        }
        if (this.imvu.call('isTeen')){
            $('.adult').hide();
            $('.teen').show();
        } else {
            $('.adult').show();
            $('.teen').hide();
        }
    },

    stopGifAnimationWhenMouseOver : function() {
        this.canvasEl = null;
        var roomPanelBd = this.$results.find('div.room > div.bd')
        roomPanelBd.mouseenter(function(eventObject) {
            if (this.canvasEl == null) {
                var elThumb = $(eventObject.currentTarget).find('img.thumbnail');

                this.canvasEl = document.createElement('canvas');
                $(this.canvasEl).attr('width', 206);
                $(this.canvasEl).attr('height', 92);
                $(this.canvasEl).css('position', 'absolute');
                var ctx = this.canvasEl.getContext('2d');
                var drawHeight = Math.max(91, elThumb.height());
                try {
                    ctx.drawImage(elThumb[0], 1, 1, 205, drawHeight);
                } catch (e) {
                }
                $(this.canvasEl).insertAfter(elThumb);

                $(elThumb).toggle(false);
            }
        }.bind(this));
        roomPanelBd.mouseleave(function(eventObject) {
            if (this.canvasEl) {
                YAHOO.util.Event.purgeElement(this.canvasEl);
                $(this.canvasEl).remove();
                this.canvasEl = null;

                var elThumb = $(eventObject.currentTarget).find('img.thumbnail');
                $(elThumb).toggle(true);
            }
        }.bind(this));
    },

    activate: function() {
        this.update_subscriptions();
    },

    create_manage_cell: function(extra_args) {
        var $item = this.$template.clone().removeClass('template');

        if(extra_args.panel != 'room-manage' && extra_args.panel != 'room-locked' && extra_args.panel != 'vip-create' && extra_args.panel != 'vip-available' && extra_args.panel != 'free-create' && extra_args.panel != 'free-unavailable' && extra_args.panel != 'chatroom-slot-upsell') {
            throw new Error("create_manage_cell() received a bad panel type [" + extra_args.panel + "].");
        }

        var args = {
            root: $item.find('.room-widget'),
            network: this.network,
            imvu: this.imvu,
            eventBus: this.eventBus
        };

        if(extra_args) {
            $.extend(args, extra_args);
        }

        if(args.info && args.info.room_instance_id) {
            $item.attr('id', 'room-widget-container-' + args.info.room_instance_id);
        }

        room = new IMVU.Client.widget.ChatRoom_deprecated(args);
        room.$container = $item;

        args.root.bind('roomDeleted', function () {
            this.update_manage_screen();
        }.bind(this));

        return room;
    },

    add_manage_room: function(roomInfo, type, append) {
        if(!type) type = 'room-manage';

        var languageName = this.search.filterMenus['language'].getLabelByValue(roomInfo.language);
        if (typeof(languageName) == 'undefined') languageName = _T('Unspecified');
        roomInfo.language = languageName;
        roomInfo.is_ap = parseInt(roomInfo.is_ap, 10);
        roomInfo.is_vip = parseInt(roomInfo.is_vip, 10);
        roomInfo.is_age_verified_only = parseInt(roomInfo.is_age_verified_only, 10);
        roomInfo.customers_name = this.users_name;

        var args = {
            name: roomInfo.name,
            panel: type,
            owner: {cid: roomInfo.customers_id, name: this.users_name},
            thumbnail: roomInfo.image_url,
            occupancy: {participants: roomInfo.num_participants, maximum: roomInfo.max_users},
            room: {ap: roomInfo.is_ap, vip: roomInfo.is_vip, av: roomInfo.is_age_verified_only, favorite: parseInt(roomInfo.is_favorite,10), cid: roomInfo.customers_id, roomId: roomInfo.customers_room_id,  customers_name: this.users_name},
            language: languageName,
            info: roomInfo,
            managementinfo: this.roomManagementInfo
        };

        var new_cell = this.create_manage_cell(args);

        if(append) this.$manageResultList.append(new_cell.$container);
        else this.$manageResultList.prepend(new_cell.$container);

        return new_cell;
    },

    update_manage_room: function(roomInfo, type) {
        if(!type) type = 'room-manage';

        var old_cell_container = $('#room-widget-container-' + roomInfo.room_instance_id);
        if(old_cell_container.length == 0) return null;

        var languageName = this.search.filterMenus['language'].getLabelByValue(roomInfo.language);
        if (typeof(languageName) == 'undefined') languageName = _T('Unspecified');
        roomInfo.language = languageName;
        roomInfo.is_ap = parseInt(roomInfo.is_ap, 10);
        roomInfo.is_vip = parseInt(roomInfo.is_vip, 10);
        roomInfo.is_age_verified_only = parseInt(roomInfo.is_age_verified_only, 10);
        roomInfo.customers_name = this.users_name;

        var args = {
            name: roomInfo.name,
            panel: type,
            owner: {cid: roomInfo.customers_id, name: this.users_name},
            thumbnail: roomInfo.image_url,
            occupancy: {participants: roomInfo.num_participants, maximum: roomInfo.max_users},
            room: {ap: roomInfo.is_ap, vip: roomInfo.is_vip, av: roomInfo.is_age_verified_only, favorite: parseInt(roomInfo.is_favorite,10), cid: roomInfo.customers_id, roomId: roomInfo.customers_room_id, customers_name: this.users_name},
            language: languageName,
            info: roomInfo,
            managementinfo: this.roomManagementInfo
        };

        var new_cell = this.create_manage_cell(args);

        old_cell_container.replaceWith(new_cell.$container);

        return new_cell;
    },

    update_manage_screen: function() {
        this.$spinner.show();

        serviceRequest({
            method: 'GET',
            uri: IMVU.SERVICE_DOMAIN + '/api/room_management_info.php',
            data: null,
            network: this.network,
            imvu: this.imvu,
            callback: this.populate_manage.bind(this)
        });
    },

    populate_manage: function(result, error) {
        if (error) {
            this.imvu.call('showErrorDialog', _T("Manage Error"), _T("We are currently experiencing problems returning your chat room information.  Please check your network connection and try again."));
            console.log("Failed to load management info.");
            return;
        }

        var is_vip = this.imvu.call('hasVIPPass');

        this.$upsellBanner.toggle(!is_vip);

        if(result.result) result = result.result;
        this.roomManagementInfo = result;

        this.$spinner.hide();
        this.$manageResultList.html('');

        var displayed = 0;
        var limit = result.limit;
        this.search.createRoomInfo = this.roomManagementInfo;

        this.chatRooms = [];
        var shouldShowChatRoomSlots = true;
        if(result.rooms.length > 0) {
            for(var index in result.rooms) {
                displayed++;

                var type = 'room-manage';
                if(displayed > limit) {
                    type = 'room-locked';
                    if (shouldShowChatRoomSlots) {
                        displayed--; // crs doesn't count against vip upsell results 
                        shouldShowChatRoomSlots = false;
                        type = 'chatroom-slot-upsell';
                    }
                }
                var room = this.add_manage_room(result.rooms[index], type, true);
                this.chatRooms.push(room);
            }
        } else {
            if (limit > 0) {
                var type = (is_vip?'vip':'free') + '-create';
                this.$manageResultList.append(this.create_manage_cell({ panel: type, managementinfo: this.roomManagementInfo }).$container);
                displayed++;
            } else if (shouldShowChatRoomSlots) {
                var type = 'chatroom-slot-upsell';
                this.$manageResultList.append(this.create_manage_cell({ panel: type, managementinfo: this.roomManagementInfo }).$container);
                //  crs doesnt count against vip 'displayed' upsells
            }
        }
        this.update_subscriptions();

        var displayed_limit = limit > 10 ? limit : 10;
        while(displayed < displayed_limit) {
            this.$manageResultList.append(this.create_manage_cell({ panel: ((displayed < limit)?'vip-':'free-un') + 'available', managementinfo: this.roomManagementInfo }).$container);
            displayed++;
        }

        this.highlights = {};
        if (result.rooms.length < limit) this.search.createRoomButton.enable();
        else this.search.createRoomButton.disable()
    },

    show_vip_upsell: function() {
        this.imvu.call('showVipInfo', 'chatrooms');
    },

    handleUpdateVipStatus: function(eventName, data) {
        this.update_manage_screen();
    },

    handleUpdateAPStatus: function(eventName, data) {
        var $upsellC = this.$root.find(".upsell-panel-c");
        var $miniUpsellC = this.$root.find(".upsell-mini-c");
        if ($upsellC.is(':visible') || $miniUpsellC.is(':visible')) {
            this.search.$search.click();
        }
    },

    toggleNullSearchUpsell: function(response, display) {
        var $upsellC = this.$root.find(".upsell-panel-c");
        if (display) {
            var self = this;
            $upsellC.show();
            $upsellC.find(".room-numbers").text(response.meta.null_search_results.number_of_rooms);
            $upsellC.find(".keywords-text").text( $(".search-panel input#keywords").val() );
            $upsellC.find(".upsell-link").unbind('click').bind('click', function() {
                self.imvu.call('launchUrl', 'http://www.imvu.com/accesspass/?source=null_search');
            });
            this.$root.find('.upsell-panel-c .close_button').unbind('click').click(function () {
                self.imvu.call('hideUpsellPanel');
                $('.upsell-panel-c').slideUp(400, function () {});
            });
        } else {
            $upsellC.hide();
        }
    },

    toggleMiniNullSearchUpsell: function(response, display) {
        var $miniUpsellC = this.$root.find(".upsell-mini-c");
        if (display) {
            var self = this;
            $miniUpsellC.show();
            $miniUpsellC.find(".room-numbers").text(response.meta.null_search_results.number_of_rooms);
            $miniUpsellC.find(".upsell-link").unbind('click').bind('click', function() {
                self.imvu.call('launchUrl', 'http://www.imvu.com/accesspass/?source=null_search_mini');
            });
        } else {
            $miniUpsellC.hide();
        }
    }
}

ROOMS_LIST_PAGINATED_EXAMPLE_RESULTS = {
    "customers_id":[55737427,59048120,2650285,66998618,52885,150001,741622,12313552,17321032,29384498,36117472,50082499,53880977,61729935,69979692,14294248,37742847,41034544,48828302,51140788],
    "customers_name":["romeoness1","LilCloverRover","Toomuch586","BeFriendlyBCreative","KelseyLou","meanbabes","EllieJealousy","Teknicolour","Guest_BloodyxInfinity","EstherGlamorous","kimmyqt44","JRRoma","AceEversole","ahmedhammad1","XBONDO2","gothickittten","natashia333","susansun1999","JeyTee3","Jadenis15"],
    "customers_room_id":["9","13","17","6","5","9","70","151","8","35","31","8","17","108","11","13","46","35","17","23"],
    "max_users":[8,10,6,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
    "is_favorite":[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "is_ap":[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "is_vip":[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "is_av":[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "num_participants":[5,10,4,6,8,8,8,8,8,8,7,8,7,8,8,7,8,7,8,8],
    "participants":[[75138205,75265059,73340197,75198138,64466049,74627049,74743988,75265349],[75257858,75260135,57878714,75260363,75264262,75269095,75092397,75069383,73394688],[75144791,75269549,75218099,74918304,35232425],[75136612,75217655,50285206,74596929,75173448,75267767,72475706,75266143,61088470],[75266572,75267322,34064770,49043083,71392553,74963176,75210045],[75257161,75204536,73874187,50981558,74843362,52343956,47710572,74983729,73873547,47488387],[72417064,75257591,56098222,75138949,65614639,75148338,56799921,67300068,74837800],[73313730,75191641,73722620,72430874,70897036,11264689,36939074,75236991,75210853,28450456],[59419226,42443348,67611007,67566206,9153138,11492856,75193317,4499691,74143246,54561760],[73907962,51158320,75204321,75262251,49975730,72811539,44397772,75264726],[74370662,74052317,75244683,75237590,73708422,71521382,73951423,75270081,71592183],[75204548,74324746,75262878,74610685,47852755,74200191,69111279,74182795,38119292,75208402],[74736332,75204949,75240778,72534252,74328795,633144,75250258,51670269,68360738],[6582891,68707014,75029485,75268301,75261654,75266358,74966514,71393287,74522358,75236481],[55349430,73531926,75258454,75196939,75269940,75211622,75212936,73596894,35482026,74956976],[28825136,75197439,74734677,75142385,71979974,73868224,73229277,50098795],[71592851,74994124,74837034,75258589,75264714,75144805,75196964],[74929346,63777482,74894260,74966393,75261508,74588708,75266926,75268927,73377455,70552245],[75126134,73908510,75236969,75192651,62989496,75174355,74969328,63087592,75245451],[71104146,75135687,66424476,74818875,75264323,73255743,72730637,74319292]],
    "image_url":["http:\/\/userimages.imvu.com\/userdata\/55\/73\/74\/27\/userpics\/Snap_21384979214c589e0a31a33.jpg","http:\/\/userimages.imvu.com\/userdata\/59\/04\/81\/20\/userpics\/Snap_1112268604c7d7cf50afe5.jpg","http:\/\/userimages.imvu.com\/userdata\/02\/65\/02\/85\/userpics\/Snap_184856424949120e7698f9f.jpg","http:\/\/userimages.imvu.com\/userdata\/66\/99\/86\/18\/userpics\/Snap_2733685764d22b5232027f.jpg","http:\/\/userimages.imvu.com\/userdata\/00\/05\/28\/85\/userpics\/Snap_169042564347940214a6a57.jpg","http:\/\/userimages.imvu.com\/userdata\/00\/15\/00\/01\/userpics\/Snap_43719709248b329cbd1415.jpg","http:\/\/userimages.imvu.com\/userdata\/00\/74\/16\/22\/userpics\/Snap_6051233814c42b1257eaf3.jpg","http:\/\/userimages.imvu.com\/userdata\/12\/31\/35\/52\/userpics\/Snap_14365438584b6b499bba4da.jpg","","http:\/\/userimages.imvu.com\/userdata\/29\/38\/44\/98\/userpics\/Snap_9499314944b924c4d33136.jpg","http:\/\/userimages.imvu.com\/userdata\/36\/11\/74\/72\/userpics\/Snap_180202907349f00547affc0.jpg","http:\/\/userimages.imvu.com\/userdata\/50\/08\/24\/99\/userpics\/Snap_10776482214bb213a2e5e2b.jpg","http:\/\/userimages.imvu.com\/userdata\/53\/88\/09\/77\/userpics\/001_edit_2.jpg","http:\/\/userimages.imvu.com\/userdata\/61\/72\/99\/35\/userpics\/Snap_4481081664d17b08edce77.jpg","http:\/\/userimages.imvu.com\/userdata\/69\/97\/96\/92\/userpics\/Snap_15732361954d5be4153d1b622222222_0.jpg","","http:\/\/userimages.imvu.com\/userdata\/37\/74\/28\/47\/userpics\/Snap_3809781584a91c84e9b25c.png","http:\/\/userimages.imvu.com\/userdata\/41\/03\/45\/44\/userpics\/{CBT0FW(X}@]{2[Z[B{R__W_1.jpg","http:\/\/userimages.imvu.com\/userdata\/48\/82\/83\/02\/userpics\/eil_0.jpg","http:\/\/userimages.imvu.com\/userdata\/51\/14\/07\/88\/userpics\/Snap_2495956354c2c3f24ae584.jpg"],
    "description":["well this is the future with space ships or hovers whatever do whatever you want just no yucky stuff","this is atwilight saga room for twilight fan&#039;s and roleplayers no twilight haters! no being rude but respecctful","20+, volleyball, soccer, ride the four-wheeler,and more. Just come to have a great time and be respectful!!","You would never think you are in the middle of a city! Click around the room to explore, click on your avatar and other avatars to perform animations!","For anyone looking for a good time, or to make some new friends, this is the place for you!  No music, pets, or anything of the sort to interfere with loading!","place to chill and have a good old gossip","Have fun in this awesome rave room for all types of people. :D But, Don&#039;t annoy me or my mods &lt;3","A Haunted House... Don&#039;t come in and then whine that your scared.... \r\ntags: Dark, Goth, Emo, Ghost,Hell , Anime, Japan","Let's have a beach party ^^","Welcom every body to Thailand Jungle..This room is Thai community, Pond side and also club house...we also have music station which is Ipod thing you have to step on it to get the redio chanel...The owner is EstherGlamorous. plz be respact to each other n","This place has lots to see and its a really fun place. Come explore with me!","A New Israel Room! Talk Free! Meet People And More! Come And Enjoy! Talk Here Only On Hebrew Or English. Respect The Mod: SweetLerka Thank You.","An awesome place that I thank xExandrax for, All are welcome to come\r\nRules: Ask before playing music and enjoy yourself ^^ -Ace","for all who loves palestine .... a place for fun and good time with arabic music \r\nwhere u can meet good people and make friends\r\nand earn credits l_00_l\r\nrespect to be respected or..... u know lol","Dear IMVU members hope you like the room kindly informming you to act in good way , its a chat room come and chat , dance , talk eveything you want . we hope too see you in the room","these is a beach to have fun and ahng out.","","Now hiring with susansun1999 in charge this is a luxury Spa resort come here to meet ppl anyone is welcome u can and may get booted","A Romantic Island with a RollerCoaster &amp; alot More. Real Working Vulcano! No Noobs Allowed!! Play Music &amp; Have Fun !! :]","Hey! No rules, just have fun! Check out the roller coaster, pool, club, drive-in movie theater, and the garden. Mods:  my sister graceishere, my bf that i &lt;3 DevSk8s, my online sister BubblesIsMyName123, my friend MaraOreo, and (of course) me, Jadenis1"],
    "room_size":["0","0","0","0","0","255","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],
    "allow_voice":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "name":["futurama","twilight saga fan&#039;s room","Sandy Beach Party","City Centre Park","House o&#039; Sexy","meanies room","Ravers Bedroom!!","Japanese Style Haunted House","beach","Thailand Pond","Jungle fun for everyone","WaterPark Night Israel","Ace&#039;s Purgatory","palestine a7la wa6an","*Egypt Romantic Lovers *","tropical beach","castle of dragons italy","VIP Lux Spa Resort","Vulcano Hawaii Island &lt;3","Jaden&#039;s Dawn Party Room"],
    "language":["zz","es","no","fr","","en","pt","","en","de","zz","es","no","fr","","en","pt","","en","de"],
    "number_of_rooms":"245384","rooms_per_page":20,"is_new_enough_for_welcome_rooms":1,"is_welcome_room_moderator":0,"should_hide_welcome_rooms":0,"welcome_room_instance_ids":{"adult":{"room1":"113982321-22","room2":"113982680-2","room3":"113982732-2"},"teen":{"room1":"113982643-2","room2":"113982693-2","room3":"113982747-2"}},
    "rating":[0,1,2,3,4,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
};

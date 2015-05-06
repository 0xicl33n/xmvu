function ChatModeMyRooms(args) {
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.network = args.network;
    this.viewWidget = args.viewWidget;
    this.$root = args.root;
    this.$window = args.window || $(window);
    this.$chatRoomTemplate = args.templates.find('#chatroom-template');
    this.$tileTemplate = args.templates.find('#tile-template');
    this.$publicRooms = this.$root.find('.public-rooms');
    this.$privateRooms = this.$root.find('.private-rooms');
    this.$scrollable = this.$root.find('.scrollable');
    this.createMyRoomTile();
    this.setupScrollPane();
    this.resizeScrollPane();
    this.loadMyPublicRooms();
    this.createMarriageTile();
    this.setUpSliderHelper();
    this.createSharedRoomUpsellTile();
    
    if (!('currentSubscriptions' in this)) {
        this.currentSubscriptions = [];
    }

    this.eventBus.register('updateMarriageStatus', function (eventName, data) {
        this.handleMarriageStatusUpdate(eventName, data);
    }.bind(this));
    
    this.$publicRooms.bind('chatRoomDeleted', this.updateCreateRoomOrUpsell.bind(this));
    this.eventBus.register('updateVipStatus', function (eventName, data) {
        this.reloadMyPublicRooms();
    }.bind(this));

    this.eventBus.register('SharedRoomsUpdated', function (eventName, data) {
        this.reloadSharedRoomTiles();
    }.bind(this));

}

ChatModeMyRooms.prototype = {
    setUpSliderHelper: function() { 
        this.sliderHelper = new ChatRoomsSliderHelper({
            $roomList: this.$publicRooms,
            $scrollPane: this.$scrollable
        }); 
    },

    handleMarriageStatusUpdate: function(eventName, data) {
        $('.show-our-room-upsell').remove();
        $('.chatroom[chatroomtype="OurRoom"]').parent().remove();
        if (data.marriageStatus) {
            var tile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomOurRoom, {
                roomInfo:{},
                eventBus: this.eventBus
            });
            this.$privateRooms.append(tile.$tile);
        } else {
            var tile = this.createUpsellTile('show-our-room-upsell', function() {
                this.imvu.call('showOurRoomInfo');
            }.bind(this));
            this.$privateRooms.append(tile.$tile);
        }
        
    },
     
    $: function(selector) { 
        return this.$root.find(selector);
    },

    reloadMyPublicRooms: function() {
        console.log('reloading');
        this.$publicRooms.find('.tile').remove();
        this.loadMyPublicRooms();
    },

    loadMyPublicRooms: function() {
        serviceRequest({
            method: 'GET',
            uri: IMVU.SERVICE_DOMAIN + '/api/room_management_info.php',
            data: null,
            network: this.network,
            imvu: this.imvu,
            callback: this.populateMyPublicRooms.bind(this)
        });
    },
    setupScrollPane: function() { 
        this.$window.bind('myrooms-resize',this.resizeScrollPane.bind(this));
    },
    resizeScrollPane: function() { 
        var offset = this.$scrollable.offset();
        var windowHeight = this.$window.height();
        this.$scrollable.height(windowHeight-offset.top);

        var windowWidth = this.$window.width() - 35;
        var marginRight = windowWidth % 345 + 9;
        this.$scrollable.css('margin-right', marginRight + "px");
        this.$scrollable.trigger('scroll');
    },

    update_subscriptions: function() {
        this.imvu.call('clobberRoomOccupancySubscriptions',this.currentSubscriptions);
    },

    refreshUI: function() {
        this.resizeScrollPane();
    },

    onActivate: function(tabName) {
        this.update_subscriptions();
        this.refreshUI();
        this.viewWidget.hideFilterButton();
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

    createUpsellTile: function(upsellType, buttonCallback) {
        var $tile = this.$tileTemplate.clone();
        $tile.removeAttr('id');
        var tile = new Tile({
            type: upsellType,
            tile: $tile,
            buttonCallback: buttonCallback
        });
        return tile;
    },

    populateMyPublicRooms: function(result, error) {
        if (error) {
            this.imvu.call('showErrorDialog', _T("Manage Error"), _T("We are currently experiencing problems returning your chat room information.  Please check your network connection and try again."));
            console.log("Failed to load management info.");
            return;
        }
        var rooms = result.result.rooms,
            manageInfo = result.result;
        this.createRoomLimit = result.result.limit;
        var rooms = result.result.rooms;
        var manageInfo = result.result;
        this.manageInfo = manageInfo;
        this.currentSubscriptions = [];
        _.each(rooms, function(roomInfo, index) { 
            if (index < this.createRoomLimit) {
                var tile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomManage, {
                    roomInfo:roomInfo,
                    manageInfo: manageInfo,
                    imvu: this.imvu,
                    network:this.network
                });
                this.$publicRooms.append(tile.$tile);
            }
            if (!_.contains(this.currentSubscriptions, roomInfo.room_instance_id)){
                this.currentSubscriptions.push(roomInfo.room_instance_id);
            }
        }.bind(this));
        this.makeCreateRoomOrUpsell(rooms.length);
        this.update_subscriptions();
        this.resizeScrollPane();

        this.reloadSharedRoomTiles();
    },

    canCreateAnotherRoom: function(numRooms) { 
        if (numRooms < this.createRoomLimit) {
            return true;
        } else {
            return false;
        }
    },

    makeCreateRoomOrUpsell: function(numRooms) {
        var isVip = this.imvu.call('isVip');
        if (this.canCreateAnotherRoom(numRooms)) {
            var tile = this.createCreateRoomTile();
            this.$publicRooms.append(tile.$tile);
        } else {
            if (!isVip) {
                var tile = this.createUpsellTile('show-vip-upsell', function() {
                    this.imvu.call('showVipInfo', 'chatrooms');
                }.bind(this));

                tile.$tile.addClass("room-slots-rollout-enabled");

                this.$publicRooms.append(tile.$tile);
            }
            this.createChatRoomSlotsUpsellTile();
        }
    },

    createCreateRoomTile: function() { 
        return this.createUpsellTile('create-room', function() {
            var height = $(window).height();
            var roomInfo = this.imvu.call('showManageRoomCard', { info: this.manageInfo, height:height });
            if(!roomInfo) {
                return;
            }
            var tile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomManage, {
                roomInfo:roomInfo,
                manageInfo: this.manageInfo,
                imvu: this.imvu,
                network:this.network
            });
            var $publicRooms = this.$publicRooms.find('.tile.chat-room');
            $('.tile.create-room').remove();
            $('.tile.show-vip-upsell').remove();
            this.makeCreateRoomOrUpsell($publicRooms.length+1);
            if($publicRooms.length > 0) { 
                $publicRooms.first().before(tile.$tile);
            } else { 
                this.$publicRooms.append(tile.$tile);
            }
            console.log('adding tile');
            this.resizeScrollPane();
        }.bind(this));
    },

    updateCreateRoomOrUpsell: function() { 
        var $publicRooms = this.$publicRooms.find('.tile.chat-room');
        if(this.canCreateAnotherRoom($publicRooms.length)) {
            if(this.$('.tile.create-room').length ==0) {
                var tile = this.createCreateRoomTile();
                this.$publicRooms.find('.tile').first().before(tile.$tile);
            }
        }
    },

    createMyRoomTile: function() {
        var tile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomMyRoom, {
            roomInfo:{},
            eventBus: this.eventBus
        });
        this.$privateRooms.append(tile.$tile);
    },

    createMarriageTile: function() {
        if(this.imvu.call('isMarried')) {
            var tile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomOurRoom, {
                roomInfo:{},
                eventBus: this.eventBus
            });
            this.$privateRooms.append(tile.$tile);
        } else if (!this.imvu.call('isTeen')) {
            var tile = this.createUpsellTile('show-our-room-upsell', function() {
                this.imvu.call('showOurRoomInfo');
            }.bind(this));
            this.$privateRooms.append(tile.$tile);
        }
    },

    createChatRoomSlotsUpsellTile: function() {
        var tile = this.createUpsellTile('show-chat-room-slots-upsell', function() {
            this.imvu.call('showChatRoomSlotsInfo');
        }.bind(this));

        this.$publicRooms.append(tile.$tile);
    },
    
    createSharedRoomUpsellTile: function() {
        var tile = this.createUpsellTile('show-shared-room-upsell', function() {
            this.imvu.call('showSharedRoomInfo');
        }.bind(this));
        this.$privateRooms.append(tile.$tile);
    },

    createSharedRoomTiles: function() {
        //get shared rooms
        var rooms = this.imvu.call('getSharedRooms');

        //for each shared room
        _.each(rooms, function (room) {
            var tile = this.createChatRoomTile(IMVU.Client.widget.ChatRoomSharedRoom, {
                roomInfo: room,
                manageInfo: this.manageInfo,
                eventBus: this.eventBus,
                imvu: this.imvu
            });
            this.$privateRooms.append(tile.$tile);
        }.bind(this));
    },

    reloadSharedRoomTiles: function() {
        this.$privateRooms.find(".chatroom[chatroomtype='SharedRoom']").parent().remove();
        this.createSharedRoomTiles();
    },
}

IMVU.Client.widget.ChatRoom_deprecated = function (args) {
    this.occupancy = args.occupancy || {};
    var room = args.room || {};
    var info = args.info || {};
    this.roomInstance = room.cid + '-' + room.roomId;
    this.eventBus = args.eventBus || null;
    this.$root = $(args.root);

    this.imvu = args.imvu;
    this.network = args.network;
    this.util = new RoomUtil({network: this.network, imvu: this.imvu});

    this.$roomPanel = this.$root.find('.room.panel');
    this.$root.toggleClass('full', this.isFull());
    this.$root.toggleClass('favorite', !!room.favorite);
    this.$root.toggleClass('manage', (args.panel == 'room-manage'));
    this.$root.toggleClass('locked', (args.panel == 'room-locked'));
    this.$root.toggleClass('null_upsell_locked', (args.panel == 'room-null-upsell'));
    this.is_upsell = (args.panel && args.panel == 'room-null-upsell');

    this.$infoIcon = this.$root.find('.info.icon');
    this.$flagIcon = this.$root.find('.flag.icon');
    var current_user = this.imvu.call('getCustomerId');
    if (room.cid != current_user) {
        this.$flagIcon.bind('click', function() {
            var configVar = this.imvu.call('getImvuConfigVariable', 'client.roomcard_flagging');
            if (configVar == '1') {
                dialogInfo = {
                    'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
                    'service_url': '/api/flag_content/flag_publicroom.php',
                    'title':_T('Flag ') + '"' + args.name + '"',
                    'post_data': {
                        'room_instance_id': this.roomInstance
                    },
                    'get_reasons_from_server': {
                        'content_type': 'publicroom',
                        'content_id': this.roomInstance
                    },
                    'message': _T('Please tell us what you find inappropriate about this chat room. For your reference, you can find our Terms of Service') + '<a id="tos" href="http://www.imvu.com/catalog/web_info.php?section=Info&topic=terms_of_service"> ' + _T('here') + ':</a>'
                };
                this.imvu.call('showModalFlaggingDialog', dialogInfo);
            } else {
                dialogInfo = {
                    'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
                    'service_url': '/api/flag_content/flag_publicroom.php',
                    'title':_T('Flag ') + '"' + args.name + '"',
                    'post_data': {
                        'room_instance_id': this.roomInstance,
                        'flag_type': 'photo'
                    },
                    'message': _T('This room photo will be submitted to IMVU customer service for review.')
                };
                this.imvu.call('showModalFlaggingDialog', dialogInfo);
            }
        }.bind(this));
    } else {
        this.$flagIcon.hide().removeClass('flag').removeClass('icon');
        this.$infoIcon.css('margin-left', '4px');
    }

    this.$apIcon = this.$root.find('.ap.icon');
    this.$apIcon.toggle(!!room.ap);
    this.$apIcon.bind('click', function () {
        this.imvu.call('showApInfo');
    }.bind(this));

    this.$vipIcon = this.$root.find('.vip.icon');
    this.$vipIcon.toggle(!!room.vip);
    this.$vipIcon.bind('click', function () {
        this.imvu.call('showVipInfo');
    }.bind(this));

    this.$avIcon = this.$root.find('.av.icon');
    this.$avIcon.toggle(!!room.av);

    this.$bd = this.$root.find('.bd');
    this.$ft = this.$root.find('.room .ft');

    var thumbnail = args.thumbnail;
    if (typeof(thumbnail) == 'undefined' || thumbnail == "") {
        thumbnail = 'http://userimages.imvu.com/imvufiles/rooms/image/default_205.png';
    }
    this.$thumbnail = this.$root.find('.thumbnail');
    this.$clickToSeeCard = this.$root.find('div.click-to-see-card');
    this.$clickToSeeCard.attr('data-ui-roomInstanceId', this.roomInstance);
    this.$thumbnail.attr('src', thumbnail);

    this.$infoSection = this.$root.find('.room .info.section');

    this.$name = this.$infoSection.find('.name');
    this.$name.text(args.name);

    var owner = args.owner || {};
    this.$owner = this.$infoSection.find('.owner-name');
    this.$owner.text(owner.name);

    if (!this.is_upsell) {
        this.$owner.bind('click', function (event) {
            this.imvu.call('showAvatarCard', owner.cid, {avname: owner.name});
            event.stopPropagation();
        }.bind(this));
    }

    this.$language = this.$infoSection.find('.language-in-use');
    this.$language.text(args.language);

    if (args.info && args.info.rating > 0) {
        this.hearts = new IMVU.Client.widget.Hearts({$root: this.$root.find('.hearts'), type: 'SmallStar', fill: args.info.rating, max: 5});
        this.$root.find('.hearts').show();
    }

    this.$occupancy = this.$infoSection.find('.occupancy');
    this.$visitors = this.$infoSection.find('.visitor');

    this.$infoButton = this.$ft.find('.info.button');
    this.$infoButton.attr('data-ui-roomInstanceId', this.roomInstance);
    this.$goButton = this.$ft.find('.go.button');
    this.$goButton.attr('data-ui-roomInstanceId', this.roomInstance);
    this.$goButton.bind('click', function (index, value) {
        if (room.vip && !this.imvu.call('hasVIPPass')) {
            this.imvu.call('showVipInfo');
        } else if (!this.isFull()) {
            this.imvu.call('joinPublicRoom', this.roomInstance);
        }
    }.bind(this));
    this.$deleteButton = this.$ft.find('.delete.button');
    this.$deleteButton.attr('data-ui-roomInstanceId', this.roomInstance);
    this.$deleteButton.bind('click', function (index, value) {
        result = this.imvu.call('showYesNoDialog', _T("Confirm room removal"), _T("You are about to delete your chat room. Do you still want to proceed?"));
        if(result && result['result']) {
            this.deleteRoom();
        }
    }.bind(this));
    this.$editButton = this.$ft.find('.edit.button');
    this.$editButton.attr('data-ui-roomInstanceId', this.roomInstance);
    this.$editButton.unbind('click').bind('click', function () {
        var height = $(window).height();
        var doCall = this.imvu.call; // this is dumb. But we have a really dumb bug involving all this, and this might maybe fix.
        var response = doCall('showManageRoomCard', { info: args.managementinfo, room: args.info, height:height });
        if(response) this.$root.trigger('roomUpdated', response);
    }.bind(this));

    this.updateOccupancy(this.occupancy.participants);
    var $info_elems = this.$clickToSeeCard
        .add(this.$infoSection)
        .add(this.$infoIcon)
        .add(this.$infoButton);

    if (!this.is_upsell) {
        $info_elems
            .bind('click', function () {
                this.imvu.call('showRoomCardWithInfo', info);
            }.bind(this));
    }

    this.$favorite = this.$bd.find('.favorite');
    this.$favorite.bind('click', function (event) {
        var isFavorite = this.$root.is('.favorite'),
            onComplete = function (response) {
                if (!response.ok) {
                    this.$favorite.text(isFavorite ? _T('remove favorite') : _T('add to favorites'));

                    var error = this.util.getFriendlyErrorDialogMessage(response.reason);
                    this.imvu.call('showErrorDialog', error.title, error.message);
                } else {
                    if(isFavorite) {
                        this.eventBus.fire('RemoveFavorite', {'roomId': this.roomInstance});
                    } else {
                        this.eventBus.fire('AddFavorite', {'roomId': this.roomInstance});
                    }
                }
            };
        this.util[isFavorite ? 'removeFavorite' : 'addFavorite'](this.roomInstance, onComplete.bind(this));
        event.stopPropagation();
    }.bind(this));

    this.eventBus.register('AddFavorite', function (eventName, data) {
           var isFavorite = this.$root.is('.favorite');
        if(data.roomId == this.roomInstance && !isFavorite) {
            this.$root.addClass('favorite');
            this.$favorite.text(_T('remove favorite'));
            info.is_favorite = true;
        }
    }.bind(this));

    this.eventBus.register('RemoveFavorite', function (eventName, data) {
           var isFavorite = this.$root.is('.favorite');
        if(data.roomId == this.roomInstance && isFavorite) {
            this.$root.removeClass('favorite');
            this.$favorite.text(_T('add to favorites'));
            info.is_favorite = false;
        }
    }.bind(this));

    if (room.favorite) {
        this.$favorite.text(_T('remove favorite'));
    }

    this.$newUnderlay = this.$root.find('.new-underlay');
    this.$lockOverlay = this.$root.find('.lock-overlay.panel');

    this.$vipCreatePanel = this.$root.find('.vip-create.panel');
    this.$vipCreateRoomButton = this.$vipCreatePanel.find('.create-room-button');
    new ImvuButton(this.$vipCreateRoomButton);
    var createRoom = function () {
        var height = $(window).height();
        var doCall = this.imvu.call; // this is dumb. But we have a really dumb bug involving all this, and this might maybe fix.
        var response = doCall('showManageRoomCard', { info: args.managementinfo, height:height });
        if(response) this.$root.trigger('roomCreated', response);
    }.bind(this);
    this.$vipCreateRoomButton.unbind('click').bind('click', createRoom);

    this.$vipAvailablePanel = this.$root.find('.vip-available.panel');

    this.$freeCreatePanel = this.$root.find('.free-create.panel');
    this.$freeCreateRoomButton = this.$freeCreatePanel.find('.create-room-button');
    new ImvuButton(this.$freeCreateRoomButton);
    this.$freeCreateRoomButton.unbind('click').bind('click', createRoom);
    
    this.$chatroomSlotUpsellPanel = this.$root.find('.chatroom-slot-upsell.panel');
    this.$chatroomSlotUpsellButton = this.$chatroomSlotUpsellPanel.find('.cta-button');
    new ImvuButton(this.$chatroomSlotUpsellButton);

    this.$freeUnavailablePanel = this.$root.find('.free-unavailable.panel');

    this.$panels = this.$root.find('.panel');
    this.$panels.hide();

    if (!args.panel) {
        args.panel = 'room';
    }

    switch (args.panel) {
        case 'room-null-upsell':
            this.$favorite.remove();
            this.$infoButton.remove();
            this.$goButton.remove();
            this.$apIcon.unbind('click');
            this.$bd.bind('click', function () {
                this.imvu.call('showApInfo');
                return false;
            }.bind(this));
        case 'room':
            this.$ft.find('.edit').remove();
            this.$ft.find('.delete').remove();
            this.$roomPanel.show();
            break;
        case 'room-manage':
            this.$ft.find('.info').remove();
            if (args.info && args.info.visitor_count) {
                this.$visitors.text(_T('Visitors') + ": " + args.info.visitor_count);
            }
            this.$roomPanel.show();
            break;
        case 'room-locked':
            this.$ft.children().remove();
            this.$root.find('.icon').hide();
            this.$root.bind('click', function() {
                this.imvu.call('showVipInfo', 'chatrooms');
            }.bind(this));
            this.$roomPanel.show();
            this.$lockOverlay.show();
            break;
        case 'vip-create':
            this.$vipCreatePanel.show();
            break;
        case 'vip-available':
            this.$vipAvailablePanel.show();
            break;
        case 'free-create':
            this.$freeCreatePanel.show();
            break;
        case 'free-unavailable':
            this.$freeUnavailablePanel.show();
            this.$root.bind('click', function () {
                this.imvu.call('showVipInfo', 'chatrooms');
            }.bind(this));
            break;
        case 'chatroom-slot-upsell':
            this.$ft.children().remove();
            this.$roomPanel.show();
            this.$chatroomSlotUpsellPanel.show();
            this.$root.bind('click', function () {
                this.imvu.call('showChatRoomSlotsInfo');
            }.bind(this));
            break;
    }

    if(args.highlight) this.highlight(args.highlight);
}

IMVU.Client.widget.ChatRoom_deprecated.prototype = {
    isFull: function () {
        if(this.$root.is(".manage")) return false;
        return this.occupancy.participants >= this.occupancy.maximum;
    },

    updateOccupancy: function(occupancy) {
        var shouldFade = occupancy != this.occupancy.participants;
        this.occupancy.participants = occupancy;
        this.$root.toggleClass('full', this.isFull());
        if(this.isFull()) {
            this.$goButton.text('Full');
        } else {
            this.$goButton.text('Go');
        }
        if(shouldFade) {
            this.$occupancy.find('.participants').fadeOut(0);
        }
        this.$occupancy.find('.participants').text(this.occupancy.participants);
        this.$occupancy.find('.maximum').text(this.occupancy.maximum);
        if(shouldFade) {
            this.$occupancy.find('.participants').fadeIn(1000);
        }

    },

    deleteRoom: function() {
        serviceRequest({
            method: 'POST',
            uri: IMVU.SERVICE_DOMAIN + '/api/room_management.php',
            data: { 'action' : 'delete', 'room_instance_id': this.roomInstance },
            network: this.network,
            imvu: this.imvu,
            callback: function(result, error) {
                if (error){
                    // TODO: need an error message to tell the user that the delete failed.
                } else {
                    this.$root.trigger('roomDeleted');
                }
            }.bind(this)
        });
    },

    highlight: function(type) {
        switch (type) {
            case 'new':
                this.$root.addClass('highlight-new');
                this.$newUnderlay.css('opacity', 0);
                this.$newUnderlay.animate({'opacity': 1}, 250).animate({'opacity': 0}, 250).animate({'opacity':1}, 250).animate({'opacity': 0}, 250).animate({'opacity':1}, 250).delay(5000).animate({'opacity':0},2000);
                break;
            default:
                // do nothing
                break;
        }
    }
}

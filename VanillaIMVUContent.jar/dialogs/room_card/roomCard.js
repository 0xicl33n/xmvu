var RoomCard = function(roomInfo, imvu, net) {
    this.roomInfo = roomInfo;
    this.isFavorite = false;
    this.imvu = imvu;
    this.net = net;

    this.showAvatarCardForRoomOwner = function() {
        this.showAvatarCard(roomInfo.owner_cid, {avname:roomInfo.owner});
    };

    if (!roomInfo) {
        return;
    }

    this.util = new RoomUtil({network: this.net, imvu: this.imvu});

    this.hideGoButton = roomInfo.hideGoButton;
    this.ownerCid = roomInfo.owner_cid;
    this.roomInstanceId = roomInfo.roomInstanceId;
    this.roomName = roomInfo.name;
    $('#close_button').click(this.endRoomCard.bind(this, false));
    onEscKeypress(this.endRoomCard.bind(this, false));

    this.bindOrHideFlagLink();
    $('#favorite-button').bind('click', this.onFavoriteButtonClicked.bind(this));
    $('#owner-name').bind('click', this.showAvatarCardForRoomOwner.bind(this));

    $('#go').bind('click', this.endRoomCard.bind(this, true));
    $('#roomfull').bind('click', this.endRoomCard.bind(this, false));
    $('#roomfull').hide();

    $('#vip-logo').bind('click', function () { this.imvu.call('showVipInfo'); }.bind(this));
    $('#ap-logo').bind('click', function () { this.imvu.call('showApInfo'); }.bind(this));
    $('#room-title').html(roomInfo.name);
    $('#owner-name').text(roomInfo.owner);
    $('#description-body').html((roomInfo.description !== '') ? roomInfo.description : _T("No description available."));
    if (roomInfo.imageUrl){
        $('#room-image').append($('<img/>').attr('src', roomInfo.imageUrl));
    } else {
        $('#room-image').append($('<img/>').attr('src', "http://userimages.imvu.com/imvufiles/rooms/image/default_245.png"));
    }
    $('#language-name').text(roomInfo.language);

    this.configureOccupancy(roomInfo);
    if (roomInfo.isAP){
        $('#ap-logo').show();
    } else {
        $('#ap-logo').hide();
    }
    if (roomInfo.isVIP){
        $('#vip-logo').show();
    } else {
        $('#vip-logo').hide();
    }
    if (roomInfo.isAV){
        $('#av-logo').show();
    } else {
        $('#av-logo').hide();
    }

    if (roomInfo.showFavorite == false) {
        $('#favorite-button').hide();
    } else {
        $('#favorite-button').show();
    }
    this.isFavorite = roomInfo.isFavorite;
    this.configureFavorite();
    if (roomInfo.hideGoButton) {
        $('#go').hide();
        $('#roomFull').hide();
    }

    if (typeof(roomInfo.rating) != 'undefined' && parseInt(roomInfo.rating)) {
        this.ratingHeartsWidget = new IMVU.Client.widget.Hearts({
            'root': '#rating-label #rating-icons',
            'fill': roomInfo.rating,
            'max': 5,
            'type': 'SmallStar'
        });
        $('#rating-label').show();
    } else {
        $('#rating-label').hide();
    }

    if (roomInfo.description === '') {
        var dialogHeight,
            descriptionHeight = $('#description').outerHeight(true);
        $('#description').hide();
        dialogHeight = $('body').outerHeight(true);
        this.imvu.call('resize', $('body').outerWidth(true), dialogHeight - descriptionHeight + 20);
    }
    serviceRequest({
        method: 'GET',
        uri: '/api/rooms/room_info.php?room_id=' + this.roomInstanceId,
        network: this.net,
        imvu: this.imvu,
        json: true,
        callback: this.updateOccupancy.bind(this)
    })
};

RoomCard.prototype = {
    configureFavorite : function(){
        if (this.isFavorite){
            $('#favorite-button').addClass('is-favorite');
            $('#favorite-button').text(_T("Remove from favorites"));
        } else {
            $('#favorite-button').removeClass('is-favorite');
            $('#favorite-button').text(_T("Add to favorites"));
        }
    },

    showAvatarCard: function(cid, starting_info) {
        var extra_args = {suppressChatButtons: true};
        this.imvu.call('showAvatarCard', cid, starting_info, extra_args);
    },

    bindOrHideFlagLink: function() {
        if (this.roomInfo.enableFlagging !== false && this.ownerCid != this.imvu.call('getCustomerId')) {
            $('#safety-button').bind('click', this.showSafetyDialog.bind(this));
        } else {
            $('#safety-button').hide();
        }
    },

    configureOccupancy: function(roomInfo) {
        var occupantList = $('#occupants-list');
        for(var i = 0; i < roomInfo.maxOccupancy; i++) {
            var item = $('<div class="occupant"></div>');
            item.text('');
            occupantList.append(item);
        }
        this.updateFullness(0, roomInfo.maxOccupancy);
    },

    updateFullness: function(participants, max) {
        $('#fullness-label').text(participants + ' / ' + max);
        if(participants >= max && !this.hideGoButton) {
            $('#go').hide();
            $('#roomfull').show();
        } else if (!this.hideGoButton) {
            $('#go').show();
            $('#roomfull').hide();
        }
    },

    updateOccupancy: function(results, error) {
        $('#occupants-list .occupant-list-spinner').hide();
        if (error) {
            IMVU.Client.widget.showAlert(_T('IMVU Error'), _T('There was an error retrieving information for the room card.  Please try again later.'), this.imvu);
        } else {
            var occupantList = $('#occupants-list');
            var occupantItems = occupantList.children('.occupant');
            var foundFriends = false;
            var index = 0;
            results.participants = _.sortBy(results.participants, function(participant) {
                return participant.avatar_name.toUpperCase();
            });
            for (var i in results.participants) {
                var participant = results.participants[index],
                    cid = parseInt(participant.customers_id, 10);
                var item;

                if (index < occupantItems.length) {
                    item = $(occupantItems[index]);
                } else {
                    item = $('<div class="occupant"></div>');
                    item.text('');
                    occupantList.append(item);
                }

                if (participant.is_friend) {
                    item.append($('<img class="friendIcon" src="../../chat_rooms/img/icon_friend_online.png"/>'));
                    item.addClass('friend');
                    foundFriends = true;
                }

                item.append($('<img class="flag"/>').attr('src', '../../img/flags/'+ participant.country +'.gif'));

                var name = $('<span class="name"/></name>');
                name.text(participant.avatar_name);
                name.bind('click', function (c, p) {
                    this.showAvatarCard(c, {
                        avname: p.avatar_name,
                        country_code: p.country
                    });
                }.bind(this, cid, participant));
                item.append(name);

                var gender = $('<span class="gender"></span>');
                gender.text(participant.gender ? (participant.gender == 'm' ? _T("male") : _T("female")): _T("hidden"));
                item.append(gender);

                var age = $('<span class="age"></span>');
                age.text(participant.age);
                item.append(age);

                var size = $('<span class="speed"></span>');
                size.text(IMVU.Client.util.number_format(parseInt(participant.avatar_download_size * 0.001, 10)) + ' kb');
                item.append(size);

                var friendStatus = $('<span class="add-friend"></span>');
                friendStatus.text(participant.is_friend ? _T("already friended") : _T("add as friend"));
                if (!participant.is_friend && (cid != this.imvu.call('getCustomerId')) && (this.imvu.call('getBuddyType', cid) != "INVITE_SENT")) {
                    friendStatus.addClass('not_friended');
                    friendStatus.bind('click', function (fs, c) {
                        this.imvu.call('addBuddy', c, 'client roomcard');
                        fs.removeClass('not_friended');
                        this.imvu.call('recordFact', 'Friend Added (client, r:roomcard)', {'owner_cid': this.imvu.call('getCustomerId')});
                    }.bind(this, friendStatus, cid));
                }
                item.append(friendStatus);

                index++;
            }
            if (foundFriends){
                $('#occupants-friend-notice').addClass('found-friend');
            }
            $('.add-friend').each(function() {
                $(this).width(parseInt($(this)[0].clientWidth));
                $(this).width(parseInt($(this).width()) + 24);
            });
            this.roomInfo.num_participants = index;
            this.updateFullness(index, results.max_users);
        }
    },

    showSafetyDialog: function() {
        var configVar = this.imvu.call('getImvuConfigVariable', 'client.roomcard_flagging');
        if (configVar == '1') {
            dialogInfo = {
                'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
                'service_url': '/api/flag_content/flag_publicroom.php',
                'title':_T('Flag ') + '"' + this.roomName + '"',
                'post_data': {
                    'room_instance_id': this.roomInstanceId,
                    'flag_type':''
                },
                'get_reasons_from_server': {
                    'content_type': 'publicroom',
                    'content_id': this.roomInstanceId
                },
                'message': _T('Please tell us what you find inappropriate about this chat room. For your reference, you can find our Terms of Service') + '<a id="tos" href="http://www.imvu.com/catalog/web_info.php?section=Info&topic=terms_of_service"> ' + _T('here') + ':</a>'
            };
            this.imvu.call('showModalFlaggingDialog', dialogInfo);
        } else {
            dialogInfo = {
                'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
                'service_url': '/api/flag_content/flag_publicroom.php',
                'title':_T('Flag ') + '"' + this.roomName + '"',
                'post_data': {
                    'room_instance_id': this.roomInstanceId,
                    'flag_type': 'photo'
                },
                'message': _T('This room photo will be submitted to IMVU customer service for review.')
            };
            this.imvu.call('showModalFlaggingDialog', dialogInfo);
        }
    },

    onFavoriteButtonClicked: function(e, args){
        var self = this;

        function toggleIcon() {
            self.isFavorite = !self.isFavorite;
            self.configureFavorite();
        }

        var self = this;
        function onComplete(response) {
            if (!response.ok) {
                toggleIcon(); // undo
                var titelAndMessage = this.util.getFriendlyErrorDialogMessage(response.reason);
                this.imvu.call('showErrorDialog', titelAndMessage.title, titelAndMessage.message);
            }
            if(this.isFavorite) {
                IMVU.Client.EventBus.fire('AddFavorite',{'roomId':this.roomInstanceId});
            } else {
                IMVU.Client.EventBus.fire('RemoveFavorite',{'roomId':this.roomInstanceId});
            }
        }

        toggleIcon(); // optimistic
        this.util[this.isFavorite ? 'addFavorite' : 'removeFavorite'](this.roomInstanceId, onComplete.bind(this), this.net, this.imvu.call);
    },

    endRoomCard : function(shouldJoin) {
        this.imvu.call('endDialog', {'shouldJoin':shouldJoin, 'isFavorite':this.isFavorite});
    }
};

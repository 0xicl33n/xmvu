IMVU.Client.widget.ChatRoomManage = function(args) {
    this.imvu = args.imvu;
    this.manageInfo = args.manageInfo;
    args.roomInfo.customers_name = this.imvu.call('getAvatarName');
    this.network = args.network;
    args.tabName = 'MyRooms';
    $.extend(this, new IMVU.Client.widget.ChatRoom(args))
    this.$root.attr('chatroomtype','ChatRoomManage');
    this.$root.attr('data-ui-room-type','ChatRoomManage');
    this.setUpView();
    this._bindListeners();
    this.delayShowVisitors();
}

IMVU.Client.widget.ChatRoomManage.prototype = Object.create(IMVU.Client.widget.ChatRoom.prototype);
$.extend(IMVU.Client.widget.ChatRoomManage.prototype,{
    setUpView: function() { 
        this.$('button.edit').show();
        this.$('button.delete').show();
        this.$flagButton.hide();
        var $visitors = this.$('.visitors').css({
            'margin-top': -2,
            'visibility':'visible',
            'opacity':0,
            'padding-bottom': 4,
            'height':13
        });
        this.$('.count').text(this.roomInfo.visitor_count);
        this.$occupancyBubble.show();
    },
    delayShowVisitors: function() { 
        this.animationQueueFactory = new AnimationQueueFactory({ 
            animationQueue: this.fillPoolAnimation
        });
        this.animationQueueFactory.goToState(0)
            .animateTo('.visitors', {
                'opacity': 1
            })
            .finish();
    },
    editRoom: function(e) {
        var height = $(window).height();
        var roomInfo = $.extend({},this.roomInfo);
        delete roomInfo['isFull']; 
        roomInfo.language = IMVU.Client.widget.ChatRoom.languageLookup[roomInfo.language];
        //Do not pass functions as arguments to imvu.calls. Unhappiness will ensue
        var manageRoomParams = { 
            info: this.manageInfo, 
            room: roomInfo, 
            height: height 
        };
        var updatedRoomInfo = this.imvu.call('showManageRoomCard', manageRoomParams);


        if(updatedRoomInfo) {
            $.extend(this.roomInfo, updatedRoomInfo);
            this.loadRoomInfo();
        }
        e.stopPropagation();
    },
    _bindListeners: function() { 
        this.$('button.edit').click(this.editRoom.bind(this));
        this.$('button.delete').click(this.deleteRoom.bind(this));
        this.removeHoverOnMouseleave();
    },

    deleteRoom: function(e) { 
        var result = this.imvu.call('showYesNoDialog', _T("Confirm room removal"), _T("You are about to delete your chat room. Do you want to proceed?"));

        if(result && result['result']) {
            serviceRequest({
                method: 'POST',
                uri: IMVU.SERVICE_DOMAIN + '/api/room_management.php',
                data: { 'action' : 'delete', 'room_instance_id': this.roomInfo.room_instance_id },
                network: this.network,
                imvu: this.imvu,
                callback: function(result, error) {
                    if (error){
                        this.imvu.call(
                            'showErrorDialog',
                            _T('Network Error'),
                            _T('We were unable to delete your room.')
                        );
                    } else {
                        var $publicRooms = this.$root.parents('.public-rooms');
                        this.$root.parents('.tile.chat-room').remove();
                        $publicRooms.trigger('chatRoomDeleted');
                    }
                }.bind(this)
            });
            e.stopPropagation();
        }
    }
});

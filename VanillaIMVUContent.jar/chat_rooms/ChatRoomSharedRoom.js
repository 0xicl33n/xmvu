IMVU.Client.widget.ChatRoomSharedRoom = function(args) {
    this.eventBus = args.eventBus;
    this.imvu = args.imvu;
    args.roomInfo.image_url = 'img/default_room_sharedroom.jpg';
    args.tabName = 'MyRooms';
    $.extend(this, new IMVU.Client.widget.ChatRoom(args))
    this.setUpView();

    this.roomInfo = args.roomInfo;
    this.manageInfo = args.manageInfo;

    this.$goButton.click(function() {
        this.imvu.call('joinPublicRoom', this.roomInfo.id);
    }.bind(this));

    this.$editButton.click(function(e) {
        this.editRoom(e);
    }.bind(this));

    this.$cloneButton.click(function(e) {
        this.cloneRoom(e);
    }.bind(this));

    this.removeHoverOnMouseleave();

    this.$roomName.html(this.roomInfo.name);
    ellipsize(this.$roomName, 210);
}

IMVU.Client.widget.ChatRoomSharedRoom.prototype = Object.create(IMVU.Client.widget.ChatRoom.prototype);
$.extend(IMVU.Client.widget.ChatRoomSharedRoom.prototype,{
    setUpView: function() {
        this.$occupancyBubble.hide();
        this.$starRating.hide();
        this.$root.attr('chatroomtype','SharedRoom');
        this.$pool.addClass('no-subtitle');
        this.$infoButton.hide();
        this.$flagButton.hide();
        this.$description.hide();
        this.$editButton.hide();
        this.$cloneButton.hide();
    },

    editRoom: function(e) {
        this.imvu.call('gotoSharedRoomsPage');
        e.stopPropagation();
    },

    cloneRoom: function(e) {
        var height = $(window).height();
        var manageInfo = _.clone(this.manageInfo);
        manageInfo.sharedRoomToSelect = this.roomInfo.id;
        var manageRoomParams = {
            info: manageInfo,
            //room: roomInfo,
            height: height,
        };
        var newRoomInfo = this.imvu.call('showManageRoomCard', manageRoomParams);
        e.stopPropagation();
    },
});
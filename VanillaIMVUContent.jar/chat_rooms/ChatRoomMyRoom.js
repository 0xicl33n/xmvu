IMVU.Client.widget.ChatRoomMyRoom = function(args) {
    this.eventBus = args.eventBus;
    args.roomInfo.name = _T('My Room');    
    args.roomInfo.image_url = 'img/default_room_myroom.png';
    args.tabName = 'MyRooms';
    $.extend(this, new IMVU.Client.widget.ChatRoom(args))
    this.setUpView();

    this.$root.click(function() {
        this.eventBus.fire('HomeMode.MyRoomClicked');
    }.bind(this));

    this.removeHoverOnMouseleave();
}

IMVU.Client.widget.ChatRoomMyRoom.prototype = Object.create(IMVU.Client.widget.ChatRoom.prototype);
$.extend(IMVU.Client.widget.ChatRoomMyRoom.prototype,{
    setUpView: function() {
        this.$occupancyBubble.hide();
        this.$starRating.hide();
        this.$root.attr('chatroomtype','MyRoom');
        this.$root.attr('data-ui-room-type','MyRoom');
        this.$pool.addClass('no-subtitle');
        this.$infoButton.hide();
        this.$flagButton.hide();
        this.$description.hide();
    }
});
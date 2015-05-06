IMVU.Client.widget.ChatRoomOurRoom = function(args) {
    this.eventBus = args.eventBus;
    args.roomInfo.name = _T('Our Room');    
    args.roomInfo.image_url = 'img/default_room_ourroom.png';
    args.tabName = 'MyRooms';
    $.extend(this, new IMVU.Client.widget.ChatRoom(args))
    this.setUpView();

    this.removeHoverOnMouseleave();
    
    this.$root.click(function() {
        this.eventBus.fire('HomeMode.OurRoomClicked');
    }.bind(this));
}

IMVU.Client.widget.ChatRoomOurRoom.prototype = Object.create(IMVU.Client.widget.ChatRoom.prototype);
$.extend(IMVU.Client.widget.ChatRoomOurRoom.prototype,{
    setUpView: function() {
        this.$occupancyBubble.hide();
        this.$starRating.hide();
        this.$root.attr('chatroomtype','OurRoom');
        this.$pool.addClass('no-subtitle');
        this.$infoButton.hide();
        this.$flagButton.hide();
        this.$description.hide();
    }
});
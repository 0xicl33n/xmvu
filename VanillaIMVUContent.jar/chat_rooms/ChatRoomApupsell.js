IMVU.Client.widget.ChatRoomApUpsell = function(args) {
    args.roomInfo.is_ap = 1;
    $.extend(this, new IMVU.Client.widget.ChatRoom(args))
    this.setUpView();
}

IMVU.Client.widget.ChatRoomApUpsell.prototype = Object.create(IMVU.Client.widget.ChatRoom.prototype);
$.extend(IMVU.Client.widget.ChatRoomApUpsell.prototype,{
    setUpView: function() {
    },
});
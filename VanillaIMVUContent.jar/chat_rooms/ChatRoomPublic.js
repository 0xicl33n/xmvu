IMVU.Client.widget.ChatRoomPublic = function(args) {
    if(_.isUndefined(args.loadOccupantsOnHover)) args.loadOccupantsOnHover = true;

    $.extend(this, new IMVU.Client.widget.ChatRoom(args))
    this.setUpView();
    if(args.loadOccupantsOnHover) { 
        this.loadOccupantsOnHover();
    }

    this.removeHoverOnMouseleave();
}

IMVU.Client.widget.ChatRoomPublic.prototype = Object.create(IMVU.Client.widget.ChatRoom.prototype);
$.extend(IMVU.Client.widget.ChatRoomPublic.prototype,{
    setUpView: function() {
        this.$occupancyBubble.show();
    },
});
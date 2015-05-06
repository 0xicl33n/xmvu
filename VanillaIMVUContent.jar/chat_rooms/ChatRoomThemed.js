IMVU.Client.widget.ChatRoomThemed = function(args) {
    if(_.isUndefined(args.loadOccupantsOnHover)) args.loadOccupantsOnHover = true;

    args.dontPositionBackgroundImage = true;
    args.tabName = 'ThemedRooms';
    $.extend(this, new IMVU.Client.widget.ChatRoom(args))
    this.$background = args.background;
    this.$root.addClass('themed-room');
    this.setUpView();
    if(args.loadOccupantsOnHover) { 
        this.loadOccupantsOnHover();
    }
}

IMVU.Client.widget.ChatRoomThemed.prototype = Object.create(IMVU.Client.widget.ChatRoom.prototype);
$.extend(IMVU.Client.widget.ChatRoomThemed.prototype,{
    setUpView: function() {
        this.$occupancyBubble.show();
        this.$roomImage.css({
            'max-height':'100%',
            width:''
        });
    },
    
    changeBackground: function() {
        var $new_background = $('<img>').attr('src', this.roomInfo.image);
        this.$background.attr('src', this.roomInfo.image_url);
    }
});
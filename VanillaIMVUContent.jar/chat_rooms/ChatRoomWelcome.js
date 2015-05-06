IMVU.Client.widget.ChatRoomWelcome = function(args) {
    $.extend(this, new IMVU.Client.widget.ChatRoomThemed($.extend(args, { 
        loadOccupantsOnHover: false
    })));
    this.$root.attr('chatroomtype','ChatRoomWelcome');
    this.$goButton.attr('data-ui-room-type','ChatRoomWelcome');
    this.$goButton.attr('data-ui-welcome-room-type',args.roomInfo['name']);
    this.$root.attr('cid', args.roomInfo.cid);
    this.$pool.addClass('no-subtitle');
    this.$occupancyBubble.hide();
    this.$starRating.hide();
    this.$infoButton.hide();
    this.$flagButton.hide();
    this.$roomImage.css({
        'height':'100%',
        width:''
    });
}

IMVU.Client.widget.ChatRoomThemed.prototype = Object.create(IMVU.Client.widget.ChatRoomThemed.prototype);
$.extend(IMVU.Client.widget.ChatRoomThemed.prototype,{
});
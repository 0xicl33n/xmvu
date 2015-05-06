function Tile(args) {
    this.type = args.type || "available";
    this.buttonCallback = args.buttonCallback;
    this.$tile = args.tile;
    this.$tile.addClass(this.type);
    if (args.body) {
        this.insertBody(args.body);
    }
    if(this.type === "chat-room" || this.type === "upsell-room") {
        this.$tile.find('.border').remove();
        this.$tile.find('.ap-upsell').remove();
        this.$tile.find('.wrapper').remove();
        this.chatRoom = args.chatRoom;
    } else if (this.type === "ad") {
        this.$tile.find('.border').remove();
        this.$tile.find('.ap-upsell').remove();
        this.$tile.find('.wrapper').remove();
    } else if (this.type === "show-ap-upsell") {
        this.$tile.find('.border').remove();
        this.$tile.find('.wrapper').remove();
    } else if(this.type == "welcome-room-moderator") { 
        this.$tile.find('.border').remove();
        this.$tile.find('.ap-upsell').remove();
        this.$tile.find('.wrapper').remove();
        this.$tile.click(args.buttonCallback);
        var $button = this.$tile.find('.moderator-needed');
        var buttonAddClass = $button.toggleClass.bind($button,'hover');
        this.$tile.hover(buttonAddClass.bind(null,null,true),buttonAddClass.bind(null,null,false))
    } else if (this.type === "show-no-results") {
        this.$tile.find('.border').remove();
        this.$tile.find('.ap-upsell').remove();
        if(args.noFilters) {
            this.$tile.find('.no-results button.remove-all-filters').hide();
            this.$tile.find('.check-filters').hide();
        } else {
            this.$tile.click(args.buttonCallback);
        }
    } else if(this.type == 'show-our-room-upsell') { 
        this.$tile.find('button.buy-our-room').click(args.buttonCallback);
    } else if(this.type == 'show-shared-room-upsell') { 
        this.$tile.find('button.buy-shared-room').click(args.buttonCallback);
    } else if(this.type == 'show-chat-room-slots-upsell') { 
        this.$tile.find('button.buy-chat-room-slots').click(args.buttonCallback);
    } else if(this.type == 'create-room') { 
        this.$tile.find('button.create-room').click(args.buttonCallback);
    } else if(this.type == 'show-vip-upsell') { 
        this.$tile.find('button.buy-vip').click(args.buttonCallback);
    }
}

Tile.prototype = {
    empty: function() {
        this.$tile.empty();
    },

    insertBody: function(body) {
        this.$tile.append(body);
    }
}

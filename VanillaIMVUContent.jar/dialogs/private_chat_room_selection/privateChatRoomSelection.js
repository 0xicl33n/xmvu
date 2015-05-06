PrivateChatRoomSelection = function(args) {
    args = args || {};
    this.args = args;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;

    if (!args.allowed) {
        $('.ap-warning').show();
        $('.room-list').height(  $('.room-list').height() - $('.ap-warning').height() - 5 );
    }

    this.$rooms = $('.room-list');
    
    this.partnerId = args.partnerId;
    this.partnerName = args.partnerName;
    this.partnerAPStatus = args.partnerAPStatus;
    this.goButton = $('.go-button');
    this.goButton.addClass('disabled');

    $('.partner-name').text(this.partnerName);

    this.selectedRoomProductId = undefined;
    
    $('.buy-button').click(this.buyMoreRooms.bind(this));
    $('.go-button, .cancel').click(this.privateChatRoomSelection.bind(this));
    $('.close-button, .cancel').click(this.close.bind(this));
    $('.room-record').live('click', function(event) {
        $('.room-record.selected').removeClass('selected');
        var elt = $(event.currentTarget);
        elt.addClass('selected');
        var data = elt.data();
        $('.active-selection').css('display', 'inline-block');
        $('.selected-room-image').attr('src', data.url);
        $('.selected-room-name').text(data.name);
        this.selectedRoomProductId = data.id;
        this.goButton.removeClass('disabled');
    }.bind(this));

    this.eventBus.register('InventoryChanged', this.inventoryChanged.bind(this));
    this.inventoryChanged();
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));
};

PrivateChatRoomSelection.prototype = {
    close: function() {
        this.imvu.call('endDialog', {});
    },
    
    privateChatRoomSelection: function() {
        if (this.selectedRoomProductId) {
            this.imvu.call('endDialog', {
                'roomPid': this.selectedRoomProductId
            });
        }
    },
    
    buyMoreRooms: function() {
        this.imvu.call('endDialog', {
            'buyMoreRooms': true,
        });
    },

    inventoryChanged: function() {
        var products = this.imvu.call('getRooms');
        if (products.length === 0 ) {
            if (this.imvu.call('isInventoryComplete')) {
                // upsell
                var $root = $('#dialog');
                this.imvu.call('resize', $root.outerWidth(true), $root.outerHeight(true)-100);
                $('.ap-warning').hide();
                $('.room-list-active').hide();
                $('.upsell-active').show();
                $('.room-list-spinner').hide();
                $('.room-list').hide();

                this.imvu.call('recordFact', 'invite_out_of_suitable_rooms', {
                    partner_id: this.partnerId,
                    partner_ap_status: this.partnerAPStatus
                });
            } else {
                // spinner
                $('.room-list-active').show();
                $('.upsell-active').hide();
                $('.room-list-spinner').show();
                $('.room-list').hide();
            }
        } else {
            $('.room-list-active').show();
            $('.upsell-active').hide();
            $('.room-list-spinner').hide();
            $('.room-list').show();

            var template = _.template('<div class="room-record"><div class="room-record-title"><%- name %></div><img src="<%= url %>"></img></div>');
            for (var i = 0; i < products.length; ++i) {
                var product = products[i];
                this.$rooms.append($(template({
                    name: product.products_name,
                    url: product.products_image})).data({
                        'id': product.products_id,
                        'name': product.products_name,
                        'url': product.products_image}));
            }
            $('.room-record:eq(0)').click();
        }
    },
};

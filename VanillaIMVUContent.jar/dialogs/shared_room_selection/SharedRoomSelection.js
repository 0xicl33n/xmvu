SharedRoomSelection = function(args) {
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;

    this.$rooms = $('.room-list');
    this.goButton = $('.go-button');
    this.goButton.addClass('disabled');

    $('.go-button').click(this.go.bind(this));
    $('.close-button, .cancel').click(this.close.bind(this));
    $('.room-record').live('click', function(event) {
        $('.room-record.selected').removeClass('selected');
        var elt = $(event.currentTarget);
        elt.addClass('selected');
        var data = elt.data();
        $('.selected-room-image').attr('src', data.url);
        ellipsize($('.selected-room-name').text(data.fullName), 250, 12);
        this.selectedInstanceId = data.id;
        this.goButton.removeClass('disabled');
    }.bind(this));

    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));

    this.displayRooms();
    this.eventBus.register('SharedRoomsUpdated', this.displayRooms.bind(this));
};

SharedRoomSelection.prototype = {
    close: function() {
        this.imvu.call('cancelDialog');
    },

    go: function() {
        if (this.selectedInstanceId) {
            this.imvu.call('endDialog', {
                roomInstanceId: this.selectedInstanceId
            });
        }
    },

    displayRooms: function() {
        this.$rooms.empty();
        var me = this.imvu.call('getCustomerId');
        var rooms = this.imvu.call('getSharedRooms');

        var template = _.template('<div class="room-record"><div class="room-record-title"><%- name %></div><img src="<%= url %>"></img></div>');

        _.each(rooms, function(room) {
            var partner = room.owner == me ? room.shared_user_name : room.owner_name;
            var shortName = partner;
            var $room = $(template({
                name: shortName,
                url: room.image_url
            }));
            $room.data({
                'id': room.id,
                'fullName': room.name,
                'url': room.image_url,
            });

            ellipsize($room.find('.room-record-title'), 85, 11);
            this.$rooms.append($room);
        }, this);

        $('.room-record:eq(0)').click();
    },
};

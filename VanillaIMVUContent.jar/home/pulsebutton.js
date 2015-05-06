function PulseButton(args) {
    this.init(args);
}

$.extend(PulseButton.prototype, ModeButton.prototype, {
    decorate: function ($elt) {
        this.$pill = $(
            '<div class="pulse-mode-icon">' +
                '<div class="left"></div>' +
                '<div class="middle">' +
                    '<span id="unread-updates-count-mode-button"></span>' +
                '</div>' +
                '<div class="right"></div>' +
            '</div>'
        );
        $elt.prepend(this.$pill);
    },

    refreshUnreadUpdates: function (msg) {
        $('#unread-updates-count-mode-button', this.$div).html(msg);
        $('.pulse-mode-icon', this.$div).toggle(msg.length > 0);
    }
});

function newPulseButton(args) {
    return new PulseButton({
        name: 'pulse',
        friendlyName: 'Pulse',
        translateFriendlyName: false,
        isNew: false,
        visible: false,
        eventBus: args.eventBus,
        imvu: args.imvu
    });
}

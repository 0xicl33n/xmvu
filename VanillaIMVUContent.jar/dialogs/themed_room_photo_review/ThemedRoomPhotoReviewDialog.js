function ThemedRoomPhotoReviewDialog(args) {
    this.imvu = args.imvu || imvu;
    this.network = args.network || IMVU.network;
    this.dialoginfo = args.dialoginfo || this.imvu.call('getDialogInfo');
    this.$root = $(args.root);
    this.$root.find('#close-button').click(this.cancel.bind(this));
    this.$root.find('.tryAgain').click(this.tryAgain.bind(this));
    this.$root.find('.nominateButton').click(this.submitThemedRoom.bind(this));
    onEscKeypress(this.tryAgain.bind(this));

    this.$photo = this.$root.find('#photo');
    this.$photo.css('background', 'url("' + this.dialoginfo.path + '")');
    $("#link_content_policy").click(function () { this.imvu.call("launchNamedUrl", "virtual_goods_policy"); }.bind(this));
    $('.room-name').html(this.dialoginfo.roomName);
    ellipsize($('.room-name'), 440 /*pixels wide*/, 18 /*fonts in pixels*/);
    this.$themeName = this.$root.find('.selected-theme .name').text(this.dialoginfo.theme_name);
}

ThemedRoomPhotoReviewDialog.prototype = {
    cancel: function() {
        this.imvu.call('endDialog', {upload: false, take_again: false, replace_photo: false, share_photo: false});
    },
    
    tryAgain: function() {
        this.imvu.call('endDialog', {upload: false, take_again: true, replace_photo: false, share_photo: false});
    },

    submitThemedRoom: function() {
        this.imvu.call('endDialog', {upload: true, action: 'themed_room', take_again: false, replace_photo: false, share_photo: false});
    }
};

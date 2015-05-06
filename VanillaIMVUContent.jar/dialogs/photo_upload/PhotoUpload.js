function PhotoUploadDialog(spec) {
    this.$root = $(spec.root);
    this.imvu = spec.imvu || imvuRequired;
    this.info = this.imvu.call('getDialogInfo');
    this.isPortrait = this.info.photoType == 'portrait';
    this.allowShare = !!this.info.allowShare;

    this.$root.addClass(this.info.photoType);

    this.$photo = this.$root.find('#photo');
    this.$photo.attr('src', this.info.path);
    this.$photo.load(function () {
        this.imvu.call('resize', this.$root.outerWidth(true), this.$root.outerHeight(true));
    }.bind(this));

    this.$replaceProfile = this.$root.find('#replace-profile');
    this.$replaceProfile.prop('checked', !!this.info.replacePhoto);
    this.$root.find('.profile-option').toggle(this.isPortrait);

    this.$replaceRoom = this.$root.find('#replace-room');
    this.$replaceRoom.prop('checked', !!this.info.replacePhoto);
    this.$root.find('.room-option').toggle(!this.isPortrait);

    this.$sharePhoto = this.$root.find('#share-photo');
    this.$sharePhoto.prop('checked', this.allowShare && !!this.info.shareDefault);
    this.$root.find('.share-option').toggle(!!this.allowShare);
    if (this.info.disclaimer) {
        this.$root.find('.photo-options-container .disclaimer').text(this.info.disclaimer).show();
    }

    this.$root.find('.close').click(function () {
        this.imvu.call('endDialog', {upload: false, take_again: false, replace_photo: this.getReplaceSetting(), share_photo: false});
    }.bind(this));

    this.$root.find('#cancel').click(function () {
        this.imvu.call('endDialog', {upload: false, take_again: true, replace_photo: this.getReplaceSetting(), share_photo: false});
    }.bind(this));
    
    this.$save = this.$root.find('#save');
    this.$save.click(function () {
        var action = 'none',
            replace = this.getReplaceSetting();
        if (replace) {
            action  = this.isPortrait ? 'avatar' : 'room';
        }
        this.imvu.call('endDialog', {upload: true, action: action, take_again: false, replace_photo: replace, share_photo: (this.allowShare == true && this.$sharePhoto.is(':checked'))});
    }.bind(this));

    $("#link_content_policy").click(function () { this.imvu.call("launchNamedUrl", "virtual_goods_policy"); }.bind(this));

    function getReplaceSetting() {
        return this.isPortrait ? this.$replaceProfile.is(':checked') : this.$replaceRoom.is(':checked');
    }
    onEscKeypress(function() {
        this.imvu.call('endDialog', {upload: false, take_again: false, replace_photo: this.getReplaceSetting(), share_photo: false});
    }.bind(this));
}

PhotoUploadDialog.prototype = {
    getReplaceSetting: function() {
        return this.isPortrait ? this.$replaceProfile.is(':checked') : this.$replaceRoom.is(':checked');
    },
}
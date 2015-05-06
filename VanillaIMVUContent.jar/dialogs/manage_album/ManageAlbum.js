function ManageAlbum(args) {
    this.imvu = args.imvu;
    this.network = args.network;
    this.album = args.album;
    this.$root = $(args.root);
    this.$cancel_button = this.$root.find('#cancel');
    this.$cancel_button.click(this.onClickCancel.bind(this));
    this.$save_button = this.$root.find('#save');
    this.$save_button.click(this.onClickConfirm.bind(this));
    this.$dropdown = this.$root.find('.album-privacy');
    this.$dropdown.dropdown('init');
    this.$albumTitleField = $('#manage-album-title');
    this.$albumPrivacyField = $('.album-privacy');
    this.$albumDescriptionField = $('#manage-album-description');
    this.$close_button = this.$root.find('.close');

    if (this.album) {
        this.mode = 'edit';
        this.album_id = this.album.aid;
        this.$root.find('.title').text('Edit My Album');
        this.$albumTitleField.val(this.album.title).change();
        this.$dropdown.dropdown('setValue', this.album.visibility);
        this.$albumDescriptionField.val(this.album.description).change();

        this.$root.find('.privacy').toggle(this.album.default_album != true);
        this.$root.find('#album-privacy-warning').toggle(this.album.default_album != true);
        this.$root.find('#album-privacy-default').toggle(this.album.default_album == true);
    } else {
        this.mode = 'create';
        this.album_id = 0;
        this.$root.find('#album-privacy-default').hide();
    }

    if (!this.album || this.album.default_album == true) {
        this.$dropdown.dropdown('setValue', 0);
    }
    
    this.$close_button.bind('click', function(event) {
        this.onClickCancel();
    }.bind(this));
    $("#link_goods_policy").click(function () { this.imvu.call("launchNamedUrl", "virtual_goods_policy"); }.bind(this));
    
    this.$spinner = $('#manage-album-spinner');
    this.imvu.call('resize', this.$root.outerWidth(true), this.$root.outerHeight(true));
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

ManageAlbum.prototype = {    
    onClickCancel: function() {
        this.imvu.call('endDialog', false);
    },
    
    onClickConfirm: function() {
        this.doSubmit();
    },
    
    doSubmit: function() {
        this.showSpinner();
        var uri = IMVU.SERVICE_DOMAIN,
            post_data = {
                title: this.$albumTitleField.val(),
                description: this.$albumDescriptionField.val(),
                visibility: this.$albumPrivacyField.val(),
            };

        if (this.mode == 'create') {
            uri = uri + '/api/photos/create_album.php';
        } else {
            uri = uri + '/api/photos/edit_album.php';
            post_data['album_id'] = this.album_id;
        }

        serviceRequest({
            method: 'POST',
            uri: uri,
            data: post_data,
            network: this.network,
            imvu: this.imvu,
            callback: this.saveCallback.bind(this)
        });
    },
    
    saveCallback: function(result, error) {
        if (error || !result) {
            this.imvu.call('showErrorDialog', _T("Save Album Error"), _T("We are currently experiencing problems saving your album information.  Please check your network connection and try again."));
            console.log("Failed to save album info.");
            this.hideSpinner();
            return;
        }
        this.imvu.call('endDialog', result);
    },

    onChangeTextfield: function(event) {
        var field = $(event.target);
        field.parent().toggleClass('has-text', field.attr('value') != '');
    },
    
    onGainFocusTextfield: function(event) {
        var parent = $(event.target).parent();
        parent.addClass('focused');
    },
    
    onLoseFocusTextfield: function(event) {
        var parent = $(event.target).parent();
        parent.removeClass('focused');
    },
    
    toggleSpinner: function() {
        this.$spinner.toggle();
    },
    
    showSpinner: function() {
        this.$spinner.show();
    },
    
    hideSpinner: function() {
        this.$spinner.hide();
    }
}
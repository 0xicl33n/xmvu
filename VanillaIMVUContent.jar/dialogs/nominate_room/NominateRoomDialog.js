function NominateRoomDialog(args) {
    this.imvu = args.imvu || imvu;
    this.network = args.network || IMVU.network;
    this.dialoginfo = args.dialoginfo;
    $('.theme').hide();
    this.themedRoomsSubmissionVisibleThemesUri = this.imvu.call('getThemedRoomsSubmissionVisibleThemesUri');
    this.retrieveThemes();
    $('#close-button').click(this.cancelDialog.bind(this));
    $('.room-name').html(this.dialoginfo.roomName);
    ellipsize($('.room-name'), 200 /*pixels wide*/, 18 /*fonts in pixels*/);
    this.takeThemedRoomSnapshotButton = $('.take-themed-room-snapshot');
    this.takeThemedRoomSnapshotButton.click(this.takeThemedRoomSnapshot.bind(this));
    onEscKeypress(this.cancelDialog.bind(this));
}

NominateRoomDialog.prototype = {
    disableCta: function() {
        this.takeThemedRoomSnapshotButton.removeClass('enabled');
        this.takeThemedRoomSnapshotButton.addClass('dark-gray').fadeTo('slow', .3);
    },
    enableCta: function() {
        this.takeThemedRoomSnapshotButton.removeClass('dark-gray').fadeTo('slow', 1);
        this.takeThemedRoomSnapshotButton.addClass('enabled');
    },

    cancelDialog: function() {
        this.imvu.call('cancelDialog');
    },

    retrieveThemes: function() {
        var callback = {
                success: this.createThemesDropDown,
                failure: this.networkFailure,
                scope: this
        };
        url = this.themedRoomsSubmissionVisibleThemesUri + (this.themedRoomsSubmissionVisibleThemesUri.split('?')[1] ? '&': '?') + 'roomInstanceId=' + this.dialoginfo.roomInstanceId;
        this.network.asyncRequest('GET', url, callback, undefined);
    },

    createThemesDropDown: function(response) {
        if (!response.hasOwnProperty('responseText') ||
            !response.responseText.hasOwnProperty('status') ||
            response.responseText.status !== 'success' ||
            !response.responseText.hasOwnProperty('data') ||
            !response.responseText.data.hasOwnProperty('themes')
        ) {
            this.networkFailure();
        }
        var allThemes = IMVU.translatedThemeNames;
        var themeOptions = [[_T('Choose a theme'), 'default']];
        var themes = response.responseText.data.themes;
        for ( var idx in themes ) {
            var theme_name = themes[idx].name;
            var theme_id = themes[idx].public_room_themes_id;

            if(allThemes.hasOwnProperty(theme_name)) {
                themeOptions.push([allThemes[theme_name], theme_id]);
            }
        }
        this.themesDropDown = new IMVU.Client.widget.DropDown({
            rootElement: $('#themes-dropdown')[0],
            items: themeOptions,
            selectedValue: 0
        });
        this.$themesDropDown = $('#themes-dropdown').find('select').addClass('themes').change(function(e) {
            if($(e.target).val() != 'default') {
                this.enableCta();
            } else {
                this.disableCta();
            }
        }.bind(this))
    },

    networkFailure: function() {
        this.imvu.call('cancelDialog');
        this.imvu.call('showErrorDialog', _T("Nominate Room Error"), _T("We are currently experiencing problems returning Chat Room themes. Please check your network connection and try again."));
    },

    takeThemedRoomSnapshot: function() {
        if(!this.takeThemedRoomSnapshotButton.is('.enabled')) return;
        var themeId = $('select.themes').val();
        var themeName = $('select.themes').find('option[value="'+themeId+'"]').text();
        this.imvu.call('cancelDialog');
        this.imvu.call('takeThemedRoomSnapshot', themeId, this.dialoginfo.roomName, themeName);
    }
};

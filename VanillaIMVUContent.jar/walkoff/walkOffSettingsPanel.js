function WalkOffSettingsPanel($parent, imvu, callbacks, $template) {
    this.imvu = imvu;
    this.$parent = $parent;

    $template = $template || $('#walkoff .template > .settings-panel');
    this.$panel = $template.clone();
    this.$parent.append(this.$panel);

    var doNothing = function () {};
    this.setLowQualityGraphicsCallback = callbacks && callbacks['setLowQualityGraphics'] || doNothing;

    this.$bestGraphicsCheckbox = this.$panel.find('.check-button.best-graphics');
    this.$bestGraphicsCheckbox.click(this.handleBestGraphicsClicked.bind(this));

    this.$soundEffectsCheckbox = this.$panel.find('.check-button.sound-effects');
    this.$soundEffectsCheckbox.click(this.handleSoundEffectsClicked.bind(this));

    this.$previousButton = this.$panel.find('.music-button.previous');
    this.$previousButton.click(function () {
        this.imvu.call('playPreviousSong');
    }.bind(this));

    this.$nextButton = this.$panel.find('.music-button.next');
    this.$nextButton.click(function () {
        this.imvu.call('playNextSong');
    }.bind(this));

    this.$playButton = this.$panel.find('.music-button.play');
    this.$playButton.click(function () {
        this.imvu.call('setLocalStoreValue', 'walkoff.audio.background.muted', false);
        this.imvu.call('updateBackgroundAudio');
        this.$panel.addClass('playing');
    }.bind(this));

    this.$stopButton = this.$panel.find('.music-button.stop');
    this.$stopButton.click(function () {
        this.imvu.call('setLocalStoreValue', 'walkoff.audio.background.muted', true);
        this.imvu.call('updateBackgroundAudio');
        this.$panel.removeClass('playing');
    }.bind(this));

    this.$songTitle = this.$panel.find('.track-name > .name');

    this.refresh();
    this.initializeGameToMatchLocalStore();
};

WalkOffSettingsPanel.prototype = {
    setVisibility: function (visible) {
        this.$panel.toggle(visible);
        if (visible) {
            this.refresh();
        }
    },

    initializeGameToMatchLocalStore: function () {
        var useLowQuality = !this.$bestGraphicsCheckbox.hasClass('checked');
        this.setLowQualityGraphicsCallback(useLowQuality);

        var soundEffectsDisabled = !this.$soundEffectsCheckbox.hasClass('checked');
        this.imvu.call('setSoundEffectsEnabled', !soundEffectsDisabled);
    },

    handleBestGraphicsClicked: function () {
        this.$bestGraphicsCheckbox.toggleClass('checked');

        var useLowQuality = !this.$bestGraphicsCheckbox.hasClass('checked');
        this.imvu.call('setLocalStoreValue', 'walkoff.board.low-quality', useLowQuality);
        this.setLowQualityGraphicsCallback(useLowQuality);
    },

    handleSoundEffectsClicked: function () {
        this.$soundEffectsCheckbox.toggleClass('checked');

        var soundEffectsDisabled = !this.$soundEffectsCheckbox.hasClass('checked');
        this.imvu.call('setLocalStoreValue', 'walkoff.audio.sound-effects.disabled', soundEffectsDisabled);
        this.imvu.call('setSoundEffectsEnabled', !soundEffectsDisabled);
    },

    refresh: function () {
        var lowQuality = this.imvu.call('getLocalStoreValue', 'walkoff.board.low-quality', false);
        this.$bestGraphicsCheckbox.toggleClass('checked', !lowQuality);

        var soundEffectsDisabled = this.imvu.call('getLocalStoreValue', 'walkoff.audio.sound-effects.disabled', false);
        this.$soundEffectsCheckbox.toggleClass('checked', !soundEffectsDisabled);

        var musicMuted = this.imvu.call('getLocalStoreValue', 'walkoff.audio.background.muted', false);
        this.$panel.toggleClass('playing', !musicMuted);

        this.refreshSongTitle();
    },

    refreshSongTitle: function () {
        var songTitle = this.imvu.call('getCurrentSongTitle');
        this.$songTitle.text(songTitle);
    }

};


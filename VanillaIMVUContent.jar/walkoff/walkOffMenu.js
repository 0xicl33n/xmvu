function WalkOffMenu(mode, $menu, imvu, network, inviteDialog, settingsPanel) {
    this.mode = mode;
    this.$menu = $menu || $('#walkoff > .menu');
    this.$menuFrame = $('.menu-frame', this.$menu);
    this.$howToFrame = $('.how-to-frame', this.$menu);
    this.$settingsButton = $('.menu_button.settings', this.$menuFrame);

    this.imvu = imvu;
    this.network = network || IMVU.Network;
    this.inviteDialog = inviteDialog || new WalkOffInviteDialog(imvu, IMVU.Client.EventBus, $('.invite-dialog', this.$menu));
    this.settingsPanel = settingsPanel || new WalkOffSettingsPanel(this.$menuFrame, imvu);
    this.cid = this.imvu.call('getCustomerId');

    $('.menu_button.new_game', this.$menuFrame).click(function() {
        this.playClick();
        this.mode.openGame();
    }.bind(this));

    $('.menu_button.invite', this.$menuFrame).click(function () {
        this.playClick();
        this.openInvite();
    }.bind(this));

    $('.menu_button.how_to_play', this.$menuFrame).click(function() {
        this.playClick();
        this.$menuFrame.hide();
        this.$howToFrame.show();
    }.bind(this));

    $('.menu_button.back_to_menu', this.$howToFrame).click(function() {
        this.playClick();
        this.$howToFrame.hide();
        this.$menuFrame.show();
    }.bind(this));

    this.$settingsButton.click(function () {
        this.playClick();
        this.$settingsButton.toggleClass('open');
        this.settingsPanel.setVisibility(this.$settingsButton.hasClass('open'));
    }.bind(this));

    $('.avname', this.$menuFrame).text(this.imvu.call('getAvatarName'));
    
    this.$leaderboard = $('#walkoff > .template > .leaderboard').clone();
    $('.leaderboard_container_menu', this.$menuFrame).append(this.$leaderboard);
    var vipUpsellReason = 'main_menu';
    this.leaderboard = new Leaderboard(this.$leaderboard, this.mode.$mode, imvu, network, vipUpsellReason);
};

WalkOffMenu.prototype = {
    playClick: function() {
        this.imvu.call('playSound', 'menu_click');
    },

    show: function () {
        this.settingsPanel.refresh();
        this.$menu.show();
        this.showPromo();
    },

    hide: function () {
        this.$menu.hide();
    },
    
    refreshLeaderboard: function() {
        this.leaderboard.refreshLeaderboard();
    },
    
    showPromo: function() {
        var promoText = this.imvu.call('getPromoText');
        if (promoText && promoText.visible) {
            var $promoBox = $('.leaderboard_promo');
            $promoBox.show();
            $('.title', $promoBox).text(promoText.title);
            $('.body', $promoBox).text(promoText.body);
            $promoBox.css('left', '100%');
            
            $promoBox.animate({'left': '3px'}, 1000);
        }
    },

    openInvite: function() {
        this.inviteDialog.show();
    },
};

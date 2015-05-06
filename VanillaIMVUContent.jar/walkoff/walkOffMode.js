
function WalkOffMode($mode, imvu, eventBus, network, timer, services, menu, gameProvider) {
    this.$mode = $mode || $('#walkoff');
    var $menu = $('.menu', $mode);
    this.imvu = imvu;
    this.eventBus = eventBus;
    this.timer = timer;
    this.services = services;
    this.network = network;
    this.gameProvider = gameProvider || WalkOffGame;

    this.game = null;
    this.menu = menu || new WalkOffMenu(this, $menu, this.imvu, network);
    this.service = null;
    
    this.width = 0;
    this.height = 0;
    this.cancelPreloading = null;
    this.preload();
}

WalkOffMode.ASSET_LIST = [
    // This asset list has priority order. -- andy 15 May 2012
    'GemBlueSpinning.png',
    'GemGreenSpinning.png',
    'GemPinkSpinning.png',
    'GemRedSpinning.png',
    'GemWildSpinning.png',
    'GemYellowSpinning.png',
    'GemBlueShattering.png',
    'GemGreenShattering.png',
    'GemPinkShattering.png',
    'GemRedShattering.png',
    'GemWildShattering.png',
    'GemYellowShattering.png',

    'GemBluePower.png',
    'GemBlueSpinningPower.png',
    'GemBlueSpinningSuperPower.png',
    'GemBlueSuperPower.png',
    'GemGreenPower.png',
    'GemGreenSpinningPower.png',
    'GemGreenSpinningSuperPower.png',
    'GemGreenSuperPower.png',
    'GemPinkPower.png',
    'GemPinkSpinningPower.png',
    'GemPinkSpinningSuperPower.png',
    'GemPinkSuperPower.png',
    'GemRedPower.png',
    'GemRedSpinningPower.png',
    'GemRedSpinningSuperPower.png',
    'GemRedSuperPower.png',
    'GemWildPower.png',
    'GemWildSpinningPower.png',
    'GemWildSpinningSuperPower.png',
    'GemWildSuperPower.png',
    'GemYellowPower.png',
    'GemYellowSpinningPower.png',
    'GemYellowSpinningSuperPower.png',
    'GemYellowSuperPower.png'
];

WalkOffMode.prototype = {
    preload: function() {
        var assets = _.map(WalkOffMode.ASSET_LIST, function(a) {
            return 'http://static-akm.imvu.com/imvufiles/games/walkoff/images/' + a;
        });
        this.cancelPreloading = LoadingDialog.showDialogAndPreloadAssets(this.timer, assets, this.openMenu.bind(this));
    },

    hideAllScreens: function() {
        this.menu.hide();
        if (this.game) {
            this.game.hide();
        }
    },

    openGame: function(config) {
        this.cancelPreloading();

        if (!config && 'full' !== this.imvu.call('getFeatureAccessLevel', 'walkoff')){
            this.imvu.call('showVipWalkOffUpsell');
            return;
        }

        if (this.game){
            this.game.closeGame();
        }

        this.hideAllScreens();
        this.service = new this.services.pvp(this.imvu, this.network, this.timer, this.services.imq, config);
        var callbacks = { onCloseGame: this.handleCloseGame.bind(this) };
        this.game = new this.gameProvider(this.$mode, this.imvu, this.eventBus, this.service, this.timer, callbacks);
        var isInvite = !(_.isEmpty(config));
        this.game.show(isInvite);
        this.setCanvasArea(this.width, this.height);
    },

    inActiveGame: function() {
        return Boolean(this.game && !this.game.gameOver);
    },

    handleCloseGame: function (config) {
        this.imvu.call('playNextSong');
        this.openMenu();
        this.game = null;
        if (config) {
            if (config.next === 'invite') {
                this.menu.openInvite();
            } else if (config.next === 'quickmatch') {
                this.openGame();
            } else if (config.next === 'inviteAgain') {
                this.imvu.call('sendWalkOffInvite', config.inviteeCid);
            }
            if (config.hasNewHighScores) {
                this.menu.refreshLeaderboard();
            }
        }
    },

    openMenu: function() {
        this.hideAllScreens();
        this.menu.show();
    },

    setCanvasArea: function(w, h) {
        this.width = w;
        this.height = h;

        if (this.game) {
            this.game.setCanvasArea(w, h);
        }
    },

    updateFriendList: function(friendList) {
        this.menu.inviteDialog.updateFriendList(friendList);
    },

    handleBuddyStateEvent: function(event, userInfo){
        this.menu.inviteDialog.handleBuddyStateEvent(event, userInfo);
    },

    displayDecline: function(){
        if (this.game){
            this.game.displayDecline();
        }
    },
    
    refreshSongTitle: function() {
        if (this.game) {
            this.game.settingsPanel.refreshSongTitle();
        }
        if (this.menu) {
            this.menu.settingsPanel.refreshSongTitle();
        }
    },

    // Chat

    onCreateChatMount: function(message, state) {
    },

    onChatMessage: function(message) {
    },

    onChatStateChange: function(message, state, delta) {
        if (state !== {}) {
            for (var k in state) {
                if (k.indexOf('_outfit') > -1) {
                    this.imvu.call('setAvatarOutfit', parseInt(k, 10), JSON.parse(state[k]));
                }
            }
        }
    },

    setPlayerName: function(cid, name) {
        if (this.game) {
            this.game.setPlayerName(cid, name);
        }
    }
};

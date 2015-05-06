
function WalkOffPVPService(imvu, network, timer, imq, config) {
    this.connectRetryDelay = 5000;

    this.imvu = imvu;
    this.imq = imq;
    this.network = network;
    this.timer = timer;
    this.config = config || 0;
    this.connected = false;

    this.inviteeCid = !config ? null : config.inviteeCid || null;
    this.inviterCid = !config ? null : config.inviterCid || null;
    
    this.game = null;
    this.gamequeue = null;
    this.gamestatemount = 'game_state';
    this.room_pid = 13375322;
    this.stateMountCreated = false;
    this.userTestMode = false; // Set to true if user test mode needs to be enabled.
    this.waiting = false;
    this.keepaliveInterval = null;
}

// external functions called from JS /////////////////////////////////////////

WalkOffPVPService.prototype = {
    attachToGame: function(game) {
        this.game = game;
        if (this.config){
            this.configure(this.config, false);
        }
    },

    configure: function(result, error){
        if (error) {
            this.imvu.call('showErrorDialog', _T("Error"), _T("There was a problem joining the game."));
            this.game.closeGame();
            return;
        }

        if (this.imq.inQueue()) {
            this.imvu.call('log', 'WALKOFF - Tried to join queue but already in queue ' + this.imq.queueName);
            return;
        }

        if (this.connected) {
            return;
        }

        this.connected = true;

        this.gamequeue = result.queue_name;
        this.chatqueue = "/chat/" + result.queue_name.substr(result.queue_name.lastIndexOf("/") + 1);

        this.imvu.call('setNewRoom', this.room_pid);
        this.game.showGameHud();

        this.inviteeCid = result.inviteeCid || null;
        this.inviterCid = result.inviterCid || null;
        this.waiting = result.in_queue;
        this.game.setAssetUrl(result.cdn_url);
        this.game.setPowerMoveCatalog(result.powers);
        this.imq.joinQueue(this, result.queue_name);

        // TODO replace this with a joinQueue as above
        this.imvu.call('setChatQueue', this.chatqueue);

        this.keepaliveInterval = this.timer.setInterval(this.keepalive.bind(this), 2000);
    },

    keepalive: function() {
        if (this.stateMountCreated) {
            this.sendMessage('keepalive', 'ping');
        }
    },

    connect: function() {
        if (!this.config && !this.connected) {
            serviceRequest({
                method: 'POST',
                uri: '/api/games/walkoff.php',
                data: {
                    action: 'quickMatch',
                    cid: this.imvu.call('getCustomerId'),
                    userTestMode: this.userTestMode
                },
                callback: this.configure.bind(this),
                json: true,
                network: this.network,
                imvu: this.imvu
            });

            this.imvu.call('quickmatchRequestStart');
        }
    },

    disconnect: function () {
        if (this.gamequeue) {
            this.imq.leaveQueue(this.gamequeue);
            this.gamequeue = null;
        }
        
        this.timer.clearInterval(this.keepaliveInterval);
        this.keepaliveInterval = null;
        this.connected = false;
        this.stateMountCreated = false;
    },

    sendMessage: function(key, value) {
        if (!this.gamequeue) {
            return;
        }

        var o = {};
        o[key] = value;
        this.imvu.call('sendStateChange', this.gamequeue, this.gamestatemount, o);
    },

    // external functions called from Python //////////////////////////////////////////

    onGameCreateMount: function(message, state) {
        if (message.mount === 'game_state' && !this.stateMountCreated) {
            this.stateMountCreated = true;
            this.game.setGameState(state);
            
            if (!this.waiting) {
                this.notifyReady();
            } else if (state.player2 && state.player2.cid !== '0') {
                this.notifyReady();
            }
        }
    },

    onGameMessage: function(message) {
        if (message.mount === 'game_msgs' && message.user_id === 'admin') {
            var command = JSON.parse(message.message);
            for (var k in command) {
                this.game.handleCommand(k, command[k]);
            }

            if (k === 'startgamesetup') {
                this.timer.clearTimeout(this.retryTimeout);
            }
        }
    },

    onGameStateChange: function(message, state, delta) {
        if (message.mount === 'game_state') {
            if (this.waiting && state.player2) {
                var player2 = JSON.parse(state.player2);
                if (player2.cid !== '0') {
                    this.notifyReady();
                }
            }
        }
    },

    onGameLeave: function(message) {
        // todo: process incoming leave game message (= opponent disconnect??)
    },

    // internal functions ////////////////////////////////////////////////////////
    
    notifyReady: function() {
        this.waiting = false;
        this.sendMessage("ready", "1");
        this.sendMessage("wear", this.imvu.call("getMyOutfit"));
        if ( !this.inviteeCid && !this.inviterCid ) {
            this.retryTimeout = this.timer.setTimeout(function() {
                this.disconnect();
                this.connect();
            }.bind(this), this.connectRetryDelay);
        }
    },

    getInviteeCid: function () {
        return this.inviteeCid;
    },
    
    getInviterCid: function () {
        return this.inviterCid;
    }

};


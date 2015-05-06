var Music_InitComplete;
var Music_Loaded;
var Music_TrackChanged;
var Music_MuteChanged;
var Music_VolumeChanged;
var Music_Log;

function sendMessage(s) {
    imvu.call('log', 'MusicTool calling sendMessage ' + s.toSource());
    imvu.call('sendMessage', s);
}

function launchNamedUrl(url, args) {
    args = args || {};
    imvu.call('log', 'MusicTool calling launchNamedUrl ' + url.toSource() + ' ' + args.toSource());
    imvu.call('launchNamedUrl', url, args);
}

function MusicTool(imvu, network, eventBus, containerElement, musicPlayerFactory) {
    this.imvu = imvu;
    this.network = network;
    this.eventBus = eventBus;
    this.containerElement = containerElement;
    this.musicPlayerFactory = musicPlayerFactory;

    Music_InitComplete  = this.initComplete.bind(this);
    Music_Loaded        = this.musicLoaded.bind(this);
    Music_TrackChanged  = this.trackChanged.bind(this);
    Music_MuteChanged   = this.muteChanged.bind(this);
    Music_VolumeChanged = this.volumeChanged.bind(this);
    Music_Log           = IMVU.log.bind(IMVU);

    this.embedSwf();
}

MusicTool.prototype = {
    embedSwf: function() {
        if (this.musicPlayerWidget) {
            return;
        }
        
        var e = this.musicPlayerFactory();
        e.id = 'music-player-widget';
        e.type = 'application/x-shockwave-flash';
        e.allowScriptAccess = 'always';
        e.swLiveConnect = 'true';
        e.disableLocalSecurity = 'true';
        e.menu = 'false';
        e.allowNetworking = 'all';
        e.src = '../../flash/MusicTool.swf';
        this.containerElement.appendChild(e);
        
        this.musicPlayerWidget = e;
    },

    reload: function() {
        this.imvu.call('reload');
        this.musicPlayerWidget = null;
        $('#music-player-widget').remove();
        this.embedSwf();
    },

    initComplete: function() {
        var shouldUseDev = this.imvu.call('isQA');
        this.musicPlayerWidget.loadMusic(shouldUseDev);
    },

    musicLoaded: function() {
        this.eventBus.fire('Music_Loaded', {});
    },

    trackChanged: function(trackData) {
        this.eventBus.fire('Music_TrackChanged', {'trackData': trackData});
        if (this.imvu.call('getImvuConfigVariable', 'client.music_counter.enable') == '1') {
            var pert = this.imvu.call('getImvuConfigVariable', 'client.music_counter.rate');
            if (typeof(pert)=='undefined' || pert.length == 0) {
                pert = 1;
            } else {
                pert = parseInt(pert);
            }
            serviceRequest({
                'method':   'POST',
                'uri':      IMVU.SERVICE_DOMAIN + '/api/increment_counter.php',
                'imvu':     this.imvu,
                'network' : this.network,
                'data': { 
                    'name' : 'music.play_count',
                    'percentage' : pert
                },
            });
        }
    },

    muteChanged: function(isMuted) {
        this.eventBus.fire('Music_MuteChanged', {'isMuted': isMuted});
    },

    volumeChanged: function(volume) {
        this.eventBus.fire('Music_VolumeChanged', {'volume': volume});
    },

    activateMusic: function() {
        if (this.musicPlayerWidget.activateMusic) {
            this.musicPlayerWidget.activateMusic();
        } else {
            this.reload();
        }
    },

    deactivateMusic: function() {
        if (this.musicPlayerWidget.deactivateMusic) {
            this.musicPlayerWidget.deactivateMusic();
        } else {
            this.reload();
        }
    },

    changeVolume: function(newvol) {
        if (this.musicPlayerWidget.changeVolume) {
            this.musicPlayerWidget.changeVolume(newvol);
        } else {
            this.reload();
        }
    },

    mute: function(isMuted) {
        if (this.musicPlayerWidget.mute) {
            this.musicPlayerWidget.mute(isMuted);
        } else {
            this.reload();
        }
    },

    updateParticipants: function(participants, chatId) {
        if (this.musicPlayerWidget.updateParticipants) {
            this.musicPlayerWidget.updateParticipants(participants, chatId);
        } else {
            this.reload();
        }
    },

    connectToMusicStream: function(userId, chatId, priority, formattedDOB, countryCode, participants) {
        if (this.musicPlayerWidget.connectToMusicStream) {
            return this.musicPlayerWidget.connectToMusicStream(userId, chatId, priority, formattedDOB, countryCode, participants);
        } else {
            this.reload();
            if (this.musicPlayerWidget.connectToMusicStream) {
                return this.musicPlayerWidget.connectToMusicStream(userId, chatId, priority, formattedDOB, countryCode, participants);
            }
        }
    },

    healthCheck: function(){
        if (!this.musicPlayerWidget.connectToMusicStream) {
            this.reload();
        }
    }
};

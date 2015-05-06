
AvatarSafetyDialog = function(info, imvu, network) {
    this.imvu = imvu;
    this.network = network;
    $('#close-button').click(this.close.bind(this));
    onEscKeypress(this.close.bind(this));

    YAHOO.util.Event.addListener('learn-more-link', 'click', this.learnMore, {}, this);
    YAHOO.util.Event.addListener('abuse-description', 'click', this.clearDescription, {}, this);

    this.isBlocked = false;
    this.isMuted = false;
    if (info) {
        document.getElementById('title-avatar-name').innerHTML = info.avatarName;
        document.getElementById('boot-avatar-name').innerHTML = info.avatarName;
        document.getElementById('block-avatar-name').innerHTML = info.avatarName;
        document.getElementById('mute-avatar-name').innerHTML = info.avatarName;
        this.isBlocked = !!info.isBlocked;
        this.isMuted = !!info.isMuted;
        if (info.reportInfo) {
            document.getElementById('report-section').style.display = '';
            document.getElementById('action').innerHTML = info.reportInfo.description;
            document.getElementById('action2').innerHTML = info.reportInfo.description;
            this.reportInfo = info.reportInfo;

            if (info.reportInfo.detailText) {
                document.getElementById('detail-text').innerHTML = info.reportInfo.detailText;
                document.getElementById('rules').style.display = 'none';
            }
            IMVU.Client.util.turnLinksIntoLaunchUrls(document.getElementById('rules'), this.imvu);

        } else {
            document.getElementById('report-section').style.display = 'none';
        }

        if (info.showBoot) {
            document.getElementById('boot-section').style.display = '';
        } else {
            document.getElementById('boot-section').style.display = 'none';
        }

        if (info.showMute) {
            document.getElementById('mute-section').style.display = '';
        } else {
            document.getElementById('mute-section').style.display = 'none';
        }
    } else {
        document.getElementById('boot-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'none';
        document.getElementById('mute-section').style.display = 'none';
    }
    this.bootButton    = new ImvuButton('#boot-button',    {callback:this.bootButtonPressed,   scope:this});
    this.blockButton   = new ImvuButton('#block-button',   {callback:this.blockButtonPressed,   scope:this});
    this.unblockButton = new ImvuButton('#unblock-button', {callback:this.unblockButtonPressed, scope:this});
    this.reportButton  = new ImvuButton('#report-button',  {callback:this.reportButtonPressed,  scope:this});

    this.muteButton   = new ImvuButton('#mute-button',   {callback:this.muteButtonPressed,   scope:this});
    this.unmuteButton = new ImvuButton('#unmute-button', {callback:this.unmuteButtonPressed, scope:this});
    this.configureBlockUnblockButtons();
    this.configureMuteButtons();
    imvu.call('resize', document.body.offsetWidth, document.body.offsetHeight);
};

AvatarSafetyDialog.prototype = {
    close : function(event, info) {
        this.imvu.call('endDialog', {shouldBlock:this.isBlocked, shouldMute:this.isMuted});
    },

    learnMore : function(event, info) {
        this.imvu.call('launchNamedUrl', 'help_safety');
    },

    _serviceRequest: function(spec) {
        var callbacks = spec.callback;
        function cb(result, error) {
            if (error) {
                callbacks.failure(error);
            } else {
                callbacks.success(result);
            }
        }
        spec.callback = cb;
        spec.network = this.network;
        spec.imvu = this.imvu;
        spec.json = true;
        serviceRequest(spec);
    },

    reportButtonPressed : function(event) {
        $('#loading-mask').addClass('visible');
        // HACK until we get all of the abuse report stuff cleaned up. -- andy 15 September 2009
        if (this.reportInfo.imvuCall) {
            this.imvu.call(this.reportInfo.imvuCall, this.reportInfo.imvuCallArgs);
            this.imvu.call('endDialog', {shouldBlock:this.isBlocked, reported:false});

        } else {
            this._serviceRequest({
                method: 'POST',
                uri: this.reportInfo.url,
                callback: { 
                    success: this.reportResponse.bind(this),
                    failure: this.reportError.bind(this),
                    error: this.reportError.bind(this)
                }, 
                data: this.reportInfo.details
            });
        }
    },

    reportResponse : function(reponse) {
        $('#loading-mask').removeClass('visible');
        this.imvu.call('endDialog', {shouldBlock:this.isBlocked, reported:true});
    },
    
    reportError: function(error) {
        $('#loading-mask').removeClass('visible');
        IMVU.log('reportError:' + error.toString());
        this.imvu.call('showConfirmationDialog', 
                      _T("Error reporting message"), 
                      _T("There was an error reporting the message.  Details: ")+error.toSource);
    },

    configureBlockUnblockButtons: function() {
        blockButton = document.getElementById('block-button');
        unblockButton = document.getElementById('unblock-button');
        if (this.isBlocked) {
            blockButton.style.display = 'none';
            unblockButton.style.display = '';
        } else {
            blockButton.style.display = '';
            unblockButton.style.display = 'none';
        }
    },

    configureMuteButtons: function() {
        muteButton = document.getElementById('mute-button');
        unmuteButton = document.getElementById('unmute-button');
        if (this.isMuted) {
            muteButton.style.display = 'none';
            unmuteButton.style.display = '';
        } else {
            muteButton.style.display = '';
            unmuteButton.style.display = 'none';
        }
    },
    
    bootButtonPressed: function(event) {
        this.imvu.call('endDialog', {shouldBlock:this.isBlocked, boot:true});
    },

    blockButtonPressed: function(event) {
        this.isBlocked = true;
        this.configureBlockUnblockButtons();
    },

    unblockButtonPressed: function(event) {
        this.isBlocked = false;
        this.configureBlockUnblockButtons();
    },

    muteButtonPressed: function(event) {
        this.isMuted = true;
        this.configureMuteButtons();
    },

    unmuteButtonPressed: function(event) {
        this.isMuted = false;
        this.configureMuteButtons();
    }
};

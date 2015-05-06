var Dom = YAHOO.util.Dom;
var Event = YAHOO.util.Event;

TitleInfoAnimation = null;


function MusicWidget(args) {
    this.rootElement = args.panel;
    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.blockedMusic = false;

    // it's important that the knob width is 11 and the slider width is 111.
    // it's brilliant, because 111-11 = 100 and x in the slider click event maps
    // directly to the volume level.
    this.knobWidth = 11;
    this.sliderWidth = 100;

    this.elVolume = this.rootElement.querySelector('.volume'); // holds all the other stuff
    this.elSpinner = this.rootElement.querySelector('.spinner');
    this.elCurrentlyPlaying = this.rootElement.querySelector('.currently-playing');
    this.elCurrentlyPlayingInner = this.rootElement.querySelector('.inner');
    this.elArtist = this.rootElement.querySelector('.currently-playing .artist');
    this.elTitle = this.rootElement.querySelector('.currently-playing .title');
    this.elIsMuted = this.elVolume.querySelector('.is-muted');
    this.elSlider = this.elVolume.querySelector('.slider'); // holds the knob
    this.elKnob = this.elSlider.querySelector('.knob');

    this.animation = null;
    this.animStartPosition = null;
    this.animationAmount = 0;
    TitleInfoAnimation = args.anim || YAHOO.util.Motion;

    Event.on(this.elIsMuted, 'click', function (e) {
        this.toggleMute();
    }.bind(this));

    this.slider = new YAHOO.widget.Slider.getHorizSlider(this.elSlider, this.elKnob, 0, 100);
    this.slider.animate = false;
    this.slider.subscribe('change', function () {
        if (!$(this.elSpinner).hasClass('visible')){
            this.setVolume(this.slider.getValue());
        }
    }.bind(this));
    
    this.eventBus.register('Music_TrackChanged', function(eventName, data) {
        this.showTrackInfo(data.trackData);
    }.bind(this), 'MusicController');
    this.eventBus.register('Music_VolumeChanged', function(eventName, data) {
        this.setSliderVolume(data.volume);
    }.bind(this), 'MusicController');
    this.eventBus.register('Music_MuteChanged', function(eventName, data) {
        this.setMute(data.isMuted);
    }.bind(this), 'MusicController');
    
    $('.hd .closeButton').click( function (e) {
        $('#roomWidget').trigger('closeActiveTabEvent');
    }.bind(this));

    this.showTrackInfo(null);

    this.setVolume(75);
    this.setSliderVolume(this.volume);

    this.slider.onAvailable = function() {
        YAHOO.util.Dom.setStyle(this.elKnob, 'left', '75px')
    }.bind(this);

    this.hideSpinner();
}


MusicWidget.prototype = {
    toggleMute: function () {
        var isMuted = !$(this.elIsMuted).hasClass('active');
        this.setMute(isMuted);
    },

    ANIM_SCALE_TIME: 0.035,

    setMute: function (isMuted) {
        $(this.elIsMuted).toggleClass('active', !!isMuted);
        if (!this.blockedMusic) {
            this.imvu.call('muteMusic', isMuted);
        }
    },

    setBlockedMusic: function (isBlocked) {
        if (isBlocked != this.blockedMusic) {
            this.blockedMusic = isBlocked;
            if (!$(this.elIsMuted).hasClass('active')) {
                this.imvu.call('muteMusic', isBlocked);
            }
        }
    },

    repeatAnimation: function() {
        this.animatingReverse = !this.animatingReverse;
        if (this.animation) {
            this.setAnimation(true, this.animationAmount, this.animatingReverse);
        }
    },

    setAnimation: function(animating, amount, backwards) {
        if (!this.animStartPosition) {
            this.animStartPosition = YAHOO.util.Dom.getXY(this.elCurrentlyPlaying);
        }
        if (this.animation) {
            var anim = this.animation;
            this.animation = null;
            anim.stop();
        }
        if (animating) {
            this.animationAmount = amount;
            this.animatingReverse = backwards;
            var a = this.animStartPosition[0] - amount;
            var b = this.animStartPosition[0];
            if (backwards) {
                var c = a;
                a = b;
                b = c;
            }
            var y = this.animStartPosition[1];
            var attribs = {
                points: {
                    from: [b, y],
                    to: [a, y],
                    unit: 'px'
                }
            };
            this.animation = new TitleInfoAnimation(
                this.elCurrentlyPlayingInner, 
                attribs, 
                amount * this.ANIM_SCALE_TIME);
            this.animation.onComplete.subscribe(this.repeatAnimation.bind(this));
            this.animation.animate();
        }
    },
    
    recalcAnimation: function() {
        if (this.animStartPosition) {
            YAHOO.util.Dom.setXY(this.elCurrentlyPlayingInner, this.animStartPosition, false);
            this.animStartPosition = null;
        }
        if ($(this.elCurrentlyPlaying).hasClass('visible')) {
            var rn = YAHOO.util.Dom.getRegion(this.elCurrentlyPlayingInner);
            var ra = YAHOO.util.Dom.getRegion(this.elCurrentlyPlaying);
            if (rn && ra) {
                this.setAnimation(rn.width > ra.width, rn.width - ra.width, false);
                return;
            }
        }
        this.setAnimation(null, 0, false);
    },

    showTrackInfo: function(trackData) {
        if(!trackData) {
            $(this.elCurrentlyPlaying).removeClass('visible');
            this.recalcAnimation();
            return;
        }
        $(this.elCurrentlyPlaying).addClass('visible');
        if (!trackData.IsExplicit || this.imvu.call('hasAccessPass')) {
            this.elArtist.innerHTML = trackData.ArtistName;
            this.elTitle.innerHTML = trackData.Title;
            this.setBlockedMusic(false);
        } else {
            this.elArtist.innerHTML = "AP track blocked";
            this.elTitle.innerHTML = "AP track blocked";
            this.setBlockedMusic(true);
        }
        this.recalcAnimation();
    },

    setSliderVolume: function(volume) {
        if (volume < 0) {
            volume = 0;
        } else if (volume > 100) {
            volume = 100;
        }
        
        this.slider.setValue(volume);
    },

    setVolume: function (volume) {
        if(volume == this.volume) {
            return;
        }
        
        if (volume < 0) {
            volume = 0;
        } else if (volume > 100) {
            volume = 100;
        }
        
        this.imvu.call('setMusicVolume', volume);
    },
    
    hideSpinner: function() {
        $(this.elSpinner).removeClass('visible');
    },

    shouldDisplay: function() {
        return this.imvu.call('shouldShowMusic');
    }
};

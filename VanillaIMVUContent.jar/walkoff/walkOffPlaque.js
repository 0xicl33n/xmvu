var GEM_GAIN_PULSE_MSEC = 200;
var GEM_FADING_PULSE_MSEC = 200;
var ENABLED_FADE_IN_DELAY_MSEC = 500;
var ENABLED_FADE_IN_MSEC = 750;
var GLOW_HOVER_FADE_MSEC = 250;
var FROST_FADE_MSEC = 750;

function WalkOffPlaque($plaque, right, imvu, animator, clickHandler) {
    this.$plaque = $plaque;
    if (right) {
        this.$plaque.addClass('right');
    } else {
        this.$plaque.addClass('left');
    }

    this.imvu = imvu;
    this.animator = animator;

    this.$buttonBackground = this.$plaque.find('.button-background');
    this.$moveIcon = this.$plaque.find('.move-icon');
    this.$glowHover = this.$plaque.find('.glow-hover');
    this.$ready = this.$plaque.find('.ready');
    this.$frost = this.$plaque.find('.frost');
    this.$mask = this.$plaque.find('.mask');
    this.$gemCount = this.$plaque.find('.gem-count');
    this.$gemCountHotspot = this.$plaque.find('.gem-count-hotspot');
    this.$name = this.$plaque.find('.label > .name');
    this.$tooltip = this.$plaque.find('.tooltip');
    this.$gemtooltip = this.$plaque.find('.gemtooltip');
    this.ctx = this.$mask[0].getContext('2d');
    this.shownGemCount = 0;
    this.lastUpdatedGemCount = 0;
    this.lastShownGemCount = null;
    this.gainPulseCount = 0;
    this.preGemGainCount = 0;
    this.lastEnabled = null;

    this.setIsCurrentPlayer(true);

    // TODO: Refactor to make animation state easier to understand.
    this.gemGainDelayId = null;
    this.enabledButtonFadeAnimationId = null;
    this.enabledIconFadeAnimationId = null;
    this.enabledFadeInDelayId = null;
    this.enabledAnimationQueued = false;
    this.enabledAnimationPlaying = false;

    this.hoverAnimationId = null;
    this.hovering = false;
    this.lastHovering = false;
    this.lastClickable = false;
    this.hoverAnimationNeedsUpdate = false;
    this.mouseDownGlowAnimationId = null;
    this.mouseDownButtonAnimationId = null;
    this.clickGlowAnimationId = null;
    this.clickButtonAnimationId = null;
    this.clickIconAnimationId = null;
    this.clickAnimationQueued = false;
    this.fadingPulseDelayId = null;
    this.fadingPulseCount = 0;

    this.frostAnimationId = null;

    this.moveId = null;
    this.colorId = null;
    this.moveName = null;
    this.moveCost = null;
    this.gemCount = null;
    this.enabled = null;

    this.tooltipAnimation = null;

    this.$plaque.mouseenter(this.handleMouseOver.bind(this));
    this.$plaque.mouseleave(this.handleMouseOut.bind(this));
    this.$plaque.mousedown(this.handleMouseDown.bind(this));
    this.$plaque.click(this.handleClick.bind(this));
    this.$gemCountHotspot.mouseenter(this.handleMouseOverGemCount.bind(this));
    this.$gemCountHotspot.mouseleave(this.handleMouseOutGemCount.bind(this));

    this.clickHandler = clickHandler || function () {};
    this.overriddenClickHandler = null;

    this.$glowHover.css('opacity', 0);
    this.$frost.css('opacity', 0);
    this.frozen = false;
    this.greenroomMode = false;
    this.mouseOverHandler = null;
    this.showReadyIntervalId = null;
}

WalkOffPlaque.prototype = {
    setMoveInfo: function (moveId, colorId, moveName, moveDesc, moveCost, gemCount, enabled) {
        this.moveId = moveId;
        this.colorId = colorId;
        this.moveName = moveName;
        this.moveDesc = moveDesc;
        this.moveCost = moveCost;
        this.gemCount = gemCount;
        this.enabled = enabled;
        this.$tooltip.html(this.moveDesc);
    },

    setGreenroomMode: function(mode) {
        this.greenroomMode = mode;
    },

    getGreenroomMode: function() {
        return this.greenroomMode;
    },

    isEnabled: function() {
        return this.enabled;
    },

    setIsCurrentPlayer: function (isCurrentPlayer) {
        this.$plaque.toggleClass('is-current-player', isCurrentPlayer);
    },

    setMoveId: function(id) {
        this.moveId = id;
    },
    
    setIconUrl: function(iconUrl) {
        this.$moveIcon.css('background-color', 'transparent');
        this.$moveIcon.css('background-image', 'url('+iconUrl+')');
        this.$moveIcon.css('background-repeat', 'no-repeat');
        this.$moveIcon.css('background-position', '0px -28px');
    },

    getElement: function() {
        return this.$plaque;
    },

    getMoveId: function() {
        return this.moveId;
    },

    getDescription: function() {
        return this.moveDesc;
    },

    getNexus: function() {
        var width = this.$mask[0].width;
        var pos = this.$mask.position();
        return {left: pos.left + width / 2, top: pos.top + width / 2};
    },

    overrideClickHandler: function(newClickHandler) {
        this.overriddenClickHandler = newClickHandler;
    },

    revertClickHandler: function() {
        this.overriddenClickHandler = null;
    },

    setMouseOverHandler: function(handler) {
        this.mouseOverHandler = handler;
    },

    update: function () {
        if (this.moveId === null
            || this.colorId === null
            || this.moveName === null
            || this.moveCost === null
            || this.gemCount === null) {

            this.$plaque.css('display', 'none');
            this.cancelGemGainAnimation();
            return;
        }
        this.$plaque.css('display', 'block');

        if (this.greenroomMode || this.lastUpdatedGemCount > this.gemCount) {
            this.shownGemCount = this.gemCount;
            this.cancelGemGainAnimation();
        } else if (this.lastUpdatedGemCount < this.gemCount) {
            this.startGemGainAnimation();
        }
        this.lastUpdatedGemCount = this.gemCount;

        this.updateColor();
        this.updateName();

        var gemType = this.GEM_CLASS_LOOKUP[this.colorId];
        gemType = gemType.substr(0,1).toUpperCase() + gemType.substr(1);
        this.$gemtooltip.text('Total: ' + this.shownGemCount + ' ' + gemType + 's');
        
        if (this.shownGemCount !== this.lastShownGemCount) {
            this.lastShownGemCount = this.shownGemCount;

            var pieSlices = Math.min(this.moveCost, this.shownGemCount);

            var text = pieSlices + '/' + this.moveCost;
            this.$gemCount.text(text);

            this.updateMask(pieSlices);
        }

        var enabledChanged = (this.enabled !== this.lastEnabled);
        if (enabledChanged) {
            if (this.enabled) {
                this.enabledAnimationQueued = true;
                this.$plaque.addClass('enabled');
            } else {
                this.enabledAnimationQueued = false;
                this.cancelEnabledAnimation();
                this.$buttonBackground.css('opacity', 0);
                this.$moveIcon.css('opacity', 0);
                this.$plaque.removeClass('ready');
                this.$plaque.removeClass('frozen');
                this.$plaque.removeClass('enabled');
            }
            this.lastEnabled = this.enabled;
        }

        var clickable = this.isClickable();
        if (this.hovering !== this.lastHovering
            || clickable !== this.lastClickable
            || enabledChanged) {
            this.hoverAnimationNeedsUpdate = true;
            this.lastClickable = clickable;
            this.lastHovering = this.hovering;
        }

        if (this.mouseDownButtonAnimationId !== null) {
            // Wait until mouseDown animation is finished.
        } else if (this.clickAnimationQueued) {
            this.clickAnimationQueued = false;
            this.startClickAnimation();
        } else if (this.clickButtonAnimationId) {
            // Wait until click animation is finished.
        } else if (this.gemGainDelayId !== null) {
            // Wait until gem gain is finished.
        } else if (this.enabledAnimationQueued) {
            this.enabledAnimationQueued = false;
            this.startEnabledAnimation();
        } else if (this.enabledAnimationPlaying) {
            // Wait until enabled animation is finished.
        } else if (this.hoverAnimationNeedsUpdate) {
            this.hoverAnimationNeedsUpdate = false;
            var fadeValue = (clickable && this.enabled && this.hovering) ? 1.0 : 0.0;
            this.startHoverFadeAnimation(fadeValue);
        }
    },

    startEnabledAnimation: function () {
        if (this.enabledButtonFadeAnimationId !== null
            || this.enabledIconFadeAnimationId !== null
            || this.enabledFadeInDelayId !== null) {
            this.cancelEnabledAnimation();
        }
        this.enabledAnimationPlaying = true;
        this.$buttonBackground.css('opacity', 0);
        this.$moveIcon.css('opacity', 0);
        this.$plaque.toggleClass('show-ready', !this.greenroomMode);
        if (!this.greenroomMode) {
            this.imvu.call('playSound', 'power_move_ready');
        }
        this.$plaque.addClass('ready');
        this.$plaque.toggleClass('frozen', this.frozen);
        var delay = new DelayedCall(this.startEnabledFadeIn.bind(this), ENABLED_FADE_IN_DELAY_MSEC);
        this.enabledFadeInDelayId = this.animator.add(delay);
    },


    startEnabledFadeIn: function () {
        var onComplete = function () {
            this.enabledAnimationPlaying = false;
            this.update();
        }.bind(this);
        var buttonFadeAnimation = new FadeAnimation(this.$buttonBackground[0], 0.0, 1.0, ENABLED_FADE_IN_MSEC, onComplete);
        this.enabledButtonFadeAnimationId = this.animator.add(buttonFadeAnimation);
        var iconFadeAnimation = new FadeAnimation(this.$moveIcon[0], 0.0, 1.0, ENABLED_FADE_IN_MSEC);
        this.enabledIconFadeAnimationId = this.animator.add(iconFadeAnimation);
    },

    cancelEnabledAnimation: function () {
        if (this.enabledButtonFadeAnimationId !== null) {
            this.animator.remove(this.enabledButtonFadeAnimationId);
            this.enabledButtonFadeAnimationId = null;
        }
        if (this.enabledIconFadeAnimationId !== null) {
            this.animator.remove(this.enabledIconFadeAnimationId);
            this.enabledIconFadeAnimationId = null;
        }
        if (this.enabledFadeInDelayId !== null) {
            this.animator.remove(this.enabledFadeInDelayId);
            this.enabledFadeInDelayId = null;
        }
        this.enabledAnimationPlaying = false;
    },

    startGemGainAnimation: function () {
        if (this.gemGainDelayId) {
            this.cancelGemGainAnimation();
        }
        this.gainPulseCount = 0;
        this.preGemGainCount = this.lastShownGemCount;
        this.shownGemCount = 0;
        this.stepGemGainState();
        this.gemGainDelayId = this.animator.add(new DelayedCall(this.updateGemGainAnimation.bind(this), GEM_GAIN_PULSE_MSEC));
    },

    cancelGemGainAnimation: function () {
        if (this.gemGainDelayId !== null) {
            this.animator.remove(this.gemGainDelayId);
            this.gemGainDelayId = null;
        }
        this.$plaque.removeClass('pulse');
        this.$plaque.removeClass('gaining');
    },
     
    updateGemGainAnimation: function () {
        this.stepGemGainState();
        this.update();

        // If gem gain update is still active, reset the delay.
        if (this.gemGainDelayId !== null) {
            this.animator.remove(this.gemGainDelayId);
            this.gemGainDelayId = this.animator.add(new DelayedCall(this.updateGemGainAnimation.bind(this), GEM_GAIN_PULSE_MSEC));
        }
    },

    stepGemGainState: function () {
        if (this.gainPulseCount < 5) {
            this.$plaque.addClass('gaining');
            this.gainPulseCount++;
            this.$plaque.toggleClass('pulse', this.gainPulseCount % 2 === 1);
        } else if (this.shownGemCount < this.lastUpdatedGemCount) {
            if (this.$plaque.hasClass('gaining')) {
                this.$plaque.removeClass('gaining');
                this.shownGemCount = this.preGemGainCount;
            } else {
                this.shownGemCount++;
            }
        } else {
            this.cancelGemGainAnimation();
        }
    },

    updateMask: function (pieSlices) {
        var sweepAngle;
        if (this.moveCost <= 0) {
            sweepAngle = 0;
        } else {
            sweepAngle = pieSlices * Math.PI * 2.0 / this.moveCost;
        }

        var startAngle = sweepAngle - Math.PI / 2.0;
        var endAngle = Math.PI * 2.0 - Math.PI / 2.0;

        var ctx = this.ctx;
        var width = this.$mask[0].width;
        var radius = width / 2;
        ctx.clearRect(0, 0, width, width);
        ctx.fillStyle = "rgba(0, 0, 0, .4)";
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startAngle, endAngle, false);
        ctx.closePath();
        ctx.fill();
    },

    updateName: function () {
        if (this.$name.text() !== this.moveName) {
            this.$name.text(this.moveName);
        }
    },

    GEM_CLASS_LOOKUP: {
        'b': 'blue',
        'g': 'green',
        'r': 'red',
        'p': 'pink',
        'y': 'yellow'
    },

    updateColor: function () {
        var colorClass = this.GEM_CLASS_LOOKUP[this.colorId];
        if (!this.$plaque.hasClass(colorClass)) {
            for (var key in this.GEM_CLASS_LOOKUP) {
                if (this.GEM_CLASS_LOOKUP.hasOwnProperty(key)) {
                    colorClass = this.GEM_CLASS_LOOKUP[key];
                    this.$plaque.toggleClass(colorClass, this.colorId === key);
                }
            }
        }
    },

    startHoverFadeAnimation: function (target) {
        if (this.hoverAnimationId !== null) {
            this.cancelHoverAnimation();
        }
        this.hoverAnimationId = this.addFadeToAnimation(this.$glowHover, target, 1.0 / GLOW_HOVER_FADE_MSEC);
    },

    cancelHoverAnimation: function () {
        if (this.hoverAnimationId !== null) {
            this.animator.remove(this.hoverAnimationId);
            this.hoverAnimationId = null;
        }
    },
    
    handleMouseOverGemCount: function (event) {
        if (this.greenroomMode) {
            return false;
        }
        if ( this.$tooltip.css('display') !== 'none' ) {
            this.$tooltip.hide();
            this.$gemtooltip.show();
        } else {
            if ( this.tooltipAnimation ) {
                this.animator.remove(this.tooltipAnimation);
            }
            this.tooltipAnimation = this.animator.add(new DelayedCall(function() { this.$plaque.find('.gemtooltip').show(); }.bind(this), 500));
        }
    },

    handleMouseOutGemCount: function (event) {
        if ( this.$gemtooltip.css('display') !== 'none' ) {
            this.$gemtooltip.hide();
            this.$tooltip.show();
        }
        if ( this.tooltipAnimation ) {
            this.animator.remove(this.tooltipAnimation);
            this.tooltipAnimation = this.animator.add(new DelayedCall(function() { this.$plaque.find('.tooltip').show(); }.bind(this), 500));
        }
    },
    
    handleMouseOver: function (event) {
        if (this.mouseOverHandler) {
            this.clearHoverEffects();
            this.mouseOverHandler(this, true);
        } else {
            this.tooltipAnimation = this.animator.add(new DelayedCall(function() { this.$plaque.find('.tooltip').show(); }.bind(this), 500));
            this.hovering = true;
            this.update();
        }
    },

    handleMouseOut: function () {
        this.clearHoverEffects();
        if (this.mouseOverHandler) {
            this.mouseOverHandler(this, false);
        }
        this.update();
    },

    clearHoverEffects: function() {
        this.$tooltip.hide();
        this.$gemtooltip.hide();
        if ( this.tooltipAnimation ) {
            this.animator.remove(this.tooltipAnimation);
            this.tooltipAnimation = null;
        }
        this.hovering = false;
    },

    handleMouseDown: function () {
        if (this.isClickable()) {
            this.startMouseDownAnimation();
        }
    },

    startMouseDownAnimation: function () {
        this.cancelMouseDownAnimation();
        this.cancelHoverAnimation();

        var callback = function () {
            this.mouseDownButtonAnimationId = null;
            this.update();
        }.bind(this);
        if (!this.greenroomMode) {
            this.mouseDownGlowAnimationId = this.addFadeToAnimation(this.$glowHover, 0.5, 1.0 / (GLOW_HOVER_FADE_MSEC * 2.0));
            this.mouseDownButtonAnimationId = this.addFadeToAnimation(this.$buttonBackground, 0.5, 1.0 / (GLOW_HOVER_FADE_MSEC * 2.0), callback);
        }
    },

    cancelMouseDownAnimation: function () {
        if (this.mouseDownGlowAnimationId !== null) {
            this.animator.remove(this.mouseDownGlowAnimationId);
            this.mouseDownGlowAnimationId = null;
        }
        if (this.mouseDownButtonAnimationId !== null) {
            this.animator.remove(this.mouseDownButtonAnimationId);
            this.mouseDownButtonAnimationId = null;
        }
    },

    startClickAnimation: function () {
        this.cancelMouseDownAnimation();
        this.cancelClickAnimation();
        this.cancelFadingAnimation();

        this.$plaque.addClass('fading');
        var callback = this.startMouseClickAnimationPart2.bind(this);
        this.clickButtonAnimationId = this.addFadeToAnimation(this.$buttonBackground, 1.0, 1.0 / (GLOW_HOVER_FADE_MSEC * 2), callback);
        this.clickGlowAnimationId = this.addFadeToAnimation(this.$glowHover, 1.0, 1.0 / (GLOW_HOVER_FADE_MSEC * 2));

        this.fadingPulseCount = 0;
        this.updateFadingAnimation();
    },

    startMouseClickAnimationPart2: function () {
        var target = 0;
        var callback = function () {
            this.clickButtonAnimationId = null;
            this.clickGlowAnimationId = null;
            this.clickIconAnimationId = null;
            this.lastEnabled = false;
            this.update();
        }.bind(this);
        this.clickButtonAnimationId = this.addFadeToAnimation(this.$buttonBackground, target, 1.0 / GLOW_HOVER_FADE_MSEC, callback);
        this.clickGlowAnimationId = this.addFadeToAnimation(this.$glowHover, target, 1.0 / GLOW_HOVER_FADE_MSEC);
        this.clickIconAnimationId = this.addFadeToAnimation(this.$moveIcon, target, 1.0 / GLOW_HOVER_FADE_MSEC);
    },

    cancelClickAnimation: function () {
        if (this.clickButtonAnimationId !== null) {
            this.animator.remove(this.clickButtonAnimationId);
            this.clickButtonAnimationId = null;
        }
        if (this.clickGlowAnimationId !== null) {
            this.animator.remove(this.clickGlowAnimationId);
            this.clickGlowAnimationId = null;
        }
        if (this.clickIconAnimationId !== null) {
            this.animator.remove(this.clickIconAnimationId);
            this.clickIconAnimationId = null;
        }
    },

    cancelFadingAnimation: function () {
        if (this.fadingPulseDelayId !== null) {
            this.animator.remove(this.fadingPulseDelayId);
            this.fadingPulseDelayId = null;
        }
    },

    updateFadingAnimation: function () {
        if (this.fadingPulseCount < 5) {
            this.fadingPulseCount++;
            this.$plaque.toggleClass('pulse', this.fadingPulseCount % 2 === 1);

            this.fadingPulseDelayId = this.animator.add(new DelayedCall(this.updateFadingAnimation.bind(this), GEM_FADING_PULSE_MSEC));
        } else {
            this.$plaque.removeClass('fading');
            this.cancelFadingAnimation();
        }
    },

    freeze: function() {
        if (this.frostAnimationId !== null) {
            this.animator.remove(this.frostAnimationId);
        }
        this.frostAnimationId = this.addFadeToAnimation(this.$frost, 1.0, 1.0 / FROST_FADE_MSEC);
        this.frozen = true;
        this.$ready.html('FROZEN!');
        this.$plaque.addClass('frozen');
    },

    thaw: function() {
        if (this.frostAnimationId !== null) {
            this.animator.remove(this.frostAnimationId);
        }
        this.frostAnimationId = this.addFadeToAnimation(this.$frost, 0.0, 1.0 / FROST_FADE_MSEC);
        this.frozen = false;
        this.$ready.html('READY!');
        this.$plaque.removeClass('frozen');
    },

    mark: function(mark) {
        this.$plaque.toggleClass('marked', mark);
    },

    isMarked: function() {
        return this.$plaque.hasClass('marked');
    },

    addFadeToAnimation: function ($el, target, speed, callback) {
        var animation = new FadeToAnimation($el[0], target, speed, callback);
        return this.animator.add(animation);
    },

    handleClick: function () {
        if (this.isClickable()) {
            this.$plaque.find('.tooltip, .gemtooltip').hide();
            if ( this.tooltipAnimation ) {
                this.animator.remove(this.tooltipAnimation);
                this.tooltipAnimation = null;
            }
            if (!this.greenroomMode) {
                this.clickAnimationQueued = true;
                this.update();
            }
            if (this.overriddenClickHandler) {
                this.overriddenClickHandler(this);
            } else {
                this.clickHandler(this);
            }
        }
    },

    isClickable: function () {
        return (!this.frozen
                && this.$plaque.hasClass('is-current-player')
                && this.$plaque.hasClass('left')
                && this.$plaque.hasClass('enabled'));
    }
};

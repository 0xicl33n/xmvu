function WalkOffCountdown(imvu, $countdown, animator) {
    this.imvu = imvu;
    this.$countdown = $countdown;
    this.animator = animator;

    this.$ones = this.$countdown.children('.number.ones');
    this.$tens = this.$countdown.children('.number.tens');

    this.$transition = this.$countdown.find('.transition');
    this.$transitionOnes = this.$transition.find('.number.ones');
    this.$transitionTens = this.$transition.find('.number.tens');

    this.timeLeft = null;
    this.updateAnimId = null;
    this.warningSoundAnimId = null;
    this.transitionAnimIds = [];
    this.transitionDelayId = null;
}

WalkOffCountdown.prototype = {
    TRANSITION_MSEC: 400,
    WARNING_OFFSET_MSEC: 700,

    start: function (countdownTime) {
        var playTimerWarningSound = function () {
            this.imvu.call('playSound', 'timer_warning');
        }.bind(this);

        var updateTimerNumbers = function ($ones, $tens, time) {
            var clampedTime = Math.floor(Math.min(99, Math.max(time, 0)));
            var ones = clampedTime % 10;
            var tens = (Math.floor(clampedTime / 10)) % 10;

            $ones.removeClass().addClass('number ones digit_' + ones);
            $tens.removeClass().addClass('number tens digit_' + tens);
        };

        var startTransition = function () {
            updateTimerNumbers(this.$transitionOnes, this.$transitionTens, this.timeLeft);
            updateTimerNumbers(this.$ones, this.$tens, this.timeLeft - 1);
            this.$transition.show();
            this.transitionAnimIds = [];
            this.$transition.each(function (i, el) {
                this.transitionAnimIds.push(this.animator.add(new FadeAnimation(el, 1, 0, this.TRANSITION_MSEC)));
            }.bind(this));
        }.bind(this);

        var durationMsecs = countdownTime * 1000;
        var updateCountdown = function (elapsedMsecs) {
            var timeLeftMsecs = durationMsecs - elapsedMsecs;
            var newTimeLeft = Math.ceil(timeLeftMsecs / 1000);

            if (newTimeLeft !== this.timeLeft) {
                this.timeLeft = newTimeLeft;
                updateTimerNumbers(this.$ones, this.$tens, this.timeLeft);

                if (this.timeLeft <= 0) {
                    this.stop();
                } else {
                    if (this.transitionDelayId !== null) {
                        this.animator.remove(this.transitionDelayId);
                    }
                    this.transitionDelayId = this.animator.add(new DelayedCall(startTransition, 1000 - this.TRANSITION_MSEC));

                    // NOTE: it is possible to miss the sound playback if the
                    // callback isn't made during the right second.  But playing it
                    // a second late isn't helpful.
                    if (this.timeLeft === 3) {
                        this.warningSoundAnimId = this.animator.add(new DelayedCall(playTimerWarningSound, this.WARNING_OFFSET_MSEC));
                    }
                }
            }
        }.bind(this);

        this.$transition.hide();
        this.timeLeft = null; // to force display refresh
        updateCountdown(0);
        this.updateAnimId = this.animator.add(new PerFrameCall(updateCountdown, durationMsecs));
    },

    stop: function () {
        _.each(['updateAnimId', 'warningSoundAnimId', 'transitionDelayId'], function (id) {
            if (this[id] !== null) {
                this.animator.remove(this[id]);
                this[id] = null;
            }
        }.bind(this));

        _.each(this.transitionAnimIds, function (id) {
            this.animator.remove(id);
        }.bind(this));
        this.transitionAnimIds = [];
    }
};

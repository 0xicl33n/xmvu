(function() {

    function Animation(element, setValueFunc, interpolateFunc, startValue, endValue, duration, onComplete) {
        this.element = element;
        this.setValueFunc = setValueFunc;
        this.interpolateFunc = interpolateFunc;
        this.startValue = startValue;
        this.endValue = endValue;

        this.duration = Math.max(0, duration);
        this.frameNumber = 0;
        this.onComplete = onComplete;

        this.setValueFunc(element, startValue);
    }

    Animation.prototype.onFrame = function (delta) {
        this.frameNumber = Math.min(this.frameNumber + delta, this.duration);

        var proportion = this.frameNumber / this.duration;
        var value = this.interpolateFunc(this.startValue, this.endValue, proportion);
        this.setValueFunc(this.element, value);

        return this.frameNumber < this.duration;
    };


    // Interpolation functions

    function lerpScalar(start, end, proportion) {
        var swing = end - start;
        return swing * proportion + start;
    }

    function lerpPoint(start, end, proportion) {
        return [
            lerpScalar(start[0], end[0], proportion),
            lerpScalar(start[1], end[1], proportion)
        ];
    }

    function easeInPoint(start, end, proportion) {
        var tSquared = proportion * proportion;
        return [
            start[0] + (end[0] - start[0]) * tSquared,
            start[1] + (end[1] - start[1]) * tSquared
        ];
    }

    function lerpMultiPoint(starts, ends, proportion) {
        var values = [];
        var count = starts.length;
        for (var i = 0; i < count; i++) {
            values.push(lerpPoint(starts[i], ends[i], proportion));
        }
        return values;
    }

    function easeInMultiPoint(starts, ends, proportion) {
        var values = [];
        var count = starts.length;
        for (var i = 0; i < count; i++) {
            values.push(easeInPoint(starts[i], ends[i], proportion));
        }
        return values;
    }


    // Value-setting functions

    function setPosition(element, value) {
        element.style.left = Math.round(value[0]) + 'px';
        element.style.top = Math.round(value[1]) + 'px';
    }

    function setMultiPosition(elements, values) {
        var count = elements.length;
        for (var i = 0; i < count; i++) {
            elements[i].style.left = Math.round(values[i][0]) + 'px';
            elements[i].style.top = Math.round(values[i][1]) + 'px';
        }
    }

    function setOpacity(element, value) {
        element.style.opacity = value;
    }

    function setScale(element, value) {
        element.style['MozTransform'] = 'scale(' + value + ')';
    }


    function EaseInMoveMultiAnimation(elements, startPoses, endPoses, duration, onComplete) {
        var setValueFunc = setMultiPosition;
        var interpolateFunc = easeInMultiPoint;
        return new Animation(elements, setValueFunc, interpolateFunc, startPoses, endPoses, duration, onComplete);
    }

    function MoveAnimation(element, startPose, endPose, duration, onComplete) {
        var setValueFunc = setPosition;
        var interpolateFunc = lerpPoint;
        return new Animation(element, setValueFunc, interpolateFunc, startPose, endPose, duration, onComplete);
    }

    function FadeAnimation(element, startOpac, endOpac, duration, onComplete) {
        var setValueFunc = setOpacity;
        var interpolateFunc = lerpScalar;
        return new Animation(element, setValueFunc, interpolateFunc, startOpac, endOpac, duration, onComplete);
    }

    function FadeToAnimation(element, targetOpac, speed, onComplete) {
        var startOpac = 1.0;
        if (element.style.opacity !== '') {
            startOpac = parseFloat(element.style.opacity);
        }
        var duration = Math.abs(targetOpac - startOpac) / speed;
        return FadeAnimation(element, startOpac, targetOpac, duration, onComplete);
    }

    function ScaleAnimation(element, startScale, endScale, duration, onComplete) {
        // if we introduce another transform animation (say, rotate) this will need to be smarter
        // alternately, just make ScaleAnimation into a TransformAnimation and animate them all
        // together

        element.style['MozTransformOrigin'] = '50% 50%';

        var setValueFunc = setScale;
        var interpolateFunc = lerpScalar;
        return new Animation(element, setValueFunc, interpolateFunc, startScale, endScale, duration, onComplete);
    }

    function DelayedCall(callback, wait) {
        this.frameNumber = 0;
        this.firstCall = true;
        this.onComplete = callback;
        this.duration = wait;
    }
    
    DelayedCall.prototype.onFrame = function(delta) {
        if (this.firstCall) {
            this.frameNumber = 0;
            this.firstCall = false;
        } else {
            this.frameNumber = Math.min(this.frameNumber + delta, this.duration);
        }
        return this.frameNumber < this.duration;
    };
    
    function PerFrameCall(callback, duration, onComplete) {
       this.frameNumber = 0;
       this.firstCall = true;
       this.duration = duration;
       this.callback = callback;
       this.onComplete = onComplete;
    }
    
    PerFrameCall.prototype.onFrame = function(delta) {
        if (this.firstCall) {
            this.frameNumber = 0;
            this.firstCall = false;
        } else {
            this.frameNumber = Math.min(this.frameNumber + delta, this.duration);
        }
        this.callback(this.frameNumber);
        
        return this.frameNumber < this.duration;
    };
    

    function Animator(frameTimer) {
        this.frameTimer = frameTimer;
        this.animations = new IdSet();
        this.timerId = this.frameTimer.addCallback(this.tick.bind(this));
    }

    Animator.prototype.add = function(animation) {
        return this.animations.add(animation);
    };

    Animator.prototype.remove = function(id) {
        this.animations.remove(id);
    };

    Animator.prototype.finishAll = function() {
        var e = this.animations.elements;
        for (var k in e) {
            if ('firstCall' in e[k]) {
                e[k].firstCall = false;
            }
            e[k].frameNumber = e[k].duration;
        }
    };

    Animator.prototype.removeAll = function() {
        this.animations.clear();
    };

    Animator.prototype.tick = function(timeDelta) {
        var e = this.animations.elements;
        var killList = [];

        for (var k in e) {
            if (!e.hasOwnProperty(k)) {
                continue;
            }
            var keepGoing = e[k].onFrame(timeDelta);
            if (!e.hasOwnProperty(k)) {
                // the element may have removed itself in its onFrame callback.
                continue;
            }

            if (!keepGoing) {
                if (e[k].onComplete) {
                    e[k].onComplete();
                }
                killList.push(k);
            }
        }

        for (var index = 0; index < killList.length; ++index) {
            this.animations.remove(killList[index]);
        }
    };

    window.Animator = Animator;
    window.MoveAnimation = MoveAnimation;
    window.EaseInMoveMultiAnimation = EaseInMoveMultiAnimation;
    window.FadeAnimation = FadeAnimation;
    window.FadeToAnimation = FadeToAnimation;
    window.ScaleAnimation = ScaleAnimation;
    window.PerFrameCall = PerFrameCall;
    window.DelayedCall = DelayedCall;
})();

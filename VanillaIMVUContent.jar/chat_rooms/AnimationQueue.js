function AnimationQueue(args) { 
    this.$el = args.$el;
    this.time = args.time;
    this.states = new Array();
    this.transitionTimes = new Array();
    this.currentState = 0;
    this.animating = false;
    this.animationId = 0;
    this.getNow = function() { 
        return this.time.getNow()*1000;
    }.bind(this);
}

AnimationQueue.prototype = {
    start: function() { 
        this._animateToNextState(true);
    },
    revert: function() { 
        this._animateToNextState(false);
        return;
    },
    _animateToNextState: function(forward) { 
        var previousDirection = this.currentDirection;
        var reversing = false;
        this.currentDirection = forward;
        if(this.animating && previousDirection == this.currentDirection) { 
            return;
        }
        if(previousDirection != this.currentDirection) { 
            reversing = true;
        }
        if((forward && this.currentState == this.states.length-1) ||
            (!forward && this.currentState == 0)) { 
            return;
        }
        var currentState = this.states[this.currentState];
        this.currentState += (forward)?1:-1;
        var nextState = this.states[this.currentState];
        var selectorsToAnimate = _.intersection(_.keys(currentState), _.keys(nextState));
        var allSelectors = _.map(this.states, _.keys.bind(_));
        if(reversing) { 
            _.each(allSelectors, function(selector) { 
                this.$el.find(selector).stop(true);
            }.bind(this));
        }

        var numMatches = function(selector) { 
            return this.$el.find(selector).length;
        }.bind(this);
        var numSelectors = _.reduce(selectorsToAnimate, function(memo, selector) { 
            return memo + numMatches(selector);
        });

        var nextAnimation = function(animationId) { 
            if(animationId != this.animationId){
                return; //this animation was cancelled
            } 
            if(--numSelectors) return; //wait until all selectors are completely animated
            this.startTime = null;
            this.animating = false;
            this._animateToNextState(forward);
        }.bind(this);
        var duration = this.transitionTimes[this.currentState-((forward)?1:0)];
        if(this.animating && reversing) { 
            var endTime = this.getNow();
            var offset = endTime - this.startTime;
            duration = offset;
        }
        this.startTime = this.getNow();
        this.animating = true;
        this.animationId++;
        _.each(selectorsToAnimate, function(selector) { 
            this.$el.find(selector).animate(nextState[selector],{
                duration: duration,
                complete: nextAnimation.bind(null, this.animationId),
                easing:'linear'
            });
        }.bind(this));

    },
}
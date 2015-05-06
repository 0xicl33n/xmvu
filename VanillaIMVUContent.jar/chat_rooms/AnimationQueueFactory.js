function AnimationQueueFactory(args) { 
    if(!args.animationQueue) {
        this.$el = args.$el;
        this.animationQueue = new AnimationQueue({
            $el: args.$el,
            time: args.time
        });
        this.writingScript = false;
    } else { 
        this.animationQueue = args.animationQueue;
        this.$el = this.animationQueue.$el;
    }
}

AnimationQueueFactory.prototype = {
    writeScript: function() { 
        this.writingScript = true;
        this.goToState(0);
        return this;
    },
    animateTo: function(selector, state) { 
        var i = this.stateIndex;
        var knownState = false;
        while(i > 0) {
            if(this.animationQueue.states[i].hasOwnProperty(selector)) {
                knownState = true;
                break;
            }
            i--;
        }

        if(!knownState) { 
            var currentState = this.extractCurrentState(selector,_.keys(state));
            if(!this.animationQueue.states[this.stateIndex]) this.animationQueue.states[this.stateIndex] = {};
            this.animationQueue.states[this.stateIndex][selector] = currentState;
        }
        if(!this.animationQueue.states[this.stateIndex+1]) {
            this.animationQueue.states[this.stateIndex+1] = {};
        }
        this.animationQueue.states[this.stateIndex+1][selector] = state;
        return this;
    }, 

    _in: function(seconds) { 
        this.animationQueue.transitionTimes[this.stateIndex] = seconds;
        return this;
    },

    then: function() { 
        this.goToState(this.stateIndex+1);
        return this;
    },

    goToState: function(state) { 
        this.stateIndex = state;
        while(this.animationQueue.transitionTimes.length < this.stateIndex) { 
            this.animationQueue.transitionTimes.push(1000);
            this.animationQueue.states.push({});
        }
        return this;
    },

    finish: function() {
        this.writingScript = false;
        return this.animationQueue;
    },

    extractCurrentState: function(selector,attributes) { 
        var originalStyle = {};
        _.each(attributes, function(attr) {
            originalStyle[attr] = this.$el.find(selector).css(attr);
        }.bind(this));
        return originalStyle;
    }
}
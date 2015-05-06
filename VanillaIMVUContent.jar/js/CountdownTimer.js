function CountdownTimer( baseEl, timeInSeconds, timer ) {
    this.timer = timer || new Timer();
    this.timeInSeconds = timeInSeconds || false;
    this.baseEl = baseEl;
    this._tickIntervalId = this.timer.setInterval(this.tick.bind(this), 1000);
    
    this.CountdownTimerStartedEvent = new YAHOO.util.CustomEvent('CountdownTimerStartedEvent', this);    
    this.CountdownTimerEndedEvent = new YAHOO.util.CustomEvent('CountdownTimerEndedEvent', this);    
}

CountdownTimer.prototype = {

    setTime: function(t) {
    
        if( t > 0 && !this.timeInSeconds ) {
            this.CountdownTimerStartedEvent.fire();
        }
    
        this.timeInSeconds = t;
    },
    
    getFormattedTime: function() {
        return this._getHours()+":"+this._getMinutes()+":"+this._getSeconds();
    },
    
    render: function() {
        this.baseEl.innerHTML = this.getFormattedTime();
    },
    
    tick: function() {
        if( this.timeInSeconds ) {
            this.timeInSeconds--;
            
            if( !this.timeInSeconds ) {
                this.CountdownTimerEndedEvent.fire();    
            }
            
            this.render();
        }
    },
    
    isDone: function() {
        return !this.timeInSeconds;
    },
    
    _format: function(t) {
        if(!t) {
            return '00';
        }
        
        if(t<=9) {
            return '0'+t;
        }
        
        return t;
    },

    _getSeconds: function() {
    
        if( !this.timeInSeconds ) {
            return '--';
        }
    
        return this._format(this.timeInSeconds % 60);
    },
    
    _getMinutes: function() {
    
        if( !this.timeInSeconds ) {
            return '--';
        }
        
        var tmp = parseInt((this.timeInSeconds%3600)/60,10);
        
        if( this.timeInSeconds < 60 || tmp >= 60 ) {
            return '00';
        }
        
        return this._format(tmp);
    },    
    
    _getHours: function() {
    
        if( !this.timeInSeconds ) {
            return '--';
        }
        
        if( this.timeInSeconds < 3600 ) {
            return '00';
        }
        
        return this._format(parseInt(this.timeInSeconds/3600,10));
    }
};
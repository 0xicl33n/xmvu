function BlueBarController( rootElement, network, imvu, timer) {
    var self = this;
    
    this.timer = timer || new Timer();
    this.network = network;
    this.imvu = imvu;
    this.rootElement = rootElement;
    this.messageList = [];
    this.curMsgIdx = null;
    this.newCurMsgIdx = false;
    this.isMarqueeing = false;
    this._buttonlock = false;
    
    this.serviceUrl  = '/api/promotions.php';
        
   
    this.bufferElement = new YAHOO.util.Element('hidden_msg_buffer');
    this.rootElement.innerHTML = '<div id="hidden_msg_buffer"></div><div id="bb_msg_wrapper"><div id="bb_msg"></div></div><div id="bb_count"></div><div id="bb_left"></div><div id="bb_right"></div><div id="bb_close"></div>';
        
    YAHOO.util.Event.on('bb_left', 'click', this.doClickLeft, this, true);
    YAHOO.util.Event.on('bb_right', 'click', this.doClickRight, this, true);
    YAHOO.util.Event.on('bb_close', 'click', this.doClickClose, this, true);
    
    this.MOVE_TIME = 0.5;
    this.SLIDE_TIME = 0.3;
    this.MARQUEE_TIME = 60.0;
    this.MARQUEE_DELAY = 3.0;
    this.AUTOSCROLL_TIME = 30.0;

    var animate_in_attributes = {
        height: { from: 0, to: 20, unit: 'px' }
    };
    this.anim_in = new YAHOO.util.Anim(this.rootElement, animate_in_attributes, this.MOVE_TIME);
    this.anim_in.onComplete.subscribe(this._show.bind(this));
    
    var animate_out_attributes = {
        height: { from: 20, to: 0, unit: 'px' }
    };
    this.anim_out = new YAHOO.util.Anim(this.rootElement, animate_out_attributes, this.MOVE_TIME);
    this.anim_out.onComplete.subscribe(this._hide.bind(this));


    var slide_in_attributes = {
        left: { from: 1000, to: 0, unit: 'px' }
    };
    var slide_out_attributes = {
        left: { to: -1000, unit: 'px' }
    };
    this.slide_in = new YAHOO.util.Anim('bb_msg', slide_in_attributes, this.SLIDE_TIME);
    this.slide_in.onComplete.subscribe(this.stopMarquee.bind(this));

    function onResize() {
        var countXy = YAHOO.util.Dom.getXY('bb_count');

        if( countXy[0] === 0 ) { //uninitialized
            return;
        }

        var bufferWidth = parseInt(YAHOO.util.Dom.getStyle('hidden_msg_buffer','width'),10);
        var wrapWidth = YAHOO.util.Dom.getStyle('bb_msg_wrapper','width');

        var msg_max = countXy[0] - 30; // the x-position of the count div, minus some buffer
        YAHOO.util.Dom.setStyle('bb_msg_wrapper','width', ''+msg_max+'px' );

        var node = YAHOO.util.Dom.get('bb_msg');

        if( bufferWidth > msg_max ) {
            this.doMarquee(true,msg_max-bufferWidth-100);
        } else {
            this.doMarquee(false);
        }
    }

    this.slide_in.onComplete.subscribe(onResize.bind(this));
    this.slide_in.onComplete.subscribe(this.unlockButtons.bind(this));
    this.slide_out = new YAHOO.util.Anim('bb_msg', slide_out_attributes, this.SLIDE_TIME);    
    this.slide_out.onComplete.subscribe(this._completeUpdateDisplay.bind(this));

    window.onresize = onResize.bind(this);

    this.hide();
}

BlueBarController.prototype = {

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

    getMessages : function() {
        var self = this;
        var cb = {
            success: function(result) {
                if(result === null || "error" in result) {
                    IMVU.log("Error hiding bluebar message:");
                    IMVU.log(result);
                }
                else {
                    self.receivedMessages(result);
                }
            },
            failure: function(result) {
                IMVU.log("Error hiding bluebar message:");
                IMVU.log(result);
            }
        };
        this._serviceRequest({
            method: 'GET',
            uri: this.serviceUrl + '?cid=' + this.imvu.call('getCustomerId') + '&version=2',
            callback: cb
        });
    },
    
    areButtonsLocked : function() {
        return this._buttonlock;
    },
    
    unlockButtons : function() {
        this._buttonlock = false;
    },
    
    lockButtons : function() {
        this._buttonlock = true;
    },
    
    resetAutoscroll : function(timeout) {
        if(!timeout) {
            timeout = this.AUTOSCROLL_TIME;
        }
        
        if( this.autoscrollTimerId ) {
            this.timer.clearTimeout(this.autoscrollTimerId);
        }
        
        this.autoscrollTimerId = this.timer.setTimeout(this.doClickRight.bind(this), 1000 * timeout);
    },
    
    hideMessage : function(message) {
        var cb = {
            success: function() {},
            failure: function(o) {
                IMVU.log("Error hiding bluebar message:");
                IMVU.log(o);
            }
        };
        
        this._serviceRequest({
            method: 'POST',
            uri: this.serviceUrl,
            callback: cb,
            data : {'bluebar_hash':message}
        });
    },
    
    show : function() {
        if( this.rootElement.style.display != 'block' ) {
            this.rootElement.style.height = '0px';
            this.rootElement.style.display = 'block';
            
            this.anim_in.animate();
            
        }
        this._show();
        return true;
    },
    
    _show : function() {
        this.toggleButtons(true);
        this._updateDisplay(0);
    },

    hide : function() {
        this.toggleButtons(false);
    
        if( this.rootElement.style.display != 'none' ) {
        
            this.anim_out.animate();

        }
    },
    
    _hide : function() {
        this.rootElement.style.display = 'none';
    },
    
    toggleButtons : function(show) {
        
        var mode = show ? 'block' : 'none';
        
        YAHOO.util.Dom.setStyle("bb_count", "display", mode);
        YAHOO.util.Dom.setStyle("bb_left", "display", mode);
        YAHOO.util.Dom.setStyle("bb_right", "display", mode);
        YAHOO.util.Dom.setStyle("bb_close", "display", mode);        
    },
    
    receivedMessages : function( json ) {
        if( json ) {
            this.newCurMsgIdx = false;
            this.messageList = [];
            
            if(json.sitewide_promo &&
                (json.sitewide_promo.banner_url && json.sitewide_promo.link)) {
                    this.imvu.call("showSledgehammer", {
                            'banner_url': json.sitewide_promo.banner_url,
                            'link': json.sitewide_promo.link
                        });
            }
            else {
                this.imvu.call("hideSledgehammer");
            }
        
            for(var category in json.blue_bars_with_hashes) {
                for each(var blue_bar in json.blue_bars_with_hashes[category]) {
                    this.messageList.push(blue_bar);
                }
            }
            if( this.messageList.length === 0 ) {
                this.curMsgIdx = null;
                this.hide();
            } else {
                this.curMsgIdx = 0;
                this.turnOn();
                this.resetAutoscroll();
                this.updateCountDisplay();
            }
            
        }
    },
        
    _updateDisplay : function( newCurMsgIdx ) {
        this.newCurMsgIdx = newCurMsgIdx;
        this.slide_out.animate();
    },
    
    _completeUpdateDisplay: function() {
        if( this.newCurMsgIdx === false ) {
            return;
        }
                
        this.curMsgIdx = this.newCurMsgIdx;
        
        var basenode = YAHOO.util.Dom.get('bb_msg');
        var buffer = YAHOO.util.Dom.get('hidden_msg_buffer');
        
        if( this.messageList.length ) {
            basenode.innerHTML = this.messageList[this.curMsgIdx].message;
            
            $(basenode).children().each(function (index, el) {
                $(el).removeAttr('style');
            });
            
            buffer.innerHTML = basenode.innerHTML;
        }

        IMVU.Client.util.turnLinksIntoLaunchUrls(basenode, this.imvu);
        IMVU.Client.util.turnLinksIntoLaunchUrls(buffer, this.imvu);
        
        this.updateCountDisplay();
        
        this.newCurMsgIdx = false;
        
        this.slide_in.animate();
    },
    
    updateCountDisplay: function() {
        var count = YAHOO.util.Dom.get('bb_count');
        count.innerHTML =  (this.curMsgIdx+1) + '/' + (this.messageList.length);
    },
    
    turnOn : function() {
        this.show();
    },
    
    _changeMessage : function(offset) {
    
        var newOffs = this.curMsgIdx;
    
        newOffs += offset;

        if( newOffs < 0 ) {
            newOffs = this.messageList.length-1;
        }
        
        if( newOffs >= this.messageList.length ) {
            newOffs = 0;
        }
        
        this._updateDisplay(newOffs);
         
        this.resetAutoscroll();
    },
    
    doClickLeft : function() {
        if( this.areButtonsLocked() ) {
            return;
        }
        
        this.lockButtons();
    
        this._changeMessage(-1);
    },
    
    doClickRight : function() {
        if( this.areButtonsLocked() ) {
            return;
        }
        
        this.lockButtons();
    
        this._changeMessage(1);
    },
    
    doClickClose : function() {
        if( this.areButtonsLocked() ) {
            return;
        }
        
        this.lockButtons();
    
        var hideMsg = this.messageList.splice(this.curMsgIdx,1)[0];
        if (hideMsg){
            this.hideMessage(hideMsg.message_hash);
        }
        
        if( this.messageList.length ) {
            this._changeMessage(0);
        } else {
            this.hide();
        }
    },
    
    doMarquee : function(turnOn, x2) {
        if( turnOn && !this.isMarqueeing ) {
        
            var self = this;
            this.marqueePauseTimer = this.timer.setTimeout(
                function() {
                    if( !x2 ) {
                        x2 = 0;
                    }
                    var marquee_left_attributes = {
                        left: { from: 0, to: x2, unit: 'px' }
                    };
                    var marquee_right_attributes = {
                        left: { from: x2, to: 0, unit: 'px' }
                    };

                    self.marquee1 = 
                        new YAHOO.util.Anim(
                            'bb_msg',
                            marquee_left_attributes,
                            self.MARQUEE_TIME/2
                        );
                    self.marquee2 = 
                        new YAHOO.util.Anim(
                            'bb_msg',
                            marquee_right_attributes,
                            self.MARQUEE_TIME/2
                        );

                    self.marquee1.onComplete.subscribe(function() { 
                        self.marquee2.animate(); 
                    });

                    self.marquee2.onComplete.subscribe(function() { 
                        self.marquee1.animate(); 
                    });

                    self.marquee1.animate();
                    self.isMarqueeing = true;
        
                    self.resetAutoscroll(self.MARQUEE_TIME);
                    self.timer.clearTimeout(self.marqueePauseTimer);
                    delete self.marqueePauseTimer;
                },
                1000 * self.MARQUEE_DELAY //pause
            );
        } 
        
        if( !turnOn && this.isMarqueeing ) {
            this.stopMarquee();
        }
    },
    
    stopMarquee : function() {
        if(this.marqueePauseTimer) {
            this.timer.clearTimeout(this.marqueePauseTimer);
        }
    
        if( this.marquee1 && this.marquee1.isAnimated() ) {
            this.marquee1.onComplete.unsubscribeAll();
            this.marquee1.stop(false);
        }
        
        if( this.marquee2 && this.marquee2.isAnimated() ) {
            this.marquee2.onComplete.unsubscribeAll();
            this.marquee2.stop(false);
        }
        
        YAHOO.util.Dom.setStyle('bb_msg', 'left', '0px');
        
        this.isMarqueeing = false;
    }
};

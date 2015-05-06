
/* jQuery ui.toaster.js - 0.2
 *
 * (c) Maxime Haineault <haineault@gmail.com>
 * http://haineault.com 
 * 
 * MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Inspired by experimental ui.toaster.js by Miksago (miksago.wordpress.com)
 * Thanks a lot.
 *
 **********************************************************
 * Edits to make fir into IMVU usecase - djohnson 2/2011
 **********************************************************
 * */

if ($.ui) {
    $.widget('ui.toaster', {
        options: {
            delay:    0,      // delay before showing (seconds)
            timeout:  8,      // time before hiding (seconds)
            width:    355,    // toast width in pixel
            position: 'br',   // tl, tr, bl, br
            showSpeed:   700, // animations speed
            closeSpeed:  600, // animations speed
            closable: false,   // allow user to close it
            sticky:   false,  // show until user close it
            onClose:  false,  // callback before closing
            onClosed: false,  // callback after closing
            onOpen:   false,  // callback before opening
            onOpened: false,  // callback after opening
            onHide:   false,  // callback when closed by user
            onAnimate: false,  //callback for each step of animation
            timer:  false, //inject timer so can test animations
            rootElement: 'body' //the root element to add the toast to, used for injection
            //For now hardcode the animations, but should extend this to allow user controlled animations
            //djohnson 2/2011
        },

        _init: function(){
            var self        = this;
            this.timer = self.options.timer || new Timer();
            
            var wrapper = '#ui-toaster-'+ self.options.position;

            if (!$(wrapper).get(0)) {
                $('<div />').attr('id', 'ui-toaster-'+ self.options.position).appendTo(self.options.rootElement);
            }

            self.toaster = $('<div style="display:none;" class="ui-toaster" />')
            .append($('<span class="ui-toaster-body" />').html($('<div />').append($(self.element))))
            .width(self.options.width)
            .hover(function(){ self.pause.apply(self);}, function(){ self.resume.apply(self);})
            [(self.options.position.match(/bl|br/)) ? 'prependTo': 'appendTo'](wrapper);
            // Closable
            if (self.options.closable) {
                self.toaster.addClass('ui-toaster-closable');
                if ($(self.toaster).find('.ui-toaster-close').length > 0) {
                    $('.ui-toaster-close', $(self.toaster)).click(function(){ self.hide.apply(self); });
                }
                else {
                    $(self.toaster).click(function(){ self.hide.apply(self); });
                }
            }

            // Sticky
            if (self.options.sticky) {
                $(self.toaster).addClass('ui-toaster-sticky');
            }
            else {
                self.resume();
            }

            // Delay
            if (!!self.options.delay) {
                this.timer.setTimeout(function(){
                    self.open.apply(self);
                }, self.options.delay * 1000);
            }
            else {
                self.open.apply(self);
            }
        },

        open: function() {
            var self = this;
            this.toaster.animate({height:'toggle'}
            ,{  duration: self.options.speed,
                easing: 'easeInBack',
                step: function() { 
                    if(self.options.onAnimate) self.options.onAnimate(self.toaster);
                },
                complete: function() {
                    if (self.options.onOpened) self.options.onOpened(self.toaster);
                }
            }
            );
        },

        hide: function(){
            if (this.options.onHide) this.options.onHide.apply(this.toaster);
            this.close(this.options.hide);
        },

        close: function(effect) {
            var self   = this;
            if (self.options.onClose) self.options.close.apply(self.toaster);
            this.toaster.animate(
                    {height:'toggle'},
                    {  duration: self.options.speed,
                        step: function() { 
                            if(self.options.onAnimate) self.options.onAnimate(self.toaster);
                        },
                        complete: function() {
                            if (self.options.onClosed) self.options.onClosed(self.toaster);
                            $(self.toaster).remove();
                            this.timer.clearTimeout(this.closeToastTimer);
                        }.bind(this)
                    }
            );
        },

        resume: function() {
            var self = this;
            self.closeToastTimer = this.timer.setTimeout(function(){
                self.close.apply(self);
            }, self.options.timeout * 1000 + self.options.delay * 1000);
        },

        pause: function() { this.timer.clearTimeout(this.closeToastTimer); }
    });
}
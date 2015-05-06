
IMVU.Client.widget.Dialog = function (el, userConfig) {
    IMVU.Client.widget.Dialog.superclass.constructor.call(this, el, userConfig);
};

YAHOO.lang.extend(IMVU.Client.widget.Dialog, YAHOO.widget.Panel, {

        init: function(el, userConfig) {

            /*
                 Note that we don't pass the user config in here yet because we
                 only want it executed once, at the lowest subclass level
            */

            IMVU.Client.widget.Dialog.superclass.init.call(this, el/*, userConfig*/);

            this.beforeInitEvent.fire(IMVU.Client.widget.Dialog);

            $(this.element).addClass("client-panel");

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }
            
            this.showEvent.subscribe(function() { this.close.blur(); });
            
            this.renderEvent.subscribe(function() {
                if (! this.waitOverlay) {
                    this.waitOverlay = document.createElement("DIV");
                    this.waitOverlay.className = "wait";
                    this.waitOverlay.innerHTML = '<img class="loading" src="/content/img/spinner_white.apng" width="41" height="41" />';
                    this.element.appendChild(this.waitOverlay);
                }
            });

            this.hideEvent.subscribe(function() {
                this.reset();
            });

            this.cfg.setProperty("effect", {effect:YAHOO.widget.ContainerEffect.FADE,duration:0.15} );
            this.initEvent.fire(IMVU.Client.widget.Dialog);
        },

        wait : function() {
            $(this.element).addClass("waiting");
        },

        stopWaiting : function() {
            $(this.element).removeClass("waiting");
        },

        confirm : function() {
            this.stopWaiting();
            $(this.element).addClass("confirm");
        },

        reset : function() {
            this.stopWaiting();
            $(this.element).removeClass("confirm");
        }
    }
);

window.alert = function(message, header) {
    throw "This should not be used";
};

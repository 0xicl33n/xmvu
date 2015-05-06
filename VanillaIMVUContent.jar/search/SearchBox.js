IMVU.Client.Timer = function() {};

IMVU.Client.Timer.prototype = {
    setTimeout: function(fn, i) {
        return window.setTimeout(fn, i);
    },
    clearTimeout: function(i) {
        return window.clearTimeout(i);
    }
};

IMVU.Client.widget.SearchBox = function(rootElement, timer) {
    this.timer = timer || new IMVU.Client.Timer();

    this.rootElement = (rootElement instanceof HTMLElement ? rootElement : YAHOO.util.Dom.get(rootElement));
    if (! this.rootElement) {
        throw new Error("No search box root element set");
    }

    this.formElement = this.rootElement.querySelector('form');
    if (! this.formElement) {
        throw new Error("No search box form element set");
    }

    this.inputElement = this.rootElement.querySelector('input');
    if (! this.rootElement) {
        throw new Error("No search box input element set");
    }

    this.searchText = "";
    this.onTextChange = new YAHOO.util.CustomEvent('onTextChange');
    this.timerId = null;

    YAHOO.util.Event.addListener(this.inputElement, "keyup", this.onKeyUp.bind(this), this);
    YAHOO.util.Event.addListener(this.inputElement, "focus", this.onGainFocus, this, true);
    YAHOO.util.Event.addListener(this.inputElement, "blur", this.onLoseFocus, this, true);
    YAHOO.util.Event.addListener(this.formElement, "submit", this.onSubmit, this, true);
};

IMVU.Client.widget.SearchBox.prototype = {
    setText : function (newText) {
        this.searchText = this.inputElement.value = newText;
        this.updateClass();
        this.fireTextChangeEvent();
    },
    
    fireTextChangeEvent : function() {
        this.onTextChange.fire(this.searchText);
    },

    onKeyUp: function(evt) {
        if (this.searchText != this.inputElement.value) {
            this.searchText = this.inputElement.value;
            this.updateClass();

            if (this.timerId !== null) {
                this.timer.clearTimeout(this.timerId);
            }

            function timerProc() {
                this.fireTextChangeEvent();
                this.timer.clearTimeout(this.timerId);
                this.timerId = null;
            }

            this.timerId = this.timer.setTimeout(timerProc.bind(this), 750);
        }
    },

    onSubmit : function(evt) {
        if (this.timerId !== null) {
            this.timer.clearTimeout(this.timerId);
            this.timerId = null;
            this.fireTextChangeEvent();
        }

        YAHOO.util.Event.stopEvent(evt);
        return false;
    },

    onGainFocus : function(evt) {
        $(this.rootElement).addClass("focused");
    },
    
    onLoseFocus : function(evt) {
        this.searchText = this.inputElement.value;
        $(this.rootElement).removeClass("focused");
        this.updateClass();
    },

    updateClass : function() {
        $(this.rootElement).toggleClass('has-text', this.inputElement.textLength !== 0);
    }
};

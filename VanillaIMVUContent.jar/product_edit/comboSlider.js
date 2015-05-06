function ComboSlider(args) {
    this.imvu = args.imvu;
    this.$root = $(args.el);
    this.$track = this.$root.find('.track');
    this.input = this.$root.find('input')[0];

    // Apply the component background color only to the track
    var color = this.$root.css('background-color');
    this.$root.css('background-color', 'transparent');
    this.$track.css('background-color', color);
    
    if (args.minValue === undefined) {
        this.minValue = 0;
    } else {
        this.minValue = args.minValue;
    }
    if (args.maxValue === undefined) {
        this.maxValue = 100;
    } else {
        this.maxValue = args.maxValue;
    }
    var trackWidth = this.$root[0].getBoundingClientRect().width - this.input.getBoundingClientRect().width - parseInt(YAHOO.util.Dom.getStyle(this.input, 'margin-left')) - 10;
    this.$track.width(trackWidth);

    this.slider = new IMVU.Client.widget.Slider(this.$track[0]);
    this.thumb = this.$root.find('.thumb')[0];
    this.thumbMax = trackWidth - this.thumb.getBoundingClientRect().width;

    this.slider.addListener('drag', this.onDragSlider.bind(this));
    this.slider.addListener('drop', this.onDropSlider.bind(this));

    var underflowOverflowListener = function (listener) { this.resize(); }.bind(this);
    this.$root[0].addEventListener('overflow', underflowOverflowListener, false);
    this.$root[0].addEventListener('underflow', underflowOverflowListener, false);
    this.resize();

    YAHOO.util.Event.addListener(this.input, 'change', this.userTextChangeListener.bind(this));

    this.input.value = 0;
    this.userEventListeners = [];
    this.userDragEventListeners = [];
}

ComboSlider.createComboSlider = function(args) {
    var el = args.el;
    el.innerHTML = "<span class='track'></span><input type='text'/>";
    return new ComboSlider($.extend({}, args, {el:el}));
}

ComboSlider.prototype.toExternal = function(internalValue) {
    return this.minValue + Math.round(internalValue * (this.maxValue - this.minValue) / this.thumbMax);
}

ComboSlider.prototype.toInternal = function(externalValue) {
    internalValue = Math.round((externalValue-this.minValue) * this.thumbMax / (this.maxValue - this.minValue));
    return internalValue;
}

ComboSlider.prototype.normalizeInput = function() {
    var trimmed = this.input.value.replace(/^\s*/, '').replace(/\s*$/, '');
    if (trimmed.substring(0,1) == '-') {
        trimmed = '';
    }
    if (trimmed.substring(0,2) != '0x') {
        trimmed = trimmed.replace(/^0+/, '');
    }
    var value = parseFloat(trimmed);
    if (value.toString() != trimmed) {
        var value = parseInt(this.input.value);
    }
    if (isNaN(value))
        value = 0;
    value = Math.round(value);
    if (value < this.minValue)
        value = this.minValue;
    if (value > this.maxValue)
        value = this.maxValue;
    this.input.value = value;    
}

ComboSlider.prototype.getValue = function() {
    return this.input.value;
}

ComboSlider.prototype.setValue = function(value) {
    this.input.value = value;
    this.normalizeInput();
    this.slider.setValue(this.toInternal(value));
}

ComboSlider.prototype.onDragSlider = function(value) {
    this.input.value = this.toExternal(value);
    this.normalizeInput();
    this.fireUserDragEvent();
}    

ComboSlider.prototype.onDropSlider = function() {
    this.fireUserEvent();
}    

ComboSlider.prototype.userTextChangeListener = function() {
    this.normalizeInput();
    var newValue = this.toInternal(this.input.value);
    this.slider.setValue(newValue);
    this.fireUserEvent();
}    

ComboSlider.prototype.fireUserEvent = function() {
    for (i = 0; i < this.userEventListeners.length; i++) {
        if (this.userEventListeners[i] !== null) {
            this.userEventListeners[i](this, this.getValue());
        }
    }
}

ComboSlider.prototype.fireUserDragEvent = function() {
    for (i = 0; i < this.userDragEventListeners.length; i++) {
        if (this.userDragEventListeners[i] !== null) {
            this.userDragEventListeners[i](this, this.getValue());
        }
    }
}

ComboSlider.prototype.addUserEventListener = function(listener, onDrag) {
    if (onDrag) {
        this.userDragEventListeners.push(listener);
    } else {
        this.userEventListeners.push(listener);
    }
}

ComboSlider.prototype.removeUserEventListener = function(listener) {
    for (var i = this.userEventListeners.length - 1; i >= 0; i--) {
        if (this.userEventListeners[i] == listener) {
            this.userEventListeners.splice(i, 1);
        }
    }
    for (var i = this.userDragEventListeners.length - 1; i >= 0; i--) {
        if (this.userDragEventListeners[i] == listener) {
            this.userDragEventListeners.splice(i, 1);
        }
    }
}

ComboSlider.prototype.resize = function() {
    var trackWidth = this.$root[0].getBoundingClientRect().width - this.input.getBoundingClientRect().width - parseInt(YAHOO.util.Dom.getStyle(this.input, 'margin-left')) - 2;
    this.$track.width(trackWidth);
    this.thumbMax = trackWidth - this.thumb.getBoundingClientRect().width;
}

ComboSlider.prototype.setTrackColor = function(left, right) {
    if (!right) {
        this.$track.css('background-color', left);
    } else {
        this.$track.css('background-color', '-moz-linear-gradient(left, ' + right + ', ' + left + ')');
    }
}


IMVU.Client.widget.Slider = function(el) {
    this.el = el;
    this.thumb = document.createElement('img');
    this.thumb.className = 'thumb';
    this.el.appendChild(this.thumb);
    
    this.el.style.textAlign = 'left';
    
    this.thumb.style.display = 'inline-block';
    this.thumb.style.position = 'relative';
    this.thumb.style.left = '0px';

    this.listeners = [];
    this.offset = 0;
    this.lastReportedOffset = -1;
    
    this.grabClosure = this._onGrabThumb.bind(this);
    this.dragClosure = this._onDragThumb.bind(this);
    this.dropClosure = this._onDropThumb.bind(this);
    this.modClosure = this._onModified.bind(this);
    
    this.thumb.addEventListener('mousedown', this.grabClosure, false);
    this.el.addEventListener('DOMAttrModified', this.modClosure, false);
    this.thumb.addEventListener('DOMAttrModified', this.modClosure, false);
}

IMVU.Client.widget.Slider.prototype.addListener = function(type, listener) {
    this.listeners.push({type: type, listener: listener});
}

IMVU.Client.widget.Slider.prototype.getValue = function() {
    return this.offset;
}

IMVU.Client.widget.Slider.prototype.removeListener = function(type, listener) {
    for (var i = this.listeners.length - 1; i >= 0; i--) {
        if (this.listeners[i].type == type && 
            this.listeners[i].listener == listener) {
            this.listeners.splice(i, 1);
        }
    }
}

IMVU.Client.widget.Slider.prototype.setValue = function(value) {
    this.offset = this._normalizedThumbPosition(value);
    this.thumb.style.left = this.offset + 'px';
}

IMVU.Client.widget.Slider.prototype._fire = function(type, value) {
    for (var i = 0; i < this.listeners.length; i++) {
        if (this.listeners[i].type == type) {
            this.listeners[i].listener(value);
        }
    }
}

IMVU.Client.widget.Slider.prototype._normalizedThumbPosition = function(value) {
    var leftStop = 0;
    var rightStop = this.el.getBoundingClientRect().width - this.thumb.getBoundingClientRect().width;
    if (leftStop > rightStop) {
        leftStop = rightStop;
    }
    if (value < leftStop) {
        value = leftStop;
    }
    if (value > rightStop) {
        value = rightStop;
    }
    return value;
}

IMVU.Client.widget.Slider.prototype._onDragThumb = function(e) {
    this.offset = this._normalizedThumbPosition(e.pageX - this.thumbOffset - this.el.getBoundingClientRect().left)
    this.thumb.style.left = this.offset + 'px';
    if (this.offset != this.lastReportedOffset) {
        this._fire('drag', this.offset);
    }
    this.lastReportedOffset = this.offset;
}

IMVU.Client.widget.Slider.prototype._onDropThumb = function() {
    document.removeEventListener('mousemove', this.dragClosure, true);
    document.removeEventListener('mouseup', this.dropClosure, true);
    this._fire('drop', this.offset);
}

IMVU.Client.widget.Slider.prototype._onGrabThumb = function(e) {
    document.addEventListener('mousemove', this.dragClosure, true);
    document.addEventListener('mouseup', this.dropClosure, true);
    this.thumbOffset = e.pageX - this.thumb.getBoundingClientRect().left;
    this.offset = this.thumb.getBoundingClientRect().left - this.el.getBoundingClientRect().left;
    this._fire('grab', this.offset);
}

IMVU.Client.widget.Slider.prototype._onModified = function(e) {
    this.offset = this._normalizedThumbPosition(this.thumb.getBoundingClientRect().left - this.el.getBoundingClientRect().left);
    this.thumb.style.left = this.offset + 'px';
}



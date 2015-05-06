function SimpleColorPicker(args) {
    var el = args.el;
    this.imvu = args.imvu;
    this.r = el.querySelector('.R');
    this.g = el.querySelector('.G');
    this.b = el.querySelector('.B');
    this.swatch = args.el.querySelector('.swatch');

    this.rSlider = ComboSlider.createComboSlider($.extend({}, args, {el: this.r, maxValue: 255}))
    this.gSlider = ComboSlider.createComboSlider($.extend({}, args, {el: this.g, maxValue: 255}))
    this.bSlider = ComboSlider.createComboSlider($.extend({}, args, {el: this.b, maxValue: 255}))

    var color = YAHOO.util.Dom.getStyle(el, 'background-color');
    YAHOO.util.Dom.setStyle(el, 'background-color', 'transparent');
    this.rSlider.setTrackColor(color);
    this.gSlider.setTrackColor(color);
    this.bSlider.setTrackColor(color);
    this.rSlider.setValue(128);
    this.gSlider.setValue(128);
    this.bSlider.setValue(128);

    this.userEventListeners = [];
    this.rSlider.addUserEventListener(this.userChangeListener.bind(this));
    this.gSlider.addUserEventListener(this.userChangeListener.bind(this));
    this.bSlider.addUserEventListener(this.userChangeListener.bind(this));
    this.rSlider.addUserEventListener(this.userDragListener.bind(this), true);
    this.gSlider.addUserEventListener(this.userDragListener.bind(this), true);
    this.bSlider.addUserEventListener(this.userDragListener.bind(this), true);

    this.updateSwatch();
}

SimpleColorPicker.createSimpleColorPickers = function(args) {
    var self = this,
        result = {};
    $('.simpleColorPicker', args.el).each(function (index, el) {
        result[el.id] = self.createSimpleColorPicker($.extend({}, args, {el:el}));
    });
    return result;
}

SimpleColorPicker.createSimpleColorPicker = function(args) {
    var el = args.el;
    var html = "";
    html += "<div class='sliders'>";
    html += "<label>"+_T("R")+" </label><div class='comboSlider R'></div><br/>"
    html += "<label>"+_T("G")+" </label><div class='comboSlider G'></div><br/>"
    html += "<label>"+_T("B")+" </label><div class='comboSlider B'></div>"
    html += "</div>";
    html += "<div class='swatch'>&nbsp</div>";
    el.innerHTML = html;
    return new SimpleColorPicker($.extend({}, args, {el:el}));
}

SimpleColorPicker.prototype.normalizeColorComponent = function(value) {
    if (typeof(value) == 'string') {
        value = parseInt(value);
    }
    if (isNaN(value) || value < 0)
        return 0;
    if (value > 255)
        return 255;        
    return value;
}

SimpleColorPicker.prototype.formatColor = function(rv, gv, bv) {
    var hex = function(n) { 
        return ("00" + n.toString(16)).slice(-2); 
    }
    return "#" + hex(rv) + hex(gv) + hex(bv);
}

SimpleColorPicker.prototype.updateSwatch = function() {
    rv = this.normalizeColorComponent(this.rSlider.getValue());
    gv = this.normalizeColorComponent(this.gSlider.getValue());
    bv = this.normalizeColorComponent(this.bSlider.getValue());
    this.swatch.style.backgroundColor = this.formatColor(rv, gv, bv);
}

SimpleColorPicker.prototype.getValue = function() {
    rv = this.normalizeColorComponent(this.rSlider.getValue());
    gv = this.normalizeColorComponent(this.gSlider.getValue());
    bv = this.normalizeColorComponent(this.bSlider.getValue());
    return [rv, gv, bv];
}

SimpleColorPicker.prototype.setValue = function(value) {
    if(!value) {
        value = [128,128,128];
    }
    this.rSlider.setValue(value[0]);
    this.gSlider.setValue(value[1]);
    this.bSlider.setValue(value[2]);
    this.updateSwatch();
}

SimpleColorPicker.prototype.userChangeListener = function() {
    this.updateSwatch();
    for each(var listener in this.userEventListeners) {
        if (listener !== null) {
            listener(this, this.getValue());
        }
    }
}

SimpleColorPicker.prototype.userDragListener = function() {
    this.updateSwatch();
}

SimpleColorPicker.prototype.addUserEventListener = function(listener) {
    this.userEventListeners.push(listener);
}

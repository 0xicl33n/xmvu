function DomainWidget(args) {
    this.$el = $(args.el);
    this.$el.html('<select class="domainSelector">\
            <option value="Point">Point</option>\
            <option value="Sphere">Sphere</option>\
            <option value="Cone">Cone</option>\
            <option value="Cylinder">Cylinder</option>\
            <option value="Disc">Disc</option>\
            <option value="Line">Line</option>\
        </select><br/>\
    <span class="parameter parameterPosition1">\
        <span class="domainParameterLabel labelPosition">Position</span>\
        <span class="domainParameterLabel labelTop">Top</span>\
        <span class="domainParameterLabel labelStart">Start</span>\
        <span>\
            <label>X<input type="text" class="coordinate parameterPosition1X"></label>\
            <label>Y<input type="text" class="coordinate parameterPosition1Y"></label>\
            <label>Z<input type="text" class="coordinate parameterPosition1Z"></label>\
        </span><br/>\
    </span>\
    <span class="parameter parameterPosition2">\
        <span class="domainParameterLabel labelBottom">Bottom</span>\
        <span class="domainParameterLabel labelEnd">End</span>\
        <span class="domainParameterLabel labelNormal">Normal</span>\
        <span>\
            <label>X<input type="text" class="coordinate parameterPosition2X"></label>\
            <label>Y<input type="text" class="coordinate parameterPosition2Y"></label>\
            <label>Z<input type="text" class="coordinate parameterPosition2Z"></label>\
        </span><br/>\
    </span>\
    <span class="parameter parameterRadius">\
        <span class="domainParameterLabel labelRadius">Radius</span>\
        <span>\
            <label>outer<input type="text" class="coordinate parameterRadiusOuter"></label>\
            <label>inner<input type="text" class="coordinate parameterRadiusInner"></label>\
        </span><br/>\
    </span>');
    this.$selector = $('.domainSelector', this.$el);
    this.$parameters = $('.parameter', this.$el);
    this.$parmPos1 = $('.parameterPosition1', this.$el);
    this.$parmPos1X = $('.parameterPosition1X', this.$el);
    this.$parmPos1Y = $('.parameterPosition1Y', this.$el);
    this.$parmPos1Z = $('.parameterPosition1Z', this.$el);
    this.$parmPos2 = $('.parameterPosition2', this.$el);
    this.$parmPos2X = $('.parameterPosition2X', this.$el);
    this.$parmPos2Y = $('.parameterPosition2Y', this.$el);
    this.$parmPos2Z = $('.parameterPosition2Z', this.$el);
    this.$parmRadius = $('.parameterRadius', this.$el);
    this.$parmRadiusOuter = $('.parameterRadiusOuter', this.$el);
    this.$parmRadiusInner = $('.parameterRadiusInner', this.$el);
    this.$labels = $('.domainParameterLabel', this.$el);
    this.$labelPos = $('.labelPosition', this.$el);
    this.$labelTop = $('.labelTop', this.$el);
    this.$labelBottom = $('.labelBottom', this.$el);
    this.$labelStart = $('.labelStart', this.$el);
    this.$labelEnd = $('.labelEnd', this.$el);
    this.$labelNormal = $('.labelNormal', this.$el);
    this.$labelRadius = $('.labelRadius', this.$el);

    this.$selector.change(jQuery.proxy(this.configureParameterFields, this));
    this.userEventListeners = [];
    $('input', this.$el).change(jQuery.proxy(this._fireUserChangeListener, this));
    $('select', this.$el).change(jQuery.proxy(this._fireUserChangeListener, this));
}

DomainWidget.createDomainWidgets = function(args) {
    var result = {};
    $('.domainWidget', args.el).each(function () {
        result[this.id] = new DomainWidget($.extend({}, args, {el:this}));
    });
    return result;
};

DomainWidget.prototype.toFloat = function(str, dft) {
    if (typeof(str) == 'number') {
        return str;
    }
    var val = jQuery.trim(str);
    return val == '' ? dft : parseFloat(val);
};

DomainWidget.prototype.toCoordinates = function(str, dft) {
    var coords = (str+',0,0,0').split(',');
    coords.splice(3, 99999);
    coords = _.map(coords, function(coord) {
        return this.toFloat(coord);
    }, this);
    return coords;
};

DomainWidget.prototype.setValue = function(domain) {
    var coordinates;
    var type = jQuery.trim(domain['Type']);
    this.$selector.val(type);
    switch(type) {
    case 'Point':
        coordinates = this.toCoordinates(domain['Position']);
        this.$parmPos1X.val(coordinates[0]);
        this.$parmPos1Y.val(coordinates[1]);
        this.$parmPos1Z.val(coordinates[2]);
        break;
    case 'Sphere':
        coordinates = this.toCoordinates(domain['Position']);
        this.$parmPos1X.val(coordinates[0]);
        this.$parmPos1Y.val(coordinates[1]);
        this.$parmPos1Z.val(coordinates[2]);
        this.$parmRadiusInner.val(this.toFloat(domain['InnerRadius']));
        this.$parmRadiusOuter.val(this.toFloat(domain['OuterRadius']));
        break;
    case 'Cone':
    case 'Cylinder':
        coordinates = this.toCoordinates(domain['Top']);
        this.$parmPos1X.val(coordinates[0]);
        this.$parmPos1Y.val(coordinates[1]);
        this.$parmPos1Z.val(coordinates[2]);
        coordinates = this.toCoordinates(domain['Bottom'])
        this.$parmPos2X.val(coordinates[0]);
        this.$parmPos2Y.val(coordinates[1]);
        this.$parmPos2Z.val(coordinates[2]);
        this.$parmRadiusInner.val(this.toFloat(domain['InnerRadius']));
        this.$parmRadiusOuter.val(this.toFloat(domain['OuterRadius']));
        break;
    case 'Disc':
        coordinates = this.toCoordinates(domain['Position']);
        this.$parmPos1X.val(coordinates[0]);
        this.$parmPos1Y.val(coordinates[1]);
        this.$parmPos1Z.val(coordinates[2]);
        coordinates = this.toCoordinates(domain['Normal']);
        this.$parmPos2X.val(coordinates[0]);
        this.$parmPos2Y.val(coordinates[1]);
        this.$parmPos2Z.val(coordinates[2]);
        this.$parmRadiusInner.val(this.toFloat(domain['InnerRadius']));
        this.$parmRadiusOuter.val(this.toFloat(domain['OuterRadius']));
        break;
    case 'Line':
        coordinates = this.toCoordinates(domain['Start']);
        this.$parmPos1X.val(coordinates[0]);
        this.$parmPos1Y.val(coordinates[1]);
        this.$parmPos1Z.val(coordinates[2]);
        coordinates = this.toCoordinates(domain['End']);
        this.$parmPos2X.val(coordinates[0]);
        this.$parmPos2Y.val(coordinates[1]);
        this.$parmPos2Z.val(coordinates[2]);
        break;
    }
    this.configureParameterFields();
}

DomainWidget.prototype.getValue = function() {
    var domain = {};
    var x, y, z;
    domain['Type'] = this.$selector.val();
    switch(domain['Type']) {
    case 'Point':
        x = this.toFloat(this.$parmPos1X.val(), 0.0);
        y = this.toFloat(this.$parmPos1Y.val(), 0.0);
        z = this.toFloat(this.$parmPos1Z.val(), 0.0);
        domain['Position'] = x + ',' + y + ',' + z;
        break;
    case 'Sphere':
        x = this.toFloat(this.$parmPos1X.val(), 0.0);
        y = this.toFloat(this.$parmPos1Y.val(), 0.0);
        z = this.toFloat(this.$parmPos1Z.val(), 0.0);
        domain['Position'] = x + ',' + y + ',' + z;
        domain['InnerRadius'] = this.toFloat(this.$parmRadiusInner.val(), 0.0);
        domain['OuterRadius'] = this.toFloat(this.$parmRadiusOuter.val(), 0.0);
        break;
    case 'Cone':
    case 'Cylinder':
        x = this.toFloat(this.$parmPos1X.val(), 0.0);
        y = this.toFloat(this.$parmPos1Y.val(), 0.0);
        z = this.toFloat(this.$parmPos1Z.val(), 0.0);
        domain['Top'] = x + ',' + y + ',' + z;
        x = this.toFloat(this.$parmPos2X.val(), 0.0);
        y = this.toFloat(this.$parmPos2Y.val(), 0.0);
        z = this.toFloat(this.$parmPos2Z.val(), 0.0);
        domain['Bottom'] = x + ',' + y + ',' + z;
        domain['InnerRadius'] = this.toFloat(this.$parmRadiusInner.val(), 0.0);
        domain['OuterRadius'] = this.toFloat(this.$parmRadiusOuter.val(), 0.0);
        break;
    case 'Disc':
        x = this.toFloat(this.$parmPos1X.val(), 0.0);
        y = this.toFloat(this.$parmPos1Y.val(), 0.0);
        z = this.toFloat(this.$parmPos1Z.val(), 0.0);
        domain['Position'] = x + ',' + y + ',' + z;
        x = this.toFloat(this.$parmPos2X.val(), 0.0);
        y = this.toFloat(this.$parmPos2Y.val(), 0.0);
        z = this.toFloat(this.$parmPos2Z.val(), 0.0);
        domain['Normal'] = x + ',' + y + ',' + z;
        domain['InnerRadius'] = this.toFloat(this.$parmRadiusInner.val(), 0.0);
        domain['OuterRadius'] = this.toFloat(this.$parmRadiusOuter.val(), 0.0);
        break;
    case 'Line':
        x = this.toFloat(this.$parmPos1X.val(), 0.0);
        y = this.toFloat(this.$parmPos1Y.val(), 0.0);
        z = this.toFloat(this.$parmPos1Z.val(), 0.0);
        domain['Start'] = x + ',' + y + ',' + z;
        x = this.toFloat(this.$parmPos2X.val(), 0.0);
        y = this.toFloat(this.$parmPos2Y.val(), 0.0);
        z = this.toFloat(this.$parmPos2Z.val(), 0.0);
        domain['End'] = x + ',' + y + ',' + z;
        break;
    }
    return domain;
};

DomainWidget.prototype.configureParameterFields = function() {
    this.$parameters.hide();
    this.$labels.hide();
    switch(this.$selector.val()) {
    case 'Point':
        this.$labelPos.show();
        this.$parmPos1.show();
        break;
    case 'Sphere':
        this.$labelPos.show();
        this.$parmPos1.show();
        this.$labelRadius.show();
        this.$parmRadius.show();
        break;
    case 'Cone':
    case 'Cylinder':
        this.$labelTop.show();
        this.$parmPos1.show();
        this.$labelBottom.show();
        this.$parmPos2.show();
        this.$labelRadius.show();
        this.$parmRadius.show();
        break;
    case 'Disc':
        this.$labelPos.show();
        this.$parmPos1.show();
        this.$labelNormal.show();
        this.$parmPos2.show();
        this.$labelRadius.show();
        this.$parmRadius.show();
        break;
    case 'Line':
        this.$labelStart.show();
        this.$parmPos1.show();
        this.$labelEnd.show();
        this.$parmPos2.show();
        break;
    }
};

DomainWidget.prototype._fireUserChangeListener = function() {
    for each(var listener in this.userEventListeners) {
        if (listener !== null) {
            listener(this, this.getValue());
        }
    }
};

DomainWidget.prototype.addUserChangeListener = function(listener) {
    this.userEventListeners.push(listener);
};


function HintWidget(args) {
    this.event_bus = args.event_bus || IMVU.Client.EventBus;
    this.nub_side = args.nub_side;
    this.nub_position = args.nub_position;
    this.hint_container = args.container;
    this.windowSize = args.windowSize;
    var hint_div = $('<div/>').addClass('hint-widget');
    if (typeof args.content.text !== "undefined") {
        hint_div.text(args.content.text);
    } else if (typeof args.content.html !== "undefined") {
        hint_div.html(args.content.html);
    } else {
        throw Error("Hint content must have either text or html");
    }
    this.addNub(this.nub_side, this.nub_position, hint_div);
    this.addCloseButton(hint_div);
    this.hint_container.append(hint_div);
    this.timer = args.timer;
    if (! this.timer) {
        this.setPositionIntervalId = setInterval(this.requestSetPosition.bind(this), 300);
    } else {
        this.setPositionIntervalId = this.timer.setInterval(this.requestSetPosition.bind(this), 300);
    }
    this.imvu = args.imvu;
    if (typeof this.imvu.callAsync === 'undefined') {
        imvuRequired;
    }
    if (args.enable_do_not_show) {
        this.OnDoNotShow = args.OnDoNotShow || function(enable) {};
        this.addDoNotShowAgain(hint_div);
    }
    this.OnClose = args.OnClose || function() {};
    this.is_dismissed = false;

    this.event_bus.register('HintWidget.requestShiftPosition', function (eventName, data) {
        this.shift_position(data.deltaX, data.deltaY);
    }.bind(this));
    this.event_bus.register('HintWidget.closeHintOperation', function(eventName, data) {
        this.closeHintOperation();
    }.bind(this));
}

HintWidget.prototype.top_position = function(y) {
    if (this.nub_position == 'top') {
        return y - 25;
    } else if (this.nub_position == 'bottom') {
        return y - this.hint_container.height() + 27;
    } else if (this.nub_side == 'top') {
        return y + 11;
    } else if (this.nub_side == 'bottom') {
        return y - this.hint_container.height() - 10;
    } else if (this.nub_side == 'none') {
        if (this.nub_position == 'center') {
            return y - this.hint_container.height() / 2;
        } else if (this.nub_position == 'top-left') {
            return y;
        } else if (this.nub_position == 'bottom-right') {
            return y - this.hint_container.height();
        } 
    }
}

HintWidget.prototype.left_position = function(x) {
    if (this.nub_side == 'left') {
        return x + 11;
    } else if (this.nub_side == 'right') {
        return x - this.hint_container.width() - 10;
    } else if (this.nub_position == 'left') {
        return x - 53;
    } else if (this.nub_position == 'right') {
        return x - this.hint_container.width() + 55;
    } else if (this.nub_side == 'none') {
        if (this.nub_position == 'center') {
            return x - this.hint_container.width() / 2;
        } else if (this.nub_position == 'top-left') {
            return x;
        } else if (this.nub_position == 'bottom-right') {
            return x - this.hint_container.width();
        } 
    }
}

HintWidget.prototype.position = function(x, y) {
    this.hint_container
        .css('top', this.top_position(y) + 'px')
        .css('left', this.left_position(x) + 'px');
}

HintWidget.prototype.shift_position = function(deltaX, deltaY) {
    console.log('qqq hint container', this.hint_container);
        var currentX = this.hint_container.css('left');
        var currentY = this.hint_container.css('top');
        currentX = currentX.replace(/px/i, '');
        currentY = currentY.replace(/px/i, '');

        var newX = parseInt(currentX) + deltaX;
        var newY = parseInt(currentY) + deltaY;
        
        this.hint_container
            .css('top', newY + 'px')
            .css('left', newX + 'px');
}

HintWidget.prototype.addNub = function(nub_side, nub_position, hint_div) {
    var nub_div;

    if (nub_side == 'bottom') {
        nub_div = $('<div/>').addClass('nub-down nub-common');
        if (nub_position == 'left') {
            nub_div.css('left', '42px');
        } else if (nub_position == 'right') {
            nub_div.css('right', '43px');
        } else {
            throw Error("Hint nub_position must have either left or right when nub_side is bottom");
        }
        nub_div.css('bottom', '-17px');
        hint_div.append(nub_div);
    } else if (nub_side == 'top') {
        nub_div = $('<div/>').addClass('nub-up nub-common');
        if (nub_position == 'left') {
            nub_div.css('left', '42px');
        } else if (nub_position == 'right') {
            nub_div.css('right', '43px');
        } else {
            throw Error("Hint nub_position must have either left or right when nub_side is top");
        }
        nub_div.css('top', '-17px');
        hint_div.append(nub_div);
    } else if (nub_side == 'left') {
        nub_div = $('<div/>').addClass('nub-left nub-common');
        if (nub_position == 'top') {
            nub_div.css('top', '14px');
        } else if (nub_position == 'bottom') {
            nub_div.css('bottom', '15px');
        } else {
            throw Error("Hint nub_position must have either top or bottom when nub_side is left");
        }
        nub_div.css('left', '-16px');
        hint_div.append(nub_div);
    } else if (nub_side == 'right') {
        nub_div = $('<div/>').addClass('nub-right nub-common');
        if (nub_position == 'top') {
            nub_div.css('top', '14px');
        } else if (nub_position == 'bottom') {
            nub_div.css('bottom', '15px');
        } else {
            throw Error("Hint nub_position must have either top or bottom when nub_side is right");
        }
        nub_div.css('right', '-16px');
        hint_div.append(nub_div);
    } else if (nub_side == 'none') {
        // pass
    } else {
        throw Error("Hint nub_side is invalid: " +  nub_side);
    }
}

HintWidget.prototype.addCloseButton = function(hint) {
    var close_button = $('<div/>').addClass('close-button');
    var self = this;
    close_button.click(function() {
        self.closeHintOperation();
    });
    hint.append(close_button);
}

HintWidget.prototype.closeHintOperation = function() {
    var self = this;
    self.fireExplictlyDismissedHint();
    self.OnClose();
    self.dismiss();
}

HintWidget.prototype.fireDoNotShow = function(checked) {
    this.event_bus.fire('DoNotShow', {'checked':checked});
}

HintWidget.prototype.addDoNotShowAgain = function(hint) {
    var $checkbox_container = $('<div/>').addClass('do-not-show');
    var $checkbox = $("<input type='checkbox' id='noshow_box' value='1' />");
    var $label = $("<label for='noshow_box'>").text(_T("Do not show me again"));
    var self = this;
    $checkbox.change(function() {
        self.fireDoNotShow($checkbox.prop('checked') == true);
    });
    $checkbox_container.append($checkbox);
    $checkbox_container.append($label);
    $(hint).append($checkbox_container);
}

HintWidget.prototype.nub_y = function () {
    if (this.nub_side == 'bottom') {
        return this.height();
    } else if (this.nub_side == 'top') {
        return -this.heightAddedByNub();
    } else if (this.nub_position == 'top') {
        return 25;
    } else if (this.nub_position == 'bottom') {
        return this.height() - 27;
    } else {
        // nub_side = none
        return 0;
    }
}

HintWidget.prototype.nub_x = function () {
    if (this.nub_position == 'left') {
        return 53;
    } else if (this.nub_position == 'right') {
        return this.hint_container.width() - 55;
    } else if (this.nub_side == 'left') {
        return -this.widthAddedByNub();
    } else if (this.nub_side == 'right') {
        return this.width();
    } else {
        // nub_side = none
        return 0;
    }
}

HintWidget.prototype.heightAddedByNub = function() {
    if (this.nub_side == 'top' || this.nub_side == 'bottom') {
        return 10;
    } else {
        return 0;
    }
}

HintWidget.prototype.widthAddedByNub = function() {
    if (this.nub_side == 'left' || this.nub_side == 'right') {
        return 10;
    } else {
        return 0;
    }
}

HintWidget.prototype.top = function () {
    if (this.nub_side == 'top') {
        return -this.heightAddedByNub();
    } else {
        return 0;
    }
}

HintWidget.prototype.left = function () {
    if (this.nub_side == 'left') {
        return -this.widthAddedByNub();
    } else {
        return 0;
    }
}

HintWidget.prototype.height = function () {
    if (this.nub_side == 'top' || this.nub_side == 'bottom') {
        return this.hint_container.height() + 10;
    } else {
        return this.hint_container.height();
    }
}

HintWidget.prototype.width = function () {
    if (this.nub_side == 'left' || this.nub_side == 'right') {
        return this.hint_container.width() + 10;
    } else {
        return this.hint_container.width();
    }
}

HintWidget.prototype.hintLayout = function () {
    var o = this.hint_container.children('.hint-widget').offset();
    return {
        x: o.left + this.nub_x(),
        y: o.top  + this.nub_y(),
        top: o.top + this.top(),
        left: o.left + this.left(),
        height: this.height(),
        width:  this.width()
    };
}

HintWidget.prototype.layout = function () {
    var layout = this.hintLayout();
    return {
        x: layout.x - 5,
        y: layout.y - 5,
        top: layout.top - 5,
        left: layout.top - 5,
        height: layout.height,
        width: layout.width,
        topOffset: 20
    };
}

HintWidget.prototype.dismiss = function() {
    if (! this.timer) {
        clearInterval(this.setPositionIntervalId);
    } else {
        this.timer.clearInterval(this.setPositionIntervalId);
    }
    if (typeof this.name != "undefined") {
        IMVU.hintWidgetNamed[this.name] = null;
    }
    var container = this.hint_container;
    var self = this;
    container.fadeOut('fast', function () {
        container.trigger('dismissFinished');
        container.remove();
    });
    this.is_dismissed = true;
}

HintWidget.prototype.fireExplictlyDismissedHint = function() {
    this.event_bus.fire('ExplicitlyDismissedHint');
}

HintWidget.prototype.requestSetPosition = function() {
    var result = this.imvu.call('getHintWidgetPosition', this.name);
    if ((typeof result != "object") || (result === null)) {
        return;
    }
    if (result.length != 3) {
        return;
    }
    var success = result[0];
    if (success) {
        this.position(result[1], result[2]);
    }
}

HintWidget.prototype.showCloseButton = function() {
    var close_button = this.hint_container.find('.close-button');
    close_button.addClass('show-always');
}

HintWidget.prototype.isCloseButtonShown = function() {
    var close_button = this.hint_container.find('.close-button');
    return close_button.hasClass('show-always');
}

HintWidget.prototype.shrinkBy = function(x, y) {
    this.hint_container.width(this.hint_container.width() - x);
    this.hint_container.height(this.hint_container.height() - y);
}

// create and display a hint
//
// content: content to display in the hint
//   {text|html: content}
//   if text, then _T is auto-added 
// nub_side: 'top', 'bottom', 'left' or 'right': which side to put the nub on
//      'none': do not show nub
// nub_position:
//   for nub_side of top or botton: 'left' or 'right'
//   for hub_side of left or right: 'top' or 'bottom'
//     where to position the nub on the side
//   for 'none' nub, use 'top-left', 'center', or 'bottom-right'
// position: a function of zero arguments which returns an
//   object {top: x, left: x}.  The hint is positions so that the
//   nub points at this location.

// this function is mainly for unit test
function create_hint_on_elem(elem_sel, content, nub_side, nub_position, position, timer, imvu, OnClose) {
    var container = $('<div/>').addClass('hint-widget-container').hide();
    $(elem_sel).append(container);
    var hint = new HintWidget({container: container, content: content, nub_side: nub_side, nub_position: nub_position, timer: timer, imvu: imvu, OnClose: OnClose});
    var pos = position();
    hint.position(pos.left, pos.top);
    container.fadeIn();
    return hint;
}

// this function is for creating and destroying from javascript (do not rely on IMVU.hintWidgetNamed)
function create_hint(content, nub_side, nub_position, position, OnClose, imvu) {
    return create_hint_on_elem('body', content, nub_side, nub_position, position, null, imvu, OnClose);
}

function create_informational_message(content, nub_side, nub_position, position, OnClose, imvu) {
    return create_hint(content, nub_side, nub_position, position, OnClose, imvu);
}

function fire_HideHint() {
    IMVU.Client.EventBus.fire('HideHint');
}

// this function is for creating and destroying from Python code, and 
// name is needed to move or dismiss one hint when multiple hints exist in the same gecko 
function create_gecko_hint(content, nub_side, nub_position, position, name, imvu) { 
    var hint = create_hint(content, nub_side, nub_position, position, fire_HideHint, imvu);
    hint.name = name;
    if (typeof IMVU.hintWidgetNamed == "undefined") {
        IMVU.hintWidgetNamed = new Array();
    }
    IMVU.hintWidgetNamed[name] = hint; 
    return null;
}

function call_periodically(interval, f) {
    f();
    setInterval(f, interval);
}

function create_overlay_hint(spec) {
    var container = $('<div/>').addClass('hint-overlay');
    spec = $.extend(spec, {container: container, timer:null, OnClose: fire_HideHint});
    var hint = new HintWidget(spec);
    hint.hint_container.css({ 'position': 'static' });
    return hint;
}

function create_hint_in_overlay() {
    var spec = imvu.call('getSpec');
    spec.imvu = imvu;
    IMVU.hintWidgetNamed = [];
    var hint = create_overlay_hint(spec);
    hint.name = 'overlay';
    IMVU.hintWidgetNamed[hint.name] = hint; 
    hint.hint_container.bind('dismissFinished', function () {
        imvu.call('dismissFinished');
    });
    hint.hint_container.hide().appendTo($('body')).fadeIn();
    call_periodically(200, function () {
        if (this.is_dismissed) return;
        imvu.call('layout', hint.layout());
    }.bind(hint));
}

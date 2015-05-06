function PillButton(args) {
    this.el = $(args.el)[0];
    this.createPillButton(args);
    this.down = false;
    this.toggle = (this.el.className.indexOf('toggle') > 0);
    this.publishState();
    this.userEventListeners = [];
    $(this.el).click(this.clickListener.bind(this));
}

PillButton.createPillButtons = function(args) {
    var result = {};
    $('.pillButton', args.el).each(function (index, pb) {
        result[pb.id] = new PillButton($.extend({}, args, {el:pb}));
    });
    return result;
}

PillButton.prototype.createPillButton = function(args) {
    var fade = document.createElement('div');
    $(fade).addClass('fade');
    fade.innerHTML = this.el.innerHTML;
    this.el.innerHTML = "";
    this.el.appendChild(fade);
    var plus = this.el.querySelector('.plus');
    var minus = this.el.querySelector('.minus');
    var bullet = this.el.querySelector('.bullet');
    if (plus) {
        plus.innerHTML = "<div class='v'></div><div class='h'></div>";
    } else if (minus) {
        minus.innerHTML = "<div class='h'></div>";
    } else if (bullet) {
        var bull = document.createElement('div');
        this.el.appendChild(bull);
        $(bull).addClass('bull');
        $(fade).addClass('label');
        bull.innerHTML = '&bull; ';
    }
}

PillButton.prototype.getValue = function() {
    return this.down;
}

PillButton.prototype.setValue = function(value) {
    this.down = this.toggle && value;
}

PillButton.prototype.publishState = function() {
    $(this.el).toggleClass('down', this.toggle && this.down);
}

PillButton.prototype.clickListener = function() {
    if ($(this.el).is(':not(.disabled)')) {
       this.down = this.toggle && !this.down;
       this.publishState();
       for each(var listener in this.userEventListeners) {
           if (listener !== null) {
               listener(this, this.getValue());
           }
       }
    }
}

PillButton.prototype.enable = function(value) {
    $(this.el).toggleClass('disabled', !value);
}

PillButton.prototype.isEnabled = function(value) {
    return !$(this.el).hasClass('disabled');
}

PillButton.prototype.addUserEventListener = function(listener) {
    this.userEventListeners.push(listener);
}

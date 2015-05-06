function ModeButton(args) {
    this.init(args);
}

ModeButton.prototype.init = function (args) {
    this.name = args.name;
    this.friendlyName = args.friendlyName;
    this.isNew = args.isNew;
    this.isImproved = args.isImproved;
    this.isLook = args.isLook;
    this.isBeta = args.isBeta;
    this.visible = args.visible;
    this.eventName = args.eventName || 'HomeMode.' + this.friendlyName.replace(/ /g, '') + 'Clicked';
    this.eventBus = args.eventBus;
    this.imvu = args.imvu;
    this.animDiv = null;
    this.image = args.image || args.name.toLowerCase();
    if (args.translateFriendlyName) {
        this.friendlyName = _T(this.friendlyName, this.imvu);
    }

    this.$div = this.createMarkup();
}

ModeButton.prototype.createMarkup = function() {
    var $elt = $('.new-button-template').clone().toggleClass('new-button-template new-button').show();

    $elt.addClass(this.name);
    $elt.addClass('ui-event');
    $elt.attr('data-ui-name', this.name);
    $('.name', $elt).text(this.friendlyName);
    $('.button-normal', $elt).attr('src', 'img/btn-' + this.image + '.png');
    $('.button-over',   $elt).attr('src', 'img/btn-' + this.image + '-over.png');
    $('.button-locked', $elt).attr('src', 'img/btn-' + this.image + '-locked.png');

    if(this.isNew) {
        $('.new', $elt).show();
    } else if (this.isImproved) {
        $('.improved', $elt).show();
    } else if (this.isLook) {
        $('.look', $elt).show();
    } else if (this.isBeta) {
        $('.beta', $elt).show();
    }

    $elt.click(this.onClick.bind(this));
    $(window).load(this.shrinkTextToFit.bind(this, $elt));

    this.decorate($elt);

    return $elt;
}

ModeButton.prototype.shrinkTextToFit = function ($elt) {
    var $name = $('.name', $elt);
    while ($name.height() > 18 && getFontSize($name[0]) > 14) {
        adjustTextSize($name[0], -1);
    }
    if ($name.height() > 18) {
        $name.css('line-height', '14px');
        $name.css('margin-top', '73.5px');
    }
}

ModeButton.prototype.decorate = function () {} // for subclasses, e.g. FriendsButton

ModeButton.prototype.setLocked = function(b) {
    this.$div.toggleClass('locked', b);
}

ModeButton.prototype.setAnimated = function(b) {
    this.$div.toggleClass('animated', b);
}

ModeButton.prototype.setNumber = function(position, n) {
    $('.number' + position, this.$div).html(n);
    $('.pill' + position, this.$div).toggleClass('visible', n > 0);
}

ModeButton.prototype.customOnClick = function () {
    return false;
}

ModeButton.prototype.onClick = function() {
    if (this.$div.hasClass('locked') && !this.customOnClick()) {
        return;
    }
    this.eventBus.fire(this.eventName);
}

ModeButton.prototype.playUnlockAnimation = function () {
    if (this.$animDiv) {
        this.$animDiv.remove();
    }

    this.$div.append(this.$animDiv = $('<div class="unlock-anim"><img src="img/UnlockAnim.gif"/></div>'));

    this.imvu.call('playUnlockSound');

    var anim = new YAHOO.util.Anim(this.$animDiv[0], {opacity: {from: 4.0, to:0.0}}, 4, YAHOO.util.Easing.easeOut);
    anim.animate();
}

ModeButton.prototype.hide = function () {
    this.$div.hide();
}

ModeButton.prototype.disable = function () {
    this.$div.addClass('disabled');
}

ModeButton.prototype.show = function () {
    this.$div.css('display', 'inline-block');
}
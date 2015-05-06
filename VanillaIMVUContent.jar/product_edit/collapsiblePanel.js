function CollapsiblePanel(args) {
    this.args = args;
    this.imvu = args.imvu;
    this.el = YAHOO.util.Dom.get(args.el);

    this.changedEvent = new YAHOO.util.CustomEvent('changed', this);

    this.v = this.el.querySelector('.v');
    this.hd = this.el.querySelector('.hd');
    this.bd = this.el.querySelector('.bd');
    this.toggler = this.el.querySelector('.toggler');

    YAHOO.util.Event.addListener(this.hd, 'click', this.toggle.bind(this));
    this.enable(false);
}

CollapsiblePanel.createCollapsiblePanels = function(args) {
    var result = {};

    var el = YAHOO.util.Dom.get(args.el);
    $('.collapsiblePanel', el).each(function (index, cp) {
        var hd = cp.querySelector('.hd', cp, true);
        var fade = document.createElement('div');
        fade.innerHTML = hd.innerHTML;
        hd.innerHTML = "";
        $(fade).addClass('fade');
        hd.insertBefore(fade, hd.firstChild);

        var t = document.createElement('div');
        $(t).addClass('toggler');
        t.innerHTML = "<div class='v'></div><div class='h'></div>";
        hd.appendChild(t);

        result[cp.id] = new CollapsiblePanel($.extend({}, args, {el:cp}));
    });
    return result;
}

CollapsiblePanel.prototype.shouldBeOpen = function() {
    var shouldBeOpen = this.imvu.call('shouldCollapsiblePanelBeOpen', this.el.id);
    if(shouldBeOpen === null) {
        shouldBeOpen = {
            configSkeletonVariables:true,
            configPolicyTools:true,
            configClothingOverride:true,
            configFogAndLightingParameters:true,
            configPropActionSettings:true,
            configFlashSettings:true,
            meshAsset:true,
            materialSubmeshInfo:true,
            materialTextureAssets:true,
            materialParameters:true,
            materialTextureAnimation:true,
        }[this.el.id];
    }
    return shouldBeOpen;
}

CollapsiblePanel.prototype.isOpen = function() {
    return "none" != YAHOO.util.Dom.getStyle(this.bd, 'display');
}

CollapsiblePanel.prototype.setOpen = function(b) {
    if (!$(this.el).hasClass('disabled')) {
        YAHOO.util.Dom.setStyle(this.bd, 'display', b ? '' : 'none');
        YAHOO.util.Dom.setStyle(this.v, 'display', b ? 'none' : '');
        this.imvu.call('setCollapsiblePanelOpen', this.el.id, b)
        this.changedEvent.fire(b);
    }
}

CollapsiblePanel.prototype.toggle = function() {
    if (!$(this.el).hasClass('disabled')) {
        var shouldBeOpen = !this.isOpen();
        this.setOpen(shouldBeOpen);
    }
}

CollapsiblePanel.prototype.enable = function(enable) {
    if (enable) {
        $(this.el).removeClass('disabled');
        this.setOpen(this.shouldBeOpen());
        if (this.customizeOnEnable !== undefined)
            this.customizeOnEnable(this.args);
    } else {
        $(this.el).addClass('disabled');
    }
}


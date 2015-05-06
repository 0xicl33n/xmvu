function EditDialog(args) {
    this.imvu = args.imvu;
    this.network = args.network;
    this.timer = args.timer;

    this.$header = $('h2');
    this.$close = $('.close');
    this.$close.click(this.close.bind(this));

    this.$root = $('#dialog');
    this.imvu.call('resize', this.$root.outerWidth(true), this.$root.outerHeight(true));

    this.lookup = new ProductLookup({
        root: '#product-info',
        imvu: this.imvu,
        network: this.network,
        timer: this.timer,
        action: 'edit',
    });

    this.buildVectorArt();
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

EditDialog.prototype.close = function () {
    this.imvu.call('cancelDialog');
}

EditDialog.prototype.buildVectorIcon = function (args) {
    var w = args.width || 40,
        h = args.height || 40;
        shadow = (typeof args.shadow == 'undefined') ? true : false;

    var paper = Raphael($(args.element)[0], w, h);
    var c = paper.path(args.path);
    c.attr({fill: args.fill || '#fff', stroke: args.stroke || 'transparent'});

    if (shadow) {
        var blurBy = 3;
        var shadowPaper = Raphael($(args.element)[0], w + blurBy*2, h + blurBy*2, {width: w, height: h});
        var sc = shadowPaper.path(args.path);
        sc.attr({fill: '#111', stroke: 'transparent'});
        sc.scale(1.2, 1.35);
    }

    return c;
}

EditDialog.prototype.buildVectorArt = function () {
    var editIcon = this.buildVectorIcon({element: this.$header, width: 25, height: 25, shadow: false, fill: '#fdd400', stroke: 'transparent', path: "M3,13v4h4l0.646-0.646l-4-4L3,13z M13,3L9.854,6.146l4,4L17,7L13,3z M4.354,11.646l4,4l4.793-4.793l-4-4L4.354,11.646z"});
    editIcon.scale(1.25, 1.25);
}
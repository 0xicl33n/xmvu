IMVU.Client.widget.Arrow = function (spec) {
    this.$root = $(spec.root || rootElementMustBeSpecified);
    this.origin = spec.origin;
    this.size = spec.size || {width:6, height:3};
    this.color = spec.color || '#fff';
    this.align = spec.align || 'center';
    this.margin = spec.margin || 5;

    var position = this.$root.css('position');
    if (position != 'relative' && position != 'absolute') {
        this.$root.css('position', 'relative');
    }

    this.$canvas = $('<canvas/>')
        .attr('width', this.$root.outerWidth())
        .attr('height', this.$root.outerHeight())
        .css('position', 'absolute')
        .css('top', '0px')
        .css('left', '0px')
        .css('z-index', '1');
    this.ctx = this.$canvas[0].getContext('2d');

    this.calc();
    this.draw();

    this.$root.append(this.$canvas);
}

IMVU.Client.widget.Arrow.prototype.calc = function () {
    this.drawData = {
        width: this.size.width,
        height: this.size.height,
    };

    if (!this.origin) {
        if (this.align === 'center') {
            this.origin = {
                x: this.$root.outerWidth()/2,
                y: this.$root.outerHeight()/2
            };
        } else if (this.align === 'left') {
            this.origin = {
                x: this.drawData.width/2 + this.margin,
                y: this.$root.outerHeight()/2
            };
        } else if (this.align === 'right') {
            this.origin = {
                x: this.$root.outerWidth() - this.drawData.width/2 - this.margin,
                y: this.$root.outerHeight()/2
            }
        }
    }

    this.drawData.x = this.origin.x - this.drawData.width/2;
    this.drawData.y = this.origin.y - this.drawData.height/2;
}

IMVU.Client.widget.Arrow.prototype.draw = function () {
    this.ctx.fillStyle = this.color;
    this.ctx.beginPath();
    this.ctx.moveTo(this.drawData.x, this.drawData.y);
    this.ctx.lineTo(this.drawData.x + this.drawData.width, this.drawData.y);
    this.ctx.lineTo(this.drawData.x + this.drawData.width/2, this.drawData.y + this.drawData.height);
    this.ctx.fill();
}

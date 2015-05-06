IMVU.Client.widget.Hearts = function (args) {
    if (args.$root) {
        this.$root = args.$root;
    } else {
        this.$root = $(args.root);
    }
    this.$fill = this.$root.find('.fill');
    if (this.$fill.length == 0) {
        this.$fill = $('<div></div>').attr('id','fill').addClass('fill');
        this.$root.append(this.$fill);
    }

    this.size = 13;
    this.$root.addClass('hearts');
    this.$root.addClass(args.type);
    
    switch(args.type)
    {
    case 'BigStar':
        this.size = 24;
        break;
    case 'SmallStar':
        this.size = 17;
        break;
    }
    this.$root.width(this.size * args.max);
    this.$root.height(this.size);
    this.max(args.max);
    this.fill(args.fill);
}

IMVU.Client.widget.Hearts.prototype = {
    filled: function () {
        return this.$fill.width() / this.size;
    },

    fill: function (n) {
        this.$fill.width(this.size * n);
    },

    max: function (n) {
        if (typeof n === 'undefined') {
            return this.$root.width() / this.size;
        } else {
            this.$root.width(this.size * n);
        }
    },
}

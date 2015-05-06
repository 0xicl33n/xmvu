 IMVU.Client.widget.DropDown = function (spec) {
    spec.rootElement || rootElementMustBeSpecified;
    this.$root = $(spec.rootElement);
    this.items = spec.items;
    this.selectedValue = spec.selectedValue;
    this.leftTick = spec.leftTick || false;
    this.tickSize = spec.tickSize;
    this.margin = spec.margin;

    this.fullHtmlLabels = {}; // labels get scrubbed, so map values -> original labels

    // need this so we can absolutely position the label, <select>, and canvas above one another
    var position = this.$root.css('position');
    if (position != 'relative' && position != 'absolute') {
        this.$root.css('position', 'relative');
    }

    var rootElementSize = {
        width: parseInt(this.$root.css('width'), 10),
        height: parseInt(this.$root.css('height'), 10)
    };

    this.$label = this.$root.find('.label');
    this.$label.css('position', 'absolute')
        .css('width', (rootElementSize.width - rootElementSize.height - 5) + 'px')
        .css('height', rootElementSize.height + 'px')
        .css('z-index', '2');

    this.$select = $('<select/>');
    this.$select.css('width', rootElementSize.width + 'px')
        .css('height', rootElementSize.height + 'px')
        .css('position', 'absolute')
        .css('top', '0px')
        .css('left', '0px')
        .css('opacity', '0')
        .css('z-index', '3')
        .css('background-color', this.$root.css('background-color'))
        .css('color', this.$label.css('color'));


    for each (var item in this.items) {
        this.addOption(item[0], item[1]);
    }
    this.selectByValue(this.selectedValue);
    this.$root.append(this.$select);
    console.log("select offset", this.$select.offset());
    console.log("label offset", this.$label.offset());

     if (!this.selectedValue && this.items[0] && this.items[0][1]) {
        this.selectedValue = this.items[0][1];
    }
    this.selectByValue(this.selectedValue);

    this.$select.bind('change', function () {
        this.refreshLabel();
    }.bind(this));

    var $canvas = $('<canvas/>')
        .attr('width', rootElementSize.width)
        .attr('height', rootElementSize.height)
        .css('position', 'absolute')
        .css('top', '0px')
        .css('left', '0px')
        .css('z-index', '1');

    this.$root.css('-moz-border-radius', '4px');

    new IMVU.Client.widget.Arrow({
        root: this.$root,
        size: this.tickSize,
        color: this.$label.css('color'),
        align: 'right',
        margin: this.margin,
    });
}

IMVU.Client.widget.DropDown.prototype.getSelectedValue = function () {
    return this.$select.val();
}

IMVU.Client.widget.DropDown.prototype.getLabelByValue = function (value) {
    return this.fullHtmlLabels[value];
}

IMVU.Client.widget.DropDown.prototype.selectByValue = function (value) {
    this.$select.val(value);
    this.refreshLabel();
}

IMVU.Client.widget.DropDown.prototype.refreshLabel = function () {
    this.$label.html(this.fullHtmlLabels[this.getSelectedValue()]);
}

IMVU.Client.widget.DropDown.prototype.addOption = function (htmlLabel, value, id) {
    this.fullHtmlLabels[value] = htmlLabel;      

    this.$select.append($('<option class="ui-event"/>')
        .text(htmlLabel.replace(/<.*?>/g, ''))
        .attr('value',"" + value)
        .attr('data-ui-name', this.$root[0].id + '-option-selected')
        .attr('data-ui-' + this.$root[0].id + '-option-value', "" + value)
        .attr('id', id || null));
}

IMVU.Client.widget.DropDown.prototype.getSelectedLabel = function () {
    return this.fullHtmlLabels[this.getSelectedValue()];
}

IMVU.Client.widget.DropDown.prototype.removeOptionByValue = function (value) {
    this.$select.find('option[value=' + value + ']').remove();
}

IMVU.Client.widget.DropDown.prototype.removeAllOptions = function () {
    this.$select.children().remove();
    this.refreshLabel();
}

IMVU.Client.widget.DropDown.prototype.getOptions = function () {
    var result = [];
    this.$root.find('option').each(function () {
        result.push([this.text, this.value]);
    });
    return result;
}


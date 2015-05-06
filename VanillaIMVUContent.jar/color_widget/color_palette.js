
function ColorPalette(element) {
    this.element = element;

    var children = element.getElementsByTagName('img');

    var re = /.*?[^a-z]([a-z]+)\.png/;
    for (var i = 0; i < children.length; ++i) {
        var child = children[i];
        var color = child.src.replace(re, '$1');

        child.addEventListener('click', this.onClick.bind(this, color), false);
    }
}

ColorPalette.prototype = {
    onClick: function (color, event) {
        imvu.call('setRoomColor', color);
    }
}

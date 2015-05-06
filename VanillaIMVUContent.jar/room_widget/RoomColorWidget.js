function RoomColorWidget(args) {
    this.rootElement = args.panel;
    this.imvu = args.imvu;
    
    this.localStoreDefaultColor = 'roomColor.default';

    $('.hd .closeButton').click(function() {
        $('#roomWidget').trigger('closeActiveTabEvent');
    });

    this.colors = [
                   { id: '#c30018', name: 'burgundy' },
                   { id: '#e72636', name: 'red' },
                   { id: '#aa5a64', name: 'pink' },
                   { id: '#cfb12f', name: 'yellow' },
                   { id: '#9b905c', name: 'gold' },
                   { id: '#5fb836', name: 'lime' },
                   { id: '#3f9b5d', name: 'green' },
                   { id: '#2f9b8f', name: 'aqua' },
                   { id: '#6E7496', name: 'blue' },
                   { id: '#9c5a99', name: 'purple' },
                   { id: '#171717', name: 'black' },
                   { id: '#e6e1ca', name: 'cream' },
                   ];

    for (i in this.colors) {
        $('#colorPicker table tr').append('<td class="swatch"><div id="n' + this.colors[i]['name'] + '" style=" background: ' + this.colors[i]['id'] + ';" class="colorSwatch"></div></td>');
        $('#n' + this.colors[i]['name']).click(this.onClick.bind(this, this.colors[i]['name']));
    }
    var color = this.imvu.call('getLocalStoreValue', this.localStoreDefaultColor, 'purple')
    this.onClick(color);
}

RoomColorWidget.prototype = {
    onClick: function (color, event) {
        this.imvu.call('setRoomColor', color);
        for (i in this.colors) {
            $('#n' + this.colors[i]['name']).removeClass('selected');
        }
        $('#n' + color).addClass('selected');
        this.imvu.call('setLocalStoreValue', this.localStoreDefaultColor, color);
    },

    shouldDisplay: function() {
        return true;
    }
};

function DecorateRoomInfoDialog(imvu, dialoginfo) {
    
    this.imvu = imvu;
    
    for ( k in dialoginfo.sections ) {
        if ( dialoginfo.sections[k] ) {
            $('#section-' + k).show();
        } else {
            $('#section-' + k).hide();
        }
    }
    
    $('#close-button').click(this.cancelDialog.bind(this));
    onEscKeypress(this.cancelDialog.bind(this));
}

DecorateRoomInfoDialog.prototype = {
    cancelDialog: function() {
        this.imvu.call('cancelDialog');
    }
};

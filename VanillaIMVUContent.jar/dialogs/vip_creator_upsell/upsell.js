function buildUpsell($root, imvu) {
    var info = imvu.call('getDialogInfo');
    if (!info.buttons) {
        info.stage = 'guestToVIP';
        info.title = 'VIP Required';
        info.text = 'Create mode is locked. You must be a VIP to earn credits selling your creations.';
        info.confirm_text = '';
        info.buttons = [
            {name: 'Cancel', grey:true, value: false},
            {name: 'Take me there!', yellow:true},
        ];
    }
    $('.dialog', $root).addClass(info.stage);
    new Alert({root: '.dialog', imvu: imvu, info: info});
    $('#text').append($('<div id="exclamation"></div>'));

    $("#takemethere, #renewvip").click(function() {
        if ( $('.dialog', $root).hasClass('guestToVIP') ) {
            imvu.call('launchUrl', 'http://www.imvu.com/vip_club/');
        } else if ( $('.dialog', $root).hasClass('VIPToCreator') ) {
            imvu.call('launchUrl', 'http://www.imvu.com/creators/');
        } else if ( $('.dialog', $root).hasClass('lapsedVIP') ) {
            imvu.call('launchUrl', 'http://www.imvu.com/store/index/');
        }
    }.bind(this));
    onEscKeypress(function() {
        imvu.call('cancelDialog');
    }.bind(this));
}
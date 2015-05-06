var Dom = YAHOO.util.Dom;
var Event = YAHOO.util.Event;

function ModeInterstitial(spec) {
    spec = spec || {};
    var el = spec.el || rootElementRequired;
    var imvuCall = spec.imvuCall || imvuCallRequired;
    var info = spec.info || infoRequired;
    var mode = info.mode;

    $(el).attr('class', mode);

    function endDialog(result) {
        imvuCall("endDialog", result);
    }
    this.$vipLink = $(el).find('.action-vip-link');
    this.$vipLink.unbind('click').click(function() {
        imvuCall('launchNamedUrl', 'vippass');
        $('#closeButton').click();
    });
    Event.addListener(el.querySelector('#closeButton'), 'click', endDialog);
    Event.addListener(el.querySelectorAll('.action-close'), 'click', endDialog);


    //Update dialog dimensions
    $bd = $('.bd.'+info.mode);
    var dialogHeight = $bd.outerHeight();
    var dialogWidth = $(el).outerWidth(true);
    $(el).css('height', dialogHeight);
    imvuCall('resize', dialogWidth, dialogHeight);
    onEscKeypress(function () {
        imvuCall('cancelDialog');
    }.bind(this));
}

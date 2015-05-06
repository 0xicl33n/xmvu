function Upsell(spec) {
    spec = spec || {};
    var el = spec.el || rootElementRequired;
    var imvuCall = spec.imvuCall || imvuCallRequired;
    var info = spec.info || infoRequired;

    $(el).attr('class', info.mode);

    function endDialog(result) {
        imvuCall("endDialog", result);
    }
    
    this.$close = $(el).find('.action-close');
    this.$close.unbind('click').click(function() {
        endDialog();
    });

    this.$apLink = $(el).find('.action-ap-link');
    this.$apLink.unbind('click').click(function() {
        imvuCall('launchNamedUrl', 'accesspass');
        $('#closeButton').click();
    });

    //Update dialog dimensions
    $bd = $('.bd.'+info.mode);
    var dialogHeight = $bd.outerHeight();
    var dialogWidth = $(el).outerWidth(true);
    $(el).css('height', dialogHeight);
    imvuCall('resize', dialogWidth, dialogHeight);

    onEscKeypress(function() {
        endDialog({});
    }.bind(imvu));
}

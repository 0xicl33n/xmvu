function Alert(args) {
    args = args || {};

    var $root = $(args.root);
    var imvu = args.imvu || imvuRequired;
    var info = args.info || {};

    function endDialog(result) {
        imvu.call("endDialog", result);
    }

    var $content = $root.find('#content');

    this.$close = $root.find('.close');
    this.$close.click(function () { imvu.call('cancelDialog'); });

    IMVU.buttons.addButtons(endDialog, info.buttons);

    IMVU.Client.util.turnLinksIntoLaunchUrls($content, imvu);

    imvu.call('resize', $root.outerWidth(true), $root.outerHeight(true));
    onEscKeypress(function() {
        imvu.call('cancelDialog');
    }.bind(this));
}

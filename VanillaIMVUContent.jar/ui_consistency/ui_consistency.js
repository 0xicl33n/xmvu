function UIConsistencyMode(args) {
    this.$root = $(args.root);
    this.$guidance = this.$root.find('#further-guidance a');
    this.$dialogs = this.$root.find('#dialogs');
    this.imvu = args.imvu;

    IMVU.Client.util.turnLinksIntoLaunchUrls(this.$root, this.imvu);

    var dialogs = args.dialogs || [];
    for (var i = 0; i < dialogs.length; i += 1) {
        var $header = $('<h3/>'),
            $iframe = $('<iframe/>');
        (function ($iframe, $header) {
            $iframe.load(function () {
                var $dialog = $iframe.contents().find('#dialog');
                $iframe.width($dialog.outerWidth(true));
                $iframe.height($dialog.outerHeight(true));
                $header.text($iframe.contents().find('title').text());
                $(document).scrollTop(0);
            }.bind(this));
        }($iframe, $header));
        $iframe.attr('src', dialogs[i]);
        this.$dialogs.append($header).append($iframe);
    }
}
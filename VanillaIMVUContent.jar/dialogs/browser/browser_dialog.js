function Browser(args) {
    this.$root = $(args.root);
    this.imvu = args.imvu || imvuRequired;
    this.info = args.info || {};

    this.$spinner = this.$root.find('#spinner');
    this.$root.find('.close').click(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));

    this.$iframe = this.$root.find('iframe');
    this.$iframe.height(this.info.height);
    this.$iframe.load(function () {
        var $iframeContentBody = $(this.$iframe[0].contentWindow.document.body),
            iframeContentWidth = $iframeContentBody.outerWidth(true),
            iframeContentHeight = $iframeContentBody.outerHeight(true);
        $('#dialog').width(iframeContentWidth);
        this.$iframe.width(iframeContentWidth);
        this.$iframe.height(iframeContentHeight);
        this.imvu.call('resize', $('#dialog').outerWidth(true), $('#dialog').outerHeight(true));
        this.$spinner.width($('#dialog').outerWidth(true));
        this.$spinner.height($('#dialog').outerHeight(true));
        this.$spinner.hide();
    }.bind(this));

    this.$spinner.width($('body').outerWidth());
    this.$spinner.height($('body').outerHeight());
    this.$iframe.attr('src', this.info.src);
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

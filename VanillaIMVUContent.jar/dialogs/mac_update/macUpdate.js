function MacUpdateDialog(args) {
    this.$root = $(args.root);
    this.imvu = args.imvu;

    this.$ok = this.$root.find('#ok');
    this.$ok.click(function () { this.imvu.call('endDialog', true); }.bind(this));

    IMVU.Client.util.turnLinksIntoLaunchUrls(this.$root, this.imvu);
    this.$link = this.$root.find('#link');

    this.imvu.call('resize', this.$root.outerWidth(true), this.$root.outerHeight(true));
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}
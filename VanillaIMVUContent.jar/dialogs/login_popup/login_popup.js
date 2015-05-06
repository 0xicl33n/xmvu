function LoginPopup(args) {
    this.imvu = args.imvu;
    this.info = args.info;
        
    $('#close_button').click(function () {
        this.imvu.call('endDialog', null);
    }.bind(this));

    $('#content_div').append('<iframe id="content_frame" scrolling="no" src="'+this.info["url"]+'"></iframe>');
    var launchFn = this.imvu.call;
    $('#content_frame').load(function () {
        $('#content_frame').height(this.info["height"]);
        $('#content_frame').width(this.info['width']);
        $('#content_frame').contents().find('a').click(function(e) {
            e.preventDefault();
            launchFn("launchUrl", this.href );
           });
        if (args.callback) args.callback(); // This is because the test needs to wait for the iframe to load.
    }.bind(this));
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

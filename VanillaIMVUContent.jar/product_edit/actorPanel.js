function ActorPanel(args) {
    this.el = $(args.el)[0];
    this.imvu = args.imvu;
    $(this.$('#addActorButton')).click(function () {
        this.imvu.call('addActor');
    }.bind(this));
}

ActorPanel.prototype = {
    $: function(spec, parentEl) {
        return (parentEl || this.el).querySelector(spec);
    },
    $$: function(spec, parentEl) {
        return (parentEl || this.el).querySelectorAll(spec);
    }
};

function PerformanceWidget(args) {
    this.rootElement = args.panel;
    this.$root = $(args.panel);
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;

    this.$root.find('#breakdown').accordion({collapsible: true, autoHeight: false});
    $('#breakdown').accordion('activate', false);

    this.$root.find('#breakdown-selector .visual').click(function(){
        this.breakdownBy('visual');
        this.refreshView();
    }.bind(this));
    this.$root.find('#breakdown-selector .download').click(function(){
        this.breakdownBy('download');
        this.refreshView();
    }.bind(this));
    this.$root.find('#breakdown-selector .memory').click(function(){
        this.breakdownBy('memory');
        this.refreshView();
    }.bind(this));

    this.eventBus.register('SceneGraphChanged', (function(eventName, data) {
        this.update();
    }).bind(this), 'SceneViewer');

    this.breakdownBy('visual');
    this.update();
}

PerformanceWidget.prototype = {
    update: function() {
        this.metrics = this.imvu.call('getSceneMetrics');
        this.refreshView();
    },

    shouldDisplay: function() {
        return this.imvu.call('isQA');
    },

    breakdownBy: function(metric) {
        this.activeMetric = metric;
        this.$root.find('#breakdown-selector span').removeClass('active');
        this.$root.find('#breakdown-selector .' + metric).addClass('active');
    },

    refreshView: function() {
        var metrics = {
            visual: this.metrics['triangleCount'],
            memory: this.metrics['geometrySize'] + this.metrics['textureSize'],
            download: this.metrics['roomMinimumDownloadSize'],
        };
        var metric = metrics[this.activeMetric];
        this.$root.find('#room .metric').text(IMVU.Client.util.number_format(metric));
    },
};

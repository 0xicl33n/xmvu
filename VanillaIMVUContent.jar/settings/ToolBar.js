function ToolBar(imvu) {
    function subscribe(id, handler, self) {
        var el = document.getElementById(id);
        YAHOO.util.Event.addListener(el, 'click', handler, self, true);
    }

    this.imvu = imvu;

    subscribe('clear-cache', this.clearCache, this);
    subscribe('send-logs', this.sendLogs, this);
}

ToolBar.prototype = {
    clearCache: function() {
        this.imvu.call('clearCache');
    },

    sendLogs: function() {
        this.imvu.call('sendLogs');
    }
};

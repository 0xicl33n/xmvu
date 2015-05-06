var Dom = YAHOO.util.Dom;
var Event = YAHOO.util.Event;

var DailyGiftDialog = function(imvu, net) {
    this.imvu = imvu;
    this.net = net;
    
    this.loadContent();
    YAHOO.util.Event.on('close_button', 'click', this.clickClose, null, this);
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
};

DailyGiftDialog.prototype = {
    
    clickClose : function() {
        this.imvu.call('endDialog', 0);
    },
    
    loadContent : function() {
        this.net.asyncRequest("GET", IMVU.SERVICE_DOMAIN + '/api/daily_gift.php', {
            success: function(o) {
                document.open();
                document.write(o.responseText);
                document.close();
            },
            failure: function(o) {
                
            }
        });
    }
};
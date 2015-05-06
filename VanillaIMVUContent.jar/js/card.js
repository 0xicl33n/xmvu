
IMVU.Client.widget.Card = function() {
    
    var _ = this;

    this.tab = document.querySelectorAll('#ft .tab');
    this.content = document.querySelectorAll('.content');
    this.onTabChange = new YAHOO.util.CustomEvent('onTabChange');

    YAHOO.util.Event.on(
        this.tab,
        'click',
        function() {
            _.setTab(this);
        }
    );
};

IMVU.Client.widget.Card.prototype = {
    setTab: function(el) {
        if($(el).hasClass('selected')) {
            return;
        }
        
        var tabName = el.id.replace(/tab_/g, '');      
        
        YAHOO.util.Dom.batch(
            this.tab,
            function(tab) {
                $(tab).removeClass('selected');
            }
        );
        $(el).addClass('selected');
        
        YAHOO.util.Dom.batch(
            this.content,
            function(content) {
                $(content).removeClass('selected');
            }
        );
        $('#content_' + tabName).addClass('selected');
        
        this.onTabChange.fire({'tabName': tabName});
    },
    
    getSelectedTab: function() {
        for each (var tab in this.tab) {
            if ($(tab).hasClass('selected')) {
                return tab;
            }
        }
        return null;
    }
};


LoadingMask = function(hookNode) {
    this.hookNode = hookNode;
    this.render();
};

LoadingMask.prototype = {
    render: function() {
        this.hookNode.innerHTML = [ 
            '<div id="loading_mask_outer">',
                '<div id="loading_mask_middle">',
                    '<div id="loading_mask_inner">',
                        '<img src="../img/spinner_white.apng" id="loading_mask_image" />',
                    '</div>',
                '</div>',
            '</div>'
        ].join("\n");
        
        this.spinner = this.hookNode.querySelector('#loading_mask_outer');
    },

    show : function() {
        YAHOO.util.Dom.setStyle(this.spinner, 'display', 'block');
    },
    
    hide : function() {
        YAHOO.util.Dom.setStyle(this.spinner, 'display', 'none');
    },
    
    isVisible : function() {
        return 'none' != YAHOO.util.Dom.getStyle(this.spinner, 'display');
    }
};

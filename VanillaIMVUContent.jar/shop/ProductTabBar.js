IMVU.Client.ProductTab = function (args) {
    this.imvu = args.imvu;
    this.label = args.label;
    this.attributes = args.attributes;
    this.view = args.view;
    this.filters = args.filters;
    this.searchable = args.searchable;
    this.showContentFilter = args.showContentFilter;
    this.tabBar = args.tabBar;
    this.tabid = args.attributes.id;
    this.hideFilters = !!args.hideFilters;
    this.vip_only = !!args.vip_only; 
    this.is_shop_together = !!args.shop_together;
    
    this.selectEvent = new YAHOO.util.CustomEvent('select', this);

    this.element = document.createElement('li');
    this.element.innerHTML = args.label;
    for (var attr in args.attributes) {
        if (attr) {
            this.element.setAttribute(attr, args.attributes[attr]);
        }
    }
    
    this.altTrigger = (args.altTrigger) ? document.querySelector(args.altTrigger) : document.createElement('div');

    YAHOO.util.Event.addListener(this.element, 'click', this.select, this, true);
    YAHOO.util.Event.addListener(this.altTrigger, 'click', this.select, this, true);
};

IMVU.Client.ProductTab.prototype = {

    select : function(event) {
        if(event) {
            YAHOO.util.Event.stopEvent(event);
        }
                
        if (this.vip_only && !this.imvu.call('hasVIPPass') && this.is_shop_together) {        
            this.imvu.call('showShopTogetherExtraBenefitsInviteDialog');
            return;
        }
        
        this.tabBar.deselectAll();
        this.tabBar.selectedTab = this;
        
        $([this.altTrigger, this.element, this.view.container]).addClass('selected');

        this.view.clearFilters();
        this.view.toggleFiltersVisibility(!this.hideFilters);

        var firstFilterName = null;
        for (var filter in this.filters) {
            if (!firstFilterName) firstFilterName = filter;
            if (filter && this.view[filter]) {
                var select = this.view[filter];
                var options = this.filters[filter];
                for (var o=0;o<options.length;o++) {
                    select.options[select.options.length] = new Option(options[o][0], options[o][1]);
                }
            }
        }
        
        if (this.filters) {
            var firstFilter = this.filters[firstFilterName][0];
            var categoryName = firstFilter[0];
            var categoryId = firstFilter[1];    
        }
        $('body').trigger('productTabSelected', [this, categoryId, categoryName]);

        this.selectEvent.fire(this);
        this.tabBar.selectTabEvent.fire(this);
    },

    deselect : function() {
        $([this.altTrigger, this.element, this.view.container]).removeClass('selected');
    }

};

IMVU.Client.ProductTabBar = function(imvu, container) {
    this.imvu = imvu;

    this.container = (container instanceof HTMLElement ? container : YAHOO.util.Dom.get(container));
    this.elements = {};
    
    this.tabs = {};
    this.selectedTab = null;
    this.defaultTab = null;

    this.selectTabEvent = new YAHOO.util.CustomEvent('selectTab', this);

    this.createElements();
};

IMVU.Client.ProductTabBar.prototype = {

    createElements : function() {
        this.elements.tabList = document.createElement('ul');
        this.container.appendChild(this.elements.tabList);
    },
    
    setDefault : function(id) {

        if(this.tabs[id].searchable) {
            this.defaultTab = this.tabs[id];
        }        
        
        return this.defaultTab;
    },

    addTab: function (args) {
        if (!args.attributes.hasOwnProperty('id')) {
            throw new Error('FATAL ERROR: You must pass an id with every tab in ProductTabBar.');
        }
        var altTrigger = (args.altTrigger) ? args.altTrigger : null;
        
        var newTab = new IMVU.Client.ProductTab($.extend(args, {imvu: this.imvu, tabBar: this}));
        $(newTab.element).toggleClass('vip-only', !!args.vip_only);
        $(newTab.element).addClass('ui-event');
        $(newTab.element).attr('data-ui-name', 'TabClicked');
        $(newTab.element).attr('data-ui-tab', args.name);
        this.elements.tabList.appendChild(newTab.element);
        this.tabs[args.attributes.id] = newTab;
        newTab.selectEvent.subscribe(args.view.handleTabClick, args.view, true);
    },    
    
    hasTab: function(id) {
        var tab = this.elements.tabList.querySelector('#' + id);
        if (tab){
            return true;
        }
        return false;
    },
    
    removeTab: function(id) {
        var tab = this.elements.tabList.querySelector('#' + id);
        if(tab) {
            if(this.tabs[id].altTrigger.parentNode) {
                this.tabs[id].altTrigger.parentNode.removeChild(this.tabs[id].altTrigger);
            }
            this.elements.tabList.removeChild(tab);
            delete this.tabs[id];
        }
    },

    deselectAll : function() {
        for each(var tab in this.tabs) {
            tab.deselect();
        }
        this.selectedTab = null;
    }

};

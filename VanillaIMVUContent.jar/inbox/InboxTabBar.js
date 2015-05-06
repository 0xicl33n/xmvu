
InboxTabBar = function (el, imvu) {
    this.el = el;
    this.imvu = imvu;
    this.panes = {};
    this.refreshCallbacks = {};
    this.activeTabId = null;

    this.newMessageButton = this.el.querySelector('#new-message-button');
    this.playGetMatchedButton = this.el.querySelector('#play-get-matched-button');
    YAHOO.util.Event.addListener(this.newMessageButton, 'click', this.doNewMessageButton, this, true);
    
    this.playGetMatched = this.el.querySelector('#play-get-matched-button');
    YAHOO.util.Event.addListener(this.playGetMatched, 'click', this.doPlayGetMatchedButton, this, true);

    var refreshButton = this.el.querySelector('#refresh-button');
    YAHOO.util.Event.addListener(refreshButton, 'click', this.doRefreshButton, this, true);
};

InboxTabBar.prototype = {
    doNewMessageButton: function () {
        IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
        this.imvu.call('showMessageDialog', 0);
    },
    
    doPlayGetMatchedButton: function () {
        IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
        this.imvu.call('playGetMatched');
    },

    doRefreshButton: function () {
        IMVU.Client.EventBus.fire('InboxMode.ReloadAd', {});
        this.refreshCallbacks[this.activeTabId]();
    },

    deactivateAllPanes: function () {
        $('.tab-contents', this.el).each(function (index, pane) {
            $(pane).removeClass('visible');
        });
    },
    
    deactivateCurrentActiveTab: function () {
        $('#refresh-button').show();
        var curActiveTab = this.el.querySelector('div.tab.active');
        if(curActiveTab) {
            $(curActiveTab).removeClass('active');
        } 
        this.deactivateAllPanes();
    },

    activatePane: function (id) {
        if(this.panes[id]) {
            $(this.panes[id]).addClass('visible');
        } 
    },
    
    activateTab: function (id) {
        var newActiveTab = YAHOO.util.Dom.get(id, this.el);
        if(newActiveTab) {
            $(newActiveTab).addClass('active');
        }
        if (id === 'get-matched') {
            $(this.playGetMatchedButton).show();
            $(this.newMessageButton).hide();
        } else {
            $(this.playGetMatchedButton).hide();
            $(this.newMessageButton).show();
        }
        this.activatePane(id);
        this.activeTabId = id;
        this.el.querySelector('#backToTab').style.visibility = 'hidden';
    },

    addTab: function (id, text, pane_id, refreshCallback) {
        this.panes[id] = this.el.querySelector('#' + pane_id);
        this.refreshCallbacks[id] = refreshCallback;
        var newTab = document.createElement("div");
        $(newTab).addClass('tab');
        newTab.setAttribute('id', id);
        newTab.innerHTML = "<div class='tab-left'></div><div class='tab-middle'><div class='tabtext'><div class='fg tt-inner'></div><div class='bg tt-inner'></div></div></div><div class='tab-right'></div>";
        this.el.querySelector('#tabs').appendChild(newTab);
        this.setTabText(id, text);
        YAHOO.util.Event.addListener(newTab, 'click', function(){this.setActiveTab(id);}, this, true);
    },
    
    setTabText: function(id, text) {
        var tab = this.el.querySelector('#' + id);
        if(tab) {
            $('.tt-inner', tab).each(function (index, el) {
                el.innerHTML = text;
            });
        }
    },

    setActiveTab: function(id) {
        this.deactivateCurrentActiveTab();
        this.activateTab(id);
        IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
    }
};

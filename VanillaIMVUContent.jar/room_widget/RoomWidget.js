RoomWidget = function(args) {
    args.imvu.call('log', "Creating roomwidget");

    this.elt = YAHOO.util.Dom.get(args.elt);
    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.util = new RoomUtil({network: this.network, imvu: this.imvu});

    this.theName = this.elt.querySelector('#thename');
    this.roomWidgetRest = this.elt.querySelector('#roomWidgetRest');
    this.nameHolder = this.elt.querySelector('#nameHolder');
    this.circleDialHolder = this.elt.querySelector('#circleDialHolder');
    this.tabsHolder = this.elt.querySelector('#tabsHolder');
    this.activePanelHolder = this.elt.querySelector('#activePanelHolder');
    this.inactivePanelHolder = this.elt.querySelector('#inactivePanelHolder');
    this.loadingSausage = this.elt.querySelector('#loadingSausage');

    this.widgetFactories = {
        'decorate': DecorateWidget,
        'music': MusicWidget,
        'performance': PerformanceWidget,
        'ratings': RatingsWidget,
        'themedroom': ThemedRoomWidget,
        'roomcolor': RoomColorWidget,
    };

    this.circleDial = new CircleDial();
    this.circleDial.setBorderWidth(30);
    this.circleDial.setInnerRadius(20);
    this.circleDialHolder.appendChild(this.circleDial.svg);
    this.setLoadingProgress(0);
    this.widgets = {};

    this.roomInstanceId = null;

    YAHOO.util.Event.addListener(this.nameHolder, 'click', this.showRoomCard, this, true);
    
    this.toggleHolder = this.elt.querySelector('#toggleHolder');
    YAHOO.util.Event.addListener(this.toggleHolder, 'click', this.toggle, this, true);

    YAHOO.util.Event.addListener(this.elt, 'mouseleave', function() {
            this.__hideAllPreviews();
        }, this, true);

    $(this.elt).bind('closeActiveTabEvent', function() {
        this.__deactivateSpecificTab(this.getActiveTab());
        this.__hidePreview(this.getPreviewTab());
    }.bind(this));
    
    $(this.elt).bind('activateTabByName', function(event, tabName) {
                        this.activateTabByName(tabName);
                    }.bind(this));

    this.show(true);
    this.open();

    this.eventBus.register('SessionWindow.setRoomOwner', this.validateTabs.bind(this));

    $('#addFavorite').click(function () {
        if (this.isFavorite()) {
            IMVU.Client.EventBus.fire('RemoveFavorite',{'roomId':this.roomInstanceId});

        } else {
            IMVU.Client.EventBus.fire('AddFavorite',{'roomId':this.roomInstanceId});
        }
    }.bind(this));

    this.__helperRegisterEvents();
};

RoomWidget.prototype = {
    setInfo : function(name, roomInstanceId, roomInfo) {
        this.roomInstanceId = roomInstanceId;
        this.roomInfo = roomInfo;
        // this is temporary
        this.roomInfo.showRatings = this.roomInfo.showFavorite;
        this.theName.innerHTML = name;
        console.log("hasRoomInstanceId " + (!!this.roomInstanceId).toSource());
        $(this.elt).toggleClass('hasRoomInstanceId', !!this.roomInstanceId);
        if (this.roomInfo && (this.roomInfo.type == "our_room" || !this.roomInfo.showFavorite)) {
            $('#addFavorite').hide();
        }

        if (this.roomInfo && !this.roomInfo.showRatings) {
            $('#ratingsPanel').hide();
        }
    },

    setName : function(name) {
        this.theName.innerHTML = name;
    },

    showRoomCard : function() {
        if (!this.roomInstanceId) {
            return;
        }
        this.imvu.call('showRoomCard', this.roomInstanceId, true);
    },

    showNominateRoomDialog : function() {
        this.imvu.call('showNominateRoomDialog');
    },

   showAddFavoriteButton: function() {
        $('#addFavorite').show();
    },
    
    hideAddFavoriteButton: function() {
        $('#addFavorite').hide();
    },

    setFavoriteButtonTextFavorite: function() {
        $("#addFavIcon").addClass('fav');
        $('#addFavText').text(_T('Remove from favorites'));
    },

    setFavoriteButtonTextNotFavorite: function() {
        $("#addFavIcon").removeClass('fav');
        $('#addFavText').text(_T('Add to favorites'));
    },

    isFavorite: function() {
        return $("#addFavIcon").hasClass('fav');
    },

    setLoadingProgress : function(v) {
        if (v <= 0 || v >= 1) {
            YAHOO.util.Dom.setStyle(this.loadingSausage, 'display', 'none');
        } else {
            YAHOO.util.Dom.setStyle(this.loadingSausage, 'display', '');
        }
        this.circleDial.setFull(v);
    },

    show: function(show) {
        if (show) {
            YAHOO.util.Dom.setStyle(this.elt, 'display', '');
        } else {
            YAHOO.util.Dom.setStyle(this.elt, 'display', 'none');
        }
    },

    open : function() {
        this.isOpen = true;
        this.updateOpenDisplay();
    },

    close : function() {
        this.isOpen = false;
        this.updateOpenDisplay();
     },

    toggle : function() {
        this.isOpen = !this.isOpen;
        this.updateOpenDisplay();
    },

    updateOpenDisplay : function() {
        var toggle = this.elt.querySelector('#toggle');
        if (this.isOpen) {
            toggle.innerHTML = '&ndash;';
            YAHOO.util.Dom.setStyle(this.roomWidgetRest, 'display', 'block');
            $(this.toggleHolder).addClass('open');
        } else {
            toggle.innerHTML = '+';
            YAHOO.util.Dom.setStyle(this.roomWidgetRest, 'display', 'none');
            $(this.toggleHolder).removeClass('open');
        }
    },

    addCssRule : function(rule) {
        var sheet = document.styleSheets[0];
        sheet.insertRule(rule, 0);
    },

    setDecorateTool : function(toolName) {
        var widget = this.getWidget('decorate');
        var tab = this.getTabByName('decorate');
        if (widget) {
            if (toolName !== '' && !this.__isPreviewTab(tab) && !this.__isActiveTab(tab)) {
                this.__clickTab(tab);
            } else if (toolName === ''){
                this.__deactivateSpecificTab(tab);
            }
            widget.setActiveTool(toolName);
        }
    },

    hasWidget : function(name) {
      return name in this.widgets;
    },

    getWidget : function(name) {
        return this.widgets[name];
    },

    validateTabs: function() {
        for (var widget in this.widgets) {
            var tab = this.getTabByName(widget);
            if (this.widgets[widget].shouldDisplay()) {
                tab.style.display = "block";
            } else {
                if (tab) {
                    this.__deactivateSpecificTab(tab);
                    tab.style.display = "none";
                }
            }
        }
    },

    addTab: function(name) {
        if (!this.getTabByName(name)) {
            var tab = document.createElement('div');
            $(tab).addClass('tab');
            tab.name = name;

            var panelId = name+'Panel';
            var panel = this.elt.querySelector('#' + panelId);
            tab.panel = panel;

            var tabImage = document.createElement('div');
            $(tabImage).addClass('tabImage tab-'+name);
            tab.appendChild(tabImage);
            tab.setAttribute('imvu:tabName', name);
            this.tabsHolder.appendChild(tab);

            this.addCssRule(".tab-%NAME% { background:url(img/button_%NAME%.png) no-repeat; }".replace(/%NAME%/g, name));
            this.addCssRule(".tab:not(.active):not(.disabled) .tab-%NAME%:hover { background:url(img/button_%NAME%_hover.png) no-repeat; }".replace(/%NAME%/g, name));
            this.addCssRule(".tab.active .tab-%NAME% { background:url(img/button_%NAME%_active.png) no-repeat; }".replace(/%NAME%/g, name));

            YAHOO.util.Event.addListener(panel, 'click', function() {
                if (this.__isPreviewTab(tab)) {
                    $(tab).removeClass('preview');
                    this.__activateSpecificTab(tab);
                }
            }, this, true);

            YAHOO.util.Event.addListener(tab, 'click', function() {
                this.__clickTab(tab);
            }, this, true);

            YAHOO.util.Event.addListener(tab, 'mouseenter', function() {
                this.__showPreview(tab);
            }, this, true);
        }

        if (this.widgetFactories[name] && !this.widgets[name]) {
            var args = {
                panel: panel,
                imvu: this.imvu,
                network: this.network,
                eventBus: this.eventBus,
                roomInfo: this.roomInfo,
                roomInstanceId: this.roomInstanceId
            };
            this.widgets[name] = new this.widgetFactories[name](args);
        }
        this.validateTabs();
    },

    __helperRegisterEvents: function() {
        this.eventBus.register('AddFavorite', function (event, data) {
            if (data.roomId == this.roomInstanceId) {
                if (!$("#addFavIcon").hasClass('fav')) {
                    this.util.addFavorite(this.roomInstanceId, function () {
                        $("#addFavText").animate({width: 'toggle'}, 350, function () {
                            $("#addFavText").hide();
                        });
                        $("#addFavText").text('');
                    });
                    this.setFavoriteButtonTextFavorite();
                }
            }
        }.bind(this));

        this.eventBus.register('RemoveFavorite', function (event, data) {
            if (data.roomId == this.roomInstanceId) {
                if ($("#addFavIcon").hasClass('fav')) {
                    this.util.removeFavorite(this.roomInstanceId, function () {
                        $("#addFavText").animate({width: 'toggle'}, 350, function () {
                            $("#addFavText").fadeIn(350);
                        });
                    });
                    this.setFavoriteButtonTextNotFavorite();
                }
            }
        }.bind(this));
    },

    __showPreview : function(tab){
        //only show preview if there is no active tab
        if ( !this.tabsHolder.querySelector('.active')) {
            var self = this;
            $(this.tabsHolder).children('.tab').each(function (index, t) {
                if (t != tab && self.__isPreviewTab(t)){
                    self.__hidePreview(t);
                }
            });
            if (!this.tabsHolder.querySelectorAll('.active').length && !this.__isPreviewTab(tab)){
                $(tab).addClass('preview');
                this.__showTab(tab);
            }
        }
    },

    __hideAllPreviews : function() {
        var self = this;
        $(this.tabsHolder).children('.tab').each(function (index, t) {
            if (self.__isPreviewTab(t)){
                self.__hidePreview(t);
            }
        });
    },

    __hidePreview : function(tab){
        if (this.__isPreviewTab(tab)){
            $(tab).removeClass('preview');
            this.__hideTab(tab);
        }
    },

    __showTab : function(tab){
        var listener = this.widgets[tab.getAttribute('imvu:tabName')];
        if (listener && listener.onShown) {
            listener.onShown();
        }
        this.activePanelHolder.appendChild(tab.panel);
    },

    __hideTab : function(tab){
        var listener = this.widgets[tab.getAttribute('imvu:tabName')];
        if (listener && listener.onHidden) {
            listener.onHidden();
        }
        this.inactivePanelHolder.appendChild(tab.panel);
    },

    __activateSpecificTab : function(tab) {
        if (!this.__isActiveTab(tab)) {
            $(tab).addClass('active');
            this.__showTab(tab);
        }
    },

    __deactivateSpecificTab: function(tab) {
        if (this.__isActiveTab(tab)) {
            $(tab).removeClass('active');
            this.__hideTab(tab);
        }
    },

    getActiveTabName: function(){
        var tab = this.tabsHolder.querySelector('.active');
        if (!tab){
            return null;
        } else {
            return tab.getAttribute('imvu:tabName');
        }
    },

    getActiveTab: function() {
        return this.tabsHolder.querySelector('.active');
    },

    getPreviewTab: function() {
        return this.tabsHolder.querySelector('.preview');
    },

    __isActiveTab : function(tab) {
        return $(tab).hasClass('active');
    },

    __isPreviewTab : function(tab) {
        return $(tab).hasClass('preview');
    },

    getTabByName : function(tabName) {
        return $(this.tabsHolder).children('.tab[name="' + tabName + '"]:first')[0];
    },

    __activateTab : function(tab) {
        $(this.tabsHolder).children('.tab').each(function (index, t) {
            if (this.__isPreviewTab(t)){
                this.__hidePreview(t);
            } else if (tab == t) {
                this.__activateSpecificTab(t);
            } else if (this.__isActiveTab(t)) {
                this.__deactivateSpecificTab(t);
            }
        }.bind(this));
    },

    activateTabByName: function(tabName){
        this.__clickTab(this.getTabByName(tabName));
    },

    __clickTab : function(tab) {
        if (this.__isPreviewTab(tab)){
            $(tab).removeClass('preview')
                  .addClass('active');

        } else if (this.__isActiveTab(tab)){
            this.__deactivateSpecificTab(tab);

        } else {
            this.__activateTab(tab);
        }
    },

    addParticipant : function(userName, cid) {
    },

    removeParticipant : function(userName, cid) {
    }
};

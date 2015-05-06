var Dom = YAHOO.util.Dom;
var Event = YAHOO.util.Event;

var TabBar = function(spec) {
    this.rootElement = spec.rootElement || rootElementRequired;
    this.imvu = spec.imvu || imvuRequired;
    this.eventBus = spec.eventBus;
    IMVU.tabbar = this;

    var self = this;

    this.getEl = function (id) {
        return self.rootElement.querySelector('#' + id);
    };

    this.tabs = this.getEl('tabs');
    this.animations = {};
    this.centerClickStart = null;
    this.toolTip = new YAHOO.widget.Tooltip("tabBarToolTip", { context:[], showDelay:250, hideDelay:0 });
    this.elCreditsAmount = this.getEl('credits-amount');
    this.numCredits = null;
    this.width = 0;
    this.selectedIndex = 0;
    
    this.elAvailabilityDropdown = this.getEl('availability-dropdown');
    this.elCreditsButtonLeft = this.getEl('credits-button-left');
    this.elCreditsButtonCenter = this.getEl('credits-button-center');
    this.elCreditsButtonRight = this.getEl('credits-button-right');
    this.elCreditsButton = this.getEl('credits-button');
    this.elCreating = this.getEl('creating-option');
    this.elTabArrows = $('#tab-arrows');
    this.elLeftArrow = $('#arrow-left');
    this.elRightArrow = $('#arrow-right');

    $(window).resize(function() {           
        this.determineOverflowArrows();
        this.correctTabOverflowVisibility();
    }.bind(this));
        
    Event.on(this.elAvailabilityDropdown, 'keyup', this.userChangedAvailability, {}, this);

    Event.on(this.elCreditsButton, 'click', this.creditsClicked, {}, this);
    Event.on(this.elCreditsButton, 'mouseenter', this.onMouseOverCreditsButton, {}, this);
    Event.on(this.elCreditsButton, 'mouseleave', this.onMouseOutCreditsButton, {}, this);

    Event.on(this.getEl('sign-out-link'), 'click', function () { this.eventBus.fire('TabBar.SignOutClicked', {}); }.bind(this) );
    Event.on(this.getEl('settings-link'), 'click', function () { this.eventBus.fire('TabBar.AccountSettingsClicked', {}) }.bind(this) );
    Event.on(this.getEl('help'), 'click', function () { this.eventBus.fire('TabBar.HelpClicked', {}) }.bind(this) );
    Event.on(this.getEl('avpic'), 'click', function () { this.eventBus.fire('TabBar.AvatarPicClicked', {}) }.bind(this) );
    Event.on(this.getEl('avname'), 'click', function () { this.eventBus.fire('TabBar.AvatarNameClicked', {}) }.bind(this) );
    
    this.elRightArrow.click(function() {       
        this.nextTab();
        var id = this.tabs.children[this.selectedIndex].id;
        this.eventBus.fire('TabBar.TabClicked', {id:id});
    }.bind(this));
    
    this.elLeftArrow.click(function() {
        this.previousTab();
        var id = this.tabs.children[this.selectedIndex].id;
        this.eventBus.fire('TabBar.TabClicked', {id:id});
    }.bind(this));

    self.handleAvatarNameUpdate = function(eventName, data) {
        self.setAvatarName(data.avatarName);
    };
    
    self.handleNewCreditBalance = function(eventName, data) {
        var newNumCredits = parseInt(data.credits, 10) + parseInt(data.predits, 10);

        if (isNaN(newNumCredits)) {
            return;
        }

        $(self.getEl('credits-label')).toggleClass('visible', !newNumCredits || newNumCredits < 1000000);

        if (self.numCredits !== null && self.numCredits != newNumCredits) {
            var jqueryCreditsAmount = $('#credits-amount');
            var from = {property: self.numCredits}
            var to = {property: newNumCredits}
            //if (!jQuery.fx.off) debugger;
            jQuery(from).stop();
            jQuery(from).animate(to, {
                duration: 2000,
                easing: 'swing',
                step: function(now, fx) {
                    self.elCreditsAmount.innerHTML = IMVU.Client.util.number_format(Math.floor(now));
                    self.numCredits = now;

                    jqueryCreditsAmount.css({textShadow: '0px 0px '+20*(1-fx.pos)+'px white'});
                    jqueryCreditsAmount.css({color: 'yellow'})
                },
                complete: function() {
                    jqueryCreditsAmount.css({textShadow: ''});
                    self.elCreditsAmount.innerHTML = IMVU.Client.util.number_format(newNumCredits);
                    jqueryCreditsAmount.css({color: '#FFDF29'});
                }
            });
        } else {
            self.numCredits = newNumCredits
            self.elCreditsAmount.innerHTML = IMVU.Client.util.number_format(newNumCredits);
        }
    };

    self.handleRoomChanged = function(eventName, data) {
        self.reIdentifyTab(data.oldId, data.newId, data.title);
    };

    var handleStartTabFlashing = function(eventName, data) {
        self.startTabFlashing(data.id);
    };

    var handleSetAvailability = function(eventName, data){
        var availability = this.elAvailabilityDropdown.options[this.elAvailabilityDropdown.selectedIndex].value;
        if (availability != data.availability){
            self.setAvailability(data.availability);
        }
    };
    
    var creditBalance = this.imvu.call("getCreditBalance");
    var promoBalance = this.imvu.call("getPromoBalance");
    self.handleNewCreditBalance("updateCreditBalances", { credits: creditBalance, predits: promoBalance });

    this.eventBus.register('updateCreditBalances', self.handleNewCreditBalance);
    this.eventBus.register('updateAvatarName', self.handleAvatarNameUpdate);
    this.eventBus.register('StartTabFlashing', handleStartTabFlashing);
    this.eventBus.register('SessionWindow.ReplaceRoom', self.handleRoomChanged);
    
    self.setIsTeen(this.imvu.call('isTeen'));
    self.setIsCreator(this.imvu.call('isCreator'));
    self.setAvailability(this.imvu.call('getAvailability'));
    self.setAvatarName(this.imvu.call('getAvatarName'));
    
    this.eventBus.register('AvPicChanged', function(eventName, data) {
        self.setAvatarPicUrl(data.url);
    });

    this.eventBus.register('ServerEvent.updateCreatorStatus', function (eventName, data) {
        self.setIsCreator(data.isCreator);
    });

    Event.on('logo', 'click', function () {
        this.eventBus.fire('TabBar.ImvuLogoClicked', {});
    }.bind(this));
};

TabBar.prototype = {
    shortenTabName : function(name) {
        return (name.length <= 15) ? name : name.substring(0, 15) + '...';
    },

    creditsClicked: function(e) {
        this.eventBus.fire('TabBar.CreditsClicked', {});
        Event.stopEvent(e);
    },     

    appendTabElement: function(name, id, toolTip, klass){
        var new_tab = document.createElement('li');

        new_tab.theClass = klass;
        if(klass) {
            $(new_tab).addClass(klass);
        }

        this.makeTab(name, id, toolTip, new_tab);

        this.tabs.appendChild(new_tab);
        
    },
    
    makeTab: function(name, id, toolTip, new_tab) {
        new_tab.id = id;

        var tab_right = document.createElement('span');
        $(tab_right).addClass('right');

        if (this.shortenTabName(name) != toolTip) {
            new_tab.title = toolTip;
            var context = this.toolTip.cfg.getConfig().context;
            context[context.length] = id;
            this.toolTip.cfg.setProperty('context', context);
        }

        new_tab.innerHTML = "<span class='left'></span><span id='"+id+"_center' class='name'>"+this.shortenTabName(name)+"</span>";
        new_tab.appendChild(tab_right);

        new_tab.circleDial = new CircleDial();
        Dom.setStyle(new_tab.circleDial.svg, 'display', 'none');

        if(id != 'home' && id != 'loading') {
            $(tab_right).addClass('closable');
            var closeIcon = document.createElement('span');
            closeIcon.id = id + '_closeIcon';
            $(closeIcon).addClass('closeicon');
            Event.on(closeIcon, 'click', function (o) {
                Event.stopPropagation(o);
                this.closeTab(id);
            }.bind(this));
            new_tab.appendChild(closeIcon);
            closeIcon.appendChild(new_tab.circleDial.svg);
        }

        var self = this;
        Event.on(new_tab, 'mouseup', function(e) {
            if (e.button == 1 && self.centerClickStart == id){
                self.closeTab(id);
            }
        });
        Event.on(new_tab, 'mousedown', function(e) {
            if (e.button == 1){
                self.centerClickStart = id;
            }
        });

        if (id != 'loading') {
            Event.on(new_tab, 'click', function(e) {
                this.eventBus.fire('TabBar.TabClicked', {id:id});                
            }.bind(this));
        }
    },

    createPlaceholderTab: function() {
        this.appendTabElement(_T("Loading..."), 'loading', _T("Loading..."), false);
    },

    addTab: function(name, id, toolTip, klass) {                        
        while (this.getEl('loading')){
            this.tabs.removeChild(this.getEl('loading'));
        }

        this.appendTabElement(name, id, toolTip, klass);        
        this.updateTabBarWidth();
        this.determineOverflowArrows();        
    },

    reIdentifyTab: function(oldId, id, toolTip) {
        var tab = this.getEl(oldId);
        if (tab == null) {
            return false;
        }
        tab.id = id;
        this.makeTab($('#' + id).text(), id, toolTip, tab);
        this.updateTabBarWidth();
        this.determineOverflowArrows();
    },

    updateTabBarWidth : function() {
        this.width = 0;
        for (var i = 0; i < this.tabs.children.length; i++) {
            this.width += this.tabs.children[i].clientWidth + 8;
        }
    },
    
    hasTabOverflowed : function(index) {
        var width = 0;
        index = (index >= this.tabs.children.length) ? this.tabs.children.length - 1 : index;
        for (var i = 0; i <= index; i++) {
            if (!$('#' + this.tabs.children[i].id).hasClass('hidden')) {
                width += this.tabs.children[i].clientWidth + 8;
            }
        }
                
        var arrow_margin = (this.elTabArrows.hasClass('hidden')) ? 0 : 56;
        return (width > (this.tabs.clientWidth - arrow_margin) && this.tabs.clientWidth !== 0) ? true : false;
    },
    
    determineOverflowArrows: function() {        
        if (this.width > this.tabs.clientWidth) {            
            this.elTabArrows.removeClass('hidden');               
        } else {            
            this.elTabArrows.addClass('hidden');
        }        
    },       
    
    closeTab: function(id) {
        if (!this.getEl(id)) {
            return;
        }
        this.eventBus.fire('TabBar.TabClosed', {id:id});
    },

    removeTab: function(id) {
        var new_context = [];
        var context = this.toolTip.cfg.getConfig().context;
        for (var i in context){
            if (context[i] != id) {
                new_context[new_context.length] = context[i];
            }
        }

        this.toolTip.cfg.setProperty('context', new_context);
        this.toolTip.cfg.setProperty('visible', false);

        this.stopTabFlashing(id);
        this.tabs.removeChild(this.getEl(id));
        this.updateTabBarWidth();        
        this.determineOverflowArrows();
    },

    setTabLoadingProgress: function(id, v) {
        var tab = this.getEl(id);
        if(!tab) {return;}

        var circleDial = tab.circleDial;
        if(!circleDial) {return;}

        if(v<=0) {
            Dom.setStyle(circleDial.svg, 'display', 'none');
        } else {
            Dom.setStyle(circleDial.svg, 'display', '');
        }
        circleDial.setFull(v);
    },

    __animateUp: function(type, args, id) {
        if (this.animations[id]){
            this.animations[id].up.animate();
        }
    },

    __animateDown: function(type, args, id) {
        if (this.animations[id]){
            this.animations[id].down.animate();
        }
    },

    startTabFlashing: function(id) {
        if (this.getActiveTab() == id) {
            return;
        }
        $(this.getEl(id)).addClass('flashing');
    },
    
    stopTabFlashing: function(id) {
        $(this.getEl(id)).removeClass('flashing');
    },
    
    getActiveTab: function() {
        var $active = $('#tabs .active');
        if ($active.length) {
            return $active.attr('id');
        } else {
            return null;
        }
    },

    setActiveTab: function(id) {
        this.rootElement.className = '';
        var newActiveTab = this.rootElement.querySelector('#'+id);
        if(newActiveTab && newActiveTab.theClass) {
            this.rootElement.className = newActiveTab.theClass;
        }
        
        jQuery.each($("#tabs li"), function(index, value) {
            if (value.id === id) {
                this.selectedIndex = index;                              
            }
        }.bind(this));

        this.correctTabOverflowVisibility();
        
        $('#tabs li').removeClass('active');
        $('#' + id).addClass('active');
        this.stopTabFlashing(id);
    },
    
    correctTabOverflowVisibility : function() {
        $('#tabs li').removeClass('hidden');
        
        for (var i = 0; i < this.tabs.children.length; i++) {            
            if (!this.hasTabOverflowed(this.selectedIndex)) {
                break;
            }
            
            $('#' + this.tabs.children[i].id).addClass('hidden');
        }

        for (var i = this.selectedIndex + 1; i < this.tabs.children.length; i++) {            
            if (!this.hasTabOverflowed(i)) {
                break;
            }
            
            $('#' + this.tabs.children[i].id).addClass('hidden');
        }        
    },
    
    setActiveTabByIndex : function (selected_index) {
        var id;        
        jQuery.each($("#tabs li"), function (index, value) {
            if (selected_index === index) {
                this.selected_index = index;
                id = value.id;
            }
        }.bind(this));
        
        if (typeof id === 'undefined') {
            return;
        }
        
        this.setActiveTab(id);
    },
    
    nextTab: function() {        
        var next = (this.selectedIndex + 1) % this.tabs.children.length;
        this.setActiveTabByIndex(next);
    },
    
    previousTab: function() {
        var prev = (this.selectedIndex + this.tabs.children.length - 1) % this.tabs.children.length;
        this.setActiveTabByIndex(prev);
    },
    
    setHowManyOnline: function(n) { this.getEl('online_now_count').innerHTML = IMVU.Client.util.number_format(n); },
    setHowManyCountriesOnline: function(n) { IMVU.log(n); this.getEl('online_now_country_count').innerHTML = IMVU.Client.util.number_format(n); },
    setAvatarName: function(n) { this.getEl('avname').innerHTML = n; },
    setAvatarPicUrl: function(n) {
        var avpic = this.getEl('avpic');
        avpic.src = n; 
    },

    onMouseOverCreditsButton: function() {
        $(this.elCreditsButtonLeft).addClass('hover');
        $(this.elCreditsButtonCenter).addClass('hover');
        $(this.elCreditsButtonRight).addClass('hover');
    },

    onMouseOutCreditsButton: function() {
        $(this.elCreditsButtonLeft).removeClass('hover');
        $(this.elCreditsButtonCenter).removeClass('hover');
        $(this.elCreditsButtonRight).removeClass('hover');
    },

    restripeAvailabilityOptionBackgrounds: function () {
        var elts = this.elAvailabilityDropdown.querySelectorAll('option');
        var c = 0;
        for (var i = 0; i < elts.length; i++) {
            var elOption = elts[i];
            if (Dom.getAttribute(elOption, 'disabled') === 'disabled') {
                continue;
            }
            $(elOption).toggleClass('even', c % 2 == 0)
                       .toggleClass('odd',  c % 2 != 0);
            c++;
        }
    },

    setIsTeen: function(isTeen) {
        if (isTeen){
            var teenOption = this.getEl('teens-option');
            teenOption.style.display = 'block';
            teenOption.disabled = false;
        } else {
            var adultOption = this.getEl('adults-option');
            adultOption.style.display = 'block';
            adultOption.disabled = false;
        }
        this.restripeAvailabilityOptionBackgrounds();
    },

    setIsCreator: function (isCreator) {
        $(this.elCreating).toggleClass('hidden', !isCreator);
        if (!isCreator && $('#creating-option').prop('selected')){
            this.setAvailability('DoNotDisturb');
        }
    },

    updateAvailabilityIcon: function() {
        var icon = this.getEl('availability-logo');
        icon.className = this.elAvailabilityDropdown.options[this.elAvailabilityDropdown.selectedIndex].value;
        var text = this.getEl('availability-text');
        text.innerHTML = this.elAvailabilityDropdown.options[this.elAvailabilityDropdown.selectedIndex].text.replace(/^\s+/,"");
    },

    setAvailability: function(n) {
        for (var i = 0; i < this.elAvailabilityDropdown.options.length; i++) {
            if (this.elAvailabilityDropdown.options[i].value == n) {
                this.elAvailabilityDropdown.selectedIndex = i;
                break;
            }
        }
        this.updateAvailabilityIcon();
    },

    userChangedAvailability: function() {
        var availability = this.elAvailabilityDropdown.options[this.elAvailabilityDropdown.selectedIndex].value;
        this.eventBus.fire('TabBar.UserChangedAvailability', {availability: availability});
        this.updateAvailabilityIcon();
    }
};

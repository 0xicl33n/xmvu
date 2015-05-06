function ProductEditMode(args) {
    this.el = YAHOO.util.Dom.get(args.el);
    this.elMeshes = this.$('#meshes');
    this.elConfig = this.$('#config');
    this.elActions = this.$('#actions');
    this.elParticles = this.$('#particles');
    this.elAssets = this.$('#assets');
    this.elDebug = this.$('#debug');
    this.elInfo = this.$('#info');
    this.elActor = this.$('#actor');
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    
    this.setHeaderFields();
    
    $('#upload').addClass('enabled');

    YAHOO.util.Event.addListener(this.$('#maximize'), 'click', this.toggleMaximizeMouse.bind(this));
    YAHOO.util.Event.addListener(this.$('#maximize'), 'mousedown', this.toggleMaximizeMouse.bind(this));
    YAHOO.util.Event.addListener(this.$('#applyChanges'), 'click', function () { this.imvu.call('applyChanges'); }.bind(this));
    YAHOO.util.Event.addListener(this.$('#save'), 'click', function () { this.imvu.call('save'); }.bind(this));
    YAHOO.util.Event.addListener(this.$('#saveAs'), 'click', this.saveAs.bind(this));
    YAHOO.util.Event.addListener(this.$('#savedrop'), 'click', this.onSaveDropdown.bind(this));
    YAHOO.util.Event.addListener(this.$('#upload'), 'click', function () {
        if ($('#upload').is('.enabled')) {
            this.imvu.call('upload');
        }
    }.bind(this));
    YAHOO.util.Event.addListener(this.$('#folder'), 'click', function () { this.imvu.call('showFolder'); }.bind(this));

    if (this.imvu.call('shouldSeeFeature', 'editParticles')) {
        this.navInfo = {'config': _T("config"), 'meshes': _T("meshes"), 'actions': _T("actions"), 'particles': _T("particles"), 'assets': _T("assets"), 'actor': _T("actors"), 'debug':_T("debug")};
    } else {
        this.navInfo = {'config': _T("config"), 'meshes': _T("meshes"), 'actions': _T("actions"), 'assets': _T("assets"), 'actor': _T("actors"), 'debug':_T("debug")};
    }
    if (this.productType && (-1 != this.productType.toLowerCase().indexOf('skin'))) {
        this.navInfo['meshes'] = _T("materials");
    }

    if (this.productType == 'Avatar Action' ||
        this.productType == 'Avatar 2-Party Action' ||
        this.productType == 'Avatar Coop Action') {
        delete this.navInfo['meshes'];
    }

    this.panel = [];
    this.panel['meshes'] = new MeshesPanel($.extend({}, args, {el:this.elMeshes, productType:this.productType, mode:this}));
    this.panel['config'] = new ConfigPanel($.extend({}, args, {el:this.elConfig, productType:this.productType, mode:this}));
    this.panel['actions'] = new ActionsPanel($.extend({}, args, {el:$('#actions'), productType:this.productType, mode:this}));
    this.panel['particles'] = new ParticlesPanel($.extend({}, args, {el:$('#particles'), productType:this.productType, mode:this}));
    this.panel['assets'] = new AssetsPanel($.extend({}, args, {el:this.elAssets, productType:this.productType, mode:this}));
    this.panel['actor'] = new ActorPanel($.extend({}, args, {el:this.elActor, productType:this.productType, mode:this}));
    this.panel['debug'] = new DebugPanel($.extend({}, args, {el:this.elDebug, productType:this.productType, mode:this}));
    this.selectedPanel = null;

    this.buildNav(this.navInfo);

    this.eventBus.register('SceneDirtyChanged', this.onSceneDirtyChanged, 'Mode', this);
    this.eventBus.register('DirtyChanged', this.onFileDirtyChanged, 'Mode', this);
    this.eventBus.register('ProductChanged', this.onProductChanged, 'Mode', this);
}

ProductEditMode.prototype = {
    $: function(spec, parentEl) {
        return (parentEl || this.el).querySelector(spec);
    },
    $$: function(spec, parentEl) {
        return (parentEl || this.el).querySelectorAll(spec);
    }
};

ProductEditMode.prototype.setPanelWidth = function(px) {
    var panel = this.$('#editPanel');
    var avWindowHolder = this.$('#avview-holder');

    YAHOO.util.Dom.setStyle(panel, 'width', ''+px+'px');
    YAHOO.util.Dom.setStyle(avWindowHolder, 'right', ''+px+'px');
    YAHOO.util.Dom.setStyle(panel, 'display', (0==px)?'none':'');
}

ProductEditMode.prototype.toggleMaximizeMouse = function(e) {
    if(e && e.button == 2) {
        //right-click is wide view for debug
        this.setPanelWidth(640);
        return;
    }
    if(e && e.type == 'mousedown') {
        //ignore mousedown for left-click
        return;
    }
    
    this.toggleMaximize();
};

ProductEditMode.prototype.toggleMaximize = function() {
    var panel = this.$('#editPanel');
    var avWindowHolder = this.$('#avview-holder');

    var isVisible = 'none' != YAHOO.util.Dom.getStyle(panel, 'display');
    if(!isVisible) {
        this.setPanelWidth(522);
    } else {
        this.setPanelWidth(0);
    }
};

ProductEditMode.prototype.selectDefaultPanel = function(id) {
    if (this.productType == 'Avatar Action' ||
        this.productType == 'Avatar 2-Party Action' ||
        this.productType == 'Avatar Coop Action') {
        this.selectPanel('actions');
    } else {
        this.selectPanel('meshes');
    }
}

ProductEditMode.prototype.selectPanel = function(id) {
    var div = this.panelEl[id];

    var lis = this.el.querySelectorAll('#nav li');
    for (var i=0; i<lis.length; i++) {
        $(lis[i]).removeClass('selected');
    }
    $(div.li).addClass('selected');

    var activePanelHolder = this.$('#activePanelHolder');
    var hiddenPanelHolder = this.$('#hiddenPanelHolder');
    while (activePanelHolder.firstChild) {
        hiddenPanelHolder.appendChild(activePanelHolder.firstChild);
    }
    if (typeof(this.panel[id].onSelect) == 'function') {
        this.panel[id].onSelect();
    }
    this.selectedPanel = this.panel[id];
    activePanelHolder.appendChild(div);
}

ProductEditMode.prototype.getSelectedPanelIndex = function() {
    var selectedLi = this.el.querySelector('#nav li.selected');
    var lis = this.el.querySelectorAll('#nav li');
    for(var i=0; i<lis.length; i++) {
        if(lis[i] == selectedLi) return i;
    }
    return -1;
}
ProductEditMode.prototype.selectNextPanel = function() {
    var selectedIndex = this.getSelectedPanelIndex();
    var lis = this.el.querySelectorAll('#nav li');
    lis[(selectedIndex+1)%lis.length].onSelect();
}
ProductEditMode.prototype.selectPrevPanel = function() {
    var selectedIndex = this.getSelectedPanelIndex();
    var lis = this.el.querySelectorAll('#nav li');
    lis[(selectedIndex-1+lis.length)%lis.length].onSelect();
}

ProductEditMode.prototype.selectNextSubElement = function() {
    if(this.selectedPanel == this.panel['actions'] || this.selectedPanel == this.panel['meshes'])
    {
        this.selectedPanel.selectNextSubElement();
    }
}

ProductEditMode.prototype.selectPrevSubElement = function() {
    if(this.selectedPanel == this.panel['actions'] || this.selectedPanel == this.panel['meshes'])
    {
        this.selectedPanel.selectPrevSubElement();
    }
}

ProductEditMode.prototype.selectNextSubSubElement = function() {
    if(this.selectedPanel == this.panel['actions'] || this.selectedPanel == this.panel['meshes'])
    {
        this.selectedPanel.selectNextSubSubElement();
    }
}

ProductEditMode.prototype.selectPrevSubSubElement = function() {
    if(this.selectedPanel == this.panel['actions'] || this.selectedPanel == this.panel['meshes'])
    {
        this.selectedPanel.selectPrevSubSubElement();
    }
}

ProductEditMode.prototype.buildNav = function(tabLabels) {
    var nav = this.$('#nav');

    var self = this;
    function bind_li(li, id) {
        li.onSelect = function() { self.selectPanel(id); }
        YAHOO.util.Event.addListener(li, 'click', li.onSelect);
    }

    this.panelEl = {};
    var panelDivs = this.el.querySelectorAll('div.panel');
    for (var i = 0; i < panelDivs.length; i++) {
        var div = panelDivs[i];
        if (div.id in this.navInfo) {
            this.panelEl[div.id] = div;

            var li = document.createElement('li');
            var label = document.createElement('label');
            label.innerHTML = tabLabels[div.id];
            li.appendChild(label);
            nav.appendChild(li);
            div.li = li;

            bind_li(li, div.id);
        }
        this.$('#hiddenPanelHolder').appendChild(div);
    }
};

ProductEditMode.prototype.onSceneDirtyChanged = function(eventName, info) {
    $('#applyChanges').toggleClass('enabled', !!info['new']);
};

ProductEditMode.prototype.onFileDirtyChanged = function(eventName, info) {
    if(info['new']) {
        $('#save').addClass('enabled');
        $('#savedrop').addClass('enabled');
        $('#upload').removeClass('enabled');
    } else {
        $('#save').removeClass('enabled');
        $('#savedrop').removeClass('enabled');
        $('#upload').addClass('enabled');
    }
};

ProductEditMode.prototype.saveAs = function() {
    this.imvu.call('saveAs');
    $('#saveAs').removeClass('visible');
}

ProductEditMode.prototype.onSaveDropdown = function() {
    $('#saveAs').toggleClass('visible');
}

ProductEditMode.prototype.onProductChanged = function() {
    this.setHeaderFields();
}

ProductEditMode.prototype.setHeaderFields = function() {
    this.pid = this.imvu.call('getProductId');
    this.hasRealPid = this.imvu.call('hasRealPid');
    if (this.pid > 1) {
        $('#pid').addClass('visible');
        if (this.hasRealPid) {
            this.$('#pid b').innerHTML = this.pid;
        } else {
            this.$('#pid b').innerHTML = _T("N/A");
        }
    }
    
    this.derivedProductPids = this.imvu.call('getParentProductPids');
    if (this.derivedProductPids && this.derivedProductPids.length) {
        this.derivedProductPids = this.derivedProductPids[0];
        $('#parent-pid').addClass('visible');
        this.$('#parent-pid b').innerHTML = this.derivedProductPids;
    }

    this.productType = this.imvu.call('getProductType');
    if (this.productType) {
        $('#type').addClass('visible');
        this.$('#type b').innerHTML = this.productType;
    }        
}

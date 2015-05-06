function ConfigPanel(args) {
    var self = this;
    this.$root = $(args.el);
    this.args = args; // for event call-back -- clean this up
    this.mode = args.mode;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.productType = args.productType;
    this.collapsiblePanels = CollapsiblePanel.createCollapsiblePanels(args);
    
    this.collapsiblePanels['configSkeletonVariablesCollapsible'].customizeOnEnable = function(args) {
        // These args are the args passed to createCollapsiblePanels above (including
        // productType); except that el is now the collapsible panel 'div' element.
        if (!args.productType) {
            return;
        }
        $(args.el).toggleClass('xsfControl', !(args.productType.toLowerCase() == 'avatar clothing' || args.productType.toLowerCase() == 'avatar eyecolor skin' || args.productType.toLowerCase() == 'avatar skin'));
        $(args.el).toggleClass('xsfAttachment', !(args.productType.toLowerCase() == 'room' || args.productType.toLowerCase() == 'furnitureroom' || args.productType.toLowerCase() == 'avatar'));
    };
    
    for each (var cp in this.collapsiblePanels) {
        cp.enable(false);
    }

    if (this.productType != null) {
        switch(this.productType.toLowerCase()) {
        case 'avatar': // xsf only in skel vars
            this.collapsiblePanels['configSkeletonVariablesCollapsible'].enable(true);
            this.collapsiblePanels['configPolicyToolsCollapsible'].enable(true);
            break;
        case 'avatar action':
        case 'avatar 2-party action':
        case 'avatar mood':
            this.collapsiblePanels['configSkeletonVariablesCollapsible'].enable(true);
            break;

        case 'avatar clothing':
            this.collapsiblePanels['configSkeletonVariablesCollapsible'].enable(true); 
            this.collapsiblePanels['configPolicyToolsCollapsible'].enable(true);
            this.collapsiblePanels['configClothingOverrideCollapsible'].enable(true);
            break;
        case 'avatar attachment': // all skel vars  
            this.collapsiblePanels['configSkeletonVariablesCollapsible'].enable(true); 
            break;
        case 'avatar skin':
            this.collapsiblePanels['configSkeletonVariablesCollapsible'].enable(true);
            break;
        case 'avatar eyecolor skin':
            this.collapsiblePanels['configSkeletonVariablesCollapsible'].enable(true);
            break;
        case 'avatar eyebrow skin':
            break;
        case 'chat bubble': // will not happen
            break;            
        case 'room': // only xsf in skel vars
        case 'furnitureroom': // only xsf in skel vars
            this.collapsiblePanels['configSkeletonVariablesCollapsible'].enable(true); 
            this.collapsiblePanels['configFogAndLightingParametersCollapsible'].enable(true);
            this.collapsiblePanels['configPropActionSettingsCollapsible'].enable(true);
            break;
        case 'room attachment': // grey out and empty Compatible Body PIDs in Skel vars
            this.collapsiblePanels['configSkeletonVariablesCollapsible'].enable(true); 
            this.collapsiblePanels['configPropActionSettingsCollapsible'].enable(true);
            this.collapsiblePanels['configFlashSettingsCollapsible'].enable(true);
            break;
        }
    }

    IMVU.Client.util.turnLinksIntoLaunchUrls(this.$root.find('#configPolicyDescription'), this.imvu);
    
    this.xsfPillButton = new PillButton($.extend({}, args, {el: this.$root.find('#configAddXsf')}));
    this.swfPillButton = new PillButton($.extend({}, args, {el: this.$root.find('#configAddSwf')}));
    this.removeFlashWidgetPillButton = new PillButton($.extend({}, args, {el: this.$root.find('#removeFlashWidget')}));

    this.xsfChooser = new AssetChooser({
        imvu: this.imvu,
        eventBus: this.eventBus,
        button: this.xsfPillButton,
        select: '#configSelectXsf',
        extension: 'xsf',
        type: 'Skeleton'
    });
    
    this.swfChooser = new AssetChooser({
        imvu: this.imvu,
        eventBus: this.eventBus,
        button: this.swfPillButton,
        select: '#configSelectSwf',
        extension: 'swf',
        type: 'Flash File'
    });

    function configSelect(type) {
        var elSelect = self.$root.find('#configSelect' + type)[0],
            $selected = $(elSelect).children(':selected:first');
        if ($selected.length) {
            self.propertyChange(elSelect, $selected.text());
        }
    }

    this.xsfChooser.subscribe(function () { configSelect('Xsf'); });
    this.swfChooser.subscribe(function () { configSelect('Swf'); });
    this.eventBus.register('ProductChanged', this.onProductChanged, 'Mode', this);
    this.initialized = false;
}

ConfigPanel.prototype = {};

ConfigPanel.prototype.onSelect = function() {
    if (this.initialized == false) {
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('wait');
        }
        this.propertyWrappers = this.constructPropertyWrappers($.extend({}, this.args, {propertyChange: this.propertyChange.bind(this)}));
        var clothingOverrideBoxWrappers = this.constructAndPopulateClothingOverrideBoxWrappers($.extend({}, this.args, {propertyChange: this.propertyChange.bind(this)}));
        this.propertyWrappers = $.extend({}, this.propertyWrappers, clothingOverrideBoxWrappers);

        this.configFogNearWrapper = this.propertyWrappers['configFogNear'];
        this.configFogNearWrapper.maxValue = 1000;
        this.configFogNearWrapper.addUserEventListener(this.fogNearChange.bind(this));
        this.configFogFarWrapper = this.propertyWrappers['configFogFar'];
        this.configFogFarWrapper.maxValue = 1000;
        this.configFogFarWrapper.addUserEventListener(this.fogFarChange.bind(this));

        this.populateProperties(this.propertyWrappers);
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('auto');
        }
        this.initialized = true;
    }
}

ConfigPanel.prototype.onProductChanged = function(eventName, eventInfo) {
    if (this.initialized && eventInfo.source != 'ui-configPanel' && 
         (eventInfo.source == 'productDictionary' || eventInfo.uiFieldName.substring(0, 6) == 'config' ||
                 eventInfo.uiFieldName == 'meshes' || eventInfo.uiFieldName == 'assets')) {
        this.initialized = false;
        if (this.mode.selectedPanel == this) {
            this.onSelect();
        }
    }
}

ConfigPanel.prototype.constructAndPopulateClothingOverrideBoxWrappers = function(args) {
    var result = {};
    var box;
    var elTable = args.el.querySelector('#configClothingOverrideTable');
    elTable.innerHTML = '';
    for(var i = 0; i < 10; i++) {
        box = ClothingOverrideBox.addClothingOverrideBox(elTable, i);
        box.addUserEventListener(this.clothingOverrideBoxChange.bind(this));
        box.setChecked(false);
        box.enable(true);
        result['configClothingOverrideBox-'+i] = box;
    }
    var meshes = this.imvu.call('getMeshIds');
    for (mi in meshes) {
        var i = parseInt(mi);
        box = undefined;
        if (i > 9) {
            box = ClothingOverrideBox.addClothingOverrideBox(elTable, i);
            box.addUserEventListener(this.clothingOverrideBoxChange.bind(this));
            result['configClothingOverrideBox-'+i] = box;
        } else if (i >= 0) {
            box = result['configClothingOverrideBox-'+i];
        }
        if (box) {
            box.setChecked(true);
            if (meshes[i].asset) // might there be a mesh with substantial information but not an asset?
                box.enable(false);
        }
    }
    return result;
}

ConfigPanel.prototype.clothingOverrideBoxChange = function(index, value) {
    if (value) {
        this.imvu.call('addMesh', index, true, 'ui-configPanel');
    } else {
        this.imvu.call('removeMesh', index, 'ui-configPanel');
    }
}

ConfigPanel.prototype.turnFlashWidgetOff = function() {
    this.imvu.call('setConfigField', 'configSelectSwf', '', 'ui-configPanel');
    this.imvu.call('setConfigField', 'configSelectTriggerType', 'None', 'ui-configPanel');
    this.imvu.call('setConfigField', 'configFlashParameters', '', 'ui-configPanel');
}

ConfigPanel.prototype.fogNearChange = function(property, value) {
    var farValue = this.configFogFarWrapper.getValue();
    if (parseInt(value) > parseInt(farValue)) {
        this.configFogFarWrapper.setValue(value);
        this.propertyChange(this.configFogFarWrapper, value);
    }
}

ConfigPanel.prototype.fogFarChange = function(property, value) {
    var nearValue = this.configFogNearWrapper.getValue();
    if (parseInt(value) < parseInt(nearValue)) {
        this.configFogNearWrapper.setValue(value);
        this.propertyChange(this.configFogNearWrapper, value);
    }
}

ConfigPanel.prototype.propertyChange = function(property, uiValue) {
    propName = property.propertyName;
    if (!propName) { // needed for AssetChooser until better integrated
        propName = property.id;
    }
    if (uiValue === null) { // needed for AssetChooser until better integrated
        uiValue = property.value;
    }

    switch(propName) {
    case 'configApplyMinimumCoverageGuidelineSkin':
        this.imvu.call('applyGuidelineSkin');
        break;
    case 'configApplyMinimumCoverageGuidelinePose':
        this.imvu.call('applyGuidelinePose');
        break;
    default:
        var pyValue = this.imvu.call('setConfigField', propName, uiValue, 'ui-configPanel');
        if (pyValue != null && uiValue != pyValue) {
            property.setValue(pyValue);
        }
        break;
    }
}

ConfigPanel.prototype.constructPropertyWrappers = function(args) {
    var self = this,
        wrappers = {};
    $('.property').each(function (index, el) {
        self.determinePropertyType(el);
        wrappers[el.id] = self.constructPropertyWrapper($.extend({}, args, {el: el}));
    });
    return wrappers;
}

ConfigPanel.prototype.populateProperties = function(properties) {
    var assets = this.imvu.call('getSkeletonAssets');
    this.xsfChooser.setItems(assets); 
    var asset = this.imvu.call('getConfigField', 'configSelectXsf');
    this.xsfChooser.selectItem(asset);
    var flashAssets = this.imvu.call('getFlashAssets');
    this.swfChooser.setItems(flashAssets);
    var flashAsset = this.imvu.call('getConfigField', 'configSelectSwf');
    this.swfChooser.selectItem(flashAsset);
    this.$root.find('#removeFlashWidget')[0].addEventListener('click', this.turnFlashWidgetOff.bind(this), false);
    
    var propertyNames = ['configCompatibleBodyPatternPIDs', 
                        'configAttachmentNode', 
                        'configSynchronizeAllActions', 
                        'configSynchronizeProps', 
                        'configFlashParameters'];
    for (var i in propertyNames) {
      this.propertyWrappers[propertyNames[i]].setValue(this.imvu.call('getConfigField', propertyNames[i]));
    }
    
    var s = this.$root.find('#configSelectTriggerType')[0];
    var v = this.imvu.call('getConfigField', 'configSelectTriggerType');
    $(s).children(':contains("' + v + '")').attr('selected', true);
    this.propertyWrappers['configLightingColorPicker'].setValue(this.imvu.call('getConfigField', 'configLightingColorPicker'));
    this.propertyWrappers['configFogColorPicker'].setValue(this.imvu.call('getConfigField', 'configFogColorPicker'));
    this.propertyWrappers['configFogNear'].setValue(this.imvu.call('getConfigField', 'configFogNear'));
    this.propertyWrappers['configFogFar'].setValue(this.imvu.call('getConfigField', 'configFogFar'));
    this.propertyWrappers['configFogOn'].setValue(this.imvu.call('getConfigField', 'configFogOn'));
}

ConfigPanel.prototype.constructPropertyWrapper = function(args) {
    var el = args.el;
    var propertyChange = args.propertyChange;
    switch(el.propertyType) {
    case 'pillButton':
        wrapper = new PillButton(args);
        break;
    case 'pillButtonToggle':
        break;
    case 'simpleColorPicker':
        wrapper = SimpleColorPicker.createSimpleColorPicker(args);
        break;
    case 'comboSlider':
        wrapper = ComboSlider.createComboSlider(args);
        break;
    case 'checkbox':
        wrapper = { el: el };
        wrapper.getValue = function() { return this.el.checked; }
        wrapper.setValue = function(value) { 
            this.el.checked = value; 
            }
        wrapper.addUserEventListener = function(listener) {
            $(el).change(function () {
                listener(this, this.el.checked); 
                }.bind(wrapper));
        }
        break;
    case 'text':
    case 'select':
        wrapper = { el: el };
        wrapper.getValue = function() { return this.el.value; }
        wrapper.setValue = function(value) { this.el.value = value; }
        wrapper.addUserEventListener = function(listener) {
            $(el).change(function () { listener(this, this.el.value); }.bind(wrapper));
        }
        break;
    case 'button':
        wrapper = { el: el, down: false, toggle: (el.className.indexOf('toggle') >= 0)};
        wrapper.publishState = function() {
            $(this.el).toggleClass('down', !!this.toggle && !!this.down);
        }
        wrapper.getValue = function() { return this.down; }
        wrapper.setValue = function(value) {
            this.down = !!(this.toggle && value);
            this.publishState();
        }
        wrapper.addUserEventListener = function(listener) {
            $(el).click(function () {
                this.down = this.toggle && !this.down;
                this.publishState();
                listener(this, this.down);
            }.bind(wrapper));
        }
        wrapper.publishState();
        break;
    default:
        wrapper = { el: el };
        wrapper.getValue = function() { return undefined; };
        wrapper.setValue = function(value) {};
        wrapper.addUserEventListener = function(listener) { };
        break;
    }
    wrapper.propertyName = el.id;
    wrapper.propertyType = el.propertyType;
    wrapper.addUserEventListener(propertyChange);
    return wrapper;
}

ConfigPanel.prototype.determinePropertyType = function(el) {
    el.propertyType = 'none';
    switch(el.tagName.toLowerCase()) {
    case 'div':
    case 'span':
        if (el.className.indexOf('pillButton') >= 0) {
            el.propertyType = 'pillButton';
        } else if (el.className.indexOf('simpleColorPicker') >= 0) {
            el.propertyType = 'simpleColorPicker';
        } else if (el.className.indexOf('comboSlider') >= 0) {
            el.propertyType = 'comboSlider';
        }
        break;
    case 'input':
        el.propertyType = el.type.toLowerCase();
        break;
    case 'select':
        el.propertyType = 'select';
        break;
    }
}

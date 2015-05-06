function DebugPanel(args) {
    var self = this;
    this.el = $(args.el)[0];
    this.mode = args.mode;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.eventBus.register('ProductChanged', this.onProductChanged, 'Mode', this);

    this.ul = this.$('#tabs');
    this.activeHolder = this.$('#activeHolder');
    this.inactiveHolder = this.$('#inactiveHolder');
    this.tabs = this.$$('div.tab');
    $(this.tabs).each(function (index, tab) {
        var li = document.createElement('li');
        li.innerHTML = tab.getAttribute('name');
        li.targetTab = tab;
        $(li).click(function () {
            this.selectTab(tab);
        }.bind(this));
        this.ul.appendChild(li);
    }.bind(this));
    this.selectTab(this.$$('div.tab')[0]);
    this.pillButtons = PillButton.createPillButtons(args);
    this.pillButtons['addKeyButton1'].addUserEventListener(this.onEditNormalForm.bind(this, 'addKey'));
    this.pillButtons['addDataButton1'].addUserEventListener(this.onEditNormalForm.bind(this, 'addData'));
    this.pillButtons['editButton1'].addUserEventListener(this.onEditNormalForm.bind(this, 'edit'));
    this.pillButtons['deleteButton1'].addUserEventListener(this.onEditNormalForm.bind(this, 'delete'));
    this.pillButtons['addKeyButton2'].addUserEventListener(this.onEditExpandedForm.bind(this, 'addKey'));
    this.pillButtons['addDataButton2'].addUserEventListener(this.onEditExpandedForm.bind(this, 'addData'));
    this.pillButtons['editButton2'].addUserEventListener(this.onEditExpandedForm.bind(this, 'edit'));
    this.pillButtons['deleteButton2'].addUserEventListener(this.onEditExpandedForm.bind(this, 'delete'));
    this.pillButtons['overrideButton2'].addUserEventListener(this.onEditExpandedForm.bind(this, 'override'));
    this.pillButtons['revertButton2'].addUserEventListener(this.onEditExpandedForm.bind(this, 'revert'));
    $(this.$('#addActorButton')).click(function() {
        this.imvu.call('addActor');
    }.bind(this));
    this.normalFormView = null;
    this.expandedFormView = null;
    this.currentNormalFormKey = null;
    this.currentExpandedFormKey = null;
    this.isCurrentNormalFormKeyEditable = true;
    this.isCurrentExpandedFormKeyEditable = true;
    this.initialized = false;
}

DebugPanel.prototype = {
    $: function(spec, parentEl) {
        return (parentEl || this.el).querySelector(spec);
    },
    $$: function(spec, parentEl) {
        return (parentEl || this.el).querySelectorAll(spec);
    }
};

DebugPanel.prototype.formatDict = function(fmtDict) {
    if (typeof(fmtDict) != 'object') {
        return ''+fmtDict;
    }
    var fmt = '{';
    for (k in fmtDict) {
        fmt += k + ': ' + this.formatDict(fmtDict[k]);
    }
    fmt += '}';
    return fmt;
}

DebugPanel.prototype.onSelect = function() {
    if (this.initialized == false) {
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('wait');
        }
        this.normalFormDict = this._getTemplateDict('normalForm');
        this.expandedFormDict = this._getTemplateDict('expandedForm');
        this.currentNormalFormKey = null;
        this.isCurrentKeyNormalFormKeyEditable = true;
        this.enableEditButtonsForNormalForm({'isKeyEditable': true, 'enableAddButtons': true});
        if (this.normalFormView == null) {
            this.normalFormView = new DictTreeView({el: this.$('#normalFormView .dictView'), dict: this.normalFormDict, oldTree: this.normalFormView, imvu: this.imvu});
            this.normalFormView.addSelectListener(this.onKeySelect.bind(this, 1));
        } else {
            this.normalFormView.reloadDict(this.normalFormDict, true);
        }
        this.currentExpandedFormKey = null;
        this.isCurrentExpandedFormKeyEditable = true;
        this.enableEditButtonsForExpandedForm({'isKeyEditable': true, 'enableAddButtons': true});
        if (this.expandedFormView == null) {
            this.expandedFormView = new DictTreeView({el: this.$('#expandedFormView .dictView'), dict: this.expandedFormDict, oldTree: this.expandedFormView, imvu: this.imvu});
            this.expandedFormView.addSelectListener(this.onKeySelect.bind(this, 2));
        } else {
            this.expandedFormView.reloadDict(this.expandedFormDict);
        }
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('auto');
        }
        this.initialized = true;
    }
};

DebugPanel.prototype.onEditNormalForm = function(op) {
    if (this.isCurrentNormalFormKeyEditable) {
        this.imvu.call('showDebugEditDialog', op, this.currentNormalFormKey);
    }
};

DebugPanel.prototype.onEditExpandedForm = function(op) {
    if (this.isCurrentExpandedFormKeyEditable) {
        this.imvu.call('showDebugEditDialog', op, this.currentExpandedFormKey);
    }
};

DebugPanel.prototype.enableEditButtonsForNormalForm = function(args) {
    this.pillButtons['addKeyButton1'].enable(args['isKeyEditable'] && args['enableAddButtons']);
    this.pillButtons['addDataButton1'].enable(args['isKeyEditable'] && args['enableAddButtons']);
    this.pillButtons['editButton1'].enable(args['isKeyEditable'] && args['enableEditButton']);
    this.pillButtons['deleteButton1'].enable(args['isKeyEditable'] && args['enableDeleteButton']);
};

DebugPanel.prototype.enableEditButtonsForExpandedForm = function(args) {
    this.pillButtons['addKeyButton2'].enable(args['isKeyEditable'] && args['enableAddButtons']);
    this.pillButtons['addDataButton2'].enable(args['isKeyEditable'] && args['enableAddButtons']);
    if (args['labelEditButtonAsOverride']) {
        $(this.pillButtons['editButton2'].el).hide();
        $(this.pillButtons['overrideButton2'].el).show();
        this.pillButtons['overrideButton2'].enable(args['isKeyEditable'] && args['enableEditButton']);
    } else {
        $(this.pillButtons['editButton2'].el).show();
        $(this.pillButtons['overrideButton2'].el).hide();
        this.pillButtons['editButton2'].enable(args['isKeyEditable'] && args['enableEditButton']);
    }
    if (args['labelDeleteButtonAsRevert']) {
        $(this.pillButtons['deleteButton2'].el).hide();
        $(this.pillButtons['revertButton2'].el).show();
        this.pillButtons['revertButton2'].enable(args['isKeyEditable'] && args['enableDeleteButton']);
    } else {
        $(this.pillButtons['deleteButton2'].el).show();
        $(this.pillButtons['revertButton2'].el).hide();
        this.pillButtons['deleteButton2'].enable(args['isKeyEditable'] && args['enableDeleteButton']);
    }
};

/* Any changes to this routine must be matched by corresponding changes to isItAllowedToAddKey in DebugEditDialog.js.
   It would be great if some day the list of allowable keys was constructed once in ProductEditMode and passed in to
   both of these JavaScript routines. */
DebugPanel.prototype.isFullKeyEditable = function(fullKey) {
    if (!fullKey) {
        return true;
    }
    if (fullKey[0] == 'ProductId') {
        return false;
    }
    if (fullKey[0] == 'ProductType') {
        return false;
    }
    if (fullKey[0] == 'product_info') {
        return false;
    }
    if (fullKey[0] == '__DATAIMPORT') {
        return false;
    }
    var actionLabel = /^Action\d+$/;
    if (fullKey.length == 3 && actionLabel.test(fullKey[0]) && fullKey[1] == 'Definition' && fullKey[2] == 'ProductType') {
        return false;
    }
    return true;
}

DebugPanel.prototype.isFullKeyInDict = function(dict, fullKey) {
    if (!fullKey || fullKey.length == 0) {
        return true;
    }
    if (typeof(dict) != 'object') {
        return true;
    }
    if (fullKey[0] in dict) {
        return this.isFullKeyInDict(dict[fullKey[0]], fullKey.slice(1));
    }
    return false;
};

DebugPanel.prototype.onKeySelect = function(panel, fullKey, valueIsDict) {
    if (panel == 1) {
        this.currentNormalFormKey = fullKey;
        this.isCurrentNormalFormKeyEditable = this.isFullKeyEditable(this.currentNormalFormKey);
        this.enableEditButtonsForNormalForm({
                'isKeyEditable':             this.isCurrentNormalFormKeyEditable,
                'enableAddButtons':          valueIsDict,   
                'enableEditButton':          !valueIsDict,
                'enableDeleteButton':        this.currentNormalFormKey});
    } else {
        this.currentExpandedFormKey = fullKey;
        this.isCurrentExpandedFormKeyEditable = this.isFullKeyEditable(this.currentExpandedFormKey);
        var isOwned = this.isFullKeyInDict(this.normalFormDict, fullKey);
        // The following code disallows deleting dictionary keys from the expanded form panel. What we'd really like
        // is to allow the deletions if the key and its entire sub-tree is owned.
        this.enableEditButtonsForExpandedForm({
                'isKeyEditable':             this.isCurrentExpandedFormKeyEditable,
                'enableAddButtons':          valueIsDict,
                'labelEditButtonAsOverride': !isOwned && !valueIsDict,
                'enableEditButton':          !valueIsDict,
                'labelDeleteButtonAsRevert': isOwned && !valueIsDict,
                'enableDeleteButton':        this.currentExpandedFormKey && isOwned && !valueIsDict});
    }
};

DebugPanel.prototype.selectTab = function(tab) {
    var self = this;
    $('div.tab', this.el).each(function (index, t) {
        self.$('#inactiveHolder').appendChild(t);
    });
    this.$('#activeHolder').appendChild(tab);
    $('li', this.el).removeClass('active');
    $('li', this.el).each(function (index, li) {
        if(li.targetTab == tab) {
            $(li).addClass('active');
        }
    });
};

DebugPanel.prototype.onProductChanged = function(eventName, eventInfo) {
    if (this.initialized && eventInfo.source != 'ui-debugPanel') {
        this.initialized = false;
        if (this.mode.selectedPanel == this) {
            this.onSelect();
        }
    }
};

DebugPanel.prototype._getTemplateDict = function(dictName) {
    var result = this.imvu.call('getTemplateDict', dictName);
    if(result === null) {
        if(dictName == 'normalForm') {
            result = {
                'Material': {
                    'TextureMap0': {
                        'Index': '5',
                        'SelfIllumination': '1',
                        'TwoSided': '0'
                    }
                },
                'Template': {
                },
                '__DATAIMPORT': 'product://361208/index.xml',
                'ActionEnsembleTermination': 'ActionEnsembleTerminationAnyOneShotEffectEnds',
                'disablesGaze': 0
            };
        } else {
            result = {
                'BodyPartId0': '13',
                'BodyPatternProductId': '80',
                'Material': {
                    'TextureMap0': {
                        'AlphaBlending': '1',
                        'Asset': 'Lashes.xrf',
                        'BasecoatMaterialOn': '0',
                        'BlendMode': '1',
                        'Index': '5',
                        'SelfIllumination': '1',
                        'SwapDiffuseAndAmbientOfLights': '1',
                        'TwoSided': '0'
                    }
                },
                'Mesh0': {
                    'Asset': 'Lashes2.xmf',
                    'Index': 14
                },
                'BodyPatternDef': {
                    'BodyPart0' : {
                        'Material': {
                            'TextureMap0': {
                                'AlphaBlending': 0,
                                'Asset': 'female04.anime01.eyelashes02_alpha.xrf',
                                'Index': 5,
                                'SwapDiffuseAndAmbientOfLights': 1
                            }
                        }
                    }
                }
            };
        }
    }
    return result;
};


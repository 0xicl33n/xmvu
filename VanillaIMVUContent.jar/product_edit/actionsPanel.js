ACTION_PROPS = [
    'actionTrigger',
    'actionAvatarId',
    'actionNumberEnsemblesPlayed',
    'actionType',
    'actionAfterPlaying',
    'actionSoundLoop',
    'actionSoundDelay',
    'actionTwoPartyProductId',
    'actionTwoPartyKindIAm',
    'actionTwoPartyKindIMatch'
];

ENSEMBLE_PROPS = [
    'ensembleDisableGaze',
    'ensembleSpeedMultiplierBase',
    'ensembleSpeedMultiplierOffsetRange',
    'ensembleExtraLoopCap',
    'ensemblePlayProbability',
    'ensembleActionStopAfter',

    // COMMENT DUPLICATED FROM ProductEditContext.py, line 1283
    // Disabling per Matt 2010-09-20.  We don't even document this field.
    // http://www.imvu.com/creators/education_center.php?tutorial_id=2252841
    // I'm not quite comfortable disabling the functionality in case there is some rare product that does use it.
    // 'ensembleSkeletalBlendWeight',
    'ensembleSkeletalPlaybackSpeed',
    'ensembleSkeletalLoopCount',
    'ensembleSkeletalLoopStart',
    'ensembleSkeletalLoopEnd',
    'ensembleSkeletalBlendIn',
    'ensembleSkeletalBlendOut',
    'ensembleSkeletalComposition',

    'ensembleMorphBlendWeight',
    'ensembleMorphPlaybackSpeed',
    'ensembleMorphAmplitudeScale',
    'ensembleMorphLoopCount',
    'ensembleMorphLoopStart',
    'ensembleMorphLoopEnd',
    'ensembleMorphBlendIn',
    'ensembleMorphBlendOut',
];

PARTICLE_PROPS = [
    'ensembleParticleGenerationRate',
    'ensembleParticleState',
    'ensembleParticleFrameStart',
    'ensembleParticleFrameEnd',
    'ensembleParticleBlendIn',
    'ensembleParticleBlendOut',
];

function ActionsPanel(args) {
    this.$el = args.el;
    this.mode = args.mode;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.productType = args.productType;

    this.actionId = -1;
    this.ensembleId = -1;
    this.lastKnownTop = 0;
    
    this.particleSystemsOn = {};
    this.particleSystemsOff = {};
    this.particleSystemsStates = {};

    this.collapsiblePanels = CollapsiblePanel.createCollapsiblePanels($.extend({}, args, { el: this.$el[0]}));
    for each(var cp in this.collapsiblePanels) {
        cp.enable(true);
        cp.changedEvent.subscribe(this.relayoutEnsemblePanel.bind(this));
    }
    this.pillButtons = PillButton.createPillButtons(args);

    if (this.imvu.call('isAdmin') && this.productType == 'Avatar 2-Party Action') {
        $('#actionTwoParty').css('display', '');
    }

    this.oggChooser = new AssetChooser({
        imvu: this.imvu,
        eventBus: this.eventBus,
        button: this.pillButtons[$('#addOgg')[0].id],
        select: '#actionOgg',
        extension: 'ogg',
        type: 'Ogg Vorbis'
    });

    this.xafChooser = new AssetChooser({
        imvu: this.imvu,
        eventBus: this.eventBus,
        button: this.pillButtons[$('#addXaf')[0].id],
        select: '#ensembleXaf',
        extension: 'xaf',
        type: 'XAF'
    });

    this.xpfChooser = new AssetChooser({
        imvu: this.imvu,
        eventBus: this.eventBus,
        button: this.pillButtons[$('#addXpf')[0].id],
        select: '#ensembleXpf',
        extension: 'xpf',
        type: 'XPF'
    });

    var actionPropChange   = this.propChange.bind(this, function (p, u) { return this.imvu.call('setActionField', this.actionId, p, u, 'ui-actionsPanel'); }.bind(this));
    var ensemblePropChange = this.propChange.bind(this, function (p, u) { return this.imvu.call('setEnsembleField', this.actionId, this.ensembleId, p, u, 'ui-actionsPanel'); }.bind(this));

    var listenPropChange = function (fun, eid) {
        var $elt = $('#' + eid);
        $elt.change(function () { fun($elt[0]); });
    }.bind(this);

    for each (var actionProp in ACTION_PROPS) {
        listenPropChange(actionPropChange, actionProp);
    }

    for each (var ensembleProp in ENSEMBLE_PROPS) {
        listenPropChange(ensemblePropChange, ensembleProp);
    }

    this.setupParticles();

    this.oggChooser.subscribe(function () { actionPropChange($('#actionOgg')[0]); }.bind(this));
    this.xafChooser.subscribe(function () { ensemblePropChange($('#ensembleXaf')[0]); }.bind(this));
    this.xpfChooser.subscribe(function () { ensemblePropChange($('#ensembleXpf')[0]); }.bind(this));

    $('#playAction').click(this.playAction.bind(this));
    $('#addAction').click(this.addAction.bind(this));
    $('#removeAction').click(this.removeAction.bind(this));
    
    $('#addEnsemble').click(this.addEnsemble.bind(this));
    
    this.$removeEnsemble = $('#removeEnsemble');
    this.$removeEnsemble.click(this.removeEnsemble.bind(this));
    var removeOgg = this.removeActionAsset.bind(this, this.oggChooser);
    var removeXaf = this.removeEnsembleAsset.bind(this, this.xafChooser);
    var removeXpf = this.removeEnsembleAsset.bind(this, this.xpfChooser);

    $('#removeOgg').click(removeOgg);
    $('#removeXaf').click(removeXaf);
    $('#removeXpf').click(removeXpf);
    this.eventBus.register('ProductChanged', this.onProductChanged, 'Mode', this);

    if (this.productType == 'Avatar Action' ||
        this.productType == 'Avatar 2-Party Action' ||
        this.productType == 'Avatar Coop Action') {
        $('#addAction').css('display', 'none');
        $('#removeAction').css('display', 'none');
        $trigger = $('#actionTrigger');
        $trigger.attr("disabled", true);
        var $type = $('#actionType');
        $type.attr("disabled", true);
    }

    this.initialized = false;
}

ActionsPanel.prototype = {
    UP:    38,
    DOWN:  40,
    LEFT:  37,
    RIGHT: 39
};

ActionsPanel.prototype.onSelect = function() {
    if (this.initialized == false) {
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('wait');
        }
        this.setupParticles();
        if (this.productType == 'Avatar Action' ||
            this.productType == 'Avatar 2-Party Action') {
            this.showAction(0);
            this.relayoutEnsemblePanel();
        } else {
            this.populateActionChooser();
        }
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('auto');
        }
        this.initialized = true;
    }
}

ActionsPanel.prototype.setupParticles = function() {
    if (!this.imvu.call('shouldSeeFeature', 'editParticles')) {
        $('#ensembleParticles').hide();
        return;
    }

    $('#ensembleParticles').show();
    $('#ensembleParticleChildren').empty();
    var template = $('#hiddenTemplates .particleControls');

    particleSystems = this.imvu.call('getParticleSystems');
    if (!particleSystems){
        return;
    }

    for (var systemIndex = 0; systemIndex < particleSystems.__count__; systemIndex++) {
        var systemName = "ParticleSystem"+systemIndex;
        var particleSystem = particleSystems[systemName];

        var clone = template.clone();
        clone.children('.name').text(particleSystem['AssetName']);
        clone.addClass(systemName + "Controls");

        var listenPropChange = function(index, $block, elementId) {
            var $element = $block.find('.' + elementId);
            var changeProperty = function(name, value) {
                return this.imvu.call('setParticleField', this.actionId, this.ensembleId, index, name, value, 'ui-actionsPanel');
            }.bind(this);
            var onChange = function() {
                this.propChange(changeProperty, $element[0]);
            }.bind(this);
            $element.change(onChange);
        }.bind(this);

        for each (var particleProp in PARTICLE_PROPS) {
            listenPropChange(systemIndex, clone, particleProp);
        }
        this.particleSystemsStates[particleSystem['AssetName']] = clone.children('.state');
        clone.appendTo('#ensembleParticleChildren');
    }
}

ActionsPanel.prototype.removeActionAsset = function(assetChooser) {
    var selectedValue = assetChooser.$select.val();
    var elId = assetChooser.$select.attr('id');
    if (selectedValue != '') {
        this.imvu.call('setActionField', this.actionId, elId, '', 'ui-actionsPanel'); 
        this.imvu.call('deleteActionAsset', selectedValue);
    }
}

ActionsPanel.prototype.removeEnsembleAsset = function(assetChooser) {
    var selectedValue = assetChooser.$select.val();
    var elId = assetChooser.$select.attr('id');
    if (selectedValue != '') {
        this.imvu.call('setEnsembleField', this.actionId, this.ensembleId, elId, '', 'ui-actionsPanel'); 
        this.imvu.call('deleteActionAsset', selectedValue);
    }
}

ActionsPanel.prototype.getSelectedEnsembleIndex = function() {
    var $lis = $('#ensembles li');
    for (var i=0; i<$lis.size(); i++) {
        if ($($lis[i]).hasClass('selected')) {
            return i;
        }
    }
}

ActionsPanel.prototype.selectEnsembleIndex = function(idx) {
    var $lis = $('#ensembles li');
    for (var i=0; i < $lis.size(); i++) {
        if (i == idx) {
            $lis[i].showEnsemble();
        }
    }
}

ActionsPanel.prototype.propChange = function(fn, elt) {
    var propName = elt.id ? elt.id: elt.className;

    var fieldName = 'value';
    if (elt.type == 'checkbox') {
        fieldName = 'checked';
    }
    var uiValue = elt[fieldName];
    var pyValue = fn(propName, uiValue);
    if (pyValue === null) {
        pyValue = uiValue;
    }
    if (uiValue != pyValue) {
        elt[fieldName] = pyValue;
    }
}

ActionsPanel.prototype._getActionIds = function() {
    var result = this.imvu.call('getActionIds');
    if (result === null) {
        result = ['askafaddle', 'derpyderp'];
    }
    return result;
}

ActionsPanel.prototype._getActionInfo = function(actionId) {
    var result = this.imvu.call('getActionInfo', actionId);
    if (result === null) {
        result = {
            'actionTrigger': 'trigger',
            'actionType': 'Avatar',
            'actionAvatarId': '80,191',
            'actionAfterPlaying': 'ActionEnsemblePickingOncePerIteration',
            'actionNumberEnsemblesPlayed': '1',
            'actionSoundLoop': '0',
            'actionOgg': '',
            'ensembles': [{ 'ensembleActionStopAfter': 'Longer effect ends',
                            'ensembleDisableGaze': '1',
                            'ensembleExtraLoopCap': '',
                            'ensembleMorphAmplitudeScale': '',
                            'ensembleMorphBlendIn': '',
                            'ensembleMorphBlendOut': '',
                            'ensembleMorphBlendWeight': '',
                            'ensembleMorphLoopCount': '',
                            'ensembleMorphLoopEnd': '',
                            'ensembleMorphLoopStart': '',
                            'ensembleMorphPlaybackSpeed': '',
                            'ensemblePlayProbability': '',
                            'ensembleSkeletalBlendIn': '5',
                            'ensembleSkeletalBlendOut': '5',
                            // COMMENT DUPLICATED FROM ProductEditContext.py, line 1283
                            // Disabling per Matt 2010-09-20.  We don't even document this field.
                            // http://www.imvu.com/creators/education_center.php?tutorial_id=2252841
                            // I'm not quite comfortable disabling the functionality in case there is some rare product that does use it.
                            //'ensembleSkeletalBlendWeight': '',
                            'ensembleSkeletalComposition': 'Replace',
                            'ensembleSkeletalLoopCount': '1',
                            'ensembleSkeletalLoopEnd': '',
                            'ensembleSkeletalLoopStart': '',
                            'ensembleSkeletalPlaybackSpeed': '',
                            'ensembleSpeedMultiplierBase': '1.5',
                            'ensembleSpeedMultiplierOffsetRange': '',
                            'ensembleXaf': 'roundhouse2.xaf',
                            'ensembleXpf': '' }]
        };
    }
    return result;
}

ActionsPanel.prototype._getAssets = function(imvuFunctionName) {
    var result = this.imvu.call(imvuFunctionName);
    if (result === null) {
        result = [];
    }
    return result;
}

ActionsPanel.prototype.populateSoundAssets = function() {
    var assets = this._getAssets('getSoundAssets');
    this.oggChooser.setItems(assets);
}

ActionsPanel.prototype.populateSkeletalAnimationAssets = function() {
    var assets = this._getAssets('getSkeletalAnimationAssets');
    this.xafChooser.setItems(assets);
}

ActionsPanel.prototype.populateMorphAnimationAssets = function() {
    var assets = this._getAssets('getMorphAnimationAssets');
    this.xpfChooser.setItems(assets);
}

ActionsPanel.prototype._id = function(m, t) {
    $('#' + t).val(m[t] || '');
}

ActionsPanel.prototype._check = function(m, t) {
    $('#' + t).attr("checked", !!m[t]);
}

ActionsPanel.prototype._choose = function(m, t) {
    var v = m[t] || '';
    var $opts = $("#" + t +  " option:contains(\"" + v + "\")");
    if (v && $opts) {
        $opts.attr("selected", true);
    } else if (!v) {
        $("#" + t +  " option:eq(0)").attr('selected', true);
    }
}

ActionsPanel.prototype.populateActionFields = function(actionInfo) {
    this.populateSoundAssets();

    m = actionInfo;
    choose = this._choose.bind(this, m);
    check  = this._check.bind(this, m);
    id     = this._id.bind(this, m);

    choose('actionOgg');
    choose('actionType');
    choose('actionAfterPlaying');

    check('actionSoundLoop');

    id('actionSoundDelay');
    id('actionTrigger');
    id('actionAvatarId');
    id('actionNumberEnsemblesPlayed');
    id('actionTwoPartyProductId');
    id('actionTwoPartyKindIAm');
    id('actionTwoPartyKindIMatch');
}

ActionsPanel.prototype.populateEnsembleFields = function(ensembleInfo) {
    this.populateSkeletalAnimationAssets();
    this.populateMorphAnimationAssets();

    m = ensembleInfo;
    choose = this._choose.bind(this, m);
    check  = this._check.bind(this, m);
    id     = this._id.bind(this, m);

    choose('ensembleXaf');
    choose('ensembleXpf');
    choose('ensembleActionStopAfter');
    choose('ensembleSkeletalComposition');

    check('ensembleDisableGaze');

    id('ensembleSpeedMultiplierBase');
    id('ensembleSpeedMultiplierOffsetRange');
    id('ensembleExtraLoopCap');
    id('ensemblePlayProbability');
    // COMMENT DUPLICATED FROM ProductEditContext.py, line 1283
    // Disabling per Matt 2010-09-20.  We don't even document this field.
    // http://www.imvu.com/creators/education_center.php?tutorial_id=2252841
    // I'm not quite comfortable disabling the functionality in case there is some rare product that does use it.
    // 'ensembleSkeletalBlendWeight',
    //id('ensembleSkeletalBlendWeight');
    id('ensembleSkeletalPlaybackSpeed');
    id('ensembleSkeletalLoopCount');
    id('ensembleSkeletalLoopStart');
    id('ensembleSkeletalLoopEnd');
    id('ensembleSkeletalBlendIn');
    id('ensembleSkeletalBlendOut');
    id('ensembleMorphBlendWeight');
    id('ensembleMorphPlaybackSpeed');
    id('ensembleMorphAmplitudeScale');
    id('ensembleMorphLoopCount');
    id('ensembleMorphLoopStart');
    id('ensembleMorphLoopEnd');
    id('ensembleMorphBlendIn');
    id('ensembleMorphBlendOut');
    
    this.populateParticleFields(m);
}

ActionsPanel.prototype.populateParticleFields = function(ensembleInfo) {
    this.setupParticles();

    for (var particleEffectName in ensembleInfo['particles']) {
        var particleEffect = ensembleInfo['particles'][particleEffectName];
        if (! particleEffect){
            return;
        }
        var particleSystemId = parseInt(particleEffectName.substr("ParticleEffect".length));

        for (var property in particleEffect) {
            $('#ensembleParticles .ParticleSystem' + particleSystemId + 'Controls').find('.' + property).val(particleEffect[property]);
        }
    }
}

ActionsPanel.prototype.relayoutEnsemblePanel = function() {
    var top = $('.ensembleInfoTopRef').attr("offsetTop");
    if (top == 0) { // as it will when the panel is not showing
        top = this.lastKnownTop;
    }
    $('#ensembleInfo').css('top',  top+'px')
    this.lastKnownTop = top;
}

ActionsPanel.prototype.populateActionChooser = function() {
    if (!this.actionChooser) {
        var args = { el: $('#actionChooser')[0] };

        this.actionChooser = new HorizontalChooser(args);
        this.actionChooser.selectEvent.subscribe(
            function (n, a) {
                var actionId = a[0].id;
                this.showAction(actionId);
            }.bind(this)
        );
    }

    var actionCount = 0;
    var actions = this._getActionIds();
    for (var actionId in actions) {
        var name = '' + actionId + ': ' + actions[actionId];
        this.actionChooser.addItem({ buttonText: name, fullText: name, id: actionId });
        actionCount++;
    }

    var removeIds = [];
    for (var actionId in this.actionChooser.items) {
        if (!(actionId in actions)) {
            removeIds.push(actionId);
        }
    }
    this.actionChooser.removeIds(removeIds);

    var hide = (actionCount == 0);
    var specs = ['.actionInfo'];
    var display = hide ? 'none': '';

    for each(var spec in specs) {
        $(spec).css('display', display);
    }

    hide |= (this.productType == 'Avatar Action' || this.productType == 'Avatar 2-Party Action');
    display = hide ? 'none': '';
    $('#actionChooser').css('display', display);

    if (actionCount > 0) {
        if (this.actionId in actions) {
            this.showAction(this.actionId);
        } else {
            this.showAction(0);
        }
    }

    this.relayoutEnsemblePanel();
}

ActionsPanel.prototype.populateEnsembles = function(ensembles) {
    var $ul = $('#ensembles');
    $ul.children().remove();

    var bind_li = function (li, ensemble, ensembleId) {
        li.ensembleId = ensembleId;
        li.showEnsemble = this.showEnsemble.bind(this, ensembleId);
        $(li).click(li.showEnsemble);
    }.bind(this);

    var z = 1000;
    for (var ensembleId in ensembles) {
        var ensemble = ensembles[ensembleId];
        var $li = $(document.createElement('li'));
        $li.css('z-index', z--);
        $ul.append($li);
        bind_li($li[0], ensemble, ensembleId);
        var ensId = document.createElement('span');
        $(ensId).addClass('ensId');
        $(ensId).html("<span class='text'>" + ensembleId + ': ' + ensemble['ensembleXaf'] + "</span>");
        $li.append(ensId);
    }

    if (ensembles && ensembles.length) {
        $('#ensembleInfo .panels').css('display', '');
        if (this.ensembleId in ensembles) {
            this.showEnsemble(this.ensembleId);
        } else {
            this.showEnsemble(0);
        }
    }
    
    $('#ensembleInfo .panelsHeader').show();
    $('#ensembleInfo .panels').show();
}

ActionsPanel.prototype.selectNextSubElement = function() {
    this.actionChooser.selectNext();
}

ActionsPanel.prototype.selectPrevSubElement = function() {
     this.actionChooser.selectPrev();
}

ActionsPanel.prototype.selectNextSubSubElement = function() {
    this.selectEnsembleIndex(this.getSelectedEnsembleIndex() + 1);
}

ActionsPanel.prototype.selectPrevSubSubElement = function() {
    this.selectEnsembleIndex(this.getSelectedEnsembleIndex() - 1);
}

ActionsPanel.prototype.showAction = function(actionId) {
    this.actionId = parseInt(actionId);
    $('#actionId').html(actionId);
    $('#actionId2').html(actionId);
    var actionInfo = this._getActionInfo(actionId);
    this.populateActionFields(actionInfo);
    this.populateEnsembles(actionInfo['ensembles']);
}

ActionsPanel.prototype.showEnsemble = function(ensembleId) {
    var $els = $('#ensembles li');
    $els.removeClass('selected');
    $els.each(function (index, li) {
        if (li.ensembleId == ensembleId) {
            return $(li).addClass('selected');
        }
    });
    this.ensembleId = parseInt(ensembleId);
    $('#ensembleId').html(ensembleId);
    this.populateEnsembleFields(this._getActionInfo(this.actionId)['ensembles'][ensembleId]);
}

ActionsPanel.prototype.playAction = function() {
    this.imvu.call('playAction', this.actionId);
}

ActionsPanel.prototype.onProductChanged = function(eventName, eventInfo) {
    if (this.initialized && eventInfo.source != 'ui-actionsPanel' &&
        (eventInfo.source == 'productDictionary' || eventInfo.uiFieldName == 'actions' || eventInfo.uiFieldName == 'particles' ||
            eventInfo.uiFieldName == 'assets' ||
         eventInfo.uiFieldName.substring(0, 6) == 'action' || eventInfo.uiFieldName.substring(0, 8) == 'ensemble')) {
        this.initialized = false;
        if (this.mode.selectedPanel == this) {
            this.onSelect();
        }
    }
}

ActionsPanel.prototype.addEnsemble = function() {
    var ensembleId = this.imvu.call('addEnsemble', this.actionId, 'ui-actionsPanel'); 
    this.showAction(this.actionId);
    this.showEnsemble(ensembleId);
}

ActionsPanel.prototype.removeEnsemble = function() {
    if(this.ensembleId >= 0) {
        var removedId = this.getSelectedEnsembleIndex();
        
        this.imvu.call('removeEnsemble', this.actionId, removedId, 'ui-actionsPanel');
        this.populateEnsembles(this._getActionInfo(this.actionId)['ensembles']);

        if($('#ensembles li').size() === 0) {
            $('#ensembleInfo .panelsHeader').hide();
            $('#ensembleInfo .panels').hide();
            this.ensembleId = -1;
        } else {
            var removedId = removedId < $('#ensembles li').size() ? removedId : ($('#ensembles li').size() - 1);
            this.selectEnsembleIndex(removedId);
        }
    }
}

ActionsPanel.prototype.addAction = function() {
    var actionId = this.imvu.call('addAction', 'ui-actionsPanel');
    this.populateActionChooser();
    this.actionChooser.selectId(actionId);
}

ActionsPanel.prototype.removeAction = function() {
    this.imvu.call('removeAction', this.actionId, 'ui-actionsPanel');
    this.populateActionChooser();
}

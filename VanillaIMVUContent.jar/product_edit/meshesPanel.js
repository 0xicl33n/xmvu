function MeshesPanel(args) {
    var self = this;
    this.el = YAHOO.util.Dom.get(args.el);
    this.mode = args.mode;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    if (args.productType) {
        this.productType = args.productType.toLowerCase();
    } else {
        this.productType = '';
    }

    this.meshId = -1;
    this.materialId = -1;
    this.lastKnownTop = 0;

    this.pillButtons = PillButton.createPillButtons(args);
    this.xmfChooser = new AssetChooser({
        imvu: this.imvu,
        eventBus: this.eventBus,
        button: this.pillButtons[$('#addXmf').attr('id')],
        select: '#meshXmf',
        extension: 'xmf',
        type: 'Mesh'
    });

    this.xrfChooser = new AssetChooser({
        imvu: this.imvu,
        eventBus: this.eventBus,
        button: this.pillButtons[$('#addXrf').attr('id')],
        select: '#materialXrf',
        extension: 'xrf',
        type: 'Materials'
    });
    switch (this.productType) {
        case 'avatar skin':
            $('#opacityView').addClass('hidden');
            this.isSkinProduct = true;
            break;
        case 'avatar eyecolor skin':
            $('#opacityView').addClass('hidden');
            this.isSkinProduct = true;
            break;
        case 'avatar eyebrow skin':
            $('#deleteOpacity').addClass('hidden');
            this.isSkinProduct = true;
            break;
        default:
            this.isSkinProduct = false;
            break;
    }

    this.collapsiblePanels = CollapsiblePanel.createCollapsiblePanels($.extend({}, args, {
        el: this.el
    }));

    for each(var cp in this.collapsiblePanels) {
        cp.enable(true);
        cp.changedEvent.subscribe(this.relayoutMaterialPanel.bind(this));
    }
    if (this.isSkinProduct) {
        this.collapsiblePanels['materialSubmeshInfo'].enable(false);
    }
    this.collapsiblePanels['meshScale'].enable(false);

    var self = this;
    this.propNames = [];

    function listenPropChange(fun, eid) {
        self.propNames.push(eid);

        function pc() {
            fun('#' + eid);
        }
        YAHOO.util.Event.addListener(eid, 'change', pc);
    }
    var meshPropChange = self.meshPropChange.bind(self);
    listenPropChange(meshPropChange, 'meshScaleOn');
    listenPropChange(meshPropChange, 'meshScaleNodeName');
    listenPropChange(meshPropChange, 'meshScaleX');
    listenPropChange(meshPropChange, 'meshScaleY');
    listenPropChange(meshPropChange, 'meshScaleZ');
    listenPropChange(meshPropChange, 'meshXmf');

    var materialPropChange = self.materialPropChange.bind(self);
    listenPropChange(materialPropChange, 'twoSided');
    listenPropChange(materialPropChange, 'selfIlluminated');
    listenPropChange(materialPropChange, 'fogOverride');
    listenPropChange(materialPropChange, 'skinComposite');
    listenPropChange(materialPropChange, 'vertexColors');
    listenPropChange(materialPropChange, 'useBlending');
    listenPropChange(materialPropChange, 'blendingMode');
    listenPropChange(materialPropChange, 'textureAnimationOn');
    listenPropChange(materialPropChange, 'textureAnimationMode');
    listenPropChange(materialPropChange, 'textureAnimationFramesPerCell');
    listenPropChange(materialPropChange, 'textureAnimationCellWidth');
    listenPropChange(materialPropChange, 'textureAnimationCellHeight');
    listenPropChange(materialPropChange, 'textureAnimationOffsetX');
    listenPropChange(materialPropChange, 'textureAnimationOffsetY');
    listenPropChange(materialPropChange, 'textureAnimationDirectionX');
    listenPropChange(materialPropChange, 'textureAnimationDirectionY');
    listenPropChange(materialPropChange, 'textureAnimationStartCell');
    listenPropChange(materialPropChange, 'textureAnimationNumCells');

    this.xmfChooser.subscribe(function() {
        self.meshPropChange('#meshXmf');
    });

    this.xrfChooser.subscribe(function(arg) {
        self.materialPropChange('#materialXrf');
    });
    YAHOO.util.Event.addListener('addMesh', 'click', this.addMeshListener.bind(this));
    YAHOO.util.Event.addListener('removeMesh', 'click', this.removeMeshListener.bind(this));

    YAHOO.util.Event.addListener('addTexture', 'click', this.editTextureListener.bind(this));
    YAHOO.util.Event.addListener('editTexture', 'click', this.editTextureListener.bind(this));
    YAHOO.util.Event.addListener('addOpacity', 'click', this.editOpacityListener.bind(this));
    YAHOO.util.Event.addListener('editOpacity', 'click', this.editOpacityListener.bind(this));
    YAHOO.util.Event.addListener('deleteOpacity', 'click', this.deleteOpacityListener.bind(this));

    this.eventBus.register('ProductChanged', this.onProductChanged, 'Mode', this);
    this.eventBus.register('FullAssetListChanged', this.onFullAssetListChanged, 'Mode', this);

    $('#materialAsset').toggle(!this.isSkinProduct && this.imvu.call('shouldEnableChangeMaterialName'));
    this.initialized = false;
}


MeshesPanel.prototype = {
    $: function(spec, parentEl) {
        return (parentEl || this.el).querySelector(spec);
    },
    $$: function(spec, parentEl) {
        return (parentEl || this.el).querySelectorAll(spec);
    },
};

MeshesPanel.prototype.onSelect = function() {
    if (this.initialized == false) {
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('wait');
        }
        if (this.isSkinProduct) {
            this.hideMeshChooserAndPopulateMaterials();
        } else {
            this.populateMeshAssets();
            this.populateMeshChooser();
        }
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('auto');
        }
        this.initialized = true;
    }
}

MeshesPanel.prototype.selectNextSubElement = function() {
    this.selectNextMesh();
}

MeshesPanel.prototype.selectPrevSubElement = function() {
    this.selectPrevMesh();
}

MeshesPanel.prototype.selectNextSubSubElement = function() {
    this.selectNextMaterial();
}

MeshesPanel.prototype.selectPrevSubSubElement = function() {
    this.selectPrevMaterial();
}

MeshesPanel.prototype.selectNextMaterial = function() {
    var thisActive = (this.el.parentNode && this.el.parentNode.id == 'activePanelHolder');
    if (!thisActive) return;
    this.selectMaterialIndex(this.getSelectedMaterialIndex() + 1);
}
MeshesPanel.prototype.selectPrevMaterial = function() {
    var thisActive = (this.el.parentNode && this.el.parentNode.id == 'activePanelHolder');
    if (!thisActive) return;
    this.selectMaterialIndex(this.getSelectedMaterialIndex() - 1);
}
MeshesPanel.prototype.selectNextMesh = function() {
    var thisActive = (this.el.parentNode && this.el.parentNode.id == 'activePanelHolder');
    if (!thisActive) return;
    this.meshChooser.selectNext();
}
MeshesPanel.prototype.selectPrevMesh = function() {
    var thisActive = (this.el.parentNode && this.el.parentNode.id == 'activePanelHolder');
    if (!thisActive) return;
    this.meshChooser.selectPrev();
}

MeshesPanel.prototype.getSelectedMaterialIndex = function() {
    var lis = $('#materials li');
    for (var i = 0; i < lis.length; i++) {
        if (lis.eq(i).hasClass('selected')) {
            return i;
        }
    }
}
MeshesPanel.prototype.selectMaterialIndex = function(idx) {
    var lis = $('#materials li');
    for (var i = 0; i < lis.length; i++) {
        if (i == idx) {
            lis[i].showMaterial(); // It's weird that we're injecting DOM elements with custom functions.
        }
    }
}

MeshesPanel.prototype.getPropValue = function(elt) {
    var $elt = $(elt);
    if ($elt.is('input[type=checkbox]')) {
        return $elt.is(':checked');
    }

    return $elt.val();
}

MeshesPanel.prototype.meshPropChange = function(elt) {
    this.imvu.call('setMeshField', this.meshId, $(elt).attr('id'), this.getPropValue(elt), 'ui-meshesPanel');
}

MeshesPanel.prototype.materialPropChange = function(elt) {
    var retDict = this.imvu.call('setMaterialField', this.meshId, this.materialId, $(elt).attr('id'), this.getPropValue(elt), 'ui-meshesPanel');

    var retVal = retDict.retVal;
    var reason = retDict.reason;
    if (!retVal && reason) {
        this.imvu.call('showErrorDialog', _T("Error setting property."), reason);
    } else if (!retVal) {
        this.imvu.call('showErrorDialog', _T("Error setting property."), _T("There was an error setting this material property."));
    }
}

MeshesPanel.prototype._getMeshIds = function() {
    var result = this.imvu.call('getMeshIds');
    if (result === null) {
        result = {
            0: {
                name: 'Mesh',
                asset: 'Mesh.xmf'
            },
            1: {
                name: 'female01.anime01.hair01.ShoulderLength',
                asset: 'female01.anime01.hair01.ShoulderLength.xmf'
            },
            6: {
                name: 'Shroomtastictastic',
                asset: 'Shroomtastictastic.xmf'
            },
            15: {
                name: 'Name',
                asset: 'Name.xmf'
            },
            24: {
                name: 'Name',
                asset: 'Name.xmf'
            }
        };
    }
    return result;
}

MeshesPanel.prototype._getMeshInfo = function(meshId) {
    if (meshId < 0) return {};
    var result = this.imvu.call('getMeshInfo', meshId);
    if (result === null) {
        var m = this._getMeshIds()[meshId];
        result = {
            meshId: meshId,
            name: m.name,
            asset: m.asset,
        };
        result.materials = {
            0: {
                materialId: 0,
                texture: {
                    name: 'adventure_crystal_patpatpatpatpatpatpatpatpatpatpatpatpat.jpg',
                    size: [256, 512],
                    url: 'http://userimages-akm.imvu.com/productdata/80/12/fb15ece4d17a30202693561727114347'
                },
                triangleCount: 1900,
                vertexCount: 2000
            },
            3: {
                materialId: 3,
                texture: {
                    name: 'Female01_Anime01_hair_Marla_Brunette.jpg',
                    size: [128, 128],
                    url: 'http://userimages-akm.imvu.com/productdata/80/12/bf96c4a5ec26b8050ded48c3fb60e92c',
                },
                opacity: {
                    name: 'Female01_Anime01_hair_Marla_ALPHA.tga',
                    size: [128, 128],
                    url: 'http://userimages-akm.imvu.com/productdata/80/12/0c1ca6e4635e8424201d33fac5782365'
                },
                twoSided: true,
                selfIlluminated: true,
                fogOverride: true,
                skinComposite: true,
                vertexColors: true,
                useBlending: true,
                blendingMode: 'Composite',
                textureAnimationOn: true,
                textureAnimationMode: 'Cycling',
                textureAnimationFramesPerCell: 1,
                textureAnimationCellWidth: 2,
                textureAnimationCellHeight: 3,
                textureAnimationOffsetX: 4,
                textureAnimationOffsetY: 5,
                textureAnimationDirectionX: 6,
                textureAnimationDirectionY: 7,
                textureAnimationStartCell: 8,
                textureAnimationNumCells: 9,
                triangleCount: 1700,
                vertexCount: 2300,
            }
        };
    }
    return result;
}

MeshesPanel.prototype._getMaterialInfo = function() {
    var result = this.imvu.call('getMaterialInfo');
    if (result === null) {
        result = {};
        result.materials = {
            3: {
                materialId: 3,
                texture: {
                    name: 'Female01_Anime01_hair_Marla_Brunette.jpg',
                    size: [128, 128],
                    url: 'http://userimages-akm.imvu.com/productdata/80/12/bf96c4a5ec26b8050ded48c3fb60e92c'
                }
            }
        };
    }
    return result;
}

MeshesPanel.prototype._getMeshAssets = function() {
    var result = this.imvu.call('getMeshAssets');
    if (result === null) {
        result = [];
    }
    //add missing assets returned by _getMeshIds
    for each(var mi in this._getMeshIds()) {
        if (-1 == result.indexOf(mi.asset)) {
            result.push(mi.asset);
        }
    }
    return result;
}

MeshesPanel.prototype.populateMeshAssets = function() {
    var assets = this._getMeshAssets();
    this.xmfChooser.setItems(assets);
}

MeshesPanel.prototype.populateMeshChooser = function() {
    var self = this;

    $(this.el).removeClass('hideMeshInfo');

    if (!this.meshChooser) {
        var args = {};
        args.el = this.$('#meshChooser');
        this.meshChooser = new HorizontalChooser(args);

        this.meshChooser.selectEvent.subscribe(
            function(n, a) {
                var meshId = a[0].id;
                self.showMesh(meshId);
            }
        );
    }

    var meshes = this._getMeshIds();
    var meshCount = 0;
    for (var meshId in meshes) {
        var mesh = meshes[meshId];
        if (mesh.asset) {
            var item = {
                buttonText: meshId + " " + (mesh.name || ''),
                fullText: meshId + " " + (mesh.asset || ''),
                id: meshId
            };
            this.meshChooser.addItem(item);
            meshCount += 1;
        }
    }
    var removeIds = [];
    for (var meshId in this.meshChooser.items) {
        if (!meshes[meshId]) {
            removeIds.push(meshId);
        }
    }
    this.meshChooser.removeIds(removeIds);

    var specs = ['#meshChooser', '.meshInfo'];
    var display = '';
    if (meshCount == 0) {
        display = 'none';
    }
    for each(var spec in specs) {
        YAHOO.util.Dom.setStyle(this.$(spec), 'display', display);
    }
    if (meshCount) {
        if (!meshes[self.meshId]) {
            for (var meshId in meshes) {
                self.meshId = meshId;
            }
        }
        self.showMesh(self.meshId);
    }

    self.relayoutMaterialPanel();
}

MeshesPanel.prototype.hideMeshChooserAndPopulateMaterials = function() {
    $(this.el).addClass('hideMeshInfo');
    meshInfo = this._getMaterialInfo();
    this.populateMaterials(meshInfo.materials);
}

MeshesPanel.prototype.proportionImage = function($img, size, max) {
    var w = size[0];
    var h = size[1];
    if (w > h) {
        h = Math.round(max * (h / w));
        w = max;
    } else {
        w = Math.round(max * (w / h));
        h = max;
    }
    $img.width(w).height(h);
}

MeshesPanel.prototype.populateMaterials = function(materials) {
    var ul = this.$('#materials');
    $(ul).children().each(function(index, li) {
        YAHOO.util.Event.removeListener(li, 'click', li.showMaterial);
    });
    $(ul).children().remove();
    var self = this;

    function bind_li(li, material) {
        li.materialId = material.materialId;
        li.showMaterial = function() {
            self.showMaterial(material);
        };
        YAHOO.util.Event.addListener(li, 'click', li.showMaterial);
    }
    var materialIds = [];
    for (var k in materials) {
        materialIds.push(k);
    }
    materialIds.sort(function(a, b) {
        return a - b;
    });

    var z = 1000;
    for each(var k in materialIds) {
        var material = materials[k];

        var li = document.createElement('li');
        YAHOO.util.Dom.setStyle(li, 'z-index', z--);
        ul.appendChild(li);
        bind_li(li, material);

        var imgTable = document.createElement('div');
        $(imgTable).addClass('imgTable');
        li.appendChild(imgTable);

        var imgHolder = document.createElement('div');
        $(imgHolder).addClass('imgHolder');
        imgTable.appendChild(imgHolder);

        var $img = $('<img/>');
        imgHolder.appendChild($img[0]);

        var matId = document.createElement('span');
        $(matId).addClass('matId');
        matId.innerHTML = "<span class='text'>" + widen_number(k, 2) + "</span>";
        li.appendChild(matId);

        var t = material.texture ? material.texture : material.opacity;
        var size = t && t.size ? t.size : [1, 1];
        var url = t && t.url ? t.url : '';
        this.proportionImage($img, size, 45);
        $img.attr('src', url);
    }
    if (materialIds.length) {
        YAHOO.util.Dom.setStyle(this.$('#materialInfo'), 'display', '');
        var assets = this.imvu.call('getMaterialAssets') || [];
        this.xrfChooser.setItems(assets);
        var matId = materialIds[0];
        if (materials[this.materialId]) {
            matId = this.materialId;
        }
        this.showMaterial(materials[matId]);
    } else {
        YAHOO.util.Dom.setStyle(this.$('#materialInfo'), 'display', 'none');
    }
}

MeshesPanel.prototype.showMaterial = function(m) {
    this.materialId = m.materialId;

    var meshInfo;
    if (this.isSkinProduct) {
        meshInfo = this._getMaterialInfo();
    } else {
        meshInfo = this._getMeshInfo(this.meshId);
    }

    var material = meshInfo.materials[this.materialId];

    var els = this.$$('#materials li');
    $(els).removeClass('selected');
    $(els).filter('[materialId=' + material.materialId + ']').addClass('selected');
    this.$('#matId').innerHTML = material.materialId;
    this.$('#triangleCount').innerHTML = material.triangleCount;

    this.$('#vertexCount').innerHTML = material.vertexCount;
    var doTexture = function(root, t) {
        var res = '';
        var base = 'empty';
        var ext = '';
        if (t && t.size) {
            res = t.size[0] + 'x' + t.size[1];
        }
        if (t && t.name) {
            var groups = t.name.split('.');
            var last = groups.pop();
            if (groups.length) {
                base = groups.join('.');
                ext = '.' + last;
            } else {
                base = last;
                ext = '';
            }
        }
        $('.resolution', root).html(res);
        $('.baseName', root).html(base);
        $('.ext', root).html(ext);

        var $img = $('.textureMap img', root);
        $img.children().remove();
        if (t && t.url) {
            $img.attr('src', t.url);
        } else {
            $img.addClass('empty');
            $img.attr('src', '');
        }
        if (t && t.size) {
            this.proportionImage($img, t.size, 84);
        } else {
            this.proportionImage($img, [1, 1], 84);
        }
    }.bind(this);
    doTexture('#textureView', material.texture);
    doTexture('#opacityView', material.opacity);

    if (material.texture) {
        $('#addTexture').addClass('disabled');
        $('#editTexture').removeClass('disabled');
    } else {
        $('#addTexture').removeClass('disabled');
        $('#editTexture').addClass('disabled');
    }

    if (material.opacity) {
        $('#addOpacity').addClass('disabled');
        $('#editOpacity').removeClass('disabled');
        $('#deleteOpacity').removeClass('disabled');
    } else {
        $('#addOpacity').removeClass('disabled');
        $('#editOpacity').addClass('disabled');
        $('#deleteOpacity').addClass('disabled');
    }

    var check = function(t) {
        this.$('#' + t).checked = !! material[t];
    }.bind(this);
    check('twoSided');
    check('selfIlluminated');
    check('fogOverride');
    check('skinComposite');
    check('vertexColors');
    check('useBlending');
    check('textureAnimationOn');

    var num = function(t) {
        this.$('#' + t).value = material[t] || '';
    }.bind(this);
    num('textureAnimationFramesPerCell');
    num('textureAnimationCellWidth');
    num('textureAnimationCellHeight');
    num('textureAnimationOffsetX');
    num('textureAnimationOffsetY');
    num('textureAnimationDirectionX');
    num('textureAnimationDirectionY');
    num('textureAnimationStartCell');
    num('textureAnimationNumCells');

    var choose = function(t) {
        var s = this.$('#' + t);
        var v = material[t] || '';
        $(s).children(':contains("' + v + '"):first').attr('selected', true);
    }.bind(this);
    choose('blendingMode');
    choose('textureAnimationMode');
    this.xrfChooser.selectItem(material.asset);
    xrfEl = document.getElementById('materialXrf');
}

MeshesPanel.prototype.showMeshScale = function(m) {
    var check = function(t) {
        this.$('#' + t).checked = m && !! m[t];
    }.bind(this);
    check('meshScaleOn');

    var text = function(t) {
        this.$('#' + t).value = (m && m[t]) || '';
    }.bind(this);
    text('meshScaleNodeName');
    text('meshScaleX');
    text('meshScaleY');
    text('meshScaleZ');
}

MeshesPanel.prototype.showMesh = function(meshId) {
    this.meshId = parseInt(meshId);
    this.$('#meshId').innerHTML = meshId;
    var meshInfo = this._getMeshInfo(meshId);
    this.$('#meshName').innerHTML = meshInfo.name;

    var asset = meshInfo.asset || '';
    $('#meshXmf option:contains("' + asset + '")').attr('selected', true);
    var submeshCount = 0;
    for (var k in meshInfo.materials) {
        submeshCount += 1;
    }
    this.$('#submeshCount').innerHTML = submeshCount;

    var meshScale = meshInfo.meshScale;
    this.showMeshScale(meshScale);

    this.populateMaterials(meshInfo.materials);
    switch (this.productType) {
        case 'avatar':
        case 'avatar clothing':
            this.collapsiblePanels['meshScale'].enable(this.meshId == 0);
            this.relayoutMaterialPanel();
    }
}

MeshesPanel.prototype.relayoutMaterialPanel = function() {
    var tr = this.$('.materialInfoTopRef');
    var top = tr.offsetTop;
    if (top == 0) { // as it will when the panel is not showing
        top = this.lastKnownTop;
    }
    YAHOO.util.Dom.setStyle(this.$('#materialInfo'), 'top', top + 'px');
    this.lastKnownTop = top;
}

MeshesPanel.prototype.onProductChanged = function(eventName, eventInfo) {
    if (this.initialized && eventInfo.source != 'ui-meshesPanel' &&
        (eventInfo.source == 'productDictionary' || eventInfo.uiFieldName == 'meshes' ||
            eventInfo.uiFieldName == 'assets' || this.propNames.indexOf(eventInfo.uiFieldName) >= 0)) {
        this.initialized = false;
        if (this.mode.selectedPanel == this) {
            this.onSelect();
        }
    }
}

MeshesPanel.prototype.onFullAssetListChanged = function(eventName, eventInfo) {
    this.initialized = false;
    this.onSelect();
}

MeshesPanel.prototype.removeMeshListener = function() {
    this.imvu.call('showRemoveMeshDialog', this.meshId, 'ui-meshesPanel');
    this.populateMeshChooser();
}

MeshesPanel.prototype.addMeshListener = function() {
    var meshId = this.imvu.call('showAddMeshDialog', 'ui-meshesPanel');
    this.populateMeshChooser();
    if (meshId != null) {
        this.meshChooser.selectId(meshId);
    }
}

MeshesPanel.prototype.getImageFile = function() {
    var filename = this.imvu.call(
        "showFileOpenDialog",
        "Open image", [
            ["Image Files", "*.png; *.jpg; *.gif; *.bmp; *.tga"],
            ["All Files", "*.*"],
        ]
    );
    if (filename) {
        return filename;
    }
}

MeshesPanel.prototype._commonEditImageListener = function(assetName) {
    var filename;
    if ((filename = this.getImageFile())) {
        var retDict = this.imvu.call('setMaterialField', this.meshId, this.materialId, assetName, filename, 'ui-meshesPanel');
        var retVal = retDict.retVal;
        if (!retVal) {
            var reason = retDict.reason || '';
            var errText = _T("Image File") + ': ' + filename;
            if (reason != '') {
                errText += ' ' + _T("due to") + ': ' + reason;
            }
            this.imvu.call('showErrorDialog', _T("Unsupported Image Data"), errText);
        }
    }
}

MeshesPanel.prototype.editTextureListener = function() {
    return this._commonEditImageListener('textureAsset');
};
MeshesPanel.prototype.editOpacityListener = function() {
    return this._commonEditImageListener('opacityAsset');
};

MeshesPanel.prototype.deleteOpacityListener = function() {
    this.imvu.call('setMaterialField', this.meshId, this.materialId, 'opacityAsset', null, 'ui-meshesPanel');
}
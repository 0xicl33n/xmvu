function ParticlesPanel(args) {
    this.$el = args.el;
    this.$root = $(args.el);
    this.mode = args.mode;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.network = args.network;
    this.name = 'ParticlesPanel';
    this.colors = [];
    if (args.productType) {
        this.productType = args.productType.toLowerCase();
    } else {
        this.productType = '';
    }


    this.collapsiblePanels = CollapsiblePanel.createCollapsiblePanels($.extend({}, args, { el: this.$el[0]}));
    for each(var cp in this.collapsiblePanels) {
        cp.enable(true); //this.productType == 'room attachment');
    }
    this.pillButtons = PillButton.createPillButtons(args);
    this.domainWidgets = DomainWidget.createDomainWidgets(args);
    this.$initiallyEnabled = $('#particlesInitiallyEnabled');
    this.$textureAssetFilename = "";
    this.$blendMode = $('#particlesBlendMode');
    this.$initialRate = $('#particlesInitialRate');
    this.$gravityX = $('#particlesGravityX');
    this.$gravityY = $('#particlesGravityY');
    this.$gravityZ = $('#particlesGravityZ');
    this.$ageLimit = $('#particlesAgeLimit');
    this.$particlesColor = $('#particlesColor');
    this.$particlesColorHeader = $('#particlesColor thead');
    this.$particlesColorBody = $('#particlesColor .particlesColorBody');

    this.$imgSource = "#img";
    this.$imgBasename = "#textureAssetBaseName";
    this.$imgRes = "#textureAssetResolution";
    
    this.domainWidgets['particlesInitialPosition'].addUserChangeListener(this.setParticleSystemInfo.bind(this));
    this.domainWidgets['particlesInitialVelocity'].addUserChangeListener(this.setParticleSystemInfo.bind(this));
    this.domainWidgets['particlesAcceleration'].addUserChangeListener(this.setParticleSystemInfo.bind(this));
    this.pillButtons['addParticleSystem'].addUserEventListener(this.addParticleSystem.bind(this));
    this.pillButtons['removeParticleSystem'].addUserEventListener(this.removeParticleSystem.bind(this));
    this.pillButtons['addParticlesColor'].addUserEventListener(this.addParticlesColor.bind(this));
    this.pillButtons['delParticlesColor'].addUserEventListener(this.delParticlesColor.bind(this));
    this.$blendMode.change(jQuery.proxy(this.setParticleSystemInfo, this));
    this.$initialRate.change(jQuery.proxy(this.setParticleSystemInfo, this));
    this.$gravityX.change(jQuery.proxy(this.setParticleSystemInfo, this));
    this.$gravityY.change(jQuery.proxy(this.setParticleSystemInfo, this));
    this.$gravityZ.change(jQuery.proxy(this.setParticleSystemInfo, this));
    this.$ageLimit.change(jQuery.proxy(this.setParticleSystemInfo, this));
    this.eventBus.register('ProductChanged', this.onProductChanged, 'Mode', this);
    this.$initiallyEnabled.change(jQuery.proxy(this.setParticleSystemInfo, this));
    
    this.pillButtons['editParticleTexture'].addUserEventListener(this.editTextureListener.bind(this));

    this.numColors = 0;
    this.selectedIndex = -1;
    this.initialized = false;
    this.particleSystemInfo = null;
    this.currentIndex = -1;

}

ParticlesPanel.prototype.onSelect = function() {
    if (!this.initialized) {
       if (typeof(window.setCursor) == 'function') {
            window.setCursor('wait');
        }
        this.populateParticleSystemChooser();
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('auto');
        }
        this.initialized = true;
    }
};

ParticlesPanel.prototype.setParticleSystemInfo = function() {
    this.retrieveParticleSystem();
    this.sortParticleColors();
    this.populateFields();
    this.imvu.call('setParticleSystemInfo', this.currentIndex, this.packParticleSystemInfo(), 'ui-particlesPanel');
};

ParticlesPanel.prototype.populateParticleSystemChooser = function() {
    var self = this;
    if(!this.particleSystemChooser) {
        var args = {};
        args.el = $('#particleSystemChooser');
        this.particleSystemChooser = new HorizontalChooser(args);
        this.particleSystemChooser.selectEvent.subscribe(
            function(n,a) {
                self.showParticleSystem(a[0].id);
            }
        );
    }

    var particleSystems = this.imvu.call('getParticleSystemIndexes');
    var particleSystemCount = 0;
    for (var i = 0; i < particleSystems.length; i++) {
        var index = particleSystems[i];
        var info = this.imvu.call('getParticleSystemInfo', index);
        this.particleSystemChooser.addItem({id: index, buttonText: info['AssetName']});
        particleSystemCount ++;
    }

    var removeIds = [];
    for (var id in this.particleSystemChooser.items) {
        if (id >= particleSystemCount) {
            removeIds.push(id);
        }
    }
    this.particleSystemChooser.removeIds(removeIds);

    if (particleSystemCount == 0) {
        $('#particleSystemChooser').hide();
        $('#particlesInfo').hide();
    } else {
        $('#particleSystemChooser').show();
        $('#particlesInfo').show();

        if(this.currentIndex){
            this.showParticleSystem(this.currentIndex);
            this.particleSystemChooser.selectId(this.currentIndex);
        }
        else{
            this.showParticleSystem(particleSystems[0]);
            this.particleSystemChooser.selectId(particleSystems[0]);
        }
    }
}

ParticlesPanel.prototype.addParticleSystem = function() {
    var index = this.imvu.call('showAddParticleSystemDialog', 'ui-particlesPanel');
    this.populateParticleSystemChooser();
}

ParticlesPanel.prototype.removeParticleSystem = function() {
    if (this.currentIndex >= 0) {
        this.imvu.call('showRemoveParticleSystemDialog', this.currentIndex, 'ui-particlesPanel');
        this.populateParticleSystemChooser();
    }
}

ParticlesPanel.prototype.showParticleSystem = function(index) {
    $('#particleSystemIndex').html(index);
    var info = this.imvu.call('getParticleSystemInfo', index);
    this.unpackParticleSystemInfo(info);
    this.populateFields();
    this.populateTextureImage(this.imgSource);
    $('#particleSystemName').html(this.name);

    this.currentIndex = index;
}

ParticlesPanel.prototype.onProductChanged = function(eventName, eventInfo) {
    if (this.initialized && eventInfo.source != 'ui-particlesPanel' &&
        (eventInfo.source == 'productDictionary' || eventInfo.uiFieldName == 'particles' || eventInfo.uiFieldName == 'assets' ||
         eventInfo.uiFieldName.substring(0, 9) == 'particles')) {
        this.initialized = false;
        if (this.mode.selectedPanel == this) {
            this.onSelect();
        }
    }
}

ParticlesPanel.prototype.unpackParticleSystemInfo = function(info) {
    if ('Rules' in info) {
        this.rules = info['Rules'];
        if (this.rules) {
            for (var i = 0; i < this.rules.length; i++) {
                var rule = this.rules[i];
                switch(rule['Type']) {
                case 'Source':
                    if ('Position' in rule) {
                        this.initialPosition = rule['Position'];
                    }
                    if ('Rate' in rule) {
                        this.initialRate = parseFloat(rule['Rate']);
                    }
                    if ('Velocity' in rule) {
                        this.initialVelocity = rule['Velocity'];
                    }
                    break;
                case 'KillOld':
                    if ('AgeLimit' in rule) {
                        this.ageLimit = parseFloat(rule['AgeLimit']);
                    }
                    break;
                case 'RandomAccel':
                    if ('Acceleration' in rule) {
                        this.acceleration = rule['Acceleration'];
                    }
                    break;
                case 'Color':
                    if ('Colors' in rule) {
                        var colors = rule['Colors'];
                        this.colors = [];
                        for (var j = 0; j < colors.length; j++) {
                            var time = (j == 0) ? 0 : parseFloat(colors[j][0]);
                            var color = colors[j][1].substr(0, 6);
                            var alpha = Math.round(parseInt(colors[j][1].substr(6), 16) / 255 * 100)/100;
                            this.colors.push([time, color, alpha]);
                        }
                    }
                    break;
                default: // This particle system contains advanced features which cannot be edited in Create Mode -- edit the JSON file directly
                    break;
                }
            }
            for (i = 0; i < this.colors.length; i++) {
                if (this.ageLimit) {
                    this.colors[i][0] = this.colors[i][0] / this.ageLimit;
                }
            }
        }
    }
    if ('Version' in info) {
        this.version = info['Version'];
    }
    if ('TextureFilename' in info) {
        this.imgBasename = info['TextureFilename'];
    }
    if ('BlendMode' in info) {
        this.blendMode = info['BlendMode'];
    }
    if ('Gravity' in info) {
        var gravity = info['Gravity'].split(',');
        this.gravity = [parseFloat(gravity[0]), parseFloat(gravity[1]), parseFloat(gravity[2])];
    }
    if ('AssetName' in info) {
        this.name = info['AssetName'];
    }
    if ('InitiallyEnabled' in info) {
        this.initiallyEnabled = info['InitiallyEnabled'];
    }
    if ('TextureData' in info){
        this.imgSource = info['TextureData'];
    }
    if('TextureResolution' in info){
        this.imgRes = info['TextureResolution'];
    }
};

ParticlesPanel.prototype.packParticleSystemInfo = function() {
    var info = {};
    var rules = [];
    rules[0] = {'Type': 'Source', 'Position': this.initialPosition, 'Rate': this.initialRate, 'Velocity': this.initialVelocity};
    rules[1] = {'Type': 'KillOld', 'AgeLimit': this.ageLimit};
    rules[2] = {'Type': 'RandomAccel', 'Acceleration': this.acceleration};
    var colors = [];
    for (var i = 0; i < this.colors.length; i++) {
        var color = this.colors[i];
        var strAlpha = (Math.round(color[2]*255)).toString(16);
        if (strAlpha.length == 1) {
            strAlpha = '0' + strAlpha;
        }
        if (this.ageLimit) {
            colors.push([this.formatColorValue(color[0]*this.ageLimit), color[1]+strAlpha]);
        } else {
            colors.push([this.formatColorValue(color[0]), color[1]+strAlpha]);
        }
    }
    if (colors.length > 0) {
        rules[3] = {'Type': 'Color', 'Colors': colors};
    }
    info['InitiallyEnabled'] = this.initiallyEnabled;
    info['Rules'] = rules;
    info['Version'] = this.version;
    info['TextureFilename'] = this.imgBasename;
    info['BlendMode'] = this.blendMode;
    if ('gravity' in this) {
        info['Gravity'] = this.gravity[0]+','+this.gravity[1]+','+this.gravity[2];
    }
    return info;
};

ParticlesPanel.prototype.retrieveParticleSystem = function() {
    this.retrieveSimpleFields();
    this.initialPosition = this.domainWidgets['particlesInitialPosition'].getValue();
    this.initialVelocity = this.domainWidgets['particlesInitialVelocity'].getValue();
    this.acceleration = this.domainWidgets['particlesAcceleration'].getValue();
    this.colors = this.retrieveColorKeys();
};

ParticlesPanel.prototype.trim = function(str) {
    if (typeof str == 'undefined') {
        return '';
    }
    return str.replace(/^\s+|\s+$/g,'');
};

ParticlesPanel.prototype.toFloat = function(str, dft) {
    var val = this.trim(str);
    return val == '' ? dft : parseFloat(val);
};

ParticlesPanel.prototype.retrieveSimpleFields = function() {
    this.initiallyEnabled = this.$initiallyEnabled.is(":checked");
    this.blendMode = $('#particlesBlendMode').val();
    this.initialRate = this.toFloat(this.$initialRate.val());
    this.gravity = [this.toFloat(this.$gravityX.val()),
                    this.toFloat(this.$gravityY.val()),
                    this.toFloat(this.$gravityZ.val())];
    this.ageLimit = this.toFloat(this.$ageLimit.val());
};

ParticlesPanel.prototype.retrieveColorKeys = function() {
    var $trs = $('.colorRow');
    var colors = [];
    var self = this;
    $trs.each(function() {
        var strTime = self.trim($('.time', this).val());
        if (strTime == '') {
            strTime = '0';
        }
        var time = parseFloat(strTime);
        var strColor = self.trim($('.color', this).val());
        if (strColor.substr(0,1) == '#') {
            strColor = strColor.substr(1);
        }
        var strAlpha = self.trim($('.alpha',this).val());
        if (strAlpha == '') {
            strAlpha = '0';
        }
        var alpha = parseFloat(strAlpha);
        alpha = Math.min(Math.max(alpha, 0.0), 1.0);
        colors.push([time, strColor, alpha]);
    });
    return colors;
};

ParticlesPanel.prototype.populateFields = function() {
    this.populateSimpleFields();
    if ('initialPosition' in this) {
        this.domainWidgets['particlesInitialPosition'].setValue(this.initialPosition);
    }
    if ('initialVelocity' in this) {
        this.domainWidgets['particlesInitialVelocity'].setValue(this.initialVelocity);
    }
    if ('acceleration' in this) {
        this.domainWidgets['particlesAcceleration'].setValue(this.acceleration);
    }
    this.populateColorKeys();
};

ParticlesPanel.prototype.populateSimpleFields = function() {
    this.$blendMode.val(this.blendMode);
    this.$initialRate.val(''+this.initialRate);
    if ('gravity' in this) {
        this.$gravityX.val(''+this.gravity[0]);
        this.$gravityY.val(''+this.gravity[1]);
        this.$gravityZ.val(''+this.gravity[2]);
    }
    this.$ageLimit.val(''+this.ageLimit);
    this.$initiallyEnabled[0].checked = !!this.initiallyEnabled;
    $('#textureAssetBaseName').html(this.imgBasename);
    $('#textureAssetResolution').html(this.imgRes);
};

ParticlesPanel.prototype.populateTextureImage = function(imgSource){
    var $img = $('#img');
    $img.attr('src', imgSource);
};

/* color key support */

ParticlesPanel.prototype.populateColorKeys = function() {
    this.$particlesColorBody.html('');
    for (var i = 0; i < this.colors.length; i++) {
        this.addColorKey(i, this.colors[i]);
    }
    if (this.colors.length <= 1) {
        $(this.pillButtons['delParticlesColor'].el).hide();
    } else {
        $(this.pillButtons['delParticlesColor'].el).show();
    }
    if (this.selectedIndex >= 0) {
        this.selectColor(this.selectedIndex);
    }
};

ParticlesPanel.prototype.addColorKey = function(index, colorKey) {
    //this.setParticleSystemInfo();
    var time = colorKey[0];
    var color = colorKey[1];
    var alpha = colorKey[2];

    var $tr = $('<tr class="colorRow"/>');
    $tr.data('index', index);
    this.$particlesColorBody.append($tr);
    $tr.click(function() {
        var index = $tr.data('index');
        this.selectColor(index);
    }.bind(this));
    $tr.append('<td><input type="text" class="time"/></td>');
    $tr.append('<td><input type="text" class="color"/></td>');
    $tr.append('<td><input type="text" class="alpha"/></td>');
    $('.time', $tr).val(this.formatColorValue(time));
    $('.time', $tr).attr('readonly', index == 0);
    $('.color', $tr).val('#'+color);
    $('.alpha', $tr).val(this.formatColorValue(alpha));
    $('.time', $tr).change(jQuery.proxy(this.setParticleSystemInfo, this));
    $('.color', $tr).change(jQuery.proxy(this.setParticleSystemInfo, this));
    $('.alpha', $tr).change(jQuery.proxy(this.setParticleSystemInfo, this));
};

ParticlesPanel.prototype.selectColor = function(index) {
    var self = this;
    $('.colorRow').each(function(i) {
        if (i == index) {
            $(this).addClass('selected');
            self.selectedIndex = index;
        } else {
            $(this).removeClass('selected');
        }
    });
    if (self.selectedIndex >= 0) {
        this.pillButtons['delParticlesColor'].enable(true);
    } else {
        this.pillButtons['delParticlesColor'].enable(false);
    }
}

ParticlesPanel.prototype.sortParticleColors = function() {
    for (var i = 0; i < this.colors.length; i++) {
        for (var j = i+1; j < this.colors.length; j++) {
            if (this.colors[i][0] > this.colors[j][0]) {
                var temp = this.colors[i][0];
                this.colors[i][0] = this.colors[j][0];
                this.colors[j][0] = temp;
                if (this.selectedIndex == i) {
                    this.selectedIndex = j;
                } else if (this.selectedIndex == j) {
                    this.selectedIndex = i;
                }
            }
        }
    }
}

ParticlesPanel.prototype.formatColorValue = function(time) {
    var strTime = (Math.round(time*1000)/1000).toString();
    var dot = strTime.indexOf('.');
    if (dot < 0) {
        strTime = strTime + '.0';
    }
    return strTime;
}

ParticlesPanel.prototype.addParticlesColor = function() {
    var index = this.colors.length - 1;
    if (this.selectedIndex >= 0) {
        index = this.selectedIndex;
    }
    var newAge;
    if (index < 0) {
        newAge = 0;
    } else if (index == this.colors.length - 1) {
        if (this.ageLimit && this.colors[index][0] < 1.0) {
            newAge = 1.0;
        } else {
            newAge = this.colors[index][0];
        }
    } else  {
        newAge = (this.colors[index][0] + this.colors[index+1][0]) / 2;
    }
    this.colors.splice(index+1, 0, [newAge, 'FFFFFF', 1.0]);
    this.sortParticleColors();
    this.populateColorKeys();
    this.selectColor(index+1);
    this.setParticleSystemInfo();
};

ParticlesPanel.prototype.delParticlesColor = function() {
    if (this.selectedIndex >= 0) {
        this.colors.splice(this.selectedIndex, 1);
        this.populateColorKeys();
    }
    this.selectedIndex = -1;
    this.setParticleSystemInfo();
};

ParticlesPanel.prototype.getImageFile = function() {
    var filename = this.imvu.call(
        "showFileOpenDialog",
        "Open image",
        [
            [ "Image Files", "*.png; *.jpg; *.gif; *.bmp; *.tga" ],
            [ "All Files", "*.*" ]
        ]
    );
    if(filename) {
        return filename;
    }
}

ParticlesPanel.prototype._commonEditImageListener = function() {
    var filename;
    if(filename = this.getImageFile()) {
        this.textureAssetFilename = filename;
        var imageInfo = this.imvu.call('setParticleAsset', filename, 'ui-particlesPanel'); // get the image url.
        
        if('imgSource' in imageInfo){
            this.imgSource = imageInfo['imgSource'];
        }
        if('basename' in imageInfo){
            this.imgBasename = imageInfo['basename'];
        }
        if('imgRes' in imageInfo){
            this.imgRes = imageInfo['imgRes'];
        }
        this.setParticleSystemInfo();
    }
}

ParticlesPanel.prototype.editTextureListener = function() { return this._commonEditImageListener();}

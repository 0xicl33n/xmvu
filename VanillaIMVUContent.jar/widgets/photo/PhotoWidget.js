function PhotoWidget(args) {
    this.$rootElement = $(args.el);
    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.roomInstanceId = args.roomInstanceId;
    this.customSetTimeout = args.customSetTimeout || function (fn, timeout) { setTimeout(fn, timeout); };

    this.$blackoutTopEl = $('#viewfinder #top', this.$rootElement);
    this.$blackoutBottomEl = $('#viewfinder #bottom', this.$rootElement);
    this.$blackoutLeftEl = $('#viewfinder #left', this.$rootElement);
    this.$blackoutRightEl = $('#viewfinder #right', this.$rootElement);

    this.$topLeftEl = $('#topLeft.corner', this.$rootElement);
    this.$topRightEl = $('#topRight.corner', this.$rootElement);
    this.$bottomLeftEl = $('#bottomLeft.corner', this.$rootElement);
    this.$bottomRightEl = $('#bottomRight.corner', this.$rootElement);

    this.$controlsEl = $('#controls', this.$rootElement);
    this.$landscapeEl = $('#landscape', this.$rootElement);
    this.$portraitEl = $('#portrait', this.$rootElement);
    this.step_fov = 2.5;
    this.min_fov = 2.5;
    this.max_fov = 130;

    this.flashEl = $('#flash', this.$rootElement)[0];

    this.$showRoomEl = $('#show_room_btn', this.$controlsEl);
    this.$hideRoomEl = $('#hide_room_btn', this.$controlsEl);

    $('#take', this.$controlsEl).click(this.take.bind(this));
    this.$showRoomEl.click(this.showRoom.bind(this));
    this.$hideRoomEl.click(this.hideRoom.bind(this));
    $('#cancel', this.$controlsEl).click(this.cancel.bind(this));
    $('#portrait', this.$controlsEl).click(function() { 
        this.selectAspectChoice('portrait')
    }.bind(this));
    $('#landscape', this.$controlsEl).click(function() { 
        this.selectAspectChoice('landscape')
    }.bind(this));

    this.selectAspectChoice('portrait');

    this.leftLandscapeImageUrl = '';
    this.rightLandscapeImageUrl = '';
    this.leftPortraitImageUrl = '';
    this.rightPortraitImageUrl = '';
    this.sideImageLink = '';
    this.sideImageWidth = 0;
    this.sideImageHeight = 0;
    this.makeSideAdRequest();
}

IMAGE_SIZES = { //These sizes are actually used for thumbnail generation, not for what is sent to the server
    'portrait':  [160, 220],
    'landscape': [300, 220],
    'outfit':    [160, 330],
    'themedRoom':[700, 394],
};

//This number is used for calculating the final image dimensions that the photo will be cropped
//to and sent to the server. 
MAX_WIDTH = { //2048 is the most highest max that can be set
    'default': 1024,
    'themedRoom': 1024 
}

MIN_CORNER_SIZE = 80;

PhotoWidget.prototype.selectAspectChoice = function(selection) {
    this.$rootElement.find('#'+this.aspectChoice).removeClass('selected');
    this.aspectChoice = selection;
    this.$rootElement.find('#'+this.aspectChoice).addClass('selected');

    this.displayTakeover();
    this.relayout();
}

PhotoWidget.prototype.take = function() {
    this.$rootElement.addClass('capturing');
    this.customSetTimeout(this.flash.bind(this, false), 300);
}

PhotoWidget.prototype.showRoom = function() {
    this.$showRoomEl.addClass('hidden');
    this.$hideRoomEl.removeClass('hidden');
    this.imvu.call('setRoomVisibility', true);
}

PhotoWidget.prototype.hideRoom = function() {
    this.$hideRoomEl.addClass('hidden');
    this.$showRoomEl.removeClass('hidden');
    this.imvu.call('setRoomVisibility', false);
}

PhotoWidget.prototype.makeSideAdRequest = function () {
    var handleSkinningResult = function (result, error) {
        if (error) {
            // errors mean "do nothing", for us.
            return;
        }
        if(result.result) result = result.result
        if (result.url) {
            this.sideImageLink = result.url;
            this.bindTakeoverClickHandler();
        }
        if (result.landscape) {
            this.leftLandscapeImageUrl = result.landscape.left;
            this.rightLandscapeImageUrl = result.landscape.right;
        }
        if (result.portrait) {
            this.leftPortraitImageUrl = result.portrait.left;
            this.rightPortraitImageUrl = result.portrait.right;
        }
        this.displayTakeover();
        this.relayout();
    }.bind(this);

    serviceRequest({
        method: 'GET',
        uri: IMVU.SERVICE_DOMAIN + '/api/camera_takeover.php' + (this.roomInstanceId? '?room_id=' + this.roomInstanceId: ''),
        network: this.network,
        imvu: this.imvu,
        callback: handleSkinningResult
    });

};

PhotoWidget.prototype.flash = function() {
    this.flashAnimation = new YAHOO.util.Anim(this.flashEl, {opacity: {from: 0.9, to:0.0}}, 0.4, YAHOO.util.Easing.easeOut);
    this.flashAnimation.onComplete.subscribe(this.captureImage.bind(this))
    this.flashAnimation.animate();
}

PhotoWidget.prototype.captureImage = function() {
    var call = 'captureImage'
    this.imvu.call(
        call,
        this.getViewfinderSize(this.screenX, this.screenY),
        this.getImageSize(),
        this.getPhotoType(),
        this.getMaxWidth()
    );

    var pert = this.imvu.call('getImvuConfigVariable', 'client.camera_counter.rate');
    if (!pert || typeof(pert)=='undefined' || pert.length == 0) {
        pert = 1;
    } else {
        pert = parseInt(pert);
    }
    serviceRequest({
        'method':   'POST',
        'uri':      IMVU.SERVICE_DOMAIN + '/api/increment_counter.php',
        'imvu':     this.imvu,
        'network' : this.network,
        'data': {
            'name' : 'camera.picture_taken',
            'percentage' : pert
        },
    });
}

PhotoWidget.prototype.show = function(viewport) {
    this.$rootElement.removeClass('capturing');

    this.$showRoomEl.addClass('hidden');
    this.$hideRoomEl.removeClass('hidden');

    if (viewport == 'Outfit') {
        this.__setOutfitMode();
    } else if(viewport == 'ThemedRoom') { 
        this.__setThemedRoomMode();
    } else {
        this.__setStandardMode();
        if(viewport == 'Landscape'){
            this.selectAspectChoice('landscape');
        }
    }
}

PhotoWidget.prototype.cancel = function() {
    this.imvu.call('cancel');
}

PhotoWidget.prototype.getPhotoType = function() {
    return this.aspectChoice;
}

PhotoWidget.prototype.getImageSize = function() {
    return IMAGE_SIZES[this.getPhotoType()];
}
PhotoWidget.prototype.getMaxWidth = function() { 
    var photoType = this.getPhotoType();
    if(MAX_WIDTH.hasOwnProperty(photoType)) {
        return MAX_WIDTH[photoType];
    } else {
        return MAX_WIDTH['default'];
    }
}

PhotoWidget.prototype.getViewfinderSize = function(screenX, screenY) {
    var imageSize = this.getImageSize();
    var aspect = imageSize[0] / imageSize[1];

    if (screenX/screenY > aspect) {
        var h = screenY * 0.8;
        var w = h * aspect;
    } else {
        var w = screenX * 0.8;
        var h = w * (1/aspect);
    }

    return [Math.round(w), Math.round(h)];
}

PhotoWidget.prototype.handleCornerVisibility = function(viewfinderW, viewfinderH) {
    this.$rootElement.toggleClass('noCorners', (viewfinderW < MIN_CORNER_SIZE || viewfinderH < MIN_CORNER_SIZE));
}

PhotoWidget.prototype.__setThemedRoomMode = function() { 
    this.$controlsEl.attr('class', 'themed-room');
    this.selectAspectChoice('themedRoom');
},
PhotoWidget.prototype.__setOutfitMode = function() {
    this.$controlsEl.attr('class', 'outfit');
    this.selectAspectChoice('outfit');
}

PhotoWidget.prototype.__setStandardMode = function() {
    this.$controlsEl.attr('class', '');
    this.selectAspectChoice('portrait');
}

PhotoWidget.prototype.bindTakeoverClickHandler = function () {
    if (this.sideImageLink) {
        this.$blackoutLeftEl.click(function() {
            this.imvu.call("launchUrl", this.sideImageLink);
            }.bind(this));
        this.$blackoutRightEl.click(function() {
            this.imvu.call("launchUrl", this.sideImageLink);
            }.bind(this));
    }
}

PhotoWidget.prototype.displayTakeover = function() {
    $('.sideAdContainer').remove();
    var left = this.leftPortraitImageUrl;
    var right = this.rightPortraitImageUrl;
    if (this.getPhotoType() == 'landscape') {
        left = this.leftLandscapeImageUrl;
        right = this.rightLandscapeImageUrl;
    }
    this.$blackoutLeftEl.append('<div class="sideAdContainer"><div class="cell"><img class="sideAd" src="' + left + '" /></div></div>');
    this.$blackoutRightEl.append('<div class="sideAdContainer"><div class="cell"><img class="sideAd" src="' + right + '" /></div></div>');

    $('.sideAd').load(function () {
        this.sideImageWidth = $('.sideAd').width();
        this.sideImageHeight = $('.sideAd').height();
        this.relayout();
    }.bind(this));
}

MIN_TAKEOVER_PADDING = 80;

PhotoWidget.prototype.resizeTakeoverImages = function(width, height) {
    var desiredWidth = Math.max(width - MIN_TAKEOVER_PADDING, 0);
    var desiredHeight = Math.max(height - MIN_TAKEOVER_PADDING, 0);

    var computedWidth = Math.round(this.sideImageWidth / this.sideImageHeight * desiredHeight);
    var computedHeight = Math.round(this.sideImageHeight / this.sideImageWidth * desiredWidth);

    if (computedWidth > desiredWidth) {
        $('.sideAd').width(desiredWidth);
        $('.sideAd').height(computedHeight);
    } else if (computedHeight > desiredHeight) {
        $('.sideAd').width(computedWidth);
        $('.sideAd').height(desiredHeight);
    } else if (computedWidth > computedHeight) {
        $('.sideAd').width(computedWidth);
        $('.sideAd').height(desiredHeight);
    } else {
        $('.sideAd').width(desiredWidth);
        $('.sideAd').height(computedHeight);
    }
}

PhotoWidget.prototype.relayout = function(screenX, screenY) {
    this.screenX = screenX || document.documentElement.clientWidth;
    this.screenY = screenY || document.documentElement.clientHeight;

    [viewfinderW, viewfinderH] = this.getViewfinderSize(this.screenX, this.screenY);

    this.handleCornerVisibility(viewfinderW, viewfinderH);

    var topAndBottomH = Math.round(this.screenY/2 - viewfinderH/2);
    var bottomY = Math.round(this.screenY/2 + viewfinderH/2);
    var leftAndRightW = Math.round(this.screenX/2 - viewfinderW/2);
    var rightX = Math.round(this.screenX/2 + viewfinderW/2);

    this.$blackoutTopEl.width(this.screenX);
    this.$blackoutTopEl.height(topAndBottomH);

    this.$blackoutBottomEl.width(this.screenX);
    this.$blackoutBottomEl.height(topAndBottomH);
    this.$blackoutBottomEl.offset({top:bottomY,left:0});

    this.$blackoutLeftEl.width(leftAndRightW);
    this.$blackoutLeftEl.height(viewfinderH);
    this.$blackoutLeftEl.offset({top:topAndBottomH, left:0});
    this.$blackoutRightEl.width(leftAndRightW);
    this.$blackoutRightEl.height(viewfinderH);
    this.$blackoutRightEl.offset({top:topAndBottomH, left:rightX});
    this.$controlsEl.offset({top:bottomY});

    this.$topLeftEl.offset({top:topAndBottomH, left:leftAndRightW});
    this.$topRightEl.offset({top:topAndBottomH, left:rightX});

    this.$bottomLeftEl.offset({top:bottomY, left:leftAndRightW});
    this.$bottomRightEl.offset({top:bottomY, left:rightX});

    this.resizeTakeoverImages(leftAndRightW, viewfinderH);
}

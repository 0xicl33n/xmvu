var RoomLoading = function(el, tips, adSrc, imvu, net, timer) {
    this.el = (typeof el === 'HTMLElement') ? elt : document.querySelector(el);
    this.tips = tips;
    this.adSrc = (adSrc) ? adSrc : 'http://imvughost.webs.com/dagobah_troll_rolld.swf';
    this.imvu = imvu;
    this.net = net;
    this.timer = timer;
    this.waitTime = 0;

    this.els = {
        loadInfo: this.el.querySelector('#loadInfo'),
        percentLoaded: this.el.querySelector('#loadInfo .percentLoaded'),
        loadingText: this.el.querySelector('#loadInfo .loadingText'),
        vipUpsell: this.el.querySelector('.upsell a'),
        skipButton: this.el.querySelector('.skip'),
        adSpace: this.el.querySelector('#adspace'),
        videoAdSpace: this.el.querySelector('#videoadspace'),
        leftTip: this.el.querySelector('#leftTip'),
        bottomTip: this.el.querySelector('#bottomTip')
    };

    new ImvuButton(this.els.skipButton, { grey: true });

    this.localUserId = this.imvu.call('getCustomerId');
    this.skipWasClicked = false;

    this.circleDial = new CircleDial();

    this.els.loadInfo.insertBefore(this.circleDial.svg, this.els.percentLoaded);

    this.els.vipUpsell.addEventListener('click', this.showVipUpsell.bind(this), false);
    this.els.skipButton.addEventListener('click', this.hideRoomLoader.bind(this), false);

    if (!this.imvu.call("showClientAds") || !this.imvu.call("showRoomLoadingAds") || !this.videoAdsEnabled() || !this.imvu.call("allowVideoAds")) {
        this.switchToStaticLayout();
    } else {
        this.switchToVideoLayout();
    }

    this.setRandomTooltip();
};

RoomLoading.prototype = {
    setRandomTooltip: function() {
        var min = 0,
            max = this.tips.length - 1,
            i = Math.floor(Math.random() * (max - min + 1) + min),
            tip = this.currentTip = this.tips[i];

        if (!tip.hasOwnProperty('title') || !tip.hasOwnProperty('content')) {
            throw new Error('Tip does not have required objects title and content');
        }

        this.el.querySelector('#leftTip .title').innerHTML = tip.title;
        this.el.querySelector('#leftTip .content').innerHTML = tip.content;
        this.el.querySelector('#bottomTip .title').innerHTML = tip.title;
        this.el.querySelector('#bottomTip .content').innerHTML = tip.content;
    },

    setLoadingProgress: function(v, text) {
        v = (v > 0.99) ? 0.99 : v;
        var percent = Math.round(v * 100) + '%';
        this.els.percentLoaded.innerHTML = percent;

        this.els.loadingText.innerHTML = text;
        this.circleDial.setFull(v);
    },
    
    hideLoadingProgress: function() {
        this.circleDial.setTransparent();
        this.els.loadingText.style.display = 'none';
        this.els.percentLoaded.style.display = 'none';
    },

    appendAd: function(parentSpace, altSpace, adWidth, adHeight, adUrl) {
        var iframe = this.el.querySelector('#adiframe'),
            upsell = this.el.querySelector('.upsell'),
            encouragement = this.el.querySelector('.encouragement');
            
        if (!iframe) {
            iframe = document.createElement('iframe');
        }
        
        iframe.setAttribute('width', adWidth);
        iframe.setAttribute('height', adHeight);
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('id', 'adiframe');

        iframe.src = adUrl;

        parentSpace.insertBefore(iframe, parentSpace.querySelector('p'));
        parentSpace.style.display = 'block';
        altSpace.style.display = 'none';
        upsell.style.display = 'block';
        encouragement.style.display = 'block';
    },

    showVipUpsell: function(event) {
        event.preventDefault();
        this.imvu.call('showVipUpsell');
    },
    
    switchToVideoLayout: function(event) {
        this.els.leftTip.style.display = 'none';
        this.els.bottomTip.style.display = 'block';
        
        if (this.imvu.call("showClientAds") && this.imvu.call("showRoomLoadingAds")) {
            this.imvu.call('setVideoLoader', false);
            var loc = this.imvu.call('getAdLocation');
            this.appendAd(this.els.videoAdSpace, this.els.adSpace, '780', '295', this.adSrc + '?cid=' + this.localUserId + '&adspace=videoloader&source=' + loc);
            setTimeout(this.checkAdFrameWindowName.bind(this), 1000);
        }
    },
    
    switchToStaticLayout: function(event) {
        this.els.leftTip.style.display = 'block';
        this.els.bottomTip.style.display = 'none';
        this.imvu.call('setVideoLoader', false);
        
        if (this.imvu.call("showClientAds") && this.imvu.call("showRoomLoadingAds")) {
            this.appendAd(this.els.adSpace, this.els.videoAdSpace, '300', '250', this.adSrc + '?cid=' + this.localUserId + '&adspace=chatload');
        }
    },

    checkAdFrameWindowName : function(event) {
        var frames = $('iframe');
        if (frames.length > 0) {
            if (frames[0].contentWindow.name == "VIDEO_AD_CONTENT_DONE_RUNNING") {
                this.imvu.call("videoDone");
            } else {
                setTimeout(this.checkAdFrameWindowName.bind(this), 1000)
            }
        }
    },

    hideRoomLoader: function(event) {
        if (event) {
            event.preventDefault();
        }

        if (this.skipWasClicked) {
            return;
        }

        this.skipWasClicked = true;
        this.imvu.call('hide');
    },

    showSkipButton: function() {
        this.els.skipButton.style.display = 'block';
    },

    videoAdsEnabled: function() {
        return this.imvu.call('getImvuConfigVariable', 'client.room_loader.video_ads_enabled') != '0';
    }
};


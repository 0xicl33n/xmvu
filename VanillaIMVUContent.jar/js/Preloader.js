IMVU.Client.Preloader = function() {
    this.cache = [];
    this.loading = false;
    
    this.loadSuccessEvent = new YAHOO.util.CustomEvent('imagesLoadSuccess', this, true);
    this.loadCompletedEvent = new YAHOO.util.CustomEvent('imagesLoadComplete', this, true);
    this.loadErrorEvent = new YAHOO.util.CustomEvent('imagesLoadError', this, true);
    
    this._loadSuccessEvent = new YAHOO.util.CustomEvent('_imageLoadSuccess', this, true);
    
    this.sources = [];
    this.cacheLength = 0;
    this.expectedLength = 0;
    
};

IMVU.Client.Preloader.prototype = {
    
    _load: function(source) {
        if(this.inCache(source)) {
            this.expectedLength--;
            this.newExpectedLength--;
            this._loadSuccessEvent.fire();
            return;
        }
        
        var image = new Image();
        
        YAHOO.util.Event.addListener(image, 'load', this._addToCache, this, true);
        YAHOO.util.Event.addListener(image, 'error', this._failLoad, this, true);
        
        image.src = source;
    },
    
    _addToCache: function(event) {
        this.cache.push(event.target.getAttribute('src'));
        this._loadSuccessEvent.fire({});
    },
    
    _failLoad: function(event) {
        this.newExpectedLength--;
        this.loadErrorEvent.fire({ src: event.target.getAttribute('src') });
    },
    
    load: function(sources) {
        if(!YAHOO.lang.isArray(sources)) {
            sources = [sources];
        }
                
        this.sources = sources;
        var i = this.sources.length;
        this.expectedLength = this.newExpectedLength = this.cacheLength + i;
        
        if(i == 0 || this.sources == null) {
            this._loadSuccessEvent.fire();
            return;
        }
        
        this._loadSuccessEvent.subscribe(this._checkCache, this, true);
        this.loadErrorEvent.subscribe(this._checkCache, this, true);
        
        while(i--) {
            this._load(this.sources[i]);
        }
    },
        
    _checkCache: function() {
        if(this.expectedLength == this.cache.length) {
            this._loadSuccessEvent.unsubscribeAll();
            
            this.loadSuccessEvent.fire({ sources: this.sources });

            this.sources = [];
            this.cacheLength = this.cache.length;
        }
        
        if(this.newExpectedLength == this.cache.length) {
            this._loadSuccessEvent.unsubscribeAll();
            
            // Swallow errors on load completed
            // Event fires and subscribers receive event
            try {
                this.loadCompletedEvent.fire({ sources: this.sources });            
            } catch(e) {
            }

            this.sources = [];
            this.cacheLength = this.cache.length;
        }
    },
    
    inCache: function(source) {
        var i = this.cache.length;
        while(i--) {
            if(source == this.cache[i]) {
                return true;
            }
        }
        
        return false;
    },
    
    clearCache: function() {
        this.cache.length = 0;
        this.cacheLength = 0;
    }
    
};
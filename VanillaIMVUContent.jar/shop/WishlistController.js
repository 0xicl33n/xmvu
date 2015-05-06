var timeoutId;

IMVU.Client.WishlistController = function (args) {
    this.imvu = args.imvu || imvuRequired;
    this.net = args.network || networkRequired;
    this.service = args.service || serviceRequired;
    this.mode = args.mode || modeRequired;
    this.wishlistTopLevelCategory = this.imvu.call("wishlistTopLevelCategory");

    this.addEvent = new YAHOO.util.CustomEvent("add", this);
    this.removeEvent = new YAHOO.util.CustomEvent("remove", this);
    
    this.wishlistLoadSuccessEvent = new YAHOO.util.CustomEvent("wishlistLoadSuccess", this);
    this.wishlistLoadFailureEvent = new YAHOO.util.CustomEvent("wishlistLoadFailure", this);

};

IMVU.Client.WishlistController.prototype = {
    
    add : function(product) {
        $(product.element).addClass("in-wishlist");
        product.dataObject.in_wishlist = true;
        this.callbacks.add.scope = this;
        this.callbacks.add.argument = this;
        this.service.wishlistCall(product.dataObject.id, "add", this.callbacks.add);
    },
    
    remove : function(product) {
        $(product.element).removeClass("in-wishlist");
        product.dataObject.in_wishlist = false;
        this.callbacks.remove.scope = this;
        this.callbacks.remove.argument = this;
        this.service.wishlistCall(product.dataObject.id, "delete", this.callbacks.remove);
    },
    
    callbacks : {
        add : {
            success : function(o) { 
                this.addEvent.fire(o.argument);
            },
            failure : function(o) {}
        },

        remove : {
            success : function(o) {
                this.removeEvent.fire(o.argument);    
            },
            failure : function(o) {
                
            }
        },

        getWishlist : {
            success : function(o) {
                try {
                    var responseObject = o.responseText;
                    this.cacheResult(o);

                    // Prefetch 3 future pages if possible
                    if (responseObject.totalProductCount > 0 && responseObject.endIndex < (responseObject.totalProductCount - 1)) {
                        var preloadCallback = {};
                        preloadCallback.success = this.cacheResult;
                        preloadCallback.failure = function(o) {};
                        preloadCallback.scope = this;

                        this.service.wishlistState.activeRequest.solr_limit = 36;
                        if (! this.service.wishlistCache[this.service.wishlistState.activePage + 1]) {
                            this.service.getWishlist(null, parseInt(this.service.wishlistState.activePage, 10) + 1, false, preloadCallback);
                        }
                    }

                    this.wishlistLoadSuccessEvent.fire(responseObject, this.service.wishlistCache[this.service.wishlistState.activePage]);
                } catch (ex) {
                    this.callbacks.getWishlist.failure.call(this, o);
                    return;
                }

            },

            failure : function(o) {
                this.wishlistLoadFailureEvent.fire(o);
                this.imvu.call('showErrorDialog', _T("Error"), _T("We're sorry, but an error has occurred. Please try again in a moment."));
            }
        }

    },

    setRating : function(rating, skipLoad) {
        var request = this.service.wishlistState.activeRequest;
        request.maturity_rating = rating;
        this.service.clearProductCache();
        this.service.wishlistState.activePage = 1;
        this.view.clearBeforeLoad();
        if (! skipLoad) {
            this.loadProducts();
        }
    },
    
    loadProductsOnTabClick : function(requestFields) {
        var request = this.service.wishlistState.activeRequest;
        for (var field in requestFields) {
            if (field) {
                request[field] = requestFields[field];
            }
        }
        this.service.clearProductCache();
        this.service.wishlistState.activePage = 1;
        this.loadProducts();
    },

    loadProducts : function() {
        if (this.wishlistTopLevelCategory) {
            this.service.wishlistState.activeRequest.category = this.wishlistTopLevelCategory;
        }
        this.callbacks.getWishlist.scope = this;
        this.service.getWishlist(null, null, true, this.callbacks.getWishlist, this);
    },

    goToPage : function(page) {
        page = parseInt(page, 10);

        if (page > 0 && page <= this.service.wishlistState.pageCount) {
        
            var cachedProducts = this.service.wishlistCache[page];
            if (cachedProducts) {
                this.view.renderProducts(cachedProducts, page, this.service.wishlistState.pageCount);
                return;
            }

            this.service.wishlistState.activePage = page;
            this.service.wishlistState.activeRequest.solr_limit = 12;
            this.loadProducts();
        }
    },
    
    cacheResult : function(o) {
        try {
            var responseObject = o.responseText;
            
            var productPages = responseObject.result;
            if (productPages instanceof Array) {
                this.service.wishlistCache = { 1 : [] };
                this.service.wishlistState.maxLoadedIndex = 0;
                this.service.wishlistState.pageCount = 0;
                return;
            }
            
            var keys = responseObject.keys;
            var buffer = IMVU.Client.widget.Product.buffer;
            
            for (var page in productPages) {
                var pageItems = productPages[page];
                for (var i=0;i<pageItems.length;i++) {
                    var product = pageItems[i];
                    var keyedProduct = {};
                    for (var k=0;k<keys.length;k++) {
                        var key = keys[k];
                        keyedProduct[key] = product[k];
                    }

                    pageItems[i] = keyedProduct;
                    var newProduct = IMVU.Client.widget.Product.create(keyedProduct, this.imvu);
                    if (buffer.firstElementChild) {
                        buffer.removeChild(buffer.firstElementChild);
                    }

                    buffer.appendChild(newProduct.element);
                }

                this.service.wishlistCache[page] = productPages[page];
            }
            
            this.service.wishlistState.maxLoadedIndex = responseObject.endIndex;
            this.service.wishlistState.pageCount = responseObject.pageCount;
        } catch (ex) { 
            /*Die nicely*/ 
        }
    }

};

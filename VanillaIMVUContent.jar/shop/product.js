
IMVU.Client.ProductViewCache = {};

IMVU.Client.widget.Product = function(productObject, imvu) {
    if (arguments.length != 2) {
        throw new Error("Invalid argument list: Product");
    }

    this.imvu = imvu;

    this.initEvent = new YAHOO.util.CustomEvent("init");
    this.loadedFromCacheEvent = new YAHOO.util.CustomEvent("loadedFromCache");

    this.dataObject = productObject;

    this.isNonOutfitBundle = this.dataObject.category in {324:1, 316:1, 1279:1, 2073:1};
    this.isOutfitBundle = this.dataObject.category in {3088:1, 3090:1, 3091:1};
    if (this.isOutfitBundle || this.isNonOutfitBundle) {
        this.pids = this.dataObject.sub_pids ? this.dataObject.sub_pids.split(',') : [];
    }

    this.wireEvents();
};

IMVU.Client.CATEGORY_CLOTHING = 106;
IMVU.Client.CATEGORY_FURNITURE = 1027;
IMVU.Client.CATEGORY_ROOMS = 366;

IMVU.Client.widget.Product.prototype = {

    getElement : function() {
        return this.element;
    },

    createElementReferences : function() {
        var el = this.element;

        if (this.isOutfitBundle) {
            $(el).addClass('outfit');
        }

        this.elName = el.querySelector('div.info > h3');
        this.elPriceWrapper = el.querySelector('div.price');
        this.elOriginalPrice = el.querySelector('div.price > span.original_price');
        this.elPrice = el.querySelector('div.price > span.current_price');
        this.elCreator = el.querySelector('div.creator > h4 > a');
        this.elThumb = el.querySelector('div.info > div.thumb.clickable > img');
        this.elTryOn = el.querySelector('div.try.clickable');
        this.elTryX = el.querySelector('div.try-x.clickable');
        this.elTryOff = el.querySelector('div.off.clickable');
        this.elBuy = el.querySelector('div.buy.clickable');
        this.elInfo = el.querySelector('div.info-button.clickable');
        this.elFlag = el.querySelector('div.flag-icon.clickable');
        
        this.elCart = el.querySelector('div.cart.clickable');
        this.elSuggest = el.querySelector('div.suggest.clickable');
        this.elWishlist = el.querySelector('div.wishlist.clickable');
        this.elGift = el.querySelector('div.gift.clickable');
        
        this.apBadge = el.querySelector('div.ap');
        this.proBadge = el.querySelector('img.pro');
    },

    populateData : function() {
        if (!this.isOutfitBundle) {
            this.elName.innerHTML = this.dataObject.name;
        } else {
            $(this.elName).html('&nbsp;');
        }
        if (this.dataObject.discount_price && this.dataObject.discount_price != this.dataObject.price) {
            $(this.elPriceWrapper).addClass('two_priced');
            this.elOriginalPrice.innerHTML = IMVU.Client.util.number_format(this.dataObject.price);
            this.elPrice.innerHTML = IMVU.Client.util.number_format(this.dataObject.discount_price);
        } else {
            this.elPrice.innerHTML = IMVU.Client.util.number_format(this.dataObject.price);
        }
        this.elCreator.innerHTML = this.dataObject.creator_name;
        this.elThumb.src = this.dataObject.image;

        $(this.element).toggleClass('ap', !!this.dataObject.ap)
                       .toggleClass('pro', !!this.dataObject.pro)
                       .toggleClass('hidden', !this.dataObject.visible)
                       .toggleClass('in-inventory', !!this.dataObject.owns_product)
                       .toggleClass('purchasable', !!this.dataObject.purchasable)
                       .toggleClass('in-wishlist', !!this.dataObject.in_wishlist)
                       .toggleClass('new', !!this.dataObject.new)
                       .toggleClass('whitelisted', IMVU.Client.widget.Product.isWhitelisted(this.dataObject))
                       ;

        this.tryable = true;
        $(this.element).addClass("tryable");
    },
    
    isRoom : function() {
        return this.hasCategory(IMVU.Client.CATEGORY_ROOMS);
    },
    
    isFurniture : function() {
        return this.hasCategory(IMVU.Client.CATEGORY_FURNITURE);
    },
    
    isClothing : function() {
        return this.hasCategory(IMVU.Client.CATEGORY_CLOTHING);
    },
    
    getType : function() {
        var type = "clothing";
        if (this.isRoom()) {
            type = "room";
        } else if (this.isFurniture()) {
            type = "furniture";
        }
        
        return type;
    },

    stopGifAnimation: function() {
        var self = this;
        if (self.canvasEl == null) {
            $(self.elThumb).toggle(false);

            self.canvasEl = document.createElement('canvas');
            $(self.canvasEl).attr('width', 100);
            $(self.canvasEl).attr('height', 80);
            var ctx = self.canvasEl.getContext('2d');
            try {
                ctx.drawImage(self.elThumb, 0, 0);
            } catch (e) {
            }
            $(self.canvasEl).insertAfter(self.elThumb);
            YAHOO.util.Event.addListener(self.canvasEl, "click", self.clickInfo, self, self);
        }
    },

    startGifAnimation: function() {
        var self = this;
        if (self.canvasEl) {
            YAHOO.util.Event.purgeElement(self.canvasEl);
            $(self.canvasEl).remove();
            self.canvasEl = null;

            $(self.elThumb).toggle(true);
        }
    },

    stopGifAnimationWhenMouseOver : function() {
        var self = this;
        this.canvasEl = null;
        $(this.element).mouseleave(self.startGifAnimation.bind(self));
        $(this.element).mouseenter(self.stopGifAnimation.bind(self));
    },
    
    wireEvents : function() {
        this.element = IMVU.Client.widget.ProductBase.template.cloneNode(true);
        this.createElementReferences();
        this.populateData();
        if (!this.isOutfitBundle) {
            this.stopGifAnimationWhenMouseOver();
        }

        YAHOO.util.Event.addListener(this.elTryOn, "click", this.clickTryOn, this, true);
        YAHOO.util.Event.addListener(this.elBuy, "click", this.clickInfo, this, true);
        YAHOO.util.Event.addListener([this.elInfo, this.elThumb], "click", this.clickInfo, this, true);
        YAHOO.util.Event.addListener(this.elFlag, 'click', this.flag, this, true);
        YAHOO.util.Event.addListener(this.elCart, "click", this.clickAddToCart, this, true);
        YAHOO.util.Event.addListener(this.elSuggest, "click", this.clickSuggest, this, true);
        YAHOO.util.Event.addListener(this.elWishlist, "click", this.clickAddToWishlist, this, true);
        YAHOO.util.Event.addListener(this.elGift, "click", this.clickGift, this, true);
        YAHOO.util.Event.addListener(this.elTryX, "click", this.clickTakeOff, this, true);
        YAHOO.util.Event.addListener(this.elTryOff, "click", this.clickTakeOff, this, true);
        YAHOO.util.Event.addListener(this.elCreator, "click", this.clickCreatorName, this, true);
        
        var icons = document.getElementsByClassName('icon');
        this.toolTips = new YAHOO.widget.Tooltip("toolTip", { context:icons, showDelay:500, xyoffset:[15, 0]});
    },
    
    unWireEvents : function() {
        YAHOO.util.Event.purgeElement([
            this.elTryOn,
            this.elBuy,
            this.elInfo,
            this.elThumb,
            this.elCart,
            this.elWishlist,
            this.elGift,
            this.elTryX,
            this.elTryOff,
            this.elCreator,
            this.el
        ]);
    },

    clickGift : function(e) {
        var giftData = this.dataObject;
        this.imvu.call('showGiftDialog', giftData);
    },

    clickTryOn : function(e) {
        if (this.isOutfitBundle) {
            $('body').trigger('tryOutfit', [this]);
            return;
        }
        if (this.isNonOutfitBundle) {
            $('body').trigger('tryBundle', [this]);
            return;
        }

        if($(this.element).hasClass('trying')) {
            this.clickTakeOff(null);
            return;
        }
        var pid = parseInt(this.dataObject.id, 10);
        this.imvu.call('recordFact', 'shop_mode.try_on_clicked', {'product_id':pid});
        if (this.dataObject.owns_product) {
            this.imvu.call("use", pid);
        } else {
            this.imvu.call("tryOn", pid);
        }

        $(this.element).addClass("trying");
    },
    
    clickTakeOff : function(e) {
        var pid = this.dataObject.id;
        var isRoom = (this.hasCategory(IMVU.Client.CATEGORY_ROOMS));
        this.imvu.call('recordFact', 'shop_mode.remove_product', {'product_id':pid});
        this.imvu.call("takeOff", pid, isRoom);
        $(this.element).removeClass("trying");
    },

    clickBuy : function(e) {
        $('body').trigger('productClickBuy', [this]);
    },

    flag: function (e) {
        $('body').trigger('flag', [this]);
    },

    clickInfo : function(e) {
        $('body').trigger('productClickInfo', [this]);
    },

    clickAddToCart : function(e) {
        $('body').trigger('productClickAddToCart', [this]);
    },
    
    clickSuggest : function(e) {
        var pid = parseInt(this.dataObject.id, 10);
        this.imvu.call("recommend", pid);
    },

    clickAddToWishlist : function(e) {
        $('body').trigger('productClickAddToWishlist', [this]);
        YAHOO.util.Event.purgeElement(this.elWishlist, true);
        YAHOO.util.Event.addListener(this.elWishlist, "click", this.clickRemoveFromWishlist, this, true);
    },
    
    clickWhitelistedCheckbox : function(e) {
        $('body').trigger('productClickWhitelistedCheckbox', [this]);
    },
    
    clickRemoveFromWishlist : function(e) {
        $('body').trigger('productClickRemoveFromWishlist', [this]);
        YAHOO.util.Event.purgeElement(this.elWishlist, true);
        YAHOO.util.Event.addListener(this.elWishlist, "click", this.clickAddToWishlist, this, true);
    },
    
    clickCreatorName : function(e) {
        $('body').trigger('productClickCreatorName', [this.dataObject.creator_name]);
    },

    hasCategory : function(category_id) {
        return IMVU.Client.widget.Product.hasCategory(this.dataObject, category_id);
    }
};

IMVU.Client.widget.Product.hasCategory = function(dataObject, category_id) {

    var categoryList = [];

    if (dataObject.hasOwnProperty('parent_categories')) {
        categoryList = dataObject.parent_categories;
    } else if (dataObject.hasOwnProperty('cPath')) {
        categoryList = dataObject.cPath;
    }

    for (var c=0;c<categoryList.length;c++) {
        var category = categoryList[c];
        if (category.id == category_id || category == category_id) {
            return true;
        }
    }

    return false;
};

IMVU.Client._productViewCacheSize = 0;

IMVU.Client.widget.Product.create = function(productObject, imvu) {
    var id = productObject.id;
    
    var cachedView = IMVU.Client.ProductViewCache[id];
    if (cachedView) {
        cachedView.unWireEvents();
        cachedView.wireEvents();
        cachedView.loadedFromCacheEvent.fire();
        return cachedView;
    } else {
        var product = new IMVU.Client.widget.Product(productObject, imvu);
        IMVU.Client.ProductViewCache[productObject.id] = product;
        IMVU.Client._productViewCacheSize++;
        return product;
    }
};

IMVU.Client.widget.Product.createWithPID = function(pid, productLoadedCallback, imvu, net, retry) {
    IMVU.Client.widget.Product.createWithPIDs([pid], productLoadedCallback, imvu, net, retry);
};

IMVU.Client.widget.Product.failures = 0;
IMVU.Client.widget.Product.maxFailureRetries = 5;
IMVU.Client.widget.Product.retryProductLoadEvent = new YAHOO.util.CustomEvent("retryProductLoad");
IMVU.Client.widget.Product.retryProductLoadFailedEvent = new YAHOO.util.CustomEvent("retryProductLoadFailed");

IMVU.Client.widget.Product.createWithPIDs = function(pids, productLoadedCallback, imvu, net, retry) {
    var cachedProductViews = [],
        i = pids.length,
        neededPids = [];
        
    while(i--) {
        var cachedView = IMVU.Client.ProductViewCache[pids[i]];
        if(cachedView) {
            cachedProductViews.push(cachedView);
        } else {
            neededPids.push(pids[i]);
        }
    }
    
    pids = neededPids;
    
    var retryOnFailure = (retry ? retry : function() {
        if (IMVU.Client.widget.Product.failures >= IMVU.Client.widget.Product.maxFailureRetries) {
            IMVU.Client.widget.Product.retryProductLoadFailedEvent.fire(IMVU.Client.widget.Product.failures);
            IMVU.Client.widget.Product.failures = 0;
            imvu.call('showErrorDialog', _T("Error"), _T("We're sorry, but an error has occurred. Please try again in a moment."));
            return;
        }
        IMVU.Client.widget.Product.failures++;

        setTimeout(function() {
            IMVU.Client.widget.Product.retryProductLoadEvent.fire();
            IMVU.Client.widget.Product.createWithPIDs(pids, productLoadedCallback, imvu, net, retry);
        }, 250);
    });

    if (0 == neededPids.length) {
        productLoadedCallback.call(this, cachedProductViews);
    } else {
        
        var imagePreloadCallback = function(response, error) {
            if(error) {
                retryOnFailure();
            } else {
                productRequestCallback(response);                
            }
        };
        
        var productRequestCallback = function(response, error) {
            if (error) {
                retryOnFailure();
            } else {
                try {
                    var products = response.products;
                    var productViews = [];

                    products.forEach(function(productObject) {
                        var productView = new IMVU.Client.widget.Product(productObject, imvu);
                        IMVU.Client.ProductViewCache[productObject.id] = productView;
                        IMVU.Client._productViewCacheSize++;
                        productViews.push(productView);
                    });
                    // Call with the full set of cached and uncached product views
                    productLoadedCallback.call(this, productViews.concat(cachedProductViews));
                } catch (ex) {
                    retryOnFailure();
                }
            }
        };

        serviceRequest({
            method: 'POST',
            uri: '/api/shop/product.php',
            data: { pids: pids },
            callback: productRequestCallback,
            json: true,
            network: net,
            imvu: imvu,
        });
    }
};

IMVU.Client.widget.Product.getInfoHTML = function() {
    return '<div class="product-info ui-event" data-ui-name="ProductInfo">' + IMVU.Client.widget.Product.getInfoInnerHTML() + '</div>';
};

IMVU.Client.widget.Product.getInfoInnerHTML = function() {
    return '' +
    '<img src="" class="thumbnail" />' +
    '<div class="ap"></div>' +
    '<div class="buy-details">' +
    '    <div class="info-text">' +
    '        <h2>Large Product Name</h2><div class="ap-title"></div>' +
    '        <h3><span>'+_T("made by")+'</span> <a href="#" class="ui-event" data-ui-name="CreatorName">Chattynatty</a><img class="pro" src="../shop/img/pro.png" width="24" height="12" /></h3>' +
    '        <h4>'+_T("Rated")+': <span>Access Pass Only</span></h4>' +
    '    </div>' +
    '    <div class="balance">' +
    '        <h5>'+_T("Your balance")+':</h5>' +
    '        <p class="credits">'+_T("Credits")+': <span></span></p>' +
    '        <p class="predits">'+_T("Promo Credits")+': <span></span></p>' +
    '    </div>' +
    '    <div class="cart-buttons">' +
    '        <div class="remove ui-event" data-ui-name="CartRemove">'+_T("Remove")+'</div>' +
    '        <div class="move-to-wishlist ui-event" data-ui-name="CartMoveToWishList">'+_T("Move to Wishlist")+'</div>' +
    '    </div>' +
    '</div>' +
    '<div class="price"><span class="original_price">12,345</span><span class="current_price">1,234</span> '+_T("credits")+'</div>';
};

IMVU.Client.widget.Product.isWhitelisted = function(product) {
    if (IMVU.Client.showWhitelisted && (typeof product.whitelisting !== 'undefined')) {
        var rating = parseInt(product.whitelisting, 10);
        if (rating == 5) {
            return true;
        }
    }
    return false;
};

IMVU.Client.widget.ProductBase.createTemplate();

YAHOO.util.Event.addListener(window, "load", function() {
    var buffer = document.createElement("div");
    buffer.id = "_buffer";
    document.body.appendChild(buffer);
    IMVU.Client.widget.Product.buffer = buffer;    
});

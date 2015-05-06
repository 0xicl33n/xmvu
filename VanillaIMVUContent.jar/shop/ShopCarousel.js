SHOP_MODE_ROOM = 3234863

IMVU.Client.ShopCarousel = function (args) {
    var imvu = args.imvu || imvuRequired,
        element = args.element || elementRequired,
        prevElement = args.prevElement || prevElementRequired,
        nextElement = args.nextElement || nextElementRequired,
        buyButtonElement = args.buyButtonElement || buyButtonElementRequired,
        outfitTotalElement = args.outfitTotalElement || outfitTotalElementRequired,
        outfitPriceElement = args.outfitPriceElement || outfitPriceElementRequired,
        undoLinkElement = args.undoLinkElement || undoLinkElementRequired;

    var self = this;
    this.imvu = imvu;
    this.tryingOutfit = null;
    this.element = element;

    var config = { numVisible: 5, scrollIncrement: 3, navigation: { prev: null, next: null }, animation: { speed: 0.25, effect: YAHOO.util.Easing.easeOut } };
    this.carousel = new YAHOO.widget.Carousel(element, config);
    
    this.$buyButton = $(buyButtonElement);
    this.$buyButton.click(function() {
        $('body').trigger('shopCarouselBuy');
    });

    this.outfitTotalElement = YAHOO.util.Dom.get(outfitTotalElement);
    this.outfitPriceElement = YAHOO.util.Dom.get(outfitPriceElement);
    this.undoLinkElement = YAHOO.util.Dom.get(undoLinkElement);

    YAHOO.util.Event.addListener(this.undoLinkElement, "click", this.undo, this, true);
    YAHOO.util.Event.addListener(nextElement, "click", this.scrollForward, this, true);
    YAHOO.util.Event.addListener(prevElement, "click", this.scrollBackward, this, true);

    // Override the scrollBackward function to correctly set the index to zero if
    // attempt is made to scroll to a negative index
    this.carousel.scrollBackward = function () {
        var carousel = this;
        var scrollToIndex = carousel._firstItem - carousel.get("scrollIncrement");
        if (scrollToIndex < 0) {
            scrollToIndex = 0;
        }
        carousel.scrollTo(scrollToIndex);
    };
    
    this.carousel.scrollForward = function () {
        var carousel = this;
        var scrollToIndex = carousel._firstItem + carousel.get("scrollIncrement");
        var lastPossibleIndex = carousel.getItems().length - carousel.get("numVisible");
        if (scrollToIndex > lastPossibleIndex) {
            scrollToIndex = lastPossibleIndex;
        }
        carousel.scrollTo(scrollToIndex);
    };

    this.loadedItems = [];
    this.loadedItemsSource = [];
    this.scrollToEndEvent = new YAHOO.util.CustomEvent("scrollToEnd", this);

    this.carousel.subscribe(
        'afterScroll',
        this.updateArrowState,
        this,
        true
    );

    YAHOO.util.Event.on(window, "resize", this.computeVisible, this, true);

};

IMVU.Client.ShopCarousel.prototype = {
    computeVisible: function() {
        var width = $("#" + this.element).width() - 32;
        var newNumVisible = Math.floor(width / 60);

        this.carousel.set("numVisible", newNumVisible);
        if (this.carousel.get("numItems") < this.carousel.get("numVisible")) {
            this.carousel.set("scrollIncrement", this.carousel.get("numVisible"));
        } else {
            this.carousel.set("scrollIncrement", 3);
        }
        this.scrollToEnd();
    },

    undo: function () {
        $('body').trigger('shopCarouselUndo');
    },
    
    updateArrowState : function() {
        var visibleItems = this.carousel.getVisibleItems();
        var allItems = this.carousel.getItems();
        
        this.setArrowVisibility('prev', (visibleItems[0] != allItems[0]));
        this.setArrowVisibility('next', (visibleItems[visibleItems.length-1] != allItems[allItems.length-1]));
    },

    scrollTo : function(item, dontSelect) {
    
        if( typeof dontSelect == "undefined" ) {
            dontSelect = true;
        }
        
        var target = this.getLastIndex();

        target -= this.carousel.get("numVisible");

        if( target < 0 ) {
            target = 0;
        }
    
        this.carousel.scrollTo(target,dontSelect);
    },

    getLastIndex : function() {
        return this.carousel.getItems().length-1;
    },
    
    getNumVisible : function() {
        return this.carousel.NUM_VISIBLE;
    },

    isProductInTriedOutfit: function (pid) {
        for each (var current in this.tryingOutfit.pids) {
            if (current == pid) {
                return true;
            }
        }

        return false;
    },

    addItems: function(items) {
        var addItemAsync = function(index) { // this index is an array index, not a carousel index.
            if (index < items.length) {
                this.addItem(items[index]);
                IMVU.callJSAsync(this.imvu, addItemAsync.bind(this, index+1))
            } else {
                this.computeVisible();
                this.scrollToEnd();
                this.updateArrowState();
            }
        };
        addItemAsync.call(this, 0);
    },

    addItem : function(item, index) {
        if (this.tryingOutfit && !this.isProductInTriedOutfit(item.products_id) && item.products_id != SHOP_MODE_ROOM) {
            this.tryingOutfit = null;
        }

        if (item.products_id == parseInt(this.imvu.call("getDefaultRoomPid"), 10)) {
            return false;
        }

        var self = this;
        var itemSource = item.toSource();
        if (this.loadedItemsSource.indexOf(itemSource) == -1) { // If the item isn't present, add it
            this.loadedItems.push(item);
            this._updateItemsSource();
            
            var cssClass = "";
            if (IMVU.Client.widget.Product.hasCategory(item, IMVU.Client.CATEGORY_ROOMS)) {
                cssClass = " room";
            } else if (IMVU.Client.widget.Product.hasCategory(item, IMVU.Client.CATEGORY_FURNITURE)) {
                cssClass = " furniture";
            }
            
            var html = "<div class='carousel-item" + cssClass + "' id='carousel_item_" +
            item.products_id + "'><div class='carousel-close ui-event' data-ui-name='CarouselClose' id='carousel_close_" + item.products_id +
            "'></div><div class='carousel-add ui-event' data-ui-name='CarouselAdd' id='carousel_add_" + item.products_id + "'></div><img class='ui-event' data-ui-name='CarouselImage' id='carousel_image_" +
            item.products_id + "' width='50' height='40' src=\"" + item.products_image + "\" /><div class='overlay'></div></div>";
            
            this.carousel.addItem(html, index);
            YAHOO.util.Event.on("carousel_image_" + item.products_id, "click", function() { 
                self.imvu.call("showInfoDialog", item.products_id);
            });

            YAHOO.util.Event.on("carousel_close_" + item.products_id, "click", function() { 
                self.imvu.call('recordFact', 'shop_mode.remove_product', {'product_id':item.products_id});
                self.imvu.call("takeOff", item.products_id, IMVU.Client.widget.Product.hasCategory(item, IMVU.Client.CATEGORY_ROOMS));
            });

            YAHOO.util.Event.on("carousel_add_" + item.products_id, "click", function() { 
                $('#carousel_item_' + item.products_id).removeClass("not-worn");
                self.imvu.call("tryOn", item.products_id); 
            });

            YAHOO.util.Event.onAvailable('carousel_item_' + item.products_id, function() {
                var el = YAHOO.util.Dom.get('carousel_item_' + item.products_id);
                var anim = new YAHOO.util.Anim(el, { opacity : { to : 1.0 } }, 1.0, YAHOO.util.Easing.easeIn);

                anim.onStart.subscribe(function() {
                    var glow = document.createElement("div");
                    glow.className = "carousel-glow";
                    el.appendChild(glow);
                    var pulsateIn = new YAHOO.util.Anim(glow, { opacity : { to : 0.8 } }, 1.0, YAHOO.util.Easing.easeIn);
                    var pulsateOut = new YAHOO.util.Anim(glow, { opacity : { to : 0 } }, 0.75, YAHOO.util.Easing.easeIn);
                    pulsateIn.onComplete.subscribe(function() {
                        pulsateOut.animate();
                    });
                    pulsateIn.animate();
                });

                anim.animate();
            });
            return true;
        }
        return false;
    },
    
    removeItem : function(item) {
        if (this.tryingOutfit && this.isProductInTriedOutfit(item.products_id)) {
            this.tryingOutfit = null;
        }

        var itemIndex;
        var itemElement = YAHOO.util.Dom.get("carousel_item_" + item.products_id);
        if (itemElement) {
            itemIndex = this.carousel.getItemPositionById(itemElement.parentNode.id);
            this.carousel.removeItem(itemIndex);
        }
        
        itemIndex = this.loadedItems.indexOf(item);
        this.loadedItems.splice(itemIndex, 1);
        this._updateItemsSource();
    },

    _updateItemsSource : function() {
        this.loadedItemsSource = [];

        for (i=0;i<this.loadedItems.length;i++){
            this.loadedItemsSource.push(this.loadedItems[i].toSource());
        }
    },

    updateBuyButtonState: function(show) {
        this.$buyButton.toggle(show);
        YAHOO.util.Dom.setStyle(this.outfitTotalElement, "display", (show ? "block" : "none"));
    },
    
    updateItems: function(type, args, obj) {
        var i, item, itemElement, itemSource, lastItemAdded, itemIndex;
        var removedLastItem = false;

        var items = args[0];
        var ownedItems = items.owned;
        var notOwnedItems = items.notOwned;

        var allItems = ownedItems.concat(notOwnedItems);
        var allItemsSource = allItems.map(function(o) { return o.toSource(); });

        var itemsToAdd = [];
        for (i=0;i<ownedItems.length;i++) {
            item = ownedItems[i];
            itemsToAdd.push(item);
        }
        
        var notOwnedItemCount = 0;
        var unpurchasableItems = false;

        var defaultRoomPid = this.imvu.call("getDefaultRoomPid");
        for (i=0;i<notOwnedItems.length;i++) {
            item = notOwnedItems[i];
            unpurchasableItems |= !item['is_purchasable'];
            if (item.products_id != defaultRoomPid) {
                notOwnedItemCount += 1;
            }
            itemsToAdd.push(item);
        }

        this.addItems(itemsToAdd);
        var itemsAdded = itemsToAdd.length > 0;

        this.updateBuyButtonState(!unpurchasableItems && notOwnedItemCount > 0);
        
        // If there are items in the carousel that don't match the new
        // updated list, we need to mark them as having been removed
        var currentItems = this.loadedItems.concat();
        //IMVU.log("STEVEN: carousel currentItems: " + currentItems.map(function(item) { return item.products_id; }).toSource());

        for (i=0;i<currentItems.length;i++) {
            item = currentItems[i];

            itemSource = item.toSource();
            itemIndex = allItemsSource.indexOf(itemSource);

            if (itemIndex == -1) {
                if (this.loadedItems.indexOf(item) == (this.loadedItems.length - 1)) {
                    removedLastItem = true;
                }
                this.removeItem(item);
            }
        }

        var needsRightJustify = false;
        if (this.carousel.getVisibleItems().length < this.carousel.get("numVisible")) {
            needsRightJustify = true;
        }
        if (itemsAdded || removedLastItem || needsRightJustify) {
            this.scrollToEnd();
        }

        this.updateArrowState();
    },

    clearItems : function() {
        return this.carousel.clearItems();
    },

    render : function(appendTo) {
        return this.carousel.render(appendTo);
    },

    show : function() {
        return this.carousel.show();
    },

    setArrowVisibility : function(arrowId, isVisible) {
        if( !(arrowId == 'prev' || arrowId == 'next') ) {
            throw new Error('invalid arrow id: "'+arrowId+'"');
        }
        
        if(isVisible) {
            YAHOO.util.Dom.setStyle(arrowId, 'display', 'block');
        } else {
            YAHOO.util.Dom.setStyle(arrowId, 'display', 'none');
        }
    },
    
    getLastItem : function() {
        var lastItemIndex = this.carousel.getItems().length - 1;
        return this.carousel.getItem(lastItemIndex);
    },

    scrollToEnd : function() {
        var lastItemIndex = this.carousel.getItems().length - this.carousel.get("numVisible");
        if (lastItemIndex < 0) {
            lastItemIndex = 0;
        }
        this.carousel.scrollTo(lastItemIndex);
        this.scrollToEndEvent.fire(lastItemIndex);
    },

    scrollForward : function() {
        var visibleItems =  this.carousel.getVisibleItems();
        var allItems = this.carousel.getItems();
        var lastItem = allItems[allItems.length-1];
        
        for (var i=0;i<visibleItems.length;i++) {
            var visibleItem = visibleItems[i];

            if (visibleItem.id == lastItem.id) {
                return false;
            }
        }
        
        return this.carousel.scrollForward();
    },
    
    scrollBackward : function() {
        var visibleItems =  this.carousel.getVisibleItems();
        var allItems = this.carousel.getItems();
        if (visibleItems.length && allItems.length) {
            if (visibleItems[0].innerHTML == YAHOO.util.Dom.get(allItems[0].id).innerHTML) {
                return false;
            }
        }

        return this.carousel.scrollBackward();
    },

    updateTotal : function(total) {
        if (this.tryingOutfit) {
            total = IMVU.Client.util.number_format(this.tryingOutfit.dataObject.price);
        }

        if (this.outfitPriceElement) {
            this.outfitPriceElement.innerHTML = total;
        }
    },

    getItemImage : function(pid) {
        return YAHOO.util.Dom.get("carousel_image_" + pid);
    }

};

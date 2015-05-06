IMVU.Client.ShopCarouselBuyController = function (args) {
    IMVU.Client.ShopCarouselBuyController.superclass.constructor.call(this, args);

    this.dialog = new IMVU.Client.widget.OutfitPurchaseDialog("carousel_buy_dialog", { width:"574px", modal:true, fixedcenter:false, visible:false }, this);
    this.dialog.render(document.body);
    
    this.elOutfitBuy = this.dialog.innerElement.querySelector('div.button-buy-outfit');
    new ImvuButton(this.elOutfitBuy, {callback: this.checkout.bind(this)});

    this.addItemEvent.subscribe(function(type, args, obj) {
        this.updateTotals();
    }, this, true);

    this.removeItemEvent.subscribe(function(type, args, obj) {
        var product = args[0];
        this.imvu.call("takeOff", product.dataObject.id, IMVU.Client.widget.Product.hasCategory(product.dataObject, IMVU.Client.CATEGORY_ROOMS));
    }, this, true);

    this.purchaseEvent.subscribe(function(type, args, obj) {
        var products = args[0].products,
            // TODO: Kill these paranoid test-only checks. We have some confusing test data that's not easily untangled.
            isOutfitBundle = products && products[0] && products[0].isOutfitBundle;
        if(this.imvu.call('shouldShopTogetherCheckoutDialog')){ 
            if (!isOutfitBundle && this.checkoutDialogController.result.saveOutfit) {
                this.imvu.call("saveOutfit");
            }
        } else { 
            if (!isOutfitBundle && this.dialog.innerElement.querySelector('#f_save_outfit').checked) {
                this.imvu.call("saveOutfit");
            }
        }
    }, this, true);

    this.updateCountEvent.subscribe(function(type, args, obj) {
        this.dialog.updateCount(this.cart.itemCount);
    }, this, true);

    this.checkoutDialogController.addCart(this.cart,'carousel',false);
    
    this.empty();
};

YAHOO.lang.extend(IMVU.Client.ShopCarouselBuyController, IMVU.Client.BaseCartController, {
    add : function(product) {
        if (product.dataObject.id == parseInt(this.imvu.call("getDefaultRoomPid"), 10)) {
            return false;
        }
        
        return IMVU.Client.ShopCarouselBuyController.superclass.add.call(this, product);
    },
    
    update : function(outfit) {
        this.empty();
        var self = this;
        var addCallback = function(productViews) {
            if(productViews.length) {
                self.add(productViews[0]);
            } else {
                IMVU.log('unable to update carousel');
                //self.imvu.call('showErrorDialog', _T("Error"), _T("We're sorry, but an error has occurred. Please try again in a moment."));
            }
        };

        var toBuy = outfit[0].notOwned;
        for(i = 0; i < toBuy.length; i++) {
            var pid = toBuy[i].products_id;
            IMVU.Client.widget.Product.createWithPID(pid, addCallback, this.imvu, this.catalogController.net, null);
        }
    },

    confirm : function(outfit) {
        this.update([outfit]);
        this.show();
    },

    updateTotals : function() {
        this.dialog.updateTotals(this.cart.getTotal());
        this.dialog.updateCount(this.cart.itemCount);
        this.eventBus.fire("OutfitTotalUpdated", { total: IMVU.Client.util.number_format(this.cart.getTotal())});
        this.dialog.sizeMask();
    }

});

IMVU.Client.widget.OutfitPurchaseDialog = function (el, userConfig, cartController) {
    this.cartController = cartController;
    IMVU.Client.widget.OutfitPurchaseDialog.superclass.constructor.call(this, el, userConfig);
};

YAHOO.lang.extend(
    IMVU.Client.widget.OutfitPurchaseDialog, 
    IMVU.Client.widget.Dialog, 
    {
        init : function(el, userConfig) {
            IMVU.Client.widget.OutfitPurchaseDialog.superclass.init.call(this, el/*, userConfig*/);
            this.beforeInitEvent.fire(IMVU.Client.widget.OutfitPurchaseDialog);
            $(this.element).addClass("carousel-buy-dialog");

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }

            var saveAsOutfitOn = this.cartController.imvu.call('getLocalStoreValueForUser', 'ShopCarouselBuyDialogSaveAsOutfitOn', true);
            this.setHeader('<span>'+_T("Buy Now")+' (<span class="outfit-item-count">0</span> <span class="units">'+_T("items")+'</span>)</span>');
            this.setBody(
                '<h1 class="clothing">Clothing</h1>' +
                '<div class="clothing" id="save_outfit"><input name="save_outfit" id="f_save_outfit" type="checkbox" value="1" '+(saveAsOutfitOn ? 'checked':'')+' /> <label for="f_save_outfit">Save this look as an Outfit</label></div>' + 
                '<div id="carousel-buy-clothing"></div>'+
                '<h1 class="room">Room</h1>' +
                '<div id="carousel-buy-room"></div>'+
                '<h1 class="furniture">Furniture</h1>' +
                '<div id="carousel-buy-furniture"></div>'+
                '<div class="carousel-buy-footer">'+
                '    <div class="balance">' +
                '        <h3>'+_T("Your balance:")+'</h3>' +
                '        <p class="credits"><label>'+_T("Credits")+':</label><span>0</span></p>' +
                '        <p class="promo"><label>'+_T("Promo Credits")+':</label><span>0</span></p>' +
                '        <p class="total"><label>'+_T("Total")+':</label><span>0</span></p>' +
                '        <p class="more-credits"><a id="more_credits" href="javascript:void(null);">'+_T("Get more credits now")+'</a></p>' +
                '    </div>' +
                '    <div class="totals">' +
                '        <p class="cost"><label>'+_T("cost")+':</label><span>0</span> '+_T("credits")+'</p>' +
                '        <p class="discount"><img src="../img/icon_vip_medium.png" /><label>'+_T("discount")+':</label><span>0</span> '+_T("credits")+'</p>' +
                '        <p class="total"><span>0</span> '+_T("credits")+'</p>' +
                '    </div>' +
                '    <div class="button-buy-outfit">'+_T("Buy all")+'</div>' +
                '</div>'
            );
            
            var self = this;
            this.renderEvent.subscribe(function() {
                this.elOutfitSave = this.innerElement.querySelector('#f_save_outfit');
                this.elOutfitPurchaseCount = this.innerElement.querySelector('span.outfit-item-count');
                this.elOutfitPurchaseUnits = this.innerElement.querySelector('span.units');
                this.elBalance = this.innerElement.querySelector('div.balance');
                this.elTotals = this.innerElement.querySelector('div.totals');

                this.elOutfitPurchaseBalanceCredits = this.elBalance.querySelector('p.credits > span');
                this.elOutfitPurchaseBalancePromo = this.elBalance.querySelector('p.promo > span');
                this.elOutfitPurchaseBalanceTotal = this.elBalance.querySelector('p.total > span');
                
                this.elOutfitPurchaseTotalCost = this.elTotals.querySelector('p.cost > span');
                this.elOutfitPurchaseTotalDiscount = this.elTotals.querySelector('p.discount > span');
                this.elOutfitPurchaseTotal = this.elTotals.querySelector('p.total > span');
                this.elOutfitBuy = this.innerElement.querySelector('div.button-buy-outfit');
                
                var listenerMoreCredits = function(e) {
                    self.cartController.imvu.call("buyCredits");
                };
                
                var listenerSaveOutfit = function(e) {
                    self.cartController.imvu.call('setLocalStoreValueForUser', 'ShopCarouselBuyDialogSaveAsOutfitOn', this.elOutfitSave.checked);
                };
                
                YAHOO.util.Event.addListener("more_credits", "click", listenerMoreCredits, self, true);
                YAHOO.util.Event.addListener("f_save_outfit", "click", listenerSaveOutfit, self, true);
            });
            
            this.beforeShowEvent.subscribe(function() {
                this.updateTotals();
                this.sizeMask();
                this.element.style.right = "98px";
                this.element.style.top = "75px";
                this.cartController.eventBus.fire("modalDialogShown", { "dialogName" : "outfitpurchase" });
            });

            this.hideEvent.subscribe(function() {
                this.cartController.eventBus.fire("modalDialogHidden", { "dialogName" : "outfitpurchase" });
            });

            this.initEvent.fire(IMVU.Client.widget.OutfitPurchaseDialog);
        },

        updateTotals : function() {
            var total = this.cartController.cart.getTotal();
            var discount = this.cartController.cart.getDiscount();

            this.elOutfitPurchaseBalanceCredits.innerHTML = IMVU.Client.util.number_format(IMVU.Client.creditBalance);
            this.elOutfitPurchaseBalancePromo.innerHTML = IMVU.Client.util.number_format(IMVU.Client.promoBalance);
            this.elOutfitPurchaseBalanceTotal.innerHTML = IMVU.Client.util.number_format(
                parseInt(IMVU.Client.promoBalance, 10) + parseInt(IMVU.Client.creditBalance, 10)
            );
            
            if (discount > 0) {
                discount = -1 * discount;
                this.elOutfitPurchaseTotalDiscount.innerHTML = IMVU.Client.util.number_format(discount);
                $(this.element).addClass("discounted");
            } else {
                $(this.element).removeClass("discounted");
            }

            this.elOutfitPurchaseTotalCost.innerHTML = IMVU.Client.util.number_format(total);
            this.elOutfitPurchaseTotal.innerHTML = IMVU.Client.util.number_format(this.cartController.cart.getDiscountedTotal());
            
            if (total > 0) {
                this.elOutfitBuy.style.display = "block";
            } else {
                this.elOutfitBuy.style.display = "none";
            }
        },

        updateCount : function(count) {
            this.elOutfitPurchaseCount.innerHTML = count;
            this.elOutfitPurchaseUnits.innerHTML = (count == 1) ? 'item':'items';
        },

        addItem : function(product) {
            if (this.innerElement.querySelector("#carousel_buy_product_id_" + product.dataObject.id)) {
                return;
            }
            
            var item = document.createElement("div");
            item.className = "carousel-buy-item product-info ui-event";

            item.setAttribute("id", "carousel_buy_product_id_" + product.dataObject.id);
            item.setAttribute("data-ui-name", "CarouselProductInfo");
            item.innerHTML = IMVU.Client.widget.Product.getInfoInnerHTML();
            
            var elThumb = item.querySelector('img.thumbnail');
            var elLargeProductName = item.querySelector('h2');
            var elCreatorName = item.querySelector('h3 > a');
            var elRating = item.querySelector('h4 > span');
            var elPriceWrapper = item.querySelector('div.price');
            var elOriginalPrice = item.querySelector('div.price > span.original_price');
            var elPrice = item.querySelector('div.price > span.current_price');
//            var elPrice = item.querySelector('div.price > span');
            var elRemove = item.querySelector('div.remove');
            var elMoveToWishlist = item.querySelector('div.move-to-wishlist');

            $(item).toggleClass('pro', !!product.dataObject.pro)
                   .toggleClass('ap', !!product.dataObject.ap)
                   .toggleClass('in-wishlist', !!product.dataObject.in_wishlist)
                   .toggleClass('in-inventory', !!product.dataObject.owns_product);
            
            elThumb.src = product.dataObject.image;
            elLargeProductName.innerHTML = product.dataObject.name;
            elCreatorName.innerHTML = product.dataObject.creator_name;
            elRating.innerHTML = (product.dataObject.ap ? _T("Access Pass Only") : _T("General Audience"));
            if (product.dataObject.discount_price && product.dataObject.discount_price != product.dataObject.price) {
                $(elPriceWrapper).addClass('two_priced');
                elOriginalPrice.innerHTML = IMVU.Client.util.number_format(product.dataObject.price);
                elPrice.innerHTML = ' ' + IMVU.Client.util.number_format(product.dataObject.discount_price);
            } else {
                elPrice.innerHTML = IMVU.Client.util.number_format(product.dataObject.price);
                elOriginalPrice.innerHTML = '';
            }

            YAHOO.util.Event.addListener(elCreatorName, "click", product.clickCreatorName, product, true);
            
            new ImvuButton(elRemove, {small:true, callback: function (e) {
                this.cartController.remove(product);
            }.bind(this)});
            new ImvuButton(elMoveToWishlist, {small:true, callback: function (e) {
                product.clickAddToWishlist();
                this.cartController.remove(product);
            }.bind(this)});

            $(this.innerElement).addClass(product.getType());
            
            this.innerElement.querySelector('#carousel-buy-' + product.getType()).appendChild(item);
            
            var index = this.innerElement.querySelector('#carousel-buy-' + product.getType()).childNodes.length;
            if (index & 1) {
                item.className += " odd";
            }
            
            this.updateTotals();
            this.sizeMask();
        },

        removeItem : function(product) {
            var itemToRemove = YAHOO.util.Dom.get("carousel_buy_product_id_" + product.dataObject.id);
            if (itemToRemove) {
                itemToRemove.parentNode.removeChild(itemToRemove);
                this.updateTotals();
                this.sizeMask();
            }
            if (! this.innerElement.querySelector('#carousel-buy-' + product.getType()).childNodes.length) {
                $(this.innerElement).removeClass(product.getType());
            }
        },

        empty : function() {
            this.innerElement.querySelector('#carousel-buy-clothing').innerHTML = "";
            this.innerElement.querySelector('#carousel-buy-room').innerHTML = "";
            this.innerElement.querySelector('#carousel-buy-furniture').innerHTML = "";
            $(this.innerElement).removeClass('clothing room furniture');
            this.updateTotals();
            this.sizeMask();
        }
    }
);

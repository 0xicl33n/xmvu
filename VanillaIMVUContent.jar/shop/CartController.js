IMVU.Client.CartController = function (args) {
    IMVU.Client.CartController.superclass.constructor.call(this, args);

    this.dialog = new IMVU.Client.widget.CartDialog("cart_dialog", { width:"574px", modal:true, fixedcenter:false, visible:false, zIndex:999 }, this);
    this.dialog.render(document.body);

    this.elCartIcon = YAHOO.util.Dom.get("cart_icon");
    this.elCartCount = this.elCartIcon.querySelector('span.cart-count');
    this.elCartBuy = this.dialog.innerElement.querySelector('.button-buy-all');
    new ImvuButton(this.elCartBuy, {callback: this.checkout.bind(this)});
    YAHOO.util.Event.addListener(this.elCartIcon, "click", this.show, this, true);

    this.addItemEvent.subscribe(function(type, args, obj) {
        var product = args[0];
        this.animate(product);
    }, this, true);

    this.updateCountEvent.subscribe(function(type, args, obj) {
        var count = args[0];
        this.elCartCount.innerHTML = count;
        this.dialog.elCartCount.innerHTML = count;
        this.dialog.elCartUnits.innerHTML = (this.cart.itemCount == 1 ? _T("item") : _T("items"));
    }, this, true);

    this.updateCount();

    this.checkoutDialogController.addCart(this.cart,'main',true);

};

YAHOO.lang.extend(IMVU.Client.CartController, IMVU.Client.BaseCartController, {
        
    animate : function(product) {
        var cartIconPos = YAHOO.util.Dom.getXY(this.elCartIcon);

        var productPos = YAHOO.util.Dom.getXY(product.element);

        var productClone = product.element.cloneNode(false);
        productClone.className = "product-clone";
        document.body.appendChild(productClone);
        YAHOO.util.Dom.setXY(productClone, productPos);
        
        var trail1 = productClone.cloneNode(false);
        var trail2 = productClone.cloneNode(false);
        var trail3 = productClone.cloneNode(false);
        var trail4 = productClone.cloneNode(false);
        var trail5 = productClone.cloneNode(false);
        
        var anim = new YAHOO.util.Motion(productClone, { 
            width: { to: 14 },
            height: { to: 12 },
            points: { to: [cartIconPos[0]-2, cartIconPos[1]-2] },
            opacity: { to: 0.5 }

        }, 0.25, YAHOO.util.Easing.easeIn);

        anim.onComplete.subscribe(function() {
            this.updateCount();
            productClone.parentNode.removeChild(productClone);
        }, this, true);

        anim.animate();
    }
});

IMVU.Client.widget.CartDialog = function (el, userConfig, cartController) {
    this.cartController = cartController;
    IMVU.Client.widget.CartDialog.superclass.constructor.call(this, el, userConfig);
};

YAHOO.lang.extend(IMVU.Client.widget.CartDialog, IMVU.Client.widget.Dialog, {

        init: function(el, userConfig) {

            /*
                 Note that we don't pass the user config in here yet because we
                 only want it executed once, at the lowest subclass level
            */

            IMVU.Client.widget.CartDialog.superclass.init.call(this, el/*, userConfig*/);
            this.beforeInitEvent.fire(IMVU.Client.widget.CartDialog);
            $(this.element).addClass("cart-dialog");

            if (userConfig) {
                this.cfg.applyConfig(userConfig, true);
            }

            this.setHeader('<span>'+_T("Shopping Cart")+ ' (<span class="cart-count">'+_T("0")+'</span> <span class="units">'+ _T("items") +'</span>)</span>');
            this.setBody(''+
            '<div class="cart-body"></div>'+
            '<div class="cart-footer">'+
            '    <div class="balance">' +
                         '        <h3>'+_T("Your balance:")+'</h3>' +
            '        <p class="credits"><label>'+_T("Credits:")+'</label><span>8,550</span></p>' +
            '        <p class="promo"><label>'+_T("Promo Credits:")+'</label><span>3,450</span></p>' +
            '        <p class="total"><label>'+_T("Total:")+'</label><span>12,500</span></p>' +
            '    </div>' +
            '    <div class="totals">' +
            '        <p class="cost"><label>'+_T("cost:")+'</label><span>28,566</span> '+_T("credits")+'</p>' +
            '        <p class="discount"><img src="../img/icon_vip_medium.png" /><label>'+_T("discount:")+'</label><span>-10,000</span> '+_T("credits")+'</p>' +
            '        <p class="total"><span>25,709</span> '+_T("credits")+'</p>' +
            '    </div>' +
            '    <div class="button-buy-all">'+_T("Buy all")+'</div>' +
            '</div>');

            this.renderEvent.subscribe(function() {
                this.elCartBody = this.innerElement.querySelector('div.cart-body');
                this.elCartCount = this.innerElement.querySelector('span.cart-count');
                this.elCartUnits = this.innerElement.querySelector('span.units');
                this.elBalance = this.innerElement.querySelector('div.balance');
                this.elTotals = this.innerElement.querySelector('div.totals');

                this.elCartBalanceCredits = this.elBalance.querySelector('p.credits > span');
                this.elCartBalancePromo = this.elBalance.querySelector('p.promo > span');
                this.elCartBalanceTotal = this.elBalance.querySelector('p.total > span');
                
                this.elCartTotalCost = this.elTotals.querySelector('p.cost > span');
                this.elCartTotalDiscount = this.elTotals.querySelector('p.discount > span');
                this.elCartTotal = this.elTotals.querySelector('p.total > span');
                this.elCartBuy = this.innerElement.querySelector('div.button-buy-all');
            });
            
            this.beforeShowEvent.subscribe(function() {
                this.updateTotals();
                this.sizeMask();
                this.element.style.right = "98px";
                this.element.style.top = "75px";
            });

            this.initEvent.fire(IMVU.Client.widget.CartDialog);
        },
        
        updateTotals : function() {
            var total = this.cartController.cart.getTotal();
            var discount = this.cartController.cart.getDiscount();

            this.elCartBalanceCredits.innerHTML = IMVU.Client.util.number_format(IMVU.Client.creditBalance);
            this.elCartBalancePromo.innerHTML = IMVU.Client.util.number_format(IMVU.Client.promoBalance);
            this.elCartBalanceTotal.innerHTML = IMVU.Client.util.number_format(
                parseInt(IMVU.Client.promoBalance, 10) + parseInt(IMVU.Client.creditBalance, 10)
            );

            this.elCartTotalCost.innerHTML = IMVU.Client.util.number_format(this.cartController.cart.getTotal());
            this.elCartTotal.innerHTML = IMVU.Client.util.number_format(this.cartController.cart.getDiscountedTotal());

            if (discount > 0) {
                discount = -1 * discount;
                this.elCartTotalDiscount.innerHTML = IMVU.Client.util.number_format(discount);
                $(this.element).addClass("discounted");
            } else {
                $(this.element).removeClass("discounted");
            }

            if (total > 0) {
                this.elCartBuy.style.display = "block";
            } else {
                this.elCartBuy.style.display = "none";
            }
        },

        addItem : function(product) {
            var item = document.createElement("div");
            item.className = "cart-item product-info";
            item.setAttribute("product_id", product.dataObject.id);
            item.innerHTML = IMVU.Client.widget.Product.getInfoInnerHTML();

            var elThumb = item.querySelector('img.thumbnail');
            var elLargeProductName = item.querySelector('h2');
            var elCreatorName = item.querySelector('h3 > a');
            var elRating = item.querySelector('h4 > span');
            var elPriceWrapper = item.querySelector('div.price');
            var elOriginalPrice = item.querySelector('div.price > span.original_price');
            var elPrice = item.querySelector('div.price > span.current_price');
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
                elPrice.innerHTML = IMVU.Client.util.number_format(product.dataObject.discount_price);
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

            this.elCartBody.appendChild(item);
            this.updateTotals();

            this.sizeMask();
        },

        removeItem : function(product) {
            var itemToRemove = this.elCartBody.querySelector('div[product_id="' + product.dataObject.id + '"]');
            if (itemToRemove) {
                this.elCartBody.removeChild(itemToRemove);
                this.updateTotals();

                this.sizeMask();
            }
        },

        empty : function() {
            this.elCartBody.innerHTML = "";
            this.sizeMask();
        }
    }
);

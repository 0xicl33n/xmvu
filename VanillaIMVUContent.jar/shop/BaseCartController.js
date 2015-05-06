IMVU.Client.BaseCartController = function (args) {
    this.imvu = args.imvu || imvuRequired;
    this.eventBus = args.eventBus || eventBusRequired;
    this.catalogController = args.catalogController || catalogControllerRequired;
    this.purchaseMixin = args.purchaseMixin || purchaseMixinRequired;

    this.cart = new IMVU.Client.Cart(this.imvu);
    this.checkoutDialogController = args.checkoutDialogController || checkoutControllerRequired;

    
    this.addItemEvent = new YAHOO.util.CustomEvent("addItem", this);
    this.removeItemEvent = new YAHOO.util.CustomEvent("removeItem", this);
    this.emptyEvent = new YAHOO.util.CustomEvent("empty", this);
    this.updateCountEvent = new YAHOO.util.CustomEvent("updateCount", this);
    this.purchaseEvent = new YAHOO.util.CustomEvent("purchase", this);

    $('body')
    .bind('afterProductsPurchased', this.productsPurchased.bind(this))
    .bind('afterCheckoutAttempted', this.checkoutAttempted.bind(this))
    .bind('beforeCheckoutFailed', this.checkoutFailed.bind(this));
};

IMVU.Client.BaseCartController.prototype = {
    show : function() {
        if(this.imvu.call('shouldShopTogetherCheckoutDialog')){ 
            this.checkoutDialogController.startCheckout();
        } else { 
            this.dialog.show();
        }
    },

    hide : function() {
        this.dialog.hide();
    },

    add : function(product) {
        if (! this.cart.hasItem(product)) {
            this.cart.addItem(product);
            this.dialog.addItem(product);
            this.updateCount();
            this.addItemEvent.fire(product);
        }
    },

    remove : function(product) {
        if (this.cart.hasItem(product)) {
            this.cart.removeItem(product);
            this.dialog.removeItem(product);
            this.updateCount();
            this.removeItemEvent.fire(product);
        }
    },
        
    empty : function() {
        this.cart.empty();
        this.dialog.empty();
        this.emptyEvent.fire();
        this.updateCount();
    },
    
    checkout : function() {
        this.dialog.wait();
        var pids = this.cart.getProductIds();
        this.purchaseMixin.buy(pids, this.cart.items, '', '', '', '', '', 'cart_checkout');
    },

    updateCount : function() {
        var count = IMVU.Client.util.number_format(this.cart.itemCount);
        this.updateCountEvent.fire(count);
    }
};

IMVU.Client.BaseCartController.prototype.productsPurchased = function(event, products, response) {
    this.empty();
    this.hide();
    this.purchaseEvent.fire({products: products});
}

IMVU.Client.BaseCartController.prototype.checkoutAttempted = function(products, response) {
    this.dialog.stopWaiting();
}

IMVU.Client.BaseCartController.prototype.checkoutFailed = function(o) {
    this.hide();
}

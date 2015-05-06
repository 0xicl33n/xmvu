
IMVU.Client.Cart = function(imvu) {
    this.imvu = imvu;
    this.items = {};
    this.itemCount = 0;
};

IMVU.Client.Cart.prototype = {
    addCart: function(cart) { 
        _.each(cart.items, function(item) { 
            this.addItem(item);
        }.bind(this));
    },
        
    addItem : function(product) {
        if (! this.hasItem(product)) {
            this.items[product.dataObject.id] = product;
            this.itemCount++;
        }
    },

    removeItemByPid: function(pid) { 
        if(this.items[pid]) { 
            delete this.items[pid];
            this.itemCount--;
        }
    },

    removeItem : function(product) {
        if (this.hasItem(product)) {
            delete this.items[product.dataObject.id];
            this.itemCount--;
        }
    },

    getProductByPid: function(pid) { 
        if(this.hasPid(pid)) { 
            return this.items[pid];
        }
        return false;
    },

    hasPid: function(pid) { 
        return (this.items[pid] !== undefined);
    },

    hasItem : function(product) {
        return this.hasPid(product.dataObject.id);
    },

    getTotal : function() {
        var total = 0;
        for (var pid in this.items) {
            if (pid) {
                total += this.items[pid].dataObject.price;
            }
        }
        return total;
    },
    
    getDiscountedTotal : function() {
        var discount_total = 0;
        for (var pid in this.items) {
            if (pid) {
                discount_total += this.items[pid].dataObject.discount_price;
            }
        }
        return discount_total;
    },

    getDiscount : function() {
        var discount = 0;
        var discount_total = 0;

        var isVIP = this.imvu.call("hasVIPPass");
        if (isVIP) {
            discount = this.getTotal() - this.getDiscountedTotal();
        }
        return discount;
    },

    empty : function() {
        this.items = {};
        this.itemCount = 0;
    },

    getProductIds : function() {
        var pids = [];
        for (var pid in this.items) {
            if (pid) {
                pids.push(pid);
            }
        }
        return pids;
    }

};
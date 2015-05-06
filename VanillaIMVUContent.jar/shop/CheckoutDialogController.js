IMVU.Client.CheckoutDialogController = function(args) { 
    this.imvu = args.imvu;
    this.cartsWithMetaData = new Array();
    this.purchaseMixin = args.purchaseMixin;
    this.wishlistController = args.wishlistController;
}
IMVU.Client.CheckoutDialogController.prototype = { 
    addCart: function(cart, name, canModify) { 
        this.cartsWithMetaData.push({
            cart: cart,
            name: name,
            canModify: canModify
        });
    },

    extractPidsBeingWorn: function() { 
        return _(this.cartsWithMetaData).chain()
            .filter(function(cartWithMetaData) { 
                return cartWithMetaData.name == 'carousel';
            })
            .pluck('cart')
            .pluck('items')
            .map(_.values.bind(_))
            .flatten()
            .filter(function(product) {
                return product && product.getType() == 'clothing';
            })
            .pluck('dataObject')
            .pluck('id')
            .value();
    },
    startCheckout: function() { 
        var aggregatedCarts = this.aggregateCarts();
        var cartProducts = _.pluck(aggregatedCarts.items, 'dataObject');
        var pidsBeingWorn = this.extractPidsBeingWorn();

        var result = this.imvu.call('showCheckoutDialog', {
            balance: { 
                credits: IMVU.Client.creditBalance,
                predits: IMVU.Client.promoBalance
            },
            cart: { 
                total: aggregatedCarts.getTotal(),
                discount: aggregatedCarts.getDiscount(),
                discountedTotal: aggregatedCarts.getDiscountedTotal(),
                products: cartProducts
            },
            pidsBeingWorn: pidsBeingWorn
        });    
        this.result = result;
        if(result) { 
            if(result.moveToWishlistPids) { 
                _.each(result.moveToWishlistPids, function(pid) { 
                    var product = aggregatedCarts.getProductByPid(pid);
                    this.wishlistController.add(product);
                }.bind(this));
            }
            if(result.pidsToRemove) { 
                _.each(result.pidsToRemove, function(pid) { 
                    aggregatedCarts.removeItemByPid(pid);
                    _.each(this.cartsWithMetaData, function(cartWithMetaData) { 
                        if(cartWithMetaData.canModify) { 
                            cartWithMetaData.cart.removeItemByPid(pid);
                        }
                    });
                }.bind(this));
            }
            if(result.purchase) { 
                this.purchase(aggregatedCarts);
            }
        }
    },

    aggregateCarts: function() { 
        var carts = _.pluck(this.cartsWithMetaData, 'cart');
        var aggregatedCarts = $.extend(true, {}, carts[0]);
        for(var i = 1; i < carts.length; i++) { 
            aggregatedCarts.addCart(carts[i]);
        }
        aggregatedCarts.imvu = this.imvu;
        return aggregatedCarts;
    },

    purchase: function(cart) { 
        var pids = cart.getProductIds();
        this.purchaseMixin.buy(pids, cart.items, '', '', '', '', '', 'cart_checkout');
    },
}


function createCheckout(args) {
    var imvu = args.imvu;
    var cart = args.cart;
    var balance = args.balance;
    var pidsBeingWorn = args.pidsBeingWorn;
    var $root = args.$root;
    var number_format = IMVU.Client.util.number_format;

    $root.find('.balance .credits').text(number_format(balance.credits));
    $root.find('.balance .promo').text(number_format(balance.predits));
    $root.find('.balance .total').text(number_format(balance.predits+balance.credits));
    function renderDialog() { 
        $root.find('.totals .cost').text(number_format(cart.total));
        $root.find('.totals .discount').text(number_format(cart.discount));
        $root.find('.totals .total').text(number_format(cart.discountedTotal));
        $root.find('.save-outfit-option').toggle(!!pidsBeingWorn.length);
    }
    function removeItem($item) { 
        var productInfo = $item.data('productInfo');
        var pid = productInfo.id;
        removePids.push(pid);
        var i = _.indexOf(pidsBeingWorn, pid);
        if(i >= 0) { 
            pidsBeingWorn.splice(i, 1);
        }
        cart.total -= productInfo.price;
        cart.discount -= (productInfo.price - productInfo.discount_price);
        cart.discountedTotal -= productInfo.discount_price;
        renderDialog.call();
        $item.remove();
        return pid;
    }
    renderDialog.call();

    var $cartBody = $root.find('.cart-body');
    _.each(cart.products, function(productInfo) { 
        productInfo.formattedPrice = number_format(productInfo.price);
        var $item = createItem(productInfo);
        $cartBody.append($item);
    });
    var removePids = [];
    $cartBody.delegate('.remove', 'click', function(e) { 
        var $target = $(e.target);
        var $item = $target.closest('.item');
        removeItem($item);
    });
    var moveToWishlistPids = [];
    $cartBody.delegate('.move-to-wishlist', 'click', function(e) { 
        var $target = $(e.target);
        var $item = $target.closest('.item');
        var pid = removeItem($item);
        moveToWishlistPids.push(pid);
    });

    function endDialogWithResult(purchase) { 
        var result = {};
        result.purchase = purchase;
        result.pidsToRemove = removePids;
        result.moveToWishlistPids = moveToWishlistPids;
        result.saveOutfit = !!pidsBeingWorn.length && $root.find('#save-outfit').is(':checked');
        console.log(result);
        imvu.call('endDialog', result);
    }

    onEscKeypress(endDialogWithResult.bind(null, false));

    $root.find('.buy-all').click(endDialogWithResult.bind(null, true));
}

function createItem(productInfo) { 
    var $item = $('#templates #item-template').clone().attr('id','').addClass('item');
    $item.data('productInfo', productInfo);
    $item.find('.thumb').attr('src', productInfo.image);
    $item.find('.name').text(productInfo.name);
    $item.find('.credits').text(productInfo.formattedPrice);
    return $item;
}

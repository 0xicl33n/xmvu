function PurchaseMixin(args) {
    this.imvu = args.imvu;
    this.net = args.network || networkRequired;
    this.timer = args.timer;
    this.eventBus = args.eventBus;
    this.service = new IMVU.Client.CatalogService(this.net, this.imvu);
}

PurchaseMixin.prototype.productsPurchased = function(products, response) {
    for each(product in products) {
        product.dataObject.owns_product = true;
        $(product.element).addClass('in-inventory');
        this.imvu.call('purchased', product.dataObject.id);
    }
    this.imvu.call('refreshInventory');
    $('body').trigger('afterProductsPurchased', [products, response]);
}

PurchaseMixin.prototype.insufficientCredits = function(products, response) {
    var dialog;

    var purchase_total = parseInt(this.removeCommas(response.total_f), 10);
    var balance_total = parseInt(this.removeCommas(response.balance_total_f), 10);
    var limit = this.imvu.call('getImvuConfigVariable', 'client.buy_credits.max_credit_delta');
   
    if (!limit) {
        limit = 100000;
    }

    var sufficientCredits = (purchase_total - balance_total) <= limit;

    serviceRequest({
        method: 'POST',
        uri: this.imvu.call('getBuyModalUri'),
        data: {
            credits_needed: purchase_total,
            session_id: '' + this.imvu.call('getClientSessionId'),
            source: 'insufficient credits'
        },
        callback: function(response, error) {
            if (error) {
                console.log("Bad response from BuyModal: ", error);
                this.checkoutFailed()
            } else {
                var result = this.imvu.call('showBrowserDialog', response.data.uri, response.data.title, response.data.width, response.data.height);
                if (result == null) {
                    this.imvu.call('recordFact', 'purchase_dialog_closed', {'payment_id': response.data.payment_id});
                }
                this.handleInsufficientCreditsResponse(products, result, sufficientCredits);
            }
        }.bind(this),
        json: true,
        network: this.net,
        imvu: this.imvu
    });
};

PurchaseMixin.prototype.handleInsufficientCreditsResponse = function(products, result, willBeSufficient) {
    if (result == 'success' && willBeSufficient) {
        var pids = _.map(products, function(product){ return product.dataObject.id; });
        this.service.buy(pids, this.retryPurchaseCallback(products, 3), "", "", "", "", "", "one_click_retry");
    }
};

PurchaseMixin.prototype.removeCommas = function (formattedAmount) {
    return (''+formattedAmount).replace(/,/g, '');
};

PurchaseMixin.prototype.checkoutAttempted = function(products, statusHandlers, response) {
    try {
        var status = response.status;
        var handler = statusHandlers[status];
        handler.call(this, products, response);
        var updated_credits = response.balance_credits;
        var updated_predits = response.balance_promo;
        this.eventBus.fire('updateCreditBalances', {credits: ''+updated_credits, predits: ''+updated_predits});
    } catch (ex) {
        IMVU.log(ex);
        this.checkoutFailed();
    }

    $('body').trigger('afterCheckoutAttempted');
}

PurchaseMixin.prototype.checkoutFailed = function(o) {
    $('body').trigger('beforeCheckoutFailed');
    this.imvu.call('showErrorDialog', _T("Error"), _T("We're sorry, but an error has occurred. Please try again in a moment."));
    $('body').trigger('afterCheckoutFailed');
}

PurchaseMixin.prototype.waitAndRetry = function(limit, products, response) {
    if (limit == 0) {
        this.insufficientCredits(products, response);
    }
    this.timer.setTimeout(function(){
        var pids = _.map(products, function(product){ return product.dataObject.id; });
        this.service.buy(pids, this.retryPurchaseCallback(products, limit-1), "", "", "", "", "", "one_click_retry");
    }.bind(this), 2000);
}

PurchaseMixin.prototype.retryPurchaseCallback = function(products, limit) {
    return {
        success: this.checkoutAttempted.bind(
            this,
            products,
            {1: this.productsPurchased, 2: this.waitAndRetry.bind(this, limit), 3:this.checkoutFailed}),
        failure: this.checkoutFailed.bind(this)};
}

PurchaseMixin.prototype.purchaseCallback = function(products) {
    return {
        success: this.checkoutAttempted.bind(
            this,
            products,
            {1: this.productsPurchased, 2: this.insufficientCredits, 3:this.checkoutFailed}),
        failure: this.checkoutFailed.bind(this)};
}

PurchaseMixin.prototype.buy = function(pids, products, keywords, category, page_num, sort_type, sort_order, purchase_method) {
    return this.service.buy(pids, this.purchaseCallback(products), keywords, category, page_num, sort_type, sort_order, purchase_method);
}
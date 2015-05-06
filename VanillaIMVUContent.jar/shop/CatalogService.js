IMVU.Client.CatalogSearchRequest = function() {
    this.search = null;
    
    this.sort_field = "conversion_score_b";

    this.sort_direction = "desc";

    this.category = null;
        
    this.results_per_page = 12;

    this.price_bucket = null;

    this.solr_limit = 24;

    this.maturity_rating = "all";
};

IMVU.Client.WishlistRequest = function() {
    
    this.sort_field = "date_added";

    this.sort_direction = "desc";

    this.category = null;
        
    this.results_per_page = 12;

    //this.price_bucket = null;

    this.solr_limit = 24;

    this.maturity_rating = "all";
};


IMVU.Client.CatalogService = function(net, imvu) {
    this.net = net;
    this.imvu = imvu;
    
    this.searchState = {};
    this.searchState.activePage = 1;
    this.searchState.activeRequest = new IMVU.Client.CatalogSearchRequest();
    
    this.wishlistState = {};
    this.wishlistState.activePage = 1;
    this.wishlistState.activeRequest = new IMVU.Client.WishlistRequest();
    this.wishlistCache = {};
    
    this.context = 'sitc';
    if (imvu.call('isShoppingTogether')) {
        this.context = 'together_' + this.context;
    }
};

IMVU.Client.CatalogService.prototype = {

    buy : function(pids, callback, keywords, category, page_num, sort_type, sort_order, purchase_method) {
        if (arguments.length != 8) {
            throw new Error("Invalid argument list: CatalogService");
        }

        if (! (pids instanceof Array)) {
            pids = [pids];
        }

        function productRequestCallback(response, error) {
            if (error) {
                callback.failure(error);
            } else {
                callback.success(response);
            }
        }

        serviceRequest({
            method: 'POST',
            uri: '/api/service/shop/svc_catalog_purchase.php',
            data: { 
                products: pids,
                context: this.context,
                keywords: keywords,
                category: category,
                page_num: page_num,
                sort: sort_type,
                sort_order: sort_order,
                source: 'client',
                purchase_method: purchase_method
            },
            callback: productRequestCallback,
            json: true,
            network: this.net,
            imvu: this.imvu,
        });
    },
    
    setContext: function(context) {
        this.context = context;
    },

    search : function(request, forPage, abortExistingRequests, callback, controller) {
        this.searchUncached(request, forPage, abortExistingRequests, callback);
    },

    searchUncached : function(request, forPage, abortExistingRequests, callback) {
        if (! forPage) {
            forPage = this.searchState.activePage;
        }

        if (! request) {
            request = this.searchState.activeRequest;
        }

        var skip = (forPage - 1) * request.results_per_page;

        var postPairs = {
            "page" : forPage,
            "skip" : skip
        };

        for (var field in request) {
            if (field) {
                var value = request[field];
                if (typeof value !== 'undefined') {
                    postPairs[field] = request[field];
                }
            }
        }

        if (abortExistingRequests && typeof this._searchCn != "undefined") {
            this.net.abort(this._searchCn);
        }

        this._searchCn = this.net.asyncRequest("POST", IMVU.SERVICE_DOMAIN + '/api/shop/search_st.php', callback, postPairs, this.imvu.call);
    },

    clearProductCache : function() {
        this.wishlistCache = {};
    },
    
    getWishlist : function(request, forPage, abortExistingRequests, callback) {
        if (! forPage) {
            forPage = this.wishlistState.activePage;
        }

        if (! request) {
            request = this.wishlistState.activeRequest;
        }

        var skip = (forPage - 1) * request.results_per_page;

        var postPairs = {
            "page" : forPage,
            "skip" : skip
        };

        for (var field in request) {
            if (field) {
                var value = request[field];
                if (typeof value !== 'undefined') {
                    postPairs[field] = request[field];
                }
            }
        }
        IMVU.log('qqq postPairs: %r', postPairs);

        if (abortExistingRequests && typeof this._searchCn != "undefined") {
            this.net.abort(this._wishlistCn);
        }
    
        this._wishlistCn = this.net.asyncRequest("POST", IMVU.SERVICE_DOMAIN + '/api/shop/wishlist.php', callback, postPairs);

    },

    wishlistCall : function(pid, action, callback) {
        this._wishlistCn = this.net.asyncRequest("POST", IMVU.SERVICE_DOMAIN + '/api/shop/wishlist.php', callback, { "pid" : pid, "action" :  action });
    },
    
    whitelistCall : function(pid, action, callback) {
        this._whistlistCn = this.net.asyncRequest("POST", IMVU.SERVICE_DOMAIN + '/api/shop/whitelist.php', callback, { "pid" : pid, "action" :  action });
    }

};

IMVU.Client.CatalogController = function (args) {
    this.imvu = args.imvu || imvuRequired;
    this.net = args.network || networkRequired;
    this.service = args.service || serviceRequired;
    this.cache = {};

    this.$search = $('#search');
};

IMVU.Client.CatalogController.prototype = {

    loadProductsOnTabClick : function(requestFields) {
        var request = this.service.searchState.activeRequest;
        for (var field in requestFields) {
            if (field) {
                request[field] = requestFields[field];
            }
        }
        this.cache = {};
        this.service.clearProductCache();
        this.service.searchState.activePage = 1;
        this.loadProducts();
    },

    search : function(searchTerm, type, value) {
        var request = this.service.searchState.activeRequest;
        
        switch (type) {
            case "field":
                request.search_field = value;
                break;
            case "category":
                request.category = value;
                break;
            default:
                request.search_field = null;
                break;
        }

        if (searchTerm === "") {
            request.sort_field = "conversion_score_b";
            request.search = null;
            request.search_field = null;
        } else {
            request.sort_field = (request.search_field == "creator_name" ? "id" : "score");
            request.search = searchTerm;
        }
        
        this.cache = {};
        this.service.clearProductCache();
        this.service.searchState.activePage = 1;
        this.view.clearBeforeLoad();
        this.maybeLoad = true;
        $('body').trigger('catalogControllerSearch', [searchTerm, type, value]);
        if (this.maybeLoad) {
            this.loadProducts();
        }
    },

    setRating : function(rating, skipLoad) {
        var request = this.service.searchState.activeRequest;
        request.maturity_rating = rating;
        this.cache = {};
        this.service.clearProductCache();
        this.service.searchState.activePage = 1;
        this.view.clearBeforeLoad();
        if (!skipLoad) {
            this.loadProducts();
        }
    },

    loadProducts : function() {
        this.searchCallback.scope = this;
        this.service.search(null, null, true, this.searchCallback, this);
        this.maybeLoad = false;
    },

    goToPage : function(page) {
        page = parseInt(page, 10);
        if (page > 0 && page <= this.service.searchState.pageCount) {
            this.service.searchState.activePage = page;

            var cachedProducts = this.cache[page];
            if (cachedProducts) {
                this.view.renderProducts(cachedProducts, page, this.service.searchState.pageCount);
                return;
            }

            this.service.searchState.activeRequest.solr_limit = 12;
            this.loadProducts();
        }
    },
    
    cacheResult : function(o) {
        try {
            var responseObject = o.responseText;
            
            var productPages = responseObject.result;

            var keys = responseObject.keys;
            var buffer = IMVU.Client.widget.Product.buffer;

            for (var page in productPages) {
                var pageItems = productPages[page];
                for (var i=0;i<pageItems.length;i++) {
                    var product = pageItems[i];
                    var keyedProduct = {};
                    for (var k=0;k<keys.length;k++) {
                        var key = keys[k];
                        keyedProduct[key] = product[k];
                    }

                    pageItems[i] = keyedProduct;
                }

                this.cache[page] = productPages[page];
            }
            
            this.service.searchState.maxLoadedIndex = responseObject.endIndex;
            this.service.searchState.pageCount = responseObject.pageCount;
        } catch (ex) { 
            /*Die nicely*/ 
        }
    },

    searchCallback : {
        success : function(o) {
            try {
                var responseObject = o.responseText;
                this.cacheResult(o);

                // Prefetch 3 future pages if possible
                if (responseObject.totalProductCount > 0 && responseObject.endIndex < (responseObject.totalProductCount - 1)) {
                    var preloadCallback = {};
                    preloadCallback.success = this.cacheResult;
                    preloadCallback.failure = function(o) {};
                    preloadCallback.scope = this;

                    this.service.searchState.activeRequest.solr_limit = 36;
                    if (! this.cache[this.service.searchState.activePage + 1]) {
                        this.service.searchUncached(null, parseInt(this.service.searchState.activePage, 10) + 1, false, preloadCallback);
                    }
                }
                
                this.$search.trigger('searchSuccessEvent', [responseObject, this.cache[this.service.searchState.activePage]]);
                
            } catch (ex) {
                this.searchCallback.failure.call(this, o);
                return;
            }

        },

        failure : function(o) {
            this.$search.trigger('searchFailureEvent', [o]);
            this.imvu.call('showErrorDialog', _T("Error"), _T("We're sorry, but an error has occurred. Please try again in a moment."));
        }

    }
    
};

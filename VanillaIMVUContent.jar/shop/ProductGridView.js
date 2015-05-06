IMVU.Client.ProductGridView = function (args) {
    this.imvu = args.imvu;
    this.id = args.id;
    this.rowCount = args.rowCount;
    this.colCount = args.colCount;
    this.paginatorMaxPages = args.paginatorMaxPages || 10;
    this.mode = args.mode;
    this.controller = this.mode.catalogController;

    this.rows = [];
    this.cells = [];
    
    this.container = YAHOO.util.Dom.get(args.container);
    
    $(this.container).addClass(this.containerClassName);

    this.activePage = 1;
    this.lastRenderedPage = 0;
    this.pageCount = 0;
    this.productSet = [];

    this.createElements();
    this.wireEvents();
};

IMVU.Client.ProductGridView.prototype = {

    containerClassName: "product-grid",

    createElements : function() {
        var Dom=YAHOO.util.Dom, row, cell, index;

        this.table = document.createElement("table");
        this.table.id = this.id + "_table";

        index = 0;
        for (var r=0;r<this.rowCount;r++) {
            row = document.createElement("tr");
            this.table.appendChild(row);

            row.id = this.id + "_row_" + r;
            this.rows[r] = row;
            for (var c=0;c<this.colCount;c++) {
                cell = document.createElement("td");
                cell.id = this.id + "_cell_" + index;
                $(cell).addClass("product-cell column-" + c);
                row.appendChild(cell);
                this.cells[index] = cell;
                index++;
            }
        }
        
        this.filters = document.createElement("div");
        this.filters.className = "filters";

        this.filterLabel = document.createElement("label");
        this.filterLabel.innerHTML = _T("Show");

        this.subcategory = document.createElement("select");
        this.subcategory.className = "subcategory";

        this.price = document.createElement("select");
        this.price.className = "price";

        this.filters.appendChild(this.filterLabel);
        this.filters.appendChild(this.subcategory);
        this.filters.appendChild(this.price);

        this.container.appendChild(this.filters);
        
        $(this.container).append($('#ap-upsell2'));
        
        this.container.appendChild(this.table);

        this.paginator = document.createElement("div");
        this.paginator.className = "pagination";

        this.paginatorLabel = document.createElement("label");
        this.paginator.appendChild(this.paginatorLabel);
        this.updatePaginatorLabel(0, 0);

        this.paginatorBack = document.createElement("p");
        this.paginatorBack.className = "back ui-event";
        this.paginatorBack.setAttribute("data-ui-name", "Back");

        this.paginatorBack.innerHTML = "&lt;";
        this.paginator.appendChild(this.paginatorBack);
        this.paginatorPages = [];

        for (var page,p=0;p<this.paginatorMaxPages;p++) {
            page = document.createElement("p");
            page.className = "p ui-event";
            page.setAttribute("data-ui-name", "Page" + (p+1));
            page.innerHTML = p+1;
            this.paginator.appendChild(page);
            this.paginatorPages.push(page);
        }

        this.paginatorNext = document.createElement("p");
        this.paginatorNext.className = "next ui-event";
        this.paginatorNext.setAttribute("data-ui-name", "Next");
        this.paginatorNext.innerHTML = "&gt;";
        this.paginator.appendChild(this.paginatorNext);

        this.container.appendChild(this.paginator);

        this.sort = document.createElement("div");
        this.sort.className = "sort browse ui-event";
        this.sort.setAttribute("data-ui-name", "SortByDropdown");

        this.sortSelect = document.createElement("select");
        this.sortSelect.className = "sort-select";

        this.sortLabel = document.createElement("label");
        this.sortLabel.innerHTML = _T("Sort by")+':';

        this.sortSelect.innerHTML = '<option class="browse-only ui-event" data-ui-name="SortByConversionScoreB" sort_direction="desc" value="conversion_score_b">'+_T("Best Match")+'</option><option class="search-only ui-event" data-ui-name="SortByScore" sort_direction="desc" value="score">'+_T("Best Match")+'</option><option sort_direction="desc" class="ui-event" data-ui-name="SortByUserRating" value="user_rating">'+_T("Avg. User Rating")+'</option><option sort_direction="desc" class="ui-event" data-ui-name="SortByNewestProducts" value="id">'+_T("Newest Products")+'</option><option sort_direction="asc" class="ui-event" data-ui-name="SortByPriceLowHigh" value="price">'+_T("Price: Low to High")+'</option><option sort_direction="desc" class="ui-event" data-ui-name="SortByPriceHighLow" value="price">'+_T("Price: High to Low")+'</option>';
        
        this.sort.appendChild(this.sortLabel);
        this.sort.appendChild(this.sortSelect);

        this.container.appendChild(this.sort);
    },

    wireEvents : function() {
        YAHOO.util.Event.addListener(this.subcategory, "change", this.handleChangeSubcategory, this);
        YAHOO.util.Event.addListener(this.price, "change", this.handleChangePrice, this);
        YAHOO.util.Event.addListener(this.sortSelect, "change", this.handleChangeSort, this);
        
        $('#ap-upsell2 .get-now-button, #ap-upsell2 .locked-ap-image').click(function() {
            this.imvu.call('launchUrl', 'http://www.imvu.com/accesspass/?source=null_search');
        }.bind(this));
        
        $('#ap-upsell2 .close-button').click(function() {
            $('#ap-upsell2').animate({ height: 'toggle', opacity: 'toggle' }, 'slow');
        });
    },
    
    handleChangeSubcategory : function(e, self) {
        var category_id = this.value;
        var category_name = this.options[this.selectedIndex].innerHTML;
        
        self.mode.searchBox.setCategoryOption(category_name, category_id);
        self.loadRequest({"category":category_id});
    },
    
    handleChangePrice : function(e, self) {
        var price_bucket = this.value;
        if (price_bucket == -1) {
            price_bucket = null;
        }
        self.loadRequest({"price_bucket":price_bucket});
    },
    
    handleChangeSort : function(e, self) {
        var sort_field = this.value;
        var sort_direction = this.options[this.selectedIndex].getAttribute("sort_direction");
        self.loadRequest({"sort_field":sort_field, "sort_direction":sort_direction});
    },

    handleTabClick : function(type, args, obj) {
        var tab = args[0];
        var params = {
            "category":tab.attributes.category_id
        };

        if(tab.attributes.named_category === 'recommended') { 
            params['recommended'] = 1;
        } else { 
            params['recommended'] = 0;

        }
        this.loadRequest(params);
    },

    loadRequest : function(request) {
        this.clearBeforeLoad();
        this.controller.loadProductsOnTabClick(request);
    },
    
    clearBeforeLoad : function() {
        this.wait();
        this.activePage = 1;
        this.lastRenderedPage = 0;
        this.pageCount = 0;
        this.hidePagination();
    },

    wait : function() {
        for (var s=0;s<this.cells.length;s++) {
            var cell = this.cells[s];
            cell.innerHTML = '<div class="wait"><img src="../shop/img/thumb_wait.gif" height="16" width="16" /></div>';
        }
    },
    
    clearFilters : function() {
        this.subcategory.innerHTML = "";
        this.price.innerHTML = "";
    },

    toggleFiltersVisibility : function(bool) { 
        $('#nav #search').toggle(bool);
        $(this.filterLabel).toggle(bool);
        $(this.subcategory).toggle(bool);
        $(this.price).toggle(bool);
        $(this.sort).toggle(bool);
    },
    
    getSlotCount : function() {
        return this.rowCount * this.colCount;
    },

    handleLoadComplete : function(type, args, obj) {
        var responseObject = args[0];
        var products = args[1];

        $('#ap-upsell2').hide();
        if (('ap_upsell_count' in responseObject) && ('ap_upsell_terms' in responseObject)) {
            if (responseObject.ap_upsell_count > 0 && responseObject.ap_upsell_terms !== '') {
                this.renderApUpsell(responseObject.ap_upsell_count, responseObject.ap_upsell_terms);
            }
        }
        this.renderProducts(products, responseObject.thisPage, responseObject.pageCount);
    },
    
    refresh: function() {
        if (this.productSet && this.productSet.length > 0 && this.activePage && this.pageCount) {
            this.renderProducts(this.productSet, this.activePage, this.pageCount);
        }
    },

    renderApUpsell : function(count, search_term) {
        $('#ap-upsell2 .upsell-text .ap-product-count').text(count);
        $('#ap-upsell2 .upsell-text .search-terms').text(search_term);
        ellipsize($('#ap-upsell2 .upsell-text .search-terms'), 115);
        $('#ap-upsell2').show();
    },
    
    renderProducts : function(products, forPage, pageCount) {
        var isAP = this.imvu.call("hasAccessPass");
        $('.no_results_c').hide();
        for (var p=0;p<this.getSlotCount();p++) {
            var slot = this.cells[p];

            if (slot.firstElementChild) {
                slot.removeChild(slot.firstElementChild);
            }

            if (products) {
                var productToDisplay = products[p];
                if (productToDisplay) {
                    var newProduct = IMVU.Client.widget.Product.create(productToDisplay, this.imvu);
                    if (newProduct.dataObject.ap && ! isAP) {
                        return;
                    }
                    
                    $(newProduct.element).toggleClass('trying', this.mode.pidsInUse.indexOf(parseInt(newProduct.dataObject.id, 10)) > -1);

                    YAHOO.util.Event.purgeElement(slot);
                    slot.appendChild(newProduct.getElement());
                }
            }
        }
        if (!products) {
            $('.no_results_c').show();
        }
        
        this.activePage = forPage;
        this.pageCount = pageCount;
        this.productSet = products;
        this.updatePagination();
        this.lastRenderedPage = this.activePage;
    },

    clearSubcategoryOptions : function() {
        this.subcategory.innerHTML = "";
    },

    addSubcategoryOption : function(text, value) {
        this.subcategory.options[this.subcategory.options.length] = new Option(text, value);
    },

    clearPriceOptions : function() {
        this.price.innerHTML = "";
    },

    addPriceOption : function(text, value) {
        this.price.options[this.subcategory.options.length] = new Option(text, value);
    },

    hidePagination : function() {
        this.paginator.style.display = "none";
    },

    updatePagination : function() {
        var activePage = this.activePage;
        var pageCount = this.pageCount;

        if (pageCount <= 1) {
            this.hidePagination();
            return;
        }

        this.paginator.style.display = "block";

        $(this.paginator).toggleClass('first-page', activePage == 1)
                         .toggleClass('last-page',  activePage == pageCount);

        var goBack = function() {
            if (this.activePage > 1) {
                this.wait();
                this.activePage = parseInt(this.activePage, 10) - 1;
                this.updatePagination();
                this.controller.goToPage(this.activePage);
            }
        };

        var goNext = function() {
            if (this.activePage < this.pageCount) {
                this.wait();
                this.activePage = parseInt(this.activePage, 10) + 1;
                this.updatePagination();
                this.controller.goToPage(this.activePage);
            }
        };

        var pageSlotClick = function(e, self) {
            self.wait();
            self.activePage = this.innerHTML;
            self.updatePagination();
            self.controller.goToPage(self.activePage);
        };

        YAHOO.util.Event.purgeElement(this.paginator, true);
        
        this.paginatorLabel.style.display = "block";

        var currentPageLabel = YAHOO.util.Dom.getElementsByClassName("current-page", "span", this.paginator)[0];
        currentPageLabel.innerHTML = IMVU.Client.util.number_format(activePage);

        var pageCountLabel = YAHOO.util.Dom.getElementsByClassName("page-count", "span", this.paginator)[0];
        pageCountLabel.innerHTML = IMVU.Client.util.number_format(pageCount);
        
        YAHOO.util.Event.addListener(this.paginatorBack, "click", goBack, this, true);
        YAHOO.util.Event.addListener(this.paginatorNext, "click", goNext, this, true);
    
        var pageToRender = parseInt(activePage, 10) - 4;
        if (pageToRender < 1) {
            pageToRender = 1;
        }

        for (var p=0;p<this.paginatorPages.length;p++) {
            pageSlot = this.paginatorPages[p];
            if (pageToRender > pageCount) {
                pageSlot.style.display = "none";
            } else {
                pageSlot.style.display = "block";
            }

            if (pageSlot) {
                YAHOO.util.Event.addListener(pageSlot, "click", pageSlotClick, this);

                $(pageSlot).toggleClass('selected', pageToRender == activePage);

                pageSlot.setAttribute("page", pageToRender);
                pageSlot.innerHTML = pageToRender;
            }

            pageToRender++;
        }
        
        this.updatePaginatorLabel(activePage, pageCount);
    },
    
    updatePaginatorLabel : function(activePage, pageCount) {
        var paginatorHTML = _T("Page") + ' <span class="current-page">' +activePage + '</span> ' +
            '/' +
            ' <span class="page-count">' + pageCount + '</span>';
        if (paginatorHTML.length > 81) {
            paginatorHTML = '<span class="current-page">' +activePage + '</span> ' +
                '/' +
                ' <span class="page-count">' + pageCount + '</span>';
        }
        this.paginatorLabel.innerHTML = paginatorHTML;

    }


};

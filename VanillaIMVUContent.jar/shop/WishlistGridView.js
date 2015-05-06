IMVU.Client.WishlistGridView = function (args) {
    IMVU.Client.WishlistGridView.superclass.constructor.call(this, args);
    this.controller = this.mode.wishlistController;
};

YAHOO.lang.extend(IMVU.Client.WishlistGridView, IMVU.Client.ProductGridView, {

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
                $(cell).addClass("product-cell")
                       .addClass("column-" + c);
                row.appendChild(cell);
                this.cells[index] = cell;
                index++;
            }
        }
        
        this.filters = document.createElement("div");
        this.filters.className = "filters";
        
        this.filterLabel = document.createElement("label");
        this.filterLabel.innerHTML = _T("Show Only");

        this.subcategory = document.createElement("select");
        this.subcategory.className = "subcategory";

        this.filters.appendChild(this.filterLabel);
        this.filters.appendChild(this.subcategory);

        this.container.appendChild(this.filters);
        this.container.appendChild(this.table);

        this.paginator = document.createElement("div");
        this.paginator.className = "pagination";

        this.paginatorLabel = document.createElement("label");
        this.paginatorLabel.innerHTML = _T("Showing Page")+' <span class="current-page">0</span> '+_T("of")+' <span class="page-count">0</span>';
        this.paginator.appendChild(this.paginatorLabel);

        this.paginatorBack = document.createElement("p");
        this.paginatorBack.className = "back";
        this.paginatorBack.innerHTML = "&lt;";
        this.paginator.appendChild(this.paginatorBack);
        this.paginatorPages = [];

        for (var page,p=0;p<10;p++) {
            page = document.createElement("p");
            page.className = "p";
            page.innerHTML = p+1;
            this.paginator.appendChild(page);
            this.paginatorPages.push(page);
        }

        this.paginatorNext = document.createElement("p");
        this.paginatorNext.className = "next";
        this.paginatorNext.innerHTML = "&gt;";
        this.paginator.appendChild(this.paginatorNext);

        this.container.appendChild(this.paginator);

        this.sort = document.createElement("div");
        this.sort.className = "sort browse";

        this.sortSelect = document.createElement("select");
        this.sortSelect.className = "sort-select";

        this.sortLabel = document.createElement("label");
        this.sortLabel.innerHTML = _T("Sort by:");

        this.sortSelect.innerHTML = '<option sort_direction="desc" value="date_added">'+_T("Most Recently Added")+'</option><option sort_direction="desc" value="price">'+_T("Price: High to Low")+'</option><option sort_direction="asc" value="price">'+_T("Price: Low to High")+'</option>';
        
        this.sort.appendChild(this.sortLabel);
        this.sort.appendChild(this.sortSelect);

        this.container.appendChild(this.sort);
    },

    wireEvents : function() {
        YAHOO.util.Event.addListener(this.subcategory, "change", this.handleChangeSubcategory, this);
        YAHOO.util.Event.addListener(this.sortSelect, "change", this.handleChangeSort, this);
    },
    
    handleTabClick : function(type, args, obj) {
        var tab = args[0];
        this.loadRequest({});
    },
    
    clearBeforeLoad : function() {
        this.wait();
        this.activePage = 1;
        this.lastRenderedPage = 0;
        this.pageCount = 0;
        this.hidePagination();
    },

    clearFilters : function() {
        this.subcategory.innerHTML = "";
    },

    renderProducts : function(products, forPage, pageCount) {
        var isAP = this.imvu.call("hasAccessPass");
        
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

                    $(newProduct.element).toggleClass('trying', this.mode && this.mode.pidsInUse.indexOf(parseInt(newProduct.dataObject.id, 10)) > -1);

                    YAHOO.util.Event.purgeElement(slot);
                    slot.appendChild(newProduct.getElement());
                }
            }
        }
        
        this.activePage = forPage;
        this.pageCount = pageCount;
        this.productSet = products;
        this.updatePagination();
        this.lastRenderedPage = this.activePage;
    }
});

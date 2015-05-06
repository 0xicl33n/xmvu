IMVU.Client.ShopSearchBox = function(rootElement, catalogController) {
    IMVU.Client.ShopSearchBox.superclass.constructor.call(this, rootElement);
    
    this.catalogController = catalogController;

    this.filterElement = this.rootElement.querySelector('select');
    if (! this.filterElement) {
        throw new Error("No filter select element set");
    }

    this.searchCategoryElement = YAHOO.util.Dom.get("search_category");
    this.sorts = YAHOO.util.Dom.getElementsByClassName('sort', 'div');
    this.sort_selects = YAHOO.util.Dom.getElementsByClassName('sort-select', 'select');
    
    YAHOO.util.Event.addListener(this.filterElement, "change", this.handleFilterChange, this, true);

    this.onTextChange.subscribe(function(eventType, args, obj) {
        var searchText = args[0];
        var type = args[1];
        var field = args[2];

        this.sorts = YAHOO.util.Dom.getElementsByClassName('sort', 'div');
        this.sort_selects = YAHOO.util.Dom.getElementsByClassName('sort-select', 'select');
        
        if (searchText === "") {
            $(this.sorts).removeClass("search")
                         .addClass('browse');
            this.sort_selects.forEach(function(select) {
                select.selectedIndex = 0;
            });
            this.filterElement.selectedIndex = 0;
        } else {
            $(this.sorts).removeClass("browse")
                         .addClass('search');
            this.sort_selects.forEach(function(select) {
                select.selectedIndex = 1;
            });
        }
        this.catalogController.search(searchText, type, field);
    }, this, true);

    YAHOO.util.Event.addListener("search_cta", "click", function() {
        this.inputElement.focus();
        this.onGainFocus();
    }, this, true);
};

YAHOO.lang.extend(IMVU.Client.ShopSearchBox, IMVU.Client.widget.SearchBox, {
    
    fireTextChangeEvent : function() {
        $('body').trigger('searchBoxTextChanged', [this.searchText]);
        
        var option = this.filterElement.options[this.filterElement.selectedIndex];
        var type = option.getAttribute("type");
        var value = option.value;
        this.onTextChange.fire(this.searchText, type, value);
    },

    searchForCreator : function(creatorName) {
        this.filterElement.value = "creator_name";
        this.setText(creatorName);
    },

    handleFilterChange : function(e) {
        var option = this.filterElement.options[this.filterElement.selectedIndex];
        var type = option.getAttribute("type");
        var field = option.value;
        if ((this.searchText === "" && type == "category") || this.searchText !== "") {
            this.fireTextChangeEvent();
        }

        $('body').trigger('searchBoxFilterChanged', [type, field]);
    },

    setCategoryOption : function(categoryName, categoryId) {
        this.searchCategoryElement.value = categoryId;
        this.searchCategoryElement.innerHTML = categoryName;
        this.searchCategoryElement.style.display = "block";
        this.filterElement.selectedIndex = 1;
    },

    clearCategoryOption : function() {
        this.searchCategoryElement.style.display = "none";
    },

    clear : function() {
        this.searchText = this.inputElement.value = "";
        this.updateClass();
    }

});

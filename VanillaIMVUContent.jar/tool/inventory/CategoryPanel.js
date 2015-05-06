function CategoryPanel(args) {
    this.$root = $(args.root);
    this.imvu = args.imvu;
    this.inventoryTool = args.inventoryTool;
    this.$categoryName = this.$root.find('.category-name .text');

    this.$goShoppingLink = this.$root.find('.go-shopping-link a');
    this.$goShoppingLink.bind('click', function () {
        this.inventoryTool.goShopping();
    }.bind(this));
    this.$goShopping = this.$root.find('.go-shopping-link');
    this.$goShopping.toggle(!!this.imvu.call('hasOpenedModeBefore', 'shop'));

    this.setCategories();
    this.setCategoryName(args.categoryName);
}

CategoryPanel.prototype = {
    setCategoryName: function (name) {
        this.$categoryName.text(name);
    },

    setCategories: function() {
        this.$categories = this.$root.find('.categories li').not(".category-divider");
        this.$categories
            .bind('click', function (e) {
            this.setCategoryName($(e.currentTarget).text());
            this.inventoryTool.deselectList();
            this.$categories.removeClass('selected');
            this.$categories.removeClass('hidden-selection');
            this.imvu.call('setPref', 'inventoryCategory', $(e.currentTarget).attr('data-filter'));
            $(e.currentTarget).addClass('selected');

            var filter = $(e.currentTarget).attr('data-filter');
            this.$categoryName.css('background-image', 'url(img/Inventory_icon_big_' + filter + '.png');
            this.inventoryTool.setGenderEnabledStateForFilter(e.currentTarget);
            this.inventoryTool.elInventory.scrollTop = 0;
            this.inventoryTool.timer.setTimeout(this.inventoryTool.refresh.bind(this.inventoryTool, false), 150);
        }.bind(this))
            .bind('mouseenter', function (e) {
            this.setCategoryName($(e.target).text());
            this.$categoryName.css('background-image', 'url(img/Inventory_icon_big_' + $(e.currentTarget).attr('data-filter') + '.png');
        }.bind(this))
            .bind('mouseleave', function () {
            var $selected = this.$root.find('.categories .selected');
            this.setCategoryName($selected.text());
            this.$categoryName.css('background-image', 'url(img/Inventory_icon_big_' + $selected.attr('data-filter') + '.png');
        }.bind(this));
    }
}
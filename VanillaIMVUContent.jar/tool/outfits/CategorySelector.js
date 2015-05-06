function CategorySelector(spec) {
    this.rootElement = spec.rootElement || rootElementMustBeSpecified;
    this.imvu = spec.imvu || imvuMustBeSpecified;

    this.categories = [];
    this.dropdown = new IMVU.Client.widget.DropDown({rootElement: this.rootElement, items: []});
    this.elSelect = this.rootElement.querySelector('select');
    this.evtCategoryChange = new YAHOO.util.CustomEvent('categoryChange');

    Event.on(this.elSelect, 'change', function () {
        var newCategoryId = this.dropdown.getSelectedValue();
        this.imvu.call('setLocalStoreValue', 'Outfits.Category', parseInt(newCategoryId, 10));
        this.fireCategoryChange();
    }.bind(this));
}

CategorySelector.prototype.getCategories = function () {
    return this.categories;
}

CategorySelector.prototype.onCategoryChange = function (callback) {
    this.evtCategoryChange.subscribe(callback);
}

CategorySelector.prototype.fireCategoryChange = function () {
    var newCategoryId = this.dropdown.getSelectedValue();
    this.evtCategoryChange.fire({categoryId: newCategoryId});
}

CategorySelector.prototype.insertNewCategory = function (id, name, privacy, total_outfits) {
    var privacyLabel = '';
    if (privacy != IMVU.Outfits.PUBLIC) {
        privacyLabel = ' ' + IMVU.Outfits.getPrivacyHtmlLabel(privacy);
    }
    this.dropdown.addOption(IMVU.Outfits.getCategoryDisplayName(name) + ' (' + total_outfits + ')' + privacyLabel, id, 'category-' + id);
}

//
// This uses the same idea as the GA/AP filtering, but dynamically creates the styles.
//
// <style type="text/css">
//     #carousel.category-123 .outfit_container:not(.category-123) { display: none; }
//     #carousel.category-456 .outfit_container:not(.category-456) { display: none; }
//     #carousel.category-789 .outfit_container:not(.category-789) { display: none; }
// </style>
//
// <div id="carousel" class="category-123">
//     <div class="outfit_container category-123"></div> <!-- visible -->
//     <div class="outfit_container category-456"></div> <!-- hidden -->
//     <div class="outfit_container category-789"></div> <!-- hidden -->
// </div>
//
// TODO: replacing existing styles instead of appending, in case this is called multiple times
//
CategorySelector.prototype.refreshCategoryStyles = function () {
    var elHead = document.getElementsByTagName('head')[0];
    var elStyles = elHead.querySelector('#dynamicCategoryStyles');
    if (!elStyles) {
        elStyles = document.createElement('style');
        elStyles.id = 'dynamicCategoryStyles';
        elStyles.setAttribute('type', 'text/css');
        elHead.appendChild(elStyles);
    } else {
        while (elStyles.childNodes.length > 0) {
            elStyles.removeChild(elStyles.childNodes[0]);
        }
    }
    var rules = '';
    for (var currentIndex in this.categories) {
        var currentCategory = this.categories[currentIndex];
        rules += '#carousel.category-' + currentCategory.id + ' .outfit_container:not(.category-' + currentCategory.id + ") { display: none; }\n";
    }
    elStyles.appendChild(document.createTextNode(rules));
}

CategorySelector.prototype.setCategory = function (category) {
    this.dropdown.selectByValue(category);
    if (this.dropdown.getSelectedValue() != category) {
        this.fireCategoryChange();
    }
}

CategorySelector.prototype.refreshCategories = function (newCategories) {
    newCategories = newCategories || this.categories;
    var previousCategory = this.dropdown.getSelectedValue();
    this.dropdown.removeAllOptions();
    this.categories = newCategories;
    for (var i in this.categories) {
        var category = this.categories[i];
        if (!category.removed) {
            this.insertNewCategory(category.id, category.text, category.privacy, category.total_outfits);
        } else {
            this.categories.splice(i, 1);
        }
    }

    this.refreshCategoryStyles(this.categories);
    if (this.categories.length) {
        this.setCategory(previousCategory);
    }
}

CategorySelector.prototype.isValidCategoryId = function (categoryId) {
    for each (var category in this.categories) {
        if (category.id == categoryId) {
            return true;
        }
    }

    return false;
}

CategorySelector.prototype.restorePreviousCategory = function () {
    var previousCategory = this.imvu.call('getLocalStoreValue', 'Outfits.Category', 0);
    if (this.isValidCategoryId(previousCategory)) {
        this.setCategory(previousCategory);
    }
}

CategorySelector.prototype.getCategoryById = function (id) {
    for each (var category in this.categories) {
        if (category.id == id) {
            return category;
        }
    }
}

CategorySelector.prototype.addOutfitsToCategory = function (categoryId, total) {
    var category = this.getCategoryById(categoryId);
    if (category) {
        category.total_outfits += total;
    }
}

CategorySelector.prototype.removeCategory = function (categoryId) {
    var category = this.getCategoryById(categoryId);
    if (category) {
        this.dropdown.removeOptionByValue(categoryId);
        this.refreshCategoryStyles();
        this.fireCategoryChange();
        return true;
    }
    return false;
}

CategorySelector.prototype.getSelectedValue = function () {
    return this.dropdown.getSelectedValue();
}

CategorySelector.prototype.selectByValue = function (value) {
    this.dropdown.selectByValue(value);
}

CategorySelector.prototype.getSelectedLabel = function () {
    return this.dropdown.getSelectedLabel();
}

CategorySelector.prototype.getLabelByValue = function (value) {
    return this.dropdown.getLabelByValue(value);
}
function Toolbar(spec) {
    this.rootElement = spec.rootElement || rootElementMustBeSpecified;
    this.categorySelector = spec.categorySelector || categorySelectorMustBeSpecified;
    this.imvu = spec.imvu || imvuMustBeSpecified;

    this.evtFilterChange = new YAHOO.util.CustomEvent('filterChange');
    this.evtCategoriesUpdated = new YAHOO.util.CustomEvent('categoriesUpdated');
    this.btnSave = this.rootElement.querySelector('#save');
    this.btnManage = this.rootElement.querySelector('#manage');
    this.elFilterContainer = this.rootElement.querySelector('.filters');
    this.btnFilterGa = this.elFilterContainer.querySelector('.btn_ga');
    this.btnFilterAll = this.elFilterContainer.querySelector('.btn_all');
    this.btnFilterAp = this.elFilterContainer.querySelector('.btn_ap');
    this.elFilters = [this.btnFilterGa, this.btnFilterAll, this.btnFilterAp];

    $('.close').click(function() { this.imvu.call('closeActiveTool'); }.bind(this));

    this.disableManageOutfitsButton();
    this.disableSaveOutfitsButton();

    new ImvuButton(this.btnManage, {small: true, grey: true, callback: this.clickManageOutfits.bind(this)});

    Event.on(this.elFilters, 'click', function (e) { this.clickFilter(e.target); }.bind(this));
    new ImvuButton('#save', {small: true})
}

Toolbar.prototype.onCategoriesUpdated = function (callback) {
    this.evtCategoriesUpdated.subscribe(callback);
}

Toolbar.prototype.clickFilter = function (el) {
    Dom.batch(this.elFilters, function (elt) { $(elt).removeClass('active'); });
    $(el).addClass('active');

    var activeFilter = false;
    if (el === this.btnFilterGa) {
        activeFilter = 'ga';
        this.imvu.call('setLocalStoreValue', 'Outfits.Filter', 'ga');
    } else if (el == this.btnFilterAp) {
        activeFilter = 'ap';
        this.imvu.call('setLocalStoreValue', 'Outfits.Filter', 'ap');
    } else {
        this.imvu.call('setLocalStoreValue', 'Outfits.Filter', 'all');
    }

    this.evtFilterChange.fire({filter: activeFilter});
}

Toolbar.prototype.setInitialFilter = function () {
    if (this.imvu.call('isTeen') || !this.imvu.call('hasAccessPass')) {
        this.elFilterContainer.style.display = 'none';
        this.clickFilter(this.btnFilterAll);
    } else {
        this.elFilterContainer.style.display = 'block';
        previousFilter = this.imvu.call('getLocalStoreValue', 'Outfits.Filter', 'all');

        if (previousFilter == 'ap') {
            this.clickFilter(this.btnFilterAp);
        } else if (previousFilter == 'ga') {
            this.clickFilter(this.btnFilterGa);
        } else {
            this.clickFilter(this.btnFilterAll);
        }
    }
}

Toolbar.prototype.onFilterChange = function (callback) {
    this.evtFilterChange.subscribe(callback);
}

Toolbar.prototype.disableSaveOutfitsButton = function () {
    $(this.btnSave).addClass('disabled');
}

Toolbar.prototype.enableSaveOutfitsButton = function () {
    $(this.btnSave).removeClass('disabled');
}

Toolbar.prototype.disableManageOutfitsButton  = function () {
    $(this.btnManage).addClass('disabled');
}

Toolbar.prototype.enableManageOutfitsButton = function () {
    $(this.btnManage).removeClass('disabled');
}

Toolbar.prototype.isManageOutfitsButtonDisabled = function () {
    return $(this.btnManage).hasClass('disabled');
}

Toolbar.prototype.clickManageOutfits = function (e) {
    if (this.isManageOutfitsButtonDisabled()) {
        return;
    }

    var outfitsToCategories = {};
    $('#outfit_list .outfit_container').each(function (index, elOutfit) {
        var id = elOutfit.id;
        var outfitId = parseInt(/outfit-(\d+)/.exec(id)[1], 10);

        var className = elOutfit.getAttribute('class');
        var categoryId = parseInt(/category-(\d+)/.exec(className)[1], 10);
        outfitsToCategories[outfitId] = categoryId;
    });

    var result = this.imvu.call('showManageOutfitsDialog', outfitsToCategories);
    if (result === null) {
        // exit the client without closing the dialog
    } else {
        this.evtCategoriesUpdated.fire({
            categories: result.categories,
            outfitsToCategories: result.outfitsToCategories
        });
    }
}

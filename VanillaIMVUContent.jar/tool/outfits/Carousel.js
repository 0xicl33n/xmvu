OUTFIT_WIDTH = 100;
OUTFIT_HEIGHT = 189;

function Carousel(spec) {
    this.rootElement = spec.rootElement || rootElementMustBeSpecified;
    this.categorySelector = spec.categorySelector || categorySelectorMustBeSpecified;
    this.imvu = spec.imvu || imvuMustBeSpecified;
    this.scrollDuration = (typeof spec.scrollDuration == 'undefined') ? 0 : spec.scrollDuration;
    this.eventBus = spec.eventBus || eventBusMustBeSpecified;
    this.defaultOutfitId = spec.defaultOutfitId;

    this.eventBus.register('OutfitUpdated', this.onOutfitUpdated.bind(this));

    this.totalVisibleOutfits = 0;
    this.elOutfitListContainer = this.rootElement.querySelector('#outfit_list_container');
    this.elOutfitList = this.rootElement.querySelector('#outfit_list');
    this.motion = new YAHOO.util.Motion(this.elOutfitList, {}, this.scrollDuration, YAHOO.util.Easing.easeOut);
    this.evtOutfitsAdded = new YAHOO.util.CustomEvent('outfitsAdded');
    this.elPageRight = this.rootElement.querySelector('#page_right');
    this.elPageLeft = this.rootElement.querySelector('#page_left');
    this.elSpinner = this.rootElement.querySelector('#spinner');
    this.outfitsDataSource = {};

    this.sideView = this.imvu.call('isSideView');
    if (this.sideView) {
        $(this.elOutfitListContainer).addClass('tall');
        $(this.elPageRight).hide();
        $(this.elPageLeft).hide();
        this.dotPaginator = {recalc: function(){}, setFull: function(){}};
    } else {
        this.dotPaginator = new DotPaginator({
            rootElement: this.rootElement.querySelector('#dot_paginator'),
            carousel: {
                getNumPages: this.getNumPages.bind(this),
                getOutfitWidth: this.getOutfitWidth,
                getPageWidth: this.getPageWidth.bind(this),
                getScrollEdge: this.getScrollEdge.bind(this),
                scroll: this.scroll.bind(this),
                getRowHeight: this.getRowHeight.bind(this)
            }
        });
    }

    Event.on(this.elOutfitList, 'click', this.clickOutfitList.bind(this));
    Event.on(this.elPageRight, 'click', function (e) { this.scroll(-this.getRowHeight()); }.bind(this));
    Event.on(this.elPageLeft, 'click', function (e) { this.scroll(this.getRowHeight()); }.bind(this));

    window.onresize = this.onResize.bind(this);

    this.motion.onComplete.subscribe(function () {
        this.dotPaginator.recalc();
    }.bind(this));
}

Carousel.prototype.onResize = function (e) {
    this.recalcTotalVisibleOutfits();
    this.refreshPagingArrows();
    this.dotPaginator.recalc();
};

Carousel.prototype.getTotalVisibleOutfits = function () {
    return this.totalVisibleOutfits;
}

Carousel.prototype.getOutfitWidth = function () {
    return OUTFIT_WIDTH;
}

Carousel.prototype.onOutfitsAdded = function (callback) {
    this.evtOutfitsAdded.subscribe(callback);
}

Carousel.prototype.getOutfits = function () {
    return this.elOutfitList.querySelectorAll('div[id^="outfit-"]');
}

Carousel.prototype.getOutfitsPerColumn = function() {
    return Math.floor(this.getPageHeight() / OUTFIT_HEIGHT);
}

Carousel.prototype.getNumPages = function() {
    return Math.ceil($(this.elOutfitList).height() / this.getRowHeight());
}

Carousel.prototype.getPageWidth = function () {
    return parseInt(Dom.getStyle(this.elOutfitListContainer, 'width'), 10);
}

Carousel.prototype.getPageHeight = function () {
    return parseInt(Dom.getStyle(this.elOutfitListContainer, 'height'), 10);
}

Carousel.prototype.getRowHeight = function () {
    return Math.floor(this.getPageHeight()/OUTFIT_HEIGHT)*OUTFIT_HEIGHT;
}

// note: this edge should always be <= 0. as you scroll right, it decreases
Carousel.prototype.getScrollEdge = function () {
    return parseInt(Dom.getStyle(this.elOutfitList, 'top'), 10);
}

Carousel.prototype.getTotalOutfits = function () {
    return this.getOutfits().length;
}

Carousel.prototype.addToTotalVisibleOutfits = function (delta) {
    this.totalVisibleOutfits += delta;
}

Carousel.prototype.refreshTotalVisibleOutfits = function () {
    var outfitsPerRow = Math.floor(this.getPageWidth()/OUTFIT_WIDTH);
    var width = outfitsPerRow*OUTFIT_WIDTH;
    var height = Math.ceil(this.totalVisibleOutfits/outfitsPerRow)*OUTFIT_HEIGHT;
    $(this.elOutfitList).width(width);
    $(this.elOutfitList).height(height);
}

Carousel.prototype.recalcTotalVisibleOutfits = function () {
    var total = 0;
    var countForPage = 0;
    $(this.getOutfits()).each(function (index, outfit) {
        if (Dom.getStyle(outfit, 'display') != 'none') {
            total += 1;
            countForPage += 1;
        }
    });
    this.totalVisibleOutfits = total;
    this.refreshTotalVisibleOutfits();
}

Carousel.prototype.resetScrollEdge = function () {
    if (this.motion) {
        this.motion.stop();
    }
    Dom.setStyle(this.elOutfitList, 'top', '0px');
}

Carousel.prototype.refreshPagingArrows = function (scrollEdge) {
    if (typeof scrollEdge === 'undefined') {
        scrollEdge = this.getScrollEdge();
    }
    $(this.elPageLeft).removeClass('hidden');
    $(this.elPageRight).removeClass('hidden');
    var ylimit = Math.ceil($(this.elOutfitList).height()/this.getPageHeight())*this.getPageHeight();
    if (scrollEdge >= 0) {
        $(this.elPageLeft).addClass('hidden');
        if (ylimit < this.getPageHeight()) {
            $(this.elPageRight).addClass('hidden');
        }
    }
    if (scrollEdge - this.getPageHeight() <= -ylimit) {
        $(this.elPageRight).addClass('hidden');
    }
}

Carousel.prototype.getOutfitContainer = function (id) {
    return this.elOutfitList.querySelector('#outfit-' + id);
}

Carousel.prototype.isOutfitMarkedAP = function (id) {
    var elOutfitContainer = this.getOutfitContainer(id);
    return $(elOutfitContainer).hasClass('ap') && !$(elOutfitContainer).hasClass('ga');
}

Carousel.prototype.isOutfitMarkedGA = function (id) {
    var elOutfitContainer = this.getOutfitContainer(id);
    return $(elOutfitContainer).hasClass('ga') && !$(elOutfitContainer).hasClass('ap');
}

Carousel.prototype.createOutfitContainer = function (id) {
    var elOutfitContainer = document.createElement('div');
    elOutfitContainer.id = 'outfit-' + id;
    elOutfitContainer.setAttribute('outfit-id', id);
    $(elOutfitContainer).addClass('outfit_container');

    this.outfitsDataSource[id] = {id: id, elOutfitContainer: elOutfitContainer};
    return elOutfitContainer;
}

Carousel.prototype.setDefaultOutfitId = function (id) {
    $('.default').removeClass('default');
    this.defaultOutfitId = id;
    $('#outfit-'+id, this.elOutfitList).addClass('default');
}

Carousel.prototype.addOutfitInfoToDataSource = function (args) {
    var id = args.id || idRequired;
    var outfit = this.outfitsDataSource[id];
    outfit.id = id;
    outfit.imageUrl = args.imageUrl;
    outfit.name = args.name;
    outfit.description = args.description;
    outfit.isAp = args.isAp;
    outfit.pids = args.pids;
    outfit.categoryId = args.categoryId;
    outfit.dirty = args.dirty;
    return outfit;
}

Carousel.prototype.prepopulateOutfitContainers = function (outfitIds) {
    for each (var id in outfitIds) {
        this.elOutfitList.appendChild(this.createOutfitContainer(id));
    }
}

Carousel.prototype.toggleSavingOutfitSpinner = function (enabled) {
    $(this.elSpinner).toggleClass('in_progress', !enabled);
    this.elSpinner.enabled = enabled;
}

Carousel.prototype.refreshApIcon = function (outfit) {
    $(outfit.elOutfitContainer).toggleClass('ap', !!outfit.isAp)
                               .toggleClass('ga',  !outfit.isAp);
}

Carousel.prototype.getOutfitData = function (id) {
    var outfit = this.outfitsDataSource[id];
    if (!outfit) {
        throw new Error('outfit not found in data source');
    }
    return outfit;
}

Carousel.prototype.scroll = function (delta) {
    if (this.motion && this.motion.isAnimated()) {
        return;
    }

    var y1 = this.getScrollEdge();
    var y2 = y1 + delta;

    console.log("Scrolling: ", delta, y1, y2);

    var ylimit = Math.ceil($(this.elOutfitList).height()/this.getPageHeight())*this.getPageHeight();
    if (ylimit < this.getPageHeight()) {
        ylimit = 0;
    } else {
        ylimit -= this.getPageHeight();
        ylimit = -ylimit;
    }

    if (y2 > 0) {
        y2 = 0;
    } else if (y2 < ylimit) {
        y2 = ylimit;
    }

    this.refreshPagingArrows(y2);

    this.motion.attributes = {top: {from: y1, to: y2}};
    this.motion.animate();

    if (!this.scrollDuration) {
        this.motion.stop(true);
    }
}

Carousel.prototype.showOutfitCard = function (id) {
    var outfit = this.getOutfitData(id);

    this.imvu.call('showOutfitCard', {
        id: outfit.id,
        imageUrl: outfit.imageUrl,
        name: outfit.name,
        description: _T(outfit.description),
        isAp: outfit.isAp,
        categoryId: outfit.categoryId,
        cid: this.imvu.call('getCustomerId'),
        categories: this.categorySelector.getCategories(),
        isDirty: outfit.dirty,
        pids: outfit.pids
    });
}

Carousel.prototype.generateOutfitMarkup = function (args) {
    var outfit = this.addOutfitInfoToDataSource(args);

    var el = outfit.elOutfitContainer;
    var isDefault = this.imvu.call('shouldSeeFeature', 'defaultOutfitChanges') && outfit.id == this.defaultOutfitId;
    el.className = ['outfit_container', 'category-' + outfit.categoryId, outfit.isAp ? 'ap' : 'ga', isDefault ? 'default': ''].join(' ');

    // totally hacky. replacing this w/ classes soon
    var elOutfitDirtyStyle = ' style="display:block;" ';
    var elDisabledOutfitDirtyStyle = ' style="display:none;" ';
    if (outfit.dirty) {
        elOutfitDirtyStyle = ' style="display:none;" ';
        elDisabledOutfitDirtyStyle = ' style="display:block;" ';
    }
    el.innerHTML = [
        '<div class="outfit"' + elOutfitDirtyStyle + '>',
            '<div class="default-label">Default</div>',
            '<img class="thumb" src="' + outfit.imageUrl + '" />',
            '<img class="info" src="../../img/icon_16_info.png" />',
            '<img class="ap" src="../../img/icon_ap_small.png" />',
            '<div class="put_on_container"><div class="put_on" id="put_on_btn_'+ args.id+'">'+_T("Put On")+'</div></div>',
        '</div>',
        '<div class="disabled-outfit"' + elDisabledOutfitDirtyStyle + '>',
            '<div>',
                '<img src="../../img/icon_24_warning.png" /><br/>',
                _T("This outfit")+'<br/>'+_T("is disabled.")+'<br/><span class="more-info">'+_T("More info")+'</span>',
            '</div>',
        '</div>'
    ].join('');

    return outfit;
}

Carousel.prototype.onOutfitCategoryChanged = function (outfitId, newCategoryId) {
    var outfit = this.getOutfitData(outfitId);
    outfit.categoryId = newCategoryId;
}

Carousel.prototype.deleteOutfit = function (id) {
    var outfit = this.getOutfitData(id);
    $(outfit.elOutfitContainer).remove();

    delete this.outfitsDataSource[id];
    this.categorySelector.addOutfitsToCategory(outfit.categoryId, -1);
    this.categorySelector.refreshCategories();
    this.recalcTotalVisibleOutfits();
    this.refreshPagingArrows();
    this.dotPaginator.recalc();
}

Carousel.prototype.clickOutfitList = function (evt) {
    var elTarget = Event.getTarget(evt);
    var $elOutfitContainer = $(elTarget).closest('.outfit_container');
    if (!$elOutfitContainer.length) {
        return;
    }
    var id = parseInt($elOutfitContainer.attr('outfit-id'), 10);
    var outfit = this.getOutfitData(id);
    if (outfit.dirty) {
        this.showOutfitCard(id);
    }

    switch (elTarget.className) {
    case 'info':
        this.showOutfitCard(id);
        break;

    case 'put_on':
    case 'start':
    case 'middle':
    case 'text':
    case 'end':
        /* fall through for above cases */
    case 'thumb':
        this.imvu.call('putOnOutfit', outfit.pids);
    }
}

Carousel.prototype.onOutfitUpdated = function (eventName, data) {
    if (data.update.delete) {
        return;
    }

    var id = data.id;
    if (!this.outfitsDataSource[id]) {
        // may happen - open outfit tool in two modes, save outfit in one mode, edit from outfitCard, and save
        return;
    }

    var outfit = this.getOutfitData(id);

    if (data.update.saved_info) {
        saved_info = data.update.saved_info;

        outfit.name = saved_info.name;
        outfit.description = saved_info.description;

        outfit.isAp = saved_info.is_ap;
        this.refreshApIcon(outfit);

        // if category changed, make sure it's retagged with the right class for filtering
        if (outfit.categoryId != saved_info.categoryId) {
            var oldCategoryId = outfit.categoryId;
            var newCategoryId = saved_info.categoryId;
            $(outfit.elOutfitContainer).removeClass('category-' + oldCategoryId);
            $(outfit.elOutfitContainer).addClass('category-' + newCategoryId);
            this.categorySelector.addOutfitsToCategory(oldCategoryId, -1);
            this.categorySelector.addOutfitsToCategory(newCategoryId, +1);
            outfit.categoryId = newCategoryId;
            this.categorySelector.refreshCategories();
            this.recalcTotalVisibleOutfits();
        }

        if ('new_image' in saved_info) {
            outfit.imageUrl = saved_info.new_image;
        }
        if ('pids_not_removed' in saved_info) {
            outfit.pids = saved_info.pids_not_removed;
        }
    }
}

Carousel.prototype.insertNewOutfitMarkup = function (args) {
    var elOutfitContainer = this.createOutfitContainer(args.id);

    this.generateOutfitMarkup(args);

    var head = this.elOutfitList.querySelector('.outfit_container:nth-child(1)');

    if (!head) {
        this.elOutfitList.appendChild(elOutfitContainer);
    } else {
        this.elOutfitList.insertBefore(elOutfitContainer, head);
    }

    this.recalcTotalVisibleOutfits();
    this.refreshPagingArrows();
    this.dotPaginator.recalc();

    new ImvuButton('#put_on_btn_' + args.id, {small: true, grey: true});
}

Carousel.prototype.setTotalVisibleOutfits = function (n) {
    this.totalVisibleOutfits = n;
}

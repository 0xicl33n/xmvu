var Dom = YAHOO.util.Dom;
var Event = YAHOO.util.Event;

LOAD_BATCH_SIZE = 50

function OutfitsTool(spec) {
    this.rootElement = spec.rootElement || rootElementMustBeSpecified;
    this.eventBus = spec.eventBus;
    this.imvu = spec.imvu;
    this.network = spec.network;
    this.shouldShowSaveOutfitButton = spec.shouldShowSaveOutfitButton

    this.currentCategoryClassFilter = null;
    this.currentLoadState = 'initial';
    this.areOutfitsDownloaded = false;
    this.areCategoriesDownloaded = false;
    this.elClickHereToSave = this.rootElement.querySelector('#click_here_to_save');
    this.elTryAgain = this.rootElement.querySelector('#try-again');

    this.categorySelector = new CategorySelector({
        rootElement: this.rootElement.querySelector('#category_selector'),
        imvu: this.imvu,
    });
    this.categorySelector.onCategoryChange(this.onCategoryChangeCallback.bind(this));

    this.toolbar = new Toolbar({
        rootElement: this.rootElement.querySelector('#toolbar'),
        categorySelector: this.categorySelector,
        eventBus: this.eventBus,
        imvu: this.imvu,
    });

    this.carousel = new Carousel({
        categorySelector: this.categorySelector,
        rootElement: this.rootElement.querySelector('#carousel'),
        scrollDuration: spec.scrollDuration,
        imvu: this.imvu,
        eventBus: this.eventBus,
        defaultOutfitId: this.imvu.call('getDefaultOutfitId')
    });
    this.eventBus.register('DefaultOutfitIdUpdated', this.onDefaultOutfitUpdated.bind(this));

    Event.on(window, 'resize', this.adjustCTAPosition.bind(this, true));

    this.eventBus.register('OutfitUpdated', this.onOutfitUpdated.bind(this));
    this.eventBus.register('ServerEvent.OutfitAddedToInventory', function (eventName, info) {
        this.refreshWithRecentlyAddedOutfit(info.outfit_id);
    }.bind(this));

    this.toolbar.onFilterChange(function (type, args) {
        var o = args[0];
        $(this.carousel.rootElement).toggleClass('ga', o.filter === 'ga');
        $(this.carousel.rootElement).toggleClass('ap', o.filter === 'ap');

        this.carousel.resetScrollEdge();
        this.carousel.recalcTotalVisibleOutfits();
        this.carousel.refreshPagingArrows();
        this.carousel.dotPaginator.recalc();
    }.bind(this));

    this.toolbar.onCategoriesUpdated(function (type, args) {
        var o = args[0];

        $(this.carousel.getOutfits()).each(function (index, elOutfit) {
            var outfitId = /outfit-(\d+)/.exec(elOutfit.id)[1];
            if ((typeof o.outfitsToCategories[outfitId] === 'undefined') ||
                (o.outfitsToCategories[outfitId] === null)) { // deleted
                elOutfit.parentNode.removeChild(elOutfit);
            } else { // potentially recategorized
                var expectedCategory = 'category-' + o.outfitsToCategories[outfitId];
                var currentCategory = /category-\d+/.exec(elOutfit.getAttribute('class'))[0];
                $(elOutfit).removeClass(currentCategory);
                $(elOutfit).addClass(expectedCategory);
                if (expectedCategory != currentCategory) {
                    this.carousel.onOutfitCategoryChanged(outfitId, o.outfitsToCategories[outfitId]);
                }
            }
        }.bind(this));

        // remove deleted categories
        $(o.categories).each(function (i, updatedCategory) {
            if (updatedCategory && updatedCategory.removed) {
                o.categories.splice(i, 1);
                updatedCategory.removed = undefined;
            }
        });

        this.categorySelector.refreshCategories(o.categories);
    }.bind(this));

    this.toolbar.setInitialFilter();

    var HAS_BEEN_DISMISSED = 'outfits-tool.earn-credits-panel.has-been-dismissed';
    this.$earnCredits = $(this.rootElement).find('#earn_credits');
    this.$earnCredits.toggle(this.imvu.call('isQA') && !this.imvu.call('getLocalStoreValue', HAS_BEEN_DISMISSED, false));
    this.$earnCreditsX = $(this.rootElement).find('#earn_credits #close_button');
    this.$earnCreditsX.click(function () {
        this.$earnCredits.hide();
        this.imvu.call('setLocalStoreValue', HAS_BEEN_DISMISSED, true);
        this.carousel.onResize(null);
    }.bind(this));
}

OutfitsTool.prototype.getCurrentLoadState = function() {
    return this.currentLoadState;
}

OutfitsTool.prototype.myServiceRequest = function (spec) {
    spec.network = this.network;
    spec.imvu = this.imvu;
    serviceRequest(spec);
}

OutfitsTool.prototype.getCurrentCategoryClassFilter = function () {
    return this.currentCategoryClassFilter;
}

OutfitsTool.prototype.showSpinners = function () {
    this.carousel.toggleSavingOutfitSpinner(false);
}

OutfitsTool.prototype.hideSpinners = function () {
    this.carousel.toggleSavingOutfitSpinner(true);
}

OutfitsTool.prototype.isTryAgainVisible = function () {
    return $(this.rootElement).hasClass('try-again') && !$(this.elTryAgain).hasClass('hidden');
}

OutfitsTool.prototype.pleaseTryAgain = function () {
    $(this.rootElement).addClass('try-again');
    $(this.elTryAgain).removeClass('hidden');
    function getFade(el, opacity) {
        return new YAHOO.util.Anim(el, {opacity: opacity}, 0.33, YAHOO.util.Easing.easeIn);
    }
    Dom.batch(this.rootElement.querySelectorAll('#toolbar > div'), function (el) {
        getFade(el, {from: 1, to: 0}).animate();
    });
    getFade(this.elTryAgain, {from: 0, to: 1}).animate();
    this.currentLoadState = 'load_error';
}

OutfitsTool.prototype.loadOutfitIds = function (callback) {
    this.myServiceRequest({
        method: 'GET',
        uri: '/api/outfit_ids.php',
        callback: function (response, error) {
            if (error) {
                this.pleaseTryAgain();
            } else {
                callback(response.result);
            }
        }.bind(this)
    });
}

OutfitsTool.prototype.onCategoryChangeCallback = function (type, args) {
    var o = args[0];

    if (this.currentCategoryClassFilter) {
        $(this.carousel.rootElement).removeClass(this.currentCategoryClassFilter);
    }
    this.currentCategoryClassFilter = 'category-' + o.categoryId;
    $(this.carousel.rootElement).addClass(this.currentCategoryClassFilter);

    this.carousel.resetScrollEdge();
    this.carousel.recalcTotalVisibleOutfits();
    this.carousel.refreshPagingArrows();
    this.carousel.dotPaginator.recalc();
}

OutfitsTool.prototype.showClickHereToSaveCTA = function () {
    $(this.elClickHereToSave).addClass('cta');
}

OutfitsTool.prototype.hideClickHereToSaveCTA = function () {
    $(this.elClickHereToSave).removeClass('cta');
}

OutfitsTool.prototype.saveCurrentOutfit = function (e) {
    if (this.currentLoadState == 'loaded') {
        this.showSpinners();
        this.imvu.call('saveOutfitFromTool', this.categorySelector.getSelectedValue());
    }
}

OutfitsTool.prototype.onOutfitBatchesOrCategoriesDownloaded = function () {
    if (this.areOutfitsDownloaded && this.areCategoriesDownloaded) {
        this.currentLoadState = 'loaded';
        IMVU.log("OutfitsTool finished loading");
        if (this.shouldShowSaveOutfitButton) {
            if (this.carousel.getTotalOutfits() === 0) {
                this.showClickHereToSaveCTA();
                this.elClickHereToSave.style.left = '' + document.body.clientWidth - 200 + 'px';
            }
            this.toolbar.enableSaveOutfitsButton();
            Event.on(this.toolbar.btnSave, 'click', this.saveCurrentOutfit.bind(this));
        }
        this.toolbar.enableManageOutfitsButton();
        this.onCategoryChangeCallback(null, [{categoryId:this.categorySelector.getSelectedValue()}]);
    }
}

OutfitsTool.prototype.loadOutfitCategories = function (callback) {
    this.myServiceRequest({
        method: 'GET',
        uri: '/api/outfit_categories.php',
        callback: function (response, error) {
            if (error) {
                this.pleaseTryAgain();
            } else {
                this.categorySelector.refreshCategories(response.result);
                this.categorySelector.restorePreviousCategory();
                callback(response.result);

                IMVU.log("finished downloading outfit categories");
                this.areCategoriesDownloaded = true;
                this.onOutfitBatchesOrCategoriesDownloaded();
            }
        }.bind(this)
    });
}

OutfitsTool.prototype.loadOutfitsBatchAndQueueNextBatch = function (outfitIds, outfitIdsLoaded, chunkSize, callback) {
    this.currentLoadState = 'loading_outfits_from_' + outfitIdsLoaded.toString() + "_chunkSize+" + chunkSize.toString();
    var chunkOfIds = outfitIds.slice(outfitIdsLoaded, outfitIdsLoaded + chunkSize);
    this.myServiceRequest({
        method: 'GET',
        uri: '/api/outfits.php?batch=' + chunkOfIds.join(','),
        callback: function (response, error) {
            if (error) {
                this.pleaseTryAgain();
            } else {
                callback(response.result);
                outfitIdsLoaded += response.result.length;
                this.carousel.dotPaginator.setFull(outfitIdsLoaded / outfitIds.length);
                if (outfitIdsLoaded < outfitIds.length) {
                    this.loadOutfitsBatchAndQueueNextBatch(outfitIds, outfitIdsLoaded, chunkSize, callback);
                } else {
                    IMVU.log("finished downloading outfits (all batches)");
                    this.areOutfitsDownloaded = true;
                    this.onOutfitBatchesOrCategoriesDownloaded();
                }
            }
        }.bind(this)
    });
}

OutfitsTool.prototype.loadOutfitsInBatches = function (outfitIds, chunkSize) {
    this.carousel.prepopulateOutfitContainers(outfitIds);
    this.loadOutfitsBatchAndQueueNextBatch(outfitIds, 0, chunkSize, function (result) {
        for each (var outfit in result) {
            this.carousel.generateOutfitMarkup({
                id:outfit.user_outfits_id,
                imageUrl:outfit.outfit_image,
                name:outfit.outfit_name,
                description:outfit.description,
                isAp:(outfit.restricted == '1') ? 1 : 0,
                pids:outfit.pids.join(' '),
                categoryId:outfit.user_outfits_category_id
            });

            new ImvuButton('#put_on_btn_' + outfit.user_outfits_id, {small: true, grey: true});

            // TODO: also need to take into account the current filter
            if (outfit.user_outfits_category_id == this.categorySelector.getSelectedValue()) {
                this.carousel.addToTotalVisibleOutfits(+1);
            }
        }
        this.carousel.refreshTotalVisibleOutfits();
        this.carousel.refreshPagingArrows();
        this.carousel.dotPaginator.recalc();
    }.bind(this));
}

OutfitsTool.prototype.load = function () {
    this.currentLoadState = 'loading_outfit_ids';
    this.loadOutfitIds(function (outfitIds) {
        this.currentLoadState = 'loaded_' + outfitIds.length.toString() + '_ids';
        this.loadOutfitCategories(function (categories) {
            this.loadOutfitsInBatches(outfitIds, LOAD_BATCH_SIZE);
        }.bind(this));
    }.bind(this));
}

OutfitsTool.prototype.adjustCTAPosition = function () {
    this.elClickHereToSave.style.left = '' + document.body.clientWidth - 200 + 'px';
}

OutfitsTool.prototype.deleteOutfit = function (id) {
    this.carousel.deleteOutfit(id);
}

OutfitsTool.prototype.updateImageUrl = function (outfitId, newImageUrl) {
    var elOutfitToUpdate = this.rootElement.querySelector('#outfit-' + outfitId);
    var imgThumb = elOutfitToUpdate.querySelector('img.thumb');
    imgThumb.src = newImageUrl;
}

OutfitsTool.prototype.onOutfitUpdated = function (eventName, data) {
    var id = data.id;

    if (this.rootElement.querySelector('#outfit-' + id) === null) {
        // may happen - open outfit tool in two modes, save outfit in one mode, edit from outfitCard, and save
        return;
    }

    if (data.update.delete) {
        this.deleteOutfit(id);
    } else if (data.update.saved_info) {
        if (data.update.saved_info.new_image) {
            this.updateImageUrl(id, data.update.saved_info.new_image);
        }
    }
}

OutfitsTool.prototype.onDefaultOutfitUpdated = function (eventName, data) {
    this.imvu.call('log', 'Nasty '+ eventName + ' ' + data.id);
    this.carousel.setDefaultOutfitId(data.id);
}

OutfitsTool.prototype.refreshWithRecentlyAddedOutfit = function (outfitId) {
    this.showSpinners();
    this.myServiceRequest({
        method: 'GET',
        uri: '/api/outfits.php?outfit_id=' + outfitId,
        callback: function (response, error) {
            if (error) {
                this.imvu.call('log', 'refreshWithRecentlyAddedOutfit error getting outfit: ' + error);
            } else {
                var result = response.result;
                this.carousel.insertNewOutfitMarkup({
                    id: result.user_outfits_id,
                    imageUrl: result.outfit_image,
                    name: result.outfit_name,
                    description: result.description,
                    isAp: parseInt(result.restricted, 10),
                    pids: result.pids.join(' '),
                    categoryId: result.user_outfits_category_id
                });
                this.categorySelector.addOutfitsToCategory(result.user_outfits_category_id, +1);
                this.categorySelector.refreshCategories();
            }
            this.hideSpinners();
        }.bind(this)
    });
}

// This is called by Python after the snapshot has been saved.
OutfitsTool.prototype.onSnapshotTaken = function (snapshotResult) {
    this.hideSpinners();

    if (snapshotResult.error) {
        if (snapshotResult.error == "Avatar") {
            this.imvu.call('showConfirmationDialog', _T("Avatar product missing"), _T("There was a problem saving your outfit.  Your avatar product is invalid or could not be loaded."));
        } else {
            this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("There was a problem saving your outfit."));
        }

        return;
    }

    this.hideClickHereToSaveCTA();
}


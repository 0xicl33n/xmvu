RESIZE_WIDTH = 453

function OutfitCard(spec) {
    this.$root = $(spec.rootElement);
    this.dialogInfo = spec.info || {};
    this.imvu = spec.imvu;
    this.network = spec.network;
    this.pulseDuration = (typeof spec.pulseDuration === 'undefined') ? 450 : spec.pulseDuration;
    this.removePids = this.dialogInfo.removePids || [];
    this.bundle = {};

    this.hasInitialPreviewImage = false;
    this.removalDialogConfirmed = false;
    this.$spinner = this.$root.find('#spinner');
    this.$productTemplate = this.$root.find('#product_template');

    this.endDialogResult = {};

    this.wireCloseButton();
    this.wireBottomRowLinksAndButtons();
    this.wireSnapshotImage();
    this.wireOutfitName();
    this.wireAuthor();
    this.wireDescription();
    this.wireCategoryDropDown();
    this.wireProductList();

    this.panelSlideEasing = 'easeOutExpo';
    this.panelSlideSpeed = 'slow';
    this.isSellOutfitsEnabled = this.imvu.call('isSellOutfitsEnabled');
    this.shouldShowSellOutfitConfirmation = this.imvu.call('getLocalStoreValue', 'outfit-card.show-sale-confirmation', true);

    this.wireSellOutfitMainPanel();
    this.wireSellOutfitConfirmationPanel();
    this.wireSellOutfitSuccessPanel();
    this.wireSellOutfitNotCreatorPanel();
    this.wireSellOutfitNotBundleablePanel();
    this.wireSellOutfitCanBeSoldPanel();
    this.wireSellOutfitGenderRadioButtons();
    this.wireSellOutfitGenderHelp();

    this.wireDefaultOutfitButton();

    this.imvu.call('resize', RESIZE_WIDTH, document.body.offsetHeight + 2);
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

OutfitCard.prototype.wireProductList = function () {
    this.$elProductList = this.$root.find('#product_list');
    this.$elProductListFooter = this.$root.find('#product_list_footer');
}

OutfitCard.prototype.cantBeSoldClick = function () {
    this.$bdSlideThis.animate({left: -RESIZE_WIDTH}, this.panelSlideSpeed, this.panelSlideEasing);
}

OutfitCard.prototype.setAsDefaultClick = function () {
    this.isDefaultSet = true;
    this.$isDefault.toggle(this.isDefaultSet);
    this.$setAsDefault.toggle(!this.isDefaultSet);
}

OutfitCard.prototype.sellClick = function () {
    if (this.getAllPidsRemoved().length) {
        this.saveChanges({closeDialog: false});
    }

    if (this.clickSellHint) {
        this.imvu.call('setLocalStoreValue', 'outfit-card.click-sell-hint.dismissed', true);
        this.clickSellHint.dismiss();
    }

    this.$bdSlideThis.animate({left: -RESIZE_WIDTH}, this.panelSlideSpeed, this.panelSlideEasing);
}

OutfitCard.prototype.mainPanelBackButtonClick = function () {
    if (this.genderHelpHint) {
        this.genderHelpHint.dismiss();
    }

    if (this.bundleabilityHelpHint) {
        this.bundleabilityHelpHint.dismiss();
    }

    this.$bdSlideThis.animate({left: 0}, this.panelSlideSpeed, this.panelSlideEasing);
}

OutfitCard.prototype.mainPanelSubmitToShopClick = function () {
    var slideInNextPanel = function () {
        this.$bdSlideThis.animate({left: -RESIZE_WIDTH*2}, this.panelSlideSpeed, this.panelSlideEasing);
    }.bind(this);

    if (this.shouldShowSellOutfitConfirmation) {
        slideInNextPanel();
    } else {
        this.createNewOutfitBundleInCatalog(function () {
            slideInNextPanel();
        }.bind(this));
    }
}

OutfitCard.prototype.wireSellOutfitMainPanel = function () {
    this.$bdSlideThis = this.$root.find('.bd.slide-this');

    this.$sellOutfitPanelsContainer = this.$root.find('#sell-outfit-panels-container');
    this.$back = this.$sellOutfitPanelsContainer.find('.back');
    new ImvuButton(this.$back, {small: 1, callback: this.mainPanelBackButtonClick.bind(this)});

    this.$saleSpinner = this.$root.find('#sale-spinner');
    this.$saleHeader = this.$root.find('#sale-header');
    this.$saleHeader.toggle(this.isSellOutfitsEnabled);
    this.$sellDisplay = this.$saleHeader.find('.sell-display');
    this.$forSaleDisplay = this.$saleHeader.find('.for-sale-display');
    this.$forSaleDisplay.hide();
    this.$forSaleProductId = this.$forSaleDisplay.find('#product-id');

    this.clickSellHint = null;
    this.$sell = this.$saleHeader.find('.sell');
    this.$sell.hide();
    this.btnSell = new ImvuButton(this.$sell, {small: 1, callback: this.sellClick.bind(this)});
    this.btnSell.disable();

    this.$cantBeSold = this.$saleHeader.find('.cant-be-sold');
    this.$cantBeSold.hide();
    this.btnCantBeSold = new ImvuButton(this.$cantBeSold, {small: 1, callback: this.cantBeSoldClick.bind(this)});

    this.$submitToShop = this.$sellOutfitPanelsContainer.find('.submit-to-shop');
    this.btnSubmitToShop = new ImvuButton(this.$submitToShop, {small: 1, callback: this.mainPanelSubmitToShopClick.bind(this)});
    this.btnSubmitToShop.disable();
}

OutfitCard.prototype.wireDefaultOutfitButton = function () {
    this.isDefaultSet = false;

    this.$setAsDefault = $('.set-as-default');
    this.$setAsDefault.hide();
    this.$setAsDefault.find('span').click(this.setAsDefaultClick.bind(this));

    this.$isDefault = $('.is-default');
    this.$isDefault.hide();

    if (this.imvu.call('shouldSeeFeature', 'defaultOutfitChanges')){
        this.$isDefault.toggle(this.dialogInfo.isDefault);
        this.$setAsDefault.toggle(!this.dialogInfo.isDefault);
    }
}

OutfitCard.prototype.wireSellOutfitNotCreatorPanel = function () {
    this.isCreator = this.imvu.call('isCreator');
    this.$notCreatorPanel = this.$sellOutfitPanelsContainer.find('.not-a-creator-panel');
    this.$notCreatorPanel.hide();
    this.$creatorProgram = this.$notCreatorPanel.find('.learn a.creator-program');
    IMVU.Client.util.turnLinksIntoLaunchUrls(this.$notCreatorPanel, this.imvu);
}

OutfitCard.prototype.wireSellOutfitNotBundleablePanel = function () {
    this.bundleabilityHelpHint = null;
    this.$notBundleablePanel = this.$sellOutfitPanelsContainer.find('.not-bundleable-panel');
    this.$notBundleablePanel.hide();
    this.$notBundleablePanelBundleabilityHelp = this.$notBundleablePanel.find('.error .help-icon');
    this.$notBundleablePanelBundleabilityHelp
        .click(this.toggleBundleabilityHelp.bind(this, this.$notBundleablePanelBundleabilityHelp))
        .mouseenter(this.showBundleabilityHelp.bind(this, this.$notBundleablePanelBundleabilityHelp))
        .mouseleave(this.hideBundleabilityHelp.bind(this, this.$notBundleablePanelBundleabilityHelp));
}

OutfitCard.prototype.wireSellOutfitCanBeSoldPanel = function () {
    this.$canBeSoldPanel = this.$sellOutfitPanelsContainer.find('.can-be-sold-panel');
    this.$canBeSoldPanel.hide();
    this.$canBeSoldPanelBundleabilityHelp = this.$canBeSoldPanel.find('.info .help-icon');
    this.$canBeSoldPanelBundleabilityHelp
        .click(this.toggleBundleabilityHelp.bind(this, this.$canBeSoldPanelBundleabilityHelp))
        .mouseenter(this.showBundleabilityHelp.bind(this, this.$canBeSoldPanelBundleabilityHelp))
        .mouseleave(this.hideBundleabilityHelp.bind(this, this.$canBeSoldPanelBundleabilityHelp));
}

OutfitCard.prototype.genderHelpClick = function () {
    if (!this.genderHelpHint) {
        this.showGenderHelpHint();
    } else {
        this.genderHelpHint.dismiss();
    }
}

OutfitCard.prototype.genderHelpMouseEnter = function () {
    if (!this.genderHelpHint) {
        this.showGenderHelpHint();
    }
}

OutfitCard.prototype.genderHelpMouseLeave = function () {
    if (this.genderHelpHint) {
        this.genderHelpHint.dismiss();
    }
}

OutfitCard.prototype.wireSellOutfitGenderHelp = function () {
    this.genderHelpHint = null;
    this.$genderHelp = this.$canBeSoldPanel.find('.gender.help-icon');
    this.$genderHelp
        .click(this.genderHelpClick.bind(this))
        .mouseenter(this.genderHelpMouseEnter.bind(this))
        .mouseleave(this.genderHelpMouseLeave.bind(this));
}

OutfitCard.prototype.wireSellOutfitGenderRadioButtons = function () {
    this.$femaleLabelAndRadio = this.$sellOutfitPanelsContainer.find('.female-label-and-radio');
    this.$female = this.$sellOutfitPanelsContainer.find('#gender-female');
    this.$male = this.$sellOutfitPanelsContainer.find('#gender-male');
    this.$maleLabelAndRadio = this.$sellOutfitPanelsContainer.find('.male-label-and-radio');
    this.$female.add(this.$male).click(function () {
        this.btnSubmitToShop.enable();
    }.bind(this));
}

OutfitCard.prototype.wireSellOutfitSuccessPanel = function () {
    this.$successPanel = this.$saleConfirmationPanel.find('.success-panel');
    this.$successPanelProductId = this.$successPanel.find('.product a');
    this.$successPanel.toggle(!this.shouldShowSellOutfitConfirmation);
}

OutfitCard.prototype.confirmationPanelBackButtonClick = function () {
    this.$bdSlideThis.animate({left: this.successfullySubmitted ? 0 : -RESIZE_WIDTH}, this.panelSlideSpeed, this.panelSlideEasing);
}

OutfitCard.prototype.wireSellOutfitConfirmationPanel = function () {
    this.$saleConfirmationPanel = this.$root.find('#sale-confirmation-panel');
    this.$confirmationPanel = this.$saleConfirmationPanel.find('.panel');
    this.$confirmationPanel.toggle(this.shouldShowSellOutfitConfirmation);

    this.$doNotShowThisMessageAgain = this.$saleConfirmationPanel.find('#do-not-show-again');

    this.$backConfirm = this.$saleConfirmationPanel.find('.back');
    new ImvuButton(this.$backConfirm, {small: 1, callback: this.confirmationPanelBackButtonClick.bind(this)});

    this.$submitToShopConfirmed = this.$saleConfirmationPanel.find('.submit-to-shop');
    this.btnSubmitToShopConfirmed = new ImvuButton(this.$submitToShopConfirmed, {
        callback: this.createNewOutfitBundleInCatalog.bind(this)
    });
}

OutfitCard.prototype.wireDescription = function () {
    this.$elDescription = this.$root.find('.description');
    this.$elDescription.val(this.dialogInfo.description);
    this.$elDescription.click(function () {
        this.warnIfAppropriate(function () {});
    }.bind(this));
}

OutfitCard.prototype.wireAuthor = function () {
    this.$root.find('#author_link').html(this.dialogInfo.creatorAvatarName);
    this.$root.find('.author img.vip').toggle(!!this.dialogInfo.creatorIsVip);
    this.$root.find('.author img.ap').toggle(!!this.dialogInfo.creatorIsAp);
}

OutfitCard.prototype.wireOutfitName = function () {
    this.$elOutfitName = this.$root.find('#outfit_name');
    this.$elOutfitName.val(this.dialogInfo.name);
    this.$elOutfitName.click(function () {
        this.warnIfAppropriate(function () {});
    }.bind(this));

    this.isOutfitAp = parseInt(this.dialogInfo.isAp, 10);
    this.$elOutfitNameAp = this.$root.find('#outfit_name_ap');
    this.$elOutfitNameAp.toggle(!!this.isOutfitAp);
}

OutfitCard.prototype.wireSnapshotImage = function () {
    this.$snapshotContainer = this.$root.find('.snapshot_container');
    this.$snapshotSpinnerContainer = this.$root.find('.snapshot_spinner_container');    
    this.$snapshotImageDisabledContainer = this.$root.find('.snapshot_image_disabled_container');

    this.snapshotUrlJunk = 0;
    this.setPreviewImageCallback = null;
    this.previewingImage = false;

    this.geckoListenerCallbackRegistry = {};
    this.geckoListenerCallbackRegistryLastId = 0;

    if (this.dialogInfo.isDirty) {
        // 0: unknown yet, 1~3: see index.html for messages
        this.dirtyState = 0;
        this.$snapshotContainer.hide();
        this.$snapshotImageDisabledContainer.css('display', 'inline-block');
    } else if (this.dialogInfo.initialPreviewImage) {
        this.hasInitialPreviewImage = true;
        this.setPreviewImage(this.dialogInfo.initialPreviewImage, true);
    } else {
        this.$root.find('#snapshot').attr('src', this.dialogInfo.imageUrl);
    }
}

OutfitCard.prototype.wireCloseButton = function () {
    $('#close_button').click(function (e) {
        this.imvu.call('endDialog', this.endDialogResult);
    }.bind(this));
}

OutfitCard.prototype.wireCategoryDropDown = function () {
    var categories = [];
    for each (var category in this.dialogInfo.categories) {
        categories.push([IMVU.Outfits.getCategoryDisplayName(category.text) + ' (' + category.total_outfits + ') <b>' + IMVU.Outfits.getPrivacyHtmlLabel(category.privacy) + '</b>', category.id]);
    }

    this.categoryDropDown = new IMVU.Client.widget.DropDown({rootElement: this.$root.find('#category_selector')[0], items: categories, selectedValue: this.dialogInfo.categoryId});
    $(this.categoryDropDown.elSelect).change(function (e) {
        this.dialogInfo.categoryId = parseInt(this.categoryDropDown.getSelectedValue(), 10);
    }.bind(this));
}

OutfitCard.prototype.changePictureLinkClick = function () {
    this.warnIfAppropriate(function () {
        this.imvu.call('changePicture', this.removePids);
    }.bind(this));
}

OutfitCard.prototype.deleteLinkClick = function () {
    this.warnIfAppropriate(function () {
        var result = this.imvu.call('showOutfitDeletionDialog', {outfitId: this.outfitId});
        if (result) {
            if (result.deleted) {
                this.imvu.call('endDialog', {'delete': true});
            } else {
                this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("There was a problem deleting your outfit."));
            }
        }
    }.bind(this));
}

OutfitCard.prototype.cancelButtonClick = function () {
    this.imvu.call('endDialog', this.endDialogResult);
}

OutfitCard.prototype.saveButtonClick = function () {
    this.saveChanges({closeDialog: true});
}

OutfitCard.prototype.wireBottomRowLinksAndButtons = function () {
    this.$changePicture = this.$root.find('#btn_changePicture');
    this.$changePicture.click(this.changePictureLinkClick.bind(this));

    this.$elDelete = this.$root.find('.delete');
    this.$elDelete.click(this.deleteLinkClick.bind(this));

    this.btnCancel = new CancelButton('#btn_cancel', {callback: this.cancelButtonClick.bind(this)});
    this.btnSave = new ImvuButton('#btn_save', {callback: this.saveButtonClick.bind(this)});
}

OutfitCard.prototype.showBundleabilityHelp = function ($el) {
    if (!this.bundleabilityHelpHint) {
        this.showBundleabilityHelpHint($el);
    }
}

OutfitCard.prototype.hideBundleabilityHelp = function ($el) {
    if (this.bundleabilityHelpHint) {
        this.bundleabilityHelpHint.dismiss();
    }
}

OutfitCard.prototype.toggleBundleabilityHelp = function ($el) {
    if (!this.bundleabilityHelpHint) {
        this.showBundleabilityHelpHint($el);
    } else {
        this.bundleabilityHelpHint.dismiss();
    }
}

OutfitCard.prototype.createNewOutfitBundleInCatalog = function (callback) {
    var postData = {
        outfit_id: this.outfitId,
        gender: this.$male.is(':checked') ? 'm': 'f',
        name: this.$elOutfitName.val(),
        rating: 0
    };

    this.$saleSpinner.fadeIn();

    IMVU.callAsync('submitOutfitBundle', function (result) {
        this.$saleSpinner.fadeOut();
        if (result && result.pid) {
            this.$confirmationPanel.hide();
            this.$successPanel.show();
            this.$sellDisplay.hide();
            this.$forSaleDisplay.show();
            this.successfullySubmitted = true;

            this.$forSaleProductId.text(result.pid);
            this.$forSaleProductId.attr('href', 'http://www.imvu.com/shop/product.php?products_id=' + result.pid);
            this.$successPanelProductId.text(result.pid);
            this.$successPanelProductId.attr('href', 'http://www.imvu.com/shop/product.php?products_id=' + result.pid);

            IMVU.Client.util.turnLinksIntoLaunchUrls(this.$forSaleDisplay, this.imvu);
            IMVU.Client.util.turnLinksIntoLaunchUrls(this.$successPanel, this.imvu);

            if (callback) {
                callback();
            }
        }
    }.bind(this), this.imvu, postData);

    this.imvu.call('setLocalStoreValue', 'outfit-card.show-sale-confirmation', !this.$doNotShowThisMessageAgain.is(':checked'));
}

OutfitCard.prototype.warnIfAppropriate = function (fn) {
    if (this.bundle.creator_id == this.imvu.call('getCustomerId')) {
        var show = this.imvu.call('showOutfitChangeAlertForOutfitBundleAuthor');
        if (show.result) {
            fn();
        }
    } else {
        fn();
    }
}

OutfitCard.prototype.completeCallback = function (callbackId, result) {
    var callback = this.geckoListenerCallbackRegistry[callbackId];
    if (typeof callback === 'undefined') {
        return false;
    }

    callback(result);
    delete this.geckoListenerCallbackRegistry[callbackId];
    return true;
}

OutfitCard.prototype.getProductInfos = function () {
    var $items = this.$elProductList.find('.product:visible');
    console.log('items:', $items);
    return _.map($items, function (el) {
        return {pid: parseInt($(el).attr('pid'), 10), isRemoved: $(el).is('.removed')};
    });
}

OutfitCard.prototype.isProductRemoved = function (productInfo) {
    return productInfo.isRemoved;
}

OutfitCard.prototype.getAllPidsNotRemoved = function () {
    return _.pluck(_.reject(this.getProductInfos(), this.isProductRemoved), 'pid');
}

OutfitCard.prototype.getAllPidsRemoved = function () {
    return _.pluck(_.select(this.getProductInfos(), this.isProductRemoved), 'pid');
}

OutfitCard.prototype.shouldShowProduct = function (pid, productInfo) {
    if (productInfo.is_ufi) {
        return false;
    } else if (productInfo.is_ap && !this.imvu.call('hasAccessPass')) {
        return false;
    }

    return true;
}

OutfitCard.prototype.confirmRemoval = function () {
    if (this.hasInitialPreviewImage && !this.removalDialogConfirmed) {
        result = this.imvu.call('showYesNoDialog', _T("Confirm image removal"), _T("You are about to delete your custom outfit image. Do you still want to proceed?"));
        if (result && result['result']) {
            this.removalDialogConfirmed = true;
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}

OutfitCard.prototype.refreshRemovePids = function () {
    this.removePids = this.getAllPidsRemoved();
}

OutfitCard.prototype.refreshOutfitApIcon = function () {
    if (this.isOutfitAp) {
        var totalApProducts = 0;
        this.$elProductList.find('.product').each(function (index, el) {
            var imgAp = el.querySelector('.ap');
            if (imgAp && !$(el).hasClass('removed')) {
                totalApProducts += 1;
            }
        });
        this.$elOutfitNameAp.toggle(totalApProducts > 0);
    }
}

OutfitCard.prototype.clickRemoveOrUndoLink = function (elProduct, categoryId) {
    if (!this.confirmRemoval()) {
        return;
    }

    this.$spinner.show();

    var $product = $(elProduct);
    $product.toggleClass('removed');

    this.myServiceRequest({
        method: 'GET',
        uri: IMVU.SERVICE_DOMAIN + '/api/find_bundle.php?pids=' + this.getAllPidsNotRemoved().join(','),
        callback: function (response, error) {
            var bundleId = response.result,
                products = _.clone(this.dialogInfo.products);
            this.bundle = {id: bundleId, creator_id: response.creator_id};
            _.each(this.getAllPidsRemoved(), function (pid) {
                delete products[pid];
            });
            this.refreshHeader(products, bundleId);
        }.bind(this)
    });

    this.btnSave.disable();
    this.imvu.call('generateOutfitSnapshot', categoryId, this.getAllPidsNotRemoved());
    this.refreshRemovePids();
    this.refreshOutfitApIcon();
}

OutfitCard.prototype.clickPutOnLink = function (elPulser, pid) {
    $(elPulser)
        .css({'background-color': 'white', opacity: 1})
        .fadeTo(this.pulseDuration, 0, function () {
             this.imvu.call('putOnProduct', pid);
        }.bind(this));
}

OutfitCard.prototype.insertProduct = function (pid, productInfo) {
    pid = parseInt(pid, 10);

    var $product    = this.$productTemplate.clone().attr({pid: pid, id: 'product-' + pid}),
        $thumb      = $product.find('img.thumb'),
        $name       = $product.find('.name .text'),
        $category   = $product.find('.category'),
        $removeLink = $product.find('.remove'),
        $undoLink   = $product.find('.undo'),
        $putonLink  = $product.find('.puton'),
        $pulser     = $product.find('.pulser'),
        shouldShow;

    if (this.removePids.indexOf(pid) !== -1) {
        $product.addClass('removed');
        this.refreshOutfitApIcon();
    }

    $thumb.attr('src', productInfo.image);
    if (!productInfo.is_ap) {
        $product.find('.name .ap').remove();
    }

    $name.html(productInfo.name);
    $category.html(productInfo.category);

    $removeLink.add($undoLink).click(function (e) { this.clickRemoveOrUndoLink($product, productInfo.categoryId); }.bind(this));
    $putonLink.click(function (e) { this.clickPutOnLink($pulser[0], pid); }.bind(this));

    shouldShow = this.shouldShowProduct(pid, productInfo);
    $product.toggle(shouldShow);

    this.$elProductList.append($product);

    return shouldShow;
};

OutfitCard.prototype.showServiceErrorDialog = function (error, message) {
    if (error == 'Invalid name - contains illegal characters') {
        message = _T("We are sorry, your outfit name and description can only contain letters, numbers and spaces.");
    }

    this.imvu.call('showConfirmationDialog', 'Please try again', message);
}

OutfitCard.prototype.getDirtyState = function (products) {
    var ufi_found = false;
    var ap_found = false;

    for (var pid in products) {
        var prodInfo = products[pid];
        if (prodInfo.is_ufi) {
            ufi_found = true;
        } else if (prodInfo.is_ap) {
            ap_found = true;
        }
    }

    if (ufi_found) {
        return 3;
    } else if (ap_found) {
        if (this.imvu.call('isTeen')) {
            return 3;
        } else if (this.imvu.call('hasAccessPass')) {
            return 2;
        } else {
            return 1;
        }
    }

    IMVU.log("Error in getDirtyState, ufi_found: " + ufi_found + ", ap_found: " + ap_found);

    return 0;
}

OutfitCard.prototype.getReratedProductCategories = function (products) {
    var result = [];
    var categoryLookup = {};

    for (var pid in products) {
        var product = products[pid];
        if (this.shouldShowProduct(pid, product)) {
            continue;
        }

        var category = categoryLookup[product.category_id];
        if (typeof category === 'undefined') {
            category = {name: product.category, totalReratedProducts: 1};
            categoryLookup[product.category_id] = category;
            result.push(category);
        } else {
            category.totalReratedProducts += 1;
        }
    }

    return result;
}

OutfitCard.prototype.refreshReratedProductCategoriesMessaging = function (reratedProductCategories) {
    var categoryList = this.$root.find('.category_list_' + this.dirtyState.toString())[0];
    for each (var category in reratedProductCategories) {
        var elCategory = document.createElement('li');
        elCategory.innerHTML = category.name + ' (' + category.totalReratedProducts + ')';
        categoryList.appendChild(elCategory);
    }
}

OutfitCard.prototype.refreshReratedMessageAndSnapshot = function (products) {
    switch (this.dirtyState) {
        case 1:
            var we_are_sorry_container = this.$root.find('#we_are_sorry_container')[0];
            $(we_are_sorry_container).css('display', 'inline-block');
            $('#ap-link').click(function() { this.imvu.call('showApInfoNow'); }.bind(this));

            var reratedProductCategories = this.getReratedProductCategories(products);
            if (reratedProductCategories.length > 0) {
                this.refreshReratedProductCategoriesMessaging(reratedProductCategories);
            }
            break;

        case 2:
            this.$snapshotSpinnerContainer.css('display', 'inline-block');
            this.btnSave.disable();

            var restore_outfit_snapshot_container = this.$root.find('#restore_outfit_snapshot_container')[0];
            $(restore_outfit_snapshot_container).css('display', 'inline-block');
            this.imvu.call('generateOutfitSnapshot', this.dialogInfo.categoryId, this.getAllPidsNotRemoved());
            this.$snapshotImageDisabledContainer.hide();
            break;

        case 3:
            this.$snapshotImageDisabledContainer.css('display', 'inline-block');

            var UFI_or_teenAp_outfit_snapshot_container = this.$root.find('#UFI_or_teenAp_outfit_snapshot_container')[0];
            $(UFI_or_teenAp_outfit_snapshot_container).css('display', 'inline-block');

            reratedProductCategories = this.getReratedProductCategories(products);
            if (reratedProductCategories.length > 0) {
                this.refreshReratedProductCategoriesMessaging(reratedProductCategories);
            }

            break;
    }
    this.imvu.call('resize', RESIZE_WIDTH, document.body.offsetHeight);
}

OutfitCard.prototype.refreshProductList = function (products) {
    this.$elProductList.children().remove();
    var total = 0;
    for (var pid in products) {
        if (this.insertProduct(pid, products[pid])) {
            total += 1;
        }
    }
    this.$elProductListFooter.find('.total_items').html(total);
    this.$elProductList.removeClass('hidden');
    this.$elProductListFooter.removeClass('hidden');
    this.$root.find('#product_list_spinner').addClass('hidden');
    if (this.dialogInfo.isDirty) {
        this.dirtyState = this.getDirtyState(products);
        this.refreshReratedMessageAndSnapshot(products);
    }
}

OutfitCard.prototype.myServiceRequest = function (spec) {
    spec.network  = this.network;
    spec.imvu = this.imvu;
    serviceRequest(spec);
}

OutfitCard.prototype.isEligibleForSale = function (products) {
    for (var k in products) {
        if (!products[k].is_bundleable) {
            return false;
        }
    }
    return true;
}

OutfitCard.prototype.showNonBundleableProducts = function (products) {
    var $template = this.$notBundleablePanel.find('.template').removeClass('template'),
        $list = this.$notBundleablePanel.find('ul');
    $template.remove();
    for (var k in products) {
        if (!products[k].is_bundleable) {
            var $product = $template.clone();
            $product.find('img').attr('src', products[k].image);
            $product.find('.name').text(products[k].name);
            $list.append($product);
        }
    }
}

OutfitCard.prototype.shouldShowClickSellHint = function () {
    return this.isSellOutfitsEnabled && !this.imvu.call('getLocalStoreValue', 'outfit-card.click-sell-hint.dismissed', false);
}

OutfitCard.prototype.showClickSellHint = function () {
    this.clickSellHint = create_informational_message(
        {html: '<span class="click-sell">Click &lsquo;Sell&rsquo;</span>'}, 'top', 'right',
        function () {
            var p = this.$sell.position();
            return {left: p.left + 24, top: p.top + 59};
        }.bind(this), undefined, this.imvu
    );
    // Gross. The hint widget system hardcodes this inline. This is my only
    // recourse unless I want to redesign that system (I don't.)
    $('.nub-up').css({top: '-27px', right: '20px'});
}

OutfitCard.prototype.fudgeHintContainerAndPosition = function (args) {
    $('.hint-widget').addClass(args.cssClass).click(function () {
        if (this[args.hintProperty]) {
            this[args.hintProperty].dismiss();
        }
    }.bind(this));

    $('.hint-widget-container').bind('dismissFinished', function () {
        delete this[args.hintProperty];
        this[args.hintProperty] = null;
    }.bind(this));

    $('.nub-up').css(args.position);
}

OutfitCard.prototype.showBundleabilityHelpHint = function ($el) {
    if (this.genderHelpHint) {
        this.genderHelpHint.dismiss();
        return;
    }

    this.bundleabilityHelpHint = create_informational_message(
        {html: '<h2 class="bundleability-help">Bundleability Help</h2><hr/><p>An Outfit that contains only Bundleable products can be sold in the Shop.</p><p>The Creator of each product gets to choose whether their product is allowed to be included in bundles and Outfits.'}, 'top', 'right',
        function () {
            var p = $el.position();
            return {left: p.left - 15, top: p.top + 55};
        }.bind(this), undefined, this.imvu
    );

    this.fudgeHintContainerAndPosition({
        cssClass: 'bundleability-help',
        hintProperty: 'bundleabilityHelpHint',
        position: {top: '-16px', right: '20px'}
    });
}

OutfitCard.prototype.showGenderHelpHint = function () {
    if (this.bundleabilityHelpHint) {
        this.bundleabilityHelpHint.dismiss();
        return;
    }

    this.genderHelpHint = create_informational_message(
        {html: '<h2 class="gender-help">Gender Help</h2><hr/><p>Submission requires that you choose whether your Outfit will appear in the Female or Male section of the Shop.</p><p>If an Outfit contains the Female or Male Avatar, its gender is automatically chosen.</p>'}, 'top', 'right',
        function () {
            var p = this.$genderHelp.position();
            return {left: p.left + 65, top: p.top + 55};
        }.bind(this), undefined, this.imvu
    );

    this.fudgeHintContainerAndPosition({
        cssClass: 'gender-help',
        hintProperty: 'genderHelpHint',
        position: {top: '-16px', right: '100px'}
    });
}

OutfitCard.prototype.autoChooseGender = function (products) {
    for (var k in products) {
        if (k == 80) {
            this.$female.click();
            this.$male.prop('disabled', true);
            this.$maleLabelAndRadio.addClass('disabled');
        } else if (k == 191) {
            this.$female.prop('disabled', true);
            this.$femaleLabelAndRadio.addClass('disabled');
            this.$male.click();
        }
    }
}

OutfitCard.prototype.showForSaleHeader = function (bundleId) {
    if (this.clickSellHint) {
        this.clickSellHint.dismiss();
    }

    this.$forSaleProductId.text(bundleId);
    this.$forSaleProductId.attr('href', 'http://www.imvu.com/shop/product.php?products_id=' + bundleId);
    this.$forSaleDisplay.find('a').unbind('click');
    IMVU.Client.util.turnLinksIntoLaunchUrls(this.$forSaleDisplay, this.imvu);

    this.$sellDisplay.hide();
    this.$successPanel.hide();
    this.$canBeSoldPanel.hide();
    this.$forSaleDisplay.fadeIn();
}

OutfitCard.prototype.showCannotBeSoldHeader = function (products) {
    if (this.clickSellHint) {
        this.clickSellHint.dismiss();
    }

    this.$sell.hide();
    this.$cantBeSold.fadeIn();
    this.$notCreatorPanel.hide();
    this.$canBeSoldPanel.hide();
    this.$successPanel.hide();
    this.$notBundleablePanel.show();
    this.showNonBundleableProducts(products);
}

OutfitCard.prototype.showSellHeader = function (products) {
    if (this.clickSellHint) {
        this.clickSellHint.dismiss();
    }

    if (!this.isCreator) {
        this.$notCreatorPanel.show();
    } else {
        this.$canBeSoldPanel.show();
        this.autoChooseGender(products);
    }

    this.$notBundleablePanel.hide();
    this.$forSaleDisplay.fadeOut();
    this.$sellDisplay.fadeIn();
    this.$cantBeSold.fadeOut();
    this.$successPanel.show();
    this.$sell.fadeIn();
    this.btnSell.enable();

    if (this.shouldShowClickSellHint()) {
        this.showClickSellHint();
    }
}

OutfitCard.prototype.refreshHeader = function (products, bundleId) {
    if (bundleId) {
        this.showForSaleHeader(bundleId);
    } else if (!this.isEligibleForSale(products)) {
        this.showCannotBeSoldHeader(products);
    } else {
        this.showSellHeader(products);
    }
}

OutfitCard.prototype.loadProducts = function (outfitId) {
    IMVU.log("outfit card product loading started.");
    this.outfitId = outfitId;
    this.myServiceRequest({
        method: 'GET',
        uri: '/api/outfit_products.php?outfit_id=' + outfitId,
        callback: function (response, error) {
            if (error) {
                this.showServiceErrorDialog(error.error, _T("There was a problem loading the products for this outfit."));
            } else {
                this.$changePicture.css({visibility: 'visible'}).fadeTo('fast', 1);
                this.$elDelete.css({visibility: 'visible'}).fadeTo('fast', 1);
                this.$elOutfitName.fadeIn();
                this.$elDescription.fadeIn();

                this.bundle = {id: response.bundle_id, creator_id: response.creator_id};
                this.dialogInfo.products = response.result;
                this.refreshHeader(this.dialogInfo.products, response.bundle_id);
                this.refreshProductList(this.dialogInfo.products);
                IMVU.log("outfit card product loading complete.");
            }
        }.bind(this)
    });
}

OutfitCard.prototype.sendToServer = function (data, closeDialog, newImageUrl) {
    this.$spinner.show();
    if (typeof newImageUrl !== 'undefined') {
        IMVU.log("new snapshot image url to send to server: " + newImageUrl);
        data.image = newImageUrl;
        this.dialogInfo.new_image = newImageUrl;
        this.dialogInfo.pids_not_removed = this.getAllPidsNotRemoved().join(' ');
    }

    this.myServiceRequest({
        method: 'POST',
        uri: '/api/outfits.php',
        data: data,
        callback: function (response, error) {
            if (error) {
                this.$spinner.hide();
                this.showServiceErrorDialog(error.error, _T("There was a problem saving your outfit."));
            } else if (response.error){
                this.$spinner.hide();
                this.showServiceErrorDialog(response.error, _T("There was a problem saving your outfit."));
            } else {
                this.dialogInfo.name = this.$elOutfitName.val();
                this.dialogInfo.description = this.$elDescription.val();
                this.dialogInfo.is_ap = this.$elOutfitNameAp.is(':visible');
                this.dialogInfo.categoryId = data.category_id;
                this.removePids = [];

                this.endDialogResult = {saved_info: this.dialogInfo};
                if (closeDialog) {
                    this.imvu.call('endDialog', this.endDialogResult);
                } else {
                    this.$spinner.hide();
                }
            }
        }.bind(this)
    });
}

OutfitCard.prototype.setPreviewImage = function (filename) {
    this.previewingImage = true;

    this.$spinner.hide();
    this.$snapshotSpinnerContainer.hide();
    this.$snapshotContainer.css('display', 'inline-block');
    var imgSnapshot = this.$root.find('#snapshot')[0];
    imgSnapshot.src = "file:///" + filename.replace("\\", "/") + "?junk=" + this.snapshotUrlJunk;
    this.snapshotUrlJunk += 1;

    this.btnSave.enable();

    if (this.setPreviewImageCallback !== null) {
        this.setPreviewImageCallback();
        this.setPreviewImageCallback = null;
    }
}

OutfitCard.prototype.showBodyPatternError = function () {
    this.imvu.call('showConfirmationDialog', _T("Cannot save outfit"), _T("To save an outfit, there must be an avatar product. Click 'Undo' to return the avatar product to the outfit."));
    this.$spinner.hide();
    this.btnSave.disable();
}

OutfitCard.prototype.registerGeckoListenerCallback = function (callback) {
    var callbackId = this.geckoListenerCallbackRegistryLastId + 1;
    this.geckoListenerCallbackRegistryLastId = callbackId;
    this.geckoListenerCallbackRegistry[callbackId] = callback;
    return callbackId;
}

OutfitCard.prototype.saveChanges = function (args) {
    args = args || {};

    var data = {
        edit_outfit_id: this.outfitId,
        outfit_name: this.$elOutfitName.val(),
        description: this.$elDescription.val(),
        category_id: parseInt(this.categoryDropDown.getSelectedValue(), 10)
    };

    this.$spinner.show();

    var sendToServer = this.sendToServer.bind(this, data, args.closeDialog);

    if (this.isDefaultSet){
        this.imvu.call('setDefaultOutfit', this.outfitId, this.getAllPidsNotRemoved());
    }

    if (this.dialogInfo.isDirty) {
        switch (this.dirtyState) {
            case 1:
            case 3:
                this.btnSave.disable();
                this.$snapshotImageDisabledContainer.hide();
                this.$snapshotSpinnerContainer.css('display', 'inline-block');

                this.setPreviewImageCallback = function () {
                    this.imvu.call('savePreviewImageToServer', this.registerGeckoListenerCallback(sendToServer));
                }.bind(this);

                this.$spinner.show();

                this.imvu.call('generateOutfitSnapshot', this.dialogInfo.categoryId, this.getAllPidsNotRemoved());
                break;

            case 2:
                this.imvu.call('savePreviewImageToServer', this.registerGeckoListenerCallback(sendToServer));
                break;
        }
    } else if (this.removePids.length > 0 || this.previewingImage) {
        data.remove_pids = this.removePids;
        this.imvu.call('savePreviewImageToServer', this.registerGeckoListenerCallback(sendToServer));
    } else {
        sendToServer();
    }
}

function createProductInfoDialog(args) {
    var imvu = args.imvu,
        eventBus = args.eventBus;

    var dialog = new IMVU.Client.widget.Dialog("panel_product_info", {
        width: '500px',
        height: '240px',
        modal: true,
        fixedcenter: false,
        visible: false
    });

    dialog.setHeader('<span><span class="product-name">Product Name</span> - ' + _T("Product Information") + '</span>');
    var bodyStr =
        '<div class="breadcrumb">' +
        '    <span>x &gt; y &gt; z</span>' +
        '</div>';
    dialog.showWhitelisted = imvu.call("shouldShowWhitelistedProductsInCatalog");
    dialog.canModifyWhitelist = imvu.call("canModifyWhitelistedProductsInCatalog");
    if (dialog.showWhitelisted) {
        bodyStr +=
            '<input type="checkbox" class="whitelist-box" disabled="disabled"></input>' +
            '<div class="whitelist-label-disabled">' +
            '    Whitelisted' +
            '</div>';
        dialog.enableWhitelistCheckbox = function() {
            $(this.elWhitelistedCheckbox).addClass('clickable').prop('disabled', false);
            $(".whitelist-label-disabled", this.innerElement).removeClass('whitelist-label-disabled').addClass('whitelist-label');
        };
        dialog.setWhitelist = function(rating) {
            var rating_int = parseInt(rating, 10);
            if (rating_int == 5) {
                $(this.elWhitelistedCheckbox).prop('checked', true);
            } else {
                $(this.elWhitelistedCheckbox).prop('checked', false);
            }
        }
    }
    bodyStr +=
        IMVU.Client.widget.Product.getInfoHTML() +
        '<div class="add-to">' +
        '<div class="wishlist ui-event" data-ui-name="AddToWishlist"><a href="#">' + _T("add to wishlist") + '</a></div>' +
        '<div class="gift ui-event" data-ui-name="Gift"><a href="#">' + _T('give to a friend') + '</a></div>' +
        '<div class="cart ui-event" data-ui-name="AddToCart"><a href="#">' + _T("add to cart") + '</a></div>' +
        '</div>' +
        '<a class="more-info ui-event" data-ui-name="MoreInfo" href="#">' + _T("More Information") + '</a>' +
        '<div class="buttons">' +
        '    <div class="button-try ui-event" data-ui-name="Try"></div>' +
        '    <div class="you-own-this">' + _T("You own this") + '</div>' +
        '    <div class="button-buy ui-event" data-ui-name="Buy"></div>' +
        '    <div class="display-only">' + _T("Display Only") + '</div>' +
        '</div>' +
        '<div class="spinner" style="display:none"/>';
    dialog.setBody(bodyStr);
    dialog.render(document.body);

    dialog.elThumb = dialog.innerElement.querySelector('img.thumbnail');
    dialog.elProductName = dialog.innerElement.querySelector('span.product-name');
    dialog.elBreadcrumb = dialog.innerElement.querySelector('div.breadcrumb > span');
    dialog.elCreatorName = dialog.innerElement.querySelector('h3 > a');
    dialog.elRating = dialog.innerElement.querySelector('h4 > span');
    dialog.elCredits = dialog.innerElement.querySelector('p.credits > span');
    dialog.elPredits = dialog.innerElement.querySelector('p.predits > span');
    dialog.elPriceWrapper = dialog.innerElement.querySelector('div.price');
    dialog.elOriginalPrice = dialog.innerElement.querySelector('div.price > span.original_price');
    dialog.elPrice = dialog.innerElement.querySelector('div.price > span.current_price');
    dialog.elBuy = dialog.innerElement.querySelector('div.button-buy');
    dialog.elYouOwnThis = dialog.innerElement.querySelector('div.you-own-this');
    dialog.elTry = dialog.innerElement.querySelector('div.button-try');
    dialog.elMoreInfo = dialog.innerElement.querySelector('a.more-info');
    dialog.elRecommend = dialog.innerElement.querySelector('div.add-to > div.recommend > a');
    dialog.elAddToCart = dialog.innerElement.querySelector('div.add-to > div.cart > a');
    dialog.elGift = dialog.innerElement.querySelector('div.add-to > div.gift > a');
    dialog.elAddToWishlist = dialog.innerElement.querySelector('div.add-to > div.wishlist > a');
    dialog.elWhitelistedCheckbox = dialog.innerElement.querySelector('input.whitelist-box');
    dialog.elSpinner = dialog.innerElement.querySelector('div.spinner');

    dialog.beforeShowEvent.subscribe(function() {
        // Within the context of this function, "this" is the YUI dialog.
        // "this.product" is injected via ShopMode's showInfo().
        //
        // TODO: Blech. Fix this. It's not obvious where "this.product" comes from.
        //       Maybe move all of this work inside ShopMode's showInfo().
        //
        var product = this.product.dataObject;

        this.element.style.right = "125px";
        this.element.style.top = "200px";

        this.elThumb.src = product.image;
        this.elProductName.innerHTML = product.name;
        this.elCreatorName.innerHTML = product.creator_name;
        this.elCredits.innerHTML = IMVU.Client.util.number_format(IMVU.Client.creditBalance);
        this.elPredits.innerHTML = IMVU.Client.util.number_format(IMVU.Client.promoBalance);
        this.elRating.innerHTML = (product.ap ? "Access Pass Only" : "General Audience");
        if (product.discount_price && product.discount_price != product.price) {
            $(this.elPriceWrapper).addClass('two_priced');
            this.elOriginalPrice.innerHTML = IMVU.Client.util.number_format(product.price);
            this.elPrice.innerHTML = IMVU.Client.util.number_format(product.discount_price);
        } else {
            this.elPrice.innerHTML = IMVU.Client.util.number_format(product.price);
            this.elOriginalPrice.innerHTML = '';
        }

        YAHOO.util.Event.addListener(this.elMoreInfo, "click", function() {
            imvu.call("launchNamedUrl", "catalog_product_info", {
                'products_id': product.id
            });
        });

        var categoryNames = [];
        var categoryName = product.category_name;
        var categories = product.parent_categories;
        for (var c = 0; c < categories.length; c += 1) {
            categoryNames.push(categories[c].name);
        }
        categoryNames.push(categoryName);

        // TODO: Blech. Markup should contain data, not formatting. Create a list and style it.
        this.elBreadcrumb.innerHTML = categoryNames.join('&nbsp;&gt;&nbsp;');
    });

    dialog.beforeShowEvent.subscribe(function() {
        eventBus.fire('modalDialogShown', {
            dialogName: 'info'
        });
    });

    dialog.hideEvent.subscribe(function() {
        YAHOO.util.Event.purgeElement(dialog.elMoreInfo);
        eventBus.fire('modalDialogHidden', {
            dialogName: 'info'
        });
    });

    return dialog;
}

function createShopCarouselController(args) {
    var controller = args.controller || new IMVU.Client.ShopCarouselController(args),
        carousel = args.carousel;

    if (!carousel) {
        controller.setCarousel({
            updateTotal: function() {},
            updateItems: function() {},
            undoLinkElement: {
                style: {}
            }
        });
    } else {
        $('body')
            .bind('shopCarouselUndo', function(e) {
                controller.undo();
            }.bind(this))
            .bind('shopCarouselBuy', function(e) {
                if (carousel.tryingOutfit) {
                    $('body').trigger('productClickInfo', [carousel.tryingOutfit]);
                } else {
                    this.shopCarouselBuyController.confirm(controller.getShopTriedProducts());
                }
            }.bind(this));
        controller.setCarousel(carousel);

        $('#carousel').show();
        carousel.render('carousel_list');
        carousel.show();
    }

    return controller;
}

IMVU.Client.ShopMode = function(spec) {
    this.imvu = spec.imvu;
    this.net = spec.net;
    this.eventBus = spec.eventBus;
    this.dialogInfo = spec.dialogInfo;
    this.purchaseMixin = spec.purchaseMixin;
    this.tabBar = spec.tabBar;
    this.service = spec.service;
    this.catalogController = spec.catalogController;
    this.searchBox = spec.searchBox;
    this.shopCarousel = spec.shopCarousel;
    this.shopCarouselController = spec.shopCarouselController;
    this.timer = spec.timer;

    this.productsInUse = {};
    this.pidsInUse = [];

    IMVU.Client.isShoppingTogether = this.imvu.call("isShoppingTogether");
    IMVU.Client.shouldShowFurnitureAndOtherCategories = this.imvu.call("shouldShowFurnitureAndOtherCategories");
    IMVU.Client.canShowProductRecommendations = this.imvu.call("canShowProductRecommendations");
    IMVU.Client.creditBalance = this.imvu.call("getCreditBalance");
    IMVU.Client.promoBalance = this.imvu.call("getPromoBalance");
    IMVU.Client.showWhitelisted = this.imvu.call("shouldShowWhitelistedProductsInCatalog");

    this.roomPid = null;
    this.roomProductView = null;

    $('body')
        .unbind('catalogControllerSearch')
        .bind('catalogControllerSearch', function(e, searchTerm, type, value) {
            if (typeof this.activeView === 'undefined' || this.activeView != this.catalogView) {
                this.selectTabOnLoad();
            }
        }.bind(this))
        .unbind('searchBoxTextChanged')
        .bind('searchBoxTextChanged', function(e, searchText) {
            if (this.tabBar.selectedTab && !this.tabBar.selectedTab.searchable) {
                this.tabBar.defaultTab.select();
            }
        }.bind(this))
        .unbind('searchBoxFilterChanged')
        .bind('searchBoxFilterChanged', function(e, type, field) {
            if (type == "all") {
                this.tabBar.tabs.cat_all.select();
            }
        }.bind(this))
        .unbind('productTabSelected')
        .bind('productTabSelected', function(e, productTab, categoryId, categoryName) {
            if (typeof this.activeView !== 'undefined' && this.activeView == this.catalogView && !(this.searchBox.filterElement.value == 'creator_name')) {
                this.searchBox.clear();
                this.service.searchState.activeRequest.search = null;
            }
            this.activeView = productTab.view;

            if (!(this.searchBox.filterElement.value == 'creator_name')) {
                if (categoryId) {
                    this.searchBox.setCategoryOption(categoryName, categoryId);
                    this.searchBox.filterElement.selectedIndex = 1;
                } else if (!categoryId) {
                    this.searchBox.clearCategoryOption();
                    this.searchBox.filterElement.selectedIndex = 0;
                }
            }
        }.bind(this))
        .unbind('tryOutfit')
        .bind('tryOutfit', function(e, product) {
            if (product && product.pids.length) {
                this.shopCarousel.tryingOutfit = product;
                this.imvu.call('applyOutfit', product.dataObject.id, product.pids, true);
            }
        }.bind(this))
        .unbind('tryBundle')
        .bind('tryBundle', function(e, product) {
            if (product && product.pids.length) {
                this.shopCarousel.tryingOutfit = product;
                this.imvu.call('applyOutfit', product.dataObject.id, product.pids, false);
            }
        }.bind(this));

    if (IMVU.Client.isShoppingTogether) {
        this.catalogView = new IMVU.Client.ProductGridView({
            imvu: this.imvu,
            container: "main",
            id: "main",
            rowCount: 4,
            colCount: 3,
            paginatorMaxPages: 5,
            mode: this
        });
    } else {
        this.catalogView = new IMVU.Client.ProductGridView({
            imvu: this.imvu,
            container: "main",
            id: "main",
            rowCount: 3,
            colCount: 4,
            mode: this
        });
    }
    this.catalogController.view = this.catalogView;
    this.catalogController.$search.bind('searchSuccessEvent', function(evt, responseObject, products) {
        this.catalogView.handleLoadComplete('searchSuccess', [responseObject, products], this);
    }.bind(this));

    this.wishlistController = new IMVU.Client.WishlistController({
        network: this.net,
        imvu: this.imvu,
        service: this.service,
        mode: this
    });
    this.whitelistedController = new IMVU.Client.WhitelistedController({
        network: this.net,
        imvu: this.imvu,
        service: this.service,
        mode: this
    });
    if (IMVU.Client.isShoppingTogether) {
        this.wishlistView = new IMVU.Client.WishlistGridView({
            imvu: this.imvu,
            container: "wishlist",
            id: "wishlist",
            rowCount: 3,
            colCount: 3,
            paginatorMaxPages: 5,
            mode: this
        });
    } else {
        this.wishlistView = new IMVU.Client.WishlistGridView({
            imvu: this.imvu,
            container: "wishlist",
            id: "wishlist",
            rowCount: 3,
            colCount: 4,
            mode: this
        });
    }
    this.wishlistController.view = this.wishlistView;
    this.wishlistController.wishlistLoadSuccessEvent.subscribe(this.wishlistView.handleLoadComplete, this.wishlistView, true);

    this.checkoutDialogController = new IMVU.Client.CheckoutDialogController({
        imvu: this.imvu,
        purchaseMixin: this.purchaseMixin,
        wishlistController: this.wishlistController
    });
    this.cartController = new IMVU.Client.CartController({
        imvu: this.imvu,
        eventBus: this.eventBus,
        catalogController: this.catalogController,
        purchaseMixin: this.purchaseMixin,
        checkoutDialogController: this.checkoutDialogController
    });
    this.shopCarouselBuyController = new IMVU.Client.ShopCarouselBuyController({
        network: this.net,
        imvu: this.imvu,
        eventBus: this.eventBus,
        catalogController: this.catalogController,
        purchaseMixin: this.purchaseMixin,
        checkoutDialogController: this.checkoutDialogController
    });

    this.$contentRating = $('#content_rating');
    this.$contentRating.click(function(e) {
        this.updateRating($(e.target).attr('class'));
    }.bind(this));

    this.$modTools = $('#mod_tools');
    this.$mcgMood = $('#mcg_mood');
    this.$mcgSkin = $('#mcg_skin');
    if (this.imvu.call("isDOCModerator") || this.imvu.call("isCreator")) {
        this.$modTools.show();
        this.$mcgMood.click(function() {
            this.imvu.call('tryOn', 2111);
        }.bind(this));
        this.$mcgSkin.click(function() {
            this.imvu.call('tryOn', this.imvu.call('getAvatarGender', null) == 'm' ? 1133670 : 1133635);
        }.bind(this));
    }

    this.$contentRating.toggle( !! this.imvu.call('hasAccessPass') && !this.imvu.call('isTeen'));

    this.tabBar.selectTabEvent.subscribe(this.toggleContentFilters, this, true);
    this.tabBar.selectTabEvent.subscribe(this.setContext, this, true);

    this.setupTabs();

    this.kUpdateCreditBalances = this.eventBus.register('updateCreditBalances', function(eventName, obj) {
        IMVU.Client.creditBalance = obj.credits;
        IMVU.Client.promoBalance = obj.predits;
    }, null, this);

    this.kProductUseFailed = this.eventBus.register('productUseFailed', function(eventName, obj) {
        var productToRemove = IMVU.Client.ProductViewCache[obj.pid],
            result;
        if (obj.isWrongGender) {
            result = this.imvu.call('showWrongGenderItemDialog', obj.pid);
            if (!result || !result.result) {
                if (productToRemove) {
                    productToRemove.clickTakeOff();
                }
            }
        }
    }, 'SessionWindow', this);

    this.kAvatarClothingChanged = this.eventBus.register('SessionWindow.avatarClothingUpdated', this.updateAvatarState, 'SessionWindow', this);
    this.kRoomChanged = this.eventBus.register('SessionWindow.roomUpdated', this.updateAvatarState, 'SessionWindow', this);
    this.kFurniUpdated = this.eventBus.register('RoomStateChanged', this.updateAvatarState, undefined, this);
    this.kInventoryUpdated = this.eventBus.register('InventoryChanged', this.updateAvatarState, null, this);
    this.kShowProductInfoDialog = this.eventBus.register('ShowProductInfoDialog', this.showProductInfoDialogCallback, null, this);
    this.kSelectCreator = this.eventBus.register('Mode.ReceiveArgs', this.handleReceiveArgs, null, this);

    this.eventBus.register('modalDialogShown', function() {
        $('#mask').show();
    });
    this.eventBus.register('modalDialogHidden', function() {
        $('#mask').hide();
    });

    var giveFocusAway = function() {
        this.imvu.call('focus3dWindow');
    }.bind(this);

    var takeFocus = function() {
        this.imvu.call('activate');
    }.bind(this);

    $('body').click(function(e) {
        if (e.target.tagName != 'INPUT' && e.target.tagName != 'LABEL' && e.target.tagName != 'SELECT') {
            giveFocusAway();
        } else {
            takeFocus();
        }
    });

    $('#search_cta').click(function(e) {
        e.stopPropagation();
        $('#f_search').focus();
        takeFocus();
    });

    this.imvu.call("forceClothingUpdate");

    $('body').toggleClass('shopTogether', IMVU.Client.isShoppingTogether);
    $('body').toggleClass('qa', this.imvu.call('isQA'));

    this.eventBus.register('ShopModeReady', function() {
        createShopCarouselController.call(this, {
            controller: this.shopCarouselController,
            carousel: this.shopCarousel,
            imvu: this.imvu,
            eventBus: this.eventBus,
            timer: this.timer
        });

        this.imvu.call("forceClothingUpdate");
    }, null, this);

    $('body')
        .bind('afterProductsPurchased', this.productsPurchased.bind(this))
        .bind('afterCheckoutAttempted', this.checkoutAttempted.bind(this))
        .unbind('afterCheckoutFailed').bind('afterCheckoutFailed', this.checkoutFailed.bind(this))
        .unbind('productClickBuy').bind('productClickBuy', function(e, product) {
            this.buy(product);
        }.bind(this))
        .unbind('flag')
        .bind('flag', function(e, product) {
            this.flag(product);
        }.bind(this))
        .unbind('productClickInfo')
        .bind('productClickInfo', function(e, product) {
            this.showInfo(product);
        }.bind(this))
        .unbind('productClickAddToCart')
        .bind('productClickAddToCart', function(e, product) {
            this.cartController.add(product);
        }.bind(this))
        .unbind('productClickAddToWishlist')
        .bind('productClickAddToWishlist', function(e, product) {
            this.wishlistController.add(product);
        }.bind(this))
        .unbind('productClickRemoveFromWishlist')
        .bind('productClickRemoveFromWishlist', function(e, product) {
            this.wishlistController.remove(product);
        }.bind(this))
        .unbind('productClickWhitelistedCheckbox')
        .bind('productClickWhitelistedCheckbox', function(e, product) {
            this.whitelistedController.onClickCheckbox(product, $(this.dialogInfo.elWhitelistedCheckbox).prop('checked'));
        }.bind(this))
        .unbind('productClickCreatorName')
        .bind('productClickCreatorName', function(e, creatorName) {
            this.dialogInfo.hide();
            this.cartController.hide();
            this.shopCarouselBuyController.hide();
            this.searchBox.searchForCreator(creatorName);
        }.bind(this));

    $('#products').show();
};

IMVU.Client.ShopMode.prototype = {

    handleReceiveArgs: function(eventName, obj) {
        if (obj.creator) {
            this.selectView({
                'creator': [obj.creator]
            });
        }
    },

    getTabs: function() {
        this.tabs = [];

        if(IMVU.Client.canShowProductRecommendations) { 
            this.tabs.push({
                name: "recommended",
                label: _T("recommended"),
                attributes: {
                    class: 'category',
                    category_id: null,
                    id: 'cat_recommended',
                    named_category: 'recommended'
                },
                view: this.catalogView,
                filters: {
                    subcategory: [
                        [_T("All"), 41],
                        [_T("Tops"), 69],
                        [_T("Bottoms"), 70],
                        [_T("Hairstyles"), 67],
                        [_T("Eyes"), 91],
                        [_T("Eyebrows"), 92],
                        [_T("Skins"), 68],
                        [_T("Accessories"), 71],
                        [_T("Shoes"), 102],
                        [_T("Bundles"), 316],
                        [_T("Gloves"), 98],
                        [_T("Heads"), 296],
                        [_T("Actions"), 1329],
                    ],
                    price: [
                        [_T("All Prices"), -1],
                        [_T("1 to 1,000 credits"), 1],
                        [_T("1,001 to 2,000 credits"), 2],
                        [_T("2,001 to 5,000 credits"), 3],
                        [_T("5,001 to 10,000 credits"), 4],
                        [_T("10,001+ credits"), 5]
                    ]
                },
                searchable: true,
                showContentFilter: true,
                hideFilters: true
            });
        }
        this.tabs.push({
            name: "all",
            label: _T("all"),
            attributes: {
                class: 'category',
                category_id: null,
                id: 'cat_all'
            },
            view: this.catalogView,
            filters: {
                subcategory: [
                    [_T("All Products"), null],
                    [_T("All"), 40],
                    [_T("Tops"), 128],
                    [_T("Bottoms"), 78],
                    [_T("Hairstyles"), 75],
                    [_T("Eyes"), 89],
                    [_T("Eyebrows"), 90],
                    [_T("Skins"), 76],
                    [_T("Accessories"), 153],
                    [_T("Shoes"), 101],
                    [_T("Bundles"), 324],
                    [_T("Gloves"), 97],
                    [_T("Heads"), 295],
                    [_T("All"), 41],
                    [_T("Tops"), 69],
                    [_T("Bottoms"), 70],
                    [_T("Hairstyles"), 67],
                    [_T("Eyes"), 91],
                    [_T("Eyebrows"), 92],
                    [_T("Skins"), 68],
                    [_T("Accessories"), 71],
                    [_T("Shoes"), 102],
                    [_T("Bundles"), 316],
                    [_T("Gloves"), 98],
                    [_T("Heads"), 296],
                    [_T("All"), 366],
                    [_T("Apartments"), 2102],
                    [_T("Beaches"), 1787],
                    [_T("Castles"), 1030],
                    [_T("Cityscapes"), 1907],
                    [_T("Clubs"), 1564],
                    [_T("Homes"), 1980],
                    [_T("Nature Scenes"), 1901],
                    [_T("All"), 1027],
                    [_T("Couches"), 909],
                    [_T("Tables"), 1199],
                    [_T("Chairs"), 906],
                    [_T("Lamps & Lighting"), 949],
                    [_T("Fountains"), 1332],
                    [_T("Televisions"), 917],
                    [_T("Miscellaneous"), 950],
                    [_T("All"), 1552],
                    [_T("Female Actions"), 1328],
                    [_T("Male Actions"), 1329]
                ],
                price: [
                    [_T("All Prices"), -1],
                    [_T("1 to 1,000 credits"), 1],
                    [_T("1,001 to 2,000 credits"), 2],
                    [_T("2,001 to 5,000 credits"), 3],
                    [_T("5,001 to 10,000 credits"), 4],
                    [_T("10,001+ credits"), 5]
                ]
            },
            searchable: true,
            showContentFilter: true
        });

        if (this.imvu.call('isSellOutfitsEnabled') && !IMVU.Client.isShoppingTogether) {
            this.tabs.push({
                name: 'outfits',
                label: _T('outfits'),
                attributes: {
                    class: 'outfits',
                    id: 'cat_outfits',
                    category_id: 3088
                },
                view: this.catalogView,
                filters: {
                    subcategory: [
                        [_T("All Outfits"), 3088],
                        [_T("Female Outfits"), 3090],
                        [_T("Male Outfits"), 3091]
                    ],
                    price: [
                        [_T("All Prices"), -1],
                        [_T("1 to 1,000 credits"), 1],
                        [_T("1,001 to 2,000 credits"), 2],
                        [_T("2,001 to 5,000 credits"), 3],
                        [_T("5,001 to 10,000 credits"), 4],
                        [_T("10,001+ credits"), 5]
                    ]
                },
                searchable: true,
                showContentFilter: true
            });
        }

        this.tabs.push({
            name: "women",
            label: _T("women"),
            attributes: {
                class: 'category',
                id: 'cat_women',
                category_id: 40
            },
            view: this.catalogView,
            filters: {
                subcategory: [
                    [_T("All"), 40],
                    [_T("Tops"), 128],
                    [_T("Bottoms"), 78],
                    [_T("Hairstyles"), 75],
                    [_T("Eyes"), 89],
                    [_T("Eyebrows"), 90],
                    [_T("Skins"), 76],
                    [_T("Accessories"), 153],
                    [_T("Shoes"), 101],
                    [_T("Bundles"), 324],
                    [_T("Gloves"), 97],
                    [_T("Heads"), 295],
                    [_T("Actions"), 1328],
                ],
                price: [
                    [_T("All Prices"), -1],
                    [_T("1 to 1,000 credits"), 1],
                    [_T("1,001 to 2,000 credits"), 2],
                    [_T("2,001 to 5,000 credits"), 3],
                    [_T("5,001 to 10,000 credits"), 4],
                    [_T("10,001+ credits"), 5]
                ]
            },
            searchable: true,
            showContentFilter: true
        });

        this.tabs.push({
            name: "men",
            label: _T("men"),
            attributes: {
                class: 'category',
                id: 'cat_men',
                category_id: 41
            },
            view: this.catalogView,
            filters: {
                subcategory: [
                    [_T("All"), 41],
                    [_T("Tops"), 69],
                    [_T("Bottoms"), 70],
                    [_T("Hairstyles"), 67],
                    [_T("Eyes"), 91],
                    [_T("Eyebrows"), 92],
                    [_T("Skins"), 68],
                    [_T("Accessories"), 71],
                    [_T("Shoes"), 102],
                    [_T("Bundles"), 316],
                    [_T("Gloves"), 98],
                    [_T("Heads"), 296],
                    [_T("Actions"), 1329],
                ],
                price: [
                    [_T("All Prices"), -1],
                    [_T("1 to 1,000 credits"), 1],
                    [_T("1,001 to 2,000 credits"), 2],
                    [_T("2,001 to 5,000 credits"), 3],
                    [_T("5,001 to 10,000 credits"), 4],
                    [_T("10,001+ credits"), 5]
                ]
            },
            searchable: true,
            showContentFilter: true
        });       

        this.tabs.push({
            name: "avatars",            
            label: _T("avatars"),
            attributes: {
                class: 'avatars',
                id: 'cat_avatar',
                category_id: 108
            },
            view: this.catalogView,
            filters: {
                subcategory: [
                    [_T("All"), 108],
                ],
                price: [
                    [_T("All Prices"), -1],
                    [_T("1 to 1,000 credits"), 1],
                    [_T("1,001 to 2,000 credits"), 2],
                    [_T("2,001 to 5,000 credits"), 3],
                    [_T("5,001 to 10,000 credits"), 4],
                    [_T("10,001+ credits"), 5]
                ]
            },
            searchable: true,
            showContentFilter: true
        });
       
        this.tabs.push({
            name: "pets",
            label: _T("pets"),
            attributes: {
                class: 'category',
                id: 'cat_pets',
                category_id: 425
            },
            view: this.catalogView,
            filters: {
                subcategory: [
                    [_T("All"), 425],
                ],
                price: [
                    [_T("All Prices"), -1],
                    [_T("1 to 1,000 credits"), 1],
                    [_T("1,001 to 2,000 credits"), 2],
                    [_T("2,001 to 5,000 credits"), 3],
                    [_T("5,001 to 10,000 credits"), 4],
                    [_T("10,001+ credits"), 5]
                ]
            },
            searchable: true,
            showContentFilter: true
        });

        if (IMVU.Client.shouldShowFurnitureAndOtherCategories) {
            this.tabs.push({
                name: "rooms",
                vip_only: true,
                shop_together: IMVU.Client.isShoppingTogether,
                label: '<span class="vip-shield"></span><span>' + _T("rooms") + "</span>",
                attributes: {
                    class: 'category',
                    id: 'cat_rooms',
                    category_id: 366
                },
                view: this.catalogView,
                filters: {
                    subcategory: [
                        [_T("All"), 366],
                        [_T("Apartments"), 2102],
                        [_T("Beaches"), 1787],
                        [_T("Castles"), 1030],
                        [_T("Cityscapes"), 1907],
                        [_T("Clubs"), 1564],
                        [_T("Homes"), 1980],
                        [_T("Nature Scenes"), 1901]
                    ],
                    price: [
                        [_T("All Prices"), -1],
                        [_T("1 to 1,000 credits"), 1],
                        [_T("1,001 to 2,000 credits"), 2],
                        [_T("2,001 to 5,000 credits"), 3],
                        [_T("5,001 to 10,000 credits"), 4],
                        [_T("10,001+ credits"), 5]
                    ]
                },
                searchable: true,
                showContentFilter: true
            });

            this.tabs.push({
                name: "furniture",
                vip_only: true,
                shop_together: IMVU.Client.isShoppingTogether,
                label: '<span class="vip-shield"></span><span>' + _T("furniture") + "</span>",
                attributes: {
                    class: 'category',
                    id: 'cat_furniture',
                    category_id: 1027
                },
                view: this.catalogView,
                filters: {
                    subcategory: [
                        [_T("All"), 1027],
                        [_T("Couches"), 909],
                        [_T("Tables"), 1199],
                        [_T("Chairs"), 906],
                        [_T("Lamps & Lighting"), 949],
                        [_T("Fountains"), 1332],
                        [_T("Televisions"), 917],
                        [_T("Miscellaneous"), 950]
                    ],
                    price: [
                        [_T("All Prices"), -1],
                        [_T("1 to 1,000 credits"), 1],
                        [_T("1,001 to 2,000 credits"), 2],
                        [_T("2,001 to 5,000 credits"), 3],
                        [_T("5,001 to 10,000 credits"), 4],
                        [_T("10,001+ credits"), 5]
                    ]
                },
                searchable: true,
                showContentFilter: true
            });
            
            this.tabs.push({
                name: "poses",
                vip_only: true,
                shop_together: IMVU.Client.isShoppingTogether,
                label: '<span class="vip-shield"></span><span>' + _T("poses") + "</span>",
                attributes: {
                    class: 'category',
                    id: 'cat_poses',
                    category_id: 1552
                },
                view: this.catalogView,
                filters: {
                    subcategory: [
                        [_T("All"), 1552],
                        [_T("Female Actions"), 1328],
                        [_T("Male Actions"), 1329]
                    ],
                    price: [
                        [_T("All Prices"), -1],
                        [_T("1 to 1,000 credits"), 1],
                        [_T("1,001 to 2,000 credits"), 2],
                        [_T("2,001 to 5,000 credits"), 3],
                        [_T("5,001 to 10,000 credits"), 4],
                        [_T("10,001+ credits"), 5]
                    ]
                },
                searchable: true,
                showContentFilter: true
            });
        }
        
        this.tabs.push({
            name: "wishlist",
            label: _T("wishlist"),
            attributes: {
                class: 'wishlist',
                id: 'cat_wishlist',
                category_id: null
            },
            view: this.wishlistView,
            filters: {
                subcategory: [
                    [_T("All Products"), 0],
                    [_T("All Outfits"), 3088],
                    [_T("- Female Outfits"), 3090],
                    [_T("- Male Outfits"), 3091],
                    [_T("All Womens"), 40],
                    [_T("- Tops"), 128],
                    [_T("- Bottoms"), 78],
                    [_T("- Hairstyles"), 75],
                    [_T("- Eyes"), 89],
                    [_T("- Eyebrows"), 90],
                    [_T("- Skins"), 76],
                    [_T("- Accessories"), 153],
                    [_T("- Shoes"), 101],
                    [_T("- Bundles"), 324],
                    [_T("- Gloves"), 97],
                    [_T("- Heads"), 295],
                    [_T("All Mens"), 41],
                    [_T("- Tops"), 69],
                    [_T("- Bottoms"), 70],
                    [_T("- Hairstyles"), 67],
                    [_T("- Eyes"), 91],
                    [_T("- Eyebrows"), 92],
                    [_T("- Skins"), 68],
                    [_T("- Accessories"), 71],
                    [_T("- Shoes"), 102],
                    [_T("- Bundles"), 316],
                    [_T("- Gloves"), 98],
                    [_T("- Heads"), 296],
                    [_T("Rooms"), 366],
                    [_T("Furniture"), 1027],
                    [_T("Poses"), 1552],
                    [_T("- Female Actions"), 1328],
                    [_T("- Male Actions"), 1329]
                ]
            },
            searchable: true,
            showContentFilter: true
        });               

        return this.tabs;
    },

    selectTabOnLoad: function(ignoreIfLoaded) {
        if (ignoreIfLoaded && (this.loaded || this.tabBar.selectedTab != null)) {
            return;
        }

        var gender = this.imvu.call("getGender");
        var avatarstate = this.shopCarouselController.getShopTriedProducts();
        var genderTab = (gender == 'm') ? 'cat_men' : 'cat_women';

        this.tabBar.setDefault(genderTab);

        this.tabBar.defaultTab.select();

        this.loaded = true;
    },

    toggleContentFilters: function(event) {
        this.$contentRating.toggle( !! this.imvu.call('hasAccessPass') && !this.imvu.call('isTeen') && this.tabBar.selectedTab.showContentFilter);
    },

    setContext: function(event) {
        var context = this.tabBar.selectedTab.tabid.replace('cat_', 'sitc_');
        if (IMVU.Client.isShoppingTogether) {
            context = 'together_' + context;
        }
        this.service.setContext(context);
    },

    showProductInfoDialogCallback: function(eventName, obj) {
        var self = this;
        var pid = obj.pid;
        var showDialogCallback = function(productViews) {
            self.showInfo(productViews[0]);
        };

        IMVU.Client.widget.Product.createWithPID(pid, showDialogCallback, self.imvu.call, self.net, null);
    },

    flag: function(product) {
        this.imvu.call('launchUrl', 'http://www.imvu.com/catalog/web_flag_product_new.php?products_id=' + product.dataObject.id);
    },

    showInfo: function(product) {
        if ('isFromTryOnOutfitBundleUrl' in product) {
            product = IMVU.Client.widget.Product.create(product.dataObject, this.imvu);
        }

        this.dialogInfo.product = product;
        var searchState = this.service.searchState.activeRequest;

        var buy = function() {
            this.dialogInfo.wait();
            $('#f_save_outfit').prop('checked', false);
            //activePage becomes undefined in tests, so define it as 1 instead
            this.purchaseMixin.buy(product.dataObject.id, [product], searchState.search, searchState.category, (searchState.activePage) ? searchState.activePage : 1, searchState.sort_field, searchState.sort_direction, 'one_click_buy');
        };

        YAHOO.util.Event.purgeElement(this.dialogInfo.elBuy);
        this.dialogInfo.elBuy.innerHTML = _T("Buy");
        new ImvuButton(this.dialogInfo.elBuy, {
            callback: buy.bind(this)
        });

        YAHOO.util.Event.purgeElement(this.dialogInfo.elTry);
        this.dialogInfo.elTry.innerHTML = _T("Try");
        new ImvuButton(this.dialogInfo.elTry, {
            grey: true,
            callback: product.clickTryOn.bind(product)
        });

        YAHOO.util.Event.purgeElement(this.dialogInfo.elAddToWishlist);
        YAHOO.util.Event.addListener(this.dialogInfo.elAddToWishlist, "click", product.clickAddToWishlist, product, true);
        YAHOO.util.Event.purgeElement(this.dialogInfo.elWhitelistedCheckbox);
        YAHOO.util.Event.addListener(this.dialogInfo.elWhitelistedCheckbox, "click", product.clickWhitelistedCheckbox, product, true);
        YAHOO.util.Event.purgeElement(this.dialogInfo.elAddToCart);
        YAHOO.util.Event.addListener(this.dialogInfo.elAddToCart, "click", product.clickAddToCart, product, true);
        YAHOO.util.Event.purgeElement(this.dialogInfo.elRecommend);
        YAHOO.util.Event.addListener(this.dialogInfo.elRecommend, "click", product.clickRecommend, product, true);
        YAHOO.util.Event.purgeElement(this.dialogInfo.elGift);
        YAHOO.util.Event.addListener(this.dialogInfo.elGift, "click", product.clickGift, product, true);
        YAHOO.util.Event.purgeElement(this.dialogInfo.elCreatorName);
        YAHOO.util.Event.addListener(this.dialogInfo.elCreatorName, "click", product.clickCreatorName, product, true);

        $(this.dialogInfo.innerElement).toggleClass('in-inventory', !! product.dataObject.owns_product)
            .toggleClass('in-wishlist', !! product.dataObject.in_wishlist)
            .toggleClass('tryable', !! product.tryable)
            .toggleClass('purchasable', !!product.dataObject.purchasable);

        if (IMVU.Client.widget.Product.isWhitelisted(product.dataObject)) {
            $(this.dialogInfo.elWhitelistedCheckbox).prop('checked', true);
        } else {
            $(this.dialogInfo.elWhitelistedCheckbox).prop('checked', false);
        }

        if (this.dialogInfo.showWhitelisted) {
            this.refreshWhitelist(this.dialogInfo);
        }
        this.dialogInfo.show();
    },

    updateAvatarState: function(eventName, obj) {
        var self = this;

        var callback = function(state) {
            var ownedItems = state.owned;
            var notOwnedItems = state.notOwned;
            var allItems = ownedItems.concat(notOwnedItems);

            self.productsInUse = {};
            self.pidsInUse = [];

            var pids = allItems.map(function(item) {
                return item.products_id;
            });

            var productsLoadedCallback = function(productViews) {
                productViews.forEach(function(productView) {
                    var pid = parseInt(productView.dataObject.id, 10);
                    self.productsInUse[pid] = productView;
                    self.pidsInUse.push(pid);
                });

                if (typeof self.activeView !== 'undefined') {
                    self.activeView.refresh();
                }
            };

            IMVU.Client.widget.Product.createWithPIDs(pids, productsLoadedCallback, self.imvu, self.net, null);

            self.selectTabOnLoad(true);

            if (!self.ready) {
                self.eventBus.fire("ShopModeReady", {});
                self.ready = true;
            }
        };

        if (this.timeoutId >= 0) {
            this.timer.clearTimeout(this.timeoutId);
        }

        this.timeoutId = this.timer.setTimeout(function() {
            IMVU.callAsync("getShopTriedProducts", callback, this.imvu);
        }, 1000);
    },

    setupTabs: function() {
        this.tabs = this.getTabs();

        for each(var tab in this.tabs) {
            this.tabBar.addTab(tab);
        }
    },

    updateRating: function(rating) {
        this.$contentRating.attr('class', rating);
        rating = rating.replace(" ui-event", "");
        var inactiveView = (this.activeView == this.catalogView ? this.wishlistView : this.catalogView);
        inactiveView.controller.setRating(rating, true);
        this.activeView.controller.setRating(rating);
    },

    selectView: function(args) {
        if (this.timeoutId >= 0) {
            this.timer.clearTimeout(this.timeoutId);
        }

        for each(var tab in this.tabs) {
            var arg_tab_id = "cat_" + args.tab;
            if (arg_tab_id == tab.attributes.id) {
                this.tabBar.tabs[tab.attributes.id].select();
                var subcatid = args.subcatid;
                if (!subcatid && args.subcatname) {
                    for each(var subcat in tab.filters.subcategory) {
                        if (subcat[0] == args.subcatname) {
                            subcatid = subcat[1];
                        }
                    }
                }
                if (subcatid) {
                    var dropdown = tab.view.subcategory;
                    for each(var o in dropdown.options) {
                        if (o.value == subcatid) {
                            o.selected = true;
                        }
                    }
                    synthesizeChange(dropdown);
                }
                break;
            }
        }

        if (this.imvu.call("hasAccessPass") && args.rating) {
            this.updateRating(args.rating[0]);
        }

        if (args.creator) {
            this.searchBox.searchForCreator(args.creator[0]);
            this.catalogView.sortSelect.selectedIndex = 3;
        }

        this.imvu.call("forceClothingUpdate");
    },

    refreshWhitelist: function(dialog) {
        var self_dialog = dialog;

        var productData = dialog.product.dataObject;
        var refreshCallback = function(response, error) {
            if (error) {} else {
                self_dialog.setWhitelist(response.rating);
                if (self_dialog.canModifyWhitelist) {
                    self_dialog.enableWhitelistCheckbox();
                }
            }
        };
        serviceRequest({
            method: 'GET',
            uri: '/api/shop/whitelist.php?pid=' + productData.id,
            data: null,
            callback: refreshCallback,
            json: true,
            network: this.net,
            imvu: this.imvu,
        });
    },
};

IMVU.Client.ShopMode.prototype.productsPurchased = function(event, products, response) {
    if (this.dialogInfo) {
        this.dialogInfo.hide();
    }
}

IMVU.Client.ShopMode.prototype.checkoutAttempted = function(event, products, response) {
    if (this.dialogInfo) {
        this.dialogInfo.stopWaiting();
    }
}

IMVU.Client.ShopMode.prototype.checkoutFailed = function(o) {
    if (this.dialogInfo) {
        this.dialogInfo.hide();
        this.dialogInfo.stopWaiting();
    }
}
var Dom = YAHOO.util.Dom;
var Event = YAHOO.util.Event;

function InventoryTool(spec) {
    var self = this;
    spec = spec || {};
    this.rootElement = spec.rootElement;
    this.dataSource = spec.dataSource;
    this.imvu = spec.imvu;
    this.network = spec.network;
    this.eventBus = spec.eventBus;
    this.timer = spec.timer;
    this.mode = spec.mode || 'clothing';

    this.categoryPanel = spec.categoryPanel || {$categories:$([])};
    this.categoryPanel.inventoryTool = this; // Ghetto. I'll fix this soon with listeners.

    this.sideView = this.imvu.call('isSideView');
    if (this.sideView) {
        $('.category-panel').addClass('tall');
    }

    if (this.mode == 'clothing') {
        this.setupListView();
    }

    this.$gender = $(this.rootElement).find('.new-gender');
    this.$gender.find('.male').bind('click', function () {
        if (this.$gender.is('.disabled')) {
            return;
        }
        this.imvu.call('setPref', 'inventoryGender', 'male');
        this.$gender.removeClass('female both').addClass('male');
        this.$gender.find('*').removeClass('selected');
        this.$gender.find('.male').addClass('selected');
        this.timer.setTimeout(this.refresh.bind(this, false), 150);
    }.bind(this));
    this.$gender.find('.both').bind('click', function () {
        if (this.$gender.is('.disabled')) {
            return;
        }
        this.imvu.call('setPref', 'inventoryGender', 'all');
        this.$gender.removeClass('male female').addClass('both');
        this.$gender.find('*').removeClass('selected');
        this.$gender.find('.both').addClass('selected');
        this.timer.setTimeout(this.refresh.bind(this, false), 150);
        }.bind(this));
    this.$gender.find('.female').bind('click', function () {
        if (this.$gender.is('.disabled')) {
            return;
        }
        this.imvu.call('setPref', 'inventoryGender', 'female');
        this.$gender.removeClass('male both').addClass('female');
        this.$gender.find('*').removeClass('selected');
        this.$gender.find('.female').addClass('selected');
        this.timer.setTimeout(this.refresh.bind(this, false), 150);
    }.bind(this));

    this.$maturity = $(this.rootElement).find('.new-maturity');
    this.$maturity.find('.ga').bind('click', function () {
        this.imvu.call('setPref', 'inventoryMaturity', 'ga');
        this.$maturity.removeClass('ap both').addClass('ga');
        this.$maturity.find('*').removeClass('selected');
        this.$maturity.find('.ga').addClass('selected');
        this.timer.setTimeout(this.refresh.bind(this, false), 150);
    }.bind(this));
    this.$maturity.find('.both').bind('click', function () {
        this.imvu.call('setPref', 'inventoryMaturity', 'all');
        this.$maturity.removeClass('ga ap').addClass('both');
        this.$maturity.find('*').removeClass('selected');
        this.$maturity.find('.both').addClass('selected');
        this.timer.setTimeout(this.refresh.bind(this, false), 150);
    }.bind(this));
    this.$maturity.find('.ap').bind('click', function (e) {
        this.imvu.call('setPref', 'inventoryMaturity', 'ap');
        this.$maturity.removeClass('ga both').addClass('ap');
        this.$maturity.find('*').removeClass('selected');
        this.$maturity.find('.ap').addClass('selected');
        this.timer.setTimeout(this.refresh.bind(this, false), 150);
    }.bind(this));

    function setView(v) {
        $(self.rootElement)
            .toggleClass('default-view', v == 'thumbnail-margins')
            .toggleClass('list-view', v == 'list');
        self.imvu.call('setPref', 'inventoryView', v);
        self.onVisibleProductsInvalidated(true);

        self.$views
            .removeClass('default old list')
            .addClass({'thumbnail-margins': 'default', thumbnail: 'old', list: 'list'}[v]);
    }

    this.$views = $(this.rootElement).find('.new-views');
    this.$views.find('.default').bind('click', function () {
        this.$views.removeClass('old list').addClass('default');
        setView('thumbnail-margins');
    }.bind(this));
    this.$views.find('.old').bind('click', function () {
        this.$views.removeClass('default list').addClass('old');
        setView('thumbnail');
    }.bind(this));
    this.$views.find('.list').bind('click', function () {
        this.$views.removeClass('default old').addClass('list');
        setView('list');
    }.bind(this));

    this.customSetOnload = spec.customSetOnload || function (img, onload) {img.onload = onload;};
    this.bucketSize = spec.bucketSize || 12;
    this.shouldShowSaveOutfitButton = (spec.shouldShowSaveOutfitButton === undefined) ? true : spec.shouldShowSaveOutfitButton;
    this.shouldShowDefaultRoom = (spec.shouldShowDefaultRoom === undefined) ? true : spec.shouldShowDefaultRoom;
    this.windowUtils = spec.windowUtils ||
        window.QueryInterface(window.Components.interfaces.nsIInterfaceRequestor).getInterface(window.Components.interfaces.nsIDOMWindowUtils);
    this.elInventory = this.$('.inventory');
    this.elToolbarX = this.$('.close');
    this.elToolbarRefresh = this.$('.refresh');
    this.elSaveOutfit = this.$('.save-outfit');
    this.elUndo = this.$('.undo');
    this.elRedo = this.$('.redo');

    new ImvuButton(this.elSaveOutfit, {small:true, grey:true});
    new ImvuButton(this.elRedo, {small:true, grey:true});
    new ImvuButton(this.elUndo, {small:true, grey:true});

    labelover(this.elSearch = this.$('.search input'));
    this.elSearchX = this.$('#search-x');

    Event.on(this.elToolbarX, 'click', function() {this.imvu.call('closeActiveTool');}.bind(this));
    Event.on(this.elToolbarRefresh, 'click', this.toolbarRefresh.bind(this));

    this.filter = null;
    this.offset = 0;
    this.length = 50;

    Event.on(this.elSaveOutfit, 'click', this.saveOutfit.bind(this));
    Event.on(this.elUndo, 'click', function() { this.imvu.call('undoInventoryChange');}.bind(this) );
    Event.on(this.elRedo, 'click', function() { this.imvu.call('redoInventoryChange');}.bind(this) );
    Event.on(this.elSearch, 'keyup', this.searchChanged.bind(this));
    Event.on(this.elSearch, 'change', this.searchChanged.bind(this));
    Event.on(this.elSearchX, 'click', this.clearSearch.bind(this));

    var giveFocusAway = function () {
        this.imvu.call('focus3dWindow');
    }.bind(this);

    var takeFocus = function () {
        this.imvu.call('activate');
    }.bind(this);

    $(this.rootElement).click(function(e) {
        if(e.target.tagName != 'INPUT' && e.target.tagName != 'LABEL' && e.target.tagName != 'SELECT') {
            giveFocusAway();
        } else {
            takeFocus();
        }
    });
    $(this.rootElement).keydown(function(e) {
        if (e.keyCode == 13) {
            giveFocusAway();
        }
    });

    $(this.elSearchX).click(function(e) {
        e.stopPropagation();
        takeFocus();
        $('#seach-field').focus();
    });

    this.eventBus.register('SessionWindow.avatarClothingUpdated', this.onAvatarClothingUpdated.bind(this, 'SessionWindow'));
    this.eventBus.register('InventoryChanged', this.inventoryChanged.bind(this));

    this.eventBus.register('InventoryRefresh:Start', this.startRefreshSpinner.bind(this));
    this.eventBus.register('InventoryRefresh:End', this.stopRefreshSpinner.bind(this));

    var hasAP = this.imvu.call('hasAccessPass');
    if (hasAP) {
        $(this.rootElement).addClass('ap');
    } else {
        this.$maturity.hide();
    }

    if (this.mode == 'scenes') {
        this.categoryPanel
            .$categories.hide();
            this.categoryPanel.$categories.filter('.recently-added, .all-categories, ..homes, .nature, .cityscape').show();
    }

    if (this.mode == 'furniture') {
        this.eventBus.fire('InventoryTool.FurnitureToolShown', {});
        this.categoryPanel
            .$categories.hide();
            this.categoryPanel.$categories.filter('.recently-added, .all-categories, .chairs, .lamp, .tables, .TV').show();
    }

    var canShowWantedCategory = false;
    var wantCategory = this.imvu.call('getPref', 'inventoryCategory');
    if (hasAP || (wantCategory != 'restricted')) {
        this.categoryPanel.$categories.each(function (index, value) {
            if ($(value).attr('data-filter') == wantCategory) {
                $(value).click();
                canShowWantedCategory = $(value).is(':visible');
            }
        }.bind(this));
    }

    if (this.mode !== 'furniture' || this.mode !== 'scenes') {
        var wantGender = this.imvu.call('getPref', 'inventoryGender');
        if (wantGender == 'male') {
            this.$gender.find('.male').click();
        } else if (wantGender == 'female') {
            this.$gender.find('.female').click();
        } else {
            this.$gender.find('.both').click();
        }
    }

    if (hasAP) {
        var wantMaturity = this.imvu.call('getPref', 'inventoryMaturity');
        if (wantMaturity == 'ga') {
            this.$maturity.find('.ga').click();
        } else if (wantMaturity == 'all') {
            this.$maturity.find('.both').click();
        } else if (wantMaturity == 'ap') {
            this.$maturity.find('.ap').click();
        }
    }
    else {
        this.$maturity.find('.both').click();
        $('.maturity').addClass('hidden');
        $('.categories .restricted').addClass('hidden');
    }

    var inventoryView = this.imvu.call('getPref', 'inventoryView');
    setView(inventoryView);

    $('div.title').addClass(this.mode);
    if (this.shouldShowSaveOutfitButton == false) {
        $(this.elSaveOutfit).addClass('hidden');
    }

    Event.on(this.elInventory, 'mouseenter', this.animateImages.bind(this, true));
    Event.on(this.elInventory, 'mouseleave', this.animateImages.bind(this, false));
    this.animateImages(false);

    if (!canShowWantedCategory) {
        if (wantCategory == 'recent') {
            this.categoryPanel.$categories.filter('.recently-added').click();
        } else {
            this.categoryPanel.$categories.filter('.all-categories').click();
        }
    }

    if((this.mode == 'furniture') || ( this.mode == 'scenes')) {
        $('.save-outfit').hide();
        this.$gender.hide();
    }

    this.visibleProductsTimeout = null;
    this.widgetDimensions = null;
    Event.on(this.elInventory, 'scroll', this.onVisibleProductsInvalidated.bind(this, false));
    Event.on(window, 'resize', this.onVisibleProductsInvalidated.bind(this, true));

    this.defaultRoomPid = this.imvu.call('getDefaultRoom');
    this.elDefaultRoom = null;

    new YAHOO.widget.Tooltip('toolbar tooltips', {
        context: [this.elSaveOutfit, this.$('.search'), this.elToolbarRefresh],
        showDelay: 500
    });
    this.showing = false;

    this.savedOutfitHint = null;
    this.hideSuccessHint = null;
    this.emptyInventoryHint = null;
    this.hideInfoHint = null;
    this.newListHint = null;
    if(this.imvu.call('shouldSeeInventoryHideHint')) {
        IMVU.log("creating hideInfoHint");
        this.hideInfoHint = create_informational_message(
            {html: '<b>'+_T("To hide an item:")+'</b> '+_T("Mouse over item icon in your inventory, click")+
                    ' <img src="img/product_info.png" align="top"> '+_T("then click")+' <u>'+_T("Hide")+'</u>'},
            'none', 'bottom-right',
            this.getHideProductHintPos.bind(this), undefined, this.imvu);
        this.hideInfoHint.showCloseButton();
        this.hideInfoHint.hint_container.find('.close-button').click(function() {this.imvu.call('setHideInventoryHintShown');}.bind(this));
    }
    this.wornPids = this.imvu.call('getMyOutfit');
}

InventoryTool.prototype = {
    $: function(spec, parentEl) {
        return (parentEl || this.rootElement).querySelector(spec);
    },

    $$: function(spec, parentEl) {
        return (parentEl || this.rootElement).querySelectorAll(spec);
    }
}

InventoryTool.prototype.FURNI_CATEGORIES = [1027, 110];
InventoryTool.prototype.ROOM_CATEGORIES = [109, 366, 626, 2386];

InventoryTool.prototype.getTotalBuckets = function () {
    return this.elInventory.children.length;
}

InventoryTool.prototype.getBucket = function (index) {
    return this.elInventory.children[index];
}

InventoryTool.prototype.clearSearch = function () {
    this.elSearch.value = "";
    this.refresh();
}

InventoryTool.prototype.searchChanged = function () {
    this.timer.clearTimeout(this.searchTimeout);
    this.searchTimeout = this.timer.setTimeout(this.refresh.bind(this), 300);
}

InventoryTool.prototype.setGenderEnabledStateForFilter = function(filter) {
    if ($(filter).closest('.categories').length) {
        this.$gender.toggleClass('disabled', !!filter.getAttribute('genderless'));
    }
}

InventoryTool.prototype.productClicked = function (el) {
    if (el.product.is_modicon) {
        this.imvu.call('putOnProduct', el.product.pid);
        return;
    }

    var $el = $(el);
    if ($el.hasClass('changing')) {
        return;
    }

    $el.addClass('changing');
    $('.putOnOrTakeOff', el).html(_T("Changing"));

    if (el.product.is_room) {
        var changeRoomResult = this.imvu.call('changeRoomShell', el.product.pid);
        if (changeRoomResult && changeRoomResult['in_use'] !== undefined) {
            $el.find('.add.button').hide();
            $el.find('.in_use').show();
            this.timer.setTimeout(function () {
                $el.removeClass('changing');
                $el.find('.in_use').hide();
                $('.putOnOrTakeOff', el).html(_T("Put On"));
            }, 30000);
            return;
        } else if (changeRoomResult && changeRoomResult['skip_add_product'] !== undefined) {
            this.timer.setTimeout(function () {
                $el.removeClass('changing');
                $('.putOnOrTakeOff', el).html(_T("Put On"));
            }, 10000);
            return;
        }
    }

    if ($el.hasClass('worn')) {
        this.imvu.call('removeProduct', el.product.pid);
        this.imvu.call('recordFact', 'Client Inventory Panel Remove Product', {'product_id':el.product.pid});
    } else {
        this.timer.setTimeout(function () {$el.removeClass('changing');}, 5000);
        this.imvu.call('putOnProduct', el.product.pid);
        this.imvu.call('recordFact', 'Client Inventory Panel Apply Product', {'product_id':el.product.pid});
    }
}

InventoryTool.prototype.productInfo = function(el, product, evt) {
    //prevent click event on the product info icon from bubbling up into the parent node
    if (evt) {
        Event.stopEvent(evt);
    }
    $(el).addClass('info_viewable');
    this.imvu.call('recordFact', 'Client Inventory Panel Flip Product Over', {'product_id':product.pid});
}

InventoryTool.prototype.productInfoHide = function(el) {
    $(el).removeClass('info_viewable');
}

InventoryTool.prototype.injectProductWidget = function (el, product, index) {
    el.className = 'product';
    var genderClasses = ['gender'];
    if (product.is_male) {
        genderClasses.push('male');
    } else if (product.is_female) {
        genderClasses.push('female');
    }
    var button_hover_text = _T('Add');

    el.innerHTML = [
        '<div class="header-name">' + _.escape(product.name) + '</div>',
        '<img class="thumbnail" />',
        '<div class="info">',
            '<div class="close"></div>',
            ((product.is_room && this.shouldShowDefaultRoom) ? '<span class="set_as_default">'+_T("Set as default")+'</span>' : ''),
            '<span class="name">' + _.escape(product.name) + '</span>',
            '<span class="creator">'+_T("by")+' <span>' + product.creator_name + '</span></span>',
            '<span class="hide">'+_T("Hide")+'</span>',
            (product.is_male || product.is_female) ? ('<span class="' + genderClasses.join(' ') + '"></span>') : '',
            '<span class="putOnOrTakeOff"></span>',
        '</div>',
        '<div class="tint">',
            '<div class="default_room"></div>',
            '<div class="in_use"></div>',
            '<div class="apicon"></div>',
            '<div class="infoicon"></div>',
            '<span class="remove button"><div class="dash"></div><div class="text">'+_T("Remove")+'</div></span>',
            '<span class="add button"><div class="dash"></div><div class="vdash"></div><div class="text">'+button_hover_text+'</div></span>',
            '<div class="changeSpinner"></div>',
        '</div>',
        '<div class="checkbox-icon"></div>'
    ].join('');

    $(el).addClass("index-" + index).data("index", index);
    if(product.is_ap) {
        $(el).addClass('ap');
    }
    if (product.is_room && this.shouldShowDefaultRoom) {
        var elSetAsDefault = el.querySelector('.set_as_default');
        Event.on(elSetAsDefault, 'click', function () {            
            var shopTogetherRoomId = this.imvu.call('getShopTogetherRoomId');
            if (parseInt(shopTogetherRoomId) == parseInt(product.pid)) {
                this.imvu.call(
                        'showErrorDialog',
                        _T('Please select another room.'),
                        _T("You may not use the same room as default background for Shop Together and My Room.")
                    );
                return;
            }
            
            $(el).addClass('default_room');
            $(this.elDefaultRoom).removeClass('default_room');
            this.elDefaultRoom = el;
            this.productInfoHide(elInfo);
            this.imvu.call('setDefaultRoom', product.pid);
            this.productClicked(el);
        }.bind(this));
        if (this.defaultRoomPid == product.pid) {
            $(el).addClass('default_room');
            this.elDefaultRoom = el;
        }
    }
    el.product = product;
    el.setAttribute('title', product.name);
    el.setAttribute('pid', product.pid);

    var elThumbnail = $(el).find('.thumbnail')[0];
    this.customSetOnload(elThumbnail, function () {
        el.style.opacity = '1';
        el.style.backgroundImage = 'none';
        elThumbnail.style.display = 'inline';
    });
    elThumbnail.src = product.thumbnail_url;

    var elInfoIcon = this.$('div.infoicon', el);
    var elInfo = this.$('.info', el);
    var self = this;

    Event.on(this.$('.name', elInfo), 'click', function(e){
        if (e.ctrlKey || e.metaKey ) {
            self.clickProductWithCtrlKey($(this).closest(".product"));
        } else if (e.shiftKey){
            self.clickProductWithShiftKey($(this).closest(".product"));
        } else {
            self.launchNamedUrl('catalog_product_info', {products_id: product.pid});
        }
    });

    Event.on(this.$('.creator', elInfo), 'click', function(e){
        if (e.ctrlKey || e.metaKey ) {
            self.clickProductWithCtrlKey($(this).closest(".product"));
        } else if (e.shiftKey){
            self.clickProductWithShiftKey($(this).closest(".product"));
        } else {
            self.launchNamedUrl('catalog_search', {advanced_search: 1, manufacturers_id: product.creator_id});
        }
    });

    Event.on(this.$('.hide',  elInfo), 'click', this.hideProductEl.bind(this, el, product.pid));

    var elThumb = this.$('.tint', el);  /* tint is visible only in thumb view, to prevent clicking the whole row in list view */
    Event.on(elThumb, 'click', function(e){
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
            return ;
        } else {
            self.productClicked(el);
        }
    });

    var elPutOnOrTakeOff = this.$('.putOnOrTakeOff', el);
    Event.on(elPutOnOrTakeOff, 'click', this.productClicked.bind(this, el));

    Event.on(elInfoIcon, 'click', this.productInfo.bind(this, elInfo, product));
    Event.on(elInfo, 'mouseleave', this.productInfoHide.bind(this, elInfo));
    Event.on(this.$('.close', elInfo), 'click', this.productInfoHide.bind(this, elInfo));

    // Stop the click event so it doesn't creep into the product thumbnail view
    Event.on(elInfo, 'click', function(e){Event.stopEvent(e);});

    this.makeProductDraggable($(el));

    return el;
}

InventoryTool.prototype.hideProductEl = function (el, pid) {
    if(this.hideInfoHint != null) {
        this.imvu.call('setHideInventoryHintShown');
        this.hideInfoHint.dismiss();
        this.hideInfoHint = null;
    }
    $(el).addClass('hidden');
    this.imvu.call('hideProduct', pid);
    this.fetchVisibleProducts();

    serviceRequest({
        method: 'POST',
        uri: '/api/service/inventory/inventory_delete.php',
        data: {
            'action': 'delete',
            'cid': this.imvu.call('getCustomerId'),
            'pid': pid
        },
        network: this.network,
        imvu: this.imvu,
        callback: function(result, error) {
            if (error) {
                this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a problem hiding your item"));
                $(el).removeClass('hidden');
                this.imvu.call('unhideProduct', pid);
            }else {
                if (el.parentNode) {
                    if (el.parentNode.childElementCount > 1){
                         el.parentNode.removeChild(el);
                    } else {
                        $(el.parentNode).remove();
                    }
                }

                if (this.hideSuccessHint == null) {
                    IMVU.log("creating hideSuccessHint");
                    this.hideSuccessHint = create_informational_message(
                        {html: _T('Your item has been hidden!') + ' ' +
                         '<u><span id="web_inventory">' +
                         _T('Manage your items') + ' ' +
                         '<img src="img/ic_gotoshop.png"></span></u>'},
                        'none', 'bottom-right',
                        this.getHideProductHintPos.bind(this), undefined, this.imvu);
                    this.hideSuccessHint.showCloseButton();
                    this.hideSuccessHint.hint_container.find('#web_inventory').css('cursor', 'pointer');
                    this.hideSuccessHint.hint_container.find('#web_inventory').click(function() {
                         self.imvu.call('launchUrl', 'http://www.imvu.com/catalog/web_inventory.php');
                         });
                    var self = this;
                    this.timer.setTimeout(function() {
                        self.hideSuccessHint.dismiss();
                        self.hideSuccessHint = null;
                        }, 5000);
                }
            }
        }.bind(this)
    });
}

InventoryTool.prototype.getHideProductHintPos = function() {
    return ({left: $('#tool').width() - 20, top: $('#tool').height() - 20});
}

InventoryTool.prototype.launchNamedUrl = function (name, params) {
    this.imvu.call('launchNamedUrl', name, params);
    this.imvu.call('recordFact', 'Client Inventory Panel Click Link', {'link': name});
}

InventoryTool.prototype.inventoryChanged = function () {
    this.refresh(true);
}

InventoryTool.prototype.changeRoomShell = function (roomPid) {
    var result = this.imvu.call('showYesNoDialog', _T('Change Room Shell?'), _T('Changing the room shell in') + ' Our Room ' + _T('will remove all current furniture. Are you sure you want to proceed?'));
    if (result && result.result) {
        this.imvu.call('changePublicRoomShell', roomPid);
    }
}

InventoryTool.prototype.onAvatarClothingUpdated = function () {
    if ($('.categories .wearing').is('.selected')) {
        this.refresh(true);
    }
    this.updateProductRemoveOnChangedClothes();
}

InventoryTool.prototype.updateProductRemoveOnChangedClothes = function (elBucket) {
    var newWornPids = this.imvu.call('getMyOutfit');

    var pidsToRemove = _.difference(this.wornPids, newWornPids);
    var pidsToAdd = _.difference(newWornPids, this.wornPids);

    var li = null;

    for each(var pid in pidsToRemove) {
        this.updateProductRemoveButton(pid, false, true);
    }

    for each(var pid in pidsToAdd) {
        this.updateProductRemoveButton(pid, true, true);
    }

    this.wornPids = newWornPids;
}

InventoryTool.prototype.updateProductRemoveButtons = function (elBucket) {
    var wornPids = this.imvu.call('getMyOutfit');
    if (!wornPids) {
        wornPids = [];
    }

    $('.product', elBucket).each(function (index, li) {
        var is_worn = (wornPids.indexOf(li.product.pid) > -1);
        var wasWearing = $(li).hasClass('worn');
        this.updateProductRemoveButton(li.product.pid, is_worn, is_worn != wasWearing);
    }.bind(this));
}

InventoryTool.prototype.updateProductRemoveButton = function (pid, worn, removeChanging) {
    var li = $('.product[pid=' + pid + ']');
    li.toggleClass('worn', worn);

    var putOnOrTakeOffLabel;
    if(worn) {
        putOnOrTakeOffLabel = _T("Take Off");
    } else {
        putOnOrTakeOffLabel = _T("Put On");
    }
    $('.putOnOrTakeOff', li).text(putOnOrTakeOffLabel);

    if ( removeChanging ) {
        li.removeClass('changing');
    }
}

InventoryTool.prototype.evtTriggerActionProduct = function() {
    var run = this.getVisibleBuckets(this.elInventory, this.bucketSize);
    for (var i = run.start; i < run.end; i++) {
        var elBucket = this.getBucket(i);
        var lis = this.$$('.product', elBucket);
        for (var j = 0; j < lis.length; j++) {
            var li = lis[j];
            if (li.product.is_action && $(li).hasClass('changing')) {
                $(li).removeClass('changing');
                $('.putOnOrTakeOff', li).html('Put On');
            }
        }
    }
}

InventoryTool.prototype.createPlaceHolders = function (howMany, bucketSize) {
    var currentTotal = 0;
    var html = [];

    this.bucketSize = bucketSize;

    while (currentTotal < howMany) {
        html.push('<div>');
        for (var j = 0; j < bucketSize && currentTotal < howMany; j++, currentTotal++) {
            html.push('<div></div>');
        }
        html.push('</div>');
    }

    this.elInventory.innerHTML = html.join('');
}

InventoryTool.prototype.goShopping = function() {
    var shopLink = 'imvu:showMode?mode=shop';

    if (this.$maturity.find('.ap').is('.selected')) {
        shopLink += '&rating=ap';
    } else if (this.$maturity.find('.ga').is('.selected')) {
        shopLink += '&rating=ga';
    } else {
        shopLink += '&rating=all';
    }

    var $cat = $('.categories .selected');
    if ($cat.is('.pets')) {
        shopLink += '&tab=pets';
    } else if (this.mode == 'furniture') {
        shopLink += '&tab=furniture';
    } else if (this.mode == 'scenes') {
        shopLink += '&tab=rooms';
    } else {
        var shopCategory = $cat.attr('shopCategory');
        if (shopCategory && shopCategory.length > 0) {
            shopLink += '&subcatname='+shopCategory;
        }

        if ($cat.attr('genderless')) {
            shopLink += '&tab=all';
        } else {
            if (this.$gender.is('.male')) {
                shopLink += '&tab=men';
            } else if (this.$gender.is('.female')) {
                shopLink += '&tab=women';
            } else {
                shopLink += '&tab=all';
            }
        }
    }

    this.imvu.call('triggerImvuUrl', shopLink);
}

InventoryTool.prototype.animateImages = function (animate) {
    if ($(this.rootElement).is('.default-view')) {
        animate = false;
    }
    this.windowUtils.imageAnimationMode = animate ?
        window.Components.interfaces.imgIContainer.kNormalAnimMode : window.Components.interfaces.imgIContainer.kDontAnimMode;
}

InventoryTool.prototype.updateHintPositions = function() {
    if (this.savedOutfitHint != null) {
        var pos = this.getSavedOutfitHintPos();
        this.savedOutfitHint.position(pos.left, pos.top);
    }
    if (this.hideSuccessHint != null) {
        var pos = this.getHideProductHintPos();
        this.hideSuccessHint.position(pos.left, pos.top);
    }
    if (this.hideInfoHint != null) {
        var pos = this.getHideProductHintPos();
        this.hideInfoHint.position(pos.left, pos.top);
    }
    if (this.emptyInventoryHint != null) {
        var pos = this.getEmptyInventoryHintPos();
        this.emptyInventoryHint.position(pos.left, pos.top);
    }
}
InventoryTool.prototype.onVisibleProductsInvalidated = function (recalc) {
    if (recalc) {
       this.widgetDimensions = null;
    }
    if (this.visibleProductsTimeout != null) {
        this.timer.clearTimeout(this.visibleProductsTimeout);
    }

    this.visibleProductsTimeout = this.timer.setTimeout(this.fetchVisibleProducts.bind(this), 450);
    this.updateHintPositions();
}

InventoryTool.prototype.calculateWidgetDimensions = function (elViewport, bucketSize) {
    var firstBucket = this.getBucket(0);
    var top = 0;
    var widgetsPerRow = 0;
    var height = null;
    if (firstBucket != null) {
        top = firstBucket.firstChild.offsetTop;
        for (var bucketIndex = 0; (bucketIndex < this.getTotalBuckets()) && (height == null); bucketIndex++) {
            var elWidget = this.getBucket(bucketIndex).firstChild;
            while (elWidget != null) {
                if (elWidget.offsetTop > top) {
                    height = elWidget.offsetTop - top;
                    break;
                }
                widgetsPerRow++;
                elWidget = Dom.getNextSibling(elWidget);
            }
        }
    }
    if (height == null) {
        // This is a special case where there are zero or one rows so we can't easily calculate the height.
        // In this case we don't care because we will always show all buckets.
        height = elViewport.offsetHeight;
        widgetsPerRow = this.getTotalBuckets() * bucketSize;
    }

    return {
        top: top,
        height: height,
        widgetsPerRow: widgetsPerRow
    }
}

InventoryTool.prototype.getVisibleBuckets = function (elViewport, bucketSize) {
    var widgetDim = this.widgetDimensions;
    if (widgetDim == null) {
        widgetDim = this.calculateWidgetDimensions(elViewport, bucketSize);
        this.widgetDimensions = widgetDim;
    }

    var firstRow = Math.max(0, Math.floor((elViewport.scrollTop - widgetDim.top) / widgetDim.height));
    var firstWidget = firstRow * widgetDim.widgetsPerRow;
    var start = Math.floor(firstWidget / bucketSize);

    for (var end = start; end < this.getTotalBuckets(); end++) {
        if (this.getBucket(end).firstChild.offsetTop > elViewport.scrollTop + elViewport.offsetHeight) {
            break;
        }
    }

    end = Math.max(end, Math.min(start + 1, this.getTotalBuckets()));
    return {
       start: start,
       end: end
    }
}

InventoryTool.prototype.fetchVisibleProducts = function () {
    var run = this.getVisibleBuckets(this.elInventory, this.bucketSize);
    for (var i = run.start; i < run.end; i++) {
        this.fetchProductsInBucket(i);
    }
}

InventoryTool.prototype.fetchProductsInBucket = function (bucketIndex) {
    var elBucket = this.getBucket(bucketIndex);
    if (elBucket.isFetched) {
        return;
    }

    var elWidget = elBucket.firstChild;
    for each (var product in this.dataSource.getProducts(this.filter, bucketIndex * this.bucketSize, this.bucketSize)) {
        this.injectProductWidget(elWidget, product, this.productIndex++);
        elWidget = Dom.getNextSibling(elWidget);
        if (!elWidget) { /* TODO: kill this hack */
            break;
        }
    }

    this.updateProductRemoveButtons(elBucket);

    elBucket.isFetched = true;

    this.selectProductEventsBind();
};

InventoryTool.prototype.clickProductWithCtrlKey = function($thisProduct){
    var $inventory = $(this.elInventory),
        currentIndex = $thisProduct.data('index');
    $thisProduct.toggleClass('selected');
    $inventory.data('lastClick', currentIndex);
    $inventory.data('lastClickEnd', null);
};

InventoryTool.prototype.clickProductWithShiftKey = function($thisProduct){
    var $inventory = $(this.elInventory),
        currentIndex = $thisProduct.data('index'),
        lastClickIndex = parseInt($inventory.data('lastClick'), 10) || 0,
        lastClickEndIndex = parseInt($inventory.data('lastClickEnd'), 10) ,
        start,end, i;

    lastClickEndIndex = (lastClickEndIndex >=0 ) ?  lastClickEndIndex : lastClickIndex
    if (lastClickIndex > lastClickEndIndex) {
        start = lastClickEndIndex;
        end = lastClickIndex;
    } else {
        start = lastClickIndex;
        end = lastClickEndIndex;
    }

    for (i = start; i <=end; i++) {
        $inventory.find('.product.index-' + i).removeClass('selected');
    }

    if (currentIndex > lastClickIndex) {
        start = lastClickIndex;
        end = currentIndex;
    } else {
        start = currentIndex;
        end = lastClickIndex;
    }

    for (i = start; i <=end; i++) {
        $inventory.find('.product.index-' + i).addClass('selected');
    }

    $inventory.data('lastClickEnd', currentIndex);
};

InventoryTool.prototype.selectProductEventsBind = function(){
    var self = this,
        $inventory = $(this.elInventory);

    $(".product", $inventory).unbind('click.withControlKey').bind('click.withControlKey', function(e){
        if (e.ctrlKey || e.metaKey) {
            self.clickProductWithCtrlKey($(this));
        } else if (e.shiftKey) {
            self.clickProductWithShiftKey($(this));
        }
    });
};

InventoryTool.prototype.hide = function() {
    this.showing = false;
}

InventoryTool.prototype.show = function() {
    this.showing = true;
    this.refresh();
}

InventoryTool.prototype.toolbarRefresh = function() {
    this.imvu.call('refreshInventory');
}

InventoryTool.prototype.startRefreshSpinner = function() {
    var button = this.$('.refresh');
    $(button).addClass('spinning');
    this.animateImages(true);
}

InventoryTool.prototype.stopRefreshSpinner = function() {
    var button = this.$('.refresh.spinning');
    if (button){
        $(button).removeClass('spinning');
    }
    this.animateImages(false);
}

InventoryTool.prototype.refresh = function (force) {
    if (!this.showing){
        return;
    }
    var allFilters = {
        excludedCategories: [
            1940,   //room bundles
            1279,   //furni bundles
            495,    //stickers
        ]
    };
    this.productIndex = 0;

    this.widgetDimensions = null;

    var isGenderless = false;
    if (this.mode === 'furniture' || this.mode === 'scenes') {
        isGenderless = true;
    }

    var els = this.$$('.selected');
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var filter_json = el.getAttribute('filter');
        var filter = JSON.parse(filter_json);
        for (var k in filter) {
            allFilters[k] = filter[k];
        }

        if (el.getAttribute('genderless')) {
            isGenderless = true;
        }
    }

    if (allFilters.gender && isGenderless) {
        delete allFilters.gender;
    }

    if ($('.categories .all-categories').is('.selected')) {
        if(this.mode == 'furniture') {
            allFilters.categories = this.FURNI_CATEGORIES;
        } else if(this.mode == 'scenes') {
            allFilters.categories = this.ROOM_CATEGORIES;
        }
    }

    if (this.elSearch.value) {
        allFilters['search'] = this.elSearch.value;
    }

    if (this.currentList) {
        allFilters.productIds = this.lists[this.currentList].products;
    }

    if (this.mode !== 'furniture' && this.mode !== 'scenes'){
        var outfitsFilter = $('.categories .wearing').is('.selected');
        if(outfitsFilter) {
            allFilters.productIds = this.imvu.call('getMyOutfit');
        }
    }

    if ($('.categories .recently-added').is('.selected')) {
        var type = {clothing:'clothing', scenes: 'scenes', furniture: 'furni'}[this.mode];
        this.network.asyncRequest('GET', IMVU.SERVICE_DOMAIN + '/api/recently_added_inventory.php?type='+type, {
            success: function (o) {
                if (o.responseText.error){
                    this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a problem retrieving your recently added items."));
                    o.responseText = []
                }
                allFilters.productIds = o.responseText;
                this.applyFilters(allFilters, force);

            }.bind(this),
            failure: function () {
                allFilters.productIds = [];
                this.applyFilters(allFilters, force);
                this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a problem retrieving your recently added items."));
            }.bind(this)
        });
    } else {
        this.applyFilters(allFilters, force);
    }
}

InventoryTool.prototype.applyFilters = function(allFilters, force) {
    if (!force && areJSONEqual(this.filter, allFilters)) {
        return;
    }
    this.filter = allFilters;
    this.createPlaceHolders(this.dataSource.countProducts(this.filter), this.bucketSize);
    this.fetchVisibleProducts();

    var run = this.getVisibleBuckets(this.elInventory, this.bucketSize);
    if ((run.end == 0) && (this.emptyInventoryHint == null)) {
        IMVU.log("creating emptyInventoryHint");
        if(this.newListHint) {
            this.newListHint.dismiss();
            this.newListHint = null;
        }
        this.emptyInventoryHint = create_informational_message({html: _T("There's nothing here. Change your filters or") +
          ' <u><span id="shop-link">' + _T('Go Shopping')+ '</span></u>'},
          'left', 'top',
            this.getEmptyInventoryHintPos.bind(this), undefined, this.imvu);
        this.emptyInventoryHint.showCloseButton();
        this.emptyInventoryHint.hint_container.find('#shop-link').css('cursor', 'pointer');
        this.emptyInventoryHint.hint_container.find('#shop-link').click(this.goShopping.bind(this));
    } else if ((run.end > 0) && (this.emptyInventoryHint != null)) {
        this.emptyInventoryHint.dismiss();
        this.emptyInventoryHint = null;
    }
}

InventoryTool.prototype.getEmptyInventoryHintPos = function() {
    var panel = $('.category-panel');
    var buttons = $('ul.categories li');
    if (!buttons.is(":visible")) {
        buttons = $('.list-management .list-container .selected');
        if (buttons.length == 0) {
            buttons = $('.list-management .button');
        }
    }
    var b1 = buttons.filter(':first');
    var b2 = buttons.filter(':last');
    var b1Top = (b1.offset().top);
    var b2Bottom = (b2.offset().top + b2.height());
    return ({
        left: (panel.offset().left + panel.width() - 8),
        top: Math.max(30, ((b1Top + b2Bottom) / 2 - 2))
    });
}

InventoryTool.prototype._getAllPids = function() {
    allPids = [];
    for (var i = 0; i < this.getTotalBuckets(); i++) {
        var elBucket = this.getBucket(i);
        var lis = this.$$('.product', elBucket);
        for (var i = 0; i < lis.length; i++) {
            allPids.push(lis[i].product.pid);
        }
    }
    return allPids;
}

InventoryTool.prototype.getSavedOutfitHintPos = function() {
    return ({left: this.imvu.call('getOutfitToolstripButtonPosX'), top: $('#tool').height()});
}

InventoryTool.prototype.saveOutfit = function() {
    this.imvu.call('saveOutfit');

    if (this.savedOutfitHint == null) {
        var self = this;
        IMVU.log("creating savedOutfitHint");
        this.savedOutfitHint = create_informational_message({text: 'Your outfit has been saved!'}, 'bottom', 'left',
            this.getSavedOutfitHintPos.bind(this), undefined, this.imvu);
        this.savedOutfitHint.showCloseButton();
        this.timer.setTimeout(function() {
            self.savedOutfitHint.dismiss();
            self.savedOutfitHint = null;
            self.imvu.call('unhilightOutfitToolstripButton');
            }, 5000);
        this.imvu.call('higlightOutfitToolstripButton');
    }
};

InventoryTool.prototype.makeProductDraggableView = function($product, $this) {
    var maxViewImage = 2,
        self = this,
        pid = $product.attr('pid'),
        pids = pid;


    var $node, $dragViewImage;

    if ($product.hasClass("selected")) {
        var currentIndex = $product.data('index'),
        selectedProducts = $product.parent().parent().find(".product.selected");
        var arrPids = [],
        len = selectedProducts.length,
        offsetLeft = offsetTop = maxViewImage * 4,
        $selectedP;
        $node = $('<div class="multi-drag-view"><div class="counter">' + len + '</div><div class="imgs-wrap"></div></div>');
        $imgsWrap = $node.find(".imgs-wrap");
        for(var i=len-1; i>=0 ; i--) {
            $selectedP = $(selectedProducts[i]);
            arrPids.push($selectedP.attr('pid'));
            if (offsetTop > 0 && currentIndex !== $selectedP.data("index")) {
                $dragViewImage = $selectedP.find('.thumbnail').clone();
                $dragViewImage.css({
                    top: offsetTop + "px",
                    left: offsetLeft + "px"
                });
                offsetLeft -= 4;
                offsetTop -= 4;
                $dragViewImage.appendTo($imgsWrap);
            }

        }

        $product.find('.thumbnail').clone().css({
            top: "0px",
            left: "0px"
        }).appendTo($imgsWrap);

        pids  = arrPids.join(",");

    } else {
        $node = $product.find('.thumbnail').clone();
        $node.css({width: "100px", height: "80px"});
    }
    var imgs = $node.find('img');
    $node.appendTo('#tool');
    $node.attr('pids', pids);
    $product.addClass('dragging');
    return $node;

};

InventoryTool.prototype.makeProductDraggable = function($product) {
    var maxViewImage = 2,
        self = this,
        pid = $product.attr('pid'),
        pids = pid;

    $product.draggable({
        cursor: 'pointer',
        scroll: false,
        refreshPositions: true,
        helper: function(event) {

           var $node =  self.makeProductDraggableView($product, this);
           //debugger;
           return $node;
        }.bind($product),
        start: function(e, ui) {
        },
        stop: function(e, ui) {
            $('.dragging').removeClass('dragging');
        },
        drag: function(e, ui) {
            self.updatePanelDragScroll(e);
        },
        distance: 10,
        cursorAt: {
            left: 50,
            top: 40
        }
    });
    var $delete = $('<div class="delete"></div>');
    $product.append($delete);
    $delete.click(function(event) {
        if (self.currentList) {
            self.imvu.call('removeFromList', self.currentList, pid);
        }
        event.stopPropagation();
    });
}

InventoryTool.prototype.updatePanelDragScroll = function(e) {
    var $panel = $('.category-panel.tall .category-panel-inner, .category-panel:not(.tall) .list-management');
    if ($panel.offset().top + 30 >= e.pageY + 16) {
        $panel.scrollTop($panel.scrollTop() - 30);
    }
    if ($panel.offset().top + $panel.height() - 30 < e.pageY) {
        $panel.scrollTop($panel.scrollTop() + 30);
    }
}

InventoryTool.prototype.deselectList = function($node) {
    this.currentList = null;
    if (!$node) {
        $node = $('.list-management .list-container .selected');
    }
    $node.removeClass('selected');
    $('.inventory').removeClass('has-list');
}

InventoryTool.prototype.createList = function(lid) {
    var self = this;
    var $node = $('.list-management .template').clone();
    $node.find('.name').text(this.lists[lid].name);
    $node.removeClass('template').addClass('list');
    $node.find('.count').text(this.lists[lid].products.length);
    $node.attr('lid', lid);
    var $delete = $('<div class="delete"></div>');
    $node.append($delete);

    var $listContainer = $('.list-management .list-container');
    $node.prependTo($listContainer);

    $node.droppable({
        accept: '.product',
        hoverClass: 'drophover',
        drop: function(event, ui) {
            var pid = ui.helper.attr('pid');
            var pids = ui.helper.attr('pids');
            if (!pids) {
                pids = '' + pid;
            }
            self.imvu.call('addToList', lid, pids)
        },
        tolerance: 'pointer'
    });

    $delete.click(function(e) {
        e.stopPropagation();
        var result = self.imvu.call('showYesNoDialog', _T('Delete this?'), _T('Are you sure you want to delete this list?'));
        if (result && result.result) {
            self.imvu.call('deleteList', lid)
        }
    });
    $delete.mouseup(function(e) {e.stopPropagation(); });
    $delete.mousedown(function(e) {e.stopPropagation(); });

    $node.mousedown(function(e) {
        if (!self.imvu.call('hasVIPPass')) {
            self.imvu.call('showListsNeedVip');
            return;
        }

        var $inventory = $(self.elInventory);

        //ensure that the last clicked indices are cleared
        $inventory.data('lastClick', null);
        $inventory.data('lastClickEnd', null);

        var drag = {
            done: false,
            start: {x: e.pageX, y: e.pageY},
            current: {x: e.pageX, y: e.pageY},
            startTime: self.timer.getNow(),
            move: function(e) {
                self.updatePanelDragScroll(e);
                drag.current.x = e.pageX;
                drag.current.y = e.pageY;
            },
            update: function() {
                var cy = drag.current.y;
                if ($listContainer.hasClass('dragging')) {
                    var $nodes = $listContainer.find('.list');
                    var index = $nodes.index($node);
                    for(var i = 0; i < $nodes.length; i++) {
                        var $item = $nodes.eq(i);
                        if(i < index && cy < $item.offset().top + $item.height() + 10) {
                            $node.insertBefore($item);
                            break;
                        } else if(cy < $item.offset().top) {
                            if(i != index) {
                                $node.insertBefore($item);
                            }
                            break;
                        }
                    }
                    if(i == $nodes.length) {
                        $node.appendTo($('.list-management .list-container'));
                    }
                } else {
                    // Some thresholding fudge to make the drag feel more intentional.
                    if (self.timer.getNow() - drag.startTime >= 200 && Math.abs(drag.start.y - cy) > 3) {
                        $listContainer.addClass('dragging');
                    }
                }
            },
            timedUpdate: function() {
                if(drag.done) {
                    return;
                }
                drag.update();
                self.timer.setTimeout(drag.timedUpdate, 50);
            },
            release: function(e) {
                if ($listContainer.hasClass('dragging')) {
                    drag.current.x = e.pageX;
                    drag.current.y = e.pageY;
                    drag.update();

                    var $nodes = $listContainer.find('.list');
                    var index = $nodes.index($node);
                    var before = null;
                    if (index >= 0 && index < $nodes.length - 1) {
                        before = $nodes.eq(index + 1).attr('lid');
                    }
                    self.imvu.call('moveList', lid, before)
                }

                drag.done = true;
                $(document).unbind('mousemove', drag.move);
                $(document).unbind('mouseup', drag.drop);
                $listContainer.removeClass('dragging');
            },
            bind: function() {
                $(document).mousemove(drag.move);
                $(document).mouseup(drag.release);
                self.timer.setTimeout(drag.timedUpdate, 1);
            }
        };

        $('.list-management .selected').removeClass('selected');
        $('.inventory').addClass('has-list');
        $node.addClass('selected');
        $('.categories .selected').removeClass('selected');
        $('.categories .all-categories').addClass('selected');
        $('.categories .all-categories').addClass('hidden-selection');
        self.refresh();
        self.currentList = lid;
        self.timer.setTimeout(self.refresh.bind(self, true), 150);
        drag.bind();
    });
}

InventoryTool.prototype.createNewList = function () {
    if (!this.imvu.call('hasVIPPass')) {
        this.imvu.call('showListsNeedVip');
        return;
    }

    // get list number
    var listNum = $('.list-management .list-container > div').length;

    var listName = $.trim(this.imvu.call('showCreateListDialog', listNum));

    if (!listName || this.lists.hasOwnProperty(listName)) {
        return;
    }
    for (var list in this.lists) {
        if (this.lists.hasOwnProperty(list) && $.trim(this.lists[list].name).toLowerCase() == listName.toLowerCase()) {
            this.imvu.call('showDuplicateListDialog');
            return;
        }
    }
    this.imvu.call('createList', listName);
}

InventoryTool.prototype.getListHintPos = function($node) {
    var panel = $('.category-panel');
    return ({
        left: (panel.offset().left + panel.width() - 8),
        top: Math.min((($node.offset().top + $node.height()/2) - 2), $('.inventory').height())
    });
}

InventoryTool.prototype.handleInventoryListUpdated = function(evt, args) {
    if (args.action == 'add') {
        var pids = args.pids;
        for (var i = 0, len = pids.length; i< len; i++) {
            this.lists[args.lid].products.push(pids[i]);
        }
        $('[lid='+args.lid+']').find('.count').text(this.lists[args.lid].products.length);
    } else if (args.action == 'delete_list') {
        var listId = args.lid;
        delete this.lists[listId];
        $('[lid=' + listId + ']').remove();
        if (this.currentList == listId) {
            $('.inventory').removeClass('has-list');
            this.currentList = null;
            $('.categories .all-categories').removeClass('hidden-selection');
        }
    } else if (args.action == 'remove') {
        var idx = this.lists[args.lid].products.indexOf(args.pid);
        if (idx != -1) {
            this.lists[args.lid].products.splice(idx, 1);
            $('[lid='+args.lid+']').find('.count').text(this.lists[args.lid].products.length);
        }
    } else if (args.action == 'move_list') {
        var $node = $('[lid='+args.lid+']');
        var $before = args.insert_before_lid ? $('[lid='+args.insert_before_lid+']') : '';
        if ($before) {
            $node.insertBefore($before);
        } else {
            $node.appendTo($('.list-management .list-container'));
        }
    } else if (args.action == 'new_list') {
        var listName = args.name;
        var listId = args.lid;
        this.lists[listId] = {name: listName, products: []};
        this.createList(listId);
        $('.list-management .list-container, .category-panel-inner').scrollTop($('[lid='+args.lid+']').offset().top);
        if (this.newListHint == null && this.imvu.call('shouldSeeListDragHint')) {
            if(this.emptyInventoryHint) {
                this.emptyInventoryHint.dismiss();
                this.emptyInventoryHint = null;
            }
            var msg = "<div style='text-align:left'>"+  _T("Drag and drop your items into this list.") + "<br/>" + _T("To select multiple items, hold down the Ctrl key as you select each item.") + "</div>";
            this.newListHint = create_informational_message({html: msg},
                'left', 'bottom',
                this.getListHintPos.bind(this,$('[lid='+listId+']')), undefined, this.imvu, true);
            this.newListHint.showCloseButton();
            this.newListHint.hint_container.find('.close-button').click(function() {this.imvu.call('setListDragHintShown');}.bind(this));
        }
    }

    // we shouldn't refresh the page if we just added a new list, since it doesn't change the inventory
    if (args.action != 'new_list'){
        this.timer.setTimeout(this.refresh.bind(this, true), 150);
    }
}

InventoryTool.prototype.setupListView = function () {
    $('.list-management .list-container>div').remove();
    this.eventBus.register('inventoryListUpdated', this.handleInventoryListUpdated.bind(this));
    this.currentList = null;
    $('.list-management .button').click(this.createNewList.bind(this));
    var lists = this.imvu.call('getInventoryLists');
    this.setLists(lists);
}

InventoryTool.prototype.setLists = function(lists) {
    this.lists = lists;
    if (this.lists == null) {
        this.lists = {};
    }
    var l = [];
    for (var list in this.lists) {
        if (this.lists.hasOwnProperty(list)) {
            l.push({lid: list, order: this.lists[list].order});
        }
    }
    l.sort(function(a, b){return a.order - b.order;});
    for (var i=0; i< l.length; i++) {
        this.createList(l[i].lid);
    }
    if (this.sideView) {
        $('.list-management').show();
    } else {
        $('.category-panel').addClass('tabbedView');
        $('.toolbar>.title').hide();
        $('.toolbar .tabs').show();
        $('.toolbar .tabs .title').click(function() {
            $('.toolbar .tabs .title').removeClass('active');
           $(this).addClass('active')
        });
        $('.toolbar .tabs .list').click(function() {
            $('.category-selection').hide();
            $('.list-management').show();
        });
        $('.toolbar .tabs .category').click(function() {
            $('.list-management').hide();
            $('.category-selection').show();
        });
    }
}

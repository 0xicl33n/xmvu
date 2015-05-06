FAKE_PID = 37;
EMPTY_FEMALE_CLOTHING_PID = 2191901;
EMPTY_MALE_CLOTHING_PID = 9911131;
FEMALE_ACCESSORY_PID = 682;
MALE_ACCESSORY_PID = 669;
PETS = 425;

CLOTHING_FOR_FEMALE_CATEGORY = 40;
CLOTHING_FOR_MALE_CATEGORY = 41;

MALE_ACCESSORIES = 71;
MALE_BUNDLES = 316;
MALE_EYEBROWS = 92;
MALE_EYES = 91;
MALE_RESTRICTED = 72;
MALE_SKINTONES = 68;

FEMALE_ACCESSORIES = 153;
FEMALE_BUNDLES = 324;
FEMALE_EYEBROWS = 90;
FEMALE_EYES = 89;
FEMALE_RESTRICTED = 80;
FEMALE_SKINTONES = 76;

function SubmissionCard(args) {
    this.args = args = args || {};
    this.args.submissionFee = this.args.submissionFee || 500;
    this.imvu = args.imvu;
    this.timer = args.timer;
    this.network = args.network;

    if (this.imvu.call('getImvuConfigVariable', 'client.FIRE:display_only_products')) {
        $('.promotional-product-help').show();
    } else {
        $('li.control.display-only').css('visibility', 'hidden');
    }

    var dialogInfo = this.imvu.call('getDialogInfo') || {};
    this.pid = dialogInfo.pid;
    this.derivedPid = dialogInfo.derivedPid;
    this.showFullTree = dialogInfo.showFullTree;
    this.productType = dialogInfo.productType;

    this.needsSubmitConfirmation = false;
    this.isEditing = (this.pid != FAKE_PID);
    this.isAdmin = this.imvu.call('isAdmin');
    this.devtokenBalance = this.imvu.call('getDevtokenBalance');
    this.$spinner = $('#spinner');

    this.wireVisualEmbellishments();
    this.wireCloseButton();
    this.wireHelpSteps();
    this.wireBreadcrumb();
    this.wireImage();
    this.wireProductName();
    this.wireRating();
    this.wireProfit(args);
    this.wireProductNotes();
    this.wireSearchKeywords();
    this.wireControls();
    this.wireButtons();
    this.wireFees(args);
    this.wireProductOverride();

    this.network.asyncRequest('GET', IMVU.SERVICE_DOMAIN + '/api/product/submission_fees.php?' + $.param({product_type: '3d', derive_from: this.derivedPid}), {
        success: function (o) {
            this.wireProfit({derivationFee: o.responseText.result.derivation_fee});
            this.wireFees({
                submissionFee: o.responseText.result.submission_fee,
                derivationFee: o.responseText.result.derivation_fee
            });
        }.bind(this),
        failure: function () {
            this.imvu.call('showErrorDialog', _T('Network Error'), _T('There was a problem getting the submission fees'));
            this.imvu.call('endDialog', {});
        }.bind(this)
    });

    if (this.pid && this.isEditing) {
        this.prefillEditInfo(this.pid, this.devtokenBalance);
    }

    this.breadcrumbLoad();
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

SubmissionCard.prototype.getPreference = function (prefs, callback) {
    var i, params = {},
        uri = IMVU.SERVICE_DOMAIN + '/api/preference.php';

    for (i = 0; i < prefs.length; i += 1) {
        params['pref' + (i + 1)] = prefs[i];
    }

    if (!$.isEmptyObject(params)) {
        uri = uri + '?' + $.param(params);
    }

    serviceRequest({
        method: 'GET',
        uri: uri,
        network: this.network,
        imvu: this.imvu,
        callback: callback,
        json: true
    });
}

SubmissionCard.prototype.wireProductOverride = function() {
    $('#product-override-input.inactive')
    .bind('click', function (el) {
        $el = $('#product-override-input.inactive');
        $el.val('');
        $el.removeClass('inactive');
    })
    .bind('keyup', function (el) {
        if (this.urlFetchDelay !== undefined) {
            this.timer.clearTimeout(this.urlFetchDelay);
        }
        this.urlFetchDelay = this.timer.setTimeout(this.productOverrideLoadTrigger.bind(this), 500);
    }.bind(this));

    $('.product-override .info>.name').text('');
    $('.product-override .info .creator>.name').text('');
    $('.product-override .info .image').attr('src', '');
    $('.product-override .info').addClass('hidden');
    $('.product-override .error').addClass('hidden');
}

SubmissionCard.prototype.showProductOverrideConfirmation = function() {
    $('#submission-card .overlay').removeClass('hidden');
}

SubmissionCard.prototype.getOverridePid = function() {
    var pid = parseInt($('#product-override-input').val().trim(), 10);
    return isNaN(pid) ? null : pid;
}

SubmissionCard.prototype.productOverrideLoadTrigger = function() {
    var cid = this.imvu.call('getCustomerId'),
        pid = this.getOverridePid();

    $('.product-override .info').addClass('hidden');
    $('.product-override .error').addClass('hidden');

    if (pid === null) {
        return;
    }

    this.network.asyncRequest('GET', IMVU.SERVICE_DOMAIN + '/api/shop/product.php?pid=' + pid +'&get_keywords_also=1', {
        success: function(o) {
            var product;
            if (o.responseText === undefined || o.responseText.products === undefined || o.responseText.products.length == undefined || !(o.responseText.products.length > 0)) {
                return;
            }
            product = o.responseText.products[0];
            if (product.creator_id == cid || this.isAdmin) {
                $('.product-override .info>.name').text(product.name);
                $('.product-override .info .creator>.name').text(product.creator_name);
                $('.product-override .info .image').attr('src', product.image);
                $('.product-override .info').removeClass('hidden');
                this.prefillEditInfo_core(product, {isProductOverride: true});
                this.needsSubmitConfirmation = true;                               
            } else {
                $('.product-override .error').removeClass('hidden');
            }
        },
        failure: function() {
            this.imvu.call('showErrorDialog', _T('Network Error'), _T('There was a problem overriding the product.'));
            this.imvu.call('endDialog', {});
        },
        scope: this
    });
}

SubmissionCard.prototype.wireVisualEmbellishments = function () {
    this.$flourish = $('.flourish', this.$help);
}

SubmissionCard.prototype.wireCloseButton = function () {
    (this.$close = $('.close-button'))
    .bind('click', function () {
        this.imvu.call('endDialog', {});
    }.bind(this));
}

SubmissionCard.prototype.wireHelpSteps = function () {
    this.$help = $('#submission-card .help');
    this.$helpStepChooseLocation = $('.help-choose-location');
    this.$helpStepAddName = $('.help-add-name');
    this.$helpStepChooseRating = $('.help-choose-rating');
    this.$helpStepSetProfit = $('.help-set-profit');
    this.$helpStepAddProductImage = $('.help-add-product-image');
    this.$helpStepAddProductNotes = $('.help-add-product-notes');
    this.$helpStepAddKeywords = $('.help-add-keywords');
    this.$helpStepControls = $('.help-controls');

    (this.$ratingGuidelines = $('#rating-guidelines'))
    .bind('click', function () {
        this.imvu.call('launchUrl', IMVU.SERVICE_DOMAIN + '/catalog/web_info.php?topic=mature_content_policy');
    }.bind(this));

    $('.help dt').click(function () {
        $('.help dt.current').removeClass('current');
        $(this).addClass('current');

        $('.highlighted').removeClass('highlighted');
        $($(this).attr('data-highlight')).addClass('highlighted');
    });
}

SubmissionCard.prototype.wireBreadcrumb = function () {
    this.$breadcrumb = $('.breadcrumb');
    (this.$categories = $('#categories'))
    .bind('focus', function () {
        this.$helpStepChooseLocation.click();
    }.bind(this));
}

SubmissionCard.prototype.addImage = function () {
    var result;

    this.$helpStepAddProductImage.click();

    result = this.imvu.call('showFileOpenDialog', 'Open image', [["Image Files", "*.png; *.jpg; *.gif; *.tga"]]);
    if (result) {
        this.image_filename = result.image_filename;
        this.$image.attr('src', 'data:;base64,' + result.image_base64);
        this.hasSetImage = true;
    }
    this.refreshRequiredFields();
    this.$image.focus();
}

SubmissionCard.prototype.wireImage = function () {
    this.hasSetImage = false;
    this.$image = $('#product-image');
    this.$imageContainer = $('.product-image-container');
    this.$imageContainer.click(this.addImage.bind(this));

    $('*', this.$imageContainer)
     .die('click focus')
    .live('click focus', function () {
        this.$helpStepAddProductImage.click();
    }.bind(this));
}

SubmissionCard.prototype.wireProductName = function () {
    (this.$name = $('.name input'))
    .bind('focus', function () {
        this.$helpStepAddName.click();
    }.bind(this))
    .bind('keyup', function (event) {
        IMVU.truncateFieldValue(this.$name, 24);
        this.refreshRequiredFields();
    }.bind(this));

    this.$chars = $('.name label.chars');

    labelover(this.$name);
}

SubmissionCard.prototype.wireRating = function () {
    this.$rating = $('#rating');
    this.$rating.focus(function () {
        this.$helpStepChooseRating.click();
    }.bind(this));

    this.$rating.change(function () {
        this.refreshRequiredFields();
    }.bind(this));

    if (this.isAdmin) {
        this.$rating.append('<option value="2">UFI</option>');
    }
}

SubmissionCard.prototype.wireProductNotes = function () {
    this.$notes = $('#product-notes');
    this.$notesSection = $('.product-notes');

    $('*', this.$notesSection)
     .die('click focus')
    .live('click focus', function () {
        this.$helpStepAddProductNotes.click();
    }.bind(this));
}

SubmissionCard.prototype.wireSearchKeywords = function () {
    this.$keywords = $('#search-keywords');
    this.$keywordsSection = $('.search-keywords');

    $('*', this.$keywordsSection)
     .die('click focus')
    .live('click focus', function () {
        this.$helpStepAddKeywords.click();
    }.bind(this));
    labelover(this.$keywords);
}

SubmissionCard.prototype.wireControls = function () {
    this.$controls = $('.product .controls');
    this.$controlVisibleInShop = $('#control-visible-in-shop');
    this.$controlAllowDerivation = $('#control-allow-derivation');
    this.$controlDisplayOnly = $('#control-display-only');
    this.$controlAllow3rdParty = $('#control-allow-3rd-party');

    if (!this.isEditing) {
        this.getPreference(['web_preference.underivable', 'web_preference.unbundlable', 'web_preference.unpurchasable'], function (response, error) {
            if (error) {
                response = {};
            }
            this.$controlAllowDerivation.prop('checked', !parseInt(response['web_preference.underivable'], 10));
            this.$controlAllow3rdParty.prop('checked', !parseInt(response['web_preference.unbundlable'], 10));
            this.$controlDisplayOnly.prop('checked', parseInt(response['web_preference.unpurchasable'], 10));
        }.bind(this));
    }

    $('*', this.$controls)
     .die('click focus')
    .live('click focus', function (event) {
        this.$helpStepControls.click();
    }.bind(this));

    labelover($('#admin-controls .force-derivation input'));
    if (this.isAdmin) {
        $('#admin-controls').show();
    }
}

SubmissionCard.prototype.wireProfit = function (args) {
    (this.$profit = $('#profit'))
    .bind('focus', function () {
        this.$helpStepSetProfit.click();
    }.bind(this))
    .bind('keypress keyup', function (event) {
        var derivationFee, markup, profit,
            val = this.$profit.val().replace(/[^\d]/g, '');

        this.$profit.val(val);

        IMVU.truncateFieldValue(this.$profit, 6);

        profit        = parseInt(this.$profit.val() || '0', 10);
        derivationFee = parseInt(args.derivationFee || '0', 10);
        markup        = Math.round((profit + derivationFee) / 10.0);

        this.$derivationFee.text(derivationFee);
        this.$markup.text(IMVU.Client.util.number_format(markup));
        this.$total.text(IMVU.Client.util.number_format(profit + derivationFee + markup));

        this.refreshRequiredFields();
    }.bind(this));

    this.$derivationFee = $('.derivation-fee .credits');
    this.$derivationFee.text(args.derivationFee);

    this.$markup = $('.markup .credits');
    this.$total = $('.total .credits');

    this.$profit.keyup();
}

SubmissionCard.prototype.refreshRequiredFields = function () {
    $('.required-fields .name').toggleClass('satisfied', !!this.$name.val());
    $('.required-fields .rating').toggleClass('satisfied', this.$rating.val() !== '-1');
    $('.required-fields .profit').toggleClass('satisfied', !!this.$profit.val());
    $('.required-fields .image').toggleClass('satisfied', !!this.$image.attr('src'));

    var missingRequirements = $('.required-fields .requirement:not(.satisfied)');
    $('.required-fields').toggle(missingRequirements.length > 0);
    $('.product .fees').toggleClass('missing-required-fields', missingRequirements.length > 0 || this.isEditing);
    $('.buttons .submit').toggleClass('missing-required-fields', missingRequirements.length > 0);
}

SubmissionCard.prototype.wireButtons = function () {
    new PillButton({el: '#add-image'});

    (this.$cancel = $('.buttons .cancel'))
    .bind('click', function () {
        this.imvu.call('cancelDialog');
    }.bind(this))
    .bind('focus', function () { this.$cancel.addClass('focused');    }.bind(this))
    .bind('blur',  function () { this.$cancel.removeClass('focused'); }.bind(this));

    (this.$submit = $('.buttons .submit'))
    .bind('click', function () {
        if (this.$submit.is(':not(.missing-required-fields)')) {
            this.$submit.addClass('missing-required-fields');
            if (this.needsSubmitConfirmation) {
                this.showProductOverrideConfirmation();
            } else {
                this.submit();
            }
        }
    }.bind(this))
    .bind('focus', function () { this.$submit.addClass('focused');    }.bind(this))
    .bind('blur',  function () { this.$submit.removeClass('focused'); }.bind(this));

    $('.buttons .dialog-submit')
    .bind('click', function () {
        var override_pid = this.getOverridePid();
        this.submit({
            action: 'override',
            product_id: override_pid,
            original_pid: this.pid,
            force_parent: this.derivedPid
        });
    }.bind(this));

    $('.buttons .dialog-cancel')
    .bind('click', function () {
        this.refreshRequiredFields();
        $('.overlay').addClass('hidden');
    }.bind(this));

    this.$cancel.keypress(function (event) {
        if (event.which in {32:0, 13:0}) {
            this.$cancel.click();
        }
    }.bind(this));

    this.$submit.keypress(function (event) {
        if (event.which in {32:0, 13:0}) {
            this.$submit.click();
        }
    }.bind(this));

    this.$image.keypress(function (event) {
        if (event.which in {32:0, 13:0} && this.$imageContainer.is('.highlighted')) {
            this.addImage();
            return false;
        }
    }.bind(this));
}

SubmissionCard.prototype.submit = function(override) {
    var args, k;

    args = {
        product_id: this.pid,
        category_id: this.$categories.val(),
        name: this.$name.val(),
        rating: this.$rating.val(),
        profit: this.$profit.val(),
        keywords: this.$keywords.val()
    };

    if (this.milk) {
        args.category_id = this.milk.getLeafCategoryId();
    }

    if (this.hasSetImage) {
        args.image_base64 = this.$image.attr('src').substr('data:;base64,'.length);
        args.image_filename = this.image_filename;
    }
    
    args.shopVisible = this.$controlVisibleInShop.is(':checked'),
    args.allowDerivation = this.$controlAllowDerivation.is(':checked'),
    args.allow3rdPartyBundle = this.$controlAllow3rdParty.is(':checked'),
    args.disallowPurchase = this.$controlDisplayOnly.is(':checked');

    if (this.isAdmin) {
        args.locked = $('#admin_locked').is(':checked') ? 1 : 0;

        var forceParent = $('#admin_forced_parent').val();
        if (forceParent) {
            args.force_parent = forceParent;
        }
    }
    
    if (override) {
        $.extend(args, override);
    }

    IMVU.callAsync('submitProduct', function (result) {
        if (result && result.pid) {
            this.imvu.call('launchUrl', 'http://www.imvu.com/shop/product.php?products_id=' + result.pid);
            this.imvu.call('endDialog', {});
        }
    }.bind(this), this.imvu, args);
}

SubmissionCard.prototype.marshallEditInfoResponseText = function(responseText) {
    productDesc = {};       
    productDesc.maturity = responseText.rating;
    productDesc.profit = responseText.profit;
    productDesc.keywords = responseText.keywords;
    productDesc.name = responseText.name;
    productDesc.visible = responseText.visible;
    productDesc.purchasable = responseText.purchasable;
    productDesc.derivable = responseText.derivable;
    productDesc.include_in_bundles = responseText.include_in_bundles;
    productDesc.image = responseText.image_url;
    productDesc.category = responseText.category_id;
    productDesc.category_path = responseText.category_path;
    productDesc.locked = responseText.locked;
    productDesc.parent_pid = responseText.parent_pid;
    return productDesc;
}


SubmissionCard.prototype.prefillEditInfo_core = function(productDesc, args) {
    args = args || {};
    if (productDesc.maturity !== undefined) {
        this.$rating.val(productDesc.maturity);
    } 
        
    if(productDesc.visible !== undefined) {
        this.$controlVisibleInShop.prop('checked', productDesc.visible);
    }
    if(productDesc.purchasable !== undefined) {
        this.$controlDisplayOnly.prop('checked', !productDesc.purchasable);
    }
    if(productDesc.derivable !== undefined)  {
        this.$controlAllowDerivation.prop('checked', productDesc.derivable);
    }
    if(productDesc.include_in_bundles !== undefined) {
        this.$controlAllow3rdParty.prop('checked', productDesc.include_in_bundles);
    }            
    if(productDesc.image !== undefined) {
        this.$image.attr('src', productDesc.image);
    }
    if (!args.isProductOverride) {
        if(productDesc.category !== undefined){
            this.$categories.val(productDesc.category);
            this.existing_category = productDesc.category;
        }
        if(productDesc.category_path !== undefined) {
            this.existing_category_path = productDesc.category_path;
            if (this.milk) {
                this.milk.fill(this.existing_category_path);
            }
        }
    }
    
    if (this.isAdmin) {
        if(productDesc.locked !== undefined) $('#admin_locked').prop('checked', !!productDesc.locked);
        if(productDesc.parent_pid !== undefined) {
            $('#admin_forced_parent').val(productDesc.parent_pid);
            $('#admin_forced_parent').keydown();
        }
    }
    
    if (productDesc.profit !== undefined) {        
        this.$profit.val(productDesc.profit);
        this.$profit.keyup();
    }
    if (productDesc.keywords !== undefined) {
        this.$keywords.val(productDesc.keywords);
        this.$keywords.keydown(); // So labelover is refreshed
    }
    if (productDesc.name !== undefined) {
        this.$name.val(productDesc.name);
        this.$name.keydown();
        this.$name.keyup();
    }
}



SubmissionCard.prototype.prefillEditInfo = function(pid, devtokenBalance) {
    this.$spinner.show();
    this.network.asyncRequest('GET', IMVU.SERVICE_DOMAIN + '/api/product_edit_info.php?product_id=' + pid, {
        success: function (o) {            
            if (!o.responseText || o.responseText.error) {
                this.imvu.call('showErrorDialog', _T("Network Error"), _T("There was a problem getting the product info"));
                this.imvu.call('endDialog', {});
            }
            this.$spinner.hide();
            productDesc = this.marshallEditInfoResponseText(o.responseText);
            this.prefillEditInfo_core(productDesc);
        }.bind(this),
        failure: function () {
            this.imvu.call('showErrorDialog', _T("Network Error"), _T("There was a problem getting the product info"));
            this.imvu.call('endDialog', {});
        }.bind(this)
    });
}

SubmissionCard.prototype.breadcrumbLoad = function() {
    var populate = this.breadcrumbPopulate,
        self = this,
        uri;

    $('.tree').html('<li>Loading categories...</li>');
    this.$breadcrumb.css('opacity', 1);
    this.$categories.hide();
    if (this.showFullTree) {
        uri = IMVU.SERVICE_DOMAIN + '/api/product_categories.php?get_3d_tree=1';
        populate = this.breadcrumbPopulateFullTree;
    } else if (this.derivedPid == EMPTY_FEMALE_CLOTHING_PID) {
        var params = {
            nested: 1,
            roots: CLOTHING_FOR_FEMALE_CATEGORY+'',
            clip:  [FEMALE_ACCESSORIES,
                    FEMALE_BUNDLES,
                    FEMALE_EYEBROWS,
                    FEMALE_EYES,
                    FEMALE_SKINTONES]
        };
        if (!this.imvu.call('hasAccessPass')) {
            params.clip.push(FEMALE_RESTRICTED);
        }
        params.clip = params.clip.join(',');
        uri = IMVU.SERVICE_DOMAIN + '/api/product_categories.php?' + $.param(params);
        populate = this.breadcrumbPopulateMultiLevelCategorySelector;
    } else if (this.derivedPid == EMPTY_MALE_CLOTHING_PID) {
        var params = {
            nested: 1,
            roots: CLOTHING_FOR_MALE_CATEGORY+'',
            clip:  [MALE_ACCESSORIES,
                    MALE_BUNDLES, 
                    MALE_EYEBROWS,
                    MALE_EYES,
                    MALE_SKINTONES]
        };
        if (!this.imvu.call('hasAccessPass')) {
            params.clip.push(MALE_RESTRICTED);
       }
        params.clip = params.clip.join(',');
        uri = IMVU.SERVICE_DOMAIN + '/api/product_categories.php?' + $.param(params);
        populate = this.breadcrumbPopulateMultiLevelCategorySelector;
    } else if (this.productType == 'Avatar Attachment') {
        var params = $.param({
            nested: 1,
            roots: [FEMALE_ACCESSORIES, MALE_ACCESSORIES, PETS].join(','),
            pid: this.derivedPid
        });
        uri = IMVU.SERVICE_DOMAIN + '/api/product_categories.php?' + params;
        
        populate = this.breadcrumbPopulateMultiLevelCategorySelector;
    } else {
        uri = IMVU.SERVICE_DOMAIN + '/api/product_categories.php?pid=' + this.derivedPid;
    }
    
    
    this.network.asyncRequest('GET', uri, {
        success: function (result) {
            this.$breadcrumb.fadeTo('fast', 0, function () { // Fade out "Loading..."
                populate.call(self, result);
            });
        }.bind(this),
        failure: function () {
            $('.tree').html('<li>Uncategorized</li>');
        }
    }, null);
    
}

SubmissionCard.prototype.breadcrumbPopulateMultiLevelCategorySelector = function (result) {    
    var selected_categories = result.responseText.categories;    
    this.milk = new MultiLevelCategorySelector({root: this.$breadcrumb, cats: result.responseText.category_tree, selected_cats: selected_categories});
    
    this.milk.$topCats.add(this.milk.$midCats).add(this.milk.$lowCats)
    .bind('focus', function () {
        this.$helpStepChooseLocation.click();
    }.bind(this));

    if (!$('.highlighted').length) {
        
        this.milk.$topCats.focus();
        
    }

    if (this.isEditing && this.existing_category_path !== undefined) {        
        this.milk.fill(this.existing_category_path);
    }    

    this.$breadcrumb.fadeTo('slow', 1);
    
}

SubmissionCard.prototype.breadcrumbPopulateFullTree = function (result) {
    // Note: Opacity of the breadcrumb is still zero at this point.

    // _T('Network Error')
    $('.tree').html('<li class="full-cat">' + _T('Full catalog setting on') + '</li>');

    // There are so many total categories that it actually takes a little while
    // for the DOM to insert all the elements. As a result, if you just fade in
    // immediately, it will just chug and then snap visible, rather than a
    // smooth fade. Instead, immediately populate a single element that contains
    // another intermediate loading message and fade that in. Then start
    // inserting all the elements.
    this.$categories.html('<option>' + _T('Filling categories...') + '</option>');
    this.$categories.width(207);

    this.$categories.show();
    if (!$('.highlighted').length) {
        this.$categories.focus();
    }

    this.$breadcrumb.fadeTo('slow', 1, function () {
        this.$categories.html('');
        $.each(result.responseText, function (index, value) {
            this.$categories.append('<option class="choice rank' + value.rank + '" value="' + value.id + '">' + value.name + '</option>');
        }.bind(this));

        if (this.existing_category) {
            this.$categories.val(this.existing_category);
        }
    }.bind(this));
}

SubmissionCard.prototype.breadcrumbPopulate = function(result) {
    var $breadcrumbList = this.$breadcrumb.find('ul'),
        data = result.responseText,
        finalCategory,
        previousCategory;

    if (data.category_tree.length < 2) {
        var only = data.category_tree[0];
        $breadcrumbList.hide();
        $breadcrumbList.html('');
        this.$categories.append('<option value="' + only.id + '">' + only.name + '</option>');
        this.$categories.show();
    } else {
        data.subcategories = data.subcategories || {};

        if (data.category_tree[0].name == 'Clothing' &&
           (data.category_tree[1].name == 'Clothing for Female' ||
            data.category_tree[1].name == 'Clothing for Male')) {
            data.category_tree.shift();
        }

        $breadcrumbList.hide();
        $breadcrumbList.html('');
        $.each(data.category_tree, function (index, value) {
            $breadcrumbList.append('<li>' + value.name + '</li>');
        });
        $breadcrumbList.show();

        finalCategory = data.category_tree.pop();
        previousCategory = data.category_tree.pop();
        if (previousCategory && data.subcategories[previousCategory.id]) {
            $.each(data.subcategories[previousCategory.id], function(index, value) {
                this.$categories.append('<option value="' + value.id + '">' + value.name + '</option>');
            }.bind(this));
            $('li:last', $breadcrumbList).replaceWith(this.$categories.wrap('<li/>').parent());
            this.$categories.val(finalCategory.id);
            if (this.existing_category) {
                this.$categories.val(this.existing_category);
            } else {
                this.$categories.val(finalCategory.id);
            }
            this.$categories.show();
            if (!$('.highlighted').length) {
                this.$categories.focus();
            }
        }
    }

    this.$breadcrumb.fadeTo('slow', 1);
}

SubmissionCard.prototype.wireFees = function (args) {
    var submissionDevTokens,
        totalDeveTokens;

    this.$fees = $('.product .fees');
    this.$fees.find('.derivation .amount').text(args.derivationFee);

    $('.submission-split').hide();
    totalDevTokens = this.devtokenBalance;
    if (totalDevTokens) {
        submissionDevTokens = args.submissionFee / 10;
        $('.submission .unit', this.$fees).text('dev tokens');
        if (totalDevTokens >= submissionDevTokens) {
            $('.submission .amount', this.$fees).text(submissionDevTokens);
        } else {
            $('.submission .amount', this.$fees).text(totalDevTokens);
            $('.submission-split .amount', this.$fees).text((submissionDevTokens - totalDevTokens) * 10);
            $('.submission-split').show();
        }
    } else {
        $('.submission .amount', this.$fees).text(args.submissionFee);
    }
}

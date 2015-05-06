VALID_CATEGORY_NAME_CHARS   = /^[a-z \"_\-!\\\',&\$\%\*0-9]*$/i;
INVALID_CATEGORY_NAME_CHARS = /^[^a-z \"_\-!\\\',&\$\%\*0-9]*$/gi

function ManageOutfitsDialog(spec) {
    this.rootElement = spec.rootElement || rootElementMustBeSpecified;
    this.imvu = spec.imvu || imvuMustBeSpecified;
    this.network = spec.network || networkMustBeSpecified;
    this.info = spec.info || infoMustBeSpecified;
    this.outfitsToCategories = this.info.outfitsToCategories || outfitsToCategoriesMustBeSpecified;
    this.categories = [];

    this.btnX = this.rootElement.querySelector('#close_button');
    this.btnCreate = this.rootElement.querySelector('#btn_create');
    this.elName = this.rootElement.querySelector('#name');
    this.elPrivacy = this.rootElement.querySelector('#privacy');
    this.privacySelector = new IMVU.Client.widget.DropDown({rootElement: this.elPrivacy, items: IMVU.Outfits.getPrivacyDropdownItems()});
    this.elCategories = this.rootElement.querySelector('#categories');
    this.elTemplate = this.rootElement.querySelector('.template');
    this.elSpinner = this.rootElement.querySelector('#spinner');
    this.postCallbackWaitingCount = 0;

    var Event = YAHOO.util.Event;
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));

    new ImvuButton(this.btnCreate, {callback: function () {
        var name = this.elName.value.trim();
        if (name === '') {
            this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("Please type in a category name."));
            return;
        } else if (name.length > 20) {
            this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("Please type in a category name that is 20 characters or less."));
            return;
        } else if (!VALID_CATEGORY_NAME_CHARS.test(name)) {
            this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("We are sorry, your category name can only contain letters, numbers and spaces."));
            return;
        }
        this.myServiceRequest({
            method: 'POST',
            uri: '/api/outfit_categories.php',
            data: {
                action: 'create',
                name: name,
                privacy: parseInt(this.privacySelector.getSelectedValue(), 10)
            },
            callback: function (response, error) {
                if (error) {
                    this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("There was a problem creating your category."));
                } else {
                    this.addCategoryMarkup(response.result.category_id, name, this.privacySelector.getSelectedValue(), 0);
                    this.categories.push({id: response.result.category_id, text: name, privacy: this.privacySelector.getSelectedValue(), total_outfits: 0});
                    this.elName.value = '';
                    this.elName.focus();
                    this.updateTrashIconVisibility();
                }
            }.bind(this)
        });
    }.bind(this)});

    Event.on(this.btnX, 'click', function () {
        if (this.postCallbackWaitingCount === 0) {
            this.imvu.call('endDialog', {categories: this.categories, outfitsToCategories: this.outfitsToCategories});
        }
    }.bind(this));

    this.elName.focus();
}

ManageOutfitsDialog.prototype.getCategoryDataById = function (id) {
    for each (var category in this.categories) {
        if (category.id == id) {
            return category;
        }
    }
    return null;
}

ManageOutfitsDialog.prototype.myServiceRequest = function (spec) {
    this.postCallbackWaitingCount += 1;
    if (this.postCallbackWaitingCount == 1) {
        $(this.elSpinner).show();
    }
    spec.network = this.network;
    spec.imvu = this.imvu;

    var originalCallback = spec.callback;
    function callBackWithCountDecrease(response, error) {
        this.postCallbackWaitingCount -= 1;
        if (this.postCallbackWaitingCount === 0) {
            $(this.elSpinner).hide();
        }
        originalCallback(response, error);
    }
    spec.callback = callBackWithCountDecrease.bind(this);
    serviceRequest(spec);
}

ManageOutfitsDialog.prototype.addToTotalInCategory = function (categoryId, delta) {
    var elTotalOutfits = this.rootElement.querySelector('#category-' + categoryId + ' .outfits');
    elTotalOutfits.innerHTML = parseInt(elTotalOutfits.innerHTML, 10) + delta;
}

ManageOutfitsDialog.prototype.getTotalNumCategories = function () {
    var numCategories = 0;
    $(this.elCategories).children().each(function (index, el) {
        if ((typeof el.innerHTML !== 'undefined') && !$(el).hasClass('template')) {
            numCategories++;
        }
    });
    return numCategories;
}

ManageOutfitsDialog.prototype.updateTrashIconVisibility = function () {
    var totalNumCategories = this.getTotalNumCategories();
    $(this.elCategories).children().each(function (index, el) {
        if ((typeof el.innerHTML !== 'undefined') && !$(el).hasClass('template')) {
            var elTrash = el.querySelector('.trash');
            if (totalNumCategories == 1) {
                YAHOO.util.Dom.setStyle(elTrash, 'display', 'none');
                return true; // break
            } else {
                YAHOO.util.Dom.setStyle(elTrash, 'display', 'inline-block');
            }
        }
    });
}

ManageOutfitsDialog.prototype.deleteEmptyCategory = function (categoryId) {
    this.myServiceRequest({
        method: 'POST',
        uri: '/api/outfit_categories.php',
        data: {
            action: 'delete',
            category_id: categoryId
        },
        callback: function (response, error) {
            if (error) {
                this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("There was a problem deleting the category."));
            } else {
                $('#category-' + categoryId).remove();
                var updatedCategory = this.getCategoryDataById(categoryId);
                updatedCategory.removed = true;
                this.updateTrashIconVisibility();
            }
        }.bind(this)
    });
}

ManageOutfitsDialog.prototype.deleteFilledCategory = function (categoryId) {
    var $categoryRow = $('#category-' + categoryId),
        result = this.imvu.call('showOutfitCategoryDeletionDialog', {
            total_outfits: this.getCategoryDataById(categoryId).total_outfits,
            category_id: categoryId,
            category_name: $categoryRow.find('.name').val(),
            categories: this.categories
        });
    if (result && typeof result.method !== 'undefined') {
        var data = {
            action: 'delete',
            method: result.method,
            category_id: categoryId
        };
        if (result.method === 'move') {
            data.new_category_id = result.move_to_category_id;
        }
        this.myServiceRequest({
            method: 'POST',
            uri: '/api/outfit_categories.php',
            data: data,
            callback: function (response, error) {
                if (error) {
                    this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("There was a problem deleting the category."));
                } else {
                    $categoryRow.remove();

                    var outfitId;
                    var oldCategory = this.getCategoryDataById(categoryId);
                    oldCategory.removed = true;
                    if (result.method === 'destroy') {
                        for (outfitId in this.outfitsToCategories) {
                            if (this.outfitsToCategories[outfitId] == oldCategory.id) {
                                this.outfitsToCategories[outfitId] = undefined; // dead meat
                            }
                        }
                    } else if (result.method === 'move') {
                        var newCategory = this.getCategoryDataById(result.move_to_category_id);
                        newCategory.total_outfits += oldCategory.total_outfits;
                        this.addToTotalInCategory(newCategory.id, oldCategory.total_outfits);
                        for (outfitId in this.outfitsToCategories) {
                            if (this.outfitsToCategories[outfitId] == oldCategory.id) {
                                this.outfitsToCategories[outfitId] = newCategory.id; // recategorize
                            }
                        }
                    }
                }
                this.updateTrashIconVisibility();
            }.bind(this)
        });
    }
}

ManageOutfitsDialog.prototype.saveCategoryChanges = function (categoryId, newName, newPrivacy) {
    var $categoryRow = $('#category-' + categoryId),
        category = this.getCategoryDataById(categoryId);

    newPrivacy = parseInt(newPrivacy, 10);
    category.text = newName;
    category.privacy = newPrivacy;

    $categoryRow.addClass('saving');

    this.myServiceRequest({
        method: 'POST',
        uri: '/api/outfit_categories.php',
        data: {
            action: 'edit',
            category_id: categoryId,
            name: newName,
            privacy: newPrivacy
        },
        callback: function (response, error) {
            if (error) {
                this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("There was a problem saving your changes."));
            } else {
                $categoryRow.data('original-name', newName);
                $categoryRow.removeClass('saving');
            }
        }.bind(this)
    });
}

ManageOutfitsDialog.prototype.isNameChanged = function (categoryId) {
    var $categoryRow = $('#category-' + categoryId),
        newName = $categoryRow.find('.name').val();

    return newName.replace(INVALID_CATEGORY_NAME_CHARS, '') != $categoryRow.data('original-name');
}

ManageOutfitsDialog.prototype.onNameChange = function (categoryId, privacy) {
    if (!this.isNameChanged(categoryId)) {
        return;
    }

    var $categoryRow = $('#category-' + categoryId),
        newName = $categoryRow.find('.name').val();

    this.saveCategoryChanges(categoryId, newName, privacy);
}

ManageOutfitsDialog.prototype.onPrivacyChange = function (categoryId, name, privacySelector) {
    this.saveCategoryChanges(categoryId, name, privacySelector.getSelectedValue());
}

ManageOutfitsDialog.prototype.addCategoryMarkup = function (id, name, privacy, totalOutfits) {
    var Event = YAHOO.util.Event;

    if (typeof totalOutfits === 'undefined') {
        totalOutfits = 0;
    }

    var $el = $(this.elTemplate).clone()
            .removeClass('template')
            .attr('id', 'category-' + id)
            .data('original-name', name),
        $name = $el.find('.name'),
        $outfits = $el.find('.outfits'),
        $privacy = $el.find('.privacy'),
        $trash = $el.find('.trash');

    Event.on($trash[0], 'click', function () {
        var total = parseInt($outfits.html(), 10);
        if (total < 1) {
            this.deleteEmptyCategory(id);
        } else {
            this.deleteFilledCategory(id);
        }
    }.bind(this));

    $name.val(name);
    $outfits.html(totalOutfits);

    $(this.elCategories).append($el);
    var privacySelector = new IMVU.Client.widget.DropDown({
        rootElement: $privacy[0],
        items: IMVU.Outfits.getPrivacyDropdownItems(),
        leftTick: 1
    });
    privacySelector.selectByValue(privacy);

    Event.on($name[0], 'change',function (e) { this.onNameChange(id, privacy); }.bind(this));
    var nameChangeTimeout = null;
    Event.on($name[0], 'keyup', function() {
        if (!this.isNameChanged(id)) {
            return;
        }
        clearTimeout(nameChangeTimeout);
        nameChangeTimeout = setTimeout(function() { this.onNameChange(id, privacy); }.bind(this), 750);
    }.bind(this));

    Event.on($privacy.find('select')[0], 'change', function (e) {
        this.onPrivacyChange(id, name, privacySelector);
    }.bind(this));

}

ManageOutfitsDialog.prototype.getCategoryById = function (id) {
    return this.rootElement.querySelector('#category-' + id);
}

ManageOutfitsDialog.prototype.getTotalCategories = function () {
    return this.rootElement.querySelectorAll('[id^="category-"]').length;
}

ManageOutfitsDialog.prototype.setNewCategoryPrivacy = function (privacy) {
    this.privacySelector.selectByValue(privacy);
}

ManageOutfitsDialog.prototype.setNewCategoryName = function (name) {
    this.elName.value = name;
}

ManageOutfitsDialog.prototype.loadCategories = function () {
    this.myServiceRequest({
        method: 'GET',
        uri: '/api/outfit_categories.php',
        callback: function (response, error) {
            if (error) {
                this.imvu.call('showConfirmationDialog', _T("Please try again"), _T("There was a problem loading your categories."));
            } else {
                this.categories = response.result;
                for each (var category in this.categories) {
                    this.addCategoryMarkup(category.id, category.text, category.privacy, category.total_outfits);
                }
                this.updateTrashIconVisibility();
            }
        }.bind(this)
    });
    return this.elCategories;
}

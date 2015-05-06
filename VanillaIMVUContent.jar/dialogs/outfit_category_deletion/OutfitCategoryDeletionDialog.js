var Dom = YAHOO.util.Dom;
var Event = YAHOO.util.Event;

function createOutfitCategoryDeletionDialog(spec) {
    var rootElement = spec.rootElement || rootElementMustBeSpecified;
    var imvuCall = spec.imvuCall || imvuCallMustBeSpecified;
    var info = spec.info || infoMustBeSpecified;

    var elCategoryName = rootElement.querySelector('#category_name');
    elCategoryName.innerHTML = '&lsquo;' + info.category_name + '&rsquo;';

    var elTotal = rootElement.querySelector('#total');
    elTotal.innerHTML = info.total_outfits;
    if (info.total_outfits == 1) {
        $(rootElement).addClass('singular');
    }

    var btnCancel = rootElement.querySelector('#btn_cancel');
    new ImvuButton(btnCancel, {callback: function () { imvuCall('cancelDialog'); }});
    onEscKeypress(function() {
        imvuCall('cancelDialog');
    }.bind(this));
    var elDestroy = rootElement.querySelector('#destroy');
    var elMove = rootElement.querySelector('#move');

    var elCategories = rootElement.querySelector('#categories');
    var items = [];
    for each (var category in info.categories) {
        if (category.id != info.category_id && !category.removed) {
            items.push([category.text + ' (' + category.total_outfits + ') <b>' + IMVU.Outfits.getPrivacyHtmlLabel(category.privacy) + '</b>', category.id]);
        }
    }
    var categorySelector = new IMVU.Client.widget.DropDown({rootElement:elCategories, items:items});
    Event.on(elCategories.querySelector('select'), 'click', function () {
        elMove.checked = true;
    });

    var btnDelete = rootElement.querySelector('#btn_delete');
    new ImvuButton(btnDelete, {callback:function () {
        var result = {};
        if (elDestroy.checked) {
            result.method = 'destroy';
        } else if (elMove.checked) {
            result.method = 'move';
            result.move_to_category_id = parseInt(categorySelector.getSelectedValue(), 10);
        }
        imvuCall('endDialog', result);
    }});

    return {
        btnCancel: btnCancel,
        btnDelete: btnDelete,
        elDestroy: elDestroy,
        elMove: elMove,
        categorySelector: categorySelector
    };
}

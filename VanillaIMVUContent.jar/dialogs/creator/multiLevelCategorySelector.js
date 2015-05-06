
function MultiLevelCategorySelector(args) {
    $(this.$root = $(args.root))
        .find('ul').html('')
            .append(this.$topCats = $('<select class="multi top-cats"/>'))
            .append(this.$midCats = $('<select class="multi mid-cats"/>'))
            .append(this.$lowCats = $('<select class="multi low-cats"/>'));            
    this.wireCats(this.$topCats, args.cats, args.selected_cats);
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

MultiLevelCategorySelector.prototype.hereKittyKitty = function (id, cats) {
    for each (var meow in cats) {
        if (meow.id == id) {
            return meow;
        }
    }
}

MultiLevelCategorySelector.prototype.wireMoreCats = function ($cats, cats, selected_cats) {
    $cats.toggle(!!cats && !!cats.length);

    var $moreCats = $cats.nextAll('select');
    if ($moreCats.length) {
        var cat = this.hereKittyKitty($cats.val(), cats),
            kittens = cat.subcats;        
        this.wireCats($moreCats.first(), kittens, selected_cats);
    }
}

MultiLevelCategorySelector.prototype.wireCats = function ($cats, cats, selected_cats) {
    $cats.html('');
    var id = -1;
    for each (var cat in cats) {        
        if (typeof selected_cats !== 'undefined') { // if there is no connection, then this will be undefined
            for (var i = 0; i < selected_cats.length; i++) {                
                if (selected_cats[i].id == cat.id) {                    
                    id = cat.id;                            
                    break;
                }
            }
        }        
        $cats.append($('<option value="' + cat.id + '">' + cat.name + '</option>'));        
    }
    
    if (id !== -1) {
        $cats.val(id);
    }
    
    this.wireMoreCats($cats, cats, selected_cats);
    $cats.unbind('change').bind('change', function () {
        this.wireMoreCats($cats, cats, selected_cats);
    }.bind(this));
}

MultiLevelCategorySelector.prototype.getLeafCategoryId = function () {
    return this.$root.find('select.multi:visible').last().val();
}

MultiLevelCategorySelector.prototype.fill = function (path) {
    var i = 0, sel = 0, $selectors = this.$root.find('select.multi');

    // Shamble down the path until we "sync" with a value in the first visible selector.
    while ($selectors.eq(0).val() != path[i] && i < path.length) {
        $selectors.eq(0).val(path[i]);
        if ($selectors.eq(0).val() != path[i]) {
            i += 1;
        }
    } 

    for (; i < path.length; i += 1, sel += 1) {
        $selectors.eq(sel).val(path[i]);
        $selectors.eq(sel).change();
    }
}
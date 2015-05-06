
function InventoryDataSource(args) {
    this.imvu = args.imvu;
}

InventoryDataSource.prototype = {};

InventoryDataSource.prototype.getProducts = function(filter, offset, length) {
    var flashProducts = this.imvu.call('getProducts', filter, offset, length);
    var result = [];
    for each(var fp in flashProducts) {
        var p = {};
        p.pid = fp.products_id;
        p.thumbnail_url = fp.products_image;
        p.name = fp.products_name;
        p.creator_name = fp.manufacturers_name;
        p.creator_id = fp.manufacturers_id;
        p.is_ap = fp.products_mature == 'Y';
        p.cpath = fp.cPath;
        p.is_room = !!_.intersection(p.cpath, [107]).length && !_.intersection(p.cpath, [1027/*Furni*/]).length;
        p.is_modicon = !!_.intersection(p.cpath, [111]).length;
        p.is_action = !!_.intersection(p.cpath, [1328, 1329]).length;
        p.is_female = !!_.intersection(p.cpath, [40, 75, 76, 78, 80, 89, 90, 97, 101, 115, 128, 153, 295, 324, 509]).length;
        p.is_male = !!_.intersection(p.cpath, [41, 67, 68, 69, 70, 71, 72, 91, 92, 98, 102, 116, 296, 316, 460]).length;
        result.push(p);
    }
    return result;
}

InventoryDataSource.prototype.countProducts = function (filter) {
    return this.imvu.call('countProducts', filter);
}

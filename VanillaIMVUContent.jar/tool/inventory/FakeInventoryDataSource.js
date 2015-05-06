function FakeInventoryDataSource(products) {
    this.products = products;
}

FakeInventoryDataSource.prototype = {
    getProducts: function (filter, offset, length) {
        if ((typeof(offset) != 'undefined') && (typeof(length) != 'undefined')) {
            return this.products.slice(offset, offset + length);
        }
        return this.products;
    },

    countProducts: function (filter) {
        return this.products.length;
    }
};

AlbumPaginatorInterface = function (args) {
    this.imvu = args.imvu;
    this.network = args.network;
    this.page = args.page;
    this.pageSize = args.pageSize;
    this.callback = args.callback;
    this.$spinner = args.spinner;
    this.data = args.data;
}

AlbumPaginatorInterface.prototype = {
    currentPage: function(page) {
        if (page !== 'undefined' && page) {
            this.page = page;
        }
        return this.page;
    },

    updatePage: function(page) {
        this.currentPage(page);
        this.$spinner.show();
        this.data.getAlbumList(this.callback, this.page, this.pageSize);
    },

    totalPages: function() {
        var total = (!this.data.limitAlbums) ? this.data.numAlbums : this.data.maxAlbums,
            pages = Math.floor(total / this.pageSize);
        return (total % this.pageSize != 0) ? pages + 1 : pages;
    },

    updatePageSize: function(size) {
        var mark = (this.page - 1) * this.pageSize + 1;
        this.page = Math.ceil(mark / size);
        this.pageSize = size;
        this.$spinner.show();
        this.data.getAlbumList(this.callback, this.page, this.pageSize);
    }
}
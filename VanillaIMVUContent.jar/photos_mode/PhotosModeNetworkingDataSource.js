PhotosModeNetworkingDataSource = function (args) {
    this.imvu = args.imvu;
    this.network = args.network;
}

PhotosModeNetworkingDataSource.prototype = {
    asyncGet: function(callback, uri) {
        serviceRequest({
            method: 'GET',
            uri: uri,
            network: this.network,
            imvu: this.imvu,
            callback: callback
        });
    },

    asyncPost: function(callback, uri, data) {
        serviceRequest({
            method: 'POST',
            uri: uri, 
            network: this.network,
            imvu: this.imvu,
            callback: callback,
            data: data
        }); 
    },
    
    createAlbum: function(cacheCallback, callback, data) {
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/create_album.php';
        this.asyncPost(function(result, error) {
            cacheCallback(result, error, callback);
        }, uri, data);
    },

    deleteAlbum: function(cacheCallback, callback, albumIds) {
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/delete_album.php';
        this.asyncPost(function(result, error) {
            cacheCallback(result, error, callback, albumIds);
        }, uri, {'albums' : albumIds });
    },

    getAlbum: function(cacheCallback, callback, albumId) {
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/album_detail.php?album_id=' + albumId;
        this.asyncGet(function(result, error) {
            cacheCallback(result, error, callback);
        }, uri);
    },

    editAlbum: function(cacheCallback, callback, data) {
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/edit_album.php';
        this.asyncPost(function(result, error) {
            cacheCallback(result, error, callback);
        }, uri, data);
    },

    getAlbumList: function(cacheCallback, galleryCid, callback) {
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/album_list.php' + ((galleryCid != '') ? '?gallery_cid=' + galleryCid : '');
        this.asyncGet(function(result, error) {
            cacheCallback(result, error, callback);
        }, uri);
    },

    getPhotoList: function(cacheCallback, galleryCid, pageNum, pageSize, albumId, callback) {
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/photo_list.php?album_id=' + albumId + '&results_per_page=' + pageSize + '&page_num=' + pageNum + ((galleryCid != '') ? '&gallery_cid=' + galleryCid : '');
        this.asyncGet(function(result, error) {
            cacheCallback(result, error, pageNum, pageSize, albumId, callback);
        }, uri);
    },

    getAllPhotos: function(cacheCallback, callback) {
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/photo_list_lapsed.php';
        this.asyncGet(function(result, error) {
            cacheCallback(result, error, callback);
        }, uri);
    },

    deletePhoto: function(cacheCallback, callback, photoIds, albumId) {
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/delete_photo.php';
        this.asyncPost(function(result, error) {
            cacheCallback(result, error, callback, photoIds, albumId);
        }, uri, {'photos': photoIds});
    },

    editPhoto: function(cacheCallback, title, caption, photoId, albumId, callback) {
        var data = {'photo_id': photoId};
        if (title !== null) data['title'] = title;
        if (caption !== null) data['caption'] = caption;
        if (title === null && caption === null) return;
        
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/edit_photo.php';
        this.asyncPost(function(result, error) {
            cacheCallback(result, error, title, caption, photoId, albumId, callback);
        }, uri, data);
    },

    movePhotoToAlbum: function(cacheCallback, sourceAlbumId, lapsedSourceAlbumId, albumId, photoId, callback) {
        var data = {'album_id': albumId, 'photo_id': photoId};
        var uri = IMVU.SERVICE_DOMAIN + '/api/photos/move_photo.php';
        this.asyncPost(function(result, error) {
            cacheCallback(result, error, sourceAlbumId, lapsedSourceAlbumId, albumId, photoId, callback);
        }, uri, data);
    }
}

EXAMPLE_ALBUM_LIST_ORDERED = {
    result:{albums:[{aid: '1', title: 'test1', count: '8', thumb:'', visibility: '0', description: '', thumbnail_detail: {pid: '800', title: 'a', caption: 'cap_a', title: 'title_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100', photo_number: '1'}, vip_album: false ,default_album: true},
                    {aid: '2', title: 'test2', count: '9', thumbnail_detail: {pid: '800', title: 'a', caption: 'cap_a', title: 'title_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100', photo_number: '1'}, vip_album: false, default_album: false},
                    {aid: '3', title: 'test3', count: '1', thumbnail_detail: {pid: '800', title: 'a', caption: 'cap_a', title: 'title_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100', photo_number: '1'}, vip_album: false, default_album: false},
                    {aid: '4', title: 'test4', count: '11', thumbnail_detail: {pid: '800', title: 'a', caption: 'cap_a', title: 'title_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100', photo_number: '1'}, vip_album: false, default_album: false},
                    {aid: '5', title: 'test5', count: '3', thumbnail_detail: {pid: '800', title: 'a', caption: 'cap_a', title: 'title_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100', photo_number: '1'}, vip_album: true, default_album: false},
                    {aid: '6', title: 'test6', count: '2', thumbnail_detail: {pid: '800', title: 'a', caption: 'cap_a', title: 'title_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100', photo_number: '1'}, vip_album: true, default_album: false}],
            limit: '4', album_count: '6', limit_enforced: false}
}

EXAMPLE_ONE_ALBUM_ONLY = {
    result:{albums:[{aid: '1', title: 'test1', count: '8', thumb:'', visibility: '0', description: '', thumbnail_detail: {pid: '800', title: 'a', caption: 'cap_a', title: 'title_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100', photo_number: '1'}, vip_album: false ,default_album: true}],
            limit: '4', album_count: '1', limit_enforced: false}
}

EXAMPLE_ALBUM_LIST_HTML_TITLE = {result:{albums:[{aid: '1', title: "<script>alert('foo');</script>", count: '8', thumb: '', visibility: '0', description: '', thumbnail_detail: '', vip_album: false, default_album: true},
                                                 {aid: '2', title: 'test2', count: '8', thumb: '', visibility: '0', description: '', thumbnail_detail: '', vip_album: false, default_album: false}],
                                         limit: '4', album_count: '6', limit_enforced: false}}

EXAMPLE_ALBUM_LIST_WITH_EMPTY_ALBUMS = {
    result:{albums:[{aid: '1', title: 'test1', count: '6', thumbnail_detail: {pid: '800', title: 'a', caption: 'cap_a', title: 'title_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100'}},
                    {aid: '2', title: 'test2', count: '0', thumbnail_detail: ''}],
            limit: '4', album_count: '3', limit_enforced: false}
}

EXAMPLE_PAGINATED_PHOTO_LIST_RESULT0 = {
    result:{photos:[], total_photo_count: '9'}
}

EXAMPLE_PAGINATED_PHOTO_LIST_RESULT1 = {
    result:{photos:[{pid: '1', title: 'a', caption: 'a', caption: 'cap_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100'},
                    {pid: '2', title: 'b', caption: 'b', caption: 'cap_b', url: 'src_b', thumb_url: 'thumb_src_b', pwidth: '100', pheight: '100'},
                    {pid: '3', title: 'c', caption: 'c', caption: 'cap_c', url: 'src_c', thumb_url: 'thumb_src_c', pwidth: '100', pheight: '100'}],
            total_photo_count: '9'}
}

EXAMPLE_PAGINATED_PHOTO_LIST_RESULT2 = {
    result:{photos:[{pid: '4', title: 'd', caption: 'd', url: 'src_d', thumb_url: 'thumb_src_d', pwidth: '100', pheight: '100'},
                    {pid: '5', title: 'e', caption: 'e', url: 'src_e', thumb_url: 'thumb_src_e', pwidth: '100', pheight: '100'},
                    {pid: '6', title: 'f', caption: 'f', url: 'src_f', thumb_url: 'thumb_src_f', pwidth: '100', pheight: '100'}],
            total_photo_count: '9'}
}

EXAMPLE_PAGINATED_PHOTO_LIST_RESULT3 = {
    result:{photos:[{pid: '7', title: 'g', caption: 'g', url: 'src_g', thumb_url: 'thumb_src_g', pwidth: '100', pheight: '100'},
                    {pid: '8', title: 'h', caption: 'h', url: 'src_h', thumb_url: 'thumb_src_h', pwidth: '100', pheight: '100'},
                    {pid: '9', title: 'i', caption: 'i', url: 'src_i', thumb_url: 'thumb_src_i', pwidth: '100', pheight: '100'}],
            total_photo_count: '9'}
}

EXAMPLE_ALL_PHOTOS_RESULT = {
    result:{all_photos:[{aid: '1', pid: '1', title: 'a', caption: 'cap_a', url: 'src_a', thumb_url: 'thumb_src_a', pwidth: '100', pheight: '100'},
                        {aid: '2', pid: '3', title: 'c', caption: 'cap_c', url: 'src_c', thumb_url: 'thumb_src_c', pwidth: '100', pheight: '100'},
                        {aid: '2', pid: '4', title: 'd', url: 'src_d', thumb_url: 'thumb_src_d', pwidth: '100', pheight: '100'},
                        {aid: '3', pid: '2', title: 'b', caption: 'cap_b', url: 'src_b', thumb_url: 'thumb_src_b', pwidth: '100', pheight: '100'},
                        {aid: '4', pid: '5', title: 'm', url: 'src_m', thumb_url: 'thumb_src_m', pwidth: '100', pheight: '100'},
                        {aid: '4', pid: '6', title: 'n', url: 'src_n', thumb_url: 'thumb_src_n', pwidth: '100', pheight: '100'},
                        {aid: '5', pid: '7', title: 'w', url: 'src_w', thumb_url: 'thumb_src_w', pwidth: '100', pheight: '100'},
                        {aid: '5', pid: '8', title: 'x', url: 'src_x', thumb_url: 'thumb_src_x', pwidth: '100', pheight: '100'},
                        {aid: '5', pid: '9', title: 'y', url: 'src_y', thumb_url: 'thumb_src_y', pwidth: '100', pheight: '100'},
                        {aid: '6', pid: '10', title: 'z', url: 'src_z', thumb_url: 'thumb_src_z', pwidth: '100', pheight: '100'},
                        {aid: '6', pid: '11', title: 'aa', url: 'src_aa', thumb_url: 'thumb_src_aa', pwidth: '100', pheight: '100'}]}
}
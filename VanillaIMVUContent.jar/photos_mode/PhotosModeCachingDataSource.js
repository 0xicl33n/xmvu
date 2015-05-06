PhotosModeCachingDataSource = function (args) {
    this.galleryCid = args.galleryCid || '';
    this.numAlbums = null;
    this.albums = new Array();
    this.photoIndices = {};
    this.albumIndices = {};
    this.maxPhotos = null;
    this.isStale = true;
    this.net = new PhotosModeNetworkingDataSource ({
        imvu: args.imvu,
        network: args.network
    });
}

PhotosModeCachingDataSource.prototype = {
    //******ALBUMS*****************************
    getAlbumList: function(callback, pageNum, pageSize) {
        if (this.isStale == true) {
           this.net.getAlbumList(this.setAlbumListInCache.bind(this), this.galleryCid, function(result, error){
               this.getCachedAlbumList(pageNum, pageSize, callback);
           }.bind(this));
        } else {
            this.getCachedAlbumList(pageNum, pageSize, callback);
        }
    },
    
    setAlbumListInCache: function(result, error, callback) {
        if (error) {
            callback(result, error);
            return;
        }
        this.maxPhotos = parseInt(result.result.photo_limit);
        if (this.isStale == true) {
            this.numAlbums = result.result.albums.length;
            this.albums = result.result.albums;
        }
        for (var index in this.albums) {
            this.albumIndices[this.albums[index].aid] = parseInt(index);
            this.albums[index]['photos'] = new Array();
            this.albums[index].count = parseInt(this.albums[index].count);
        }
        this.isStale = false;
        if (callback) callback(result, error);
    },
    
    flushAlbumList: function() {
        this.isStale = true;
    },
    
    getTotalPhotoCount: function() {
        var total = 0;
        for (var index in this.albums) {
            total += parseInt(this.albums[index].count);
        }
        return total;
    },
    
    getCachedAlbumList: function(pageNum, pageSize, callback) {
        if (!callback) return;

        var albumList = [];
        var result = {};
        if (pageSize == 0){ // return all albums
            pageSize = this.albums.length;
        }

        for (var i = 0; i < pageSize; i++) {
            var index = i + (pageSize * (pageNum - 1));
            if (this.albums[index]) {
                albumList.push(this.albums[index]);
            } else {
                break;
            }
        }

        result['albums'] = albumList;
        result['album_count'] = this.numAlbums;
        result['photo_count'] = this.getTotalPhotoCount();
        callback(result);
    },

    deleteAlbum: function(callback, aids) {
        this.net.deleteAlbum(this.deleteAlbumInCache.bind(this), callback, aids);
    },

    deleteAlbumInCache: function(result, error, callback, aids) {
        if (error || (result && (result.error || result.result == false))) {
            callback(result, error);
            return;
        }
        if (aids.length) {
            _.each(aids, function(aid) {
                this.albums[this.albumIndices[aid]] = -1;
            }, this);
            
            this.albums = _.filter(this.albums, function(album) {
               return album !== -1;
            }, this);
        } else {
            this.albums.splice(this.albumIndices[aids], 1);
        }
        var aidsLen = (aids.length != undefined) ? aids.length : 1;
        this.numAlbums = this.numAlbums - aidsLen;
        this.updateAlbumIndex();
        if (callback) callback(result);
    },
    
    getAlbum: function(callback, albumId) {
        if (typeof this.albumIndices[albumId] === 'undefined' || this.albums[this.albumIndices[albumId]].isStale) {
            this.net.getAlbum(this.setAlbumInCache.bind(this), callback, albumId);
        } else {
            callback({'result': this.albums[this.albumIndices[albumId]]}, null);
        }
    },

    flushAlbum: function(albumId) {
        if (typeof this.albumIndices[albumId] !== 'undefined') {
            this.albums[this.albumIndices[albumId]].isStale = true;
        }
    },

    createAlbum: function(callback, data) {
        this.net.createAlbum(this.setAlbumInCache.bind(this), callback, data);
    },

    editAlbum: function(callback, data) {
        this.net.editAlbum(this.setAlbumInCache.bind(this), callback, data);
    },

    setAlbumInCache: function(result, error, callback) {
        if (error) {
            if (callback) callback(result, error);
            return;
        }
        var info = result.result;
        
        if (info.aid in this.albumIndices) {
            var oldAlbum = this.albums[this.albumIndices[info.aid]];

            info.count = parseInt(info.count);
            info.photos = oldAlbum['photos'];
            info.default_album = oldAlbum.default_album;
            info.vip_album = oldAlbum.vip_album;
            this.albums[this.albumIndices[info.aid]] = info;
        } else {
            // insertion index = 1 (newest free album), or maxAlbums (newest VIP album)
            var insertIndex = 1;

            this.albums.splice(insertIndex, 0, info);
            this.albumIndices[info.aid] = insertIndex;
            this.albums[insertIndex]['photos'] = new Array();
            this.albums[insertIndex].default_album = false;
            this.albums[insertIndex].vip_album = (insertIndex == 1) ? false : true;

            this.numAlbums = this.numAlbums + 1;
            this.updateAlbumIndex();
        }
        if (callback) callback(result, error);
    },

    getPhotoList: function(callback, albumId, pageNum, pageSize) {
        var last = pageNum * pageSize - 1,
            album = this.albums[this.albumIndices[albumId]],
            inCache = true;
        
        if (album.count < last) {
            last = album.count - 1;
        } else if (album.count == 0) {
            last = 0;
        }
        
        for (var i = (pageNum - 1) * pageSize ; i <= last && inCache; i++) {
            if (album['photos'][i] == null) {
                inCache = false;
            }
        }

        if (inCache) {
            this.buildPhotoList(pageNum, pageSize, albumId, callback);
        } else {
            this.net.getPhotoList(this.setPhotoListInCache.bind(this), this.galleryCid, pageNum, pageSize, albumId, function(result, error){
                if (error){
                    callback(result, error);
                }
                this.buildPhotoList(pageNum, pageSize, albumId, callback);
            }.bind(this));
        }
    },

    setPhotoListInCache: function(result, error, pageNum, pageSize, albumId, callback) {
        if (error) {
            //callback(result, error);
            return;
        }
        var albumIndex = this.albumIndices[albumId],
            cachedPhotos = this.albums[albumIndex]['photos'];

        if (pageSize == 0) {
            var photos = result.result;
            for (var i in photos) {
                var index = parseInt(i);
                cachedPhotos[index] = photos[i];
                cachedPhotos[index].aid = albumId;
                cachedPhotos[index].photo_number = index + 1;
                this.doubleLinkPhotos(cachedPhotos[index - 1], cachedPhotos[index]);
                this.photoIndices[photos[index].pid] = index;   
            }
        } else {
            var photos = result.result.photos;
            for (var i in photos) {
                var index = ((pageNum - 1) * pageSize + parseInt(i) );
                cachedPhotos[index] = photos[i];
                cachedPhotos[index].aid = albumId;
                cachedPhotos[index].photo_number = index + 1;
                this.doubleLinkPhotos(cachedPhotos[index - 1], cachedPhotos[index]);
                this.photoIndices[photos[i].pid] = index;
            }
            var nextPageStart = ((pageNum - 1) * pageSize + photos.length);
            this.doubleLinkPhotos(cachedPhotos[nextPageStart - 1], cachedPhotos[nextPageStart]);
        }
        if (this.maxPhotos) {
            if (this.albums[albumIndex].count >= this.maxPhotos) {
                result['album_full'] = true;
            }
        }
        if (callback) callback(result, error);
    },

    buildPhotoList: function(pageNum, pageSize, albumId, callback) {
        if (!callback) return;
        var photos = [],
            album = this.albums[this.albumIndices[albumId]],
            result = {};

        for (var i = 0; i < pageSize; i++) {
            var index = i + (pageSize * (pageNum - 1));
            if (album['photos'][index]){
                photos.push(album['photos'][index]);
            } else{
                break;
            }
        }
        result['photos'] = photos;
        result['total_photo_count'] = album.count;
        result['albumCount'] = this.albums.length;
        if (this.maxPhotos) {
            if (album.count >= this.maxPhotos) {
                result['album_full'] = true;
            }
        }
        callback(result);
    },

    getPhoto: function(callback, photoId, albumId, pageNum, pageSize) {
        var photo_index = this.photoIndices[photoId],
            album_index = this.albumIndices[albumId];

        if (((photo_index + 1) % pageSize) == 0 && (photo_index + 1) != this.albums[album_index].count) {
            if (!this.albums[album_index]['photos'][photo_index + 1]) {
                this.net.getPhotoList(this.setPhotoListInCache.bind(this), this.galleryCid, pageNum + 1, pageSize, albumId, function(result, error){
                    callback(this.albums[album_index]['photos'][photo_index]);
                }.bind(this));
            } else {
                callback(this.albums[album_index]['photos'][photo_index]);
            }
        } else if ((photo_index % pageSize) == 0 && photo_index != 0) {
            if (!this.albums[album_index]['photos'][photo_index - 1]) {
                this.net.getPhotoList(this.setPhotoListInCache.bind(this), this.galleryCid, pageNum - 1, pageSize, albumId, function(result, error){
                    callback(this.albums[album_index]['photos'][photo_index]);
                }.bind(this));
            } else {
                callback(this.albums[album_index]['photos'][photo_index]);
            }
        } else {
            callback(this.albums[album_index]['photos'][photo_index]);
        }
    },

    getAllPhotos: function(callback) {
        this.net.getAllPhotos(this.setAllPhotos.bind(this), callback);
    },

    setAllPhotos: function(result, error, callback) {
        if (error) {
            return;
        }
        var all_photos = result.result.all_photos;
        for(var index in all_photos){
            var aid = all_photos[index].aid;
            var album_index = this.albumIndices[aid];
            var photo_index = this.albums[album_index]['photos'].length;
            this.albums[album_index]['photos'][photo_index] = all_photos[index];
            this.albums[album_index]['photos'][photo_index].photo_number = photo_index + 1;
            this.photoIndices[all_photos[index].pid] = photo_index;
            this.doubleLinkPhotos(this.albums[album_index]['photos'][photo_index - 1], this.albums[album_index]['photos'][photo_index]);
        }
        //make merged albums
        this.updateAlbumIndex();
        this.isStale = false;
        if (callback) callback(result, error);
    },

    updateAlbumIndex: function() {
        this.albumIndices = {};
        for (var i = 0; i < this.albums.length; i++){
            if (this.albums[i]){
                this.albumIndices[this.albums[i].aid] = i;
            }
        }
    },

    deletePhoto: function(callback, pids, aid) {
        this.net.deletePhoto(this.deletePhotoInCache.bind(this), callback, pids, aid);
    },

    deletePhotoInCache: function(result, error, callback, pids, aid) {
        if (pids.length == undefined) {
            pids.length = 1;
        }
        
        if (error) {
            callback(result, error);
            return;
        }
        var album_index = this.albumIndices[aid];
        _.each(pids, function(pid) {
            var photo_index = this.photoIndices[pid];
            
            var prevPid = this.albums[album_index]['photos'][photo_index].image_prev_pid;
            var prevIndex = this.photoIndices[prevPid];
            var nextPid = this.albums[album_index]['photos'][photo_index].image_next_pid;
            var nextIndex = this.photoIndices[nextPid];
            this.doubleLinkPhotos(this.albums[album_index]['photos'][prevIndex], this.albums[album_index]['photos'][nextIndex]);
            
            this.albums[album_index]['photos'][photo_index] = -1;
        }, this);
        
        this.albums[album_index]['photos'] = _.filter(this.albums[album_index]['photos'], function(pid) {
            return pid !== -1;
        });
        
        this.resetPhotoIndex(album_index);
        this.albums[album_index].count -= pids.length;

        var needThumbnailUpdate = false;
        if (this.albums[album_index].thumbnail_detail != null) {
            _.each(pids, function(pid) {
                if (this.albums[album_index].thumbnail_detail.pid == pid) {
                    needThumbnailUpdate = true;
                }
            }, this);
        }
        
        if (needThumbnailUpdate) {
            this.flushAlbum(aid);
            this.getAlbum(function(result, error) {
                callback(result);
            }.bind(this), aid);
            return;
        }
        callback(result);
    },
    
    editPhoto: function(callback, title, caption, pid, aid) {
        this.net.editPhoto(this.editPhotoInCache.bind(this), title, caption, pid, aid, callback);
    },

    movePhotoToAlbum: function(aidFrom, aidTo, pid, callback) {
        var realAidFrom = aidFrom;
        var album_index = this.albumIndices[aidTo];
        if (this.maxPhotos) {
            if (this.albums[album_index].count >= this.maxPhotos) {
                callback(null, null);
                return;
            }
        }
        this.net.movePhotoToAlbum(this.movePhotoToAlbumInCache.bind(this), aidFrom, realAidFrom, aidTo, pid, callback);
    },

    movePhotoToAlbumInCache: function(result, error, aidFrom, realAidFrom, aidTo, pid, callback) {
        if (error) {
            callback(result, error);
            return;
        }
        var photo_to_move = this.albums[this.albumIndices[realAidFrom]]['photos'][this.photoIndices[pid]];
        this.deletePhotoInCache(result, error, function(result) {}, [pid], realAidFrom);
        var albumTo = this.albums[this.albumIndices[aidTo]];
        
        var photo_index;
        var insert_at_end = true;
        photo_to_move.aid = albumTo.aid;
        for (photo_index in albumTo['photos']) {
            if (albumTo['photos'][photo_index].pid < pid) {
               insert_at_end = false;
               break;
            }
        }
        
        if (insert_at_end) {
            albumTo['photos'].push(photo_to_move);
        } else {
            albumTo['photos'].splice(photo_index, 0, photo_to_move);
        }
        
        var total_photos = albumTo['photos'].length;
        for (photo_index in albumTo['photos']) {
            if (photo_index == 0){//first photo in album
                this.doubleLinkPhotos(null, albumTo['photos'][photo_index]); 
            } else {
                this.doubleLinkPhotos(albumTo['photos'][photo_index - 1], albumTo['photos'][photo_index]);
            }
            if (photo_index == (total_photos - 1)){ //last photo in album - loop and a half
                this.doubleLinkPhotos(albumTo['photos'][photo_index], null);
            }
        }
       
        if (albumTo.count == 0){
            albumTo.thumbnail_detail = photo_to_move;
        }

        this.resetPhotoIndex(this.albumIndices[aidTo]);
        albumTo.count = parseInt(albumTo.count) + 1;

        callback(result, error);
    },
    
    editPhotoInCache: function(result, error, title, caption, pid, aid, callback) {
        if (error) {
            callback(result, error);
            return;
        }

        if (this.albumIndices[aid] >= 0 && this.photoIndices[pid] >= 0) {
            var photo = this.albums[this.albumIndices[aid]]['photos'][this.photoIndices[pid]];
            if (title !== null) photo.title = title;
            if (caption !== null) photo.caption = caption;
        }
        callback(result, error);
    },

    //************* HELPER FUNCTIONS***************************************
    doubleLinkPhotos: function(prev, next) {        
        if (prev) {
            prev.image_next_pid = next ? next.pid : null;
            prev.image_next_url = next ? next.thumb_url : null;
            prev.image_next_width = next ? next.pwidth : null;
            prev.image_next_height = next ? next.pheight : null;
        }
        
        if (next) {
            next.image_prev_pid = prev ? prev.pid : null;
            next.image_prev_url = prev ? prev.thumb_url : null;
            next.image_prev_width = prev ? prev.pwidth : null;
            next.image_prev_height = prev ? prev.pheight : null;
        }
    },

    resetPhotoIndex: function(albumIndex) {
        for (var i in this.albums[albumIndex]['photos']) {
            this.photoIndices[this.albums[albumIndex]['photos'][i].pid] = i;
            this.albums[albumIndex]['photos'][i].photo_number = parseInt(i) + 1;
        }
    },

    flushPhotoList: function(aid) {
        this.albums[this.albumIndices[aid]]['photos'] = new Array();
    },

    linkPhoto: function(start, other, forwards) {
        if (forwards) {
            start.image_next_pid = other.pid;
            start.image_next_url = other.thumb_url;
            start.image_next_width = other.pwidth;
            start.image_next_height = other.pheight;
        } else {
            start.image_prev_pid = other.pid;
            start.image_prev_url = other.thumb_url;
            start.image_prev_width = other.pwidth;
            start.image_prev_height = other.pheight;
        }
        return start;
    }
}
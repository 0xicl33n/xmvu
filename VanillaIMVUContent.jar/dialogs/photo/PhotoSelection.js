function PhotoSelection(args) {
    args = args || {};
    var root = args.root || rootElementRequired;
    this.imvu= args.imvu || imvuRequired;    
    this.rest = args.rest;
    this.allowAP = args.allowAP;
    this.info = args.info || infoRequired;
    this.$root = $(root);

    this.$close = this.$root.find('.action-close');
    this.$takePhoto = this.$root.find('.action-take');
    this.$ok = this.$root.find('.action-ok');
    this.$close.unbind('click').click(function() { this.imvu.call("endDialog", false); }.bind(this));
    this.$takePhoto.unbind('click').click(function() { 
        this.imvu.call("showDressUpMode");
        this.imvu.call("endDialog", false);
    }.bind(this));
    this.$ok.unbind('click').click(function() { this.imvu.call("endDialog", true); }.bind(this));
    this.$root.find('button.save').click(function() { this.imvu.call("endDialog", false); }.bind(this));
    this.$root.find('.back-button').click(this.displayAlbums.bind(this));
    this.$root.find('.breadcrumb .start').click(function() {
        if (this.$root.find('.bd').hasClass('photos')) {
            this.displayAlbums();
        }
    }.bind(this));
    this.$root.find('.done-button').click(this.selectPhoto.bind(this));
    this.$root.find("#link_content_policy").click(function () { this.imvu.call("launchNamedUrl", "virtual_goods_policy"); }.bind(this));
    this.$root.find(".disclaimer").toggle(! this.info.allowAP);

    //Update dialog dimensions
    $bd = this.$root.find('.bd');
    var dialogHeight = $bd.outerHeight();
    var dialogWidth = this.$root.outerWidth(true);
    this.$albumList = this.$root.find('.album-list');
    this.$photoList = this.$root.find('.photo-list');
    this.$root.css('height', dialogHeight);
    this.imvu.call('resize', dialogWidth, dialogHeight);

    onEscKeypress(function() {
        this.imvu.call("endDialog", false);
    }.bind(this));

    this.getAlbumListUrl = IMVU.SERVICE_DOMAIN + '/api/photos/album_list.php'; // TODO: retrieve this from the server
    this.getPhotoListUrl = IMVU.SERVICE_DOMAIN + '/api/photos/photo_list.php'; // TODO: retrieve this from the server
    this.aid = 0;
    this.album_start_index = 0;    
    this.photo_start_index = 0;    
    this.items_per_page = 12;    
    this.displayedItems = null;
    this.$scrollContainer = this.$root.find('.container');
    this.lastScrollTop = 0;
    this.$scrollContainer.scroll(this.handleScroll.bind(this));
    this.albums = null;
    this.photos = null;
    this.displayAlbums();
}

PhotoSelection.prototype = {
    displayAlbums: function() {
        this.album_start_index = 0;
        this.lastScrollTop = 0;
        this.$albumList.empty();
        this.$albumList.show();
        this.$photoList.hide();
        this.$root.find('.bd').removeClass('photos');
        this.rest.get(this.getAlbumListUrl, {})
            .then(function(r) {
                this.displayedItems = 'albums';
                this.albums = r.response.result.albums;
                if (r.response.result.no_photos) {
                    this.showNoPhotos();
                    this.rest.invalidate(this.getAlbumListUrl); // so it'll re-fetch results after guest takes a photo
                } else {
                    this.$root.find('#dialog').addClass('select-photo');
                    this.showAlbumSlice();
                }
            }.bind(this));
    },
    
    showNoPhotos: function(event) {
        this.$root.find('#dialog').addClass('take-photo');
    },

    showAlbumSlice: function() {
        _.each(this.albums.slice(this.album_start_index,this.album_start_index+this.items_per_page), this.displayAlbum, this);
    },

    handleScroll: function(event) {
        var st = this.$scrollContainer.scrollTop();
        if (this.displayedItems === 'albums' && st > this.lastScrollTop) {
            this.album_start_index += this.items_per_page;
            this.showAlbumSlice();
        } else if (this.displayedItems === 'photos' && st > this.lastScrollTop) {
            this.photo_start_index += this.items_per_page;
            this.showPhotoSlice();
        }
        this.lastScrollTop = st;
    },

    showPreviousAlbums: function() {
        this.album_start_index -= this.items_per_page;
        this.displayAlbums();
    },
    
    displayAlbum: function(album) {
        var $album = this.$root.find('.album-template').clone().removeClass('album-template');
        this.$root.find('.breadcrumb .trail').empty();
        $album.data('aid', album.aid);
        $album.find('.title').text(album.title);
        if (album.img_src != "") {
            $album.find('.thumbnail').attr('style', 'background-image: url(' + album.img_src + ');');
        }
        
        $album.click(function (event) {            
            this.aid = $(event.currentTarget).data('aid');            
            this.displayPhotos(album.title);
        }.bind(this));
        this.$albumList.append($album);
    },

    displayPhotos: function(albumTitle) {
        this.$photoList.empty();
        this.$photoList.show();
        this.$albumList.hide();
        this.photo_start_index = 0;
        this.lastScrollTop = 0;
        this.$root.find('.bd').addClass('photos');
        this.$root.find('.breadcrumb .trail').empty().text(' > ' + albumTitle);
        this.rest.get(this.getPhotoListUrl + '?album_id=' + this.aid)
            .then(function(r) {
                this.displayedItems = 'photos';
                this.photos = r.response.result.photos;
                this.showPhotoSlice();
                this.$root.find('.photo-list .photo-detail').first().click();
            }.bind(this));
    },
    
    showPhotoSlice: function(event) {
        _.each(this.photos.slice(this.photo_start_index, this.photo_start_index + this.items_per_page), this.displayPhoto, this);
    },

    displayPhoto: function(photo) {
        var $photo = this.$root.find('.photo-template').clone().removeClass('photo-template');
        $photo.data('pid', photo.pid);
        if (photo.thumb_url != "") {
            $photo.find('.photo-thumbnail').attr('style', 'background-image: url(' + photo.thumb_url + ');');
        }
        
        $photo.click(function (event) {
            var pid = $(event.currentTarget).data('pid');
            $('.selected').removeClass('selected');
            $(event.currentTarget).addClass('selected');            
        }.bind(this));
        this.$photoList.append($photo);
    },
    
    selectPhoto: function() {
        var pid = $('.selected').data('pid');
        this.imvu.call('endDialog', pid);
    }
}

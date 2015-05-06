AlbumThumbnail = function (args) {
    this.album = args.album || null;
    this.$root = args.root;
    this.parentMode = args.photosMode;
    this.parentView = args.parentView;
    this.imvu = args.imvu;
    this.breadcrumbs = args.breadcrumbs;
    this.clickFunction = args.clickFunction || null;
    this.img_src = args.img_src || null;
    this.$title = this.$root.find('.album-title');
    this.$editButton = this.$root.find('.edit-button');
    this.$moveButton = this.$root.find('.move-button');
    this.$deleteButton = this.$root.find('.delete-widget-album');
    this.$photoCount = this.$root.find('.photo-count');
    this.$thumbnail = this.$root.find('.thumbnail');
    
    //operations on album
    this.allowEdit = args.allowEdit || false;
    this.allowMove = args.allowMove || false;
    this.allowDelete = args.allowDelete || false;
    this.allowDrop = args.allowDrop || false;
    this.allowClick = args.allowClick || false;
    
    if (this.album != null) {
        this.$root.find('.album-id-hidden').text(this.album.aid);
        this.$root.find('.album-widget').attr('data-album-id', this.album.aid);
        this.setThumbnail(this.album);
        this.setTitle(this.album.title);
        this.setPhotoCount(this.album.count);
    } else {
        this.$photoCount.hide();
        this.setThumbnailImage();
    }
    if (this.allowEdit && this.album.title != _T("Merged VIP Albums")) {
        this.$editButton.bind('click', function (event) {
            this.showEditAlbum();
        }.bind(this));
    } else {
        this.$editButton.hide();
    }

    if (this.allowMove) {
        this.$moveButton.bind('click', function (event) {
            var move_from = true;
            if (args.lapsed_album) this.parentMode.showMoveView(null, move_from);
            else this.parentMode.showMoveView(this.album, move_from);
        }.bind(this)); 
    } else {
        this.$moveButton.hide();
    }

    if (this.allowDelete && (!(this.album.default_album || this.album.title == _T("Merged VIP Albums")))) {
        this.$root.find('.album-widget').addClass('deletable');
        this.$root.find('.album-widget').mouseover(function() {this.$deleteButton.css("opacity", "1.0")}.bind(this));
        this.$root.find('.album-widget').mouseout(function() {this.$deleteButton.css("opacity", "0.0")}.bind(this));
        this.$deleteButton.mouseover(function() {this.$deleteButton.css("opacity", "1.0")}.bind(this));
        this.$deleteButton.mouseout(function() {this.$deleteButton.css("opacity", "0.0")}.bind(this));
    } else {
        this.$deleteButton.css('visibility', 'hidden');
    }

    //If it's a move, hide all the delete buttons for proper formatting
    if (this.allowDrop) this.$deleteButton.hide();

    if (this.allowClick ) {
        if (args.lapsed_album) {
           this.$root.find('.album-thumbnail').bind('click', function (event) {
                this.parentMode.showPhotoListForMergedAlbum();
                this.breadcrumbs.addBreadcrumb("Merged VIP Albums", this.parentMode.showPhotoListForMergedAlbum.bind(this.parentMode)); 
           }.bind(this));
        } else if (this.album){
            this.$root.find('.album-thumbnail').bind('click', function (event) {
                if (event.ctrlKey) {
                    return;
                }
                
                this.parentMode.showPhotoList(this.album.aid);
                this.breadcrumbs.addBreadcrumb(this.$title.text(), this.parentMode.showPhotoList.bind(this.parentMode), this.album.aid);
            }.bind(this));
        } else {
            this.$thumbnail.bind('click', function (event) {
                this.clickFunction();
            }.bind(this)); 
        }

        var $albumWidget = this.$root.find('.album-widget');
    } else {
        this.$root.find('.album-thumbnail').addClass('album-thumbnail-no-hover').removeClass('album-thumbnail');
        this.$root.find('.album-widget').removeClass('album-widget').addClass('album-widget-no-hover');
    }

    if (this.allowDrop) {
        this.$root.droppable({
            accept: '.thumbnail-widget',
            drop: function(event, ui) {
                 var pid = ui.draggable.find(".pic-id-hidden").text();
                 var obj = ui.draggable.data('photomode');
                 var aidTo = $(this).find(".album-id-hidden").text();
                 var scrollPos = obj.$root.find('.album-view-droppable').scrollTop();
                 obj.movePhoto(pid, aidTo, scrollPos);
            },
            zIndex: 1,
            over: function(event, ui) {
                $(this).find('.album-widget-no-hover').removeClass('album-widget-no-hover').addClass('album-widget-hover-droppable');
                $(this).find('.album-thumbnail-no-hover').addClass('album-thumbnail-droppable');
            },
            out: function(event, ui) {
                $(this).find('.album-widget-hover-droppable').removeClass('album-widget-hover-droppable').addClass('album-widget-no-hover');
                $(this).find('.album-thumbnail-droppable').removeClass('album-thumbnail-droppable');
            },
        });
    }

    if (args.lapsed_album) {
        this.setTitle("Merged VIP Albums");
        this.$photoCount.show();
        this.setPhotoCount(args.lapsed_album_count);
    }
}

AlbumThumbnail.prototype = {
    showEditAlbum: function() {
        var response = this.imvu.call('showManageAlbum', { album: { aid: this.album.aid, title: this.album.title, visibility: this.album.visibility, description: this.album.description, thumb: this.album.thumb, default_album: this.album.default_album}});
        if (response) this.parentView.$root.trigger('albumEdited', response);
    },

    setPhotoCount: function(count) {
        this.$root.find('.photo-count').text(count + " "  + ((count == 1) ? _T('Photo') : _T('Photos')));
    },

    setTitle: function(title) {
        if (!title || title.length == 0) {
            this.$title.text('[' + _T('untitled') + ']'); 
        } else if (title.length <= 23) {
            this.$title.text(title);
        } else {
            this.$title.text(title.substring(0, 23) + "...");
        }
    },

    setThumbnail: function(album) {
        if (album.count == 0 || !album.thumbnail_detail || !album.thumbnail_detail.thumb_url) {
            this.parentMode.fitThumbnail(this.$thumbnail, "../img/this-album-empty.png");
        } else {
            this.parentMode.fitThumbnail(this.$thumbnail, album.thumbnail_detail.thumb_url);
        }
    },

    setThumbnailImage: function() {
        this.$thumbnail.attr({
                src: this.img_src,
                alt: "Add an Album"
        });
    }
}

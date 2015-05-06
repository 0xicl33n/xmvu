function PhotosMode(args) {
    this.$root = $(args.root);
    this.network = args.network;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.timer = args.timer || new Timer();
    this.readOnly = args.readOnly || false;
    this.album_rpp = args.album_rpp || 12;
    this.photo_rpp = args.photo_rpp || 12;
    this.$current_view = null;
     
    //paginator and spinner
    this.$paginator_head = this.$root.find('#paginator-head');
    this.$spinner = this.$root.find('#spinner');

    //setup read only mode
    this.galleryCid = null;
    this.galleryCid = this.imvu.call('getGalleryCid');
    if (this.galleryCid) {
        this.readOnly = true;
    }
        
    //initialize caching datasource
    this.data_source = new PhotosModeCachingDataSource({
        imvu: args.imvu,
        network: args.network,
        galleryCid: this.galleryCid
    });
        
    //initial set up
    this.initialSetup();
    
    //switch to album list view
    this.switchView(this.albumListView);
    
    //get album list from caching data source
    this.albumListView.populate();
}

PhotosMode.prototype = {
    initialSetup: function() {
        //make breadcrumb
        this.breadcrumbs = new Breadcrumbs({root: this.$root.find("#breadcrumbs")});
        
        this.$spinner.show();
        
        //initialize all views
        this.albumListView = new AlbumListView({
            root: this.$root,
            imvu: this.imvu,
            network: this.network,
            readOnly: this.readOnly,
            album_rpp: this.album_rpp,
            photosMode: this
        });
        
        this.photoListView = new PhotoListView({
            root: this.$root,
            imvu: this.imvu,
            network: this.network,
            readOnly: this.readOnly,
            photo_rpp: this.photo_rpp,
            photosMode: this
        });
        
        this.photoDetailView = new PhotoDetailView({
            root: this.$root,
            imvu: this.imvu,
            network: this.network,
            timer: this.timer,
            readOnly: this.readOnly,
            photosMode: this
        });
        
        this.movePhotoView = new MovePhotoView({
            root: this.$root,
            imvu: this.imvu,
            network: this.network,
            photo_rpp: this.photo_rpp,
            photosMode: this
        });
        
        //hide all views at start
        this.albumListView.hide();
        this.photoListView.hide();
        this.photoDetailView.hide();
        this.movePhotoView.hide();
        this.$paginator_head.hide();
    },
    
    handleSaveAsComplete: function(result) {
        this.photoDetailView.handleSaveAsComplete(result);
    },
    
    handleUploadPhotoComplete: function(result, aid) {
        this.photoListView.handleUploadPhotoComplete(result, aid);
    },
    
    bindEventToUpdate: function(event, call) {
       this.$root.unbind(event);
       this.$root.bind(event, function (e, result) {
           this.data_source.setAlbumInCache(result, null, call);
       }.bind(this));
    },

    notifyResize: function() {
        if (this.photoDetailView) this.photoDetailView.onResize();
    },

    movePhoto: function(pid, aidTo, scrollPos) {
        this.$spinner.show();
        var aidFrom = this.movePhotoView.getSelectedAlbum();
        this.data_source.movePhotoToAlbum(aidFrom, aidTo, pid, function(result,error) {
            this.movePhotoView.refreshAfterMove(result, error, scrollPos);
        }.bind(this));
    },
    
    editAlbum: function(callback, data) {
        this.$spinner.show();
        this.data_source.editAlbum(callback, data);
    },
    
    deleteAlbum: function(aids) {
        this.$spinner.show();
        this.data_source.deleteAlbum(this.albumListView.populate.bind(this.albumListView), aids);
    },
    
    deletePhoto: function(pids, aid) {
        this.$spinner.show();
        this.data_source.deletePhoto(this.photoListView.refresh.bind(this.photoListView), pids, aid);
    },
  
    editPhoto: function (title, caption, pid, aid) {
        this.$spinner.show();
        this.data_source.editPhoto(this.photoDetailView.updateAfterEdit.bind(this.photoDetailView), title, caption, pid, aid);
    },
   
    showPhotoList: function(aid) {
       this.data_source.getAlbum(function(result, error) {
           this.photoListView.populate(result.result);
       }.bind(this), aid);
    },
    
    showPhotoListForMergedAlbum: function(pid, aid) {
        this.photoListView.populateLapsedAlbum();
    },
    
    showPhotoView: function(pid, aid) {
        this.$spinner.show();
        var selected_album = this.photoListView.getSelectedAlbum();
        this.photoDetailView.setSelectedAlbum(selected_album);
        var curr_page = this.photoListView.getCurrentPage();
        this.data_source.getPhoto(this.photoDetailView.populate.bind(this.photoDetailView), pid, aid, curr_page, this.photo_rpp);
    },
    
    showMoveView: function(albumInfo, move_from) {
        this.movePhotoView.showMoveView(albumInfo, move_from); 
    },
    
    setCurrentPageForPhoto: function(photo_num){
        this.photoListView.setCurrentPage(photo_num);
    },
    
    switchView: function(switch_to_view){
        if (this.$current_view) {
            this.$current_view.hide();
        }
        this.$current_view = switch_to_view;
        this.$current_view.show();
    },
    
    showError: function(dialogTitle, caption, log) {
        this.$spinner.hide();
        this.imvu.call('showErrorDialog', _T(dialogTitle), _T(caption));
        console.log(log);
    },
    
    stylePhotoCountDropdownAndPaginatorOnHintClose: function() {
        this.$paginator_head.delay('400').animate({top: '-=44'}, 600);
        this.$root.find('.photo-count-drop-down').delay('400').animate({top: '-=44'}, 600);
        this.$root.find('#photo-list-edit').delay('400').animate({top: '-=44'}, 600);
    },
    
    movePhotoCountDropdownAndPaginator: function() {
        this.$paginator_head.css('top', '106px'); //62px before move
        this.$root.find('.photo-count-drop-down').css('top', '104px'); //60px before move
        this.$root.find('#photo-list-edit').css('top', '89px');
    },
    
    revertPhotoCountDropdownAndPaginatorStyling: function() {
        this.$paginator_head.css('top', '62px'); 
        this.$root.find('.photo-count-drop-down').css('top', '60px'); 
        this.$root.find('#photo-list-edit').css('top', '45px');
    },

    resizePhotos: function (thumbnail, width, height, limitWd, limitHt) {
        var xScaling = limitWd / width;
        var yScaling = limitHt / height;

        if (width > limitWd || height > limitHt) {
            var scale;
            if (xScaling < yScaling) {
                scale = xScaling;
            } else {
                scale = yScaling;
            }

            width = Math.round(width * scale);
            height = Math.round(height * scale); 
        }
        var margin_left = Math.round((limitWd-width)/2);
        var margin_top = Math.round((limitHt-height)/2);

        thumbnail.css('margin-top', margin_top + "px");
        thumbnail.css('margin-left', margin_left + "px");
        
        return (new Array(margin_left, margin_top, width, height));
    },

    fitThumbnail: function($img, url) {
        var self = this;
        $img.attr({
            src: url
        }).unbind('load').load(function () {
            $('<img/>')
                .attr('src', $img.attr('src'))
                .load(function () {
                    $img.data('true-width', this.width);
                    $img.data('true-height', this.height);

                    $img.toggleClass('otherThumbnails', false);
                    $img.toggleClass('imvuLandscape', false);
                    $img.toggleClass('imvuPortrait', false);

                    if (this.width == 160 && this.height == 220) {
                        $img.css('margin-left', "0px");
                        $img.css('margin-top', "0px");
                        $img.toggleClass('imvuPortrait', true);
                    } else if (this.width == 300 && (this.height == 220 || this.height == 219)) {
                        $img.css('margin-left', "0px");
                        $img.css('margin-top', "0px");
                        $img.toggleClass('imvuLandscape', true);
                    } else {
                        $img.toggleClass('otherThumbnails', true);
                        self.resizePhotos($img, $img.data('true-width'), $img.data('true-height'), 160, 120);
                    }
                });
        });
    },
}
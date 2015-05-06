MovePhotoView = function (args) {
    this.$root = args.root;
    this.imvu = args.imvu;
    this.network = args.network;
    this.readOnly = args.readOnly;
    this.photo_rpp = args.photo_rpp;
    this.parentMode = args.photosMode;
    
    this.selectedAlbum = null;
    this.move_from = null;
    this.scrollPos = null;
    
    //interfaces and paginator
    this.album_paginator_interface = null;
    this.photo_paginator_interface = null;
    this.doneLoadingAlbums = false;
    this.doneLoadingPhotos = false;
    
    //move view elements
    this.$move_photos_view = this.$root.find('#move-photos-view');
    this.$move_photos_view_left_nav = this.$root.find('#move-photos-left-nav');
    this.$scrollBar = this.$root.find('.album-view-droppable');
    
    //dropdowns and buttons
    this.$photo_count_dropdown = this.$root.find('#photo-display-count');
    this.$photo_count_select = this.$root.find('.photo-count-select');
    this.$album_dropdown = this.$root.find('#album-dropdown');
    this.$album_dropdown_select = this.$root.find('.album-drop-down-select');
    if (this.$root.find('.photo-count-drop-down').length == 0) {
        this.$photo_count_select.dropdown('init', {baseClassName:"photo-count-drop-down"});
    }
    this.$done_button = this.$root.find('.done-button');
    
    //album and photo templates
    this.$album_count = this.$root.find('.album-count');
    this.header_text = this.$root.find('.album-view-header').find('.text');
    this.$albumListEdit = this.$root.find('#album-list-edit');
    this.$albumTemplate = this.$root.find('.album-template');
    this.$photoList = this.$root.find('#photo-list');
    this.$photoListEdit = this.$root.find('#photo-list-edit');
    
    //hints
    this.$moveHint = this.$root.find('.move-hint');
    this.$addHint = this.$root.find('.add-hint');
    this.$addTip = this.$root.find('.add-tip-on-hover');
    this.$moveTip = this.$root.find('.move-tip-on-hover');
    this.$tip = this.$root.find('#tip-info-block');
    this.$close_hint = this.$root.find('.drag-and-drop-hint').find('.close');
        
    this.initialSetup();
}

MovePhotoView.prototype = {
    hide: function() { 
       this.$move_photos_view.hide();
       this.$move_photos_view_left_nav.hide();
       this.$addTip.hide();
       this.$moveTip.hide();
       this.$tip.hide();
       this.$photo_count_dropdown.hide();
       this.$album_dropdown.hide();
    },
    
    show: function() { 
       this.$move_photos_view.show();
       this.$move_photos_view_left_nav.show();
       this.$tip.show();
       this.$photo_count_dropdown.show();
       if (this.move_from){
           this.$album_dropdown.hide();
       } else {
           this.$album_dropdown.show();
       }
    },
    
    initialSetup: function() {
        if (this.album_paginator_interface == null) {
            this.album_paginator_interface = new AlbumPaginatorInterface({
                spinner: this.parentMode.$spinner,
                network: this.network,
                imvu: this.imvu,
                page: 1,
                pageSize: 0,
                callback: this.populateAlbums.bind(this),
                data: this.parentMode.data_source
            });
        }      
        
    },
    
    showMoveView: function(albumInfo, move_from){
        this.selectedAlbum = null;
        this.move_from = move_from;
        if (!this.move_from){ //moving to an album
            this.moveToAlbum = albumInfo;
            this.setBreadCrumbsForMoveToView();
        } else {
            this.selectedAlbum = albumInfo;
            this.setBreadcrumbs();
        }
        this.album_paginator_interface.updatePage();
        // add album dropdown for move to view
        if (!this.move_from) {
            this.setAlbumDropdown();
        }
        this.$photo_count_select.dropdown('setValue', 12);
        
        //setup Photos Data Source
        this.setUpPhotosDataSource();
    },
    
    //only shown for move to album view
    setAlbumDropdown: function() {
        this.$album_dropdown_select.html('');
        var photo_list_populated = false;
        var albumId;
        for (var index in this.albumInfo) {
            if (this.albumInfo[index].aid != this.moveToAlbum.aid) {
                var title;
                if (!photo_list_populated) {
                    albumId = this.albumInfo[index].aid;  
                }
                photo_list_populated = true;  
                if (this.albumInfo[index].title != '') {
                    title = this.albumInfo[index].title;
                } else {
                    title = "[" + _T('no title') + "]";
                }
                var $option = $('<option></option>').val(this.albumInfo[index].aid).text(title);
                title = $option.text();
                if (title.length > 23) {
                    title = title.substr(0, 23) + "...";
                }

                $option.text(title);
                this.$album_dropdown_select.append($option);
            }
        }
        if (this.$album_dropdown.find('.dropdown').length != 0) {
            this.$album_dropdown_select.dropdown('clearDropDown');
        }
        this.$album_dropdown_select.dropdown('init', {baseClassName:"album-select-drop-down"}); 
        this.getDropdownAlbum();
        this.$album_dropdown_select.bind('change', function(event) {
            this.getDropdownAlbum();
        }.bind(this));
    },
    
    //returns album selected in dropdown
    getDropdownAlbum: function() {
        var id = this.$album_dropdown_select.val();
        this.selectedAlbum = this.getAlbum(id); //normal albums
        this.setUpPhotosDataSource();
    },
    
    getAlbum: function(id) {
        for (var index in this.albumInfo) {
            if (this.albumInfo[index].aid == id){
                return this.albumInfo[index];
            }
        }
        return null;
    },
    
    setUpPhotoList: function() {
        this.$photoList.html('');
        this.$photoListEdit.html('');
        this.registerRppChange();
        this.$photoListEdit.show();
        this.addPhotoWidgets(this.$photoListEdit);
    },
    
    addPhotoWidgets: function(list) {
        var allowDelete, allowDrag;
        allowDrag = true;
       
        this.photos = [];
        if (this.photoInfo.length > 0) {
            for(var index in this.photoInfo) {
                var $item = this.$root.find('.photo-template').clone().removeClass('photo-template');
                var photoThumbnail = new PhotoThumbnail({
                    imvu: this.imvu,
                    root: $item,
                    photo: this.photoInfo[index],
                    photosMode: this.parentMode,
                    parentView: this,
                    breadcrumbs: this.parentMode.breadcrumbs,
                    paginator: this.photos_paginator,
                    allowDrag: allowDrag && !this.readOnly
                })
                list.append($item);
                this.photos.push(photoThumbnail);
            }
        }   
    },
    
    registerRppChange: function() {
        this.$photo_count_select.unbind('change');
        this.$photo_count_select.bind('change', function(event) {
            var new_rpp = this.$photo_count_select.val();
            this.photo_rpp = new_rpp;
            this.photo_paginator_interface.updatePageSize(new_rpp);
        }.bind(this));
    },
    
    setUpPhotosDataSource: function() {
       var callback_fn = this.populatePhotoList.bind(this);
       if (this.photo_paginator_interface == null || this.photo_paginator_interface.albumId != this.selectedAlbum.aid) {
            this.photo_paginator_interface = new PhotoPaginatorInterface({
                spinner: this.parentMode.$spinner,
                network: this.network,
                imvu: this.imvu,
                page: 1,
                pageSize: this.photo_rpp,
                albumId: this.selectedAlbum.aid,
                callback: callback_fn,
                data: this.parentMode.data_source
            });
        }  
        this.photo_paginator_interface.updatePage();
        this.$root.find('.breadcrumb-0').find('.breadcrumb-image').attr('src',"../img/albums-icon-white.png");  
    },
    
    setBreadcrumbs: function() {
        var title = this.selectedAlbum.title;
        if (title == "") title = '[' + _T('no title') + ']';
        if (title.length > 23) {
            title = title.substr(0, 23) + "...";
        }
        this.parentMode.breadcrumbs.addBreadcrumb("Move Photos: " + title, null, null);
    },
    
    populateAlbums: function(result, error) {
        if (error) {
            this.parentMode.showError("Fetch Error", "We are currently experiencing problems fetching your photo gallery album list.  Please check your network connection and try again.", "Failed to load album list.");
            return;
        }

       if (result) {
            this.albumInfo = result.albums;
       }
       this.setPhotosModeCurrentView();
       this.doneLoadingAlbums = true;
       if (this.doneLoadingAlbums && this.doneLoadingPhotos) {
           this.parentMode.$spinner.hide();
       }
    },
    
    populatePhotoList: function(result, error) {
        if (error) {
            this.showError("Fetch Error", "We are currently experiencing problems fetching your photo list.  Please check your network connection and try again.", "Failed to load photo list.");
            return;
        }

        if (result.photos) {
            this.photoInfo = result.photos;
            this.photoCount = this.photoInfo.length;
            this.albumPhotoCount = result.total_photo_count;
        }    
        this.usePhotosPaginator();
        this.setUpPhotoList();
        this.doneLoadingPhotos = true;
        if (this.doneLoadingAlbums && this.doneLoadingPhotos) {
            this.parentMode.$spinner.hide();
        }
    },
    
    usePhotosPaginator: function() {
        if (this.photos_paginator == null) {
            this.photos_paginator = new Paginator({
                root: this.$root.find('#paginator-head'),
                source: this.photo_paginator_interface
            });
            this.photos_paginator.initPaginator();
        } else {
            this.photos_paginator.setSource(this.photo_paginator_interface);
        }    
    },
    
    setPhotosModeCurrentView: function() {
        this.$albumListEdit.html('');
        this.parentMode.switchView(this);
        this.parentMode.movePhotoCountDropdownAndPaginator();
        if (this.move_from) {
            this.setMoveFromView();
        } else {
            this.setMoveToView();
        }
        this.createButtonsForMovePhotosView();
        if (this.scrollPos != null) {
            this.$scrollBar.scrollTop(this.scrollPos);
            this.scrollPos = null;
        }
    },
    
    createButtonsForMovePhotosView: function() {
        this.$done_button.unbind('click');
        this.$done_button.bind('click', function (event) {
            this.parentMode.breadcrumbs.backOneBreadcrumb();
        }.bind(this));

        this.$close_hint.unbind('click');
        this.$close_hint.bind('click', function(event) {
            this.$root.find('.drag-and-drop-hint').fadeOut('slow');
            this.parentMode.stylePhotoCountDropdownAndPaginatorOnHintClose();
            this.styleMoveOrAddTipOnClose();
        }.bind(this));
    },
    
    styleMoveOrAddTipOnClose: function() {
        if (this.move_from) {
            this.$moveTip.delay('1000').fadeIn('slow');
        } else {
            this.$addTip.delay('1000').fadeIn('slow');
        }
    },
    
    setMoveFromView: function() {
        this.$album_count.show();
        this.header_text.text("My Albums");
        this.$album_count.text(this.albumInfo.length+" Albums");
        this.movePhotosFromAlbumView();
        this.$root.find('#album-nav-container').css('height', '');
        this.$root.find('#album-nav-edit').css('height', '');
        this.buildMoveOrAddHintsAndTip('move');
    },
    
    setMoveToView: function() {
        this.$album_count.hide();
        this.header_text.text("Destination Album");
        this.movePhotosToAlbumView();
        this.$root.find('#album-nav-container').css('height', '260px');
        this.$root.find('#album-nav-edit').css('height', '223px');
        this.buildMoveOrAddHintsAndTip('add');
    },
    
    movePhotosToAlbumView: function() {
        var albums = [];
        var method;
        method = function(){};
        for (var index in this.albumInfo) {
            if (this.albumInfo[index].aid == this.moveToAlbum.aid ) {
                albums.push(this.albumInfo[index]);
                break;
            }
        }
        this.$albumListEdit.html('');
        this.addAlbumWidgets(this.$albumListEdit, albums, method);
    },
    
    setBreadCrumbsForMoveToView: function() {
        this.parentMode.breadcrumbs.addBreadcrumb("Add Photos: ", this.parentMode.showPhotoList.bind(this.parentMode), this.moveToAlbum.aid); 
    },
    
    movePhotosFromAlbumView: function() {
        var albums = [];
        var method;
        method = function(){};
        if (this.selectedAlbum) {//moving from regular album 
            if (this.albumInfo != null && this.albumInfo.length) {
                for (var index in this.albumInfo) {
                     if (this.albumInfo[index].aid != this.selectedAlbum.aid) {
                            albums.push(this.albumInfo[index]);
                     }
                }
            }
        } else {
            if (this.albumInfo != null && this.albumInfo.length) {
               for (var index in this.albumInfo) {
                     if (this.albumInfo[index].aid) {
                            albums.push(this.albumInfo[index]);
                     }
                }
            }
        }
        this.addAlbumWidgets(this.$albumListEdit, albums, method);
    },
    
    addAlbumWidgets: function(list, albums, method) {
        this.albums = [];
        for (var index in albums) {
            var $item = this.$albumTemplate.clone().removeClass('album-template');
            var albumRowWidget = new AlbumThumbnail({
                album: albums[index],
                root: $item,
                photosMode: this.parentMode,
                parentView: this,
                imvu: this.imvu,
                breadcrumbs: this.parentMode.breadcrumbs,
                allowDrop: !this.readOnly,
                clickFunction: method.bind(this)
            });
            list.append($item);
            if (albums[index].vip_album) {
                $item.find('.album-widget').removeClass('album-widget').addClass('album-widget-vip-album');
            }
            this.albums.push(albumRowWidget);
        }
        return list;
    },
    
   tipContentMoveOrAdd: function(moveOrAdd) {
        if (moveOrAdd == 'move') {
            this.$tip.find('.title').text(_T('Move photos tip'));
            this.$tip.find('.body').find('.text').text(_T('Drag and drop photos from the list below to add them to this album on the left panel'));
        } else if (moveOrAdd == 'add') {
            this.$tip.find('.title').text(_T('Add photos tip'));
            this.$tip.find('.body').find('.text').text(_T('Drag and drop photos from the list below to move them into the desired album'));
        } else return;
    },
    
    addHoverToMoveOrAddTip: function() {
        this.$tip = this.$root.find('#tip-info-block');
        this.$tip.hide();
        this.$moveTip.hover(
            function () {
                this.$tip.fadeIn('fast');
            }.bind(this),
            function () {
                this.$tip.fadeOut('fast');
            }.bind(this)
        );
        this.$addTip.hover(
            function () {
                this.$tip.fadeIn('fast');
            }.bind(this),
            function () {
                this.$tip.fadeOut('fast');
            }.bind(this)
        );
    },
    
    buildMoveOrAddHintsAndTip: function(moveOrAdd) {
        this.tipContentMoveOrAdd(moveOrAdd);
        this.addHoverToMoveOrAddTip();

        if (moveOrAdd == "move") {
            var hintCount = this.imvu.call('getLocalStoreValue', 'photos_mode.move_hint_display_count', 0);
            if (hintCount < 3) {
                this.$moveHint.show();
                this.imvu.call('setLocalStoreValue', 'photos_mode.move_hint_display_count', hintCount + 1);
            } else {
                this.parentMode.revertPhotoCountDropdownAndPaginatorStyling();
                this.$moveHint.hide();
                this.$moveTip.show();
            }
            this.$addHint.hide(); 
            this.$addTip.hide();
        } else if (moveOrAdd == "add") {
            var hintCount = this.imvu.call('getLocalStoreValue', 'photos_mode.add_hint_display_count', 0);
            if (hintCount < 3) {
                this.$addHint.show();
                this.imvu.call('setLocalStoreValue', 'photos_mode.add_hint_display_count', hintCount + 1);
            } else {
                this.parentMode.revertPhotoCountDropdownAndPaginatorStyling();
                this.$addHint.hide();
                this.$addTip.show();
            }
            this.$moveHint.hide();
            this.$moveTip.hide();
        } else return
    },
    
    refreshAfterMove: function(result, error, scrollPos) {
        if (error) {
            this.parentMode.showError("Move Error", "We are currently experiencing problems moving your photo.  Please check your network connection and try again.", "Failed to move photo.");
            return;
        }
        if (!result) {
            this.parentMode.showError("Move Error", "Destination Album is full.  Cannot move photo.", "Failed to move photo.");
            return;
        }
        this.doneLoadingAlbums = false;
        this.doneLoadingPhotos = false;
        this.scrollPos = scrollPos;
        this.album_paginator_interface.updatePage();

        this.photo_paginator_interface.updatePage();
    },
    
    getSelectedAlbum: function() {
        return this.selectedAlbum.aid; //normal albums
    }
}
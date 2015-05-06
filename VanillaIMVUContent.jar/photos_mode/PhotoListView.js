PhotoListView = function (args) {
    this.$root = args.root;
    this.imvu = args.imvu;
    this.readOnly = args.readOnly,
    this.breadcrumbs = args.breadCrumbs
    this.photo_rpp = args.photo_rpp;
    this.parentMode = args.photosMode;
    this.lastSelectedPhoto = null;
    this.photo_paginator_interface = null;

    this.$photoList = this.$root.find('#photo-list');
    this.$photoListEdit = this.$root.find('#photo-list-edit');
    this.$photoTemplate = this.$root.find('.photo-template');
    this.$left_nav_all_photos_view = this.$root.find('#left-nav-all-photos-view');
    this.$flag_album = this.$root.find('.flag-album');
    this.$photo_view = this.$root.find('#photo-view');
    //left nav
    this.$add_photos = this.$root.find('.add-photos');
    this.$move_photos = this.$root.find('.move-photos');
    this.$edit_album_info = this.$root.find('.edit-album-info');
    this.$delete_this_album = this.$root.find('.delete-this-album');
    
    //top nav
    this.$total_photos_count = this.$root.find('#total-photos');
    //dropdown
    this.$photo_count_dropdown = this.$root.find('#photo-display-count');
    this.$photo_count_select = this.$root.find('.photo-count-select');
    this.$album_privacy_dropdown = this.$root.find('#album-privacy-container');
    this.$album_privacy_select = this.$root.find('.album-privacy');
    this.$album_description = this.$root.find('.album-description');
    this.$album_privacy_select.unbind('change');
    this.$album_privacy_select.dropdown('init', {baseClassName: "visibility-dropdown"});
    this.$album_privacy_select.bind('change', {selectForm: this.$album_privacy_select}, this.updateVisibility.bind(this));
    if (this.$root.find('.photo-count-drop-down').length == 0) {
        this.$photo_count_select.dropdown('init', {baseClassName:"photo-count-drop-down"});
    }
    
    $('body').click(function() {
        $('.photo-thumbnail').removeClass('selected');
   }.bind(this));
   
    this.$upload_photo_button = this.$root.find('button#upload-photo');
    this.selectedAlbum = null;

    this.parentMode.bindEventToUpdate('albumEditedInAlbumView', this.updateLeftNavAlbumInfo.bind(this));
}

PhotoListView.prototype = {
    hide: function() {
        this.$left_nav_all_photos_view.hide();
        this.$photo_count_dropdown.hide();   
        this.$photo_view.hide(); 
    },
    
    show: function() {
        this.$left_nav_all_photos_view.show();
        this.$photo_count_dropdown.show(); 
        this.$photo_view.show();
    },
    
    setupPhotosDataSource: function() {
        var callback_fn = this.populatePhotoList.bind(this);
        if (this.photo_paginator_interface == null || this.photo_paginator_interface.albumId != this.selectedAlbum.aid) {
            this.photo_paginator_interface = new PhotoPaginatorInterface({
                spinner: this.parentMode.$spinner,
                network: this.parentMode.network,
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
    
    populatePhotoList: function(result, error) {
        if (error) {
            this.parentMode.showError("Fetch Error", "We are currently experiencing problems fetching your photo list.  Please check your network connection and try again.", "Failed to load photo list.");
            return;
        }
        if (result.photos) {
            this.photoInfo = result.photos;
            this.photoCount = this.photoInfo.length;
            this.albumPhotoCount = result.total_photo_count;
        }
        this.usePhotosPaginator();

        if (result.albumCount == 1) {
            this.$add_photos.hide();
            this.$move_photos.hide();
        } else if (result.photos.length == 0) {
            this.$add_photos.show();
            this.$move_photos.hide();
        } else {
            this.$add_photos.show();
            this.$move_photos.show();
        }

        this.setPrivacyAndDescriptionForAlbum();
        this.addPhotoOptionForAlbum(result.album_full);
        this.editAlbumInfo();
        this.deleteAlbumOption();
        this.addClickForFlaggingAlbum();
        this.setPhotosModeCurrentView();
        this.$total_photos_count.text(this.albumPhotoCount + " "  + ((this.albumPhotoCount == 1) ? _T('Photo') : _T('Photos')));
        this.movePhotosOptionInPhotoListView();
        this.parentMode.$spinner.hide();
    },
    
    movePhotosOptionInPhotoListView: function() {
        if (this.readOnly) {
            this.$move_photos.hide();
        }
        this.$move_photos.unbind('click');
        var move_from = true;
        if (this.selectedAlbum) {
            this.$move_photos.bind('click', function (event) {
                this.parentMode.showMoveView(this.selectedAlbum, move_from ); 
            }.bind(this));
        } else {
            this.$move_photos.bind('click', function (event) {
                this.parentMode.showMoveView(null, move_from); 
            }.bind(this));
        }
    },
    
    setPhotosModeCurrentView: function() {
        this.$photoList.html('');
        this.$photoListEdit.html('');
        
        this.$photo_count_select.unbind('change');
        this.$photo_count_select.bind('change', function(event) {
            var new_rpp = this.$photo_count_select.val();
            this.photo_rpp = new_rpp;
            this.photo_paginator_interface.updatePageSize(new_rpp);
        }.bind(this));
        this.parentMode.switchView(this);
        
        this.addPhotoWidgets(this.$photoList);
        this.parentMode.revertPhotoCountDropdownAndPaginatorStyling(); 
        
    },
    
    addPhotoWidgets: function(list) {
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
                    allowDelete: !this.readOnly,
                    allowClick: true,
                    allowFlag: this.readOnly
                })
                $item.find('.photo-thumbnail').click(this.selectPhoto.bind(this));
                photoThumbnail.$deleteButton.click(this.deletePhoto.bind(this));
                list.append($item);
                this.photos.push(photoThumbnail);
            }
        }   
    },
    
    editAlbumInfo: function() {
        if (this.readOnly) {
            this.$edit_album_info.hide();
            this.$upload_photo_button.hide();
        } 
        this.$edit_album_info.unbind('click');
        if (this.selectedAlbum) {
            this.$edit_album_info.bind('click', function (event) {
                this.showEditAlbum();
            }.bind(this));
        }
    },
    
    showEditAlbum: function() {
        var response = this.imvu.call('showManageAlbum', { album: {aid: this.selectedAlbum.aid, title: this.selectedAlbum.title, visibility: this.selectedAlbum.visibility, description: this.selectedAlbum.description, thumb: this.selectedAlbum.thumb, default_album: this.selectedAlbum.default_album }});
        if (response) {
            this.selectedAlbum = response.result;
            this.parentMode.$root.trigger('albumEditedInAlbumView', response);
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

    setPrivacyAndDescriptionForAlbum: function() {
        if (this.readOnly) {
            this.$album_privacy_dropdown.hide(); 
            this.$root.find('#default-album-privacy-container').hide();
            return;
        }

        if (this.selectedAlbum) {
            var current_privacy = this.selectedAlbum.visibility;
            this.$album_privacy_select.dropdown('setValue', current_privacy);
            
            this.setAlbumDescription(this.selectedAlbum.description);
            this.$album_privacy_dropdown.toggle(this.selectedAlbum.default_album != true);
            this.$root.find('#default-album-privacy-container').toggle(this.selectedAlbum.default_album == true);
        }
    },
    
    setAlbumDescription: function(description) {
        if (!description || description.length == 0) {
            this.$album_description.text(_T("No Description"));
        } else if (description.length <= 300) {
            this.$album_description.text(description);
        } else {
            this.$album_description.text(description.substring(0, 300) + "...");
        }
    },
    
    populate: function(album) {
        this.selectedAlbum = album;
        this.setupPhotosDataSource(); 
        this.$photo_count_select.dropdown('setValue', this.photo_rpp);
    },
    
    updateVisibility: function(event) {
        var newVisibility = event.data.selectForm.val(),
            oldVisibility = this.selectedAlbum.visibility;
        this.parentMode.editAlbum(function(result, error) {
            if (error) {
                this.$album_privacy_select.dropdown('setValue', oldVisibility);
                this.parentMode.showError("Fetch Error", "We are currently experiencing problems updating your privacy setting.  Please check your network connection and try again.", "Failed to update album.")
                return;
            }
            this.selectedAlbum.visibility = newVisibility;
            this.parentMode.$spinner.hide();
        }.bind(this), {album_id: this.selectedAlbum.aid, visibility: newVisibility});
    },
    
    addPhotoOptionForAlbum: function(album_full) {
        if (this.readOnly) {
            this.$add_photos.hide();
            this.$upload_photo_button.hide();
        }

        this.$add_photos.unbind('click');
        this.$upload_photo_button.unbind('click');
        if (this.selectedAlbum) {
            this.$add_photos.bind('click', function (event) {
                var move_from = false;
                this.parentMode.showMoveView(this.selectedAlbum, move_from);
            }.bind(this)); 
            if (album_full) {
                this.$upload_photo_button.bind('click', function (event) {
                     this.parentMode.showError("Upload Error", "Album is full.  Cannot upload more photo.", "Failed to upload photo.");
                     return;
                }.bind(this));
            } else {
                this.$upload_photo_button.bind('click', function (event) {
                    this.parentMode.$spinner.show();
                    this.imvu.call('showUploadPhoto',{aid: this.selectedAlbum.aid});
                }.bind(this));
            }
        }
    },
    
    handleUploadPhotoComplete: function(result, aid) {
        if (result) {
            this.parentMode.data_source.flushAlbum(aid);
            this.parentMode.data_source.getAlbum(function(result, error) {
                this.parentMode.data_source.flushPhotoList(aid);
                this.photo_paginator_interface.updatePage();
            }.bind(this), aid);
            return;
        }
        this.parentMode.$spinner.hide();
    },
    
    updateLeftNavAlbumInfo: function(result) {
        var info = result.result;
        this.setAlbumDescription(info.description);
        var title = this.$root.find('.current-breadcrumb').find('.breadcrumb-text');
        if (info.title != '') {
            title.text(info.title);
        } else {
            title.text('no title');
        }
        var current_privacy = info.visibility;
        this.$album_privacy_select.dropdown('setValue', current_privacy);
    },
    
     deleteAlbumOption: function() {
        if (this.readOnly) {
            this.$delete_this_album.hide();
            return;
        }
        this.$delete_this_album.unbind('click');
        if (this.selectedAlbum && this.selectedAlbum.default_album == false) {
            this.$delete_this_album.bind('click', function (event) {
                var response = this.imvu.call('showDeleteAlbumAlert', {});
                if (response != null && response['result']) {
                    this.parentMode.breadcrumbs.removeTopBreadcrumb();
                    this.parentMode.deleteAlbum(this.selectedAlbum.aid);
                }
            }.bind(this));
            this.$delete_this_album.show();
        } else {
            this.$delete_this_album.hide();
        }
    },
    
    addClickForFlaggingAlbum: function() {
        if (!this.readOnly) {
            this.$flag_album.hide();
        } else {
            this.$flag_album.show();
            this.$flag_album.unbind('click');
            this.$flag_album.bind('click', function (event) {
                titleStr = this.selectedAlbum.title
                if (titleStr.length == 0) {
                    titleStr = '[untitled]'
                }
                dialogInfo = {
                    'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
                    'service_url': '/api/flag_content/flag_album.php',
                    'title':_T('Flag ') + '"' + titleStr + '"',
                    'post_data': {
                        'gallery_id': this.parentMode.galleryCid,
                        'album_id': this.selectedAlbum.aid
                    },
                    'message': _T('This photo album will be submitted to IMVU customer service for review.')
                };
                this.imvu.call('showModalFlaggingDialog', dialogInfo);
            }.bind(this));
        }
    },
    
    refresh: function(result, error) {
        if (error) {
            this.parentMode.showError("Delete Error", "We are currently experiencing problems deleting your Photo.  Please check your network connection and try again.", "Failed to load photo list.");
            return;
        }
        this.photo_paginator_interface.updatePage();
    },
    
    getSelectedAlbum: function() {
        return this.selectedAlbum;
    },
    
    getCurrentPage: function() {
        return this.photo_paginator_interface.currentPage();
    },
    
    setCurrentPage: function(photo_number) {
        var pag_num = Math.ceil(photo_number / this.photo_rpp);
        if (this.photo_paginator_interface && pag_num != this.photo_paginator_interface.currentPage()) {
           this.photo_paginator_interface.currentPage(pag_num);
        }
    },
    
    selectPhoto: function(event) {
        if ($(event.currentTarget).hasClass('photo-thumbnail') && !this.readOnly) {
            if ((!$(event.target).hasClass('photo-selected') && event.ctrlKey) ||
                ($(event.target).hasClass('photo-selected'))) {
                $(event.currentTarget).toggleClass('selected');
                event.stopPropagation();

                if (event.shiftKey && event.ctrlKey && this.lastSelectedPhoto !== null) {
                    var newIndex = $(event.currentTarget).parent().parent().index();
                    var collection = [newIndex, this.lastSelectedPhoto];
                    $(event.currentTarget).parent().parent().parent().children()
                        .slice(_.min(collection), _.max(collection))
                        .find('.photo-thumbnail')
                        .addClass('selected');
                }
                
                this.lastSelectedPhoto = $(event.currentTarget).parent().parent().index();
            }
        }
    },
    
    deletePhoto: function(event) {
        var response = this.imvu.call('showDeletePhotoAlert', {});
        var $selected = this.$root.find('.photo-thumbnail.selected');
        if (response != null && response['result']) {
            if ($selected.length > 1) {
                var albumId = $selected.first().attr('data-album-id');
                var photos = _.map($selected, function(item) {
                    return $(item).attr('data-photo-id');
                });
                this.parentMode.deletePhoto(photos, albumId);
            } else {
                var $photo_widget = $(event.target).parent().find('.photo-thumbnail');
                this.parentMode.deletePhoto([$photo_widget.attr('data-photo-id')], $photo_widget.attr('data-album-id'));
            }
        }
    }
}
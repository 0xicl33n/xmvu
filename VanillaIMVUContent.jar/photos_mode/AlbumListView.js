AlbumListView = function (args) {
   this.$root = args.root;
   this.imvu = args.imvu;
   this.network = args.network;
   this.readOnly = args.readOnly;
   this.album_rpp = args.album_rpp;
   this.parentMode = args.photosMode;
   this.album_paginator = null;
   this.lastSelectedAlbum = null;

   //album view
   this.$album_view = this.$root.find('#album-view');
   this.$albumList = this.$root.find('#album-list');
   this.$albumListEdit = this.$root.find('#album-list-edit');
   this.$left_nav_album_view = this.$root.find('#left-nav-album-view');
   this.$album_count_dropdown = this.$root.find('#album-display-count');
   this.$album_count_select = this.$root.find('.album-count-select');
   this.$refreshButton = this.$root.find('#refresh-album-list');
   this.$create_album_button = this.$root.find('button#create-album');
   this.$albumTemplate = this.$root.find('.album-template');
   $('body').click(function() {
        $('.album-widget').removeClass('selected');
   }.bind(this));
   
   //Top Nav
   this.$total_photos_count = this.$root.find('#total-photos');
   this.$total_album_count = this.$root.find('#total-albums');
   
   this.initialSetup();
}

AlbumListView.prototype = {
    hide: function() {
        this.$album_view.hide();
        this.$left_nav_album_view.hide();
        this.$total_album_count.hide();
        this.$album_count_select.hide();
        this.imvu.call('hideAd');
    },

    show: function() {
        this.$album_view.show();
        this.$left_nav_album_view.show();
        this.$total_album_count.show();
        this.$total_photos_count.show();
        this.imvu.call('showAd');
    },
    
    initialSetup: function() {
       
       //add breadcrumb
        this.parentMode.breadcrumbs.addBreadcrumb(_T("My Albums"), this.populate.bind(this), null);
        var first_breadcrumb = this.$root.find('.breadcrumb-0');
        first_breadcrumb = first_breadcrumb.find('.breadcrumb-image');
        first_breadcrumb.attr('src',"../img/albums-icon.png");
        $('.breadcrumb-image').attr('src',"../img/albums-icon.png");

        //set album data source interface
        this.album_paginator_interface = new AlbumPaginatorInterface({
            spinner: this.parentMode.$spinner,
            network: this.network,
            imvu: this.imvu,
            page: 1,
            pageSize: this.album_rpp,
            callback: this.populateAlbumList.bind(this),
            data: this.parentMode.data_source
        });
        //set album paginator
        this.album_paginator = new Paginator({
            root: this.$root.find('#paginator-head'),
            source: this.album_paginator_interface
        });
        this.album_paginator.initPaginator();
        this.parentMode.bindEventToUpdate('albumEdited', this.populate.bind(this));
        this.parentMode.bindEventToUpdate('albumCreated', this.populate.bind(this));
        $("#link_goods_policy").click(function () { this.imvu.call("launchNamedUrl", "virtual_goods_policy"); }.bind(this));
        this.$refreshButton.bind('click', function (event) {
            this.refresh();
        }.bind(this));
        this.initializeCountDropdown();
    },

    populate: function() {
        this.album_paginator_interface.rpp = this.album_rpp;
        this.album_paginator_interface.updatePage();
    },
    
    refresh: function() {
        this.parentMode.data_source.flushAlbumList();
        this.populate();
    },
   
    populateAlbumList: function(result, error) {
        if (error) {
            this.showError("Fetch Error", "We are currently experiencing problems fetching your photo gallery album list.  Please check your network connection and try again.", "Failed to load album list.");
            return;
        }

        if (result) {
            this.albumInfo = result.albums;
            this.albumCount = result.album_count;
            this.total_photos = result.photo_count;
        }
        
        this.$total_album_count.text(this.albumCount + " "  + ((this.albumCount == 1) ? _T('Album') : _T('Albums')));
        this.$total_album_count.show();
        this.addClickToCreateAlbumButton();
        
        //go to current page of albums
        this.album_paginator.setSource(this.album_paginator_interface);
        
        this.setPhotosModeCurrentView();
        this.intializeOptionForAlbumWidget();
        this.parentMode.$spinner.hide();
    },
    
    addClickToCreateAlbumButton: function() {
        this.$create_album_button.unbind('click');
        if (!this.readOnly) {
            this.$create_album_button.bind('click', function (event) {
                this.createAlbumDialog();
            }.bind(this));
        } else {
            this.$create_album_button.hide();
        }
    },

    setPhotosModeCurrentView: function() {
        this.parentMode.revertPhotoCountDropdownAndPaginatorStyling();
        this.$albumList.html('');
        this.$albumListEdit.html('');
        var first_breadcrumb = this.$root.find('.breadcrumb-0');
        first_breadcrumb = first_breadcrumb.find('.breadcrumb-image');
        first_breadcrumb.attr('src',"../img/albums-icon.png");
        $('.breadcrumb-image').attr('src',"../img/albums-icon.png");
        this.parentMode.switchView(this);
    },

    initializeCountDropdown: function() {
        this.$album_count_select.dropdown('init', {baseClassName:"album-count-drop-down"});
        this.$album_count_select.unbind('change');
        this.$album_count_select.bind('change', function (event) {
            var new_rpp = this.$album_count_select.val();
            this.album_rpp = new_rpp;
            this.album_paginator_interface.updatePageSize(new_rpp);
        }.bind(this));
    },

    intializeOptionForAlbumWidget: function() {
        var albums = [];
        var method, readOnly, allowClick;
        method = function(){};

        allowClick = true;
        if (this.albumInfo != null && this.albumInfo.length > 0) {
            for (var index in this.albumInfo) {
                albums.push(this.albumInfo[index]);
            }
        }

        this.allAlbums = albums;

        //add all album widgets
        var list = this.addAlbumWidgets(this.$albumList, albums, allowClick, method);
        this.$total_photos_count.text(this.total_photos + " "  + ((this.total_photos == 1) ? _T('Photo Total') : _T('Photos Total')));
        this.$total_photos_count.show();
        //if not readOnly add create album widget
        if (!this.readOnly) {
            this.addCreateAlbumWidget(list,allowClick);
        }
    },

    addCreateAlbumWidget: function(list, allowClick) {
        if (this.album_paginator_interface.currentPage() != this.album_paginator_interface.totalPages()) return;
        this.$addAlbum = this.$albumTemplate.clone().removeClass('album-template');
        this.$addAlbum.find('.album-thumbnail').removeClass('album-thumbnail').addClass('add-album');
        this.$addAlbum.find('.album-widget').removeClass('album-widget').addClass('add-album-widget');
        var image_path = "../img/create-album.png";
        if (this.parentMode.data_source.numAlbums >= this.parentMode.data_source.maxAlbums) {
            image_path = "../img/create_album_vip.png";
        }
        var albumRowWidget = new AlbumThumbnail({
            root: this.$addAlbum,
            photosMode: this.parentMode,
            parentView: this,
            imvu: this.imvu,
            breadcrumbs: this.parentMode.breadcrumbs,
            allowClick: allowClick && !this.readOnly,
            img_src: image_path,
            clickFunction: this.createAlbumDialog.bind(this)
        });
        list.append(this.$addAlbum);
    },

    createAlbumDialog: function() {
        var response = this.imvu.call('showManageAlbum', {});
        if (response) {
            this.$root.trigger('albumCreated', response);
            //go to add photos view
            this.parentMode.data_source.getAlbum(function(result, error) {
                this.parentMode.showMoveView(result.result, false);
            }.bind(this), response.result.aid);
        }
    },

    addAlbumWidgets: function(list, allAlbums, allowClick, method) {
        this.albums = [];
        for (var index in allAlbums) {
            var $item = this.$albumTemplate.clone().removeClass('album-template');
            var albumRowWidget = new AlbumThumbnail({
                album: allAlbums[index],
                root: $item,
                photosMode: this.parentMode,
                parentView: this,
                imvu: this.imvu,
                breadcrumbs: this.parentMode.breadcrumbs,
                allowEdit: !this.readOnly,
                allowMove: (allAlbums.length > 1) && (allAlbums[index].count > 0) && !this.readOnly,
                allowDelete: !this.readOnly,
                allowClick: allowClick,
                clickFunction: method.bind(this)
            });
            $item.find('.album-widget').click(this.selectAlbum.bind(this));
            albumRowWidget.$deleteButton.click(this.deleteAlbums.bind(this));
            list.append($item);
            this.albums.push(albumRowWidget);
        }
        return list;
    },
    
    selectAlbum: function(event) {
        if ($(event.currentTarget).hasClass('album-widget') && !this.readOnly) {
            if ((!$(event.target).hasClass('album-selected') && event.ctrlKey) ||
                ($(event.target).hasClass('album-selected'))) {
                $(event.currentTarget).toggleClass('selected');
                event.stopPropagation();

                if (event.shiftKey && event.ctrlKey && this.lastSelectedAlbum !== null) {
                    var newIndex = $(event.currentTarget).parent().index();
                    var collection = [newIndex, this.lastSelectedAlbum];
                    $(event.currentTarget).parent().parent().children()
                        .slice(_.min(collection), _.max(collection))
                        .find('.album-widget')
                        .addClass('selected');
                }
                
                this.lastSelectedAlbum = $(event.currentTarget).parent().index();
            }
        }
    },
    
    deleteAlbums: function(event) {
        var response = this.imvu.call('showDeleteAlbumAlert', {});
        var $selected = this.$root.find('.album-widget.selected');
        if (response != null && response['result']) {
            if ($selected.length > 1) {
                var albums = _.map($selected, function(item) {
                    return $(item).attr('data-album-id');
                });
                this.parentMode.deleteAlbum(albums);
            } else {
                var $album_widget = $(event.target).next();
                this.parentMode.deleteAlbum([$album_widget.attr('data-album-id')]);
            }
        }
    }
}
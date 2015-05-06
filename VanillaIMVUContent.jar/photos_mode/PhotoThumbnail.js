PhotoThumbnail = function (args) {
    this.imvu = args.imvu;
    this.$root = $(args.root);
    this.photo = args.photo;
    this.parentMode = args.photosMode;
    this.parentView = args.parentView;
    this.breadcrumbs = args.breadcrumbs;
    this.paginator = args.paginator || null;
    
    this.$thumbnail = this.$root.find('.thumbnail');
    this.$deleteButton = this.$root.find('.delete-widget-photo');
    this.$flag_icon = this.$root.find('.flag-photo-list');
    
    this.$root.find('.pic-id-hidden').text(this.photo.pid);
    this.$root.find('.photo-thumbnail').attr('data-photo-id', this.photo.pid);
    this.$root.find('.photo-thumbnail').attr('data-album-id', this.photo.aid);
    this.$root.find('.pic-title').text(this.getTitle());
    this.parentMode.fitThumbnail(this.$thumbnail, this.photo.thumb_url);

    var $widget = this.$root.find('.thumbnail-widget');
    
    //operations on photo
    this.allowFlag = args.allowFlag || false;
    this.allowDelete = args.allowDelete || false;
    this.allowDrag = args.allowDrag || false;
    this.allowClick = args.allowClick || false;
    
    if (this.allowDelete) {
        this.$root.find('.photo-thumbnail').toggleClass('deletable');
        $widget.mouseover(function() {this.$deleteButton.css("opacity", "1.0")}.bind(this));
        $widget.mouseout(function() {this.$deleteButton.css("opacity", "0.0")}.bind(this));

        this.$deleteButton.mouseover(function() {this.$deleteButton.css("opacity", "1.0")}.bind(this));
        this.$deleteButton.mouseout(function() {this.$deleteButton.css("opacity", "0.0")}.bind(this));
    } else {
        this.$deleteButton.css('visibility', 'hidden');   
    }
    
    if (this.allowFlag) {
        $widget.mouseover(function() {this.$flag_icon.css("opacity", "1.0")}.bind(this));
        $widget.mouseout(function() {this.$flag_icon.css("opacity", "0.0")}.bind(this));

        this.$flag_icon.mouseover(function() {
            this.$flag_icon.addClass('red-flag');
            this.$flag_icon.css("opacity", "1.0");
        }.bind(this));
        this.$flag_icon.mouseout(function() {
            this.$flag_icon.removeClass('red-flag');
            this.$flag_icon.css("opacity", "0.0");
        }.bind(this));
        this.$flag_icon.show();
        this.$flag_icon.unbind('click');
        this.$flag_icon.bind('click', function (event) {
            titleStr = this.photo.title
            if (titleStr.length == 0) {
                titleStr = '[untitled]'
            }
            dialogInfo = {
                'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
                'service_url': '/api/flag_content/flag_photo.php',
                'title':_T('Flag ') + '"' + titleStr + '"',
                'post_data': {
                    'gallery_id': this.parentMode.galleryCid,
                    'photo_id': this.photo.pid
                },
                'message': _T('This photo will be submitted to IMVU customer service for review.')
            };
            this.imvu.call('showModalFlaggingDialog', dialogInfo);
        }.bind(this));
    } else {
        this.$flag_icon.hide();
    }

    if (this.allowClick) {
        this.$root.find('.photo-thumbnail').css('cursor', 'pointer');
        this.$root.find('.photo-thumbnail').bind('click', function (event) {
            if (event.ctrlKey || $(event.target).hasClass('photo-selected')) {
                return;
            }
            this.paginator.$root.hide();
            this.breadcrumbs.addBreadcrumb(this.getTitle(), this.parentMode.showPhotoView.bind(this.parentMode), this.photo.pid, this.photo.aid);
            this.parentMode.showPhotoView(this.photo.pid, this.photo.aid);
        }.bind(this));
    }

    if (this.allowDrag) {
        $widget.draggable({appendTo: 'body', helper: 'clone', scroll: false, opacity: 0.3, revert: 'invalid', revertDuration: 500, zIndex: 3});
        $widget.data("photomode", this.parentMode);
        $widget.find('.thumbnail').css('cursor', 'move');
        $widget.find('.photo-thumbnail').css('cursor', 'move');
    }
}

PhotoThumbnail.prototype = {
    getTitle: function() {
        var title = this.photo.title;
        if(title.length > 23) title = this.photo.title.substr(0, 23) + "...";
        return (this.photo.title == "") ? "[" + _T("untitled") + "]" : title;
    },
}
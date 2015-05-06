PhotoDetailView = function (args) {
    this.$root = args.root;
    this.imvu = args.imvu;
    this.readOnly = args.readOnly;
    this.breadcrumbs = args.breadCrumbs;
    this.parentMode = args.photosMode;
    this.timer = args.timer;

    this.$img = this.$root.find('.hires-photo');
    this.$flag = this.$root.find('.flag-photo-detail');
    this.$download = this.$root.find('.download-button');
    this.$showInBrowser = this.$root.find('.show-in-browser');
    this.$setCover = this.$root.find('.album-cover');
    this.$startSlideshow = this.$root.find('.start-slideshow');
    this.$prev = this.$root.find('.prev-photo');
    this.$next = this.$root.find('.next-photo');
    this.$displayTitle = this.$root.find('#photo-detail-view').find('.title');
    this.$displayDescription = this.$root.find('#photo-detail-view').find('.description');
    this.$lightbox = this.$root.find('#lightbox');
    this.$lightboxPhoto = this.$lightbox.find('.lightbox-photo');
    this.$lightboxPlay = this.$lightbox.find('.play');
    this.$lightboxForward = this.$lightbox.find('.forward');
    this.$lightboxBack = this.$lightbox.find('.back');

    this.fadeInProgress = false;
    this.playInProgress = false;
    this.upcomingPhoto = null;
    this.selectedAlbum = null;
    this.photo = null;
    this.slideTimerId = null;
    this.supressBlur = false;

    this.isQA = this.imvu.call('isQA');

    this.$lightbox.fadeOut(0);
    this.$lightbox.find('.close').unbind('click').bind('click', function() {
        this.stopSlideshow();
    }.bind(this));

    $(document).keypress(function(e) {
        if (e.keyCode == 27) {  // esc key
            if (this.$lightbox.css('opacity')) {
                this.stopSlideshow();
            }
        }
    }.bind(this));

    this.$lightboxPlay.unbind('click').bind('click', function() {
        if (this.photo.image_next_pid == null) {
            this.$lightboxPlay.toggleClass('pause', false);
        } else {
            this.$lightboxPlay.toggleClass('pause');
        }
        this.playInProgress = this.$lightboxPlay.hasClass('pause');

        if (!this.playInProgress && this.photo.image_next_pid) {
            this.$lightboxForward.css('visibility', 'visible');
        } else {
            this.$lightboxForward.css('visibility', 'hidden');
        }

        if (!this.playInProgress && this.photo.image_prev_pid) {
            this.$lightboxBack.css('visibility', 'visible');
        } else {
            this.$lightboxBack.css('visibility', 'hidden');
        }

        if (this.playInProgress == true) {
            this.startSlideshow();
        }
    }.bind(this));

    this.$startSlideshow.unbind('click').bind('click', function() {
        if (this.photo) {
            this.fadeInProgress = true;
            this.$lightboxPlay.click();
            this.$lightbox.fadeIn('slow', function() {
                this.fadeInProgress = false;
            }.bind(this));
        }
    }.bind(this));

    this.$startSlideshow.toggle(this.isQA);
    this.$lightbox.find('.buttons').toggle(this.isQA);

    this.$img.unbind('click').bind('click', function() {
        if (this.photo) {
            this.fadeInProgress = true;
            this.$lightbox.fadeIn('slow', function() {
                this.fadeInProgress = false;
            }.bind(this));
        }
    }.bind(this));

    this.$lightboxForward.unbind('click').bind('click', function (event) {
        this.parentMode.showPhotoView(this.photo.image_next_pid, this.photo.aid);
    }.bind(this));

    this.$lightboxBack.unbind('click').bind('click', function (event) {
        this.parentMode.showPhotoView(this.photo.image_prev_pid, this.photo.aid);
    }.bind(this));

    this.$flag.toggle(this.readOnly);
    if (this.readOnly) {
        this.$flag.bind('click', function (event) {
            if (this.photo) {
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
            }
        }.bind(this));
    }

    this.$download.unbind('click').bind('click', function() {
        if (this.photo) {
            this.parentMode.$spinner.show();
            this.imvu.call('saveAs', {url: this.photo.url});
        }
    }.bind(this));
    
    this.$showInBrowser.unbind('click').bind('click', function() {
        if (this.photo) {
            this.imvu.call('launchUrl', this.photo.url);
        }
    }.bind(this));

    this.$prev.find('.nav, .nav-link').unbind('click').bind('click', function (event) {
        this.$img.attr({src: '', alt:''});
        this.parentMode.showPhotoView(this.photo.image_prev_pid, this.photo.aid);
    }.bind(this));

    this.$next.find('.nav, .nav-link').unbind('click').bind('click', function (event) {
        this.$img.attr({src: '', alt:''});
        this.parentMode.showPhotoView(this.photo.image_next_pid, this.photo.aid);
    }.bind(this));
}

PhotoDetailView.prototype = {
    PHOTO_PADDING: 10,
    MIN_CONTAINER_HEIGHT: 350,
    MIN_COMMENTS_HEIGHT: 230,
    SLIDESHOW_DELAY: 3000,

    fit: function ($window, $container, $photo) {
        var w = $window.width() - 473,
            h = $window.height() - this.MIN_COMMENTS_HEIGHT,
            minHeight = parseInt($photo.css('min-height'), 10),
            maxHeight = $photo.data('true-height');

        if (h < this.MIN_CONTAINER_HEIGHT) {
            h = this.MIN_CONTAINER_HEIGHT;
        }

        $container.height(h);

        h -= (this.PHOTO_PADDING * 2);
        if (h > maxHeight) {
            h = maxHeight;
        } else if (h < minHeight) {
            h = minHeight;
        }

        if (w < 540) {
            w = 540;
        }

        $photo.css({'max-height': h, 'max-width': w});
    },

    fitLightbox: function ($container, $photo) {
        var w = $container.width(),
            h = $container.height(),
            maxHeight = $photo.data('true-height'),
            maxWidth = $photo.data('true-width');

        if (h < this.MIN_CONTAINER_HEIGHT) {
            h = this.MIN_CONTAINER_HEIGHT;
        }

        h = h - 40; // top padding
        if (h > maxHeight) {
            h = maxHeight;
        }

        if (w > maxWidth) {
            w = maxWidth;
        } else if (w < 200) {
            w = 200;
        }

        $photo.css({'max-height': h, 'max-width': w});
    },

    onResize: function () {
        this.fit(this.parentMode.$spinner, $('.current-photo'), this.$img);
        this.fitLightbox(this.parentMode.$spinner, this.$lightboxPhoto);
   },

    hide: function() {
        this.$root.find('#left-nav-photo-view').hide();
        this.$root.find('#photo-detail-view').hide();
    },
    
    show: function() {
        this.$root.find('#left-nav-photo-view').show();
        this.$root.find('#photo-detail-view').show();
    },
    
    setSelectedAlbum: function(album) {
        this.selectedAlbum = album;    
    },
    
    populate: function (result, error) {
        if (error) {
            this.parentMode.showError("Fetch Error", "We are currently experiencing problems fetching your photo details.  Please check your network connection and try again.", "Failed to load photo details.");
            return;
        }

        if (result) this.photo = result;
        this.parentMode.switchView(this);

        this.$prev.unbind('click');
        this.$next.unbind('click');

        //album cover
        this.$setCover.unbind('click');
        if (!this.readOnly && this.selectedAlbum) {
            if (this.photo.pid == this.selectedAlbum.thumb) {
                this.$setCover.removeClass('left-nav-buttons').addClass('left-nav-buttons-inactive');
                this.$setCover.text(_T("This Photo is the Album Cover"));
            } else {
                this.$setCover.removeClass('left-nav-buttons-inactive').addClass('left-nav-buttons');
                this.$setCover.text(_T("Set as Album Cover"))
                this.$setCover.click(function () {
                    this.parentMode.editAlbum(this.updateAfterSettingThumbnail.bind(this), {album_id: this.selectedAlbum.aid, thumb: this.photo.pid});
                    this.$setCover.unbind('click');
                    this.$setCover.removeClass('left-nav-buttons').addClass('left-nav-buttons-inactive');
                    this.$setCover.text(_T("This Photo is the Album Cover"));
                }.bind(this));
            } 
        } else {
            this.$setCover.hide();
        }

        this.setPhoto();
        this.setupEditable(this.$displayTitle, this.$root.find('.edit-title-button'), this.$root.find('#edit-title-input'), true, 'title');
        this.setupEditable(this.$displayDescription, this.$root.find('.edit-description-button'), this.$root.find('#edit-description-input'), false, 'caption');

        this.setNavButton(this.$prev, this.$lightboxBack,  'image_prev_');
        this.setNavButton(this.$next, this.$lightboxForward, 'image_next_');

        this.parentMode.setCurrentPageForPhoto(this.photo.photo_number);
        this.parentMode.$spinner.hide();
    },

    startSlideshow: function() {
        if (this.photo.image_next_pid == null) {
            this.$lightboxPlay.click();
        } else {
            this.slideTimerId = this.timer.setTimeout(function() {
                this.advancePhoto();
            }.bind(this), this.SLIDESHOW_DELAY);
        }
    },

    stopSlideshow: function() {
        if (!this.fadeInProgress) {
            this.fadeInProgress = true;
            this.$lightbox.fadeOut('slow', function() {
                this.fadeInProgress = false;
                this.playInProgress = false;
                this.$lightboxPlay.toggleClass('pause', false);
                if (this.slideTimerId != null) {
                    this.timer.clearTimeout(this.slideTimerId);
                    this.slideTimerId = null;
                }
                this.upcomingPhoto = null;
            }.bind(this));
        }
    },

    advancePhoto: function() {
        if (this.playInProgress == true && this.photo.image_next_pid) {
            this.$lightboxForward.click();
        }
    },

    handleSaveAsComplete: function(result) {
        if (!result) {
             this.parentMode.showError("Download Error", "We are currently experiencing problems downloading this photo.  Please check your network connection and try again.", "Failed to download Photo.");
        }
        this.parentMode.$spinner.hide();
    },

    setNavButton: function($click_widget, $lightbox_widget, prefix) {
        var self = this;
        if (this.photo[prefix + 'pid']) {
            var $nav = $click_widget.find('.nav-thumb');
            var url = this.photo[prefix + 'url'];
            $click_widget.css('visibility', 'visible');
            $click_widget.find('.nav, .nav-link').unbind('click').bind('click', function (event) {
                this.$img.attr({src: '', alt:''});
                this.parentMode.showPhotoView(this.photo[prefix + 'pid'], this.photo.aid);
            }.bind(this));

            if (this.playInProgress == true) {
                $lightbox_widget.css('visibility', 'hidden');
            } else {
                $lightbox_widget.css('visibility', 'visible');
            }

            $nav.attr({src: '../img/spinner_white.apng'});
            self.parentMode.resizePhotos($nav, 41, 41, 60, 45);
            $nav.attr({
                src: url
            }).unbind('load').load(function () {
                $('<img/>')
                    .attr('src', $nav.attr('src'))
                    .load(function () {
                        $nav.data('true-width', this.width);
                        $nav.data('true-height', this.height);
                        self.parentMode.resizePhotos($nav, $nav.data('true-width'), $nav.data('true-height'), 60, 45);
                    });
            });
        } else {
            $lightbox_widget.css('visibility', 'hidden');
            $click_widget.css('visibility', 'hidden');
        }
    },

    setPhoto: function() {
        var self = this;
        if (this.$lightbox.is(':hidden')) {
            this.$img.attr({src: '../img/spinner_white.apng'});
            this.$lightboxPhoto.attr({src: '../img/spinner_white.apng'});
        }
        this.$img.attr({
            src: this.photo.url,
            alt: 'Detailed Photo'
        }).unbind('load').load(function () {
            $('<img/>')
                .attr('src', self.$img.attr('src'))
                .load(function () {
                    self.$img.css({
                        'max-height': this.height,
                        'max-width': this.width
                    });
                    self.$img.data('true-width', this.width);
                    self.$img.data('true-height', this.height);
                    self.$lightboxPhoto.data('true-width', this.width);
                    self.$lightboxPhoto.data('true-height', this.height);
                    if (self.$lightbox.is(':hidden')) {
                        self.$lightboxPhoto.attr({src: self.photo.url, alt: 'Lightbox photo'});
                        self.onResize();
                    } else {
                        self.$lightboxPhoto.fadeOut('slow', function() {
                            self.$lightboxPhoto.attr({src: self.photo.url, alt: 'Lightbox photo'});
                            self.onResize();
                            self.$lightboxPhoto.fadeIn('slow', function() {
                                if (self.playInProgress == true) {
                                    if (self.photo.image_next_pid == null) {
                                        self.$lightboxPlay.click();
                                    } else if (self.upcomingPhoto != self.photo.image_next_pid) {
                                        self.upcomingPhoto = self.photo.image_next_pid;
                                        self.slideTimerId = self.timer.setTimeout(function() {
                                            self.advancePhoto();
                                        }, self.SLIDESHOW_DELAY);
                                    }
                                }
                            });
                        });
                    }
                });
        });
    },

    setBreadcrumb: function(title) {
        var $breadcrumb = this.$root.find('#breadcrumbs').find('.current-breadcrumb').find('.breadcrumb-text');
        this.setDisplay($breadcrumb, title, 23, 'untitled');
    },

    setDisplay: function($display, displayString, maxChars, emptyString) {
        if (displayString.length == 0) {
            $display.text('[' + _T(emptyString) + ']');
        } else if (displayString.length <= maxChars) {
            $display.text(displayString);
        } else {
            $display.text(displayString.substring(0, maxChars) + "...");
        }
    },

    toggleEdit: function($display, $editButton, $input, edit) {
        $display.toggle(!edit);
        $editButton.toggle(!edit);
        $input.toggle(edit);  
    },

    setupEditable: function($display, $editButton, $input, isTitle, fieldName) {
        var emptyString = isTitle ? 'untitled' : 'no description',
            maxDisplay = isTitle ? 23 : 300;

        this.setDisplay($display, this.photo[fieldName], maxDisplay, emptyString);
        if (isTitle) {
            this.setBreadcrumb(this.photo[fieldName]);
        }

        if (this.readOnly) {
            $editButton.hide();
            $input.hide();
        } else {
            this.toggleEdit($display, $editButton, $input, false);

            $editButton.unbind();
            $editButton.bind('click', function() {
                this.toggleEdit($display, $editButton, $input, true);
                $input.val(this.photo[fieldName]).change;
                $input.focus();
            }.bind(this));

            $input.unbind();
            $input.keypress(function(e) {
                if (e.which == 13) {  // enter key
                    $input.blur();
                }
                if (e.keyCode == 27) {  // esc key
                    this.supressBlur = true;
                    $input.blur();
                    this.toggleEdit($display, $editButton, $input, false);
                }
            }.bind(this));

            $input.blur(function(e) {
                if (this.supressBlur == true) {
                    this.supressBlur = false;
                    return;
                }
                if ($input.val() != this.photo[fieldName]) {
                    if (isTitle) {
                        this.parentMode.editPhoto($input.val(), null, this.photo.pid, this.photo.aid);
                    } else {
                        this.parentMode.editPhoto(null, $input.val(), this.photo.pid, this.photo.aid);
                    }
                }
                this.toggleEdit($display, $editButton, $input, false);
            }.bind(this));
        }
    },

    updateAfterEdit: function(result, error) {
        if (error) {
            this.parentMode.showError("Edit Error", "We are currently experiencing problems editing your Photo.  Please check your network connection and try again.", "Failed to load photo list.");
            return;
        }
        this.photo.title = result.result.title;
        this.photo.caption = result.result.caption;
        this.setBreadcrumb(this.photo.title);
        this.setDisplay(this.$displayTitle, this.photo.title, 23, 'untitled');
        this.setDisplay(this.$displayDescription, this.photo.caption, 300, 'no description');
        this.parentMode.$spinner.hide();
    },

    updateAfterSettingThumbnail: function(result, error){
        if (error) {
            this.parentMode.showError("Edit Error", "We are currently experiencing problems setting Album thumbnail.  Please check your network connection and try again.", "Failed to load photo list.");
            return;
        }
        this.selectedAlbum.thumb = result.result.thumb;
        this.parentMode.$spinner.hide();
    }
}

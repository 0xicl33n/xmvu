function ManageRoomCard(args) {
    this.imvu = args.imvu;
    this.network = args.network;
    this.info = args.info || {};
    this.room = args.room;
    this.ourRoomInstance = null;


    this.$root = $(args.root);

    if (!this.imvu.call('isAdmin')) {
        this.$root.find('#room-shell-type #shell_type_cloned_label').hide();
        this.$root.find('#manage-room-field-block #manage-room-clone-id-entry').hide();
        this.$root.find('#manage-room-field-block #clone-id-label').hide();
    }

    /*
     * show our room clone option to users with our room
     */
    this.ourRoomInstance = this.imvu.call('getOurRoom');
    if (this.ourRoomInstance == '0') {
        this.$root.find('.manage-room-field-block #shell_type_our_room_label').remove();
    }

    this.sharedRooms = this.imvu.call('getSharedRooms');

    this.$root.find('#manage-room-cancel').click(this.onClickCancel.bind(this));
    this.$root.find('#manage-room-confirm').click(this.onClickConfirm.bind(this));

    this.$root.find('.has-hint-text').change(this.onChangeTextfield.bind(this));
    this.$root.find('.has-hint-text').focus(this.onGainFocusTextfield.bind(this));
    this.$root.find('.has-hint-text').blur(this.onLoseFocusTextfield.bind(this));

    this.$root.find('#manage-room-info-availability').mouseenter(this.onShowInfoForAvailability.bind(this));
    this.$root.find('#manage-room-info-moderators').mouseenter(this.onShowInfoForModerators.bind(this));
    this.$root.find('#manage-room-info-image').mouseenter(this.onShowInfoForImage.bind(this));
    this.$root.find('#manage-room-info-shell-type').mouseenter(this.onShowInfoForShellType.bind(this));
    this.$root.find('#manage-room-info-shell').mouseenter(this.onShowInfoForShell.bind(this));
    this.$root.find('#manage-room-info-restriction').mouseenter(this.onShowInfoForRestriction.bind(this));

    this.$root.find('.info-img').mouseleave(this.onHideInfo.bind(this));

    this.roomAvailabilityDropdown = new IMVU.Client.widget.DropDown({
        rootElement: this.$root.find('#manage-room-availability-dropdown')[0],
        items: [[_T('Public'), 2], [_T('Open'), 1], [_T('Closed'), 0]],
        selectedValue: 2,
        tickSize: {width: 10, height: 6},
        margin: 10,
    });

    var languageList = [];
    for(var key in this.info.languages) {
        languageList.push([this.info.languages[key], key]);
    }

    languageList.sort(function(a, b) {
        if (a[0] < b[0]) {
            return -1;
        }
        if (a[0] > b[0]) {
            return 1;
        }
        return 0;
    });

    languageList.unshift([_T('Unspecified'), '']);

    this.languageDropdown = new IMVU.Client.widget.DropDown({
        rootElement: this.$root.find('#manage-room-language-dropdown')[0],
        items: languageList,
        selectedValue: '',
        tickSize: {width: 10, height: 6},
        margin: 10,
    });
    var maxRoomUsersOptions = [["Set max number of users",0]];
    for( var i = 3; i < 11; i++) {
        maxRoomUsersOptions.push([ ""+i,i]);
    }
    this.maxUsersDropDown = new IMVU.Client.widget.DropDown({
        rootElement: this.$root.find('#manage-room-maxusers-dropdown')[0],
        items: maxRoomUsersOptions,
        tickSize: {width: 10, height: 6},
        margin: 10,
    });

    this.$roomNameField = $('#manage-room-name');
    this.$roomMaxUsersField = $('#manage-room-maxusers-dropdown select');
    this.$roomAvailabilityField = $('#manage-room-availability-dropdown select');
    this.$languages = this.$root.find('#manage-room-language-dropdown select');
    this.$roomDescriptionField = $('#manage-room-description');
    this.$roomModeratorsField = $('#manage-room-moderators');
    this.$roomAPField = $('#ap-checkbox');
    this.$roomVIPField = $('#vip-checkbox');
    this.$roomAVField = $('#av-checkbox');
    this.$roomNoGuestField = $('#noguest-checkbox');
    this.$roomFriendOnlyField = $('#friends-only-checkbox');
    this.$roomAPRemoveField = $('#manage-room-remove-ap');
    this.$shellCloneOurRoom =$('input:radio[name=manage-room-shell-type][value=clone_our_room]');

    this.$apLabel = this.$root.find('#ap-checkbox-label');
    this.is_ap = args.imvu.call('hasAccessPass');
    this.is_av = args.imvu.call('hasAccessPass');
    this.is_teen = args.imvu.call('isTeen');
    this.isAgeVerified = args.imvu.call('isAgeVerified');
    this.is_vip = args.imvu.call('hasVIPPass');
    this.is_guest = args.imvu.call('isGuest');
    this.$vipUpsell = $('span#vip-upsell');
    this.$vipUpsellBubble = this.$vipUpsell.find('.bubble');
    if(this.is_teen) { this.is_ap = false; }

    if(!this.is_ap) {
        this.$apLabel.hide();
        this.$roomAPRemoveField.hide();
    }
    if (!this.isAgeVerified) {
        this.$roomAVField.parent().hide();
    }

    this.$vipLabel = this.$root.find('#vip-checkbox-label');
    this.$friendsOnlyLabel = this.$root.find('#friends-only-checkbox-label');
    this.$noGuestsOnlyLabel = this.$root.find('#noguest-checkbox-label');

    if(!this.is_vip) {
        this.$vipLabel.hide();
        this.$roomFriendOnlyField.parent().css({
            'color': '#8F8B8A'
        });
        this.$roomFriendOnlyField.css('opacity',.5).prop('disabled', true);

        this.$vipUpsell.mouseenter(function (){
            this.$vipUpsellBubble.show();
        }.bind(this)).mouseleave(function () {
            this.$vipUpsellBubble.hide();
        }.bind(this));
    }

    if (this.is_guest) {
        this.$noGuestsOnlyLabel.hide();
    }

    this.$vipUpsell.find('.link').click(function() {
        this.imvu.call('showVipLandingWeb');
    }.bind(this));

    this.$vipUpsellBubble.hide();

    if($('#restrictions').children(':visible').length == 1) {
        $('#restrictions').hide();
    }

    this.$restrictionsBox = this.$root.find('#manage-room-restrictions-box');

    this.$roomShellImage = this.$root.find('#manage-room-shell-image');
    this.$roomShellImageContainer = this.$root.find('#manage-room-shell-image-container');

    this.roomShellLookupByPid = {};
    var roomShellList = [];
    for(var i in this.info.shells) {
        var shell = this.info.shells[i];
        if(!this.is_ap && shell.rating) continue;

        roomShellList.push([shell.name, shell.pid]);
        this.roomShellLookupByPid[shell.pid] = shell;
    }
    this.roomShellDropDown = this.createShellDropdown('#manage-room-select-shell-dropdown', roomShellList);
    this.$roomShells = this.$root.find('#manage-room-select-shell-dropdown select');
    this.$roomShells.bind('change', this.handleRoomShellChange.bind(this));

    this.furnishedRoomLookupByPid = {};
    for(var i in this.info.furnished_rooms) {
        var froom = this.info.furnished_rooms[i];
        if(!this.is_ap && froom.rating) continue;

        this.furnishedRoomLookupByPid[froom.room_pid] = froom;
    }

    if(this.sharedRooms && this.sharedRooms.length) {
        var sharedRoomList = [];
        _.each(this.sharedRooms, function(room) {
            sharedRoomList.push([room.name, room.id]);
        });

        this.sharedRoomDropdown = this.createShellDropdown('#manage-room-select-shared-room-dropdown', sharedRoomList);
        this.$sharedRooms = this.$root.find('#manage-room-select-shared-room-dropdown select');
        this.$sharedRooms.bind('change', this.handleSharedRoomChange.bind(this));
    }
    else {
        this.$root.find('.manage-room-field-block #shell_type_shared_room_label').remove();
    }


    // HACK: hand-craft the entry in the dropdown -- mchunlum
    if (this.ourRoomInstance != '0') {
        this.ourRoomDropdown = this.createShellDropdown('#manage-room-select-our-room-dropdown', [['Our Room', this.ourRoomInstance]]);
        this.$ourRoom = this.$root.find('#manage-room-select-our-room-dropdown select');
        ellipsize($('manage-room-select-our-room-dropdown .label'));
        this.$ourRoom.bind('change', this.handleOurRoomShellChange.bind(this));
    }

    this.$root.find('#manage-room-select-room-dropdown').hide();

    this.$root.find('#shell_type_stock').bind('change', function() {
        this.$root.find('#manage-room-select-room-dropdown').hide();
        this.$root.find('#manage-room-select-our-room-dropdown').hide();
        this.$root.find('#manage-room-select-shared-room-dropdown').hide();
        this.$root.find('#manage-room-clone-id-entry').hide();
        this.$root.find('.manage-room-field-block #clone-id-label').hide();
        this.$root.find('#manage-room-select-shell-dropdown').show();
        this.$root.find('#manage-room-shell-image').show();
        this.$root.find('#manage-room-shell-image-container').show();
        this.$root.find('.remove_furniture_block').show();
        this.roomShellDropDown.refreshLabel();
        this.$roomShells.change();
    }.bind(this));
    this.$root.find('#shell_type_stock').prop('checked', true).change();

    this.$root.find('#shell_type_our_room').bind('change', function() {
        this.$root.find('#manage-room-select-shell-dropdown').hide();
        this.$root.find('#manage-room-select-room-dropdown').hide();
        this.$root.find('#manage-room-select-shared-room-dropdown').hide();
        this.$root.find('#manage-room-select-our-room-dropdown').show();
        this.$roomShellImage.attr('src', ''); // TODO: our room doesn't have an image for now
        this.$root.find('#manage-room-shell-image').show();
        this.$root.find('#manage-room-shell-image-container').show();
        this.$root.find('#manage-room-clone-id-entry').hide();
        this.$root.find('.manage-room-field-block #clone-id-label').hide();
        this.$root.find('.remove_furniture_block').hide();
        this.ourRoomDropdown.refreshLabel();
        this.$ourRoom.change();
    }.bind(this));

    this.$root.find('#shell_type_shared_room').bind('change', function() {
        this.$root.find('#manage-room-select-shell-dropdown').hide();
        this.$root.find('#manage-room-select-room-dropdown').hide();
        this.$root.find('#manage-room-select-our-room-dropdown').hide();
        this.$root.find('#manage-room-select-shared-room-dropdown').show();
        this.$root.find('#manage-room-shell-image').show();
        this.$root.find('#manage-room-shell-image-container').show();
        this.$root.find('#manage-room-clone-id-entry').hide();
        this.$root.find('.manage-room-field-block #clone-id-label').hide();
        this.$root.find('.remove_furniture_block').hide();
        this.sharedRoomDropdown.refreshLabel();
        this.$sharedRooms.change();
    }.bind(this));

    this.$root.find('#shell_type_cloned').bind('change', function() {
        this.$root.find('#manage-room-select-shell-dropdown').hide();
        this.$root.find('#manage-room-shell-image-container').hide();
        this.$root.find('#manage-room-select-room-dropdown').hide();
        this.$root.find('#manage-room-select-shared-room-dropdown').hide();
        this.$root.find('#manage-room-select-our-room-dropdown').hide();
        this.$root.find('#manage-room-clone-id-entry').show();
        this.$root.find('.manage-room-field-block #clone-id-label').show();
        this.$root.find('#manage-room-shell-image').hide();
        this.$root.find('.remove_furniture_block').hide();
    }.bind(this));

    var roomImageList = [[_T("Select from your gallery..."), ""]];
    for(var i in this.info.gallery) {
        var image = this.info.gallery[i];
        if(image.title) {
            roomImageList.push([image.title, image.url.replace("-akm.", ".")]);
        } else {
            roomImageList.push([image.filename, image.url.replace("-akm.", ".")]);
        }
    }

    this.$roomImagePreview = this.$root.find('#manage-room-image');
    this.$roomImages = this.$root.find('#manage-room-select-image-dropdown select');

    //Populate room image dropdown
    for each (image in roomImageList) {
        var $option = $('<option>');
        $option.text(image[0]);
        $option.attr('value', image[1]);
        this.$roomImages.append($option);
    }
    this.setupRoomImageDropDown();

    this.$roomUrlBlock = this.$root.find('#manage-room-url-block');
    this.$roomUrl = this.$root.find('#manage-room-url');
    this.$roomUrl.bind('click', function() {

    }.bind(this));

    this.buttonCancel = new ImvuButton($('#manage-room-cancel'), {usenewvisdbuttons:true, red: true,'grey': true});
    this.buttonConfirm = new ImvuButton($('#manage-room-confirm'), {usenewvisdbuttons:true, red: true});
    //Hack to prevent phantom line on confirm button
    $(document).ready(function () {
        this.buttonConfirm.$element.width(this.buttonConfirm.$element.outerWidth());
    }.bind(this));

    if(this.room) {
        this.mode = 'edit';
        this.room_instance_id = this.room.room_instance_id;

        this.$root.find('.manage-room-header .title').text('Manage My Chat Room');
        this.$roomNameField.val(this.room.name).change();
        this.maxUsersDropDown.selectByValue(this.room.max_users);
        this.$roomMaxUsersField.change();
        this.roomAvailabilityDropdown.selectByValue(this.room.open);
        this.$roomAvailabilityField.change();
        this.$roomDescriptionField.val(this.room.description).change();
        this.$roomModeratorsField.val(this.room.lieutenants).change();
        this.$roomUrl.text(this.room.url);
        this.setLanguageByFullName(this.room.language);
        this.roomShellDropDown.selectByValue(this.room.room_pid);
        this.$roomShells.change();
        this.$roomImages.selectBox('value',this.room.image_url);
        this.$roomImagePreview.html('<img src="' + this.$roomImages.val() + '">');
        this.$root.find('.remove_furniture_block').hide();
        ellipsize($('.selectBox-label'), 175 /*pixels wide*/);
        this.$roomImages.change();
        this.$roomUrlBlock.show();
        this.buttonConfirm.$element.find('.text').text('Save');
        if (this.room.is_vip) {
            this.$roomVIPField.prop('checked', true);
        }

        if (this.room.is_ap) {
            this.$roomAPField.prop('checked', true);
        }

        if (this.room.is_age_verified_only) {
            this.$roomAVField.prop('checked', true);
        }

        if (this.room.is_non_guest_only) {
            this.$roomNoGuestField.prop('checked', true);
        }

        if (this.room.is_friends_only) {
            this.$roomFriendOnlyField.prop('checked', true);
        }
        //TODO: do what is done in the last two lines for AV,GuestOnly, and FriendOnly --Hayden

        this.$root.find('#room-shell-type').hide();
        this.$root.find('#room-shell').hide();
    } else {
        this.mode = 'create';
        this.room_instance_id = 0;

        this.$roomUrlBlock.hide();
        this.$roomShells.change();
    }

    if (this.info.hasOwnProperty("sharedRoomToSelect")) {
        this.sharedRoomDropdown.selectByValue(this.info.sharedRoomToSelect);
        this.$root.find('#shell_type_shared_room').prop("checked", true).change();
    }

    this.$errorBox = $('#manage-room-error-box');
    this.$errorList = $('#manage-room-errors');

    this.$spinner = $('#manage-room-card-spinner');

    this.requiredFields = [$('#manage-room-name'), $('#manage-room-maxusers-dropdown select'), $('#manage-room-availability'), $('input:radio[name=manage-room-shell-type]'), $('#manage-room-select-room')];
    for(var i in this.requiredFields) {
        this.requiredFields[i].bind('change', this.updateConfirmButtonState.bind(this));
    }
    this.updateConfirmButtonState();

    this.errorFields = {
        '99': '.manage-room-field-block:has(#manage-room-name)',
        '1': '.manage-room-field-block:has(#manage-room-name)',
        '2': '.manage-room-field-block:has(#manage-room-shell-image-container)',
        '3': '#ap-checkbox-label',
        '4': '#vip-checkbox-label',
        '5': '.manage-room-field-block:has(#manage-room-language-dropdown)',
        '6': '.manage-room-field-block:has(#manage-room-maxusers)',
        '7': '.manage-room-field-block:has(#manage-room-availability-dropdown)',
        '8': '.manage-room-field-block:has(#manage-room-shell-image-container)'
    };

    this.updateDialogDimensions();
    this.addBindEvents();
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

ManageRoomCard.prototype = {
    addBindEvents: function() {
        if (this.mode !== 'edit' ||
            !this.imvu.call('shouldShowThemedRoomSubmissions') ||
            !(this.room['themed_status'] === 'submitted' || this.room['themed_status'] === 'themed')) {
            return;
        }

        this.input_selectors = [this.$roomAvailabilityField,
                         this.$roomAPField,
                         this.$roomVIPField,
                         this.$roomAVField,
                         this.$roomNoGuestField,
                         this.$roomFriendOnlyField,
                         this.$roomAPRemoveField,
                         this.$roomMaxUsersField,
                         this.$roomShells,
                         this.$languages,
                         this.$roomImages];

        this.text_selectors = [this.$roomNameField,
                               this.$roomDescriptionField,
                               this.$roomModeratorsField];

        var toggleFooterWarning = this.toggleFooterWarning.bind(this);
        _.each(this.input_selectors, function(element) {
            element.bind('change', toggleFooterWarning);
        });

        _.each(this.text_selectors, function(element) {
            element.keyup(toggleFooterWarning);
        });
    },

    setupRoomImageDropDown: function() {
        this.$roomImages.selectBox()
        this.$roomSelectLabel = $('#manage-room-select-image-dropdown');
        this.$rightColumn = $('.manage-room-column-right');
        this.$selectBoxControl = this.$roomImages.data('selectBox-control');
        this.$selectOptions = this.$selectBoxControl.data('selectBox-options');
        this.$selectBoxLabel = this.$roomSelectLabel.find('.selectBox-label')

        this.$roomImages.selectBox().bind('open', function(e) {
            this.$selectOptions.hide();
            //Setup the carrot
            this.dropdownControlWidth = this.dropdownControlWidth || this.$roomSelectLabel.outerWidth();
            $carrotImage = $('<img>').attr('src', '../img/carrot.png');
            $carrotImage.attr('id','carrot');
            $carrotImage.css({
                position: "absolute",
                left: this.$roomSelectLabel.offset().left+this.dropdownControlWidth+13,
                top: this.$roomSelectLabel.offset().top+this.$roomSelectLabel.height()/2-10
            });
            $('body').append($carrotImage);


            var optionsTopPadding = 5;
            var optionsStyle =  {};
            var carrotImageWidth = 24; //This value is being hardcoded to handle the case where the
                                       //carrot image doesn't load in time causing it's width to be 0
            optionsStyle.left = $carrotImage.offset().left+carrotImageWidth-1;
            optionsStyle.width = this.$rightColumn.width();
            optionsStyle["max-height"] = this.$selectBoxControl.offset().top;
            optionsStyle["max-height"] += this.$selectBoxControl.outerHeight();
            optionsStyle["max-height"] -= (this.$rightColumn.offset().top + optionsTopPadding);
            this.$selectOptions.css(optionsStyle);

            optionsStyle =  {};
            optionsStyle.top = this.$selectBoxControl.offset().top + this.$selectBoxControl.outerHeight();
            optionsStyle.top += parseInt(this.$rightColumn.css('padding-top'));
            optionsStyle.top += optionsTopPadding;
            optionsStyle.top -= this.$selectOptions.outerHeight();
            this.$selectOptions.css(optionsStyle);
            this.$selectOptions.show();
        }.bind(this)).bind('close',function(e) {
            $('#carrot').remove();
            ellipsize(this.$selectBoxLabel, 175 /*pixels wide*/);
            var previewUrl = $(e.target).val();
            if(previewUrl == '') {
                this.$roomImagePreview.text("No Image Yet");
            } else {
                this.$roomImagePreview.html('<img src="' + previewUrl + '">');
            }
        }.bind(this));

        var card = this;
        $('.selectBox-options li a').each( function(index) {
            ellipsize($(this), 200);
        });
        $('.selectBox-options li a').hover( function(e) {
            var previewUrl = $(e.target).attr('rel');
            if(previewUrl == '') {
                this.$roomImagePreview.text("No Image Yet");
            } else {
                this.$roomImagePreview.html('<img src="' + previewUrl + '">');
            }
        }.bind(this));

        this.$roomSelectLabel.find('.selectBox-arrow').remove();
        this.$roomSelectLabel.find('.selectBox').css('width', '100%');
        this.$roomSelectLabel.find('.selectBox-label').css({
            width: 'auto',
            'padding-top': 5
        });
        var $canvas = $('<canvas>');
        $canvas.attr('height', this.$roomSelectLabel.height());
        $canvas.attr('width', this.$roomSelectLabel.width());
        $canvas.css({
            'z-index': 1,
            top: 0,
            left:0
        });
        var ctx = $canvas[0].getContext('2d');
        ctx.fillStyle = "#DDDDDD";
        new IMVU.Client.widget.Arrow({root: this.$roomSelectLabel, align: 'right', size: {width: 10, height: 6}, margin: 13});

        this.$roomSelectLabel.append($canvas);

    },

    createShellDropdown: function(selector, list) {
        return new IMVU.Client.widget.DropDown({
            rootElement: this.$root.find(selector)[0],
            items: list,
            tickSize: {width: 10, height: 6},
            margin: 10,
        });
    },

    handleRoomShellChange: function() {
        var pid = this.$roomShells.val();
        var shell = this.roomShellLookupByPid[pid];
        if (shell) {
            var checkbox = this.$apLabel.find('input');

            this.$roomShellImage.attr('src', '');
            this.$roomShellImage.attr('src', shell.image);
            this.$roomShellImageContainer.removeClass('ap');
            var text = $('#manage-room-select-shell-dropdown .label').text();


            $label = $('#manage-room-select-shell-dropdown .label');

            ellipsize($label);

            if (typeof this.apUpsellChecked === 'undefined') {
                this.apUpsellChecked = checkbox.is(':checked');
                console.log(this.apUpsellChecked);
            }

            var furnishedShell = this.furnishedRoomLookupByPid[pid];

            this.$root.find('.remove_furniture_block').css({'visibility': furnishedShell ? 'visible' : 'hidden'});

            var rating = furnishedShell ? furnishedShell.rating : shell.rating;
            if (shell.rating) {
                this.$roomShellImageContainer.addClass('ap');
                //Save the previous checkbox
                if(!checkbox.is(':disabled')) { //Protect against multiple disables
                    this.apUpsellChecked = checkbox.is(':checked');
                }
                checkbox.prop('disabled', true);
                checkbox.prop('checked', true);
            }
            else {
                checkbox.prop('disabled', false);
                console.log('restoring');
                checkbox.prop('checked', this.apUpsellChecked);
            }
        }
    },

    handleOurRoomShellChange: function() {
        this.$roomShellImage.attr('src', '');
        this.$roomShellImage.attr('src', this.info.our_room_pid_image);
    },

    handleSharedRoomChange: function() {
        var instanceId = this.$sharedRooms.val();
        var sharedRoomInfo = _.find(this.sharedRooms, function(room) { return room.id === instanceId; });

        if (sharedRoomInfo) {
            var checkbox = this.$apLabel.find('input');

            this.$roomShellImage.attr('src', '');
            this.$roomShellImage.attr('src', sharedRoomInfo.image_url);

            $label = $('#manage-room-select-shared-room-dropdown .label');
            ellipsize($label);
        }
    },

    setLanguageByFullName: function(name) {
        var $opts = this.$languages.children();
        for(var i = 0; i < $opts.length; i++) {
            var $opt = $($opts[i]);
            if($opt.text() == name) {
                this.languageDropdown.selectByValue($opt.val());
                break;
            }
        }
    },

    updateConfirmButtonState: function() {
        var old_state = this.buttonConfirm.isEnabled();
        var new_state = this.checkForRequiredFields();

        if(old_state != new_state) {
            if(new_state) this.buttonConfirm.enable();
            else this.buttonConfirm.disable();
        }
    },

    checkForRequiredFields: function() {
        var $filled = true;
        if(!this.$roomNameField.val()) $filled = false;
        if(this.$roomMaxUsersField.val() == 0) $filled = false;
        if(!this.$roomAvailabilityField.val()) $filled = false;
        if(this.mode == 'create') {
            if(!$('input:radio[name=manage-room-shell-type]:checked').val()) $filled = false;
            if(!this.$roomShells.val()) $filled = false;
        }
        return $filled;
    },
    generateTooltipText: function(tip_text_blocks) {
        var first_element = true;
        var tip_text = "";
        for( index in tip_text_blocks) {
            $('<span></span>').text(tip_text_blocks[index]).addClass()
            if(!first_element) tip_text += "<br><br>";
            tip_text += tip_text_blocks[index];
            first_element = false;
        }
        return tip_text;
    },
    showTooltip: function(info_image, orientation, tip_text_blocks) {
        var help_icon = $(info_image);
        var tooltip = $('#manage-room-info-block');
        var uparrow = tooltip.find('.info-arrow-up');
        var downarrow = tooltip.find('.info-arrow-down');
        var leftarrow = tooltip.find('.info-arrow-left');
        var offset = help_icon.offset();
        offset.left += help_icon.width()/2;
        offset.top += help_icon.height()/2;

        var tip_text = this.generateTooltipText(tip_text_blocks);

        leftarrow.css('visibility', orientation == 'left' ? 'visible' : 'hidden');
        uparrow.css('visibility', orientation == 'up' ? 'visible' : 'hidden');
        downarrow.css('visibility', orientation == 'down' ? 'visible' : 'hidden');
        tooltip.find('.info-box').html(tip_text);
        tooltip.css('visibility', 'visible');

        if (orientation == 'left') {
            tooltip.css('top', Math.min(offset.top - tooltip.height()/2, this.$root.width() - tooltip.width()));
            tooltip.css('left', offset.left + help_icon.width() + uparrow.width());
            leftarrow.css('top', offset.top - tooltip.offset().top - uparrow.height()/2);
        } else if (orientation == 'up') {
            tooltip.css('top', offset.top + help_icon.height() + uparrow.height());
            tooltip.css('left', Math.min(offset.left - tooltip.width()/2, this.$root.width() - tooltip.width()));
            uparrow.css('left', offset.left - tooltip.offset().left - uparrow.width()/2);
        } else if (orientation == 'down') {
            tooltip.css('top', offset.top - (tooltip.height() + help_icon.height() + downarrow.height()));
            var tooltip_left = Math.min(offset.left - tooltip.width()/2, this.$root.width() - tooltip.width());
            if(tooltip_left < 25) tooltip_left = 25;
            tooltip.css('left', tooltip_left);
            downarrow.css('left', offset.left - tooltip.offset().left - downarrow.width()/2);
            downarrow.css('top', offset.top - tooltip.offset().top - help_icon.height() - downarrow.height() - 1);
        }
    },

    onClickCancel: function() {
        this.imvu.call('endDialog', false);
    },

    onClickConfirm: function() {
        this.doSubmit();
    },

    toggleFooterWarning: function() {
        if (this.mode !== 'edit') {
            return;
        }

        var $checkbox = $('.checkbox-wrapper input');
        // critical values
        if (this.room['open'] !== this.$roomAvailabilityField.val() + "" ||
            !!this.room['is_ap'] !== this.$roomAPField.is(':checked') ||
            !!this.room['is_vip'] !== this.$roomVIPField.is(':checked') ||
            !!this.room['is_age_verified_only'] !== this.$roomAVField.is(':checked') ||
            !!this.room['is_non_guest_only'] !== this.$roomNoGuestField.is(':checked') ||
            !!this.room['is_friends_only'] !== this.$roomFriendOnlyField.is(':checked') ||
            this.room['allow_ap_products'] !== this.$roomAPRemoveField.find('input').is(':checked')
        ) {
            $('.checkbox-wrapper input').hide();
            $('#message-with-checkbox span').hide();
            $('#message-without-checkbox span').show();
            return;
        } else {
            $('#message-without-checkbox span').hide();
        }

        // non-critical values
        if (this.room['name'] !== this.$roomNameField.val() ||
            this.room['description'] !== this.$roomDescriptionField.val() ||
            this.room['max_users'] !== this.$roomMaxUsersField.val() ||
            this.room['lieutenants'] !== this.$roomModeratorsField.val() ||
            this.room['image_url'] !== this.$roomImages.val()
        ) {
            if(!$checkbox.is(':visible')) {
                $checkbox.prop('checked', true);
            }
            $checkbox.show();
            $('#message-with-checkbox span').css('display', 'inline-block');
            return;
        } else {
            $('.checkbox-wrapper input').hide();
            $('#message-with-checkbox span').hide();
        }
    },

    doSubmit: function() {
        if (
            this.mode === 'edit' &&
            this.room['themed_status'] === 'themed' &&
           (this.room['description'] !== this.$roomDescriptionField.val() ||
            parseInt(this.room['open'], 10) !== parseInt(this.$roomAvailabilityField.val(), 10) ||
            this.room['name'] !== this.$roomNameField.val())) {
            var result = this.imvu.call(
                'showAlertDialog',
                _T("Warning: This is a Themed room!"),
                _T("Are you sure you want to remove this room from being listed in Themes? You will have to resubmit which can take several weeks for approval."),
                [{name:'Cancel', grey:true, value: false}, {name: "Yes I'm Sure", value: true, yellow: true}]
            );
            if (result && !result.result) {
                this.imvu.call('endDialog', false);
            }
        }

        if(this.checkForRequiredFields()) {
            this.buttonConfirm.disable();
            this.showSpinner();

            var room_instance_id = this.room_instance_id;
            var create_type = this.$root.find('input:radio[name=manage-room-shell-type]:checked').val();
            var pid = this.$roomShells.val();

            if (this.mode !== 'edit') {
                if (this.$root.find('input:radio[name=manage-room-shell-type][value=admin_slurp]').is(':checked')){
                    room_instance_id = this.$root.find('#manage-room-clone-id-entry').val();
                }
                else if (this.$root.find('input:radio[name=manage-room-shell-type][value=clone_our_room]').is(':checked')){
                    room_instance_id = this.ourRoomInstance;
                    pid = 0;
                }
                else if (this.$root.find('input:radio[name=manage-room-shell-type][value=clone_shared_room]').is(':checked')){
                    room_instance_id = this.$sharedRooms.val();
                    pid = 0;
                }

                if (this.furnishedRoomLookupByPid[pid] && !this.$root.find('#remove_furniture').is(':checked')) {
                    create_type = 'furnished_shell';
                    room_instance_id = this.furnishedRoomLookupByPid[pid].room_instance_id;
                }
            }

            var post_data = {
                action: this.mode,
                room_instance_id: room_instance_id,
                room_name: this.$roomNameField.val(),
                room_description: this.$roomDescriptionField.val(),
                max_users: this.$roomMaxUsersField.val(),
                permissions: this.$roomAvailabilityField.val(),
                create_type: create_type,
                room_pid: pid,
                language: this.$languages.val(),
                lieutenants: this.$roomModeratorsField.val(),
                ap: this.$roomAPField.is(':checked'),
                vip: this.$roomVIPField.is(':checked'),
                av: this.$roomAVField.is(':checked'),
                noguest: this.$roomNoGuestField.is(':checked'),
                friendsonly: this.$roomFriendOnlyField.is(':checked'),
                image: this.$roomImages.val(),
                remove_ap: this.$roomAPRemoveField.find('input').is(':checked'),
                resubmit_themed_room: $('.message-wrapper .checkbox-wrapper input').is(':checked')
            };

            serviceRequest({
                method: 'POST',
                uri: IMVU.SERVICE_DOMAIN + '/api/room_management.php',
                data: post_data,
                network: this.network,
                imvu: this.imvu,
                callback: this.saveCallback.bind(this)
            });
        }
    },

    saveCallback: function(result, error) {
        if (error || !result) {
            this.imvu.call('showErrorDialog', _T("Manage Error"), _T("We are currently experiencing problems saving your chat room information.  Please check your network connection and try again."));
            console.log("Failed to save room info.");
            return;
        }

        if (result.errors && result.errors.length > 0) {
            this.showErrors(result.errors);
            this.buttonConfirm.enable();
            this.hideSpinner();
        } else {
            this.imvu.call('endDialog', result.result);
        }
    },

    showErrors: function(errors) {
        this.$errorBox.show();
        this.$errorList.empty();
        $('.error-highlight').removeClass('error-highlight');

        for(var i in errors) {
            for(var k in errors[i]) {
                var li = $('<li></li>');
                li.html(errors[i][k]);
                this.$errorList.append(li);

                var fieldCode = Math.floor(k/100);
                if(this.errorFields[fieldCode]) {
                    $(this.errorFields[fieldCode]).addClass('error-highlight');
                }
            }
        }
    },

    onChangeTextfield: function(event) {
        var field = $(event.target);
        field.parent().toggleClass('has-text', field.val() != '');
    },

    onGainFocusTextfield: function(event) {
        var parent = $(event.target).parent();
        parent.addClass('focused');
    },

    onLoseFocusTextfield: function(event) {
        var parent = $(event.target).parent();
        parent.removeClass('focused');
    },

    onShowInfoForAvailability: function() {
        this.showTooltip(
            '#manage-room-info-availability',
            'down',
            [_T("Public (Listed): The room is searchable and available for anyone to join."),
            _T("Open (Unlisted): The room is not searchable. A Room URL is needed to join."),
            _T("Closed: The room is not searchable and no one can join (even the Owner).")]);
    },

    onShowInfoForModerators: function() {
        this.showTooltip(
            '#manage-room-info-moderators',
            'down',
            [_T("Assign one or more room moderators by entering their avatar names separated by commas."),
            _T("Room moderators can boot people from the room.")]);
    },

    onShowInfoForImage: function() {
        this.showTooltip(
            '#manage-room-info-image',
            'down',
            [_T("Select an image from your picture gallery to be your room's display icon."),
            _T("Default will be a blank image.")]);
    },

    onShowInfoForShellType: function() {
        var tip_text_blocks =
            [_T("Select the type of room to start.")];

        if(this.ourRoomInstance != '0') {
            tip_text_blocks.push(_T("Our Room: Your partner can decorate and moderate this room"));
        }

        if(this.sharedRooms && this.sharedRooms.length) {
            tip_text_blocks.push(_T("Shared Room: Your partner can decorate and moderate this room"));
        }

        this.showTooltip(
            '#manage-room-info-shell-type',
            'up',
            tip_text_blocks);
    },
    onShowInfoForShell: function() {
        this.showTooltip(
            '#manage-room-info-shell',
            'up',
            [_T("Select one of the rooms from your collection. ")]);
    },

    onShowInfoForRestriction: function() {
        var tip_text_blocks = [_T("Select who can participate in your room.")];
        if(this.is_ap) {
            tip_text_blocks.push(_T("Require Access Pass: Only AP members can join your room."));
        }
        if(this.is_vip) {
            tip_text_blocks.push(_T("Require VIP:  Only VIP members can join your room."));
        }

        if(!this.is_guest) {
            tip_text_blocks.push(_T("No guest users: Only users who are") + " <i>" + _T("not") + "</i> " + _T("guests can join the room."));
        }

        if(this.is_vip) {
            tip_text_blocks.push(_T("Friends only: Only your friends can join the room"));
        }

        if (this.isAgeVerified) {
            tip_text_blocks.push(_T("Age Verified: Only age verified adults can join the room"));
        }
        this.showTooltip(
            '#manage-room-info-restriction',
            'down',
            tip_text_blocks);
    },

    onHideInfo: function(event) {
        var tooltip = $('#manage-room-info-block');
        tooltip.find('.info-arrow-left').css('visibility', 'inherit');
        tooltip.find('.info-arrow-up').css('visibility', 'inherit');
        tooltip.find('.info-arrow-down').css('visibility', 'inherit');
        tooltip.css('visibility', 'hidden');
        $('.manage-room-info-modal').hide();
    },

    toggleSpinner: function() {
        this.$spinner.toggle();
    },

    showSpinner: function() {
        this.$spinner.show();
    },

    hideSpinner: function() {
        this.$spinner.hide();
    },

    updateDialogDimensions: function() {
        console.log('resizing');
        var bodyHeight = $('.manage-room-body').height();
        var cardHeight = $('.manage-room-card').height();
        var windowHeight = $(window).height();
        var bodyHeight = bodyHeight + (windowHeight-cardHeight);
        $('.manage-room-body').height(bodyHeight);

    }
}

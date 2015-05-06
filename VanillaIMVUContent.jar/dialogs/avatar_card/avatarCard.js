var states = {};
states[_T("Alabama")] = "AL";
states[_T("Alaska")] = "AK";
states[_T("Arizona")] = "AZ";
states[_T("Arkansas")] = "AR";
states[_T("California")] = "CA";
states[_T("Colorado")] = "CO";
states[_T("Connecticut")] = "CT";
states[_T("District of Columbia")] = "DC";
states[_T("Delaware")] = "DE";
states[_T("Florida")] = "FL";
states[_T("Georgia")] = "GA";
states[_T("Hawaii")] = "HI";
states[_T("Idaho")] = "ID";
states[_T("Illinois")] = "IL";
states[_T("Indiana")] = "IN";
states[_T("Iowa")] = "IA";
states[_T("Kansas")] = "KS";
states[_T("Kentucky")] = "KY";
states[_T("Louisiana")] = "LA";
states[_T("Maine")] = "ME";
states[_T("Maryland")] = "MD";
states[_T("Massachusetts")] = "MA";
states[_T("Michigan")] = "MI";
states[_T("Minnesota")] = "MN";
states[_T("Mississippi")] = "MS";
states[_T("Missouri")] = "MO";
states[_T("Montana")] = "MT";
states[_T("Nebraska")] = "NE";
states[_T("Nevada")] = "NV";
states[_T("New Hampshire")] = "NH";
states[_T("New Jersey")] = "NJ";
states[_T("New Mexico")] = "NM";
states[_T("New York")] = "NY";
states[_T("North Carolina")] = "NC";
states[_T("North Dakota")] = "ND";
states[_T("Ohio")] = "OH";
states[_T("Oklahoma")] = "OK";
states[_T("Oregon")] = "OR";
states[_T("Pennsylvania")] = "PA";
states[_T("Rhode Island")] = "RI";
states[_T("South Carolina")] = "SC";
states[_T("South Dakota")] = "SD";
states[_T("Tennessee")] = "TN";
states[_T("Texas")] = "TX";
states[_T("Utah")] = "UT";
states[_T("Vermont")] = "VT";
states[_T("Virginia")] = "VA";
states[_T("Washington")] = "WA";
states[_T("West Virginia")] = "WV";
states[_T("Wisconsin")] = "WI";
states[_T("Wyoming")] = "WY";
IMVU.HARDCODED_US_STATES = states;
delete states;

IMVU.Client.AvatarCard = function (spec) {
    var dialogInfo = spec.dialogInfo;

    this.rootElement = spec.rootElement || rootElementRequired;

    var find = function (css) {
        return this.rootElement.querySelector(css);
    }.bind(this);

    this.elDialog = find('#dialog');
    this.elOtherInfo = this.elDialog.querySelector('#bd > #content_info > .bd > #avinfo > #otherinfo');
    this.elAvInfo = this.elDialog.querySelector('#bd > #content_info > .bd > #avinfo');
    this.elStaffIcon = find('#staff-icon');
    this.elVipIcon = find('#vip-icon');
    this.elApIcon = find('#ap-icon');
    this.elMarriedIcon = find('#married-icon');
    this.elMarriedToLine = find('#married-to-line');
    this.elMarriedToLink = find('#married-to-link');
    this.elTagline = find('#tagline');
    this.elTaglineInput = find('#tagline-input');
    this.elYearsAtIMVU = find('#years-at-imvu');
    this.elYearsAtIMVUValue = find('#years-at-imvu #years-at');
    this.elYearsAtIMVULabel = find('#years-at-imvu #years-at-label');
    this.elInterests = find('#interests');
    this.elInterestTags = find('#interest-tags');
    this.elInterestTextarea = find('#interest-textarea');
    this.elInterestsLabel = find('#interests-label');
    this.elInterestCharacterCountText = find('#interests > .info > .sublabel');
    this.elNowAt = find('#now-at');
    this.elNowAtLink = find('#now-at-link');
    this.elBuddyIcon = find('#buddy-icon');
    this.elLocationDropdown = find('#location-dropdown');
    this.elLocationName = find('#location-name');
    this.elLocationNameTip = find('#location-name-tip');
    this.elLocationFlag = find('#location-flag');
    this.elLocation = find('#location');
    this.elAffinity = find('#affinity');
    this.elAffinityLabel = find('#affinity-label');
    this.elAffinityDrinking = find('#affinity-drinking');
    this.elAffinitySmoking = find('#affinity-smoking');
    this.elMemberSince = find('#member-since');
    this.elMemberInfo = find('#member-info');
    this.elLastOnline = find('#last-online');
    this.elAvpic = find('#avpic');
    this.elAvname = find('#avname');
    this.elAge = find('#age');
    this.elGender = find('#gender');
    this.elGenderAgeDivider = find('#gender-age-divider');
    this.elBadgeCount = find('#badge-count');
    this.elBadgeArea = find('#badge-area');
    this.elBadges = find('#badges');
    this.elAgeverifyIcon = find('#ageverify-icon');
    this.elRelationship = find('#relationship');
    this.elOrientation = find('#orientation');
    this.elLookingFor = find('#looking_for');
    this.elDrinking = find('#drinking');
    this.elSmoking = find('#smoking');
    this.elRelationshipDropdown = find('#relationship-dropdown');
    this.elOrientationDropdown = find('#orientation-dropdown');
    this.elLookingForDropdown = find('#looking_for-dropdown');
    this.elDrinkingDropdown = find('#drinking-dropdown');
    this.elSmokingDropdown = find('#smoking-dropdown');
    this.elThrobber = find('#throbber');
    this.elAvailability = find('#availability');
    this.elAvatarPopupOnline = find('#avatar-popup-online');
    this.elAvatarPopupOffline = find('#avatar-popup-offline');
    this.elAvatarPopupCreating = find('#avatar-popup-creating');
    this.elChatButton = find('#invite-to-chat');
    this.elMessageButton = find('#send-message');
    this.elGiftButton = find('#gift');
    this.elMyShop = find('#my_shop');
    this.elWelcomeModIcon = find('#welcome-mod-icon');

    this.elWebProfileLink = find('#webprofile');
    this.elWebProfileTip = find('#webprofileTip');
    this.elWebProfileShow = true;

    this.elPhotosLink = find('#photos');
    this.elPhotosTip = find('#photosTip');
    this.elPhotosShow = true;

    this.elShopLink = find('#shop');
    this.elShopTip = find('#shopTip');
    this.elShopShow = true;

    this.elMessageLink = find('#message');
    this.elMessageTip = find('#messageTip');
    this.elMessageShow = true;

    this.elAddFriendLink = find('#add-friend');
    this.elAddFriendTip = find('#add-friendTip');
    this.elAddFriendShow = true;

    this.elFlagLink = find('#flag');
    this.elFlagTip = find('#flagTip');
    this.elFlagShow = false;
    // Note:  This was the only link defaulted to false in the original index.html
    //        so this is the only flag defaulted to false here.

    this.elSafetyLink = find('#safety');
    this.elSafetyTip = find('#safetyTip');
    this.elSafetyShow = true;

    this.net = spec.net;
    this.imvu = spec.imvu;
    this.eventBus = spec.eventBus;
    this.setTimeout = spec.timeout || function(callback, timeout) {return setTimeout(callback, timeout);};
    this.cid = dialogInfo.cid;
    this.viewer_cid = dialogInfo.viewer_cid;
    this.showShopTogether = dialogInfo.show_shop_together;
    this.starting_info = dialogInfo.starting_info;
    this.isChattingWithAvatar = dialogInfo.isChattingWithAvatar;
    this.suppressChatButtons = dialogInfo.suppressChatButtons;
    this.avatar_name = null;
    this.editmode = this.cid === this.viewer_cid;
    this.usStates = IMVU.HARDCODED_US_STATES;
    this.sorted_states = null;

    this.saved_tagline = null;
    this.saved_interests = null;
    this.interestCharacterCount = 0;
    this.interestInstructions = _T("List your interests (e.g. hip hop, comedy, motorcycles)");

    if (this.editmode) {
        $(this.elDialog).addClass('editmode');
    } else {
        this.elTaglineInput.disabled = 1;
    }

    this.fetchTranslatedAffinities();

    this.card = new IMVU.Client.widget.Card();
    this.card.onTabChange.subscribe(this.cardTabChanged, this, true);

    this.populateInfo(this.starting_info);
    this.doAsyncRequest();
    $(this.elMessageButton).click(this.sendMessage.bind(this));
    $(this.elGiftButton).click(this.sendGift.bind(this));
    $(this.elChatButton).click(function() {
        this.imvu.call('endDialog', {action:'INVITE_TO_CHAT'});
    }.bind(this));

    $(this.elVipIcon).click(function() {
        this.imvu.call('showVipInfo');
    }.bind(this));
    $(this.elApIcon).click(function() {
        this.imvu.call('showApInfo');
    }.bind(this));
    $(this.elMarriedIcon).click(function() {
        this.imvu.call('showMarriagePackageInfo');
    }.bind(this));
    $('#close_button').click(function() {
        this.imvu.call('endDialog', {});
    }.bind(this));
    onEscKeypress(function() {
        this.imvu.call('endDialog', {})
    }.bind(this));

    $(this.elTaglineInput).change(function() {
        this.onTaglineChange();
    }.bind(this));

    this.tagline_timeout = null;
    $(this.elTaglineInput).keyup(function() {
        var tagline = this.checkTaglineChange();
        if (!tagline) {
            return;
        }
        $(this.elTaglineInput).addClass('editing');
        clearTimeout(this.tagline_timeout);
        this.tagline_timeout = this.setTimeout(this.onTaglineChange.bind(this, null), 750);
    }.bind(this));

    $(this.elInterestTextarea).focus(function() {
        if ($(this.elInterestTextarea).val() == this.interestInstructions) {
            $(this.elInterestTextarea).val('');
        }
        $(this.elInterestTextarea).css('opacity', 1);
    }.bind(this));

    $(this.elInterestTextarea).blur(function () {
        if ( $(this.elInterestTextarea).val() == '') {
            $(this.elInterestTags).html(this.interestInstructions);
        }
        $(this.elInterestTextarea).css('opacity', 0);
    }.bind(this));
    $(this.elInterestTextarea).change(this.onInterestsChange.bind(this));

    var interests_timeout = null;
    $(this.elInterestTextarea).keypress(function() {
        this.interestCharacterCount = $(this.elInterestTextarea).val().length;
        this.updateCharacterCount();
        clearTimeout(interests_timeout);
        interests_timeout = this.setTimeout(this.onInterestsChange.bind(this, null), 3000);
    }.bind(this));

    this.taglineFocused = false;
    this.interestsFocused = false;
    $(this.elTagline).click(function() {
        this.elTaglineInput.focus();
        this.taglineFocused = true;
    }.bind(this));
    $(this.elInterestsLabel).click(function() {
        this.elInterestTextarea.focus();
        this.interestsFocused = true;
    }.bind(this));
    $(this.elInterestTextarea).click(function() {
        this.interestsFocused = true;
    }.bind(this));

    this.nowat_room_instance_id = null;
    $(this.elNowAtLink).click(function() {
        this.imvu.call('showRoomCard', this.nowat_room_instance_id);
    }.bind(this));

    $(this.elLocationName).hover(
        function(event) {$(this.elLocationNameTip).show()}.bind(this),
        function(event) {$(this.elLocationNameTip).hide()}.bind(this)
    )

    $(this.elWebProfileLink).click(function() {
        this.imvu.call('showWebProfile', this.cid);
    }.bind(this));
    $(this.elWebProfileLink).hover(
        function(event) {$(this.elWebProfileTip).show()}.bind(this),
        function(event) {$(this.elWebProfileTip).hide()}.bind(this)
    )

    // this.elPhotosLink
    $(this.elPhotosLink).hover(
        function(event) {$(this.elPhotosTip).show()}.bind(this),
        function(event) {$(this.elPhotosTip).hide()}.bind(this)
    )

    $(this.elShopLink).click(this.shopTogether.bind(this));
    $(this.elShopLink).hover(
        function(event) {$(this.elShopTip).show()}.bind(this),
        function(event) {$(this.elShopTip).hide()}.bind(this)
    )
    if (! this.showShopTogether) {
        this.elShopShow = false;
    }

    $(this.elMessageLink).click(this.sendMessage.bind(this));
    $(this.elMessageLink).hover(
        function(event) {$(this.elMessageTip).show()}.bind(this),
        function(event) {$(this.elMessageTip).hide()}.bind(this)
    )

    $(this.elAddFriendLink).click(this.addBuddy.bind(this));
    $(this.elAddFriendLink).hover(
        function(event) {$(this.elAddFriendTip).show()}.bind(this),
        function(event) {$(this.elAddFriendTip).hide()}.bind(this)
    )

    $(this.elFlagLink).click(this.sendFlagRequest.bind(this));
    $(this.elFlagLink).hover(
        function(event) {$(this.elFlagTip).show()}.bind(this),
        function(event) {$(this.elFlagTip).hide()}.bind(this)
    )

    $(this.elSafetyLink).click(this.showSafetyDialog.bind(this));
    $(this.elSafetyLink).hover(
        function(event) {$(this.elSafetyTip).show()}.bind(this),
        function(event) {$(this.elSafetyTip).hide()}.bind(this)
    )

    this.positionLinks();
};

IMVU.Client.AvatarCard.prototype = {

    _serviceRequest: function(spec) {
        var callbacks = spec.callback;
        function cb(result, error) {
            if (error) {
                callbacks.failure(error);
            } else {
                callbacks.success(result);
            }
        }
        spec.callback = cb;
        spec.network = this.net;
        spec.imvu = this.imvu;
        spec.json = true;
        serviceRequest(spec);
    },

    positionLinks: function() {
        var indent = 0;
        var defaultIncrement = 30;

        if( this.elWebProfileShow ) {
            $(this.elWebProfileLink).css('left', String(indent) + "px");
            $(this.elWebProfileLink).css('top', "1.9em");
            $(this.elWebProfileLink).show();
            $(this.elWebProfileTip).css('left', String(indent) + "px");
            $(this.elWebProfileTip).css('top', "0em");
            $(this.elWebProfileTip).hide();
            indent += defaultIncrement;
        }
        else {
            $(this.elWebProfileLink).hide();
            $(this.elWebProfileTip).hide();
        }

        if( this.elPhotosShow ) {
            $(this.elPhotosLink).css('left', String(indent) + "px");
            $(this.elPhotosLink).css('top', "1.8em");
            $(this.elPhotosLink).show();
            $(this.elPhotosTip).css('left', String(indent) + "px");
            $(this.elPhotosTip).css('top', "0em");
            $(this.elPhotosTip).hide();
            indent += defaultIncrement;
        }
        else {
            $(this.elPhotosLink).hide();
            $(this.elPhotosTip).hide();
        }

        if( this.elShopShow ) {
            $(this.elShopLink).css('left', String(indent) + "px");
            $(this.elShopLink).css('top', "2.0em");
            $(this.elShopLink).show();
            $(this.elShopTip).css('left', String(indent) + "px");
            $(this.elShopTip).css('top', "0em");
            $(this.elShopTip).hide();
            indent += defaultIncrement;
        }
        else {
            $(this.elShopLink).hide();
            $(this.elShopTip).hide();
        }

        if( this.elMessageShow ) {
            $(this.elMessageLink).css('left', String(indent) + "px");
            $(this.elMessageLink).css('top', "2.0em");
            $(this.elMessageLink).show();
            $(this.elMessageTip).css('left', String(indent) + "px");
            $(this.elMessageTip).css('top', "0em");
            $(this.elMessageTip).hide();
            indent += defaultIncrement;
        }
        else {
            $(this.elMessageLink).hide();
            $(this.elMessageTip).hide();
        }

        if( this.elAddFriendShow ) {
            $(this.elAddFriendLink).css('left', String(indent) + "px");
            $(this.elAddFriendLink).css('top', "1.9em");
            $(this.elAddFriendLink).show();
            $(this.elAddFriendTip).css('left', String(indent) + "px");
            $(this.elAddFriendTip).css('top', "0em");
            $(this.elAddFriendTip).hide();
            indent += defaultIncrement;
        }
        else {
            $(this.elAddFriendLink).hide();
            $(this.elAddFriendTip).hide();
        }

        if( this.elFlagShow ) {
            indent += 20;
            $(this.elFlagLink).css('left', String(indent) + "px");
            $(this.elFlagLink).css('top', "1.9em");
            $(this.elFlagLink).show();
            $(this.elFlagTip).css('left', String(indent) + "px");
            $(this.elFlagTip).css('top', "0em");
            $(this.elFlagTip).hide();
            indent += defaultIncrement;
        }
        else {
            $(this.elFlagLink).hide();
            $(this.elFlagTip).hide();
        }

        if( this.elSafetyShow ) {
            $(this.elSafetyLink).css('left', String(indent) + "px");
            $(this.elSafetyLink).css('top', "1.9em");
            $(this.elSafetyLink).show();
            $(this.elSafetyTip).css('left', String(indent) + "px");
            $(this.elSafetyTip).css('top', "0em");
            $(this.elSafetyTip).hide();
            indent += defaultIncrement;
        }
        else {
            $(this.elSafetyLink).hide();
            $(this.elSafetyTip).hide();
        }
    },

    doAsyncRequest : function() {
        var cb = {
            success: function(info) {
                info.came_from_server = true;
                this.populateInfo(info);
            }.bind(this),
            failure: function(info) {
                if (typeof info.response !== 'undefined') {
                    // json decode error
                    this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a problem getting the avatar info"));
                } else {
                    this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a network problem getting the avatar info"));
                }
                this.imvu.call('endDialog', {});
            }.bind(this)
        };
        var url = '/api/avatarcard.php?cid='+this.cid+'&viewer_cid='+this.viewer_cid;
        if (this.editmode) {
            url += '&editmode=1';
        }
        this._serviceRequest({
            method: 'GET',
            uri: url,
            callback: cb
        });
    },

    fetchTranslatedAffinities: function() {
        this.TRANSLATED_AFFINITIES = {};
        this.TRANSLATED_AFFINITIES['Bisexual'] = _T('Bisexual', this.imvu);
        this.TRANSLATED_AFFINITIES['Straight'] = _T('Straight', this.imvu);
        this.TRANSLATED_AFFINITIES['Heavy'] = _T('Heavy', this.imvu);
        this.TRANSLATED_AFFINITIES['Prefer Not To Say'] = _T('Prefer Not To Say', this.imvu);
        this.TRANSLATED_AFFINITIES['Relationships'] = _T('Relationships', this.imvu);
        this.TRANSLATED_AFFINITIES['Dating'] = _T('Dating', this.imvu);
        this.TRANSLATED_AFFINITIES['Seeing Someone'] = _T('Seeing Someone', this.imvu);
        this.TRANSLATED_AFFINITIES['Gay/Lesbian'] = _T('Gay/Lesbian', this.imvu);
        this.TRANSLATED_AFFINITIES['Chatting'] = _T('Chatting', this.imvu);
        this.TRANSLATED_AFFINITIES['Moderate'] = _T('Moderate', this.imvu);
        this.TRANSLATED_AFFINITIES['Divorced'] = _T('Divorced', this.imvu);
        this.TRANSLATED_AFFINITIES['In a Relationship'] = _T('In a Relationship', this.imvu);
        this.TRANSLATED_AFFINITIES['Other'] = _T('Other', this.imvu);
        this.TRANSLATED_AFFINITIES['Light'] = _T('Light', this.imvu);
        this.TRANSLATED_AFFINITIES['Married'] = _T('Married', this.imvu);
        this.TRANSLATED_AFFINITIES['Questioning'] = _T('Questioning', this.imvu);
        this.TRANSLATED_AFFINITIES['Friendship'] = _T('Friendship', this.imvu);
        this.TRANSLATED_AFFINITIES['Single'] = _T('Single', this.imvu);
        this.TRANSLATED_AFFINITIES['Quitting'] = _T('Quitting', this.imvu);
        this.TRANSLATED_AFFINITIES['Never'] = _T('Never', this.imvu);
        this.TRANSLATED_AFFINITIES['Social'] = _T('Social', this.imvu);
    },

    addBuddy: function () {
        this.imvu.call('addBuddy', this.cid, 'client avatarcard');
        $(this.elBuddyIcon).css('display', 'inherit');
        this.elAddFriendShow = false;
        this.positionLinks();
    },

    sendMessage: function () {
        this.imvu.call('showMessageDialog', {cid: this.cid, recipient_name: this.avatar_name, startWithGift: false});
    },

    sendFlagRequest: function() {
        dialogInfo = {
            'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
            'service_url': '/api/flag_content/flag_avatar.php',
            'title':_T('Flag ') + '"' + this.avatar_name + '"',
            'post_data': {
                'accused_id': this.cid
            },
            'get_reasons_from_server': {
                'content_type': 'avatar',
                'content_id': this.cid
            },
            'message': _T('Please tell us what you find inappropriate about this avatar card. For your reference, you can find our Terms of Service') + '<a id="tos" href="http://www.imvu.com/catalog/web_info.php?section=Info&topic=terms_of_service"> ' + _T('here') + ':</a>'
        };
        this.imvu.call('showModalFlaggingDialog', dialogInfo);
    },

    showSafetyDialog: function () {
        this.imvu.call('showAvatarSafetyDialog', this.cid, this.avatar_name);
    },

    shopTogether: function () {
        this.imvu.call('inviteToShopTogether', this.cid);
    },

    sendGift: function () {
        this.imvu.call('showMessageDialog', {cid: this.cid, recipient_name: this.avatar_name, startWithGift: true});
    },

    addButtons: function(info) {
        var showAddButton = this.showAddBuddyButton(info.cid);
        this.elAddFriendShow = false;
        if (this.viewer_cid != this.cid) {
            if (this.isChattingWithAvatar) {
                if (showAddButton) {
                    this.elAddFriendShow = true;
                } else {
                    $(this.elBuddyIcon).css('display', 'inherit');
                }
            } else {
                if (info.online) {
                    if (showAddButton) {
                        this.elAddFriendShow = true;
                    }
                    if (!this.suppressChatButtons) {
                        $(this.elChatButton).css('display', 'inline-block');
                    }
                } else {
                    if (showAddButton) {
                        this.elAddFriendShow = true;
                    } else {
                        $(this.elBuddyIcon).css('display', 'inherit');
                        $(this.elMessageButton).css('display', 'inline-block');
                        this.elMessageShow = false;
                    }
                }
            }

            $(this.elGiftButton).css('display', 'inline-block');
        }
        this.positionLinks();
    },

    namePredicate : function(lhs, rhs) {
        return (lhs.name > rhs.name);
    },

    getSortedCountries : function(info) {
        var countries = new Array();
        for (var name in info.all_countries) {
            var country = new Object();
            country.name = name;
            country.code = info.all_countries[name];
            countries.push(country);
        }
        countries.sort(this.namePredicate);
        return countries;
    },

    getSortedStates : function(info) {
        if (this.sorted_states == null) {
            this.sorted_states = new Array();
            for (name in this.us_states) {
                var state = new Object();
                state.name = name;
                state.abbrev = this.us_states[name];
                this.sorted_states.push(state);
            }
            this.sorted_states.sort(this.namePredicate);
        }
        return this.sorted_states;
    },

    populateForEditMode : function(info) {
        $(this.elLocationDropdown).children().remove();
        $(this.elLocationDropdown).unbind('change').bind('change', function () { this.onLocationChange(); }.bind(this));

        function appendLocation(dropdown, text, countrycode, state) {
            var option = document.createElement('option');
            option.appendChild(document.createTextNode(text));
            option.setAttribute('value', ''+countrycode);
            if (state) {
                option.state = state;
            }
            $(option).css('background-image', 'url(../../img/flags/'+countrycode+'.gif)');
            dropdown.appendChild(option);
        }

        var countries = this.getSortedCountries(info);
        for (var i = 0; i < countries.length; i++) {
            var country = countries[i];
            if (country.code == 223) {
                var states = this.getSortedStates(info);
                for (var j = 0; j < states.length; j++) {
                    var state = states[j];
                    appendLocation(this.elLocationDropdown, state.name+', '+_T("USA"), country.code, state.abbrev);
                }
            } else {
                appendLocation(this.elLocationDropdown, country.name, country.code);
            }
        }

        var do_dating_dropdown = function (fieldname) {
            var dropdown = this.rootElement.querySelector('#' + fieldname + '-dropdown');
            if (!dropdown) {
                return;
            }
            dropdown.fieldname = fieldname;
            $(dropdown).children().remove();
            $(dropdown).unbind('change').bind('change', function () { this.onAffinityChange(dropdown); }.bind(this));
            var values = info[fieldname+'_options'];
            for each(var v in values) {
                var option = document.createElement('option');
                var text = this.formatAffinity(v);
                if (text == this.rootElement.querySelector('#' + fieldname).innerHTML) {
                    option.setAttribute('selected', 1);
                }
                option.setAttribute('value', v);
                option.appendChild(document.createTextNode(text));
                dropdown.appendChild(option);
            }
        }.bind(this);

        if (this.interestCharacterCount == 0) {
            $(this.elInterestTextarea).val(this.interestInstructions);
        }
        do_dating_dropdown('relationship');
        do_dating_dropdown('orientation');
        do_dating_dropdown('looking_for');
        do_dating_dropdown('smoking');
        do_dating_dropdown('drinking');
    },

    createNetworkCallback : function(element, editingElement) {
        var cb = {
            success:function(o) {
                $(element).removeClass('saving');
                $(editingElement).removeClass('editing');
            },
            failure:function(o) {
                $(element).removeClass('saving');
                $(editingElement).removeClass('editing');
                this.showErrorDetails(o);
                IMVU.log(['network error:',o]);
            }.bind(this)
        };
        return cb;
    },

    setLocationText : function(newText) {
        // Ensure the parameter is a string, there is no html and no leading or trailing white space
        var displayText = String(newText);
        displayText = displayText.replace(/<(?:.|\n)*?>/gm, '');
        displayText = displayText.trim();
        var hoverText = displayText;

        // Check for longer than acceptable
        var acceptableLength = 30;
        if( displayText.length > acceptableLength ) {
            displayText = displayText.substring(0,(acceptableLength - 3)).trim() + '...'; // 3 = the length of the of the ellipses
        }

        // Set the text in the dialog
        this.elLocationName.innerHTML = displayText;

        // Set-up for hovering
        this.elLocationNameTip.innerHTML = hoverText;
    },

    onLocationChange : function(e) {
        var o = this.elLocationDropdown.options[this.elLocationDropdown.selectedIndex];

        this.setLocationText(o.text);
        this.elLocationFlag.src = '../../img/flags/'+o.value+'.gif';

        var url = '/api/avatarcard.php';
        var args = {};
        args.countrycode = o.value;
        if (o.state) {
            args.state = o.state;
        }
        IMVU.log(args);
        var cb = this.createNetworkCallback(this.elLocation);
        $(this.elLocation).addClass('saving');

        this._serviceRequest({
            method: 'POST',
            uri: url,
            callback: cb,
            data: args
        });
    },

    onAffinityChange : function (dropdown) {
        var o = dropdown.options[dropdown.selectedIndex];
        this.rootElement.querySelector('#' + dropdown.fieldname).innerHTML = o.text;
        this.rootElement.querySelector('#' + dropdown.fieldname).style.fontSize = "10px";

        while (this.rootElement.querySelector('#' + dropdown.fieldname).clientHeight > 12)
        {
            adjustTextSize(this.rootElement.querySelector('#' + dropdown.fieldname), -1);
        }

        var url = '/api/avatarcard.php';
        var args = {};
        args['dating_'+dropdown.fieldname] = o.value;
        IMVU.log(args);
        var cb = this.createNetworkCallback(this.elAffinityLabel);
        $(this.elAffinityLabel).addClass('saving');
        this._serviceRequest({
            method: 'POST',
            uri: url,
            callback: cb,
            data: args
        });
    },

    checkTaglineChange : function() {
        var tagline = this.elTaglineInput.value;
        tagline = tagline.replace(/^\s*/,'');
        tagline = tagline.replace(/\s*$/,'');
        tagline = tagline.replace(/^\u201c/,'');
        tagline = tagline.replace(/\u201d$/,'');
        tagline = tagline.replace(/^\s*/,'');
        tagline = tagline.replace(/\s*$/,'');
        if (tagline == this.saved_tagline) {
            return null;
        }
        return tagline;
    },

    onTaglineChange: function () {
        var tagline = this.checkTaglineChange();
        if (!tagline) {
            return;
        }
        this.saved_tagline = tagline;
        var url = '/api/avatarcard.php';
        var args = {};
        args.tagline = tagline;
        IMVU.log(args);
        var default_cb = this.createNetworkCallback(this.elTagline, this.elTaglineInput);
        var cb = {
            success: function(o) {
                default_cb.success(o);
                this.elTaglineInput.value = '\u201c' + o.tagline + '\u201d';
                $(this.elTagline).css('visibility', 'inherit');
                this.saved_tagline = o.tagline;
            }.bind(this),
            failure: default_cb.failure.bind(this)
        }

        $(this.elTagline).addClass('saving');

        this._serviceRequest({
            method: 'POST',
            uri: url,
            callback: cb,
            data: args
        });
    },

    onInterestsChange: function () {
        var text = this.elInterestTextarea.value.replace(/^\s*|\s*$/, '');
        if (text == this.saved_interests) {
            return;
        }
        if ($(this.elInterestTextarea).val() == this.interestInstructions) {
            return;
        }
        $(this.elInterestTags).empty();

        var interests = text.split(/\s*,\s*/);
        interests.sort();

        var url = '/api/avatarcard.php';
        var args = { interests: interests };
        IMVU.log(args);

        var default_cb = this.createNetworkCallback(this.elInterestsLabel);
        var cb = {
            success: function(o) {
                var first = true;
                var interests_string = "";

                console.log(o.debug);
                console.log(o.interests);

                for (var interest in o.interests) {
                    var tag = o.interests[interest].raw_tag;
                    tag = tag.replace(/<script.*?(\/script>|$)/i, "");

                    if (!first) {
                        $(this.elInterestTags).append($('<span>, </span>'));
                        interests_string += ", ";
                    }

                    interests_string += tag;
                    var s = $('<span/>').text(tag);
                    if (o.interests[interest].shared) s.addClass('shared');

                    $(this.elInterestTags).append(s);

                    first = false;
                }

                this.saved_interests = interests_string;
                this.interestCharacterCount = this.saved_interests.length;
                this.updateCharacterCount();
                if (this.saved_interests.length != 0) {
                    $(this.elInterestTextarea).val(this.saved_interests);
                } else if (!this.interestsFocused) {
                    $(this.elInterestTextarea).val(this.interestInstructions);
                    $(this.elInterestTextarea).css('opacity', 0.5);
                }
                $(this.elInterestsLabel).removeClass('saving');
                $(this.elInterestTags).removeClass('saving');
            }.bind(this),
            failure: function(o) {
                default_cb.failure(o);
            }.bind(this)
        }

        $(this.elInterestsLabel).addClass('saving');
        $(this.elInterestTags).addClass('saving');

        this._serviceRequest({
            method: 'POST',
            uri: url,
            callback: cb,
            data: args
        });
    },

    getStateNameForAbbrev : function(abbrev) {
        for (var state in this.us_states) {
            var this_abbrev = this.us_states[state];
            if (abbrev == this_abbrev) {
                return state;
            }
        }
        return null;
    },

    formatAffinity : function(x) {
        if (this.TRANSLATED_AFFINITIES[x]) {
            x = this.TRANSLATED_AFFINITIES[x];
        }

        var result = x[0].toUpperCase() + x.substr(1).toLowerCase();
        if (result === "Gay/lesbian") {
            result = "Gay/Lesbian";
        }
        return result;
    },

    populateInfo : function(info) {
        function getfield(info, name1, name2) {
            return info[name1] || info[name2] || null;
        }

        this.elAvpic.src = getfield(info, 'picUrl', 'avpic_url');
        this.avatar_name = getfield(info, 'avatarName', 'avname');
        this.elAvname.innerHTML = this.avatar_name;

        switch(getfield(info, 'gender', 'gender')) {
            case 'm':
            case 'M':
            case 'Male':
                this.elGender.innerHTML = _T("Male");
                break;
            case 'f':
            case 'F':
            case 'Female':
                this.elGender.innerHTML = _T("Female");
                break;
            default:
                this.elGender.innerHTML = '';
                $(document.body).addClass('hidden-gender');

        }

        if (info.age) {
            this.elAge.innerHTML = info.age;
        }
        if (!info.age || !getfield(info, 'gender', 'gender') || getfield(info, 'gender', 'gender') === 'Hidden') {
            this.elGenderAgeDivider.innerHTML = '';
        } else {
            this.elGenderAgeDivider.innerHTML = ' / ';
        }
        var location;
        if (info.location) {
            location = info.location.replace(' - ', ', ');
            this.setLocationText(location);
        }
        if (info.country_code) {
            this.elLocationFlag.src = '../../img/flags/'+info.country_code+'.gif';
            var stateName = this.getStateNameForAbbrev(info.location_state);
            if (info.country_code == 223 && stateName) {
                location = stateName + ", "+_T("USA");
                this.setLocationText(location);
            }
        }
        if ('tagline' in info) {
            this.elTaglineInput.value = '\u201c' + info.tagline + '\u201d';
            $(this.elTagline).css('visibility', 'inherit');
            this.saved_tagline = info.tagline;
        }
        if (info.registered) {
            this.elMemberSince.innerHTML = formatIsoDateShort(info.registered);
        }
        if (info.last_login) {
            this.elLastOnline.innerHTML = info.last_login;
        }
        if (info.registered || info.last_online) {
            $(this.elMemberInfo).css('visibility', 'inherit');
        }
        if (typeof(info.badge_count) != 'undefined') {
            this.elBadgeCount.innerHTML = info.badge_count;
            this.elBadgeArea.innerHTML = info.badge_area_html;
            $(this.elBadges).css('visibility', 'inherit');
            $(this.elThrobber).css('display', 'none');
        }
        if (info.show_ap) {
            $(this.elApIcon).css('display', 'inherit');
        }

        if (info.married_to_partner_cid != undefined) {
            $(this.elMarriedToLink).click(function() {
                this.imvu.call('showWebProfile', info.married_to_partner_cid);
            }.bind(this));

            $(this.elMarriedIcon).css('display', 'inherit');
            $(this.elMarriedToLine).css('visibility', 'inherit');
            $(this.elMarriedToLink).text(info.married_to_partner_avname);
        }

        var sd_display = info.show_ap ? 'inherit' : 'none';
        $(this.elAffinityDrinking).css('display', sd_display);
        $(this.elAffinitySmoking).css('display', sd_display);

        if (!!info.welcome_moderator_score) {
            $(this.elWelcomeModIcon).css('display', 'inherit');
        }
        if (info.show_staff) {
            $(this.elOtherInfo).addClass('staff_watermark')
            $(this.elStaffIcon).css('display', 'inherit');
            $(this.elYearsAtIMVU).css('visibility', 'hidden');
        } else {
            if (info.imvu_level) {
                $(this.elYearsAtIMVUValue).text(info.imvu_level);
                $(this.elYearsAtIMVU).css('visibility', 'inherit');
                if (info.imvu_level > 1) {
                    $(this.elYearsAtIMVULabel).text('Years at IMVU');
                }
            }
            if (info.wallpaper_id) {
                $(this.elAvInfo).addClass('wallpaper');
                $(this.elAvInfo).addClass('wallpaper' + info.wallpaper_id);
            }
        }
        if (info.show_ageverify) {
            $(this.elAgeverifyIcon).css('display', 'inherit');
        }
        if (info.show_vip) {
            $(this.elVipIcon).css('display', 'inherit');
        }
        if (info.is_creator) {
            $(this.elMyShop).css('display', 'inherit');
            $(this.elMyShop).click(function () {
                this.imvu.call('recordFact', 'My Shop Visited (client, r:avatarcard)', { 'customers_id':this.cid, 'visitor':this.viewer_cid } );
                this.imvu.call('recordFact', 'Visited Creator Shop (client)', { 'creator':this.cid });
                this.imvu.call('showCreatorShop', this.avatar_name);
                this.imvu.call('endDialog', {});
            }.bind(this));
        }
        if (info.interests) {
            var text = '';
            $(this.elInterestTags).children().remove();
            for (var interest in info.interests) {
                var tag = info.interests[interest].raw_tag;
                tag = tag.replace(/<script.*?(\/script>|$)/i, "");

                if (text) {
                    text += ', ';
                    this.elInterestTags.appendChild(document.createTextNode(', '));
                }

                var s = document.createElement('span');
                $(s).text(tag);

                this.elInterestTags.appendChild(s);
                text += tag;
            }
            this.saved_interests = text;
            this.interestCharacterCount = text.length;
            this.updateCharacterCount();
            this.elInterestTextarea.value = text;
            $(this.elInterests).css('visibility', 'inherit');
        }
        if (info.dating) {
            if (info.dating.relationship_status) {

                this.elRelationship.innerHTML = this.formatAffinity(info.dating.relationship_status);
                while (this.elRelationship.clientHeight > 12){
                    adjustTextSize(this.elRelationship, -1);
                }
            }
            if (info.dating.orientation) {
                this.elOrientation.innerHTML = this.formatAffinity(info.dating.orientation);
                while (this.elOrientation.clientHeight > 12){
                    adjustTextSize(this.elOrientation, -1);
                }
            }
            if (info.dating.looking_for) {
                this.elLookingFor.innerHTML = this.formatAffinity(info.dating.looking_for);
                while (this.elLookingFor.clientHeight > 12){
                    adjustTextSize(this.elLookingFor, -1);
                }
            }
            if (info.dating.drinking) {
                this.elDrinking.innerHTML = this.formatAffinity(info.dating.drinking);
                while (this.elDrinking.clientHeight > 12){
                    adjustTextSize(this.elDrinking, -1);
                }
            }
            if (info.dating.smoking) {
                this.elSmoking.innerHTML = this.formatAffinity(info.dating.smoking);
                while (this.elSmoking.clientHeight > 12){
                    adjustTextSize(this.elSmoking, -1);
                }
            }
            $(this.elAffinity).css('visibility', 'inherit');
        }

        if (info.public_rooms && info.public_rooms[0]) {
            var room = info.public_rooms[0];
            if (!this.imvu.call('hasAccessPass') && room.is_ap){
            }
            else {
                this.nowat_room_instance_id = room.room_instance_id;
                $(this.elNowAt).css('display', 'block');
                var html = room.name;
                if (room.is_ap && room.is_ap != '0') {
                    html = "<img src='../../img/icon_ap_small.png'/>" + html;
                }
                if (room.is_vip && room.is_vip != '0') {
                    html = "<img src='../../img/icon_vip_small.png'/>" + html;
                }
                this.elNowAtLink.innerHTML = html;
            }
        }

        if (info.show_block) {
            this.elSafetyShow = true;
            this.elMessageShow = true;
        } else {
            this.elSafetyShow = false;
            this.elMessageShow = false;
        }
        if (this.avatar_name === null) {
            $(this.elSafetyLink).css('opacity', 0);
            $(this.elMessageLink).css('opacity', 0);
        } else {
            $(this.elSafetyLink).css('opacity', 1);

            if (info.show_flag_icon) {
                this.elFlagShow = true;
            } else {
                this.elFlagShow = false;
            }

            $(this.elMessageLink).css('opacity', 1);
        }

        if (typeof info.online !== 'undefined') {
            $(this.elAvailability).css('visibility', 'visible');
            if (info.availability === 'Creating') {
                $(this.elAvatarPopupCreating).removeClass('hidden');
            } else {
                $(this.elAvatarPopupOnline).css('display', info.online ? 'inline' : 'none');
            }
            $(this.elAvatarPopupOffline).css('display', info.online ? 'none' : 'inline');
        }

        var should_add_buttons = info.came_from_server;
        if (should_add_buttons) {
            this.addButtons(info);
        }

        if (info.us_states) {
            this.us_states = info.us_states;
        }
        if (this.editmode) {
            this.populateForEditMode(info);
        }

        if (info.visible_albums !== undefined && info.viewer_cid != info.cid) {
            this.elPhotosShow = true;
            if (info.visible_albums > 0) {
                $(this.elPhotosLink).click(function() {
                    this.imvu.call('showGallery', this.cid);
                    this.imvu.call('endDialog', {});
                }.bind(this));
                $(this.elPhotosLink).html("<img src='icon-photo.png'/>");
                $(this.elPhotosTip).html(_T('See my albums') + " (" + info.visible_albums + ")");
            } else {
                $(this.elPhotosLink).addClass('disabled');
                $(this.elPhotosLink).html("<img src='icon-photo-gray.png'/>");
                $(this.elPhotosTip).html(_T('See my albums') + " (0)");
            }
        } else {
            this.elPhotosShow = false;
        }

        // Show/hide links
        this.positionLinks();
    },

    updateCharacterCount: function() {
        var remainingChars = 256 - this.interestCharacterCount;
        if (remainingChars <= 1) {
            $(this.elInterestTextarea).val(this.elInterestTextarea.value.substring(0, 255));
            this.interestCharacterCount = 256;
        }
        $(this.elInterestCharacterCountText).text(remainingChars + " " + _T("characters remaining"));
    },

    getBuddyType : function(cid) {
        return this.imvu.call('getBuddyType', cid);
    },

    showAddBuddyButton: function(cid) {
        var type = this.getBuddyType(cid);
        return (!type || (type == "INVITE_RECEIVED"));
    },

    showErrorDetails: function(details) {
        this.imvu.call('showErrorDialog', _T("Error Saving Changes"), _T("There was a problem saving your changes.")+'<br />'+_T("Please try again later."));
        this.imvu.call('log', 'Error saving state - details:' + details);
    },

    cardTabChanged: function(e, args) {
        var obj = args[0];
        $(this.elDialog).removeClass('titlebar');
        return;
    }
};

FAKE_DATA = {'cid': 349244,
 'starting_info': {'FlashTutorialLastPageViewed': '1',
                   'FlashTutorialQuit': '0',
                   'age': '30',
                   'avatarName': 'Dusty',
                   'dob': '1900-01-01',
                   'email': 'dusty@imvu.com',
                   'gender': 'm',
                   'hasAccessPass': '1',
                   'hasVIPPass': 1,
                   'how_many_online': 70665,
                   'isGuest': 0,
                   'picUrl': 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/349244_76727636147e027add9408.jpg',
                   'room': 395704,
                   'userId': 349244,
                   'wealth': 1000,
                   'wealth_credits': '900',
                   'came_from_server' : true,
                   'online' : true,
                   'show_flag_icon' : true,
                   'wealth_predits': '100'},
 'viewer_cid': 349244};

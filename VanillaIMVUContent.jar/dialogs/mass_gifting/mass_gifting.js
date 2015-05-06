function createMassGiftingSystem(args) {
    var giftData = args.extra_args.gift;
    var imvu = args.imvu;
    var network = args.network;
    var recipientAvatarname = args.extra_args.recipient_name;
    onEscKeypress(function () {
        imvu.call('cancelDialog');
    }.bind(this));
    var MassGiftingSytem = function() {
        this.settings = {
          sauce: IMVU.sauce,
          rest_base_url: window.rest_base_url
        };
        
        this.massgifting_nonfriend_rollout = imvu.call('shouldSeeFeature', 'massGiftingNonfriend');
        this.$dialog = $('#mgifting-dialog');
        this.$mgFriendsList = null;
        this.$container = $('.container', this.$dialog);
        this.$searchBox = null;
        this.site = '';
        this.siteData = {
            dialogRef: null
        };
        this.data = {
            wrap_optional_text: '(optional)',
            message_optional_text: '(optional)'
        };
        this.serviceData = null;
    };


    MassGiftingSytem.prototype.applyOtherTemplates = function($wrapper, data) {
        var self = this;
        $wrapper.find('.prod-image').attr('src', data.gift_product.image_url);

        var $friend_container = $('#mgifting-dialog .container .mg-friends-list .mg-friends');
        _.each(data.buddies, function(friend) {
            friend.ap_class = 'hidden';
            if (friend.is_ap || friend.is_ap == 'true') {
                friend.ap_class = '';
            }
            friend.additional_class = '';
            var friend_html = IMVU.Client.util.generateHtml('.mg-friend-template', friend);
            var $friend_div = $(friend_html);
            $friend_div.find('.friend-img').attr('src', friend.avpic_url);
            $friend_container.append($friend_div);
        });

        var $delivery_options = $('#mgifting-dialog .container .deliver-line .deliver-select');
        _.each(data.holidays_ordered, function(value, key) {
            $delivery_options.append('<option value="' + value + '">' + data.holidays[value] + '</option>');
        });
        $delivery_options.selectBox();
        
        var count = 12;
        var page = 0;
        var $wrap_carousel = $('#mgifting-dialog .container .mg-carousel-container .mg-wraps-carousel');
        var $slide = $('<div class="slide"></div>').appendTo($wrap_carousel);
        _.each (data.gift_wrap_choices_ordered, function(gift_wrap) {
            if (count === 0) {
                $slide = $('<div class="slide"></div>').appendTo($wrap_carousel);
                page = page + 1;
                count = 12;
            }
            gift_wrap.page = page;
            var gift_wrap_html = IMVU.Client.util.generateHtml('.mg-gift-wrap-template', gift_wrap);
            var $gift_wrap_div = $(gift_wrap_html);
            $gift_wrap_div.find('img').attr('src', gift_wrap.mogile_image);
            $slide.append($gift_wrap_div);
            count = count - 1;
        });
        return $wrapper;
    };

    MassGiftingSytem.prototype.translateMessage = function(message, message_key, message_values) {
        if (typeof(message_key) == 'string') {
            var translated_msg = $('.translation_feedback_block .translation_feedback_str_' + message_key).html();
            if (translated_msg && typeof(message_values) != 'undefined') {
                $.each(message_values, function(k, v) {
                    var search = new RegExp('<span class="notranslate">' + k + '</span>', 'g');
                    translated_msg = translated_msg.replace(search, v);
                });
                return translated_msg;
            }
        }
        if (message) {
            return message;
        }
        return this.constants().FEEDBACK_TITLE_BAD;
    };


    MassGiftingSytem.prototype.constants = function(params) {
        return {
            NO_FRIENDS: _T('You have no friends at this time'),
            CLOSE: _T('Close'),
            FEEDBACK_TITLE_GOOD: _T('Congratulations!'),
            FEEDBACK_TITLE_BAD: _T('There was an error sending your gift'),
            CANCEL: _T('Cancel'),
            ADD: _T('Add'),
            UPDATE: _T('Update'),
            ADD_MESSAGE: _T('Add Message'),
            SELECT: _T('Select')
        };
    };

    MassGiftingSytem.prototype.showNonLoginDialog = function() {
        var dialogConf = {
            modal: true,
            resizable: false,
            dialogClass: 'mass-gifting-dialog',
            width: 620,
            title: 'An error occurred',
            buttons: [
                {
                    text: 'OK',
                    className: 'mg-button',
                    click: function() {
                        $(this).dialog('close');
                    }
                }
            ]
        };

        $('<div id="mg-non-login-dialog"><p class="not-login-msg">You must be logged in.</p></div>').dialog(dialogConf);
    };

    MassGiftingSytem.prototype.showAllHasGift = function() {
        var $dialog = $('#mgifting-dialog');
        var $friendsContainer = $('.mg-friends-list', $dialog).addClass('show-error');

        $('.friend.selected', $friendsContainer).attr('disabled', 'disabled').addClass('disabled').removeClass('selected');
        var $container = $('.container', $dialog);
        $container.trigger('select_change');
        $('#mg-friends-tabs .tab-friends', $dialog).click();

        this.siteData.dialogWithHeaderFooter.trigger('hideSpinner');
    };

    MassGiftingSytem.prototype.handleSubmit = function(response, error) {
        var params;
        var template = '';
        var feedback_title = '';
        var isSuccess = false;

//        console.log(error);
//        console.log(response);
        this.siteData.dialogWithHeaderFooter.trigger('hideSpinner');
        if ((error && error.error) || (response && response.data && response.data.error)) {
            if (response && response.data && response.data.error) {
                error = response.data;
            }
            if (error.recipient_results && error.recipient_results.num_invalid == error.recipient_results.num_requested) {
                this.showAllHasGift();
                return;
            }

            params = {
                error_msg: this.translateMessage(error.error.message, error.error.key, error.error.values)
            };
            //console.log(params);
            template = '.mg-submit-failure-template';
            feedback_title = this.constants().FEEDBACK_TITLE_BAD;
        } else {
            if (response.data.recipient_results.num_invalid == response.data.recipient_results.num_requested) {
                this.showAllHasGift();
                return;
            }
            var extra_messages = response.data.extra_messages;
            var disp_msg = '';
            for (i in extra_messages) {
                var extra_msg = extra_messages[i];
                if (extra_msg.key == 'PARTIAL_SUCCESS_MULTIPLE' || extra_msg.key == 'PARTIAL_SUCCESS_SINGLE') {
                    disp_msg = this.translateMessage(extra_msg.message, extra_msg.key, extra_msg.values);
                    break;
                }
            }
            params = {
                recipient_msg: disp_msg,
                balance: IMVU.Client.util.number_format(response.data.balance),
                total_cost: IMVU.Client.util.number_format(response.data.total_cost)
            };

            isSuccess = true;
            if (response.data.recipient_results.num_invalid > 0) {
                template = '.mg-submit-success-with-errors-template';
                feedback_title = this.constants().FEEDBACK_TITLE_GOOD;
            } else {
                template = '.mg-submit-success-template';
                feedback_title = this.constants().FEEDBACK_TITLE_GOOD;
            }
        }
        var html = IMVU.Client.util.generateHtml(template, params);
        if (isSuccess) {
            $('#mgifting-dialog').empty().html(html).css('height', '410px');
            IMVU.Client.util.turnLinksIntoLaunchUrls($('#mgifting-dialog .error-line'), imvu);
            $('#ui-dialog-title-mgifting-dialog').addClass('dialog-confirm-header').html(feedback_title);
            $('.mg-button-send').addClass('hidden');
            $('.mg-button-cancel span').html(this.constants().CLOSE);
        } else {
            this.siteData.dialogWithHeaderFooter.trigger('show-submit-error', {
                error_msg: html
            });
        }
    };

    MassGiftingSytem.prototype.getMessageInfoRequest = function() {
        var self = this;
        var postargs = {
            a: 1,
            gift_product_id: giftData.id,
            skip_birthdays: true,
            should_limit: 1
        };
        var spec = {
            method: 'POST',
            uri: '/api/service/messaging/send-message-info.php',
            network: network,// for unit test
            imvu: imvu,      // for unit test
            json: true,
            data: postargs,
            callback: this.getMessageInfoRequestCallback.bind(this)
        };
        serviceRequest(spec);

        this.siteData.dialogWithHeaderFooter =
            $('.mass-gifting-dialog').bind('showSpinner', function() {
                    var $th = $(this);
                    if ($th.find('.mg-spinner').length === 0) {
                        $th.prepend($('<div class="mg-spinner"></div>'));
                    }
                    $th.find('.mg-spinner').removeClass('hidden');
            }).bind('hideSpinner', function() {
                $('.mg-spinner', $(this)).addClass('hidden');
            }).bind('show-submit-error', function(e, params) {
                var $th = $(this);
                var $footer = $th.find('.ui-dialog-buttonpane');
                $('.mg-main-cancel, .mg-button-send', $footer).addClass('hidden');
                $('.mg-button-ok', $footer).removeClass('hidden');

                var $info_line = $('.submit-failure-container', $th).removeClass('hidden').find('.info-line');
                $info_line.html(params.error_msg);

                $('.container', $th).addClass('hidden');
                IMVU.Client.util.turnLinksIntoLaunchUrls($info_line, imvu);

                $th.trigger('hideSpinner');
            }).bind('hide-submit-error', function() {
                var $th = $(this);
                var $footer = $th.find('.ui-dialog-buttonpane');
                $('.mg-main-cancel, .mg-button-send', $footer).removeClass('hidden');
                $('.mg-button-send', $footer).trigger('to_enable');
                $('.mg-button-ok', $footer).addClass('hidden');

                $('.submit-failure-container', $th).addClass('hidden');
                $('.container', $th).removeClass('hidden');
                $th.trigger('hideSpinner');
            });
    };

    MassGiftingSytem.prototype.preselectRecipient = function($container) {
        if (recipientAvatarname) {
            _.each(recipientAvatarname, function(recipient) {
                this.searchByService(recipient, function() {                     
                    var $searchContainer = $('.mg-search-container', this.$container);
                    var $searchBox = $('.mg-search', $searchContainer);
                    IMVU.Client.util.hint([$searchBox]);                                          
                    $('#mg-friends-tabs .friends-selected-tab .tab-selected').trigger('click');                
                }.bind(this));
            }.bind(this));
        }
    };

    MassGiftingSytem.prototype.setupFriendsList = function($container, $buttonSend) {
        var self = this;
        $('#mg-friends-tabs', $container).tabs({
            selected: 1
        });
        this.$mgFriendsList = $("#mg-friends-list", this.$dialog); 
        
        $('#mg-friends-tabs', $container).find('.ui-tabs-nav li').bind('click', function() {
            $(this).find('a').trigger('click');
        });

        //$('.mg-friends-list .friend', $container).bind('click', function() {
        $('.mg-friends-list', $container).delegate(".friend", "click", function() {
            var $th = $(this);
            if($th.hasClass('disabled')) {
                return;
            }

            $th.toggleClass('selected');
            if ($('.mg-friends-list').hasClass('selected')) {
                $th.toggleClass('hidden', true);
            }
            $container.trigger('select_change');
            $container.trigger('update_select_all_checkbox');
            if ($th.parent().parent().hasClass("non-friend-sector")){
                var $nonFriendSector = $th.parent();
                var buddies = self.serviceData.buddies, 
                    cid = $th.data("cid");
                for(var i=buddies.length-1; i>= 0; i--) {
                    if(buddies[i].cid == cid) {
                        buddies.splice(i,1);
                        break;
                    }
                }
                
                $th.remove();
                if ($nonFriendSector.find(".friend").length == 0) {
                    $(".non-friend-sector", self.$mgFriendsList).hide();
                }
            }
            
            
        });

        $('#mgifting-dialog').dialog('option', 'position', 'center');
        
        $('#mg-friends-tabs .friends-selected-tab .tab-selected', $container).bind('click', function() {
            $('#mgifting-dialog .mg-friends-list').toggleClass('selected', true);
            $('#mgifting-dialog .mg-friends-list .friend:not(.selected)').toggleClass('hidden', true);
            $('#mgifting-dialog .mg-friends-list .friend.selected').removeClass('hidden');
            var $nonFriendSector = $(".non-friend-sector", self.$mgFriendsList);
            if ($nonFriendSector.length > 0 && $nonFriendSector.find(".friend").length > 0) {
                $(".non-friend-sector", self.$mgFriendsList).show();
            }
        });
        
        $('#mg-friends-tabs .tab-friends', $container).bind('click', function() {
            $('#mgifting-dialog .mg-friends-list').removeClass('selected');
            var $nonFriendSector = $(".non-friend-sector", self.$mgFriendsList);
            var $successMsg = $(".mg-alert-msg-container.success-msg",self.$mgFriendsList);
            if ($successMsg.is(":visible")) {
                var addedCid = $successMsg.data("cid");
                if ($nonFriendSector.length === 0 || $nonFriendSector.find(".mg-friend-" + addedCid).length === 0 ) {
                    self.$searchCancel.trigger("click");
                }
            } else {
                if (!$(".mg-alert-msg-container .invalid-msg",self.$mgFriendsList).is(":visible")){
                    $container.trigger('apply_search');
                }
            }
             
            var $friendList = $container.find(".mg-friends");
            if ( $friendList.find('.friend').length === 0   ) {
                $friendList.find(".not-friend-msg").removeClass("hidden");
            }
                
            if ($nonFriendSector.length > 0 ) {
                $(".non-friend-sector", self.$mgFriendsList).hide();
            }
        });
        
        $('#mgifting-dialog .mg-friends').find('.info').each(function() {
            var $th = $(this);
            $th.unbind('mouseover');
            $th.unbind('mouseout');
            $th.mouseover(function () {
                IMVU.Client.util.scrollLeft($th.find('.scroll_container'));
            });
            $th.mouseout(function () {
                IMVU.Client.util.scrollRight($th.find('.scroll_container'));
            });
        });

        $('.select-all', $container).bind('click', function() {
            if (this.checked) {
                $container.trigger('select_all');
            } else {
                $container.trigger('select_none');
            }
        });

        $container.bind('select_change', function() {
            var giftPrice = self.serviceData.gift_product.discount_price;
            var $selectedFriendsList = $('.mg-friends-list .selected', $(this));
            var selectedCount = $selectedFriendsList.length;

            $('span.selected-count', $container).html(selectedCount);
            $('p.total-credits span', $container).html(IMVU.Client.util.number_format(selectedCount * giftPrice));

            if (selectedCount > 0) {
                $buttonSend.trigger('to_enable');
                $('.mg-friends-list', $container).removeClass('show-error');
            } else {
                $buttonSend.trigger('to_disable');
            }
        }).bind('select_all', function() {
            $('.mg-friends-list .friend:not(.hidden):not(.disabled)', $(this)).addClass('selected');
            $container.trigger('select_change');
        }).bind('select_none', function() {
            var $friends_list = $('.mg-friends-list .friend:not(.hidden)', $(this)).removeClass('selected');
            var $friend;
            for (var i = 0, len = $friends_list.length; i < len; i++) {
                $friend = $($friends_list[i]);
                if ($friend.hasClass("non-friend")) {
                    $friend.trigger("click");
                } 
            }
            $container.trigger('select_change');
        }).bind('update_select_all_checkbox', function() {
            var countFriends = $('.mg-friends-list .friend', $container).length;
            var countSelected = $('.mg-friends-list .friend.selected', $container).length;
            $('.select-all', $container).attr('checked', countFriends > 0 && countFriends === countSelected);
        });
    };

    MassGiftingSytem.prototype.setupSearchContainer = function($container) {
        var self = this;
        var $searchContainer = $('.mg-search-container', $container);
        this.$searchBox = $('.mg-search', $searchContainer);
        this.$searchCancel = $('.mg-search-cancel', $searchContainer);

        if ($('#mg-friends-list a.friend', $container).length === 0 && !self.massgifting_nonfriend_rollout) {
            var msg = '<p class="mg-error-text" style="padding-top: 20px;">' + self.constants()['NO_FRIENDS'] + '</p>';
            $('#mg-friends-list .not-friend-msg', $container).html(msg).removeClass('hidden');
            $('.mg-search', $searchContainer).attr('disabled', 'disabled').addClass('disabled');
        }
        $searchContainer.bind('toSearchStatus',
            function() {
                var $th = $(this);
                $('.mg-search-submit', $th).removeClass('hidden');
                $('.mg-search-cancel', $th).addClass('hidden');
                $('.mg-search', $searchContainer).val('');
                $container.trigger('show_all');

                $('.mg-search', $th).show();
                self.hideNonFriendSector();
            }
        ).bind('toCancelStatus',
            function() {
                var $th = $(this);
                $('.mg-search-submit', $th).addClass('hidden');
                $('.mg-search-cancel', $th).removeClass('hidden');
                $container.trigger('show_all');
                self.hideNonFriendSector();
            }
        );

        this.$searchCancel.bind('click', function() {
            $searchContainer.trigger('toSearchStatus');
            $container.trigger('update_select_all_checkbox');
        });

        self.$searchBox.bind('keyup', function(e) {
            var $th = $(this);
            if ( $th.hasClass('hint') ) {
                return;
            }
            $('.mg-friends-list', $container).removeClass('show-error');
            $container.trigger('apply_search',e);
        });

        self.$searchBox.bind("keypress", function(e){
            var code = e.charCode;
            return (code === 0 || (code >=48 && code <=59) || (code >=65 && code <=90) || (code >=97 && code <=122) || code === 95);
        });

        IMVU.Client.util.hint([self.$searchBox]);

        $container.bind('show_all', function() {
            var $friends_list = $('.mg-friends-list .friend', $(this)) ;
            $friends_list.removeClass('hidden');
            $container.trigger('select_change');
            $('.not-friend-msg', $(this)).addClass('hidden');
            self.setEnableShowAll();
        }).bind('hide_all', function() {
            var $friends_list = $('.mg-friends-list .friend', $(this)) ;
            $friends_list.addClass('hidden');
            $container.trigger('select_change');
        }).bind('apply_search', function(params, evt) {
            var $this = $(this);
            var value = self.$searchBox.hasClass('hint') ? '': self.$searchBox.val();
            var buddies = self.serviceData.buddies;

            $('.mg-friends-list', $this).removeClass('not-find-friend-bg');
            $this.trigger('update_select_all_checkbox');

            $searchContainer.trigger('toCancelStatus');
            if (value.length === 0) {
                $this.trigger('show_all');
                return;
            }

            $this.trigger('hide_all');
            
            if ($(".non-friend-sector", self.$mgFriendsList).length > 0) {
                $(".non-friend-sector", self.$mgFriendsList).hide();
            }
            
            if (self.massgifting_nonfriend_rollout && evt && evt.keyCode === 13) {
                //$('.not-friend-msg', $this).empty().removeClass('hidden');
                $('#mg-friends-list', $this).addClass('not-find-friend-bg');
                self.searchByService(self.$searchBox.val());
                return;
            } 
            
            var isFindFriend = false,
                isFindNonFriendLoaded = false;
            for(var index in buddies) {
                var friend = buddies[index];
                if (friend.name && friend.name.toUpperCase && friend.name.toUpperCase().indexOf(value.toUpperCase()) != -1) {
                    $('.mg-friend-' + friend.cid).removeClass('hidden');
                    isFindFriend = true;

                    if (!friend.are_buddies && friend.load_by_search && friend.name.toUpperCase() === value.toUpperCase()) {
                        isFindNonFriendLoaded = true;
                    }
                }
            }
            if (isFindFriend) {
                $('.not-friend-msg', $this).addClass('hidden');
                if( !self.$mgFriendsList.find(".friend").is(":visible") && self.massgifting_nonfriend_rollout ){
                    if (isFindNonFriendLoaded){
                        self.showAvatarnameLoadedTemplate(value);
                    } else {
                        self.showNotOnListTemplate(value);
                    }
                }
            } else {
                if (!self.massgifting_nonfriend_rollout) {
                    var errorMsg = IMVU.Client.util.generateHtml('.mg-not-friend-msg-template', {
                        name: _.escape(value)
                    });
                    $('.not-friend-msg', $this).html(errorMsg).removeClass('hidden');
                    $('#mg-friends-list', $this).addClass('not-find-friend-bg');
                } else {
                    self.showNotOnListTemplate(value);
                }
            }
            self.setEnableShowAll();
            
        });
    };
    MassGiftingSytem.prototype.setEnableShowAll = function(){
        var self = this;
        var $selectAll = $('.select-all', self.$container);
        if (self.$mgFriendsList.find(".friend").is(":visible")) {
            $selectAll.removeAttr("disabled");
        } else {
            $selectAll.attr("disabled", true).attr('checked', false);
        }
    };

    MassGiftingSytem.prototype.showAvatarnameLoadedTemplate = function(value){
        var self = this;
        var errorMsg = IMVU.Client.util.generateHtml('.mg-avatarname-loaded-template', {
            name: _.escape(value)
        });
        $('.not-friend-msg', this.$container).html(errorMsg).removeClass('hidden');
        $('#mg-friends-list', this.$container).addClass('not-find-friend-bg');
        self.addNonFriendEvents();
        self.hideFriends();
        
    };
    
    MassGiftingSytem.prototype.showNotOnListTemplate = function(value){
        var self = this;
        var errorMsg = IMVU.Client.util.generateHtml('.mg-nonfriend-not-on-list-template', {
            name: _.escape(value)
        });
        $('.not-friend-msg', this.$container).html(errorMsg).removeClass('hidden');
        $('#mg-friends-list', this.$container).addClass('not-find-friend-bg');
        self.addNonFriendEvents();
    };
    MassGiftingSytem.prototype.hideFriends = function(){
        $(".friend", this.$mgFriendsList).addClass("hidden");
    }

    MassGiftingSytem.prototype.hideNonFriendSector = function(){
        var self = this;
        var $nonFriendSector = $(".non-friend-sector", self.$mgFriendsList);
        if ($nonFriendSector.length > 0 ) {
            $(".non-friend-sector", self.$mgFriendsList).hide();
        }
    };
    
    MassGiftingSytem.prototype.setupGiftWrapContainer = function($container) {
        var self = this;
        var $wrapContainer = $('.gift-wraps-container', $container);
        $('.show-gift-wraps', $container).unbind('click').bind('click', function() {
            var $th = $(this);
            $wrapContainer.dialog ({
                dialogClass: 'mg-wraps-dialog ' + self.site,
                modal: true,
                title: '<span class="arrow-left"></span><span class="arrow-left-stroke">',
                position: {
                    of: $th,
                    offset: '220, -20'
                },
                width: 425,
                resizable: false,
                buttons: [
                    {
                        text: self.constants().CANCEL,
                        className: 'button-css-cancel-flat dialog-button-round',
                        click: function() {
                            $(this).dialog('close');
                            $(this).dialog('destroy');
                        }
                    },
                    {
                        text: self.constants().SELECT,
                        className: 'mg-button-add button-css-cta-flat dialog-button-round',
                        click: function(e) {
                            var wrapId = $('.gift-wrap-preview', $wrapContainer).data('wrap_id');
                            var page = $('.gift-wrap-preview', $wrapContainer).data('page');
                            var wrapText = self.serviceData.gift_wrap_choices[wrapId].image_title;
                            $('.show-gift-wraps', $container).data('wrap_id', wrapId).data('page', page);
                            $('.show-gift-wraps .optional-text', $container).html(IMVU.Client.util.truncate(wrapText, 30));
                            $(this).dialog('close');
                            $(this).dialog('destroy');
                        }
                    }
                ],
                create: function() {
                    $('.mg-wraps-dialog').find('button').removeClass('ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only');
                },
                open: function(event, ui) {
                    var $th_open = $(this);
                    $('.mg-wraps-carousel ', $wrapContainer).rcarousel({
                        margin: 6,
                        visible: 1,
                        step: 1,
                        width: 146,
                        height: 128,
                        navigation: {
                            next: '.ui-carousel-next',
                            prev: '.ui-carousel-prev'
                        }
                    });

                    $('.ui-carousel-next').add('.ui-carousel-prev').bind('mouseup', function() {
                        var wrapId = $('.gift-wrap-preview', $wrapContainer).data('wrap_id');
                        $('#mg-wrap-' + wrapId).trigger('click');
                    });

                    $('.wrap', $(this)).live('click', function() {
                        var $th = $(this);
                        var wrapId = $th.data('wrap_id');
                        var wrapsData = self.serviceData.gift_wrap_choices[wrapId];
                        var imgUrl = wrapsData.mogile_image;
                        var wrapText = wrapsData.text;
                        var wrapTitle = wrapsData.image_title;
                        var $wrapPreview = $('.gift-wrap-preview', $wrapContainer);

                        $('.wrap', $th.parent()).removeClass('selected');

                        $th.addClass('selected');
                        $wrapPreview.css('background', 'url(' + imgUrl + ')').data('wrap_id', wrapId).data('page', $th.data('page'));
                        $('.wrap-text', $th_open).html(wrapText);
                        $('.wrap-title', $wrapPreview).html(wrapTitle);
                    });

                    var wrapId = $('.show-gift-wraps', $container).data('wrap_id');
                    var pageNum = $('.show-gift-wraps', $container).data('page');

                    if (wrapId && pageNum) {
                        $('.mg-wraps-carousel').rcarousel('goToPage', parseInt(pageNum));
                        $('.wrapper .slide #mg-wrap-' + wrapId, $wrapContainer).trigger('click');
                    } else {
                        $('.wrapper .slide a:first-child', $wrapContainer).trigger('click');
                    }
                    if (self.serviceData.gift_wrap_choices.length < 13) {
                        $('.ui-carousel-prev, .ui-carousel-next', $wrapContainer).attr('disabled', 'disabled').addClass('disabled');
                    }
                }
            });
        });
    };

    MassGiftingSytem.prototype.setupMessageContainer = function($container) {
        var self = this;
        $('.show-add-message', $container).unbind('click').bind('click', function(e) {
            var $th = $(this);
            $('#mg-add-message-dialog').dialog({
                dialogClass: 'mg-add-msg-dialog ' + self.site,
                modal: true,
                title: '<span class="arrow-left"></span><span class="arrow-left-stroke"></span>' + self.constants().ADD_MESSAGE,
                position: {
                    of: $th,
                    offset: '220, -45'
                },
                width: 426,
                buttons: [
                    {
                        text: self.constants().CANCEL,
                        className: 'mg-button-cancel button-css-cancel-flat dialog-button-round',
                        click: function() {
                            $(this).dialog('close');
                            $(this).dialog('destroy');
                        }
                    },
                    {
                        text: self.constants().ADD,
                        className: 'mg-button-add button-css-cta-flat dialog-button-round',
                        click: function(e) {
                            var $msg = $(this).find('.mg-message');
                            var msg = _.escape($(this).find('.mg-message').val());
                            var $hint = $msg.prev('label[for=' + $msg.attr('id') + ']');
                            var fullMsg = msg;

                            if ($hint.text() === msg) {
                                msg = self.data.message_optional_text;
                                fullMsg = '';
                            }
                            
                            var $addMessageOptional = $('.show-add-message .optional-text', $container)
                                .html(IMVU.Client.util.truncate( msg.length > 0?msg: "(optional)", 30));

                            $('.full-message', $container).val(fullMsg);
                            $(this).dialog('close');
                            $(this).dialog('destroy');
                        }
                    }
                ],
                open: function() {
                    var $th_dialog = $('.mg-add-msg-dialog');
                    var msg = $('.full-message', $container).val();
                    var $addButton = $('.mg-button-add', $th_dialog);
                    var $area = $(this).find('.mg-message').bind('keyup', function() {
                        var $label = $(this).prev('label[for=' + $(this).attr('id') + ']');
                        if (msg === '' && ($(this).val() === '' || $(this).val() === $label.text())) {
                            $addButton.trigger('to_disable');
                        } else {
                            $addButton.trigger('to_enable');
                        }
                    });

                    IMVU.Client.util.addDisableEvents($addButton);
                    $area.val(msg);
                    IMVU.Client.util.hint([$area]);

                    if (msg.length > 0) {
                        $('span', $addButton).html(self.constants().UPDATE);
                    } else {
                        $('span', $addButton).html(self.constants().ADD);
                    }
                    
                    var $counter = $('.message-counter', $th_dialog);
                    if ($counter.length === 0) {
                        $counter = $('<div class="message-counter">500</div>')
                            .insertBefore($('.ui-dialog-buttonset > button:first', $th_dialog));
                    }
                    var conf = {
                        $area: $area,
                        $counter: $counter
                    };
                    IMVU.Client.util.countInputChars(conf);
                    $area.trigger('keyup');
                },
                resizable: false
            });
        });
    };

    MassGiftingSytem.prototype.getMessageInfoRequestCallback = function(response, error) {
        var self = this;
        if (!response) {
            return;
        }
        if (error) {
            self.dialogClose();
            return;
        }
        this.siteData.dialogRef = $('.im-dialog');
        var $container = $('.container', this.siteData.dialogRef);
        var $buttonSend = $('.mass-gifting-dialog').find('button.mg-button-send');
        var data = this.serviceData = $.extend(response, this.data);
        data.gift_product.name =  IMVU.Client.util.truncate(data.gift_product.name, 30);
        data.gift_product.creator_name =  data.gift_product_creator;
        var buddies = data.buddies;
        for (var i = 0, len = buddies.length; i < len; i++) {
            buddies[i].shortName = buddies[i].name;
        }
        data.holidays_ordered = _.keys(data.holidays).sort();
        data.gift_wrap_choices_ordered = _.sortBy(data.gift_wrap_choices, function(app) {
            return parseInt(app.sort_order);
        });
        data.firstWrap = '';
        if (data.gift_wrap_choices_ordered[0]) {
            data.firstWrap = data.gift_wrap_choices_ordered[0].id;
        }

        var template = IMVU.Client.util.generateHtml('.mass-gifting-template', data);
        $container.html(template);

        $container = this.applyOtherTemplates($container, data);
        $container.removeClass('hidden');
        
        $buttonSend.bind('click', function() {
            $(this).trigger('to_disable');
            self.siteData.dialogWithHeaderFooter.trigger('showSpinner');
            self.sendGift($container);
        });
        $('.mass-gifting-dialog').find('button.mg-button-cancel').bind('click', function() {
            self.dialogClose();
        });
        $('.mass-gifting-dialog').find('button.mg-button-ok').bind('click', function() {
            self.siteData.dialogWithHeaderFooter.trigger('hide-submit-error');
        });

        this.setupFriendsList($container, $buttonSend);
        this.setupSearchContainer($container);
        this.setupGiftWrapContainer($container);
        this.setupMessageContainer($container);
        this.preselectRecipient($container);

        IMVU.Client.util.addDisableEvents($buttonSend);
        $buttonSend.trigger('to_disable');
    };

    MassGiftingSytem.prototype.dialogClose = function() {
        imvu.call('endDialog', {});
    };

    MassGiftingSytem.prototype.sendGift = function($dialog) {
        var $friendsContainer = $('.mg-friends-list', $dialog);
        var $selected = $('.selected', $friendsContainer);
        var arrSelectedIds = [];

        for (var i = 0, len = $selected.length; i < len; i++) {
            arrSelectedIds.push($($selected[i]).data('cid'));
        }

        var postargs = {
            recipients: arrSelectedIds,
            gifts: [{ gift_id: parseInt(this.serviceData.gift_product.pid), gift_type: "product" }],
            message: $dialog.find('.full-message').val(),
            public: false,
            giftwrap_id: $dialog.find('.show-gift-wraps').data('wrap_id'),
            source: 'mass_gifting_client'
        };
        var $date_available = $dialog.find('.deliver-select').val();
        if ($date_available != '0') {
            postargs.date_available = $date_available;
        }
        if (recipientAvatarname) {
            postargs.source = 'mass_gifting_shop_together';
        }
        var spec = {
            method: 'POST',
            uri: IMVU.REST_DOMAIN + '/quickmessages/' + this.serviceData.cid + '/outbox',
            network: network,
            imvu: imvu,
            json: true,
            data: postargs,
            callback: this.handleSubmit.bind(this)
        };

        serviceRequest(spec);
    };

    // nonfriend, non-friend
       // nonfriend, non-friend
    
    MassGiftingSytem.prototype.addNonFriendEvents =  function(){
      var self = this;
      
      this.$container.find(".add-as-gift").unbind("click").bind('click', function(event) {
        var searchStr = self.$searchBox.hasClass('hint') ? '' : self.$searchBox.val();
        self.searchByService(searchStr);
      });
      
    };
    
    MassGiftingSytem.prototype.isCidInBuddies = function(cid){
         var buddies = this.serviceData.buddies;
         for (var i=0,len = buddies.length; i<len; i++){
             if (buddies[i].cid == cid) {
                 return true;
             }
         }
         return false;
     };
     
    MassGiftingSytem.prototype.searchByService = function(searchString, callback){
        var self = this;
        if (searchString.length === 0) {
            return;
        }
        var errorHandler = function(response){
            // this is invalid avatarname
            var errorMsg = IMVU.Client.util.generateHtml('.mg-invalid-avatarname-msg-template', {
                name: _.escape(searchString)
            });
            var $friend_container = $('#mgifting-dialog .container .mg-friends-list .mg-friends');

            $('.not-friend-msg', $friend_container).empty().html(errorMsg).removeClass('hidden');
            $('#mg-friends-list', $friend_container).addClass('not-find-friend-bg');
            self.setEnableShowAll();
        };
        network.asyncRequest('GET', IMVU.REST_DOMAIN + "/users/avatarname/" + escape(searchString), {
            success: function(response){
                 var responseText = response.responseText;
               
                if(responseText.status === "success" && !responseText.data.is_persona) {
                    var data = responseText.data,
                        cid = parseInt(data.id.substr( data.id.lastIndexOf("/") + 1 ));

                    if (self.isCidInBuddies(cid)) {
                        var $buddyContainer = $(".mg-friend-" + cid,this.$container);
                        if (!$buddyContainer.hasClass("disabled")) {
                            if (data.are_buddies) {
                                $(".mg-search-cancel",this.$container).trigger("click");
                                $(".mg-friend-" + cid,this.$container).addClass("selected").focus();
                            } else {
                                self.showAvatarnameLoadedTemplate(searchString);
                            }
                        } else {
                            $(".mg-search-cancel",this.$container).trigger("click");
                            var $friends_list = $('#mg-friends-list .friend');
                            $friends_list.addClass('hidden');
                            var errorMsg = IMVU.Client.util.generateHtml('.mg-nonfriend-invalid-template', {
                                name: _.escape(data.avatarname),
                                cid: cid
                            });
                            $('.not-friend-msg', self.$mgFriendsList).html(errorMsg).removeClass('hidden');
                            $('#mg-friends-list', self.$mgFriendsList).addClass('not-find-friend-bg');
                            $(".to-friend-list", self.$mgFriendsList).unbind("click").bind("click", function(){
                                $(".mg-search-cancel").trigger("click");
                                self.$searchBox.show();
                            });
                            $(".non-friend-sector", this.$mgFriendsList).hide();
                            self.setEnableShowAll();
                        }
                        self.$container.trigger('select_change');
                        
                        if (callback) {                            
                            callback();
                        }
                        
                        return;
                    }
                    
                    var buddy = {
                        cid: cid,
                        name: data.avatarname,
                        shortName: data.avatarname,
                        avpic_url: data.photo,
                        is_ap: data.is_ap,
                        birthday: data.birthday,
                        ap_class: (data.is_ap || data.is_ap == 'true') ? "" : "hidden",
                        additional_class : "",
                        are_buddies: data.are_buddies,
                        load_by_search: true
                    };
                    self.serviceData.buddies.push(buddy);
                    var friend_html = IMVU.Client.util.generateHtml('.mg-friend-template', buddy);
                    var $friend_div = $(friend_html).addClass("selected");
                    $friend_div.find('.friend-img').attr('src', buddy.avpic_url);
                    if (data.are_buddies) {
                        // it is not-loaded friend
                        var $friend_container = $('#mgifting-dialog .container .mg-friends-list .mg-friends');
                        $friend_div.find('.friend-img').attr('src', buddy.avpic_url);
                        $friend_container.append($friend_div);
                        $(".mg-search-cancel").trigger("click");
                        $(".mg-friend-" + cid,this.$container).addClass("selected").focus();
                    } else {
                        var $nonfriendSection = $(".non-friend-sector", self.$mgFriendsList);
                        if ($nonfriendSection.length === 0) {
                            var html = IMVU.Client.util.generateHtml('.mg-nonfriend-section-template', {});
                            $(html).appendTo(self.$mgFriendsList.find(".mg-friends"));
                            $nonfriendSection = $(".non-friend-sector", self.$mgFriendsList).hide();
                        }
                        $friend_div.addClass("non-friend").appendTo($nonfriendSection.find(".non-friend-list"));

                        self.$container.trigger('select_change');

                        var html = IMVU.Client.util.generateHtml('.mg-nonfriend-success-template', {
                            name: _.escape(data.avatarname),
                            cid: cid
                        });
                        $('.not-friend-msg', self.$mgFriendsList).html(html).removeClass('hidden');
                        $(".to-friend-list", self.$mgFriendsList).unbind("click").bind("click", function(){
                            $(".mg-search-cancel").trigger("click");
                            self.$searchBox.show();
                        });
                        //$('#mg-friends-list', $this).addClass('not-find-friend-bg');
                        //self.addNonFriendEvents();
                        
                        // searchbox 
                        //var $searchContainer = $('.mg-search-container', self.$container);
                        //self.$searchBox = $('.mg-search', $searchContainer).hide();
                        $(".non-friend-sector", this.$mgFriendsList).hide();
                    }
                    
                    if (callback) {                    
                        callback();
                    }
                        
                } else {
                    errorHandler(response);
                }
                self.setEnableShowAll();
            },
            failure: errorHandler
        });
    }; 

    IMVU.massGiftingSystem = new MassGiftingSytem(); 
}

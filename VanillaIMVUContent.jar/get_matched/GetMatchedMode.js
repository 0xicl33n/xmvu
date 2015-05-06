function GetMatchedMode(args) {
    this.$root = $(args.root);
    this.$endOfTheInternet = this.$root.find('.end-of-internet-container');
    this.$searchPreferences = this.$root.find('.search-preferences');
    this.$recommendation = this.$root.find('.header');
    this.$sideBar = this.$root.find('.side-bar');
    
    this.$paneLayer1 = this.$root.find('.pane.layer1');
    this.$paneLayer2 = this.$root.find('.pane.layer1').clone().removeClass('layer1').addClass('layer2');
    this.$paneLayer3 = this.$root.find('.pane.layer1').clone().removeClass('layer1').addClass('layer3');
    this.$root.find('.pane-collection').append(this.$paneLayer2).append(this.$paneLayer3);
    
    this.disableAnimation = args.disableAnimation || false;
    this.imvu = args.imvu;
    this.rest = args.rest;
    this.Promise = args.Promise;
    this.eventBus = args.eventBus;
    this.getMatchedUrl = this.imvu.call('getGetMatchedUrl');
    this.shouldShowSurvey = this.imvu.call('shouldShowSurvey');
    this.recommendationQueue = [];
    this.seenRecommendations = [];
    this.currentRecommendation = null;
    this.currentRecommendationCid = null;
    this.currentRecommendationAvatarname = null;
    this.recommendationUri = '';
    this.recommendationsUrl = null;
    this.recommendationsInFlight = false;
    this.getUserUrl = this.imvu.call('getUserUrl');
    this.userInFlight = this.getUserUrl;
    this.progress = new GetMatchedDataModel;
    this.progress.on("change:progress", this.updateProgressSection.bind(this));
    this.searchPrefs = [];
    this.supportedLanguages = this.imvu.call('getSupportedLanguages');
    this.lastScrollTop = 0;
    this.currentScrollTop = 0;
    this.scrollOffset = 600;
    this.start = false;
    this.photos = [];

    this.$endOfTheInternet.hide();
    this.$searchPreferences.hide();
    this.$root.find('.preview-mode').hide();
    this.$root.find('.dialog-bg-inner').hide();
    this.getRecommendations();
    this.hasVIP = this.imvu.call('hasVIPPass');
    this.hasAccessPass = this.imvu.call('hasAccessPass');
    this.isTeen = this.imvu.call('isTeen');

    window.addEventListener('load', function() {
        if (this.imvu.call('shouldShowIntro')) {
            var ret = this.imvu.call('showGetMatchedDialog', { mode: 'intro' });
            this.imvu.call('recordIntroSeen');
            if (ret) {
                this.showProfilePane();
            }
        }
        this.$root.find('.dialog-bg').hide();
    }.bind(this), false);
    this.$root.find('.survey').toggle(this.shouldShowSurvey).toggleClass('ap', this.hasAccessPass).toggleClass('ga', ! this.hasAccessPass);
    this.$root.find('.survey.ga a').click(this.launchSurvey.bind(this, false));
    this.$root.find('.survey.ap a').click(this.launchSurvey.bind(this, true));
    this.$root.find('.ex').click(this.vote.bind(this, true));
    this.$root.find('.heart').click(this.vote.bind(this, false));
    this.$root.find('.layer1 .deactivate').click(this.showDeactivateDialog.bind(this));
    this.$root.find('.layer1 .activate').click(this.activateProfile.bind(this));
    this.$root.find('.dialog-bg').click(this.toggleImageDetails.bind(this, false));    
    this.$root.find('.done').click(this.showRecommendationsPane.bind(this));
    this.$root.find('.layer1 .edit-button').click(this.editModeVisibility.bind(this, true));
    this.$root.find('.layer1 .cancel-button').click(this.cancelEditMode.bind(this));
    this.$root.find('.layer1 .save-button').click(this.saveStory.bind(this));
    this.$root.find('.show-profile').click(this.showProfilePane.bind(this));
    this.$root.find('.search-prefs').click(this.showSearchPreferencesPane.bind(this));
    this.$root.find('.see-matches').click(this.showMatchesInInbox.bind(this));
    this.$root.find('.layer1 .select-photo').click(this.toggleImageDetails.bind(this, true));
    this.$root.find('.layer1 .remove').click(this.removePhoto.bind(this));
    this.$root.find('.layer1 .preview-button').click(this.togglePreviewMode.bind(this, true));
    this.$root.find('.preview-mode .close').click(this.togglePreviewMode.bind(this, false));
    this.$root.find('.my-profile').click(function() { $(this).find('.options').toggle(); });
    this.$root.find('.layer1 .ap-only').toggleClass('active', this.hasAccessPass);
    this.$root.find('.layer1 .ap-only').toggle(this.imvu.call('shouldSeeAPOnlyOption'));
    this.$root.find('.layer1 .ap-only.active .box').click(this.toggleAPOnlyProfile.bind(this));
    if (!this.hasAccessPass) {
        this.$root.find('.layer1 .ap-only').css('cursor', 'pointer').unbind('click').click(this.showApUpsellDialog.bind(this));
        this.$root.find('.layer1 .ap-only .box, .layer1 .ap-only .ap, .layer1 .ap-only .faux-link').css('cursor', 'pointer');  //  the css could be re-written to remove this
    }
    this.$root.find('.layer1 .edit-story').bind('input propertychange', this.updateCharacterCount.bind(this));    
    this.$root.find('.progress').click(this.showProgressDialog.bind(this));
    this.$root.find('.layer1 .flag-button').click(this.showFlaggingDialog.bind(this));
    this.$root.find('.save-prefs-button').click(this.savePrefs.bind(this));
    this.$root.find('.cancel-prefs-button').click(this.donePrefs.bind(this));
    this.$root.find('.search-options-container .gender .female').click(this.highlightGender.bind(this, '.female'));
    this.$root.find('.search-options-container .gender .male').click(this.highlightGender.bind(this, '.male'));
    this.$root.find('.search-options-container .ap_ga .all').click(this.highlightApGa.bind(this, '.all'));
    this.$root.find('.search-options-container .ap_ga .ga').click(this.highlightApGa.bind(this, '.ga'));
    this.$root.find('.search-options-container .ap_ga .ap').click(this.highlightApGa.bind(this, '.ap'));
    this.$root.find('.search-options-container .vip').click(this.highlightVIP.bind(this));
    this.$root.find('.search-options-container .vip-upsell-text').click(this.showVIPUpsell.bind(this));
    this.$root.find('.ap-upsell-text').click(this.showApUpsellDialog.bind(this));
    this.$root.find('.how-to-play').click(this.showIntro.bind(this));
    
    this.$root.find('.layer1 .re-order-photos').click(this.showPhotoReorderDialog.bind(this));

    this.eventBus.register('getMatched.editStory', this.showEditStory.bind(this));
    this.eventBus.register('getMatched.editPhoto', this.showEditPhoto.bind(this));

    this.updateCharacterCount();
    this.$photoScrollbar = this.$root.find('.dialog-bg-inner ul');
    window.addEventListener('resize', function() {
        this.$photoScrollbar.attr('style', 'height:'+window.innerHeight+'px');
    }.bind(this), false);

    $(document).keypress(function(event){
        if (event.keyCode == 27) {
            this.$root.find('.dialog-bg').hide();
            this.$root.find('.dialog-bg-inner').hide();
            this.currentScrollTop = 0;
            this.lastScrollTop = 0;
        } else if (event.keyCode == 40 || event.keyCode == 34) {
            this.currentScrollTop = this.$photoScrollbar.scrollTop();
            this.lastScrollTop = this.lastScrollTop + this.scrollOffset;
            this.$photoScrollbar.scrollTop(this.lastScrollTop);
            if (this.currentScrollTop == this.$photoScrollbar.scrollTop()) {
                this.lastScrollTop = this.lastScrollTop - this.scrollOffset;
            }
        } else if (event.keyCode == 38 || event.keyCode == 33) {
            this.currentScrollTop = this.$photoScrollbar.scrollTop();
            this.lastScrollTop = this.lastScrollTop - this.scrollOffset;
            this.$photoScrollbar.scrollTop(this.lastScrollTop);
            if (this.currentScrollTop == this.$photoScrollbar.scrollTop()) {
                this.lastScrollTop = this.lastScrollTop + this.scrollOffset;
            }
        }
     }.bind(this));

}

GetMatchedMode.prototype = {
    MAX_STORY_COUNT: 175,
    
    updateCharacterCount: function() {
        var count = this.MAX_STORY_COUNT - this.$root.find('.layer1 .edit-story').val().length;
        var text = (count > 1) ? _T(' characters remaining.') : _T(' character remaining.');
        
        if (count <= 0) {
            var val = this.$root.find('.layer1 .edit-story').val();
            this.$root.find('.layer1 .edit-story').val(val.substring(0, this.MAX_STORY_COUNT));
            count = 0;
            text = _T('No characters remaining.');
        }
        
        $('.layer1 .char-remaining .text').text(text);
        $('.layer1 .char-remaining .count').toggle(count > 0).text(count);
    },
    
    togglePreviewMode: function(showPreviewMode) {
        this.$root.find('.preview-mode').toggle(showPreviewMode);
        this.$recommendation
            .toggleClass('profile', !showPreviewMode)
            .toggleClass('preview',  showPreviewMode);
                    
        this.displayUser(this.rest.get(this.getMatchedUserUrl), !showPreviewMode, this.$root.find('.layer1'));
    },
    
    removePhoto: function(event) {
        var $target = $(event.target).parent().find('.select-photo');
        var args = {
            index: parseInt(event.target.id.substring(6), 10).toString(),
            photo_id: "0"
        };

        var userPromise =
            this.rest.post(this.getMatchedUserUrl, args)
                .then(function() {
                    this.rest.invalidate(this.getMatchedUserUrl);
                    return this.rest.get(this.getMatchedUserUrl);
                }.bind(this), function(r) {
                    this.networkFailure();
                }.bind(this))
                ['catch'](function(error) {
                    this.exceptionFailure(error);
                }.bind(this));

        this.displayUser(userPromise, true, this.$root.find('.layer1'));
    },

    exceptionFailure: function(e) {
        if (e.error.error === "AbortError") {
            return;
        }
        this.networkFailure();
        this.imvu.call('closeModeWithModeId', 'GetMatched');
    },
    
    networkFailure: function() {
        this.imvu.call(
            'showErrorDialog',
            _T('Network Error'),
            _T("There was a problem. It's our fault, not yours. Please check your network connection and try again.")
        );
        return;
    },

    toggleImageDetails: function(show, event) {
        if ($(event.target).hasClass('is-own')) {
            var allowAP = this.$root.find('.layer1 .ap-only .box').hasClass('checked'),
                ret = this.imvu.call('showPhotoSelectionDialog', allowAP),
                args = {};
            if (ret) {
                args.index = parseInt(event.target.id.substring(8), 10).toString();
                args.photo_id = parseInt(ret, 10).toString();
                this.rest.post(this.getMatchedUserUrl, args)
                    .then(function(r) {
                        this.rest.invalidate(this.getMatchedUserUrl);
                        this.showProfilePane();
                    }.bind(this), function(r) {                        
                        if (r.error.error === "GET_MATCHED_UPDATE-002") {
                            this.imvu.call(
                                    'showErrorDialog',
                                    _T('Photo Selection Error'),
                                    _T('You must select a photo you took within IMVU.')
                            );
                        } else if (r.error.error === "GET_MATCHED_UPDATE-003") {
                            this.imvu.call(
                                'showErrorDialog',
                                _T('Photo Selection Error'),
                                _T('You must select a photo that is not already being used.')
                            );
                        } else {
                            this.imvu.call(
                                    'showErrorDialog',
                                    _T('Photo Selection Error'),
                                    _T('There was a problem saving that photo.')
                            );
                        }
                    }.bind(this), function(r) {
                        this.networkFailure();
                    }.bind(this))
                    ['catch'](function(error) {
                        this.exceptionFailure(error);
                    }.bind(this));
            }
        } else {
            this.lastScrollTop = 0;
            this.currentScrollTop = 0;
            this.$photoScrollbar.scrollTop(this.lastScrollTop); // need to reset
            this.$root.find('.dialog-bg').toggle(show);
            this.$root.find('.dialog-bg-inner').toggle(show);

            if (show) {
                var index = parseInt(event.target.id.substring(8), 10);
                this.$photoScrollbar.scrollTop($('.enlarged-img').eq(index).position().top);
            }
        }
    },
    
    getRecommendations: function() {
        var response;
        if (!this.start) {
            this.start = true;
            response = this.rest.post(this.getMatchedUrl, {id: this.getUserUrl})
                .then(function(r) {                    
                    this.getMatchedUserUrl = r.url;
                    return this.rest.get(this.getMatchedUserUrl);
                }.bind(this))
                .then(function(r) {
                    this.$sideBar.removeClass('loading');
                    this.progress.set({ progress: r.response.data.progress });
                    this.searchPrefs = r.response.data.search_preferences;
                    this.heartUrl = r.response.relations.hearts;
                    this.exUrl = r.response.relations.exes;
                    this.recommendationsUrl = r.response.relations.recommendations;
                    this.rest.cancelAll(this.userInFlight);
                    this.userInFlight = this.recommendationsUrl;
                    this.recommendationsInFlight = true;
                    return this.rest.get(this.recommendationsUrl);
                }.bind(this));
        } else {
            this.recommendationsInFlight = true;
            response = this.rest.get(this.recommendationsUrl);
        }

        response.then(function(r) {
            this.recommendationsInFlight = false;
            if (! r) {
                this.imvu.call('closeModeWithModeId', 'GetMatched');
                return;
            } 
            var foundNewRecommendation = false;
            _.each(r.response.data.items, function(rec, pos) {
                if (this.seenRecommendations.indexOf(rec) === -1) {
                    foundNewRecommendation = true;
                    this.recommendationQueue.push(rec);
                }
            }.bind(this));
            if (! foundNewRecommendation) {
                this.showTheEndOfTheInternet();
            } else {
                this.displayNextRecommendation();
            }
        }.bind(this))
        ['catch'](function(error) {
            this.exceptionFailure(error);
        }.bind(this));
    },

    launchSurvey: function(isAp, event) {
        if (isAp) {
            this.imvu.call('launchApSurvey');
        } else {
            this.imvu.call('launchSurvey');
        }
        $('.survey').hide();
    },

    vote: function(ex, event) {
        var url = (ex) ? this.exUrl : this.heartUrl;
        if ($(event.target).hasClass('disabled')) {
            return;
        }
        
        $('.ex, .heart').addClass('disabled');
        this.rest.post(url, {id:this.recommendationUri})
            .then(function(r) {
                return (this.disableAnimation) ? this.Promise.accept(r) : this.animatePane(ex, r);
            }.bind(this))
            .then(function(r) {
                $('.ex, .heart').removeClass('disabled');
                this.displayNextRecommendation();
            }.bind(this), function(r) {
                $('.ex, .heart').removeClass('disabled');
                if (r.error.error === "GET_MATCHED_HEART-001") {
                    var ret = this.imvu.call('showGetMatchedDialog', { mode: 're-activate' });
                    if (ret) {
                        this.rest.post(this.getMatchedUserUrl, {status: 'active'})
                            .then(function() {
                                this.vote(ex, event);
                            }.bind(this), function(r) {
                                this.networkFailure();
                            }.bind(this))
                            ['catch'](function(error) {
                                this.exceptionFailure(error);
                            }.bind(this));
                    }
                }
            }.bind(this))
            ['catch'](function(error) {
                $('.ex, .heart').removeClass('disabled');
                this.exceptionFailure(error);
            }.bind(this));
        if (!this.recommendationsInFlight && this.recommendationQueue.length <= 5) {
            this.rest.invalidate(this.recommendationsUrl);
            this.recommendationsInFlight = true;
            this.rest.get(this.recommendationsUrl)
                .then(function(r) {
                    this.recommendationsInFlight = false;
                    if (! r) {
                        return;
                    }
                    if (r.response.data.items.length > 0) {
                        this.recommendationQueue = this.recommendationQueue.concat(r.response.data.items);
                    }
                }.bind(this));
        }
    },
    
    animatePane: function(ex, response) {
        var r;
        var promise = new this.Promise(function(resolver) { r = resolver; });
        
        var $root = this.$root;
        var x = (ex) ? -150.0 : 150.0;
        var y = (ex) ? 225.0 : -225.0;
        var rot = 20.0;
        
        this.$root.find('.layer1').animate(
            {textIndent: 1.0},
            {
                step: function(now, tween) {
                    var angle = 'rotate(' + (now * rot) + 'deg)';
                    var position = ' translate(' + (now * x) + 'px, ' + (now * y) + 'px)';
                    $root.find('.layer1').css('-moz-transform', angle + position);
                    $root.find('.layer1').css('opacity', 1.0 - now);
                    
                    $root.find('.layer2').css('top', (15.0 - (15.0 * now)) + 'px');
                    $root.find('.layer3').css('top', (30.0 - (15.0 * now)) + 'px');
                },
                complete: function() {
                    $root.find('.layer1').css('textIndent', 0.0);
                    $root.find('.layer1').css('-moz-transform', '');
                    $root.find('.layer1').css('opacity', '');
                    
                    $root.find('.layer2').css('top', '');
                    $root.find('.layer3').css('top', '');
                    
                    $root.find('.layer3').css('opacity', 0.0);
                    $root.find('.layer3').animate({opacity: 1.0});
                    
                    r.accept(response);
                },
                easing: 'swing'
            });
        
        return promise;
    },

    cancelEditMode: function() {
        this.$root.find('.edit-story').text('');        
        this.editModeVisibility(false);
    },
    
    editModeVisibility: function(visible) {
        this.$root.find('.layer1 .story-container').toggleClass('edit-mode', visible);
        this.$root.find('.layer1 .edit-story').val(this.$root.find('.layer1 .story').text());
        this.updateCharacterCount();
    },

    showTheEndOfTheInternet: function() {
        this.$recommendation.hide();
        this.$endOfTheInternet.show();
        this.$searchPreferences.hide();
    },
   
    showProfilePane: function() {
        this.$recommendation.show();
        this.$endOfTheInternet.hide();
        this.$searchPreferences.hide();
        this.rest.cancelAll(this.userInFlight);
        this.userInFlight = this.getMatchedUserUrl;
        return this.displayUser(this.rest.get(this.getMatchedUserUrl), true, this.$root.find('.layer1'));
    },

    showEditStory: function() {
        this.showProfilePane();
        this.$recommendation.find('.layer1 .edit-button').click();
        this.$recommendation.find('.layer1 .edit-story').focus();
    },

    showEditPhoto: function() {
        this.showProfilePane().then(function(r) {
            this.$recommendation.find('.empty').first().click();
        }.bind(this));
    },

    saveStory: function() {
        var newStory = this.$root.find('.layer1 .edit-story').val().substring(0, this.MAX_STORY_COUNT);
        this.$root.find('.layer1 .edit-story').attr('disabled', true);
        this.$root.find('.layer1 .cancel-button').attr('disabled', true);
        this.$root.find('.layer1 .save-button').attr('disabled', true);
        var newStoryEscaped = newStory.replace(/[\u0000-\u001F]+/g, " ");
        this.rest.post(this.getMatchedUserUrl, {story: newStoryEscaped})
            .then(function(r) {
                this.rest.invalidate(this.getMatchedUserUrl);
                this.$root.find('.layer1 .edit-story').attr('disabled', false);
                this.$root.find('.layer1 .story-container').removeClass('edit-mode');
                this.showProfilePane();
            }.bind(this), function(r) {
                this.$root.find('.layer1 .edit-story').attr('disabled', false);
                this.networkFailure();
            }.bind(this))
            ['catch'](function(error) {
                this.exceptionFailure(error);
            }.bind(this));
    },

    showRecommendationsPane: function() {
        this.$recommendation.show();
        this.$endOfTheInternet.hide();
        this.$searchPreferences.hide();
        this.$recommendation.addClass('loading');
        this.$root.find('.done').attr('disabled', true);
        if (this.currentRecommendation === undefined) {
            this.displayNextRecommendation();
        } else {
            var userPromise = this.rest.get(this.currentRecommendation)
                .then(function(r) {
                    return this.rest.get(r.response.relations.ref);
                }.bind(this), function(r) {
                    this.networkFailure();
                }.bind(this))
                ['catch'](function(error) {
                    this.exceptionFailure(error);
                }.bind(this));
            this.displayUser(userPromise, false, this.$root.find('.layer1'));
        }
    },

    showMatchesInInbox: function() {
        this.imvu.call('showInboxMode', 'get-matched');
    },

    showSearchPreferencesPane: function() {
        //Default - {"gender":"all","ap_ga":"all","vip":false,"age_min":18,"age_max":100,"language":"all"}
        this.$langOpt = $('.search-options-container .langOpt');
        for (var x in this.supportedLanguages){
            var $el = $('<option>' + this.supportedLanguages[x][0] + '</option>');
            $el.addClass('ui-event');
            $el.attr('data-ui-name', this.supportedLanguages[x][1]);
            $el.attr('value', this.supportedLanguages[x][1]);
            $el.attr('selected', this.supportedLanguages[x][1] === this.searchPrefs.language);
            this.$langOpt.append($el);
        }

        var genderSelector = '.gender .' + this.searchPrefs.gender;
        if (this.searchPrefs.gender == "all") {
            genderSelector = '.gender span';
        }
        this.$searchPreferences.find(genderSelector).toggleClass('active', true);
        
        this.$searchPreferences.find('.vip-upsell-text').css('visibility', !this.hasVIP ? 'visible' : 'hidden');
        this.$searchPreferences.find('.ap-upsell-text').css('visibility', (!this.isTeen && !this.hasAccessPass) ? 'visible' : 'hidden');
        
        this.$searchPreferences.find('.ap_ga').toggle(!this.isTeen);
        if (!this.isTeen) {
            var ap_ga_current_pref = this.searchPrefs.ap_ga;
            if (ap_ga_current_pref == 'ap') {
                if (this.hasAccessPass) {
                    this.highlightApGa('.ap');
                } else {
                    this.highlightApGa('.all');
                }
            } else if (ap_ga_current_pref == 'ga') {
                this.highlightApGa('.ga');
            } else if (ap_ga_current_pref == 'all') {
                this.highlightApGa('.all');
            }          
        }
        
        if (this.hasVIP) {
            if (this.searchPrefs.vip) {
                this.$searchPreferences.find('.vip').addClass('active');
            } else {
                this.$searchPreferences.find('.vip').removeClass('active');
            }
        }
        
        this.$searchPreferences.find('.search-options-container').toggleClass('teen', this.isTeen);
        
        var min = this.searchPrefs.age_min < 18 ? 13 : 18;
        var max = this.searchPrefs.age_min < 18 ? 17 : 100;

        this.$searchPreferences.find('.age-d span.lower').text(this.searchPrefs.age_min);
        this.$searchPreferences.find('.age-d span.upper').text(this.searchPrefs.age_max);
        this.$searchPreferences.find('.age-range').slider({
            range: true,
            min: min,
            max: max,
            values: [this.searchPrefs.age_min, this.searchPrefs.age_max],
            slide: function (event, ui) {
                this.updateAgeRange(ui.values[0], ui.values[1]);
            }.bind(this),
            change: function (event, ui) {
                this.updateAgeRange(ui.values[0], ui.values[1]);
            }.bind(this)
        });
        
        this.$recommendation.hide();
        this.$endOfTheInternet.hide();
        this.$searchPreferences.show();
    },
    
    updateAgeRange: function(lower, upper) {
        this.$searchPreferences.find('.age-d span.lower').text(lower);
        this.$searchPreferences.find('.age-d span.upper').text(upper);
    },

    highlightGender: function(selector) {
        this.$searchPreferences.find('.gender ' + selector).toggleClass('active');
        var female = this.$searchPreferences.find('.gender .female').hasClass('active');
        var male = this.$searchPreferences.find('.gender .male').hasClass('active');
        if (!female && !male) {
            this.$searchPreferences.find('.gender ' + selector).toggleClass('active'); 
        }
    },
    
    highlightApGa: function(selector) {
        if (!this.hasAccessPass && selector === '.ap') {
            return this.showApUpsellDialog();
        }
        _.each(this.$searchPreferences.find('.ap_ga span'), function(selector, i) {
            $(selector).removeClass('active');
        });
        this.$searchPreferences.find('.ap_ga ' + selector).addClass('active');
    },
    
    highlightVIP: function() {
        if (this.hasVIP) {
            this.$searchPreferences.find('.vip').toggleClass('active');
        } else {
            this.showVIPUpsell();
        }
    },
    
    showVIPUpsell: function() {
        this.imvu.call('showStandardVipUpsell');
    },
    
    showApUpsellDialog: function(e) {
        this.imvu.call('showApInfo');
    },
    
    savePrefs: function() {
        var args = {};
        args.language = $('.search-options-container .langOpt').val();
        
        var female = this.$searchPreferences.find('.gender .female').hasClass('active');
        var male = this.$searchPreferences.find('.gender .male').hasClass('active');
        var gender = female && male ? 'all' : (female ? 'female' : 'male');
        if (!female && !male) {
            gender = 'all';
        }
        args.gender = gender;

        var vip = this.$searchPreferences.find('.vip').hasClass('active');
        args.vip = vip;

        var age_range = this.$searchPreferences.find('.age-range').slider("values");
        args.age_min = age_range[0];
        args.age_max = age_range[1];

        var ap_ga = this.$searchPreferences.find('.ap_ga .active').attr('data-ui-name');
        args.ap_ga = ap_ga;

        this.$searchPreferences.addClass('loading');
        this.rest.post(this.getMatchedUserUrl, { search_preferences: args })
            .then(function(r) {
                this.searchPrefs = r.response.data.search_preferences;
                this.recommendationQueue = [];
                this.rest.invalidate(this.recommendationsUrl);
                this.getRecommendations();
                this.donePrefs();
                this.$searchPreferences.removeClass('loading');
            }.bind(this), function(r) {
                this.$searchPreferences.removeClass('loading');
                this.networkFailure();
            }.bind(this))
            ['catch'](function(error) {
                this.$searchPreferences.removeClass('loading');
                this.exceptionFailure(error);
            }.bind(this));
    },

    donePrefs: function() {
        this.$searchPreferences.hide();
        this.$recommendation.show();
    },

    toggleAPOnlyProfile: function() {
        var $toggle = this.$root.find('.layer1 .ap-only .box');
        $toggle.toggleClass('checked');
        var apOnlyProfile = $toggle.hasClass('checked');
        if (!!apOnlyProfile) {
            //  need to only show this once
            if (this.imvu.call('shouldShowAPOnlyDialog')) {
                this.imvu.call('showGetMatchedDialog', { mode: 'make-profile-ap' });
                this.imvu.call('recordAPOnlyDialogSeen');
            }
        } else {
            this.imvu.call('showGetMatchedDialog', { mode: 'make-profile-ga' });
        }
        this.rest.post(this.getMatchedUserUrl, { ap_profile: !!apOnlyProfile ? '1' : '0' })
            .then(function() {
                this.$root.find('.layer1').toggleClass('is-ap-profile', !!apOnlyProfile);
            }.bind(this), function(r) {
                $toggle.toggleClass('checked');
                this.networkFailure();
            }.bind(this))
            ['catch'](function(error) {
                this.exceptionFailure(error);
            }.bind(this));
    },

    showDeactivateDialog: function() {
        var ret = this.imvu.call('showGetMatchedDialog', { mode: 'de-activate' });
        if (ret) {
            this.rest.post(this.getMatchedUserUrl, {status: 'inactive'})
                .then(function() {
                    this.imvu.call('closeMode');
                }.bind(this), function(r) {
                    this.networkFailure();
                }.bind(this))
                ['catch'](function(error) {
                    this.exceptionFailure(error);
                }.bind(this));
        }
    },

    activateProfile: function() {
        this.rest.post(this.getMatchedUserUrl, {status: 'active'})
            .then(function() {
                this.$root.find('.layer1 .deactivate').toggle(true);
                this.$root.find('.layer1 .activate').toggle(false);
            }.bind(this), function(r) {
                this.networkFailure();
            }.bind(this))
            ['catch'](function(error) {
                this.exceptionFailure(error);
            }.bind(this));
    },

    showProgressDialog: function() {
        this.imvu.call('showGetMatchedDialog', { mode: 'progress', checked: this.progress.get("progress")});
    },

    showFlaggingDialog: function() {
        var dialogInfo = {
            'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
            'service_url': '/api/flag_content/flag_get_matched.php',
            'title':_T('Flag ') + '"' + this.currentRecommendationAvatarname + '"',
            'post_data': {
                'accused_id': this.currentRecommendationCid
            },
            'get_reasons_from_server': {
                'content_type': 'get_matched',
                'content_id': this.cid
            },
            'message': _T('Please tell us what you find inappropriate about this Get Matched profile. For your reference, you can find our Terms of Service') + '<a id="tos" href="http://www.imvu.com/catalog/web_info.php?section=Info&topic=terms_of_service"> ' + _T('here') + ':</a>'
        };
        ret = this.imvu.call('showModalFlaggingDialog', dialogInfo);
        if (ret) {
            this.$root.find('.ex').click();
        }
    },
    
    showPhotoReorderDialog: function() {
        var ret = this.imvu.call('showGetMatchedDialog', { mode: 're-order', photos: this.photos});
        
        if (ret !== false) {
            var userPromise = this.rest.post(this.getMatchedUserUrl, { photos_update: ret })
                .then(function(r) {
                    this.rest.invalidate(this.getMatchedUserUrl);
                    return this.rest.get(this.getMatchedUserUrl);
                }.bind(this));
            this.displayUser(userPromise, true, this.$root.find('.layer1'));
        }
    },
    
    updateProgressSection: function(model) {
        var curState = model.get("progress");
        var progress = (curState.length > 4) ? 4 : curState.length;
        var $el = this.$root.find('.progress');
        var progressStr = (progress * 25).toString() + "%";
        $el.find('.profile-complete').text(progressStr);
        $el.find('.percent').text(progressStr);
        $el.find('.percent-done').attr('style', 'width: ' + progressStr + ';');
    },

    displayNextRecommendation: function() {
        this.currentRecommendation = undefined;
        while (this.currentRecommendation === undefined && this.recommendationQueue.length > 0) {
            this.currentRecommendation = this.recommendationQueue.shift();
            if (this.seenRecommendations.indexOf(this.currentRecommendation) > -1) {
                this.currentRecommendation = undefined;
            }
        }
        if (this.currentRecommendation === undefined) {
            this.rest.invalidate(this.recommendationsUrl);
            this.$recommendation.addClass('loading');
            this.recommendationQueue = [];
            this.getRecommendations();
            return;
        }
        
        this.seenRecommendations.push(this.currentRecommendation);
        
        // fill in other layers first
        this.clearPane(this.$root.find('.pane'));
        _.each(_.first(this.recommendationQueue, 2), function(element, index) {
            var promise = this.getRecommendationPromise(element);
            this.displayUser(promise, false, this.$root.find('.layer'+(index+2)));
        }.bind(this));
        
        var promiseLayer1 = this.getRecommendationPromise(this.currentRecommendation);
        this.rest.cancelAll(this.userInFlight);
        this.userInFlight = this.currentRecommendation;
        this.displayUser(promiseLayer1, false, this.$root.find('.layer1'));
    },
    
    getRecommendationPromise: function(url) {
        return this.rest.get(url)
            .then(function(r) {
                this.recommendationUri = r.response.relations.ref;
                return this.rest.get(r.response.relations.ref);
            }.bind(this), function(r) {
                this.networkFailure();
            }.bind(this));
    },

    displayPhotos: function($thumbnails, $photos, pictures, is_own, is_top_layer) {
        // reset enlarged photos
        if (is_top_layer) {
            $photos.attr('src', false);
        }
        
        $thumbnails.toggleClass('empty', is_own).toggleClass('is-own', is_own).attr('style', false);
        
        $thumbnails.show();
        if (is_own && pictures.length < 5) {
            $thumbnails.slice(pictures.length+1).hide();
        }
        
        this.photos = _.map(pictures, function(value, key) {
            return {id: value.photo_id, url: value.full_url};
        });
        
        this.$recommendation.find('.footer-container').toggleClass('no-photos', pictures.length <= 1);
        _.each(pictures, function(picture, i) {
            var display_url = picture.thumb_url;
            if (i === 0) {
                display_url = picture.full_url;
            }
            // jQuery's .css() function works. However, it fails in tests for some reason.
            // So, setting the style attr lets us test this. - mslezak
            $thumbnails.eq(i).removeClass('empty').attr('style', 'background-image: url("' + display_url + '");');    
            
            if (is_top_layer) {
                $photos.eq(i).attr('src', picture.full_url);
            }
        });
    },

    displayUser: function(userPromise, is_own, $pane) {
        this.$recommendation.toggleClass('profile', is_own);
        return userPromise
            .then(function(r) {
                this.clearPane($pane);
                if (is_own) {
                    $pane.find('.edit-story').val(r.response.data.story);
                    this.progress.set({ state: r.response.data.progress });
                    $pane.find('.deactivate').toggle(r.response.data.status === 'active');
                    $pane.find('.activate').toggle(r.response.data.status === 'inactive');
                    $pane.find('.ap-only .box').toggleClass('checked', r.response.data.ap_profile === '1');
                }
                
                $pane.toggleClass('is-ap-profile', r.response.data.ap_profile == "1");
                $pane.find('.re-order-photos').toggle(r.response.data.photos.length > 1 && is_own)
                $pane.find('.imvu-button').attr('disabled', false);
                $pane.find('.user-info .story').text(r.response.data.story);
                this.displayPhotos($pane.find('.select-photo'), this.$root.find('.enlarged-img'), r.response.data.photos, is_own, $pane.hasClass('layer1'));
                return this.rest.get(r.response.relations.user);
            }.bind(this))
            .then(function(r) {
                $pane.find('.avatarname').text(r.response.data.username);
                
                if (! r.response.data.age) {
                    if (r.response.data.is_adult) {
                        $pane.find('.age').text(', 18+');
                    }
                } else {
                    $pane.find('.age').text(', ' + r.response.data.age);
                }
                
                if (r.response.data.gender) {
                    var gender = (r.response.data.gender === 'm') ? 'Male' : 'Female';
                    $pane.find('.profile-gender').text(', ' + gender);
                } else {
                    $pane.find('.profile-gender').text(''); //have to clear it 
                } 
                
                this.currentRecommendationCid = r.response.data.legacy_cid;
                this.currentRecommendationAvatarname = r.response.data.username;
                $pane.find('.user-details').toggleClass('has-vip', !!r.response.data.is_vip);
                $pane.find('.user-details').toggleClass('has-ap', !!r.response.data.is_ap);
                this.$recommendation.removeClass('loading');
            }.bind(this), function(r) {
                $pane.find('.imvu-button').attr('disabled', false);
                this.networkFailure();
                this.imvu.call('closeModeWithModeId', 'GetMatched');
            }.bind(this))
            ['catch'](function(error) {
                this.exceptionFailure(error);
            }.bind(this));
    },
    
    clearPane: function($pane) {
        $pane.find('.age').text('');
        $pane.find('.user-details').removeClass('has-vip').removeClass('has-ap');
        $pane.find('.avatarname').text('');
        $pane.find('.user-info .story').text('');
        $pane.find('.select-photo').attr('style', false);
    },
    
    showIntro: function() {
        var ret = this.imvu.call('showGetMatchedDialog', { mode: 'intro' });
        if (ret) {
            this.showProfilePane();
        }
    },
    
    // Called by GetMatchedMode.py!
    showMatchModal: function(avatarInfo, userPics, isOnline, info) {
        var ret = this.imvu.call('showGetMatchedDialog', { mode: 'its-a-match', userPics: userPics, avatarname: avatarInfo.avatarName, userId: avatarInfo.userId, isOnline: isOnline });
        this.rest.post(info.match_uri, {status: "5"})
            .then(function () {
                IMVU.Client.EventBus.fire('getMatchedNotification',{});
            }.bind(this));
        
    },
    
    // Called by GetMatchedMode.py!
    setProgress: function(progress) {
        this.progress.set({ progress: progress });
    }
}
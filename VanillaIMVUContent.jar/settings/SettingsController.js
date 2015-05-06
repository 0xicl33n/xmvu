function SettingsController(rootElement, prefMap, initialPage, imvu) {
    this.rootElement = rootElement;
    this.imvu = imvu;
    this.prefTypes = {};
    this._settingsList = [];
    this._sliderList = [];
    this._sliderDivs = [];
    this._initalSliderPrefs = [];

    this.renderPrefs(prefMap);

    YAHOO.util.Event.on(rootElement.querySelector('#settings_my_account'), 'click', function(){
        this.imvu.call('launchUrl', 'http://www.imvu.com/catalog/web_myaccount.php');
    }.bind(this));
    
    YAHOO.util.Event.on(rootElement.querySelector('#settings_web_inventory'), 'click', function(){
        this.imvu.call('launchUrl', 'http://www.imvu.com/catalog/web_inventory.php');
    }.bind(this));

    this.imvu.call('registerSettingsListeners', this._settingsList);
    this.setVersion();

    this.showRendererPreview();

    this.setupPageLinks();
    this.setPage(initialPage);

    var isAdmin = this.imvu.call('isAdmin');
    if (isAdmin || this.imvu.call('isCreator')) {
        $('#create-link').show();  
        if (isAdmin) {
            $('#section_submission').show();  
            $('#subsection_submission_desc').show();  
        } else {
            $('#section_submission').hide();  
            $('#subsection_submission_desc').hide();  
        }
    }
}

SettingsController.PREF_NAME_PREFIX_VOICE_VOLUME = "voiceVolume";

SettingsController.prototype = {
    _createCheckbox: function(prefInfo, description) {
        this.prefTypes[prefInfo.name] = 'checkbox';
        var div = document.createElement('div');

        if (!prefInfo.vipOnly || this.imvu.call('hasVIPPass')){
            var input = document.createElement('input'),
            label = document.createElement('label');
            input.id = prefInfo.name;
            label['for'] = prefInfo.name;
            label.innerHTML = description;
            label.insertBefore(input, label.firstChild);
            input.value = 'on';
            input.type = 'checkbox';
            input.checked = !!prefInfo.value;
            div.appendChild(label);
        } else {
            div.setAttribute('id', (prefInfo.name + 'Container'));
            div.innerHTML = '<span class="choice_desc">'+description+'</span>';
            var vipLink = document.createElement('div');
            vipLink.setAttribute('id', (prefInfo.name + 'VIPLink'));
            $(vipLink).addClass('vip-link');
            YAHOO.util.Event.on(vipLink, 'click', function (e) { this.imvu.call('showVipInfo') }.bind(this));
            div.appendChild(vipLink);
        }
        return [div, input];
    },

    _createSelect: function(prefInfo, description) {
        this.prefTypes[prefInfo.name] = 'select';
        var div = document.createElement('div');
        div.setAttribute('id', (prefInfo.name + 'Container'));
        div.innerHTML = '<span class="choice_desc">'+description+'</span>';

        var select = document.createElement('select');
        select.id = prefInfo.name;
        if (!prefInfo.vipOnly || this.imvu.call('hasVIPPass')){
            for each(var option in prefInfo.valid_values) {
                var o = document.createElement('option');
                o.value = option[0];
                o.textContent = option[1];
                o.selected = (option[0] === prefInfo.value);

                select.appendChild(o);
            }

            div.appendChild(select);
        } else {
            var vipLink = document.createElement('div');
            vipLink.setAttribute('id', (prefInfo.name + 'VIPLink'));
            $(vipLink).addClass('vip-link');
            YAHOO.util.Event.on(vipLink, 'click', function (e) { this.imvu.call('showVipInfo') }.bind(this));
            div.appendChild(vipLink);
        }
        return [div, select];
    },


    _createRadio: function(prefInfo, description) {
        this.prefTypes[prefInfo.name] = 'radio';
        var outer_div = document.createElement('div');
        outer_div.setAttribute('id', (prefInfo.name + 'Container'));
        outer_div.innerHTML = '<span class="choice_desc">'+description+'</span>';

        var div = document.createElement('div');
        div.id = prefInfo.name;
        var radios = [];

        var index = 1;
        for each(var option in prefInfo.valid_values) {
            var oid = prefInfo.name + index;
            index = index + 1;

            var o = document.createElement('input');
            o.value = option[0];
            o.type = 'radio';
            o.name = prefInfo.name;
            o.id = oid;
            o.checked = (option[0] === prefInfo.value);
            div.appendChild(o);

            var lbl = document.createElement('label');
            lbl.setAttribute('for', oid);
            lbl.textContent = option[1];
            div.appendChild(lbl);

            div.appendChild(document.createElement('br'));

            radios.push(o);
        }

        outer_div.appendChild(div);
        return [outer_div, radios];
    },

    _createSlider: function(baseDiv, prefInfo, description, labels, background_info, print_value_type) {
        this._initalSliderPrefs[prefInfo.name] = this.imvu.call('getPref', prefInfo.name);
        this.prefTypes[prefInfo.name] = 'slider';
        var result = createSlider(description, prefInfo.name, prefInfo.value, prefInfo.valid_values,
                                  labels, background_info, print_value_type);
        var div = result[0];
        var slider = result[1];
        baseDiv.appendChild(div);
        var self = this;
        slider.subscribe("change", function (newPixelValue) {
            if (!$(self.getPageForPref(div)).hasClass('hidden')) {
                self.imvu.call('setPref', prefInfo.name, slider.getValueToScale(newPixelValue));
                if ((prefInfo.name.indexOf(SettingsController.PREF_NAME_PREFIX_VOICE_VOLUME) === 0) && self.voiceControl) {
                    self.voiceControl.setRenderVolume(slider.getValueAsPercent(newPixelValue));
                }
            }
        });

        if (prefInfo.name.indexOf(SettingsController.PREF_NAME_PREFIX_VOICE_VOLUME) === 0) {
            if (!self.voiceControl || !self.voiceControl.channel_uri) {
                slider.disableUserInteraction();
            }
        }

        YAHOO.util.Event.on(this.rootElement.querySelector('#reset-' + prefInfo.name), 'click', function(){
            slider.setValueToScale(prefInfo.valid_values.mid);
        });
        this._sliderDivs[prefInfo.name] = div;
        this._sliderList[prefInfo.name] = slider;
    },

    getPageForPref: function(el) {
        if ($(el).hasClass('page')) {
            return el;
        } else if (el == null) {
            return null;
        } else {
            return this.getPageForPref(el.parentNode);
        }
    },


    setupPageLinks: function() {
        var self = this;
        $('.nav-link', this.rootElement).each(function (index, el) {
            var pageName = el.getAttribute('imvu:page');
            if (pageName) {
                YAHOO.util.Event.on(el, 'click', function(e) { self.setPage(pageName); });
            }
        });
    },

    setPage: function(pageName) {
        var self = this;
        $('.page', this.rootElement).each(function (index, el) {
            var sliderList = el.querySelectorAll('.slider');
            if (el.getAttribute('imvu:page') == pageName) {
                $(el).removeClass('hidden');
                for each( s in sliderList ) {
                    if (s.innerHTML != undefined) {
                        var name = s.querySelector('.name').innerHTML;
                        var slider = self._sliderList[name];
                        slider.thumb.resetConstraints();
                        if($(s).hasClass('initial')) {
                            slider.setValueToScale(self._initalSliderPrefs[name]);
                            $(s).removeClass('initial');
                        }
                        else {
                            slider.setValueToScale(self.imvu.call('getPref', name));
                        }
                    }
                }
            }
            else {
                if (!$(el).hasClass('hidden')) {
                     $(el).addClass('hidden');
                }
            }
        });

        $('.nav-link', this.rootElement).each(function (index, el) {
            if (el.getAttribute('imvu:page')) {
                if (el.getAttribute('imvu:page') == pageName) {
                    if (!$(el).hasClass('selected')) {
                         $(el).addClass('selected');
                    }
                }
                else {
                    $(el).removeClass('selected');
                }
            }
        });
    },

    disablePage: function(disableName) {
        $('.nav-link', this.rootElement).each(function (index, el) {
            var pageName = el.getAttribute('imvu:page');
            if (pageName == disableName) {
                el.style.display = "none";
            }
        });
    },

    setVersion: function() {
        var version = this.imvu.call('getVersion');
        if(version) {
            $('.version').html(_T('IMVU version') + ' ' + version);
        }
    },

    showRendererPreview: function(){
        this.imvu.call('showRendererPreview');
    },

    updatePref: function(name) {
        var node = this.rootElement.querySelector('#' + name);
        var val = this.imvu.call('getPref', name);

        var prefType = this.prefTypes[name];
        if (prefType === 'checkbox') {
            node.checked = val;
        } else if (prefType === 'select') {
            node.value = val;
        } else if (prefType === 'radio') {
            $('input', node).each(function (index, el) {
                el.checked = (el.value == val);
            });
        } else {
            throw new Error('Unknown element: ' + node.type + ' (' + prefType + ')');
        }
    },

    renderPrefs: function(prefmap) {
        for(var divId in prefmap) {
            if(divId) {
                var node = this.rootElement.querySelector('#' + divId);
            
                for each(var pref in prefmap[divId]) {
                    if (typeof pref === 'string') {
                        this._renderPref(node, pref);
                    } else if (typeof pref === 'function') {
                        pref(node, this.imvu);
                    } else {
                        this._renderPref(node, pref.name, pref.alt, pref.type, pref.labels);
                    }
                }
            }
        }
    },

    _renderPref: function(sectionDiv, prefname, altDescription, altMenuType, altLabels) {
        var prefInfo = this.imvu.call('getPrefInfo', prefname) || {};
        var desc = altDescription || prefInfo.description;
        var menu_type = altMenuType || prefInfo.menu_type;
        var labels, r, div;
        if (menu_type === 'hidden') {
            return;
        } else if (menu_type === 'slider') {
            labels = altLabels || prefInfo.labels || ['MIN', 'MAX'];
            this._createSlider(sectionDiv, prefInfo, desc, labels);
            sectionDiv.querySelector('.slider-reset').innerHTML = "Reset";
            sectionDiv.querySelector('.slider-reset').style.width = "65px";
            resetButton = new ImvuButton(
                sectionDiv.querySelector('.slider-reset'),
                {
                    grey : true,
                    small : true
                }
            );

            return;
        } else if (menu_type === 'sliderVolume') {
            labels = altLabels || prefInfo.labels || ['', ''];
            prefInfo.valid_values = {min:0, mid:100, max:200};
            this._createSlider(sectionDiv, prefInfo, desc, labels,
                {url:"img/slider_background_volume.png"}, 'percent');
            return;
        } else if(menu_type === 'checkbox') {
            r = this._createCheckbox(prefInfo, desc);
            
            div = r[0];
            var checkbox = r[1];

            sectionDiv.appendChild(div);
            if (prefInfo.serverPref){
                YAHOO.util.Event.on(checkbox, 'change', this.onClickServerCheckboxPref.bind(this, prefInfo.name));
            }else {
                YAHOO.util.Event.on(checkbox, 'change', this.onClickCheckboxPref.bind(this, prefInfo.name));
            }
        } else if(menu_type === 'radio') {
            r = this._createRadio(prefInfo, desc);
            div = r[0];
            var radios = r[1];

            sectionDiv.appendChild(div);
            for each(var radio in radios) {
                YAHOO.util.Event.on(radio, 'click', this.onRadioPref.bind(this, prefInfo.name));
            }
        } else {
            r = this._createSelect(prefInfo, desc);
            div = r[0];
            var select = r[1];
            sectionDiv.appendChild(div);
            if (prefInfo.serverPref){
                YAHOO.util.Event.on(select, 'change', this.onSelectServerStorePref.bind(this, prefInfo.name));
            } else if (prefInfo.localStore){
                YAHOO.util.Event.on(select, 'change', this.onSelectLocalStorePref.bind(this, prefInfo.name));
            } else {
                YAHOO.util.Event.on(select, 'change', this.onSelectPref.bind(this, prefInfo.name));
            }
        }

        this._settingsList.push(prefname);
    },

    onClickCheckboxPref: function(prefname, evt) {
        this.imvu.call('log', 'onClickCheckboxPref ' + prefname);
        var newVal = evt.originalTarget.checked;
        this.imvu.call('setPref', prefname, newVal);
    },

    onClickServerCheckboxPref: function(prefname, evt){
        this.imvu.call('log', 'onClickServerCheckboxPref ' + prefname);
        var newVal = evt.originalTarget.checked;
        this.imvu.call('setServerPref', prefname, newVal);
    },

    onSelectPref: function(prefname, evt) {
        this.imvu.call('log', 'onSelectPref ' + prefname);
        var newVal = evt.originalTarget.value;
        this.imvu.call('setPref', prefname, newVal);
    },
    
    onSelectLocalStorePref: function(prefname, evt) {
        this.imvu.call('log', 'onSelectLocalStorePref ' + prefname);
        var newVal = evt.originalTarget.value;
        this.imvu.call('setLocalStoreValueForUser', prefname, parseInt(newVal));
    },

    onSelectServerStorePref: function(prefname, evt) {
        this.imvu.call('log', 'onSelectServerStorePref ' + prefname);
        var newVal = evt.originalTarget.value;
        
        if (prefname == 'shop-together-room') {
            var myRoomId = this.imvu.call('myRoomId');
            if (myRoomId == parseInt(newVal)) {
                this.imvu.call(
                        'showErrorDialog',
                        _T('Please select another room.'),
                        _T("You may not use the same room as default background for Shop Together and My Room.")
                );
                return;
            }
        }
        this.imvu.call('setServerRoomPref', prefname, parseInt(newVal));
    },

    onRadioPref: function(prefname, evt) {
        this.imvu.call('log', 'onRadioPref ' + prefname);
        var newVal = evt.originalTarget.value;
        this.imvu.call('setPref', prefname, newVal);
    },
};


function settingsSetupController(rootElement, imvu) {

    var advanced = ['graphicsRenderer'];
    if ((!IMVU.isMacOSX()) || imvu.call('isAdmin') || imvu.call('isQA')) {
        advanced.push('showFrameRate');
    }

    if (imvu.call('shouldSeeFeature', 'fixedCameraSetting')){
        advanced.push('enableFixedCamera');
    }

    advanced.push('enableFlashWidgets');
    advanced.push('dress-up-room');
    advanced.push('shop-room');
    advanced.push('shop-together-room');

    var settings = {
        'section_general':['runOnStartup', 'notifyBackground', 'notifyChatNow', 'client.is_current_location_hidden', 'enableBirthdayNotification', {name:'avatarLabelDisplay', type:'radio'}],
        'section_sound':['enableProductSounds','enableChatInviteSound','enableBuddyOnlineSound'],
        'section_advanced': advanced,
        'section_login_rewards' : ['client.enableLoginRewards'],
        'section_language': [{name:'translationLanguage', type:'radio'}],
        'section_submission' : ['createMode_enableSubmitAnyCategory'],
        'section_material' : ['createMode_enableChangeMaterialName'],
    };
    if(imvu.call('inAutoCompleteRollout')) { 
        settings['section_general'].push('client.avatar_name_auto_complete');
    }
     
    if (!imvu.call('getImvuConfigVariable', 'client.login_rewards')) {
        $('#section_login_rewards').hide();
    }

    if (imvu.call('getImvuConfigVariable', 'client.RENEW_Coop1b') == 'active') {
       settings['section_block_action'] = [function(root, imvu) { new BlockActionSettings(root, imvu); }];
        $('#block-action-link').show();  
    }

    if (imvu.call('shouldShowToasts')) {
        settings.section_general.push('enableRealtimeFriendNotification');
        settings.section_general.push('enableRealtimeMessageNotification');
    }

    if (imvu.call('shouldSeeFeature', 'defaultOutfitChanges')){
        settings.section_general.push('setAsDefaultWhenCreatingOutfit');
    }
    
    settings.section_general.push('client.enableAutoBoot');
    if (imvu.call('getCustomerId') < 42000000){
        settings.section_advanced.push({name:'frameIntervalMultiplier', labels:[_T("FAST"), _T("SLOW")], type:'slider'});
    }

    return new SettingsController(rootElement, settings, 'chat', imvu);
}

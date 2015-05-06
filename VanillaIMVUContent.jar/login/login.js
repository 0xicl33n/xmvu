function login(args) {
    this.$root = $(args.root);
    this.imvu = args.imvu;
    this.window = args.window;

    this.$langOpt = this.$root.find('#langOpt');
    this.$langSel = this.$root.find('#langSel');

    this.$newUserRegisterLink = this.$root.find('#new_user_top a');
    this.$signupLink = this.$root.find('.signup a');
    this.$newUserRegisterLink.add(this.$signupLink).unbind('click').click(function () {
        this.imvu.call('launchNamedUrl', 'registration', this.maybeGetPartner());
    }.bind(this));
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));

    this.$forgotPassword = this.$root.find('#forgot-password');
    this.$forgotPassword.unbind('click').click(function () {
        this.imvu.call('launchNamedUrl', 'forgot_password');
    }.bind(this));

    var showGigya = getQueryVariable('showGigya', this.window);
    if (!showGigya) {
        this.$root.addClass('hideGigya');
    }

    if (showGigya) {
        this.socialScroller = new SocialScroller({parent: $('#socialLogin'), imvuCall: this.imvu.call, window: this.window, login: this});
    }

    this.$root.find('#submit').unbind('click').click(this.submitDialog.bind(this));
    var initialInfo = this.imvu.call('getDialogInfo');
    var partner = this.maybeGetPartner();

    if (initialInfo.previousUser == null && typeof(partner.p) != "undefined") {
        this.$root.addClass('new_user');

        var $l = $('#loginfrm');
        this.imvu.call("resize", $l.width(), $l.height());
    }

    this.$enableGoogle = this.$root.find('.enable_google_auth');
    if(initialInfo.enableGoogleAuth) {
        this.$enableGoogle.unbind('click').click(function() {
            this.$root.find('.google_auth_container').toggleClass('show');
        }.bind(this));

        this.$root.find('.google_auth_container').show();
    } else {
        this.$root.find('.google_auth_container').hide();
    }

    $('#avatarname').val(initialInfo.previousUser);
    $('#password').val(initialInfo.password);
    $('#runOnStart').prop('checked', !!initialInfo.runOnStartup);
    $('#rememberPassword').prop('checked', !!initialInfo.rememberPassword);

    var defaultLang = imvu.call('getPref', 'translationLanguage');

    if(initialInfo.languageOptions == null){
        this.$langSel.hide();
    } else {
        var i = 0;
        var selIndex = 0;
        for (var x in initialInfo.languageOptions){
            var $el = $('<option>' + initialInfo.languageOptions[x]['name'] + '</option>');
            $el.attr('value',initialInfo.languageOptions[x]['id']);
            this.$langOpt.append($el);

            if(initialInfo.languageOptions[x]['id'] == defaultLang){
                selIndex = i;
            }

            i++;
        }

        this.$langOpt[0].selectedIndex = selIndex;
        this.$langOpt
            .unbind('change').change(this.updateLanguage.bind(this));
    }

    if (!initialInfo.previousUser){
        $("#avatarname").focus();
    } else {
        $("#password").focus();
    }

    if (IMVU.isMacOSX()) {
        $('#runOnStartupDiv').css('visibility', 'hidden');
    }
}

login.prototype = {
    showSpinner: function (el) {
        this.$root.append('<div class="loading-mask"><div class="loading-spinner"></div></div>');
    },

    updateLanguage: function () {
        this.imvu.call('setTranslationLanguage', this.$langOpt.val());
        this.window.location.reload();
    },

    maybeGetPartner: function () {
        var partner = this.imvu.call('maybeGetPartner');
        var ret = {};

        if (partner && partner.length > 0) {
            if (partner[0] != null) {
                ret.p = partner[0];

                if (partner[1] != null) {
                    ret.c = partner[1];
                }
            }
        }

        return ret;
    },

    submitDialog: function () {
        this.showSpinner();
        var dialogResult = {
            name: $('#avatarname').val(),
            password: $('#password').val(),
            google_code: $('#google_auth').val(),
            runOnStartup: $('#runOnStart').is(':checked'),
            rememberPassword: $('#rememberPassword').is(':checked'),
        };

        var callback = function() {
            this.imvu.call('endDialog', dialogResult);
        }.bind(this);

        IMVU.callAsync('clientLogin', callback, this.imvu, dialogResult);

        return false;
    }
}

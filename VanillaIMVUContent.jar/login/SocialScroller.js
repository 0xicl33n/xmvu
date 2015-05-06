(function($) {

    SocialScroller = function (args) {
        this.settings = {
            $parent: $('#socialLogin'),
            imvuCall: imvu.call,
            login: login,
        };

        if (args) {
            $.extend(this.settings, args);
        }

        this.$container = this.settings.$parent.find('.container');
        this.$list = this.settings.$parent.find('ul');
        this.$buttons = this.settings.$parent.find('li');

        $('button.social').live('click', this.goToProvider.bind(this));

        this.$container.after('<button type="button" class="arrow ffwd"></button>')
                    .before('<button type="button" class="arrow rew"></button>');

        $('.arrow').bind('click', this.scrollWidget.bind(this));

        var defaultProvider = '';
        var hash = this.settings.window.location.href.match(/\#network\=(\w+)/);
        if (hash && hash.length === 2) {
            defaultProvider = hash[1];
        }

        var disabledProviders = this.settings.imvuCall('getDisabledLoginProviders');
        var numNotShown = 0;  //  all this to display the last clicked provider, even if it is disabled
        if (disabledProviders) {
            numNotShown = disabledProviders.length;
            for (var i=0; i<disabledProviders.length; i++) {
                if (defaultProvider == disabledProviders[i]) {
                    numNotShown--;
                    break;  //  there can only be one
                }
            }
        }

        if (disabledProviders) {
            for (var j=0; j<disabledProviders.length; j++) {
                if (this.$buttons.find('button[value=' + disabledProviders[j] + ']').length) {
                    this.$buttons.find('button[value=' + disabledProviders[j] + ']').parent('li').remove();
                } else {
                    numNotShown--;
                }
            }
        }
        this.$list.width(((this.$buttons.length - numNotShown) * this.$buttons.outerWidth(true)) - this.$buttons.css('margin-right').replace('px', ''));

        if (defaultProvider) {
            this.setDefaultProvider(defaultProvider);
        }
    };

    SocialScroller.prototype = {
        setDefaultProvider: function(provider) {
            var networkButton = this.$buttons.find('button[value=' + provider + ']').parent('li'),
                replacement = networkButton.clone();

            networkButton.remove();
            this.$list.prepend(replacement);
        },

        scrollWidget: function (event) {
            var change = '-=105px';
            $('button').css({ opacity: 1 });
            if ($(event.currentTarget).hasClass('ffwd')) {
                change = '+=105px';
            }

            this.$container.animate({ scrollLeft: change }, 200, function () {
                var btnClass;
                if (this.$container.scrollLeft() <= 0) {
                    btnClass = 'button.rew';
                } else if (this.$container.scrollLeft() >= this.$list.outerWidth() - this.$container.width()) {
                    btnClass = 'button.ffwd';
                }

                $('button.arrow').css({ opacity: 1 });

                if (btnClass) {
                    $(btnClass).css({ opacity: 0.3 });
                }
            }.bind(this));
        },

        goToProvider: function (event) {
            var provider = $(event.currentTarget).val(),
                sizes, width, height;

            this.settings.login.showSpinner(this.settings.login.$root);
            this.settings.imvuCall('setPref', 'socialnetwork', provider);
            this.settings.window.location = IMVU.SERVICE_DOMAIN + '/client_gigya.php?provider=' + provider;
        }
    };

})(jQuery);
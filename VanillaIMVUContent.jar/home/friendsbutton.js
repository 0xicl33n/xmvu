function FriendsButton(args) {
    this.init(args);
}

$.extend(FriendsButton.prototype, ModeButton.prototype, {
    decorate: function ($elt) {
        this.birthdayIcon = document.createElement('div');
        $(this.birthdayIcon).addClass('birthday-icon');
        $elt.append(this.birthdayIcon);

        this.eventBus.register('showBirthdayNotification', function () { this.showBirthdayNotification(); }.bind(this));
        this.eventBus.register('hideBirthdayNotification', function () { this.hideBirthdayNotification(); }.bind(this));
        this.eventBus.register('PrefChanged-enableBirthdayNotification', this.handleBirthdayNotificationPrefChanged.bind(this));

        if (this.imvu.call('hasFriendsWithBirthdays')) {
            this.showBirthdayNotification();
        }
    },

    showBirthdayNotification: function () {
        this.birthdayNotificationReceived = true;
        if (this.imvu.call('getPref', 'enableBirthdayNotification')) {
            $(this.birthdayIcon).addClass('visible');
        }
    },

    hideBirthdayNotification: function () {
        this.birthdayNotificationReceived = false;
        $(this.birthdayIcon).removeClass('visible');
    },

    handleBirthdayNotificationPrefChanged: function (eventName, data) {
        if (data.newValue === false) {
            $(this.birthdayIcon).removeClass('visible');
        } else if (this.birthdayNotificationReceived) {
            $(this.birthdayIcon).addClass('visible');
        }
    }
});
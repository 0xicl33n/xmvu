function ThemedRoomWidget(args) {
    this.$root = $(args.panel);
    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.roomInstanceId = args.roomInstanceId;
    this.roomInfo = args.roomInfo;

    this.$nominateRoomButton = this.$root.find('.eligibleRoom .imvu-button');
    this.$roomsFaqButton = this.$root.find('.public-rooms-faq-link');
    this.$cancelLink = this.$root.find('.themed-room-cancel-link');
    this.$removeLink = this.$root.find('.themed-room-remove-link');

    this.latchCanceled = false;
    this.latchRemoved = false;

    this.updateRibbonColor(this.imvu.call('getThemedStatus'), this.imvu.call('canSubmitThemedRoom'));

    this.bindListeners();
}

ThemedRoomWidget.prototype = {
    bindListeners: function() {
        $('.hd .closeButton').click( function (e) {
            $('#roomWidget').trigger('closeActiveTabEvent');
        }.bind(this));

        this.$nominateRoomButton.bind('click', function() {
            this.imvu.call('showNominateRoomDialog');
            $('#roomWidget').trigger('closeActiveTabEvent');
        }.bind(this));

        this.$roomsFaqButton.bind('click', function() {
            this.imvu.call('launchNamedUrl', 'public_rooms_faq');
        }.bind(this));

        this.$cancelLink.bind('click', this.cancelSubmission.bind(this));
        this.$removeLink.bind('click', this.removeSubmission.bind(this));
    },

    onShown: function() {
        $help = this.whichNominateRoomHelp();
        $help.show();
    },

    whichNominateRoomHelp: function() {
        this.themedStatus = this.imvu.call('getThemedStatus');
        this.canSubmit = this.imvu.call('canSubmitThemedRoom');
        this.updateRibbonColor(this.themedStatus, this.canSubmit);
        if (this.latchCanceled) {
            return this.$root.find('.canceledSubmission');
        } else if (this.latchRemoved) {
            return this.$root.find('.removedRoom');
        }

        if ('submitted' === this.themedStatus) {
            return this.$root.find('.reviewingRoom');
        } else if ('themed' === this.themedStatus) {
            return this.$root.find('.featuredRoom');
        }

        this.canSubmit = this.imvu.call('canSubmitThemedRoom');
        if ('noteligible' === this.canSubmit) {
            return this.$root.find('.notEligibleRoom');
        } else if ('ratelimithit' === this.canSubmit) {
            return this.$root.find('.rateLimitSubmission');
        }

        return this.$root.find('.eligibleRoom');
    },

    onHidden: function() {
        this.$root.children().hide();
        this.$root.find('.hd').show();
    },

    updateRibbonColor: function(themedStatus, eligibleStatus) {
        type = this.getWhichRibbon(themedStatus, eligibleStatus);
        if ('blue' === type || 'disabled' === type) {
            $('.tab-themedroom').css('background', 'url(img/button_themedroom_%TYPE%.png) no-repeat'.replace(/%TYPE%/g, type));
        } else {
            $('.tab-themedroom').css('background', 'url(img/button_themedroom.png) no-repeat');
        }
    },

    getWhichRibbon: function(themedStatus, eligibleStatus) {
        if (this.latchCanceled || this.latchRemoved) {
            return 'disabled';
        }
        if (themedStatus === 'submitted') {
            return 'blue';
        } else if (themedStatus === 'themed' ) {
            return null;
        } else if ('noteligible' === eligibleStatus
            || 'ratelimithit' === eligibleStatus) {
            return 'disabled';
        }
        return 'blue';
    },

    shouldDisplay: function() {
        return this.imvu.call('shouldShowThemedRoomWidget');
    },

    cancelSubmission: function() {
        var result = this.imvu.call('showConfirmationDialog',
             _T("Cancel room submission"), 
             _T("Are you sure you want to remove your room from being considered for Themes?"),
             _T('Confirm Removal'),
             _T('Cancel')
         );
        if (!result || !result['result']) {
            return;
        }
        var uri = this.imvu.call('getThemedRoomsSubmissionUri') + '/' + this.roomInstanceId;
        var callbacks = {
            success: this.cancelSuccess,
            failure: this.cancelNetworkFailure,
            scope: this
        };
        this.network.asyncRequest('DELETE', uri, callbacks, undefined);
    },

    cancelSuccess: function(response) {
        if (response.responseText.status !== 'success') {
            this.imvu.call(
                'showErrorDialog',
                _T('Cancel Submission Error'),
                _T('We were unable to cancel your submission.')
            );
            return;
        }
        this.onHidden();
        this.latchCanceled = true;
        this.onShown();
    },

    cancelNetworkFailure: function() {
        this.imvu.call(
            'showErrorDialog',
            _T('Cancel Submission Error'),
            _T('We are currently experiencing problems. Please check your network connection and try again.')
        );
    },

    removeSubmission: function() {
        var result = this.imvu.call('showYesNoDialog', _T("Confirm removal of room"), _T("Are you sure you want to remove your room from being listed in Themes?"));
        if (!result || !result['result']) {
            return;
        }
        var uri = this.imvu.call('getThemedRoomsUri') + '/' + this.roomInfo.themeId + '/room/' + this.roomInstanceId;
        console.log(uri);
        var callbacks = {
            success: this.removeSuccess,
            failure: this.removeNetworkFailure,
            scope: this
        };
        this.network.asyncRequest('DELETE', uri, callbacks, undefined);
    },

    removeSuccess: function(response) {
        if (response.responseText.status !== 'success') {
            this.imvu.call(
                'showErrorDialog',
                _T('Remove Room from Theme Error'),
                _T('We were unable to remove your room.')
            );
            return;
        }
        this.onHidden();
        this.latchRemoved = true;
        this.onShown();
    },

    removeNetworkFailure: function() {
        this.imvu.call(
            'showErrorDialog',
            _T('Remove Room from Theme Error'),
            _T('We are currently experiencing problems. Please check your network connection and try again.')
        );
    }
};

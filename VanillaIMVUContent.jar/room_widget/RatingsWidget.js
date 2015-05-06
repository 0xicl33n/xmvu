function RatingsWidget(args) {
    this.rootElement = args.panel;
    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.averageRating = args.roomInfo.rating;
    this.roomInstanceId = args.roomInstanceId;
    this.shouldShow = args.roomInfo.showRatings;

    this.ratingDescriptions = {
        0 : " ",
        1 : _T("Poor"),
        2 : _T("Fair"),
        3 : _T("Good"),
        4 : _T("Very Good"),
        5 : _T("Outstanding"),
    }


    this.userHeartsWidget = new IMVU.Client.widget.Hearts({root: '.userRatingSection .hearts', fill: 0, max: 5, type: 'BigStar' });
    this.averageHeartsWidget = new IMVU.Client.widget.Hearts({root: '.averageRatingSection .hearts', fill: this.averageRating, max: 5, type: 'SmallStar' });

    this.closeButton = this.rootElement.querySelector('.hd .closeButton');
    this.title = this.rootElement.querySelector('.hd .panelName');
    this.description = this.rootElement.querySelector('.userRatingSection .ratingDescription');
    this.$averageRatingSection = $(".averageRatingSection");
    this.userRatingSection = this.rootElement.querySelector('.userRatingSection');
    this.check = this.rootElement.querySelector('.check');
    this.checkText = this.rootElement.querySelector('.submittedText');

    this.check.style.display = 'none';
    this.checkText.style.display = 'none';
    this.getUserRating();
    if(this.averageRating == 0) {
        this.hideAverageRating();
    }
    else {
        this.showAverageRating();
    }

    this.userHasRated = false;
    this.lastUserRating = 0;

    $('#userRating').mousemove(this.onMouseOverUserRating.bind(this));
    $('#userRating').mouseleave(this.onMouseLeaveUserRating.bind(this));
    $('#userRating').click(this.onClickUserRating.bind(this));

    $('.hd .closeButton').click( function (e) {
        $('#roomWidget').trigger('closeActiveTabEvent');
    }.bind(this));


    this.update();
}


RatingsWidget.prototype = {
    update: function() {

    },

    onMouseOverUserRating: function(event) {
        // the following 9 is a magic number that is one less than the padding to the left of userRating
        var rating = Math.ceil((event.layerX - 9) / this.userHeartsWidget.size);
        this.description.innerHTML = this.ratingDescriptions[rating];
        this.userHeartsWidget.fill(rating);
    },

    onClickUserRating: function(event) {
        // the following 9 is a magic number that is one less than the padding to the left of userRating
        var rating = Math.ceil((event.layerX - 9) / this.userHeartsWidget.size);
        //set rating
        var args = {room_instance_id : this.roomInstanceId, score : rating};
        var cb = {
            success: function (o) {
                this.userHasRated = true;
                this.showCheck();
            }.bind(this),
            failure: function () {
                console.log("Failure submitting room rating");
            }.bind(this),
            scope: this
        };

        this._serviceRequest({
            method: 'POST',
            uri: IMVU.SERVICE_DOMAIN + '/api/rooms/room_rating.php',
            callback: cb,
            data: args
        });
        this.lastUserRating = rating;
    },

    onMouseLeaveUserRating: function(event) {
        this.description.innerHTML = this.ratingDescriptions[this.lastUserRating];
        this.userHeartsWidget.fill(this.lastUserRating);
    },

    onShown: function() {

    },

    getUserRating: function() {
        var cb = {
            success: function (rating) {
                if(rating['score']){
                    this.userHasRated = true;
                    this.description.innerHTML = this.ratingDescriptions[rating['score']];
                    this.userHeartsWidget.fill(rating['score']);
                    this.lastUserRating = rating['score'];
                }
                else {
                    if (this.averageRating == 0) {
                        $('#roomWidget').trigger('activateTabByName', ['ratings']);
                    }
                }
            }.bind(this),
            failure: function () {
                console.log("Failure getting room rating");
            }.bind(this)
        };

        this._serviceRequest({
            method: 'GET',
            uri: IMVU.SERVICE_DOMAIN + '/api/rooms/room_rating.php?room_instance_id=' + this.roomInstanceId,
            callback: cb
        });
    },

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
        spec.network = this.network;
        spec.imvu = this.imvu;
        spec.json = true;
        serviceRequest(spec);
    },

    onHidden : function() {

    },

    hideAverageRating: function() {
        this.$averageRatingSection.hide();
        this.userRatingSection.style.MozBorderRadius = '0 0 12.5px 12.5px';
    },

    showAverageRating: function() {
        this.userRatingSection.style.MozBorderRadius = '0 0 0 0';
        this.$averageRatingSection.show();
    },

    setAverageRating: function(rating) {
        this.averageRating = rating;
    },

    showCheck: function() {
        this.check.style.display = '';
        this.checkText.style.display = '';
        $(".instructions").css('color','grey');
    },

    shouldDisplay: function() {
        return this.shouldShow;
    }
};

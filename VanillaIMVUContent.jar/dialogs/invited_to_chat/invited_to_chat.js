
var InviteDialog = function(spec) {
    this.imvu = spec.imvu || imvuRequired;
    this.info = spec.info || {};
    this.timer = spec.timer || timerRequired;

    this.inviteCountdown = null;

    //$('#title').text(this.info.title);
    $('#avname').html(this.info.avInfo.name).text();
    $('#age').text(this.info.avInfo.age);
    $('#gender').text(this.info.avInfo.gender?(this.info.avInfo.gender=='m'?_T('Male'):_T('Female')):_T('Hidden'));
    $('#picture-img').attr('src', this.info.avInfo.imageUrl);
    $('#relationship').text(this.info.avInfo.relationship);

    $('#location').show();
    if (this.info.location == 'Unknown'){
        $('#location .name').text('');
        $('#location .extra').hide();
    } else {
        $('#location .locname').html(this.info.location.name).text();
        $('#location .is-private').toggle(!!this.info.location.private);
        $('#location .is-public, #location .text, #location .description').toggle(!this.info.location.private);
        var imageUrl;
        if(this.info.location.imageUrl !== '') { 
            imageUrl = this.info.location.imageUrl
        } else { 
            imageUrl = '../../chat_rooms/img/no_image_room.jpg';
        }
        $('#location .image-wrapper').css('background-image', 'url('+imageUrl+')');
        if(!this.info.location.private) {  //if public
            var $img = $('<img>')
            $img.attr('src',imageUrl);
            $img.load(function(e){ 
                $('#location .image-wrapper').css('background-color', samplePixelColor($(e.target)));
            });
        }
        if (this.info.location.ownerName) {
            $('#location .owner').html(this.info.location.ownerName).text();
        }
        $('#location .language').text(this.info.location.language);
        $('#location .occupancy').text(this.info.location.currentOccupancy + ' / ' + this.info.location.maxOccupancy);
        if (this.info.location.description) {
            $('#location .description').html(this.info.location.description).text();
        }
    }
    $('#location').height(Math.max($('#location').height(), $('#avatar').height()));

    IMVU.buttons.addButtons(this.endDialog.bind(this), this.info.buttons);

    this.imvu.call('resize', 650, $('body').outerHeight());

    $('#decline-btn').click(this.showDecline.bind(this));
    $('#cancel').click(this.hideDecline.bind(this));
    $('#decline-reason').keydown(this.updateDeclineReasonLabel.bind(this));

    $('#decline-reason-container form').submit(this.sendDecline.bind(this));
    $('#decline-reason').focus(this.focusDeclineReason.bind(this));
    $('#decline-reason').blur(this.blurDeclineReason.bind(this));

    $('.close').click(this.close.bind(this));
    onEscKeypress(function() {
        if ($('#decline-reason').is(':visible')){
            this.hideDecline();
        } else {
            this.close();
        }
    }.bind(this));
    $('#send').click(this.sendDecline.bind(this));

    this.startTimer();
};

InviteDialog.prototype = {
    close: function() {
        this.endDialog('IGNORE');
    },

    focusDeclineReason: function() {
        $('#decline-reason-container label').addClass('hasfocus');
    },

    blurDeclineReason: function() {
        $('#decline-reason-container label').removeClass('hasfocus');
        $('#decline-reason-container label').toggleClass('hasreason', $('#decline-reason').val() !== '');
    },

    sendDecline: function(event) {
        $('#decline-reason-container, #decline-reason-sent, .button-container').toggle(300);
        $('.close').unbind('click');
        $('.close').click(function() {this.endDialog('DECLINE')}.bind(this));
        this.closeCountdown = this.timer.setTimeout(function () {
            this.closeCountdown = null;
            this.endDialog('DECLINE');
        }.bind(this), 2 * 1000);
        
        return false;
    },

    updateDeclineReasonLabel: function() {
        this.resetTimer();
        $('#decline-reason-container label').addClass('hasreason');
    },

    startTimer: function(){
        this.inviteCountdown = this.timer.setTimeout(function () {
            this.inviteCountdown = null;
            this.imvu.call('endDialog', ['TIMEOUT', '']);
        }.bind(this), 30 * 1000);
    },

    endTimer: function(){
        if (this.inviteCountdown) {
            this.timer.clearTimeout(this.inviteCountdown);
            this.inviteCountdown = null;
        }
    },

    hideDecline: function(){
        $('#button-bar2').toggle(300, function() {
            $('#decline-container').toggle(300);
            $('#button-bar').toggle(300, function() {
                this.imvu.call('resize', 650, $('body').outerHeight());
            }.bind(this));
        }.bind(this));
        this.resetTimer();
    },

    showDecline: function(){
        if ($('#decline-container').is(':visible')) {
            this.focusDeclineReason();
            $('#decline-reason-container label').focus();
            return;
        }
        $('#button-bar').toggle(300);
        $('#decline-container').toggle(300, function() {
            $('#button-bar2').toggle(300, function() {
                this.focusDeclineReason();
                $('#decline-reason-container label').focus();
                this.imvu.call('resize', 650, $('body').outerHeight());
            }.bind(this));
        }.bind(this));
        this.resetTimer();
    },

    resetTimer: function(){
        this.endTimer();
        this.startTimer();
    },

    endDialog: function(result){
        this.endTimer();
        this.imvu.call('endDialog', [result, $('#decline-reason').val()]);
    },
};

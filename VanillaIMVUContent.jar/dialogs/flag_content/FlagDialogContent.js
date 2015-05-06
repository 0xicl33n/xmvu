function FlagDialogContent(args) {
    this.$root = $(args.root);
    this.imvu = args.imvu;
    this.network = args.network;
    this.dialogInfo = args.dialogInfo;
    this.post_data = this.dialogInfo.post_data;    
    
    this.$dialogDropdown = this.$root.find('.dialog-dropdown');
    this.$dialogDropdownContainer = this.$root.find('.dialog-dropdown-container');
    this.$submitButton = this.$root.find('.submit-button');
    this.$spinner = $('.dialog-content-spinner');
    this.$root.find('.dialog-result-container').css('opacity', 0);

    this.$submitButton.bind('click', function(event) {
        this.onClickConfirm();
    }.bind(this));

    this.$root.find('.cancel-button, .close').bind('click', this.onClickCancel.bind(this));
    this.$root.find('.close-button').bind('click', this.onClickClose.bind(this));
    
    onEscKeypress(this.onClickCancel.bind(this));
 
    console.log('dialogInfo:');
    for (var key in this.dialogInfo) {
        console.log('  ' + key+':'+this.dialogInfo[key]);
    }
    
    $('#title').text((this.dialogInfo.title != '') ? this.dialogInfo.title : '[untitled]');
    $('.dialog-message-text').html(this.dialogInfo.message);
    IMVU.Client.util.turnLinksIntoLaunchUrls($('.dialog-message-text'), this.imvu);    
    this.imvu.call('resize', this.$root.outerWidth(true), this.$root.outerHeight(true));
    
    if (typeof args.dialogInfo.get_reasons_from_server == 'object') {
        this.requestReasons(args.dialogInfo.get_reasons_from_server.content_type, 
                       args.dialogInfo.get_reasons_from_server.content_id);
    } else {
        this.hideSpinner();
        this.$dialogDropdownContainer.hide();
        this.$submitButton.prop('disabled', false);
    }
}

FlagDialogContent.prototype = {
    onClickCancel: function() {
        this.onCancelButtonClicked();
        this.imvu.call('endDialog', false);
    },
    
    onClickClose: function() {
        this.imvu.call('endDialog', true);
    },
    
    onClickConfirm: function() {
        var post_data= this.post_data;
        if (this.$dialogDropdownContainer.is(":visible")) {
            post_data['flag_type'] = this.$dialogDropdown.val();
        }
        this.doSubmit(post_data);
    },
    
    doSubmit: function(post_data) {
        this.showSpinner();
        if (IMVU.IS_FIREFOX) {
            console.log("doSubmit:");
            for (var i in post_data) {
                console.log("  " + i + ": " + post_data[i]);
            }
        }
        serviceRequest({
            method: 'POST',
            uri: IMVU.SERVICE_DOMAIN + this.dialogInfo.service_url,
            data: post_data,
            network: this.network,
            imvu: this.imvu,
            callback: this.saveCallback.bind(this)
        });
    },
    
    onSaveCallbackSuccess: function() {
        // override this if needed
    },
    
    onCancelButtonClicked: function() {
        // override this if needed
    },
    
    saveCallback: function(result, error) {
        this.hideSpinner();
        if (error) {
            this.imvu.call('endDialog', false);
            this.imvu.call('showErrorDialog', _T("Flag Content Error"), _T("We are currently experiencing problems saving your flagging information.  Please check your network connection and try again."));
        } else {
            this.onSaveCallbackSuccess();
            $('.dialog-dropdown-text').hide();
            $('.dialog-dropdown-select').hide();
            $('.dialog-result-container').css('opacity', 1.0);
            $('#button-bar .cancel-button').addClass('hidden');
            $('#button-bar .submit-button').addClass('hidden');
            $('#button-bar .close-button').removeClass('hidden');
        }
    },

    showSpinner: function() {
        this.$spinner.show();
    },
    
    hideSpinner: function() {
        this.$spinner.hide();
    },
    
    requestReasons: function(content_type, content_id) {
        this.showSpinner();
        url = "/api/flag_content/flag_reasons.php";
        url = url + '?content_type=' + content_type + '&content_id=' + encodeURIComponent(content_id);
        serviceRequest({
            method: 'GET',
            uri: IMVU.SERVICE_DOMAIN + url,
            network: this.network,
            imvu: this.imvu,
            callback: this.reasonsCallback.bind(this)
        });
    },
    reasonsCallback: function(result, error) {
        if (error || !('reasons' in result) || $.isEmptyObject(result.reasons)) {
            this.onReasonCallbackFailure(error);        
        } else {
            this.createReasonSelection(this.$dialogDropdown, result.reasons);
        }
        this.hideSpinner();
    },
    onReasonCallbackFailure: function(error) {
        this.$dialogDropdownContainer.hide();
        $('.dialog-message-text').hide();
        $('.dialog-dropdown-text').hide();
        $('.dialog-message-text-get-failed').show();
        this.$submitButton.prop('disabled', false);
    },
    createReasonSelection: function($reasonDropdown, flag_reasons) {
        if (flag_reasons.length == 0)
        {   
            this.$dialogDropdownContainer.hide();
            return;
        }
        for(var idx in flag_reasons){
            flag_type = flag_reasons[idx];
            $reasonDropdown.append(new Option(flag_type.text, flag_type.key, false, false));
        }   
        $reasonDropdown.dropdown('init', {noSelection: true});
        this.$submitButton.prop('disabled', true);
        $reasonDropdown.change(function(event) {
            if (event.target.value == 0) {
                this.$submitButton.prop('disabled', true);
            } else {
                this.$submitButton.prop('disabled', false);
            }
        }.bind(this));
    }    
}

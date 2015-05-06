IMVU.Client.WhitelistedController = function (args) {
    this.imvu = args.imvu || imvuRequired;
    this.net = args.network || networkRequired;
    this.service = args.service || serviceRequired;
    this.mode = args.mode || modeRequired;
};

IMVU.Client.WhitelistedController.prototype = {
    onClickCheckbox: function(product, userChecked) {
        var self = this;
        var handleError = function(checkCheckbox, message) {
            if (typeof message === 'undefined') {
                message = "We're sorry, but an unknown error has occurred. Please try again later.";
            }
            self.imvu.call('showConfirmationDialog', 'Whitelisting Error', message);
            if (checkCheckbox) {
                $(self.mode.dialogInfo.elWhitelistedCheckbox).prop('checked', true);
            } else {
                $(self.mode.dialogInfo.elWhitelistedCheckbox).prop('checked', false);
            }
        };
        
        var callbacks = {
            add : {
                success : function(o) {
                    self.mode.dialogInfo.elSpinner.style.display = 'none';
                    if (!o.responseText.success) {
                        handleError(false, o.responseText.message);
                    }
                },
                failure : function(o) {
                    self.mode.dialogInfo.elSpinner.style.display = 'none';
                    handleError(false);
                }
            },
    
            remove : {
                success : function(o) {
                    self.mode.dialogInfo.elSpinner.style.display = 'none';
                    if (!o.responseText.success) {
                        handleError(true, o.responseText.message);
                    }
                },
                failure : function(o) {
                    self.mode.dialogInfo.elSpinner.style.display = 'none';
                    handleError(true);
                }
            }
        };
        
        this.mode.dialogInfo.elSpinner.style.display = 'block';
        if (userChecked) {
            this.service.whitelistCall(product.dataObject.id, "add", callbacks.add);
        } else {
            this.service.whitelistCall(product.dataObject.id, "remove", callbacks.remove);
        }
    }, 
}
function InputDialog(args) {
    this.$dialog = args.$dialog;
    this.$title = $('.title', this.$dialog);
    this.$message = $('.message', this.$dialog);
    this.$userInput = $('.user-input', this.$dialog);

    this.$title.text(args.info.title);
    this.$message.text(args.info.message);
    this.$userInput.val(args.info.defaultValue);
    if(args.info.titleClass) {
        this.$title.addClass(args.info.titleClass);
    }
    if(args.info.confirmButtonText) {
        $('.confirm span', this.$dialog).text(args.info.confirmButtonText)
    }
    if(args.info.cancelButtonText) {
        $('.cancel span', this.$dialog).text(args.info.cancelButtonText);
    }
    if(args.info.maxlength) { 
        this.$userInput.attr('maxlength', args.info.maxlength);
    }

    this.isRequired = args.info.isRequired;
    this.hintText = args.info.hintText;
    if(this.hintText) {
        $('.hint', this.$dialog).text(this.hintText);
    }

    var self = this;
    function cancel() {
        args.imvuCall('cancelDialog');
    }
    function submit() {
        if(self.canConfirm()) {
            args.imvuCall('endDialog', self.getUserInput());
        }
    }
    $('.cancel', this.$dialog).bind('click', cancel);
    $('.confirm', this.$dialog).bind('click', submit);
    $('.close', this.$dialog).bind('click', cancel);
    $(document).keydown(function(e) {
        if(e.keyCode == 27) {
            cancel();
            return false;
        } else if(e.keyCode == 13 || e.keyCode == 10) {
            submit();
            return false;
        } else {
            self.update();
        }
    });
    $(document).keyup(function(e) {
        self.update();
    });
    this.update();

    this.$userInput.focus();
}

InputDialog.prototype.canConfirm = function() {
    return this.getUserInput().length || !this.isRequired;
}

InputDialog.prototype.update = function()  {
    if(this.hintText) {
        $('.hint', this.$dialog).toggle(this.getUserInput().length == 0);
    }
    $('.confirm', this.$dialog).prop('disabled', !this.canConfirm());
}

InputDialog.prototype.getUserInput = function () {
    return this.$userInput.val();
}

InputDialog.prototype.setUserInput = function (text) {
    this.$userInput.val(text);
}

InputDialog.prototype.getTitle = function () {
    return this.$title.text();
}

InputDialog.prototype.getMessage = function () {
    return this.$message.text();
}
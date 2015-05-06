function CreatorPropertyNameDialog(args) {
    this.imvu = args.imvu;

    this.existingNames = this.imvu.call('getPropertyNames');
    this.$propertyNameInfo = $('#propertyName-info');
    this.$propertyNameText = $('#propertyName-text');
    this.goButton = new ImvuButton($('#go-button')[0], {callback: this.goButtonClicked, scope: this});
    this.$propertyNameInfo.css('display', 'none');
    this.$propertyNameText.change(this.validateInput.bind(this));
    this.$propertyNameText.keyup(this.validateInput.bind(this));
    this.$propertyNameText.keypress(this.validateInput.bind(this),  function (e) { if(e.keyCode == 13) this.goButtonClicked(); }.bind(this));
    $('.close-button').click(this.closeButtonClicked.bind(this));
    this.$propertyNameText.focus();
    this.$propertyNameText.select();
    this.newIndex = this.imvu.call('getNewPropertyIndex');
    if (this.newIndex < 0) {
        this.goButton.$element.hide();
        this.$propertyNameInfo.css('display', '');
        this.$propertyNameInfo.html(_T("There are too many indexes defined"));
        this.$propertyNameText.prop("disabled", true);
    }
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

CreatorPropertyNameDialog.prototype.validateInput = function(e) {
    var newName = this.$propertyNameText.val();
    var found = false;
    for (i in this.existingNames) {
        if (newName == this.existingNames[i]) {
            found = true;
        }
    }
    if (found) {
        this.goButton.$element.hide();
        this.$propertyNameInfo.css('display', '');
        this.$propertyNameInfo.html(_T("That property name is in use"));
        return;
    }
    this.$propertyNameInfo.css('display', 'none');
    this.goButton.$element.show();
}

CreatorPropertyNameDialog.prototype.goButtonClicked = function() {
    this.validateInput();
    if(this.goButton.$element.is(':visible')) {
        this.imvu.call('endDialog', [this.newIndex, this.$propertyNameText.val(), 'string']);
    }
};

CreatorPropertyNameDialog.prototype.closeButtonClicked = function() {
    this.imvu.call('endDialog', null);
};

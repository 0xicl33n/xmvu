function CreatorParticleSystemNameDialog(args) {
    this.imvu = args.imvu || imvuIsRequired;

    this.existingNames = this.imvu.call('getParticleSystemNames');
    this.$particleSystemNameInfo = $('#particleSystemName-info');
    this.$particleSystemNameText = $('#particleSystemName-text');
    this.goButton = new ImvuButton($('#go-button')[0], {callback: this.goButtonClicked, scope: this});
    this.$particleSystemNameInfo.css('display', 'none');
    this.$particleSystemNameText.change(this.validateInput.bind(this));
    this.$particleSystemNameText.keyup(this.validateInput.bind(this));
    this.$particleSystemNameText.keypress(
        this.validateInput.bind(this),
        function (e) { if(e.keyCode == 13) this.goButtonClicked(); }.bind(this));
    $('.close-button').click(this.closeButtonClicked.bind(this));
    this.$particleSystemNameText.focus();
    this.$particleSystemNameText.select();
    this.newIndex = this.imvu.call('getNewParticleSystemIndex');

    this.validateInput();

    if (this.newIndex < 0) {
        this.goButton.$element.hide();
        this.$particleSystemNameInfo.css('display', '');
        this.$particleSystemNameInfo.html(_T("There are too many indexes defined"));
        this.$particleSystemNameText.prop("disabled", true);
    }
}

CreatorParticleSystemNameDialog.prototype.validateInput = function() {
    var newName = this.$particleSystemNameText.val().trim();

    if (newName.length == 0) {
        invalid.call(this, _T('Please choose a name for your new particle system'));
        return;
    }

    var found = false;
    for (i in this.existingNames) {
        if (newName.toLowerCase() == this.existingNames[i].toLowerCase()) {
            found = true;
        }
    }
    if (found) {
        invalid.call(this, _T('That particle system name is in use'));
        return;
    }

    this.$particleSystemNameInfo.css('display', 'none');
    this.goButton.$element.show();

    function invalid(message) {
        this.goButton.$element.hide();
        this.$particleSystemNameInfo.css('display', '');
        this.$particleSystemNameInfo.html(message);
    }
}

CreatorParticleSystemNameDialog.prototype.goButtonClicked = function() {
    this.validateInput();
    if(this.goButton.$element.is(':visible')) {
        this.imvu.call('endDialog', [this.newIndex, this.$particleSystemNameText.val()]);
    }
};

CreatorParticleSystemNameDialog.prototype.closeButtonClicked = function() {
    this.imvu.call('endDialog', null);
};

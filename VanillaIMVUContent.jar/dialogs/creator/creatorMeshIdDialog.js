function CreatorMeshIdDialog(args) {
    this.imvu = args.imvu;

    this.meshStatus = [];
    var result = this.imvu.call('getMeshIds');
    var suggestedNewMeshId = 0;
    for (var meshId in result) {
        var intMeshId = parseInt(meshId, 10);
        if (result[meshId].asset) {
            this.meshStatus[intMeshId] = 'visible';
        } else {
            this.meshStatus[intMeshId] = 'hidden';
        }
        suggestedNewMeshId = intMeshId + 1;
    }


    this.$meshIdInfo = $('#meshId-info');
    this.$meshIdText = $('#meshId-text');
    this.goButton = new ImvuButton($('#go-button')[0], {callback: this.goButtonClicked, scope: this});
    this.$meshIdInfo.css('display', 'none');    
    this.$meshIdText.change(this.validateInput.bind(this));
    this.$meshIdText.keyup(this.validateInput.bind(this));
    this.$meshIdText.keypress(this.validateInput.bind(this),  function (e) { if(e.keyCode == 13) this.goButtonClicked(); }.bind(this));
    $('.close-button').click(this.closeButtonClicked.bind(this));
    this.$meshIdText.val(suggestedNewMeshId);
    this.$meshIdText.focus();
    this.$meshIdText.select();
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

CreatorMeshIdDialog.prototype.validateInput = function(e) {
    try {
        var newId = parseInt(this.$meshIdText.val(), 10);
    } catch(e) {
    }

    if (isNaN(newId)) {
        this.goButton.$element.hide();
        this.$meshIdInfo.css('display', 'none');
        return;
    }
 
    if (newId < 0) {
        this.goButton.$element.hide();
        this.$meshIdInfo.css('display', '');
        this.$meshIdInfo.html(_T("Id cannot be negative"));
        return;
    }

    if (newId >= 100) {
        this.goButton.$element.hide();
        this.$meshIdInfo.css('display', '');
        this.$meshIdInfo.html(_T("Id must be less than or equal to 99"));
        return;
    }

    this.$meshIdText.val(newId);

    if (this.meshStatus[newId]) {
        this.goButton.$element.hide();
        this.$meshIdInfo.css('display', '');
        if (this.meshStatus[newId] == 'hidden') {
            this.$meshIdInfo.html(_T("That mesh ID is overridden on the config panel"));
        } else {
            this.$meshIdInfo.html(_T("That mesh ID already exists"));
        }
        return;
    }

    this.$meshIdInfo.css('display', 'none');
    this.goButton.$element.show();
}

CreatorMeshIdDialog.prototype.goButtonClicked = function() {
    this.validateInput();
    if(this.goButton.$element.is(':visible')) {
        this.imvu.call('endDialog', this.$meshIdText.val());
    }
};

CreatorMeshIdDialog.prototype.closeButtonClicked = function() {
    this.imvu.call('endDialog', null);
};

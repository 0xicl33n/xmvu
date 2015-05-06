function CreatorTriggerIdDialog(args) {
    this.imvu = args.imvu;
    var ids = this.imvu.call('getTriggerIds');
    var suggestedNewTriggerId = 0;
    this.triggerStatus = [];
    for (i = 0; i < ids.length; i++) {
        var id = parseInt(ids[i], 10);
        this.triggerStatus[id] = true;
        if (suggestedNewTriggerId <= id) {
            suggestedNewTriggerId = id + 1;
        }
    }
    this.$triggerIdInfo = $('#triggerId-info');
    this.$triggerIdText = $('#triggerId-text');
    this.goButton = new ImvuButton($('#go-button')[0], {callback: this.goButtonClicked, scope: this});
    this.$triggerIdInfo.css('display', 'none');
    this.$triggerIdText.change(this.validateInput.bind(this));
    this.$triggerIdText.keyup(this.validateInput.bind(this));
    this.$triggerIdText.keypress(this.validateInput.bind(this),  function (e) { if(e.keyCode == 13) this.goButtonClicked(); }.bind(this));
    $('.close-button').click(this.closeButtonClicked.bind(this));
    this.$triggerIdText.val(suggestedNewTriggerId);
    this.$triggerIdText.focus();
    this.$triggerIdText.select();
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

CreatorTriggerIdDialog.prototype.validateInput = function(e) {
    try {
        var newId = parseInt(this.$triggerIdText.val(), 10);
    } catch(e) {
    }

    if (isNaN(newId)) {
        this.goButton.$element.hide();
        this.$triggerIdInfo.css('display', '');
        this.$triggerIdInfo.html(_T("You must enter a number"));
        return;
    }
 
    if (newId < 0) {
        this.goButton.$element.hide();
        this.$triggerIdInfo.css('display', '');
        this.$triggerIdInfo.html(_T("The trigger number cannot be negative"));
        return;
    }

    if (newId >= 100) {
        this.goButton.$element.hide();
        this.$triggerIdInfo.css('display', '');
        this.$triggerIdInfo.html(_T("The trigger number cannot be more than 99"));
        return;
    }

    this.$triggerIdText.val(newId);

    if (this.triggerStatus[newId]) {
        this.goButton.$element.hide();
        this.$triggerIdInfo.css('display', '');
        this.$triggerIdInfo.html(_T("That trigger number already exists"));
        return;
    }

    this.$triggerIdInfo.css('display', 'none');
    this.goButton.$element.show();
}

CreatorTriggerIdDialog.prototype.goButtonClicked = function() {
    this.validateInput();
    if(this.goButton.$element.is(':visible')) {
        this.imvu.call('endDialog', this.$triggerIdText.val());
    }
};

CreatorTriggerIdDialog.prototype.closeButtonClicked = function() {
    this.imvu.call('endDialog', null);
};

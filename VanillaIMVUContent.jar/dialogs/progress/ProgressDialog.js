var ProgressDialog = function(args) {
    this.imvu = args.imvu;
    this.customSetInterval = args.customSetInterval || function (fn, timeout) { setInterval(fn, timeout); };
    this.customClearInterval = args.customClearInterval || function (id) { clearInterval(id); };

    this.$messageBig = $('#message_big');
    this.$percentLoaded = $('#percent_loaded');
    this.circleDial = new CircleDial();
    $('#circle_dial').append(this.circleDial.svg);
    this.$messageSmall = $('#message_small');
    
    var dialogInfo = this.imvu.call('getDialogInfo');
    this.$messageBig.text(dialogInfo['title'] || '');
    
    this.updateLoadingProgress();
    this.updateIntervalId = this.customSetInterval(this.updateLoadingProgress.bind(this), 500);
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

ProgressDialog.prototype.updateLoadingProgress = function() {
    var progress = this.imvu.call('getProgress');
    if (progress['shouldClose'] == true) {
        this.close();
        return;
    }
    if(progress['messageText']) {
        this.$messageBig.text(progress['messageText']);
    }
    this.setLoadingProgress(progress['progress'], progress['detailsText']);
}

ProgressDialog.prototype.close = function() {
    this.customClearInterval(this.updateIntervalId);
    this.imvu.call('endDialog', {});
}

ProgressDialog.prototype.setLoadingProgress = function(v, messageSmall) {
    var percentStr = Math.round(v*100) + '%';
    this.$percentLoaded.text(percentStr);
    var text = '';
    if (messageSmall) {
        text = '- ' + messageSmall;
    }
    this.$messageSmall.text(text);
    this.circleDial.setFull(v);
}

ProgressDialog.prototype.getLoadingProgress = function() {
    return this.circleDial.full;
}

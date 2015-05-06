function ToolStrip(args) {
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.rootEl = YAHOO.util.Dom.get(args.rootEl);

    this.buttonContainerEl = this.rootEl.querySelector('#button_container');
    this.feedbackContainerEl = this.rootEl.querySelector('#feedback_container');
    this.notConnectedEl = this.rootEl.querySelector('#not-connected-container');

    YAHOO.util.Event.on('photo-button', 'click', this.clickPhoto.bind(this));

    this.eventBus.register(
        'SnapshotStateChanged',
        this.showSnapshotState.bind(this)
    );

    this.eventBus.register(
        'IMQ disconnected', this.showImqConnectedState.bind(this)
    );
    this.eventBus.register(
        'IMQ connected', this.showImqConnectedState.bind(this)
    );

    this.toolButtons = this.otherButtons.concat(this.qaButtons);
    this.initializeButtonsAndTooltips();

    $('div', this.notConnectedEl).click(this.showImqConnectionDialog.bind(this));
}



ToolStrip.prototype = {
    qaButtons: [],
    nonQaButtons: [],
    auxButtons: ['photo'],
    otherButtons: ['chat', 'clothing', 'outfits', 'furniture', 'scenes', 'music'],

    hideButtons: function(names) {
        for each (var bname in names) {
            $('#' + bname + '-button', this.buttonContainerEl).hide();
        }
    },

    initializeButtonsAndTooltips: function() {
        var buttonIds = [];

        $('.button', this.buttonContainerEl).addClass('disabled');

        if (this.imvu.call('isQA')) {
            this.hideButtons(this.nonQaButtons);
        } else {
            this.hideButtons(this.qaButtons);
        }
        
        for each (var toolButton in this.toolButtons) {
            buttonId = toolButton+'-button';
            YAHOO.util.Event.on(buttonId, 'click', this.clickToolButton.bind(this, toolButton));
            buttonIds.push(buttonId);
            var el = document.getElementById(buttonId);
            el.title = el.innerHTML;
            el.innerHTML = '';
        }
        
        for each (var auxButton in this.auxButtons){
            buttonIds.push(auxButton+'-button');
            var el = document.getElementById(auxButton+'-button');
            el.title = el.innerHTML;
            el.innerHTML = '';
        }
        this.toolTip = new YAHOO.widget.Tooltip("toolTip", { context:buttonIds, showDelay:500, xyoffset:[15, 0]});

        this.showImqConnectedState();
    },

    showImqConnectedState: function() {
        this.notConnectedEl.style.display = this.imvu.call('isImqConnected') ? 'none' : 'block';
    },

    showImqConnectionDialog: function() {
        this.imvu.call('showImqConnectionDialog');
    },

    setButtonContainerVisibility: function(visible){
        if (visible){
            this.feedbackContainerEl.style.display = 'none';
            this.buttonContainerEl.style.display = 'block';
        } else {
            this.buttonContainerEl.style.display = 'none';
            this.feedbackContainerEl.style.display = 'block';
        }
    },
    
    setEnabledButtons: function(buttons){
        var button;
        $('.button').addClass('disabled');
        for each (button in buttons){
            $('#'+button+'-button').removeClass('disabled');
        }
    },
    
    setButtonVisibility: function(button, visible) {
        $('#' + button + '-button').toggleClass('hidden', !visible);
    },

    setActiveButton: function(activeButton){
        for each (var button in this.toolButtons) {
            $('#' + button + '-button').removeClass('active');
        }
        $('#' + activeButton + '-button').addClass('active');
        this.showSnapshotState();
    },

    sendFeedback : function() {
        this.imvu.call('sendFeedback');
    },

    discussExperience : function() {
        this.imvu.call('discussExperience');
    },
    
    _getButtonEl : function(buttonName) {
        return this.rootEl.querySelector('#' + buttonName + '-button');
    },

    clickToolButton: function(button){
        var $button = $(this._getButtonEl(button));
        if ($button.is('.active')) {
            this.setActiveButton('');
            this.imvu.call('setActiveTool', '');
        } else if (!$button.is('.disabled')) {
            this.setActiveButton(button);
            this.imvu.call('setActiveTool', button);
        }
    },

    clickPhoto: function(){
        var $photo = $(this._getButtonEl('photo'));
        if (!$photo.is('.disabled')) {
            this.imvu.call('takeCustomSnapshot');
        }
    },

    showSnapshotState: function() {
        $(this._getButtonEl('photo')).toggleClass('active', !!this.imvu.call('isTakingPhoto'));
    },

    hilightOutfitButton: function() {
        $(this._getButtonEl('outfits')).addClass('outFitSavedHighlight');
    },

    unhilightOutfitButton: function() {
        $(this._getButtonEl('outfits')).removeClass('outFitSavedHighlight');
    }
};

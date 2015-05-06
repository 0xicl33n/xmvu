function DecorateWidget(args) {
    this.el = args.panel;
    this.toolCaptions = { 
        '' : [_T("Explore"), 'ctrl + E'],
        'explore' : [_T("Explore"), 'ctrl + E'],
        'move' : [_T("Move"), 'ctrl + M'],
        'rotate' : [_T("Rotate"), 'ctrl + R'],
        'scale' : [_T("Scale"),'ctrl + S'],
        'clone' : [_T("Copy"), 'ctrl + P'],
        'straighten' : [_T("Reset"), 'ctrl + T'],
        'lock' : [_T("Lock"), 'ctrl + L'],
        'delete' : [_T("Delete"), 'ctrl + D'],
        'undo' : [_T('Undo'), 'ctrl + U'],
        'redo' : [_T('Redo'), 'ctrl + O'],
        'info' : [_T("Help"), '', '']
    };
    this.imvu = args.imvu;
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.$decoratePanel = $('#decoratePanel');

    for (var key in this.toolCaptions) {
        if (key=='info') {
            YAHOO.util.Event.addListener(key, 'click', this.onClickInfo.bind(this));
        } else {
            YAHOO.util.Event.addListener(key, 'click', this.onClick.bind(this));
        }
        YAHOO.util.Event.addListener(key, 'mouseover', this.onMouseOver.bind(this));
        YAHOO.util.Event.addListener(key, 'mouseout', this.onMouseOut.bind(this));
    }
    this.setActiveTool('explore');

    this.hasActiveThemedRoom = this.imvu.call('getThemedStatus');
    this.shouldShowThemedRoomWarning = false;
    if (this.hasActiveThemedRoom) {
        this.shouldShowThemedRoomWarning = true;
    }

    this.eventBus.register('SceneGraphChanged', (function(eventName, data) {
        this.update();
    }).bind(this), 'SceneViewer');
    $('.hd .closeButton').click( function (e) {
        $('#roomWidget').trigger('closeActiveTabEvent');
    }.bind(this));

    this.eventBus.register('InventoryTool.FurnitureToolShown', (function(eventName, data) {
        this.showThemedRoomWarning();
    }).bind(this));

    this.update();
}

DecorateWidget.prototype = {
    onClick : function(event) {
        this.imvu.call('setFurnitureTool', event.target.id);
    },

    onClickInfo : function(event) {
        this.imvu.call('showFurnitureToolInfo');
    },

    showThemedRoomWarning: function() {
        this.hasActiveThemedRoom = this.imvu.call('getThemedStatus');
        if (this.hasActiveThemedRoom) {
            this.imvu.call(
                'showErrorDialog',
                _T('Warning: This is a Themed room!'),
                _T('Modifying this room will remove it from being listed in Themes.')
            );
        }
    },

    onMouseOver : function(event) {
        document.getElementById('furni_caption').innerHTML = this.toolCaptions[event.target.id][0];
        document.getElementById('furni_hotkey').innerHTML = this.toolCaptions[event.target.id][1];
    },

    onMouseOut : function(event) {
        document.getElementById('furni_caption').innerHTML = this.toolCaptions[this.activeToolId][0];
        document.getElementById('furni_hotkey').innerHTML = this.toolCaptions[this.activeToolId][1];
    },

    setActiveTool : function(toolName) {
        document.getElementById('furni_caption').innerHTML = this.toolCaptions[toolName][0];
        document.getElementById('furni_hotkey').innerHTML = this.toolCaptions[toolName][1];
        for (var key in this.toolCaptions) {
            $(YAHOO.util.Dom.get(key)).removeClass('active');
        }
        $(YAHOO.util.Dom.get(toolName)).addClass('active');
        this.activeToolId = toolName;
        if (toolName && toolName != 'explore') {
            if (this.shouldShowThemedRoomWarning) {
                this.shouldShowThemedRoomWarning = false;
                this.showThemedRoomWarning();
            }
        } 
    },

    onShown: function() {
        this.imvu.call('showFurnitureTool');
    },

    onHidden: function() {
        this.imvu.call('setFurnitureTool', '');
    },

    shouldDisplay: function() {
        return this.imvu.call('youOwnThisRoom');
    },

    update: function() {
        var metrics = this.imvu.call('getSceneMetrics');
        var download = metrics['room']['minimumDownloadSize'];
        $('#room_size_indicator', this.el).text(
            IMVU.Client.util.number_format(download / 1000, 0) + ' KB');
    }
};

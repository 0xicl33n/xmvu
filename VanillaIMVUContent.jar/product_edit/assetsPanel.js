function AssetsPanel(args) {
    var self = this;
    this.args = args; // for event call-back -- clean this up
    this.el = YAHOO.util.Dom.get(args.el);
    this.mode = args.mode;
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.productType = args.productType;
    this.elAssetTable = $('#assetTable')[0];
    this.elAssetTableRows = $('#assetTable tbody')[0];

    this.pillButtons = PillButton.createPillButtons(args);
    this.pillButtons['removeAsset'].addUserEventListener(this.onClickRemoveAsset.bind(this));
    this.eventBus.register('ProductChanged', this.onProductChanged, 'Mode', this);
    this.tableRows = [];
    this.selectedRow = null;
    this.initialized = false;
}

AssetsPanel.prototype.onSelect = function() {
    if (this.initialized == false) {
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('wait');
        }
        this.loadAssets();
        this.initialized = true;
        if (typeof(window.setCursor) == 'function') {
            window.setCursor('auto');
        }
    }
}

AssetsPanel.prototype.onProductChanged = function(eventName, eventInfo) {
    if (this.initialized && eventInfo.source != 'ui-assetsPanel' &&
        (eventInfo.source == 'productDictionary' || eventInfo.uiFieldName == 'assets')) {
        this.initialized = false;
        if (this.mode.selectedPanel == this) {
            this.onSelect();
        }
    }
}

AssetsPanel.prototype.loadAssets = function() {
    if (!this.elAssetTable) {
        return;
    }
    var assets = this.imvu.call('getFullAssetList');
    if (!assets) {
        return;
    }
    this.elAssetTableRows.innerHTML = '';
    this.assetTableRows = []
    this.selectedRows = []
    for (i = 0; i < assets.length; i++) {
        var tr = document.createElement('tr');
        tr.index = i;
        tr.asset = assets[i].name;

        var tdName = document.createElement('td');
        $(tdName).addClass('nameColumn');
        tdName.innerHTML = assets[i].name;
        tr.appendChild(tdName);

        var tdSize = document.createElement('td');
        $(tdSize).addClass('sizeColumn');
        tr.appendChild(tdSize);

        var tdStatus = document.createElement('td');
        $(tdStatus).addClass('statusColumn');
        tr.appendChild(tdStatus);

        if (assets[i].separator) {
            $(tr).addClass('separator');
        } else {
            var size = assets[i].size;
            if (size == 0) {
                size = '';
            }
            tdSize.innerHTML = size;
            if (assets[i].used == false) {
                $(tr).addClass('unused');
                tdStatus.innerHTML = 'UNUSED';
            }
            if (assets[i].name != 'index.xml') {
                YAHOO.util.Event.addListener(tr, 'click', this.toggleRowSelection, tr, this);
            }
        }
        this.elAssetTableRows.appendChild(tr);
        this.assetTableRows[i] = tr;
    }
}

AssetsPanel.prototype.toggleRowSelection = function(e, tr) {
    var self = this;

    index = tr.index;
    if (!e.ctrlKey) {
        if (this.selectedRows.length == 1 && index == this.selectedRows[0]) {
            index = -1;
        }
        $(this.selectedRows).each(function (index, row) {
            $(self.assetTableRows[row]).removeClass('selected');
        });
        this.selectedRows = []
    }
    if (index >= 0 ) {
        for (var i = 0; i < this.selectedRows.length; i += 1) {
            var row = this.selectedRows[i];
            if (row == index) {
                this.selectedRows.splice(i, 1);
                $(this.assetTableRows[index]).removeClass('selected');
                return;
            }
        }

        $(this.assetTableRows[index]).addClass('selected');
        this.selectedRows.push(index);
    }
}

AssetsPanel.prototype.onClickRemoveAsset = function() {
    var self = this;
    $(this.selectedRows).each(function (index, row) {
        var assetToDelete = self.assetTableRows[row].asset;
        if (assetToDelete != 'index.xml') {
            self.imvu.call('deleteAsset', assetToDelete);
        }
    });
    this.loadAssets();
}
function AssetChooser(args) {
    this.pillButton = args.button;
    this.imvu = args.imvu;
    this.$select = $(args.select);
    this.extension = args.extension;
    this.type = args.type;
    this.blankEntry = '';

    this.pillButton.addUserEventListener(this.onFileOpen.bind(this));

    this.eventBus = args.eventBus;
    this.eventBus.register('AssetChanged', this.onAssetChanged.bind(this));
    this._pendingRename = '';
    this.setItems([]);
}

AssetChooser.prototype = {
    setItems : function(items) {
        this.$select.children().remove();
        if (this.extension != 'xsf' && this.extension != 'js') {
            this._addItem(this.blankEntry);
        }
        for each(var item in items) {
            this._addItem(item);
        }
    },

    _getItem: function (item) {
        var items = this.$select.children(':contains("' + item + '")');
        for(var i = 0; i < items.length; i++){
            if(items[i].innerHTML == item){ return $(items[i]); }
        }
        return null;
    },
    
    _removeItem: function(item) {
        var foundItem = this._getItem(item);
        if (foundItem) {
            foundItem.remove();
        }
    },

    _containsItem: function(item) {
       var items = this._getItem(item);
       
       if(!items){
           return false;
       }
       
       for(var i = 0; i < items.length; i++){
           if(items[i].innerHTML == item){ return true; }
       }
       return false;
    },


    _addItem: function(item) {
        var $o = $('<option/>').html(item);
        if (this._containsItem(item)) {
            return; // do not insert twice!
        }

        // Always insert first. The insertBefore() which comes
        // later will *move* the element because it already
        // exists in the DOM.
        this.$select.append($o);

        var $children = this.$select.children();
        for (var i = 0; i < $children.length; i += 1) {
            var $c = $children.eq(i);
            if ($c.html() > item) {
                $o.insertBefore($c);
                return;
            }
        }
    },

    _renameItem: function(oldItem, newItem) {
        this.$select.children().each(function (index, c) {
            if (c.innerHTML==oldItem) {
                c.innerHTML = newItem;
            }
        });
    },

    onFileOpen: function(event) {
        var filename = this.imvu.call(
            "showFileOpenDialog",
            _T("Open")+' ' + this.type,
            [
                [ this.type + " Files", "*." + this.extension ],
                [ "All Files", "*.*" ]
            ]
        );
        if (filename) {
            var assetName = this.imvu.call('importAsset', filename);
            this._addItem(assetName);
            this.selectItem(assetName);
            this.$select.change();
        }
    },
   
    onAssetChanged: function(event, args) {
        //I want to first check that the new asset has the right extension before adding it.
        var assetNameLength = args.assetName.length;
        var thisExtensionLength = this.extension.length;
        var assetNameExtension = '';
        //Check that the length of the asset name is at least as long as the length of my extension.
        if(assetNameLength >= thisExtensionLength){
           assetNameExtension = args.assetName.substring(assetNameLength-thisExtensionLength, assetNameLength);
        }
        if(assetNameExtension == this.extension){
            switch(args.op) {
            case 'Create':
                this._addItem(args.assetName);
                break;
            case 'Delete':
                this._removeItem(args.assetName);
                break;
            case 'RenameOld':
                this._pendingRename = args.assetName;
                break;
            case 'RenameNew':
                this._renameItem(this._pendingRename, args.assetName);
                break;
            }           
        }
    },

     selectItem: function(item) {
         var i = this._getItem(item);
         if (!i){
             return;
         }
        this.$select.val(i.val());
    },

    subscribe: function (fn) {
        this.$select.change(fn);
    },
}


function FriendList(args) {
    this.el = YAHOO.util.Dom.get(args.element);
    this.dataSource = args.dataSource;
    this.paginator = args.paginator;
    this.actionBar = new ActionBar(this.el.querySelector('.action-bar'));
    this.imvu = args.imvu;
    this.tabBar = args.tabBar;

    var columnDefs = [
        {key:'selected', formatter: this.formatSelectionCheckbox.bind(this)},
        {key:'avpic_url', formatter: this.formatAvatarThumbnail.bind(this)},
        {key:'online', formatter: this.formatOnlineIndicator.bind(this)},
        {key:'avatarname', formatter: this.formatAvatarName.bind(this)},
        {key:'friendRequestStaticText', formatter: this.formatFriendRequestStaticText.bind(this)},
        {key:'buttons', formatter: this.formatButtons.bind(this)}
    ];

    var dt_el = this.el.querySelector('#friendList');
    this.dataTable = new YAHOO.widget.DataTable(dt_el, columnDefs, this.dataSource, {
            formatRow: this.formatRow.bind(this),
            paginator: this.paginator
        }
    );

    this.actionBar.addButton('accept', _T("Accept selected"));
    this.actionBar.addButton('ignore', _T("Ignore selected"));

    this.actionBar.selectEvents.all.subscribe(this.selectAll, this, true);
    this.actionBar.selectEvents.none.subscribe(this.selectNone, this, true);

    this.actionBar.buttonEvents.accept.subscribe(this.acceptGroup, this, true);
    this.actionBar.buttonEvents.ignore.subscribe(this.ignoreGroup, this, true);

    var self = this;
    function handleBuddiesChanged(eventName, data) {
        self.refreshView();
    }
    IMVU.Client.EventBus.register('BuddiesChanged', handleBuddiesChanged);
}

FriendList.prototype = {
    showSpinner: function() {
        if (!this.el.querySelector('.loading-mask')){
            var mask = document.createElement('div');
            $(mask).addClass('loading-mask');
            var spinner = document.createElement('div');
            $(spinner).addClass('loading-spinner');
            mask.appendChild(spinner);
            this.el.appendChild(mask);
            IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
        }
    },

    hideSpinner: function() {
        var mask = this.el.querySelector('.loading-mask');
        if (mask){
            this.el.removeChild(mask);
        }
        this.selectsChanged();
    },

    pulseSpinner: function() {
        this.showSpinner();
        setTimeout(this.hideSpinner.bind(this), 500);
    },

    addBuddy: function(cid_or_list) {
        if(!cid_or_list) { return; }
        if(cid_or_list.constructor == Array && cid_or_list.length === 0) {
            this.pulseSpinner();
            return;
        }
        this.showSpinner();
        this.imvu.call('addBuddy', cid_or_list, 'client inbox');
    },

    dialogConfirm : new IMVU.Client.widget.Dialog("confirm-dialog", {
        width:"450px", height:"110px", modal:true, fixedcenter:true, visible:false
    }),

    confirmDeletion: function(count, cbConfirmed) {
        this.dialogConfirm.setHeader(_T("Ignore")+' '+count+' '+_T("Friend Requests"));
        this.dialogConfirm.setBody(_T("Are you sure you want to")+' <b>'+_T("ignore")+'</b> '+_T("the")+' '+count+' '+_T("friend requests you selected?")+'<div class="confirm-buttons-holder"><div id="btn-confirm-remove-delete">'+_T("Ignore Selected")+'</div><div id="btn-confirm-remove-cancel">'+_T("Cancel")+'</div></div>');
        this.dialogConfirm.cfg.setProperty("effect", {effect:YAHOO.widget.ContainerEffect.FADE,duration:0.15} );
        this.dialogConfirm.render(document.body);

        new ImvuButton('#btn-confirm-remove-cancel', {
            grey:true,
            callback: function () {
                this.dialogConfirm.hide();
            }.bind(this)
        });
        new ImvuButton('#btn-confirm-remove-delete', {
            callback: function () {
                this.dialogConfirm.cfg.setProperty('effect', null);
                this.dialogConfirm.hide();
                cbConfirmed();
            }.bind(this)
        });
        this.dialogConfirm.show();
    },

    reallyRemoveBuddy: function(cid_or_list) {
        this.showSpinner();
        this.imvu.call('removeBuddy', cid_or_list);
    },

    removeBuddy: function(cid_or_list) {
        if(!cid_or_list) { return; }
        if(cid_or_list.constructor == Array && cid_or_list.length === 0) {
            this.pulseSpinner();
            return;
        }
        if(cid_or_list.constructor == Array && cid_or_list.length > 1) {
            //confirm
            this.confirmDeletion(
                cid_or_list.length,
                function () {
                    this.reallyRemoveBuddy(cid_or_list);
                }.bind(this)
            );
        } else {
            //only 1 buddy, just do it
            this.reallyRemoveBuddy(cid_or_list);
        }
    },

    allCheckboxes: function () {
        return $('input[type=checkbox]', this.el);
    },

    getSelectedCids: function() {
        var result = [];
        this.allCheckboxes().filter(':checked').each(function (index, cb) {
            result.push(cb.cid);
        });
        return result;
    },

    ignoreGroup: function() {
        this.removeBuddy(this.getSelectedCids());
    },

    acceptGroup: function() {
        this.addBuddy(this.getSelectedCids());
    },

    refreshView: function() {
        this.hideSpinner();
        function cb(sRequest, oResponse, oPayload) {
            oResponse.meta.totalRows = oResponse.results.length;
            this.dataTable.onDataReturnReplaceRows(sRequest, oResponse, oPayload);
            this.dataSource.fireEvent('requestResult', {request:sRequest, response:oResponse, payload:oPayload});
            if(this.tabBar) {
                this.tabBar.setTabText('friend-requests', _T("friend requests")+' ('+oResponse.results.length+')');
            }
            this.pulseSpinner();
        }
        this.dataSource.sendRequest('', {success:cb, scope:this});
    },

    selectAll: function() {
        this.allCheckboxes().prop('checked', true);
    },

    selectNone: function() {
        this.allCheckboxes().prop('checked', false);
    },

    selectsChanged: function() {
        var allOff = true;
        var allOn = true;
        this.allCheckboxes().each(function (index, cb) {
            allOff = allOff && !cb.checked;
            allOn = allOn && cb.checked;
        });
    },

    formatRow: function(elTr, oRecord) {
        if (oRecord.getData('online')) {
            $(elTr).addClass('is-online');
        }
        YAHOO.util.Event.addListener(elTr, 'click', function(e) {
            var cb = elTr.querySelector('input[type=checkbox]');
            cb.checked = !cb.checked;
            this.selectsChanged();
        }, this, true);
        return true;
    },

    getName: function(oRecord) {
        var useName = oRecord.getData('avatarname');
        if(oRecord.getData('guest')) {
            useName = "Guest_"+useName;
        }
        return useName;
    },

    formatSelectionCheckbox: function(elCell, oRecord, oColumn, oData) {
        var cid = oRecord.getData('cid');

        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'select';
        cb.cid = cid;
        YAHOO.util.Event.addListener(cb, 'click', function(e) { e.stopPropagation(); });
        YAHOO.util.Event.addListener(cb, 'change', this.selectsChanged, this, true);
        elCell.appendChild(cb);
    },

    formatAvatarThumbnail: function(elCell, oRecord, oColumn, imageUrl) {
        var img = document.createElement('img');
        $(img).addClass('avpic');
        img.src = imageUrl;
        img.width = 25;
        img.height = 32;

        var cid = oRecord.getData('cid');
        var useName = this.getName(oRecord);
        YAHOO.util.Event.addListener(img, 'click', function(e) {
            e.stopPropagation();
            IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
            this.imvu.call('showAvatarCard', cid, {avname:useName});
        }, this, true);
        elCell.appendChild(img);
    },

    formatAvatarName: function(elCell, oRecord, oColumn, avatarName) {
        var useName = this.getName(oRecord);
        var d = document.createElement('span');
        $(d).addClass('avatarname');
        d.innerHTML = useName;

        var cid = oRecord.getData('cid');
        YAHOO.util.Event.addListener(d, 'click', function(e) {
            e.stopPropagation();
            IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
            this.imvu.call('showAvatarCard', cid, {avname:useName});
        }, this, true);
        elCell.appendChild(d);
        
        if (oRecord.getData('is_vip')) {
            var d3 = document.createElement('span');
            $(d3).addClass('vip-icon');
            elCell.appendChild(d3);
        }

        if (oRecord.getData('is_ap') && !this.imvu.call('isTeen')) {
            var d2 = document.createElement('span');
            $(d2).addClass('ap-icon');
            elCell.appendChild(d2);
        }    
    },

    formatOnlineIndicator: function(elCell, oRecord, oColumn, isOnline) {
        elCell.innerHTML = "<div class='online-indicator'></div>";
    },

    formatFriendRequestStaticText: function(elCell, oRecord, oColumn) {
        elCell.innerHTML = _T("FRIEND REQUEST");
    },

    formatButtons: function(elCell, oRecord, oColumn) {
        var buttons = document.createElement('div');
        $(buttons).addClass('buttons');

        var cid = oRecord.getData('cid');

        var accept = document.createElement('div');
        accept.innerHTML = _T("Accept");
        $(accept).addClass('accept');
        YAHOO.util.Event.addListener(accept, 'click', function(e) {
            e.stopPropagation();
            this.addBuddy(cid);
        }, this, true);

        var ignore = document.createElement('div');
        ignore.innerHTML = _T("Ignore");
        $(ignore).addClass('ignore');
        YAHOO.util.Event.addListener(ignore, 'click', function(e) {
            e.stopPropagation();
            this.removeBuddy(cid);
        }, this, true);

        buttons.appendChild(accept);
        buttons.appendChild(ignore);

        elCell.appendChild(buttons);
    }
};


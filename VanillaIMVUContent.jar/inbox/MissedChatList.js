function MissedChatList(el, config) {
    this.el = YAHOO.util.Dom.get(el);
    this.dataSource = config.dataSource;
    this.paginator = config.paginator;
    this.imvu = config.imvu;
    this.net = config.net;
    this.tabBar = config.tabBar;
    this.currentDate = config.currentDate || new Date();
    this.actionBar = new ActionBar(this.el.querySelector('.action-bar'));
    this.showingError = false;

    var columnDefs = [
        {key: 'selected', formatter: this.formatSelectionCheckbox.bind(this)},
        {key: 'avpic_url', formatter: this.formatAvatarThumbnail.bind(this)},
        {key: 'online', formatter: this.formatOnlineIndicator.bind(this)},
        {key: 'avatarname', formatter: this.formatAvatarName.bind(this)},
        {key: 'missedChatStaticText', formatter: this.formatMissedChatStaticText.bind(this)},
        {key: 'date', formatter: this.formatMessageDate.bind(this)}
    ];

    var dt_el = this.el.querySelector('#missedChat');
    this.dataTable = new YAHOO.widget.DataTable(dt_el, columnDefs, this.dataSource, {
            formatRow: this.formatRow.bind(this),
            paginator: this.paginator,
            initialLoad: false
        }
    );

    this.dataSource.subscribe('requestResult', this.handleRequestResult.bind(this));
    this.dataSource.subscribe('requestEvent', this.handleRequestSent.bind(this));
    
    this.actionBar.addButton('delete', _T("Delete"));
    this.actionBar.selectEvents.all.subscribe(this.selectAll, this, true);
    this.actionBar.selectEvents.none.subscribe(this.selectNone, this, true);
    this.actionBar.buttonEvents['delete'].subscribe(this.deleteGroup, this, true);

    this.refreshPeriodicallyArgs = null;
    this.refreshPeriodically(this, this.refreshView, 1000*60*5);

    this.refreshView();    
}

MissedChatList.prototype = {

    refreshView: function() {
        this.dataSource.refresh();
    },
    
    refreshPeriodically: function (context, fn, interval) {
        this.refreshPeriodicallyArgs = arguments;
        setInterval(fn.bind(context), interval);
    },

    showSpinner: function() {
        if (!this.el.querySelector('.loading-mask')) {
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

    handleRequestSent: function() {
        this.showSpinner();
    },

    handleRequestResult: function(args) {
        this.hideSpinner();    
        if ('error' in args) {
            if (!this.showingError) {
                this.showingError = true;
                this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a problem getting your chat invites"));
                this.showingError = false;
            }
            return;
        }
        var req = args.request;
        var resp = args.response;
        var payload = args.payload;
        this.dataTable.onDataReturnInitializeTable(req, resp, payload);
    },

    allCheckboxes: function () {
        return $('input[type=checkbox]', this.el);
    },

    getSelectedIds: function() {
        var result = [];
        this.allCheckboxes().filter(':checked').each(function (index, cb) {
            var cid = parseInt(cb.getAttribute('cid'), 10);
            result.push(cid);
        });
        return result;
    },
    
    confirmDeletion: function(count, cbConfirmed) {
        this.dialogConfirm.setHeader(_T("Delete")+' '+count+' '+_T("Items"));
        this.dialogConfirm.setBody(_T("Are you sure you want to")+' <b>'+_T("delete")+'</b> '+_T("the")+' '+count+' '+_T("items you selected?")+'<div class="confirm-buttons-holder"><div id="btn-confirm-remove-delete">'+_T("Delete Selected")+'</div><div id="btn-confirm-remove-cancel">'+_T("Cancel")+'</div></div>');
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

    reallyDeleteGroup: function(ids) {
        var args = {action: 'delete', inviter_cid: ids};        
        var cb = function(result, error) {
            this.refreshView();
        };
        this.showSpinner();
        serviceRequest({
            method: 'POST',
            uri: '/api/missedchat.php',
            data: args,
            callback: cb.bind(this),
            json: true,
            network: this.net,
            imvu: this.imvu,
        });
    },

    deleteGroup: function() {
        var ids = this.getSelectedIds();    
        if(ids.length === 0) {
            return;
        }
        if(ids.length > 1) {
            this.confirmDeletion(
                ids.length,
                function () {
                    this.reallyDeleteGroup(ids);
                }.bind(this)
            );
        } else {
            this.reallyDeleteGroup(ids);
        }
    },

    dialogConfirm : new IMVU.Client.widget.Dialog("confirm-dialog", {
        width:"450px", height:"110px", modal:true, fixedcenter:true, visible:false
    }),

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

    getName: function(oRecord) {
        var useName = oRecord.getData('avatarname');
        if(oRecord.getData('guest')) {
            useName = "Guest_"+useName;
        }
        return useName;
    },
    
    formatRow: function(elTr, oRecord) {        
        if (oRecord.getData('online')) {
            $(elTr).addClass('is-online');
        }
        if (oRecord.getData('is_ap') && !this.imvu.call('isTeen')) {
            $(elTr).addClass('ap-icon');
        }        
        
        YAHOO.util.Event.addListener(elTr, 'click', function(e) {
                var cb = elTr.querySelector('input[type=checkbox]');
            cb.checked = !cb.checked;
            this.selectsChanged();
        }, this, true);
        return true;
    },
    
    formatSelectionCheckbox: function(elCell, oRecord, oColumn, oData) {
        var cid = oRecord.getData('inviter_cid');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'select';
        cb.setAttribute('cid', cid);
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

        var cid = oRecord.getData('inviter_cid');
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

        var cid = oRecord.getData('inviter_cid');
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

    formatMissedChatStaticText: function(elCell, oRecord, oColumn) {
        elCell.innerHTML = _T("MISSED CHAT INVITE");
    },

    formatMessageDate: function(elCell, oRecord, oColumn, messageDateString) {
        var div = document.createElement('div');
        var messageDate = IMVU.Time.localDateFromServerTime(messageDateString);
        elCell.innerHTML = IMVU.Time.howLongAgo(messageDate / 1000, this.currentDate / 1000);

        var formattedDate = IMVU.Time.formatDateObj(this.currentDate, messageDate);
        var tooltip = new YAHOO.widget.Tooltip('date-time', {context: elCell, text: formattedDate, showDelay:250, xyoffset:[0, 0]});
    }
};

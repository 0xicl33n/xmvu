
function MessageList(args) {
    this.el = args.el;
    this.dataSource = args.dataSource;
    this.paginator = args.paginator;
    this.actionBar = new ActionBar(this.el.querySelector('.action-bar'));
    this.messageView = args.messageView;
    this.tabBar = args.tabBar;
    this.net = args.net;
    this.imvu = args.imvu;
    this.currentDate = args.currentDate || new Date();
    this.eventBus = args.eventBus || IMVU.Client.EventBus;
    this.showingError = false;

    var columnDefs = [
        {key:'selected', formatter: this.formatSelectionCheckbox.bind(this)},
        {key:'avpic_url', formatter: this.formatAvatarThumbnail.bind(this)},
        {key:'online', formatter: this.formatOnlineIndicator.bind(this)},
        {key:'avatarname', formatter: this.formatAvatarName.bind(this)},
        {key:'message_type', formatter: this.formatMessageType},
        {key:'message_text', formatter: this.formatMessageText.bind(this)},
        {key:'date', formatter: this.formatMessageDate.bind(this)},
        {key:'gift', formatter: this.formatGiftType}
    ];

    var dt_el = this.el.querySelector('#messageList');
    this.dataTable = new YAHOO.widget.DataTable(dt_el, columnDefs, this.dataSource, {
            formatRow: this.formatRow,
            paginator: this.paginator,
            initialLoad: false
        }
    );

    this.actionBar.addButton('delete', _T("Delete"));

    this.actionBar.selectEvents.all.subscribe(this.selectAll, this, true);
    this.actionBar.selectEvents.none.subscribe(this.selectNone, this, true);

    this.actionBar.buttonEvents['delete'].subscribe(this.deleteGroup, this, true);

    this.dataSource.subscribe('requestResult', this.handleRequestResult.bind(this));
    this.dataSource.subscribe('requestEvent', this.handleRequestSent.bind(this));

    this.refreshView();

    this.refreshPeriodicallyArgs = null;
    this.refreshPeriodically(this, this.refreshView, 1000*60*5);

    this.eventBus.register('ServerEvent.messageReceived', this.refreshView.bind(this));
}

MessageList.prototype = {
    refreshPeriodically: function (context, fn, interval) {
        this.refreshPeriodicallyArgs = arguments;
        setInterval(fn.bind(context), interval);
    },

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
        setTimeout(this.hideSpinner.bind(this), 250);
    },

    allCheckboxes: function () {
        return $('input[type=checkbox]', this.el);
    },

    getSelectedIds: function() {
        var result = [];
        this.allCheckboxes().filter(':checked').each(function (index, cb) {
            result.push(cb.message_id);
        });
        return result;
    },

    refreshView: function() {
        this.dataSource.refresh();
    },

    dialogConfirm : new IMVU.Client.widget.Dialog("confirm-dialog", {
        width:"450px", height:"110px", modal:true, fixedcenter:true, visible:false
    }),

    confirmDeletion: function(count, cbConfirmed) {
        resp = this.imvu.call('showYesNoDialog', _T("Delete")+' ' + count + ' '+_T("items"), _T("Are you sure you want to")+' <b>'+_T("delete")+'</b> '+_T("the")+' ' + count + ' '+_T("items you selected?"));
        
        if (resp && resp.result) {
            cbConfirmed();
        }
    },

    reallyDeleteGroup: function(ids) {
        var args = {action:'delete', message_ids:ids};
        var cb = function(result, error) {
            this.refreshView();
        };
        this.showSpinner();
        serviceRequest({
            method: 'POST',
            uri: '/api/messages.php',
            data: args,
            callback: cb.bind(this),
            json: true,
            network: this.net,
            imvu: this.imvu
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

    handleRequestSent: function() {
        this.showSpinner();
    },

    handleRequestResult: function(args) {
        this.hideSpinner();
        if ('error' in args) {
            if (!this.showingError) {
                this.showingError = true;
                this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a problem getting your messages"));
                this.showingError = false;
            }
            return;
        }
        var req = args.request;
        var resp = args.response;
        var payload = args.payload;
        this.dataTable.onDataReturnInitializeTable(req, resp, payload);
    },

    formatRow: function(elTr, oRecord) {
        var $tr = $(elTr);
        if (oRecord.getData('online')) {
            $tr.addClass('is-online');
        }

        var mt = oRecord.getData('message_type');
        if (mt == 'chat_invite') {
            $tr.addClass('chat-invite');
        } else if (mt == 'friend_request') {
            $tr.addClass('friend-request');
        } else {
            $tr.addClass('message');
        }

        if (oRecord.getData('has_gift')) {
            $tr.addClass('product-gift');
        } else if (oRecord.getData('has_music')) {
            $tr.addClass('music-gift');
        } else if (oRecord.getData('has_badge')) {
            $tr.addClass('badge-gift');
        }

        return true;
    },

    formatSelectionCheckbox: function(elCell, oRecord, oColumn, oData) {
        var checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.className = 'select';
        checkBox.message_id = oRecord.getData('customers_quickmessages_id');
        YAHOO.util.Event.addListener(checkBox, 'click', function(e) { e.stopPropagation(); });
        YAHOO.util.Event.addListener(elCell.parentNode, 'click', function(e) { 
            checkBox.checked = !checkBox.checked;
            e.stopPropagation();
        });
        YAHOO.util.Event.addListener(checkBox, 'change', this.selectsChanged, this, true);
        elCell.appendChild(checkBox);
    },

    formatAvatarThumbnail: function(elCell, oRecord, oColumn, imageUrl) {
        var self = this;
        var img = document.createElement('img');
        $(img).addClass('avpic');
        img.src = imageUrl;
        img.width = 25;
        img.height = 32;

        var cid = oRecord.getData('sender_id');
        var useName = this.getName(oRecord);
        YAHOO.util.Event.addListener(
            img, 
            'click', 
            function(e){ 
                YAHOO.util.Event.stopEvent(e);
                IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
                self.imvu.call('showAvatarCard', cid, {avname:useName});
            }
        );
        elCell.appendChild(img);
    },

    getName: function(oRecord) {
        var useName = oRecord.getData('avatarname');
        if(oRecord.getData('guest')) {
            useName = "Guest_"+useName;
        }
        return useName;
    },

    formatAvatarName: function(elCell, oRecord, oColumn, avatarName) {
        var self = this;
        var useName = this.getName(oRecord);
        var d = document.createElement('span');
        $(d).addClass('avatarname');
        d.innerHTML = useName;
        var cid = oRecord.getData('sender_id');
        YAHOO.util.Event.addListener(
            d, 
            'click', 
            function(e){ 
                YAHOO.util.Event.stopEvent(e);
                IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
                self.imvu.call('showAvatarCard', cid, {avname:useName}); 
            }
        );
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

    formatMessageType: function(elCell, oRecord, oColumn, messageType) {
        elCell.innerHTML = "<div class='type'></div>";
    },

    formatMessageDate: function(elCell, oRecord, oColumn, messageDateString) {
        
        var messageDate = IMVU.Time.localDateFromServerTime(messageDateString);
        var div = document.createElement('div');

        $(div).addClass('date-time');
        div.innerHTML = IMVU.Time.howLongAgo(messageDate / 1000, this.currentDate / 1000);
        elCell.appendChild(div);

        var formattedDate = IMVU.Time.formatDateObj(this.currentDate, messageDate);
        var tooltip = new YAHOO.widget.Tooltip('date-time', {context: div, text: formattedDate, showDelay:250, xyoffset:[0,0]});
    },

    formatMessageText: function(elCell, oRecord, oColumn, messageText) {
        var self = this;
        messageText = stripTags(messageText);
        if (!oRecord.getData('is_public')) {
            messageText = '<span class="privacy">[ '+_T("Private")+' ]</span> ' + messageText;
        }
        elCell.innerHTML = messageText;
        var setViewAndShowMessage = function() {
            self.messageView.activate();
            self.messageView.showMessage(oRecord);            
        };
        YAHOO.util.Event.on(elCell.parentNode.parentNode, 'click', function() {
            setViewAndShowMessage();
        });
    },

    formatGiftType: function(elCell, oRecord, oColumn, giftType) {
        elCell.innerHTML = "<div class='gift'></div>";
    }
};

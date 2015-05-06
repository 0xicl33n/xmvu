function GetMatchedList(el, config) {
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
        {key: 'buttons', formatter: this.formatButtons.bind(this)},
        {key: 'match_date', formatter: this.formatMessageDate.bind(this)}
    ];

    var dt_el = this.el.querySelector('#getMatched');
    this.dataTable = new YAHOO.widget.DataTable(dt_el, columnDefs, this.dataSource, {
            formatRow: this.formatRow.bind(this),
            paginator: this.paginator,
            initialLoad: false
        }
    );
    IMVU.Client.EventBus.register('getMatchedNotificationNumber', this.updateGetMatchedNotificationsNumber.bind(this));

    this.dataSource.subscribe('requestResult', this.handleRequestResult.bind(this));
    this.dataSource.subscribe('requestEvent', this.handleRequestSent.bind(this));
    
    this.actionBar.addButton('delete', _T("Delete"));
    this.actionBar.selectEvents.all.subscribe(this.selectAll, this, true);
    this.actionBar.selectEvents.none.subscribe(this.selectNone, this, true);
    this.actionBar.buttonEvents['delete'].subscribe(this.deleteGroup, this, true);

    this.refreshView();    
}

GetMatchedList.prototype = {

    refreshView: function() {
        this.dataSource.refresh();
    },
    
    invalidateAndRefreshCallback: function(response, error) {
        this.dataSource.refresh();
        IMVU.Client.EventBus.fire('getMatchedNotification',{}); 
    },
    
    invalidate: function(response, error) {
        IMVU.Client.EventBus.fire('getMatchedNotification',{}); 
    },

    updateGetMatchedNotificationsNumber: function(eventName, totalCount) {
        if(this.tabBar) {
            if (totalCount.totalCount != '0') {
                this.tabBar.setTabText('get-matched', _T("matches")+' ('+totalCount.totalCount+')');
            } else {
                this.tabBar.setTabText('get-matched', _T("matches"));
            }
        }
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
            return;
        }
        var req = args.request;
        var resp = args.response;
        var payload = args.payload;
        this.dataTable.onDataReturnInitializeTable(req, resp, payload);
        IMVU.Client.EventBus.fire('getMatchedNotification',{});
    },

    allCheckboxes: function () {
        return $('input[type=checkbox]', this.el);
    },

    getSelectedUris: function() {
        var result = [];
        this.allCheckboxes().filter(':checked').each(function (index, cb) {
            var uri = cb.getAttribute('uri');
            result.push(uri);
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

    reallyDeleteGroup: function(uris) {
        this.showSpinner();
        var cb = function(result, error) {
            if (error) {
                IMVU.log('error: ', error);
            }
        };
        var refreshCb = function(result, error) {
            if (error) {
                IMVU.log('error: ', error);
            }
        };
        _.each(uris, function(uri, index) {
            if (index == uris.length-1) {
                cb = this.invalidateAndRefreshCallback;
            }
            this.updateMatchStatus(uri, "0", cb);
        }.bind(this));
    },

    updateMatchStatus: function(uri, status, cb) {
        serviceRequest({
            method: 'POST',
            uri: uri,
            data: {status: status},
            callback: cb.bind(this),
            json: true,
            network: this.net,
            imvu: this.imvu,
        });
    },

    deleteGroup: function() {
        var uris = this.getSelectedUris();
        if(uris.length === 0) {
            return;
        }
        if(uris.length > 1) {
            this.confirmDeletion(
                uris.length,
                function () {
                    this.reallyDeleteGroup(uris);
                }.bind(this)
            );
        } else {
            this.reallyDeleteGroup(uris);
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
        if (oRecord.getData('status') === "1") {
            $(elTr).addClass('unread');
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
        var cid = oRecord.getData('matched_customers_id');
        var uri = oRecord.getData('match_uri');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'select';
        cb.setAttribute('cid', cid);
        cb.setAttribute('uri', uri);
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

        var cid = oRecord.getData('matched_customers_id');
        var uri = oRecord.getData('match_uri');
        var useName = this.getName(oRecord);
        YAHOO.util.Event.addListener(img, 'click', function(e) {
            e.stopPropagation();
            $(e.target).closest('.unread').removeClass('unread');
            IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
            this.imvu.call('showAvatarCard', cid, {avname:useName});
            this.updateMatchStatus(uri, "4", function(response, error) { // status=saw avatarcard
                this.invalidate();
            });
        }, this, true);
        elCell.appendChild(img);
    },

    formatAvatarName: function(elCell, oRecord, oColumn, avatarName) {
        var useName = this.getName(oRecord);
        var d = document.createElement('span');
        $(d).addClass('avatarname');
        d.innerHTML = useName;

        var cid = oRecord.getData('matched_customers_id');
        var uri = oRecord.getData('match_uri');
        YAHOO.util.Event.addListener(d, 'click', function(e) {
            e.stopPropagation();
            $(e.target).closest('.unread').removeClass('unread');
            IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
            this.imvu.call('showAvatarCard', cid, {avname:useName});
            this.updateMatchStatus(uri, "4", function(response, error) { // status=saw avatarcard
                this.invalidate();
            });
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

    formatMessageDate: function(elCell, oRecord, oColumn, messageDateString) {
        var div = document.createElement('div');
        var messageDate = IMVU.Time.localDateFromServerTime(messageDateString);
        elCell.innerHTML = IMVU.Time.howLongAgo(messageDate / 1000, this.currentDate / 1000);

        var formattedDate = IMVU.Time.formatDateObj(this.currentDate, messageDate);
        var tooltip = new YAHOO.widget.Tooltip('date-time', {context: elCell, text: formattedDate, showDelay:250, xyoffset:[0, 0]});
    },

    formatButtons: function(elCell, oRecord, oColumn) {
        var buttons = document.createElement('div');
        $(buttons).addClass('buttons');

        var cid = oRecord.getData('matched_customers_id');
        var uri = oRecord.getData('match_uri');
        var avatarname = oRecord.getData('avatarname');

        cid = parseInt(cid, 10);
        var isFriend = this.imvu.call('isUserFriend', cid);

        if (! isFriend) {
            var addFriend = document.createElement('div');
            addFriend.innerHTML = _T("Add Friend");
            $(addFriend).addClass('add-friend');
            $(addFriend).addClass('ui-event');
            $(addFriend).attr('data-ui-name', 'add_friend');
            $(addFriend).attr('data-ui-tab', 'matches');
            YAHOO.util.Event.addListener(addFriend, 'click', function(e) {
                e.stopPropagation();
                this.showSpinner();
                this.updateMatchStatus(uri, "3", function(response, error) {  // status=add friend
                    this.imvu.call('addBuddy', cid, 'client inbox');
                    this.invalidate();
                });
                var $unreadRow = $(e.target).closest('.unread');
                $unreadRow.removeClass('unread');
                $(e.target).hide();
                this.hideSpinner();
            }, this, true);
            buttons.appendChild(addFriend);
        }

        if (oRecord.getData('online')) {
            var invite = document.createElement('div');
            invite.innerHTML = _T("Invite to chat");
            $(invite).addClass('invite');
            $(invite).addClass('ui-event');
            $(invite).attr('data-ui-name', 'invite');
            $(invite).attr('data-ui-tab', 'matches');
            YAHOO.util.Event.addListener(invite, 'click', function(e) {
                e.stopPropagation();
                this.showSpinner();
                this.updateMatchStatus(uri, "2", function(response, error) { // status=invited
                    this.imvu.call('inviteToChat', cid);
                    this.invalidate();
                });
            }, this, true);
    
            buttons.appendChild(invite);
        } else {
            var sendMessage = document.createElement('div');
            sendMessage.innerHTML = _T("Send Message");
            $(sendMessage).addClass('send-message');
            $(sendMessage).addClass('ui-event');
            $(sendMessage).attr('data-ui-name', 'send-message');
            $(sendMessage).attr('data-ui-tab', 'matches');
            YAHOO.util.Event.addListener(sendMessage, 'click', function(e) {
                e.stopPropagation();
                this.showSpinner();
                this.updateMatchStatus(uri, "6", function(response, error) { // status=sent message
                    this.imvu.call('showMessageDialog', {cid: cid, recipient_name: avatarname, startWithGift: false});
                    this.invalidate();
                    this.hideSpinner();
                });
            }, this, true);
            
            buttons.appendChild(sendMessage);
            
        }

        elCell.appendChild(buttons);
    }
};

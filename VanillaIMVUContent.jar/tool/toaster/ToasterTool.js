function ToasterTool(toastElement, imvu, timer, rest, eventBus ) {
    this.imvu = imvu;
    this.timer = timer || new Timer();
    this.toastElement = toastElement;
    this.toast = {};
    this.eventBus = eventBus;
    this.rest = rest;
}

ToasterTool.prototype = {
    addFriendApproveToast: function(avatarInfo) {
        if (this.shouldShowFriendNotifications()) {
            this.addGenericToast(avatarInfo, {
                        'title' : _T("Friend Request Approved"),
                        'comment' : (avatarInfo.isGuest?_T('Guest_'):'')+avatarInfo.avatarName+_T(" has accepted your friend request!"),
                        'closeBtn' : true
                    });
        }
    },
    
    addFanRequestToast: function(avatarInfo) {
        if (this.shouldShowFriendNotifications()) {
            this.addGenericToast(avatarInfo, {
                        'title' : _T("Friend Request"),
                        'comment' : (avatarInfo.isGuest?'Guest_':'')+avatarInfo.avatarName+_T(" wants to be your friend. Click \'Accept\' to become friends"),
                        'ignoreBtn' : true,
                        'inviteBtn' : false,
                        'acceptBtn' : true,
                        'closeBtn' : true
                    });
        }
    },

    addMessageReceivedToast: function(avatarInfo) {
        if (this.imvu.call('getPref', 'enableRealtimeMessageNotification')) {
            this.addGenericToast(avatarInfo, {
                        'title' : _T("New Message"),
                        'comment' : (avatarInfo.isGuest ? 'Guest_' : '') + avatarInfo.avatarName + _T(" sent you a new message"),
                        'ignoreBtn' : false,
                        'inviteBtn' : false,
                        'acceptBtn' : false,
                        'showBtn' : true,
                        'showUiEventName' : 'quickmessage_toaster_show',
                        'closeBtn' : true
                    });
        }
    },

    addQuestCompletedToast: function(avatarInfo, info) {
        if (this.imvu.call('getPref', 'enableRealtimeMessageNotification') && info.silent === 0) {
            this.addGenericToast(avatarInfo, {
                'title' : _T("Quest Complete"),
                'comment' : _T('You have completed the "') + info.questName + _T('" quest!'),
                'ignoreBtn' : false,
                'inviteBtn' : false,
                'acceptBtn' : false,
                'showBtn' : true,
                'showBtnEvtHandler' : function() {                        
                    this.eventBus.fire('QuestsTool.ShowDialog', {url: info.questUrl, done: true});
                }.bind(this),
                'showUiEventName' : 'quest_toaster_show',
                'closeBtn' : true
            });
        }
    },
    
    addGetMatchedNotificationToast: function(avatarInfo, info) {
        var isFriend = this.imvu.call('isUserFriend', avatarInfo.userId);
        var comment = isFriend ? 
            _T('Hooray, you and "') + avatarInfo.avatarName + _T('" liked each other! Invite them to chat.') :
            _T('Hooray, you and "') + avatarInfo.avatarName + _T('" liked each other! Add them as a friend or invite them to chat.');
        if (this.imvu.call('getPref', 'enableRealtimeMessageNotification')) {
            this.addGenericToast(avatarInfo, {
                    'title' : _T("It's a Match"),
                    'comment' : comment,
                    'ignoreBtn' : false,
                    'inviteBtn' : true,
                    'inviteBtnEvtHandler' : function() {
                        this.imvu.call('inviteToChat', avatarInfo.userId);
                        this.rest.post(info.match_uri, {status: 2});
                    }.bind(this),
                    'acceptBtn' : ! isFriend,
                    'acceptBtnText' : _T('Add Friend'),
                    'acceptBtnEvtHandler' : function() {
                        this.imvu.call('addBuddy', avatarInfo.userId, 'client toaster');
                        this.rest.post(info.match_uri, {status: 3});
                    }.bind(this),
                    'showBtn' : false,
                    'closeBtn' : true
            });
        }
    },

    addFlashNotificationToast: function(avatarInfo, info) {
        if (this.imvu.call('getPref', 'enableRealtimeMessageNotification')) {
            this.addGenericToast(avatarInfo, {
                'title' : info.title,
                'comment' : info.content,
                'ignoreBtn' : false,
                'acceptBtn' : false,
                'showBtn' : false,
                'showUiEventName' : 'flash_notification_toaster_show',
                'closeBtn' : true,
                'isHtml': true,
                'timeout': 60
            });
        }
    },

    addWalkOffInvite: function(inviteInfo) {
        var $toastElement = $('#toast').clone().toggle();

        var chatId = inviteInfo.chatId;
        var inviter = inviteInfo.inviter;
        var inviterName = inviteInfo.inviterName;
        var inviterPic = inviteInfo.inviterPic;

        $toastElement.find('#title').text('Walk Off Request');
        $toastElement.find('#request #text').text(inviterName + ' wants to play you in a game of Walk Off!');

        $toastElement.find('#request #friend_pic').css('background',"url("+inviterPic+")");

        new ImvuButton($toastElement.find('#accept')[0], {callback : function(chatId) {
            this.toast[chatId].toaster('close');
            this.imvu.call('replyToWalkOffInvite', chatId, {'accept':true, 'inviter': inviter});
        }.bind(this, chatId)});

        $toastElement.find('#ignore').toggle(true);
        $toastElement.find('#ignore').text("Not Now");
        $toastElement.find('#show').toggle(false);
        $toastElement.find('#invite').toggle(false);
        new ImvuButton(
                $toastElement.find('#ignore')[0],
                {
                    'grey' : true,
                    callback : function(chatId) {
                        this.toast[chatId].toaster('close');
                        this.imvu.call('replyToWalkOffInvite', chatId, {'accept':false, 'inviter': inviter});
                    }.bind(this, chatId)
                }
        );

        $toastElement.find('#btn_close').click(function(chatId){
            this.toast[chatId].toaster('close');
        }.bind(this, chatId));

        var options = {
            onAnimate: function(toaster) { this.onAnimate(toaster); }.bind(this),
            onClosed: function(toaster) { this.onAnimate(toaster); }.bind(this),
            onOpened: function(toaster) { this.onAnimate(toaster); }.bind(this),
            timer: this.timer,
            rootElement: this.toastElement,
            timeout: 30
        };
        this.toast[chatId] = $toastElement.toaster(options);
    },
    
    hideToast: function(inviteInfo) {
        var chatId = inviteInfo['chatId'];
        if (this.toast[chatId]) {
            this.toast[chatId].toaster('close');
            delete this.toast[chatId];
        }
    },

    shouldShowFriendNotifications: function() {
        return this.imvu.call('getPref', 'enableRealtimeFriendNotification');
    },

    addGenericToast: function(avatarInfo, args) {        
        if(!this.imvu.call('shouldShowToasts')) {
            return;
        }               
        
        var self = this,
            acceptBtnText = args.acceptBtnText || 'Accept',
            showBtnText = args.showBtnText || 'Show',
            toastElement = $('#toast').clone().toggle(),
            avpic_url = avatarInfo.picUrl_40x55;

        $('#request #friend_pic', toastElement).css('background',"url("+avpic_url+")");

        if (args.isHtml) {
            $('#request #text', toastElement).html(args.comment);
        } else {
            $('#request #text', toastElement).text(args.comment);
        }
        $('#title', toastElement).text(args.title);
        $('#accept', toastElement).text(acceptBtnText);
        $('#show', toastElement).text(showBtnText);
        if (args.showUiEventName) {
            $('#show').attr('data-ui-name', args.showUiEventName);
        }

        function makeButton(arg, id, properties) {
            if (arg) {
                $(id, toastElement).toggle(true);
                new ImvuButton($(id, toastElement)[0], properties);
            } else {
                $(id, toastElement).toggle(false);
            }
        }
        makeButton(args.ignoreBtn, '#ignore', {
            'grey' : true,
            callback : function() {
                toast.toaster('close');
                self.imvu.call('removeBuddy', avatarInfo.userId);
            }
        });
        makeButton(args.inviteBtn, '#invite', {
            callback: function() {
                toast.toaster('close');
                if (typeof args.inviteBtnEvtHandler === 'function') {
                    args.inviteBtnEvtHandler();
                } else {
                    self.imvu.call('inviteToChat', avatarInfo.userId);
                }
            }
        });
        makeButton(args.acceptBtn, '#accept', {
            callback: function() {
                toast.toaster('close');
                if (typeof args.acceptBtnEvtHandler === 'function') {
                    args.acceptBtnEvtHandler();
                } else {
                    self.imvu.call('addBuddy', avatarInfo.userId, 'client toaster');
                }
            }
        });
        makeButton(args.showBtn, '#show', {
            callback: function() {                
                toast.toaster('close');                
                if (typeof args.showBtnEvtHandler === 'function') {
                    args.showBtnEvtHandler();
                } else {
                    self.imvu.call('showInboxMode');
                }
            }
        });
        if (args.closeBtn) {
            $('#btn_close', toastElement).toggle(true);
            $('#btn_close', toastElement).click(
                function() {
                    toast.toaster('close');
                }
            );
        } else {
            $('#btn_close', toastElement).toggle(false);
        }

        var options = {
                onAnimate: function(toaster) { self.onAnimate(toaster); },
                onClosed: function(toaster) { self.onAnimate(toaster); },
                onOpened: function(toaster) { self.onAnimate(toaster); },
                timer: self.timer,
                rootElement: self.toastElement
        };
        if (args.timeout) {
            options.timeout = args.timeout;
        }
        var toast = toastElement.toaster(options);
        IMVU.Client.util.turnLinksIntoLaunchUrls(toast, self.imvu);
    },
    hideTool: function(event) {
        this.expanded = false;
        this.refreshSize();
    },

    showTool: function(event) {
        var toasterElement = $('#ui-toaster-br');
        this.imvu.call('setWindowSize', this.FULL_WIDTH , this.FULL_HEIGHT);

        this.expanded = true;
        this.refreshSize();
    },

    onAnimate: function(toaster) {
        var width = toaster.parent().width();
        var height = toaster.parent().height();
        this.imvu.call('setWindowSize', width ? width : 0 , height ? height : 0);
    },

    onClose: function(toaster) {
        this.imvu.call('setWindowSize', 0 , 0);
    }
};

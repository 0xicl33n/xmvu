function ChatTool(imvu, eventBus, textChatElement, network) {
    this.imvu = imvu;
    this.network = network;
    this.eventBus = eventBus;
    this.textChatElement = textChatElement;
    this.historyElement = textChatElement.querySelector('#history');
    this.formElement = textChatElement.querySelector('#input');
    this.sendButtonElement = textChatElement.querySelector('#send-button');
    this.inputElement = this.formElement.querySelector('input');
    this.textBubbleActive = false;
    this.chatParticipants = {};
    this.hideElement = textChatElement.querySelector('#hideChat');
    this.ctaElement = textChatElement.querySelector('.chat-cta');
    this.showElement = textChatElement.querySelector('#showChat');
    this.inputRowElement = textChatElement.querySelector('#inputRow');
    this.header = textChatElement.querySelector('#header');
    this.textSizeElement = textChatElement.querySelector('#textSize');
    this.closeButtonElement = textChatElement.querySelector('#closebutton');
    this.opacityFactor = 0.5;

    this.largeText = false;
    
    this.newWhisperIndicator = textChatElement.querySelector('#new-whisper-indicator');    
    this.elementToScrollTo = null;


    this.FULL_WIDTH = 504;
    this.FULL_HEIGHT = 900;
    
    if (this.inputElement) {
        this.formElement.removeChild(this.inputElement);
    }
    this.inputElement = document.createElement("textarea");
    this.formElement.appendChild(this.inputElement);
    this.inputElement.rows = 1;
    this.inputElement.cols = 36;
    
    $(this.textSizeElement).click(this.toggleTextSize.bind(this));
    $(this.inputElement).keydown(this.hideCTA.bind(this));
    $(this.inputElement).keyup(this.autoGrowTextArea.bind(this));
    $(this.inputElement).click(this.inputElementGetsFocus.bind(this));
    $(this.closeButtonElement).click(this.hideTool.bind(this));
    $(this.hideElement).click(this.hideTool.bind(this));
    $(this.showElement).click(this.showTool.bind(this));
    $(this.ctaElement).click(this.hideCTA.bind(this));
    
    $(this.textChatElement).addClass('redesign');
    
    if (this.imvu.call('getPref', 'newTextChatExpanded')) {
        this.showTool();
    } else {
        this.hideTool();
    }
    
    this.localUserId = this.imvu.call('getCustomerId');
    this.whisperTargetId = 0;
    this.whisperTargetName = '';
    
    $(this.textChatElement.querySelector('#new-whisper-indicator .stop')).click(this.cancelWhisper.bind(this));
    $(this.textChatElement.querySelector('.whisper-indicator')).click(this.cancelWhisper.bind(this));
    
    $(this.textChatElement.querySelector('#invert')).click(this.invert.bind(this));

    new ImvuButton(this.sendButtonElement, {callback: this.onSubmit.bind(this)});
    $(this.formElement).submit(this.onSubmitForm.bind(this));
    YAHOO.util.Event.addListener(this.historyElement, 'contextmenu', this.onHistoryContextMenu, this, true);
    YAHOO.util.Event.addListener(this.inputElement, 'contextmenu', this.onInputContextMenu, this, true);

    $(document).keydown(this.onKeyPress.bind(this));

    this.eventBus.register('SessionWindow.InitiateNewChat', this.__initiateNewChat, 'SessionWindow', this);
    this.eventBus.register('SessionWindow.ParticipantJoined', this.__onNewParticipant, 'SessionWindow', this);
    this.eventBus.register('SessionWindow.ParticipantLeft', this.__onParticipantLeft, 'SessionWindow', this);
    this.eventBus.register('SessionWindow.ReceivedMessage', this.__onNewMessage, 'SessionWindow', this);
    this.eventBus.register('SessionWindow.ReplaceRoom', this.__onReplaceRoom, 'SessionWindow', this);
    
    var initialParticipants = this.imvu.call('getAllParticipants'),
        i;
    
    if (initialParticipants) {
        i = initialParticipants.length;
        while (i--) {
            if (this.localUserId != initialParticipants[i].userId) {
                this.__onNewParticipant(null, initialParticipants[i]);
            }
        }
    }

    var maxlength = this.imvu.call('getImvuConfigVariable', 'client.maximum_chat_length') || 5000;
    this.inputElement.setAttribute('maxlength', maxlength);

    this.inputElement.focus();

    this.$close = $(this.textChatElement).find('#close');
    this.$close.click(function() {
        this.imvu.call('closeActiveTool');
    }.bind(this));
    this.$close.hide();
}

ChatTool.prototype = {
    toggleTextSize: function(event) {
        this.largeText = !this.largeText;
        $(this.textChatElement).toggleClass('largeText', !!this.largeText);
        
        if (this.elementToScrollTo != null)
        {
            this.elementToScrollTo.scrollIntoView(false);
        }  
    },

    autoGrowTextArea: function(event) {
        if (!event.shiftKey && event.keyCode == 13)
        {
            this.onSubmit();
            return;
        }
    
        var scrollH = this.inputElement.scrollHeight;
        if ( scrollH > this.inputElement.clientHeight ){
            this.inputElement.rows += 1; 
                     
        } 
        
        this.refreshSize();
        
        if (this.elementToScrollTo != null)
        {
            this.elementToScrollTo.scrollIntoView(false);
        }  
    },
    
    refreshSize: function() {
        if (this.expanded) {
            this.determineHistorySize();
        }
        else {
            this.setCollapsedSize();
        }
    },
    
    setCollapsedSize: function() {
        this.imvu.call('setWindowSize', this.FULL_WIDTH, this.formElement.offsetHeight + this.newWhisperIndicator.offsetHeight);
    },
    
    hideCTA: function() {
        $(this.ctaElement).hide();
    },
    
    inputElementGetsFocus: function() {
        this.hideCTA();
    },
    
    determineHistorySize: function() {
        this.historyElement.style.height = (this.FULL_HEIGHT - this.formElement.offsetHeight - this.header.offsetHeight - this.newWhisperIndicator.offsetHeight - 8) + "px";
    },
    
    invert: function() {
        var self = this;

        if ($(this.textChatElement).hasClass('inverted')) {
            $(this.textChatElement).removeClass('inverted');
            
            $('.who, .notice, .line:not(.whisper-new) .message', this.historyElement).each(function (index, el) {
                if (el.style.color == self._toCssColor([0, 0, 0])) {
                    el.style.color = self._toCssColor([255, 255, 255]);
                }
            });
        }
        else {
            $(this.textChatElement).addClass('inverted');
            
            $('.who, .notice, .line:not(.whisper-new) .message', this.historyElement).each(function (index, el) {
                if (el.style.color == self._toCssColor([255, 255, 255])) {
                    el.style.color = self._toCssColor([0, 0, 0]);
                }
            });
        }
    },

    _append: function(element) {
        var FUDGE_FACTOR = 5;
        var shouldScroll = (this.historyElement.scrollHeight <=
                            this.historyElement.scrollTop + this.historyElement.offsetHeight + FUDGE_FACTOR);

        this.historyElement.appendChild(element);

        if (shouldScroll) {
            this._newTextChatAutoScroll(element);
        }
    },

    _newTextChatAutoScroll: function(element){
        this.elementToScrollTo = element;
        if (this.expanded){
            element.scrollIntoView(false);
        }
    },

    _toCssColor: function(c, adjustForInverted) {
        if (adjustForInverted) {
            if ($(this.textChatElement).hasClass('inverted')) {
                if (c[0] == 255 && c[1] == 255 && c[2] == 255) {
                    c = [0, 0, 0];
                }
            }
            else {
                if (c[0] == 0 && c[1] == 0 && c[2] == 0) {
                    c = [255, 255, 255];
                }
            }
        }
        return 'rgb(' + c.join(', ') + ')';
    },

    updateAvatarInfo: function(info) {
        var msg = _T("has joined the chat");
        this._appendForUser(info, msg, "notice");
    },

    removeAvatar: function(info) {
        var msg;
        if (info.isClosing) {
            msg = _T("has left their private room. This chat will automatically close in 2 minutes unless you load one of your own rooms");
        } else {
            msg = _T("has left the chat");
        }
        this._appendForUser(info, msg, "notice");
    },

    __onNewParticipant: function(eventName, info) {
        IMVU.log('NEW PARTICIPANT: ' + JSON.stringify(info));
        this.chatParticipants[info.userId] = info;
        this.updateAvatarInfo(info);
    },

    __onReplaceRoom: function(eventName, info) {
        var msg = _T("has changed the room to: ");
        this._appendForUser(info, msg + info.roomName, 'notice');
    },
    
    __onParticipantLeft: function(eventName, info) {
        var who = info.who;

        delete this.chatParticipants[info.userId];

        if (who != '<unknown>') {
            this.removeAvatar(info);
        }
    },

    __onNewMessage: function(eventName, info) {
        this._appendForUser(info, info.message, "message");
    },

    _canWhisperToUser: function(userId) {
        if (this._participantInChat(userId) && userId != this.localUserId) {
            return (parseInt(this.chatParticipants[userId].hasVIPPass, 10) || this.imvu.call('hasVIPPass'));
        }

        return false;
    },

    _participantInChat: function(userId) {
        return this.chatParticipants.hasOwnProperty(userId);
    },
    
    _createNameNode: function(elementType, nameTagColor, who, info, messageClass) {
        name = document.createElement(elementType);
        name.className = 'who';
        name.style.color = this._toCssColor(nameTagColor, true);
        name.appendChild(document.createTextNode(who));
        $(name).mouseover(this.showAvatarButtons.bind(this, name, info, messageClass));
        return name;
    },

    _appendForUser: function(info, msg, messageClass, extraElements) {
        var who = info.who,
            nameTagColor = info.nameTagColor,
            name,
            whisperIcon,
            tooltip,
            hovertip,
            messageNode,
            whisperBack,
            lineElement;

        if(typeof(extraElements)==='undefined') extraElements = [];

        name = this._createNameNode('span', nameTagColor, who, info, messageClass);
        messageNode = document.createElement('span');
    
        messageNode.className = messageClass;
        $(messageNode).append(IMVU.Client.util.linkify(msg));
        IMVU.Client.util.turnLinksIntoLaunchUrls(messageNode, this.imvu);
    
        if (messageClass == "notice") {
            messageNode.style.color = this._toCssColor(nameTagColor, !info.to);
        }

        // We could insert the ": " with CSS, but then it would not appear in the clipboard
        // when the customer copies from the chat history. -- andy 9 July 2010

        lineElement = document.createElement('div')
        lineElement.className = 'line';
        lineElement.appendChild(name);

        if (messageClass == "message") {
            if (!info.to) {
                lineElement.appendChild(document.createTextNode(': '));
            } else if (info.to != this.localUserId) {
                var whisperNode = document.createElement('div');
                whisperNode.className = "whisperTo";
                whisperNode.appendChild(document.createTextNode("Whispering to "));
                var to = document.createElement('strong');
                to.style.color = (this._canWhisperToUser(info.to)) ? this._toCssColor(this.chatParticipants[info.to].nameTagColor) : '';
                to.innerHTML = info.toName + ':';
                whisperNode.appendChild(to);
                messageNode.insertBefore(whisperNode, messageNode.firstChild);
            } else if (info.to == this.localUserId) {
                var whisperBackNode = document.createElement('div');
                whisperBackNode.className = "whisperBack";
                whisperBackNode.style.backgroundColor = this._toCssColor(nameTagColor);
                whisperBackNode.appendChild(document.createTextNode("Whisper back"));
                messageNode.appendChild(whisperBackNode);
                $(whisperBackNode).click(this.enterWhisper.bind(this, info.userId, info.who));
            }
        } else {
            lineElement.appendChild(document.createTextNode(" "));
        }

        lineElement.appendChild(messageNode);

        if (info.to) {
            $(lineElement).addClass('whisper-new');                
            nameTagColor = (this._canWhisperToUser(info.to)) ? this.chatParticipants[info.to].nameTagColor : nameTagColor;
            messageNode.style.backgroundColor = this._toCssColor([
                parseInt(nameTagColor[0] * this.opacityFactor),
                parseInt(nameTagColor[1] * this.opacityFactor),
                parseInt(nameTagColor[2] * this.opacityFactor)
            ]);
        }

        for each(var extraElement in extraElements) {
            lineElement.appendChild(extraElement);
        }

        this._append(lineElement);
    },
    
    hideTool: function(event) {
        $(this.textChatElement).addClass('collapsed');
        this.expanded = false;
        this.refreshSize();
        
        this.imvu.call('setPref', 'newTextChatExpanded', false);
    },
    
    showTool: function(event) {
        $(this.textChatElement).removeClass('collapsed');
        this.imvu.call('setWindowSize', this.FULL_WIDTH, this.FULL_HEIGHT);
        this.expanded = true;
        this.refreshSize();
        if ( this.elementToScrollTo != null){
            this.elementToScrollTo.scrollIntoView(false);
        }
        
        this.imvu.call('setPref', 'newTextChatExpanded', true);
    },
    
    enoughParticipantsForWhispering: function() {
        var nonPilotParticipants = _.filter(this.chatParticipants, function(info, userId) { return userId != this.localUserId; }, this);
        return nonPilotParticipants.length > 1;
    },

    showAvatarButtons: function(el, info, messageClass) {
        var $infoIcon,
            whisperIcon,
            $flagIcon,
            tooltip,
            hovertip;
            canWhisper = this._participantInChat(info.userId) && this.enoughParticipantsForWhispering(),
            canAddFriend = this._participantInChat(info.userId) && !this.imvu.call("getBuddyType", info.userId);

        tooltip = document.createElement('span');
        tooltip.className = 'tooltip';

        if ((info.userId != this.localUserId) && (messageClass == 'message')) {
            $flagIcon = $('<a></a>');
            $flagIcon.addClass('flag-icon').text(' ');
            $flagIcon.appendTo(tooltip);
            $flagIcon.click(function(evt) {
                this.imvu.call('showChatLogFlaggingDialog', info.userId, info.index);
            }.bind(this));
        }

        $infoIcon = $('<a/>');
        $infoIcon.addClass('info-icon');
        $infoIcon.click(function() { 
            this.imvu.call('showAvatarCard', info.userId, {});
        }.bind(this));
        $(tooltip).append($infoIcon);

        if (canWhisper) {
            whisperIcon = document.createElement('a');
            whisperIcon.className = "whisper-icon";
            whisperIcon.innerHTML = _T("Whisper");
            
            $(whisperIcon).click(this.enterWhisper.bind(this, info.userId, info.who));
            tooltip.appendChild(whisperIcon);
        }
    
        if (canAddFriend) {
            addFriendIcon = document.createElement('a');
            addFriendIcon.className = "addfriend-icon";
            addFriendIcon.innerHTML = _T("Add Friend");
            
            $(addFriendIcon).click(this.addFriend.bind(this, info.userId, info.who, info.nameTagColor));
            tooltip.appendChild(addFriendIcon);
        }

        hovertip = document.createElement('span');
        hovertip.className = 'hovertip';
        hovertip.style.color = el.style.color;
        hovertip.appendChild(el.cloneNode(true));
        hovertip.appendChild(document.createTextNode(' '));
        hovertip.appendChild(tooltip);
        $(hovertip).mouseout(function (event) { this.hideAvatarButtons(event, el); }.bind(this));

        el.parentNode.insertBefore(hovertip, el.nextSibling);
    },

    hideAvatarButtons: function(event, el) {
        if (
            event.currentTarget.className == 'hovertip'
            && event.relatedTarget
            && !/^(tooltip|hovertip|info-icon|flag-icon|whisper-icon|addfriend-icon)$/.test(event.relatedTarget.className)
        ) {
            var hovertip = el.parentNode.querySelector('.hovertip');
            try {
                el.parentNode.removeChild(hovertip);
            } catch(e) {

            }
        }
    },

    enterWhisper: function(userId, who) {
        if (this._canWhisperToUser(userId)) {
            color = 'color: ' + this._toCssColor(this.chatParticipants[userId].nameTagColor);
            if (!$(this.textChatElement).hasClass('whispering')) {
                 $(this.textChatElement).addClass('whispering');
            }

            this.newWhisperIndicator.style.backgroundColor = this._toCssColor(this.chatParticipants[userId].nameTagColor);
            this.newWhisperIndicator.querySelector('.name').innerHTML = who;
            this.refreshSize();
            this.whisperTargetId = userId;
            this.whisperTargetName = who;
        } else {
            this.imvu.call('showVipUpsell');
        }
    },

    cancelWhisper: function() {
        var whisperIndicator = document.querySelector('.whisper-indicator');
        $(this.textChatElement).removeClass('whispering');
        this.refreshSize();

        this.whisperTargetId = 0;
    },
    
    addFriend: function(userId, who, color) {
        this.imvu.call("addBuddy", userId, 'client chat');
        this._appendForUser({ who: who, userId: userId, nameTagColor: color }, _T("has been sent a friend request."), "notice");
    },

    onSubmitForm: function(evt){
        evt.preventDefault();
        this.onSubmit();
    },

    onSubmit: function() {    
        var line = this.inputElement.value;

        // line is blank or whitespace-only
        if (/^\s*$/.test(line)) {
            return;
        }
        
        line = line.replace(/\n/g, "");
        this.inputElement.rows = 1;    
        this.refreshSize();

        this.inputElement.value = '';

        if (!this.whisperTargetId || (this.whisperTargetId && this._canWhisperToUser(this.whisperTargetId))) {
            // You can uncomment this if you want to fiddle around with the chat tool in FireFox. -- andy 17 May 2010
            //~ this.__onNewMessage(null, {who:'me', message:line, nameTagColor:[255,255,255]});
            this.imvu.call('notifyChatMessage', line, this.whisperTargetId);
        } else {
            this._appendForUser({ who: this.whisperTargetName, userId: this.whisperTargetId, nameTagColor: [255,0,0] }, _T("did not receive your whisper because they left the chat."), "notice");
        }
    },

    keyIsEnter: function(keyCode) {
        return (keyCode == 10) || (keyCode == 13);
    },

    keyIsModified: function(keyEvt) {
        return (keyEvt.ctrlKey || keyEvt.altKey || keyEvt.metaKey);
    },

    keyIsReadOnlyTextAccelerator: function(keyEvt) {
        //HACK: this is pretty gross
        passKeyCodes = { 65 : 'a',
                         67 : 'c',
                         17 : 'shift',
                         18 : 'ctrl' };
        return this.keyIsModified(keyEvt) && (keyEvt.keyCode in passKeyCodes);
    },

    onKeyPress: function(evt) {
        if (!this.keyIsReadOnlyTextAccelerator(evt) && evt.target.tagName != 'INPUT') {
            this.inputElement.focus();
        }

        if (!this.keyIsEnter(evt.keyCode) && !this.whisperTargetId) {
            if (this.inputElement.value.length == 0 && this.textBubbleActive) {
                this.textBubbleActive = false;
                var userId = this.imvu.call("getCustomerId");
                this.imvu.call("notifyChatMessage", "*msg EraseText 2 " + userId + " 0 0", 0);
            } else if (!this.textBubbleActive && this.inputElement.value.length != 0) {
                this.textBubbleActive = true;
                var userId = this.imvu.call("getCustomerId");
                this.imvu.call("notifyChatMessage", "*msg BeginText 2 " + userId + " 0 0", 0);
            }
        }
    },

    onHistoryContextMenu: function(evt) {
        YAHOO.util.Event.preventDefault(evt);
        YAHOO.util.Event.stopPropagation(evt);

        this.imvu.call('showHistoryContextMenu', evt.pageX, evt.pageY);
    },

    onInputContextMenu: function(evt) {
        YAHOO.util.Event.preventDefault(evt);
        YAHOO.util.Event.stopPropagation(evt);

        this.imvu.call('showInputContextMenu', evt.pageX, evt.pageY);
    },

    pasteText: function(text) {
        var startPos = this.inputElement.selectionStart;
        var endPos = this.inputElement.selectionEnd;
        var line = this.inputElement.value;
        
        this.inputElement.value = line.substring(0, startPos) + text + line.substring(endPos);
        this.inputElement.selectionStart = this.inputElement.selectionEnd = startPos + text.length;
    },
   
    hideMessageTray: function(){
        this.messageTrayEl.style.display = 'none';
        this.messageTrayOverlayEl.style.display = 'none';
        $(this.messageTrayEl).removeClass('flashing');

        if (this.messageQueue[0]){
            this.animateNextMessage();
        } else {
            this.animating = false;
        }
        this.updateWindowSize();
    },
    
    __initiateNewChat: function(evt, info) {
        this.historyElement.innerHTML = '';
        if (info.roomInstanceId) {
            var msg = _T("came from");
            var link = document.createElement('span');
            link.appendChild(document.createTextNode(info.roomName));
            $(link).addClass('room-link');
            $(link).click(function(){
                this.imvu.call('joinPublicRoom', info.roomInstanceId);
            }.bind(this));
            this._appendForUser(info, msg, 'notice', [link]);
        }
    }
};

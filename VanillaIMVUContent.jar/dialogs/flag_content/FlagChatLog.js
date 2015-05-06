function FlagChatLog(args) {
    var dialogInfo = args.dialogInfo;
    $('body').css('width', '' + dialogInfo.content.dialogSize[0] + 'px');
    $('body').css('height', '' + dialogInfo.content.dialogSize[1] + 'px');
    
    this.$root = $(args.root);
    this.imvu = args.imvu;
    this.$flag = this.$root.find('.submit-button');
    this.$display_last_container = this.$root.find('#display-last-container');
    this.$display_last_25 = this.$root.find('#display-last-25');
    this.$display_last_50 = this.$root.find('#display-last-50');
    this.$display_last_sep_100 = this.$root.find('#display-last-sep-100');
    this.$display_last_100 = this.$root.find('#display-last-100');
    
    this.flagContentObj = new FlagDialogContent(args);
    this.doSubmitBaseObj = this.flagContentObj.doSubmit.bind(this.flagContentObj);
    this.flagContentObj.doSubmit = this.doSubmit.bind(this);
    
    this.$chatLog = this.$root.find('#chat-log-container');
    this.accusedUserId = dialogInfo.content.id;
    this.chatLogArray = dialogInfo.content.chatLog;
    this.avatarNameColorMap = dialogInfo.content.avatarNameColorMap;
    this.flaggingMessageIndex = dialogInfo.content.message_index;
    
    this.display_last_current = 0;
    this.onClickDisplayLastLink({'target': this.$display_last_25[0]});
    this.bindDisplayOnlyLinks();
    
    FlagDialogContent.prototype.onSaveCallbackSuccess = function() {
        this.$display_last_container.css('opacity', 0);
        this.$chatLog.css('opacity', 0.2);
    }.bind(this);
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

FlagChatLog.prototype = {
    bindDisplayOnlyLinks: function() {
        if (this.chatLogArray.length < 25) {
            this.$display_last_container.addClass('not-used');
        } else if (this.chatLogArray.length < 50) { 
            this.$display_last_25.click(this.onClickDisplayLastLink.bind(this));
            this.$display_last_50.click(this.onClickDisplayLastLink.bind(this));
            this.$display_last_100.addClass('disabled');
            this.$display_last_sep_100.addClass('disabled');
        } else {
            this.$display_last_25.click(this.onClickDisplayLastLink.bind(this));
            this.$display_last_50.click(this.onClickDisplayLastLink.bind(this));
            this.$display_last_100.click(this.onClickDisplayLastLink.bind(this));
        }
    },
    
    onClickDisplayLastLink: function(evt) {
        var display_last_previous = this.display_last_current;
        if (evt.target == this.$display_last_25[0]) {
            this.display_last_current = 25;
        } else if (evt.target == this.$display_last_50[0]) {
            this.display_last_current = 50;
        } else if (evt.target == this.$display_last_100[0]) {
            this.display_last_current = 100;
        }
        if (display_last_previous != this.display_last_current) {
            this.$display_last_25.removeClass('selected');
            this.$display_last_50.removeClass('selected');
            this.$display_last_100.removeClass('selected');
            $(evt.target).addClass('selected');
            
            this.populateChatLog();
        }
    },
                
    populateChatLog: function() {
        this.$chatLog.empty();
        var num_lines = 0;
        for (var i = this.chatLogArray.length - 1; i >= 0; i--) {
            var chatNameTextArray = this.chatLogArray[i];
            var chatIndex = i + 1;
            var avatarName = chatNameTextArray[0];
            var message = chatNameTextArray[1];
            var backgroundColorCss = '';
            if (chatIndex == this.flaggingMessageIndex) {
                backgroundColorCss = 'background: #555;';
            }
            $chatLine = $('<div style="' + backgroundColorCss + '">').html(
                '<span style="color: ' + this.getColorCssStr(avatarName) + '">' + 
                avatarName + '</span>: ' + '<span>' + message + '</span>');
            $chatLine.addClass('chat-line')
            this.$chatLog.prepend($chatLine);
            if (++num_lines >= this.display_last_current) {
                break;
            }
        }
    },
    
    getColorCssStr: function(avatarName) {
        var color = this.avatarNameColorMap[avatarName];
        if (typeof color === 'undefined') {
            return '#ccc';
        }
        return 'rgb(' + color.join(', ') + ')';
    },
    
    doSubmit: function(post_data) {
        var charLogStr = '';
        for (var i = 0; i < this.chatLogArray.length; i++) {
            var chatNameTextArray = this.chatLogArray[i];
            var chatIndex = i + 1;
            var avatarName = chatNameTextArray[0];
            var message = chatNameTextArray[1];;
            charLogStr = charLogStr + chatIndex + ':' + avatarName + ': ' + message + '\r\n'; 
        }
        
        post_data = {};
        post_data['action'] = "process";
        post_data['accused_avatar_id'] = this.accusedUserId;
        post_data['abuse_description'] = charLogStr;
        post_data['abuse_metadata'] = 
            metaData = JSON.stringify({
                'metadata_version': 1,
                'flag_line': this.flaggingMessageIndex,
                'line_count': this.display_last_current
                });
        
        this.doSubmitBaseObj(post_data);
    },
}

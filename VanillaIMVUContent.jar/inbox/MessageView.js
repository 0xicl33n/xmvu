
function MessageView(id, config, currentDate) {
    this.id = id;
    this.imvu = config.imvu;
    this.net = config.net;
    this.onDeleteCallback = config.onDeleteCallback;
    this.messagesDataSource = config.messagesDataSource;
    this.currentDate = currentDate || new Date();

    var self = this;
    
    new ImvuButton('#msgDelete', {callback: self.deleteMessage, scope: this, grey: true});    
    new ImvuButton('#msgReply', {callback: self.replyMessage, scope: self, grey: false});
    
    YAHOO.util.Event.on('senderPic', 'click', this.showAvatarCard, this, true);
    YAHOO.util.Event.on('senderAvatarName', 'click', this.showAvatarCard, this, true);
    YAHOO.util.Event.on('msgSafety', 'click', this.reportMessage, this, true);
    YAHOO.util.Event.on('msgGiftProductPutOn', 'click', this.putOnGiftProduct, this, true);
    YAHOO.util.Event.on('msgGiftMusicArtistName', 'click', this.goToArtist, this, true);
    YAHOO.util.Event.on('msgGiftMusicTrackName', 'click', this.goToTrack, this, true);

    this.backDiv = document.querySelector('#backToTab');
    YAHOO.util.Event.addListener(this.backDiv, 'click', function() {
        this.deactivate();
    }, this, true);
    this.backDiv.style.visibility = 'hidden';

    this.refreshButton = document.querySelector('#refresh-button');

    $('iframe').load(this.onIframeLoad.bind(this));
}

MessageView.prototype = {
    showMessage : function(message) {
        this.message = message;
        this.messageId = message.getData('customers_quickmessages_id');
        YAHOO.util.Dom.setStyle('messageViewContents', 'display', 'block');
        YAHOO.util.Dom.get('senderAvatarName').innerHTML = message.getData('avatarname');
        YAHOO.util.Dom.get('senderOnline').className = message.getData('online') ? 'online' : '';
        YAHOO.util.Dom.setStyle('msgSenderAp',  'display', (message.getData('is_ap') && !this.imvu.call('isTeen')) ? 'block' : 'none');
        YAHOO.util.Dom.setStyle('msgSenderVip', 'display', message.getData('is_vip') ? 'block' : 'none');
        YAHOO.util.Dom.get('senderPic').src = message.getData('avpic_url');

        var imvuContentPath = "chrome://imvu/content/";
        this.msgIframeContents = '\
            <head>\
            <link rel="stylesheet" type="text/css" href="' + imvuContentPath + 'yui/reset-fonts-grids-base-min.css">\
            <link rel="stylesheet" type="text/css" href="' + imvuContentPath + 'css/style.css" />\
            <link rel="stylesheet" type="text/css" href="' + imvuContentPath + 'inbox/style.css">\
            <link rel="stylesheet" type="text/css" href="' + imvuContentPath + 'inbox/MessageView.css">\
            <style>\
            body { padding: 0 0; color: black; }\
            #messageView { padding: 0 0; }\
            #messageViewShadowInner { padding: 0 0; border: 0; }\
            #messageViewShadowInner .bd { padding: 1 1; border: 0; background: white; }\
            </style>\
            </head>\
            <body>\
                <div id="messageView">\
                    <div id="messageViewShadowInner">\
                        <div class="bd">\
                            <div id="msgText">' + 
                            (message.getData('message_text')).replace(/\n/g, "<br>") + 
                           '</div>\
                           <div style="clear:both;"/>\
                        </div></div></div>\
            </body>';
                   
        YAHOO.util.Dom.get('msgTxtIframe').src = "data:text/html," + this.msgIframeContents;

        var messageDate = IMVU.Time.localDateFromServerTime(message.getData('date'));
        
        var html = IMVU.Time.howLongAgo(messageDate / 1000, this.currentDate / 1000);
        if (!message.getData('is_public')) {
            html += ' <span class="privacy">[ '+_T("Private")+' ]</span>';
        }
        
        var elTimestamp = YAHOO.util.Dom.get('msgTimestamp');
        elTimestamp.innerHTML = html;
        var formattedDate = IMVU.Time.formatDateObj(this.currentDate, messageDate);
        var tooltip = new YAHOO.widget.Tooltip('date-time', {zIndex: 9000, context: elTimestamp, text: formattedDate, showDelay:250, xyoffset:[0, 0]});

        var showGift = message.getData('has_gift') || message.getData('has_music');
        if (showGift) {
            $('#msgGiftSenderAvatarName').text(message.getData('avatarname'));
            if (!message.getData('message_text') || message.getData('message_text') == '') {
                $('#msgGiftAlso').hide();
            } else {
                $('#msgGiftAlso').show();
            }
            $('#msgGiftContainer').addClass('hasGift');
            YAHOO.util.Dom.get('msgGiftWrap').style.backgroundImage = "url('"+message.getData('gift_wrap_url')+"')";
            YAHOO.util.Dom.get('msgGiftImage').src = message.getData('gift_image_url');
            YAHOO.util.Dom.get('msgGiftProductPutOn').style.display = message.getData('gift_product_is_sticker') ? 'none' : '';
        } else {
            $('#msgGiftContainer').removeClass('hasGift');
        }
        function getFirstAttributeFromObject(object) {
            for (var key in object) {
                return key;
            }
        }
        var gift_name = '';
        if (message.getData('has_gift')) {
            var gift_product = message.getData('gift_product');
            this.gift_product_id = getFirstAttributeFromObject(gift_product);
            gift_name = gift_product[this.gift_product_id];
            $('#msgGiftContainer').addClass('productGift');
            $('#msgGiftContainer').removeClass('musicGift');
            $('#msgGiftImage').click(this.putOnGiftProduct.bind(this));
            YAHOO.util.Dom.get('msgGiftProductName').innerHTML = gift_name;
        } else if (message.getData('has_music')) {
            var gift_album = message.getData('gift_album');
            this.gift_album_id = getFirstAttributeFromObject(gift_album);
            var gift_album_name = gift_album[this.gift_album_id];

            var gift_artist = message.getData('gift_artist');
            this.gift_artist_id = getFirstAttributeFromObject(gift_artist);
            var gift_artist_name = gift_artist[this.gift_artist_id];

            var gift_track = message.getData('gift_track');
            this.gift_track_id = getFirstAttributeFromObject(gift_track);
            gift_track_name = gift_track[this.gift_track_id];

            $('#msgGiftImage').click(this.goToTrack.bind(this));
            $('#msgGiftContainer').addClass('musicGift');
            $('#msgGiftContainer').removeClass('productGift');
            YAHOO.util.Dom.get('msgGiftMusicTrackName').innerHTML = gift_track_name;
            YAHOO.util.Dom.get('msgGiftMusicArtistName').innerHTML = gift_artist_name;
        }

        var msgSafetyEl = document.querySelector('#msgSafety');
        var replyButtonEl = document.querySelector('#msgReply');
        if (message.getData('is_persona')) {
            msgSafetyEl.style.display = 'none';
            replyButtonEl.style.display = 'none';
        } else {
            msgSafetyEl.style.display = 'block';
            replyButtonEl.style.display = 'block';
        }

        IMVU.Client.EventBus.fire('InboxMode.ReloadAd',{});
    },
    
    onIframeLoad : function() {
        this.onIframeLoadEl($('#msgTxtIframe').contents().find('#msgText'));
    },
    
    onIframeLoadEl : function(el) {
        IMVU.Client.util.turnLinksIntoLaunchUrls(el, this.imvu);
        this.turnViximoLinksIntoDeepLinks(el);
        $('#msgTxtIframe').width( $('#msgTxtIframe').contents().find('#messageView').width());
        $('#msgTxtIframe').height($('#msgTxtIframe').contents().find('#messageView').height());
    },    

    replyMessage : function() {
        this.imvu.call('showMessageDialog', {recipient_name: this.message.getData('avatarname')});
    },
    
    callback : function(result, error) {
        if (error) {
            this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a problem deleting the message"));
        } else {
             if(this.messagesDataSource) {
                  this.messagesDataSource.refresh();
             }                 
             this.onDeleteCallback();
        }
    },

    deleteMessage : function() {
        var args = {action:'delete', message_ids: this.messageId};
        serviceRequest({
            method: 'POST',
            uri: '/api/messages.php',
            data: args,
            callback: this.callback.bind(this),
            json: true,
            network: this.net,
            imvu: this.imvu,
        });
    },
    
    showAvatarCard : function() {        
        var cid = this.message.getData('sender_id');
        var senderName = this.message.getData('avatarname');     
        this.imvu.call('showAvatarCard', cid, {avname: senderName});
    },
    
    reportMessage : function() {
        this.imvu.call(
            'showAvatarSafetyDialog',
            this.message.getData('sender_id'),
            this.message.getData('avatarname'),
            {
                url:IMVU.SERVICE_DOMAIN+'/api/messages.php', 
                description:_T("message"), 
                details:{action:'report',message_id:this.message.getData('customers_quickmessages_id')}
            }
        );
    },

    activate: function () {
        $('#'+this.id).addClass('visible');
        this.backDiv.style.visibility = 'visible';
        this.refreshButton.style.display = 'none';
    },

    deactivate: function () {
        $('#'+this.id).removeClass('visible');
        this.backDiv.style.visibility = 'hidden';
        this.refreshButton.style.display = 'block';
    },
    
    putOnGiftProduct : function() {
        this.imvu.call('triggerImvuUrl', 'imvu:PutOn?productId=' + this.gift_product_id);
    },

    goToArtist : function() {
        this.imvu.call('launchNamedUrl', 'music_artist', {'id':this.gift_artist_id});
    },
    
    goToTrack : function() {
        this.imvu.call('launchNamedUrl', 'music_album', {'id':this.gift_album_id});
    },
    
    turnViximoLinksIntoDeepLinks : function(el) {
        $('a', el).each(function(index, aElem) {
            var href = aElem.getAttribute('href');
            var matches;
            if (href && (matches = href.match(new RegExp('http://www.imvu.com/games/play/viximo/([^/]+)')))) {
                // Ugh. Maybe look these up in GamesLobbyMode's launchGame instead?
                var games = {
                    'backyardmonsters': 'Backyard Monsters',
                    'farmandia': 'Farmandia',
                    'mallworld': 'Mall World',
                    'fishdom': 'Fishdom',
                    'top_modelz': 'Top Modelz',
                    'ravenwood': 'Ravenwood Fair',
                };
                aElem.setAttribute('href', 'imvu:showMode?mode=games&gameId=' + matches[1] + '&gameName=' + games[matches[1]] + '&provider=viximo');
            }
        });     
    }
};

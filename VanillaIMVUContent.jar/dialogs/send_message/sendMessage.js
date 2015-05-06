function html_escape(s) {
    return s;
}

SendMessage = function(args) {
    if (! args) {
        args = {};
        args.extra_args = {};
    }
    this.args = args;
    this.imvu = args.imvu;
    this.network = args.network;
    this.timer = args.timer;
    this.price = 0;
    this.giftwrap_price = 0;
    
    this.cid = args.extra_args.cid || 0;
    this.viewer_cid = args.viewer_cid;
    this.recipient_name = '';
    if(args.extra_args.recipient_name) {
        var name = args.extra_args.recipient_name;
        if (name.toLowerCase().indexOf("guest_") === 0) {
            name = name.substr(6);
        }
        this.recipient_name = name;
    } 
    IMVU.log("recipient_name in SendMessage: " + this.recipient_name);
    if(args.extra_args.startWithGift) {
        this.startWithGift = true;
    }

    this.showMusic = this.imvu.call('shouldShowMusic');
    if (!this.showMusic) {
        $('#tab_music_wishlist').remove();
        $('#music_wishlist').remove();
    }

    this.music_track_price = 649;
    this.max_message_length = 1024;
    this.sauce = '';
    this.cachedProductInfo = {};
    this.cachedAlbumInfo = {};
    this.cachedTrackInfo = {};

    this.addGiftButton  = new ImvuButton('#addgift-button', {callback:this.addGift, scope:this, enabled:false, gift:true});
    this.sendButton  = new ImvuButton('#send-button', {callback:this.sendMessage, scope:this, enabled:false});
    this.cancelButton  = new CancelButton('#cancel-button', {callback:this.close, scope:this});
    
    this.pillbox = new IMVU.Client.widget.PillBox("#avname_field_wrapper", {max_items: 1});
    this.$messageBox = $('#message_text');

    this.updateCharCount();

    try {
        this.getSendMessageInfo();
    } catch(e) {
        if(e.name != 'NS_ERROR_DOM_BAD_URI') {
            throw e;
        }
    }
    
    if (args.extra_args.title) {
        YAHOO.util.Dom.get('title').innerHTML = args.extra_args.title;
    }
    
    var self = this;
    
    $('#close-button').click(this.close.bind(this));
    onEscKeypress(function() {
        this.imvu.call('cancelDialog');
    }.bind(this));

    this.$messageBox.bind('keyup keypress input', this.updateCharCount.bind(this));

    if (args.extra_args.gift) {
        var gift = args.extra_args.gift;
        this.prefillGift(gift);
    }

    this.giftSelectorCancelButton = new CancelButton('#gift_selector_cancel', {callback:this.hideGiftSelector, scope:this});
    
    this.giftSelector = YAHOO.util.Dom.get("select_gift");
    
    this.gift_tabs = document.querySelectorAll('div.tab');
    this.gift_tab_content = document.querySelectorAll('ul.product-list');
    
    $(this.gift_tabs).click(function () {self.clickTab(this);});
    $('#choose_product').click(function () {self.refreshGiftInfo();});
    
    self.validatedNames = {};
    var onItemResponse = function (name, valid, is_buddy) {
        if (valid) {
            self.validatedNames[name] = valid;
            if (self.pillbox.itemsByName[name]) {
                self.pillbox.itemsByName[name].setType((is_buddy ? "buddy" : "nonbuddy"));
            }
        }
    };

    self.autoComplete = IMVU.buddyAutocomplete(
        this.network,
        this.imvu,
        this.timer,
        args.animSpeed,
        this.pillbox.$input[0],
        "avname_container",
        function (data) {
            self.pillbox.addItem(data.name, data.cid, "buddy");
            self.pillbox.$input.val('');
        },
        onItemResponse);
    
    this.pillbox.subscribe('addItem', function (event, item) {
        var name = item.text.toLowerCase();
        var self = this;
        
        var callback = {
            success : function(data) {
                var type = 'notfound';
                if (data.is_buddy) {
                    type = 'buddy';
                } else if (data.valid) {
                    type = 'nonbuddy';
                }
                item.setType(type);
                self.autoComplete.collapseContainer();
                
                if (self.pillbox.getValidItems().length > 0) {
                    self.addGiftButton.enable();
                    self.sendButton.enable();
                    YAHOO.util.Dom.setStyle("choose_product", "display", "inline");
                }
            },
            failure : function(o) {
                self.autoComplete.collapseContainer();
            }
        };
        
        this._serviceRequest({
            method: 'GET',
            uri: '/api/avatar_autocomplete.php?avatarname=' + escape(name),
            callback: callback
        });
        
        this.autoComplete.collapseContainer();
    }.bind(this));
    
    this.pillbox.subscribe('removeItem', function () {
        if (this.pillbox.getValidItems().length === 0) {
            IMVU.log("gift list is empty, and disabling addGiftButton");
            this.addGiftButton.disable();
            this.sendButton.disable();
            YAHOO.util.Dom.setStyle("choose_product", "display", "none");
        }
    }.bind(this));
    
        
    if (this.recipient_name && this.recipient_name !== '') {
        this.pillbox.addItem(this.recipient_name, this.recipient_name, 'checking');
        this.addGiftButton.enable();
        this.sendButton.enable();
    }
    
    $('#r_later').click(function () {
        YAHOO.util.Dom.get("s_date_available").disabled = false;
    });
    
    $('#r_immediately').click(function () {
        YAHOO.util.Dom.get("s_date_available").disabled = true;
        YAHOO.util.Dom.get("s_date_available").selectedIndex = 0;
    });
    
    $('#message_text').focus();
    
    if (this.args.select_gift_by_search == 1) {
        $("#select_gift").addClass("g-search");
        $("#title").html("Select Gift");
        this.buildCategoriesList();
    }};

SendMessage.prototype = {
    
    getRecipientAvatarNames : function() {
        var validItems = this.pillbox.getValidItems();
        var validNames = validItems.map(function(item) {return item.text;});
        return validNames;
    },
    
    clickTab : function (el) {
        $(this.gift_tabs).removeClass("selected");
        $(this.gift_tab_content).removeClass("selected");
        
        var content = YAHOO.util.Dom.get(el.getAttribute("content"));
        $([el, content]).addClass("selected");
        
        if (el.getAttribute("content") === "wishlist") {
            this.showSearch();
        } else {
            this.hideSearch();
        }

    },
    
    close : function() {
        this.imvu.call('endDialog', {});
    },
    
    prefillGift : function(gift) {
        var massagedGift = {
            "id" : gift.id,
            "pid" : gift.id,
            "image_url" : gift.image,
            "name" : gift.name,
            "price" : gift.price,
            "type" : "product"
        };
        
        YAHOO.util.Dom.setStyle("choose_product", "display", "none");
        this.prechosenGift = massagedGift;
        this.cacheProduct(this.prechosenGift);
        this.startWithGift = true;
        this.clickGiftButton(this.prechosenGift);
    },
    
    clearGiftItems : function() {
        this.hideTabs();
        $('li.wishlist-item').each(function (index, el) {
            el.parentNode.removeChild(el); 
        });
        var jWishlistUL = $("#wishlist");
        jWishlistUL.find("li.category-bar").remove();

    },
    
    setMaxMessageLength : function(length) {
        this.max_message_length = length;
        $('#max_charcount').text(IMVU.Client.util.number_format(length));
    },

    updateCharCount : function () {
        if (this.$messageBox.val().length > this.max_message_length){
            this.$messageBox.val(this.$messageBox.val().substr(0, this.max_message_length));
            this.$messageBox.scrollTop(this.$messageBox[0].scrollHeight);
            $('#charcount').css('color', '#ff6b5d');
        } else {
            $('#charcount').css('color', '');
        }
        $('#charcount').text(this.$messageBox.val().length);
    },

    _serviceRequest: function(spec) {
        var callbacks = spec.callback;
        function cb(result, error) {
            if (error){
                callbacks.failure(error);
            } else if (result.error) {
                callbacks.failure(result);
            } else {
                callbacks.success(result);
            }
        }
        spec.callback = cb;
        spec.network = this.network;
        spec.imvu = this.imvu;
        spec.json = true;
        serviceRequest(spec);
    },

    sendMessage : function() {
        var args = {};
        args.sender_id = this.viewer_cid;
        
        var recipients = this.getRecipientAvatarNames();
    
        args.recipient_avatarname = (recipients[0] ? recipients[0] : "");
        args.message_text = YAHOO.util.Dom.get('message_text').value;
        args.is_public = '0';
        args.gift_track_id = YAHOO.util.Dom.get('gift_track_id').value;
        args.gift_product_id = YAHOO.util.Dom.get('gift_product_id').value;
        args.gift_wrap_id = YAHOO.util.Dom.get('gift_wrap_id').value;
        if (YAHOO.util.Dom.get('r_later').checked) {
            if (this.date_available.value === '0') {
                this.imvu.call('showConfirmationDialog', _T("Select a date"), _T("You must select a delivery date to send a delayed gift."));
                return;
            }
            args.date_available = this.date_available.value;
        }
        
        args.sauce = this.sauce;
        var url = IMVU.SERVICE_DOMAIN + '/api/send_message.php';
        var self = this;
        var cb = {
            success: function(result) {
                self.hideThrobber();
                var text = '';
                if (result.extra_messages){
                    for(var i=0; i<result.extra_messages.length; i++) {
                        if(text) {
                            text += "<br>";
                        }
                        text += result.extra_messages[i];
                    }
                }
                if (args.gift_product_id) {
                    IMVU.Client.EventBus.fire('giveGift', {'cid':String(self.cid), 'pid':args.gift_product_id});
                }
                self.imvu.call('showConfirmationDialog', _T("Sent Message"), text);
                self.imvu.call('endDialog', {});
            },
            failure: function(result) {
                if (!result) {
                    self.hideThrobber();
                    YAHOO.util.Dom.get('gift_product_id').value = 0;
                    YAHOO.util.Dom.get('gift_track_id').value = 0;
                    self.imvu.call('showConfirmationDialog', _T("Error"), _T("There was an error with your gift selection.") + '<br/><br/>' + _T("Please try again or select a different gift."));
                } else {
                    if (result.status == 4) {
                        self.imvu.call('showConfirmationDialog', _T("Avatar not found"), _T("Sorry, we could not find an avatar named") + " '" + args.recipient_avatarname + "'");
                    } else {
                        self.imvu.call('showConfirmationDialog', _T("Error"), result.error);
                    }
                }
            }
        };
        this._serviceRequest({
            method: 'POST',
            uri: '/api/send_message.php',
            callback: cb,
            data: args
        });
        this.showThrobber();
    },

    getSendMessageInfo : function() {
        var self = this;
        var cb = {
            success: function(info) {
                if (info !== null){
                    self.handleSendMessageInfo(info);
                }
            },
            failure: function(o) {
            }
        };
        this._serviceRequest({
            method: 'POST',
            uri: '/api/send_message_info.php',
            callback: cb,
            data: {cid: this.viewer_cid, recipient_id: this.cid}
        });
    },

    rebuildGiftWrapDropdown : function() {
        this.giftwrap_items = [];
        
        var s = YAHOO.util.Dom.get('gift_wrap_id');
        while (s.length > 0) {
            s.remove(0);
        }

        var giftwrap_selector = YAHOO.util.Dom.get("giftwrap_selector_scroll_area");

        var self = this;
        $.each(this.gift_wrap_choices, function (index, gw) {
            if (!self.default_gift_wrap_id) {
                self.default_gift_wrap_id = gw.id;
            }

            var giftwrap_item = document.createElement("div");
            self.giftwrap_items.push(giftwrap_item);

            giftwrap_item.className = "giftwrap-item";
            giftwrap_item.setAttribute("price", gw.credits_price);
            giftwrap_item.setAttribute("gift_text", gw.text);
            giftwrap_item.setAttribute("gift_id", gw.id);

            var path = gw.image;
            path = path.replace(" ", "%20");
            var nv = 'http://userimages.imvu.com' + path;

            var img = document.createElement("img");
            img.src = nv;
            giftwrap_item.appendChild(img);

            $(giftwrap_item).click(function () {self.selectGiftWrap(giftwrap_item);});
            giftwrap_selector.appendChild(giftwrap_item);
        });

        var topLeftItem = 0;
        var animating = false;

        $('#arrow_up').click(function () {
            if (topLeftItem > 0 && ! animating) {
                $('#giftwrap_selector_scroll_area').animate({top: '+=93'}, 'fast', function () {
                    topLeftItem -= 9;
                    animating = false;
                });
                animating = true;
            }
        });
        
        $('#arrow_down').click(function () {
            if (topLeftItem < (self.giftwrap_items.length - 9 ) && ! animating) {
                $('#giftwrap_selector_scroll_area').animate({top: '-=93'}, 'fast', function () {
                    topLeftItem += 9;
                    animating = false;
                });
                animating = true;
            }
        });
        
        this.selectGiftWrap(this.giftwrap_items[0]);
        
    },
    
    selectGiftWrap : function(item) {
        $(this.giftwrap_items).removeClass("selected");
        $(item).addClass("selected");
        var value = item.getAttribute("gift_id");
        var text = item.getAttribute("gift_text");
        var price = parseInt(item.getAttribute("price"), 10);
        this.giftwrap_price = price;
        this.updatePrice();
        YAHOO.util.Dom.get("giftwrap_label").innerHTML = text;
        var img = item.querySelector('img');
        YAHOO.util.Dom.setStyle('giftwrap', 'background-image', 'url(' + img.src + ')');
        var formValue = YAHOO.util.Dom.get("gift_wrap_id");
        formValue.value = value;
    },
    
    handleSendMessageInfo : function(info) {
        
        this.music_track_price = info.music_track_price;
        this.setMaxMessageLength(info.max_message_length);
        this.recipient_name = info.recipient_name || this.recipient_name;
        if (this.pillbox.items.length === 0 && this.recipient_name) {
            this.pillbox.addItem(this.recipient_name, null, "checking");
        }
        this.sauce = info.sauce;

        var sortedGiftWrap = [];
        for each (var item in info.gift_wrap_choices) {
            sortedGiftWrap.push(item);
        }

        sortedGiftWrap.sort(function(item1,item2) {
            return item1['order'] - item2['order'];
        });

        this.gift_wrap_choices = sortedGiftWrap;
        this.default_gift_wrap_id = info.gift_wrap_id;
        
        this.holidays = info.holidays;
        this.rebuildHolidayDropdown();
        this.rebuildGiftWrapDropdown();

        if(this.startWithGift) {
            this.addGift();
        } else {
            this.hideThrobber();
        }
    },
    
    adjustHeight : function(height) {
        var width = document.body.offsetWidth;
        this.imvu.call("resize", width, height);    
    },
    
    showGiftSelector : function() {
        var avatarName = this.recipient_name;
        $('.avatarname').each(function (index, el) {
            el.innerHTML = avatarName;
        });
        YAHOO.util.Dom.setStyle("buttons", "visibility", "hidden");
        YAHOO.util.Dom.setStyle(this.giftSelector, "display", "block");
    },
    
    hideGiftSelector : function() {
        if (! this.selectedGift) {
            this.adjustHeight(300);
        }
        YAHOO.util.Dom.setStyle(this.giftSelector, "display", "none");
        YAHOO.util.Dom.setStyle("buttons", "visibility", "visible");
    },
    
    addGift : function() {
        this.adjustHeight(515);
        
        if (! this.prechosenGift) {
            this.refreshGiftInfo();
            
        } else {
            this.hideThrobber();
            this.showGift();
        }
    },
    
    refreshGiftInfo : function() {
        var args;
        
        var firstRecipient = this.pillbox.getValidItems()[0];
        if (firstRecipient) {
            args = {recipient_avatarname: firstRecipient.text, source: 'client'};
            this.recipient_name = firstRecipient.text;
        }
        var self = this;
        var cb = {
            success: function(result) {
                self.handleMessageGiftsInfo(result);
            },
            failure: function(result) {
                self.hideThrobber();
                self.hideGiftSelector();
                YAHOO.util.Dom.setStyle('addgift-button', 'display', 'block');
                if (firstRecipient) {
                    self.imvu.call('showConfirmationDialog', _T("Error"), _T("There was an error getting gift information for")+ ' '+firstRecipient.text + '.<br/><br/>' + _T("Please check the avatar name and try again."));
                }
            }
        };
        
        this.showThrobber();
        this.clearGiftItems();
        this.showGiftSelector();
        this._serviceRequest({
            method: 'POST',
            uri: '/api/message_gifts.php',
            callback: cb,
            data: args
        });
    },
    
    showThrobber : function() {
        YAHOO.util.Dom.setStyle(document.querySelector('.throbber'), "display", "block");
        YAHOO.util.Dom.setStyle('throbber', 'display', '');
        YAHOO.util.Dom.setStyle('bottom-stuff', 'display', 'none');
    },

    hideThrobber : function() {
        YAHOO.util.Dom.setStyle(document.querySelector('.throbber'), "display", "none");
        YAHOO.util.Dom.setStyle('throbber', 'display', 'none');
        YAHOO.util.Dom.setStyle('bottom-stuff', 'display', '');
        
        if(document.getElementById("addgift-button").clientWidth > 180 && $('#addgift-button').is(":visible")) {
            document.getElementById("send-button").className = "line-two";
            document.getElementById("cancel-button").className = "line-two";
        }
    },

    cacheProduct : function (x) {
        if (!x) {return;}
        if (!x.pid) {return;}
        try {
            var id = parseInt(x.pid, 10);
        } catch (e) {
            return;
        }
        this.cachedProductInfo[id] = x;
    },

    cacheTrack : function (x) {
        if (!x) {return;}
        if (!x.TrackId) {return;}
        try {
            var id = parseInt(x.TrackId, 10);
        } catch (e) {
            return;
        }
        this.cachedTrackInfo[id] = x;
    },

    rebuildProductDropdown : function(giftListInfo) {
        var i, x;
        if (giftListInfo.product.recipient_wishlist) {
            var wishlistUL = YAHOO.util.Dom.get("wishlist");
            var templateLI = wishlistUL.querySelector('li.template');
            
            if (giftListInfo.product.recipient_wishlist.length > 0) {
                YAHOO.util.Dom.setStyle("tab_wishlist", "display", "block");
            }
            
            var newItem;
            for (i = 0; i < giftListInfo.product.recipient_wishlist.length; i++) {
                x = giftListInfo.product.recipient_wishlist[i];
                x.type = "product";
                x.id = x.pid;
                this.cacheProduct(x);
                
                this.addGiftItem(wishlistUL, templateLI, x);
            }
        }
        
        var giftlistUL = YAHOO.util.Dom.get("giftlist");
        var giftlistLI = giftlistUL.querySelector('li.template');
        
        if (giftListInfo.product.sender_giftlist.length > 0) {
            YAHOO.util.Dom.setStyle("tab_giftlist", "display", "block");
        }
        
        for (i = 0; i < giftListInfo.product.sender_giftlist.length; i++) {
            x = giftListInfo.product.sender_giftlist[i];
            x.type = "product";
            x.id = x.pid;
            this.cacheProduct(x);
            
            this.addGiftItem(giftlistUL, giftlistLI, x);
        }
    },
    
    /********* select by category **********/
    utils: {
        escape_regex: function(str) {
                return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
        },
    
        searchword: function(str, keywords){
            var myReg,regex_safe_value, arrStr = str.split(/\s*,\s*|\s+/)
            for (var i=0,len=arrStr.length; i<len; i++) {
                if (arrStr[i] == "") {
                    continue;
                }
                regex_safe_value = this.escape_regex(arrStr[i]);
                myReg = new RegExp("\\b" + regex_safe_value, "i");
                if (!keywords.match(myReg)) {
                    return false;
                }
            }
            return true;
        }
        
    }, 
    buildCategoriesList: function(){
        var categoriesList ={
            '106_40': {name: "Women", keywords:"clothing,female,women,woman,girls", keywordsPlus: ",woman,girls"},
            '106_41': {name: "Men", keywords:"clothing,male,men,man,boy", keywordsPlus: ",man,boy"},
            '107_1027': {name: "Furniture", keywords:"furniture", keywordsPlus:""},
            '107_366': {name: "Rooms", keywords: "rooms", keywordsPlus:""},
            'others': {name: "Others",keywords:"actions,pets,outfits,avatars,poses", keywordsPlus:",poses"}
        };
        var categoriesContainer = $(".categories-container"),category;
        for (cat in categoriesList) {
            category = categoriesList[cat];
            category.keywords = category.keywords + category.keywordsPlus;
            $('<a rel="' + cat + '">' + category.name + '</a>').appendTo(categoriesContainer);
        }

        this.categoriesList = categoriesList;
        var that = this;
        
        $("a", categoriesContainer).bind('click', function(e){
            var key = $(this).attr('rel'),
                itemsContainer = $("#wishlist");
            that.categorySelected = key;
            $(this).parent().find("a.selected").removeClass('selected');
            $(this).addClass('selected');
            if (key === "all") {
                $('li', itemsContainer).removeClass('hidden');
            } else {
                $('li', itemsContainer).addClass('hidden');
                $('li.cat-' + key, itemsContainer).removeClass('hidden');
                $('#cat-' + key, itemsContainer).addClass('hidden');
            }
            
            var jSearch = $(".search-line input.search");
            if (jSearch.val().length > 0) {
                            $(".search-line input.search").trigger("doSearch");
            } else {
                $("#wishlist").removeClass("searching");
            }
            
        });
        IMVU.Client.util.hint([$(".search-line input.search")]);
        
        $(".search-line input.search").bind('doSearch', function(){
           var val = $(this).val(), 
           jWishList = $("#wishlist");
           if (val === $(this).attr('hint')) {
               return;
           }
           
           if (val.length > 0) {
               jWishList.addClass("searching");
           } else {
               jWishList.removeClass("searching");
           }
           
           var list;
           if (!that.categorySelected  || that.categorySelected === "all") {
               that.categorySelected = 'all';
               list = that.infoData.product.recipient_wishlist;
           } else {
               list = that.categoriesList[that.categorySelected].items ;
           }
           if(!list) {
               list = "";
           }
           //doing search
           jWishList.find("li").removeClass("found");
            var item, keywords;
           
           for (var i=0,len=list.length; i<len;i++) {
               item = list[i];
               keywords = item.keywords;
               if (that.utils.searchword(val, keywords)){
                   var id= item.id;
                   $("#wishlist-" + id).addClass("found");
               }
           }
           if (that.categorySelected === "all") {
               var cat, index, items, c;
                for (catKey in that.categoriesList){
                    cat = that.categoriesList[catKey];
                    items = cat.items;
                    if (items && items.length > 0 ) {
                        for (index = 0; index < items.length; index++ ) {
                            if (that.utils.searchword(val, cat.keywords)){
                                jWishList.find("li.cat-" + catKey).addClass("found");
                            }
                        }
                    }
                }
           } 
           
        }).bind('keyup', function(){
            $(this).trigger("doSearch");
        });
       
    },
    createCategoryIdFromListItem: function(item){
        var cLen,
            arrCategoryId = [];
            cats = item.categories;
        
        cLen = Math.min(2, cats.length);
        
        for (var c= 0; c < cLen; c++) {
            arrCategoryId.push(cats[c].id);
        }
        var keywords = [item.name];
        for (var c=0,clen = cats.length; c<clen; c++) {
            keywords.push(cats[c].name);
        }
        
        return {
            id: arrCategoryId.join("_"),
            keywords: keywords.join(",")
        }
        
    }, 
    rebuildProductDropdownWithCategories : function(giftListInfo) {
        var i, x, len,categoryId, categoryInfo, category, items;
            
        if (giftListInfo.product.recipient_wishlist) {
            for (i = 0; i < giftListInfo.product.recipient_wishlist.length; i++) {
                x = giftListInfo.product.recipient_wishlist[i];
                categoryInfo  = this.createCategoryIdFromListItem(x);
                categoryId = categoryInfo.id;
                if (!this.categoriesList[categoryId]) {
                    categoryId = "others";
                }
                
                category = this.categoriesList[categoryId];
                
                if (!category.items ) {
                    category.items = [];
                }
                
                x.keywords = categoryInfo.keywords + category.keywordsPlus; 
                category.items.push(x);
            }
            
            var wishlistUL = YAHOO.util.Dom.get("wishlist");
            var templateLI = wishlistUL.querySelector('li.template'),
            jWishlistUL = $("#wishlist"),
            templateCategoryBar = jWishlistUL.find('li.category-template');
            if (giftListInfo.product.recipient_wishlist.length > 0) {
                YAHOO.util.Dom.setStyle("tab_wishlist", "display", "block");
            }
            for (cat in this.categoriesList) {
                category = this.categoriesList[cat];
                items = category.items;
                if (items) {
                    this.addGiftCategoryBar(jWishlistUL, templateCategoryBar, {name:category.name, id: cat});
                    for (i = 0, len = items.length ; i < len; i++) {
                        x = items[i];
                        x.type = "product";
                        x.id = x.pid;
                        this.cacheProduct(x);

                        this.addGiftItemWithCategory(wishlistUL, templateLI, x, {categoryId:cat});
                    }
                }
            }
        }
        
        var giftlistUL = YAHOO.util.Dom.get("giftlist");
        var giftlistLI = giftlistUL.querySelector('li.template');
        
        if (giftListInfo.product.sender_giftlist.length > 0) {
            YAHOO.util.Dom.setStyle("tab_giftlist", "display", "block");
        }
        for (i = 0; i < giftListInfo.product.sender_giftlist.length; i++) {
            x = giftListInfo.product.sender_giftlist[i];
            x.type = "product";
            x.id = x.pid;
            this.cacheProduct(x);
            
            this.addGiftItem(giftlistUL, giftlistLI, x);
        }
    },
    addGiftCategoryBar: function(parentNode, templateNode,options) {
        var newItem = templateNode.clone(),
        catId = "cat-" + options.id;
        newItem.attr('id',catId).removeClass("category-template").addClass("category-bar " + catId);
        newItem.css("display", "block");
        var imgNode = newItem.find('p.category-name');
        imgNode.html(options.name);
        newItem.appendTo(parentNode);
    },
    addGiftItemWithCategory : function(parentNode, templateNode, item, options) {
        var newItem = templateNode.cloneNode(true),
        catId = "cat-" + options.categoryId;
        $(newItem).removeClass("template");
        $(newItem).addClass("wishlist-item " + catId).attr("id", "wishlist-" + item.id);
        
        newItem.setAttribute("type", item.type);
        newItem.setAttribute("item_id", item.id);
        
        newItem.style.display = "block";
        var imgNode = newItem.querySelector('img.product-image');
        imgNode.src = item.image_url;
        
        var categories = item.categories;
        if (categories) {
            var last_cat = categories[categories.length-1];
            var category_name = last_cat.name;
            item.subname = last_cat.name;
        }
        
        newItem.querySelector('p.product-name').innerHTML = item.name;
        newItem.querySelector('p.product-sub').innerHTML = item.subname;
        newItem.querySelector('span.price-amount').innerHTML = IMVU.Client.util.number_format(item.price);
        parentNode.appendChild(newItem);

        var self = this;
        $(newItem).click(function () {self.clickGiftButton(item);});
    },
    
    rebuildMusicDropdown : function(giftListInfo) {
        var i, x;
        
        var wishlistUL = YAHOO.util.Dom.get("music_wishlist");
        var templateLI = wishlistUL.querySelector('li.template');

        this.addMusicWishlist(giftListInfo.music.recipient_wishlist, wishlistUL, templateLI);
        this.addMusicWishlist(giftListInfo.music.sender_wishlist, wishlistUL, templateLI);
    },
    
    addMusicWishlist : function(musicWishlist, parentNode, templateNode) {
        if (musicWishlist) {
            
            if (musicWishlist.length > 0) {
                YAHOO.util.Dom.setStyle("tab_music_wishlist", "display", "block");
            }
            
            for (i = 0; i < musicWishlist.length; i++) {
                var x = musicWishlist[i];
                if (x) {
                    x.name = x.ArtistName;
                    x.subname = x.Title;
                    x.price = this.music_track_price;
                    x.type = "music";
                    x.id = x.TrackId;
                    x.image_url = this.getAlbumCoverUrl(x.AlbumId, 80);

                    this.cacheTrack(x);

                    this.addGiftItem(parentNode, templateNode, x);
                }
            }
        }
    },
    
    addGiftItem : function(parentNode, templateNode, item) {
        var newItem = templateNode.cloneNode(true);
        $(newItem).removeClass("template");
        $(newItem).addClass("wishlist-item");
        
        newItem.setAttribute("type", item.type);
        newItem.setAttribute("item_id", item.id);
        
        newItem.style.display = "block";
        var imgNode = newItem.querySelector('img.product-image');
        imgNode.src = item.image_url;
        
        var categories = item.categories;
        if (categories) {
            var last_cat = categories[categories.length-1];
            var category_name = last_cat.name;
            item.subname = last_cat.name;
        }
        
        newItem.querySelector('p.product-name').innerHTML = item.name;
        newItem.querySelector('p.product-sub').innerHTML = item.subname;
        newItem.querySelector('span.price-amount').innerHTML = IMVU.Client.util.number_format(item.price);
        parentNode.appendChild(newItem);

        var self = this;
        $(newItem).click(function () {self.clickGiftButton(item);});
    },
    
    clickGiftButton : function(item) {
        YAHOO.util.Dom.setStyle('addgift-button', 'display', 'none');
        document.getElementById("send-button").className = "";
        document.getElementById("cancel-button").className = "";
        this.selectedGift = item;
        this.hideGiftSelector();
        var id = item.id;
        var info;
        if (item.type == "product") {
            YAHOO.util.Dom.get("gift_product_id").value = id;
            info = this.getGiftDisplayInfo("product", id);
        } else if (item.type == "music") {
            YAHOO.util.Dom.get("gift_track_id").value = id;
            info = this.getGiftDisplayInfo("track", id);
        }
        $("gift_label").removeClass("hidden");
        YAHOO.util.Dom.get("product_name").innerHTML = item.name;
        this.price = item.price;
        this.updatePrice();
        this.showGift();
        this.showGiftDisplayInfo(info);
        $("#title").html("Send Message");
    },
    
    updatePrice : function() {
        var price = YAHOO.util.Dom.get("total_price");
        price.innerHTML = IMVU.Client.util.number_format(this.price + this.giftwrap_price, 0);
    },

    getGiftDisplayInfo : function (gift_type, gift_id) {
        var image_url, title, artist, sidetext;
        if (gift_type === 'track') {
            var Track = this.cachedTrackInfo[gift_id];
            image_url = this.getAlbumCoverUrl(Track.AlbumId, 80);
            title = html_escape(Track.Title);
            artist = html_escape(Track.ArtistName);
            sidetext = "<a class='giftlink'>" + title + "</a><br/>" + _T("by") + " <a class='giftlink'>" + artist + "</a>";
            return {
                'image-class' : 'music',
                'image-url' : image_url,
                'sidetext' : sidetext
            };
        } else if (gift_type === 'album') {
            var Album = this.cachedAlbumInfo[gift_id];
            image_url = this.getAlbumCoverUrl(Album.AlbumId, 80);
            title = html_escape(Album.AlbumName);
            artist = html_escape(Album.ArtistName);
            sidetext = "<a class='giftlink'>" + title + "</a><br/>" + _T("by") + " <a class='giftlink'>" + artist + "</a>";
            return {
                'image-class' : 'music',
                'image-url' : image_url,
                'sidetext' : sidetext
            };
        } else if (gift_type === 'product') {
            var Product = this.cachedProductInfo[gift_id];
            image_url = Product.image_url;
            sidetext = "<a title='" + _T("Click for product information.") + "'>" + Product.name + "</a>";
            return {
                'image-class' : 'product',
                'image-url' : image_url,
                'sidetext' : sidetext
            };
        } else {
            return null;
        }
    },

    showGiftDisplayInfo : function(gift_display_info) {
        var mgi = YAHOO.util.Dom.get('mw-gift-image');
        mgi.setAttribute('src', gift_display_info['image-url']);
        $(mgi).removeClass('music product')
              .addClass(gift_display_info['image-class']);
        var mgs = YAHOO.util.Dom.get('mw-gift-sidetext');
        mgs.innerHTML = gift_display_info.sidetext;
        var mgil = YAHOO.util.Dom.get('mw-gift-image-link');
    },

    hideGift : function() {
        YAHOO.util.Dom.setStyle('gift', 'display', 'none');
    },

    showGift : function() {
        YAHOO.util.Dom.setStyle('gift', 'display', 'block');
    },
    
    getAlbumCoverUrl : function (albumId, size) {
        return 'http://ib3.mcnemanager.com/scl/2/crp/11/sz/' + size + '/' + size + '/' + albumId + '.cover?dflt=imvu.jpg';
    },

    handleMessageGiftsInfo : function(info) {
        IMVU.log('gift info: ' + YAHOO.lang.JSON.stringify(info));
        if (this.args.select_gift_by_search == 1) {
            $("#title").html("Select Gift");
            info.product.recipient_wishlist  = _.sortBy(info.product.recipient_wishlist, function(app) {
                return app.name.toLowerCase();
            });
            this.infoData = info;
            this.rebuildProductDropdownWithCategories(info);
        } else {
            this.rebuildProductDropdown(info);
        }
        
        IMVU.log('done rebuildProductDropdown');
        if (this.showMusic) {
            this.rebuildMusicDropdown(info);
        }
        IMVU.log('done rebuildMusicDropdown');
        
        var selected = false,
            self = this;
        $(this.gift_tabs).each(function (index, tab) {
            if (YAHOO.util.Dom.getStyle(tab, "display") == "block" && ! selected) {
                self.clickTab(tab);
                selected = true;
            }
        });
        
        this.showTabs();
        this.hideThrobber();
    },
    
    rebuildHolidayDropdown : function() {
        this.date_available = YAHOO.util.Dom.get("s_date_available");
        this.date_available.innerHTML = '<option value="0">- '+_T("Select a date")+' -</option>';
        var options = [];
        for (var date in this.holidays) {
            if (date) {
                var option = document.createElement("option");
                option.value = date.trim();
                option.text = this.holidays[date];
                options.push(option);
            }
        }
        
        var cmp = function(a,b) {
            if (a.value < b.value) {
               return -1;
            }
            if (a.value > b.value) {
               return 1;
            }
            // a must be equal to b
            return 0;
        };
        
        options.sort(cmp);
        
        options.forEach(function(option) {
            this.date_available.appendChild(option); 
        }, this);
    },
    
    hideTabs : function() {
        YAHOO.util.Dom.setStyle("tabs", "visibility", "hidden");
        YAHOO.util.Dom.setStyle(document.querySelector('div.tab'), "display", "none");
        this.hideSearch();
    },
    
    showTabs : function() {
        YAHOO.util.Dom.setStyle("tabs", "visibility", "visible");
    },

    showSearch: function(){
        if(this.args.select_gift_by_search == 1){
           $('.search-line').removeClass('hidden');
        }
    }, 
    
    hideSearch: function(){
        $('.search-line').addClass('hidden');
    },
    
    end:1
};

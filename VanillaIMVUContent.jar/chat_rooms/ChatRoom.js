IMVU.Client.widget.ChatRoom = function (args) {
    this.$root = args.root;
    this.$root.data('chatRoomWidget', this);
    this.$root.attr('roominstanceid', args.roomInfo.room_instance_id);
    this.avoidReadImagePixels = !_.isUndefined(args.avoidReadImagePixels) && args.avoidReadImagePixels;
    this.dontPositionBackgroundImage = !_.isUndefined(args.dontPositionBackgroundImage) && args.dontPositionBackgroundImage;
    this.imvu = args.imvu || null;
    this.network = args.network || null;
    this.timer = args.timer || null;
    this.createRoomInfo(args.roomInfo);
    this.createUserInfo(args.userInfo);
    this.bindElements();
    this.$goButton.attr('data-ui-roomInstanceId', args.roomInfo.room_instance_id);
    this.$goButton.attr('data-ui-tabname', args.tabName || 'ChatRooms');

    if(args.isUpsellOnly) {
        this.$root.attr('chatroomtype','UpsellRoom');
        this.$root.attr('data-ui-room-type','UpsellRoom');
    } else {
        this.$root.attr('chatroomtype','ChatRoom');
        this.$root.attr('data-ui-room-type','ChatRoom');
        this.bindListeners({
            $infoButton: { 
                click: 'showRoomCard',
                mouseenter: 'buttonMouseEnter',
                mouseleave: 'buttonMouseLeave'
            },
            $flagButton: {
                click: 'flagRoom',
                mouseenter: 'buttonMouseEnter',
                mouseleave: 'buttonMouseLeave'
            },
            $deleteButton: {
                mouseenter: 'buttonMouseEnter',
                mouseleave: 'buttonMouseLeave'
            },
            $editButton: {
                mouseenter: 'buttonMouseEnter',
                mouseleave: 'buttonMouseLeave'
            }
            
        });

        this.hoverFillPool();
        this.delayedHoverStateCallbacks = [];
        this.delayHoverState = _.debounce(this.callDelayedHoverStateCallbacks.bind(this), 200);
        this.registerDelayedHoverStateCallback(this.$root.trigger.bind(this.$root, 'delayedmouseenter'));
    }
    this.loadRoomInfo();
}

//Object.create will allow this class to be inherited
if (Object.create === undefined) {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}
IMVU.Client.widget.ChatRoom.languageLookup = {};
IMVU.Client.widget.ChatRoom.prototype = {
    $: function(selector) {
        return this.$root.find(selector);
    },

    networkFailure: function() {
        this.imvu.call(
            'showErrorDialog',
            _T('Network Error'),
            _T('We were not able to load room info.')
        );
        return;
    },

    bindElements: function() {
        this.$pool = this.$('.pool');
        this.$poolCover = this.$('.pool-cover');
        this.$occupants = this.$('.occupants');
        this.$occupancyBubble = this.$('.occupancy-bubble');
        this.$maxOccupancy = this.$('.max-occupancy');
        this.$actualOccupancy = this.$('.actual-occupancy');
        this.$roomName = this.$('.room-name');
        this.$description = this.$('.description');
        this.$roomImage = this.$('.room-image');
        this.$subtitle = this.$('.subtitle');
        this.$language = this.$('.language');
        this.$apIcon = this.$('.ap.icon');
        this.$avIcon = this.$('.av.icon');
        this.$vipIcon = this.$('.vip.icon');
        this.$icons = this.$('.icon');
        this.$creator = this.$('.creator');
        this.$starRating = this.$('.star-rating');
        this.$avName = this.$('.av-name');
        this.$goButton = this.$('button.go');
        this.$infoButton = this.$('.room-info');
        this.$flagButton = this.$('.flag-room');
        this.$deleteButton = this.$('button.delete');
        this.$cloneButton = this.$('button.clone');
        this.$editButton = this.$('button.edit');
    },
    massageToBool: function(object, keys) {
        _.each(keys, function(key) {
            object[key] = (parseInt(object[key], 10))?true:false;
        });
    },

    //This function is extremely hard to test so it was left untested. Edit with caution.
    getFirstPixelColor: function($roomImage) {
        if(!this.avoidReadImagePixels) {
            return samplePixelColor($roomImage);
        } else {
            return 'black';
        }
    },
    
    fitImageInWidgetAndSetBackground: function(e) { 
        var $root = this.$root;
        var $roomImage = this.$roomImage;

        if($roomImage.attr('src') == '../img/throbber_black.gif') { 
            return;
        }
        $root.css('background-color',this.getFirstPixelColor($roomImage));
        var tileWidth = $root.width();
        var tileHeight = $root.height();
        var tileAspectRatio = tileHeight/tileWidth;
        $roomImage.css({
            'height':'',
            'width':''
        });
        var imageWidth = $roomImage.width();
        var imageHeight = $roomImage.height();
        var imageAspectRatio = imageHeight/imageWidth;
        if(imageAspectRatio > tileAspectRatio) {
            $roomImage.css('height', '100%');
        } else {
            $roomImage.css('width', '100%');
        }
    },

    updateRating: function(rating) {
        var ratingFloat = parseFloat(rating);
        if (ratingFloat > 0.0) {
            var roundedRating = Math.round(ratingFloat * 2.0)/2;
            this.$starRating.find('.stars').attr('rating', roundedRating.toFixed(1));
            this.$starRating.show();
        } else {
            this.$starRating.hide();
        }
    },

    loadRoomInfo: function() {
        //This method is called multiple times. If you bind, you should probably unbind too. --Hayden December 2013
        this.massageToBool(this.roomInfo, [
            'is_friends_only',
            'is_ap',
            'is_vip',
            'is_qa',
            'is_age_verified_only',
            'is_non_guest_only',
            'is_favorite'
        ]);
        var image_url = this.roomInfo.image_url;
        //Rollout for image resize service
        if(this.roomInfo.resized_image_url) { 
            image_url = this.roomInfo.resized_image_url;
        } 
        if(image_url == '') { 
            image_url = 'img/no_image_room.jpg';
        }
        if(!this.dontPositionBackgroundImage){
            this.$roomImage.load(this.fitImageInWidgetAndSetBackground.bind(this));
        }
        this.$roomImage.attr('src', image_url);
        this.$roomName.html(this.roomInfo.name);
        ellipsize(this.$roomName, 130);
        this.$apIcon.toggle(this.roomInfo.is_ap);
        this.$vipIcon.toggle(this.roomInfo.is_vip);
        this.$avIcon.toggle(this.roomInfo.is_age_verified_only);
        this.$description.html(this.roomInfo.description);
        ellipsize(this.$description, 1500);
        this.$language.text(IMVU.Client.widget.ChatRoom.languageLookup[this.roomInfo.language]);
        this.$maxOccupancy.text(this.roomInfo.max_users);
        this.$actualOccupancy.text(this.roomInfo.num_participants);
        var rating = this.roomInfo.rating;
        if ("rating_str" in this.roomInfo) {
            rating = this.roomInfo.rating_str;
        }
        this.updateRating(rating);
        this.$avName.text(this.roomInfo.customers_name);
        this.$avName.unbind('click').bind('click', function () {
            this.imvu.call('showAvatarCard', this.roomInfo.customers_id, {avname: this.roomInfo.owner});
            return false;
        }.bind(this));
        ellipsize(this.$avName, 150);
    },
    createRoomInfo: function(roomInfoArg) {
        this.roomInfo = $.extend({
            isFull: function() {
                return this.actualOccupancy >= this.maxOccupancy;
            }
        }, roomInfoArg);
        _.defaults(this.roomInfo, {
            'rating':5.0
        });
    },
    createUserInfo: function(userInfoArg) {
        var imvu = this.imvu;
        this.userInfo = $.extend({
            isOwner: false,
            hasVIPPass: function() {
                return imvu.call('hasVIPPass');
            }
        },userInfoArg);
    },
    find: function(selector) {
        return this.$root.find(selector);
    },
    bindListeners: function(elements) {
        _.each(elements, function(val, name) {
            _.each(val, function(callback, event) {
                this[name].bind(event,this[callback].bind(this));
            }.bind(this));
        }.bind(this));
    },
    showRoomCard: function(e) { 
        this.imvu.call('showRoomCard',this.roomInfo.room_instance_id);
        e.stopPropagation();
    },

    flagRoom: function(e) {
        var dialogInfo = {
            'uri':'chrome://imvu/content/dialogs/flag_content/index_flag_dialog.html',
            'service_url': '/api/flag_content/flag_publicroom.php',
            'title':_T('Flag ') + '"' + this.roomInfo.name + '"',
            'post_data': {
                'room_instance_id': this.roomInfo.room_instance_id,
                'flag_type':''
            },
            'get_reasons_from_server': {
                'content_type': 'publicroom',
                'content_id': this.roomInfo.room_instance_id,
            },
            'message': _T('Please tell us what you find inappropriate about this chat room. For your reference, you can find our Terms of Service') + '<a id="tos" href="http://www.imvu.com/catalog/web_info.php?section=Info&topic=terms_of_service"> ' + _T('here') + ':</a>'
        };
        this.imvu.call('showModalFlaggingDialog', dialogInfo);
        e.stopPropagation();
    },

    buttonMouseEnter: function(e) { 
        e.stopPropagation();
    },
    
    buttonMouseLeave: function(e) {
        e.stopPropagation();
    },
    
    revertAllAnimation: function() {
        this.fillPoolAnimation.revert();
    },
    mouseleave: function() {
        this.hovering = false;
    },
    registerDelayedHoverStateCallback: function(f) {
        this.delayedHoverStateCallbacks.push(f);
    },
    callDelayedHoverStateCallbacks: function() {
        if(!this.hovering) return;
        _.each(this.delayedHoverStateCallbacks, function(callback) {
            callback(this);
        }.bind(this));
    },
    fillUpPool: function() {
        this.fillPoolAnimation.start();

    },
    mouseenter: function() {
        this.hovering = true;
        if(this.delayedHoverStateCallbacks.length > 0) { 
            this.delayHoverState();
        }
    },
    hoverFillPool: function() {
        var animationQueueFactory = new AnimationQueueFactory({
            $el: this.$root,
            time: IMVU.Time
        });
        animationQueueFactory.writeScript()
            .animateTo('.pool',{
                'margin-bottom': '0'
            })
            .animateTo('.icon',{
                'opacity': 1
            })
            .animateTo('.creator',{
                'opacity': 1
            })
            ._in(250)
            .then()
            .animateTo('.pool-cover',{
                'height': 66
            })
            .animateTo('.occupants', {
                opacity: 1
            })
            .animateTo('.occupant', {
            })
            ._in(125)
            .finish();
        if(this.$occupants.is(':visible')) { 
            this.animate(this.$occupants, {
            });
        }
        this.fillPoolAnimation = animationQueueFactory.animationQueue;
        this.bindListeners({
            $root: {
                mouseenter: 'mouseenter',
                mouseleave: 'mouseleave'
            },
        });
    },

    removeHoverOnMouseleave: function () {
        this.bindListeners({
            $root: {
                delayedmouseenter: 'fillUpPool',
                mouseleave: 'revertAllAnimation'
            }
        });
    },

    populateOccupants: function(results, error) {
        if(error) {
            this.networkFailure();
            return;
        } 
        this.$occupants.find('.occupant:not(:first-child)').remove();
        var $occupant = this.$occupants.find('.occupant');
        var i = 0;
        for(var cid in results.participants) {
            if(i == 10) return;
            var participant = results.participants[cid];
            var $img = $('<img>').attr('src', participant.avpic);
            var THAT = this;  //  can't bind(this) to the click handler, because we are saving data
            $img.data('cid', cid);
            $img.click(function() {
                THAT.imvu.call('showAvatarCard', $(this).data('cid'), {});
            });
            $occupant.empty();
            $occupant.append($img);
            $occupant.show();
            $occupant.attr('title', participant.avatar_name);
            this.$occupants.append($occupant);
            $occupant = $occupant.clone();
            i++;
        }
        $occupant.remove();
        this.occupantsLoaded = true;
    },

    loadOccupants: function() { 
        var shouldRefresh = this.imvu.call('shouldRefreshRoomOccupanyOnEveryHover');
        if(!shouldRefresh && this.occupantsLoaded) { 
            return;
        }
        this.$occupants.find('.occupant').hide();
        serviceRequest({
            method: 'GET',
            uri: '/api/rooms/room_info.php?room_id=' + this.roomInfo.room_instance_id,
            network: this.network,
            imvu: this.imvu,
            json: true,
            callback: this.populateOccupants.bind(this)
        });
    },

    loadOccupantsOnHover: function() { 
        this.$occupants.show();
        this.occupantsLoaded = false;
        this.registerDelayedHoverStateCallback(this.loadOccupants.bind(this));
    }
}

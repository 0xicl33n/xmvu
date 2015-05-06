function ChatRoomsSliderHelper(args) {
    this.$roomList = args.$roomList;
    this.$scrollPane = args.$scrollPane;
    this.scrolling = false;

    var setUpScrollingTracking = function() { 
        this.scrolling = false;
        var setNotScrolling = _.debounce(function() { 
            this.scrolling = false;

        }.bind(this),200);

        var callHoverState = _.debounce(function() { 
            if(!_.isUndefined(this.mouseoverChatRoomWidget)) {
                this.mouseoverChatRoomWidget.callDelayedHoverStateCallbacks();
                this.mouseoverChatRoomWidget = undefined;
            }
        }.bind(this), 500);

        this.$scrollPane.bind('scroll', _.throttle(function(event) {
            this.scrolling = true;

            setNotScrolling();
            callHoverState();
        }.bind(this), 200));
    }.bind(this);

    var setUpHandlers = function() {
        this.$roomList.delegate('.chatroom', 'delayedmouseenter', _.throttle(function(e) {
            var chatRoom = $(e.target).data('chatRoomWidget');
            if(chatRoom && chatRoom != this.currentOpenChatRoomWidget) {
                this.collapseSliderOnCurrentChatRoomWidget();

                if(!this.scrolling && chatRoom.hovering) {
                    this.currentOpenChatRoomWidget = chatRoom;
                    chatRoom.fillUpPool();
                }
            }

            if(this.scrolling) {
                this.mouseoverChatRoomWidget = chatRoom;
            }
        }.bind(this)), 100);
    }.bind(this);

    this.collapseSliderOnCurrentChatRoomWidget = function() {
        if(!_.isUndefined(this.currentOpenChatRoomWidget)) {
            this.currentOpenChatRoomWidget.revertAllAnimation();
        }
        this.currentOpenChatRoomWidget = undefined;
    };

    setUpScrollingTracking();
    setUpHandlers();
}

ChatRoomsSliderHelper.prototype = {
}

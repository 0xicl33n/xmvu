function InfiniteScrolling(args) { 
    this.$scrollPane = args.scrollPane;
    this.loadMoreEntries = args.loadMoreEntries;
    this.loadMoreEntriesArgs = args.loadMoreEntriesArgs || {};
    this.countEntriesLoaded = args.countEntriesLoaded;
    this.maxCountEntries = args.maxCountEntries;
    this.canLoadMoreEntries = args.canLoadMoreEntries;
    if(!_.isUndefined(args.scrollBottomFetchMoreResults)) { 
        this.scrollBottomFetchMoreResults = args.scrollBottomFetchMoreResults;
    } else { 
        this.scrollBottomFetchMoreResults = 400;
    }
    this.startLoadingState = args.startLoadingState || function() {};
    this.endLoadingState = args.endLoadingState || function() {};
    this.getOffset = args.getOffset;
    this.getUri = args.getUri || function() {};

    var loadingMore = false;
    var loadNextBatch = function(clear) {
        console.log('loading next batch');
        loadingMore = true;
        if(this.canLoadMoreEntries() || clear) {
            console.log('actually loading');
            this.startLoadingState();
            this.loadMoreEntries($.extend({
                uri: this.getUri(),
                offset: this.getOffset(), 
                clear: clear,
                onChatRoomWidgetsVisible: function() {
                    loadingMore = false;
                    this.endLoadingState();
                    this.$scrollPane.trigger('chatRoomWidgetsVisible');
                }.bind(this),
                onSearchCancelled: function() {
                    loadingMore = false;
                    this.endLoadingState();
                }.bind(this),
            }, this.loadMoreEntriesArgs));
        } else {
            loadingMore = false;
        }
    }.bind(this);
    this.loadMoreResults = function() { 
        if(!loadingMore) {
            loadNextBatch(false);
        }
    };
    this.$scrollPane.bind('scroll', function() {
        if((1-this.getPercentScrolledY())*this.getContentHeight() < this.scrollBottomFetchMoreResults) {
            this.loadMoreResults();
        }
    }.bind(this));

    this.reloadResults = loadNextBatch.bind(null, true);
}

InfiniteScrolling.prototype = {
    getContentHeight: function() {
        return this.$scrollPane[0].scrollHeight;
    },

    getPaneHeight: function () {
        return this.$scrollPane.height();
    },

    getPercentScrolledY: function() {
        return this.$scrollPane.scrollTop() / (this.getContentHeight() - this.getPaneHeight());
    },

    scrollToPercentY: function(destPercentY) {
        this.$scrollPane.scrollTop(destPercentY * (this.getContentHeight() - this.getPaneHeight()));
    },

    getContentPositionY: function() {
        return this.$scrollPane.scrollTop();
    },

    scrollToY: function (y) {
        this.$scrollPane.scrollTop(y);
    },

    scrollToBottom: function() {
        this.$scrollPane.scrollTop(this.getContentHeight() - this.getPaneHeight());
    }
}

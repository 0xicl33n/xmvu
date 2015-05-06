(function() {

    var MILLISECONDS = 1000;

    function LoadingDialog(timer) {
        this.$panel = $('.template > .loading-dialog').clone();
        this.$progressBar = $('.progress-bar', this.$panel);
        this.$currentProgress = $('.current-progress', this.$progressBar);

        this.timerId = timer.setInterval(this.flipPage.bind(this), 5 * MILLISECONDS);
        this.ellipsisTimer = timer.setInterval(this.updateEllipses.bind(this), 0.5 * MILLISECONDS);
        this.ellipsisCount = 0;
        this.page = 0;
        this.pageCount = 3;

        var $pages = $('.page', this.$panel);
        $($pages[this.page]).animate({opacity: 1}, 1000);
    }

    LoadingDialog.prototype.show = function() {
        this.$panel.appendTo($('#walkoff'));
    };

    LoadingDialog.prototype.hide = function() {
        this.$panel.detach();
    };

    LoadingDialog.prototype.setProgress = function(progress) {
        var w = Math.max(0.0, Math.min(1.0, progress)) * this.$progressBar.width();
        this.$currentProgress.animate({width: w});
    };

    LoadingDialog.prototype.updateEllipses = function() {
        this.ellipsisCount = (this.ellipsisCount + 1) % 4;
        this.$panel.attr('data-ellipsis', this.ellipsisCount);
    };

    LoadingDialog.prototype.flipPage = function() {
        var oldPage = this.page;
        this.page = (this.page + 1) % this.pageCount;

        var $pages = $('.page', this.$panel);
        $($pages[oldPage]).animate({opacity: 0}, 1000);
        $($pages[this.page]).animate({opacity: 1}, 1000);
    };

    /*
     * @param timer A thing that provides setInterval(), like the global window object.
     * @param assets An array of URLs to download.
     * @param onComplete Called when everything is said and done.
     * @param imageLoader (optional) A function (onComplete, assetName) which loads the named
     *                               asset and calls onComplete.
     */
    LoadingDialog.showDialogAndPreloadAssets = function (timer, assets, onComplete, imageLoader) {
        imageLoader = imageLoader || defaultImageLoader;

        var $hidden = $('<div>')
                .css({position: 'absolute',
                      left: -9000,
                      top: -9000,
                      'z-index': -99999})
                .appendTo(document.body);

        var assetCount = assets.length;
        var progress = 0;
        var isComplete = false;

        var ld = new LoadingDialog(timer);

        _.each(assets, function(a) {
            return imageLoader(incrementProgress, a);
        });

        ld.show();

        return cancel;

        function defaultImageLoader(completion, a) {
            $('<img>')
                .attr('src', a)
                .one('load', completion.bind(null, a))
                .one('error', onError.bind(null, completion, a))
                .appendTo($hidden);
        }

        function onError(completion, asset) {
            IMVU.log("WARNING: Failed to preload " + asset);
            completion();
        }

        function complete() {
            if (!isComplete) {
                isComplete = true;
                ld.hide();
                onComplete();

                delete ld;
                delete timer;
                delete onComplete;
            }
        }

        function incrementProgress(asset) {
            if (isComplete) {
                return;
            }
            ++progress;
            ld.setProgress(progress / assetCount);
            
            if (progress >= assetCount) {
                complete();
            }
        }

        function cancel() {
            complete();
        }
    }

    window.LoadingDialog = LoadingDialog;

})();

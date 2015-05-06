var IMVU = IMVU || {};
(function() {
    var mySetTimeout = setTimeout;

    var impl = function(fn) {
            mySetTimeout(fn, 0);
        };

    var queue = [];

    function flushTaskQueue() {
        // todo: O(N^2)
        while (queue.length) {
            var fn = queue.shift();            
            try {
                fn();                
            }
            catch (e) {                
                impl(flushTaskQueue);
                // shows error in console log, presumably
                throw e;
            }
        }
    }

    IMVU.EventLoop = {
        queueTask: function(fn) {           
            queue.push(fn);
            if (queue.length === 1) {
                impl(flushTaskQueue);
            }
        }
    };
})();
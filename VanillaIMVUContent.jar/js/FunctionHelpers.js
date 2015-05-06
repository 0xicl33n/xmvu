IMVU.Client.util.FunctionHelpers = function(args) {
    var timer = args.timer || timerRequired;
    var delay = function(func, wait) {
        var args = Array.prototype.slice.call(arguments, 2);
        return timer.setTimeout(function() {
            return func.apply(null, args);
        }, wait);
    };

    var debounce = function(func, wait, immediate) {
        var timeout, args, context, timestamp, result;

        var later = function() {
            var last = timer.getNow() - timestamp;
            if (last < wait) {
                timeout = timer.setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    context = args = null;
                }
            }
        };

        return function() {
            context = this;
            args = arguments;
            timestamp = timer.getNow();
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = timer.setTimeout(later, wait);
            }
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }

            return result;
        };
    };
    var defer = function(func) {
        return delay.apply(null, [func, 1].concat(Array.prototype.slice.call(arguments, 1)));
    };

    var throttle = function(func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        options || (options = {});
        var later = function() {
            previous = options.leading === false ? 0 : timer.getNow();
            timeout = null;
            result = func.apply(context, args);
            context = args = null;
        };
        return function() {
            var now = timer.getNow();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0) {
                timer.clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
                context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = timer.setTimeout(later, remaining);
            }
            return result;
        };
    };

    return {
        delay: delay,
        defer: defer,
        debounce: debounce,
        throttle: throttle
    }

}
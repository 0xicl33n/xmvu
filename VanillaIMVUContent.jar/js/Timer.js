function Timer() {
}

Timer.prototype = {
    getNow: function() {
        return window.Date.now();
    },
    setTimeout: function(fn, i) {
        return window.setTimeout(fn, i);
    },
    setInterval: function(fn, i) {
        return window.setInterval(fn, i);
    },
    clearTimeout: function(i) {
        return window.clearTimeout(i);
    },
    clearInterval: function(i) {
        return window.clearInterval(i);
    }
};

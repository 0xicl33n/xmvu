var Dom = YAHOO.util.Dom;

function PulseCounter(spec) {
    spec = spec || {};
    this.rootElement = spec.rootElement;
    this.imvu = spec.imvu;
    this.network = spec.network || YAHOO.util.Connect;
    this.setInterval = spec.interval || function (fn, timeout) {setInterval(fn, timeout);};
    this.pollFrequency = spec.pollFrequency || (5 * 60 * 1000);  // 5 minutes

    this.elSpinner = document.getElementById('update-spinner-container');

    this.digitElements = Array();
    for (var i = 0; i < 6; i++) {
        this.digitElements.push(document.getElementById('update-count-' + i));
    }
}

PulseCounter.prototype.start = function() {
    this.interval = this.setInterval(this.poll.bind(this), this.pollFrequency);
    this.poll();
}

PulseCounter.prototype.poll = function() {
    $(this.elSpinner).removeClass('hidden');
    var callback = {
        success: this.counterComplete.bind(this),
        failure: this.counterFailed.bind(this)
    }
    var url = IMVU.SERVICE_DOMAIN + '/api/pulse_counter.php';
    IMVU.log('Starting request to get pulse update counter: ' + url);
    this.network.asyncRequest('GET', url, callback, undefined);
}

PulseCounter.prototype.counterComplete = function(result) {
    try {
        data = JSON.parse(result.responseText);
        if(data.success == '1') {
            this.setCount(parseInt(data.count));
        } else {
            IMVU.log('Call to pulse_counter.php was not successful');
        }
    } catch(e) {
        IMVU.log('Failed to parse count from pulse_counter.php result: ' + e);
    }
}

PulseCounter.prototype.counterFailed = function(result) {
    IMVU.log('Call to pulse_counter.php did not complete');
}

PulseCounter.prototype.setCount = function(count) {
    IMVU.log('Setting pulse update counter to ' + count);
    for (var i in this.digitElements) {
        this.digitElements[i].className = 'digit';
        var place = Math.pow(10, parseInt(i));
        var digit = count % (place * 10);
        digit = Math.floor(digit / place);
        $(this.digitElements[i]).addClass('c' + digit);
    }
    $(this.elSpinner).addClass('hidden');
}


function FakeTime() {
    this.now = 1298406977;
}

FakeTime.prototype = {
    getNow: function() {
        return this.now;
    },

    _setNow: function(now) {
        if (now instanceof Date) {
            this.now = now.getTime() / 1000;
        } else if (/....-..-.. ..:..:../.test(now)) {
            this.now = IMVU.Time.phpTimeStampToUnixTime(now);
        }
    },

    phpTimeStampToUnixTime: function(t) {
        return IMVU.Time.phpTimeStampToUnixTime(t);
    },

    howLongAgo: function(t, u) {
        return IMVU.Time.howLongAgo(t, u);
    },

    formatDate: function(t, u) {
        return IMVU.Time.formatDate(t, u);
    },
    
    formatDateObj: function(t, u) {
        return IMVU.Time.formatDateObj(t, u);
    },

    dateIsDaylightSavings: function(t) {
        return IMVU.Time.dateIsDaylightSavings(t);        
    },

    localDateFromServerTime: function(t) {
        return IMVU.Time.localDateFromServerTime(t);        
    }
};

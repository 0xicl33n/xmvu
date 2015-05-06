
IMVU.Time = IMVU.Time || {};

IMVU.Time.getNow = function() {
    return new Date().getTime() / 1000;
}

/* Accepts a "PHP-style" datetime: YYYY-MM-DD HH:MM:SS (this is actually a standard or something)
 * Returns seconds since the Unix epoch.
 * ... yes, this is seriously what it takes because new Date(string) seems to be unreliable
 * on some versions of XULRunner.
 * -- andy 22 Feb 2011
 */
IMVU.Time.phpTimeStampToUnixTime = function(s) {
    var m = /(....)-(..)-(..) (..):(..):(..)/.exec(s);
    if (!m) {
        throw "IMVU.Time.phpTimeStampToUnixTime failed on " + s.toSource();
    }

    function pi(s) {
        // Force decimal
        return parseInt(s, 10);
    }

    var fields = m.slice(1).map(pi);
    var d = new Date(fields[0], fields[1] - 1, fields[2], fields[3], fields[4], fields[5]);
    return d.getTime() / 1000;
}

IMVU.Time.howLongAgo = function (pastInSeconds, nowInSeconds) {
    var secondsAgo = nowInSeconds - pastInSeconds;

    function minutes(N) { return N * 60; }
    function hours(N)   { return N * minutes(60); }
    function days(N)    { return N * hours(24); }
    function weeks(N)   { return N * days(7); }
    function months(N)  { return N * days(30); }
    function years(N)   { return N * months(12); }

    var now = new Date();
    now.setTime(nowInSeconds * 1000);
    var secondsTilYesterday = hours(now.getHours()) + minutes(now.getMinutes()) + now.getSeconds();

    for each (var threshold in [
        {max: 1,              unit: 1,          textual: function (N) { return _T("now"); }},
        {max: minutes(1) - 1, unit: 1,          textual: function (N) { return N + ' '+_T("seconds ago"); }},
        {max: minutes(2) - 1, unit: minutes(1), textual: function (N) { return '1 ' + _T("minute ago"); }},
        {max: hours(1) - 1,   unit: minutes(1), textual: function (N) { return N + ' '+_T("minutes ago"); }},
        {max: hours(2) - 1,   unit: hours(1),   textual: function (N) { return '1 ' + _T("hour ago"); }},

        {max: secondsTilYesterday - 1,    unit: hours(1),   textual: function (N) { return N + ' '+_T("hours ago"); }},
        {max: days(1) + secondsTilYesterday - 1, unit: days(1), textual: function (N) { return _T("Yesterday"); }},
        {max: days(6) + secondsTilYesterday - 1, unit: days(1), textual: function (N) {
            N = Math.ceil((secondsAgo - secondsTilYesterday) / this.unit);
            return N + ' '+_T("days ago");
        }},

        {max: weeks(2) - 1,   unit: weeks(1),   textual: function (N) { return _T("Last week"); }},
        {max: months(1) - 1,  unit: weeks(1),   textual: function (N) { return N + ' '+_T("weeks ago"); }},
        {max: months(2) - 1,  unit: months(1),  textual: function (N) { return '1 ' + _T("month ago"); }},
        {max: years(1) - 1,   unit: months(1),  textual: function (N) { return N + ' '+_T("months ago"); }},
        {max: years(2) - 1,   unit: years(1),   textual: function (N) { return '1 ' + _T("year ago"); }},
        {max: years(6) - 1,   unit: years(1),   textual: function (N) { return N + ' '+_T("years ago"); }}
    ]) {
        if (secondsAgo <= threshold.max) {
            return threshold.textual(Math.floor(secondsAgo / threshold.unit));
        }
    }

    return _T("a long time ago");
}

IMVU.Time.formatDate = function (currentDate, messageDateString) {
    var messageDate = new Date();
    var formattedDate = '';

    messageDateString = messageDateString.replace(/-/g, '/');
    messageDate.setTime(Date.parse(messageDateString));

    return IMVU.Time.formatDateObj(currentDate, messageDate);
}

IMVU.Time.formatDateObj = function (currentDate, messageDate) {
    var formattedDate = '';
    if (currentDate.format('mediumDate') == messageDate.format('mediumDate')) {
        formattedDate = messageDate.format('h:MM TT');
    } else {
        formattedDate = messageDate.format('mmm d, h:MM TT');
    }

    return formattedDate;
}

IMVU.Time._generateDstArray = function (startYear, numYears) {
    var year = startYear;
    var i;
    var arrayDates = [];

    for(i=0; i<numYears; i++)
    {
        IMVU.Time._findDstSwitchDatesForYear(startYear + i, arrayDates);
    }

    return arrayDates.toString();
}


IMVU.Time._loadDstArray = function () {
    var string = "2000-04-02T10:00:00.000Z,2000-10-29T09:00:00.000Z,2001-04-01T10:00:00.000Z,2001-10-28T09:00:00.000Z,2002-04-07T10:00:00.000Z,2002-10-27T09:00:00.000Z,2003-04-06T10:00:00.000Z,2003-10-26T09:00:00.000Z,2004-04-04T10:00:00.000Z,2004-10-31T09:00:00.000Z,2005-04-03T10:00:00.000Z,2005-10-30T09:00:00.000Z,2006-04-02T10:00:00.000Z,2006-10-29T09:00:00.000Z,2007-03-11T10:00:00.000Z,2007-11-04T09:00:00.000Z,2008-03-09T10:00:00.000Z,2008-11-02T09:00:00.000Z,2009-03-08T10:00:00.000Z,2009-11-01T09:00:00.000Z,2010-03-14T10:00:00.000Z,2010-11-07T09:00:00.000Z,2011-03-13T10:00:00.000Z,2011-11-06T09:00:00.000Z,2012-03-11T10:00:00.000Z,2012-11-04T09:00:00.000Z,2013-03-10T10:00:00.000Z,2013-11-03T09:00:00.000Z,2014-03-09T10:00:00.000Z,2014-11-02T09:00:00.000Z,2015-03-08T10:00:00.000Z,2015-11-01T09:00:00.000Z,2016-03-13T10:00:00.000Z,2016-11-06T09:00:00.000Z,2017-03-12T10:00:00.000Z,2017-11-05T09:00:00.000Z,2018-03-11T10:00:00.000Z,2018-11-04T09:00:00.000Z,2019-03-10T10:00:00.000Z,2019-11-03T09:00:00.000Z,2020-03-08T10:00:00.000Z,2020-11-01T09:00:00.000Z,2021-03-14T10:00:00.000Z,2021-11-07T09:00:00.000Z,2022-03-13T10:00:00.000Z,2022-11-06T09:00:00.000Z,2023-03-12T10:00:00.000Z,2023-11-05T09:00:00.000Z,2024-03-10T10:00:00.000Z,2024-11-03T09:00:00.000Z,2025-03-09T10:00:00.000Z,2025-11-02T09:00:00.000Z,2026-03-08T10:00:00.000Z,2026-11-01T09:00:00.000Z,2027-03-14T10:00:00.000Z,2027-11-07T09:00:00.000Z,2028-03-12T10:00:00.000Z,2028-11-05T09:00:00.000Z,2029-03-11T10:00:00.000Z,2029-11-04T09:00:00.000Z,2030-03-10T10:00:00.000Z,2030-11-03T09:00:00.000Z,2031-03-09T10:00:00.000Z,2031-11-02T09:00:00.000Z,2032-03-14T10:00:00.000Z,2032-11-07T09:00:00.000Z,2033-03-13T10:00:00.000Z,2033-11-06T09:00:00.000Z,2034-03-12T10:00:00.000Z,2034-11-05T09:00:00.000Z,2035-03-11T10:00:00.000Z,2035-11-04T09:00:00.000Z,2036-03-09T10:00:00.000Z,2036-11-02T09:00:00.000Z,2037-03-08T10:00:00.000Z,2037-11-01T09:00:00.000Z,2038-04-25T10:00:00.000Z,2038-10-31T09:00:00.000Z,2039-04-24T10:00:00.000Z,2039-10-30T09:00:00.000Z,2040-04-29T10:00:00.000Z,2040-10-28T09:00:00.000Z";
    return string.split(",");
}

IMVU.Time._findDstSwitchDatesForYear = function (year, arrayDates) {
    var month = 0;
    var day = 0;
    var hour = 0;
    var testDate = new Date(Date.UTC(year, 0, 0, 0, 0, 0, 0));
    var prevTz = testDate.getTimezoneOffset();
    var tz;
    var firstDate = null;
    var secondDate = null;

    // Find a month with a tz switch.
    for(month = 0; month < 12; month++) {
        testDate = new Date(Date.UTC(year, month, 0, 0, 0, 0, 0));
        tz = testDate.getTimezoneOffset();
        
        // Did the timezone switch?
        if(tz != prevTz) {
            // Find the day
            for(day=0; day<= 31; day++) {
                testDate = new Date(Date.UTC(year, month-1, day, 0, 0, 0, 0));
                tz = testDate.getTimezoneOffset();
                if(tz != prevTz) {
                    // Find the hour
                    for(hour=0; hour< 24; hour++) {
                        testDate = new Date(Date.UTC(year, month-1, day-1, hour, 0, 0, 0));
                        tz = testDate.getTimezoneOffset();
                        if(tz != prevTz) {
                            // Close enough
                            if(firstDate) {
                                secondDate = testDate;
                            } else {
                                firstDate = testDate;
                            }

                            hour = day = 999;
                            prevTz = tz;
                        }
                    }
                }
            }
        }
    }

    arrayDates.push(firstDate.toJSON());
    arrayDates.push(secondDate.toJSON());
}

IMVU.Time.dateIsDaylightSavings = function(date) {
    var arrayDates = IMVU.Time._loadDstArray();
    var i;
    for(i=0; i<arrayDates.length; i++) {
        testDate = new Date(arrayDates[i]);
        if(date < testDate) {
            if(i % 2) {
                return true;
            }
            return false;
        }
    }
    return false;
}

IMVU.Time.localDateFromServerTime = function(messageDateString) {

    messageDateString = messageDateString.replace(/-/g, '/') + ' PST';

    var date = new Date(messageDateString + ' PST');
    if(IMVU.Time.dateIsDaylightSavings(date))
    {
        date = new Date(messageDateString + ' PDT');
    }

    return date;
}

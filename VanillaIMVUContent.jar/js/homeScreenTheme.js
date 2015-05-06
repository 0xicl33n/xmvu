var HOME_SCREEN_THEME_LOCAL_CSS_FILE = "file:///C:/localHomeScreenTheme.css";

function HomeScreenTheme(creator, imvuCall, eventBus, todayDateObj) {
    var fileref;
    var endDateStr = imvuCall('getImvuConfigVariable', 'client.homeScreenTheme.endDate');
    var endDate = new Date(endDateStr);
    IMVU.log("Created by " + creator + ", home screen theme end date: " + endDateStr + 
       " (" + endDate.getFullYear() + "/" + (endDate.getMonth() + 1) + "/" + endDate.getDate() + ")");

    var daysLeft = Math.round((endDate - todayDateObj)/(1000*60*60*24));
    IMVU.log("home screen theme days left: " + daysLeft);
    
    if (daysLeft >= 0) {
        var serverHomeModeCssUrl = imvuCall('getImvuConfigVariable', 'client.homeScreenTheme.CssUrl');
        if (serverHomeModeCssUrl !== "") {
            IMVU.log("applying theme from imvuConfig: " + serverHomeModeCssUrl);
            fileref=document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("href", serverHomeModeCssUrl);
            document.getElementsByTagName("head")[0].appendChild(fileref);                      
        }    
    }

    var isQAOrAdmin = imvuCall('isQA') || imvuCall('isAdmin');
    IMVU.log("QaOrAdmin: " + isQAOrAdmin); 
    if (isQAOrAdmin) {
        IMVU.log("applying theme from local file: " + HOME_SCREEN_THEME_LOCAL_CSS_FILE);
        fileref=document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", HOME_SCREEN_THEME_LOCAL_CSS_FILE);
        document.getElementsByTagName("head")[0].appendChild(fileref);
        
        if (creator == "TabBar") {
            this.eventBus = eventBus;
            YAHOO.util.Event.on(document, 'keydown', this.checkKeyAndReload.bind(this));
        } else if (creator == "HomeMode") {
            eventBus.register('reloadHomeScreen', this.reloadHomeScreen);
        }
    }
}

HomeScreenTheme.prototype = {
    doReload : function() {
        window.location.reload();
    },

    checkKeyAndReload : function(event) {
        if (event.keyCode == 120) { // F9
            IMVU.log("reloading from key input");
            this.eventBus.fire('reloadHomeScreen');
            this.doReload();
        }
    },
    
    reloadHomeScreen : function() {
        IMVU.log("reloading from reloadHomeScreen event");
        window.location.reload();
    }
};

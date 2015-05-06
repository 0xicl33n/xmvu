IMVU.buddyAutocomplete = function (network, imvu, timer, animSpeed, inputElement, container, avatarSelectedCallback, itemResponseCallback) {
    var avatarNameDS = new YAHOO.util.XHRDataSource(IMVU.SERVICE_DOMAIN + '/api/avatar_autocomplete.php');
    avatarNameDS.connMgr = network;
    avatarNameDS.imvu = imvu;
    avatarNameDS.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
    avatarNameDS.responseSchema = {
        resultsList : "buddies_matched",
        fields : [{ key: "name" }, { key: "cid" }, { key: "img" }],
        metaFields : {
            valid : "valid"
        }
    };
    
    var autoComplete;

    avatarNameDS.subscribe("responseEvent", function(o) {
        if (inputElement.value === "") {
            autoComplete.collapseContainer();
        }
        var name = o.response.responseText.query.toLowerCase();
        var valid = o.response.responseText.valid;
        var is_buddy = o.response.responseText.is_buddy;
        if (itemResponseCallback) {
            itemResponseCallback(name, valid, is_buddy);
        }
    }, null, true);

    var config = {
        animSpeed: animSpeed,
        queryMatchContains: false,
        queryMatchCase: false,
        timer: timer
    };
    if (!animSpeed) {
        config.animHoriz = config.animVert = false;
    }
    autoComplete = new YAHOO.widget.AutoComplete(inputElement, container, avatarNameDS, config);
    autoComplete.queryDelay = 0.25;
    _autoComplete_dataReturnEvent_data_name = '_request_not_sent';
    autoComplete.generateRequest = function(q) {
        request = "?avatarname=" + q;
        return request;
    };
    
    autoComplete.dataRequestEvent.subscribe(function(type, args, obj) {
        _autoComplete_dataReturnEvent_data_name = '_request_sent';
    }, null, true);
    
    autoComplete.resultTypeList = false;
    autoComplete.formatResult = function(oResultData, sQuery, sResultMatch) {
        return "<div class='autocomplete-result'><img src='" + oResultData.img + "' height='25' /><div class='name'>" + sResultMatch + "</div></div>";
    };
    
    autoComplete.itemSelectEvent.subscribe(function(type, args, obj) {
        var data = args[2];
        avatarSelectedCallback(data);
    }, null, true);
    
    autoComplete.dataReturnEvent.subscribe(function(type, args, obj) {
        var data = args[2];
        if ((data instanceof Array) && (data.length > 0)) {
            _autoComplete_dataReturnEvent_data_name = data[0]['name'];
        } else {
            _autoComplete_dataReturnEvent_data_name = '_data_not_array_or_empty';
        }
    }, null, true);
    
    autoComplete.doBeforeExpandContainer = function( elTextbox , elContainer , sQuery , aResults ) {
        if (elTextbox.value === "") {
            return false;
        } else {
            return true;
        }
    };

    return autoComplete;
};

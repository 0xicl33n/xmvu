
IMVU.GetMatchedDataSource = function(url, params, net, imvu) {
    var ds = new IMVU.DataSource(url, params, net, imvu);
    ds.responseType = YAHOO.util.DataSource.TYPE_JSON;

    ds.responseSchema = {
        resultsList: 'matches',
        metaFields: {totalRows: 'total_results', rowsPerPage: 'results_per_page'}
    };
    
    ds.generateRequestArguments = function (state, table) {
        if (! this.queryParameters.offset) {
            return '';
        }
        return '?start_index=' + this.queryParameters.offset;
    };

    ds.doBeforeParseData = function (oRequest, oFullResponse, oCallback) {
        parsedResponse = {
            matches: [],
            total_results: 0,
            results_per_page: 50
        }
        if (! Object.prototype.hasOwnProperty.call(oFullResponse, "denormalized") || 
            ! Object.prototype.hasOwnProperty.call(oFullResponse.denormalized, url) || 
            ! Object.prototype.hasOwnProperty.call(oFullResponse.denormalized[url], "data") ||
            ! Object.prototype.hasOwnProperty.call(oFullResponse.denormalized[url].data, "items")
        ) {
            return oFullResponse;
        }
        _.each(oFullResponse.denormalized[url].data.items, function(match_uri) {
            if (oFullResponse.denormalized.hasOwnProperty(match_uri)) {
                var matchData = oFullResponse.denormalized[match_uri].data;
                var getMatchedUri = oFullResponse.denormalized[match_uri].relations.ref;
                if (! Object.prototype.hasOwnProperty.call(oFullResponse.denormalized, getMatchedUri)) {
                    return;
                }
                var userUri = oFullResponse.denormalized[getMatchedUri].relations.user;
                if (! Object.prototype.hasOwnProperty.call(oFullResponse.denormalized, userUri)) {
                    return;
                }
                var userData = oFullResponse.denormalized[userUri].data;
                var avPicUrl = userData.thumbnail_url;
                matchData.match_uri = match_uri;
                matchData.avatarname = userData.username;
                matchData.avpic_url = (avPicUrl.indexOf('/') === 0) ? 
                    'http:' + avPicUrl : 
                    avPicUrl;
                matchData.is_vip = userData.is_vip;
                matchData.is_ap = userData.is_ap;
                matchData.online = userData.online;
                parsedResponse.matches.push(matchData);
                parsedResponse.total_results++;
            }
        });
        return parsedResponse;
    }

    return ds;
};

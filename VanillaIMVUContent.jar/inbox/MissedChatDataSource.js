
IMVU.MissedChatDataSource = function(url, params, net, imvu) {
    var ds = new IMVU.DataSource(url, params, net, imvu);
    ds.responseType = YAHOO.util.DataSource.TYPE_JSON;

    ds.responseSchema = {
        resultsList: 'result',
        metaFields: {totalRows: 'total_results', rowsPerPage: 'results_per_page'}
    };
    
    return ds;
};

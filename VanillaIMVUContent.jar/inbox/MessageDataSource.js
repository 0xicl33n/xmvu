
IMVU.MessageDataSource = function(url, params, net, imvu) {
    var ds = new IMVU.DataSource(url, params, net, imvu);

    ds.responseSchema = {
        resultsList: 'result',
        metaFields: {totalRows: 'total_results', rowsPerPage: 'results_per_page'}
    };
    ds.responseType = YAHOO.util.DataSource.TYPE_JSON;

    return ds;
};


/*
 * YAHOO.util.DataSource can return a number of different types,
 * so pass through, then augment the result.  This is roughly analogous
 * to subclassing.
 */
IMVU.DataSource = function(url, params, net, imvu) {
    // Temporary until all call sites pass in imvu instead of imvu.call.
    if (typeof imvu.callAsync == 'undefined') {
        imvu = {call: imvu};
    }

    params = params || {};
    params.initialLoad = false;

    if (typeof params.abortExistingRequests === 'undefined') {
        params.abortExistingRequests = false;
    }

    var ds = new YAHOO.util.DataSource(url, params);

    ds.createEvent("requestResult");

    YAHOO.lang.augmentObject(ds, {
        queryParameters: {},

        /*static*/
        handleDataReturnPayload: function(oRequest, oResponse, oPayload) {
                oPayload.totalRecords = parseInt(oResponse.meta.number_of_rooms, 10);
            return oPayload;
        },

        setQueryParameter: function(name, value) {
            // Subclasses were scrubbing out keys with falsy values once upon a time.
            // Instead, prevent them from ever being set in the first place.
            // This is somewhat test-only code, but I don't want
            // to fix all the offending tests atm.
            if (typeof value === 'undefined' || value === null) {
                if (name) {
                    delete this.queryParameters[name];
                }
                return;
            }

            this.queryParameters[name] = value;
        },

        onDataReturn: function(sRequest, oResponse, oPayload) {
            this.fireEvent('requestResult', {request:sRequest, response:oResponse, payload:oPayload});
        },

        onFailure: function (err) {
            this.fireEvent('requestResult', {error:err});
        },

        refresh: function () {
            if (params.abortExistingRequests) {
                net.abort(conn);
            }
            var oCallback = {
                success : this.onDataReturn,
                failure : this.onFailure,
                scope : this,
                argument: {}
            };

            var state = {
                pagination: {
                    recordOffset: 0
                }
            };
            var queryString = this.generateRequestArguments(state, this.table);
            this.sendRequest(queryString, oCallback);
        }
    });

    ds.generateRequestArguments = function (state, table) {
        return '?' + $.param($.extend(this.queryParameters, {cid: imvu.call('getCustomerId')}));
    };

    var conn = null;

    ds.connMgr = {
        asyncRequest: function(method, url, callback) {
            if (params.abortExistingRequests && net.isCallInProgress()) {
                net.abort(conn);
            }
            return conn = net.asyncRequest(method, url, callback, undefined);
        }
    };

    return ds;
};

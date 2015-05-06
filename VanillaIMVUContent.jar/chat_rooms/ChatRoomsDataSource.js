IMVU.ChatRoomsDataSource = function (params, net, imvuCall) {
    var url = IMVU.SERVICE_DOMAIN + '/api/rooms/rooms_list_paginated.php';
    var ds = new IMVU.DataSource(url, params, net, imvuCall);

    ds.SERVICE_URL = url;

    ds.responseSchema = {
        resultsList: 'result',
        metaFields: {
            totalRows: "number_of_rooms",
            new_enough: "is_new_enough_for_welcome_rooms",
            is_welcome_room_moderator: "is_welcome_room_moderator",
            should_hide_welcome_rooms: "should_hide_welcome_rooms",
            welcome_room_instance_ids: "welcome_room_instance_ids",
            null_search_results :"null_search_results",
            null_results_formatted :"null_results_formatted",
            should_hide_upsell_panel :"should_hide_upsell_panel",
        }
    };

    ds.doBeforeParseData = function (oRequest, oFullResponse, oCallback) {
        var keys = [
            'customers_id',
            'customers_name',
            'customers_room_id',
            'description',
            'image_url',
            'is_ap',
            'is_vip',
            'is_av',
            'max_users',
            'name',
            'num_participants',
            'language',
            'rating'
        ];

        if (oFullResponse.is_favorite) {
            keys.push('is_favorite');
        }

        if (oFullResponse.room_size){
            keys.push('room_size');
        }

        if(oFullResponse.resized_image_url) { 
            keys.push('resized_image_url');
        }

        var result = [];
        if (oFullResponse.customers_id) {
            for (var i = 0; i < oFullResponse.customers_id.length; i++) {
                var item = {};
                for (var j=0; j< keys.length; ++j) {
                    item[keys[j]] = oFullResponse[keys[j]][i];
                }
                result.push(item);
            }
        }

        var null_results = [];
        if (oFullResponse.null_search_results && oFullResponse.null_search_results.customers_id) {
            for (var i = 0; i < oFullResponse.null_search_results.customers_id.length; i++) {
                var item = {};
                for (var j=0; j< keys.length; ++j) {
                    item[keys[j]] = oFullResponse.null_search_results[keys[j]][i];
                }
                null_results.push(item);
            }
        }

        return {
            result: result,
            number_of_rooms: oFullResponse.number_of_rooms,
            rooms_per_page: oFullResponse.rooms_per_page,
            is_new_enough_for_welcome_rooms: oFullResponse.is_new_enough_for_welcome_rooms,
            is_welcome_room_moderator: oFullResponse.is_welcome_room_moderator,
            should_hide_upsell_panel: oFullResponse.should_hide_upsell_panel,
            should_hide_welcome_rooms: oFullResponse.should_hide_welcome_rooms,
            welcome_room_instance_ids: oFullResponse.welcome_room_instance_ids,
            null_search_results : oFullResponse.null_search_results,
            null_results_formatted: null_results,
        };
    }

    return ds;
}

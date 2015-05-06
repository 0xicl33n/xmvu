// Responsible for issuing add/remove requests to /api/favorite_rooms.php and
// knowing when you've hit your max allowed faves.

function RoomUtil(args) {
    this.network = args.network;
    this.imvu = args.imvu;
}

RoomUtil.prototype.post = function (data, onComplete) {
    function failed(reason) {
        onComplete({
            roomId: data.roomId,
            isFavorite: !data.makeFavorite,
            ok: false,
            reason: reason
        });
    }

    serviceRequest({
        method: 'POST',
        uri: '/api/favorite_rooms.php',
        data: {
            action: data.makeFavorite ? 'add' : 'remove',
            room_instance_id: data.roomId
        },
        callback: function(response, error) {           
            if (error) {
                if (error.error) { // <- custom error message
                    failed(error.error);
                } else { // <- otherwise use a general error message
                    failed(_T("There was a network problem."));
                }
            } else if (response.error) {
                failed(response.error);
            } else {
                onComplete({
                    roomId: data.roomId,
                    isFavorite: data.makeFavorite,
                    ok: true
                });
            }
        },
        json: true,
        network: this.network,
        imvu: this.imvu
    });
}

RoomUtil.prototype.addFavorite = function (roomId, onComplete) {
    this.post({roomId: roomId, makeFavorite: true}, onComplete);
}

RoomUtil.prototype.removeFavorite = function (roomId, onComplete) {
    this.post({roomId: roomId, makeFavorite: false}, onComplete);
}
        
RoomUtil.prototype.getFriendlyErrorDialogMessage = function (errorMsgFromServer) {
    var title = 'We are sorry',
        message = errorMsgFromServer;

    if (errorMsgFromServer.search(/You already have/) != -1) {
        title = _T('Please Try Again');
        message = errorMsgFromServer + ' ' + _T('Remove a room from your favorites before adding this one.');
    }

    return {title: title, message: message};
}
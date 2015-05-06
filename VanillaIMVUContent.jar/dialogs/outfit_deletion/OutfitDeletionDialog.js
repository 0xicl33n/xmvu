var Dom = YAHOO.util.Dom;
var Event = YAHOO.util.Event;

function createOutfitDeletionDialog(spec) {
    var rootElement = spec.rootElement || rootElementRequired;
    var imvu = spec.imvu || imvuRequired;
    var network = spec.network || networkRequired;
    var info = spec.info || infoRequired;
    var outfitId = info.outfitId || outfitIdRequired;

    function cancel() {
        if ($(btnCancel).hasClass('hidden')) {
            return;
        }

        imvu.call('cancelDialog');
    }

    function deleteOutfit() {
        if ($(btnOK).hasClass('hidden')) {
            return;
        }

        $(rootElement).addClass('in_progress');
        $(btnCancel).addClass('hidden');
        $(btnOK).addClass('hidden');
        serviceRequest({
            network: network,
            imvu: imvu,
            method: 'POST',
            uri: '/api/outfits.php',
            data: {'delete_outfit_id': outfitId},
            callback: function (response, error) {
                if (error) {
                    imvu.call('endDialog', {deleted: false});
                } else {
                    imvu.call('endDialog', {deleted: true});
                }
            }
        });
    }

    var btnCancel = rootElement.querySelector('#btn_cancel');
    new CancelButton(btnCancel, {callback: cancel});
    onEscKeypress(function() {
        imvu.call('cancelDialog');
    }.bind(this));
    var btnOK = rootElement.querySelector('#btn_ok');
    new ImvuButton('#btn_ok', {callback: deleteOutfit});

    imvu.call('resize', 452, document.body.offsetHeight);

    return {
        btnCancel: btnCancel,
        btnOK: btnOK
    };
}

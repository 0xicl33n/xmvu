function createUpdateClientDialog(initialInfo, imvu) {
    function submitUpdateNow() {
        imvu.call('endDialog', 'UPDATE');
    }

    function submitUpdateLater() {
        imvu.call('endDialog', 'EXIT');
    }

    function cancelDialog() {
        imvu.call('endDialog', null);
    }
    onEscKeypress(function() {
        imvu.call('cancelDialog');
    }.bind(this));
    $('#submitUpdateLater').toggleClass('hidden', Boolean(initialInfo.required));
    $('#submitUpdateExit').toggleClass('hidden', !initialInfo.required);

    $('.text-title').toggleClass('hidden', Boolean(initialInfo.required));
    $('.required-title').toggleClass('hidden', !initialInfo.required);

    var notes = initialInfo.releaseNotes;
    notes = notes.replace(/\n/g, '<br>');
    notes = notes.replace(/\\'/g, "'"); // Emacs's syntax highlighter sure is buggy! "

    releaseNotesEl = document.getElementById('text-releaseNotes');
    releaseNotesEl.innerHTML = notes;
    IMVU.Client.util.turnLinksIntoLaunchUrls(releaseNotesEl, imvu);

    new ImvuButton('#submitUpdateNow', {callback:submitUpdateNow});
    new ImvuButton('#submitUpdateLater', {callback:submitUpdateLater, grey:true});
    new ImvuButton('#submitUpdateExit', {callback:submitUpdateLater, grey:true});
}

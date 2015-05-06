function NotificationManager($dropdowns, $dialogs) {
    this.$dropdowns = $dropdowns;
    this.$dialogs = $dialogs;
}

NotificationManager.prototype.showDropDown = function(contents, duration) {
    var elt = $('<div>');
    elt.html(contents);
    elt.addClass('dropdown');
    elt.hide();
    this.$dropdowns.append(elt);
    elt.show(500).delay(1000 * duration).hide(500, function() {
        elt.remove();
    });
};

NotificationManager.prototype.showDialog = function(contents, duration) {
    var elt = $('<div>').html(contents);
    elt.addClass('dialog');
    elt.hide();
    this.$dialogs.append(elt);
    elt.fadeIn(500).delay(1000 * duration).fadeOut(500, function() {
        elt.remove();
    });
}

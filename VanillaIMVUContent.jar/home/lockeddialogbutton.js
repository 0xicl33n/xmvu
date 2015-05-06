function LockedDialogButton(args) {
    this.__showDialog = args.showDialog
    this.init(args);
}

$.extend(LockedDialogButton.prototype, ModeButton.prototype, {
    customOnClick: function() {
        this.imvu.call(this.__showDialog);
        return false;
    },
});
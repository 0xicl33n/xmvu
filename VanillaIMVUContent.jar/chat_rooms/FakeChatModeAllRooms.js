function FakeChatModeAllRooms(args) {
    this.args = args;
}

FakeChatModeAllRooms.prototype.onActivate = function(tabName) { 
    this.tabName = tabName;
    this._activateCalled = true;
}
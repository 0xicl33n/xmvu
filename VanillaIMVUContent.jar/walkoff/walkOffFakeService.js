function WalkOffFakeService(network) {
    FakeObject.call(this, [
            'attachToGame',
            'connect',
            'disconnect',
            'sendMessage'
    ]);

    this._calls.push(['__constructor__', _.toArray(arguments)]);

    this.inviteeCid = null;
    this.inviterCid = null;
    
    this.network = network;
}

WalkOffFakeService.prototype = _.extend(new FakeObject(), {
    getInviteeCid: function() {
        return this.inviteeCid;
    },
    
    getInviterCid: function() {
        return this.inviterCid;
    }
});


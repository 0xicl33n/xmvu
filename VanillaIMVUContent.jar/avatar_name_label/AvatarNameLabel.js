function AvatarNameLabel(imvu, eventBus) {
    var ns = 'http://www.w3.org/2000/svg';

    this.imvu = imvu;

    this.$myname = $('#thename');
    this.$info = $("#info");

    eventBus.register('onAvatarHighlight', this.changeNameHighlightStatus.bind(this), 'AvatarWindow');

    this.$myname.click(this.showAvatarMenu.bind(this));
    this.$info.click(this.showAvatarCard.bind(this));
    $('#nameLabel').bind({
        mousemove: this.highlightMyAvatar.bind(this)
    });

    this.$info.css('opacity', 1.0 / 255.0);
}

AvatarNameLabel.prototype.showAvatarMenu = function(evt) {
    if (!this.cid) {
        return;
    }
    this.imvu.call('showAvatarMenu', this.cid, evt.clientX, evt.clientY);
};
    
AvatarNameLabel.prototype.showAvatarCard = function(evt) {
    if (!this.cid) {
        return;
    }
    this.imvu.call('showAvatarCard', this.cid, {});
};

AvatarNameLabel.prototype.setInfo = function(newCid, name, r,g,b) {
    this.cid = newCid;
    this.$myname.html(name);
    this.imvu.call('resizeOverlay', $('#nameLabel').outerWidth() + 1, $('#nameLabel').outerHeight() + 1);
    this.$myname.css('color', 'rgb('+r+','+g+','+b+')');
    this.$info.css('background-color', 'rgb('+r+','+g+','+b+')');
    this.storedR = r;
    this.storedG = g;
    this.storedB = b;
};
    
AvatarNameLabel.prototype.highlightMyAvatar = function() {
    this.imvu.call('highlightMyAvatar');
}
    
AvatarNameLabel.prototype.changeNameHighlightStatus = function(n, info) {
    if (info.cid === this.cid) {
        var r = Math.round(this.storedR*4/5);
        var g = Math.round(this.storedG*4/5);
        var b = Math.round(this.storedB*4/5);
        this.$myname.css('color', 'rgb('+r+','+g+','+b+')');
        this.$info.css('opacity', 1.0);
    } else {
        this.$myname.css('color', 'rgb('+this.storedR+','+this.storedG+','+this.storedB+')');
        this.$info.css('opacity', 1.0 / 255.0);
    }
}

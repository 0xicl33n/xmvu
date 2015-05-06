
function ActionBar(el) {
    this.el = el;
    this.selectEvents = {
        all: new YAHOO.util.CustomEvent('select-all', this),
        none: new YAHOO.util.CustomEvent('select-none', this),
    };
    this.buttonEvents = {};

    var $selectAll = this.el.querySelector('.select-all');
    YAHOO.util.Event.addListener($selectAll, 'click', this.selectAll, this, true);

    var $selectNone = this.el.querySelector('.select-none');
    YAHOO.util.Event.addListener($selectNone, 'click', this.selectNone, this, true);
}

ActionBar.prototype = {
    selectAll: function(evt) {
        this.selectEvents.all.fire();
    },

    selectNone: function(evt) {
        this.selectEvents.none.fire();
    },

    addButton: function(id, name) {
        var buttonsHolder = this.el.querySelector('.buttons');
        var newButton = document.createElement('div');
        newButton.innerHTML = name;
        $(newButton).addClass('button');
        newButton.setAttribute('id', 'btn_'+ id);
        buttonsHolder.appendChild(newButton);
        var evt = new YAHOO.util.CustomEvent(id, this);
        this.buttonEvents[id] = evt;
        YAHOO.util.Event.addListener(newButton, 'click', evt.fire, evt, true);
        return newButton;
    }
};

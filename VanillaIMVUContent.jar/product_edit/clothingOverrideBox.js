function ClothingOverrideBox(el, n) {
    this.elBox = el;
    this.index = n;
    this.elCheckBox = el.querySelector('input');
    $(this.elCheckBox).change(this.onClickCheckBox.bind(this, true));
    YAHOO.util.Event.on(this.elBox, 'mouseover', this.onHover.bind(this, true));
    YAHOO.util.Event.on(this.elBox, 'mouseout', this.onHover.bind(this, false));
    this.userEventListeners = [];
}

ClothingOverrideBox.addClothingOverrideBox = function(el, n) {
    row = ClothingOverrideBox.getRow(el);
    box = document.createElement('td');
    $(box).addClass('clothingOverrideBox');
    row.appendChild(box);
    box.innerHTML = "<div class='label'>" + n + "</div><input id='configClothingOverrideEnabled" + n + "' type='checkbox'/>";
    return new ClothingOverrideBox(box, n);
}

ClothingOverrideBox.prototype.onClickCheckBox = function(byUser) {
    $(this.elBox).toggleClass('checked', !!this.elCheckBox.checked);
    if (byUser) {
        for each(var listener in this.userEventListeners) {
            if (listener !== null) {
                listener(this.index, this.elCheckBox.checked);
            }
        }
    }
}

ClothingOverrideBox.prototype.onHover = function(hoverIn, evt) {
    if (hoverIn) {
        // We color the box as if checked when the mouse hovers over it -- note that hoverIn can
        // mean the mouse is coming from the inner checkbox into the box itself, and we don't want 
        // the box flashing check-colored when the user has just unchecked it, so we don't do
        // the flash if relatedTarget (which tells where we are hovering in from) is the check-box
        // itself (an INPUT field) -- finally, evt.relatedTarget can sometimes be undefined, so we 
        // need to be careful using it.
        if (!this.elCheckBox.checked && (!evt.relatedTarget || evt.relatedTarget.tagName != 'INPUT')) {
            $(this.elBox).addClass('checked');
        }
    } else {
        if (!this.elCheckBox.checked) {
            $(this.elBox).removeClass('checked');
        }
    }
}

ClothingOverrideBox.prototype.setChecked = function(checked) {
    this.elCheckBox.checked = checked;
    this.onClickCheckBox(false);
}

ClothingOverrideBox.prototype.enable = function(enabled) {
    this.elCheckBox.disabled = !enabled;
}

ClothingOverrideBox.prototype.addUserEventListener = function(listener) {
    this.userEventListeners.push(listener);
}

ClothingOverrideBox.getRow = function(el) {
    var table = YAHOO.util.Dom.getChildrenBy(el, function(el) { return el.tagName == 'TABLE'; });
    if (table.length == 0) {
        table = document.createElement('table');
        el.appendChild(table);
    }
    else
        table = table[0];
    var row = YAHOO.util.Dom.getChildrenBy(table, function(el) { return el.tagName == 'TR'; });
    if (row.length == 0) {
        row = document.createElement('tr');
        table.appendChild(row);
    }
    else
        row = row[0];
    return row;
}

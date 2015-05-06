function DictTreeView(args) {
    this.imvu = args.imvu;
    this.dict = args.dict;
    this.table = args.el;
    this.currentlySelected = null;
    this.indentAmount = 16;
    this.selectListeners = [];
    this.disableListeners = 0;
    $(this.table).children().remove();
    this.topRows = this._mergeDict(null, [], [], this.dict, 0);
}

DictTreeView.prototype.reloadDict = function(dict) {
    this.disableListeners ++;
    this.topRows = this._mergeDict(null, this.topRows, [], dict, 0);
    this.disableListeners --;
    if (this.currentlySelected) {
        this.fireSelectListeners(this.currentlySelected.getFullKey().slice(),
                this.currentlySelected.querySelector('.dict') !== null);
    } else {
        this.fireSelectListeners(null, true);
    }
}

DictTreeView.prototype.createRow = function(level, fullKey, value) {
    var row = document.createElement("tr");
    var subRows = [];
    var key = '';
    if (fullKey && typeof(fullKey) == 'object' && fullKey.length > 0) {
        key = fullKey[fullKey.length - 1];
    }

    var keyField = row.appendChild(document.createElement("td"));
    keyField.innerHTML =
        "<div class='keyField'>" +
            "<div class='indent' style='width:"+(level*this.indentAmount)+"px'></div>" +
            "<div class='dictToggle'></div>" +
            "<span class='label'>"+key+"</span>" +
        "</div>";

    var valueField = row.appendChild(document.createElement("td"));
    $(valueField).addClass('valueField');
    valueField.innerHTML = ''+value;

    row.getValue = function() { return value; };
    row.getFullKey = function() { return fullKey; };
    row.getKey = function() { return key; };

    row.showAsKey = function() {
        $(keyField).addClass('dict');
        valueField.innerHTML = '';
    };

    row.showAsScalar = function(newValue) {
        value = newValue;
        $(keyField).removeClass('dict');
        valueField.innerHTML = ''+value;
    };

    row.setSubRows = function(newSubRows) {
        subRows = newSubRows;
    };

    row.getSubRows = function() {
        return subRows;
    };

    row.isSelected = function() {
        return $(row).hasClass('selected');
    };

    row.hasSelectedSubRow = function() {
        for each (var subRow in subRows) {
            if (subRow.isSelected() || subRow.hasSelectedSubRow())
                return true;
        }
        return false;
    };

    row.select = function(select) {
        $(row).toggleClass('selected', !!select);
    };

    row.isCollapsed = function() {
        return $(row).hasClass('collapsed');
    };

    row.collapse = function(collapse) {
        $(row).toggleClass('collapsed', !!collapse);
        row.setVisibility();
    };

    row.setVisibility = function() {
        var hidden = false;
        if($(row).hasClass('collapsed') || $(row).hasClass('hidden')) {
            hidden = true;
        }
        $(subRows).toggleClass('hidden', !!hidden);
        for each(var subRow in subRows) {
            subRow.setVisibility();
        }
    };
    return row;
}

DictTreeView.prototype.removeSubRows = function(row) {
    for each (var subRow in row.getSubRows()) {
        this.removeSubRows(subRow);
        this.table.removeChild(subRow);
    }
}

DictTreeView.prototype._mergeDict = function(row, subRows, fullKey, value, level) {
    var rowCursor = row;
    if (typeof(value) == 'object') {
        if (row) {
            row.showAsKey();
        }
        var keys = [];
        for(var k in value) {
            keys.push(k);
        }
        var rowDict = {};
        for each (var r in subRows) {
            k = r.getKey();
            rowDict[k] = r;
            if (keys.indexOf(k)<0) {
                keys.push(k);
            }
        }
        var caseInsensitiveSortFunction = function(a, b) {
            var aNoCase = a.toLowerCase();
            var bNoCase = b.toLowerCase();
            if (aNoCase < bNoCase) {
                return -1;
            } else if (aNoCase > bNoCase) {
                return 1;
            } else {
                return 0;
            }
        }
        keys.sort(caseInsensitiveSortFunction);
        var childRows = [];
        for (var i = 0; i < keys.length; i++) {
            k = keys[i];
            var newFullKey = fullKey.slice(0);
            newFullKey.push(k);
            if (k in rowDict) {
                if (k in value) {
                    childRows.push(rowDict[k]);
                    var newSubRows = rowDict[k].getSubRows();
                    rowCursor = this._mergeDict(rowDict[k], newSubRows, newFullKey, value[k], level+1);
                } else {
                    var select = rowDict[k].isSelected() || rowDict[k].hasSelectedSubRow();
                    this.removeSubRows(rowDict[k]);
                    this.table.removeChild(rowDict[k]);
                    if (select) {
                        if (rowCursor) {
                            this.selectRow(rowCursor.nextSibling || rowCursor);
                        } else {
                            this.selectRow(null);
                        }
                    }
                }
            } else {
                var newRow = this.createRow(level, newFullKey, value[k]);
                childRows.push(newRow);
                if (rowCursor == null) {
                    this.table.insertBefore(newRow, this.table.firstChild);
                } else {
                    this.table.insertBefore(newRow, rowCursor.nextSibling);
                }
                rowCursor = this._mergeDict(newRow, [], newFullKey, value[k], level+1);
                $(newRow).click(this.onClickRow.bind(this));
                $(newRow).find('.dictToggle').click(this.onClickToggle.bind(this));
            }
        }
        if (row) {
            row.setVisibility();
            row.setSubRows(childRows);
        }
    } else {
        if (row) {
            row.showAsScalar(value);
        }
        var selectAfterDelete = row.hasSelectedSubRow();
        this.removeSubRows(row);
        if (selectAfterDelete) {
            this.selectRow(row);
        }
    }
    if (row) {
        return rowCursor;
    } else {
        return childRows;
    }
}

DictTreeView.prototype.onClickToggle = function(evt) {
    var row = evt.currentTarget.parentNode.parentNode.parentNode;
    if (row.querySelector('.dict') == null) {
        return;
    }
    if(row.isCollapsed()) {
        row.collapse(false);
    } else {
        row.collapse(true);
        if (row.hasSelectedSubRow()) {
            this.selectRow(row);
        }
    }
    return false;
};

DictTreeView.prototype.onClickRow = function(evt) {
    var row = evt.currentTarget;
    if (row.isSelected()) {
        this.selectRow(null);
    } else {
        this.selectRow(row);
    }
};

DictTreeView.prototype.selectRow = function(row) {
    if (this.currentlySelected != row) {
        if (this.currentlySelected) {
            this.currentlySelected.select(false);
            this.currentlySelected = null;
        }
        if (row) {
            row.select(true);
            this.currentlySelected = row;
            if (this.disableListeners == 0) {
                this.fireSelectListeners(row.getFullKey(), row.querySelector('.dict') !== null);
            }
        } else {
            if (this.disableListeners == 0) {
                this.fireSelectListeners(null, true);
            }
        }
    }
}

DictTreeView.prototype.addSelectListener = function(listener) {
    this.selectListeners.push(listener);
}

DictTreeView.prototype.removeSelectListener = function(listener) {
    for (var i = this.selectListeners.length - 1; i >= 0; i--) {
        if (this.selectListeners[i] == listener) {
            this.selectListeners.splice(i, 1);
        }
    }
}

DictTreeView.prototype.fireSelectListeners = function(fullKey, valueIsDict) {
    for (var i = 0; i < this.selectListeners.length; i ++) {
        this.selectListeners[i](fullKey, valueIsDict);
    }
}
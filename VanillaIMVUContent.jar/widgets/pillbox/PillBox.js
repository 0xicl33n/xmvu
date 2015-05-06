
IMVU.Client.widget.PillBox = function(element, config) {
    if (! config) {
        config = {};
    }
    
    if (config.max_items) {
        this.max_items = config.max_items;
    } else {
        this.max_items = -1;
    }
    
    this.element = $(element)[0];
    this.$input = $('<input type="text"/>');
    this.element.appendChild(this.$input[0]);
    this.element.className = "pillbox";
    
    this.items = [];
    this.itemsByName = {};
    
    $(this.element).click(this.focusInput.bind(this));
    
    this.focusTimeout = null;

    this.$input
        .keydown(this.pressKey.bind(this))
        .focus(this.clearTimeout.bind(this))
        .blur(function() {
            this.clearTimeout();
            this.focusTimeout = setTimeout(function() {
                if (this.$input.val()) {
                    this.addItem(this.$input.val(), null, null);
                }
            }.bind(this), 1500);
        }.bind(this));
    
    this.lastAddedItem = null;
};

IMVU.Client.widget.PillBox.prototype = {

    subscribe: function (type, fn) {
        $(this.element).bind(type, fn);
    },

    clearTimeout : function() {
        if (this.focusTimeout) {
            clearTimeout(this.focusTimeout);
            this.focusTimeout = null;
        }
    },

    addItem : function(text, value, type) {
        var item = new IMVU.Client.widget.PillBoxItem(text, value, type);
        this.items.push(item);
        this.itemsByName[text.toLowerCase()] = item;
        this.element.appendChild(item.$el[0]);
        item.pillbox = this;
        this.moveInputToEnd();
        this.lastAddedItem = item;
        if (this.max_items != -1 && this.items.length >= this.max_items) {
            this.$input.hide();
        }
        this.$input.val('');
        $(this.element).trigger('addItem', [item]);
        return item;
    },
    
    removeItem : function(pillBoxItem) {
        this.items.splice(this.items.indexOf(pillBoxItem), 1);
        this.moveInputToEnd();
        if (this.max_items == -1 || this.items.length < this.max_items) {
            this.$input.show();
        }
        $(this.element).trigger('removeItem', [pillBoxItem]);
    },
    
    moveInputToEnd : function() {
        this.element.appendChild(this.$input[0]);
    },
    
    focusInput : function() {
        this.$input.focus();
    },
    
    pressKey: function (event) {
        switch (event.which) {
            case 9:
                this.addItem(this.$input.val(), null, 'checking');
                break;
            case 13:
                this.addItem(this.$input.val(), null, 'checking');
                this.focusInput();
                break;
            case 32:
                this.addItem(this.$input.val(), null, 'checking');
                this.focusInput();
                return false;
        }
        return true;
    },
    
    getValidItems : function() {
        return this.items.filter(function(item) { return item.validate(); });
    }
};

IMVU.Client.widget.PillBoxItem = function(text, value, type) {
    this.$el = $('<a class="pillbox-item"/>');
    this.$el
        .append('<span class="left"/>')
        .append('<span class="icon"/>')
        .append('<span class="text"/>')
        .append('<span class="right"/>')
        .append('<span class="close"/>');
    
    this.setText(text);
    this.setType(type);
    this.setValue(value);
    
    this.$el.click(this.focusParentInput.bind(this));
    this.$el.find('.close').click(this.clickClose.bind(this));
};

IMVU.Client.widget.PillBoxItem.prototype = {
    
    removeFromParent : function() {
        this.$el.detach();
        this.pillbox.removeItem(this);
    },
    
    clickClose : function() {
        this.removeFromParent();
    },
    
    focusParentInput : function() {
        this.pillbox.focusInput();
    },
    
    setValue : function(value) {
        this.value = value;
        this.$el.attr('value', value);
    },
    
    setText : function(text) {
        this.text = text;
        this.$el.find('.text').html(text);
    },
    
    setType : function(type) {
        this.type = type;
        this.$el.attr('class', 'pillbox-item ' + type);
    },
    
    validate : function() {
        return (this.type != "notfound");
    }
    
};

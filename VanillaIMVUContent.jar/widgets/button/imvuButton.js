function ImvuButton(el, args) {
    args = $.extend({enabled: true, accessory: true}, args);

    var tab = (typeof args.tabindex  == 'undefined') ? '' : ' tabindex="' + args.tabindex + '"';
    var class_name = "imvu-button";
    if(args.usenewvisdbuttons) {
        class_name += " level1";
    }
    this.usenewvisdbuttons = args.usenewvisdbuttons;
    if(args.usenewvisdbuttons) {
        if (args.grey) class_name += " dark-gray";
    } else {
        if (args.grey) class_name += " grey";
        if (args.gift) class_name += " gift";
        if (!args.enabled) class_name += " disabled";
        if (!args.accessory) class_name += " no-accessory";
        if (args.small) class_name += " small";
        var start_class = "start";
        if (args.red) start_class += " red";
    }

    this.$element = $(el);
    if(!args.usenewvisdbuttons) {
        this.$element.css({cursor: 'pointer'});
        if (this.$element.is('button')) {
            this.$element.css({border: 0, background: 0, padding: 0});
        }
    }

    this.level = args.level;
    if(args.usenewvisdbuttons) {
        this.$element.addClass(class_name);
    } else {
        if (this.level) {
            var $inner = $('<div>' + this.$element.text() + '</div>');
            $inner.css({
                'background': 'url(../../img/button_yellow_arrow_mid.png) repeat-x',
                'font-weight': 'bold',
                'height': '32px',
                'line-height': '29px',
                'margin': '0 19px 0 5px',
                'min-width': '60px',
                'padding': '0 0 0 4px',
                'text-align': 'center',
            });
            this.$element.html('').append($inner);
            this.$element.css({
                'background': [
                    'url(../../img/button_yellow_arrow_left.png) top left no-repeat,',
                    'url(../../img/button_yellow_arrow_right.png) top right no-repeat',
                ].join(''),
                'height': '32px',
            });
        } else {
            this.$element.html([
                '<div ',
                tab,
                ' class="',
                class_name,
                '">',
                '<span class="',
                start_class,
                '"></span>',
                '<span class="middle">'+
                '<span class="text">' + this.$element.text() + '</span>',
                '</span>',
                '<span class="end"></span>',
                '</div>'
            ].join(''));
        }
    }

    var self = this;
    function cb(evt) {
        if (self.enabled) {
            args.callback.apply(args.scope || evt);
        }
    }

    if (args.callback) {
        this.$element
        .unbind('click').click(cb)
        .unbind('keydown').keydown(function (e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if(code == 13) { //Enter key
                cb(e);
            }
        });
    }

    this.enabled = args.enabled;
}

ImvuButton.prototype.enable = function () {
    if (this.enabled) {
        return;
    }

    if(this.usenewvisdbuttons) {
        this.$element.prop('disabled',false);
    } else {
        this.$element.children(':first').removeClass('disabled');
        if (this.level) {
            this.$element.css({cursor: 'pointer'}).fadeTo('fast', 1);
        }
    }
    this.enabled = true;
}

ImvuButton.prototype.disable = function () {
    if (!this.enabled) {
        return;
    }

    if(this.usenewvisdbuttons) {
        this.$element.prop('disabled',true);
    } else {
        this.$element.children(':first').addClass('disabled');
        if (this.level) {
            this.$element.css({cursor: 'default'}).fadeTo('fast', 0.2);
        }
    }
    this.enabled = false;
}

ImvuButton.prototype.isEnabled = function () {
    return this.enabled;
}

function CancelButton(el, args) {
    ImvuButton.call(this, el, $.extend(args, {grey: true, red: true}));
}

CancelButton.prototype = ImvuButton.prototype;
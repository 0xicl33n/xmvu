IMVU.Client.widget.ChatModeViewWidget = function(args) {
    this.callbacks = {};

    this.imvu = args.imvu;
    this.$root = args.$root;
    this.$viewButton = args.$viewButton;
    this.setupSelectors();
}

IMVU.Client.widget.ChatModeViewWidget.prototype = {
    $: function(selector) {
        return this.$root.find(selector);
    },

    toggle: function(bool) {
        if(typeof bool == 'boolean') { 
            if(bool) { 
                this.$root.addClass('shown');
                this.$root.css('display', 'none');
                this.$root.slideDown();
            } else { 
                this.$root.slideUp();
            }
        } else { 
            if (!this.$root.hasClass('shown')) {
                this.$root.addClass('shown');
                this.$root.css('display', 'none');
            }
            this.$root.slideToggle();
        }
    },

    hideSearchOptions: function() {
        this.$('.row.language').hide();
        this.$('.row.vip').hide();
        this.$('.row.roomtype').hide();
        this.$('.row.occupancy').hide();
    },
    showSearchOptions: function() {
        this.$('.row.language').show();
        this.$('.row.vip').show();
        this.$('.row.roomtype').show();
        this.$('.row.occupancy').show();
    },

    hideFilterButton: function() {
        this.$viewButton.hide();
    },

    showFilterButton: function() {
        this.$viewButton.show();
    },

    setupSelectors: function() {
        var isAP = this.imvu.call('hasAccessPass');
        var isVIP = this.imvu.call('hasVIPPass');
        var isTeen = this.imvu.call('isTeen');

        this.$selectors = this.$(".selector");

        var languages = this.imvu.call('getSupportedLanguages') || [["English","en"], ["French","fr"]];
        languages.sort();
        languages.unshift([_T('All'), '']);
        this.$('.selector.language').append($('<div class="label"></div>'));
        this.languageDropdown = new IMVU.Client.widget.DropDown({
            rootElement: this.$('.selector.language')[0],
            items: languages,
            selectedValue: '',
            tickSize: {width: 10, height: 6},
            margin: 10,
        })
        this.$('.selector.language').change(function () {
            this.trigger("change:language", this.languageDropdown.getSelectedValue());
        }.bind(this));

        this.$('.selector.vip').append($('<div class="options"></div>'));
        var $vipOptions = this.$('.selector.vip .options');
        $vipOptions.append('<div class="option ui-event" data-ui-name="VIPAllRooms" field="vip" value="all">' + _T('All Rooms') + '</div>');
        $vipOptions.append('<div class="option ui-event" data-ui-name="VIPOnlyRooms" field="vip" value="only">' + _T('VIP Only') + '</div>');

        if (!isTeen) {
            this.$('.selector.roomtype').append($('<div class="options"></div>'));
            var $roomtypeOptions = this.$('.selector.roomtype .options');
            $roomtypeOptions.append('<div class="option ui-event" data-ui-name="RoomTypeAll" field="roomtype" value="all">' + _T('All') + '</div>');
            $roomtypeOptions.append('<div class="option ui-event" data-ui-name="RoomTypeGA" field="roomtype" value="ga">' + _T('GA') + '</div>');
            $roomtypeOptions.append('<div class="option ui-event" data-ui-name="RoomTypeAP" field="roomtype" value="ap">' + _T('AP') + '</div>');
        } else {
            this.$('.selector.roomtype').remove();
            this.$('.row.roomtype').remove();
        }

        this.$('.selector.occupancy').append($('<div class="options"></div>'));
        var $occupancyOptions = this.$('.selector.occupancy .options');
        $occupancyOptions.append('<div class="option ui-event" data-ui-name="OccupancyAll" field="occupancy" value="all">' + _T('All') + '</div>');
        $occupancyOptions.append('<div class="option ui-event" data-ui-name="Occupancy7-10" field="occupancy" value="7-10">7-10</div>');
        $occupancyOptions.append('<div class="option ui-event" data-ui-name="Occupancy4-6" field="occupancy" value="4-6">4-6</div>');
        $occupancyOptions.append('<div class="option ui-event" data-ui-name="Occupancy1-3" field="occupancy" value="1-3">1-3</div>');
        $occupancyOptions.append('<div class="option ui-event" data-ui-name="Occupancy0" field="occupancy" value="0">0</div>');

        this.$selectors.find('.option').click(this.onClickOption.bind(this));

        this.selectDefaults();

        if (!isAP) {
            this.$('.selector.roomtype').addClass('disabled');
        }
        if (!isVIP) {
            this.$('.selector.vip').addClass('disabled');
        }
    },

    getDefaults: function() { 
        return { 
            'occupancy':'all',
            'vip':'all',
            'roomtype':'all',
            'language': ''
        };
    },

    getValues: function() { 
        var values = {};
        _.each(['vip','roomtype', 'occupancy'], function(option) { 
            values[option] = this.$('.selector.'+option+' .option.selected').attr('value');
        }.bind(this));
        values['language'] = this.languageDropdown.getSelectedValue();
        return values;
    },

    isFilterAvailable: function (filter) {
        var $filter = this.$('.selector.' + filter);
        return !!($filter.length && !$filter.is('.disabled'));
    },

    isNoFilters: function () {
        var availableFilters = [],
            vals = this.getValues(),
            defs = this.getDefaults();

        _.each(_.keys(defs), function (option) {
            if (this.isFilterAvailable(option)) {
                availableFilters.push(option);
            }
        }, this);

        var isDifferent = false;
        _.each(availableFilters, function (option) {
            if (defs[option] != vals[option]) {
                isDifferent = true;
            }
        });

        return !isDifferent;
    },
    
    selectDefaults: function() {
        var defaults = this.getDefaults();
        this.setFilters(defaults);
    },

    setFilters: function(defaults) {
        this.$('.selector.occupancy .options').children().removeClass('selected');
        this.$('.selector.roomtype .options').children().removeClass('selected');
        this.$('.selector.vip .options').children().removeClass('selected');
        if (defaults.vip) {
            this.$('.selector.vip .option[value='+defaults.vip+']').addClass('selected');
        }
        if (defaults.roomtype) {
            this.$('.selector.roomtype .option[value='+defaults.roomtype+']').addClass('selected');
        }
        if (defaults.occupancy) {
            this.$('.selector.occupancy .option[value='+defaults.occupancy+']').addClass('selected');
        }
        this.languageDropdown.selectByValue(defaults.language);
    },

    onClickOption: function(e) {
        var $target = $(e.target);
        var $selector = $target.parent().parent();

        if ($target.hasClass('selected')) {
            return;
        }

        if ($selector.hasClass('disabled')) {
            if ($selector.hasClass("vip")) {
                this.imvu.call("showVipInfo");
            }
            if ($selector.hasClass("roomtype")) {
                this.imvu.call("showApInfo");
            }

            return;
        }

        $target.parent().children().removeClass('selected');
        $target.addClass('selected');

        this.trigger("change:" + $target.attr('field'), $target.attr('value'));
    },

    // kind of like backbone!
    trigger: function(eventName) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        _.each(this.callbacks[eventName], function(cb) {
            cb.apply(null, args);
        }.bind(this));
    },

    on: function(eventName, handler) {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(handler);
    },

    off: function(eventName, handler) {
        if (!handler) {
            this.callbacks[eventName] = [];
        } else {
            var i = this.callbacks[eventName].indexOf(handler);
            if (i > -1) {
                this.callbacks[eventName].splice(i, 1);
            }
        }
    }
}

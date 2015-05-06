IMVU.Client.ChatRoomSearch = function (args) {
    this.$root = $(args.root);
    this.dataSource = args.dataSource;
    this.imvu = args.imvu;
    this.eventBus = args.event_bus || IMVU.Client.EventBus;
    
    this.paginator = args.paginator || null;

    this.$topSearchHalf  = this.$root.find('.top-search-half');
    this.$bottomManagementHalf = this.$root.find('.bottom-management-half');

    this.$keywords = this.$root.find('.keywords');
    this.$keywords.bind('keypress', function (e) {
        if (e.which == 13) {
            this.search();
        }
    }.bind(this));

    this.$search = this.$root.find('.search.button');
    this.$search
    .unbind('keypress')
    .bind('keypress', function (e) {
        if (e.which == 13 || e.which == 32) {
            this.search();
        }
    }.bind(this))
    .unbind('click')
    .bind('click', function () {
        this.search();
    }.bind(this));

    this.$activeFilters = this.$root.find('.active-filters');
    this.$activeFilters.find('li').click(this.onActiveFilterClick.bind(this));
    $('#remove-all-filters').unbind('click').click(function() {
        $('.active-filters').find('li.active .remove').each(function( index ) {
            $(this).click();
        });
    });


    this.$possibleFilters = this.$root.find('.possible-filters');
    this.$possibleFilters.find('.misc a, average-user-ratings a').bind('click', function (e) {
        var $filter = $(e.target).closest('.filter');
        var offset = 0;
        if ($filter.is('.language, .occupancy, .room-type')) {
            this.numOnFilter++;
            offset = -35;
        } else {
            this.numOnMiscFilter++;
            offset = 18;
        }
        this.eventBus.fire('HintWidget.requestShiftPosition',{'deltaX': 0, 'deltaY':offset});
        this.getNumOnFilters(0);
        this.applyFilter($(e.target), true);
        this.search();
    }.bind(this));

    this.$averageUserRatings = this.$possibleFilters.find('.average-user-ratings.filter');
    this.hearts = {
        scale: {4: '.four', 3: '.three', 2: '.two', 1: '.one'},
        activeFilters: [],
        averageUserRatings: []
    };
    for (var n in this.hearts.scale) {
        this.hearts.activeFilters.push(     new IMVU.Client.widget.Hearts({root: this.$activeFilters.find(     this.hearts.scale[n] + ' .hearts'), fill: n, max: 5}));
        this.hearts.averageUserRatings.push(new IMVU.Client.widget.Hearts({root: this.$averageUserRatings.find(this.hearts.scale[n] + ' .hearts'), fill: n, max: 5}));
    }

    this.$filterMenus = [];
    this.filterMenus = [];

    var languages = this.imvu.call('getSupportedLanguages');
    languages.sort();
    languages.unshift([_T('Select a language'), 'none']);
    this.initMenuFilter('language', languages);

    var occupancies = [
        [_T('Select an occupancy'), 'none'],
        [_T('Empty Rooms'), '0'],
        [_T('1-3 People'), '1-3'],
        [_T('4-6 People'), '4-6'],
        [_T('7-9 People'), '7-9']
    ];
    this.initMenuFilter('occupancy', occupancies);

    var roomTypes = [
        [_T('Select a room type'), 'none']
    ];
    if (this.shouldSeeApGaFilters()) {
        roomTypes.push([_T('General Audiences'), 'ga']);
        roomTypes.push([_T('Access Pass'), 'ap']);
    }
    if (this.imvu.call('hasVIPPass')) {
        roomTypes.push([_T('VIP Only'), 'vip']);
    }
    this.initMenuFilter('room-type', roomTypes);
    if (roomTypes.length == 1) {
        this.$possibleFilters.find('.room-type').hide();
    }

    this.$miscFilters = this.$possibleFilters.find('.misc.filter');
    this.$myFavorites = this.$miscFilters.find('.my-favorites');
    this.$recentlyVisited = this.$miscFilters.find('.recently-visited');

    labelover(this.$keywords);
    this.numOnFilter = 0;
    this.numOnMiscFilter = 0;
    $('.filter', this.$possibleFilters).each(function (index, element) {
        var type = $(element).attr('class').replace(/ filter/, '');
        if (type != 'misc') {
            this.numOnFilter += this.initFilter(type, $(element));
        }
    }.bind(this));
    this.numOnMiscFilter += this.initFilter('recently-visited', this.$miscFilters);
    this.numOnMiscFilter += this.initFilter('my-favorites', this.$miscFilters);

    this.eventBus.register('ChatRoomSearch.initialNumOnFilter', function (eventName, data) {
    var additional_offsetY = data.additional_offsetY ? data.additional_offsetY : 0;
        this.getNumOnFilters(additional_offsetY);
    }.bind(this));
    
    this.$searchTab = this.$root.find('.tabs .search');
    this.$searchTab.bind('click', function () {
        this.$manageTab.removeClass('active');
        this.$searchTab.addClass('active');
        this.$root.find('.tabs').removeClass('lightbg');
        this.$managePanel.hide();
        this.$searchPanel.show();
        this.$root.trigger('searchTabClicked');
    }.bind(this));
    this.$manageTab = this.$root.find('.tabs .manage');
    this.$manageTab.bind('click', function () {
        this.$searchTab.removeClass('active');
        this.$manageTab.addClass('active');
        this.$root.find('.tabs').addClass('lightbg');
        this.$searchPanel.hide();
        this.$managePanel.show();
        this.$root.trigger('manageTabClicked');
    }.bind(this));

    this.$searchPanel = this.$root.find('.search-panel');
    this.$managePanel = this.$root.find('.manage-panel');

    this.$createRoomButton = this.$managePanel.find('.create-room-button');
    this.createRoomButton = new ImvuButton(this.$createRoomButton, { callback: function () {
        var height = $(window).height();
        var response = this.imvu.call('showManageRoomCard', { info: this.createRoomInfo, height: height });
        if(response) this.$root.trigger('roomCreated', response);
    }.bind(this) });

    $('.chat-room-search').toggleClass('no-ad', !this.imvu.call('showClientAds'));

    this.createRoomButton.disable();
}

IMVU.Client.ChatRoomSearch.prototype = {
    getNumOnFilters: function(additional_offsetY) {
    var offsetY = (this.numOnFilter * -35) + (this.numOnMiscFilter * 18) + additional_offsetY;
        this.imvu.call('setInitialDesiredPositionOffset', 0, offsetY);
    },

    onChangeFilter: function(event) {
        var $filter = $(event.data.filterWidget).closest('.filter');
        var offset = 0;
        if ($filter.is('.language, .occupancy, .room-type')) {
            this.numOnFilter++;
            offset = -35;
        } else {
            this.numOnMiscFilter++;
            offset = 18;
        }
        this.eventBus.fire('HintWidget.requestShiftPosition',{'deltaX': 0, 'deltaY':offset});
        this.getNumOnFilters(0);
        this.applyFilter($(event.data.filterWidget), true);
        this.search();
    },

    onActiveFilterClick: function(event) {
        var $activeFilter = $(event.target).closest('li').removeClass('active');
        var offset = 0;
        if ($activeFilter.is('.occupancy, .room-type, .language')) {
            this.numOnFilter--;
            offset = 35;
            var filterType = $activeFilter.attr('class').replace(/ ui-event/, '');
            this.filterMenus[filterType].selectByValue('none');
            this.$possibleFilters.find('.' + filterType).show();
            this.storeFilter(filterType, 'none');
        } else {
            this.numOnMiscFilter--;
            offset = -18;
            this.storeFilter($activeFilter.attr('class').replace(/misc /, '').replace(/ ui-event/, ''), '');
        }
        this.eventBus.fire('HintWidget.requestShiftPosition',{'deltaX': 0, 'deltaY':offset});
        this.getNumOnFilters(0);
        var numberOfActiveFilters = this.$activeFilters.find('.active:visible').length;
        $('#remove-all-filters').toggle(numberOfActiveFilters > 0);

        this.search();
    },

    search: function () {
        var criteria = {};
        this.$activeFilters.find('.active').each(function (index, value) {
            $.extend(criteria, $.parseJSON($(value).attr('data-criteria')));
        });

        if (this.$keywords.val()) {
            this.$keywords.val(this.$keywords.val().trim());
            criteria.search = this.$keywords.val();
        }

        // for null upsell
        criteria.null_upsell = true;

        if(this.paginator && JSON.stringify(this.dataSource.queryParameters) != JSON.stringify(criteria)) {
            this.paginator.setPage(1, true);
        }
     
        this.dataSource.queryParameters = criteria;
        this.dataSource.refresh();
    },

    searchKeywords: function () {
        this.search({search: this.$keywords.val()});
    },

    initMenuFilter: function(name, options) {
        this.$filterMenus[name] = $('#' + name + '-dropdown');
        this.filterMenus[name] = new IMVU.Client.widget.DropDown({
            rootElement: this.$filterMenus[name][0],
            items: options,
            selectedValue: 'none'
        });
        this.$filterMenus[name].change({filterWidget: this.$filterMenus[name]}, this.onChangeFilter.bind(this));
    },

    initFilter: function(name, element) {
        var value = this.imvu.call('getPref', 'roomSearchFilter.' + name);
        if ((typeof(value) != 'undefined') && (value != '') && (value != null)) {
            
            if (name == 'occupancy'){
                var legacySuffix = '-people';
                if (value.indexOf(legacySuffix) != -1){
                    value = value.substring(0, value.length - legacySuffix.length);
                    this.storeFilter(name, value);
                }
                if (value == 'empty-rooms'){
                    value = '0';
                    this.storeFilter(name, value);
                }
            }

            if (name == 'language' || name == 'occupancy' || name == 'room-type') {
                this.filterMenus[name].selectByValue(value);
                if (value != 'none') {
                    this.applyFilter(this.$filterMenus[name], false);
                    return 1;
                }
            } else {
                this.applyFilter($('.' + value, element), false);
                return 1;
            }
        }
        return 0;
    },

    applyFilter: function(item, store) {
        var filter = item.attr('class').replace(/ ui-event/, '');
        var filterClass = '.' + filter;
        var $filter = item.closest('.filter');

        if (filter == 'room-type') {
            var value = this.filterMenus[filter].getSelectedValue();
            var doesntHaveAPAndIsAPType = (value == 'access-pass' || value == 'general-audience') && !this.imvu.call('hasAccessPass');
            var doesntHaveVIPAndIsVIPType = value == 'vip-only' && !this.imvu.call('hasVIPPass');
            if (doesntHaveAPAndIsAPType || doesntHaveVIPAndIsVIPType) {
                return;
            }
        }

        if (!$filter.is('.misc')) {
            $filter.hide();
            if (store) {
                if ($filter.is('.language, .occupancy, .room-type')) {
                    this.storeFilter(filter, this.filterMenus[filter].getSelectedValue());
                } else {
                    this.storeFilter($filter.attr('class').replace(/ filter/, ''), filter);
                }
            }
        } else if (store) {
            this.storeFilter(filter, filter);
        }

        this.$activeFilters.find('.' + filter).addClass('active');
        if ($filter.is('.language, .occupancy, .room-type')) {
            var criteria = {};
            var val = this.filterMenus[filter].getSelectedValue();
            if ($filter.is('.room-type')) {
                if (val == 'ap') {
                    criteria['ap'] = 1;
                } else if (val == 'vip') {
                    criteria['vip'] = 1;
                } else if (val == 'ga') {
                    criteria['ap'] = 0;
                }
            } else {
                criteria[filter] = val;
            }
            this.$activeFilters.find(filterClass).attr('data-criteria', JSON.stringify(criteria));
            this.$activeFilters.find(filterClass + ' .name').text(this.filterMenus[filter].getSelectedLabel());
        }
    },

    storeFilter: function(name, value) {
        this.imvu.call('setPref', 'roomSearchFilter.' + name, value);
    },

    shouldSeeApGaFilters: function() {
        return this.imvu.call('hasAccessPass') && !this.imvu.call('isTeen');
    }
}

EXAMPLE_CHAT_ROOM_SEARCH_RESULT = {
    customers_id: [55737427],
    customers_name: ["romeoness1"],
    customers_room_id: ["9"],
    max_users: [8],
    is_ap: [0],
    is_vip: [0],
    is_av: [0],
    is_favorite: [1],
    num_participants: [5],
    participants: [[75138205,75265059,73340197,75198138,64466049,74627049,74743988,75265349]],
    image_url: ["http:\/\/userimages.imvu.com\/userdata\/55\/73\/74\/27\/userpics\/Snap_21384979214c589e0a31a33.jpg"],
    description: ["well this is the future"],
    name: ["futurama"],
    language: ["es"],
    rating: 0,
    number_of_rooms: "245384",
    rooms_per_page: 20,
    null_search_results: null
}

function ThumbnailView(id, dataSource, imvu) {
    this.imvu = imvu;
    this.dataSource = dataSource;

    this.el = document.getElementById(id);

    dataSource.responseSchema = {
        resultsList:'result',
        fields: ['customers_id', 'gender', 'avatarname', 'online', 'avpic_url', 'age', 'has_ap', 'has_vip','has_mp'],
        metaFields: {totalRows: 'total_results', rowsPerPage: 'results_per_page'}
    };

    this.dataSource.subscribe('requestResult', this.handleRequestResult.bind(this));
    this.dataSource.subscribe('requestEvent', this.displayLoading.bind(this));
}

ThumbnailView.prototype = {
    handleRequestResult: function(args) {
        IMVU.Client.EventBus.fire('FindPeopleMode.ReloadAd',{});

        if ('error' in args) {
            this.imvu.call('showErrorDialog', _T("Please Try Again"), _T("There was a problem getting your results"));

        } else if (args.response.results.length === 0) {
            this.displayError('<h1>'+_T("No results were found.")+'</h1>'+_T("Please adjust your filters and try again."));

        } else {
            return this.loadData(args.request, args.response, args.payload);
        }
    },

    loadData: function(request, parsedResponse, payload) {
        this.el.innerHTML = '';
        for (var i = 0; i < parsedResponse.results.length; i++) {
            var c = parsedResponse.results[i];
            var cell = document.createElement('div');
            $(cell).addClass('cell');

            if (c.online) {
                $(cell).addClass('online-user');
            }
            if (c.gender == 'f') {
                $(cell).addClass('female');
            }
            if (c.has_ap && !this.imvu.call("isTeen")) {
                $(cell).addClass('has-ap');
            }
            if (c.has_vip) {
                $(cell).addClass('has-vip');
            }
            if (c.has_mp) {
                $(cell).addClass('has-mp');
            }

            var name = c.avatarname.replace(/^(Guest_)/, '<span class="guest-prefix">$1</span>');

            cell.innerHTML = [
                '<div class="avatar-pic-background"><img class="avatar-pic" src="' + c.avpic_url + '" /></div>',
                '<div class="avatar-name">' + name + '</div>',
                '<div class="online-icon"></div>',
                '<div class="info-icon"></div>',
                '<div class="icons">',
                '<div class="avatar-age">' + c.age + '</div>',
                '<div class="ap-icon"></div>',
                '<div class="vip-icon"></div>',
                '<div class="mp-icon"></div>',
                '</div>'
            ].join('');

            YAHOO.util.Event.addListener(cell, 'click', this.onClickCell.bind(this, c.customers_id));
            YAHOO.util.Event.addListener(cell, 'mouseenter', this.onMouseoverCell.bind(this, cell));
            YAHOO.util.Event.addListener(cell, 'mouseleave', this.onMouseoutCell.bind(this, cell));

            this.el.appendChild(cell);
        }
    },
    
    displayLoading: function() {
        var mask = document.createElement('div');
        mask.id = 'loading-mask';
        var spinner = document.createElement('div');
        spinner.id = 'loading-spinner';
        mask.appendChild(spinner);
        this.el.appendChild(mask);
    },
    
    displayError: function(message) {
        var div = document.createElement('div');
        div.className = 'error';
        div.innerHTML = message;
        this.el.innerHTML = '';
        this.el.appendChild(div);
    },
    
    onClickCell: function(customers_id, evt) {
        IMVU.Client.EventBus.fire('FindPeopleMode.ReloadAd',{});
        this.imvu.call('showAvatarCard', customers_id, {});
    },

    onMouseoverCell: function(cell, evt) {
        $(cell).addClass('mouseover');
    },

    onMouseoutCell: function(cell, e) {
        $(cell).removeClass('mouseover');
    }
};

function fakeCustomer(id, name, otherstuff) {
    var c = {
        customers_id:id,
        avatarname:name,
        avpic_url:'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/5156453_20201454684824da03d7aa6.jpg',
        age: 99,
        online: false,
        gender: 'male',
        has_ap: true,
        has_vip: false
    };

    for (var k in otherstuff) {
        if (otherstuff.hasOwnProperty(k)) {
            c[k] = otherstuff[k];
        }
    }
    return c;
}

var TEST_DATA = [
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'}),
    fakeCustomer(35, 'Eric'),
    fakeCustomer(39, 'IMVU Inc', {age:5, gender:'f', online:true, has_vip:true}),
    fakeCustomer(116901, 'Chad', {age:12, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/116901_31153359146d85f345a6f3.jpg'}),
    fakeCustomer(116902, 'Guest_Marcus', {age:22, online:true, avpic_url: 'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/31714_2137032929497938cef398b.gif'})
];

function createDataSource(net, imvu) {
    var dataSource;
    if (!IMVU.SERVICE_DOMAIN) {
        dataSource = new IMVU.DataSource(TEST_DATA, {}, net, imvu);
    } else {
        dataSource = new IMVU.DataSource(IMVU.SERVICE_DOMAIN + '/api/find_people.php', {}, net, imvu);
        dataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
    }
    return dataSource;
}

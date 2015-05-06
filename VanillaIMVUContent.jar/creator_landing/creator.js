function CreatorMode(args) {
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.network = args.network;
    this.$main = $('#main');
    this.productInfos = {};
    
    this.$recentProjects = $('#recent-projects');
    this.$recentProjectsHeader = $('#recent-projects thead');
    this.$recentFilesBody = $('#recent-files .recent-files-body');

    this.numRecentProject = 0;
    window.onresize = this.sizeRecentFilesTable.bind(this);

    this.buildVectorIcons();

    $('#derive').click(function () { this.imvu.call('showDeriveDialog'); }.bind(this));
    $('#open').click(function () { this.imvu.call('showOpenDialog'); }.bind(this));
    $('#edit').click(function () { this.imvu.call('showEditDialog'); }.bind(this));
    $('#welcome .toggler').click(this.toggleWelcomePanel.bind(this));
    
    this.setWelcomePanelAppropriately();
    
    IMVU.Client.util.turnLinksIntoLaunchUrls('#tools', this.imvu, ['$CID', this.imvu.call('getCustomerId')]);
    IMVU.Client.util.turnLinksIntoLaunchUrls('#welcome', this.imvu, ['$CID', this.imvu.call('getCustomerId')]);
    
    $('#levelnum').text(this.imvu.call('getCreatorTier'));
    
    var creditBalance    = this.imvu.call('getCreditBalance');
    var promoBalance     = this.imvu.call('getPromoBalance');
    var devtokenBalance  = this.imvu.call('getDevtokenBalance');
    this.handleNewCreditBalance('updateCreditBalances', { credits: creditBalance, predits: promoBalance, devtokens: devtokenBalance });
    this.eventBus.register('updateCreditBalances', this.handleNewCreditBalance);

    this.$recentProjects.hide();
    var hotkeySpecs = [
        {hotkeys:['shift-ctrl-d', 'ctrl-d'], fn:function(){ this.imvu.call('showDeriveDialog'); }.bind(this)},
        {hotkeys:['shift-ctrl-o', 'ctrl-o'], fn:function(){ this.imvu.call('showOpenDialog'); }.bind(this)},
        {hotkeys:['shift-ctrl-e', 'ctrl-e'], fn:function(){ this.imvu.call('showEditDialog'); }.bind(this)},
    ];
    bindHotkeys(document, hotkeySpecs);

    this.$news = $('#news');
    this.$feed = $('#news .feed');
    $('.toggler', this.$news).click(this.toggleNewsPanel.bind(this));
    if (!this.imvu.call('shouldNewsPanelBeOpen')) {
        this.$news.addClass('collapsed');
        this.sizeRecentFilesTable();
    }
    this.refreshNews();
}

CreatorMode.prototype.buildVectorIcons = function () {
    var deriveIconPaper = Raphael($('#derive .icon')[0], 18, 18);
    var deriveIcon = deriveIconPaper.path("M11.354,6.832L9.962,8.224c0.304,0.101,0.588,0.259,0.821,0.492c0.858,0.86,0.858,2.259,0,3.119l-2.621,2.623 c-0.418,0.417-0.973,0.646-1.561,0.646c-0.59,0-1.144-0.229-1.56-0.646c-0.86-0.859-0.86-2.259,0-3.119L5.98,10.4 C5.662,9.442,5.639,8.627,5.702,8.052l-1.973,1.975c-1.583,1.583-1.583,4.16,0,5.744c0.768,0.768,1.787,1.189,2.872,1.189 c1.084,0,2.104-0.422,2.872-1.189l2.623-2.623c1.582-1.584,1.582-4.16,0-5.744C11.871,7.179,11.618,6.995,11.354,6.832z M16.271,3.229c-0.767-0.767-1.787-1.189-2.873-1.189c-1.085,0-2.104,0.423-2.872,1.189L7.903,5.852 c-1.583,1.584-1.583,4.16,0,5.745c0.199,0.199,0.422,0.364,0.653,0.513l1.373-1.373c-0.261-0.106-0.508-0.246-0.714-0.452 c-0.859-0.86-0.859-2.26,0-3.119l2.622-2.623c0.835-0.834,2.286-0.833,3.12,0c0.858,0.859,0.858,2.259,0,3.118L14.101,8.52 c0.226,0.268,0.667,0.97,0.43,2.194l1.74-1.74C17.854,7.389,17.854,4.813,16.271,3.229z");
    deriveIcon.attr({fill: '#000', stroke: 'transparent'});

    var openIconPaper = Raphael($('#open .icon')[0], 18, 18);
    var openIcon = openIconPaper.path("M15.83,2.988H5.156c-0.645,0-1.169,0.523-1.169,1.169v11.697c0,0.646,0.524,1.17,1.169,1.17H15.83 c0.647,0,1.171-0.523,1.171-1.17V4.157C17.001,3.512,16.478,2.988,15.83,2.988 M10.502,14.101L7,10h2V6h3v4h2L10.502,14.101z");
    openIcon.attr({fill: '#000', stroke: 'transparent'});

    var editIconPaper = Raphael($('#edit .icon')[0], 18, 20);
    var editIcon = editIconPaper.path("M3,13v4h4l0.646-0.646l-4-4L3,13z M13,3L9.854,6.146l4,4L17,7L13,3z M4.354,11.646l4,4l4.793-4.793l-4-4L4.354,11.646z");
    editIcon.attr({fill: '#000', 'fill-rule': 'evenodd', stroke: 'transparent'});
}

CreatorMode.prototype.handleNewCreditBalance = function (eventName, data) {
    $('#credits').text(IMVU.Client.util.number_format(data.credits));
    $('#predits').text(IMVU.Client.util.number_format(data.predits));
    $('#devtokens').text(IMVU.Client.util.number_format(data.devtokens));
}

CreatorMode.prototype.refreshNews = function () {
    serviceRequest({
        method: 'GET',
        uri: IMVU.SERVICE_DOMAIN + '/api/creator_news.php',
        network: this.network,
        imvu: this.imvu,
        callback: function (response, error) {
            if (error) {
                return;
            }

            var post = response.result[0];
            this.$feed.html([
                '<div class="post">',
                '<div class="title">' + post.title + '</div>',
                '<p class="content">' + post.content + '</p>',
                '</div>'
            ].join(''));
            IMVU.Client.util.turnLinksIntoLaunchUrls(this.$feed[0], this.imvu);
        }.bind(this)
    });
}

CreatorMode.prototype.setWelcomePanelAppropriately = function() {
    this.$main.toggleClass('welcoming', this.imvu.call('shouldWelcomePanelBeOpen'));
}

CreatorMode.prototype.toggleWelcomePanel = function() {
    this.$main.toggleClass('welcoming');
    this.imvu.call('setWelcomePanelOpen', this.$main.hasClass('welcoming'));
    this.sizeRecentFilesTable();
}

CreatorMode.prototype.toggleNewsPanel = function () {
    this.$news.toggleClass('collapsed');
    this.imvu.call('setNewsPanelOpen', !this.$news.hasClass('collapsed'));
    this.sizeRecentFilesTable();
}

CreatorMode.prototype.editProject = function(row) {
    this.imvu.call('editProject', $('.name', row).text());
}

CreatorMode.prototype.sizeRecentFilesTable = function() {
    this.$recentProjects.toggle(this.numRecentProject > 0);

    if (this.numRecentProject) {
        var rowHeight = 28;
        var needed = this.numRecentProject * rowHeight;
        var available = window.innerHeight - this.$recentProjectsHeader[0].getBoundingClientRect().bottom - 42;

        var height = needed;
        if (height > available) {
            height = available;
        }

        var minHeight = Math.min(3 * rowHeight, needed);
        if (height < minHeight) {
            height = minHeight;
        }

        this.$recentFilesBody.height(height);
    }
}

CreatorMode.prototype.clearRecentProjects = function() {
    this.numRecentProject = 0;
    this.$recentFilesBody.html('');
}

CreatorMode.prototype.refreshProductInfos = function (pids) {
    serviceRequest({
        method: 'GET',
        uri: IMVU.SERVICE_DOMAIN + '/api/shop/product.php?pids=' + pids.join(','),
        network: this.network,
        imvu: this.imvu,
        callback: function (response, error) {
            if (error) {
                return;
            }

            _.each(response.products, function (product) {
                this.productInfos[product.id] = product;
            }.bind(this));

            $('.project-row').each(function (index, element) {
                var $tr = $(element),
                    $tdDerived = $tr.find('.derived'),
                    $pidName = $tdDerived.find('.pid-name'),
                    derivedFrom = $tr.data('pid'),
                    product = this.productInfos[derivedFrom];

                if (product) {
                    $pidName.text(" - " + product.name);
                } else {
                    $pidName.text(" - ("+_T("error")+")");
                }

                $pidName.fadeIn('fast');
            }.bind(this));
        }.bind(this)
    });
}

CreatorMode.prototype.addRecentProject = function(recents) {
    var fileName = recents[0];
    var productType = recents[1];
    var derivedFrom = recents[2];
    
    var $tr = $('<tr class="project-row"/>');
    $tr.data('pid', derivedFrom);
    this.$recentFilesBody.append($tr);
    $tr.click(this.editProject.bind(this, $tr[0]));

    var $tdEdit = $('<td/>');
    $tr.append($tdEdit);

    $tdEdit.append('<div class="edit">Edit</div>');

    $tr.append('<td class="name">' + fileName + '</td>');
    $tr.append('<td class="type">' + productType + '</td>');

    var $pid = $('<span class="pid"/>'),
        $pidName = $('<span class="pid-name"/>'),
        $tdDerived = $('<td class="derived"/>');

    $tdDerived
        .append($pid)
        .append($pidName);

    $pidName.hide();

    $tr.append($tdDerived);
    if (derivedFrom) {
        $pid.text(derivedFrom);
    }

    this.numRecentProject = this.numRecentProject + 1;
    this.sizeRecentFilesTable();
};

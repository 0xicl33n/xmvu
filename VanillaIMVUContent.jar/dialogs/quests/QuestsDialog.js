function QuestsDialog(args) {
    this.questUrl = (typeof args.info.quest !== 'undefined') ? args.info.quest.url : '';
    this.questCompleted = (typeof args.info.quest !== 'undefined') ? args.info.quest.done : false;
    this.imvu = args.imvu;
    this.network = args.network;
    this.translatedQuestText = args.translatedQuestText;
    this.networkCache = new IMVU.NetworkCache(this.network);
    this.userUrl = this.imvu.call('getUserUrl');
    $('.close').click(this.closeDialog.bind(this));
    $('.close-button').click(this.closeDialog.bind(this));
    onEscKeypress(this.closeDialog.bind(this));
    this.getQuests();
}

QuestsDialog.prototype = {
    closeDialog : function() {
        this.imvu.call('cancelDialog');
    },

    getQuests: function() {
        this.networkCache.get(this.userUrl, {
            success : function(response) {
                this.__onLoadUser(response);
            }.bind(this),
            failure : this.__onLoadFailure.bind(this)
        });
    },

    __onLoadUser: function(data) {
        this.networkCache.get(data.relations.quests, {
            success : function(response) {
                var eventHandler = _.after(response.data.items.length, function() {
                    $('.more-info').click(function(evt) {
                        $(evt.target).parent().parent().toggleClass('selected');
                    });

                    $('.quest-item-container:odd').addClass('odd');
                    $('.quests-container').removeClass('loading');

                    if (this.questUrl) {
                        $el = $("[data-quest-url='"+this.questUrl+"']");

                        if (this.questCompleted) {
                            $el.find('.icon').hide();
                            $el.find('.checkbox').hide();
                            $el.find('.icon').fadeIn(1250);
                            $el.find('.checkbox').fadeIn(1250);
                        }

                        var pos = $el.offset();
                        var height = $('.quest-item-container').first().height();
                        $('.quests-list').scrollTop(pos.top - (height * 2)); // need to offset the height of 'loading' and 'error' items
                    }
                }.bind(this));
                _.each(response.data.items, function(item) {
                    this.networkCache.get(item, {
                        success : function(r) {
                            this.showQuest(r, function(quest) {
                                var $li = this.createQuest(quest);
                                $('.quests-list .loading').before($li);
                            }.bind(this));
                            eventHandler();
                        }.bind(this),
                        failure : this.__onLoadFailure.bind(this)
                    });
                }.bind(this));
            }.bind(this),
            failure : this.__onLoadFailure.bind(this)
        });
    },

    __onLoadFailure: function() {
        $('.quests-container').removeClass('loading').addClass('error');
    },

    showQuest: function(userQuestEdge, callback) {
        this.networkCache.get(userQuestEdge.relations.ref, {
            success : function(response) {
                var quest = {
                    url : userQuestEdge.relations.ref,
                    title : this.translatedQuestText[response.data.key].name,
                    description : this.translatedQuestText[response.data.key].description,
                    finished : userQuestEdge.data.finished,
                    iconIncompleteOffset : response.data.icon_incomplete_offset,
                    iconCompleteOffset : response.data.icon_complete_offset,
                    reward : this.translatedQuestText[response.data.key].reward
                };
                callback(quest);
            }.bind(this),
            failure : this.__onLoadFailure.bind(this)
        });
    },

    createQuest: function(quest) {
        var $li = $('<li>').addClass('quest-item-container')
        .append(
            $('<div>').addClass('quest-item')
            .append(
                $('<div>').addClass('count').html($('.quests-list').children().length - 1))
            .append(
                $('<div>').addClass('icon'))
            .append(
                $('<span>').addClass('name').html(quest.title))
            .append(
                $('<span>').addClass('more-info').html(_T('more info')))
            .append(
                $('<img>').addClass('checkbox')))
        .append(
            $('<div>').addClass('quest-description')
            .append(
                $('<ul>'))
            .append(
                $('<div>').addClass('reward-footer')
                .append(
                    $('<span>').addClass('reward-text').html(_T('Reward:'))
                    .append(
                        $('<span>').addClass('amount').html(quest.reward)))));

        if (quest.description) {
            $li.find('ul').append($('<li>').html(quest.description));
        }

        $li.attr('data-quest-url', quest.url);
        $li.find('.quest-item').toggleClass('completed', quest.finished);
        var offset = (quest.finished) ? quest.iconCompleteOffset : quest.iconIncompleteOffset;
        offset = _.map(offset, function(coordinate) { return coordinate + 'px'; });
        offset = offset.join(' ');
        $li.find('.quest-item .icon').css('background-position', offset);
        $li.find('a').click(function(evt) {
            evt.preventDefault();
            if ($(evt.target).hasClass('namedUrl')) {
                var recipient_id = this.userUrl.split('-');
                this.imvu.call('launchNamedUrl',  $(evt.target).attr('href'), {recipient_id: parseInt(recipient_id[1]) });
            } else {
                this.imvu.call('launchUrl', $(evt.target).attr('href'));
            }
        }.bind(this));
        return $li;
    }
};
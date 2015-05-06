function QuestsTool(args) {
    this.network = args.network;
    this.eventBus = args.eventBus;
    this.networkCache = new IMVU.NetworkCache(this.network);
    this.imvu = args.imvu;
    this.$el = args.$el;
    this.revealedQuests = true;
    
    if (this.imvu.call('showQuests') === 0) {   
        this.$el.hide();
        this.revealedQuests = false;
    }

    this.$el.html('Loading...');
    this.userUrl = this.imvu.call('getUserUrl');
    this.registerEvents();    
    this.getQuests();    
}

QuestsTool.prototype = {
    registerEvents: function() {        
        this.eventBus.register('ServerEvent.questComplete', this.__onCompletedQuest.bind(this));
        this.eventBus.register('QuestsTool.ShowDialog', 
            function(eventName, info) {                 
                var url = info.url || '';
                var done = info.done || false;
                this.showModalDialog(url, done); 
            }.bind(this)
        );
    },
    
    showModalDialog: function(quest, justDone) {        
        this.__refresh();        
        this.imvu.call('showQuestDialog', {url: quest, done: justDone});
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
                this.$el.empty();
                var iconVisibility = _.after(response.data.items.length, this.iconVisibility.bind(this));
                
                _.each(response.data.items, function(item) {
                    this.networkCache.get(item, {
                        success : function(r) {                        
                            this.showQuest(r);
                            iconVisibility();
                        }.bind(this)
                    });
                }.bind(this));
            }.bind(this),
            failure : this.__onLoadFailure.bind(this)
        });
    },
    
    iconVisibility : function() {
        if (this.$el.find('div:visible').length === 0) {
            this.$el.find('div').last().show();            
            return;
        }
        
        $('.sparkle').hide();
    },
    
    __refresh : function() {
        _.each(this.$el.find('div'), function(div) {
            var $div = $(div);
            if ($div.children().length) {
                $div.hide();
            }
        });
        
        this.iconVisibility();
    },
    
    __onLoadFailure : function() {
        this.$el.addClass('error');
    },
    
    showQuest: function(userQuestEdge) {        
        this.networkCache.get(userQuestEdge.relations.ref, {
            success : function(response) {
                var offset = (userQuestEdge.data.finished) ? response.data.icon_complete_offset : response.data.icon_incomplete_offset;
                offset = _.map(offset, function(coordinate) { return coordinate + 'px'; });
                offset = offset.join(' ');
                var $div = $('<div>').addClass('ui-event').css('background-position', offset);                
                $div.attr('data-quest-url', userQuestEdge.relations.ref);
                $div.attr('data-ui-name', 'quest_toolstrip_item');
                $div.click(this.showModalDialog.bind(this, userQuestEdge.relations.ref, false));
                $div.toggle(!userQuestEdge.data.finished);
                this.$el.append($div);
            }.bind(this),
            failure : this.__onLoadFailure.bind(this)
        });
    },
    
    __onCompletedQuest: function(eventName, args) {
        var url = args.questUrl;
        var silent = args.silent || 0;
        if (silent == 0 && !this.revealedQuests) {
            this.$el.show();
            this.__refresh();
            this.revealedQuests = true;
        }
        
        this.networkCache.get(url, {
            success : function(response) {
                var offset = response.data.icon_complete_offset;
                offset = _.map(offset, function(coordinate) { return coordinate + 'px'; });
                offset = offset.join(' ');
                               
                var $div = this.$el.find("[data-quest-url='"+url+"']");                
                if ($div.length > 0) {                    
                    $div.empty().addClass('ui-event').append(
                        $('<img>').addClass('sparkle').attr('src', 'img/quests_icon-sparkle.gif'));                        
                    $div.css('background-position', offset);
                    $div.attr('data-ui-name', 'completed_quest_toolstrip_item');
                    $div.detach();
                    this.$el.prepend($div);
                    $div.unbind('click');
                    $div.click(this.showModalDialog.bind(this, url, true));
                }
            }.bind(this),
            failure : this.__onLoadFailure.bind(this)
        });        
    }
};
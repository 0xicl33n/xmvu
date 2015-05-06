function Leaderboard($leaderboard, $mode, imvu, network, vipUpsellReason, registerWindowLoad, scoreCenteredHandler, vipUpsellDialogMaker) {
    this.$leaderboard = $leaderboard;
    this.$leaderboardList = $('.list', this.$leaderboard);
    this.$leaderboardEntry = $('.template > .friend', this.$leaderboard);
    this.vipUpsellReason = vipUpsellReason;
    var $allTimeLeaderboardLabel = $('.tab_title.all-time', this.$leaderboard);
    if (imvu.call('isGlobalLeaderboardVIPOnly')) {
        $allTimeLeaderboardLabel.html(_T('VIP Top 100'));
    } else {
        $allTimeLeaderboardLabel.html(_T('IMVU Top 100'));
    }
    this.imvu = imvu;
    this.network = network || IMVU.Network;
    this.cid = this.imvu.call('getCustomerId');

    if (this.shouldShowVIPUpsell()) {
        $('.vip_upsell', this.$leaderboard).show();
    }

    vipUpsellDialogMaker = vipUpsellDialogMaker || WalkOffVipUpsellDialog;
    $('.vip_upsell > .upsell_text > .button', this.$leaderboard).click(function() {
        var $vipUpsellDialog = $('.template > .vip-upsell-dialog', $mode).clone();
        $mode.append($vipUpsellDialog);
        var vipUpsellDialog = new vipUpsellDialogMaker(this.imvu, $vipUpsellDialog);
        vipUpsellDialog.show(this.vipUpsellReason);
    }.bind(this));

    // We need to recenter scores on load because centering requires access to
    // positioning information, which doesn't get set correctly until after the
    // css loads.
    registerWindowLoad = registerWindowLoad || function (handler) {
        $(window).load(handler);
    };
    registerWindowLoad(this.onLoad.bind(this));
    this.scoreCenteredHandler = scoreCenteredHandler || function () {};

    this.board_name = 'walk_off_imvu';
    if (this.imvu.call('isQA') || this.imvu.call('isAdmin')) {
        this.board_name = 'walk_off_qa';
    }
    
    this.isMoving = false;
    this.isOut = false;
    this.refreshLeaderboard();
};

Leaderboard.prototype = {
    onLoad: function() {
        this.showOwnScore();
    },

    shouldShowVIPUpsell: function() {
        return this.imvu.call('isGlobalLeaderboardVIPOnly') && !this.imvu.call('hasVIPPass');
    },

    refreshLeaderboard: function() {
        this.$leaderboardList.html('');
        var callback = {
            success: this.restResultLeaderboards,
            failure: this.restResultLeaderboardFailure,
            scope: this
        };
        this.network.asyncRequest('GET', IMVU.REST_DOMAIN + '/leaderboards', callback, undefined);
    },
    
    showSideTab: function() {
        $(".side-tab", this.$leaderboard).show();
        $(".side-tab", this.$leaderboard).click(
            function() {
                this.imvu.call('playSound', 'leaderboard_slide');
                if(!this.isMoving){
                    if(this.isOut){
                        this.slideIn();
                    }
                    else {
                        this.slideOut();
                    }
                }
            }.bind(this)
        );
    },
    
    slideOut: function() {
        this.isMoving = true;
        this.$leaderboard.animate({
            left: 255
        }, 300, function() {
            this.isMoving = false;
            this.isOut = true;
            }.bind(this)
        );
    },
    
    slideIn: function() {
        this.isMoving = true;
        this.$leaderboard.animate({
            left: 0
        }, 300, function() {
            this.isMoving = false;
            this.isOut = false;
            }.bind(this)
        );
    },

    restResultLeaderboards: function(response) {
        if (response.responseText.status !== 'success') {
            return;
        }
        var items = response.responseText.data.items;
        var board = null;
        for (item in items) {
            if (items[item].name === this.board_name) {
                board = items[item];
                break;
            }
        }
        if (board === null) {
            return;
        }

        var callback = {
            success: this.restResultSubBoards,
            failure: this.restResultLeaderboardFailure,
            scope: this
        };
        this.network.asyncRequest('GET', board.relationships.sub_boards, callback, undefined);
    },

    restResultSubBoards: function(response) {
        if (response.responseText.status !== 'success') {
            return;
        }
        var items = response.responseText.data.items;
        var subboard = null;
        for (item in items) {
            if (items[item].name === 'weekly') {
                subboard = items[item];
                break;
            }
        }
        if (subboard === null) {
            return;
        }

        var callback = {
            success: this.restResultScores,
            failure: this.restResultLeaderboardFailure,
            scope: this
        };
        
        this.myScoreUrl = subboard.relationships.my_score;
        this.network.asyncRequest('GET', subboard.relationships.scores, callback, undefined);
    },

    restResultScores: function(response) {
        if (response.responseText.status !== 'success') {
            return;
        }
        var items = response.responseText.data.items;
        var count = 0;
        var cids = [];
        for (item in items) {
            cids.push(items[item].cid);

            var $entry = this.$leaderboardEntry.clone();
            $('.score', $entry).text(IMVU.Client.util.number_format(items[item].score, 0, '.', ','));
            $('.rank_icon > .rank_number', $entry).text(items[item].rank+1);
            $entry.css('top', 64*count);
            if (items[item].cid === this.cid) {
                $entry.addClass('self');
            }
            $entry.addClass('cid_' + items[item].cid);
            this.bindEventsOnLeaderboardEntry($entry, items[item].cid)
            this.$leaderboardList.append($entry);

            count++;
            if (count >= 100) {
                break;
            }
        }
        
        this.showOwnScore(this.myScoreUrl);
        
        IMVU.callAsync('getAvatarInfos', function(result) {
            for (item in result) {
                var $entry = $('.cid_' + result[item].userId, this.$leaderboardList);
                $('.name', $entry).text(result[item].avatarName);
                $('.portrait', $entry).css('background-image', 'url(' + result[item].picUrl_40x55 + ')');
            }
        }.bind(this), this.imvu, cids);
    },

    restResultOwnScore: function(response) {
        console.log(response);
        if (response.responseText.status !== 'success' || response.responseText.data.score === 0) {
            return;
        }

        var score = response.responseText.data.score;
        var rank = response.responseText.data.rank;

        var $entry = this.$leaderboardEntry.clone();
        $('.self_entry_container', this.$leaderboard).append($entry);
        $('.score', $entry).text(IMVU.Client.util.number_format(score, 0, '.', ','));
        $('.self_rank > .rank_number', $entry).text(rank+1);
        $('.self_rank', $entry).show();
        $('.rank_icon', $entry).hide();
        $('.info_button', $entry).hide();
        $('.self_entry_bg', this.$leaderboard).show();

        IMVU.callAsync('getAvatarInfos', function(result) {
            $('.name', $entry).text(result[0].avatarName);
            $('.portrait', $entry).css('background-image', 'url(' + result[0].picUrl_40x55 + ')');
        }.bind(this), this.imvu, [this.cid]);
    },

    showOwnScore: function (scoreUrl) {
        var $entry = this.$leaderboardList.find('.cid_' + this.cid);
        if ($entry.length === 1) {
            if (!jQuery.contains($entry[0].ownerDocument.documentElement, $entry[0])) {
                // If the leaderboard has been removed from the DOM in the meantime
                // this would cause a crash in jQuery.
                return;
            }

            // The user is in the top 100, so just scroll the list to them
            var totalHeight = this.$leaderboardList.attr('scrollHeight');
            var visibleHeight = this.$leaderboardList.height();
            var scrollTop = this.$leaderboardList.scrollTop();
            var entryHeight = $entry.height();
            var entryTopOffset = $entry.position().top + scrollTop;
            var entryCenterOffset = entryTopOffset + entryHeight / 2;
            var target = entryCenterOffset - visibleHeight / 2;

            this.$leaderboardList.scrollTop(target);
            this.scoreCenteredHandler();
        } else if (scoreUrl) {
            // The user isn't in the top 100, so get their score and add them to the bottom
            var callback = {
                success: this.restResultOwnScore,
                failure: this.restResultLeaderboardFailure,
                scope: this
            };
            this.network.asyncRequest('GET', scoreUrl, callback, undefined);
        }
    },

    restResultLeaderboardFailure: function(response) {
        this.imvu.call('log', 'WALKOFF: REST failure ~ ' + JSON.stringify(response));
    },

    bindEventsOnLeaderboardEntry: function($entry, cid) {
        $('.info_button', $entry).click(function() {
            this.imvu.call('showAvatarCard', cid, {});
        }.bind(this));
    }
};

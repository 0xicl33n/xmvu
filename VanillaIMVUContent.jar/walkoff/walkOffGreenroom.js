function WalkOffGreenroom(imvu, $stage, plaques, timer, animator, handlers, $greenroom, countdownMaker) {
    this.$greenroom = $greenroom;
    this.$greenroomSize = $('.greenroom-size', this.$greenroom);
    this.$availableContent = $('.available .content', this.$greenroom);
    this.$powerBox = $('.power.box', this.$greenroom);
    this.$powerBoxContent = $('.content', this.$powerBox);
    this.$helpText = $('.greenroom-panel.select .help-text', this.$greenroom);
    this.availableHolders = [];
    this.selectionHolders = [];
    this.imvu = imvu;
    this.timer = new CancelableTimer(timer);
    this.animator = animator;
    this.assetUrl = 'http://static.imvu.com/imvufiles/games/walkoff/';

    this.$stageMask = $stage.find('.board-mask');
    this.plaques = plaques;
    this.catalogIsSet = false;
    this.descriptionsAreSet = false;
    this.earlySavedSelection = null;

    this.playerLevel = null;

    var doNothing = function () {};
    this.closeHandler = handlers['onClose'] || doNothing;
    this.readyHandler = handlers['onReady'] || doNothing;
    this.inviteTimeoutHandler = handlers['onInviteTimeout'] || doNothing;

    countdownMaker = countdownMaker || WalkOffCountdown;
    var $countdown = this.$greenroom.find('.countdown');
    this.countdown = new countdownMaker(this.imvu, $countdown, this.animator);
    this.readyDelayId = null;

    $('.close', this.$greenroom).click(this.handleClose.bind(this));
    $('.ready.button', this.$greenroom).click(this.handleReady.bind(this));
    
    this.powerDescriptions = {};
    this.powerAssets = {};
    this.powerCost = {};
    this.markedMoveId = null;
    this.hoverMoveId = null;
    this.$availableSelections = [];
    this.setHelpText();
    
    this.shouldShowFirstTimeInstructions = this.imvu.call('shouldShowFirstTimeInstructions');
}

WalkOffGreenroom.prototype = {
    COUNTDOWN_TIME_SECS: 30,
    INVITE_TIMEOUT_SECS: 31,

    show: function (inviteType) {
        this.clearTimers();
        
        this.$greenroom.toggleClass('invite', inviteType === 'invite');
        this.$greenroom.toggleClass('invitee', inviteType === 'invitee');
        if (inviteType) {
            this.timer.setTimeout(this.handleInviteTimeout.bind(this), this.INVITE_TIMEOUT_SECS * 1000);
        }

        var maxDots = 3;
        var $loadingDots = this.$greenroom.find('.loading-dots');
        $loadingDots.html('');
        var $dots = [];
        for (var i = 0; i < maxDots; i++) {
            var $span = $('<span>.</span>');
            $dots.push($span.appendTo($loadingDots));
        }

        this.$powerBox.show();
        this.updatePowerMoves();
        this.$greenroom.addClass('waiting');
        var dotCounter = 0;
        this.timer.setInterval(function animateDots() {
            for (var i = 0; i < maxDots; i ++) {
                var opacity = (i < (dotCounter % (maxDots + 1)) ? 1 : 0);
                $dots[i].animate({opacity: opacity}, 300);
            }
            dotCounter += 1;
        }, 500);

        this.imvu.call('greenroomStart', this.getChosenMoves());

        $('.plaques.left').addClass('in_greenroom');

        this.$greenroom.show();
        this.$stageMask.show();
        return false;
    },

    setStageSize: function(width, height) {
        if (!this.shouldShowFirstTimeInstructions) {
            var dialogLeft = -4 - 81/192*width;
            var dialogWidth = 190/224 * width - 36;
            this.$greenroomSize.css('height', 190/224 * height - 58);
            this.$greenroomSize.css('width', dialogWidth);
            this.$greenroomSize.css('margin-left', dialogLeft);
            this.$powerBoxContent.css('margin-left', (dialogWidth - 380) / 2);
            var jScrollPane = this.$powerBoxContent.data('jsp');
            if (jScrollPane) {
                jScrollPane.reinitialise({contentWidth: 1}); // contentWidth: 1 keeps the horizontal scrollbar from appearing
            }
        }
    },

    setStageOffset: function(top, left) {
        var dialogTop = 251 + 3.77 * top;
        this.$greenroomSize.css('top', dialogTop);
    },

    updatePlaques: function () {
        if (!this.shouldShowFirstTimeInstructions) {
            for (var i = 0; i < this.plaques[0].length; i++) {
                var plaque = this.plaques[0][i];
                var moveId = plaque.getMoveId();
                if (moveId) {
                    plaque.thaw();
                    plaque.setIsCurrentPlayer(true);
                    var colorId = '';
                    var moveCost = 1;
                    var iconUrl = this.assetUrl + this.powerAssets[moveId]['icon'];
                    for (var color in this.powerCost[moveId]) {
                        if (this.powerCost[moveId].hasOwnProperty(color)) {
                            colorId = color;
                            moveCost = this.powerCost[moveId][color];
                            break;
                        }
                    }
                    var moveName = '';
                    var moveDesc = '';
                    if (this.powerDescriptions[moveId]) {
                        moveName = this.powerDescriptions[moveId].name;
                        moveDesc = this.powerDescriptions[moveId].descr;
                    }
                    plaque.setMoveInfo(moveId, colorId, moveName, moveDesc, moveCost, moveCost, true);
                    plaque.setIconUrl(iconUrl);
                    plaque.setGreenroomMode(true);
                    plaque.overrideClickHandler(this.onPlaqueClick.bind(this));
                    plaque.setMouseOverHandler(this.onPlaqueMouseOver.bind(this));
                    plaque.mark(moveId === this.markedMoveId);
                    plaque.update();
                }
            }
        }
    },

    setCatalog: function (catalog) {
        this.powerAssets = {};
        for (var i in catalog) {
            this.powerAssets[catalog[i].move] = catalog[i].assets;
            this.powerCost[catalog[i].move] = catalog[i].cost;
        }
        var positionSortFunc = function (a, b) {
            return a.position - b.position;
        };
        this.catalog = catalog.slice(0).sort(positionSortFunc);

        this.catalogIsSet = true;
        if (this.earlySavedSelection) {
            var selection = this.earlySavedSelection;
            this.earlySavedSelection = null;
            this.setSelection(selection);
        } else {
            this.updatePowerMoves();
        }
    },

    setAssetUrl: function(url) {
        this.assetUrl = url;
    },

    setDescriptions: function(descriptions) {
        this.powerDescriptions = descriptions;
        this.descriptionsAreSet = true;
        this.updatePowerMoves();
    },

    loadSelection: function(index, selection) {
        if (index < this.plaques[0].length) {
            this.plaques[0][index].setMoveId(selection);
        }
    },

    setSelection: function(selection) {
        if (!this.catalogIsSet) {
            this.earlySavedSelection = selection;
        } else {
            var holderIndex = 0;
            for (var i = 0; i < selection.length; i++) {
                if (this.isInCatalog(selection[i])) {
                    this.loadSelection(holderIndex, selection[i]);
                    holderIndex++;
                    if (holderIndex >= 3) {
                        break;
                    }
                }
            }
            for (i = holderIndex; i < 3; i++) {
                this.loadSelection(i, '');
            }
            this.updatePowerMoves();
        }
    },

    getSelection: function() {
        var selection = [];
        for (var i = 0; i < 3; i++) {
            selection.push(this.plaques[0][i].getMoveId());
        }
        return selection;
    },

    isInCatalog: function(moveId) {
        return moveId && _.any(this.catalog, function ($entry) {
            return $entry.move === moveId;
        });
    },

    setPlayerLevel: function (level) {
        this.playerLevel = parseInt(level, 10);
        this.updatePowerMoves();
    },

    updatePowerMoves: function() {
        this.updatePlaques();
        this.updateAvailablePowerMoves();
    },

    updateAvailablePowerMoves: function() {
        var gemColor = {
            'b':'#0CF',
            'g':'#4F4',
            'r':'#F33',
            'p':'#F6F',
            'y':'#FF0'
        };
        if (!this.catalogIsSet || !this.descriptionsAreSet) {
            return;
        }
        this.$powerBoxScroll = $('.content .scroll-area', this.$powerBox);
        this.$powerBoxScroll.html('');
        this.$availableSelections = [];
        var numPowerMoves = this.catalog.length;
        for (var i = 0; i < numPowerMoves; i++) {
            if (this.catalog[i].type !== 'move') {
                continue;
            }
            var moveId = this.catalog[i].move;
            var iconUrl = this.assetUrl + this.catalog[i].assets['icon'];
            var $selectionTemplate = this.$greenroom.find('.template > .available-power-move');
            var $selection = $selectionTemplate.clone();
            $selection.find('.label').text(this.powerDescriptions[moveId].name);

            this.$availableSelections[moveId] = $selection;
            if (this.findPlaque(moveId)) {
                $selection.addClass('selected');
            }
            var moveLevel = parseInt(this.powerDescriptions[moveId].level, 10);
            if (!this.playerLevel || moveLevel > this.playerLevel) {;
                $selection.addClass('locked');
            } else {
                $selection.click(this.clickAvailable.bind(this, $selection, moveId));
            }
            $selection.mouseenter(this.onAvailableMouseOver.bind(this, moveId, true));
            $selection.mouseleave(this.onAvailableMouseOver.bind(this, moveId, false));
            $selection.find('.move-icon').css('background-image', 'url('+iconUrl+')');
            $selection.css('display', 'inline-block');
            $selection.find('.icon').attr('src', iconUrl);
            $selection.data('moveId', moveId);
            var color = gemColor[this.getFirstGemColor(this.catalog[i].cost)];
            if (color !== undefined) {
                $selection.find('.label').css('text-shadow', '0 0 4px '+color+', 0 0 4px '+color);
                this.drawPie($selection.find('.pie'), color);
            }
            if (moveId === this.markedMoveId) {
                $selection.addClass('marked');
            }
            this.$powerBoxScroll.append($selection);
        }
    },

    getFirstGemColor: function(cost) {
        for (var color in cost) {
            if (cost.hasOwnProperty(color)) {
                return color;
            }
        }
        return '';
    },

    clickPlaqueOrAvailable: function(clickedMoveId) {
        this.clearAllSelectionMarks();
        var $clickedSelection = this.$availableSelections[clickedMoveId];
        var clickedPlaque = this.findPlaque(clickedMoveId);
        if (clickedMoveId === this.markedMoveId) {
            this.markedMoveId = null;
        } else if (this.markedMoveId === null) {
            this.markedMoveId = clickedMoveId;
        } else {
            var markedPlaque = this.findPlaque(this.markedMoveId);
            if (markedPlaque === null && clickedPlaque === null) {
                this.markedMoveId = clickedMoveId;
            } else {
                if (markedPlaque) {
                    markedPlaque.setMoveId(clickedMoveId);
                }
                if (clickedPlaque) {
                    clickedPlaque.setMoveId(this.markedMoveId);
                }
                this.markedMoveId = null;
            }
        }
        this.updatePowerMoves();
        this.setHelpText();
    },

    clickAvailable: function($selection, moveId) {
        this.clickPlaqueOrAvailable(moveId);
    },

    onPlaqueClick: function (plaque) {
        this.clickPlaqueOrAvailable(plaque.getMoveId());
    },

    onPlaqueMouseOver: function(plaque, over) {
        var moveId = plaque.getMoveId();
        if (over) {
            if (moveId !== this.hoverMoveId) {
                this.setHelpText(plaque.getDescription());
            }
            this.hoverMoveId = moveId;
        } else {
            this.setHelpText();
            this.hoverMoveId = null;
        }
    },

    onAvailableMouseOver: function(moveId, over) {
        if (over) {
            if (moveId !== this.hoverMoveId) {
                this.setHelpText(this.powerDescriptions[moveId].descr);
            }
            this.hoverMoveId = moveId;
        } else {
            this.setHelpText();
            this.hoverMoveId = null;
        }
    },

    setHelpText: function(text) {
        if (text) {
            this.$helpText.html(text);
        } else {
            if (this.markedMoveId) {
                if (this.findPlaque(this.markedMoveId)) {
                    this.$helpText.html(_T('Click on another style move to make a swap.'));
                } else {
                    this.$helpText.html(_T('Click one of the selected style moves to make a swap.'));
                }
            } else {
                this.$helpText.html(_T('Click and swap your moves to gain an advantage. Highlight any Style Move to learn more about its effect.'));
            }
        }
    },

    findPlaque: function(moveId) {
        for (var i = 0; i < this.plaques[0].length; i++) {
            var plaque = this.plaques[0][i];
            if (plaque.getMoveId() === moveId) {
                return plaque;
            }
        }
        return null;
    },

    clearAllSelectionMarks: function() {
        $('.available-power-move', this.$powerBoxScroll).removeClass('marked');
        for (var i = 0; i < this.plaques[0].length; i++) {
            var plaque = this.plaques[0][i];
            plaque.mark(false);
        }
    },

    drawPie: function($pie, color) {
        var ctx = $pie[0].getContext('2d');
        var width = $pie[0].width;
        var radius = width / 2;
        ctx.clearRect(0, 0, width, width);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.fill();
    },

    handleClose: function () {
        this.hide();
        this.imvu.call('greenroomCancel');
        this.closeHandler();
        return false;
    },

    handleReady: function () {
        var chosenMoves = this.getChosenMoves();
        this.hide();
        this.imvu.call('greenroomReady', chosenMoves);
        this.readyHandler(chosenMoves);
        return false;
    },

    handleInviteTimeout: function () {
        this.hide();
        this.inviteTimeoutHandler();
    },

    hide: function () {
        $('.plaques.left').removeClass('in_greenroom');
        this.clearTimers();
        for (var i = 0; i < this.plaques[0].length; i++) {
            var plaque = this.plaques[0][i];
            plaque.setMoveId(null);
            plaque.mark(false);
            plaque.setGreenroomMode(false);
            plaque.setMouseOverHandler(null);
            plaque.revertClickHandler();
            plaque.update();
        }
        this.$greenroom.hide();
        this.$stageMask.hide();
    },

    getChosenMoves: function () {
        var holderContents = [];
        holderContents = this.getSelection();
        return  _.filter(holderContents, _.identity);
    },

    updateTimerNumbers: function ($ones, $tens, time) {
        var digits = this.getTimeDigits(time);
        $ones.removeClass().addClass('number ones digit_'+digits[0]);
        $tens.removeClass().addClass('number tens digit_'+digits[1]);
    },

    getTimeDigits: function (time) {
        var clampedTime = Math.floor(Math.min(99, Math.max(time, 0)));
        var ones = clampedTime % 10;
        var tens = (Math.floor(clampedTime / 10)) % 10;
        return [ones, tens];
    },

    startGame: function () {
        this.$greenroom.removeClass('waiting selecting').addClass('starting');
        this.$greenroom.find('.greenroom-panel.starting .message')
            .animate({opacity:'1.0'}, {duration:400, queue:true})
            .animate({opacity:'0.0'}, {duration:400, queue:true})
            .animate({opacity:'1.0'}, {duration:400, queue:true})
            .animate({opacity:'0.0'}, {duration:400, queue:true})
            .animate({opacity:'1.0'}, {duration:400, queue:true});
        this.timer.setTimeout(this.startCountdown.bind(this), 5 * 400);
    },

    startCountdown: function () {
        this.clearTimers();
        this.countdown.start(this.COUNTDOWN_TIME_SECS);

        // We pad by one so the user can see the time at zero for a second.
        var delayMsecs = (this.COUNTDOWN_TIME_SECS + 1) * 1000;
        this.readyDelayId = this.animator.add(new DelayedCall(this.handleReady.bind(this), delayMsecs));
        
        nextclass = 'selecting';
        if ( this.shouldShowFirstTimeInstructions ) {
            nextclass = 'instruction';
            this.imvu.call('markFirstTimeInstructionsSeen');
        }

        this.$greenroom.removeClass('waiting starting').addClass(nextclass);
        this.$powerBoxContent.jScrollPane({contentWidth: 1}); // contentWidth: 1 keeps the horizontal scrollbar from appearing
    },

    clearTimers: function () {
        this.timer.clearAll();
        this.countdown.stop();

        if (this.readyDelayId !== null) {
            this.animator.remove(this.readyDelayId);
            this.readyDelayId = null;
        }
     }
};

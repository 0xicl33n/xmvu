var GEM_SWAP_TIME_MSEC = 350;
var GEM_ANIMATION_PERIOD = 33;
var CROWD_ANIMATION_SHOW_TIME = 200;
var CROWD_ANIMATION_HIDE_TIME = 75;
var TURN_FADE_TIME_MSEC = 300;
var BOARD_COLUMNS = 8;
var BOARD_ROWS = 8;
var STAGE_PIXEL_W = 490;
var STAGE_PIXEL_H = 559;
var SCREEN_MIN_PIXEL_H = 582;
var BOARD_PIXEL_W = 395;
var READY_PULSE_MSEC = 2000;

function WalkOffGame($mode, imvu, eventBus, service, timer, callbacks, greenroom, settingsPanel, generator, plaqueMaker, countdownMaker) {
    var $gameTemplate = $mode.find('.template > .game');
    this.$game = $gameTemplate.clone();
    $mode.append(this.$game);
    this.$mode = $mode;

    this.callbacks = callbacks || {
        onCloseGame: function () {}
    };
   
    this.imvu = imvu;
    this.eventBus = eventBus;
    this.$stage = this.$game.find('.stage');
    this.$board = this.$stage.find('.board');
    this.$outerBoard = this.$stage.find('.outer-board');
    this.boardWidth = this.$board.width();
    this.boardHeight = this.$board.height();
    this.$leftStatus = this.$game.find('.status_bar.left');
    this.$rightStatus = this.$game.find('.status_bar.right');
    this.$turnStatus = this.$game.find('.turn_status');
    var innerTimer = timer || new Timer();
    this.timer = new CancelableTimer(innerTimer);
    this.frameTimer = new FrameTimer(imvu, innerTimer);
    this.animator = new Animator(this.frameTimer);
    
    this.timingConstants = {};
    this.state = {};
    this.player1Name = '';
    this.player2Name = '';
    this.p1inventory = this.makeEmptyInventory();
    this.p2inventory = this.makeEmptyInventory();
    this.p1inventoryShown = this.makeEmptyInventory();
    this.p2inventoryShown = this.makeEmptyInventory();
    this.p1moves = [];
    this.p2moves = [];
    this.p1effects = [];
    this.p2effects = [];
    this.powerMoves = {};
    this.gameOver = false;


    this.assetUrl = 'http://static.imvu.com/imvufiles/games/walkoff/';

    this.eventBus.fire('WalkOffGameStart');

    this.$leftPlaqueHolder = this.$stage.find('.plaques.left');
    this.$rightPlaqueHolder = this.$stage.find('.plaques.right');

    plaqueMaker = plaqueMaker || WalkOffPlaque;
    this.plaques = [[], []];
    var $plaqueTemplate = this.$game.find('.template > .walk-off-plaque');
    for (var j = 0; j < 4; j++) {
        var $leftPlaque = $plaqueTemplate.clone().appendTo(this.$leftPlaqueHolder);
        this.plaques[0].push(new plaqueMaker($leftPlaque, false, this.imvu, this.animator, this.onPlaqueClick.bind(this)));

        var $rightPlaque = $plaqueTemplate.clone().appendTo(this.$rightPlaqueHolder);
        this.plaques[1].push(new plaqueMaker($rightPlaque, true, this.imvu, this.animator, this.onPlaqueClick.bind(this)));
    }

    var $greenroom = this.$game.find('.greenroom-dialog');
    this.greenroom = greenroom || new WalkOffGreenroom(this.imvu, this.$stage, this.plaques, this.timer, this.animator, {
        onReady: this.onGreenroomReady.bind(this),
        onClose: this.onGreenroomClose.bind(this),
        onInviteTimeout: this.onGreenroomInviteTimeout.bind(this)
    }, $greenroom);
    this.greenroomActive = false;

    this.service = service;
    this.service.attachToGame(this);

    this.showTurnStatus = false;

    this.indicators = [
        {$el: this.$game.find('.turn_indicator.left'),
         showing: false},
        {$el: this.$game.find('.turn_indicator.right'),
         showing: false}
    ];
    
    this.startTextShown = false;
    this.countdownShowing = false;
    countdownMaker = countdownMaker || WalkOffCountdown;
    this.$countdown = this.$game.find('.turn_status > .countdown');
    this.countdown = new countdownMaker(this.imvu, this.$countdown, this.animator);
    this.$endGameMessage = this.$game.find('.turn_status .end-game-message');

    this.resetMatchCounter();
    this.setStageClickable(false);
    this.cid = this.imvu.call('getCustomerId');
    
    this.gemColorLookup = {
        'b':'Blue',
        'g':'Green',
        'r':'Red',
        'p':'Pink',
        'y':'Yellow',
        'c':'Wild'
    };
    
    this.firstClick = null;
    this.dragging = false;
    this.lastMove = null;
    this.actionQueue = [];
    this.actionRunning = false;

    this.updateTurnIndicators();
    this.updateCountdownShowing();

    this.$gemHolderTemplate = this.$outerBoard.find('.template > .gem_holder');
    this.gemTypes = [];
    this.gemElements = [];
    for (var col = 0; col < BOARD_COLUMNS; col++) {
        this.gemTypes[col] = [];
        this.gemElements[col] = [];
        for (var row = BOARD_ROWS-1; row >= 0; row--) {
            this.gemTypes[col][row] = 'x';
            this.gemElements[col][row] = null;
        }
    }
    this.myOutfit = this.imvu.call("getMyOutfit");

    this.energyToWin = 100;
    this.$energyMeterTemplate = this.$game.find('.template > .energy_meter');
    this.initializeEnergyMeterMetrics();
    this.spinningGem = null;
    this.updateStatusBarPlayer1Pending = false;
    this.updateStatusBarPlayer2Pending = false;

    this.$oosMessage = this.$game.find('.oos_message');
    this.$oosMessage.hide();
    
    this.$crowd = this.$game.find('.crowd-strip');
    
    this.$textContainer = this.$game.find('.text_effect_container');
    this.effectTooltipAnimation = null;
    this.$game.find('.effect-icon').each(function(index, el) {
        $(el).mouseenter(function(e) { this.handleMouseOverEffectIcon(e); }.bind(this, $(el)));
        $(el).mouseleave(function(e) { this.handleMouseOutEffectIcon(e); }.bind(this, $(el)));
    }.bind(this));

    $('.in-board .menu-button.button').click(function () { this.closeGame(); }.bind(this));
    $('.in-board .rematch-button.button').click(function(){
        this.imvu.call('hideToast');
        this.closeGame({
            next: 'inviteAgain',
            inviteeCid: this.getOpponentCid()
        });
    }.bind(this));
    
    $('.info-dialog .close.to-menu').click(function () { this.closeGame(); }.bind(this));
    $('.info-dialog .button.quickmatch').click(this.handleQuickmatch.bind(this));
    $('.info-dialog .button.invite').click(this.handleInvite.bind(this));
    $('.invite-timeout-dialog .button.invite-again').click(this.handleInviteAgain.bind(this));

    this.$qaPanel = this.$game.find('.qa-panel');
    if (this.imvu.call('isQA')) {
        this.$addGemsButton = this.$qaPanel.find('.add-gems-button');
        this.$qaPanel.click(function () { this.$addGemsButton.show(); }.bind(this));
        this.$addGemsButton.click(function () { this.sendMessage('qaaddgems', [10, 10, 10, 10, 10]); }.bind(this));
        this.$qaPanel.show();
    }

    this.$auxPanel = this.$game.find('.aux-panel');
    var settingsCallbacks = {
        setLowQualityGraphics: this.setLowQualityGraphics.bind(this)
    };
    this.settingsPanel = settingsPanel || new WalkOffSettingsPanel(this.$game, this.imvu, settingsCallbacks);
    this.$settingsButton = this.$auxPanel.find('.settings-button');
    this.$settingsButton.click(function () {
        this.$settingsButton.toggleClass('open');
        this.settingsPanel.setVisibility(this.$settingsButton.hasClass('open'));
    }.bind(this));

    this.service.connect();
    this.generator = generator || new WalkOffElectrostaticGenerator(this.imvu, this.animator, $('.electric_arc', this.$game));
    this.incomingGems = [];
    this.incomingInventory = [];
    
    this.turnFadeAnimationIds = [null, null];
    this.countdownFadeAnimationId = null;
    this.newPowerMoves = [];
    this.gameSummary = null;
    this.$scoreBreakdown = this.$game.find('.score-breakdown');
    this.$scoreBreakdownScrollArea = this.$scoreBreakdown.find('.scroll-area');
    this.$scoreBreakdownTray = this.$game.find('.score-breakdown-tray');
    this.$scoreBreakdownTray.hide();
    this.trayIsShowing = false;
    this.trayIsMoving = false;
    
    this.$leaderboard = $('#walkoff > .template > .leaderboard').clone();
    $('.leaderboard_container_game', this.$game).append(this.$leaderboard);
    this.$leaderboard.hide();
    this.leaderboardIsMoving = false;

    this.timer.setInterval(function () {
        this.$leftPlaqueHolder.toggleClass('ready-pulse');
        this.$rightPlaqueHolder.toggleClass('ready-pulse');
    }.bind(this), READY_PULSE_MSEC);
}

WalkOffGame.prototype = {
    setLowQualityGraphics: function (isLow) {
        this.$game.toggleClass('low-quality', isLow);
    },

    show: function(isInvite) {
        if (isInvite) {
            var inviteeCid = this.service.getInviteeCid();
            var inviterCid = this.service.getInviterCid();
            if ( inviteeCid ) {
                this.requestPlayerName(inviteeCid);
            }
            if ( inviterCid ) {
                this.requestPlayerName(inviterCid);
            }
            
            this.greenroom.show(inviteeCid ? 'invite' : 'invitee');
        } else {
            this.greenroom.show();
        }        
    
        this.$game.show();
    },

    hide: function() {
        this.$game.hide();
    },

    setPowerMoveCatalog: function(catalog) {
        this.greenroom.setCatalog(catalog);

        this.powerMoves = {};
        this.effects = {};
        for (var index in catalog) {
            var info = catalog[index];
            if (info['type'] === 'move') {
                if (info['assets']['sound']) {
                    this.imvu.call('preloadSoundUrl', this.assetUrl + info['assets']['sound']);
                }
                this.powerMoves[info.move] = info;
            } else if (info['type'] === 'effect') {
                this.effects[info.effect] = info;
            }
        }
    },

    setAssetUrl: function(url) {
        this.assetUrl = url;
        this.greenroom.setAssetUrl(url);
    },

    makeEmptyInventory: function() {
        return {'b':0, 'g':0, 'r':0, 'p':0, 'y':0};
    },

    getOpponentCid: function() {
        var cid1 = this.getPlayerCid(1);
        var cid2 = this.getPlayerCid(2);
        if (this.cid === cid1) {
            return cid2;
        } else if (this.cid === cid2) {
            return cid1;
        }
        return 0;
    },

    resetGame: function() {
        this.imvu.call('resetGame');
    },

    showGameHud: function() {
        this.$turnStatus.show();
    },
    
    resetMatchCounter: function() {
        this.matchesDisplayed = this.matchesThisTurn = 0;
    },

    rebuildBoard: function(board, reason) {
        if (reason === 'no_moves') {
            this.addAction({showText:{text: 'No Moves!\nBoard Reset', textTime: 1000, blockingTime: 0, scale: true, float: false}});
            this.imvu.call('triggerActionOnAvatar', 'reset_board', this.getPlayerCid(1));
            this.imvu.call('triggerActionOnAvatar', 'reset_board', this.getPlayerCid(2));
        }
        this.addAction({clear: null});
    
        var newGems = [];
        for (var i = 0; i < board.length; i++) {
            var index = (BOARD_ROWS*(i%BOARD_ROWS) + BOARD_ROWS-Math.floor(i/BOARD_ROWS)-1);
            if ( board[index] ) {
                newGems.push(board[index]);
            }
        }
        this.addGems(newGems);
        this.addAction({drop: null});
    },

    getBoardString: function() {
        var colStrings = [];
        for (var col = 0; col < BOARD_COLUMNS; col++) {
            colStrings.push(this.gemTypes[col].join(','));
        }
        return colStrings.join(',');
    },

    getGemPower: function(gemName) {
        return parseInt(gemName.substr(gemName.indexOf('e:')+2), 10);
    },

    formatGemAssetUrl: function(color, power, spinning, shattering) {
        if (shattering) {
            spinning = false;
            power = 0;
        }
        var shatterStr = shattering ? 'Shattering' : '';
        var powerStr = power ? (power > 5 ? 'SuperPower' : 'Power') : '';
        var spinningStr = (spinning || !shattering && !power) ? 'Spinning' : '';
        var filename = 'Gem' + color + shatterStr + spinningStr + powerStr + '.png';
        var dir = 'http://static-akm.imvu.com/imvufiles/games/walkoff/images';
        var path = dir + '/' + filename;
        return 'url("' + path + '")';
    },

    stepGemFrame: function($gem, progress) {
        var spin = $gem.data('spin') || false;
        var spinning = $gem.data('spinning') || false;
        var shatter = $gem.data('shatter') || false;
        var shattering = $gem.data('shattering') || false;
        var frames = 15;
        var frame = Math.floor(progress / GEM_ANIMATION_PERIOD);
        var displayFrame = frame % frames;
        var color = $gem.data('color');
        var power = $gem.data('power') || 0;
        var timerId = $gem.data('timerId');
        
        if (spinning && !spin) {
            if ( !$gem.data('spindownStartFrame') ) {
                $gem.data('spindownStartFrame', frame);
                $gem.data('spindownStartDisplay', displayFrame);
                switch (displayFrame) {
                    case 2: case 3:
                        $gem.data('spindownTargetDisplay', 0);
                        break;
                    case 4: case 5:
                        $gem.data('spindownTargetDisplay', 7);
                        break;
                    case 9: case 10:
                        $gem.data('spindownTargetDisplay', 7);
                        break;
                    case 11: case 12: case 13:
                        $gem.data('spindownTargetDisplay', 15);
                        break;
                    case 0: default:
                        $gem.data('spindownTargetDisplay', displayFrame);
                        break;
                }
            }
            
            var spindownProgress = frame - $gem.data('spindownStartFrame');
            var spindownStart = $gem.data('spindownStartDisplay');
            var spindownTarget = $gem.data('spindownTargetDisplay');
            
            if ( spindownTarget < spindownStart ) {
                displayFrame = (spindownStart - spindownProgress) % frames;
            } else {
                displayFrame = (spindownStart + spindownProgress) % frames;
            }
            
            if ( spindownProgress >= Math.abs(spindownStart - spindownTarget) ) {
                $gem.data('spinning', false);
                displayFrame = 0;
                $gem.data('spindownStartFrame', 0);
            }
        } else if (shattering) {
            if (frame >= 15) {
                $gem.parent().remove();
                $gem.data('shattering', false);
            }
        }
        if (spin && !spinning) {
            $gem.data('spinning', true);
            frame = 0;
            displayFrame = 0;
        }
        if (shatter && !shattering) {
            $gem.data('shattering', true);
            frame = 0;
            displayFrame = 0;
        }
        
        $gem.toggleClass('filmstrip', $gem.data('spinning') || $gem.data('shattering') || !power);
        
        $gem.data('lastFrame', frame);
        $gem.data('lastDisplayFrame', displayFrame);
        $gem.css('background-position', -(displayFrame*100) + '% 0');
        $gem.css('background-image', this.formatGemAssetUrl(color, power, $gem.data('spinning'), $gem.data('shattering')));
        
        if ( !$gem.data('spinning') && !$gem.data('shattering') ) {
            this.animator.remove(timerId);
            $gem.data('timerId', false);
        }
    },

    getGemNexus: function(col, row) {
        var offset = this.$board.offset();
        var X = offset.left + col * this.gemDimension + this.gemDimension / 2;
        var Y = offset.top + row * this.gemDimension + this.gemDimension / 2;
        return [X, Y];
    },

    createGemElement: function(type, col, row) {
        var $gemHolder = this.$gemHolderTemplate.clone();

        $gemHolder.css({
            top: (row * this.gemDimension) + 'px',
            left: (col * this.gemDimension) + 'px',
            width: this.gemDimension + 'px',
            height: this.gemDimension + 'px'
        });
        this.initGem($gemHolder, type);

        return $gemHolder;
    },

    initGem: function($gemHolder, type) {
        var $gem = $('.gem', $gemHolder);
        var power = this.getGemPower(type);
        $gem.data('power', power);
        $gem.data('color', this.gemColorLookup[type.substr(0,1)]);
        if ($gem.data('timerId') === undefined) {
            $gem.data('timerId', false);
        }
        $gem.css('background-image', this.formatGemAssetUrl($gem.data('color'), $gem.data('power'), false));
        $gem.toggleClass('super', power > 5);
        $gem.toggleClass('filmstrip', !power);
    },

    setGemOnClick: function($gem, col, row) {
        $gem.unbind('mousedown');
        $gem.unbind('mousemove');
        $gem.unbind('mouseup');
    
        $gem.mousedown((function(c,r,event) {
            if (this.$stage.hasClass('clickable') && !this.actionRunning) {
                this.imvu.call('playSound', 'gem_click');
            }

            this.dragging = true;
            this.onClickGem(c, r, event);
        }).bind(this, col, row));
    
        $gem.mousemove((function(c,r,event) {
            if ( this.dragging && this.firstClick && (this.firstClick[0] !== c || this.firstClick[1] !== r) ) {
                this.onClickGem(c, r, event);
            }
        }).bind(this, col, row));
    
        $gem.mouseup((function(c,r,event) {
            this.dragging = false;
        }).bind(this, col, row));
    },

    startGemAnimating: function($gem) {
        if ($gem.data('timerId') === false) {
            var timerid = this.animator.add(new PerFrameCall(this.stepGemFrame.bind(this, $gem), 3600000 /* run for an hour if we let it go */));
            $gem.data('timerId', timerid);
        }
    },

    startGemSpinning: function(col, row) {
        var $gem = $('.gem', this.gemElements[col][row]);
        $gem.data('spin', true);
        this.startGemAnimating($gem);
    },

    stopGemSpinning: function(col, row) {
        var $gem = $('.gem', this.gemElements[col][row]);
        $gem.data('spin', false);
    },

    onClickGem: function(col, row, event) {
        if (this.$stage.hasClass('clickable') && !this.actionRunning) {
            if (this.firstClick === null) {
                this.firstClick = [col, row];
                this.startGemSpinning(col, row);
            } else if (this.firstClick[0] === col && this.firstClick[1] === row) {
                this.firstClick = null;
                this.stopGemSpinning(col, row);
            } else {
                this.lastMove = [[col, row], this.firstClick];
                this.firstClick = null;
                var xdiff = Math.abs(this.lastMove[0][0] - this.lastMove[1][0]);
                var ydiff = Math.abs(this.lastMove[0][1] - this.lastMove[1][1]);
                if (xdiff + ydiff === 1) {
                    this.sendMessage('swap', this.lastMove);
                    this.addAction({swap: this.lastMove});
                    this.setStageClickable(false);
                    this.stopGemSpinning(col, row);
                } else {
                    this.onClickGem(col, row);
                    this.stopGemSpinning(this.lastMove[1][0], this.lastMove[1][1]);
                    this.lastMove = null;
                }
            }
        }
    },
    
    playVictoryEffects: function() {
        var otherPlayer = this.getOpponentCid();

        this.imvu.call('triggerActionOnRoom', 'fireworks');
        this.imvu.call('triggerActionOnRoom', 'win', this.cid);
        this.imvu.call('triggerActionOnRoom', 'lose', otherPlayer);

        this.imvu.call('playSound', 'crowd_cheer');

        this.imvu.call('triggerActionOnAvatar', 'victory', this.cid);
        this.imvu.call('triggerActionOnAvatar', 'defeat', otherPlayer);
    },

    playDefeatEffects: function() {
        var otherPlayer = this.getOpponentCid();

        this.imvu.call('triggerActionOnRoom', 'lose', this.cid);
        this.imvu.call('triggerActionOnRoom', 'win', otherPlayer);
        
        this.imvu.call('playSound', 'you_lose');

        this.imvu.call('triggerActionOnAvatar', 'victory', otherPlayer);
        this.imvu.call('triggerActionOnAvatar', 'defeat', this.cid);
    },

    setStageClickable: function(clickable) {
        this.$stage.toggleClass('clickable', clickable);
        _.each(this.plaques, function (playerPlaques) {
            _.each(playerPlaques, function (plaque) {
                plaque.setIsCurrentPlayer(clickable);
            });
        });
    },

    makeGlowyTextCanvas: function(text, style) {
        var canvas = document.createElement("canvas");
        canvas.className = 'text_effect';
        canvas.appendChild(document.createTextNode(text)); // Testability hack. :( -- andy 17 April 2012
        var context = canvas.getContext("2d");
        context.font = style;

        var LINE_HEIGHT = 55;

        var width = 0;
        var lines = text.split('\n');
        var widths = [];
        var height = lines.length * LINE_HEIGHT;
        var i;
        for (i = 0; i < lines.length; ++i) {
            var s = context.measureText(lines[i]);
            widths.push(s.width);
            width = Math.max(width, s.width);
        }

        for (i = 0; i < lines.length; ++i) {
            widths[i] = (width - widths[i]) / 2;
        }

        canvas.style.width = canvas.width = width + 24;
        canvas.style.height = canvas.height = height;

        var x = 12;
        var y = height - 16;
        context.font = style;

        var j;
        j = lines.length - 1;
        for (i = 0; i < lines.length; ++i) {
            context.miterLimit = 4;
            context.lineWidth = 8;
            context.shadowBlur = 24;
            context.shadowColor = '#0FF';
            context.fillStyle = 'transparent';

            context.lineWidth = 8;
            context.strokeStyle = 'black';
            context.strokeText(lines[i], x + widths[i], y - (j * LINE_HEIGHT));
            --j;
        }

        j = lines.length - 1;
        for (i = 0; i < lines.length; ++i) {
            context.fillStyle = '#0FF';
            context.shadowBlur = 0;
            context.shadowColor = 'transparent';
            context.fillText(lines[i], x + widths[i], y - (j * LINE_HEIGHT));
            --j;
        }

        return canvas;
    },
    
    showText: function(text, duration, position, scale, floating, textStyle) {
        textStyle = textStyle || 'bold 50px Babyface';

        var canvas = this.makeGlowyTextCanvas(text, textStyle);

        var $canvas = $(canvas);

        if (!position) {
            var r = document.body.getBoundingClientRect();
            position = {
                left: r.right / 2,
                top: (r.bottom - canvas.height) / 2};
        } else {
            position.top -= canvas.height;
        }

        position.left -= canvas.width / 2;

        canvas.style.opacity = 0;
        canvas.style.position = 'absolute';
        canvas.style.left = position.left + 'px';
        canvas.style.top = position.top + 'px';

        if (scale) {
            this.animator.add(new ScaleAnimation(canvas, 1, 1.4, duration));
        }
        if (floating && position) {
            this.animator.add(
                new MoveAnimation(canvas,
                                  [position.left, position.top],
                                  [position.left, position.top - 15], duration));
        }

        this.animator.add(new FadeAnimation(canvas, 0, 1, duration * 0.35));
        this.animator.add(
            new DelayedCall(function() {
                this.animator.add(new FadeAnimation(canvas, 1, 0, duration * 0.25, function() { $canvas.remove(); }));
            }.bind(this), duration * 0.75)
        );

        this.$textContainer.append($canvas);
    },
    
    showMatch: function(match, freeTurn) {
        var matchSize = Math.max(match[2], match[3]);
        var extraText = '';
        
        this.matchesDisplayed += 1;

        var extraTime = 0;
        if (this.matchesThisTurn > 3 && this.matchesDisplayed === 4) {
            extraText = 'Amazing';
        } else if (this.matchesThisTurn === 3 && this.matchesDisplayed === 3) {
            extraText = 'Awesome';
        } else if (freeTurn && matchSize > 3) {
            extraText = 'Extra turn';
            extraTime = 1000;
        } else if (matchSize > 3) {
            extraText = "Kiss Off\nNo extra turn";
            extraTime = 1000;
        }
        
        var matchCol = match[1];
        var matchRow = match[0];
        var matchWidth = match[2];
        var textPos = this.textPosForGems([[matchCol, matchRow]], matchWidth / 2 + 0.5, -0.2);
        var matchText = "Match " + matchSize + (extraText.length ? '\n' + extraText : '');
        this.showText(matchText, 1000+extraTime, textPos, /* scale */ false, /* float */ true, /*style*/ 'bold 40px Babyface');
        
        if (matchSize >= 5) {
            this.addArcToGemFromLargeMatch(match[1], match[0], match[2], match[3]);
        }
    },

    actions: {
        "startgame": function (state) {
            this.$stage.find('.ready-waiting').hide();         
            this.setGameState(state);
            this.runNextAction();
        },

        "swap": function(move) {
            this.swapGems(move);
        },

        "remove": function(deadGems) {
            this.removeGems(deadGems);
        },
        
        "showMatches": function(params) {
            _.each(params.matchLocations, function(match) {
                this.showMatch(match, params.freeTurn);
            }, this);
            this.runNextAction();
        },

        "drop": function() {
            this.dropGems();
        },

        "clear": function() {
            this.clearBoard();
        },

        "update_gem": function (params) {
            var col = params[0];
            var row = params[1];
            var type = params[2];
            var cid = parseInt(params[3], 10);
            var source = params[4];
            var sourceGem = params[5];

            if (cid === this.getPlayerCid(1)) {
                this.setGem(col, row, type, 1, this.$leftStatus, source, sourceGem);
            } else if (cid === this.getPlayerCid(2)) {
                this.setGem(col, row, type, 2, this.$rightStatus, source, sourceGem);
            }
        },

        "inventory": function(change) {
            this.incomingInventory.push(change);
            this.runNextAction();
        },

        "setUpNextMove": function(params) {
            var cid = parseInt(params[0], 10);
            cid = isNaN(cid) ? null : cid;
            if (this.isPlayer(cid)) {
                var time = params[1];
                this.state.turn_time_seconds = time;
            } else {
                this.resetMatchCounter();
            }
            this.setUpNextMove(cid);
        },
    
        "resync": function(state) {
            this.resyncBoard(state);
            this.runNextAction();
        },
    
        "showText": function(params) {
            this.showText(params.text, params.textTime, params.position, params.scale, params.float, params.textStyle);
            this.animator.add( new DelayedCall(this.runNextAction.bind(this), params.blockingTime) );
        },
    
        "gameover": function(victor) {
            if (this.turnTimerCall) {
                this.animator.remove(this.turnTimerCall);
                this.turnTimerCall = false;
            }
            this.eventBus.fire('WalkOffGameEnd');
            this.gameOver = true;
            this.showTurnStatus = false;
            this.updateTurnIndicators();
            var victorCid = parseInt(victor[0], 10);
            var gameOverReason = victor[1];
            this.clearBoardQuick();

            this.imvu.call('finishedGame');
        
            if (gameOverReason === 'victory') {
                if (victorCid === this.cid) {
                    this.playVictoryEffects();
                    this.displayVictory();
                } else {
                    this.playDefeatEffects();
                    this.displayDefeat();
                }
            } else if (gameOverReason === 'opponent_left' || gameOverReason === 'opponent_timed_out') {
                this.imvu.call('removePlayerAvatar', this.getOpponentCid());
                this.displayDisconnect();
            } else if (gameOverReason === 'cancel') {
                // This should only happen if an opponent exits before players have
                // selected their moves.
                var inviteeCid = this.service.getInviteeCid();
                this.imvu.call('gameCancelled', inviteeCid);
                this.greenroom.hide();
                this.displayCancel();
            } else {
                // Should be unreachable, unless server protocol changes.
                this.displayCancel();
            }
            
            this.service.disconnect();
        },

        "movelist": function(moves) {
            var cid = parseInt(moves[0], 10);
            if (cid === this.getPlayerCid(1)) {
                this.p1moves = moves[1];
                this.updateStatusBar(1);
            } else if (cid === this.getPlayerCid(2)) {
                this.p2moves = moves[1];
                this.updateStatusBar(2);
            }
            this.runNextAction();
        },

        "effectlist": function(effects) {
            var cid = parseInt(effects[0], 10);
            if (cid === this.getPlayerCid(1)) {
                this.p1effects = effects[1];
                this.updateStatusBar(1);
            } else if (cid === this.getPlayerCid(2)) {
                this.p2effects = effects[1];
                this.updateStatusBar(2);
            }
            this.runNextAction();
        },

        'addenergy': function (params) {
            this.addEnergyNow(params['cid'], params['source'], params['amount'], params['locations']);
            this.runNextAction();
        },

        "wait": function (time) {
            this.animator.add(new DelayedCall(this.runNextAction.bind(this), time * 1000));
        },

        'animateAvatar': function(params){
            var cid = parseInt(params['cid'], 10);
            var otherCid = (cid === this.getPlayerCid(1))? this.getPlayerCid(2) : this.getPlayerCid(1);
            var trigger = '_match_' + ((params['matchSize'] < 5)? ''+params['matchSize']: '5plus');

            this.imvu.call('triggerActionOnAvatar', 'negative'+trigger, otherCid);
            this.imvu.call('triggerActionOnAvatar', 'positive'+trigger, cid);
            this.runNextAction();
        }
    },

    clearBoardQuick: function() {
        this.$board.html('');
    },
    
    addEnergyNow: function(cid, source, amount, rowColLocations) {
        cid = parseInt(cid, 10);
        if (cid === this.getPlayerCid(1)) {
            this.getPlayerState(1).energy = Math.min(this.getPlayerState(1).energy + amount, this.energyToWin);
            this.addArcToMeter(1, source, amount);
            this.animator.add(new DelayedCall(this.updateStatusBar.bind(this, 1), 300));
        }
        if (cid === this.getPlayerCid(2)) {
            this.getPlayerState(2).energy = Math.min(this.getPlayerState(2).energy + amount, this.energyToWin);
            this.addArcToMeter(2, source, amount);
            this.animator.add(new DelayedCall(this.updateStatusBar.bind(this, 2), 300));
        }
        
        if (amount > 0) {
            var colRowLocations = _.map(rowColLocations, function (p) { return [p[1], p[0]]; });
            this.showEnergyText(source, amount, colRowLocations);
        }
    },
    
    textPosForGems: function(gems, colOffset, rowOffset) {
        rowOffset = rowOffset || 0;
        colOffset = colOffset || 0;
        var pos = { top: 0, left: 0 };

        for (var i = 0; i < gems.length; i++) {
            var gemPos = this.getGemNexus(gems[i][0]-1, gems[i][1]-1);
            pos.left += gemPos[0];
            pos.top += gemPos[1];
        }
        pos.top /= gems.length;
        pos.left /= gems.length;
        
        pos.top += this.gemDimension * rowOffset;
        pos.left += this.gemDimension * colOffset;
        return pos;
    },
    
    showEnergyText: function(source, amount, locations) {
        var text = 'Style Points +' + amount;
        var style = 'bold 50px Babyface';
        var duration = 1500;
        var textLocation = {
            top: this.$board.offset().top + this.boardHeight/2 - this.gemDimension/2,
            left: this.$board.offset().left + this.boardWidth/2
        };
        
        if (source === 'match_cells') {
            duration = 1000;
            style = 'bold 40px Babyface';
            textLocation = this.textPosForGems(locations, 0, -0.5);
        } else if (source === 'skip_move') {
            textLocation.top -= 50;
            text = 'Skip Penalty\n' + text;
        } else if (this.effects && source in this.effects) {
            text = this.effects[source].name + '!\n' + text;
        }
        
        this.showText(text, duration, textLocation, /* scale */ false, /* float */ true, style);
    },

    addAction: function(action) {
        this.actionQueue.push(action);
        if (!this.actionRunning) {
            this.runNextAction();
        }
    },

    runNextAction: function() {
        this.fixGemPositions();
        if (this.actionQueue.length > 0) {
            var action = this.actionQueue.shift();
            for (var key in action) {
                if (key in this.actions) {
                    this.actionRunning = true;
                    this.actions[key].bind(this)(action[key]);
                } else {
                    this.imvu.call('log', 'WALKOFF *** Unknown action *** ' + key);
                }
            }
        } else {
            this.actionRunning = false;
        }
    },

    getGemLeftByColumn: function(col) {
        return this.boardWidth * (col * 0.123 + 0.0008);
    },

    getGemTopByRow: function(row) {
        return this.boardHeight * (row * 0.123 + 0.0008);
    },

    animateGems: function(gemList, timePerTile, callback) {
        var elements = [];
        var startPoses = [];
        var endPoses = [];
        var maxTime = 0;

        for (var index = 0; index < gemList.length; ++index) {
            var g = gemList[index];
            var $g = g.$gem;

            var position = $g.position();

            var tileSize = this.boardWidth * .123;
            var finalLeft = g.col * tileSize;
            var finalTop = g.row * tileSize;
            var leftDiff = finalLeft - position.left;
            var topDiff = finalTop - position.top;
            var distance = (leftDiff + topDiff) / tileSize; // Manhattan metric is identical to Euclidean for all use cases
            var duration = timePerTile * distance;

            maxTime = Math.max(duration, maxTime);

            elements  .push($g[0]);
            startPoses.push([position.left, position.top]);
            endPoses  .push([this.getGemLeftByColumn(g.col), this.getGemTopByRow(g.row)]);
        }

        if (callback === null || callback === undefined) {
            callback = this.runNextAction.bind(this);
        }

        var mm = new EaseInMoveMultiAnimation(
            elements,
            startPoses,
            endPoses,
            maxTime,
            callback
        );

        this.animator.add(mm);
    },

    fixGemPositions: function() {
        for (var col = 0; col < BOARD_COLUMNS; col++) {
            for (var row = 0; row < BOARD_ROWS; row++) {
                var $gem = this.gemElements[col][row];
                if ($gem !== null && this.$board.has($gem).length) {
                    var gemPosition = $gem.position();
                    var actualLeft = gemPosition.left;
                    var actualTop = gemPosition.top;
                    var expectedLeft = this.getGemLeftByColumn(col);
                    var expectedTop = this.getGemTopByRow(row);
                    var leftDiff = Math.abs(actualLeft - expectedLeft);
                    var topDiff = Math.abs(actualTop - expectedTop);
                    if (leftDiff > 0.1 || topDiff > 0.1) {
                        $gem.css({left: expectedLeft + 'px', top: expectedTop + 'px'});
                    }
                }
            }
        }
    },

    swapGems: function(swap) {
        var gem1Coords = swap[0];
        var gem2Coords = swap[1];
        var $gem1 = this.gemElements[gem1Coords[0]][gem1Coords[1]];
        var $gem2 = this.gemElements[gem2Coords[0]][gem2Coords[1]];

        var swaptmp = this.gemTypes[gem1Coords[0]][gem1Coords[1]];
        this.gemTypes[gem1Coords[0]][gem1Coords[1]] = this.gemTypes[gem2Coords[0]][gem2Coords[1]];
        this.gemTypes[gem2Coords[0]][gem2Coords[1]] = swaptmp;
        this.gemElements[gem1Coords[0]][gem1Coords[1]] = $gem2;
        this.gemElements[gem2Coords[0]][gem2Coords[1]] = $gem1;
        this.setGemOnClick($gem1, gem2Coords[0], gem2Coords[1]);
        this.setGemOnClick($gem2, gem1Coords[0], gem1Coords[1]);

        var swaps = [{$gem: $gem1, col: gem2Coords[0], row: gem2Coords[1]}, {$gem: $gem2, col: gem1Coords[0], row: gem1Coords[1]}];
        this.animateGems(swaps, GEM_SWAP_TIME_MSEC, null);
    },

    calculateBoundingBox: function(coords) {
        var leftCol = 8;
        var topRow = 8;
        var rightCol = -1;
        var bottomRow = -1;
        for (var i in coords) {
            var pos = coords[i];
            leftCol = Math.min(leftCol, pos[0]);
            topRow = Math.min(topRow, pos[1]);
            rightCol = Math.max(rightCol, pos[0]);
            bottomRow = Math.max(bottomRow, pos[1]);
        }
        var $topLeftGem = this.gemElements[leftCol][topRow];
        var $bottomRightGem = this.gemElements[rightCol][bottomRow];
        return {
            x: this.$board[0].offsetLeft + $topLeftGem[0].offsetLeft,
            y: this.$board[0].offsetTop + $topLeftGem[0].offsetTop,
            width: $bottomRightGem[0].offsetLeft + $bottomRightGem[0].offsetWidth - $topLeftGem[0].offsetLeft,
            height: $bottomRightGem[0].offsetTop + $bottomRightGem[0].offsetHeight - $topLeftGem[0].offsetTop
        };
    },

    getEnergyFromGem: function(col, row) {
        return parseInt(this.gemTypes[col][row].substr(4), 10) || 0;
    },

    removeGems: function(gemCoords) {
        var recentlyActivePlayer = this.getRecentlyActivePlayerNumber();
        var arcSources = [];
        for (var index in gemCoords) {
            var col = gemCoords[index][0];
            var row = gemCoords[index][1];
            if (this.gemElements[col][row] !== null) {
                var energy = this.getEnergyFromGem(col, row);
                if (energy > 0) {
                    arcSources.push({row: row, col: col, color: this.gemTypes[col][row].substr(0, 1), energy: energy});
                }
                var $gem = $('.gem', this.gemElements[col][row]);
                $gem.data('shatter', true);
                $gem.addClass('shattering');
                this.startGemAnimating($gem);
                this.gemElements[col][row] = null;
                this.gemTypes[col][row] = 'x';
            }
        }
        var sortArcSources = function(a, b) {
            return b.energy - a.energy;
        };
        arcSources.sort(sortArcSources);
        if (arcSources.length > 0) {
            var destXY = this.getEnergyMeterNexus(recentlyActivePlayer, this.getPlayerEnergy(recentlyActivePlayer));
            this.animator.add(new PerFrameCall(function(progress) {
                if (arcSources.length > 0) {
                    var arcSource = arcSources.shift();
                    var sourceXY = this.getGemNexus(arcSource.col, arcSource.row);
                    this.addArc(sourceXY, destXY, arcSource.color, arcSource.energy, this.timingConstants.gemShatterTime + this.timingConstants.gemDropTime - progress);
                }
            }.bind(this), this.timingConstants.gemShatterTime));
        }
        if (gemCoords.length > 3) {
            this.imvu.call('playSound', 'match_4');
        } else {
            this.imvu.call('playSound', 'match_3');
        }
        this.animator.add(new DelayedCall(function() {
            if (this.incomingInventory.length > 0) {
                var change = this.incomingInventory.shift();
                var cid = parseInt(change, 10);
                this.setInventory(cid === this.getPlayerCid(1) ? 1 : 2, change[1]);
            }
            this.runNextAction();
        }.bind(this), this.timingConstants['gemShatterTime']));
    },

    dropGems: function() {
        var moves = [];
        var clinks = [];
        var dropAmount, row, col, $gem;
        for (col = 0; col < BOARD_COLUMNS; col++) {
            for (row = BOARD_ROWS-1; row >= 0; row--) {
                $gem = this.gemElements[col][row];
                if ($gem !== null) {
                    dropAmount = 0;
                    while (row+dropAmount+1 < BOARD_ROWS && this.gemElements[col][row+dropAmount+1] === null) {
                        dropAmount++;
                    }
                    if (dropAmount > 0) {
                        this.gemElements[col][row] = null;
                        this.gemElements[col][row+dropAmount] = $gem;
                        this.gemTypes[col][row+dropAmount] = this.gemTypes[col][row];
                        this.gemTypes[col][row] = 'x';
                        this.setGemOnClick($gem, col, row+dropAmount);
                        moves.push({$gem: $gem, col: col, row: row+dropAmount});
                        if (jQuery.inArray(dropAmount, clinks) === -1) {
                            clinks.push(dropAmount);
                        }
                    }
                }
            }
        }
        var verticalOffset = -1;
        for (col = 0; col < BOARD_COLUMNS; col++) {
            for (row = BOARD_ROWS-1; row >= 0; row--) {
                if (this.gemElements[col][row] === null && row > verticalOffset) {
                    verticalOffset = row;
                }
            }
        }
        if (verticalOffset >= 0) {
            dropAmount = verticalOffset + 1;
            if (jQuery.inArray(dropAmount, clinks) === -1) {
                clinks.push(dropAmount);
            }
            for (row = BOARD_ROWS-1; row >= 0; row--) {
                for (col = 0; col < BOARD_COLUMNS; col++) {
                    if (this.gemElements[col][row] === null) {
                        if (this.incomingGems.length > 0) {
                            var type = this.incomingGems.shift();
                            $gem = this.createGemElement(type, col, row - verticalOffset-1);
                            this.setGemOnClick($gem, col, row);
                            this.$board.append($gem);
                            this.gemElements[col][row] = $gem;
                            this.gemTypes[col][row] = type;
                            moves.push({$gem: $gem, col: col, row: row});
                        }
                    }
                }
            }
        }
        this.animateGems(moves, this.timingConstants['gemDropTime']);
        jQuery.each(clinks, function(i, clink){
            this.animator.add( new DelayedCall(function() {
                this.imvu.call('playSound', 'gem_clink');
            }.bind(this), clink * this.timingConstants['gemDropTime']));
        }.bind(this));
    },

    addGems: function(gemList) {
        this.incomingGems = this.incomingGems.concat(gemList);
    },

    setGem: function(col, row, type, player, $statusBar, source, sourceGem) {
        var energy = this.getGemEnergyFromTypeString(type);
        if (source === 'match_cells' && sourceGem){
            this.addArcToGemFromGem(sourceGem[1] - 1, sourceGem[0] - 1, col, row, energy);
        } else if (energy > 0) {
            this.addArcToGem(player, col, row, source, energy);
        }
        this.gemTypes[col][row] = type;
        this.initGem(this.gemElements[col][row], type);
        this.state.board = this.getBoardString(); // prevent false positive resyncs

        this.runNextAction();
    },

    getGemEnergyFromTypeString: function (typeString) {
        var energyString = /e:(\d+)/.exec(typeString);
        if (energyString && energyString.length >= 2) {
            return parseInt(energyString[1], 10);
        } else {
            return 0;
        }
    },

    clearBoard: function() {
        var deadGems = [];
        for (var col = 0; col < BOARD_COLUMNS; col++) {
            for (var row = BOARD_ROWS-1; row >= 0; row--) {
                if (this.gemElements[col][row] !== null) {
                    deadGems.push({$gem: this.gemElements[col][row], col: col, row: row+BOARD_ROWS});
                    this.gemElements[col][row] = null;
                    this.gemTypes[col][row] = 'x';
                }
            }
        }

        if (deadGems.length === 0) {
            this.runNextAction();
            return;
        }
        var callback = function() {
            for (var i = 0; i < deadGems.length; i++) {
                deadGems[i].$gem.remove();
            }
            this.runNextAction();
        };
        this.animateGems(deadGems, this.timingConstants['gemDropTime'], callback.bind(this));
    },

    setInventory: function(player, gems) {
        if (player === 1) {
            this.p1inventory = gems;
        } else {
            this.p2inventory = gems;
        }
        this.updateStatusBar(player);
    },

    setGameState: function (state) {
        state.player1 = JSON.parse(state.player1);
        state.player2 = JSON.parse(state.player2);

        state.player1.energy = parseInt(state.player1.energy, 10);
        state.player2.energy = parseInt(state.player2.energy, 10);

        this.state = state;
        if ( state.board ) {
            this.rebuildBoard(state.board.split(','));
        }

        this.updateStatusBar(1);
        this.updateStatusBar(2);
    },

    resyncBoard: function(state) {
        if (state.board !== undefined && this.getBoardString() !== state.board) {
            this.imvu.call('recordFact', 'WalkOff Board Out of Sync', {});
            board = state.board.split(",");
            for (var col = 0; col < BOARD_COLUMNS; col++) {
                for (var row = 0; row < BOARD_ROWS; row++) {
                    var type = "";
                    if ( board[col*BOARD_ROWS + row] ) {
                        var type = board[col*BOARD_ROWS + row];
                    }
                    this.gemTypes[col][row] = type;
                    this.initGem(this.gemElements[col][row], type);
                }
            }
            this.$oosMessage.css('opacity', 1);
            this.$oosMessage.show();
            this.animator.add(new FadeAnimation(this.$oosMessage[0], 1, 0, 3000, function () { this.$oosMessage.hide(); }.bind(this)));
        }
        while ( this.incomingInventory.length > 0 ) {
            var change = this.incomingInventory.shift();
            var cid = parseInt(change[0], 10);
            this.setInventory(cid === this.getPlayerCid(1) ? 1 : 2, change[1]);
        }
        //TODO: deal with inventory?
    },

    displayVictory: function() {
        this.showCrowd();
        this.setupGameOverDialog('won');
    },

    displayDefeat: function() {
        this.showCrowd();
        this.setupGameOverDialog('lost');
    },
    
    displayDisconnect: function() {
        this.showCrowd();
        this.setupGameOverDialog('opponent_disconnected');
    },

    hidePlaques: function() {
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < this.plaques[0].length; j++) {
                var plaque = this.plaques[i][j];
                plaque.setMoveId(null);
                plaque.update();
            }
        }
    },

    setupGameOverDialog: function(reason) {
        var $dialog = this.$game.find('.end-game-dialog');
        this.hidePlaques();
        $dialog.removeClass('notify-unlock');

        var messageMap = {
            won: { text: _T('you win!'), font_size: 40, padding_top: 9},
            lost: { text: _T('you lose!'), font_size: 40, padding_top: 9},
            opponent_disconnected: { text: _T('abandoned game'), font_size: 32, padding_top: 15}
        };
        this.$endGameMessage.show().text(messageMap[reason].text);
        this.$endGameMessage.css('font-size', messageMap[reason].font_size);
        this.$endGameMessage.css('padding-top', messageMap[reason].padding_top);

        $dialog.toggleClass('show-summary', this.gameSummary !== null);
        $dialog.toggleClass('victor', reason !== 'lost');
        $dialog.toggleClass('abandoned', reason === 'opponent_disconnected');

        var vipUpsellReason = 'post_game';
        this.leaderboard = new Leaderboard(this.$leaderboard, this.$mode, this.imvu, this.service.network, vipUpsellReason);
        this.leaderboard.showSideTab();
        this.$leaderboard.show();
        
        if (this.gameSummary !== null) {
            $dialog.find('.summary .total-score').text(IMVU.Client.util.number_format(this.gameSummary.game_style));
            if (this.gameSummary.game_high_scores) {
                
                var $newHighScoreLabel = $('.end-game-dialog .high-score-content .label');
                if (this.imvu.call('isGlobalLeaderboardVIPOnly')) {
                    $newHighScoreLabel.html(_T('New High Score on the VIP Leaderboard'));
                } else {
                    $newHighScoreLabel.html(_T('New High Score on the IMVU Leaderboard'));
                }
                
                this.timer.setTimeout(function() {this.leaderboard.slideOut();}.bind(this), 4000);
                
                $dialog.find('.summary .total-desc').addClass('new-high-score');
                this.imvu.call('playSound', 'new_high_score');
            }
        }
        
        if (this.newPowerMoves.length > 0) {
            var move = this.newPowerMoves[0];
            var iconUrl = this.getPowerMoveIconUrl(move);
            var name = this.getMoveName(move);
            if (iconUrl && name) {
                var color = this.getMoveColorId(this.powerMoves[move]);
                
                var gemColor = {
                    'b':'#0CF',
                    'g':'#4F4',
                    'r':'#F33',
                    'p':'#F6F',
                    'y':'#FF0'
                };
                
                var $rewardBox = $('.reward-box', $dialog);
                $('.icon .move-icon', $rewardBox).css('background-image', 'url(' + iconUrl + ')');
                $('.icon .background-color', $rewardBox).css('background-color', gemColor[color]);
                $('.name', $rewardBox).html(name);
                var descr = this.getMoveDescription(move) || '';
                $('.descr', $rewardBox).html(descr);
                $dialog.addClass('notify-unlock');
            }
        }
        
        var otherPlayer = this.getOpponentCid();
        if (reason !== 'opponent_disconnected' && this.imvu.call('shouldShowAddFriendButton', otherPlayer)) {
            var $addFriendLink = $dialog.find('.add-friend');
            $addFriendLink.click(function() {
                $addFriendLink.addClass('sent');
                $addFriendLink.text('Friend request sent!');
                this.imvu.call('addBuddy', this.getOpponentCid(), 'walkoff');
            }.bind(this, $addFriendLink));
            
            var otherName = '';
            if (otherPlayer === this.getPlayerCid(1)) {
                otherName = this.getPlayerName(1);
            } else {
                otherName = this.getPlayerName(2);
            }
            
            $addFriendLink.find('.add-friend-name').text(otherName);
            $addFriendLink.show();
        } else {
            $dialog.find('.add-friend').hide();
        }

        var $button = $('.score-breakdown-button', $dialog);
        $('.in-board .score-breakdown-button.small-button').click(function(){
            if (this.trayIsMoving) {
                return;
            }
            if (this.trayIsShowing) {
                this.slideTrayIn($dialog, $button);
            } else {
                this.slideTrayOut($dialog, $button);
            }
        }.bind(this));
        $('.score-breakdown .close').click(function() {
            if (!this.trayIsMoving && this.trayIsShowing) {
                this.slideTrayIn($dialog, $button);
            }
        }.bind(this));
        $dialog.show();
    },

    positionScoreBreakdownTray: function() {
        // :( magic numbers --
        this.$scoreBreakdownTray.css('left', 1.15*this.$board.width());
        this.$scoreBreakdownTray.css('top', 0.2*this.$board.height()+50);
    },

    slideTrayOut: function($dialog, $button) {
        this.trayIsMoving = true;
        this.loadScoreBreakdownTray();
        this.positionScoreBreakdownTray();
        this.$scoreBreakdown.css('left', -189);
        this.$scoreBreakdownTray.show();
        var $pane = this.$game.find('.score-breakdown .scroll-pane');
        $pane.jScrollPane();
        this.$scoreBreakdown.animate({
            left: -2
        }, 300, function() {
            this.trayIsMoving = false;
            $button.html(_T('hide score details'));
            this.trayIsShowing = true;
        }.bind(this));
    },

    slideTrayIn: function($dialog, $button) {
        this.trayIsMoving = true;
        this.$scoreBreakdown.animate({
            left: -189
        }, 300, function() {
            this.trayIsMoving = false;
            this.$scoreBreakdownTray.hide();
            $button.html(_T('see score details'));
            this.trayIsShowing = false;
        }.bind(this));
    },

    loadScoreBreakdownTray: function() {
        var $pane = $('<div class="scroll-pane"></div>');
        this.$scoreBreakdownScrollArea.html('');
        this.$scoreBreakdownScrollArea.append($pane);
        $pane.append(this.scoreBreakdownDetail(_T('move'), _T('points')).addClass('header'));
        this.$scoreBreakdown.find('.box-bottom').hide();
        if (this.gameSummary) {
            var breakdown = this.gameSummary.breakdown;
            for (idx in breakdown) {
                var name = breakdown[idx].name;
                var points = breakdown[idx].points;
                $pane.append(this.scoreBreakdownDetail(name, points));
            }

            if (this.gameSummary.multiplier) {
                var multiplierData = this.gameSummary.multiplier;
                var multiplierDesc = multiplierData.tag || 'Multiplier';
                $pane.append(this.scoreBreakdownDetail(multiplierDesc, multiplierData.multiplier));
            }

            if ($pane.find('.detail').length > 9) {
                this.$scoreBreakdown.find('.box-bottom').show();
            }
        }
    },

    scoreBreakdownDetail: function(label, value) {
        return $('<div class="detail"><div class="move">'+label+'</div><div class="points">'+value+'</div></div>');
    },
    
    showCrowd: function () {
        this.$crowd.show();
        var crowdheight = this.$crowd.height();
        var boardBottom = $(window).height() - (this.boardHeight + this.$board.position().top);
        
        this.animator.add(new PerFrameCall(function(prog) {
            var dist = Math.min(crowdheight, boardBottom) * (prog / CROWD_ANIMATION_SHOW_TIME);
            this.$crowd.css('bottom', (-crowdheight + dist) + 'px');
        }.bind(this), CROWD_ANIMATION_SHOW_TIME));
    },
    
    hideCrowd: function() {
        var crowdheight = this.$crowd.height();
        
        this.animator.add(new PerFrameCall(function(prog) {
            var dist = crowdheight * (prog / CROWD_ANIMATION_HIDE_TIME);
            this.$crowd.css('bottom', (0 - dist) + 'px');
        }.bind(this), CROWD_ANIMATION_HIDE_TIME, function() { this.$crowd.hide(); }.bind(this)));
    },

    displayCancel: function() {
        this.$game.find('.cancel-dialog').show();
    },

    displayDecline: function () {
        this.greenroom.hide();
        this.eventBus.fire('WalkOffGameEnd');
        this.$game.find('.decline-dialog').show();
    },

    sendMessage: function(key, value) {
        this.service.sendMessage(key, value);
    },
    
    showTurnText: function(cid) {
        var name;
        if (cid === this.getPlayerCid(1)) {
            name = this.player1Name;
        } else if (cid === this.getPlayerCid(2)) {
            name = this.player2Name;
        } else {
            return;
        }

        var msg = name + '\n' + (this.startTextShown ? 'GO!' : 'Start!');
        this.startTextShown = true;
        this.addAction({showText:{
            scale: true,
            float: false,
            text: msg,
            textTime: this.timingConstants['goMessageTime'],
            blockingTime: this.timingConstants['goMessageTime'] * 0.75,
            textStyle: 'bold 50px Babyface'}});
    },

    handlers: {
        "startgamesetup": function (info) {
            // TODO validate info.
            var cids = info['cids'];
            cids = _.map(cids, function (num) { return parseInt(num, 10); });

            var cid1 = parseInt(cids[0], 10);
            var cid2 = parseInt(cids[1], 10);
            var otherCid = (cid1 === this.cid) ? cid2 : cid1;

            this.imvu.call('addPlayerAvatar', this.cid, 1);
            this.imvu.call('addPlayerAvatar', otherCid, 2);

            // Need cids set for status bar update.
            this.state.player1 = { cid: cids[0] };
            this.state.player2 = { cid: cids[1] };

            this.timingConstants = {
                setupTime: info['setup_time'],
                goMessageTime: info['go_message_time'],
                gemShatterTime: info['gem_shatter_time'],
                gemDropTime: info['gem_drop_time']
            };

            this.requestPlayerName(this.cid);
            this.requestPlayerName(otherCid);

            this.greenroom.setPlayerLevel(info[this.cid]['level']);
            this.greenroom.setSelection(info[this.cid]['moves'].split(','));
        
            this.greenroom.setDescriptions(this.powerMoves);
            this.greenroomActive = true;
            this.greenroom.startGame();
        },

        "startgame": function (state) {
            this.newPowerMoves = [];
            this.gameSummary = null;
            this.addAction({startgame: state});
        },

        "swap": function(move) {
            if ( !_.isEqual(this.lastMove, move) ) {
                this.addAction({swap: move});
            }
            this.lastMove = null;
        },

        "remove": function(deadGems) {
            this.addAction({remove: deadGems});
            this.addAction({drop: null});
            this.countdown.stop();
        },

        "match": function(params) {
            var matchLocations = params[0];
            var cid = params[1];
            var freeTurn = params[2];
            var largestMatch = 0;
            
            this.matchesThisTurn += matchLocations.length;
            
            _.each(matchLocations, function(match){
                largestMatch = Math.max(largestMatch, match[2]);
                largestMatch = Math.max(largestMatch, match[3]);
            }, this);
            this.addAction({showMatches: {'matchLocations': matchLocations, 'freeTurn': freeTurn}});
            this.addAction({animateAvatar: {'cid':cid, 'matchSize':largestMatch}});
        },

        "add": function(newGems) {
            this.addGems(newGems.split(","));
        },

        "newboard": function(params) {
            var board = params[0];
            var reason = params[1];
            this.rebuildBoard(board.split(","), reason);
            if (reason === "hot_mess") {
                this.addAction({wait: 1.4});
            }
        },
    
        "badswap": function(params) {
            var move = [params[0], params[1]];
            this.imvu.call('playSound', 'bad_swap');
            var pos = this.textPosForGems(move, 1, -0.5);
            this.showText('Illegal Move', 750, pos, /* scale */ false, /* float */ true, 'bold 40px Babyface');
            
            var cid = parseInt(params[2], 10);
            var active = cid ? cid : this.getPlayerCid(1);
            var other = (active === this.getPlayerCid(1)) ? this.getPlayerCid(2) : this.getPlayerCid(1);
            
            this.imvu.call('triggerActionOnAvatar', 'miss_a_move', parseInt(active, 10));
            this.imvu.call('triggerActionOnAvatar', 'miss_a_move_opponent', parseInt(other, 10));
            if (_.isEqual(this.lastMove, move)) {
                this.addAction({swap: move});
                this.lastMove = null;
            } else {
                this.addAction({swap: move});
                this.addAction({swap: move}); 
            }
            this.addAction({wait: 1});
        },
    
        "silentbadswap": function(move) {
            if (_.isEqual(this.lastMove, move)) {
                this.addAction({swap: move});
                this.lastMove = null;
            }
        },
        
        "crystal_gem_reveal": function(params) {
            var revealed_gems = params[0];
            var rowColLocations = params[1];
                        
            var color = _.keys(revealed_gems)[0];
            var count = revealed_gems[color];
            var msg = count + ' ' + this.gemColorLookup[color] + ' Gems';
            
            var colRowLocations = _.map(rowColLocations, function (p) { return [p[1], p[0]]; });
            this.addAction({showText:{
                scale: false,
                float: true,
                text: msg,
                position: this.textPosForGems(colRowLocations, 0, 0.5),
                textTime: 750,
                blockingTime: 0,
                textStyle: 'bold 40px Babyface'}});
        },

        "inventory": function(change) {
            this.addAction({inventory: change});
        },

        "update_gem": function(info) {
            this.addAction({update_gem:info});
        },

        "powermove": function(powerMove) {
            var move = powerMove[0];
            var moveUser = Number(powerMove[1]);
            if (move in this.powerMoves) {
                if (this.powerMoves[move]['assets']['player_trigger']) {
                    this.imvu.call('triggerActionOnAvatar', this.powerMoves[move]['assets']['player_trigger'], moveUser);
                }
                if (this.powerMoves[move]['assets']['sound']) {
                    this.imvu.call('playSoundUrl', this.assetUrl + this.powerMoves[move]['assets']['sound']);
                } else {
                    this.imvu.call('playSound', 'use_power_move');
                }
                this.addAction({setUpNextMove:['nobody', 0]});
                this.addAction({wait: Number(powerMove[2])});
            } else {
                this.imvu.call('showErrorDialog', _T("Error"), _T("Received invalid power move."));
            }
            if (this.powerMoves[move]['assets']['jumbotron_trigger']) {
                this.imvu.call('triggerActionOnRoom', this.powerMoves[move]['assets']['jumbotron_trigger'], moveUser);
            }
        },

        "newpowermoves": function(params) {
            var cid = params[0];
            if (cid === this.cid) {
                this.newPowerMoves = params[1];
            }
        },
        
        "game_summary": function(summary) {
            if (summary[this.cid]) {
                this.gameSummary = summary[this.cid];
            }
        },

        "gameover": function(victor) {
            this.addAction({setUpNextMove:['nobody', 0]});
            this.addAction({gameover:victor});
            this.countdown.stop();
        },
    
        "taketurn": function(params) {
            var cid = parseInt(params[0], 10);
            this.showTurnText(cid);
            this.addAction({setUpNextMove:params});
        },
    
        "resync": function(state) {
            this.addAction({resync:state});
        },

        "movelist": function(params) {
            // TODO update plaque enabled status.  Buttons need to know asap what state to go to.
            this.addAction({movelist:params});
        },

        "effectlist": function(params) {
            this.addAction({effectlist:params});
        },

        "addenergy": function (params) {
            if (params['source'] in this.p1moves || params['source'] in this.p2moves) {
                this.addEnergyNow(params['cid'], params['source'], params['amount'], params['locations']);
            }
            else{
                this.addAction({addenergy:params});
            }
        }
    },

    onGreenroomReady: function(chosenMoves) {
        this.greenroomActive = false;
        this.$stage.find('.ready-waiting').show();
        var moveString = chosenMoves.join(',');
        this.sendMessage('choosemoves', moveString);
    },

    onGreenroomClose: function() {
       this.greenroomActive = false;
       this.closeGame();
    },

    onGreenroomInviteTimeout: function () {
        this.service.disconnect();
        $dialog = this.$game.find('.invite-timeout-dialog');
        $dialog.show();

        var inviteeCid = this.service.getInviteeCid();
        var inviterCid = this.service.getInviterCid();
        if ( inviteeCid ) {
            $dialog.find('.title.inviter').show();
            this.imvu.call('greenroomInviteTimeout', inviteeCid);
        } else if ( inviterCid ) {
            $dialog.find('.title.invitee').show();
        }
    },

    handleQuickmatch: function () {
        this.closeGame({next: 'quickmatch'});
    },

    handleInvite: function () {
        this.closeGame({next: 'invite'});
    },

    handleInviteAgain: function () {
        this.closeGame({
            next: 'inviteAgain',
            inviteeCid: this.service.getInviteeCid()
        });
    },

    closeGame: function (config) {
        if (config === undefined) {
            config = {};
        }
        this.eventBus.fire('WalkOffGameEnd');
        this.service.disconnect();
        this.$game.remove();
        this.animator.removeAll();
        this.timer.clearAll();
        this.imvu.call('leaveChat');

        if (this.gameSummary && this.gameSummary.game_high_scores) {
            config = $.extend(config, {hasNewHighScores: true});
        }

        this.callbacks.onCloseGame(config);
    },

    handleCommand: function(key, param) {
        if ( key in this.handlers ) {
            this.handlers[key].bind(this)(param);
        }
    },
    
    isPlayer: function(cid) {
        return (cid === this.getPlayerCid(1) || cid === this.getPlayerCid(2));
    },

    setUpNextMove: function(cid) {
        if (this.gameOver) {
            return;
        }
        this.setStageClickable(cid === this.cid);
        this.recentlyActivePlayer = this.activePlayer;
        this.activePlayer = cid;

        this.countdown.stop();
        if (this.isPlayer(cid)) {
            var myTurn = this.cid === this.activePlayer;
            this.imvu.call('showTurn', this.cid, myTurn);
            this.imvu.call('showTurn', this.getOpponentCid(), !myTurn);
            this.showTurnStatus = true;
            this.countdown.start(this.state.turn_time_seconds);
        } else {
            this.imvu.call('showTurn', this.cid, false);
            this.imvu.call('showTurn', this.getOpponentCid(), false);
            this.showTurnStatus = false;
        }
    
        this.updateCountdownShowing();
        this.updateTurnIndicators();
    
        if (this.turnTimerCall){
            this.animator.remove(this.turnTimerCall);
        }
        this.turnTimerCall = this.animator.add(new DelayedCall(this.ping.bind(this), this.state.turn_time_seconds * 1000));
        
        this.updateStatusBar(1);
        this.updateStatusBar(2);
        if (this.firstClick !== null) {
            this.stopGemSpinning(this.firstClick[0], this.firstClick[1]);
            this.firstClick = null;
        }
        
        this.timer.setTimeout(this.runNextAction.bind(this), 1); // advance the action queue, but don't block
    },

    ping: function () {
        this.sendMessage('ping', 'whatever');
        this.turnTimerCall = this.animator.add(new DelayedCall(this.ping.bind(this), 500));
    },

    // HUD layout

    setCanvasArea: function (w, h) {
        h = Math.max(SCREEN_MIN_PIXEL_H, h);

        var stageH = STAGE_PIXEL_H * h / SCREEN_MIN_PIXEL_H;
        var stageW = STAGE_PIXEL_W * stageH / STAGE_PIXEL_H;
        this.setStageSize(stageW, stageH);
        this.greenroom.setStageSize(stageW, stageH);
        var stageTopOffset = 22 * h / SCREEN_MIN_PIXEL_H;
        var stageLeftOffset = 3 - stageW / 2 + w / 2;
        this.greenroom.setStageOffset(stageTopOffset, stageLeftOffset);
        this.setStageOffset(stageTopOffset, stageLeftOffset);
        if (!this.gameOver) {
            this.fixGemPositions();
        }
    },

    setStageSize: function (stageW, stageH) {
        this.$stage.css({
            height: Math.round(stageH) + 'px',
            width: Math.round(stageW) + 'px'
        });

        var boardW = BOARD_PIXEL_W * stageW / STAGE_PIXEL_W;

        this.$board.css({
            height: Math.round(boardW) + 'px',
            width: Math.round(boardW) + 'px'
        });
        this.$outerBoard.css({
            height: Math.round(boardW) + 'px',
            width: Math.round(boardW) + 'px'
        });

        this.boardWidth = this.$board.width();
        this.boardHeight = this.$board.height();

        var centerOffset = 3 * stageW / STAGE_PIXEL_W;
        var boardOffsetX = (stageW - boardW) / 2 + centerOffset;
        var boardOffsetY = 73 * stageW / STAGE_PIXEL_W;

        this.$board.css({
            left: Math.round(boardOffsetX) + 'px',
            top: Math.round(boardOffsetY) + 'px'
        });

        var stageVisiblePixelH = 488;

        this.$turnStatus.css({
            left: Math.round((stageW/2) - (this.$turnStatus.width()/2) + centerOffset)+'px',
            bottom: Math.round(stageVisiblePixelH * stageH / STAGE_PIXEL_H) + 'px'
        });

        var plaquePixelH = 70;
        var plaqueTop = plaquePixelH * stageH / STAGE_PIXEL_H;
        var plaquePixelIndent = 47;
        var plaqueIndent = -95 + plaquePixelIndent * stageW / STAGE_PIXEL_W;
        this.$leftPlaqueHolder.css({
            left: Math.round(plaqueIndent) + 'px',
            top: Math.round(plaqueTop) + 'px'
        });
        this.$rightPlaqueHolder.css({
            right: Math.round(plaqueIndent) + 'px',
            top: Math.round(plaqueTop) + 'px'
        });

        this.gemDimension = Math.round(this.boardWidth * 0.123);
        this.$board.find('.gem_holder').css({width:this.gemDimension+'px', height:this.gemDimension+'px'});
    },

    setStageOffset: function(t, l) {
        this.$stage.css({
            top: Math.round(t) + 'px',
            left: Math.round(l) + 'px'
        });

        this.$qaPanel.css('left', Math.round(l + (this.$stage.width()/2) - (this.$qaPanel.width()/2))+'px');
        this.positionScoreBreakdownTray();
    },

    makeSpacesNonBreakable: function(name) {
        return name.replace(new RegExp(" ", "g"), "&nbsp;");
    },

    requestPlayerName: function (cid) {
        this.imvu.call('getAvatarNameById', cid, 'IMVU.Client.WalkOffMode.setPlayerName.bind(IMVU.Client.WalkOffMode)');
    },

    setPlayerName: function(cid, name) {
        var escapedName = this.makeSpacesNonBreakable(name);

        if (this.getPlayerCid(1) === cid) {
            this.player1Name = escapedName;
            this.updateStatusBar(1);
        }
        if (this.getPlayerCid(2) === cid) {
            this.player2Name = escapedName;
            this.updateStatusBar(2);
        }
        
        if (this.service.getInviteeCid() === cid || this.service.getInviterCid() === cid) {
            this.$game.find('.decline-dialog .title .name').text(escapedName);
            this.$game.find('.invite-timeout-dialog .title .name').text(escapedName);
        }
    },

    getPlayerName: function(player) {
        var name = '';
        if (player === 1) {
            name = this.player1Name;
        } else if (player === 2) {
            name = this.player2Name;
        }
        return name;
    },

    getPlayerEnergy: function(player) {
        var energy = 0;
        if (player === 1 && this.getPlayerState(1) && this.getPlayerState(1).energy) {
            energy = this.getPlayerState(1).energy;
        } else if (player === 2 && this.getPlayerState(2) && this.getPlayerState(2).energy) {
            energy = this.getPlayerState(2).energy;
        }
        return energy;
    },

    getPlayerMoves: function(player) {
        if (player === 1) {
            return this.p1moves;
        } else if (player === 2) {
            return this.p2moves;
        } else {
            return [];
        }
    },

    getPlayerInventory: function(player) {
        if (player === 1) {
            return this.p1inventory;
        } else if (player === 2) {
            return this.p2inventory;
        } else {
            return null;
        }
    },

    getPlayerInventoryShown: function(player) {
        if (player === 1) {
            return this.p1inventoryShown;
        } else if (player === 2) {
            return this.p2inventoryShown;
        } else {
            return null;
        }
    },

    updateStatusBar: function(player, deferred) {
        var $statusBar;
        var leftToRight;
        if (!deferred) {
            if ((player === 1 && this.updateStatusBarPlayer1Pending) || (player === 2 && this.updateStatusBarPlayer2Pending)) {
                return;
            }
        }
        if ((this.cid === this.getPlayerCid(1) && player === 1) || (this.cid === this.getPlayerCid(2) && player === 2)) {
            $statusBar = this.$leftStatus;
            leftToRight = true;
        } else {
            $statusBar = this.$rightStatus;
            leftToRight = false;
        }
        $('.name', $statusBar).text(this.getPlayerName(player));

        var cid = (player === 1) ? this.getPlayerCid(1) : this.getPlayerCid(2);
        $('.add-friend', $statusBar).remove();
        if (this.imvu.call('shouldShowAddFriendButton', cid)){
            $addFriendButton = $('<div class="add-friend">add friend</div>');
            $statusBar.append($addFriendButton);
            $addFriendButton.click(function(){
                this.imvu.call('addBuddy', cid, 'walkoff');
                $addFriendButton.remove();
            }.bind(this));
        }
        
        this.updateEffectIcons($statusBar, player === 1 ? this.p1effects : this.p2effects);
        this.updateEnergyMeter($statusBar, leftToRight, this.getPlayerEnergy(player), this.energyToWin);
        this.updatePlaques(player);
    },

    updateEffectIcons: function($statusBar, effects) {
        var slot = 0;
        var $icons = $statusBar.find('.effect-icon');
        
        $icons.css('background', 'transparent');
        $icons.find('.tooltip').html('');
        
        for (var i in effects) {
            effect_key = effects[i]['effect'];
            effect_duration = effects[i]['duration'];
            
            if ( effect_key in this.effects && 'icon' in this.effects[effect_key]['assets'] ) {
                var iconUrl = this.assetUrl + this.effects[effect_key]['assets']['icon'];
                var descr = this.effects[effect_key]['descr'];
                $($icons[slot]).css('background-image', 'url(' + iconUrl + ')');
                $($icons[slot]).find('.tooltip', $statusBar).html(descr);
                ++slot;
            }
            
            if ( slot >= 6 ) {
                // we only have six slots
                break;
            }
        }
    },

    initializeEnergyMeterMetrics: function() {
        var barHeight = this.$energyMeterTemplate.find('.bar')[0].height;

        var capRadius = barHeight / 2.0;
        var bevel = 25 * Math.PI / 180;  // 25 degrees in radians

        this.bevelDistance = barHeight * Math.tan(bevel); // pixel width of bevelled end
        // The next two parameters are used to make sure that the bevelled power indicator enters the capped end
        // just at percent = 0, and completely fills the opposite capped end just at percent = 100
        this.leftInset = capRadius * (1 - Math.tan(Math.PI/4 - bevel/2)) - 2;
        this.rightOutset = capRadius * (Math.tan(Math.PI/4 + bevel/2) - 1) + 1;
    },

    addAlphaToColor: function(color, alpha) {
        color = color.replace(/ /g, '');
        if (color.substring(0, 4) !== 'rgb(' ||
            color.substring(color.length-1, color.length) !== ')') {
            return color;
        }
        return 'rgba('+color.substring(4, color.length-1)+','+alpha+')';
    },

    getEnergyMeterNexus: function(player, energy) {
        var $bar, energyOffset;
        if (this.getPlayerIndex(player) === 0) {
            $bar = $('.energy_meter .bar', this.$leftStatus);
            energyOffset = $bar.width() * energy / 100;
        } else {
            $bar = $('.energy_meter .bar', this.$rightStatus);
            energyOffset = $bar.width() * (100-energy) / 100;
        }
        var offset = $bar.offset();
        var height = $bar.height();
        var X = offset.left + energyOffset;
        var Y = offset.top + height / 2;
        return [X, Y]
    },

    updateEnergyMeter: function($statusBar, leftToRight, energy, energyToWin) {
        $('.energy_meter', $statusBar).remove();
        var $meter = this.$energyMeterTemplate.clone().appendTo($statusBar);
        var meterGradient = ['#272727', '#404040'];
        $meter.css('backgroundImage', 'none');
        var $label = $('.label', $meter);
        var $bar = $('.bar', $meter);
        var barGradient = ['#FFFFFF', '#13A4DF'];
        var barGlow = $bar.css('color');
        $bar.css('background', 'none');
        var bar = $bar[0];
        // Make room for glow
        var indicatorHeight = bar.height;
        var indicatorWidth = bar.width;
        var indicatorRange = bar.width + this.rightOutset - this.leftInset;
        var indicatorLeft = this.leftInset + (1 - (energy/energyToWin)) * indicatorRange;

        var offset = 6;
        bar.height += 2 * offset;
        bar.width += 2 * offset;
        var capRadius = indicatorHeight / 2.0;
        var ctx = bar.getContext('2d');
        var bg = ctx.createLinearGradient(0, 0, 0, indicatorHeight);
        bg.addColorStop(0, meterGradient[0]);
        bg.addColorStop(1, meterGradient[1]);
        var fg = ctx.createLinearGradient(0, offset, 0, offset+indicatorHeight);
        fg.addColorStop(0, barGradient[0]);
        fg.addColorStop(0.15, barGradient[0]);
        fg.addColorStop(0.85, barGradient[1]);
        fg.addColorStop(1, barGradient[1]);
        var factor = this.bevelDistance * indicatorHeight / (this.bevelDistance * this.bevelDistance + indicatorHeight * indicatorHeight);
        var vg = ctx.createLinearGradient(offset + indicatorLeft, offset + indicatorHeight, offset + indicatorLeft - factor * indicatorHeight, offset + indicatorHeight + factor * this.bevelDistance);
        vg.addColorStop(0, this.addAlphaToColor(barGlow, 0.7));
        vg.addColorStop(.8, this.addAlphaToColor(barGlow, 0));

        $label.html(energy+'/'+energyToWin);

        var roundRectPath = function(left, top, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(left+radius, top);
            ctx.lineTo(left+width-radius, top);
            ctx.arcTo(left+width+1, top, left+width+1, top+radius, radius);
            ctx.arcTo(left+width+1, top+height, left+width-radius+1, top+height, radius);
            ctx.lineTo(left+radius, top+height);
            ctx.arcTo(left-1, top+height, left-1, top+radius, radius);
            ctx.arcTo(left-1, top, left+radius-1, top, radius);
            ctx.closePath();
        };

        if (leftToRight) {
            ctx.setTransform(-1, 0, 0, 1, bar.width, 0);
        } else {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        var alpha = [0, 1.0, 0.4, 0.3, 0.2, 0.1];
        var extraBevel = offset * this.bevelDistance / indicatorHeight;
        // draw bar glow outside of indicator
        ctx.save();
        // clip to region where bar is drawn
        ctx.beginPath();
        ctx.moveTo(offset + indicatorLeft + extraBevel - offset, 2*offset + indicatorHeight);
        ctx.lineTo(offset + indicatorLeft - this.bevelDistance - extraBevel - offset, 0);
        ctx.lineTo(2*offset + indicatorWidth + 1, 0);
        ctx.lineTo(2*offset + indicatorWidth + 1, 2*offset + indicatorHeight);
        ctx.closePath();
        ctx.clip();
        // draw a series of increasingly larger and increasingly transparent rounded rectangles
        for (var i = 0; i < offset; i++) {
            roundRectPath(offset-i, offset-i, indicatorWidth+2*i, indicatorHeight+2*i, capRadius+i);
            ctx.strokeStyle = this.addAlphaToColor(barGlow, alpha[i]);
            ctx.stroke();
        }
        ctx.restore();

        // define the indicator bar
        roundRectPath(offset, offset, indicatorWidth, indicatorHeight, capRadius);
        // outline indicator in black
        ctx.save();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // fill it with the grey background
        ctx.fillStyle = bg;
        ctx.fill();
        // and clip future drawing
        ctx.clip();

        // blue bar
        ctx.beginPath();
        ctx.moveTo(offset + indicatorLeft, offset + indicatorHeight + 1);
        ctx.lineTo(offset + indicatorLeft - this.bevelDistance, offset - 1);
        ctx.lineTo(offset + indicatorWidth + 2, offset - 1);
        ctx.lineTo(offset + indicatorWidth + 2, offset + indicatorHeight + 1);
        ctx.closePath();
        ctx.fillStyle = fg;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // bevelled glow
        ctx.beginPath();
        ctx.moveTo(offset + indicatorLeft + extraBevel, 2*offset + indicatorHeight);
        ctx.lineTo(offset + indicatorLeft - this.bevelDistance - extraBevel, 0);
        ctx.lineTo(offset + indicatorLeft - this.bevelDistance - extraBevel - offset, 0);
        ctx.lineTo(offset + indicatorLeft + extraBevel - offset, 2*offset + indicatorHeight);
        ctx.closePath();
        ctx.fillStyle = vg;
        ctx.fill();
    },

    getPowerMoveNexus: function(player, move) {
        var playerIndex = this.getPlayerIndex(player);
        for (var i = 0; i < this.plaques[playerIndex].length; i++) {
            var plaque = this.plaques[playerIndex][i];
            if (plaque.getMoveId() === move) {
                var offset = plaque.getElement().offset();
                var nexus = plaque.getNexus();
                return [offset.left + nexus.left, offset.top + nexus.top];
            }
        }
        return null;
    },

    getPowerMoveIconUrl: function(move) {
        if (move in this.powerMoves && 'assets' in this.powerMoves[move] && 'icon' in this.powerMoves[move]['assets']) {
            return this.assetUrl + this.powerMoves[move]['assets']['icon'];
        } else {
            return '../walkoff_img/icon_icystare.png';
        }
    },

    getPlayerIndex: function (player) {
        // Given a player number (1 or 2), returns 0 if the player is displayed
        // on the left and 1 if the player is displayed on the right.
        if ((this.cid === this.getPlayerCid(1) && player === 1) || (this.cid === this.getPlayerCid(2) && player === 2)) {
            return 0;
        } else {
            return 1;
        }
    },

    getRecentlyActivePlayerNumber: function() {
        switch (this.recentlyActivePlayer) {
            case this.getPlayerCid(1):
                return 1;
            case this.getPlayerCid(2):
                return 2;
            default:
                return 0;
        }
    },

    isFrostEffectActive: function(player) {
        var effects = (player === 1) ? this.p1effects : this.p2effects;

        for (var i in effects) {
            var effect = effects[i].effect;
            if (effect in this.effects
                && 'assets' in this.effects[effect]
                && 'visual' in this.effects[effect].assets
                && 'frost'  === this.effects[effect].assets.visual
            ) {
                return true;
            }
        }
        return false;
    },

    updatePlaques: function (player) {
        if (this.greenroomActive) {
            return;
        }
        var playerIndex = this.getPlayerIndex(player);

        var playerMoves = this.getPlayerMoves(player);
        var playerMove;
        var moveIds = _.keys(playerMoves);

        for (var i = 0; i < this.plaques[playerIndex].length; i++) {
            var plaque = this.plaques[playerIndex][i];
            var moveId = null;
            var moveDesc = null;
            var colorId = null;
            var iconUrl = null;
            var moveName = null;
            var moveCost = null;
            var gemCount = null;
            var enabled = null;

            if (i < moveIds.length) {
                moveId = moveIds[i];
                playerMove = playerMoves ? playerMoves[moveId] : null;
                colorId = this.getMoveColorId(playerMove);
                moveCost = this.getMoveCost(playerMove);
                iconUrl = this.getPowerMoveIconUrl(moveId);
                moveName = this.getMoveName(moveId);
                moveDesc = this.getMoveDescription(moveId);

                if (this.isFrostEffectActive(player)) {
                    plaque.freeze();
                    enabled = plaque.isEnabled(); // don't let it change (the server reports it as disabled)
                } else {
                    plaque.thaw();
                    enabled = playerMove.hasOwnProperty('enabled') && playerMove.enabled;
                }

                var inventory = this.getPlayerInventory(player);
                if (inventory.hasOwnProperty(colorId)) {
                    gemCount = inventory[colorId];
                } else {
                    gemCount = 0;
                }
            }
            plaque.setMoveInfo(moveId, colorId, moveName, moveDesc, moveCost, gemCount, enabled);
            plaque.setIconUrl(iconUrl);
            plaque.update();
        }
    },

    getMoveColorId: function (playerMove) {
        if (!playerMove.hasOwnProperty('cost')) {
            return null;
        }
        var cost = playerMove.cost;

        for (var colorId in cost) {
            if (cost.hasOwnProperty(colorId)) {
                return colorId;
            }
        }
        return null;
    },

    getMoveCost: function (playerMove) {
        if (!playerMove.hasOwnProperty('cost')) {
            return null;
        }
        var cost = playerMove.cost;
        for (var colorId in cost) {
            if (cost.hasOwnProperty(colorId)) {
                return cost[colorId];
            }
        }
        return null;
    },

    getMoveName: function(moveId) {
        if (!this.powerMoves.hasOwnProperty(moveId)) {
            return null;
        }

        var powerMoveInfo = this.powerMoves[moveId];
        if (!powerMoveInfo.hasOwnProperty('name')) {
            return null;
        }

        return powerMoveInfo.name;
    },

    getMoveDescription: function(moveId) {
        if (!this.powerMoves.hasOwnProperty(moveId)) {
            return null;
        }

        var powerMoveInfo = this.powerMoves[moveId];
        if (!powerMoveInfo.hasOwnProperty('descr')) {
            return null;
        }

        return powerMoveInfo.descr;
    },

    getMoveInitialCost: function(moveId) {
        if (!this.powerMoves.hasOwnProperty(moveId)) {
            return null;
        }
        var powerMoveInfo = this.powerMoves[moveId];
        if (!powerMoveInfo.hasOwnProperty('cost')) {
            return null;
        }
        var colors = ['r', 'b', 'p', 'g', 'y'];
        for (var i = 0; i < colors.length; i++) {
            var color = colors[i];
            if (powerMoveInfo.cost.hasOwnProperty(color)) {
                return [color, powerMoveInfo.cost[color]];
            }
        }
        return null;
    },

    getTimerNexus: function() {
        var offset = this.$countdown.offset();
        var xpos = offset.left + this.$countdown.width() / 2;
        var ypos = offset.top + this.$countdown.height() / 2;
        return [xpos, ypos];
    },

    addArcToMeter: function(player, source, energy) {
        var sourceXY = false;
        var powerMoves = this.getPlayerMoves(player);
        if (source in powerMoves) {
            sourceXY = this.getPowerMoveNexus(player, source);
        } else if (source === 'skip_move') {
            sourceXY = this.getTimerNexus();
        }
        if (sourceXY !== false) {
            var destXY = this.getEnergyMeterNexus(player, this.getPlayerEnergy(player));
            if (energy > 0) {
                this.addArc(sourceXY, destXY, 'w', energy, 700);
            } else if (energy < 0) {
                this.addArc(destXY, sourceXY, 'w', -energy, 700);
            }
        }
    },

    addArcToGem: function(player, col, row, source, energy) {
        var powerMoves = this.getPlayerMoves(player);
        if (source in powerMoves) {
            var sourceXY = this.getPowerMoveNexus(player, source);
            var destXY = this.getGemNexus(col, row);
            this.addArc(sourceXY, destXY, 'w', energy, 700);
        }
    },

    addArcToGemFromLargeMatch: function(col, row, width, height) {
        var leftXY = this.getGemNexus(col, row);
        var rightXY = this.getGemNexus(col + width - 1, row + height - 1);
        var centerXY = [
            (leftXY[0] + rightXY[0]) / 2.0,
            (leftXY[1] + rightXY[1]) / 2.0
        ];
        var color = this.gemTypes[col][row].substr(0, 1);
        this.addArc(leftXY, centerXY, color, 5, 700);
        this.addArc(rightXY, centerXY, color, 5, 700);
    },
    
    addArcToGemFromGem: function(colSource, rowSource, colDest, rowDest, energy) {
        var sourceXY = this.getGemNexus(colSource, rowSource);
        var destXY = this.getGemNexus(colDest, rowDest);
        this.addArc(sourceXY, destXY, 'w', energy*2, this.timingConstants['gemShatterTime']);
    },

    addArc: function (startXY, destXY, color, energy, maxTime) {
        var soundName = (energy <= 5) ? 'lightning_small' : 'lightning_large';
        this.imvu.call('playSound', soundName);
        this.generator.drawArc(startXY[0], startXY[1], destXY[0], destXY[1], color, energy, maxTime);
    },

    onPlaqueClick: function (plaque) {
        this.sendMessage('powermove', plaque.getMoveId());
    },

    updateTurnIndicators: function () {
        var showIndicators = [
            this.showTurnStatus && this.$stage.hasClass('clickable'),
            this.showTurnStatus && !this.$stage.hasClass('clickable')
        ];
        var that = this;

        $.each(showIndicators, function (i, showIndicator) {
            if (that.indicators[i].showing !== showIndicator) {
                that.indicators[i].showing = showIndicator;
                var $el = that.indicators[i].$el;
                if (this.turnFadeAnimationIds[i] !== null) {
                    this.animator.remove(this.turnFadeAnimationIds[i]);
                }
                var opacity = $el.css('opacity');
                if (showIndicator) {
                    $el.show();
                    this.turnFadeAnimationIds[i] = this.animator.add(new FadeAnimation($el[0], opacity, 1, TURN_FADE_TIME_MSEC));
                } else {
                    this.turnFadeAnimationIds[i] = this.animator.add(new FadeAnimation($el[0], opacity, 0, TURN_FADE_TIME_MSEC, function () { $el.hide(); }));
                }
            }
        }.bind(this));
    },

    updateCountdownShowing: function () {
        if (this.countdownShowing !== this.showTurnStatus) {
            this.countdownShowing = this.showTurnStatus;

            if (this.countdownFadeAnimationId !== null) {
                this.animator.remove(this.countdownFadeAnimationId);
            }

            var target = (this.countdownShowing ? 1 : 0);
            this.countdownFadeAnimationId = this.animator.add(new FadeToAnimation(this.$countdown[0], target, 1.0 / TURN_FADE_TIME_MSEC));
        }
    },

    handleMouseOverEffectIcon: function($icon) {
        if ( $icon.find('.tooltip').html() ) {
            this.effectTooltipAnimation = this.animator.add(new DelayedCall(function() { this.show(); }.bind($icon.find('.tooltip')), 500));
        }
    },
    
    handleMouseOutEffectIcon: function($icon) {
        $icon.find('.tooltip').hide();
        this.animator.remove(this.effectTooltipAnimation);
        this.effectTooltipAnimation = null;
    },
    
    getPlayerState: function (player) {
        var playerkey = 'player1';
        if (player === 2) {
            playerkey = 'player2';
        }
        
        if (this.state[playerkey]) {
            return this.state[playerkey];
        } else {
            return { cid:0 };
        }
    },

    getPlayerCid: function (player) {
        var playerState = this.getPlayerState(player);
        if (playerState) {
            return parseInt(playerState.cid, 10);
        } else {
            return null;
        }
    }
};

function WalkOffElectrostaticGenerator(imvu, animator, $arcLayer) {
    this.imvu = imvu;
    this.animator = animator;
    this.$arcLayer = $arcLayer;
    this.arcList = [];
}

WalkOffElectrostaticGenerator.prototype = {
    drawArc: function(startX, startY, endX, endY, color, energy, maxTime) {
        this.arcList.push(new WalkOffElectrostaticArc(this, this.animator, this.$arcLayer, startX, startY, endX, endY, color, energy, maxTime));
    },

    disposeArc: function(arc) {
        var index = this.arcList.indexOf(arc);
        if (index >= 0) {
            this.arcList.splice(index, 1);
        }
    }
};

function WalkOffElectrostaticArc(generator, animator, $arcLayer, startX, startY, endX, endY, color, energy, maxTime) {
    this.generator = generator;
    this.animator = animator;
    this.$arcLayer = $arcLayer;
    this.drawArc(startX, startY, endX, endY, color, energy, maxTime);
}

WalkOffElectrostaticArc.prototype = {
    MAX_THICKNESS: 5,
    SHADOW_BLUR: 20,

    calculateBoundingRect: function(startX, startY, endX, endY) {
        var stretchStart = 1.10;
        var stretchEnd = 1.20;
        var stretchedEndX = startX + stretchEnd * (endX - startX);
        var stretchedStartX = endX + stretchStart * (startX - endX);
        var stretchedEndY = startY + stretchEnd * (endY - startY);
        var stretchedStartY = endY + stretchStart * (startY - endY);

        var rect = this.makeCenteredSquareRect(stretchedStartX, stretchedStartY, stretchedEndX, stretchedEndY);
        rect = this.expandRect(rect, this.MAX_THICKNESS + this.SHADOW_BLUR);

        return rect;
    },

    makeCenteredSquareRect: function (x1, y1, x2, y2) {
        var centerX = (x1 + x2) / 2;
        var centerY = (y1 + y2) / 2;
        var halfWidth = Math.abs(x1 - x2) / 2;
        var halfHeight = Math.abs(y1 - y2) / 2;
        var radius = Math.max(halfWidth, halfHeight);
        return {
            left: centerX - radius,
            top: centerY - radius,
            right: centerX + radius,
            bottom: centerY + radius
        };
    },

    expandRect: function (rect, amount) {
        return {
            left: rect.left - amount,
            top: rect.top - amount,
            right: rect.right + amount,
            bottom: rect.bottom + amount
        };
    },

    setColor: function(color) {
        switch(color) {
            case 'r':
                this.auraColor = '#FF0000';
                this.arcColor = '#FFFFFF';
                this.glowColor = '#FF8080'
                break;
            case 'b':
                this.auraColor = '#0000FF';
                this.arcColor = '#FFFFFF';
                this.glowColor = '#8080FF';
                break;
            case 'p':
                this.auraColor = '#FFC0C0';
                this.arcColor = '#FFFFFF';
                this.glowColor = '#FFE0E0';
                break;
            case 'g':
                this.auraColor = '#00FF00';
                this.arcColor = '#FFFFFF';
                this.glowColor = '#C0FF80';
                break;
            case 'y':
                this.arcColor = '#FFFFFF';
                this.auraColor = '#FFFF00';
                this.glowColor = '#FFFF80';
                break;
            default:
                this.arcColor = '#FFFFFF';
                this.auraColor = '#000000';
                this.glowColor = '#808080';
                break;
        }
    },

    drawArc: function(startX, startY, endX, endY, color, energy, duration) {
        this.boundingRect = this.calculateBoundingRect(startX, startY, endX, endY);
        this.height = this.boundingRect.bottom - this.boundingRect.top;
        this.width = this.boundingRect.right - this.boundingRect.left;
        this.$arc = $('<canvas class="arc" height="'+this.height+'" width="'+this.width+'"></canvas>');
        this.$aura = $('<canvas class="aura" height="'+this.height+'" width="'+this.width+'"></canvas>');
        this.$arcLayer.append(this.$arc);
        this.$arcLayer.append(this.$aura);
        this.$arc.css('top', this.boundingRect.top);
        this.$arc.css('left', this.boundingRect.left);
        this.$arc.css('height', this.height);
        this.$arc.css('width', this.width);
        this.$aura.css('top', this.boundingRect.top);
        this.$aura.css('left', this.boundingRect.left);
        this.$aura.css('height', this.height);
        this.$aura.css('width', this.width);
        this.arcCtx = this.$arc[0].getContext('2d');
        this.auraCtx = this.$aura[0].getContext('2d');
        var deltaX = endX - startX;
        var deltaY = endY - startY;
        this.length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (this.length <= 50) {
            this.angleRange = 300;
        } else if (this.length <= 300) {
            this.angleRange = 100;
        } else {
            this.angleRange = 60;
        }
        this.maxSegmentLength = this.length / 25;
        this.segmentsTillBranchMultiplier = 0.5 + (this.length / 100);

        var angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        var arc0, arc1;
        if (energy < 5) {
            arc0 = this.buildArc(1, angle, this.length, true);
        } else {
            arc0 = this.buildArc(3, angle, this.length, true);
            if (energy >= 10 && this.length >= 20) {
                arc1 = this.buildArc(this.MAX_THICKNESS, angle, this.length, true);
                this.addArc(arc0, arc1);
                if (energy >= 20 && this.length >= 80) {
                    arc1 = this.buildArc(this.MAX_THICKNESS, angle, this.length, true);
                    this.addArc(arc0, arc1);
                }
            }

        }
        this.setColor(color);
        this.animator.add(new PerFrameCall(flash.bind(this), duration, dispose.bind(this)));

        function flash(f) {
            var maxLength = this.length;
            var flashThickness = 2.5;
            if (f < .3) {
                maxLength = .6 * this.length;
            } else if (f < .6) {
                maxLength = .8 * this.length;
            } else if (f < duration - .6) {
            } else if (f < duration - .3) {
                flashThickness = 2;
                maxLength = .8 * this.length;
            } else {
                flashThickness = 1;
                maxLength = .6 * this.length;
            }
            this.arcCtx.clearRect(0, 0, this.width, this.height);
            this.auraCtx.clearRect(0, 0, this.width, this.height);
            this.renderArc(arc0, angle, 0, startX - this.boundingRect.left, startY - this.boundingRect.top, endX - this.boundingRect.left, endY - this.boundingRect.top, 4, maxLength, flashThickness);
        }

        function dispose() {
            this.$aura.remove();
            this.$arc.remove();
            this.generator.disposeArc(this);
        }
    },

    addArc: function(arc0, arc1) {
        if (arc0[0].length > 4) {
            this.addArc(arc0[0][4], arc1);
        } else {
            arc0[0][4] = arc1;
        }
    },

    getRandomSegmentsTillBranch: function() {
        var rand = Math.random() + Math.random() + Math.random() + Math.random();
        return Math.floor(this.segmentsTillBranchMultiplier * rand);
    },
    
    getRandomSegmentLength: function(primary) {
        return Math.random() * this.maxSegmentLength + 3;
    },
    
    getRandomAngleDelta: function(primary) {
        return Math.random() * 2 * this.angleRange - this.angleRange;
    },

    buildArc: function(thickness, angle, length, primary) {
        var arc = [];
        var segmentsTillBranch = this.getRandomSegmentsTillBranch();
        var totalLength = 0;
        for (var i = 0;; i++) {
            var angleDelta = this.getRandomAngleDelta(primary);
            var segmentLength = this.getRandomSegmentLength(primary);
            totalLength += segmentLength;
            if (totalLength > length) {
                break;
            }
            arc[i] = [angle+angleDelta, thickness, segmentLength, primary];
            if (segmentsTillBranch -- <= 0) {
                angleDelta = this.getRandomAngleDelta(primary);;
                arc[i].push(this.buildArc(1, angle + angleDelta, length - totalLength, false));
                arc[i][1] = thickness;
                segmentsTillBranch = this.getRandomSegmentsTillBranch();
            }
        }
        return arc;
    },

    renderArc: function(arc, angle, i0, cursorX, cursorY, terminalX, terminalY, baseWidth, maxLength, flashThickness) {
        var field;
        var factor = 1.1;
        var nextX;
        var nextY;
        var length;
        var width;
        var sin;
        var curAngle;
        var newLength;
        var newAngle;
        var thickness;
        var renderLength = Math.min(arc.length, maxLength);
        
        this.auraCtx.strokeStyle = this.auraColor;
        this.auraCtx.lineCap = 'round';
        this.arcCtx.strokeStyle = this.arcColor;
        this.arcCtx.shadowColor = this.glowColor || "#ffffff";
        this.arcCtx.shadowBlur = this.SHADOW_BLUR;
        this.arcCtx.strokeStyle = this.arcColor;

        this.arcCtx.lineCap = 'round';
        for (var i = i0; i < arc.length; i++) {
            if (i >= maxLength) break;
            width = baseWidth * (renderLength - i) / renderLength;
            if (arc[i].length > 4) {
                this.renderArc(arc[i][4], angle, i, cursorX, cursorY, terminalX, terminalY, width, maxLength, flashThickness);
            }
            curAngle = arc[i][0];
            thickness = arc[i][1];
            length = arc[i][2];
            primary = arc[i][3];
            sin = Math.sin(curAngle*Math.PI/180);
            // Most of the time move the endpoint of the segment a bit farther from the center of the arc
            newLength = factor * length;
            newAngle = angle + factor * (curAngle - angle);
            arc[i][0] = newAngle;
            arc[i][2] = newLength;
            // Occasionally assign a new random angle to the segment
            if (Math.random() < .35) {
                arc[i][0] = angle + this.getRandomAngleDelta();
            }
            // Occasionally assign a new random length to the segment
            if (Math.random() < .35) {
                arc[i][2] = this.getRandomSegmentLength();
            }
            // calculate the new endpoint of the segment
            var deltaY = terminalY - cursorY;
            var deltaX = terminalX - cursorX;
            var totalArcLength = 900;
            field = Math.atan2(deltaY, deltaX) / Math.PI * 180; // (1100, 200) is the convergence point
            var distanceToGo =  Math.sqrt(deltaY * deltaY + deltaX * deltaX);
            var fieldStrength = (totalArcLength - distanceToGo)/totalArcLength;
            curAngle = arc[i][0] * (1 - fieldStrength * fieldStrength * fieldStrength) + field * fieldStrength * fieldStrength * fieldStrength;
            length = arc[i][2] * 1.6;
            nextX = cursorX + length * Math.cos(curAngle * Math.PI / 180);
            nextY = cursorY + length * Math.sin(curAngle * Math.PI / 180);
            // if next is within length of terminal go right to terminal
            var distX = terminalX - nextX;
            var distY = terminalY - nextY;
            if ((distX * distX + distY * distY) < length * length) {
                nextX = terminalX;
                nextY = terminalY;
            }
            var renderThickness = Math.min(thickness, flashThickness);
            // draw the bluish aura
            this.auraCtx.beginPath();
            this.auraCtx.lineWidth = renderThickness + 3;
            this.auraCtx.moveTo(cursorX, cursorY);
            this.auraCtx.lineTo(nextX, nextY);
            this.auraCtx.stroke();
            // draw the tinted arc
            this.arcCtx.beginPath();
            this.arcCtx.lineWidth = renderThickness;
            this.arcCtx.moveTo(cursorX, cursorY);
            this.arcCtx.lineTo(nextX, nextY);
            this.arcCtx.stroke();
            if (nextX === terminalX && nextY === terminalY) {
                break;
            }
            cursorX = nextX;
            cursorY = nextY;
        }
    },
};


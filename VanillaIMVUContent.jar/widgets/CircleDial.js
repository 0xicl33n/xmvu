var CircleDial = function() {
    var ns = 'http://www.w3.org/2000/svg';

    this.svg = document.createElementNS(ns, 'svg');
    this.svg.setAttribute('viewBox', '-121 -121 242 242');
    this.svg.setAttribute('class', 'circleDial');

    var cback = document.createElementNS(ns, 'circle');
    cback.setAttribute('class', 'backdrop');
    cback.setAttribute('r', '120');
    cback.setAttribute('stroke-width', '0');
    this.svg.appendChild(cback);

    var cout = document.createElementNS(ns, 'circle');
    cout.setAttribute('stroke-width', '0');
    cout.setAttribute('r', '100');
    this.svg.appendChild(cout);

    this.dialPath = document.createElementNS(ns, 'path');
    this.dialPath.setAttribute('fill', 'transparent');
    this.dialPath.setAttribute('stroke', '#31312e');
    this.svg.appendChild(this.dialPath);

    this.borderWidth = 10;
    this.innerRadius = 30;
    this.full = 0;
    this.cout = cout;
    this.cback = cback;

    this.updateDialValues();
};

CircleDial.prototype = {
    setFull : function(factor) {
        this.full = factor;

        if(factor < 0.01) {
            factor = 0.01;
        }
        var sw = (100-this.innerRadius-this.borderWidth);
        var r = this.innerRadius + sw/2.0;
        var large_angle = factor>0.5 ? 1 : 0;
        var endY = r * (-Math.cos(factor*2*Math.PI));
        var endX = r * (Math.sin(factor*2*Math.PI));
        var d = 'M0,-'+r+' A'+r+','+r+' 0 '+large_angle+' 1 '+endX+','+endY+'';
        this.dialPath.setAttribute('d', d);
    },

    setBorderWidth : function(w) {
        this.borderWidth = w;
        this.updateDialValues();
    },
    setInnerRadius : function(r) {
        this.innerRadius = r;
        this.updateDialValues();
    },
    updateDialValues : function() {
        var sw = (100-this.innerRadius-this.borderWidth);
        this.dialPath.setAttribute('stroke-width', sw);
        this.setFull(this.full);
    },
    
    setTransparent : function() {
        this.dialPath.setAttribute('fill', 'transparent');
        this.dialPath.setAttribute('stroke', 'transparent');
        this.cout.setAttribute('fill', 'transparent');
        this.cout.setAttribute('stroke', 'transparent');
        this.cback.setAttribute('fill', 'transparent');
        this.cback.setAttribute('stroke', 'transparent');
    }
};

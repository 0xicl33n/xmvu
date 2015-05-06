
function SlidingPaginator(elPaginator, elPrev, elNext, pages, pageWidth) {
    this.elPaginator = YAHOO.util.Dom.get(elPaginator);
    this.elPrev = YAHOO.util.Dom.get(elPrev);
    this.elNext = YAHOO.util.Dom.get(elNext);
    this.pageWidth = pageWidth;
    this.animations = [];

    this.curPage = 0;
    this.setPages(pages);
}

SlidingPaginator.prototype = {
    setPages: function(pages) {
        this.pages = [];
        for (var i = 0; i < pages.length; i++) {
            var pg = YAHOO.util.Dom.get(pages[i]);
            YAHOO.util.Dom.setStyle(pg, 'position', 'absolute');
            this.pages.push(pg);
        }
        var self = this;
        $('.page-indicator', this.elPaginator).each(function (index, pip) {
            self.elPaginator.removeChild(pip);
        });
        for(var i = 0; i < this.pages.length; i++) {
            var d = document.createElement('div');
            $(d).addClass('page-indicator');
            this.elPaginator.appendChild(d);
            d.appendChild(document.createTextNode(' '));
            YAHOO.util.Event.purgeElement(d, false, 'click');
            YAHOO.util.Event.addListener(d, 'click', this.onPageIndicatorClicked.bind(this, i));
        }
        this.setIndex(this.curPage);
        
        if (this.pages.length > 0) {
            YAHOO.util.Event.purgeElement(this.elPrev, false, 'click');
            YAHOO.util.Event.purgeElement(this.elNext, false, 'click');
            YAHOO.util.Event.addListener(this.elPrev, 'click', this.prevPage, this, true);
            YAHOO.util.Event.addListener(this.elNext, 'click', this.nextPage, this, true);
        }
    },

    show: function() {
        YAHOO.util.Dom.setStyle(this.elPrev, 'display', '');
        YAHOO.util.Dom.setStyle(this.elNext, 'display', '');
        YAHOO.util.Dom.setStyle(this.elPaginator, 'display', '');
    },

    hide: function() {
        YAHOO.util.Dom.setStyle(this.elPrev, 'display', 'none');
        YAHOO.util.Dom.setStyle(this.elNext, 'display', 'none');
        YAHOO.util.Dom.setStyle(this.elPaginator, 'display', 'none');
    },

    onPageIndicatorClicked: function(index, evt) {
        if (!$(evt.target).hasClass('active')) {
            this.switchToPage(index, index > this.curPage);
        }
    },

    setIndex: function(i) {
        var ds = this.elPaginator.querySelectorAll('.page-indicator');
        $(ds).removeClass('active');
        $(ds[i]).addClass('active');
        this.curPage = i;
    },

    stopAnimations: function(toEnd) {    
        var anims = this.animations;
        this.animations = [];
        for each(var a in anims) {
            a.stop(toEnd);
        }
    },

    switchToPage: function(p, moveRight) {
        if (p == this.curPage) {
            return;
        }

        this.stopAnimations();

        var curPageDiv = this.pages[this.curPage];
        var newPageDiv = this.pages[p];

        var scrollLeft = moveRight;
        var dx = scrollLeft ? -this.pageWidth : this.pageWidth;

        for each (var el in this.pages) {
            YAHOO.util.Dom.setStyle(el, 'display', 'none');
        }

        YAHOO.util.Dom.setStyle(curPageDiv, 'left', '0px');
        YAHOO.util.Dom.setStyle(newPageDiv, 'left', (-dx) + 'px');
        YAHOO.util.Dom.setStyle(curPageDiv, 'display', 'block');
        YAHOO.util.Dom.setStyle(newPageDiv, 'display', 'block');

        var t = 0.45;
        var ease = YAHOO.util.Easing.easeOut;

        var a1 = new YAHOO.util.Motion(
            curPageDiv,
            {left: {from:0, to:dx}},
            t, ease
        );

        if (a1 && a1.animate) {
            a1.animate();
            this.animations.push(a1);
        }
        var a2 = new YAHOO.util.Motion(
            newPageDiv,
            {left: {from:-dx, to:0}},
            t, ease
        );
        if (a2 && a2.animate) {
            a2.animate();
            this.animations.push(a2);
        }

        this.setIndex(p);
    },

    nextPage: function() {
        var p = this.curPage + 1;
        if (p >= this.pages.length) {
            p -= this.pages.length;
        }
        this.switchToPage(p, true);
    },

    prevPage: function() {
        var p = this.curPage - 1;
        if (p < 0) {
            p += this.pages.length;
        }
        this.switchToPage(p, false);
    }
};


function DotPaginator(spec) {
    this.rootElement = spec.rootElement || rootElementMustBeSpecified;
    this.carousel = spec.carousel || carouselMustBeSpecified;

    this.elDots = this.rootElement.querySelectorAll('.dot');

    this.dial = new CircleDial();
    this.elProgressDial = document.createElement('div');
    this.elProgressDial.id = 'progress_dial';
    this.elProgressDial.appendChild(this.dial.svg);
    this.rootElement.appendChild(this.elProgressDial);

    Event.on(this.elDots, 'click', this.clickDots.bind(this));
}

DotPaginator.prototype.getInfo = function (elDotClicked) {
    var info = {
        activePageIndex: -1,
        selectedPageIndex: -1,
        visibleDots: 0
    };

    for (var index = 0; index < this.elDots.length; index++) {
        var elDot = this.elDots[index];
        if (elDot == elDotClicked) {
            info.selectedPageIndex = index;
        }
        if ($(elDot).is('.active')) {
            info.activePageIndex = index;
        }
        if (!$(elDot).is('.hidden')) {
            info.visibleDots += 1;
        }
    }

    return info;
}

DotPaginator.prototype.setFull = function (factor) {
    this.dial.setFull(factor);
    if (factor >= 1.0) {
        var fade = new YAHOO.util.Anim(this.elProgressDial, {opacity: {from: 1, to: 0}}, 0.5, YAHOO.util.Easing.easeIn);
        fade.animate();
    }
}

DotPaginator.prototype.recalc = function () {
    var oldInfo = this.getInfo();
    var totalPages = this.carousel.getNumPages();
    if (totalPages > 10) {
        totalPages = 10;
    }
    var fullHeight = totalPages * this.carousel.getRowHeight();

    var centerOfPage = -this.carousel.getScrollEdge() + (this.carousel.getRowHeight() / 2);
    var newActivePageIndex = Math.floor(centerOfPage / fullHeight * totalPages);
    if (newActivePageIndex > totalPages - 1) {
        newActivePageIndex = totalPages - 1;
    }
    if (newActivePageIndex != oldInfo.activePageIndex) {
        if (oldInfo.activePageIndex != -1) {
            $(this.elDots[oldInfo.activePageIndex]).removeClass('active');
        }
        $(this.elDots[newActivePageIndex]).addClass('active');
    }

    if (totalPages == oldInfo.visibleDots) {
        return;
    }

    Dom.setStyle(this.rootElement, 'width', (totalPages * 16) + 'px');

    for (var index = 0; index < this.elDots.length; index += 1) {
        $(this.elDots[index]).toggleClass('hidden', index >= totalPages);
    }

    $(this.rootElement).toggleClass('invisible', totalPages < 2);
}

DotPaginator.prototype.clickDots = function (e) {
    if ($(e.target).is('.active')) {
        return;
    }

    var info = this.getInfo(e.target);
    var totalPages = this.carousel.getNumPages();
    var fullHeight = totalPages * this.carousel.getRowHeight();
    var pixelsPerDot = Math.floor(fullHeight / info.visibleDots);

    var selectedPageScrollEdge = info.selectedPageIndex * pixelsPerDot;
    selectedPageScrollEdge = Math.floor(selectedPageScrollEdge/OUTFIT_HEIGHT)*OUTFIT_HEIGHT;
    if (selectedPageScrollEdge > fullHeight) {
        selectedPageScrollEdge = fullHeight;
    }

    Dom.batch(this.elDots, function (el) { $(el).removeClass('active'); }); // deactivate all
    $(e.target).addClass('active'); // new active

    this.carousel.scroll(-this.carousel.getScrollEdge() - selectedPageScrollEdge);
}

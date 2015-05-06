function HorizontalChooser(args) {
    this.$root = $(args.el);
    this.items = {};

    this.selectEvent = new YAHOO.util.CustomEvent('select', this);

    this.$root.addClass('hchooser');

    this.track = document.createElement('div');
    $(this.track).addClass('track');
    this.$root.append(this.track);
    
    this.slider = document.createElement('div');
    $(this.slider).addClass('slider');
    this.$root.append(this.slider);

    this.sliderWidget = new IMVU.Client.widget.Slider(this.slider);
    this.sliderWidget.addListener('drag', this.thumbDragged.bind(this));

    var d = document.createElement('div');
    this.$root.append(d);
    d.innerHTML = "<div class='pageleft'></div><div class='pageright'></div>";
    $(d).addClass('ul-bg');

    this.ul = document.createElement('ul');
    this.$root.append(this.ul);

    this.$pageLeft = this.$root.find('.pageleft');
    this.$pageRight = this.$root.find('.pageright');
    YAHOO.util.Event.addListener(this.$pageLeft[0], 'click', this.selectPrev.bind(this));
    YAHOO.util.Event.addListener(this.$pageRight[0], 'click', this.selectNext.bind(this));
}

HorizontalChooser.prototype.addItem = function(item) {
    var self = this;
    if (!this.items[item.id]) {
        var li = document.createElement('li');
        var label = document.createElement('label');
        label.appendChild(document.createTextNode(item.buttonText));
        li.appendChild(label);
        li.item = item;
        this.ul.appendChild(li);
        this.items[item.id] = item;
        YAHOO.util.Event.addListener(li,'click',function(){self.selectId(item.id);});
        this.updateScrollVisual();
        var selectItem = this.getSelectedItem();
        if(!selectItem) {
            selectItem = item;
        }
        this.selectId(selectItem.id);
    } else {
        this.$root.find('li').each(function (index, li) {
            if(li.item.id == item.id) {
                li.item = item;
                li.innerHTML = "<label>" + item.buttonText + "</label>";
                self.items[item.id] = item;
            }
        });
    }
    this.sortItems();
};

HorizontalChooser.prototype.sortItems = function() {
    var lis = [];
    this.$root.find('li').each(function (index, li) {
        li.parentNode.removeChild(li);
        lis.push(li);
    });
    function sortItemLi(a,b) { return a.item.id - b.item.id; }
    lis.sort(sortItemLi);
    for (var i = 0; i < lis.length; i++) {
        this.ul.appendChild(lis[i]);
    }
}

HorizontalChooser.prototype.removeIds = function(ids) {
    var selectNew = false;
    for each(var id in ids) {
        if(!this.items[id]) continue;
        delete this.items[id];
        var lis = this.$root.find('li');
        for (var i = 0; i < lis.length; i++) {
            var li = lis[i];
            if(li.item.id == id) {
                li.parentNode.removeChild(li);
                if($(li).is('.selected')) {
                    selectNew = true;
                }
            }
        }
    }
    if(selectNew) {
        var lis = this.$root.find('li');
        if(lis.length > 0) {
            this.selectId(lis[0].item.id);
        }
    }
    this.updateScrollVisual();
};

HorizontalChooser.prototype.selectId = function(id) {
    var lis = this.$root.find('li');

    var newli;
    for (var i = 0; i < lis.length; i += 1) {
        var li = lis[i];
        if(li.item.id == id) {
            newli = li;
            break;
        }
    }
    if(!newli) {
        return;
    }

    var leftGray = (newli == lis[0]);
    var rightGray = (newli == lis[lis.length-1]);
    if(leftGray)  { this.$pageLeft.addClass('gray'); }
    else          { this.$pageLeft.removeClass('gray'); }
    if(rightGray) { this.$pageRight.addClass('gray'); }
    else          { this.$pageRight.removeClass('gray'); }

    if(newli) {
        $(lis).removeClass('selected');
        $(newli).addClass('selected');
        this.scrollToMakeVisible(newli);
        this.selectEvent.fire(newli.item);
    }
};

HorizontalChooser.prototype.getSelectedItem = function() {
    var li = this.$root.find('li.selected');
    if(!li.length) return null;
    return li[0].item;
};

HorizontalChooser.prototype.getSelectedIndex = function() {
    var lis = this.$root.find('li');
    var li = this.$root.find('li.selected');
    for(var i=0; i<lis.length; i++) {
        if(lis[i] == li[0]) return i;
    }
    return null;
};

HorizontalChooser.prototype.selectPrev = function() {
    var lis = this.$root.find('li');
    var oldIndex = this.getSelectedIndex();
    if(oldIndex<1) return;
    this.selectId(lis[oldIndex-1].item.id);
};

HorizontalChooser.prototype.selectNext = function() {
    var lis = this.$root.find('li');
    var oldIndex = this.getSelectedIndex();
    if(oldIndex>=(lis.length-1)) return;
    this.selectId(lis[oldIndex+1].item.id);
};

HorizontalChooser.prototype.scrollToMakeVisible = function(li) {
    var r1 = YAHOO.util.Dom.getRegion(li);
    var r2 = YAHOO.util.Dom.getRegion(this.ul);
    var loc_l = r1.left-r2.left;
    var loc_r = r1.right-r2.left;
    var dx = 0;
    if(loc_l > (r2.width - r1.width)) {
        dx = (loc_l - r2.width) + r1.width + 1;
    } else if(loc_l < 0) {
        dx = loc_l;
    }
    if(dx) {
        this.ul.scrollLeft += dx;
        this.updateScrollVisual();
    }
};

HorizontalChooser.prototype.updateScrollVisual = function() {
    //thumb width
    var max_thumb_width = this.slider.clientWidth;
    var visible_width = this.ul.clientWidth;
    var full_width = this.ul.scrollWidth;
    var factor = visible_width / full_width;
    var thumb_width = Math.round(factor * max_thumb_width);
    YAHOO.util.Dom.setStyle(this.sliderWidget.thumb, 'width', thumb_width+'px');

    //thumb pos
    var max_scrollLeft = this.ul.scrollWidth - this.ul.clientWidth;
    if (max_scrollLeft == 0) {
        factor = 0;
    } else {
        factor = this.ul.scrollLeft / max_scrollLeft;
    }
    var max_thumbleft = this.slider.clientWidth - thumb_width;
    var thumb_left = Math.round(factor * max_thumbleft);
    YAHOO.util.Dom.setStyle(this.sliderWidget.thumb, 'left', thumb_left+'px');
};

HorizontalChooser.prototype.thumbDragged = function(value) {
    var r1 = YAHOO.util.Dom.getRegion(this.sliderWidget.thumb);
    var r2 = YAHOO.util.Dom.getRegion(this.slider);
    var dx = r1.left - r2.left;
    var max_dx = r2.width - r1.width;
    var factor = dx/max_dx;
    var max_scrollLeft = this.ul.scrollWidth - this.ul.clientWidth;
    this.ul.scrollLeft = Math.round(factor * max_scrollLeft);
};

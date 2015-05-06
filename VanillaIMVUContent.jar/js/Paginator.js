//Paginator using JQuery

Paginator = function (args) {
    /*
     * Use this structure in the HTML for the paginator
     * <div id="paginator-head">
     *     <div id="paginator">
     *         <li class="info"></li>
     *         <li class="next" style="display:none"></li>
     *         <ul id="numbers"></ul>
     *         <li class="previous" style="display:none"></li>
     *     </div>
     *     <li class="number-template"></li>
     * </div>
     *
     * Any datasource needs to implement the following functions:
     * updatePage: function(page) - updates the current page and fetches the appropriate data.  if pageNum is passed in, it sets the current page first.
     * currentPage: function(page) - returns the current page.  if pageNum is passed in, it sets the current page, does not fetch.
     * totalPages: function() - returns the total number of pages
     */
    this.$root = args.root;
    this.data = args.source;
    this.displayPages = args.displayPages || 5;

    this.$numbers = this.$root.find('#numbers');
    this.$info = this.$root.find('.info');
    this.$next = this.$root.find('.next');
    this.$prev = this.$root.find('.previous');
}

Paginator.prototype = {
    updateDisplay: function(pageNum) {
        var pageCount = this.data.totalPages(),
            startPage = Math.max(pageNum - Math.floor(this.displayPages / 2), 1),
            overflow = Math.max((startPage + this.displayPages - 1) - pageCount, 0),
            $numberDivs = this.$root.find('.number');

        if (pageCount === 0) {
            this.$info.text("No results to display");
            this.$next.hide();
            this.$prev.hide();
            this.$numbers.prepend(this.$info);
            return;
        }

        this.$info.text(_T("Showing page: ") + this.data.currentPage() + _T(" of ") + pageCount);
        this.$numbers.prepend(this.$info);
        this.$next.toggle(pageNum < pageCount);
        this.$prev.toggle(pageNum > 1);

        for (var i = 0; i < this.displayPages; i++) {
            $numberDivs.eq(i).unbind('click');
            if (i < overflow) {
                $numberDivs.eq(i).hide();
            } else {
                var page = startPage + (i - overflow);
                $numberDivs.eq(i).bind('click', function (page, event) {
                    this.data.updatePage(page);
                    this.updateDisplay(page);
                }.bind(this, page));
                $numberDivs.eq(i).text(page);
                $numberDivs.eq(i).show();
            }
            $numberDivs.eq(i).removeClass('current-page');
            if (parseInt($numberDivs.eq(i).text()) == pageNum) $numberDivs.eq(i).addClass('current-page');
        }        
    },

    buildPrevButton: function() {
        this.$prev.html('<img id="previous-image" src="../img/arrow_left.png" alt=">>"/>');
        this.$prev.bind('click', function (event) {
            var page = this.data.currentPage();
            this.data.updatePage(page - 1);
            this.updateDisplay(page - 1);
        }.bind(this));
        this.$numbers.append(this.$prev);
    },

    buildAllNumbers: function() {
        for(var i = 1; i <= this.displayPages; i++) {
            this.$numbers.append(this.$root.find('.number-template').clone().removeClass('number-template').addClass('number'));
        }
    },

    buildNextButton: function() {
        this.$next.html('<img id="next-image" src="../img/arrow_right.png" alt=">>"/>');
        this.$next.bind('click', function (event) {
            var page = this.data.currentPage();
            this.data.updatePage(page + 1);
            this.updateDisplay(page + 1);
        }.bind(this));
        this.$numbers.append(this.$next);
    },

    initPaginator: function() {
        this.$root.hide();
        this.$numbers.html('');
        this.buildPrevButton();
        this.buildAllNumbers();
        this.buildNextButton();
        this.updateDisplay(this.data.currentPage());
        this.$root.show();
    },

    setSource: function(datasource) {
        this.data = datasource;
        this.initPaginator();
    },
}
Breadcrumbs = function (args) {
    this.$root = args.root;
    this.titles = [];
}

Breadcrumbs.prototype = {
    addBreadcrumb: function (title, breadcrumbFn, fnArgs) {
        if (this.titles.length > 0) {
            $('.breadcrumb-' + (this.titles.length - 1)).removeClass('current-breadcrumb');
        }
        var breadcrumbClass = 'breadcrumb-' + this.titles.length;
        var $crumb = $('<span class="current-breadcrumb ' + breadcrumbClass  + '"><img class="breadcrumb-image" src="../img/white_arrow_icon.png" alt=">>"/></span>').append($('<span class="breadcrumb-text"></span>').text(title));

        this.$root.append($crumb);
        $crumb.bind('click', function (event) {
            if (!$('.' + breadcrumbClass).hasClass('current-breadcrumb')) {
                this.removeBreadcrumbs(breadcrumbClass);
                breadcrumbFn(fnArgs);
            }
        }.bind(this));
        this.titles.push(title);
    },

    removeBreadcrumbs: function (breadcrumbClass) {
        while (this.titles.length > 1) {
            var $nextCrumb = $('.breadcrumb-' + (this.titles.length - 1));
            if ($nextCrumb.hasClass(breadcrumbClass)) break;
            $nextCrumb.remove();
            this.titles.pop();
        }
        $('.breadcrumb-' + (this.titles.length - 1)).addClass('current-breadcrumb');
    },

    removeTopBreadcrumb: function () {
        $('.breadcrumb-' + (this.titles.length - 1)).remove();
        this.titles.pop();
        $('.breadcrumb-' + (this.titles.length - 1)).addClass('current-breadcrumb');
    },

    backOneBreadcrumb: function () {
        var children = this.$root.children();
        var len = children.length;
        $(children[len - 2]).click();
    }
}


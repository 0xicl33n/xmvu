// This is copied directly from the website. The test coverage is there.
// If it falls out of sync, copy a fresh version here.

(function ($) {

    function AutoExpander(el, settings) {
        this.$el = $(el);

        $.data(el, 'settings', $.extend({'max-height': 180}, settings || {}));

        this.$el.bind('keydown', this.resize);
        this.$el.bind('keyup', this.resize);
        this.$el.bind('blur', this.resize);
    }

    AutoExpander.prototype = {
        resize: function () {
            var $el = $(this);

            if ($el[0].scrollHeight > $el[0].offsetHeight) {
                $el.height($el[0].scrollHeight);
                if ($el[0].scrollHeight > $el[0].style.height) {
                    $el.height($el[0].scrollHeight);
                }

                if ($el[0].offsetHeight >= $.data($el[0], 'settings')['max-height']) {
                    $el.addClass('maxed');
                }
            }

            if ($el.val() === '') {
                $el[0].style.height = null;
                $el.removeClass('maxed');
            }
        }
    };

    $.fn.autoexpand = function (settings) {
        return this.each(function () {
            new AutoExpander(this, settings);
        });
    };

}(jQuery));
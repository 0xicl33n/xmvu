function Alert(args) {
    this.$root = $(args.root);
    this.imvu = args.imvu || imvuRequired;
    this.info = args.info || {};

    if (this.info.nativeChrome) {
        this.$root.addClass('native-chrome');
    }

    if (this.info.system) {
        this.$root.removeClass('alert');
    }

    this.$footer = this.$root.find('footer');
    this.$box = this.$footer.find('#box');

    this.wireHeader();
    this.wireBody();
    this.wireFooter();

    this.imvu.call('resize', this.$root.outerWidth(true), this.$root.outerHeight(true));
}

Alert.prototype = {
    wireHeader: function () {
        var $title = this.$root.find('#title');
        $title.html(this.info.title);

        this.$root.find('.close').click(this.cancelDialog.bind(this));
        onEscKeypress(this.cancelDialog.bind(this));

        var titleNoSpace = this.info.title || _T("Sent Message");
        $title.addClass(titleNoSpace.toLowerCase().replace(' ', ''));
    },
 
    cancelDialog: function() {
        this.imvu.call('cancelDialog');
    },

    wireBody: function () {
        var $text = this.$root.find('#text');
        $text.html(this.info.text);

        IMVU.Client.util.turnLinksIntoLaunchUrls($text, this.imvu);

        var $checkboxText = this.$root.find('label[for=box]');
        $checkboxText.html(this.info.checkboxText);
        if (this.info.checkboxWarning) {
            $checkboxText.addClass('warning');
        }

        if (this.info.checkboxDefault) {
            this.$box.prop('checked', true);
        }
    },

    wireFooter: function () {
        if (this.info.checkbox) {
            this.$footer.addClass('with-checkbox');
        }

        IMVU.buttons.addButtons(this.endDialog.bind(this), this.info.buttons);
    },

    endDialog: function (result) {
        var isChecked = false;
        if (this.$footer.is('.with-checkbox') && this.$box.is(':checked')) {
            isChecked = true;
        }

        this.imvu.call("endDialog", {
            result: result,
            is_checked: isChecked,
            checkbox_text: this.info.checkboxText,
        });
    },
};

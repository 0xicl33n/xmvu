// Requires jQuery
if(typeof jQuery != 'undefined') {
    function createModalDialog(el, dialog, options) {
        var handlers = options.on_click;
        var show_handler = options.on_show;
        var no_center = options.no_center;
        if (dialog) {
            var el_src = el;
            var diag_src = dialog;
            $(el).bind('click', function() {
                if (!$('#modal_overlay').length) {
                    $('body').append('<div id="modal_overlay"></div>');
                }
                if (show_handler && $.isFunction(show_handler)) {
                    show_handler(diag_src);
                }
                $('#modal_overlay').show();
                var $dialog_src = $(diag_src);
                $dialog_src.fadeIn(300);
                $dialog_src.css('z-index','1000');
                if (no_center != false) {
                    var $par = $(window);
                    var p_height = $par.height();
                    var p_width = $par.width();
                    var h = $dialog_src.outerHeight();
                    var w = $dialog_src.outerWidth();
                    var pos_top = 0;
                    if (p_height > h) {
                        pos_top = Math.round((p_height - h) / 2) + $(window).scrollTop();
                    }
                    var pos_left = 0;
                    if (p_width > w) {
                        pos_left = Math.round((p_width - w) / 2) + $(window).scrollLeft();
                    }
                    $dialog_src.css('top',pos_top);
                    $dialog_src.css('left',pos_left);
                }
                if (handlers) {
                    for (hdlr in handlers) {
                        var callback = handlers[hdlr];
                        var click_el = $(hdlr, diag_src);
                        click_el.data({
                            'modal_dialog': diag_src,
                            'modal_callback': callback,
                            'modal_source':el_src
                        });
                        click_el.unbind('click').bind('click', dialog_click_handler);
                    }
                }
            });
        }
        function dialog_click_handler () {
            var dialog = $(this).data('modal_dialog');
            var cb = $(this).data('modal_callback');
            var src = $(this).data('modal_source');
            if (dialog && $(dialog).length) {
                $(dialog).fadeOut(300);   
            }
            $('#modal_overlay').hide();
            if (cb && $.isFunction(cb)) {
                cb(src);
            }
        }
    };
}

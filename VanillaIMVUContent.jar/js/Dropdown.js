//Usage
//$('select_class_or_id').dropdown(method_as_string, args_of_method);

/*
 * Where #album-privacy-container is a div encapsulating .album-privacy. | .album-privacy is the select box itself.
 * 
 #album-privacy-container {
    border-top: 2px solid;
    -moz-border-top-colors:  #191919 #424242;
    margin-left: 10px;
    width: 240px;
}

.dropdown {
    top: 15px;
    font: 11px;
    color: #bbbbbb;
    position: relative;
    z-index: 4;
    cursor: pointer;
    height: 24px;
    width: 220px;
    border: 1px solid #696969;
    -moz-border-radius: 3px;    
    background: url(../img/select-tic-white.png) no-repeat scroll;
    background-position: 204px 9px;
    background-color: #333333;
    line-height: 22px;
}
    .dropdown:hover {
        border: 1px solid #444444;
        -moz-border-radius: 3px;
        background-color: #222222;
    }
    .dropdown .open {
        border: 1px solid #444444;
        -moz-border-radius: 3px;
        background-color: #222222;
        color: #bbbbbb;
    }
    .dropdown .title {
        padding-left: 10px;
        cursor: pointer;
    }
    .dropdown .selectList {
        padding-left: 00px;
    }
    .dropdown ul {
        background-color: #6a6a69;
        position: relative; 
        top: -9px;
        border: 1px solid #444444;
        border-left: 1px solid #afafaf;
    }
    .dropdown .list-item {
        padding-left: 10px;
        color: white; //TODO fix this
        text-decoration: none;
        cursor: pointer;
    }
    .dropdown li {
        cursor: pointer;
        display: block;    
    }    
    .dropdown li:hover {
        background-color: #ffd200;
    }
    .dropdown li:hover .list-item {
        color: #333333;
    }
*/

//See photos_mode index.html and style.css for examples

(function($) {
    
    //baseClassName is optional.  Applies another class to the stylized dropdown.  Can be used to differentiate between multiple dropdowns
    //on a single page or view.
    var defaults = {
        className: 'dropdown',
        baseClassName: '',
        openClassName: 'open',
        listName: 'selectList',
        noSelection: false,
        noSelectionText: 'Please select',
    };
    
    var methods = {
        init: function (spec) {
            var settings = $.extend(defaults, spec);
            this.each(function() {
                var $this = $(this).hide();
                $this.after('<div class="' + settings.className + " " + settings.baseClassName + '"><span class="title">' + settings.noSelectionText + '</span><ul class="' + settings.listName + '"></ul></span>');
                if (!settings.noSelection) {
                    $this.val(1);
                }
                var $dropdown = $this.next('.' + settings.className);
                if (settings.baseClassName != '') $dropdown.addClass(settings.baseClassName);

                var $list = $dropdown.find('ul');
                var $selected = $(this).find(':selected');
                
                var $title = $dropdown.find('.title');

                if (!settings.noSelection) {
                    var titleText = '';
                    if ($selected.length) titleText = $selected.text();
                    else titleText = $this.find('option:first-child').text();
                    $title.text(titleText);
                }

                $this.find('option').each(function() {
                    $list.append($('<li></li>').prepend($('<span class="list-item" href="' + $(this).val() + '"></span>').text($(this).text())));
                });

                $list.hide();
                var $listItems = $list.find('li').hide();
            
                function close() {
                    $(document).unbind('mouseup.dropdown');
                    $listItems.slideUp('slow', function() {
                        $dropdown.removeClass(settings.openClassName);
                        isOpen = false;
                        $list.hide();
                    });
                }
            
                var isOpen = false;
                $dropdown.bind('click', function() {
                    if(!isOpen) {
                        $dropdown.addClass(settings.openClassName);
                        $list.show();
                        $listItems.slideDown('fast', function() {
                            isOpen = true;
                    });
                    $(document).bind('mouseup.dropdown', function() {
                        close();
                    });
                    } else {
                        close();
                    }
                });

                $list.find('li').bind('click', function(e) {
                    $this.val($(this).find('.list-item').attr('href')).change();
                    $title.text($(this).text());
                    close();
                });
            }.bind(this));
        },
        
        setValue: function (value) {
            this.val(value);
            this.next().find('.title').text(this.find('option[value="' + value + '"]').text());
        },
        
        clearDropDown: function () {
            this.next().remove();
        },
    }
    
    $.fn.dropdown = function (method) {
        if (methods[method]) {
             return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
              return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.dropdown' );
        }
        
    }
}) ( jQuery);

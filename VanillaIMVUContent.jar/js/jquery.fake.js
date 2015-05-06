var fake$ = (function() {
    var $style = jQuery.style;
    var fakeStyles = {};
    var fake$ = new function() {};
    $.extend(fake$,{ 
        set: function(selector, name, value) { 
            if(!fakeStyles.hasOwnProperty(selector)){ 
                fakeStyles[selector] = {};
            }
            fakeStyles[selector][name] = value;
        },
        reset: function() { 
            fakeStyles = {};
        }
    });
    function style(selector, name, value) { 
        if(value !== undefined) { 
            fakeStyles[selector][name] = value;
        } else { 
            return fakeStyles[selector][name];
        }
    }

    function hasFake(selector, name) { 
        return fakeStyles.hasOwnProperty(selector) && fakeStyles[selector].hasOwnProperty(name);
    }
    function elementHasFake(elem, name) { 
        if(elem && typeof elem === 'object' && "setInterval" in elem) { 
            if(hasFake('window', name)) { 
                return 'window';
            }
            return false;
        }
        var $elem = $(elem);
        for(var selector in fakeStyles) { 
            if(!fakeStyles.hasOwnProperty(selector)) continue;
            if($elem.is(selector) && fakeStyles[selector].hasOwnProperty(name)) { 
                return selector;
            }
        }
        return false;
    }

    jQuery.style = function(elem, name, value) { 
        var selector = elementHasFake(elem, name);
        if(selector) { 
            return style(selector, name, value);
        }
        return $style.apply(this, arguments);
    };
    $attr = jQuery.fn.attr;
    jQuery.fn.attr = function(name, value) { 
        var elem = this[0];
        var selector = elementHasFake(elem, name);

        if(selector) { 
            return style(selector, name, value);
        }
        return $attr.apply(this, arguments);
    };
    var original = {};
    jQuery.each(["height", "width","offset"], function( i, name ) {
        var original = jQuery.fn[name];
        jQuery.fn[ name ] = function() {
            var elem = this[0];
            var selector = elementHasFake(elem, name);
            if(selector) { 
                return style(selector, name);
            } else { 
                return original.apply(this, arguments);
            }
        }
    });

    return fake$;

})();
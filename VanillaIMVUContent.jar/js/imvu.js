if (typeof IMVU != 'undefined') {
    throw new Error("IMVU already defined?");
}

// Per an engineering@ discussion, let's try out the ECMA-262, 5th edition bind(). We haven't upgraded to
// Gecko 2 yet, so the code below is a "reasonable bridge to the time when bind is widely implemented":
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
Function.prototype.bind = function (o) {
    var slice = [].slice,
        args = slice.call(arguments, 1),
        self = this,
        noop = function () {},
        bound = function () {
            try {
                return self.apply(this instanceof noop ? this : (o || {}),
                              args.concat(slice.call(arguments)));
            } catch (e) {
                console.log("Exception in bound function:");
                console.log(self.toSource());
                throw e;
            }
        };

    noop.prototype = self.prototype;
    bound.prototype = new noop;
    bound.originalLength = self.length;
    bound.realLength = bound.originalLength - args.length;
    return bound;
};

var IMVU = {
    Client: {
        widget: {}
    },
    Time: {}
};

if (typeof window.imvu == 'undefined') {
    //GeckoWindow sets the imvu field for the root of the nsIDOMWindow heirarchy
    window.imvu = window.top.imvu;

    try {
        IMVU.IS_FIREFOX = window.top.IMVU.IS_FIREFOX;
    } catch (e) { }

    if (typeof IMVU.IS_FIREFOX == 'undefined') {
        IMVU.IS_FIREFOX = true;
    }
}

if (IMVU.IS_FIREFOX) {
     IMVU.CALLS = [];
     window.imvu = {
         call: function(name) {
             IMVU.CALLS.push(arguments);
             if (name == 'getCustomerId') {
                 return 39;
             } else if (name == 'translate') {
                 return Array.prototype.slice.call(arguments)[1];
             } else if (name == "getDialogInfo") {
                 return {languageOptions:[]};
             } else if (name == 'maybeGetPartner') {
                 return null;
             } else if (name == 'log') {
                 return null;
             } else if (name == 'getServiceDomain') {
                 debugger;
                 return '';
             } else if (name == 'setStepNotifyCallback') {
                 var callback = window[Array.prototype.slice.call(arguments)[1]];
                 window.setInterval(callback, 33);
             } else {
                return null;
            }
        }
    };
}

IMVU.imvu = window.imvu;

/**
 * Translation function. Wrap strings in this function to allow them to be translated.
 * @param s     {string}    String to translate
 * @param imvu  {object}    Optional
 */
function _T
    (s, imvu) { //break with newline to prevent the translation extractor from picking this out
    if (imvu) {
        return imvu.call('translate', s);
    }

    if (typeof IMVU.imvu === 'undefined' || typeof IMVU.imvu.call === 'undefined')  {
        return s;
    }

    return IMVU.imvu.call("translate", s);
}

//replaces id element with textnode containing translated s
//designed to be called inline:
//<div>untranslated <script id='foo'>_iT('translated', 'foo')</script></div>
function _iT(s, id) {
    var el = document.getElementById(id);
    var par = el.parentNode;

    var translated = _T
        (s); //break with newline to prevent the translation extractor from picking this out

    var decoder = document.createElement("pre");
    decoder.innerHTML = translated;
    if (decoder.firstChild) {
        var decoded = decoder.firstChild.nodeValue;

        par.insertBefore(document.createTextNode(decoded), el);
    }
    par.removeChild(el);
}

function getFontSize(el) {
    return parseInt($(el).css('font-size'), 10);
}

function adjustTextSize(el, delta) {
    $(el).css('font-size', getFontSize(el) + parseInt(delta, 10) + 'px');
}

function dumpStack() {
    var frame = Components.stack;
    while(frame) {
        dump(frame+"\n");
        frame = frame.caller;
    }
}

function arrayFromArguments(args) {
    return Array.prototype.slice.call(args);
}

function cicmp(a, b) {
    a = String(a).toUpperCase();
    b = String(b).toUpperCase();
    if(a > b)
        return 1;
    if(a < b)
        return -1;
    return 0;
}

function widen_number(number, minwidth) {
    var s = number.toString();
    while(s.length < minwidth) s = '0'+s;
    return s;
}

function getQueryVariable(variable, win) {
  var query = (win || window).location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return null;
}

function convertPyBoolStr(strBoolVal) {
    if (strBoolVal == 'False') {
        return false;
    } else if (strBoolVal == 'True') {
        return true;
    }
    throw new Error("Unexpected value");
}

//each spec is:  {hotkeys:[], fn: fn}
//each hotkey is 'shift-ctrl-c', 'page_down', etc...
//I don't know what will happen if you bind modifier keys directly :)
function bindHotkeys(el, hotkeySpecs) {
    function bindKey(keyCode, items, fn) {
        $(el).keydown(function (e) {
            if(true
            && e.keyCode == keyCode
            && e.shiftKey == (-1 != items.indexOf('SHIFT'))
            && e.ctrlKey == (-1 != items.indexOf('CTRL'))
            ) {
                fn();
            }
        });
    }

    function bindSpec(spec) {
        for (var k in spec.hotkeys) {
            k = spec.hotkeys[k];
            var items = k.split('-').map(function(s){return s.toUpperCase();});
            var keyStr = items[items.length-1];
            var keyCodeName = 'DOM_VK_'+keyStr;
            var keyCode = KeyEvent[keyCodeName];
            bindKey(keyCode, items, spec.fn);
        }
    }
    for (var spec in hotkeySpecs) {
        spec = hotkeySpecs[spec];
        bindSpec(spec);
    }
}

function onEscKeypress(callback){
    $(document).keypress(function(event){
       if (event.keyCode == 27){
            callback();
       }
    });
}

function debugHTML(el) {
    // It's important to clone the element. Otherwise, you're removing it from the DOM.
    return $('<div/>').append($(el).clone()).html();
}

if (typeof IMVU.documentReady === 'undefined') {
    IMVU.documentReady = false;
    window.addEventListener('load', function () {
        IMVU.documentReady = true;
        if (typeof(IMVU.log) == 'function') {
            IMVU.log('document is ready');
        }
        IMVU.trackUIEvents();
    }, false);
}

IMVU.trackUIEvents = function () {
    document.querySelector('body').addEventListener('click', function(event) {
        var uiElement = $(event.target).closest('.ui-event');
        if (uiElement.length > 0) {
            IMVU.trackUIEvent.call(uiElement[0], event);
        }
      }, true);
}

IMVU.trackUIEvent = function (event) {
    var context = window.location.pathname + '*' + jQuery(this).attr('data-ui-name'),
        params = {},
        action = event['type'];
    jQuery.each(this.attributes, function(i, attrib) {
        if (attrib.name.indexOf("data-ui-") != -1) {
            params[attrib.name.substr(8)] = attrib.value;
        }
    });
    IMVU.imvu.call("sendUIEvent", context, action, params);
}

IMVU.truncateFieldValue = function (selector, limit) {
    var val = jQuery(selector).val();
    if (val.length > limit) {
        $(selector).val(val.substring(0, limit));
    }
    return val.length > limit;
}

if (typeof YAHOO !== 'undefined' && YAHOO.util && YAHOO.util.Event) {
    YAHOO.util.Event.throwErrors = true;
}

IMVU.log = function() {
    var a = [];
    for(var i=0; i<arguments.length; i++) {
        a.push(JSON.stringify(arguments[i]));
    }
    if(a.length == 1) {
        IMVU.imvu.call('log', a[0]);
    } else {
        IMVU.imvu.call('log', a);
    }

    if (IMVU.IS_FIREFOX) {
        var args = Array.prototype.slice.apply(arguments);
        args.unshift('>>> IMVU.log: ');
        console.log.apply(window, args);
    }
};

if (typeof console === 'undefined') {
    var console = {
        log: function () {
            var message = [];
            for (var i = 0; i < arguments.length; i += 1) {
                message.push(JSON.stringify(arguments[i]));
            }
            IMVU.imvu.call('log', message.join(' '));
        }
    };
}

if (typeof hayden === 'undefined') {
    var hayden = {
        prefix: 'HAYDEN',
        log: function (el) {
            if(typeof el === 'object') { 
                var temp =JSON.stringify(el, null, "   ");
                temp = temp.split('\n');
                for( var line in temp) { 
                    console.log(hayden.prefix,temp[line].replace(/\"/g, "'"));
                }
            } else { 
                console.log(hayden.prefix,el);
            }
        }
    };
}

IMVU.SERVICE_DOMAIN = IMVU.IS_FIREFOX ? '' : IMVU.imvu.call('getServiceDomain');
IMVU.REST_DOMAIN = IMVU.IS_FIREFOX ? '' : IMVU.imvu.call('getRestDomain');

// You are basically always doing the wrong thing if you call this.
// (says the guy who wrote it)
// -- andy 12 July 2010
IMVU.getOS = function() {
    if (navigator.userAgent.indexOf('Macintosh') != -1) {
        return 'Macintosh';
    } else {
        return 'Windows';
    }
};

IMVU.isMacOSX = function() {
    return IMVU.getOS() === 'Macintosh';
};

IMVU.runJS = function() {
    return (document.location.search != '?no_js');
};

IMVU.Client.util = {};

if(typeof _ !== 'undefined') { 
    IMVU.Client.util.fuzzy_match = (function(){
      var cache = _.memoize(function(str){
        return new RegExp("^"+str.replace(/./g, function(x){
          return /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(x) ? "\\"+x+"?" : x+"?";
        })+"$");
      });
      return function(str, pattern){
        return cache(str).test(pattern);
      };
    })();
}

IMVU.Client.util.shuffle = function( inputArr ) {
    // Randomly shuffle the contents of an array
    //
    // version: 903.3016
    // discuss at: http://phpjs.org/functions/shuffle
    // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +    revised by: Brett Zamir (http://brettz9.blogspot.com)
    // *     example 1: shuffle({5:'a', 2:'3', 3:'c', 4:5, 'q':5});
    // *     returns 1: true
    var valArr = [];
    var k = '', i = 0;

    for (k in inputArr) { // Get key and value arrays
        valArr.push(inputArr[k]);
        delete inputArr[k];
    }
    valArr.sort(function() {return 0.5 - Math.random();});

    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
        inputArr[i] = valArr[i];
    }

    return true;
};

IMVU.Client.bindAvatarWindow = function(el, hwnd, geckoHwnd) {
    if(typeof(el) == 'string') {
        el = document.getElementById(el);
    }
    el.onfocus = function() {
        imvu.call('setFocus3DWindow');
    };
    el.setAttribute('hwnd', hwnd);
    el.hwnd = hwnd;
    el.setAttribute('geckoHwnd', geckoHwnd);
    el.geckoHwnd = geckoHwnd;
};

/** Attach event listeners to all anchor tags that are a child of the given div.
* This is necessary to force these links to always open in a new browser window,
* rather than within the client itself.
* -- andy 20 June 2009
*/
IMVU.Client.util.turnLinksIntoLaunchUrls = function(el, imvu, tokenReplacements) {
    imvu = imvu || window.imvu;

    $('a', el).click(function () {
        var href = $(this).attr('href');
        if (typeof(href) !== 'undefined') {
            if (href[0] == '/') {
                href = 'http://www.imvu.com' + href;
            }
            for (var replacement in tokenReplacements) {
                replacement = tokenReplacements[replacement];
                href = href.replace(tokenReplacements[0], tokenReplacements[1]);
            }
            imvu.call('launchUrl', href);
        }
        return false;
    });
};

IMVU.Client.util.linkify = function (text) {
    var regex = /(\b(?:imvu|https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i,
        parts = text.split(regex),
        elements = [];

    for (var i = 0; i < parts.length; i += 1) {
        var textNode = document.createTextNode(parts[i]);
        if (regex.test(parts[i])) {
            var anchor = document.createElement('a');
            anchor.href = parts[i];
            anchor.target = '_blank';
            anchor.appendChild(textNode);
            elements.push(anchor);
        } else {
            elements.push(textNode);
        }
    }

    return elements;
}

IMVU.Client.util.number_format = function( number, decimals, dec_point, thousands_sep ) {
    // http://kevin.vanzonneveld.net
    // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +     bugfix by: Michael White (http://getsprink.com)
    // +     bugfix by: Benjamin Lupton
    // +     bugfix by: Allan Jensen (http://www.winternet.no)
    // +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // +     bugfix by: Howard Yeend
    // +    revised by: Luke Smith (http://lucassmith.name)
    // +     bugfix by: Diogo Resende
    // +     bugfix by: Rival
    // %        note 1: For 1000.55 result with precision 1 in FF/Opera is 1,000.5, but in IE is 1,000.6
    // *     example 1: number_format(1234.56);
    // *     returns 1: '1,235'
    // *     example 2: number_format(1234.56, 2, ',', ' ');
    // *     returns 2: '1 234,56'
    // *     example 3: number_format(1234.5678, 2, '.', '');
    // *     returns 3: '1234.57'
    // *     example 4: number_format(67, 2, ',', '.');
    // *     returns 4: '67,00'
    // *     example 5: number_format(1000);
    // *     returns 5: '1,000'
    // *     example 6: number_format(67.311, 2);
    // *     returns 6: '67.31'

    var n = number, prec = decimals;
    n = !isFinite(+n) ? 0 : +n;
    prec = !isFinite(+prec) ? 0 : Math.abs(prec);
    var sep = (typeof thousands_sep == "undefined") ? ',' : thousands_sep;
    var dec = (typeof dec_point == "undefined") ? '.' : dec_point;

    var s = (prec > 0) ? n.toFixed(prec) : Math.round(n).toFixed(prec); //fix for IE parseFloat(0.55).toFixed(0) = 0;

    var abs = Math.abs(n).toFixed(prec);
    var _, i;

    if (abs >= 1000) {
        _ = abs.split(/\D/);
        i = _[0].length % 3 || 3;

        _[0] = s.slice(0,i + (n < 0)) +
              _[0].slice(i).replace(/(\d{3})/g, sep+'$1');

        s = _.join(dec);
    } else {
        s = s.replace('.', dec);
    }

    return s;
};

IMVU.Client.util.hint =  function(els){
    // if  placeholder is not working , use this method
    //usage: IMVU.Client.util.hint([jels1, jels2, ...]);
    // need css: .hint
    $.each(els, function(){
        var th = $(this),
        text = th.attr('hint');

        if ( !text) {
            return;
        }

        th.unbind("blur").bind("blur", function() {
            var current = $.trim(th.val());

            if ( !current) {
                th.val(text).addClass("hint");
            } else {
                th.removeClass("hint");
            }
        }).unbind("focus").bind("focus", function() {
            var current = $.trim(th.val());

            if (current == text) {
                th.val("").removeClass("hint");
            }
        }).trigger("blur");

    });
};

IMVU.Client.util.scrollLeft = function($elem) {
    IMVU.Client.util.scrollHorizontal($elem, 50, false);
};

IMVU.Client.util.scrollRight = function($elem) {
    IMVU.Client.util.scrollHorizontal($elem, 50, true);
};

IMVU.Client.util.scrollHorizontal = function($elem, px_per_second, right) {
    var elem_width = $elem.width();
    var inner_width = $elem.find('.avname').width();
    var scroll_position = inner_width - elem_width;
    if (scroll_position <= 0) {
        return;
    }

    var duration = scroll_position / px_per_second * 1000;
    if (right) {
        scroll_position = 0;
    }
    $elem.stop(true);
    $elem.animate({
        scrollLeft: scroll_position
    }, duration);
};

IMVU.Client.util.generateHtml = function(templateSelector, data) {
    _.templateSettings.interpolate = /\{\{([\s\S]+?)\}\}/g;
    _.templateSettings.evaluate = /\{%([\s\S]+?)%\}/g;

    var html = _.template($(templateSelector).html(), data);
    var $wrapper = $('<div/>');
    $wrapper.html(html);

    $wrapper.find('span.credit').each(function() {
        $(this).text(IMVU.Client.util.number_format($(this).text()));
    });
    var wrapper_html = $wrapper.html();
    wrapper_html = wrapper_html
        .replace(/\n/g, '')
        .replace(/^\ *</,'<')
        .replace(/>\ *</g, '><')
        .replace(/>\ */,'>');
    return wrapper_html;
},

IMVU.Client.util.truncate = function(str, maxLen) {
    if (str.length > maxLen) {
        return str.substring(0, maxLen) + '...';
    }
    return str;
},

IMVU.Client.util.countInputChars = function(params) {
        // $area has data-max_count attribute
    // countInputChars({$area: '', $counter: '', });
    var $area = params.$area;
    var $counter = params.$counter;
    $area.bind('keyup', function() {
        var $th = $(this);
        var maxchars = parseInt($th.data('max_count'), 10);
        var value = $th.val();
        var $label = $th.prev('label[for=' + $th.attr('id') + ']');

        if (value === $label.text() || value === $th.attr('placeholder')) {
            value = '';
        }
        var length = value.length;
        var remaining = maxchars - length;
        if (remaining <= 0) {
            remaining = 0;
            $th.val(value.substring(0, maxchars));
            $counter.addClass('mg-error-text');
        } else {
            $counter.removeClass('mg-error-text');
        }
        $counter.text(remaining);
    }).bind('paste', function(){
        $(this).trigger('keyup');
    });
},

IMVU.Client.util.addDisableEvents = function($elements) {
    $elements.each(function() {
        var disable;
        if($(this).prop) { 
            disable = $(this).prop.bind($(this), 'disabled');
        } else { 
            disable = $(this).attr.bind($(this), 'disabled');
        }
        $(this).bind('to_disable',
            function() {
                disable(true).addClass('disabled');
            }
            ).bind('to_enable',
            function() {
                disable(false).removeClass('disabled');
            }
            );
    });
},


IMVU.Client.widget.showAlert = function (title, msg, imvu) {
    var _title = _T(title);
    var _msg = _T(msg);
    imvu = imvu || (typeof window.imvu !== 'undefined' ? window.imvu : undefined);
    imvu.call('showAlertDialog', _title, _msg, null);
};

IMVU.Client.widget.showConfirm = function (title, msg, imvu) {
    var _title = _T(title);
    var _msg = _T(msg);
    imvu = imvu || (typeof window.imvu !== 'undefined' ? window.imvu : undefined);
    imvu.call('showConfirmationDialog', _title, _msg);
};

// Network Cache takes a REST response which caches a 'denormalized' response
// Example response should be:
/*
{
    "status" : "success",
    "id" : "foo.com/bar",
    "denormalized" : {
        "foo.com/bar" : {
            "data" : {
                "foo" : "bar"
            },
            "relations" : {
                "baz" : "foo.com/baz"
            }
        }
    }
*/
// Using network cache is not much different than IMVU.Network. Calling "get" takes a url
// and a "success/failure" callback object.
// Example usage:
/* 
var cache = new IMVU.NetworkCache(IMVU.Network);
cache.get('foo.com/bar', {
    success : function(response) {
        // success code
    },
    failure : function(response) {
        // failure code
    }
});
*/
IMVU.NetworkCache = function(network) {
    this.network = network;
    this.responses = {};
};

IMVU.NetworkCache.prototype = {
    get : function(url, callback) {
        if (this.responses.hasOwnProperty(url)) {
            callback.success(this.responses[url]);
            return;
        }       
        var networkCallback = {
            success : function(response) {                    
                for (var i in response.responseText.denormalized) {
                    if (response.responseText.denormalized.hasOwnProperty(i)) {
                        this.responses[i] = response.responseText.denormalized[i];
                    }
                }
                                
                callback.success(this.responses[response.responseText.id]);
            },
            failure : function(response) {
                callback.failure(response);
            },
            scope : this
        };
        this.network.asyncRequest('GET', url, networkCallback, undefined);
    },
    
    invalidate : function(url) {
        if (typeof this.responses[url] !== 'undefined') {
            delete this.responses[url];
        }
    },
    
    invalidateAll : function() {
        this.responses = {};
    }
};

IMVU.Network = {};

if (typeof YAHOO !== 'undefined' && YAHOO.util && YAHOO.util.CustomEvent) {
    IMVU.Client.refreshInventoryEvent = new YAHOO.util.CustomEvent("refreshInventory");
}

IMVU.Client.refreshInventory = function() {
    setTimeout(function() {
        imvu.call("refreshInventory");
        IMVU.Client.refreshInventoryEvent.fire();
    }, 2000);
};

IMVU.Client.callbackRegistry = {};
IMVU.Client.callbackRegistryLastId = 0;

IMVU.Client.registerCallback = function(callback) {
    var callbackId = IMVU.Client.callbackRegistryLastId + 1;
    IMVU.Client.callbackRegistryLastId = callbackId;
    IMVU.Client.callbackRegistry[callbackId] = callback;
    return callbackId;
};

IMVU.Client.getCallback = function(callbackId) {
    var callback = IMVU.Client.callbackRegistry[callbackId];
    return callback;
};

IMVU.Client.deleteCallback = function(callbackId) {
    if (typeof IMVU.Client.callbackRegistry[callbackId] !== 'undefined') {
        delete IMVU.Client.callbackRegistry[callbackId];
    }
};

IMVU.Client.fireCallback = function(callbackId, scope, args) {
    var callback = IMVU.Client.getCallback(callbackId);
    return callback.apply(scope, args);
};

IMVU.callAsync = function (name, callback, imvu) {
    imvu = imvu || (typeof window.imvu !== 'undefined' ? window.imvu : undefined);
    var callbackId = IMVU.Client.registerCallback(callback);
    IMVU.log("Asynchronously calling ", name, " as ", callbackId, " for ", callback.toSource());
    var args = Array.prototype.slice.call(arguments, 3);
    imvu.callAsync(name, callbackId, 'IMVU.callAsyncReturn', args);
    return callbackId;
}

IMVU.callJSAsync = function (imvu, callback) {
    imvu = imvu || (typeof window.imvu !== 'undefined' ? window.imvu : undefined);
    var callbackId = IMVU.Client.registerCallback(callback);
    var args = Array.prototype.slice.call(arguments, 2);
    imvu.call('callJSAsync', callbackId);
}

IMVU.callAsyncReturn = function(callbackId, result) {
    var callback = IMVU.Client.getCallback(callbackId);
    var start = new Date();
    callback(result);
    var took = new Date() - start;
    if (took > 5000) {
        IMVU.log("Took " + took/1000 + " seconds to execute async callback.");
    }
    IMVU.Client.deleteCallback(callbackId);
}

IMVU.Network.asyncRequest = function (method, url, callback, args, imvu, useHtml) {
    imvu = imvu || (typeof window.imvu !== 'undefined' ? window.imvu : undefined);
    useHtml = !!useHtml;

    if (typeof callback === 'undefined') {
        throw new Error('asyncRequest requires a well-formed callback object. Offending url was: ' + url );
    }
    if (typeof callback.success === 'undefined') {
        throw new Error('asyncRequest callback requires a "success" handler. Offending url was: ' + url);
    }
    if (typeof callback.failure === 'undefined') {
        throw new Error('asyncRequest callback requires a "failure" handler. Offending url was: ' + url);
    }
    var callbackId = IMVU.Client.registerCallback(callback);
    imvu.call('requestWithCallback', method, url, [/*TODO:  Start requiring schemas*/], args, useHtml, callbackId);
    return callbackId;
};

IMVU.Network.completePost = function (callbackId, result, error) {
    var callback = IMVU.Client.getCallback(callbackId);
    if (typeof callback === 'undefined') {
        return false;
    }

    if ((typeof error !== 'undefined') && (error !== null)) {
        callback.failure.call((typeof callback.scope !== 'undefined' ? callback.scope : callback), error);
    } else {
        callback.success.call((typeof callback.scope !== 'undefined' ? callback.scope : callback), {responseText: result, argument: callback.argument});
    }

    IMVU.Client.deleteCallback(callbackId);
    return true;
};

IMVU.Client.completeCallback = function (callbackId, result) {
    var callback = IMVU.Client.getCallback(callbackId);
    if (typeof callback === 'undefined') {
        return false;
    }

    callback(result);

    IMVU.Client.deleteCallback(callbackId);
    return true;
};

IMVU.Network.isCallInProgress = function(callObjOrId) {
    return YAHOO.util.Connect.isCallInProgress(callObjOrId);
};

IMVU.Network.abort = function(callObjOrId) {
    if (IMVU.Client.getCallback(callObjOrId)) {
        // Removing the callback is not a *real* abort, but it's the easiest way
        // to prevent the callback from firing.
        IMVU.Client.deleteCallback(callObjOrId);
    } else {
        return YAHOO.util.Connect.abort(callObjOrId);
    }
};

function serviceRequest(spec) {
    spec = spec || {};

    var method = spec.method || methodMustBeSpecified;
    var uri = spec.uri || uriMustBeSpecified;
    var network = spec.network || networkMustBeSpecified;
    var imvu = spec.imvu || imvuMustBeSpecified;
    var fullUri = uri;
    if (uri.substring(0,1)==='/') {
        // you gave us a short uri. NP, we'll take care of it.
        fullUri = IMVU.SERVICE_DOMAIN + uri;
    }
    var callback = spec.callback || function (response, error) {
        if (error) {
            var message = 'serviceRequest: ' + method + ' ' + fullUri + ': ';

            if (error.error) {
                message += 'response error: ' + error.error;
            } else {
                message += 'response was ' + response;
            }

            imvu.call('log', message);
        }
    };

    if (callback.length != 2 && callback.originalLength != 2 && callback.realLength != 2){
        EXPLODE("Callback must take exactly two arguments (result, error) for uri= " + uri);
    }

    var json = spec.json ? true : false;
    if (typeof spec.data === 'string') {
        dataMustBeAnObjectOfKeyValuePairs;
    }

    return network.asyncRequest(method, fullUri, {

        success: function (o) {
            var response = null;
            var error = null;
            try {
                // authenticated requests give us pre-parsed json
                // non-auth non-json doesn't need to be parsed
                if (typeof o.responseText === 'undefined') {
                    error = {error: 'service did not respond', method:method, uri:fullUri};
                } else if (typeof(o.responseText)!=='string') {
                    // authenticated network requests get parsed in the network layer (obscure feature)
                    response = o.responseText;
                } else if (json) {
                    response = YAHOO.lang.JSON.parse(o.responseText);
                } else {
                    response = o.responseText;
                }
            } catch (e) {
                if (e.constructor == SyntaxError) {
                    error = {error: 'json syntax error', method:method, response: o.responseText, uri:fullUri};
                } else {
                    throw e;
                }
            }

            if (response && (response.error || response.hasOwnProperty('success') && !response.success)){
                error = response;
                response = null;
            }

            callback(response, error);
        },

        failure: function (o) {
            callback(null, {error: 'service did not respond', method:method, uri:fullUri});
        }

    }, spec.data, imvu, spec.useHtml);
}

function htmlspecialchars(s) {
    return s.replace('&', '&amp;', 'g').replace('<', '&lt;', 'g').replace('>', '&gt;', 'g');
}

function stripScriptTags(s) {
    var r = /(?:<script[^>]*>)|(?:<\/script>)/g;
    return s.replace(r, htmlspecialchars);
}

function stripTags(s) {
    var r = /<[^>]*>/g;
    return s.replace(r, '');
}

function _steHelper(unitsSingular, unitsPlural, unitvalue, displayString) {
    if( unitvalue ) {
        if( displayString ) {
            displayString += ', ';
        }

        displayString += unitvalue + ' ';


        if(unitvalue>1) {
            displayString += unitsPlural;
        } else {
            displayString += unitsSingular
        }
    }

    return displayString;
}

function secondsToEnglish(seconds) {

    var _seconds = parseInt(seconds % 60,10);
    var _minutes = parseInt((seconds%3600)/60,10);
    var _hours = parseInt(seconds/3600,10);

    var _display = '';

    _display = _steHelper(_T("hour"), _T("hours"), _hours, _display);
    _display = _steHelper(_T("minute"), _T("minutes"), _minutes, _display);
    _display = _steHelper(_T("second"), _T("seconds"),_seconds, _display);

    return _display;
}

function DUMP(object, header, grepPrefix) {

    IMVU.log( '' );
    IMVU.log( '' );
    IMVU.log( grepPrefix+': ********************************************** ' );
    IMVU.log( grepPrefix+': ' + header );
    IMVU.log( grepPrefix+': ********************************************** ' );

    for(var x in object) {
        IMVU.log( grepPrefix+': object.'+x+': '+object[x] );
    }

    IMVU.log( grepPrefix+': ********************************************** ' );
}

/// soemtimes we need a js stacktrace where it'd otherwise be swallowed.  This gives us that.
function EXPLODE(msg) {
    try {
        throw new Error(msg);
    } catch(e) {
        IMVU.log("msg: "+msg);
        IMVU.log("stack follows:");
        IMVU.log(e.stack);
        throw e;
    }
}

// yanked from quirks mode
function findElementPosition(el) {
    var position = {left:0, top:0};
    if (el.offsetParent) {
        do {
            position.left += el.offsetLeft;
            position.top += el.offsetTop;
        } while ((el = el.offsetParent));
    }
    return position;
}

function endsWith(string, suffix) {
    return string.substr(-suffix.length) == suffix;
}

function supportedChars(fontSize) {
    return ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
}

function charWidths(fontSize) {
    var charWidths = {},
        $holder = $('<span>').hide().css({
            'font-size': fontSize
        }),
        charList = this.supportedChars().split(''),
        letter;
    $('body').append($holder);
    for (var i = 0; i < charList.length; i++) {
        letter = charList[i];
        $holder.text(letter);
        charWidths[letter] = $holder.width();
    }
    $holder.remove();
    return charWidths;
}

//This function can be generalized easily and used in other places -- Hayden
function ellipsize($label, width, fontsize) {
    var width = width || 115,
        fontsize = fontsize || 12,
        text = $label.text(),
        letters = text.split(''),
        letterCopy = '',
        new_text = '',
        calculatedWidth = 0,
        lettersIgnored = false,
        i, letter, new_text;
    this.charWidthsForFontsize = this.charWidthsForFontsize || {};
    this.charWidthsForFontsize[fontsize] = (this.charWidthsForFontsize && this.charWidthsForFontsize[fontsize]) || charWidths(fontsize);
    for (i = 0; i < letters.length; i++) {
        letter = letters[i];
        letterCopy = letter;
        if (this.supportedChars().indexOf(letter) == -1) {
            letterCopy = 'W';
        }
        if(calculatedWidth + this.charWidthsForFontsize[fontsize][letterCopy] < width) {
            new_text += letter;
            calculatedWidth += charWidthsForFontsize[fontsize][letterCopy];
        } else {
            lettersIgnored = true;
            break;
        }
    }
    if(lettersIgnored) {
        new_text = new_text + "..."
    }
    $label.text(new_text);
}

function escapeForRegExp(text) { 
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function getBackgroundImage(el) {
    var bg = $(el).css('background-image'),
        result = /\/(chrome|content)([^")]*)/.exec(bg);
    if (result) {
        return result[2];
    }
    return /(http[^")]*)/.exec(bg)[1];
}

function samplePixelColor($image) { 
    try {
        var canvas = $('<canvas/>').css({width:1,height:1})[0];
        canvas.getContext('2d').drawImage($image[0], 0, 0, 1, 1);
        var pixelData = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
        return 'rgb('+pixelData[0]+','+pixelData[1]+','+pixelData[2]+')';
    } catch(err) { 
        return 'black';
    }
}

function labelover(fields) {
    $(fields).each(function (index, el) {
        var $el = $(el);
        if (!$el.val()) {
            $el.parent().addClass('labelover');
        }

        $el.bind('click focus keydown', function () {
            $el.parent().removeClass('labelover');
        }).blur(function () {
            $el.parent().toggleClass('labelover', !$el.val());
        });
    });
}

function areJSONEqual(a, b) {
    var at = JSON.stringify(a);
    var bt = JSON.stringify(b);
    return at==bt;
}


if(typeof YAHOO != 'undefined') {
    /*******************************************************************************************

    Below here be patches for YUI.

    *******************************************************************************************/

    /**
     * r60027
     * Throw errors globally and not just to the console on Event subscribers
     */
    YAHOO.util.Event.throwErrors = true;


    /**
     * r60753
     * Add exception stack when thrown inside JavaScript test.
     */
    YAHOO.util.UnexpectedError = function (cause /*:Object*/){
        if (typeof cause !== 'object' || !cause.message || !cause.stack) {
            if (cause.name !== 'DisabledTestException') {
                cause = new Error(JSON.stringify(cause));
            }
        }

        //call superclass
        YAHOO.util.AssertionError.call(this, "Unexpected error: " + cause.message + " with stack:\n" + cause.stack);

        /**
         * The unexpected error that occurred.
         * @type Error
         * @property cause
         */
        this.cause /*:Error*/ = cause;

        /**
         * The name of the error that occurred.
         * @type String
         * @property name
         */
        this.name /*:String*/ = "UnexpectedError";

        /**
         * Stack information for the error (if provided).
         * @type String
         * @property stack
         */
        this.stack /*:String*/ = cause.stack;

        this.getMessage = function() {
            return this.message;
        };

    };

    if(YAHOO.tool && YAHOO.tool.TestManager) {
        YAHOO.tool.TestManager._handleTestRunnerComplete = function(data) {

            this.fireEvent(this.TEST_PAGE_COMPLETE_EVENT, {
                    page: this._curPage,
                    results: data.results
                });

            //save results
            //this._results[this.curPage] = data.results;

            //process 'em
            this._processResults(this._curPage, data.results);

            this._logger.clearTestRunner();

            //if there's more to do, set a timeout to begin again
            if (this._pages.length){
                this._timeoutId = setTimeout(function(){
                    YAHOO.tool.TestManager._run();
                }, 1);
            } else {
                this.fireEvent(this.TEST_MANAGER_COMPLETE_EVENT, this._results);
            }
        };

    }


    if (YAHOO && YAHOO.widget && YAHOO.widget.AutoComplete) {
        (function (YAHOO) {
            var originalPrototype = YAHOO.widget.AutoComplete.prototype;

            // The original silently does nothing if you fail to pass required arguments.  Unbelievable.
            // It does this not once but multiple times. It goes out of its way to confuse you.  This
            // obscures the stack traces when things eventually do explode: the object will have been
            // constructed in an invalid state.  Thanks, YAHOO.
            YAHOO.widget.AutoComplete = function(elInput,elContainer,oDataSource,oConfigs) {
                if (!elInput) throw new Error('elInput is required');
                if (!elContainer) throw new Error('elContainer is required');
                if (!oDataSource) throw new Error('oDataSource is required');
                if (!oConfigs.timer) throw new Error('timer is required');
                if (!YAHOO.util.Dom.inDocument(elInput)) throw new Error('elInput was not found in the document');
                if (!YAHOO.util.Dom.inDocument(elContainer)) throw new Error('elContainer was not found in the document');
                if (!YAHOO.lang.isFunction(oDataSource.sendRequest)) throw new Error('oDataSource.sendRequest is a required function');

                this.dataSource = oDataSource;

                // YAHOO.widget.DataSource schema backwards compatibility
                // Converted deprecated schema into supported schema
                // First assume key data is held in position 0 of results array
                this.key = 0;
                var schema = oDataSource.responseSchema;
                // An old school schema has been defined in the deprecated DataSource constructor
                if(oDataSource._aDeprecatedSchema) {
                    var aDeprecatedSchema = oDataSource._aDeprecatedSchema;
                    if(YAHOO.lang.isArray(aDeprecatedSchema)) {

                        if((oDataSource.responseType === YAHOO.util.DataSourceBase.TYPE_JSON) ||
                        (oDataSource.responseType === YAHOO.util.DataSourceBase.TYPE_UNKNOWN)) { // Used to default to unknown
                            // Store the resultsList
                            schema.resultsList = aDeprecatedSchema[0];
                            // Store the key
                            this.key = aDeprecatedSchema[1];
                            // Only resultsList and key are defined, so grab all the data
                            schema.fields = (aDeprecatedSchema.length < 3) ? null : aDeprecatedSchema.slice(1);
                        }
                        else if(oDataSource.responseType === YAHOO.util.DataSourceBase.TYPE_XML) {
                            schema.resultNode = aDeprecatedSchema[0];
                            this.key = aDeprecatedSchema[1];
                            schema.fields = aDeprecatedSchema.slice(1);
                        }
                        else if(oDataSource.responseType === YAHOO.util.DataSourceBase.TYPE_TEXT) {
                            schema.recordDelim = aDeprecatedSchema[0];
                            schema.fieldDelim = aDeprecatedSchema[1];
                        }
                        oDataSource.responseSchema = schema;
                    }
                }

                if(YAHOO.lang.isString(elInput)) {
                        this._sName = "instance" + YAHOO.widget.AutoComplete._nIndex + " " + elInput;
                        this._elTextbox = document.getElementById(elInput);
                }
                else {
                    this._sName = (elInput.id) ?
                        "instance" + YAHOO.widget.AutoComplete._nIndex + " " + elInput.id:
                        "instance" + YAHOO.widget.AutoComplete._nIndex;
                    this._elTextbox = elInput;
                }
                YAHOO.util.Dom.addClass(this._elTextbox, "yui-ac-input");

                if(YAHOO.lang.isString(elContainer)) {
                        this._elContainer = document.getElementById(elContainer);
                }
                else {
                    this._elContainer = elContainer;
                }

                // For skinning
                var elParent = this._elContainer.parentNode;
                var elTag = elParent.tagName.toLowerCase();
                if(elTag == "div") {
                    YAHOO.util.Dom.addClass(elParent, "yui-ac");
                }

                // Default applyLocalFilter setting is to enable for local sources
                if(this.dataSource.dataType === YAHOO.util.DataSourceBase.TYPE_LOCAL) {
                    this.applyLocalFilter = true;
                }

                // Set any config params passed in to override defaults
                if(oConfigs && (oConfigs.constructor == Object)) {
                    for(var sConfig in oConfigs) {
                        if(sConfig) {
                            this[sConfig] = oConfigs[sConfig];
                        }
                    }
                }

                // Initialization sequence
                this._initContainerEl();
                this._initProps();
                this._initListEl();
                this._initContainerHelperEls();

                // Set up events
                var oSelf = this;
                var elTextbox = this._elTextbox;

                // Dom events
                YAHOO.util.Event.addListener(elTextbox,"keyup",oSelf._onTextboxKeyUp,oSelf);
                YAHOO.util.Event.addListener(elTextbox,"keydown",oSelf._onTextboxKeyDown,oSelf);
                YAHOO.util.Event.addListener(elTextbox,"focus",oSelf._onTextboxFocus,oSelf);
                YAHOO.util.Event.addListener(elTextbox,"blur",oSelf._onTextboxBlur,oSelf);
                YAHOO.util.Event.addListener(elContainer,"mouseover",oSelf._onContainerMouseover,oSelf);
                YAHOO.util.Event.addListener(elContainer,"mouseout",oSelf._onContainerMouseout,oSelf);
                YAHOO.util.Event.addListener(elContainer,"click",oSelf._onContainerClick,oSelf);
                YAHOO.util.Event.addListener(elContainer,"scroll",oSelf._onContainerScroll,oSelf);
                YAHOO.util.Event.addListener(elContainer,"resize",oSelf._onContainerResize,oSelf);
                YAHOO.util.Event.addListener(elTextbox,"keypress",oSelf._onTextboxKeyPress,oSelf);
                YAHOO.util.Event.addListener(window,"unload",oSelf._onWindowUnload,oSelf);

                // Custom events
                this.textboxFocusEvent = new YAHOO.util.CustomEvent("textboxFocus", this);
                this.textboxKeyEvent = new YAHOO.util.CustomEvent("textboxKey", this);
                this.dataRequestEvent = new YAHOO.util.CustomEvent("dataRequest", this);
                this.dataReturnEvent = new YAHOO.util.CustomEvent("dataReturn", this);
                this.dataErrorEvent = new YAHOO.util.CustomEvent("dataError", this);
                this.containerPopulateEvent = new YAHOO.util.CustomEvent("containerPopulate", this);
                this.containerExpandEvent = new YAHOO.util.CustomEvent("containerExpand", this);
                this.typeAheadEvent = new YAHOO.util.CustomEvent("typeAhead", this);
                this.itemMouseOverEvent = new YAHOO.util.CustomEvent("itemMouseOver", this);
                this.itemMouseOutEvent = new YAHOO.util.CustomEvent("itemMouseOut", this);
                this.itemArrowToEvent = new YAHOO.util.CustomEvent("itemArrowTo", this);
                this.itemArrowFromEvent = new YAHOO.util.CustomEvent("itemArrowFrom", this);
                this.itemSelectEvent = new YAHOO.util.CustomEvent("itemSelect", this);
                this.unmatchedItemSelectEvent = new YAHOO.util.CustomEvent("unmatchedItemSelect", this);
                this.selectionEnforceEvent = new YAHOO.util.CustomEvent("selectionEnforce", this);
                this.containerCollapseEvent = new YAHOO.util.CustomEvent("containerCollapse", this);
                this.textboxBlurEvent = new YAHOO.util.CustomEvent("textboxBlur", this);
                this.textboxChangeEvent = new YAHOO.util.CustomEvent("textboxChange", this);

                // Finish up
                elTextbox.setAttribute("autocomplete","off");
                YAHOO.widget.AutoComplete._nIndex++;
            };

            YAHOO.widget.AutoComplete.prototype = originalPrototype;
        }(YAHOO));

        // This allows the AutoComplete widget to be tested synchronously.
        YAHOO.widget.AutoComplete.prototype._onTextboxKeyUp = function(v,oSelf) {
            var sText = this.value; //string in textbox

            // Check to see if any of the public properties have been updated
            oSelf._initProps();

            // Filter out chars that don't trigger queries
            var nKeyCode = v.keyCode;
            if(oSelf._isIgnoreKey(nKeyCode)) {
                return;
            }

            // Clear previous timeout
            if(oSelf._nDelayID != -1) {
                clearTimeout(oSelf._nDelayID);
            }

            // Set new timeout
            oSelf._nDelayID = oSelf.timer.setTimeout(function(){
                    oSelf._sendQuery(sText);
                },(oSelf.queryDelay * 1000));
        };
    }

    /*
     * TODO: IS THIS NEEDED?
    if(YAHOO.widget && YAHOO.widget.SliderThumb) {
        YAHOO.widget.SliderThumb.prototype.getOffsetFromParent = function(parentPos) {
            var el = this.getEl(), newOffset,
                myPos,ppos,l,t,deltaX,deltaY,newLeft,newTop;

            myPos = YAHOO.util.Dom.getXY(el);
            ppos  = parentPos || YAHOO.util.Dom.getXY(this.parentElId);

            newOffset = [ (myPos[0] - ppos[0]), (myPos[1] - ppos[1]) ];

            l = parseInt( YAHOO.util.Dom.getStyle(el, "left"), 10 );
            t = parseInt( YAHOO.util.Dom.getStyle(el, "top" ), 10 );

            deltaX = l - newOffset[0];
            deltaY = t - newOffset[1];

            return newOffset;
        };
    }
    */

    if(YAHOO && YAHOO.util && YAHOO.util.XHRDataSource) {
        YAHOO.util.XHRDataSource.prototype.makeConnection = function(oRequest, oCallback, oCaller) {
            var oRawResponse = null;
            var DS = YAHOO.util.DataSourceBase;
            var lang = YAHOO.util.Lang;
            var tId = DS._nTransactionId++;
            this.fireEvent("requestEvent", {tId:tId,request:oRequest,callback:oCallback,caller:oCaller});

            // Set up the callback object and
            // pass the request in as a URL query and
            // forward the response to the handler
            var oSelf = this;
            var oConnMgr = this.connMgr;
            var oQueue = this._oQueue;

            /**
             * Define Connection Manager success handler
             *
             * @method _xhrSuccess
             * @param oResponse {Object} HTTPXMLRequest object
             * @private
             */
            var _xhrSuccess = function(oResponse) {
                // If response ID does not match last made request ID,
                // silently fail and wait for the next response
                if(oResponse && (this.connXhrMode == "ignoreStaleResponses") &&
                        (oResponse.tId != oQueue.conn.tId)) {
                    return null;
                }
                // Error if no response
                else if(!oResponse) {
                    this.fireEvent("dataErrorEvent", {request:oRequest, response:null,
                            callback:oCallback, caller:oCaller,
                            message:DS.ERROR_DATANULL});

                    // Send error response back to the caller with the error flag on
                    DS.issueCallback(oCallback,[oRequest, {error:true}], true, oCaller);

                    return null;
                }
                // Forward to handler
                else {
                    // Try to sniff data type if it has not been defined
                    if(this.responseType === DS.TYPE_UNKNOWN) {
                        var ctype = (oResponse.getResponseHeader) ? oResponse.getResponseHeader["Content-Type"] : null;
                        if(ctype) {
                            // xml
                            if(ctype.indexOf("text/xml") > -1) {
                                this.responseType = DS.TYPE_XML;
                            }
                            else if(ctype.indexOf("application/json") > -1) { // json
                                this.responseType = DS.TYPE_JSON;
                            }
                            else if(ctype.indexOf("text/plain") > -1) { // text
                                this.responseType = DS.TYPE_TEXT;
                            }
                        }
                    }
                    this.handleResponse(oRequest, oResponse, oCallback, oCaller, tId);
                }
            };

            /**
             * Define Connection Manager failure handler
             *
             * @method _xhrFailure
             * @param oResponse {Object} HTTPXMLRequest object
             * @private
             */
            var _xhrFailure = function(oResponse) {
                this.fireEvent("dataErrorEvent", {request:oRequest, response: oResponse,
                        callback:oCallback, caller:oCaller,
                        message:DS.ERROR_DATAINVALID});

                // Backward compatibility
                if(lang.isString(this.liveData) && lang.isString(oRequest) &&
                    (this.liveData.lastIndexOf("?") !== this.liveData.length-1) &&
                    (oRequest.indexOf("?") !== 0)){
                }

                // Send failure response back to the caller with the error flag on
                oResponse = oResponse || {};
                oResponse.error = true;
                DS.issueCallback(oCallback,[oRequest,oResponse],true, oCaller);

                return null;
            };

            /**
             * Define Connection Manager callback object
             *
             * @property _xhrCallback
             * @param oResponse {Object} HTTPXMLRequest object
             * @private
             */
             var _xhrCallback = {
                success:_xhrSuccess,
                failure:_xhrFailure,
                scope: this
            };

            // Apply Connection Manager timeout
            if(YAHOO.util.Lang.isNumber(this.connTimeout)) {
                _xhrCallback.timeout = this.connTimeout;
            }

            // Cancel stale requests
            if(this.connXhrMode == "cancelStaleRequests") {
                    // Look in queue for stale requests
                    if(oQueue.conn) {
                        if(oConnMgr.abort) {
                            oConnMgr.abort(oQueue.conn);
                            oQueue.conn = null;
                        }
                        else {
                        }
                    }
            }

            // Get ready to send the request URL
            if(oConnMgr && oConnMgr.asyncRequest) {
                var sLiveData = this.liveData;
                var isPost = this.connMethodPost;
                var sMethod = (isPost) ? "POST" : "GET";
                // Validate request
                var sUri = (isPost || !YAHOO.util.Lang.isValue(oRequest)) ? sLiveData : sLiveData+oRequest;
                var sRequest = (isPost) ? oRequest : null;

                // Send the request right away
                if(this.connXhrMode != "queueRequests") {
                    if(oConnMgr == IMVU.Network) {
                        oQueue.conn = oConnMgr.asyncRequest(sMethod, sUri, _xhrCallback, sRequest, this.imvu.call);
                    } else {
                        oQueue.conn = oConnMgr.asyncRequest(sMethod, sUri, _xhrCallback, sRequest);
                    }
                }
                // Queue up then send the request
                else {
                    // Found a request already in progress
                    if(oQueue.conn) {
                        var allRequests = oQueue.requests;
                        // Add request to queue
                        allRequests.push({request:oRequest, callback:_xhrCallback});

                        // Interval needs to be started
                        if(!oQueue.interval) {
                            oQueue.interval = setInterval(function() {
                                // Connection is in progress
                                if(oConnMgr.isCallInProgress(oQueue.conn)) {
                                    return;
                                }
                                else {
                                    // Send next request
                                    if(allRequests.length > 0) {
                                        // Validate request
                                        sUri = (isPost || !lang.isValue(allRequests[0].request)) ? sLiveData : sLiveData+allRequests[0].request;
                                        sRequest = (isPost) ? allRequests[0].request : null;
                                        oQueue.conn = oConnMgr.asyncRequest(sMethod, sUri, allRequests[0].callback, sRequest);

                                        // Remove request from queue
                                        allRequests.shift();
                                    }
                                    // No more requests
                                    else {
                                        clearInterval(oQueue.interval);
                                        oQueue.interval = null;
                                    }
                                }
                            }, 50);
                        }
                    }
                    // Nothing is in progress
                    else {
                        oQueue.conn = oConnMgr.asyncRequest(sMethod, sUri, _xhrCallback, sRequest);
                    }
                }
            }
            else {
                // Send null response back to the caller with the error flag on
                DS.issueCallback(oCallback,[oRequest,{error:true}],true,oCaller);
            }

            return tId;
        }
    }

    // Yes, this is needed. It fixes a YUI Carousel bug, and commenting it out
    // caused the carousel in Shop Mode to have wonky behavior that wasn't caught
    // in a test case.
    if(YAHOO && YAHOO.widget && YAHOO.widget.Carousel) {
        YAHOO.widget.Carousel.prototype.getVisibleItems = function() {
            var carousel = this,
                i        = carousel.get("firstVisible"),
                n        = i + carousel.get("numVisible"),
                r        = [],
                item;

            while (i < n) {
                item = carousel.getItem(i);
                if(item) {
                    r.push(item);
                }
                i++;
            }

            return r;
        }
    }
}

// Domain Public by Eric Wendelin http://eriwen.com/ (2008)
//                  Luke Smith http://lucassmith.name/ (2008)
//                  Loic Dachary <loic@dachary.org> (2008)
//                  Johan Euphrosine <proppy@aminche.com> (2008)
//                  �yvind Sean Kinsey http://kinsey.no/blog (2010)
//
// Information and discussions
// http://jspoker.pokersource.info/skin/test-printstacktrace.html
// http://eriwen.com/javascript/js-stack-trace/
// http://eriwen.com/javascript/stacktrace-update/
// http://pastie.org/253058
// http://browsershots.org/http://jspoker.pokersource.info/skin/test-printstacktrace.html
//

/**
 *
 * @cfg {Error} e The error to create a stacktrace from (optional)
 * @cfg {Boolean} guess If we should try to resolve the names of anonymous functions
 */
function printStackTrace(options) {
    var ex = (options && options.e) ? options.e : null;
    var p = new printStackTrace.implementation();
    return p.run(ex);
}

printStackTrace.implementation = function() {};

printStackTrace.implementation.prototype = {
    run: function(ex) {
        // Use either the stored mode, or resolve it
        var mode = this._mode || this.mode();
        if (mode === 'other') {
            return this.other(arguments.callee);
        } else {
            ex = ex ||
                (function() {
                    try {
                        (0)();
                    } catch (e) {
                        return e;
                    }
                })();
            return this[mode](ex);
        }
    },

    mode: function() {
        try {
            (0)();
        } catch (e) {
            if (e.arguments) {
                return (this._mode = 'chrome');
            } else if (e.stack) {
                return (this._mode = 'firefox');
            } else if (window.opera && !('stacktrace' in e)) { //Opera 9-
                return (this._mode = 'opera');
            }
        }
        return (this._mode = 'other');
    },

    chrome: function(e) {
        return e.stack.replace(/^.*?\n/, '').
                replace(/^.*?\n/, '').
                replace(/^.*?\n/, '').
                replace(/^[^\(]+?[\n$]/gm, '').
                replace(/^\s+at\s+/gm, '').
                replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@').
                split('\n');
    },

    firefox: function(e) {
        return e.stack.replace(/^.*?\n/, '').
                replace(/(?:\n@:0)?\s+$/m, '').
                replace(/^\(/gm, '{anonymous}(').
                split('\n');
    },

    // Opera 7.x and 8.x only!
    opera: function(e) {
        var lines = e.message.split('\n'), ANON = '{anonymous}',
            lineRE = /Line\s+(\d+).*?script\s+(http\S+)(?:.*?in\s+function\s+(\S+))?/i, i, j, len;

        for (i = 4, j = 0, len = lines.length; i < len; i += 2) {
            if (lineRE.test(lines[i])) {
                lines[j++] = (RegExp.$3 ? RegExp.$3 + '()@' + RegExp.$2 + RegExp.$1 : ANON + '()@' + RegExp.$2 + ':' + RegExp.$1) +
                ' -- ' +
                lines[i + 1].replace(/^\s+/, '');
            }
        }

        lines.splice(j, lines.length - j);
        return lines;
    },

    // Safari, Opera 9+, IE, and others
    other: function(curr) {
        var ANON = '{anonymous}', fnRE = /function\s*([\w\-$]+)?\s*\(/i, stack = [], j = 0, fn, args;

        var maxStackSize = 10;
        while (curr && stack.length < maxStackSize) {
            fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
            args = Array.prototype.slice.call(curr['arguments']);
            stack[j++] = fn + '(' + printStackTrace.implementation.prototype.stringifyArguments(args) + ')';

            //Opera bug: if curr.caller does not exist, Opera returns curr (WTF)
            if (curr === curr.caller && window.opera) {
                //TODO: check for same arguments if possible
                break;
            }
            curr = curr.caller;
        }
        return stack;
    },

    /**
     * @return given arguments array as a String, subsituting type names for non-string types.
     */
    stringifyArguments: function(args) {
        for (var i = 0; i < args.length; ++i) {
            var argument = args[i];
            if (typeof argument == 'object') {
                args[i] = '#object';
            } else if (typeof argument == 'function') {
                args[i] = '#function';
            } else if (typeof argument == 'string') {
                args[i] = '"' + argument + '"';
            }
        }
        return args.join(',');
    },

    sourceCache: {},

    /**
     * @return the text from a given URL.
     */
    ajax: function(url) {
        var req = this.createXMLHTTPObject();
        if (!req) {
            return;
        }
        req.open('GET', url, false);
        req.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
        req.send('');
        return req.responseText;
    },

    createXMLHTTPObject: function() {
        // Try XHR methods in order and store XHR factory
        var xmlhttp, XMLHttpFactories = [
            function() {
                return new XMLHttpRequest();
            }, function() {
                return new ActiveXObject('Msxml2.XMLHTTP');
            }, function() {
                return new ActiveXObject('Msxml3.XMLHTTP');
            }, function() {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        ];
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
                // Use memoization to cache the factory
                this.createXMLHTTPObject = XMLHttpFactories[i];
                return xmlhttp;
            } catch (e) {}
        }
    },

    getSource: function(url) {
        if (!(url in this.sourceCache)) {
            this.sourceCache[url] = this.ajax(url).split('\n');
        }
        return this.sourceCache[url];
    }
};

var Assert = YAHOO.util.Assert;
var ArrayAssert = YAHOO.util.ArrayAssert;
var UserAction = YAHOO.util.UserAction;
var Dom = YAHOO.util.Dom;

Assert.areJsonEqual = function (a, b, message) {
    return this.areEqual(
        YAHOO.lang.JSON.stringify(a),
        YAHOO.lang.JSON.stringify(b),
        message
    );
}.bind(Assert);

ArrayAssert.containsArray = function (needle, haystack) {
    if(inArray(needle, haystack)) {
        return true;
    }
    Assert.fail("containsArray failed");
}.bind(ArrayAssert);

$(function () {
    // We can't truly test focus, but we can test a side effect.
    $('button, input, select, textarea').die('blur focus')
        .live('blur',  function () { $(this).removeClass('focused'); })
        .live('focus', function () { $(this).addClass('focused'); });

    if (!$('#scratch').length) {
        return;
    }

    $button = $('<button>Show Scratch</button>');
    $button.click(function () {
        var $scratch = $('#scratch, #scratch-iframe, #template');
        $scratch.toggleClass('onscreen');
        if ($scratch.hasClass('onscreen')) {
            $button.text('Hide Scratch');
        } else {
            $button.text('Show Scratch');
        }
    });

    $('body').prepend($button);
});
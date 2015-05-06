/*
 * HACK: synthesizing UI events in JS is unreliable.
 * NOTE: This method prefers the YUI event definition
 *
 * Example use:
 *
 * var fakeYuiEvent = {type:'click', target:myDomElement, originalTarget:myDomElement};
 * var fakeDomEvent = onclick
 * synthesizeEvent(myDomElement, fakeYuiEvent, fakeDomEvent);
 * 
 * or use:
 *
 * synthesizeEvent(myDomElement, fakeYuiEvent);
 *
 * -- andy 9 June 2009
 */
function synthesizeEvent(el, yuiEvent, domEvent) {
    var l = yuiEvent ? YAHOO.util.Event.getListeners(el, yuiEvent.type) : false;
    if (!l || l.length == 0) {
        YAHOO.util.Assert.isNotUndefined(domEvent, 'No event handler in synthesizeEvent');
        domEvent();
    }
    else {
        for (var handler in l) {
            handler = l[handler];
            handler.fn.call(handler.scope || yuiEvent, yuiEvent, handler.obj);
        }
    }
}

/*
 * Synthesize a click.
 * See the above comment.
 *
 * -- andy 10 December
 */
function synthesizeClick(el) {
    if (el === el.toString()) { // Seriously, JavaScript?  What the hell. >:(
        el = document.getElementById(el);
    }

    var fakeYuiEvent = {type: 'click', target: el, currentTarget: el, originalTarget: el};
    var fakeDomEvent = el.onclick;
    synthesizeEvent(el, fakeYuiEvent, fakeDomEvent);
}

function synthesizeDOMClick(el) {
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    return el.dispatchEvent(event);
}

/*
 * Synthesize changing an element that has a YUI event handler.
 */
function synthesizeChange(el) {
    if (el === el.toString()) {
        el = document.getElementById(el);
    }

    var fakeYuiEvent = {type: 'change', target: el, currentTarget: el, originalTarget: el};
    var fakeDomEvent = el.onchange;
    synthesizeEvent(el, fakeYuiEvent, fakeDomEvent);
}

function synthesizeMouseEvent(el, type) {
    var event = el.ownerDocument.createEvent('MouseEvents');

    event.initMouseEvent(type, true, true, el.ownerDocument.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    el.dispatchEvent(event);
}

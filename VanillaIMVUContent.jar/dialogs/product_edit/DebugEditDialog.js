
function createDebugEditDialog(spec) {
    var imvuCall = spec.imvuCall || imvuCallRequired;
    var $rootElement = spec.$rootElement || rootElementRequired;
    var $titleEl = $rootElement.find('.title');
    var $operationEl = $rootElement.find('.operation');
    var $labelEl = $rootElement.find('.label');
    var $valueEl = $rootElement.find('.value');
    var $underEl = $rootElement.find('.under');
    var $underLabelEl = $rootElement.find('.underLabel');
    var $revertUndefinedEl = $rootElement.find('.revertUndefined');
    var $btnClose = $rootElement.find('.close-button');

    var info = spec.info || infoRequired;
    var value = info.value || '';
    var fullKey = info.fullKey || [];
    var op = info.op;

    var onOK = function() {
        if (op == 'addData' || op == 'addKey') {
            imvuCall('endDialog', [$labelEl.val(), $valueEl.val()]);
        } else {
            imvuCall('endDialog', $valueEl.val());
        }
    };
    var btnOK = new ImvuButton($rootElement.find('.ok-button')[0], { callback: onOK });

    var onCancel = function() {
        imvuCall('cancelDialog');
    }
    $btnClose.click(onCancel);

    var enableImmediateOKOnEnter = false;
    var onDlgKeyPress = function(evt) {
        if (evt.keyCode == 27) {
            onCancel();
        }

        if (enableImmediateOKOnEnter && evt.keyCode == 13 && btnOK.isEnabled()) {
            onOK();
        }
    }
    $(document).keypress(onDlgKeyPress);

    var onFinalFieldKeyPress = function(evt) {
        if (evt.keyCode == 13 && btnOK.isEnabled()) {
            onOK();
        }
    };

    /* Any changes to this routine must be matched by corresponding changes to isFullKeyEditable in DebugPanel.js.
       It would be great if some day the list of allowable keys was constructed once in ProductEditMode and passed in
       to both of these JavaScript routines. */
    var isItAllowedToAddKey = function(fullKey, key) {
        if (!key) {
            return false;
        }
        var lcKey = key.toLowerCase();
        if (!fullKey || fullKey.length == 0) {
            if (lcKey == 'productid' || lcKey == 'producttype' || lcKey == 'product_info' || lcKey == '__dataimport') {
                return false;
            }
        } else if (fullKey.length == 2) {
            var actionLabel = /^Action\d+$/i;
            if (actionLabel.test(fullKey[0]) && fullKey[1].toLowerCase() == 'definition') {
                if (lcKey == 'producttype') {
                    return false;
                }
            }
        }
        return true;
    };

    var onLabelKeyPress = function(evt) {
        if (isItAllowedToAddKey(fullKey, $labelEl.val())) {
            btnOK.enable();
        } else {
            btnOK.disable();
        }
    }

    var key = '';
    var parentKey = '';
    if (fullKey && fullKey.length > 0) {
        key = fullKey[fullKey.length - 1];
        if (fullKey.length > 1) {
            parentKey = fullKey[fullKey.length - 2];
        }
    }

    if (op == 'addKey' || op == 'addData') {
        $labelEl.val('');
        $underEl.html(key);
    } else {
        $labelEl.val(key);
        $underEl.html(parentKey);
    }

    if ($underEl.html()) {
        $underLabelEl.css('display' ,'');
    } else {
        $underLabelEl.css('display' ,'none');
    }

    $valueEl.val(value);

    var enableValue = function(enable) {
        $valueEl.css('display', '');
        $revertUndefinedEl.css('display', 'none');
        if (enable) {
            $valueEl.prop('disabled', false);
            $valueEl.removeClass('disabled');
        } else {
            $valueEl.addClass('disabled');
            $valueEl.prop('disabled', true);
        }
    }

    var showRevertToUndefined = function() {
        $valueEl.css('display', 'none');
        $revertUndefinedEl.css('display', '');
    }

    var enableLabel = function(enable) {
        if (enable) {
            $labelEl.prop('disabled', false);
            $labelEl.removeClass('disabled');
        } else {
            $labelEl.prop('disabled', true);
            $labelEl.addClass('disabled');
        }
    }

    switch(op) {
        case 'addKey':
            $titleEl.html(_T('Add New Dictionary Key'));
            $operationEl.html(_T('Add New Key:'));
            enableLabel(true);
            enableValue(false);
            $labelEl.focus();
            $labelEl.keyup(onLabelKeyPress);
            $labelEl.keypress(onFinalFieldKeyPress);
            enableImmediateOKOnEnter = true;
            btnOK.disable();
            break;
        case 'addData':
            $titleEl.html(_T('Add New Dictionary Entry'));
            $operationEl.html(_T('Add New Data Item:'));
            enableLabel(true);
            enableValue(true);
            $labelEl.focus();
            $labelEl.keyup(onLabelKeyPress);
            $valueEl.keypress(onFinalFieldKeyPress);
            enableImmediateOKOnEnter = true;
            btnOK.disable();
            break;
        case 'edit':
            $titleEl.html(_T('Edit Dictionary Entry'));
            $operationEl.html(_T('Edit Data Item:'));
            enableLabel(false);
            enableValue(true);
            $valueEl.focus();
            $valueEl.select();            
            $valueEl.keypress(onFinalFieldKeyPress);
            enableImmediateOKOnEnter = true;
            break;
        case 'delete':
            $titleEl.html(_T('Delete Dictionary Entry'));
            $operationEl.html(_T('Delete Data Item:'));
            enableLabel(false);
            enableValue(false);
            enableImmediateOKOnEnter = true;
            break;
        case 'override':
            $titleEl.html(_T('Override Dictionary Entry'));
            $operationEl.html(_T('Override Data Item:'));
            enableLabel(false);
            enableValue(true);
            $valueEl.focus();
            $valueEl.select();
            $valueEl.keypress(onFinalFieldKeyPress);
            enableImmediateOKOnEnter = true;
            break;
        case 'revert':
            $titleEl.html(_T('Revert Dictionary Entry'));
            $operationEl.html(_T('Revert Data Item:'));
            enableLabel(false);
            if ($valueEl.val()) {
                enableValue(false);
            } else {
                showRevertToUndefined();
            }
            enableImmediateOKOnEnter = true;
            break;
    }
}


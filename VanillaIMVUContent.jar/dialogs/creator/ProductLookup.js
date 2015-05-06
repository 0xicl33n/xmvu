STICKER_CATEGORY = 495

function ProductLookup(args) {
    this.$root = $(args.root);
    this.imvu = args.imvu;
    this.network = args.network;
    this.timer = args.timer;
    this.lastCheckedPid = 0;

    this.action = args.action;
    if (this.action != 'derive' && this.action != 'edit') {
        throw new Error('action must be "derive" or "edit"');
    }

    this.$image = this.$root.find('#image');
    this.$spinner = this.$root.find('#spinner');
    this.$name = this.$root.find('#name');
    this.$creator = this.$root.find('#creator');
    this.$derivation = this.$root.find('#derivation');
    this.$submission = this.$root.find('#submission');
    this.$fees = this.$root.find('.fees');
    this.$feesBreakdown = this.$fees.find('.breakdown');
    this.$feesNA = this.$fees.find('.na');
    this.$derivable = this.$root.find('#derivable');
    this.$derivableYes = this.$derivable.find('.yes');
    this.$derivableNo = this.$derivable.find('.no');
    this.$details = this.$root.find('.details');

    if (this.action == 'edit') {
        this.$fees.hide();
        this.$derivable.hide();
    }

    this.$pid = this.$root.find('#pid');
    this.$pid.bind('keyup keypress', this.handleProductIdKeypress.bind(this));
    this.$pid.focus();

    this.$go = $('#go');
    this.$go.click(this.clickGo.bind(this));
    this.disableGo();

    this.$error = $('#error');
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

ProductLookup.prototype.showNotice = function (message) {
    this.$go.fadeTo('fast', 0, function () {
        var w = 250;
        this.$error.text(message);
        this.$error.fadeIn(w).delay(w).fadeOut(w)
                   .fadeIn(w).delay(w).fadeOut(w)
                   .fadeIn(w);
    }.bind(this));
}

ProductLookup.prototype.showError = function (message) {
    this.$go.fadeTo('fast', 0, function () {
        this.$go.hide();
        this.$error.text(message);
        this.$error.fadeIn('fast');
    }.bind(this));
}

ProductLookup.prototype.hideError = function () {
    this.$error.fadeOut('fast', function () {
        if (this.$go.is(':not(:disabled)')) {
            this.$go.show();
            this.$go.fadeTo('fast', 1);
        }
    }.bind(this));
}

ProductLookup.prototype.clickGo = function () {
    this.imvu.call('newProductEditor', {action: this.action, pid: this.lastCheckedPid});
    this.imvu.call('endDialog', {});
}

ProductLookup.prototype.parseProductId = function () {
    var pid = this.$pid.val();

    pid = pid.replace(/\D/g, '');
    if (pid.length > 9) {
        pid = pid.substr(0, 9);
    }

    pid = parseInt(pid, 10);
    if (isNaN(pid)) {
        pid = '';
    }

    return pid;
}

ProductLookup.prototype.handleProductIdKeypress = function () {
    this.timer.clearTimeout(this.keypressTimeout);
    this.keypressTimeout = this.timer.setTimeout(function () {
        var pid = this.parseProductId();
        if (!pid) {
            this.disableGo();
            this.hideError();
        }

        this.$pid.val(pid);
        this.handleProductIdChange();
    }.bind(this), 500);
}

ProductLookup.prototype.handleProductIdChange = function (context) {
    var pid  = this.parseProductId();
    if (pid != this.$details.attr('id')) {
        this.$details.attr('id', pid);

        this.$spinner.fadeIn('fast');
        this.disableGo();
        this.hideError();

        this.$details.fadeOut('fast', function () {
            this.$image.css({opacity: 0});
            this.$image.unbind('load').bind('load', function () {
                this.$spinner.fadeOut('fast');
                this.$image.fadeTo('fast', 1);
            }.bind(this));

            this.fetchProductInfo(pid, function (args) {
                $('#dialog').removeClass('admin-only');
                if (!args.error) {
                    this.refreshProductInfo(args);
                    this.$details.fadeIn('fast');
                } else {
                    this.$image.unbind('load');
                    this.$spinner.fadeOut('fast');
                }
            }.bind(this));
        }.bind(this));
    }
}

ProductLookup.prototype.isSticker = function (info) {
    var categories = info.parent_categories || [];
    for (var i = 0; i < categories.length; i += 1) {
        if (categories[i].id == STICKER_CATEGORY) {
            return true;
        }
    }

    return false;
}

ProductLookup.prototype.refreshProductInfo = function (args) {
    this.hideError();

    this.$image.attr('src', args.info.image);
    this.$name.text(args.info.name);
    this.$creator.text(args.info.creator_name);
    this.$derivation.text(args.info.derivation_price);
    this.$submission.text(args.info.derivation_submission_fee);

    var isDerivable = args.info.derivable == '1';
    var isVisible = args.info.visible == '1';
    this.$derivableYes.add(this.$feesBreakdown).toggle(isDerivable);
    this.$derivableNo.add(this.$feesNA).toggle(!isDerivable);

    if (this.isSticker(args.info)) {
        this.showError('Product is a sticker, try another product ID.');
        return;
    }

    var isAdmin = this.imvu.call('isAdmin'),
        isOwner = (args.info.creator_id == this.imvu.call('getCustomerId'))
        hasPermission = false;

    if (this.action == 'derive') {
        if (isDerivable && !isVisible && !isOwner && !isAdmin) {
            this.showError('You do not have permission, try another product ID');
        }
        if (isDerivable || isOwner) {
            this.enableGo(args.info.pid);
        } else {
            this.showError('Product is not derivable, try another product ID.');
        }
    } else if (this.action == 'edit') {
        hasPermission = args.permission.edit == '1';

        $('#dialog').removeClass('admin-only');
        this.hideError();

        if (isAdmin && !isOwner) {
            $('#dialog').addClass('admin-only');
            this.showNotice("Admin ONLY! Do not edit without permission!");
            this.enableGo(args.info.pid);
        } else if (!isOwner && !hasPermission) {
            this.showError("You did not create this product, try another product ID.");
        } else {
            this.enableGo(args.info.pid);
        }
    }

}

ProductLookup.prototype.disableGo = function () {
    this.lastCheckedPid = 0;
    this.$go.prop('disabled',true).fadeTo('fast', 0.2);
}

ProductLookup.prototype.enableGo = function (pid) {
    this.lastCheckedPid = parseInt(pid);
    this.$go.prop('disabled', false).fadeTo('fast', 1);
}

ProductLookup.prototype.fetchProductPermission = function (pid, info, callback) {
    if (IMVU.Network.isCallInProgress(this.connectionPermission)) {
        IMVU.Network.abort(this.connectionPermission);
    }

    this.connectionPermission = serviceRequest({
        method: 'GET',
        uri: IMVU.SERVICE_DOMAIN + '/api/product_permissions.php?pid=' + pid,
        network: this.network,
        imvu: this.imvu,
        callback: function (response, error) {
            if (!response || typeof response.derive_from == 'undefined' || typeof response.edit == 'undefined') {
                callback({error: 1});
                return;
            }

            callback({info: info, permission: response});
        }.bind(this)
    });
}

ProductLookup.prototype.fetchProductInfo = function (pid, callback) {
    if (IMVU.Network.isCallInProgress(this.connectionInfo)) {
        IMVU.Network.abort(this.connectionInfo);
    }

    var isAdmin = this.imvu.call('isAdmin');

    this.connectionInfo = serviceRequest({
        method: 'GET',
        uri: IMVU.SERVICE_DOMAIN + '/api/shop/product.php?pid=' + pid,
        network: this.network,
        imvu: this.imvu,
        callback: function (response, error) {
            if (!response || !response.products || !response.products.length) {
                callback({error: 1});
                return;
            }

            var info = response.products[0];
            if (!isAdmin && info.name == 'Product without info') {
                this.showError("Product does not exist, try another product ID.");
                callback({error: 1});
            } else {
                this.fetchProductPermission(pid, info, callback);
            }
       }.bind(this)
    });
}

DUMMY_PRODUCT_RESPONSE = {
    pid: 123,
    image: 'img/pid-icon.png',
    name: 'Waterfall Room',
    creator_name: 'ChattyNatty',
    creator_id: 40,
    derivation_price: 350,
    derivation_submission_fee: 500,
    derivable: '1',
    visible: '1'
}

DUMMY_PRODUCT_RESPONSE_2 = {
    pid: 234,
    image: 'img/pid-icon.png',
    name: 'Waterrise Room',
    creator_name: 'ChattyNatty',
    derivation_price: 350,
    derivation_submission_fee: 500,
    derivable: '1'
}

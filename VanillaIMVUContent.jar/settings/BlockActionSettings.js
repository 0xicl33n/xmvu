(function () {

function BlockActionSettings(root, imvu) {
    this._root = $(root);
    this._list = $('.block_action_list', root);
    this.imvu = imvu;
    this.attachHandlers();
    
    $('.retrieve-list', this._root).toggleClass("visible", true);
    this.loadActions(0);
}
BlockActionSettings.prototype = {
    attachHandlers: function() {
        $('.all_friends', this._root).unbind('click').bind('click', function() {
            var $not_checked = $('.friend:not(:checked)', this._root);
            $not_checked.prop('checked', true);
            $not_checked.trigger('change');
        });
        $('.all_nonfriends', this._root).unbind('click').bind('click', function() {
            var $not_checked = $('.all:not(:checked)', this._root);
            $not_checked.prop('checked', true);
            $not_checked.trigger('change');
        });
    },
    loadActions: function(retry_count) {
        var actions = this.imvu.call('getBlockActionPrefs');
        if (actions == null || actions.length == 0) {
            if(retry_count < 15)
            {
                setTimeout(function(bas){bas.loadActions(retry_count+1);}, 2000, this);
            }
        } else {
            this.populate(actions);
        }
    },    
    populate: function(actions) {
        this.hideSpinner();
        for each(var cat in actions) {
            this.addCategory(cat);
        }
    },
    addCategory: function(category) {
        var $cat_dl = $('<dl></dl>').addClass('block_action_cat');
        $cat_dl.append($('<dt/>').text(category.category));
        this._list.append($cat_dl);
        var action_list = category.actionList;
        var self = this;
        var hasVIP = this.imvu.call('hasVIPPass');
        var hasAP = this.imvu.call('hasAccessPass');
        for each(var action in action_list) {
            var $action_div = $('<dl></dl>');
            $action_div.append($('<dt></dt>').text(action.name));
            var $vip_ap_div = $('<dd></dd>');
            var disable_checkbox = "";
            if (action.requiresAP) {
                $vip_ap_div.append($('<span></span>').addClass('block_action_ap'));
                if (!hasAP) {
                    disable_checkbox = "disabled='disabled'";
                }

            }
            if (action.requiresVIP) {
                $vip_ap_div.append($('<span></span>').addClass('block_action_vip'));
                if (!hasVIP) {
                    disable_checkbox = "disabled='disabled'";
                }
            }
            $action_div.append($vip_ap_div);
            // action.friend is true if allowed, but checkbox is checked if blocked
            var checked = (action.friend) ? "" : "checked";
            var $friend_checkbox = $('<input type="checkbox" ' + disable_checkbox + ' ' + checked + ' class="friend"></input>').attr('name', action.id);
            $friend_checkbox.change(function() {
                self.onChecked(this);
            });
            $action_div.append($('<dd></dd>').append($friend_checkbox));
            // action.all true if allowed, but checked if blocked
            checked = (action.all) ? "": "checked";
            var $all_checkbox = $('<input type="checkbox" ' + disable_checkbox + ' ' + checked + ' class="all"></input>').attr('name', action.id);
            $all_checkbox.change(function() {
                self.onChecked(this);
            });
            $action_div.append($('<dd></dd>').append($all_checkbox));
            this._list.append($action_div);
        }
    },
    onChecked: function(elem) {
        var action_id = $(elem).attr('name');
        var setting_for = $(elem).hasClass('friend') ? "friend" : "all";
        var checked = $(elem).is(':checked');
        this.imvu.call('setBlockActionPref', action_id, setting_for, checked);
    },
    hideSpinner: function() {
        $('.retrieve-list', this._root).removeClass("visible");
    }
};

window.BlockActionSettings = BlockActionSettings;

})();

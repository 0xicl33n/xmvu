IMVU.buttons = {};

IMVU.buttons.addButton = function (endDialog, button_info) {
    var id = button_info.name.toLowerCase().replace(/[\s\W]/g, ''),
        $div = $('<button class="imvu-button level2 ui-event" data-ui-name="' + button_info.name + '">' + button_info.name + '</button>')
            .attr({id: id, tabindex: button_info.tabindex});

    if (button_info.yellow) {
        $div.addClass('yellow');
    }

    if (button_info.grey) {
        $div.addClass('white-text')
            .addClass('dark-gray');
    }

    $('#button-bar').append($div);

    $div.unbind('click').click(function() {
        endDialog(button_info.value);
    });

    return $div;
};

IMVU.buttons.addButtons = function (endDialog, buttons) {
    var $divs = [];
    for each (var button_info in buttons) {
        $divs.push(IMVU.buttons.addButton(endDialog, button_info));
    }

    if ($divs.length < 3) {
        if ( !$divs[$divs.length - 1].hasClass('yellow') ) {
            $divs[$divs.length - 1].addClass('light-gray');
        }
    }
};

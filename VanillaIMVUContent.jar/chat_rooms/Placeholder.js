function createPlaceholder($input, defaultText) { 
    $input.focus(function() { 
        if ($input.hasClass('default-text')) {
            $input.val("");
            $input.removeClass('default-text');
        }
    });
    $input.blur(function() {
        if ($input.val() === "") {
            $input.val("Search all rooms...");
            $input.addClass('default-text');
        }
    });
}
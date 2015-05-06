
function setupVipActionUpsellDialog($root, imvuCall) {
    function onClickCta() {
        imvuCall('launchNamedUrl', 'vippass');
        imvuCall('cancelDialog');
    }

    function onClickClose() {
        imvuCall('cancelDialog');
    }

    new ImvuButton($(".cta-button", $root), {});

    $(".cta-button", $root).click(onClickCta);
    $(".close-button", $root).click(onClickClose);
    onEscKeypress(function() {
        imvuCall('cancelDialog');
    }.bind(this));
}

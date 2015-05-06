function createShopTogetherUpsell(args) { 
    var imvu = args.imvu;
    var $root = args.$root;
    onEscKeypress(cancelDialog);
    $root.find('.close').click(cancelDialog);
    $root.find('.cta').toggleClass('has-vip', imvu.call('hasVIPPass'));
    $root.find('button.not-now').click(cancelDialog);
    $root.find('button.go').click(cancelDialog);
    $root.find('button.get-vip').click(getVIP);

    $root.find('a.vip-info').click(vipInfo)


    function cancelDialog() { 
        imvu.call('cancelDialog');
    }

    function getVIP() { 
        imvu.call('showVipLandingWeb');
        imvu.call('cancelDialog');
    }
    function vipInfo() { 
        imvu.call('showVipLandingWeb');
    }
}

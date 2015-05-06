function createShopTogetherIntroduce(args) { 
    var imvu = args.imvu;
    var $root = args.$root;
    var timer = args.timer;
    onEscKeypress(cancelDialog);
    $root.find('.close').click(cancelDialog);
    $root.find('.cta').toggleClass('has-vip', imvu.call('hasVIPPass'));
    $root.find('button.not-now').click(cancelDialog);
    $root.find('button.go').click(cancelDialog);
    $root.find('button.get-vip').click(getVIP);

    $root.find('a.vip-info').click(vipInfo)

    setUpAnimation();


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
    function setUpAnimation() { 
        var $slide1 = $root.find('#slide-1');
        var $slide2 = $root.find('#slide-2');
        $slide2.hide();
        function fadeToggle($el) { 
            if($el.is(':visible')) { 
                $el.fadeOut('slow');
            } else {
                $el.fadeIn('slow');
            }
        }
        timer.setInterval(function() { 
            fadeToggle($slide1);
            fadeToggle($slide2);
        }, 3000);

    }
}
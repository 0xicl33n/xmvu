function buildUpsell($root, imvu) {
    var info = imvu.call('getDialogInfo');
    
    if (info.stage === 'lapsedVIP') {
        info.title = 'Reclaim Your Custom Lists!';
        info.text = 'We miss you in the VIP Club. Remember, as a VIP you can enjoy perks like organizing your inventory with custom lists. Re-join VIP today as your lists await you!';
    } else {
        info.title = 'VIP Custom Lists!';
        info.text = 'VIPs can organize their inventory with custom lists! Quickly locate your favorites by keeping them sorted into themed lists.  Get VIP and begin organizing your closet today!';
    }
    
    if (!info.buttons) {
        info.confirm_text = '';
        info.buttons = [
            {name: 'Cancel', grey:true, value: false},
            {name: 'Get VIP', yellow:true},
        ];
    }
    new Alert({root: '#dialog', imvu: imvu, info: info});

    $("#getvip").click(function() {
        if (info.stage ==='lapsedVIP') {
            imvu.call('launchUrl', 'http://www.imvu.com/store/index/');
        } else {
            imvu.call('launchUrl', 'http://www.imvu.com/vip_club/?source=' + encodeURIComponent('InvMgmt.Create_Button') + '&type=join');
        }
    }.bind(this));
}

IMVU.FriendsDataSource = function(data, imvu) {
    var getFriends;
    
    if(data || IMVU.IS_FIREFOX) {
        var d = data || [
            {
                avpic_url:'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/349244_76727636147e027add9408.jpg',
                avatarname:'Dusty1 with an inordinately long name',
                //date: '2009-06-12 01:18:45',
                online:1
            },
            {
                avpic_url:'http://userimages.imvu.com/catalog/includes/modules/phpbb2/images/avatars/349244_76727636147e027add9408.jpg',
                avatarname:'Dusty2 with an inordinately long name',
                //date: '2009-06-12 01:18:45',
                online:1
            }
        ];
        getFriends = function() {
            return d;
        };
    } else {
        getFriends = function() {
            return imvu.call('getBuddyRequests');
        };
    }

    var ds = new IMVU.DataSource(getFriends, undefined, undefined, imvu);
    ds.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;

    return ds;
};


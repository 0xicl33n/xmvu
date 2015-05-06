(function() {

// requires imvu.js
if (typeof IMVU != 'undefined') {

    IMVU.Client.user = {};
    IMVU.Client.user.infoJSON = function(imvuCall) {
        if (typeof this.user_json != 'undefined') {
            return this.user_json;
        }
        this.user_json = {};
        this.user_json['customer_id'] = imvuCall('getCustomerId');
        this.user_json['avatar_name'] = imvuCall('getAvatarName');
        this.user_json['avatar_pic_url'] = imvuCall('getAvatarPicUrl');
        this.user_json['is_vip'] = imvuCall('hasVIPPass');
        this.user_json['has_ap'] = imvuCall('hasAccessPass');
        this.user_json['is_staff'] = imvuCall('isAdmin');
        return this.user_json;
    };
}

})();

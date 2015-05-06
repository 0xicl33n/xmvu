IMVU.Outfits = {
    PUBLIC: 0,
    FRIENDS_ONLY: 1,
    PRIVATE: 2,

    getPrivacyHtmlLabel: function (index) {
        return {0: '<span class="public">'+_T("Public")+'</span>',
                1: '<span class="friends_only">'+_T("Friends only")+'</span>',
                2: '<span class="private">'+_T("Private")+'</span>'}[parseInt(index, 10)];
    },

    getPrivacyDropdownItems: function () {
        var result = {};
        for (var privacy = 0; privacy < 3; privacy++) {
            result[privacy] = [IMVU.Outfits.getPrivacyHtmlLabel(privacy), privacy];
        }
        return result;
    },

    getCategoryDisplayName: function (name) {
        return (name == 'my outfits') ? _T("Default") : name;
    }
};

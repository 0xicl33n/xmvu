function createSearchWidget(args) { 
    var $searchInput = args.$searchInput,
        default_text = args.default_text,
        $searchButton = args.$searchButton,
        enterSearch = args.enterSearch;
    createPlaceholder($searchInput, default_text);
    function startSearch() { 
        $searchInput.blur();
        enterSearch.call(null, $searchInput.val());
    }
    $searchInput.keydown(function(e) { 
        if (e.which === 13) { 
            startSearch();
            return false;
        }
        return true;
    });
    $searchButton.click(function() {
        startSearch();
    }.bind(this));
}
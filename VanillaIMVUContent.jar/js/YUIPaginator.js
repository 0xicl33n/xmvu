
/// To be deprecated
IMVU.YUIPaginator = function(ids, dataSource, replacementParams) {
    var params = {
        pageLinks: 5,
        rowsPerPage: 15,
        recordOffset: 0,
        containers: ids,
        template: "<strong>{CurrentPageReport}</strong> {PreviousPageLink} {PageLinks} {NextPageLink}",
        pageReportTemplate: _T("Showing page")+' {currentPage} '+_T("of")+' {totalPages}',
        previousPageLinkLabel: "<img src='../img/arrow_left.png'>",
        nextPageLinkLabel: "<img src='../img/arrow_right.png'>",
        alwaysVisible: false
    };
    
    for (var param in replacementParams) {
        params[param] = replacementParams[param];
    }
    
    var lastOffset = -1;

    this.prototype = new YAHOO.widget.Paginator(params);

    var self = this.prototype;

    this.prototype.subscribe('changeRequest', function (newState) {
        dataSource.setQueryParameter('offset', newState.recordOffset);
        dataSource.setQueryParameter('last_offset', self.lastOffset);
        self.setState(newState);
        dataSource.refresh();
    });

    dataSource.subscribe('requestResult', function (result) {
        if ('error' in result) {
            // The paginator itself does not produce feedback for network errors.
            // ThumbnailView does that. -- andy 10 June 2009
            return;
        }

        this.prototype.setState(this.prototype.getState({
            recordOffset: result.response.meta.rowOffset,
            rowsPerPage: result.response.meta.rowsPerPage,
            totalRecords: result.response.meta.totalRows
        }));
        this.prototype.render();
        this.prototype.lastOffset = result.response.meta.rowOffset;
    }.bind(this));

    return this.prototype;
};

var Paginator = function(div, currentPage, totalPages) {
    this.baseDiv = div;
    
    this.evtClick = new YAHOO.util.CustomEvent(
        'pageClicked',
        window,
        true,
        YAHOO.util.CustomEvent.FLAT
    );
    
    this._setupLayout();
    this.update(currentPage, totalPages);
};

Paginator.prototype = {

    _numberOfVisiblePages : 5,

    _setupLayout : function() {
        
        var node = document.createElement('span');
        node.id = 'pagin_blurb';
        this.baseDiv.appendChild(node);
        
        node = document.createElement('a');
        node.id = 'pagin_prev';
        node.href = '#';
        node.innerHTML = '<img src="../img/arrow_left.png">';
        $(node).addClass('paginator_prevbox');
        this.baseDiv.appendChild(node);
        YAHOO.util.Event.on(node, 'click', this.pageClicked, node, this);
        
        node = document.createElement('span');
        node.id = 'pagin_pages';
        $(node).addClass('paginator_pages');
        this._pages = node;
        this.baseDiv.appendChild(this._pages);
        
        for( var i=0; i<this._numberOfVisiblePages; i++ ) {
            node = document.createElement('a');
            node.href = '#';
            node.id = 'pagin_cell_' + i;
            $(node).addClass('pagin_numberbox');
            this._pages.appendChild(node);
            YAHOO.util.Event.on(node, 'click', this.pageClicked, node, this);
        }
        
        node = document.createElement('a');
        node.id = 'pagin_next';
        node.innerHTML = '<img src="../img/arrow_right.png">';
        node.href = '#';
        $(node).addClass('paginator_nextbox');
        this.baseDiv.appendChild(node);
        YAHOO.util.Event.on(node, 'click', this.pageClicked, node, this);
        
        $(this.baseDiv).addClass('paginator_container');
    },

    update : function(currentPage, totalPages) {
    
        var startPage = currentPage - parseInt(this._numberOfVisiblePages/2, 10);
        if(startPage < 1) {
            startPage = 1;
        }
        
        var endPage = startPage + this._numberOfVisiblePages;
        if(endPage > totalPages+1) {
            endPage = totalPages+1;
        }
            
        var j = 0;
        for(var i=startPage; i<endPage; i++) {
            
            var node = YAHOO.util.Dom.get('pagin_cell_'+j);

            node.innerHTML = i;
            
            YAHOO.util.Dom.setAttribute(node, 'page', i);
            
            $(node).toggleClass('pagin_current', i == currentPage);
            
            YAHOO.util.Dom.setStyle(node, 'display', 'inline');
            j++;
        }
        
        for(;j<this._numberOfVisiblePages; j++) {
            var id = 'pagin_cell_'+j;
            YAHOO.util.Dom.setAttribute(YAHOO.util.Dom.get(id), 'page', '');
            YAHOO.util.Dom.setStyle(id, 'display', 'none');
        }
        
        if(currentPage == 1) {
            YAHOO.util.Dom.setStyle('pagin_prev', 'display', 'none');
            YAHOO.util.Dom.setAttribute(YAHOO.util.Dom.get('pagin_prev'), 'page', '');
        } else {
            YAHOO.util.Dom.setStyle('pagin_prev', 'display', 'inline');
            YAHOO.util.Dom.setAttribute(YAHOO.util.Dom.get('pagin_prev'), 'page', (parseInt(currentPage,10)-1));
        }
        
        if(currentPage == totalPages) {
            YAHOO.util.Dom.setStyle('pagin_next', 'display', 'none');
            YAHOO.util.Dom.setAttribute(YAHOO.util.Dom.get('pagin_next'), 'page', '');
        } else {
            YAHOO.util.Dom.setStyle('pagin_next', 'display', 'inline');
            YAHOO.util.Dom.setAttribute(YAHOO.util.Dom.get('pagin_next'), 'page', (parseInt(currentPage,10)+1));
        }
        
        YAHOO.util.Dom.get('pagin_blurb').innerHTML = _T("Showing Page")+' '+currentPage+' '+_T("of")+' '+totalPages;
    },
    
    pageClicked: function(nodeClicked) {
   
        var node = YAHOO.util.Dom.get(nodeClicked.target.id);
        
        var pageNum = YAHOO.util.Dom.getAttribute(node, 'page');
           
        if(pageNum) {
            this.evtClick.fire({'page': pageNum});
        }
    }
};

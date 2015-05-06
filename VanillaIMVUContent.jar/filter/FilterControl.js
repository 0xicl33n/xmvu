function getAllFilters(rootElement) {
    var result = {};
    $('div.filters-all ul li', rootElement).each(function (index, el) {
        var key = el.getAttribute("imvu:key");
        if (key) {
            result[key] = el;
        }
    });
    return result;
}

function prepareFilterUIForCustomer(rootElement, imvuCall) {
    var allFilters = getAllFilters(rootElement);

    var isTeen = imvuCall("isTeen");
    var hasAP = imvuCall("hasAccessPass");
    var hasVIP = imvuCall("hasVIPPass");
    var isAdPresent = imvuCall("showClientAds");
    var doRemove = function (el) {
        var parent = YAHOO.util.Dom.getAncestorByTagName(el, "ul");
        parent.removeChild(el);
    };

    if(isAdPresent) {
        $(rootElement).addClass("adPresent");
    }

    // TODO? generalize into requiresVIP
    if (!hasVIP) {
        $(allFilters.vip).addClass("filter-link");
    }

    for each (var elt in allFilters) {
        var requiresAP = elt.getAttribute('imvu:requiresAP');
        switch (requiresAP) {
            case undefined:
            case null:
                break;
            case "true":
                if (!hasAP) {
                    doRemove(elt);
                }
                break;
            case "upsell":
                if (isTeen) {
                    doRemove(elt);
                } else if (!hasAP) {
                    $(elt).addClass("filter-link");
                }
                break;
            default:
                throw "Unknown requiresAP value: " + requiresAP;
        }
    }
    if (isTeen) {
        $('div.filters-all li', rootElement).each(function (index, el) {
            if (el.hasAttribute("imvu:notForTeens")) {
                doRemove(el);
            }
        });
    }
}

function FilterControl(rootElement, dataSource, net, imvu) {
    this.dataSource = dataSource || null;
    this.net = net;
    this.imvu = imvu;
    this.rootElement = rootElement;
    this.activeFilterDisplay = this.rootElement.querySelector('.filters-active ul');
    this.filterList = this.rootElement.querySelector('.filters-all ul');
    this.state = {};
    this.filterInfo = {};
    this.onStateChange = new YAHOO.util.CustomEvent('onStateChange');
    this.onStateChange.subscribe(this.refreshActiveFilters, this, true);
    this.onFilterExpandChange = new YAHOO.util.CustomEvent('onFilterExpandChange');
    
    if (this.dataSource !== null) {
        this.onStateChange.subscribe(this.refreshDataSource, this, true);
    }

    var filters = this.filterList.querySelectorAll('li');

    var makeFilterHandler = function (k) {
        return function (evt) {
            var el = YAHOO.util.Event.getTarget(evt);
            this.onFilterClick(el, k);
            YAHOO.util.Event.stopEvent(evt);
        };
    };

    var makeValueHandler = function (k, v) {
        return function (evt) {
            this.onValueClick(k, v);
            YAHOO.util.Event.stopEvent(evt);
        };
    };

    for (var i = 0; i < filters.length; i++) {
        var e = filters[i];
        var key = e.getAttribute("imvu:key");

        this.filterInfo[key] = {
            element: e,
            key: key,
            description: e.textContent.split('\n')[0],
            values: [],
            defaultValue: e.getAttribute("imvu:defaultValue")
        };
        
        if ($(e).hasClass("filter-link")) {
            YAHOO.util.Event.addListener(e, 'click', this.onLinkClick, this, true);
            continue;
        }

        var select = e.querySelector('select');
        if (select) {
            YAHOO.util.Event.addListener(e, 'click', makeFilterHandler(key), this, true);
            this.__loadCountries(key, select);
            continue;
        }

        var values = e.querySelectorAll('ul li');
        if (values.length > 1) {
            YAHOO.util.Event.addListener(e, 'click', makeFilterHandler(key), this, true);
        }

        var self = this;
        $(values).each(function (index, v) {
            var value = v.getAttribute("imvu:value");

            self.filterInfo[key].values[value] = {
                value: value,
                text: v.textContent,
                headerText: v.getAttribute("imvu:headerText")
            };

            if (values.length == 1) {
                $(e).addClass("filter-single-option");
                YAHOO.util.Event.addListener(e, 'click', makeValueHandler(key, value), self, true);
            } else {
                YAHOO.util.Event.addListener(v, 'click', makeValueHandler(key, value), self, true);
            }
        });
        
    }
    
    this.reset();
}

FilterControl.prototype = {
    reset : function () {
        for (var k in this.filterInfo) {
            this.state[k] = this.filterInfo[k].defaultValue;
        }
        this.onStateChange.fire(this.state);
    },

    __loadCountries: function(key, el) {
        var self = this;

        var cb = function(countries, error) {
            if (!error) {
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
                if (countries !== null){
                    for each (var c in countries) {
                        var option = document.createElement('option');
                        option.innerHTML = c.text;
                        option.value = c.id;
                        self.filterInfo[key].values[c.id] = {
                            value: c.id,
                            text: c.text,
                            headerText: c.text
                        };
                        el.appendChild(option);
                    }
                    
                    YAHOO.util.Event.addListener(el, 'change', self.onOptionSelected.bind(self, key));
                }
            }
        };

        var url = el.getAttribute('imvu:source');
        serviceRequest({
            method: 'GET',
            uri: el.getAttribute('imvu:source'),
            callback: cb,
            json: true,
            network: self.net,
            imvu: self.imvu
        });
    },

    refreshActiveFilters : function () {
        this.activeFilterDisplay.innerHTML = "";

        var makeRemoveHandler = function (k) {
            return function (evt) {
                this.onRemoveFilter(k);
                YAHOO.util.Event.stopEvent(evt);
            };
        };

        var k;
        for (k in this.filterInfo) {
            var f = this.filterInfo[k];
            var hidden = !!this.state[k];

            $(f.element).toggleClass('filter-hidden', !!hidden);
        }

        for (k in this.state) {
            var v = this.state[k];
            if (!v || !(k in this.filterInfo)) {
                continue;
            }

            var item = document.createElement("li");
            $(item).addClass("filter-active");
            item.textContent = this.filterInfo[k].values[v].headerText;

            var removeLink = document.createElement("a");
            $(removeLink).addClass("filter-remove-link");
            removeLink.textContent = _T("Remove");
            YAHOO.util.Event.addListener(removeLink, 'click', makeRemoveHandler(k), this, true);
            item.appendChild(removeLink);

            this.activeFilterDisplay.appendChild(item);
        }
    },
    
    refreshDataSource : function () {
        for (var k in this.state) {
            this.dataSource.setQueryParameter(k, this.state[k]);
        }
    },

    setState : function (newState) {
        for (var k in this.state) {
            if (newState.hasOwnProperty(k)) {
                this.state[k] = newState[k];
            } else {
                this.state[k] = null;
            }
        }
        this.onStateChange.fire(this.state);
    },

    onRemoveFilter : function (key) {
        this.state[key] = null;
        this.onStateChange.fire(this.state);
    },

    onOptionSelected: function(key, evt) {
        var value = evt.target.options[evt.target.selectedIndex].value;
        this.onValueClick(key, value);
    },

    onLinkClick : function (evt) {
        var el = YAHOO.util.Event.getTarget(evt);
        var url = el.getAttribute("imvu:linkNamedUrl");
        this.imvu.call("launchNamedUrl", url);
        YAHOO.util.Event.stopEvent(evt);        
    },

    onValueClick : function (key, value) {
        this.state[key] = value;
        this.onStateChange.fire(this.state);
    },

    onFilterClick : function (e, key) {
        $(e).toggleClass('filter-expanded');
        this.onFilterExpandChange.fire({});
    }
};

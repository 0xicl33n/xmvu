function DeriveDialog(args) {
    this.imvu = args.imvu;
    this.network = args.network;
    this.timer = args.timer;

    this.$header = $('h2');
    this.$close = $('.close');
    this.$close.click(this.close.bind(this));
    this.$categories = $('#categories');
    this.$categories.find('.preset').click(function (evt) {
        var $preset = $(evt.target);
        if (!$preset.is('.preset')) {
            $preset = $preset.closest('.preset');
        }

        var href = $preset.find('a').attr('href');
        this.lookup.$pid.val(href.replace('#', ''));
        this.lookup.handleProductIdChange();

        return false;
    }.bind(this));


    this.$female = this.$categories.find('dt.female');
    this.$femaleBody = this.$categories.find('dd.female');
    this.$femaleTop = $('#female-top');
    this.$femaleBottom = $('#female-bottom');
    this.$femaleShoes = $('#female-shoes');
    this.$femaleHair = $('#female-hair');
    this.$femaleHead = $('#female-head');
    this.$femaleSkin = $('#female-skin');
    this.$femaleEyes = $('#female-eyes');
    this.$femaleAccessory = $('#female-accessory');

    this.$male = this.$categories.find('dt.male');
    this.$maleBody = this.$categories.find('dd.male');

    this.$rooms = this.$categories.find('dt.rooms');
    this.$roomsBody = this.$categories.find('dd.rooms');

    this.$empty = this.$categories.find('dt.empty');
    this.$emptyBody = this.$categories.find('dd.empty');

    $('dt').click(this.clickTab.bind(this));

    this.buildVectorArt();

    this.$root = $('#dialog');
    this.imvu.call('resize', this.$root.outerWidth(true), this.$root.outerHeight(true));

    this.lookup = new ProductLookup({
        root: '#product-info',
        imvu: this.imvu,
        network: this.network,
        timer: this.timer,
        action: 'derive',
    });
    onEscKeypress(function () {
        this.imvu.call('cancelDialog');
    }.bind(this));
}

DeriveDialog.prototype.close = function () {
    this.imvu.call('cancelDialog');
}

DeriveDialog.prototype.clickTab = function (evt) {
    var $tab = $(evt.target);
    if ($tab.is('.active')) {
        return;
    }

    var type = $tab.attr('class');
    this.$categories.find('.active').removeClass('active');
    this.$categories.find('.' + type).addClass('active');
}

DeriveDialog.prototype.buildVectorIcon = function (args) {
    var w = args.width || 40,
        h = args.height || 40;
        shadow = (typeof args.shadow == 'undefined') ? true : false;

    var paper = Raphael($(args.element)[0], w, h);
    var c = paper.path(args.path);
    c.attr({fill: args.fill || '#fff', stroke: args.stroke || 'transparent'});

    if (shadow) {
        var blurBy = 3;
        var shadowPaper = Raphael($(args.element)[0], w + blurBy*2, h + blurBy*2, {width: w, height: h});
        var sc = shadowPaper.path(args.path);
        sc.attr({fill: '#111', stroke: 'transparent'});
        sc.scale(1.2, 1.35);
    }

    return c;
}

DeriveDialog.prototype.buildVectorArtMaleFemale = function (type) {
    function get(which) {
        return '#' + type + '-' + which;
    }

    this.buildVectorIcon({element: get('top'), path: "M19.926,7.507c-0.303-0.354-1.007-0.862-1.565-1.129l-3.315-1.587c-0.559-0.267-1.301-0.049-1.65,0.484 c0,0-0.651,0.809-1.897,0.809c-1.232,0-1.878-0.781-1.878-0.781c-0.354-0.53-1.1-0.745-1.658-0.478L4.718,6.378 C4.159,6.646,3.455,7.153,3.152,7.507C2.85,7.861,3.154,9.207,3.35,9.583c0.196,0.375,0.658,0.92,1.028,1.209 c0.369,0.29,1.766,0.033,2.071-0.113c0.305-0.146,0.554,0.266,0.554,0.915v3.715c0,0.648,0.16,1.521,0.354,1.938 s1.731,0.759,2.344,0.759h0.786h2.042h0.786c0.612,0,1.471-0.153,1.906-0.34s0.792-1.709,0.792-2.357v-3.715 c0-0.649,0.25-1.061,0.555-0.915s1.069,0.281,1.547,0.301c0.477,0.019,1.418-1.021,1.614-1.397S20.229,7.861,19.926,7.507"});
    this.buildVectorIcon({element: get('bottom'), path: "M16.098,5.006c0.899,0,1.735,0.789,1.858,1.753l1.206,9.448c0.123,0.965-0.511,1.754-1.41,1.755l-2.783,0.002 c-0.899,0.001-1.672-0.794-1.718-1.767l-1.32-4.591c-0.242-0.938-0.637-0.938-0.88,0l-1.32,4.591 c-0.045,0.973-0.819,1.768-1.718,1.767L5.23,17.962c-0.899-0.001-1.534-0.79-1.41-1.755l1.205-9.448 c0.124-0.964,0.96-1.753,1.859-1.753H16.098z"});
    this.buildVectorIcon({element: get('shoes'), path: "M4.24,8.995C5.419,8.6,5.86,9.716,7.597,9.413C8.811,9.2,9.611,8.069,9.611,8.069s4.885,2.825,7.1,3.063 c2.216,0.238,3.312,0.166,3.312,1.119c0,0.954-1.108,2.274-2.688,2.573c-1.456,0.277-4.703,0.198-5.812-0.04 c-1.107-0.238-1.746-0.563-2.854-0.087c-1.108,0.478-3.791,0.369-5.075-0.107C2.113,14.039,3.644,9.17,4.24,8.995"});
    this.buildVectorIcon({element: get('hair'), path: "M10.471,4.728c-7.107,8.058,6,10.09,7.232,15.323C24.197,8.012,15.457-0.926,10.471,4.728z M11.828,3.269 C7.408,4.521-0.381,6.154,4.678,18.229C5.077,13.817,7.154,6.169,11.828,3.269z M5.233,5.299c2.341-1.482,6.354-1.976,6.354-1.976 C8.912,3.158,6.738,2.334,5.233,5.299z"});
    this.buildVectorIcon({element: get('head'), path: "M17.867,8c-0.704-2.869-3.286-5-6.372-5S5.828,5.131,5.124,8H3.377v5H5.1 c0.669,4.159,3.276,7.077,6.396,7.077c3.12,0,5.727-2.918,6.396-7.077h1.485V8H17.867z M10.377,12l-3-0.5V9l3,0.5V12z M15.377,11.5l-3,0.5V9.5l3-0.5V11.5z"});
    this.buildVectorIcon({element: get('skin'), path: "M13.59,6.049c-0.686-0.077-1.385,1.685-2.095,1.685 c-0.709,0-1.409-1.762-2.094-1.685C6.347,6.39,4.82,7.528,2.989,9.1h17.013C18.17,7.528,16.645,6.39,13.59,6.049z M3.321,9.67 c0.78,0.106,3.423,0.415,7.941,0.415c4.371,0,7.375-0.289,8.402-0.404c0.112-0.193,0.225-0.386,0.338-0.578H2.989 C3.101,9.291,3.211,9.48,3.321,9.67z M3.468,9.928c1.633,2.854,3.148,5.803,5.933,6.413c0.909,0.022,2.976,0.022,4.189,0 c2.775-0.608,4.288-3.538,5.915-6.382c-1.268,0.706-4.594,2.33-8.395,2.33C7.253,12.288,4.458,10.616,3.468,9.928z"});
    this.buildVectorIcon({element: get('eyes'), path: "M20.421,7.443c-1.198-0.797-3.489-2.042-8.079-1.77C8.158,5.922,3.425,10.055,2.21,10.842 c-0.548,0.354-0.029,1.486,0.899,0.824c2.17-1.548,3.717-2.372,5.211-2.813c-1.066,0.976-1.747,2.365-1.747,3.924 c0,2.946,2.388,5.335,5.334,5.335s5.334-2.389,5.334-5.335c0-1.629-0.745-3.069-1.896-4.047c1.068,0.373,2.053,1.115,4.152,2.562 c0.281,0.194,0.6,0.416,0.861,0.449c0.371,0.046,0.64-0.186,0.64-0.539c0,0.014,0-1.579,0-2.725 C20.999,7.812,20.898,7.76,20.421,7.443z M13.75,12.711c-0.791,0-1.434-0.643-1.434-1.435c0-0.792,0.643-1.434,1.434-1.434 c0.793,0,1.435,0.642,1.435,1.434C15.185,12.068,14.543,12.711,13.75,12.711z"});
    this.buildVectorIcon({element: get('accessory'), path: "M3.399,9.365c-0.48-0.54-0.453-1.391,0.062-1.892l2.639-2.564c0.515-0.5,1.498-0.91,2.185-0.91h6.527 c0.688,0,1.67,0.41,2.185,0.91l2.64,2.564c0.515,0.501,0.543,1.353,0.062,1.895l-7.253,8.301c-0.48,0.541-1.268,0.542-1.749,0.003 L3.399,9.365z M15.626,5.29l-1.561-0.011c0,0,1.058,2.974,1.058,2.975h3.547L15.626,5.29z M11.58,16.736L8.029,9.01H4.94 L11.58,16.736z"});
}

DeriveDialog.prototype.buildVectorArtEmptyDerivableRing = function (args) {
    var paper = Raphael($(args.element)[0], 20, 20);
    var c = paper.circle(9, 8.5, 6.7);
    c.attr({stroke: '#fff', 'stroke-width': 2.5});

    var paper = Raphael($(args.element)[0], 20, 20);
    var c = paper.circle(9, 8.5, 6.5);
    c.attr({stroke: '#000', 'stroke-width': 6});
}

DeriveDialog.prototype.buildVectorArt = function () {
    var deriveIcon = this.buildVectorIcon({element: this.$header, width: 25, height: 25, shadow: false, fill: '#fdd400', stroke: 'transparent', path: "M11.354,6.832L9.962,8.224c0.304,0.101,0.588,0.259,0.821,0.492c0.858,0.86,0.858,2.259,0,3.119l-2.621,2.623 c-0.418,0.417-0.973,0.646-1.561,0.646c-0.59,0-1.144-0.229-1.56-0.646c-0.86-0.859-0.86-2.259,0-3.119L5.98,10.4 C5.662,9.442,5.639,8.627,5.702,8.052l-1.973,1.975c-1.583,1.583-1.583,4.16,0,5.744c0.768,0.768,1.787,1.189,2.872,1.189 c1.084,0,2.104-0.422,2.872-1.189l2.623-2.623c1.582-1.584,1.582-4.16,0-5.744C11.871,7.179,11.618,6.995,11.354,6.832z M16.271,3.229c-0.767-0.767-1.787-1.189-2.873-1.189c-1.085,0-2.104,0.423-2.872,1.189L7.903,5.852 c-1.583,1.584-1.583,4.16,0,5.745c0.199,0.199,0.422,0.364,0.653,0.513l1.373-1.373c-0.261-0.106-0.508-0.246-0.714-0.452 c-0.859-0.86-0.859-2.26,0-3.119l2.622-2.623c0.835-0.834,2.286-0.833,3.12,0c0.858,0.859,0.858,2.259,0,3.118L14.101,8.52 c0.226,0.268,0.667,0.97,0.43,2.194l1.74-1.74C17.854,7.389,17.854,4.813,16.271,3.229z"});
    deriveIcon.scale(1.25, 1.25);

    this.buildVectorArtMaleFemale('female');
    this.buildVectorArtMaleFemale('male');

    this.buildVectorIcon({element: '#rooms-room', path: "M2.422,11.017c0.095,0,1.2,0,2.565,0c0,0.34,0,0.34,0,6.376 c0,0.601,0,1.608,0,1.608c1.956,0,6.004,0,6.004,0v-6.003h4.006v6.003c0,0,2.518,0,2.998,0c0,0,0-1.112,0-1.671c0,0,0-5.998,0-6.313 c1.329,0,2.57,0,2.635,0c0.39,0,0.485-0.633,0.257-1.032c-0.183-0.319-8.389-6.227-8.994-6.667c-0.334-0.243-0.58-0.243-0.909,0 c-0.389,0.287-8.303,6.319-8.726,6.64C1.809,10.297,1.992,11.017,2.422,11.017z"});
    this.buildVectorIcon({element: '#rooms-furni', path: "M18.964,2.998c0,0-2.955,6.293-2.955,9.542s2.955,7.463,2.955,7.463h-3.593 c0,0-1.313-2.296-2.3-6.009c-0.667,0-3.069,0-3.069,0v6.012l-3.006,0.009v-6.009l-1.992,0.009v-3.002c0,0,7.321-0.008,8.046-0.008 c0.319-2.668,2.32-8.007,2.32-8.007H18.964z"});
    this.buildVectorIcon({element: '#rooms-wall', path: "M18.964,2.998c0,0-2.955,6.293-2.955,9.542s2.955,7.463,2.955,7.463h-3.593 c0,0-1.313-2.296-2.3-6.009c-0.667,0-3.069,0-3.069,0v6.012l-3.006,0.009v-6.009l-1.992,0.009v-3.002c0,0,7.321-0.008,8.046-0.008 c0.319-2.668,2.32-8.007,2.32-8.007H18.964z"});

    this.buildVectorArtEmptyDerivableRing({element: '#empty-female'});
    this.buildVectorArtEmptyDerivableRing({element: '#empty-male'});
}
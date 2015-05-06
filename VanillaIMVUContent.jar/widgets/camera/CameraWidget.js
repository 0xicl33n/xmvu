function CameraWidget(args) {
    this.imvu = args.imvu;
    this.eventBus = args.eventBus;
    this.$cameraWidget = $('#cameraWidget');
    this.$birdsEye = $('#birdsEye');
    this.$panHandleHolder = $('#panHandleHolder');
    this.$zoomHandle = $('#zoomHandle');

    $('#closeIcon').click(this.toggleClose.bind(this));
    this.$birdsEye.click(this.toggleBirdsEye.bind(this));

    this.ZH_RANGE = [90, 117];

    var closed = this.imvu.call("getCameraWidgetClosed");
    if (closed) {
        this.toggleClose();
    }
    var self = this;
    this.setupTypomatic($('#pan_u'), function () { self.imvu.call('incrementUp',  0.1); });
    this.setupTypomatic($('#pan_d'), function () { self.imvu.call('incrementUp', -0.1); });
    this.setupTypomatic($('#pan_l'), function () { self.imvu.call('incrementRight', -0.1); });
    this.setupTypomatic($('#pan_r'), function () { self.imvu.call('incrementRight',  0.1); });
    this.setupTypomatic($('#zoomin'),  function () {
        self.imvu.call('incrementZoom', -0.025);
        self.eventBus.fire("CameraWidgetZoomed", {});
    });
    this.setupTypomatic($('#zoomout'), function () {
        self.imvu.call('incrementZoom',  0.025);
        self.eventBus.fire("CameraWidgetZoomed", {});
    });

    self.zhDragging = false;
    function zhDragStart() { self.zhDragging = true; }
    function zhDragStop() { self.zhDragging = false; }

    self.phDragging = false;
    function phDragStart() { self.phDragging = true; }
    function phDragStop() { self.phDragging = false; }

    this.$zoomHandle.mousedown(zhDragStart);
    $(document).mouseup(zhDragStop);
    $('#panHandle').mousedown(phDragStart);
    $(document).mouseup(phDragStop);

    function docMouseMove(e) {
        if (self.zhDragging) {
            var lY = e.clientY - self.$cameraWidget.offset().top;
            var zhY = lY - 8.5;
            if (zhY < self.ZH_RANGE[0]) { zhY = self.ZH_RANGE[0]; }
            if (zhY > self.ZH_RANGE[1]) { zhY = self.ZH_RANGE[1]; }
            self.$zoomHandle.css('top', zhY + 'px');
            var wantZoom = (zhY - self.ZH_RANGE[0]) / (self.ZH_RANGE[1] - self.ZH_RANGE[0]);
            self.imvu.call('setZoomFactor', wantZoom);
            self.eventBus.fire("CameraWidgetZoomed", {});
        }
        if (self.phDragging) {
            var offset = self.$cameraWidget.offset();
            var cx = offset.left + 38.5;
            var cy = offset.top + 38.5;
            var mx = e.clientX;
            var my = e.clientY;
            var dx = mx - cx;
            var dy = my - cy;
            var rad = Math.atan(dy / dx);
            if (dx < 0) {
                rad -= Math.PI;
            }
            var deg = rad * 180.0 / Math.PI;
            var heading = deg - 90;
            self.imvu.call('setCameraHeading', heading);
            self.$panHandleHolder.css('-moz-transform', 'rotate(' + deg + 'deg)');
            self.eventBus.fire("CameraWidgetRotated", {});
        }
    }
    $(document).mousemove(docMouseMove);

    this.eventBus.register('CameraChanged', this.onCameraChanged.bind(this));
    this.eventBus.register("ToggleBirdsEyeView", this.toggleBirdsEye.bind(this));
}

CameraWidget.prototype = {};

CameraWidget.prototype.toggleClose = function () {
    var isCollapsed = this.$cameraWidget.hasClass('collapsed');
    var shouldBeCollapsed = !isCollapsed;
    this.$cameraWidget.toggleClass('collapsed', shouldBeCollapsed);
    this.imvu.call('setCameraWidgetClosed', shouldBeCollapsed);
};

CameraWidget.prototype.toggleBirdsEye = function () {
    var isOn = this.$birdsEye.hasClass('on');
    var shouldBeOn = !isOn;
    this.$birdsEye.toggleClass('on', shouldBeOn);
    this.imvu.call('setBirdsEyeView', shouldBeOn);
};

CameraWidget.prototype.onCameraChanged = function (n, info) {
    if (!this.phDragging) {
        var deg = info.heading + 90.0;
        this.$panHandleHolder.css('-moz-transform', 'rotate(' + deg + 'deg)');
    }
    if (!this.zhDragging) {
        var zoomFac = info.zoom;
        var t = this.ZH_RANGE[0] + zoomFac * (this.ZH_RANGE[1] - this.ZH_RANGE[0]);
        this.$zoomHandle.css('top', t + 'px');
    }
};

CameraWidget.prototype.setupTypomatic = function ($elt, func) {
    var intervalId = 0;

    var stopTypomatic = function () {
        clearInterval(intervalId);
    };

    var startTypomatic = function () {
        stopTypomatic();
        func();
        intervalId = setInterval(func, 50);
    };

    $elt.mousedown(startTypomatic);
    $elt.mouseup(stopTypomatic);
    $elt.mouseout(stopTypomatic);
};

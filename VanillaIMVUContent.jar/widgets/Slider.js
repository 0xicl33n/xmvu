function createSlider(description, name, value, valid_values, extent_names, background_info, print_value_type) {
    var div = document.createElement('div');
    $(div).addClass('slider');
    $(div).addClass('initial');
    $(div).addClass(name);
    var innerHtmlStr = '<span class="slider-desc">'+description+'</span>';
    innerHtmlStr += '<div class="name" style="display:none">'+name+'</div>';
    innerHtmlStr += '<div id="slider-bg-'+name+'" class="yui-h-slider">';
    innerHtmlStr += '<span class="slider-min">'+extent_names[0]+'</span>';
    innerHtmlStr += '<span class="slider-max">'+extent_names[1]+'</span>';
    innerHtmlStr += '<div id="slider-thumb-'+name+
                    '" class="yui-slider-thumb"><img src="../settings/img/slider_handle.png" /></div>';
    innerHtmlStr += '</div>';      
    if (print_value_type == 'percent') {
        innerHtmlStr += '<div id="slider-value-percent-'+name+'"class="slider-value-percent">0%</div>';
    } else {
        innerHtmlStr += '<div id="reset-'+name+'" class="slider-reset"></div>';
    }   
     
    div.innerHTML = innerHtmlStr;
    if (background_info !== undefined) {
        var image_url = background_info.url;
        var slider_bg_elem = div.querySelector('div#slider-bg-' + name);
        var newBackgroundStyle = "url(" + image_url + ") no-repeat";
        $(slider_bg_elem).css('background', newBackgroundStyle);
    }

    var sliderPixelLength = 200;
    var slider = YAHOO.widget.Slider.getHorizSlider("slider-bg-"+name, "slider-thumb-"+name, 0, sliderPixelLength);
    slider.animate = true;
    slider.userInteractionDisabled = false;

    var pixelMidPoint = sliderPixelLength / 2;

    function getValueToScale(pixelValue) {
        var valueToScale = 0;
        if (pixelValue == pixelMidPoint) {
            valueToScale = valid_values.mid;
        } else if (pixelValue < pixelMidPoint){
            valueToScale = pixelValue * (valid_values.mid - valid_values.min) / pixelMidPoint + valid_values.min;
        } else {
            valueToScale = valid_values.mid + (pixelValue - pixelMidPoint) * (valid_values.max - valid_values.mid) / pixelMidPoint;
        }
        return valueToScale;
    }

    slider.getValueAsPercent = function (pixelValue) {
        return getValueToScale(pixelValue) / valid_values.max * 100;
    };

    function refreshPercent(pixelValue) {
        var el = div.querySelector('div#slider-value-percent-' + name);
        if (el) {
            el.innerHTML = Math.floor(slider.getValueAsPercent(pixelValue)) + "%";
        }
    }

    if (print_value_type == 'percent') {
        slider.subscribe('change', function (newPixelValue) {
            refreshPercent(newPixelValue);
        });
    }

    slider.disableUserInteraction = function() {
        this.userInteractionDisabled = true;
        var thumb_elem = div.querySelector('div#slider-thumb-' + name);
        $(thumb_elem).css('opacity', '0.4');
        var slider_bg_elem = div.querySelector('div#slider-bg-' + name);
        $(slider_bg_elem).css('opacity', '0.5');
        if (print_value_type == 'percent') {
            var valuePercentElem = div.querySelector('div#slider-value-percent-' + name);
            $(valuePercentElem).css('opacity', '0.5');
        }
        if (this.getThumb().available) {
            if (this._mouseDown) {
                this.thumbMouseUp();                
            }
            this.lock();
        }
    };
    
    slider.enableUserInteraction = function() {
        this.userInteractionDisabled = false;
        this.unlock();
        var thumb_elem = div.querySelector('div#slider-thumb-' + name);
        $(thumb_elem).css('opacity', '1');
        var slider_bg_elem = div.querySelector('div#slider-bg-' + name);
        $(slider_bg_elem).css('opacity', '1');
        if (print_value_type == 'percent') {
            var valuePercentElem = div.querySelector('div#slider-value-percent-' + name);
            $(valuePercentElem).css('opacity', '1');
        }
        
    };
    
    slider.onSlideEnd = function() {
        if (this.userInteractionDisabled) {
            this.lock();
        }    
    };

    slider.getValueToScale = function (pixelValue) {
        return getValueToScale(pixelValue ? pixelValue : slider.getValue());
    };

    slider.setValueToScale = function (valueToScale) {
        var pixelValue = 0;
        if (valueToScale == valid_values.mid){
            pixelValue = pixelMidPoint;
        } else if (valueToScale < valid_values.mid){
            pixelValue = (valueToScale - valid_values.min) * pixelMidPoint / (valid_values.mid - valid_values.min);
        } else {
            pixelValue = (valueToScale - valid_values.mid) * pixelMidPoint / (valid_values.max - valid_values.mid) + pixelMidPoint;
        }
        slider.setValue(pixelValue);
        refreshPercent(pixelValue);
    };

    slider.setValueToScale(value);
    return [div, slider];
}
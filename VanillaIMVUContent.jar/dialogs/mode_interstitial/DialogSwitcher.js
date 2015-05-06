function DialogSwitcher(spec) {
    var $root = spec.root || rootElementRequired
    var types = spec.types || typesRequired;
    var curType = spec.curType || "";
    this.reloadArgs = spec.reloadArgs || reloadArgsRequired;

    this.cur = types.indexOf(curType);
    if(this.cur == -1) { 
        this.cur = 0; //Default to first element
    }
    this.$switchl = $('<button id="switchl" class="switch" style="position:absolute; top: 10px; left: 10px; z-index: 10"><</button>');
    this.$switchr = $('<button id="switchr" class="switch" style="position:absolute; top: 10px; left: 40px; z-index: 10">></button>');
    this.$note = $('<span class="switch" style="background-color:red; color: white; position:absolute; top: 10px; left: 80px; width:60px;">QA ONLY</span>');
    $root.css({
        display: "inline-block",
        height: 40,
        width: 70,
        position:"absolute",
        "z-index": 12
    });

    var self = this;
    function reload() { 
        self.cur +=types.length;
        self.cur = self.cur%types.length;
        //$('#dialog').attr('class', types[self.cur]);
        self.reloadArgs.info.mode = types[self.cur];
        new ModeInterstitial(self.reloadArgs);
    }
    $root.hover(function() { 
        $('.switch').css('visibility', 'visible');
    }, function() { 
        $('.switch').css('visibility', 'hidden');
    })
    this.$switchr.click( function() { 
        this.cur +=1;
        reload();
    }.bind(this));
    this.$switchl.click( function() { 
        this.cur -=1;
        reload();
    }.bind(this));
    $root.append(this.$switchl).append(this.$switchr).append(this.$note);
    $('.switch').css('visibility', 'hidden');
}

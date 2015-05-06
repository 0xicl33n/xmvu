function TemplateGenerator(args) { 
    this.$template = args.$template.clone(); 
    this.maintainBufferSize = args.maintainBufferSize;
    this.refillBufferThreshold = args.refillBufferThreshold;
    this.buffer = [];
    var fillBuffer = function(){ 
        while(this.buffer.length < this.maintainBufferSize) { 
            this.buffer.push(this.generateTemplate());
        }
    }.bind(this)
    fillBuffer.call();
    this.fillBuffer = _.debounce(fillBuffer,100);
}

TemplateGenerator.prototype = {
    get: function() { 
        if(this.buffer.length < this.refillBufferThreshold) { 
            this.fillBuffer();
        }
        if(this.buffer.length == 0) { 
            return this.generateTemplate();
        } else { 
            return this.buffer.pop();
        }
    },
    generateTemplate: function() { 
        return this.$template.clone();
    },

}

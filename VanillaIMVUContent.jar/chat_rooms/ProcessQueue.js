function ProcessQueue(args) { 
    this.deferProcessing = args.deferProcessing;
    this.timer = args.timer;
    this.constructionQueue = new Array();
    var timeoutId = -1;
    var pidCounter = 0;
    var pidToEntryMap = {};
    var working = false;
    var processQueue = function() { 
        if(this.deferProcessing()) { 
            timeoutId = this.timer.setTimeout(processQueue, 0);
            return;
        }
        var entry;
        do {
            if(!this.constructionQueue.length) { 
                timeoutId = -1;
                working = false;
                return;
            } 
            entry = this.constructionQueue.splice(0,1)[0];
        } while(!pidToEntryMap.hasOwnProperty(entry.pid));

        entry.item.call();

        delete pidToEntryMap[entry.pid];
        timeoutId = this.timer.setTimeout(processQueue, 50);
    }.bind(this);
    this.enqueue = function(item) { 
        var pid = pidCounter++;
        var entry = {
            item: item,
            pid: pid
        };
        this.constructionQueue.push(entry);
        pidToEntryMap[pid] = entry;
        if(!working) { 
            working = true;
            timeoutId = this.timer.setTimeout(processQueue, 0);
        }
        return pid;
    }
    this.pull = function(pid) { 
        if(!pidToEntryMap.hasOwnProperty(pid)) { 
            throw 'pid '+pid+' is not in process queue';
        }
        delete pidToEntryMap[pid];
    }
    this.queueLength = function() { 
        return this.constructionQueue.length;
    }

}

ProcessQueue.prototype = {

}

function IdSet() {
    this.lastId = 0;
    this.length = 0;
    this.elements = {}; // ID : thing
}

IdSet.prototype.add = function(thing) {
    var id = ++this.lastId;
    ++this.length;
    this.elements[id] = thing;
    return id;
};

IdSet.prototype.remove = function(id) {
    if (id in this.elements) {
        --this.length;
        delete this.elements[id];
    }
};

IdSet.prototype.clear = function () {
    this.length = 0;
    this.elements = {};
};

// Theory: This is too slow to run at 30Hz.
// Inline the pattern yourself.
// TODO: Work out an objective benchmark.
IdSet.prototype.forEach = function(fn) {
    for (var k in this.elements) {
        if (this.elements.hasOwnProperty(k)) {
            fn(k, this.elements[k]);
        }
    }
};

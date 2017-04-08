"use strict";
// Simple clone function, which creates a deep copy of the given node
// And recurses on the children (due to the shallow nature of the mathjs node
// clone)
function clone(node) {
    var copy = node.clone();
    copy.changeGroup = node.changeGroup;
    if (node.args) {
        node.args.forEach(function (child, i) {
            copy.args[i] = clone(child);
        });
    }
    else if (node.content) {
        copy.content = clone(node.content);
    }
    return copy;
}
module.exports = clone;
//# sourceMappingURL=clone.js.map
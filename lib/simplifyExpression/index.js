"use strict";
var math = require("mathjs");
var stepThrough = require("./stepThrough");
function simplifyExpressionString(expressionString, debug) {
    if (debug === void 0) { debug = false; }
    var exprNode;
    try {
        exprNode = math.parse(expressionString);
    }
    catch (err) {
        return [];
    }
    if (exprNode) {
        return stepThrough(exprNode, debug);
    }
    return [];
}
module.exports = simplifyExpressionString;
//# sourceMappingURL=index.js.map
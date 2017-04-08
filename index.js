"use strict";
var ChangeTypes = require("./lib/ChangeTypes");
var simplifyExpression = require("./lib/simplifyExpression");
var solveEquation = require("./lib/solveEquation");
var tmp;
tmp = {
    simplifyExpression: simplifyExpression,
    solveEquation: solveEquation,
    ChangeTypes: ChangeTypes,
};
module.exports = tmp;
//# sourceMappingURL=index.js.map
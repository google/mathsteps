import ChangeTypes = require("./lib/ChangeTypes");
import simplifyExpression = require("./lib/simplifyExpression");
import solveEquation = require("./lib/solveEquation");
var tmp;
tmp = {
    simplifyExpression,
    solveEquation,
    ChangeTypes,
};
export = tmp;

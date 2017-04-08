"use strict";
/*
  Various utility functions used in the math stepper
 */
var Util = (function () {
    function Util() {
        // Adds `value` to a list in `dict`, creating a new list if the key isn't in
        // the dictionary yet. Returns the updated dictionary.
        this.appendToArrayInObject = function (dict, key, value) {
            if (dict[key]) {
                dict[key].push(value);
            }
            else {
                dict[key] = [value];
            }
            return dict;
        };
    }
    return Util;
}());
module.exports = Util;
//# sourceMappingURL=Util.js.map
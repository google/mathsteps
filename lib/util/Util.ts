/*
  Various utility functions used in the math stepper
 */
class Util {

// Adds `value` to a list in `dict`, creating a new list if the key isn't in
// the dictionary yet. Returns the updated dictionary.
    static appendToArrayInObject = (dict, key, value) => {
        if (dict[key]) {
            dict[key].push(value);
        } else {
            dict[key] = [value];
        }
        return dict;
    };
}

export = Util;

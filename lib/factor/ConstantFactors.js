// This module deals with getting constant factors, including prime factors
// and factor pairs of a number
"use strict";
var ConstantFactors = (function () {
    function ConstantFactors() {
    }
    // Given a number, will return all the prime factors of that number as a list
    // sorted from smallest to largest
    ConstantFactors.getPrimeFactors = function (number) {
        var factors = [];
        if (number < 0) {
            factors = [-1];
            factors = factors.concat(this.getPrimeFactors(-1 * number));
            return factors;
        }
        var root = Math.sqrt(number);
        var candidate = 2;
        if (number % 2) {
            candidate = 3; // assign first odd
            while (number % candidate && candidate <= root) {
                candidate = candidate + 2;
            }
        }
        // if no factor found then the number is prime
        if (candidate > root) {
            factors.push(number);
        }
        else {
            factors.push(candidate);
            factors = factors.concat(this.getPrimeFactors(number / candidate));
        }
        return factors;
    };
    ;
    // Given a number, will return all the factor pairs for that number as a list
    // of 2-item lists
    ConstantFactors.getFactorPairs = function (number) {
        var factors = [];
        var bound = Math.floor(Math.sqrt(Math.abs(number)));
        for (var divisor = -bound; divisor <= bound; divisor++) {
            if (divisor === 0) {
                continue;
            }
            if (number % divisor === 0) {
                var quotient = number / divisor;
                factors.push([divisor, quotient]);
            }
        }
        return factors;
    };
    ;
    return ConstantFactors;
}());
module.exports = ConstantFactors;
//# sourceMappingURL=ConstantFactors.js.map
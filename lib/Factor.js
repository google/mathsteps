'use strict';

// This module deals with getting factors

const Factor = {};

Factor.getPrimeFactors = function(number){
  let factors = [];
  if (number < 0) {
    factors = [-1];
    factors = factors.concat(Factor.getPrimeFactors(-1 * number));
    return factors;
  }

  const root = Math.sqrt(number);
  let candidate = 2;
  if (number % 2) {
    candidate = 3; // assign first odd
    while (number % candidate && candidate <= root) {
      candidate = candidate + 2;
    }
  }

  // if no factor found then number is prime
  if (candidate > root) {
    factors.push(number);
  }
  else {
    // if number isn't prime factor make recursive call
    factors.push(candidate);
    factors = factors.concat(Factor.getPrimeFactors(number/candidate));
  }

  return factors;
};

Factor.getFactorPairs = function(number){
  let factors = [];

  const root = Math.sqrt(number);
  for (var divisor = 1; divisor <= root; divisor++) {
    if (number % divisor == 0) {
      let quotient = number / divisor;
      factors.push([divisor, quotient])
    }
  }

  return factors;
};

module.exports = Factor;

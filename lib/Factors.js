'use strict';

// This module deals with getting factors

const Factors = {};

Factors.getPrimeFactors = function(number){
  let factors = [];
  if (number < 0) {
    factors = [-1];
    factors = factors.concat(Factors.getPrimeFactors(-1 * number));
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
    factors = factors.concat(Factors.getPrimeFactors(number/candidate));
  }

  return factors;
};

module.exports = Factors;

'use strict';

// This module deals with getting factors

const Factor = {};

// Given a number, will return all the prime factors of that number as a list
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

  // if no factor found then the number is prime
  if (candidate > root) {
    factors.push(number);
  }
  // if we find a factor, make a recursive call on the quotient of the number and
  // our newly found prime factor in order to find more factors
  else {
    factors.push(candidate);
    factors = factors.concat(Factor.getPrimeFactors(number/candidate));
  }

  return factors;
};

// Given a number, will return all the factor pairs for that number as a list
// of 2-item lists
Factor.getFactorPairs = function(number){
  let factors = [];

  const root = Math.sqrt(number);
  for (var divisor = 1; divisor <= root; divisor++) {
    if (number % divisor == 0) {
      let quotient = number / divisor;
      factors.push([divisor, quotient]);
    }
  }

  return factors;
};

module.exports = Factor;

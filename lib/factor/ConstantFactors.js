const math = require('mathjs')

// This module deals with getting constant factors, including prime factors
// and factor pairs of a number

const ConstantFactors = {}

// Given a number, will return all the prime factors of that number as a list
// sorted from smallest to largest
ConstantFactors.getPrimeFactors = function(number){
  let factors = []

  if (math.isNegative(number)) {
    factors = [-1]
    factors = factors.concat(ConstantFactors.getPrimeFactors(math.multiply(-1, number)))
    return factors
  }

  const root       = math.sqrt(number)
  const numberMod2 = math.mod(number, 2)
  let   candidate  = 2

  if (math.unequal(numberMod2, 0)) {
    // assign first odd
    candidate = 3

    while (math.unequal(math.mod(number, candidate), 0) &&
           math.smallerEq(candidate, root)) {

      candidate = candidate + 2
    }
  }

  if (math.larger(candidate, root)) {
    // if no factor found then the number is prime
    factors.push(number)

  } else {
    // if we find a factor, make a recursive call on the quotient of the number and
    // our newly found prime factor in order to find more factors
    factors.push(candidate)
    factors = factors.concat(ConstantFactors.getPrimeFactors(math.divide(number, candidate)))
  }

  return factors
}

// Given a number, will return all the factor pairs for that number as a list
// of 2-item lists
ConstantFactors.getFactorPairs = function(number){
  const factors = []

  const bound      = math.floor(math.sqrt(math.abs(number)))
  const divisorMin = math.multiply(-1, bound)

  for (let divisor = divisorMin;
    math.smallerEq(divisor, bound);
    divisor = math.add(divisor, 1)) {

    if (math.equal(divisor, 0)) {
      continue
    }

    if (math.equal(math.mod(math.abs(number), math.abs(divisor)), 0)) {
      const quotient = math.divide(number, divisor)
      factors.push([divisor, quotient])
    }
  }

  return factors
}

module.exports = ConstantFactors

const math = require('mathjs');

const stepThrough = require('./stepThrough');

function solveEquationString(equationString, debug=false) {
  const comparators = ['<=', '>=', '=', '<', '>'];

  for (let i = 0; i < comparators.length; i++) {
    const comparator = comparators[i];
    const sides = equationString.split(comparator);
    if (sides.length !== 2) {
      continue;
    }
    let leftNode, rightNode;
    const leftSide = sides[0].trim();
    const rightSide = sides[1].trim();

    if (!leftSide || !rightSide) {
      return [];
    }

    try {
      leftNode = math.parse(leftSide);
      rightNode = math.parse(rightSide);
    }
    catch (err) {
      return [];
    }
    if (leftNode && rightNode) {
      return stepThrough(leftNode, rightNode, comparator, debug);
    }
  }

  return [];
}

module.exports = solveEquationString;

const Node = require('../node');
const resolvesToConstant = require('./resolvesToConstant.js');
/*
  Return true if the equation is of the form factor * factor = 0 or factor^power = 0
  // e.g (x - 2)^2 = 0, x(x + 2)(x - 2) = 0
*/
function canFindRoots(equation) {
  const left = equation.leftNode;
  const right = equation.rightNode;

  const zeroRightSide = Node.Type.isConstant(right)
        && parseFloat(right.value) === 0;

  const isMulOrPower = Node.Type.isOperator(left, '*') || Node.Type.isOperator(left, '^');

  if (!(zeroRightSide && isMulOrPower)) {
    return false;
  }

  // If the left side of the equation is multiplication, filter out all the factors
  // that do evaluate to constants because they do not have roots. If the
  // resulting array is empty, there is no roots to be found. Do a similiar check
  // for when the left side is a power node.
  // e.g 2^7 and (33 + 89) do not have solutions when set equal to 0

  if (Node.Type.isOperator(left, '*')) {
    const factors = left.args.filter(arg => !resolvesToConstant(arg));
    return factors.length >= 1;
  }
  else if (Node.Type.isOperator(left, '^')) {
    return !resolvesToConstant(left);
  }
}

module.exports = canFindRoots;

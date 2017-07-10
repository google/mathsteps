const Node = require('../node');
const resolvesToConstant = require('./resolvesToConstant.js');

function canFindRoots(equation) {

  // Equation should be in the form of factor * factor = 0, factor^power = 0, or identifier = 0
  // e.g (x - 2)^2 = 0, x(x + 2)(x - 2) = 0, x = 0
  const left = equation.leftNode;
  const right = equation.rightNode;

  const zeroRightSide = Node.Type.isConstant(right)
        && parseFloat(right.value) === 0;

  const hasRoots = Node.Type.isOperator(left, '*') || Node.Type.isOperator(left, '^');

  if (!(zeroRightSide && hasRoots)) {
    return false;
  }

  if (Node.Type.isOperator(left, '*')) {
    const factors = left.args.filter(arg => !resolvesToConstant(arg));
    if (factors.length === 0) {
      return false;
    }
  }
  else if (Node.Type.isOperator(left, '^')) {
    return !resolvesToConstant(left);
  }

  return true;
}

module.exports = canFindRoots;

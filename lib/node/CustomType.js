const Negative = require('../Negative');
const NodeCreator = require('./Creator');
const NodeType = require('./Type');

const NodeCustomType = {};

// Returns true if `node` belongs to the type specified by boolean `isTypeFunc`.
// If `allowUnaryMinus/allowParens` is true, we allow for the node to be nested.
NodeCustomType.isType = function(node, isTypeFunc, allowUnaryMinus=true, allowParens=true) {
  if (isTypeFunc(node)) {
    return true;
  }
  else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    return NodeCustomType.isType(node.args[0], isTypeFunc, allowUnaryMinus, allowParens);
  }
  else if (allowParens && NodeType.isParenthesis(node)) {
    return NodeCustomType.isType(node.content, isTypeFunc, allowUnaryMinus, allowParens);
  }

  return false;
};

// Returns `node` if `node` belongs to the type specified by boolean `isTypeFunc`.
// If `allowUnaryMinus/allowParens` is true, we check for an inner node of this type.
// `moveUnaryMinus` should be defined if `allowUnaryMinus` is true, and should
// move the unaryMinus into the inside of the type
// e.g. for fractions, this function will negate the numerator
NodeCustomType.getType = function(
  node, isTypeFunc, allowUnaryMinus=true, allowParens=true, moveUnaryMinus=undefined) {
  if (allowUnaryMinus === true && moveUnaryMinus === undefined) {
    throw Error('Error in `getType`: moveUnaryMinus is undefined');
  }

  if (isTypeFunc(node)) {
    return node;
  }
  else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    return moveUnaryMinus(
      NodeCustomType.getType(
        node.args[0], isTypeFunc, allowUnaryMinus, allowParens, moveUnaryMinus));
  }
  else if (allowParens && NodeType.isParenthesis(node)) {
    return NodeCustomType.getType(
      node.content, isTypeFunc, allowUnaryMinus, allowParens, moveUnaryMinus);
  }

  throw Error('`getType` called on a node that does not belong to specified type');
};

NodeCustomType.isFraction = function(node, allowUnaryMinus=true, allowParens=true) {
  return NodeCustomType.isType(
    node,
    (node) => NodeType.isOperator(node, '/'),
    allowUnaryMinus,
    allowParens);
};

NodeCustomType.getFraction = function(node,  allowUnaryMinus=true, allowParens=true) {
  const moveUnaryMinus = function(node) {
    if (!(NodeType.isOperator(node, '/'))) {
      throw Error('Expected a fraction');
    }

    const numerator = node.args[0];
    const denominator = node.args[1];
    const newNumerator = Negative.negate(numerator);
    return NodeCreator.operator('/', [newNumerator, denominator]);
  };

  return NodeCustomType.getType(
    node,
    (node) => NodeType.isOperator(node, '/'),
    allowParens,
    allowUnaryMinus,
    moveUnaryMinus);
};

module.exports = NodeCustomType;

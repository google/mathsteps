const NodeCreator = require('./Creator');
const Negative = require('../Negative');
const NodeType = require('./Type');

const NodeHelper = {};

// Returns true if `node` belongs to the type specified by boolean `isTypeFunc`.
// If `allowUnaryMinus/allowParens` is true, we allow for the node to be nested.
NodeHelper.isType = function(node, isTypeFunc, allowUnaryMinus=true, allowParens=true) {
  if (isTypeFunc(node)) {
    return true;
  }
  else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    return NodeHelper.isType(node.args[0], isTypeFunc, allowUnaryMinus, allowParens);
  }
  else if (allowParens && NodeType.isParenthesis(node)) {
    return NodeHelper.isType(node.content, isTypeFunc, allowUnaryMinus, allowParens);
  }

  return false;
};

// Returns `node` if `node` belongs to the type specified by boolean `isTypeFunc`.
// If `allowUnaryMinus/allowParens` is true, we check for an inner node of this type.
// `moveUnaryMinus` should be defined if `allowUnaryMinus` is true, and should
// move the unaryMinus into the inside of the type
// e.g. for fractions, this function will negate the numerator
NodeHelper.getType = function(
  node, isTypeFunc, allowUnaryMinus=true, allowParens=true, moveUnaryMinus=undefined) {
  if (allowUnaryMinus == true && moveUnaryMinus === undefined) {
      throw Error("Error in `getType`: moveUnaryMinus is undefined");
  }

  if (isTypeFunc(node)) {
    return node;
  }
  else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    return moveUnaryMinus(
      NodeHelper.getType(
        node.args[0], isTypeFunc, allowUnaryMinus, allowParens, moveUnaryMinus));
  }
  else if (allowParens && NodeType.isParenthesis(node)) {
    return NodeHelper.getType(
      node.content, isTypeFunc, allowUnaryMinus, allowParens, moveUnaryMinus);
  }

  throw Error('`getType` called on a node that does not belong to specified type');
};

NodeHelper.isFraction = function(node, allowUnaryMinus=true, allowParens=true) {
  return NodeHelper.isType(
    node,
    (node) => NodeType.isOperator(node, '/'),
    allowUnaryMinus,
    allowParens);
};

NodeHelper.getFraction = function(node,  allowUnaryMinus=true, allowParens=true) {
  const moveUnaryMinus = function(node) {
    if (!(NodeType.isOperator(node, '/'))) {
      throw Error("Expected a fraction");
    }

    numerator = node.args[0];
    denominator = node.args[1];
    newNumerator = Negative.negate(numerator);
    return NodeCreator.operator("/", [newNumerator, denominator]);
  };

  return NodeHelper.getType(
    node,
    (node) => NodeType.isOperator(node, '/'),
    allowParens,
    allowUnaryMinus,
    moveUnaryMinus);
};

module.exports = NodeHelper;

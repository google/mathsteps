const TermWithCoefficient = require('./TermWithCoefficient');
const NodeCreator = require('./Creator');
const NodeType = require('./Type');

const evaluate = require('../util/evaluate');

// TODO: Add docstring
class NthRootTerm extends TermWithCoefficient {
  constructor(node, onlyImplicitMultiplication=false) {
    const baseNodeFunc = function(node) {
      return NodeType.isFunction(node, 'nthRoot');
    }
    super(node, baseNodeFunc, onlyImplicitMultiplication);
  }
}

// Returns if the node represents an expression that can be considered an nth root term.
// e.g. nthRoot(4), nthRoot(x^2), 4*nthRoot(10)
NthRootTerm.isNthRootTerm = function(
    node, onlyImplicitMultiplication=false) {
  try {
    // will throw error if node isn't nth root term
    new NthRootTerm(node, onlyImplicitMultiplication);
    return true;
  }
  catch (err) {
    return false;
  }
};

module.exports = NthRootTerm

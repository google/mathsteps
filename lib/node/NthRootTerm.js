const TermWithCoefficient = require('./TermWithCoefficient');
const NodeCreator = require('./Creator');
const NodeType = require('./Type');

const evaluate = require('../util/evaluate');

// TODO: Add docstring
class NthRootTerm extends TermWithCoefficient {
  constructor(node, onlyImplicitMultiplication=false) {
    super(node, NthRootTerm.baseNodeFunc, onlyImplicitMultiplication);
  }
}

NthRootTerm.baseNodeFunc = function(node) {
  return NodeType.isFunction(node, 'nthRoot');
}

// Returns if the node represents an expression that can be considered an nth root term.
// e.g. nthRoot(4), nthRoot(x^2), 4*nthRoot(10)
NthRootTerm.isNthRootTerm = function(
  node, onlyImplicitMultiplication=false) {
  return TermWithCoefficient.isTermWithCoefficient(
    node, NthRootTerm.baseNodeFunc, onlyImplicitMultiplication);
};

module.exports = NthRootTerm

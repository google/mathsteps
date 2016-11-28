'use strict';

const ConstantFraction = require('./ConstantFraction');
const evaluateArithmetic = require('./evaluateArithmetic');
const NodeType = require('./NodeType');

function evaluateConstantSum(node) {
  if (NodeType.isParenthesis(node)) {
    node = node.content;
  }

  // functions needed to evalute the sum - both collecting and combining
  const summingFunctions = [
    evaluateArithmetic,
    ConstantFraction.addConstantFractions, // we'll need to recurse down a level for these
    ConstantFraction.addConstantAndFraction,
    //collectLikeTerms,
  ];
//  const subSteps = []; will need this once we also collect like terms
  for (let i = 0; i < summingFunctions.length; i++) {
    const status = summingFunctions[i](node);
    if (status.hasChanged()) {
      if (NodeType.isConstantOrConstantFraction(status.newNode)) {
        return status;
      }
      else {
        node = status.newNode; // TODO: cloning and substep grouping
      }
    }
  }
  throw Error('Wasn\'t able to evalute constant sum: ' + node);
}

module.exports = evaluateConstantSum;

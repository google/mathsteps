const Node = require('../node');

function canMultiplyNthRoots(node) {
  // checks if node is a multiplication of nthRoot nodes
  // all the terms has to have the same root node to be multiplied

  if (!Node.Type.isOperator(node, '*')
      || !(node.args.every(term => Node.Type.isFunction(term, 'nthRoot')))){
    return false;
  }

  // Take arbitrary root node
  const firstTerm = node.args[0];
  const rootNode = firstTerm.args[1];

  return node.args.every(term => term.args[1].equals(rootNode));
}

module.exports = canMultiplyNthRoots;

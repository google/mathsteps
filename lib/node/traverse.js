/**
 * traverse - walk all of the nodes in a tree.
 */

function traverse(node, enter, leave) {
  switch (node.type) {
    case 'FunctionNode':
    case 'OperatorNode':
      enter(node);
      node.args.forEach((arg) => traverse(arg, enter, leave));
      leave(node);
      break;

    case 'ConstantNode':
    case 'SymbolNode':
      enter(node);
      leave(node);
      break;

    case 'ParenthesisNode':
      enter(node);
      traverse(node.content, enter, leave);
      leave(node);
      break;

    default:
      throw new Error(`Unrecognized node of type '${node.type}'`);
  }
}

module.exports = traverse;

const ChangeTypes = require('../../ChangeTypes');
const evaluate = require('../../util/evaluate');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

// Searches through the tree, prioritizing deeper nodes, and evaluates
// arithmetic (e.g. 2+2 or 3*5*2) on an operation node if possible.
// Returns a Node.Status object.
const search = TreeSearch.postOrder(arithmetic);

// evaluates arithmetic (e.g. 2+2 or 3*5*2) on an operation node.
// Returns a Node.Status object.
function arithmetic(node) {
  if (!Node.Type.isOperator(node)) {
    return Node.Status.noChange(node);
  }
  if (!node.args.every(child => Node.Type.isConstant(child, true))) {
    return Node.Status.noChange(node);
  }

  // we want to eval each arg so unary minuses around constant nodes become
  // constant nodes with negative values
  node.args.forEach((arg, i) => {
    node.args[i] = Node.Creator.constant(evaluate(arg));
  });

  // Only resolve division of integers if we get an integer result.
  // Note that a fraction of decimals will be divided out.
  if (Node.Type.isIntegerFraction(node)) {
    const numeratorValue = parseInt(node.args[0]);
    const denominatorValue = parseInt(node.args[1]);
    if (numeratorValue % denominatorValue === 0) {
      const newNode = Node.Creator.constant(numeratorValue/denominatorValue);
      return Node.Status.nodeChanged(
        ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode);
    }
    else {
      return Node.Status.noChange(node);
    }
  }
  else {
    const evaluatedValue = evaluateAndRound(node);
    const newNode = Node.Creator.constant(evaluatedValue);
    return Node.Status.nodeChanged(ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode);
  }
}

// Evaluates a math expression to a constant, e.g. 3+4 -> 7 and rounds if
// necessary
function evaluateAndRound(node) {
  let result = evaluate(node);
  if (Math.abs(result) < 1) {
    result  = parseFloat(result.toPrecision(4));
  }
  else {
    result  = parseFloat(result.toFixed(4));
  }
  return result;
}

module.exports = search;

const checks = require('../checks');
const LikeTermCollector = require('../simplifyExpression/collectAndCombineSearch/LikeTermCollector');
const Node = require('../node');

// Removes any parenthesis around nodes that can't be resolved further.
// Input must be a top level expression.
// Returns a node.
function removeUnnecessaryParens(node, rootNode=false) {
  // Parens that wrap everything are redundant.
  // NOTE: removeUnnecessaryParensSearch recursively removes parens that aren't
  // needed, while this step only applies to the very top level expression.
  // e.g. (2 + 3) * 4 can't become 2 + 3 * 4, but if (2 + 3) as a top level
  // expression can become 2 + 3
  if (rootNode) {
    while (Node.Type.isParenthesis(node)) {
      node = node.body;
    }
  }
  return removeUnnecessaryParensSearch(node);
}

// Recursively moves parenthesis around nodes that can't be resolved further if
// it doesn't change the value of the expression. Returns a node.
// NOTE: after this function is called, every parenthesis node in the
// tree should always have an operator node or unary minus as its child.
function removeUnnecessaryParensSearch(node) {
  if (Node.Type.isOperator(node)) {
    return removeUnnecessaryParensInOperatorNode(node);
  }
  else if (Node.Type.isFunction(node)) {
    return removeUnnecessaryParensInFunctionNode(node);
  }
  else if (Node.Type.isParenthesis(node)) {
    return removeUnnecessaryParensInParenthesisNode(node);
  }
  else if (Node.Type.isConstant(node, true) || Node.Type.isSymbol(node)) {
    return node;
  }
  else if (Node.Type.isUnaryMinus(node)) {
    const content = node.args[0];
    node.args[0] = removeUnnecessaryParensSearch(content);
    return node;
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }
}

// Removes unncessary parens for each operator in an operator node, and removes
// unncessary parens around operators that can't be simplified further.
// Returns a node.
function removeUnnecessaryParensInOperatorNode(node) {
  // Special case: if the node is an exponent node and the base
  // is an operator, we should keep the parentheses for the base.
  // e.g. (2x)^2 -> (2x)^2 instead of 2x^2
  if (Node.Type.isOperator(node, '^') && Node.Type.isParenthesis(node.args[0])) {
    const base = node.args[0];
    if (Node.Type.isOperator(base.body)) {
      base.body = removeUnnecessaryParensSearch(base.body);
      node.args[1] = removeUnnecessaryParensSearch(node.args[1]);

      return node;
    }
  }

  node.args.forEach((child, i) => {
    node.args[i] = removeUnnecessaryParensSearch(child);
  });

  // Sometimes, parens are around expressions that have been simplified
  // all they can be. If that expression is part of an addition or subtraction
  // operation, we can remove the parenthesis.
  // e.g. (x+4) + 12 -> x+4 + 12
  if (Node.Type.isOperator(node, '+')) {
    node.args.forEach((child, i) => {
      if (Node.Type.isParenthesis(child) &&
          !canCollectOrCombine(child.body)) {
        // remove the parens by replacing the child node (in its args list)
        // with its content
        node.args[i] = child.body;
      }
    });
  }
  // This is different from addition because when subtracting a group of terms
  //in parenthesis, we want to distribute the subtraction.
  // e.g. `(2 + x) - (1 + x)` => `2 + x - (1 + x)` not `2 + x - 1 + x`
  else if (Node.Type.isOperator(node, '-')) {
    if (Node.Type.isParenthesis(node.args[0]) &&
        !canCollectOrCombine(node.args[0].body)) {
      node.args[0] = node.args[0].body;
    }
  }

  return node;
}

// Removes unncessary parens for each argument in a function node.
// Returns a node.
function removeUnnecessaryParensInFunctionNode(node) {
  node.args.forEach((child, i) => {
    if (Node.Type.isParenthesis(child)) {
      child = child.body;
    }
    node.args[i] = removeUnnecessaryParensSearch(child);
  });

  return node;
}


// Parentheses are unnecessary when their content is a constant e.g. (2)
// or also a parenthesis node, e.g. ((2+3)) - this removes those parentheses.
// Note that this means that the type of the content of a ParenthesisNode after
// this step should now always be an OperatorNode (including unary minus).
// Returns a node.
function removeUnnecessaryParensInParenthesisNode(node) {
  // polynomials terms can be complex trees (e.g. 3x^2/5) but don't need parens
  // around them
  if (Node.PolynomialTerm.isPolynomialTerm(node.body)) {
    // also recurse to remove any unnecessary parens within the term
    // (e.g. the exponent might have parens around it)
    if (node.body.args) {
      node.body.args.forEach((arg, i) => {
        node.body.args[i] = removeUnnecessaryParensSearch(arg);
      });
    }
    node = node.body;
  }
  // If the content is just one symbol or constant, the parens are not
  // needed.
  else if (Node.Type.isConstant(node.body, true) ||
           Node.Type.isIntegerFraction(node.body) ||
           Node.Type.isSymbol(node.body)) {
    node = node.body;
  }
  // If the content is just one function call, the parens are not needed.
  else if (Node.Type.isFunction(node.body)) {
    node = node.body;
    node = removeUnnecessaryParensSearch(node);
  }
  // If there is an operation within the parens, then the parens are
  // likely needed. So, recurse.
  else if (Node.Type.isOperator(node.body)) {
    node.body = removeUnnecessaryParensSearch(node.body);
    // exponent nodes don't need parens around them
    if (Node.Type.isOperator(node.body, '^')) {
      node = node.body;
    }
  }
  // If the content is also parens, we have doubly nested parens. First
  // recurse on the child node, then set the current node equal to its child
  // to get rid of the extra parens.
  else if (Node.Type.isParenthesis(node.body)) {
    node = removeUnnecessaryParensSearch(node.body);
  }
  else if (Node.Type.isUnaryMinus(node.body)) {
    node.body = removeUnnecessaryParensSearch(node.body);
  }
  else {
    throw Error('Unsupported node type: ' + node.body.type);
  }

  return node;
}

// Returns true if any of the collect or combine steps can be applied to the
// expression tree `node`.
function canCollectOrCombine(node) {
  return LikeTermCollector.canCollectLikeTerms(node) ||
    checks.resolvesToConstant(node) ||
    checks.canSimplifyPolynomialTerms(node);
}

module.exports = removeUnnecessaryParens;

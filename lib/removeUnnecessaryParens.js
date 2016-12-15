'use strict';

const LikeTermCollector = require('./LikeTermCollector');
const MathResolveChecks = require('./MathResolveChecks');
const NodeType = require('./NodeType');
const PolynomialTermOperations = require('./PolynomialTermOperations');
const PolynomialTermNode = require('./PolynomialTermNode');

// Removes any parenthesis around nodes that can't be resolved further.
// Input must be a top level expression.
// Returns a node.
function removeUnnecessaryParens(node, rootNode=false) {
  // Parens that wrap everything are redundant.
  // NOTE: removeUnnecessaryParensTreeSearch recursively removes parens that aren't
  // needed, while this step only applies to the very top level expression.
  // e.g. (2 + 3) * 4 can't become 2 + 3 * 4, but if (2 + 3) as a top level
  // expression can become 2 + 3
  if (rootNode) {
    while (NodeType.isParenthesis(node)) {
      node = node.content;
    }
  }
  return removeUnnecessaryParensTreeSearch(node);
}

// Recursively moves parenthesis around nodes that can't be resolved further if
// it doesn't change the value of the expression. Returns a node.
// NOTE: after this function is called, every parenthesis node in the
// tree should always have an operator node or unary minus as its child.
function removeUnnecessaryParensTreeSearch(node) {
  if (NodeType.isOperator(node)) {
    return removeUnnecessaryParensInOperatorNode(node);
  }
  else if (NodeType.isFunction(node)) {
    return removeUnnecessaryParensInFunctionNode(node);
  }
  else if (NodeType.isParenthesis(node)) {
    return removeUnnecessaryParensInParenthesisNode(node);
  }
  else if (NodeType.isConstant(node, true) || NodeType.isSymbol(node)) {
    return node;
  }
  else if (NodeType.isUnaryMinus(node)) {
    const content = node.args[0];
    node.args[0] = removeUnnecessaryParensTreeSearch(content);
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
  node.args.forEach((child, i) => {
    node.args[i] = removeUnnecessaryParensTreeSearch(child);
  });

  // Sometimes, parens are around expressions that have been simplified
  // all they can be. If that expression is part of an addition or subtraction
  // operation, we can remove the parenthesis.
  // e.g. (x+4) + 12 -> x+4 + 12
  if (node.op === '+') {
    node.args.forEach((child, i) => {
      if (NodeType.isParenthesis(child) &&
          !canCollectOrCombine(child.content)) {
        // remove the parens by replacing the child node (in its args list)
        // with its content
        node.args[i] = child.content;
      }
    });
  }
  // This is different from addition because when subtracting a group of terms
  //in parenthesis, we want to distribute the subtraction.
  // e.g. `(2 + x) - (1 + x)` => `2 + x - (1 + x)` not `2 + x - 1 + x`
  else if (node.op === '-') {
    if (NodeType.isParenthesis(node.args[0]) &&
        !canCollectOrCombine(node.args[0].content)) {
      node.args[0] = node.args[0].content;
    }
  }

  return node;
}

// Removes unncessary parens for each argument in a function node.
// Returns a node.
function removeUnnecessaryParensInFunctionNode(node) {
  node.args.forEach((child, i) => {
    if (NodeType.isParenthesis(child)) {
      child = child.content;
    }
    node.args[i] = removeUnnecessaryParensTreeSearch(child);
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
  if (PolynomialTermNode.isPolynomialTerm(node.content)) {
    // also recurse to remove any unnecessary parens within the term
    // (e.g. the exponent might have parens around it)
    if (node.content.args) {
      node.content.args.forEach((arg, i) => {
        node.content.args[i] = removeUnnecessaryParensTreeSearch(arg);
      });
    }
    node = node.content;
  }
  // If the content is just one symbol or constant, the parens are not
  // needed.
  else if (NodeType.isConstant(node.content, true) ||
           NodeType.isIntegerFraction(node.content) ||
           NodeType.isSymbol(node.content)) {
    node = node.content;
  }
  // If the content is just one function call, the parens are not needed.
  else if (NodeType.isFunction(node.content)) {
    node = node.content;
    node = removeUnnecessaryParensTreeSearch(node);
  }
  // If there is an operation within the parens, then the parens are
  // likely needed. So, recurse.
  else if (NodeType.isOperator(node.content)) {
    node.content = removeUnnecessaryParensTreeSearch(node.content);
    // exponent nodes don't need parens around them
    if (node.content.op === '^') {
      node = node.content;
    }
  }
  // If the content is also parens, we have doubly nested parens. First
  // recurse on the child node, then set the current node equal to its child
  // to get rid of the extra parens.
  else if (NodeType.isParenthesis(node.content)) {
    node = removeUnnecessaryParensTreeSearch(node.content);
  }
  else if (NodeType.isUnaryMinus(node.content)) {
    node.content = removeUnnecessaryParensTreeSearch(node.content);
  }
  else {
    throw Error('Unsupported node type: ' + node.content.type);
  }

  return node;
}

// Returns true if any of the collect or combine steps can be applied to the
// expression tree `node`.
function canCollectOrCombine(node) {
  return LikeTermCollector.canCollectLikeTerms(node) ||
    MathResolveChecks.resolvesToConstant(node) ||
    PolynomialTermOperations.canCombinePolynomialTerms(node);
}

module.exports = removeUnnecessaryParens;

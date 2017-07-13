const arithmeticSearch = require('../arithmeticSearch');
const clone = require('../../util/clone');
const collectAndCombineSearch = require('../collectAndCombineSearch');
const rearrangeCoefficient = require('../basicsSearch/rearrangeCoefficient');

const ChangeTypes = require('../../ChangeTypes');
const Negative = require('../../Negative');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

const search = TreeSearch.postOrder(distribute);

// Distributes through parenthesis.
// e.g. 2(x+3) -> (2*x + 2*3)
// e.g. -(x+5) -> (-x + -5)
// Returns a Node.Status object.
function distribute(node) {
  if (Node.Type.isUnaryMinus(node)) {
    return distributeUnaryMinus(node);
  }
  else if (Node.Type.isOperator(node, '*')) {
    return distributeAndSimplifyMultiplication(node);
  }
  else if (Node.Type.isOperator(node, '^')) {
    return expandBase(node);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// Expand a power node with a non-constant base and a positive exponent > 1
// e.g. (nthRoot(x, 2))^2 -> nthRoot(x, 2) * nthRoot(x, 2)
// e.g. (2x + 3)^2 -> (2x + 3) (2x + 3)
function expandBase (node) {
  // Must be a power node and the exponent must be a constant
  // Base must either be an nthRoot or sum of terms
  if (!Node.Type.isOperator(node, '^')) {
    return Node.Status.noChange(node);
  }

  const base = Node.Type.isParenthesis(node.args[0])
        ? node.args[0].content
        : node.args[0];

  const exponent = Node.Type.isParenthesis(node.args[1])
        ? node.args[1].content
        : node.args[1];

  const exponentValue = parseFloat(exponent.value);

  // Exponent should be a positive integer
  if (!(Number.isInteger(exponentValue) && exponentValue > 1)) {
    return Node.Status.noChange(node);
  }

  if (!Node.Type.isFunction(base, 'nthRoot') && !Node.Type.isOperator(base, '+')) {
    return Node.Status.noChange(node);
  }

  // If the base is an nthRoot node, it doesn't need the parenthesis
  const expandedBase = Node.Type.isFunction(base, 'nthRoot')
        ? base
        : node.args[0];

  const expandedNode = Node.Creator.operator('*', Array(parseFloat(exponent.value)).fill(expandedBase));

  return Node.Status.nodeChanged(
    ChangeTypes.EXPAND_EXPONENT, node, expandedNode, false);
}

// Distributes unary minus into a parenthesis node.
// e.g. -(4*9*x^2) --> (-4 * 9  * x^2)
// e.g. -(x + y - 5) --> (-x + -y + 5)
// Returns a Node.Status object.
function distributeUnaryMinus(node) {
  if (!Node.Type.isUnaryMinus(node)) {
    return Node.Status.noChange(node);
  }
  const unaryContent = node.args[0];
  if (!Node.Type.isParenthesis(unaryContent)) {
    return Node.Status.noChange(node);
  }
  const content = unaryContent.content;
  if (!Node.Type.isOperator(content)) {
    return Node.Status.noChange(node);
  }
  const newContent = clone(content);
  node.changeGroup = 1;
  // For multiplication and division, we can push the unary minus in to
  // the first argument.
  // e.g. -(2/3) -> (-2/3)    -(4*9*x^2) --> (-4 * 9  * x^2)
  if (content.op === '*' || content.op === '/') {
    newContent.args[0] = Negative.negate(newContent.args[0]);
    newContent.args[0].changeGroup = 1;
    const newNode = Node.Creator.parenthesis(newContent);
    return Node.Status.nodeChanged(
      ChangeTypes.DISTRIBUTE_NEGATIVE_ONE, node, newNode, false);
  }
  else if (content.op === '+') {
    // Now we know `node` is of the form -(x + y + ...).
    // We want to now return (-x + -y + ....)
    // If any term is negative, we make it positive it right away
    // e.g. -(2-4) => -2 + 4
    const newArgs = newContent.args.map(arg => {
      const newArg = Negative.negate(arg);
      newArg.changeGroup = 1;
      return newArg;
    });
    newContent.args = newArgs;
    const newNode = Node.Creator.parenthesis(newContent);
    return Node.Status.nodeChanged(
      ChangeTypes.DISTRIBUTE_NEGATIVE_ONE, node, newNode, false);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// Distributes a pair of terms in a multiplication operation, if a pair
// can be distributed. To be distributed, there must be two terms beside
// each other, and at least one of them must be a parenthesis node.
// e.g. 2*(3+x) or (4+x^2+x^3)*(x+3)
// Returns a Node.Status object with substeps
function distributeAndSimplifyMultiplication(node) {
  if (!Node.Type.isOperator(node) || node.op !== '*') {
    return Node.Status.noChange(node);
  }

  // STEP 1: distribute with `distributeTwoNodes`
  // e.g. x*(2+x) -> x*2 + x*x
  // STEP 2: simplifications of each operand in the new sum with `simplify`
  // e.g. x*2 + x*x -> ... -> 2x + x^2
  for (let i = 0; i+1 < node.args.length; i++) {
    if (!isParenthesisOfAddition(node.args[i]) &&
        !isParenthesisOfAddition(node.args[i+1])) {
      continue;
    }
    let newNode = clone(node);
    const substeps = [];
    let status;

    const combinedNode = distributeTwoNodes(newNode.args[i], newNode.args[i+1]);
    node.args[i].changeGroup = 1;
    node.args[i+1].changeGroup = 1;
    combinedNode.changeGroup = 1;

    if (newNode.args.length > 2) {
      newNode.args.splice(i, 2, combinedNode);
      newNode.args[i].changeGroup = 1;
    }
    else {
      newNode = combinedNode;
      newNode.changeGroup = 1;
    }

    status = Node.Status.nodeChanged(
      ChangeTypes.DISTRIBUTE, node, newNode, false);
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);

    // case 1: there were more than two operands in this multiplication
    // e.g. 3*7*(2+x)*(3+x)*(4+x) is a multiplication node with 5 children
    // and the new node will be 3*(14+7x)*(3+x)*(4+x) with 4 children.
    if (Node.Type.isOperator(newNode, '*')) {
      const childStatus = simplifyWithParens(newNode.args[i]);
      if (childStatus.hasChanged()) {
        status = Node.Status.childChanged(newNode, childStatus, i);
        substeps.push(status);
        newNode = Node.Status.resetChangeGroups(status.newNode);
      }
    }
    // case 2: there were only two operands and we multiplied them together.
    // e.g. 7*(2+x) -> (7*2 + 7*x)
    // Now we can just simplify it.
    else if (Node.Type.isParenthesis(newNode)){
      status = simplifyWithParens(newNode);
      if (status.hasChanged()) {
        substeps.push(status);
        newNode = Node.Status.resetChangeGroups(status.newNode);
      }
    }
    else {
      throw Error('Unsupported node type for distribution: ' + node);
    }

    if (substeps.length === 1) {
      return substeps[0];
    }

    return Node.Status.nodeChanged(
      ChangeTypes.DISTRIBUTE, node, newNode, false, substeps);
  }
  return Node.Status.noChange(node);
}

// Distributes two nodes together. At least one node must be parenthesis node
// e.g. 2*(x+3) -> (2*x + 2*3)       (5+x)*x -> 5*x + x*x
// e.g. (5+x)*(x+3) -> (5*x + 5*3 + x*x + x*3)
// Returns a node.
function distributeTwoNodes(firstNode, secondNode) {
  // lists of terms we'll be multiplying together from each node
  let firstArgs, secondArgs;
  if (isParenthesisOfAddition(firstNode)) {
    firstArgs = firstNode.content.args;
  }
  else {
    firstArgs = [firstNode];
  }

  if (isParenthesisOfAddition(secondNode)) {
    secondArgs = secondNode.content.args;
  }
  else {
    secondArgs = [secondNode];
  }
  // the new operands under addition, now products of terms
  const newArgs = [];

  // if exactly one group contains at least one fraction, multiply the
  // non-fraction group into the numerators of the fraction group
  if ([firstArgs, secondArgs].filter(hasFraction).length === 1) {
    const firstArgsHasFraction = hasFraction(firstArgs);
    const fractionNodes = firstArgsHasFraction ? firstArgs : secondArgs;
    const nonFractionTerm = firstArgsHasFraction ? secondNode : firstNode;
    fractionNodes.forEach((node) => {
      let arg;
      if (isFraction(node)) {
        let numerator = Node.Creator.operator('*', [node.args[0], nonFractionTerm]);
        numerator = Node.Creator.parenthesis(numerator);
        arg = Node.Creator.operator('/', [numerator, node.args[1]]);
      }
      else {
        arg = Node.Creator.operator('*', [node, nonFractionTerm]);
      }
      arg.changeGroup = 1;
      newArgs.push(arg);
    });
  }
  // e.g. (4+x)(x+y+z) will become 4(x+y+z) + x(x+y+z) as an intermediate
  // step.
  else if (firstArgs.length > 1 && secondArgs.length > 1) {
    firstArgs.forEach(leftArg => {
      const arg = Node.Creator.operator('*', [leftArg, secondNode]);
      arg.changeGroup = 1;
      newArgs.push(arg);
    });
  }
  else {
    // a list of all pairs of nodes between the two arg lists
    firstArgs.forEach(leftArg => {
      secondArgs.forEach(rightArg => {
        const arg = Node.Creator.operator('*', [leftArg, rightArg]);
        arg.changeGroup = 1;
        newArgs.push(arg);
      });
    });
  }
  return Node.Creator.parenthesis(Node.Creator.operator('+', newArgs));
}

function hasFraction(args) {
  return args.filter(isFraction).length > 0;
}

function isFraction(node) {
  return Node.Type.isOperator(node, '/');
}

// Simplifies a sum of terms (a result of distribution) that's in parens
// (note that all results of distribution are in parens)
// e.g. 2x*(4 + x) distributes to (2x*4 + 2x*x)
// This is a separate function from simplify to make the flow more readable,
// but this is literally just a wrapper around 'simplify'.
// Returns a Node.Status object
function simplifyWithParens(node) {
  if (!Node.Type.isParenthesis(node)) {
    throw Error('expected ' + node + ' to be a parenthesis node');
  }

  const status = simplify(node.content);
  if (status.hasChanged()) {
    return Node.Status.childChanged(node, status);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// Simplifies a sum of terms that are a result of distribution.
// e.g. (2x+3)*(4x+5) -distribute-> 2x*(4x+5) + 3*(4x+5) <- 2 terms to simplify
// e.g. 2x*(4x+5) --distribute--> 2x*4x + 2x*5 --simplify--> 8x^2 + 10x
// Returns a Node.Status object.
function simplify(node) {
  const substeps = [];
  const simplifyFunctions = [
    arithmeticSearch,                       // e.g. 2*9 -> 18
    rearrangeCoefficient,  // e.g. x*5 -> 5x
    collectAndCombineSearch,                        // e.g 2x*4x -> 8x^2
    distributeAndSimplifyMultiplication, // e.g. (2+x)(3+x) -> 2*(3+x) recurses
  ];

  let newNode = clone(node);
  for (let i = 0; i < newNode.args.length; i++) {
    for (let j = 0; j < simplifyFunctions.length; j++) {
      const childStatus = simplifyFunctions[j](newNode.args[i]);
      if (childStatus.hasChanged()) {
        const status = Node.Status.childChanged(newNode, childStatus, i);
        substeps.push(status);
        newNode = Node.Status.resetChangeGroups(status.newNode);
      }
    }
  }

  // possible in cases like 2(x + y) -> 2x + 2y -> doesn't need simplifying
  if (substeps.length === 0) {
    return Node.Status.noChange(node);
  }
  else {
    return Node.Status.nodeChanged(
      ChangeTypes.SIMPLIFY_TERMS, node, newNode, false, substeps);
  }
}

// returns true if `node` is of the type (node + node + ...)
function isParenthesisOfAddition(node) {
  if (!Node.Type.isParenthesis(node)) {
    return false;
  }
  const content = node.content;
  return Node.Type.isOperator(content, '+');
}

module.exports = search;

const arithmeticSearch = require('../arithmeticSearch');
const clone = require('../../util/clone');
const collectAndCombineSearch = require('../collectAndCombineSearch');
const rearrangeCoefficient = require('../basicsSearch/rearrangeCoefficient');

const ChangeTypes = require('../../ChangeTypes');
const Negative = require('../../Negative');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');
const search = TreeSearch.preOrder(distribute);
const print = require('../../util/print.js');
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
    /*
      If it is a power node
      1) If base is an nthRoot node, distribute the exponent
      2) If the exponent is negative, reciprocate the base
      3) If the base is a multiplication or power node, distribute the exponent
      4) If the base is an addition node, expand the base

      e.g. (x y)^-1 -> 1/(x y)
      e.g. (x y)^2 -> x^2 y^2, (x^2)^3 -> x^(2 * 3)
      e.g. (x + 1)^2 -> (x + 1) (x + 1)
    */

    const base = getContent(node.args[0]);
    const exponent = getContent(node.args[1]);

    if (Negative.isNegative(exponent)
             || (exponent && Negative.isNegative(exponent))) {
      return reciprocateTerm(node);
    }
    else if (Node.Type.isFunction(base, 'nthRoot')) {
      return convertNthRootToExponent(node);
    }
    else if (Node.Type.isOperator(base, '*') || Node.Type.isOperator(base, '^')){
      return distributeExponent(node);
    }
    else if (Node.Type.isOperator(base, '+')) {
      return expandBase(node);
    }
    return Node.Status.noChange(node);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// Helper to get content inside parens
function getContent(node) {
  return Node.Type.isParenthesis(node)
    ? node.content
    : node;
}

function convertNthRootToExponent(node) {
  const base = getContent(node.args[0]);
  const exponent = getContent(node.args[1]);

  const [radicand, root] = base.args;

  const one = Node.Creator.constant(1);
  const rootExponent = Node.Creator.operator('/', [one, root]);

  const newExponent = root.equals(exponent)
        ? one
        : Node.Creator.parenthesis(Node.Creator.operator('*', [rootExponent, exponent]));

  const newNode = Node.Creator.operator('^', [radicand, newExponent]);

  return Node.Status.nodeChanged(
    ChangeTypes.CONVERT_NTH_ROOT_TO_EXPONENT, node, newNode, false);
}

/*
  Given a node raised to a negative power, negate the exponent and reciprocate
  the node. Returns a nodeChanged Status object.

  e.g. (x y)^-1 -> 1/(x y)
  e.g. (2x^2)^-1 -> 1/(2x^2)
*/
function reciprocateTerm(node) {
  const exponent = node.args[1];
  // Negate the exponent
  node.args[1] = Node.Type.isParenthesis(exponent)
    ? Node.Creator.parenthesis(Negative.negate(exponent.content))
    : Negative.negate(exponent);

  const one = Node.Creator.constant(1);

  const newNode = Node.Creator.operator('/', [one, node]);

  return Node.Status.nodeChanged(
    ChangeTypes.NEGATIVE_EXPONENT, node, newNode, false);
}


/*
  Given an expression in the form (base)^exponent, where base is a multiplication node
  and the exponent is any term, we want to distribute the exponent over each term.
  Returns a nodeChanged Status object.

  e.g. (x^2 y^2)^(2) -> x^4 y^4
  e.g. ((x + 1) (x + 2))^2 -> (x + 1)^2 (x + 2)^2
*/
function distributeExponent(node) {
  // Base is required to be a multiplication of terms
  const base = getContent(node.args[0]);

  // Exponent can be any term: polynomial, constant, fraction, etc
  const outerExponent = getContent(node.args[1]);

  let newTerms;

  /*
    When the base is a multiplication node
    Iterate over each factor in the base and multiply the outside exponent
    by the exponent of the term (implicit is one)
    e.g. (x^2 y^2)^2 -> x^(2 * 2) y^(2 * 2)
  */

  if (Node.Type.isOperator(base, '*')) {
    newTerms = base.args.map(function(term) {
      // Recurses when a term is a multiplication node
      // e.g. (2x^2 * y)^2 -> 2^2 * x^(2 * 2) * y^2
      if (Node.Type.isOperator(term, '*')) {
        const newTerm = Node.Creator.operator('^', [term, outerExponent]);

        return distributeExponent(newTerm).newNode;
      }

      // When the base is a power node, multiply inner and outer exponents
      // and wrap the new exponent in parens
      // e.g. (x^2)^2 -> x^(2 * 2)
      if (Node.Type.isOperator(term, '^')) {
        return distributeOverPowerNode(term, outerExponent);
      }

      // e.g. (nthRoot(x,2) * nthRoot(x,3))^2 -> nthRoot(x, 2)^2 * nthRoot(x, 3)^2
      if (Node.Type.isFunction(term, 'nthRoot')) {
        return Node.Creator.operator('^', [term, outerExponent]);
      }

      return Node.Creator.operator('^', [term, outerExponent]);
    });
  }
  else if (Node.Type.isOperator(base, '^')) {
    newTerms = distributeOverPowerNode(base, outerExponent);
  }

  const newNode = Array.isArray(newTerms)
        ? Node.Creator.operator('*', newTerms)
        : newTerms;

  return Node.Status.nodeChanged(
    ChangeTypes.DISTRIBUTE_EXPONENT, node, newNode, false);
}

// Helper to distribute exponent to power nodes
// e.g. (x^3)^2 -> x^(3 * 2)
function distributeOverPowerNode(node, outerExponent) {
  const [base, exponent] = node.args;
  const newExponent = Node.Creator.parenthesis(Node.Creator.operator('*', [exponent, outerExponent]));

  const newTerm = Node.Creator.operator('^', [base, newExponent]);
  return newTerm;
}

/*
  Expand a power node with a non-constant base and a positive exponent > 1
  e.g. (nthRoot(x, 2))^2 -> nthRoot(x, 2) * nthRoot(x, 2)
  e.g. (2x + 3)^2 -> (2x + 3) (2x + 3)
*/
function expandBase (node) {
  // Must be a power node and the exponent must be a constant
  // Base must either be an nthRoot or sum of terms
  if (!Node.Type.isOperator(node, '^')) {
    return Node.Status.noChange(node);
  }

  const base = getContent(node.args[0]);
  const exponent = getContent(node.args[1]);

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

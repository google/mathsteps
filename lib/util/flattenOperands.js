const evaluate = require('./evaluate');

const Negative = require('../Negative');
const Node = require('../node');

/*
Background:

Expression trees are commonly parsed as binary trees, and mathjs does this too.
That means that a mathjs expression tree likely looks like:
http://collegelabs.co/clabs/nld/images/524px-Expression_Tree.svg.png

e.g. 2+2+2 is parsed by mathjs as 2 + 2+2 (a plus node with children 2 and 2+2)
However...
1. This is more complicated than needed. 2+2+2 is the same as 2+(2+2)
2. To collect like terms, we actually *need* it to be flat. e.g. with 2x+(2+2x),
   there's no easy way to know that there are two 2x's to collect without
   running up and down the tree. If we flatten to 2x+2+2x, it becomes a lot
   easier to collect like terms to (2x+2x) + 2, which would then be combined to
   4x + 2
The purpose of flatteOperands is to flatten the tree in this way.

e.g. an expression that is grouped in the tree like
(2 + ((4 * ((1 + 2) + (3 + 4))) * 8))
should be flattened to look like:
(2 + (4 * (1 + 2 + 3 + 4) * 8))

Subtraction and division are also flattened, though that gets a bit more
complicated and you may as well start reading through the code if you're
interested in how that works
*/

// Flattens the tree accross the same operation (just + and * for now)
// e.g. 2+2+2 is parsed by mathjs as 2+(2+2), but this would change that to
// 2+2+2, ie one + node that has three children.
// Input: an expression tree
// Output: the expression tree updated with flattened operations
function flattenOperands(node) {
  // If the node is a mixed number, do not perform any flattening
  // -- Flattening will take out the implicit multiplication, and so
  //    it will be impossible to tell if the node is a mixed number or
  //    if it is legitimate multiplication
  // -- Converting fractions happens before any other simplification step,
  //    so the tree *will* get flattened before any other changes happen
  if (Node.MixedNumber.isMixedNumber(node)) {
    return node;
  }

  if (Node.Type.isConstant(node, true)) {
    // the evaluate() changes unary minuses around constant nodes to constant nodes
    // with negative values.
    const constNode = Node.Creator.constant(evaluate(node));
    if (node.changeGroup) {
      constNode.changeGroup = node.changeGroup;
    }
    return constNode;
  }
  else if (Node.Type.isOperator(node)) {
    if ('+-/*'.includes(node.op)) {
      let parentOp;
      if (node.op === '/') {
        // Division is flattened in partner with multiplication. This means
        // that after collecting the operands, they'll be children args of *
        parentOp = '*';
      }
      else if (node.op === '-') {
        // Subtraction is flattened in partner with addition, This means that
        // after collecting the operands, they'll be children args of +
        parentOp = '+';
      }
      else {
        parentOp = node.op;
      }
      return flattenSupportedOperation(node, parentOp);
    }
    // If the operation is not supported, just recurse on the children
    else {
      node.args.forEach((child, i) => {
        node.args[i] = flattenOperands(child);
      });
    }
    return node;
  }
  else if (Node.Type.isParenthesis(node)) {
    node.content = flattenOperands(node.content);
    return node;
  }
  else if (Node.Type.isUnaryMinus(node)) {
    const arg = flattenOperands(node.args[0]);
    const flattenedNode = Negative.negate(arg, true);
    if (node.changeGroup) {
      flattenedNode.changeGroup = node.changeGroup;
    }
    return flattenedNode;
  }
  else if (Node.Type.isFunction(node) && node.fn.args) {
    // node.fn.args will only be populated in the case where a function node is
    // followed by a node in parenthesis
    // mathjs parses this incorrectly; we want to convert the node to be
    // multiplication between the function and the node in parenthesis
    // e.g. nthRoot(11)(x+y) -> nthRoot(11) * (x+y)
    //      abs(3)(1+2) -> abs(3) * (1+2)
    const flattenedFn = flattenOperands(node.fn); // e.g. nthRoot(11)
    const flattenedArg = flattenOperands(node.args[0]); // e.g. x+y
    const newNode = Node.Creator.operator(
      '*', [flattenedFn, Node.Creator.parenthesis(flattenedArg)]);
    return newNode;
  }
  else if (Node.Type.isFunction(node, 'abs')) {
    node.args[0] = flattenOperands(node.args[0]);
    return node;
  }
  else if (Node.Type.isFunction(node, 'nthRoot')) {
    node.args[0] = flattenOperands(node.args[0]);
    if (node.args[1]) {
      node.args[1] = flattenOperands(node.args[1]);
    }
    return node;
  }
  else {
    return node;
  }
}

// Flattens operations (see flattenOperands docstring) for an operator node
// with an operation type that can be flattened. Currently * + / are supported.
// Returns the updated, flattened node.
// NOTE: the returned node will be of operation type `parentOp`, regardless of
// the operation type of `node`, unless `node` wasn't changed
// e.g. 2 * 3 / 4 would be * of 2 and 3/4, but 2/3 would stay 2/3 and division
function flattenSupportedOperation(node, parentOp) {
  // First get the list of operands that this operator operates on.
  // e.g. 2 + 3 + 4 + 5 is stored as (((2 + 3) + 4) + 5) in the tree and we
  // want to get the list [2, 3, 4, 5]
  const operands = getOperands(node, parentOp);

  // If there's only one operand (possible if 2*x was flattened to 2x)
  // then it's no longer an operation, so we should replace the node
  // with the one operand.
  if (operands.length === 1) {
    node = operands[0];
  }
  else {
    // When we are dealing with flattening division, and there's also
    // multiplication involved, we might end up with a top level * instead.
    // e.g. 2*4/5 is parsed with / at the top, but in the end we want 2 * (4/5)
    // Check for this by first checking if we have more than two operands
    // (which is impossible for division), then by recursing through the
    // original tree for any multiplication node - if there was one, it would
    // have ended up at the root.
    if (node.op === '/' && (operands.length > 2 ||
                            hasMultiplicationBesideDivision(node))) {
      node = Node.Creator.operator('*', operands);
    }
    // similarily, - will become + always
    else if (node.op === '-') {
      node = Node.Creator.operator('+', operands);
    }
    // otherwise keep the operator, replace operands
    else {
      node.args = operands;
    }
    // When we collect operands to flatten multiplication, the
    // multiplication of those operands should never be implicit
    if (node.op === '*') {
      node.implicit = false;
    }
  }
  return node;
}

// Recursively finds the operands under `parentOp` in the input tree `node`.
// The input tree `node` will always have a parent that is an operation
// of type `op`.
// Op is a string e.g. '+' or '*'
// returns the list of all the node operated on by `parentOp`
function getOperands(node, parentOp) {
  // We can only recurse on operations of type op.
  // If the node is not an operator node or of the right operation type,
  // we can't break up or flatten this tree any further, so we return just
  // the current node, and recurse on it to flatten its ops.
  if (!Node.Type.isOperator(node)) {
    return [flattenOperands(node)];
  }
  switch (node.op) {
  // division is part of flattening multiplication
  case '*':
  case '/':
    if (parentOp !== '*') {
      return [flattenOperands(node)];
    }
    break;
  case '+':
  case '-':
    if (parentOp !== '+') {
      return [flattenOperands(node)];
    }
    break;
  default:
    return [flattenOperands(node)];
  }
  if (Node.PolynomialTerm.isPolynomialTerm(node, true)) {
    node.args.forEach((arg, i) => {
      node.args[i] = flattenOperands(node.args[i]);
    });
    return [node];
  }

  // If we're flattening over *, check for a polynomial term (ie a
  // coefficient multiplied by a symbol such as 2x^2 or 3y)
  // This is true if there's an implicit multiplication and the right operand
  // is a symbol or a symbol to an exponent.
  else if (parentOp === '*' && isPolynomialTermMultiplication(node)) {
    return maybeFlattenPolynomialTerm(node);
  }
  else if (parentOp === '*' && node.op === '/') {
    return flattenDivision(node);
  }
  else if (node.op === '-') {
    // this operation will become addition e.g. 2 - 3 -> 2 + -(-3)
    const secondOperand = node.args[1];
    const negativeSecondOperand = Negative.negate(secondOperand, true);
    const operands = [
      getOperands(node.args[0], parentOp),
      getOperands(negativeSecondOperand, parentOp)
    ];
    return [].concat.apply([], operands);
  }
  else {
    const operands = [];
    node.args.forEach((child) => {
      // This will make an array of arrays
      operands.push(getOperands(child, parentOp));
    });
    return [].concat.apply([], operands);
  }
}

// Return true iff node is a candidate for simplifying to a polynomial
// term. This function is a helper function for getOperands.
// Context: Usually we'd flatten 2*2*x to a multiplication node with 3 children
// (2, 2, and x) but if we got 2*2x, we want to keep 2x together.
// 2*2*x (a tree stored in two levels because initially nodes only have two
// children) in the flattening process should be turned into 2*2x instead of
// 2*2*x (which has three children).
// So this function would return true for the input 2*2x, if it was stored as
// an expression tree with root node * and children 2*2 and x
function isPolynomialTermMultiplication(node) {
  // This concept only applies when we're flattening multiplication operations
  if (node.op !== '*') {
    return false;
  }
  // This only makes sense when we're flattening two arguments
  if (node.args.length !== 2) {
    return false;
  }
  // The second node should be for the form x or x^2 (ie a polynomial term
  // with no coefficient)
  const secondOperand = node.args[1];
  if (Node.PolynomialTerm.isPolynomialTerm(secondOperand)) {
    const polyNode = new Node.PolynomialTerm(secondOperand);
    return !polyNode.hasCoeff();
  }
  else {
    return false;
  }
}

// Takes a node that might represent a multiplication with a polynomial term
// and flattens it appropriately so the coefficient and symbol are grouped
// together. Returns a new list of operands from this node that should be
// multiplied together.
function maybeFlattenPolynomialTerm(node) {
  // We recurse on the left side of the tree to find operands so far
  const operands = getOperands(node.args[0], '*');

  // If the last operand (so far) under * was a constant, then it's a
  // polynomial term.
  // e.g. 2*5*6x creates a tree where the top node is implicit multiplcation
  // and the left branch goes to the tree with 2*5*6, and the right operand
  // is the symbol x. We want to check that the last argument on the left (in
  // this example 6) is a constant.
  const lastOperand = operands.pop();

  // in the above example, node.args[1] would be the symbol x
  const nextOperand = flattenOperands(node.args[1]);

  // a coefficient can be constant or a fraction of constants
  if (Node.Type.isConstantOrConstantFraction(lastOperand)) {
    // we replace the constant (which we popped) with constant*symbol
    operands.push(
      Node.Creator.operator('*', [lastOperand, nextOperand], true));
  }
  // Now we know it isn't a polynomial term, it's just another seperate operand
  else {
    operands.push(lastOperand);
    operands.push(nextOperand);
  }
  return operands;
}

// Takes a division node and returns a list of operands
// If there is multiplication in the numerator, the operands returned
// are to be multiplied together. Otherwise, a list of length one with
// just the division node is returned. getOperands might change the
// operator accordingly.
function flattenDivision(node) {
  // We recurse on the left side of the tree to find operands so far
  // Flattening division is always considered part of a bigger picture
  // of multiplication, so we get operands with '*'
  let operands = getOperands(node.args[0], '*');

  if (operands.length === 1) {
    node.args[0] = operands.pop();
    node.args[1] = flattenOperands(node.args[1]);
    operands = [node];
  }
  else {
    // This is the last operand, the term we'll want to add our division to
    const numerator = operands.pop();
    // This is the denominator of the current division node we're recursing on
    const denominator = flattenOperands(node.args[1]);
    // Note that this means 2 * 3 * 4 / 5 / 6 * 7 will flatten but keep the 4/5/6
    // as an operand - in simplifyDivision.js this is changed to 4/(5*6)
    const divisionNode = Node.Creator.operator('/', [numerator, denominator]);
    operands.push(divisionNode);
  }

  return operands;
}

// Returns true if there is a * node nested in some division, with no other
// operators or parentheses between them.
// e.g. returns true: 2*3/4, 2 / 5 / 6 * 7 / 8
// e.g. returns false: 3/4/5, ((3*2) - 5) / 7, (2*5)/6
function hasMultiplicationBesideDivision(node) {
  if (!Node.Type.isOperator(node)) {
    return false;
  }
  if (node.op === '*') {
    return true;
  }
  // we ony recurse through division
  if (node.op !== '/') {
    return false;
  }
  return node.args.some(hasMultiplicationBesideDivision);
}

module.exports = flattenOperands;

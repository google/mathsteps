const {print, toTex} = require('math-parser');

const clone = require('./clone');
const flatten = require('./flattenOperands');
const Node = require('../node');

// Prints an expression node in asciimath
// If showPlusMinus is true, print + - (e.g. 2 + -3)
// If it's false (the default) 2 + -3 would print as 2 - 3
// (The + - is needed to support the conversion of subtraction to addition of
// negative terms. See flattenOperands for more details if you're curious.)

function printAscii(node, showPlusMinus=false) {
  // TODO(math-parser or porting): add smarter printing based off of what
  // we had here (can't keep it without adding paren logic)
  let string = print(node);
  if (!showPlusMinus) {
    string = string.replace(/\s*?\+\s*?\-\s*?/g, ' - ');
  }
  return string;
}

function printTreeTraversal(node, parentNode) {
  if (Node.PolynomialTerm.isPolynomialTerm(node)) {
    const polyTerm = new Node.PolynomialTerm(node);
    // This is so we don't print 2/3 x^2 as 2 / 3x^2
    // Still print x/2 as x/2 and not 1/2 x though
    if (polyTerm.hasFractionCoeff() && node.op !== '/') {
      const coeffTerm = polyTerm.getCoeffNode();
      const coeffStr = printTreeTraversal(coeffTerm);

      const nonCoeffTerm = Node.Creator.polynomialTerm(
        polyTerm.getSymbolNode(), polyTerm.exponent, null);
      const nonCoeffStr = printTreeTraversal(nonCoeffTerm);

      return `${coeffStr} ${nonCoeffStr}`;
    }
  }

  if (Node.Type.isIntegerFraction(node)) {
    return `${print(node.args[0])}/${print(node.args[1])}`;
  }

  if (Node.Type.isOperator(node)) {
    if (node.op === '/' && Node.Type.isOperator(node.args[1])) {
      return `${printTreeTraversal(node.args[0])} / (${printTreeTraversal(node.args[1])})`;
    }

    let opString = '';

    if (Node.Type.isOperator(node, '+')) {
      // add space between operator and operands
      opString = ' + ';
    }
    else if (Node.Type.isOperator(node, '*') && !node.implicit) {
      opString = ' * ';
    }
    else if (Node.Type.isOperator(node, '/')) {
      // no space for constant fraction divisions (slightly easier to read)
      if (Node.Type.isConstantFraction(node, true)) {
        opString = '/';
      }
      else {
        opString = ' / ';
      }
    }
    else if (Node.Type.isOperator(node, '^')) {
      // no space for exponents
      opString = '^';
    }

    let str = node.args.map(arg => printTreeTraversal(arg, node)).join(opString);

    // Need to add parens around any [+, -] operation
    // nested in [/, *, ^] operation
    // Check #120, #126 issues for more details.
    // { "/" [{ "+" ["x", "2"] }, "2"] } -> (x + 2) / 2.
    if (parentNode &&
        Node.Type.isOperator(parentNode) &&
        node.op && parentNode.op &&
        '*/^'.indexOf(parentNode.op) >= 0 &&
        '+-'.indexOf(node.op) >= 0) {
      str = `(${str})`;
    }

    return str;
  }
  else if (Node.Type.isParenthesis(node)) {
    return `(${printTreeTraversal(node.body)})`;
  }
  else if (Node.Type.isUnaryMinus(node)) {
    if (Node.Type.isOperator(node.args[0]) &&
        '*/^'.indexOf(node.args[0].op) === -1 &&
        !Node.PolynomialTerm.isPolynomialTerm(node)) {
      return `-(${printTreeTraversal(node.args[0])})`;
    }
    else {
      return `-${printTreeTraversal(node.args[0])}`;
    }
  }
  else {
    return print(node);
  }
}

// Prints an expression node in LaTeX
// (The + - is needed to support the conversion of subtraction to addition of
// negative terms. See flattenOperands for more details if you're curious.)
function printLatex(node, showPlusMinus=false) {
  let nodeTex = toTex(node);

  // TODO(math-parser): do we want to continue support of explicitly printing + - ?
  // TODO(math-parser): export toTex

  return nodeTex;
}

module.exports = {
  ascii: printAscii,
  latex: printLatex,
};

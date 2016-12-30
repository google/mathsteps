'use strict';

const Node = require('../node');

// Prints an expression node in asciimath
// If showPlusMinus is true, print + - (e.g. 2 + -3)
// If it's false (the default) 2 + -3 would print as 2 - 3
// (The + - is needed to support the conversion of subtraction to addition of
// negative terms. See flattenOperands for more details if you're curious.)
function print(node, showPlusMinus=false) {
  let string = printTreeTraversal(node);
  if (!showPlusMinus) {
    string = string.replace(/\s*?\+\s*?\-\s*?/g, ' - ');
  }
  return string;
}

function printTreeTraversal(node) {
  if (Node.PolynomialTerm.isPolynomialTerm(node)) {
    const polyTerm = new Node.PolynomialTerm(node);
    // This is so we don't print 2/3 x^2 as 2 / 3x^2
    // Still print x/2 as x/2 and not 1/2 x though
    if (polyTerm.hasFractionCoeff() && node.op !== '/') {
      const coeffTerm = polyTerm.getCoeffNode();
      const coeffStr = printTreeTraversal(coeffTerm);

      const nonCoeffTerm = Node.Creator.polynomialTerm(
        polyTerm.symbol, polyTerm.exponent, null);
      const nonCoeffStr = printTreeTraversal(nonCoeffTerm);

      return `${coeffStr} ${nonCoeffStr}`;
    }
  }
  if (Node.Type.isIntegerFraction(node)) {
    return `${node.args[0]}/${node.args[1]}`;
  }
  if (Node.Type.isOperator(node)) {
    if (node.op === '/' && Node.Type.isOperator(node.args[1])) {
      return `${printTreeTraversal(node.args[0])} / (${printTreeTraversal(node.args[1])})`;
    }

    let str = printTreeTraversal(node.args[0]);
    for (let i = 1; i < node.args.length; i++) {
      switch (node.op) {
      case '*':
        if (node.implicit) {
          break;
        }
        // add space between operator and operands
        str += ` ${node.op} `;
        break;
      case '+':
        // add space between operator and operands
        str += ` ${node.op} `;
        break;
      case '-':
        // add space between operator and operands
        str += ` ${node.op} `;
        break;
      case '/':
        // no space for constant fraction divisions (slightly easier to read)
        if (Node.Type.isConstantFraction(node, true)) {
          str += `${node.op}`;
        }
        else {
          str += ` ${node.op} `;
        }
        break;
      case '^':
        // no space for exponents
        str += `${node.op}`;
        break;
      }
      str += printTreeTraversal(node.args[i]);
    }
    return str;
  }
  else if (Node.Type.isParenthesis(node)) {
    return `(${printTreeTraversal(node.content)})`;
  }
  else if (Node.Type.isUnaryMinus(node)) {
    if (Node.Type.isOperator(node.args[0]) &&
        node.args[0].op !== '/' &&
        !Node.PolynomialTerm.isPolynomialTerm(node)) {
      return `-(${printTreeTraversal(node.args[0])})`;
    }
    else {
      return `-${printTreeTraversal(node.args[0])}`;
    }
  }
  else {
    return node.toString();
  }
}

module.exports = print;

'use strict';

const math = require('../../../index');

const Fraction = require('./Fraction');
const PolynomialTermNode = require('./PolynomialTermNode');
const NodeCreator = require('./NodeCreator');
const NodeType = require('./NodeType');

// Prints an expression node in asciimath
// If showPlusMinus is true, print + - (e.g. 2 + -3)
// If it's false (the default) 2 + -3 would print as 2 - 3
// (The + - is needed to support the conversion of subtraction to addition of
// negative terms. See flattenOperands for more details if you're curious.)
function print(node, showPlusMinus=false) {
  let string = printDFS(node);
  if (!showPlusMinus) {
    string = string.replace(/\s*?\+\s*?\-\s*?/g, ' - ');
  }
  return string;
}

function printDFS(node) {
  if (PolynomialTermNode.isPolynomialTerm(node)) {
    const polyTerm = new PolynomialTermNode(node);
    // This is so we don't print 2/3 x^2 as 2 / 3x^2
    // Still print x/2 as x/2 and not 1/2 x though
    if (polyTerm.hasFractionCoeff() && node.op !== '/') {
      const coeffTerm = polyTerm.getCoeffNode();
      const coeffStr = printDFS(coeffTerm);

      const nonCoeffTerm = NodeCreator.polynomialTerm(
        polyTerm.symbol, polyTerm.exponent, null);
      const nonCoeffStr = printDFS(nonCoeffTerm);

      return `${coeffStr} ${nonCoeffStr}`;
    }
  }
  if (NodeType.isIntegerFraction(node)) {
    return `${node.args[0]}/${node.args[1]}`;
  }
  if (NodeType.isOperator(node)) {
    if (node.op === '/' && NodeType.isOperator(node.args[1])) {
      return `${printDFS(node.args[0])} / (${printDFS(node.args[1])})`;
    }

    let str = printDFS(node.args[0]);
    for (let i = 1; i < node.args.length; i++) {
      switch (node.op) {
        case '*':
          if (node.implicit) {
            break;
          }
        case '+':
        case '-':
          // add space between operator and operands
          str += ` ${node.op} `;
          break;
        case '/':
          // no space for constant fraction divisions (slightly easier to read)
          if (NodeType.isConstantFraction(node, true)) {
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
      str += printDFS(node.args[i]);
    }
    return str;
  }
  else if (NodeType.isParenthesis(node)) {
      return `(${printDFS(node.content)})`;
  }
  else if (NodeType.isUnaryMinus(node)) {
    if (NodeType.isOperator(node.args[0]) &&
        node.args[0].op !== '/' &&
        !PolynomialTermNode.isPolynomialTerm(node)) {
      return `-(${printDFS(node.args[0])})`;
    }
    else {
      return `-${printDFS(node.args[0])}`;
    }
  }
  else {
    return node.toString();
  }
}

module.exports = print;

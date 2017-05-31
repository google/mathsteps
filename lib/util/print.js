const clone = require('./clone');
const flatten = require('./flattenOperands');
const Node = require('../node');

// Prints an expression node in asciimath
// If showPlusMinus is true, print + - (e.g. 2 + -3)
// If it's false (the default) 2 + -3 would print as 2 - 3
// (The + - is needed to support the conversion of subtraction to addition of
// negative terms. See flattenOperands for more details if you're curious.)
function print(node, showPlusMinus=false) {
  node = flatten(clone(node));

  let string = printTreeTraversal(node);
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
        polyTerm.symbol, polyTerm.exponent, null);
      const nonCoeffStr = printTreeTraversal(nonCoeffTerm);

      return `${coeffStr} ${nonCoeffStr}`;
    }
  }

  if (Node.Type.isIntegerFraction(node)) {
    return `${printTreeTraversal(node.args[0], node)}/${printTreeTraversal(node.args[1], node)}`;
  }

  if (Node.Type.isOperator(node)) {
    if (node.op === '/' && Node.Type.isOperator(node.args[1])) {
      return `${printTreeTraversal(node.args[0], node)} / ${printTreeTraversal(node.args[1], node)}`;
    }

    let opString = '';

    switch (node.op) {
    case '+':
    case '-':
      // add space between operator and operands
      opString = ` ${node.op} `;
      break;
    case '*':
      if (node.implicit) {
        break;
      }
      opString = ` ${node.op} `;
      break;
    case '/':
      // no space for constant fraction divisions (slightly easier to read)
      if (Node.Type.isConstantFraction(node, true)) {
        opString = `${node.op}`;
      }
      else {
        opString = ` ${node.op} `;
      }
      break;
    case '^':
      // no space for exponents
      opString = `${node.op}`;
      break;
    }

    let str = node.args.map(arg => printTreeTraversal(arg, node)).join(opString);

    // Need to add parens around any [+, -] operation
    // nested in [/, *, ^] operation
    // Check #120, #126 issues for more details.
    // { "/" [{ "+" ["x", "2"] }, "2"] } -> (x + 2) / 2.
    if (parentNode &&
        Node.Type.isOperator(parentNode) &&
        node.op && parentNode.op) {


        if ('*/^'.indexOf(parentNode.op) >= 0 && '+-'.indexOf(node.op) >= 0) {
          str = `(${str})`;
        } else if (parentNode.op === '^') {
          str = `(${str})`;
        } else if ('+-'.indexOf(parentNode.op) >= 0 && node.op === '+') {
          str = `(${str})`;
        } else if (node.op === '/' && parentNode.op === '/') {
          str = `(${str})`;
        }
    }

    return str;
  }
  else if (Node.Type.isParenthesis(node)) {
    return `(${printTreeTraversal(node.content)})`;
  }
  else if (Node.Type.isUnaryMinus(node)) {
    if (Node.Type.isOperator(node.args[0]) &&
        '*/^'.indexOf(node.args[0].op) === -1 &&
        !Node.PolynomialTerm.isPolynomialTerm(node)) {
      return `-(${printTreeTraversal(node.args[0], node)})`;
    }
    else {
      return `-${printTreeTraversal(node.args[0], node)}`;
    }
  }
  else if (node.type === 'SymbolNode') {
    return node.name;
  }
  else if (node.type === 'ConstantNode') {
    return node.value.toString();
  }
  else if (node.type === 'FunctionNode') {
    const args = node.args.map((arg) => printTreeTraversal(arg, node));
    return `${node.fn.name}(${args.join(', ')})`;
  }
  else {
    throw new Error(`'${node.type}' node not handled`);
  }
}

module.exports = print;

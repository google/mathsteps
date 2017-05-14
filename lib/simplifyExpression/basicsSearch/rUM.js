const ChangeTypes = require('../../ChangeTypes.js');
const Negative = require('../../Negative');
const Node = require('../../node');

// Removes unaryMinus from base depending on parity of exponent
// e.g Even: (-x)^2 -> x^2
// e.g Odd: (-x)^3 -> -x^3

function removeUnaryMinus(node) {
  if (node.op === '^'){
    const base = node.args[0].content;
    const exponent = node.args[1].value;
    const polyTerm = new Node.PolynomialTerm(base);
    const symbol = polyTerm.getSymbolNode();
    // Checks if the base has more than one arg and does not
    // contain a unaryMinus
    // e.g (-x + 2)^2 -> base has more than one arg
    // e.g (x)^2 -> base does not have unaryMinus
    if (base.args.length !== 1 || !(Node.Type.isUnaryMinus(base))){
      return Node.Status.noChange(node);
    }

    const exponentNode = Node.Creator.constant(parseFloat(exponent));

    // Two cases depending on parity of exponent (even and odd)
    if (exponent % 2 === 1){
      const baseNode = Negative.negate(symbol);
      const newNode = Node.Creator.polynomialTerm(baseNode, exponentNode);
      return Node.Status.nodeChanged(ChangeTypes.REMOVE_UNARY_MINUS, node, newNode);
    }
    else {
      const baseNode = Node.Creator.symbol(symbol.name);
      const newNode = Node.Creator.polynomialTerm(baseNode, exponentNode);
      return Node.Status.nodeChanged(ChangeTypes.REMOVE_UNARY_MINUS, node, newNode);
    }
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = removeUnaryMinus;

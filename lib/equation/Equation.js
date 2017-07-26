const math = require('mathjs');

const clone = require('../util/clone');
const printNode = require('../util/print');

// This represents an equation, made up of the leftNode (LHS), the
// rightNode (RHS) and a comparator (=, <, >, <=, or >=)
class Equation {
  constructor(leftNode, rightNode, comparator) {
    this.leftNode = leftNode;
    this.rightNode = rightNode;
    this.comparator = comparator;
  }

  // Prints an Equation properly using the print module
  print(showPlusMinus=false) {
    const leftSide = printNode(this.leftNode, showPlusMinus);
    const rightSide = printNode(this.rightNode, showPlusMinus);
    const comparator = this.comparator;

    return `${leftSide} ${comparator} ${rightSide}`;
  }

  // Prints an Equation properly using LaTeX
  printLatex(showPlusMinus=false) {
    // Creates the LaTeX
    function intoTex(node, showPlusMinus=false) {
      const originalNodeTex = node.toTex();

      let outputNodeTex;

      if (!showPlusMinus) {
        // Replaces '+-' with '-'
        outputNodeTex = originalNodeTex.replace(/\s*?\+\s*?\-\s*?/g, ' - ');
      }
      else {
        outputNodeTex = originalNodeTex;
      }

      // Replaces '2\cdot x' with '2x'
      return outputNodeTex.replace(/\s*?\\cdot\s*?({?)\s*?([a-zA-Z])\s*?(}?)/g,
        '$1$2$3');
    }

    const leftSide = intoTex(this.leftNode, showPlusMinus);
    const rightSide = intoTex(this.rightNode, showPlusMinus);
    const comparator = this.comparator;

    return `${leftSide} ${comparator} ${rightSide}`;
  }

  clone() {
    const newLeft = clone(this.leftNode);
    const newRight = clone(this.rightNode);
    return new Equation(newLeft, newRight, this.comparator);
  }
}

// Splits a string on the given comparator and returns a new Equation object
// from the left and right hand sides
Equation.createEquationFromString = function(str, comparator) {
  const sides = str.split(comparator);
  if (sides.length !== 2) {
    throw Error('Expected two sides of an equation using comparator: ' +
      comparator);
  }
  const leftNode = math.parse(sides[0]);
  const rightNode = math.parse(sides[1]);

  return new Equation(leftNode, rightNode, comparator);
};

module.exports = Equation;

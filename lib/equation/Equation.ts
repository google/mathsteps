import * as math from "mathjs";
import { printAscii, printLatex } from "../util/print";

// This represents an equation, made up of the leftNode (LHS), the
// rightNode (RHS) and a comparator (=, <, >, <=, or >=)
export class Equation {
  constructor(public leftNode, public rightNode, public comparator) {
    this.leftNode = leftNode;
    this.rightNode = rightNode;
    this.comparator = comparator;
  }

  // Prints an Equation properly using the print module
  ascii(showPlusMinus = false) {
    const leftSide = printAscii(this.leftNode, showPlusMinus);
    const rightSide = printAscii(this.rightNode, showPlusMinus);
    const comparator = this.comparator;

    return `${leftSide} ${comparator} ${rightSide}`;
  }

  // Prints an Equation properly using LaTeX
  latex(showPlusMinus = false) {
    const leftSide = printLatex(this.leftNode, showPlusMinus);
    const rightSide = printLatex(this.rightNode, showPlusMinus);
    const comparator = this.comparator;

    return `${leftSide} ${comparator} ${rightSide}`;
  }

  clone() {
    const newLeft = this.leftNode.cloneDeep();
    const newRight = this.rightNode.cloneDeep();
    return new Equation(newLeft, newRight, this.comparator);
  }

  // Splits a string on the given comparator and returns a new Equation object
  // from the left and right hand sides
  static createEquationFromString(str, comparator) {
    const sides = str.split(comparator);
    if (sides.length !== 2) {
      throw Error(
        "Expected two sides of an equation using comparator: " + comparator
      );
    }
    const leftNode = math.parse(sides[0]);
    const rightNode = math.parse(sides[1]);

    return new Equation(leftNode, rightNode, comparator);
  }
}

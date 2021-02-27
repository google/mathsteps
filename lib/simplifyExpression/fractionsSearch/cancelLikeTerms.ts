import { divideByGCD } from "./divideByGCD";

import { ChangeTypes } from "../../ChangeTypes";
import { Negative } from "../../Negative";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";
import { printAscii } from "../../util/print";
import { PolynomialTerm } from "../../node/PolynomialTerm";

// Used for cancelTerms to return a (possibly updated) numerator and denominator
class CancelOutStatus {
  constructor(
    private numerator,
    private denominator,
    private hasChanged = false
  ) {
    this.numerator = numerator;
    this.denominator = denominator;
    this.hasChanged = hasChanged;
  }
}

// Cancels like terms in a fraction node
// e.g. (2x^2 * 5) / 2x^2 => 5 / 1
// Returns a Status object
export function cancelLikeTerms(node) {
  if (!NodeType.isOperator(node) || node.op !== "/") {
    return NodeStatus.noChange(node);
  }

  let newNode = node.cloneDeep();
  const numerator = newNode.args[0];
  const denominator = newNode.args[1];

  // case 1: neither the numerator or denominator is a multiplication of terms
  if (
    !isMultiplicationOfTerms(numerator) &&
    !isMultiplicationOfTerms(denominator)
  ) {
    const cancelStatus = cancelTerms(numerator, denominator);

    if (cancelStatus.hasChanged) {
      newNode.args[0] = cancelStatus.numerator || NodeCreator.constant(1);
      if (cancelStatus.denominator) {
        newNode.args[1] = cancelStatus.denominator;
      } else {
        // If we cancelled out the denominator, the node is now its numerator
        // e.g. (2x*y) / 2x => y (note y isn't a fraction)
        newNode = newNode.args[0];
      }
      return NodeStatus.nodeChanged(ChangeTypes.CANCEL_TERMS, node, newNode);
    } else {
      return NodeStatus.noChange(node);
    }
  }

  // case 2: numerator is a multiplication of terms and denominator is not
  // e.g. (2x^2 * 5) / 2x^2 => 5 / 1
  // e.g. (x^2*y) / x  => x^(2 - 1) * y (<-- note that the denominator goes
  // away because we always adjust the exponent in the numerator)
  else if (
    isMultiplicationOfTerms(numerator) &&
    !isMultiplicationOfTerms(denominator)
  ) {
    const numeratorArgs = NodeType.isParenthesis(numerator)
      ? numerator.content.args
      : numerator.args;
    for (let i = 0; i < numeratorArgs.length; i++) {
      const cancelStatus = cancelTerms(numeratorArgs[i], denominator);
      if (cancelStatus.hasChanged) {
        if (cancelStatus.numerator) {
          numeratorArgs[i] = cancelStatus.numerator;
        }
        // if the cancelling out got rid of the numerator node, we remove it from
        // the list
        else {
          numeratorArgs.splice(i, 1);
          // if the numerator is now a "multiplication" of only one term,
          // change it to just that term
          if (numeratorArgs.length === 1) {
            newNode.args[0] = numeratorArgs[0];
          }
        }
        if (cancelStatus.denominator) {
          newNode.args[1] = cancelStatus.denominator;
        } else {
          // If we cancelled out the denominator, the node is now its numerator
          // e.g. (2x*y) / 2x => y (note y isn't a fraction)
          newNode = newNode.args[0];
        }
        return NodeStatus.nodeChanged(ChangeTypes.CANCEL_TERMS, node, newNode);
      }
    }
    return NodeStatus.noChange(node);
  }

  // case 3: denominator is a multiplication of terms and numerator is not
  // e.g. 2x^2 / (2x^2 * 5) => 1 / 5
  // e.g. x / (x^2*y) => x^(1-2) / y
  else if (
    isMultiplicationOfTerms(denominator) &&
    !isMultiplicationOfTerms(numerator)
  ) {
    const denominatorArgs = NodeType.isParenthesis(denominator)
      ? denominator.content.args
      : denominator.args;
    for (let i = 0; i < denominatorArgs.length; i++) {
      const cancelStatus = cancelTerms(numerator, denominatorArgs[i]);
      if (cancelStatus.hasChanged) {
        newNode.args[0] = cancelStatus.numerator || NodeCreator.constant(1);
        if (cancelStatus.denominator) {
          denominatorArgs[i] = cancelStatus.denominator;
        }
        // if the cancelling out got rid of the denominator node, we remove it
        // from the list
        else {
          denominatorArgs.splice(i, 1);
          // if the denominator is now a "multiplication" of only one term,
          // change it to just that term
          if (denominatorArgs.length === 1) {
            newNode.args[1] = denominatorArgs[0];
          }
        }
        return NodeStatus.nodeChanged(ChangeTypes.CANCEL_TERMS, node, newNode);
      }
    }
    return NodeStatus.noChange(node);
  }

  // case 4: the numerator and denominator are both multiplications of terms
  else {
    const numeratorArgs = NodeType.isParenthesis(numerator)
      ? numerator.content.args
      : numerator.args;
    const denominatorArgs = NodeType.isParenthesis(denominator)
      ? denominator.content.args
      : denominator.args;
    for (let i = 0; i < numeratorArgs.length; i++) {
      for (let j = 0; j < denominatorArgs.length; j++) {
        const cancelStatus = cancelTerms(numeratorArgs[i], denominatorArgs[j]);
        if (cancelStatus.hasChanged) {
          if (cancelStatus.numerator) {
            numeratorArgs[i] = cancelStatus.numerator;
          }
          // if the cancelling out got rid of the numerator node, we remove it
          // from the list
          else {
            numeratorArgs.splice(i, 1);
            // if the numerator is now a "multiplication" of only one term,
            // change it to just that term
            if (numeratorArgs.length === 1) {
              newNode.args[0] = numeratorArgs[0];
            }
          }
          if (cancelStatus.denominator) {
            denominatorArgs[j] = cancelStatus.denominator;
          }
          // if the cancelling out got rid of the denominator node, we remove it
          // from the list
          else {
            denominatorArgs.splice(j, 1);
            // if the denominator is now a "multiplication" of only one term,
            // change it to just that term
            if (denominatorArgs.length === 1) {
              newNode.args[1] = denominatorArgs[0];
            }
          }
          return NodeStatus.nodeChanged(
            ChangeTypes.CANCEL_TERMS,
            node,
            newNode
          );
        }
      }
    }
    return NodeStatus.noChange(node);
  }
}

// Given a term in the numerator and a term in the denominator, cancels out
// like terms if possible. See the cases below for possible things that can
// be cancelled out and how they are cancelled out.
// Returns the new nodes for numerator and denominator with the common terms
// removed. If the entire numerator or denominator is cancelled out, it is
// returned as null. e.g. 4, 4x => null, x
function cancelTerms(numerator, denominator) {
  // Deal with unary minuses by recursing on the argument
  if (NodeType.isUnaryMinus(numerator)) {
    const cancelStatus = cancelTerms(numerator.args[0], denominator);
    if (!cancelStatus.numerator) {
      numerator = NodeCreator.constant(-1);
    } else if (Negative.isNegative(cancelStatus.numerator)) {
      numerator = Negative.negate(cancelStatus.numerator);
    } else {
      numerator.args[0] = cancelStatus.numerator;
    }

    denominator = (cancelTerms as any).denominator; // FIXME DRN: what is happening here?
    return new CancelOutStatus(numerator, denominator, cancelStatus.hasChanged);
  }
  if (NodeType.isUnaryMinus(denominator)) {
    const cancelStatus = cancelTerms(numerator, denominator.args[0]);
    numerator = cancelStatus.numerator;
    if (cancelStatus.denominator) {
      denominator.args[0] = cancelStatus.denominator;
    } else {
      denominator = cancelStatus.denominator;
      if (numerator) {
        numerator = Negative.negate(numerator);
      } else {
        numerator = NodeCreator.constant(-1);
      }
    }
    return new CancelOutStatus(numerator, denominator, cancelStatus.hasChanged);
  }

  // Deal with parens similarily
  if (NodeType.isParenthesis(numerator)) {
    const cancelStatus = cancelTerms(numerator.content, denominator);
    if (cancelStatus.numerator) {
      numerator.content = cancelStatus.numerator;
    } else {
      // if the numerator was cancelled out, the numerator should be null
      // and not null in parens.
      numerator = cancelStatus.numerator;
    }
    denominator = cancelStatus.denominator;
    return new CancelOutStatus(numerator, denominator, cancelStatus.hasChanged);
  }
  if (NodeType.isParenthesis(denominator)) {
    const cancelStatus = cancelTerms(numerator, denominator.content);
    if (cancelStatus.denominator) {
      denominator.content = cancelStatus.denominator;
    } else {
      // if the denominator was cancelled out, the denominator should be null
      // and not null in parens.
      denominator = cancelStatus.denominator;
    }
    numerator = cancelStatus.numerator;
    return new CancelOutStatus(numerator, denominator, cancelStatus.hasChanged);
  }

  // Now for the term cancelling ----

  // case 1: the numerator term and denominator term are the same, so we cancel
  // them out. e.g. (x+5)^100 / (x+5)^100 => null / null
  if (printAscii(numerator) === printAscii(denominator)) {
    return new CancelOutStatus(null, null, true);
  }
  // case 2: they're both exponent nodes with the same base
  // e.g. (2x+5)^8 and (2x+5)^2
  if (
    NodeType.isOperator(numerator, "^") &&
    NodeType.isOperator(denominator, "^") &&
    printAscii(numerator.args[0]) === printAscii(denominator.args[0])
  ) {
    const numeratorExponent = numerator.args[1];
    let denominatorExponent = denominator.args[1];
    // wrap the denominatorExponent in parens, in case it's complicated.
    // If the parens aren't needed, they'll be removed with
    // removeUnnecessaryParens at the end of this step.
    denominatorExponent = NodeCreator.parenthesis(denominatorExponent);
    const newExponent = NodeCreator.parenthesis(
      NodeCreator.operator("-", [numeratorExponent, denominatorExponent])
    );
    numerator.args[1] = newExponent;
    return new CancelOutStatus(numerator, null, true);
  }
  // case 3: they're both polynomial terms, check if they have the same symbol
  // e.g. 4x^2 / 5x^2 => 4 / 5
  // e.g. 4x^3 / 5x^2 => 4x^(3-2) / 5
  // case 3.1: they're both polynomial terms with different symbols but with coefficients
  // e.g 20x / 40y => x / 2y
  // e.g 60x / 40y => 3x / 2y
  // e.g 4x / 2y => 2x / y
  if (
    PolynomialTerm.isPolynomialTerm(numerator) &&
    PolynomialTerm.isPolynomialTerm(denominator)
  ) {
    const numeratorTerm = new PolynomialTerm(numerator);
    const denominatorTerm = new PolynomialTerm(denominator);
    if (numeratorTerm.getSymbolName() !== denominatorTerm.getSymbolName()) {
      if (
        NodeType.isOperator(numerator, "*") &&
        NodeType.isOperator(denominator, "*")
      ) {
        // case 3.1
        return cancelCoeffs(numerator, denominator);
      } else {
        return new CancelOutStatus(numerator, denominator);
      }
    }
    const numeratorExponent = numeratorTerm.getExponentNode(true);
    let denominatorExponent = denominatorTerm.getExponentNode(true);
    if (printAscii(numeratorExponent) === printAscii(denominatorExponent)) {
      // note this returns null if there's no coefficient (ie it's 1)
      numerator = numeratorTerm.getCoeffNode();
    } else {
      // wrap the denominatorExponent in parens, in case it's complicated.
      // If the parens aren't needed, they'll be removed with
      // removeUnnecessaryParens at the end of this step.
      denominatorExponent = NodeCreator.parenthesis(denominatorExponent);
      const newExponent = NodeCreator.parenthesis(
        NodeCreator.operator("-", [numeratorExponent, denominatorExponent])
      );
      numerator = NodeCreator.polynomialTerm(
        numeratorTerm.getSymbolNode(),
        newExponent,
        numeratorTerm.getCoeffNode()
      );
    }
    denominator = denominatorTerm.getCoeffNode();
    return new CancelOutStatus(numerator, denominator, true);
  }

  // case 4: the numerator is a constant and denominator is a polynomial term that has a coefficient
  // or is multiplication node
  // e.g. 2 / 4x -> 1 / 2x
  // e.g. ignore cases like:  2 / a and 2 / x^2
  if (
    NodeType.isConstant(numerator) &&
    NodeType.isOperator(denominator, "*") &&
    PolynomialTerm.isPolynomialTerm(denominator)
  ) {
    const denominatorTerm = new PolynomialTerm(denominator);

    const coeff = denominatorTerm.getCoeffNode();
    const variable = denominatorTerm.getSymbolNode();
    const exponent = denominatorTerm.getExponentNode();

    // simplify a constant fraction (e.g 2 / 4)
    const frac = NodeCreator.operator("/", [numerator, coeff]);

    let newCoeff = coeff.cloneDeep();
    const reduceStatus = divideByGCD(frac);

    if (!reduceStatus.hasChanged()) {
      return new CancelOutStatus(numerator, denominator, false);
    }

    // Sometimes the fraction reduces to a constant e.g. 6 / 2 -> 3,
    // in which case `newCoeff` (the denominator coefficient) should be null
    if (NodeType.isConstant(reduceStatus.newNode)) {
      numerator = reduceStatus.newNode;
      newCoeff = null;
    } else {
      [numerator, newCoeff] = reduceStatus.newNode.args;
    }
    denominator = NodeCreator.polynomialTerm(variable, exponent, newCoeff);

    return new CancelOutStatus(numerator, denominator, true);
  }

  // case 5: both numerator and denominator are numbers within a more complicated fraction
  // e.g. (35 * nthRoot (7)) / (5 * nthRoot(5)) -> (7 * nthRoot(7)) / nthRoot(5)
  if (NodeType.isConstant(numerator) && NodeType.isConstant(denominator)) {
    const frac = NodeCreator.operator("/", [numerator, denominator]);
    const reduceStatus = divideByGCD(frac);
    if (!reduceStatus.hasChanged()) {
      return new CancelOutStatus(numerator, denominator, false);
    }
    if (NodeType.isConstant(reduceStatus.newNode)) {
      // Denominator is a factor of numerator (e.g 4 / 2 -> 2)
      return new CancelOutStatus(reduceStatus.newNode, null, true);
    }

    // Sometimes the fraction reduces to a constant e.g. 6 / 2 -> 3,
    // in which case `newCoeff` (the denominator coefficient) should be null
    if (NodeType.isConstant(reduceStatus.newNode)) {
      numerator = reduceStatus.newNode;
      denominator = null;
    } else {
      [numerator, denominator] = reduceStatus.newNode.args;
    }

    return new CancelOutStatus(numerator, denominator, true);
  }

  return new CancelOutStatus(numerator, denominator);
}

// Returns true if node is a multiplication of terms that can be cancelled out
// e.g. 2 * 6^y => true
// e.g. 2 + 6 => false
// e.g. (2 * 6^y) => true
// e.g. 2x^2 => false (polynomial terms are considered as one single term)
function isMultiplicationOfTerms(node) {
  if (NodeType.isParenthesis(node)) {
    return isMultiplicationOfTerms(node.content);
  }
  return (
    NodeType.isOperator(node, "*") && !PolynomialTerm.isPolynomialTerm(node)
  );
}

function cancelCoeffs(numerator, denominator) {
  const denominatorTerm = new PolynomialTerm(denominator);
  const numeratorTerm = new PolynomialTerm(numerator);

  const denominatorCoeff = denominatorTerm.getCoeffNode();
  const denominatorVariable = denominatorTerm.getSymbolNode();
  const denominatorExponent = denominatorTerm.getExponentNode();

  const numeratorCoeff = numeratorTerm.getCoeffNode();
  const numeratorVariable = numeratorTerm.getSymbolNode();
  const numeratorExponent = numeratorTerm.getExponentNode();

  // simplify a constant fraction (e.g 2 / 4)
  const frac = NodeCreator.operator("/", [numeratorCoeff, denominatorCoeff]);

  const reduceStatus = divideByGCD(frac);

  if (!reduceStatus.hasChanged()) {
    return new CancelOutStatus(numerator, denominator, false);
  }

  // Sometimes the fraction reduces to a constant e.g. 6 / 2 -> 3,
  // in which case the denominator coefficient should be null
  let newDenominatorCoeff = null;
  let newNumerator = null;
  if (NodeType.isConstant(reduceStatus.newNode)) {
    newNumerator = NodeCreator.polynomialTerm(
      numeratorVariable,
      numeratorExponent,
      reduceStatus.newNode
    );
    newDenominatorCoeff = null;
  } else {
    newNumerator = NodeCreator.polynomialTerm(
      numeratorVariable,
      numeratorExponent,
      reduceStatus.newNode.args[0]
    );
    newDenominatorCoeff = reduceStatus.newNode.args[1];
  }
  const newDenominator = NodeCreator.polynomialTerm(
    denominatorVariable,
    denominatorExponent,
    newDenominatorCoeff
  );

  return new CancelOutStatus(newNumerator, newDenominator, true);
}

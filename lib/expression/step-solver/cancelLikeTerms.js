'use strict';

const math = require('../../../index');

const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');
const prettyPrint = require('./prettyPrint');

// Cancels like terms in a fraction node
// e.g. (2x^2 * 5) / 2x^2 => 5 / 1
// Returns a NodeStatus object
function cancelLikeTerms(node) {
  if (!NodeType.isOperator(node) || node.op !== '/') {
    return new NodeStatus(node);
  }
  let numerator = node.args[0];
  let denominator = node.args[1];

  // case 1: neither the numerator or denominator is a multiplication of terms
  if (!isMultiplicationOfTerms(numerator) &&
      !isMultiplicationOfTerms(denominator)) {
    const cancelStatus = cancelTerms(numerator, denominator);
    if (cancelStatus.hasChanged) {
      node = updateNode(node, cancelStatus.numerator, cancelStatus.denominator);
      return new NodeStatus(node, true, MathChangeTypes.CANCEL_TERMS);
    }
    else {
      return new NodeStatus(node);
    }
  }

  // case 2: numerator is a multiplication of terms and denominator is not
  // e.g. (2x^2 * 5) / 2x^2 => 5 / 1
  // e.g. (x^2*y) / x  => x^(2 - 1) * y (<-- note that the denominator goes
  // away because we always adjust the exponent in the numerator)
  else if (isMultiplicationOfTerms(numerator) &&
      !isMultiplicationOfTerms(denominator)) {
    let numeratorArgs = NodeType.isParenthesis(numerator) ?
            numerator.content.args : numerator.args;
    for (let i = 0; i < numeratorArgs.length; i++) {
      const cancelStatus = cancelTerms(numeratorArgs[i], denominator);
      if (cancelStatus.hasChanged) {
        node = updateNode(node, cancelStatus.numerator,
                          cancelStatus.denominator, numeratorArgs, i);
        return new NodeStatus(node, true, MathChangeTypes.CANCEL_TERMS);
      }
    }
    return new NodeStatus(node);
  }

  // case 3: denominator is a multiplication of terms and numerator is not
  // e.g. 2x^2 / (2x^2 * 5) => 1 / 5
  // e.g. x / (x^2*y) => x^(1-2) / y
  else if (isMultiplicationOfTerms(denominator) &&
      !isMultiplicationOfTerms(numerator)) {
    let denominatorArgs = NodeType.isParenthesis(denominator) ?
            denominator.content.args : denominator.args;
    for (let i = 0; i < denominatorArgs.length; i++) {
      const cancelStatus = cancelTerms(numerator, denominatorArgs[i]);
      if (cancelStatus.hasChanged) {
        node = updateNode(
          node, cancelStatus.numerator, cancelStatus.denominator,
          null, -1, denominatorArgs, i);
        return new NodeStatus(node, true, MathChangeTypes.CANCEL_TERMS);
      }
    }
    return new NodeStatus(node);
  }

  // case 4: the numerator and denominator are both multiplications of terms
  else {
    let numeratorArgs = NodeType.isParenthesis(numerator) ?
      numerator.content.args : numerator.args;
    let denominatorArgs = NodeType.isParenthesis(denominator) ?
      denominator.content.args : denominator.args;
    for (let i = 0; i < numeratorArgs.length; i++) {
      for (let j = 0; j < denominatorArgs.length; j++) {
        const cancelStatus = cancelTerms(numeratorArgs[i], denominatorArgs[j]);
        if (cancelStatus.hasChanged) {
          node = updateNode(
            node, cancelStatus.numerator, cancelStatus.denominator,
            numeratorArgs, i, denominatorArgs, j);
          return new NodeStatus(node, true, MathChangeTypes.CANCEL_TERMS);
        }
      }
    }
    return new NodeStatus(node);
  }
}

// Updates a node given updated numerator and denominator values.
// This function is a helper for cancelLikeTerms that covers its 4 cases
// If numeratorArgs is not null, numeratorIndex >= 0 should be passed in as well
// and same for denominatorArgs and denominatorIndex.
// Returns a node
function updateNode(node, newNumerator, newDenominator,
                    numeratorArgs=null, numeratorIndex=-1,
                    denominatorArgs=null, denominatorIndex=-1) {
  const i = numeratorIndex;
  const j = denominatorIndex;

  // the numerator is either a list of arguments or a single node
  if (numeratorArgs) {
    if (newNumerator) {
      numeratorArgs[i] = newNumerator;
    }
    // if the cancelling out got rid of the numerator node, we remove it from
    // the list
    else {
      numeratorArgs.splice(i, 1);
      // if the numerator is now a "multiplication" of only one term,
      // change it to just that term
      if (numeratorArgs.length === 1) {
        node.args[0] = numeratorArgs[0];
      }
    }
  }
  else {
    // If we cancelled out the numerator, it should stay as 1
    // e.g. 2x/(2x*y) => 1/y
    node.args[0] = newNumerator || NodeCreator.constant(1);
  }

  // the denominator is either a list of arguments or a single node
  if (denominatorArgs) {
    if (newDenominator) {
      denominatorArgs[j] = newDenominator;
    }
    // if the cancelling out got rid of the denominator node, we remove it from
    // the list
    else {
      denominatorArgs.splice(j, 1);
      // if the denominator is now a "multiplication" of only one term,
      // change it to just that term
      if (denominatorArgs.length === 1) {
        node.args[1] = denominatorArgs[0];
      }
    }
  }
  else {
    if (newDenominator) {
      node.args[1] = newDenominator;
    }
    else {
      // If we cancelled out the denominator, the node is now its numerator
      // e.g. (2x*y) / 2x => y (note y isn't a fraction)
      node = node.args[0];
    }
  }

  return node;
}

// Used for cancelTerms to return a (possibly updated) numerator and denominator
class CancelOutStatus {
  constructor(numerator, denominator, hasChanged=false) {
    this.numerator = numerator;
    this.denominator = denominator;
    this.hasChanged = hasChanged;
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
    // if numerator and denominator are both unary minus, it cancels out
    if (NodeType.isUnaryMinus(denominator)) {
      numerator = cancelStatus.numerator;
    }
    else {
      numerator.args[0] = cancelStatus.numerator;
    }
    denominator = cancelTerms.denominator;
    return new CancelOutStatus(numerator, denominator, cancelStatus.hasChanged);
  }
  if (NodeType.isUnaryMinus(denominator)) {
    cancelStatus = cancelTerms(numerator, denominator.args[0]);
    // note: if the nuemrator was unary minus, it'd already be caught with the
    // above code block
    denominator.args[0] = cancelStatus.denominator;
    numerator = cancelTerms.numerator;
    return new CancelOutStatus(numerator, denominator, cancelStatus.hasChanged);
  }

  // Deal with parens similarily
  if (NodeType.isParenthesis(numerator)) {
    const cancelStatus = cancelTerms(numerator.content, denominator);
    numerator.content = cancelStatus.numerator;
    denominator = cancelStatus.denominator;
    return new CancelOutStatus(numerator, denominator, cancelStatus.hasChanged);
  }
  if (NodeType.isParenthesis(denominator)) {
    const cancelStatus = cancelTerms(numerator, denominator.content);
    if (cancelStatus.denominator) {
      denominator.content = cancelStatus.denominator;
    }
    else {
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
  if (prettyPrint(numerator) === prettyPrint(denominator)) {
    return new CancelOutStatus(null, null, true);
  }

  // case 2: they're both exponent nodes with the same base
  // e.g. (2x+5)^8 and (2x+5)^2
  if (NodeType.isOperator(numerator) && numerator.op === '^' &&
      NodeType.isOperator(denominator) && denominator.op === '^' &&
      prettyPrint(numerator.args[0]) === prettyPrint(denominator.args[0])) {
    const numeratorExponent = numerator.args[1];
    const denominatorExponent =  denominator.args[1];
    const newExponent = NodeCreator.parenthesis(
      NodeCreator.operator('-', [numeratorExponent, denominatorExponent]));
    numerator.args[1] = newExponent;
    return new CancelOutStatus(numerator, null, true);
  }

  // case 3: they're both polynomial terms, check if they have the same symbol
  // e.g. 4x^2 / 5x^2 => 4 / 5
  // e.g. 4x^3 / 5x^2 => 4x^(3-2) / 5
  if (PolynomialTermNode.isPolynomialTerm(numerator) &&
      PolynomialTermNode.isPolynomialTerm(denominator)) {
    const numeratorTerm = new PolynomialTermNode(numerator);
    const denominatorTerm = new PolynomialTermNode(denominator);
    if (numeratorTerm.getSymbolName() !== denominatorTerm.getSymbolName()) {
      return new CancelOutStatus(numerator, denominator);
    }
    const numeratorExponent = numeratorTerm.getExponentNode(true);
    const denominatorExponent =  denominatorTerm.getExponentNode(true);
    if (prettyPrint(numeratorExponent) === prettyPrint(denominatorExponent)) {
      // note this returns null if there's no coefficient (ie it's 1)
      numerator = numeratorTerm.getCoeffNode();
    }
    else {
      const newExponent = NodeCreator.parenthesis(
        NodeCreator.operator('-', [numeratorExponent, denominatorExponent])); // this might break if the denominator exponent is complex (I need to define complex) cause then we should wrap it in parens
      numerator = NodeCreator.polynomialTerm(
        numeratorTerm.getSymbolNode(),
        newExponent,
        numeratorTerm.getCoeffNode());
    }
    denominator = denominatorTerm.getCoeffNode();
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
  return (NodeType.isOperator(node) && node.op === '*' &&
          !PolynomialTermNode.isPolynomialTerm(node));
}

module.exports = cancelLikeTerms;

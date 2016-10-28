'use strict';

const math = require('../../../index');

const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');
const prettyPrint = require('./prettyPrint');


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
      node.args[0] = cancelStatus.numerator || NodeCreator.constant(1);
      if (cancelStatus.denominator) {
        node.args[1] = cancelStatus.denominator;
      }
      else {
        node = node.args[0];
      }
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
        // TODO: remove code duplication, but it feels so messy with all the cases
        if (cancelStatus.numerator) {
          numeratorArgs[i] = cancelStatus.numerator;
        }
        else {
          numeratorArgs.splice(i, 1);
          if (numeratorArgs.length === 1) {
            node.args[0] = numeratorArgs[0];
          }
        }

        if (cancelStatus.denominator) {
          node.args[1] = cancelStatus.denominator;
        }
        else {
          node = node.args[0];
        }
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
        node.args[0] = cancelStatus.numerator || NodeCreator.constant(1);
        if (cancelStatus.denominator) {
          denominatorArgs[i] = cancelStatus.denominator;
        }
        else {
          denominatorArgs.splice(i, 1);
          // if the denominator is now a "multiplication" of only one term,
          // change it to just that term
          if (denominatorArgs.length === 1) {
            node.args[1] = denominatorArgs[0];
          }
        }
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
          if (cancelStatus.denominator) {
            denominatorArgs[j] = cancelStatus.denominator;
          }
          else {
            denominatorArgs.splice(j, 1);
            if (denominatorArgs.length === 1) {
              node.args[1] = denominatorArgs[0];
            }
          }
          // TODO: remove code duplication
          if (cancelStatus.numerator) {
            numeratorArgs[i] = cancelStatus.numerator;
          }
          else {
            numeratorArgs.splice(i, 1);
            if (numeratorArgs.length === 1) {
              node.args[0] = numeratorArgs[0];
            }
          }
          return new NodeStatus(node, true, MathChangeTypes.CANCEL_TERMS);
        }
      }
    }
    return new NodeStatus(node);
  }
}

class CancelOutStatus {
  constructor(numerator, denominator, hasChanged=false) {
    this.numerator = numerator;
    this.denominator = denominator;
    this.hasChanged = hasChanged;
  }
}

// TODO: docstring
// note when the numerator and denominator might be null
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
    // if numerator and denominator are both unary minus, it cancels out
    if (NodeType.isUnaryMinus(numerator)) {
      denominator = cancelStatus.denominator;
    }
    else {
      denominator.args[0] = cancelStatus.denominator;
    }
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
    // if numerator and denominator are both unary minus, it cancels out
    if (cancelStatus.denominator) {
      denominator.content = cancelStatus.denominator;
    }
    else {
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

function isMultiplicationOfTerms(node) {
  if (NodeType.isParenthesis(node)) {
    return isMultiplicationOfTerms(node.content);
  }
  return (NodeType.isOperator(node) && node.op === '*' &&
          !PolynomialTermNode.isPolynomialTerm(node));
}


module.exports = cancelLikeTerms;

import { divideByGCD } from "./divideByGCD";
import { PolynomialTerm } from "../../node/PolynomialTerm";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";
import { arithmeticSearch } from "../arithmeticSearch/ArithmeticSearch";

// Simplifies a polynomial term with a fraction as its coefficients.
// e.g. 2x/4 --> x/2    10x/5 --> 2x
// Also simplified negative signs
// e.g. -y/-3 --> y/3   4x/-5 --> -4x/5
// returns the new simplified node in a Status object
export function simplifyPolynomialFraction(node) {
  if (!PolynomialTerm.isPolynomialTerm(node)) {
    return NodeStatus.noChange(node);
  }

  const polyNode = new PolynomialTerm(node.cloneDeep());
  if (!polyNode.hasFractionCoeff()) {
    return NodeStatus.noChange(node);
  }

  const coefficientSimplifications = [
    divideByGCD, // for integer fractions
    arithmeticSearch, // for decimal fractions
  ];

  for (let i = 0; i < coefficientSimplifications.length; i++) {
    const coefficientFraction = polyNode.getCoeffNode(); // a division node
    const newCoeffStatus = coefficientSimplifications[i](coefficientFraction);
    if (newCoeffStatus.hasChanged()) {
      // we need to reset change groups because we're creating a new node
      let newCoeff = NodeStatus.resetChangeGroups(newCoeffStatus.newNode);
      if (newCoeff.value === "1") {
        newCoeff = null;
      }
      const exponentNode = polyNode.getExponentNode();
      const newNode = NodeCreator.polynomialTerm(
        polyNode.getSymbolNode(),
        exponentNode,
        newCoeff
      );
      return NodeStatus.nodeChanged(newCoeffStatus.changeType, node, newNode);
    }
  }

  return NodeStatus.noChange(node);
}

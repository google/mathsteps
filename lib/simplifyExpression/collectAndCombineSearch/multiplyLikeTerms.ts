// Multiplies a list of nodes that are polynomial or constant power like terms.
// Returns a node.
// The polynomial nodes should *not* have coefficients. (multiplying
// coefficients is handled in collecting like terms for multiplication)
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { arithmeticSearch } from "../arithmeticSearch/ArithmeticSearch";
import { canMultiplyLikeTermConstantNodes } from "../../checks/canMultiplyLikeTermConstantNodes";
import { ChangeTypes } from "../../ChangeTypes";
import { multiplyFractionsSearch } from "../multiplyFractionsSearch";
import { canMultiplyLikeTermsNthRoots } from "../../checks/canMultiplyLikeTermsNthRoots";
import { getRadicandNode, getRootNode } from "../functionsSearch/nthRoot";
import { NodeCreator } from "../../node/Creator";
import { canMultiplyLikeTermPolynomialNodes } from "../../checks/canMultiplyLikeTermPolynomialNodes";
import { getBaseNode, getExponentNode } from "./ConstantOrConstantPower";
import { PolynomialTerm } from "../../node/PolynomialTerm";

export function multiplyLikeTerms(node, polynomialOnly = false) {
  if (!NodeType.isOperator(node)) {
    return NodeStatus.noChange(node);
  }
  let status;

  if (!polynomialOnly && !canMultiplyLikeTermConstantNodes(node)) {
    status = arithmeticSearch(node);
    if (status.hasChanged()) {
      status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
      return status;
    }

    status = multiplyFractionsSearch(node);
    if (status.hasChanged()) {
      status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
      return status;
    }
  }

  status = multiplyPolynomialTerms(node);
  if (status.hasChanged()) {
    status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
    return status;
  }

  status = multiplyNthRoots(node);
  if (status.hasChanged()) {
    return status;
  }

  return NodeStatus.noChange(node);
}

function multiplyNthRoots(node) {
  if (!canMultiplyLikeTermsNthRoots(node)) {
    return NodeStatus.noChange(node);
  }

  let newNode = node.cloneDeep();

  // Array of radicands of all the nthRoot terms being multiplied
  const radicands = node.args.map((term) => getRadicandNode(term));

  // Multiply them
  const newRadicandNode = NodeCreator.operator("*", radicands);

  // All the args at this point have the same root,
  // so we arbitrarily take the first one
  const firstArg = node.args[0];
  const rootNode = getRootNode(firstArg);

  newNode = NodeCreator.nthRoot(newRadicandNode, rootNode);

  return NodeStatus.nodeChanged(
    ChangeTypes.MULTIPLY_NTH_ROOTS,
    node,
    newNode,
    false
  );
}

function multiplyPolynomialTerms(node) {
  if (
    !canMultiplyLikeTermPolynomialNodes(node) &&
    !canMultiplyLikeTermConstantNodes(node)
  ) {
    return NodeStatus.noChange(node);
  }

  const substeps = [];
  let newNode = node.cloneDeep();

  // STEP 1: If any term has no exponent, make it have exponent 1
  // e.g. x -> x^1 (this is for pedagogy reasons)
  // (this step only happens under certain conditions and later steps might
  // happen even if step 1 does not)
  let status = addOneExponent(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // STEP 2: collect exponents to a single exponent sum
  // e.g. x^1 * x^3 -> x^(1+3)
  // e.g. 10^2 * 10^3 -> 10^(2+3)
  if (canMultiplyLikeTermConstantNodes(node)) {
    status = collectConstantExponents(newNode);
  } else {
    status = collectPolynomialExponents(newNode);
  }
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 3: add exponents together.
  // NOTE: This might not be a step if the exponents aren't all constants,
  // but this case isn't that common and can be caught in other steps.
  // e.g. x^(2+4+z)
  // TODO: handle fractions, combining and collecting like terms, etc, here
  const exponentSum = newNode.args[1].content;
  const sumStatus = arithmeticSearch(exponentSum);
  if (sumStatus.hasChanged()) {
    status = NodeStatus.childChanged(newNode, sumStatus, 1);
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  if (substeps.length === 1) {
    // possible if only step 2 happens
    return substeps[0];
  } else {
    return NodeStatus.nodeChanged(
      ChangeTypes.MULTIPLY_POLYNOMIAL_TERMS,
      node,
      newNode,
      true,
      substeps
    );
  }
}

// Given a product of polynomial or constant terms, changes any
// term with no exponent
// into a term with an explicit exponent of 1. This is for pedagogy, and
// makes the adding exponents step clearer.
// e.g. x^2 * x -> x^2 * x^1
// e.g. 10^2 * 10 -> 10^2 * 10^1
// Returns a Status object.
function addOneExponent(node) {
  const newNode = node.cloneDeep();
  let change = false;

  let changeGroup = 1;
  if (canMultiplyLikeTermConstantNodes(node)) {
    newNode.args.forEach((child, i) => {
      if (NodeType.isConstant(child)) {
        // true if child is a constant node, e.g 3
        const base = getBaseNode(child);
        const exponent = NodeCreator.constant(1);
        newNode.args[i] = NodeCreator.operator("^", [base, exponent]);

        newNode.args[i].changeGroup = changeGroup;
        node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"

        change = true;
        changeGroup++;
      }
    });
  } else {
    newNode.args.forEach((child, i) => {
      const polyTerm = new PolynomialTerm(child);
      if (!polyTerm.getExponentNode()) {
        newNode.args[i] = NodeCreator.polynomialTerm(
          polyTerm.getSymbolNode(),
          NodeCreator.constant(1),
          polyTerm.getCoeffNode()
        );

        newNode.args[i].changeGroup = changeGroup;
        node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"

        change = true;
        changeGroup++;
      }
    });
  }

  if (change) {
    return NodeStatus.nodeChanged(
      ChangeTypes.ADD_EXPONENT_OF_ONE,
      node,
      newNode,
      false
    );
  } else {
    return NodeStatus.noChange(node);
  }
}

// Given a product of constant terms, groups the exponents into a sum
// e.g. 10^2 * 10^3 -> 10^(2+3)
// Returns a Status object.
function collectConstantExponents(node) {
  // If we're multiplying constant nodes together, they all share the same
  // base. Get that from the first node.
  const baseNode = getBaseNode(node.args[0]);
  // The new exponent will be a sum of exponents (an operation, wrapped in
  // parens) e.g. 10^(3+4+5)
  const exponentNodeList = node.args.map(getExponentNode);
  const newExponent = NodeCreator.parenthesis(
    NodeCreator.operator("+", exponentNodeList)
  );
  const newNode = NodeCreator.operator("^", [baseNode, newExponent]);
  return NodeStatus.nodeChanged(
    ChangeTypes.COLLECT_CONSTANT_EXPONENTS,
    node,
    newNode
  );
}

// Given a product of polynomial terms, groups the exponents into a sum
// e.g. x^2 * x^3 * x^1 -> x^(2 + 3 + 1)
// Returns a Status object.
function collectPolynomialExponents(node) {
  const polynomialTermList = node.args.map((n) => new PolynomialTerm(n));

  // If we're multiplying polynomial nodes together, they all share the same
  // symbol. Get that from the first node.
  const symbolNode = polynomialTermList[0].getSymbolNode();

  // The new exponent will be a sum of exponents (an operation, wrapped in
  // parens) e.g. x^(3+4+5)
  const exponentNodeList = polynomialTermList.map((p) =>
    p.getExponentNode(true)
  );
  const newExponent = NodeCreator.parenthesis(
    NodeCreator.operator("+", exponentNodeList)
  );
  const newNode = NodeCreator.polynomialTerm(symbolNode, newExponent, null);
  return NodeStatus.nodeChanged(
    ChangeTypes.COLLECT_POLYNOMIAL_EXPONENTS,
    node,
    newNode
  );
}

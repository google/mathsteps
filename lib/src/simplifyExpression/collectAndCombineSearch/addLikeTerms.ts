import { evaluateConstantSum } from "./evaluateConstantSum";

import { ChangeTypes } from "../../ChangeTypes";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { PolynomialTerm } from "../../node/PolynomialTerm";
import { NthRootTerm } from "../../node/NthRootTerm";
import { NodeCreator } from "../../node/Creator";
import {
  canAddLikeTermNthRootNodes,
  canAddLikeTermPolynomialNodes,
} from "../../checks/canAddLikeTerms";

// If possible, adds together a list of nodes . Returns a Status object.
export function addLikeTerms(node, polynomialOnly = false) {
  if (!NodeType.isOperator(node)) {
    return NodeStatus.noChange(node);
  }
  let status;

  if (!polynomialOnly) {
    status = evaluateConstantSum(node);
    if (status.hasChanged) {
      return status;
    }
  }

  status = addLikePolynomialTerms(node);
  if (status.hasChanged) {
    return status;
  }

  status = addLikeNthRootTerms(node);
  if (status.hasChanged) {
    return status;
  }

  return NodeStatus.noChange(node);
}

// If possible, adds together a list of polynomial term nodes.
function addLikePolynomialTerms(node) {
  if (!canAddLikeTermPolynomialNodes(node)) {
    return NodeStatus.noChange(node);
  }

  return addLikeTermNodes(
    node,
    PolynomialTerm,
    ChangeTypes.ADD_POLYNOMIAL_TERMS
  );
}

// If possible, adds together a list of nth root term nodes.
function addLikeNthRootTerms(node) {
  if (!canAddLikeTermNthRootNodes(node)) {
    return NodeStatus.noChange(node);
  }

  return addLikeTermNodes(node, NthRootTerm, ChangeTypes.ADD_NTH_ROOTS);
}

// Helper function for adding together a list of nodes
// belonging to a subclass of Term
function addLikeTermNodes(node, termSubclass, changeType) {
  const substeps = [];
  let newNode = node.cloneDeep();

  // STEP 1: If any nodes have no coefficient, make it have coefficient 1
  // (this step only happens under certain conditions and later steps might
  // happen even if step 1 does not)
  let status = addPositiveOneCoefficient(newNode, termSubclass);
  if (status.hasChanged) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // STEP 2: If any nodes have a unary minus, make it have coefficient -1
  // (this step only happens under certain conditions and later steps might
  // happen even if step 2 does not)
  status = addNegativeOneCoefficient(newNode, termSubclass);
  if (status.hasChanged) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // STEP 3: group the coefficients in a sum
  status = groupCoefficientsForAdding(newNode, termSubclass);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 4: evaluate the sum (could include fractions)
  status = evaluateCoefficientSum(newNode);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  return NodeStatus.nodeChanged(changeType, node, newNode, true, substeps);
}

// Given a sum of like terms, changes any term with no coefficient
// into a term with an explicit coefficient of 1. This is for pedagogy, and
// makes the adding coefficients step clearer.
// e.g. 2x + x -> 2x + 1x
// Returns a Status object.
function addPositiveOneCoefficient(node, termSubclass) {
  const newNode = node.cloneDeep();
  let change = false;

  let changeGroup = 1;
  newNode.args.forEach((child, i) => {
    const term = new termSubclass(child);
    if (term.getCoeffValue() === 1) {
      newNode.args[i] = NodeCreator.term(
        term.getBaseNode(),
        term.getExponentNode(),
        NodeCreator.constant(1),
        true /* explicit coefficient */
      );

      newNode.args[i].changeGroup = changeGroup;
      node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"

      change = true;
      changeGroup++;
    }
  });

  if (change) {
    return NodeStatus.nodeChanged(
      ChangeTypes.ADD_COEFFICIENT_OF_ONE,
      node,
      newNode,
      false
    );
  } else {
    return NodeStatus.noChange(node);
  }
}

// Given a sum of like terms, changes any term with a unary minus
// coefficient into a term with an explicit coefficient of -1. This is for
// pedagogy, and makes the adding coefficients step clearer.
// e.g. 2x - x -> 2x - 1x
// Returns a Status object.
function addNegativeOneCoefficient(node, termSubclass) {
  const newNode = node.cloneDeep();
  let change = false;

  let changeGroup = 1;
  newNode.args.forEach((child, i) => {
    const term = new termSubclass(child);
    if (term.getCoeffValue() === -1) {
      newNode.args[i] = NodeCreator.term(
        term.getBaseNode(),
        term.getExponentNode(),
        term.getCoeffNode(),
        true /* explicit -1 coefficient */
      );

      node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"
      newNode.args[i].changeGroup = changeGroup;

      change = true;
      changeGroup++;
    }
  });

  if (change) {
    return NodeStatus.nodeChanged(
      ChangeTypes.UNARY_MINUS_TO_NEGATIVE_ONE,
      node,
      newNode,
      false
    );
  } else {
    return NodeStatus.noChange(node);
  }
}

// Given a sum of like terms, groups the coefficients
// e.g. 2x^2 + 3x^2 + 5x^2 -> (2+3+5)x^2
// Returns a Status object.
function groupCoefficientsForAdding(node, termSubclass) {
  let newNode = node.cloneDeep();

  const termList = newNode.args.map((n) => new termSubclass(n));
  const coefficientList = termList.map((term) => term.getCoeffNode(true));
  const sumOfCoefficents = NodeCreator.parenthesis(
    NodeCreator.operator("+", coefficientList)
  );
  // TODO: changegroups should also be on the before node, on all the
  // coefficients, but changegroups with term gets messy so let's tackle
  // that later.
  sumOfCoefficents.changeGroup = 1;

  // terms that can be added together must share the same base
  // name and exponent. Get that base and exponent from the first term
  const firstTerm = termList[0];
  const exponentNode = firstTerm.getExponentNode();
  const baseNode = firstTerm.getBaseNode();
  newNode = NodeCreator.term(baseNode, exponentNode, sumOfCoefficents);

  return NodeStatus.nodeChanged(
    ChangeTypes.GROUP_COEFFICIENTS,
    node,
    newNode,
    false
  );
}

// Given a node of the form (2 + 4 + 5)x -- ie the coefficients have been
// grouped for adding -- add the coefficients together to make a new coeffient
// that is a constant or constant fraction.
function evaluateCoefficientSum(node) {
  // the node is now always a * node with the left child the coefficent sum
  // e.g. (2 + 4 + 5) and the right node the symbol part e.g. x or y^2
  // so we want to evaluate args[0]
  const coefficientSum = node.cloneDeep().args[0];
  const childStatus = evaluateConstantSum(coefficientSum);
  return NodeStatus.childChanged(node, childStatus, 0);
}

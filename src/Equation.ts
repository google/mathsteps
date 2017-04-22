import * as nodeHelper from "../nodeHelper";
// This represents an equation, made up of the leftNode (LHS), the
// rightNode (RHS) and a comparator (=, <, >, <=, or >=)
export default class Equation {
    leftNode: mNode;
    rightNode: mNode;
    comparator: string;
  constructor(leftNode: mNode, rightNode: mNode, comparator: string) {
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

  clone() {
    const newLeft = clone(this.leftNode);
    const newRight = clone(this.rightNode);
    return new Equation(newLeft, newRight, this.comparator);
  }

// Splits a string on the given comparator and returns a new Equation object
// from the left and right hand sides
static createEquationFromString = function(str: string, comparator:string) {
  const sides = str.split(comparator);
  if (sides.length !== 2) {
    throw Error('Expected two sides of an equation using comparator: ' +
      comparator);
  }
  const leftNode = math.parse(sides[0]);
  const rightNode = math.parse(sides[1]);

  return new Equation(leftNode, rightNode, comparator);
};
}

// This represents the current equation we're solving.
// As we move step by step, an equation might be updated. Functions return this
// status object to pass on the updated equation and information on if/how it was
// changed.
class Status {
    changeType;
    oldEquation: Equation;
    newEquation: Equation;
    substeps;
  constructor(changeType, oldEquation: Equation, newEquation: Equation, substeps=[]) {
    if (!newEquation) {
      throw Error('new equation isn\'t defined');
    }
    if (changeType === undefined || typeof(changeType) !== 'string') {
      throw Error('changetype isn\'t valid');
    }

    this.changeType = changeType;
    this.oldEquation = oldEquation;
    this.newEquation = newEquation;
    this.substeps = substeps;
  }

  hasChanged() {
    return this.changeType !== ChangeTypes.NO_CHANGE;
  }

// A wrapper around the Status constructor for the case where equation
// hasn't been changed.
noChange(equation) {
  return new Status(ChangeTypes.NO_CHANGE, null, equation);
};

addLeftStep(equation, leftStep) {
  const substeps = [];
  leftStep.substeps.forEach(substep => {
    substeps.push(Status.addLeftStep(equation, substep));
  });
  let oldEquation = null;
  if (leftStep.oldNode) {
    oldEquation = equation.clone();
    oldEquation.leftNode = leftStep.oldNode;
  }
  const newEquation = equation.clone();
  newEquation.leftNode = leftStep.newNode;
  return new Status(
    leftStep.changeType, oldEquation, newEquation, substeps);
};

addRightStep(equation: Equation, rightStep) {
  const substeps = [];
  rightStep.substeps.forEach(substep => {
    substeps.push(Status.addRightStep(equation, substep));
  });
  let oldEquation = null;
  if (rightStep.oldNode) {
    oldEquation = equation.clone();
    oldEquation.rightNode = rightStep.oldNode;
  }
  const newEquation = equation.clone();
  newEquation.rightNode = rightStep.newNode;
  return new Status(
    rightStep.changeType, oldEquation, newEquation, substeps);
};

resetChangeGroups(equation) {
  const leftNode = nodeHelper.Status.resetChangeGroups(equation.leftNode);
  const rightNode = nodeHelper.Status.resetChangeGroups(equation.rightNode);
  return new Equation(leftNode, rightNode, equation.comparator);
};
}

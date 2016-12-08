'use strict';

const Equation = require('./Equation');
const MathChangeTypes = require('./MathChangeTypes');
const NodeStatus = require('./NodeStatus');

// This represents the current equation we're solving.
// As we move step by step, an equation might be updated. Functions return this
// status object to pass on the updated equation and information on if/how it was
// changed.
class EquationStatus {
  constructor(changeType, oldEquation, newEquation, substeps=[]) {
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
    return this.changeType !== MathChangeTypes.NO_CHANGE;
  }
}

// A wrapper around the EquationStatus constructor for the case where equation
// hasn't been changed.
EquationStatus.noChange = function(equation) {
  return new EquationStatus(MathChangeTypes.NO_CHANGE, null, equation);
};

EquationStatus.addLeftStep = function(equation, leftStep) {
  const substeps = [];
  leftStep.substeps.forEach(substep => {
    substeps.push(EquationStatus.addLeftStep(equation, substep));
  });
  let oldEquation = null;
  if (leftStep.oldNode) {
    oldEquation = equation.clone();
    oldEquation.leftNode = leftStep.oldNode;
  }
  const newEquation = equation.clone();
  newEquation.leftNode = leftStep.newNode;
  return new EquationStatus(
    leftStep.changeType, oldEquation, newEquation, substeps);
};

EquationStatus.addRightStep = function(equation, rightStep) {
  const substeps = [];
  rightStep.substeps.forEach(substep => {
    substeps.push(EquationStatus.addRightStep(equation, substep));
  });
  let oldEquation = null;
  if (rightStep.oldNode) {
    oldEquation = equation.clone();
    oldEquation.rightNode = rightStep.oldNode;
  }
  const newEquation = equation.clone();
  newEquation.rightNode = rightStep.newNode;
  return new EquationStatus(
    rightStep.changeType, oldEquation, newEquation, substeps);
};

EquationStatus.resetChangeGroups = function(equation) {
  const leftNode = NodeStatus.resetChangeGroups(equation.leftNode);
  const rightNode = NodeStatus.resetChangeGroups(equation.rightNode);
  return new Equation(leftNode, rightNode, equation.comparator);
};

module.exports = EquationStatus;

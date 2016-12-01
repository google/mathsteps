'use strict';

const MathChangeTypes = require('./MathChangeTypes');

// This represents the current equation we're solving.
// As we move step by step, an equation might be updated. Functions return this
// status object to pass on the updated equation and information on if/how it was
// changed.
// EquationStatus(equation) creates a EquationStatus object that signals no change
class EquationStatus {
  constructor(equation, changeType=MathChangeTypes.NO_CHANGE, substeps=[]) {
    this.equation = equation;
    if (changeType === undefined || typeof(changeType) !== 'string') {
      throw Error('changetype isn\'t valid');
    }
    this.changeType = changeType;
    this.substeps = substeps;
  }

  hasChanged() {
    return this.changeType !== MathChangeTypes.NO_CHANGE;
  }
}

EquationStatus.addLeftStep = function(equation, leftStep) {
  const substeps = [];
  leftStep.subSteps.forEach(substep => {
    substeps.push(EquationStatus.addLeftStep(equation, substep));
  });
  equation.leftNode = leftStep.newNode;
  return new EquationStatus(equation, leftStep.changeType, substeps);
}

EquationStatus.addRightStep = function(equation, rightStep) {
  const substeps = [];
  rightStep.subSteps.forEach(substep => {
    substeps.push(EquationStatus.addRightStep(equation, substep));
  });
  equation.rightNode = rightStep.newNode;
  return new EquationStatus(equation, rightStep.changeType, substeps);
}

module.exports = EquationStatus;

'use strict';

const MathChangeTypes = require('./MathChangeTypes');

// This represents the current equation we're solving.
// As we move step by step, an equation might be updated. Functions return this
// status object to pass on the updated equation and information on if/how it was
// changed.
// EquationStatus(equation) creates a EquationStatus object that signals no change
class EquationStatus {
  constructor(equation, changeType=MathChangeTypes.NO_CHANGE) {
    this.equation = equation;
    if (changeType === undefined || typeof(changeType) !== "string") {
      throw Error("changetype isn't valid");
    }
    this.changeType = changeType;
  }

  hasChanged() {
    return this.changeType !== MathChangeTypes.NO_CHANGE;
  }
};

module.exports = EquationStatus;

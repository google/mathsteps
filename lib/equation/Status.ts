import { ChangeTypes } from "../ChangeTypes";
import { NodeStatus } from "../node/NodeStatus";
import { Equation } from "./Equation";

/**
 * This represents the current equation we're solving.
 * As we move step by step, an equation might be updated. Functions return this
 * status object to pass on the updated equation and information on if/how it was
 * changed.
 * */
export class EquationStatus {
  constructor(
    private changeType,
    private oldEquation,
    private newEquation,
    private substeps = []
  ) {
    if (!newEquation) {
      throw Error("new equation isn't defined");
    }
    if (changeType === undefined || typeof changeType !== "string") {
      throw Error("changetype isn't valid");
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
  static noChange(equation) {
    return new EquationStatus(ChangeTypes.NO_CHANGE, null, equation);
  }

  static addLeftStep(equation, leftStep) {
    const substeps = [];
    leftStep.substeps.forEach((substep) => {
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
      leftStep.changeType,
      oldEquation,
      newEquation,
      substeps
    );
  }

  static addRightStep(equation, rightStep) {
    const substeps = [];
    rightStep.substeps.forEach((substep) => {
      substeps.push(this.addRightStep(equation, substep));
    });
    let oldEquation = null;
    if (rightStep.oldNode) {
      oldEquation = equation.clone();
      oldEquation.rightNode = rightStep.oldNode;
    }
    const newEquation = equation.clone();
    newEquation.rightNode = rightStep.newNode;
    return new EquationStatus(
      rightStep.changeType,
      oldEquation,
      newEquation,
      substeps
    );
  }

  static resetChangeGroups(equation) {
    const leftNode = NodeStatus.resetChangeGroups(equation.leftNode);
    const rightNode = NodeStatus.resetChangeGroups(equation.rightNode);
    return new Equation(leftNode, rightNode, equation.comparator);
  }
}

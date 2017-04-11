import ChangeTypes = require("../ChangeTypes");
import Equation = require("./Equation");
import mathNode = require("../mathNode");

// This represents the current equation we're solving.
// As we move step by step, an equation might be updated. Functions return this
// status object to pass on the updated equation and information on if/how it was
// changed.
class Status {
    constructor(changeType, oldEquation: Equation, newEquation: Equation, substeps=[]) {
        if (!newEquation) {
            throw Error("new equation isn't defined");
        }
        if (changeType === undefined || typeof(changeType) !== "string") {
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
    static noChange = equation => new Status(ChangeTypes.NO_CHANGE, null, equation);
    static addLeftStep = (equation, leftStep) => {
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
            leftStep.changeType,
            oldEquation,
            newEquation,
            substeps);
    };

    static addRightStep = (equation, rightStep) => {
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
            rightStep.changeType,
            oldEquation,
            newEquation,
            substeps);
    };

    static resetChangeGroups = equation => {
        const leftNode = mathNode.Status.resetChangeGroups(equation.leftNode);
        const rightNode = mathNode.Status.resetChangeGroups(equation.rightNode);
        return new Equation(leftNode, rightNode, equation.comparator);
    };
    changeType;
    oldEquation: Equation;
    newEquation: Equation;
    substeps: typeof undefined[];
}

export = Status;

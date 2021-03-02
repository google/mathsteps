import { ChangeTypes } from "../ChangeTypes";
import { NodeType } from "./NodeType";
import {StepNode} from './StepNode';

/**
 * This represents the current (sub)expression we're simplifying.
 * As we move step by step, a node might be updated. Functions return this
 * status object to pass on the updated node and information on if/how it was
 * changed.
 * Status(node) creates a Status object that signals no change
 * */
export class NodeStatus {
  constructor(
    public changeType,
    private oldNode,
    public newNode,
    public substeps = []
  ) {
    if (!newNode) {
      throw Error("node is not defined");
    }
    if (changeType === undefined || typeof changeType !== "string") {
      throw Error("changetype isn't valid");
    }

    this.changeType = changeType;
    this.oldNode = oldNode;
    this.newNode = newNode;
    this.substeps = substeps;
  }

  hasChanged() {
    return this.changeType !== ChangeTypes.NO_CHANGE;
  }

  static resetChangeGroups(node) {
    node = node.cloneDeep();
    node
      .filter((node) => node.changeGroup)
      .forEach((change) => {
        delete change.changeGroup;
      });
    return node;
  }

  /**
   * A wrapper around the Status constructor for the case where node hasn't
   * been changed.
   * */
  static noChange(node: StepNode) {
    return new NodeStatus(ChangeTypes.NO_CHANGE, null, node);
  }

  /**
   * A wrapper around the Status constructor for the case of a change
   * that is happening at the level of oldNode + newNode
   * e.g. 2 + 2 --> 4 (an addition node becomes a constant node)
   * */
  static nodeChanged(
    changeType,
    oldNode,
    newNode,
    defaultChangeGroup = true,
    steps = []
  ) {
    if (defaultChangeGroup) {
      oldNode.changeGroup = 1;
      newNode.changeGroup = 1;
    }

    return new NodeStatus(changeType, oldNode, newNode, steps);
  }

  /**
   * A wrapper around the Status constructor for the case where there was
   * a change that happened deeper `node`'s tree, and `node`'s children must be
   * updated to have the newNode/oldNode metadata (changeGroups)
   * e.g. (2 + 2) + x --> 4 + x has to update the left argument
   * */
  static childChanged(node, childStatus, childArgIndex = null) {
    const oldNode = node.cloneDeep();
    const newNode = node.cloneDeep();
    let substeps = childStatus.substeps;

    if (!childStatus.oldNode) {
      throw Error(
        "Expected old node for changeType: " + childStatus.changeType
      );
    }

    function updateSubsteps(substeps, fn) {
      substeps.map((step) => {
        step = fn(step);
        step.substeps = updateSubsteps(step.substeps, fn);
      });
      return substeps;
    }

    if (NodeType.isParenthesis(node)) {
      oldNode.content = childStatus.oldNode;
      newNode.content = childStatus.newNode;
      substeps = updateSubsteps(substeps, (step) => {
        const oldNode = node.cloneDeep();
        const newNode = node.cloneDeep();
        oldNode.content = step.oldNode;
        newNode.content = step.newNode;
        step.oldNode = oldNode;
        step.newNode = newNode;
        return step;
      });
    } else if (
      NodeType.isOperator(node) ||
      (NodeType.isFunction(node) && childArgIndex !== null)
    ) {
      oldNode.args[childArgIndex] = childStatus.oldNode;
      newNode.args[childArgIndex] = childStatus.newNode;
      substeps = updateSubsteps(substeps, (step) => {
        const oldNode = node.cloneDeep();
        const newNode = node.cloneDeep();
        oldNode.args[childArgIndex] = step.oldNode;
        newNode.args[childArgIndex] = step.newNode;
        step.oldNode = oldNode;
        step.newNode = newNode;
        return step;
      });
    } else if (NodeType.isUnaryMinus(node)) {
      oldNode.args[0] = childStatus.oldNode;
      newNode.args[0] = childStatus.newNode;
      substeps = updateSubsteps(substeps, (step) => {
        const oldNode = node.cloneDeep();
        const newNode = node.cloneDeep();
        oldNode.args[0] = step.oldNode;
        newNode.args[0] = step.newNode;
        step.oldNode = oldNode;
        step.newNode = newNode;
        return step;
      });
    } else {
      throw Error("Unexpected node type: " + NodeType);
    }

    return new NodeStatus(childStatus.changeType, oldNode, newNode, substeps);
  }
}

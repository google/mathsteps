'use strict';

const MathChangeTypes = require('./MathChangeTypes');
const NodeType = require('./NodeType');


// This represents the current (sub)expression we're simplifying.
// As we move step by step, a node might be updated. Functions return this
// status object to pass on the updated node and information on if/how it was
// changed.
// NodeStatus(node) creates a NodeStatus object that signals no change
class NodeStatus {
  constructor(changeType, oldNode, newNode) {
    if (!newNode) {
      throw Error('node is not defined');
    }
    this.newNode = newNode;

    if (changeType === undefined || typeof(changeType) !== "string") {
      throw Error("changetype isn't valid");
    }
    this.changeType = changeType;
    this.oldNode = oldNode;
  }

  hasChanged() {
    return this.changeType !== MathChangeTypes.NO_CHANGE;
  }

  resetchangeGroups() {
    this.oldNode = null;
    this.newNode.filter(node => node.changeGroup).forEach(change => {
      delete change.changeGroup;
    });
  }
};

// A wrapper around the NodeStatus constructor for the case where node hasn't
// been changed.
NodeStatus.noChange = function(node) {
  return new NodeStatus(MathChangeTypes.NO_CHANGE, null, node);
}

// A wrapper around the NodeStatus constructor for the case of a change
// that is happening at the level of oldNode + newNode
// e.g. 2 + 2 --> 4 (an addition node becomes a constant node)
NodeStatus.nodeChanged = function(
  changeType, oldNode, newNode, defaultChangeGroup=true) {
  if (defaultChangeGroup) {
    oldNode.changeGroup = 1;
    newNode.changeGroup = 1;
  }
  return new NodeStatus(changeType, oldNode, newNode);
}

// A wrapper around the NodeStatus constructor for the case where there was
// a change that happened deeper `node`'s tree, and `node`'s children must be
// updated to have the newNode/oldNode metadata (changeGroups)
// e.g. (2 + 2) + x --> 4 + x has to update the left argument
NodeStatus.childChanged = function(node, childStatus, childArgIndex=null) {
  let oldNode = node.clone();
  let newNode = node.clone();
  if (node.implicit) { // hack while clone() is buggy and doesn't transfer implicit :(
    oldNode.implicit = true;
    newNode.implicit = true;
  }

  if (!childStatus.oldNode) {
    throw Error ('Expected old node for changeType: ' + childStatus.changeType);
  }

  if (NodeType.isParenthesis(node)) {
    newNode.content = childStatus.newNode;
    oldNode.content = childStatus.oldNode;
  }
  else if ((NodeType.isOperator(node) || NodeType.isFunction(node) &&
            childArgIndex !== null)) {
    newNode.args[childArgIndex] = childStatus.newNode;
    oldNode.args[childArgIndex] = childStatus.oldNode
  }
  else if (NodeType.isUnaryMinus(node)) {
    newNode.args[0] = childStatus.newNode;
    oldNode.args[0] = childStatus.oldNode
  }
  else {
    throw Error('Unexpected node type: ' + node.type);
  }

  return new NodeStatus(childStatus.changeType, oldNode, newNode);
}

module.exports = NodeStatus;

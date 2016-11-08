'use strict';

const MathChangeTypes = require('./MathChangeTypes');

// This represents the current (sub)expression we're simplifying.
// As we move step by step, a node might be updated. Functions return this
// status object to pass on the updated node and information on if/how it was
// changed.
// NodeStatus(node) creates a NodeStatus object that signals no change
class NodeStatus {
  constructor(node, changeType=MathChangeTypes.NO_CHANGE) {
    if (changeType === MathChangeTypes.NO_CHANGE) {
        this.hasChanged = false;
    }
    else {
        this.hasChanged = true;
    }
    this.node = node;
    if (changeType === undefined || typeof(changeType) !== "string") {
        throw Error("changetype isn't valid");
    }
    this.changeType = changeType;
  }
};

module.exports = NodeStatus;

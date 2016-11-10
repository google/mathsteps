'use strict';

const MathChangeTypes = require('./MathChangeTypes');
const NodeType = require('./NodeType');


// This represents the current (sub)expression we're simplifying.
// As we move step by step, a node might be updated. Functions return this
// status object to pass on the updated node and information on if/how it was
// changed.
// NodeStatus(node) creates a NodeStatus object that signals no change
class NodeStatus {
  constructor(node, changeType=MathChangeTypes.NO_CHANGE,
              beforeChangeNode=null, childNodeStatus=null, index=null) {
    this.node = node;
    if (changeType === undefined || typeof(changeType) !== "string") {
      throw Error("changetype isn't valid");
    }
    this.changeType = changeType;

    this.beforeChangeNode = beforeChangeNode;
    if (childNodeStatus && childNodeStatus.beforeChangeNode) {
      if (NodeType.isParenthesis(node)) {
        this.beforeChangeNode = node.clone();
        this.beforeChangeNode.content = childNodeStatus.beforeChangeNode;
      }
      else if (NodeType.isOperator(node) && index !== null) {
        this.beforeChangeNode = node.clone();
        this.beforeChangeNode.args[index] = childNodeStatus.beforeChangeNode;
      }
      else if (NodeType.isUnaryMinus(node)) {
        this.beforeChangeNode = node.clone();
        this.beforeChangeNode.args[0] = childNodeStatus.beforeChangeNode;
      }
    }
  }

  hasChanged() {
    return this.changeType !== MathChangeTypes.NO_CHANGE;
  }

  resetChangeBlocks() {
    this.beforeChangeNode = null;
    this.node.filter(node => node.changeBlock).forEach(change => {
      delete change.changeBlock;
    });
  }
};

module.exports = NodeStatus;

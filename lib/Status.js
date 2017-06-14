import * as ChangeTypes from './ChangeTypes.js';
import {query} from 'math-nodes';
//import clone from './util/clone.js';

function clone (node){
  return JSON.parse(JSON.stringify(node));
}


// This represents the current (sub)expression we're simplifying.
// As we move step by step, a node might be updated. Functions return this
// status object to pass on the updated node and information on if/how it was
// changed.
// Status(node) creates a Status object that signals no change
export class Status {
  constructor(changeType, oldNode, newNode, substeps=[]) {
    if (!newNode) {
      throw Error('node is not defined');
    }
    if (changeType === undefined || typeof(changeType) !== 'string') {
      throw Error('changetype isn\'t valid');
    }

    this.changeType = changeType;
    this.oldNode = oldNode;
    this.newNode = newNode;
    this.substeps = substeps;
  }

  hasChanged() {
    return this.changeType !== ChangeTypes.NO_CHANGE;
  }
}

Status.resetChangeGroups = function(node) {
  node = clone(node);
  const resetChangeGroups = ast =>
        traverse(ast, {
          leave(node) {
            if (node.changeGroup) {
              node.changeGroup.forEach(change => delete change.changeGroup)
            }
          }
        })
  return node;
};

// A wrapper around the Status constructor for the case where node hasn't
// been changed.
Status.noChange = function(node) { 
  return new Status(ChangeTypes.NO_CHANGE, null, node);
};

// A wrapper around the Status constructor for the case of a change
// that is happening at the level of oldNode + newNode
// e.g. 2 + 2 --> 4 (an addition node becomes a constant node)
Status.nodeChanged = function(
  changeType, oldNode, newNode, defaultChangeGroup=true, steps=[]) {
  if (defaultChangeGroup) {
    oldNode.changeGroup = 1;
    newNode.changeGroup = 1; 
  }

  return new Status(changeType, oldNode, newNode, steps);
};

// A wrapper around the Status constructor for the case where there was
// a change that happened deeper `node`'s tree, and `node`'s children must be
// updated to have the newNode/oldNode metadata (changeGroups)
// e.g. (2 + 2) + x --> 4 + x has to update the left argument
Status.childChanged = function(node, childStatus, childArgIndex=null) {
  //console.log(childStatus);
  const oldNode = clone(node);
  const newNode = clone(node);
    let substeps = childStatus.substeps; 

    if (!childStatus.oldNode) {
        console.log(childStatus)
    throw Error ('Expected old node for changeType: ' + childStatus.changeType);
  }

  function updateSubsteps(substeps, fn) {
    substeps.map((step) => {
      step = fn(step);
      step.substeps = updateSubsteps(step.substeps, fn);
    });
    return substeps;
  }

  if (node.type == 'Parentheses') {
    oldNode.content = childStatus.oldNode;
    newNode.content = childStatus.newNode;
    substeps = updateSubsteps(substeps, (step) => {
      const oldNode = clone(node);
      const newNode = clone(node);
      oldNode.content = step.oldNode;
      newNode.content = step.newNode;
      step.oldNode = oldNode;
      step.newNode = newNode;
      return step;
    });
  }
  else if ((query.isOperation(node) || query.isFunction(node) &&
            childArgIndex !== null)) {
    oldNode.args[childArgIndex] = childStatus.oldNode;
    newNode.args[childArgIndex] = childStatus.newNode;
    substeps = updateSubsteps(substeps, (step) => {
      const oldNode = clone(node);
      const newNode = clone(node);
      oldNode.args[childArgIndex] = step.oldNode;
      newNode.args[childArgIndex] = step.newNode;
      step.oldNode = oldNode;
      step.newNode = newNode;
      return step;
    });
  }
  else if (query.isUnaryMinus(node)) {
    oldNode.args[0] = childStatus.oldNode;
    newNode.args[0] = childStatus.newNode;
    substeps = updateSubsteps(substeps, (step) => {
      const oldNode = clone(node);
      const newNode = clone(node);
      oldNode.args[0] = step.oldNode;
      newNode.args[0] = step.newNode;
      step.oldNode = oldNode;
      step.newNode = newNode;
      return step;
    });
  }
  else {
    throw Error('Unexpected node type: ' + node.type);
  }

  return new Status(childStatus.changeType, oldNode, newNode, substeps);
};



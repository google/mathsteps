// Collects and combines like terms

const clone = require('../../util/clone');
const {apply} = require('../../apply');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');
const ChangeTypes = require('../../ChangeTypes');
const add = require('./addPolynomialTerms');
const collect = require('./collectLikeTerms');
const {multiplyLikeTerms} = require('./multiplyPolynomials');
//const rearrangeTerms = require('./rearrangeTerms');
const {print} = require('math-parser');
const {query} = require('math-nodes');

// Iterates through the tree looking for like terms to collect and combine.
// Will prioritize deeper expressions. Returns a Node.Status object.
const search = TreeSearch.postOrder(collectAndCombineLikeTerms);

/*
const termCollectorFunctions = {
  '+': add,
  '*': multiplyPolynomialTerms
};
*/

function collectAndCombineLikeTerms(node) {
  // we might also be able to just combine if they're all the same term
  // e.g. 2x + 4x + x (doesn't need collecting)
  if (query.isAdd(node)) {
    const status = collectAndCombineOperation(node);
    if (status.hasChanged()) {
      return status;
    }
    return apply(node, add.ADD_POLYNOMIAL_TERMS, ChangeTypes.ADD_POLYNOMIAL_TERMS);
  }
  else if (query.isMul(node)){
    return multiplyLikeTerms(node)
  }
  else {
    return Node.Status.noChange(node);
  }
}

// Collects and combines (if possible) the arguments of an addition or
// multiplication
function collectAndCombineOperation(node) {
  let substeps = []
  let status = apply(clone(node), collect.COLLECT_LIKE_TERMS, ChangeTypes.COLLECT_LIKE_TERMS);

  if (!status.hasChanged()) {
    return status;
  }

  // STEP 1: collect like terms, e.g. 2x + 4x^2 + 5x => 4x^2 + (2x + 5x)
  substeps.push(status);
  let newNode = Node.Status.resetChangeGroups(status.newNode);

  // STEP 2 onwards: combine like terms for each group that can be combined
  // e.g. (x + 3x) + (2 + 2) has two groups
  const combineSteps = combineLikeTerms(newNode);
  if (combineSteps.length > 0) {
    substeps = substeps.concat(combineSteps);
    const lastStep = combineSteps[combineSteps.length - 1];
    newNode = Node.Status.resetChangeGroups(lastStep.newNode);
  }

  return Node.Status.nodeChanged(
    ChangeTypes.COLLECT_AND_COMBINE_LIKE_TERMS,
    node, newNode, true, substeps);
}

// step 2 onwards for collectAndCombineOperation
// combine like terms for each group that can be combined
// e.g. (x + 3x) + (2 + 2) has two groups
// returns a list of combine steps
function combineLikeTerms(node) {
  const steps = [];
  let newNode = clone(node);

  for (let i = 0; i < node.args.length; i++) {
    let child = node.args[i];

    const childStatus = apply(child, add.ADD_POLYNOMIAL_TERMS, ChangeTypes.ADD_POLYNOMIAL_TERMS);
    if (childStatus.hasChanged()) {
      const status = Node.Status.childChanged(newNode, childStatus, i);
      steps.push(status);
      newNode = Node.Status.resetChangeGroups(status.newNode);
    }
  }

  return steps;
}

module.exports = search;

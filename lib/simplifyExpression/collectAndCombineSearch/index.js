// Collects and combines like terms

const clone = require('../../util/clone');

const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');
//const addPolynomialTerms = require('./addPolynomialTerms');
//const collectLikeTerms = require('./collectLikeTerms');
const {multiplyPolynomialTerms} = require('./multiplyPolynomials');
//const rearrangeTerms = require('./rearrangeTerms');
const {print} = require('math-parser')
// Iterates through the tree looking for like terms to collect and combine.
// Will prioritize deeper expressions. Returns a Node.Status object.
const search = TreeSearch.postOrder(collectAndCombine);

function collectAndCombine(node) {
  let status = multiplyPolynomialTerms(node);
  if (status.hasChanged()) {
    return status
  } else {
    return Node.Status.noChange(node);
  }
}

module.exports = search;

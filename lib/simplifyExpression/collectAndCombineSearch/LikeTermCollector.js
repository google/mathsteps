const clone = require('../../util/clone');
const print = require('../../util/print');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const NthRoot = require('../functionsSearch/nthRoot');
const Util = require('../../util/Util');

const CONSTANT = 'constant';
const CONSTANT_FRACTION = 'constantFraction';
const NTH_ROOT = 'nthRoot';
const OTHER = 'other';

const LikeTermCollector = {};

// Given an expression tree, returns true if there are terms that can be
// collected
LikeTermCollector.canCollectLikeTerms = function(node) {
  // We can collect like terms through + or through *
  // Note that we never collect like terms with - or /, those expressions will
  // always be manipulated in flattenOperands so that the top level operation is
  // + or *.
  if (!(Node.Type.isOperator(node, '+') || Node.Type.isOperator(node, '*'))) {
    return false;
  }

  let terms;
  if (node.op === '+') {
    terms = getTermsForCollectingAddition(node);
  }
  else if (node.op === '*') {
    terms = getTermsForCollectingMultiplication(node);
  }
  else {
    throw Error('Operation not supported: ' + node.op);
  }

  // Conditions we need to meet to decide to to reorganize (collect) the terms:
  // - more than 1 term type
  // - more than 1 of at least one type (not including other)
  // (note that this means x^2 + x + x + 2 -> x^2 + (x + x) + 2,
  // which will be recorded as a step, but doesn't change the order of terms)
  const termTypes = Object.keys(terms);
  const filteredTermTypes = termTypes.filter(x => x !== OTHER);
  return (termTypes.length > 1 &&
    filteredTermTypes.some(x => terms[x].length > 1));
};

// Collects like terms for an operation node and returns a Node.Status object.
LikeTermCollector.collectLikeTerms = function(node) {
  if (!LikeTermCollector.canCollectLikeTerms(node)) {
    return Node.Status.noChange(node);
  }

  const op = node.op;
  let terms = [];
  if (op === '+') {
    terms = getTermsForCollectingAddition(node);
  }
  else if (op === '*') {
    terms = getTermsForCollectingMultiplication(node);
  }
  else {
    throw Error('Operation not supported: ' + op);
  }

  // List the symbols alphabetically
  const termTypesSorted = Object.keys(terms)
      .filter(x => (x !== CONSTANT && x !== CONSTANT_FRACTION && x !== OTHER))
      .sort(sortTerms);


  // Then add const
  if (terms[CONSTANT]) {
    // at the end for addition (since we'd expect x^2 + (x + x) + 4)
    if (op === '+') {
      termTypesSorted.push(CONSTANT);
    }
    // for multipliation it should be at the front (e.g. (3*4) * x^2)
    if (op === '*') {
      termTypesSorted.unshift(CONSTANT);
    }
  }
  if (terms[CONSTANT_FRACTION]) {
    termTypesSorted.push(CONSTANT_FRACTION);
  }

  // Collect the new operands under op.
  let newOperands = [];
  let changeGroup = 1;
  termTypesSorted.forEach(termType => {
    const termsOfType = terms[termType];
    if (termsOfType.length === 1) {
      const singleTerm = clone(termsOfType[0]);
      singleTerm.changeGroup = changeGroup;
      newOperands.push(singleTerm);
    }
    // Any like terms should be wrapped in parens.
    else {
      const termList = clone(Node.Creator.parenthesis(
        Node.Creator.operator(op, termsOfType)));
      termList.changeGroup = changeGroup;
      newOperands.push(termList);
    }
    termsOfType.forEach(term => {
      term.changeGroup = changeGroup;
    });
    changeGroup++;
  });

  // then stick anything else (paren nodes, operator nodes) at the end
  if (terms[OTHER]) {
    newOperands = newOperands.concat(terms[OTHER]);
  }

  const newNode = clone(node);
  newNode.args = newOperands;
  return Node.Status.nodeChanged(
    ChangeTypes.COLLECT_LIKE_TERMS, node, newNode, false);
};

// Terms with coefficients are collected by categorizing them by their 'name'
// which is used to separate them into groups that can be combined. getTermName
// returns this group 'name'
function getTermName(node, termSubclass, op) {
  const term = new termSubclass(node);
  // we 'name' terms by their base node name
  let termName = print.ascii(term.getBaseNode());
  // when adding terms, the exponent matters too (e.g. 2x^2 + 5x^3 can't be combined)
  if (op === '+') {
    const exponent = print.ascii(term.getExponentNode(true));
    termName += '^' + exponent;
  }
  return termName;
}

// Collects like terms in an addition expression tree into categories.
// Returns a dictionary of termname to lists of nodes with that name
// e.g. 2x + 4 + 5x would return {'x': [2x, 5x], CONSTANT: [4]}
// (where 2x, 5x, and 4 would actually be expression trees)
function getTermsForCollectingAddition(node) {
  let terms = {};

  for (let i = 0; i < node.args.length; i++) {
    const child = node.args[i];

    if (Node.PolynomialTerm.isPolynomialTerm(child)) {
      const termName = getTermName(child, Node.PolynomialTerm, '+');
      terms = Util.appendToArrayInObject(terms, termName, child);
    }
    else if (Node.NthRootTerm.isNthRootTerm(child)) {
      const termName = getTermName(child, Node.NthRootTerm, '+');
      terms = Util.appendToArrayInObject(terms, termName, child);
    }
    else if (Node.Type.isIntegerFraction(child)) {
      terms = Util.appendToArrayInObject(terms, CONSTANT_FRACTION, child);
    }
    else if (Node.Type.isConstant(child)) {
      terms = Util.appendToArrayInObject(terms, CONSTANT, child);
    }
    else if (Node.Type.isOperator(node) ||
             Node.Type.isFunction(node) ||
             Node.Type.isParenthesis(node) ||
             Node.Type.isUnaryMinus(node)) {
      terms = Util.appendToArrayInObject(terms, OTHER, child);
    }
    else {
      // Note that we shouldn't get any symbol nodes in the switch statement
      // since they would have been handled by isPolynomialTerm
      throw Error('Unsupported node type: ' + child.type);
    }
  }
  // If there's exactly one constant and one fraction, we collect them
  // to add them together.
  // e.g. 2 + 1/3 + 5 would collect the constants (2+5) + 1/3
  // but 2 + 1/3 + x would collect (2 + 1/3) + x so we can add them together
  if (terms[CONSTANT] && terms[CONSTANT].length === 1 &&
     terms[CONSTANT_FRACTION] && terms[CONSTANT_FRACTION].length === 1) {
    const fraction = terms[CONSTANT_FRACTION][0];
    terms = Util.appendToArrayInObject(terms, CONSTANT, fraction);
    delete terms[CONSTANT_FRACTION];
  }

  return terms;
}

// Collects like terms in a multiplication expression tree into categories.
// For multiplication, polynomial terms with constants are separated into
// a symbolic term and a constant term.
// Returns a dictionary of termname to lists of nodes with that name
// e.g. 2x + 4 + 5x^2 would return {'x': [x, x^2], CONSTANT: [2, 4, 5]}
// (where x, x^2, 2, 4, and 5 would actually be expression trees)
function getTermsForCollectingMultiplication(node) {
  let terms = {};

  for (let i = 0; i < node.args.length; i++) {
    let child = node.args[i];

    if (Node.Type.isUnaryMinus(child)) {
      terms = Util.appendToArrayInObject(
        terms, CONSTANT, Node.Creator.constant(-1));
      child = child.args[0];
    }
    if (Node.PolynomialTerm.isPolynomialTerm(child)) {
      terms = addToTermsforPolynomialMultiplication(terms, child);
    }
    else if (Node.Type.isFunction(child, 'nthRoot')) {
      terms = addToTermsforNthRootMultiplication(terms, child);
    }
    else if (Node.Type.isIntegerFraction(child)) {
      terms = Util.appendToArrayInObject(terms, CONSTANT, child);
    }
    else if (Node.Type.isConstant(child)) {
      terms = Util.appendToArrayInObject(terms, CONSTANT, child);
    }
    else if (Node.Type.isOperator(node) ||
             Node.Type.isFunction(node) ||
             Node.Type.isParenthesis(node) ||
             Node.Type.isUnaryMinus(node)) {
      terms = Util.appendToArrayInObject(terms, OTHER, child);
    }
    else {
      // Note that we shouldn't get any symbol nodes in the switch statement
      // since they would have been handled by isPolynomialTerm
      throw Error('Unsupported node type: ' + child.type);
    }
  }
  return terms;
}

// A helper function for getTermsForCollectingMultiplication
// e.g. nthRoot(x, 2), append 'nthRoot2': nthRootNode to terms dictionary
// Takes the terms dictionary and the nthRoot node, and returns an updated
// terms dictionary.
function addToTermsforNthRootMultiplication(terms, node) {
  const rootNode = NthRoot.getRootNode(node);
  const rootNodeValue = rootNode.value;

  terms = Util.appendToArrayInObject(terms, NTH_ROOT + rootNodeValue , node);

  return terms;
}

// A helper function for getTermsForCollectingMultiplication
// Polynomial terms need to be divided into their coefficient + symbolic parts.
// e.g. 2x^4 -> 2 (coeffient) and x^4 (symbolic, named after the symbol node)
// Takes the terms list and the polynomial term node, and returns an updated
// terms list.
function addToTermsforPolynomialMultiplication(terms, node) {
  const polyNode = new Node.PolynomialTerm(node);
  let termName;

  if (!polyNode.hasCoeff()) {
    termName = getTermName(node, Node.PolynomialTerm, '*');
    terms = Util.appendToArrayInObject(terms, termName, node);
  }
  else {
    const coefficient = polyNode.getCoeffNode();
    let termWithoutCoefficient = polyNode.getSymbolNode();
    if (polyNode.getExponentNode()) {
      termWithoutCoefficient = Node.Creator.operator(
        '^', [termWithoutCoefficient, polyNode.getExponentNode()]);
    }

    terms = Util.appendToArrayInObject(terms, CONSTANT, coefficient);
    termName = getTermName(termWithoutCoefficient, Node.PolynomialTerm, '*');
    terms = Util.appendToArrayInObject(terms, termName, termWithoutCoefficient);
  }
  return terms;
}

// Sort function for termnames. Sort first by symbol name, and then by exponent.
function sortTerms(a, b) {
  if (a === b) {
    return 0;
  }
  // if no exponent, sort alphabetically
  if (a.indexOf('^') === -1) {
    return a < b ? -1 : 1;
  }
  // if exponent: sort by symbol, but then exponent decreasing
  else {
    const symbA = a.split('^')[0];
    const expA = a.split('^')[1];
    const symbB = b.split('^')[0];
    const expB = b.split('^')[1];
    if (symbA !== symbB) {
      return symbA < symbB ? -1 : 1;
    }
    else {
      return expA > expB ? -1 : 1;
    }
  }
}

module.exports = LikeTermCollector;

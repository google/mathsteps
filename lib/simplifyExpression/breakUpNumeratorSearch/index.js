const canFindDenominatorInNumerator = require('../../checks/canFindDenominatorInNumerator');
const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

// Breaks up any fraction (deeper nodes getting priority) that has a numerator
// that is a sum. e.g. (2+x)/5 -> (2/5 + x/5)
// This step must happen after things have been collected and combined, or
// else things will infinite loop, so it's a tree search of its own.
// Returns a Node.Status object
const search = TreeSearch.postOrder(breakUpNumerator);

// If `node` is a fraction with a numerator that is a sum, breaks up the
// fraction e.g. (2+x)/5 -> (2/5 + x/5)
// Returns a Node.Status object
function breakUpNumerator(node) {
  if (!Node.Type.isOperator(node) || node.op !== '/') {
    return Node.Status.noChange(node);
  }
  let numerator = node.args[0];
  if (Node.Type.isParenthesis(numerator)) {
    numerator = numerator.content;
  }
  if (!Node.Type.isOperator(numerator) || numerator.op !== '+') {
    return Node.Status.noChange(node);
  }

  // At this point, we know that node is a fraction and its numerator is a sum
  // of terms that can't be collected or combined, so we should break it up.
  const fractionList = [];
  let denominator = node.args[1];

  // Check if we can add/substract a constant to make the fraction nicer
  // fraction e.g. (2+x)/(5+x) -> (5+x)/(5+x) - 3/(5+x)
  if (canFindDenominatorInNumerator(node)) {
    let denominatorParenRemoved = false;
    if (Node.Type.isParenthesis(denominator)) {
      denominatorParenRemoved = true;
      denominator = denominator.content;
    }
    const newNumerator = [];

    // The constant value difference between the numerator and the denominator
    const num_n = numerator.args.length;
    const den_n = denominator.args.length;
    const numeratorFirstTerm = new Node.PolynomialTerm(numerator.args[0]);
    const denominatorFirstTerm = new Node.PolynomialTerm(denominator.args[0]);
    const numeratorPolyCoeff = numeratorFirstTerm.getCoeffValue();
    const denominatorPolyCoeff = denominatorFirstTerm.getCoeffValue();
    const multiplier = numeratorPolyCoeff / denominatorPolyCoeff;

    const numeratorConstant = parseInt(numerator.args[num_n-1].value) || 0;
    const denominatorConstant = parseInt(denominator.args[den_n-1].value) || 0;
    const addedConstant = numeratorConstant - (denominatorConstant * multiplier);

    if (multiplier === 1) {
      newNumerator.push(denominator);
    }
    else {
      const multiplierNode = Node.Creator.constant(multiplier);
      newNumerator.push(Node.Creator.operator('*', [multiplierNode, denominator]));
    }
    newNumerator.push(Node.Creator.constant(addedConstant));

    numerator = newNumerator;

    if (denominatorParenRemoved) {
      denominator = Node.Creator.parenthesis(denominator);
    }
  }
  numerator.forEach(arg => {
    const newFraction = Node.Creator.operator('/', [arg, denominator]);
    newFraction.changeGroup = 1;
    fractionList.push(newFraction);
  });

  let newNode = Node.Creator.operator('+', fractionList);
  // Wrap in parens for cases like 2*(2+3)/5 => 2*(2/5 + 3/5)
  newNode = Node.Creator.parenthesis(newNode);
  node.changeGroup = 1;
  return Node.Status.nodeChanged(
    ChangeTypes.BREAK_UP_FRACTION, node, newNode, false);
}
module.exports = search;

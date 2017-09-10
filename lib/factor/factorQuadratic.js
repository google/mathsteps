const math = require('mathjs');

const ConstantFactors = require('./ConstantFactors');

const ChangeTypes = require('../ChangeTypes');
const evaluate = require('../util/evaluate');
const Negative = require('../Negative');
const Node = require('../node');

const FACTOR_FUNCTIONS = [
  // factor just the symbol e.g. x^2 + 2x -> x(x + 2)
  factorSymbol,
  // factor difference of squares e.g. x^2 - 4
  factorDifferenceOfSquares,
  // factor perfect square e.g. x^2 + 2x + 1
  factorPerfectSquare,
  // factor sum product rule e.g. x^2 + 3x + 2
  factorSumProductRule
];

// Given a node, will check if it's in the form of a quadratic equation
// `ax^2 + bx + c`, and
// if it is, will factor it using one of the following rules:
//    - Factor out the symbol e.g. x^2 + 2x -> x(x + 2)
//    - Difference of squares e.g. x^2 - 4 -> (x+2)(x-2)
//    - Perfect square e.g. x^2 + 2x + 1 -> (x+1)^2
//    - Sum/product rule e.g. x^2 + 3x + 2 -> (x+1)(x+2)
//    - TODO: quadratic formula
//        requires us simplify the following only within the parens:
//        a(x - (-b + sqrt(b^2 - 4ac)) / 2a)(x - (-b - sqrt(b^2 - 4ac)) / 2a)
function factorQuadratic(node) {
  // get a, b and c
  let symbol, aValue = 0, bValue = 0, cValue = 0;
  for (const term of node.args) {
    if (Node.Type.isConstant(term, true)) {
      cValue = evaluate(term);
    }
    else if (Node.PolynomialTerm.isPolynomialTerm(term)) {
      const polyTerm = new Node.PolynomialTerm(term);
      const exponent = polyTerm.getExponentNode(true);
      if (exponent.value === '2') {
        symbol = polyTerm.getSymbolNode();
        aValue = polyTerm.getCoeffValue();
      }
      else if (exponent.value === '1') {
        bValue = polyTerm.getCoeffValue();
      }
      else {
        return Node.Status.noChange(node);
      }
    }
    else {
      return Node.Status.noChange(node);
    }
  }

  if (!symbol || !aValue) {
    return Node.Status.noChange(node);
  }

  let negate = false;
  if (aValue < 0) {
    negate = true;
    aValue = -aValue;
    bValue = -bValue;
    cValue = -cValue;
  }

  for (let i = 0; i < FACTOR_FUNCTIONS.length; i++) {
    const nodeStatus = FACTOR_FUNCTIONS[i](node, symbol, aValue, bValue, cValue, negate);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
  }

  return Node.Status.noChange(node);
}

// Will factor the node if it's in the form of ax^2 + bx
function factorSymbol(node, symbol, aValue, bValue, cValue, negate) {
  if (!bValue || cValue) {
    return Node.Status.noChange(node);
  }

  const gcd = math.gcd(aValue, bValue);
  const gcdNode = Node.Creator.constant(gcd);
  const aNode = Node.Creator.constant(aValue/gcd);
  const bNode = Node.Creator.constant(bValue/gcd);

  const factoredNode = Node.Creator.polynomialTerm(symbol, null, gcdNode);
  const polyTerm = Node.Creator.polynomialTerm(symbol, null, aNode);
  const paren = Node.Creator.parenthesis(
    Node.Creator.operator('+', [polyTerm, bNode]));

  let newNode = Node.Creator.operator('*', [factoredNode, paren], true);
  if (negate) {
    newNode = Negative.negate(newNode);
  }

  return Node.Status.nodeChanged(ChangeTypes.FACTOR_SYMBOL, node, newNode);
}

// Will factor the node if it's in the form of ax^2 - c, and the aValue
// and cValue are perfect squares
// e.g. 4x^2 - 4 -> (2x + 2)(2x - 2)
function factorDifferenceOfSquares(node, symbol, aValue, bValue, cValue, negate) {
  // check if difference of squares:
  //    (i) abs(a) and abs(c) are squares,
  //    (ii) b = 0,
  //    (iii) c is negative
  if (bValue || !cValue) {
    return Node.Status.noChange(node);
  }

  // we factor out the gcd first, providing us with a modified expression to
  // factor with new a and c values
  const gcd = math.gcd(aValue, cValue);
  aValue = aValue/gcd;
  cValue = cValue/gcd;
  const aRootValue = Math.sqrt(Math.abs(aValue));
  const cRootValue = Math.sqrt(Math.abs(cValue));

  // must be a difference of squares
  if (Number.isInteger(aRootValue) &&
      Number.isInteger(cRootValue) &&
      cValue < 0) {

    const aRootNode = Node.Creator.constant(aRootValue);
    const cRootNode = Node.Creator.constant(cRootValue);

    const polyTerm = Node.Creator.polynomialTerm(symbol, null, aRootNode);
    const firstParen = Node.Creator.parenthesis(
      Node.Creator.operator('+', [polyTerm, cRootNode]));
    const secondParen = Node.Creator.parenthesis(
      Node.Creator.operator('-', [polyTerm, cRootNode]));

    // create node in difference of squares form
    let newNode = Node.Creator.operator('*', [firstParen, secondParen], true);
    if (gcd !== 1) {
      const gcdNode = Node.Creator.constant(gcd);
      newNode = Node.Creator.operator('*', [gcdNode, newNode], true);
    }
    if (negate) {
      newNode = Negative.negate(newNode);
    }

    return Node.Status.nodeChanged(
      ChangeTypes.FACTOR_DIFFERENCE_OF_SQUARES, node, newNode);
  }

  return Node.Status.noChange(node);
}

// Will factor the node if it's in the form of ax^2 + bx + c, where a and c
// are perfect squares and b = 2*sqrt(a)*sqrt(c)
// e.g. x^2 + 2x + 1 -> (x + 1)^2
function factorPerfectSquare(node, symbol, aValue, bValue, cValue, negate) {
  // check if perfect square: (i) a and c squares, (ii) b = 2*sqrt(a)*sqrt(c)
  if (!bValue || !cValue) {
    return Node.Status.noChange(node);
  }

  // we factor out the gcd first, providing us with a modified expression to
  // factor with new a and c values
  const gcd = math.gcd(aValue, bValue, cValue);
  aValue = aValue/gcd;
  cValue = cValue/gcd;
  const aRootValue = Math.sqrt(Math.abs(aValue));
  let cRootValue = Math.sqrt(Math.abs(cValue));

  // if the second term is negative, then the constant in the parens is
  // subtracted: e.g. x^2 - 2x + 1 -> (x - 1)^2
  if (bValue < 0) {
    cRootValue = cRootValue * -1;
  }

  // apply the perfect square test
  const perfectProduct = 2 * aRootValue * cRootValue;
  if (Number.isInteger(aRootValue) &&
      Number.isInteger(cRootValue) &&
      (bValue/gcd) === perfectProduct) {
    const aRootNode = Node.Creator.constant(aRootValue);
    const cRootNode = Node.Creator.constant(cRootValue);

    const polyTerm = Node.Creator.polynomialTerm(symbol, null, aRootNode);
    const paren = Node.Creator.parenthesis(
      Node.Creator.operator('+', [polyTerm, cRootNode]));
    const exponent = Node.Creator.constant(2);

    // create node in perfect square form
    let newNode = Node.Creator.operator('^', [paren, exponent]);
    if (gcd !== 1) {
      const gcdNode = Node.Creator.constant(gcd);
      newNode = Node.Creator.operator('*', [gcdNode, newNode], true);
    }
    if (negate) {
      newNode = Negative.negate(newNode);
    }

    return Node.Status.nodeChanged(
      ChangeTypes.FACTOR_PERFECT_SQUARE, node, newNode);
  }

  return Node.Status.noChange(node);
}

// Will factor the node if it's in the form of ax^2 + bx + c, by
// applying the sum product rule: finding factors of a*c that add up to b.
// e.g. x^2 + 3x + 2 -> (x + 1)(x + 2) or
// or   2x^2 + 5x + 3 -> (2x - 1)(x + 3)
function factorSumProductRule(node, symbol, aValue, bValue, cValue, negate) {
  if (bValue && cValue) {
    // we factor out the gcd first, providing us with a modified expression to
    // factor with new a, b and c values
    const gcd = math.gcd(aValue, bValue, cValue);
    const gcdNode = Node.Creator.constant(gcd);

    aValue = aValue/gcd;
    bValue = bValue/gcd;
    cValue = cValue/gcd;

    // try sum/product rule: find a factor pair of a*c that adds up to b
    const product = aValue * cValue;
    const factorPairs = ConstantFactors.getFactorPairs(product, true);
    for (const pair of factorPairs) {
      if (pair[0] + pair[1] === bValue) {
        // To factor, we go through some transformations
        // TODO: these should be actual substeps
        // 1. Break apart the middle term into two terms using our factor pair (p and q):
        //    e.g. ax^2 + bx + c -> ax^2 + px + qx + c
        // 2. Consider the first two terms together and the second two terms
        //    together (this doesn't require any actual change to the expression)
        //    e.g. first group: [ax^2 + px] and second group: [qx + c]
        // 3. Factor both groups separately
        //    e.g first group: [ux(rx + s)] and second group [v(rx + s)]
        // 4. Finish factoring by combining the factored terms through grouping:
        //    e.g. (ux + v)(rx + s)
        const pValue = pair[0];
        const qValue = pair[1];

        // factor the first group to get u, r and s:
        // u = gcd(a, p), r = a/u and s = p/u
        const u = math.gcd(aValue, pValue);
        const uNode = Node.Creator.constant(u);
        const rNode = Node.Creator.constant(aValue/u);
        const sNode = Node.Creator.constant(pValue/u);

        // create the first group's part that's in parentheses: (rx + s)
        const rx = Node.Creator.polynomialTerm(symbol, null, rNode);
        const firstParen = Node.Creator.parenthesis(
          Node.Creator.operator('+', [rx, sNode]));

        // factor the second group to get v, we don't need to find r and s again
        // v = gcd(c, q)
        let vValue = math.gcd(cValue, qValue);
        if (qValue < 0) {
          vValue = vValue * -1;
        }
        const vNode = Node.Creator.constant(vValue);

        // create the second parenthesis
        const ux = Node.Creator.polynomialTerm(symbol, null, uNode);
        const secondParen = Node.Creator.parenthesis(
          Node.Creator.operator('+', [ux, vNode]));

        // create a node in the general factored form for expression
        let newNode;
        if (gcd === 1) {
          newNode = Node.Creator.operator(
            '*', [firstParen, secondParen], true);
        }
        else {
          newNode = Node.Creator.operator(
            '*', [gcdNode, firstParen, secondParen], true);
        }

        if (negate) {
          newNode = Negative.negate(newNode);
        }

        return Node.Status.nodeChanged(
          ChangeTypes.FACTOR_SUM_PRODUCT_RULE, node, newNode);
      }
    }
  }

  return Node.Status.noChange(node);
}

module.exports = factorQuadratic;

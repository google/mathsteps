const assert = require('assert');

const print = require('../../lib/util/print');

const ChangeTypes = require('../../lib/ChangeTypes');
const simplifyExpression = require('../../lib/simplifyExpression');

function testOneStep(exprStr, outputStr, debug=false) {
  const steps = simplifyExpression(exprStr);
  if (!steps.length) {
    return exprStr;
  }
  const nodeStatus = steps[0];
  if (debug) {
    if (!nodeStatus.changeType) {
      throw Error('missing or bad change type');
    }
    // eslint-disable-next-line
    console.log(nodeStatus.changeType);
    // eslint-disable-next-line
    console.log(print.ascii(nodeStatus.newNode));
  }
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print.ascii(nodeStatus.newNode),
      outputStr);
  });
}

describe('arithmetic stepping', function() {
  const tests = [
    ['(2+2)', '4'],
    ['(2+2)*5', '4 * 5'],
    ['5*(2+2)', '5 * 4'],
    ['2*(2+2) + 2^3', '2 * 4 + 2^3'],
    ['6*6', '36'],
  ];
  tests.forEach(t => testOneStep(t[0], t[1]));
});

describe('adding symbols without breaking things', function() {
  // nothing old breaks
  const tests = [
    ['2+x', '2 + x'],
    ['(2+2)*x', '4x'],
    ['(2+2)*x+3', '4x + 3'],
  ];
  tests.forEach(t => testOneStep(t[0], t[1]));
});

describe('collecting like terms within the context of the stepper', function() {
  const tests = [
    ['2+x+7', 'x + 9'],                           // substeps not tested here
//    ['2x^2 * y * x * y^3', '2 * x^3 * y^4'],      // substeps not tested here
  ];
  tests.forEach(t => testOneStep(t[0], t[1]));
});

describe('collects and combines like terms', function() {
  const tests = [
    ['(x + x) + (x^2 + x^2)', '2x + (x^2 + x^2)'], // substeps not tested here
    ['10 + (y^2 + y^2)', '10 + 2y^2'],             // substeps not tested here
    ['10y^2 + 1/2 y^2 + 3/2 y^2', '12y^2'],        // substeps not tested here
    ['x + y + y^2', 'x + y + y^2'],
    ['2x^(2+1)', '2x^3'],
  ];
  tests.forEach(t => testOneStep(t[0], t[1]));
});

describe('stepThrough returning no steps', function() {
  it('12x^2 already simplified', function () {
    assert.deepEqual(
      simplifyExpression('12x^2'),
      []);
  });
  it('2*5x^2 + sqrt(5) has unsupported sqrt', function () {
    assert.deepEqual(
      simplifyExpression('2*5x^2 + sqrt(5)'),
      []);
  });
});

describe('keeping parens in important places, on printing', function() {
  testOneStep('5 + (3*6) + 2 / (x / y)', '5 + (3 * 6) + 2 * y / x');
  testOneStep('-(x + y) + 5+3', '8 - (x + y)');
});

describe('fractions', function() {
  testOneStep('2 + 5/2 + 3', '5 + 5/2'); // collect and combine without substeps
});

describe('simplifyDoubleUnaryMinus step actually happens', function () {
  it('22 - (-7) -> 22 + 7', function() {
    const steps = simplifyExpression('22 - (-7)');
    assert.equal(steps[0].changeType, ChangeTypes.RESOLVE_DOUBLE_MINUS);
  });
});

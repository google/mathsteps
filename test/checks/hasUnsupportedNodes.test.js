const assert = require('assert');
const {parse} = require('math-parser');

const checks = require('../../lib/checks');

describe('arithmetic stepping', function () {
  it('4 + sqrt(16) no support for sqrt', function () {
    assert.deepEqual(
      checks.hasUnsupportedNodes(parse('4 + sqrt(4)')),
      true);
  });

  it('x = 5 no support for assignment', function () {
    assert.deepEqual(
      checks.hasUnsupportedNodes(parse('x = 5')),
      true);
  });

  it('x + (-5)^2 - 8*y/2 is fine', function () {
    assert.deepEqual(
      checks.hasUnsupportedNodes(parse('x + (-5)^2 - 8*y/2')),
      false);
  });

  it('nthRoot() with no args has no support', function () {
    assert.deepEqual(
      checks.hasUnsupportedNodes(parse('nthRoot()')),
      true);
  });
});

const assert = require('assert');
const math = require('mathjs');

const clone = require('../lib/util/clone');

function testCloner(expNode, new_node) {
  it ('creates a clone of a node', function () {
    assert.equal(clone(math.parse(expNode)), new_node);
  });
}

describe('Clone', function () {
  const tests = [
    [1, 1],
    ['x', 'x']
  ];
  tests.forEach(t => testCloner(t[0], t[1]));
});

const assert = require('assert');
import math = require('mathjs');
import checks = require('../../lib/checks');
describe('arithmetic stepping', () => {
    it('4 + sqrt(16) no support for sqrt', () => {
        assert.deepEqual(
            checks.hasUnsupportedNodes(math.parse('4 + sqrt(4)')),
            true);
    });

    it('x = 5 no support for assignment', () => {
        assert.deepEqual(
            checks.hasUnsupportedNodes(math.parse('x = 5')),
            true);
    });

    it('x + (-5)^2 - 8*y/2 is fine', () => {
        assert.deepEqual(
            checks.hasUnsupportedNodes(math.parse('x + (-5)^2 - 8*y/2')),
            false);
    });

    it('nthRoot() with no args has no support', () => {
        assert.deepEqual(
            checks.hasUnsupportedNodes(math.parse('nthRoot()')),
            true);
    });
});

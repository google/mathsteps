import {basics} from '../../../lib/simplifyExpression/search.js';
import testSimplify from './testSimplify.js';

describe('removeMultiplicationByOne', function() {
  const tests = [
    ['x*1', 'x'],
    ['1x', 'x'],
    ['1*z^2', 'z^2'],
    ['2*1*z^2', '2 * 1z^2'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], basics));
});

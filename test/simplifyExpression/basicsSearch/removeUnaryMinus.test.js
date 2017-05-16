import {basics} from '../../../lib/simplifyExpression/search.js';
import testSimplify from './testSimplify.js';

describe('removeUnaryMinus', function() {
  const tests = [
    ['(-x)^2', 'x^2'],
    ['(-x)^4', 'x^4'],
    ['(-x)^3', '-x^3']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], basics));
});

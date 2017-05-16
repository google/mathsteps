import {basics} from '../../../lib/simplifyExpression/search.js';
import testSimplify from './testSimplify.js';

describe('simplify basics', function () {
  const tests = [
    ['0/5', '0'],
    ['0/(x+6+7+x^2+2^y)', '0'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], basics));
});

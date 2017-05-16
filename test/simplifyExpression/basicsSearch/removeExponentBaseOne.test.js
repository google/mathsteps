import {basics} from '../../../lib/simplifyExpression/search.js';
import testSimplify from './testSimplify.js';

describe('removeExponentBaseOne', function() {
  const tests = [
    ['1^3', '1'],
    ['1^x', '1'],
    ['1^(2 + 3 + 5/4 + 7 - 6/7)', '1']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], basics));
});

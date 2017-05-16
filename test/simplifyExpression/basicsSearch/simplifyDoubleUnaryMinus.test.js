import {basics} from '../../../lib/simplifyExpression/search.js';
import testSimplify from './testSimplify.js';

describe('simplifyDoubleUnaryMinus', function() {
  var tests = [
      ['--5', '5'],
      ['--x', 'x']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], basics));
});

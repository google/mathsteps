import {basics} from '../../../lib/simplifyExpression/search.js';
import testSimplify from './testSimplify.js';

describe('reduce multiplication by 0', function () {
  const tests = [
    ['0x', '0'],
    ['2*0*z^2','0'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], basics));
});

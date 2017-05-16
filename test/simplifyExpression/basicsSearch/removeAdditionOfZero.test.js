import {basics} from '../../../lib/simplifyExpression/search.js'
import testSimplify from './testSimplify.js';

describe('removeAdditionOfZero', function() {
  var tests = [
    ['2+0+x', '2 + x'],
    ['2+x+0', '2 + x'],
    ['0+2+x', '2 + x']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], basics));
});

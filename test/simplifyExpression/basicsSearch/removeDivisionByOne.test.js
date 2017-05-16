import {basics} from '../../../lib/simplifyExpression/search.js';
import testSimplify from './testSimplify.js';

describe('removeDivisionByOne', function() {
  testSimplify('x/1', 'x', basics);
});

import {basics} from '../../../lib/simplifyExpression/search.js';
import testSimplify from './testSimplify.js';

describe('removeExponentByOne', function() {
  testSimplify('x^1', 'x', basics);
});

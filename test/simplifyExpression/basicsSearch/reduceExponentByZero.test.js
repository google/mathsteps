import {testSimplify} from './testSimplify.js';

describe('reduceExponentByZero', function() {
  testSimplify('(x+3)^0', '1', reduceExponentByZero);
});

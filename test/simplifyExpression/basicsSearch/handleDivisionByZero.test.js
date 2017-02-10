'use strict';

const handleDivisionByZero = require('../../../lib/simplifyExpression/basicsSearch/handleDivisionByZero');
const testSimplify = require('./testSimplify');

describe('handleDivisionByZero', function() {
  const tests = [
    ['1/0', '1/0'],
    ['0/0', '0/0'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], handleDivisionByZero));
});

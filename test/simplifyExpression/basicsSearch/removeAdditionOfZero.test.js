const removeAdditionOfZero = require('../../../lib/simplifyExpression/basicsSearch/removeAdditionOfZero')

const testSimplify = require('./testSimplify')

describe('removeAdditionOfZero', function() {
  let tests = [
    ['2+0+x', '2 + x'],
    ['2+x+0', '2 + x'],
    ['0+2+x', '2 + x']
  ]
  tests.forEach(t => testSimplify(t[0], t[1], removeAdditionOfZero))
})

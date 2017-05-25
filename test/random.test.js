import simplifyExpression from '../lib/simplifyExpression';
import {assert} from 'assert'
import {parse} from 'math-parser'
import stepThrough from '../lib/simplifyExpression/stepThrough.js'

//console.log(simplifyExpression('--x + 0 + (--2) + 3 * -1'));
//console.log(stepThrough(parse('2/3/4')))
console.log(stepThrough(parse('2x + x')))
//console.log(simplifyExpression('nthRoot(x^2,2)'))

//TODO: print to handle nthRoot function
//console.log(simplifyExpression('2/3/4'))
//console.log(simplifyExpression('2 + 3 + 5 * 10'))

/*
function test(input, output) {
  it(input + ' -> ' + output,  () => {
    assert.equal(simplifyExpression(input),output);
  });
}*/
/*
function test(input, output) {
  return simplifyExpression(input)
}

describe('a bunch of tests', function () {
  const tests = [
    ['2+2', '4'],
    ['2*3*5', '30'],
    ['9/4', '9/4'], //  does not divide
    ['-1*x', '-x'],
    ['x^2*-1', '-x^2'],
    ['2x*2*-1', '2x * 2 * -1']
  ];
  tests.forEach(t => test(t[0], t[1]));
});
*/

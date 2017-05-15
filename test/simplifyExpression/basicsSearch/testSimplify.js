import assert from 'assert';

//const flatten = require('../../../lib/util/flattenOperands');
import {print, parse} from 'math-parser';

export function testSimplify(exprStr, outputStr, simplifyOperation) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = parse(exprStr);
    const newNode = simplifyOperation(inputNode).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}


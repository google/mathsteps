import assert from 'assert';
import {flattenOperands as flatten} from 'math-rules'; 
import {print, parse} from 'math-parser';

export default function testSimplify(exprStr, outputStr, simplifyOperation) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(parse(exprStr));
    const newNode = simplifyOperation(inputNode).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}


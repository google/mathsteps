const assert = require('assert');

const Util = require('../../lib/util/Util');

describe('appendToArrayInObject', function () {
  it('creates empty array', function () {
    const object = {};
    Util.appendToArrayInObject(object, 'key', 'value');
    assert.deepEqual(
      object,
      {'key': ['value']}
     );
  });
  it('appends to array if it exists', function () {
    const object = {'key': ['old_value']};
    Util.appendToArrayInObject(object, 'key', 'new_value');
    assert.deepEqual(
      object,
      {'key': ['old_value', 'new_value']}
     );
  });
});

// Remove some property used in mathjs that we don't need and prevents node
// equality checks from passing
function removeComments(node) {
  node.filter(node => node.comment !== undefined).forEach(
    node => delete node.comment);
}

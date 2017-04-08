const assert = require('assert');
import Util = require('../../lib/util/Util');
describe('appendToArrayInObject', () => {
    it('creates empty array', () => {
        const object = {};
        Util.appendToArrayInObject(object, 'key', 'value');
        assert.deepEqual(
            object,
            {'key': ['value']}
        );
    });
    it('appends to array if it exists', () => {
        const object = {'key': ['old_value']};
        Util.appendToArrayInObject(object, 'key', 'new_value');
        assert.deepEqual(
            object,
            {'key': ['old_value', 'new_value']}
        );
    });
});

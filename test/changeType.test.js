const assert = require('assert');

const changeTypes = require('../lib/ChangeTypes');

function changeTypesCheck(exp, out) {
  it ('should exist', () => {
    assert.equal(exp, out);
  });
}

describe('Rules for each possible step', () => {
  const tests = [
    [changeTypes['NO_CHANGE'], 'NO_CHANGE'],
    [changeTypes['ABSOLUTE_VALUE'], 'ABSOLUTE_VALUE'],
    [changeTypes['ADD_FRACTIONS'], 'ADD_FRACTIONS'],
  ];
  tests.forEach(t => changeTypesCheck(t[0], t[1]));
});

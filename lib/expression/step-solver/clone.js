// a temporary and hacky module for deep cloning a node

const flatten = require('../../../lib/expression/step-solver/flattenOperands.js');
const math = require('../../../index');
const print = require('./../../../lib/expression/step-solver/prettyPrint');

function clone(node) {
	return flatten(math.parse(print(node)));
}

module.exports = clone;

const math = require('mathjs');
const stepThrough = require('./stepThrough');

function factorString(expressionString, debug=false) {
  let node;
  try {
    node = math.parse(expressionString);
  }
  catch (err) {
    return [];
  }

  if (node) {
    return stepThrough(node, debug);
  }
  return [];
}

module.exports = factorString;

const {definePatternRule} = require('math-rules');
const {parse} = require('math-parser');
const {traverse} = require('math-traverse');

const defineRuleString = (matchPattern, rewritePattern, constraints) => {
  const matchAST = parse(matchPattern);
  const rewriteAST = parse(rewritePattern);

  traverse(matchAST, {
    leave(node) {
      delete node.loc;
    }
  });

  traverse(rewriteAST, {
    leave(node) {
      delete node.loc;
    }
  });

  return definePatternRule(matchAST, rewriteAST, constraints);
};

module.exports = defineRuleString;

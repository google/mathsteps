const {build, query} = require('math-nodes');
const {replace} = require('math-traverse');

const clone = require('../util/clone');

// Removes any parenthesis around nodes that can't be resolved further.
// Input must be a top level expression.
// Returns a node.
// Note: this function does more than remove unnecessary parens, it also
// flattens nested expressions, e.g. (1 + x) + (2 + y), sets wasMinus = true on
// negation nodes (this converts x + -y to x - y).
// TODO(kevinb): rewrite rules should decide whether or not do these conversions
function removeUnnecessaryParens(root) {
  return replace(root, {
    leave(node) {
      if (node.type === 'Parentheses') {
        return node.body;
      }
      else if (query.isAdd(node)) {
        return build.add(
          ...node.args.reduce((accum, arg) => {
            if (query.isAdd(arg)) {
              return accum.concat(arg.args);
            }
            else {
              return accum.concat(arg);
            }
          }, [])
        );
      }
      else if (query.isMul(node)) {
        const buildMul = node.implicit ? build.implicitMul : build.mul;
        return buildMul(
          ...node.args.reduce((accum, arg) => {
            if (query.isMul(arg)) {
              return accum.concat(arg.args);
            }
            else {
              return accum.concat(arg);
            }
          }, [])
        );
      }
      else if (query.isNeg(node)) {
        const newNode = clone(node);
        newNode.wasMinus = true;
        return newNode;
      }
    }
  });
}

module.exports = removeUnnecessaryParens;

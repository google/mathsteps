const {build, query} = require('math-nodes');
const {replace} = require('math-traverse');

const clone = require('../util/clone');

/*
Background:

Expression trees are commonly parsed as binary trees, and mathjs does this too.
That means that a mathjs expression tree likely looks like:
http://collegelabs.co/clabs/nld/images/524px-Expression_Tree.svg.png

e.g. 2+2+2 is parsed by mathjs as 2 + 2+2 (a plus node with children 2 and 2+2)
However...
1. This is more complicated than needed. 2+2+2 is the same as 2+(2+2)
2. To collect like terms, we actually *need* it to be flat. e.g. with 2x+(2+2x),
   there's no easy way to know that there are two 2x's to collect without
   running up and down the tree. If we flatten to 2x+2+2x, it becomes a lot
   easier to collect like terms to (2x+2x) + 2, which would then be combined to
   4x + 2
The purpose of flatteOperands is to flatten the tree in this way.

e.g. an expression that is grouped in the tree like
(2 + ((4 * ((1 + 2) + (3 + 4))) * 8))
should be flattened to look like:
(2 + (4 * (1 + 2 + 3 + 4) * 8))

Subtraction and division are also flattened, though that gets a bit more
complicated and you may as well start reading through the code if you're
interested in how that works
*/

// Flattens the tree accross the same operation (just + and * for now)
// e.g. 2+2+2 is parsed by mathjs as 2+(2+2), but this would change that to
// 2+2+2, ie one + node that has three children.
// Input: an expression tree
// Output: the expression tree updated with flattened operations
function flattenOperands(root) {
  return replace(root, {
    leave(node) {
      if (query.isAdd(node)) {
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
        // Rewrite explicit multiplication to be implicit if the factors look
        // like those of a polynomial.  The first factor must be a number and
        // the following factors must not be numbers.
        // e.g. 2 * x^2 * y -> 2 x^2 y
        if (isPolynomialTerm(node) && query.isNumber(node.args[0])
            && node.args.slice(1).every(arg => !query.isNumber(arg))) {
          const newNode = clone(node);
          newNode.implicit = true;
          return newNode;
        }
        // Rearrange multiplication of fractions involving variables in the
        // the numerator.
        // e.g. 2 x / 3 -> 2x / 3
        else if (query.isNumber(node.args[0]) && query.isDiv(node.args[1])
            && query.isIdentifier(node.args[1].args[0]) && node.implicit) {
          return build.div(
            build.implicitMul(node.args[0], node.args[1].args[0]),
            node.args[1].args[1]);
        }
        // Flatten multiplication nest mul nodes as long as they're implicit
        // or explicit.
        // e.g. (2 * 3) * 4 -> 2 * 3 * 4
        // e.g. (2 x) (y z) -> 2 x y z
        else {
          const buildMul = node.implicit ? build.implicitMul : build.mul;
          return buildMul(
            ...node.args.reduce((accum, arg) => {
              if (query.isMul(arg) && arg.implicit === node.implicit) {
                return accum.concat(arg.args);
              }
              else {
                return accum.concat(arg);
              }
            }, [])
          );
        }
      }
    }
  });
}

function isPolynomialTerm(node) {
  if (query.isNumber(node)) {
    return true;
  }
  else if (query.isIdentifier(node)) {
    return true;
  }
  else if (query.isPow(node)) {
    const [base, exponent] = node.args;
    return query.isIdentifier(base) && isPolynomialTerm(exponent);
  }
  else if (query.isNeg(node)) {
    return isPolynomialTerm(node.args[0]);
  }
  else if (query.isMul(node)) {
    return node.args.every(isPolynomialTerm);
  }
}

module.exports = flattenOperands;

## A step by step solver for math

https://www.youtube.com/watch?v=ay6GjmiJTPM

## NOTE: not ready for contributers

Be aware that this repo's file structure will be going through some changes to
get ready for our release mid-January. At that point, we'll be publishing a blog
post where you can learn more about how this repo works, and we'll be welcoming
contributers! You're welcome to play around with this before then, but we won't
be taking pull requests until after our release. Thanks!

### Using the expression stepper

The main module is `simplifyExpression.js` which exports the following functions:

- simplify(expr) returns a simplified expression node
- stepThrough(expr) goes through step by step to simplify an expression and
  returns a list of, for each step, what changed and the updated expression
  node for each step
- step(expr) performs a single step on an expression node

### Contributing

Hi! If you're interested in working on this, that would be super awesome!
Learn more here: [CONTRIBUTING.md](CONTRIBUTING.md).


----- to be moved to wiki later -----

The code

- If you want to see the flow of how this code works, start in `stepper.js`.
  This is where `step` and `simplify` live. You can see what functions are
  called from `step` and follow the logic through other files if you're curious
  how any of those steps work.
- `NodeCreator` and `NodeType` are used to create nodes and check what type
  they are. Note that unaryMinus nodes (e.g. -x) are technically operator
  nodes, but we don't treat them as such, and always keep them as their own
  separate type.
- `NodeStatus` objects are used throughout the code. The stepper calls a bunch
  of functions that might make changes that are counted as a step, and each of
  these functions return a NodeStatus object which contains: the updated node
  after calling this function, if this function changed the expression in a way
  that counts as a step, and what the change type is.
- `MathChangeTypes` are used to describe different changes that count as steps.
- `flattenOperands` (sometimes shortened to `flatten`) changes the structure
  of the expression tree to be easier to work with. You probably will need to
  use this in your tests, but nowhere else.
  - TODO: write something that abstracts this away in the tests
- `PolynomialTermNode` describes and stores what counts as a polynomial term
  (e.g. x, x^2, -4/5 x^y) and `PolynomialTermOperations` define all operations
  that can happen with these polynomial terms
 - Note that polynomial terms right now are defined by only having one symbol.
   So 2x is grouped together as a polynomial node, but 2xy would be
   2x \* y (two operands)

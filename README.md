## A step by step solver for math

https://www.youtube.com/watch?v=ay6GjmiJTPM

### Using the expression stepper

The main module is `simplifyExpression.js` which exports the following functions:

- simplify(expr) returns a simplified expression node
- stepThrough(expr) goes through step by step to simplify an expression and
  returns a list of, for each step, what changed and the updated expression
  node for each step
- step(expr) performs a single step on an expression node

### Things to know to navigate the code

Hi! If you're interested in working on this, that would be super cool!
Here are some things to know that will help make sense of the code:

Expression trees

- Expressions in mathJS are stored as trees. You can read more about that in
  [the mathJS expresisons documentation
  page](http://mathjs.org/docs/expressions/expression_trees.html)
- There are a few different types of nodes that show up in the tree.
  This stepper uses OperationNode, ParenthesisNode, ConstantNode, and
  SymbolNode. You can read about them on [the mathJS expresisons documentation
  page](http://mathjs.org/docs/expressions/expression_trees.html). **Being
  familiar with these node types is essential for working in this code.**
  In the future, it would be nice to add support for FunctionNode.
- Keep in mind when dealing with node expressions that child nodes in the
  tree are called different things depending on the parent node type.
  Operation nodes have `args` as their children, and parenthesis nodes have a
  single child called `content`.
- One thing that's especially helpful to know is that operation nodes with op
  `*` can be implicit. If you do `n = math.parse('2*x')`, the resulting
  expression node is an operation node with `n.op` equal to `*`, and `n.args`
  equal to constant node 2 and symbol node x. Contrastingly,
  `n = math.parse(2x)` has the same `op` and `args`, but `n.implicit`
  will be true - meaning there was no astrix between the operands in the input.
  (This is used a lot for polynomial terms - ie 2x \* 5 should just be two
   operands 2x and 5 instead of 3 operands 2, x, and 5)
- TRICKY catch: any subtraction in the tree will be converted to adding the
  negative, e.g. 2 - 3 would be 2 + -3 in the tree. This is so that all
  addition and subtraction is flat (e.g. 2 + 3 - 5 + 8 would become one
  addition operation with 2, 3, -5, and 8 as its child nodes). This is a common
  strategy for computer algebra systems but can be confusing and easy to forget.
  So at most points in the codebase, there should be no operators with sign `-`
  If you're curious what the code that modifies subtraction looks like, you can
  find it in 'flatten.js'

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

Testing

- There are test files for almost every file in the stepper code.
- Run tests with `npm test`
- If you want to see what the expression tree looks like at any point
  in the code, you can log `node` as an expression string (e.g. '2x + 5') with
  `console.log(print(node))`, and you can log the full tree structure
  with `console.log(JSON.stringify(node, null, 2))`

Linting

- `npm run lint .`

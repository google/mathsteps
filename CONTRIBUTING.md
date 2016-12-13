## Contributing to mathsteps

🎉We're excited to have you helping out! Thanks so much for your time 🎉

### Table of contents

What should I know before I get started?

- Code of Conduct
- mathJS expression trees
- decisions around how we built mathsteps

Contributing

- ways to help out
- creating a pull request
- testing
- coding conventions


## What should I know before I get started?

### Code of Conduct

This project adheres to the Contributor Covenant [code of conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.
Please report unacceptable behavior to *TODO: email*

### overview of how (and why) we built mathsteps

- *TODO: link to blog post*

### mathJS expression trees

- Most of this code iterates over expression trees to make step by step
  simplifications. We use [mathJS expresison trees], which we recommend you
  learn a bit about.
- There are a few different types of nodes that show up in the tree.
  This stepper uses OperationNode, ParenthesisNode, ConstantNode, SymbolNode,
  and FunctionNode. You can also read about them on [the mathJS expressions
  documentation](http://mathjs.org/docs/expressions/expression_trees.html).
- Keep in mind when dealing with these trees that child nodes are called
  different things depending on the parent node type. e.g. operation nodes have
  `args` as their children, and parenthesis nodes have a single child called
  `content`.
- TRICKY catch: any subtraction in the tree will be converted to adding the
  negative, e.g. 2 - 3 would be 2 + -3 in the tree. This is so that all
  addition and subtraction is flat (e.g. 2 + 3 - 5 + 8 would become one
  addition operation with 2, 3, -5, and 8 as its child nodes). This is a common
  strategy for computer algebra systems but can be confusing and easy to forget.
  So at most points in the codebase, there should be no operators with sign `-`
  If you're curious what the code that modifies subtraction looks like, you can
  find it in 'flattenOperands.js'

## Contributing

### Ways to help out

- You can spread the word! If you think mathsteps is cool, tell your friends!
  Let them know they can use this and that they can contribute
- Suggest features! Have an idea for something mathsteps should solve or a way
  for it to teach math better? If your idea is not an [existing issue](https://github.com/socraticorg/mathsteps/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement), create a new issue with
  the label "enhancement"
- Report bugs! If the bug is not an [existing issue](https://github.com/socraticorg/mathsteps/issues?q=is%3Aopen+is%3Aissue+label%3Abug),
  create a new issue with the label "bug" and as much detail as you can so
  someone else can reproduce it.
- Contribute code! We'd love to have more contributors working on this. Check
  out the section below with more information on how to contribute, and feel
  free to email *TODO: email* with any questions!

### Creating a pull request

- we're excited to see your [pull request](https://help.github.com/articles/about-pull-requests/)!
- if you want to work on something, please assign yourself to the
  [related issue](https://github.com/socraticorg/mathsteps/issues) on GitHub
  before you get started
- if there is no existing issue for the change you'd like to make, you can make
  a [new one](https://github.com/socraticorg/mathsteps/issues/new)
- make sure you all the unit tests pass (with `npm test`) before creating the
  pull request, and please add your own tests for what you changed as well

### Testing

- Make sure you properly unit test your changes.
- Run tests with `npm test`
- If you want to see what the expression tree looks like at any point
  in the code, for debugging, you can log `node` as an expression string
  (e.g. '2x + 5') with `console.log(print(node))`, and you can log the full
  tree structure with `console.log(JSON.stringify(node, null, 2))`

### Coding conventions

- mathsteps follows the node.js code style as described
  [here](https://github.com/felixge/node-style-guide).
- To lint your code, run `npm run lint .`


There's lots to be done, lots of students to help, and we're so glad you'll be
a part of this.

Thanks! ❤️ ❤️

mathsteps team

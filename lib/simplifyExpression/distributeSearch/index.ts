import { ChangeTypes } from "../../ChangeTypes";
import { Negative } from "../../Negative";
import { TreeSearch } from "../../TreeSearch";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";
import { arithmeticSearch } from "../arithmeticSearch/ArithmeticSearch";
import { rearrangeCoefficient } from "../basicsSearch/rearrangeCoefficient";
import { collectAndCombineSearch } from "../collectAndCombineSearch";

export const distributeSearch = TreeSearch.postOrder(distribute);

// Distributes through parenthesis.
// e.g. 2(x+3) -> (2*x + 2*3)
// e.g. -(x+5) -> (-x + -5)
// Returns a Status object.
function distribute(node) {
  if (NodeType.isUnaryMinus(node)) {
    return distributeUnaryMinus(node);
  } else if (NodeType.isOperator(node, "*")) {
    return distributeAndSimplifyMultiplication(node);
  } else if (NodeType.isOperator(node, "^")) {
    return expandBase(node);
  } else {
    return NodeStatus.noChange(node);
  }
}

// Expand a power node with a non-constant base and a positive exponent > 1
// e.g. (nthRoot(x, 2))^2 -> nthRoot(x, 2) * nthRoot(x, 2)
// e.g. (2x + 3)^2 -> (2x + 3) (2x + 3)
function expandBase(node) {
  // Must be a power node and the exponent must be a constant
  // Base must either be an nthRoot or sum of terms
  if (!NodeType.isOperator(node, "^")) {
    return NodeStatus.noChange(node);
  }

  const base = NodeType.isParenthesis(node.args[0])
    ? node.args[0].content
    : node.args[0];

  const exponent = NodeType.isParenthesis(node.args[1])
    ? node.args[1].content
    : node.args[1];

  const exponentValue = parseFloat(exponent.value);

  // Exponent should be a positive integer
  if (!(Number.isInteger(exponentValue) && exponentValue > 1)) {
    return NodeStatus.noChange(node);
  }

  if (
    !NodeType.isFunction(base, "nthRoot") &&
    !NodeType.isOperator(base, "+")
  ) {
    return NodeStatus.noChange(node);
  }

  // If the base is an nthRoot node, it doesn't need the parenthesis
  const expandedBase = NodeType.isFunction(base, "nthRoot")
    ? base
    : node.args[0];

  const expandedNode = NodeCreator.operator(
    "*",
    Array(parseFloat(exponent.value)).fill(expandedBase)
  );

  return NodeStatus.nodeChanged(
    ChangeTypes.EXPAND_EXPONENT,
    node,
    expandedNode,
    false
  );
}

// Distributes unary minus into a parenthesis node.
// e.g. -(4*9*x^2) --> (-4 * 9  * x^2)
// e.g. -(x + y - 5) --> (-x + -y + 5)
// Returns a Status object.
function distributeUnaryMinus(node) {
  if (!NodeType.isUnaryMinus(node)) {
    return NodeStatus.noChange(node);
  }
  const unaryContent = node.args[0];
  if (!NodeType.isParenthesis(unaryContent)) {
    return NodeStatus.noChange(node);
  }
  const content = unaryContent.content;
  if (!NodeType.isOperator(content)) {
    return NodeStatus.noChange(node);
  }
  const newContent = content.cloneDeep();
  node.changeGroup = 1;
  // For multiplication and division, we can push the unary minus in to
  // the first argument.
  // e.g. -(2/3) -> (-2/3)    -(4*9*x^2) --> (-4 * 9  * x^2)
  if (content.op === "*" || content.op === "/") {
    newContent.args[0] = Negative.negate(newContent.args[0]);
    newContent.args[0].changeGroup = 1;
    const newNode = NodeCreator.parenthesis(newContent);
    return NodeStatus.nodeChanged(
      ChangeTypes.DISTRIBUTE_NEGATIVE_ONE,
      node,
      newNode,
      false
    );
  } else if (content.op === "+") {
    // Now we know `node` is of the form -(x + y + ...).
    // We want to now return (-x + -y + ....)
    // If any term is negative, we make it positive it right away
    // e.g. -(2-4) => -2 + 4
    const newArgs = newContent.args.map((arg) => {
      const newArg = Negative.negate(arg);
      newArg.changeGroup = 1;
      return newArg;
    });
    newContent.args = newArgs;
    const newNode = NodeCreator.parenthesis(newContent);
    return NodeStatus.nodeChanged(
      ChangeTypes.DISTRIBUTE_NEGATIVE_ONE,
      node,
      newNode,
      false
    );
  } else {
    return NodeStatus.noChange(node);
  }
}

// Distributes a pair of terms in a multiplication operation, if a pair
// can be distributed. To be distributed, there must be two terms beside
// each other, and at least one of them must be a parenthesis node.
// e.g. 2*(3+x) or (4+x^2+x^3)*(x+3)
// Returns a Status object with substeps
function distributeAndSimplifyMultiplication(node) {
  if (!NodeType.isOperator(node) || node.op !== "*") {
    return NodeStatus.noChange(node);
  }

  // STEP 1: distribute with `distributeTwoNodes`
  // e.g. x*(2+x) -> x*2 + x*x
  // STEP 2: simplifications of each operand in the new sum with `simplify`
  // e.g. x*2 + x*x -> ... -> 2x + x^2
  for (let i = 0; i + 1 < node.args.length; i++) {
    if (
      !isParenthesisOfAddition(node.args[i]) &&
      !isParenthesisOfAddition(node.args[i + 1])
    ) {
      continue;
    }
    let newNode = node.cloneDeep();
    const substeps = [];
    let status;

    const combinedNode = distributeTwoNodes(
      newNode.args[i],
      newNode.args[i + 1]
    );
    node.args[i].changeGroup = 1;
    node.args[i + 1].changeGroup = 1;
    combinedNode.changeGroup = 1;

    if (newNode.args.length > 2) {
      newNode.args.splice(i, 2, combinedNode);
      newNode.args[i].changeGroup = 1;
    } else {
      newNode = combinedNode;
      newNode.changeGroup = 1;
    }

    status = NodeStatus.nodeChanged(
      ChangeTypes.DISTRIBUTE,
      node,
      newNode,
      false
    );
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);

    // case 1: there were more than two operands in this multiplication
    // e.g. 3*7*(2+x)*(3+x)*(4+x) is a multiplication node with 5 children
    // and the new node will be 3*(14+7x)*(3+x)*(4+x) with 4 children.
    if (NodeType.isOperator(newNode, "*")) {
      const childStatus = simplifyWithParens(newNode.args[i]);
      if (childStatus.hasChanged()) {
        status = NodeStatus.childChanged(newNode, childStatus, i);
        substeps.push(status);
        newNode = NodeStatus.resetChangeGroups(status.newNode);
      }
    }
    // case 2: there were only two operands and we multiplied them together.
    // e.g. 7*(2+x) -> (7*2 + 7*x)
    // Now we can just simplify it.
    else if (NodeType.isParenthesis(newNode)) {
      status = simplifyWithParens(newNode);
      if (status.hasChanged()) {
        substeps.push(status);
        newNode = NodeStatus.resetChangeGroups(status.newNode);
      }
    } else {
      throw Error("Unsupported node type for distribution: " + node);
    }

    if (substeps.length === 1) {
      return substeps[0];
    }

    return NodeStatus.nodeChanged(
      ChangeTypes.DISTRIBUTE,
      node,
      newNode,
      false,
      substeps
    );
  }
  return NodeStatus.noChange(node);
}

// Distributes two nodes together. At least one node must be parenthesis node
// e.g. 2*(x+3) -> (2*x + 2*3)       (5+x)*x -> 5*x + x*x
// e.g. (5+x)*(x+3) -> (5*x + 5*3 + x*x + x*3)
// Returns a node.
function distributeTwoNodes(firstNode, secondNode) {
  // lists of terms we'll be multiplying together from each node
  let firstArgs, secondArgs;
  if (isParenthesisOfAddition(firstNode)) {
    firstArgs = firstNode.content.args;
  } else {
    firstArgs = [firstNode];
  }

  if (isParenthesisOfAddition(secondNode)) {
    secondArgs = secondNode.content.args;
  } else {
    secondArgs = [secondNode];
  }
  // the new operands under addition, now products of terms
  const newArgs = [];

  // if exactly one group contains at least one fraction, multiply the
  // non-fraction group into the numerators of the fraction group
  if ([firstArgs, secondArgs].filter(hasFraction).length === 1) {
    const firstArgsHasFraction = hasFraction(firstArgs);
    const fractionNodes = firstArgsHasFraction ? firstArgs : secondArgs;
    const nonFractionTerm = firstArgsHasFraction ? secondNode : firstNode;
    fractionNodes.forEach((node) => {
      let arg;
      if (isFraction(node)) {
        let numerator = NodeCreator.operator("*", [
          node.args[0],
          nonFractionTerm,
        ]);
        numerator = NodeCreator.parenthesis(numerator);
        arg = NodeCreator.operator("/", [numerator, node.args[1]]);
      } else {
        arg = NodeCreator.operator("*", [node, nonFractionTerm]);
      }
      arg.changeGroup = 1;
      newArgs.push(arg);
    });
  }
  // e.g. (4+x)(x+y+z) will become 4(x+y+z) + x(x+y+z) as an intermediate
  // step.
  else if (firstArgs.length > 1 && secondArgs.length > 1) {
    firstArgs.forEach((leftArg) => {
      const arg = NodeCreator.operator("*", [leftArg, secondNode]);
      arg.changeGroup = 1;
      newArgs.push(arg);
    });
  } else {
    // a list of all pairs of nodes between the two arg lists
    firstArgs.forEach((leftArg) => {
      secondArgs.forEach((rightArg) => {
        const arg = NodeCreator.operator("*", [leftArg, rightArg]);
        arg.changeGroup = 1;
        newArgs.push(arg);
      });
    });
  }
  return NodeCreator.parenthesis(NodeCreator.operator("+", newArgs));
}

function hasFraction(args) {
  return args.filter(isFraction).length > 0;
}

function isFraction(node) {
  return NodeType.isOperator(node, "/");
}

// Simplifies a sum of terms (a result of distribution) that's in parens
// (note that all results of distribution are in parens)
// e.g. 2x*(4 + x) distributes to (2x*4 + 2x*x)
// This is a separate function from simplify to make the flow more readable,
// but this is literally just a wrapper around 'simplify'.
// Returns a Status object
function simplifyWithParens(node) {
  if (!NodeType.isParenthesis(node)) {
    throw Error("expected " + node + " to be a parenthesis node");
  }

  const status = simplify(node.content);
  if (status.hasChanged()) {
    return NodeStatus.childChanged(node, status);
  } else {
    return NodeStatus.noChange(node);
  }
}

// Simplifies a sum of terms that are a result of distribution.
// e.g. (2x+3)*(4x+5) -distribute-> 2x*(4x+5) + 3*(4x+5) <- 2 terms to simplify
// e.g. 2x*(4x+5) --distribute--> 2x*4x + 2x*5 --simplify--> 8x^2 + 10x
// Returns a Status object.
function simplify(node) {
  const substeps = [];
  const simplifyFunctions = [
    arithmeticSearch, // e.g. 2*9 -> 18
    rearrangeCoefficient, // e.g. x*5 -> 5x
    collectAndCombineSearch, // e.g 2x*4x -> 8x^2
    distributeAndSimplifyMultiplication, // e.g. (2+x)(3+x) -> 2*(3+x) recurses
  ];

  let newNode = node.cloneDeep();
  for (let i = 0; i < newNode.args.length; i++) {
    for (let j = 0; j < simplifyFunctions.length; j++) {
      const childStatus = simplifyFunctions[j](newNode.args[i]);
      if (childStatus.hasChanged()) {
        const status = NodeStatus.childChanged(newNode, childStatus, i);
        substeps.push(status);
        newNode = NodeStatus.resetChangeGroups(status.newNode);
      }
    }
  }

  // possible in cases like 2(x + y) -> 2x + 2y -> doesn't need simplifying
  if (substeps.length === 0) {
    return NodeStatus.noChange(node);
  } else {
    return NodeStatus.nodeChanged(
      ChangeTypes.SIMPLIFY_TERMS,
      node,
      newNode,
      false,
      substeps
    );
  }
}

// returns true if `node` is of the type (node + node + ...)
function isParenthesisOfAddition(node) {
  if (!NodeType.isParenthesis(node)) {
    return false;
  }
  const content = node.content;
  return NodeType.isOperator(content, "+");
}

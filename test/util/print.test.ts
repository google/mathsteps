import * as math from "mathjs";

import { TestUtil } from "../TestUtil";
import { NodeCreator } from "../../lib/src/node/Creator";
import { printAscii, printLatex } from "../../lib/src/util/print";

// to create nodes, for testing
const opNode = NodeCreator.operator;
const constNode = NodeCreator.constant;
const symbolNode = NodeCreator.symbol;

function testPrintStr(exprStr, outputStr) {
  const input = math.parse(exprStr);
  TestUtil.testFunctionOutput(printAscii, input, outputStr);
}

function testLatexPrintStr(exprStr, outputStr) {
  const input = TestUtil.parseAndFlatten(exprStr);
  TestUtil.testFunctionOutput(printLatex, input, outputStr);
}

function testPrintNode(node, outputStr) {
  TestUtil.testFunctionOutput(printAscii, node, outputStr);
}

describe("printAsciimath", function () {
  const tests = [
    ["2+3+4", "2 + 3 + 4"],
    ["2 + (4 - x) + - 4", "2 + (4 - x) - 4"],
    ["2/3 x^2", "2/3 x^2"],
    ["-2/3", "-2/3"],
  ];
  tests.forEach((t) => testPrintStr(t[0], t[1]));
});

describe("print latex", function () {
  const tests = [
    ["2+3+4", "2+3+4"],
    ["2 + (4 - x) - 4", "2+\\left(4 -  x\\right) - 4"],
    ["2/3 x^2", "\\frac{2}{3}~{ x}^{2}"],
    ["-2/3", "\\frac{-2}{3}"],
    ["2*x+4y", "2~ x+4~ y"],
  ];
  tests.forEach((t) => testLatexPrintStr(t[0], t[1]));
});

describe("print with parenthesis", function () {
  const tests = [
    [
      opNode("*", [opNode("+", [constNode(2), constNode(3)]), symbolNode("x")]),
      "(2 + 3) * x",
    ],
    [
      opNode("^", [opNode("-", [constNode(7), constNode(4)]), symbolNode("x")]),
      "(7 - 4)^x",
    ],
    [
      opNode("/", [opNode("+", [constNode(9), constNode(2)]), symbolNode("x")]),
      "(9 + 2) / x",
    ],
  ];
  tests.forEach((t) => testPrintNode(t[0], t[1]));
});

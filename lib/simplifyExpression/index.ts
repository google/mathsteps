import * as math from "mathjs";
import { stepThrough } from "./stepThrough";

export function simplifyExpression(expressionString, debug = false) {
  let exprNode;
  try {
    exprNode = math.parse(expressionString);
  } catch (err) {
    return [];
  }
  if (exprNode) {
    return stepThrough(exprNode, debug);
  }
  return [];
}

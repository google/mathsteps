import * as math from "mathjs";
import { stepThrough } from "./stepThrough";

export function factorString(expressionString, debug = false) {
  let node;
  try {
    node = math.parse(expressionString);
  } catch (err) {
    return [];
  }

  if (node) {
    return stepThrough(node, debug);
  }
  return [];
}

import * as math from "mathjs";
import { stepThrough } from "./stepThrough";
import { emptyResponse } from "../util/empty-response";

export function factorString(expressionString, debug = false) {
  try {
    const node = math.parse(expressionString);
    if (node != null) {
      return stepThrough(node, debug);
    } else {
      return emptyResponse();
    }
  } catch (err) {
    return emptyResponse();
  }
}

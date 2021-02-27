import { MathNode } from "mathjs";

/**
 * Extension of the mathjs MathNode, because that doesn't seem to contain all fields
 * */
export interface StepNode extends MathNode {
  implicit?: boolean;
  args?: StepNode[];
  expression: StepNode;
}

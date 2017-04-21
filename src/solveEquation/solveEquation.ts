module solveEquation{
export function solveEquationString(equationString: string, debug=false) {
    const comparators = ['<=', '>=', '=', '<', '>'];

  for (let i of comparators) {
    const sides = equationString.split(i);
    if (sides.length !== 2) {
      continue;
    }
    let leftNode: mathjs.MathNode, rightNode: mathjs.MathNode;
    const leftSide = sides[0].trim();
    const rightSide = sides[1].trim();

    if (!leftSide || !rightSide) {
      return [];
    }

    try {
      leftNode = math.parse(leftSide);
      rightNode = math.parse(rightSide);
    }
    catch (err) {
      return [];
    }
    if (leftNode && rightNode) {
      return stepThrough(leftNode, rightNode, comparator, debug);
    }
  }

  return [];
}
}
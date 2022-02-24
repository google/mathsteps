export = Equation;
declare class Equation {
    constructor(leftNode: any, rightNode: any, comparator: any);
    leftNode: any;
    rightNode: any;
    comparator: any;
    ascii(showPlusMinus?: boolean): string;
    latex(showPlusMinus?: boolean): string;
    clone(): Equation;
}
declare namespace Equation {
    function createEquationFromString(str: any, comparator: any): Equation;
}
//# sourceMappingURL=Equation.d.ts.map
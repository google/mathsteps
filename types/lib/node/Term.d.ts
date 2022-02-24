export = Term;
declare class Term {
    constructor(node: any, baseNodeFunc: any, onlyImplicitMultiplication?: boolean);
    base: any;
    exponent: any;
    coeff: any;
    getBaseNode(): any;
    getCoeffNode(defaultOne?: boolean): any;
    getCoeffValue(): any;
    getExponentNode(defaultOne?: boolean): any;
    hasFractionCoeff(): boolean;
    hasCoeff(): boolean;
}
declare namespace Term {
    function isTerm(node: any, baseNodeFunc: any, onlyImplicitMultiplication?: boolean): boolean;
    function parseNode(node: any, baseNodeFunc: any, onlyImplicitMultiplication: any): any;
}
//# sourceMappingURL=Term.d.ts.map
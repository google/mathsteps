export = PolynomialTerm;
declare class PolynomialTerm extends Term {
    constructor(node: any, onlyImplicitMultiplication?: boolean);
    getSymbolNode(): any;
    getSymbolName(): any;
}
declare namespace PolynomialTerm {
    function baseNodeFunc(node: any): any;
    function isPolynomialTerm(node: any, onlyImplicitMultiplication?: boolean): boolean;
}
import Term = require("./Term");
//# sourceMappingURL=PolynomialTerm.d.ts.map
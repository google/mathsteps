export = NthRootTerm;
declare class NthRootTerm extends Term {
    constructor(node: any, onlyImplicitMultiplication?: boolean);
}
declare namespace NthRootTerm {
    function baseNodeFunc(node: any): boolean;
    function isNthRootTerm(node: any, onlyImplicitMultiplication?: boolean): boolean;
}
import Term = require("./Term");
//# sourceMappingURL=NthRootTerm.d.ts.map
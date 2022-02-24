export = Status;
declare class Status {
    constructor(changeType: any, oldEquation: any, newEquation: any, substeps?: any[]);
    changeType: string;
    oldEquation: any;
    newEquation: any;
    substeps: any[];
    hasChanged(): boolean;
}
declare namespace Status {
    function noChange(equation: any): Status;
    function addLeftStep(equation: any, leftStep: any): Status;
    function addRightStep(equation: any, rightStep: any): Status;
    function resetChangeGroups(equation: any): Equation;
}
import Equation = require("./Equation");
//# sourceMappingURL=Status.d.ts.map
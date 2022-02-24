export = Status;
declare class Status {
    constructor(changeType: any, oldNode: any, newNode: any, substeps?: any[]);
    changeType: string;
    oldNode: any;
    newNode: any;
    substeps: any[];
    hasChanged(): boolean;
}
declare namespace Status {
    function resetChangeGroups(node: any): any;
    function noChange(node: any): Status;
    function nodeChanged(changeType: any, oldNode: any, newNode: any, defaultChangeGroup?: boolean, steps?: any[]): Status;
    function childChanged(node: any, childStatus: any, childArgIndex?: any): Status;
}
//# sourceMappingURL=Status.d.ts.map
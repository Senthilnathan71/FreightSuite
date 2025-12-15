export interface BLClause {
    BLClauseMasterSid?: number; // Optional for create operations
    DepartmentMasterSid: number;
    ClauseDescription: string;
    Keyword: string;
    Sortorder?: number | null;
    DefaultClause?: string;
    createdOn?: Date;
    updatedOn?: Date | null;
    // deletedAt?: Date | null;
    createdBy: string;
    updatedBy?: string | null;
    status?: string; 
}
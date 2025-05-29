export interface BLClause {
    BLClauseMasterSid?: number; // Optional for create operations
    ClauseDescription: string;
    Keyword: string;
    Sortorder?: number | null;
    DefaultClause?: number | null;
    createdOn?: Date;
    updatedOn?: Date | null;
    deletedAt?: Date | null;
    createdBy: string;
    updatedBy?: string | null;
    status?: string; 
}
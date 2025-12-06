export interface DocumentSearchResult {
    id: number;
    documentNumber: string;
    documentType: string;
    displayType: string;
    path: string;
    title: string;
}

export interface DocumentSearchPayload {
    search: string;
    CompanyMasterSid: number;
    BranchMasterSid: number;
    limit?: number;
}

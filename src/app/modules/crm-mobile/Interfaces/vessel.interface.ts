export interface Vessel {
    VesselMasterSid?: number,
    VesselName: string,
    VesselShortCode: string,
    IMOCode: string,
    CallSignIn: string,
    YearofBuilt: number,
    MMSINo: number,
    GRT: number,
    NRT: number,
    VesselType: string,
    VesselOperator: string,
    LengthinMtr: number,
    BreadthinMtr: number,
    Remarks: string,
    createdOn: Date,
    updatedOn?: Date,
    deletedAt?: Date
    createdBy: string,
    updatedBy?: string,
    status?: string
}
export interface Charge {
    chargeCode: string;
    chargeName: string;
    UOM: number;
    createdOn: Date;
    updatedOn: Date;
    deletedAt?: Date;
    createdBy: string;
    updatedBy?: string;
    Remarks: string;
    Status: string;
    ChargeGroupSid: number;
    ChargeMasterSid: number;
    CompanyMasterSid?: number;
    CurrencyMasterSid: number;
    DepartmentMasterSid: number;
    chargeGroup?: {
        chargeGroupName: string;
    };
    companyMaster?: {
        companyName: string;
    };
    currencyMaster?: {
        currencyName: string;
    };
    departmentMaster?: {
        departmentName: string;
    };
}
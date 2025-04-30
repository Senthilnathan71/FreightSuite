export interface State {
    StateMasterSid: number,
    CountryMasterSid: number,
    stateCode: string,
    stateGSTCode: string,
    stateName: string,
    LoginSid: number,
    createdBy: string,
    updatedBy: string,
    status: string,
    createdOn: string,
    updatedOn: string,
    Remarks: string,
    region: string,
    zone: number,
    countryMaster: {
        countryName: string;
    }
    
}
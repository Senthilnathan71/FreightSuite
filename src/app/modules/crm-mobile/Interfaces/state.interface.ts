export interface State {
    data: any;
    StateMasterSid: number,
    CountryMasterSid: number,
    ZoneMasterSid?: number,
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
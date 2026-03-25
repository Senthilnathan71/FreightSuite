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
    status: 'A' | 'S';
    createdOn: string,
    updatedOn: string,
    Remarks: string,
    region: string,
    IsUnionTerritory: 'N' | 'Y',
    
    countryMaster: {
        countryName: string;
    }
    zoneMaster: {
        zone: number,
    }


}
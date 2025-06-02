export interface Country {
    [x: string]: any;
    id: any;
    CountryMasterSid: number,
    countryCode: string,
    countryName: string,
    ZoneMasterSid?: number;
    CurrencyMasterSid?: number,
    LoginSid: string,
    createdBy: string,
    updatedBy: string,
    status: string,
    createdOn: string,
    updatedOn: string
    zoneMaster: {
        zoneName: number,
    }
    currencyMaster: {
        currencyName: number,
    }

}
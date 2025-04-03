export interface Port {
    PortCode: String,
    PortName: String,
    SectorMasterSid: number,
    TimeZone: String,
    EdiPortCode: String,
    ExportRestriction: String,
    ImportRestriction: String,
    PortType: String,
    TerminalCode: string,
    Remarks: String,
    CBMRequire: string,
    SCMTPortCode: string,
    CountryMasterSid: number,
    LoginSid: number,
    PortMasterSid: number,
    StateMasterSid: number,
    countryMaster: {
        countryName: string;
      }, 
    sectorMaster : {
        sectorName: string;
      },
    stateMaster : {
        stateName: string;
      },
    createdOn: string,
    createdBy: string,
    updatedOn: string,
    updatedBy: string,
    status: string
}
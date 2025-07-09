export interface CurrencyExchange {
    branchMaster: any;
    companyMaster: any;
    CurrencyExchangeSid: number;
    EffectiveFrom: Date | string;
    FromCurrency: string;
    ToCurrency: string;
    RateFrom?: string;  
    SellRate: number;
    BuyRate: number;
    BankName: string;
    CompanyMasterSid: number;
    BranchMasterSid: number;
    createdBy: string;
    updatedBy: string;
    status: string;
    Remarks: string;
    createdOn: string;
    updatedOn: string;
    deletedAt?: string;
    
}
export interface IVoucherMatchingHeader {
    VoucherMatchingHeaderSid: number;
    CreatedOn: Date;
    CreatedBy: string;
    UpdatedOn: Date;
    UpdatedBy: string;
    Status: string;
    CompanyMasterSid: number;
    BranchMasterSid: number;
    VoucherMatchingNo: string;
    VoucherMatchingDate: Date;
    Narration: string;
    Remarks: string;
    VoucherHeaderSid: number;
    SubledgerName: string;
    MatchingDetail: IMatchingDetail[];
    voucherMatchings: IVoucherMatching[];

    PostDate?: Date;
}
// Example for createVoucherMatchingHeaderDto
// const payload = {
//     CreatedBy : 'ffadmin@crm.com',
//     Status : 'A',
//     CompanyMasterSid : 1,
//     BranchMasterSid : 1,
//     VoucherMatchingDate : new Date(),
//     Narration : 'Being',
//     Remarks : 'NA',
//     SubledgerName : 'DOFI LOGISTICS',
//     MatchingDetail : [{...}],
//     voucherMatchings : [{...}]
// }
export type createVoucherMatchingDto =
    Omit<IVoucherMatchingHeader,
        'VoucherMatchingHeaderSid' |
        'VoucherMatchingNo' |
        'CreatedOn' |
        'UpdatedOn' |
        'UpdatedBy' |
        'Narration' |
        'Remarks' |
        'VoucherHeaderSid'
    >;

// Example for updateVoucherMatchingHeaderDto
// const payload = {
//     UpdatedBy : 'ffadmin@crm.com',
//     Status : 'A',
//     CompanyMasterSid : 1,
//     BranchMasterSid : 1,
//     VoucherMatchingNo : '1234567890',
//     VoucherMatchingDate : new Date(),
//     Narration : 'Being',
//     Remarks : 'NA',
//     SubledgerName : 'DOFI LOGISTICS',
// }
export type updateVoucherMatchingDto =
    Omit<IVoucherMatchingHeader,
        'VoucherMatchingHeaderSid' |
        'CreatedOn' |
        'CreatedBy' |
        'VoucherMatchingNo' |
        'Narration' |
        'Remarks' |
        'VoucherHeaderSid'
    >;

export type VoucherMatchingHeaderResponse = IVoucherMatchingHeader;


export interface IVoucherMatching {
    CreatedOn: Date;
    CreatedBy: string;
    UpdatedOn: Date;
    UpdatedBy: string;
    Status: string;

    VoucherMatchingSid: number;
    Sno: number;
    CompanyMasterSid: number;
    BranchMasterSid: number;
    VoucherMatchingHeaderSid: number;
    VoucherHeaderSid: number;
    VoucherDetailSid: number;
    VoucherTransactionSid: number;
    VoucherMatchingDate: Date;
    VoucherType: number;
    COAMasterSid: number;
    LedgerMasterSid: number;
    CurrencyCode: string;
    ExchangeRate: number;
    DrCr: string;
    Amount: number;
    LocalAmount: number;
    PartyAmount: number;

    MatchingType: string;
    MatchingTransactionSid: number;
    // Relations
    branch?: any;
    CoaMaster?: any;
    company?: any;
    subledgerMaster?: any;
    VoucherDetail?: any;
    VoucherHeader?: any;
    header?: IVoucherMatchingHeader;
    VoucherTransaction?: any;
}

export type VoucherMatchingDto =
    Omit<IVoucherMatching,
        'VoucherMatchingSid' |
        'CreatedOn' |
        'UpdatedOn' |
        'UpdatedBy'
    >;

export interface IMatchingDetail {
    BranchName?: string;

    MatchingDetailSid: number;
    Sno: number;
    VoucherMatchingHeaderSid?: number;
    VoucherHeaderSid: number;
    VoucherDetailSid: number;
    VoucherTransactionSid: number;
    VoucherType: string;
    CurrencyCode: string;
    ExchangeRate: number;
    DrCr: string;
    Amount: number;
    LocalAmount: number;
    PartyAmount : number;

    MatchingCurrency?: number;
    MatchingExRate?: number;
    MatchingAmount?: number;
    MatchingLocalAmount: number;
    MatchingTDSAmount?: number;

    SourceVoucherHeaderSid: number;
    // Relations
    VoucherMatchingHeader?: IVoucherMatchingHeader;
    currencyMaster?: any;
    SourceVoucherHeader?: any;
    VoucherHeader?: any;
    VoucherTransaction?: any;
}
// Fetch VoucherMatching By Id response
export interface VoucherMatchingFetchResponse {
  VoucherMatchingHeaderSid : number;
  CreatedOn : Date;
  CreatedBy : string;
  UpdatedOn : Date;
  UpdatedBy : string;
  Status : string;
  CompanyMasterSid : number;
  BranchMasterSid : number;
  VoucherMatchingNo : string;
  VoucherMatchingDate : Date;
  Narration : string;
  Remarks : string;
  VoucherHeaderSid : number;
  LedgerName : string;
  SubledgerName : string;
  voucherMatchings : OutstandingForTransactionDto[]
}

export class OutstandingForTransactionDto {
  VoucherMatchingSid : number;
  MatchingDetailSid : number;
  Sno : number;
  VoucherMatchingHeaderSid : number;
  VoucherHeaderSid : number;
  VoucherDetailSid : number;
  VoucherTransactionSid : number;
  VoucherNumber : string;
  VoucherType : string;
  VoucherDate : Date;
  DrCr : string;
  CurrencyCode : string;
  ExchangeRate : number;
  OriginalCurrencyAmount : number;
  OriginalLocalAmount : number;
  OutstandingCurrencyAmount : number;
  OutstandingLocalAmount : number;
  MatchingCurrencyAmount : number;
  MatchingLocalAmount : number;
}
export interface HouseJobBoe {
  HouseJobBOESid: number;
  CreatedOn: string;
  CreatedBy: string;
  UpdatedOn: string;
  UpdatedBy?: string;
  Status: string;
  CompanyMasterSid: number;
  HouseJobSid: number;
  Sno: number;
  DeclarationNo: string;
  BOENo: string;
  BOEDate?: string | null;
  BOEValue?: number | null;
  BOEInvoiceValue?: number | null;
  TransactionType?: string | null;
  Amount?: number | null;
  ProcessDate?: string | null;
  ReceivedDate?: string | null;
  AckNumber?: string | null;
  AckDate?: string | null;
  AckStatus?: string | null;
  Remarks?: string | null;
}

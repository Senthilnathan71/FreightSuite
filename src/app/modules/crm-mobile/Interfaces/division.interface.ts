export interface Division {
  DivisionMasterSid: number;
  DivisionName: string;
  DivisionCode: string;
  CompanyMasterSid: string;
  // address: string;
  Remarks: string;
  status: 'A' | 'I';
  createdBy: string;
  updatedBy: string;
  createdOn: string;
  updatedOn: string;
}

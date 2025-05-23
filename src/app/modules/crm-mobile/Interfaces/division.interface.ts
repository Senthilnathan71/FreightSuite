export interface Division {
  DivisionMasterSid: number;
  divisionName: string;
  divisionCode: string;
  address: string;
  remarks: string;
  status: 'A' | 'I';
  createdBy: string;
  updatedBy: string;
  createdOn: string;
  updatedOn: string;
}

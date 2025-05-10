export interface Zone {
  ZoneMasterSid?: number;
  ZoneCode: string;
  ZoneName: string;
  createdOn?: Date;
  updatedOn?: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  status?: string;
}

export interface PackageType {
  PackageTypeMasterSid?: number;
  CompanyMasterSid?: number;
  PackageName: string;
  PackageCode: string;
  createdOn?: Date;
  updatedOn?: Date;
  // deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  status?: string;
}

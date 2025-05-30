export interface Commodity {
  ContainerVentRequired: boolean;
  Haz: boolean;
  Perishable: boolean;
  Flamable: boolean;
  Timber: boolean;
  CommodityMasterSid: number;
  CommodityCode: string;
  CommodityName: string;
  CommodityNameLL?: string;
  UOMSid?: number;
  ImcoName?: string;
  UNNo?: string;
  PackingGroup?: string;
  CommodityType?: string;
  HSSACCode?: number;
  FlashPoint?: string;
  createdOn: Date;
  updatedOn?: Date;
  deletedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  status?: 'A' | 'S';
  Remarks: string;
}
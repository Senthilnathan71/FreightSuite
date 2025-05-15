export interface Commodity {
  CommodityMasterSid: number;
  CommodityCode: string;
  CommodityName: string;
  CommodityNameLL?: string;
  UOMSid?: number | null;
  ImcoName?: string | null;
  UNNo?: string | null;
  PackingGroup?: string | null;
  CommodityType?: 'General' | 'Haz' | 'Reefer' | null;
  HSSACCode?: number | null;
  FlashPoint?: string | null;
  createdOn: Date;
  updatedOn?: Date | null;
  deletedAt?: Date | null;
  createdBy: string;
  updatedBy?: string | null;
  status: 'A' | 'I';
  Remarks: string;
}

export interface CommodityForm {
  CommodityCode: string;
  CommodityName: string;
  CommodityNameLL?: string;
  UOMSid?: number | null;
  ImcoName?: string | null;
  UNNo?: string | null;
  PackingGroup?: string | null;
  CommodityType?: 'General' | 'Haz' | 'Reefer' | null;
  HSSACCode?: number | null;
  FlashPoint?: string | null;
  status: 'A' | 'I';
  Remarks?: string;
}
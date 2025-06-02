export interface Sector {
    SectorMasterSid: number,
    sectorCode: String,
    sectorName: string,
    RegionName?: string | null;
  RegionCode?: string | null;
    // LoginSid: string,
    createdBy: string,
    updatedBy: string,
    status: string
    // createdOn: string,
    // updatedOn: string
}
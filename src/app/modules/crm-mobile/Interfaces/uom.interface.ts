export interface Uom {
    UOMMasterSid: number,
    UOMCode: string,
    UOMName: string,
    UOMType: string,
    EdiCode: string,
    DimensionReq: string,
    WeightReq: string,
    VolumeReq: string,
    ShipmentType: string,
    CostPerUnitPrice: number,
    SlabFrom: number,
    SlabTo: number,
    createdBy: string,
    updatedBy: string,
    status: string,
    createdOn: string,
    updatedOn: string
}
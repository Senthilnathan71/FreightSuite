export const DROPDOWN_CONFIGS = {
  CUSTOMER: {
    displayFields: ['CustomerName','BranchName','Address'],
    displayLabels: ['Customer','Branch','Address'],
    labelFields: ['CustomerName']
  },
  ZONE: {
    displayFields: ['ZoneName', 'ZoneCode'],
    displayLabels: ['Zone Name', 'Zone Code'],    
    labelFields: ['ZoneName']
  },
  PORT :{
    displayFields : ['PortCode', 'PortName','Country'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['PortName','PortCode']
  },
  CHARGE : {
    displayFields : ['chargeCode','chargeName'],
    displayLabels : ['Code','Name'],
    labelFields :['chargeCode']
  },
  UOM :{
    displayFields : ['UOMCode','UOMName'],
    displayLabels : ['Code','Name'],
    labelFields :['UOMCode']
  },
  DEPARTMENT : {
    displayFields : ['departmentCode','departmentName','departmentType'],
    displayLabels : ['Code','Name','Type'],
    labelFields :['departmentName']
  },
  COUNTRY: {
    displayFields: ['countryCode', 'countryName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['countryName']
  },
  STATE: {
    displayFields: ['stateName', 'Country'],
    displayLabels: ['State', 'Country'],    
    labelFields: ['stateName']
  },
  CITY: {
    displayFields: ['cityName', 'State', 'Country'],
    displayLabels: ['City', 'State', 'Country'],
    labelFields: ['cityName']
  },
  INCO : {
    displayFields: ['IncoCode', 'IncoName', 'OceanFreight'],
    displayLabels: ['Code', 'Name', 'P/C'],
    labelFields: ['IncoCode']
  },
  CONTAINER_TYPE : {
    displayFields: ['ContainerCode', 'ContainerName', 'ContainerSize'],
    displayLabels: ['Code', 'Name', 'Size'],
    labelFields: ['ContainerName']
  },
  IMCO : {
    displayFields: ['ImcoName', 'ImcoUn', 'PackingGroup'],
    displayLabels: ['Name', 'UN No', 'Packing Group'],
    labelFields: ['ImcoClass']
  },
  VESSEL_VOYAGE : {
    displayFields: ['VesselName', 'VoyageNo','ETD','ETA'],
    displayLabels: ['Vessel Name', 'Voyage No','ETD','ETA'],
    labelFields: ['VesselName','VoyageNo']
  },
  HSSAC: {
    displayFields: ['HSSACCode', 'HSSACName'],
    displayLabels: ['HSSAC Code', 'HSSAC Name'],  
    labelFields: ['HSSACCode']
  },
  CURRENCY : {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  },
  COA_LEDGER: {
    displayFields: ['LedgerCode', 'LedgerName', 'SubGroupName'],
    displayLabels: ['Code', 'Name', 'SubGroup'],
    labelFields: ['LedgerName']
  }
} satisfies Record<string, {
  displayFields: string[];
  displayLabels: string[];
  labelFields: string[];
}>;
export const DROPDOWN_CONFIGS = {
  CUSTOMER: {
    displayFields: ['CustomerName','BranchName','Address'],
    displayLabels: ['Customer','Branch','Address'],
    labelFields: ['CustomerName']
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
    displayFields: ['CityName', 'State', 'Country'],
    displayLabels: ['City', 'State', 'Country'],
    labelFields: ['CityName']
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
} satisfies Record<string, {
  displayFields: string[];
  displayLabels: string[];
  labelFields: string[];
}>;
export const DROPDOWN_CONFIGS = {
  CUSTOMER: {
    displayFields: ['CustomerName','BranchName','Address'],
    displayLabels: ['Customer','Branch','Address'],
    labelFields: ['CustomerName']
  },
  PORT :{
    displayFields : ['PortCode', 'PortName','Country'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['PortCode']
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
    displayLabels : ['Code','Name','type'],
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
} satisfies Record<string, {
  displayFields: string[];
  displayLabels: string[];
  labelFields: string[];
}>;
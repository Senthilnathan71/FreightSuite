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
  }
} satisfies Record<string, {
  displayFields: string[];
  displayLabels: string[];
  labelFields: string[];
}>;
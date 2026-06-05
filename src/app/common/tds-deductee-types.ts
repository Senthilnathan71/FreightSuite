// CBDT deductee classification used to filter TDSSetRate rows and classify vendors.
// Keep this list aligned with the master values stored in CustomerMaster.CompanyType
// and TDSSetRate.CompanyType.
export const TDS_DEDUCTEE_TYPES = [
  { id: '1', name: 'Artificial Juridical Person' },
  { id: '2', name: 'Association Of Persons(AOP)' },
  { id: '3', name: 'Body Of Individuals' },
  { id: '4', name: 'Company' },
  { id: '5', name: 'Firm' },
  { id: '6', name: 'Government Agency' },
  { id: '7', name: 'Hindu Undivided Family' },
  { id: '8', name: 'Individual(proprietor)' },
  { id: '9', name: 'Limited Liability Partnership(LLP)' },
  { id: '10', name: 'Local Authority' },
  { id: '11', name: 'Trust' },
  { id: '12', name: 'Others' },
] as const;

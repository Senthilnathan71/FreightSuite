export enum LeadStatus {
  Qualify = 'Qualify',
  Discovery = 'Discovery',
  MeetingScheduled = 'MeetingScheduled',
  MeetingCompleted = 'MeetingCompleted',
  EnquiryGenerated = 'EnquiryGenerated',
  QuotationCreated = 'QuotationCreated',
  QuotationConfirmed = 'QuotationConfirmed',
  ContractSigned = 'ContractSigned',
  DealWon = 'DealWon',
  DealLost = 'DealLost'
}


// Optional: map to readable labels
export const LeadStatusLabels: Record<LeadStatus, string> = {
  [LeadStatus.Qualify]: 'Qualify',
  [LeadStatus.Discovery]: 'Discovery',
  [LeadStatus.MeetingScheduled]: 'Meeting Scheduled',
  [LeadStatus.MeetingCompleted]: 'Meeting Completed',
  [LeadStatus.EnquiryGenerated]: 'Enquiry Generated',
  [LeadStatus.QuotationCreated]: 'Quotation Created',
  [LeadStatus.QuotationConfirmed]: 'Quotation Confirmed',
  [LeadStatus.ContractSigned]: 'Contract Signed',
  [LeadStatus.DealWon]: 'Deal Won',
  [LeadStatus.DealLost]: 'Deal Lost'
};
export interface PlaceholderVariable {
  key: string;
  label: string;
}

export const ALL_PLACEHOLDERS: PlaceholderVariable[] = [
  { key: 'EnquiryNo', label: 'Enquiry Number' },
  { key: 'quotationNumber', label: 'Quotation Number' },
  { key: 'BookingNo', label: 'Booking Number' },
  { key: 'ShipmentNo', label: 'Shipment Number' },
  { key: 'date', label: 'Date' },
  { key: 'POO', label: 'Place of Origin' },
  { key: 'POL', label: 'Port of Loading' },
  { key: 'POD', label: 'Port of Discharge' },
  { key: 'FPD', label: 'Final Place of Delivery' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'shipperName', label: 'Shipper Name' },
  { key: 'consigneeName', label: 'Consignee Name' },
  { key: 'userName', label: 'User Name' },
  { key: 'toEmail', label: 'To Email' },
  { key: 'menumail', label: 'Menu Mail' },
  { key: 'ccEmail', label: 'CC Email' },
  { key: 'userEmail', label: 'User Email' },
  { key: 'approvalLink', label: 'Approval Link' },
];

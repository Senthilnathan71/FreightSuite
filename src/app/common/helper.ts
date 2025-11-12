import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { Port } from "../modules/crm-mobile/Interfaces/port.interface";

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

export enum AuthorizationStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Counter = 'Counter'
}

export const AuthorizationStatusLabels: Record<AuthorizationStatus, string> = {
  [AuthorizationStatus.Pending]: 'Waiting for Approval',
  [AuthorizationStatus.Approved]: 'Approved',
  [AuthorizationStatus.Rejected]: 'Rejected',
  [AuthorizationStatus.Counter]: 'Counter'
};

export enum Status {
  Active = 'A',
  Suspended = 'S',
  Deleted = 'D',
}

/**
 * Retrieves and formats a port's name and code from a given list of ports.
 *
 * @param {Port[]} portList - The complete list of port objects.
 * Each port object must include at least `PortMasterSid`, `PortName`, and `PortCode` properties.
 * @param {number} PortMasterSid - The unique identifier (`PortMasterSid`) of the port to locate and format.
 * @returns {string} A formatted string in the format `"PortName - PortCode"`.
 * Returns an empty string (`''`) if:
 * - The `portList` is empty or undefined
 * - The `PortMasterSid` is invalid or not found in the list
 *
 * @example
 * const ports = [
 *   { PortMasterSid: 1, PortName: 'Chennai', PortCode: 'INMAA' },
 *   { PortMasterSid: 2, PortName: 'Mumbai', PortCode: 'INBOM' },
 * ];
 *
 * const result = getFormattedPort(ports, 2);
 * console.log(result); // "Mumbai - INBOM"
 */
export function getFormattedPort(portList: Port[], PortMasterSid: number): string {
  if (!PortMasterSid || portList.length === 0) {
    return '';
  }
  const ourPort = portList.find(p => p.PortMasterSid === PortMasterSid);
  return getConcatenatedPorts(ourPort?.PortName, ourPort?.PortCode);
}

/**
 * Concatenates a port's name and code into a formatted string.
 *
 * @param {string} portName - The name of the port.
 * @param {string} portCode - The code of the port.
 * @returns {string} A string formatted as `"PortName - PortCode"`.
 * Returns an empty string (`''`) if `portName` is missing or undefined.
 *
 * @example
 * const result = getConcatenatedPorts('Chennai', 'INMAA');
 * console.log(result); // "Chennai - INMAA"
 */
export function getConcatenatedPorts(portName: String, portCode: String): string {
  return portName ? `${portName} - ${portCode}` : '';
}

// Converts a JS Date to NgbDateStruct
export function toNgbDateStruct(date: Date | null): NgbDateStruct | null {
  if (!date) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}
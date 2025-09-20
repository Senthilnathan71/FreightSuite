export interface Salesperson {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface DashboardMetrics {
  leadsWithoutSchedule: number;
  meetingsScheduled: {
    overdue: number;
    today: number;
    future: number;
  };
  meetingsConductedNotConverted: number;
  customersWithoutQuoteOrBooking: number;
  quotesWithoutBooking: number;
}

export interface SalesMetrics {
  newClientCreated: number;
  salesCall: number;
  salesCallClosed: number;
  quotationCreated: number;
  quotationApproved: number;
  bookingQuotation: number;
}

export interface CustomerServiceMetrics {
  documentsVerified: number;
  customsClearances: number;
  shipmentsInTransit: number;
  deliveriesCompleted: number;
  pendingActions: number;
  customerQueries: number;
}

export interface ClientMeeting {
  id: string;
  client: string;
  agenda: string;
  meetingType: string;
  salesperson: string;
  date: Date;
  status: 'Pending' | 'Scheduled Today' | 'Completed' | 'Overdue';
}

export interface MeetingWithFollowup {
  id: string;
  client: string;
  salesperson: string;
  meetingType: string;
  meetingDate: Date;
  followupType: 'Email Recap' | 'Call Follow-up' | 'Demo Scheduled' | 'Proposal Sent' | 'Contract Review' | 'Quote Follow-up';
  followupDate: Date;
}

export interface RateRequest {
  id: string;
  rateRequestNumber: string;
  date: Date;
  quotationNumber: string;
  quoteDate: Date;
  salesperson: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  bookingNumber?: string;
  client: string;
  amount?: number;
}

export interface TodaysActivity {
  id: string;
  bookingNumber: string;
  jobNumber: string;
  activity: string;
  date: Date;
  status: 'Completed' | 'In Progress' | 'Pending';
}

export interface ApprovedQuotation {
  id: string;
  quotationNumber: string;
  status: 'Approved';
  approvedBy: string;
  date: Date;
  option: string;
}

export interface BookingListItem {
  id: string;
  bookingNumber: string;
  jobNumber: string;
  shipmentStatus: string;
  date: Date;
  pol: string;
  pod: string;
  salesperson: string;
  assignedTo: string;
  invoicing: 'Yes' | 'No';
}

export interface DashboardFilters {
  salesperson?: string;
  dateFrom?: Date;
  dateTo?: Date;
  userType?: 'sales' | 'customer-service';
}

export interface DashboardData {
  metrics: DashboardMetrics;
  salesMetrics: SalesMetrics;
  customerServiceMetrics: CustomerServiceMetrics;
  clientMeetings: ClientMeeting[];
  meetingsWithFollowup: MeetingWithFollowup[];
  rateRequests: RateRequest[];
  todaysActivities: TodaysActivity[];
  approvedQuotations: ApprovedQuotation[];
  bookingList: BookingListItem[];
  salespeople: Salesperson[];
}
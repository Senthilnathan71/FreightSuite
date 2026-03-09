// ── Filters ──

export interface SalesDashboardFilters {
  salespersonId?: number;
  dateFrom?: string;
  dateTo?: string;
}

// ── Section 1: Leads No Meeting ──

export interface LeadNoMeeting {
  PreCustomerMasterSid: number;
  preCustomerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadStatus: string;
  leadFrom: string;
  customerType: string;
  leadAssignTo: number;
  salespersonName: string;
  createdOn: string;
  daysIdle?: number;
}

// ── Section 2: Meetings Scheduled ──

export interface ScheduledMeeting {
  PreCustomerMeetingSid: number;
  meetingDate: string;
  meetingType: string;
  meetingStatus: string;
  meetingNote: string;
  meetingDuration: string;
  leadAssignTo: number;
  LeadOrCustomer: string;
  PreCustomerMasterSid: number;
  preCustomerName: string;
  contactPerson: string;
  phone: string;
  CustomerMasterSid: number;
  CustomerName: string;
  salespersonName: string;
}

export interface MeetingsScheduledGroup {
  overdue: ScheduledMeeting[];
  today: ScheduledMeeting[];
  future: ScheduledMeeting[];
}

// ── Section 3: Meetings With Follow-Up ──

export interface MeetingWithFollowup {
  PreCustomerMeetingSid: number;
  meetingDate: string;
  meetingType: string;
  meetingStatus: string;
  meetingNote: string;
  followUpDate: string;
  followUpNote: string;
  followUpStatus: 'Overdue' | 'Due Today' | 'Upcoming';
  leadAssignTo: number;
  LeadOrCustomer: string;
  PreCustomerMasterSid: number;
  preCustomerName: string;
  contactPerson: string;
  CustomerMasterSid: number;
  CustomerName: string;
  salespersonName: string;
}

// ── Section 4: Meeting Conducted Not Converted ──

export interface MeetingNotConverted {
  PreCustomerMasterSid: number;
  preCustomerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadStatus: string;
  leadAssignTo: number;
  salespersonName: string;
  meetingCount: number;
  lastMeetingDate: string;
  leadCreatedOn: string;
  daysSinceMeeting?: number;
}

// ── Section 5: Customer No Quote ──

export interface CustomerNoQuote {
  CustomerMasterSid: number;
  CustomerName: string;
  CustomerAddress1: string;
  PreCustomerMasterSid: number;
  preCustomerName: string;
  salespersonName: string;
  customerCreatedOn: string;
  daysWithoutQuote?: number;
}

// ── Section 6: Quote Not Approved ──

export interface QuoteNotApproved {
  QuoteHeaderSid: number;
  QuoteNumber: string;
  QuoteDate: string;
  authorizerStatus: string;
  AuthorizerRemarks: string;
  QuoteValidFrom: string;
  QuoteValidTo: string;
  SalesmanSid: number;
  LeadOrCustomer: string;
  PreCustomerMasterSid: number;
  CustomerMasterSid: number;
  CustomerName: string;
  preCustomerName: string;
  salespersonName: string;
  FreightPPCC: string;
  TransportType: string;
}

// ── Section 7: Quote No Booking ──

export interface QuoteNoBooking {
  QuoteHeaderSid: number;
  QuoteNumber: string;
  QuoteDate: string;
  CustomerApprovedBy: string;
  CustomerApprovedOn: string;
  InternalApprovedBy: number;
  InternalApprovedOn: string;
  SalesmanSid: number;
  LeadOrCustomer: string;
  PreCustomerMasterSid: number;
  CustomerMasterSid: number;
  CustomerName: string;
  preCustomerName: string;
  salespersonName: string;
  TransportType: string;
  FreightPPCC: string;
  daysSinceApproval?: number;
}

// ── Section 8: Summary KPIs ──

export interface QuoteSummary {
  totalQuotes: number;
  approvedQuotes: number;
  pendingQuotes: number;
  rejectedQuotes: number;
  waitingQuotes: number;
  quotesWithBooking: number;
}

export interface BookingSummary {
  totalBookings: number;
  bookingsFromQuote: number;
  directBookings: number;
  fclBookings: number;
  lclBookings: number;
  airBookings: number;
}

export interface SummaryKpis {
  quotes: QuoteSummary;
  bookings: BookingSummary;
}

// ── Charts ──

export interface FunnelCounts {
  leadsNoMeeting: number;
  meetingsScheduled: number;
  followUpsPending: number;
  meetingsNotConverted: number;
  customersNoQuote: number;
  quotesNotApproved: number;
  quotesNoBooking: number;
  totalBookings: number;
}

export interface MeetingsBoardCounts {
  overdue: number;
  today: number;
  future: number;
}

export interface LeadStatusCount {
  status: string;
  count: number;
}

export interface ChartData {
  funnelCounts: FunnelCounts;
  meetingsBoardCounts: MeetingsBoardCounts;
  leadStatusDistribution: LeadStatusCount[];
}

// ── Full Response ──

export interface SalesDashboardSections {
  leadsNoMeeting: LeadNoMeeting[];
  meetingsScheduled: MeetingsScheduledGroup;
  meetingsWithFollowup: MeetingWithFollowup[];
  meetingsNotConverted: MeetingNotConverted[];
  customersNoQuote: CustomerNoQuote[];
  quotesNotApproved: QuoteNotApproved[];
  quotesNoBooking: QuoteNoBooking[];
  summaryKpis: SummaryKpis;
}

export interface SalesDashboardData {
  sections: SalesDashboardSections;
  charts: ChartData;
}

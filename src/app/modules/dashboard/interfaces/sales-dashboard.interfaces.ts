export interface SalesDashboardFilters {
  salespersonId?: number;
  salespersonEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  bucket?: MeetingBucket;
}

export interface SalesDashboardCounts {
  counts: FunnelCounts;
  summaryKpis: SummaryKpis;
  charts: ChartData;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

export type MeetingBucket = 'overdue' | 'today' | 'future';

export interface BucketedPagedResult<T> {
  overdue: PagedResult<T>;
  today: PagedResult<T>;
  future: PagedResult<T>;
}

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
  idleDisplay?: string;
  idleHours?: number;
}

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
  internalApprovedByName?: string;
  TransportType: string;
  FreightPPCC: string;
  daysSinceApproval?: number;
}

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

export interface SalesDashboardSections {
  leadsNoMeeting: PagedResult<LeadNoMeeting>;
  meetingsScheduled: BucketedPagedResult<ScheduledMeeting>;
  meetingsWithFollowup: PagedResult<MeetingWithFollowup>;
  meetingsNotConverted: PagedResult<MeetingNotConverted>;
  customersNoQuote: PagedResult<CustomerNoQuote>;
  quotesNotApproved: PagedResult<QuoteNotApproved>;
  quotesNoBooking: PagedResult<QuoteNoBooking>;
  summaryKpis: SummaryKpis;
}

export interface SalesDashboardData {
  sections: SalesDashboardSections;
  charts: ChartData;
}

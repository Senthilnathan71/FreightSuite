export interface SalesDashboardFilters {
  salespersonId?: number;
  salespersonEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  naiveDateFrom?: string;
  naiveDateTo?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  bucket?: MeetingBucket;
}

export interface SalesDashboardCounts {
  counts: SectionCounts;
  summaryKpis: SummaryKpis;
  charts: ChartData;
}

export interface SectionCounts {
  leadsNoMeeting: number;
  meetingsScheduled: number;
  followUpsPending: number;
  meetingsNotConverted: number;
  customersNoQuote: number;
  enquiryCreated: number;
  enquiryConvertedToQuotation: number;
  enquiriesNoQuotation: number;
  quotesNotApproved: number;
  quotesNoBooking: number;
  totalBookings: number;
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
  name: string;
  PreCustomerMasterSid: number;
  CustomerMasterSid: number;
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
  leadCreatedBy: string;
  matchedVia: 'Created by you' | 'Assigned to you' | 'Created & Assigned to you';
  meetingCount: number;
  lastMeetingDate: string;
  leadCreatedOn: string;
  daysSinceMeeting?: number;
  elapsedDisplay?: string;
}

export interface CustomerNoQuote {
  CustomerMasterSid: number;
  CustomerName: string;
  CustomerAddress1: string;
  PreCustomerMasterSid: number;
  preCustomerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadCreatedBy: string;
  matchedVia: 'Created by you' | 'Assigned to you' | 'Created & Assigned to you';
  customerCreatedOn: string;
  daysWithoutQuote?: number;
  waitingDisplay?: string;
}

export interface EnquiryNoQuotation {
  EnquiryHeaderSid: number;
  EnquiryNumber: string;
  EnquiryDate: string;
  CustomerName: string;
  LeadOrCustomer: string;
  authorizerStatus: string;
  departmentName: string;
  polCode: string;
  podCode: string;
  daysPending?: number;
  elapsedDisplay?: string;
}

export interface QuoteNotApproved {
  QuoteHeaderSid: number;
  QuoteNumber: string;
  QuoteDate: string;
  authorizerStatus: string;
  SalesmanSid: number;
  LeadOrCustomer: string;
  PreCustomerMasterSid: number;
  CustomerMasterSid: number;
  CustomerName: string;
  preCustomerName: string;
  salespersonName: string;
  departmentName: string;
  polCode: string;
  podCode: string;
  elapsedDisplay?: string;
  daysPending?: number;
}

export interface QuoteNoBooking {
  QuoteHeaderSid: number;
  QuoteNumber: string;
  QuoteDate: string;
  SalesmanSid: number;
  LeadOrCustomer: string;
  PreCustomerMasterSid: number;
  CustomerMasterSid: number;
  CustomerName: string;
  preCustomerName: string;
  salespersonName: string;
  approvedBy: string;
  approvedOn: string;
  departmentName: string;
  polCode: string;
  podCode: string;
  elapsedDisplay?: string;
  daysSinceApproval?: number;
}

export interface QuoteSummary {
  totalQuotes: number;
  approvedQuotes: number;
  openQuotes: number;
  pendingQuotes: number;
  rejectedQuotes: number;
  waitingQuotes: number;
  otherQuotes: number;
  quotesWithBooking: number;
  quotesFromEnquiry: number;
  directQuotes: number;
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
  totalLeads: number;
  leadsWithMeeting: number;
  leadsWithEnquiry: number;
  leadsWithQuote: number;
  leadsWithApprovedQuote: number;
  leadsWithBooking: number;
  leadsTurnedCustomer: number;
  pathMix: {
    enquiry: {
      viaLead: number;
      viaCustomer: number;
    };
    quote: {
      viaLead: number;
      viaCustomer: number;
    };
    approvedQuote: {
      viaLead: number;
      viaCustomer: number;
    };
    booking: {
      viaLead: number;
      viaCustomer: number;
    };
    customer: {
      viaMeeting: number;
      viaApprovedQuote: number;
    };
  };
}

export interface MeetingsBoardCounts {
  overdue: number;
  today: number;
  future: number;
}

export interface LeadSourceDistribution {
  source: string;
  count: number;
}

export interface LeadSourceEffectiveness {
  source: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export interface LeadAgeCohorts {
  days0to7: number;
  days7to30: number;
  days30to60: number;
  days60plus: number;
  total: number;
}

export interface ChartData {
  funnelCounts: FunnelCounts;
  meetingsBoardCounts: MeetingsBoardCounts;
  leadSourceDistribution: LeadSourceDistribution[];
  leadSourceEffectiveness: LeadSourceEffectiveness[];
  leadAgeCohorts: LeadAgeCohorts;
}

export interface SalesDashboardSections {
  leadsNoMeeting: PagedResult<LeadNoMeeting>;
  meetingsScheduled: BucketedPagedResult<ScheduledMeeting>;
  meetingsWithFollowup: PagedResult<MeetingWithFollowup>;
  meetingsNotConverted: PagedResult<MeetingNotConverted>;
  customersNoQuote: PagedResult<CustomerNoQuote>;
  enquiriesNoQuotation: PagedResult<EnquiryNoQuotation>;
  quotesNotApproved: PagedResult<QuoteNotApproved>;
  quotesNoBooking: PagedResult<QuoteNoBooking>;
  summaryKpis: SummaryKpis;
}

export interface SalesDashboardData {
  sections: SalesDashboardSections;
  charts: ChartData;
}

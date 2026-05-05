export interface SalesManagerFilters {
  companyMasterSid?: number;
  branchMasterSid?: number;
  userId?: number;
  salespersonId?: number;
  salespersonEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  naiveDateFrom?: string;
  naiveDateTo?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  bucket?: 'overdue' | 'today' | 'future';
  preset?: string;
}

export interface SalespersonInfo {
  UserMasterSid: number;
  userName: string;
  userEmail: string;
  contactNumber?: string;
  avatarColor: string;
}

export interface SalesManagerCounts {
  counts: {
    leadsNoMeeting: number;
    meetingsScheduled: number;
    meetingsOverdue: number;
    meetingsToday: number;
    meetingsFuture: number;
    followUpsPending: number;
    meetingsNotConverted: number;
    customersNoQuote: number;
    enquiriesNoQuotation: number;
    quotesNotApproved: number;
    quotesNoBooking: number;
  };
  kpi: KPIData;
}

export interface KPIData {
  leadsCreated: {
    current: number;
    previous: number;
    percent: number;
    direction: 'up' | 'down' | 'flat';
  };
  meetingScheduled: {
    current: number;
    previous: number;
    percent: number;
    direction: 'up' | 'down' | 'flat';
  };
  quoteCreated: {
    current: number;
    previous: number;
    percent: number;
    direction: 'up' | 'down' | 'flat';
  };
  leadConvertedToCustomer: {
    current: number;
    previous: number;
    percent: number;
    direction: 'up' | 'down' | 'flat';
  };
  profitAtQuote: {
    current: number;
    previous: number;
    percent: number;
    direction: 'up' | 'down' | 'flat';
  };
}

export interface ScoreboardRow {
  UserMasterSid: number;
  userName: string;
  userEmail: string;
  avatarColor: string;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  s5: number;
  s6: number;
  s7: number;
  s8: number;
  total: number;
}

export interface WeeklyTrendPoint {
  weekStart: string;
  newLeads: number;
  meetings: number;
  conversions: number;
}

export interface ResponseTimeMetric {
  UserMasterSid: number;
  userName: string;
  avgLeadToMeeting: number;
  avgLeadToCustomer: number;
  avgQuoteToApproval: number;
}

export interface ActivityFeedItem {
  activityType: 'meeting_completed' | 'quote_created' | 'booking_created';
  activityDate: string;
  salesperson: string;
  entityName: string;
  details: string;
}

export interface AtRiskAlert {
  alertType: 'idle_leads' | 'overdue_meetings' | 'stale_followups' | 'unconverted_hightouch' | 'overload';
  severity: 'danger' | 'warning' | 'info';
  salesperson: string;
  count: number;
  description: string;
}

export interface AgingRow {
  userName: string;
  days0to7: number;
  days8to30: number;
  days31to60: number;
  days60plus: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

export interface MeetingsBoardData {
  overdue: PagedResult<any>;
  today: PagedResult<any>;
  upcoming: PagedResult<any>;
}

export interface KpiCardConfig {
  key: string;
  label: string;
  icon: string;
  colorClass: string;
  value: number;
  sectionNumber: number;
  percentChange?: number;
  changeDirection?: 'up' | 'down' | 'flat';
  isCurrency?: boolean;
  isPrimary?: boolean;
}

export interface TopPerformer {
  UserMasterSid: number;
  userName: string;
  userEmail: string;
  avatarColor: string;
  score: number;
  leadsCount: number;
  rank: number;
}

export interface ActionCenterItem {
  key: string;
  title: string;
  subtitle: string;
  count: number;
  icon: string;
  colorClass: string;
}


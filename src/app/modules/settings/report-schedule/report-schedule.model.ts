export interface ReportSchedule {
  ReportScheduleSid: number;
  CreatedOn: string;
  CreatedBy: string;
  UpdatedOn: string;
  UpdatedBy?: string;
  Status: string;
  CompanyMasterSid: number;
  ScheduleName: string;
  ReportMasterSid: number;
  SubledgerMasterSid?: number;
  COAMasterSid?: number;
  BranchFilter?: number[];
  Frequency: string;
  DayOfWeek?: number;
  DayOfMonth?: number;
  ScheduleTime: string;
  TimeZone?: string;
  ToEmails: string;
  CcEmails?: string;
  ReportFormat: string;
  ReportParams?: Record<string, any>;
  IsActive: boolean;
  LastRunAt?: string;
  LastRunStatus?: string;
  LastRunMessage?: string;
  // Joined data
  ReportMaster?: {
    ReportMasterSid: number;
    ReportName: string;
    ReportDisplayName: string;
  };
  SubledgerMaster?: {
    SubledgerMasterSid: number;
    SubledgerName: string;
  };
}

export interface AvailableReport {
  ReportMasterSid: number;
  ReportName: string;
  ReportDisplayName: string;
  ReportType?: string;
  ReportMasterDetail: ReportParameterDetail[];
}

export interface ReportParameterDetail {
  ReportMasterDetailSid: number;
  ParameterName: string;
  ParameterFieldType: string;
  DropDownValue?: any;
  ParameterQuery?: string;
  DefaultValue?: string;
  ValidationRules?: any;
  DependsOnParameter?: string;
}

export const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const REPORT_FORMAT_OPTIONS = [
  { value: 'EXCEL', label: 'Excel' },
  { value: 'PDF', label: 'PDF' },
];

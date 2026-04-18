export type ExecutionMode = 'MANUAL' | 'SCHEDULED';
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type RunStatus = 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'VALIDATION_FAILED';

export interface ExceptionCheckScript {
  ExceptionCheckScriptSid?: number;
  ScriptName: string;
  ScriptDescription?: string | null;
  ScriptText: string;
  ExecutionMode: ExecutionMode;

  Frequency?: Frequency | null;
  DayOfWeek?: number | null;
  DayOfMonth?: number | null;
  ScheduleTime?: string | null;
  TimeZone?: string | null;
  ToEmails?: string | null;
  CcEmails?: string | null;

  IsActive?: boolean;
  Status?: string;
  LastRunAt?: string | null;
  LastRunStatus?: RunStatus | null;
  LastRunMessage?: string | null;
}

export interface ExceptionCheckScriptRun {
  ExceptionCheckScriptRunSid: number;
  ExceptionCheckScriptSid: number;
  ExecutedOn: string;
  ExecutedBy: string;
  ExecutionMode: ExecutionMode;
  Status: RunStatus;
  RowCount?: number | null;
  DurationMs?: number | null;
  ErrorMessage?: string | null;
  EmailSentTo?: string | null;
}

export interface ExecutionResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  durationMs: number;
  truncated: boolean;
}

export const FREQUENCY_OPTIONS: { label: string; value: Frequency }[] = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
];

export const DAY_OF_WEEK_OPTIONS: { label: string; value: number }[] = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

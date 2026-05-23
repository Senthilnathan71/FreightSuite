import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';

export type DateRangePreset = 'all' | 'last30' | 'thisMonth' | 'lastMonth' | 'last2Months' | 'last3Months' | 'custom';

export interface DateRangeConfig {
  enabled: boolean;
  defaultPreset?: DateRangePreset;
  minDate?: NgbDateStruct | null;
  maxDate?: NgbDateStruct | null;
}

export interface DateTypeOption {
  label: string;
  value: string;
}

export interface DateTypeConfig {
  enabled: boolean;
  options: DateTypeOption[];
  defaultValue?: string;
}

export interface PartyTypeOption {
  label: string;
  value: string;
}

export interface PartyFilterConfig {
  enabled: boolean;
  partyTypes: PartyTypeOption[];
  defaultPartyType?: string;
}

export interface DropdownFilterConfig {
  enabled: boolean;
  label: string;
  options: any[];
  bindLabel: string;
  bindValue: string;
}

export interface AdvancedFilterValues {
  dateRange?: { preset: DateRangePreset; fromDate: string | null; toDate: string | null };
  dateType?: string;
  party?: { partyType: string; partyId: number | null; partyName: string | null };
  departmentSid?: number | null;
  pol?: string | null;
  pod?: string | null;
  extra?: string | number | null;
}

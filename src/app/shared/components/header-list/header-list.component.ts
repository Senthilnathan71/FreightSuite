import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Observable } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import {
  DateRangeConfig,
  DateRangePreset,
  DateTypeConfig,
  DropdownFilterConfig,
  PartyFilterConfig,
  AdvancedFilterValues
} from '../../interfaces/advanced-filter.interface';
import { FeatherModule } from 'angular-feather';

export interface HeaderAction {
  label: string;
  icon: string;
  action: string;
  disabled?: boolean;
  condition?: boolean;
  cssClass?: string;
  children?: HeaderAction[];  // Support for dropdown items
  tooltip?: string;            // Tooltip text for info icon
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FavoriteStarComponent,
    NgSelectModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgbDatepickerModule,
    FeatherModule,
  ],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ],
  templateUrl:'./header-list.component.html',
  styleUrls: ['./header-list.component.scss']
})
export class PageHeaderComponent implements OnInit, OnChanges {
  @Input() title: string = '';
  @Input() showFavorite: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Search';
  @Input() searchButtonText: string = 'Search';
  @Input() searchValue: string = '';
  @Input() actions: HeaderAction[] = [];
  @Input() autoSearchOnFilterChange = false;

  // Advanced filter configs (all optional — backward compatible)
  @Input() dateRangeConfig?: DateRangeConfig;
  @Input() dateTypeConfig?: DateTypeConfig;
  @Input() partyFilterConfig?: PartyFilterConfig;
  @Input() departmentFilterConfig?: DropdownFilterConfig;
  @Input() polFilterConfig?: DropdownFilterConfig;
  @Input() podFilterConfig?: DropdownFilterConfig;
  @Input() partySearchFn?: (searchTerm: string, partyType: string) => Observable<any[]>;

  @Output() searchValueChange = new EventEmitter<string>();
  @Output() searchTriggered = new EventEmitter<string>();
  @Output() searchCleared = new EventEmitter<void>();
  @Output() actionTriggered = new EventEmitter<string>();
  @Output() advancedSearchTriggered = new EventEmitter<{ searchValue: string; filters: AdvancedFilterValues }>();
  @Output() departmentFilterChanged = new EventEmitter<any>();
  @Output() polFilterChanged = new EventEmitter<any>();
  @Output() podFilterChanged = new EventEmitter<any>();

  // Advanced filter state
  selectedPreset: DateRangePreset = 'last30';
  customFromDate: NgbDateStruct | Date | null = null;
  customToDate: NgbDateStruct | Date | null = null;
  selectedDateType = '';
  selectedParty: any = null;
  selectedDepartment: any = null;
  selectedPOL: any = null;
  selectedPOD: any = null;
  partySearchResults: any[] = [];
  partyLoading = false;

  get hasAnyFilterConfig(): boolean {
    return !!(
      this.dateRangeConfig?.enabled ||
      this.dateTypeConfig?.enabled ||
      this.partyFilterConfig?.enabled ||
      this.departmentFilterConfig?.enabled ||
      this.polFilterConfig?.enabled ||
      this.podFilterConfig?.enabled
    );
  }

  get isCustomRange(): boolean {
    return this.selectedPreset === 'custom';
  }

  ngOnInit(): void {
    this.initializeFilterDefaults();
    if (this.partyFilterConfig?.enabled) {
      this.loadPartyResults('');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['polFilterConfig'] && this.selectedPOL !== null) {
      const polOptions = this.polFilterConfig?.options || [];
      const polBind = this.polFilterConfig?.bindValue;
      if (polBind && !polOptions.some(opt => opt?.[polBind] === this.selectedPOL)) {
        this.selectedPOL = null;
      }
    }

    if (changes['podFilterConfig'] && this.selectedPOD !== null) {
      const podOptions = this.podFilterConfig?.options || [];
      const podBind = this.podFilterConfig?.bindValue;
      if (podBind && !podOptions.some(opt => opt?.[podBind] === this.selectedPOD)) {
        this.selectedPOD = null;
      }
    }
  }

  initializeFilterDefaults(): void {
    if (this.dateRangeConfig?.enabled) {
      this.selectedPreset = this.dateRangeConfig.defaultPreset || 'last30';
    }
    if (this.dateTypeConfig?.enabled && this.dateTypeConfig.options?.length) {
      this.selectedDateType = this.dateTypeConfig.defaultValue || this.dateTypeConfig.options[0].value;
    }
    this.selectedDepartment = null;
    this.selectedPOL = null;
    this.selectedPOD = null;
  }

  private triggerAutoSearchIfEnabled(): void {
    if (!this.autoSearchOnFilterChange || !this.hasAnyFilterConfig) {
      return;
    }

    this.advancedSearchTriggered.emit({
      searchValue: this.searchValue,
      filters: this.getCurrentFilterValues()
    });
  }

  onSearch(): void {
    if (this.hasAnyFilterConfig) {
      // Only emit advancedSearchTriggered when filters are configured
      this.advancedSearchTriggered.emit({
        searchValue: this.searchValue,
        filters: this.getCurrentFilterValues()
      });
    } else {
      // Emit plain searchTriggered for pages without filters
      this.searchTriggered.emit(this.searchValue);
    }
  }

  onClearSearch(): void {
    this.searchValue = '';
    this.searchValueChange.emit(this.searchValue);
    this.searchCleared.emit();
  }

  onActionClick(action: string): void {
    this.actionTriggered.emit(action);
  }

  clearAdvancedFilters(): void {
    this.initializeFilterDefaults();
    this.customFromDate = null;
    this.customToDate = null;
    this.selectedParty = null;
    this.partySearchResults = [];
    if (this.partyFilterConfig?.enabled) {
      this.loadPartyResults('');
    }
    this.triggerAutoSearchIfEnabled();
  }

  onDateTypeChange(): void {
    this.triggerAutoSearchIfEnabled();
  }

  onDateRangePresetChange(): void {
    if (this.selectedPreset !== 'custom') {
      this.customFromDate = null;
      this.customToDate = null;
    }
    this.triggerAutoSearchIfEnabled();
  }

  onCustomDateChanged(): void {
    this.triggerAutoSearchIfEnabled();
  }

  onPartySelected(item: any): void {
    this.selectedParty = item || null;
    this.triggerAutoSearchIfEnabled();
  }

  onDepartmentFilterChange(): void {
    this.selectedPOL = null;
    this.selectedPOD = null;
    this.departmentFilterChanged.emit(this.selectedDepartment);
    this.triggerAutoSearchIfEnabled();
  }

  onPolFilterChange(): void {
    this.polFilterChanged.emit(this.selectedPOL);
    this.triggerAutoSearchIfEnabled();
  }

  onPodFilterChange(): void {
    this.podFilterChanged.emit(this.selectedPOD);
    this.triggerAutoSearchIfEnabled();
  }

  private loadPartyResults(searchTerm: string): void {
    if (!this.partySearchFn) return;
    const activePartyType =
      this.partyFilterConfig?.defaultPartyType ||
      this.partyFilterConfig?.partyTypes?.[0]?.value ||
      'CustomerMasterSid';
    this.partyLoading = true;
    this.partySearchFn(searchTerm, activePartyType).subscribe({
      next: (results) => {
        this.partySearchResults = results || [];
        this.partyLoading = false;
      },
      error: () => {
        this.partySearchResults = [];
        this.partyLoading = false;
      }
    });
  }

  getCurrentFilterValues(): AdvancedFilterValues {
    const filters: AdvancedFilterValues = {};

    if (this.dateRangeConfig?.enabled) {
      const { fromDate, toDate } = this.calculateDateRange();
      filters.dateRange = {
        preset: this.selectedPreset,
        fromDate,
        toDate
      };
    }

    if (this.dateTypeConfig?.enabled) {
      filters.dateType = this.selectedDateType;
    }

    if (this.partyFilterConfig?.enabled && this.selectedParty) {
      filters.party = {
        partyType:
          this.partyFilterConfig?.defaultPartyType ||
          this.partyFilterConfig?.partyTypes?.[0]?.value ||
          'CustomerMasterSid',
        partyId: this.selectedParty.CustomerMasterSid || this.selectedParty.id || null,
        partyName: this.selectedParty.CustomerName || this.selectedParty.name || null
      };
    }

    if (this.departmentFilterConfig?.enabled) {
      filters.departmentSid = this.selectedDepartment ?? null;
    }

    if (this.polFilterConfig?.enabled) {
      filters.pol = this.selectedPOL ?? null;
    }

    if (this.podFilterConfig?.enabled) {
      filters.pod = this.selectedPOD ?? null;
    }

    return filters;
  }

  calculateDateRange(): { fromDate: string | null; toDate: string | null } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let fromDate: Date | null = null;
    const toDate: Date = new Date(today);

    switch (this.selectedPreset) {
      case 'all':
        return {
          fromDate: null,
          toDate: null
        };
      case 'last30':
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        toDate.setTime(new Date(today.getFullYear(), today.getMonth(), 0).getTime());
        break;
      case 'last2Months':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        break;
      case 'last3Months':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        break;
      case 'custom':
        const customFrom = this.toBoundaryDate(this.customFromDate, false);
        const customTo = this.toBoundaryDate(this.customToDate, true);
        return {
          fromDate: customFrom ? customFrom.toISOString() : null,
          toDate: customTo ? customTo.toISOString() : null
        };
    }

    toDate.setHours(23, 59, 59, 999);

    return {
      fromDate: fromDate ? fromDate.toISOString() : null,
      toDate: toDate.toISOString()
    };
  }

  private toBoundaryDate(value: NgbDateStruct | Date | null, endOfDay: boolean): Date | null {
    if (!value) {
      return null;
    }

    let date: Date;
    if (value instanceof Date) {
      // Preserve selected calendar day from UTC-backed datepicker model.
      date = new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    } else {
      date = new Date(value.year, value.month - 1, value.day);
    }

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date;
  }
}

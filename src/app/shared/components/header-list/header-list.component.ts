import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import {
  DateRangeConfig,
  DateRangePreset,
  DateTypeConfig,
  PartyFilterConfig,
  AdvancedFilterValues
} from '../../interfaces/advanced-filter.interface';

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
    NgbDropdownModule,
    NgbTooltipModule,
    NgbDatepickerModule,
    SearchableDropdown
  ],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ],
  templateUrl:'./header-list.component.html',
  styleUrls: []
})
export class PageHeaderComponent implements OnInit {
  @Input() title: string = '';
  @Input() showFavorite: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Search';
  @Input() searchButtonText: string = 'Search';
  @Input() searchValue: string = '';
  @Input() actions: HeaderAction[] = [];

  // Advanced filter configs (all optional — backward compatible)
  @Input() dateRangeConfig?: DateRangeConfig;
  @Input() dateTypeConfig?: DateTypeConfig;
  @Input() partyFilterConfig?: PartyFilterConfig;
  @Input() partySearchFn?: (searchTerm: string, partyType: string) => Observable<any[]>;

  @Output() searchValueChange = new EventEmitter<string>();
  @Output() searchTriggered = new EventEmitter<string>();
  @Output() searchCleared = new EventEmitter<void>();
  @Output() actionTriggered = new EventEmitter<string>();
  @Output() advancedSearchTriggered = new EventEmitter<{ searchValue: string; filters: AdvancedFilterValues }>();

  // Advanced filter state
  selectedPreset: DateRangePreset = 'last30';
  customFromDate: NgbDateStruct | null = null;
  customToDate: NgbDateStruct | null = null;
  selectedDateType = '';
  selectedPartyType = '';
  selectedParty: any = null;
  partySearchResults: any[] = [];
  partyLoading = false;

  get hasAnyFilterConfig(): boolean {
    return !!(this.dateRangeConfig?.enabled || this.dateTypeConfig?.enabled || this.partyFilterConfig?.enabled);
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

  initializeFilterDefaults(): void {
    if (this.dateRangeConfig?.enabled) {
      this.selectedPreset = this.dateRangeConfig.defaultPreset || 'last30';
    }
    if (this.dateTypeConfig?.enabled && this.dateTypeConfig.options?.length) {
      this.selectedDateType = this.dateTypeConfig.defaultValue || this.dateTypeConfig.options[0].value;
    }
    if (this.partyFilterConfig?.enabled && this.partyFilterConfig.partyTypes?.length) {
      this.selectedPartyType = this.partyFilterConfig.defaultPartyType || this.partyFilterConfig.partyTypes[0].value;
    }
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
  }

  onPartyTypeChange(): void {
    this.selectedParty = null;
    this.partySearchResults = [];
    this.loadPartyResults('');
  }

  onPartySelected(item: any): void {
    this.selectedParty = item || null;
  }

  onPartySearch(term: string): void {
    this.loadPartyResults(term);
  }

  private loadPartyResults(searchTerm: string): void {
    if (!this.partySearchFn) return;
    this.partyLoading = true;
    this.partySearchFn(searchTerm, this.selectedPartyType).subscribe({
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
        partyType: this.selectedPartyType,
        partyId: this.selectedParty.CustomerMasterSid || this.selectedParty.id || null,
        partyName: this.selectedParty.CustomerName || this.selectedParty.name || null
      };
    }

    return filters;
  }

  calculateDateRange(): { fromDate: string | null; toDate: string | null } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let fromDate: Date | null = null;
    const toDate: Date = new Date(today);

    switch (this.selectedPreset) {
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
        return {
          fromDate: this.customFromDate
            ? new Date(this.customFromDate.year, this.customFromDate.month - 1, this.customFromDate.day).toISOString()
            : null,
          toDate: this.customToDate
            ? new Date(this.customToDate.year, this.customToDate.month - 1, this.customToDate.day).toISOString()
            : null
        };
    }

    return {
      fromDate: fromDate ? fromDate.toISOString() : null,
      toDate: toDate.toISOString()
    };
  }
}

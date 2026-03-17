import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDateStruct,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { toNgbDateStruct } from 'src/app/common/helper';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import {
  BucketedPagedResult,
  CustomerNoQuote,
  EnquiryNoQuotation,
  FunnelCounts,
  LeadAgeCohorts,
  LeadNoMeeting,
  LeadSourceDistribution,
  MeetingBucket,
  MeetingNotConverted,
  MeetingWithFollowup,
  PagedResult,
  QuoteNoBooking,
  QuoteNotApproved,
  SalesDashboardCounts,
  SalesDashboardFilters,
  ScheduledMeeting,
} from '../interfaces/sales-dashboard.interfaces';
import { SalesDashboardService } from '../services/sales-dashboard.service';

type ListSection = 1 | 3 | 4 | 5 | 6 | 7 | 8;

interface SectionState<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  initialized: boolean;
}

interface FunnelRow {
  label: string;
  value: number;
  color: string;
  icon: string;
  widthPct: number;
  pctOfTotal: number;
  tooltip: string;
}

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, NgbDatepickerModule, CustomDatePipe],
  templateUrl: './sales-dashboard.component.html',
  styleUrls: ['./sales-dashboard.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class SalesDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly pageSize = 10;
  private readonly scrollThreshold = 96;
  private readonly searchDebounceMs = 300;
  private readonly listSections: ListSection[] = [1, 3, 4, 5, 6, 7, 8];
  private readonly sectionSearchTimers: Partial<Record<ListSection, ReturnType<typeof setTimeout>>> = {};

  readonly maxDateTo: NgbDateStruct = toNgbDateStruct(new Date())!;

  dashboardCounts: SalesDashboardCounts | null = null;
  lastRefreshedAt: Date | null = null;
  isLoading = false;
  dateFromInput: Date | null = null;
  dateToInput: Date | null = null;
  filters: SalesDashboardFilters = {};
  activePreset = 'month';

  expandedSections: Record<number, boolean> = {
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
  };

  searchTerms: Partial<Record<ListSection, string>> = {};
  sectionStates: Record<ListSection, SectionState<any>> = {
    1: this.createSectionState<LeadNoMeeting>(),
    3: this.createSectionState<MeetingWithFollowup>(),
    4: this.createSectionState<MeetingNotConverted>(),
    5: this.createSectionState<CustomerNoQuote>(),
    6: this.createSectionState<EnquiryNoQuotation>(),
    7: this.createSectionState<QuoteNotApproved>(),
    8: this.createSectionState<QuoteNoBooking>(),
  };
  meetingsState: Record<MeetingBucket, SectionState<ScheduledMeeting>> = {
    overdue: this.createSectionState<ScheduledMeeting>(),
    today: this.createSectionState<ScheduledMeeting>(),
    future: this.createSectionState<ScheduledMeeting>(),
  };

  leadSourceDonutOptions: any = {};
  funnelRows: FunnelRow[] = [];

  constructor(
    private salesDashboardService: SalesDashboardService,
    private appSettings: AppSettingsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    Object.values(this.sectionSearchTimers).forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.clearPendingSearchTimers();
    this.resetSectionStates();

    this.salesDashboardService
      .getSalesDashboardCounts(this.getApiFilters())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dashboardCounts = response.data;
          this.lastRefreshedAt = new Date();
          this.buildChartsFromCounts(response.data);
          this.isLoading = false;
          this.loadInitialSections();
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  refreshDashboard(): void {
    const currentPreset = this.activePreset;
    this.loadDashboardData();
    this.activePreset = currentPreset;
  }

  applyFilters(): void {
    this.activePreset = '';
    this.normalizeDateRange();
    this.loadDashboardData();
  }

  resetFilters(): void {
    this.filters = {};
    this.activePreset = 'month';
    this.clearSectionSearches();
    this.setDefaultDateRange();
    this.loadDashboardData();
  }

  setPreset(preset: string, shouldLoad = true): void {
    this.activePreset = preset;
    const now = new Date();

    // Use noon (12:00) so the datepicker adapter reads the correct date
    // regardless of UTC offset. toDateTimeStr / toNaiveDateTimeStr create
    // their own Date copies and set hours independently, so this is safe.
    const noon = (y: number, m: number, d: number) => new Date(y, m, d, 12);
    const todayNoon = noon(now.getFullYear(), now.getMonth(), now.getDate());
    const getFinancialYearBounds = () => {
      const fy = this.appSettings.getCurrentFinancialYear();
      if (fy) {
        return {
          start: noon(new Date(fy.StartDate).getFullYear(), new Date(fy.StartDate).getMonth(), new Date(fy.StartDate).getDate()),
          end: noon(new Date(fy.EndDate).getFullYear(), new Date(fy.EndDate).getMonth(), new Date(fy.EndDate).getDate()),
        };
      }

      return {
        start: now.getMonth() >= 3
          ? noon(now.getFullYear(), 3, 1)
          : noon(now.getFullYear() - 1, 3, 1),
        end: now.getMonth() >= 2
          ? noon(now.getFullYear() + 1, 2, 31)
          : noon(now.getFullYear(), 2, 31),
      };
    };

    switch (preset) {
      case 'today':
        this.dateFromInput = todayNoon;
        this.dateToInput = todayNoon;
        break;
      case 'week': {
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + 1);
        this.dateFromInput = noon(monday.getFullYear(), monday.getMonth(), monday.getDate());
        this.dateToInput = todayNoon;
        break;
      }
      case 'month':
        this.dateFromInput = noon(now.getFullYear(), now.getMonth(), 1);
        this.dateToInput = todayNoon;
        break;
      case 'lastMonth': {
        const { start: fyStart, end: fyEnd } = getFinancialYearBounds();
        const previousMonthStart = noon(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = noon(now.getFullYear(), now.getMonth(), 0);
        const clampedStart = previousMonthStart < fyStart ? fyStart : previousMonthStart;
        const cappedToday = fyEnd < todayNoon ? fyEnd : todayNoon;
        const clampedEnd = previousMonthEnd > cappedToday ? cappedToday : previousMonthEnd;

        if (clampedStart > clampedEnd) {
          this.dateFromInput = fyStart;
          this.dateToInput = cappedToday;
        } else {
          this.dateFromInput = clampedStart;
          this.dateToInput = clampedEnd;
        }
        break;
      }
      case 'fy': {
        const { start: fyStart, end: fyEnd } = getFinancialYearBounds();
        this.dateFromInput = fyStart;
        this.dateToInput = fyEnd < todayNoon ? fyEnd : todayNoon;
        break;
      }
    }

    this.normalizeDateRange();

    if (shouldLoad) {
      this.loadDashboardData();
    }
  }

  onDateFromChange(): void {
    this.activePreset = '';
    this.normalizeDateRange('from');
  }

  onDateToChange(): void {
    this.activePreset = '';
    this.normalizeDateRange('to');
  }

  getMinDateTo(): NgbDateStruct | undefined {
    return this.dateFromInput ? toNgbDateStruct(this.dateFromInput) ?? undefined : undefined;
  }

  getMaxDateFrom(): NgbDateStruct {
    return this.dateToInput ? toNgbDateStruct(this.dateToInput) ?? this.maxDateTo : this.maxDateTo;
  }

  toggleSection(section: number): void {
    this.expandedSections[section] = !this.expandedSections[section];

    if (!this.expandedSections[section] || section === 9) {
      return;
    }

    if (section === 2) {
      if (!this.isMeetingsInitialized()) {
        this.loadMeetingsSection(true);
      }
      return;
    }

    if (this.isListSection(section) && !this.sectionStates[section].initialized) {
      this.loadListSection(section, true);
    }
  }

  onSectionSearchChange(section: ListSection, value: string): void {
    this.searchTerms[section] = value;

    if (this.sectionSearchTimers[section]) {
      clearTimeout(this.sectionSearchTimers[section]);
    }

    this.sectionSearchTimers[section] = setTimeout(() => {
      this.resetListSectionState(section);
      if (this.expandedSections[section]) {
        this.loadListSection(section, true);
      }
    }, this.searchDebounceMs);
  }

  onSectionScroll(event: Event, section: ListSection): void {
    if (!this.shouldLoadMore(event)) {
      return;
    }

    this.loadListSection(section);
  }

  onMeetingsBucketScroll(event: Event, bucket: MeetingBucket): void {
    if (!this.shouldLoadMore(event)) {
      return;
    }

    this.loadMeetingsSection(false, bucket);
  }

  getLeadsNoMeetingRows(): LeadNoMeeting[] {
    return this.sectionStates[1].items;
  }

  getMeetingsWithFollowupRows(): MeetingWithFollowup[] {
    return this.sectionStates[3].items;
  }

  getMeetingsNotConvertedRows(): MeetingNotConverted[] {
    return this.sectionStates[4].items;
  }

  getCustomersNoQuoteRows(): CustomerNoQuote[] {
    return this.sectionStates[5].items;
  }

  getQuotesNotApprovedRows(): QuoteNotApproved[] {
    return this.sectionStates[7].items;
  }

  getQuotesNoBookingRows(): QuoteNoBooking[] {
    return this.sectionStates[8].items;
  }

  getEnquiriesNoQuotationRows(): EnquiryNoQuotation[] {
    return this.sectionStates[6].items;
  }

  getMeetingsScheduledGroup(): Record<MeetingBucket, ScheduledMeeting[]> {
    return {
      overdue: this.meetingsState.overdue.items,
      today: this.meetingsState.today.items,
      future: this.meetingsState.future.items,
    };
  }

  getMeetingBucketState(bucket: MeetingBucket): SectionState<ScheduledMeeting> {
    return this.meetingsState[bucket];
  }

  isSectionLoading(section: ListSection): boolean {
    return this.sectionStates[section].loading;
  }

  isSectionEmpty(section: ListSection): boolean {
    const state = this.sectionStates[section];
    return state.initialized && !state.loading && state.items.length === 0;
  }

  areMeetingsLoading(): boolean {
    return Object.values(this.meetingsState).some((state) => state.loading);
  }

  isMeetingsBucketEmpty(bucket: MeetingBucket): boolean {
    const state = this.meetingsState[bucket];
    return state.initialized && !state.loading && state.items.length === 0;
  }

  getDisplayName(item: any): string {
    if (item.LeadOrCustomer === 'C' && item.CustomerName) {
      return item.CustomerName;
    }
    return item.preCustomerName || item.CustomerName || '\u2014';
  }

  getQuoteCustomerName(item: any): string {
    if (item.LeadOrCustomer === 'C' || item.LeadOrCustomer == null) {
      return item.CustomerName || '\u2014';
    }
    return item.preCustomerName || '\u2014';
  }

  camelToWords(str: string): string {
    return str ? str.replace(/([a-z])([A-Z])/g, '$1 $2') : '';
  }

  formatMeetingDateTime(isoString: string, timeOnly = false): string {
    if (!isoString) return '\u2014';
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return isoString;

    const [, year, month, day, hours24, minutes] = match;
    const hours = parseInt(hours24, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const timeStr = `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;

    return timeOnly ? timeStr : `${day}/${month}/${year} ${timeStr}`;
  }

  getDaysPillClass(days: number, threshold = 7): string {
    if (days > threshold) return 'danger';
    if (days > threshold / 2) return 'warning';
    return 'ok';
  }

  getIdlePillClass(lead: LeadNoMeeting): string {
    const idleHours = lead.idleHours ?? 0;
    if (idleHours >= 24 * 7) return 'danger';
    if (idleHours >= 24 * 3) return 'warning';
    return 'ok';
  }

  getFollowUpStatusClass(status: string): string {
    switch (status) {
      case 'Overdue':
        return 'overdue';
      case 'Due Today':
        return 'b-today';
      case 'Upcoming':
        return 'upcoming';
      default:
        return '';
    }
  }

  getMatchedViaClass(matchedVia: string): string {
    switch (matchedVia) {
      case 'Created by you':
        return 'created-by';
      case 'Assigned to you':
        return 'assigned-to';
      case 'Created & Assigned to you':
        return 'both-match';
      default:
        return '';
    }
  }

  getApprovalStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'pending';
      case 'Approved':
        return 'approved';
      case 'WaitingForFinalApproval':
      case 'WaitingForCustomerApproval':
        return 'waiting';
      case 'Counter':
        return 'pending';
      case 'Open':
        return 'discovery';
      default:
        return '';
    }
  }

  getLeadStatusClass(status: string): string {
    switch (status) {
      case 'Discovery':
        return 'discovery';
      case 'Qualify':
        return 'qualify';
      case 'MeetingScheduled':
        return 'm-scheduled';
      case 'MeetingCompleted':
        return 'm-completed';
      default:
        return 'discovery';
    }
  }

  isQuoteExpired(validTo: string): boolean {
    return !!validTo && new Date(validTo) < new Date();
  }

  getConversionRate(): number {
    if (!this.dashboardCounts) return 0;
    const totalQuotes = this.dashboardCounts.summaryKpis.quotes.totalQuotes;
    const totalBookings = this.dashboardCounts.summaryKpis.bookings.totalBookings;
    return totalQuotes ? Math.round((totalBookings / totalQuotes) * 1000) / 10 : 0;
  }

  getQuoteToBookingRate(): number {
    if (!this.dashboardCounts) return 0;
    const approvedQuotes = this.dashboardCounts.summaryKpis.quotes.approvedQuotes;
    const bookingsFromQuote = this.dashboardCounts.summaryKpis.bookings.bookingsFromQuote;
    return approvedQuotes ? Math.round((bookingsFromQuote / approvedQuotes) * 1000) / 10 : 0;
  }

  getLeadAgeCohorts(): LeadAgeCohorts | null {
    return this.dashboardCounts?.charts?.leadAgeCohorts || null;
  }

  getAgeCohortTotal(): number {
    const c = this.getLeadAgeCohorts();
    return c ? c.total : 0;
  }

  getAgeCohortPct(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
  }

  getAgeDialStyle(value: number, total: number, color: string): string {
    const pct = this.getAgeCohortPct(value, total);
    return `conic-gradient(${color} 0deg ${pct * 3.6}deg, rgba(148, 163, 184, 0.16) ${pct * 3.6}deg 360deg)`;
  }

  getPipelinePct(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
  }

  getSummaryBarWidth(part: number, total: number): number {
    return this.getPipelinePct(part, total);
  }

  getShipmentMix(): Array<{ label: string; value: number; colorClass: string }> {
    if (!this.dashboardCounts) {
      return [];
    }

    const bookings = this.dashboardCounts.summaryKpis.bookings;
    return [
      { label: 'FCL', value: bookings.fclBookings, colorClass: 'mix-fcl' },
      { label: 'LCL', value: bookings.lclBookings, colorClass: 'mix-lcl' },
      { label: 'AIR', value: bookings.airBookings, colorClass: 'mix-air' },
    ];
  }

  getSummaryInsight(): string {
    if (!this.dashboardCounts) {
      return 'No quote or booking activity in the selected range.';
    }

    const conversionRate = this.getConversionRate();
    const approvedToBookingRate = this.getQuoteToBookingRate();
    const bookingCount = this.dashboardCounts.summaryKpis.bookings.totalBookings;
    const quoteCount = this.dashboardCounts.summaryKpis.quotes.totalQuotes;

    if (quoteCount === 0 && bookingCount === 0) {
      return 'No quote or booking activity in the selected range.';
    }

    if (approvedToBookingRate >= conversionRate && approvedToBookingRate > 0) {
      return `${approvedToBookingRate}% of approved quotes became bookings.`;
    }

    if (conversionRate > 0) {
      return `${conversionRate}% of total quotes became bookings.`;
    }

    if (quoteCount > 0 && bookingCount === 0) {
      return 'Quotes exist, but none have converted into bookings yet.';
    }

    return 'Bookings exist without corresponding quote volume in the selected range.';
  }

  navigateToPreCustomer(sid: number): void {
    this.router.navigate(['/crm/pre-customer/entry', sid]);
  }

  navigateToCustomer(sid: number): void {
    this.router.navigate(['/master/customer/entry', sid]);
  }

  navigateToQuote(sid: number): void {
    this.router.navigate(['/crm/quotation/entry', sid]);
  }

  navigateToEnquiry(sid: number): void {
    this.router.navigate(['/crm/enquiry/entry', sid]);
  }

  navigateToCalendar(): void {
    this.router.navigate(['/crm/calendar']);
  }

  navigateToMeetingUpdate(): void {
    this.router.navigate(['/crm/meeting-update']);
  }

  private loadInitialSections(): void {
    this.listSections.forEach((section) => {
      if (this.expandedSections[section]) {
        this.loadListSection(section, true);
      }
    });

    if (this.expandedSections[2]) {
      this.loadMeetingsSection(true);
    }
  }

  private loadListSection(section: ListSection, reset = false): void {
    const state = this.sectionStates[section];
    if (state.loading) {
      return;
    }
    if (!reset && !state.hasMore) {
      return;
    }

    const nextPage = reset ? 1 : state.page + 1;
    state.loading = true;

    this.salesDashboardService
      .getSectionData(section, {
        ...this.getApiFilters(),
        page: nextPage,
        pageSize: this.pageSize,
        search: this.searchTerms[section] || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const paged = response.data as PagedResult<any>;
          this.applyListSectionResponse(section, paged, reset);
        },
        error: () => {
          state.loading = false;
        },
      });
  }

  private loadMeetingsSection(reset = false, bucket?: MeetingBucket): void {
    if (bucket) {
      const state = this.meetingsState[bucket];
      if (state.loading || (!reset && !state.hasMore)) {
        return;
      }

      const nextPage = reset ? 1 : state.page + 1;
      state.loading = true;

      this.salesDashboardService
        .getSectionData(2, {
          ...this.getApiFilters(),
          page: nextPage,
          pageSize: this.pageSize,
          bucket,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.applyMeetingBucketResponse(bucket, response.data as PagedResult<ScheduledMeeting>, reset);
          },
          error: () => {
            state.loading = false;
          },
        });
      return;
    }

    (Object.keys(this.meetingsState) as MeetingBucket[]).forEach((meetingBucket) => {
      if (reset) {
        this.meetingsState[meetingBucket] = this.createSectionState<ScheduledMeeting>();
      }
      this.meetingsState[meetingBucket].loading = true;
    });

    this.salesDashboardService
      .getSectionData(2, {
        ...this.getApiFilters(),
        page: 1,
        pageSize: this.pageSize,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const payload = response.data as BucketedPagedResult<ScheduledMeeting>;
          this.applyMeetingBucketResponse('overdue', payload.overdue, true);
          this.applyMeetingBucketResponse('today', payload.today, true);
          this.applyMeetingBucketResponse('future', payload.future, true);
        },
        error: () => {
          (Object.keys(this.meetingsState) as MeetingBucket[]).forEach((meetingBucket) => {
            this.meetingsState[meetingBucket].loading = false;
          });
        },
      });
  }

  private applyListSectionResponse(section: ListSection, response: PagedResult<any>, reset: boolean): void {
    const normalizedItems = this.decorateSectionItems(section, response.items);
    const state = this.sectionStates[section];
    state.items = reset ? normalizedItems : [...state.items, ...normalizedItems];
    state.page = response.page;
    state.pageSize = response.pageSize;
    state.totalCount = response.totalCount;
    state.hasMore = response.hasMore;
    state.loading = false;
    state.initialized = true;
  }

  private applyMeetingBucketResponse(
    bucket: MeetingBucket,
    response: PagedResult<ScheduledMeeting>,
    reset: boolean,
  ): void {
    const state = this.meetingsState[bucket];
    state.items = reset ? response.items : [...state.items, ...response.items];
    state.page = response.page;
    state.pageSize = response.pageSize;
    state.totalCount = response.totalCount;
    state.hasMore = response.hasMore;
    state.loading = false;
    state.initialized = true;
  }

  private decorateSectionItems(section: ListSection, items: any[]): any[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items.map((item) => {
      if (section === 1) {
        const idleMetrics = this.getElapsedMetrics(item.createdOn);
        return {
          ...item,
          daysIdle: this.daysBetween(new Date(item.createdOn), today),
          idleDisplay: idleMetrics.display,
          idleHours: idleMetrics.hours,
        };
      }
      if (section === 4) {
        const meetingMetrics = this.getElapsedMetrics(item.lastMeetingDate);
        return {
          ...item,
          daysSinceMeeting: Math.floor(meetingMetrics.hours / 24),
          elapsedDisplay: meetingMetrics.display,
        };
      }
      if (section === 5) {
        const waitMetrics = this.getElapsedMetrics(item.customerCreatedOn);
        return {
          ...item,
          daysWithoutQuote: Math.floor(waitMetrics.hours / 24),
          waitingDisplay: waitMetrics.display,
        };
      }
      if (section === 6) {
        const enquiryMetrics = this.getElapsedMetrics(item.EnquiryDate);
        return {
          ...item,
          daysPending: Math.floor(enquiryMetrics.hours / 24),
          elapsedDisplay: enquiryMetrics.display,
        };
      }
      if (section === 7) {
        const pendingMetrics = this.getElapsedMetrics(item.QuoteDate);
        return {
          ...item,
          daysPending: Math.floor(pendingMetrics.hours / 24),
          elapsedDisplay: pendingMetrics.display,
        };
      }
      if (section === 8) {
        const approvalMetrics = item.approvedOn
          ? this.getElapsedMetrics(item.approvedOn)
          : { display: '\u2014', hours: 0 };
        return {
          ...item,
          daysSinceApproval: item.approvedOn ? Math.floor(approvalMetrics.hours / 24) : 0,
          elapsedDisplay: approvalMetrics.display,
        };
      }
      return item;
    });
  }

  private buildChartsFromCounts(countsData: SalesDashboardCounts): void {
    this.buildFunnelChart(countsData.charts.funnelCounts);
    this.buildLeadSourceDonut(countsData.charts.leadSourceDistribution || []);
  }

  private buildFunnelChart(counts: FunnelCounts): void {
    const pathMix = counts.pathMix || {
      enquiry: { viaLead: 0, viaCustomer: 0 },
      quote: { viaLead: 0, viaCustomer: 0 },
      approvedQuote: { viaLead: 0, viaCustomer: 0 },
      booking: { viaLead: 0, viaCustomer: 0 },
      customer: { viaMeeting: 0, viaApprovedQuote: 0 },
    };
    const items = [
      {
        label: 'Lead Created',
        value: counts.totalLeads,
        icon: 'fas fa-search',
        color: 'linear-gradient(90deg, #044a6c, #05608D)',
        tooltip: this.getFunnelTooltip('Lead Created', counts.totalLeads, counts.totalLeads),
      },
      {
        label: 'Meeting Scheduled',
        value: counts.leadsWithMeeting,
        icon: 'fas fa-handshake',
        color: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
        tooltip: this.getFunnelTooltip('Meeting Scheduled', counts.leadsWithMeeting, counts.totalLeads),
      },
      {
        label: 'Customer Converted',
        value: counts.leadsTurnedCustomer,
        icon: 'fas fa-user-check',
        color: 'linear-gradient(90deg, #0f766e, #14b8a6)',
        tooltip: this.getFunnelTooltip('Customer Converted', counts.leadsTurnedCustomer, counts.totalLeads, [
          `${pathMix.customer.viaMeeting} via confirmed meeting`,
          `${pathMix.customer.viaApprovedQuote} via approved quotation`,
        ]),
      },
      {
        label: 'Enquiry Created',
        value: counts.leadsWithEnquiry,
        icon: 'fas fa-comment-dots',
        color: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
        tooltip: this.getFunnelTooltip('Enquiry Created', counts.leadsWithEnquiry, counts.totalLeads, [
          `${pathMix.enquiry.viaLead} via lead-linked enquiry`,
          `${pathMix.enquiry.viaCustomer} via customer-linked enquiry`,
        ]),
      },
      {
        label: 'Quotation Created',
        value: counts.leadsWithQuote,
        icon: 'fas fa-file-invoice-dollar',
        color: 'linear-gradient(90deg, #f97316, #fb923c)',
        tooltip: this.getFunnelTooltip('Quotation Created', counts.leadsWithQuote, counts.totalLeads, [
          `${pathMix.quote.viaLead} via lead-linked quote`,
          `${pathMix.quote.viaCustomer} via customer-linked quote`,
        ]),
      },
      {
        label: 'Quotation Approved',
        value: counts.leadsWithApprovedQuote,
        icon: 'fas fa-stamp',
        color: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
        tooltip: this.getFunnelTooltip('Quotation Approved', counts.leadsWithApprovedQuote, counts.totalLeads, [
          `${pathMix.approvedQuote.viaLead} via lead-linked quote`,
          `${pathMix.approvedQuote.viaCustomer} via customer-linked quote`,
        ]),
      },
      {
        label: 'Booking Created',
        value: counts.leadsWithBooking,
        icon: 'fas fa-calendar-check',
        color: 'linear-gradient(90deg, #16a34a, #4ade80)',
        tooltip: this.getFunnelTooltip('Booking Created', counts.leadsWithBooking, counts.totalLeads, [
          `${pathMix.booking.viaLead} via lead-linked chain`,
          `${pathMix.booking.viaCustomer} via customer-linked chain`,
        ]),
      },
    ];
    const maxVal = Math.max(...items.map((item) => item.value), 1);
    const totalValue = items[0]?.value || 0;

    this.funnelRows = items.map((item) => ({
      ...item,
      widthPct: item.value > 0 ? Math.max((item.value / maxVal) * 100, 16) : 16,
      pctOfTotal: totalValue > 0 ? Math.round((item.value / totalValue) * 1000) / 10 : 0,
    }));
  }

  private getFunnelTooltip(
    label: string,
    value: number,
    totalLeads: number,
    extraLines: string[] = [],
  ): string {
    const pctOfTotal = totalLeads > 0 ? Math.round((value / totalLeads) * 1000) / 10 : 0;
    return [
      `${label}: ${value} leads`,
      `${pctOfTotal}% of total leads`,
      ...extraLines,
    ].join('\n');
  }

  private buildLeadSourceDonut(distribution: LeadSourceDistribution[]): void {
    const normalizedDistribution = distribution
      .map((item) => ({
        source: item.source || 'Unknown',
        count: item.count || 0,
      }))
      .sort((left, right) => right.count - left.count);
    const hasData = normalizedDistribution.length > 0;
    const chartData = hasData ? normalizedDistribution : [{ source: 'NoData', count: 1 }];
    const totalLeads = normalizedDistribution.reduce((total, item) => total + item.count, 0);

    const palette = [
      '#05608D',
      '#06b6d4',
      '#f59e0b',
      '#16a34a',
      '#f97316',
      '#8b5cf6',
      '#ec4899',
      '#0ea5a4',
      '#dc2626',
      '#64748b',
      '#84cc16',
      '#14b8a6',
    ];
    const segmentColors = chartData.map((item, index) => item.source === 'NoData' ? '#cbd5e1' : palette[index % palette.length]);

    this.leadSourceDonutOptions = {
      series: chartData.map((item) => item.count),
      chart: { type: 'donut', height: 300 },
      labels: chartData.map((item) => item.source === 'NoData' ? 'No data' : item.source),
      colors: segmentColors,
      legend: {
        position: 'right',
        fontSize: '11px',
        fontWeight: 500,
        markers: { width: 10, height: 10, radius: 3 },
        itemMargin: { vertical: 2 },
      },
      dataLabels: {
        enabled: hasData,
        style: {
          fontSize: '11px',
          fontWeight: 700,
          colors: segmentColors.map((color) => this.getReadableTextColor(color)),
        },
        dropShadow: { enabled: false },
      },
      stroke: { width: 2, colors: ['#fff'] },
      plotOptions: {
        pie: {
          donut: {
            background: '#0d4f74',
            size: '62%',
            labels: {
              show: true,
              name: { fontSize: '12px', fontWeight: 700, color: '#ffffff' },
              value: {
                fontSize: '18px',
                fontWeight: 800,
                color: '#ffffff',
                formatter: (value: string) => (hasData ? value : '0'),
              },
              total: {
                show: true,
                label: hasData ? 'Total Leads' : 'No source data',
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
                formatter: () => `${totalLeads}`,
              },
            },
          },
        },
      },
    };
  }

  private getReadableTextColor(backgroundHex: string): string {
    const hex = backgroundHex.replace('#', '');
    const normalizedHex = hex.length === 3
      ? hex.split('').map((char) => char + char).join('')
      : hex;

    const r = parseInt(normalizedHex.substring(0, 2), 16);
    const g = parseInt(normalizedHex.substring(2, 4), 16);
    const b = parseInt(normalizedHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.6 ? '#0f172a' : '#ffffff';
  }

  private createSectionState<T>(): SectionState<T> {
    return {
      items: [],
      page: 0,
      pageSize: this.pageSize,
      totalCount: 0,
      hasMore: true,
      loading: false,
      initialized: false,
    };
  }

  private resetSectionStates(): void {
    this.sectionStates = {
      1: this.createSectionState<LeadNoMeeting>(),
      3: this.createSectionState<MeetingWithFollowup>(),
      4: this.createSectionState<MeetingNotConverted>(),
      5: this.createSectionState<CustomerNoQuote>(),
      6: this.createSectionState<EnquiryNoQuotation>(),
      7: this.createSectionState<QuoteNotApproved>(),
      8: this.createSectionState<QuoteNoBooking>(),
    };
    this.meetingsState = {
      overdue: this.createSectionState<ScheduledMeeting>(),
      today: this.createSectionState<ScheduledMeeting>(),
      future: this.createSectionState<ScheduledMeeting>(),
    };
  }

  private resetListSectionState(section: ListSection): void {
    this.sectionStates[section] = this.createSectionState<any>();
  }

  private clearSectionSearches(): void {
    this.searchTerms = {};
    this.clearPendingSearchTimers();
  }

  private clearPendingSearchTimers(): void {
    this.listSections.forEach((section) => {
      const timer = this.sectionSearchTimers[section];
      if (timer) {
        clearTimeout(timer);
      }
    });
  }

  private shouldLoadMore(event: Event): boolean {
    const target = event.target as HTMLElement;
    return target.scrollHeight - target.scrollTop - target.clientHeight <= this.scrollThreshold;
  }

  private isMeetingsInitialized(): boolean {
    return (Object.keys(this.meetingsState) as MeetingBucket[]).every(
      (bucket) => this.meetingsState[bucket].initialized,
    );
  }

  private isListSection(section: number): section is ListSection {
    return this.listSections.includes(section as ListSection);
  }

  private daysBetween(startDate: Date, endDate: Date): number {
    return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private getElapsedMetrics(dateValue: string): { display: string; hours: number } {
    const now = new Date();
    const createdOn = new Date(dateValue);
    const diffMs = Math.max(0, now.getTime() - createdOn.getTime());
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (totalMinutes < 60) {
      const minutes = Math.max(totalMinutes, 1);
      return { display: `${minutes}m ago`, hours: 0 };
    }

    if (totalHours < 24) {
      return { display: `${totalHours}h ago`, hours: totalHours };
    }

    return { display: `${totalDays}d ago`, hours: totalHours };
  }

  private getApiFilters() {
    const company = this.appSettings.decrypt(localStorage.getItem('selected-company'));
    const branch = this.appSettings.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettings.getDecryptedUserProfile();

    return {
      companyMasterSid: company.CompanyMasterSid,
      branchMasterSid: branch?.BranchMasterSid ?? company.BranchMasterSid,
      dateFrom: this.dateFromInput ? this.toDateTimeStr(this.dateFromInput, 'start') : undefined,
      dateTo: this.dateToInput ? this.toDateTimeStr(this.dateToInput, 'end') : undefined,
      naiveDateFrom: this.dateFromInput ? this.toNaiveDateTimeStr(this.dateFromInput, 'start') : undefined,
      naiveDateTo: this.dateToInput ? this.toNaiveDateTimeStr(this.dateToInput, 'end') : undefined,
      salespersonId: userProfile?.UserMasterSid,
      salespersonEmail: userProfile?.userEmail,
    };
  }

  private toDateTimeStr(dateValue: Date, boundary: 'start' | 'end'): string {
    const date = new Date(dateValue);

    if (boundary === 'start') {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }

    return date.toISOString();
  }

  /**
   * Builds date boundaries for "timestamp without time zone" columns (meetingDate, followUpDate).
   * Uses Date.UTC to match how the DateTimePicker stores these values — the user's
   * selected date/time is stored as-is, without any local→UTC timezone conversion.
   */
  private toNaiveDateTimeStr(dateValue: Date, boundary: 'start' | 'end'): string {
    const d = new Date(dateValue);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();

    if (boundary === 'start') {
      return new Date(Date.UTC(y, m, day, 0, 0, 0, 0)).toISOString();
    }
    return new Date(Date.UTC(y, m, day, 23, 59, 59, 999)).toISOString();
  }

  private setDefaultDateRange(): void {
    this.setPreset('month', false);
  }

  private normalizeDateRange(changedField?: 'from' | 'to'): void {
    if (!this.dateFromInput || !this.dateToInput) {
      return;
    }

    if (this.dateFromInput <= this.dateToInput) {
      return;
    }

    if (changedField === 'from') {
      this.dateToInput = new Date(this.dateFromInput);
      return;
    }

    if (changedField === 'to') {
      this.dateFromInput = new Date(this.dateToInput);
      return;
    }

    this.dateToInput = new Date(this.dateFromInput);
  }
}

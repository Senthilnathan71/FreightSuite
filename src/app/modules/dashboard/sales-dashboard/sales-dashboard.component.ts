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
  LeadNoMeeting,
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

type ListSection = 1 | 3 | 4 | 5 | 6 | 7;

interface SectionState<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  initialized: boolean;
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
  private readonly leadStatusOrder = [
    'Discovery',
    'Qualify',
    'MeetingScheduled',
    'MeetingCompleted',
    'EnquiryGenerated',
    'QuotationCreated',
    'QuotationConfirmed',
    'ContractSigned',
    'DealWon',
    'DealLost',
    'CustomerCreated',
  ];
  private readonly listSections: ListSection[] = [1, 3, 4, 5, 6, 7];
  private readonly sectionSearchTimers: Partial<Record<ListSection, ReturnType<typeof setTimeout>>> = {};

  readonly maxDateTo: NgbDateStruct = toNgbDateStruct(new Date())!;

  dashboardCounts: SalesDashboardCounts | null = null;
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
  };

  searchTerms: Partial<Record<ListSection, string>> = {};
  sectionStates: Record<ListSection, SectionState<any>> = {
    1: this.createSectionState<LeadNoMeeting>(),
    3: this.createSectionState<MeetingWithFollowup>(),
    4: this.createSectionState<MeetingNotConverted>(),
    5: this.createSectionState<CustomerNoQuote>(),
    6: this.createSectionState<QuoteNotApproved>(),
    7: this.createSectionState<QuoteNoBooking>(),
  };
  meetingsState: Record<MeetingBucket, SectionState<ScheduledMeeting>> = {
    overdue: this.createSectionState<ScheduledMeeting>(),
    today: this.createSectionState<ScheduledMeeting>(),
    future: this.createSectionState<ScheduledMeeting>(),
  };

  funnelChartOptions: any = {};
  meetingsBarOptions: any = {};
  leadStatusDonutOptions: any = {};
  quoteVsBookingOptions: any = {};
  funnelRows: { label: string; value: number; color: string; pct: number }[] = [];

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

    switch (preset) {
      case 'today':
        this.dateFromInput = new Date(now);
        this.dateToInput = new Date(now);
        break;
      case 'week': {
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + 1);
        this.dateFromInput = new Date(monday);
        this.dateToInput = new Date(now);
        break;
      }
      case 'month':
        this.dateFromInput = new Date(new Date(now.getFullYear(), now.getMonth(), 1));
        this.dateToInput = new Date(now);
        break;
      case 'fy': {
        const fy = this.appSettings.getCurrentFinancialYear();
        if (fy) {
          this.dateFromInput = new Date(fy.StartDate);
          const fyEnd = new Date(fy.EndDate);
          this.dateToInput = fyEnd < now ? fyEnd : new Date(now);
        } else {
          const fyStart = now.getMonth() >= 3
            ? new Date(now.getFullYear(), 3, 1)
            : new Date(now.getFullYear() - 1, 3, 1);
          this.dateFromInput = fyStart;
          this.dateToInput = new Date(now);
        }
        break;
      }
    }

    if (shouldLoad) {
      this.loadDashboardData();
    }
  }

  toggleSection(section: number): void {
    this.expandedSections[section] = !this.expandedSections[section];

    if (!this.expandedSections[section] || section === 8) {
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
    return this.sectionStates[6].items;
  }

  getQuotesNoBookingRows(): QuoteNoBooking[] {
    return this.sectionStates[7].items;
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

  navigateToPreCustomer(sid: number): void {
    this.router.navigate(['/crm/pre-customer/entry', sid]);
  }

  navigateToCustomer(sid: number): void {
    this.router.navigate(['/master/customer/entry', sid]);
  }

  navigateToQuote(sid: number): void {
    this.router.navigate(['/crm/quotation/entry', sid]);
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
        return {
          ...item,
          daysSinceMeeting: this.daysBetween(new Date(item.lastMeetingDate), today),
        };
      }
      if (section === 5) {
        return {
          ...item,
          daysWithoutQuote: this.daysBetween(new Date(item.customerCreatedOn), today),
        };
      }
      if (section === 7) {
        return {
          ...item,
          daysSinceApproval: item.InternalApprovedOn
            ? this.daysBetween(new Date(item.InternalApprovedOn), today)
            : 0,
        };
      }
      return item;
    });
  }

  private buildChartsFromCounts(countsData: SalesDashboardCounts): void {
    this.buildFunnelChart(countsData.charts.funnelCounts);
    this.buildMeetingsBarChart(countsData.charts.meetingsBoardCounts);
    this.buildLeadStatusDonut(countsData.charts.leadStatusDistribution || []);
    this.buildQuoteVsBookingChart();
  }

  private buildFunnelChart(counts: any): void {
    const items = [
      { label: 'Leads (No Meeting)', value: counts.leadsNoMeeting, color: 'linear-gradient(90deg, #044a6c, #05608D)' },
      { label: 'Meetings Scheduled', value: counts.meetingsScheduled, color: 'linear-gradient(90deg, #05608D, #0891b2)' },
      { label: 'Follow-Ups Pending', value: counts.followUpsPending, color: 'linear-gradient(90deg, #7c3aed, #a78bfa)' },
      { label: 'Business not converted', value: counts.meetingsNotConverted, color: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
      { label: 'Customers (No Quote)', value: counts.customersNoQuote, color: 'linear-gradient(90deg, #06b6d4, #22d3ee)' },
      { label: 'Quotes Pending', value: counts.quotesNotApproved, color: 'linear-gradient(90deg, #f97316, #fb923c)' },
      { label: 'Approved (No Booking)', value: counts.quotesNoBooking, color: 'linear-gradient(90deg, #ec4899, #f472b6)' },
      { label: 'Bookings Created', value: counts.totalBookings, color: 'linear-gradient(90deg, #16a34a, #4ade80)' },
    ];
    const maxVal = Math.max(...items.map((item) => item.value), 1);
    this.funnelRows = items.map((item) => ({
      ...item,
      pct: Math.max((item.value / maxVal) * 100, 8),
    }));
  }

  private buildMeetingsBarChart(counts: any): void {
    this.meetingsBarOptions = {
      series: [
        { name: 'Overdue', data: [counts.overdue] },
        { name: 'Today', data: [counts.today] },
        { name: 'Future', data: [counts.future] },
      ],
      chart: { type: 'bar', height: 180, toolbar: { show: false } },
      colors: ['#ef4444', '#f59e0b', '#16a34a'],
      plotOptions: {
        bar: { horizontal: false, columnWidth: '55%', borderRadius: 6 },
      },
      dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700 } },
      xaxis: { categories: ['Meetings'] },
      legend: { position: 'bottom' },
    };
  }

  private buildLeadStatusDonut(distribution: Array<{ status: string; count: number }>): void {
    const sortedDistribution = [...distribution].sort((left, right) => {
      const leftIndex = this.leadStatusOrder.indexOf(left.status);
      const rightIndex = this.leadStatusOrder.indexOf(right.status);
      const safeLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const safeRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      return safeLeftIndex - safeRightIndex;
    });
    const hasData = sortedDistribution.length > 0;
    const chartData = hasData ? sortedDistribution : [{ status: 'NoData', count: 1 }];
    const totalLeads = sortedDistribution.reduce((total, item) => total + item.count, 0);

    const statusColors: Record<string, string> = {
      Discovery: '#64748b',
      Qualify: '#05608D',
      MeetingScheduled: '#f59e0b',
      MeetingCompleted: '#8b5cf6',
      EnquiryGenerated: '#06b6d4',
      QuotationCreated: '#f97316',
      QuotationConfirmed: '#14b8a6',
      ContractSigned: '#22c55e',
      DealWon: '#16a34a',
      DealLost: '#dc2626',
      CustomerCreated: '#0ea5a4',
      NoData: '#cbd5e1',
    };

    const segmentColors = chartData.map((item) => statusColors[item.status] || '#94a3b8');

    this.leadStatusDonutOptions = {
      series: chartData.map((item) => item.count),
      chart: { type: 'donut', height: 220 },
      labels: chartData.map((item) => item.status === 'NoData' ? 'No data' : this.camelToWords(item.status)),
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
                label: hasData ? 'Total Leads' : 'No lead data',
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

  private buildQuoteVsBookingChart(): void {
    if (!this.dashboardCounts) return;

    const quotes = this.dashboardCounts.summaryKpis.quotes;
    const bookings = this.dashboardCounts.summaryKpis.bookings;

    this.quoteVsBookingOptions = {
      series: [
        { name: 'Quotes', data: [quotes.totalQuotes] },
        { name: 'Approved', data: [quotes.approvedQuotes] },
        { name: 'Bookings', data: [bookings.totalBookings] },
      ],
      chart: { type: 'bar', height: 180, stacked: false, toolbar: { show: false } },
      colors: ['#05608D', '#16a34a', '#06b6d4'],
      plotOptions: {
        bar: { horizontal: false, columnWidth: '50%', borderRadius: 6 },
      },
      dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700 } },
      xaxis: { categories: ['Pipeline'] },
      legend: { position: 'bottom' },
    };
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
      6: this.createSectionState<QuoteNotApproved>(),
      7: this.createSectionState<QuoteNoBooking>(),
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

  private setDefaultDateRange(): void {
    this.setPreset('month', false);
  }
}

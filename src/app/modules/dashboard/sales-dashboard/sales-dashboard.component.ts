import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgbDateAdapter, NgbDatepickerModule, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { SalesDashboardService } from '../services/sales-dashboard.service';
import {
  SalesDashboardData,
  SalesDashboardCounts,
  SalesDashboardFilters,
  LeadNoMeeting,
  ScheduledMeeting,
  MeetingsScheduledGroup,
  MeetingWithFollowup,
  MeetingNotConverted,
  CustomerNoQuote,
  QuoteNotApproved,
  QuoteNoBooking,
} from '../interfaces/sales-dashboard.interfaces';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { toNgbDateStruct } from 'src/app/common/helper';

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
  private destroy$ = new Subject<void>();
  readonly maxDateTo: NgbDateStruct = toNgbDateStruct(new Date())!;

  dashboardData: SalesDashboardData | null = null;
  dashboardCounts: SalesDashboardCounts | null = null;
  isLoading = false;
  dateFromInput: Date | null = null;
  dateToInput: Date | null = null;

  filters: SalesDashboardFilters = {};
  activePreset: string = 'month';

  expandedSections: Record<number, boolean> = {
    1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: true,
  };

  // Lazy loading state
  sectionData: Record<number, any> = {};
  sectionLoading: Record<number, boolean> = {};
  sectionLoaded: Record<number, boolean> = {};

  searchTerms: Record<number, string> = {};

  // Chart options
  funnelChartOptions: any = {};
  meetingsBarOptions: any = {};
  leadStatusDonutOptions: any = {};
  quoteVsBookingOptions: any = {};

  // Funnel data for custom CSS funnel
  funnelRows: { label: string; value: number; color: string; pct: number }[] = [];
  private readonly emptyMeetingsGroup: MeetingsScheduledGroup = {
    overdue: [],
    today: [],
    future: [],
  };

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
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getApiFilters() {
    const company = this.appSettings.decrypt(
      localStorage.getItem('selected-company'),
    );
    const branch = this.appSettings.decrypt(
      localStorage.getItem('selected-branch'),
    );
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

  loadDashboardData(): void {
    this.isLoading = true;

    // Reset lazy-load state
    this.sectionData = {};
    this.sectionLoaded = {};
    this.sectionLoading = {};

    this.salesDashboardService
      .getSalesDashboardCounts(this.getApiFilters())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dashboardCounts = response.data;
          this.buildChartsFromCounts(response.data);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  applyFilters(): void {
    this.activePreset = '';
    this.loadDashboardData();
  }

  resetFilters(): void {
    this.filters = {};
    this.setDefaultDateRange();
    this.loadDashboardData();
  }

  setPreset(preset: string): void {
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
        this.dateFromInput = new Date(
          new Date(now.getFullYear(), now.getMonth(), 1),
        );
        this.dateToInput = new Date(now);
        break;
      case 'fy': {
        const fy = this.appSettings.getCurrentFinancialYear();
        if (fy) {
          this.dateFromInput = new Date(fy.StartDate);
          const fyEnd = new Date(fy.EndDate);
          this.dateToInput = fyEnd < now ? fyEnd : new Date(now);
        } else {
          // Fallback: April 1 to today
          const fyStart = now.getMonth() >= 3
            ? new Date(now.getFullYear(), 3, 1)
            : new Date(now.getFullYear() - 1, 3, 1);
          this.dateFromInput = fyStart;
          this.dateToInput = new Date(now);
        }
        break;
      }
    }
    this.loadDashboardData();
  }

  toggleSection(section: number): void {
    this.expandedSections[section] = !this.expandedSections[section];
    if (this.expandedSections[section] && !this.sectionLoaded[section] && section !== 8) {
      this.loadSection(section);
    }
  }

  private loadSection(section: number): void {
    this.sectionLoading[section] = true;
    this.salesDashboardService
      .getSectionData(section, this.getApiFilters())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.sectionData[section] = response.data;
          this.computeSectionDayFields(section);
          this.sectionLoaded[section] = true;
          this.sectionLoading[section] = false;
        },
        error: () => {
          this.sectionLoading[section] = false;
        },
      });
  }

  // ── Computed day fields ──

  private computeSectionDayFields(section: number): void {
    const data = this.sectionData[section];
    if (!data) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (section) {
      case 1:
        (data as LeadNoMeeting[]).forEach((lead) => {
          lead.daysIdle = this.daysBetween(new Date(lead.createdOn), today);
        });
        break;
      case 4:
        (data as MeetingNotConverted[]).forEach((m) => {
          m.daysSinceMeeting = this.daysBetween(new Date(m.lastMeetingDate), today);
        });
        break;
      case 5:
        (data as CustomerNoQuote[]).forEach((c) => {
          c.daysWithoutQuote = this.daysBetween(new Date(c.customerCreatedOn), today);
        });
        break;
      case 7:
        (data as QuoteNoBooking[]).forEach((q) => {
          if (q.InternalApprovedOn) {
            q.daysSinceApproval = this.daysBetween(new Date(q.InternalApprovedOn), today);
          }
        });
        break;
    }
  }

  private daysBetween(d1: Date, d2: Date): number {
    return Math.max(0, Math.floor(
      (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24),
    ));
  }

  // ── Section filtering ──

  filterSection<T>(items: T[], section: number): T[] {
    const term = (this.searchTerms[section] || '').toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      Object.values(item as any).some(
        (val) =>
          val != null && String(val).toLowerCase().includes(term),
      ),
    );
  }

  // ── Display helpers ──

  getLeadsNoMeetingRows(): LeadNoMeeting[] {
    return this.filterSection((this.sectionData[1] as LeadNoMeeting[]) || [], 1);
  }

  getMeetingsScheduledGroup(): MeetingsScheduledGroup {
    return (this.sectionData[2] as MeetingsScheduledGroup) || this.emptyMeetingsGroup;
  }

  getMeetingsWithFollowupRows(): MeetingWithFollowup[] {
    return this.filterSection((this.sectionData[3] as MeetingWithFollowup[]) || [], 3);
  }

  getMeetingsNotConvertedRows(): MeetingNotConverted[] {
    return this.filterSection((this.sectionData[4] as MeetingNotConverted[]) || [], 4);
  }

  getCustomersNoQuoteRows(): CustomerNoQuote[] {
    return this.filterSection((this.sectionData[5] as CustomerNoQuote[]) || [], 5);
  }

  getQuotesNotApprovedRows(): QuoteNotApproved[] {
    return this.filterSection((this.sectionData[6] as QuoteNotApproved[]) || [], 6);
  }

  getQuotesNoBookingRows(): QuoteNoBooking[] {
    return this.filterSection((this.sectionData[7] as QuoteNoBooking[]) || [], 7);
  }

  getDisplayName(item: any): string {
    if (item.LeadOrCustomer === 'C' && item.CustomerName) {
      return item.CustomerName;
    }
    return item.preCustomerName || item.CustomerName || '\u2014';
  }

  getQuoteCustomerName(item: any): string {
    if (item.LeadOrCustomer === 'C' || item.LeadOrCustomer === null) {
      return item.CustomerName || '\u2014';
    }
    return item.preCustomerName || '\u2014';
  }

  camelToWords(str: string): string {
    return str ? str.replace(/([a-z])([A-Z])/g, '$1 $2') : '';
  }

  formatMeetingDateTime(isoString: string, timeOnly = false): string {
    if (!isoString) return '\u2014';
    // Parse without timezone conversion
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return isoString;
    const [, year, month, day, hours24, minutes] = match;
    const h = parseInt(hours24, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const timeStr = `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
    if (timeOnly) return timeStr;
    return `${day}/${month}/${year} ${timeStr}`;
  }

  getDaysPillClass(days: number, threshold: number = 7): string {
    if (days > threshold) return 'danger';
    if (days > threshold / 2) return 'warning';
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
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  }

  getConversionRate(): number {
    if (!this.dashboardCounts) return 0;
    const { totalQuotes } = this.dashboardCounts.summaryKpis.quotes;
    const { totalBookings } = this.dashboardCounts.summaryKpis.bookings;
    if (!totalQuotes) return 0;
    return Math.round((totalBookings / totalQuotes) * 1000) / 10;
  }

  getQuoteToBookingRate(): number {
    if (!this.dashboardCounts) return 0;
    const { approvedQuotes } = this.dashboardCounts.summaryKpis.quotes;
    const { bookingsFromQuote } = this.dashboardCounts.summaryKpis.bookings;
    if (!approvedQuotes) return 0;
    return Math.round((bookingsFromQuote / approvedQuotes) * 1000) / 10;
  }

  // ── Charts ──

  private buildChartsFromCounts(countsData: SalesDashboardCounts): void {
    const { charts } = countsData;

    this.buildFunnelChart(charts.funnelCounts);
    this.buildMeetingsBarChart(charts.meetingsBoardCounts);
    this.buildLeadStatusDonut(charts.leadStatusDistribution);
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
    const maxVal = Math.max(...items.map((i) => i.value), 1);
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

  private buildLeadStatusDonut(distribution: any[]): void {
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
    };

    const segmentColors = distribution.map(
      (d) => statusColors[d.status] || '#94a3b8',
    );

    this.leadStatusDonutOptions = {
      series: distribution.map((d) => d.count),
      chart: { type: 'donut', height: 220 },
      labels: distribution.map((d) => this.camelToWords(d.status)),
      colors: segmentColors,
      legend: {
        position: 'right',
        fontSize: '11px',
        fontWeight: 500,
        markers: { width: 10, height: 10, radius: 3 },
        itemMargin: { vertical: 2 },
      },
      dataLabels: {
        enabled: true,
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
              value: { fontSize: '18px', fontWeight: 800, color: '#ffffff' },
              total: {
                show: true,
                label: 'Total Leads',
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
              },
            },
          },
        },
      },
    };
  }

  private getReadableTextColor(backgroundHex: string): string {
    const hex = backgroundHex.replace('#', '');
    const normalizedHex =
      hex.length === 3
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
    const { quotes, bookings } = this.dashboardCounts.summaryKpis;

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

  // ── Navigation helpers ──

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

  navigateToMeetingSchedule(preCustomerSid: number): void {
    this.router.navigate(['/crm/pre-customer-meeting/entry'], {
      queryParams: { preCustomerMasterSid: preCustomerSid },
    });
  }

  private toDateTimeStr(d: Date, boundary: 'start' | 'end'): string {
    const date = new Date(d);

    if (boundary === 'start') {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }

    return date.toISOString();
  }

  private setDefaultDateRange(): void {
    this.setPreset('month');
  }
}

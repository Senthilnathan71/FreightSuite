import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { SalesDashboardService } from '../services/sales-dashboard.service';
import {
  SalesDashboardData,
  SalesDashboardFilters,
  LeadNoMeeting,
  ScheduledMeeting,
  MeetingWithFollowup,
  MeetingNotConverted,
  CustomerNoQuote,
  QuoteNotApproved,
  QuoteNoBooking,
} from '../interfaces/sales-dashboard.interfaces';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './sales-dashboard.component.html',
  styleUrls: ['./sales-dashboard.component.scss'],
})
export class SalesDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dashboardData: SalesDashboardData | null = null;
  isLoading = false;

  filters: SalesDashboardFilters = {};
  activePreset: string = 'month';

  expandedSections: Record<number, boolean> = {
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true,
  };

  searchTerms: Record<number, string> = {};

  // Chart options
  funnelChartOptions: any = {};
  meetingsBarOptions: any = {};
  leadStatusDonutOptions: any = {};
  quoteVsBookingOptions: any = {};

  // Funnel data for custom CSS funnel
  funnelRows: { label: string; value: number; color: string; pct: number }[] = [];

  constructor(
    private salesDashboardService: SalesDashboardService,
    private appSettings: AppSettingsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setPreset('month');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    const company = this.appSettings.decrypt(
      localStorage.getItem('selected-company'),
    );
    const branch = this.appSettings.decrypt(
      localStorage.getItem('selected-branch'),
    );

    this.salesDashboardService
      .getSalesDashboardData({
        companyMasterSid: company.CompanyMasterSid,
        branchMasterSid: branch?.BranchMasterSid ?? company.BranchMasterSid,
        ...this.filters,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dashboardData = response.data;
          this.computeDayFields();
          this.buildCharts();
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
    this.setPreset('month');
  }

  setPreset(preset: string): void {
    this.activePreset = preset;
    const now = new Date();
    switch (preset) {
      case 'today':
        this.filters.dateFrom = this.toDateStr(now);
        this.filters.dateTo = this.toDateStr(now);
        break;
      case 'week': {
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + 1);
        this.filters.dateFrom = this.toDateStr(monday);
        this.filters.dateTo = this.toDateStr(now);
        break;
      }
      case 'month':
        this.filters.dateFrom = this.toDateStr(
          new Date(now.getFullYear(), now.getMonth(), 1),
        );
        this.filters.dateTo = this.toDateStr(now);
        break;
      case 'quarter': {
        const qStart = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        this.filters.dateFrom = this.toDateStr(qStart);
        this.filters.dateTo = this.toDateStr(now);
        break;
      }
      case 'ytd':
        this.filters.dateFrom = this.toDateStr(
          new Date(now.getFullYear(), 0, 1),
        );
        this.filters.dateTo = this.toDateStr(now);
        break;
    }
    this.loadDashboardData();
  }

  toggleSection(section: number): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  // â”€â”€ Computed day fields â”€â”€

  private computeDayFields(): void {
    if (!this.dashboardData) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.dashboardData.sections.leadsNoMeeting.forEach((lead) => {
      lead.daysIdle = this.daysBetween(new Date(lead.createdOn), today);
    });

    this.dashboardData.sections.meetingsNotConverted.forEach((m) => {
      m.daysSinceMeeting = this.daysBetween(
        new Date(m.lastMeetingDate),
        today,
      );
    });

    this.dashboardData.sections.customersNoQuote.forEach((c) => {
      c.daysWithoutQuote = this.daysBetween(
        new Date(c.customerCreatedOn),
        today,
      );
    });

    this.dashboardData.sections.quotesNoBooking.forEach((q) => {
      if (q.InternalApprovedOn) {
        q.daysSinceApproval = this.daysBetween(
          new Date(q.InternalApprovedOn),
          today,
        );
      }
    });
  }

  private daysBetween(d1: Date, d2: Date): number {
    return Math.floor(
      (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // â”€â”€ Section filtering â”€â”€

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

  // â”€â”€ Display helpers â”€â”€

  getDisplayName(item: any): string {
    if (item.LeadOrCustomer === 'C' && item.CustomerName) {
      return item.CustomerName;
    }
    return item.preCustomerName || item.CustomerName || 'â€”';
  }

  getQuoteCustomerName(item: any): string {
    if (item.LeadOrCustomer === 'C' || item.LeadOrCustomer === null) {
      return item.CustomerName || 'â€”';
    }
    return item.preCustomerName || 'â€”';
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
    if (!this.dashboardData) return 0;
    const { totalQuotes } = this.dashboardData.sections.summaryKpis.quotes;
    const { totalBookings } = this.dashboardData.sections.summaryKpis.bookings;
    if (!totalQuotes) return 0;
    return Math.round((totalBookings / totalQuotes) * 1000) / 10;
  }

  getQuoteToBookingRate(): number {
    if (!this.dashboardData) return 0;
    const { approvedQuotes } = this.dashboardData.sections.summaryKpis.quotes;
    const { bookingsFromQuote } = this.dashboardData.sections.summaryKpis.bookings;
    if (!approvedQuotes) return 0;
    return Math.round((bookingsFromQuote / approvedQuotes) * 1000) / 10;
  }

  // â”€â”€ Charts â”€â”€

  private buildCharts(): void {
    if (!this.dashboardData) return;
    const { charts } = this.dashboardData;

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
      { label: 'Not Converted', value: counts.meetingsNotConverted, color: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
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
      labels: distribution.map((d) => d.status),
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
    if (!this.dashboardData) return;
    const { quotes, bookings } = this.dashboardData.sections.summaryKpis;

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

  // â”€â”€ Navigation helpers â”€â”€

  navigateToPreCustomer(sid: number): void {
    this.router.navigate(['/crm/pre-customer/entry', sid]);
  }

  navigateToCustomer(sid: number): void {
    this.router.navigate(['/master/customer/entry', sid]);
  }

  navigateToQuote(sid: number): void {
    this.router.navigate(['/crm/quotation/entry', sid]);
  }

  navigateToBookingCreate(quoteSid?: number): void {
    if (quoteSid) {
      this.router.navigate(['/operation/booking/entry'], {
        queryParams: { quotationHeaderSid: quoteSid },
      });
    } else {
      this.router.navigate(['/operation/booking/entry']);
    }
  }

  navigateToMeetingSchedule(preCustomerSid: number): void {
    this.router.navigate(['/crm/pre-customer-meeting/entry'], {
      queryParams: { preCustomerMasterSid: preCustomerSid },
    });
  }

  private toDateStr(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}

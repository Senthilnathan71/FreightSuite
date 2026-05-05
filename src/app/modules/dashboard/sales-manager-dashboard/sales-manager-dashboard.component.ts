import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgbModal,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDateStruct,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { Subject, forkJoin, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';

import { AppSettingsService } from '../../../core/services/app-settings.service';
import { SalesManagerDashboardService } from '../services/sales-manager-dashboard.service';
import {
  SalesManagerFilters,
  SalespersonInfo,
  SalesManagerCounts,
  ScoreboardRow,
  WeeklyTrendPoint,
  ResponseTimeMetric,
  ActivityFeedItem,
  AtRiskAlert,
  AgingRow,
  MeetingsBoardData,
  KpiCardConfig,
  ActionCenterItem,
} from '../interfaces/sales-manager-dashboard.interfaces';

// Sub-components
import { SmKpiCardsComponent } from './components/sm-kpi-cards/sm-kpi-cards.component';
import { SmMeetingsBoardComponent } from './components/sm-meetings-board/sm-meetings-board.component';
import { SmTrendChartComponent } from './components/sm-trend-chart/sm-trend-chart.component';
import { SmScoreboardComponent } from './components/sm-scoreboard/sm-scoreboard.component';
import { SmRadarChartComponent } from './components/sm-radar-chart/sm-radar-chart.component';
import { SmResponseTimesComponent } from './components/sm-response-times/sm-response-times.component';
import { SmAgingChartComponent } from './components/sm-aging-chart/sm-aging-chart.component';
import { SmAlertsComponent } from './components/sm-alerts/sm-alerts.component';
import { SmActivityFeedComponent } from './components/sm-activity-feed/sm-activity-feed.component';
import { SmTopPerformersComponent } from './components/sm-top-performers/sm-top-performers.component';

// Modals
import { SmDrillDownModalComponent } from './components/sm-drill-down-modal/sm-drill-down-modal.component';
import { SmReassignModalComponent } from './components/sm-reassign-modal/sm-reassign-modal.component';
import { SmCreateMeetingModalComponent } from './components/sm-create-meeting-modal/sm-create-meeting-modal.component';
import { SmReminderModalComponent } from './components/sm-reminder-modal/sm-reminder-modal.component';

@Component({
  selector: 'app-sales-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    SearchableDropdown,
    SmKpiCardsComponent,
    SmMeetingsBoardComponent,
    SmTrendChartComponent,
    SmScoreboardComponent,
    SmRadarChartComponent,
    SmResponseTimesComponent,
    SmAgingChartComponent,
    SmAlertsComponent,
    SmActivityFeedComponent,
    SmTopPerformersComponent,
  ],
  templateUrl: './sales-manager-dashboard.component.html',
  styleUrls: ['./sales-manager-dashboard.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class SalesManagerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private activityRefreshStarted = false;

  // Context
  companyMasterSid = 0;
  branchMasterSid = 0;

  // Filter state
  currentFilters: SalesManagerFilters = {};
  lastUpdated: Date | null = null;
  activePreset = 'month';
  dateFromInput: Date | null = null;
  dateToInput: Date | null = null;
  selectedSalespersonId: number | null = null;
  readonly maxDateTo: NgbDateStruct = toNgbDateStruct(new Date())!;

  // V2 UI state
  dateDropdownOpen = false;
  showAllKpis = false;
  liteMode = false;

  // Data
  salespersons: SalespersonInfo[] = [];
  counts: SalesManagerCounts | null = null;
  primaryKpiCards: KpiCardConfig[] = [];
  secondaryKpiCards: KpiCardConfig[] = [];
  kpiCards: KpiCardConfig[] = [];
  scoreboard: ScoreboardRow[] = [];
  weeklyTrend: WeeklyTrendPoint[] = [];
  responseTimes: ResponseTimeMetric[] = [];
  activityFeed: ActivityFeedItem[] = [];
  alerts: AtRiskAlert[] = [];
  aging: AgingRow[] = [];
  meetingsBoard: MeetingsBoardData | null = null;
  actionCenterItems: ActionCenterItem[] = [];

  // Loading states
  countsLoading = false;
  scoreboardLoading = false;
  chartsLoading = false;
  meetingsBoardLoading = false;
  alertsLoading = false;
  activityLoading = false;

  constructor(
    private appSettings: AppSettingsService,
    private service: SalesManagerDashboardService,
    private modalService: NgbModal,
  ) {}

  ngOnInit() {
    this.initContext();
    this.loadSalespersons();
    this.setPreset('month');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.dateDropdownOpen && !(event.target as HTMLElement).closest('.custom-range-wrap')) {
      this.dateDropdownOpen = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initContext() {
    try {
      const company = this.appSettings.decrypt(localStorage.getItem('selected-company'));
      const branch = this.appSettings.decrypt(localStorage.getItem('selected-branch'));
      this.companyMasterSid = company?.CompanyMasterSid || 0;
      this.branchMasterSid = branch?.BranchMasterSid || 0;
    } catch {
      this.companyMasterSid = 0;
      this.branchMasterSid = 0;
    }
  }

  private loadSalespersons() {
    this.service.getSalespersons(this.companyMasterSid, this.branchMasterSid).subscribe({
      next: (resp) => {
        this.salespersons = resp.data || [];
      },
    });
  }

  // ─── V2 UI HELPERS ──────────────────────────────────────────

  get activePresetLabel(): string {
    switch (this.activePreset) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'fy': return 'Financial Year';
      default: return 'Custom Range';
    }
  }

  get selectedSalespersonLabel(): string {
    if (!this.selectedSalespersonId) return 'All Salespersons';
    const sp = this.salespersons.find(s => s.UserMasterSid === this.selectedSalespersonId);
    return sp?.userName || 'Selected';
  }

  get salesOverviewDateRangeLabel(): string {
    const from = this.dateFromInput ? this.formatDisplayDate(this.dateFromInput) : '--';
    const to = this.dateToInput ? this.formatDisplayDate(this.dateToInput) : '--';
    return `From : ${from}  To : ${to}`;
  }

  toggleDateDropdown(event?: MouseEvent) {
    event?.stopPropagation();
    this.dateDropdownOpen = !this.dateDropdownOpen;
  }

  closeDateDropdown() {
    this.dateDropdownOpen = false;
  }

  // ─── FILTER CONTROLS ────────────────────────────────────────────

  setPreset(preset: string) {
    this.activePreset = preset;
    const now = new Date();
    const noon = (y: number, m: number, d: number) => new Date(y, m, d, 12);
    const todayNoon = noon(now.getFullYear(), now.getMonth(), now.getDate());

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
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        this.dateFromInput = noon(
          lastMonthDate.getFullYear(),
          lastMonthDate.getMonth(),
          1,
        );
        this.dateToInput = noon(
          lastMonthDate.getFullYear(),
          lastMonthDate.getMonth() + 1,
          0,
        );
        break;
      }
      case 'fy': {
        const fy = this.appSettings.getCurrentFinancialYear();
        if (fy) {
          this.dateFromInput = noon(
            new Date(fy.StartDate).getFullYear(),
            new Date(fy.StartDate).getMonth(),
            new Date(fy.StartDate).getDate(),
          );
          const fyEnd = noon(
            new Date(fy.EndDate).getFullYear(),
            new Date(fy.EndDate).getMonth(),
            new Date(fy.EndDate).getDate(),
          );
          this.dateToInput = fyEnd < todayNoon ? fyEnd : todayNoon;
        } else {
          const fyStart = now.getMonth() >= 3
            ? noon(now.getFullYear(), 3, 1)
            : noon(now.getFullYear() - 1, 3, 1);
          this.dateFromInput = fyStart;
          this.dateToInput = todayNoon;
        }
        break;
      }
    }

    this.closeDateDropdown();
    this.applyFilters();
  }

  onDateChange() {
    this.activePreset = '';
    if (!this.dateFromInput || !this.dateToInput) {
      return;
    }
    this.applyFilters();
  }

  onSalespersonChange(event: any) {
    this.selectedSalespersonId = event || null;
    this.applyFilters();
  }

  resetFilters() {
    this.selectedSalespersonId = null;
    this.setPreset('month');
  }

  getMinDateTo(): NgbDateStruct | undefined {
    return this.dateFromInput ? (toNgbDateStruct(this.dateFromInput) ?? undefined) : undefined;
  }

  getMaxDateFrom(): NgbDateStruct {
    return this.dateToInput ? (toNgbDateStruct(this.dateToInput) ?? this.maxDateTo) : this.maxDateTo;
  }

  private applyFilters() {
    const sp = this.selectedSalespersonId
      ? this.salespersons.find((s) => s.UserMasterSid === this.selectedSalespersonId)
      : null;

    this.currentFilters = {
      companyMasterSid: this.companyMasterSid,
      branchMasterSid: this.branchMasterSid,
      salespersonId: this.selectedSalespersonId || undefined,
      salespersonEmail: sp?.userEmail || undefined,
      dateFrom: this.dateFromInput ? this.toDateTimeStr(this.dateFromInput, 'start') : undefined,
      dateTo: this.dateToInput ? this.toDateTimeStr(this.dateToInput, 'end') : undefined,
      naiveDateFrom: this.dateFromInput ? this.toNaiveDateTimeStr(this.dateFromInput, 'start') : undefined,
      naiveDateTo: this.dateToInput ? this.toNaiveDateTimeStr(this.dateToInput, 'end') : undefined,
      preset: this.activePreset || undefined
    };

    this.loadAllData();
  }

  onRefresh() {
    this.loadAllData();
  }

  // ─── DATA LOADING ──────────────────────────────────────────────

  private loadAllData() {
    // I.4 — Clear stale data so all sections show loading/empty, not old data
    this.weeklyTrend = [];
    this.scoreboard = [];
    this.alerts = [];
    this.aging = [];
    this.activityFeed = [];
    this.meetingsBoard = null;
    this.actionCenterItems = [];
    this.primaryKpiCards = [];
    this.secondaryKpiCards = [];
    this.kpiCards = [];

    this.loadCounts();
    this.loadScoreboard();
    this.loadCharts();
    this.loadMeetingsBoard();
    this.loadAlertsAndAging();
    this.loadActivityFeed();
    this.lastUpdated = new Date();
  }

  private loadCounts() {
    this.countsLoading = true;
    this.service.getCounts(this.currentFilters).subscribe({
      next: (resp) => {
        this.counts = resp.data;
        this.buildKpiCards();
        this.buildActionCenter();
        this.countsLoading = false;
      },
      error: () => {
        this.countsLoading = false;
      },
    });
  }

  private loadScoreboard() {
    this.scoreboardLoading = true;
    this.service.getScoreboard(this.currentFilters).subscribe({
      next: (resp) => {
        this.scoreboard = resp.data || [];
        this.scoreboardLoading = false;
      },
      error: () => {
        this.scoreboardLoading = false;
      },
    });
  }

  private loadCharts() {
    this.chartsLoading = true;
    forkJoin({
      trend: this.service.getWeeklyTrend(this.currentFilters),
      responseTimes: this.service.getResponseTimes(this.currentFilters),
    }).subscribe({
      next: (results) => {
        this.weeklyTrend = results.trend.data || [];
        this.responseTimes = results.responseTimes.data || [];
        this.chartsLoading = false;
      },
      error: () => {
        this.chartsLoading = false;
      },
    });
  }

  private loadMeetingsBoard() {
    this.meetingsBoardLoading = true;
    this.service.getMeetingsBoard(this.currentFilters).subscribe({
      next: (resp) => {
        this.meetingsBoard = resp.data;
        this.meetingsBoardLoading = false;
      },
      error: () => {
        this.meetingsBoardLoading = false;
      },
    });
  }

  private loadAlertsAndAging() {
    this.alertsLoading = true;
    forkJoin({
      alerts: this.service.getAlerts(this.currentFilters),
      aging: this.service.getAgingAnalysis(this.currentFilters),
    }).subscribe({
      next: (results) => {
        this.alerts = results.alerts.data || [];
        this.aging = results.aging.data || [];
        this.alertsLoading = false;
      },
      error: () => {
        this.alertsLoading = false;
      },
    });
  }

  private loadActivityFeed() {
    this.activityLoading = true;
    this.service.getActivityFeed(this.currentFilters).subscribe({
      next: (resp) => {
        this.activityFeed = resp.data || [];
        this.activityLoading = false;
      },
      error: () => {
        this.activityLoading = false;
      },
    });

    // Auto-refresh every 60s — only start once
    if (!this.activityRefreshStarted) {
      this.activityRefreshStarted = true;
      interval(60000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.service.getActivityFeed(this.currentFilters).subscribe({
            next: (resp) => {
              this.activityFeed = resp.data || [];
            },
          });
        });
    }
  }

  // ─── KPI CARDS ─────────────────────────────────────────────────

  private buildKpiCards() {
    if (!this.counts) return;
    const c = this.counts.counts;
    const k = this.counts.kpi;

    // 5 primary hero KPIs
    this.primaryKpiCards = [
      {
        key: 'totalLeads', label: 'Leads Created', icon: 'fas fa-funnel-dollar',
        colorClass: 'primary', value: k.leadsCreated.current, sectionNumber: 0,
        isPrimary: true, percentChange: k.leadsCreated.percent, changeDirection: k.leadsCreated.direction
      },
      {
        key: 'meetings', label: 'Meeting Scheduled', icon: 'fas fa-calendar-check',
        colorClass: 'primary', value: k.meetingScheduled.current, sectionNumber: 2,
        isPrimary: true, percentChange: k.meetingScheduled.percent , changeDirection: k.meetingScheduled.direction
      },
      {
        key: 'quotes', label: 'Quotes Created', icon: 'fas fa-file-invoice',
        colorClass: 'primary', value: k.quoteCreated.current, sectionNumber: 0,
        isPrimary: true, percentChange: k.quoteCreated.percent , changeDirection: k.quoteCreated.direction 
      },
      {
        key: 'conversions', label: 'Lead to Customer Conversions', icon: 'fas fa-user-check',
        colorClass: 'primary', value: k.leadConvertedToCustomer.current , sectionNumber: 0,
        isPrimary: true, percentChange: k.leadConvertedToCustomer.percent , changeDirection: k.leadConvertedToCustomer.direction 
      },
      {
        key: 'revenue', label: k.profitAtQuote.current === 0 ? 'No Profit / Loss' :(k.profitAtQuote.current > 0 ? 'Profit' : 'Loss'), icon: 'fas fa-dollar-sign',
        colorClass: 'primary', value: toNumber(k.profitAtQuote.current) , sectionNumber: 0,
        isPrimary: true, isCurrency: true, percentChange: k.profitAtQuote.percent, changeDirection: k.profitAtQuote.direction
      },
    ];

    // 8 detailed secondary KPIs (original ones)
    this.secondaryKpiCards = [
      { key: 'leads', label: 'Leads — No Meeting', icon: 'fas fa-user-plus', colorClass: 'leads', value: c.leadsNoMeeting, sectionNumber: 1 },
      { key: 'meetings', label: 'Meetings Scheduled', icon: 'fas fa-calendar-check', colorClass: 'meetings', value: c.meetingsScheduled, sectionNumber: 2 },
      { key: 'followups', label: 'Follow-Ups Pending', icon: 'fas fa-phone', colorClass: 'followups', value: c.followUpsPending, sectionNumber: 3 },
      { key: 'unconverted', label: 'Business Not Converted', icon: 'fas fa-user-times', colorClass: 'unconverted', value: c.meetingsNotConverted, sectionNumber: 4 },
      { key: 'noQuote', label: 'Customer No Quote', icon: 'fas fa-file-alt', colorClass: 'no-quote', value: c.customersNoQuote, sectionNumber: 5 },
      { key: 'enquiry', label: 'Enquiry — No Quotation', icon: 'fas fa-search', colorClass: 'enquiry', value: c.enquiriesNoQuotation, sectionNumber: 6 },
      { key: 'pending', label: 'Quote Pending Approval', icon: 'fas fa-hourglass-half', colorClass: 'pending', value: c.quotesNotApproved, sectionNumber: 7 },
      { key: 'approved', label: 'Approved — No Booking', icon: 'fas fa-check-circle', colorClass: 'approved', value: c.quotesNoBooking, sectionNumber: 8 },
    ];

    // Combined for backward compat
    this.kpiCards = [...this.primaryKpiCards, ...this.secondaryKpiCards];
  }

  // ─── ACTION CENTER ─────────────────────────────────────────────

  private buildActionCenter() {
    if (!this.counts) return;
    const c = this.counts.counts;
    this.actionCenterItems = [
      {
        key: 'noFollowUp', title: 'Leads Without Follow-Up',
        subtitle: 'Needs immediate attention',
        count: c.followUpsPending, icon: 'fas fa-phone-slash', colorClass: 'warning'
      },
      {
        key: 'quotesPending', title: 'Quotes Pending Approval',
        subtitle: 'Awaiting manager review',
        count: c.quotesNotApproved, icon: 'fas fa-hourglass-half', colorClass: 'info'
      },
      {
        key: 'overduesMeetings', title: 'Overdue Meetings',
        subtitle: 'Past scheduled date',
        count: c.meetingsOverdue, icon: 'fas fa-calendar-times', colorClass: 'danger'
      },
    ];
  }

  // ─── KPI CARD CLICK → Drill-Down ──────────────────────────────

  onKpiCardClicked(card: KpiCardConfig) {
    const el = document.getElementById('scoreboard-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  // ─── SCOREBOARD ACTIONS ────────────────────────────────────────

  onScoreboardRowClicked(row: ScoreboardRow) {
    const modalRef = this.modalService.open(SmDrillDownModalComponent, { size: 'xl', centered: true });
    modalRef.componentInstance.salesperson = row;
    modalRef.componentInstance.filters = this.currentFilters;
  }

  onScoreboardRemindClicked(row: ScoreboardRow) {
    const modalRef = this.modalService.open(SmReminderModalComponent, { centered: true });
    modalRef.componentInstance.salesperson = row;
    modalRef.result.then(
      (result) => {
        if (result) {
          const userProfile = this.appSettings.getDecryptedUserProfile();
          this.service
            .sendReminder({
              ...result,
              CompanyMasterSid: this.companyMasterSid,
              BranchMasterSid: this.branchMasterSid,
              senderName: userProfile?.userName || 'Sales Manager',
            })
            .subscribe({
              next: (resp) => {
                if (resp.status) {
                  this.appSettings.showSuccess(resp.message || 'Reminder sent');
                } else {
                  this.appSettings.showError(resp.message || 'Failed to send reminder');
                }
              },
              error: () => this.appSettings.showError('Failed to send reminder'),
            });
        }
      },
      () => {},
    );
  }

  // ─── MEETINGS BOARD ACTIONS ────────────────────────────────────

  onMeetingClicked(meeting: any) {
    this.openReassignModal(meeting);
  }

  // ─── MODAL HELPERS ─────────────────────────────────────────────

  openReassignModal(meeting: any) {
    const modalRef = this.modalService.open(SmReassignModalComponent, { centered: true });
    modalRef.componentInstance.meeting = meeting;
    modalRef.componentInstance.salespersons = this.salespersons;
    modalRef.componentInstance.currentAssignee = meeting.salespersonName || '';
    modalRef.result.then(
      (newSalespersonId) => {
        if (newSalespersonId) {
          const userProfile = this.appSettings.getDecryptedUserProfile();
          this.service
            .reassignLead({
              PreCustomerMeetingSid: meeting.PreCustomerMeetingSid,
              newSalespersonId,
              CompanyMasterSid: this.companyMasterSid,
              BranchMasterSid: this.branchMasterSid,
              updatedBy: userProfile?.userEmail || 'system',
            })
            .subscribe({
              next: (resp) => {
                if (resp.status) {
                  this.appSettings.showSuccess('Lead reassigned successfully');
                  this.loadMeetingsBoard();
                  this.loadScoreboard();
                } else {
                  this.appSettings.showError(resp.message || 'Reassignment failed');
                }
              },
              error: () => this.appSettings.showError('Reassignment failed'),
            });
        }
      },
      () => {},
    );
  }

  openCreateMeetingModal(lead?: any) {
    const modalRef = this.modalService.open(SmCreateMeetingModalComponent, { centered: true , size : 'lg' });
    modalRef.componentInstance.lead = lead;
    modalRef.componentInstance.salespersons = this.salespersons;
    modalRef.result.then(
      (result) => {
        if (result) {
          const userProfile = this.appSettings.getDecryptedUserProfile();
          this.service
            .createMeeting({
              ...result,
              CompanyMasterSid: this.companyMasterSid,
              BranchMasterSid: this.branchMasterSid,
              createdBy: userProfile?.userEmail || 'system',
            })
            .subscribe({
              next: (resp) => {
                if (resp.status) {
                  this.appSettings.showSuccess('Meeting created successfully');
                  this.loadCounts();
                  this.loadMeetingsBoard();
                  this.loadScoreboard();
                } else {
                  this.appSettings.showError(resp.message || 'Failed to create meeting');
                }
              },
              error: () => this.appSettings.showError('Failed to create meeting'),
            });
        }
      },
      () => {},
    );
  }

  // ─── DATE UTILITIES ────────────────────────────────────────────

  private toDateTimeStr(date: Date, boundary: 'start' | 'end'): string {
    const d = new Date(date);
    if (boundary === 'start') {
      d.setHours(0, 0, 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    return d.toISOString();
  }

  private toNaiveDateTimeStr(date: Date, boundary: 'start' | 'end'): string {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    if (boundary === 'start') {
      return new Date(Date.UTC(y, m, d, 0, 0, 0)).toISOString();
    }
    return new Date(Date.UTC(y, m, d, 23, 59, 59)).toISOString();
  }

  private formatDisplayDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}


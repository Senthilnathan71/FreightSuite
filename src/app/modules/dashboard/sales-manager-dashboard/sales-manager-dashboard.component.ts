import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subject, forkJoin, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppSettingsService } from '../../../core/services/app-settings.service';
import { SalesManagerDashboardService } from '../services/sales-manager-dashboard.service';
import {
  SalesManagerFilters,
  SalespersonInfo,
  SalesManagerCounts,
  ScoreboardRow,
  HeatmapSeries,
  WeeklyTrendPoint,
  ResponseTimeMetric,
  ActivityFeedItem,
  AtRiskAlert,
  AgingRow,
  MeetingsBoardData,
  KpiCardConfig,
} from '../interfaces/sales-manager-dashboard.interfaces';

// Sub-components
import { SmFiltersComponent } from './components/sm-filters/sm-filters.component';
import { SmKpiCardsComponent } from './components/sm-kpi-cards/sm-kpi-cards.component';
import { SmMeetingsBoardComponent } from './components/sm-meetings-board/sm-meetings-board.component';
import { SmFunnelChartComponent } from './components/sm-funnel-chart/sm-funnel-chart.component';
import { SmLeadSourceChartComponent } from './components/sm-lead-source-chart/sm-lead-source-chart.component';
import { SmTrendChartComponent } from './components/sm-trend-chart/sm-trend-chart.component';
import { SmHeatmapChartComponent } from './components/sm-heatmap-chart/sm-heatmap-chart.component';
import { SmScoreboardComponent } from './components/sm-scoreboard/sm-scoreboard.component';
import { SmRadarChartComponent } from './components/sm-radar-chart/sm-radar-chart.component';
import { SmResponseTimesComponent } from './components/sm-response-times/sm-response-times.component';
import { SmAgingChartComponent } from './components/sm-aging-chart/sm-aging-chart.component';
import { SmAlertsComponent } from './components/sm-alerts/sm-alerts.component';
import { SmActivityFeedComponent } from './components/sm-activity-feed/sm-activity-feed.component';

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
    SmFiltersComponent,
    SmKpiCardsComponent,
    SmMeetingsBoardComponent,
    SmFunnelChartComponent,
    SmLeadSourceChartComponent,
    SmTrendChartComponent,
    SmHeatmapChartComponent,
    SmScoreboardComponent,
    SmRadarChartComponent,
    SmResponseTimesComponent,
    SmAgingChartComponent,
    SmAlertsComponent,
    SmActivityFeedComponent,
  ],
  templateUrl: './sales-manager-dashboard.component.html',
  styleUrls: ['./sales-manager-dashboard.component.scss'],
})
export class SalesManagerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Context
  companyMasterSid = 0;
  branchMasterSid = 0;
  managerName = '';

  // Filter state
  currentFilters: SalesManagerFilters = {};
  lastUpdated: Date | null = null;

  // Data
  salespersons: SalespersonInfo[] = [];
  counts: SalesManagerCounts | null = null;
  kpiCards: KpiCardConfig[] = [];
  scoreboard: ScoreboardRow[] = [];
  heatmap: HeatmapSeries[] = [];
  weeklyTrend: WeeklyTrendPoint[] = [];
  responseTimes: ResponseTimeMetric[] = [];
  activityFeed: ActivityFeedItem[] = [];
  alerts: AtRiskAlert[] = [];
  aging: AgingRow[] = [];
  meetingsBoard: MeetingsBoardData | null = null;

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
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.initContext();
    this.loadSalespersons();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initContext() {
    try {
      const company = this.appSettings.decrypt(localStorage.getItem('selected-company'));
      const branch = this.appSettings.decrypt(localStorage.getItem('selected-branch'));
      const profile = this.appSettings.getDecryptedUserProfile();
      this.companyMasterSid = company?.CompanyMasterSid || 0;
      this.branchMasterSid = branch?.BranchMasterSid || 0;
      this.managerName = profile?.userName || 'Sales Manager';
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

  // ─── FILTER EVENTS ─────────────────────────────────────────────────

  onFiltersChanged(event: { dateFrom: Date | null; dateTo: Date | null; salespersonId: number | null }) {
    const sp = event.salespersonId
      ? this.salespersons.find((s) => s.UserMasterSid === event.salespersonId)
      : null;

    this.currentFilters = {
      companyMasterSid: this.companyMasterSid,
      branchMasterSid: this.branchMasterSid,
      salespersonId: event.salespersonId || undefined,
      salespersonEmail: sp?.userEmail || undefined,
      dateFrom: event.dateFrom ? this.toDateTimeStr(event.dateFrom, 'start') : undefined,
      dateTo: event.dateTo ? this.toDateTimeStr(event.dateTo, 'end') : undefined,
      naiveDateFrom: event.dateFrom ? this.toNaiveDateTimeStr(event.dateFrom, 'start') : undefined,
      naiveDateTo: event.dateTo ? this.toNaiveDateTimeStr(event.dateTo, 'end') : undefined,
    };

    this.loadAllData();
  }

  onRefresh() {
    this.loadAllData();
  }

  // ─── DATA LOADING ──────────────────────────────────────────────────

  private loadAllData() {
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
      heatmap: this.service.getHeatmap(this.currentFilters),
      trend: this.service.getWeeklyTrend(this.currentFilters),
      responseTimes: this.service.getResponseTimes(this.currentFilters),
    }).subscribe({
      next: (results) => {
        this.heatmap = results.heatmap.data || [];
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

    // Auto-refresh every 60s
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

  // ─── KPI CARDS ─────────────────────────────────────────────────────

  private buildKpiCards() {
    if (!this.counts) return;
    const c = this.counts.counts;
    this.kpiCards = [
      { key: 'leads', label: 'Leads — No Meeting', icon: 'fa-solid fa-user-plus', colorClass: 'leads', value: c.leadsNoMeeting, sectionNumber: 1 },
      { key: 'meetings', label: 'Meetings Scheduled', icon: 'fa-solid fa-calendar-check', colorClass: 'meetings', value: c.meetingsScheduled, sectionNumber: 2 },
      { key: 'followups', label: 'Follow-Ups Pending', icon: 'fa-solid fa-phone-flip', colorClass: 'followups', value: c.followUpsPending, sectionNumber: 3 },
      { key: 'unconverted', label: 'Business Not Converted', icon: 'fa-solid fa-user-xmark', colorClass: 'unconverted', value: c.meetingsNotConverted, sectionNumber: 4 },
      { key: 'noQuote', label: 'Customer No Quote', icon: 'fa-solid fa-file-circle-xmark', colorClass: 'no-quote', value: c.customersNoQuote, sectionNumber: 5 },
      { key: 'enquiry', label: 'Enquiry — No Quotation', icon: 'fa-solid fa-magnifying-glass-chart', colorClass: 'enquiry', value: c.enquiriesNoQuotation, sectionNumber: 6 },
      { key: 'pending', label: 'Quote Pending Approval', icon: 'fa-solid fa-hourglass-half', colorClass: 'pending', value: c.quotesNotApproved, sectionNumber: 7 },
      { key: 'approved', label: 'Approved — No Booking', icon: 'fa-solid fa-circle-check', colorClass: 'approved', value: c.quotesNoBooking, sectionNumber: 8 },
    ];
  }

  // ─── KPI CARD CLICK → Drill-Down ──────────────────────────────────

  onKpiCardClicked(card: KpiCardConfig) {
    // Open drill-down showing team-level section data
    // For now, scroll to scoreboard
    const el = document.getElementById('scoreboard-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  // ─── SCOREBOARD ACTIONS ────────────────────────────────────────────

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
                  this.toastr.success(resp.message || 'Reminder sent');
                } else {
                  this.toastr.error(resp.message || 'Failed to send reminder');
                }
              },
              error: () => this.toastr.error('Failed to send reminder'),
            });
        }
      },
      () => {},
    );
  }

  // ─── MEETINGS BOARD ACTIONS ────────────────────────────────────────

  onMeetingClicked(meeting: any) {
    // Open reassign modal for the meeting
    this.openReassignModal(meeting);
  }

  // ─── MODAL HELPERS ─────────────────────────────────────────────────

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
                  this.toastr.success('Lead reassigned successfully');
                  this.loadMeetingsBoard();
                  this.loadScoreboard();
                } else {
                  this.toastr.error(resp.message || 'Reassignment failed');
                }
              },
              error: () => this.toastr.error('Reassignment failed'),
            });
        }
      },
      () => {},
    );
  }

  openCreateMeetingModal(lead?: any) {
    const modalRef = this.modalService.open(SmCreateMeetingModalComponent, { centered: true });
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
                  this.toastr.success('Meeting created successfully');
                  this.loadCounts();
                  this.loadMeetingsBoard();
                  this.loadScoreboard();
                } else {
                  this.toastr.error(resp.message || 'Failed to create meeting');
                }
              },
              error: () => this.toastr.error('Failed to create meeting'),
            });
        }
      },
      () => {},
    );
  }

  // ─── DATE UTILITIES ────────────────────────────────────────────────

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
}

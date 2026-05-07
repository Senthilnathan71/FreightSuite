import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import {
  AtRiskAlert,
  SalesManagerAlertDrillDownFilters,
  SalesManagerFilters,
} from '../../../interfaces/sales-manager-dashboard.interfaces';
import { SalesManagerDashboardService } from '../../../services/sales-manager-dashboard.service';

@Component({
  selector: 'app-sm-alert-drill-down-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sm-alert-drill-down-modal.component.html',
  styleUrls: ['./sm-alert-drill-down-modal.component.scss'],
})
export class SmAlertDrillDownModalComponent implements OnInit, OnChanges {
  @Input() alert!: AtRiskAlert;
  @Input() filters: SalesManagerFilters = {};

  items: any[] = [];
  loading = false;
  totalCount = 0;
  currentPage = 1;
  readonly pageSize = 10;
  searchTerm = '';

  constructor(
    public activeModal: NgbActiveModal,
    private service: SalesManagerDashboardService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['alert'] && !changes['alert'].firstChange) || (changes['filters'] && !changes['filters'].firstChange)) {
      this.currentPage = 1;
      this.searchTerm = '';
      this.loadData();
    }
  }

  get modalTitle(): string {
    switch (this.alert?.alertType) {
      case 'idle_leads':
        return 'Idle Leads';
      case 'overdue_meetings':
        return 'Overdue Meetings';
      case 'stale_followups':
        return 'Stale Follow-ups';
      case 'unconverted_hightouch':
        return 'Unconverted High-Touch';
      default:
        return 'Alert Details';
    }
  }

  get subtitle(): string {
    if (this.alert?.alertType === 'overdue_meetings') {
      return 'Team-wide overdue meetings';
    }
    return this.alert?.salesperson || '';
  }

  get headerIcon(): string {
    switch (this.alert?.alertType) {
      case 'idle_leads':
        return 'fas fa-user-clock';
      case 'overdue_meetings':
        return 'fas fa-calendar-times';
      case 'stale_followups':
        return 'fas fa-phone-slash';
      case 'unconverted_hightouch':
        return 'fas fa-handshake-slash';
      default:
        return 'fas fa-triangle-exclamation';
    }
  }

  get headerToneClass(): string {
    switch (this.alert?.severity) {
      case 'danger':
        return 'text-danger bg-danger-subtle';
      case 'warning':
        return 'text-warning bg-warning-subtle';
      case 'info':
        return 'text-info bg-info-subtle';
      default:
        return 'text-secondary bg-light';
    }
  }

  get severityBadgeClass(): string {
    switch (this.alert?.severity) {
      case 'danger':
        return 'text-bg-danger';
      case 'warning':
        return 'text-bg-warning';
      case 'info':
        return 'text-bg-info';
      default:
        return 'text-bg-secondary';
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  get pages(): number[] {
    const total = this.totalPages;
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadData();
  }

  onPageChange(page: number): void {
    if (page === this.currentPage || page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.loadData();
  }

  getDisplayName(item: any): string {
    if (item.name) {
      return item.name;
    }
    if (item.LeadOrCustomer === 'C' && item.CustomerName) {
      return item.CustomerName;
    }
    return item.preCustomerName || item.CustomerName || '—';
  }

  getMeetingTypeClass(meetingType: string): string {
    const type = String(meetingType || '').trim().toLowerCase();

    if (type.includes('phone')) {
      return 'type-phone';
    }
    if (type.includes('visit')) {
      return 'type-visit';
    }
    if (type.includes('meeting') || type.includes('online') || type.includes('video')) {
      return 'type-emeeting';
    }

    return 'type-default';
  }

  getFollowUpStatusClass(status: string): string {
    switch (status) {
      case 'Overdue':
        return 'overdue';
      case 'Due Today':
        return 'today';
      default:
        return 'upcoming';
    }
  }

  navigateToLead(sid: number): void {
    this.activeModal.dismiss();
    this.router.navigate(['/crm/lead/entry', sid]);
  }

  navigateToOrganization(sid: number): void {
    this.activeModal.dismiss();
    this.router.navigate(['/master/organization/entry', sid]);
  }

  navigateToLeadOrCustomer(item: any): void {
    if (item.LeadOrCustomer === 'C' && item.CustomerMasterSid) {
      this.navigateToOrganization(item.CustomerMasterSid);
      return;
    }

    if (item.PreCustomerMasterSid) {
      this.navigateToLead(item.PreCustomerMasterSid);
    }
  }

  navigateToMeetingUpdate(sid: number): void {
    this.activeModal.dismiss();
    this.router.navigate(['/crm/meeting-update'], {
      state: { viewMeetingSid: sid },
    });
  }

  private loadData(): void {
    if (!this.alert) {
      return;
    }

    const request: SalesManagerAlertDrillDownFilters = {
      ...this.filters,
      alertType: this.alert.alertType as SalesManagerAlertDrillDownFilters['alertType'],
      salespersonId: this.alert.salespersonId ?? undefined,
      salespersonEmail: this.alert.salespersonEmail ?? undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
    };

    this.loading = true;
    this.service.getAlertDrillDown(request).subscribe({
      next: (resp) => {
        this.items = resp.data?.items || [];
        this.totalCount = resp.data?.totalCount || 0;
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.totalCount = 0;
        this.loading = false;
      },
    });
  }
}





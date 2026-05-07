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
  template: `
    <div class="container-fluid p-0">
      <div class="modal-header border-0 pb-2">
        <div class="d-flex align-items-start gap-3">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               [ngClass]="headerToneClass"
               style="width: 48px; height: 48px;">
            <i [class]="headerIcon"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h4 class="modal-title fw-bold mb-0">{{ modalTitle }}</h4>
              <span class="badge rounded-pill text-uppercase" [ngClass]="severityBadgeClass">
                {{ alert.severity }}
              </span>
            </div>
            <div class="text-muted small">
              {{ subtitle || 'Alert detail view' }}
            </div>
          </div>
        </div>
        <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
      </div>

      <div class="modal-body pt-2">
        <div class="row g-3 mb-3">
          <div class="col-lg-8">
            <div class="input-group shadow-sm">
              <span class="input-group-text bg-white border-end-0">
                <i class="fas fa-magnifying-glass text-muted"></i>
              </span>
              <input
                class="form-control border-start-0"
                type="text"
                [(ngModel)]="searchTerm"
                [placeholder]="'Search ' + modalTitle.toLowerCase() + '...'"
                (keyup.enter)="onSearch()">
              <button class="btn btn-primary px-4" (click)="onSearch()">Search</button>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body py-2 px-3 d-flex align-items-center justify-content-between">
                <div>
                  <div class="text-muted small text-uppercase fw-semibold">Matched Records</div>
                  <div class="fs-4 fw-bold text-dark">{{ totalCount }}</div>
                </div>
                <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                     style="width: 40px; height: 40px;">
                  <i class="fas fa-list-check"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex flex-column align-items-center justify-content-center text-muted py-5" *ngIf="loading">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <div class="fw-semibold">Loading records...</div>
          <div class="small">Fetching exact matches for this alert</div>
        </div>

        <div class="card border-0 shadow-sm overflow-hidden" *ngIf="!loading && items.length > 0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 table-sm" *ngIf="alert.alertType === 'idle_leads'">
              <thead class="table-light">
                <tr>
                  <th class="text-muted text-uppercase small ps-3">#</th>
                  <th class="text-muted text-uppercase small">Lead Name</th>
                  <th class="text-muted text-uppercase small">Contact</th>
                  <th class="text-muted text-uppercase small">Phone</th>
                  <th class="text-muted text-uppercase small">Email</th>
                  <th class="text-muted text-uppercase small">Created</th>
                  <th class="text-muted text-uppercase small pe-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items; let i = index">
                  <td class="ps-3 fw-semibold text-muted">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                  <td><a class="link-primary text-decoration-none fw-semibold" (click)="navigateToLead(item.PreCustomerMasterSid)">{{ item.preCustomerName }}</a></td>
                  <td>{{ item.contactPerson || '—' }}</td>
                  <td>{{ item.phone || '—' }}</td>
                  <td>{{ item.email || '—' }}</td>
                  <td>{{ item.createdOn | date:'dd/MM/yyyy' }}</td>
                  <td class="pe-3"><span class="badge text-bg-light border text-dark">{{ item.leadStatus || '—' }}</span></td>
                </tr>
              </tbody>
            </table>

            <table class="table table-hover align-middle mb-0 table-sm" *ngIf="alert.alertType === 'overdue_meetings'">
              <thead class="table-light">
                <tr>
                  <th class="text-muted text-uppercase small ps-3">#</th>
                  <th class="text-muted text-uppercase small">Name</th>
                  <th class="text-muted text-uppercase small">L / C</th>
                  <th class="text-muted text-uppercase small">Salesperson</th>
                  <th class="text-muted text-uppercase small">Meeting Date</th>
                  <th class="text-muted text-uppercase small pe-3">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items; let i = index" role="button" (click)="navigateToMeetingUpdate(item.PreCustomerMeetingSid)">
                  <td class="ps-3 fw-semibold text-muted">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                  <td><a class="link-primary text-decoration-none fw-semibold">{{ item.name }}</a></td>
                  <td>
                    <span class="badge"
                          [ngClass]="item.LeadOrCustomer === 'L' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'">
                      {{ item.LeadOrCustomer === 'L' ? 'Lead' : 'Customer' }}
                    </span>
                  </td>
                  <td>{{ item.salespersonName || '—' }}</td>
                  <td>{{ item.meetingDate | date:'dd/MM/yyyy, hh:mm a' }}</td>
                  <td class="pe-3"><span class="badge text-bg-light border text-dark">{{ item.meetingType || '—' }}</span></td>
                </tr>
              </tbody>
            </table>

            <table class="table table-hover align-middle mb-0 table-sm" *ngIf="alert.alertType === 'stale_followups'">
              <thead class="table-light">
                <tr>
                  <th class="text-muted text-uppercase small ps-3">#</th>
                  <th class="text-muted text-uppercase small">Lead / Customer</th>
                  <th class="text-muted text-uppercase small">Meeting Date</th>
                  <th class="text-muted text-uppercase small">Follow-Up Date</th>
                  <th class="text-muted text-uppercase small">Type</th>
                  <th class="text-muted text-uppercase small pe-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items; let i = index">
                  <td class="ps-3 fw-semibold text-muted">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                  <td><a class="link-primary text-decoration-none fw-semibold" (click)="navigateToLeadOrCustomer(item)">{{ getDisplayName(item) }}</a></td>
                  <td>{{ item.meetingDate | date:'dd/MM/yyyy, hh:mm a' }}</td>
                  <td>{{ item.followUpDate | date:'dd/MM/yyyy, hh:mm a' }}</td>
                  <td><span class="badge text-bg-light border text-dark">{{ item.meetingType || '—' }}</span></td>
                  <td class="pe-3">
                    <span class="badge"
                          [ngClass]="{
                            'text-bg-danger': getFollowUpStatusClass(item.followUpStatus) === 'overdue',
                            'text-bg-warning': getFollowUpStatusClass(item.followUpStatus) === 'today',
                            'text-bg-success': getFollowUpStatusClass(item.followUpStatus) === 'upcoming'
                          }">
                      {{ item.followUpStatus }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <table class="table table-hover align-middle mb-0 table-sm" *ngIf="alert.alertType === 'unconverted_hightouch'">
              <thead class="table-light">
                <tr>
                  <th class="text-muted text-uppercase small ps-3">#</th>
                  <th class="text-muted text-uppercase small">Lead Name</th>
                  <th class="text-muted text-uppercase small">Contact</th>
                  <th class="text-muted text-uppercase small">Phone</th>
                  <th class="text-muted text-uppercase small">Email</th>
                  <th class="text-muted text-uppercase small">Meetings</th>
                  <th class="text-muted text-uppercase small pe-3">Last Meeting</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of items; let i = index">
                  <td class="ps-3 fw-semibold text-muted">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
                  <td><a class="link-primary text-decoration-none fw-semibold" (click)="navigateToLead(item.PreCustomerMasterSid)">{{ item.preCustomerName }}</a></td>
                  <td>{{ item.contactPerson || '—' }}</td>
                  <td>{{ item.phone || '—' }}</td>
                  <td>{{ item.email || '—' }}</td>
                  <td><span class="badge text-bg-dark">{{ item.meetingCount }}</span></td>
                  <td class="pe-3">{{ item.lastMeetingDate | date:'dd/MM/yyyy, hh:mm a' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card border-0 shadow-sm" *ngIf="!loading && items.length === 0">
          <div class="card-body py-5 d-flex flex-column align-items-center justify-content-center text-center text-muted">
            <div class="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
              <i class="fas fa-inbox fs-4"></i>
            </div>
            <div class="fw-semibold text-dark mb-1">No matching records</div>
            <div class="small">Try a different search term or check whether the alert criteria still match current data.</div>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2" *ngIf="!loading && totalPages > 1">
          <div class="text-muted small">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-primary" [disabled]="currentPage === 1" (click)="onPageChange(currentPage - 1)">
              <i class="fas fa-chevron-left me-1"></i>Prev
            </button>
            <button *ngFor="let p of pages"
                    class="btn"
                    [ngClass]="p === currentPage ? 'btn-dark' : 'btn-outline-primary'"
                    (click)="onPageChange(p)">
              {{ p }}
            </button>
            <button class="btn btn-outline-primary" [disabled]="currentPage === totalPages" (click)="onPageChange(currentPage + 1)">
              Next<i class="fas fa-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
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

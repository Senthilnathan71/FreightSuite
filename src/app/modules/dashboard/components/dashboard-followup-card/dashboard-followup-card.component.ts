import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { SalesDashboardService } from '../../services/sales-dashboard.service';
import { DashboardFollowupItem, PagedResult } from '../../interfaces/sales-dashboard.interfaces';

@Component({
  selector: 'app-dashboard-followup-card',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDatePipe],
  templateUrl: './dashboard-followup-card.component.html',
  styleUrls: ['./dashboard-followup-card.component.scss'],
})
export class DashboardFollowupCardComponent implements OnInit, OnChanges {
  @Input() refreshTrigger = 0;

  private companyMasterSid = 0;
  private branchMasterSid = 0;

  tab: 'our' | 'created' = 'our';
  statusFilter = '';
  items: DashboardFollowupItem[] = [];
  page = 1;
  readonly pageSize = 10;
  totalCount = 0;
  hasMore = false;
  loading = false;
  confirmOpen = false;
  confirmItem: DashboardFollowupItem | null = null;

  constructor(
    private service: SalesDashboardService,
    private appSettings: AppSettingsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const company = this.appSettings.decrypt(localStorage.getItem('selected-company'));
    const branch = this.appSettings.decrypt(localStorage.getItem('selected-branch'));
    this.companyMasterSid = company?.CompanyMasterSid ?? 0;
    this.branchMasterSid = branch?.BranchMasterSid ?? 0;
    this.load(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
      this.load(true);
    }
  }

  load(reset = false): void {
    if (reset) {
      this.page = 1;
      this.items = [];
    }
    if (this.loading) return;
    this.loading = true;
    this.service.getDashboardFollowups({
      companyMasterSid: this.companyMasterSid,
      branchMasterSid: this.branchMasterSid,
      mode: this.tab,
      followUpStatus: this.statusFilter || undefined,
      page: this.page,
      pageSize: this.pageSize,
    }).subscribe((resp) => {
      if (resp.status) {
        const result = resp.data;
        this.items = reset ? result.items : [...this.items, ...result.items];
        this.totalCount = result.totalCount;
        this.hasMore = result.hasMore;
        this.page++;
      }
      this.loading = false;
    });
  }

  switchTab(tab: 'our' | 'created'): void {
    this.tab = tab;
    this.load(true);
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter = status;
    this.load(true);
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!this.hasMore || this.loading) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      this.load();
    }
  }

  openConfirm(item: DashboardFollowupItem): void {
    this.confirmItem = item;
    this.confirmOpen = true;
  }

  confirm(): void {
    const item = this.confirmItem;
    if (!item) return;
    this.confirmOpen = false;
    this.service.completeDashboardFollowup(item.FollowupSid).subscribe((resp) => {
      if (resp.status) {
        this.items = this.items.filter((f) => f.FollowupSid !== item.FollowupSid);
        this.totalCount = Math.max(0, this.totalCount - 1);
        this.appSettings.showSuccess('Followup marked as completed');
      } else {
        this.appSettings.showError('Failed to complete followup');
      }
      this.confirmItem = null;
    });
  }

  navigate(item: DashboardFollowupItem): void {
    if (!item.menuPath || !item.DocumentSid) return;
    const basePath = item.menuPath.replace(/\/(list|entry)$/, '');
    const prefix = basePath.startsWith('/') ? '' : '/';
    this.router.navigate([`${prefix}${basePath}/entry/${item.DocumentSid}`]);
  }
}

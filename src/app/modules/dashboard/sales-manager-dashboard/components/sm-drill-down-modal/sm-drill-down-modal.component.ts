import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ScoreboardRow, SalesManagerFilters } from '../../../interfaces/sales-manager-dashboard.interfaces';
import { SalesManagerDashboardService } from '../../../services/sales-manager-dashboard.service';
import { SalesDashboardService } from '../../../services/sales-dashboard.service';

@Component({
  selector: 'app-sm-drill-down-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbNavModule],
  templateUrl: './sm-drill-down-modal.component.html',
  styleUrls: ['./sm-drill-down-modal.component.scss']
})
export class SmDrillDownModalComponent implements OnInit , OnChanges {
  @Input() salesperson!: ScoreboardRow;
  @Input() filters: SalesManagerFilters = {};

  activeTab = 0;
  tabs = [
    { id: 0, label: 'Overview', icon: 'fas fa-chart-pie' },
    { id: 1, label: 'S1 — Leads', icon: 'fas fa-user-plus' },
    { id: 2, label: 'S2 — Meetings', icon: 'fas fa-calendar-check' },
    { id: 3, label: 'S3 — Follow-ups', icon: 'fas fa-phone-alt' },
    { id: 4, label: 'S4 — Not Converted', icon: 'fas fa-user-times' },
    { id: 5, label: 'S5 — No Quote', icon: 'fas fa-file-alt' },
    { id: 6, label: 'S6 — No Quotation', icon: 'fas fa-search-plus' },
    { id: 7, label: 'S7 — Pending', icon: 'fas fa-hourglass-half' },
    { id: 8, label: 'S8 — No Booking', icon: 'fas fa-check-circle' },
  ];

  sectionData: any[] = [];
  sectionLoading = false;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';

  constructor(
    public activeModal: NgbActiveModal,
    private service: SalesManagerDashboardService,
    private spService : SalesDashboardService
  ) {}

  ngOnInit() {
    // Start on overview
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['salesperson']) {
      const prev = changes['salesperson'].previousValue;
      const curr = changes['salesperson'].currentValue;

      if (curr != null && curr !== prev) {
        this.loadSalespersonData();
      }
    }
    if (changes['filters']) {
      const prev = changes['filters'].previousValue;
      const curr = changes['filters'].currentValue;

      if (curr != null && curr !== prev) {
        this.loadSalespersonData();
      }
    }
  }

  loadSalespersonData() {
    
  }

  onTabChange(tabId: number) {
    this.activeTab = tabId;
    if (tabId > 0) {
      this.currentPage = 1;
      this.searchTerm = '';
      this.loadSectionData(tabId);
    }
  }

  loadSectionData(sectionNumber: number) {
    this.sectionLoading = true;
    this.sectionData = [];
    const drillFilters: SalesManagerFilters = {
      ...this.filters,
      salespersonId: this.salesperson.UserMasterSid,
      salespersonEmail: this.salesperson.userEmail,
      page: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
    };

    this.service.getSectionData(sectionNumber, drillFilters).subscribe({
      next: (resp) => {
        const data = resp.data;
        if (data?.items) {
          this.sectionData = data.items;
          this.totalCount = data.totalCount || 0;
        } else if (Array.isArray(data)) {
          this.sectionData = data;
          this.totalCount = data.length;
        }
        this.sectionLoading = false;
      },
      error: () => {
        this.sectionLoading = false;
      },
    });
  }

  onSearch() {
    this.currentPage = 1;
    if (this.activeTab > 0) {
      this.loadSectionData(this.activeTab);
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    if (this.activeTab > 0) {
      this.loadSectionData(this.activeTab);
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

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '';
  }

  getSectionCount(section: number): number {
    return (this.salesperson as any)[`s${section}`] || 0;
  }

  getOverviewCards(): { label: string; value: number; icon: string; color: string }[] {
    const sp = this.salesperson;
    return [
      { label: 'Leads - No Meeting', value: sp.s1, icon: 'fas fa-user-plus', color: '#3b82f6' },
      { label: 'Meetings Scheduled', value: sp.s2, icon: 'fas fa-calendar-check', color: '#8b5cf6' },
      { label: 'Follow-Ups Pending', value: sp.s3, icon: 'fas fa-phone-alt', color: '#f59e0b' },
      { label: 'Not Converted', value: sp.s4, icon: 'fas fa-user-times', color: '#ef4444' },
      { label: 'Customer No Quote', value: sp.s5, icon: 'fas fa-file-alt', color: '#06b6d4' },
      { label: 'Enquiry No Quotation', value: sp.s6, icon: 'fas fa-search-plus', color: '#10b981' },
      { label: 'Quote Pending', value: sp.s7, icon: 'fas fa-hourglass-half', color: '#f97316' },
      { label: 'Approved No Booking', value: sp.s8, icon: 'fas fa-check-circle', color: '#6366f1' },
    ];
  }
}

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ScoreboardRow, SalesManagerFilters } from '../../../interfaces/sales-manager-dashboard.interfaces';
import { SalesManagerDashboardService } from '../../../services/sales-manager-dashboard.service';
import { SalesDashboardService } from '../../../services/sales-dashboard.service';
import { SalesDashboardFilters } from '../../../interfaces/sales-dashboard.interfaces';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { TimeAgoPipe } from 'src/app/core/pipes/timeAgo.pipe';

@Component({
  selector: 'app-sm-drill-down-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NgbNavModule,
    NgxSpinnerModule,
    TimeAgoPipe
  ],
  templateUrl: './sm-drill-down-modal.component.html',
  styleUrls: ['./sm-drill-down-modal.component.scss']
})
export class SmDrillDownModalComponent implements OnInit , OnChanges {
  @Input() salesperson!: ScoreboardRow;
  @Input() filters: SalesManagerFilters = {};

  activeTab = 0;
  tabs = [
    { id: 0, label: 'Overview', icon: 'fas fa-chart-pie' },
    { id: 1, label: 'Leads with No Meeting', icon: 'fas fa-user-plus' },
    { id: 2, label: 'Meeting Scheduled', icon: 'fas fa-calendar-check' },
    { id: 3, label: 'Follow-up Meetings', icon: 'fas fa-phone-alt' },
    { id: 4, label: 'Business not Converted', icon: 'fas fa-user-times' },
    { id: 5, label: 'Customer created but no Quote created', icon: 'fas fa-search-plus' },
    { id: 6, label: 'Enquiry not converted into Quotation', icon: 'fas fa-file-alt' },
    { id: 7, label: 'Quotation waiting for approval', icon: 'fas fa-hourglass-half' },
    { id: 8, label: 'Quotation approved but no Booking', icon: 'fas fa-check-circle' },
  ];

  sectionData: any[] = [];
  sectionLoading = false;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';

  private companyMasterSid = 0;
  private branchMasterSid = 0;

  constructor(
    public activeModal: NgbActiveModal,
    private salesDashboardService: SalesDashboardService,
    private router: Router,  // ← Add this
    private appSettings: AppSettingsService,  // ← Add this
    private spinner: NgxSpinnerService  // ← Add this
  ) { }

  ngOnInit() {
    this.extractCompanyAndBranch();
  }

  
  private extractCompanyAndBranch(): void {
    this.companyMasterSid = this.filters.companyMasterSid || 0;
    this.branchMasterSid = this.filters.branchMasterSid || 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.extractCompanyAndBranch();
    }
    if (changes['salesperson'] && this.salesperson) {
      this.resetAndReload();
    }
  }

  resetAndReload(): void {
    this.activeTab = 0;
    this.currentPage = 1;
    this.searchTerm = '';
    this.sectionData = [];
    if (this.activeTab > 0) {
      this.loadSectionData(this.activeTab);
    }
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

    const dashboardFilters: SalesDashboardFilters = {
      salespersonId: this.salesperson.UserMasterSid,
      salespersonEmail: this.salesperson.userEmail,
      dateFrom: this.filters.dateFrom || undefined,
      dateTo: this.filters.dateTo || undefined,
      naiveDateFrom: this.filters.naiveDateFrom || undefined,
      naiveDateTo: this.filters.naiveDateTo || undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
    };

    if (sectionNumber === 2) {
      dashboardFilters.bucket = undefined;
    }

    this.salesDashboardService.getSectionDataWithCompany(
      this.companyMasterSid,
      this.branchMasterSid,
      sectionNumber,
      dashboardFilters
    ).subscribe({
      next: (resp : any) => {
        const data = resp.data;
        let extractedItems: any[] = [];
        let extractedTotalCount = 0;

        if (!data) {
          this.sectionData = [];
          this.totalCount = 0;
          this.sectionLoading = false;
          return;
        }

        if (sectionNumber === 2 && data.overdue && data.today && data.future) {
          const allItems = [
            ...(data.overdue.items || []),
            ...(data.today.items || []),
            ...(data.future.items || []),
          ];

          // Sort by meetingDate descending (latest first)
          extractedItems = allItems.sort((a, b) => {
            const dateA = new Date(a.meetingDate).getTime();
            const dateB = new Date(b.meetingDate).getTime();
            return dateB - dateA;
          });

          extractedTotalCount = extractedItems.length;
        }
        // Other sections return PagedResult { items, totalCount, page, pageSize, hasMore }
        else if (data.items !== undefined && Array.isArray(data.items)) {
          extractedItems = data.items;
          extractedTotalCount = data.totalCount || 0;
        }
        // Fallback: if data is an array
        else if (Array.isArray(data)) {
          extractedItems = data;
          extractedTotalCount = data.length;
        }

        this.sectionData = extractedItems;
        this.totalCount = extractedTotalCount;
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

    // ========== HELPER METHODS FOR DISPLAY ==========

  camelToWords(str: string): string {
    return str ? str.replace(/([a-z])([A-Z])/g, '$1 $2') : '';
  }

  formatMeetingDateTime(isoString: string, timeOnly = false): string {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (timeOnly) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getDisplayName(item: any): string {
    if (item.LeadOrCustomer === 'C' && item.CustomerName) {
      return item.CustomerName;
    }
    return item.preCustomerName || item.CustomerName || '—';
  }

  getQuoteCustomerName(item: any): string {
    if (item.LeadOrCustomer === 'C' || !item.LeadOrCustomer) {
      return item.CustomerName || '—';
    }
    return item.preCustomerName || '—';
  }

  // ========== CSS CLASS METHODS ==========

  getLeadStatusClass(status: string): string {
    switch (status) {
      case 'Discovery': return 'discovery';
      case 'Qualify': return 'qualify';
      case 'MeetingScheduled': return 'm-scheduled';
      case 'MeetingCompleted': return 'm-completed';
      default: return 'discovery';
    }
  }

  getIdlePillClass(item: any): string {
    const idleHours = item.idleHours ?? 0;
    if (idleHours >= 24 * 7) return 'danger';
    if (idleHours >= 24 * 3) return 'warning';
    return 'ok';
  }

  getMeetingDateClass(dateString: string): string {
    const meetingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (meetingDate < today) return 'danger';
    if (meetingDate.toDateString() === today.toDateString()) return 'warning';
    return 'ok';
  }

  getMeetingStatusClass(status: string): string {
    switch (status) {
      case 'Scheduled': return 'status-scheduled';
      case 'Completed': return 'status-completed';
      case 'Confirmed': return 'status-confirmed';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getFollowUpDateClass(status: string): string {
    switch (status) {
      case 'Overdue': return 'danger';
      case 'Due Today': return 'warning';
      default: return 'ok';
    }
  }

  getFollowUpStatusClass(status: string): string {
    switch (status) {
      case 'Overdue': return 'overdue';
      case 'Due Today': return 'b-today';
      case 'Upcoming': return 'upcoming';
      default: return '';
    }
  }

  getMatchedViaClass(matchedVia: string): string {
    switch (matchedVia) {
      case 'Created by you': return 'created-by';
      case 'Assigned to you': return 'assigned-to';
      case 'Created & Assigned to you': return 'both-match';
      default: return '';
    }
  }

  getDaysPillClass(days: number, threshold = 7): string {
    if (days > threshold) return 'danger';
    if (days > threshold / 2) return 'warning';
    return 'ok';
  }

  getApprovalStatusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'pending';
      case 'Approved': return 'approved';
      case 'WaitingForFinalApproval':
      case 'WaitingForCustomerApproval': return 'waiting';
      case 'Open': return 'discovery';
      default: return '';
    }
  }

  // ========== NAVIGATION METHODS ==========

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

  navigateToCalendar(lead: any): void {
    this.activeModal.dismiss();
    this.router.navigate(['/crm/calendar'], {
      state: { scheduleLead: lead },
    });
  }

  navigateToQuote(sid: number): void {
    this.activeModal.dismiss();
    this.router.navigate(['/crm/quotation/entry', sid]);
  }

  navigateToEnquiry(sid: number): void {
    this.activeModal.dismiss();
    this.router.navigate(['/crm/enquiry/entry', sid]);
  }

  navigateToCreateQuote(customer: any): void {
    this.activeModal.dismiss();
    const userData = this.appSettings.getDecryptedUserProfile();
    this.router.navigate(['/crm/quotation/entry'], {
      state: {
        dashboardQuoteData: {
          CustomerMasterSid: customer.CustomerMasterSid,
          CustomerName: customer.CustomerName,
          CustomerAddress: customer.CustomerAddress1,
          PreCustomerMasterSid: customer.PreCustomerMasterSid || null,
          ContactPerson: customer.contactPerson,
          ContactNumber: customer.phone,
          Email: customer.email,
          SalesmanSid: userData?.UserMasterSid,
        },
      },
    });
  }

  async convertEnquiryToQuote(sid: number): Promise<void> {
    this.spinner.show();
    try {
      const enquiryFetch = await firstValueFrom(
        this.salesDashboardService.getEnquiryDataForQuotationConversion({
          CompanyMasterSid: this.companyMasterSid,
          BranchMasterSid: this.branchMasterSid,
          EnquiryHeaderSid: sid,
        })
      );
      this.spinner.hide();
      if (!enquiryFetch.status) {
        this.appSettings.showError(enquiryFetch.message);
        return;
      }
      this.activeModal.dismiss();
      this.router.navigate(['crm/quotation/entry'], { state: { enquiryConversionData: enquiryFetch.data } });
    } catch (error) {
      this.spinner.hide();
      this.appSettings.showError('Failed to convert enquiry');
    }
  }

  async convertQuoteToBooking(quote: any): Promise<void> {
    this.spinner.show();
    try {
      const result = await firstValueFrom(
        this.salesDashboardService.getQuoteDataForBookingConversion({
          CompanyMasterSid: this.companyMasterSid,
          BranchMasterSid: this.branchMasterSid,
          QuoteHeaderSid: quote.QuoteHeaderSid,
        })
      );
      this.spinner.hide();
      if (!result.status) {
        this.appSettings.showError(result.message);
        return;
      }
      this.activeModal.dismiss();
      this.router.navigate(['operation/booking/entry'], {
        state: { dataFromQuotation: result.data, isNewBooking: true },
      });
    } catch (error) {
      this.spinner.hide();
      this.appSettings.showError('Failed to convert quote to booking');
    }
  }
}

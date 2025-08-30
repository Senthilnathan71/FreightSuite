import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { LeadService } from '../../Services/lead.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule
  ],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss'
})
export class ViewComponent implements OnInit {
  leads: any[] = [];        
  errorMessage: string = '';  
  searchPerformed: boolean = false;
  
  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  isMobile: boolean = false;
  statusList = ["Active", "Suspended"];

  // Sorting
  sortColumn = "preCustomerName";
  sortDirection = "asc";

  // Company context
  currentCompany: any;
  currentBranch: any;

  constructor(
    private leadService: LeadService, 
    private route: Router, 
    private appService: AppService,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.searchLeads();
    this.isMobile = this.appService.getDevice();
  }

  // Server-side search implementation
  searchLeads(): void {
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    let BranchMasterSid = this.currentBranch?.BranchMasterSid;
    
    const params = {
      search: this.searchText.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId: CompanyMasterSid,
      activeBranchId: BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    }

    this.leadService.searchLead(params).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.leads = resp.data?.items || [];
          this.totalLengthOfCollection = resp.data?.totalCount || 0;
          this.searchPerformed = true;
        } else {
          this.appSettingService.showError(resp.message)
          console.error('Error searching leads', resp.message);
          this.leads = [];
          this.totalLengthOfCollection = 0;
        }
      }, 
      error: (error: any) => {
        console.error(error);
        this.appSettingService.showError('Error searching leads.');
      }
    });
  }

  clearSearchText() {
    this.searchText = "";
    this.page = 1;
    this.searchLeads();
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.searchLeads(); // Re-fetch with new sorting
  }

  updatePaginatedData(): void {
    this.searchLeads();
  }

  createNew() {
    this.route.navigate(['crm/lead'])
  }

  viewLead(id) {
    this.route.navigate(['crm/lead', id])
  }

  createMeeting(PreCustomerMasterSid: number) {
    this.route.navigate([`/crm/lead-schedule-meeting/${PreCustomerMasterSid}`]);
  }

  findStatus(value) {
    switch (value) {
      case 'A':
        return 'Active'
      default:
        return 'Suspended'
    }
  }

  resetFilters(): void {
    this.searchText = '';
    this.sortColumn = "preCustomerName";
    this.sortDirection = "asc";
    this.leads = [];
    this.totalLengthOfCollection = 0;
    this.page = 1;
    this.searchPerformed = false;
    this.searchLeads();
  }
}
// authority-list.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

@Component({
  selector: 'app-authority-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent
  ],
  templateUrl: './authority-list.component.html',
  styleUrl: './authority-list.component.scss'
})
export class AuthorityListComponent {
  searchType = 'status';
  filterValue = '';
  authorityList: any[] = [];
  allAuthorities: any[] = [];
  searchPerformed = false;
  loading: boolean = false;
  departmentOptions: any[] = [];
  userData: any;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() {
    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
      }
    });
    this.loadDepartments();
  }

  loadDepartments() {
    this.loading = true;
    this.masterService.getAllDepartments().subscribe({
      next: (res: any) => {
        this.departmentOptions = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading departments:', err);
        this.loading = false;
      }
    });
  }

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue
      // filterValue: this.searchType === 'status' 
        // ? this.filterValue === 'Active' ? 'A' : 'S'
        // : this.filterValue
        
    };

    this.masterService.searchAuthority(payload).subscribe({
      next: (res: any) => {
        this.allAuthorities = (res.data || res).map(authority => {
          console.log('MenuMaster:', authority.menuMaster);
  const departmentNames = authority.DepartmentMaster?.map(code => {
  const dept = this.departmentOptions.find(d => d.departmentCode === code);
  return dept?.departmentName ?? code;
}) || [];

return {
  ...authority,
  departmentName: departmentNames.join(', '),
  branchName: authority.branchMaster?.branchName || 'N/A',
  MenuName: authority.menuMaster?.screenMenuName || 'N/A',
  statusText: authority.status === 'A' ? 'Active' : 'Suspended'
};
});

        
        this.authorityList = [...this.allAuthorities];
        this.totalLengthOfCollection = this.authorityList.length;
        this.searchPerformed = true;
        this.page = 1;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.authorityList = this.allAuthorities.slice(startIndex, endIndex);
  }

  trackByAuthorityId(index: number, item: any): number {
    return item.AuthorityMasterSid;
  }

  softDelete(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteAuthorityById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Authority deleted successfully!");
            this.search(); // Refresh search results
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateAuthority() {
    this.router.navigate(['master/authority/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.searchType = 'departmentName';
    this.page = 1;
    this.searchPerformed = false;
    this.authorityList = [];
    this.totalLengthOfCollection = 0;
  }

  report(): void {
    const formattedData = this.authorityList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'departmentName', label: 'Department' },
        { key: 'ScreenMenuName', label: 'Screen/Menu Name' },
        { key: 'BranchName', label: 'Branch' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'Authority-Report',
      title: companyName
    });
  }
} 
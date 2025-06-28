import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { forkJoin } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

@Component({
  selector: 'app-container-type-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule,
    ListpageComponent
  ],
  templateUrl: './container-type-list.component.html',
  styleUrl: './container-type-list.component.scss'
})
export class ContainerTypeListComponent {
  searchType = 'ContainerName';
  filterValue = '';
  results: any[] = [];
  containerList: any[] = [];
  searchPerformed = false;
  companyMap: { [id: number]: string} = {};
  userData : any;
  sortColumn: string = 'ContainerName'; 
  sortDirection: string = 'asc';
  

  // Pagination 
  page = 1;
  pageSize = 5;
  totalLengthOfCollection = 0;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() { 
    this.getAllCompanies();
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((companies: any[]) => {
      this.companyMap = {};
      companies.forEach(c => {
        this.companyMap[c.CompanyMasterSid] = c.companyName;
      });
    });
  }

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}
sort(column: string) {
  if (this.sortColumn === column) {
    // Reverse the sort direction if clicking the same column
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort column and default to ascending
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  this.applySorting();
  this.updatePaginatedData();
}

applySorting() {
  this.results.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];
    
    // Handle null/undefined values
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';
    
    // Convert to string for case-insensitive comparison
    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();
  
    if (valueA < valueB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue
    }

    this.masterService.searchContainerType(payload).subscribe((res: any) => {
      this.results = res;
      this.applySorting();
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.containerList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteContainerType(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteContainerTypeById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/container-type/list'])
          this.search();
        });
      }
    });
  }

  navigateToaddNewContainerType() {
    this.router.navigate(['master/container-type/entry']);
  }

  resetPage(): void {
    this.containerList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'ContainerName';
    this.page = 1;
    this.sortColumn = 'ContainerName';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.containerList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'ContainerName', label: 'Container Name' },
                { key: 'ContainerCode', label: 'Container Code' },
                { key: 'ContainerIsoCode', label: 'ISO Code' },
                { key: 'ContainerCategory', label: 'Category' },
                { key: 'NoOfTeu', label: 'No of TEU' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Container-Type-Report', 
            title: companyName
        });
    }
}

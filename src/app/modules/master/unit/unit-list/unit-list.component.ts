import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss'
})
export class UnitListComponent {
  searchType = 'unitName';
  filterValue = '';
  unitList: any[] = [];
  allUnits: any[] = [];
  searchPerformed = false;
  loading: boolean = false;
  userData: any;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

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
  }

  search() {
    this.loading = true;
    
    // If search term is empty, get all units
    if (!this.filterValue.trim()) {
      this.masterService.getAllUnits().subscribe({
        next: (res: any) => {
          this.handleSearchResponse(res);
        },
        error: (err) => {
          this.handleSearchError(err);
        }
      });
    } else {
      // If search term exists, perform filtered search
      const payload = {
        searchType: this.searchType,
        filterValue: this.searchType === 'status' 
          ? this.filterValue === 'Active' ? 'A' : 'S'
          : this.filterValue
      };

      this.masterService.searchUnitList(payload).subscribe({
        next: (res: any) => {
          this.handleSearchResponse(res);
        },
        error: (err) => {
          this.handleSearchError(err);
        }
      });
    }
  }

  private handleSearchResponse(res: any) {
    this.allUnits = res.data || res;
    this.unitList = [...this.allUnits];
    this.totalLengthOfCollection = this.unitList.length;
    this.searchPerformed = true;
    this.page = 1;
    this.updatePaginatedData();
    this.loading = false;
  }

  private handleSearchError(err: any) {
    console.error('Search error:', err);
    this.appSettingService.showError('Failed to load units');
    this.loading = false;
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.unitList = this.allUnits.slice(startIndex, endIndex);
  }

  trackByUnitId(index: number, item: any): number {
    return item.UnitMasterSid;
  }

  deleteUnit(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteUnitById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Unit deleted successfully!");
            this.search(); // Refresh the list
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateUnit() {
    this.router.navigate(['master/unit/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.searchType = 'unitName';
    this.page = 1;
    this.searchPerformed = false;
    this.unitList = [];
    this.allUnits = [];
    this.totalLengthOfCollection = 0;
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }
 report(): void {
 
  const formattedData = this.unitList.map(item => ({
    ...item,
    status: this.getStatusText(item.status) // Convert 'A'/'S' to 'Active'/'Suspended'
  }));

  
  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'unitName', label: 'Unit Name' },
      { key: 'unitCode', label: 'Unit Code' },
      { key: 'jobType', label: 'Job Type' },
      { key: 'containerType', label: 'Container Type' },
      { key: 'measurementType', label: 'Measurement Type' },
      { key: 'Remarks', label: 'Remarks' },
      { key: 'status', label: 'Status' }

    ],
    fileName: 'Unit-Report',
    title: companyName
  });
}

 
}
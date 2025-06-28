import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

@Component({
  selector: 'app-charge-list',
  standalone: true,
  imports: [CommonModule, FeatherModule, FormsModule, NgbPaginationModule, RouterModule, ListpageComponent],
  templateUrl: './charge-list.component.html',
  styleUrls: ['./charge-list.component.scss']
})
export class ChargeListComponent {
  searchType = 'chargeName';
  filterValue = '';
  results: any[] = [];
  chargeList: any[] = [];
  allCharges: any[] = [];
  searchPerformed = false;
  loading: boolean = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;
  userData: any;
  isFavorite: boolean = false;

  // sorting
  sortColumn: string = 'chargeName'; 
  sortDirection: string = 'asc'; 

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  
  constructor(
    private masterService: MasterService,
    private excelReportService: ExcelExportService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
      }
    });
  }

  onSearch(event: { type: string, value: string }) {
    this.searchType = event.type;
    this.filterValue = event.value;
    this.search();
  }

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'Status' 
        ? this.filterValue === 'Active' ? 'A' : 'I'
        : this.filterValue
    };

    this.masterService.searchChargeList(payload).subscribe({
      next: (res: any) => {
        this.allCharges = Array.isArray(res) ? res : res.data || [];
        
        // Apply sorting after loading new data
        this.applySorting();
        
        this.chargeList = [...this.allCharges];
        this.totalLengthOfCollection = this.chargeList.length;
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
    this.allCharges.sort((a, b) => {
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

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.chargeList = this.allCharges.slice(startIndex, endIndex);
  }

  trackByChargeId(index: number, item: any): number {
    return item.ChargeMasterSid;
  }

  deleteCharge(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteChargeById(id).subscribe({
          next: () => {
            this.appSettingService.showSuccess("Deleted!");
            this.search();
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateCharge() {
    this.router.navigate(['master/charge/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.searchType = 'chargeName';
    this.page = 1;
    this.searchPerformed = false;
    this.chargeList = [];
    this.allCharges = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'chargeName';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.chargeList.map(item => ({
      ...item,
      Status: item.Status === 'A' ? 'Active' : 'Inactive'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'chargeCode', label: 'Charge Code' },
        { key: 'chargeName', label: 'Charge Name' },
        { key: 'UOM', label: 'UOM' },
        { key: 'SAC', label: 'HSN/SAC' },
        { key: 'TDSset', label: 'TDS Set' },
        { key: 'Status', label: 'Status' }
      ],
      fileName: 'Charge-Report',
      title: companyName
    });
  }
}
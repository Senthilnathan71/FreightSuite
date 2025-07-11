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
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-uom-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent
  ],
  templateUrl: './uom-list.component.html',
  styleUrl: './uom-list.component.scss'
})
export class UOMListComponent {
  filterValue = '';
  uomList: any[] = [];
  searched = false;
  userData: any;
  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;
  isFavorite: boolean = false;

  sortColumn: string = 'UOMName';
  sortDirection: string = 'asc';

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(
    private masterService: MasterService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() { 
    this.appSettingService.getUser().subscribe(user => {
    if (user) {
      this.userData = user;
    }
  });
  this.loadUoms();
}
loadUoms(): void {
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
  };
  
  this.masterService.searchUomList(params).subscribe({
    next: (response) => {
      if(response.data){
        this.uomList = response.data.items;
        this.totalLengthOfCollection = response.data.totalCount;
        this.applySorting();
        this.searched = true;
      }
    },
    error: (err) => {
      console.error('Error fetching Uoms:', err);
      this.uomList = [];
      this.totalLengthOfCollection = 0;
    },
  });
}

sort(column: string) {
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  this.applySorting();
}

applySorting() {
  if (!Array.isArray(this.uomList)) {
    this.uomList = [];
    return;
  }
  this.uomList.sort((a,b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];

    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';

    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();

    if (valueA < valueB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return this.sortDirection === 'asc' ? 1: -1;
    }
    return 0;
  });
}

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadUoms();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteUom(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteUomById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
        });
      }
    });
  }

  navigateToCreateUom() {
    this.router.navigate(['master/uom-master/view'])
  }

  resetPage() {
    this.uomList = [];
    this.totalLengthOfCollection = 0;
    this.searched = false;
    this.filterValue = '';
    this.page = 1;
    this.sortColumn = 'UOMName';
    this.sortDirection = 'asc';
  }

  report(): void {
 
  const formattedData = this.uomList.map(item => ({
    ...item,
    status: this.getStatusText(item.status) 
  }));

  
  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'UOMName', label: 'UOM Name' },
      { key: 'UOMCode', label: 'UOM Code' },
      { key: 'status', label: 'Status' }
    ],
    fileName: 'UOM-Report', 
    title: companyName
  });
}

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  clearFilterValue() {
    this.filterValue = '';
  }
}
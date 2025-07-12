import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

@Component({
   selector: 'app-doctype-list',
   standalone: true,
   imports: [CommonModule, FeatherModule, FormsModule, NgbPaginationModule, RouterModule, ListpageComponent],
   templateUrl: './doctype-list.component.html',
   styleUrl: './doctype-list.component.scss'
})
export class DoctypeListComponent {
   searchType = 'DocumentTypeName';
   filterValue = '';
   results: any[] = [];
   docTypeList: any[] = []
   searchPerformed = false;
   sortColumn: string = 'DocumentTypeName'; 
   sortDirection: string = 'asc';
   loading = false;

   // pagination
   page = 1;
   pageSize = 10;
   totalLengthOfCollection: number;
   userData: any
   isFavorite: boolean = false;

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
            this.userData = user
         }
      });
      this.loadDocTypes();
   }
   loadDocTypes(): void {
    this.loading = true;
    
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchDocTypes(params).subscribe({
      next: (response:any) => {
        if(response.data){
          this.docTypeList = response.data.items;
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searchPerformed = true;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching document types:', err);
        this.docTypeList = [];
        this.totalLengthOfCollection = 0;
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
   this.loadDocTypes();
  
  this.applySorting();
  this.updatePaginatedData();
}

applySorting() {
  this.docTypeList.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];
    
    // Handle null/undefined values and nested properties
    if (this.sortColumn === 'branch') {
      valueA = a.branchMaster?.branchName || '';
      valueB = b.branchMaster?.branchName || '';
    } else {
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';
    }
    
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
       this.loadDocTypes();
   }
   clearFilterValue() {
    this.filterValue = '';
     this.loadDocTypes();
  }

   trackByIndex(index: number, item: any): number {
      return index;
   }

   deleteDocType(id) {
      const dialogRef = this.dialog.open(DeleteWarningComponent);
      dialogRef.afterClosed().subscribe(result => {
         if (result === true) {
            this.masterService.deleteDocTypeById(id).subscribe((resp: any) => {
               this.appSettingService.showSuccess("Deleted!");
               this.router.navigate(['master/doctype/list'])
              
            });
         }
      });
   }

   navigateToCreateDocType() {
      this.router.navigate(['master/doctype/entry'])
   }

   resetPage() {
      this.searchPerformed = false;
      this.docTypeList = [];
      this.totalLengthOfCollection = 0;
      this.filterValue = '';
      this.searchType = 'DocumentTypeName';
      this.page = 1;
      this.sortColumn = 'DocumentTypeName';
      this.sortDirection = 'asc';
   }

   report(): void {
      const formattedData = this.docTypeList.map(item => ({
         ...item,
         branch : item.branchMaster.branchName,
         Status: item.status === 'A' ? 'Active' : 'Suspended'
      }));

      const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

      this.excelReportService.exportAsExcel({
         data: formattedData,
         headers: [
            { key: 'DocumentTypeName', label: 'Name' },
            { key: 'DocumentType', label: 'Type' },
            { key: 'branch', label: 'Branch' },
            { key: 'Status', label: 'Status' }
         ],
         fileName: 'DocumentType-Report', 
         title: companyName
      });
   }

}

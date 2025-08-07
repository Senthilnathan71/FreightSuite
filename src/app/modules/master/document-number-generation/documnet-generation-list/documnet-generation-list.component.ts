import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
@Component({
  selector: 'app-documnet-generation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
  ],
  templateUrl: './documnet-generation-list.component.html',
  styleUrl: './documnet-generation-list.component.scss',
})
export class DocumnetGenerationListComponent {
  searchType = 'Type';
  filterValue = '';
  documentList: any[] = [];
  searchPerformed = false;
  sortColumn: string = 'Type';
  sortDirection: string = 'asc';
  loading = false;
  userData: any;

  // Pagination
  page = 1;
  pageSize = 15;
  totalLengthOfCollection: number;

  constructor(
    private masterService: MasterService,
    private excelReportService: ExcelExportService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    // this.loadDocuments();
  }

  // loadDocuments(): void {
  //   this.loading = true;

  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection,
  //   };

  //   this.masterService.searchDocumentGeneration(params).subscribe({
  //     next: (response: any) => {
  //       if (response?.data) {
  //         this.documentList = response.data.items;
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       }
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching documents:', err);
  //       this.documentList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.loading = false;
  //     },
  //   });
  // }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // this.loadDocuments();
  }

  applySorting() {
    this.documentList.sort((a, b) => {
      let valueA = a[this.sortColumn] ?? '';
      let valueB = b[this.sortColumn] ?? '';
      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadDocuments();
  }

  clearFilterValue() {
    this.filterValue = '';
    // this.loadDocuments();
  }

  resetPage() {
    this.searchPerformed = false;
    this.documentList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'Type';
    this.page = 1;
    this.sortColumn = 'Type';
    this.sortDirection = 'asc';
  }

  // deleteDocument(id: number) {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result === true) {
  //       this.masterService
  //         .deleteDocumentGenerationById(id)
  //         .subscribe((resp: any) => {
  //           this.appSettingService.showSuccess('Deleted!');
  //           this.loadDocuments();
  //         });
  //     }
  //   });
  // }

  navigateToCreate() {
    this.router.navigate(['master/document-number-generation/entry']);
  }

  exportAsExcel(): void {
    const formatted = this.documentList.map((item) => ({
      Type: item.Type,
      Separator: item.Separator,
      SerialNoLength: item.SerialNoLength,
      StartingNo: item.StartingNo,
      Status: item.Status === 'A' ? 'Active' : 'Blocked',
    }));

    const companyName =
      this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ??
      'Company';

    this.excelReportService.exportAsExcel({
      data: formatted,
      headers: [
        { key: 'Type', label: 'Type' },
        { key: 'Separator', label: 'Separator' },
        { key: 'SerialNoLength', label: 'Serial Length' },
        { key: 'StartingNo', label: 'Start No' },
        { key: 'Status', label: 'Status' },
      ],
      fileName: 'DocumentGeneration-Report',
      title: companyName,
    });
  }
}

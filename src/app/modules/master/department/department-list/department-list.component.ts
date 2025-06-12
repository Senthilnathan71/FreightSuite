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

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, FeatherModule, FormsModule, NgbPaginationModule, RouterModule],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.scss'
})
export class DepartmentListComponent {
  searchType = 'departmentName';
  filterValue = '';
  results: any[] = [];
  departmentList: any[] = []
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;
userData:any
  constructor(private userService: authService,private masterService: MasterService, private excelReportService:ExcelExportService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog
  ) { }
  ngOnInit() {
this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user
        console.log(this.userData,'userData')
      }
    });  
  }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    }
    this.masterService.searchDepartmentList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();  // Update paginated data
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }


  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.departmentList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteDepartment(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteDepartmentById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/department/list'])
          this.search();
        });
      }
    });
  }

  navigateToCreateDepartment() {
    this.router.navigate(['master/department/entry'])
  }

  resetPage() {
    this.searchPerformed = false;
    this.departmentList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'departmantName';
    this.page = 1;
  }

  report(): void {
   const formattedData = this.departmentList.map(item => ({
    ...item,
    Status: item.Status === 'A' ? 'Active' : 'Suspended'
  }));

  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'departmentCode', label: 'Dept Code' },
      { key: 'departmentName', label: 'Dept Name' },
      { key: 'departmentType', label: 'Dept Type' },
      { key: 'ExportImport', label: 'Exp/Imp' },
      { key: 'FCLLCL', label: 'FCL/LCL' },
      { key: 'Division', label: 'Division' },
      { key: 'Status', label: 'Status' }
    ],
  fileName: 'Department-Report', // Will also be used as sheet name: DepartmentReport
    title: companyName
  });
}

}




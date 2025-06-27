import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FeatherModule,
    FormsModule,
    CommonModule,
    RouterModule,
    NgbPaginationModule,
    ListpageComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {

  searchType: string = "userName";
  filterValue: string;
  results: any[];
  userList: any[];
  searchPerformed: boolean;
  userData: any;

  // pagination values
  page = 1;
  pageSize = 10;
  totalNumberOfCollection: number;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 

  constructor(
    private masterServ: MasterService,
    private dialog: MatDialog,
    private appSettingServ: AppSettingsService,
    private router: Router,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() {
    this.appSettingServ.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )
  }

  search(event ?: any) {
    const payload = {
      searchType: event.type,
      filterValue: event.value
    }
    this.masterServ.searchFfUser(payload).subscribe(
      (res) => {
        this.results = res.data;
        this.searchPerformed = true;
        this.updatePaginationData();
        this.totalNumberOfCollection = this.results.length || 0;
      }
    )
  }

  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.userList = this.results.slice(start, end)
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteUser(UserMasterSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.masterServ.deleteFfUserById(UserMasterSid).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingServ.showSuccess("Deleted!");
              this.search(null)
            } else {
              this.appSettingServ.showError('Error Deleting User');
            }
          },
          (error) => {
            console.error('Error Deleting User', error);
          }
        );
      }
    })
  }

  nagivateTocreateUser() {
    this.router.navigate(['master/user/entry']);
  }

  report(): void {
    const formattedData = this.userList.map(item => ({
      ...item,
      salesperson : item.isSalesperson === '1' ? 'Yes' : 'No',
      status : item.status === 'A' ? 'Active' : 'Suspended'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'userName', label: 'User Name' },
        { key: 'userEmail', label: 'Email' },
        { key: 'salesperson', label: 'isSalesman' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'User-Report',
      title: companyName
    });
  }

  reset() {
    this.userList = [];
    this.searchType = 'userName';
    this.filterValue = '';
    this.searchPerformed = false;
    this.totalNumberOfCollection = 0;
  }
}

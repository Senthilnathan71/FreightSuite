import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
    selector: 'app-tds-set-list',
    standalone: true,
    imports: [
        RouterModule,
        CommonModule,
        FeatherModule,
        FormsModule,
        FavoriteStarComponent,
        CustomDatePipe,
        NgbPaginationModule,
        NgxSpinnerModule
    ],
    templateUrl: './tds-set-list.component.html',
    styleUrl: './tds-set-list.component.scss'
})
export class TdsSetListComponent implements OnInit {

    filterValue: string;
    results: any[];
    tdsList: any[];
    userData: any;
    searchPerformed: boolean;

    page = 1;
    pageSize = 15;
    totalLengthOfCollection: number;
    permissions: string[] = [];
    currentMenuPermissions: any = {};

    sortColumn: string = 'TDSSetName';
    sortDirection: string = 'asc';
    // Company
     currentCompany : any;
     currentBranch : any;
    constructor(
        private router: Router,
        private appSettingService: AppSettingsService,
        private masterService: MasterService,
        private dialog: MatDialog,
        private excelReportService: ExcelExportService,
        private settingService: SettingsService,
        private spinner: NgxSpinnerService
    ) { }

    ngOnInit(): void {
        // this.appSettingService.getUser().subscribe(
        //     (res) => {
        //         this.userData = res;
        //         this.checkPermissions();
        //     }
        // )
       this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
        this.loadTds();
    }

    checkPermissions() {
        const currentMenuId = Number(localStorage.getItem('currentMenuId'));
        const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
        console.log(currentMenuId)
        console.log(userRole)
        if (currentMenuId && userRole) {
            this.settingService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
                next: (response) => {
                    this.currentMenuPermissions = response.data.MenuPermissions || {};
                    this.permissions = Object.keys(this.currentMenuPermissions)
                        .filter(key => this.currentMenuPermissions[key] === 'isTrue');
                    console.log(this.permissions)
                }
            });
        }
    }

    loadTds() {
        this.spinner.show();
        let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        const payload = {
            search: this.filterValue,
            page: this.page,
            pageSize: this.pageSize,
            activeCompanyId : CompanyMasterSid
        }
        this.masterService.searchTds(payload).subscribe(
            (resp: any) => {
                if (resp.status) {
                    const response = resp.data.items;
                    this.tdsList = response;
                    this.results = [...this.tdsList];
                    this.totalLengthOfCollection = this.tdsList.length;
                    this.applySorting();
                    this.searchPerformed = true;
                } else {
        this.appSettingService.showError(resp.message);
      }
      this.spinner.hide();
            }
        )
    }

    applySorting() {
        this.results.sort((a, b) => {
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
                return this.sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
        this.tdsList = [...this.results];
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
    }

    deleteTdsSet(TDSSetHeaderSid) {
        const dialogRef = this.dialog.open(DeleteWarningComponent);
        dialogRef.afterClosed().subscribe((res) => {
            if (res) {
                this.masterService.deleteTds(TDSSetHeaderSid).subscribe(
                    (resp: any) => {
                        this.appSettingService.showSuccess("Deleted!");
                        this.loadTds()
                    });
            }
        })
    }

    updatePaginatedData() {
        let start = (this.page - 1) * this.pageSize;
        let end = start + this.pageSize;
        this.loadTds();
    }

    navigateTocreatetdsSet() {
        this.router.navigate(['master/tds-set/entry'])
    }
    clearFilterValue() {
        this.filterValue = '';
    }

    report(): void {
        const formattedData = this.tdsList.map(item => ({
            ...item,
            status: item.status === 'A' ? 'Active' : 'Suspended'
        }));

        // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
        const companyName = this.currentCompany?.companyName ?? 'Company';
        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'TDSSetName', label: 'TDS Name' },
                { key: 'EffectiveFrom', label: 'Effective From' },
                { key: 'TDSsetTransactionLimit', label: 'Transaction Limit' },
                { key: 'TDSSetAnnualLimit', label: 'Annual Limit' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Tds-Set-Report',
            title: companyName
        });
    }

    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission);
    }

    reset() {
        this.tdsList = [];
        this.filterValue = '';
        this.searchPerformed = false;
        this.totalLengthOfCollection = 0;
        this.sortColumn = 'TDSSetName';
        this.sortDirection = 'asc';
    }

}

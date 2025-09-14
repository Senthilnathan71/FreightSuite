import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MasterService } from '../master.service';
import { Router, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
    selector: 'app-document-authorization',
    standalone: true,
    imports: [
        FavoriteStarComponent,
        FeatherModule,
        CommonModule,
        NgbPaginationModule,
        CustomDatePipe,
        FormsModule,
        RouterModule,
        NgxSpinnerModule
    ],
    providers : [CustomDatePipe],
    templateUrl: './document-authorization.component.html',
    styleUrl: './document-authorization.component.scss'
})
export class DocumentAuthorizationComponent {
    // Variable Declaring Section

    filterValue = '';
    allPendingApprovals: any[] = [];
    searchPerformed: boolean;
    userData: any;

    permissions: string[] = [];
    currentMenuPermissions: any = {};

    // Pagination related Declaring
    page = 1;
    pageSize = 15;
    totalLengthOfCollection: number;

    // Sorting related declaration
    sortColumn: string = 'DocumentName';
    sortDirection: string = 'desc';
      // Company
  currentCompany : any;
  currentBranch : any;
    constructor(
        private masterService: MasterService,
        private router: Router,
        private appSettingService: AppSettingsService,
        private excelReportService: ExcelExportService,
        private datePipe : CustomDatePipe,
        private spinner: NgxSpinnerService
    ) { }

    ngOnInit():void {
     this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        const userProfile = this.appSettingService.getDecryptedUserProfile();
        if(userProfile){
            this.userData = userProfile;
        }
        this.searchPendingApprovals();
    }

    searchPendingApprovals() {
        this.spinner.show();
        const params = {
            search: this.filterValue.trim() || '',
            page: this.page,
            pageSize: this.pageSize,
            activeCompanyId : this.currentCompany?.CompanyMasterSid,
            activeBranchId : this.currentBranch?.BranchMasterSid,
        }
        this.masterService.searchPendingApproval(params,this.userData?.UserMasterSid).subscribe({
            next : (resp: any) => {
                if (resp.status) {
                    this.allPendingApprovals = resp.data.items;
                    console.log(this.allPendingApprovals);
                    this.totalLengthOfCollection = resp.data?.totalCount || 0;
                    this.applySorting();
                    this.searchPerformed = true;
                } else {
                    this.appSettingService.showError(resp.message)
                    console.error('Error searching document authorization', resp.message)
                    this.allPendingApprovals = [];
                    this.totalLengthOfCollection = 0;
                }
                this.spinner.hide();
            }, error : (error: any) => {
                console.error(error);
            }
        })
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
        this.allPendingApprovals.sort((a, b) => {
            let valueA = a[this.sortColumn];
            let valueB = b[this.sortColumn];

            if (valueA == null) valueA = '';
            if (valueB == null) valueB = '';

            if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
                valueA = valueA.toString().toLowerCase();
                valueB = valueB.toString().toLowerCase();
            }

            if (valueA < valueB) {
                return this.sortDirection === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return this.sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        })
    }

    goToApprovalLink(MenuMasterSid,link){
        console.log(link);
        localStorage.setItem('currentMenuId',MenuMasterSid);
        this.router.navigate([`${link}`])
    }

    updatePaginationData(): void {
        this.searchPendingApprovals();
    }

    clearFilterValue() {
        this.filterValue = '';
        this.searchPendingApprovals();
    }

    resetPage() {
        this.filterValue = '';
        this.page = 1;
        this.searchPerformed = false;
        this.allPendingApprovals = [];
        this.totalLengthOfCollection = 0;
        this.sortColumn = 'DocumentName';
        this.sortDirection = 'desc';
        this.searchPendingApprovals();
    }

    report():void {
        const formattedData = this.allPendingApprovals.map(data=>({
            ...data,
            CreatedOn : this.datePipe.transform(data.CreatedOn)
        }));
        // const companyName = this.userData?.userCompanyMaster?.[0]?.companyMaster?.companyName ?? 'Company';
        const companyName = this.currentCompany?.companyName ?? 'Company';
        this.excelReportService.exportAsExcel({
            data : formattedData,
            headers : [
                {key : 'DocumentName' , label : 'Document Name'},
                {key : 'DocumentNo' , label : 'Document No.'},
                {key : 'CreatedOn' , label : 'Created On'},
                {key : 'CreatedBy' , label : 'Created By'},
                {key : 'AuthorizeStatus' , label : 'Authorize Status'},
            ],
            fileName : 'Document-Authorization-Report',
            title : companyName
        });
    }

}

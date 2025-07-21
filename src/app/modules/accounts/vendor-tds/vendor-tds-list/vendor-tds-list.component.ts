import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AccountsService } from '../../accounts.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CommonModule } from '@angular/common';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-vendor-tds-list',
    standalone: true,
    imports: [
        FeatherModule,
        FavoriteStarComponent,
        CommonModule,
        FormsModule,
        RouterModule,
        NgbPaginationModule
    ],
    templateUrl: './vendor-tds-list.component.html',
    styleUrl: './vendor-tds-list.component.scss'
})
export class VendorTdsListComponent implements OnInit {

    // Variable Declaring Section

    filterValue = '';
    allSupplierTDS: any[] = [];
    searchPerformed: boolean;
    userData: any;

    // Pagination related Declaring
    page = 1;
    pageSize = 10;
    totalLengthOfCollection: number;

    // Sorting related declaration
    sortColumn: string = 'CustomerName';
    sortDirection: string = 'desc';


    constructor(
        private accountService: AccountsService,
        private router: Router,
        private appSettingService: AppSettingsService,
        private dialog: MatDialog,
        private excelReportService: ExcelExportService
    ) { }

    ngOnInit(): void {
        this.appSettingService.getUser().subscribe(user => {
            if (user) {
                this.userData = user;
            }
        })
        this.searchSupplierTDS();
    }

    // Search
    searchSupplierTDS() {
        const params = {
            search: this.filterValue.trim() || '',
            page: this.page,
            pageSize: this.pageSize,
        }
        this.accountService.searchSupplierTDS(params).subscribe({
            next : (resp: any) => {
                if (resp.status) {
                    this.allSupplierTDS = resp.data?.items.map(data => {
                        return {
                            SupplierTdsMappingSid: data.SupplierTdsMappingSid,
                            SupplierName: data.customerMaster?.CustomerName,
                            PanNo: data.customerMaster?.PanName,
                            CompanyType: data?.CompanyType,
                            CountryName: data.customerMaster?.countryMaster?.countryName,
                            status : data.Status === 'A' ? 'Active' : 'Suspended'
                        }
                    });
                    console.log(this.allSupplierTDS);
                    this.totalLengthOfCollection = resp.data?.totalCount || 0;
                    this.applySorting();
                    this.searchPerformed = true;
                } else {
                    this.appSettingService.showError('Error searching supplier TDS mapping.');
                    console.error('Error searching supplier TDS mapping', resp.message)
                    this.allSupplierTDS = [];
                    this.totalLengthOfCollection = 0;
                }
            }, error : (error: any) => {
                console.error(error);
            }
        })
    }

    //  Deletes an item
    deleteSupplierTDS(SupplierTdsMappingSid: number) {
        const dialogRef = this.dialog.open(DeleteWarningComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.accountService.deleteSupplierTDSById(SupplierTdsMappingSid).subscribe(
                    (resp: any) => {
                        if (resp.status) {
                            this.appSettingService.showSuccess('Supplier TDS deleted successfully.');
                            this.searchSupplierTDS();
                        } else {
                            this.appSettingService.showError('Error deleting supplier TDS.')
                            console.error('Error deleting supplier TDS', resp.message);
                        }
                    },
                    (error:any)=> {
                        this.appSettingService.showError('Error deleting supplier TDS.')
                        console.error("Error deleting supplier TDS.",error)
                    }
                )
            }
        })
    }

    // Sorting related Function
    sort(column: string) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
    }

    applySorting() {
        this.allSupplierTDS.sort((a, b) => {
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

    updatePaginationData(): void {
        this.searchSupplierTDS();
    }

    trackBy(index: number, item: any): number {
        return item.SupplierTdsMappingSid || index;
    }

    clearFilterValue() {
        this.filterValue = '';
        this.searchSupplierTDS();
    }


    navigateToCreateVendorTDS() {
        this.router.navigate(['accounts/supplier-tds/entry'])
    }

    resetPage(){
        this.filterValue = '';
        this.page = 1;
        this.searchPerformed = false;
        this.allSupplierTDS = [];
        this.totalLengthOfCollection = 0;
        this.sortColumn = 'CustomerName';
        this.sortDirection = 'desc';
    }

    report():void {
        const formattedData = this.allSupplierTDS;
        // SupplierName , PanNo,CompanyType , CountryName , status
        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
        this.excelReportService.exportAsExcel({
            data : formattedData,
            headers : [
                {key : 'SupplierName' , label : 'Supplier Name'},
                {key : 'PanNo' , label : 'PAN No'},
                {key : 'CompanyType' , label : 'Company Type'},
                {key : 'CountryName' , label : 'Country'},
                {key : 'status' , label : 'Status'},
            ],
            fileName : 'Supplier-TDS-Report',
            title : companyName
        });
    }

}

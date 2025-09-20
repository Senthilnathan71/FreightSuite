import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { OperationService } from '../../operation.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-booking-list',
    standalone: true,
    imports: [
        FeatherModule,
        CommonModule,
        FormsModule,
        RouterModule,
        FavoriteStarComponent,
        NgxSpinnerModule,
        CommonPaginationComponent
    ],
    templateUrl: './booking-list.component.html',
    styleUrl: './booking-list.component.scss'
})
export class BookingListComponent extends BaseListComponent implements OnInit {
    userData: any;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    currentCompany: any;
    currentBranch: any;

    protected config: ListComponentConfig = {
        storageKey: 'booking-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'BookingNo',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };

    // Alias for compatibility with existing template
    get allBookings() { return this.allItems; }

    constructor(
        private operationService: OperationService,
        private router: Router,
        private appSettingService: AppSettingsService,
        private excelReportService: ExcelExportService,
        private spinner: NgxSpinnerService,
        paginationService: PaginationService
    ) {
        super(paginationService);
    }

    override ngOnInit(): void {
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.appSettingService.getUser().subscribe(user => {
            if (user) {
                this.userData = user;
                this.checkPermissions();
            }
        });

        // Initialize base component
        super.ngOnInit();
    }

    checkPermissions() {
        const currentMenuId = Number(localStorage.getItem('currentMenuId'));
        const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
        if (currentMenuId && userRole) {
            this.operationService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
                next: (response:any) => {
                    this.currentMenuPermissions = response.data.MenuPermissions || {};
                    this.permissions = Object.keys(this.currentMenuPermissions).filter(
                        key => this.currentMenuPermissions[key] === 'isTrue'
                    );
                }
            });
        }
    }

    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission);
    }

    // Implement abstract methods from BaseListComponent
    protected searchItems(): Observable<any> {
        this.spinner.show();
        return this.operationService.searchBooking(this.getSearchParams());
    }

    protected getSearchParams(): SearchParams {
        return {
            search: this.filterValue.trim(),
            page: Number(this.page),
            pageSize: Number(this.pageSize),
            activeCompanyId: this.currentCompany?.CompanyMasterSid,
            activeBranchId: this.currentBranch?.BranchMasterSid,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
        };
    }

    protected processSearchResults(response: any): void {
        this.spinner.hide();
        if (response.status) {
            this.allItems = response.data.items.map(item => ({
                ...item,
                Dept: item.departmentMaster?.departmentName,
                vslvoy: `${item.VesselName} / ${item.VoyageNo}`,
                milestone: item.Milestone?.MilestoneName,
                salesman: item.salesman?.userName,
                status: item.status === 'A' ? 'Active' : 'Suspended'
            }));
            this.totalLengthOfCollection = response.data.totalCount || 0;
            this.applySorting();
        } else {
            this.appSettingService.showError('Error searching bookings.');
            this.allItems = [];
            this.totalLengthOfCollection = 0;
        }
    }

    protected override handleSearchError(error: any): void {
        this.spinner.hide();
        this.appSettingService.showError('Error searching bookings.');
        console.error('Error searching bookings', error);
        super.handleSearchError(error);
    }

    // Legacy method for template compatibility
    searchBookings() {
        this.search();
    }


    // Legacy methods for template compatibility
    clearFilterValue() {
        this.clearFilter();
    }

    updatePaginationData(): void {
        this.search();
    }

    override trackBy(index: number, item: any): number {
        return item.BookingHeaderSid || index;
    }

    navigateToCreate() {
        this.router.navigate(['operation/booking/entry']);
    }

    report(): void {
        const formattedData = this.allBookings;
        const companyName = this.currentCompany?.companyName ?? 'Company';
        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'BookingNo', label: 'Booking No' },
                { key: 'Dept', label: 'Dept' },
                { key: 'POL', label: 'POL' },
                { key: 'POD', label: 'POD' },
                { key: 'FPD', label: 'FDC' },
                { key: 'vslvoy', label: 'Vsl / Voy' },
                { key: 'salesman', label: 'Salesman' },
                { key: 'milestone', label: 'Milestone' },
                { key: 'status', label: 'Status' }
            ],
            fileName: 'Booking-Report',
            title: companyName
        });
    }
}

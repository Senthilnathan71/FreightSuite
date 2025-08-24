import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { OperationService } from '../../operation.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
    selector: 'app-booking-list',
    standalone: true,
    imports: [
        FeatherModule,
        CommonModule,
        FormsModule,
        RouterModule,
        NgbPaginationModule,
        FavoriteStarComponent,
    ],
    templateUrl: './booking-list.component.html',
    styleUrl: './booking-list.component.scss'
})
export class BookingListComponent implements OnInit {
    filterValue = '';
    allBookings: any[] = [];
    searchPerformed: boolean = false;
    userData: any;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    page = 1;
    pageSize = 10;
    totalLengthOfCollection: number = 0;
    sortColumn: string = 'BookingNo';
    sortDirection: string = 'desc';
    currentCompany: any;
    currentBranch: any;

    constructor(
        private operationService: OperationService,
        private router: Router,
        private appSettingService: AppSettingsService,
        private excelReportService: ExcelExportService
    ) {}

    ngOnInit(): void {
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.appSettingService.getUser().subscribe(user => {
            if (user) {
                this.userData = user;
                this.checkPermissions();
            }
        });
        this.searchBookings();
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

    searchBookings() {
        const params = {
            search: this.filterValue.trim(),
            page: this.page,
            pageSize: this.pageSize
        };
        this.operationService.searchBooking(params).subscribe({
            next: (resp: any) => {
                if (resp.status) {
                  this.allBookings = resp.data.items.map(item => {
                    return {
                      ...item,
                      Dept: item.departmentMaster?.departmentName,
                      vslvoy: `${item.VesselName} / ${item.VoyageNo}`,
                      milestone: item.Milestone?.MilestoneName,
                      salesman : item.salesman?.userName,
                      status: item.status === 'A' ? 'Active' : 'Suspended'
                    }
                  });
                    this.totalLengthOfCollection = resp.data.totalCount || 0;
                    this.applySorting();
                    this.searchPerformed = true;
                } else {
                    this.appSettingService.showError('Error searching bookings.');
                    this.allBookings = [];
                    this.totalLengthOfCollection = 0;
                }
            },
            error: (error: any) => {
                this.appSettingService.showError('Error searching bookings.');
                console.error('Error searching bookings', error);
            }
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
        this.allBookings.sort((a, b) => {
            let valueA = a[this.sortColumn] || '';
            let valueB = b[this.sortColumn] || '';
            if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
                valueA = valueA.toString().toLowerCase();
                valueB = valueB.toString().toLowerCase();
            }
            return valueA < valueB
                ? this.sortDirection === 'asc' ? -1 : 1
                : valueA > valueB
                ? this.sortDirection === 'asc' ? 1 : -1
                : 0;
        });
    }

    updatePaginationData(): void {
        this.searchBookings();
    }

    trackBy(index: number, item: any): number {
        return item.BookingHeaderSid || index;
    }

    clearFilterValue() {
        this.filterValue = '';
        this.searchBookings();
    }

    resetPage() {
        this.filterValue = '';
        this.page = 1;
        this.searchPerformed = false;
        this.allBookings = [];
        this.totalLengthOfCollection = 0;
        this.sortColumn = 'BookingNo';
        this.sortDirection = 'desc';
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

import { ReplaySubject, Observable, takeUntil, tap, catchError, of, Subject } from 'rxjs';
import { PaginationConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableSortConfig } from 'src/app/shared/interfaces/table.interface';
import { LeadService } from '../../Services/lead.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { Router } from '@angular/router';

export class EnquiryListManager {
    // State
    public items: any[] = [];
    public totalRecords: number = 0;
    public loading = false;

    // Pagination & Sorting
    public page = 1;
    public pageSize = 10;
    public sortColumn = 'EnquiryDate';
    public sortDirection: 'asc' | 'desc' = 'desc';
    public filterValue = '';

    enquiryPaginationConfig : PaginationConfig;

    private destroy$ = new Subject<void>();

    constructor(
        private leadService: LeadService,
        private appSettings: AppSettingsService,
        private spinner: NgxSpinnerService,
        private datePipe: CustomDatePipe,
        private currentCompany: any,
        private currentBranch: any
    ) {}

    public search() {
        this.spinner.show();
        this.loading = true;
        this.getSearchObservable().pipe(
            takeUntil(this.destroy$),
            tap(response => {
                if (response.status) {
                    this.items = (response.data.items || []).map(item => ({
                        ...item,
                        EnquiryDate: this.datePipe.transform(item.EnquiryDate),
                        CustomerName : item.CustomerName,
                        departmentName : item.department?.departmentName ?? '',
                        POL : item.POL?.PortCode ?? '',
                        POD : item.POD?.PortCode ?? '',
                    }));
                    this.totalRecords = response.data.totalCount || 0;
                    this.updateSearchParams();
                } else {
                    this.appSettings.showError('Error fetching enquiries.');
                    this.items = [];
                    this.totalRecords = 0;
                    this.updateSearchParams();
                }
                this.loading = false;
                this.spinner.hide();
            }),
            catchError(err => {
                this.appSettings.showError('Error fetching enquiries.');
                this.loading = false;
                this.spinner.hide();
                console.error(err);
                return of(null);
            })
        ).subscribe();
    }

    private getSearchObservable(): Observable<any> {
        const params: SearchParams = {
            search: this.filterValue.trim(),
            page: this.page,
            pageSize: this.pageSize,
            companyId: this.currentCompany?.CompanyMasterSid,
            branchId: this.currentBranch?.BranchMasterSid,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection,
        };
        return this.leadService.searchPendingEnquiry(params);
    }

    public updateSearchParams() {
        this.enquiryPaginationConfig = {
            page: this.page,
            pageSize: this.pageSize,
            totalRecords: this.totalRecords,
            pageSizeOptions: [10, 20, 50, 100, 500],
            maxPagesToShow: 3
        };
    }

    public onPageChange(page: number) {
        this.page = page;
        this.search();
    }

    public onPageSizeChange(pageSize: number) {
        this.pageSize = pageSize;
        this.page = 1;
        this.search();
    }

    public onSortChange(sort: TableSortConfig) {
        this.sortColumn = sort.column;
        this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
        this.search();
    }
    
    public clearFilter() {
        this.filterValue = '';
        this.page = 1;
        this.search();
    }

    public destroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

import { ReplaySubject, Observable, takeUntil, tap, catchError, of, Subject } from 'rxjs';
import { PaginationConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableSortConfig } from 'src/app/shared/interfaces/table.interface';
import { LeadService } from '../../Services/lead.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { Router } from '@angular/router';
import { getConcatenatedPorts } from 'src/app/common/helper';
import { AdvancedFilterValues } from 'src/app/shared/interfaces/advanced-filter.interface';

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
    public advancedFilters: AdvancedFilterValues = {};

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
                    const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
                    this.items = rawItems.map(item => this.normalizeRow(item));
                    this.totalRecords = response?.data?.totalCount || rawItems.length || 0;
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
        const params: SearchParams & Record<string, any> = {
            search: this.filterValue.trim(),
            page: this.page,
            pageSize: this.pageSize,
            activeCompanyId: this.currentCompany?.CompanyMasterSid,
            activeBranchId: this.currentBranch?.BranchMasterSid,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection,
        };
        if (this.advancedFilters.dateRange?.fromDate) {
            params['dateFrom'] = this.advancedFilters.dateRange.fromDate;
            params['DateFrom'] = this.advancedFilters.dateRange.fromDate;
        }
        if (this.advancedFilters.dateRange?.toDate) {
            params['dateTo'] = this.advancedFilters.dateRange.toDate;
            params['DateTo'] = this.advancedFilters.dateRange.toDate;
        }
        params['dateField'] = this.advancedFilters.dateType || 'EnquiryDate';
        params['DateField'] = this.advancedFilters.dateType || 'EnquiryDate';
        if (this.advancedFilters.party?.partyId) {
            params['CustomerMasterSid'] = this.advancedFilters.party.partyId;
            params['customerMasterSid'] = this.advancedFilters.party.partyId;
        }
        if (this.advancedFilters.departmentSid) {
            params['DepartmentMasterSid'] = Number(this.advancedFilters.departmentSid);
            params['departmentMasterSid'] = Number(this.advancedFilters.departmentSid);
        }
        if (this.advancedFilters.pol) {
            const polCode = String(this.advancedFilters.pol);
            params['POL'] = polCode;
            params['pol'] = polCode;
        }
        if (this.advancedFilters.pod) {
            const podCode = String(this.advancedFilters.pod);
            params['POD'] = podCode;
            params['pod'] = podCode;
        }
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
        this.advancedFilters = {};
        this.page = 1;
        this.search();
    }

    private normalizeRow(item: any): any {
        return {
            ...item,
            EnquiryDate: this.datePipe.transform(item.EnquiryDate),
            CustomerName: item.CustomerName,
            departmentName: item.department?.departmentName ?? '',
            formattedPOL: item.POL ? getConcatenatedPorts(item.POL?.PortName, item.POL?.PortCode) : '',
            formattedPOD: item.POD ? getConcatenatedPorts(item.POD?.PortName, item.POD?.PortCode) : ''
        };
    }

    public destroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

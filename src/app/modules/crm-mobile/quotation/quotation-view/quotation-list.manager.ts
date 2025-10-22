import { ReplaySubject, Observable, takeUntil, tap, catchError, of, Subject } from 'rxjs';
import { PaginationConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableSortConfig } from 'src/app/shared/interfaces/table.interface';
import { LeadService } from '../../Services/lead.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { Router } from '@angular/router';
import { getConcatenatedPorts } from 'src/app/common/helper';

export class QuotationListManager {
    // State
    public items: any[] = [];
    public totalRecords: number = 0;
    public loading = false;

    // Pagination & Sorting
    public page = 1;
    public pageSize = 10;
    public sortColumn = 'QuoteDate';
    public sortDirection: 'asc' | 'desc' = 'desc';
    public filterValue = '';
    quotationPaginationConfig : PaginationConfig;

    private destroy$ = new Subject<void>();

    constructor(
        private leadService: LeadService,
        private appSettings: AppSettingsService,
        private spinner: NgxSpinnerService,
        private datePipe: CustomDatePipe,
        private currentCompany: any,
        private currentBranch: any
    ) {
        this.updateSearchParams();
    }

    public search() {
        this.spinner.show();
        this.loading = true;
        this.getSearchObservable().pipe(
            takeUntil(this.destroy$),
            tap(response => {
                if (response.status) {
                    this.items = (response.data.items || []).map(item => ({
                        ...item,
                        departmentName: item.quoteRoute?.[0]?.departmentMaster?.departmentName ?? '',
                        formattedPOD: item.quoteRoute?.[0]?.PortPOD ? getConcatenatedPorts(item.quoteRoute?.[0]?.PortPOD?.PortName, item.quoteRoute?.[0]?.PortPOD?.PortCode) : '',
                        formattedPOL: item.quoteRoute?.[0]?.PortPOL ? getConcatenatedPorts(item.quoteRoute?.[0]?.PortPOL?.PortName, item.quoteRoute?.[0]?.PortPOL?.PortCode) : '',
                        QuoteDate: this.datePipe.transform(item?.QuoteDate),
                        bookingNo : item.bookingHeader?.BookingNo || '',
                        status: item.status === 'A' ? 'Active' : 'Suspended',
                    }));
                    this.totalRecords = response.data.totalCount || 0;
                    this.updateSearchParams();
                } else {
                    this.appSettings.showError('Error fetching quotations.');
                    this.items = [];
                    this.totalRecords = 0;
                    this.updateSearchParams();
                }
                this.loading = false;
                this.spinner.hide();
            }),
            catchError(err => {
                this.appSettings.showError('Error fetching quotations.');
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
            activeCompanyId: this.currentCompany?.CompanyMasterSid,
            activeBranchId: this.currentBranch?.BranchMasterSid,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection,
        };
        return this.leadService.searchQuotation(params);
    }

    public updateSearchParams() {
        this.quotationPaginationConfig = {
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

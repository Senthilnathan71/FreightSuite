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
    public advancedFilters: AdvancedFilterValues = {};
    quotationPaginationConfig : PaginationConfig;
    public onResultsChanged?: () => void;

    private destroy$ = new Subject<void>();
    private lastSearchParams: Partial<SearchParams> & Record<string, any> = {};

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
                    const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
                    const totalCount = response?.data?.totalCount || rawItems.length || 0;
                    this.items = rawItems.map(item => this.normalizeRow(item));
                    this.totalRecords = totalCount;
                    this.updateSearchParams();
                    this.onResultsChanged?.();
                } else {
                    this.appSettings.showError('Error fetching quotations.');
                    this.items = [];
                    this.totalRecords = 0;
                    this.updateSearchParams();
                    this.onResultsChanged?.();
                }
                this.loading = false;
                this.spinner.hide();
            }),
            catchError(err => {
                this.appSettings.showError('Error fetching quotations.');
                this.loading = false;
                this.spinner.hide();
                console.error(err);
                this.onResultsChanged?.();
                return of(null);
            })
        ).subscribe();
    }

     private getApprovalStatus(item: any): string {
        const statuses = (item?.quoteRoute || [])
            .flatMap((route: any) => route?.quoteCarrier || [])
            .map((carrier: any) => carrier?.ApprovalStatus || 'Pending')
            .map((status: string) => String(status).trim())
            .filter((status: string) => !!status);

        if (statuses.length === 0) {
            return 'Pending';
        }

        if (statuses.includes('Approved')) {
            return 'Approved';
        }

        const uniqueStatuses: string[] = [...new Set<string>(statuses)];
        return uniqueStatuses.length === 1 ? uniqueStatuses[0] : 'Mixed';
    }

    // Helper method to get formatted approval status label
    private getApprovalStatusLabel(item: any): string {
        const status = this.getApprovalStatus(item);
        const normalizedStatus = String(status || '').replace(/\s+/g, '');

        const statusLabels: Record<string, string> = {
            'Open': 'Open',
            'Pending': 'Pending',
            'Approved': 'Approved',
            'Rejected': 'Rejected',
            'Mixed': 'Mixed',
            'Counter': 'Counter Offer',
            'WaitingForFinalApproval': 'Waiting for Final Approval',
            'WaitingForCustomerApproval': 'Waiting for Customer Approval',
            'FullReview': 'Full Review'
        };

        return statusLabels[status] || statusLabels[normalizedStatus] || status;
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
        if (this.advancedFilters.dateType) {
            params['dateField'] = this.advancedFilters.dateType;
            params['DateField'] = this.advancedFilters.dateType;
            if (params['dateFrom']) {
                params[`${this.advancedFilters.dateType}From`] = params['dateFrom'];
            }
            if (params['dateTo']) {
                params[`${this.advancedFilters.dateType}To`] = params['dateTo'];
            }
        }
        if (this.advancedFilters.party?.partyId) {
            params['CustomerMasterSid'] = this.advancedFilters.party.partyId;
            params['customerMasterSid'] = this.advancedFilters.party.partyId;
            params['customerName'] = this.advancedFilters.party.partyName;
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
        if (this.advancedFilters.extra) {
            params['ApprovalStatus'] = this.advancedFilters.extra;
        }
        this.lastSearchParams = { ...params };
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

    private normalizeRow(item: any): any {
        return {
            ...item,
            departmentName: item.quoteRoute?.[0]?.departmentMaster?.departmentName ?? '',
            formattedPOD: item.quoteRoute?.[0]?.PortPOD ? getConcatenatedPorts(item.quoteRoute?.[0]?.PortPOD?.PortName, item.quoteRoute?.[0]?.PortPOD?.PortCode) : '',
            formattedPOL: item.quoteRoute?.[0]?.PortPOL ? getConcatenatedPorts(item.quoteRoute?.[0]?.PortPOL?.PortName, item.quoteRoute?.[0]?.PortPOL?.PortCode) : '',
            QuoteDate: this.datePipe.transform(item?.QuoteDate),
            bookingNo: item.bookingHeader?.BookingNo || '',
            status: item.status === 'A' ? 'Active' : 'Suspended',
            approvalStatus: this.getApprovalStatusLabel(item),
            approvalStatusValue: this.getApprovalStatus(item)
        };
    }

    public destroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}


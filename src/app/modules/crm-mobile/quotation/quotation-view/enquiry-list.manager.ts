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
                    const filteredItems = this.applyAdvancedFilters(rawItems);
                    this.items = filteredItems.map(item => ({
                        ...item,
                        EnquiryDate: this.datePipe.transform(item.EnquiryDate),
                        CustomerName : item.CustomerName,
                        departmentName : item.department?.departmentName ?? '',
                        formattedPOL : item.POL ? getConcatenatedPorts(item.POL?.PortName, item.POL?.PortCode) : '',
                        formattedPOD : item.POD ? getConcatenatedPorts(item.POD?.PortName, item.POD?.PortCode) : ''
                    }));
                    this.totalRecords = response?.data?.totalCount || filteredItems.length || 0;
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
        params['dateField'] = 'EnquiryDate';
        params['DateField'] = 'EnquiryDate';
        if (this.advancedFilters.party?.partyId) {
            params['CustomerMasterSid'] = this.advancedFilters.party.partyId;
        }
        if (this.advancedFilters.departmentSid) {
            params['DepartmentMasterSid'] = Number(this.advancedFilters.departmentSid);
        }
        if (this.advancedFilters.pol) {
            params['POL'] = this.advancedFilters.pol;
        }
        if (this.advancedFilters.pod) {
            params['POD'] = this.advancedFilters.pod;
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

    private applyAdvancedFilters(items: any[]): any[] {
        const from = this.advancedFilters.dateRange?.fromDate ? new Date(this.advancedFilters.dateRange.fromDate) : null;
        const to = this.advancedFilters.dateRange?.toDate ? new Date(this.advancedFilters.dateRange.toDate) : null;
        const selectedCustomerSid = this.advancedFilters.party?.partyId ? Number(this.advancedFilters.party.partyId) : null;
        const selectedCustomerName = this.advancedFilters.party?.partyName
            ? String(this.advancedFilters.party.partyName).trim().toUpperCase()
            : null;
        const selectedDeptSid = this.advancedFilters.departmentSid ? Number(this.advancedFilters.departmentSid) : null;
        const selectedPol = this.advancedFilters.pol ? String(this.advancedFilters.pol).trim().toUpperCase() : null;
        const selectedPod = this.advancedFilters.pod ? String(this.advancedFilters.pod).trim().toUpperCase() : null;

        if (!from && !to && !selectedCustomerSid && !selectedCustomerName && !selectedDeptSid && !selectedPol && !selectedPod) {
            return items;
        }

        return items.filter((item: any) => {
            if (selectedCustomerSid || selectedCustomerName) {
                const itemSid = Number(item?.CustomerMasterSid ?? item?.customerMaster?.CustomerMasterSid ?? 0);
                const itemName = String(item?.CustomerName ?? '').trim().toUpperCase();
                const sidMatch = selectedCustomerSid ? itemSid === selectedCustomerSid : false;
                const nameMatch = selectedCustomerName ? itemName === selectedCustomerName : false;
                if (!(sidMatch || nameMatch)) {
                    return false;
                }
            }

            if (selectedDeptSid && Number(item?.DepartmentMasterSid) !== selectedDeptSid) {
                return false;
            }

            const itemPol = String(item?.POL?.PortCode ?? '').trim().toUpperCase();
            const itemPod = String(item?.POD?.PortCode ?? '').trim().toUpperCase();
            if (selectedPol && itemPol !== selectedPol) {
                return false;
            }
            if (selectedPod && itemPod !== selectedPod) {
                return false;
            }

            if (from || to) {
                const rawDate = item?.EnquiryDate;
                if (!rawDate) {
                    return false;
                }
                const itemDate = new Date(rawDate);
                if (Number.isNaN(itemDate.getTime())) {
                    return false;
                }
                if (from && itemDate < from) {
                    return false;
                }
                if (to && itemDate > to) {
                    return false;
                }
            }
            return true;
        });
    }

    public destroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

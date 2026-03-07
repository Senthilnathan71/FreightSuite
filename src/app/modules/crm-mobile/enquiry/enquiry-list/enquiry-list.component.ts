
import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { LeadService } from '../../Services/lead.service';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { DateFormatPipe } from 'src/app/core/pipes/date-format.pipe';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VoiceEnquiryComponent } from '../voice-enquiry/voice-enquiry.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { getConcatenatedPorts } from 'src/app/common/helper';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import {
  AdvancedFilterValues,
  DropdownFilterConfig,
  PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
@Component({
  selector: 'app-enquiry-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    DateFormatPipe,
    FavoriteStarComponent,
    CustomDatePipe,
    PreventMultiClickDirective,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  providers: [CustomDatePipe],
  templateUrl: './enquiry-list.component.html',
  styleUrl: './enquiry-list.component.scss'
})
export class EnquiryListComponent extends BaseListComponent implements OnInit {
  @ViewChild('enquiryTable') enquiryTable!: ReusableTableComponent;
  // filterValue = ''
  errorMessage: string = '';
  // searchPerformed : boolean;
  departmentList: any[] = [];
  containerTypeList: any[] = [];

  // sortColumn = "EnquiryNumber"
  // sortDirection = "asc"
  // page = 1;
  // pageSize = 10;
  // totalLengthOfCollection: number;
  enquiryItems: any[] = [];
  isMobile: boolean = false;
  isDataLoaded: boolean = false;
  enquiryData: any
  userData: any;
  loadingEnquiry: boolean
  // Company
  currentCompany: any;
  currentBranch: any;
  // Table configuration
  tableConfig : TableConfig;

  tableLoading = false;
  partyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [{ label: 'Customer', value: 'CustomerMasterSid' }],
    defaultPartyType: 'CustomerMasterSid'
  };
  departmentFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Dept',
    options: [],
    bindLabel: 'departmentName',
    bindValue: 'DepartmentMasterSid'
  };
  polFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POL',
    options: [],
    bindLabel: 'displayName',
    bindValue: 'PortCode'
  };
  podFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POD',
    options: [],
    bindLabel: 'displayName',
    bindValue: 'PortCode'
  };
  private allPorts: any[] = [];
  currentFilters: AdvancedFilterValues = {};
  headerActions: HeaderAction[] = [];
  partySearchFn = (_searchTerm: string, partyType: string): Observable<any[]> => {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid || partyType !== 'CustomerMasterSid') {
      return of([]);
    }

    return this.leadService.getAllCustomersWithBranch(companyMasterSid).pipe(
      map((data: any) => Array.isArray(data) ? data : []),
      catchError(() => of([]))
    );
  };

  protected config: ListComponentConfig = {
    storageKey: 'enquiry-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'EnquiryNumber',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allEnquirys() { return this.allItems; }
  constructor(
    public mps : MenuPermissionService,
    private leadService: LeadService,
    private route: Router,
    private appService: AppService,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private datePipe: CustomDatePipe,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    // this.searchEnquiry();
    this.isMobile = this.appService.getDevice()
    this.appSettingService.userSettingSource.subscribe(
      (res) => {
        this.userData = res;
      }
    )
    // Initialize table configuration
    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.mps.init().subscribe(()=>{
      this.initializeHeaderActions();
      this.initializeTableConfig();
    });
    this.currentFilters = {};
    this.loadHeaderLookups();
    // Initialize base component
    super.ngOnInit();
  }
  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.leadService.searchEnquiry(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const params: any = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    if (this.currentFilters.party) {
      params.CustomerMasterSid = this.currentFilters.party.partyId;
      params.customerMasterSid = this.currentFilters.party.partyId;
      params.customerName = this.currentFilters.party.partyName;
    }
    if (this.currentFilters.departmentSid) {
      params.DepartmentMasterSid = Number(this.currentFilters.departmentSid);
      params.departmentMasterSid = Number(this.currentFilters.departmentSid);
    }
    if (this.currentFilters.pol) {
      const polCode = String(this.currentFilters.pol);
      params.POL = polCode;
      params.pol = polCode;
      const polSid = this.getPortSidByCode(polCode);
      if (polSid) {
        params.POLSid = polSid;
        params.polSid = polSid;
      }
    }
    if (this.currentFilters.pod) {
      const podCode = String(this.currentFilters.pod);
      params.POD = podCode;
      params.pod = podCode;
      const podSid = this.getPortSidByCode(podCode);
      if (podSid) {
        params.PODSid = podSid;
        params.podSid = podSid;
      }
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();

    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      const filteredItems = this.applyAdvancedFilters(rawItems);
      this.allItems = filteredItems.map(item => ({
        ...item,
        quoteNo : item.quoteHeader?.QuoteNumber ?? '',
        QuoteHeaderSid : item.quoteHeader?.QuoteHeaderSid || null,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        ShipmentExpectedDate: this.datePipe.transform(item.ShipmentExpectedDate) ?? '',
        formattedPOL : item.POL ? getConcatenatedPorts(item.POL?.PortName, item.POL?.PortCode) : '',
        formattedPOD : item.POD ? getConcatenatedPorts(item.POD?.PortName, item.POD?.PortCode) : ''
      }));
      this.enquiryItems = this.allItems;
      this.totalLengthOfCollection = response?.data?.totalCount || filteredItems.length || 0;
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching Enquiry.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchEnquirys();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {};
    this.clearFilterValue();
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
        disabled: !this.mps.can('insert')
      },
      {
        label: 'Report',
        icon: 'fas fa-file-alt',
        action: 'report',
        disabled: this.totalLengthOfCollection === 0
      },
      {
        label: 'Reset',
        icon: 'fas fa-sync-alt',
        action: 'reset'
      }
    ];
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
      this.createNew()
        break;
      case 'report':
        this.report();
        break;
      case 'reset':
        this.resetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }


  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching Enquiry.');
    console.error('Error searching Enquiry', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchEnquirys() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.EnquiryHeaderSid || index;
  }


  private initializeTableConfig(): void {
    this.tableConfig  = {
    columns: [
      {
        key: 'EnquiryNumber',
        label: 'Enquiry No',
        sortable: true,
        filterable: true,
        visible: true,

        dataType: 'string'
      },
      {
        key: 'quoteNo',
        label: 'Quotation No',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'link',
        dataType: 'string'
      },
      {
        key: 'ShipmentType',
        label: 'Department',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CustomerName',
        label: 'Customer Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'formattedPOL',
        label: 'POL',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'formattedPOD',
        label: 'POD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        width: '100px',
        dataType: 'string',
        cellClass: 'status-column'
      }
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
        state: !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash', 
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Quotation',
        class:"text-danger",
        state: !this.mps.can('delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'EnquiryHeaderSid',
    emptyMessage: 'No Enquiry found',
    dragAndDrop: true
  };
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void { 
  console.log(event);
  
  if (event.column?.template === "link") {
    // Handle link template click (Quotation No)
    this.route.navigate(['crm/quotation/entry', event.row.QuoteHeaderSid])
  } else if (event.action === 'view') {
    // Handle view action - navigate to enquiry entry page
    this.viewEnquiry(event.row);
  } else if(event.action === 'delete'){
    this.deleteEnquiry(event.row.EnquiryHeaderSid);
  } else if (event.action === 'file') {
    // Handle file action
    this.file(event.row);
  }
}
  deleteEnquiry(EnquiryHeaderSid: number) {
    this.leadService.deleteEnquiryById(EnquiryHeaderSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess("Enquiry Deleted Successfully");
          this.search();
        } else {
          this.appSettingService.showError("Error deleting Enquiry");
        }
      }
    )
  }
  

  viewEnquiry(row: any) {
    this.route.navigate(['crm/enquiry/entry', row.EnquiryHeaderSid])
  }

  onTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  file(row: any) {
    this.goForQuotationCreation(row.EnquiryHeaderSid)
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    // For now, we'll handle this with the existing search functionality
    // In a more advanced implementation, you could apply individual column filters
    console.log('Filters changed:', filters);
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  onDepartmentFilterChanged(departmentSid: number | null): void {
    this.setFilteredPortOptions(departmentSid);
  }

  report(): void {
    const formattedData = this.allEnquirys;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.enquiryTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Enquiry-Report',
      title: companyName
    });
  }
  // Search
  // searchEnquiry() {
  //   this.spinner.show();
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   let BranchMasterSid = this.currentBranch?.BranchMasterSid;
  //   const params = {
  //     search: this.filterValue.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     activeCompanyId: CompanyMasterSid,
  //     activeBranchId: BranchMasterSid,
  //   }
  //   this.leadService.searchEnquiry(params).subscribe({
  //     next: (resp: any) => {
  //       if (resp.status) {
  //         this.enquiryItems = resp.data?.items;
  //         this.totalLengthOfCollection = resp.data?.totalCount || 0;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       } else {
  //         this.appSettingService.showError(resp.message);
  //         console.error('Error searching Enquiry', resp.message)
  //         this.enquiryItems = [];
  //         this.totalLengthOfCollection = 0;
  //       }
  //       this.spinner.hide();
  //     }, error: (error: any) => {
  //       console.error(error);
  //     }
  //   })
  // }

  // clearFilterValue(){
  //   this.filterValue = "";
  //   this.page = 1;
  //   this.searchEnquiry();
  // }

  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.applySorting();
  // }

  // applySorting() {
  //   this.enquiryItems.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

  //     if (this.sortColumn === 'ShipmentExpectedDate') {
  //       valueA = new Date(valueA).getTime();
  //       valueB = new Date(valueB).getTime();
  //     }

  //     if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
  //       valueA = valueA.toString().toLowerCase();
  //       valueB = valueB.toString().toLowerCase();
  //     }

  //     if (valueA < valueB) {
  //       return this.sortDirection === 'asc' ? -1 : 1;
  //     }
  //     if (valueA > valueB) {
  //       return this.sortDirection === 'asc' ? 1 : -1;
  //     }
  //     return 0;
  //   });
  // }


  updatePaginatedData(): void {
    // this.searchEnquiry()
  }

  //   report(): void {
  //   const formattedData = this.enquiryItems.map(item => ({
  //     ...item,
  //     QuotationNO: item.quoteNo ? item.quoteNo : 'N/A',
  //     ShipmentExpectedDate : this.datePipe.transform(item.ShipmentExpectedDate),
  //     status: item.status === 'A' ? 'Active' : 'Inactive'
  //   }));


  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'EnquiryNumber', label: 'Enquiry Number' },
  //       { key: 'QuotationNO', label: 'Quotation No' },
  //       { key: 'CustomerName', label: 'Customer Name' },
  //       { key: 'ShipmentType', label: 'Department' },
  //       { key: 'ShipmentExpectedDate', label: 'Expected Shipment Date' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'Enquiry-Report',
  //     title: companyName
  //   });
  // }



  createNew() {
    this.route.navigate(['crm/enquiry/entry'])
  }

  editEnquiry(id) {
    this.route.navigate(['crm/enquiry/entry', id])
  }

  goForQuotationCreation(EnquiryHeaderSid) {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.loadingEnquiry = true;
    forkJoin({

      containerTypes: this.leadService.getAllContainerTypes(),
      departments: this.leadService.getAllDepartments(CompanyMasterSid)
    }).subscribe(({ containerTypes, departments }) => {
      this.containerTypeList = containerTypes;
      this.departmentList = departments;

      this.leadService.getEnquiryById(EnquiryHeaderSid).subscribe(
        (resp: any) => {
          if (resp) {
            const enquiryData = resp.data;
            this.navigateQuotation(enquiryData);
            this.loadingEnquiry = false;
          }
        }
      )
    })
  }


  navigateQuotation(response: any) {
    const polList = response.enquiryRoute.map(route => route.POLSid);
    const podList = response.enquiryRoute.map(route => route.PODSid);

    let cargoTypeList: string[] = [];

    if (Array.isArray(response.enquiryCargo)) {
      cargoTypeList.push(...response.enquiryCargo.map(cargo => cargo.CargoType));
    }

    response.enquiryRoute.forEach(route => {
      if (Array.isArray(route.enquiryCargo)) {
        cargoTypeList.push(...route.enquiryCargo.map(cargo => cargo.CargoType));
      }
    });
    console.log(response);
    const dept = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    let selectedFCLLCL;
    if (dept?.departmentType === "Sea") {
      selectedFCLLCL = dept?.FCLLCL;
    } else {
      selectedFCLLCL = dept?.departmentType?.toUpperCase();
    }

    let routeDetails = response.enquiryRoute.flatMap(route => {
      return route.enquiryCargo.map(cargo => {
        const containerTypeCode = this.containerTypeList.find(
          con => con.ContainerName === cargo.ContainerType
        )?.ContainerCode || null;
        return {
          PORSid: route.PORSid,
          POLSid: route.POLSid,
          PODSid: route.PODSid,
          FPODSid: route.FDPSid,
          CargoType: cargo.CargoType,
          GrossWeight: cargo.GrossWeight,
          NetWeight: cargo.NetWeight,
          Volume: cargo.Volume,
          ContainerType: containerTypeCode,
          ChargeableWeight: cargo.ChargeableWeight,
          Qty: cargo.Qty,
          ServiceLevel: response.IncoTerms
        };
      });
    });

    const enqData = {
      // EnquirySid: response?.EnquiryHeaderSid,
      // EnquiryNumber: response?.EnquiryNumber,
      // CustomerMasterSid: response?.CustomerMasterSid,
      // CustomerName: response?.CustomerName,
      // CustomerAddress: response?.CustomerAddress,
      // Email: response?.Email,
      // DepartmentMasterSid: response.DepartmentMasterSid,
      // segment: selectedFCLLCL,
      // rateRequest: true,
      // enqRoutes: routeDetails

      EnquirySid: response?.EnquiryHeaderSid,
      EnquiryNumber: response.EnquiryNumber,
      CustomerAddress: response.CustomerAddress,
      CustomerName: response.CustomerName,
      Email: response.Email,
      CustomerMasterSid: response.CustomerMasterSid,
      DepartmentMasterSid: response.DepartmentMasterSid,
      polList: polList,  // Sending as an array
      podList: podList,  // Sending as an array
      status: response.status,
      cargoTypeList: cargoTypeList,  // Merging from both possible sources
      ShipmentType: selectedFCLLCL,
      FreightPPCC: response.FreightPPCC,
      rateRequest: true,
      quoteRoutes: routeDetails,
    };
    this.leadService.clearQuotationData();
    this.leadService.setQuotationData(enqData);
    this.route.navigate(['crm/quotation/entry']);
  }

  resetFilters(): void {
    this.filterValue = '';
    this.currentFilters = {};
    this.sortColumn = "EnquiryNumber"
    this.sortDirection = "asc"
    this.enquiryItems = [];
    this.totalLengthOfCollection = this.enquiryItems.length;
    this.page = 1;
    this.searchPerformed = false;
    // this.searchEnquiry();
  }

  private loadHeaderLookups(): void {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid) {
      return;
    }

    forkJoin({
      departments: this.leadService.getAllDepartments(companyMasterSid).pipe(catchError(() => of([]))),
      ports: this.leadService.getAllPorts().pipe(catchError(() => of([])))
    }).subscribe(({ departments, ports }: any) => {
      this.departmentFilterConfig = {
        ...this.departmentFilterConfig,
        options: Array.isArray(departments) ? departments : []
      };

      const allPorts = Array.isArray(ports) ? ports : [];
      this.allPorts = allPorts.map((port: any) => ({
        ...port,
        displayName: `${port.PortName} (${port.PortCode})`
      }));

      this.setFilteredPortOptions(null);
    });
  }

  private setFilteredPortOptions(departmentSid: number | null): void {
    const normalizedDepartmentSid = departmentSid !== null ? Number(departmentSid) : null;
    const selectedDepartment = this.departmentFilterConfig.options.find(
      (dept: any) => Number(dept?.DepartmentMasterSid) === normalizedDepartmentSid
    );

    const departmentType = (selectedDepartment?.departmentType || '').toUpperCase();
    const filteredPorts = !departmentType
      ? [...this.allPorts]
      : this.allPorts.filter((port: any) => {
          const portType = (port?.PortType || '').toUpperCase();
          return departmentType === 'AIR' ? portType === 'AIR' : portType === 'SEA';
      });

    this.polFilterConfig = { ...this.polFilterConfig, options: filteredPorts };
    this.podFilterConfig = { ...this.podFilterConfig, options: filteredPorts };
  }

  private getPortSidByCode(portCode: string | null | undefined): number | null {
    if (!portCode) {
      return null;
    }

    const port = this.allPorts.find((p: any) => String(p?.PortCode) === String(portCode));
    return port?.PortMasterSid ? Number(port.PortMasterSid) : null;
  }

  private getPortCode(value: any): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value?.PortCode || value?.portCode || '').trim();
  }

  private hasAdvancedFilterValues(): boolean {
    return !!(
      this.currentFilters.party?.partyId ||
      this.currentFilters.departmentSid ||
      this.currentFilters.pol ||
      this.currentFilters.pod
    );
  }

  private applyAdvancedFilters(items: any[]): any[] {
    if (!this.hasAdvancedFilterValues()) {
      return items;
    }

    const selectedPol = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : null;
    const selectedPod = this.currentFilters.pod ? String(this.currentFilters.pod).trim().toUpperCase() : null;
    const selectedDeptSid = this.currentFilters.departmentSid ? Number(this.currentFilters.departmentSid) : null;
    const selectedCustomerSid = this.currentFilters.party?.partyId ? Number(this.currentFilters.party.partyId) : null;
    const selectedCustomerName = this.currentFilters.party?.partyName
      ? String(this.currentFilters.party.partyName).trim().toUpperCase()
      : null;

    return items.filter((item: any) => {
      if (selectedCustomerSid || selectedCustomerName) {
        const itemCustomerSid = Number(
          item?.CustomerMasterSid ??
          item?.customerMaster?.CustomerMasterSid ??
          item?.customer?.CustomerMasterSid ??
          0
        );
        const itemCustomerName = String(
          item?.CustomerName ??
          item?.customerMaster?.CustomerName ??
          item?.customer?.CustomerName ??
          ''
        ).trim().toUpperCase();

        const sidMatches = selectedCustomerSid ? itemCustomerSid === selectedCustomerSid : false;
        const nameMatches = selectedCustomerName ? itemCustomerName === selectedCustomerName : false;
        if (!(sidMatches || nameMatches)) {
          return false;
        }
      }

      if (selectedDeptSid) {
        const departmentSid = Number(
          item?.DepartmentMasterSid ??
          item?.departmentMaster?.DepartmentMasterSid ??
          item?.department?.DepartmentMasterSid ??
          0
        );
        if (departmentSid !== selectedDeptSid) {
          return false;
        }
      }

      const itemPol = this.getPortCode(item?.POL).toUpperCase();
      const itemPod = this.getPortCode(item?.POD).toUpperCase();

      if (selectedPol && itemPol !== selectedPol) {
        return false;
      }

      if (selectedPod && itemPod !== selectedPod) {
        return false;
      }

      return true;
    });
  }

  openVoiceEnquiry(): void {
    // Check browser support for speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.appSettingService.showError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const modalRef = this.modalService.open(VoiceEnquiryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.enquiryCreated.subscribe((enquiryData: any) => {
      this.handleVoiceEnquiryCreated(enquiryData);
    });

    modalRef.componentInstance.modalClosed.subscribe(() => {
      modalRef.close();
    });
  }

  private handleVoiceEnquiryCreated(enquiryData: any): void {
    // Navigate to enquiry entry page with pre-filled data
    this.leadService.setVoiceEnquiryData(enquiryData);
    this.route.navigate(['crm/enquiry/entry'], {
      queryParams: { voice: 'true' }
    });
  }
}

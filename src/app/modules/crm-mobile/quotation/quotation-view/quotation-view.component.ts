import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/service/app.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { LeadService } from '../../Services/lead.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { TableConfig, TableEventData, TableFilter, TableSortConfig } from 'src/app/shared/interfaces/table.interface';
import { EnquiryListManager } from './enquiry-list.manager';
import { QuotationListManager } from './quotation-list.manager';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { FormsModule } from '@angular/forms';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { PaginationConfig } from 'src/app/shared/interfaces/pagination.interface';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig,
  PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

@Component({
  selector: 'app-quotation-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    NgbNavModule,
    CustomDatePipe,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ElementStateGuardDirective
  ],
  templateUrl: './quotation-view.component.html',
  styleUrl: './quotation-view.component.scss',
  providers: [CustomDatePipe]
})
export class QuotationViewComponent implements OnInit, OnDestroy {
  @ViewChild('quotationTable') quotationTable!: ReusableTableComponent;
  @ViewChild('enquiryTable') enquiryTable!: ReusableTableComponent;
  @ViewChild('reportModel') content: TemplateRef<any>;
  @ViewChild('enquiryHeader') enquiryHeader!: PageHeaderComponent;
  @ViewChild('quotationHeader') quotationHeader!: PageHeaderComponent;

  filterQuotationValue : string= "";
  departments : any[] = [];
  containerTypes : any[] = [];
  allPorts: any[] = [];


  // List Managers
  enquiryManager: EnquiryListManager;
  quotationManager: QuotationListManager;

  // Component State
  selectedTab = 'Quotation';
  tabs = [
    { name: 'Pending Enquiry', icon: 'fas fa-file-signature' },
    { name: 'Quotation', icon: 'fas fa-layer-group' }
  ];
  isMobile: boolean = false;
  currentCompany: any;
  currentBranch: any;
  userData: any;
  // Table Configurations
  enquiryTableConfig: TableConfig;
  quotationTableConfig: TableConfig;

  enquiryPaginationConfig: PaginationConfig;
  quotationPaginationConfig: PaginationConfig;

  quotationHeaderActions : any[] = [];
  enquiryDateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  enquiryDateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Enquiry Date', value: 'EnquiryDate' }],
    defaultValue: 'EnquiryDate'
  };
  enquiryPartyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [{ label: 'Customer', value: 'CustomerMasterSid' }],
    defaultPartyType: 'CustomerMasterSid'
  };
  enquiryDepartmentFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Dept',
    options: [],
    bindLabel: 'departmentName',
    bindValue: 'DepartmentMasterSid'
  };
  enquiryPolFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POL',
    options: [],
    bindLabel: 'PortName',
    bindValue: 'PortCode'
  };
  enquiryPodFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POD',
    options: [],
    bindLabel: 'PortName',
    bindValue: 'PortCode'
  };

  quotationDateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  quotationDateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Quote Date', value: 'QuoteDate' }],
    defaultValue: 'QuoteDate'
  };
  quotationPartyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [{ label: 'Customer', value: 'CustomerMasterSid' }],
    defaultPartyType: 'CustomerMasterSid'
  };
  quotationDepartmentFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Dept',
    options: [],
    bindLabel: 'departmentName',
    bindValue: 'DepartmentMasterSid'
  };
  quotationPolFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POL',
    options: [],
    bindLabel: 'PortName',
    bindValue: 'PortCode'
  };
  quotationPodFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POD',
    options: [],
    bindLabel: 'PortName',
    bindValue: 'PortCode'
  };
  quotationApprovalStatusFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'ApprovalStatus',
    options: [
      { label: 'Open', value: 'Open' },
      { label: 'Pending', value: 'Pending' },
      { label: 'Approved', value: 'Approved' },
      { label: 'Rejected', value: 'Rejected' },
      { label: 'Counter Offer', value: 'Counter' },
      { label: 'Waiting for Final Approval', value: 'WaitingForFinalApproval' },
      { label: 'Waiting for Customer Approval', value: 'WaitingForCustomerApproval' },
      { label: 'Full Review', value: 'FullReview' }
    ],
    bindLabel: 'label',
    bindValue: 'value'
  };

  initializeQuotationHeaderActions() {
    this.quotationHeaderActions = [
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
        disabled: this.quotationManager.totalRecords === 0
      },
      { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' }
    ]
  }

  constructor(
    public mps : MenuPermissionService,
    private leadService: LeadService,
    private appSettings: AppSettingsService,
    private spinner: NgxSpinnerService,
    private datePipe: CustomDatePipe,
    private route: Router,
    private appService: AppService,
    private modalService: NgbModal,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettings.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettings.decrypt(storedBranch) : null;
    // Initialize Managers
    this.enquiryManager = new EnquiryListManager(this.leadService, this.appSettings, this.spinner, this.datePipe, this.currentCompany, this.currentBranch);
    this.quotationManager = new QuotationListManager(this.leadService, this.appSettings, this.spinner, this.datePipe, this.currentCompany, this.currentBranch);
    this.quotationManager.onResultsChanged = () => this.initializeQuotationHeaderActions();
    this.initializeQuotationHeaderActions();
    
    this.isMobile = this.appService.getDevice();
    this.userData = this.appSettings.getDecryptedUserProfile();
    this.initializeTableConfigs();
    this.mps.init().subscribe(()=>{
      this.initializeTableConfigs();
      this.initializeQuotationHeaderActions();
    });


    this.loadAllFields();
    this.initializeDefaultFilters();

    // Initial load
    this.selectTab(this.selectedTab);

  }


  loadAllFields(){
    forkJoin([
      this.leadService.getAllDepartments(this.currentCompany.CompanyMasterSid),
      this.leadService.getAllContainerTypes(),
      this.leadService.getAllPorts()])
      .subscribe(([
        departments,
        containerTypes,
        ports
      ]) => {
      this.departments = departments;
      this.containerTypes = containerTypes;
      this.allPorts = (ports || []).map((port: any) => ({
        ...port,
        displayName: `${port.PortName} (${port.PortCode})`
      }));
      this.quotationDepartmentFilterConfig = { ...this.quotationDepartmentFilterConfig, options: this.departments };
      this.enquiryDepartmentFilterConfig = { ...this.enquiryDepartmentFilterConfig, options: this.departments };
      this.quotationPolFilterConfig = { ...this.quotationPolFilterConfig, options: [...this.allPorts] };
      this.quotationPodFilterConfig = { ...this.quotationPodFilterConfig, options: [...this.allPorts] };
      this.enquiryPolFilterConfig = { ...this.enquiryPolFilterConfig, options: [...this.allPorts] };
      this.enquiryPodFilterConfig = { ...this.enquiryPodFilterConfig, options: [...this.allPorts] };
    })
  }

  ngOnDestroy(): void {
    this.mps.clear();
    this.enquiryManager.destroy();
    this.quotationManager.destroy();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    if (tab === 'Pending Enquiry') {
      this.enquiryManager.search();
    } else {
      this.quotationManager.search();
    }
  }

  private initializeTableConfigs() {
    this.enquiryTableConfig = {
      columns: [
        { key: 'EnquiryNumber', label: 'Enquiry No', sortable: true, visible: true },
        { key: 'EnquiryDate', label: 'Enquiry Date', sortable: true, visible: true },
        { key: 'CustomerName', label: 'Customer', sortable: true, visible: true },
        { key: 'departmentName', label: 'Department', sortable: true, visible: true },
        { key: 'formattedPOL', label: 'POL', sortable: true, visible: true },
        { key: 'formattedPOD', label: 'POD', sortable: true, visible: true },
      ],
      actions: [{ 
        icon: 'fas fa-file', 
        label: 'File', 
        action: 'navigate', 
        tooltip: 'Create Quotation',
        state: !this.mps.can('insert')
      }],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'EnquiryHeaderSid',
      emptyMessage: 'No enquiries found',
      dragAndDrop: true
    };

    this.quotationTableConfig = {
      columns: [
        {
          key: 'QuoteNumber',
          label: 'Quote No',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'QuoteDate',
          label: 'Quote Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: "115px"
        },
        {
          key: 'enquiryNo',
          label: 'Enquiry No',
          sortable: true,
          filterable: true,
          visible: true,
          template: 'link',
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
          key: 'departmentName',
          label: 'Dept',
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
          dataType: 'string',
          cellClass: 'vessel-column'
        },
        {
          key: 'bookingNo',
          label: 'Booking No',
          sortable: true,
          filterable: true,
          visible: true,
          template: 'link',
          dataType: 'string'
        },
        {
          key: 'createdBy',
          label: 'Created By',  
          sortable: true, 
          filterable: true,
          visible: true,
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
        },
        {
                key: 'approvalStatus',
                label: 'Approval Status',
                sortable: true,
                filterable: true,
                visible: true,
                template: 'status', // Use status template
                width: '100px',
                dataType: 'string',
                cellClass: 'approval-status-column',
            },
      ],
      actions: [
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View Quotation',
          state : !this.mps.can('view')
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'QuotationHeaderSid',
      emptyMessage: 'No quotation found',
      dragAndDrop: true
    };
  }


  get enquiryHeaderActions(): HeaderAction[] {
    return [
      { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' }
    ];
  }




  // --- Enquiry Methods ---

  protected searchItems() {
    if(this.selectedTab === 'Pending Enquiry') {
      this.enquiryManager.search();
    } else {
      this.quotationManager.search();
    }
  }

  onEnquiryTableActionClick(event: TableEventData) {
    if (event.action === 'navigate') {
      // Your navigation logic
      this.navigateToQuotation(event.row);
    }
  }

  // Header Level
  onEnquiryActionTriggered(action: any) {
    switch (action) {
      case 'reset':
        this.enquiryResetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  async navigateToQuotation(response: any) {
    const dataId = response?.EnquiryHeaderSid;
    if (!dataId) return;

    const enquiryRoutes = response.enquiryRoute || [];

    const polList = enquiryRoutes.map(r => r.POLSid);
    const podList = enquiryRoutes.map(r => r.PODSid);

    /* ---------------- Cargo Types ---------------- */
    const cargoTypeList: string[] = [];

    if (Array.isArray(response.enquiryCargo)) {
      cargoTypeList.push(...response.enquiryCargo.map(c => c.CargoType));
    }

    enquiryRoutes.forEach(route => {
      if (Array.isArray(route.enquiryCargo)) {
        cargoTypeList.push(...route.enquiryCargo.map(c => c.CargoType));
      }
    });

    /* ---------------- Department Logic ---------------- */
    const dept = this.departments.find(
      dep => dep.DepartmentMasterSid === response.DepartmentMasterSid
    );

    const selectedFCLLCL =
      dept?.departmentType === 'Sea'
        ? dept?.FCLLCL
        : dept?.departmentType?.toUpperCase();

    /* ---------------- Route & Cargo Mapping ---------------- */
    const routeDetails = await Promise.all(
      enquiryRoutes.flatMap(route =>
        (route.enquiryCargo || []).map(async cargo => {

          const containerTypeCode =
            this.containerTypes?.find(
              con => con.ContainerName === cargo.ContainerType
            )?.ContainerCode ?? null;

          let packageTypeId = null;
          if (cargo.PackageType) {
            const packageType = await firstValueFrom(
              this.leadService.getUOMByCode(cargo.PackageType)
            );
            console.log('Package Type:',{
              PackageTypeCode : cargo.PackageType,
              packageType
            });
            packageTypeId = packageType?.UOMMasterSid ?? null;
          }

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
            ContainerQty: cargo.Qty,
            ChargeableWeight: cargo.ChargeableWeight,
            PackageQty: cargo.PackageQty,
            PackageType: cargo.PackageType,
            PackageTypeId : packageTypeId,
            ServiceLevel: response.IncoTerms,
            ProductName: cargo.ProductName,
            length: cargo.length,
            width: cargo.width,
            height: cargo.height,
          };
        })
      )
    );

    /* ---------------- Final Payload ---------------- */
    const enqData = {
      EnquirySid: response.EnquiryHeaderSid,
      EnquiryNumber: response.EnquiryNumber,
      CustomerName: response.CustomerName,
      CustomerAddress: response.CustomerAddress,
      Email: response.Email,
      ContactNumber: response.ContactNumber,
      ContactPerson: response.ContactPerson,
      LeadOrCustomer: response.LeadOrCustomer === 'C',
      CustomerMasterSid: response.CustomerMasterSid,
      CustomerBranchSid: response.CustomerBranchSid,
      PreCustomerMasterSid: response.PreCustomerMasterSid,
      CustomerRef: response.CustomerRef,
      SalesmanSid: response.UserMasterSid,
      DepartmentMasterSid: response.DepartmentMasterSid,
      FreightPPCC: response.FreightPPCC,
      ShipmentType: selectedFCLLCL,
      polList,
      podList,
      cargoTypeList,
      status: response.status,
      rateRequest: true,
      quoteRoutes: routeDetails,
    };

    /* ---------------- Navigation ---------------- */
    this.leadService.clearQuotationData();
    this.leadService.setQuotationData(enqData);
    await this.route.navigate(['crm/quotation/entry']);
  }


  onEnquiryTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  onEnquiryTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
  }

  onEnquirySearchTriggered(searchValue: any): void {
    this.enquiryManager.filterValue = searchValue;
    this.enquiryManager.page = 1;
    this.enquiryManager.search();
    this.enquiryManager.updateSearchParams();
    console.log('After Search', this.enquiryManager.totalRecords);
  }

  onEnquiryAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.enquiryManager.filterValue = event.searchValue;
    this.enquiryManager.advancedFilters = event.filters;
    this.enquiryManager.page = 1;
    this.enquiryManager.search();
  }

  onEnquiryDepartmentFilterChanged(departmentSid: number | null): void {
    this.setFilteredPortOptionsForEnquiry(departmentSid);
  }

  enquiryResetPage() {
    this.enquiryManager.filterValue = '';
    this.enquiryManager.page = 1;
    this.enquiryHeader?.clearAdvancedFilters();
  }

  // List Level
  onQuotationTableActionClick(event: TableEventData) {
    if (event.column?.key === 'enquiryNo') {
      if (event.row.enquiryHeaderSid) {
        this.route.navigate(['crm/enquiry/entry', event.row.enquiryHeaderSid]);
      }
    } else if (event.column?.template === "link") {
      this.route.navigate(['operation/booking/entry', event.row.bookingHeader?.BookingHeaderSid]);
    } else if (event.action === 'view') {
      this.route.navigate(['crm/quotation/entry', event.row.QuoteHeaderSid]);
    }
  }

  // Header Level
  onQuotationActionTriggered(action:any) {
    switch (action) {
      case 'create':
        this.navigateQuoteEntry();
        break;
      case 'report':
        this.quoteReport();
        break;
      case 'reset':
        this.quoteResetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  onQuotationTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  onQuotationTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
  }

  onQuotationSearchTriggered(searchValue: any): void {
    this.quotationManager.filterValue = searchValue;
    this.quotationManager.page = 1;
    this.quotationManager.search();
    this.quotationManager.updateSearchParams();
    console.log('After Search', this.quotationManager.totalRecords);
  }

  onQuotationAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.quotationManager.filterValue = event.searchValue;
    this.quotationManager.advancedFilters = event.filters;
    this.quotationManager.page = 1;
    this.quotationManager.search();
  }

  onQuotationDepartmentFilterChanged(departmentSid: number | null): void {
    this.setFilteredPortOptionsForQuotation(departmentSid);
  }

  navigateQuoteEntry(){
    this.route.navigate(['crm/quotation/entry']);
  }

  quoteReport(): void {
    const visibleColumns = this.quotationTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({ key: column.key, label: column.label }));
    this.excelReportService.exportAsExcel({
      data: this.quotationManager.items,
      headers: dynamicHeaders,
      fileName: 'Quotation-Report',
      title: this.currentCompany?.companyName ?? 'Company'
    });
  }

  quoteResetPage() {
    this.quotationManager.filterValue = '';
    this.quotationManager.page = 1;
    this.quotationHeader?.clearAdvancedFilters();
  }

  partySearchFn = (_searchTerm: string, partyType: string): Observable<any[]> => {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid || partyType !== 'CustomerMasterSid') {
      return of([]);
    }
    return this.leadService.getAllCustomersWithBranch(companyMasterSid);
  };

  private initializeDefaultFilters(): void {
    const enquiryDefaults = this.getDefaultEnquiryFilters();
    const quotationDefaults = this.getDefaultQuotationFilters();

    this.enquiryManager.advancedFilters = enquiryDefaults;
    this.quotationManager.advancedFilters = quotationDefaults;
  }

  private getDefaultEnquiryFilters(): AdvancedFilterValues {
    return {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'EnquiryDate'
    };
  }

  private getDefaultQuotationFilters(): AdvancedFilterValues {
    return {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'QuoteDate'
    };
  }

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  private setFilteredPortOptionsForQuotation(departmentSid: number | null): void {
    const normalizedDepartmentSid = departmentSid !== null ? Number(departmentSid) : null;
    const selectedDepartment = this.departments.find(
      (dept: any) => Number(dept?.DepartmentMasterSid) === normalizedDepartmentSid
    );

    const departmentType = (selectedDepartment?.departmentType || '').toUpperCase();
    const filteredPorts = !departmentType
      ? [...this.allPorts]
      : this.allPorts.filter((port: any) => {
          const portType = (port?.PortType || '').toUpperCase();
          return departmentType === 'AIR' ? portType === 'AIR' : portType === 'SEA';
        });

    this.quotationPolFilterConfig = { ...this.quotationPolFilterConfig, options: filteredPorts };
    this.quotationPodFilterConfig = { ...this.quotationPodFilterConfig, options: filteredPorts };
  }

  private setFilteredPortOptionsForEnquiry(departmentSid: number | null): void {
    const normalizedDepartmentSid = departmentSid !== null ? Number(departmentSid) : null;
    const selectedDepartment = this.departments.find(
      (dept: any) => Number(dept?.DepartmentMasterSid) === normalizedDepartmentSid
    );

    const departmentType = (selectedDepartment?.departmentType || '').toUpperCase();
    const filteredPorts = !departmentType
      ? [...this.allPorts]
      : this.allPorts.filter((port: any) => {
          const portType = (port?.PortType || '').toUpperCase();
          return departmentType === 'AIR' ? portType === 'AIR' : portType === 'SEA';
        });

    this.enquiryPolFilterConfig = { ...this.enquiryPolFilterConfig, options: filteredPorts };
    this.enquiryPodFilterConfig = { ...this.enquiryPodFilterConfig, options: filteredPorts };
  }

}

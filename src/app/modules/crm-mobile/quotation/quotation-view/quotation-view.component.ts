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
import { forkJoin, Observable } from 'rxjs';
import { PaginationConfig } from 'src/app/shared/interfaces/pagination.interface';

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
    PageHeaderComponent
  ],
  templateUrl: './quotation-view.component.html',
  styleUrl: './quotation-view.component.scss',
  providers: [CustomDatePipe]
})
export class QuotationViewComponent implements OnInit, OnDestroy {
  @ViewChild('quotationTable') quotationTable!: ReusableTableComponent;
  @ViewChild('enquiryTable') enquiryTable!: ReusableTableComponent;
  @ViewChild('reportModel') content: TemplateRef<any>;

  filterQuotationValue : string= "";
  departments : any[] = [];
  containerTypes : any[] = [];


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
  permissions: string[] = [];
  currentMenuPermissions: any = {};

  // Table Configurations
  enquiryTableConfig: TableConfig;
  quotationTableConfig: TableConfig;

  enquiryPaginationConfig: PaginationConfig;
  quotationPaginationConfig: PaginationConfig;

  constructor(
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

    this.isMobile = this.appService.getDevice();
    this.userData = this.appSettings.getDecryptedUserProfile()
    this.checkPermissions();

    // Initialize Managers
    this.enquiryManager = new EnquiryListManager(this.leadService, this.appSettings, this.spinner, this.datePipe, this.currentCompany, this.currentBranch);
    this.quotationManager = new QuotationListManager(this.leadService, this.appSettings, this.spinner, this.datePipe, this.currentCompany, this.currentBranch);

    this.initializeTableConfigs();
    this.loadAllFields();

    // Initial load
    this.selectTab(this.selectedTab);

  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
      this.leadService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
          console.log(this.permissions)
        }
      });
    }
  }

  loadAllFields(){
    forkJoin([
      this.leadService.getAllDepartments(this.currentCompany.CompanyMasterSid),
      this.leadService.getAllContainerTypes()])
      .subscribe(([
        departments,
        containerTypes
      ]) => {
      this.departments = departments;
      this.containerTypes = containerTypes;
    })
  }

  ngOnDestroy(): void {
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
      actions: [{ icon: 'fas fa-file', label: 'File', action: 'navigate', tooltip: 'Create Quotation' }],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'QuotationHeaderSid',
      emptyMessage: 'No quotation found',
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
          width: "120px"
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
          label: 'Department',
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
          tooltip: 'View Quotation'
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

  get quotationHeaderActions(): HeaderAction[] {
    return [
      { 
        label: 'Create', 
        icon: 'fas fa-plus', 
        action: 'create',
        condition: this.hasPermission('Add')
      },
      {
        label: 'Report',
        icon: 'fas fa-file-alt',
        action: 'report',
        disabled: this.quotationManager.totalRecords === 0
      },
      { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' }
    ];
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
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

  navigateToQuotation(response: any) {
    const dataId = response.EnquiryHeaderSid;
    if (!dataId) {
      return;
    }

    const polList = (response.enquiryRoute || []).map(route => route.POLSid);
    const podList = (response.enquiryRoute || []).map(route => route.PODSid);

    let cargoTypeList: string[] = [];

    if (Array.isArray(response.enquiryCargo)) {
      cargoTypeList.push(...response.enquiryCargo.map(cargo => cargo.CargoType));
    }

    (response.enquiryRoute || []).forEach(route => {
      if (Array.isArray(route.enquiryCargo)) {
        cargoTypeList.push(...route.enquiryCargo.map(cargo => cargo.CargoType));
      }
    });
    console.log(response);
    const dept = this.departments.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    let selectedFCLLCL;
    if (dept?.departmentType === "Sea") {
      selectedFCLLCL = dept?.FCLLCL;
    } else {
      selectedFCLLCL = dept?.departmentType?.toUpperCase();
    }

    let routeDetails = (response.enquiryRoute || []).flatMap(route => {
      return (route.enquiryCargo || []).map(cargo => {
        const containerTypeCode = this.containerTypes.find(
          con => con.ContainerName === cargo.ContainerType
        )?.ContainerCode || null;
        return {
          PORSid: route.PORSid,
          POLSid: route.POLSid,
          PODSid: route.PODSid,
          FPODSid: route.FDPSid,
          CargoType: cargo.CargoType,
          GrossWeight : cargo.GrossWeight,
          NetWeight : cargo.NetWeight,
          Volume: cargo.Volume,
          ContainerType: containerTypeCode,
          ChargeableWeight: cargo.ChargeableWeight,
          ContainerQty: cargo.Qty,
          ServiceLevel: response.IncoTerms
        };
      });
    });

    const enqData = {
      EnquirySid: response?.EnquiryHeaderSid,
      EnquiryNumber: response.EnquiryNumber,
      CustomerAddress: response.CustomerAddress,
      CustomerName: response.CustomerName,
      Email: response.Email,
      LeadOrCustomer : response.LeadOrCustomer === "C",
      CustomerMasterSid: response.CustomerMasterSid,
      CustomerBranchSid: response.CustomerBranchSid,
      CustomerRef: response.CustomerRef,
      ContactNumber: response.ContactNumber,
      ContactPerson: response.ContactPerson,
      FreightPPCC: response.FreightPPCC,
      SalesmanSid: response.UserMasterSid,
      PreCustomerMasterSid : response.PreCustomerMasterSid,
      DepartmentMasterSid: response.DepartmentMasterSid,
      polList: polList,
      podList: podList,
      status: response.status,
      cargoTypeList: cargoTypeList,
      ShipmentType: selectedFCLLCL,
      rateRequest: true,
      quoteRoutes: routeDetails,
    };
    this.leadService.clearQuotationData();
    this.leadService.setQuotationData(enqData);
    this.route.navigate(['crm/quotation/entry']);
  }

  onEnquiryTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  onEnquiryTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
  }

  onEnquirySearchTriggered(searchValue: any): void {
    this.enquiryManager.filterValue = searchValue;
    this.enquiryManager.search();
    this.enquiryManager.updateSearchParams();
    console.log('After Search', this.enquiryManager.totalRecords);
  }

  enquiryResetPage() {
    this.enquiryManager.clearFilter();
  }

  // List Level
  onQuotationTableActionClick(event: TableEventData) {
    if (event.column?.template === "link") {
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
    this.quotationManager.search();
    this.quotationManager.updateSearchParams();
    console.log('After Search', this.quotationManager.totalRecords);
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
    this.quotationManager.clearFilter();
  }


}

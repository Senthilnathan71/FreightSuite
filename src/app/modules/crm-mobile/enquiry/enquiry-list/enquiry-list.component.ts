
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
import { forkJoin } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VoiceEnquiryComponent } from '../voice-enquiry/voice-enquiry.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { NewLineKind } from 'typescript';
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
    ReusableTableComponent
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
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Zone',
        // condition: (row: any) => this.hasPermission('View')
      },
      // {
      //   icon: 'fas fa-file', 
      //   label: 'File',
      //   action: 'file',
      //   tooltip: 'Create Quotation',
      //   class: "text-info",
      //   condition: (row: any) => this.hasPermission('Delete')
      // }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'EnquiryHeaderSid',
    emptyMessage: 'No bookings found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'enquiry-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'BookingNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allEnquirys() { return this.allItems; }
  constructor(
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
    this.searchEnquiry();
    this.isMobile = this.appService.getDevice()
    this.appSettingService.userSettingSource.subscribe(
      (res) => {
        this.userData = res;
      }
    )
    // Initialize table configuration
    this.initializeTableConfig();

    // Initialize base component
    super.ngOnInit();
  }
  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.leadService.searchEnquiry(this.getSearchParams());
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
  this.tableLoading = false;
  this.spinner.hide();

  if (response.status) {
    this.allItems = response.data.items.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended',
      ShipmentExpectedDate: this.datePipe.transform(item.ShipmentExpectedDate) ?? '',
      POLPortName: item.POL?.PortName ?? '',
      PODPortName: item.POD?.PortName ?? ''
    }));

    this.totalLengthOfCollection = response.data.totalCount || 0;
    this.applySorting();
  } else {
    this.appSettingService.showError('Error searching Enquiry.');
    this.allItems = [];
    this.totalLengthOfCollection = 0;
  }
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
    this.tableConfig.columns = [
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
        template:'link',
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
        key: 'POLPortName',
        label: 'POL',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
        {
        key: 'PODPortName',
        label: 'POD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      // {
      //   key: 'ShipmentExpectedDate',
      //   label: 'Expected Shipment Date ',
      //   sortable: true,
      //   filterable: true,
      //   visible: true,
      //   dataType: 'string',

      // },
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
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewEnquiry(event.row);
    } else if (event.action === 'file') {
      this.file(event.row);
    }
  }

  viewEnquiry(row:any){
    this.route.navigate(['crm/enquiry/entry', row.EnquiryHeaderSid])
  }

  onTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  file(row:any){
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
  searchEnquiry() {
    this.spinner.show();
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    let BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const params = {
      search: this.filterValue.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId: CompanyMasterSid,
      activeBranchId: BranchMasterSid,
    }
    this.leadService.searchEnquiry(params).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.enquiryItems = resp.data?.items;
          this.totalLengthOfCollection = resp.data?.totalCount || 0;
          this.applySorting();
          this.searchPerformed = true;
        } else {
          this.appSettingService.showError(resp.message);
          console.error('Error searching Enquiry', resp.message)
          this.enquiryItems = [];
          this.totalLengthOfCollection = 0;
        }
        this.spinner.hide();
      }, error: (error: any) => {
        console.error(error);
      }
    })
  }

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
    this.searchEnquiry()
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
          GrossWeight : cargo.GrossWeight,
          NetWeight : cargo.NetWeight,
          Volume: cargo.Volume,
          ContainerType: containerTypeCode,
          ChargeableWeight: cargo.ChargeableWeight,
          Qty: cargo.Qty,
          ServiceLevel : response.IncoTerms
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
      FreightPPCC : response.FreightPPCC,
      rateRequest: true,
      quoteRoutes: routeDetails,
    };
    this.leadService.clearQuotationData();
    this.leadService.setQuotationData(enqData);
    this.route.navigate(['crm/quotation/entry']);
  }

  resetFilters(): void {
    this.filterValue = '';
    this.sortColumn = "EnquiryNumber"
    this.sortDirection = "asc"
    this.enquiryItems = [];
    this.totalLengthOfCollection = this.enquiryItems.length;
    this.page = 1;
    this.searchPerformed = false;
    this.searchEnquiry();
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

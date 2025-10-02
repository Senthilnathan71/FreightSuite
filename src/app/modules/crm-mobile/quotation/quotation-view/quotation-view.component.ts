import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { LeadService } from '../../Services/lead.service';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { DateFormatPipe } from 'src/app/core/pipes/date-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import * as html2pdf from 'html2pdf.js';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ToastrService } from 'ngx-toastr';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { firstValueFrom } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { GlobalDateFormatService } from 'src/app/core/services/global-date-format.service';
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
    ReusableTableComponent
  ],
  templateUrl: './quotation-view.component.html',
  styleUrl: './quotation-view.component.scss',
  providers: [CustomDatePipe]
})
export class QuotationViewComponent extends BaseListComponent implements OnInit {
  @ViewChild('quotationTable') quotationTable!: ReusableTableComponent;
  @ViewChild('reportModel') content: TemplateRef<any>
  isLoading = false;
  active = 1;
  @ViewChild('nav', { static: true }) nav!: NgbNavModule;
  errorMessage: string = '';  // To store any error messages
  // pagination
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection: number;
  page1 = 1;
  pageSize1 = 15;
  totalLengthOfCollection1: number;
  searchText: string = '';
  quoteItems: any[] = [];
  filteredEnquiryItems: any[] = []
  isMobile: boolean = false;
  quoteData: any
  enquiryItems: any[] = [];
  unitList: any[] = [];
  enquiryData: any
  ports: any[] = []
  selectedItem: any;
  currentDate = new Date().toLocaleDateString(); // or any formatted string
  // filterValue : any = ''
  filterEnqValue: any = ''
  userData: any
  currentCompany: any;
  currentBranch: any;
  selectedFCLLCL: string = "LCL"
  filteredQuoteItems: any[] = []
  departments: any[] = [];
  containerTypes: any[] = [];
  slicedEnquiryItems: any[] = []
  selectedTab = 'Pending Rate Request';
  tabs = [
    { name: 'Pending Rate Request', icon: 'fas fa-file-signature' },
    { name: 'Quotation', icon: 'fas fa-layer-group' }
  ];
  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Quotation',
        // condition: (row: any) => this.hasPermission('View')
      },
       {
        icon: 'fas fa-file',
        label: 'File',
        action: 'File',
        tooltip: 'File Quotation',
        // condition: (row: any) => this.hasPermission('View')
      },
       {
        icon: 'fas fa-book',
        label: 'Booking',
        action: 'booking',
        tooltip: 'Create Booking',
        // condition: (row: any) => this.hasPermission('View')
      },
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

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'quotation-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'BookingNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allQuotation() { return this.allItems; }
  constructor(
    private toastr: ToastrService,
    private excelReportService: ExcelExportService,
    private modalService: NgbModal,
    private leadService: LeadService,
    private route: Router,
    private appService: AppService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private datePipe: CustomDatePipe,
    paginationService: PaginationService,
    private globalDateService: GlobalDateFormatService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    this.isMobile = this.appService.getDevice()
    this.loadPorts()
    this.loadDepartments();
    this.loadContainerTypes();
    this.loadEnquiries()
    this.loadUnits();
    // this.loadQuotes();
    this.searchQuotation();
    this.appSettingService.getUser().subscribe(
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
    return this.leadService.searchQuotation(this.getSearchParams());
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
        departmentName: item.quoteRoute?.[0]?.departmentMaster?.departmentName ?? '',
        PODName: item.quoteRoute?.[0]?.PortPOD?.PortCode ?? '',
        POLName: item.quoteRoute?.[0]?.PortPOL?.PortCode ?? '',
        QuoteDate : this.datePipe.transform(item?.QuoteDate),
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
    } else {
      this.appSettingService.showError('Error searching bookings.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching quotation.');
    console.error('Error searching quotation', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchBookings() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.QuotationHeaderSid || index;
  }


  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'QuoteNumber',
        label: 'Quote No',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'link',
        width: '140px',
        dataType: 'string'
      },
      {
        key: 'QuoteDate',
        label: 'Quote Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width:"120px"
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
        key: 'POLName',
        label: 'POL',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'PODName',
        label: 'POD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        cellClass: 'vessel-column'
      },
      {
        key: '',
        label: 'Booking No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: "140px"
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
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewQuotation(event.row);
    } else if (event.action === "File") {
      this.fileBy(event.row,this.content)
    } else if (event.action === "booking") {
      this.goForBookingCreation(event.row)
    }
  }
 
fileBy(row: any, content: TemplateRef<any>) {
  this.reportAndEmailModel(row, content);
}
  viewQuotation(row: any): void {
    this.route.navigate(['crm/quotation/entry', row.QuoteHeaderSid]);
  }

  onTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
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
    const formattedData = this.allQuotation;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.quotationTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Quotation-Report',
      title: companyName
    });
  }
  loadDepartments() {
    const companyMastersID = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllDepartments(companyMastersID).subscribe(
      (resp: any) => {
        if (resp) {
          this.departments = resp;
        } else {
          this.appSettingService.showError('Error loading departments.');
          console.error(resp.message);
        }
      }
    )
  }

  loadContainerTypes() {
    this.leadService.getAllContainerTypes().subscribe(
      (resp: any) => {
        if (resp) {
          this.containerTypes = resp;
        } else {
          this.appSettingService.showError('Error loading container types.');
          console.error(resp);
        }
      }
    )
  }

  filterEnquiry() {
    const filterValue = this.filterValue.trim() || '';
    if (!filterValue) {
      this.filteredQuoteItems = [...this.quoteItems];
    } else {
      this.filteredQuoteItems = this.quoteItems.filter(enq =>
        (enq.EnquiryNumber ?? '').toLowerCase().includes(filterValue) ||
        (enq.CustomerName ?? '').toLowerCase().includes(filterValue) ||
        (enq.POLCode ?? '').toLowerCase().includes(filterValue) ||
        (enq.PODCode ?? '').toLowerCase().includes(filterValue) ||
        (enq.EnquiryDate ?? '').toString().toLowerCase().includes(filterValue)
      );
    }
  }

  searchQuotation() {
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
    this.leadService.searchQuotation(params).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.quoteItems = resp.data?.items;
          console.log(this.quoteItems);
          this.totalLengthOfCollection = resp.data?.totalCount || 0;
        } else {
          this.appSettingService.showError(resp.message);
          console.error('Error searching Quotation', resp.message)
          this.quoteItems = [];
          this.totalLengthOfCollection1 = 0;
        }
        this.spinner.hide();
      }, error: (error: any) => {
        console.error(error);
      }
    })
  }



  // Method to load the leads
  loadQuotes(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    this.leadService.getAllQuotes(CompanyMasterSid, BranchMasterSid).subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.quoteData = resp['data'];  // On success, store the leads data in the component

        this.quoteItems = [...this.quoteData]
        this.updatePaginatedData();  // Update paginated data

        this.totalLengthOfCollection = this.quoteData.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
        console.error('Error loading enquiry:', error);  // Optionally log the error
      }
    );
  }




  loadEnquiries(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    this.leadService.getAllEnquiries(CompanyMasterSid, BranchMasterSid).subscribe(
      (resp: any[]) => {
        this.enquiryItems = resp['data'] || [];
        this.enquiryData = (resp['data'] || []).map((enq) => {
          return {
            EnquiryHeaderSid: enq.EnquiryHeaderSid,
            EnquiryNumber: enq.EnquiryNumber,
            CustomerName: enq.CustomerName,
            departmentName: this.getDepartmentName(enq.DepartmentMasterSid),
            POLCode: this.getFormattedPort(enq.enquiryRoute[0]?.POLSid),
            PODCode: this.getFormattedPort(enq.enquiryRoute[0]?.PODSid),
            EnquiryDate: this.datePipe.transform(enq.EnquiryDate),
          }

        });
        this.filteredEnquiryItems = [...this.enquiryData]
        this.totalLengthOfCollection1 = this.filteredEnquiryItems.length || 0;
        this.updateEnquiryPaginatedData();


      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading enquiry:', error);
      }
    );
  }

  searchEnquiry(): void {
    const text = this.filterEnqValue.trim().toLowerCase() || '';
    console.log(text);
    this.filteredEnquiryItems = this.enquiryData.filter(enq =>
      (enq.EnquiryNumber ?? '').toLowerCase().includes(text) ||
      (enq.CustomerName ?? '').toLowerCase().includes(text) ||
      (enq.departmentName ?? '').toLowerCase().includes(text) ||
      (enq.POLCode ?? '').toLowerCase().includes(text) ||
      (enq.PODCode ?? '').toLowerCase().includes(text) ||
      (enq.EnquiryDate ?? '').toString().toLowerCase().includes(text)
    );

    this.totalLengthOfCollection1 = this.filteredEnquiryItems.length;
    this.updateEnquiryPaginatedData();
    this.page1 = 1;
  }

  getDepartmentName(DepartmentMasterSid: number): string | null {
    if (!DepartmentMasterSid || this.departments.length === 0) return "";
    const ourDepartment = this.departments.find(d => d.DepartmentMasterSid === DepartmentMasterSid);
    return ourDepartment ? ourDepartment.departmentName : "";
  }

  loadPorts(): void {
    this.leadService.getAllPorts().subscribe(
      (resp: any) => {
        this.ports = resp
      });
  }

  loadUnits() {
    this.leadService.getAllUnits().subscribe(
      (resp: any) => {
        if (resp.status) {
          this.unitList = resp.data;
        }
      }
    )
  }

  getPortCode(portMasterSid: number): string | null {
    const port = this.ports.find((p) => p.PortMasterSid === portMasterSid);
    console.log(port)
    return port ? port.PortCode : null;
  }

  updateEnquiryPaginatedData(): void {
    const startIndex = (this.page1 - 1) * this.pageSize1;
    const endIndex = startIndex + this.pageSize1;
    this.slicedEnquiryItems = this.filteredEnquiryItems.slice(startIndex, endIndex);
  }

  updatePaginatedData(): void {
    this.searchQuotation();
  }

  // clearFilterValue(){
  //   this.filterValue = '';
  //   this.searchQuotation();
  // }

  clearFilterEnqValue() {
    this.filterEnqValue = '';
    this.filteredEnquiryItems = [...this.enquiryData]
    this.updateEnquiryPaginatedData();
    this.totalLengthOfCollection1 = this.enquiryData.length;
  }

  createNew() {
    this.route.navigate(['crm/quotation/entry'])
  }

  editEnquiry(id) {
    this.route.navigate(['crm/quotation/entry', id])
  }

  // createQuotation(enq: any) {
  //   console.log(enq);

  //   const polList = enq.enquiryRoute.map(route => route.POLSid);
  //   const podList = enq.enquiryRoute.map(route => route.PODSid);

  //   // Extract cargo types from both root-level enquiryCargo and nested enquiryCargo inside enquiryRoute
  //   let cargoTypeList: string[] = [];

  //   // Extract from root-level enquiryCargo
  //   if (Array.isArray(enq.enquiryCargo)) {
  //     cargoTypeList.push(...enq.enquiryCargo.map(cargo => cargo.CargoType));
  //   }

  //   // Extract from nested enquiryCargo inside enquiryRoute
  //   enq.enquiryRoute.forEach(route => {
  //     if (Array.isArray(route.enquiryCargo)) {
  //       cargoTypeList.push(...route.enquiryCargo.map(cargo => cargo.CargoType));
  //     }
  //   });

  //   // Remove duplicates (optional)
  //   cargoTypeList = [...new Set(cargoTypeList)];
  //   this.leadService.clearQuotationData();  // <-- Add this line to clear previous data

  //   this.leadService.setQuotationData({
  //     customerId: enq.CustomerMasterSid,
  //     departmentId: enq.DepartmentMasterSid,
  //     polList: polList,  // Sending as an array
  //     podList: podList,  // Sending as an array
  //     cargoTypeList: cargoTypeList,  // Merging from both possible sources
  //     rateRequest: true,
  //     active: 2
  //   });

  //   this.route.navigate(['crm/quotation/entry']);
  // }

  navigateQuotation(data: any) {
    console.log(data);
    const dataId = data.EnquiryHeaderSid;
    if (!dataId) {
      return;
    }
    const response = this.enquiryItems.find(item => item.EnquiryHeaderSid === dataId);
    console.log(response)
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
        const containerTypeId = this.containerTypes.find(
          con => con.ContainerName === cargo.ContainerType
        )?.ContainerTypeMasterSid || null;
        return {
          PORSid: route.PORSid,
          POLSid: route.POLSid,
          PODSid: route.PODSid,
          FPODSid: route.FDPSid,
          CargoType: cargo.CargoType,
          CBM: cargo.Volume,
          ContainerType: containerTypeId,
          ChargeableWeight: cargo.ChargeableWeight,
          ContainerQty: cargo.Qty
        };
      });
    });

    const enqData = {

      EnquirySid: response?.EnquiryHeaderSid,
      EnquiryNumber: response.EnquiryNumber,
      CustomerAddress: response.CustomerAddress,
      CustomerName: response.CustomerName,
      Email: response.Email,
      CustomerMasterSid: response.CustomerMasterSid,
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

  getFormattedPort(PortMasterSid) {
    if (!PortMasterSid || PortMasterSid === undefined || this.ports.length === 0) {
      return '';
    }
    const ourPort = this.ports.find(p => p.PortMasterSid === PortMasterSid);
    return ourPort ? ourPort.PortCode : '';
  }

  findUnitName(UnitMasterSid: number) {
    if (!UnitMasterSid || this.unitList.length === 0) {
      return;
    }
    return (this.unitList.find(u => u.UnitMasterSid === UnitMasterSid)).unitName;
  }

  findEnquiryName(EnquiryId: number) {
    if (!EnquiryId) return;
    return (this.enquiryData.find(data => data.EnquiryHeaderSid === EnquiryId)).EnquiryNumber;
  }

  reportAndEmailModel(data: any, content: TemplateRef<any>) {
    this.selectedItem = data;
    this.modalService.open(content, {
      size: 'xl', // or omit this to avoid interference
      scrollable: false,
      windowClass: 'custom-wide-modal'
    });
  }

  downloadPDF(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const element = document.getElementById('pdfContent');

      const opt = {
        margin: 0.5,
        filename: (this.selectedItem?.QuotationName || 'quotation') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      if (!element) return reject('No element found');

      html2pdf().from(element).set(opt).outputPdf('blob')
        .then((blob: Blob) => resolve(blob))
        .catch((err: any) => reject(err));
    });
  }


  orgEmail: any
  quotationEmail: any
  loggedInUserEmail: any
  async sendEmail() {
    try {
      this.isLoading = true;

      const pdfBlob = await this.downloadPDF();

      const formData = new FormData();
      const toEmailSet = new Set<string>();

      if (this.selectedItem?.Email) {
        toEmailSet.add(this.selectedItem.Email);
      }

      if (toEmailSet.size === 0 && this.selectedItem?.CustomerBranchSid) {
        const resp: any = await firstValueFrom(
          this.leadService.getCustomerBranchEmail(this.selectedItem.CustomerBranchSid)
        );

        if (resp?.status && resp.data?.Email) {
          toEmailSet.add(resp.data.Email);
        }
      }

      if (toEmailSet.size === 0) {
        this.appSettingService.showError('To Email is missing.')
        this.isLoading = false;
        return;
      }

      const toEmail = Array.from(toEmailSet);
      toEmail.forEach(email => {
        if (email) {
          formData.append("EmailTo[]", email);
        }
      });

      const ccEmailSet = new Set<string>([this.userData['userEmail']]);
      const ccEmail = Array.from(ccEmailSet);

      ccEmail.forEach(email => {
        if (email) {
          formData.append("EmailCC[]", email);
        }
      });
      formData.append('Subject', `Quotation No.${this.selectedItem.QuoteNumber} Date:${new Date(this.selectedItem.QuoteDate)} ${this.getFormattedPort(this.selectedItem.quoteRoute[0].POLSid)} - ${this.getFormattedPort(this.selectedItem.quoteRoute[0].PODSid)}`);
      formData.append('Mailbody', `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Please find enclosed the quotation as requested.</p>
        <p>Kindly review the details at your convenience.</p>
        <p>Looking forward to your feedback and the opportunity to work together.</p>
        <p>
          Approval Hyperlink: 
          <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
        </p>
        <p>Best Regards,</p>
        <p>${this.userData['userEmail']}</p>
      </div>
    `);
      formData.append('file', pdfBlob, (this.selectedItem?.QuotationName || 'quotation') + '.pdf');

      console.log(formData)
      this.leadService.quotationReport(formData).subscribe((resp: any) => {
        this.isLoading = false;
        if (resp?.data) {
          this.toastr.success('Report Email Sent successfully!');
        }
      }, error => {
        this.isLoading = false;
        this.toastr.error('Failed to send email.');
      });

    } catch (err) {
      this.isLoading = false;
      console.error('PDF generation error:', err);
      this.toastr.error('Error generating PDF.');
    }
  }

  //  report(): void {
  //   const formattedData = this.quoteItems.map(item => ({
  //     ...item,
  //     department: item.quoteRoute[0]?.departmentMaster?.departmentName,
  //     pol: item.quoteRoute[0]?.PortPOL?.PortName,
  //     pod: item.quoteRoute[0]?.PortPOD?.PortName,
  //     status: item.authorizerStatus === "Approved" 
  //          ? "Approved" 
  //          : item.authorizerStatus === "Rejected" 
  //            ? "Rejected" 
  //            : "Pending",
  //   }));


  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'QuoteNumber', label: 'Quote Number' },
  //       { key: 'QuoteDate', label: 'Quote Date' },
  //       { key: 'CustomerName', label: 'Customer Name' },
  //       { key: 'department', label: 'Department' },
  //       { key: 'pol', label: 'POL' },
  //       { key: 'pod', label: 'POD' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'Quotation-Report',
  //     title: companyName
  //   });
  // }

  goForBookingCreation(QuoteData) {
    console.log(QuoteData, 'QuoteData');

    // TODO : need to fix this after completion of Authorization
    // const approvedRoute = (QuoteData.quoteRoute || []).find(route =>
    //   route.quoteCarrier.some(carrier => carrier.ApprovalStatus === "A")
    // ) || {};
    const approvedRoute = QuoteData.quoteRoute[0] || [];
    const POO = this.ports.find(port => port.PortMasterSid === approvedRoute.PORSid);
    const POL = this.ports.find(port => port.PortMasterSid === approvedRoute.POLSid);
    const POD = this.ports.find(port => port.PortMasterSid === approvedRoute.PODSid);
    const FPD = this.ports.find(port => port.PortMasterSid === approvedRoute.FDPSid);


    // TODO : need to fix this after completion of Authorization
    // const approvedCarrier = (approvedRoute?.quoteCarrier || []).find(
    //   carrier => carrier.ApprovalStatus === "A"
    // ) || {};
    const approvedCarrier = approvedRoute?.quoteCarrier?.[0] || {};

    const cargo = approvedRoute?.quoteCargo?.[0] || {};

    const data = {
      quotation: true,
      DepartmentMasterSid: approvedRoute.DepartmentMasterSid || null,
      CustomerMasterSid: QuoteData.CustomerMasterSid || null,
      CustomerBranchSid: QuoteData.CustomerBranchSid || null,
      CustomerName: QuoteData.CustomerName || "",
      CustomerAddress: QuoteData.CustomerAddress || "",
      SalesmanSid: QuoteData.SalesmanSid || null,
      FreightTerms: QuoteData.FreightPPCC || "",
      QuotationHeaderSid: QuoteData.QuoteHeaderSid || null,
      CarrierName: approvedCarrier?.CarrierName || "",

      POO: POO?.PortCode || null,
      POL: POL?.PortCode || null,
      POD: POD?.PortCode || null,
      FPD: FPD?.PortCode || null,

      bookingCargo: cargo ? [
        {
          CargoType: cargo.CargoType,
          GrossWeight: cargo.GrossWeight,
          NetWeight: cargo.NetWeight,
          Volume: cargo.Volume,
          ChargeableWeight: cargo.ChargeableWeight,
          ContainerType: cargo.ContainerType,
          NoofContainers: cargo.Qty,
        }
      ] : [],

      bookingProduct: (cargo?.quoteProduct || []).map(product => ({
        ProductName: product.ProductName,
        ExternaPkg: product.ExternalPkg,
        ExternlQty: product.ExternalQty,
        GrossWeight: product.GrossWeight,
        NetWeight: product.NetWeight,
        Volume: product.Volume,
        IsHaz: product.IsHaz,
        ImcoClass: product.ImcoClass,
        UnNo: product.UnNo,
        PkgGroup: product.PkgGroup,
        Length: product.Length,
        Width: product.Width,
        Height: product.Height,
        UomMasterSid: product.UomMasterSid,
      })),

      bookingRates: (approvedCarrier?.quoteCharge || []).map((charge, index) => ({
        CompanyMasterSid: charge.CompanyMasterSid,
        BranchMasterSid: charge.BranchMasterSid,
        SerialNumber: index + 1,
        ChargeMasterSid: charge.ChargeUomSid, 
        ChargeDescription: charge.ChargeDisplayName,
        NoOfUnit: charge.Qty,

        CostChargeUomSid: charge.CostChargeUomSid,
        CostPrepaidCollect: charge.CostPrepaidCollect,
        CostDrCr: charge.CostDrCr,
        CostCurrencyMasterSid: charge.CostCurrencyMasterSid,
        CostExchangeRate: charge.CostExchangeRate,
        CostRate: charge.CostRate,
        CostAmount: charge.CostAmount,
        CostLocalAmount: charge.CostLocalAmount,

        RevenueChargeUomSid: charge.RevenueChargeUomSid,
        RevenuePrepaidCollect: charge.RevenuePrepaidCollect,
        RevenueDrCr: charge.RevenueDrCr,
        RevenueCurrencyMasterSid: charge.RevenueCurrencyMasterSid,
        RevenueExchangeRate: charge.RevenueExchangeRate,
        RevenueRate: charge.RevenueRate,
        RevenueAmount: charge.RevenueAmount,
        RevenueLocalAmount: charge.RevenueLocalAmount,
      }))
    };

    this.route.navigate(['operation/booking/entry'], {
      state: {
        dataFromQuotation: data
      }
    });
  }

  resetFilters(): void {
    this.filterValue = '';
    this.page = 1;
    this.pageSize = 15;
    this.quoteItems = [];
    this.totalLengthOfCollection = 0;
    this.searchQuotation();
  }

  formatMyDate(date: Date): string {
    return this.globalDateService.formatDate(date);
  }
}

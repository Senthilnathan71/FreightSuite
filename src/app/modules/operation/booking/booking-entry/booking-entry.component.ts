import { Component, ViewChild, TemplateRef, OnInit, Input, OnDestroy } from '@angular/core';
import { NgbAccordionModule, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, delay, firstValueFrom, forkJoin, of, Subject, takeUntil, tap } from 'rxjs';
import { OperationService } from '../../operation.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { MilestoneComponent } from '../../milestone/milestone/milestone.component';
import { CostEntryComponent } from '../../cost/cost -entry/cost-entry.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { NgbAccordionDirective } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionComponent } from '../../connection/connection/connection.component';
import { ArApComponent } from '../../AR-AP/ar-ap/ar-ap.component';

import { toggleFullScreen } from 'src/app/shared/fullscreenToggle';
import { BookingData } from '../excel-parser.service';
import { BookingUploadComponent } from '../booking-upload/booking-upload.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import html2pdf from 'html2pdf.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { TaxCalculationService, BookingRateDetails } from '../../services/tax-calculation.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { SearchableDropdownModal } from 'src/app/component/searchable-dropdown/searchable-dropdown-modal.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TimeAgoPipe } from 'src/app/core/pipes/timeAgo.pipe';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { BookingDocumentType, PdfMakeService, transformBookingApiData, transformCroApiData } from 'src/app/common/pdf';
import { CommonService } from 'src/app/common/common.service';
import { Download, Menu } from 'angular-feather/icons';
import { VolumetricAndCbmCalculationService } from 'src/app/core/services/volumetric-and-cbm-calculation.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { SafeInsertShipmentMilestone } from '../../services/shipment-milestone.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { BarcodeConfig, BarcodeService } from 'src/app/core/services/bar-code.service';
import { NgxBarcode6Module } from 'ngx-barcode6';
import { VerticalSidebarService } from 'src/app/shared/vertical-sidebar/vertical-sidebar.service';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { getDefaultTodayDate, toNgbDateStruct } from 'src/app/common/helper';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { ToastrService } from 'ngx-toastr';
import { errorLoggerWithToastr, ValidationMessageConfig } from 'src/app/common/error-handling/form-error-handler';
import { extractBackendErrorMessage } from 'src/app/common/error-handling/payload-validation-handler';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { HostListener } from '@angular/core';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { th } from 'date-fns/locale';
import * as JsBarcode from 'jsbarcode';
import { CreditValidationApiService } from '../../services/credit-request.service';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { DocReferenceComponent } from '../../doc-reference/doc-reference.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
type Html2PdfOptions = {
  margin?: number | [number, number, number, number];
  filename?: string;
  image?: {
    type?: 'jpeg' | 'png' | 'webp';
    quality?: number;
  };
  html2canvas?: {
    scale?: number;
    logging?: boolean;
    dpi?: number;
    letterRendering?: boolean;
    useCORS?: boolean;
  };
  jsPDF?: {
    unit?: string;
    format?: string | [number, number];
    orientation?: 'portrait' | 'landscape';
  };
};

type BookingEmailType = 'booking' | 'cro' | 'barcode' | 'barcode-no-company';

@Component({
  selector: 'app-booking-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbAccordionModule,
    NgbAccordionDirective,
    CustomDatePipe,
    NgbPaginationModule,
    ConnectionComponent,
    DecimalPrecisionDirective,
    OnlyTextDirective,
    OnlyNumbersDirective,
    TextWithNumbersDirective,
    MilestoneComponent,
    CostEntryComponent,
    NgComponentOutlet,
    CostEntryComponent,
    ArApComponent,
    BookingUploadComponent,
    NgxSpinnerModule,
    NgbTooltip,
    SearchableDropdown,
    SearchableDropdownModal,
    NgxSpinnerModule,
    NgbDropdownModule,
    PreventMultiClickDirective,
    TimeAgoPipe,
    NgxBarcode6Module,
    PrintFooterComponent,
    PrintHeaderComponent,
    FormStateGuardDirective,
    ElementStateGuardDirective,
  ],
  templateUrl: './booking-entry.component.html',
  styleUrls: ['./booking-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class BookingEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {


  /**
    |--------------------------------------------------
    |   Section-1 Variable Declaration
    |--------------------------------------------------
  */

  private destroy$ = new Subject<void>();
  @ViewChild('uploadModal') uploadModal!: BookingUploadComponent;
  @ViewChild('costEntryComponent') costEntryComponent: CostEntryComponent;
  @ViewChild('departmentLookup') departmentLookup!: SearchableDropdown;
  @ViewChild('milestoneComponent') milestoneComponent!: MilestoneComponent;
  chargeableWeightManualOverride: boolean = false;
  isPatching: boolean = false;
  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;
  parsedBookings: BookingData[] = [];
  showParsedData = false;
  uploadResult: any = null;
  isSaving : boolean = false;
  lastCreditValidationMessage: string = '';
  isDirty: boolean = false;
  private hasSubscribedToFormChanges: boolean = false;
  private initialFormValue: any = null;
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  //Variable Declaration - Common 
  detailForm !: FormGroup;
  userData: any;
  selectedCustomer: any;
  isPrintLoading: boolean;
  currentCompany: any;
  currentBranch: any;
  isMawbStockAllocationEnabled = false;
  isTermsAndConditionsEnabled: boolean = true;
  isCreditRequestCheckingEnabled: boolean = false;
  MenuMasterSid: any;
  filterOption: any;
  isFormDisabled: boolean = false;
  private hasShownVesselWarning = false;
  public rateComponent = CostEntryComponent;
  public ArApcomponent = ArApComponent;
  costRevenueAccess: string = 'NONE';

  selectTab(tab: string) {
    if (tab === 'Rate' && this.costRevenueAccess === 'HIDE_BOTH') {
      this.toastr.warning(
        'Cost and Revenue access is hidden for this branch. Contact admin to update CostRevenueAccess in User Master.',
        'Access Restricted'
      );
      return;
    }
    if (tab === "Rate") {
      this.syncFormValueWithRateComponent();
    }
    this.selectedTab = tab;
  }
  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };

  customerAirlineLookupConfig={
    displayFields: ['CustomerName','AirlineCode'],
    displayLabels: ['Customer','AirlineCode'],
    labelFields: ['AirlineCode']
  }

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  // Variable Declaration - Header Part
  BookingHeaderSid: number;
  currentMenuId: any;
  selectedDepartment: any;
  selectedDepartmentType: string;
  selectedFCLLCL: string = "LCL";
  selectedCargoMode: 'FCL' | 'LCL' | 'AIR' | 'ROAD' = 'LCL';
  isEditMode: boolean;
  isJobGenerated: boolean = false;
  isGeneratingJob: boolean = false;
  bookingData: any;
  showGenerateJobButton: boolean = false;
  quotationNumber: any = '';
  departmentList: any[] = [];
  customerList: any[] = [];
  customerBranchList: any[] = [];
  salesmanList: any[] = [];
  shipperList: any[] = [];
  filteredShipperList: any[] = [];
  consigneeList: any[] = [];
  filteredConsigneeList: any[] = [];
  agentList: any[] = [];
  carrierList: any[] = [];
  notifyList: any[] = [];
  yardlist: any[] = [];
  cfslist: any[] = [];
  yardCFSList: any[] = [];
  filteredYardCFSList: any[] = [];
  currentYardCFSType: 'yard' | 'cfs' | null = null;
  vesselList: any[] = [];
  airlineList: any[] = [];
  headerVesselList: any[] = [];
  voyageList: any[] = [];
  portList: any[] = [];
  filteredPorts: any[] = [];
  filteredPOO: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  filteredFPOD: any[] = [];
  private lastPortFilterPayloadKey = '';
  incoList: any[] = [];
  TandCList: any[] = [];
  printTermsList: any[] = [];
  bookingHeader: any;
  selectedCustomerBranch: any;
  isShipperOther: boolean
  private isManualFreightChange = false;
  decimalAfterPrecision = 3;
  currentCompanyBranches: any[] = [];
  measurementUnitList =[
    { id: 1, name: 'M' },
    { id: 2, name: 'CM' },
    { id: 3, name: 'Inch'}
  ]
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  
  bookingStatusTimeline : any[];
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  bookingForm !: FormGroup;
  modeOfTransport = [
    { id: 1, name: 'Rail' },
    { id: 2, name: 'Road' },
    { id: 3, name: 'Flight' },
    { id: 4, name: 'Vessel' },
  ];

  nominationList = [
    { id: 1, name: "Self" },
    { id: 2, name: "Nomination" },
  ]

  barcodeBookingNo: string = '';
  printQty: number = 1;
  isWithCompany = false;
  barcodeActionType: 'print' | 'pdf' = 'print';
  private barcodePdfImageCache = new Map<string, string>();
  isBarcodePdfPreparing = false;
  isBarcodePdfReady = false;
  isBarcodePdfDownloading = false;
 barcodeConfig: BarcodeConfig = {
  format: 'CODE128',
  height: 22,     // small but readable
  width: 1,       // DO NOT go below 1
  fontSize: 10,
  displayValue: true   // reduces visual size
};

 barcodeConfig1: BarcodeConfig = {
  format: 'CODE128',
  height: 30,     // small but readable
  width: 1.2,       // DO NOT go below 1
  fontSize: 10,
  displayValue: true   // reduces visual size
};



  // Variable Declaration - Cargo Part
  containerTypeList: any[] = [];
  selectedContainerType: any;
  cargoForm !: FormGroup;
  bookingCargoActiveIndex = 0;
  bookingCargoExpanded: boolean[] = [];
  modeOfCargoType = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Haz' },
    { id: 3, name: 'Reefer' },
    { id: 4, name: 'Tanker' },
    { id: 5, name: 'OOG' },
  ];
  freightTermsList = [
    { id: 1, name: 'Prepaid' },
    { id: 2, name: 'Collect' }
  ]
  stuffingAt = [
    { id: 1, name: 'Dock' },
    { id: 2, name: 'Factory' }
  ]

  // Variable Declaration - Product Part
  productDataLength: number;
  digitsAfterDecimal = 3;
  page = 1;
  pageSize = 5;
  currentProductIndex: number;
  productEditMode: boolean;
  productLookupsLoaded: boolean;
  slicedProductArr: any[];
  productList: any[];
  packageTypeList: any[];
  productForm !: FormGroup;
  croForm !: FormGroup;
  countryOfCompany: string;
  private readonly productCalculationOverrides = new WeakMap<FormGroup, { volumeManual: boolean; volumetricManual: boolean }>();
  private readonly productValidationConfig: ValidationMessageConfig = {
    labels: {
      ProductName: 'Commodity',
      ContainerType: 'Container Type',
      NoofContainers: 'No. of Container',
      ShippingBillNo: 'Shipping Bill No',
      ShippingBillDate: 'Shipping Bill Date',
      ExternaPkg: 'External Package',
      ExternlQty: 'External Quantity',
      GrossWeight: 'Gross Weight',
      NetWeight: 'Net Weight',
      Volume: 'CBM',
      Volumetric: 'Volumetric Weight',
      UomMasterSid: 'UOM',
      CargoRecDate: 'Cargo Received Date',
      Length: 'Length',
      Width: 'Width',
      Height: 'Height',
      ImcoClass: 'Imco Class',
      UnNo: 'UN No',
      PkgGroup: 'Pkg Group',
    },
    messages: {
      required: (label: string) => `${label} is required.`,
    },
  };

  // Variable Declaration - Other Part
  YardCFSLabel: string = "CFS"
  forwarderList: any[] = [];
  currencyList: any[] = [];
  imcoList: any[] = [];
  uomList: any[] = [];
  otherForm !: FormGroup;

  // Variable Declaration - Connection Part
  PODandFPODsame: boolean = true;
  minStartDate: Date = new Date();
  resetTriggerConnection: boolean;
  bookingConnectionsArr: any[] = [];
  connectionResult: any[] = [];


  // Variable Declaration - Rate Part
  resetTriggerRate: boolean;
  rateResult: any[] = [];
  bookingRateArr: any[] = [];
  currentFormValue: any;

  // Variable Declaration - Milestone Part
  resetTriggerMilestone: boolean;
  milestoneResult: any[] = [];
  followupModalRef : NgbModalRef;
  website:any;
  today: any;
  minDate: any;
  currentDate = new Date();

  modeOfShippmentTerms = [
    { id: 1, name: 'LCL' },
    { id: 2, name: 'FCL' },
  ];

  modeOfDept = [
    { id: 1, name: 'LCL' },
    { id: 2, name: 'FCL' },
    { id: 3, name: 'AIR' },
  ];



  modeOfShipmentTerms = [
    { id: 1, name: 'FCL/FCL' },
    { id: 2, name: 'FCL/LCL' },
    { id: 3, name: 'LCL/FCL' },
    { id: 4, name: 'LCL/LCL' },
    { id: 5, name: 'LTL' },
    { id: 6, name: 'FTL' },
    { id: 7, name: 'FTL HH' },
  ];

  modeOfMovementType = [
    { id: 1, name: 'CY-CFS' },
    { id: 2, name: 'CFS-FO' },
    { id: 3, name: 'CFS-CY' },
    { id: 4, name: 'CFS-CFS' },
    { id: 5, name: 'FO-FI' },
    { id: 6, name: 'Door-Door' },
    { id: 7, name: 'CY-Door' },
    { id: 8, name: 'CY-FO' },
  ];

  modeOfReleaseType = [
    { id: 1, name: 'Original' },
    { id: 2, name: 'Sea Way BL' },
    { id: 3, name: 'Express' },
    { id: 4, name: 'Draft' },
  ];

  tabs = [
  { name: 'Shipment', icon: 'fas fa-ship' },
  { name: 'Cargo', icon: 'fas fa-boxes' },
  { name: 'Others', icon: 'fas fa-ellipsis-h' },
  { name: 'CRO', icon: 'fas fa-file-export' },
  { name: 'Connection', icon: 'fas fa-link' },
  { name: 'Rate', icon: 'fas fa-rupee-sign' },
  { name: 'Milestone', icon: 'fas fa-flag-checkered' },
  { name: 'AR/AP', icon: 'fas fa-file-alt' },
];

get visibleTabs() {
  return this.tabs.filter(tab => {
    if (tab.name === 'CRO' && this.selectedDepartmentType === 'AIR') {
      return false;
    }
    return true;
  });
}
  dataFromQuotation: any
  // Mail content
 departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT
  incoLookupConfig = DROPDOWN_CONFIGS.INCO;
  containerTypeLookupConfig = DROPDOWN_CONFIGS.CONTAINER_TYPE;
  uomLookupConfig = DROPDOWN_CONFIGS.UOM;
  imcoLookupConfig = DROPDOWN_CONFIGS.IMCO;
  vesselVoyageConfig = DROPDOWN_CONFIGS.VESSEL_VOYAGE;
  userLookupConfig = DROPDOWN_CONFIGS.USER;


  /**
    |--------------------------------------------------
    |   Section-2 : Constructor Part
    |--------------------------------------------------
  */
  constructor(
    private router: Router,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private operationService: OperationService,
    private currentRoute: ActivatedRoute,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private calendar: NgbCalendar,
    private exportExcelService: ExcelExportService,
    private datePipe: CustomDatePipe,
    private spinner: NgxSpinnerService,
    private leadService: LeadService,
    public dropdownStore: DropdownStore,
    private pdfService:PdfDownloadService,
    private pdfMakeService: PdfMakeService,
    private commonService: CommonService,
    public mps: MenuPermissionService,
    public logoService : LogoService,
    private barcodeService: BarcodeService,
    private volumetricAndCbmCalculationService: VolumetricAndCbmCalculationService,
    private sidebarService : VerticalSidebarService,
    private commonModalService : ModalService,
    private toastr: ToastrService,
    private emailTriggerService: EmailTriggerService,
    private creditValidationApiService: CreditValidationApiService
  ) {
    this.today = this.calendar.getToday();
    // const nav = this.router.getCurrentNavigation();
    // console.log(nav)
    // this.dataFromQuotation = nav?.extras?.state?.['dataFromQuotation'] ?? {};
  }

  copyDocumentNumber(controlName: string, label: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const documentNo = this.bookingForm?.get(controlName)?.value;
    if (!documentNo) {
      return;
    }
    navigator.clipboard.writeText(String(documentNo)).then(() => {
      this.toastr.success(`${label} copied to clipboard.`, '', { timeOut: 1500 });
    });
  }

  copyQuotationNumber(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.quotationNumber) {
      return;
    }
    navigator.clipboard.writeText(String(this.quotationNumber)).then(() => {
      this.toastr.success('Quotation No copied to clipboard.', '', { timeOut: 1500 });
    });
  }

  /**
    |--------------------------------------------------
    |   Section-3 : NgOnInit Part
    |--------------------------------------------------
    */
  // ngOnInit(): void {
  //   this.userData = this.appSettingService.getDecryptedUserProfile();
  //   this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  //   this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  //   this.filterOption = {
  //     CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
  //     BranchMasterSid: this.currentCompany?.BranchMasterSid,
  //   }

  //   this.initBookingForm();
  //   this.initCargoForm();
  //   this.initOtherForm();
  //   this.initDetailsForm();

  //   const historyState = history?.state;
  //   const quotationData = historyState?.dataFromQuotation;

  //   if (quotationData && quotationData.quotation) {
  //     this.dataFromQuotation = quotationData;
  //     history.replaceState({}, '', location.pathname);
  //   } else {
  //     this.dataFromQuotation = {};
  //   }
  //   console.log(this.dataFromQuotation,'dataFromQuotation')
  //   this.loadHeaderLookups().pipe(
  //   ).subscribe(() => {
  //     setTimeout(()=>{
  //       this.loadCargoLookups();
  //     this.loadOtherLookups();
  //     if(this.dataFromQuotation?.quotation){
  //       this.patchBookingFromQuotation(this.dataFromQuotation)
  //       this.minDate = this.today;
  //     }else{
  //     // this.leadService.clearBookingData()
  //       this.currentRoute.paramMap.subscribe((param) => {
  //         this.BookingHeaderSid = +param.get('id');
  //         if (this.BookingHeaderSid) {
  //           this.isEditMode = true;
  //           this.loadBookingById(this.BookingHeaderSid);
  //         } else {
  //           this.minDate = this.today;
  //         }
  //       })
  //     }
  //     },1000)
  //   });


  // }

  ngOnInit(): void {
    this.costRevenueAccess = this.appSettingService.getCostRevenueAccess();
    this.userData = this.appSettingService.getDecryptedUserProfile();
    if (this.userData) {
    }
    const fy = this.appSettingService.getCurrentFinancialYear();
        if (fy) {
          this.fyMinDate = toNgbDateStruct(fy.StartDate);
          const fyEnd = new Date(fy.EndDate);
          const today = getDefaultTodayDate();
          this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
        }
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = Number(sessionStorage.getItem('currentMenuId'));
    this.mps.init().subscribe();
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    this.currentCompany = (
      (this.userData.userCompanyMaster || [])
        .find(ucm => ucm.CompanyMasterSid === currentCompanyId)?.companyMaster
    );

    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid
    };

     this.website = this.userData?.userCompanyMaster?.[0]?.companyMaster?.webSite || null;

    this.loadTermsAndConditionsConfig();
    this.loadCreditRequestCheckingConfig();
    this.initBookingForm();
    this.initCargoForm();
    this.initOtherForm();
    this.initCroForm();
    this.initDetailsForm();
    this.addBookingCargo(undefined, true);
    this.onShipmentTypeChange();


    const historyState = history?.state;
    const quotationData = historyState?.dataFromQuotation;
    this.dataFromQuotation = quotationData?.quotation ? quotationData : {};

    const copiedBookingData = historyState?.copiedBookingData;
    const isCopiedBooking = historyState?.isCopiedBooking;

    if (quotationData?.quotation) {
      history.replaceState({}, '', location.pathname);
    }

    this.getCurrentCompanyBranches();


    this.spinner.show();
    this.loadHeaderMandatoryParts().subscribe(() => {
      this.loadHeaderLookups().subscribe();
      
      if (isCopiedBooking && copiedBookingData) {
      
      // Clear navigation state to prevent re-patching on refresh
      history.replaceState({}, '', location.pathname);
      
      // Patch the copied data after a short delay to ensure lookups are loaded
      setTimeout(() => {
        this.patchValues(copiedBookingData);
        this.minDate = this.today;
        this.appSettingService.showSuccess('Booking copied successfully. Please review and save.');
        this.isDirty = true;
        this.bookingForm.markAsDirty();
        this.spinner.hide();
      }, 1000);
      
    } else if (this.dataFromQuotation?.quotation) {
        this.patchValues(this.dataFromQuotation);
        this.minDate = this.today;
      } else {
        
        this.currentRoute.paramMap.subscribe((param) => {
          this.BookingHeaderSid = +param.get('id');
          if (this.BookingHeaderSid) {
            this.isEditMode = true;
            this.loadBookingById(this.BookingHeaderSid);
          } else {
            this.minDate = this.today;
          }
        });


        this.currentRoute.queryParams.subscribe((queryParams) => {
          if (queryParams['voucherGenerated'] === 'true' && this.BookingHeaderSid) {
            this.loadBookingById(this.BookingHeaderSid);


            this.router.navigate([], {
              relativeTo: this.currentRoute,
              queryParams: {},
              queryParamsHandling: 'merge'
            });
          }
        });
      }

      this.loadCargoLookups();
      this.loadProductLookups();
      this.loadOtherLookups();
      this.captureInitialFormState();
      this.subscribeToFormChanges();

      this.bookingForm.get('IncoTerms')?.valueChanges.subscribe((incoTerm) => {
        this.autoSetFreightTerms(incoTerm);
      });
      this.bookingForm.get('BookingStatus')?.valueChanges.subscribe((status) => {
      this.updateGenerateJobButtonVisibility();
    });
      this.bookingForm.get('Coload')?.valueChanges.subscribe(() => {
      this.updateGenerateJobButtonVisibility();
    });
      this.otherForm.get('Coloader')?.valueChanges.subscribe(() => {
      this.updateGenerateJobButtonVisibility();
    });

      this.spinner.hide();
    });
    this.bookingForm.get('CarrierName')?.valueChanges.subscribe((carrierName) => {
  if (this.selectedDepartmentType === "AIR") {
    // Find the full carrier object from carrierList
    const selectedCarrier = this.carrierList.find(c => c.CustomerName === carrierName);
    this.onCarrierChangeForAir(selectedCarrier);
  }
});


    
  }
  

  private updateGenerateJobButtonVisibility(): void {
   const deptType = this.selectedDepartmentType?.toUpperCase();
  const segment = this.selectedFCLLCL?.toUpperCase(); // FCL / LCL / AIR

  // ✅ Allowed Departments
  const isSeaFCL = deptType === 'SEA' && segment === 'FCL';
  const isSeaLclCoload = deptType === 'SEA' && segment === 'LCL' && this.b['Coload']?.value && this.o['Coloader']?.value;
  const isAir = deptType === 'AIR';
  const isRoadOrTransport = deptType === 'ROAD' || deptType === 'TRANSPORT';

  const isAllowed = isSeaFCL || isSeaLclCoload || isAir || isRoadOrTransport;
  const isStuffedStatus = this.b['BookingStatus']?.value === 'Stuffed';
  
  this.showGenerateJobButton = isAllowed  && !isStuffedStatus;
}

  ngAfterViewInit(): void {
    if (!this.isEditMode) {
      this.departmentLookup.focus();
    }
  }

  private loadTermsAndConditionsConfig(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.isTermsAndConditionsEnabled = true;
      return;
    }

    this.masterService.getConfigurationValue(companyId, 'TermsandConditions').subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        this.isTermsAndConditionsEnabled = this.parseConfigBoolean(rawValue, true);
      },
      error: () => {
        // Default to enabled if config fetch fails
        this.isTermsAndConditionsEnabled = true;
      }
    });
  }

  private loadCreditRequestCheckingConfig(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.isCreditRequestCheckingEnabled = false;
      return;
    }

    this.masterService.getConfigurationValue(companyId, 'CreditRequestChecking').subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        this.isCreditRequestCheckingEnabled = this.parseConfigBoolean(rawValue, false);
      },
      error: () => {
        this.isCreditRequestCheckingEnabled = false;
      }
    });
  }

  private parseConfigBoolean(value: any, defaultValue: boolean): boolean {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return defaultValue;
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
    if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
    return defaultValue;
  }

  @HostListener('window:beforeunload', ['$event'])
unloadNotification($event: BeforeUnloadEvent): void {
  if (this.hasUnsavedChanges()) {
    $event.preventDefault();
    $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  }
}

hasUnsavedChanges(): boolean {
  return this.isDirty && !this.isSaving;
}

async saveChanges(): Promise<boolean> {
  return new Promise((resolve) => {
    this.onSubmit(resolve);
  });
}

subscribeToFormChanges() {
  if (this.hasSubscribedToFormChanges) {
    return;
  }
  this.hasSubscribedToFormChanges = true;

  // Subscribe to booking form changes
  this.bookingForm.valueChanges
    .pipe(takeUntil(this.destroy$), debounceTime(300))
    .subscribe(() => {
      this.isDirty = !this.deepEqual(
        this.initialFormValue,
        this.getCurrentFormState()
      );
    });

  // Subscribe to cargo form changes
  this.cargoForm.valueChanges
    .pipe(takeUntil(this.destroy$), debounceTime(300))
    .subscribe(() => {
      this.isDirty = !this.deepEqual(
        this.initialFormValue,
        this.getCurrentFormState()
      );
    });

  // Subscribe to other form changes
  this.otherForm.valueChanges
    .pipe(takeUntil(this.destroy$), debounceTime(300))
    .subscribe(() => {
      this.isDirty = !this.deepEqual(
        this.initialFormValue,
        this.getCurrentFormState()
      );
    });

  // Subscribe to CRO form changes
  this.croForm.valueChanges
    .pipe(takeUntil(this.destroy$), debounceTime(300))
    .subscribe(() => {
      this.isDirty = !this.deepEqual(
        this.initialFormValue,
        this.getCurrentFormState()
      );
    });

  // Subscribe to detail form changes
  this.detailForm.valueChanges
    .pipe(takeUntil(this.destroy$), debounceTime(300))
    .subscribe(() => {
      this.isDirty = !this.deepEqual(
        this.initialFormValue,
        this.getCurrentFormState()
      );
    });
}


  getCurrentCompanyBranches() {
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    const currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === currentCompanyId).companyMaster);
    this.currentCompanyBranches = (currentCompany?.userBranchMaster || []).map(ubm => ubm.branchMaster);
  }


  isFormDirty(): boolean {
  return this.isDirty;
}
  /**
  |--------------------------------------------------
  |   Section-4 : Main Functions
  |--------------------------------------------------
  */
  loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
        }

        this.spinner.hide();
      },
      error: (error) => {
        console.error("Failed to load city:", error);
        this.spinner.hide();
      }
    });
  }


  // Header Form Initialization
  initBookingForm() {
    const today = getDefaultTodayDate();
    const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultBookingDate = fyDefault && ( today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;
    this.bookingForm = this.fb.group({
      BookingNo: [{ value: '', disabled: true }],
      BookingDateTime: [defaultBookingDate, [Validators.required]],
      DepartmentMasterSid: [null, [Validators.required]],
      CustomerMasterSid: [null, [Validators.required]],
      CustomerBranchSid: [''],
      CustomerName: [''],
      CustomerAddress: [null, [Validators.required]],
      SalesmanSid: [null],
      isShipperFreeText: [false],
      ShipperName: [null, [Validators.required]],
      ShipperAddress: ['', [Validators.required]],
      isConsigneeFreeText: [false],
      ConsigneeName: [null],
      ConsigneeAddress: [null],
      isNotifyFreeText: [false],
      Notify: [null],
      NotifyAddress: [''],
      DestinationAgent: [null],
      AgentAddress: [''],
      isCarrierFreeText: [false],
      CarrierName: [null],
      QuotationHeaderSid: [{ value: '', disabled: true }],
      HBLNo: [{ value: '', disabled: true }],
      HouseJobSid:[null],
      MBLNo: [{ value: '', disabled: true }],
      MBLDate: [{ value: '', disabled: true }],
      status: ['Active'],

      VesselName: [null],
      isVesselFreeText: [false],
      isVoyageFreeText: [false],
      VoyageMasterSid: [null],
      JobType: [{ value: '', disabled: false }],
      VoyageNo: [ null],
      ETA: [null],
      ETD: [null],
      PortCutoffDate: [null],
      POO: [null],
      POL: [null, [Validators.required]],
      POD: [null, [Validators.required]],
      POLTerminal: [''],
      PODTerminal: [''],
      FPD: [null],
      MovementType: [null],
      DoValid: [{ value: '', disabled: true }],
      FreightTerms: [null],
      Coload: [false],
      ShipmentType: [false],
      IncoTerms: [null, [Validators.required]],
      InternalNote: [''],
      GeneralNote: [''],
      NominatedBy: ['Self'],
      BookingStatus: ['Booked'],
      ShipmentNo: ['']
    })
    this.bookingForm.valueChanges.subscribe(() => {
      this.syncFormValueWithRateComponent();
    })
  }

  onETDDateSelect(): void {
    const etaControl = this.bookingForm.get('ETA');
    if (etaControl?.value) {
      etaControl.setValue(null);
    }
  }

  toggleInputType(mainCtrl: string, flagCtrl, event: MouseEvent): void {
    event.stopPropagation(); // Prevents click from opening ng-select dropdown
    // this.isShipperOther = !this.isShipperOther;
    const value = this.b[flagCtrl]?.value;
    this.b[flagCtrl]?.setValue(!value);
    this.bookingForm.get(mainCtrl)?.reset();
  }

  onShipperSelected(selected: any): void {
    this.bookingForm.get('ShipperName')?.setValue(selected);
  }


  // Cargo Form Initiation
  initCargoForm() {
    this.cargoForm = this.fb.group({
      BookingCargoSid: [null],
      CargoType: ['General'],
      ContainerType: [null],
      NoofContainers: [1],
      GrossWeight: [''],
      NetWeight: [''],
      Volume: [''],
      Volumetric: [''],
      ChargeableWeight: [''],
      NoOfPackage: [''],
      ShipmentTerms: [null],
      MovementType: [null],
      FreightTerms: [null],
      ModeOfTransport: [null],
      StuffingAt: ['Dock']
    });
    this.setupCargoCalculationSubscriptions();
}
  private setupCargoCalculationSubscriptions(): void {
  this.cargoForm.get('GrossWeight')?.valueChanges.subscribe(() => {
    if (!this.isPatching && !this.chargeableWeightManualOverride) {
      this.setOrResetWeightError(this.cargoForm);
      this.calculateChargeableWeight();
    }
  });
  
  this.cargoForm.get('NetWeight')?.valueChanges.subscribe(() => {
    if (!this.isPatching && !this.chargeableWeightManualOverride)  {
      this.setOrResetWeightError(this.cargoForm);
    }
  });
  
  this.cargoForm.get('Volume')?.valueChanges.subscribe(() => {
    if (!this.isPatching && !this.chargeableWeightManualOverride) {
      this.calculateChargeableWeight();
    }
  });
  
  this.cargoForm.get('Volumetric')?.valueChanges.subscribe(() => {
    if (!this.isPatching && !this.chargeableWeightManualOverride) {
      this.calculateChargeableWeight();
    }
  });
  
  this.cargoForm.valueChanges.subscribe(() => {
     if (!this.isPatching) {
    this.syncFormValueWithRateComponent();
     }
  });
}
  // Product Form Initialization
  initProductForm() {
    const isIndianCompany = this.countryOfCompany === 'india';
    const isDimensionalCargo = this.usesDimensionalCargoFields();
    this.productForm = this.fb.group({
      BookingProductSid: [null],
      ProductName: [null,[Validators.required]],
      isProductFreeText: [false],
      ShippingBillNo: [''],
      ShippingBillDate: [null],
      ExternaPkg: [null, [Validators.required]],
      ExternlQty: ['', [Validators.required]],
      GrossWeight: ['', [Validators.required,Validators.min(0.001)]],
      NetWeight: ['', [Validators.min(0)]],
      Volumetric: ['',isDimensionalCargo ? [Validators.required] : []],
      Volume: ['',
        this.isSurfaceCargoMode() ? [] : [Validators.required,Validators.min(0.001)]
      ],
      IsHaz: [false],
      ImcoClass: [null],
      UnNo: [''],
      PkgGroup: [''],
      Length: [''],
      Width: [''],
      Height: [''],
      UomMasterSid: [2,isDimensionalCargo ? [Validators.required] : []],
      CargoRecDate: [null]
    });
    this.productForm.get('GrossWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(this.productForm);
    });
    this.productForm.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(this.productForm);
    });
    this.setupImmediateCBMCalculation();
    this.setupImmediateVolumetricCalculation(this.productForm)
  }

 private calculateChargeableWeight(cargoGroup: FormGroup = this.cargoForm): void {
  // During patching, don't recalculate - use the patched value
  if (this.isPatching) {
    return;
  }
  
  if (this.chargeableWeightManualOverride) {
    return;
  }

  if (this.isSurfaceCargoMode()) {
    return;
  }
  
   const volumetric = Number(cargoGroup.get('Volumetric')?.value) || 0;
   const volume = Number(cargoGroup.get('Volume')?.value) || 0;
   const grossWeight = Number(cargoGroup.get('GrossWeight')?.value) || 0;
  
  let chargeableWeight = 0;
  
  // Chargeable Weight is the greater of Volumetric/Volume or Gross Weight
  if (this.selectedFCLLCL === 'AIR' || this.selectedFCLLCL === 'LCL') {
    chargeableWeight = Math.max(volumetric, grossWeight);
  } else {
    chargeableWeight = Math.max(volume, grossWeight);
  }
  
  // Only update if different from current value
   const currentValue = Number(cargoGroup.get('ChargeableWeight')?.value) || 0;
   if (Math.abs(chargeableWeight - currentValue) > 0.001) {
    cargoGroup.get('ChargeableWeight')?.setValue(
      chargeableWeight > 0 ? Number(chargeableWeight.toFixed(this.decimalAfterPrecision)) : '',
      { emitEvent: false }
    );
   }
 }


private setupImmediateCBMCalculation() {
  const dimensionFields = ['ExternlQty', 'Length', 'Width', 'Height', 'UomMasterSid'];
  
  dimensionFields.forEach(field => {
    this.productForm.get(field)?.valueChanges.subscribe(() => {
      if (this.isPatching) {
        return;
      }
      // Calculate immediately on every change
      this.calculateCBM();
    });
  });
}

private calculateCBM() {
  if (this.selectedFCLLCL !== 'LCL' && this.selectedFCLLCL !== 'AIR') {
    return;
  }

  if (this.isProductFieldManuallyManaged(this.productForm, 'Volume')) {
    return;
  }

  const externlQty = this.parseFloatSafe(this.productForm.get('ExternlQty')?.value);
  const length = this.parseFloatSafe(this.productForm.get('Length')?.value);
  const width = this.parseFloatSafe(this.productForm.get('Width')?.value);
  const height = this.parseFloatSafe(this.productForm.get('Height')?.value);
  const uomMasterSid = this.productForm.get('UomMasterSid')?.value;
  
  // Calculate only when the full dimensional inputs are present.
  if (externlQty > 0 && length > 0 && width > 0 && height > 0 && uomMasterSid) {
    // const cbm = this.volumetricAndCbmCalculationService.calculateCBM(externlQty, length, width, height, uomMasterSid);
    let cbm = this.volumetricAndCbmCalculationService.calculateCBM(
      externlQty, length, width, height, uomMasterSid, this.digitsAfterDecimal
    );
    
    // Update the Volume field immediately
    const calculatedValue = cbm > 0 ? cbm : '';
    this.productForm.get('Volume')?.setValue(calculatedValue, { emitEvent: false });
  } else {
    // Clear if incomplete data
    this.productForm.get('Volume')?.setValue('', { emitEvent: false });
  }
}

// Helper method to safely parse float values
private parseFloatSafe(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

private setupImmediateVolumetricCalculation(productForm: FormGroup): void {
  const calculateVolumetric = () => {
     if (this.isPatching) {
      return;
    }
    if (this.isProductFieldManuallyManaged(productForm, 'Volumetric')) {
      return;
    }
    const externlQty = Number(productForm.get('ExternlQty')?.value) || 0;
    const length = Number(productForm.get('Length')?.value) || 0;
    const width = Number(productForm.get('Width')?.value) || 0;
    const height = Number(productForm.get('Height')?.value) || 0;
    const uomMasterSid = productForm.get('UomMasterSid')?.value;
    
    // Calculate only when the full dimensional set is available.
    if (externlQty > 0 && length > 0 && width > 0 && height > 0 && uomMasterSid) {
      let volumetric = this.volumetricAndCbmCalculationService.calculateVolumetric(
        externlQty, length, width, height, uomMasterSid, 
        this.selectedFCLLCL as 'LCL' | 'AIR', 
        this.digitsAfterDecimal
      );
      
      // Update volumetric field
      if (volumetric > 0) {
        productForm.get('Volumetric')?.setValue(volumetric, 
          { emitEvent: false }
        );
      } else {
        productForm.get('Volumetric')?.setValue('', { emitEvent: false });
      }
    } else {
      productForm.get('Volumetric')?.setValue('', { emitEvent: false });
    }
  };

  // Listen to input events for immediate calculation
  const dimensions = ['ExternlQty', 'Length', 'Width', 'Height', 'UomMasterSid'];
  
  dimensions.forEach(field => {
    productForm.get(field)?.valueChanges.subscribe(() => {
      calculateVolumetric();
    });
  });
}

  initOtherForm() {
    this.otherForm = this.fb.group({
      BookingOthersSid: [null],
      CustomerRefNo: [''],
      YardCFS: [''],
      ReleaseType: ['Original'],
      HBLNo: [{ value: '', disabled: true }],
      Forwarder: [null],
      ForwarderAddress: [''],
      NotifyParty: [null],
      NotifyPartyAddress: [''],
      OriginAgent:[null],
      OriginAgentAddress: [''],
      Notify2: [null],
      NotifyAddress2: [''],
      Coloader: [null],
      PickupPlace: [''],
      DeliveryPlace: [''],
      DeliveryDate: [''],
      CHAName: [''],
      PickupAddress: [''],
      DeliveryAddress: [''],
      CargoCurrency: [''],
      CargoValue: [''],
      SwitchBL: [false],
      BacktoBack: [false],
      Depo: [''],
      ROValidity: [''],
      SwitchBLAgent: [null],
      AgentAddress: [''],
      SwitchBLShipper: [null],
      SwitchBLConsignee: [null],
      SwitchLocation: [''],
      CarrierBookingRef: [''],
      CarrierBookingDate: ['']
    })
  }
  initCroForm() {
  this.croForm = this.fb.group({
    BookingCroSid: [null],
    OnHireRef: [''],
    ReleaseOrderDate: [null],
    ValidityDate: [null],
    Transporter: [''],
    EmptyYard: [''],
    NoteToYard: [''],
    NoteToShipper: ['']
  })
}

  initDetailsForm() {
    this.detailForm = this.fb.group({
      bookingCargo: this.fb.array([]),
      bookingProducts: this.fb.array([]),
    })
  }

  /**
   *  Get form Control
  */

  get b(): { [key: string]: AbstractControl<any, any> } {
    return this.bookingForm.controls || {}
  }
  get c(): { [key: string]: AbstractControl<any, any> } {
    return this.cargoForm.controls || {}
  }
  get o(): { [key: string]: AbstractControl<any, any> } {
    return this.otherForm.controls || {}
  }


  get bookingProducts(): FormArray {
    return this.detailForm.get('bookingProducts') as FormArray;
  }
  get bookingCargo(): FormArray {
    return this.detailForm.get('bookingCargo') as FormArray;
  }
  get bookingConnections(): FormArray {
    return this.detailForm.get('bookingConnections') as FormArray;
  }
  get bookingRates(): FormArray {
    return this.detailForm.get('bookingRates') as FormArray;
  }
  get milestones(): FormArray {
    return this.detailForm.get('milestones') as FormArray;
  }

  /**
   *    Create FormArray elements
   */

  createBookingProductGroup(data?: any, isPatching: boolean = false): FormGroup {
    const isDimensionalCargo = this.usesDimensionalCargoFields();
    const isHaz = this.isHazardous(data?.IsHaz);
    const productForm = this.fb.group({
      BookingProductSid: [data?.BookingProductSid || null],
      BookingCargoSid: [data?.BookingCargoSid || null],
      ProductName: [data?.ProductName || null,[Validators.required]],
      isProductFreeText: [data?.isProductFreeText || false],
      ShippingBillNo: [data?.ShippingBillNo || ''],
      ShippingBillDate: [data?.ShippingBillDate ? new Date(data?.ShippingBillDate) : null],
      ExternaPkg: [this.resolvePackageTypeSid(
        data?.ExternaPkg ??
        data?.ExternalPkg ??
        data?.PackageTypeId ??
        data?.ProductUnit ??
        data?.PackageType
      ), [Validators.required]],
      ExternlQty: [data?.ExternlQty || '', [Validators.required]],
      GrossWeight: [Number(data?.GrossWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required,Validators.min(0.001)]],
      NetWeight: [Number(data?.NetWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.min(0)]],
      Volume: [
        Number(data?.Volume || '').toFixed(this.digitsAfterDecimal) || '',
        this.isSurfaceCargoMode() ? [] : [Validators.required,Validators.min(0.001)]
      ],
      IsHaz: [isHaz],
      ImcoClass: [{ value: data?.ImcoClass || null, disabled: !isHaz }],
      UnNo: [{ value: data?.UnNo || '', disabled: !isHaz }],
      PkgGroup: [{ value: data?.PkgGroup || '', disabled: !isHaz }],
      Length: [data?.Length || ''],
      Width: [data?.Width || ''],
      Height: [data?.Height || ''],
      Volumetric: [data?.Volumetric|| '',isDimensionalCargo ? [Validators.required] : []],
      UomMasterSid: [data?.UomMasterSid || 2,isDimensionalCargo ? [Validators.required] : []],
      CargoRecDate: [data?.CargoRecDate ? new Date(data?.CargoRecDate) : null]
    });
    productForm.get('GrossWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(productForm);
    });
    productForm.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(productForm);
    });
    // Always attach subscriptions so patched rows can recalculate on later edits.
    // The subscription itself already skips while `isPatching` is true.
    this.setupProductCalculationSubscriptions(productForm);
      // Check if department is LCL or AIR
  const isLCLorAIR = this.usesDimensionalCargoFields();
  
  if (isLCLorAIR) {
    // Always setup calculations for LCL/AIR
    this.setupProductFormImmediateCalculation(productForm);
    // this.setupImmediateVolumetricCalculationForFormArray(productForm);
    
    // If we have data with volume, trigger calculation AFTER form is stable
    // This allows the patched value to be set first, then calculations take over
    if (data && (data.Length || data.Width || data.Height)) {
      setTimeout(() => {
        // Trigger calculation by emitting a change event
        productForm.get('UomMasterSid')?.updateValueAndValidity({ emitEvent: true });
      }, 100);
    }
  }
    if (data?.CargoRecDate) {
      ['ExternlQty', 'NetWeight', 'Volume'].forEach(field => {
        productForm.get(field)?.disable();
      })
    }
    productForm.get('CargoRecDate')?.valueChanges.subscribe(value => {
  if (value) {

    const volume = productForm.get('Volume')?.value;
    const netWeight = productForm.get('NetWeight')?.value;
    const qty = productForm.get('ExternlQty')?.value;

    ['ExternlQty','NetWeight','Volume'].forEach(field => {
      productForm.get(field)?.disable({ emitEvent: false });
    });

    // Restore values after disable
    productForm.patchValue({
      Volume: volume,
      NetWeight: netWeight,
      ExternlQty: qty
      }, { emitEvent: false });
  }

  // Keep BookingStatus aligned with cargo receipt dates while editing.
  this.syncBookingStatusFromCargoDates();
});

    return productForm;
  }
  private setupProductCalculationSubscriptions(productForm: FormGroup): void {
  const dimensionFields = ['ExternlQty', 'Length', 'Width', 'Height', 'UomMasterSid'];

  dimensionFields.forEach(field => {
    productForm.get(field)?.valueChanges.subscribe(() => {
      if (this.isPatching) {
        return;
      }
      this.calculateProductFormCBMAndVolumetric(productForm);
    });
  });

  ['GrossWeight', 'NetWeight', 'Volume', 'Volumetric'].forEach(field => {
    productForm.get(field)?.valueChanges.subscribe(() => {
      if (this.isPatching) {
        return;
      }
      if (field === 'Volume' || field === 'Volumetric') {
        this.markProductFieldManualOverride(productForm, field as 'Volume' | 'Volumetric');
      }
      const targetCargoIndex = this.getCargoIndexForProductForm(productForm);
      this.handleProductRelatedCalculation(targetCargoIndex);
    });
  });
}

private getProductCalculationOverrideState(productForm: FormGroup): { volumeManual: boolean; volumetricManual: boolean } {
  let state = this.productCalculationOverrides.get(productForm);
  if (!state) {
    state = { volumeManual: false, volumetricManual: false };
    this.productCalculationOverrides.set(productForm, state);
  }
  return state;
}

private markProductFieldManualOverride(productForm: FormGroup, field: 'Volume' | 'Volumetric'): void {
  const state = this.getProductCalculationOverrideState(productForm);
  const value = productForm.get(field)?.value;
  const isManual = value !== null && value !== undefined && value !== '';

  if (field === 'Volume') {
    state.volumeManual = isManual;
  } else {
    state.volumetricManual = isManual;
  }
}

private isProductFieldManuallyManaged(productForm: FormGroup, field: 'Volume' | 'Volumetric'): boolean {
  const state = this.getProductCalculationOverrideState(productForm);
  return field === 'Volume' ? state.volumeManual : state.volumetricManual;
}

private resolvePackageTypeSid(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue) && String(value).trim() !== '') {
    return numericValue;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  const matchedPackage = (this.packageTypeList || []).find(type =>
    String(type?.UOMCode || '').trim().toLowerCase() === normalizedValue ||
    String(type?.UOMName || '').trim().toLowerCase() === normalizedValue
  );

  return matchedPackage?.UOMMasterSid || null;
}

private isHazardous(value: any): boolean {
  return value === true || value === 'Y' || value === 'y' || value === 1 || value === '1';
}

getPackageTypeCode(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const resolvedId = this.resolvePackageTypeSid(value);
  if (resolvedId !== null) {
    const packageType = (this.packageTypeList || []).find(
      (type: any) => type?.UOMMasterSid === resolvedId
    );
    if (packageType?.UOMCode) {
      return packageType.UOMCode;
    }
  }

  return String(value);
}


  private setupProductFormImmediateCalculation(productForm: FormGroup) {
  const dimensionFields = ['ExternlQty', 'Length', 'Width', 'Height', 'UomMasterSid'];
  
  dimensionFields.forEach(field => {
    productForm.get(field)?.valueChanges.subscribe(() => {
      if (!this.isPatching) {
        this.calculateProductFormCBMAndVolumetric(productForm);
      }
    });
  });
}

private calculateProductFormCBMAndVolumetric(productForm: FormGroup) {
  if(this.isPatching){
    return;
  }
  if (!this.usesDimensionalCargoFields()) {
    return;
  }
  const volumeManuallyManaged = this.isProductFieldManuallyManaged(productForm, 'Volume');
  const volumetricManuallyManaged = this.isProductFieldManuallyManaged(productForm, 'Volumetric');
  const externlQty = this.parseFloatSafe(productForm.get('ExternlQty')?.value);
  const length = this.parseFloatSafe(productForm.get('Length')?.value);
  const width = this.parseFloatSafe(productForm.get('Width')?.value);
  const height = this.parseFloatSafe(productForm.get('Height')?.value);
  const uomMasterSid = productForm.get('UomMasterSid')?.value;

  // Calculate both CBM and Volumetric when UOM or dimensions change
  if (externlQty > 0 && length > 0 && width > 0 && height > 0 && uomMasterSid) {
    const { cbm, volumetric } = this.volumetricAndCbmCalculationService.calculateCBMAndVolumetric(
      externlQty, length, width, height, uomMasterSid,
      this.selectedFCLLCL as 'LCL' | 'AIR',
      this.digitsAfterDecimal
    );
    
    // Update both fields
    if (!volumeManuallyManaged) {
      productForm.get('Volume')?.setValue(cbm > 0 ? cbm : '', { emitEvent: false });
    }
    if (!volumetricManuallyManaged) {
      productForm.get('Volumetric')?.setValue(volumetric > 0 ? volumetric : '', { emitEvent: false });
    }
    
     // Update the cargo row that owns this product.
     setTimeout(() => {
      this.handleProductRelatedCalculation(this.getCargoIndexForProductForm(productForm));
     }, 100);
  } else {
    if (!volumeManuallyManaged) {
      productForm.get('Volume')?.setValue('', { emitEvent: false });
    }
    if (!volumetricManuallyManaged) {
      productForm.get('Volumetric')?.setValue('', { emitEvent: false });
    }
  }
}

private setupImmediateVolumetricCalculationForFormArray(productForm: FormGroup): void {
  const calculateVolumetric = () => {
    const externlQty = Number(productForm.get('ExternlQty')?.value) || 0;
    const length = Number(productForm.get('Length')?.value) || 0;
    const width = Number(productForm.get('Width')?.value) || 0;
    const height = Number(productForm.get('Height')?.value) || 0;
    const uomMasterSid = productForm.get('UomMasterSid')?.value;
    
    if (externlQty > 0 && (length > 0 || width > 0 || height > 0) && uomMasterSid) {
      let volumetric = this.volumetricAndCbmCalculationService.calculateVolumetric(
        externlQty, length, width, height, uomMasterSid, 
        this.selectedFCLLCL as 'LCL' | 'AIR', 
        this.digitsAfterDecimal
      );;
      
      if (volumetric > 0) {
        productForm.get('Volumetric')?.setValue(volumetric, 
          { emitEvent: false }
        );
      } else {
        productForm.get('Volumetric')?.setValue('', { emitEvent: false });
      }
    } else {
      productForm.get('Volumetric')?.setValue('', { emitEvent: false });
    }
  };

  const dimensions = ['ExternlQty', 'Length', 'Width', 'Height'];
  
  dimensions.forEach(field => {
    productForm.get(field)?.valueChanges.subscribe(() => {
      calculateVolumetric();
    });
  });
}

  // changeAuthStateBasedOnDate() {
  //   let atLeastOneHasDate = false;
  //   this.bookingProducts.controls.forEach((product: FormGroup, productIndex: number) => {
  //     const productDate = product.get('CargoRecDate')?.value;
  //     if (productDate) {
  //       atLeastOneHasDate = true;
  //     }
  //   })
  //   if (atLeastOneHasDate) {
  //     this.b['CargoRecDate']?.disable();
  //   } else {
  //     this.b['CargoRecDate']?.enable();
  //   }
  // }

  addProduct() {
    const formGroup = this.createBookingProductGroup();
    formGroup.get('UomMasterSid')?.setValue(2, { emitEvent: true });
    this.bookingProducts.push(formGroup);
    this.bookingProducts.updateValueAndValidity({ emitEvent: false });
  }

  createBookingConnectionGroup(data?: any): FormGroup {
    const connectionForm = this.fb.group({
      BookingConnectionSid: [data?.BookingConnectionSid || null],
      VesselName: [data?.VesselName || null],
      VoyageNo: [data?.VoyageNo || null],
      POL: [data?.POL || null],
      POD: [data?.POD || null],
      ETD: [new Date(data?.ETD) || null],
      ETA: [new Date(data?.ETA) || null],
      status: [data.status ? (data.status === "A" ? "Active" : "Suspended") : "Active"]
    })
    return connectionForm;
  }

  /**
   *  Load Lookups
  */
  loadHeaderMandatoryParts() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    return forkJoin({
      departments: this.operationService.getAllDepartments(CompanyMasterSid).pipe(catchError(err => of([]))),
      customers: this.operationService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(err => of([]))),
      ports: this.operationService.getAllPorts().pipe(catchError(err => of([]))),
      userCountry: this.operationService.getCountryById(this.currentCompany.CountryMasterSid).pipe(catchError(err => of({}))),


    }).pipe(tap(({
      departments, customers, ports, userCountry
    }) => {
      if (!this.isEditMode) {
        this.spinner.hide();
      }
      this.departmentList = (departments.data || []).filter((department: any) => !this.isServiceJobDepartment(department));
      this.customerList = customers;
      this.countryOfCompany = String((userCountry?.data?.countryName)).trim().toLowerCase();
      this.portList = (ports.data || []).map(p => ({ ...p, Country: p.countryMaster?.countryName }));
    }))
  }

  loadHeaderLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    return forkJoin({
      shippers: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['shipper'] }).pipe(catchError(err => of([]))),
      consignees: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['consignee'] }).pipe(catchError(err => of([]))),
      notify: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['notify'] }).pipe(catchError(err => of([]))),
      agents: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['vendor', 'transporter', 'agent'] }).pipe(catchError(err => of([]))),
      carriers: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['carrier'] }).pipe(catchError(err => of([]))),
      airline: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['airLine'] }).pipe(catchError(err => of([]))),
      vessels: this.operationService.getAllVessels().pipe(catchError(err => of([]))),
      incos: this.operationService.getAllINCO().pipe(catchError(err => of([]))),
      salesmans: this.operationService.getAllSalesman(CompanyMasterSid).pipe(catchError(err => of([]))),

      forwarder: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['forwarder'] }).pipe(catchError(err => of([]))),
      yard: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['yard'] }).pipe(catchError(err => of([]))),
      cfs: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['cFS'] }).pipe(catchError(err => of([]))),
      mawbStockAllocationConfig: this.masterService.getConfigurationValue(CompanyMasterSid, 'MawbStockAllocation').pipe(catchError(() => of(null))),

    }).pipe(tap(({ shippers, consignees, notify, carriers,airline, vessels, incos, salesmans, agents, forwarder, yard, cfs, mawbStockAllocationConfig }) => {
      this.shipperList = shippers.data;
      this.filteredShipperList = shippers.data;
      this.consigneeList = consignees.data;
      this.filteredConsigneeList = consignees.data;
      this.notifyList = notify.data;
      this.carrierList = carriers.data;
      this.airlineList = airline.data;
      this.cfslist = cfs.data;
      this.vesselList = vessels.data;
      this.incoList = incos.data;
      this.salesmanList = salesmans;
      this.agentList = agents.data;
      this.forwarderList = forwarder.data;
      this.yardlist = yard.data;
      this.isMawbStockAllocationEnabled = this.parseCompanyBoolean(mawbStockAllocationConfig);
      this.updateCarrierValidation(this.selectedDepartment);
      if (this.bookingData) {
        this.evaluateDropdownOrFreeText();
      }
      this.syncFormValueWithRateComponent();
    }))
  }

  private parseCompanyBoolean(value: any): boolean {
    if (value === true || value === false) {
      return value;
    }

    const normalized = String(value ?? '').trim().toUpperCase();
    return ['Y', 'YES', 'TRUE', '1'].includes(normalized);
  }

  private updateCarrierValidation(department?: any): void {
    const carrierControl = this.bookingForm.get('CarrierName');
    if (!carrierControl) {
      return;
    }

    const isAirExport =
      String(department?.departmentType ?? '').toUpperCase() === 'AIR' &&
      String(department?.ExportImport ?? '').toUpperCase() === 'EXPORT';

    if (isAirExport && this.isMawbStockAllocationEnabled) {
      carrierControl.setValidators([Validators.required]);
    } else {
      carrierControl.clearValidators();
    }

    carrierControl.updateValueAndValidity({ emitEvent: false });
  }

  loadCargoLookups() {
    forkJoin({
      containerTypes: this.operationService.getAllContainerTypes().pipe(catchError(err => of({ data: [] }))),
    }).subscribe(({ containerTypes }) => {
      this.containerTypeList = containerTypes.data;
    })
  }

  loadOtherLookups() {
    forkJoin({
      currencies: this.operationService.getAllCurrencies().pipe(
        catchError(() => of({ data: [] }))
      ),
    }).subscribe(({ currencies }) => {
      const rawCurrencies: any[] = Array.isArray(currencies)
        ? currencies
        : currencies?.data || [];
      this.currencyList = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
    });
  }




  loadProductLookups() {
    forkJoin({
      products: this.operationService.getAllProducts().pipe(catchError(err => of([]))),
      packageTypes: this.operationService.getUOMsByType('P').pipe(catchError(err => of([]))),
      imcos: this.operationService.getAllIMCO().pipe(catchError(err => of([]))),
      uoms: this.operationService.getUOMsByType('M').pipe(catchError(err => of([]))),
    }).subscribe(({ products, packageTypes, imcos, uoms }) => {
      this.productList = products.data;
      this.packageTypeList = packageTypes.data;
      this.imcoList = imcos.data;
      this.uomList = uoms.data;
      this.productLookupsLoaded = true;
    })
  }

  loadBookingById(BookingHeaderSid: number,withMilestoneRefresh : boolean = false) {
    this.spinner.show();
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$ = new Subject<void>();
    this.hasSubscribedToFormChanges = false;
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      BookingHeaderSid,
      CompanyMasterSid,
      BranchMasterSid
    };
    this.operationService.getBookingById(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          // this.resetForm();
          this.patchValues(resp.data);
          this.bookingData = resp.data;
          this.minDate = undefined;
          this.spinner.hide();
          this.isSaving = false;
          this.captureInitialFormState();
          if(withMilestoneRefresh){
            this.milestoneComponent.loadShipmentMilestones(resp.data?.ShipmentNo);
          }
          setTimeout(() => {
          this.initialFormValue = this.getCurrentFormState();
          this.isDirty = false;
          this.subscribeToFormChanges();
        }, 500);
        } else {
          this.isSaving = false;
          this.spinner.hide();
          this.appSettingService.showError(resp.message);
        }
      },
      (error) => {
        this.isSaving = false;
        this.spinner.hide();
        this.appSettingService.showError(
      error?.error?.message || 'Access denied.'
    );
      }
    )
  }

  get isSuspended() : boolean {
    return this.bookingData?.status !== 'A';
  }

  get hasHouseJobCreated(): boolean {
    const houseJobSid = this.bookingData?.HouseJobSid ?? this.bookingHeader?.HouseJobSid ?? this.bookingData?.houseJob?.HouseJobSid ?? this.b?.['HouseJobSid']?.getRawValue();
    return houseJobSid !== null && houseJobSid !== undefined && `${houseJobSid}`.trim() !== '';
  }
  
  patchValues(response: any) {
  this.isPatching = true;
  try {
    this.bookingHeader = response;
    const barcodeData = `${response.BookingNo}`;
    if (response.BookingNo) {
      this.barcodeBookingNo = this.barcodeService.convertToBarcode(response.BookingNo);
    }
    
    const hasHBLNo = response.HBLNo && response.HBLNo.trim() !== '' && 
                     response.HBLNo !== null && response.HBLNo !== undefined;
    const hasHouseJobSid = response.HouseJobSid || null;
    const shouldDisableForms = (hasHBLNo || hasHouseJobSid) || (this.isEditMode && response.status !== 'A');

    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectedCustomer = this.customerList.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
    this.onDeptChange(selectedDepartment);
    this.onCustomerChange(selectedCustomer);
    this.evaluateDropdownOrFreeText();
    
    // Patch booking form with emitEvent: false to prevent triggers
    this.bookingForm.patchValue({
      BookingNo: response.BookingNo,
      BookingDateTime: response.BookingDateTime ? new Date(response.BookingDateTime) : null,
      DepartmentMasterSid: response.DepartmentMasterSid,
      CustomerMasterSid: response.CustomerMasterSid,
      CustomerBranchSid: response.CustomerBranchSid,
      CustomerName: response.CustomerName,
      CustomerAddress: response.CustomerAddress,
      SalesmanSid: response.SalesmanSid,
      ShipperName: response.ShipperName,
      ShipperAddress: response.ShipperAddress,
      ConsigneeName: response.ConsigneeName,
      ConsigneeAddress: response.ConsigneeAddress,
      Notify: response.Notify,
      NotifyAddress: response.NotifyAddress,
      DestinationAgent: response.DestinationAgent,
      AgentAddress: response.AgentAddress,
      CarrierName: response.CarrierName,
      QuotationHeaderSid: response.QuotationHeaderSid,
      QuoteRouteSid: response.QuoteRouteSid,
      HBLNo: response.HBLNo,
      HouseJobSid: response.HouseJobSid,
      MBLNo: response.MBLNo,
      MBLDate: response.MBLDate ? new Date(response.MBLDate) : '',
      status: response.status === "A" ? "Active" : "Suspended",
      VesselName: response.VesselName,
      VoyageMasterSid: response.VoyageMasterSid,
      JobType: response.JobType,
      VoyageNo: response.VoyageNo,
      ETA: response.ETA ? new Date(response.ETA) : null,
      ETD: response.ETD ? new Date(response.ETD) : null,
      PortCutoffDate: response.PortCutoffDate ? new Date(response.PortCutoffDate) : null,
      POO: response.POO,
      POL: response.POL,
      POD: response.POD,
      POLTerminal: response.POLTerminal,
      PODTerminal: response.PODTerminal,
      FPD: response.FPD,
      MovementType: response.MovementType,
      DoValid: response.DoValid ? new Date(response.DoValid) : '',
      Coload: response.Coload === "Y" ? true : false,
      ShipmentType: response.ShipmentType === "Y" ? true : false,
      IncoTerms: response.IncoTerms,
      InternalNote: response.InternalNote,
      GeneralNote: response.GeneralNote,
      NominatedBy: response.NominatedBy,
      FreightTerms: response.FreightTerms,
      BookingStatus: response.BookingStatus,
      ShipmentNo: response.ShipmentNo
    });

    this.updateGenerateJobButtonVisibility();

    this.getVesselVoyBasedOnPorts();
    this.b['DepartmentMasterSid']?.disable();
    this.b['CustomerMasterSid']?.disable();
    if (hasHBLNo || hasHouseJobSid) {
      this.b['HBLNo']?.disable();
      this.b['HouseJobSid']?.disable();
    }

    this.quotationNumber = response?.quotationHeader?.QuoteNumber || '';
    this.PODandFPODsame = response.POD === response.FPD;
    this.minStartDate = response.ETA;

    const cargoItems =
      Array.isArray(response?.bookingCargo) && response.bookingCargo.length
        ? response.bookingCargo
        : response?.quoteRoute?.[0]?.quoteCargo?.length
          ? response.quoteRoute[0].quoteCargo
          : [{
            ...(response?.bookingCargo?.[0] || response?.quoteRoute?.[0]?.quoteCargo?.[0] || {})
          }];

    const flatBookingProducts = Array.isArray(response?.bookingProduct) ? response.bookingProduct : [];
    this.bookingCargo.clear();
    this.bookingCargoExpanded = [];

    cargoItems.forEach((cargoData: any, cargoIndex: number) => {
      const cargoGroup = this.createBookingCargoGroup({
        ...cargoData,
        BookingCargoSid: cargoData?.BookingCargoSid,
        CargoType: cargoData?.CargoType || 'General',
        ContainerType: cargoData?.ContainerType,
        NoofContainers: Number(cargoData?.NoofContainers ?? cargoData?.Qty ?? 0) || 0,
        GrossWeight: Number(cargoData?.GrossWeight ?? 0) || 0,
        NetWeight: Number(cargoData?.NetWeight ?? 0) || 0,
        Volume: Number(cargoData?.Volume ?? 0) || 0,
        Volumetric: Number(cargoData?.Volumetric ?? 0) || 0,
        ChargeableWeight: Number(cargoData?.ChargeableWeight ?? 0) || 0,
        NoOfPackage: Number(cargoData?.NoOfPackage ?? cargoData?.PackageQty ?? 0) || 0,
        ShipmentTerms: cargoData?.ShipmentTerms,
        MovementType: cargoData?.MovementType,
        FreightTerms: cargoData?.FreightTerms,
        ModeOfTransport: cargoData?.ModeOfTransport,
        StuffingAt: cargoData?.StuffingAt
      });
      if (response.QuotationHeaderSid) {
    cargoGroup.addControl('isFromQuotation', this.fb.control(true));
  }
      this.bookingCargo.push(cargoGroup);
      this.bookingCargoExpanded.push(cargoIndex === 0);
      const cargoProducts = Array.isArray(cargoData?.bookingProducts)
        ? cargoData.bookingProducts
        : Array.isArray(cargoData?.bookingProduct)
          ? cargoData.bookingProduct
          : Array.isArray(cargoData?.products)
            ? cargoData.products
            : (cargoIndex === 0 ? flatBookingProducts : []);

      cargoProducts.forEach((product: any) => {
        this.addBookingCargoProduct(cargoIndex, product);
      });
    });

    if (this.bookingCargo.length > 0) {
      this.bookingCargoActiveIndex = 0;
      this.cargoForm = this.bookingCargo.at(0) as FormGroup;
    }

    this.selectedFCLLCL = this.resolveSelectedSegment(this.selectedDepartment);
    this.selectedCargoMode = this.resolveCargoMode(this.selectedDepartment);

    if (this.selectedFCLLCL === "LCL" && this.selectedDepartment.ExportImport === "Export") {
      this.cargoForm.get('StuffingAt')?.setValue('Dock', { emitEvent: false });
      this.cargoForm.get('StuffingAt')?.disable();
    } else {
      this.cargoForm.get('StuffingAt')?.enable({emitEvent : false});
    }

    this.selectedDepartmentType === "SEA" ? this.c['ModeOfTransport']?.setValue('Vessel', { emitEvent: false }) : null;
    this.selectedDepartmentType === "AIR" ? this.c['ModeOfTransport']?.setValue('Flight', { emitEvent: false }) : null;
    this.selectedCargoMode === "ROAD" ? this.c['ModeOfTransport']?.setValue('Road', { emitEvent: false }) : null;
    this.handleCFSOrYard();

    // Patch other form
    const otherData = response.bookingOthers?.[0];
    this.otherForm.patchValue({
      BookingOthersSid: otherData?.BookingOthersSid,
      CustomerRefNo: otherData?.CustomerRefNo,
      YardCFS: otherData?.YardCFS,
      ReleaseType: otherData?.ReleaseType || null,
      HBLNo: otherData?.HBLNo || null,
      Forwarder: otherData?.Forwarder || null,
      ForwarderAddress: otherData?.ForwarderAddress,
      NotifyParty: otherData?.NotifyParty || null,
      NotifyPartyAddress: otherData?.NotifyPartyAddress,
      OriginAgent: otherData?.OriginAgent || null,
      OriginAgentAddress: otherData?.OriginAgentAddress,
      Notify2: otherData?.Notify2 || null,
      NotifyAddress2: otherData?.NotifyAddress2,
      Coloader: otherData?.Coloader || null,
      PickupPlace: otherData?.PickupPlace,
      DeliveryPlace: otherData?.DeliveryPlace,
      DeliveryDate: otherData?.DeliveryDate ? new Date(otherData?.DeliveryDate) : null,
      CHAName: otherData?.CHAName,
      PickupAddress: otherData?.PickupAddress,
      DeliveryAddress: otherData?.DeliveryAddress,
      CargoCurrency: otherData?.CargoCurrency,
      CargoValue: otherData?.CargoValue,
      SwitchBL: otherData?.SwitchBL === "Y" ? true : false,
      BacktoBack: otherData?.BacktoBack === "Y" ? true : false,
      Depo: otherData?.Depo,
      ROValidity: otherData?.ROValidity ? new Date(otherData?.ROValidity) : null,
      SwitchBLAgent: otherData?.SwitchBLAgent,
      AgentAddress: otherData?.AgentAddress,
      SwitchBLShipper: otherData?.SwitchBLShipper,
      SwitchBLConsignee: otherData?.SwitchBLConsignee,
      SwitchLocation: otherData?.SwitchLocation,
      CarrierBookingRef: otherData?.CarrierBookingRef,
      CarrierBookingDate: otherData?.CarrierBookingDate ? new Date(otherData?.CarrierBookingDate) : null
    }, { emitEvent: false });
    this.updateGenerateJobButtonVisibility();

    // Patch CRO form
    const croData = response.bookingCro?.[0];
    if (croData) {
      this.croForm.patchValue({
        BookingCroSid: croData.BookingCroSid,
        OnHireRef: croData.OnHireRef,
        ReleaseOrderDate: croData.ReleaseOrderDate ? new Date(croData.ReleaseOrderDate) : null,
        ValidityDate: croData.ValidityDate ? new Date(croData.ValidityDate) : null,
        Transporter: croData.Transporter,
        EmptyYard: croData.EmptyYard,
        NoteToYard: croData.NoteToYard,
        NoteToShipper: croData.NoteToShipper
      }, { emitEvent: false });
    }

    // Clear and repopulate products
    this.bookingProducts.clear();
    const cargoProductsFromResponse = Array.isArray(response.bookingCargo)
      ? response.bookingCargo.flatMap((cargo: any) => cargo?.bookingProducts || cargo?.bookingProduct || cargo?.products || [])
      : [];
    const productsFromResponse =
      response.bookingProduct?.length ? response.bookingProduct :
      cargoProductsFromResponse.length ? cargoProductsFromResponse :
      response.quoteRoute?.[0]?.quoteProducts?.map((product: any) => ({
        ProductName: product.ProductName,
        ExternaPkg: this.resolvePackageTypeSid(
          product.PackageTypeId ??
          product.ExternalPkg ??
          product.ExternaPkg ??
          product.ProductUnit ??
          product.PackageType
        ),
        ExternlQty: product.ExternalQty ?? product.ExternlQty ?? '',
        GrossWeight: product.GrossWeight,
        NetWeight: product.NetWeight,
        Volume: product.Volume,
        Volumetric: product.Volumetric,
        Length: product.Length,
        Width: product.Width,
        Height: product.Height,
        UomMasterSid: product.UomMasterSid ?? product.ProductUnit ?? 2,
        IsHaz: product.IsHaz,
        ImcoClass: product.ImcoClass,
        UnNo: product.UnNo,
        PkgGroup: product.PkgGroup,
        CargoRecDate: product.CargoRecDate
      })) ||
      [];
    this.productDataLength = productsFromResponse.length;
    
    if (this.productDataLength) {
      for (const productData of productsFromResponse) {
        const formWithData = this.createBookingProductGroup(productData, true);
        const productExists = this.productList?.some(
          p => p.ProductName?.trim().toLowerCase() === productData.ProductName?.trim().toLowerCase()
        );
        
        formWithData.get('isProductFreeText')?.setValue(!productExists, { emitEvent: false });
        
        // CRITICAL: Set the API values directly without triggering calculations
        formWithData.patchValue({
          Volume: productData.Volume,
          Volumetric: productData.Volumetric,
          GrossWeight: productData.GrossWeight,
          NetWeight: productData.NetWeight,
          ExternlQty: productData.ExternlQty,
          Length: productData.Length,
          Width: productData.Width,
          Height: productData.Height
        }, { emitEvent: false });
        
        this.bookingProducts.push(formWithData);
      }
      this.updateProductPagination();
    }
    
    if (shouldDisableForms) {
      this.disableAllForms();
      if (this.isEditMode && response.status !== 'A') {
        this.bookingForm.get('status')?.disable();
      }
    }

    // Handle connections, rates, etc.
    this.bookingConnectionsArr = (response.bookingConnection || []).map(connection => {
      return {
        ...connection,
        BookingConnectionSid: connection.BookingConnectionSid,
      }
    });
    this.connectionResult = [...this.bookingConnectionsArr];

    this.bookingRateArr = (response.bookingRates || []).map(br => ({
      ...br,
      RateSid: br.BookingRatesSid,
      RevenueCustomerMasterSid: br.CustomerMasterSid,
      RevenueCustomerBranchSid: br.CustomerBranchSid,
      CostAgentMasterSid: br.AgentMasterSid,
      CostAgentBranchSid: br.AgentBranchSid,
      status: br.status === "A" ? "Active" : "Suspended"
    }));
    this.rateResult = [...this.bookingRateArr];
    if (
      this.isEditMode &&
      this.bookingRateArr?.some(rate =>
        rate.CostVoucherHeaderSid !== null || rate.RevenueVoucherHeaderSid !== null
      )
    ) {
      this.bookingForm.get('status')?.disable();
    }

    const shipmentTypeValue = response.ShipmentType === "Y" ? true : false;
    if (shipmentTypeValue) {
      this.bookingForm.get('NominatedBy')?.setValue('Nomination', { emitEvent: false });
    } else {
      this.bookingForm.get('NominatedBy')?.setValue('Self', { emitEvent: false });
    }

    this.syncFormValueWithRateComponent();
    this.applyTranshipmentRestrictions();
    this.isSaving = false;

  } catch (error) {
    console.error('Error during patchValues:', error);
  } finally {
    // Reset isPatching after ALL patching is complete
    setTimeout(() => {
      this.isPatching = false;
      
      // NOW trigger calculations AFTER patching is complete
      if(!this.isEditMode){
      if (this.bookingProducts.length > 0) {
        this.handleProductRelatedCalculation();
      }
      this.calculateChargeableWeight();
      }
      
      // Force one more sync with rate component
      this.syncFormValueWithRateComponent();
      this.updateGenerateJobButtonVisibility();
    }, 1000);
  }
}


  // patchBookingFromQuotation(data:any){
  //   console.log(data);
  //   const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === data.DepartmentMasterSid);
  //   const selectedCustomer = this.customerList.find(cus => cus.CustomerMasterSid === data.CustomerMasterSid);
  //   this.onDeptChange(selectedDepartment);
  //   this.onCustomerChange(selectedCustomer);
  //   this.bookingForm.patchValue({
  //     CustomerMasterSid: data.CustomerMasterSid,
  //     CustomerName: data.CustomerName,
  //     CustomerAddress: data.CustomerAddress,
  //     SalesmanSid: data.SalesmanSid,
  //     FreightTerms : data.FreightTerms,
  //     QuotationHeaderSid: data.QuotationHeaderSid
  //   })
  // }

  // Patch booking from quotation
  patchBookingFromQuotation(data: any) {
    this.isPatching = true; 
    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === data.DepartmentMasterSid);
    this.onDeptChange(selectedDepartment);

    // Find customer from loaded customer list
    const customer = this.customerList.find(c => c.CustomerMasterSid === data.CustomerMasterSid);
    if (customer) {
      this.onCustomerChange(customer); // sets CustomerName and CustomerAddress properly
    } else {
      // fallback if customer not found
      this.b['CustomerName']?.setValue(data.CustomerName || '');
      this.b['CustomerAddress']?.setValue(data.CustomerAddress || '');
    }

    // Patch remaining form fields
    this.bookingForm.patchValue({
      QuotationHeaderSid: data.QuotationHeaderSid,
      QuoteRouteSid: data.QuoteRouteSid,
      DepartmentMasterSid: data.DepartmentMasterSid,
      CustomerMasterSid: data.CustomerMasterSid,
      SalesmanSid: data.SalesmanSid,
      FreightTerms: data.FreightTerms,
      JobType: data.JobType,
    });
    this.isPatching = false;
  }

  onContainerTypeChange(containerType: any) {
    if (!containerType) {
      this.selectedContainerType = '';
      return;
    }
    this.selectedContainerType = containerType;
  }
  

  openProductModal(content: TemplateRef<any>, productIndex?: number, data?: any) {
    this.initProductForm();
    if (!this.productLookupsLoaded) {
      this.loadProductLookups();
    }
    if (data) {
        this.productForm.patchValue({
          BookingProductSid: data?.BookingProductSid,
          ProductName: data?.ProductName,
          ShippingBillNo: data?.ShippingBillNo,
          ShippingBillDate: new Date(data?.ShippingBillDate),
          ExternaPkg: this.resolvePackageTypeSid(
            data?.ExternaPkg ??
            data?.ExternalPkg ??
            data?.PackageTypeId ??
            data?.ProductUnit ??
            data?.PackageType
          ),
          ExternlQty: data?.ExternlQty,
          GrossWeight: data?.GrossWeight,
          NetWeight: data?.NetWeight,
        Volume: data?.Volume,
        IsHaz: this.isHazardous(data?.IsHaz),
        ImcoClass: data?.ImcoClass,
        UnNo: data?.UnNo,
        PkgGroup: data?.PkgGroup,
        Length: data?.Length,
        Width: data?.Width,
        Height: data?.Height,
        Volumetric: data?.Volumetric,
        UomMasterSid: data?.UomMasterSid,
        CargoRecDate: data?.CargoRecDate
      });
          setTimeout(() => {
      // Trigger value change events to activate calculations
      this.productForm.get('ExternlQty')?.updateValueAndValidity({ emitEvent: true });
      this.productForm.get('Length')?.updateValueAndValidity({ emitEvent: true });
      this.productForm.get('Width')?.updateValueAndValidity({ emitEvent: true });
      this.productForm.get('Height')?.updateValueAndValidity({ emitEvent: true });
      this.productForm.get('UomMasterSid')?.updateValueAndValidity({ emitEvent: true });
    }, 100);
      const productItem = this.slicedProductArr[productIndex];
      this.currentProductIndex = this.bookingProducts.controls.indexOf(productItem);
      this.productEditMode = true;
    } else {
      this.productEditMode = false;
      this.currentProductIndex = -1;
    }

    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  onProductSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.productForm.updateValueAndValidity();
      errorLoggerWithToastr(this.productForm, this.toastr, this.productValidationConfig);
      return;
    }
    if (this.currentProductIndex === -1) {
      const productForm = this.productForm;
      this.bookingProducts.push(productForm);
    } else {
      const existingGroup = this.bookingProducts.at(this.currentProductIndex) as FormGroup;
      const formValue = this.productForm.value;
      existingGroup.patchValue({
        ...formValue
      })
      this.currentProductIndex = -1;
    }
    this.appSettingService.showSuccess("Product saved successfully");
    this.bookingProducts.updateValueAndValidity();
    this.productDataLength = this.bookingProducts.length;
    this.handleProductRelatedCalculation();
    this.updateProductPagination();
    this.modalService.dismissAll();
  }

  private showBookingBackendMessage(
    source: any,
    fallbackMessage: string,
    useWarning = false
  ): void {
    const message = extractBackendErrorMessage(source, fallbackMessage);

    if (useWarning) {
      this.appSettingService.showWarning(message);
      return;
    }

    this.appSettingService.showError(message);
  }

  handleConnectionChange(allConnections: any[]) {
    if (allConnections.length > 0) {
      this.connectionResult = [...allConnections];
    }
  }

  handleRateChange(allRates: any[]) {
    if (allRates.length > 0) {
      this.rateResult = [...allRates];
    }
  }

  handleMilestoneChange(allmilestones: any[]) {
    if (allmilestones.length !== 0) {
      this.milestoneResult = [...allmilestones];
      if (this.followupModalRef) {
        this.initializeMilestoneContentForFollowup();
      }
    }
  }

    private findInvalidControlsRecursive(form: FormGroup | FormArray): string[] {
    let invalidControls: string[] = [];
    Object.keys(form.controls).forEach(key => {
      const control = (form as any).get(key);
      if (control.invalid) {
        invalidControls.push(key);
      }
      if (control instanceof FormGroup || control instanceof FormArray) {
        invalidControls = invalidControls.concat(
          this.findInvalidControlsRecursive(control).map(childKey => `${key}.${childKey}`)
        );
      }
    });
    return invalidControls;
  }

  public errorLogger(): void {
    if (this.bookingForm.invalid) {
      const invalid = this.findInvalidControlsRecursive(this.bookingForm);
    } else {
    }
  }


  private async performDuplicateCheck(payload: any): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.operationService.checkBookingDuplicate(payload)
      );

      if (response.data) {
        return await this.commonModalService.confirm(
          `Today there was a booking created for this customer and route.\nDo you want to proceed?`,
          'Duplicate Detected',
          'Proceed Anyway'
        );
      }

      return true;
    } catch (error) {
      console.error('Duplicate check failed:', error);
      this.appSettingService.showError(
        'Duplicate check failed. Proceeding anyway.'
      );
      return true;
    }
  }


  async onSubmit(resolve?: (value: boolean) => void) {
    this.isSaving = true;
    const fy =this.appSettingService.getCurrentFinancialYear();
    if(fy) {
      const BookingDateTime = new Date (this.bookingForm.getRawValue().BookingDateTime);
       const fyStart = new Date(fy.StartDate);
      const fyEnd = new Date(fy.EndDate);
      if (BookingDateTime < fyStart || BookingDateTime > fyEnd) {
        this.appSettingService.showWarning(
          `Booking Date must be within the financial year (${fy.YearName})`
        );
        this.isSaving = false;
        if (resolve) resolve(false);
        return;
      }

    }
    if (this.isEditMode) {
      const currentFormState = this.getCurrentFormState();
      
      // FIX: Parse initialFormValue before comparison
      const initialState = typeof this.initialFormValue === 'string' 
        ? JSON.parse(this.initialFormValue) 
        : this.initialFormValue;
      
      if (this.deepEqual(initialState, currentFormState)) {
        this.appSettingService.showWarning('No changes to save.');
        this.isSaving = false;
        if (resolve) resolve(false);
        return;
      }
    }
    const cleanDate = (dateValue: any) => {
    if (!dateValue || dateValue.toString() === 'Invalid Date') {
      return null;
    }
    return dateValue;
  };
  this.b['ETA']?.setValue(cleanDate(this.b['ETA']?.value));
  this.b['ETD']?.setValue(cleanDate(this.b['ETD']?.value));
  this.b['PortCutoffDate']?.setValue(cleanDate(this.b['PortCutoffDate']?.value));
  // Update the form state
  this.errorLogger();
  this.bookingForm.updateValueAndValidity();
       if (!this.isTranshipmentMode && !this.validateAllForms()) {
      this.isSaving = false;
      if (resolve) resolve(false);
    return;
  }
  if (this.isTranshipmentMode) {
    if (!this.validateTranshipmentManualFields()) {
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }
  } else {
    const polControl = this.bookingForm.get('POL');
    const podControl = this.bookingForm.get('POD');
    const polSid = polControl?.value;
    const podSid = podControl?.value;

      if (!polSid || !podSid) {
        polControl?.markAsTouched();
        podControl?.markAsTouched();
        this.appSettingService.showWarning('Please select POL and POD.');
        this.isSaving = false;
        if (resolve) resolve(false);
        return;
      }

      if (polSid && podSid && polSid === podSid) {
        this.toastr.warning('POL and POD cannot be the same');
        this.setControlError(podControl, 'samePort', true);
        this.setControlError(polControl, 'samePort', true);
        this.isSaving = false;
        if (resolve) resolve(false);
        return;
      } 
      if (this.bookingForm.invalid) {
        this.bookingForm.markAllAsTouched();
        this.bookingForm.updateValueAndValidity();
        this.appSettingService.showWarning('Please fill all required fields correctly.');
        this.isSaving = false;
        if (resolve) resolve(false);
        return;
      }

      if (this.selectedTab === 'CRO' && this.croForm.invalid) {
      this.croForm.markAllAsTouched();
      this.croForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields in CRO tab correctly.');
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

    const isRateValid = this.costEntryComponent?.validateRateArray?.();
    if (isRateValid === false) {
      this.selectedTab = 'Rate';
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }
  }

    const creditOk = this.isTranshipmentMode ? true : await this.validateCreditBeforeSave();
    if (!creditOk) {
      const proceed = await this.commonModalService.confirm(
        `${this.lastCreditValidationMessage || 'Credit validation failed.'}\n\nDo you want to save this booking anyway?`,
        'Credit Validation',
        'Proceed'
      );
      if (!proceed) {
        this.isSaving = false;
        if (resolve) resolve(false);
        return;
      }
    }


    // const isRateValid = this.costEntryComponent?.validateRateArray?.();
    // console.log(isRateValid);
    // if (!isRateValid) {
    //   console.warn('Rate validation failed — submission stopped');
    //   return;
    // }
    this.updateBookingStatusOnCargoDate();
    const bookingFormValue = this.bookingForm.getRawValue();
    const cargoFormValue = this.cargoForm.getRawValue();
    const otherFormValue = this.otherForm.getRawValue();
    const croFormValue = this.croForm.getRawValue();
    const detailFormValue = this.detailForm.getRawValue();
    const cargoPayload = this.bookingCargo.controls.map((cargoCtrl: FormGroup) => {
      const cargoValue = cargoCtrl.getRawValue();
      return {
        BookingCargoSid: cargoValue.BookingCargoSid || null,
        CargoType: cargoValue.CargoType || 'General',
        ContainerType: cargoValue.ContainerType || null,
        NoofContainers: parseFloat(cargoValue.NoofContainers) || 1,
        GrossWeight: parseFloat(cargoValue.GrossWeight) || 0,
        NetWeight: parseFloat(cargoValue.NetWeight) || 0,
        Volume: parseFloat(cargoValue.Volume) || 0,
        Volumetric: parseFloat(cargoValue.Volumetric) || 0,
        ChargeableWeight: parseFloat(cargoValue.ChargeableWeight) || 0,
        NoOfPackage: parseFloat(cargoValue.NoOfPackage) || 0,
        ShipmentTerms: cargoValue.ShipmentTerms || null,
        MovementType: cargoValue.MovementType || null,
        FreightTerms: cargoValue.FreightTerms || null,
        ModeOfTransport: cargoValue.ModeOfTransport || null,
        StuffingAt: cargoValue.StuffingAt || 'Dock',
        bookingProducts: (cargoValue.bookingProducts || []).map((product: any) => ({
          BookingProductSid: product.BookingProductSid || null,
          BookingCargoSid: cargoValue.BookingCargoSid || product.BookingCargoSid || null,
          ProductName: product.ProductName || '',
          ShippingBillNo: product.ShippingBillNo || '',
          ShippingBillDate: product.ShippingBillDate ? new Date(product.ShippingBillDate) : null,
          ExternaPkg: this.resolvePackageTypeSid(product.ExternaPkg),
          ExternlQty: String(product.ExternlQty),
          GrossWeight: parseFloat(product.GrossWeight) || 0,
          NetWeight: parseFloat(product.NetWeight) || 0,
          Volume: parseFloat(product.Volume) || 0,
          IsHaz: product.IsHaz ? 'Y' : 'N',
          ImcoClass: product.ImcoClass || '',
          UnNo: String(product.UnNo ?? ''),
          PkgGroup: product.PkgGroup || '',
          Length: parseFloat(product.Length),
          Width: parseFloat(product.Width),
          Height: parseFloat(product.Height),
          Volumetric: parseFloat(product.Volumetric) || 0,
          UomMasterSid: product.UomMasterSid,
          CargoRecDate: product.CargoRecDate
        }))
      };
    });
    const bookingProductsPayload = detailFormValue.bookingProducts?.length
      ? detailFormValue.bookingProducts.map((product: any) => ({
          BookingProductSid: product.BookingProductSid || null,
          BookingCargoSid: product.BookingCargoSid || product.bookingCargoSid || null,
          ProductName: product.ProductName || '',
          ShippingBillNo: product.ShippingBillNo || '',
          ShippingBillDate: product.ShippingBillDate ? new Date(product.ShippingBillDate) : null,
          ExternaPkg: this.resolvePackageTypeSid(product.ExternaPkg),
          ExternlQty: String(product.ExternlQty),
          GrossWeight: parseFloat(product.GrossWeight) || 0,
          NetWeight: parseFloat(product.NetWeight) || 0,
          Volume: parseFloat(product.Volume) || 0,
          IsHaz: product.IsHaz ? 'Y' : 'N',
          ImcoClass: product.ImcoClass || '',
          UnNo: String(product.UnNo ?? ''),
          PkgGroup: product.PkgGroup || '',
          Length: parseFloat(product.Length),
          Width: parseFloat(product.Width),
          Height: parseFloat(product.Height),
          Volumetric: parseFloat(product.Volumetric) || 0,
          UomMasterSid: product.UomMasterSid,
          CargoRecDate: product.CargoRecDate
        }))
      : cargoPayload.flatMap((cargo: any) => cargo.bookingProducts || []);
    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const currentMenuId = this.sidebarService.syncMenuIdBeforeSubmit("Booking") ||  Number(sessionStorage.getItem('currentMenuId'));
      let CarrierSid = null;
  if (bookingFormValue.CarrierName) {
    const selectedCarrier = this.carrierList.find(carrier => 
      carrier.CustomerName === bookingFormValue.CarrierName
    );
    if (selectedCarrier) {
      CarrierSid = selectedCarrier.CustomerMasterSid;
    }
  }
   
  const QuoteRouteSid = bookingFormValue.QuoteRouteSid || this.dataFromQuotation?.QuoteRouteSid;
  

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      BookingDateTime : bookingFormValue.BookingDateTime ? new Date(bookingFormValue.BookingDateTime) : new Date(),
      MenuMasterSid: currentMenuId,
      DepartmentMasterSid: bookingFormValue.DepartmentMasterSid,
      CustomerMasterSid: bookingFormValue.CustomerMasterSid,
      CustomerBranchSid: bookingFormValue.CustomerBranchSid || this.selectedCustomer?.CustomerBranchSid || null,
      CustomerName: bookingFormValue.CustomerName,
      CustomerAddress: bookingFormValue.CustomerAddress,
      SalesmanSid: bookingFormValue.SalesmanSid || null,
      ShipperName: bookingFormValue.ShipperName,
      ShipperAddress: bookingFormValue.ShipperAddress,
      ConsigneeName: bookingFormValue.ConsigneeName,
      ConsigneeAddress: bookingFormValue.ConsigneeAddress,
      Notify: bookingFormValue.Notify || '',
      NotifyAddress: bookingFormValue.NotifyAddress || '',
      DestinationAgent: bookingFormValue.DestinationAgent,
      AgentAddress: bookingFormValue.AgentAddress || '',
      CarrierName: bookingFormValue.CarrierName || null,
      CarrierSid: CarrierSid,
      QuotationHeaderSid: bookingFormValue.QuotationHeaderSid || null,
      QuoteRouteSid: QuoteRouteSid, 
      HBLNo: bookingFormValue.HBLNo || '',
      HouseJobSid: bookingFormValue.HouseJobSid || '',
      MBLNo: bookingFormValue.MBLNo || '',
      MBLDate: bookingFormValue.MBLDate ? new Date(bookingFormValue.MBLDate) : null,
      status: bookingFormValue.status === 'Active' ? 'A' : 'S',
      VesselName: bookingFormValue.VesselName || null,
      VoyageMasterSid: bookingFormValue.VoyageMasterSid || null,
       JobType: bookingFormValue.JobType || '',
      VoyageNo: bookingFormValue.VoyageNo || null,
      ETA: bookingFormValue.ETA ? new Date(bookingFormValue.ETA) : null,
      ETD: bookingFormValue.ETD ? new Date(bookingFormValue.ETD) : null,
      PortCutoffDate: bookingFormValue.PortCutoffDate ? new Date(bookingFormValue.PortCutoffDate) : null, 
      POO: bookingFormValue.POO || null,
      POL: bookingFormValue.POL,  
      POD: bookingFormValue.POD,
      POLTerminal: bookingFormValue.POLTerminal || '',
      PODTerminal: bookingFormValue.PODTerminal || '',
      FPD: bookingFormValue.FPD || null,
      MovementType: bookingFormValue.MovementType || null,
      DoValid: bookingFormValue.DoValid ? new Date(bookingFormValue.DoValid) : null,
      Coload: bookingFormValue.Coload ? 'Y' : 'N',
      ShipmentType: bookingFormValue.ShipmentType ? 'Y' : 'N',
      IncoTerms: bookingFormValue.IncoTerms,
      InternalNote: bookingFormValue.InternalNote || '',
      GeneralNote: bookingFormValue.GeneralNote || '',
      NominatedBy: bookingFormValue.NominatedBy || 'Self',
      FreightTerms: bookingFormValue.FreightTerms || '',
      ShipmentNo: bookingFormValue.ShipmentNo || '',
      BookingStatus : bookingFormValue.BookingStatus || '',
      bookingCro: {
      BookingCroSid: croFormValue.BookingCroSid || null,
      OnHireRef: croFormValue.OnHireRef || '',
      ReleaseOrderDate: croFormValue.ReleaseOrderDate ? new Date(croFormValue.ReleaseOrderDate) : null,
      ValidityDate: croFormValue.ValidityDate ? new Date(croFormValue.ValidityDate) : null,
      Transporter: croFormValue.Transporter || '',
      EmptyYard: croFormValue.EmptyYard || '',
      NoteToYard: croFormValue.NoteToYard || '',
      NoteToShipper: croFormValue.NoteToShipper || ''
    },

      bookingCargo: cargoPayload,
      bookingOther: {
        BookingOthersSid: otherFormValue.BookingOthersSid || null,
        CustomerRefNo: otherFormValue.CustomerRefNo || '',
        YardCFS: otherFormValue.YardCFS || '',
        ReleaseType: otherFormValue.ReleaseType || null,
        HBLNo: otherFormValue.HBLNo || '',
        Forwarder: otherFormValue.Forwarder || null,
        ForwarderAddress: otherFormValue.ForwarderAddress || '',
        NotifyParty: otherFormValue.NotifyParty || null,
        NotifyPartyAddress: otherFormValue.NotifyPartyAddress || '',
        OriginAgent: otherFormValue.OriginAgent || null,
        OriginAgentAddress: otherFormValue.OriginAgentAddress || '',
        Notify2: otherFormValue?.Notify2,
        NotifyAddress2: otherFormValue?.NotifyAddress2,
        Coloader: otherFormValue?.Coloader,
        PickupPlace: otherFormValue.PickupPlace || '',
        DeliveryPlace: otherFormValue.DeliveryPlace || '',
        DeliveryDate: otherFormValue.DeliveryDate ? new Date(otherFormValue.DeliveryDate) : null,
        CHAName: otherFormValue.CHAName || '',
        PickupAddress: otherFormValue.PickupAddress || '',
        DeliveryAddress: otherFormValue.DeliveryAddress || '',
        CargoCurrency: otherFormValue.CargoCurrency || '',
        CargoValue: parseFloat(otherFormValue.CargoValue) || 0,
        SwitchBL: otherFormValue.SwitchBL ? 'Y' : 'N',
        BacktoBack: otherFormValue.BacktoBack ? 'Y' : 'N',
        Depo: otherFormValue.Depo || '',
        ROValidity: otherFormValue.ROValidity ? new Date(otherFormValue.ROValidity) : null,
        SwitchBLAgent: otherFormValue?.SwitchBLAgent,
        AgentAddress: otherFormValue?.AgentAddress,
        SwitchBLShipper: otherFormValue?.SwitchBLShipper,
        SwitchBLConsignee: otherFormValue?.SwitchBLConsignee,
        SwitchLocation: otherFormValue?.SwitchLocation,
        CarrierBookingRef: otherFormValue?.CarrierBookingRef,
        CarrierBookingDate: otherFormValue?.CarrierBookingDate ? new Date(otherFormValue?.CarrierBookingDate) : null
      },
      bookingProducts: bookingProductsPayload,
      bookingConnections: this.connectionResult,
      bookingRates: this.rateResult,
      milestones: this.milestoneResult,
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };

    const duplicateCheckingPayload = {
      CompanyMasterSid: payload.CompanyMasterSid,
      BranchMasterSid: payload.BranchMasterSid,
      DepartmentMasterSid: payload.DepartmentMasterSid,
      BookingDateTime: payload.BookingDateTime,
      CustomerMasterSid: payload.CustomerMasterSid,
      POL: payload.POL,
      POD: payload.POD,
      isEditMode : this.isEditMode,
      BookingHeaderSid : this.isEditMode ? this.BookingHeaderSid : null
    }

    if (!this.isEditMode) {
      const shouldProceed = await this.performDuplicateCheck(duplicateCheckingPayload);

      if (!shouldProceed) {
        this.isSaving = false;
        return; // STOP submission
      }
    }
    this.isSaving = true;
    this.spinner.show();
    if (this.isEditMode && this.BookingHeaderSid) {
      this.operationService.updateBookingById(this.BookingHeaderSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.isDirty = false;
            this.appSettingService.showSuccess('Booking successfully updated.');
            this.bookingForm.markAsPristine();
            this.cargoForm.markAsPristine();
            this.otherForm.markAsPristine();
            this.croForm.markAsPristine();
            this.detailForm.markAsPristine();
            if (resolve) resolve(true);
            this.isSaving = false;
            this.spinner.hide();
            // this.router.navigate(['operation/booking/list']);
            this.loadBookingById(this.BookingHeaderSid,true);
            this.emailTriggerService.triggerEmails({
              companyId: this.currentCompany.CompanyMasterSid,
              branchId: this.currentBranch.BranchMasterSid,
              menuMasterSid: this.MenuMasterSid,
              action: 'UPDATE',
              context: {
                BookingNo: this.bookingData?.BookingNo,
                date: this.datePipe.transform(this.bookingData?.BookingDateTime),
                POO: this.getFormattedPort(this.bookingData?.POO),
                POL: this.getFormattedPort(this.bookingData?.POL),
                POD: this.getFormattedPort(this.bookingData?.POD),
                FPD: this.getFormattedPort(this.bookingData?.FPD),
                customerName: this.bookingData?.CustomerName,
                shipperName: this.bookingData?.ShipperName,
                consigneeName: this.bookingData?.ConsigneeName,
                userName: this.userData?.userName,
                ShipmentNo: this.bookingData?.ShipmentNo,
                toEmail: this.selectedCustomerBranch?.Email || '',
                customerBranchSid: this.selectedCustomerBranch?.CustomerBranchSid || this.bookingData?.CustomerBranchSid || null
              }
            });
          } else {
            this.showBookingBackendMessage(resp, 'Error updating booking.', true);
            this.isSaving = false;
             if (resolve) resolve(false);
            console.error(resp.message);
          }
        },
        error: (err) => {
          this.showBookingBackendMessage(err, 'Failed to update booking.');
          this.isSaving = false;
           if (resolve) resolve(false);
          console.error(err);
        }
      });
    } else {
      this.operationService.createBooking(payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.isDirty = false;
            this.appSettingService.showSuccess('Booking successfully created.');
            const bookingId = resp.data?.bookingHeader?.BookingHeaderSid;
            if (resolve) resolve(true);
            this.isSaving = false;
            this.spinner.hide();
            this.router.navigate(['operation/booking/entry', bookingId]);
            this.emailTriggerService.triggerEmails({
              companyId: this.currentCompany.CompanyMasterSid,
              branchId: this.currentBranch.BranchMasterSid,
              menuMasterSid: this.MenuMasterSid,
              action: 'CREATE',
              context: {
                BookingNo: resp.data?.bookingHeader?.BookingNo,
                date: this.datePipe.transform(new Date()),
                POO: this.getFormattedPort(this.b['POO']?.value),
                POL: this.getFormattedPort(this.b['POL']?.value),
                POD: this.getFormattedPort(this.b['POD']?.value),
                FPD: this.getFormattedPort(this.b['FPD']?.value),
                customerName: this.b['CustomerName']?.value,
                shipperName: this.b['ShipperName']?.value,
                consigneeName: this.b['ConsigneeName']?.value,
                userName: this.userData?.userName,
                ShipmentNo: resp.data?.bookingHeader?.ShipmentNo,
                toEmail: this.selectedCustomerBranch?.Email || '',
                customerBranchSid: this.selectedCustomerBranch?.CustomerBranchSid || this.bookingData?.CustomerBranchSid || null
              }
            });
          } else {
            this.showBookingBackendMessage(resp, 'Error creating booking.', true);
            this.isSaving = false;
            if (resolve) resolve(false);
            console.error(resp.message);
          }
        },
        error: (err) => {
          this.showBookingBackendMessage(err, 'Failed to create booking.');
          this.isSaving = false;
          if (resolve) resolve(false);
          console.error(err);
        }
      });
    }
  }

  private validateAllForms(): boolean {
  let isValid = true;
  const errorMessages: string[] = [];
  let firstInvalidTab: string | null = null;

  const setFirstInvalidTab = (tabName: string) => {
    if (!firstInvalidTab) {
      firstInvalidTab = tabName;
    }
  };

  // Validate Booking Form
  if (this.bookingForm.invalid) {
    this.bookingForm.markAllAsTouched();
    setFirstInvalidTab('Shipment');
    
    Object.keys(this.bookingForm.controls).forEach(key => {
      const control = this.bookingForm.get(key);
      if (control?.errors) {
        if (control.errors['required']) {
          errorMessages.push(`${this.getFieldLabel(key)} is required`);
        }
      }
    });
    isValid = false;
  }

  // Validate Cargo Form / Cargo Groups only after the user starts using cargo
  if (this.bookingCargo.length > 0) {
    this.bookingCargo.controls.forEach((control, cargoIndex: number) => {
      const cargoGroup = control as FormGroup;
      if (!this.shouldValidateBookingCargoGroup(cargoGroup)) {
        this.clearFclCargoContainerErrors(cargoGroup);
        return;
      }
      const fclContainerErrors = this.validateFclCargoContainerFields(cargoGroup, cargoIndex);
      if (fclContainerErrors.length > 0) {
        errorMessages.push(...fclContainerErrors);
        setFirstInvalidTab('Cargo');
        isValid = false;
      }
      if (cargoGroup.invalid) {
        cargoGroup.markAllAsTouched();
        setFirstInvalidTab('Cargo');

        Object.keys(cargoGroup.controls).forEach(key => {
          const control = cargoGroup.get(key);
          if (this.shouldValidateFclCargoContainerFields() && ['ContainerType', 'NoofContainers'].includes(key)) {
            return;
          }
          if (control?.errors?.['required']) {
            errorMessages.push(`Cargo ${cargoIndex + 1}: ${this.getFieldLabel(key)} is required`);
          }
        });
        isValid = false;
      }

      const cargoProducts = cargoGroup.get('bookingProducts') as FormArray;
      const grossWeight = Number(cargoGroup.get('GrossWeight')?.value) || 0;
      const volume = Number(cargoGroup.get('Volume')?.value) || 0;
      if (cargoProducts.length === 0) {
        if (grossWeight <= 0) {
          errorMessages.push(`Cargo ${cargoIndex + 1}: Gross Weight is required`);
          cargoGroup.get('GrossWeight')?.setErrors({ min: true });
          setFirstInvalidTab('Cargo');
          isValid = false;
        }
        if (volume <= 0 && cargoGroup.get('Volume')) {
          errorMessages.push(`Cargo ${cargoIndex + 1}: CBM is required`);
          cargoGroup.get('Volume')?.setErrors({ min: true });
          setFirstInvalidTab('Cargo');
          isValid = false;
        }
      }

      cargoProducts.controls.forEach((productGroup: FormGroup, productIndex: number) => {
        if (productGroup.invalid) {
          productGroup.markAllAsTouched();
          setFirstInvalidTab('Cargo');

          Object.keys(productGroup.controls).forEach(key => {
            const control = productGroup.get(key);
            if (control?.errors?.['required']) {
              errorMessages.push(`Cargo ${cargoIndex + 1}, Product ${productIndex + 1}: ${this.getFieldLabel(key)} is required`);
            }
          });
          isValid = false;
        }
      });
    });
  } else if (this.bookingCargo.length === 0 && this.cargoForm.invalid) {
    this.cargoForm.markAllAsTouched();
    setFirstInvalidTab('Cargo');

    Object.keys(this.cargoForm.controls).forEach(key => {
      const control = this.cargoForm.get(key);
      if (control?.errors) {
        if (control.errors['required']) {
          errorMessages.push(`${this.getFieldLabel(key)} is required`);
        }
      }
    });
    isValid = false;
  }

  // Validate CRO Form
  if (this.croForm.invalid) {
    this.croForm.markAllAsTouched();
    setFirstInvalidTab('CRO');
    
    Object.keys(this.croForm.controls).forEach(key => {
      const control = this.croForm.get(key);
      if (control?.errors) {
        if (control.errors['required']) {
          errorMessages.push(`${this.getFieldLabel(key)} is required`);
        }
      }
    });
    isValid = false;
  }

  // Validate Products in FormArray ONLY if cargo groups are not being used
  if (this.bookingCargo.length === 0 && this.bookingProducts.length > 0) {
    this.bookingProducts.controls.forEach((productGroup: FormGroup, index) => {
      // Check if product form is invalid
      if (productGroup.invalid) {
        productGroup.markAllAsTouched();
        setFirstInvalidTab('Cargo');
        
        Object.keys(productGroup.controls).forEach(key => {
          const control = productGroup.get(key);
          if (control?.errors) {
            if (control.errors['required']) {
              // Special handling for AIR/LCL departments - make dimensions mandatory
              const isAirOrLCL = this.selectedFCLLCL === 'AIR' || this.selectedFCLLCL === 'LCL';
              const dimensionFields = ['UomMasterSid', 'Volumetric'];
              
              if (isAirOrLCL && dimensionFields.includes(key)) {
                errorMessages.push(`Product ${index + 1}: ${this.getFieldLabel(key)} is required for ${this.selectedFCLLCL} shipments`);
              } else {
                errorMessages.push(`Product ${index + 1}: ${this.getFieldLabel(key)} is required`);
              }
            } else if (control.errors['min']) {
              errorMessages.push(`Product ${index + 1}: ${this.getFieldLabel(key)} must be greater than 0`);
            } else if (control.errors['grossLessThanNet']) {
              errorMessages.push(`Product ${index + 1}: Gross Weight cannot be less than Net Weight`);
            } else if (control.errors['netGreaterThanGross']) {
              errorMessages.push(`Product ${index + 1}: Net Weight cannot be greater than Gross Weight`);
            }
          }
        });

        const grossWeightControl = productGroup.get('GrossWeight');
        const netWeightControl = productGroup.get('NetWeight');

        if (grossWeightControl?.hasError('grossLessThanNet') || netWeightControl?.hasError('netGreaterThanGross')) {
          errorMessages.push(`Product ${index + 1}: ${this.getProductValidationMessage()}`);
        }

        isValid = false;
      }

    });
  }

  if (firstInvalidTab) {
    this.selectedTab = firstInvalidTab;
  }

  // Show error messages if any
  if (errorMessages.length > 0) {
    const errorMessage = errorMessages.join(', ');
    this.appSettingService.showWarning(errorMessage, 'Validation Errors');
  }

  return isValid;
}

private shouldValidateFclCargoContainerFields(): boolean {
  const segment = this.normalizePortText(this.selectedFCLLCL);
  const exportImport = this.normalizePortText(
    this.selectedDepartment?.ExportImport || this.b?.['JobType']?.value
  );
  return segment === 'FCL' && ['EXPORT', 'IMPORT'].includes(exportImport);
}

private validateFclCargoContainerFields(cargoGroup: FormGroup, cargoIndex: number): string[] {
  const containerTypeControl = cargoGroup.get('ContainerType');
  const noOfContainersControl = cargoGroup.get('NoofContainers');

  if (!this.shouldValidateFclCargoContainerFields()) {
    this.clearFclCargoContainerErrors(cargoGroup);
    return [];
  }

  const errors: string[] = [];
  const containerType = containerTypeControl?.value;
  const noOfContainers = Number(noOfContainersControl?.value);

  if (!containerType) {
    this.setControlError(containerTypeControl, 'required', true);
    errors.push(`Cargo ${cargoIndex + 1}: Container Type is required`);
  } else {
    this.clearControlError(containerTypeControl, 'required');
  }

  if (!noOfContainersControl?.value) {
    this.setControlError(noOfContainersControl, 'required', true);
    errors.push(`Cargo ${cargoIndex + 1}: No. of Container is required`);
  } else if (!Number.isFinite(noOfContainers) || noOfContainers <= 0) {
    this.setControlError(noOfContainersControl, 'min', true);
    errors.push(`Cargo ${cargoIndex + 1}: No. of Container must be greater than 0`);
  } else {
    this.clearControlError(noOfContainersControl, 'required');
    this.clearControlError(noOfContainersControl, 'min');
  }

  return errors;
}

private clearFclCargoContainerErrors(cargoGroup: FormGroup): void {
  this.clearControlError(cargoGroup.get('ContainerType'), 'required');
  this.clearControlError(cargoGroup.get('NoofContainers'), 'required');
  this.clearControlError(cargoGroup.get('NoofContainers'), 'min');
}

private setControlError(control: AbstractControl | null, key: string, value: any): void {
  if (!control) return;
  const currentErrors = control.errors || {};
  control.setErrors({ ...currentErrors, [key]: value });
}

private clearControlError(control: AbstractControl | null, key: string): void {
  if (!control?.errors || !control.errors[key]) return;
  const remainingErrors = { ...control.errors };
  delete remainingErrors[key];
  control.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
}

// Add this method to your BookingEntryComponent
onCarrierChangeForAir(carrier: any): void {
  // Only apply for Air department
  if (this.selectedDepartmentType !== "AIR") {
    return;
  }

  if (!carrier) {
    // If carrier is cleared, clear the airline selection
    this.bookingForm.get('VesselName')?.setValue(null);
    return;
  }

  // Check if the selected carrier has an AirlineCode
  if (carrier.AirlineCode) {
    // Find the airline in airlineList that matches this AirlineCode
    const matchingAirline = this.airlineList.find(
      airline => airline.AirlineCode === carrier.AirlineCode
    );

    if (matchingAirline) {
      // Set the VesselName to the matching airline's CustomerName
      this.bookingForm.get('VesselName')?.setValue(matchingAirline.CustomerName);
    } else {
      // If no exact match found, you might want to clear or show a message
      this.bookingForm.get('VesselName')?.setValue(null);
    }
  } else {
    // Carrier doesn't have an AirlineCode
    this.bookingForm.get('VesselName')?.setValue(null);
  }
}
  /**
    |--------------------------------------------------
    |   Section-5 : Helper Functions
    |--------------------------------------------------
  */

  // Header Part Related

  onDeptChange(department) {
    this.selectedDepartment = department;
    if (!department) {
      this.selectedDepartmentType = '';
      this.selectedFCLLCL = 'LCL';
      this.selectedCargoMode = 'LCL';
      this.filteredPorts = [];
      this.filteredPOO = [];
      this.filteredPOL = [];
      this.filteredPOD = [];
      this.filteredFPOD = [];
      this.b['POO'].setValue(null);
      this.b['POL'].setValue(null);
      this.b['POD'].setValue(null);
      this.b['FPD'].setValue(null);
      this.b['ETA'].setValue('');
      this.b['ETD'].setValue('');
      this.b['PortCutoffDate'].setValue('');
      this.b['MovementType'].setValue(null);
       this.b['JobType'].setValue('');
      this.updateCarrierValidation(null);
      this.handleImportExport();
      this.handleCFSOrYard()
      return;
  }
    if (this.selectedDepartmentType === 'AIR' && this.selectedTab === 'CRO') {
    this.selectedTab = 'Shipment';
  }
if (this.normalizePortText(department?.ExportImport) === 'IMPORT') {
  // Clear destination agent fields
  this.b['DestinationAgent']?.setValue(null);
  this.b['AgentAddress']?.setValue('');
} else if (this.normalizePortText(department?.ExportImport) === 'EXPORT') {
  // Clear origin agent fields
  this.o['OriginAgent']?.setValue(null);
  this.o['OriginAgentAddress']?.setValue('');
}
    this.selectedDepartmentType = this.normalizePortText(department?.departmentType);
    this.selectedFCLLCL = this.resolveSelectedSegment(department);
    this.selectedCargoMode = this.resolveCargoMode(department);
    if (!this.isPatching) {
      this.clearRouteSelections();
    }
     if (this.bookingProducts.length > 0) {
    this.bookingProducts.controls.forEach((productGroup: FormGroup, index) => {
      const isAirOrLCL = this.usesDimensionalCargoFields();
      
      // Update validators based on department
      const dimensionFields = ['UomMasterSid', 'Volumetric'];
      dimensionFields.forEach(field => {
        const control = productGroup.get(field);
        if (isAirOrLCL) {
          control?.setValidators([Validators.required]);
        } else {
          control?.clearValidators();
        }
        control?.updateValueAndValidity({ emitEvent: false });
      });
    });
  }
     this.autoSetJobType(department);
    this.updateCarrierValidation(department);
    this.updateGenerateJobButtonVisibility();
    if (this.selectedFCLLCL === "LCL" && department.ExportImport === "Export") {
      this.cargoForm.get('StuffingAt')?.setValue('Dock');
      this.cargoForm.get('StuffingAt')?.disable();
    } else {
      this.cargoForm.get('StuffingAt')?.enable();
    }

    this.selectedDepartmentType === "SEA" ? this.c['ModeOfTransport']?.setValue('Vessel') : null;
    this.selectedDepartmentType === "AIR" ? this.c['ModeOfTransport']?.setValue('Flight') : null;
    this.selectedCargoMode === "ROAD" ? this.c['ModeOfTransport']?.setValue('Road') : null;
    this.handleCFSOrYard()
    this.refreshPortFilters();
    this.handleImportExport();
  }

  private clearRouteSelections(): void {
    this.lastPortFilterPayloadKey = '';
    this.filteredPorts = [];
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFPOD = [];
    this.b['POO']?.setValue(null);
    this.b['POL']?.setValue(null);
    this.b['POD']?.setValue(null);
    this.b['FPD']?.setValue(null);
  }
  private autoSetJobType(department: any): void {
  if (!department) {
    this.b['JobType']?.setValue('');
    return;
  }

  const departmentName = department.departmentName?.toLowerCase() || '';
  const exportImport = department.ExportImport;
  
  let jobType : 'Import' | 'Export' | 'Transhipment' | '' = '';
  
  // // Determine JobType based on department name and export/import
  // if (departmentName.includes('fcl') || departmentName.includes('lcl')) {
  //   if (exportImport === 'Export') {
  //     jobType = 'Export';
  //   } else if (exportImport === 'Import') {
  //     jobType = 'Import';
  //   }
  // }
  
  // // Additional logic for other department types if needed
  // if (departmentName.includes('air')) {
  //   if (exportImport === 'Export') {
  //     jobType = 'Air Export';
  //   } else if (exportImport === 'Import') {
  //     jobType = 'Air Import';
  //   }
  // }
  
  // Set the JobType value
  this.b['JobType']?.setValue(exportImport);
}

  onRouteChange(): void {
    const polControl = this.b['POL'];
    const podControl = this.b['POD'];
    const polSid = polControl?.value;
    const podSid = podControl?.value;
    this.refreshPortFilters();
    if (polSid && podSid && polSid === podSid) {
      this.setControlError(podControl, 'samePort', true);
      this.setControlError(polControl, 'samePort', true);
      this.toastr.warning('POL and POD cannot be the same');
    } else {
      this.clearControlError(podControl, 'samePort');
      this.clearControlError(polControl, 'samePort');
    }
  }

  private refreshPortFilters(): void {
    const departmentSid = this.b['DepartmentMasterSid']?.value || this.selectedDepartment?.DepartmentMasterSid;
    if (!departmentSid) {
      this.lastPortFilterPayloadKey = '';
      this.applyPortFilterLists({ filteredPorts: [], filteredPOO: [], filteredPOL: [], filteredPOD: [], filteredFPOD: [] });
      return;
    }

    const payload = {
      DepartmentMasterSid: departmentSid,
      ShipmentType: this.getShipmentDirection(),
      LoginCountryMasterSid: this.currentCompany?.CountryMasterSid,
      PortFieldType: 'ALL',
      SelectedPOO: this.b['POO']?.value,
      SelectedPOL: this.b['POL']?.value,
      SelectedPOD: this.b['POD']?.value,
      SelectedFPOD: this.b['FPD']?.value
    };

    const payloadKey = JSON.stringify(payload);
    if (payloadKey === this.lastPortFilterPayloadKey) {
      return;
    }
    this.lastPortFilterPayloadKey = payloadKey;

    this.operationService.getFilteredPorts(payload).subscribe({
      next: (resp: any) => {
      const data = resp?.data || {};
      this.applyPortFilterLists({
        filteredPorts: [
          ...(data.POO || []),
          ...(data.POL || []),
          ...(data.POD || []),
          ...(data.FPOD || [])
        ],
        filteredPOO: data.POO || [],
        filteredPOL: data.POL || [],
        filteredPOD: data.POD || [],
        filteredFPOD: data.FPOD || []
      });
      this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value;
      },
      error: () => {
        this.lastPortFilterPayloadKey = '';
      }
    });
  }

  private applyPortFilterLists(filteredLists: any): void {
    this.filteredPorts = filteredLists.filteredPorts;
    this.filteredPOO = filteredLists.filteredPOO;
    this.filteredPOL = filteredLists.filteredPOL;
    this.filteredPOD = filteredLists.filteredPOD;
    this.filteredFPOD = filteredLists.filteredFPOD;
  }

  private getShipmentDirection(): 'EXPORT' | 'IMPORT' | '' {
    const departmentDirection = this.normalizePortText(this.selectedDepartment?.ExportImport);
    if (departmentDirection === 'EXPORT' || departmentDirection === 'IMPORT') {
      return departmentDirection as 'EXPORT' | 'IMPORT';
    }

    const jobType = this.normalizePortText(this.b['JobType']?.value);
    if (jobType === 'EXPORT' || jobType === 'IMPORT') {
      return jobType as 'EXPORT' | 'IMPORT';
    }

    return '';
  }

  private getPortsByReferenceCountry(controlName: 'POL' | 'POD', fallbackPorts: any[]): any[] {
    const referencePort = this.getPortByCode(this.b[controlName]?.value);
    if (!referencePort) {
      return [...fallbackPorts];
    }

    const referenceCountryId = this.toNumber(referencePort?.CountryMasterSid);
    if (!referenceCountryId) {
      return [...fallbackPorts];
    }

    return fallbackPorts.filter(port => this.toNumber(port?.CountryMasterSid) === referenceCountryId);
  }

  private isCompanyCountryPort(port: any): boolean {
    const companyCountryId = this.toNumber(this.currentCompany?.CountryMasterSid);
    const portCountryId = this.toNumber(port?.CountryMasterSid);
    return !!companyCountryId && !!portCountryId && companyCountryId === portCountryId;
  }

  private isForeignCountryPort(port: any): boolean {
    const companyCountryId = this.toNumber(this.currentCompany?.CountryMasterSid);
    const portCountryId = this.toNumber(port?.CountryMasterSid);
    return !!companyCountryId && !!portCountryId && companyCountryId !== portCountryId;
  }

  private getPortByCode(portCode: string | null | undefined): any | null {
    if (!portCode) {
      return null;
    }

    return this.portList.find(port => port.PortCode === portCode) || null;
  }

  private normalizePortText(value: any): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private resolveSelectedSegment(department: any): string {
  const departmentType = this.normalizePortText(department?.departmentType);

  if (departmentType === 'SEA') {
    return this.normalizePortText(department?.FCLLCL) || 'LCL';
  }

  // Road/Transport: return FCL if department FCLLCL is FCL or Others, else LCL
  if (departmentType === 'ROAD' || departmentType === 'TRANSPORT') {
    const fcllcl = this.normalizePortText(department?.FCLLCL);
    if (fcllcl === 'FCL' || fcllcl === 'OTHERS' || fcllcl === '') {
      return 'FCL'; // Will show container fields in template
    }
    return 'LCL'; // Will show dimensional fields
  }

  return departmentType || 'LCL';
}

  private resolveCargoMode(department: any): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
  const departmentType = this.normalizePortText(department?.departmentType);
  const fcllcl = this.normalizePortText(department?.FCLLCL);

  if (departmentType === 'AIR') {
    return 'AIR';
  }

  if (departmentType === 'SEA') {
    if (fcllcl === 'FCL') return 'FCL';
    return 'LCL';
  }

  if (departmentType === 'ROAD' || departmentType === 'TRANSPORT') {
    if (fcllcl === 'LCL') return 'LCL'; // Road + LCL → dimensional
    return 'ROAD'; // Road + FCL or Others → container fields
  }

  // Default
  const selectedSegment = this.resolveSelectedSegment(department);
  if (selectedSegment === 'FCL') return 'FCL';
  if (selectedSegment === 'AIR') return 'AIR';
  return 'LCL';
}

isSurfaceCargoMode(): boolean {
  // Only pure ROAD (Road+FCL or Road+Others) uses container-like fields without dimensional
  return this.selectedCargoMode === 'ROAD';
}

usesDimensionalCargoFields(): boolean {
  return this.selectedCargoMode === 'LCL' || this.selectedCargoMode === 'AIR';
}

  private shouldUseAllPortOptions(): boolean {
    const departmentType = this.normalizePortText(this.selectedDepartmentType || this.selectedDepartment?.departmentType);
    const segment = this.normalizePortText(this.selectedFCLLCL);

    return ['OTHER', 'OTHERS', 'TRANSPORT'].includes(departmentType) || ['OTHER', 'OTHERS', 'TRANSPORT'].includes(segment);
  }

  private isServiceJobDepartment(department: any): boolean {
    const departmentName = this.normalizePortText(department?.departmentName);
    const departmentCode = this.normalizePortText(department?.DepartmentCode ?? department?.departmentCode);

    return departmentName === 'SERVICE JOB' || departmentCode === 'SJ';
  }

  private toNumber(value: any): number | null {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }


  onCustomerChange(customer: any) {
  
  // Check if department is selected
  if (!this.selectedDepartment) {
    this.appSettingService.showWarning('Please select a department first before selecting a customer.');
    
    // Clear the customer selection
    this.b['CustomerMasterSid']?.setValue(null);
    this.selectedCustomer = null;
    this.b['CustomerName']?.setValue('');
    this.b['CustomerAddress']?.setValue(null);
    this.b['CustomerBranchSid']?.setValue(null);
    this.customerBranchList = [];
    this.handleImportExport();
    return;
  }
  
  this.selectedCustomer = customer; 
  if (!customer) {
    this.b['CustomerName']?.setValue('');
    this.b['CustomerAddress']?.setValue(null);
    this.b['CustomerBranchSid']?.setValue(null);
    this.customerBranchList = [];
    this.handleImportExport();
    return;
  }
  
  this.b['CustomerName']?.setValue(customer.CustomerName);
  this.b['CustomerAddress']?.setValue(customer.Address);
  this.b['CustomerBranchSid']?.setValue(customer.CustomerBranchSid);
  this.handleImportExport();
}

  onShipperChange(shipper?: any) {
    if (!shipper) {
      this.filteredConsigneeList = [...this.consigneeList];
      return;
    }
    this.filteredConsigneeList = this.consigneeList.filter(c => c.CustomerMasterSid !== shipper.CustomerMasterSid);
  }

  onConsigneeChange(consignee?: any) {
    if (!consignee) {
      this.filteredShipperList = [...this.shipperList];
      this.b['Notify']?.setValue(null);
      this.b['NotifyAddress']?.setValue('');
      return;
    }
    this.filteredShipperList = this.shipperList.filter(s => s.CustomerMasterSid !== consignee.CustomerMasterSid);
    this.b['Notify']?.setValue(consignee.CustomerName);
    this.b['NotifyAddress']?.setValue(consignee.Address);
  }

  handleImportExport() {
    // Early return if no department selected - clear both fields
    if (!this.selectedDepartment) {
      this.b['ShipperName']?.setValue(null);
      this.b['ShipperAddress']?.setValue('');
      this.b['ConsigneeName']?.setValue(null);
      this.b['ConsigneeAddress']?.setValue('');
      this.b['Notify']?.setValue(null);
      this.b['NotifyAddress']?.setValue('')
      this.onShipperChange();
      this.onConsigneeChange();
      return;
    }

    const exportImportType = this.selectedDepartment.ExportImport;
    if (exportImportType === "Export") {
      // Handle Export logic
      const CustomerBranchSid = this.b['CustomerBranchSid']?.value;

      if (!CustomerBranchSid) {
        this.b['ShipperName']?.setValue(null);
        this.b['ShipperAddress']?.setValue('');
        this.onShipperChange();
        return;
      }

      const shipperExist = this.shipperList.find(s => s.CustomerBranchSid === CustomerBranchSid);
      const shipperExistInFiltered = this.filteredShipperList.find(s => s.CustomerBranchSid === CustomerBranchSid);

      if (shipperExist && shipperExistInFiltered) {
        this.b['ShipperName']?.setValue(shipperExistInFiltered.CustomerName);
        this.b['ShipperAddress']?.setValue(shipperExistInFiltered.Address);
        this.onShipperChange(shipperExistInFiltered);
        this.onConsigneeChange();
      } else if (shipperExist && !shipperExistInFiltered) {
        this.b['ShipperName']?.setValue(shipperExist.CustomerName);
        this.b['ShipperAddress']?.setValue(shipperExist.Address);
        this.b['ConsigneeName']?.setValue(null);
        this.b['ConsigneeAddress']?.setValue('');
        this.onShipperChange(shipperExist);
        this.onConsigneeChange();
      } else {
        this.b['ShipperName']?.setValue(null);
        this.b['ShipperAddress']?.setValue('');
        this.onShipperChange();
      }
      return;
    }

    if (exportImportType === "Import") {
      // Handle Import logic
      const customerBranchSid = this.b['CustomerBranchSid']?.value;

      if (!customerBranchSid) {
        this.b['ConsigneeName']?.setValue(null);
        this.b['ConsigneeAddress']?.setValue('');
        this.b['Notify']?.setValue(null); // Clear Notify
        this.b['NotifyAddress']?.setValue('');
        this.onConsigneeChange();
        return;
      }

      const consigneeExist = this.consigneeList.find(c => c.CustomerBranchSid === customerBranchSid);
      const consigneeExistInFiltered = this.filteredConsigneeList.find(c => c.CustomerBranchSid === customerBranchSid);

      if (consigneeExist && consigneeExistInFiltered) {
        this.b['ConsigneeName']?.setValue(consigneeExistInFiltered.CustomerName);
        this.b['ConsigneeAddress']?.setValue(consigneeExistInFiltered.Address);
        this.b['Notify']?.setValue(consigneeExistInFiltered.CustomerName);
        this.b['NotifyAddress']?.setValue(consigneeExistInFiltered.Address);
        this.onConsigneeChange(consigneeExistInFiltered);
        this.onShipperChange();
      } else if (consigneeExist && !consigneeExistInFiltered) {
        this.b['ConsigneeName']?.setValue(consigneeExist.CustomerName);
        this.b['ConsigneeAddress']?.setValue(consigneeExist.Address);
        this.b['Notify']?.setValue(consigneeExist.CustomerName);
      this.b['NotifyAddress']?.setValue(consigneeExist.Address);
        this.b['ShipperName']?.setValue(null);
        this.b['ShipperAddress']?.setValue('');
        this.onConsigneeChange(consigneeExist);
        this.onShipperChange();
      } else {
        this.b['ConsigneeName']?.setValue(null);
        this.b['ConsigneeAddress']?.setValue('');
        this.b['Notify']?.setValue(null); // Clear Notify
        this.b['NotifyAddress']?.setValue('')
        this.onConsigneeChange();
      }
    }
  }


  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe((resp: any) => {
      if (resp.status) {
        this.customerBranchList = resp.data;
        if (this.isEditMode) {
          this.selectedCustomerBranch = this.customerBranchList.find(c => c.CustomerBranchSid === this.bookingHeader?.CustomerBranchSid);
        }
      } else {
        this.appSettingService.showError("Error loading customer's branch.")
      }
    })
  }

  onCustomerBranchChange(customerBranch: any) {
    if (!customerBranch) {
      this.b['CustomerAddress']?.setValue(null);
      this.b['CustomerBranchSid']?.setValue(null);
      this.selectedCustomerBranch = null;
      return;
    }
    this.b['CustomerAddress']?.setValue(customerBranch.Address);
    this.b['CustomerBranchSid']?.setValue(customerBranch.CustomerBranchSid);
    this.selectedCustomerBranch = customerBranch;
  }

  setAddress(controlName: string, item: any) {
    this.b[controlName]?.setValue(item ? item.Address : '')
  }

  handlePOLChange(selectedPort: any) {
    if (this.selectedDepartmentType !== 'AIR') {
      this.b['VesselName']?.setValue(null);
    }
    this.b['VoyageNo']?.setValue(null);
    this.b['ETA']?.setValue(null);
    this.b['ETD']?.setValue(null);
    this.b['PortCutoffDate']?.setValue(null);
    if (!selectedPort) {
      this.refreshPortFilters();
      return;
    }
    this.onRouteChange();
    this.getVesselVoyBasedOnPorts();
  }

  handlePODChange(selectedPort: any) {
    if (this.selectedDepartmentType !== 'AIR') {
      this.b['VesselName']?.setValue(null);
    }
    this.b['VoyageNo']?.setValue(null);
    this.b['ETA']?.setValue(null);
    this.b['ETD']?.setValue(null);
    this.b['PortCutoffDate']?.setValue(null);
    if (!selectedPort) {
      this.b['FPD']?.setValue(null);
      this.refreshPortFilters();
      this.PODandFPODsame = true;
      return;
    }
    this.b['FPD']?.setValue(selectedPort.PortCode);
    this.onRouteChange();
    this.getVesselVoyBasedOnPorts();
  }

  handleFPODChange(port) {
    if (!port) {
      this.PODandFPODsame = true;
      return;
    }
    this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value
  }
onVesselChange(vessel: any) {
  
  if(!vessel){
    this.voyageList = [];
    this.bookingForm.get('VoyageNo')?.setValue(null);
    this.bookingForm.get('ETA')?.setValue(null);
    this.bookingForm.get('ETD')?.setValue(null);
    this.bookingForm.get('PortCutoffDate')?.setValue(null);
    return;
  }
  
  this.bookingForm.get('vesselName')?.setValue(vessel.VesselName);
  this.getVoyageForPortsAndVessels(vessel.VesselName);
  if(vessel.VoyageNo){
    this.autoPopulateVoyageData(vessel);
  }
}
 private autoPopulateVoyageData(vessel: any): void {
    if (vessel.VoyageNo) {
      this.bookingForm.patchValue({
        VoyageNo: vessel.VoyageNo,
        ETA: vessel.ETA ? new Date(vessel.ETA) : null,
        ETD: vessel.ETD ? new Date(vessel.ETD) : null,
        PortCutoffDate: vessel.PortCutoff ? new Date(vessel.PortCutoff) : null
      });
    }
  }

//   onVesselChange(vessel: any) {
//   console.log('=== onVesselChange START ===');
//   console.log('Voyage object:', voyage);
//   console.log('Is voyage null/undefined?', !voyage);
  
//   if (!vessel) {
//     console.log('No voyage selected, clearing all voyage-related fields');
//     this.bookingForm.patchValue({
//       VoyageMasterSid : null,
//       VoyageNo: null,
//       ETA: null,
//       ETD: null,
//       CutOffDate: null
//     });
//     console.log('Fields cleared');
//     console.log('=== onVesselChange END (no voyage) ===');
//     return;
//   }
  
//   console.log('Setting voyage data:');
//   console.log('- VoyageMasterSid:', voyage.VoyageMasterSid);
//   console.log('- VoyageNo:', voyage.VoyageNo);
//   console.log('- ETA from voyage:', voyage.ETA, 'as Date:', new Date(voyage.ETA));
//   console.log('- ETD from voyage:', voyage.ETD, 'as Date:', new Date(voyage.ETD));
//   console.log('- PortCutoff from voyage:', voyage.PortCutoff, 'as Date:', new Date(voyage.PortCutoff));
  
//   this.bookingForm.patchValue({
//     VoyageMasterSid : voyage.VoyageMasterSid,
//     VoyageNo: voyage.VoyageNo,
//     ETA: new Date(voyage.ETA),
//     ETD: new Date(voyage.ETD),
//     CutOffDate: new Date(voyage.PortCutoff),
//   });
  
//   console.log('Fields set successfully');
//   console.log('=== onVesselChange END ===');
// }
onVoyageChange(voyage: any) {
   
  if(!voyage){
  
    this.bookingForm.get('ETA')?.setValue(null);
    this.bookingForm.get('ETD')?.setValue(null);
    this.bookingForm.get('PortCutoffDate')?.setValue(null);
    this.bookingForm.get('VoyageMasterSid')?.setValue(null);
    return;
  }

this.bookingForm.get('VesselName')?.setValue(voyage.VesselName);
this.bookingForm.get('VoyageNo')?.setValue(voyage.VoyageNo);
this.bookingForm.get('ETA')?.setValue(new Date(voyage.ETA));
this.bookingForm.get('ETD')?.setValue(new Date(voyage.ETD));
this.bookingForm.get('PortCutoffDate')?.setValue(new Date(voyage.PortCutoff));
this.bookingForm.patchValue({
 VoyageMasterSid: voyage.VoyageMasterHeaderSid || null,
      VoyageNo: voyage.VoyageNo,
      VesselName: voyage.VesselName || this.bookingForm.get('VesselName')?.value
    });
    if(voyage.ETD){
      this.bookingForm.get('ETD')?.setValue(new Date(voyage.ETD));
    }
    if(voyage.ETA){
      this.bookingForm.get('ETA')?.setValue(new Date(voyage.ETA));
      this.minStartDate = new Date(voyage.ETA);
    }
    if(voyage.PortCutoff){
      this.bookingForm.get('PortCutoffDate')?.setValue(new Date(voyage.PortCutoff));
    } else if(voyage.PortCutoffDate){
      this.bookingForm.get('PortCutoffDate')?.setValue(new Date(voyage.PortCutoffDate));
    }
    // Also check voyage.Ports array for port-specific cutoff
    if (voyage.Ports && Array.isArray(voyage.Ports)) {
      const POL = this.bookingForm.get('POL')?.value;
      const polDetail = voyage.Ports.find((p: any) => p.POLSid === POL);

      if (polDetail?.PortCutoff) {
        
        this.bookingForm.get('PortCutoffDate')?.setValue(new Date(polDetail.PortCutoff));
      }
    }
    
}
  // onVoyageChange(voyage: any) {
  //   if (!voyage) {
  //     this.b['ETA'].setValue(null);
  //     this.b['ETD'].setValue(null);
  //     this.b['CutOffDate'].setValue(null);
  //     this.b['VoyageMasterSid']?.setValue('')
  //     return;
  //   }
  //   const POL = this.b['POL'].value;
  //   const POD = this.b['POD'].value;
  //   this.b['VoyageMasterSid']?.setValue(voyage.VoyageMasterHeaderSid);
  //   const polETD = voyage.ETD || null;
  //   const podETA = voyage?.ETA || null;
  //   const cutOff = voyage?.PortCutoff || null;
  //   this.b['ETD'].setValue(new Date(polETD));
  //   this.b['ETA'].setValue(new Date(podETA));
  //   this.b['CutOffDate'].setValue(new Date(cutOff));
  //   this.minStartDate = new Date(podETA);
  // }

  getVoyageTypeBasedOnDept(deptId: number) {
    const dept = this.departmentList.find(dept => dept.DepartmentMasterSid === deptId);
    const deptType = dept?.departmentType;
    switch (deptType) {
      case 'Sea':
        return 'Sea';
      case 'Air':
        return 'Air';
      case 'Transport':
        return 'Road';
      default:
        return 'Sea';
    }
  }

getVesselVoyBasedOnPorts() {
  
  const POL = this.b['POL']?.value;
  const POD = this.b['POD']?.value;
  const voyageType = this.getVoyageTypeBasedOnDept(this.selectedDepartment?.DepartmentMasterSid);
  
  const POLSid = (this.portList.find(port => port.PortCode === POL)?.PortMasterSid);
  const PODSid = (this.portList.find(port => port.PortCode === POD)?.PortMasterSid);
  
  this.hasShownVesselWarning = false;
  
  if (!POLSid || !PODSid || !voyageType) {
  
    return;
  }
  
  const payload = { POL: POLSid, POD: PODSid, segment: voyageType };
  
  this.operationService.getVesselVoyageBasedOnPorts(payload).subscribe(
    (resp: any) => {
      if (resp.status) {
        this.headerVesselList = resp.data.map(vslVoy =>({
            ...vslVoy , 
            ETD : vslVoy.ETD ? new Date (vslVoy.ETD) : null,
            ETA : vslVoy.ETA ? new Date (vslVoy.ETA) : null,
            PortCutoffDate: vslVoy.PortCutoffDate ? new Date (vslVoy.PortCutoffDate) : null,
        }));
        if (this.headerVesselList.length === 0 && !this.hasShownVesselWarning) {
          this.hasShownVesselWarning = true;
        }
      } else {
        this.appSettingService.showError("Error loading Vessel");
      }
    }
  );
}

  getVoyageForPortsAndVessels(vesselName?: string) {
    const POL = this.bookingForm.get('POL')?.value;
    const POD = this.bookingForm.get('POD')?.value;
    const vessel = vesselName || this.bookingForm.get('VesselName')?.value;

    if (!POL || !POD || !vessel) {
      return;
    }

    // Get port details
    const polPort = this.portList.find(p => p.PortMasterSid === POL);
    const podPort = this.portList.find(p => p.PortMasterSid === POD);

    if (!polPort || !podPort) {
      return;
    }

    const payload = {
      VesselName: vessel,
      POL: polPort.PortMasterSid,
      POD: podPort.PortMasterSid,
      MovementType: this.selectedDepartment?.departmentType
    };

    this.operationService.getVoyagesBasedOnVesselAndPort(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.voyageList = resp.data.map((voyage: any) => {
            // Format the voyage data
            return {
              VoyageNo: voyage.VoyageNo,
              ETD: voyage.ETD ? new Date(voyage.ETD) : null,
              ETA: voyage.ETA ? new Date(voyage.ETA) : null,
              PortCutoff: voyage.PortCutoff ? new Date(voyage.PortCutoff) : null,
              VoyageMasterHeaderSid: voyage.VoyageMasterSid,
              VesselName: voyage.VesselName,
              POL: polPort,
              POD: podPort
            };
          });

          // In edit mode, try to find and select the existing voyage
          if (this.isEditMode) {
            const currentVoyageNo = this.bookingForm.get('VoyageNo')?.value;
            if (currentVoyageNo) {
              const existingVoyage = this.voyageList.find(v => v.VoyageNo === currentVoyageNo);
              if (existingVoyage) {
                this.onVoyageChange(existingVoyage);
              }
            }
          } else {
            // Auto-select if only one voyage exists in create mode
            if (this.voyageList.length === 1) {
              this.onVoyageChange(this.voyageList[0]);
            }
          }
        } else {
          this.appSettingService.showError("Error loading sailing schedules.");
        }
      },
      (err) => {
        console.error('Error loading voyages:', err);
        this.appSettingService.showError("Error loading sailing schedules.");
      }
    );
  }

  toggleHeaderCheckboxes(event: Event, fieldName: string) {
    if (fieldName) {
      const element = event.target as HTMLInputElement;
      element.checked = !element.checked;
      this.bookingForm.get(`${fieldName}`)?.setValue(element.checked);
    }
  }

  // ************ END OF HEADER RELATED FUNCTIONS *************


  //  Product Form Related Functions

  handleProductChange(product: any, productIndex: number, cargoIndex: number = -1) {
    const productGroup = cargoIndex < 0
      ? this.bookingProducts.at(productIndex) as FormGroup
      : this.bookingCargoProducts(cargoIndex).at(productIndex) as FormGroup;
    if (!product) {
      productGroup.patchValue({
        IsHaz: false,
        ImcoClass: '',
        UnNo: '',
        PkgGroup: ''
      })
      return;
    }
    productGroup.patchValue({
      IsHaz: product.ProductType === "2",
      ImcoClass: product.IMOClass,
      UnNo: product.UNNo,
      PkgGroup: product.PackingGroup
    })
    if (product.ProductType === "2") {
      productGroup.get('ImcoClass')?.enable();
      productGroup.get('UnNo')?.enable();
      productGroup.get('PkgGroup')?.enable();
    } else {
      productGroup.get('ImcoClass')?.disable();
      productGroup.get('UnNo')?.disable();
      productGroup.get('PkgGroup')?.disable();
    }
  }

  onImcoChange(productIndex: number, item: any, cargoIndex: number = -1) {
    const productForm = cargoIndex < 0
      ? this.bookingProducts.at(productIndex) as FormGroup
      : this.bookingCargoProducts(cargoIndex).at(productIndex) as FormGroup;
    if (!item) {
      productForm.patchValue({
        UnNo: null,
        PkgGroup: null
      })
      return;
    }
    productForm.patchValue({
      UnNo: item.ImcoUn,
      PkgGroup: item.PackingGroup
    })
  }

  onHazChange(productIndex: number, event: any, cargoIndex: number = -1) {
    const element = event.target as HTMLInputElement;
    const control = cargoIndex < 0
      ? this.bookingProducts.at(productIndex).get('IsHaz')
      : this.bookingCargoProducts(cargoIndex).at(productIndex).get('IsHaz');
    if (event instanceof KeyboardEvent) {
      element.checked = !element.checked;
    }
    control.setValue(element.checked);
    this.toggleHazProduct(productIndex, cargoIndex);
  }

  toggleHazProduct(productIndex: number, cargoIndex: number = -1) {
    const productGroup = cargoIndex < 0
      ? this.bookingProducts.at(productIndex)
      : this.bookingCargoProducts(cargoIndex).at(productIndex);
    const isHaz = productGroup.get('IsHaz')?.value;
    if (isHaz) {
      productGroup.get('ImcoClass')?.enable();
      productGroup.get('PkgGroup')?.enable();
      productGroup.get('UnNo')?.enable();
      productGroup.get('ImcoClass')?.setValidators(Validators.required);
      productGroup.get('PkgGroup')?.setValidators(Validators.required);
      productGroup.get('UnNo')?.setValidators(Validators.required);
    } else {
      productGroup.get('ImcoClass')?.setValue(null);
      productGroup.get('UnNo')?.setValue('');
      productGroup.get('PkgGroup')?.setValue('');
      productGroup.get('ImcoClass')?.clearValidators();
      productGroup.get('ImcoClass')?.disable();
      productGroup.get('UnNo')?.clearValidators();
      productGroup.get('UnNo')?.disable();
      productGroup.get('PkgGroup')?.clearValidators();
      productGroup.get('PkgGroup')?.disable();
    }
  }

  deleteBookingProduct(productIndex: number, BookingProductSid?: number, cargoIndex: number = -1) {
    const productArr = cargoIndex < 0 ? this.bookingProducts : this.bookingCargoProducts(cargoIndex);
    const productToDelete = productArr.at(productIndex);
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    if (BookingProductSid) {
      this.operationService.deleteBookingProduct(BookingProductSid,updatedBy).subscribe(
        (resp: any) => {
          if (resp.status) {
            productArr.removeAt(productIndex);
            if (cargoIndex < 0) {
              this.productDataLength = this.bookingProducts.length;
            }
            this.appSettingService.showSuccess('Product Deleted Successfully');
            // this.adjustPageAfterDelete();
            // this.updateProductPagination();
            this.handleProductRelatedCalculation(cargoIndex);
          } else {
            this.appSettingService.showError("Error deleting product.");
          }
        })
    } else {
      productArr.removeAt(productIndex);
      if (cargoIndex < 0) {
        this.productDataLength = this.bookingProducts.length;
      }
      this.appSettingService.showSuccess('Product Deleted Successfully');
      // this.adjustPageAfterDelete();
      this.handleProductRelatedCalculation(cargoIndex);
    }
    productArr.updateValueAndValidity();
    // this.updateProductPagination();
  }

  adjustPageAfterDelete() {
    const totalPages = Math.ceil(this.productDataLength / this.pageSize);
    if (this.page > totalPages && totalPages > 0) {
      this.page = totalPages;
    } else if (this.productDataLength === 0) {
      this.page = 1;
    }
  }

  updateProductPagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.slicedProductArr = this.bookingProducts.controls.slice(start, end);
  }

  handleProductRelatedCalculation(cargoIndex: number = -1) {
  if (this.isPatching) {
    return; // Skip ALL changes during patching
  }
  
  const targetCargo = cargoIndex < 0 ? this.cargoForm : (this.bookingCargo.at(cargoIndex) as FormGroup);

  if (!targetCargo) {
    return;
  }

  const productArr = cargoIndex < 0
    ? this.bookingProducts
    : (targetCargo.get('bookingProducts') as FormArray);

  if (productArr.length === 0) {
    if (!this.isPatching) {
      targetCargo.get('NoOfPackage')?.enable();
      targetCargo.get('NoOfPackage')?.setValue(0);
      targetCargo.get('GrossWeight')?.enable();
      targetCargo.get('GrossWeight')?.setValue(0);
      targetCargo.get('NetWeight')?.enable();
      targetCargo.get('NetWeight')?.setValue(0);
      targetCargo.get('Volume')?.enable();
      targetCargo.get('Volume')?.setValue(0);
      targetCargo.get('Volumetric')?.enable();
      targetCargo.get('Volumetric')?.setValue(0);
      targetCargo.get('ChargeableWeight')?.enable();
      targetCargo.get('ChargeableWeight')?.setValue(0);
    }
    return;
  }

  // Calculate totals from existing product values
  let totalNoOfPkg = 0;
  let totalGrossWeight = 0;
  let totalNetWeight = 0;
  let totalVolume = 0;
  let totalVolumetric = 0;

  productArr.controls.forEach((product: FormGroup) => {
    totalNoOfPkg += Number(product.get('ExternlQty')?.value) || 0;
    totalGrossWeight += Number(product.get('GrossWeight')?.value) || 0;
    totalNetWeight += Number(product.get('NetWeight')?.value) || 0;
    totalVolume += Number(product.get('Volume')?.value) || 0;
    totalVolumetric += Number(product.get('Volumetric')?.value) || 0;
  });

  // Update cargo form totals
  targetCargo.get('NoOfPackage')?.setValue(
    totalNoOfPkg > 0 ? Number(totalNoOfPkg.toFixed(this.decimalAfterPrecision)) : '',
    { emitEvent: false }
  );
  targetCargo.get('GrossWeight')?.setValue(
    totalGrossWeight > 0 ? Number(totalGrossWeight.toFixed(this.decimalAfterPrecision)) : '',
    { emitEvent: false }
  );
  targetCargo.get('NetWeight')?.setValue(
    totalNetWeight > 0 ? Number(totalNetWeight.toFixed(this.decimalAfterPrecision)) : '',
    { emitEvent: false }
  );

  // Keep cargo CBM fields in sync with the product rows for every cargo mode.
  targetCargo.get('Volume')?.setValue(
    totalVolume > 0 ? Number(totalVolume.toFixed(this.decimalAfterPrecision)) : '',
    { emitEvent: false }
  );
  targetCargo.get('Volumetric')?.setValue(
    totalVolumetric > 0 ? Number(totalVolumetric.toFixed(this.decimalAfterPrecision)) : '',
    { emitEvent: false }
  );

  // Disable fields since they're calculated from products
  targetCargo.get('NoOfPackage')?.disable({ emitEvent: false });
  targetCargo.get('GrossWeight')?.disable({ emitEvent: false });
  targetCargo.get('NetWeight')?.disable({ emitEvent: false });
  targetCargo.get('Volume')?.disable({ emitEvent: false });
  targetCargo.get('Volumetric')?.disable({ emitEvent: false });
  
  // Recalculate chargeable weight based on new totals

  this.calculateChargeableWeight(targetCargo);
}

private getCargoIndexForProductForm(productForm: FormGroup): number {
  const productArray = productForm.parent as FormArray | null;
  const cargoGroup = productArray?.parent as FormGroup | null;

  if (!cargoGroup) {
    return -1;
  }

  const cargoIndex = this.bookingCargo.controls.indexOf(cargoGroup);
  return cargoIndex >= 0 ? cargoIndex : -1;
}

  // ************ END OF PRODUCT RELATED FUNCTIONS *************

  //  Other Form Related Functions

  setAddressOthers(controlName: string, item: any) {
    this.o[controlName]?.setValue(item ? item.Address : '')
  }

  handleCFSOrYard() {
    const stuffingAt = this.cargoForm.get('StuffingAt')?.value;

    

    if (!this.selectedDepartment) {
      this.YardCFSLabel = "CFS";
      this.currentYardCFSType = null;

      return;
    }

    const isFCL = this.selectedFCLLCL === "FCL";
    const isExport = this.selectedDepartment?.ExportImport === "Export";
    const isLCL = this.selectedFCLLCL === "LCL";
    const isAIR = this.selectedFCLLCL === "AIR";


    // Determine Yard/CFS type based on business rules
    this.o['YardCFS']?.reset();
    if (isFCL && isExport) {
      if (stuffingAt === "Factory") {
        // FCL Export with Factory Stuffing -> Container Yard
        this.YardCFSLabel = "Yard";
        // this.currentYardCFSType = 'yard';
      } else {
        this.YardCFSLabel = "CFS";
        // this.currentYardCFSType = null;
      }
    }

    else {

      this.YardCFSLabel = "CFS";

    }

  

  }


  // ************ END OF CONNECTION RELATED FUNCTIONS *************

  syncFormValueWithRateComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.b['DepartmentMasterSid']?.value;
    const BookingNumber = this.b['BookingNo']?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const selectedPOO = this.b['POO']?.value;
    const selectedPOL = this.b['POL']?.value;
    const selectedPOD = this.b['POD']?.value;
    const selectedFPD = this.b['FPD']?.value;
    const carrierName = this.b['CarrierName']?.value;
    const selectedCarrier = this.carrierList.find(carrier => carrier.CustomerName === carrierName);
    const Carrier = selectedCarrier?.CustomerMasterSid || this.bookingData?.CarrierSid || null;
    const IncoTerms = this.b['IncoTerms']?.value || null;
    const EffectiveDate = this.b['BookingDateTime']?.value;
    const ExpiredDate = this.b['BookingDateTime']?.value;
    const PORSid = (this.portList.find(p => p.PortCode === selectedPOO)?.PortMasterSid)
    const POLSid = (this.portList.find(p => p.PortCode === selectedPOL)?.PortMasterSid)
    const PODSid = (this.portList.find(p => p.PortCode === selectedPOD)?.PortMasterSid)
    const FPODSid = (this.portList.find(p => p.PortCode === selectedFPD)?.PortMasterSid)
    const CargoType = this.c['CargoType']?.value;
    const NetWeight = this.c['NetWeight']?.value;
    const GrossWeight = this.c['GrossWeight']?.value;
    const NoofContainers = this.c['NoofContainers']?.value;
    const Volume = this.c['Volume']?.value;
    const Volumetric = this.c['Volumetric']?.value;
    const ShipmentTerms = this.c['ShipmentTerms']?.value;
    const ChargeableWeight = this.c['ChargeableWeight']?.value;

    const CustomerMasterSid = this.b['CustomerMasterSid']?.getRawValue();
    const CustomerBranchSid = this.b['CustomerBranchSid']?.getRawValue();
    const BookingHeaderSid = this.BookingHeaderSid || this.bookingData?.BookingHeaderSid || this.b['BookingHeaderSid']?.value;
    const status=this.b['status']?.value;
    const HBLNo = this.b['HBLNo']?.getRawValue()||'';
    const HouseJobSid = this.b['HouseJobSid']?.getRawValue()||'';
    const DestinationAgent = this.b['DestinationAgent']?.value || null;
    const AgentName = this.getDestinationAgent(DestinationAgent) || null;
    const salesmanSid = this.b['SalesmanSid']?.value || '';
    const salesmanName = this.salesmanList.find(s => s.UserMasterSid === salesmanSid)?.userName || '';
    const cargoItems = this.bookingCargo.controls.map((cargoCtrl: any) => {
      const containerTypeSid = cargoCtrl.get('ContainerType')?.value;
      const containerTypeName = this.getContainerTypeDisplayLabel(containerTypeSid);

      return {
        CargoType: cargoCtrl.get('CargoType')?.value,
        ContainerType: containerTypeSid,
        ContainerTypeName: containerTypeName,
        GrossWeight: cargoCtrl.get('GrossWeight')?.value,
        Volume: cargoCtrl.get('Volume')?.value,
        NoofContainers: cargoCtrl.get('NoofContainers')?.value,
        ChargeableWeight: cargoCtrl.get('ChargeableWeight')?.value,
        ShipmentTerms: cargoCtrl.get('ShipmentTerms')?.value,
      };
    });
    const containerTypeSid = cargoItems.find((cargo: any) => cargo.ContainerType)?.ContainerType || null;

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      BookingNumber,
      status,
      HBLNo,
      HouseJobSid,
      ParentSid : BookingHeaderSid,
      CustomerMasterSid,
      CustomerBranchSid,
      departmentName,
      Segment: this.selectedFCLLCL,
      PORSid,
      POLSid,
      PODSid,
      FPODSid,
      PORCode: selectedPOO || null,
      POLCode: selectedPOL || null,
      PODCode: selectedPOD || null,
      FPODCode: selectedFPD || null,
      EffectiveDate,
      ExpiredDate,
      CargoType,
      Carrier,
      CarrierName: carrierName || null,
      Agent: DestinationAgent,
      AgentName,
      IncoTerms,
      ContainerType: containerTypeSid,
      GrossWeight,
      NetWeight,
      Volume,
      Volumetric,
      ShipmentTerms,
      NoofContainers,
      ChargeableWeight,
      cargoItems,
      countryOfCompany : this.countryOfCompany,
      SalesmanName : salesmanName
    }
  }


  isSendingMail = false;

  async sendManualMail(): Promise<void> {
    this.isSendingMail = true;
    this.spinner.show();
    try {
      const pdfBlob = await this.generateBookingPdfBlobForMail('booking');
      let attachmentFile: File | undefined;
      if (pdfBlob) {
        const attachmentName = String(this.bookingData?.BookingNo || 'Booking').replace(/[\\/:*?"<>|]+/g, '_') + '.pdf';
        attachmentFile = new File([pdfBlob], attachmentName, { type: 'application/pdf' });
      }
      const menuMasterSid = this.getCurrentBookingMenuMasterSid();
      const customerBranchSid =
        this.bookingData?.CustomerBranchSid ||
        this.bookingHeader?.CustomerBranchSid ||
        this.bookingForm?.get('CustomerBranchSid')?.getRawValue() ||
        this.selectedCustomerBranch?.CustomerBranchSid ||
        null;
      const customerMasterSid =
        this.bookingData?.CustomerMasterSid ||
        this.bookingHeader?.CustomerMasterSid ||
        this.bookingForm?.get('CustomerMasterSid')?.getRawValue() ||
        this.selectedCustomerBranch?.CustomerMasterSid ||
        null;
      const recipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
        customerBranchSid,
        customerMasterSid,
        menuMasterSid
      });
      const organizationEmail = recipients.toEmail.join(', ');
      const ccEmail = Array.from(
        new Set(
          (recipients.ccEmail || [])
            .map((email: string) => (email || '').trim())
            .filter((email: string) => !!email)
        )
      ).join(', ');

      this.emailTriggerService.triggerManualEmails({
        companyId: this.currentCompany.CompanyMasterSid,
        branchId: this.currentBranch.BranchMasterSid,
        menuMasterSid,
        action: 'UPDATE',
        attachmentFile,
        context: {
          allowManualEmailEntry: true,
          requireToEmail: false,
          menuMasterSid,
          resourceSid: this.bookingData?.BookingHeaderSid || this.bookingHeader?.BookingHeaderSid,
          BookingNo: this.bookingData?.BookingNo,
          date: this.datePipe.transform(this.bookingData?.BookingDateTime),
          POO: this.getFormattedPort(this.bookingData?.POO),
          POL: this.getFormattedPort(this.bookingData?.POL),
          POD: this.getFormattedPort(this.bookingData?.POD),
          FPD: this.getFormattedPort(this.bookingData?.FPD),
          customerName: this.bookingData?.CustomerName,
          shipperName: this.bookingData?.ShipperName,
          consigneeName: this.bookingData?.ConsigneeName,
          userName: this.userData?.userName,
          ShipmentNo: this.bookingData?.ShipmentNo,
          toEmail: organizationEmail,
          ccEmail,
          organizationEmail,
          customerEmail: organizationEmail,
          customerBranchSid,
          customerMasterSid
        }
      });
      const payload = {
        tableName: 'BookingHeader',
        recordId: String(this.bookingData?.BookingHeaderSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Send Mail'
        },
        newVal: {
          Email: 'Booking Confirmation Mail Send'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } finally {
      this.isSendingMail = false;
      this.spinner.hide();
    }
  }

  navigateBack() {
    this.router.navigate(['operation/booking/list']);
  }
  
  selectedTab = 'Shipment';
  isQuickFormExpanded = false;

  resetForm() {
    if(this.isEditMode){
      this.patchValues(this.bookingData)
    }else{
    const today = new Date();
    this.bookingForm.reset({
    status: 'Active',
    BookingDateTime: today, // Reset to today's date
    NominatedBy: 'Self',
    BookingStatus: 'Booked',
    Coload: false,
    ShipmentType: false
    });

    this.filteredPorts = [];
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFPOD = [];
    this.vesselList = [];
    this.voyageList = [];

    this.resetTriggerConnection = !this.resetTriggerConnection;
    this.connectionResult = [];
    this.resetTriggerRate = !this.resetTriggerRate;
    this.rateResult = [];
    this.resetTriggerMilestone = !this.resetTriggerMilestone;
    this.milestoneResult = [];

    this.detailForm.reset();
    (this.detailForm.get('bookingCargo') as FormArray).clear();
    (this.detailForm.get('bookingProducts') as FormArray).clear();

    this.bookingCargoExpanded = [];
    this.bookingCargoActiveIndex = 0;
    this.addBookingCargo(undefined, true);
    this.slicedProductArr = [];
    this.productDataLength = 0;

    this.cargoForm.reset();
    this.otherForm.reset();
    this.croForm.reset();
  }
  }
  get cr(): { [key: string]: AbstractControl<any, any> } {
  return this.croForm.controls || {}
}

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }



  showInfo() {
    if (!this.bookingData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.bookingData;
    modalRef.componentInstance.idLabel = 'Booking Id';
    modalRef.componentInstance.idValue = this.bookingData?.BookingHeaderSid;
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const departmentSid = this.bookingData?.DepartmentMasterSid;
    const pol = this.bookingData?.POL;
    const pod = this.bookingData?.POD;
    const carrier = this.bookingData?.CarrierSid || null;
    const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.bookingData?.BookingHeaderSid
  };
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DepartmentMasterSid: departmentSid,
      POL: pol,
      POD: pod,
      Carrier: carrier,
      DocumentSid: this.bookingData?.BookingHeaderSid
    };
      const getTermText = (item: any): string =>
    (item?.Terms || item?.TandC || '').trim().toLowerCase();

  const isSameTerm = (a: any, b: any): boolean =>
    (
      a?.TandCTransactionSid &&
      b?.TandCTransactionSid &&
      a.TandCTransactionSid === b.TandCTransactionSid
    ) ||
    (
      getTermText(a) === getTermText(b) &&
      (a?.DocumentSid ?? this.bookingData?.BookingHeaderSid ?? null) ===
      (b?.DocumentSid ?? this.bookingData?.BookingHeaderSid ?? null)
    );
     const openModal = (terms: any[]) => {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = terms || [];
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.bookingData?.BookingHeaderSid;
          modalRef.componentInstance.DepartmentMasterSid = departmentSid;
          modalRef.componentInstance.POL = pol;
          modalRef.componentInstance.POD = pod;
          modalRef.componentInstance.Carrier = carrier;
          modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
     };
   if (this.isTermsAndConditionsEnabled) {
    forkJoin({
      tandc: this.masterService.getTandC(transactionPayload),
      defaults: this.masterService.getTandCByCondition(payload)
    }).subscribe(
      (resp: any) => {
        const tandcData = resp?.tandc?.status ? (resp.tandc.data || []) : [];
        const defaultData = resp?.defaults?.status ? (resp.defaults.data || []) : [];

        const combined = [...tandcData, ...defaultData].filter(
          (item: any, index: number, arr: any[]) =>
            index === arr.findIndex((x: any) => isSameTerm(x, item))
        );

        this.TandCList = combined;
        this.printTermsList = combined;
        openModal(this.TandCList);
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
    return;
  }
    this.masterService.getTandC(transactionPayload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          this.printTermsList = this.getUniqueTerms(this.TandCList);
          openModal(this.TandCList);
        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  private getTermDisplayText(term: any): string {
    return (term?.TandC || term?.Terms || term?.content || '').trim();
  }

  private isSameTerm(a: any, b: any): boolean {
    const aText = this.getTermDisplayText(a).toLowerCase();
    const bText = this.getTermDisplayText(b).toLowerCase();

    return (
      (a?.TandCTransactionSid &&
        b?.TandCTransactionSid &&
        a.TandCTransactionSid === b.TandCTransactionSid) ||
      (aText !== '' &&
        aText === bText &&
        (a?.DocumentSid ?? this.bookingData?.BookingHeaderSid ?? null) ===
          (b?.DocumentSid ?? this.bookingData?.BookingHeaderSid ?? null))
    );
  }

  private getUniqueTerms(terms: any[]): any[] {
    return (terms || []).filter((item: any, index: number, arr: any[]) => {
      const text = this.getTermDisplayText(item);
      if (!text) return false;

      return index === arr.findIndex((existing: any) => this.isSameTerm(existing, item));
    });
  }

  private async prepareTermsForPrint(): Promise<any[]> {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));

    if (!this.bookingData || !this.currentCompany?.CompanyMasterSid || !this.currentMenuId) {
      this.printTermsList = this.getUniqueTerms(this.TandCList);
      return this.printTermsList;
    }

    const transactionPayload = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.bookingData?.BookingHeaderSid
    };

    const payload = {
      MenuMasterSid: this.currentMenuId,
      DepartmentMasterSid: this.bookingData?.DepartmentMasterSid ?? null,
      POL: this.bookingData?.POL ?? null,
      POD: this.bookingData?.POD ?? null,
      Carrier: this.bookingData?.CarrierSid || null,
      DocumentSid: this.bookingData?.BookingHeaderSid
    };

    try {
      const savedTermsResponse = await firstValueFrom(this.masterService.getTandC(transactionPayload));
      const savedTerms = savedTermsResponse?.status ? (savedTermsResponse.data || []) : [];

      if (!this.isTermsAndConditionsEnabled) {
        this.printTermsList = this.getUniqueTerms(savedTerms);
        this.TandCList = this.printTermsList;
        return this.printTermsList;
      }

      const defaultTermsResponse = await firstValueFrom(this.masterService.getTandCByCondition(payload));
      const defaultTerms = defaultTermsResponse?.status ? (defaultTermsResponse.data || []) : [];
      const combinedTerms = this.getUniqueTerms([...savedTerms, ...defaultTerms]);

      this.printTermsList = combinedTerms;
      this.TandCList = combinedTerms;
      return combinedTerms;
    } catch (error) {
      console.error('Error preparing booking terms for print:', error);
      this.printTermsList = this.getUniqueTerms(this.TandCList);
      return this.printTermsList;
    }
  }

  async openEmail() {
    await this.sendEmail('booking');
  }

  openAuthority() {
    if (!this.bookingData) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    })
  }
  toggleQuickForm() {
    this.isQuickFormExpanded = !this.isQuickFormExpanded;
  }


  openProfitModal(content: any) {
    const modalRef = this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,

    })
  }

  openEDoc() {
    if (!this.bookingData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    })
 const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid: this.MenuMasterSid,
    DocumentSid: this.BookingHeaderSid
  }
      this.commonService.documentData.set(data)
}

openDocRef() {
    const currentMenuId = this.bookingData?.MenuMasterSid;
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);
    modalRef.componentInstance.DocumentSid = this.BookingHeaderSid;
  }



  openFollowup() {
    if (!this.bookingData) return;
    const POL = this.bookingHeader?.POL;
    const POD = this.bookingHeader?.POD;
    const FPD = this.bookingHeader?.FPD;
    const formattedPOL = this.getFormattedPort(POL);
    const formattedPOD = this.getFormattedPort(POD);
    const formattedFPD = this.getFormattedPort(FPD);
    this.followupModalRef = this.modalService.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    this.followupModalRef.componentInstance.documentSid = this.bookingData?.BookingHeaderSid;
    this.followupModalRef.componentInstance.menuMasterSid = this.MenuMasterSid;
    this.followupModalRef.componentInstance.parentSubject = `__SUBJECT__ for Booking No."${this.bookingData.BookingNo}"`;
    this.followupModalRef.componentInstance.parentMailbodyTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <p>Dear Sir/Madam,</p>
      <p>Kindly do the needful for "__SUBJECT__" Booking No."${this.bookingData.BookingNo}" Dated:${new Date(this.bookingData.BookingDateTime).toLocaleDateString()} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''}</p>
      <p>Best Regards,</p>
      <p>${this.userData['userEmail']}</p>
    </div>
  `;

    this.initializeMilestoneContentForFollowup();

    this.followupModalRef.componentInstance.reloadMilestone.subscribe(() => {
      this.milestoneComponent.loadShipmentMilestones(this.bookingData?.ShipmentNo);
    });

    this.followupModalRef.result.then(
      (result) => console.log('Modal closed:', result),
      (dismissReason) => console.log('Modal dismissed:', dismissReason)
    );

  }

  initializeMilestoneContentForFollowup() {
    let validDepartment = false;
    let validJobType = false;
    if (this.selectedDepartment?.ExportImport === "Export") {
      validDepartment = true;
    }

    const currentJobType = this.b['JobType']?.value;
    if (currentJobType === "Export") {
      validJobType = true;
    }

    const allMilestones = this.milestoneComponent.allMilestones || [];
    const cfuMilestoneId = allMilestones.find(m => m.MilestoneCode === "CFU")?.MilestoneMasterSid;
    const existingMilestone = this.milestoneResult.find(m => m.MilestoneMasterSid === cfuMilestoneId);
    // console.log("AutoInsert Or Not", {
    //   ImportOrExport: this.selectedDepartment?.ExportImport,
    //   validDepartment,
    //   currentJobType,
    //   validJobType,
    //   allMilestones,
    //   tabValue: this.milestoneResult,
    //   existingMilestone,
    //   validMilestone: existingMilestone ? false : true,
    //   finalDecision: validDepartment && validJobType && !existingMilestone
    // })

    this.followupModalRef.componentInstance.autoInsertMilestone = validDepartment && validJobType && !existingMilestone;

    const milestonePayload: SafeInsertShipmentMilestone = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentName: this.selectedDepartment?.departmentName,
      JobType: currentJobType,
      MilestoneCode: "CFU",
      MilestoneDate: getDefaultTodayDate(),
      ShipmentNo: this.bookingData?.ShipmentNo,
      createdBy: this.userData?.userEmail,
      Remarks: `Cargo Followup has been sent on ${(new Date().toISOString()).split('T')[0]}`
    };
    this.followupModalRef.componentInstance.milestonePayload = milestonePayload;
  }
 
 

  openConnectionModal(content: any) {
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }
  openMilestoneModal(content: any) {
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    })
  }

  openAuditLogs() {
    if (!this.BookingHeaderSid) return;
    const modalRef = this.modalService.open(AuditLogComponent, {
    centered: true,
    scrollable: true,
    size: 'xl',
    windowClass: 'audit-log-modal'
  });
  modalRef.componentInstance.title = 'Booking Logs';
  modalRef.componentInstance.tableName = 'BookingHeader';
  modalRef.componentInstance.recordId = this.BookingHeaderSid.toString();
  modalRef.componentInstance.screenName = 'Booking';
  }

  getContainerDisplay(): string {
    const containerCount = this.c['NoofContainers']?.value;
    const containerType = this.c['ContainerType']?.value;
    const containerTypeSize = (this.containerTypeList.find(c => c.ContainerName === containerType)?.ContainerSize);
    if (containerCount && containerTypeSize) {
      return `${containerCount} x ${containerTypeSize}`;
    }
    return '-';
  }

  toggleMinimizeMaximize() {
    toggleFullScreen();
  }

  openUploadModal() {
    this.uploadModal.openModal(this.uploadModal.uploadModalTemplate);
  }


  onFileProcessed(result: any) {

    // Check if we have multi-sheet booking data
    if (result.type === 'excel' && result.isMultiSheetStructure && result.dataType === 'bookings') {
      this.parsedBookings = result.data[0];
      this.showParsedData = true;

      this.patchValues(this.parsedBookings);
    } else {
      this.appSettingService.showWarning('No booking structure found in file');
    }
  }

  onUploadError(error: string) {
    this.appSettingService.showError('Failed to process Excel file. Please check that all required sheets exist with correct column names.');
  }

  downloadParsedData() {
    if (this.parsedBookings.length === 0) return;

    const dataStr = JSON.stringify(this.parsedBookings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parsed-bookings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  clearParsedData() {
    this.parsedBookings = [];
    this.showParsedData = false;
    this.uploadResult = null;
  }

  reportProducts(): void {
    const formattedData = this.slicedProductArr.map(product => ({
      ProductName: product.value.ProductName || '',
      ShippingBillNo: product.value.ShippingBillNo || '',
      ShippingBillDate: this.datePipe.transform(product.value.ShippingBillDate) || '',
      ExternalPkg: this.getPackageTypeCode(product.value.ExternaPkg) || '',
      ExternalQty: product.value.ExternlQty || '',
      GrossWeight: product.value.GrossWeight || '',
      NetWeight: product.value.NetWeight || '',
      Volume: product.value.Volume || '',
      Volumetric: product.value.Volumetric || '',
      CargoRecDate: this.datePipe.transform(product.value.CargoRecDate) || ''
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';

    this.exportExcelService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ProductName', label: 'Commodity' },
        { key: 'ShippingBillNo', label: 'Shipping Bill No' },
        { key: 'ShippingBillDate', label: 'Date' },
        { key: 'ExternalPkg', label: 'Package Type' },
        { key: 'ExternalQty', label: 'No of Pkg' },
        { key: 'GrossWeight', label: 'Gross Weight' },
        { key: 'NetWeight', label: 'Net Weight' },
        { key: 'Volume', label: 'CBM' },
        { key: 'Volumetric', label: 'Volumetric' },
        { key: 'CargoRecDate', label: 'Cargo Received Date' }
      ],
      fileName: 'Booking-Products-Report',
      title: companyName
    });
  }

getFormattedPort(code: string): string {
  if (!code) return '';

  const port = this.portList.find(p => p.PortCode === code);
  const portName = port?.PortName;

  return portName ? `${portName} - ${code}` : code;
}

  

  getFPDETA() {
    const POD = this.bookingHeader?.POD;
    const FPD = this.bookingHeader?.FPD;
    const connections: any[] = this.bookingHeader?.bookingConnection || [];
    if (POD === FPD) {
      return this.datePipe.transform(this.bookingHeader?.ETA);
    } else {
      if (connections) {
        return this.datePipe.transform(connections[connections.length - 1]?.ETA);
      } else {
        return 'N/A'
      }
    }
  }

  reportAndEmailModel(content: TemplateRef<any>) {
    this.prepareTermsForPrint();
    this.modalService.open(content, {
      size: 'xl',
      scrollable: true,
    });
  }

    barCode(content: TemplateRef<any>) {
    this.modalService.open(content, {
      scrollable: true,
       windowClass: 'barcode-card-modal'
    });
  }

  // generatePDFBlob(): Promise<Blob> {
  //   return new Promise((resolve, reject) => {
  //     const element = document.getElementById('pdfContent');

  //     const opt: Html2PdfOptions = {
  //       margin: 0.5,
  //       filename: (this.bookingHeader?.BookingNo || 'booking') + '.pdf',
  //       image: { type: 'jpeg', quality: 0.98 },
  //       html2canvas: { scale: 2 },
  //       jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  //     };

  //     if (!element) return reject('No element found');

  //     html2pdf()
  //       .from(element)
  //       .set(opt)
  //       .outputPdf('blob')
  //       .then((blob: Blob) => resolve(blob))
  //       .catch((err: any) => reject(err));
  //   });
  // }

  // downloadPDF(): void {
  //   this.spinner.show();
  //   const element = document.getElementById('pdfContent');



  //   const opt: Html2PdfOptions = {
  //     margin: 0.5,
  //     filename: (this.bookingHeader?.BookingNo || 'booking') + '.pdf',
  //     image: { type: 'jpeg', quality: 0.98 },
  //     html2canvas: { scale: 2 },
  //     jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  //   };

  //   if (!element) {
  //     console.error('No element found');
  //     return;
  //   }

  //   html2pdf().from(element).set(opt).save();
  //   this.spinner.hide();
  // }


  // async sendEmail() {
  //   try {
  //     this.spinner.show();
  //     const pdfBlob = await this.generatePDFBlob();

  //     const formData = new FormData();
  //     const toEmailSet = new Set<string>();

  //     if (this.bookingHeader?.Email) {
  //       toEmailSet.add(this.bookingHeader.Email);
  //     }
  //     if (toEmailSet.size === 0 && this.bookingHeader?.CustomerBranchSid) {
  //       const resp: any = await firstValueFrom(
  //         this.operationService.getCustomerBranchEmail(this.bookingHeader.CustomerBranchSid)
  //       );

  //       if (resp?.status && resp.data?.Email) {
  //         toEmailSet.add(resp.data.Email);
  //       }
  //     }

  //     if (toEmailSet.size === 0) {
  //       this.appSettingService.showError('To Email is missing.')
  //       this.spinner.hide();
  //       return;
  //     }

  //     const toEmail = Array.from(toEmailSet);
  //     toEmail.forEach(email => {
  //       if (email) {
  //         formData.append("EmailTo[]", email);
  //       }
  //     });
  //     const ccEmailSet = new Set<string>([this.userData['userName']]);
  //     const ccEmail = Array.from(ccEmailSet);

  //     ccEmail.forEach(email => {
  //       if (email) {
  //         formData.append("EmailCC[]", email);
  //       }
  //     });
  //     const POL = this.bookingHeader?.POL;
  //     const POD = this.bookingHeader?.POD;
  //     const FPD = this.bookingHeader?.FPD;
  //     const formattedPOL = this.getFormattedPort(POL);
  //     const formattedPOD = this.getFormattedPort(POD);
  //     const formattedFPD = this.getFormattedPort(FPD);
  //     formData.append('Subject', `Booking No.${this.bookingHeader.BookingNo} Date:${this.datePipe.transform(this.bookingHeader?.BookingDateTime)} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`);
  //     formData.append('Mailbody', `
  //     <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
  //       <p>Dear Sir/Madam,</p>
  //       <p>Please find here enclosed the booking details as requested.</p>
  //       <p>Kindly review the details at your convenience.</p>
  //       <p>Looking forward to confirm cargo readyness.</p>
  //       <p>Best Regards,</p>
  //       <p>${this.userData['userName']}</p>
  //     </div>
  //   `);
  //     formData.append('file', pdfBlob, (this.bookingHeader?.bookingNumber || 'booking') + '.pdf');
  //     console.log(formData)
  //     this.operationService.bookingPrint(formData).subscribe((resp: any) => {
  //       this.spinner.hide();
  //       if (resp?.data) {
  //         this.appSettingService.showSuccess('Booking Print Sent successfully!');
  //       }
  //     }, error => {
  //       this.spinner.hide();
  //       this.appSettingService.showError('Failed to send email.');
  //     });
  //   } catch (error) {
  //     this.spinner.hide();
  //     console.error('PDF generation error:', error);
  //     this.appSettingService.showError('Error generating PDF.');
  //   }
  // }


  ngOnDestroy() {
    this.commonService.clearDocumentData()
    this.dataFromQuotation = null;
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }
  getFilteredNominationList() {
    const isShipmentTypeChecked = this.bookingForm.get('ShipmentType')?.value;
    if (isShipmentTypeChecked) {
      return this.nominationList.filter(item => item.name === 'Nomination');
    } else {
      return this.nominationList.filter(item => item.name === 'Self');
    }
  }

  onShipmentTypeChange() {
    const isShipmentTypeChecked = this.bookingForm.get('ShipmentType')?.value;

    if (isShipmentTypeChecked) {
      this.bookingForm.get('NominatedBy')?.setValue('Nomination');
    } else {
      this.bookingForm.get('NominatedBy')?.setValue('Self');
    }
  }

  existsInList(list: any[], value: any) {
    if (list) {
      return list.some(item => item.CustomerName === value);
    }
    return null;
  }
  private autoSetFreightTerms(incoTerm: string) {
    if (!incoTerm) {
      this.bookingForm.get('FreightTerms')?.setValue(null, { emitEvent: false });
      return;
    }

    const inco = this.incoList.find(item => item.IncoCode === incoTerm);
    if (inco && inco.OceanFreight) {
      this.bookingForm.get('FreightTerms')?.setValue(inco.OceanFreight, { emitEvent: false });
    }
  }
  onIncoTermsChange(selectedInco: any) {
    if (!selectedInco || this.isManualFreightChange) {
      return;
    }

    const inco = this.incoList.find(item =>
      item.IncoCode === selectedInco || item.IncoMasterSid === selectedInco
    );

    if (inco && inco.OceanFreight) {
      this.bookingForm.get('FreightTerms')?.setValue(inco.OceanFreight);
    }
  }

  onFreightTermsManualChange() {
    this.isManualFreightChange = true;
  }

  evaluateDropdownOrFreeText() {
    let response = this.bookingData;
    if (response?.ShipperName && !this.existsInList(this.shipperList, response.ShipperName)) {
      this.bookingForm.patchValue({ isShipperFreeText: true });
    }
    if (response?.ConsigneeName && !this.existsInList(this.consigneeList, response.ConsigneeName)) {
      this.bookingForm.patchValue({ isConsigneeFreeText: true });
    }
    if (response?.Notify && !this.existsInList(this.notifyList, response.Notify)) {
      this.bookingForm.patchValue({ isNotifyFreeText: true });
    }
    if (response?.CarrierName && !this.existsInList(this.carrierList, response.CarrierName)) {
      this.bookingForm.patchValue({ isCarrierFreeText: true });
    }
    if (response?.VesselName && !this.existsInList(this.vesselList, response.VesselName)) {
      this.bookingForm.patchValue({ isVesselFreeText: true });
    }
    
    if (response?.VoyageNo && !this.existsInList(this.voyageList, response.VoyageNo)) {
      this.bookingForm.patchValue({ isVoyageFreeText: true });
    }
  }

  setOrResetWeightError(formGroup: FormGroup) {
    const grossCtrl = formGroup.get('GrossWeight');
    const netCtrl = formGroup.get('NetWeight');
    const grossValue = formGroup.get('GrossWeight')?.value;
    const netValue = formGroup.get('NetWeight')?.value;

    if (!grossCtrl || !netCtrl) {
      return;
    }

    const grossErrors = { ...(grossCtrl.errors || {}) };
    const netErrors = { ...(netCtrl.errors || {}) };

    delete grossErrors['grossLessThanNet'];
    delete netErrors['netGreaterThanGross'];

    if (grossValue && netValue && Number(grossValue) < Number(netValue)) {
      grossErrors['grossLessThanNet'] = true;
      netErrors['netGreaterThanGross'] = true;
    }

    grossCtrl.setErrors(Object.keys(grossErrors).length ? grossErrors : null);
    netCtrl.setErrors(Object.keys(netErrors).length ? netErrors : null);
  }

  getBookingStatus() {
    return this.bookingForm.get('status')?.value;
  }


// async downloadPDF() {
//   this.spinner.show();
//   try {
//     const bookingNumber = this.bookingForm.get('BookingNumber')?.value || 'Booking';
    
//     await this.pdfService.downloadBalancedPDF(
//       'printContent',
//       `Booking_${bookingNumber}`,
//       () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
//       (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
//     );
//   } finally {
//     this.spinner.hide();
//   }
// }
    
          // async generatePDFBlob(): Promise<Blob | null> {
          //   const printContent = document.getElementById('printContent');
          //   if (!printContent) {
          //     return null;
          //   }
        
          //   try {
          //     const canvas = await html2canvas(printContent, {
          //       scale: 2,
          //       useCORS: true,
          //       logging: false,
          //       backgroundColor: '#ffffff'
          //     });
        
          //     const imgWidth = 210;
          //     const pageHeight = 297;
          //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
          //     let heightLeft = imgHeight;
          //     let position = 0;
        
          //     const pdf = new jsPDF('p', 'mm', 'a4');
          //     const imgData = canvas.toDataURL('image/png');
        
          //     pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          //     heightLeft -= pageHeight;
        
          //     while (heightLeft > 0) {
          //       position = heightLeft - imgHeight;
          //       pdf.addPage();
          //       pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          //       heightLeft -= pageHeight;
          //     }
        
          //     return pdf.output('blob');
          //   } catch (error) {
          //     console.error('Error generating PDF blob:', error);
          //     return null;
          //   }
          // }

  /**
* Captures the current state of all forms and related data properties.
* A short delay ensures all data bindings are synchronized before capture.
*/
  private captureInitialFormState(): void {
    // Use a small timeout to ensure the form values are fully settled after patching.
    setTimeout(() => {
      this.initialFormValue = this.getCurrentFormState();
    }, 500);
  }

  /**
   * Gathers the raw values from all forms and child component outputs
   * into a single object for state comparison.
   * @returns A single object representing the current state of the page.
   */
  private getCurrentFormState(): any {
    return {
      bookingForm: this.bookingForm.getRawValue(),
      cargoForm: this.cargoForm.getRawValue(),
      otherForm: this.otherForm.getRawValue(),
      croForm: this.croForm.getRawValue(), 
      detailForm: this.detailForm.getRawValue(),
      connectionResult: this.connectionResult,
      rateResult: this.rateResult,
      milestoneResult: this.milestoneResult,
    };
  }
  private normalizeValue(value: any): any {
  // Treat null, undefined, empty string, and 0 as equivalent null
  if (value === null || value === undefined || value === '' || value === 0) {
    return null;
  }

  // Handle Date
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // DATE only
  }

  // Handle numeric strings and numbers
  if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
    const num = Number(value);
    return num === 0 ? null : num; // Convert 0 to null for consistency
  }

  if (typeof value === 'number') {
    return Number(value.toFixed(6)); // prevent float noise
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(v => this.normalizeValue(v));
  }

  // Handle objects
  if (typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = this.normalizeValue(value[key]);
        return acc;
      }, {});
  }

  return value;
}

deepEqual(obj1: any, obj2: any): boolean {
  const normalizedObj1 = this.normalizeValue(obj1);
  const normalizedObj2 = this.normalizeValue(obj2);
  return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
}

  /**
 * Updates the booking status based on the presence of Cargo Received Dates in the products.
 * - If at least one product has a Cargo Received Date and the current status is 'Booking',
 *   it changes the status to 'Cargo Received'.
 * - If no products have a Cargo Received Date and the current status is 'Cargo Received',
 *   it reverts the status back to 'Booking'.
 */
  private getAllBookingProductsForStatusCheck(): FormGroup[] {
    const topLevelProducts = this.bookingProducts?.controls ?? [];
    const nestedCargoProducts = this.bookingCargo?.controls.flatMap((cargoGroup: AbstractControl) => {
      const products = cargoGroup.get('bookingProducts') as FormArray | null;
      return products?.controls ?? [];
    }) ?? [];

    return [...topLevelProducts, ...nestedCargoProducts] as FormGroup[];
  }

  private syncBookingStatusFromCargoDates(): void {
    // Cargo-received status only applies to SEA + LCL + Export bookings.
    const isLCLExport = this.selectedDepartmentType === "SEA" 
      && this.selectedDepartment?.FCLLCL === 'LCL' 
      && this.selectedDepartment?.ExportImport === "Export";

    if(!isLCLExport){
      return;
    }

    const bookingStatusControl = this.b['BookingStatus'];
    if (!bookingStatusControl) {
      return;
    }

    const atLeastOneHasDate = this.getAllBookingProductsForStatusCheck().some(
      (product) => !!product.get('CargoRecDate')?.value
    );

    const currentStatus = bookingStatusControl.value;
    if (atLeastOneHasDate && (currentStatus === 'Booked')) {
      bookingStatusControl.setValue('Cargo Received');
    } else if (!atLeastOneHasDate && currentStatus === 'Cargo Received') {
      // Revert the status if all cargo received dates are cleared
      bookingStatusControl.setValue('Booked');
    }
    this.bookingForm.updateValueAndValidity();
  }

  private updateBookingStatusOnCargoDate(): void {
    this.syncBookingStatusFromCargoDates();
  }

    getDestinationAgent(DestinationAgent: number) {
    if (!DestinationAgent || this.agentList.length === 0) {
      return '';
    } else {
      return (this.agentList.find(dep => dep.CustomerMasterSid === DestinationAgent)?.CustomerName);
    }
  }

  
  onGenerateJob() {
  if (!this.bookingData || !this.BookingHeaderSid) {
    this.appSettingService.showWarning('Please save the booking first before generating job.');
    return;
  }

  // Check if BookingStatus is Stuffed
  if (this.b['BookingStatus']?.value === 'Stuffed') {
    this.appSettingService.showWarning('Cannot generate job for Stuffed booking.');
    return;
  }

  this.spinner.show();
  
  const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
  const currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  
  const selectedVoyage = this.headerVesselList.find(v => 
    v.VesselName === this.b['VesselName']?.value && 
    v.VoyageNo === this.b['VoyageNo']?.value
  );

  const shipmentList = [{
    BookingHeaderSid: this.BookingHeaderSid,
    HouseJobSid: this.b['HouseJobSid']?.getRawValue() || null,
  }];

  const isHaz = this.c['CargoType']?.value === 'Haz';


  const payload = {
    createdBy: userEmail,
    MenuMasterSid: currentMenuId,
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    DepartmentMasterSid: this.b['DepartmentMasterSid']?.value,
    POL: this.b['POL']?.value,
    POD: this.b['POD']?.value,
    POO: this.b['POO']?.value,
    POLTerminal: this.b['POLTerminal']?.value,
    PODTerminal: this.b['PODTerminal']?.value,
    FPD: this.b['FPD']?.value,
    DestinationAgent: this.b['DestinationAgent']?.value,
    AgentAddress: this.b['AgentAddress']?.value,
    Notify: this.b['Notify']?.value,
    NotifyAddress: this.b['NotifyAddress']?.value,
    NoOfPkg: this.c['NoOfPackage']?.value || 0,
    GrossWeight: this.c['GrossWeight']?.value || 0,
    NetWeight: this.c['NetWeight']?.value || 0,
    Volume: this.c['Volume']?.value || 0,
    Haz: isHaz ? 'Y' : 'N',
    VoyageMasterSid: selectedVoyage?.VoyageMasterSid || this.b['VoyageMasterSid']?.value,
    JobType: this.b['JobType']?.value || selectedVoyage?.JobType,
    VesselName: this.b['VesselName']?.value || selectedVoyage?.VesselName,
    VoyageNo: this.b['VoyageNo']?.value || selectedVoyage?.VoyageNo,
    CarrierName: this.b['CarrierName']?.value,
    CarrierMasterSid: null,
    ETD: selectedVoyage?.ETD ? new Date(selectedVoyage.ETD) : (this.b['ETD']?.value ? new Date(this.b['ETD']?.value) : null),
    ETA: selectedVoyage?.ETA ? new Date(selectedVoyage.ETA) : (this.b['ETA']?.value ? new Date(this.b['ETA']?.value) : null),
    PortCutoffDate: selectedVoyage?.PortCutoff ? new Date(selectedVoyage.PortCutoff) : (this.b['PortCutoffDate']?.value ? new Date(this.b['PortCutoffDate']?.value): null),
    shipmentList: shipmentList,
    screenName : this.selectedDepartmentType === "AIR" ? "Master Air Waybill" : "Master Job",
    sourceScreen: 'Booking'
  };

  const carrierControl = this.bookingForm.get('CarrierName');
  if (carrierControl?.invalid) {
    carrierControl.markAsTouched();
    this.appSettingService.showWarning('Please select Carrier for Air Export', 'Carrier Required');
    return;
  }

  this.isSaving = true;
  this.spinner.show();
  this.operationService.createMasterJob(payload).subscribe({
    next: (resp: any) => {
      if (resp.status) {
        const masterJobSid = resp.data?.newMasterJob?.MasterJobSid;
        
        // Save MasterJobSid to HBL
        // if (masterJobSid) {
        //   this.saveMasterJobSidToHBL(masterJobSid);
        // }
        
        this.appSettingService.showSuccess('Master Job generated successfully from booking');
        if (masterJobSid) {
          if (this.selectedDepartmentType === "AIR") {
            this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
          } else {
            this.router.navigate(['/operation/master-job/entry', masterJobSid]);
          }
        }
      } else {
        this.appSettingService.showError('Error generating master job: ' + (resp.message || 'Unknown error'));
      }
      this.spinner.hide();
    },
    error: (error) => {
      this.spinner.hide();
      this.appSettingService.showError(error?.error?.message || 'Failed to generate master job');
      console.error('Error generating master job:', error);
    }
  });
}

  private createBookingCargoGroup(data?: any): FormGroup {
    const cargoGroup = this.fb.group({
      BookingCargoSid: [data?.BookingCargoSid || null],
      CargoType: [data?.CargoType || 'General'],
      ContainerType: [data?.ContainerType || null],
      NoofContainers: [data?.NoofContainers ?? 1],
      GrossWeight: [data?.GrossWeight ?? ''],
      NetWeight: [data?.NetWeight ?? ''],
      Volume: [data?.Volume ?? ''],
      Volumetric: [data?.Volumetric ?? ''],
      ChargeableWeight: [data?.ChargeableWeight ?? ''],
      NoOfPackage: [data?.NoOfPackage ?? ''],
      ShipmentTerms: [data?.ShipmentTerms || null],
      MovementType: [data?.MovementType || null],
      FreightTerms: [data?.FreightTerms || null],
      ModeOfTransport: [data?.ModeOfTransport || null],
      StuffingAt: [data?.StuffingAt || 'Dock'],
      bookingProducts: this.fb.array([])
    });

    cargoGroup.get('GrossWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(cargoGroup);
      this.calculateChargeableWeight(cargoGroup);
    });

    cargoGroup.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(cargoGroup);
    });

    cargoGroup.get('Volume')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(cargoGroup);
      this.calculateChargeableWeight(cargoGroup);
    });

    cargoGroup.get('Volumetric')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(cargoGroup);
      this.calculateChargeableWeight(cargoGroup);
    });

    return cargoGroup;
  }

  private shouldValidateBookingCargoGroup(cargoGroup: FormGroup): boolean {
    const cargoProducts = cargoGroup.get('bookingProducts') as FormArray | null;
    return !!(cargoGroup.dirty || cargoProducts?.dirty || (cargoProducts?.length ?? 0) > 0);
  }

  private createCargoProductGroup(data?: any, isPatching: boolean = false): FormGroup {
    return this.createBookingProductGroup(data, isPatching);
  }

  addBookingCargo(data?: any, bypassFclCheck: boolean = false): void {
    if (!bypassFclCheck && this.selectedFCLLCL !== 'FCL') {
      this.appSettingService.showInfo('Add Cargo is available for FCL bookings only.');
      return;
    }

    const cargoGroup = this.createBookingCargoGroup(data);
    this.bookingCargo.push(cargoGroup);
    this.bookingCargoExpanded.push(true);
    this.bookingCargoActiveIndex = this.bookingCargo.length - 1;
    this.cargoForm = cargoGroup;

    const cargoProducts = Array.isArray(data?.bookingProducts)
      ? data.bookingProducts
      : Array.isArray(data?.bookingProduct)
        ? data.bookingProduct
        : Array.isArray(data?.products)
          ? data.products
          : [];

    if (cargoProducts.length) {
      cargoProducts.forEach((product: any) => {
        this.addBookingCargoProduct(this.bookingCargo.length - 1, product);
      });
    }

    this.handleProductRelatedCalculation(this.bookingCargo.length - 1);
  }

  addBookingCargoProduct(cargoIndex: number, data?: any): void {
    const cargoGroup = this.bookingCargo.at(cargoIndex) as FormGroup;
    if (!cargoGroup) {
      return;
    }
    this.bookingCargoActiveIndex = cargoIndex;
    this.cargoForm = cargoGroup;
    const products = cargoGroup.get('bookingProducts') as FormArray;
    products.push(this.createCargoProductGroup(data, true));
    products.markAsDirty();
    cargoGroup.markAsDirty();
    cargoGroup.updateValueAndValidity({ emitEvent: false });
    this.handleProductRelatedCalculation(cargoIndex);
  }

  bookingCargoProducts(cargoIndex: number): FormArray {
    return this.bookingCargo.at(cargoIndex).get('bookingProducts') as FormArray;
  }

  toggleCargoExpansion(cargoIndex: number): void {
    this.bookingCargoActiveIndex = this.bookingCargoActiveIndex === cargoIndex ? -1 : cargoIndex;
    this.bookingCargoExpanded[cargoIndex] = this.bookingCargoActiveIndex === cargoIndex;
    const cargoGroup = this.bookingCargo.at(cargoIndex) as FormGroup;
    if (cargoGroup && this.bookingCargoActiveIndex === cargoIndex) {
      this.cargoForm = cargoGroup;
    }
  }

  isCargoExpanded(cargoIndex: number): boolean {
    return this.bookingCargoActiveIndex === cargoIndex;
  }

  removeBookingCargo(cargoIndex: number): void {
    const cargoGroup = this.bookingCargo.at(cargoIndex) as FormGroup;
    if (!cargoGroup) {
      return;
    }

    this.bookingCargo.removeAt(cargoIndex);
    this.bookingCargoExpanded.splice(cargoIndex, 1);

    if (this.bookingCargo.length === 0) {
      this.addBookingCargo(undefined, true);
      return;
    }

    this.bookingCargoActiveIndex = Math.min(this.bookingCargoActiveIndex, this.bookingCargo.length - 1);
    this.cargoForm = this.bookingCargo.at(this.bookingCargoActiveIndex) as FormGroup;
  }

// Add this method to open CRO print modal
// openCroPrintModal(content: TemplateRef<any>) {
//   if (!this.bookingData) {
//     this.appSettingService.showWarning('Please save the booking first.');
//     return;
//   }
  
//   // Enhanced validation for CRO data
//   if (!this.cr['ReleaseOrderDate']?.value) {
//     this.appSettingService.showWarning('Please fill in the Release Order Date in the CRO tab.');
//     return;
//   }

//   // Additional validation for required CRO fields
//   if (!this.cr['Transporter']?.value) {
//     this.appSettingService.showWarning('Please fill in the Transporter field in the CRO tab.');
//     return;
//   }

//   if (!this.cr['EmptyYard']?.value) {
//     this.appSettingService.showWarning('Please fill in the Empty Yard field in the CRO tab.');
//     return;
//   }

//   this.modalService.open(content, {
//     size: 'xl',
//     scrollable: true,
//     backdrop: 'static'
//   });
// }
getSalesmanName(salesmanSid: number): string {
  const salesman = this.salesmanList.find(s => s.UserMasterSid === salesmanSid);
  return salesman ? salesman.userName : '';
}

// Update the exportReleaseOrder method
exportReleaseOrder() {
  if (!this.bookingData) {
    this.appSettingService.showWarning('Please save the booking first.');
    return;
  }
  
  // Enhanced validation for CRO data
  if (!this.cr['ReleaseOrderDate']?.value) {
    this.appSettingService.showWarning('Please fill in the Release Order Date in the CRO tab.');
    return;
  }

  if (!this.cr['Transporter']?.value) {
    this.appSettingService.showWarning('Please fill in the Transporter field in the CRO tab.');
    return;
  }

  if (!this.cr['EmptyYard']?.value) {
    this.appSettingService.showWarning('Please fill in the Empty Yard field in the CRO tab.');
    return;
  }

  this.spinner.show();
  
  // Generate CRO PDF with better error handling
  // this.generateCROPDF().then(() => {
  //   this.spinner.hide();
  //   this.appSettingService.showSuccess('Release Order exported successfully!');
  // }).catch(error => {
  //   this.spinner.hide();
  //   console.error('CRO Export Error:', error);
  //   this.appSettingService.showError('Error exporting Release Order. Please try again.');
  // });
}

// Add this method to handle all types of PDF downloads
downloadPDF(type: 'booking' | 'cro'  = 'booking'): void {
  this.spinner.show();

  this.prepareTermsForPrint()
    .then(() => {
      const logo = this.pdfMakeService.getReportLogo();

      this.pdfMakeService.generateBookingFromApi(
        {
          ...this.bookingHeader,
          terms: this.printTermsList
        },
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          ports: this.portList,
          departments: this.departmentList,
          carriers: this.carrierList,
          containerTypes: this.containerTypeList
        },
        type
      );

      this.appSettingService.showSuccess(`${this.getPdfTypeName(type)} downloaded successfully!`);
      const payload = {
        tableName: 'BookingHeader',
        recordId: String(this.bookingData?.BookingHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Download Pdf'
        },
        newVal: {
          PDF: `${this.getPdfTypeName(type)} PDF Downloaded`
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => {},
        error: (err) => console.error(err)
      });
    })
    .catch((error) => {
      console.error(`PDF generation error for ${type}:`, error);
      this.appSettingService.showError(`Error generating ${this.getPdfTypeName(type)}. Please try again.`);
    })
    .finally(() => {
      this.spinner.hide();
    });
}

// Legacy method using html2canvas (kept for fallback/barcode printing)
downloadPDFLegacy(type: 'booking' | 'cro'  = 'booking'): void {
  this.spinner.show();

  const elementId = this.getPdfElementId(type);
  const fileName = this.generateFileName(type);

  if (!document.getElementById(elementId)) {
    this.spinner.hide();
    this.appSettingService.showWarning(`PDF content for ${type.toUpperCase()} not found.`);
    return;
  }

  this.pdfService.downloadBalancedPDF(
    elementId,
    fileName,
    () => {
      this.appSettingService.showSuccess(`${this.getPdfTypeName(type)} downloaded successfully!`);
      this.spinner.hide();
    },
    (error) => {
      console.error(`PDF generation error for ${type}:`, error);
      this.appSettingService.showError(`Error generating ${this.getPdfTypeName(type)}. Please try again.`);
      this.spinner.hide();
    }
  );
}

async downloadPDFBarCode(qty: number = 1, withCompany: boolean = this.isWithCompany): Promise<void> {
  this.spinner.show();
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  try {
    const safeQty = Math.max(1, Number(qty) || 1);
    const imgData = await this.getBarcodePdfImageDataUrl(withCompany);
    const fileName = this.generateFileName('barcode') + '.pdf';
    const pdf = withCompany
      ? new jsPDF('p', 'mm', 'a4')
      : new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [101.6, 152.4] // 4in x 6in
        });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (withCompany) {
      const labelWidth = 100.5; // 380px at 96dpi
      const labelHeight = 127;  // 480px at 96dpi
      const x = (pageWidth - labelWidth) / 2;
      const y = (pageHeight - labelHeight) / 2;

      for (let i = 0; i < safeQty; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', x, y, labelWidth, labelHeight, undefined, 'FAST');
      }
      pdf.save(fileName);
      const payload = {
        tableName: 'BookingHeader',
        recordId: String(this.bookingData?.BookingHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Download'
        },
        newVal: {
          Print: 'BarCode PDF Downloaded',
          Qty: safeQty
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    this.appSettingService.showSuccess('Barcode PDF downloaded successfully!');
    
    } else {
      // Match without-company print structure:
      // One 4x6 label per page, print content in top 4.5in area,
      // keep bottom 1.5in blank for pre-printed logo/company.
      const contentAreaHeight = 114.3; // 4.5in
      const dataUrlProps = pdf.getImageProperties(imgData);
      const scale = Math.min(
        pageWidth / dataUrlProps.width,
        contentAreaHeight / dataUrlProps.height
      );
      const renderWidth = dataUrlProps.width * scale;
      const renderHeight = dataUrlProps.height * scale;
      const x = (pageWidth - renderWidth) / 2;
      const y = 0;

      for (let i = 0; i < safeQty; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight, undefined, 'FAST');
      }
      pdf.save(fileName);
      const payload = {
        tableName: 'BookingHeader',
        recordId: String(this.bookingData?.BookingHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Download'
        },
        newVal: {
          Print: 'BarCode 2 PDF Downloaded',
          Qty: safeQty
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    this.appSettingService.showSuccess('Barcode 2 PDF downloaded successfully!');
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    this.appSettingService.showError('Error generating Barcode PDF. Please try again.');
  } finally {
    this.spinner.hide();
  }
}

private async generateBarcodePdfBlobForMail(withCompany: boolean, qty: number = 1): Promise<Blob | null> {
  try {
    const safeQty = Math.max(1, Number(qty) || 1);
    const imgData = await this.getBarcodePdfImageDataUrl(withCompany);
    const pdf = withCompany
      ? new jsPDF('p', 'mm', 'a4')
      : new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [101.6, 152.4]
        });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (withCompany) {
      const labelWidth = 100.5;
      const labelHeight = 127;
      const x = (pageWidth - labelWidth) / 2;
      const y = (pageHeight - labelHeight) / 2;

      for (let i = 0; i < safeQty; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', x, y, labelWidth, labelHeight, undefined, 'FAST');
      }
    } else {
      const contentAreaHeight = 114.3;
      const dataUrlProps = pdf.getImageProperties(imgData);
      const scale = Math.min(
        pageWidth / dataUrlProps.width,
        contentAreaHeight / dataUrlProps.height
      );
      const renderWidth = dataUrlProps.width * scale;
      const renderHeight = dataUrlProps.height * scale;
      const x = (pageWidth - renderWidth) / 2;
      const y = 0;

      for (let i = 0; i < safeQty; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight, undefined, 'FAST');
      }
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('Barcode PDF blob generation error:', error);
    return null;
  }
}

private preloadBarcodePdfImage(withCompany: boolean): void {
  setTimeout(() => {
    this.getBarcodePdfImageDataUrl(withCompany)
      .then(() => {
        this.isBarcodePdfReady = true;
      })
      .catch(() => {
        this.isBarcodePdfReady = false;
      })
      .finally(() => {
        this.isBarcodePdfPreparing = false;
      });
  }, 0);
}

private getBarcodePdfCacheKey(withCompany: boolean): string {
  const b = this.bookingHeader || {};
  return JSON.stringify({
    withCompany,
    bookingNo: b.BookingNo || '',
    barcode: this.barcodeBookingNo || b.BookingNo || '',
    shipper: b.ShipperName || '',
    consignee: b.ConsigneeName || '',
    etd: b.ETD || '',
    poo: b.POO || '',
    fpd: b.FPD || '',
    pkg: b.bookingCargo?.[0]?.NoOfPackage || '',
    wt: b.bookingCargo?.[0]?.GrossWeight || ''
  });
}

private async getBarcodePdfImageDataUrl(withCompany: boolean): Promise<string> {
  const cacheKey = this.getBarcodePdfCacheKey(withCompany);
  const cached = this.barcodePdfImageCache.get(cacheKey);
  if (cached) return cached;

  const sourceElementId = withCompany ? 'printContentBarcode' : 'printContentBarcodeNoCompany';
  const sourceElement = document.getElementById(sourceElementId);
  if (!sourceElement) throw new Error('Barcode content not found.');

  const canvas = await html2canvas(sourceElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false
  });

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  this.barcodePdfImageCache.set(cacheKey, dataUrl);
  return dataUrl;
}

private buildBarcodePdfLabel(withCompany: boolean, barcodeValue: string): any {
  const pxToPt = (px: number) => Number((px * 0.75).toFixed(2));
  const cardWidthWithCompany = pxToPt(380);
  const cardHeightWithCompany = pxToPt(480);
  const cardWidthWithoutCompany = pxToPt(378);
  const cardHeightWithoutCompany = pxToPt(350);
  const cardInnerPadding = pxToPt(8);
  const innerWidthWithCompany = cardWidthWithCompany - cardInnerPadding * 2;
  const innerWidthWithoutCompany = cardWidthWithoutCompany - cardInnerPadding * 2;
  const barcodeWidthWithCompany = innerWidthWithCompany - pxToPt(10);
  const barcodeWidthWithoutCompany = innerWidthWithoutCompany - pxToPt(26);

  const topBarcode = this.createBarcodeSvg(
    barcodeValue,
    this.barcodeConfig1.width || 1,
    this.barcodeConfig1.height || 30,
    this.barcodeConfig1.fontSize || 9
  );
  const bottomBarcode = this.createBarcodeSvg(
    barcodeValue,
    this.barcodeConfig.width || 1,
    this.barcodeConfig.height || 22,
    this.barcodeConfig.fontSize || 9
  );
  const logo = this.pdfMakeService.getReportLogo();
  const logoImage = logo?.startsWith('data:image') ? logo : null;

  const detailRows = [
    ['Shipper', this.bookingHeader?.ShipperName],
    ['Consignee', this.bookingHeader?.ConsigneeName],
    ['Accepted On', this.bookingHeader?.ETD ? this.datePipe.transform(this.bookingHeader?.ETD) : ''],
    ['Origin', this.bookingHeader?.POO],
    ['Destination', this.bookingHeader?.FPD],
    ['Total Pkgs', this.bookingHeader?.bookingCargo?.[0]?.NoOfPackage],
    ['Weight', this.bookingHeader?.bookingCargo?.[0]?.GrossWeight],
    ['Booking No', this.bookingHeader?.BookingNo]
  ].map(([key, value]) => [{ text: String(key), bold: true }, { text: String(value ?? '') }]);

  const detailTable = {
    table: {
      widths: [pxToPt(150), '*'],
      body: detailRows
    },
    layout: {
      hLineWidth: () => 0.8,
      vLineWidth: (i: number) => (i === 1 ? 0.8 : 0),
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 3,
      paddingBottom: () => 3
    },
    fontSize: 9
  };

  const labelContent: any[] = [{
    svg: topBarcode,
    width: barcodeWidthWithCompany,
    alignment: 'center',
    margin: [0, 0, 0, pxToPt(8)]
  }];

  if (!withCompany) {
    const withoutCompanyTable = {
      table: {
        widths: [pxToPt(150), '*'],
        body: detailRows
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: (i: number) => (i === 1 ? 1 : 0),
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 2,
        paddingBottom: () => 2
      },
      fontSize: 9,
      margin: [pxToPt(15), pxToPt(12), pxToPt(15), pxToPt(12)]
    };

    const outerStack: any[] = [
      { svg: topBarcode, width: barcodeWidthWithoutCompany, alignment: 'center' },
      withoutCompanyTable,
      { svg: bottomBarcode, width: barcodeWidthWithoutCompany, alignment: 'center' }
    ];

    return {
      table: {
        widths: [cardWidthWithoutCompany],
        body: [[{ stack: outerStack, margin: [cardInnerPadding, cardInnerPadding, cardInnerPadding, cardInnerPadding] }]],
        heights: [cardHeightWithoutCompany]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0
      },
      alignment: 'center',
      margin: [0, 0, 0, 0]
    };
  }

  if (withCompany) {
    labelContent.push(
      { text: this.currentCompany?.companyName || 'Company Name', bold: true, alignment: 'center', fontSize: 12 },
      { text: this.currentBranch?.branchName || 'Company Branch', alignment: 'center', margin: [0, 0, 0, 8] }
    );
  }

  labelContent.push(
    { ...detailTable, margin: [0, 0, 0, pxToPt(8)] },
    { svg: bottomBarcode, width: barcodeWidthWithCompany, alignment: 'center', margin: [0, 0, 0, pxToPt(8)] }
  );

  if (withCompany) {
    labelContent.push({
      columns: [
        ...(logoImage ? [{ image: logoImage, width: 28, margin: [0, 0, 8, 0] }] : []),
        { text: this.currentCompany?.companyName || '', alignment: 'left', bold: true, margin: [0, 6, 0, 0] }
      ],
      margin: [0, 0, 0, 4]
    });

    const addressLine = [
      this.currentBranch?.addressLine1,
      this.currentBranch?.addressLine2,
      this.currentBranch?.cityMaster?.cityName || this.currentCompany?.City,
      this.currentBranch?.postalCode || this.currentBranch?.ZipCode,
      this.currentBranch?.phoneNumber || this.currentBranch?.Phone
    ].filter(Boolean).join(', ');

    labelContent.push(
      { text: addressLine, alignment: 'center', fontSize: 8, margin: [0, 0, 0, 2] },
      { text: this.website || '', alignment: 'center', fontSize: 8 }
    );
  }

  return {
    table: {
      widths: [cardWidthWithCompany],
      body: [[{ stack: labelContent, margin: [cardInnerPadding, cardInnerPadding, cardInnerPadding, cardInnerPadding] }]],
      heights: [cardHeightWithCompany]
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    alignment: 'center',
    margin: [0, 0, 0, 0]
  };
}

private createBarcodeSvg(value: string, width: number, height: number, fontSize: number): string {
  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  (JsBarcode as any)(svgNode, value, {
    format: 'CODE128',
    displayValue: true,
    width,
    height,
    fontSize,
    margin: 0
  });
  return new XMLSerializer().serializeToString(svgNode);
}



// Helper method to get PDF element ID based on type
private getPdfElementId(type: string): string {
  switch (type) {
    case 'cro':
      return 'croPrintContent';
    case 'mail-attachment':
      return 'pdfContent';
    case 'booking':
    default:
      return 'printContent';
  }
}

// Helper method to generate appropriate file names
  private generateFileName(type: string): string {
  const bookingNo = this.bookingHeader?.BookingNo || 'Booking';
  const timestamp = new Date().getTime();
  
  switch (type) {
    case 'barcode':
      return `Barcode_${bookingNo}_${timestamp}`;
    case 'barcode-no-company':
      return `Barcode_Without_Company_${bookingNo}_${timestamp}`;

    case 'cro':
      return `CRO_${bookingNo}_${timestamp}`;
    
    case 'booking':
    default:
      return `Booking_${bookingNo}_${timestamp}`;
  }
}

// Helper method to get display names for PDF types
private getPdfTypeName(type: string): string {
  switch (type) {
    case 'cro':
      return 'Release Order (CRO)';
    case 'barcode':
      return 'Barcode';
    case 'barcode-no-company':
      return 'Barcode 2';
   
    case 'booking':
    default:
      return 'Booking Print';
  }
}

private getCurrentBookingMenuMasterSid(): number | null {
  const syncedBookingMenuSid = this.sidebarService.syncMenuIdBeforeSubmit("Booking");
  const candidates = [
    this.bookingData?.MenuMasterSid,
    this.bookingHeader?.MenuMasterSid,
    syncedBookingMenuSid,
    this.MenuMasterSid,
    this.currentMenuId,
    Number(sessionStorage.getItem('currentMenuId'))
  ];

  for (const value of candidates) {
    const menuSid = Number(value);
    if (Number.isFinite(menuSid) && menuSid > 0) {
      return menuSid;
    }
  }

  return null;
}

private async getBookingCustomerBranchEmailsByMenu(): Promise<string[]> {
  const customerBranchSid = Number(this.bookingHeader?.CustomerBranchSid);
  const menuMasterSid = this.getCurrentBookingMenuMasterSid();

  if (!customerBranchSid || !menuMasterSid) {
    return [];
  }

  return this.emailTriggerService.resolveCustomerBranchEmailsByMenu({
    customerBranchSid,
    menuMasterSid
  });
}

// Method to send email with PDF attachment
async sendEmail(type: BookingEmailType = 'booking'): Promise<void> {
  try {
    this.spinner.show();
    
    const pdfBlob = await this.generateEmailPdfBlob(type);
    if (!pdfBlob) {
      this.spinner.hide();
      this.appSettingService.showError('Error generating PDF for email.');
      return;
    }

    const pdfFileName = this.generateFileName(type).replace(/[\\/:*?"<>|]+/g, '_') + '.pdf';
    const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
    const toEmail = await this.getBookingCustomerBranchEmailsByMenu();
    if (toEmail.length === 0) {
      this.appSettingService.showError('No email found in customer branch email.');
      this.spinner.hide();
      return;
    }

    const POL = this.bookingHeader?.POL;
    const POD = this.bookingHeader?.POD;
    const FPD = this.bookingHeader?.FPD;
    const { subject, body } = this.emailTriggerService.buildOperationEmailContent({
      documentName: type === 'cro' ? 'Release Order (CRO)' : 'Booking',
      documentNoLabel: type === 'cro' ? 'Booking No.' : 'Booking No.',
      documentNo: this.bookingHeader?.BookingNo || '',
      documentDate: this.datePipe.transform(this.bookingHeader?.BookingDateTime),
      pol: this.getFormattedPort(POL),
      pod: this.getFormattedPort(POD),
      fpd: this.getFormattedPort(FPD),
      userName: this.userData?.['userName'] || '',
      subjectSuffix: type === 'cro' ? '' : 'confirmation',
      introLine: type === 'cro'
        ? 'Please find attached the Container Release Order for your reference.'
        : 'Please find here enclosed the booking details as requested.',
      followupLine: type === 'cro'
        ? 'Kindly proceed with the container release as per the attached document.'
        : 'Looking forward to confirm cargo readiness.'
    });

    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.setContent = {
      EmailTo: toEmail,
      EmailCC: this.userData?.['userEmail'] ? [this.userData['userEmail']] : [],
      EmailBCC: [],
      Subject: subject,
      Mailbody: body,
      attachments: [pdfFile],
      context: {
        menuName: 'Booking',
        BookingNo: this.bookingHeader?.BookingNo || '',
        date: this.datePipe.transform(this.bookingHeader?.BookingDateTime),
        POL: this.getFormattedPort(POL),
        POD: this.getFormattedPort(POD),
        FPD: this.getFormattedPort(FPD)
      }
    };
    modalRef.componentInstance.customSendHandler = ({ formValue, files, formattedMailBody }) => {
      const formData = new FormData();
      this.splitEmailForSend(formValue.EmailTo).forEach(email => formData.append('EmailTo[]', email));
      this.splitEmailForSend(formValue.EmailCC).forEach(email => formData.append('EmailCC[]', email));
      formData.append('Subject', formValue.Subject);
      formData.append('Mailbody', formattedMailBody);

      const attachment = files?.[0];
      if (attachment) {
        formData.append('file', attachment, attachment.name.replace(/[\\/:*?"<>|]+/g, '_'));
      }

      return firstValueFrom(this.operationService.bookingPrint(formData));
    };

    modalRef.componentInstance.dataChange.subscribe(() => {
      const payload = {
        tableName: 'BookingHeader',
        recordId: String(this.bookingData?.BookingHeaderSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Send Mail'
        },
        newVal: {
          Email: 'Booking Confirmation Mail Send'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    });

    this.spinner.hide();

  } catch (error) {
    this.spinner.hide();
    console.error('Email sending error:', error);
    this.appSettingService.showError('Error sending email.');
  }
}

private async generateEmailPdfBlob(type: BookingEmailType): Promise<Blob | null> {
  switch (type) {
    case 'barcode':
      return this.generateBarcodePdfBlobForMail(true);
    case 'barcode-no-company':
      return this.generateBarcodePdfBlobForMail(false);
    case 'booking':
    case 'cro':
    default:
      return this.generateBookingPdfBlobForMail(type === 'cro' ? 'cro' : 'booking');
  }
}

private splitEmailForSend(value: string | string[]): string[] {
  const source = Array.isArray(value) ? value.join(',') : (value || '');
  return source
    .split(/[;,]/)
    .map(email => email.trim())
    .filter(email => !!email);
}

private async generateBookingPdfBlobForMail(type: 'booking' | 'cro' = 'booking'): Promise<Blob | null> {
  try {
    await this.prepareTermsForPrint();
    const logo = this.pdfMakeService.getReportLogo();
    const apiData = {
      ...this.bookingHeader,
      terms: this.printTermsList
    };
    const lookups = {
      ports: this.portList,
      departments: this.departmentList,
      carriers: this.carrierList,
      containerTypes: this.containerTypeList
    };
    const pdfData = type === 'cro'
      ? transformCroApiData(apiData, this.currentCompany, this.currentBranch, this.userData, logo) as any
      : transformBookingApiData(apiData, this.currentCompany, this.currentBranch, this.userData, logo, lookups);

    return await this.pdfMakeService.generateBookingBlob(pdfData, type as BookingDocumentType);
  } catch (error) {
    console.error(`PDF blob generation error for ${type}:`, error);
    return null;
  }
}

// Enhanced PDF blob generation method
async generatePDFBlob(type: 'booking' | 'cro' | 'mail-attachment' = 'booking'): Promise<Blob | null> {
  await this.prepareTermsForPrint();
  const elementId = this.getPdfElementId(type);
  const printContent = document.getElementById(elementId);
  
  if (!printContent) {
    return null;
  }

  try {
    // Temporarily show and position the element for PDF generation
    const originalDisplay = printContent.style.display;
    const originalPosition = printContent.style.position;
    const originalLeft = printContent.style.left;
    const originalTop = printContent.style.top;
    const originalZIndex = printContent.style.zIndex;
    const originalBackground = printContent.style.backgroundColor;
    const originalWidth = printContent.style.width;
    const originalHeight = printContent.style.height;
    const originalMargin = printContent.style.margin;
    const originalPadding = printContent.style.padding;

    printContent.style.display = 'block';
    printContent.style.position = 'fixed';
    printContent.style.left = '-9999px';
    printContent.style.top = '0';
    printContent.style.zIndex = '-1';
    printContent.style.backgroundColor = 'white';
    printContent.style.width = '210mm';
    printContent.style.height = 'auto';
    printContent.style.margin = '0';
    printContent.style.padding = '10mm';

    const canvas = await html2canvas(printContent, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Restore original styles
    printContent.style.display = originalDisplay;
    printContent.style.position = originalPosition;
    printContent.style.left = originalLeft;
    printContent.style.top = originalTop;
    printContent.style.zIndex = originalZIndex;
    printContent.style.backgroundColor = originalBackground;

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    return null;
  }
}

  private async validateCreditBeforeSave(): Promise<boolean> {
    this.lastCreditValidationMessage = '';
    if (!this.isCreditRequestCheckingEnabled) {
      return true;
    }

    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    const branchMasterSid = this.currentBranch?.BranchMasterSid;
    const raw = this.bookingForm.getRawValue();
    const customerMasterSid = raw?.CustomerMasterSid ?? null;
    const customerBranchSid = raw?.CustomerBranchSid ?? null;

    if (!customerMasterSid) {
      return true;
    }

    if (!companyMasterSid) {
      this.appSettingService.showWarning('Company is not selected. Please refresh and try again.');
      return false;
    }
    if (!branchMasterSid) {
      this.appSettingService.showWarning('Branch is not selected. Please select a branch before saving booking.');
      return false;
    }

    try {
      const resp: any = await firstValueFrom(
        this.creditValidationApiService.validateCredit({
          companyMasterSid: companyMasterSid,
          branchMasterSid: branchMasterSid,
          customerMasterSid: customerMasterSid,
          customerBranchSid: customerBranchSid,
        })
      );

      const validation = resp?.data;
      const isValid = validation?.IsValid ?? validation?.isValid;
      if (!resp?.status || isValid === false) {
        const errors = Array.isArray(validation?.Errors)
          ? validation.Errors
          : Array.isArray(validation?.errors)
            ? validation.errors
            : [];
        this.lastCreditValidationMessage = errors.length
          ? errors.join('\n')
          : resp?.message || 'Credit validation failed.';
        return false;
      }

      const warnings = Array.isArray(validation?.Warnings)
        ? validation.Warnings
        : Array.isArray(validation?.warnings)
          ? validation.warnings
          : [];
      if (warnings.length) {
        this.appSettingService.showWarning(warnings.join('\n'));
      }

      return true;
    } catch (error: any) {
      const validation = error?.error?.data;
      const errors = Array.isArray(validation?.Errors)
        ? validation.Errors
        : Array.isArray(validation?.errors)
          ? validation.errors
          : [];
      this.lastCreditValidationMessage = errors.length
        ? errors.join('\n')
        : error?.error?.message || 'Credit validation failed.';
      return false;
    }
  }


 private getContainerTypeDisplayLabel(containerTypeSid: any): string | null {
    if (!containerTypeSid || this.containerTypeList.length === 0) {
      return null;
    }

    const matchedContainer = this.containerTypeList.find((con: any) =>
      con.ContainerTypeMasterSid === containerTypeSid ||
      String(con.ContainerTypeMasterSid) === String(containerTypeSid) ||
      con.ContainerCode === containerTypeSid ||
      con.ContainerName === containerTypeSid
    );

    return matchedContainer?.ContainerName || matchedContainer?.ContainerTypeName || matchedContainer?.ContainerCode || null;
  }

 getContainerName(ContainerTypeMasterSid:number){
    return this.getContainerTypeDisplayLabel(ContainerTypeMasterSid) || "";
  }

// Open CRO print modal
openCroPrintModal(content: TemplateRef<any>) {
  if (!this.bookingData) {
    this.appSettingService.showWarning('Please save the booking first.');
    return;
  }
  
  // Enhanced validation for CRO data
  if (!this.cr['ReleaseOrderDate']?.value) {
    this.appSettingService.showWarning('Please fill in the Release Order Date in the CRO tab.');
    return;
  }

  if (!this.cr['Transporter']?.value) {
    this.appSettingService.showWarning('Please fill in the Transporter field in the CRO tab.');
    return;
  }

  if (!this.cr['EmptyYard']?.value) {
    this.appSettingService.showWarning('Please fill in the Empty Yard field in the CRO tab.');
    return;
  }

  this.modalService.open(content, {
    size: 'xl',
    scrollable: true,
    backdrop: 'static'
  });
}

navigateToCreate() {
        this.router.navigate(['operation/booking/entry']);
    }

getBookingCostRevenueRows(): any[] {
  const headerRates = Array.isArray(this.bookingHeader?.bookingRates) ? this.bookingHeader.bookingRates : [];
  const dataRates = Array.isArray(this.bookingData?.bookingRates) ? this.bookingData.bookingRates : [];
  const headerCharges = Array.isArray(this.bookingHeader?.costRevenueCharges) ? this.bookingHeader.costRevenueCharges : [];
  const dataCharges = Array.isArray(this.bookingData?.costRevenueCharges) ? this.bookingData.costRevenueCharges : [];

  if (headerRates.length) return headerRates;
  if (dataRates.length) return dataRates;
  if (headerCharges.length) return headerCharges;
  return dataCharges;
}

getChargeUnitCode(chargeDataOrSid: any): string {
  const sid = Number(
    chargeDataOrSid?.ChargeUomSid ??
    chargeDataOrSid
  );

  if (!sid) return '';

  const uom = (this.uomList || []).find((item: any) => Number(item?.UOMMasterSid) === sid);
  if (uom?.UOMCode || uom?.UOMName) {
    return uom.UOMCode || uom.UOMName || '';
  }

  const pkgUom = (this.packageTypeList || []).find((item: any) => Number(item?.UOMMasterSid) === sid);
  return pkgUom ? (pkgUom.UOMCode || pkgUom.UOMName || '') : '';
}

getChargeDisplayName(item: any): string {
  return item?.ChargeDescription || item?.ChargeName || item?.chargeName || `Charge #${item?.ChargeMasterSid || ''}`;
}

getProRevenueAmount(item: any): number {
  return Number(item?.RevenueLocalAmount) || 0;
}

getProCostAmount(item: any): number {
  return Number(item?.CostLocalAmount) || 0;
}

getProGross(item: any): number {
  return this.getProRevenueAmount(item) - this.getProCostAmount(item);
}

getActualRevenueAmount(item: any): number {
  const hasRevenueVoucher = !!(item?.RevenueVoucherHeaderSid || item?.revenueVoucherHeader?.VoucherHeaderSid);
  if (!hasRevenueVoucher) return 0;
  return Number(
    item?.RevenueLocalAmount ??
    0
  ) || 0;
}

getActualCostAmount(item: any): number {
  const hasCostVoucher = !!(item?.CostVoucherHeaderSid || item?.costVoucherHeader?.VoucherHeaderSid);
  if (!hasCostVoucher) return 0;
  return Number(
    item?.CostLocalAmount ??
    0
  ) || 0;
}

getActualGross(item: any): number {
  return this.getActualRevenueAmount(item) - this.getActualCostAmount(item);
}

getBookingChargeTotals() {
  const rows = this.getBookingCostRevenueRows();
  return rows.reduce(
    (acc: any, item: any) => {
      acc.proRev += this.getProRevenueAmount(item);
      acc.proCost += this.getProCostAmount(item);
      acc.proGp += this.getProGross(item);
      acc.actRev += this.getActualRevenueAmount(item);
      acc.actCost += this.getActualCostAmount(item);
      acc.actGp += this.getActualGross(item);
      return acc;
    },
    { proRev: 0, proCost: 0, proGp: 0, actRev: 0, actCost: 0, actGp: 0 }
  );
}


printDiv(divId: string): void {
  this.showPrintLogo = true;
  this.showPdfLogo = false;

  setTimeout(() => {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) return;

    const popupWin = window.open('', '_blank', 'width=900,height=600');
    if (popupWin) {
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>Print</title>
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);
      popupWin.document.close();
    }
  }, 50); 
}

  openPrintQtyModal(template: any) {
    this.printQty = 1;
    this.isWithCompany = true;
    this.barcodeActionType = 'print';
    this.modalService.open(template, { centered: true });
  }


    openPrintQtyModalwithoutCompany(template: any) {
    this.printQty = 1;
    this.isWithCompany = false;
    this.barcodeActionType = 'print';
    this.modalService.open(template, { centered: true });
  }

  openPdfQtyModal(template: any) {
    this.printQty = 1;
    this.isWithCompany = true;
    this.barcodeActionType = 'pdf';
    this.isBarcodePdfReady = false;
    this.isBarcodePdfPreparing = true;
    this.modalService.open(template, { centered: true });
    this.preloadBarcodePdfImage(true);
  }

  openPdfQtyModalwithoutCompany(template: any) {
    this.printQty = 1;
    this.isWithCompany = false;
    this.barcodeActionType = 'pdf';
    this.isBarcodePdfReady = false;
    this.isBarcodePdfPreparing = true;
    this.modalService.open(template, { centered: true });
    this.preloadBarcodePdfImage(false);
  }

  confirmPrint(modal: any) {
    const actionType = this.barcodeActionType;
    const safeQty = Math.max(1, Number(this.printQty) || 1);
    const withCompany = this.isWithCompany;

    if (actionType === 'pdf') {
      if (this.isBarcodePdfPreparing || !this.isBarcodePdfReady || this.isBarcodePdfDownloading) {
        this.appSettingService.showWarning('Please wait, preparing PDF preview...');
        return;
      }

      this.isBarcodePdfDownloading = true;
      void this.downloadPDFBarCode(safeQty, withCompany).finally(() => {
        this.isBarcodePdfDownloading = false;
        modal.close();
      });
      return;
    }

    modal.close();
    if (withCompany) {
      this.printDivBarcode('printContentBarcode', safeQty);
      const payload = {
        tableName: 'BookingHeader',
        recordId: String(this.bookingData?.BookingHeaderSid),
        operation: 'PRINT',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Print'
        },
        newVal: {
          Print: 'BarCode Printed Successfully',
          Qty: safeQty
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } else {
      this.printDivBarcodeWithCompany('printContentBarcodeNoCompany', safeQty);
      const payload = {
        tableName: 'BookingHeader',
        recordId: String(this.bookingData?.BookingHeaderSid),
        operation: 'PRINT',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Print'
        },
        newVal: {
          Print: 'BarCode 2 Printed Successfully',
          Qty: safeQty
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    }
  }


  printDivBarcode(divId: string, qty: number): void {
    this.showPrintLogo = true;
    this.showPdfLogo = false;

    setTimeout(() => {
      const sourceElement = document.getElementById(divId);
      if (!sourceElement) return;

      // ✅ Collect all styles from current page
      const styles = Array.from(document.styleSheets)
        .map((sheet: any) => {
          try {
            return Array.from(sheet.cssRules)
              .map((rule: any) => rule.cssText)
              .join('');
          } catch {
            return '';
          }
        })
        .join('');

      let finalHtml = '';

      for (let i = 0; i < qty; i++) {
        finalHtml += `
        <div class="print-page">
          ${sourceElement.innerHTML}
        </div>
      `;
      }

      const popupWin = window.open('', '_blank', 'width=900,height=600');

      if (popupWin) {
        popupWin.document.open();
        popupWin.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>

            <!-- Bootstrap -->
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">

            <!-- FontAwesome -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

         <style>
  ${styles}

html, body {
  margin: 0;
  padding: 0;
}

/* One physical printed page */
.print-page {
  width: 100vw;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;

  page-break-after: always;
}

.print-page:last-child {
  page-break-after: auto;
}

/* Your label size */
.print-label {
  width: 380px;
  height: 480px;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    margin: 0;
  }
}

</style>

          </head>

          <body onload="window.print(); window.close();">
            ${finalHtml}
          </body>
        </html>
      `);

        popupWin.document.close();
      }
    }, 100);
  }

printDivBarcodeWithCompany(divId: string, qty: number): void {

  this.showPrintLogo = true;
  this.showPdfLogo = false;

  setTimeout(() => {

    const sourceElement = document.getElementById(divId);
    if (!sourceElement) return;

    // Collect all styles from current page
    const styles = Array.from(document.styleSheets)
      .map((sheet: any) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule: any) => rule.cssText)
            .join('');
        } catch {
          return '';
        }
      })
      .join('');

    let finalHtml = '';

    // Keep original label structure and print one label per page for label printers.
    for (let i = 0; i < qty; i++) {
      finalHtml += `
        <div class="print-page">
          <div class="label-content-area">
            ${sourceElement.innerHTML}
          </div>
        </div>
      `;
    }

    const popupWin = window.open('', '_blank', 'width=900,height=600');

    if (popupWin) {

      popupWin.document.open();

      popupWin.document.write(`
      <html>
        <head>

          <title>Print Barcode</title>

          <!-- Bootstrap -->
          <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">

          <!-- FontAwesome -->
          <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

          <style>

          ${styles}

          html, body{
            margin:0;
            padding:0;
          }

          .print-page{
            width:4in;
            height:6in;
            margin:0 auto;
            padding:0;
            display:flex;
            justify-content:flex-start;
            align-items:flex-start;
            box-sizing:border-box;
            page-break-after:always;
            break-after:page;
          }

          /* Keep only 4.5in data area; remaining 1.5in is for pre-printed logo/company */
          .label-content-area{
            width:4in;
            height:4.5in;
            overflow:hidden;
            box-sizing:border-box;
          }

          .print-page:last-child{
            page-break-after:auto;
            break-after:auto;
          }

          @media print{

            body{
              -webkit-print-color-adjust:exact;
              print-color-adjust:exact;
            }

            @page{
              size:4in 6in;
              margin:0;
            }

          }

          </style>

        </head>

        <body onload="window.print(); window.close();">

          ${finalHtml}

        </body>
      </html>
      `);

      popupWin.document.close();

    }

  }, 100);

}

// Add this method to your component class
getFieldLabel(fieldName: string): string {
  const fieldLabels: { [key: string]: string } = {
    // Booking Form Fields
    'DepartmentMasterSid': 'Department',
    'CustomerMasterSid': 'Customer',
    'CustomerAddress': 'Customer Address',
    'ShipperName': 'Shipper Name',
    'ShipperAddress': 'Shipper Address',
    // 'ConsigneeName': 'Consignee Name',
    // 'ConsigneeAddress': 'Consignee Address',
    'POL': 'Port of Loading',
    'POD': 'Port of Discharge',
    'IncoTerms': 'INCO Terms',
    
    // Cargo Form Fields
    'ContainerType': 'Container Type',
    'NoofContainers': 'No. of Container',
    'ProductName': 'Commodity',
    'ShippingBillNo': 'Shipping Bill No',
    'ShippingBillDate': 'Shipping Bill Date',
    'ExternaPkg': 'External Package',
    'ExternlQty': 'External Quantity',
    'GrossWeight': 'Gross Weight',
    'NetWeight': 'Net Weight',
    'Volume': 'CBM',
    'Volumetric': 'Volumetric Weight',
    'UomMasterSid': 'UOM',
    'CargoRecDate': 'Cargo Received Date',
    'Length': 'Length',
    'Width': 'Width',
    'Height': 'Height',
    'ImcoClass': 'Imco Class',
    'UnNo': 'UN No',
    'PkgGroup': 'Pkg Group',
    
    // CRO Form Fields
    'ReleaseOrderDate': 'Release Order Date',
    'Transporter': 'Transporter',
    'EmptyYard': 'Empty Yard'
  };
  
  return fieldLabels[fieldName] || fieldName;
}

private getProductValidationMessage(): string {
  const hasNetWeightError = this.bookingProducts.controls.some(control => {
    const productGroup = control as FormGroup;
    return productGroup.get('NetWeight')?.hasError('netGreaterThanGross')
      || productGroup.get('GrossWeight')?.hasError('grossLessThanNet');
  });

  if (hasNetWeightError) {
    return 'Net Weight cannot be greater than Gross Weight';
  }

  return 'Please fill all required product fields correctly.';
}

public shouldShowProductFieldError(product: AbstractControl | null, fieldName: string): boolean {
  const control = product?.get(fieldName);
  return !!control && control.invalid && (control.touched || control.dirty);
}

public getProductFieldErrorMessage(product: AbstractControl | null, fieldName: string): string {
  const control = product?.get(fieldName);

  if (!control || !control.errors) {
    return '';
  }

  const label = this.getFieldLabel(fieldName);

  if (control.errors['required']) {
    return `${label} is required`;
  }

  if (control.errors['min']) {
    return `${label} must be greater than 0`;
  }

  if (control.errors['max']) {
    return `${label} is too large`;
  }

  if (control.errors['decimalPrecision']) {
    return `${label} has invalid decimal precision`;
  }

  if (control.errors['grossLessThanNet']) {
    return 'Gross Weight cannot be less than Net Weight';
  }

  if (control.errors['netGreaterThanGross']) {
    return 'Net Weight cannot be greater than Gross Weight';
  }

  return `${label} is invalid`;
}

public getProductRowErrors(product: AbstractControl | null): string[] {
  const fields = [
    'ProductName',
    'ExternaPkg',
    'ExternlQty',
    'UomMasterSid',
    'Volume',
    'GrossWeight',
    'NetWeight',
    'ImcoClass',
    'UnNo',
    'PkgGroup'
  ];

  return fields
    .filter(fieldName => this.shouldShowProductFieldError(product, fieldName))
    .map(fieldName => this.getProductFieldErrorMessage(product, fieldName))
    .filter((message, index, messages) => !!message && messages.indexOf(message) === index);
}

get isTranshipmentMode(): boolean {
  return String(this.b['JobType']?.value || '').trim().toLowerCase() === 'transhipment';
}

private get transhipmentEditableBookingControls(): string[] {
  return ['VesselName', 'isVesselFreeText', 'VoyageNo', 'isVoyageFreeText', 'ETA', 'ETD'];
}

private isTranshipmentSuspended(): boolean {
  const statusValue = String(this.b['status']?.value || '').trim().toLowerCase();
  return statusValue === 'suspended' || this.bookingData?.status === 'S';
}

private hasTranshipmentVesselVoyage(): boolean {
  return !!String(this.b['VesselName']?.value || '').trim()
    && !!String(this.b['VoyageNo']?.value || '').trim();
}

public canSaveBooking(): boolean {
  if ((!this.mps.can('update') && this.isEditMode) || this.isSaving || (this.isEditMode && this.isSuspended)) {
    return false;
  }

  if (this.isTranshipmentMode) {
    return this.hasTranshipmentVesselVoyage();
  }

  return this.isHBLNoValid();
}

private validateTranshipmentManualFields(): boolean {
  if (this.hasTranshipmentVesselVoyage()) {
    return true;
  }

  this.b['VesselName']?.markAsTouched();
  this.b['VoyageNo']?.markAsTouched();
  this.selectedTab = 'Shipment';
  this.appSettingService.showWarning('Please enter Vessel and Voyage.');
  return false;
}

private applyTranshipmentRestrictions(): void {
  if (!this.isTranshipmentMode) {
    return;
  }

  this.b['isVesselFreeText']?.setValue(true, { emitEvent: false });
  this.b['isVoyageFreeText']?.setValue(true, { emitEvent: false });

  const canEditTranshipmentFields = !this.isTranshipmentSuspended();

  Object.keys(this.bookingForm.controls).forEach(key => {
    const control = this.bookingForm.get(key);
    if (this.transhipmentEditableBookingControls.includes(key) && canEditTranshipmentFields) {
      control?.enable({ emitEvent: false });
    } else {
      control?.disable({ emitEvent: false });
    }
  });

  Object.keys(this.cargoForm.controls).forEach(key => {
    this.cargoForm.get(key)?.disable({ emitEvent: false });
  });

  Object.keys(this.otherForm.controls).forEach(key => {
    this.otherForm.get(key)?.disable({ emitEvent: false });
  });

  Object.keys(this.croForm.controls).forEach(key => {
    this.croForm.get(key)?.disable({ emitEvent: false });
  });

  this.bookingCargo.controls.forEach((cargoGroup: FormGroup) => {
    Object.keys(cargoGroup.controls).forEach(key => {
      if (key !== 'bookingProducts') {
        cargoGroup.get(key)?.disable({ emitEvent: false });
      }
    });

    (cargoGroup.get('bookingProducts') as FormArray)?.controls.forEach((product: FormGroup) => {
      Object.keys(product.controls).forEach(key => {
        product.get(key)?.disable({ emitEvent: false });
      });
    });
  });

  this.bookingProducts.controls.forEach((product: FormGroup) => {
    Object.keys(product.controls).forEach(key => {
      product.get(key)?.disable({ emitEvent: false });
    });
  });
}

toggleProductInputType(formGroup: AbstractControl, mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
  event.stopPropagation();
  const value = formGroup.get(flagCtrl)?.value;
  formGroup.get(flagCtrl)?.setValue(!value);
  formGroup.get(mainCtrl)?.reset();
}

logProduct(index: number, cargoIndex: number = -1): void {
  const productForm = cargoIndex < 0
    ? this.bookingProducts.at(index) as FormGroup
    : this.bookingCargoProducts(cargoIndex).at(index) as FormGroup;
  if (!productForm) {
    return;
  }

  if (this.usesDimensionalCargoFields()) {
    this.calculateProductFormCBMAndVolumetric(productForm);
  }
  this.handleProductRelatedCalculation(cargoIndex);
}

getProductFormGroup(index: number): FormGroup {
  return this.bookingProducts.at(index) as FormGroup;
}
/**
 * Disables all form fields in the booking screen
 */
private disableAllForms(): void {
  // Disable booking form controls
  Object.keys(this.bookingForm.controls).forEach(key => {
    // Keep some fields enabled if needed (like status or readonly fields)
    if (!['status'].includes(key)) {
      this.bookingForm.get(key)?.disable();
    }
  });

  // Disable cargo form controls
  Object.keys(this.cargoForm.controls).forEach(key => {
    this.cargoForm.get(key)?.disable();
  });

  this.bookingCargo.controls.forEach((cargoGroup: FormGroup) => {
    Object.keys(cargoGroup.controls).forEach(key => {
      if (key !== 'bookingProducts') {
        cargoGroup.get(key)?.disable();
      }
    });

    (cargoGroup.get('bookingProducts') as FormArray)?.controls.forEach((product: FormGroup) => {
      Object.keys(product.controls).forEach(key => {
        product.get(key)?.disable();
      });
    });
  });
  

  // Disable other form controls
  Object.keys(this.otherForm.controls).forEach(key => {
    this.otherForm.get(key)?.disable();
  });

  // Disable CRO form controls
  Object.keys(this.croForm.controls).forEach(key => {
    this.croForm.get(key)?.disable();
  });

  // Disable all product controls
  this.bookingProducts.controls.forEach((product: FormGroup) => {
    Object.keys(product.controls).forEach(key => {
      product.get(key)?.disable();
    });
  });

  // Disable child components
  this.isFormDisabled = true;
  
  // Also disable tabs/actions if needed
  this.showGenerateJobButton = false;
}

/**
 * Enables all form fields in the booking screen
 */
private enableAllForms(): void {
  // Enable booking form controls except some
  Object.keys(this.bookingForm.controls).forEach(key => {
    if (key !== 'DepartmentMasterSid' && key !== 'CustomerMasterSid') {
      this.bookingForm.get(key)?.enable();
    }
  });

  // Enable cargo form controls
  Object.keys(this.cargoForm.controls).forEach(key => {
    this.cargoForm.get(key)?.enable();
  });

  this.bookingCargo.controls.forEach((cargoGroup: FormGroup) => {
    Object.keys(cargoGroup.controls).forEach(key => {
      if (key !== 'bookingProducts') {
        cargoGroup.get(key)?.enable();
      }
    });

    (cargoGroup.get('bookingProducts') as FormArray)?.controls.forEach((product: FormGroup) => {
      Object.keys(product.controls).forEach(key => {
        product.get(key)?.enable();
      });
    });
  });

  // Enable other form controls
  Object.keys(this.otherForm.controls).forEach(key => {
    this.otherForm.get(key)?.enable();
  });

  // Enable CRO form controls
  Object.keys(this.croForm.controls).forEach(key => {
    this.croForm.get(key)?.enable();
  });

  // Enable all product controls
  this.bookingProducts.controls.forEach((product: FormGroup) => {
    Object.keys(product.controls).forEach(key => {
      product.get(key)?.enable();
    });
  });

  this.isFormDisabled = false;
}
isHBLNoValid(): boolean {
    const hblNo = this.b['HBLNo']?.value;
  
  // Return true (enable button) when HBLNo is null/undefined/empty string
  // Return false (disable button) when HBLNo has any value
  return !hblNo || hblNo.trim() === '';
}
  onStatusChange(){
    const status = this.b['status']?.getRawValue();
    if (this.bookingData?.houseJob && (status === 'Suspended' || !status)) {
      this.appSettingService.showWarning(
        `This booking cannot be suspended.\n\nHouse Job with HBL No: ${this.bookingData?.houseJob?.HBLNo} is associated with it.`
      );
      this.b['status']?.setValue('Active');
    }
  }

  private getDepartmentTypeForNavigation(): string {
    return String(
      this.selectedDepartmentType ??
      this.bookingData?.departmentMaster?.departmentType ??
      this.bookingHeader?.departmentMaster?.departmentType ??
      ''
    ).toUpperCase();
  }

  canNavigateFromHBLNo(): boolean {
    const houseJobSid =
      this.bookingData?.HouseJobSid ??
      this.bookingHeader?.HouseJobSid ??
      this.bookingData?.houseJob?.HouseJobSid ??
      this.b?.['HouseJobSid']?.getRawValue();
    return !!houseJobSid;
  }

  canNavigateFromMBLNo(): boolean {
    const masterJobSid =
      this.bookingData?.MasterNoSid ??
      this.bookingHeader?.MasterNoSid ??
      this.bookingData?.houseJob?.masterJob?.MasterJobSid ??
      this.bookingHeader?.houseJob?.masterJob?.MasterJobSid;
    return !!masterJobSid;
  }

  navigateFromHBLNo(): void {
    const houseJobSid =
      this.bookingData?.HouseJobSid ??
      this.bookingHeader?.HouseJobSid ??
      this.bookingData?.houseJob?.HouseJobSid ??
      this.b?.['HouseJobSid']?.getRawValue();

    if (!houseJobSid) {
      this.appSettingService.showWarning('House Job not available');
      return;
    }

    const departmentType = this.getDepartmentTypeForNavigation();
    if (departmentType === 'AIR') {
      this.router.navigate(['/operation/hawb-bill/entry', houseJobSid]);
      return;
    }

    this.router.navigate(['/operation/house-job/entry', houseJobSid]);
  }

  navigateFromMBLNo(): void {
    const masterJobSid =
      this.bookingData?.MasterNoSid ??
      this.bookingHeader?.MasterNoSid ??
      this.bookingData?.houseJob?.masterJob?.MasterJobSid ??
      this.bookingHeader?.houseJob?.masterJob?.MasterJobSid;

    if (!masterJobSid) {
      this.appSettingService.showWarning('Master Job not available');
      return;
    }

    const departmentType = this.getDepartmentTypeForNavigation();
    if (departmentType === 'AIR') {
      this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
      return;
    }

    this.router.navigate(['/operation/master-job/entry', masterJobSid]);
  }

  /**
 * Creates a copy of the current booking with specific fields cleared
 */
copyBooking(): void {
  if (!this.bookingData) {
    this.appSettingService.showWarning('No booking data to copy');
    return;
  }

  // Show confirmation dialog
  this.commonModalService.confirm(
    'Are you sure you want to copy this booking?',
    'Copy Booking',
    'Copy'
  ).then((confirmed) => {
    if (confirmed) {
      this.performBookingCopy();
    }
  });
}

/**
 * Performs the actual booking copy operation
 */
private performBookingCopy(): void {
  this.spinner.show();

  const copiedData = this.prepareCopiedBookingData();

  this.router.navigate(['operation/booking/entry'], {
    state: {
      copiedBookingData: copiedData,
      isCopiedBooking: true
    }
  });
}

/**
 * Patches the booking data with cleared fields
 */
private prepareCopiedBookingData(): any {
  const copiedData = { ...this.bookingData };

  const fieldsToClear = {
    BookingNo: null,
    BookingHeaderSid: null,
    HBLNo: '',
    HouseJobSid: null,
    MBLNo: '',
    MBLDate: null,
    VesselName: null,
    VoyageNo: null,
    VoyageMasterSid: null,
    ETA: null,
    ETD: null,
    PortCutoffDate: null,
    BookingDateTime: new Date(),
    DoValid: null,
    QuotationHeaderSid: null,
    QuoteRouteSid: null,
    ShipmentNo: '',
    BookingStatus: 'Booked'
  };

  if (copiedData.bookingCargo?.length) {
    copiedData.bookingCargo = copiedData.bookingCargo.map(c => ({
      ...c,
      BookingCargoSid: null,
      GrossWeight: 0,
      NetWeight: 0,
      Volume: 0,
      Volumetric: 0,
      ChargeableWeight: 0,
      NoOfPackage: 0
    }));
  }

  copiedData.bookingOthers = [];

  copiedData.bookingCr = [];

  copiedData.bookingProduct = [];

  copiedData.bookingConnection = [];

  const rateFieldsToExclude = new Set([
    'PaymentRequestSid',
    'revenueVoucherHeader',
    'revenueVoucherTypeMaster',
    'costVoucherHeader',
    'costVoucherTypeMaster',
    'CostVoucherHeaderSid',
    'CostVoucherTypeMasterSid',
    'RevenueVoucherHeaderSid',
    'RevenueVoucherTypeMasterSid',
    'AgentBranchSid',
    'AgentMasterSid',
    'CustomerMasterSid',
    'CustomerBranchSid',
    'BookingRatesSid',
    'BookingHeaderSid'
  ]);

  copiedData.bookingRates = (copiedData.bookingRates || []).map((rate: any) => {
    return Object.keys(rate).reduce((cleanRate: any, key: string) => {
      if (!rateFieldsToExclude.has(key)) {
        cleanRate[key] = rate[key];
      }
      return cleanRate;
    }, {});
  });

  Object.assign(copiedData, fieldsToClear);

  return copiedData;
}
isCargoFromQuotation(cargoIndex: number): boolean {
  if (!this.b['QuotationHeaderSid']?.getRawValue()) {
    return false;
  }

  const cargoGroup = this.bookingCargo.at(cargoIndex) as FormGroup;
  if (!cargoGroup) {
    return false;
  }

  return !!cargoGroup.get('isFromQuotation')?.value;
}

}

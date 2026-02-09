import { Component, ViewChild, TemplateRef, OnInit, Input, OnDestroy } from '@angular/core';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
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
import { PdfMakeService } from 'src/app/common/pdf';
import { CommonService } from 'src/app/common/common.service';
import { Menu } from 'angular-feather/icons';
import { VolumetricAndCbmCalculationService } from 'src/app/core/services/volumetric-and-cbm-calculation.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { SafeInsertShipmentMilestone } from '../../services/shipment-milestone.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { BarcodeConfig, BarcodeService } from 'src/app/core/services/bar-code.service';
import { NgxBarcode6Module } from 'ngx-barcode6';
import { VerticalSidebarService } from 'src/app/shared/vertical-sidebar/vertical-sidebar.service';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { getDefaultTodayDate } from 'src/app/common/helper';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { ToastrService } from 'ngx-toastr';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { HostListener } from '@angular/core';
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
    PrintHeaderComponent
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

  parsedBookings: BookingData[] = [];
  showParsedData = false;
  uploadResult: any = null;
  isSaving : boolean = false;
  isDirty: boolean = false;
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
  MenuMasterSid: any;
  filterOption: any;
  isFormDisabled: boolean = false;
  private hasShownVesselWarning = false;
  public rateComponent = CostEntryComponent;
  public ArApcomponent = ArApComponent;
  selectTab(tab: string) {
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
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  incoList: any[] = [];
  TandCList: any[] = [];
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
  arapData: any[] = [];
arapLoading = false;
arapFilter = {
  voucherType: 'all', // 'all', 'revenue', 'cost'
  status: 'all' // 'all', 'unpaid', 'partial', 'paid'
};


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
    // { name: 'Product', icon: 'fas fa-box' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'AR/AP', icon: 'fas fa-file-alt' },
    // { name: 'Others', icon: 'fas fa-ellipsis-h' },
  ];
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
    private toastr: ToastrService
  ) {
    this.today = this.calendar.getToday();
    // const nav = this.router.getCurrentNavigation();
    // console.log(nav)
    // this.dataFromQuotation = nav?.extras?.state?.['dataFromQuotation'] ?? {};
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
    this.userData = this.appSettingService.getDecryptedUserProfile();
    if (this.userData) {
    }
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = Number(localStorage.getItem('currentMenuId'));
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


    this.initBookingForm();
    this.initCargoForm();
    this.initOtherForm();
    this.initCroForm();
    this.initDetailsForm();
    this.onShipmentTypeChange();


    const historyState = history?.state;
    const quotationData = historyState?.dataFromQuotation;
    this.dataFromQuotation = quotationData?.quotation ? quotationData : {};


    if (quotationData?.quotation) {
      history.replaceState({}, '', location.pathname);
    }

    this.getCurrentCompanyBranches();
    console.log('Current company branches:', this.currentCompanyBranches);


    this.spinner.show();
    this.loadHeaderMandatoryParts().subscribe(() => {
      this.loadHeaderLookups().subscribe();
      
      if (this.dataFromQuotation?.quotation) {
        this.patchBookingFromQuotation(this.dataFromQuotation);
        this.patchValues(this.dataFromQuotation);
        this.minDate = this.today;
      } else {
        
        this.currentRoute.paramMap.subscribe((param) => {
          this.BookingHeaderSid = +param.get('id');
          if (this.BookingHeaderSid) {
            this.isEditMode = true;
            this.loadBookingById(this.BookingHeaderSid);
            this.getAuditLog();
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

      this.bookingForm.get('IncoTerms')?.valueChanges.subscribe((incoTerm) => {
        this.autoSetFreightTerms(incoTerm);
      });
      this.bookingForm.get('BookingStatus')?.valueChanges.subscribe((status) => {
      this.updateGenerateJobButtonVisibility();
    });

      this.spinner.hide();
    });
  }

  private updateGenerateJobButtonVisibility(): void {
  const isFCLDepartment = this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "AIR";
  const isStuffedStatus = this.b['BookingStatus']?.value === 'Stuffed';
  
  this.showGenerateJobButton = isFCLDepartment && !isStuffedStatus;
}

  ngAfterViewInit(): void {
    if (!this.isEditMode) {
      this.departmentLookup.focus();
    }
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
  if (!this.isEditMode) return false;
  
  return this.bookingForm.dirty || 
         this.cargoForm.dirty || 
         this.otherForm.dirty;
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
        console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          console.log("Final City Name:", this.currentBranchCityName);
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
    this.bookingForm = this.fb.group({
      BookingNo: [{ value: '', disabled: true }],
      BookingDateTime: [today, [Validators.required]],
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
      ConsigneeName: [null, [Validators.required]],
      ConsigneeAddress: ['', [Validators.required]],
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
      CutOffDate: [{ value: null, disabled: true }],
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
    })
    this.cargoForm.get('GrossWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(this.cargoForm);
      this.calculateChargeableWeight();
    });
    this.cargoForm.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(this.cargoForm);
    });
    this.cargoForm.get('Volume')?.valueChanges.subscribe(() => {
    this.calculateChargeableWeight();
  });
    this.cargoForm.get('Volumetric')?.valueChanges.subscribe(() => {
    this.calculateChargeableWeight(); // Add this
  });
    this.cargoForm.valueChanges.subscribe(() => {
      this.syncFormValueWithRateComponent();
    })
  }

  // Product Form Initialization
  initProductForm() {
    const isIndianCompany = this.countryOfCompany === 'india';
    const isAirOrLCL = this.selectedFCLLCL === 'AIR' || this.selectedFCLLCL === 'LCL';
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
      Volumetric: ['',isAirOrLCL ? [Validators.required] : []],
      Volume: ['',[Validators.required,Validators.min(0.001)]],
      IsHaz: [false],
      ImcoClass: [null],
      UnNo: [''],
      PkgGroup: [''],
      Length: [''],
      Width: [''],
      Height: [''],
      UomMasterSid: [2,isAirOrLCL ? [Validators.required] : []],
      CargoRecDate: [null]
    });
    this.setupImmediateCBMCalculation();
    this.setupImmediateVolumetricCalculation(this.productForm)
  }

  private calculateChargeableWeight(): void {
  const volumetric = Number(this.c['Volumetric']?.value) || 0;
  const volume  = Number(this.c['Volume']?.value) || 0;
  
  let chargeableWeight = 0;
  
  // Chargeable Weight is the greater of Volumetric or Gross Weight
  if (volumetric > volume ) {
    chargeableWeight = volumetric;
  } else {
    chargeableWeight = volume;
  }
  
  // Update the chargeable weight field
  if (chargeableWeight > 0) {
    this.c['ChargeableWeight']?.setValue(
      Number(chargeableWeight.toFixed(this.decimalAfterPrecision)), 
      { emitEvent: false }
    );
  } else {
    this.c['ChargeableWeight']?.setValue('', { emitEvent: false });
  }
}

private setupImmediateCBMCalculation() {
  const dimensionFields = ['ExternlQty', 'Length', 'Width', 'Height', 'UomMasterSid'];
  
  dimensionFields.forEach(field => {
    this.productForm.get(field)?.valueChanges.subscribe(() => {
      // Calculate immediately on every change
      this.calculateCBM();
    });
  });
}

private calculateCBM() {
  const externlQty = this.parseFloatSafe(this.productForm.get('ExternlQty')?.value);
  const length = this.parseFloatSafe(this.productForm.get('Length')?.value);
  const width = this.parseFloatSafe(this.productForm.get('Width')?.value);
  const height = this.parseFloatSafe(this.productForm.get('Height')?.value);
  const uomMasterSid = this.productForm.get('UomMasterSid')?.value;
  
  // Calculate immediately if we have at least some values
  if (externlQty >= 0 && length >= 0 && width >= 0 && height >= 0 && uomMasterSid) {
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
    const externlQty = Number(productForm.get('ExternlQty')?.value) || 0;
    const length = Number(productForm.get('Length')?.value) || 0;
    const width = Number(productForm.get('Width')?.value) || 0;
    const height = Number(productForm.get('Height')?.value) || 0;
    const uomMasterSid = productForm.get('UomMasterSid')?.value;
    
    // Calculate if we have at least one dimension and quantity
    if (externlQty > 0 && (length > 0 || width > 0 || height > 0) && uomMasterSid) {
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

  createBookingProductGroup(data?: any): FormGroup {
    const isAirOrLCL = this.selectedFCLLCL === 'AIR' || this.selectedFCLLCL === 'LCL';
    const productForm = this.fb.group({
      BookingProductSid: [data?.BookingProductSid || null],
      ProductName: [data?.ProductName || null,[Validators.required]],
      isProductFreeText: [data?.isProductFreeText || false],
      ShippingBillNo: [data?.ShippingBillNo || ''],
      ShippingBillDate: [data?.ShippingBillDate ? new Date(data?.ShippingBillDate) : null],
      ExternaPkg: [data?.ExternaPkg || null, [Validators.required]],
      ExternlQty: [data?.ExternlQty || '', [Validators.required]],
      GrossWeight: [Number(data?.GrossWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required,Validators.min(0.001)]],
      NetWeight: [Number(data?.NetWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.min(0)]],
      Volume: [Number(data?.Volume || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required,Validators.min(0.001)]],
      IsHaz: [data?.IsHaz ? (data.IsHaz === "Y" ? true : false) : false],
      ImcoClass: [{ value: data?.ImcoClass || null, disabled: true }],
      UnNo: [{ value: data?.UnNo || '', disabled: true }],
      PkgGroup: [{ value: data?.PkgGroup || '', disabled: true }],
      Length: [data?.Length || ''],
      Width: [data?.Width || ''],
      Height: [data?.Height || ''],
      Volumetric: [data?.Volumetric|| '',isAirOrLCL ? [Validators.required] : []],
      UomMasterSid: [data?.UomMasterSid || 2,isAirOrLCL ? [Validators.required] : []],
      CargoRecDate: [data?.CargoRecDate ? new Date(data?.CargoRecDate) : null]
    });

      // Check if department is LCL or AIR
  const isLCLorAIR = this.selectedFCLLCL === 'LCL' || this.selectedFCLLCL === 'AIR';
  
  if (isLCLorAIR) {
    // Always setup calculations for LCL/AIR
    this.setupProductFormImmediateCalculation(productForm);
    this.setupImmediateVolumetricCalculationForFormArray(productForm);
    
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
      ['ExternlQty', 'GrossWeight', 'NetWeight', 'Volume'].forEach(field => {
        productForm.get(field)?.disable();
      })
    }
    productForm.get('CargoRecDate')?.valueChanges.subscribe(value => {
      if(value){
        ['ExternlQty','GrossWeight','NetWeight','Volume'].forEach(field => {
          productForm.get(field)?.disable();
        })
      }
    })

    return productForm;
  }

  private setupProductFormImmediateCalculation(productForm: FormGroup) {
  const dimensionFields = ['ExternlQty', 'Length', 'Width', 'Height', 'UomMasterSid'];
  
  dimensionFields.forEach(field => {
    productForm.get(field)?.valueChanges.subscribe(() => {
      this.calculateProductFormCBMAndVolumetric(productForm);
    });
  });
}

private calculateProductFormCBMAndVolumetric(productForm: FormGroup) {
  const externlQty = this.parseFloatSafe(productForm.get('ExternlQty')?.value);
  const length = this.parseFloatSafe(productForm.get('Length')?.value);
  const width = this.parseFloatSafe(productForm.get('Width')?.value);
  const height = this.parseFloatSafe(productForm.get('Height')?.value);
  const uomMasterSid = productForm.get('UomMasterSid')?.value;

  // Calculate both CBM and Volumetric when UOM or dimensions change
  if (externlQty >= 0 && length >= 0 && width >= 0 && height >= 0 && uomMasterSid) {
    const { cbm, volumetric } = this.volumetricAndCbmCalculationService.calculateCBMAndVolumetric(
      externlQty, length, width, height, uomMasterSid,
      this.selectedFCLLCL as 'LCL' | 'AIR',
      this.digitsAfterDecimal
    );
    
    // Update both fields
    productForm.get('Volume')?.setValue(cbm > 0 ? cbm : '', { emitEvent: false });
    productForm.get('Volumetric')?.setValue(volumetric > 0 ? volumetric : '', { emitEvent: false });
    
    // Update main cargo form totals
    setTimeout(() => {
      this.handleProductRelatedCalculation();
    }, 100);
  } else {
    productForm.get('Volume')?.setValue('', { emitEvent: false });
    productForm.get('Volumetric')?.setValue('', { emitEvent: false });
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
      this.departmentList = departments.data;
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

    }).pipe(tap(({ shippers, consignees, notify, carriers,airline, vessels, incos, salesmans, agents, forwarder, yard, cfs, }) => {
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
      if (this.bookingData) {
        this.evaluateDropdownOrFreeText();
      }
    }))
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
    this.operationService.getBookingById(BookingHeaderSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          // this.resetForm();
          this.patchValues(resp.data);
          this.bookingData = resp.data;
          this.minDate = undefined;
          this.spinner.hide();
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
        }
      }
    )
  }

  
  patchValues(response: any) {
    console.log(response);
    this.bookingHeader = response;
    const barcodeData = `${response.BookingNo}`;
    if(response.BookingNo){
      this.barcodeBookingNo = this.barcodeService.convertToBarcode(response.BookingNo);
    }
      const hasHBLNo = response.HBLNo && response.HBLNo.trim() !== '' && 
                   response.HBLNo !== null && response.HBLNo !== undefined;
      const hasHouseJobSid = response.HouseJobSid || null;
                   if(hasHBLNo || hasHouseJobSid){
                     this.disableAllForms();
                   }
  

    // this.barcodeBookingNo = this.barcodeService.convertToBarcode(response.BookingNo);
    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectedCustomer = this.customerList.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
    this.onDeptChange(selectedDepartment);
    this.onCustomerChange(selectedCustomer);
    this.evaluateDropdownOrFreeText();
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
      CutOffDate: response.CutOffDate ? new Date(response.CutOffDate) : null,
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
    })
     if (this.isEditMode) {
        this.loadBookingARAPData();
    }
    this.getVesselVoyBasedOnPorts();
    this.b['DepartmentMasterSid']?.disable();
    this.b['CustomerMasterSid']?.disable();
    if (hasHBLNo||hasHouseJobSid) {
      this.b['HBLNo']?.disable();
      this.b['HouseJobSid']?.disable();
    }
   
    this.quotationNumber = response?.quotationHeader?.QuoteNumber || '';
    this.PODandFPODsame = response.POD === response.FPD;
    this.minStartDate = response.ETA;



    const cargoData = response.bookingCargo[0];
    this.cargoForm.patchValue({
      BookingCargoSid: cargoData?.BookingCargoSid,
      CargoType: cargoData?.CargoType || 'General',
      ContainerType: cargoData?.ContainerType,
      NoofContainers: cargoData?.NoofContainers,
      GrossWeight: cargoData?.GrossWeight,
      NetWeight: cargoData?.NetWeight,
      Volume: cargoData?.Volume,
      Volumetric: cargoData?.Volumetric,
      ChargeableWeight: cargoData?.ChargeableWeight,
      NoOfPackage: cargoData?.NoOfPackage,
      ShipmentTerms: cargoData?.ShipmentTerms,
      MovementType: cargoData?.MovementType,
      FreightTerms: cargoData?.FreightTerms,
      ModeOfTransport: cargoData?.ModeOfTransport,
      StuffingAt: cargoData?.StuffingAt
    });
    setTimeout(() => {
  // Manually trigger the chargeable weight calculation
  const grossWeight = this.cargoForm.get('GrossWeight')?.value;
  const netWeight = this.cargoForm.get('NetWeight')?.value;
  const volume = this.cargoForm.get('Volume')?.value;
  const volumetric = this.cargoForm.get('Volumetric')?.value;
  
  if (grossWeight || netWeight || volume || volumetric) {
    this.calculateChargeableWeight();
  }
}, 100);
    console.log("Patched Cargo", this.cargoForm.value);
    this.selectedFCLLCL = this.selectedDepartmentType === "SEA" ? this.selectedDepartment.FCLLCL.toUpperCase() : "AIR";
    if (this.selectedFCLLCL === "LCL" && this.selectedDepartment.ExportImport === "Export") {
      this.cargoForm.get('StuffingAt')?.setValue('Dock');
      this.cargoForm.get('StuffingAt')?.disable();
    } else {
      this.cargoForm.get('StuffingAt')?.enable();
    }

    this.selectedDepartmentType === "SEA" ? this.c['ModeOfTransport']?.setValue('Vessel') : null;
    this.selectedDepartmentType === "AIR" ? this.c['ModeOfTransport']?.setValue('Flight') : null;
    this.handleCFSOrYard();
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
    })
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
    });
  }

    this.bookingProducts.clear();
    const productsFromResponse = response.bookingProduct || [];
    this.productDataLength = productsFromResponse.length;
    if (this.productDataLength) {
      for (const productData of productsFromResponse) {
        const formWithData = this.createBookingProductGroup(productData);
        const productExists = this.productList?.some(
      p => p.ProductName?.trim().toLowerCase() ===
           productData.ProductName?.trim().toLowerCase()
    );

    // ✅ Set free-text flag correctly
    formWithData
      .get('isProductFreeText')
      ?.setValue(!productExists);
        this.bookingProducts.push(formWithData);
      }
      this.updateProductPagination();
      this.handleProductRelatedCalculation();
    }

    this.bookingConnectionsArr = (response.bookingConnection || []).map(connection => {
      return {
        ...connection,
        BookingConnectionSid: connection.BookingConnectionSid,
      }
    }); // for child component
    this.connectionResult = [...this.bookingConnectionsArr]

    this.bookingRateArr = (response.bookingRates || []).map(br => ({
      ...br,
      RateSid : br.BookingRatesSid,
      RevenueCustomerMasterSid : br.CustomerMasterSid,
      RevenueCustomerBranchSid : br.CustomerBranchSid,
      CostAgentMasterSid : br.AgentMasterSid,
      CostAgentBranchSid : br.AgentBranchSid,
      status : br.status  === "A" ? "Active" : "Suspended"
    }));
    this.rateResult = [...this.bookingRateArr];
    const shipmentTypeValue = response.ShipmentType === "Y" ? true : false;
    if (shipmentTypeValue) {
      this.bookingForm.get('NominatedBy')?.setValue('Nomination');
    } else {
      this.bookingForm.get('NominatedBy')?.setValue('Self');
    }

    this.syncFormValueWithRateComponent();
    this.applyTranshipmentRestrictions();
    this.isSaving = false;
    setTimeout(() => {
    this.initialFormValue = this.getCurrentFormState();
    this.isDirty = false;
    this.subscribeToFormChanges();
  }, 500);
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
        ExternaPkg: data?.ExternaPkg,
        ExternlQty: data?.ExternlQty,
        GrossWeight: data?.GrossWeight,
        NetWeight: data?.NetWeight,
        Volume: data?.Volume,
        IsHaz: data?.IsHaz,
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
      this.appSettingService.showWarning('Please fill all the required fields correctly.')
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

  handleConnectionChange(allConnections: any[]) {
    console.log(allConnections);
    if (allConnections.length > 0) {
      this.connectionResult = [...allConnections];
    }
  }

  handleRateChange(allRates: any[]) {
    console.log(allRates);
    if (allRates.length > 0) {
      this.rateResult = [...allRates];
    }
  }

  handleMilestoneChange(allmilestones: any[]) {
    console.log(allmilestones);
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
    console.log('Form Status:', this.bookingForm.status);
    console.log('Form Value', this.bookingForm.value);
    if (this.bookingForm.invalid) {
      const invalid = this.findInvalidControlsRecursive(this.bookingForm);
      console.log('Invalid controls:', invalid);
    } else {
      console.log('No invalid controls found.');
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
    console.log('Submit triggered', this.bookingForm.value);
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
  this.b['CutOffDate']?.setValue(cleanDate(this.b['CutOffDate']?.value));
  // Update the form state
  this.errorLogger();
  this.bookingForm.updateValueAndValidity();
       if (!this.validateAllForms()) {
        console.log("STOP 2 - validateAllForms failed");
      this.isSaving = false;
    return;
  }
  const polSid = this.bookingForm.get('POL')?.value;
  const podSid = this.bookingForm.get('POD')?.value;
    if (polSid && podSid && polSid === podSid) {
      this.toastr.warning('POL and POD cannot be the same');
      this.bookingForm.get('POD')?.setErrors({ samePort: true });
      this.bookingForm.get('POL')?.setErrors({ samePort: true });
      return;
    } 
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.bookingForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      console.log("STOP 3 - bookingForm invalid");
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

    if (this.selectedTab === 'CRO' && this.croForm.invalid) {
    this.croForm.markAllAsTouched();
    this.croForm.updateValueAndValidity();
    this.appSettingService.showWarning('Please fill all required fields in CRO tab correctly.');
    console.log("STOP 4 - CRO form invalid");
    this.isSaving = false;
    return;
  }

  if(!this.costEntryComponent.validateRateArray()){
    this.selectedTab = 'Rate';
    this.isSaving = false;
    return;
  }


    // const isRateValid = this.costEntryComponent?.validateRateArray?.();
    // console.log(isRateValid);
    // if (!isRateValid) {
    //   console.warn('Rate validation failed — submission stopped');
    //   return;
    // }
    console.log('Before',this.b['BookingStatus']?.getRawValue());
    this.updateBookingStatusOnCargoDate();
    console.log('After',this.b['BookingStatus']?.getRawValue());
    const bookingFormValue = this.bookingForm.getRawValue();
    const cargoFormValue = this.cargoForm.getRawValue();
    const otherFormValue = this.otherForm.getRawValue();
    const croFormValue = this.croForm.getRawValue();
    const detailFormValue = this.detailForm.getRawValue();
    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const currentMenuId = this.sidebarService.syncMenuIdBeforeSubmit("Booking") ||  Number(localStorage.getItem('currentMenuId'));
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
  
  console.log('QuoteRouteSid for payload:', QuoteRouteSid);

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
      CutOffDate: bookingFormValue.CutOffDate ? new Date(bookingFormValue.CutOffDate) : null, 
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

      bookingCargo: {
        BookingCargoSid: cargoFormValue.BookingCargoSid || null,
        CargoType: cargoFormValue.CargoType || 'General',
        ContainerType: cargoFormValue.ContainerType || null,
        NoofContainers: parseFloat(cargoFormValue.NoofContainers) || 1,
        GrossWeight: parseFloat(cargoFormValue.GrossWeight) || 0,
        NetWeight: parseFloat(cargoFormValue.NetWeight) || 0,
        Volume: parseFloat(cargoFormValue.Volume) || 0,
        Volumetric: parseFloat(cargoFormValue.Volumetric) || 0,
        ChargeableWeight: parseFloat(cargoFormValue.ChargeableWeight) || 0,
        NoOfPackage: parseFloat(cargoFormValue.NoOfPackage) || 0,
        ShipmentTerms: cargoFormValue.ShipmentTerms || null,
        MovementType: cargoFormValue.MovementType || null,
        FreightTerms: cargoFormValue.FreightTerms || null,
        ModeOfTransport: cargoFormValue.ModeOfTransport || null,
        StuffingAt: cargoFormValue.StuffingAt || 'Dock',
      },
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
      bookingProducts: detailFormValue.bookingProducts.map((product: any) => ({
        BookingProductSid: product.BookingProductSid || null,
        ProductName: product.ProductName || '',
        ShippingBillNo: product.ShippingBillNo || '',
        ShippingBillDate: product.ShippingBillDate ? new Date(product.ShippingBillDate) : null,
        ExternaPkg: product.ExternaPkg || null,
        ExternlQty: String(product.ExternlQty),
        GrossWeight: parseFloat(product.GrossWeight) || 0,
        NetWeight: parseFloat(product.NetWeight) || 0,
        Volume: parseFloat(product.Volume) || 0,
        IsHaz: product.IsHaz ? 'Y' : 'N',
        ImcoClass: product.ImcoClass || '',
        UnNo: product.UnNo || '',
        PkgGroup: product.PkgGroup || '',
        Length: parseFloat(product.Length),
        Width: parseFloat(product.Width),
        Height: parseFloat(product.Height),
        Volumetric: parseFloat(product.Volumetric) || 0,
        UomMasterSid: product.UomMasterSid,
        CargoRecDate: product.CargoRecDate
      })),
      bookingConnections: this.connectionResult,
      bookingRates: this.rateResult,
      milestones: this.milestoneResult,
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };
    console.log("rateResult:", this.rateResult);
    console.log('Submitted payload:', payload);

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
            if (resolve) resolve(true);
            // this.router.navigate(['operation/booking/list']);
            this.loadBookingById(this.BookingHeaderSid,true);
          } else {
            this.appSettingService.showError('Error updating booking.');
            this.isSaving = false;
             if (resolve) resolve(false);
            console.error(resp.message);
          }
        },
        error: (err) => {
          this.appSettingService.showError('Failed to update booking.');
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
            this.router.navigate(['operation/booking/entry', bookingId]);
          } else {
            this.appSettingService.showError('Error creating booking.');
            this.isSaving = false;
            if (resolve) resolve(false);
            console.error(resp.message);
          }
        },
        error: (err) => {
          this.appSettingService.showError('Failed to create booking.');
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

  // Validate Booking Form
  if (this.bookingForm.invalid) {
    this.bookingForm.markAllAsTouched();
    
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

  // Validate Cargo Form ONLY when on Cargo tab
  if (this.selectedTab === 'Cargo' && this.cargoForm.invalid) {
    this.cargoForm.markAllAsTouched();

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
  if (this.selectedTab === 'CRO' && this.croForm.invalid) {
    this.croForm.markAllAsTouched();
    
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

  // Validate Products in FormArray ONLY if at least one product exists
  if (this.bookingProducts.length > 0) {
    this.bookingProducts.controls.forEach((productGroup: FormGroup, index) => {
      // Check if product form is invalid
      if (productGroup.invalid) {
        productGroup.markAllAsTouched();
        
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
            }
          }
        });
        isValid = false;
      }

      // ADD THIS: Check if weight fields are 0 (which shouldn't be allowed)
      const grossWeight = Number(productGroup.get('GrossWeight')?.value) || 0;
      const volume = Number(productGroup.get('Volume')?.value) || 0;

      // For LCL and AIR: GrossWeight and NetWeight must be greater than 0
      if (this.selectedFCLLCL === 'LCL' || this.selectedFCLLCL === 'AIR') {
        if (grossWeight <= 0) {
          errorMessages.push(`Product ${index + 1}: Gross Weight is required`);
          productGroup.get('GrossWeight')?.setErrors({ min: true });
          isValid = false;
        }
      }

      // For FCL: GrossWeight, NetWeight, and Volume must be greater than 0
      if (this.selectedFCLLCL === 'FCL') {
        if (grossWeight <= 0) {
          errorMessages.push(`Product ${index + 1}: Gross Weight is required`);
          productGroup.get('GrossWeight')?.setErrors({ min: true });
          isValid = false;
        }
        if (volume <= 0) {
          errorMessages.push(`Product ${index + 1}: CBM is required`);
          productGroup.get('Volume')?.setErrors({ min: true });
          isValid = false;
        }
      }
    });
  }

  // Show error messages if any
  if (errorMessages.length > 0) {
    const errorMessage = errorMessages.join(', ');
    this.appSettingService.showWarning(errorMessage, 'Validation Errors');
  }

  return isValid;
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
      this.filteredPorts = [];
      this.filteredPOL = [];
      this.filteredPOD = [];
      this.b['POO'].setValue(null);
      this.b['POL'].setValue(null);
      this.b['POD'].setValue(null);
      this.b['FPD'].setValue(null);
      this.b['ETA'].setValue('');
      this.b['ETD'].setValue('');
      this.b['CutOffDate'].setValue('');
      this.b['MovementType'].setValue(null);
       this.b['JobType'].setValue('');
      this.handleImportExport();
      this.handleCFSOrYard()
      return;
    }
    this.selectedDepartmentType = department.departmentType.toUpperCase();
    this.selectedFCLLCL = this.selectedDepartmentType === "SEA" ? department.FCLLCL.toUpperCase() : "AIR";
     if (this.bookingProducts.length > 0) {
    this.bookingProducts.controls.forEach((productGroup: FormGroup, index) => {
      const isAirOrLCL = this.selectedFCLLCL === 'AIR' || this.selectedFCLLCL === 'LCL';
      
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
    const isFCLDepartment = this.selectedFCLLCL === "FCL";
  const isStuffedStatus = this.b['BookingStatus']?.value === 'Stuffed';
  
  this.showGenerateJobButton = isFCLDepartment && !isStuffedStatus;
    if (this.selectedFCLLCL === "LCL" && department.ExportImport === "Export") {
      this.cargoForm.get('StuffingAt')?.setValue('Dock');
      this.cargoForm.get('StuffingAt')?.disable();
    } else {
      this.cargoForm.get('StuffingAt')?.enable();
    }

    this.selectedDepartmentType === "SEA" ? this.c['ModeOfTransport']?.setValue('Vessel') : null;
    this.selectedDepartmentType === "AIR" ? this.c['ModeOfTransport']?.setValue('Flight') : null;
    this.handleCFSOrYard()
    this.onRouteChange()
    this.handleImportExport();
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
    const polSid = this.b['POL']?.value;
    const podSid = this.b['POD']?.value;
    const segment = this.selectedFCLLCL

    this.filteredPorts = this.getFilteredPortsBySegment(segment);
    this.filteredPOL = this.filteredPorts.filter(port => port.PortCode !== podSid);
    this.filteredPOD = this.filteredPorts.filter(port => port.PortCode !== polSid);
    if (polSid && podSid && polSid === podSid) {
      this.b['POD']?.setErrors({ samePort: true });
      this.b['POL']?.setErrors({ samePort: true });
      this.toastr.warning('POL and POD cannot be the same');
    } else {
      this.b['POD']?.setErrors(null);
      this.b['POL']?.setErrors(null);
    }
  }

  getFilteredPortsBySegment(segment: string): any[] {
    if (segment === 'AIR') {
      return this.portList.filter(port => port.PortType === 'Air');
    } else if (segment === 'FCL' || segment === 'LCL') {
      return this.portList.filter(port => port.PortType === 'Sea');
    }
    return [];
  }


  onCustomerChange(customer: any) {
  console.log(customer);
  
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
    console.log(exportImportType);
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
    this.b['VesselName']?.setValue(null);
    this.b['VoyageNo']?.setValue(null);
    this.b['ETA']?.setValue(null);
    this.b['ETD']?.setValue(null);
    this.b['CutOffDate']?.setValue(null);
    if (!selectedPort) {
      this.filteredPOD = [...this.filteredPorts];
      return;
    }
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.onRouteChange();
    this.getVesselVoyBasedOnPorts();
  }

  handlePODChange(selectedPort: any) {
    this.b['VesselName']?.setValue(null);
    this.b['VoyageNo']?.setValue(null);
    this.b['ETA']?.setValue(null);
    this.b['ETD']?.setValue(null);
    this.b['CutOffDate']?.setValue(null);
    if (!selectedPort) {
      this.filteredPOL = [...this.filteredPorts];
      this.b['FPD']?.setValue(null);
      this.PODandFPODsame = true;
      return;
    }
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.b['FPD']?.setValue(selectedPort.PortCode);
    this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value
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
    console.log('No voyage selected, clearing all voyage-related fields');
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
  console.log('=== getVesselVoyBasedOnPorts START ===');
  
  const POL = this.b['POL']?.value;
  const POD = this.b['POD']?.value;
  const voyageType = this.getVoyageTypeBasedOnDept(this.selectedDepartment?.DepartmentMasterSid);
  
  console.log('POL code:', POL);
  console.log('POD code:', POD);
  console.log('Voyage type:', voyageType);
  console.log('Port List:', this.portList);
  
  const POLSid = (this.portList.find(port => port.PortCode === POL)?.PortMasterSid);
  const PODSid = (this.portList.find(port => port.PortCode === POD)?.PortMasterSid);
  
  console.log('POLSid found:', POLSid, 'for POL:', POL);
  console.log('PODSid found:', PODSid, 'for POD:', POD);
  
  this.hasShownVesselWarning = false;
  
  if (!POLSid || !PODSid || !voyageType) {
    console.log('Missing required data - returning early:');
    console.log('- POLSid exists?:', !!POLSid);
    console.log('- PODSid exists?:', !!PODSid);
    console.log('- voyageType exists?:', !!voyageType);
    console.log('=== getVesselVoyBasedOnPorts END (early return) ===');
    return;
  }
  
  const payload = { POL: POLSid, POD: PODSid, segment: voyageType };
  console.log('Calling API with payload:', payload);
  
  this.operationService.getVesselVoyageBasedOnPorts(payload).subscribe(
    (resp: any) => {
      console.log('API Response:', resp);
      if (resp.status) {
        this.headerVesselList = resp.data.map(vslVoy =>({
            ...vslVoy , 
            ETD : vslVoy.ETD ? new Date (vslVoy.ETD) : null,
            ETA : vslVoy.ETA ? new Date (vslVoy.ETA) : null,
            CutOffDate: vslVoy.CutOffDate ? new Date (vslVoy.CutOffDate) : null,
        }));
        console.log('Header Vessel List updated:', this.headerVesselList.length, 'items');
        if (this.headerVesselList.length === 0 && !this.hasShownVesselWarning) {
          this.hasShownVesselWarning = true;
          console.log('No vessels found for route');
        }
      } else {
        console.log('API error:', resp);
        this.appSettingService.showError("Error loading Vessel");
      }
      console.log('=== getVesselVoyBasedOnPorts END (API complete) ===');
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

  handleProductChange(product: any, productIndex: number) {
    const productGroup = this.bookingProducts.at(productIndex) as FormGroup;
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

  onImcoChange(productIndex: number, item: any) {
    console.log(item);
    const productForm = this.bookingProducts.at(productIndex) as FormGroup;
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

  onHazChange(productIndex: number, event: any) {
    const element = event.target as HTMLInputElement;
    const control = this.bookingProducts.at(productIndex).get('IsHaz');
    if (event instanceof KeyboardEvent) {
      element.checked = !element.checked;
    }
    control.setValue(element.checked);
    this.toggleHazProduct(productIndex);
  }

  toggleHazProduct(productIndex: number) {
    const isHaz = this.bookingProducts.at(productIndex).get('IsHaz')?.value;
    console.log(isHaz);
    if (isHaz) {
      this.bookingProducts.at(productIndex).get('ImcoClass')?.enable();
      this.bookingProducts.at(productIndex).get('PkgGroup')?.enable();
      this.bookingProducts.at(productIndex).get('UnNo')?.enable();
      this.bookingProducts.at(productIndex).get('ImcoClass')?.setValidators(Validators.required);
      this.bookingProducts.at(productIndex).get('PkgGroup')?.setValidators(Validators.required);
      this.bookingProducts.at(productIndex).get('UnNo')?.setValidators(Validators.required);
    } else {
      this.bookingProducts.at(productIndex).get('ImcoClass')?.setValue(null);
      this.bookingProducts.at(productIndex).get('UnNo')?.setValue('');
      this.bookingProducts.at(productIndex).get('PkgGroup')?.setValue('');
      this.bookingProducts.at(productIndex).get('ImcoClass')?.clearValidators();
      this.bookingProducts.at(productIndex).get('ImcoClass')?.disable();
      this.bookingProducts.at(productIndex).get('UnNo')?.clearValidators();
      this.bookingProducts.at(productIndex).get('UnNo')?.disable();
      this.bookingProducts.at(productIndex).get('PkgGroup')?.clearValidators();
      this.bookingProducts.at(productIndex).get('PkgGroup')?.disable();
    }
  }

  deleteBookingProduct(productIndex: number, BookingProductSid?: number) {
    const productToDelete = this.bookingProducts.at(productIndex);
    if (BookingProductSid) {
      this.operationService.deleteBookingProduct(BookingProductSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.bookingProducts.removeAt(productIndex);
            this.productDataLength = this.bookingProducts.length;
            this.appSettingService.showSuccess('Product Deleted Successfully');
            // this.adjustPageAfterDelete();
            // this.updateProductPagination();
            this.handleProductRelatedCalculation();
          } else {
            this.appSettingService.showError("Error deleting product.");
          }
        })
    } else {
      this.bookingProducts.removeAt(productIndex);
      this.productDataLength = this.bookingProducts.length;
      this.appSettingService.showSuccess('Product Deleted Successfully');
      // this.adjustPageAfterDelete();
      this.handleProductRelatedCalculation();
    }
    this.bookingProducts.updateValueAndValidity();
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

  handleProductRelatedCalculation() {
    if (this.bookingProducts.length === 0) {
      this.c['NoOfPackage']?.enable(); this.c['NoOfPackage']?.setValue(0);
      this.c['GrossWeight']?.enable(); this.c['GrossWeight']?.setValue(0);
      this.c['NetWeight']?.enable(); this.c['NetWeight']?.setValue(0);
      this.c['Volume']?.enable(); this.c['Volume']?.setValue(0);
      this.c['Volumetric']?.enable(); this.c['Volumetric']?.setValue(0);
      this.c['ChargeableWeight']?.enable(); this.c['ChargeableWeight']?.setValue(0);
      return;
    }

    let totalNoOfPkg: any = 0;
    let totalGrossWeight: any = 0;
    let totalNetWeight: any = 0;
    let totalVolume: any = 0;
    let totalVolumetric: any = 0;

    let productValue = this.bookingProducts.getRawValue() || [];
    productValue.forEach(product => {
      totalNoOfPkg += (Number(product.ExternlQty) || 0);
      totalGrossWeight += Number(product.GrossWeight) || 0;
      totalNetWeight += Number(product.NetWeight) || 0;
      totalVolume += Number(product.Volume) || 0;
      totalVolumetric += Number(product.Volumetric) || 0;
    });

    this.c['NoOfPackage']?.setValue(Number(totalNoOfPkg.toFixed(this.decimalAfterPrecision)));
    this.c['NoOfPackage']?.disable();

    this.c['GrossWeight']?.setValue(Number(totalGrossWeight.toFixed(this.decimalAfterPrecision)));
    this.c['GrossWeight']?.markAsTouched();
    this.c['GrossWeight']?.disable();

    this.c['NetWeight']?.setValue(Number(totalNetWeight.toFixed(this.decimalAfterPrecision)));
    this.c['NetWeight']?.disable();

    this.c['Volume']?.setValue(Number(totalVolume.toFixed(this.decimalAfterPrecision)));
    this.c['Volume']?.disable();

    this.c['Volumetric']?.setValue(Number(totalVolumetric.toFixed(this.decimalAfterPrecision)));
    this.c['Volumetric']?.disable();
    this.calculateChargeableWeight();
  }

  // ************ END OF PRODUCT RELATED FUNCTIONS *************

  //  Other Form Related Functions

  setAddressOthers(controlName: string, item: any) {
    this.o[controlName]?.setValue(item ? item.Address : '')
  }

  handleCFSOrYard() {
    const stuffingAt = this.cargoForm.get('StuffingAt')?.value;

    console.log('handleCFSOrYard called:', {
      selectedDepartment: this.selectedDepartment,
      stuffingAt: stuffingAt,
      selectedFCLLCL: this.selectedFCLLCL
    });

    if (!this.selectedDepartment) {
      this.YardCFSLabel = "CFS";
      this.currentYardCFSType = null;

      return;
    }

    const isFCL = this.selectedFCLLCL === "FCL";
    const isExport = this.selectedDepartment?.ExportImport === "Export";
    const isLCL = this.selectedFCLLCL === "LCL";
    const isAIR = this.selectedFCLLCL === "AIR";

    console.log('Business rules:', { isFCL, isExport, isLCL, isAIR });

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

    console.log('Final Yard/CFS settings:', {
      label: this.YardCFSLabel,
      type: this.currentYardCFSType
    });


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
    const ChargeableWeight = this.c['ChargeableWeight']?.value;

    const CustomerMasterSid = this.b['CustomerMasterSid']?.getRawValue();
    const CustomerBranchSid = this.b['CustomerBranchSid']?.getRawValue();
    const BookingHeaderSid = this.BookingHeaderSid || this.bookingData?.BookingHeaderSid || this.b['BookingHeaderSid']?.value;
    const status=this.b['status']?.value;
    const HBLNo = this.b['HBLNo']?.getRawValue()||'';
    const HouseJobSid = this.b['HouseJobSid']?.getRawValue()||'';
    const salesmanSid = this.b['SalesmanSid']?.value || '';
    const salesmanName = this.salesmanList.find(s => s.UserMasterSid === salesmanSid)?.userName || '';

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
      EffectiveDate,
      ExpiredDate,
      CargoType,
      GrossWeight,
      NetWeight,
      Volume,
      Volumetric,
      NoofContainers,
      ChargeableWeight,
      countryOfCompany : this.countryOfCompany,
      SalesmanName : salesmanName
    }
  }


  navigateBack() {
    this.router.navigate(['operation/booking/list']);
  }
  
  selectedTab = 'Shipment';
  isQuickFormExpanded = false;

  resetForm() {
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
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.vesselList = [];
    this.voyageList = [];

    this.resetTriggerConnection = !this.resetTriggerConnection;
    this.connectionResult = [];
    this.resetTriggerRate = !this.resetTriggerRate;
    this.rateResult = [];
    this.resetTriggerMilestone = !this.resetTriggerMilestone;
    this.milestoneResult = [];

    this.detailForm.reset();
    (this.detailForm.get('bookingProducts') as FormArray).clear();

    this.slicedProductArr = [];
    this.productDataLength = 0;

    this.cargoForm.reset();
    this.otherForm.reset();
    this.croForm.reset();
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
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.BookingHeaderSid;

        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }
  async openEmail() {
    if (!this.bookingData) return;

    try {
      this.spinner.show();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate PDF blob automatically
      const pdfBlob = await this.generatePDFBlob();
      const pdfFileName = (this.bookingHeader?.BookingNo || 'booking') + '.pdf';
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

      await new Promise(resolve => setTimeout(resolve, 300));

      const modalRef = this.modalService.open(EmailEntryComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });

      const toEmailSet = new Set<string>();
      toEmailSet.add(this.selectedCustomerBranch?.Email);

      const toEmail = Array.from(toEmailSet);
      const ccEmail = [this.userData['userEmail']];

      const POL = this.bookingHeader?.POL;
      const POD = this.bookingHeader?.POD;
      const FPD = this.bookingHeader?.FPD;
      const formattedPOL = this.getFormattedPort(POL);
      const formattedPOD = this.getFormattedPort(POD);
      const formattedFPD = this.getFormattedPort(FPD);

      const subject = `Booking No.${this.bookingHeader.BookingNo} Date:${this.datePipe.transform(this.bookingHeader?.BookingDateTime)} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`;

      const mailBody = `Dear Sir/Madam,
Please find here enclosed the booking details as requested.
Kindly review the details at your convenience.
Looking forward to confirm cargo readyness.
Best Regards,
${this.userData['userName']}`;

      this.spinner.hide();

      modalRef.componentInstance.setContent = {
        EmailTo: toEmail,
        EmailCC: ccEmail,
        EmailBCC: [],
        Subject: subject,
        Mailbody: mailBody,
        attachments: [pdfFile]
      };

    } catch (error) {
      this.spinner.hide();
      console.error('PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF for email attachment.');
    }
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
  console.log(this.MenuMasterSid)
      this.commonService.documentData.set(data)
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
    this.followupModalRef.componentInstance.parentSubject = `__SUBJECT__ for Booking No."${this.bookingData.BookingNo}"`;
    this.followupModalRef.componentInstance.parentMailbodyTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <p>Dear Sir/Madam,</p>
      <p>Kindly do the needful for "__SUBJECT__" Booking No."${this.bookingData.BookingNo}" Dated:${new Date(this.bookingData.BookingDateTime).toLocaleDateString()} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''}</p>
      <p>Best Regards,</p>
      <p>${this.userData['userEmail']}</p>
    </div>
  `;

    this.followupModalRef.componentInstance.followupSaved.subscribe((result) => {
      console.log('Follow-up saved successfully:', result);
      this.appSettingService.showSuccess('Follow-up created successfully');
    });

    this.initializeMilestoneContentForFollowup()

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
    console.log("AutoInsert Or Not", {
      ImportOrExport: this.selectedDepartment?.ExportImport,
      validDepartment,
      currentJobType,
      validJobType,
      allMilestones,
      tabValue: this.milestoneResult,
      existingMilestone,
      validMilestone: existingMilestone ? false : true,
      finalDecision: validDepartment && validJobType && !existingMilestone
    })

    this.followupModalRef.componentInstance.autoInsertMilestone = validDepartment && validJobType && !existingMilestone;

    const milestonePayload: SafeInsertShipmentMilestone = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentName: this.selectedDepartment?.departmentName,
      JobType: currentJobType,
      MilestoneCode: "CFU",
      ShipmentNo: this.bookingData?.ShipmentNo,
      createdBy: this.userData?.userEmail,
      Remarks: `Cargo Followup has been sent on ${(new Date().toISOString()).split('T')[0]}`
    };
    console.log("Milestone Payload",milestonePayload);
    this.followupModalRef.componentInstance.milestonePayload = milestonePayload;

    this.followupModalRef.componentInstance.reloadMilestone.subscribe(() => {
      console.log("Reloading milestone...");
      this.milestoneComponent.loadShipmentMilestones(this.bookingData?.ShipmentNo);
    });
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

  //   openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.BookingHeaderSid) return;

  //   this.operationService.getAuditLogsBooking('BookingHeader', this.BookingHeaderSid.toString()).subscribe({
  //     next: (logs: any[]) => {
  //       const formatFields = (val: any) => {
  //         if (!val) return ['NA'];
  //         const obj = typeof val === 'string' ? JSON.parse(val) : val;
  //         delete obj.updatedOn; // Remove updatedOn field
  //         // If no fields exist after deleting updatedOn
  //         if (Object.keys(obj).length === 0) return ['NA'];
  //         return Object.entries(obj).map(
  //           ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
  //         );
  //       };

  //       this.auditLogs = logs.map(log => ({
  //         ...log,
  //         oldValDisplay: formatFields(log.oldVal),
  //         newValDisplay: formatFields(log.newVal)
  //       }));

  //       this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
  //     },
  //     error: err => console.error('Error fetching audit logs:', err)
  //   });
  // }

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.BookingHeaderSid) return;
    this.getAuditLog()
    this.auditLogModalRef = this.modalService.open(modal, {
      centered: true,
      scrollable: true,
      windowClass: 'audit-log-modal'
    });
  }

  getAuditLog() {
    this.operationService.getAuditLogsBooking(
      'BookingHeader',
      this.BookingHeaderSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['updatedOn', 'updatedBy']; // ✅ add more if needed later

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
            .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
        };

        this.auditLogs = logs
          .map(log => ({
            ...log,
            oldValDisplay: formatFields(log.oldVal),
            newValDisplay: formatFields(log.newVal),
          }))
          .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

        this.bookingStatusTimeline = logs
          .filter(log => log.newVal?.BookingStatus)
          .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
          .map(log => ({
            status: log.newVal.BookingStatus,
            at: log.changedAt
          }));

        // ✅ Check if Cargo Received exists but Booked does not
        const hasCargoReceived = this.bookingStatusTimeline.some(l => l.status === 'Cargo Received');
        const hasBooked = this.bookingStatusTimeline.some(l => l.status === 'Booked');

        if (hasCargoReceived && !hasBooked) {
          const cargoLog = this.bookingStatusTimeline.find(l => l.status === 'Cargo Received');

          // create Booked log 1 second before Cargo Received
          const bookedDate = new Date(new Date(cargoLog.at).getTime() - 1000).toISOString();

          this.bookingStatusTimeline.push({
            status: 'Booked',
            at: bookedDate
          });
        }

        // ✅ Resort descending and take latest 3
        this.bookingStatusTimeline = this.bookingStatusTimeline
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .slice(0, 3);

      },
      error: err => console.error('Error fetching audit logs:', err)
    });
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
    console.log('File processed:', result);

    // Check if we have multi-sheet booking data
    if (result.type === 'excel' && result.isMultiSheetStructure && result.dataType === 'bookings') {
      this.parsedBookings = result.data[0];
      this.showParsedData = true;

      console.log('Parsed multi-sheet booking data:', this.parsedBookings);
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
      ExternalPkg: product.value.ExternaPkg || '',
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

    const inco = this.incoList.find(item => item.IncoName === incoTerm);
    if (inco && inco.OceanFreight) {
      this.bookingForm.get('FreightTerms')?.setValue(inco.OceanFreight, { emitEvent: false });
    }
  }
  onIncoTermsChange(selectedInco: any) {
    if (!selectedInco || this.isManualFreightChange) {
      return;
    }

    const inco = this.incoList.find(item =>
      item.IncoName === selectedInco || item.IncoMasterSid === selectedInco
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
    const grossValue = formGroup.get('GrossWeight')?.value;
    const netValue = formGroup.get('NetWeight')?.value;

    if (!grossValue || !netValue) {
      grossCtrl.setErrors(null);
      return;
    }
    if (grossCtrl) {
      if (Number(grossValue) <= Number(netValue)) {
        grossCtrl.setErrors({ grossNotGreater: true });
      } else {
        grossCtrl.setErrors(null);
      }
    }
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
      this.initialFormValue = JSON.stringify(this.getCurrentFormState());
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
  private updateBookingStatusOnCargoDate(): void {
    // Check if any product in the FormArray has a value for CargoRecDate
    const isLCLExport = this.selectedDepartmentType === "SEA" 
      && this.selectedDepartment?.FCLLCL === 'LCL' 
      && this.selectedDepartment?.ExportImport === "Export";

    if(!isLCLExport){
      return;
    }

    const atLeastOneHasDate = this.bookingProducts.controls.some(
      (product) => !!product.get('CargoRecDate')?.value
    );
    console.log("atLeastOneHasDate", atLeastOneHasDate);
    const bookingStatusControl = this.b['BookingStatus'];
    if (!bookingStatusControl) {
      return;
    }

    const currentStatus = bookingStatusControl.value;
    console.log("currentStatus", currentStatus);
    if (atLeastOneHasDate && (currentStatus === 'Booked')) {
      bookingStatusControl.setValue('Cargo Received');
    } else if (!atLeastOneHasDate && currentStatus === 'Cargo Received') {
      // Revert the status if all cargo received dates are cleared
      bookingStatusControl.setValue('Booked');
    }
    this.bookingForm.updateValueAndValidity();
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
  const currentMenuId = Number(localStorage.getItem('currentMenuId'));
  
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
    CutOffDate: selectedVoyage?.PortCutoff ? new Date(selectedVoyage.PortCutoff) : (this.b['CutOffDate']?.value ? new Date(this.b['CutOffDate']?.value): null),
    shipmentList: shipmentList,
    screenName : this.selectedDepartmentType === "AIR" ? "Master Air Waybill" : "Master Job"
  };

  console.log('Generate Job Payload:', payload);

  this.operationService.createMasterJob(payload).subscribe({
    next: (resp: any) => {
      if (resp.status) {
        const masterJobSid = resp.data?.newMasterJob?.MasterJobSid;
        
        // Save MasterJobSid to HBL
        // if (masterJobSid) {
        //   this.saveMasterJobSidToHBL(masterJobSid);
        // }
        
        this.appSettingService.showSuccess('Master Job generated successfully from booking');
        if (masterJobSid && this.selectedFCLLCL === "FCL") {
          this.router.navigate(['/operation/master-job/entry', masterJobSid]);
        } else {
          this.router.navigate(['/operation/mawbill/entry', masterJobSid])
        }
      } else {
        this.appSettingService.showError('Error generating master job: ' + (resp.message || 'Unknown error'));
      }
      this.spinner.hide();
    },
    error: (error) => {
      this.spinner.hide();
      this.appSettingService.showError('Failed to generate master job');
      console.error('Error generating master job:', error);
    }
  });
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

  try {
    const logo = this.pdfMakeService.getReportLogo();

    this.pdfMakeService.generateBookingFromApi(
      this.bookingHeader,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      {
        ports: this.portList,
        departments: this.departmentList,
        carriers: this.carrierList
      },
      type
    );

    this.appSettingService.showSuccess(`${this.getPdfTypeName(type)} downloaded successfully!`);
  } catch (error) {
    console.error(`PDF generation error for ${type}:`, error);
    this.appSettingService.showError(`Error generating ${this.getPdfTypeName(type)}. Please try again.`);
  } finally {
    this.spinner.hide();
  }
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

downloadPDFBarCode(): void {
  this.spinner.show();

  const elementId = 'printContent'; // ✅ fixed element
  const fileName = this.generateFileName('barcode');

  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    this.spinner.hide();
    this.appSettingService.showWarning('PDF content not found.');
    return;
  }

  // Generate PDF directly from the element
  this.pdfService.downloadBalancedPDF(
    elementId,
    fileName,
    () => {
      this.appSettingService.showSuccess('Barcode PDF downloaded successfully!');
      this.spinner.hide();
    },
    (error) => {
      console.error('PDF generation error:', error);
      this.appSettingService.showError('Error generating Barcode PDF. Please try again.');
      this.spinner.hide();
    }
  );
}



// Helper method to get PDF element ID based on type
private getPdfElementId(type: string): string {
  switch (type) {
    case 'cro':
      return 'croPrintContent';
    
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
   
    case 'booking':
    default:
      return 'Booking Print';
  }
}

// Method to send email with PDF attachment
async sendEmail(type: 'booking' | 'cro'  = 'booking'): Promise<void> {
  try {
    this.spinner.show();
    
    // Generate PDF blob
    const pdfBlob = await this.generatePDFBlob(type);
    if (!pdfBlob) {
      this.spinner.hide();
      this.appSettingService.showError('Error generating PDF for email.');
      return;
    }

    const formData = new FormData();
    const toEmailSet = new Set<string>();

    // Add recipient emails
    if (this.bookingHeader?.Email) {
      toEmailSet.add(this.bookingHeader.Email);
    }
    if (toEmailSet.size === 0 && this.bookingHeader?.CustomerBranchSid) {
      const resp: any = await firstValueFrom(
        this.operationService.getCustomerBranchEmail(this.bookingHeader.CustomerBranchSid)
      );
      if (resp?.status && resp.data?.Email) {
        toEmailSet.add(resp.data.Email);
      }
    }

    if (toEmailSet.size === 0) {
      this.appSettingService.showError('To Email is missing.');
      this.spinner.hide();
      return;
    }

    // Add TO emails
    const toEmail = Array.from(toEmailSet);
    toEmail.forEach(email => {
      if (email) {
        formData.append("EmailTo[]", email);
      }
    });

    // Add CC emails
    const ccEmailSet = new Set<string>([this.userData['userEmail']]);
    const ccEmail = Array.from(ccEmailSet);
    ccEmail.forEach(email => {
      if (email) {
        formData.append("EmailCC[]", email);
      }
    });

    // Set subject and body based on type
    const { subject, body } = this.generateEmailContent(type);
    formData.append('Subject', subject);
    formData.append('Mailbody', body);

    // Add PDF attachment
    const fileName = this.generateFileName(type) + '.pdf';
    formData.append('file', pdfBlob, fileName);

    // Send email
    this.operationService.bookingPrint(formData).subscribe(
      (resp: any) => {
        this.spinner.hide();
        if (resp?.data) {
          this.appSettingService.showSuccess(`${this.getPdfTypeName(type)} sent successfully!`);
        } else {
          this.appSettingService.showError('Failed to send email.');
        }
      },
      error => {
        this.spinner.hide();
        this.appSettingService.showError('Failed to send email.');
      }
    );

  } catch (error) {
    this.spinner.hide();
    console.error('Email sending error:', error);
    this.appSettingService.showError('Error sending email.');
  }
}

// Helper method to generate email content based on type
private generateEmailContent(type: string): { subject: string; body: string } {
  const bookingNo = this.bookingHeader?.BookingNo || '';
  const bookingDate = this.datePipe.transform(this.bookingHeader?.BookingDateTime);
  const POL = this.bookingHeader?.POL;
  const POD = this.bookingHeader?.POD;
  const FPD = this.bookingHeader?.FPD;
  const formattedPOL = this.getFormattedPort(POL);
  const formattedPOD = this.getFormattedPort(POD);
  const formattedFPD = this.getFormattedPort(FPD);

  let subject = '';
  let body = '';

  switch (type) {
    case 'cro':
      subject = `Release Order (CRO) - Booking No.${bookingNo}`;
      body = `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
          <p>Dear Sir/Madam,</p>
          <p>Please find attached the Container Release Order for your reference.</p>
          <p>Booking Details: ${bookingNo} | Date: ${bookingDate} | Route: ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''}</p>
          <p>Kindly proceed with the container release as per the attached document.</p>
          <p>Best Regards,</p>
          <p>${this.userData['userName']}</p>
        </div>
      `;
      break;
    case 'booking':
    default:
      subject = `Booking No.${bookingNo} Date:${bookingDate} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`;
      body = `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
          <p>Dear Sir/Madam,</p>
          <p>Please find here enclosed the booking details as requested.</p>
          <p>Kindly review the details at your convenience.</p>
          <p>Looking forward to confirm cargo readiness.</p>
          <p>Best Regards,</p>
          <p>${this.userData['userName']}</p>
        </div>
      `;
      break;
  }

  return { subject, body };
}

// Enhanced PDF blob generation method
async generatePDFBlob(type: 'booking' | 'cro'  = 'booking'): Promise<Blob | null> {
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
    printContent.style.left = '0';
    printContent.style.top = '0';
    printContent.style.zIndex = '9999';
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


 getContainerName(ContainerTypeMasterSid:number){
    console.log(ContainerTypeMasterSid);
    if(!ContainerTypeMasterSid || this.containerTypeList.length === 0){
      return "";
    }
    console.log("HERE",this.containerTypeList)
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
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
loadBookingARAPData() {
    if (!this.BookingHeaderSid) {
        this.arapData = [];
        return;
    }

    this.arapLoading = true;
    this.operationService.getBookingARAPData(this.BookingHeaderSid).subscribe({
        next: (response: any) => {
            if (response.status) {
                let rawData = response.data || response;
                // Format the data for display
                rawData = rawData.map(item => ({
                    ...item,
                    DocumentTypeCode: item.DocumentTypeCode,
                    VoucherNumber: item.VoucherNumber,
                    VoucherDate: item.VoucherDate,
                    VoucherHeaderSid: item.VoucherHeaderSid,
                    Amount: Number(item.Amount) || 0,
                    CurrencyCode: item.CurrencyCode,
                    LocalAmount: Number(item.LocalAmount) || 0,
                    HBLNo: item.HBLNo || '-',
                    HouseJobSid: item.HouseJobSid || '-',
                    PostStatus: item.PostStatus || 'U' // Ensure PostStatus exists
                }));
                
                // Apply filters
                this.arapData = this.applyFilters(rawData);
            } else {
                this.arapData = [];
            }
            this.arapLoading = false;
        },
        error: (error) => {
            console.error('Error loading AR/AP data:', error);
            this.arapData = [];
            this.arapLoading = false;
            this.appSettingService.showError('Failed to load AR/AP data');
        }
    });
}



getTotalAmount(): number {
  return this.arapData.reduce(
    (sum, item) => sum + Number(item.Amount || 0),
    0
  );
}

getTotalLocalAmount(): number {
  return this.arapData.reduce(
    (sum, item) => sum + Number(item.LocalAmount || 0),
    0
  );
}





openVoucherDetails(voucherHeaderSid: number, documentTypeCode: string) {
    if (documentTypeCode === 'INV') {
        this.router.navigate(['operation/invoice/entry/', voucherHeaderSid]);
    } else if (documentTypeCode === 'VINV') {
        this.router.navigate(['operation/vendor-invoice/entry/', voucherHeaderSid]);
    }
}

getFilteredCount(): number {
    return this.arapData.length;
}

private applyFilters(data: any[]): any[] {
    let filtered = [...data];
    
    // Filter by voucher type
    if (this.arapFilter.voucherType !== 'all') {
        filtered = filtered.filter(item => 
            item.DocumentTypeCode === this.arapFilter.voucherType
        );
    }
    
    // Filter by status - Corrected: use PostStatus field
    if (this.arapFilter.status !== 'all') {
        filtered = filtered.filter(item => 
            item.PostStatus === this.arapFilter.status
        );
    }
    
    return filtered;
}

exportARAPReport() {
    if (this.arapData.length === 0) {
        this.appSettingService.showWarning('No data to export');
        return;
    }

    const dataForExport = this.arapData.map(item => ({
        'Voucher No': item.VoucherNumber,
        'Document Type': item.DocumentTypeCode,
        'Date': this.datePipe.transform(item.VoucherDate),
        'Currency': item.CurrencyCode,
        'Amount': item.Amount,
        'Local Amount': item.LocalAmount,
        // 'HBL No': item.HBLNo || '',
        'Post Status': item.PostStatus
    }));

    this.exportExcelService.exportAsExcel({
        data: dataForExport,
        headers: [
            { key: 'Voucher No', label: 'Voucher No' },
            { key: 'Document Type', label: 'Document Type' },
            { key: 'Date', label: 'Date' },
            { key: 'Currency', label: 'Currency' },
            { key: 'Amount', label: 'Amount' },
            { key: 'Local Amount', label: 'Local Amount' },
            // { key: 'HBL No', label: 'HBL No' },
            { key: 'Post Status', label: 'Post Status' }
        ],
        fileName: `ARAP-Report-Booking-${this.bookingHeader?.BookingNo || 'Unknown'}`,
        title: 'AR/AP Report'
    });
}

// printARAPReport() {
//     // Implement print functionality
//     window.print();
// }



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
    this.modalService.open(template, { centered: true });
  }


  confirmPrint(modal: any) {
    modal.close();
    this.printDivBarcode('printContent', this.printQty);
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



// Add this method to your component class
getFieldLabel(fieldName: string): string {
  const fieldLabels: { [key: string]: string } = {
    // Booking Form Fields
    'DepartmentMasterSid': 'Department',
    'CustomerMasterSid': 'Customer',
    'CustomerAddress': 'Customer Address',
    'ShipperName': 'Shipper Name',
    'ShipperAddress': 'Shipper Address',
    'ConsigneeName': 'Consignee Name',
    'ConsigneeAddress': 'Consignee Address',
    'POL': 'Port of Loading',
    'POD': 'Port of Discharge',
    'IncoTerms': 'INCO Terms',
    
    // Cargo Form Fields
    'ExternaPkg': 'External Package',
    'ExternlQty': 'External Quantity',
    'GrossWeight': 'Gross Weight',
    'Volumetric': 'Volumetric Weight',
    
    // CRO Form Fields
    'ReleaseOrderDate': 'Release Order Date',
    'Transporter': 'Transporter',
    'EmptyYard': 'Empty Yard'
  };
  
  return fieldLabels[fieldName] || fieldName;
}
get isTranshipmentMode(): boolean {
  return this.b['JobType']?.value === 'Transhipment';
}

private applyTranshipmentRestrictions(): void {
  if (this.isTranshipmentMode) {
    // Disable all booking form controls except vessel/voyage details
    Object.keys(this.bookingForm.controls).forEach(key => {
      if (!['VesselName', 'VoyageNo', 'ETA', 'ETD'].includes(key)) {
        this.bookingForm.get(key)?.disable();
      }
    });

    // Disable all cargo form controls
    Object.keys(this.cargoForm.controls).forEach(key => {
      this.cargoForm.get(key)?.disable();
    });

    // Disable all other form controls
    Object.keys(this.otherForm.controls).forEach(key => {
      this.otherForm.get(key)?.disable();
    });

    // Disable all CRO form controls
    Object.keys(this.croForm.controls).forEach(key => {
      this.croForm.get(key)?.disable();
    });

    // Disable all product controls
    this.bookingProducts.controls.forEach((product: FormGroup) => {
      Object.keys(product.controls).forEach(key => {
        product.get(key)?.disable();
      });
    });
  }
}

toggleProductInputType(formGroup: FormGroup, mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
  event.stopPropagation();
  const value = formGroup.get(flagCtrl)?.value;
  formGroup.get(flagCtrl)?.setValue(!value);
  formGroup.get(mainCtrl)?.reset();
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
    const hblNo = this.b['HBLNo']?.getRawValue();
    const houseJobSid = this.b['HouseJobSid']?.getRawValue();
    if (hblNo|| houseJobSid && (status === 'Suspended' || !status)) {
      this.appSettingService.showWarning(
        `This booking cannot be suspended.\n\nHouse Job with HBL No: ${hblNo} is associated with it.`
      );
      this.b['status']?.setValue('Active');
    }
  }

}

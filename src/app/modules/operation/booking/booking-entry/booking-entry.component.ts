import { Component, ViewChild, TemplateRef, OnInit, Input, OnDestroy } from '@angular/core';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, delay, firstValueFrom, forkJoin, of, Subject, tap } from 'rxjs';
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
    TimeAgoPipe
  ],
  templateUrl: './booking-entry.component.html',
  styleUrls: ['./booking-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class BookingEntryComponent implements OnInit, OnDestroy {


  /**
    |--------------------------------------------------
    |   Section-1 Variable Declaration
    |--------------------------------------------------
  */

  private destroy$ = new Subject<void>();
  @ViewChild('uploadModal') uploadModal!: BookingUploadComponent;
  @ViewChild('voucherTypeModal') voucherTypeModal!: TemplateRef<any>;
  @ViewChild('billingPartyModal') billingPartyModal!: TemplateRef<any>;
  @ViewChild('chargeSelectionModal') chargeSelectionModal!: TemplateRef<any>;
  @ViewChild('costEntryComponent') costEntryComponent: CostEntryComponent;
  @ViewChild('departmentLookup') departmentLookup!: SearchableDropdown;

  parsedBookings: BookingData[] = [];
  showParsedData = false;
  uploadResult: any = null;

  // Voucher generation properties
  selectedVoucherType: 'Invoice' | 'Vendor Invoice' | null = null;
  availableBillingParties: any[] = [];
  selectedBillingPartyIndex: number = -1;
  pendingBookingRates: BookingRateDetails[] = [];
  voucherTypeModalRef?: NgbModalRef;
  billingPartyModalRef?: NgbModalRef;
  chargeSelectionModalRef?: NgbModalRef;

  // Charge selection properties
  availableCharges: any[] = [];
  selectedCharges: Set<number> = new Set();
  currentBillingPartySid: number | null = null;
  chargeSelectionTaxResult: any = null;
  currentVoucherTypeFilter: 'revenue' | 'cost' = 'revenue';

  // Invoice header properties
  invoiceHeaderCurrency: any = null;
  invoiceHeaderExchangeRate: number = 1;
  billingPartyDetails: any = null;
  billingPartyAddress: string = '';
  taxGroupList: any[] = [];
  chargeTaxGroupMap: Map<number, any> = new Map(); // Map of BookingRatesSid to selected tax group

  //Variable Declaration - Common 
  detailForm !: FormGroup;
  userData: any;
  isPrintLoading: boolean;
  currentCompany: any;
  currentBranch: any;
  filterOption: any;
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
  bookingData: any;
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
  measurementUnitList: any[] = [];
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  permissions: any[] = [];
  currentMenuPermissions = {};
  private initialFormValue: string;
  bookingStatusTimeline : any[];

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

  // Variable Declaration - Cargo Part
  containerTypeList: any[] = [];
  selectedContainerType: any;
  cargoForm !: FormGroup;
  modeOfCargoType = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Haz' },
    { id: 3, name: 'Refer' },
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



  // Variable Declaration - Rate Part
  resetTriggerRate: boolean;
  rateResult: any[] = [];
  bookingRateArr: any[] = [];
  currentFormValue: any;

  // Variable Declaration - Milestone Part
  resetTriggerMilestone: boolean;
  milestoneResult: any[] = [];

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
    private taxCalculationService: TaxCalculationService,
    private leadService: LeadService,
    private companySettings: CompanySettingsManagerService,
    public dropdownStore: DropdownStore
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
      this.checkPermissions();
    }
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    this.currentCompany = (
      (this.userData.userCompanyMaster || [])
        .find(ucm => ucm.CompanyMasterSid === currentCompanyId)?.companyMaster
    );


    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid
    };


    this.initBookingForm();
    this.initCargoForm();
    this.initOtherForm();
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

      this.spinner.hide();
    });
  }

  ngAfterViewInit(): void {
    if (!this.isEditMode) {
      this.departmentLookup.focus();
    }
  }

  getCurrentCompanyBranches() {
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    const currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === currentCompanyId).companyMaster);
    this.currentCompanyBranches = (currentCompany?.userBranchMaster || []).map(ubm => ubm.branchMaster);
  }

  checkPermissions() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (this.currentMenuId && userRole) {
      this.leadService
        .getRoleMenuPermissions(this.currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
          },
        });
    }
  }

  /**
  |--------------------------------------------------
  |   Section-4 : Main Functions
  |--------------------------------------------------
  */

  // Header Form Initialization
  initBookingForm() {
    this.bookingForm = this.fb.group({
      BookingNo: [{ value: '', disabled: true }],
      BookingDateTime: [{ value: '', disabled: true }],
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
      DestinationAgent: [null, [Validators.required]],
      AgentAddress: [''],
      isCarrierFreeText: [false],
      CarrierName: [null],
      QuotationHeaderSid: [{ value: '', disabled: true }],
      HBLNo: [{ value: '', disabled: true }],
      MBLNo: [{ value: '', disabled: true }],
      MBLDate: [{ value: '', disabled: true }],
      status: ['Active'],

      VesselName: [null],
      VoyageMasterSid: [null],
      VoyageNo: [{ value: null, disabled: true }],
      ETA: [{ value: '', disabled: true }],
      ETD: [{ value: '', disabled: true }],
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
      NoofContainers: [''],
      GrossWeight: [''],
      NetWeight: [''],
      Volume: [''],
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
    });
    this.cargoForm.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(this.cargoForm);
    });
    this.cargoForm.valueChanges.subscribe(() => {
      this.syncFormValueWithRateComponent();
    })
  }

  // Product Form Initialization
  initProductForm() {
    const isIndianCompany = this.countryOfCompany === 'india';
    this.productForm = this.fb.group({
      BookingProductSid: [null],
      ProductName: [null],
      ShippingBillNo: ['', isIndianCompany ? [Validators.required] : []],
      ShippingBillDate: [null, isIndianCompany ? [Validators.required] : []],
      ExternaPkg: [null, [Validators.required]],
      ExternlQty: ['', [Validators.required]],
      GrossWeight: ['', [Validators.required]],
      NetWeight: ['', [Validators.required]],
      Volume: ['', [Validators.required]],
      IsHaz: [false],
      ImcoClass: [null],
      UnNo: [''],
      PkgGroup: [''],
      Length: [''],
      Width: [''],
      Height: [''],
      UomMasterSid: [null],
      CargoRecDate: [null]
    })
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
      CargoCurrency: [null],
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
    const productForm = this.fb.group({
      BookingProductSid: [data?.BookingProductSid || null],
      ProductName: [data?.ProductName || null],
      ShippingBillNo: [data?.ShippingBillNo || ''],
      ShippingBillDate: [data?.ShippingBillDate ? new Date(data?.ShippingBillDate) : null],
      ExternaPkg: [data?.ExternaPkg || null, [Validators.required]],
      ExternlQty: [data?.ExternlQty || '', [Validators.required]],
      GrossWeight: [Number(data?.GrossWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required]],
      NetWeight: [Number(data?.NetWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required]],
      Volume: [Number(data?.Volume || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required]],
      IsHaz: [data?.IsHaz ? (data.IsHaz === "Y" ? true : false) : false],
      ImcoClass: [{ value: data?.ImcoClass || null, disabled: true }],
      UnNo: [{ value: data?.UnNo || '', disabled: true }],
      PkgGroup: [{ value: data?.PkgGroup || '', disabled: true }],
      Length: [data?.Length || ''],
      Width: [data?.Width || ''],
      Height: [data?.Height || ''],
      UomMasterSid: [data?.UomMasterSid || null],
      CargoRecDate: [data?.CargoRecDate ? new Date(data?.CargoRecDate) : null]
    })

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
    this.bookingProducts.push(formGroup);
  }

  createBookingConnectionGroup(data?: any): FormGroup {
    const connectionForm = this.fb.group({
      BookingConnectionSid: [data?.BookingConnectionSid || null],
      VesselName: [data?.VesselName || null],
      VoyageNo: [data?.VoyageNo || null],
      POL: [data?.POL || null],
      POD: [data?.POD || null],
      ETD: [new Date(data?.ETD) || ''],
      ETA: [new Date(data?.ETA) || ''],
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
      this.countryOfCompany = (userCountry?.data?.countryCode).trim().toLowerCase();
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

      vessels: this.operationService.getAllVessels().pipe(catchError(err => of([]))),
      incos: this.operationService.getAllINCO().pipe(catchError(err => of([]))),
      salesmans: this.operationService.getAllSalesman().pipe(catchError(err => of([]))),

      forwarder: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['forwarder'] }).pipe(catchError(err => of([]))),
      yard: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['yard'] }).pipe(catchError(err => of([]))),
      cfs: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['cFS'] }).pipe(catchError(err => of([]))),

    }).pipe(tap(({ shippers, consignees, notify, carriers, vessels, incos, salesmans, agents, forwarder, yard, cfs, }) => {
      this.shipperList = shippers.data;
      this.filteredShipperList = shippers.data;
      this.consigneeList = consignees.data;
      this.filteredConsigneeList = consignees.data;
      this.notifyList = notify.data;
      this.carrierList = carriers.data;

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
      products: this.operationService.getAllProducts(this.currentCompany?.CompanyMasterSid).pipe(catchError(err => of([]))),
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

  loadBookingById(BookingHeaderSid: number) {
    this.spinner.show();
    this.operationService.getBookingById(BookingHeaderSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          // this.resetForm();
          this.patchValues(resp.data);
          this.bookingData = resp.data;
          this.minDate = undefined;
          this.spinner.hide();
          this.captureInitialFormState();
        }
      }
    )
  }

  patchValues(response: any) {
    console.log(response);
    this.bookingHeader = response;
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
      HBLNo: response.HBLNo,
      MBLNo: response.MBLNo,
      MBLDate: response.MBLDate ? new Date(response.MBLDate) : '',
      status: response.status === "A" ? "Active" : "Suspended",

      VesselName: response.VesselName,
      VoyageMasterSid: response.VoyageMasterSid,
      VoyageNo: response.VoyageNo,
      ETA: response.ETA ? new Date(response.ETA) : null,
      ETD: response.ETD ? new Date(response.ETD) : null,
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
    this.getVesselVoyBasedOnPorts();
    this.b['DepartmentMasterSid']?.disable();
    this.b['CustomerMasterSid']?.disable();
    this.quotationNumber = response?.quotationHeader?.QuoteNumber || '';
    this.PODandFPODsame = response.POD === response.FPD;
    this.minStartDate = response.ETA;



    const cargoData = response.bookingCargo[0];
    this.cargoForm.patchValue({
      BookingCargoSid: cargoData?.BookingCargoSid,
      CargoType: cargoData?.CargoType,
      ContainerType: cargoData?.ContainerType,
      NoofContainers: cargoData?.NoofContainers,
      GrossWeight: cargoData?.GrossWeight,
      NetWeight: cargoData?.NetWeight,
      Volume: cargoData?.Volume,
      ChargeableWeight: cargoData?.ChargeableWeight,
      NoOfPackage: cargoData?.NoOfPackage,
      ShipmentTerms: cargoData?.ShipmentTerms,
      MovementType: cargoData?.MovementType,
      FreightTerms: cargoData?.FreightTerms,
      ModeOfTransport: cargoData?.ModeOfTransport,
      StuffingAt: cargoData?.StuffingAt
    })
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

    this.bookingProducts.clear();
    const productsFromResponse = response.bookingProduct || [];
    this.productDataLength = productsFromResponse.length;
    if (this.productDataLength) {
      for (const productData of productsFromResponse) {
        const formWithData = this.createBookingProductGroup(productData);
        this.bookingProducts.push(formWithData);
      }
      this.updateProductPagination();
      this.handleProductRelatedCalculation();
    }

    this.bookingConnectionsArr = (response.bookingConnection || []).map(connection => {
      return {
        ...connection,
        TransactionSid: connection.BookingConnectionSid,
      }
    }); // for child component
    this.connectionResult = [...this.bookingConnectionsArr]

    this.bookingRateArr = response.bookingRates || [];
    this.rateResult = [...this.bookingRateArr];
    const shipmentTypeValue = response.ShipmentType === "Y" ? true : false;
    if (shipmentTypeValue) {
      this.bookingForm.get('NominatedBy')?.setValue('Nomination');
    } else {
      this.bookingForm.get('NominatedBy')?.setValue('Self');
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
      DepartmentMasterSid: data.DepartmentMasterSid,
      CustomerMasterSid: data.CustomerMasterSid,
      SalesmanSid: data.SalesmanSid,
      FreightTerms: data.FreightTerms,
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
        UomMasterSid: data?.UomMasterSid,
        CargoRecDate: data?.CargoRecDate
      })
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
    }
  }




  onSubmit() {
    console.log('Submit triggered', this.bookingForm.value);
    if (this.isEditMode) {
      const currentFormState = JSON.stringify(this.getCurrentFormState());
      if (this.initialFormValue === currentFormState) {
        this.appSettingService.showWarning('No changes are there to save.');
        return;
      }
    }
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.bookingForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const isRateValid = this.costEntryComponent?.validateRateArray?.();
    console.log(isRateValid);
    if (!isRateValid) {
      console.warn('Rate validation failed — submission stopped');
      return;
    }
    console.log('Before',this.b['BookingStatus']?.getRawValue());
    this.updateBookingStatusOnCargoDate();
    console.log('After',this.b['BookingStatus']?.getRawValue());
    const bookingFormValue = this.bookingForm.getRawValue();
    const cargoFormValue = this.cargoForm.getRawValue();
    const otherFormValue = this.otherForm.getRawValue();
    const detailFormValue = this.detailForm.getRawValue();
    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: currentMenuId,
      DepartmentMasterSid: bookingFormValue.DepartmentMasterSid,
      CustomerMasterSid: bookingFormValue.CustomerMasterSid,
      CustomerBranchSid: bookingFormValue.CustomerBranchSid || null,
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
      QuotationHeaderSid: bookingFormValue.QuotationHeaderSid || null,
      HBLNo: bookingFormValue.HBLNo || '',
      MBLNo: bookingFormValue.MBLNo || '',
      MBLDate: bookingFormValue.MBLDate ? new Date(bookingFormValue.MBLDate) : null,
      status: bookingFormValue.status === 'Active' ? 'A' : 'S',
      VesselName: bookingFormValue.VesselName || null,
      VoyageMasterSid: bookingFormValue.VoyageMasterSid || null,
      VoyageNo: bookingFormValue.VoyageNo || null,
      ETA: bookingFormValue.ETA ? new Date(bookingFormValue.ETA) : null,
      ETD: bookingFormValue.ETD ? new Date(bookingFormValue.ETD) : null,
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
      bookingCargo: {
        BookingCargoSid: cargoFormValue.BookingCargoSid || null,
        CargoType: cargoFormValue.CargoType || null,
        ContainerType: cargoFormValue.ContainerType || null,
        NoofContainers: parseFloat(cargoFormValue.NoofContainers) || 0,
        GrossWeight: parseFloat(cargoFormValue.GrossWeight) || 0,
        NetWeight: parseFloat(cargoFormValue.NetWeight) || 0,
        Volume: parseFloat(cargoFormValue.Volume) || 0,
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
        CargoCurrency: otherFormValue.CargoCurrency || null,
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
        Length: Number(product.Length),
        Width: Number(product.Width),
        Height: Number(product.Height),
        UomMasterSid: product.UomMasterSid,
        CargoRecDate: product.CargoRecDate
      })),
      bookingConnections: this.connectionResult,
      bookingRates: this.rateResult,
      milestones: this.milestoneResult,
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };

    console.log('Submitted payload:', payload);

    if (this.isEditMode && this.BookingHeaderSid) {
      this.operationService.updateBookingById(this.BookingHeaderSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Booking successfully updated.');
            // this.router.navigate(['operation/booking/list']);
            this.loadBookingById(this.BookingHeaderSid);
          } else {
            this.appSettingService.showError('Error updating booking.');
            console.error(resp.message);
          }
        },
        error: (err) => {
          this.appSettingService.showError('Failed to update booking.');
          console.error(err);
        }
      });
    } else {
      this.operationService.createBooking(payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Booking successfully created.');
            const bookingId = resp.data?.bookingHeader?.BookingHeaderSid;
            this.router.navigate(['operation/booking/entry', bookingId]);
          } else {
            this.appSettingService.showError('Error creating booking.');
            console.error(resp.message);
          }
        },
        error: (err) => {
          this.appSettingService.showError('Failed to create booking.');
          console.error(err);
        }
      });
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
      this.filteredPorts = [];
      this.filteredPOL = [];
      this.filteredPOD = [];
      this.b['POO'].setValue(null);
      this.b['POL'].setValue(null);
      this.b['POD'].setValue(null);
      this.b['FPD'].setValue(null);
      this.b['ETA'].setValue('');
      this.b['ETD'].setValue('');
      this.b['MovementType'].setValue(null);
      this.handleImportExport();
      this.handleCFSOrYard()
      return;
    }
    this.selectedDepartmentType = department.departmentType.toUpperCase();
    this.selectedFCLLCL = this.selectedDepartmentType === "SEA" ? department.FCLLCL.toUpperCase() : "AIR";
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
    // this.getCustomerBranchByCustomer(customer.CustomerMasterSid);
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
      return;
    }
    this.filteredShipperList = this.shipperList.filter(s => s.CustomerMasterSid !== consignee.CustomerMasterSid);
  }

  handleImportExport() {
    // Early return if no department selected - clear both fields
    if (!this.selectedDepartment) {
      this.b['ShipperName']?.setValue(null);
      this.b['ShipperAddress']?.setValue('');
      this.b['ConsigneeName']?.setValue(null);
      this.b['ConsigneeAddress']?.setValue('');
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
        this.onConsigneeChange();
        return;
      }

      const consigneeExist = this.consigneeList.find(c => c.CustomerBranchSid === customerBranchSid);
      const consigneeExistInFiltered = this.filteredConsigneeList.find(c => c.CustomerBranchSid === customerBranchSid);

      if (consigneeExist && consigneeExistInFiltered) {
        this.b['ConsigneeName']?.setValue(consigneeExistInFiltered.CustomerName);
        this.b['ConsigneeAddress']?.setValue(consigneeExistInFiltered.Address);
        this.onConsigneeChange(consigneeExistInFiltered);
        this.onShipperChange();
      } else if (consigneeExist && !consigneeExistInFiltered) {
        this.b['ConsigneeName']?.setValue(consigneeExist.CustomerName);
        this.b['ConsigneeAddress']?.setValue(consigneeExist.Address);
        this.b['ShipperName']?.setValue(null);
        this.b['ShipperAddress']?.setValue('');
        this.onConsigneeChange(consigneeExist);
        this.onShipperChange();
      } else {
        this.b['ConsigneeName']?.setValue(null);
        this.b['ConsigneeAddress']?.setValue('');
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
    this.b['ETA']?.setValue('');
    this.b['ETD']?.setValue('');
    if (!selectedPort) {
      this.filteredPOD = [...this.filteredPorts];
      return;
    }
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.b['ETA']?.setValue(new Date(selectedPort.ETA));
    this.getVesselVoyBasedOnPorts();
  }

  handlePODChange(selectedPort: any) {
    this.b['VesselName']?.setValue(null);
    this.b['VoyageNo']?.setValue(null);
    this.b['ETA']?.setValue('');
    this.b['ETD']?.setValue('');
    if (!selectedPort) {
      this.filteredPOL = [...this.filteredPorts];
      this.b['FPD']?.setValue(null);
      this.PODandFPODsame = true;
      return;
    }
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.b['FPD']?.setValue(selectedPort.PortCode);
    this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value
    this.getVesselVoyBasedOnPorts();
  }

  handleFPODChange(port) {
    if (!port) {
      this.PODandFPODsame = true;
      return;
    }
    this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value
  }

  onVesselChange(voyage: any) {
    console.log(voyage);
    if (!voyage) {
      this.bookingForm.patchValue({
        VoyageMasterSid : null,
        VoyageNo: null,
        ETA: '',
        ETD: ''
      })
      return;
    }
    this.bookingForm.patchValue({
      VoyageMasterSid : voyage.VoyageMasterSid,
      VoyageNo: voyage.VoyageNo,
      ETA: new Date(voyage.ETA),
      ETD: new Date(voyage.ETD)
    })
  }

  onVoyageChange(voyage: any) {
    if (!voyage) {
      this.b['ETA'].setValue('');
      this.b['ETD'].setValue('');
      this.b['VoyageMasterSid']?.setValue('')
      return;
    }
    const POL = this.b['POL'].value;
    const POD = this.b['POD'].value;
    this.b['VoyageMasterSid']?.setValue(voyage.VoyageMasterHeaderSid);
    const polETD = voyage.ETD || null;
    const podETA = voyage?.ETA || null;

    this.b['ETD'].setValue(new Date(polETD));
    this.b['ETA'].setValue(new Date(podETA));
    this.minStartDate = new Date(podETA);
  }

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
    if (!POLSid || !PODSid || !voyageType) return;
    const payload = { POL: POLSid, POD: PODSid, segment: voyageType };

    this.operationService.getVesselVoyageBasedOnPorts(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.headerVesselList = resp.data.map(vslVoy =>({
              ...vslVoy , 
              ETD : this.datePipe.transform(vslVoy.ETD), 
              ETA : this.datePipe.transform(vslVoy.ETA)
          }));
          console.log(this.headerVesselList);
          if (this.headerVesselList.length === 0) {
            this.appSettingService.showWarning("No Vessel/Voyage has been scheduled for the requested route.")
          }
        } else {
          this.appSettingService.showError("Error loading Vessel")
        }
      }
    )
  }

  getVoyageForPortsAndVessels() {
    const POO = this.b['POO']?.value;
    const POL = this.b['POL']?.value;
    const POD = this.b['POD']?.value;
    const FPOD = this.b['FPD']?.value;
    const MovementType = this.selectedDepartment?.departmentType;
    const POLSid = (this.portList.find(port => port.PortCode === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortCode === POD)?.PortMasterSid);
    const vessel = this.b['VesselName']?.value;
    const vesselId = (this.vesselList.find(vsl => vsl.VesselName === vessel)?.VesselMasterSid);
    if (!POL || !POD || !vesselId) {
      return;
    }
    const payload = { VesselMasterSid: vesselId, POL: POLSid, POD: PODSid, MovementType: MovementType }
    this.operationService.getVoyagesBasedOnVesselAndPort(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.voyageList = resp.data.map(voyage => {
            const pol = this.portList.find(p => p.PortMasterSid === voyage.POL);
            const pod = this.portList.find(p => p.PortMasterSid === voyage.POD);
            const polName = pol?.PortName;
            const podName = pod?.PortName;
            const polWithName = pol ? { ...pol, PortName: polName } : null;
            const podWithName = pod ? { ...pod, PortName: podName } : null;



            return {
              VoyageNo: voyage.VoyageNo,
              ETD: voyage.ETD,
              ETA: voyage.ETA,
              VoyageMasterHeaderSid: voyage.VoyageMasterHeaderSid,
              POL: polWithName,
              POD: podWithName
            };
          });
          console.log(this.voyageList);
        } else {
          this.appSettingService.showError("Error loading sailing schedules.")
        }
      }
    )
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
      return;
    }

    let totalNoOfPkg: any = 0;
    let totalGrossWeight: any = 0;
    let totalNetWeight: any = 0;
    let totalVolume: any = 0;

    let productValue = this.bookingProducts.getRawValue() || [];
    productValue.forEach(product => {
      totalNoOfPkg += (Number(product.ExternlQty) || 0);
      totalGrossWeight += Number(product.GrossWeight) || 0;
      totalNetWeight += Number(product.NetWeight) || 0;
      totalVolume += Number(product.Volume) || 0;
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
    const ChargeableWeight = this.c['ChargeableWeight']?.value;

    const CustomerMasterSid = this.b['CustomerMasterSid']?.value;
    const CustomerBranchSid = this.b['CustomerBranchSid']?.value;
    const BookingHeaderSid = this.bookingData?.BookingHeaderSid || this.b['BookingHeaderSid']?.value;

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      BookingNumber,
      BookingHeaderSid,
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
      NoofContainers,
      ChargeableWeight
    }
  }


  navigateBack() {
    this.router.navigate(['operation/booking/list']);
  }

  selectedTab = 'Shipment';
  isQuickFormExpanded = false;

  resetForm() {
    this.bookingForm.reset({
      status: 'Active'
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
  }

  async openFollowup() {
    if (!this.bookingHeader) return;
    const POL = this.bookingHeader?.POL;
    const POD = this.bookingHeader?.POD;
    const FPD = this.bookingHeader?.FPD;
    const formattedPOL = this.getFormattedPort(POL);
    const formattedPOD = this.getFormattedPort(POD);
    const formattedFPD = this.getFormattedPort(FPD);
    const resp: any = await firstValueFrom(
      this.operationService.getCustomerBranchEmail(this.bookingHeader.CustomerBranchSid)
    );
    const toEmail = resp?.data?.Email;
    if (!toEmail) {
      this.appSettingService.showError('To Email is missing.')
      return;
    }
    const modalRef = this.modalService.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.bookingHeader?.BookingHeaderSid;
    modalRef.componentInstance.parentEmail = toEmail;
    modalRef.componentInstance.parentSubject = `Booking No.${this.bookingHeader.BookingNo} Date:${this.datePipe.transform(this.bookingHeader?.BookingDateTime)} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`;
    modalRef.componentInstance.parentMailbody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Please find here enclosed the booking details as requested.</p>
        <p>Kindly review the details at your convenience.</p>
        <p>Looking forward to confirm cargo readyness.</p>
        <p>Best Regards,</p>
        <p>${this.userData['userName']}</p>
      </div>
    `;
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
        { key: 'CargoRecDate', label: 'Cargo Received Date' }
      ],
      fileName: 'Booking-Products-Report',
      title: companyName
    });
  }


  getFormattedPort(code: string) {
    console.log(code);
    if (!code) return '';
    const ourPort = (this.portList.find(p => p.PortCode === code))?.PortName;
    console.log(ourPort);
    return `${ourPort} (${code})`
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


  async sendEmail() {
    try {
      this.spinner.show();
      const pdfBlob = await this.generatePDFBlob();

      const formData = new FormData();
      const toEmailSet = new Set<string>();

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
        this.appSettingService.showError('To Email is missing.')
        this.spinner.hide();
        return;
      }

      const toEmail = Array.from(toEmailSet);
      toEmail.forEach(email => {
        if (email) {
          formData.append("EmailTo[]", email);
        }
      });
      const ccEmailSet = new Set<string>([this.userData['userName']]);
      const ccEmail = Array.from(ccEmailSet);

      ccEmail.forEach(email => {
        if (email) {
          formData.append("EmailCC[]", email);
        }
      });
      const POL = this.bookingHeader?.POL;
      const POD = this.bookingHeader?.POD;
      const FPD = this.bookingHeader?.FPD;
      const formattedPOL = this.getFormattedPort(POL);
      const formattedPOD = this.getFormattedPort(POD);
      const formattedFPD = this.getFormattedPort(FPD);
      formData.append('Subject', `Booking No.${this.bookingHeader.BookingNo} Date:${this.datePipe.transform(this.bookingHeader?.BookingDateTime)} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`);
      formData.append('Mailbody', `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Please find here enclosed the booking details as requested.</p>
        <p>Kindly review the details at your convenience.</p>
        <p>Looking forward to confirm cargo readyness.</p>
        <p>Best Regards,</p>
        <p>${this.userData['userName']}</p>
      </div>
    `);
      formData.append('file', pdfBlob, (this.bookingHeader?.bookingNumber || 'booking') + '.pdf');
      console.log(formData)
      this.operationService.bookingPrint(formData).subscribe((resp: any) => {
        this.spinner.hide();
        if (resp?.data) {
          this.appSettingService.showSuccess('Booking Print Sent successfully!');
        }
      }, error => {
        this.spinner.hide();
        this.appSettingService.showError('Failed to send email.');
      });
    } catch (error) {
      this.spinner.hide();
      console.error('PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF.');
    }
  }

  /**
   |--------------------------------------------------
   |   Section-8: Voucher Generation Methods
   |--------------------------------------------------
   */

  openVoucherTypeModal() {
    if (!this.isEditMode || !this.rateResult?.length) {
      this.appSettingService.showWarning('No rates available for voucher generation');
      return;
    }

    // Open voucher type selection modal
    this.voucherTypeModalRef = this.modalService.open(this.voucherTypeModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
  }

  selectVoucherType(voucherType: 'Invoice' | 'Vendor Invoice') {
    this.selectedVoucherType = voucherType;
    this.voucherTypeModalRef?.close();

    // Based on voucher type, determine charges to include
    if (voucherType === 'Invoice') {
      this.processPendingCharges('revenue');
    } else {
      this.processPendingCharges('cost');
    }
  }

  private async processPendingCharges(type: 'revenue' | 'cost') {
    try {
      this.spinner.show();

      // Store the type for later use in filtering
      this.currentVoucherTypeFilter = type;

      // Get booking rates with full details including customer information
      const bookingRatesResp = await firstValueFrom(this.operationService.getBookingRatesWithDetails(this.BookingHeaderSid));

      if (!bookingRatesResp?.data?.length) {
        this.appSettingService.showWarning('No booking rates found');
        this.spinner.hide();
        return;
      }

      // Filter based on type and pending status
      const allRates = bookingRatesResp.data;
      const filteredRates = allRates.filter((rate: any) => {
        const isCorrectType = type === 'revenue' ? Number(rate.RevenueAmount) > 0 : Number(rate.CostAmount) > 0;
        // Check specific voucher field based on type
        const isPending = type === 'revenue'
          ? !rate.RevenueVoucherHeaderSid
          : !rate.CostVoucherHeaderSid;
        return isCorrectType && isPending;
      });

      if (!filteredRates.length) {
        this.appSettingService.showWarning(`No pending ${type} charges found for voucher generation`);
        this.spinner.hide();
        return;
      }

      // Get unique billing parties (pass type to determine which field to use)
      const uniqueBillingParties = this.taxCalculationService.getUniqueBillingParties(filteredRates, type);

      if (uniqueBillingParties.length === 0) {
        this.appSettingService.showWarning('No billing parties found');
        this.spinner.hide();
        return;
      } else if (uniqueBillingParties.length === 1) {
        // Single billing party - proceed directly
        const billingPartySid = uniqueBillingParties[0];
        const pendingCharges = this.taxCalculationService.filterPendingCharges(filteredRates, billingPartySid, type);
        this.proceedToInvoiceGeneration(billingPartySid, pendingCharges);
      } else {
        // Multiple billing parties - show selection modal
        this.showBillingPartySelection(filteredRates, uniqueBillingParties);
      }

      this.spinner.hide();
    } catch (error) {
      this.spinner.hide();
      console.error('Error processing pending charges:', error);
      this.appSettingService.showError('Error processing charges for voucher generation');
    }
  }

  private showBillingPartySelection(allRates: any[], uniqueBillingParties: number[]) {
    // Prepare billing party data for display
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';

    this.availableBillingParties = uniqueBillingParties.map(partySid => {
      // Filter charges for this specific billing party
      // Revenue: use CustomerMasterSid, Cost: use AgentMasterSid
      const pendingCharges = allRates.filter((rate: any) => {
        return isRevenue
          ? rate.CustomerMasterSid === partySid
          : rate.AgentMasterSid === partySid;
      });

      const firstCharge: any = pendingCharges[0];

      // Get billing party info based on type
      // Revenue: customerMasterBP, Cost: AgentMaster
      const billingPartyInfo = isRevenue
        ? firstCharge?.customerMasterBP
        : firstCharge?.AgentMaster;

      console.log(`Billing Party ${partySid} (${isRevenue ? 'Revenue' : 'Cost'}):`, {
        billingPartyName: billingPartyInfo?.CustomerName,
        chargesCount: pendingCharges.length,
        charges: pendingCharges.map((c: any) => ({
          id: c.BookingRatesSid,
          desc: c.ChargeDescription,
          customerSid: c.CustomerMasterSid,
          agentSid: c.AgentMasterSid
        }))
      });

      return {
        billingPartySid: partySid,
        customerName: billingPartyInfo?.CustomerName || 'Unknown Customer',
        customerAddress: billingPartyInfo?.CustomerAddress1 || billingPartyInfo?.Address || 'No Address',
        pendingChargesCount: pendingCharges.length,
        totalAmount: pendingCharges.reduce((sum: number, charge: any) => {
          return sum + (isRevenue ? Number(charge.RevenueLocalAmount) : Number(charge.CostLocalAmount) || 0);
        }, 0),
        pendingCharges: pendingCharges
      };
    });

    this.selectedBillingPartyIndex = -1;

    // Open billing party selection modal
    this.billingPartyModalRef = this.modalService.open(this.billingPartyModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
  }

  selectBillingParty(index: number) {
    this.selectedBillingPartyIndex = index;
  }

  proceedWithBillingParty() {
    if (this.selectedBillingPartyIndex === -1) {
      this.appSettingService.showWarning('Please select a billing party');
      return;
    }

    const selectedParty = this.availableBillingParties[this.selectedBillingPartyIndex];
    this.billingPartyModalRef?.close();

    this.proceedToInvoiceGeneration(selectedParty.billingPartySid, selectedParty.pendingCharges);
  }

  private proceedToInvoiceGeneration(billingPartySid: number, pendingCharges: BookingRateDetails[]) {
    // Show charge selection modal
    this.showChargeSelectionModal(billingPartySid, pendingCharges);
  }

  private showChargeSelectionModal(billingPartySid: number, pendingCharges: BookingRateDetails[]) {
    console.log('showChargeSelectionModal called with:', {
      billingPartySid,
      chargesCount: pendingCharges.length,
      charges: pendingCharges.map((c: any) => ({
        id: c.BookingRatesSid,
        desc: c.ChargeDescription,
        agentMasterSid: c.AgentMasterSid
      }))
    });

    this.currentBillingPartySid = billingPartySid;
    this.availableCharges = pendingCharges.map(charge => ({
      ...charge,
      isSelected: true // Select all by default
    }));

    console.log('Available charges set:', {
      count: this.availableCharges.length,
      charges: this.availableCharges
    });

    // Select all charges by default
    this.selectedCharges = new Set(pendingCharges.map(c => c.BookingRatesSid));

    // Initialize invoice header
    this.initializeInvoiceHeader(pendingCharges);

    // Load tax groups
    this.loadTaxGroups();

    // Calculate initial tax
    this.calculateChargeSelectionTax();

    // Open charge selection modal with custom extra-wide size
    this.chargeSelectionModalRef = this.modalService.open(this.chargeSelectionModal, {
      size: 'xl',
      // windowClass: 'test-class',
      backdrop: 'static',
      keyboard: false,
      scrollable: true
    });
  }

  private initializeInvoiceHeader(charges: any[]) {
    if (!charges || charges.length === 0) {
      console.error('No charges provided to initialize invoice header');
      return;
    }

    const firstCharge = charges[0];
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';

    console.log('Initializing invoice header with:', {
      firstCharge,
      isRevenue,
      currencyListLength: this.currencyList?.length
    });

    // Set billing party details
    if (isRevenue) {
      this.billingPartyDetails = firstCharge?.customerMasterBP || {};
      const branch = firstCharge?.customerBranch || {};
      this.billingPartyAddress = `${branch?.BranchAddress || ''}, ${branch?.CityName || ''}, ${branch?.StateName || ''} ${branch?.ZipCode || ''}`.trim();
    } else {
      this.billingPartyDetails = firstCharge?.AgentMaster || {};
      this.billingPartyAddress = `${this.billingPartyDetails?.Address1 || ''}`.trim();
    }

    // Get company's home currency from settings (FIRST PRIORITY)
    const companyHomeCurrency = this.companySettings.getCurrencySettings();
    const companyCurrency = this.currencyList?.find(c => c?.currencyCode === companyHomeCurrency.code);

    // Fallback to charge currency if company currency not found
    const chargeCurrency = isRevenue
      ? firstCharge?.RevenueCurrencyMaster
      : firstCharge?.CostCurrencyMaster;

    this.invoiceHeaderCurrency = companyCurrency || chargeCurrency || null;

    // Set default exchange rate to 1 (company home currency)
    this.invoiceHeaderExchangeRate = 1;

    console.log('Invoice header initialized:', {
      billingParty: this.billingPartyDetails,
      address: this.billingPartyAddress,
      currency: this.invoiceHeaderCurrency,
      exchangeRate: this.invoiceHeaderExchangeRate
    });
  }

  private loadTaxGroups() {
    const params = {
      search: '',
      page: 1,
      pageSize: 1000,
      activeCompanyId: this.currentCompany?.CompanyMasterSid
    };

    this.masterService.searchTaxGroup(params).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.taxGroupList = response.data.items || [];
          console.log('Tax groups loaded:', this.taxGroupList.length);

          // Initialize tax group map from initial calculation
          this.initializeTaxGroupsFromCalculation();
        }
      },
      error: (error) => {
        console.error('Error loading tax groups:', error);
      }
    });
  }

  private initializeTaxGroupsFromCalculation() {
    if (!this.chargeSelectionTaxResult || !this.chargeSelectionTaxResult.lineItems) {
      console.log('No tax calculation result or line items to initialize from');
      return;
    }

    console.log('Initializing tax groups from calculation:', {
      resultType: this.chargeSelectionTaxResult.type,
      lineItemsCount: this.chargeSelectionTaxResult.lineItems.length,
      availableChargesCount: this.availableCharges.length,
      taxGroupsCount: this.taxGroupList.length
    });

    // Map each charge to its calculated tax group
    this.availableCharges.forEach((charge, index) => {
      console.log(`Processing charge ${index}:`, {
        id: charge.BookingRatesSid,
        description: charge.ChargeDescription,
        chargeTaxMaster: charge.ChargeMaster?.chargeTaxMaster
      });

      let matchingTaxGroup = null;

      // First, try to match using ChargeTaxMaster if available
      if (charge.ChargeMaster?.chargeTaxMaster && charge.ChargeMaster.chargeTaxMaster.length > 0) {
        const chargeTaxMaster = charge.ChargeMaster.chargeTaxMaster[0];
        const taxRate = parseFloat(chargeTaxMaster.TaxRate);
        const taxGroup = chargeTaxMaster.TaxGroup;

        console.log(`Using ChargeTaxMaster for charge ${index}:`, {
          HSNCode: chargeTaxMaster.HSNCode,
          TaxRate: taxRate,
          TaxGroup: taxGroup
        });

        // Match tax group by rate and type
        matchingTaxGroup = this.taxGroupList.find(tg => {
          const tgRate = parseFloat(tg.TaxRate);
          const rateMatch = Math.abs(tgRate - taxRate) < 0.01; // Allow small floating point difference

          // If TaxGroup is specified, try to match it as well
          if (taxGroup) {
            const typeMatch = tg.TaxType === taxGroup ||
              (taxGroup === 'GST' && (tg.TaxType === 'Input' || tg.TaxType === 'Output' || tg.TaxType === 'GST'));
            return rateMatch && typeMatch;
          }

          return rateMatch;
        });

        if (matchingTaxGroup) {
          console.log(`Matched tax group from ChargeTaxMaster:`, matchingTaxGroup.TaxName);
        }
      }

      // Fallback to line item calculation if no ChargeTaxMaster match
      if (!matchingTaxGroup) {
        const lineItem = this.chargeSelectionTaxResult.lineItems.find(
          (item: any) => item.description === charge.ChargeDescription
        );

        console.log(`Line item for charge ${index}:`, lineItem);

        if (lineItem) {
          // Find matching tax group based on tax rate and type
          if (this.chargeSelectionTaxResult.type === 'GST') {
            const taxRate = lineItem.igstRate > 0 ? lineItem.igstRate : (lineItem.cgstRate + lineItem.sgstRate);
            console.log(`Looking for GST tax group with rate ${taxRate}%`);

            // For GST, TaxType can be 'Input', 'Output', or 'GST'
            // Match by rate and exclude VAT types
            matchingTaxGroup = this.taxGroupList.find(tg => {
              const tgRate = parseFloat(tg.TaxRate);
              const isGSTType = tg.TaxType === 'GST' || tg.TaxType === 'Input' || tg.TaxType === 'Output';
              const match = isGSTType && tgRate === taxRate;
              if (index === 0) {
                console.log(`Checking tax group:`, {
                  name: tg.TaxName,
                  type: tg.TaxType,
                  rate: tgRate,
                  targetRate: taxRate,
                  isGSTType,
                  match
                });
              }
              return match;
            });

            console.log(`Matching tax group for charge ${index}:`, matchingTaxGroup);
          } else if (this.chargeSelectionTaxResult.type === 'VAT') {
            matchingTaxGroup = this.taxGroupList.find(tg =>
              tg.TaxType === 'VAT' && parseFloat(tg.TaxRate) === lineItem.vatRate
            );
          }
        } else {
          console.log(`No line item found for charge ${charge.BookingRatesSid}`);
        }
      }

      if (matchingTaxGroup) {
        this.chargeTaxGroupMap.set(charge.BookingRatesSid, matchingTaxGroup);
        console.log(`Set tax group for charge ${charge.BookingRatesSid}:`, matchingTaxGroup.TaxName);
      } else {
        console.log(`No matching tax group found for charge ${charge.BookingRatesSid}`);
      }
    });

    console.log('Initialized tax group map:', this.chargeTaxGroupMap.size, 'charges');
    console.log('Tax group map contents:', Array.from(this.chargeTaxGroupMap.entries()));
  }

  onHeaderCurrencyChange() {
    // Fetch exchange rate from CurrencyExchange table
    if (this.invoiceHeaderCurrency) {
      // Get company's home currency
      const companyHomeCurrency = this.companySettings.getCurrencySettings();
      const selectedCurrencyCode = this.invoiceHeaderCurrency?.currencyCode;

      // If selected currency is same as company currency, exchange rate is 1
      if (selectedCurrencyCode === companyHomeCurrency.code) {
        this.invoiceHeaderExchangeRate = 1;
        this.calculateChargeSelectionTax();
      } else {
        // Fetch exchange rate from CurrencyExchange table
        const payload = {
          fromCurrencyCode: companyHomeCurrency.code,
          toCurrencyCode: selectedCurrencyCode,
          segment: 'revenue' // Use SellRate for revenue charges
        };

        this.operationService.getExchangeRate(payload).subscribe({
          next: (response: any) => {
            if (response?.status && response?.data) {
              this.invoiceHeaderExchangeRate = Number(response.data) || 1;
            } else {
              console.warn('Exchange rate not found, defaulting to 1');
              this.invoiceHeaderExchangeRate = 1;
            }
            this.calculateChargeSelectionTax();
          },
          error: (err) => {
            console.error('Error fetching exchange rate:', err);
            this.invoiceHeaderExchangeRate = 1;
            this.calculateChargeSelectionTax();
          }
        });
      }
    }
  }

  onHeaderExchangeRateChange() {
    this.calculateChargeSelectionTax();
  }

  onChargeTaxGroupChange(charge: any, taxGroup: any) {
    console.log('Tax group changed for charge:', {
      chargeId: charge.BookingRatesSid,
      chargeName: charge.ChargeDescription,
      newTaxGroup: taxGroup
    });

    if (taxGroup) {
      this.chargeTaxGroupMap.set(charge.BookingRatesSid, taxGroup);
    } else {
      this.chargeTaxGroupMap.delete(charge.BookingRatesSid);
    }

    console.log('Current tax group map size:', this.chargeTaxGroupMap.size);
    this.calculateChargeSelectionTax();
  }

  onChargeTaxGroupChangeBySid(charge: any, taxMasterSid: any) {
    console.log('Tax group changed by SID for charge:', {
      chargeId: charge.BookingRatesSid,
      chargeName: charge.ChargeDescription,
      newTaxMasterSid: taxMasterSid
    });

    if (taxMasterSid) {
      // Find the tax group object from the list
      const taxGroup = this.taxGroupList.find(tg => tg.TaxMasterSid === taxMasterSid);
      if (taxGroup) {
        this.chargeTaxGroupMap.set(charge.BookingRatesSid, taxGroup);
        console.log('Set tax group:', taxGroup);
      }
    } else {
      this.chargeTaxGroupMap.delete(charge.BookingRatesSid);
      console.log('Cleared tax group');
    }

    console.log('Current tax group map size:', this.chargeTaxGroupMap.size);
    console.log('Tax group map entries:', Array.from(this.chargeTaxGroupMap.entries()).map(([k, v]) => ({
      chargeId: k,
      taxGroup: v.TaxName
    })));
    this.calculateChargeSelectionTax();
  }

  getSelectedTaxGroup(charge: any): any {
    return this.chargeTaxGroupMap.get(charge.BookingRatesSid);
  }

  getSelectedTaxGroupSid(charge: any): any {
    const taxGroup = this.chargeTaxGroupMap.get(charge.BookingRatesSid);
    return taxGroup?.TaxMasterSid || null;
  }

  convertToHeaderCurrency(amount: number): number {
    if (!this.invoiceHeaderCurrency || !this.invoiceHeaderExchangeRate) {
      return amount;
    }
    // Convert amount to header currency using exchange rate
    return amount * this.invoiceHeaderExchangeRate;
  }

  toggleChargeSelection(charge: any) {
    if (this.selectedCharges.has(charge.BookingRatesSid)) {
      this.selectedCharges.delete(charge.BookingRatesSid);
      charge.isSelected = false;
    } else {
      this.selectedCharges.add(charge.BookingRatesSid);
      charge.isSelected = true;
    }
    this.calculateChargeSelectionTax();
  }

  selectAllCharges() {
    this.availableCharges.forEach(charge => {
      this.selectedCharges.add(charge.BookingRatesSid);
      charge.isSelected = true;
    });
    this.calculateChargeSelectionTax();
  }

  deselectAllCharges() {
    this.selectedCharges.clear();
    this.availableCharges.forEach(charge => {
      charge.isSelected = false;
    });
    this.calculateChargeSelectionTax();
  }

  calculateChargeSelectionTax() {
    const selectedChargeData = this.availableCharges.filter(c => this.selectedCharges.has(c.BookingRatesSid));

    if (selectedChargeData.length === 0) {
      this.chargeSelectionTaxResult = null;
      return;
    }

    // Get the first charge's billing party info
    // Revenue: customerMasterBP, Cost: AgentMaster
    const firstCharge: any = selectedChargeData[0];
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';
    const billingParty = {
      ...(isRevenue ? (firstCharge?.customerMasterBP || {}) : (firstCharge?.AgentMaster || {})),
      StateName: firstCharge?.customerBranch?.StateName || ''
    };

    // Check if we have manual tax group selections
    const hasManualTaxGroups = Array.from(this.chargeTaxGroupMap.keys()).some(key =>
      this.selectedCharges.has(key)
    );

    console.log('Calculating tax:', {
      selectedCharges: selectedChargeData.length,
      hasManualTaxGroups,
      taxGroupMapSize: this.chargeTaxGroupMap.size
    });

    if (hasManualTaxGroups) {
      // Use manual tax calculation
      console.log('Using manual tax calculation');
      this.calculateManualTax(selectedChargeData, isRevenue);
    } else {
      // Use automatic tax calculation service
      console.log('Using automatic tax calculation service');
      const taxParams = {
        companyMasterSid: this.currentCompany?.CompanyMasterSid || 0,
        branchMasterSid: this.currentBranch?.BranchMasterSid || 0,
        billingParty: billingParty,
        charges: selectedChargeData
      };
      this.chargeSelectionTaxResult = this.taxCalculationService.calculateTax(taxParams);
    }

    console.log('Tax calculation result:', this.chargeSelectionTaxResult);
  }

  private calculateManualTax(charges: any[], isRevenue: boolean) {
    console.log('Manual tax calculation started for', charges.length, 'charges');

    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalVAT = 0;
    const lineItems: any[] = [];
    let taxType = 'GST'; // Default

    charges.forEach(charge => {
      const amount = isRevenue
        ? (charge.RevenueLocalAmount || 0)
        : (charge.CostLocalAmount || 0);

      const chargeAmount = parseFloat(amount.toString());
      subtotal += chargeAmount;

      // Get manually selected tax group for this charge
      const selectedTaxGroup = this.chargeTaxGroupMap.get(charge.BookingRatesSid);

      if (selectedTaxGroup) {
        const taxRate = parseFloat(selectedTaxGroup.TaxRate || 0);

        let lineItem: any = {
          description: charge.ChargeDescription,
          hsn: charge.ChargeMaster?.chargeTaxMaster?.[0]?.HSNCode || charge.ChargeMaster?.HSNSAC || '-',
          amount: chargeAmount
        };

        const isGSTType = selectedTaxGroup.TaxType === 'GST' || selectedTaxGroup.TaxType === 'Input' || selectedTaxGroup.TaxType === 'Output';

        if (isGSTType) {
          // For GST, check if IGST or CGST+SGST
          // You can determine this based on state comparison
          const isInterState = this.checkIfInterState(charge);

          if (isInterState) {
            // IGST
            const igstAmount = (chargeAmount * taxRate) / 100;
            lineItem.igstRate = taxRate;
            lineItem.cgstRate = 0;
            lineItem.sgstRate = 0;
            lineItem.igstAmount = igstAmount;
            lineItem.cgstAmount = 0;
            lineItem.sgstAmount = 0;
            lineItem.totalTaxAmount = igstAmount;
            totalIGST += igstAmount;
          } else {
            // CGST + SGST
            const halfRate = taxRate / 2;
            const cgstAmount = (chargeAmount * halfRate) / 100;
            const sgstAmount = (chargeAmount * halfRate) / 100;
            lineItem.cgstRate = halfRate;
            lineItem.sgstRate = halfRate;
            lineItem.igstRate = 0;
            lineItem.cgstAmount = cgstAmount;
            lineItem.sgstAmount = sgstAmount;
            lineItem.igstAmount = 0;
            lineItem.totalTaxAmount = cgstAmount + sgstAmount;
            totalCGST += cgstAmount;
            totalSGST += sgstAmount;
          }
          taxType = 'GST';
        } else if (selectedTaxGroup.TaxType === 'VAT') {
          // VAT calculation
          const vatAmount = (chargeAmount * taxRate) / 100;
          lineItem.vatRate = taxRate;
          lineItem.vatAmount = vatAmount;
          lineItem.totalTaxAmount = vatAmount;
          totalVAT += vatAmount;
          taxType = 'VAT';
        } else {
          // No tax or unknown type
          lineItem.totalTaxAmount = 0;
        }

        lineItems.push(lineItem);
      } else {
        // No tax group selected, add with 0 tax
        lineItems.push({
          description: charge.ChargeDescription,
          hsn: charge.ChargeMaster?.chargeTaxMaster?.[0]?.HSNCode || charge.ChargeMaster?.HSNSAC || '-',
          amount: chargeAmount,
          totalTaxAmount: 0,
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
          vatRate: 0
        });
      }
    });

    const totalTaxAmount = totalCGST + totalSGST + totalIGST + totalVAT;
    const grandTotal = subtotal + totalTaxAmount;

    this.chargeSelectionTaxResult = {
      type: taxType,
      lineItems: lineItems,
      subtotal: subtotal,
      totalAmount: subtotal,
      totalCGST: totalCGST,
      totalSGST: totalSGST,
      totalIGST: totalIGST,
      totalVAT: totalVAT,
      totalTaxAmount: totalTaxAmount,
      grandTotal: grandTotal,
      totalInvoiceAmount: grandTotal,
      isSameState: totalCGST > 0 || totalSGST > 0,
      isInterState: totalIGST > 0,
      vatRate: totalVAT > 0 ? (totalVAT / subtotal * 100) : 0
    };

    console.log('Manual tax calculation complete:', {
      subtotal,
      totalCGST,
      totalSGST,
      totalIGST,
      totalVAT,
      grandTotal,
      lineItemsCount: lineItems.length
    });
  }

  private checkIfInterState(charge: any): boolean {
    // Compare company state with billing party state
    const companyState = this.currentBranch?.StateName || '';
    const billingPartyState = charge?.customerBranch?.StateName || '';
    return companyState !== billingPartyState;
  }

  /**
   * Determine GST Type for Indian companies based on business rules
   * B2B: Sale between GST-registered entities
   * B2CS: Business to Consumer (Small) - unregistered, same state, <= 2.5 lakh
   * B2CL: Business to Consumer (Large) - unregistered, different state, > 2.5 lakh
   * EXWP: Export with payment of IGST
   * EXWOP: Export without payment (LUT/bond)
   */
  private determineGSTType(selectedCharges: any[]): string | null {
    // Only determine GST Type for Indian companies
    if (this.countryOfCompany !== 'india') {
      return null;
    }

    // Get first charge for common data
    const firstCharge = selectedCharges[0];
    if (!firstCharge) return null;

    const isRevenue = this.currentVoucherTypeFilter === 'revenue';

    // Get billing party details based on type
    const billingParty = isRevenue
      ? (firstCharge?.customerMasterBP || {})
      : (firstCharge?.AgentMaster || {});

    const customerBranch = firstCharge?.customerBranch || {};

    // Check if this is an export shipment
    // Get POL and POD from booking form
    const polData = this.bookingForm?.get('POL')?.value;
    const podData = this.bookingForm?.get('POD')?.value;

    // If POL or POD has country information, check if it's export
    const isExport = this.checkIfExportShipment(polData, podData);

    if (isExport) {
      // For export, check if IGST is applied
      // EXWP: Export with payment (IGST applied)
      // EXWOP: Export without payment (no IGST)
      const hasIGST = this.chargeSelectionTaxResult?.totalIGST > 0;
      return hasIGST ? 'EXWP' : 'EXWOP';
    }

    // Check if customer has GST number
    const customerGSTNo = customerBranch?.GSTNo?.trim();
    const hasGSTNumber = customerGSTNo && customerGSTNo.length > 0;

    if (hasGSTNumber) {
      // B2B: Customer has GST number
      return 'B2B';
    } else {
      // B2C: Customer does not have GST number
      // Check invoice amount and state

      // Get total invoice amount from tax calculation result
      const invoiceAmount = this.chargeSelectionTaxResult?.grandTotal || 0;
      const invoiceAmountInLakhs = invoiceAmount / 100000; // Convert to lakhs

      // Check if same state or different state
      const companyState = this.currentBranch?.StateName || '';
      const customerState = customerBranch?.StateName || '';
      const isSameState = companyState === customerState;

      if (isSameState && invoiceAmountInLakhs <= 2.5) {
        // B2CS: Same state, amount <= 2.5 lakh
        return 'B2CS';
      } else {
        // B2CL: Different state or amount > 2.5 lakh
        return 'B2CL';
      }
    }
  }

  /**
   * Check if this is an export shipment based on port countries
   */
  private checkIfExportShipment(polData: any, podData: any): boolean {
    // If company country is India, check if either POL or POD is outside India
    if (this.countryOfCompany !== 'india') {
      return false;
    }

    // Check if POL or POD has country information
    const polCountry = polData?.countryMaster?.countryCode?.trim()?.toLowerCase() ||
                       polData?.Country?.trim()?.toLowerCase() || '';
    const podCountry = podData?.countryMaster?.countryCode?.trim()?.toLowerCase() ||
                       podData?.Country?.trim()?.toLowerCase() || '';

    // Export if destination is outside India
    // Import if origin is outside India (but for invoice, we typically generate for exports)
    const isExport = podCountry && podCountry !== 'india' && podCountry !== 'in';

    return isExport;
  }

  getChargeTaxPercentage(charge: any): string {
    // First check if there's a manually selected tax group
    const selectedTaxGroup = this.chargeTaxGroupMap.get(charge.BookingRatesSid);

    if (selectedTaxGroup) {
      const taxRate = parseFloat(selectedTaxGroup.TaxRate || 0);
      const isGSTType = selectedTaxGroup.TaxType === 'GST' || selectedTaxGroup.TaxType === 'Input' || selectedTaxGroup.TaxType === 'Output';

      if (isGSTType) {
        // For GST, determine if IGST or CGST+SGST based on state
        const isInterState = this.checkIfInterState(charge);
        if (isInterState) {
          return `IGST ${taxRate}%`;
        } else {
          const halfRate = taxRate / 2;
          return `CGST ${halfRate}% + SGST ${halfRate}%`;
        }
      } else if (selectedTaxGroup.TaxType === 'VAT') {
        return `VAT ${taxRate}%`;
      }
    }

    // Fall back to calculation result
    if (!this.chargeSelectionTaxResult || !this.selectedCharges.has(charge.BookingRatesSid)) {
      return '-';
    }

    const lineItem = this.chargeSelectionTaxResult.lineItems?.find(
      item => item.description === charge.ChargeDescription
    );

    if (!lineItem) return '-';

    if (this.chargeSelectionTaxResult.type === 'GST') {
      const gstItem = lineItem as any;
      if (gstItem.igstRate > 0) {
        return `IGST ${gstItem.igstRate}%`;
      } else if (gstItem.cgstRate > 0) {
        return `CGST ${gstItem.cgstRate}% + SGST ${gstItem.sgstRate}%`;
      }
    } else if (this.chargeSelectionTaxResult.type === 'VAT') {
      const vatItem = lineItem as any;
      return `VAT ${vatItem.vatRate}%`;
    }

    return '-';
  }

  getChargeTaxAmount(charge: any): number {
    if (!this.chargeSelectionTaxResult || !this.selectedCharges.has(charge.BookingRatesSid)) {
      return 0;
    }

    const lineItem = this.chargeSelectionTaxResult.lineItems?.find(
      item => item.description === charge.ChargeDescription
    );

    return lineItem?.totalTaxAmount || 0;
  }

  async proceedWithSelectedCharges() {
    if (this.selectedCharges.size === 0) {
      this.appSettingService.showWarning('Please select at least one charge');
      return;
    }

    try {
      const selectedChargeData = this.availableCharges.filter(c => this.selectedCharges.has(c.BookingRatesSid));

      // Close modal
      this.chargeSelectionModalRef?.close();

      this.appSettingService.showInfo('Generating voucher...');

      const isRevenue = this.currentVoucherTypeFilter === 'revenue';

      // Get billing party branch based on type
      // Revenue: CustomerBranchSid, Cost: AgentBranchSid
      const billingPartyBranchSid = isRevenue
        ? selectedChargeData[0]?.CustomerBranchSid
        : selectedChargeData[0]?.AgentBranchSid;

      // Prepare payload for voucher generation
      // voucherTypeMasterSid will be found dynamically in backend based on voucherType + company + branch
      const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];

      // Prepare charge tax group mappings
      const chargeTaxGroups: any[] = [];
      this.chargeTaxGroupMap.forEach((taxGroup, chargeId) => {
        // Find the charge to check if it's inter-state
        const charge = selectedChargeData.find(c => c.BookingRatesSid === chargeId);
        const isInterState = charge ? this.checkIfInterState(charge) : false;

        chargeTaxGroups.push({
          bookingRatesSid: chargeId,
          taxMasterSid: taxGroup.TaxMasterSid,
          taxName: taxGroup.TaxName,
          taxRate: taxGroup.TaxRate,
          taxType: taxGroup.TaxType,
          isInterState: isInterState  // Add inter-state flag
        });
      });

      // Determine GST Type for Indian companies
      const gstType = this.determineGSTType(selectedChargeData);

      const payload = {
        bookingHeaderSid: this.BookingHeaderSid,
        companyMasterSid: this.currentCompany?.CompanyMasterSid,
        branchMasterSid: this.currentBranch?.BranchMasterSid,
        voucherType: this.selectedVoucherType,
        selectedRateIds: Array.from(this.selectedCharges),
        billingPartySid: this.currentBillingPartySid,
        customerBranchSid: billingPartyBranchSid || null,
        createdBy: currUserEmail || 'System',

        // Invoice header information
        invoiceHeader: {
          currencyMasterSid: this.invoiceHeaderCurrency?.CurrencyMasterSid,
          currencyCode: this.invoiceHeaderCurrency?.currencyCode,
          exchangeRate: this.invoiceHeaderExchangeRate,
          billingPartyName: this.billingPartyDetails?.CustomerName || this.billingPartyDetails?.VendorName,
          billingPartyAddress: this.billingPartyAddress,
          gstType: gstType  // Add GST Type to invoice header
        },

        // Charge tax group mappings
        chargeTaxGroups: chargeTaxGroups
      };

      // Generate voucher via API
      const result = await firstValueFrom(this.operationService.generateVoucherFromBooking(payload));

      if (result?.status) {
        const voucherNumber = result.data?.voucherHeader?.VoucherNumber || 'N/A';
        const voucherHeaderSid = result.data?.voucherHeader?.VoucherHeaderSid;

        this.appSettingService.showSuccess(`Voucher generated successfully! Voucher Number: ${voucherNumber}`);

        // Reload booking data to show updated rates with voucher information
        await this.loadBookingById(this.BookingHeaderSid);

        // Navigate to invoice-entry or vendor-invoice-entry based on voucher type
        if (voucherHeaderSid) {
          const targetRoute = this.selectedVoucherType === 'Vendor Invoice'
            ? '/operation/vendor-invoice/entry'
            : '/operation/invoice/entry';

          this.router.navigate([targetRoute, voucherHeaderSid], {
            queryParams: {
              from: 'booking',
              bookingId: this.BookingHeaderSid
            }
          });
        }
      } else {
        this.appSettingService.showError('Failed to generate voucher: ' + (result?.message || 'Unknown error'));
      }
    } catch (error: any) {
      this.appSettingService.showError('Error generating voucher: ' + (error?.error?.message || error.message || 'Unknown error'));
      console.error('Error generating voucher:', error);
    }
  }

  cancelChargeSelection() {
    this.chargeSelectionModalRef?.close();
    this.selectedCharges.clear();
    this.availableCharges = [];
  }
  ngOnDestroy() {
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

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
  }

  getBookingStatus() {
    return this.bookingForm.get('status')?.value;
  }


   async downloadPDF() {
          const printContent = document.getElementById('printContent');
          if (!printContent) {
            this.appSettingService.showError('Print content not found.');
            return;
          }
      
          try {
            this.spinner.show();
      
            // Generate PDF using html2canvas and jsPDF
            const canvas = await html2canvas(printContent, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });
      
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
      
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
      
            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
      
            // Add additional pages if content exceeds one page
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
      
            
            const BookingNumber = this.bookingForm.get('BookingNumber')?.value || 'Booking';
            const filename = `Booking_${BookingNumber}.pdf`;
      
            // Download the PDF
            pdf.save(filename);
      
            this.spinner.hide();
            this.appSettingService.showSuccess('PDF downloaded successfully!');
          } catch (error) {
            this.spinner.hide();
            console.error('Error generating PDF:', error);
            this.appSettingService.showError('Error generating PDF. Please try again.');
          }
        }
    
          async generatePDFBlob(): Promise<Blob | null> {
            const printContent = document.getElementById('printContent');
            if (!printContent) {
              return null;
            }
        
            try {
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
        
              return pdf.output('blob');
            } catch (error) {
              console.error('Error generating PDF blob:', error);
              return null;
            }
          }

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
      detailForm: this.detailForm.getRawValue(),
      connectionResult: this.connectionResult,
      rateResult: this.rateResult,
      milestoneResult: this.milestoneResult,
    };
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
          
}

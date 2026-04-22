import { Component, ViewChild, TemplateRef, OnInit, Input, HostListener } from '@angular/core';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { catchError, firstValueFrom, forkJoin, map, of, take, tap } from 'rxjs';
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
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { toggleFullScreen } from 'src/app/shared/fullscreenToggle';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import html2pdf from 'html2pdf.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { VolumetricAndCbmCalculationService } from 'src/app/core/services/volumetric-and-cbm-calculation.service';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { getDefaultTodayDate, getMaxDate,toNgbDateStruct, getMinDate, toNumber } from 'src/app/common/helper';
import { ConnectionComponent } from '../../connection/connection/connection.component';
import { MilestoneComponent } from '../../milestone/milestone/milestone.component';
import { CostEntryComponent } from '../../cost/cost -entry/cost-entry.component';
import { ArApComponent } from '../../AR-AP/ar-ap/ar-ap.component';
import { BookingUploadComponent } from '../../booking/booking-upload/booking-upload.component';
import { BoeEntryComponent } from '../../house-job/boe-entry/boe-entry.component';
import { VehicleComponent } from '../../house-job/vehicle/vehicle.component';
import { CustomsComponent } from '../../house-job/customs/customs.component';
import { BookingData } from '../../booking/excel-parser.service';
import { DeliveryOrderComponent } from '../../house-job/report/delivery-order/delivery-order.component';
import { CargoArrivalComponent } from '../../house-job/report/cargo-arrival/cargo-arrival.component';
import { HblComponent } from '../../house-job/report/HBL/hbl/hbl.component';
import { ShipmentComponent } from '../../house-job/report/shipment/shipment.component';
import { ImdemintyComponent } from '../../house-job/report/imdeminty/imdeminty.component';
import { CommericalInvoiceComponent } from '../../house-job/report/commerical-invoice/commerical-invoice.component';
import { CertificateOfOriginComponent } from '../../house-job/report/certificate-of-origin/certificate-of-origin.component';
import { JobCardComponent } from '../../house-job/report/job-card/job-card.component';
import { ReleaseLetterComponent } from '../../house-job/report/release-letter/release-letter.component';
import { ReleaseOrderComponent } from '../../house-job/report/release-order/release-order.component';
import { PackingListComponent } from '../../house-job/report/packing-list/packing-list.component';
import { ProofOfDeliveryComponent } from '../../house-job/report/proof-of-delivery/proof-of-delivery.component';
import { MilestoneSummaryComponent } from '../../house-job/report/milestone-summary/milestone-summary.component';
import { CFSOutturnComponent } from '../../house-job/report/cfs-outturn/cfs-outturn.component';
import { SailingConfimationComponent } from '../../house-job/report/sailing-confimation/sailing-confimation.component';
import { ExitFormComponent } from '../../house-job/report/exit-form/exit-form.component';
import { HAWBComponent } from '../../house-job/report/hawb/hawb.component';
import { OperationService } from '../../operation.service';
import { ToastrService } from 'ngx-toastr';
import { AwbDraftComponent } from '../report/awb-draft/awb-draft.component';
import { AwbPreprintComponent } from '../report/awb-preprint/awb-preprint.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { MAWBComponent } from '../../Master-air-waybill/report/mawb/mawb.component';

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
  selector: 'app-agent-master-air-waybill-entry',
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
    EdocComponent,
    EmailEntryComponent,
    FollowUpComponent,
    SearchableDropdown,
    NgbDropdownModule,
    BoeEntryComponent,
    VehicleComponent,
    CustomsComponent,
    MultiSelectComponent,
    RouterModule,
  ],
  templateUrl: './agent-master-air-waybill-entry.component.html',
 
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class AgentMasterAirWaybillEntryComponent  implements OnInit, HasUnsavedChanges {



  /**
    |--------------------------------------------------
    |   Section-1 Variable Declaration
    |--------------------------------------------------
  */
 @ViewChild(CustomsComponent) customsComponent!: CustomsComponent;
  @ViewChild('vehicleComponent') vehicleComponent!: VehicleComponent;
  @ViewChild('costEntryComponent') costEntryComponent: CostEntryComponent;
@ViewChild(BoeEntryComponent) boeComponent!: BoeEntryComponent;
  @ViewChild('uploadModal') uploadModal!: BookingUploadComponent;
  parsedBookings: BookingData[] = [];
  showParsedData = false;
  uploadResult: any = null;
  decimalAfterPrecision = 3;
  isFormDisabled: boolean = false;
  digitsAfterDecimal = 3;
  isETDFreeText: boolean = false;
isETAFreeText: boolean = false;
boeDataArray: any[] = [];        // for BOE data
resetTriggerBOE: boolean = false; // trigger flag for reset
vehicleDataArray: any[] = [];        // for BOE data
resetTriggerVehicle: boolean = false; // trigger flag for reset
customsDataArray: any[] = [];        // for BOE data
resetTriggerCustoms: boolean = false; // trigger flag for reset
hssacList: any[] = [];
selectedCustomer: any;
notifyManuallyChanged = false;
fyMinDate: NgbDateStruct | null = null;
fyMaxDate: NgbDateStruct | null = null;
  mawbStockList: any[] = [];
  mawbStockSource: 'ALLOCATED' | 'FREE' | 'OTHER' | 'NONE' | null = null;
  isMawbDropdownDisabled = false;
  isMawbStockAllocationEnabled = false;
  allowManualMawbEntryOnAutoAllocationError = false;
  private lastNoMawbStockWarningKey: string | null = null;
mawbStockLookupConfig = {
  displayFields: ['MasterBillNumber', 'AgentName'],
  displayLabels: ['MAWB', 'AirLine'],
  labelFields: ['MasterBillNumber']
};

// Customs pre-save validation modal
showCustomsValidationModal = false;
customsValidationErrors: { recordType: string; fieldRef: string; fieldName: string; tabName?: string }[] = [];

  //Variable Declaration - Common
  detailForm !: FormGroup;
  userData : any;
  isPrintLoading : boolean;
  uomLookupConfig = DROPDOWN_CONFIGS.UOM;
  currentCompany : any;
  currentBranch : any;
  startFinanceYr : any;
  endFinanceYr : any;
  currentFinacialYear : any;
  filterOption : any;
  airlineList: any[] = [];
  imcoLookupConfig = DROPDOWN_CONFIGS.IMCO;
  masterJobId: number | null = null;
  cargoCurrencyValue: any;
    public rateComponent = CostEntryComponent;
    public ArApcomponent = ArApComponent;
  chargeWiseSummary : any[] = [];
  masterJobData: any;
  allTabs : {name : string, icon : string}[] = [
    { name: 'Shipment', icon: 'fas fa-ship' },
    { name: 'Cargo', icon: 'fas fa-boxes' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'BOE', icon: 'fas fa-file-invoice' },
    { name: 'Vehicle', icon: 'fas fa-truck' },
    { name: 'Customs', icon: 'fas fa-passport' },
    { name: 'AR/AP', icon: 'fas fa-file-alt' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
  ];
  filteredTabs : {name : string, icon : string}[] = [...this.allTabs];
  selectTab(tab: string) {
    if (tab === "Rate") {
      this.syncFormValueWithRateComponent();
    }
    if (tab === 'Follow Up') {
    this.openFollowup();
  }
    this.selectedTab = tab;
  }

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];
  isPatching: boolean = false;
  chargeableWeightManualOverride: boolean = false;
  isTermsAndConditionsEnabled: boolean = true;

  // Variable Declaration - Header Part
  HouseJobSid: number;
  currentMenuId: any;
  selectedDepartment: any;
  selectedDepartmentType: string;
  selectedFCLLCL: string = "LCL";
  isEditMode: boolean;
  bookingData: any;
  isDirty = false;
  private formSaved = false;
  private initialProductsCount = 0;
  private initialConnectionsCount = 0;
  private initialRatesCount = 0;
  quotationNumber : any ='';
  departmentList: any[] = [];
  customerList: any[] = [];
  customerBranchList: any[] = [];
  salesmanList: any[] = [];
  shipperList: any[] = [];
  filteredShipperList: any[] = [];
  consigneeList: any[] = [];
  filteredConsigneeList: any[] = [];
  agentList: any[] = [];
  deliveryAgentList: any[] = [];
  originAgentList: any[] = [];
  carrierList: any[] = [];
  notifyList: any[] = [];
  vesselList: any[] = [];
  headerVesselList: any[] = [];
  voyageList: any[] = [];
  portList: any[] = [];
  filteredPorts: any[] = [];
  filteredPOO: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  filteredFPOD: any[] = [];
  incoList: any[] = [];
  TandCList: any[]=[];
  bookingHeader: any;
  isSubmitting = false;
  isSaving = false;
  isLoading = false;
  selectedCustomerBranch : any;
  edocData : any;
  edocResetTrigger : any;
  currentEdocFormValue : any;
  emailData:any;
  emailResetTrigger:any;
  currentEmailFormValue:any;
  followUpData:any;
  followUpResetTrigger:any;
  currentFollowUpFormValue:any;
auditLogs: any[] = []; // Stores audit logs
  selectedShipment: any;
  auditLogModalRef!: NgbModalRef;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  vesselVoyageConfig = DROPDOWN_CONFIGS.VESSEL_VOYAGE;
  incoLookupConfig = DROPDOWN_CONFIGS.INCO;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  userLookupConfig = DROPDOWN_CONFIGS.USER;
  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };

  commonFormValue:any
  houseJobForm !: FormGroup;
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
  selectedContainerType : any;
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
  // jobType = [
  //   { id: 1 , name: 'Export' },
  //   { id: 2 , name: 'Import' },
  //   { id: 3 , name: 'Transhipment' }
  // ]

  // Variable Declaration - Product Part
  productDataLength: number;
  page = 1;
  pageSize = 5;
  currentProductIndex: number;
  productEditMode: boolean;
  productLookupsLoaded: boolean;
  slicedProductArr: any[];
  productList: any[];
  packageTypeList: any[];
  productForm !: FormGroup;
  countryOfCompany : string;
  masterJobContainers : any[] = [];
  

  // Variable Declaration - Other Part
  YardCFSLabel: string = "Yard/CFS"
  selectedReportAir: 'HAWB' | 'HAWBDraft' = 'HAWB';
  forwarderList: any[] = [];
  currencyList: any[] = [];
  imcoList: any[] = [];
  uomList: any[] = [];
  yardlist: any[] = [];
  cfslist: any[] = [];
  yardCFSList: any[] = [];
  filteredYardCFSList: any[] = [];
  currentYardCFSType: 'yard' | 'cfs' | null = null;
  jobStatusOptions = [
  { id: 'Job Generated', name: 'Job Generated' },
  { id: 'Open', name: 'Open' },
  { id: 'Closed', name: 'Closed' },
  { id: 'Sailed', name: 'Sailed' },
  { id: 'Operation Closed', name: 'Operation Closed' },
  { id: 'Documentation Closed', name: 'Documentation Closed' }
];
    measurementUnitList =[
    { id: 1, name: 'M' },
    { id: 2, name: 'CM' },
    { id: 3, name: 'Inch'}
  ]
  otherForm !: FormGroup;

  // Variable Declaration - Connection Part
  PODandFPODsame : boolean = true;
  blClauseOptions: any[] = [];
  minStartDate : Date = new Date();
  resetTriggerConnection : boolean;
  bookingConnectionsArr : any[] = [];
  connectionResult : any[] =[];
  documentSid: number | null = null; 
  parentSubject = '';
  parentMailbody = '';
  // Variable Declaration - Rate Part
  resetTriggerRate : boolean;
  rateResult : any[] = [];
  bookingRateArr : any[] = [];
  currentFormValue : any;
  isShipperFreeText: boolean = false;
isConsigneeFreeText: boolean = false;
isNotifyFreeText: boolean = false;
isCarrierFreeText: boolean = false;
isVesselFreeText: boolean = false;
isVoyageFreeText: boolean = false;
  
  // Variable Declaration - Milestone Part
  resetTriggerMilestone : boolean;
  milestoneResult: any[] =[];
  arapData: any[] = [];
 arapLoading = false;
 arapFilter = {
  voucherType: 'all', 
  status: 'all' // 'all', 'unpaid', 'partial', 'paid'
};
  today : any;
  minDate : any;
  minDODate : any;
  minSIConfirmationDate : any;
  minDGConfirmationDate : any;
  minShippingBillDate : any;
  maxShippingBillDate : any;
  minCargoRecDate : any;
  maxCargoRecDate : any;
  minDeliveryDate : any;
  currentDate = new Date();
  housejobData:any;
  departments: any[] = [];
  DepartmentMasterSid: number;
  amountInWords: string = '';
  customerWiseSummary : any;
    profitSummary : any;
      chargeList:any[]=[];

      // Add a variable to track which report is selected
selectedReport: 'HBL' | 'HBLDraft' = 'HBL';



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

  customerAirlineLookupConfig={
    displayFields: ['CustomerName','AirlineCode'],
    displayLabels: ['Customer','AirlineCode'],
    labelFields: ['AirlineCode']
  }

  modeoftransport=[
    {id:1,name:"Railway"},
    {id:2,name:"Flight"},
    {id:3,name:"Road"},
    {id:4,name:"Vessel"}
  ]
 
  modeOfReleaseType = [
    { id: 1, name: 'Original' },
    { id: 2, name: 'Sea Way BL' },
    { id: 3, name: 'Express' },
    { id: 4, name: 'Drat' },
  ];

  DeclaredValueOfCarriage = [
    { id: 'NVD', name: 'No value declared' },
    { id: 'DVC', name: 'Declared value for Carriage' },
  ];

  DeclaredValueOfCustoms = [
    { id: 'NCV', name: 'No Commercial Value' },
    { id: 'DVC', name: 'Declared value for Customs' },
  ];

//  get filteredTabs() {
//   const allTabs = [
//     { name: 'Shipment', icon: 'fas fa-ship' },
//     { name: 'Cargo', icon: 'fas fa-boxes' },
//     { name: 'Connection', icon: 'fas fa-link' },
//     { name: 'Others', icon: 'fas fa-ellipsis-h' },
//     { name: 'Rate', icon: 'fas fa-rupee-sign' },
//     { name: 'BOE', icon: 'fas fa-file-invoice' },
//     { name: 'Vehicle', icon: 'fas fa-truck' },
//     { name: 'Customs', icon: 'fas fa-passport' },
//     { name: 'AR/AP', icon: 'fas fa-file-alt' },
//     { name: 'Follow Up', icon: 'fas fa-tasks' },
//     { name: 'Milestone', icon: 'fas fa-flag-checkered' },
//     { name: 'Edoc', icon: 'fas fa-file-pdf' },
//   ];
 
//   // Filter out Vehicle tab when department type is AIR
//   if (this.selectedDepartmentType === 'AIR') {
//     return allTabs.filter(tab => tab.name !== 'Vehicle');
//   }
 
//   return allTabs;
// }

  filterTabs(){
    if (this.selectedDepartmentType === 'AIR') {
      this.filteredTabs = this.allTabs.filter(tab => tab.name !== 'Vehicle');
    } else {
      this.filteredTabs = [...this.allTabs];
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
    if (this.formSaved) {
      return false;
    }

    if (this.houseJobForm?.dirty || this.cargoForm?.dirty || this.otherForm?.dirty || this.detailForm?.dirty) {
      return true;
    }

    if (this.bookingProducts?.length !== this.initialProductsCount) {
      return true;
    }

    if (this.connectionResult?.length !== this.initialConnectionsCount) {
      return true;
    }

    if (this.rateResult?.length !== this.initialRatesCount) {
      return true;
    }

    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.submitAgentMasterAirWaybill(resolve);
    });
  }

  private resetDirtyState(): void {
    this.isDirty = false;
    this.formSaved = false;
    this.houseJobForm?.markAsPristine();
    this.cargoForm?.markAsPristine();
    this.otherForm?.markAsPristine();
    this.detailForm?.markAsPristine();
    this.initialProductsCount = this.bookingProducts?.length || 0;
    this.initialConnectionsCount = this.connectionResult?.length || 0;
    this.initialRatesCount = this.rateResult?.length || 0;
  }

  private markAsDirty(): void {
    this.isDirty = true;
    this.formSaved = false;
  }

  // Mail content


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
    private calendar : NgbCalendar,
    private exportExcelService: ExcelExportService,
    private datePipe : CustomDatePipe,
    private spinner: NgxSpinnerService,
     private toastr: ToastrService,
     public mps: MenuPermissionService,
    private volumetricAndCbmCalculationService: VolumetricAndCbmCalculationService,
    private emailTriggerService: EmailTriggerService,
  ) {
    this.today = this.calendar.getToday();
   }

  /**
    |--------------------------------------------------
    |   Section-3 : NgOnInit Part
    |--------------------------------------------------
    */
  ngOnInit(): void {
     const fy = this.appSettingService.getCurrentFinancialYear();
        if (fy) {
          this.fyMinDate = toNgbDateStruct(fy.StartDate);
          const fyEnd = new Date(fy.EndDate);
          const today = getDefaultTodayDate();
          this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
        }
  this.userData = this.appSettingService.getDecryptedUserProfile();
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.countryOfCompany = this.currentCompany?.CountryName;
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

  this.currentFinacialYear = this.appSettingService.getCurrentFinancialYear();
  this.startFinanceYr = this.currentFinacialYear?.StartDate ? new Date(this.currentFinacialYear.StartDate) : null;
  this.endFinanceYr = this.currentFinacialYear?.EndDate ? new Date(this.currentFinacialYear.EndDate) : null;
  
  this.filterOption = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentCompany?.BranchMasterSid,
  };
  this.loadTermsAndConditionsConfig();
  this.initBookingForm();
  this.initCargoForm();
  this.initOtherForm();
  this.initDetailsForm();
  this.setupMBLDateListener();
  this.spinner.show();
  this.mps.init().subscribe();
  

    this.loadHeaderMandatoryParts().subscribe(() => {
      // Check for master job data in query parameters
      this.currentRoute.queryParams.pipe(take(1)).subscribe(params => {
        if (params['fromMasterJob'] === 'true' || params['fromMasterAirWaybill'] === 'true') {
          const masterJobState = window.history.state?.masterJobData;
          
          if (masterJobState) {
            this.loadMasterJobDataForHouseJob(masterJobState);
          }
        }
      });


      this.currentRoute.paramMap.subscribe((param) => {
        this.HouseJobSid = +param.get('id');
        if (this.HouseJobSid) {
          this.isEditMode = true;
          this.loadHouseById(this.HouseJobSid);
        } else {
          this.minDate = this.today;
          this.setMinMaxDateConditions();
        }
      });
      this.loadHeaderLookups().subscribe(() => {
        this.loadCargoLookups();
        if (!this.productLookupsLoaded) {
          this.loadProductLookups();
        }
        this.loadOtherLookups();
      });
      this.spinner.hide();
    });
  
  this.otherForm.get('CargoCurrency')?.valueChanges.subscribe(value => {
    
  });
  this.loadHSSACLookups();

   this.houseJobForm.get('CarrierName')?.valueChanges.subscribe((carrierName) => {
  if (this.selectedDepartmentType === "AIR") {
    // Find the full carrier object from carrierList
    const selectedCarrier = this.carrierList.find(c => c.CustomerName === carrierName);
    this.onCarrierChangeForAir(selectedCarrier);
  }
});

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

  private parseConfigBoolean(value: any, defaultValue: boolean): boolean {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return defaultValue;
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
    if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
    return defaultValue;
  }
onCarrierChangeForAir(carrier: any): void {
  // Only apply for Air department
  if (this.selectedDepartmentType !== "AIR") {
    return;
  }

  if (!carrier) {
    // If carrier is cleared, clear the airline selection
    this.houseJobForm.get('VesselName')?.setValue(null);
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
      this.houseJobForm.get('VesselName')?.setValue(matchingAirline.CustomerName);
    } else {
      // If no exact match found, you might want to clear or show a message
      console.log('No matching airline found for AirlineCode:', carrier.AirlineCode);
      this.houseJobForm.get('VesselName')?.setValue(null);
    }
  } else {
    // Carrier doesn't have an AirlineCode
    this.houseJobForm.get('VesselName')?.setValue(null);
  }
}

setMinMaxDateConditions(){
  if(this.isEditMode){
    const HBLDate = this.housejobData.HBLDate ? new Date(this.housejobData.HBLDate) : new Date();
    this.minShippingBillDate = this.toNgbDateStruct(getMinDate(HBLDate,15));
    this.maxShippingBillDate = this.toNgbDateStruct(getMaxDate(HBLDate,15));
    this.minDeliveryDate = this.toNgbDateStruct(HBLDate);
    this.minCargoRecDate = this.toNgbDateStruct(getMinDate(HBLDate,15));
    this.maxCargoRecDate = this.toNgbDateStruct(getMaxDate(HBLDate));
  } else {
    const HBLDate = this.houseJobForm.get('HBLDate')?.value ? new Date(this.houseJobForm.get('HBLDate')?.value) : new Date();
    this.minShippingBillDate = this.toNgbDateStruct(getMinDate(HBLDate,15));
    this.maxShippingBillDate = this.toNgbDateStruct(getMaxDate(HBLDate,15));
    this.minDeliveryDate = this.toNgbDateStruct(HBLDate);
    this.minCargoRecDate = this.toNgbDateStruct(getMinDate(HBLDate,15));
    this.maxCargoRecDate = this.toNgbDateStruct(getMaxDate(HBLDate));
  }
}


private setupMBLDateListener(): void {
  this.houseJobForm.get('MBLDate')?.valueChanges.subscribe((mblDateValue) => {
    if (mblDateValue) {
      // If MBLDate has a value and HBLDate is empty, auto-fill HBLDate
      const currentHBLDate = this.houseJobForm.get('HBLDate')?.value;
      if (!currentHBLDate) {
        this.houseJobForm.patchValue({
          HBLDate: mblDateValue
        }, { emitEvent: false });
      }
    }
  });
}
  /**
  |--------------------------------------------------
  |   Section-4 : Main Functions
  |--------------------------------------------------
  */

  // Header Form Initialization
  initBookingForm() {
    const today = getDefaultTodayDate();
   const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultBookingDate = fyDefault && ( today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;
    const defaultHBLDate = fyDefault && ( today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;
    const defaultMBLWDate = fyDefault && ( today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;
    this.houseJobForm = this.fb.group({
      MasterJobSid : [null],
      BookingNo: [{ value:'', disabled: true }],
      BookingDateTime: [defaultBookingDate],
      BookingHeaderSid: [null],
      DepartmentMasterSid: [null, [Validators.required]],
      CustomerMasterSid: [null, [Validators.required]],
      CustomerBranchSid: [''],
      CustomerName: [''],
      CustomerAddress: [null, [Validators.required]],
      SalesmanSid: [null],
      ShipperName: [null, [Validators.required]],
      ShipperAddress: ['', [Validators.required]],
      ConsigneeName: [null, [Validators.required]],
      ConsigneeAddress: ['', [Validators.required]],
      Notify: [null],
      NotifyAddress: [''],
      DestinationAgent : [null],
      AgentName : [''],
      AgentAddress: [''],
      CarrierSid : [null],
      CarrierName: [null],
      QuotationHeaderSid: [{ value: '', disabled: true }],
      HBLNo: [null],
      HBLDate: [{value : defaultHBLDate, disabled: true}],
      MBLNo: [null],
      isMawbFreeText: [false],
      MBLDate: [defaultMBLWDate],
      status: ['Active'],
      isShipperFreeText: [false],
    isConsigneeFreeText: [false],
    isNotifyFreeText: [false],
    isCarrierFreeText: [false],
    isVesselFreeText: [false],
    isVoyageFreeText: [false],
  MasterJobNumber: [{ value: '', disabled: true }],
      VesselName: [null],
      VoyageMasterSid: [null],
      VoyageNo: [null],
      ETA: [null],
      ETD: [null],
      POO: [""],
      POL: [null, [Validators.required]],
      POD: [null, [Validators.required]],
      POLTerminal: [''],
      PODTerminal: [''],
      // FPD: [{ value: null, disabled: true }],
      FPD:[''],
      MovementType: [null],
      DoValid: [{ value: '', disabled: true }],
      FreightTerms : [null],
      JobType: ['Agent'],
      Coload: [false],
      ShipmentType: [false],
      HouseStatus:['Job Generated', Validators.required],
      HBLCount: [{value : 0, disabled: true}],
      IncoTerms: [null, [Validators.required]],
      InternalNote: [''],
      GeneralNote: [''],
      NominatedBy: ['Self'],
      ShipmentNo: [null]
    })
    this.houseJobForm.valueChanges.subscribe(()=>{
      this.syncFormValueWithRateComponent();
      if (this.houseJobForm.dirty) {
        this.formSaved = false;
      }
    })
  }

   onETDDateSelect(): void {
    const etaControl = this.houseJobForm.get('ETA');
    if (etaControl?.value) {
      etaControl.setValue(null);
    }
  }

  // Cargo Form Initiation
  initCargoForm() {
    this.cargoForm = this.fb.group({
      HouseJobCargoSid: [null],
      CargoType: ['General',Validators.required],
      ContainerType: [null],
      NoofContainers: [''],
      GrossWeight: ['',Validators.required],
      NetWeight: [''],
      Volume: [''],
      Volumetric: [''],
      ChargeableWeight: [''],
      NoOfPackage: [''],
      ShipmentTerms: [null],
      MovementType: [null],
      FreightTerms: [null],
      CommodityDescription:[],
      MarksAndNumber:[],
      LandedMarksandNumber:[],
      ModeOfTransport : [null],
      StuffingAt: ['Dock']
    });
      // Setup subscriptions for cargo form calculations
      if(!this.isEditMode){
        this.setupCargoCalculationSubscriptions();
      }
  
  this.cargoForm.valueChanges.subscribe(() => {
    this.syncFormValueWithRateComponent();
    if (this.cargoForm.dirty) {
      this.formSaved = false;
    }
  });
}

// NEW METHOD: Setup cargo calculation subscriptions
private setupCargoCalculationSubscriptions(): void {
    this.cargoForm.get('GrossWeight')?.valueChanges.subscribe(() => {
      if (!this.isPatching) {
      this.setOrResetWeightError(this.cargoForm);
      this.calculateChargeableWeight();
      }
    });
    this.cargoForm.get('NetWeight')?.valueChanges.subscribe(() => {
       if (!this.isPatching) {
      this.setOrResetWeightError(this.cargoForm);
       }
    });
    this.cargoForm.get('Volume')?.valueChanges.subscribe(() => {
       if (!this.isPatching) {
    this.calculateChargeableWeight();
       }
  });
    this.cargoForm.get('Volumetric')?.valueChanges.subscribe(() => {
        if (!this.isPatching) {
    this.calculateChargeableWeight();
         } // Add this
  });
    this.cargoForm.valueChanges.subscribe(() => {
      this.syncFormValueWithRateComponent();
      if (this.cargoForm.dirty) {
        this.formSaved = false;
      }
    })
  }

  get isSuspended() : boolean {
    return this.housejobData?.status === 'S';
  }

 private calculateChargeableWeight(): void {
  // Skip if patching or manual override
  if (this.isPatching || this.chargeableWeightManualOverride) {
    return;
  }

  const grossWeight = Number(this.c['GrossWeight']?.value) || 0;
  const volume = Number(this.c['Volume']?.value) || 0;
  const volumetric = Number(this.c['Volumetric']?.value) || 0;

  let chargeableWeight = 0;

  if (this.selectedFCLLCL === 'AIR') {
    // AIR: max(actual gross kg, volumetric kg)
    chargeableWeight = Math.max(grossWeight, volumetric);
  } else if (this.selectedFCLLCL === 'LCL') {
    // LCL W/M: max(CBM, gross weight in metric tons)
    const grossWeightInTon = grossWeight / 1000;
    chargeableWeight = Math.max(volume, grossWeightInTon);
  } else {
    // Existing behavior for non-AIR/LCL segments
    chargeableWeight = Math.max(volume, grossWeight);
  }

  this.c['ChargeableWeight']?.setValue(
    Number(chargeableWeight.toFixed(this.decimalAfterPrecision)),
    { emitEvent: false }
  );
}
toggleInputType(mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
  event.stopPropagation();
  const value = this.b[flagCtrl]?.value;
  this.b[flagCtrl]?.setValue(!value);
  this.houseJobForm.get(mainCtrl)?.reset();
}
toggleDateInputType(field: 'ETD' | 'ETA'): void {
  if (field === 'ETD') {
    this.isETDFreeText = !this.isETDFreeText;
    if (this.isETDFreeText) {
      this.houseJobForm.get('ETD')?.enable();
    } else {
      this.houseJobForm.get('ETD')?.disable();
    }
  } else if (field === 'ETA') {
    this.isETAFreeText = !this.isETAFreeText;
    if (this.isETAFreeText) {
      this.houseJobForm.get('ETA')?.enable();
    } else {
      this.houseJobForm.get('ETA')?.disable();
    }
  }
}

evaluateDropdownOrFreeText() {
  let response = this.bookingData;
  if (response?.ShipperName && !this.existsInList(this.shipperList, response.ShipperName)) {
    this.houseJobForm.patchValue({ isShipperFreeText: true });
  }
  if (response?.ConsigneeName && !this.existsInList(this.consigneeList, response.ConsigneeName)) {
    this.houseJobForm.patchValue({ isConsigneeFreeText: true });
  }
  if (response?.Notify && !this.existsInList(this.notifyList, response.Notify)) {
    this.houseJobForm.patchValue({ isNotifyFreeText: true });
  }
  if (response?.CarrierName && !this.existsInList(this.carrierList, response.CarrierName)) {
    this.houseJobForm.patchValue({ isCarrierFreeText: true });
  }
  if (response?.VesselName && !this.existsInList(this.vesselList, response.VesselName)) {
    this.houseJobForm.patchValue({ isVesselFreeText: true });
  }
  if (response?.VoyageNo && !this.existsInList(this.voyageList, response.VoyageNo)) {
    this.houseJobForm.patchValue({ isVoyageFreeText: true });
  }
  
  // Check for manual date entries
  if (response?.ETD && this.isEditMode) {
    this.isETDFreeText = true;
    this.houseJobForm.get('ETD')?.enable();
  }
  if (response?.ETA && this.isEditMode) {
    this.isETAFreeText = true;
    this.houseJobForm.get('ETA')?.enable();
  }
}
existsInList(list: any[], value: any) {
  if (list) {
    return list.some(item => item.CustomerName === value);
  }
  return false;
}

  onIncoChange(selectedInco: any): void {
    if (!selectedInco) {
    return; // Do nothing if incoterm is cleared
  }
  // Find the selected incoterm object
  let selectedIncoTerm;
  if (typeof selectedInco === 'object' && selectedInco.IncoName) {
    selectedIncoTerm = this.incoList.find(inco => inco.IncoName === selectedInco.IncoName);
  } else if (typeof selectedInco === 'string') {
    selectedIncoTerm = this.incoList.find(inco => inco.IncoName === selectedInco);
  }
  if (this.selectedDepartmentType === "AIR") {
    if (selectedIncoTerm && selectedIncoTerm.OceanFreight) {
      const freightValue = selectedIncoTerm.OceanFreight;
      
      // Only update FreightTerms if it's not "Collect" (keep as Prepaid for AIR)
      if (freightValue !== 'Collect') {
        this.houseJobForm.patchValue({
          FreightTerms: freightValue
        }, { emitEvent: false });
      }
      // If it's Collect, don't change from Prepaid (default for AIR)
    
    }
  } else {
    // For non-AIR departments, use the original logic
    if (selectedIncoTerm && selectedIncoTerm.OceanFreight) {
      const freightValue = selectedIncoTerm.OceanFreight;
      this.houseJobForm.patchValue({
        FreightTerms: freightValue
      }, { emitEvent: false });
     
    }
  }
}
validateGrossNetWeight(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const grossWeight = formGroup.get('GrossWeight')?.value;
    const netWeight = formGroup.get('NetWeight')?.value;
    
    if (grossWeight && netWeight && parseFloat(grossWeight) < parseFloat(netWeight)) {
      return { grossLessThanNet: true };
    }
    return null;
  };
}

shouldCalculateVolume(): boolean {
    return this.selectedFCLLCL === 'LCL' || this.selectedFCLLCL === 'AIR';
}

  // Product Form Initialization
  initProductForm() {
    const isAirOrLCL = this.selectedFCLLCL === 'AIR' || this.selectedFCLLCL === 'LCL';
    this.productForm = this.fb.group({
      HouseJobProductSid: [null],
      HouseJobCargoSid: [this.cargoForm?.get('HouseJobCargoSid')?.value || null],
      ProductName: [null,[Validators.required]],
      isProductFreeText: [false],
      ShippingBillNo: [''],
      ShippingBillDate: [null],
      ExternaPkg: [null,[Validators.required]],
      ExternlQty: ['', [Validators.required]],
      GrossWeight: ['', [Validators.required]],
      NetWeight: ['', [Validators.min(0)]],
      Volume: ['',[Validators.required,Validators.min(0.001)]],
      Volumetric: ['',isAirOrLCL ? [Validators.required] : []],
      IsHaz: [false],
      ImcoClass: [null],
      UnNo: [''],
      PkgGroup: [''],
      Length: [''],
      Width: [''],
      Height: [''],
      HSCode: [''],
      UomMasterSid: [2,isAirOrLCL ? [Validators.required] : []],
      CargoRecDate : [null],
      ReceivedQty:[''],
      DamageQty:[''],
      DamageRemarks: [''],
      MasterJobContainerSid: [null], 
      ContainerNo: ['', { disabled: true }], 
      MarksAndNumbers : [''],
      DeliveredQty: [null],
      DeliveryDate: [null]
    });
    this.productForm.get('GrossWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(this.productForm);
    });
    this.productForm.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(this.productForm);
    });
      this.productForm.get('MasterJobContainerSid')?.valueChanges.subscribe((containerSid) => {
    this.onContainerSelectionChange(containerSid);
  });
    this.setupImmediateCBMCalculation();
    this.setupImmediateVolumetricCalculation(this.productForm)
  }
  onContainerSelectionChange(containerSid: number | null): void {
  if (!containerSid) {
    this.productForm.get('ContainerNo')?.setValue('');
    return;
  }
  
  const selectedContainer = this.masterJobContainers.find(
    container => container.MasterJobContainerSid === containerSid
  );
  
  if (selectedContainer) {
    this.productForm.get('ContainerNo')?.setValue(selectedContainer.ContainerNumber);
  } else {
    this.productForm.get('ContainerNo')?.setValue('');
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

getUomName(uomId: number): string {
  const uom = this.measurementUnitList.find(item => item.id === uomId);
  return uom ? uom.name : '-';
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

private parseFloatSafe(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
loadHSSACLookups() {
  this.operationService.getAllHssac().subscribe({
    next: (resp: any) => {
      this.hssacList = resp|| [];
    
    },
    error: (err) => {
      console.error('Error loading HSSAC data:', err);
      this.hssacList = [];
    }
  });
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
      HouseJobOthersSid: [null],
      CustomerRefNo: [''],
      YardCFS: [''],
      ReleaseType: ['Original'],
      DeclaredValueOfCarriage: [null],
      DeclaredValueOfCustoms:[null],
      HBLNo: [{value :'', disabled: true}],
      Forwarder: [null],
      ForwarderAddress: [''],
      NotifyParty: [null],
      NotifyPartyAddress: [''],
      Notify2 : [null],
      NotifyAddress2 : [''],
      Coloader : [null],
      PickupPlace: [''],
      DeliveryPlace: [''],
      DeliveryDate: [null],
      CHAName: [''],
      PickupAddress: [''],
      DeliveryAddress: [''],
      CargoCurrency: [null],
      CargoValue: [''],
      ValueForInsurance: [''],
      InsuranceAmount: [''],
      ValuationCharge: [''],
      HandlingInformation: [''],
      SwitchBL: [false],
      BacktoBack: [false],
      Depo: [''],
      ROValidity: [''],
      BlClause:[[]],
      SwitchBLAgent: [null],
      AgentAddress: [''],
      SwitchBLShipper: [null],
      SwitchBLConsignee: [null],
      SwitchLocation: [''],
      CarrierBookingRef : [''],
      CarrierBookingDate : [''],
      DONo : [''],
      DODate : [''],
      SIConfirmationDate : [''],
      DGConfirmationDate : [''],
    })
    this.otherForm.valueChanges.subscribe(() => {
      if (this.otherForm.dirty) {
        this.formSaved = false;
      }
    });
  }

  initDetailsForm() {
    this.detailForm = this.fb.group({
      bookingProducts: this.fb.array([]),
    })
    this.detailForm.valueChanges.subscribe(() => {
      if (this.detailForm.dirty) {
        this.formSaved = false;
      }
    });
  }

  /**
   *  Get form Control
  */

  get b(): { [key: string]: AbstractControl<any, any> } {
    return this.houseJobForm.controls || {}
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

  createBookingProductGroup(data?: any, isPatching: boolean = false): FormGroup {
    const isAirOrLCL = this.selectedFCLLCL === 'AIR' || this.selectedFCLLCL === 'LCL';
    const productForm = this.fb.group({
      HouseJobProductSid: [data?.HouseJobProductSid || null],
      HouseJobCargoSid: [data?.HouseJobCargoSid || this.cargoForm?.get('HouseJobCargoSid')?.value || null],
      ProductName: [data?.ProductName || null,[Validators.required]],
      isProductFreeText: [data?.isProductFreeText || false],
      ShippingBillNo: [data?.ShippingBillNo || ''],
      ShippingBillDate: [data?.ShippingBillDate ? new Date(data?.ShippingBillDate) : null],
      ExternaPkg: [data?.ExternaPkg || null, [Validators.required]],
      ExternlQty: [data?.ExternlQty || '', [Validators.required]],
      GrossWeight: [Number(data?.GrossWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required,Validators.min(0.001)]],
      NetWeight: [Number(data?.NetWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.min(0)]],
      Volume: [Number(data?.Volume || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required,Validators.min(0.001)]],
      Volumetric: [data?.Volumetric|| '',isAirOrLCL ? [Validators.required, Validators.min(0.001)] : []],
      IsHaz : [data?.IsHaz ? (data.IsHaz === "Y" ? true : false) : false],
      ImcoClass : [data?.ImcoClass || null],
      UnNo : [data?.UnNo || ''],
      PkgGroup : [data?.PkgGroup || ''],
      Length: [data?.Length || ''],
      Width: [data?.Width || ''],
      Height: [data?.Height || ''],
      HSCode : [data?.HSCode || ''],
      UomMasterSid: [data?.UomMasterSid || 2,isAirOrLCL ? [Validators.required] : []],
      CargoRecDate : [data?.CargoRecDate ? new Date(data?.CargoRecDate) : null],
      ReceivedQty: [data?.ReceivedQty || ''],
      DamageQty: [data?.DamageQty || ''],
      DamageRemarks: [data?.DamageRemarks || ''],
      MasterJobContainerSid: [data?.MasterJobContainerSid || null],
      ContainerNo :[{value: data?.ContainerNo || '', disabled: false}],
      MarksAndNumbers : [data?.MarksAndNumbers || ''],
      DeliveryDate: [data?.DeliveryDate ? new Date(data?.DeliveryDate) : null],
      DeliveredQty: [data?.DeliveredQty || null]

    });
    productForm.get('GrossWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(productForm);
    });
    productForm.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(productForm);
    });
     productForm.get('MasterJobContainerSid')?.valueChanges.subscribe((containerSid) => {
    this.onFormArrayContainerChange(containerSid, productForm);
  });
    this.setupProductCalculationSubscriptions(productForm);
  
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
     
      ['ExternlQty', 'NetWeight', 'Volume'].forEach(field => {
        productForm.get(field)?.disable();
      })
    }
     
   if (isPatching && data?.CargoRecDate) {
  ['ExternlQty',  'NetWeight', 'Volume'].forEach(field => {
    productForm.get(field)?.disable();
  });
}
  

    return productForm;
  }
  private setupProductCalculationSubscriptions(productForm: FormGroup): void {
  // Setup immediate CBM calculation
  const dimensionFields = ['ExternlQty', 'Length', 'Width', 'Height', 'UomMasterSid'];
  
  dimensionFields.forEach(field => {
    productForm.get(field)?.valueChanges.subscribe(() => {
      // Skip calculation only if component is in patching mode
      if (this.isPatching) {
        return;
      }
      this.calculateProductFormCBMAndVolumetric(productForm);
    });
  });
  
  // Setup volumetric calculation for LCL/AIR
  const isLCLorAIR = this.selectedFCLLCL === 'LCL' || this.selectedFCLLCL === 'AIR';
  if (isLCLorAIR) {
    this.setupImmediateVolumetricCalculationForFormArray(productForm);
  }
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
onFormArrayContainerChange(containerSid: number | null, productForm: FormGroup): void {
  if (!containerSid) {
    productForm.get('ContainerNo')?.setValue('');
    return;
  }
  
  const selectedContainer = this.masterJobContainers.find(
    container => container.MasterJobContainerSid === containerSid
  );
  
  if (selectedContainer) {
    productForm.get('ContainerNo')?.setValue(selectedContainer.ContainerNumber);
  } else {
    productForm.get('ContainerNo')?.setValue('');
  }
}
private calculateProductFormCBMAndVolumetric(productForm: FormGroup) {
    if (this.isPatching) {
    return;
  }
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
     if (this.isPatching) {
      return;
    }
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

addProduct() {
    const formGroup = this.createBookingProductGroup();
    formGroup.get('UomMasterSid')?.setValue(2, { emitEvent: true });
    this.bookingProducts.push(formGroup);
  }

  createBookingConnectionGroup(data?: any): FormGroup {
    const connectionForm = this.fb.group({
      HouseJobConnectionSid: [data?.HouseJobConnectionSid || null],
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
    departments: this.operationService.getAllDepartments(CompanyMasterSid).pipe(
      map(response => {
        // Filter departments to show only "Air" type
        if (response && response.data) {
          response.data = response.data.filter(dept => 
            dept.departmentType?.toUpperCase() === 'AIR'
          );
        }
        return response;
      }),
      catchError(err => of({ data: [] }))
    ),
    customers: this.operationService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(err => of([]))),
    ports: this.operationService.getAllPorts().pipe(catchError(err => of({ data: [] }))),
    mawbStockAllocationConfig: this.masterService.getConfigurationValue(CompanyMasterSid, 'MawbStockAllocation').pipe(catchError(() => of(null))),
    
  }).pipe(tap(({ 
      departments, customers, ports, mawbStockAllocationConfig }) => {
    if (!this.isEditMode) {
      this.spinner.hide();
    }
    this.departmentList = departments.data || [];
    this.customerList = customers;
    this.portList = (ports.data || []).map(p => ({ ...p, Country: p.countryMaster?.countryName }));
    if (this.selectedDepartmentType) {
      this.refreshPortFilters();
    }
    this.isMawbStockAllocationEnabled = this.parseCompanyBoolean(mawbStockAllocationConfig);
    this.updateCarrierValidation(this.selectedDepartment);
  }));
}

private parseCompanyBoolean(value: any): boolean {
  if (value === true || value === false) {
    return value;
  }

  const normalized = String(value ?? '').trim().toUpperCase();
  return ['Y', 'YES', 'TRUE', '1'].includes(normalized);
}

private updateCarrierValidation(department?: any): void {
  const carrierControl = this.houseJobForm.get('CarrierName');
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

private enableManualMawbEntryFallback(message?: string): void {
  this.allowManualMawbEntryOnAutoAllocationError = true;
  this.houseJobForm.get('MBLNo')?.enable();
  this.houseJobForm.get('MBLNo')?.setValidators([Validators.required, Validators.maxLength(50)]);
  this.houseJobForm.get('MBLNo')?.updateValueAndValidity();
  this.b['isMawbFreeText']?.setValue(true);
  this.isMawbDropdownDisabled = true;
  this.appSettingService.showWarning(
    message || 'No allocated/customer/common/carrier MAWB stock found. Enter MAWB manually.'
  );
}

loadHeaderLookups() {
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  return forkJoin({
    shippers: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['shipper'] }).pipe(catchError(err => of([]))),
    consignees: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['consignee'] }).pipe(catchError(err => of([]))),
    notify: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['notify'] }).pipe(catchError(err => of([]))),
    agents: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['agent'] }).pipe(catchError(err => of([]))),
    carriers: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['carrier'] }).pipe(catchError(err => of([]))),
    airline: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['airLine'] }).pipe(catchError(err => of([]))),
    vessels: this.operationService.getAllVessels().pipe(catchError(err => of([]))),
    incos: this.operationService.getAllINCO().pipe(catchError(err => of([]))),
    salesmans: this.operationService.getAllSalesman(CompanyMasterSid).pipe(catchError(err => of([]))),
    forwarder: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['forwarder'] }).pipe(catchError(err => of([]))),
    yard: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['yard'] }).pipe(catchError(err => of([]))),
    cfs: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['cFS'] }).pipe(catchError(err => of([]))),
  }).pipe(tap(({ shippers, consignees, notify, carriers, airline, vessels, incos, salesmans, agents, forwarder, yard, cfs, }) => {
    this.shipperList = shippers.data;
    this.filteredShipperList = shippers.data;
    this.consigneeList = consignees.data;
    this.filteredConsigneeList = consignees.data;
    this.notifyList = notify.data;
    this.carrierList = carriers.data;
    this.vesselList = vessels.data;
    this.airlineList = airline.data;
    this.incoList = incos.data;
    this.salesmanList = salesmans;
    this.agentList = agents.data;
    this.yardlist = yard.data;
    this.cfslist = cfs.data;
    this.deliveryAgentList = [...this.agentList];
    this.originAgentList = [...this.agentList];
    this.forwarderList = forwarder.data;
  }));
}


  // loadHeaderLookups() {
  //   return forkJoin({
  //     allMasters: this.operationService.getBookingHeaderLookups(this.filterOption).pipe(catchError(err => of( {departments: [],vessels: [], ports: [], incos: [] , country : Object }))),
  //     customerMaster: this.operationService.getAllCustomerRelatedLookups(this.filterOption).pipe(catchError(err => of({ customers: [], salesmans: [], shippers: [], consignees: [], agents: [], carriers: [], forwarder: [], notify: [] }))),
  //   }).pipe(tap(({ allMasters, customerMaster}) => {
  //     this.departmentList = allMasters.departments;
  //     this.customerList = customerMaster.customers;
  //     this.salesmanList = customerMaster.salesmans;
  //     this.shipperList = customerMaster.shippers;
  //     this.filteredShipperList = customerMaster.shippers;
  //     this.consigneeList = customerMaster.consignees;
  //     this.filteredConsigneeList = customerMaster.consignees;
  //     this.agentList = customerMaster.agents;
  //     this.deliveryAgentList = [...this.agentList];
  //     this.originAgentList = [...this.agentList];
  //     this.carrierList = customerMaster.carriers;
  //     this.forwarderList = customerMaster.forwarder;
  //     this.notifyList = customerMaster.notify;
  //     this.vesselList = allMasters.vessels;
  //     this.portList = allMasters.ports;
  //     this.incoList = allMasters.incos;
  //     this.countryOfCompany = (allMasters?.country?.countryMaster?.countryName).trim().toLowerCase();
  //   }))
  // }

  loadCargoLookups() {
    forkJoin({
      containerTypes: this.operationService.getAllContainerTypes().pipe(catchError(err => of({ data: [] }))),
    }).subscribe(({ containerTypes }) => {
      this.containerTypeList = containerTypes.data;
    })
  }

  // Add this method to your component
loadDefaultBLClauses(DepartmentMasterSid: number): void {
  if (!DepartmentMasterSid) {
    this.blClauseOptions = [];
    this.o['BlClause']?.setValue('');
    return;
  }
  
 
  
  this.operationService.getDefaultBLClausesByDepartment(DepartmentMasterSid).subscribe({
    next: (response: any) => {
     
      
      // Check if response is valid and has data array
      if (response && response.status && Array.isArray(response.data)) {
        // Map the response to the format needed for your dropdown
        this.blClauseOptions = response.data.map((clause: any) => ({
          ClauseDescription: clause.ClauseDescription,
          displayText: clause.ClauseDescription
        }));
        
      
        
        // If this is a new house job (not edit mode), auto-populate the BlClause field
        if (!this.isEditMode && this.blClauseOptions.length > 0) {
          // Combine all clause descriptions into a single text
          const allClausesText = this.blClauseOptions
            .map(clause => clause.ClauseDescription)
          
          // Set the value in the form
          this.otherForm.patchValue({
            BlClause: allClausesText
          });
          
          
        } else if (this.blClauseOptions.length === 0) {
         
          // Clear the field if no clauses found
          this.otherForm.patchValue({
            BlClause: ''
          });
        }
      } else {
        this.blClauseOptions = [];
       
        // Clear the field
        this.otherForm.patchValue({
          BlClause: ''
        });
      }
    },
    error: (error) => {
      console.error('Error loading default BL clauses:', error);
      this.blClauseOptions = [];
      this.otherForm.patchValue({
        BlClause: ''
      });
      
      // Show appropriate error message
      if (error.status === 404) {
        this.appSettingService.showWarning('BL Clauses API endpoint not found');
      } else if (error.status === 400) {
        this.appSettingService.showWarning('Invalid department ID');
      } else {
        this.appSettingService.showWarning('Unable to load default BL clauses. Please try again.');
      }
    }
  });
}

  loadOtherLookups() {
    forkJoin({
      currencies: this.operationService.getAllCurrencies().pipe(catchError(err => of({ data: [] }))),
      charges : this.operationService.getAllCharges(this.currentCompany?.CompanyMasterSid).pipe(catchError(err=> of({ data : []})))
    }).subscribe(({ currencies,charges }) => {
      const rawCurrencies: any[] = Array.isArray(currencies)
        ? currencies
        : currencies?.data || [];
      this.currencyList = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
      this.chargeList = charges || [];
    })
  }

  loadProductLookups() {
    forkJoin({
      allMasters: this.operationService.getAllBookingProductLookups(this.filterOption).pipe(catchError(err => of( { products: [], packageTypes: [], imcos: [], uoms: [] }))),
    }).subscribe(({ allMasters }) => {
      this.productList = allMasters.products;
      this.packageTypeList = allMasters.packageTypes;
      this.imcoList = allMasters.imcos;
      this.uomList = allMasters.uoms;
      this.productLookupsLoaded = true;
    })
  }


  loadHouseById(HouseJobSid: number) {
  // Use the new API to fetch Agent Master Air Waybill by ID
  this.getAgentMasterAirWaybillById(HouseJobSid).subscribe(
    (resp: any) => {
      if (resp.status) {
        // The response structure might be different - adjust based on your API response
        const data = resp.data;
        
        // If the API returns masterJob and houseJob separately, combine them
        if (data.masterJob && data.houseJob) {
          // Combine master job and house job data
          this.bookingData = { ...data.masterJob, ...data.houseJob };
          
          // Add related data
          if (data.houseJob) {
            this.bookingData.Products = data.houseJob.Products || [];
            this.bookingData.Cargo = data.houseJob.Cargo || [];
            this.bookingData.Others = data.houseJob.Others || [];
            this.bookingData.Connections = data.houseJob.Connections || [];
            this.bookingData.costRevenueCharges = data.houseJob.costRevenueCharges || [];
          }
        } else {
          // Direct response
          this.bookingData = data;
        }
        
        this.patchValues(this.bookingData);
        this.loadAllMasterJobContainers();
        this.housejobData = this.bookingData;
        this.masterJobData = this.buildMawbReportData();
        this.loadMasterJobARAPData();
        
        this.minDate = undefined;
        const HBLDate = this.housejobData?.HBLDate ? new Date(this.housejobData?.HBLDate) : undefined;
        this.minDODate = HBLDate ? this.toNgbDateStruct(HBLDate) : undefined;
        this.minSIConfirmationDate = HBLDate ? this.toNgbDateStruct(HBLDate) : undefined;
        this.minDGConfirmationDate = HBLDate ? this.toNgbDateStruct(HBLDate) : undefined;
        this.setMinMaxDateConditions();
        
        // Update the formData for child components
        this.commonFormValue = {
          HouseJobSid: resp.data.HouseJobSid || HouseJobSid,
          CompanyMasterSid: resp.data.CompanyMasterSid,
          BranchMasterSid: resp.data.BranchMasterSid,
          CreatedBy: this.userData['userEmail'],
          UpdatedBy: this.userData['userEmail']
        };

        // Extract BOE records for the current house job
        this.boeDataArray = resp.data.houseJobBOE || [];
        this.vehicleDataArray = resp.data.houseJobVehicle || [];
        this.customsDataArray = resp.data.houseJobCustoms || [];

        // Trigger reload for child components like BOE
        this.resetTriggerBOE = true;
        this.resetDirtyState();
      }
    },
    (error) => {
      console.error('Error loading Agent Master Air Waybill:', error);
      this.appSettingService.showError('Failed to load Agent Master Air Waybill data.');
    }
  );
}
private loadMasterJobDetails(masterJobSid: number): void {
  const payload = {
    screenName : 'Agent Master Air Waybill',
    masterJobSid : masterJobSid
  }
  this.operationService.getMasterJobById(masterJobSid).subscribe({
    next: (response: any) => {
      if (response.status && response.data) {
        const masterJobData = response.data;
        // Patch the Master Job Number to the form
        this.houseJobForm.patchValue({
          MasterJobNumber: masterJobData.MasterJobNumber
        });
      
      }
    },
    error: (error) => {
      console.error('Error loading master job details:', error);
    }
  });
}
  patchValues(response: any) {
  this.isPatching = true;
  
  try {
    this.bookingHeader = response;
    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    const shouldDisableForms = (this.isEditMode && response.status !== 'A');
    this.selectedDepartment = selectedDepartment;
    this.selectedDepartmentType = selectedDepartment?.departmentType?.toUpperCase() || '';
    this.filterTabs();
    this.onDeptChange(selectedDepartment);

    const selectedCustomer = this.customerList.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
    
    // FIX: Better agent matching
    let delivery = null;
    if (response.AgentName) {
      delivery = this.agentList.find(agent => agent.CustomerName === response.AgentName);
      
      if (!delivery) {
        delivery = this.agentList.find(agent => 
          agent.CustomerName.toLowerCase() === response.AgentName.toLowerCase()
        );
      }
      
      if (!delivery) {
        delivery = this.agentList.find(agent => 
          agent.CustomerName.toLowerCase().includes(response.AgentName.toLowerCase()) ||
          response.AgentName.toLowerCase().includes(agent.CustomerName.toLowerCase())
        );
      }
    }
    
    const origin = this.agentList.find(agent => agent.CustomerMasterSid === response.CustomerName);
    this.onDeptChange(selectedDepartment);
    this.onCustomerChange(selectedCustomer);
    this.handleDestAgentChange(delivery);
    this.handleOriginAgentChange(origin);
    
    let vesselName = response.VesselName;
    let voyageNo = response.VoyageNo;
    let eta = response.ETA;
    let etd = response.ETD;
    
    if ((!vesselName || !voyageNo) && response.masterJob?.voyages?.[0]) {
      const masterVoyage = response.masterJob.voyages[0];
      vesselName = vesselName || masterVoyage.VesselName;
      voyageNo = voyageNo || masterVoyage.VoyageNo;
      eta = eta || masterVoyage.ETA;
      etd = etd || masterVoyage.ETD;
    }
    
    this.houseJobForm.patchValue({
      MasterJobSid: response.MasterJobSid,
      BookingHeaderSid: response.BookingHeaderSid, 
      MasterJobNumber: response.masterJob?.MasterJobNumber || response.MasterJobNumber || '',
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
      DestinationAgent: response.DestinationAgent || null,
      AgentName: response.AgentName || null, 
      AgentAddress: response.AgentAddress,
      CarrierSid: response.CarrierSid,
      CarrierName: response.CarrierName,
      QuotationHeaderSid: response.QuotationHeaderSid,
      HBLNo: response.HBLNo,
      MBLNo: response.MBLNo,
      MBLDate: response.MBLDate ? new Date(response.MBLDate) : '',
      status: response.status === "A" ? "Active" : "Suspended",
      HouseStatus: response.HouseStatus,
      HBLCount: response.HBLCount,
      VesselName: vesselName,
      VoyageMasterSid: response.VoyageMasterSid,
      VoyageNo: voyageNo,
      HBLDate: response.HBLDate ? new Date(response.HBLDate) : null,
      ETA: eta ? new Date(eta) : null,
      ETD: etd ? new Date(etd) : null,
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
      JobType: response.JobType,
      ShipmentNo: response.ShipmentNo
    }, { emitEvent: false }); // IMPORTANT: Add emitEvent: false
     setTimeout(() => {
      this.loadMawbStock(response);
    }, 500);
    this.PODandFPODsame = response.POD === response.FPD;
    const cargoData = response.Cargo?.[0];
    
    if (cargoData) {
      let volumetricValue = cargoData.Volumetric;
      
      // If Volumetric is not in cargoData, calculate it from products
      if (!volumetricValue && response.Products && response.Products.length > 0) {
        volumetricValue = response.Products.reduce((sum, product) => {
          return sum + (Number(product.Volumetric) || 0);
        }, 0);
      }
      this.cargoForm.patchValue({
        HouseJobCargoSid: cargoData.HouseJobCargoSid,
        CargoType: cargoData.CargoType || 'General',
        ContainerType: cargoData.ContainerType,
        NoofContainers: cargoData.NoofContainers || 0,
        GrossWeight: cargoData.GrossWeight || 0,
        NetWeight: cargoData.NetWeight || 0,
        Volume: cargoData.Volume || 0,
        Volumetric: volumetricValue || 0,
        ChargeableWeight: cargoData.ChargeableWeight || 0,
        NoOfPackage: cargoData.NoOfPackage || 0,
        ShipmentTerms: cargoData.ShipmentTerms,
        MovementType: cargoData.MovementType,
        FreightTerms: cargoData.FreightTerms,
        CommodityDescription: cargoData.CommodityDescription,
        MarksAndNumber: cargoData.MarksAndNumber,
        LandedMarksandNumber: cargoData.LandedMarksandNumber,
        ModeOfTransport: cargoData.ModeOfTransport,
        StuffingAt: cargoData.StuffingAt || 'Dock'
      }, { emitEvent: false }); // IMPORTANT: Add emitEvent: false
    }
    
    this.evaluateDropdownOrFreeText();
    
    this.handleCFSOrYard();
    const otherData = response.Others[0];
    
    if (otherData) {
      this.otherForm.patchValue({
        HouseJobOthersSid: otherData?.HouseJobOthersSid,
        CustomerRefNo: otherData?.CustomerRefNo,
        YardCFS: otherData?.YardCFS,
        ReleaseType: otherData?.ReleaseType || null,
        DeclaredValueOfCarriage: otherData?.DeclaredValueOfCarriage || null,
        DeclaredValueOfCustoms: otherData?.DeclaredValueOfCustoms || null,
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
        BlClause: otherData?.BlClause,
        DeliveryAddress: otherData?.DeliveryAddress,
        CargoCurrency: otherData?.CargoCurrency,
        CargoValue: otherData?.CargoValue,
        ValueForInsurance: otherData?.ValueForInsurance,
        InsuranceAmount: otherData?.InsuranceAmount,
        ValuationCharge: otherData?.ValuationCharge,
        HandlingInformation: otherData?.HandlingInformation,
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
        CarrierBookingDate: otherData?.CarrierBookingDate ? new Date(otherData?.CarrierBookingDate) : null,
        DONo: otherData?.DONo || '',
        DODate: otherData?.DODate || '',
        SIConfirmationDate: otherData?.SIConfirmationDate ? new Date(otherData?.SIConfirmationDate) : null,
        DGConfirmationDate: otherData?.DGConfirmationDate ? new Date(otherData?.DGConfirmationDate) : null,
        InternalNote: otherData?.InternalNote || '',
        GeneralNote: otherData?.GeneralNote || ''
      }, { emitEvent: false }); // IMPORTANT: Add emitEvent: false
    }
    
    this.evaluateDropdownOrFreeText();

    this.bookingProducts.clear();
    const productsFromResponse = response.Products || [];
    this.productDataLength = productsFromResponse.length;
    
    if (this.productDataLength) {
      for (const productData of productsFromResponse) {
        const formWithData = this.createBookingProductGroup(productData, true);
        const productExists = this.productList?.some(
          p => p.ProductName?.trim().toLowerCase() === productData.ProductName?.trim().toLowerCase()
        );

        formWithData.get('isProductFreeText')?.setValue(!productExists);
        this.bookingProducts.push(formWithData);
      }
      this.updateProductPagination();
    }

    if (shouldDisableForms) {
      this.disableAllForms();
      if (this.isEditMode && response.status !== 'A') {
        this.houseJobForm.get('status')?.disable();
      }
    }

    this.bookingConnectionsArr = (response.Connections || []).map(connection => {
      return {
        ...connection,
        TransactionSid: connection.HouseJobConnectionSid,
      }
    });
    this.connectionResult = [...this.bookingConnectionsArr]

    this.bookingRateArr = (response.costRevenueCharges || []).map(br => ({
      ...br,
      RateSid: br.CostRevenueChargesSid,
      status: br.status === "A" ? "Active" : "Suspended"
    }));
    this.rateResult = [...this.bookingRateArr];
     if (
      this.isEditMode &&
      this.bookingRateArr?.some(rate =>
        rate.CostVoucherHeaderSid !== null || rate.RevenueVoucherHeaderSid !== null
      )
    ) {
      this.houseJobForm.get('status')?.disable();
    }
    this.syncFormValueWithRateComponent();
    this.calculateChargeWiseProfit();
    this.calculateCustomerWiseAmount();
    
    setTimeout(() => {
      const otherData = response.Others[0];
      if (otherData?.BlClause) {
        this.otherForm.patchValue({
          BlClause: otherData?.BlClause || null,
        });
      } else if (!this.isEditMode && this.blClauseOptions.length > 0) {
        const allClausesText = this.blClauseOptions
          .map(clause => clause.ClauseDescription)
          .join('\n\n');
        
        this.otherForm.patchValue({
          BlClause: allClausesText
        });
      }
      this.resetDirtyState();
    }, 500);

  } catch (error) {
    console.error('Error during patch:', error);
  } finally {
    // CRITICAL FIX: Reset isPatching flag AFTER a longer delay to ensure all patching completes
    setTimeout(() => {
      this.isPatching = false;
      console.log('✅ isPatching reset to false - calculations now enabled');
    }, 1000); // Increased from 100ms to 1000ms
  }
}

  onContainerTypeChange(containerType : any){
    if(!containerType){
      this.selectedContainerType = '';
      return;
    }
    this.selectedContainerType = containerType;
  }

  openProductModal(content: TemplateRef<any>, productIndex?: number, data?: any) {
    this.initProductForm();
    if (data) {
      this.productForm.patchValue({
        HouseJobProductSid: data?.HouseJobProductSid,
        ProductName: data?.ProductName,
        ShippingBillNo: data?.ShippingBillNo,
        ShippingBillDate: data?.ShippingBillDate,
        ExternaPkg: data?.ExternaPkg,
        ExternlQty: data?.ExternlQty,
        GrossWeight: data?.GrossWeight,
        NetWeight: data?.NetWeight,
        Volume: data?.Volume,
        Volumetric: data?.Volumetric,
        IsHaz: data?.IsHaz,
        ImcoClass: data?.ImcoClass,
        UnNo: data?.UnNo,
        PkgGroup: data?.PkgGroup,
        Length: data?.Length,
        Width: data?.Width,
        Height: data?.Height,
        HSCode: data?.HSCode,
        UomMasterSid: data?.UomMasterSid,
        CargoRecDate : data?.CargoRecDate,
        ReceivedQty: data?.ReceivedQty,
        DamageQty: data?.DamageQty,
        DamageRemarks: data?.DamageRemarks,
        ContainerNo : data?.ContainerNo,
        MasterJobContainerSid: data?.MasterJobContainerSid,
        MarksAndNumbers : data?.MarksAndNumbers,
        DeliveryDate: data?.DeliveryDate,
        DeliveredQty: data?.DeliveredQty,
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

  loadAllMasterJobContainers(){
    const MasterJobSid = this.houseJobForm.get('MasterJobSid')?.value;
    if(!MasterJobSid) return;
    this.operationService.getAllMasterJobContainers(MasterJobSid).subscribe((resp: any) => {
      if (resp.status) {
        this.masterJobContainers = resp.data;
      } else {
        this.appSettingService.showError("Error loading containers");
      }
    })
  }

  onProductSubmit() {
    const grossWeight = this.productForm.get('GrossWeight')?.value;
  const netWeight = this.productForm.get('NetWeight')?.value;
  this.setOrResetWeightError(this.productForm);
  
  if (grossWeight && netWeight && parseFloat(grossWeight) < parseFloat(netWeight)) {
    this.appSettingService.showWarning('Net Weight cannot be greater than Gross Weight');
    return;
  }

    if (!grossWeight || parseFloat(grossWeight) === 0) {
    this.appSettingService.showWarning('Gross Weight cannot be zero. Please enter a valid Gross Weight.');
    return;
  }
    if(this.productForm.invalid){
      this.productForm.markAllAsTouched();
      this.productForm.updateValueAndValidity();
      // Get all invalid fields for better error message
    const invalidFields = [];
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      if (control && control.invalid) {
        invalidFields.push(this.getFieldLabel(key));
      }
    });
    
    if (invalidFields.length > 0) {
      this.appSettingService.showWarning(`Please fill all required fields: ${invalidFields.join(', ')}`);
    } else {
      this.appSettingService.showWarning('Please fill all the required fields correctly.');
    }
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
    this.markAsDirty();
    this.modalService.dismissAll();
  }
  private getHouseJobInvalidFields(): string[] {
    const fieldLabels: { [key: string]: string } = {
      DepartmentMasterSid: 'Department',
      CustomerMasterSid: 'Customer',
      HBLDate: 'HAWBL Date',
      MBLNo: 'MAWBL No',
      MBLDate: 'MAWBL Date',
      POL: 'POL',
      POD: 'POD',
      status: 'Status',
      HouseStatus: 'House Status',
      IncoTerms: 'Inco Terms',
      CarrierName: 'Carrier'
    };

    return Object.keys(this.houseJobForm.controls)
      .filter((key) => this.houseJobForm.get(key)?.invalid)
      .map((key) => fieldLabels[key] || key);
  }

  private getProductValidationMessage(): string {
    const firstInvalidProduct = this.bookingProducts.controls.find((control) => control.invalid) as FormGroup | undefined;

    if (!firstInvalidProduct) {
      return 'Please fill all required product fields correctly.';
    }

    const invalidFields = Object.keys(firstInvalidProduct.controls)
      .filter((key) => firstInvalidProduct.get(key)?.invalid)
      .map((key) => this.getFieldLabel(key));

    return invalidFields.length
      ? `Please fill required product fields: ${invalidFields.join(', ')}`
      : 'Please fill all required product fields correctly.';
  }
  private getFieldLabel(fieldName: string): string {
  const fieldLabels: { [key: string]: string } = {
    'ProductName': 'Commodity',
    'ExternaPkg': 'External Pkg',
    'ExternlQty': 'No of Pkg',
    'GrossWeight': 'Gross Weight',
    'Volume': 'CBM',
    'UomMasterSid': 'UOM',
    'Volumetric': 'Volumetric'
  };
  return fieldLabels[fieldName] || fieldName;
}

  handleConnectionChange(allConnections:any[]){
    this.connectionResult = [...allConnections];
    this.markAsDirty();
  }

  handleRateChange(allRates:any[]){
    this.rateResult = [...allRates];
    this.markAsDirty();
  }

  handleMilestoneChange(allmilestones:any[]){
    this.milestoneResult = [...allmilestones];
    this.markAsDirty();
  }

onCurrencyChange(event: any) {
  
}


  onSubmit() {
    this.submitAgentMasterAirWaybill();
  }

  private submitAgentMasterAirWaybill(resolve?: (value: boolean) => void) {
  if (this.isSubmitting || this.isSaving || this.isLoading) {
    resolve?.(false);
    return;
  }

  if (this.isEditMode && !this.hasUnsavedChanges()) {
    this.appSettingService.showWarning('No changes to save');
    resolve?.(false);
    return;
  }
  
  if (!this.validateImportMAWBLNo()) {
    resolve?.(false);
    return;
  }
  
  const fy = this.appSettingService.getCurrentFinancialYear();
  if (fy) {
    const HBLDate = new Date(this.houseJobForm.getRawValue().HBLDate);
    const fyStartDate = new Date(fy.StartDate);
    const fyEndDate = new Date(fy.EndDate);
    if (HBLDate < fyStartDate || HBLDate > fyEndDate) {
      this.appSettingService.showWarning('HBL date must be within the financial year');
      this.houseJobForm.get('HBLDate')?.setErrors({ invalidDate: true });
      this.houseJobForm.get('HBLDate')?.markAsTouched();
      this.selectedTab = 'Shipment';
      resolve?.(false);
      return;
    }
  }

  const etdValue = this.houseJobForm.get('ETD')?.value;
  const etaValue = this.houseJobForm.get('ETA')?.value;
  if (etdValue && etaValue) {
    const etdDate = new Date(etdValue);
    const etaDate = new Date(etaValue);
    if (!isNaN(etdDate.getTime()) && !isNaN(etaDate.getTime()) && etaDate <= etdDate) {
      this.toastr.error('ETA date should be greater than ETD date');
      this.houseJobForm.get('ETA')?.setErrors({ etaLessThanOrEqualEtd: true });
      this.houseJobForm.get('ETA')?.markAsTouched();
      this.selectedTab = 'Shipment';
      resolve?.(false);
      return;
    }
  }

  if (this.houseJobForm.invalid) {
    this.houseJobForm.markAllAsTouched();
    this.houseJobForm.updateValueAndValidity();
    const invalidFields = this.getHouseJobInvalidFields();
    this.appSettingService.showWarning(
      invalidFields.length
        ? `Please fill required fields: ${invalidFields.join(', ')}`
        : 'Please fill all required fields correctly.'
    );
    this.selectedTab = 'Shipment';
    resolve?.(false);
    return;
  }
  
  if (this.bookingProducts.length > 0) {
    this.bookingProducts.controls.forEach(control => {
      this.setOrResetWeightError(control as FormGroup);
    });
    const hasInvalidProduct = this.bookingProducts.controls.some(control => control.invalid);
    
    if (hasInvalidProduct) {
      this.bookingProducts.markAllAsTouched();
      this.appSettingService.showWarning(this.getProductValidationMessage());
      this.selectedTab = 'Cargo';
      resolve?.(false);
      return;
    }
  }

  if (!this.costEntryComponent.validateRateArray()) {
    this.selectedTab = 'Rate';
    resolve?.(false);
    return;
  }
  
  const houseJobFormValue = this.houseJobForm.getRawValue();
  const existingBookingHeaderSid = this.bookingData?.BookingHeaderSid || null;
  let CarrierSid = null;
  
  if (houseJobFormValue.CarrierName) {
    const selectedCarrier = this.carrierList.find(carrier => 
      carrier.CustomerName === houseJobFormValue.CarrierName
    );
    if (selectedCarrier) {
      CarrierSid = selectedCarrier.CustomerMasterSid;
    }
  }
  
  this.isSubmitting = true;
  this.isSaving = true;
  this.isLoading = true;
  
  const cargoFormValue = this.cargoForm.getRawValue();
  const otherFormValue = this.otherForm.getRawValue();
  const detailFormValue = this.detailForm.getRawValue();
  const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
  const currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  const boeData = this.boeComponent ? this.boeComponent.getBoeData() : [];
  const vehicleData = this.vehicleComponent ? this.vehicleComponent.getVehicleData() : [];
  const customsData = this.customsComponent ? this.customsComponent.getCustomsData() : [];
  const normalizedConnections = (this.connectionResult || []).map((connection: any) => ({
    ...connection,
    HouseJobConnectionSid:
      connection?.HouseJobConnectionSid ??
      connection?.TransactionSid ??
      null
  }));

  // Validate customs required fields before saving
  if (customsData.length > 0 && this.customsComponent) {
    const customsErrors = this.customsComponent.getValidationErrorsForSave();
    if (customsErrors.length > 0) {
      this.customsValidationErrors = customsErrors;
      this.showCustomsValidationModal = true;
      this.resetSaveState();
      resolve?.(false);
      return;
    }
  }

  // Fix CargoCurrency extraction
  let cargoCurrencyValue = null;
  const rawCargoCurrency = otherFormValue.CargoCurrency;

  if (rawCargoCurrency && rawCargoCurrency !== '') {
    if (typeof rawCargoCurrency === 'object' && rawCargoCurrency.currencyCode) {
      cargoCurrencyValue = rawCargoCurrency.currencyCode;
    } else if (typeof rawCargoCurrency === 'string' && rawCargoCurrency.trim() !== '') {
      cargoCurrencyValue = rawCargoCurrency;
    }
  }

  const cargoSid = cargoFormValue.HouseJobCargoSid || null;
  const mappedHouseJobProducts = (detailFormValue.bookingProducts || []).map((product: any) => ({
      HouseJobProductSid: product.HouseJobProductSid || null,
      HouseJobCargoSid: product.HouseJobCargoSid || cargoSid,
      ProductName: product.ProductName || '',
      ShippingBillNo: product.ShippingBillNo || '',
      ShippingBillDate: product.ShippingBillDate,
      ExternaPkg: product.ExternaPkg || null,
      ExternlQty: String(product.ExternlQty),
      GrossWeight: parseFloat(product.GrossWeight) || 0,
      NetWeight: parseFloat(product.NetWeight) || 0,
      Volume: parseFloat(product.Volume) || 0,
      Volumetric: parseFloat(product.Volumetric) || 0,
      IsHaz: product.IsHaz ? 'Y' : 'N',
      ImcoClass: product.ImcoClass || '',
      UnNo: String(product.UnNo ?? ''),
      PkgGroup: product.PkgGroup || '',
      Length: parseFloat(product.Length),
      Width: parseFloat(product.Width),
      Height: parseFloat(product.Height),
      UomMasterSid: product.UomMasterSid,
      HSCode: product.HSCode,
      CargoRecDate: product.CargoRecDate,
      DamageQty: product.DamageQty,
      ReceivedQty: product.ReceivedQty,
      DamageRemarks: product.DamageRemarks,
      MasterJobContainerSid: product.MasterJobContainerSid || null,
      ContainerNo: product.ContainerNo,
      MarksAndNumbers: product.MarksAndNumbers,
      DeliveryDate: product.DeliveryDate,
      DeliveredQty: product.DeliveredQty,
  }));

  const payload = {
    // Master Job fields (for MasterJob table)
    MasterJobSid: Number(houseJobFormValue.MasterJobSid) || null,
    MasterJobNumber: houseJobFormValue.MasterJobNumber || '',
    MBLNo: houseJobFormValue.MBLNo || '',
    MBLDate: houseJobFormValue.MBLDate ? new Date(houseJobFormValue.MBLDate) : null,
    FreightPPCC: houseJobFormValue.FreightTerms || 'Prepaid',
    
    // House Job fields
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    DepartmentMasterSid: houseJobFormValue.DepartmentMasterSid,
    CustomerMasterSid: houseJobFormValue.CustomerMasterSid,
    
    // Other fields
    BookingNo: houseJobFormValue.BookingNo,
    CustomerBranchSid: houseJobFormValue.CustomerBranchSid || null,
    BookingHeaderSid: existingBookingHeaderSid,
    CustomerName: houseJobFormValue.CustomerName,
    CustomerAddress: houseJobFormValue.CustomerAddress,
    SalesmanSid: houseJobFormValue.SalesmanSid || null,
    ShipperName: houseJobFormValue.ShipperName,
    ShipperAddress: houseJobFormValue.ShipperAddress,
    ConsigneeName: houseJobFormValue.ConsigneeName,
    ConsigneeAddress: houseJobFormValue.ConsigneeAddress,
    Notify: houseJobFormValue.Notify || '',
    NotifyAddress: houseJobFormValue.NotifyAddress || '',
    DestinationAgent: houseJobFormValue.DestinationAgent,
    AgentName: this.getAgentNameById(houseJobFormValue.AgentName) || houseJobFormValue.AgentName || null,
    AgentAddress: houseJobFormValue.AgentAddress || '',
    CarrierName: houseJobFormValue.CarrierName || null,
    CarrierSid: CarrierSid,
    QuotationHeaderSid: houseJobFormValue.QuotationHeaderSid || null,
    HBLNo: houseJobFormValue.HBLNo || '',
    status: houseJobFormValue.status === 'Active' ? 'A' : 'S',
    VesselName: houseJobFormValue.VesselName || null,
    VoyageMasterSid: houseJobFormValue.VoyageMasterSid || null,
    VoyageNo: houseJobFormValue.VoyageNo || null,
    HBLDate: houseJobFormValue.HBLDate ? new Date(houseJobFormValue.HBLDate) : null,
    ETA: houseJobFormValue.ETA ? new Date(houseJobFormValue.ETA) : null,
    ETD: houseJobFormValue.ETD ? new Date(houseJobFormValue.ETD) : null,
    POO: houseJobFormValue.POO || null,
    POL: houseJobFormValue.POL,
    POD: houseJobFormValue.POD,
    POLTerminal: houseJobFormValue.POLTerminal || '',
    PODTerminal: houseJobFormValue.PODTerminal || '',
    FPD: houseJobFormValue.FPD || null,
    MovementType: houseJobFormValue.MovementType || null,
    DoValid: houseJobFormValue.DoValid ? new Date(houseJobFormValue.DoValid) : null,
    Coload: houseJobFormValue.Coload ? 'Y' : 'N',
    ShipmentType: houseJobFormValue.ShipmentType ? 'Y' : 'N',
    HouseStatus: houseJobFormValue.HouseStatus,
    HBLCount: houseJobFormValue.HBLCount,
    IncoTerms: houseJobFormValue.IncoTerms,
    InternalNote: houseJobFormValue.InternalNote || '',
    GeneralNote: houseJobFormValue.GeneralNote || '',
    NominatedBy: houseJobFormValue.NominatedBy || 'Self',
    FreightTerms: houseJobFormValue.FreightTerms || '',
    JobType: houseJobFormValue.JobType || 'Agent',
    ShipmentNo: houseJobFormValue.ShipmentNo || null,
    
    // Related data
    houseJobCargo: {
      HouseJobCargoSid: cargoSid,
      CargoType: cargoFormValue.CargoType || 'General',
      ContainerType: cargoFormValue.ContainerType || null,
      NoofContainers: parseFloat(cargoFormValue.NoofContainers) || 0,
      GrossWeight: parseFloat(cargoFormValue.GrossWeight) || 0,
      NetWeight: parseFloat(cargoFormValue.NetWeight) || 0,
      Volume: parseFloat(cargoFormValue.Volume) || 0,
      Volumetric: parseFloat(cargoFormValue.Volumetric) || 0,
      ChargeableWeight: parseFloat(cargoFormValue.ChargeableWeight) || 0,
      NoOfPackage: parseFloat(cargoFormValue.NoOfPackage) || 0,
      ShipmentTerms: cargoFormValue.ShipmentTerms || null,
      CommodityDescription: cargoFormValue.CommodityDescription || null,
      MarksAndNumber: cargoFormValue.MarksAndNumber || null,
      LandedMarksandNumber: cargoFormValue.LandedMarksandNumber || null,
      MovementType: cargoFormValue.MovementType || null,
      FreightTerms: cargoFormValue.FreightTerms || null,
      ModeOfTransport: cargoFormValue.ModeOfTransport || null,
      StuffingAt: cargoFormValue.StuffingAt || 'Dock',
      bookingProducts: mappedHouseJobProducts,
      products: mappedHouseJobProducts
    },
    
    houseJobOthers: {
      HouseJobOthersSid: otherFormValue.HouseJobOthersSid || null,
      CustomerRefNo: otherFormValue.CustomerRefNo || '',
      YardCFS: otherFormValue.YardCFS || '',
      ReleaseType: otherFormValue.ReleaseType || null,
      DeclaredValueOfCarriage: otherFormValue.DeclaredValueOfCarriage || null,
      DeclaredValueOfCustoms: otherFormValue.DeclaredValueOfCustoms || null,
      HBLNo: otherFormValue.HBLNo || '',
      Forwarder: otherFormValue.Forwarder || null,
      ForwarderAddress: otherFormValue.ForwarderAddress || '',
      NotifyParty: otherFormValue.NotifyParty || null,
      BlClause: otherFormValue.BlClause || [],
      NotifyPartyAddress: otherFormValue.NotifyPartyAddress || '',
      Notify2: otherFormValue?.Notify2 || null,
      NotifyAddress2: otherFormValue?.NotifyAddress2 || '',
      Coloader: otherFormValue?.Coloader || null,
      PickupPlace: otherFormValue.PickupPlace || '',
      DeliveryPlace: otherFormValue.DeliveryPlace || '',
      DeliveryDate: otherFormValue.DeliveryDate ? new Date(otherFormValue.DeliveryDate) : null,
      CHAName: otherFormValue.CHAName || '',
      PickupAddress: otherFormValue.PickupAddress || '',
      DeliveryAddress: otherFormValue.DeliveryAddress || '',
      CargoCurrency: cargoCurrencyValue,
      CargoValue: parseFloat(otherFormValue.CargoValue) || 0,
      HandlingInformation: otherFormValue.HandlingInformation || '',
      ValueForInsurance: otherFormValue.ValueForInsurance || 0,
      InsuranceAmount: otherFormValue.InsuranceAmount || 0,
      ValuationCharge: otherFormValue.ValuationCharge || 0,
      SwitchBL: otherFormValue.SwitchBL ? 'Y' : 'N',
      BacktoBack: otherFormValue.BacktoBack ? 'Y' : 'N',
      Depo: otherFormValue.Depo || '',
      ROValidity: otherFormValue.ROValidity ? new Date(otherFormValue.ROValidity) : null,
      SwitchBLAgent: otherFormValue?.SwitchBLAgent || null,
      AgentName: otherFormValue?.AgentName || null,
      AgentAddress: otherFormValue?.AgentAddress || '',
      SwitchBLShipper: otherFormValue?.SwitchBLShipper || null,
      SwitchBLConsignee: otherFormValue?.SwitchBLConsignee || null,
      SwitchLocation: otherFormValue?.SwitchLocation || '',
      CarrierBookingRef: otherFormValue?.CarrierBookingRef || '',
      CarrierBookingDate: otherFormValue?.CarrierBookingDate ? new Date(otherFormValue?.CarrierBookingDate) : null,
      DONo: otherFormValue?.DONo || '',
      DODate: otherFormValue?.DODate ? new Date(otherFormValue?.DODate) : null,
      SIConfirmationDate: otherFormValue?.SIConfirmationDate ? new Date(otherFormValue?.SIConfirmationDate) : null,
      DGConfirmationDate: otherFormValue?.DGConfirmationDate ? new Date(otherFormValue?.DGConfirmationDate) : null,
      InternalNote: otherFormValue?.InternalNote || '',
      GeneralNote: otherFormValue?.GeneralNote || ''
    },
    
    houseJobProduct: mappedHouseJobProducts,
    houseJobBOE: boeData,
    houseJobVehicle: vehicleData,
    houseJobCustoms: customsData,
    houseConnections: normalizedConnections,
    bookingRates: this.rateResult,
    milestones: this.milestoneResult,
    createdBy: !this.isEditMode ? currUserEmail : undefined,
    updatedBy: this.isEditMode ? currUserEmail : undefined
  };

  if (!this.isEditMode) {
    // CREATE using new API
    this.createAgentMasterAirWaybill(payload).subscribe({
      next: (resp: any) => {
        this.resetSaveState();
        if (resp.status && resp.data) {
          this.resetDirtyState();
          this.formSaved = true;
          this.appSettingService.showSuccess('Agent Master Air Waybill created successfully!');
          this.HouseJobSid = resp.data?.houseJob?.HouseJobSid || resp.data?.masterJob?.MasterJobSid;
          this.isEditMode = true;
          
          if (this.HouseJobSid) {
            this.router.navigate(['/operation/agent-master-air-waybill/entry', this.HouseJobSid]);
          } else {
            this.router.navigate(['/operation/agent-master-air-waybill/list']);
          }
          resolve?.(true);
        } else {
          this.showAgentMasterAirWaybillBackendError(resp, 'Error creating Agent Master Air Waybill.');
          console.error('Create error:', resp.message);
          resolve?.(false);
        }
      },
      error: (err) => {
        this.resetSaveState();
        this.showAgentMasterAirWaybillBackendError(err, 'Failed to create Agent Master Air Waybill. Please try again.');
        console.error('Create API error:', err);
        resolve?.(false);
      }
    });
    return;
  } 
  
  if (this.isEditMode && this.HouseJobSid) {
    // UPDATE using new API
    this.updateAgentMasterAirWaybillById(this.HouseJobSid, payload).subscribe({
      next: (resp: any) => {
        this.resetSaveState();
        if (resp.status) {
          this.resetDirtyState();
          this.formSaved = true;
          this.appSettingService.showSuccess('Agent Master Air Waybill successfully updated.');
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/operation/agent-master-air-waybill/entry', this.HouseJobSid]);
          });
          resolve?.(true);
        } else {
          this.showAgentMasterAirWaybillBackendError(resp, 'Error updating Agent Master Air Waybill.');
          console.error(resp.message);
          resolve?.(false);
        }
      },
      error: (err) => {
        this.resetSaveState();
        this.showAgentMasterAirWaybillBackendError(err, 'Failed to update Agent Master Air Waybill.');
        console.error(err);
        resolve?.(false);
      }
    });
  }
}

private resetSaveState(): void {
  this.isSubmitting = false;
  this.isSaving = false;
  this.isLoading = false;
}

private showAgentMasterAirWaybillBackendError(errorResponse: any, fallbackMessage: string): void {
  const backendMessage = errorResponse?.message || errorResponse?.error?.message || fallbackMessage;

  if (backendMessage?.includes('No MAWB stock available for auto allocation')) {
    this.enableManualMawbEntryFallback(backendMessage);
    return;
  }

  if (backendMessage?.toLowerCase().includes('duplicate') || backendMessage?.toLowerCase().includes('already exists')) {
    this.houseJobForm.get('MBLNo')?.setErrors({ duplicate: true });
    this.houseJobForm.get('MBLNo')?.markAsTouched();
  }

  this.appSettingService.showError(backendMessage || fallbackMessage);
}
/**
 * Create new Agent Master Air Waybill
 */
createAgentMasterAirWaybill(payload: any) {
  return this.operationService.createAgentMasterAirWaybill(payload).pipe(
    map((resp) => {
      return resp;
    })
  );
}

/**
 * Update Agent Master Air Waybill by ID
 */
updateAgentMasterAirWaybillById(HouseJobSid: number, payload: any) {
  return this.operationService.updateAgentMasterAirWaybillById(HouseJobSid, payload).pipe(
    map((resp) => {
      return resp;
    })
  );
}

/**
 * Get Agent Master Air Waybill by ID
 */
getAgentMasterAirWaybillById(HouseJobSid: number) {
  return this.operationService.getAgentMasterAirWaybillById(HouseJobSid).pipe(
    map((resp) => {
      return resp;
    })
  );
}
  /**
    |--------------------------------------------------
    |   Section-5 : Helper Functions
    |--------------------------------------------------
  */

  // Header Part Related
private getAgentNameById(agentId: number): string {
  if (!agentId || !this.agentList || this.agentList.length === 0) return '';
  const agent = this.agentList.find(a => a.CustomerMasterSid === agentId);
  return agent ? agent.CustomerName : '';
}
 onDeptChange(department: any) {
  this.selectedDepartment = department;
  if (!department) {
    this.selectedDepartment = null;
    this.selectedDepartmentType = '';
    this.filterTabs();
  this.selectedFCLLCL = 'LCL';
  this.filteredPorts = [];
  this.filteredPOO = [];
  this.filteredPOL = [];
  this.filteredPOD = [];
  this.filteredFPOD = [];
  this.b['POO'].setValue(null);
  this.b['POL'].setValue(null);
  this.b['POD'].setValue(null);
    this.b['FPD'].setValue(null);
    this.b['ETA'].setValue(null);
    this.b['ETD'].setValue(null);
    this.b['MovementType'].setValue(null);
    this.b['JobType'].setValue('');
    this.handleImportExport();
    this.handleCFSOrYard();
    this.b['HBLNo']?.enable();
    this.b['HBLNo']?.setValue('');
    this.blClauseOptions = [];
    this.o['BlClause']?.setValue('');
    this.handleHBLNoField('');
    this.b['isMawbFreeText']?.setValue(false);
    this.mawbStockList = [];
    this.mawbStockSource = 'NONE';
    this.isMawbDropdownDisabled = false;
    this.allowManualMawbEntryOnAutoAllocationError = false;
    this.updateCarrierValidation(null);
    return;
  }

  this.selectedDepartment = department;
  this.selectedDepartmentType = department.departmentType ? department.departmentType.toUpperCase() : '';
  this.handleHBLNoField(department.ExportImport);
  this.filterTabs();
  this.selectedFCLLCL = this.selectedDepartmentType === 'SEA'
    ? (department.FCLLCL ? department.FCLLCL.toUpperCase() : 'LCL')
    : 'AIR';

  const mblNoControl = this.houseJobForm.get('MBLNo');
  const isAirExport = department.ExportImport?.toUpperCase() === 'EXPORT';
  const isAirImport = department.ExportImport?.toUpperCase() === 'IMPORT';

  this.b['isMawbFreeText']?.setValue(false);
  this.mawbStockList = [];
  this.mawbStockSource = 'NONE';
  this.isMawbDropdownDisabled = this.selectedDepartmentType !== 'AIR';
  this.allowManualMawbEntryOnAutoAllocationError = false;

  if (this.selectedDepartmentType === 'AIR') {
    if (isAirImport) {
      mblNoControl?.enable();
      mblNoControl?.setValidators([Validators.required, Validators.maxLength(50)]);
      this.isMawbDropdownDisabled = true;
    } else if (isAirExport && !this.isMawbStockAllocationEnabled) {
      mblNoControl?.enable();
      mblNoControl?.setValidators(
        this.isEditMode
          ? [Validators.required, Validators.maxLength(50)]
          : [Validators.maxLength(50)]
      );
      this.isMawbDropdownDisabled = false;
    } else {
      mblNoControl?.setValidators([Validators.maxLength(50)]);
      this.isMawbDropdownDisabled = true;

      if (this.isEditMode) {
        mblNoControl?.enable();
      } else {
        mblNoControl?.disable();
        if (!this.houseJobForm.get('MBLNo')?.value) {
          mblNoControl?.setValue('');
        }
      }
    }
  } else {
    mblNoControl?.enable();
    mblNoControl?.clearValidators();
    mblNoControl?.setValidators([Validators.maxLength(50)]);
    this.isMawbDropdownDisabled = true;
  }

  mblNoControl?.updateValueAndValidity();
  this.updateCarrierValidation(department);

  if (this.selectedDepartmentType === 'AIR' && isAirExport && !this.isMawbStockAllocationEnabled && this.bookingData) {
    setTimeout(() => {
      this.loadMawbStock(this.bookingData);
    }, 300);
  }

  if (this.bookingProducts.length > 0) {
    this.bookingProducts.controls.forEach((productGroup: FormGroup, index) => {
      const isAirOrLCL = this.selectedFCLLCL === 'AIR' || this.selectedFCLLCL === 'LCL';

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

  this.b['DepartmentMasterSid'].setValue(department.DepartmentMasterSid);
  this.loadDefaultBLClauses(department.DepartmentMasterSid);
  this.autoSetJobType(department);

  if (this.selectedDepartmentType === 'AIR') {
    this.b['IncoTerms']?.setValue('CIF');
    this.b['FreightTerms']?.setValue('Prepaid');
    this.c['ModeOfTransport']?.setValue('Flight');
  } else {
    this.selectedDepartmentType === 'SEA' ? this.c['ModeOfTransport']?.setValue('Vessel') : null;
  }

  if (this.selectedFCLLCL === 'LCL' && department.ExportImport === 'Export') {
    this.cargoForm.get('StuffingAt')?.setValue('Dock');
    this.cargoForm.get('StuffingAt')?.disable();
  } else {
    this.cargoForm.get('StuffingAt')?.enable();
  }

  this.handleCFSOrYard();
  this.refreshPortFilters();
  this.handleImportExport();
}
private handleHBLNoField(exportImport: string): void {
  const hblNoControl = this.houseJobForm.get('HBLNo');
  
  if (!hblNoControl) {
    console.warn('HBLNo control not found');
    return;
  }
  
  // Clear existing validators first
  hblNoControl.clearValidators();
  hblNoControl.updateValueAndValidity();
  
  if (exportImport === 'Export') {
    // For Export departments: disable HBLNo field (will be auto-generated)
    hblNoControl.enable();
    hblNoControl.setValue('');
    hblNoControl.clearValidators();
  } else if (exportImport === 'Import') {
    // For Import departments: enable HBLNo field for manual entry (not required)
    hblNoControl.enable();
    hblNoControl.clearValidators();
    hblNoControl.updateValueAndValidity();
    
  } else {
    // For other department types: enable but not required
    hblNoControl.enable();
    hblNoControl.clearValidators();
   
  }
  
  hblNoControl.updateValueAndValidity();
}

validateImportMAWBLNo(): boolean {
  const exportImportType = this.selectedDepartment?.ExportImport;
  const mblNo = this.houseJobForm.get('MBLNo')?.value;
  
  // If it's Import department and MAWBL (MBLNo) is empty, show error
  if (exportImportType === 'Import' && (!mblNo || mblNo.trim() === '')) {
    this.appSettingService.showWarning('MAWBL Number is required for Import operations. Please enter a valid MAWBL Number.');
    
    this.houseJobForm.get('MBLNo')?.markAsTouched();
    this.houseJobForm.get('MBLNo')?.setErrors({ required: true });
    
    // Focus on MAWBL field
    setTimeout(() => {
      const mblNoElement = document.querySelector('[formControlName="MBLNo"]') as HTMLElement | null;
      if (mblNoElement) {
        mblNoElement.focus();
      }
    }, 100);
    
    return false;
  }

  if (
    exportImportType === 'Export' &&
    (
      (this.isEditMode && !this.isMawbStockAllocationEnabled) ||
      this.allowManualMawbEntryOnAutoAllocationError
    ) &&
    (!mblNo || mblNo.trim() === '')
  ) {
    this.appSettingService.showWarning('MAWBL Number is required for Air Export.');
    this.houseJobForm.get('MBLNo')?.markAsTouched();
    this.houseJobForm.get('MBLNo')?.setErrors({ required: true });
    return false;
  }
  
  return true;
}
  private autoSetJobType(department: any): void {
  if (!department) {
    this.b['JobType']?.setValue('');
    return;
  }

  const departmentName = department.departmentName?.toLowerCase() || '';
  const exportImport = department.ExportImport;
  
  let jobType = '';
  
  // Determine JobType based on department name and export/import
  
    if (exportImport === 'Export') {
      jobType = 'Export';
    } else if (exportImport === 'Import') {
      jobType = 'Import';
    } 
  
  // Set the JobType value
  this.b['JobType']?.setValue(jobType);
}

  onRouteChange(): void {
    this.refreshPortFilters();
  }

  getFilteredPortsBySegment(segment: string): any[] {
    if (segment === 'AIR') {
      return this.portList.filter(port => this.normalizePortText(port?.PortType) === 'AIR');
    } else if (segment === 'FCL' || segment === 'LCL' || segment === 'SEA') {
      return this.portList.filter(port => this.normalizePortText(port?.PortType) === 'SEA');
    } else if (segment === 'ROAD') {
      return this.portList.filter(port => {
        const portType = this.normalizePortText(port?.PortType);
        return portType === 'ROAD' || portType.includes('ROAD') || portType.includes('LAND') || portType.includes('LOCATION');
      });
    }
    return [];
  }

  private refreshPortFilters(): void {
    const filteredLists = this.buildPortFilterLists();
    this.applyPortFilterLists(filteredLists);
    this.syncRouteValidation();

    if (this.clearInvalidPortSelections(filteredLists)) {
      this.applyPortFilterLists(this.buildPortFilterLists());
      this.syncRouteValidation();
    }
  }

  private buildPortFilterLists() {
    if (!this.selectedDepartmentType) {
      return {
        filteredPorts: [],
        filteredPOO: [],
        filteredPOL: [],
        filteredPOD: [],
        filteredFPOD: []
      };
    }

    const segment = this.selectedFCLLCL || this.selectedDepartmentType;
    const basePorts = this.getFilteredPortsBySegment(segment);
    const shipmentDirection = this.getShipmentDirection();
    const foreignPorts = basePorts.filter(port => this.isForeignCountryPort(port));
    const companyCountryPorts = basePorts.filter(port => this.isCompanyCountryPort(port));

    let pooPorts = [...basePorts];
    let polPorts = [...basePorts];
    let podPorts = [...basePorts];
    let fpodPorts = [...basePorts];

    if (shipmentDirection === 'EXPORT') {
      pooPorts = [...companyCountryPorts];
      polPorts = [...companyCountryPorts];
      podPorts = [...foreignPorts];
      fpodPorts = this.getPortsByReferenceCountry('POD', foreignPorts);
    } else if (shipmentDirection === 'IMPORT') {
      pooPorts = this.getPortsByReferenceCountry('POL', foreignPorts);
      polPorts = [...foreignPorts];
      podPorts = [...companyCountryPorts];
      fpodPorts = this.getPortsByReferenceCountry('POD', companyCountryPorts);
    }

    const selectedPOL = this.houseJobForm.get('POL')?.value;
    const selectedPOD = this.houseJobForm.get('POD')?.value;

    return {
      filteredPorts: basePorts,
      filteredPOO: pooPorts,
      filteredPOL: polPorts.filter(port => port.PortCode !== selectedPOD),
      filteredPOD: podPorts.filter(port => port.PortCode !== selectedPOL),
      filteredFPOD: fpodPorts
    };
  }

  private applyPortFilterLists(filteredLists: any): void {
    this.filteredPorts = filteredLists.filteredPorts;
    this.filteredPOO = filteredLists.filteredPOO;
    this.filteredPOL = filteredLists.filteredPOL;
    this.filteredPOD = filteredLists.filteredPOD;
    this.filteredFPOD = filteredLists.filteredFPOD;
  }

  private clearInvalidPortSelections(filteredLists: any): boolean {
    let hasChanges = false;

    hasChanges = this.clearPortControlIfInvalid('POO', filteredLists.filteredPOO) || hasChanges;
    hasChanges = this.clearPortControlIfInvalid('POL', filteredLists.filteredPOL) || hasChanges;
    hasChanges = this.clearPortControlIfInvalid('POD', filteredLists.filteredPOD) || hasChanges;
    hasChanges = this.clearPortControlIfInvalid('FPD', filteredLists.filteredFPOD) || hasChanges;

    return hasChanges;
  }

  private clearPortControlIfInvalid(controlName: 'POO' | 'POL' | 'POD' | 'FPD', allowedPorts: any[]): boolean {
    const control = this.houseJobForm.get(controlName);
    const selectedValue = control?.value;

    if (!selectedValue) {
      return false;
    }

    const isValid = allowedPorts.some(port => port.PortCode === selectedValue);
    if (!isValid) {
      control?.setValue(null, { emitEvent: false });
      return true;
    }

    return false;
  }

  private syncRouteValidation(): void {
    const selectedPOL = this.houseJobForm.get('POL')?.value;
    const selectedPOD = this.houseJobForm.get('POD')?.value;

    if (selectedPOL && selectedPOD && selectedPOL === selectedPOD) {
      this.setControlError(this.houseJobForm.get('POL'), 'samePort', true);
      this.setControlError(this.houseJobForm.get('POD'), 'samePort', true);
      this.toastr.warning('POL and POD cannot be the same');
    } else {
      this.clearControlError(this.houseJobForm.get('POL'), 'samePort');
      this.clearControlError(this.houseJobForm.get('POD'), 'samePort');
    }
  }

  private getShipmentDirection(): 'EXPORT' | 'IMPORT' | '' {
    const departmentDirection = this.normalizePortText(this.selectedDepartment?.ExportImport);
    if (departmentDirection === 'EXPORT' || departmentDirection === 'IMPORT') {
      return departmentDirection as 'EXPORT' | 'IMPORT';
    }

    const jobType = this.normalizePortText(this.houseJobForm.get('JobType')?.value);
    if (jobType === 'EXPORT' || jobType === 'IMPORT') {
      return jobType as 'EXPORT' | 'IMPORT';
    }

    return '';
  }

  private getPortsByReferenceCountry(controlName: 'POL' | 'POD', fallbackPorts: any[]): any[] {
    const referencePort = this.getPortByCode(this.houseJobForm.get(controlName)?.value);
    if (!referencePort) {
      return [...fallbackPorts];
    }

    const referenceCountryId = this.toNumericValue(referencePort?.CountryMasterSid);
    if (referenceCountryId) {
      return fallbackPorts.filter(port => this.toNumericValue(port?.CountryMasterSid) === referenceCountryId);
    }

    const referenceCountryName = this.normalizePortText(referencePort?.Country || referencePort?.countryMaster?.countryName);
    if (!referenceCountryName) {
      return [...fallbackPorts];
    }

    return fallbackPorts.filter(port => {
      const portCountryName = this.normalizePortText(port?.Country || port?.countryMaster?.countryName);
      return portCountryName === referenceCountryName;
    });
  }

  private isCompanyCountryPort(port: any): boolean {
    const companyCountryId = this.toNumericValue(this.currentCompany?.CountryMasterSid);
    const portCountryId = this.toNumericValue(port?.CountryMasterSid);

    if (companyCountryId && portCountryId) {
      return companyCountryId === portCountryId;
    }

    const companyCountryName = this.normalizePortText(this.currentCompany?.CountryName || this.countryOfCompany);
    const portCountryName = this.normalizePortText(port?.Country || port?.countryMaster?.countryName);

    return !!companyCountryName && !!portCountryName && companyCountryName === portCountryName;
  }

  private isForeignCountryPort(port: any): boolean {
    const companyCountryId = this.toNumericValue(this.currentCompany?.CountryMasterSid);
    const portCountryId = this.toNumericValue(port?.CountryMasterSid);

    if (companyCountryId && portCountryId) {
      return companyCountryId !== portCountryId;
    }

    const companyCountryName = this.normalizePortText(this.currentCompany?.CountryName || this.countryOfCompany);
    const portCountryName = this.normalizePortText(port?.Country || port?.countryMaster?.countryName);

    return !!companyCountryName && !!portCountryName && companyCountryName !== portCountryName;
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

  private toNumericValue(value: any): number | null {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }

  private setControlError(control: AbstractControl | null, errorKey: string, value: any): void {
    if (!control) {
      return;
    }

    control.setErrors({
      ...(control.errors || {}),
      [errorKey]: value
    });
  }

  private clearControlError(control: AbstractControl | null, errorKey: string): void {
    if (!control?.errors?.[errorKey]) {
      return;
    }

    const { [errorKey]: _, ...remainingErrors } = control.errors || {};
    control.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
  }


  onCustomerChange(customer: any) {
  
  const departmentSid = this.houseJobForm.get('DepartmentMasterSid')?.value;
  const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === departmentSid);
  // Check if department is selected
  if (!selectedDepartment) {
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
    // Only clear Notify if it's not already set by user
    if (!this.houseJobForm.get('Notify')?.value) {
      this.houseJobForm.patchValue({
        Notify: null,
        NotifyAddress: ''
      });
    }
    return;
  }
  
  this.filteredShipperList = this.shipperList.filter(s => s.CustomerMasterSid !== consignee.CustomerMasterSid);
  
  // Auto-fill Notify ONLY if Notify is currently empty
  const currentNotify = this.houseJobForm.get('Notify')?.value;
  if (!currentNotify || currentNotify === '') {
    this.houseJobForm.patchValue({
      Notify: consignee.CustomerName,
      NotifyAddress: consignee.Address
    });
  }
}
  handleDestAgentChange(agent?: any) {
    if (!agent) {
      this.originAgentList = [...this.agentList];
      return;
    }
    this.originAgentList = this.agentList.filter(s => s.CustomerMasterSid !== agent.CustomerMasterSid);
  }

  handleOriginAgentChange(agent?: any) {
    if (!agent) {
      this.deliveryAgentList = [...this.agentList];
      return;
    }
    this.deliveryAgentList = this.agentList.filter(s => s.CustomerMasterSid !== agent.CustomerMasterSid);
  }

  handleCarrierChange(carrier:any){
    if(!carrier){
      this.houseJobForm.get('CarrierSid')?.setValue(null);
      return;
    }
    this.houseJobForm.get('CarrierSid')?.setValue(carrier.CustomerMasterSid);
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
    this.houseJobForm.patchValue({
      ConsigneeName: consigneeExistInFiltered.CustomerName,
      ConsigneeAddress: consigneeExistInFiltered.Address,
      // AUTO-FILL NOTIFY WITH CONSIGNEE INFO - SAME AS BOOKING
      Notify: consigneeExistInFiltered.CustomerName,
      NotifyAddress: consigneeExistInFiltered.Address
    });
    this.onConsigneeChange(consigneeExistInFiltered);
    this.onShipperChange();
  } else if (consigneeExist && !consigneeExistInFiltered) {
    this.houseJobForm.patchValue({
      ConsigneeName: consigneeExist.CustomerName,
      ConsigneeAddress: consigneeExist.Address,
      // AUTO-FILL NOTIFY WITH CONSIGNEE INFO - SAME AS BOOKING
      Notify: consigneeExist.CustomerName,
      NotifyAddress: consigneeExist.Address
    });
    this.houseJobForm.patchValue({
      ShipperName: null,
      ShipperAddress: ''
    });
    this.onConsigneeChange(consigneeExist);
    this.onShipperChange();
  } else {
    this.houseJobForm.patchValue({
      ConsigneeName: null,
      ConsigneeAddress: '',
      // CLEAR NOTIFY TOO
      Notify: null,
      NotifyAddress: ''
    });
    this.onConsigneeChange();
  }
}
  }


  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe((resp: any) => {
      if (resp.status) {
        this.customerBranchList = resp.data;
        if(this.isEditMode){
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
    this.b[controlName]?.setValue(item ? item.CustomerAddress1 : '')
  }

  handlePOLChange(selectedPort: any,resetTrigger:boolean = true) {
    if (resetTrigger) {
       if (this.selectedDepartmentType !== 'AIR') {
      this.b['VesselName']?.setValue(null);
    }
    this.b['VoyageNo']?.setValue(null);
    this.b['ETA']?.setValue(null);
    this.b['ETD']?.setValue(null);
    }
  if (!selectedPort) {
    this.refreshPortFilters();
    return;
  }
  this.refreshPortFilters();
  this.getVesselBasedOnPorts(); // Add this call
}

  handlePODChange(selectedPort: any,resetTrigger:boolean = true) {
    if (resetTrigger) {
    if (this.selectedDepartmentType !== 'AIR') {
      this.b['VesselName']?.setValue(null);
    }
    this.b['VoyageNo']?.setValue(null);
    this.b['ETA']?.setValue(null);
    this.b['ETD']?.setValue(null);
    }
  if (!selectedPort) {
    this.refreshPortFilters();
    this.b['FPD']?.setValue(null);
    this.PODandFPODsame = true;
    return;
  }
  this.refreshPortFilters();
  const allowedFPOD = this.filteredFPOD.some(port => port.PortCode === selectedPort.PortCode);
  this.b['FPD']?.setValue(allowedFPOD ? selectedPort.PortCode : null);
  this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value;
  this.getVesselBasedOnPorts(); // Add this call
}

  handleFPODChange(port){
    if(!port){
      this.PODandFPODsame = true;
      return;
    }
    this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value
  }

  onVesselChange(vesselVoyage: any) {
 
  if (!vesselVoyage) {
    this.houseJobForm.patchValue({
      VoyageMasterSid: null,
      VoyageNo: null,
      ETA: null,
      ETD: null
    });
    return;
  }

  const parsedETA = vesselVoyage.ETA ? new Date(vesselVoyage.ETA) : null;
  const parsedETD = vesselVoyage.ETD ? new Date(vesselVoyage.ETD) : null;
  const ETA = parsedETA && !isNaN(parsedETA.getTime()) ? parsedETA : null;
  const ETD = parsedETD && !isNaN(parsedETD.getTime()) ? parsedETD : null;
  
  this.houseJobForm.patchValue({
    VoyageMasterSid: vesselVoyage.VoyageMasterSid,
    VoyageNo: vesselVoyage.VoyageNo,
    ETA: ETA,
    ETD: ETD
  });
}


  onVoyageChange(voyage: any) {
  if (!voyage) {
    this.b['ETA'].setValue(null);
    this.b['ETD'].setValue(null);
    this.b['VoyageMasterSid']?.setValue('');
    return;
  }
  
 
  
  this.houseJobForm.patchValue({
    VoyageMasterSid: voyage.VoyageMasterHeaderSid,
    VoyageNo: voyage.VoyageNo,
    VesselName: voyage.VesselName || this.houseJobForm.get('VesselName')?.value,
    ETA: voyage.ETA ? new Date(voyage.ETA) : null,
    ETD: voyage.ETD ? new Date(voyage.ETD) : null
  });

  this.minStartDate = voyage.ETA ? new Date(voyage.ETA) : null;
}

  getVesselBasedOnPorts() {
  const POL = this.b['POL']?.value;
  const POD = this.b['POD']?.value;
  
  if (!POL || !POD) {
  
    return;
  }
  
  const voyageType = this.getVoyageTypeBasedOnDept(this.selectedDepartment?.DepartmentMasterSid);
  
  // Find port objects from port list
  const polPort = this.portList.find(p => p.PortCode === POL);
  const podPort = this.portList.find(p => p.PortCode === POD);
  
  if (!polPort || !podPort) {
  
    return;
  }
  
  const payload = { 
    POL: polPort.PortMasterSid, 
    POD: podPort.PortMasterSid, 
    segment: voyageType 
  };

 

  this.operationService.getVesselVoyageBasedOnPorts(payload).subscribe(
    (resp: any) => {
      if (resp.status) {
        this.headerVesselList = resp.data.map(vslVoy => ({
          ...vslVoy,
          ETD: this.datePipe.transform(vslVoy.ETD),
          ETA: this.datePipe.transform(vslVoy.ETA)
        }));
      
        
        
      } else {
        this.appSettingService.showError("Error loading Vessel");
      }
    },
    (error) => {
      console.error('Error loading vessels:', error);
      this.appSettingService.showError("Error loading Vessel data");
    }
  );
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

 getVoyageForPortsAndVessels() {
  const POL = this.houseJobForm.get('POL')?.value;
  const POD = this.houseJobForm.get('POD')?.value;
  const vesselName = this.houseJobForm.get('VesselName')?.value;

  if (!POL || !POD || !vesselName) {
    return;
  }

  // Get port details
  const polPort = this.portList.find(p => p.PortCode === POL);
  const podPort = this.portList.find(p => p.PortCode === POD);

  if (!polPort || !podPort) {
    return;
  }

  const payload = {
    VesselName: vesselName,
    POL: polPort.PortMasterSid,
    POD: podPort.PortMasterSid,
    MovementType: this.selectedDepartment?.departmentType
  };

  this.operationService.getVoyagesBasedOnVesselAndPort(payload).subscribe(
    (resp: any) => {
      if (resp.status) {
        this.voyageList = resp.data.map((voyage: any) => {
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

        // Auto-select the first voyage if only one exists
        if (this.voyageList.length === 1) {
          this.onVoyageChange(this.voyageList[0]);
        }
      }
    },
    (err) => {
      console.error('Error loading voyages:', err);
    }
  );
}
  toggleHeaderCheckboxes(event: Event, fieldName: string) {
    if (fieldName) {
      const element = event.target as HTMLInputElement;
      element.checked = !element.checked;
      this.houseJobForm.get(`${fieldName}`)?.setValue(element.checked);
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

  deleteBookingProduct(productIndex: number, HouseJobProductSid?: number) {
    if (HouseJobProductSid) {
      this.operationService.deleteHouseJobProduct(HouseJobProductSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.bookingProducts.removeAt(productIndex);
            this.productDataLength = this.bookingProducts.length;
            this.appSettingService.showSuccess('Product Deleted Successfully');
            this.handleProductRelatedCalculation();
            this.markAsDirty();
          } else {
            this.appSettingService.showError("Error deleting product.");
          }
        })
    } else {
      this.bookingProducts.removeAt(productIndex);
      this.productDataLength = this.bookingProducts.length;
      this.appSettingService.showSuccess('Product Deleted Successfully');
      this.handleProductRelatedCalculation();
      this.markAsDirty();
    }
    this.bookingProducts.updateValueAndValidity();
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
     if (this.isPatching) {
    return;
  }
    if (this.bookingProducts.length === 0) {
      this.c['NoOfPackage']?.enable(); this.c['NoOfPackage']?.setValue(0);
      this.c['GrossWeight']?.enable(); this.c['GrossWeight']?.setValue(0);
      this.c['NetWeight']?.enable(); this.c['NetWeight']?.setValue(0);
      this.c['Volume']?.enable(); this.c['Volume']?.setValue(0);
      this.c['Volumetric']?.enable(); this.c['Volumetric']?.setValue(0);
      this.c['ChargeableWeight']?.enable(); this.c['ChargeableWeight']?.setValue(0);
      return;
    }

    let totalNoOfPkg = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalVolume = 0;
    let totalVolumetric: any = 0;

    let productValue = this.bookingProducts.getRawValue() || [];
    productValue.forEach(product => {
      totalNoOfPkg += Number(product.ExternlQty) || 0;
      totalGrossWeight += Number(product.GrossWeight) || 0;
      totalNetWeight += Number(product.NetWeight) || 0;
      totalVolume += Number(product.Volume) || 0;
      totalVolumetric += Number(product.Volumetric) || 0
    });

    this.c['NoOfPackage']?.setValue(totalNoOfPkg);
    this.c['NoOfPackage']?.disable();
    this.c['GrossWeight']?.setValue(totalGrossWeight);
    this.c['GrossWeight']?.disable();
    this.c['NetWeight']?.setValue(totalNetWeight);
    this.c['NetWeight']?.disable();
    this.c['Volume']?.setValue(totalVolume);
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
    const DepartmentMasterSid = this.houseJobForm.get('DepartmentMasterSid')?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const MasterJobNumber = this.housejobData?.masterJob?.MasterJobNumber || this.houseJobForm.get('MBLNo')?.value;
    const MasterJobSid = this.houseJobForm.get("MasterJobSid")?.value || this.housejobData?.MasterJobSid;
    const MBLNo = this.houseJobForm.get('MBLNo')?.getRawValue() || this.housejobData?.masterJob?.MBLNo;
    const HBLNo = this.b['HBLNo']?.value;
    const selectedPOO = this.houseJobForm.get('POO')?.value; // PortMasterSid
    const selectedPOL = this.houseJobForm.get('POL')?.value; // PortMasterSid
    const selectedPOD = this.houseJobForm.get('POD')?.value; // PortMasterSid
    const selectedFPD = this.houseJobForm.get('FPD')?.value; // PortMasterSid
    const EffectiveDate = this.houseJobForm.get('HBLDate')?.value;
    const ExpiredDate = this.houseJobForm.get('HBLDate')?.value;
    const PORSid = (this.portList.find(p => p.PortCode === selectedPOO)?.PortMasterSid)
    const POLSid = (this.portList.find(p => p.PortCode === selectedPOL)?.PortMasterSid)
    const PODSid = (this.portList.find(p => p.PortCode === selectedPOD)?.PortMasterSid)
    const FPODSid = (this.portList.find(p => p.PortCode === selectedFPD)?.PortMasterSid)
    const Carrier = this.houseJobForm.get('CarrierSid')?.value;
    const CarrierName = this.houseJobForm.get('CarrierName')?.value || null;
    const Agent = this.houseJobForm.get('DestinationAgent')?.value || null;
    const AgentName = this.houseJobForm.get('AgentName')?.value || null;
    const IncoTerms = this.houseJobForm.get('IncoTerms')?.value
    const primaryCargo = this.bookingData?.Cargo?.[0] || {};
    const CargoType = primaryCargo.CargoType;
    const NetWeight = primaryCargo.NetWeight;
    const GrossWeight = primaryCargo.GrossWeight;
    const NoofContainers = primaryCargo.NoofContainers;
    const Volume = primaryCargo.Volume;
    const ChargeableWeight = primaryCargo.ChargeableWeight;
    const cargoItems = (this.bookingData?.Cargo || []).map((cargo: any) => {
      const containerTypeSid = cargo.ContainerType || null;
      const containerTypeName = this.containerTypeList.find(
        ct => ct.ContainerTypeMasterSid === containerTypeSid
      )?.ContainerTypeName || null;
      return {
        CargoType: cargo.CargoType,
        ContainerType: containerTypeSid,
        ContainerTypeName: containerTypeName,
        GrossWeight: cargo.GrossWeight,
        Volume: cargo.Volume,
        NoofContainers: cargo.NoofContainers,
        ChargeableWeight: cargo.ChargeableWeight,
        ShipmentTerms: cargo.ShipmentTerms,
      };
    });
    const containerTypeSid = cargoItems.find((cargo: any) => cargo.ContainerType)?.ContainerType || null;
    const CustomerMasterSid = this.b['CustomerMasterSid']?.getRawValue();
    const CustomerBranchSid = this.b['CustomerBranchSid']?.getRawValue();
    const BookingHeaderSid = this.b['BookingHeaderSid']?.value;
    const salesmanSid = this.b['SalesmanSid']?.value || '';
    const salesmanName = this.salesmanList.find(s => s.UserMasterSid === salesmanSid)?.userName || '';

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      BookingHeaderSid,
      MasterJobNumber,
      MasterJobSid,
      ParentSid: this.HouseJobSid,
      CustomerMasterSid,
      CustomerBranchSid,
      MBLNo,
      HBLNo,
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
      Carrier,
      CarrierName,
      Agent,
      AgentName,
      IncoTerms,
      ContainerType: containerTypeSid,
      CargoType,
      GrossWeight,
      NetWeight,
      Volume,
      NoofContainers,
      ChargeableWeight,
      cargoItems,
      countryOfCompany: this.countryOfCompany,
      SalesmanName : salesmanName
    }
  }



  async sendManualMail(): Promise<void> {
    const pdfBlob = await this.generatePDFBlob();
    let attachmentFile: File | undefined;
    if (pdfBlob) {
      attachmentFile = new File([pdfBlob], (this.bookingData?.ShipmentNo || 'MAWB') + '.pdf', { type: 'application/pdf' });
    }
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: Number(sessionStorage.getItem('currentMenuId')),
      action: 'UPDATE',
      attachmentFile,
      context: {
        ShipmentNo: this.bookingData?.ShipmentNo,
        userName: this.userData?.userName,
        menuEmail: ''
      }
    });
    const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Email Send'
        },
        newVal: {
          Email: 'Mail Send'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
  }

  navigateBack() {
    history.back();
  }

  selectedTab = 'Shipment';
  isQuickFormExpanded = false;

resetForm() {
  if (this.isEditMode) {
    this.patchValues(this.bookingData);
    this.resetDirtyState();
    return;
  }

  this.houseJobForm.reset({
    status: 'Active',
    HouseStatus: 'Job Generated',
    NominatedBy: 'Self',
    JobType: 'Agent',
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
  (this.detailForm.get('bookingProducts') as FormArray).clear();

  this.slicedProductArr = [];
  this.productDataLength = 0;

  this.cargoForm.reset();
  this.otherForm.reset();
  this.resetDirtyState();
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
      if(!this.bookingData) return;
      const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
      modalRef.componentInstance.item = this.bookingData;
      modalRef.componentInstance.idLabel = 'Agent Master Air Waybill Id';
      modalRef.componentInstance.idValue = this.bookingData?.HouseJobSid;
    }

  openTandC() {
        const currentMenuId = this.bookingData?.MenuMasterSid;
        const departmentSid = this.bookingData?.DepartmentMasterSid;
        const pol = this.bookingData?.POL;
        const pod = this.bookingData?.POD;
        const carrier = this.bookingData?.CarrierSid || null;
        const payload = { 
          MenuMasterSid: currentMenuId,
          DepartmentMasterSid: departmentSid,
          POL: pol,
          POD: pod,
          Carrier: carrier,
          DocumentSid: this.HouseJobSid
        };
        const openModal = (terms : any[]) => {
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
                size: 'lg',
                backdrop: 'static',
                centered: true
              });
              modalRef.componentInstance.terms = terms || [];
              modalRef.componentInstance.MenuMasterSid = currentMenuId;
              modalRef.componentInstance.DocumentSid = this.HouseJobSid;
              modalRef.componentInstance.DepartmentMasterSid = departmentSid;
              modalRef.componentInstance.POL = pol;
              modalRef.componentInstance.POD = pod;
              modalRef.componentInstance.Carrier = carrier;
              modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
        };
        if (!this.isTermsAndConditionsEnabled) {
      this.TandCList = [];
      openModal(this.TandCList);
      return;
    }
        this.masterService.getTandCByCondition(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.TandCList = resp.data;
              openModal(this.TandCList);
    
            } else {
              this.appSettingService.showError('Error loading Terms and Conditions');
            }
          },
          (error) => {
            this.appSettingService.showError('Error loading Terms and Conditions',error);
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

  openFollowup() {
    if (!this.housejobData) return;
    const POL = this.housejobData?.POL;
    const POD = this.housejobData?.POD;
    const FPD = this.housejobData?.FPD;
    const formattedPOL = this.getFormattedPort(POL);
    const formattedPOD = this.getFormattedPort(POD);
    const formattedFPD = this.getFormattedPort(FPD);
    this.documentSid = this.housejobData?.HouseJobSid;
    this.parentSubject = `__SUBJECT__ for House No."${this.housejobData.HBLNo}"`;
    this.parentMailbody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Kindly do the needful for "__SUBJECT__" House No."${this.housejobData.HBLNo}" booking No."${this.housejobData.BookingNo}" ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''}</p>
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

  openAuditLogs() {
    if (!this.HouseJobSid) return;
    const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'Agent Master AirWaybill Logs';
    modalRef.componentInstance.tableName = 'HouseJob';
    modalRef.componentInstance.recordId = this.HouseJobSid.toString();
    modalRef.componentInstance.screenName = 'AgentMasterAirWaybill';
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

  toggleMinimizeMaximize(){
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
      HSCode: product.value.HSCode || '',
      ShippingBillNo: product.value.ShippingBillNo || '',
      ShippingBillDate: this.datePipe.transform(product.value.ShippingBillDate) || '',
      ExternalPkg: product.value.ExternaPkg || '',
      ExternalQty: product.value.ExternlQty || '',
      GrossWeight: product.value.GrossWeight || '',
      NetWeight: product.value.NetWeight || '',
      Volume: product.value.Volume || '',
      CargoRecDate: this.datePipe.transform(product.value.CargoRecDate) || '',
      ReceivedQty: product.value.ReceivedQty || '',
      DamageQty: product.value.DamageQty || '',
      DamageRemarks: product.value.DamageRemarks || '',
      DeliveryDate: this.datePipe.transform(product.value.DeliveryDate) || '',
      DeliveredQty: product.value.DeliveredQty || ''
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
        { key: 'HSCode', label: 'HS Code' },
        { key: 'NetWeight', label: 'Net Weight' },
        { key: 'Volume', label: 'CBM' },
        { key: 'CargoRecDate', label: 'Cargo Received Date' }
      ],
      fileName: 'Booking-Products-Report',
      title: companyName
    });
  }


  getFormattedPort(code:string){
   
    if(!code) return '';
    const ourPort = (this.portList.find(p => p.PortCode === code))?.PortName;
   
    return `${ourPort} (${code})`
  }

  getFPDETA(){
    const POD = this.bookingHeader?.POD;
    const FPD = this.bookingHeader?.FPD;
    const connections : any[] = this.bookingHeader?.bookingConnection || [];
    if(POD === FPD){
      return this.datePipe.transform(this.bookingHeader?.ETA);
    } else {
      if(connections){
        return this.datePipe.transform(connections[connections.length - 1]?.ETA);
      } else {
        return 'N/A'
      }
    }
  }

  reportAndEmailModel(content:TemplateRef<any>){
    this.modalService.open(content, {
      size: 'xl',
      scrollable: false,
      windowClass: 'custom-wide-modal'
    });
  }

  generatePDFBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const element = document.getElementById('pdfContent');

      const opt: Html2PdfOptions = {
        margin: 0.5,
        filename: (this.bookingHeader?.BookingNo || 'booking') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      if (!element) return reject('No element found');

      html2pdf()
        .from(element)
        .set(opt)
        .outputPdf('blob')
        .then((blob: Blob) => resolve(blob))
        .catch((err: any) => reject(err));
    });
  }

  downloadPDF(): void {
    this.spinner.show();
    const element = document.getElementById('pdfContent');



    const opt: Html2PdfOptions = {
      margin: 0.5,
      filename: (this.bookingHeader?.BookingNo || 'booking') + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    if (!element) {
      console.error('No element found');
      return;
    }

    html2pdf().from(element).set(opt).save();
    this.spinner.hide();
  }


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
      formData.append('Subject', `Booking No.${this.bookingHeader.BookingNo} Date:${this.datePipe.transform(this.bookingHeader?.BookingDateTime)} ${ formattedPOL } - ${ formattedPOD }${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`);
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

  // Add handler for Edoc data changes
  handleEdocChange(event: any) {
    this.edocData = event.dataItems || [];   
    this.currentEdocFormValue = event.formData; 
    
  }

   // Add handler for Email data changes
  handleEmailChange(event: any) {
    this.emailData = event.dataItems || [];
    this.currentEmailFormValue = event.formData || null;
   
  }

   handleFollowUpChange(event: any) {
    
    this.followUpData = event.dataItems || [];
    this.currentFollowUpFormValue = event.formData || null;
  }

  reportDeliveryOrder() {
    const modalRef = this.modalService.open(DeliveryOrderComponent, {
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.housejobData = this.housejobData || [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.uomList = this.uomList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
    modalRef.componentInstance.TandCList = this.TandCList || [];
  }


  reportCargoArrival(withOrWithoutCharge : boolean) {
    if (this.selectedDepartmentType === "SEA" && (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL")) {
    const hasContainerMapping = this.housejobData?.Products?.some(
      (product: any) => product.MasterJobContainerSid && product.MasterJobContainerSid > 0
    );
    
    if (!hasContainerMapping) {
      this.appSettingService.showWarning(
        'Container mapping is required before generating Cargo Arrival Notice. ' +
        'Please map containers to products first.'
      );
      return;
    }
  }
    
    const modalRef = this.modalService.open(CargoArrivalComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.housejobData = this.housejobData || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
    modalRef.componentInstance.withOrWithoutCharge = withOrWithoutCharge;
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.uomList = this.uomList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.portList = this.portList || [];
  }


       reportBill(type: 'HBL' | 'HBLDraft') {
         const hasPostedInvoice = this.housejobData?.costRevenueCharges?.some(
    (charge: any) => charge.RevenueVoucherHeaderSid !== null
  );

  // For HBL (final), require posted invoice
  if (type === 'HBL' && !hasPostedInvoice) {
    this.appSettingService.showWarning(
      'Cannot print HBL without a posted invoice. ' +
      'Please post at least one revenue invoice first.'
    );
    return;
  }
         if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
    // Check if any products have ContainerMasterSid mapped
    const hasContainerMapping = this.housejobData?.Products?.some(
      (product: any) => product.MasterJobContainerSid && product.MasterJobContainerSid > 0
    );
    
    if (!hasContainerMapping) {
      this.appSettingService.showWarning(
       'No. of containers are not matching with entered container check and change it'
      );
      return;
    } 
    const hasReleaseType = this.housejobData?.Others?.some(
      (Others: any) => Others.ReleaseType && Others.ReleaseType.trim() !== ''
    );
    
    if (!hasReleaseType) {
      this.appSettingService.showWarning(
        'Release Type is required.'
      );
      return;
    }
    
    const hasVesselName = this.housejobData?.VesselName && 
                         this.housejobData.VesselName.trim() !== '';
    
    if (!hasVesselName) {
      this.appSettingService.showWarning(
        'Vessel Name is required.'
      );
      return;
    } 
    
    
    const hasVoyageNo = this.housejobData?.VoyageNo && 
                       this.housejobData.VoyageNo.trim() !== '';
    
    if (!hasVoyageNo) {
      this.appSettingService.showWarning(
        'Voyage No is required.'
      );
      return;
    }
  }
        this.selectedReport = type;
        const modalRef = this.modalService.open(HblComponent,{
          size: 'xl',
          scrollable: true,
        })
          modalRef.componentInstance.housejobData = this.housejobData || [];
          modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
          modalRef.componentInstance.agentList = this.agentList || [];
          modalRef.componentInstance.selectedReport = type;
          modalRef.componentInstance.hblCount = this.houseJobForm.get('HBLCount')?.getRawValue();
         modalRef.result.then((result) => {
           if (result === 'UPDATED') {
             const prev = Number(this.houseJobForm.get('HBLCount')?.value);

             this.houseJobForm.patchValue({
               HBLCount: prev + 1,
             });

             this.housejobData.HBLCount = prev + 1; 
           }
         });

      }




        reportShipmentProfit() {
          const modalRef=this.modalService.open(ShipmentComponent,{
             size: 'xl',
        scrollable: true,
          })
        modalRef.componentInstance.housejobData = this.housejobData || [];
        modalRef.componentInstance.chargeList = this.chargeList || [];
      
        modalRef.componentInstance.profitSummary = this.profitSummary || [];
        modalRef.componentInstance.customerWiseSummary = this.customerWiseSummary || [];
        modalRef.componentInstance.chargeWiseSummary = this.chargeWiseSummary || [];
        modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
        modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || [];
        modalRef.componentInstance.portList = this.portList || [];
    }

  reportIndeminty() {
     if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
    // Check if any products have ContainerMasterSid mapped
    const hasContainerMapping = this.housejobData?.Products?.some(
      (product: any) => product.MasterJobContainerSid && product.MasterJobContainerSid > 0
    );
    
    if (!hasContainerMapping) {
      this.appSettingService.showWarning(
        'ContainerNo. mapping is required. ' +
        'Please map containersNo'
      );
      return;
    } 
  }
    const modalRef = this.modalService.open(ImdemintyComponent,{
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.housejobData = this.housejobData || [];
  }
     reportCommericalInvoice() {
      const modalRef=this.modalService.open(CommericalInvoiceComponent,{
          windowClass:"print-landscape",
        scrollable: true,
      })
       modalRef.componentInstance.housejobData = this.housejobData || [];
        modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
        modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || [];
    }
       reportCertificateofOrgin() {
        const modalRef=this.modalService.open(CertificateOfOriginComponent,{
          size: 'xl',
      scrollable: true,
        })
        modalRef.componentInstance.housejobData = this.housejobData || [];
  }

  
    reportjobCard() {
      const modalRef = this.modalService.open(JobCardComponent,{
        size: 'xl',
        scrollable: true,
      });
      modalRef.componentInstance.housejobData = this.housejobData || [];
      modalRef.componentInstance.masterJobData = this.masterJobData;
      modalRef.componentInstance.containerTypeList = this.containerTypeList;
      // modalRef.componentInstance.masterJobContainers = this.masterJobData.containers || [];
      modalRef.componentInstance.packageTypeList = this.packageTypeList;
      modalRef.componentInstance.agentList = this.agentList;
      modalRef.componentInstance.currencyList = this.currencyList;
      modalRef.componentInstance.chargeList = this.chargeList;
      modalRef.componentInstance.profitSummary = this.profitSummary || [];
      modalRef.componentInstance.customerWiseSummary = this.customerWiseSummary || [];
      modalRef.componentInstance.chargeWiseSummary = this.chargeWiseSummary || [];
      modalRef.componentInstance.uomList = this.costEntryComponent.uomList;
      modalRef.componentInstance.portList = this.portList || [];
      modalRef.componentInstance.selectedDepartmentType = this.selectedDepartmentType || [];
    }

   reportReleaseLetter() {
        const modalRef = this.modalService.open(ReleaseLetterComponent, {
          size: 'xl',
          scrollable: true,
        });
        modalRef.componentInstance.housejobData= this.housejobData || [];
        // modalRef.componentInstance.cfsList=this.cfsList || [];
        modalRef.componentInstance.masterJobContainers = this.housejobData?.containers || [];
        modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
         modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
         modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || [];
        modalRef.componentInstance.portList = this.portList || [];
      }

  reportReleaseOrder() {
    const modalRef = this.modalService.open(ReleaseOrderComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.housejobData = this.housejobData || [];
    // modalRef.componentInstance.cfsList=this.cfsList || [];
    modalRef.componentInstance.masterJobContainers = this.housejobData?.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.salesmanList = this.salesmanList || [];
  }


    reportPackingList() {
      const modalRef = this.modalService.open(PackingListComponent, {
        size: 'xl',
        scrollable: true,
      });
      // modalRef.componentInstance.masterJobData = this.masterJobData;
      modalRef.componentInstance.housejobData = this.housejobData || [];
      // modalRef.componentInstance.masterJobContainers = this.masterJobContainers.getRawValue() || [];
      modalRef.componentInstance.masterJobContainers = this.housejobData?.containers || [];
      modalRef.componentInstance.packageTypeList = this.packageTypeList;
      modalRef.componentInstance.TandCList = this.TandCList || [];
      modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || 'LCL';
      modalRef.componentInstance.portList = this.portList || [];
    }

      reportProofofDelivery() {
      const modalRef = this.modalService.open(ProofOfDeliveryComponent, {
        size: 'xl',
        scrollable: true,
      });
      // modalRef.componentInstance.masterJobData = this.masterJobData;
      modalRef.componentInstance.housejobData = this.housejobData || [];
      // modalRef.componentInstance.masterJobContainers = this.masterJobContainers.getRawValue() || [];
      modalRef.componentInstance.masterJobContainers = this.housejobData?.containers || [];
      modalRef.componentInstance.packageTypeList = this.packageTypeList;
      modalRef.componentInstance.TandCList = this.TandCList || [];
      modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || 'LCL';
      modalRef.componentInstance.portList = this.portList || [];
      modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    }

      reportMilestoneSummary() {
        const modalRef = this.modalService.open(MilestoneSummaryComponent,{
          size: 'xl',
          scrollable: true,
        })
        modalRef.componentInstance.housejobData = this.housejobData || [];
        modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
        modalRef.componentInstance.agentList = this.agentList || [];
      }

      
      reportCFS() {
        const modalRef = this.modalService.open(CFSOutturnComponent,{
          size: 'xl',
          scrollable: true,
        })
       modalRef.componentInstance.masterJobData = this.masterJobData || [];
        modalRef.componentInstance.housejobData = this.housejobData || [];
        modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
        modalRef.componentInstance.agentList = this.agentList || [];
      }


        // sailing confirmation
      
         reportSailingConfirmation() {

           const hasContainerMapping = this.housejobData?.Products?.some(
             (product: any) => product.MasterJobContainerSid && product.MasterJobContainerSid > 0
           );
           if (!hasContainerMapping) {
             this.appSettingService.showWarning(
               'Container is not avaliable'
             );
             return;
           }
          const modalRef = this.modalService.open(SailingConfimationComponent, {
            size: 'xl',
            scrollable: true,
          });
          modalRef.componentInstance.masterJobData = this.masterJobData;
          modalRef.componentInstance.housejobData = this.housejobData || [];
          modalRef.componentInstance.containerTypeList = this.containerTypeList;
          modalRef.componentInstance.packageTypeList = this.packageTypeList;
          modalRef.componentInstance.portList = this.portList || [];
        }
      
        // Exit form

         reportExitForm() {
          const modalRef = this.modalService.open(ExitFormComponent, {
            size: 'xl',
            scrollable: true,
          });
          modalRef.componentInstance.masterJobData = this.masterJobData;
          modalRef.componentInstance.housejobData = this.housejobData || [];
          modalRef.componentInstance.containerTypeList = this.containerTypeList;
          modalRef.componentInstance.packageTypeList = this.packageTypeList;
        }


      // Delivery Note

      // reportDeliveryNote() {
      //   const modalRef = this.modalService.open(DeliveryNoteComponent,{
      //     size: 'xl',
      //     scrollable: true,
      //   })
      //   modalRef.componentInstance.housejobData =  this.housejobData || [];
      // }

      // House Air Way Bill

  reportHAWB(type: 'HAWB' | 'HAWBDraft') {
    this.selectedReportAir = type;
    const modalRef = this.modalService.open(HAWBComponent, {
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.housejobData = this.housejobData || [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.uomList = this.uomList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
    modalRef.componentInstance.chargeList = this.chargeList || [];
    modalRef.componentInstance.selectedReportAir = type;
    modalRef.componentInstance.hblCountUpdated.subscribe(() => {
      const prev = toNumber(this.houseJobForm.get('HBLCount')?.value);
      this.houseJobForm.patchValue({
        HBLCount: prev + 1
      });
      this.housejobData.HBLCount = prev + 1;
    });
  }

  reportAWAB() {
    // this.selectedReportAir = type;
    const reportData = this.buildMawbReportData();
    if (!reportData) {
      this.appSettingService.showWarning('No MAWB data found for report.');
      return;
    }

    const modalRef = this.modalService.open(MAWBComponent, {
      size: 'xl',
      scrollable: true,
    })
    
    modalRef.componentInstance.masterAirWayData = reportData;
    modalRef.componentInstance.containerTypeList = this.containerTypeList;
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
    modalRef.componentInstance.agentList = this.agentList;
    modalRef.componentInstance.currencyList = this.currencyList;
    modalRef.componentInstance.portList = this.portList;
    modalRef.componentInstance.chargeList = this.chargeList;
  }

  private buildMawbReportData(): any {
    const source = this.housejobData || this.bookingData;
    if (!source) {
      return null;
    }

    const master = source.masterJob || this.masterJobData || {};
    const masterConnections = master.masterJobConnection || source.masterJobConnection || [];
    const voyages = master.voyages || source.voyages || [];
    const houseJobs = Array.isArray(master.houseJob)
      ? master.houseJob
      : [source];

    return {
      ...master,
      MBLNo: master.MBLNo || source.MBLNo || '',
      MBLDate: master.MBLDate || source.MBLDate || null,
      MasterJobSid: master.MasterJobSid || source.MasterJobSid || null,
      MasterJobNumber: master.MasterJobNumber || source.MasterJobNumber || '',
      POL: master.POL || source.POL || '',
      POD: master.POD || source.POD || '',
      FPD: master.FPD || source.FPD || '',
      FreightPPCC: master.FreightPPCC || source.FreightTerms || source.FreightPPCC || '',
      DestinationAgent: master.DestinationAgent || source.DestinationAgent || null,
      DestinationAgentAddress: master.DestinationAgentAddress || source.AgentAddress || '',
      CommodityDescription: master.CommodityDescription || source.CommodityDescription || '',
      MarksandNumber: master.MarksandNumber || source.MarksandNumber || '',
      voyages,
      masterJobConnection: masterConnections,
      costRevenueCharges: source.costRevenueCharges || master.costRevenueCharges || [],
      houseJob: houseJobs
    };
  }


  reportAWABPreprint() {
    // this.selectedReportAir = type;
    const modalRef = this.modalService.open(AwbPreprintComponent, {
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.housejobData = this.housejobData || [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.uomList = this.uomList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
    modalRef.componentInstance.chargeList = this.chargeList || [];
    modalRef.componentInstance.agentList = this.agentList || [];
    modalRef.componentInstance.deliveryAgentList = this.deliveryAgentList || [];
    // modalRef.componentInstance.selectedReportAir = type;
    // modalRef.componentInstance.hblCountUpdated.subscribe(() => {
    //   const prev = toNumber(this.houseJobForm.get('HBLCount')?.value);
    //   this.houseJobForm.patchValue({
    //     HBLCount: prev + 1
    //   });
    //   this.housejobData.HBLCount = prev + 1;
    // });
  }
// Helper Funstion 

 getDepartmentName(DepartmentMasterSid: number) {
  if (!DepartmentMasterSid || !this.departmentList || this.departmentList.length === 0) return '';
  const department = this.departmentList.find(dep => dep.DepartmentMasterSid === DepartmentMasterSid);
  return department ? department.departmentName : '';
}
  
  getUnitCode(ChargeUomSid: number) {
   
    if (!ChargeUomSid || !this.uomList || this.uomList.length === 0) {
      return '';
    }
    const uom = this.uomList.find(item => item.UOMMasterSid === ChargeUomSid);
    
    return uom ? uom.UOMCode : '';
}

getCurrencyCode(revenueCurrencyMasterSid: number): string {
  const currency = this.currencyList.find(
    c => c.CurrencyMasterSid === revenueCurrencyMasterSid
  );
  return currency ? currency.currencyCode : '';  
}

getCurrencyCodeCost(CostCurrencyMasterSid: number): string {
  const currency = this.currencyList.find(
    c => c.CurrencyMasterSid === CostCurrencyMasterSid
  );
  return currency ? currency.currencyCode : '';  
}

// Total Amt

getTotalLocalAmount(): number {
  return (this.housejobData?.costRevenueCharges || [])
    .reduce((sum, rate) => sum + Number(rate.RevenueLocalAmount || rate.LocalAmt || 0), 0);
}

getTotalAmount(): number {
  return (this.housejobData?.costRevenueCharges || [])
    .reduce((sum, rate) => sum + Number(rate.RevenueAmount || rate.Amt || 0), 0);
}



get totalGrossWeight(): number {
  return this.housejobData?.Cargo?.reduce((sum, c) => sum + Number(c.GrossWeight || 0), 0) || 0;
}

get totalVolume(): number {
  return this.housejobData?.Cargo?.reduce((sum, c) => sum + Number(c.Volume || 0), 0) || 0;
}

get totalChargeableWeight(): number {
  return this.housejobData?.Cargo?.reduce((sum, c) => sum + Number(c.ChargeableWeight || 0), 0) || 0;
}

get totalNetWeight(): number {
  return this.housejobData?.Cargo?.reduce((sum, c) => sum + Number(c.NetWeight || 0), 0) || 0;
}



get totalSales() {
  if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
    return 0;
  }

  return this.profitSummary.reduce((sum, c) => {
    const value = Number(c.totalSales) || 0;
    return sum + value;
  }, 0);
}

get totalCost() {
  if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
    return 0;
  }

  return this.profitSummary.reduce((sum, c) => {
    const value = Number(c.totalCost) || 0;
    return sum + value;
  }, 0);
}

get profit() {
  if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
    return 0;
  }

  return this.profitSummary.reduce((sum, c) => {
    const value = Number(c.profit) || 0;
    return sum + value;
  }, 0);
}

 calculateChargeWiseProfit() {
    this.profitSummary = [];
    const rateFormValue = this.rateResult|| [];
    const data = [...rateFormValue];

    data.forEach(item => {
     
      const costAmt = parseFloat(item.CostLocalAmount);
      const revenueAmt = parseFloat(item.RevenueLocalAmount);
      const charge = this.chargeList.find(c => c.ChargeMasterSid === item.ChargeMasterSid);
      const chargeName = charge ? charge.chargeName : "Unknown";

      let existing = this.profitSummary.find(p => p.chargeName === chargeName);

      if (!existing) {
        existing = {
          chargeName,
          totalSales: 0,
          totalCost: 0,
          profit: 0,
          profitPercent: "0%"
        };
        this.profitSummary.push(existing);
      }

      // if (item.CostRevenue === "Cost") {
        existing.totalCost += item.CostDrCr === "D" ? costAmt : -costAmt;
      // }

      // if (item.CostRevenue === "Revenue") {
        existing.totalSales += item.RevenueDrCr === "C" ? revenueAmt : -revenueAmt;
      // }
    });

    this.profitSummary.forEach(p => {
      let profit: number;
      let profitPercent: number;

      if (p.totalSales > p.totalCost) {
        profit = p.totalSales - p.totalCost;
        profitPercent = p.totalSales !== 0 ? (profit / p.totalSales) * 100 : 0;
      } else {
        profit = -(p.totalCost - p.totalSales);
        profitPercent = p.totalCost !== 0 ? (profit / p.totalCost) * 100 : 0;
      }

      p.profit = profit.toFixed(2);
      p.profitPercent = profitPercent.toFixed(2) + "%";
      p.totalSales = p.totalSales.toFixed(2);
      p.totalCost = p.totalCost.toFixed(2);
    });

    
  }

  calculateCustomerWiseAmount() {
    this.customerWiseSummary = {};
    const data = this.rateResult || [];

    const costHmap = new Map<number, CustomerProfit>();
    const revenueHmap = new Map<number, CustomerProfit>();

    // --- COST SUMMARY ---
    data.forEach(item => {
      const costAmt = parseFloat(item.CostLocalAmount) || 0;
      const customerName = item.costCustomerMaster?.CustomerName || "";
      const customerId = item.costCustomerMaster?.CustomerMasterSid || 0;

      const prevData = costHmap.get(customerId);
      const amtChange = item.CostDrCr === "D" ? costAmt : -costAmt;

      if (prevData) {
        prevData.Amount += amtChange;
      } else {
        costHmap.set(customerId, {
          CustomerName: customerName,
          Amount: amtChange
        });
      }
    });

    // --- REVENUE SUMMARY ---
    data.forEach(item => {
      const revenueAmt = parseFloat(item.RevenueLocalAmount) || 0;
      const customerName = item.revenueCustomerMaster?.CustomerName || "";
      const customerId = item.revenueCustomerMaster?.CustomerMasterSid || 0;

      const prevData = revenueHmap.get(customerId);
      const amtChange = item.RevenueDrCr === "C" ? revenueAmt : -revenueAmt;

      if (prevData) {
        prevData.Amount += amtChange;
      } else {
        revenueHmap.set(customerId, {
          CustomerName: customerName,
          Amount: amtChange
        });
      }
    });

    // --- LOGS & ASSIGNMENT ---
 

    this.customerWiseSummary = {
      cost: Array.from(costHmap.values()),
      revenue: Array.from(revenueHmap.values())
    };
  }

getChargeName(ChargeMasterSid: number): string {
  if (!ChargeMasterSid) return 'N/A';
  if (!this.chargeList?.length) return 'N/A';

  const charge = this.chargeList.find(c =>
    c.ChargeMasterSid === ChargeMasterSid || c.ChargeMasterSID === ChargeMasterSid
  );

  return charge ? (charge.chargeName || charge.chargeCode || charge.chargeCode ) : 'N/A';
}

 getPCurrRevenue(chargeData: any): string {
    if (!chargeData) return '-';
    
    const localAmount = parseFloat(chargeData.RevenueLocalAmount || '0');
    const exchangeRate = parseFloat(chargeData.RevenueExchangeRate || '1');
    
    if (exchangeRate === 0) return '0.00';
    
    const usdAmount = localAmount / exchangeRate;
    return this.formatNumber(usdAmount);
  }

  // P.Curr Expense (in USD)
  getPCurrExpense(chargeData: any): string {
    if (!chargeData) return '-';
    
    const localAmount = parseFloat(chargeData.CostLocalAmount || '0');
    const exchangeRate = parseFloat(chargeData.CostExchangeRate || '1');
    
    if (exchangeRate === 0) return '0.00';
    
    const usdAmount = localAmount / exchangeRate;
    return this.formatNumber(usdAmount);
  }

  // P.Curr GP (Gross Profit in USD)
  getPCurrGP(chargeData: any): string {
    const revenue = parseFloat(this.getPCurrRevenue(chargeData)) || 0;
    const expense = parseFloat(this.getPCurrExpense(chargeData)) || 0;
    const gp = revenue - expense;
    return this.formatNumber(gp);
  }

  // Local P.Revenue (in Local Currency)
  getLocalRevenue(chargeData: any): string {
    if (!chargeData) return '-';
    return this.formatNumber(parseFloat(chargeData.RevenueLocalAmount || '0'));
  }

  // Local P.Expense (in Local Currency)
  getLocalExpense(chargeData: any): string {
    if (!chargeData) return '-';
    return this.formatNumber(parseFloat(chargeData.CostLocalAmount || '0'));
  }

  // Local P.GP (Gross Profit in Local Currency)
  getLocalGP(chargeData: any): string {
    const revenue = parseFloat(this.getLocalRevenue(chargeData)) || 0;
    const expense = parseFloat(this.getLocalExpense(chargeData)) || 0;
    const gp = revenue - expense;
    return this.formatNumber(gp);
  }

  // Helper function to format numbers
  private formatNumber(value: number): string {
    if (isNaN(value)) return '0.00';
    return value.toFixed(2);
  }


calculateTotals(): any {
  if (!this.housejobData?.costRevenueCharges) {
    return {
      totalPCurrRevenue: 0,
      totalPCurrExpense: 0,
      totalPCurrGP: 0,
      totalLocalRevenue: 0,
      totalLocalExpense: 0,
      totalLocalGP: 0
    };
  }

  let totalPCurrRevenue = 0;
  let totalPCurrExpense = 0;
  let totalLocalRevenue = 0;
  let totalLocalExpense = 0;

  this.housejobData.costRevenueCharges.forEach((chargeItem: any) => {
    totalPCurrRevenue += parseFloat(this.getPCurrRevenue(chargeItem)) || 0;
    totalPCurrExpense += parseFloat(this.getPCurrExpense(chargeItem)) || 0;
    totalLocalRevenue += parseFloat(this.getLocalRevenue(chargeItem)) || 0;
    totalLocalExpense += parseFloat(this.getLocalExpense(chargeItem)) || 0;
  });

  return {
    totalPCurrRevenue: this.formatNumber(totalPCurrRevenue),
    totalPCurrExpense: this.formatNumber(totalPCurrExpense),
    totalPCurrGP: this.formatNumber(totalPCurrRevenue - totalPCurrExpense),
    totalLocalRevenue: this.formatNumber(totalLocalRevenue),
    totalLocalExpense: this.formatNumber(totalLocalExpense),
    totalLocalGP: this.formatNumber(totalLocalRevenue - totalLocalExpense)
  };
}

handleBOEChange(event: any) {

  // You can process and save event data here
  this.markAsDirty();
}

handleVehicleChange(event: any) {

  // You can process and save event data here
  this.markAsDirty();
}
handleCustomsChange(event: any) {
  
  // You can process and save event data here
  this.markAsDirty();
}

 getTotalLocalRevenuAmount(): number {
    
    return (this.housejobData?.costRevenueCharges || [])
    .reduce((sum, rate) => sum + Number(rate.RevenueRate  || 0), 0);
  }
 
    TotalLocalAmount(): number {
         return (this.housejobData?.costRevenueCharges || [])
    .reduce((sum, rate) => sum + Number(rate.RevenueAmount  || 0), 0);
   
  }
 
    getCostAmount(): number {
        return (this.housejobData?.costRevenueCharges || [])
    .reduce((sum, rate) => sum + Number(rate.CostRate  || 0), 0);
   
  }
 
   CostAmount(): number {
       return (this.housejobData?.costRevenueCharges || [])
    .reduce((sum, rate) => sum + Number(rate.CostAmount  || 0), 0);
   
  }
 
  
 

  getSealNo(containerNo:string){
    if(!containerNo || this.masterJobContainers.length === 0){
      return "";
    }
    const sealNo = this.masterJobContainers.find(con => con.ContainerNumber === containerNo)?.LineSeal || '';
    return sealNo;
  }

  getContainerName(ContainerTypeMasterSid:number){
    
    if(!ContainerTypeMasterSid || this.containerTypeList.length === 0){
      return "";
    }
   
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }


getTotalPerUnit(): number {
  return (this.housejobData?.costRevenueCharges || [])
    .reduce((sum, rate) => sum + Number(rate.RevenueRate || rate.LocalAmt || 0), 0);
}

grossAmount(): number {
 
  const cargoList = this.housejobData?.Cargo || [];
 
  return cargoList.reduce((sum: number, item: any) => {
 
    const weight = parseFloat(item?.GrossWeight) || 0;
 
    return sum + weight;
 
  }, 0);
 
}

loadMasterJobDataForHouseJob(masterJobParams: any): void {
  
  
  // Store the master job ID
  this.masterJobId = masterJobParams.MasterJobSid;
  
  // Store the master job data to use after lookups are loaded
  this.storedMasterJobData = masterJobParams;
  
  // Show loading indicator
  this.spinner.show();
  
  // Load all necessary data first
  this.loadHeaderMandatoryParts().subscribe(() => {
    this.loadHeaderLookups().subscribe(() => {
      // Now populate the form with master job data
      this.prepopulateFromMasterJob(this.storedMasterJobData);
      this.spinner.hide();
    });
  });
}

// Add a class property to store master job data
storedMasterJobData: any;
loadMasterJobARAPData() {
    if (!this.HouseJobSid) {
        this.arapData = [];
        return;
    }

    this.arapLoading = true;
    this.operationService.getHouseJobARAPData(this.HouseJobSid).subscribe({
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



getARAPTotalAmount(): number {
    return this.arapData.reduce(
    (sum, item) => sum + Number(item.Amount || 0),
    0
  );
}

getARAPTotalLocalAmount(): number {
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
        fileName: `ARAP-Report-HouseJob-${this.housejobData?.HBLNo || 'Unknown'}`,
        title: 'AR/AP Report'
    });
}

printARAPReport() {
    // Implement print functionality
    window.print();
}
prepopulateFromMasterJob(masterJobData: any): void {
  
  
  if (!masterJobData) return;
  
  // Find the department first
  const departmentSid = Number(masterJobData.DepartmentMasterSid);
  const selectedDepartment = this.departmentList.find(
    dep => dep.DepartmentMasterSid === departmentSid
  );
  
  if (!selectedDepartment) {
    console.error('Department not found:', departmentSid);
    this.appSettingService.showWarning(`Department with ID ${departmentSid} not found in department list.`);
    return;
  }
  
  
  
  // FIRST: Set the department - this will trigger onDeptChange with the department object
  this.onDeptChange(selectedDepartment);
  
  // Wait for department change to complete before populating other fields
  setTimeout(() => {
    // Set MasterJobSid and other basic fields
    this.houseJobForm.patchValue({
      MasterJobSid: masterJobData.MasterJobSid,
      MasterJobNumber: masterJobData.MasterJobNumber || '',
      DepartmentMasterSid: departmentSid,
      MBLNo: masterJobData.MBLNo || '',
      MBLDate: masterJobData.MBLDate ? new Date(masterJobData.MBLDate) : null,
      VesselName: masterJobData.VesselName || '',
      VoyageNo: masterJobData.VoyageNo || '',
      CarrierName: masterJobData.CarrierName || '',
      HBLDate: masterJobData.MBLDate ? new Date(masterJobData.MBLDate) : null,
    }, { emitEvent: false });
    
    // Disable department field since it's from master job
    this.houseJobForm.get('DepartmentMasterSid')?.disable();
    
    // Enable vessel/voyage fields if needed
    this.houseJobForm.get('VesselName')?.enable();
    this.houseJobForm.get('VoyageMasterSid')?.enable();
    this.houseJobForm.get('VoyageNo')?.enable();
    
    // Handle POL, POD, FPD - need to convert from codes to SIDs
    if (masterJobData.POOCode || masterJobData.POO) {
      this.setPortFromCode('POO', masterJobData.POOCode || masterJobData.POO);
    }

    if (masterJobData.POLCode || masterJobData.POL) {
      this.setPortFromCode('POL', masterJobData.POLCode || masterJobData.POL);
    }
    
    if (masterJobData.PODCode || masterJobData.POD) {
      this.setPortFromCode('POD', masterJobData.PODCode || masterJobData.POD);
    }
    
    if (masterJobData.FPDCode || masterJobData.FPD) {
      this.setPortFromCode('FPD', masterJobData.FPDCode || masterJobData.FPD);
    }
    
    // Set dates
    if (masterJobData.ETA) {
      this.houseJobForm.patchValue({
        ETA: new Date(masterJobData.ETA)
      });
    }
    
    if (masterJobData.ETD) {
      this.houseJobForm.patchValue({
        ETD: new Date(masterJobData.ETD)
      });
    }
    
    // Load master job details
    if (masterJobData.MasterJobSid) {
      this.loadMasterJobDetails(masterJobData.MasterJobSid);
    }
    
    // this.appSettingService.showSuccess('Master job data loaded successfully');
  }, 300); // Increased timeout to ensure department change completes
}

private setPortFromCode(formControlName: string, portCode: string): void {
  if (!portCode || !this.portList || this.portList.length === 0) {
    console.warn(`Cannot set ${formControlName}: portCode is empty or portList not loaded`);
    return;
  }
  
  // Find port by code
  const port = this.portList.find(p => p.PortCode === portCode);
  
  if (!port) {
    console.warn(`Port not found for code: ${portCode}`);
    return;
  }
  
  
  
  // Update the form control
  this.houseJobForm.patchValue({
    [formControlName]: port.PortCode
  });
  
  // Update filtered ports
  if (formControlName === 'POL') {
    this.handlePOLChange(port,false);
  } else if (formControlName === 'POD') {
    this.handlePODChange(port,false);
  }
}
// private autoSelectVesselVoyage(vesselName: string, voyageNo: string): void {
//   if (!vesselName || this.airlineList.length === 0) return;
  
//   // Find matching vessel in the list
//   const matchingVessel = this.airlineList.find(vessel => 
//     vessel.VesselName?.toLowerCase() === vesselName.toLowerCase()
//   );
  
//   if (matchingVessel) {
//     console.log('Found matching vessel:', matchingVessel);
    
//     // Set the vessel name first
//     this.houseJobForm.patchValue({
//       VesselName: matchingVessel.VesselName,
//       VoyageNo : matchingVessel.VoyageNo,
//     });
    
//     // If voyage number matches, set it too
//     // if (voyageNo && matchingVessel.VoyageNo === voyageNo) {
//     //   this.houseJobForm.patchValue({
//     //     VoyageNo: matchingVessel.VoyageNo,
//     //     ETA: matchingVessel.ETA ? new Date(matchingVessel.ETA) : null,
//     //     ETD: matchingVessel.ETD ? new Date(matchingVessel.ETD) : null
//     //   });
//     // }
    
//     // Get voyages for this vessel
//     this.getVoyageForPortsAndVessels();
//   }
// }
 
 
 
volumeAmount(): number {
 
  const cargoList = this.housejobData?.Cargo || [];
 
  return cargoList.reduce((sum: number, item: any) => {
 
    const volume = parseFloat(item?.Volume) || 0;
 
    return sum + volume;
 
  }, 0);
 
}
 formatVesselVoyage(vessel?: string, voyage?: string): string {
 
  // both vessel and voyage present
 
  if (vessel && voyage) {
 
    return `: ${vessel} / ${voyage}`;
 
  }
 
  // only vessel present
 
  else if (vessel) {
 
    return `:<br>${vessel}`;
 
  }
 
  // only voyage present
 
  else if (voyage) {
 
    return `:<br>${voyage}`;
 
  }
 
  // none present
 
  return ':';
 
}

  getPkgTypeName(PackageTypeMasterSid:number){
    
    if(!PackageTypeMasterSid||this.packageTypeList.length===0){
      return "";
    }
    return this.packageTypeList.find(pkg=>pkg.UOMMasterSid===PackageTypeMasterSid)?.UOMName|| "";
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
 toggleProductInputType(formGroup: FormGroup, mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
  event.stopPropagation();
  const value = formGroup.get(flagCtrl)?.value;
  formGroup.get(flagCtrl)?.setValue(!value);
  formGroup.get(mainCtrl)?.reset();
}
getProductFormGroup(index: number): FormGroup {
  return this.bookingProducts.at(index) as FormGroup;
}

  onStatusChange() {
    const status = this.b['status']?.getRawValue();
    if (this.housejobData?.bookingHeader?.status === 'D' && (status === 'Active' || !status)) {
      this.appSettingService.showWarning(
        `This house cannot be set to Active.\n\nAs it's linked Booking : ${this.housejobData?.bookingHeader?.BookingNo} is already deleted.`
      );
      this.b['status']?.setValue('Suspended');
    }
  }

  closeCustomsValidationModal() {
    this.showCustomsValidationModal = false;
    this.customsValidationErrors = [];
  }

  goToCustomsTab() {
    this.closeCustomsValidationModal();
    this.selectedTab = 'Customs';
  }

  navigateToMasterJob() {
   this.router.navigate(['operation/agent-master-air-waybill/entry']);
  }

  toggleMawbInputType(event: MouseEvent): void {
  event.stopPropagation();
  const isFreeText = this.b['isMawbFreeText']?.value;
  this.b['isMawbFreeText']?.setValue(!isFreeText);
  this.houseJobForm.get('MBLNo')?.reset();
  this.lastNoMawbStockWarningKey = null;
  
  // If toggling to dropdown mode and no stock available, force back to manual
  if (!isFreeText && this.isMawbDropdownDisabled) {
    this.b['isMawbFreeText']?.setValue(true);
  }
}

private getCurrentMawbValue(): string {
  return String(this.houseJobForm.get('MBLNo')?.value ?? '').trim();
}

private showNoMawbStockWarningOnce(warningKey: string): void {
  if (this.getCurrentMawbValue() || this.lastNoMawbStockWarningKey === warningKey) {
    return;
  }

  this.lastNoMawbStockWarningKey = warningKey;
  this.toastr?.warning('No MAWB Stock Available');
}

loadMawbStock(data: any): void {
  const isAirDept = this.selectedDepartment?.departmentType?.toUpperCase() === 'AIR';
  const isAirExport = this.selectedDepartment?.ExportImport?.toUpperCase() === 'EXPORT';
  if (!isAirDept || !isAirExport || this.isMawbStockAllocationEnabled) {
    this.mawbStockList = [];
    this.mawbStockSource = 'NONE';
    this.isMawbDropdownDisabled = true;
    this.b['isMawbFreeText']?.setValue(false);
    return;
  }

  const companyId = this.currentCompany?.CompanyMasterSid;
  const branchId = this.currentBranch?.BranchMasterSid;

  // Extract optional values
  const customerId: number | null = data?.CustomerMasterSid ?? null;
  const carrierName: string | null = data?.CarrierName ?? null;
  const selectedCarrier = carrierName
    ? this.carrierList?.find(
        (carrier: any) => carrier.CustomerName?.trim().toLowerCase() === carrierName.trim().toLowerCase()
      )
    : null;

  // Resolve airlineId from the selected party using carrier and airline lookups
  const airlineId: number | null = carrierName
    ? (
        selectedCarrier?.CustomerMasterSid ??
        this.airlineList?.find(
          (a: any) =>
            a.CustomerName?.trim().toLowerCase() === carrierName.trim().toLowerCase() ||
            (selectedCarrier?.AirlineCode && a.AirlineCode === selectedCarrier.AirlineCode)
        )?.CustomerMasterSid ??
        null
      )
    : null;

  // If BOTH are null → disable immediately, no API call
  if (!customerId && !airlineId) {
    this.mawbStockList = [];
    this.mawbStockSource = 'NONE';
    this.isMawbDropdownDisabled = true;
    this.b['isMawbFreeText']?.setValue(true);
    return;
  }

  // Build payload — send null if not available
  const payload = {
    customerId: customerId,   // null → backend skips Step 1
    airlineId: airlineId,     // null → backend skips Step 2
    companyId,
    branchId
  };
  const warningKey = `${companyId ?? 'null'}|${branchId ?? 'null'}|${customerId ?? 'null'}|${airlineId ?? 'null'}`;

  this.operationService.getMawbStockForHouseJob(payload).subscribe({
    next: (resp: any) => {
      this.mawbStockSource = resp?.stockSource || 'NONE';
      if (resp?.data && Array.isArray(resp.data)) {
        this.mawbStockList = resp.data.map(stock => {
          // Find the airline name from airlineList using the Agent ID
          const airline = this.airlineList.find(a => a.CustomerMasterSid === stock.Agent);
          return {
            ...stock,
            AgentName: airline ? airline.CustomerName : `Airline ID: ${stock.Agent}` // Fallback if not found
          };
        });
      } else {
        this.mawbStockList = [];
      }

      if (this.mawbStockSource === 'NONE' || this.mawbStockList.length === 0) {
        this.isMawbDropdownDisabled = true;
        this.b['isMawbFreeText']?.setValue(true);
        this.showNoMawbStockWarningOnce(warningKey);
      } else {
        this.lastNoMawbStockWarningKey = null;
        this.isMawbDropdownDisabled = false;
        this.b['isMawbFreeText']?.setValue(false);
      }
    },
    error: (err) => {
      console.error('[MAWB Stock] Error:', err);
      this.mawbStockList = [];
      this.mawbStockSource = 'NONE';
      this.isMawbDropdownDisabled = true;
      this.b['isMawbFreeText']?.setValue(true);
    }
  });
}

private disableAllForms(): void {
    Object.keys(this.houseJobForm.controls).forEach(key => {
      if (!['status'].includes(key)) {
        this.houseJobForm.get(key)?.disable();
      }
    });

    Object.keys(this.otherForm.controls).forEach(key => {
      this.otherForm.get(key)?.disable();
    });

    Object.keys(this.cargoForm.controls).forEach(key => {
    this.cargoForm.get(key)?.disable();
  });

  this.bookingProducts.controls.forEach((productGroup: AbstractControl) => {
    const group = productGroup as FormGroup;
    Object.keys(group.controls).forEach(key => {
      group.get(key)?.disable();
    });
  });

    this.isFormDisabled = true;
  }

}




interface CustomerProfit {
  CustomerName : string,
  Amount : number
}





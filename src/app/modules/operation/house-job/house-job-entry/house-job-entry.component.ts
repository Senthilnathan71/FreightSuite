import { Component, ViewChild, TemplateRef, OnInit, Input, HostListener } from '@angular/core';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { NgbAccordionDirective, NgbAccordionModule, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { catchError, firstValueFrom, forkJoin, of, take, tap } from 'rxjs';
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
import { extractBackendErrorMessage } from 'src/app/common/error-handling/payload-validation-handler';

import { toggleFullScreen } from 'src/app/shared/fullscreenToggle';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import html2pdf from 'html2pdf.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { BookingUploadComponent } from '../../booking/booking-upload/booking-upload.component';
import { BookingData } from '../../booking/excel-parser.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { VolumetricAndCbmCalculationService } from 'src/app/core/services/volumetric-and-cbm-calculation.service';
import { CargoArrivalComponent } from '../report/cargo-arrival/cargo-arrival.component';
import { HblComponent } from '../report/HBL/hbl/hbl.component';
import { ImdemintyComponent } from '../report/imdeminty/imdeminty.component';
import { CommericalInvoiceComponent } from '../report/commerical-invoice/commerical-invoice.component';
import { CertificateOfOriginComponent } from '../report/certificate-of-origin/certificate-of-origin.component';
import { ShipmentComponent } from '../report/shipment/shipment.component';
import { DeliveryOrderComponent } from '../report/delivery-order/delivery-order.component';
import { BoeEntryComponent } from '../boe-entry/boe-entry.component';
import { ReleaseLetterComponent } from '../report/release-letter/release-letter.component';
import { ReleaseOrderComponent } from '../report/release-order/release-order.component';
import { VehicleComponent } from '../vehicle/vehicle.component';
import { CustomsComponent } from '../customs/customs.component';

import { DeliveryNoteComponent } from '../report/delivery-note/delivery-note.component';
import { HAWBComponent } from '../report/hawb/hawb.component';
import { MilestoneSummaryComponent } from '../report/milestone-summary/milestone-summary.component';
import { CFSOutturnComponent } from '../report/cfs-outturn/cfs-outturn.component';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { getDefaultTodayDate, getMaxDate,toNgbDateStruct, getMinDate, toNumber } from 'src/app/common/helper';
import { PackingListComponent } from '../report/packing-list/packing-list.component';
import { CreditValidationApiService } from '../../credit-request.service';

import { SailingConfimationComponent } from '../report/sailing-confimation/sailing-confimation.component';
import { ExitFormComponent } from '../report/exit-form/exit-form.component';
import { JobCardComponent } from '../report/job-card/job-card.component';
import { ProofOfDeliveryComponent } from '../report/proof-of-delivery/proof-of-delivery.component';
import { SafeInsertShipmentMilestone } from '../../services/shipment-milestone.service';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
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
  selector: 'app-house-job-entry',
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
    NgbAccordionModule,
    NgbAccordionDirective,
    NgbDropdownModule,
    BoeEntryComponent,
    VehicleComponent,
    CustomsComponent,
    MultiSelectComponent,
    RouterModule,
  ],
  templateUrl: './house-job-entry.component.html',
  styleUrls: ['./house-job-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class HouseJobEntryComponent  implements OnInit, HasUnsavedChanges {



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
  @ViewChild('milestoneComponent') milestoneComponent!: MilestoneComponent;
  parsedBookings: BookingData[] = [];
  showParsedData = false;
  uploadResult: any = null;
  decimalAfterPrecision = 3;
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
isTermsAndConditionsEnabled: boolean = true;
isCreditRequestCheckingEnabled: boolean = false;
// Customs pre-save validation modal
showCustomsValidationModal = false;
isFormDisabled: boolean = false;
customsValidationErrors: { recordType: string; fieldRef: string; fieldName: string; tabName?: string }[] = [];
  showCreditValidationModal = false;
  creditValidationActionLabel = '';
  creditValidationSummary: any = null;
  private weightMismatchToastState = new WeakMap<FormGroup, boolean>();
  isDirty = false;
  private formSaved = false;
  private externalDirty = false;
  private initialStateSnapshot: any = null;
  private initialProductsCount = 0;
  private initialConnectionsCount = 0;
  private initialRatesCount = 0;

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

  // Variable Declaration - Header Part
  HouseJobSid: number;
  currentMenuId: any;
  selectedDepartment: any;
  selectedDepartmentType: string;
  selectedFCLLCL: string = "LCL";
  selectedCargoMode: 'FCL' | 'LCL' | 'AIR' | 'ROAD' = 'LCL';
  isEditMode: boolean;
  bookingData: any;
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
  isSaving: boolean = false;
  isSendingSIMail: boolean = false;
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
  houseJobCargoActiveIndex = 0;
  houseJobCargoExpanded: boolean[] = [];
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
  jobType = [
    { id: 1 , name: 'Export' },
    { id: 2 , name: 'Import' },
    { id: 3 , name: 'Transhipment' }
  ]

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
  private filteredMasterJobContainerCache = new Map<string, any[]>();
  

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
isExportToImportLinked: boolean = false;
  
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
hblModalRef?: NgbModalRef;



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
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.submitHouseJob(resolve);
    });
  }

  private resetDirtyState(): void {
    this.isDirty = false;
    this.formSaved = false;
    this.externalDirty = false;
    this.houseJobForm?.markAsPristine();
    this.cargoForm?.markAsPristine();
    this.otherForm?.markAsPristine();
    this.detailForm?.markAsPristine();
    this.initialProductsCount = this.bookingProducts?.length || 0;
    this.initialConnectionsCount = this.connectionResult?.length || 0;
    this.initialRatesCount = this.rateResult?.length || 0;
    this.initialStateSnapshot = this.buildCurrentStateSnapshot();
  }

  private markAsDirty(): void {
    this.formSaved = false;
    this.recomputeDirtyState();
  }

  private markExternalDirty(): void {
    this.formSaved = false;
    this.externalDirty = true;
    this.recomputeDirtyState();
  }

  private recomputeDirtyState(): void {
    if (this.formSaved) {
      this.isDirty = false;
      return;
    }

    if (!this.initialStateSnapshot) {
      this.isDirty = this.externalDirty;
      return;
    }

    this.isDirty = this.externalDirty || !this.deepEqual(
      this.initialStateSnapshot,
      this.buildCurrentStateSnapshot()
    );
  }

  private buildCurrentStateSnapshot(): any {
    return {
      houseJobForm: this.houseJobForm?.getRawValue() ?? null,
      cargoForm: this.cargoForm?.getRawValue() ?? null,
      otherForm: this.otherForm?.getRawValue() ?? null,
      detailForm: this.detailForm?.getRawValue() ?? null,
      bookingProducts: this.bookingProducts?.getRawValue?.() ?? [],
      connectionResult: this.connectionResult ?? [],
      rateResult: this.rateResult ?? [],
      milestoneResult: this.milestoneResult ?? [],
      selectedDepartmentType: this.selectedDepartmentType ?? '',
      selectedFCLLCL: this.selectedFCLLCL ?? '',
    };
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }

    if (typeof value === 'number') {
      return Number(value.toFixed(6));
    }

    if (Array.isArray(value)) {
      return value.map(v => this.normalizeValue(v));
    }

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

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
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
    private volumetricAndCbmCalculationService: VolumetricAndCbmCalculationService,
    private creditValidationApiService: CreditValidationApiService,
    private emailTriggerService: EmailTriggerService,
    public mps: MenuPermissionService
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
  this.currentBranch = this.appSettingService.getCurrentBranchInfo();

  this.currentFinacialYear = this.appSettingService.getCurrentFinancialYear();
  this.startFinanceYr = this.currentFinacialYear?.StartDate ? new Date(this.currentFinacialYear.StartDate) : null;
  this.endFinanceYr = this.currentFinacialYear?.EndDate ? new Date(this.currentFinacialYear.EndDate) : null;
  
  this.filterOption = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentCompany?.BranchMasterSid,
  };
  this.currentMenuId = this.mps.getMenuId();
  this.mps.init().subscribe();
  this.loadTermsAndConditionsConfig();
  this.loadCreditRequestCheckingConfig();
  this.initBookingForm();
  this.initCargoForm();
  this.initOtherForm();
  this.initDetailsForm();
  this.setupMBLDateListener();
  this.spinner.show();
  

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
    this.houseJobForm = this.fb.group({
      MasterJobSid : [null],
      BookingNo: [{ value:'', disabled: true }],
      BookingDateTime: [defaultBookingDate],
      BookingHeaderSid: [null],
      DepartmentMasterSid: [{ value: null, disabled: true }, [Validators.required]],
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
      HBLNo: [''],
      HBLDate: [{value : defaultHBLDate, disabled: true}],
      MBLNo: [{ value: '', disabled: true }],
      MBLDate: [{ value: '', disabled: true }],
      status: ['Active'],
      isShipperFreeText: [false],
    isConsigneeFreeText: [false],
    isNotifyFreeText: [false],
    isCarrierFreeText: [false],
    isVesselFreeText: [false],
    isVoyageFreeText: [false],
  MasterJobNumber: [{ value: '', disabled: true }],
      VesselName: [{ value: null, disabled: true }],
      VoyageMasterSid: [{ value: null, disabled: true }],
      VoyageNo: [{ value: null, disabled: true }],
      ETA: [{ value: null, disabled: true }],
      ETD: [{ value: null, disabled: true }],
      POO: [""],
      POL: [{ value: null, disabled: true }, [Validators.required]],
      POD: [{ value: null, disabled: true }, [Validators.required]],
      POLTerminal: [''],
      PODTerminal: [''],
      // FPD: [{ value: null, disabled: true }],
      FPD:[''],
      MovementType: [null],
      DoValid: [{ value: '', disabled: true }],
      FreightTerms : [null],
      JobType: [null],
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
      if (!this.isPatching) {
        this.recomputeDirtyState();
      }
    })
  }

  // Cargo Form Initiation
  initCargoForm() {
    this.cargoForm = this.createCargoGroup();
    this.setupCargoFormValueSubscription(this.cargoForm);
  }

  private setupCargoFormValueSubscription(cargoGroup: FormGroup): void {
    cargoGroup.valueChanges.subscribe(() => {
      this.syncFormValueWithRateComponent();
      if (cargoGroup.dirty) {
        this.formSaved = false;
      }
      if (!this.isPatching) {
        this.recomputeDirtyState();
      }
    });
  }

  private setupCargoCalculationSubscriptions(cargoGroup: FormGroup): void {
    cargoGroup.get('GrossWeight')?.valueChanges.subscribe(() => {
      if (!this.isPatching) {
        this.setOrResetWeightError(cargoGroup);
        this.calculateChargeableWeight(cargoGroup);
      }
    });
    cargoGroup.get('NetWeight')?.valueChanges.subscribe(() => {
      if (!this.isPatching) {
        this.setOrResetWeightError(cargoGroup);
      }
    });
    cargoGroup.get('Volume')?.valueChanges.subscribe(() => {
      if (!this.isPatching) {
        this.calculateChargeableWeight(cargoGroup);
      }
    });
    cargoGroup.get('Volumetric')?.valueChanges.subscribe(() => {
      if (!this.isPatching) {
        this.calculateChargeableWeight(cargoGroup);
      }
    });
  }

  private createCargoGroup(data?: any, isPatching: boolean = false): FormGroup {
    const isFclMode = this.selectedCargoMode === 'FCL';
    const cargoGroup = this.fb.group({
      HouseJobCargoSid: [data?.HouseJobCargoSid || null],
      CargoType: [data?.CargoType || 'General', Validators.required],
      ContainerType: [data?.ContainerType || null, isFclMode ? [Validators.required] : []],
      NoofContainers: [data?.NoofContainers ?? ''],
      GrossWeight: [data?.GrossWeight ?? '', Validators.required],
      NetWeight: [data?.NetWeight ?? ''],
      Volume: [data?.Volume ?? ''],
      Volumetric: [data?.Volumetric ?? ''],
      ChargeableWeight: [data?.ChargeableWeight ?? ''],
      NoOfPackage: [data?.NoOfPackage ?? ''],
      ShipmentTerms: [data?.ShipmentTerms || null],
      MovementType: [data?.MovementType || null],
      FreightTerms: [data?.FreightTerms || null],
      CommodityDescription: [data?.CommodityDescription || ''],
      MarksAndNumber: [data?.MarksAndNumber || ''],
      LandedMarksandNumber: [data?.LandedMarksandNumber || ''],
      ModeOfTransport: [data?.ModeOfTransport || null],
      StuffingAt: [data?.StuffingAt || 'Dock'],
      bookingProducts: this.fb.array([])
    });

    this.setupCargoCalculationSubscriptions(cargoGroup);
    this.setupCargoFormValueSubscription(cargoGroup);

    if (isPatching) {
      cargoGroup.markAsPristine();
    }

    return cargoGroup;
  }

  private calculateChargeableWeight(cargoGroup: FormGroup = this.cargoForm): void {
  // During patching, don't recalculate - use the patched value
  if (this.isPatching || this.chargeableWeightManualOverride) {
    return;
  }

  const volumetric = Number(cargoGroup.get('Volumetric')?.value) || 0;
  const volume = Number(cargoGroup.get('Volume')?.value) || 0;
  const grossWeight = Number(cargoGroup.get('GrossWeight')?.value) || 0;

  let chargeableWeight = 0;

  if (this.selectedCargoMode === 'ROAD') {
    return;
  }

  // Match booking logic:
  // AIR/LCL => compare Volumetric vs Gross Weight
  // Others => compare Volume vs Gross Weight
  if (this.selectedCargoMode === 'AIR' || this.selectedCargoMode === 'LCL') {
    chargeableWeight = Math.max(volumetric, grossWeight);
  } else {
    chargeableWeight = Math.max(volume, grossWeight);
  }

  const currentValue = Number(cargoGroup.get('ChargeableWeight')?.value) || 0;
  if (Math.abs(chargeableWeight - currentValue) > 0.001) {
    cargoGroup.get('ChargeableWeight')?.setValue(
      chargeableWeight > 0 ? Number(chargeableWeight.toFixed(this.decimalAfterPrecision)) : '',
      { emitEvent: false }
    );
  }
}
// 🔥 ADD HERE
private validateContainerWeight(): boolean {

  const containerMap = new Map<number, number>();

  this.houseJobCargos.controls.forEach((cargoGroup: FormGroup) => {
    const products = cargoGroup.get('bookingProducts') as FormArray;

    products.controls.forEach((product: FormGroup) => {

      const containerSid = product.get('MasterJobContainerSid')?.value;
      const grossWeight = Number(product.get('GrossWeight')?.value) || 0;

      if (!containerSid) return;

      containerMap.set(
        containerSid,
        (containerMap.get(containerSid) || 0) + grossWeight
      );
    });
  });

  // 🔥 VALIDATION
  for (let [containerSid, totalWeight] of containerMap.entries()) {

    const container = this.masterJobContainers.find(
  c => Number(c.MasterJobContainerSid) === Number(containerSid)
);

if (!container) continue;

const containerType = this.containerTypeList.find(
  ct => Number(ct.ContainerTypeMasterSid) === Number(container.ContainerType)
);

// 🔥 USE THIS (IMPORTANT)
const maxWeight = Number(containerType?.GrossWeight) || 0;

if (totalWeight > maxWeight) {
  this.appSettingService.showError(
    `Container ${container.ContainerNumber} exceeded limit. Max: ${maxWeight}, Entered: ${totalWeight}`
  );
  return false;
}
  }

  return true;
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
    return this.usesDimensionalCargoFields();
}

  // Product Form Initialization
  initProductForm() {
    const isAirOrLCL = this.usesDimensionalCargoFields();
    this.productForm = this.fb.group({
      HouseJobProductSid: [null],
      ProductName: [null,[Validators.required]],
      isProductFreeText: [false],
      ShippingBillNo: [''],
      ShippingBillDate: [null],
      ExternaPkg: [null,[Validators.required]],
      ExternlQty: ['', [Validators.required]],
      GrossWeight: ['', [Validators.required]],
      NetWeight: ['', [Validators.min(0)]],
      Volume: ['', this.isSurfaceCargoMode() ? [] : [Validators.required,Validators.min(0.001)]],
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

  const activeCargo = this.houseJobCargos?.at(this.houseJobCargoActiveIndex) as FormGroup | undefined;
  const selectedContainer = this.masterJobContainers.find(
    container => Number(container.MasterJobContainerSid) === Number(containerSid)
  );

  if (!selectedContainer) {
    this.productForm.get('MasterJobContainerSid')?.setValue(null, { emitEvent: false });
    this.productForm.get('ContainerNo')?.setValue('');
    this.appSettingService.showWarning('Container Number must be selected from Master Job Containers.');
    return;
  }

  const cargoContainerType = this.normalizeContainerTypeValue(activeCargo?.get('ContainerType')?.value);
  const masterContainerType = this.normalizeContainerTypeValue(
    selectedContainer?.ContainerType ?? selectedContainer?.ContainerTypeMasterSid
  );
  if (cargoContainerType && masterContainerType && cargoContainerType !== masterContainerType) {
    this.productForm.get('MasterJobContainerSid')?.setValue(null, { emitEvent: false });
    this.productForm.get('ContainerNo')?.setValue('');
    this.appSettingService.showWarning('Selected Container Number does not match the Cargo Container Type.');
    return;
  }

  this.productForm.get('ContainerNo')?.setValue(selectedContainer.ContainerNumber || '');
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
  
  if (!this.usesDimensionalCargoFields()) {
    return;
  }
  
  
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
    if (!this.usesDimensionalCargoFields()) {
      productForm.get('Volumetric')?.setValue('', { emitEvent: false });
      return;
    }
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
      IATARate: [''],
      PlaceofSupply: [''],
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
      if (!this.isPatching) {
        this.formSaved = false;
        this.recomputeDirtyState();
      }
    });
  }

  initDetailsForm() {
    this.detailForm = this.fb.group({
      houseJobCargo: this.fb.array([]),
      bookingProducts: this.fb.array([]),
    })
    this.detailForm.valueChanges.subscribe(() => {
      if (!this.isPatching) {
        this.formSaved = false;
        this.recomputeDirtyState();
      }
    });

    if (this.cargoForm) {
      this.houseJobCargos.push(this.cargoForm);
      this.houseJobCargoExpanded = [true];
      this.houseJobCargoActiveIndex = 0;
    }
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
    const activeCargo = this.houseJobCargoActiveIndex >= 0
      ? this.houseJobCargos?.at(this.houseJobCargoActiveIndex) as FormGroup | undefined
      : undefined;
    return (activeCargo?.get('bookingProducts') as FormArray) || (this.detailForm.get('bookingProducts') as FormArray);
  }
  get houseJobCargos(): FormArray {
    return this.detailForm.get('houseJobCargo') as FormArray;
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
    const isAirOrLCL = this.usesDimensionalCargoFields();
    const productForm = this.fb.group({
      HouseJobProductSid: [data?.HouseJobProductSid || null],
      ProductName: [data?.ProductName || null,[Validators.required]],
      isProductFreeText: [data?.isProductFreeText || false],
      ShippingBillNo: [data?.ShippingBillNo || ''],
      ShippingBillDate: [data?.ShippingBillDate ? new Date(data?.ShippingBillDate) : null],
      ExternaPkg: [data?.ExternaPkg || null, [Validators.required]],
      ExternlQty: [data?.ExternlQty || '', [Validators.required]],
      GrossWeight: [Number(data?.GrossWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.required,Validators.min(0.001)]],
      NetWeight: [Number(data?.NetWeight || '').toFixed(this.digitsAfterDecimal) || '', [Validators.min(0)]],
      Volume: [Number(data?.Volume || '').toFixed(this.digitsAfterDecimal) || '', this.isSurfaceCargoMode() ? [] : [Validators.required,Validators.min(0.001)]],
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
  
  const isLCLorAIR = this.usesDimensionalCargoFields();
    if (isLCLorAIR) {
    // Always setup calculations for LCL/AIR
    this.setupProductFormImmediateCalculation(productForm);
    this.setupImmediateVolumetricCalculationForFormArray(productForm);
    
    // If we have data with volume, trigger calculation AFTER form is stable
    // This allows the patched value to be set first, then calculations take over
    if (!isPatching && data && (data.Length || data.Width || data.Height)) {
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
  const isLCLorAIR = this.usesDimensionalCargoFields();
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

  const cargoIndex = this.getCargoIndexForProductForm(productForm);
  const selectedContainer = this.masterJobContainers.find(
    container => Number(container.MasterJobContainerSid) === Number(containerSid)
  );

  if (!selectedContainer) {
    productForm.get('MasterJobContainerSid')?.setValue(null, { emitEvent: false });
    productForm.get('ContainerNo')?.setValue('');
    this.appSettingService.showWarning('Container Number must be selected from Master Job Containers.');
    return;
  }

  const cargoGroup = this.houseJobCargos?.at(cargoIndex) as FormGroup | undefined;
  const cargoContainerType = this.normalizeContainerTypeValue(cargoGroup?.get('ContainerType')?.value);
  const masterContainerType = this.normalizeContainerTypeValue(
    selectedContainer?.ContainerType ?? selectedContainer?.ContainerTypeMasterSid
  );
  if (cargoContainerType && masterContainerType && cargoContainerType !== masterContainerType) {
    productForm.get('MasterJobContainerSid')?.setValue(null, { emitEvent: false });
    productForm.get('ContainerNo')?.setValue('');
    this.appSettingService.showWarning('Selected Container Number does not match the Cargo Container Type.');
    return;
  }

  productForm.get('ContainerNo')?.setValue(selectedContainer.ContainerNumber || '');
}
private calculateProductFormCBMAndVolumetric(productForm: FormGroup) {
    if (this.isPatching) {
    return;
  }
  if (!this.usesDimensionalCargoFields()) {
    productForm.get('Volume')?.setValue('', { emitEvent: false });
    productForm.get('Volumetric')?.setValue('', { emitEvent: false });
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
      this.handleProductRelatedCalculation(this.getCargoIndexForProductForm(productForm));
    }, 100);
  } else {
    productForm.get('Volume')?.setValue('', { emitEvent: false });
    productForm.get('Volumetric')?.setValue('', { emitEvent: false });
  }
}

private getCargoIndexForProductForm(productForm: FormGroup): number {
  const cargoGroup = productForm.parent?.parent as FormGroup | undefined;
  return cargoGroup ? this.houseJobCargos.controls.indexOf(cargoGroup) : -1;
}

logProduct(index: number, cargoIndex: number = -1): void {
  const productForm = cargoIndex >= 0
    ? this.houseJobCargoProducts(cargoIndex).at(index) as FormGroup
    : this.bookingProducts.at(index) as FormGroup;
  if (!productForm) {
    return;
  }

  if (this.usesDimensionalCargoFields()) {
    this.calculateProductFormCBMAndVolumetric(productForm);
  }
  this.handleProductRelatedCalculation(cargoIndex);
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
    if (this.isExportToImportLinked) {
      this.appSettingService.showInfo('Product entry is locked for export-to-import linked house jobs.');
      return;
    }
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

  const countrySid = this.currentCompany?.CountryMasterSid;
  return forkJoin({
    departments: this.operationService.getAllDepartments(CompanyMasterSid).pipe(catchError(err => of([]))),
    customers: this.operationService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(err => of([]))),
    ports: this.operationService.getAllPorts().pipe(catchError(err => of([]))),
    
  }).pipe(tap(({ 
      departments, customers, ports    }) => {
    if (!this.isEditMode) {
      this.spinner.hide();
    }
    this.departmentList = departments.data;
    this.customerList = customers;
  
    this.portList = (ports.data || []).map(p => ({ ...p, Country: p.countryMaster?.countryName }));
  }));
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
          }, { emitEvent: false });
          
          
        } else if (this.blClauseOptions.length === 0) {
         
          // Clear the field if no clauses found
          this.otherForm.patchValue({
            BlClause: ''
          }, { emitEvent: false });
        }
      } else {
        this.blClauseOptions = [];
       
        // Clear the field
        this.otherForm.patchValue({
          BlClause: ''
        }, { emitEvent: false });
      }
    },
    error: (error) => {
      console.error('Error loading default BL clauses:', error);
      this.blClauseOptions = [];
      this.otherForm.patchValue({
        BlClause: ''
      }, { emitEvent: false });
      
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

get isSuspended() : boolean {
    return this.housejobData?.status === 'S';
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
    this.operationService.getHouseJobById(HouseJobSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          // this.resetForm();
          this.patchValues(resp.data);
          this.loadAllMasterJobContainers();
          this.bookingData = resp.data;
          this.housejobData = resp.data;
          this.loadMasterJobARAPData();
         
          this.minDate = undefined;
          const HBLDate = this.housejobData?.HBLDate ? new Date(this.housejobData?.HBLDate) : undefined;
          this.minDODate = HBLDate ? this.toNgbDateStruct(HBLDate) : undefined;
          this.minSIConfirmationDate = HBLDate ? this.toNgbDateStruct(HBLDate) : undefined;
          this.minDGConfirmationDate = HBLDate ? this.toNgbDateStruct(HBLDate) : undefined;
          this.setMinMaxDateConditions();
          // ✅ Update the formData for child components
          this.commonFormValue = {
            HouseJobSid: resp.data.HouseJobSid, // 👈 from backend response
            CompanyMasterSid: resp.data.CompanyMasterSid,
            BranchMasterSid: resp.data.BranchMasterSid,
            CreatedBy: this.userData['userEmail'],
            UpdatedBy: this.userData['userEmail']
          };

          // ✅ Extract BOE records for the current house job
          this.boeDataArray = resp.data.houseJobBOE || [];
          this.vehicleDataArray = resp.data.houseJobVehicle || [];
          this.customsDataArray = resp.data.houseJobCustoms || [];

          // ✅ Trigger reload for child components like BOE
          this.resetTriggerBOE = true;
          this.resetDirtyState();
        }
      }
    )
  }
private loadMasterJobDetails(masterJobSid: number): void {
  const payload = {
    screenName : 'Master Job',
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
    this.isExportToImportLinked = response?.masterJob?.others?.[0]?.ExportToImport === 'Y';
    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    const shouldDisableForms = (this.isEditMode && response.status !== 'A');
    this.selectedDepartment = selectedDepartment;
    this.selectedDepartmentType = selectedDepartment?.departmentType?.toUpperCase() || '';
    this.filterTabs();

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

    this.PODandFPODsame = response.POD === response.FPD;
    const cargoItems = Array.isArray(response?.Cargo) && response.Cargo.length
      ? response.Cargo
      : Array.isArray(response?.houseJobCargo) && response.houseJobCargo.length
        ? response.houseJobCargo
        : [{
          ...(response?.Cargo?.[0] || response?.houseJobCargo?.[0] || {})
        }];
    const flatProducts = Array.isArray(response?.Products)
      ? response.Products
      : Array.isArray(response?.houseJobProduct)
        ? response.houseJobProduct
        : [];

    this.houseJobCargos.clear();
    this.houseJobCargoExpanded = [];

    cargoItems.forEach((cargoData: any, cargoIndex: number) => {
      const cargoGroup = this.createCargoGroup({
        ...cargoData,
        HouseJobCargoSid: cargoData?.HouseJobCargoSid || cargoData?.houseJobCargoSid || null,
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
        CommodityDescription: cargoData?.CommodityDescription,
        MarksAndNumber: cargoData?.MarksAndNumber,
        LandedMarksandNumber: cargoData?.LandedMarksandNumber,
        ModeOfTransport: cargoData?.ModeOfTransport,
        StuffingAt: cargoData?.StuffingAt
      }, true);

      const explicitCargoProducts = Array.isArray(cargoData?.bookingProducts)
        ? cargoData.bookingProducts
        : Array.isArray(cargoData?.bookingProduct)
          ? cargoData.bookingProduct
          : Array.isArray(cargoData?.products)
            ? cargoData.products
            : [];
      const cargoProducts = explicitCargoProducts.length
        ? explicitCargoProducts
        : flatProducts.filter((product: any) => {
            const productCargoSid = Number(product?.HouseJobCargoSid || product?.houseJobCargoSid || 0) || null;
            const currentCargoSid = Number(cargoData?.HouseJobCargoSid || cargoData?.houseJobCargoSid || 0) || null;
            if (!productCargoSid && cargoIndex === 0) {
              return true;
            }
            return productCargoSid && currentCargoSid && productCargoSid === currentCargoSid;
          });

      cargoProducts.forEach((product: any) => {
        (cargoGroup.get('bookingProducts') as FormArray).push(this.createBookingProductGroup(product, true));
      });

      this.houseJobCargos.push(cargoGroup);
      this.houseJobCargoExpanded.push(cargoIndex === 0);
    });

    if (this.houseJobCargos.length > 0) {
      this.houseJobCargoActiveIndex = 0;
      this.cargoForm = this.houseJobCargos.at(0) as FormGroup;
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
        IATARate: otherData?.IATARate,
        PlaceofSupply: otherData?.PlaceOfSupply,
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

    this.productDataLength = flatProducts.length;
    if (shouldDisableForms) {
      this.disableAllForms();
      if (this.isEditMode && response.status !== 'A') {
        this.houseJobForm.get('status')?.disable();
      }
    }
    this.updateProductPagination();

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
    this.applyExportToImportFieldLocks();
    this.applyProductTabLocks();
    
    setTimeout(() => {
      const otherData = response.Others[0];
      if (otherData?.BlClause) {
        this.otherForm.patchValue({
          BlClause: otherData?.BlClause || null,
        }, { emitEvent: false });
      } else if (!this.isEditMode && this.blClauseOptions.length > 0) {
        const allClausesText = this.blClauseOptions
          .map(clause => clause.ClauseDescription)
          .join('\n\n');
        
        this.otherForm.patchValue({
          BlClause: allClausesText
        }, { emitEvent: false });
      }
    }, 500);

  } catch (error) {
    console.error('Error during patch:', error);
  } finally {
    // CRITICAL FIX: Reset isPatching flag AFTER a longer delay to ensure all patching completes
    setTimeout(() => {
      this.isPatching = false;
    }, 1000); // Increased from 100ms to 1000ms
  }
}

private applyExportToImportFieldLocks(): void {
  if (!this.houseJobForm) {
    return;
  }

  const lockFields = ['ConsigneeName', 'ConsigneeAddress', 'Notify', 'NotifyAddress'];
  const shouldKeepDisabled = this.isFormDisabled || (this.isEditMode && this.isSuspended);
  if (this.isExportToImportLinked || shouldKeepDisabled) {
    lockFields.forEach(field => this.houseJobForm.get(field)?.disable({ emitEvent: false }));
    if (this.isExportToImportLinked) {
      this.houseJobForm.patchValue({
        isConsigneeFreeText: false,
        isNotifyFreeText: false,
      }, { emitEvent: false });
    }
  } else {
    lockFields.forEach(field => this.houseJobForm.get(field)?.enable({ emitEvent: false }));
  }
}

  private applyCargoTabLocks(): void {
  if (!this.houseJobCargos?.length) {
    return;
  }

  this.houseJobCargos.controls.forEach((cargoControl: AbstractControl) => {
    if (this.isExportToImportLinked || this.isFormDisabled || (this.isEditMode && this.isSuspended)) {
      cargoControl.disable({ emitEvent: false });
    } else {
      cargoControl.enable({ emitEvent: false });
    }
  });
  }

  private applyProductTabLocks(): void {
  if (this.productForm) {
    if (this.isExportToImportLinked || this.isFormDisabled || (this.isEditMode && this.isSuspended)) {
      this.productForm.disable({ emitEvent: false });
    } else {
      this.productForm.enable({ emitEvent: false });
    }
  }

  if (!this.houseJobCargos?.length) {
    return;
  }

  this.houseJobCargos.controls.forEach((cargoControl: AbstractControl) => {
    const cargoGroup = cargoControl as FormGroup;
    const productArray = cargoGroup.get('bookingProducts') as FormArray;
    productArray.controls.forEach(control => {
      if (this.isExportToImportLinked || this.isFormDisabled || (this.isEditMode && this.isSuspended)) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });
  });
  }

  onContainerTypeChange(containerType : any){
    this.onContainerTypeChangeForCargo(containerType, this.houseJobCargoActiveIndex);
  }

  onContainerTypeChangeForCargo(containerType: any, cargoIndex: number): void {
    if (!this.detailForm) {
      this.selectedContainerType = containerType || '';
      return;
    }
    const normalizedCargoIndex = cargoIndex >= 0 ? cargoIndex : this.houseJobCargoActiveIndex;
    const targetCargo = this.houseJobCargos.at(normalizedCargoIndex) as FormGroup;
    if (!targetCargo) {
      this.selectedContainerType = containerType || '';
      return;
    }

    // Do not write back ContainerType here; ng-select already updates the form control.
    // Writing value in change handler can break selection when event payload shape differs.
    const selectedType = this.normalizeContainerTypeValue(targetCargo.get('ContainerType')?.value);
    this.selectedContainerType = selectedType || '';
    this.clearFilteredMasterJobContainerCache();

    const bookingProducts = targetCargo.get('bookingProducts') as FormArray;
    bookingProducts.controls.forEach((productControl) => {
      productControl.get('MasterJobContainerSid')?.setValue(null, { emitEvent: false });
      productControl.get('ContainerNo')?.setValue('', { emitEvent: false });
      productControl.get('MasterJobContainerSid')?.markAsTouched();
      productControl.get('MasterJobContainerSid')?.updateValueAndValidity({ emitEvent: false });
    });

    if (this.houseJobCargoActiveIndex === normalizedCargoIndex && this.productForm) {
      this.productForm.get('MasterJobContainerSid')?.setValue(null, { emitEvent: false });
      this.productForm.get('ContainerNo')?.setValue('', { emitEvent: false });
      this.productForm.get('MasterJobContainerSid')?.updateValueAndValidity({ emitEvent: false });
    }
  }

  getFilteredMasterJobContainers(cargoIndex?: number): any[] {
    if (!this.detailForm) {
      return this.masterJobContainers;
    }
    const indexToUse = typeof cargoIndex === 'number' ? cargoIndex : this.houseJobCargoActiveIndex;
    const targetCargo = this.houseJobCargos?.at(indexToUse) as FormGroup | undefined;
    const selectedContainerType = this.normalizeContainerTypeValue(
      targetCargo?.get('ContainerType')?.value ?? this.cargoForm?.get('ContainerType')?.value
    );

    if (!selectedContainerType) {
      return this.masterJobContainers;
    }
    const cacheKey = `${indexToUse}|${selectedContainerType}|${this.masterJobContainers.length}`;
    const cached = this.filteredMasterJobContainerCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const filtered = this.masterJobContainers.filter(
      (container) => Number(container?.ContainerType) === Number(selectedContainerType)
    );
    this.filteredMasterJobContainerCache.set(cacheKey, filtered);
    return filtered;
  }

  private normalizeContainerTypeValue(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'object') {
      const candidate = value.ContainerTypeMasterSid ?? value.ContainerType ?? value.id ?? null;
      if (candidate === null || candidate === undefined || candidate === '') {
        return null;
      }
      const parsed = Number(candidate);
      return Number.isNaN(parsed) ? null : parsed;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private clearFilteredMasterJobContainerCache(): void {
    this.filteredMasterJobContainerCache.clear();
  }

  private parseNumberSafe(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getContainerTypeLabel(container: any): string {
    const typeSid = this.normalizeContainerTypeValue(
      container?.ContainerType ?? container?.ContainerTypeMasterSid
    );
    const typeName = container?.ContainerName
      || this.containerTypeList.find((ct: any) => Number(ct?.ContainerTypeMasterSid) === Number(typeSid))?.ContainerName
      || 'Container';
    return String(typeName).trim();
  }

  private getContainerTypeMasterData(container: any): any {
    const typeSid = this.normalizeContainerTypeValue(
      container?.ContainerType ?? container?.ContainerTypeMasterSid
    );
    if (!typeSid) {
      return null;
    }
    return this.containerTypeList.find((ct: any) => Number(ct?.ContainerTypeMasterSid) === Number(typeSid)) || null;
  }

  private validateContainerCapacityRules(
    pendingProduct?: { cargoIndex: number; productIndex: number; value: any }
  ): boolean {
    const containerWiseTotals = new Map<number, { container: any; gross: number; volume: number }>();
    const allProducts: Array<{ cargoIndex: number; value: any }> = [];

    this.houseJobCargos.controls.forEach((cargoControl: AbstractControl, cargoIndex: number) => {
      const cargoGroup = cargoControl as FormGroup;
      const products = cargoGroup.get('bookingProducts') as FormArray;
      products.getRawValue().forEach((product: any, productIndex: number) => {
        if (
          pendingProduct &&
          pendingProduct.cargoIndex === cargoIndex &&
          pendingProduct.productIndex === productIndex
        ) {
          allProducts.push({ cargoIndex, value: pendingProduct.value });
          return;
        }
        allProducts.push({ cargoIndex, value: product });
      });
    });

    if (pendingProduct && pendingProduct.productIndex === -1) {
      allProducts.push({ cargoIndex: pendingProduct.cargoIndex, value: pendingProduct.value });
    }

    for (const item of allProducts) {
      const containerSid = Number(item?.value?.MasterJobContainerSid) || 0;
      if (!containerSid) {
        continue;
      }

      const container = this.masterJobContainers.find(
        (row: any) => Number(row?.MasterJobContainerSid) === containerSid
      );
      if (!container) {
        this.appSettingService.showWarning('Container Number must be selected from Master Job Containers.');
        return false;
      }

      const cargoGroup = this.houseJobCargos.at(item.cargoIndex) as FormGroup;
      const cargoContainerType = this.normalizeContainerTypeValue(cargoGroup?.get('ContainerType')?.value);
      const masterContainerType = this.normalizeContainerTypeValue(
        container?.ContainerType ?? container?.ContainerTypeMasterSid
      );
      if (cargoContainerType && masterContainerType && cargoContainerType !== masterContainerType) {
        this.appSettingService.showWarning('Container Type must match Master Job Container Type.');
        return false;
      }

      const bucket = containerWiseTotals.get(containerSid) || { container, gross: 0, volume: 0 };
      bucket.gross += this.parseNumberSafe(item?.value?.GrossWeight);
      bucket.volume += this.parseNumberSafe(item?.value?.Volume);
      containerWiseTotals.set(containerSid, bucket);
    }

    for (const [, totals] of containerWiseTotals) {
      const containerTypeMaster = this.getContainerTypeMasterData(totals.container);
      const grossLimit = this.parseNumberSafe(
        totals.container?.GrossWeight
        ?? totals.container?.MaxGrossWeight
        ?? containerTypeMaster?.GrossWeight
      );
      const volumeLimit = this.parseNumberSafe(
        totals.container?.MaxVolume
        ?? totals.container?.Volume
        ?? containerTypeMaster?.MaxVolume
      );
      const containerNumber = totals.container?.ContainerNumber || '';
      const containerTypeLabel = this.getContainerTypeLabel(totals.container);

      if (grossLimit > 0 && totals.gross > grossLimit) {
        this.appSettingService.showWarning(
          `Total cargo weight exceeds the allowed limit for selected container (${containerTypeLabel} - ${containerNumber})`
        );
        return false;
      }

      if (volumeLimit > 0 && totals.volume > volumeLimit) {
        this.appSettingService.showWarning(
          `Total volume exceeds container capacity (${containerTypeLabel} - ${containerNumber})`
        );
        return false;
      }
    }

    return true;
  }

  private applyFclContainerValidators(): void {
    if (!this.detailForm) {
      return;
    }
    const isFclMode = this.selectedCargoMode === 'FCL';

    this.houseJobCargos.controls.forEach((cargoControl: AbstractControl, cargoIndex: number) => {
      const cargoGroup = cargoControl as FormGroup;
      const containerTypeControl = cargoGroup.get('ContainerType');
      containerTypeControl?.setValidators(isFclMode ? [Validators.required] : []);
      containerTypeControl?.updateValueAndValidity({ emitEvent: false });

      const filteredContainers = this.getFilteredMasterJobContainers(cargoIndex);
      const bookingProducts = cargoGroup.get('bookingProducts') as FormArray;
      bookingProducts.controls.forEach((productControl) => {
        const containerSidControl = productControl.get('MasterJobContainerSid');
        containerSidControl?.setValidators([]);

        const selectedContainerSid = containerSidControl?.value;
        const isMapped = !selectedContainerSid || filteredContainers.some(
          (container) => Number(container.MasterJobContainerSid) === Number(selectedContainerSid)
        );
        if (!isMapped) {
          containerSidControl?.setValue(null, { emitEvent: false });
          productControl.get('ContainerNo')?.setValue('', { emitEvent: false });
        }

        containerSidControl?.updateValueAndValidity({ emitEvent: false });
      });
    });

    if (this.productForm) {
      const modalContainerControl = this.productForm.get('MasterJobContainerSid');
      modalContainerControl?.setValidators([]);
      modalContainerControl?.updateValueAndValidity({ emitEvent: false });
    }
  }

  openProductModal(content: TemplateRef<any>, productIndex?: number, data?: any) {
    if (this.isExportToImportLinked) {
      this.appSettingService.showInfo('Product editing is locked for export-to-import linked house jobs.');
      return;
    }
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
      }, { emitEvent: false })
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
        this.masterJobContainers = resp.data || [];
        this.clearFilteredMasterJobContainerCache();
        this.applyFclContainerValidators();
      } else {
        this.appSettingService.showError("Error loading containers");
      }
    })
  }

  onProductSubmit() {
    if (this.isExportToImportLinked) {
      this.appSettingService.showInfo('Product editing is locked for export-to-import linked house jobs.');
      return;
    }
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
    const pendingProductValue = this.productForm.getRawValue();
    const activeCargoIndex = this.houseJobCargoActiveIndex >= 0 ? this.houseJobCargoActiveIndex : 0;
    if (!this.validateContainerCapacityRules({
      cargoIndex: activeCargoIndex,
      productIndex: this.currentProductIndex,
      value: pendingProductValue
    })) {
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
    this.markAsDirty();
    this.appSettingService.showSuccess("Product saved successfully");
    this.bookingProducts.updateValueAndValidity();
    this.productDataLength = this.bookingProducts.length;
    this.handleProductRelatedCalculation();
    this.updateProductPagination();
    this.modalService.dismissAll();
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

  private getProductValidationMessage(): string {
    const hasNetWeightError = this.houseJobCargos.controls.some(cargoControl => {
      const cargoGroup = cargoControl as FormGroup;
      const productArray = cargoGroup.get('bookingProducts') as FormArray;
      return productArray.controls.some(control => {
        const productGroup = control as FormGroup;
        return productGroup.get('NetWeight')?.hasError('netGreaterThanGross')
          || productGroup.get('GrossWeight')?.hasError('grossLessThanNet');
      });
    }) || this.bookingProducts.controls.some(control => {
      const productGroup = control as FormGroup;
      return productGroup.get('NetWeight')?.hasError('netGreaterThanGross')
        || productGroup.get('GrossWeight')?.hasError('grossLessThanNet');
    });

    if (hasNetWeightError) {
      return 'Net Weight cannot be greater than Gross Weight';
    }

    return 'Please fill all required product fields correctly.';
  }

  private logInvalidProductControls(): void {
    const invalidLogs: Array<{ cargoIndex: number; productIndex: number; field: string; errors: any; value: any }> = [];

    this.houseJobCargos.controls.forEach((cargoControl, cargoIndex) => {
      const cargoGroup = cargoControl as FormGroup;
      const productArray = cargoGroup.get('bookingProducts') as FormArray;

      productArray.controls.forEach((control, productIndex) => {
        const productGroup = control as FormGroup;
        Object.keys(productGroup.controls).forEach((field) => {
          const ctrl = productGroup.get(field);
          if (ctrl?.invalid) {
            invalidLogs.push({
              cargoIndex,
              productIndex,
              field,
              errors: ctrl.errors,
              value: ctrl.value
            });
          }
        });
      });
    });

    if (invalidLogs.length) {
      console.warn('Invalid product controls on save:', invalidLogs);
    }
  }

  private getHouseJobFieldLabel(fieldName: string): string {
    const fieldLabels: Record<string, string> = {
      DepartmentMasterSid: 'Department',
      CustomerMasterSid: 'Customer',
      CustomerAddress: 'Customer Address',
      ShipperName: 'Shipper Name',
      ShipperAddress: 'Shipper Address',
      ConsigneeName: 'Consignee Name',
      ConsigneeAddress: 'Consignee Address',
      AgentName: 'Agent Name',
      DestinationAgent: 'Destination Agent',
      POL: 'POL',
      POD: 'POD',
      FPD: 'FPD',
      IncoTerms: 'Inco Terms',
      HBLNo: 'HBL No',
      HBLDate: 'HBL Date',
      status: 'Status',
      HouseStatus: 'House Status',
      CargoType: 'Cargo Type',
      GrossWeight: 'Gross Weight'
    };

    return fieldLabels[fieldName] || fieldName;
  }

  private getHouseJobInvalidFields(): string[] {
    const invalidFields: string[] = [];

    Object.keys(this.houseJobForm.controls).forEach(key => {
      const control = this.houseJobForm.get(key);
      if (control && control.invalid) {
        invalidFields.push(this.getHouseJobFieldLabel(key));
      }
    });

    return invalidFields;
  }

  private formatHouseJobBackendMessage(message: string): string {
    if (!message) {
      return message;
    }

    const replacements: Array<[RegExp, string]> = [
      [/\bDepartmentMasterSid\b|\bDepartment Master Sid\b/gi, 'Department'],
      [/\bCustomerMasterSid\b|\bCustomer Master Sid\b/gi, 'Customer'],
      [/\bBranchMasterSid\b|\bBranch Master Sid\b/gi, 'Branch'],
      [/\bCompanyMasterSid\b|\bCompany Master Sid\b/gi, 'Company'],
      [/\bSalesmanSid\b|\bSalesman Sid\b/gi, 'Salesman'],
      [/\bCustomerAddress\b/gi, 'Customer Address'],
      [/\bShipperName\b/gi, 'Shipper Name'],
      [/\bShipperAddress\b/gi, 'Shipper Address'],
      [/\bConsigneeName\b/gi, 'Consignee Name'],
      [/\bConsigneeAddress\b/gi, 'Consignee Address'],
      [/\bDestinationAgent\b/gi, 'Destination Agent'],
      [/\bAgentName\b/gi, 'Agent Name'],
      [/\bIncoTerms\b/gi, 'Inco Terms'],
      [/\bHBLNo\b/gi, 'HBL No'],
      [/\bHBLDate\b/gi, 'HBL Date'],
      [/\bHouseStatus\b/gi, 'House Status']
    ];

    return message
      .split('\n')
      .map(line => {
        let formatted = line;
        replacements.forEach(([pattern, replacement]) => {
          formatted = formatted.replace(pattern, replacement);
        });
        return formatted;
      })
      .join('\n');
  }

  private showHouseJobBackendError(error: any, fallback: string): void {
    const message = this.formatHouseJobBackendMessage(
      extractBackendErrorMessage(error, fallback)
    );
    this.appSettingService.showError(message);
  }

  handleConnectionChange(allConnections:any[]){
    this.connectionResult = [...allConnections];
    this.bookingConnectionsArr = [...allConnections];
    if (!this.isPatching) {
      this.markAsDirty();
    }

    if (this.housejobData) {
      this.housejobData = {
        ...this.housejobData,
        Connections: [...allConnections]
      };
    }
  }

  handleRateChange(allRates:any[]){
    
    if(allRates){
      this.rateResult = [...allRates];
      if (!this.isPatching) {
        this.markAsDirty();
      }
    }
  }

  handleMilestoneChange(allmilestones:any[]){
   
    if(allmilestones.length !== 0){
      this.milestoneResult = [...allmilestones];
      if (!this.isPatching) {
        this.markAsDirty();
      }
    }
    if(this.hblModalRef){
      this.initializeMilestoneContentForHBLPrint();
    }
  }

onCurrencyChange(event: any) {
  
}

  private resetSaveState(): void {
    this.isSubmitting = false;
    this.isSaving = false;
    this.spinner.hide();
  }


  onSubmit() {
    this.submitHouseJob();
  }

  private submitHouseJob(resolve?: (value: boolean) => void) {
    if (!this.validateContainerWeight()) {
  return;
}
    if (this.isSubmitting || this.isSaving) {
      resolve?.(false);
      return;
    }

    if (this.isEditMode && !this.hasUnsavedChanges()) {
      this.appSettingService.showWarning('No changes to save');
      resolve?.(false);
      return;
    }

    if (!this.validateHBLNo()) {
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
    resolve?.(false);
    return;
  }
  // In onSubmit() - Added this check:
if (this.houseJobCargos.length > 0) {
  let hasInvalidCargo = false;

  this.houseJobCargos.controls.forEach((cargoControl, cargoIndex) => {
    const cargoGroup = cargoControl as FormGroup;
    this.setOrResetWeightError(cargoGroup);
    this.handleProductRelatedCalculation(cargoIndex);

    if (cargoGroup.invalid) {
      hasInvalidCargo = true;
    }

    const productArray = cargoGroup.get('bookingProducts') as FormArray;
    productArray.controls.forEach(control => {
      this.setOrResetWeightError(control as FormGroup);
    });

    const hasInvalidProduct = productArray.controls.some(control => control.invalid);
    if (hasInvalidProduct) {
      hasInvalidCargo = true;
      productArray.markAllAsTouched();
    }
  });

  if (hasInvalidCargo) {
    this.houseJobCargos.markAllAsTouched();
    this.logInvalidProductControls();
    this.appSettingService.showWarning(this.getProductValidationMessage());
    this.selectedTab = 'Cargo';
    resolve?.(false);
    return;
  }
  if (!this.validateContainerCapacityRules()) {
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
  const exportImportType = this.selectedDepartment?.ExportImport;
  const hblNo = houseJobFormValue.HBLNo;
  let CarrierSid = null;
  if (houseJobFormValue.CarrierName) {
    const selectedCarrier = this.carrierList.find(carrier => 
      carrier.CustomerName === houseJobFormValue.CarrierName
    );
    if (selectedCarrier) {
      CarrierSid = selectedCarrier.CustomerMasterSid;
    }
  }
  if (exportImportType === 'Import' && (!hblNo || hblNo.trim() === '')) {
    this.appSettingService.showWarning('HBL Number is required for Import operations. Please enter a valid HBL Number.');
    
    // Focus on HBLNo field
    const hblNoElement = document.querySelector('[formControlName="HBLNo"]');
    if (hblNoElement) {
      (hblNoElement as HTMLElement).focus();
    }
    
    resolve?.(false);
    return;
  }
  this.isSubmitting = true;
  this.isSaving = true;
  this.spinner.show();
  const otherFormValue = this.otherForm.getRawValue();
  const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
  const currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  const boeData = this.boeComponent ? this.boeComponent.getBoeData() : [];
  const vehicleData = this.vehicleComponent ? this.vehicleComponent.getVehicleData() : [];
  const customsData = this.customsComponent ? this.customsComponent.getCustomsData() : [];

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

  const cargoGroupsValue = this.houseJobCargos.getRawValue() || [];
  const cargoPayload = cargoGroupsValue.map((cargo: any) => {
    const cargoSid = cargo?.HouseJobCargoSid || null;
    const cargoProducts = Array.isArray(cargo?.bookingProducts) ? cargo.bookingProducts : [];
    const mappedProducts = cargoProducts.map((product: any) => ({
      HouseJobProductSid: product.HouseJobProductSid || null,
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
      UnNo: String(product.UnNo) || '',
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
      HouseJobCargoSid: cargoSid
    }));

    return {
      HouseJobCargoSid: cargoSid,
      CargoType: cargo.CargoType || 'General',
      ContainerType: cargo.ContainerType || null,
      NoofContainers: parseFloat(cargo.NoofContainers) || 0,
      GrossWeight: parseFloat(cargo.GrossWeight) || 0,
      NetWeight: parseFloat(cargo.NetWeight) || 0,
      Volume: parseFloat(cargo.Volume) || 0,
      Volumetric: parseFloat(cargo.Volumetric) || 0,
      ChargeableWeight: parseFloat(cargo.ChargeableWeight) || 0,
      NoOfPackage: parseFloat(cargo.NoOfPackage) || 0,
      ShipmentTerms: cargo.ShipmentTerms || null,
      CommodityDescription: cargo.CommodityDescription || null,
      MarksAndNumber: cargo.MarksAndNumber || null,
      LandedMarksandNumber: cargo.LandedMarksandNumber || null,
      MovementType: cargo.MovementType || null,
      FreightTerms: cargo.FreightTerms || null,
      ModeOfTransport: cargo.ModeOfTransport || null,
      StuffingAt: cargo.StuffingAt || 'Dock',
      bookingProducts: mappedProducts,
      products: mappedProducts
    };
  });

  const flatCargoProducts = cargoPayload.flatMap((cargo: any) =>
    (cargo.bookingProducts || []).map((product: any) => ({
      ...product,
      HouseJobCargoSid: cargo.HouseJobCargoSid || null
    }))
  );



  const payload = {
     MasterJobSid: Number(houseJobFormValue.MasterJobSid) || null,
    BookingNo: houseJobFormValue.BookingNo,
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    MenuMasterSid: currentMenuId,
    DepartmentMasterSid: houseJobFormValue.DepartmentMasterSid,
    CustomerMasterSid: houseJobFormValue.CustomerMasterSid,
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
    MBLNo: houseJobFormValue.MBLNo || '',
    MBLDate: houseJobFormValue.MBLDate ? new Date(houseJobFormValue.MBLDate) : null,
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
    JobType: houseJobFormValue.JobType || '',
    ShipmentNo: houseJobFormValue.ShipmentNo || null,
    
    cargo: cargoPayload,
    houseJobCargo: cargoPayload,
    
    houseJobOthers: {
      HouseJobOthersSid: otherFormValue.HouseJobOthersSid || null,
      CustomerRefNo: otherFormValue.CustomerRefNo || '',
      YardCFS: otherFormValue.YardCFS || '',
      ReleaseType: otherFormValue.ReleaseType || null,
      DeclaredValueOfCarriage: otherFormValue.DeclaredValueOfCarriage || null,
      DeclaredValueOfCustoms : otherFormValue.DeclaredValueOfCustoms || null,
      IATARate: otherFormValue.IATARate || null,
      PlaceOfSupply: otherFormValue.PlaceofSupply || '',
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
      // FIXED: CargoCurrency handling
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
      // FIXED: Correct field names
      SwitchBLShipper: otherFormValue?.SwitchBLShipper || null,
      SwitchBLConsignee: otherFormValue?.SwitchBLConsignee || null,
      SwitchLocation: otherFormValue?.SwitchLocation || '',
      CarrierBookingRef: otherFormValue?.CarrierBookingRef || '',
      CarrierBookingDate: otherFormValue?.CarrierBookingDate ? new Date(otherFormValue?.CarrierBookingDate) : null,
      // FIXED: DONo and DODate handling
      DONo: otherFormValue?.DONo || '',
      DODate: otherFormValue?.DODate ? new Date(otherFormValue?.DODate) : null,
      SIConfirmationDate: otherFormValue?.SIConfirmationDate ? new Date(otherFormValue?.SIConfirmationDate) : null,
      DGConfirmationDate: otherFormValue?.DGConfirmationDate ? new Date(otherFormValue?.DGConfirmationDate) : null,
      InternalNote: otherFormValue?.InternalNote || '',
      GeneralNote: otherFormValue?.GeneralNote || ''
    },
    
    products: flatCargoProducts,
    houseJobProduct: flatCargoProducts,
    houseJobBOE: boeData,
    houseJobVehicle: vehicleData,
     houseJobCustoms: customsData,
    houseConnections: this.connectionResult,
    bookingRates: this.rateResult,
    milestones: this.milestoneResult,
    ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
  };

 
  if (!this.isEditMode) {
     this.operationService.createHouseJob(payload).subscribe({
       next: (resp: any) => {
         this.resetSaveState();
         if (resp.status) {
          this.resetDirtyState();
          this.formSaved = true;
          this.appSettingService.showSuccess('House Job created successfully!');
          this.HouseJobSid = resp.data.HouseJobSid;
           this.isEditMode = true;
           const HouseJobSid = resp.data?.houseJob?.HouseJobSid;
           // Navigate to the edit page or reload the form
           if (HouseJobSid) {
            this.router.navigate([this.getHouseJobEntryRoute(), HouseJobSid]);
           } else {
            this.router.navigate([this.getHouseJobListRoute()]);
           }
           resolve?.(true);
          
          // Optionally reload the data to get the generated IDs
          // this.loadHouseById(this.HouseJobSid);
        } else {
          this.showHouseJobBackendError(resp, 'Error creating house job.');
          console.error('Create error:', resp.message);
          resolve?.(false);
        }
      },
      error: (err) => {
        this.resetSaveState();
        this.showHouseJobBackendError(err, 'Failed to create house job. Please try again.');
        console.error('Create API error:', err);
        resolve?.(false);
      }
    });
    return;
  } 
  // Rest of your API call code remains the same...
  if (this.isEditMode && this.HouseJobSid) {
    this.operationService.updateHouseById(this.HouseJobSid, payload).subscribe({
      next: (resp: any) => {
        this.resetSaveState();
        if (resp.status) {
          this.resetDirtyState();
          this.formSaved = true;
          this.appSettingService.showSuccess('House Job successfully updated.');
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate([this.getHouseJobEntryRoute(), this.HouseJobSid]);
          });
          resolve?.(true);
        } else {
          this.showHouseJobBackendError(resp, 'Error updating house job.');
          console.error(resp.message);
          resolve?.(false);
        }
      },
      error: (err) => {
        this.resetSaveState();
        this.showHouseJobBackendError(err, 'Failed to update house job.');
        console.error(err);
        resolve?.(false);
      }
    });
    return;
  }

  this.resetSaveState();
  this.appSettingService.showError('Unable to save House Job. Missing record reference.');
  resolve?.(false);
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

private isFclOrLclImportDepartment(): boolean {
  const departmentName = (
    this.selectedDepartment?.departmentName ||
    this.getDepartmentName(this.houseJobForm.get('DepartmentMasterSid')?.value)
  )?.toString().trim().toLowerCase();

  return departmentName === 'fcl import' || departmentName === 'lcl import';
}

shouldShowHousePrintOption(reportName: 'HBL' | 'HBLDraft' | 'Sailing Confirmation'): boolean {
  if (!this.mps.canPrint(reportName, 'Print')) {
    return false;
  }

  return !this.isFclOrLclImportDepartment();
}

private isAirImportDepartment(): boolean {
  const departmentType = (this.selectedDepartmentType || this.selectedDepartment?.departmentType || '')
    .toString()
    .trim()
    .toUpperCase();
  const exportImport = (this.selectedDepartment?.ExportImport || '')
    .toString()
    .trim()
    .toUpperCase();

  return departmentType === 'AIR' && exportImport === 'IMPORT';
}

shouldShowAirHousePrintOption(reportName: 'HAWB' | 'HAWB Draft'): boolean {
  if (!this.mps.canPrint(reportName, 'Print')) {
    return false;
  }

  return !this.isAirImportDepartment();
}

  onDeptChange(department) {
  const controlOptions = { emitEvent: !this.isPatching };
  
  this.selectedDepartment = department;
  if (!department) {
    this.selectedDepartment = null;
    this.selectedDepartmentType = '';
    this.filterTabs();
    this.selectedFCLLCL = 'LCL';
    this.selectedCargoMode = 'LCL';
    this.filteredPorts = [];
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFPOD = [];
    this.b['POO'].setValue(null, controlOptions);
    this.b['POL'].setValue(null, controlOptions);
    this.b['POD'].setValue(null, controlOptions);
    this.b['FPD'].setValue(null, controlOptions);
    this.b['ETA'].setValue('', controlOptions);
    this.b['ETD'].setValue('', controlOptions);
    this.b['MovementType'].setValue(null, controlOptions);
    this.b['JobType'].setValue('', controlOptions);
    this.handleImportExport();
    this.handleCFSOrYard();
    this.b['HBLNo']?.enable();
    this.b['HBLNo']?.setValue('', controlOptions);
    this.blClauseOptions = [];
    this.o['BlClause']?.setValue('', controlOptions);
    this.handleHBLNoField('');
    return;
  }
  
  // Set department properties
  this.selectedDepartment = department;
  this.selectedDepartmentType = this.normalizePortText(department?.departmentType);
  this.handleHBLNoField(department.ExportImport);
  this.filterTabs();
  this.selectedFCLLCL = this.resolveSelectedSegment(department);
  this.selectedCargoMode = this.resolveCargoMode(department);

    this.houseJobCargos.controls.forEach((cargoControl: AbstractControl) => {
      const cargoGroup = cargoControl as FormGroup;
      const cargoValidatorMap: Record<string, any[]> = {
        CargoType: [Validators.required],
        GrossWeight: [Validators.required]
      };

      Object.entries(cargoValidatorMap).forEach(([field, validators]) => {
        const control = cargoGroup.get(field);
        if (!control) {
          return;
        }
        control.setValidators(validators);
        control.updateValueAndValidity({ emitEvent: false });
      });

      const cargoProducts = cargoGroup.get('bookingProducts') as FormArray;
      cargoProducts.controls.forEach((productGroup: FormGroup) => {
        const isAirOrLCL = this.usesDimensionalCargoFields();
        const validatorMap: Record<string, any[]> = {
          UomMasterSid: isAirOrLCL ? [Validators.required] : [],
          Volumetric: isAirOrLCL ? [Validators.required] : [],
          Volume: this.isSurfaceCargoMode() ? [] : [Validators.required, Validators.min(0.001)]
        };

        Object.entries(validatorMap).forEach(([field, validators]) => {
          const control = productGroup.get(field);
          if (!control) {
            return;
          }
          control.setValidators(validators);
          control.updateValueAndValidity({ emitEvent: false });
        });
      });
    });
    this.applyFclContainerValidators();
  
  // Set the form control value
  this.b['DepartmentMasterSid'].setValue(department.DepartmentMasterSid, controlOptions);
  
  
  this.loadDefaultBLClauses(department.DepartmentMasterSid);
  this.handleHBLNoField(department.ExportImport);
  // Rest of the method remains the same...
  this.autoSetJobType(department);
  
  if (this.selectedDepartmentType === "AIR") {
    // Set IncoTerms to CIF
    this.b['IncoTerms']?.setValue('CIF', controlOptions);
    
    // Set FreightTerms to Prepaid
    this.b['FreightTerms']?.setValue('Prepaid', controlOptions);
    
    // Set Mode of Transport to Flight
    this.c['ModeOfTransport']?.setValue('Flight', controlOptions);
  } else {
    this.selectedDepartmentType === "SEA" ? this.c['ModeOfTransport']?.setValue('Vessel', controlOptions) : null;
  }
  
  if (this.selectedFCLLCL === "LCL" && department.ExportImport === "Export") {
    this.cargoForm.get('StuffingAt')?.setValue('Dock', controlOptions);
    this.cargoForm.get('StuffingAt')?.disable();
  } else if (!this.isExportToImportLinked) {
    this.cargoForm.get('StuffingAt')?.enable();
  }
  
  this.selectedDepartmentType === "SEA" ? this.c['ModeOfTransport']?.setValue('Vessel', controlOptions) : null;
  this.selectedDepartmentType === "AIR" ? this.c['ModeOfTransport']?.setValue('Flight', controlOptions) : null;
  this.selectedDepartmentType === "ROAD" ? this.c['ModeOfTransport']?.setValue('Road', controlOptions) : null;
  this.handleCFSOrYard();
  this.onRouteChange();
  this.handleImportExport();
  this.applyExportToImportFieldLocks();
  this.applyCargoTabLocks();
  this.applyProductTabLocks();
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
    hblNoControl.setValue('', { emitEvent: !this.isPatching });
    hblNoControl.clearValidators();
  } else if (exportImport === 'Import') {
    // For Import departments: enable HBLNo field for manual entry AND make it required
    hblNoControl.enable();
    hblNoControl.setValidators([Validators.required]); // This makes it required
    hblNoControl.updateValueAndValidity();
    
  } else {
    // For other department types: enable but not required
    hblNoControl.enable();
    hblNoControl.clearValidators();
   
  }
  
  hblNoControl.updateValueAndValidity();
}

validateHBLNo(): boolean {
  const exportImportType = this.selectedDepartment?.ExportImport;
  const hblNo = this.houseJobForm.get('HBLNo')?.value;
  
  // If it's Import department and HBLNo is empty, show error
  if (exportImportType === 'Import' && (!hblNo || hblNo.trim() === '')) {
    this.appSettingService.showWarning('HBL Number is required for Import operations. Please enter a valid HBL Number.');
    
    // Mark the field as touched to show validation error
    this.houseJobForm.get('HBLNo')?.markAsTouched();
    this.houseJobForm.get('HBLNo')?.setErrors({ required: true });
    
    // Focus on HBLNo field
    setTimeout(() => {
      const hblNoElement = document.getElementById('hbl-input');
      if (hblNoElement) {
        hblNoElement.focus();
      }
    }, 100);
    
    return false;
  }
  
  return true;
}
  private autoSetJobType(department: any): void {
  if (!department) {
    this.b['JobType']?.setValue('', { emitEvent: !this.isPatching });
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
  this.b['JobType']?.setValue(jobType, { emitEvent: !this.isPatching });
}

  onRouteChange(): void {
    const polSid = this.b['POL']?.value;
    const podSid = this.b['POD']?.value;
    this.refreshPortFilters();
    if (polSid && podSid && polSid === podSid) {
      this.setControlError(this.b['POD'], 'samePort', true);
      this.setControlError(this.b['POL'], 'samePort', true);
    } else {
      this.clearControlError(this.b['POD'], 'samePort');
      this.clearControlError(this.b['POL'], 'samePort');
    }
  }

  getFilteredPortsBySegment(segment: string): any[] {
    const normalizedSegment = this.normalizePortText(segment);

    if (normalizedSegment === 'AIR') {
      return this.portList.filter(port => this.normalizePortText(port?.PortType) === 'AIR');
    } else if (normalizedSegment === 'FCL' || normalizedSegment === 'LCL' || normalizedSegment === 'SEA') {
      return this.portList.filter(port => this.normalizePortText(port?.PortType) === 'SEA');
    } else if (normalizedSegment === 'ROAD') {
      return this.portList.filter(port => {
        const portType = this.normalizePortText(port?.PortType);
        return portType === 'ROAD' || portType.includes('ROAD') || portType.includes('LAND') || portType.includes('LOCATION');
      });
    } else if (normalizedSegment === 'TRANSPORT') {
      return this.portList.filter(port => {
        const portType = this.normalizePortText(port?.PortType);
        return portType === 'SEA' || portType === 'AIR';
      });
    } else if (normalizedSegment === 'OTHER' || normalizedSegment === 'OTHERS') {
      return [...this.portList];
    }
    return [];
  }

  private refreshPortFilters(): void {
    const filteredLists = this.buildPortFilterLists();
    this.applyPortFilterLists(filteredLists);

    if (this.clearInvalidPortSelections(filteredLists)) {
      this.applyPortFilterLists(this.buildPortFilterLists());
    }

    this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value;
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

    if (this.shouldUseAllPortOptions()) {
      pooPorts = [...basePorts];
      polPorts = [...basePorts];
      podPorts = [...basePorts];
      fpodPorts = [...basePorts];
    } else if (shipmentDirection === 'EXPORT') {
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

    const selectedPOL = this.b['POL']?.value;
    const selectedPOD = this.b['POD']?.value;

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
    const control = this.b[controlName];
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

    const referenceCountryId = this.toNumericValue(referencePort?.CountryMasterSid);
    if (!referenceCountryId) {
      return [...fallbackPorts];
    }

    return fallbackPorts.filter(port => this.toNumericValue(port?.CountryMasterSid) === referenceCountryId);
  }

  private isCompanyCountryPort(port: any): boolean {
    const companyCountryId = this.toNumericValue(this.currentBranch?.CountryMasterSid);
    const portCountryId = this.toNumericValue(port?.CountryMasterSid);

    return !!companyCountryId && !!portCountryId && companyCountryId === portCountryId;
  }

  private isForeignCountryPort(port: any): boolean {
    const companyCountryId = this.toNumericValue(this.currentBranch?.CountryMasterSid);
    const portCountryId = this.toNumericValue(port?.CountryMasterSid);

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

  private getHouseJobEntryRoute(): string {
    return this.normalizePortText(this.selectedDepartmentType) === 'AIR'
      ? '/operation/hawb-bill/entry'
      : '/operation/house-job/entry';
  }

  private getHouseJobListRoute(): string {
    return this.normalizePortText(this.selectedDepartmentType) === 'AIR'
      ? '/operation/hawb-bill/list'
      : '/operation/house-job/list';
  }

  private resolveSelectedSegment(department: any): string {
  const departmentType = this.normalizePortText(department?.departmentType);

  if (departmentType === 'SEA') {
    return this.normalizePortText(department?.FCLLCL) || 'LCL';
  }

  if (departmentType === 'ROAD' || departmentType === 'TRANSPORT') {
    const fcllcl = this.normalizePortText(department?.FCLLCL);
    // Road/Transport + LCL → dimensional fields
    if (fcllcl === 'LCL') return 'LCL';
    // Road/Transport + FCL or Others → container fields
    return 'FCL';
  }

  return departmentType || 'LCL';
}

private resolveCargoMode(department: any): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
  const departmentType = this.normalizePortText(department?.departmentType);
  const fcllcl = this.normalizePortText(department?.FCLLCL);

  if (departmentType === 'AIR') return 'AIR';

  if (departmentType === 'SEA') {
    return fcllcl === 'FCL' ? 'FCL' : 'LCL';
  }

  if (departmentType === 'ROAD' || departmentType === 'TRANSPORT') {
    if (fcllcl === 'LCL') return 'LCL';
    // FCL or Others → use FCL mode so container fields show
    return 'FCL';
  }

  const segment = this.resolveSelectedSegment(department);
  if (segment === 'FCL') return 'FCL';
  if (segment === 'AIR') return 'AIR';
  return 'LCL';
}

isSurfaceCargoMode(): boolean {
  // Never block CBM for Road — Road uses FCL or LCL mode now
  return false;
}

usesDimensionalCargoFields(): boolean {
  return this.selectedCargoMode === 'LCL' || this.selectedCargoMode === 'AIR';
}

  private shouldUseAllPortOptions(): boolean {
    const departmentType = this.normalizePortText(this.selectedDepartmentType || this.selectedDepartment?.departmentType);
    const segment = this.normalizePortText(this.selectedFCLLCL);

    return ['OTHER', 'OTHERS', 'TRANSPORT'].includes(departmentType) || ['OTHER', 'OTHERS', 'TRANSPORT'].includes(segment);
  }

  private toNumericValue(value: any): number | null {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }

  private setControlError(control: AbstractControl | null, errorKey: string, value: any): void {
    if (!control) {
      return;
    }

    control.setErrors({ ...(control.errors || {}), [errorKey]: value });
  }

  private clearControlError(control: AbstractControl | null, errorKey: string): void {
    if (!control?.errors?.[errorKey]) {
      return;
    }

    const updatedErrors = { ...(control.errors || {}) };
    delete updatedErrors[errorKey];
    control.setErrors(Object.keys(updatedErrors).length ? updatedErrors : null);
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
      this.b['VesselName']?.setValue(null);
      this.b['VoyageNo']?.setValue(null);
      this.b['ETA']?.setValue('');
      this.b['ETD']?.setValue('');
    }
  if (!selectedPort) {
    this.refreshPortFilters();
    return;
  }
  this.getVesselBasedOnPorts(); // Add this call
}

  handlePODChange(selectedPort: any,resetTrigger:boolean = true) {
    if (resetTrigger) {
      this.b['VesselName']?.setValue(null);
      this.b['VoyageNo']?.setValue(null);
      this.b['ETA']?.setValue('');
      this.b['ETD']?.setValue('');
    }
  if (!selectedPort) {
    this.b['FPD']?.setValue(null);
    this.refreshPortFilters();
    this.PODandFPODsame = true;
    return;
  }
  this.b['FPD']?.setValue(selectedPort.PortCode);
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
      ETA: '',
      ETD: ''
    });
    return;
  }
  
  this.houseJobForm.patchValue({
    VoyageMasterSid: vesselVoyage.VoyageMasterSid,
    VoyageNo: vesselVoyage.VoyageNo,
    ETA: new Date(vesselVoyage.ETA),
    ETD: new Date(vesselVoyage.ETD)
  });
}


  onVoyageChange(voyage: any) {
  if (!voyage) {
    this.b['ETA'].setValue('');
    this.b['ETD'].setValue('');
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
  if (!voyageType) {
    this.headerVesselList = [];
    return;
  }
  
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
  const deptType = this.normalizePortText(dept?.departmentType);
  switch (deptType) {
    case 'SEA':
      return 'Sea';
    case 'AIR':
      return 'Air';
    case 'ROAD':
    case 'TRANSPORT':
      return 'Road';
    case 'OTHER':
    case 'OTHERS':
      return 'Others';
    default:
      return '';
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

  handleProductChange(product: any, productIndex: number, cargoIndex: number = -1) {
   const productGroup = cargoIndex >= 0
    ? this.houseJobCargoProducts(cargoIndex).at(productIndex) as FormGroup
    : this.bookingProducts.at(productIndex) as FormGroup;
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
    
    const productForm = cargoIndex >= 0
      ? this.houseJobCargoProducts(cargoIndex).at(productIndex) as FormGroup
      : this.bookingProducts.at(productIndex) as FormGroup;
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
    const control = cargoIndex >= 0
      ? this.houseJobCargoProducts(cargoIndex).at(productIndex).get('IsHaz')
      : this.bookingProducts.at(productIndex).get('IsHaz');
    if (event instanceof KeyboardEvent) {
      element.checked = !element.checked;
    }
    control.setValue(element.checked);
    this.toggleHazProduct(productIndex, cargoIndex);
  }

  toggleHazProduct(productIndex: number, cargoIndex: number = -1) {
      const productGroup = cargoIndex >= 0
        ? this.houseJobCargoProducts(cargoIndex).at(productIndex) as FormGroup
        : this.bookingProducts.at(productIndex) as FormGroup;
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

  deleteBookingProduct(productIndex: number, HouseJobProductSid?: number, cargoIndex: number = -1) {
    if (this.isExportToImportLinked) {
      this.appSettingService.showInfo('Product deletion is locked for export-to-import linked house jobs.');
      return;
    }
    const productArray = cargoIndex >= 0
      ? this.houseJobCargoProducts(cargoIndex)
      : this.bookingProducts;
    if (HouseJobProductSid) {
      this.operationService.deleteHouseJobProduct(HouseJobProductSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            productArray.removeAt(productIndex);
            this.productDataLength = productArray.length;
            this.appSettingService.showSuccess('Product Deleted Successfully');
            this.handleProductRelatedCalculation(cargoIndex);
            this.markAsDirty();
          } else {
            this.appSettingService.showError("Error deleting product.");
          }
        })
    } else {
      productArray.removeAt(productIndex);
      this.productDataLength = productArray.length;
      this.appSettingService.showSuccess('Product Deleted Successfully');
      this.handleProductRelatedCalculation(cargoIndex);
      this.markAsDirty();
    }
    productArray.updateValueAndValidity();
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
    return;
  }
  const targetCargo = cargoIndex >= 0
    ? this.houseJobCargos.at(cargoIndex) as FormGroup
    : this.cargoForm;
  const productArray = cargoIndex >= 0
    ? this.houseJobCargoProducts(cargoIndex)
    : this.bookingProducts;

  if (!targetCargo) {
    return;
  }

  if (productArray.length === 0) {
      if (this.isExportToImportLinked) {
        targetCargo.disable({ emitEvent: false });
        return;
      }

      targetCargo.get('NoOfPackage')?.enable(); targetCargo.get('NoOfPackage')?.setValue(0);
      targetCargo.get('GrossWeight')?.enable(); targetCargo.get('GrossWeight')?.setValue(0);
      targetCargo.get('NetWeight')?.enable(); targetCargo.get('NetWeight')?.setValue(0);
      targetCargo.get('Volume')?.enable(); targetCargo.get('Volume')?.setValue(0);
      targetCargo.get('Volumetric')?.enable(); targetCargo.get('Volumetric')?.setValue(0);
      targetCargo.get('ChargeableWeight')?.enable(); targetCargo.get('ChargeableWeight')?.setValue(0);
      return;
    }

    let totalNoOfPkg = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalVolume = 0;
    let totalVolumetric: any = 0;

    let productValue = productArray.getRawValue() || [];
    productValue.forEach(product => {
      totalNoOfPkg += Number(product.ExternlQty) || 0;
      totalGrossWeight += Number(product.GrossWeight) || 0;
      totalNetWeight += Number(product.NetWeight) || 0;
      totalVolume += Number(product.Volume) || 0;
      totalVolumetric += Number(product.Volumetric) || 0
    });

    targetCargo.get('NoOfPackage')?.setValue(totalNoOfPkg);
    targetCargo.get('NoOfPackage')?.disable();
    targetCargo.get('GrossWeight')?.setValue(totalGrossWeight);
    targetCargo.get('GrossWeight')?.disable();
    targetCargo.get('NetWeight')?.setValue(totalNetWeight);
    targetCargo.get('NetWeight')?.disable();
    targetCargo.get('Volume')?.setValue(totalVolume);
    targetCargo.get('Volume')?.disable();
    targetCargo.get('Volumetric')?.setValue(Number(totalVolumetric.toFixed(this.decimalAfterPrecision)));
    targetCargo.get('Volumetric')?.disable();
    this.calculateChargeableWeight(targetCargo);

  if (this.isExportToImportLinked) {
      targetCargo.disable({ emitEvent: false });
    }
  }

  houseJobCargoProducts(cargoIndex: number): FormArray {
    const cargoGroup = this.houseJobCargos.at(cargoIndex) as FormGroup;
    return cargoGroup.get('bookingProducts') as FormArray;
  }

  addHouseJobCargo(data?: any, bypassFclCheck: boolean = false): void {
    if (!bypassFclCheck && this.selectedFCLLCL !== 'FCL') {
      this.appSettingService.showInfo('Add Cargo is available for FCL bookings only.');
      return;
    }

    const cargoGroup = this.createCargoGroup(data);
    this.houseJobCargos.push(cargoGroup);
    this.houseJobCargoExpanded.push(true);
    this.houseJobCargoActiveIndex = this.houseJobCargos.length - 1;
    this.cargoForm = cargoGroup;
  }

  addHouseJobCargoProduct(cargoIndex: number, data?: any): void {
    const cargoGroup = this.houseJobCargos.at(cargoIndex) as FormGroup;
    if (!cargoGroup) {
      return;
    }

    this.houseJobCargoActiveIndex = cargoIndex;
    this.cargoForm = cargoGroup;
    const products = cargoGroup.get('bookingProducts') as FormArray;
    products.push(this.createBookingProductGroup(data, true));
    this.handleProductRelatedCalculation(cargoIndex);
  }

  toggleCargoExpansion(cargoIndex: number): void {
    const isExpanded = !!this.houseJobCargoExpanded[cargoIndex];
    this.houseJobCargoActiveIndex = cargoIndex;
    this.houseJobCargoExpanded[cargoIndex] = !isExpanded;
    const cargoGroup = this.houseJobCargos.at(cargoIndex) as FormGroup;
    if (cargoGroup) {
      this.cargoForm = cargoGroup;
    }
  }

  isCargoExpanded(cargoIndex: number): boolean {
    return !!this.houseJobCargoExpanded[cargoIndex];
  }

  removeHouseJobCargo(cargoIndex: number): void {
    const cargoGroup = this.houseJobCargos.at(cargoIndex) as FormGroup;
    if (!cargoGroup) {
      return;
    }

    this.houseJobCargos.removeAt(cargoIndex);
    this.houseJobCargoExpanded.splice(cargoIndex, 1);

    if (this.houseJobCargos.length === 0) {
      this.addHouseJobCargo(undefined, true);
      return;
    }

    this.houseJobCargoActiveIndex = Math.min(this.houseJobCargoActiveIndex, this.houseJobCargos.length - 1);
    this.cargoForm = this.houseJobCargos.at(this.houseJobCargoActiveIndex) as FormGroup;
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
    const CargoType = this.cargoForm.get('CargoType')?.value;
    const NetWeight = this.cargoForm.get('NetWeight')?.value;
    const GrossWeight =this.cargoForm.get('GrossWeight')?.value;
    const NoofContainers = this.cargoForm.get('NoofContainers')?.value;
    const Volume = this.cargoForm.get('Volume')?.value;
    const ChargeableWeight = this.cargoForm.get('ChargeableWeight')?.value
    const CustomerMasterSid = this.b['CustomerMasterSid']?.getRawValue();
    const CustomerBranchSid = this.b['CustomerBranchSid']?.getRawValue();
    const BookingHeaderSid = this.b['BookingHeaderSid']?.value;
    const status = this.b['status']?.value;
    const salesmanSid = this.b['SalesmanSid']?.value || '';
    const salesmanName = this.salesmanList.find(s => s.UserMasterSid === salesmanSid)?.userName || '';

    const rawCargos: any[] = this.housejobData?.Cargo || this.housejobData?.houseJobCargo || [];
    const cargoItems = rawCargos.map((cargo: any) => {
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

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      BookingHeaderSid,
      status,
      HouseJobSid: this.HouseJobSid,
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
    let pdfBlob: Blob | undefined;
    try {
      pdfBlob = await this.generatePDFBlob();
    } catch (e) {
      console.warn('PDF generation skipped:', e);
    }
    let attachmentFile: File | undefined;
    if (pdfBlob) {
      attachmentFile = new File([pdfBlob], (this.bookingData?.ShipmentNo || 'HouseJob') + '.pdf', { type: 'application/pdf' });
    }
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: this.currentMenuId,
      action: 'UPDATE',
      attachmentFile,
      context: {
        HouseJobSid: this.housejobData?.HouseJobSid || this.HouseJobSid,
        ShipmentNo: this.bookingData?.ShipmentNo,
        BookingNo: this.bookingData?.BookingNo || this.bookingHeader?.BookingNo,
        JobNo: this.bookingData?.JobNo,
        HBLNo: this.housejobData?.HBLNo,
        date: this.datePipe.transform(this.bookingHeader?.HBLDate || this.bookingData?.HBLDate),
        POO: this.getFormattedPort(this.housejobData?.POO),
        POL: this.getFormattedPort(this.housejobData?.POL),
        POD: this.getFormattedPort(this.housejobData?.POD),
        FPD: this.getFormattedPort(this.housejobData?.FPD),
        customerName: this.bookingData?.CustomerName,
        shipperName: this.bookingData?.ShipperName,
        consigneeName: this.bookingData?.ConsigneeName,
        userName: this.userData?.userName,
        toEmail: this.bookingData?.Email || this.selectedCustomerBranch?.Email || '',
        customerBranchSid: this.bookingData?.CustomerBranchSid || null
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
  if(this.isEditMode){
    this.patchValues(this.housejobData);
    this.resetDirtyState();
  }
  else{
    this.isExportToImportLinked = false;
      this.houseJobForm.reset({
    status: 'Active'
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
  this.houseJobCargos.clear();
  this.houseJobCargoExpanded = [];
  this.cargoForm = this.createCargoGroup();
  this.houseJobCargos.push(this.cargoForm);
  this.houseJobCargoExpanded.push(true);
  this.houseJobCargoActiveIndex = 0;
  (this.detailForm.get('bookingProducts') as FormArray).clear();

  this.slicedProductArr = [];
  this.productDataLength = 0;
  this.otherForm.reset();
  this.applyExportToImportFieldLocks();
  this.resetDirtyState();
  }

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
      modalRef.componentInstance.idLabel = 'HouseJobSid';
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
        const openModal = (terms: any[]) => {
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

  sendSIMail() {
    if (this.isSendingSIMail || !this.HouseJobSid) return;
    this.isSendingSIMail = true;

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      HouseJobSid: this.HouseJobSid,
      appBaseUrl: window.location.origin,
      userEmail: this.userData?.userEmail || '',
      userName: this.userData?.userName || ''
    };

    this.operationService.sendSIMail(payload).subscribe({
      next: (resp: any) => {
        this.isSendingSIMail = false;
        if (resp.status) {
          const data = resp.data;
          if (data?.showPopup && data?.emailData) {
            // Open email popup for user to review and send
            const modalRef = this.modalService.open(EmailEntryComponent, {
              size: 'lg',
              centered: true,
              backdrop: 'static'
            });
            modalRef.componentInstance.setContent = {
              EmailTo: data.emailData.toEmail,
              EmailCC: data.emailData.ccEmail,
              EmailBCC: '',
              Subject: data.emailData.subject,
              Mailbody: data.emailData.body
            };
          } else {
            this.appSettingService.showSuccess('SI Mail sent successfully');
            const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Email Send'
        },
        newVal: {
          Email: 'SI Mail Send'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
          }
        } else {
          console.error('Send SI Mail failed:', resp);
          this.appSettingService.showError(resp.message || resp.error?.message || 'Failed to send SI Mail');
        }
      },
      error: (err) => {
        this.isSendingSIMail = false;
        console.error('Send SI Mail error:', err);
        this.appSettingService.showError(err?.error?.message || err?.message || 'Failed to send SI Mail');
      }
    });
  }

  openAuditLogs() {
      if (!this.HouseJobSid) return;
      const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'House Logs';
    modalRef.componentInstance.tableName = 'HouseJob';
    modalRef.componentInstance.recordId = this.HouseJobSid.toString();
    modalRef.componentInstance.screenName = 'HouseAirwaybill';
    }
  // openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.HouseJobSid) return;
  //   this.operationService.geAuditLogsHouseJob('HouseJob', this.HouseJobSid.toString()).subscribe({
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

  async reportDeliveryOrder() {
    if (!this.ensurePostedInvoice('Delivery Order')) return;
    const ok = await this.validateCreditForRelease('Delivery Order');
    if (!ok) return;

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


       async reportBill(type: 'HBL' | 'HBLDraft') {
         if (type === 'HBL') {
           // For HBL (final), require posted invoice first
           if (!this.ensurePostedInvoice('HBL')) return;
           const ok = await this.validateCreditForRelease('HBL');
           if (!ok) return;
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
          this.hblModalRef = modalRef;
          modalRef.componentInstance.housejobData = this.housejobData || [];
          modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
          modalRef.componentInstance.agentList = this.agentList || [];
          modalRef.componentInstance.selectedReport = type;
          modalRef.componentInstance.hblCount = this.houseJobForm.get('HBLCount')?.getRawValue();

         if (type === 'HBLDraft') {
           this.initializeMilestoneContentForHBLPrint();
         }

         modalRef.result.then((result) => {
            this.hblModalRef = undefined;
            if (result === 'UPDATED') {
              const prev = Number(this.houseJobForm.get('HBLCount')?.value);

              this.houseJobForm.patchValue({
                HBLCount: prev + 1,
             });

             this.housejobData.HBLCount = prev + 1; 
           }
         });

      }

  initializeMilestoneContentForHBLPrint() {
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
    const draftMilestoneId = allMilestones.find(m => m.MilestoneCode === "Draft")?.MilestoneMasterSid;
    const existingMilestone = this.milestoneResult.find(m => m.MilestoneMasterSid === draftMilestoneId);
    

    this.hblModalRef.componentInstance.autoInsertMilestone = validDepartment && validJobType && !existingMilestone;

    const milestonePayload: SafeInsertShipmentMilestone = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentName: this.selectedDepartment?.departmentName,
      JobType: currentJobType,
      MilestoneCode: "Draft",
      MilestoneDate : getDefaultTodayDate(),
      ShipmentNo: this.bookingData?.ShipmentNo,
      createdBy: this.userData?.userEmail,
      Remarks: `Draft BL has been sent on ${(new Date().toISOString()).split('T')[0]}`
    };
    this.hblModalRef.componentInstance.milestonePayload = milestonePayload;

    this.hblModalRef.componentInstance.reloadMilestone.subscribe(() => {
      this.milestoneComponent.loadShipmentMilestones(this.housejobData?.ShipmentNo);
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

  private async validateCreditForRelease(actionLabel: string): Promise<boolean> {
        if (!this.isCreditRequestCheckingEnabled) {
          return true;
        }

        const companyMasterSid = this.currentCompany?.CompanyMasterSid;
        const branchMasterSid = this.currentBranch?.BranchMasterSid;
        const raw = this.houseJobForm.getRawValue();
        const customerMasterSid = raw.CustomerMasterSid || this.housejobData?.CustomerMasterSid;
        const departmentMasterSid =
          raw.DepartmentMasterSid ||
          this.housejobData?.DepartmentMasterSid ||
          this.selectedDepartment?.DepartmentMasterSid;
        const customerBranchSid =
          raw.CustomerBranchSid ||
          this.housejobData?.CustomerBranchSid ||
          this.bookingHeader?.CustomerBranchSid ||
          null;
        const houseJobDate = this.housejobData?.HBLDate || null;

        if (!companyMasterSid) {
          this.appSettingService.showWarning('Company is not selected. Please refresh and try again.');
          return false;
        }
        if (!branchMasterSid) {
          this.appSettingService.showWarning('Branch is not selected. Please select a branch before release.');
          return false;
        }
        if (!customerMasterSid) {
          this.appSettingService.showWarning(
            `Customer is missing. Please select customer before ${actionLabel}.`
          );
          return false;
        }

        try {
          const resp: any = await firstValueFrom(
            this.creditValidationApiService.validateBLDORelease({
              CompanyMasterSid : companyMasterSid,
              BranchMasterSid : branchMasterSid,
              CustomerMasterSid : customerMasterSid,
              CustomerBranchSid : customerBranchSid,
              DocumentDate : houseJobDate
            })
          );

          const validation = resp?.data;
          const isValid = this.getCreditValidationValue(validation, 'IsValid', 'isValid');
          if (!resp?.status || isValid === false) {
            this.showCreditValidationFailure(actionLabel, validation, resp?.message || 'Credit validation failed.');
            return false;
          }

          const warnings = this.getCreditValidationArray(validation, 'Warnings', 'warnings');
          if (warnings.length) {
            this.appSettingService.showWarning(warnings.join('\n'));
          }

          return true;
        } catch (error: any) {
          this.showCreditValidationFailure(
            actionLabel,
            error?.error?.data,
            error?.error?.message || 'Credit validation failed.'
          );
          return false;
      }
    }

  private getCreditValidationValue(source: any, primaryKey: string, secondaryKey?: string): any {
    if (!source) return undefined;
    if (source[primaryKey] !== undefined) return source[primaryKey];
    if (secondaryKey && source[secondaryKey] !== undefined) return source[secondaryKey];
    return undefined;
  }

  private getCreditValidationArray(source: any, primaryKey: string, secondaryKey?: string): any[] {
    const value = this.getCreditValidationValue(source, primaryKey, secondaryKey);
    return Array.isArray(value) ? value : [];
  }

  private showCreditValidationFailure(actionLabel: string, validation: any, fallbackMessage: string): void {
    const errors = this.getCreditValidationArray(validation, 'Errors', 'errors');
    const violatingVouchers = this.getCreditValidationArray(validation, 'ViolatingVouchers', 'violatingVouchers');
    const customerName =
      this.houseJobForm?.get('CustomerName')?.value ||
      this.selectedCustomer?.CustomerName ||
      this.housejobData?.CustomerName ||
      this.bookingHeader?.CustomerName ||
      'this customer';

    if (!errors.length && !violatingVouchers.length) {
      this.appSettingService.showError(fallbackMessage);
      return;
    }

    this.creditValidationActionLabel = actionLabel;
    this.creditValidationSummary = {
      customerName,
      customerType: this.getCreditValidationValue(validation, 'CustomerType', 'customerType') || 'CREDIT',
      CreditLimit: this.getCreditValidationValue(validation, 'CreditLimit', 'CreditLimit') ?? 0,
      creditDays: this.getCreditValidationValue(validation, 'CreditDays', 'creditDays') ?? 0,
      remainingCreditLimit: this.getCreditValidationValue(validation, 'RemainingCreditLimit', 'remainingCreditLimit') ?? 0,
      totalOutstandingLocal: this.getCreditValidationValue(validation, 'TotalOutstandingLocal', 'totalOutstandingLocal') ?? 0,
      selectedCreditRequestSid: this.getCreditValidationValue(validation, 'SelectedCreditRequestSid', 'selectedCreditRequestSid') ?? null,
      errors,
      violatingVouchers
    };
    this.showCreditValidationModal = true;
  }

  closeCreditValidationModal(): void {
    this.showCreditValidationModal = false;
    this.creditValidationActionLabel = '';
    this.creditValidationSummary = null;
  }

  private ensurePostedInvoice(actionLabel: string): boolean {
    if (this.arapLoading) {
      this.appSettingService.showWarning(
        'Invoice status is still loading. Please wait a moment and try again.'
      );
      return false;
    }

    const arap = Array.isArray(this.arapData) ? this.arapData : [];
    const invoices = arap.filter(item => item?.DocumentTypeCode === 'INV');

    const isPosted = (status: any) => {
      const value = String(status || '').toUpperCase();
      return value === 'P' || value === 'POSTED';
    };

    const postedInvoices = invoices.filter(item => isPosted(item?.PostStatus));

    if (postedInvoices.length > 0) {
      return true;
    }

    if (invoices.length === 0) {
      this.appSettingService.showWarning(
        `No posted invoice found. Please create and post at least one invoice before ${actionLabel}.`
      );
      return false;
    }

    const unpostedIds = invoices
      .filter(item => !isPosted(item?.PostStatus))
      .map(item => item?.VoucherNumber || item?.InvoiceNumber || item?.DocumentNo || item?.VoucherHeaderSid)
      .filter(Boolean);

    const details = unpostedIds.length
      ? `Invoice not posted: ${unpostedIds.join(', ')}.`
      : 'Invoice not posted.';

    this.appSettingService.showWarning(
      `${details} Please post at least one invoice before ${actionLabel}.`
    );
    return false;
  }

   async reportReleaseLetter() {
        if (!this.ensurePostedInvoice('Release Letter')) return;

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
        this.initializeMilestoneContentForReleaseLetter(modalRef);
      }

  private initializeMilestoneContentForReleaseLetter(modalRef: any): void {
    const validDepartment = this.selectedDepartment?.ExportImport === 'Export';
    const validJobType = this.b['JobType']?.value === 'Export';

    modalRef.componentInstance.autoInsertMilestone = validDepartment && validJobType;

    const milestonePayload: SafeInsertShipmentMilestone = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentName: this.selectedDepartment?.departmentName,
      JobType: this.b['JobType']?.value,
      MilestoneCode: 'HBL',
      MilestoneDate: getDefaultTodayDate(),
      ShipmentNo: this.bookingData?.ShipmentNo,
      createdBy: this.userData?.userEmail,
      Remarks: `BL Release on ${(new Date().toISOString()).split('T')[0]}`,
    };

    modalRef.componentInstance.milestonePayload = milestonePayload;

    modalRef.componentInstance.reloadMilestone.subscribe(() => {
      this.milestoneComponent.loadShipmentMilestones(this.housejobData?.ShipmentNo);
    });
  }

  async reportReleaseOrder() {
    const ok = await this.validateCreditForRelease('Release Order');
    if (!ok) return;

    if (!this.ensurePostedInvoice('Release Order')) return;

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

  async reportHAWB(type: 'HAWB' | 'HAWBDraft') {
     const ok = await this.validateCreditForRelease('HAWB');
     if (!ok) return;
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
  if (!this.isPatching) {
    this.markExternalDirty();
  }
}

handleVehicleChange(event: any) {

  // You can process and save event data here
  if (!this.isPatching) {
    this.markExternalDirty();
  }
}
handleCustomsChange(event: any) {
  
  // You can process and save event data here
  if (!this.isPatching) {
    this.markExternalDirty();
  }
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

    const hasWeightMismatch = !!grossValue && !!netValue && Number(grossValue) < Number(netValue);

    if (hasWeightMismatch) {
      grossErrors['grossLessThanNet'] = true;
      netErrors['netGreaterThanGross'] = true;
    }

    grossCtrl.setErrors(Object.keys(grossErrors).length ? grossErrors : null);
    netCtrl.setErrors(Object.keys(netErrors).length ? netErrors : null);

    const wasMismatchShown = this.weightMismatchToastState.get(formGroup) === true;
    if (hasWeightMismatch && !wasMismatchShown) {
      this.appSettingService.showWarning('Gross Weight cannot be less than Net Weight');
      this.weightMismatchToastState.set(formGroup, true);
    } else if (!hasWeightMismatch && wasMismatchShown) {
      this.weightMismatchToastState.set(formGroup, false);
    }
  }
 toggleProductInputType(formGroup: FormGroup, mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
  event.stopPropagation();
  if (this.isExportToImportLinked) {
    return;
  }
  const value = formGroup.get(flagCtrl)?.value;
  formGroup.get(flagCtrl)?.setValue(!value);
  formGroup.get(mainCtrl)?.reset();
}
getProductFormGroup(index: number): FormGroup {
  return this.bookingProducts.at(index) as FormGroup;
}

  onStatusChange() {
    const status = this.b['status']?.getRawValue();
    if (this.housejobData?.bookingHeader && (status === 'Suspended' || !status)) {
      this.appSettingService.showWarning(
        `This house cannot be suspended.\n\nBooking No: ${this.housejobData?.bookingHeader?.BookingNo} is associated with it.`
      );
      this.b['status']?.setValue('Active');
    }
    this.currentFormValue = {
      ...(this.currentFormValue || {}),
      status: this.b['status']?.getRawValue()
    };
  }

  closeCustomsValidationModal() {
    this.showCustomsValidationModal = false;
    this.customsValidationErrors = [];
  }

  goToCustomsTab() {
    this.closeCustomsValidationModal();
    this.selectedTab = 'Customs';
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

    this.houseJobCargos.controls.forEach((cargoGroup: FormGroup) => {
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

    this.isFormDisabled = true;
  }
  
}




interface CustomerProfit {
  CustomerName : string,
  Amount : number
}

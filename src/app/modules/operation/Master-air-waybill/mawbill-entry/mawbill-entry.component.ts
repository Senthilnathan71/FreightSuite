import { Component, ViewChild, TemplateRef, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation, HostListener } from '@angular/core';
import {
  NgbAccordionModule,
  NgbDatepickerModule,
  NgbModal,
  NgbDateStruct,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbActiveModal,
  NgbPaginationModule,
  NgbDropdownModule,
  NgbTooltip,
  
} from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule, DatePipe, NgComponentOutlet } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, FormArray } from '@angular/forms';
import { forkJoin, catchError, of, tap, debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { RevenueEntryComponent } from '../../revenue/revenue-entry/revenue-entry.component';
import { ConnectionComponent } from '../../connection/connection/connection.component';
import { ContainerActivityComponent } from '../../container-activity/container-activity/container-activity.component';
import { ArApComponent } from '../../AR-AP/ar-ap/ar-ap.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { MilestoneComponent } from '../../milestone/milestone/milestone.component';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';

import { ToastrService } from 'ngx-toastr';
import { OperationService } from '../../operation.service';
import { CostEntryComponent } from '../../cost/cost -entry/cost-entry.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { LoadingPlanEntryComponent } from '../../loading-plan/loading-plan-entry/loading-plan-entry.component';
import { MasterDocumentUploadComponent } from '../../master-document-upload/master-document-upload.component';
import { ManifestDocumentUploadComponent } from '../../manifest-document-upload/manifest-document-upload.component';
import { toggleFullScreen } from 'src/app/shared/fullscreenToggle';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CommonService } from 'src/app/common/common.service';
import { MAWBComponent } from '../report/mawb/mawb.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CargoManifestComponent } from '../../master-job/reports/cargo-manifest/cargo-manifest.component';
import { PreAlertComponent } from '../../master-job/reports/pre-alert/pre-alert.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { VerticalSidebarService } from 'src/app/shared/vertical-sidebar/vertical-sidebar.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { getDefaultTodayDate,toNgbDateStruct } from 'src/app/common/helper';
import { MawbPreprintComponent } from '../report/mawb-preprint/mawb-preprint.component';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { extractBackendErrorMessage } from 'src/app/common/error-handling/payload-validation-handler';
import { JobCardComponent } from '../../master-job/reports/job-card/job-card.component';
@Component({
  selector: 'app-mawbill-entry',
  standalone: true,
  imports: [
    NgbDatepickerModule,
    NgSelectModule,
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CostEntryComponent,
    NgComponentOutlet,
    RevenueEntryComponent,
    ConnectionComponent,
    ContainerActivityComponent,
    ArApComponent,
    NgbAccordionModule,
    FollowUpComponent,
    EdocComponent,
    EmailEntryComponent,
    ContainerActivityComponent,
    CustomDatePipe,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    RouterModule,
    NgbPaginationModule,
    NgbDropdownModule,
     NgxSpinnerModule,
     SearchableDropdown,
     NgbTooltip,
     DecimalPrecisionDirective
  ],
   templateUrl: './mawbill-entry.component.html',
  styleUrl: './mawbill-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    NgbActiveModal,
    CustomDatePipe,
    DatePipe
  ],
})
export class MawbillEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {

  private destroy$ = new Subject<void>();
  private vesselSearchSubject = new Subject<{POL: string | number, POD: string | number, MovementType: string}>();
  private isLoadingVessels = false;
  private lastVesselSearchParams: {POL: string | number, POD: string | number, MovementType: string} | null = null;

  @ViewChild('costEntryComponent') costEntryComponent: CostEntryComponent;
  public ratecomponent = CostEntryComponent;
  public revenuecomponent = RevenueEntryComponent;
  public connectionComponent = ConnectionComponent;
  public ARAPcompoent = ArApComponent;
  public followUpComponent = FollowUpComponent;
  public edocComponent = EdocComponent;
  public emailComponent = EmailEntryComponent;

  mawbStockList: any[] = [];
  mawbStockSource: 'ALLOCATED' | 'FREE' | 'OTHER' | 'NONE' | null = null;
  isMawbDropdownDisabled = false;
  isMawbStockAllocationEnabled = false;
  allowManualMawbEntryOnAutoAllocationError = false;
  private lastNoMawbStockWarningKey: string | null = null;
  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;
  masterJobForm: FormGroup;
  isEditMode = false;
  masterJobSid: number | null = null;
  isSaving = false;
  isLoading = false;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  filterOption: any;
  formSubmitted = false;
  isEditContainer = false;
  editingContainerIndex: number | null = null;
  containerFormGroup!: FormGroup;
  masterAirWayData:any;
  documentSid: number | null = null; 
  parentSubject = '';
  parentMailbody = '';
  userData: any;
  currentContainerModal: any;
  profitSummary: any;
  customerWiseSummary: any;
  chargeWiseSummary: any[] = []
  CurrencyLookupConfig = {
    displayFields : ['currencyCode', 'currencyName','countryName'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['currencyCode'],
  };
  mawbStockLookupConfig = {
  displayFields: ['MasterBillNumber', 'AgentName'],
  displayLabels: ['MAWB', 'AirLine'],
  labelFields: ['MasterBillNumber']
};
 customerAirlineLookupConfig={
    displayFields: ['CustomerName','AirlineCode'],
    displayLabels: ['Customer','AirlineCode'],
    labelFields: ['AirlineCode']
  }
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  branchLookupConfig = {
    displayFields: ['branchName'],
    displayLabels: ['Branch'],
    labelFields: ['branchName'],
  };
  companyLookupConfig = {
    displayFields: ['companyName', 'companyCode'],
    displayLabels: ['Company', 'Code'],
    labelFields: ['companyName'],
  };
  
  // Lookup data
  departments: any[] = [];
  portList: any[] = [];
  voyageList: any[] = [];
  containerTypeList: any[] = [];
  currencyList: any[] = [];
  filteredPorts: any[] = [];
  filteredPOO: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  filteredFPOD: any[] = [];
  carrierList: any[] = [];
  private previousCarrierName: string | null = null;
  private skipNextCarrierValueChange = false;
  agentList: any[] = [];
  forwarderList: any[] = [];
  cfsList: any[] = [];
  yardList: any[] = [];
  decimalAfterPrecision = 3;
  chargeList : any[]=[];
  filteredDestinationAgents: any[] = [];
  filteredOriginAgents: any[] = [];
  availableTransferCompanies: any[] = [];
  availableTransferBranches: any[] = [];
  filteredTransferBranches: any[] = [];
  packageTypeList: any[] = [];
  hssacList: any[] = [];
  airlineList: any[] = [];
  // Department info
  selectedDepartment: any;
  selectedDepartmentType: string = '';
  selectedFCLLCL: string = '';
  connectionResult : any[] =[];
  connectionResetTrigger = false;
  isTermsAndConditionsEnabled: boolean = true;
  masterjobConnectionArr:any[]=[];
  currentFormValue: any;
  customerList: any[] = []; 
  rateResult: any[] = [];
  masterJobRateArr : any[] = [];
  rateResetTrigger = false;
  currentRateFormValue: any;
  edocData: any[] = [];
  edocResetTrigger = false;
  isAirDepartment: boolean = false;
  minStartDate: any;
  currentEdocFormValue: any = null;
  emailData: any[] = [];
  emailResetTrigger = false;
  currentEmailFormValue: any = null;
  auditLogs: any[] = [];
  auditLogModalRef: any;
  containerActivityData: any[] = [];
  containerActivityResetTrigger = false;
  currentContainerActivityFormValue: any = null;
  pdfModel:any
  // Shipment related variable declarations
  attachedBookings : FormArray;
  slicedAttachedBookings : any[] = [];
  page = 1;
  pageSize = 5;
  totalLengthOfAttachedBookings : number = 0;
  arapData: any[] = [];
  TandCList: any[] = [];
  arapLoading = false;
  arapFilter = {
    voucherType: 'all',
    status: 'all' // 'all', 'unpaid', 'partial', 'paid'
  };
  currentMenuId: any;
  masterJobData:any;
  selectedReport: 'MAWB' | 'MAWBDraft' = 'MAWB';
  selectedTransferCompanySid: number | null = null;
  selectedTransferBranchSid: number | null = null;
  isPullingToImportBranch = false;
  isDirty = false;
  unsavedChanges = false;
  private initialFormValue: any = null;
  private suppressDirtyTracking = false;
  private readonly mawbDebugEnabled = true;
  tabs = [
    { name: 'Master', icon: 'fas fa-database' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
  ];

  tabs1 = [
    { name: 'Product', icon: 'fas fa-box' },
    { name: 'Connection', icon: 'fas fa-plug' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
  ];

  modeOfBLReleaseType = [
    { id: 'Express', name: 'Express' },
    { id: 'Original', name: 'Original' },
    { id: 'Surrendered', name: 'Surrendered' },
    { id: 'Sea WayBill', name: 'Sea WayBill' },
  ];

  modeOfWeightIn = [
    { id: 'Kg(s)', name: 'Kg(s)' },
    { id: 'LB(s)', name: 'LB(s)' },
    { id: 'Tonne(s)', name: 'Tonne(s)' },
  ];

  modeOfFreightTerms = [
    { id: 'Prepaid', name: 'Prepaid' },
    { id: 'Collect', name: 'Collect' },
  ];

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  modeOfMovementType = [
    { id: 'CY-CFS', name: 'CY-CFS' },
    { id: 'CFS-FO', name: 'CFS-FO' },
    { id: 'CFS-CY', name: 'CFS-CY' },
    { id: 'CFS-CFS', name: 'CFS-CFS' },
    { id: 'FO-FI', name: 'FO-FI' },
    { id: 'Door-Door', name: 'Door-Door' },
    { id: 'CY-Door', name: 'CY-Door' },
    { id: 'CY-FO', name: 'CY-FO' }
  ];

  modeOfShipmentTerms = [
    { id: 'FCL/FCL', name: 'FCL/FCL' },
    { id: 'FCL/LCL', name: 'FCL/LCL' },
    { id: 'LCL/FCL', name: 'LCL/FCL' },
    { id: 'LCL/LCL', name: 'LCL/LCL' },
    { id: 'LTL', name: 'LTL' },
    { id: 'FTL', name: 'FTL' },
    { id: 'FTL HH', name: 'FTL HH' }
  ];

  @ViewChild('containerModal') containerModal!: TemplateRef<any>;
  @ViewChild('productModal') productModal!: TemplateRef<any>;
  @ViewChild('masterDocumentUploadComponent') MasterDocumentUploadComponent!: TemplateRef<any>;
  selectedTab = 'Master';
  selectedTab1 = 'Product';
  countryOfCompany : string;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private operationService: OperationService,
    private toastr: ToastrService,
    private appSettingsService: AppSettingsService,
    private cdr: ChangeDetectorRef,
    private datepipe : CustomDatePipe,
    private spinner: NgxSpinnerService,
    private commonService: CommonService,
    public mps: MenuPermissionService,
    private datePipe: DatePipe,
    private exportExcelService: ExcelExportService,
    private masterService: MasterService,
    private sidebarService : VerticalSidebarService,
    private emailTriggerService: EmailTriggerService,
  ) {
    this.initForm();
    this.initContainerForm();
    this.attachedBookings = this.fb.array([]);
  }

  sendManualMail(): void {
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: Number(sessionStorage.getItem('currentMenuId')),
      action: 'UPDATE',
      context: {}
    });
  }

  ngOnInit(): void {
    const fy = this.appSettingsService.getCurrentFinancialYear();
        if (fy) {
          this.fyMinDate = toNgbDateStruct(fy.StartDate);
          const fyEnd = new Date(fy.EndDate);
          const today = getDefaultTodayDate();
          this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
        }
    //  console.log('🚀 === MasterJobEntryComponent ngOnInit START ===');
    this.userData = this.appSettingsService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.countryOfCompany = this.currentCompany?.CountryName;
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.initializeTransferOptions();
     const storedMenuId = sessionStorage.getItem('currentMenuId');
     this.loadTermsAndConditionsConfig();
     this.mps.init().subscribe();
  // console.log('📋 localStorage currentMenuId:', storedMenuId);
  
  this.MenuMasterSid = storedMenuId ? Number(storedMenuId) : null;
  // console.log('✅ MenuMasterSid after initialization:', this.MenuMasterSid);

    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
      // console.log('📋 Filter Option:', this.filterOption);
  // console.log('🚀 === MasterJobEntryComponent ngOnInit END ===');

    this.loadHSSACLookups();
    this.loadInitialData().subscribe(() => {
      const loadingPlanData = this.operationService.getLoadingPlanData();
      if(loadingPlanData){
        this.suppressDirtyTracking = true;
        try {
          this.patchLoadingPlanData(loadingPlanData);
        } finally {
          this.suppressDirtyTracking = false;
        }
        this.resetDirtyState();
      }
      if (!loadingPlanData) {
        this.resetDirtyState();
      }
      this.route.paramMap.subscribe((param) => {
        const idParam = param.get('id');
        this.masterJobSid = idParam ? +idParam : null;
        if (this.masterJobSid) {
          this.isEditMode = true;
          this.loadMasterJobData(this.masterJobSid);
        } else {
          this.isEditMode = false;
        }
      });
    });

    // Setup form value changes with proper debouncing
    this.masterJobForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.suppressDirtyTracking) {
          return;
        }
        this.syncFormValueWithConnectionComponent();
        this.syncFormValueWithRateComponent();
        this.syncFormValueWithEdocComponent();
        // this.syncFormValueWithEmailComponent();
        // this.syncFormValueWithContainerActivityComponent();
      });
  this.masterJobForm.get('CarrierName')?.valueChanges.subscribe((carrierName) => {
    if (this.suppressDirtyTracking) {
      return;
    }
    if (this.selectedDepartmentType !== 'AIR') {
      return;
    }

    if (this.skipNextCarrierValueChange) {
      this.skipNextCarrierValueChange = false;
      return;
    }

    const selectedCarrier = this.carrierList.find(
      carrier => carrier.CustomerName?.trim().toLowerCase() === carrierName?.trim().toLowerCase()
    );
    const carrierChanged = this.normalizeCarrierName(this.previousCarrierName) !== this.normalizeCarrierName(carrierName);

    this.handleCarrierSelectionChange(selectedCarrier, carrierName, carrierChanged && !!this.previousCarrierName);
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
        this.cdr.markForCheck();
      },
      error: () => {
        // Default to enabled if config fetch fails
        this.isTermsAndConditionsEnabled = true;
        this.cdr.markForCheck();
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
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isSaving || this.isLoading) {
        resolve(false);
        return;
      }

      if (!this.validateBeforeSave()) {
        resolve(false);
        return;
      }

      this.submitForm(resolve);
    });
  }

  private resetDirtyState(): void {
    this.initialFormValue = this.buildUnsavedSnapshot();
    this.isDirty = false;
    this.masterJobForm?.markAsPristine();
    this.containerFormGroup?.markAsPristine();
    this.unsavedChanges = false;
    this.logMawbDebug('resetDirtyState', {
      isEditMode: this.isEditMode,
      masterJobSid: this.masterJobSid,
      attachedBookings: this.attachedBookings?.length || 0,
      connections: this.connectionResult?.length || 0,
      rates: this.rateResult?.length || 0,
    });
  }

  private markAsDirty(): void {
    this.refreshUnsavedChanges('markAsDirty');
  }

  private refreshUnsavedChanges(trigger: string): void {
    if (this.suppressDirtyTracking) {
      return;
    }

    const currentSnapshot = this.buildUnsavedSnapshot();
    const nextValue = !this.deepEqual(this.initialFormValue, currentSnapshot);
    this.isDirty = nextValue;
    this.unsavedChanges = nextValue;

    this.logMawbDebug('refreshUnsavedChanges', {
      trigger,
      nextValue,
      initialReady: this.initialFormValue !== null,
      masterDirty: this.masterJobForm?.dirty,
      containerDirty: this.containerFormGroup?.dirty,
      attachedBookings: this.attachedBookings?.length || 0,
      connections: this.connectionResult?.length || 0,
      rates: this.rateResult?.length || 0,
    });
  }

  private buildUnsavedSnapshot(): any {
    return {
      form: this.masterJobForm?.getRawValue() ?? null,
      attachedBookings: this.attachedBookings?.getRawValue?.() ?? [],
      connections: this.connectionResult ?? [],
      rates: this.rateResult ?? [],
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

  private logMawbDebug(stage: string, payload: any = {}): void {
    if (!this.mawbDebugEnabled) {
      return;
    }
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

  shouldShowMawbPrintOption(reportName: 'MAWB Draft' | 'MAWB Preprint'): boolean {
    if (!this.mps.canPrint(reportName, 'Print')) {
      return false;
    }

    return !this.isAirImportDepartment();
  }
onCarrierChangeForAir(carrier: any): void {
  if (this.isExportToImportCompleted && !this.isLoading) {
    return;
  }
  // Only apply for Air department
  if (this.selectedDepartmentType !== "AIR") {
    return;
  }

  if (!carrier) {
    // If carrier is cleared, clear the airline selection
    this.masterJobForm.get('VesselName')?.setValue(null);
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
      this.masterJobForm.get('VesselName')?.setValue(matchingAirline.CustomerName);
    } else {
      // If no exact match found, you might want to clear or show a message
      console.log('No matching airline found for AirlineCode:', carrier.AirlineCode);
      this.masterJobForm.get('VesselName')?.setValue(null);
    }
  } else {
    // Carrier doesn't have an AirlineCode
    this.masterJobForm.get('VesselName')?.setValue(null);
  }
}

onCarrierDropdownSelection(carrier: any): void {
  if (this.isExportToImportCompleted && !this.isLoading) {
    return;
  }
  if (this.selectedDepartmentType !== 'AIR') {
    return;
  }

  this.skipNextCarrierValueChange = true;
  const carrierName = carrier?.CustomerName ?? null;
  const carrierChanged = this.normalizeCarrierName(this.previousCarrierName) !== this.normalizeCarrierName(carrierName);

  this.handleCarrierSelectionChange(carrier, carrierName, carrierChanged);
}

private handleCarrierSelectionChange(carrier: any, carrierName: string | null, clearSelectedMawb: boolean): void {
  if (clearSelectedMawb) {
    this.clearSelectedMawb();
  }

  this.onCarrierChangeForAir(carrier);

  if (this.selectedDepartment?.ExportImport?.toUpperCase() === 'EXPORT' && !this.isMawbStockAllocationEnabled) {
    this.loadMawbStock({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      voyages: [{ CarrierName: carrierName || null }],
      houseJob: this.masterAirWayData?.houseJob || []
    });
  }

  this.previousCarrierName = carrierName || null;
}

private clearSelectedMawb(): void {
  this.masterJobForm.get('MBLNo')?.reset();
  this.mawbStockList = [];
  this.mawbStockSource = 'NONE';
  this.lastNoMawbStockWarningKey = null;
}

private normalizeCarrierName(carrierName: string | null | undefined): string {
  return (carrierName || '').trim().toLowerCase();
}

private getCurrentMawbValue(): string {
  return String(this.masterJobForm.get('MBLNo')?.value ?? '').trim();
}

private showNoMawbStockWarningOnce(warningKey: string): void {
  if (this.getCurrentMawbValue() || this.lastNoMawbStockWarningKey === warningKey) {
    return;
  }

  this.lastNoMawbStockWarningKey = warningKey;
  this.toastr.warning('No MAWB Stock Available');
}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

   loadHSSACLookups() {
    this.operationService.getAllHssac().subscribe({
      next: (resp: any) => {
        this.hssacList = resp || [];
        // console.log('HSSAC List loaded:', this.hssacList);
      },
      error: (err) => {
        // console.error('Error loading HSSAC data:', err);
        this.hssacList = [];
      }
    });
  }
  patchLoadingPlanData(data : any){
    this.suppressDirtyTracking = true;
    try {
    // console.log(data);
    const selectedDepartment = this.departments.find(dep => dep.DepartmentMasterSid === data.DepartmentMasterSid);
    selectedDepartment ? this.onDeptChange(selectedDepartment) : null;
    const selectedPOL = this.portList.find(port => port.PortCode === data.POL);
    selectedPOL ? this.handlePOLChange(selectedPOL) : null;
    const selectedPOD = this.portList.find(port => port.PortCode === data.POD);
    selectedPOD ? this.handlePODChange(selectedPOD) : null;
    
    this.masterJobForm.patchValue({
      MasterJobVoyageSid: data.MasterJobVoyageSid,
      DepartmentMasterSid : data.DepartmentMasterSid,
      POL : selectedPOL.PortMasterSid,
      POD : selectedPOD.PortMasterSid,
      VoyageMasterSid : data.VoyageMasterSid,
      VesselName : data.VesselName,
      VoyageNo : data.VoyageNo,
      CarrierName : data.CarrierName,
      PortCutoffDate: data.PortCutoffDate ? new Date(data.PortCutoffDate) : null,
      SiCutoffDate: data.SiCutoffDate ? new Date(data.SiCutoffDate) : null,
      ETD : data.ETD ? new Date(data.ETD) : null,
      ETA : data.ETA ? new Date(data.ETA) : null,
      Haz : data.Haz === 'Y',
      NoOfPkg : data.NoofPkg,
      GrossWeight : data.GrossWeight,
      NetWeight : data.NetWeight,
      Volume : data.Volume,

    }, { emitEvent: false });

    this.handlePOLChange(selectedPOL);
    this.handlePODChange(selectedPOD);
    
    const allContainers = data.masterJobContainers || [];
    this.masterJobContainers.clear();
    allContainers.forEach(container => {
      this.addContainer(container);
    });

    const allShipments = data.bookingList || [];
    this.attachedBookings.clear();
    allShipments.forEach(shipment => {
      this.attachedBookings.push(this.createShipmentGroup(shipment));
    });
    this.totalLengthOfAttachedBookings = this.attachedBookings.length;
    this.updateAttachedBookingsPagination();
    } finally {
      this.suppressDirtyTracking = false;
    }
  }
  uploadPDF() {
    this.modalService.open(MasterDocumentUploadComponent,{
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  uploadManifest() {
    const modalRef = this.modalService.open(ManifestDocumentUploadComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
    });

    // Reset component state when opening modal
    setTimeout(() => {
      modalRef.componentInstance.resetForm();
    }, 100);

    modalRef.componentInstance.createJob.subscribe((manifestData: any) => {
      if (manifestData && manifestData.masterJob) {
        // Populate the master job form with manifest data
        this.populateFormFromManifest(manifestData);
        modalRef.close();
      }
    });
  }

  private populateFormFromManifest(manifestData: any) {
    const masterJob = manifestData.masterJob;

    // Find ports by matching names or codes
    const findPortByNameOrCode = (portName: string): any => {
      if (!portName) return null;
      return this.portList.find(port =>
        port.PortName.toLowerCase().includes(portName.toLowerCase()) ||
        port.PortCode.toLowerCase().includes(portName.toLowerCase())
      );
    };

    const polPort = findPortByNameOrCode(masterJob.portOfLoading);
    const podPort = findPortByNameOrCode(masterJob.portOfDischarge);

    // Parse dates
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    // Update form with manifest data
    this.masterJobForm.patchValue({
      VesselName: masterJob.vesselName || '',
      VoyageNo: masterJob.voyageNumber || '',
      POL: polPort ? polPort.PortMasterSid : null,
      POD: podPort ? podPort.PortMasterSid : null,
      ETD: parseDate(masterJob.dateOfDeparture),
      ETA: parseDate(masterJob.dateOfArrival),
      CarrierName: masterJob.carrier || '',
      DestinationAgent: masterJob.agent || '',
      NoOfPkg: masterJob.totalContainers || 0,
      GrossWeight: this.parseWeight(masterJob.totalWeight),
      Volume: this.parseVolume(masterJob.totalVolume),
    }, { emitEvent: false });

    // Update port filters if ports were found
    if (polPort) {
      this.handlePOLChange(polPort);
    }
    if (podPort) {
      this.handlePODChange(podPort);
    }

    // Show success message
    this.toastr.success(`Manifest data loaded successfully with ${manifestData.houseJobs?.length || 0} house jobs`);
  }

  private parseWeight(weightStr: string): number {
    if (!weightStr) return 0;
    const match = weightStr.match(/[\d.,]+/);
    return match ? parseFloat(match[0].replace(',', '')) : 0;
  }

  private parseVolume(volumeStr: string): number {
    if (!volumeStr) return 0;
    const match = volumeStr.match(/[\d.,]+/);
    return match ? parseFloat(match[0].replace(',', '')) : 0;
  }
  initForm() {
    const today = getDefaultTodayDate();
       const fyDefault = this.appSettingsService.getCurrentFinancialYear();
    const defaultMasterJobDate=  fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;
    this.masterJobForm = this.fb.group({
      
      // Master Job fields
      DepartmentMasterSid: ['', Validators.required],
      MasterJobNumber: [{ value :'' , disabled : true}],
      ImportMasterJobNumber: [{ value: '', disabled: true }],
      MasterJobDate: [defaultMasterJobDate],
      FreightPPCC: ['Prepaid', Validators.required],
      DestinationAgent: [null],
      DestinationAgentAddress: [''],
      MBLNo: [''],
      isMawbFreeText: [false],
      MBLDate: [null],
      BLReleaseType: ['Original'],
      NoofOriginal: [3, Validators.required],
      OriginAgent: [''],
      POO: [null],
      POL: [null, Validators.required],
      POD: [null, Validators.required],
      FPD: [null],
      POLTerminal: [''],
      PODTerminal: [''],
      MovementType: [''],
      ShipmentTerms: [''],
      PkgType: [''],
      NoOfPkg: [{ value: 0, disabled: true }],
      WeightIn: [{value:'Kg(s)', disabled: true }],
      GrossWeight: [{ value: 0, disabled: true }],
      NetWeight: [{ value: 0, disabled: true }],
      ChargeableWeight: [{ value: 0, disabled: true }],
      Volume: [{ value: 0, disabled: true }],
      Haz: [false],
      DGBookingDate: [null],
      DGApprovedDate: [null],
      CommodityDescription: [''],
      MarksandNumber: [''],
      Status: ['Active', Validators.required],
      
      // Voyage fields
      MasterJobVoyageSid: [null],
      VoyageMasterSid: [null],
      VesselName: [''],
      isVesselFreeText: [false],
      VoyageNo: [''],
      ETA: [null],
      ETD: [null],
      ATA: [null],
      ATD: [null],
      DestinationATA: [null],
      // CarrierMasterSid: [null],
      CarrierName: [''],
      
      // Others fields
      MasterJobOthersSid: [null],
      Yard: [null],
      YardAddress: [''],
      Transporter: [''],
      HandlingInformation: [''],
      InternalNote: [''],
      CFS: [null],
      CFSAddress: [''],
      StuffingStartDate: [null],
      StuffingEndDate: [null],
      CurrencyCode: [''],
      SellExchangeRate: [null],
      AgentExchangeRate: [null],
      Coload: [false],
      CoLoader: [{value: '', disabled: true}],
      ExportDoNo: [''],
      ExportDoDate: [null],
      SOBDate: [null],
      CarrierRef: [''],
      AgentRef: [''],
      ExportToImport: ['N'],
      ImportMasterJobSid: [null],

      // Added fields for cut offs
      SiCutoffDate: [null],
      PortCutoffDate: [null],

      // Arrays for related entities
      connections: this.fb.array([]),
      masterJobContainers: this.fb.array([]),
      costRevenueCharges: this.fb.array([]),
      containerActivities: this.fb.array([])
    });
    this.masterJobForm.valueChanges.subscribe(() => {
      if (this.suppressDirtyTracking) {
        return;
      }
      this.syncFormValueWithRateComponent();
      this.refreshUnsavedChanges('masterJobForm valueChanges');
    });
  }

  initContainerForm(): void {
    this.containerFormGroup = this.fb.group({
      MasterJobContainerSid: [null],
      ContainerType: [null, Validators.required],
      ContainerNumber: ['', [Validators.required, Validators.maxLength(11)]],
      LineSeal: ['', Validators.maxLength(10)],
      CustomsSeal: ['', Validators.maxLength(10)],
      HsCode: ['', Validators.maxLength(10)],
      CommodityDescription: ['', Validators.maxLength(500)],
      PkgType: [null],
      NoOfPkg: [{ value: 0, disabled: true }, [Validators.min(0)]],
      GrossWeight: [{ value: 0, disabled: true }, [Validators.min(0)]],
      NetWeight: [{ value: 0, disabled: true }, [Validators.min(0)]],
      ChargeableWeight: [{ value: 0, disabled: true }, [Validators.min(0)]],
      Volume: [{ value: 0, disabled: true }, [Validators.min(0)]],
      IsSoc: [false]
    });
  }
  existsInList(list: any[], value: any) {
  if (list) {
    return list.some(item => item.CustomerName === value);
  }
  return false;
}


  // Getters for form arrays
  get connections(): FormArray {
    return this.masterJobForm.get('connections') as FormArray;
  }

  get masterJobContainers(): FormArray {
    return this.masterJobForm.get('masterJobContainers') as FormArray;
  }

  get costRevenueCharges(): FormArray {
    return this.masterJobForm.get('costRevenueCharges') as FormArray;
  }

  get containerActivities(): FormArray {
    return this.masterJobForm.get('containerActivities') as FormArray;
  }

  addContainer(container?: any): void {
    const containerGroup = this.fb.group({
      MasterJobContainerSid: [container?.MasterJobContainerSid || null],
      ContainerType: [container?.ContainerType || null, Validators.required],
      ContainerNumber: [container?.ContainerNumber || '', [Validators.required, Validators.maxLength(11)]],
      LineSeal: [container?.LineSeal || '', Validators.maxLength(10)],
      CustomsSeal: [container?.CustomsSeal || '', Validators.maxLength(10)],
      HsCode: [container?.HsCode || '', Validators.maxLength(10)],
      CommodityDescription: [container?.CommodityDescription || '', Validators.maxLength(500)],
      PkgType: [container?.PkgType || null],
      NoOfPkg: [container?.NoOfPkg || 0, [Validators.min(0)]],
      GrossWeight: [container?.GrossWeight || 0, [Validators.min(0)]],
      NetWeight: [container?.NetWeight || 0, [Validators.min(0)]],
      ChargeableWeight: [container?.ChargeableWeight || 0, [Validators.min(0)]],
      Volume: [container?.Volume || 0, [Validators.min(0)]],
      IsSoc: [container?.IsSoc === 'Y' || container?.IsSoc === true || false] 
    });
    
    this.masterJobContainers.push(containerGroup);
  }
toggleMawbInputType(event: MouseEvent): void {
  event.stopPropagation();
  const isFreeText = this.f['isMawbFreeText']?.value;
  this.f['isMawbFreeText']?.setValue(!isFreeText);
  this.masterJobForm.get('MBLNo')?.reset();
  
  // If toggling to dropdown mode and no stock available, force back to manual
  if (!isFreeText && this.isMawbDropdownDisabled) {
    this.f['isMawbFreeText']?.setValue(true);
  }
}
  loadInitialData() {
  const companySid = this.currentCompany?.CompanyMasterSid;
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid
  return forkJoin({
    //  departments: this.operationService.getDepartmentByType('Air', companySid) 
    //   .pipe(catchError(err => of({ data: [] }))),
    department: this.operationService.getDepartmentByType(
  CompanyMasterSid,
  ['Air']
).pipe(catchError(() => of([]))),
    ports: this.operationService.getAllPorts()
      .pipe(catchError(err => of({ data: [] }))),
    // Replace individual API calls with getCustomerByItsType
    agents: this.operationService.getCustomerByItsType({CompanyMasterSid, types: ['vendor', 'transporter', 'agent']})
      .pipe(catchError(err => of([]))),
    carriers: this.operationService.getCustomerByItsType({ CompanyMasterSid , types : ['carrier']})
        .pipe(catchError(err => of([]))),
    forwarders: this.operationService.getCustomerByItsType({ CompanyMasterSid , types : ['forwarder']})
      .pipe(catchError(err => of({ data: [] }))),
    cfsList: this.operationService.getCustomerByItsType({ CompanyMasterSid , types : ['cFS']})
      .pipe(catchError(err => of({ data: [] }))),
    yards: this.operationService.getCustomerByItsType({ CompanyMasterSid , types : ['yard']}) 
         .pipe(catchError(err => of({ data: [] }))),
    containerTypes: this.operationService.getAllContainerTypes()
      .pipe(catchError(err => of({ data: [] }))),
    currencies: this.operationService.getAllCurrencies()
      .pipe(catchError(err => of({ data: [] }))),
    packageTypes: this.operationService.getUOMsByType('P') 
      .pipe(catchError(err => of([]))),
    customers: this.operationService.getAllCustomerRelatedLookups(this.filterOption)
      .pipe(catchError(err => of([]))),
    charge: this.operationService.getAllCharges(companySid)
      .pipe(catchError(err => of({ data: [] }))),
      airline: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['airLine'] }).pipe(catchError(err => of([]))),
      mawbStockAllocationConfig: this.masterService.getConfigurationValue(CompanyMasterSid, 'MawbStockAllocation')
        .pipe(catchError(() => of(null))),
    // userCountry: this.operationService.getCountryById(this.currentCompany.CountryMasterSid).pipe(catchError(err => of({}))),
  }).pipe(tap(({ 
    department,  ports, agents, carriers, forwarders, cfsList, yards,
    containerTypes, currencies, packageTypes, customers,charge, airline, mawbStockAllocationConfig
  }) => {
     this.departments = department || [];
    this.isMawbStockAllocationEnabled = this.parseCompanyBoolean(mawbStockAllocationConfig);
    
    this.portList = (ports.data || []).map(p => ({ ...p, Country: p.countryMaster?.countryName }));
    this.chargeList = charge || [];
    // console.log(this.chargeList,"CHARGELIST")
    // Update all customer type lists with data from the new API
    this.agentList = agents.data ;
    this.carrierList = carriers.data;
    this.forwarderList = forwarders.data;
    this.cfsList = cfsList.data ;
    this.yardList = yards.data ; 
    this.airlineList = airline.data;
     

    this.containerTypeList = containerTypes.data ;
    const rawCurrencies: any[] = Array.isArray(currencies)
    ? currencies
    : currencies?.data || [];
    this.currencyList = rawCurrencies.map((c: any) => ({
      ...c,
      countryName: c?.countryMaster?.countryName || ''
    }));
    this.packageTypeList = packageTypes.data ;
    this.filteredDestinationAgents = [...this.agentList];
    this.filteredOriginAgents = [...this.agentList];
    this.customerList = customers.data;
    this.updateCarrierValidation(this.selectedDepartment);

    this.filteredPorts = [];
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFPOD = [];
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
  const carrierControl = this.masterJobForm.get('CarrierName');
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
  this.masterJobForm.get('MBLNo')?.enable();
  this.masterJobForm.get('MBLNo')?.setValidators([
    Validators.required,
    Validators.maxLength(50)
  ]);
  this.masterJobForm.get('MBLNo')?.updateValueAndValidity();
  this.f['isMawbFreeText']?.setValue(true);
  this.isMawbDropdownDisabled = true;
  this.toastr.warning(
    message || 'No allocated/customer/common/carrier MAWB stock found. Enter MAWB manually.',
    'Manual MAWB Entry'
  );
}

private enableManualMawbEntryForBlankEditRecord(): void {
  const isAirExport =
    this.selectedDepartment?.departmentType?.toUpperCase() === 'AIR' &&
    this.selectedDepartment?.ExportImport?.toUpperCase() === 'EXPORT';
  const currentMawb = String(this.masterJobForm.get('MBLNo')?.value ?? '').trim();

  if (
    this.isEditMode &&
    isAirExport &&
    this.isMawbStockAllocationEnabled &&
    !currentMawb &&
    !this.allowManualMawbEntryOnAutoAllocationError
  ) {
    this.enableManualMawbEntryFallback(
      'No MAWB stock available for auto allocation. Please enter MAWB manually.'
    );
  }
}

private handleMawbSaveError(error: any, action: 'create' | 'update'): void {
  const fallbackMessage =
    action === 'create'
      ? 'Failed to create Master Air Waybill'
      : 'Failed to update Master Air Waybill';
  const backendMessage = extractBackendErrorMessage(error, fallbackMessage);

  if (backendMessage.includes('No MAWB stock available for auto allocation')) {
    this.enableManualMawbEntryFallback(backendMessage);
    return;
  }

  if (backendMessage) {
    if (backendMessage.includes('MBL Number') || backendMessage.toLowerCase().includes('duplicate')) {
      this.masterJobForm.get('MBLNo')?.enable();
      this.masterJobForm.get('MBLNo')?.markAsTouched();
      this.masterJobForm.get('MBLNo')?.setErrors({ duplicate: true });
      this.toastr.warning(backendMessage, 'Duplicate MAWB');
      return;
    }

    this.toastr.error(backendMessage);
    return;
  }

  this.toastr.error(fallbackMessage);
}


toggleInputType(mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
  event.stopPropagation();
  const value = this.f[flagCtrl]?.value;
  this.f[flagCtrl]?.setValue(!value);
  this.masterJobForm.get(mainCtrl)?.reset();
}
loadMawbStock(data: any): void {
  const isAirDept = this.selectedDepartment?.departmentType?.toUpperCase() === 'AIR';
  const isAirExport = this.selectedDepartment?.ExportImport?.toUpperCase() === 'EXPORT';
  if (!isAirDept || !isAirExport || this.isMawbStockAllocationEnabled) {
    this.mawbStockList = [];
    this.mawbStockSource = 'NONE';
    this.isMawbDropdownDisabled = true;
    this.f['isMawbFreeText']?.setValue(false, { emitEvent: false });
    return;
  }

  const companyId = data?.CompanyMasterSid ?? this.currentCompany?.CompanyMasterSid;
  const branchId  = data?.BranchMasterSid  ?? this.currentBranch?.BranchMasterSid;

  // Extract optional values
  const customerId: number | null = data?.houseJob?.[0]?.CustomerMasterSid ?? null;
  const carrierName: string | null = data?.voyages?.[0]?.CarrierName ?? this.masterJobForm.get('CarrierName')?.value ?? null;
  const selectedCarrier = carrierName
    ? this.carrierList?.find(
        (carrier: any) => carrier.CustomerName?.trim().toLowerCase() === carrierName.trim().toLowerCase()
      )
    : null;

  // Resolve airlineId from airlineList using carrierName
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
    this.mawbStockList        = [];
    this.mawbStockSource      = 'NONE';
    this.isMawbDropdownDisabled = true;
    this.f['isMawbFreeText']?.setValue(true, { emitEvent: false });
    return;
  }

  // Build payload — send null if not available
  const payload = {
    customerId: customerId,   // null → backend skips Step 1
    airlineId:  airlineId,    // null → backend skips Step 2
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
        this.f['isMawbFreeText']?.setValue(true, { emitEvent: false });
        this.showNoMawbStockWarningOnce(warningKey);
      } else {
        this.lastNoMawbStockWarningKey = null;
        this.isMawbDropdownDisabled = false;
        this.f['isMawbFreeText']?.setValue(false, { emitEvent: false });
      }
    },
    error: (err) => {
      console.error('[MAWB Stock] Error:', err);
      this.mawbStockList        = [];
      this.mawbStockSource      = 'NONE';
      this.isMawbDropdownDisabled = true;
      this.f['isMawbFreeText']?.setValue(true, { emitEvent: false });
    }
  });
}
  loadMasterJobData(masterJobSid: number): void {
      this.isSaving = true;
      this.spinner.show();
      const payload = {
        screenName : 'Master Air Waybill',
        MasterJobSid : masterJobSid
      }
    forkJoin({
      masterJob: this.operationService.getMasterJobById(payload),
      arapData: this.operationService.getMasterJobARAPData(masterJobSid)
    }).subscribe({
      next: (response: any) => {
        if (response.masterJob.status && response.masterJob.data) {
          const data = response.masterJob.data;
          this.logMawbDebug('loadMasterJobData:start', {
            masterJobSid,
            isEditMode: this.isEditMode,
            hasData: !!data,
            containers: data?.containers?.length || 0,
            bookings: data?.bookingList?.length || 0,
            connections: data?.masterJobConnection?.length || 0,
            rates: data?.costRevenueCharges?.length || 0,
          });
          this.masterAirWayData= data;
          this.masterJobData=data;
          const aggregatedTotals = data.aggregatedTotals; 
          this.isEditMode = true;
          this.suppressDirtyTracking = true;
          try {
            this.patchFormValues({
              ...data,
              NoOfPkg: aggregatedTotals?.NoOfPkg || data.NoOfPkg,
              GrossWeight: aggregatedTotals?.GrossWeight || data.GrossWeight,
              NetWeight: aggregatedTotals?.NetWeight || data.NetWeight,
              ChargeableWeight: aggregatedTotals?.ChargeableWeight || data.ChargeableWeight,
              Volume: aggregatedTotals?.Volume || data.Volume,
              WeightIn: aggregatedTotals?.WeightIn || data.WeightIn
            });
          } finally {
            this.suppressDirtyTracking = false;
          }
          this.loadLinkedMasterJobNumber(data?.others?.[0]?.ImportMasterJobSid || null);
         setTimeout(() => {
          this.loadMawbStock(data);
        }, 1000);
        }
        console.log("loadMasterStock", response);
        // Handle AR/AP data - Ensure it's always an array
        if (response.arapData) {
          // Check if the response is an object with data property
          let arapResponse = response.arapData;

          // If it has a data property, use that
          if (arapResponse.data !== undefined) {
            this.arapData = Array.isArray(arapResponse.data) ? arapResponse.data : [];
          }
          // If it's directly an array
          else if (Array.isArray(arapResponse)) {
            this.arapData = arapResponse;
          }
          // If it's an object with status property
          else if (arapResponse.status && arapResponse.data) {
            this.arapData = Array.isArray(arapResponse.data) ? arapResponse.data : [];
          }
          // Default to empty array
          else {
            this.arapData = [];
          }

          // Format the data for display (only if we have data)
          if (this.arapData.length > 0) {
            this.arapData = this.arapData.map(item => ({
              ...item,
              voucherType: this.getVoucherType(item.DocumentTypeCode),
              status: this.getPaymentStatus(item),
              amountFormatted: this.formatCurrency(item.Amount, item.CurrencyCode),
              localAmountFormatted: this.formatCurrency(item.LocalAmount, 'USD')
            }));
          }
        } else {
          this.arapData = [];
        }
          this.resetDirtyState();
          this.logMawbDebug('loadMasterJobData:afterReset', {
            isDirty: this.isDirty,
            unsavedChanges: this.unsavedChanges,
            initialCaptured: this.initialFormValue !== null,
          });
          this.isSaving = false;
          this.isLoading = false;
          this.spinner.hide();
      },
      error: (error) => {
        this.toastr.error('Failed to load master Air Waybill data');
        console.error('Error loading master Air Waybill:', error);
        this.isSaving = false;
        this.isLoading = false;
        this.spinner.hide();
      }
    });
  }

  private loadLinkedMasterJobNumber(importMasterJobSid: number | null): void {
    const linkedControl = this.masterJobForm.get('ImportMasterJobNumber');
    if (!importMasterJobSid) {
      linkedControl?.setValue('');
      return;
    }

    this.operationService.getMasterJobById({
      MasterJobSid: importMasterJobSid,
      screenName: 'Master Air Waybill'
    }).subscribe({
      next: (response: any) => {
        linkedControl?.setValue(response?.data?.MasterJobNumber || '');
      },
      error: () => {
        linkedControl?.setValue('');
      }
    });
  }

  patchFormValues(data: any) {
  this.suppressDirtyTracking = true;
  try {
  this.logMawbDebug('patchFormValues:start', {
    masterJobSid: data?.MasterJobSid,
    department: data?.DepartmentMasterSid,
    hasOthers: !!data?.others?.length,
    hasVoyages: !!data?.voyages?.length,
    containers: data?.containers?.length || 0,
    bookings: data?.bookingList?.length || 0,
  });
  // Helper to find port SID by port code (if stored as code in data)
  const findPortSidByCode = (portCodeOrSid: any): number | null => {
    if (!portCodeOrSid && portCodeOrSid !== 0) return null;
    // if it's a number, assume already SID
    if (typeof portCodeOrSid === 'number') return portCodeOrSid;
    // if string, try match by PortCode
    const p = this.portList.find(p => p.PortCode === portCodeOrSid);
    return p ? p.PortMasterSid : null;
  };
  

  // Patch master job fields
  this.masterJobForm.patchValue({
    DepartmentMasterSid: data.DepartmentMasterSid,
    MasterJobNumber: data.MasterJobNumber,
    MasterJobDate: data.MasterJobDate ? new Date(data.MasterJobDate) : null,
    JobStatus: data.JobStatus,
    FreightPPCC: data.FreightPPCC,
    DestinationAgent: data.DestinationAgent,
    DestinationAgentAddress: data.DestinationAgentAddress,
    MBLNo: data.MBLNo,
    isMawbFreeText: false,
    MBLDate: data.MBLDate ? new Date(data.MBLDate) : null,
    BLReleaseType: data.BLReleaseType,
    NoofOriginal: data.NoofOriginal,
    OriginAgent: data.OriginAgent,
    POO: findPortSidByCode(data.POO),
    POL: findPortSidByCode(data.POL),
    POD: findPortSidByCode(data.POD),
    FPD: findPortSidByCode(data.FPD),
    POLTerminal: data.POLTerminal,
    PODTerminal: data.PODTerminal,
    MovementType: data.MovementType,
    ShipmentTerms: data.ShipmentTerms,
    PkgType: data.PkgType,
    NoOfPkg: data.NoOfPkg,
    WeightIn: data.WeightIn || 'Kg(s)',
    GrossWeight: data.GrossWeight,
    NetWeight: data.NetWeight,
    ChargeableWeight: data.ChargeableWeight,
    Volume: data.Volume,
    Haz: data.Haz === 'Y',
    DGBookingDate: data.DGBookingDate ? new Date(data.DGBookingDate) : null,
    DGApprovedDate: data.DGApprovedDate ? new Date(data.DGApprovedDate) : null,
    CommodityDescription: data.CommodityDescription,
    MarksandNumber: data.MarksandNumber,
    Status: data.Status === 'A' ? 'Active' : 'Suspended',
    
    // Voyage data
    MasterJobVoyageSid: data.MasterJobVoyageSid || null,
    VoyageMasterSid: data.VoyageMasterSid || null,
    VesselName: data.VesselName || '',
    VoyageNo: data.VoyageNo || '',
    ETA: data.ETA ? new Date(data.ETA) : null,
    ETD: data.ETD ? new Date(data.ETD) : null,
    ATA: data.ATA ? new Date(data.ATA) : null,
    ATD: data.ATD ? new Date(data.ATD) : null,
    DestinationATA: data.DestinationATA ? new Date(data.DestinationATA) : null,
    CarrierMasterSid: data.CarrierMasterSid || null,
    CarrierName: data.CarrierName || '',
    PortCutoffDate: data.PortCutoffDate ? new Date(data.PortCutoffDate) : null,
    SiCutoffDate: data.SiCutoffDate ? new Date(data.SiCutoffDate) : null,
  });

  this.enableManualMawbEntryForBlankEditRecord();

  if (data.others && data.others.length > 0) {
    const othersData = data.others[0];
    
    // Find the CFS object if CFS value exists
    let cfsValue = othersData.CFS;
    if (cfsValue && this.cfsList.length > 0) {
      const foundCFS = this.cfsList.find(cfs => 
        cfs.CustomerMasterSid === cfsValue || cfs.CustomerName === cfsValue
      );
      if (foundCFS) {
        cfsValue = foundCFS.CustomerMasterSid;
      }
    }

    // Find the Yard object if Yard value exists
    let yardValue = othersData.Yard;
    if (yardValue && this.yardList.length > 0) {
      const foundYard = this.yardList.find(yard => 
        yard.CustomerMasterSid === yardValue || yard.CustomerName === yardValue
      );
      if (foundYard) {
        yardValue = foundYard.CustomerMasterSid;
      }
    }


  // ✅ PATCH OTHERS DATA WITH MasterJobOthersSid
  if (data.others && data.others.length > 0) {
    const othersData = data.others[0]; // Assuming others is an array with one object
    this.masterJobForm.patchValue({
      MasterJobOthersSid: othersData.MasterJobOthersSid || null, // ✅ ADD THIS
      Yard: othersData.Yard || null,
      YardAddress: othersData.YardAddress || '',
      Transporter: othersData.Transporter || '',
      HandlingInformation: othersData.HandlingInformation || '',
      InternalNote: othersData.InternalNote || '',
      CFS: othersData.CFS || null,
      CFSAddress: othersData.CFSAddress || '',
      StuffingStartDate: othersData.StuffingStartDate ? new Date(othersData.StuffingStartDate) : null,
      StuffingEndDate: othersData.StuffingEndDate ? new Date(othersData.StuffingEndDate) : null,
      CurrencyCode: othersData.CurrencyCode || '',
      SellExchangeRate: othersData.SellExchangeRate || null,
      AgentExchangeRate: othersData.AgentExchangeRate || null,
      Coload: othersData.Coload === 'Y',
      CoLoader: othersData.CoLoader || '',
      ExportDoNo: othersData.ExportDoNo || '',
      CarrierRef: othersData.CarrierRef || '',
          AgentRef: othersData.AgentRef || '',
      ImportMasterJobSid: othersData.ImportMasterJobSid || null,
      ExportToImport: othersData.ExportToImport || 'N',
      ExportDoDate: othersData.ExportDoDate ? new Date(othersData.ExportDoDate) : null,
      SOBDate: othersData.SOBDate ? new Date(othersData.SOBDate) : null,
    }, { emitEvent: false });
    this.selectedTransferCompanySid = othersData.DestinationCompanyMasterSid || data.DestinationCompanyMasterSid || null;
    this.selectedTransferBranchSid = othersData.DestinationBranchMasterSid || data.DestinationBranchMasterSid || null;
    if (this.selectedTransferCompanySid) {
      this.onTransferCompanyChange(this.selectedTransferCompanySid);
      if (this.selectedTransferBranchSid && !this.filteredTransferBranches.some(
        (branch: any) => branch?.BranchMasterSid === this.selectedTransferBranchSid
      )) {
        this.selectedTransferBranchSid = null;
      }
    }
    if (othersData.Coload === 'Y') {
      this.masterJobForm.get('CoLoader')?.enable();
    } else {
      this.masterJobForm.get('CoLoader')?.disable();
    }
  
  }
}

  // Set department info
    const selectedDepartment = this.departments.find(dep => dep.DepartmentMasterSid === data.DepartmentMasterSid);
    if (selectedDepartment) {
      this.onDeptChange(selectedDepartment,true);
    }

    // Patch voyage fields if voyage data exists
    if (data.voyages && data.voyages.length > 0) {
       const validVoyages = data.voyages.filter(voyage => voyage.VoyageMasterSid !== null);
      let voyage;

      if (validVoyages.length > 0) {
        voyage = validVoyages.reduce((latest, current) =>
          current.MasterJobVoyageSid > latest.MasterJobVoyageSid ? current : latest
        );
      } else {
        voyage = data.voyages[0];
      }

      // console.log('Voyage data for patching PortCutoffDate:', voyage);
      this.masterJobForm.patchValue({
        MasterJobVoyageSid: voyage.MasterJobVoyageSid,
        VoyageMasterSid: voyage.VoyageMasterSid,
        VesselName: voyage.VesselName,
        VoyageNo: voyage.VoyageNo,
        ETA: voyage.ETA ? new Date(voyage.ETA) : null,
        ETD: voyage.ETD ? new Date(voyage.ETD) : null,
        ATA: voyage.ATA ? new Date(voyage.ATA) : null,
        ATD: voyage.ATD ? new Date(voyage.ATD) : null,
        DestinationATA: voyage.DestinationATA ? new Date(voyage.DestinationATA) : null,
        CarrierMasterSid: voyage.CarrierMasterSid,
        CarrierName: voyage.CarrierName,
        PortCutoffDate: voyage.PortCutoff ? new Date(voyage.PortCutoff) :
          voyage.PortCutoffDate ? new Date(voyage.PortCutoffDate) :
            data.PortCutoffDate ? new Date(data.PortCutoffDate) : null,
      }, { emitEvent: false });
    }


  // ✅ Fixed: Populate carrier dropdown for edit mode
  if (data.CarrierName && data.CarrierMasterSid) {
    const existingCarrier = this.carrierList.find(c => c.CarrierMasterSid === data.CarrierMasterSid);
    if (!existingCarrier) {
      this.carrierList.push({
        CarrierMasterSid: data.CarrierMasterSid,
        CarrierName: data.CarrierName
      });
    }
  }

  // Patch connection, containers, rates, edocs, emails, container activities
  this.masterjobConnectionArr = (data.masterJobConnection || []).map(connection => {
      return {
        ...connection,
        MasterJobConnectionSid: connection.MasterJobConnectionSid,
      }
    }); // for child component
    this.connectionResult = [...this.masterjobConnectionArr]

  // Patch containers
  if (data.containers && data.containers.length > 0) {
    this.masterJobContainers.clear(); 
    data.containers.forEach((container: any) => {
      this.addContainer(container);
    });
  }

  // Patch cost revenue charges
    this.masterJobRateArr = (data.costRevenueCharges || []).map(rate => ({
      ...rate,
      RateSid : rate.CostRevenueChargesSid,
      status : rate.status  === "A" ? "Active" : "Suspended"
    }));
    this.rateResult = [...this.masterJobRateArr];
    this.calculateChargeWiseProfit();
    this.calculateCustomerWiseAmount();


  // Patch container activities
  if (data.containerActivities && data.containerActivities.length > 0) {
    this.containerActivityData = data.containerActivities.map((activity: any) => ({
      ...activity,
      JobMasterSid: activity.JobMasterSid || this.masterJobSid,
      ActivityDate: activity.ActivityDate ? new Date(activity.ActivityDate) : new Date(activity.ActivityDate)
    }));
    this.containerActivityResetTrigger = !this.containerActivityResetTrigger;
  }

  if (data.edocs && data.edocs.length > 0) {
    this.edocData = data.edocs.map(edoc => ({
      ...edoc,
      status: edoc.status === "A" ? "Active" : "Suspended"
    }));
  }
  
  if (data.emails && data.emails.length > 0) {
    this.emailData = data.emails.map(email => ({
      ...email,
      status: email.status === "A" ? "Active" : "Suspended"
    }));
  }

  // Handle agent filtering
  const destinationAgent = data.DestinationAgent;
  const originAgent = data.OriginAgent;
  
  if (destinationAgent) {
    this.filteredOriginAgents = this.agentList.filter(agent => 
      agent.CustomerName !== destinationAgent
    );
  }
  
  if (originAgent) {
    this.filteredDestinationAgents = this.agentList.filter(agent => 
      agent.CustomerName !== originAgent
    );
  }

  const allShipments = data.allShipments || [];

  if(data.allShipments.length > 0) {
    this.patchShipments(allShipments);
  }

  this.isSaving = false;
  this.logMawbDebug('patchFormValues:end', {
    isDirty: this.isDirty,
    unsavedChanges: this.unsavedChanges,
    attachedBookings: this.attachedBookings?.length || 0,
    connections: this.connectionResult?.length || 0,
    rates: this.rateResult?.length || 0,
  });
  } finally {
    this.suppressDirtyTracking = false;
  }
}

  onDestinationAgentChange(selectedAgent: any) {
    if (this.isExportToImportCompleted && !this.isLoading) {
      return;
    }
    if (!selectedAgent) {
      this.filteredOriginAgents = [...this.agentList];
      this.masterJobForm.get('DestinationAgentAddress')?.setValue('');
      return;
    }
    
    this.filteredOriginAgents = this.agentList.filter(agent => 
      agent.CustomerName !== selectedAgent.CustomerName
    );
    
    this.masterJobForm.get('DestinationAgentAddress')?.setValue(
      selectedAgent.CustomerAddress1 || ''
    );
  }

  onOriginAgentChange(selectedAgent: any) {
    if (!selectedAgent) {
      this.filteredDestinationAgents = [...this.agentList];
      return;
    }
    
    this.filteredDestinationAgents = this.agentList.filter(agent => 
      agent.CustomerName !== selectedAgent.CustomerName
    );
  }

  getPackageTypeName(pkgTypeSid: number): string {
    const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
    return packageType ? packageType.UOMName : 'Unknown';
  }

  get isExportToImportCompleted(): boolean {
    return this.masterJobForm.get('ExportToImport')?.value === 'Y';
  }
  get hasHouseJobs(): boolean {
    return Array.isArray(this.masterJobData?.houseJob) && this.masterJobData.houseJob.length > 0;
  }
  get canPullToImportBranch(): boolean {
    const exportImport = (this.selectedDepartment?.ExportImport || '').toString().toLowerCase();
    return this.isEditMode &&  this.hasHouseJobs &&  exportImport === 'export' && this.availableTransferCompanies.length > 0;
  }

  private initializeTransferOptions(): void {
    const allCompanies = this.userData?.userCompanyMaster || [];

    this.availableTransferCompanies = allCompanies
      .map((ucm: any) => ucm?.companyMaster)
      .filter((company: any) => !!company?.CompanyMasterSid);

    this.selectedTransferCompanySid = null;
    this.selectedTransferBranchSid = null;
    this.filteredTransferBranches = [];
  }

  onTransferCompanyChange(companySid: number | null): void {
    this.selectedTransferCompanySid = companySid ? Number(companySid) : null;
    this.selectedTransferBranchSid = null;

    if (!this.selectedTransferCompanySid) {
      this.filteredTransferBranches = [];
      return;
    }

    const selectedCompany = (this.userData?.userCompanyMaster || []).find(
      (ucm: any) => ucm?.CompanyMasterSid === this.selectedTransferCompanySid
    )?.companyMaster;

    this.filteredTransferBranches = (selectedCompany?.userBranchMaster || [])
      .filter((ubm: any) =>
        ubm?.GiveAccess === 'Y' &&
        (
          selectedCompany?.CompanyMasterSid !== this.currentCompany?.CompanyMasterSid ||
          ubm?.branchMaster?.BranchMasterSid !== this.currentBranch?.BranchMasterSid
        )
      )
      .map((ubm: any) => ({
        ...ubm.branchMaster,
        CompanyMasterSid: selectedCompany?.CompanyMasterSid,
        companyName: selectedCompany?.companyName,
      }));
  }

  async pullMasterJobToImportBranch(): Promise<void> {
    if (!this.masterJobSid || !this.canPullToImportBranch) {
      return;
    }

    if (!this.selectedTransferCompanySid) {
      this.toastr.warning('Please choose the destination company first.');
      return;
    }

    if (!this.selectedTransferBranchSid) {
      this.toastr.warning('Please choose the destination branch first.');
      return;
    }

    if (this.isExportToImportCompleted) {
      this.toastr.info('Pull To Import already completed for this master job.');
      return;
    }

    const selectedCompany = this.availableTransferCompanies.find(
      (company: any) => company?.CompanyMasterSid === this.selectedTransferCompanySid
    );

    const selectedBranch = this.filteredTransferBranches.find(
      branch => branch?.BranchMasterSid === this.selectedTransferBranchSid
    );

    const proceed = confirm(
      `Pull this export master job and its active house jobs to ${selectedBranch?.branchName || 'the selected branch'} under ${selectedCompany?.companyName || 'the selected company'} as an import job?`
    );

    if (!proceed) {
      return;
    }

    this.isPullingToImportBranch = true;

    this.operationService.pullMasterJobToImportBranch({
      MasterJobSid: this.masterJobSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      SourceBranchMasterSid: this.currentBranch?.BranchMasterSid,
      DestinationCompanyMasterSid: this.selectedTransferCompanySid,
      DestinationBranchMasterSid: this.selectedTransferBranchSid,
      CreatedBy: this.appSettingsService.userSettingSource.value?.['userEmail'],
    }).subscribe({
      next: (response: any) => {
        this.isPullingToImportBranch = false;

        if (!response?.status) {
          this.toastr.error(response?.message || 'Failed to pull master job to import branch.');
          return;
        }
        const createdMasterJobSid = response?.data?.masterJobSid;
        const createdJobNumber = response?.data?.masterJobNumber;
        const destinationDepartmentName = response?.data?.destinationDepartmentName;
        const successMessage = createdJobNumber
          ? `Import master job ${createdJobNumber} created${destinationDepartmentName ? ` in ${destinationDepartmentName}` : ''}.`
          : 'Import master job created successfully.';

        this.masterJobForm.get('ExportToImport')?.setValue('Y');
        this.toastr.success(successMessage);
          if (createdMasterJobSid) {
          this.masterJobSid = createdMasterJobSid;
          this.loadMasterJobData(createdMasterJobSid);
        }
      },
      error: () => {
        this.isPullingToImportBranch = false;
        this.toastr.error('Failed to pull master job to import branch.');
      }
    });
  }

  setAddress(controlName: string, item: any) {
    this.masterJobForm.get(controlName)?.setValue(item ? item.CustomerAddress1 : '');
  }


  onDeptChange(department: any, isEditMode = false) {
  this.selectedDepartment = department;
  if (!department) {
    this.selectedDepartmentType = '';
    this.selectedFCLLCL = 'LCL';
    this.isAirDepartment = false;
    this.filteredPorts = [];
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFPOD = [];
    this.masterJobForm.get('POO')?.setValue(null);
    this.masterJobForm.get('POL')?.setValue(null);
    this.masterJobForm.get('POD')?.setValue(null);
    this.masterJobForm.get('FPD')?.setValue(null);
    this.masterJobForm.get('ETA')?.setValue('');
    this.masterJobForm.get('ETD')?.setValue('');
    this.masterJobForm.get('MovementType')?.setValue(null);

    this.f['isMawbFreeText']?.setValue(false);
    this.mawbStockList = [];
    this.mawbStockSource = 'NONE';
    this.isMawbDropdownDisabled = false;
    this.allowManualMawbEntryOnAutoAllocationError = false;

    if (this.isEditMode) {
      this.masterJobForm.get('MBLNo')?.enable();
    } else {
      this.masterJobForm.get('MBLNo')?.enable();
      this.masterJobForm.get('MBLNo')?.clearValidators();
    }
    this.updateCarrierValidation(null);
    this.masterJobForm.get('MBLNo')?.updateValueAndValidity();
    return;
  }

  this.selectedDepartmentType = this.normalizePortText(department?.departmentType);
  this.selectedFCLLCL = this.resolveSelectedSegment(department);

  this.isAirDepartment = this.selectedDepartmentType === 'AIR';
  const mblNoControl = this.masterJobForm.get('MBLNo');
  const isAirImport = department.ExportImport?.toUpperCase() === 'IMPORT';
  const isAirExport = department.ExportImport?.toUpperCase() === 'EXPORT';

  this.f['isMawbFreeText']?.setValue(false);
  this.mawbStockList = [];
  this.mawbStockSource = 'NONE';
  this.isMawbDropdownDisabled = !this.isAirDepartment;
  this.allowManualMawbEntryOnAutoAllocationError = false;

  if (this.isAirDepartment) {
    if (isAirImport) {
      mblNoControl?.enable();
      mblNoControl?.setValidators([
        Validators.required,
        Validators.maxLength(50)
      ]);
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
        if (!isEditMode && !this.masterJobForm.get('MBLNo')?.value) {
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

  this.enableManualMawbEntryForBlankEditRecord();

  if (this.isAirDepartment && isAirExport && !this.isMawbStockAllocationEnabled) {
    const mawbSource = this.isEditMode
      ? this.masterAirWayData
      : {
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          BranchMasterSid: this.currentBranch?.BranchMasterSid,
          voyages: [{ CarrierName: this.masterJobForm.get('CarrierName')?.value || null }],
          houseJob: []
        };

    setTimeout(() => {
      this.loadMawbStock(mawbSource);
    }, 300);
  }

  this.refreshPortFilters();

  if (this.selectedDepartmentType === 'SEA') {
    this.masterJobForm.get('MovementType')?.setValue('Sea');
  } else if (this.selectedDepartmentType === 'AIR') {
    this.masterJobForm.get('MovementType')?.setValue('Flight');
  } else if (this.selectedDepartmentType === 'ROAD' || this.selectedDepartmentType === 'TRANSPORT') {
    this.masterJobForm.get('MovementType')?.setValue('Road');
  } else {
    this.masterJobForm.get('MovementType')?.setValue(this.selectedDepartmentType || null);
  }
}
  onRouteChange(): void {
    const polSid = this.masterJobForm.get('POL')?.value;
    const podSid = this.masterJobForm.get('POD')?.value;
    this.refreshPortFilters();
    
    if (polSid && podSid && polSid === podSid) {
      this.setControlError(this.masterJobForm.get('POD'), 'samePort', true);
      this.setControlError(this.masterJobForm.get('POL'), 'samePort', true);
      this.toastr.warning('POL and POD cannot be the same');
    } else {
      this.clearControlError(this.masterJobForm.get('POD'), 'samePort');
      this.clearControlError(this.masterJobForm.get('POL'), 'samePort');
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

    const selectedPOL = this.masterJobForm.get('POL')?.value;
    const selectedPOD = this.masterJobForm.get('POD')?.value;

    return {
      filteredPorts: basePorts,
      filteredPOO: pooPorts,
      filteredPOL: polPorts.filter(port => port.PortMasterSid !== selectedPOD),
      filteredPOD: podPorts.filter(port => port.PortMasterSid !== selectedPOL),
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
    const control = this.masterJobForm.get(controlName);
    const selectedValue = control?.value;

    if (!selectedValue) {
      return false;
    }

    const isValid = allowedPorts.some(port => port.PortMasterSid === selectedValue);
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

    const jobType = this.normalizePortText(this.masterJobForm.get('JobType')?.value);
    if (jobType === 'EXPORT' || jobType === 'IMPORT') {
      return jobType as 'EXPORT' | 'IMPORT';
    }

    return '';
  }

  private getPortsByReferenceCountry(controlName: 'POL' | 'POD', fallbackPorts: any[]): any[] {
    const referencePort = this.getPortBySid(this.masterJobForm.get(controlName)?.value);
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
    const companyCountryId = this.toNumericValue(this.currentBranch?.CountryMasterSid ?? this.currentBranch?.branchMaster?.CountryMasterSid);
    const portCountryId = this.toNumericValue(port?.CountryMasterSid);

   return !!companyCountryId && !!portCountryId && companyCountryId === portCountryId;
  }

  private isForeignCountryPort(port: any): boolean {
    const companyCountryId = this.toNumericValue(this.currentBranch?.CountryMasterSid ?? this.currentBranch?.branchMaster?.CountryMasterSid);
    const portCountryId = this.toNumericValue(port?.CountryMasterSid);
   return !!companyCountryId && !!portCountryId && companyCountryId !== portCountryId;
  }

  private getPortBySid(portSid: number | null | undefined): any | null {
    if (!portSid) {
      return null;
    }

    return this.portList.find(port => port.PortMasterSid === portSid) || null;
  }

  private normalizePortText(value: any): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private resolveSelectedSegment(department: any): string {
    const departmentType = this.normalizePortText(department?.departmentType);
    if (departmentType === 'SEA') {
      return this.normalizePortText(department?.FCLLCL) || 'LCL';
    }

    return departmentType || 'LCL';
  }

  private shouldUseAllPortOptions(): boolean {
    const departmentType = this.normalizePortText(this.selectedDepartmentType || this.selectedDepartment?.departmentType);
    const segment = this.normalizePortText(this.selectedFCLLCL);

    return ['OTHER', 'OTHERS'].includes(departmentType) || ['OTHER', 'OTHERS'].includes(segment);
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

  private getControlLabel(controlName: string): string {
    const controlLabelMap: { [key: string]: string } = {
      DepartmentMasterSid: 'Department',
      MasterJobNumber: 'Master Job Number',
      MasterJobDate: 'Master Job Date',
      FreightPPCC: 'Freight PP/CC',
      MBLNo: 'MAWB',
      MBLDate: 'MAWB Date',
      NoofOriginal: 'No Of Original',
      POL: 'POL',
      POD: 'POD',
      Status: 'Status',
      ETA: 'ETA',
      ETD: 'ETD',
      CarrierName: 'Carrier'
    };

    return controlLabelMap[controlName] || controlName;
  }

  private getControlTab(controlName: string): string {
    const controlTabMap: { [key: string]: string } = {
      Status: 'Others'
    };

    return controlTabMap[controlName] || 'Master';
  }

  private showControlValidationError(controlName: string): void {
    const invalidControl = this.masterJobForm.get(controlName);
    if (!invalidControl) {
      this.toastr.error('Please correct the highlighted fields');
      return;
    }

    this.selectedTab = this.getControlTab(controlName);
    const label = this.getControlLabel(controlName);

    if (invalidControl.hasError('required')) {
      this.toastr.error(`${label} is required`);
      return;
    }

    if (invalidControl.hasError('maxlength')) {
      const maxlength = invalidControl.getError('maxlength')?.requiredLength;
      this.toastr.error(maxlength ? `${label} allows maximum ${maxlength} characters` : `${label} exceeds allowed length`);
      return;
    }

    if (invalidControl.hasError('samePort')) {
      this.toastr.error('POL and POD cannot be the same port');
      return;
    }

    if (invalidControl.hasError('invalidDate')) {
      this.toastr.error('Master Job Date must be within the financial year');
      return;
    }

    if (invalidControl.hasError('etaLessThanOrEqualEtd')) {
      this.toastr.error('ETA date should be greater than ETD date');
      return;
    }

    if (invalidControl.hasError('duplicate')) {
      this.toastr.error(`${label} already exists`);
      return;
    }

    this.toastr.error(`${label} is invalid. Please correct it.`);
  }

  private showFirstFormError(): void {
    const firstInvalidControlName = Object.keys(this.masterJobForm.controls)
      .find((controlName) => this.masterJobForm.get(controlName)?.invalid);

    if (!firstInvalidControlName) {
      this.toastr.error('Please fill all required fields');
      return;
    }

    this.showControlValidationError(firstInvalidControlName);
  }

  private validateBeforeSave(): boolean {
    this.clearControlError(this.masterJobForm.get('ETA'), 'etaLessThanOrEqualEtd');
    this.clearControlError(this.masterJobForm.get('MasterJobDate'), 'invalidDate');
    this.clearControlError(this.masterJobForm.get('POL'), 'samePort');
    this.clearControlError(this.masterJobForm.get('POD'), 'samePort');

    const fy = this.appSettingsService.getCurrentFinancialYear();
    if (fy) {
      const masterJobDateValue = this.masterJobForm.getRawValue().MasterJobDate;
      const masterJobDate = new Date(masterJobDateValue);
      const fyStartDate = new Date(fy.StartDate);
      const fyEndDate = new Date(fy.EndDate);

      if (masterJobDateValue && (masterJobDate < fyStartDate || masterJobDate > fyEndDate)) {
        this.setControlError(this.masterJobForm.get('MasterJobDate'), 'invalidDate', true);
        this.masterJobForm.get('MasterJobDate')?.markAsTouched();
        this.showControlValidationError('MasterJobDate');
        return false;
      }
    }

    const etdValue = this.masterJobForm.get('ETD')?.value;
    const etaValue = this.masterJobForm.get('ETA')?.value;
    if (etdValue && etaValue) {
      const etdDate = new Date(etdValue);
      const etaDate = new Date(etaValue);
      if (!isNaN(etdDate.getTime()) && !isNaN(etaDate.getTime()) && etaDate <= etdDate) {
        this.setControlError(this.masterJobForm.get('ETA'), 'etaLessThanOrEqualEtd', true);
        this.masterJobForm.get('ETA')?.markAsTouched();
        this.showControlValidationError('ETA');
        return false;
      }
    }

    this.formSubmitted = true;
    this.masterJobForm.markAllAsTouched();

    const isAirImport = (
      this.selectedDepartment?.departmentType?.toUpperCase() === 'AIR' &&
      this.selectedDepartment?.ExportImport?.toUpperCase() === 'IMPORT'
    );
    const isAirExport = (
      this.selectedDepartment?.departmentType?.toUpperCase() === 'AIR' &&
      this.selectedDepartment?.ExportImport?.toUpperCase() === 'EXPORT'
    );

    const carrierControl = this.masterJobForm.get('CarrierName');
    if (isAirExport && this.isMawbStockAllocationEnabled && carrierControl?.invalid) {
      carrierControl.markAsTouched();
      this.showControlValidationError('CarrierName');
      return false;
    }

    const mblNoValue = this.masterJobForm.get('MBLNo')?.value?.trim();
    const requiresAirExportMawb = this.allowManualMawbEntryOnAutoAllocationError || this.isEditMode;

    if (isAirExport && !mblNoValue && requiresAirExportMawb) {
      this.setControlError(this.masterJobForm.get('MBLNo'), 'required', true);
      this.masterJobForm.get('MBLNo')?.markAsTouched();
      this.showControlValidationError('MBLNo');
      return false;
    }

    if (isAirImport && !mblNoValue) {
      this.setControlError(this.masterJobForm.get('MBLNo'), 'required', true);
      this.masterJobForm.get('MBLNo')?.markAsTouched();
      this.showControlValidationError('MBLNo');
      return false;
    }

    const polSid = this.masterJobForm.get('POL')?.value;
    const podSid = this.masterJobForm.get('POD')?.value;

    if (polSid && podSid && polSid === podSid) {
      this.setControlError(this.masterJobForm.get('POL'), 'samePort', true);
      this.setControlError(this.masterJobForm.get('POD'), 'samePort', true);
      this.masterJobForm.get('POL')?.markAsTouched();
      this.masterJobForm.get('POD')?.markAsTouched();
      this.showControlValidationError('POL');
      return false;
    }

    if (polSid && !podSid) {
      this.setControlError(this.masterJobForm.get('POD'), 'required', true);
      this.masterJobForm.get('POD')?.markAsTouched();
      this.showControlValidationError('POD');
      return false;
    }

    if (podSid && !polSid) {
      this.setControlError(this.masterJobForm.get('POL'), 'required', true);
      this.masterJobForm.get('POL')?.markAsTouched();
      this.showControlValidationError('POL');
      return false;
    }

    if (this.masterJobForm.invalid) {
      this.showFirstFormError();
      return false;
    }

    if (!this.costEntryComponent.validateRateArray()) {
      this.selectedTab = 'Rate';
      return false;
    }

    return true;
  }

  // Handle POL change
  handlePOLChange(selectedPort: any) {
    if (!selectedPort) {
      this.refreshPortFilters();
      return;
    }
    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.masterJobForm.get('POL')?.setValue(selectedPortSid, { emitEvent: false });
    this.onRouteChange();
  }

  // Handle POD change
  handlePODChange(selectedPort: any) {
    if (!selectedPort) {
      this.setControlError(this.masterJobForm.get('POD'), 'required', true);
      this.masterJobForm.get('POD')?.markAsTouched();
      this.masterJobForm.get('FPD')?.setValue(null);
      this.refreshPortFilters();
      return;
    }
    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.masterJobForm.get('POD')?.setValue(selectedPortSid, { emitEvent: false });
    this.masterJobForm.get('FPD')?.setValue(selectedPortSid);
    this.onRouteChange();
  }


  onSubmit(): void {
    if (this.isSaving || this.isLoading) {
      return;
    }

    if (this.isEditMode && !this.hasUnsavedChanges()) {
      this.toastr.warning('No changes to save');
      return;
    }

    if (!this.validateBeforeSave()) {
      return;
    }

    this.submitForm();
  }

  private submitForm(resolve?: (value: boolean) => void): void {
    this.isSaving = true;
    this.isLoading = true;
    this.spinner.show();

    const getPortCode = (portSid: any): string => {
        if (!portSid && portSid !== 0) return '';
        const port = this.portList.find(p => p.PortMasterSid === portSid);
        return port ? port.PortCode : portSid?.toString().substring(0, 100);
    };

    const formValue = this.masterJobForm.getRawValue();
    //     const isAirExport = (
    //     this.selectedDepartment?.departmentType?.toUpperCase() === 'AIR' &&
    //     this.selectedDepartment?.ExportImport?.toUpperCase() === 'EXPORT'
    // );

    const voyageData = {
      MasterJobVoyageSid: formValue.MasterJobVoyageSid,
      VoyageMasterSid: formValue.VoyageMasterSid,
      VesselName: formValue.VesselName,
      VoyageNo: formValue.VoyageNo,
      ETD: this.formatDate(formValue.ETD),
      ETA: this.formatDate(formValue.ETA),
      ATA: this.formatDate(formValue.ATA),
      ATD: this.formatDate(formValue.ATD),
      DestinationATA: this.formatDate(formValue.DestinationATA),
      CarrierSid: formValue.CarrierMasterSid,
      CarrierName: formValue.CarrierName,
    };

    // Create the others object from form values
    const othersData = {
        MasterJobOthersSid: formValue.MasterJobOthersSid || null,
        Yard: formValue.Yard,
        YardAddress: formValue.YardAddress,
        Transporter: formValue.Transporter,
        HandlingInformation: formValue.HandlingInformation,
        InternalNote: formValue.InternalNote,
        CFS: formValue.CFS,
        CFSAddress: formValue.CFSAddress,
        StuffingStartDate: formValue.StuffingStartDate,
        StuffingEndDate: formValue.StuffingEndDate,
        CurrencyCode: formValue.CurrencyCode || '',
        SellExchangeRate: formValue.SellExchangeRate,
        AgentExchangeRate: formValue.AgentExchangeRate,
        Coload: formValue.Coload ? 'Y' : 'N',
        CoLoader: formValue.CoLoader,
        ExportDoNo: formValue.ExportDoNo,
        ExportDoDate: formValue.ExportDoDate,
        SOBDate: formValue.SOBDate,
        ImportMasterJobSid: formValue.ImportMasterJobSid || null,
        ExportToImport: formValue.ExportToImport || 'N',
    };

    const formData: any = {
        ...formValue,
        // Use port codes instead of SIDs
        POO: getPortCode(formValue.POO),
        POL: getPortCode(formValue.POL),
        POD: getPortCode(formValue.POD),
        FPD: getPortCode(formValue.FPD),
        
        // Add the others data as a separate object
        others: othersData,
        voyages: [voyageData],
       MBLNo: formValue.MBLNo || '',
        // Ensure other string fields don't exceed limits
        DestinationAgentAddress: formValue.DestinationAgentAddress?.substring(0, 200) || '',
        POLTerminal: formValue.POLTerminal?.substring(0, 200) || '',
        PODTerminal: formValue.PODTerminal?.substring(0, 200) || '',
        CommodityDescription: formValue.CommodityDescription || '',
        MarksandNumber: formValue.MarksandNumber || '',
        Status: formValue.Status === 'Active' ? 'A' : 'S',
        
        // Your existing arrays
        masterJobConnection: this.connectionResult,
        costRevenueCharges: this.rateResult,
        // masterJobContainers: this.formatContainerData(),
        
        // Format dates
        MasterJobDate: this.formatDate(formValue.MasterJobDate),
        MBLDate: this.formatDate(formValue.MBLDate),
        DGBookingDate: this.formatDate(formValue.DGBookingDate),
        DGApprovedDate: this.formatDate(formValue.DGApprovedDate),
        ETA: this.formatDate(formValue.ETA),
        ETD: this.formatDate(formValue.ETD),
        ATA: this.formatDate(formValue.ATA),
        ATD: this.formatDate(formValue.ATD),
        DestinationATA: this.formatDate(formValue.DestinationATA),
        Haz: formValue.Haz ? 'Y' : 'N',
        updatedBy: this.appSettingsService.userSettingSource.value['userEmail'],
        createdBy: this.appSettingsService.userSettingSource.value['userEmail'],
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        MenuMasterSid: this.sidebarService.syncMenuIdBeforeSubmit("Master Air Waybill") || Number(sessionStorage.getItem('currentMenuId')),
        screenName : 'Master Air Waybill'
    };

    // Add shipment list if needed
    const allShipments = (this.attachedBookings.getRawValue() || [])
      .filter(ship => !ship.MasterJobSid)
      .map(shipment => {
        return {
          BookingHeaderSid: shipment.BookingHeaderSid,
          HouseJobSid: shipment.HouseJobSid || null,  
          HBLNo: shipment.HBLNo,
          MasterJobSid: shipment.MasterJobSid || null,
        }
    });
    formData['shipmentList'] = [...allShipments];

    // Debug to check the payload
    // console.log('Form Data to be saved:', formData);
    // console.log('Others data:', othersData);

    if (this.isEditMode && this.masterJobSid) {
        formData.MasterJobSid = this.masterJobSid;
        this.operationService.updateMasterJob(formData).subscribe({
            next: (response: any) => {
                this.isSaving = false;
                this.isLoading = false;
                this.spinner.hide();
                if (response.status) {
                    this.resetDirtyState();
                    this.masterJobForm.markAsUntouched();
                    this.containerFormGroup.markAsUntouched();
                    const masterJobSid =
                        response.data?.newMasterJob?.MasterJobSid ||
                        response.newMasterJob?.MasterJobSid ||
                        this.masterJobSid;
                    if (this.isAirDepartment && response.newMasterJob?.MBLNo) {
                        this.toastr.success(
                            `Master Air Waybill updated successfully. MAWB: ${response.newMasterJob.MBLNo}`
                        );
                    } else {
                        this.toastr.success('Master Air Waybill updated successfully');
                    }
                    if (masterJobSid) {
                        this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
                    }
                    resolve?.(true);
                } else {
                    this.handleMawbSaveError({ error: response }, 'update');
                    resolve?.(false);
                }
            },
            error: (error) => {
                this.isSaving = false;
                this.isLoading = false;
                this.spinner.hide();
                this.handleMawbSaveError(error, 'update');
                console.error('Error updating master Air Waybill:', error);
                resolve?.(false);
            }
        });
    } else {
    this.operationService.createMasterJob(formData).subscribe({
  next: (response: any) => {
    this.isSaving = false;
    this.isLoading = false;
    this.spinner.hide();

    if (response.status) {
      resolve?.(true);
      this.resetDirtyState();
      this.masterJobForm.markAsUntouched();
      this.containerFormGroup.markAsUntouched();

      const masterJobSid =
        response.data?.newMasterJob?.MasterJobSid ||
        response.newMasterJob?.MasterJobSid;

      if (this.isAirDepartment && response.data?.newMasterJob?.MBLNo) {

        let successMessage = 'Master Air Waybill created successfully';

        if (masterJobSid) {
          this.toastr.success(successMessage);
          this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
          return; // ✅ stop list navigation
        }
      }

      this.toastr.success('Master  Air Waybill created successfully');
      if (masterJobSid) {
        this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
      } else {
        this.router.navigate(['/operation/mawbill/list']);
      }

    } else {
      this.handleMawbSaveError({ error: response }, 'create');
      resolve?.(false);
    }
  },

            error: (error) => {
                this.isSaving = false;
                this.isLoading = false;
                this.spinner.hide();
                this.handleMawbSaveError(error, 'create');
                console.error('Error creating master Air Waybill:', error);
                resolve?.(false);
            }
        });
    }
  }


  onContainerSubmit(): void {
    if (this.isExportToImportCompleted) {
      this.appSettingsService.showWarning('Export To Import completed. Container data is read only.');
      return;
    }
    if (this.containerFormGroup.valid) {
      const containerData = this.containerFormGroup.value;
      
      if (this.isEditContainer && this.editingContainerIndex !== null) {
        // Update existing container - preserve the MasterJobContainerSid
        const containerGroup = this.masterJobContainers.at(this.editingContainerIndex);
        const existingContainerSid = containerGroup.value.MasterJobContainerSid;
        
        containerGroup.patchValue({
          ...containerData,
          MasterJobContainerSid: existingContainerSid, // Preserve the existing SID
          IsSoc: containerData.IsSoc
        }, { emitEvent: false });
      } else {
        // Add new container - MasterJobContainerSid will be null for new containers
        this.addContainer(containerData);
      }
      this.markAsDirty();
      
      this.currentContainerModal.close();
      
    } else {
      this.toastr.error('Please fill all required container fields');
      this.containerFormGroup.markAllAsTouched();
    }
  }
  
  // Helper methods
  // getContainerTypeName(ContainerTypeMasterSid: number): string {
  //   const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
  //   return containerType ? containerType.ContainerName : 'Unknown';
  // }

  // formatContainerData(): any[] {
  //   return this.masterJobContainers.value.map(container => ({
  //     ...container,
  //     IsSoc: container.IsSoc ? 'Y' : 'N',
  //     MasterJobContainerSid: container.MasterJobContainerSid
  //   }));
  // }

  formatDate(date: any): string | null {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0];
  }

  formatArrayDates(array: any[], dateFields: string[]): void {
    if (!array) return;
    
    array.forEach(item => {
      dateFields.forEach(field => {
        if (item[field]) {
          item[field] = this.formatDate(item[field]);
        }
      });
    });
  }

  onReset(): void {
    this.formSubmitted = false;
    this.isEditMode = false; 
    this.masterJobForm.reset({
      BLReleaseType: 'Original',
      NoofOriginal: 3,
      WeightIn: 'Kg(s)',
      Haz: false,
      FreightPPCC: 'Prepaid',
      ExportToImport: 'N'
    });
    this.selectedTransferCompanySid = null;
    this.selectedTransferBranchSid = null;
    this.filteredTransferBranches = [];
    this.isPullingToImportBranch = false;
    
    this.connections.clear();
    this.masterJobContainers.clear();
    this.costRevenueCharges.clear();
    this.containerActivities.clear();
    this.attachedBookings.clear();
    this.slicedAttachedBookings = [];
    this.totalLengthOfAttachedBookings = 0;
    this.page = 1;
    this.connectionResult = [];
    this.rateResult = [];
    this.masterjobConnectionArr = [];
    this.masterJobRateArr = [];
    this.edocData = [];
    this.emailData = [];
    this.containerActivityData = [];
    this.currentFormValue = null;
    this.currentRateFormValue = null;
    this.currentEdocFormValue = null;
    this.currentEmailFormValue = null;
    
    // Reset vessel search state
    this.voyageList = [];
    this.lastVesselSearchParams = null;
    this.resetDirtyState();
  }

  onHazChange(): void {
    const hazValue = this.masterJobForm.get('Haz')?.value;
    
    if (!hazValue) {
      this.masterJobForm.get('DGBookingDate')?.setValue(null);
      this.masterJobForm.get('DGApprovedDate')?.setValue(null);
    }
  }

  selectTab(tab: string): void {
    if (tab === 'Follow Up') {
    this.openFollowup();
  }
    this.selectedTab = tab;
  }

  selectTab1(tab1: string): void {
    this.selectedTab1 = tab1;
  }

  openContainerModal(content: any, container?: any, index?: number): void {
    this.isEditContainer = !!container;
    this.editingContainerIndex = index !== undefined ? index : null;
    
    if (this.isEditContainer && container) {
      // Patch the form with existing container data
      this.containerFormGroup.patchValue({
        ...container,
        IsSoc: container.IsSoc === 'Y' || container.IsSoc === true
      }, { emitEvent: false });
    } else {
      // Reset the form for new container
      this.containerFormGroup.reset({
        NoOfPkg: 0,
        GrossWeight: 0,
        NetWeight: 0,
        ChargeableWeight: 0,
        Volume: 0,
        IsSoc: false
      });
    }

    if (this.isExportToImportCompleted) {
      this.containerFormGroup.disable({ emitEvent: false });
    } else {
      this.containerFormGroup.enable({ emitEvent: false });
    }
    
    this.currentContainerModal = this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  removeContainer(index: number): void {
    if (this.isExportToImportCompleted) {
      this.appSettingsService.showWarning('Export To Import completed. Container data is read only.');
      return;
    }
    this.masterJobContainers.removeAt(index);
    this.markAsDirty();
  }

  syncFormValueWithConnectionComponent() {
   const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    const MasterJobNumber = this.masterJobForm.get('MasterJobNumber')?.value;
    const MBLNo = this.masterJobForm.get('MBLNo')?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const selectedPOO = this.masterJobForm.get('POO')?.value; // PortMasterSid
    const selectedPOL = this.masterJobForm.get('POL')?.value; // PortMasterSid
    const selectedPOD = this.masterJobForm.get('POD')?.value; // PortMasterSid
    const selectedFPD = this.masterJobForm.get('FPD')?.value; // PortMasterSid
    const EffectiveDate = this.masterJobForm.get('MasterJobDate')?.value;
    const ExpiredDate = this.masterJobForm.get('MasterJobDate')?.value;
    const PORSid = (this.portList.find(p => p.PortCode === selectedPOO)?.PortMasterSid)
    const POLSid = (this.portList.find(p => p.PortCode === selectedPOL)?.PortMasterSid)
    const PODSid = (this.portList.find(p => p.PortCode === selectedPOD)?.PortMasterSid)
    const FPODSid = (this.portList.find(p => p.PortCode === selectedFPD)?.PortMasterSid)
    const CargoType = this.f['CargoType']?.value;
    const NetWeight = this.f['NetWeight']?.value;
    const GrossWeight = this.f['GrossWeight']?.value;
    const NoofContainers = this.masterJobContainers.length;
    const Volume = this.f['Volume']?.value;
    const ChargeableWeight = this.f['ChargeableWeight']?.value;
    const MovementType = this.selectedDepartmentType;
    // const CustomerMasterSid = this.b['CustomerMasterSid']?.value;
    // const CustomerBranchSid = this.b['CustomerBranchSid']?.value;
    // const BookingHeaderSid = this.BookingHeaderSid || this.bookingData?.BookingHeaderSid || this.b['BookingHeaderSid']?.value;

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      MasterJobNumber,
      ParentSid : this.masterJobSid,
      Status: this.masterJobForm.get('Status')?.getRawValue(),
      status: this.masterJobForm.get('Status')?.getRawValue(),
      // CustomerMasterSid,
      // CustomerBranchSid,
      MBLNo,
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
      ChargeableWeight,
      countryOfCompany : this.countryOfCompany
    }
  }

  // Add connection change handler
  handleConnectionChange(allConnections: any[]) {
    // console.log('Connections changed:', allConnections);
    if (allConnections && allConnections.length >= 0) {
      this.connectionResult = [...allConnections];
      this.refreshUnsavedChanges('handleConnectionChange');
    }
  }

  syncFormValueWithRateComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const MasterJobNumber = this.masterJobForm.get('MasterJobNumber')?.value;
    const MBLNo = this.masterJobForm.get('MBLNo')?.value;
    const PORSid = this.masterJobForm.get('POO')?.value; // PortMasterSid
    const POLSid = this.masterJobForm.get('POL')?.value; // PortMasterSid
    const PODSid = this.masterJobForm.get('POD')?.value; // PortMasterSid
    const FPODSid = this.masterJobForm.get('FPD')?.value; // PortMasterSid
    const EffectiveDate = this.masterJobForm.get('MasterJobDate')?.value;
    const ExpiredDate = this.masterJobForm.get('MasterJobDate')?.value;
    const CargoType = this.f['CargoType']?.value;
    const NetWeight = this.f['NetWeight']?.value;
    const GrossWeight = this.f['GrossWeight']?.value;
    const NoofContainers = this.masterJobContainers.length;
    const Volume = this.f['Volume']?.value;
    const ChargeableWeight = this.f['ChargeableWeight']?.value;

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      MasterJobNumber,
      ParentSid: this.masterJobSid,
      Status: this.masterJobForm.get('Status')?.getRawValue(),
      status: this.masterJobForm.get('Status')?.getRawValue(),
      MBLNo,
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
      ChargeableWeight,
      countryOfCompany: this.countryOfCompany
    }
  }
  
 handleRateChange(allRates: any[]) {
  if (allRates) {
    this.rateResult = [...allRates];
    this.refreshUnsavedChanges('handleRateChange');
  }
}
  

  

  // Add sync method for Edoc
syncFormValueWithEdocComponent() {
  // console.log('🔍 === syncFormValueWithEdocComponent START ===');
  
  // Log all relevant properties
  // console.log('📋 Current Component State:');
  // console.log('  - masterJobSid:', this.masterJobSid);
  // console.log('  - MenuMasterSid:', this.MenuMasterSid);
  // console.log('  - currentCompany:', this.currentCompany);
  // console.log('  - currentBranch:', this.currentBranch);
  // console.log('  - isEditMode:', this.isEditMode);
  
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
  const MasterJobNumber = this.masterJobForm.get('MasterJobNumber')?.value;
  
  // console.log('📊 Form Values:');
  // console.log('  - CompanyMasterSid:', CompanyMasterSid);
  // console.log('  - DepartmentMasterSid:', DepartmentMasterSid);
  // console.log('  - MasterJobNumber:', MasterJobNumber);
  
  this.currentEdocFormValue = {
    CompanyMasterSid,
    DepartmentMasterSid,
    DocumentSid: this.masterJobSid || 0,
    MasterJobNumber: MasterJobNumber,
  };

  // console.log('📄 currentEdocFormValue:', this.currentEdocFormValue);

  const data: any = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    MenuMasterSid: this.MenuMasterSid,
    DocumentSid: this.masterJobSid,
  };

  // console.log('🚀 Data being set to commonService:');
  // console.log('  - CompanyMasterSid:', data.CompanyMasterSid);
  // console.log('  - BranchMasterSid:', data.BranchMasterSid);
  // console.log('  - MenuMasterSid:', data.MenuMasterSid);
  // console.log('  - DocumentSid:', data.DocumentSid);
  
  // Check if any values are null/undefined
  const missingFields = [];
  if (!data.CompanyMasterSid) missingFields.push('CompanyMasterSid');
  if (!data.BranchMasterSid) missingFields.push('BranchMasterSid');
  if (!data.MenuMasterSid) missingFields.push('MenuMasterSid');
  if (!data.DocumentSid && data.DocumentSid !== 0) missingFields.push('DocumentSid');
  
  if (missingFields.length > 0) {
    console.warn('⚠️  Missing fields:', missingFields);
  } else {
    // console.log('✅ All fields are present');
  }

  // console.log('📤 Setting data to commonService.documentData...');
  this.commonService.documentData.set(data);
  
  // Verify the data was set
  const currentData = this.commonService.documentData();
  // console.log('✅ Data in commonService after set:', currentData);
  
  // console.log('🔍 === syncFormValueWithEdocComponent END ===');
}

// Add handler for Edoc data changes
handleEdocChange(event: any) {
  // console.log('📨 === handleEdocChange START ===');
  // console.log('Event received:', event);
  
  this.edocData = event.dataItems || [];   
  this.currentEdocFormValue = event.formData; 
  
  // console.log('📊 Updated edocData:', this.edocData);
  // console.log('📊 Updated currentEdocFormValue:', this.currentEdocFormValue);
  // console.log('📨 === handleEdocChange END ===');
}

  // Add sync method for Email component
  // syncFormValueWithEmailComponent() {
  //   const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    
  //   this.currentEmailFormValue = {
  //     CompanyMasterSid,
  //     DepartmentMasterSid,
  //     DocumentSid: this.masterJobSid || 0,
  //     MasterJobNumber: this.masterJobForm.get('MasterJobNumber')?.value,
  //     POL: this.masterJobForm.get('POL')?.value,
  //     POD: this.masterJobForm.get('POD')?.value,
  //     VesselName: this.masterJobForm.get('VesselName')?.value,
  //     VoyageNo: this.masterJobForm.get('VoyageNo')?.value
  //   };
  // }

  // // Add handler for Email data changes
  // handleEmailChange(event: any) {
  //   this.emailData = event.dataItems || [];
  //   this.currentEmailFormValue = event.formData || null;
  //   console.log("Email data updated:", this.emailData);
  // }

  // syncFormValueWithContainerActivityComponent() {
  //   const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    
  //   this.currentContainerActivityFormValue = {
  //     CompanyMasterSid,
  //     DepartmentMasterSid,
  //     JobMasterSid: this.masterJobSid || 0, // Use JobMasterSid to match Prisma model
  //     MasterJobNumber: this.masterJobForm.get('MasterJobNumber')?.value,
  //     // Pass the container list so the container activity component can use it
  //     masterJobContainers: this.masterJobContainers.value || []
  //   };
  // }

  // // Add this handler for container activity data changes
  // handleContainerActivityChange(activities: any[]) {
  //   console.log('Container Activities received from component:', activities);
    
  //   // Ensure we have an array and properly store it
  //   this.containerActivityData = Array.isArray(activities) ? [...activities] : [];
    
  //   // Update the form array as well to keep it in sync
  //   const containerActivitiesFormArray = this.containerActivities;
  //   containerActivitiesFormArray.clear();
    
  //   this.containerActivityData.forEach(activity => {
  //     const activityGroup = this.fb.group({
  //       ContainerActivitySid: [activity.ContainerActivitySid || null],
  //       ContainerNumber: [activity.ContainerNumber || '', Validators.required],
  //       ContainerType: [activity.ContainerType || null],
  //       ActivityCode: [activity.ActivityCode || '', Validators.required],
  //       ActivityName: [activity.ActivityName || ''],
  //       ActivityDate: [activity.ActivityDate ? new Date(activity.ActivityDate) : new Date(), Validators.required],
  //       ActivityFrom: [activity.ActivityFrom || ''],
  //       ActivityTo: [activity.ActivityTo || ''],
  //       Remarks: [activity.Remarks || '']
  //     });
  //     containerActivitiesFormArray.push(activityGroup);
  //   });
    
  //   console.log('Updated containerActivityData:', this.containerActivityData);
  //   console.log('Updated form array length:', containerActivitiesFormArray.length);
  // }

  // Add this method to your component
  // AuditLogs(modal: TemplateRef<any>) {
  //   if (!this.masterJobSid) return;

  //   this.operationService.getAuditLogsmasterjob('MasterJob', this.masterJobSid.toString()).subscribe({
  //     next: (logs: any[]) => {
  //       const formatFields = (val: any) => {
  //         if (!val) return ['NA'];
  //         const obj = typeof val === 'string' ? JSON.parse(val) : val;
  //         if (obj && obj.updatedOn) delete obj.updatedOn; // Remove updatedOn field if it exists
  //         if (!obj || Object.keys(obj).length === 0) return ['NA'];
  //         return Object.entries(obj).map(
  //           ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
  //         );
  //       };

  //       this.auditLogs = logs.map(log => ({
  //         ...log,
  //         oldValDisplay: formatFields(log.oldVal),
  //         newValDisplay: formatFields(log.newVal)
  //       }));

  //       this.auditLogModalRef = this.modalService.open(modal, { 
  //         centered: true, 
  //         scrollable: true, 
  //         windowClass: 'audit-log-modal',
  //         size: 'xl'
  //       });
  //     },
  //     error: err => {
  //       console.error('Error fetching audit logs:', err);
  //       this.toastr.error('Failed to fetch audit logs');
  //     }
  //   });
  // }

  openAuditLogs() {
      if (!this.masterJobSid) return;
      const modalRef = this.modalService.open(AuditLogComponent,{
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'MasterAirwayBill Logs';
      modalRef.componentInstance.tableName = 'MasterJob';
      modalRef.componentInstance.recordId = this.masterJobSid.toString();
      modalRef.componentInstance.screenName = 'MasterAirwayBill';
    }

  openTandC() {
      this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
      const departmentSid = this.masterJobData?.DepartmentMasterSid;
      const pol = this.masterJobData?.POL;
      const pod = this.masterJobData?.POD;
      const carrier = this.masterJobData?.voyages?.[0]?.CarrierSid || null;
      const payload = { 
        MenuMasterSid: this.currentMenuId,
        DepartmentMasterSid: departmentSid,
        POL: pol,
        POD: pod,
        Carrier: carrier,
        DocumentSid: this.masterJobData?.MasterJobSid
       };
       const openModal = (terms: any[]) => {
        const modelRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
          });
          modelRef.componentInstance.terms = terms || [];
          modelRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modelRef.componentInstance.DocumentSid = this.masterJobData?.MasterJobSid;
          modelRef.componentInstance.DepartmentMasterSid = departmentSid;
          modelRef.componentInstance.POL = pol;
          modelRef.componentInstance.POD = pod;
          modelRef.componentInstance.Carrier = carrier;
          modelRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
       };
       if (!this.isTermsAndConditionsEnabled) {
      this.TandCList = [];
      openModal(this.TandCList);
      return;
    }
      this.masterService.getTandCByCondition(payload).subscribe((resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          openModal(this.TandCList);
        } else {
          this.appSettingsService.showError('Error loading Terms and Conditions');
        }
      }, (error) => {
        this.appSettingsService.showError('Error loading Terms and Conditions', error);
      });
    }

  // exportAuditLogs() {
  //   if (this.auditLogs.length === 0) {
  //     this.toastr.warning('No audit logs to export');
  //     return;
  //   }
    
  //   // Simple CSV export implementation
  //   const headers = ['Changed At', 'Changed By', 'Operation', 'Old Value', 'New Value'];
  //   const csvData = this.auditLogs.map(log => [
  //     new Date(log.changedAt).toLocaleString(),
  //     log.changedBy || '-',
  //     log.operation,
  //     JSON.stringify(log.oldVal || {}),
  //     JSON.stringify(log.newVal || {})
  //   ]);
    
  //   const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
  //   const blob = new Blob([csvContent], { type: 'text/csv' });
  //   const url = window.URL.createObjectURL(blob);
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = `audit-logs-masterjob-${this.masterJobForm.get('MasterJobNumber')?.value}.csv`;
  //   link.click();
  //   window.URL.revokeObjectURL(url);
  // }

  navigateToBooking(): void {
    this.router.navigate(['operation/booking/entry']);
  }

  navigateBack(): void {
    this.router.navigate(['/operation/mawbill/list']);
  }
   navigateToMasterJob() {
    this.router.navigate(['operation/mawbill/entry']);
  }

   toggleMinimizeMaximize(){
      toggleFullScreen();
    }
  
  

  addContainerActivity(activity?: any): void {
    if (activity) {
      this.containerActivityData.push(activity);
      this.containerActivityResetTrigger = !this.containerActivityResetTrigger;
      this.cdr.detectChanges();
    }
  }

  // Get form controls for easy access in template
  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.masterJobForm.controls || {};
  }

  onETDDateSelect(): void {
    if (this.selectedDepartmentType !== 'AIR') {
      return;
    }

    const etaControl = this.masterJobForm.get('ETA');
    if (etaControl?.value) {
      etaControl.setValue(null);
    }
  }

  toNgbDateStruct(date: Date | string | null): NgbDateStruct | null {
    return toNgbDateStruct(date);
  }

  // Shipment Related Works
  
  createShipmentGroup(data?: any): FormGroup {
    const shipmentForm = this.fb.group({
      HouseJobSid : [data?.HouseJobSid || null],
      BookingHeaderSid : [data?.BookingHeaderSid || ''],
      BookingNo : [data?.BookingNo || '', Validators.required],
      BookingDateTime : [data?.BookingDateTime ? new Date(data?.BookingDateTime) : null],
      DepartmentMasterSid : [data?.DepartmentMasterSid || null],
      HBLNo : [data?.HBLNo || null],
      CustomerMasterSid : [data?.CustomerMasterSid || null],
      CustomerName : [data?.CustomerName || ''],
      CustomerAddress : [data?.CustomerAddress || ''],
      ShipperName : [data?.ShipperName || ''],
      ShipperAddress : [data?.ShipperAddress || ''],
      ConsigneeName : [data?.ConsigneeName || ''],
      ConsigneeAddress : [data?.ConsigneeAddress || ''],
      DestinationAgent : [data?.DestinationAgent || ''],
      MBLDate : [data?.MBLDate || null],
      MasterJobSid : [data?.MasterJobSid || null],
      POL : [data?.POL || null],
      POD : [data?.POD || null],
      VesselName : [data?.VesselName || ''],
      VoyageNo : [data?.VoyageNo || ''],
      ETD : [data?.ETD || null],
      ETA : [data?.ETA || null],
      FreightTerms : [data?.FreightTerms || ''],
      JobType: [data?.JobType || '']
    })
    return shipmentForm;
  }

  updateAttachedBookingsPagination(){
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.slicedAttachedBookings = this.attachedBookings.getRawValue().slice(start, end);
  }

  getDepartmentName(DepartmentMasterSid : number){
    if(!DepartmentMasterSid || this.departments.length === 0) return '';
    const department = this.departments.find(dep => dep.DepartmentMasterSid === DepartmentMasterSid);
    return department ? department.departmentName : '';
  }

  getAgentName(AgentSid : number){
    if(!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(agent => agent.CustomerMasterSid === AgentSid);
    return agent ? agent.CustomerName : '';
  }

  patchShipments(shipments: any[]) {
    this.attachedBookings.clear();
    shipments.forEach(shipment => {
      const formGrp = this.createShipmentGroup(shipment)
      console.log(formGrp);
      this.attachedBookings.push(formGrp);
    });
    this.totalLengthOfAttachedBookings = this.attachedBookings.length;
    this.updateAttachedBookingsPagination();
    this.refreshUnsavedChanges('patchShipments');
  }

  detachBooking(shipmentIndex: number, booking: any) {
    if (this.isExportToImportCompleted) {
      this.appSettingsService.showWarning('Export To Import completed. House cargo data is read only.');
      return;
    }
    const realIndex = ((this.page - 1) * this.pageSize) + shipmentIndex;
    console.log(booking);
    const HouseJobSid = booking.HouseJobSid;
    const userEmail = this.appSettingsService.userSettingSource.value['userEmail'];
    console.log(HouseJobSid);
    if (HouseJobSid) {
      this.operationService.detachBooking(HouseJobSid,userEmail).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingsService.showSuccess('Booking detached successfully');
            this.attachedBookings.removeAt(realIndex);
            this.totalLengthOfAttachedBookings = this.attachedBookings.length;
            this.updateAttachedBookingsPagination();
            this.refreshUnsavedChanges('detachBooking');
          } else {
            this.appSettingsService.showError('Failed to detach booking');
          }
        },
        error: (error) => {
          this.toastr.error('Failed to detach booking');
          console.error('Error detaching booking:', error);
        }
      });
    } else {
      this.appSettingsService.showSuccess('Booking detached successfully');
      this.attachedBookings.removeAt(realIndex);
      this.totalLengthOfAttachedBookings = this.attachedBookings.length;
      this.updateAttachedBookingsPagination();
      this.refreshUnsavedChanges('detachBooking');
    }
  }

  navigateToHouseJobCreation(): void {
  if (!this.masterJobSid) {
    this.toastr.error('Please save the master airway first before creating house airway');
    return;
  }

  // Get the current master job data
  const masterJobData = {
    MasterJobSid: this.masterJobSid,
    DepartmentMasterSid: this.masterJobForm.get('DepartmentMasterSid')?.value,
    MBLNo: this.masterJobForm.get('MBLNo')?.value,
    MBLDate: this.masterJobForm.get('MBLDate')?.value,
    VesselName: this.masterJobForm.get('VesselName')?.value,
    VoyageNo: this.masterJobForm.get('VoyageNo')?.value,
    POO : this.masterJobForm.get('POO')?.value,
    POL: this.masterJobForm.get('POL')?.value,
    POD: this.masterJobForm.get('POD')?.value,
    FPD: this.masterJobForm.get('FPD')?.value,
    ETA: this.masterJobForm.get('ETA')?.value,
    ETD: this.masterJobForm.get('ETD')?.value,
    CarrierName: this.masterJobForm.get('CarrierName')?.value,
    // Get port codes instead of SIDs
    POOCode : this.getPortCode(this.masterJobForm.get('POO')?.value),
    POLCode: this.getPortCode(this.masterJobForm.get('POL')?.value),
    PODCode: this.getPortCode(this.masterJobForm.get('POD')?.value),
    FPDCode: this.getPortCode(this.masterJobForm.get('FPD')?.value),
  };

  // Navigate to house job entry with master job data as query parameters
    this.router.navigate(['/operation/hawb-bill/entry'], {
      queryParams: {
        fromMasterAirWaybill: 'true',
        MasterJobSid: masterJobData.MasterJobSid
      },
      state: { masterJobData: structuredClone(masterJobData) }
    });
}

  openAttachModal(){
    const requiredFields = ['DepartmentMasterSid','POL','POD'];
    if(!this.hasEveryRequiredFieldsFilled(requiredFields , this.masterJobForm)){
      requiredFields.forEach(field => {
        this.masterJobForm.get(field)?.markAsTouched();
        this.masterJobForm.get(field)?.updateValueAndValidity();
      });
      this.appSettingsService.showWarning('Please fill all required fields correctly');
      return;
    }

    const exceptionalBookings = this.attachedBookings.getRawValue()
      .filter(booking => booking.HouseJobSid === null)
      .map(bk => bk.BookingHeaderSid);

    const modalRef = this.modalService.open(LoadingPlanEntryComponent,{
      size : 'xl',
      backdrop: 'static',
      centered: true,
      windowClass: 'custom-modal-size'
    });
    modalRef.componentInstance.screenName = 'Master Air Waybill';
    const value = this.masterJobForm.value;
    modalRef.componentInstance.masterJobFormValue = {
      DepartmentMasterSid : value.DepartmentMasterSid,
      POL : this.getPortCode(value.POL),
      POD : this.getPortCode(value.POD),
      hasValue : true
    }
    modalRef.componentInstance.exceptionalBookings = exceptionalBookings;
    modalRef.componentInstance.closeModal.subscribe((data:boolean) => {
      if(data){
        this.modalService.dismissAll();
      }
    });
    modalRef.componentInstance.onSubmit.subscribe((data:any[]) => {
      data.forEach(booking => {
        const formGroup = this.createShipmentGroup(booking);
        this.attachedBookings.push(formGroup);
      });
      this.totalLengthOfAttachedBookings = this.attachedBookings.length;
      this.updateAttachedBookingsPagination();
      this.refreshUnsavedChanges('openAttachModal');
      this.modalService.dismissAll();
      this.onSubmit();
    });
  }

  hasEveryRequiredFieldsFilled(requiredFields:string[],group: FormGroup): boolean {
    const formValue = group.value;
    return requiredFields.every(field => formValue[field] !== null && formValue[field] !== undefined && group.get(field)?.valid);
  }

  getPortCode(portSid:number){
    if(!portSid || this.portList.length === 0) return '';
    const port = this.portList.find(p => p.PortMasterSid === portSid);
    return port ? port.PortCode : '';
  }

  getMBLDate(){
    const date = this.masterJobForm.get('MBLDate')?.value;
    return date ? this.datepipe.transform(date) : 'N/A'
  }
  onColoadChange(): void {
  const coloadValue = this.masterJobForm.get('Coload')?.value;
  
  // Show/hide CoLoader field based on Coload value
  if (coloadValue) {
    this.masterJobForm.get('CoLoader')?.enable();
  } else {
    this.masterJobForm.get('CoLoader')?.setValue('');
    this.masterJobForm.get('CoLoader')?.disable();
  }
}
onCFSChange(selectedCFS: any): void {
  if (!selectedCFS) {
    this.masterJobForm.get('CFSAddress')?.setValue('');
    return;
  }
  
  // Auto-set the CFSAddress from the selected CFS's CustomerAddress1
  this.masterJobForm.get('CFSAddress')?.setValue(
    selectedCFS.CustomerAddress1 || ''
  );
}
onYardChange(selectedYard: any): void {
  if (!selectedYard) {
    this.masterJobForm.get('YardAddress')?.setValue('');
    return;
  }
  
  // Auto-set the YardAddress from the selected Yard's CustomerAddress1
  this.masterJobForm.get('YardAddress')?.setValue(
    selectedYard.CustomerAddress1 || ''
  );
}

  navigateToHouse(shipment) {
    console.log(shipment ,'shipment');
    this.router.navigate(['/operation/hawb-bill/entry',shipment.HouseJobSid]);
  }

  showInfo() {
        if(!this.masterAirWayData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.masterAirWayData;
        modalRef.componentInstance.idLabel = 'Master AirWay Id';
        modalRef.componentInstance.idValue = this.masterAirWayData?.MasterJobSid;
      }
  // print

   reportMAWBModel(type: 'MAWB' | 'MAWBDraft') {
    this.selectedReport = type;
        const modalRef=this.modalService.open(MAWBComponent,{
          size: 'xl',
          scrollable: true,
        })
        console.log("Master Air way data",this.masterAirWayData);
        modalRef.componentInstance.masterAirWayData=this.masterAirWayData || []; 
        modalRef.componentInstance.containerTypeList=this.containerTypeList;
        modalRef.componentInstance.packageTypeList=this.packageTypeList;
        modalRef.componentInstance.agentList=this.agentList;
        modalRef.componentInstance.currencyList=this.currencyList;
        modalRef.componentInstance.portList=this.portList;
        modalRef.componentInstance.chargeList=this.chargeList;
        modalRef.componentInstance.selectedReport = type;
      }

      getFormattedPort(code:string){
    console.log(code);
    if(!code) return '';
    const ourPort = (this.portList.find(p => p.PortCode === code))?.PortName;
    console.log(ourPort);
    return `${ourPort} (${code})`
  }

    openFollowup() {
    if (!this.masterAirWayData) return;
    const POL = this.masterAirWayData?.POL;
    const POD = this.masterAirWayData?.POD;
    const FPD = this.masterAirWayData?.FPD;
    const formattedPOL = this.getFormattedPort(POL);
    const formattedPOD = this.getFormattedPort(POD);
    const formattedFPD = this.getFormattedPort(FPD);
    this.documentSid = this.masterAirWayData?.MasterJobSid;
    this.parentSubject = `__SUBJECT__ for Master Job No."${this.masterAirWayData.MasterJobNumber}"`;
    this.parentMailbody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Kindly do the needful for "__SUBJECT__" Master Job No."${this.masterAirWayData.MasterJobNumber}" Dated:${new Date(this.masterAirWayData.MasterJobDate).toLocaleDateString()} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''}</p>
        <p>Best Regards,</p>
        <p>${this.userData['userName']}</p>
      </div>
    `;
  }

  loadMasterJobARAPData() {
    if (!this.masterJobSid) {
      this.arapData = [];
      return;
    }

    this.arapLoading = true;
    this.operationService.getMasterJobARAPData(this.masterJobSid).subscribe({
      next: (response: any) => {
        let dataArray = [];

        // Handle different response formats
        if (Array.isArray(response)) {
          dataArray = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (response && Array.isArray(response)) {
          dataArray = response;
        } else if (response && response.status && response.data) {
          dataArray = Array.isArray(response.data) ? response.data : [];
        }

        this.arapData = dataArray.map(item => ({
          ...item,
          voucherType: this.getVoucherType(item.DocumentTypeCode),
          status: this.getPaymentStatus(item),
          amountFormatted: this.formatCurrency(item.Amount, item.CurrencyCode),
          localAmountFormatted: this.formatCurrency(item.LocalAmount, 'USD')
        }));

        this.arapLoading = false;
      },
      error: (error) => {
        console.error('Error loading AR/AP data:', error);
        this.arapData = [];
        this.arapLoading = false;
        this.appSettingsService.showError('Failed to load AR/AP data');
      }
    });
  }

  private getVoucherType(documentTypeCode: string): string {
    const typeMap: { [key: string]: string } = {
      'INV': 'Invoice',
      'PAY': 'Payment',
      'CRN': 'Credit Note',
      'DRN': 'Debit Note',
      'REC': 'Receipt',
    };
    return typeMap[documentTypeCode] || documentTypeCode;
  }

  private getPaymentStatus(voucher: any): string {
    // You might need to fetch actual payment status from your payment tables
    // This is a simplified version
    if (voucher.Amount === voucher.LocalAmount) {
      return 'Paid';
    } else if (voucher.LocalAmount > 0 && voucher.LocalAmount < voucher.Amount) {
      return 'Partial';
    }
    return 'Unpaid';
  }

  private formatCurrency(amount: number, currencyCode: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount || 0);
    } catch (error) {
      return `${currencyCode || ''} ${(amount || 0).toFixed(2)}`;
    }
  }

  getTotalAmount(): string {
    const total = this.arapData.reduce((sum, item) => sum + (item.Amount || 0), 0);
    if (this.arapData.length > 0) {
      const currency = this.arapData[0].CurrencyCode;
      return this.formatCurrency(total, currency);
    }
    return '0.00';
  }

  getTotalLocalAmount(): string {
    const total = this.arapData.reduce((sum, item) => sum + (item.LocalAmount || 0), 0);
    return this.formatCurrency(total, 'USD');
  }

  getCountByStatus(status: string): number {
    return this.arapData.filter(item => item.status === status).length;
  }

  openVoucherDetails(voucherHeaderSid: number) {
    // Navigate to voucher details page
    this.router.navigate(['operation/invoice/entry/', voucherHeaderSid]);
  }

  exportARAPReport() {
    const dataForExport = this.arapData.map(item => ({
      'Voucher No': item.VoucherNumber,
      'Date': this.datePipe.transform(item.VoucherDate),
      'Type': item.voucherType,
      'Currency': item.CurrencyCode,
      'Amount': item.Amount,
      'Local Amount': item.LocalAmount,
      'HBL No': item.HBLNo || '',
      'Status': item.status
    }));

    this.exportExcelService.exportAsExcel({
      data: dataForExport,
      headers: [
        { key: 'Voucher No', label: 'Voucher No' },
        { key: 'Date', label: 'Date' },
        { key: 'Type', label: 'Type' },
        { key: 'Currency', label: 'Currency' },
        { key: 'Amount', label: 'Amount' },
        { key: 'Local Amount', label: 'Local Amount' },
        { key: 'HBL No', label: 'HBL No' },
        { key: 'Status', label: 'Status' }
      ],
      fileName: `ARAP-Report-MasterJob-${this.masterAirWayData?.MasterJobNumber || 'Unknown'}`,
      title: 'AR/AP Report'
    });
  }

  printARAPReport() {
    const printSection = document.getElementById('arap-print-section');
    if (!printSection) {
      this.appSettingsService.showWarning('AR/AP table not found for printing');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      this.appSettingsService.showWarning('Unable to open print window. Please allow popups.');
      return;
    }

    const reportTitle = `AR/AP Report - ${this.masterAirWayData?.MasterJobNumber || ''}`;
    const printDate = this.datePipe.transform(new Date(), 'dd-MM-yyyy HH:mm') || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 16px; color: #1f2937; }
            .print-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .print-title { font-size: 18px; font-weight: 700; margin: 0; }
            .print-meta { font-size: 12px; color: #6b7280; }
            .modern-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .modern-table th, .modern-table td { border: 1px solid #d1d5db; padding: 8px; }
            .modern-table th { background: #f3f4f6; text-align: left; }
            .modern-table .text-end { text-align: right; }
            .modern-table tfoot td { font-weight: 700; background: #f9fafb; }
            .voucher-link { color: #111827; text-decoration: none; pointer-events: none; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; color: #111827; background: #e5e7eb; }
            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; }
            .status-unpaid { background: #fee2e2; color: #991b1b; }
            .status-partial { background: #fef3c7; color: #92400e; }
            .status-paid { background: #dcfce7; color: #166534; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1 class="print-title">${reportTitle}</h1>
            <div class="print-meta">Printed: ${printDate}</div>
          </div>
          ${printSection.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

    // Print
 
    reportcargomanifest() {
      const modalRef = this.modalService.open(CargoManifestComponent, {
        // size: 'xl',
        windowClass:"print-landscape",
        scrollable: true,
      });
      modalRef.componentInstance.masterJobData = this.masterJobData;
      modalRef.componentInstance.containerTypeList = this.containerTypeList;
      modalRef.componentInstance.masterJobContainers = this.masterJobData.containers || [];
      modalRef.componentInstance.packageTypeList = this.packageTypeList;
      modalRef.componentInstance.agentList = this.agentList;
      modalRef.componentInstance.yardList = this.yardList;
 
    }
 
      reportPreAlertModel() {
        const modalRef = this.modalService.open(PreAlertComponent, {
          // size: 'xl',
          windowClass:"print-landscape",
          scrollable: true,
        })
        modalRef.componentInstance.masterJobData = this.masterJobData;
        modalRef.componentInstance.containerTypeList = this.containerTypeList;
        modalRef.componentInstance.masterJobContainers = this.masterJobData.containers || [];
        modalRef.componentInstance.packageTypeList = this.packageTypeList;
        modalRef.componentInstance.agentList = this.agentList;
        modalRef.componentInstance.yardList = this.yardList;
      }

        reportMAWBpreprintedModel() {
          const modalRef = this.modalService.open(MawbPreprintComponent, {
            size: 'xl',
            scrollable: true,
          })
          console.log("Master Air way data", this.masterAirWayData);
          modalRef.componentInstance.masterAirWayData = this.masterAirWayData || [];
          modalRef.componentInstance.containerTypeList = this.containerTypeList;
          modalRef.componentInstance.packageTypeList = this.packageTypeList;
          modalRef.componentInstance.agentList = this.agentList;
          modalRef.componentInstance.currencyList = this.currencyList;
          modalRef.componentInstance.chargeList = this.chargeList;
        }

          reportjobCard() {
            const modalRef = this.modalService.open(JobCardComponent, {
              size: 'xl',
              scrollable: true,
            });
            modalRef.componentInstance.masterJobData = this.masterJobData;
            modalRef.componentInstance.containerTypeList = this.containerTypeList;
            modalRef.componentInstance.masterJobContainers = this.masterJobData.containers || [];
            modalRef.componentInstance.packageTypeList = this.packageTypeList;
            modalRef.componentInstance.agentList = this.agentList;
            modalRef.componentInstance.currencyList = this.currencyList;
            modalRef.componentInstance.chargeList = this.chargeList;
            modalRef.componentInstance.profitSummary = this.profitSummary || [];
            modalRef.componentInstance.customerWiseSummary = this.customerWiseSummary || [];
            modalRef.componentInstance.chargeWiseSummary = this.chargeWiseSummary || [];
            modalRef.componentInstance.uomList = this.costEntryComponent.uomList;
            modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL;
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


    this.customerWiseSummary = {
      cost: Array.from(costHmap.values()),
      revenue: Array.from(revenueHmap.values())
    };
  }

    calculateChargeWiseProfit() {
    this.profitSummary = [];
    const rateFormValue = this.rateResult || [];
    const data = [...rateFormValue];

    data.forEach(item => {

      const costAmt = parseFloat(item.CostLocalAmount);
      const revenueAmt = parseFloat(item.RevenueLocalAmount);
      const chargeName = item.chargeMaster?.chargeName || '';

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
      
}





interface CustomerProfit {
  CustomerName: string,
  Amount: number
}
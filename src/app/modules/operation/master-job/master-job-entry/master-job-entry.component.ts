import { Component, ViewChild, TemplateRef, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation, HostListener } from '@angular/core';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
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
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, FormArray, ValidatorFn, ValidationErrors } from '@angular/forms';
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
import { ReportService } from 'src/app/shared/services/report.service';
import { PreAlertComponent } from '../reports/pre-alert/pre-alert.component';
import { ReleaseLetterComponent } from '../reports/release-letter/release-letter.component';
import { ReleaseOrderComponent } from '../reports/release-order/release-order.component';
import { PackingListComponent } from '../reports/packing-list/packing-list.component';
import { CargoManifestComponent } from '../reports/cargo-manifest/cargo-manifest.component';
import { JobCardComponent } from '../reports/job-card/job-card.component';
import { SailingConfirmationComponent } from '../reports/sailing-confirmation/sailing-confirmation.component';
import { MblComponent } from '../reports/mbl/mbl.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { CustomsComponent } from '../../house-job/customs/customs.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { getDefaultTodayDate,toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { extractBackendErrorMessage } from 'src/app/common/error-handling/payload-validation-handler';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { PrintAuthorizationService } from 'src/app/core/services/print-authorization.service';
import { CfsOutturnComponent } from '../reports/cfs-outturn/cfs-outturn.component';
import { AllHBLDraftComponent } from '../reports/all-hbl-draft/all-hbl-draft.component';
import { AllHBLComponent } from '../reports/all-hbl/all-hbl.component';
import { LoadingPlanMasterComponent } from '../reports/loading-plan-master/loading-plan-master.component';
import { VerticalSidebarService } from 'src/app/shared/vertical-sidebar/vertical-sidebar.service';
import { ProofOfDeliveryComponent } from '../../house-job/report/proof-of-delivery/proof-of-delivery.component';
import { ProofOfDeliveryMasterPrintComponent } from '../reports/proof-of-delivery-master-print/proof-of-delivery-master-print.component';
import { InsertMilestoneByMasterJobPayload } from '../../services/shipment-milestone.service';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { DocReferenceComponent } from '../../doc-reference/doc-reference.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
@Component({
  selector: 'app-master-job-entry',
  standalone: true,
  imports: [
    DatePipe,
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
    DecimalPrecisionDirective,
    CustomsComponent,
    FormStateGuardDirective,
    ElementStateGuardDirective
  ],
  templateUrl: './master-job-entry.component.html',
  styleUrls: ['./master-job-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    NgbActiveModal,
    CustomDatePipe,
    DatePipe
  ],
})
export class MasterJobEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {

  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;
  private destroy$ = new Subject<void>();
  private vesselSearchSubject = new Subject<{ POL: string | number, POD: string | number, MovementType: string }>();
  private isLoadingVessels = false;
  private lastVesselSearchParams: { POL: string | number, POD: string | number, MovementType: string } | null = null;

  public ratecomponent = CostEntryComponent;
  public revenuecomponent = RevenueEntryComponent;
  public connectionComponent = ConnectionComponent;
  public containerComponent = ContainerActivityComponent;
  public ARAPcompoent = ArApComponent;
  public followUpComponent = FollowUpComponent;
  public edocComponent = EdocComponent;
  public emailComponent = EmailEntryComponent;
  public containeractivity = ContainerActivityComponent;
  private invoiceStatusCache = new Map<string, string>();
  masterJobForm: FormGroup;
  isEditMode = false;
  masterJobSid: number | null = null;
  isLoading = false;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  filterOption: any;
  documentSid: number | null = null;
  parentSubject = '';
  parentMailbody = '';
  isEditContainer = false;
  editingContainerIndex: number | null = null;
  containerFormGroup!: FormGroup;
  currentContainerModal: any;
  isDeletingContainer: number | null = null;
  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };
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
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  vesselVoyageLookupConfig = DROPDOWN_CONFIGS.VESSEL_VOYAGE;
  containerTypeLookupConfig = DROPDOWN_CONFIGS.CONTAINER_TYPE;
  profitSummary: any;
  customerWiseSummary: any;
  chargeWiseSummary: any[] = []


  // Lookup data
  departments: any[] = [];
  portList: any[] = [];
  vesselList: any[] = [];
  voyageList: any[] = [];
  containerTypeList: any[] = [];
  currencyList: any[] = [];
  // Staged house-level data from a Bill of Lading upload; on Save the backend
  // creates one linked House Job from it. Null when not uploading.
  billOfLadingHouseJob: any = null;
  filteredPorts: any[] = [];
  filteredPOO: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  filteredFPOD: any[] = [];
  private lastPortFilterPayloadKey = '';
  headerVesselList: any[] = [];
  carrierList: any[] = [];
  agentList: any[] = [];
  forwarderList: any[] = [];
  cfsList: any[] = [];
  yardList: any[] = [];
  TandCList: any[] = [];
  isSaving : boolean = false;
  isFormDisabled: boolean = false;
  isTermsAndConditionsEnabled: boolean = true;
  decimalAfterPrecision = 3;
  chargeList: any[] = [];
  filteredDestinationAgents: any[] = [];
  filteredOriginAgents: any[] = [];
  availableTransferCompanies: any[] = [];
  availableTransferBranches: any[] = [];
  filteredTransferBranches: any[] = [];
  allTransferCompanyMasters: any[] = [];
  allTransferBranchMasters: any[] = [];
  packageTypeList: any[] = [];
  hssacList: any[] = [];
  // Department info
  selectedDepartment: any;
  selectedDepartmentType: string = '';
  selectedFCLLCL: string = '';
  connectionResult: any[] = [];
  connectionResetTrigger = false;
  masterjobConnectionArr: any[] = [];
  currentFormValue: any;
  customerList: any[] = [];
  rateResult: any[] = [];
  masterJobRateArr: any[] = [];
  rateResetTrigger = false;
  currentRateFormValue: any;
  followUpData: any[] = [];
  followUpResetTrigger: boolean = false;
  currentFollowUpFormValue: any = null;
  edocData: any[] = [];
  edocResetTrigger = false;
  minStartDate: any;
  currentEdocFormValue: any = null;
  emailData: any[] = [];
  isLogLoading: boolean = false;
  emailResetTrigger = false;
  currentEmailFormValue: any = null;
  auditLogs: any[] = [];
  auditLogModalRef: any;
  containerActivityData: any[] = [];
  containerActivityResetTrigger = false;
  currentContainerActivityFormValue: any = null;
  customsDataArray: any[] = [];
  customsResetTrigger = false;
  currentCustomsFormValue: any = null;
  pdfModel: any

  // Shipment related variable declarations
  attachedBookings: FormArray;
  slicedAttachedBookings: any[] = [];
  page = 1;
  pageSize = 5;
  totalLengthOfAttachedBookings: number = 0;
  userData: any;
  currentDate = new Date();
  masterJobData: any;
  isTranshipment: boolean = false
  currentMenuId: any;
  selectedTransferCompanySid: number | null = null;
  selectedTransferBranchSid: number | null = null;
  isPullingToImportBranch = false;
  private readonly exportToImportCompanyConfigName = 'ExportToImportCompanyMasterSid';
  selectedContainerFile: File | null = null;
  containerUploadErrors: any[] = [];
  isProcessingContainerUpload = false;
  showContainerPreview = false;
  parsedContainers: any[] = [];
  containerValidationErrors: any[] = [];

  // Add these properties
  selectedProductFile: File | null = null;
  productUploadErrors: any[] = [];
  productValidationErrors: any[] = [];
  parsedProducts: any[] = [];
  showProductPreview = false;
  isProcessingProductUpload = false;
  // Dirty tracking for unsaved changes detection
  isDirty = false;
  private initialFormState: any = null;
  private initialConnectionsCount = 0;
  private initialContainersCount = 0;
  private initialContainerActivitiesCount = 0;
  private formSaved = false;
  isVesselFreeText: boolean = false;
  isVoyageFreeText: boolean = false;
  isETDFreeText: boolean = false;
  isETAFreeText: boolean = false;
  selectedReport: 'MBL' | 'MBLDraft' = 'MBL';
  jobStatusOptions = [
    { id: 'Job Generated', name: 'Job Generated' },
    { id: 'Open', name: 'Open' },
    { id: 'Closed', name: 'Closed' },
    { id: 'Job Closed', name: 'Job Closed' },
    { id: 'Sailed', name: 'Sailed' },
    { id: 'Operation Closed', name: 'Operation Closed' },
    { id: 'Documentation Closed', name: 'Documentation Closed' }
  ];
  tabs = [
    { name: 'Master', icon: 'fas fa-database' },
    { name: 'Container', icon: 'fas fa-boxes' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Customs', icon: 'fas fa-passport' },

    { name: 'Mail', icon: 'fas fa-envelope' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Container Activity', icon: 'fas fa-shipping-fast' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
    // { name: 'History', icon: 'fas fa-history' },
  ];

  tabs1 = [
    { name: 'Product', icon: 'fas fa-box' },
    { name: 'Connection', icon: 'fas fa-plug' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Mail', icon: 'fas fa-envelope' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
    // { name: 'History', icon: 'fas fa-history' },
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

    jobToSubJobList = [
    { id: 'Y', name: 'Y' },
    { id: 'N', name: 'N' },
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
  @ViewChild(CustomsComponent) customsComponent!: CustomsComponent;

  @ViewChild('containerModal') containerModal!: TemplateRef<any>;
  @ViewChild('productModal') productModal!: TemplateRef<any>;
  @ViewChild('masterDocumentUploadComponent') MasterDocumentUploadComponent!: TemplateRef<any>;
  @ViewChild('costEntryComponent') costEntryComponent: CostEntryComponent;
  selectedTab = 'Master';
  selectedTab1 = 'Product';
  countryOfCompany: string;
  uomList: any;
  housejobData: any[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private toastr: ToastrService,
    private appSettingsService: AppSettingsService,
    private printAuthService: PrintAuthorizationService,
    private cdr: ChangeDetectorRef,
    private datepipe: CustomDatePipe,
    private spinner: NgxSpinnerService,
    private commonService: CommonService,
    private reportService: ReportService,
    private datePipe: DatePipe,
    private exportExcelService: ExcelExportService,
    public mps: MenuPermissionService,
    private sidebarService : VerticalSidebarService,
    private emailTriggerService: EmailTriggerService,
  ) {
    this.initForm();
    this.initContainerForm();
    this.attachedBookings = this.fb.array([]);
  }

  copyDocumentNumber(controlName: string, label: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const documentNo = this.masterJobForm?.get(controlName)?.value;
    if (!documentNo) {
      return;
    }
    navigator.clipboard.writeText(String(documentNo)).then(() => {
      this.toastr.success(`${label} copied to clipboard.`, '', { timeOut: 1500 });
    });
  }

  copyContainerNumber(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const containerNo = this.containerFormGroup?.get('ContainerNumber')?.value;
    if (!containerNo) {
      return;
    }
    navigator.clipboard.writeText(String(containerNo)).then(() => {
      this.toastr.success('Container No copied to clipboard.', '', { timeOut: 1500 });
    });
  }

  ngOnInit(): void {
    this.costRevenueAccess = this.appSettingService.getCostRevenueAccess();
        const fy = this.appSettingService.getCurrentFinancialYear();
        if (fy) {
          this.fyMinDate = toNgbDateStruct(fy.StartDate);
          const fyEnd = new Date(fy.EndDate);
          const today = getDefaultTodayDate();
          this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
        }
    this.userData = this.appSettingsService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.countryOfCompany = this.currentCompany?.CountryName;
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.initializeTransferOptions();
    this.loadTermsAndConditionsConfig();
    const storedMenuId = sessionStorage.getItem('currentMenuId');
    this.mps.init().subscribe();


    this.MenuMasterSid = storedMenuId ? Number(storedMenuId) : null;


    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };



    // Setup debounced vessel search
    this.setupVesselSearchDebouncing();
    this.loadHSSACLookups();
    this.setupDepartmentBasedValidation();
    this.loadInitialData().subscribe(() => {
      const loadingPlanData = this.operationService.getLoadingPlanData();

      if (loadingPlanData) {
        this.patchLoadingPlanData(loadingPlanData);
      }
      this.route.paramMap.subscribe((param) => {
        const idParam = param.get('id');
        this.masterJobSid = idParam ? +idParam : null;
        if (this.masterJobSid) {
          this.isEditMode = true;
            this.masterJobForm.get('DepartmentMasterSid')?.disable();
          this.loadMasterJobData(this.masterJobSid);
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
        this.syncFormValueWithConnectionComponent();
        this.syncFormValueWithRateComponent();
        this.syncFormValueWithEdocComponent();
        this.syncFormValueWithEmailComponent();
        this.syncFormValueWithContainerActivityComponent();
        this.updateDirtyState();
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

  get isSuspended() : boolean {
    return this.masterJobData?.Status === 'S';
  }

  get isJobClosed(): boolean {
    const status = this.masterJobData?.JobStatus || this.masterJobForm?.get('JobStatus')?.value;
    return status === 'Closed' || status === 'Job Closed';
  }

  private parseConfigBoolean(value: any, defaultValue: boolean): boolean {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return defaultValue;
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
    if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
    return defaultValue;
  }

  // ===== UNSAVED CHANGES DETECTION ===== //

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

    // Check if main form is dirty
    if (this.masterJobForm?.dirty) {
      return true;
    }

    // Check if containers changed
    if (this.masterJobContainers?.length !== this.initialContainersCount) {
      return true;
    }

    // Check if connections changed
    if (this.connectionResult?.length !== this.initialConnectionsCount) {
      return true;
    }

    // Check if container activities changed
    if (this.containerActivityData?.length !== this.initialContainerActivitiesCount) {
      return true;
    }

    return this.isDirty && !this.isSaving;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.validateBeforeSave()) {
        resolve(false);
        return;
      }

      // Call the existing submit logic
      this.saveAndResolve(resolve);
    });
  }

  private validateBeforeSave(): boolean {
    this.clearValidationError('ETA', 'etaLessThanOrEqualEtd');
    this.clearValidationError('MasterJobDate', 'invalidDate');
    this.clearValidationError('POL', 'samePort');
    this.clearValidationError('POD', 'samePort');

    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const masterJobDateValue = this.masterJobForm.getRawValue().MasterJobDate;
      const masterJobDate = new Date(masterJobDateValue);
      const fyStartDate = new Date(fy.StartDate);
      const fyEndDate = new Date(fy.EndDate);

      if (masterJobDateValue && (masterJobDate < fyStartDate || masterJobDate > fyEndDate)) {
        this.masterJobForm.get('MasterJobDate')?.setErrors({ invalidDate: true });
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
        this.mergeValidationError('ETA', 'etaLessThanOrEqualEtd');
        this.masterJobForm.get('ETA')?.markAsTouched();
        this.showControlValidationError('ETA');
        return false;
      }
    }

    const polSid = this.masterJobForm.get('POL')?.value;
    const podSid = this.masterJobForm.get('POD')?.value;

    if (polSid && podSid && polSid === podSid) {
      this.masterJobForm.get('POL')?.setErrors({ samePort: true });
      this.masterJobForm.get('POD')?.setErrors({ samePort: true });
      this.masterJobForm.get('POL')?.markAsTouched();
      this.masterJobForm.get('POD')?.markAsTouched();
      this.showControlValidationError('POL');
      return false;
    }

    if (polSid && !podSid) {
      this.masterJobForm.get('POD')?.setErrors({ required: true });
      this.masterJobForm.get('POD')?.markAsTouched();
      this.showControlValidationError('POD');
      return false;
    }

    if (podSid && !polSid) {
      this.masterJobForm.get('POL')?.setErrors({ required: true });
      this.masterJobForm.get('POL')?.markAsTouched();
      this.showControlValidationError('POL');
      return false;
    }

    if (this.masterJobForm.invalid) {
      this.masterJobForm.markAllAsTouched();
      this.showFirstFormError();
      return false;
    }

    if (this.costEntryComponent && !this.costEntryComponent.validateRateArray()) {
      this.selectedTab = 'Rate';
      return false;
    }

    const deptName = this.selectedDepartment?.departmentName?.toLowerCase() || '';
    const isImportDepartment = deptName.includes('import');
    const mblNo = this.masterJobForm.get('MBLNo')?.value?.toString().trim();
    if (isImportDepartment && !mblNo) {
      this.masterJobForm.get('MBLNo')?.setErrors({ required: true });
      this.masterJobForm.get('MBLNo')?.markAsTouched();
      this.showControlValidationError('MBLNo');
      return false;
    }

    const customsData = this.customsComponent ? this.customsComponent.getCustomsData() : [];
    if (customsData.length > 0 && this.customsComponent && !this.customsComponent.validateForSave()) {
      this.selectedTab = 'Customs';
      this.appSettingService.showWarning('Please fill all required fields in Customs tab correctly.');
      return false;
    }

    // Block save when attached shipments share the same HBL/HAWBL No within this Master Job.
    if (this.hasDuplicateAttachedHBL()) {
      return false;
    }

    return true;
  }

  // Returns true (and toasts) when two attached shipments carry the same non-empty HBL/HAWBL No.
  private hasDuplicateAttachedHBL(): boolean {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    (this.attachedBookings.getRawValue() || []).forEach((shipment: any) => {
      const hblNo = String(shipment?.HBLNo ?? '').trim();
      if (!hblNo) {
        return;
      }
      const key = hblNo.toUpperCase();
      if (seen.has(key)) {
        duplicates.add(hblNo);
      }
      seen.add(key);
    });

    if (duplicates.size > 0) {
      const label = this.selectedDepartmentType === 'AIR' ? 'HAWBL No' : 'HBL No';
      this.toastr.error(
        `Duplicate ${label} found in attached shipments: ${Array.from(duplicates).join(', ')}. ${label} must be unique within a Master Job.`
      );
      return true;
    }

    return false;
  }

  // Per-row check used by the template to flag a duplicate HBL/HAWBL No in the attached grid.
  isDuplicateAttachedHBL(shipment: any): boolean {
    const hblNo = String(shipment?.HBLNo ?? '').trim().toUpperCase();
    if (!hblNo) {
      return false;
    }
    const count = (this.attachedBookings.getRawValue() || []).filter(
      (s: any) => String(s?.HBLNo ?? '').trim().toUpperCase() === hblNo
    ).length;
    return count > 1;
  }

  private saveAndResolve(resolve: (value: boolean) => void): void {
    this.isLoading = true;

    const getPortCode = (portSid: any): string => {
      if (!portSid && portSid !== 0) return '';
      const port = this.portList.find(p => p.PortMasterSid === portSid);
      return port ? port.PortCode : portSid?.toString().substring(0, 100);
    };

    const formValue = this.masterJobForm.getRawValue();
    const customsData = this.customsComponent ? this.customsComponent.getCustomsData() : [];
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
      CarrierName: formValue.CarrierName,
    };

    const othersData = {
      MasterJobOthersSid: formValue.MasterJobOthersSid || null,
      Yard: formValue.Yard,
      YardAddress: formValue.YardAddress,
      Transporter: formValue.Transporter,
      HandlingInformation: formValue.HandlingInformation,
      InternalNote: formValue.InternalNote,
      JobLossReason: formValue.JobLossReason?.substring(0, 300) || '',
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
      CarrierRef: formValue.CarrierRef,
      AgentRef: formValue.AgentRef,
      ExportDoDate: formValue.ExportDoDate,
      YardReceivedOn: formValue.YardReceivedOn,
      SOBDate: formValue.SOBDate,
      JobtoSubjob: formValue.JobtoSubjob,
      ExportToImport: formValue.ExportToImport || 'N'
    };

    const formData: any = {
      ...formValue,
      POO: getPortCode(formValue.POO),
      POL: getPortCode(formValue.POL),
      POD: getPortCode(formValue.POD),
      FPD: getPortCode(formValue.FPD),
      others: othersData,
      houseJobCustoms: customsData,
      voyages: [voyageData],
      DestinationAgentAddress: formValue.DestinationAgentAddress?.substring(0, 200) || '',
      POLTerminal: formValue.POLTerminal?.substring(0, 200) || '',
      PODTerminal: formValue.PODTerminal?.substring(0, 200) || '',
      CommodityDescription: formValue.CommodityDescription?.substring(0, 500) || '',
      MarksandNumber: formValue.MarksandNumber?.substring(0, 200) || '',
      Status: formValue.Status === 'Active' ? 'A' : 'S',
      masterJobConnection: this.connectionResult,
      costRevenueCharges: this.rateResult,
      masterJobContainers: this.formatContainerData(),
      MasterJobDate: this.formatDate(formValue.MasterJobDate),
      JobStatus: formValue.JobStatus,
      MBLDate: this.formatDate(formValue.MBLDate),
      DGBookingDate: this.formatDate(formValue.DGBookingDate),
      DGApprovedDate: this.formatDate(formValue.DGApprovedDate),
      ETA: this.formatDate(formValue.ETA),
      ETD: this.formatDate(formValue.ETD),
      ATA: this.formatDate(formValue.ATA),
      ATD: this.formatDate(formValue.ATD),
      DestinationATA: this.formatDate(formValue.DestinationATA),
      Haz: formValue.Haz ? 'Y' : 'N',
      CreatedBy: this.appSettingsService.userSettingSource.value['userEmail'],
      UpdatedBy: this.appSettingsService.userSettingSource.value['userEmail'],
      createdBy: this.appSettingsService.userSettingSource.value['userEmail'],
      updatedBy: this.appSettingsService.userSettingSource.value['userEmail'],
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: Number(sessionStorage.getItem('currentMenuId')),
    };

    const allShipments = (this.attachedBookings.getRawValue() || [])
      .filter(ship => !ship.MasterJobSid)
      .map(shipment => ({
        BookingHeaderSid: shipment.BookingHeaderSid,
        HBLNo: shipment.HBLNo,
      }));
    formData['shipmentList'] = [...allShipments];
    // On create, the backend uses this to also create one linked House Job from the BoL.
    formData['billOfLadingHouseJob'] = this.billOfLadingHouseJob || null;

    if (this.isEditMode && this.masterJobSid) {
      formData.MasterJobSid = this.masterJobSid;
      this.operationService.updateMasterJob(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status) {
            this.toastr.success('Master Job updated successfully');
            this.resetDirtyState();
            this.formSaved = true;
            resolve(true);
          } else {
            this.showBackendError(response, 'Failed to update Master Job');
            resolve(false);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showBackendError(error, 'Failed to update Master Job');
          resolve(false);
        }
      });
    } else {
      this.operationService.createMasterJob(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status) {
            this.toastr.success('Master Job created successfully');
            this.resetDirtyState();
            this.formSaved = true;
            resolve(true);
          } else {
            this.showBackendError(response, 'Failed to create Master Job');
            resolve(false);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showBackendError(error, 'Failed to create Master Job');
          resolve(false);
        }
      });
    }
  }

  private resetDirtyState(): void {
    this.initialFormState = this.normalizeValue(this.getCurrentFormState());
    this.isDirty = false;
    this.formSaved = false;
    this.masterJobForm?.markAsPristine();
    this.initialContainersCount = this.masterJobContainers?.length || 0;
    this.initialConnectionsCount = this.connectionResult?.length || 0;
    this.initialContainerActivitiesCount = this.containerActivityData?.length || 0;
  }

  private markAsDirty(): void {
    this.formSaved = false;
    this.updateDirtyState();
  }

  private updateDirtyState(): void {
    if (this.isSaving) {
      return;
    }

    if (!this.masterJobForm) {
      this.isDirty = false;
      return;
    }

    this.isDirty = !this.deepEqual(this.initialFormState, this.normalizeValue(this.getCurrentFormState()));
  }

  private getCurrentFormState(): any {
    return {
      masterJobForm: this.masterJobForm?.getRawValue(),
      masterJobContainers: this.masterJobContainers?.getRawValue?.() || [],
      connectionResult: this.connectionResult || [],
      masterJobRateArr: this.rateResult || [],
      followUpData: this.followUpData || [],
      edocData: this.edocData || [],
      emailData: this.emailData || [],
      containerActivityData: this.containerActivityData || [],
      customsDataArray: this.customsDataArray || [],
      attachedBookings: this.attachedBookings?.getRawValue?.() || [],
      selectedTransferCompanySid: this.selectedTransferCompanySid,
      selectedTransferBranchSid: this.selectedTransferBranchSid,
      isVesselFreeText: this.isVesselFreeText,
      isVoyageFreeText: this.isVoyageFreeText,
      isETDFreeText: this.isETDFreeText,
      isETAFreeText: this.isETAFreeText
    };
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (Array.isArray(value)) {
      return value.map(item => this.normalizeValue(item));
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
    return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
  }

  // ===== END UNSAVED CHANGES DETECTION ===== //

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  patchLoadingPlanData(data: any) {
    const selectedDepartment = this.departments.find(dep => dep.DepartmentMasterSid === data.DepartmentMasterSid);
    selectedDepartment ? this.onDeptChange(selectedDepartment) : null;
    const selectedPOL = this.portList.find(port => port.PortCode === data.POL);
    selectedPOL ? this.handlePOLChange(selectedPOL) : null;
    const selectedPOD = this.portList.find(port => port.PortCode === data.POD);
    selectedPOD ? this.handlePODChange(selectedPOD) : null;

    this.masterJobForm.patchValue({
      MasterJobVoyageSid: data.MasterJobVoyageSid,
      DepartmentMasterSid: data.DepartmentMasterSid,
      POL: selectedPOL.PortMasterSid,
      POD: selectedPOD.PortMasterSid,
      VoyageMasterSid: data.VoyageMasterSid,
      VesselName: data.VesselName,
      VoyageNo: data.VoyageNo,
      CarrierName: data.CarrierName,
      PortCutoffDate: data.PortCutoffDate ? new Date(data.PortCutoffDate) : null,
      SiCutoffDate: data.SiCutoffDate ? new Date(data.SiCutoffDate) : null,
      ETD: data.ETD ? new Date(data.ETD) : null,
      ETA: data.ETA ? new Date(data.ETA) : null,
      Haz: data.Haz === 'Y',
      NoOfPkg: data.NoofPkg,
      GrossWeight: data.GrossWeight,
      NetWeight: data.NetWeight,
      Volume: data.Volume,
    });

    this.handlePOLChange(selectedPOL);
    this.handlePODChange(selectedPOD);
    if (data.VesselName) {
      this.onVesselChange({ VesselName: data.VesselName });
      this.getVoyageForPortsAndVessels(data.VesselName);
    }

    const allContainers = data.masterJobContainers || [];
    this.masterJobContainers.clear();
    allContainers.forEach(container => {
      this.addContainer(container);
    });

    //1
    const allShipments = data.bookingList || [];
    this.attachedBookings.clear();
    allShipments.forEach(shipment => {
      this.attachedBookings.push(this.createShipmentGroup(shipment));
    });
    this.totalLengthOfAttachedBookings = this.attachedBookings.length;

    this.updateAttachedBookingsPagination();
  }








  /**
   * MBL-only upload: parses the MBL PDF and patches ONLY the Master Job (and its
   * Container). Unlike MBL/HBL, no House Job is staged, so on Save the backend
   * creates just the Master Job + MasterJobContainer. The Customer dropdown in the
   * modal is hidden/not required for this flow (mblOnly).
   */
  uploadMBL() {
    const modalRef = this.modalService.open(MasterDocumentUploadComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
    });

    // Same master data/context as MBL/HBL, but flagged MBL-only so the modal hides
    // the Customer dropdown and drops its required validator.
    modalRef.componentInstance.mode = 'master';
    modalRef.componentInstance.mblOnly = true;
    modalRef.componentInstance.portList = this.portList || [];
    modalRef.componentInstance.departmentList = this.departments || [];
    modalRef.componentInstance.customerList = this.customerList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.defaultDepartmentSid =
      this.masterJobForm.get('DepartmentMasterSid')?.value || this.selectedDepartment?.DepartmentMasterSid || null;
    modalRef.componentInstance.companyMasterSid = this.currentCompany?.CompanyMasterSid || null;

    modalRef.result.then(
      (billOfLadingData: any) => {
        if (billOfLadingData) {
          // stageHouseJob = false -> Master Job + Container only, no linked House Job.
          this.applyBillOfLadingToMasterJob(billOfLadingData, false);
        }
      },
      () => {}
    );
  }

  uploadPDF() {
    const modalRef = this.modalService.open(MasterDocumentUploadComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
    });

    // Provide master data + context so the modal can resolve Department/Ports/Customer.
    modalRef.componentInstance.mode = 'master';
    modalRef.componentInstance.portList = this.portList || [];
    modalRef.componentInstance.departmentList = this.departments || [];
    modalRef.componentInstance.customerList = this.customerList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.defaultDepartmentSid =
      this.masterJobForm.get('DepartmentMasterSid')?.value || this.selectedDepartment?.DepartmentMasterSid || null;
    modalRef.componentInstance.companyMasterSid = this.currentCompany?.CompanyMasterSid || null;

    modalRef.result.then(
      (billOfLadingData: any) => {
        if (billOfLadingData) {
          this.applyBillOfLadingToMasterJob(billOfLadingData);
        }
      },
      () => {}
    );
  }

  /**
   * Patches the Master Job from a Bill of Lading.
   * @param stageHouseJob when true (MBL/HBL) a linked House Job is staged for creation
   *   on Save; when false (MBL only) no House Job is staged.
   */
  private applyBillOfLadingToMasterJob(data: any, stageHouseJob: boolean = true): void {
    // Set the Department first (from the modal). onDeptChange rebuilds the route/port
    // filters and clears route selections, so it MUST run before the ports are patched.
    if (data?.departmentMasterSid && data?.department) {
      const currentDept = this.masterJobForm.get('DepartmentMasterSid')?.value;
      if (currentDept !== data.departmentMasterSid) {
        this.masterJobForm.get('DepartmentMasterSid')?.setValue(data.departmentMasterSid);
        this.onDeptChange(data.department);
      }
    }

    // The Bill of Lading modal already resolves the ports against the dropdown
    // (data.resolvedPOL / data.resolvedPOD). Fall back to text matching only when
    // the modal did not provide a resolved port.
    const polPort = data?.resolvedPOL || this.findPortFromBillOfLadingValue(data?.portOfLoading);
    const podPort = data?.resolvedPOD || this.findPortFromBillOfLadingValue(data?.portOfDischarge);
    // Place of Receipt -> POO (origin), Place of Delivery -> FPD (final destination).
    const porPort = data?.resolvedPOR || this.findPortFromBillOfLadingValue(data?.placeOfReceipt);
    const podelPort = data?.resolvedPODel || this.findPortFromBillOfLadingValue(data?.placeOfDelivery);

    // Vessel / Voyage from the PDF (e.g. "X-PRESS EUPHRATES / 22015W"). The names
    // are free text, so enable free-text mode so they display in the dropdowns.
    const vessel = this.splitBillOfLadingVesselVoyage(data?.vesselVoyage);

    const patchValue: any = {
      MBLNo: data?.blNumber || this.masterJobForm.get('MBLNo')?.value,
      MBLDate: this.parseBillOfLadingDate(data?.dateOfIssue) || this.masterJobForm.get('MBLDate')?.value,
      FreightPPCC: this.normalizeBillOfLadingFreightTerms(data?.freightTerms) || this.masterJobForm.get('FreightPPCC')?.value,
      CommodityDescription: data?.cargoDescription || data?.cargoDetails || this.masterJobForm.get('CommodityDescription')?.value,
      GrossWeight: this.parseBillNumber(data?.grossWeight) || this.masterJobForm.get('GrossWeight')?.value,
      Volume: this.parseBillNumber(data?.measurement) || this.masterJobForm.get('Volume')?.value,
      NoOfPkg: this.parseBillNumber(data?.numberOfPackages) || this.masterJobForm.get('NoOfPkg')?.value,
    };

    if (vessel.vesselName) {
      patchValue.isVesselFreeText = true;
      patchValue.VesselName = vessel.vesselName;
    }
    if (vessel.voyageNo) {
      patchValue.isVoyageFreeText = true;
      patchValue.VoyageNo = vessel.voyageNo;
    }

    // POO (Place of Receipt) -> falls back to POL when not separately resolved.
    const poo = porPort || polPort;
    if (poo) {
      patchValue.POO = poo.PortMasterSid;
    }
    if (polPort) {
      patchValue.POL = polPort.PortMasterSid;
    }
    if (podPort) {
      patchValue.POD = podPort.PortMasterSid;
    }
    // FPD (Place of Delivery) -> falls back to POD when not separately resolved.
    const fpd = podelPort || podPort;
    if (fpd) {
      patchValue.FPD = fpd.PortMasterSid;
    }

    this.masterJobForm.patchValue(patchValue);

    // POO has no dedicated change handler (value binding only). POL/POD handlers
    // drive the route/vessel filtering; FPD is refreshed via onRouteChange().
    if (polPort) {
      this.handlePOLChange(polPort);
    }
    if (podPort) {
      this.handlePODChange(podPort);
    }
    if (fpd) {
      this.onRouteChange();
    }

    // The container from the Bill of Lading is a MASTER-level entity, so add it
    // to the Container tab (the house job later allocates its cargo to it).
    this.addContainerFromBillOfLading(data);

    // Stage the house-level data so that, on Save, the backend also creates ONE
    // linked House Job (shipper/consignee/notify/cargo) under this master. For the
    // MBL-only flow this is skipped so only the Master Job + Container are created.
    if (stageHouseJob) {
      this.stageBillOfLadingHouseJob(data, vessel);
    } else {
      this.billOfLadingHouseJob = null;
    }

    this.masterJobForm.markAsDirty();
    this.toastr.success(stageHouseJob
      ? 'Bill of Lading loaded. On Save, the Master Job, its Container and a linked House Job will be created.'
      : 'MBL loaded. On Save, only the Master Job and its Container will be created.');
  }

  /** Splits "VESSEL NAME / VOYAGE" into its parts. */
  private splitBillOfLadingVesselVoyage(value: any): { vesselName: string; voyageNo: string } {
    const text = String(value || '').trim();
    if (!text) {
      return { vesselName: '', voyageNo: '' };
    }
    const parts = text.split('/');
    return {
      vesselName: (parts[0] || '').trim(),
      voyageNo: (parts.slice(1).join('/') || '').trim(),
    };
  }

  /**
   * Captures the house-level fields from the Bill of Lading so the backend can
   * create one linked House Job when the Master Job is saved. Only populated for
   * a NEW master job (the upload flow); cleared after a successful save.
   */
  private stageBillOfLadingHouseJob(data: any, vessel: { vesselName: string; voyageNo: string }): void {
    if (!data?.customerMasterSid) {
      this.billOfLadingHouseJob = null;
      return;
    }

    this.billOfLadingHouseJob = {
      CustomerMasterSid: data.customerMasterSid,
      DepartmentMasterSid: data.departmentMasterSid || this.masterJobForm.get('DepartmentMasterSid')?.value,
      HBLNo: data.blNumber || '',
      HBLDate: this.parseBillOfLadingDate(data.dateOfIssue),
      ShipperName: data.shipper || '',
      ShipperAddress: data.shipperAddress || '',
      ConsigneeName: data.consignee || '',
      ConsigneeAddress: data.consigneeAddress || '',
      Notify: data.notifyParty || '',
      FreightTerms: data.freightTerms || '',
      VesselName: vessel.vesselName || '',
      VoyageNo: vessel.voyageNo || '',
      POL: data.resolvedPOL?.PortCode || '',
      POD: data.resolvedPOD?.PortCode || '',
      FPD: (data.resolvedPODel || data.resolvedPOD)?.PortCode || '',
      POO: (data.resolvedPOR || data.resolvedPOL)?.PortCode || '',
      ContainerNumber: this.extractBolContainerNumber(data.containerDetails),
      ContainerType: data.containerTypeMasterSid || null,
      cargo: {
        // Master-job house cargo column is 200 chars (no Rider overflow on this path); cap to fit.
        CommodityDescription: (data.cargoDescription || data.cargoDetails || '').substring(0, 200),
        NoOfPackage: this.parseBillNumber(data.numberOfPackages) || 0,
        GrossWeight: this.parseBillNumber(data.grossWeight) || 0,
        Volume: this.parseBillNumber(data.measurement) || 0,
      },
    };
  }

  /**
   * Adds a container row to the Container tab from the Bill of Lading. Only the
   * container number and seal are parseable from the PDF; the user must still
   * choose the Container Type (required master-data) before saving.
   */
  private addContainerFromBillOfLading(data: any): void {
    const containerNumber = this.extractBolContainerNumber(data?.containerDetails);
    if (!containerNumber) {
      return;
    }

    const exists = (this.masterJobContainers?.getRawValue() || []).some(
      (c: any) => this.normalizeBillOfLadingLookupText(c?.ContainerNumber) === this.normalizeBillOfLadingLookupText(containerNumber)
    );
    if (exists) {
      return;
    }

    const containerType = data?.containerTypeMasterSid || null;
    this.addContainer({
      ContainerNumber: containerNumber,
      ContainerType: containerType,
      // Resolve the line seal from every available source (backend seal field,
      // raw extracted text, then the container-details text).
      LineSeal: this.resolveBolSeal(data),
      // MasterJobContainer.CommodityDescription is VarChar(500); cap to fit.
      CommodityDescription: (data?.cargoDescription || data?.cargoDetails || '').substring(0, 500),
      GrossWeight: this.parseBillNumber(data?.grossWeight) || 0,
      NoOfPkg: this.parseBillNumber(data?.numberOfPackages) || 0,
      Volume: this.parseBillNumber(data?.measurement) || 0,
    });

    this.toastr.info(containerType
      ? 'Container added to the Container tab from the Bill of Lading.'
      : 'Container added to the Container tab. Please select its Container Type before saving.');
  }

  private extractBolContainerNumber(value: any): string {
    const match = String(value || '').toUpperCase().replace(/\s+/g, '').match(/[A-Z]{4}\d{7}/);
    return match ? match[0] : '';
  }

  private extractBolSealNumber(value: any): string {
    const withoutContainer = String(value || '').toUpperCase().replace(/[A-Z]{4}\s*\d{7}/, ' ');
    const match = withoutContainer.match(/\b\d{5,10}\b/);
    return match ? match[0] : '';
  }

  /** Cleans the backend-extracted seal number to fit the LineSeal field (max 10 chars). */
  private normalizeBolSeal(value: any): string {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').substring(0, 10);
  }

  /**
   * Resolves the container line seal from every available source, in order:
   * 1) the backend-extracted `sealNumber` field,
   * 2) the raw extracted text (labeled "Seal No"/"A.S.No" or container-table form),
   * 3) the container-details text.
   */
  private resolveBolSeal(data: any): string {
    const direct = this.normalizeBolSeal(data?.sealNumber ?? data?.SealNo ?? data?.sealNo);
    if (direct) {
      return direct;
    }
    const fromText = this.extractSealFromText(data?.extractedText);
    if (fromText) {
      return fromText;
    }
    return this.extractBolSealNumber(data?.containerDetails);
  }

  /** Extracts a seal number from raw BoL text (labeled forms + container-table form). */
  private extractSealFromText(value: any): string {
    const text = String(value || '').toUpperCase().replace(/[`'’"]/g, ' ');
    if (!text) {
      return '';
    }
    const labeled = text.match(
      /(?:LINE\s*SEAL\s*(?:NO\.?)?|CARRIER\s*SEAL|AGENT\s*SEAL|A\.?\s*S\.?\s*NO|SEAL\s*NO\.?|SEALNO)\s*[:.\s]*([A-Z]{0,4}\d{4,}[A-Z0-9-]*)/
    );
    if (labeled?.[1]) {
      return this.normalizeBolSeal(labeled[1]);
    }
    const table = text.match(
      /[A-Z]{4}\d{7}[\s\/]*(?:1\s*X\s*)?(?:20|40|45)\s*(?:HC|HQ|GP|DC|DV|RF|RH|RE|OT|FR|TK|FL|PW)\s+([A-Z]{0,4}\d{4,}[A-Z0-9-]*)/
    );
    if (table?.[1]) {
      return this.normalizeBolSeal(table[1]);
    }
    return '';
  }

  private normalizeBillOfLadingFreightTerms(value: any): string {
    const normalizedValue = this.normalizeBillOfLadingLookupText(value);
    if (!normalizedValue) {
      return '';
    }

    if (normalizedValue.includes('COLLECT')) {
      return 'Collect';
    }

    if (normalizedValue.includes('PREPAID')) {
      return 'Prepaid';
    }

    return '';
  }

  private findPortFromBillOfLadingValue(value: string): any {
    const normalizedValue = this.normalizeBillOfLadingLookupText(value);
    if (!normalizedValue || !this.portList?.length) {
      return null;
    }

    return this.portList.find(port => {
      const code = this.normalizeBillOfLadingLookupText(port?.PortCode);
      const name = this.normalizeBillOfLadingLookupText(port?.PortName);
      const unCode = this.normalizeBillOfLadingLookupText(port?.UNLOCODE || port?.UnLocode || port?.UNCode);
      return code === normalizedValue ||
        unCode === normalizedValue ||
        name === normalizedValue ||
        normalizedValue.includes(code) ||
        normalizedValue.includes(name) ||
        name.startsWith(normalizedValue);
    }) || null;
  }

  private normalizeBillOfLadingLookupText(value: any): string {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  private parseBillOfLadingDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }

    const text = String(value).trim();
    const ddMmYyyy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddMmYyyy) {
      const parsed = new Date(Number(ddMmYyyy[3]), Number(ddMmYyyy[2]) - 1, Number(ddMmYyyy[1]));
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseBillNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const match = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
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
    });

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
    const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultMasterJobDate=  fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;
    const defaultMBLDate = fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate));
    this.masterJobForm = this.fb.group({
      // Master Job fields
      DepartmentMasterSid: ['', Validators.required],
      MasterJobNumber: [{ value: '', disabled: true }],
      ImportMasterJobNumber: [{ value: '', disabled: true }],
      MasterJobDate: [defaultMasterJobDate, Validators.required],
      FreightPPCC: ['Prepaid', Validators.required],

      DestinationAgent: [null],
      DestinationAgentAddress: [''],
      MBLNo: [''],
      MBLDate: [defaultMBLDate],
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
      NoOfPkg: [0],
      WeightIn: ['Kg(s)'],
      GrossWeight: [0],
      NetWeight: [0],
      ChargeableWeight: [0],
      Volume: [0],
      Haz: [false],
      DGBookingDate: [null],
      DGApprovedDate: [null],
      CommodityDescription: [''],
      MarksandNumber: [''],
      Status: ['Active', Validators.required],
      JobStatus: ['Job Generated', Validators.required],
      isVesselFreeText: [false],
      isVoyageFreeText: [false],
      // Voyage fields
      MasterJobVoyageSid: [null],
      VoyageMasterSid: [null],
      VesselName: [''],
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
      ExportToImport: ['N'],
      ImportMasterJobSid: [null],
      Yard: [null],
      YardAddress: [''],
      Transporter: [''],
      HandlingInformation: [''],
      InternalNote: [''],
      JobLossReason: ['', Validators.maxLength(300)],
      CFS: [null],
      CFSAddress: [''],
      StuffingStartDate: [null],
      StuffingEndDate: [null],
      CurrencyCode: [''],
      SellExchangeRate: [null],
      AgentExchangeRate: [null],
      Coload: [false],
      CoLoader: [{ value: '', disabled: true }],
      ExportDoNo: [''],
      ExportDoDate: [null],
      YardReceivedOn: [null],
      SOBDate: [null],
      JobtoSubjob:[''],
      CarrierRef: [''],
      AgentRef: [''],

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
      this.syncFormValueWithRateComponent();
    });
  }
onETDDateSelect(): void {
    const etaControl = this.masterJobForm.get('ETA');
    if (etaControl?.value) {
      etaControl.setValue(null);
    }
  }
  initContainerForm(): void {
    this.containerFormGroup = this.fb.group({
      MasterJobContainerSid: [null],
      ContainerType: [null, Validators.required],
      ContainerNumber: ['', [Validators.required, Validators.maxLength(11),
      Validators.pattern(/^[A-Z]{4}\d{7}$/), this.containerNumberValidator()
      ]],
      LineSeal: ['', Validators.maxLength(10)],
      CustomsSeal: ['', Validators.maxLength(10)],
      HsCode: ['', Validators.maxLength(10)],
      CommodityDescription: ['', Validators.maxLength(500)],
      PkgType: [null],
      NoOfPkg: [{ value: 0, disabled: true }],
      GrossWeight: [{ value: 0, disabled: true }],
      NetWeight: [{ value: 0, disabled: true }],
      Volume: [{ value: 0, disabled: true }],
      ChargeableWeight: [0, [Validators.min(0)]],

      IsSoc: [false],
      IsHaz: [{value: false, disabled: true}],
    }, { validators: this.grossNetWeightValidator() });
  }
  private grossNetWeightValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const containerGroup = control as FormGroup;
      const grossWeight = toNumber(containerGroup.get('GrossWeight')?.value);
      const netWeight = toNumber(containerGroup.get('NetWeight')?.value);

      if (grossWeight !== null && netWeight !== null && grossWeight < netWeight) {
        return { grossLessThanNet: true };
      }
      return null;
    };
  }
  // Custom validator for container number
  private containerNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const containerNumber = control.value;

      if (!containerNumber) {
        return null; // Let required validator handle this
      }

      // Check basic format
      if (!/^[A-Z]{4}\d{7}$/.test(containerNumber)) {
        return { invalidFormat: true };
      }

      // Validate check digit
      const validation = this.validateContainerNumber(containerNumber);
      if (!validation.isValid) {
        return { invalidCheckDigit: true };
      }

      return null;
    };
  }

  private normalizeContainerNumberValue(value: any): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private hasDuplicateContainerNumber(containerNumber: any, excludeIndex: number | null = null): boolean {
    const normalizedContainerNumber = this.normalizeContainerNumberValue(containerNumber);
    if (!normalizedContainerNumber) {
      return false;
    }

    return this.masterJobContainers.controls.some((control, index) => {
      if (excludeIndex !== null && index === excludeIndex) {
        return false;
      }

      return this.normalizeContainerNumberValue(control.get('ContainerNumber')?.value) === normalizedContainerNumber;
    });
  }

  private setContainerDuplicateError(): void {
    const containerControl = this.containerFormGroup.get('ContainerNumber');
    if (!containerControl) {
      return;
    }

    this.setControlError(containerControl, 'duplicate', true);
    containerControl.markAsTouched();
  }

  validateContainerNumber(containerNumber: string): { isValid: boolean, checkDigit?: number } {
    if (!containerNumber || containerNumber.length !== 11) {
      return { isValid: false };
    }

    // ISO 6346 character value mapping
    const charMap: { [key: string]: number } = {
      'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19,
      'J': 20, 'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29,
      'S': 30, 'T': 31, 'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38
    };

    // Remove any spaces and convert to uppercase
    const cleanNumber = containerNumber.toUpperCase().replace(/\s/g, '');

    if (cleanNumber.length !== 11) {
      return { isValid: false };
    }

    // Extract the base number (first 10 characters) and check digit (last character)
    const baseNumber = cleanNumber.substring(0, 10);
    const providedCheckDigit = parseInt(cleanNumber.substring(10, 11), 10);

    let sum = 0;

    // Calculate sum using ISO 6346 algorithm
    for (let i = 0; i < 10; i++) {
      const char = baseNumber[i];
      let value: number;

      // Check if character is a letter
      if (/[A-Z]/.test(char)) {
        value = charMap[char] || 0;
      } else if (/[0-9]/.test(char)) {
        value = parseInt(char, 10);
      } else {
        return { isValid: false };
      }

      // Weight factor: 2^i (power of 2)
      const weight = Math.pow(2, i);
      sum += value * weight;
    }

    // Calculate check digit
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder === 10 ? 0 : remainder;

    return {
      isValid: calculatedCheckDigit === providedCheckDigit,
      checkDigit: calculatedCheckDigit
    };
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
  formatContainerNumber(): void {
    const containerControl = this.containerFormGroup.get('ContainerNumber');
    if (!containerControl?.value) return;

    // Convert to uppercase and remove all non-alphanumeric characters
    let containerNumber = containerControl.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Set the formatted value back to the control
    containerControl.setValue(containerNumber, { emitEvent: false });

    // Basic format validation: 4 letters + 6 digits + 1 check digit
    const containerRegex = /^[A-Z]{4}\d{6}\d?$/;

    // If we have 10 characters (4 letters + 6 digits), calculate check digit
    if (containerNumber.length === 10 && containerRegex.test(containerNumber + '0')) {
      // Calculate check digit and append it
      const validation = this.validateContainerNumber(containerNumber + '0'); // Temporary append
      if (validation.checkDigit !== undefined) {
        containerNumber = containerNumber.substring(0, 10) + validation.checkDigit.toString();
        containerControl.setValue(containerNumber);
      }
    }

    // Validate the complete container number (should be 11 characters now)
    if (containerNumber.length === 11) {
      const validation = this.validateContainerNumber(containerNumber);

      if (!validation.isValid) {
        containerControl.setErrors({ 'invalidContainerNumber': true });
        this.toastr.error(`Invalid container number. Expected check digit: ${validation.checkDigit}`);
      } else {
        containerControl.setErrors(null);
        // Show success message
        setTimeout(() => {
          // This will trigger the success message in the template
          containerControl?.updateValueAndValidity({ onlySelf: true });
        }, 0);
      }
    } else if (containerNumber.length > 0) {
      containerControl.setErrors({ 'invalidFormat': true });
      this.toastr.error('Container number must be 11 characters: 4 letters + 6 digits + 1 check digit');
    }
  }
  onContainerNumberInput(event: any): void {
    const input = event.target.value;
    // Auto-convert to uppercase as user types
    const upperValue = input.toUpperCase();
    this.clearControlError(this.containerFormGroup.get('ContainerNumber'), 'duplicate');
    if (input !== upperValue) {
      event.target.value = upperValue;
      this.containerFormGroup.get('ContainerNumber')?.setValue(upperValue);
    }

    // Limit to 11 characters
    if (input.length > 11) {
      event.target.value = input.substring(0, 11);
      this.containerFormGroup.get('ContainerNumber')?.setValue(input.substring(0, 11));
    }
  }
  toggleInputType(mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.isExportToImportCompleted && !this.isLoading) {
      return;
    }
    const value = this.f[flagCtrl]?.value;
    this.f[flagCtrl]?.setValue(!value);
    this.masterJobForm.get(mainCtrl)?.reset();
  }

  toggleDateInputType(field: 'ETD' | 'ETA'): void {
    if (field === 'ETD') {
      this.isETDFreeText = !this.isETDFreeText;
      this.masterJobForm.get('ETD')?.enable();
    } else if (field === 'ETA') {
      this.isETAFreeText = !this.isETAFreeText;
      this.masterJobForm.get('ETA')?.enable();
    }
  }

  // Add this method to evaluate dropdown or free text in edit mode:
  evaluateDropdownOrFreeText() {
    let response = this.masterJobData;
    if (response?.VesselName && !this.existsInList(this.vesselList, response.VesselName)) {
      this.masterJobForm.patchValue({ isVesselFreeText: true });
    }
    if (response?.VoyageNo && !this.existsInList(this.voyageList, response.VoyageNo)) {
      this.masterJobForm.patchValue({ isVoyageFreeText: true });
    }

    // Check for manual date entries
    if (response?.ETD && this.isEditMode) {
      this.isETDFreeText = true;
      this.masterJobForm.get('ETD')?.enable();
    }
    if (response?.ETA && this.isEditMode) {
      this.isETAFreeText = true;
      this.masterJobForm.get('ETA')?.enable();
    }
  }

  existsInList(list: any[], value: any) {
    if (list) {
      return list.some(item => item.CustomerName === value);
    }
    return false;
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
      IsSoc: [container?.IsSoc === 'Y' || container?.IsSoc === true || false],
      IsHaz: [container?.IsHaz === 'Y' || container?.IsHaz === true || false]
    }, { validators: this.grossNetWeightValidator() }); // Add validator here too

    this.masterJobContainers.push(containerGroup);
  }

  loadInitialData() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

    return forkJoin({
      // seaDepartments: this.operationService.getDepartmentByType('Sea', CompanyMasterSid)
      //   .pipe(catchError(err => of({ data: [] }))),
      // roadDepartments: this.operationService.getDepartmentByType('Road', CompanyMasterSid)
      //   .pipe(catchError(err => of({ data: [] }))),
      // transportDepartments: this.operationService.getDepartmentByType('Transport', CompanyMasterSid)
      //   .pipe(catchError(err => of({ data: [] }))),
      // otherDepartments: this.operationService.getDepartmentByType('Others', CompanyMasterSid)
      //   .pipe(catchError(err => of({ data: [] }))),
       department: this.operationService.getDepartmentByType(
  CompanyMasterSid,
  ['Sea', 'Road', 'Transport', 'Others']
).pipe(catchError(() => of([]))),

      ports: this.operationService.getAllPorts()
        .pipe(catchError(err => of({ data: [] }))),
      // vessels: this.operationService.getAllVessels()
      //   .pipe(catchError(err => of({ data: [] }))),
      // Replace individual API calls with getCustomerByItsType
      agents: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['vendor', 'transporter', 'agent'] })
        .pipe(catchError(err => of([]))),
      carriers: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['carrier'] })
        .pipe(catchError(err => of([]))),
      forwarders: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['forwarder'] })
        .pipe(catchError(err => of({ data: [] }))),
      cfsList: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['cFS'] })
        .pipe(catchError(err => of({ data: [] }))),
      yards: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['yard'] })
        .pipe(catchError(err => of({ data: [] }))),
      containerTypes: this.operationService.getAllContainerTypes()
        .pipe(catchError(err => of({ data: [] }))),
      currencies: this.operationService.getAllCurrencies()
        .pipe(catchError(err => of({ data: [] }))),
      packageTypes: this.operationService.getUOMsByType('P')
        .pipe(catchError(err => of([]))),
      customers: this.operationService.getAllCustomerRelatedLookups(this.filterOption)
        .pipe(catchError(err => of([]))),
      // charges: this.operationService.getAllCharges(CompanyMasterSid)
      //   .pipe(catchError(err => of([]))),
      // userCountry: this.operationService.getCountryById(this.currentCompany.CountryMasterSid).pipe(catchError(err => of({}))),
    }).pipe(tap(({
     department  ,ports,  agents, carriers, forwarders, cfsList, yards,
      containerTypes, currencies, packageTypes, customers,
    }) => {
      this.departments = department || [];

      this.portList = (ports.data || []).map(p => ({ ...p, Country: p.countryMaster?.countryName }));
      // this.vesselList = vessels.data || [];

      // Update all customer type lists with data from the new API
      this.agentList = agents.data;
      this.carrierList = carriers.data;
      this.forwarderList = forwarders.data;
      this.cfsList = cfsList.data;
      this.yardList = yards.data;
      // this.chargeList = Array.isArray(charges) ? charges : (charges?.data || []);

      this.containerTypeList = containerTypes.data;
      const rawCurrencies: any[] = Array.isArray(currencies)
        ? currencies
        : currencies?.data || [];
      this.currencyList = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
      this.packageTypeList = packageTypes.data;
      this.filteredDestinationAgents = [...this.agentList];
      this.filteredOriginAgents = [...this.agentList];
      this.customerList = customers.data;

      this.filteredPorts = [];
      this.filteredPOO = [];
      this.filteredPOL = [];
      this.filteredPOD = [];
      this.filteredFPOD = [];
    }));

  }




  loadMasterJobData(masterJobSid: number): void {
    this.isLoading = true;
    this.spinner.show();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      screenName: 'Master Job',
      MasterJobSid: masterJobSid,
      CompanyMasterSid,
      BranchMasterSid
    }
    forkJoin({
      masterJob: this.operationService.getMasterJobById(payload)
    }).subscribe({
      next: (responses: any) => {
        // Handle master job data
        if (responses.masterJob.status && responses.masterJob.data) {
          const data = responses.masterJob.data;
          this.masterJobData = data;


          const aggregatedTotals = data.aggregatedTotals;

          this.patchFormValues({
            ...data,
            // Use aggregated totals instead of individual values
            NoOfPkg: aggregatedTotals?.NoOfPkg || data.NoOfPkg,
            GrossWeight: aggregatedTotals?.GrossWeight || data.GrossWeight,
            NetWeight: aggregatedTotals?.NetWeight || data.NetWeight,
            ChargeableWeight: aggregatedTotals?.ChargeableWeight || data.ChargeableWeight,
            Volume: aggregatedTotals?.Volume || data.Volume,
            WeightIn: aggregatedTotals?.WeightIn || data.WeightIn
          });
          this.masterJobForm.get('MasterJobDate')?.disable();

          this.loadCustomsData(() => {
            setTimeout(() => this.resetDirtyState(), 0);
          });
          // The backend resolves the linked import/export job number cross-company
          // (the linked job lives in the destination company/branch).
          this.masterJobForm.get('ImportMasterJobNumber')?.setValue(data?.ImportMasterJobNumber || '', { emitEvent: false });
        }
        else {
          this.appSettingsService.showError(responses.message || 'Access denied.');
        }

        this.isLoading = false;
        this.spinner.hide();

        // Reset dirty state after all async operations complete (including loadCustomsData)
        setTimeout(() => this.resetDirtyState(), 100);
      },
      error: (error) => {
        this.toastr.error('Failed to load master job data');
        console.error('Error loading master job:', error);
        this.isLoading = false;
        this.spinner.hide();
      }
    });
  }

  patchFormValues(data: any) {

    // Helper to find port SID by port code (if stored as code in data)
    const findPortSidByCode = (portCodeOrSid: any): number | null => {
      if (!portCodeOrSid && portCodeOrSid !== 0) return null;
      // if it's a number, assume already SID
      if (typeof portCodeOrSid === 'number') return portCodeOrSid;
      // if string, try match by PortCode
      const p = this.portList.find(p => p.PortCode === portCodeOrSid);
      return p ? p.PortMasterSid : null;
    };

    // Set department context before patching route fields. onDeptChange clears
    // route controls, so it must run before POO/POL/POD/FPD are populated.
    const selectedDepartment = this.departments.find(dep => dep.DepartmentMasterSid === data.DepartmentMasterSid);
    if (selectedDepartment) {
      this.onDeptChange(selectedDepartment);
    }

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
      MBLDate: data.MBLDate ? new Date(data.MBLDate) : null,
      BLReleaseType: data.BLReleaseType || 'Original',
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
      // MasterJobVoyageSid: data.MasterJobVoyageSid || null,
      // VoyageMasterSid: data.VoyageMasterSid || null,
      // VesselName: data.VesselName || '',
      // VoyageNo: data.VoyageNo || '',
      // ETA: data.ETA ? new Date(data.ETA) : null,
      // ETD: data.ETD ? new Date(data.ETD) : null,
      // ATA: data.ATA ? new Date(data.ATA) : null,
      // ATD: data.ATD ? new Date(data.ATD) : null,
      // DestinationATA: data.DestinationATA ? new Date(data.DestinationATA) : null,
      // CarrierName: data.CarrierName || '',
      // PortCutoffDate: data.PortCutoffDate ? new Date(data.PortCutoffDate) : null,
      // SiCutoffDate: data.SiCutoffDate ? new Date(data.SiCutoffDate) : null,
    });
    this.refreshPortFilters();
    this.evaluateDropdownOrFreeText();
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
          JobLossReason: othersData.JobLossReason || '',
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
          JobtoSubjob: othersData.JobtoSubjob,
          ImportMasterJobSid: othersData.ImportMasterJobSid || null,
          ExportToImport: othersData.ExportToImport || 'N',
          ExportDoDate: othersData.ExportDoDate ? new Date(othersData.ExportDoDate) : null,
          YardReceivedOn: othersData.YardReceivedOn ? new Date(othersData.YardReceivedOn) : null,
          SOBDate: othersData.SOBDate ? new Date(othersData.SOBDate) : null,
        });
        this.applyVoyageLock();
        // Capture the saved branch first: onTransferCompanyChange() resets
        // selectedTransferBranchSid to null while rebuilding the branch list,
        // so it must be restored afterwards. The destination isn't persisted on
        // the source job, so prefer the linked import job's own company/branch
        // (resolved by the backend) before falling back to any stored values.
        const savedTransferBranchSid = data.ImportMasterJobBranchMasterSid || othersData.DestinationBranchMasterSid || data.DestinationBranchMasterSid || null;
        this.selectedTransferCompanySid = data.ImportMasterJobCompanyMasterSid || othersData.DestinationCompanyMasterSid || data.DestinationCompanyMasterSid || this.selectedTransferCompanySid;
        this.selectedTransferBranchSid = savedTransferBranchSid;
        if (this.selectedTransferCompanySid) {
          this.onTransferCompanyChange(this.selectedTransferCompanySid);
          this.selectedTransferBranchSid = savedTransferBranchSid && this.filteredTransferBranches.some(
            (branch: any) => Number(branch?.BranchMasterSid) === Number(savedTransferBranchSid)
          )
            ? savedTransferBranchSid
            : null;
        }
        if (othersData.Coload === 'Y') {
          this.masterJobForm.get('CoLoader')?.enable();
        } else {
          this.masterJobForm.get('CoLoader')?.disable();
        }

      }
    }

     if (this.isEditMode) {
  this.masterJobForm.get('DepartmentMasterSid')?.disable();
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



      // CRITICAL: Use the voyage variable that was just calculated above
      this.masterJobForm.patchValue({
        MasterJobVoyageSid: voyage.MasterJobVoyageSid || null,
        VoyageMasterSid: voyage.VoyageMasterSid,
        VesselName: voyage.VesselName || '',
        VoyageNo: voyage.VoyageNo || '',
        ETA: voyage.ETA ? new Date(voyage.ETA) : null,
        ETD: voyage.ETD ? new Date(voyage.ETD) : null,
        ATA: voyage.ATA ? new Date(voyage.ATA) : null,
        ATD: voyage.ATD ? new Date(voyage.ATD) : null,
        DestinationATA: voyage.DestinationATA ? new Date(voyage.DestinationATA) : null,
        CarrierName: voyage.CarrierName || '',
        PortCutoffDate: voyage.PortCutoff ? new Date(voyage.PortCutoff) :
          voyage.PortCutoffDate ? new Date(voyage.PortCutoffDate) :
            data.PortCutoffDate ? new Date(data.PortCutoffDate) : null,
      });
      this.applyVoyageLock();

    }
    // ✅ Fixed: Populate carrier dropdown for edit mode
    // if (data.CarrierName && data.CarrierMasterSid) {
    //   const existingCarrier = this.carrierList.find(c => c.CarrierMasterSid === data.CarrierMasterSid);
    //   if (!existingCarrier) {
    //     this.carrierList.push({
    //       CarrierMasterSid: data.CarrierMasterSid,
    //       CarrierName: data.CarrierName
    //     });
    //   }
    // }

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
      RateSid: rate.CostRevenueChargesSid,
      status: rate.status === "A" ? "Active" : "Suspended"
    }));
    this.rateResult = [...this.masterJobRateArr];
    if (
      this.isEditMode &&
      this.masterJobRateArr?.some(rate =>
        rate.CostVoucherHeaderSid !== null || rate.RevenueVoucherHeaderSid !== null
      )
    ) {
      this.masterJobForm.get('Status')?.disable();
    }
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

    if (data.allShipments.length > 0) {
      this.patchShipments(allShipments);
    }

    this.applyStatusDrivenFormState();
  }

  onStatusChange(): void {
    const status = this.masterJobForm.get('Status')?.getRawValue();
    const hasHouseJobs = Array.isArray(this.masterJobData?.houseJob) && this.masterJobData.houseJob.length > 0;
    const initialStatus = this.masterJobData?.Status === 'S' ? 'Suspended' : 'Active';
    const statusChanged = this.isEditMode && !!status && status !== initialStatus;

    if (hasHouseJobs && (status === 'Suspended' || !status)) {
      const firstHouseJob = this.masterJobData?.houseJob?.[0];
      const hblNo = firstHouseJob?.HBLNo ? `\n\nHouse Job with HBL No: ${firstHouseJob.HBLNo} is associated with it.` : '';

      this.appSettingService.showWarning(
        `This master job cannot be suspended.${hblNo}`
      );
      this.masterJobForm.get('Status')?.setValue('Active');
      return;
    }

    if (statusChanged) {
      this.markAsDirty();
    }

    this.applyStatusDrivenFormState();
  }

  private applyStatusDrivenFormState(): void {
    const statusValue = this.masterJobForm.get('Status')?.getRawValue();
    const shouldDisableAll = this.isEditMode && (statusValue === 'Suspended' || this.isJobClosed);

    if (shouldDisableAll) {
      this.disableAllForms();
    } else {
      this.enableAllForms();
    }

    this.applyStatusFieldLock();
  }

  private applyStatusFieldLock(): void {
    const statusControl = this.masterJobForm.get('Status');
    if (!statusControl) {
      return;
    }

    const hasPostedRates = this.masterJobRateArr?.some(rate =>
      rate.CostVoucherHeaderSid !== null || rate.RevenueVoucherHeaderSid !== null
    );

    if (this.isEditMode && (this.hasHouseJobLinked || hasPostedRates || this.isFormDisabled)) {
      statusControl.disable({ emitEvent: false });
      return;
    }

    statusControl.enable({ emitEvent: false });
  }

  private disableAllForms(): void {
    Object.keys(this.masterJobForm.controls).forEach(key => {
      if (key !== 'Status') {
        this.masterJobForm.get(key)?.disable({ emitEvent: false });
      }
    });

    this.isFormDisabled = true;
  }

  private enableAllForms(): void {
    Object.keys(this.masterJobForm.controls).forEach(key => {
      this.masterJobForm.get(key)?.enable({ emitEvent: false });
    });

    this.masterJobForm.get('MasterJobNumber')?.disable({ emitEvent: false });
    // Linked import/export job number is display-only — keep it disabled.
    this.masterJobForm.get('ImportMasterJobNumber')?.disable({ emitEvent: false });

    if (this.isEditMode) {
      this.masterJobForm.get('DepartmentMasterSid')?.disable({ emitEvent: false });
      this.masterJobForm.get('MasterJobDate')?.disable({ emitEvent: false });
    }

    if (this.masterJobForm.get('Coload')?.value !== true) {
      this.masterJobForm.get('CoLoader')?.disable({ emitEvent: false });
    }

    this.updateMBLValidation(this.masterJobForm.get('DepartmentMasterSid')?.value);
    this.applyVoyageLock();
    this.isFormDisabled = false;
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

  // getPackageTypeName(pkgTypeSid: number): string {
  //   const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
  //   return packageType ? packageType.UOMName : 'Unknown';
  // }
  getPackageTypeName(pkgTypeSid: number): string {
    if (!pkgTypeSid) return '';
    const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
    return packageType ? packageType.UOMName : '';
  }

  setAddress(controlName: string, item: any) {
    this.masterJobForm.get(controlName)?.setValue(item ? item.CustomerAddress1 : '');
  }
  private setupDepartmentBasedValidation(): void {
    // Watch for department changes
    this.masterJobForm.get('DepartmentMasterSid')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((departmentSid) => {
        this.updateMBLValidation(departmentSid);
      });

    // Set initial validation based on current department
    const currentDept = this.masterJobForm.get('DepartmentMasterSid')?.value;
    this.updateMBLValidation(currentDept);
  }

  private updateMBLValidation(departmentSid: number | null): void {
    const mblNoControl = this.masterJobForm.get('MBLNo');
    const mblDateControl = this.masterJobForm.get('MBLDate');

    if (!departmentSid) {
      // No department selected - disable both fields
      mblNoControl?.disable();
      mblDateControl?.disable();
      mblNoControl?.clearValidators();
      mblDateControl?.clearValidators();
      return;
    }

    const department = this.departments.find(dep => dep.DepartmentMasterSid === departmentSid);
    const deptName = department?.departmentName?.toLowerCase();

    // Check if department is Export
    const isExport = deptName?.includes('export');

    // Check if department is Import
    const isImport = deptName?.includes('import');

    if (isExport) {
      // Export department - disable both fields
      mblNoControl?.enable();
      mblDateControl?.enable();
      mblNoControl?.clearValidators();
      mblDateControl?.clearValidators();

    } else if (isImport) {
      // Import department - enable and make required
      mblNoControl?.enable();
      mblDateControl?.enable();
      mblNoControl?.setValidators([Validators.required, Validators.maxLength(50)]);
      mblDateControl?.setValidators([Validators.required]);

    } else {
      // Other departments - enable but not required
      mblNoControl?.enable();
      mblDateControl?.enable();
      mblNoControl?.clearValidators();
      mblDateControl?.clearValidators();
      mblNoControl?.setValidators([Validators.maxLength(50)]);
    }

    mblNoControl?.updateValueAndValidity();
    mblDateControl?.updateValueAndValidity();
    this.cdr.detectChanges();
  }
  onDeptChange(department: any) {
    this.selectedDepartment = department;
    if (!department) {
      this.selectedDepartmentType = '';
      this.selectedFCLLCL = 'LCL';
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
      // this.masterJobForm.get('MovementType')?.setValue(null);
      this.updateMBLValidation(null);
      return;
    }

    this.selectedDepartmentType = this.normalizePortText(department?.departmentType);
    this.selectedFCLLCL = this.resolveSelectedSegment(department);
    this.clearRouteSelections();

    this.updateMBLValidation(department.DepartmentMasterSid);

    this.refreshPortFilters();

    // if (this.selectedDepartmentType === "SEA") {
    //   this.masterJobForm.get('MovementType')?.setValue('Sea');
    // } else if (this.selectedDepartmentType === "AIR") {
    //   this.masterJobForm.get('MovementType')?.setValue('Flight');
    // }

    // Trigger vessel search after department change
    this.triggerVesselSearch();
  }

  private clearRouteSelections(): void {
    this.lastPortFilterPayloadKey = '';
    this.filteredPorts = [];
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFPOD = [];
    this.masterJobForm.get('POO')?.setValue(null);
    this.masterJobForm.get('POL')?.setValue(null);
    this.masterJobForm.get('POD')?.setValue(null);
    this.masterJobForm.get('FPD')?.setValue(null);
  }

  get isExportToImportCompleted(): boolean {
    return this.masterJobForm.get('ExportToImport')?.value === 'Y';
  }

  get isImportDepartment(): boolean {
    return (this.selectedDepartment?.ExportImport || '').toString().toLowerCase() === 'import';
  }

  private isFclOrLclImportDepartment(): boolean {
    const departmentName = (
      this.selectedDepartment?.departmentName ||
      this.getDepartmentName(this.masterJobForm.get('DepartmentMasterSid')?.value)
    )?.toString().trim().toLowerCase();

    return departmentName === 'fcl import' || departmentName === 'lcl import';
  }

  shouldShowMasterPrintOption(reportName: 'MBL' | 'MBL Draft' | 'Loading Plan' | 'All HBL Draft' | 'All HBL'): boolean {
    if (!this.mps.canPrint(reportName, 'Print')) {
      return false;
    }

    return !this.isFclOrLclImportDepartment();
  }

  private applyVoyageLock(): void {
    const voyageControl = this.masterJobForm.get('VoyageNo');
    if (!voyageControl) {
      return;
    }

    if (this.isExportToImportCompleted) {
      voyageControl.disable({ emitEvent: false });
    } else {
      voyageControl.enable({ emitEvent: false });
    }
  }

  get hasHouseJobs(): boolean {
    return Array.isArray(this.masterJobData?.houseJob) && this.masterJobData.houseJob.length > 0;
  }

  private get hasHouseJobLinked(): boolean {
    return this.hasHouseJobs ||
      this.masterJobData?.hashousejob === true ||
      this.masterJobData?.hasHouseJob === true ||
      this.masterJobData?.hasHousejob === 'Y';
  }

  get canPullToImportBranch(): boolean {
    const exportImport = (this.selectedDepartment?.ExportImport || '').toString().toLowerCase();
    return this.isEditMode && this.hasHouseJobs && exportImport === 'export' && this.availableTransferCompanies.length > 0;
  }

  private initializeTransferOptions(): void {
    const currentCompanySid = Number(this.currentCompany?.CompanyMasterSid || 0);
    if (!currentCompanySid) {
      this.availableTransferCompanies = [];
      this.selectedTransferCompanySid = null;
      this.selectedTransferBranchSid = null;
      this.filteredTransferBranches = [];
      return;
    }

    this.masterService.getConfigurationValue(currentCompanySid, this.exportToImportCompanyConfigName).subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        const configuredCompanyIds = this.parseTransferCompanyConfigValue(rawValue);
        this.loadTransferCompanyMasters(configuredCompanyIds);
      },
      error: () => {
        this.loadTransferCompanyMasters([]);
      }
    });
  }

  private loadTransferCompanyMasters(configuredCompanyIds: number[]): void {
    forkJoin({
      companies: this.masterService.getAllCompanies().pipe(catchError(() => of([]))),
      branches: this.masterService.getAllBranches().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ companies, branches }) => {
        this.allTransferCompanyMasters = Array.isArray(companies) ? companies : [];
        this.allTransferBranchMasters = Array.isArray(branches) ? branches : [];
        this.applyTransferCompanyOptions(configuredCompanyIds);
      },
      error: () => {
        this.allTransferCompanyMasters = [];
        this.allTransferBranchMasters = [];
        this.applyTransferCompanyOptions(configuredCompanyIds);
      }
    });
  }

  private parseTransferCompanyConfigValue(value: any): number[] {
    if (Array.isArray(value)) {
      return value
        .map((item: any) => Number(item))
        .filter((item: number) => Number.isFinite(item) && item > 0);
    }

    const raw = String(value ?? '').trim();
    if (!raw) {
      return [];
    }

    return raw
      .split(',')
      .map((item: string) => Number(item.trim()))
      .filter((item: number) => Number.isFinite(item) && item > 0);
  }

  private applyTransferCompanyOptions(configuredCompanyIds: number[]): void {
    const currentCompanySid = Number(this.currentCompany?.CompanyMasterSid || 0);
    const currentCompanyHasAlternateBranch = this.getTransferBranchesForCompany(currentCompanySid).length > 0;
    const allowedCompanyIds = new Set<number>(configuredCompanyIds);

    if (currentCompanySid && currentCompanyHasAlternateBranch) {
      allowedCompanyIds.add(currentCompanySid);
    }

    this.availableTransferCompanies = (this.allTransferCompanyMasters || [])
      .filter((company: any) =>
        !!company?.CompanyMasterSid &&
        allowedCompanyIds.has(Number(company.CompanyMasterSid))
      );

    const preferredCompanySid = this.availableTransferCompanies.some(
      (company: any) => Number(company?.CompanyMasterSid) === currentCompanySid
    )
      ? currentCompanySid
      : Number(this.availableTransferCompanies[0]?.CompanyMasterSid || 0);

    this.selectedTransferCompanySid = preferredCompanySid || null;
    this.selectedTransferBranchSid = null;
    this.filteredTransferBranches = [];

    if (this.selectedTransferCompanySid) {
      this.onTransferCompanyChange(this.selectedTransferCompanySid);
    }
  }

  private getTransferBranchesForCompany(companySid: number): any[] {
    if (!companySid) {
      return [];
    }

    const selectedCompany = (this.allTransferCompanyMasters || []).find(
      (company: any) => Number(company?.CompanyMasterSid) === Number(companySid)
    );

    return (this.allTransferBranchMasters || [])
      .filter((branch: any) =>
        Number(branch?.CompanyMasterSid) === Number(companySid) &&
        (
          Number(companySid) !== Number(this.currentCompany?.CompanyMasterSid) ||
          Number(branch?.BranchMasterSid) !== Number(this.currentBranch?.BranchMasterSid)
        )
      )
      .map((branch: any) => ({
        ...branch,
        CompanyMasterSid: selectedCompany?.CompanyMasterSid,
        companyName: selectedCompany?.companyName,
      }));
  }

  onTransferCompanyChange(companySid: number | null): void {
    this.selectedTransferCompanySid = companySid ? Number(companySid) : null;
    this.selectedTransferBranchSid = null;

    if (!this.selectedTransferCompanySid) {
      this.filteredTransferBranches = [];
      return;
    }

    this.filteredTransferBranches = this.getTransferBranchesForCompany(this.selectedTransferCompanySid);
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
          // The created import job lives in the destination company/branch and
          // cannot be loaded with the current company. Stay on the export job and
          // reload it — it now carries ExportToImport='Y' and the linked import sid.
          this.loadMasterJobData(this.masterJobSid);
        }
      },
      error: () => {
        this.isPullingToImportBranch = false;
        this.toastr.error('Failed to pull master job to import branch.');
      }
    });
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

    // Trigger vessel search after route change
    this.triggerVesselSearch();
  }

  private refreshPortFilters(): void {
    const departmentSid = this.masterJobForm.get('DepartmentMasterSid')?.value || this.selectedDepartment?.DepartmentMasterSid;
    if (!departmentSid) {
      this.lastPortFilterPayloadKey = '';
      this.applyPortFilterLists({ filteredPorts: [], filteredPOO: [], filteredPOL: [], filteredPOD: [], filteredFPOD: [] });
      return;
    }

    const payload = {
      DepartmentMasterSid: departmentSid,
      ShipmentType: this.getShipmentDirection(),
      LoginCountryMasterSid: this.getLoginCountryMasterSid(),
      PortFieldType: 'ALL',
      SelectedPOO: this.masterJobForm.get('POO')?.value,
      SelectedPOL: this.masterJobForm.get('POL')?.value,
      SelectedPOD: this.masterJobForm.get('POD')?.value,
      SelectedFPOD: this.masterJobForm.get('FPD')?.value
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
      },
      error: () => {
        this.lastPortFilterPayloadKey = '';
      }
    });
  }

  private getLoginCountryMasterSid(): number | null {
    return this.toNumericValue(
      this.currentBranch?.CountryMasterSid ??
      this.currentBranch?.branchMaster?.CountryMasterSid ??
      this.currentCompany?.CountryMasterSid
    );
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

  // Handle POL change
  handlePOLChange(selectedPort: any) {
    if (!selectedPort) {
      this.refreshPortFilters();
      this.clearVesselAndVoyageData();
      return;
    }
    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.masterJobForm.get('POL')?.setValue(selectedPortSid, { emitEvent: false });
    this.onRouteChange();
    this.triggerVesselSearch();
  }

  // Handle POD change
  handlePODChange(selectedPort: any) {
    if (!selectedPort) {
      this.clearVesselAndVoyageData();
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

    this.triggerVesselSearch();
  }

  private clearVesselAndVoyageData(): void {
    this.masterJobForm.get('VesselName')?.setValue(null);
    this.masterJobForm.get('VoyageNo')?.setValue(null);
    this.masterJobForm.get('ETA')?.setValue(null);
    this.masterJobForm.get('ETD')?.setValue(null);
    this.headerVesselList = [];
    this.voyageList = [];
  }

  private triggerVesselSearch(): void {
    const POL = this.masterJobForm.get('POL')?.value;
    const POD = this.masterJobForm.get('POD')?.value;
    const MovementType = this.selectedDepartment?.departmentType;
    const voyageSegment = this.getVoyageTypeBasedOnDept(this.selectedDepartment?.DepartmentMasterSid);

    if (POL && POD && MovementType && voyageSegment) {
      // Use the subject to trigger debounced search
      this.vesselSearchSubject.next({
        POL: POL,
        POD: POD,
        MovementType: MovementType
      });
    }
  }

  private setupVesselSearchDebouncing(): void {
    this.vesselSearchSubject
      .pipe(
        debounceTime(500), // Wait 500ms after the last emission
        distinctUntilChanged((prev, curr) =>
          prev.POL === curr.POL &&
          prev.POD === curr.POD &&
          prev.MovementType === curr.MovementType
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(params => {
        this.performVesselSearch(params);
      });
  }


  private performVesselSearch(params: { POL: string | number, POD: string | number, MovementType: string }): void {
    if (this.isLoadingVessels) {
      return;
    }

    if (!params.POL || !params.POD) {
      return;
    }

    const voyageSegment = this.getVoyageTypeBasedOnDept(this.selectedDepartment?.DepartmentMasterSid);
    if (!voyageSegment) {
      this.headerVesselList = [];
      this.voyageList = [];
      return;
    }

    // Add this check: Don't search vessels if manual entry is enabled
    if (this.f['isVesselFreeText']?.value || this.f['isVoyageFreeText']?.value) {
      return;
    }

    this.isLoadingVessels = true;
    this.lastVesselSearchParams = { ...params };

    const payload = {
      POL: params.POL,
      POD: params.POD,
      segment: voyageSegment
    };

    this.operationService.getVesselVoyageBasedOnPorts(payload).subscribe({
      next: (resp: any) => {
        this.isLoadingVessels = false;
        if (resp.status) {
          this.headerVesselList = resp.data.map((vslVoy: any) => ({
            ...vslVoy,
            VesselName: vslVoy.VesselName,
            VoyageNo: vslVoy.VoyageNo,
            ETD: this.datepipe.transform(vslVoy.ETD),
            ETA: this.datepipe.transform(vslVoy.ETA),
            PortCutoff: this.datepipe.transform(vslVoy.PortCutoff),
            // Store original dates for auto-population
            originalETD: vslVoy.ETD,
            originalETA: vslVoy.ETA,
            originalPortCutoff: vslVoy.PortCutoff
          }));

          // Only show warning if vessel list is empty AND manual entry is NOT enabled
          if (this.headerVesselList.length === 0 &&
            !this.f['isVesselFreeText']?.value &&
            !this.f['isVoyageFreeText']?.value) {

          }
        } else {
          this.toastr.error("Error loading Vessel");
        }
      },
      error: (error) => {
        this.isLoadingVessels = false;
        console.error('Error loading vessels:', error);
        this.toastr.error("Error loading Vessel");
      }
    });
  }

  // Helper method to determine voyage type based on department
  private getVoyageTypeBasedOnDept(deptId: number): string {
    const dept = this.departments.find(dept => dept.DepartmentMasterSid === deptId);
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

  // Vessel change handler
  onVesselChange(vessel: any) {
    if (this.isExportToImportCompleted && !this.isLoading) {
      return;
    }
    if (!vessel) {
      this.voyageList = [];
      this.masterJobForm.get('VoyageNo')?.setValue(null);
      this.masterJobForm.get('ETA')?.setValue(null);
      this.masterJobForm.get('ETD')?.setValue(null);
      this.masterJobForm.get('PortCutoffDate')?.setValue(null);
      return;
    }

    // Set vessel name
    this.masterJobForm.get('VesselName')?.setValue(vessel.VesselName);

    // Get voyages for the selected vessel and ports
    this.getVoyageForPortsAndVessels(vessel.VesselName);

    // If vessel has voyage data, auto-populate
    if (vessel.VoyageNo) {
      this.autoPopulateVoyageData(vessel);
    }
  }

  getVoyageForPortsAndVessels(vesselName?: string) {
    const POL = this.masterJobForm.get('POL')?.value;
    const POD = this.masterJobForm.get('POD')?.value;
    const vessel = vesselName || this.masterJobForm.get('VesselName')?.value;

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
            const currentVoyageNo = this.masterJobForm.get('VoyageNo')?.value;
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
          this.toastr.error("Error loading sailing schedules.");
        }
      },
      (err) => {
        console.error('Error loading voyages:', err);
        this.toastr.error("Error loading sailing schedules.");
      }
    );
  }
  // Voyage change handler
  onVoyageChange(voyage: any) {
    if (this.isExportToImportCompleted && !this.isLoading) {
      return;
    }
    if (!voyage) {
      this.masterJobForm.get('ETA')?.setValue(null);
      this.masterJobForm.get('ETD')?.setValue(null);
      this.masterJobForm.get('PortCutoffDate')?.setValue(null);
      this.masterJobForm.get('VoyageMasterSid')?.setValue(null);
      return;
    }



    // Set voyage details
    this.masterJobForm.patchValue({
      MasterJobVoyageSid: voyage.MasterJobVoyageSid || null,
      VoyageMasterSid: voyage.VoyageMasterHeaderSid || null,
      VoyageNo: voyage.VoyageNo,
      VesselName: voyage.VesselName || this.masterJobForm.get('VesselName')?.value
    });

    // Auto-set ETD, ETA, and CutOffDate from voyage data
    if (voyage.ETD) {
      this.masterJobForm.get('ETD')?.setValue(new Date(voyage.ETD));
    }

    if (voyage.ETA) {
      this.masterJobForm.get('ETA')?.setValue(new Date(voyage.ETA));
      this.minStartDate = new Date(voyage.ETA);
    }

    // ⚠️ CRITICAL FIX: Set PortCutoffDate properly
    if (voyage.PortCutoff) {

      this.masterJobForm.get('PortCutoffDate')?.setValue(new Date(voyage.PortCutoff));
    } else if (voyage.PortCutoffDate) {

      this.masterJobForm.get('PortCutoffDate')?.setValue(new Date(voyage.PortCutoffDate));
    }

    // Also check voyage.Ports array for port-specific cutoff
    if (voyage.Ports && Array.isArray(voyage.Ports)) {
      const POL = this.masterJobForm.get('POL')?.value;
      const polDetail = voyage.Ports.find((p: any) => p.POLSid === POL);

      if (polDetail?.PortCutoff) {

        this.masterJobForm.get('PortCutoffDate')?.setValue(new Date(polDetail.PortCutoff));
      }
    }

    this.cdr.detectChanges();
  }
  refreshVoyageData(): void {
    const vesselName = this.masterJobForm.get('VesselName')?.value;
    const POL = this.masterJobForm.get('POL')?.value;
    const POD = this.masterJobForm.get('POD')?.value;

    if (vesselName && POL && POD) {
      this.getVoyageForPortsAndVessels(vesselName);
    }
  }
  private autoPopulateVoyageData(vessel: any): void {
    if (vessel.VoyageNo) {
      this.masterJobForm.patchValue({
        VoyageNo: vessel.VoyageNo,
        ETA: vessel.ETA ? new Date(vessel.ETA) : null,
        ETD: vessel.ETD ? new Date(vessel.ETD) : null,
        PortCutoffDate: vessel.PortCutoff ? new Date(vessel.PortCutoff) : null
      });
    }
  }

  private convertPortFields(data: any): any {
    const portFields = ['POO', 'POL', 'POD', 'FPD'];
    const convertedData = { ...data };

    portFields.forEach(field => {
      if (convertedData[field] !== null && convertedData[field] !== undefined) {
        convertedData[field] = convertedData[field].toString();
      }
    });

    return convertedData;
  }

  // Helper method to get port code from name or PortMasterSid
  private getPortCodeFromName(portNameOrSid: any): string {
    if (!portNameOrSid && portNameOrSid !== 0) return '';
    // if numeric assume SID
    if (typeof portNameOrSid === 'number') {
      const port = this.portList.find(p => p.PortMasterSid === portNameOrSid);
      return port ? port.PortCode : '';
    }
    // if a string and equals a port name or code try find
    const portByName = this.portList.find(p => p.PortName === portNameOrSid || p.PortCode === portNameOrSid);
    return portByName ? portByName.PortCode : (typeof portNameOrSid === 'string' ? portNameOrSid.substring(0, 5) : '');
  }

  onSubmit(resolve?: (value: boolean) => void): void {
    if (this.isSaving || this.isLoading) {
      resolve?.(false);
      return;
    }
    if (this.isEditMode && !this.hasUnsavedChanges()) {
      this.toastr.warning('No changes to save');
      resolve?.(false);
      return;
    }
    if (!this.validateBeforeSave()) {
      resolve?.(false);
      return;
    }

    this.isLoading = true;

    const getPortCode = (portSid: any): string => {
      if (!portSid && portSid !== 0) return '';
      const port = this.portList.find(p => p.PortMasterSid === portSid);
      return port ? port.PortCode : portSid?.toString().substring(0, 100);
    };

    const formValue = this.masterJobForm.getRawValue();
    const customsData = this.customsComponent ? this.customsComponent.getCustomsData() : [];

    let CarrierSid = null;
    if (formValue.CarrierName) {
      const selectedCarrier = this.carrierList.find(carrier =>
        carrier.CustomerName === formValue.CarrierName
      );
      if (selectedCarrier) {
        CarrierSid = selectedCarrier.CustomerMasterSid;
      }
    }
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
      JobLossReason: formValue.JobLossReason?.substring(0, 300) || '',
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
      CarrierRef: formValue.CarrierRef,
      AgentRef: formValue.AgentRef,
      ExportDoDate: formValue.ExportDoDate,
      YardReceivedOn: formValue.YardReceivedOn,
      SOBDate: formValue.SOBDate,
      JobtoSubjob: formValue.JobtoSubjob,
      ImportMasterJobSid: formValue.ImportMasterJobSid || null,
      ExportToImport: formValue.ExportToImport || 'N'
    };

    const formData: any = {
      ...formValue,
      // Use port codes instead of SIDs
      POO: getPortCode(formValue.POO),
      POL: getPortCode(formValue.POL),
      POD: getPortCode(formValue.POD),
      FPD: getPortCode(formValue.FPD),
      CarrierSid: CarrierSid,
      MovementType: formValue.MovementType,

      // Add the others data as a separate object
      others: othersData,
      houseJobCustoms: customsData,
      voyages: [voyageData],

      // Ensure other string fields don't exceed limits
      DestinationAgentAddress: formValue.DestinationAgentAddress?.substring(0, 200) || '',
      POLTerminal: formValue.POLTerminal?.substring(0, 200) || '',
      PODTerminal: formValue.PODTerminal?.substring(0, 200) || '',
      CommodityDescription: formValue.CommodityDescription?.substring(0, 500) || '',
      MarksandNumber: formValue.MarksandNumber?.substring(0, 200) || '',
      Status: formValue.Status === 'Active' ? 'A' : 'S',

      // Your existing arrays
      masterJobConnection: this.connectionResult,
      costRevenueCharges: this.rateResult,
      masterJobContainers: this.formatContainerData(),

      // Format dates
      MasterJobDate: this.formatDate(formValue.MasterJobDate),
      JobStatus: formValue.JobStatus,
      MBLDate: this.formatDate(formValue.MBLDate),
      DGBookingDate: this.formatDate(formValue.DGBookingDate),
      DGApprovedDate: this.formatDate(formValue.DGApprovedDate),
      ETA: this.formatDate(formValue.ETA),
      ETD: this.formatDate(formValue.ETD),
      ATA: this.formatDate(formValue.ATA),
      ATD: this.formatDate(formValue.ATD),
      DestinationATA: this.formatDate(formValue.DestinationATA),
      Haz: formValue.Haz ? 'Y' : 'N',

      createdBy: this.appSettingsService.userSettingSource.value['userEmail'],
      updatedBy : this.appSettingsService.userSettingSource.value['userEmail'],
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.sidebarService.syncMenuIdBeforeSubmit("Master Job") || Number(sessionStorage.getItem('currentMenuId')),
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
    // On create, the backend uses this to also create one linked House Job from the BoL.
    formData['billOfLadingHouseJob'] = this.billOfLadingHouseJob || null;

    // Debug to check the payload
    this.isSaving = true;
    this.spinner.show();


    if (this.isEditMode && this.masterJobSid) {
      formData.MasterJobSid = this.masterJobSid;
      this.operationService.updateMasterJob(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.isSaving = false;
          this.spinner.hide();
          if (response.status) {
            this.toastr.success('Master Job updated successfully');
            this.resetDirtyState();
            this.loadMasterJobData(this.masterJobSid);
            resolve?.(true);
          } else {
            this.showBackendError(response, 'Failed to update Master Job');
            resolve?.(false);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.isSaving = false;
          this.spinner.hide();
          this.showBackendError(error, 'Failed to update Master Job');
          console.error('Error updating master job:', error);
          resolve?.(false);
        }
      });
    } else {
      this.operationService.createMasterJob(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.isSaving = false;
          this.spinner.hide();
          if (response.status) {
            this.toastr.success('Master Job created successfully');
            this.billOfLadingHouseJob = null;
            this.resetDirtyState();

            // ✅ CORRECT PATH: response.data.newMasterJob.MasterJobSid
            const masterJobSid = response.data?.newMasterJob?.MasterJobSid;

            if (masterJobSid) {
              // Navigate to entry page with the new ID
              this.router.navigate(['/operation/master-job/entry', masterJobSid]);

              // OPTIONAL: Clear any cached loading plan data
              this.operationService.clearLoadingPlanData();
            } else {
              this.toastr.warning('Master Job created but ID not returned. Check console for details.');
              this.router.navigate(['/operation/master-job/list']);
            }
            resolve?.(true);
          } else {
            this.showBackendError(response, 'Failed to create Master Job');
            resolve?.(false);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.isSaving = false;
          this.spinner.hide();
          this.showBackendError(error, 'Failed to create Master Job');
          resolve?.(false);
        }
      });
    }
  }

  private getControlLabel(controlName: string): string {
    if (controlName === 'MBLNo') {
      return this.selectedDepartment?.departmentType?.toUpperCase() === 'AIR' ? 'MAWB No' : 'MBL No';
    }

    const controlLabelMap: { [key: string]: string } = {
      DepartmentMasterSid: 'Department',
      MasterJobNumber: 'Master Job Number',
      MasterJobDate: 'Master Job Date',
      FreightPPCC: 'Freight PP/CC',
      MBLDate: 'MBL Date',
      NoofOriginal: 'No Of Original',
      POL: 'POL',
      POD: 'POD',
      Status: 'Status',
      JobStatus: 'Job Status',
      ETA: 'ETA',
      ETD: 'ETD'
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

  private showBackendError(source: any, fallbackMessage: string): void {
    const backendMessage = extractBackendErrorMessage(source, fallbackMessage);

    const normalizedMessage = backendMessage.toLowerCase();
    if (
      normalizedMessage.includes('duplicate') ||
      (normalizedMessage.includes('already exists') && (normalizedMessage.includes('mbl') || normalizedMessage.includes('mawb')))
    ) {
      const mblControl = this.masterJobForm.get('MBLNo');
      if (mblControl) {
        mblControl.enable({ emitEvent: false });
        mblControl.setErrors({ ...(mblControl.errors || {}), duplicate: true });
        mblControl.markAsTouched();
      }
    }

    if (normalizedMessage.includes('container no already exists') || (normalizedMessage.includes('duplicate') && normalizedMessage.includes('container'))) {
      const containerControl = this.containerFormGroup?.get('ContainerNumber');
      if (containerControl) {
        containerControl.enable({ emitEvent: false });
        containerControl.setErrors({ ...(containerControl.errors || {}), duplicate: true });
        containerControl.markAsTouched();
      }
    }

    this.toastr.error(backendMessage);
  }

  private mergeValidationError(controlName: string, errorKey: string): void {
    const control = this.masterJobForm.get(controlName);
    if (!control) {
      return;
    }
    const currentErrors = control.errors || {};
    control.setErrors({ ...currentErrors, [errorKey]: true });
  }

  private clearValidationError(controlName: string, errorKey: string): void {
    const control = this.masterJobForm.get(controlName);
    if (!control?.errors?.[errorKey]) {
      return;
    }
    const { [errorKey]: _removed, ...remainingErrors } = control.errors;
    control.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
  }
  handleCustomsChange(event: any) {
    this.customsDataArray = Array.isArray(event?.dataItems) ? [...event.dataItems] : [];
    this.currentCustomsFormValue = event?.formData || null;
    this.markAsDirty();
  }

  onContainerSubmit(): void {
    if (this.isFormDisabled) {
      this.toastr.warning('Suspended master job is read only.');
      return;
    }
    if (this.isExportToImportCompleted) {
      this.toastr.warning('Export To Import completed. Container data is read only.');
      return;
    }
    if (this.containerFormGroup.valid) {
      const containerData = this.containerFormGroup.value;
      const editingIndex = this.isEditContainer ? this.editingContainerIndex : null;
      if (this.hasDuplicateContainerNumber(containerData.ContainerNumber, editingIndex)) {
        this.setContainerDuplicateError();
        this.toastr.error('Container No already exists');
        return;
      }
      if (this.selectedFCLLCL === 'FCL') {
        const currentContainerCount = this.masterJobContainers.length;
        const totalAllowedContainers = this.getTotalAllowedContainers();

        // For edit mode, check if we're adding a new container (not editing existing)
        const isAddingNewContainer = !this.isEditContainer;

        if (isAddingNewContainer && currentContainerCount >= totalAllowedContainers) {
          // Show warning but allow to proceed
          const warningMsg = totalAllowedContainers === 0
            ? 'No containers are allowed based on attached bookings.'
            : `Booking Container Qty (${totalAllowedContainers}) exceeded. Current count: ${currentContainerCount + 1}`;

          this.toastr.warning(warningMsg, 'Container Limit Warning');
        }
      }

      if (this.isEditContainer && this.editingContainerIndex !== null) {
        // Update existing container - preserve the MasterJobContainerSid
        const containerGroup = this.masterJobContainers.at(this.editingContainerIndex);
        const existingContainerSid = containerGroup.value.MasterJobContainerSid;

        containerGroup.patchValue({
          ...containerData,
          MasterJobContainerSid: existingContainerSid, // Preserve the existing SID
          IsSoc: containerData.IsSoc,
          IsHaz: containerData.IsHaz
        });
      } else {
        // Add new container - MasterJobContainerSid will be null for new containers
        this.addContainer(containerData);
      }

      this.currentContainerModal.close();
      this.markAsDirty();

    } else {
      this.toastr.error('Please fill all required container fields');
      this.containerFormGroup.markAllAsTouched();
    }
  }

  // Helper methods
  getContainerTypeName(ContainerTypeMasterSid: number): string {
    const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
    return containerType ? containerType.ContainerName : '';
  }

  formatContainerData(): any[] {
    return this.masterJobContainers.value.map(container => ({
      ...container,
      IsSoc: container.IsSoc ? 'Y' : 'N',
      IsHaz: container.IsHaz ? 'Y' : 'N',
      MasterJobContainerSid: container.MasterJobContainerSid
    }));
  }

  formatDate(date: any): string | null {
    if (!date) return null;
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0];
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
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
    if (this.hasUnsavedChanges() && !confirm('You have unsaved changes. Are you sure you want to reset?')) {
      return;
    }

    if (this.isEditMode) {
      this.patchFormValues(this.masterJobData);
    }
    else{
        this.masterJobForm.reset({
      BLReleaseType: 'Original',
      NoofOriginal: 3,
      WeightIn: 'Kg(s)',
      Haz: false,
      FreightPPCC: 'Prepaid',
      JobStatus : 'Job Generated'
    });
    this.applyVoyageLock();
    if (!this.isEditMode) {
    this.masterJobForm.get('DepartmentMasterSid')?.enable();
    }

    this.connections.clear();
    this.masterJobContainers.clear();
    this.costRevenueCharges.clear();
    this.containerActivities.clear();

    // Reset vessel search state
    this.headerVesselList = [];
    this.voyageList = [];
    this.lastVesselSearchParams = null;
    }
    this.resetDirtyState();
  }

  onHazChange(): void {
    const hazValue = this.masterJobForm.get('Haz')?.value;

    if (!hazValue) {
      this.masterJobForm.get('DGBookingDate')?.setValue(null);
      this.masterJobForm.get('DGApprovedDate')?.setValue(null);
    }
  }

  costRevenueAccess: string = 'NONE';

  selectTab(tab: string): void {
    if (tab === 'Rate' && this.costRevenueAccess === 'HIDE_BOTH') {
      this.toastr.warning(
        'Cost and Revenue access is hidden for this branch. Contact admin to update CostRevenueAccess in User Master.',
        'Access Restricted'
      );
      return;
    }
    if (tab === 'Follow Up') {
      this.openFollowup();
    }
    this.selectedTab = tab;
  }

  selectTab1(tab1: string): void {
    this.selectedTab1 = tab1;
  }

  openContainerModal(content: any, container?: any, index?: number): void {
    if (this.isFormDisabled) {
      return;
    }

    this.isEditContainer = !!container;
    this.editingContainerIndex = index !== undefined ? index : null;

    if (this.isEditContainer && container) {
      // Patch the form with existing container data
      this.containerFormGroup.patchValue({
        ...container,
        IsSoc: container.IsSoc === 'Y' || container.IsSoc === true,
        IsHaz: container.IsHaz === 'Y' || container.IsHaz === true
      });
    } else {
      // Reset the form for new container
      this.containerFormGroup.reset({
        NoOfPkg: 0,
        GrossWeight: 0,
        NetWeight: 0,
        ChargeableWeight: 0,
        Volume: 0,
        IsSoc: false,
        IsHaz: false
      });
    }
    this.clearControlError(this.containerFormGroup.get('ContainerNumber'), 'duplicate');

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
  // Method to check if container is mapped to any house job products
  isContainerMapped(containerSid: number): boolean {
    if (!containerSid || !this.masterJobData || !this.masterJobData.containers) {
      return false;
    }

    // Find the container by SID
    const container = this.masterJobData.containers.find(
      (c: any) => c.MasterJobContainerSid === containerSid
    );

    // If container has houseJobProduct array with items, it's mapped
    return container &&
      container.houseJobProduct &&
      Array.isArray(container.houseJobProduct) &&
      container.houseJobProduct.length > 0;
  }

  // Alternative: Check by container number
  isContainerMappedByNumber(containerNumber: string): boolean {
    if (!containerNumber || !this.masterJobData || !this.masterJobData.containers) {
      return false;
    }

    const container = this.masterJobData.containers.find(
      (c: any) => c.ContainerNumber === containerNumber
    );

    return container &&
      container.houseJobProduct &&
      Array.isArray(container.houseJobProduct) &&
      container.houseJobProduct.length > 0;
  }

  // Get mapping count for a container
  getContainerMappingCount(containerSid: number): number {
    if (!containerSid || !this.masterJobData || !this.masterJobData.containers) {
      return 0;
    }

    const container = this.masterJobData.containers.find(
      (c: any) => c.MasterJobContainerSid === containerSid
    );

    if (container && container.houseJobProduct && Array.isArray(container.houseJobProduct)) {
      return container.houseJobProduct.length;
    }

    return 0;
  }
  removeContainer(index: number): void {
    if (this.isFormDisabled) {
      this.toastr.warning('Suspended master job is read only.');
      return;
    }
    if (this.isExportToImportCompleted) {
      this.toastr.warning('Export To Import completed. Container data is read only.');
      return;
    }
    const containerControl = this.masterJobContainers.at(index);
    const containerSid = containerControl.value.MasterJobContainerSid;
    const containerNumber = containerControl.value.ContainerNumber;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    if (this.isContainerMapped(containerSid)) {
      const mappingCount = this.getContainerMappingCount(containerSid);
      this.toastr.warning(
        `Cannot delete container ${containerNumber}. It is mapped to ${mappingCount} house job product(s).`,
        'Delete Restricted'
      );
      return;
    }
    if (confirm(`Are you sure you want to delete container ${containerNumber}?`)) {
      if (containerSid && this.isEditMode) {
        this.isDeletingContainer = index;
        this.spinner.show();

        this.operationService.softDeleteMasterJobContainer(containerSid,updatedBy).subscribe({
          next: (response: any) => {
            this.spinner.hide();
            this.isDeletingContainer = null;

            if (response.status || response.success) {
              this.masterJobContainers.removeAt(index);
              this.markAsDirty();
              this.toastr.success(`Container ${containerNumber} deleted successfully`);
            } else {
              this.toastr.error(response.message || 'Failed to delete container');
            }
          },
          error: (error) => {
            this.spinner.hide();
            this.isDeletingContainer = null;
            console.error('Error deleting container:', error);
            this.toastr.error('Failed to delete container');
          }
        });
      } else {
        this.masterJobContainers.removeAt(index);
        this.markAsDirty();
        this.toastr.info(`Container ${containerNumber || 'new container'} removed`);
      }
    }
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
    const cargoItems = this.masterJobContainers.getRawValue().map((container: any) => ({
      CargoType,
      ContainerType: container?.ContainerType || null,
      ContainerTypeName: this.getContainerTypeName(container?.ContainerType),
      GrossWeight: container?.GrossWeight || GrossWeight,
      Volume: container?.Volume || Volume,
      NoofContainers: 1,
      ChargeableWeight: container?.ChargeableWeight || ChargeableWeight,
      ShipmentTerms: null,
    }));
    const containerTypeSid = cargoItems.find((cargo: any) => cargo.ContainerType)?.ContainerType || null;
    // const CustomerMasterSid = this.b['CustomerMasterSid']?.value;
    // const CustomerBranchSid = this.b['CustomerBranchSid']?.value;
    // const BookingHeaderSid = this.BookingHeaderSid || this.bookingData?.BookingHeaderSid || this.b['BookingHeaderSid']?.value;

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      MasterJobNumber,
      ParentSid: this.masterJobSid,
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
      ContainerType: containerTypeSid,
      CargoType,
      GrossWeight,
      NetWeight,
      Volume,
      NoofContainers,
      ChargeableWeight,
      cargoItems,
      countryOfCompany: this.countryOfCompany
    }
  }

  // Add connection change handler
  handleConnectionChange(allConnections: any[]) {

    if (allConnections && allConnections.length >= 0) {
      this.connectionResult = [...allConnections];
      this.markAsDirty();
    }
  }

  syncFormValueWithRateComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const MasterJobNumber = this.masterJobForm.get('MasterJobNumber')?.value;
    const MBLNo = this.masterJobForm.get('MBLNo')?.getRawValue() || this.masterJobData?.MBLNo;
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
    const cargoItems = this.masterJobContainers.getRawValue().map((container: any) => ({
      CargoType,
      ContainerType: container?.ContainerType || null,
      ContainerTypeName: this.getContainerTypeName(container?.ContainerType),
      GrossWeight: container?.GrossWeight || GrossWeight,
      Volume: container?.Volume || Volume,
      NoofContainers: 1,
      ChargeableWeight: container?.ChargeableWeight || ChargeableWeight,
      ShipmentTerms: null,
    }));
    const containerTypeSid = cargoItems.find((cargo: any) => cargo.ContainerType)?.ContainerType || null;

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
      PORCode: this.getPortCode(PORSid) || null,
      POLCode: this.getPortCode(POLSid) || null,
      PODCode: this.getPortCode(PODSid) || null,
      FPODCode: this.getPortCode(FPODSid) || null,
      EffectiveDate,
      ExpiredDate,
      ContainerType: containerTypeSid,
      CargoType,
      GrossWeight,
      NetWeight,
      Volume,
      NoofContainers,
      ChargeableWeight,
      cargoItems,
      countryOfCompany: this.countryOfCompany
    }
  }

  handleRateChange(allRates: any[]) {
    if (Array.isArray(allRates)) {
      this.rateResult = [...allRates];
      this.markAsDirty();
    }
  }

  // Add sync method for Edoc
  syncFormValueWithEdocComponent() {


    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    const MasterJobNumber = this.masterJobForm.get('MasterJobNumber')?.value;


    this.currentEdocFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      DocumentSid: this.masterJobSid || 0,
      MasterJobNumber: MasterJobNumber,
    };



    const data: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.masterJobSid,
    };


    // Check if any values are null/undefined
    const missingFields = [];
    if (!data.CompanyMasterSid) missingFields.push('CompanyMasterSid');
    if (!data.BranchMasterSid) missingFields.push('BranchMasterSid');
    if (!data.MenuMasterSid) missingFields.push('MenuMasterSid');
    if (!data.DocumentSid && data.DocumentSid !== 0) missingFields.push('DocumentSid');

    if (missingFields.length > 0) {
      console.warn('⚠️  Missing fields:', missingFields);
    } else {

    }


    this.commonService.documentData.set(data);

    // Verify the data was set
    const currentData = this.commonService.documentData();



  }

  // Add handler for Edoc data changes
  handleEdocChange(event: any) {
    this.edocData = event.dataItems || [];
    this.currentEdocFormValue = event.formData;
    this.markAsDirty();

  }

  // Add sync method for Email component
  syncFormValueWithEmailComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;

    this.currentEmailFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      DocumentSid: this.masterJobSid || 0,
      MasterJobNumber: this.masterJobForm.get('MasterJobNumber')?.value,
      POL: this.masterJobForm.get('POL')?.value,
      POD: this.masterJobForm.get('POD')?.value,
      VesselName: this.masterJobForm.get('VesselName')?.value,
      VoyageNo: this.masterJobForm.get('VoyageNo')?.value
    };
  }

  // Add handler for Email data changes
  handleEmailChange(event: any) {
    this.emailData = event.dataItems || [];
    this.currentEmailFormValue = event.formData || null;
    this.markAsDirty();

  }

  syncFormValueWithContainerActivityComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;

    this.currentContainerActivityFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      JobMasterSid: this.masterJobSid || 0, // Use JobMasterSid to match Prisma model
      MasterJobNumber: this.masterJobForm.get('MasterJobNumber')?.value,
      // Pass the container list so the container activity component can use it
      masterJobContainers: this.masterJobContainers.value || []
    };
  }

  // Add this handler for container activity data changes
  handleContainerActivityChange(activities: any[]) {


    // Ensure we have an array and properly store it
    this.containerActivityData = Array.isArray(activities) ? [...activities] : [];

    // Update the form array as well to keep it in sync
    const containerActivitiesFormArray = this.containerActivities;
    containerActivitiesFormArray.clear();

    this.containerActivityData.forEach(activity => {
      const activityGroup = this.fb.group({
        ContainerActivitySid: [activity.ContainerActivitySid || null],
        ContainerNumber: [activity.ContainerNumber || '', Validators.required],
        ContainerType: [activity.ContainerType || null],
        ActivityCode: [activity.ActivityCode || '', Validators.required],
        ActivityName: [activity.ActivityName || ''],
        ActivityDate: [activity.ActivityDate ? new Date(activity.ActivityDate) : new Date(), Validators.required],
        ActivityFrom: [activity.ActivityFrom || ''],
        ActivityTo: [activity.ActivityTo || ''],
        Remarks: [activity.Remarks || '']
      });
      containerActivitiesFormArray.push(activityGroup);
    });


    this.markAsDirty();
  }

  // Customs component sync method
  syncFormValueWithCustomsComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const CreatedBy = this.userData?.UserEmail || '';

    this.currentCustomsFormValue = {
      CompanyMasterSid,
      MasterJobSid: this.masterJobSid || 0,
      CreatedBy,
      UpdatedBy: CreatedBy,
    };
  }

  // Load customs data for master job
  loadCustomsData(onLoaded?: () => void) {
    if (!this.masterJobSid) return;

    this.operationService.getCustomsByMasterJobSid(this.masterJobSid).subscribe({
      next: (data: any[]) => {
        this.customsDataArray = data || [];
        this.syncFormValueWithCustomsComponent();
        onLoaded?.();
      },
      error: (error) => {
        console.error('Error loading customs data:', error);
        this.customsDataArray = [];
        onLoaded?.();
      }
    });
  }


  openAuditLogs() {
    if (!this.masterJobSid) return;
    const modalRef = this.modalService.open(AuditLogComponent,{
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'MasterJob Logs';
    modalRef.componentInstance.tableName = 'MasterJob';
    modalRef.componentInstance.recordId = this.masterJobSid.toString();
    modalRef.componentInstance.screenName = 'MasterJob';
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

  sendManualMail(): void {
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: this.MenuMasterSid,
      action: 'UPDATE',
      context: {
        userName: this.userData?.userName,
        toEmail: ''
      }
    });
    const payload = {
        tableName: 'MasterJob',
        recordId: String(this.masterJobData?.MasterJobSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Email Send'
        },
        newVal: {
          Email: 'Email Send'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
  }

  navigateBack(): void {
    this.router.navigate(['/operation/master-job/list']);
  }

  toggleMinimizeMaximize() {
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

  // Shipment Related Works

  createShipmentGroup(data?: any): FormGroup {
    const shipmentForm = this.fb.group({
      HouseJobSid: [data?.HouseJobSid || null],
      BookingHeaderSid: [data?.BookingHeaderSid || null],
      BookingNo: [data?.BookingNo || '', Validators.required],
      TranshipmentBookingSid: [data?.TranshipmentBookingSid || null],
      TranshipmentBookingNo: [this.getTranshipmentBookingNo(data)],
      BookingDateTime: [data?.BookingDateTime ? new Date(data?.BookingDateTime) : null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null],
      HBLNo: [data?.HBLNo || null],
      CustomerMasterSid: [data?.CustomerMasterSid || null],
      CustomerName: [data?.CustomerName || ''],
      CustomerAddress: [data?.CustomerAddress || ''],
      ShipperName: [data?.ShipperName || ''],
      ShipperAddress: [data?.ShipperAddress || ''],
      ConsigneeName: [data?.ConsigneeName || ''],
      ConsigneeAddress: [data?.ConsigneeAddress || ''],
      DestinationAgent: [data?.DestinationAgent || ''],
      MBLDate: [data?.MBLDate || null],
      MasterJobSid: [data?.MasterJobSid || null],
      POL: [data?.POL || null],
      POD: [data?.POD || null],
      VesselName: [data?.VesselName || ''],
      VoyageNo: [data?.VoyageNo || ''],
      ETD: [data?.ETD || null],
      ETA: [data?.ETA || null],
      FreightTerms: [data?.FreightTerms || ''],
      JobType: [data?.JobType || ''],
      HouseStatus: [data?.HouseStatus || '']
    })
    return shipmentForm;
  }

  updateAttachedBookingsPagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.slicedAttachedBookings = this.attachedBookings.getRawValue().slice(start, end);

  }

  getDepartmentName(DepartmentMasterSid: number) {
    if (!DepartmentMasterSid || this.departments.length === 0) return '';
    const department = this.departments.find(dep => dep.DepartmentMasterSid === DepartmentMasterSid);
    return department ? department.departmentName : '';
  }

  getAgentName(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(agent => agent.CustomerMasterSid === AgentSid);
    return agent ? agent.CustomerName : '';
  }
  getYardName(yardSid: number): string {
    if (!yardSid || this.yardList.length === 0) return '';
    const yard = this.yardList.find(yard => yard.CustomerMasterSid === yardSid);
    return yard ? yard.CustomerName : '';
  }


  bookingItems: any

  //2
  patchShipments(shipments: any[]) {
    this.clearInvoiceStatusCache();
    this.bookingItems = shipments
    this.attachedBookings.clear();

    shipments.forEach(shipment => {
      const formGrp = this.createShipmentGroup(shipment)

      this.attachedBookings.push(formGrp);
    });
    this.totalLengthOfAttachedBookings = this.attachedBookings.length;

    this.updateAttachedBookingsPagination();
    this.getTranshipmentList();
  }


  transhipmentHouseJobSids: number[] = [];
  getTranshipmentList() {
    // ✅ Reset first
    this.isTranshipment = false;
    this.transhipmentHouseJobSids = [];



    this.bookingItems.forEach(item => {
      const departmentName = this.getDepartmentName(item.DepartmentMasterSid);


      // Make comparison case-insensitive and trim whitespace
      const normalizedDepartment = departmentName?.trim().toLowerCase();
      const normalizedJobType = item.JobType?.trim().toLowerCase();

      if (normalizedDepartment === 'lcl import' && normalizedJobType === 'transhipment') {
        this.isTranshipment = true;
        this.transhipmentHouseJobSids.push(item.HouseJobSid);

      }
    });


    if (this.transhipmentHouseJobSids.length) {
      this.loadAllHouses();
    }
  }


  loadedHouses: any[] = [];

  loadAllHouses() {
    this.loadedHouses = [];

    this.transhipmentHouseJobSids.forEach(id => {
      const payload = {
        HouseJobSid: id,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid
      };

      this.operationService.getHouseJobById(payload).subscribe((resp: any) => {
        if (resp.status && resp.data) {
          if (resp && resp.status === false) {
    this.appSettingService.showError(
      resp.message || 'Access denied.'
    );
    return;
  }
          // Add deduplication check to prevent duplicate house jobs
          const alreadyExists = this.loadedHouses.some(
            house => house.HouseJobSid === resp.data.HouseJobSid
          );
          if (!alreadyExists) {
            this.loadedHouses.push(resp.data);
          }
        }
      });
    });
  }

  getTranshipmentBookingNo(data: any): string {
    return data?.transhipmentBooking?.BookingNo
      || data?.TranshipmentBookingNo
      || data?.transhipmentBookingNo
      || data?.TranshipmentBooking?.BookingNo
      || '';
  }

  hasPendingTranshipmentBooking(): boolean {
    return this.loadedHouses.some((house: any) =>
      this.isLclImportTranshipmentHouse(house) && !house?.TranshipmentBookingSid
    );
  }

  private isLclImportTranshipmentHouse(house: any): boolean {
    const departmentName = this.getDepartmentName(house?.DepartmentMasterSid)?.trim().toLowerCase();
    const jobType = house?.JobType?.trim().toLowerCase();
    return departmentName === 'lcl import' && jobType === 'transhipment';
  }


  detachBooking(shipmentIndex: number, booking: any) {
    if (this.isExportToImportCompleted) {
      this.toastr.warning('Export To Import completed. House cargo data is read only.');
      return;
    }
    const realIndex = ((this.page - 1) * this.pageSize) + shipmentIndex;

    const HouseJobSid = booking.HouseJobSid;
    const userEmail = this.appSettingsService.userSettingSource.value['userEmail'];

    if (HouseJobSid) {
      this.operationService.detachBooking(HouseJobSid,userEmail).subscribe
        ({
          next: (resp: any) => {
           if (resp.status) {
          // Remove the booking from the form array immediately
          this.attachedBookings.removeAt(realIndex);
          this.totalLengthOfAttachedBookings = this.attachedBookings.length;
          this.updateAttachedBookingsPagination();
          
          // Reload master job data once to refresh all related data
          this.loadMasterJobData(this.masterJobSid);
          
          this.appSettingsService.showSuccess('Booking detached successfully');
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
    }
  }

  openAttachModal() {
    if (this.isJobClosed) {
      this.appSettingsService.showWarning('Job is closed. Attach Booking is not allowed.');
      return;
    }

    const requiredFields = ['DepartmentMasterSid', 'POL', 'POD'];
    if (!this.hasEveryRequiredFieldsFilled(requiredFields, this.masterJobForm)) {
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

    const modalRef = this.modalService.open(LoadingPlanEntryComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
      windowClass: 'custom-modal-size'
    });
    modalRef.componentInstance.screenName = 'Master Job';
    const value = this.masterJobForm.getRawValue();
    modalRef.componentInstance.masterJobFormValue = {
      DepartmentMasterSid: value.DepartmentMasterSid,
      POL: this.getPortCode(value.POL),
      POD: this.getPortCode(value.POD),
      hasValue: true
    }
    modalRef.componentInstance.exceptionalBookings = exceptionalBookings;
    modalRef.componentInstance.closeModal.subscribe((data: boolean) => {
      if (data) {
        this.modalService.dismissAll();
      }
    });
    //3
    modalRef.componentInstance.onSubmit.subscribe((data: any[]) => {
      data.forEach(booking => {
        const formGroup = this.createShipmentGroup(booking);
        this.attachedBookings.push(formGroup);
      });
      this.totalLengthOfAttachedBookings = this.attachedBookings.length;
      this.updateAttachedBookingsPagination();
      this.markAsDirty();
      this.modalService.dismissAll();
      this.onSubmit();
    });
  }

  hasEveryRequiredFieldsFilled(requiredFields: string[], group: FormGroup): boolean {
    const formValue = group.getRawValue();
    return requiredFields.every(field => formValue[field] !== null && formValue[field] !== undefined );
  }

  getPortCode(portSid: number): string {
    if (!portSid || this.portList.length === 0) return '';
    const port = this.portList.find(p => p.PortMasterSid === portSid);
    return port ? port.PortCode : '';
  }

  getMBLDate() {
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

    this.router.navigate(['/operation/house-job/entry', shipment.HouseJobSid]);
  }




  // reportPreAlertModel(content: TemplateRef<any>) {
  //     this.modalService.open(content, {
  //       size: 'xl',
  //       scrollable: true,
  //     })
  //     modalRef.componentInstance.masterJobData=this.masterJobData; 
  //     modalRef.componentInstance.containerTypeList=this.containerTypeList;
  //     modalRef.componentInstance.masterJobContainers=this.masterJobData.containers || [];
  //     modalRef.componentInstance.packageTypeList=this.packageTypeList;
  //     modalRef.componentInstance.agentList=this.agentList;
  // }

  //   reportcargomanifest() {
  //    const modalRef=this.modalService.open(CargoManifestComponent, {
  //       size: 'xl',
  //       scrollable: true,
  //     });
  //     modalRef.componentInstance.masterJobData=this.masterJobData; 
  //     modalRef.componentInstance.containerTypeList=this.containerTypeList;
  //     modalRef.componentInstance.masterJobContainers=this.masterJobData.containers || [];
  //     modalRef.componentInstance.packageTypeList=this.packageTypeList;
  //     modalRef.componentInstance.agentList=this.agentList;

  //   }


  //    reportreleaseLetter() {
  //     const modalRef = this.modalService.open(ReleaseLetterComponent, {
  //       size: 'xl',
  //       scrollable: true,
  //     });
  //     modalRef.componentInstance.masterJobData= this.masterJobData;
  //     modalRef.componentInstance.cfsList=this.cfsList || [];
  //     modalRef.componentInstance.masterJobContainers = this.masterJobData?.containers || [];
  //     modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
  //   }


  //    reportreleaseOrder() {
  //    const modalRef = this.modalService.open(ReleaseOrderComponent, {
  //       size: 'xl',
  //       scrollable: true,
  //     });
  //     modalRef.componentInstance.masterJobData=this.masterJobData;
  //     modalRef.componentInstance.cfsList=this.cfsList || [];
  //     modalRef.componentInstance.masterJobContainers = this.masterJobData?.containers || [];
  //     modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
  //     modalRef.componentInstance.containerTypeList=this.containerTypeList;
  //   }

  //    reportjobCard(content: TemplateRef<any>) {
  //     this.modalService.open(content, {
  //       size: 'xl',
  //       scrollable: true,
  //     });
  //   }

  // /**
  //  * Open report modal using the generic report system
  //  * @param reportType Report type ID (e.g., 'master-job-pre-alert')
  //  */
  // openReport(reportType: string): void {
  //   // const masterJobSid = this.masterJobForm.get('MasterJobSid')?.value;
  //   const masterJobSid = this.masterJobSid;


  //   if (!masterJobSid) {
  //     this.toastr.error('Please save the master job first before generating reports', 'Error');
  //     return;
  //   }

  //   this.reportService.openReportModal(reportType, masterJobSid);
  // }
  getCfsValue(cfsSid: number): string {
    if (!cfsSid || this.cfsList.length === 0) return '';
    // Look for CFS by CustomerMasterSid instead of CfsMasterSid
    const cfs = this.cfsList.find(c => c.CustomerMasterSid === cfsSid);
    return cfs ? cfs.CustomerName : '';
  }
  get totalNoOfPkg(): number {
    return this.masterJobContainers.value.reduce((sum, c) => {
      const value = Number(c.NoOfPkg) || 0;
      return sum + value;
    }, 0);
  }

  get totalGrossWeight(): number {
    return this.masterJobContainers.value.reduce((sum, c) => {
      const value = Number(c.GrossWeight) || 0;
      return sum + value;
    }, 0);
  }

  get totalVolume(): number {
    return this.masterJobContainers.value.reduce((sum, c) => {
      const value = Number(c.Volume) || 0;
      return sum + value;
    }, 0);
  }


  get totalNetWeight(): number {
    return this.masterJobContainers.value.reduce((sum, c) => {
      const value = Number(c.NetWeight) || 0;
      return sum + value;
    }, 0);
  }


  get totalChargeableWeight(): number {
    return this.masterJobContainers.value.reduce((sum, c) => {
      const value = Number(c.ChargeableWeight) || 0;
      return sum + value;
    }, 0);
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

  // Charge 

  getChargeName(ChargeMasterSid: number): string {
    if (!ChargeMasterSid || !this.chargeList || this.chargeList.length === 0) {
      return 'N/A';
    }
    const charge = this.chargeList.find(c => c.ChargeMasterSid === ChargeMasterSid);
    return charge ? (charge.chargeCode || charge.ChargeCode || 'N/A') : 'N/A';
  }
  // getChargeName(ChargeMasterSid) {

  //   if (!ChargeMasterSid || this.chargeList.length === 0) {
  //     return '';
  //   }
  //   return (this.chargeList.find(charge => charge.ChargeMasterSid === ChargeMasterSid)?.chargeCode);
  // }

  // Add this method to your component
  getCurrencyName(CurrencyMasterSid: number): string {


    if (!CurrencyMasterSid || !this.currencyList || this.currencyList.length === 0) {
      return 'N/A';
    }

    const currency = this.currencyList.find(c => c.CurrencyMasterSid === CurrencyMasterSid);
    return currency ? (currency.currencyCode || currency.CurrencyCode || 'N/A') : 'N/A';
  }


  getAgentBranchName(AgentSid: number): string {


    if (!AgentSid || !this.agentList || this.agentList.length === 0) {
      return 'N/A';
    }

    const agent = this.agentList.find(a => a.CustomerMasterSid === AgentSid);

    if (agent) {
      return agent.CustomerName || agent.customerName || 'N/A';
    }

    return 'N/A';
  }

  private isSwitchBLPrintEnabled(houseJob: any): boolean {
    const switchBL =
      houseJob?.Others?.[0]?.SwitchBL ??
      houseJob?.Others?.[0]?.BacktoBack ??
      houseJob?.HouseJobProxy?.[0]?.SwitchBL ??
      houseJob?.houseJobProxy?.[0]?.SwitchBL ??
      houseJob?.Proxy?.[0]?.SwitchBL ??
      houseJob?.SwitchBL;

    return String(switchBL || '').toUpperCase() === 'Y' || switchBL === true;
  }

  private getPrintableValue(primaryValue: any, proxyValue: any, useProxy: boolean): string {
    const hasProxyValue =
      proxyValue !== null &&
      proxyValue !== undefined &&
      String(proxyValue).trim() !== '';

    const selectedValue = useProxy
      ? (hasProxyValue ? proxyValue : primaryValue)
      : primaryValue;

    return selectedValue === null || selectedValue === undefined
      ? ''
      : String(selectedValue).trim();
  }

  private normalizeHouseJobForPrint(houseJob: any): any {
    const proxy = houseJob?.HouseJobProxy?.[0] || houseJob?.houseJobProxy?.[0] || houseJob?.Proxy?.[0] || null;
    const useProxy = this.isSwitchBLPrintEnabled(houseJob);
    const printableHouseJob = {
      ...houseJob,
      AgentName: this.getPrintableValue(houseJob?.AgentName, proxy?.AgentName, useProxy),
      AgentAddress: this.getPrintableValue(houseJob?.AgentAddress, proxy?.AgentAddress, useProxy),
      ShipperName: this.getPrintableValue(houseJob?.ShipperName, proxy?.ShipperName, useProxy),
      ShipperAddress: this.getPrintableValue(houseJob?.ShipperAddress, proxy?.ShipperAddress, useProxy),
      ConsigneeName: this.getPrintableValue(houseJob?.ConsigneeName, proxy?.ConsigneeName, useProxy),
      ConsigneeAddress: this.getPrintableValue(houseJob?.ConsigneeAddress, proxy?.ConsigneeAddress, useProxy),
      VesselName: this.getPrintableValue(houseJob?.VesselName, proxy?.VesselName, useProxy),
      VoyageNo: this.getPrintableValue(houseJob?.VoyageNo, proxy?.VoyageNo, useProxy),
      POO: this.getPrintableValue(houseJob?.POO, proxy?.POO, useProxy),
      POL: this.getPrintableValue(houseJob?.POL, proxy?.POL, useProxy),
      POD: this.getPrintableValue(houseJob?.POD, proxy?.POD, useProxy),
      FPD: this.getPrintableValue(houseJob?.FPD, proxy?.FPD, useProxy),
      CarrierName: this.getPrintableValue(houseJob?.CarrierName, proxy?.CarrierName, useProxy),
    };

    if (proxy && useProxy) {
      const printableProxy = { ...proxy };
      [
        'AgentName',
        'AgentAddress',
        'ShipperName',
        'ShipperAddress',
        'ConsigneeName',
        'ConsigneeAddress',
        'VesselName',
        'VoyageNo',
        'POO',
        'POL',
        'POD',
        'FPD',
        'CarrierName',
      ].forEach((fieldName) => {
        printableProxy[fieldName] = printableHouseJob[fieldName];
      });

      if (Array.isArray(houseJob?.HouseJobProxy) && houseJob.HouseJobProxy.length) {
        printableHouseJob.HouseJobProxy = [printableProxy, ...houseJob.HouseJobProxy.slice(1)];
      }

      if (Array.isArray(houseJob?.houseJobProxy) && houseJob.houseJobProxy.length) {
        printableHouseJob.houseJobProxy = [printableProxy, ...houseJob.houseJobProxy.slice(1)];
      }

      if (Array.isArray(houseJob?.Proxy) && houseJob.Proxy.length) {
        printableHouseJob.Proxy = [printableProxy, ...houseJob.Proxy.slice(1)];
      }
    }

    return printableHouseJob;
  }

  private getPrintableMasterJobData(): any {
    const printableMasterJobData = structuredClone(this.masterJobData || {});
    printableMasterJobData.houseJob = (printableMasterJobData.houseJob || []).map((houseJob: any) =>
      this.normalizeHouseJobForPrint(houseJob)
    );
    return printableMasterJobData;
  }

  reportPreAlertModel() {
    if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
      // Check if containers exist and have ContainerNumber
      const hasValidContainers = this.masterJobData?.containers?.some(
        (container: any) => container.ContainerNumber && container.ContainerNumber.trim() !== ''
      );

      if (!hasValidContainers) {
        this.appSettingService.showWarning(
          'ContainerNo is required.'
        );
        return;
      }

      const hasValidVessale = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VesselName && voyage.VesselName.trim() !== ''
      );
      if (!hasValidVessale) {
        this.appSettingService.showWarning(
          'Vessel Name is required.'
        );
        return;
      }
      const hasValidVoyage = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VoyageNo && voyage.VoyageNo.trim() !== ''
      );
      if (!hasValidVoyage) {
        this.appSettingService.showWarning(
          'Voyage No is required.'
        );
        return;
      }
    }

    const modalRef = this.modalService.open(PreAlertComponent, {
      windowClass:"print-landscape",
      scrollable: true,
      
    })
    modalRef.componentInstance.masterJobData = this.getPrintableMasterJobData();
    modalRef.componentInstance.containerTypeList = this.containerTypeList;
    modalRef.componentInstance.masterJobContainers = this.masterJobData.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
    modalRef.componentInstance.agentList = this.agentList;
    modalRef.componentInstance.yardList = this.yardList;
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL;
    modalRef.componentInstance.portList = this.portList || [];
    modalRef.componentInstance.currentMenuId = this.currentMenuId || this.MenuMasterSid || Number(sessionStorage.getItem('currentMenuId'));
    this.initializeMilestoneContentForPreAlert(modalRef);
  }

  private initializeMilestoneContentForPreAlert(modalRef: any): void {
    const department = this.selectedDepartment || this.departments.find(
      (dep) => dep.DepartmentMasterSid === this.masterJobForm.get('DepartmentMasterSid')?.value,
    );
    const validDepartment = department?.ExportImport === 'Export';
    const masterJobSid = this.masterJobData?.MasterJobSid || this.masterJobSid;

    modalRef.componentInstance.autoInsertMilestone = !!(validDepartment && masterJobSid);

    const milestonePayload: InsertMilestoneByMasterJobPayload = {
      MasterJobSid: Number(masterJobSid),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MilestoneCode: 'PREALERT',
      MilestoneDate: getDefaultTodayDate(),
      createdBy: this.userData?.userEmail,
      Remarks: `Pre Alert has been sent on ${(new Date().toISOString()).split('T')[0]}`,
    };

    modalRef.componentInstance.milestonePayload = milestonePayload;

    modalRef.componentInstance.reloadMilestone.subscribe(() => {
      if (this.masterJobSid) {
        this.loadMasterJobData(this.masterJobSid);
      }
    });
  }

  reportcargomanifest() {
    if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
      // Check if containers exist and have ContainerNumber
      const hasValidContainers = this.masterJobData?.containers?.some(
        (container: any) => container.ContainerNumber && container.ContainerNumber.trim() !== ''
      );


      if (!hasValidContainers) {
        this.appSettingService.showWarning(
          'ContainerNo is required.'
        );
        return;
      }
      const hasValidVessale = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VesselName && voyage.VesselName.trim() !== ''
      );
      if (!hasValidVessale) {
        this.appSettingService.showWarning(
          'Vessel Name is required.'
        );
        return;
      }
      const hasValidVoyage = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VoyageNo && voyage.VoyageNo.trim() !== ''
      );
      if (!hasValidVoyage) {
        this.appSettingService.showWarning(
          'Voyage No is required.'
        );
        return;
      }

    }
    const modalRef = this.modalService.open(CargoManifestComponent, {
      windowClass:"print-landscape",
      // size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.getPrintableMasterJobData();
    modalRef.componentInstance.containerTypeList = this.containerTypeList;
    modalRef.componentInstance.masterJobContainers = this.masterJobData.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
    modalRef.componentInstance.agentList = this.agentList;
    modalRef.componentInstance.yardList = this.yardList;
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL;
    modalRef.componentInstance.portList = this.portList || [];
    modalRef.componentInstance.currentMenuId = this.currentMenuId || this.MenuMasterSid || Number(sessionStorage.getItem('currentMenuId'));
    this.initializeMilestoneContentForCargoManifest(modalRef);
  }

  private initializeMilestoneContentForCargoManifest(modalRef: any): void {
    const department = this.selectedDepartment || this.departments.find(
      (dep) => dep.DepartmentMasterSid === this.masterJobForm.get('DepartmentMasterSid')?.value,
    );
    const validDepartment = department?.ExportImport === 'Export';
    const masterJobSid = this.masterJobData?.MasterJobSid || this.masterJobSid;

    modalRef.componentInstance.autoInsertMilestone = !!(validDepartment && masterJobSid);

    const milestonePayload: InsertMilestoneByMasterJobPayload = {
      MasterJobSid: Number(masterJobSid),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MilestoneCode: 'CARGOMANIFEST',
      MilestoneDate: getDefaultTodayDate(),
      createdBy: this.userData?.userEmail,
      Remarks: `Cargo Manifest has been generated on ${(new Date().toISOString()).split('T')[0]}`,
    };

    modalRef.componentInstance.milestonePayload = milestonePayload;

    modalRef.componentInstance.reloadMilestone.subscribe(() => {
      if (this.masterJobSid) {
        this.loadMasterJobData(this.masterJobSid);
      }
    });
  }


  reportreleaseLetter() {
    const modalRef = this.modalService.open(ReleaseLetterComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.cfsList = this.cfsList || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobData?.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.agentList = this.agentList;
    modalRef.componentInstance.yardList = this.yardList;
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL;
  }

  // Loading Plan

   reportLoadingPlan() {
     if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
      // Check if containers exist and have ContainerNumber
     const hasValidVessale = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VesselName && voyage.VesselName.trim() !== ''
      );
      if (!hasValidVessale) {
        this.appSettingService.showWarning(
          'Vessel Name is required.'
        );
        return;
      }
      const hasValidVoyage = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VoyageNo && voyage.VoyageNo.trim() !== ''
      );
      if (!hasValidVoyage) {
        this.appSettingService.showWarning(
          'Voyage No is required.'
        );
        return;
      }
    }
    const modalRef = this.modalService.open(LoadingPlanMasterComponent, {
      // size: 'xl',
      windowClass:"print-landscape",
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.cfsList = this.cfsList || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobData?.containers || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.portList = this.portList || [];
    modalRef.componentInstance.currentMenuId = this.currentMenuId || this.MenuMasterSid || Number(sessionStorage.getItem('currentMenuId'));
  }

  reportCFSoutturn() {
    if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
      // Check if containers exist and have ContainerNumber
      const hasValidContainers = this.masterJobData?.containers?.some(
        (container: any) => container.ContainerNumber && container.ContainerNumber.trim() !== ''
      );


      if (!hasValidContainers) {
        this.appSettingService.showWarning(
          'ContainerNo is required.'
        );
        return;
      }
    }
    const modalRef = this.modalService.open(CfsOutturnComponent, {
     windowClass:"print-landscape",
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.cfsList = this.cfsList || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobData?.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.agentList = this.agentList || [];
    modalRef.componentInstance.yardList = this.yardList || [];
    modalRef.componentInstance.currentMenuId = this.currentMenuId || this.MenuMasterSid || Number(sessionStorage.getItem('currentMenuId'));
  }

  reportreleaseOrder() {
    const modalRef = this.modalService.open(ReleaseOrderComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.cfsList = this.cfsList || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobData?.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList;

  }

  reportjobCard() {
    const modalRef = this.modalService.open(JobCardComponent, {
      windowClass:'print-landscape',
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
    modalRef.componentInstance.currentMenuId = this.currentMenuId || this.MenuMasterSid || Number(sessionStorage.getItem('currentMenuId'));
  }

  reportPackingList() {
    const modalRef = this.modalService.open(PackingListComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers.getRawValue() || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
    modalRef.componentInstance.TandCList = this.TandCList || [];
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || 'LCL';

  }

  // sailing confirmation

  reportSailingConfirmation() {
    const modalRef = this.modalService.open(SailingConfirmationComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.containerTypeList = this.containerTypeList;
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers.getRawValue() || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
  }



  async reportMBLBill(type: 'MBL' | 'MBLDraft') {
    if (!(await this.printAuthService.ensureAuthorizedToPrint({
      menuMasterSid: Number(this.MenuMasterSid || sessionStorage.getItem('currentMenuId')),
      documentSid: this.masterJobData?.MasterJobSid || this.masterJobSid,
      companyMasterSid: this.currentCompany?.CompanyMasterSid,
      branchMasterSid: this.currentBranch?.BranchMasterSid,
      departmentMasterSid: this.masterJobData?.DepartmentMasterSid ?? this.masterJobForm.get('DepartmentMasterSid')?.value ?? null,
      documentLabel: 'MBL'
    }))) {
      return;
    }
    if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
      // Check if containers exist and have ContainerNumber
      const hasValidContainers = this.masterJobData?.containers?.some(
        (container: any) => container.ContainerNumber && container.ContainerNumber.trim() !== ''
      );


      if (!hasValidContainers) {
        this.appSettingService.showWarning(
          'ContainerNo is required.'
        );
        return;
      }
      const hasValidVessale = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VesselName && voyage.VesselName.trim() !== ''
      );
      if (!hasValidVessale) {
        this.appSettingService.showWarning(
          'Vessel Name is required.'
        );
        return;
      }
      const hasValidVoyage = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VoyageNo && voyage.VoyageNo.trim() !== ''
      );
      if (!hasValidVoyage) {
        this.appSettingService.showWarning(
          'Voyage No is required.'
        );
        return;
      }
    }
    this.selectedReport = type;
    const modalRef = this.modalService.open(MblComponent, {
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
    modalRef.componentInstance.agentList = this.agentList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
    modalRef.componentInstance.selectedReport = type;
    modalRef.componentInstance.currentMenuId = this.currentMenuId || this.MenuMasterSid || Number(sessionStorage.getItem('currentMenuId'));

  }


      reportproofofDelivery() {
      const modalRef = this.modalService.open(ProofOfDeliveryMasterPrintComponent, {
        size: 'xl',
        scrollable: true,
      });
      modalRef.componentInstance.masterJobData = this.masterJobData;
      modalRef.componentInstance.housejobData = this.housejobData || [];
      modalRef.componentInstance.masterJobContainers = this.masterJobContainers.getRawValue() || [];
      // modalRef.componentInstance.masterJobContainers = this.housejobData?.containers || [];
      modalRef.componentInstance.packageTypeList = this.packageTypeList;
      modalRef.componentInstance.TandCList = this.TandCList || [];
      modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || 'LCL';
      modalRef.componentInstance.portList = this.portList || [];
      modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    }

  reportHBLBill() {
    if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
      // Check if containers exist and have ContainerNumber
      const hasValidContainers = this.masterJobData?.containers?.some(
        (container: any) => container.ContainerNumber && container.ContainerNumber.trim() !== ''
      );


      if (!hasValidContainers) {
        this.appSettingService.showWarning(
          'ContainerNo is required.'
        );
        return;
      }
      const hasValidVessale = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VesselName && voyage.VesselName.trim() !== ''
      );
      if (!hasValidVessale) {
        this.appSettingService.showWarning(
          'Vessel Name is required.'
        );
        return;
      }
      const hasValidVoyage = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VoyageNo && voyage.VoyageNo.trim() !== ''
      );
      if (!hasValidVoyage) {
        this.appSettingService.showWarning(
          'Voyage No is required.'
        );
        return;
      }
    }

    const modalRef = this.modalService.open(AllHBLDraftComponent, {
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.masterJobSid = this.masterJobSid
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
    modalRef.componentInstance.agentList = this.agentList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
    modalRef.componentInstance.currentMenuId = this.currentMenuId || this.MenuMasterSid || Number(sessionStorage.getItem('currentMenuId'));


  }


  reportHBL() {
    if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
      // Check if containers exist and have ContainerNumber
      const hasValidContainers = this.masterJobData?.containers?.some(
        (container: any) => container.ContainerNumber && container.ContainerNumber.trim() !== ''
      );


      if (!hasValidContainers) {
        this.appSettingService.showWarning(
          'ContainerNo is required.'
        );
        return;
      }
      const hasValidVessale = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VesselName && voyage.VesselName.trim() !== ''
      );
      if (!hasValidVessale) {
        this.appSettingService.showWarning(
          'Vessel Name is required.'
        );
        return;
      }
      const hasValidVoyage = this.masterJobData?.voyages?.some(
        (voyage: any) => voyage.VoyageNo && voyage.VoyageNo.trim() !== ''
      );
      if (!hasValidVoyage) {
        this.appSettingService.showWarning(
          'Voyage No is required.'
        );
        return;
      }
    }

    const modalRef = this.modalService.open(AllHBLComponent, {
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.masterJobSid = this.masterJobSid
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
    modalRef.componentInstance.agentList = this.agentList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;


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
  navigateToHouseJobCreation(): void {
    if (this.isJobClosed) {
      this.toastr.warning('Job is closed. House Job creation is not allowed.');
      return;
    }

    if (!this.masterJobSid) {
      this.toastr.error('Please save the master job first before creating house job');
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
      POL: this.masterJobForm.get('POL')?.value,
      POD: this.masterJobForm.get('POD')?.value,
      FPD: this.masterJobForm.get('FPD')?.value,
      ETA: this.masterJobForm.get('ETA')?.value,
      ETD: this.masterJobForm.get('ETD')?.value,
      CarrierName: this.masterJobForm.get('CarrierName')?.value,
      // Get port codes instead of SIDs
      POOCode: this.getPortCode(this.masterJobForm.get('POO')?.value),
      POLCode: this.getPortCode(this.masterJobForm.get('POL')?.value),
      PODCode: this.getPortCode(this.masterJobForm.get('POD')?.value),
      FPDCode: this.getPortCode(this.masterJobForm.get('FPD')?.value)
    };

    // Navigate to house job entry with master job data as query parameters
    this.router.navigate(['/operation/house-job/entry'], {
      queryParams: {
        fromMasterJob: 'true',
        MasterJobSid: masterJobData.MasterJobSid
      },
      state: { masterJobData: structuredClone(masterJobData) }
    });
  }



  loadHSSACLookups(){
    this.operationService.getAllHssac().subscribe({
      next: (resp: any) => {
        this.hssacList = resp || [];

      },
      error: (err) => {
        console.error('Error loading HSSAC data:', err);
        this.hssacList = [];
      }
    });
  }
  bookingCreateInMasterJob() {
    const pendingHouses = this.loadedHouses.filter((house: any) =>
      this.isLclImportTranshipmentHouse(house) && !house?.TranshipmentBookingSid
    );

    if (!pendingHouses.length) {
      this.appSettingService.showWarning('No pending LCL Import transhipment house jobs found.');
      return;
    }

    const bookingPayload = {
      houses: pendingHouses,
      createdBy: this.appSettingsService.userSettingSource.value['userEmail']
    };

    this.spinner.show();

    this.operationService.createBookingFromMasterJob(bookingPayload).subscribe({
      next: (resp: any) => {
        this.spinner.hide();

        // 🚨 Hard failure (API / server error)
        if (!resp || resp.status !== true) {
          this.appSettingService.showError(
            resp?.message || 'Failed to create booking'
          );
          return;
        }

        const results = resp.data || [];

        const successList = results.filter((r: any) => r.success);
        const duplicateList = results.filter((r: any) => !r.success);
        const getBookingNo = (item: any) => item?.bookingHeader?.BookingNo || item?.BookingNo || item?.bookingNo || '';
        const successBookingNos = successList.map(getBookingNo).filter(Boolean).join(', ');
        const duplicateBookingNos = duplicateList.map(getBookingNo).filter(Boolean).join(', ');

        // ✅ Case 1: At least one booking created
        if (successList.length > 0) {
          this.appSettingService.showSuccess(
            successBookingNos
              ? `${successList.length} booking(s) created successfully. Booking No: ${successBookingNos}`
              : `${successList.length} booking(s) created successfully`
          );
        }

        // ℹ️ Case 2: All houses already have booking
        else if (duplicateList.length > 0 && successList.length === 0) {
          this.appSettingService.showWarning(
            duplicateBookingNos
              ? `All selected transhipment jobs already have bookings. Booking No: ${duplicateBookingNos}`
              : 'All selected transhipment jobs already have bookings'
          );
        }

        if (successList.length > 0 && duplicateList.length > 0) {
          this.appSettingService.showWarning(
            duplicateBookingNos
              ? `Booking already exists for some transhipment jobs. Booking No: ${duplicateBookingNos}`
              : 'Booking already exists for some transhipment jobs'
          );
        }

        if (this.masterJobSid) {
          this.loadMasterJobData(this.masterJobSid);
        }

      },
      error: (err) => {
        this.spinner.hide();
        console.error('Booking creation failed:', err);
        this.appSettingService.showError('Failed to create booking');
      }
    });
  }

  showInfo() {
    if (!this.masterJobData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.masterJobData;
    modalRef.componentInstance.idLabel = 'MasterJob Id';
    modalRef.componentInstance.idValue = this.masterJobData?.MasterJobSid;
  }
 // Get list of unmapped containers
getUnmappedContainers(): any[] {
  if (!this.masterJobContainers || this.masterJobContainers.length === 0) {
    return [];
  }

  return this.masterJobContainers.controls
    .map(control => control.value)
    .filter(container => !this.isContainerMapped(container.MasterJobContainerSid));
}

// Optional: Scroll to container in the table when clicked
scrollToContainer(containerNumber: string): void {
  this.selectedTab = 'Container';

  setTimeout(() => {
    const element = this.findElementByTextContent('td', containerNumber);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-container');
      setTimeout(() => element.classList.remove('highlight-container'), 2000);
    }
  }, 100);
}

// Helper function to find element by text content
findElementByTextContent(selector: string, text: string): Element | null {
  const elements = document.querySelectorAll(selector);
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].textContent?.includes(text)) {
      return elements[i];
    }
  }
  return null;
}
  // Get gross weight from house job cargo
  getHouseJobGrossWeight(shipment: any): string {
    if (!shipment || !shipment.Cargo || !Array.isArray(shipment.Cargo) || shipment.Cargo.length === 0) {
      return '0';
    }

    // Sum up GrossWeight from all cargo items
    const total = shipment.Cargo.reduce((sum: number, cargo: any) => {
      const weight = parseFloat(cargo.GrossWeight) || 0;
      return sum + weight;
    }, 0);

    return total.toString();
  }

  // Get volume from house job cargo
  getHouseJobVolume(shipment: any): string {
    if (!shipment || !shipment.Cargo || !Array.isArray(shipment.Cargo) || shipment.Cargo.length === 0) {
      return '0';
    }

    // Sum up Volume from all cargo items
    const total = shipment.Cargo.reduce((sum: number, cargo: any) => {
      const volume = parseFloat(cargo.Volume) || 0;
      return sum + volume;
    }, 0);

    return total.toString();
  }

  // Get total packages from house job cargo
  getHouseJobTotalPackages(shipment: any): string {
    if (!shipment || !shipment.Cargo || !Array.isArray(shipment.Cargo) || shipment.Cargo.length === 0) {
      return '0';
    }

    // Sum up NoOfPackage from all cargo items
    const total = shipment.Cargo.reduce((sum: number, cargo: any) => {
      const packages = parseInt(cargo.NoOfPackage) || 0;
      return sum + packages;
    }, 0);

    return total.toString();
  }
  // Alternative method that searches in masterJobData.houseJob
  getHouseJobGrossWeightFromMaster(shipment: any): string {
    // If shipment already has Cargo, use it
    if (shipment.Cargo && Array.isArray(shipment.Cargo)) {
      return this.getHouseJobGrossWeight(shipment);
    }

    // Otherwise, find in masterJobData.houseJob
    if (this.masterJobData && this.masterJobData.houseJob && shipment.HBLNo) {
      const houseJob = this.masterJobData.houseJob.find(
        (hj: any) => hj.HBLNo === shipment.HBLNo
      );

      if (houseJob && houseJob.Cargo && Array.isArray(houseJob.Cargo)) {
        const total = houseJob.Cargo.reduce((sum: number, cargo: any) => {
          const weight = parseFloat(cargo.GrossWeight) || 0;
          return sum + weight;
        }, 0);
        return total.toString();
      }
    }

    return '0';
  }

  // Similarly for volume
  getHouseJobVolumeFromMaster(shipment: any): string {
    if (shipment.Cargo && Array.isArray(shipment.Cargo)) {
      return this.getHouseJobVolume(shipment);
    }

    if (this.masterJobData && this.masterJobData.houseJob && shipment.HBLNo) {
      const houseJob = this.masterJobData.houseJob.find(
        (hj: any) => hj.HBLNo === shipment.HBLNo
      );

      if (houseJob && houseJob.Cargo && Array.isArray(houseJob.Cargo)) {
        const total = houseJob.Cargo.reduce((sum: number, cargo: any) => {
          const volume = parseFloat(cargo.Volume) || 0;
          return sum + volume;
        }, 0);
        return total.toString();
      }
    }

    return '0';
  }

  // And for total packages
  getHouseJobTotalPackagesFromMaster(shipment: any): string {
    if (shipment.Cargo && Array.isArray(shipment.Cargo)) {
      return this.getHouseJobTotalPackages(shipment);
    }

    if (this.masterJobData && this.masterJobData.houseJob && shipment.HBLNo) {
      const houseJob = this.masterJobData.houseJob.find(
        (hj: any) => hj.HBLNo === shipment.HBLNo
      );

      if (houseJob && houseJob.Cargo && Array.isArray(houseJob.Cargo)) {
        const total = houseJob.Cargo.reduce((sum: number, cargo: any) => {
          const packages = parseInt(cargo.NoOfPackage) || 0;
          return sum + packages;
        }, 0);
        return total.toString();
      }
    }

    return '0';
  }
  // Add this method to check if a house job has container mapping
  hasContainerMapping(houseJob: any): boolean {
    if (!houseJob || !houseJob.houseJob || !houseJob.houseJob.Products ||
      !Array.isArray(houseJob.houseJob.Products)) {
      return false;
    }

    // Check if any product has MasterJobContainerSid not null
    return houseJob.houseJob.Products.some((product: any) =>
      product.MasterJobContainerSid !== null && product.MasterJobContainerSid !== undefined
    );
  }

  // Or if you want to check against the houseJob array from the master job data
  hasContainerMappingFromHouseJobArray(houseJobItem: any): boolean {
    if (!houseJobItem || !houseJobItem.Products || !Array.isArray(houseJobItem.Products)) {
      return false;
    }

    return houseJobItem.Products.some((product: any) =>
      product.MasterJobContainerSid !== null && product.MasterJobContainerSid !== undefined
    );
  }

  // Method to use with the slicedAttachedBookings data
  hasContainerMappingForShipment(shipment: any): boolean {
    // Check if shipment has houseJob data
    if (shipment.houseJob && shipment.houseJob.Products) {
      return this.hasContainerMappingFromHouseJobArray(shipment.houseJob);
    }

    // If shipment doesn't have houseJob data directly, check the masterJobData
    if (this.masterJobData && this.masterJobData.houseJob) {
      const matchingHouseJob = this.masterJobData.houseJob.find(
        (hj: any) => hj.HBLNo === shipment.HBLNo
      );

      if (matchingHouseJob) {
        return this.hasContainerMappingFromHouseJobArray(matchingHouseJob);
      }
    }

    return false;
  }



  getInvoiceStatus(shipment: any): string {
    // Generate cache key based on shipment and house job data
    const cacheKey = this.getInvoiceStatusCacheKey(shipment);

    // Return cached result if available
    if (this.invoiceStatusCache.has(cacheKey)) {
      return this.invoiceStatusCache.get(cacheKey)!;
    }



    // First, try to find the corresponding house job from masterJobData
    let houseJobData = null;

    if (this.masterJobData?.houseJob && shipment?.HBLNo) {
      houseJobData = this.masterJobData.houseJob.find(
        (hj: any) => hj.HBLNo === shipment.HBLNo
      );

    }

    // Use houseJobData if found, otherwise use shipment data
    const dataToCheck = houseJobData || shipment;

    // Check if costRevenueCharges exists and is an array with items
    if (!dataToCheck || !dataToCheck.costRevenueCharges || !Array.isArray(dataToCheck.costRevenueCharges)) {

      this.invoiceStatusCache.set(cacheKey, 'no-cost-charges');
      return 'no-cost-charges';
    }

    if (dataToCheck.costRevenueCharges.length === 0) {

      this.invoiceStatusCache.set(cacheKey, 'no-cost-charges');
      return 'no-cost-charges';
    }



    // Check each costRevenueCharge for revenue voucher
    let hasRevenueVoucher = false;
    let voucherDetails = null;

    for (const charge of dataToCheck.costRevenueCharges) {


      if (charge.RevenueVoucherHeaderSid || charge.revenueVoucherHeader?.VoucherHeaderSid) {
        hasRevenueVoucher = true;
        voucherDetails = charge.revenueVoucherHeader || { VoucherHeaderSid: charge.RevenueVoucherHeaderSid };

        break;
      }
    }

    if (!hasRevenueVoucher) {

      this.invoiceStatusCache.set(cacheKey, 'pending');
      return 'pending';
    }

    // Check if revenueVoucherHeader has a value
    const voucherHeaderSid = voucherDetails?.VoucherHeaderSid;

    let result: string;
    if (voucherHeaderSid && voucherHeaderSid !== null && voucherHeaderSid !== undefined) {

      result = 'generated';
    } else {

      result = 'pending';
    }

    // Cache the result
    this.invoiceStatusCache.set(cacheKey, result);
    return result;
  }
  private getInvoiceStatusCacheKey(shipment: any): string {
    if (!shipment) return 'null-shipment';

    const hblNo = shipment.HBLNo || 'no-hbl';
    const houseJobSid = shipment.HouseJobSid || 'no-house-job-sid';

    // Also include masterJobData houseJob costRevenueCharges hash if available
    let costRevenueHash = 'no-cost-revenue';
    if (this.masterJobData?.houseJob && shipment?.HBLNo) {
      const houseJob = this.masterJobData.houseJob.find((hj: any) => hj.HBLNo === shipment.HBLNo);
      if (houseJob && houseJob.costRevenueCharges) {
        // Create a simple hash of the costRevenueCharges
        costRevenueHash = JSON.stringify(houseJob.costRevenueCharges.map((c: any) => ({
          RevenueVoucherHeaderSid: c.RevenueVoucherHeaderSid,
          VoucherHeaderSid: c.revenueVoucherHeader?.VoucherHeaderSid
        })));
      }
    }

    return `${hblNo}-${houseJobSid}-${costRevenueHash.substring(0, 50)}`;
  }
  clearInvoiceStatusCache(): void {
    this.invoiceStatusCache.clear();
  }
  /**
   * Check if shipment has costRevenueCharges table
   */
  hasCostRevenueCharges(shipment: any): boolean {
    // First, try to find the corresponding house job from masterJobData
    let houseJobData = null;

    if (this.masterJobData?.houseJob && shipment?.HBLNo) {
      houseJobData = this.masterJobData.houseJob.find(
        (hj: any) => hj.HBLNo === shipment.HBLNo
      );
    }

    // Use houseJobData if found, otherwise use shipment data
    const dataToCheck = houseJobData || shipment;

    return dataToCheck &&
      dataToCheck.costRevenueCharges &&
      Array.isArray(dataToCheck.costRevenueCharges) &&
      dataToCheck.costRevenueCharges.length > 0;
  }

  /**
   * Get detailed invoice information
   */
  getInvoiceInfo(shipment: any): any {
    if (!this.hasCostRevenueCharges(shipment)) {
      return null;
    }

    // First, try to find the corresponding house job from masterJobData
    let houseJobData = null;

    if (this.masterJobData?.houseJob && shipment?.HBLNo) {
      houseJobData = this.masterJobData.houseJob.find(
        (hj: any) => hj.HBLNo === shipment.HBLNo
      );
    }

    // Use houseJobData if found, otherwise use shipment data
    const dataToCheck = houseJobData || shipment;

    // Find charge with revenue voucher
    for (const charge of dataToCheck.costRevenueCharges) {
      if (charge.RevenueVoucherHeaderSid || charge.revenueVoucherHeader) {
        return {
          chargeDescription: charge.ChargeDescription,
          revenueAmount: charge.RevenueAmount,
          voucherNumber: charge.revenueVoucherHeader?.VoucherNumber,
          voucherHeaderSid: charge.RevenueVoucherHeaderSid || charge.revenueVoucherHeader?.VoucherHeaderSid,
          voucherType: charge.revenueVoucherTypeMaster?.DocumentTypeName || 'Invoice'
        };
      }
    }

    return null;
  }

  /**
   * Get the voucher number for display
   */
  getVoucherNumber(shipment: any): string {
    // First, try to find the corresponding house job from masterJobData
    let houseJobData = null;

    if (this.masterJobData?.houseJob && shipment?.HBLNo) {
      houseJobData = this.masterJobData.houseJob.find(
        (hj: any) => hj.HBLNo === shipment.HBLNo
      );
    }

    // Use houseJobData if found, otherwise use shipment data
    const dataToCheck = houseJobData || shipment;

    if (!dataToCheck || !dataToCheck.costRevenueCharges || !Array.isArray(dataToCheck.costRevenueCharges)) {
      return '';
    }

    // Find first charge with revenue voucher
    for (const charge of dataToCheck.costRevenueCharges) {
      if (charge.revenueVoucherHeader?.VoucherNumber) {
        return charge.revenueVoucherHeader.VoucherNumber;
      }
      if (charge.RevenueVoucherHeaderSid && !charge.revenueVoucherHeader) {
        // If we have the SID but no voucher header object
        return `Voucher #${charge.RevenueVoucherHeaderSid}`;
      }
    }

    return '';
  }
  getTotalAllowedContainers(): number {
    // Only check for FCL departments
    if (this.selectedFCLLCL !== 'FCL') {
      return Infinity; // No limit for non-FCL
    }

    // If there are no attached bookings, no limit
    if (!this.bookingItems || this.bookingItems.length === 0) {
      return Infinity;
    }

    // Sum up NoofContainers from all house jobs
    let totalAllowed = 0;

    this.bookingItems.forEach(booking => {
      if (booking.Cargo && Array.isArray(booking.Cargo)) {
        booking.Cargo.forEach(cargo => {
          totalAllowed += parseInt(cargo.NoofContainers) || 0;
        });
      }
    });

    return totalAllowed;
  }
  getFormattedPort(code: string) {

    if (!code) return '';
    const ourPort = (this.portList.find(p => p.PortCode === code))?.PortName;

    return `${ourPort} (${code})`
  }

  openFollowup() {
    if (!this.masterJobData) return;
    const POL = this.masterJobData?.POL;
    const POD = this.masterJobData?.POD;
    const FPD = this.masterJobData?.FPD;
    const formattedPOL = this.getFormattedPort(POL);
    const formattedPOD = this.getFormattedPort(POD);
    const formattedFPD = this.getFormattedPort(FPD);
    this.documentSid = this.masterJobData?.MasterJobSid;
    this.parentSubject = `__SUBJECT__ for Master Job No."${this.masterJobData.MasterJobNumber}"`;
    this.parentMailbody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Kindly do the needful for "__SUBJECT__" Master Job No."${this.masterJobData.MasterJobNumber}" Dated:${new Date(this.masterJobData.MasterJobDate).toLocaleDateString()} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''}</p>
        <p>Best Regards,</p>
        <p>${this.userData['userName']}</p>
      </div>
    `;
  }
  openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);
    modalRef.componentInstance.DocumentSid = this.masterJobSid;
  }

  openAuthority() {
    if (!this.masterJobData) return;
    const menuMasterSid = Number(this.MenuMasterSid || sessionStorage.getItem('currentMenuId'));
    const documentSid = this.masterJobData?.MasterJobSid || this.masterJobSid;
    if (!menuMasterSid || !documentSid) {
      this.appSettingService.showWarning('Please save the master job before viewing authorization.');
      return;
    }
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = menuMasterSid;
    modalRef.componentInstance.documentSid = Number(documentSid);
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch?.BranchMasterSid;
    modalRef.componentInstance.DepartmentMasterSid = this.masterJobData?.DepartmentMasterSid ?? null;
    modalRef.componentInstance.allowAction = true;
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const departmentSid = this.masterJobData?.DepartmentMasterSid;
    const pol = this.masterJobData?.POL;
    const pod = this.masterJobData?.POD;
    const carrier = this.masterJobData?.voyages?.[0]?.CarrierSid || null;
    const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.masterJobData?.MasterJobSid
  };
    const payload = {
       MenuMasterSid: this.currentMenuId,
       DepartmentMasterSid: departmentSid,
       POL: pol,
       POD: pod,
       Carrier: carrier,
       DocumentSid: this.masterJobData?.MasterJobSid,
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
      (a?.DocumentSid ?? this.masterJobData?.MasterJobSid ?? null) ===
      (b?.DocumentSid ?? this.masterJobData?.MasterJobSid ?? null)
    );
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


  navigateToMasterJob() {
    this.router.navigate(['operation/master-job/entry']);
  }


  /**
  * Download Container Excel template
  */
  downloadContainerTemplate(): void {
    this.spinner.show();
    this.operationService.downloadContainerTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Container_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.spinner.hide();
        this.appSettingService.showSuccess('Container template downloaded successfully');
      },
      error: (error) => {
        console.error('Error downloading container template:', error);
        this.spinner.hide();
        this.appSettingService.showError('Error downloading container template');
      }
    });
  }

  /**
   * Handle container file selection
   */
  onContainerFileSelected(event: any): void {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.appSettingService.showError('Invalid file type. Please upload Excel files only (.xlsx, .xls)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.appSettingService.showError('File size exceeds 5MB limit');
      return;
    }

    this.selectedContainerFile = file;
    this.parseContainerExcelFile();
  }


  /**
   * Parse container Excel file
   */
  parseContainerExcelFile(): void {
    if (!this.selectedContainerFile) {
      return;
    }

    this.isProcessingContainerUpload = true;
    this.spinner.show();
    this.containerUploadErrors = [];
    this.parsedContainers = [];

    this.operationService.parseContainerExcel(this.selectedContainerFile).subscribe({
      next: (response: any) => {
        this.spinner.hide();
        this.isProcessingContainerUpload = false;

        if (response.status) {
          this.parsedContainers = response.data.containers || [];

          if (this.parsedContainers.length === 0) {
            this.appSettingService.showWarning('No valid container data found in the Excel file');
            return;
          }

          // Show preview
          this.showContainerPreview = true;
          this.appSettingService.showSuccess(`Found ${this.parsedContainers.length - 1} valid containers`);

          // Validate the parsed data
          this.validateContainerData();

        } else {
          if (response.data?.errors) {
            this.containerUploadErrors = response.data.errors;
          }
          this.appSettingService.showError(response.message || 'Error parsing Excel file');
        }
      },
      error: (error) => {
        console.error('Error parsing container Excel:', error);
        this.spinner.hide();
        this.isProcessingContainerUpload = false;
        this.appSettingService.showError('Error parsing Excel file');
      }
    });
  }


  /**
   * Validate container data
   */
  validateContainerData(): void {
    if (this.parsedContainers.length === 0) {
      return;
    }

    this.spinner.show();

    const payload = {
      containers: this.parsedContainers,
      masterJobSid: this.masterJobSid,
      companyMasterSid: this.currentCompany?.CompanyMasterSid,
      branchMasterSid: this.currentBranch?.BranchMasterSid,
      createdBy: this.userData?.userEmail || ''
    };

    this.operationService.validateContainerData(payload).subscribe({
      next: (response: any) => {
        this.spinner.hide();

        if (response.status) {
          this.parsedContainers = response.data.containers || [];
          this.containerValidationErrors = [];
          this.appSettingService.showSuccess('Container data validated successfully');
        } else {
          if (response.data?.errors) {
            this.containerValidationErrors = response.data.errors;
            this.appSettingService.showWarning(`Found ${this.containerValidationErrors.length} validation errors`);
          } else {
            this.appSettingService.showError(response.message || 'Validation failed');
          }
        }
      },
      error: (error) => {
        console.error('Error validating container data:', error);
        this.spinner.hide();
        this.appSettingService.showError('Error validating container data');
      }
    });
  }
  /**
   * Process container upload and add to form
   */
  processContainerUpload(): void {
    if (this.parsedContainers.length === 0) {
      this.appSettingService.showWarning('No container data to process');
      return;
    }

    // Check for validation errors
    if (this.containerValidationErrors.length > 0) {
      this.appSettingService.showWarning('Please fix validation errors before proceeding');
      return;
    }

    // Check container limits for FCL
    if (this.selectedFCLLCL === 'FCL') {
      const currentContainerCount = this.masterJobContainers.length;
      const newTotalCount = currentContainerCount + this.parsedContainers.length;
      const totalAllowedContainers = this.getTotalAllowedContainers();

      if (newTotalCount > totalAllowedContainers && totalAllowedContainers > 0) {
        const warningMsg = `Upload would exceed container limit. Current: ${currentContainerCount}, Adding: ${this.parsedContainers.length}, Limit: ${totalAllowedContainers}`;
        this.appSettingService.showWarning(warningMsg);
        return;
      }
    }

    // Add each container to the form
    this.parsedContainers.forEach(container => {
      // Check for duplicate container numbers
      const existingContainer = this.masterJobContainers.controls.find(
        control => control.value.ContainerNumber === container.ContainerNumber
      );

      if (existingContainer) {
        this.appSettingService.showWarning(`Container ${container.ContainerNumber} already exists. Skipping.`);
        return;
      }

      // Validate container number format
      if (container.ContainerNumber) {
        const validation = this.validateContainerNumber(container.ContainerNumber);
        if (!validation.isValid) {
          return;
        }
      }

      // Add the container
      this.addContainer(container);
    });

    // Reset upload state
    this.resetContainerUpload();

    // this.appSettingService.showSuccess(`Added ${this.parsedContainers.length} containers successfully`);
    this.markAsDirty();
  }


  /**
   * Reset container upload state
   */
  resetContainerUpload(): void {
    this.selectedContainerFile = null;
    this.containerUploadErrors = [];
    this.containerValidationErrors = [];
    this.showContainerPreview = false;
    this.parsedContainers = [];
    this.isProcessingContainerUpload = false;

    // Reset file input
    const fileInput = document.querySelector('#containerFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Get container type name for display
   */
  getContainerTypeDisplay(containerTypeId: number): string {
    if (!containerTypeId || this.containerTypeList.length === 0) {
      return containerTypeId?.toString() || 'N/A';
    }

    const containerType = this.containerTypeList.find(
      ct => ct.ContainerTypeMasterSid === containerTypeId
    );

    return containerType ? containerType.ContainerName : containerTypeId.toString();
  }

  /**
   * Get package type name for display
   */
  getPackageTypeDisplay(packageTypeId: number): string {
    if (!packageTypeId || this.packageTypeList.length === 0) {
      return packageTypeId?.toString() || 'N/A';
    }

    const packageType = this.packageTypeList.find(
      pt => pt.UOMMasterSid === packageTypeId
    );

    return packageType ? packageType.UOMName : packageTypeId.toString();
  }

  exportContainerData(): void {
    if (this.masterJobContainers.length === 0) {
      this.toastr.warning('No container data to export');
      return;
    }

    // Format container data for export
    const formattedData = this.masterJobContainers.value.map(container => ({
      'Container Type': this.getContainerTypeName(container.ContainerType),
      'Container Number': container.ContainerNumber,
      'Line Seal': container.LineSeal,
      'Customs Seal': container.CustomsSeal,
      'HS Code': container.HsCode,
      'Commodity Description': container.CommodityDescription,
      'Package Type': this.getPackageTypeName(container.PkgType),
      'No. of Pkg': container.NoOfPkg,
      'Gross Weight': container.GrossWeight,
      'Net Weight': container.NetWeight,
      'Chargeable Weight': container.ChargeableWeight,
      'Volume (CBM)': container.Volume,
      'SOC': container.IsSoc ? 'Yes' : 'No',
      'HAZ': container.IsHaz ? 'Yes' : 'No'
    }));

    // Use the same ExcelExportService as your reports
    this.exportExcelService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'Container Type', label: 'Container Type' },
        { key: 'Container Number', label: 'Container Number' },
        { key: 'Line Seal', label: 'Line Seal' },
        { key: 'Customs Seal', label: 'Customs Seal' },
        { key: 'HS Code', label: 'HS Code' },
        { key: 'Commodity Description', label: 'Commodity Description' },
        { key: 'Package Type', label: 'Package Type' },
        { key: 'No. of Pkg', label: 'No. of Pkg' },
        { key: 'Gross Weight', label: 'Gross Weight' },
        { key: 'Net Weight', label: 'Net Weight' },
        { key: 'Chargeable Weight', label: 'Chargeable Weight' },
        { key: 'Volume (CBM)', label: 'Volume (CBM)' },
        { key: 'SOC', label: 'SOC' }
      ],
      fileName: `Containers_${this.masterJobForm.get('MasterJobNumber')?.value || 'MasterJob'}_${new Date().toISOString().slice(0, 10)}`,
      title: 'Container Details'
    });
  }

  /**
   * Download Product Excel template
   */
  downloadProductTemplate(): void {
    if (!this.masterJobSid) {
      this.appSettingService.showWarning('Please select a master job first');
      return;
    }

    this.spinner.show();
    this.operationService.downloadProductTemplate(this.masterJobSid).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Product_Template_MJ${this.masterJobSid}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.spinner.hide();
        this.appSettingService.showSuccess('Product template downloaded successfully');
      },
      error: (error) => {
        console.error('Error downloading product template:', error);
        this.spinner.hide();
        this.appSettingService.showError('Error downloading product template');
      }
    });
  }

  /**
   * Handle product file selection
   */
  onProductFileSelected(event: any): void {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.appSettingService.showError('Invalid file type. Please upload Excel files only (.xlsx, .xls)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.appSettingService.showError('File size exceeds 5MB limit');
      return;
    }

    this.selectedProductFile = file;
    this.parseProductExcelFile();
  }

  /**
   * Parse product Excel file
   */
  parseProductExcelFile(): void {
    if (!this.selectedProductFile) {
      return;
    }

    this.isProcessingProductUpload = true;
    this.spinner.show();
    this.productUploadErrors = [];
    this.parsedProducts = [];

    this.operationService.parseProductExcel(this.selectedProductFile).subscribe({
      next: (response: any) => {
        this.spinner.hide();
        this.isProcessingProductUpload = false;

        if (response.status) {
          this.parsedProducts = response.data.products || [];

          if (this.parsedProducts.length === 0) {
            this.appSettingService.showWarning('No valid product data found in the Excel file');
            return;
          }

          // Show preview
          this.showProductPreview = true;
          this.appSettingService.showSuccess(`Found ${this.parsedProducts.length - 1} valid products`);

          // Validate the parsed data
          this.validateProductData();

        } else {
          if (response.data?.errors) {
            this.productUploadErrors = response.data.errors;
          }
          this.appSettingService.showError(response.message || 'Error parsing Excel file');
        }
      },
      error: (error) => {
        console.error('Error parsing product Excel:', error);
        this.spinner.hide();
        this.isProcessingProductUpload = false;
        this.appSettingService.showError('Error parsing Excel file');
      }
    });
  }

  /**
   * Validate product data
   */
  validateProductData(): void {
    if (this.parsedProducts.length === 0) {
      return;
    }

    this.spinner.show();

    const payload = {
      products: this.parsedProducts,
      masterJobSid: this.masterJobSid,
      companyMasterSid: this.currentCompany?.CompanyMasterSid,
      branchMasterSid: this.currentBranch?.BranchMasterSid
    };

    this.operationService.validateProductData(payload).subscribe({
      next: (response: any) => {
        this.spinner.hide();

        if (response.status) {
          this.productValidationErrors = response.data.errors || [];

          if (this.productValidationErrors.length === 0) {
            this.appSettingService.showSuccess('Product data validated successfully');
          } else {
            this.appSettingService.showWarning(
              `Found ${this.productValidationErrors.length} validation errors`
            );
          }
        } else {
          if (response.data?.errors) {
            this.productValidationErrors = response.data.errors;
            this.appSettingService.showWarning(`Found ${this.productValidationErrors.length} validation errors`);
          } else {
            this.appSettingService.showError(response.message || 'Validation failed');
          }
        }
      },
      error: (error) => {
        console.error('Error validating product data:', error);
        this.spinner.hide();
        this.appSettingService.showError('Error validating product data');
      }
    });
  }

  /**
   * Process product upload
   */
  processProductUpload(): void {
    if (this.parsedProducts.length === 0) {
      this.appSettingService.showWarning('No product data to process');
      return;
    }

    // Check for validation errors
    if (this.productValidationErrors.length > 0) {
      this.appSettingService.showWarning('Please fix validation errors before proceeding');
      return;
    }
    const filteredProducts = this.parsedProducts.filter(product => {
      // Skip products with example HBL numbers
      const exampleHblPatterns = ['HBL-001', 'HBL-', 'SAMPLE', 'EXAMPLE', 'DEMO'];
      const hblNo = product.HBLNo?.toUpperCase();
      if (hblNo && exampleHblPatterns.some(pattern => hblNo.includes(pattern))) {

        return false;
      }

      // Skip products with example product names
      const exampleProductPatterns = ['ELECTRONICS', 'SAMPLE', 'EXAMPLE', 'DEMO'];
      const productName = product.ProductName?.toUpperCase();
      if (productName && exampleProductPatterns.some(pattern => productName.includes(pattern))) {

        return false;
      }

      return true;
    });

    if (filteredProducts.length === 0) {
      this.appSettingService.showWarning('No valid product data to process after filtering example rows');
      return;
    }

    this.spinner.show();

    const payload = {
      products: filteredProducts,
      masterJobSid: this.masterJobSid,
      companyMasterSid: this.currentCompany?.CompanyMasterSid,
      branchMasterSid: this.currentBranch?.BranchMasterSid,
      createdBy: this.userData?.userEmail || ''
    };



    this.operationService.processProductUpload(payload).subscribe({
      next: (response: any) => {
        this.spinner.hide();

        if (response.status) {
          this.appSettingService.showSuccess(response.message);

          // Reset upload state
          this.resetProductUpload();

          // Refresh product data if needed
          // if (this.HouseJobSid) {
          //     this.loadHouseById(this.HouseJobSid);
          // }
          if (this.masterJobSid) {
            this.loadMasterJobData(this.masterJobSid);
          }
        } else {
          this.appSettingService.showError(response.message || 'Failed to process product upload');
        }
      },
      error: (error) => {
        console.error('Error processing product upload:', error);
        this.spinner.hide();
        this.appSettingService.showError('Error processing product upload');
      }
    });
  }

  /**
   * Reset product upload state
   */
  resetProductUpload(): void {
    this.selectedProductFile = null;
    this.productUploadErrors = [];
    this.productValidationErrors = [];
    this.showProductPreview = false;
    this.parsedProducts = [];
    this.isProcessingProductUpload = false;

    // Reset file input
    const fileInput = document.querySelector('#productFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

}


interface CustomerProfit {
  CustomerName: string,
  Amount: number
}

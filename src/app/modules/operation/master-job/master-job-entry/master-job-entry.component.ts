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
import { toNumber } from 'src/app/common/helper';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { CfsOutturnComponent } from '../reports/cfs-outturn/cfs-outturn.component';
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
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  vesselVoyageLookupConfig = DROPDOWN_CONFIGS.VESSEL_VOYAGE;
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
  filteredPorts: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  headerVesselList: any[] = [];
  carrierList: any[] = [];
  agentList: any[] = [];
  forwarderList: any[] = [];
  cfsList: any[] = [];
  yardList: any[] = [];
  TandCList: any[] = [];
  decimalAfterPrecision = 3;
  chargeList: any[] = [];
  filteredDestinationAgents: any[] = [];
  filteredOriginAgents: any[] = [];
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

  // EDI Manifest validation modal properties
  showValidationModal = false;
  validationErrors: any[] = [];
  groupedErrors: { [key: string]: any[] } = {};
  groupedByHBL: { [hblNo: string]: { [recordType: string]: any[] } } = {};
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
  arapData: any[] = [];
  arapLoading = false;
  arapFilter = {
    voucherType: 'all',
    status: 'all' // 'all', 'unpaid', 'partial', 'paid'
  };
  currentMenuId: any;

  // Dirty tracking for unsaved changes detection
  isDirty = false;
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
  selectedTab = 'Master';
  selectedTab1 = 'Product';
  countryOfCompany: string;

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
    private cdr: ChangeDetectorRef,
    private datepipe: CustomDatePipe,
    private spinner: NgxSpinnerService,
    private commonService: CommonService,
    private reportService: ReportService,
    private datePipe: DatePipe,
    private exportExcelService: ExcelExportService,
    public mps: MenuPermissionService,
  ) {
    this.initForm();
    this.initContainerForm();
    this.attachedBookings = this.fb.array([]);
  }

  ngOnInit(): void {
    console.log('🚀 === MasterJobEntryComponent ngOnInit START ===');
    this.userData = this.appSettingsService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.countryOfCompany = this.currentCompany?.CountryName;
    this.currentBranch = this.appSettingsService.decrypt(localStorage.getItem('selected-branch'));
    const storedMenuId = localStorage.getItem('currentMenuId');
    this.mps.init().subscribe();
    console.log('📋 localStorage currentMenuId:', storedMenuId);

    this.MenuMasterSid = storedMenuId ? Number(storedMenuId) : null;
    console.log('✅ MenuMasterSid after initialization:', this.MenuMasterSid);

    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
    console.log('📋 Filter Option:', this.filterOption);
    console.log('🚀 === MasterJobEntryComponent ngOnInit END ===');

     
    // Setup debounced vessel search
    this.setupVesselSearchDebouncing();
    this.loadHSSACLookups();
    this.setupDepartmentBasedValidation();
    this.loadInitialData().subscribe(() => {
      const loadingPlanData = this.operationService.getLoadingPlanData();
      console.log(loadingPlanData, 'loadingPlanData')
      if (loadingPlanData) {
        this.patchLoadingPlanData(loadingPlanData);
      }
      this.route.paramMap.subscribe((param) => {
        const idParam = param.get('id');
        this.masterJobSid = idParam ? +idParam : null;
        if (this.masterJobSid) {
          this.isEditMode = true;
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
      });

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

    // Check custom dirty flag
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.masterJobForm.invalid) {
        this.toastr.error('Please fill all required fields');
        this.masterJobForm.markAllAsTouched();
        resolve(false);
        return;
      }

      // Call the existing submit logic
      this.saveAndResolve(resolve);
    });
  }

  private saveAndResolve(resolve: (value: boolean) => void): void {
    this.isLoading = true;

    const getPortCode = (portSid: any): string => {
      if (!portSid && portSid !== 0) return '';
      const port = this.portList.find(p => p.PortMasterSid === portSid);
      return port ? port.PortCode : portSid?.toString().substring(0, 100);
    };

    const formValue = this.masterJobForm.value;
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
      CarrierSid: formValue.CarrierMasterSid,
      CarrierName: formValue.CarrierName,
    };

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
      CarrierRef: formValue.CarrierRef,
      AgentRef: formValue.AgentRef,
      ExportDoDate: formValue.ExportDoDate,
      SOBDate: formValue.SOBDate,
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
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: Number(localStorage.getItem('currentMenuId')),
    };

    const allShipments = (this.attachedBookings.getRawValue() || [])
      .filter(ship => !ship.MasterJobSid)
      .map(shipment => ({
        BookingHeaderSid: shipment.BookingHeaderSid,
        HBLNo: shipment.HBLNo,
      }));
    formData['shipmentList'] = [...allShipments];

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
            this.toastr.error(response.message || 'Failed to update Master Job');
            resolve(false);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to update Master Job');
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
            this.toastr.error(response.message || 'Failed to create Master Job');
            resolve(false);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to create Master Job');
          resolve(false);
        }
      });
    }
  }

  private resetDirtyState(): void {
    this.isDirty = false;
    this.formSaved = false;
    this.masterJobForm?.markAsPristine();
    this.initialContainersCount = this.masterJobContainers?.length || 0;
    this.initialConnectionsCount = this.connectionResult?.length || 0;
    this.initialContainerActivitiesCount = this.containerActivityData?.length || 0;
  }

  private markAsDirty(): void {
    this.isDirty = true;
    this.formSaved = false;
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








  uploadPDF() {
    this.modalService.open(MasterDocumentUploadComponent, {
      size: 'xl',
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
    this.masterJobForm = this.fb.group({
      // Master Job fields
      DepartmentMasterSid: ['', Validators.required],
      MasterJobNumber: [{ value: '', disabled: true }],
      MasterJobDate: [{ value: null, disabled: true }],
      FreightPPCC: ['Prepaid', Validators.required],
      
      DestinationAgent: [null],
      DestinationAgentAddress: [''],
      MBLNo: [''],
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
      CoLoader: [{ value: '', disabled: true }],
      ExportDoNo: [''],
      ExportDoDate: [null],
      SOBDate: [null],
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

      IsSoc: [false]
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
    const value = this.f[flagCtrl]?.value;
    this.f[flagCtrl]?.setValue(!value);
    this.masterJobForm.get(mainCtrl)?.reset();
  }

  toggleDateInputType(field: 'ETD' | 'ETA'): void {
    if (field === 'ETD') {
      this.isETDFreeText = !this.isETDFreeText;
      if (this.isETDFreeText) {
        this.masterJobForm.get('ETD')?.enable();
      } else {
        this.masterJobForm.get('ETD')?.disable();
      }
    } else if (field === 'ETA') {
      this.isETAFreeText = !this.isETAFreeText;
      if (this.isETAFreeText) {
        this.masterJobForm.get('ETA')?.enable();
      } else {
        this.masterJobForm.get('ETA')?.disable();
      }
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
      IsSoc: [container?.IsSoc === 'Y' || container?.IsSoc === true || false]
    }, { validators: this.grossNetWeightValidator() }); // Add validator here too

    this.masterJobContainers.push(containerGroup);
  }

  loadInitialData() {
    const companySid = this.currentCompany?.CompanyMasterSid;

    return forkJoin({
      seaDepartments: this.operationService.getDepartmentByType('Sea', companySid)
        .pipe(catchError(err => of({ data: [] }))),
      roadDepartments: this.operationService.getDepartmentByType('Road', companySid)
        .pipe(catchError(err => of({ data: [] }))),
      transportDepartments: this.operationService.getDepartmentByType('Transport', companySid)
        .pipe(catchError(err => of({ data: [] }))),
      otherDepartments: this.operationService.getDepartmentByType('Others', companySid)
        .pipe(catchError(err => of({ data: [] }))),
      ports: this.operationService.getAllPorts()
        .pipe(catchError(err => of({ data: [] }))),
      vessels: this.operationService.getAllVessels()
        .pipe(catchError(err => of({ data: [] }))),
      // Replace individual API calls with getCustomerByItsType
      agents: this.operationService.getCustomerByItsType({ companySid, types: ['vendor', 'transporter', 'agent'] })
        .pipe(catchError(err => of([]))),
      carriers: this.operationService.getCustomerByItsType({ companySid, types: ['carrier'] })
        .pipe(catchError(err => of([]))),
      forwarders: this.operationService.getCustomerByItsType({ companySid, types: ['forwarder'] })
        .pipe(catchError(err => of({ data: [] }))),
      cfsList: this.operationService.getCustomerByItsType({ companySid, types: ['cFS'] })
        .pipe(catchError(err => of({ data: [] }))),
      yards: this.operationService.getCustomerByItsType({ companySid, types: ['yard'] })
        .pipe(catchError(err => of({ data: [] }))),
      containerTypes: this.operationService.getAllContainerTypes()
        .pipe(catchError(err => of({ data: [] }))),
      currencies: this.operationService.getAllCurrencies()
        .pipe(catchError(err => of({ data: [] }))),
      packageTypes: this.operationService.getUOMsByType('P')
        .pipe(catchError(err => of([]))),
      customers: this.operationService.getAllCustomerRelatedLookups(this.filterOption)
        .pipe(catchError(err => of([]))),
      charges: this.operationService.getAllCharges(companySid)
        .pipe(catchError(err => of([]))),
      // userCountry: this.operationService.getCountryById(this.currentCompany.CountryMasterSid).pipe(catchError(err => of({}))),
    }).pipe(tap(({
      seaDepartments, roadDepartments, transportDepartments, otherDepartments, ports, vessels, agents, carriers, forwarders, cfsList, yards,
      containerTypes, currencies, packageTypes, customers, charges
    }) => {
      this.departments = [
        ...(seaDepartments || []),
        ...(roadDepartments || []),
        ...(transportDepartments || []),
        ...(otherDepartments || [])
      ];

      this.portList = (ports.data || []).map(p => ({ ...p, Country: p.countryMaster?.countryName }));
      this.vesselList = vessels.data || [];

      // Update all customer type lists with data from the new API
      this.agentList = agents.data;
      this.carrierList = carriers.data;
      this.forwarderList = forwarders.data;
      this.cfsList = cfsList.data;
      this.yardList = yards.data;
      this.chargeList = Array.isArray(charges) ? charges : (charges?.data || []);

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

      // default filtered ports
      this.filteredPorts = [...this.portList];
      this.filteredPOL = [...this.filteredPorts];
      this.filteredPOD = [...this.filteredPorts];
    }));

  }




  loadMasterJobData(masterJobSid: number): void {
    this.spinner.show();
    const payload = {
      screenName : 'Master Job',
      MasterJobSid : masterJobSid
    }
    forkJoin({
      masterJob: this.operationService.getMasterJobById(payload),
      arapData: this.operationService.getMasterJobARAPData(masterJobSid)
    }).subscribe({
      next: (responses: any) => {
        // Handle master job data
        if (responses.masterJob.status && responses.masterJob.data) {
          const data = responses.masterJob.data;
          this.masterJobData = data;
          
          console.log("Master Job Data", this.masterJobData);
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
          this.loadCustomsData();
        }

        // Handle AR/AP data - Ensure it's always an array
        if (responses.arapData) {
          // Check if the response is an object with data property
          let arapResponse = responses.arapData;

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

        this.isLoading = false;
        this.spinner.hide();

        // Reset dirty state after all async operations complete (including loadCustomsData)
        setTimeout(() => this.resetDirtyState(), 100);
      },
      error: (error) => {
        this.toastr.error('Failed to load master job data');
        console.error('Error loading master job:', error);
        this.isLoading = false;
      }
    });
  }


  patchFormValues(data: any) {
    console.log('DEBUG: Data received for patching:', data);
    console.log('DEBUG: MovementType value:', data.MovementType);
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

          ExportDoDate: othersData.ExportDoDate ? new Date(othersData.ExportDoDate) : null,
          SOBDate: othersData.SOBDate ? new Date(othersData.SOBDate) : null,
        });
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
      this.onDeptChange(selectedDepartment);
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

      console.log('Voyage data for patching PortCutoffDate:', voyage);

      this.masterJobForm.patchValue({
        MasterJobVoyageSid: voyage.MasterJobVoyageSid,
        VoyageMasterSid: voyage.VoyageMasterSid,
        VesselName: voyage.VesselName || '',
        VoyageNo: voyage.VoyageNo || '',
        ETA: voyage.ETA ? new Date(voyage.ETA) : null,
        ETD: voyage.ETD ? new Date(voyage.ETD) : null,
        ATA: voyage.ATA ? new Date(voyage.ATA) : null,
        ATD: voyage.ATD ? new Date(voyage.ATD) : null,
        DestinationATA: voyage.DestinationATA ? new Date(voyage.DestinationATA) : null,
        CarrierMasterSid: voyage.CarrierSid,
        CarrierName: voyage.CarrierName || '',
        PortCutoffDate: voyage.PortCutoff ? new Date(voyage.PortCutoff) :
          voyage.PortCutoffDate ? new Date(voyage.PortCutoffDate) :
            data.PortCutoffDate ? new Date(data.PortCutoffDate) : null,
      });
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
        TransactionSid: connection.MasterJobContainerSid,
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
    this.calculateChargeWiseProfit();
    this.calculateCustomerWiseAmount();
    console.log("CUSTOMER WISE SUMMARY", this.customerWiseSummary);


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
  }

  onDestinationAgentChange(selectedAgent: any) {
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
        mblNoControl?.disable();
        mblDateControl?.disable();
        mblNoControl?.clearValidators();
        mblDateControl?.clearValidators();
        
    } else if (isImport) {
        // Import department - enable and make required
        mblNoControl?.enable();
        mblDateControl?.enable();
        mblNoControl?.setValidators([Validators.required, Validators.maxLength(20)]);
        mblDateControl?.setValidators([Validators.required]);
        
    } else {
        // Other departments - enable but not required
        mblNoControl?.enable();
        mblDateControl?.enable();
        mblNoControl?.clearValidators();
        mblDateControl?.clearValidators();
        mblNoControl?.setValidators([Validators.maxLength(20)]);
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
      this.masterJobForm.get('POO')?.setValue(null);
      this.masterJobForm.get('POL')?.setValue(null);
      this.masterJobForm.get('POD')?.setValue(null);
      this.masterJobForm.get('FPD')?.setValue(null);
      this.masterJobForm.get('ETA')?.setValue('');
      this.masterJobForm.get('ETD')?.setValue('');
      this.masterJobForm.get('MovementType')?.setValue(null);
      this.updateMBLValidation(null);
      return;
    }

    this.selectedDepartmentType = department.departmentType?.toUpperCase() || '';
    this.selectedFCLLCL = this.selectedDepartmentType === "SEA" ?
      (department.FCLLCL?.toUpperCase() || "LCL") : "AIR";

    this.updateMBLValidation(department.DepartmentMasterSid);

    // Filter ports based on department type
    this.filteredPorts = this.getFilteredPortsBySegment(this.selectedFCLLCL);
    this.filteredPOL = [...this.filteredPorts];
    this.filteredPOD = [...this.filteredPorts];

    if (this.selectedDepartmentType === "SEA") {
      this.masterJobForm.get('MovementType')?.setValue('Sea');
    } else if (this.selectedDepartmentType === "AIR") {
      this.masterJobForm.get('MovementType')?.setValue('Flight');
    }

    // Trigger vessel search after department change
    this.triggerVesselSearch();
  }

  onRouteChange(): void {
    const polSid = this.masterJobForm.get('POL')?.value;
    const podSid = this.masterJobForm.get('POD')?.value;
    const segment = this.selectedFCLLCL;

    this.filteredPorts = this.getFilteredPortsBySegment(segment);

    // Filter POL and POD to exclude each other
    // Values are PortMasterSid, so compare accordingly
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== podSid);
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== polSid);

    if (polSid && podSid && polSid === podSid) {
      this.masterJobForm.get('POD')?.setErrors({ samePort: true });
      this.masterJobForm.get('POL')?.setErrors({ samePort: true });
    } else {
      this.masterJobForm.get('POD')?.setErrors(null);
      this.masterJobForm.get('POL')?.setErrors(null);
    }

    // Trigger vessel search after route change
    this.triggerVesselSearch();
  }

  getFilteredPortsBySegment(segment: string): any[] {
    if (segment === 'AIR') {
      return this.portList.filter(port => port.PortType === 'Air');
    } else if (segment === 'FCL' || segment === 'LCL') {
      return this.portList.filter(port => port.PortType === 'Sea');
    }
    return this.portList;
  }

  // Handle POL change
  handlePOLChange(selectedPort: any) {
    if (!selectedPort) {
      this.filteredPOD = [...this.filteredPorts];
      this.clearVesselAndVoyageData();
      return;
    }
    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
    this.masterJobForm.get('POL')?.setValue(selectedPortSid, { emitEvent: false });
    this.triggerVesselSearch();
  }

  // Handle POD change
  handlePODChange(selectedPort: any) {
    if (!selectedPort) {
      this.filteredPOL = [...this.filteredPorts];
      this.clearVesselAndVoyageData();
      // Clear FPOD if POD is cleared
      this.masterJobForm.get('FPD')?.setValue(null);
      return;
    }

    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
    this.masterJobForm.get('POD')?.setValue(selectedPortSid, { emitEvent: false });

    // ✅ Auto-set FPOD to the same value as POD
    this.masterJobForm.get('FPD')?.setValue(selectedPortSid);

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

    if (POL && POD && MovementType) {
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

    // Add this check: Don't search vessels if manual entry is enabled
    if (this.f['isVesselFreeText']?.value || this.f['isVoyageFreeText']?.value) {
      return;
    }

    this.isLoadingVessels = true;
    this.lastVesselSearchParams = { ...params };

    const payload = {
      POL: params.POL,
      POD: params.POD,
      segment: this.getVoyageTypeBasedOnDept(this.selectedDepartment?.DepartmentMasterSid)
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

  // Vessel change handler
  onVesselChange(vessel: any) {
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
    if (!voyage) {
      this.masterJobForm.get('ETA')?.setValue(null);
      this.masterJobForm.get('ETD')?.setValue(null);
      this.masterJobForm.get('PortCutoffDate')?.setValue(null);
      this.masterJobForm.get('VoyageMasterSid')?.setValue(null);
      return;
    }

    console.log('Selected voyage for PortCutoffDate:', voyage);

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
      console.log('Setting PortCutoffDate from PortCutoff:', voyage.PortCutoff);
      this.masterJobForm.get('PortCutoffDate')?.setValue(new Date(voyage.PortCutoff));
    } else if (voyage.PortCutoffDate) {
      console.log('Setting PortCutoffDate from PortCutoffDate:', voyage.PortCutoffDate);
      this.masterJobForm.get('PortCutoffDate')?.setValue(new Date(voyage.PortCutoffDate));
    }

    // Also check voyage.Ports array for port-specific cutoff
    if (voyage.Ports && Array.isArray(voyage.Ports)) {
      const POL = this.masterJobForm.get('POL')?.value;
      const polDetail = voyage.Ports.find((p: any) => p.POLSid === POL);

      if (polDetail?.PortCutoff) {
        console.log('Setting PortCutoffDate from port detail:', polDetail.PortCutoff);
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

  onSubmit(): void {
    if (this.masterJobForm.invalid) {
      this.toastr.error('Please fill all required fields');
      this.masterJobForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    //   const exportImportType = this.selectedDepartment?.ExportImport;
    // const hblNo = houseJobFormValue.HBLNo;
    // if (exportImportType === 'Import' && (!hblNo || hblNo.trim() === '')) {
    //   this.appSettingService.showWarning('HBL Number is required for Import operations. Please enter a valid HBL Number.');

    //   // Focus on HBLNo field
    //   const hblNoElement = document.querySelector('[formControlName="HBLNo"]');
    //   if (hblNoElement) {
    //     (hblNoElement as HTMLElement).focus();
    //   }

    //   return;
    // }

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
      CarrierRef: formValue.CarrierRef,
      AgentRef: formValue.AgentRef,
      ExportDoDate: formValue.ExportDoDate,
      SOBDate: formValue.SOBDate,
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

      CreatedBy: this.appSettingsService.userSettingSource.value['userEmail'],
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: Number(localStorage.getItem('currentMenuId')),
    };

    // Add shipment list if needed
    const allShipments = (this.attachedBookings.getRawValue() || [])
      .filter(ship => !ship.MasterJobSid)
      .map(shipment => {
        return {
          BookingHeaderSid: shipment.BookingHeaderSid,
          HBLNo: shipment.HBLNo,
        }
      });
    formData['shipmentList'] = [...allShipments];

    // Debug to check the payload
    console.log('Form Data to be saved:', formData);
    console.log('Others data:', othersData);

    if (this.isEditMode && this.masterJobSid) {
      formData.MasterJobSid = this.masterJobSid;
      this.operationService.updateMasterJob(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status) {
            this.toastr.success('Master Job updated successfully');
            this.resetDirtyState();
            this.loadMasterJobData(this.masterJobSid);
          } else {
            this.toastr.error(response.message || 'Failed to update Master Job');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to update Master Job');
          console.error('Error updating master job:', error);
        }
      });
    } else {
      this.operationService.createMasterJob(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status) {
            this.toastr.success('Master Job created successfully');
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
          } else {
            this.toastr.error(response.message || 'Failed to create Master Job');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to create Master Job');
        }
      });
    }
  }
  handleCustomsChange(event: any) {
    console.log('BOE Data from child:', event);
    // You can process and save event data here
  }

  onContainerSubmit(): void {
    if (this.containerFormGroup.valid) {
      const containerData = this.containerFormGroup.value;
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
          IsSoc: containerData.IsSoc
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
      MasterJobContainerSid: container.MasterJobContainerSid
    }));
  }

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
    this.masterJobForm.reset({
      BLReleaseType: 'Original',
      NoofOriginal: 3,
      WeightIn: 'Kg(s)',
      Haz: false,
      FreightPPCC: 'Prepaid'
    });

    this.connections.clear();
    this.masterJobContainers.clear();
    this.costRevenueCharges.clear();
    this.containerActivities.clear();

    // Reset vessel search state
    this.headerVesselList = [];
    this.voyageList = [];
    this.lastVesselSearchParams = null;
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
      });
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
    const containerControl = this.masterJobContainers.at(index);
    const containerSid = containerControl.value.MasterJobContainerSid;
    const containerNumber = containerControl.value.ContainerNumber;
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

        this.operationService.softDeleteMasterJobContainer(containerSid).subscribe({
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
    // const CustomerMasterSid = this.b['CustomerMasterSid']?.value;
    // const CustomerBranchSid = this.b['CustomerBranchSid']?.value;
    // const BookingHeaderSid = this.BookingHeaderSid || this.bookingData?.BookingHeaderSid || this.b['BookingHeaderSid']?.value;

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      MasterJobNumber,
      ParentSid: this.masterJobSid,
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
      countryOfCompany: this.countryOfCompany
    }
  }

  // Add connection change handler
  handleConnectionChange(allConnections: any[]) {
    console.log('Connections changed:', allConnections);
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
    if (allRates && allRates.length > 0) {
      this.rateResult = [...allRates];
      this.markAsDirty();
    }
  }

  // Add sync method for Edoc
  syncFormValueWithEdocComponent() {
    console.log('🔍 === syncFormValueWithEdocComponent START ===');

    // Log all relevant properties
    console.log('📋 Current Component State:');
    console.log('  - masterJobSid:', this.masterJobSid);
    console.log('  - MenuMasterSid:', this.MenuMasterSid);
    console.log('  - currentCompany:', this.currentCompany);
    console.log('  - currentBranch:', this.currentBranch);
    console.log('  - isEditMode:', this.isEditMode);

    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    const MasterJobNumber = this.masterJobForm.get('MasterJobNumber')?.value;

    console.log('📊 Form Values:');
    console.log('  - CompanyMasterSid:', CompanyMasterSid);
    console.log('  - DepartmentMasterSid:', DepartmentMasterSid);
    console.log('  - MasterJobNumber:', MasterJobNumber);

    this.currentEdocFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      DocumentSid: this.masterJobSid || 0,
      MasterJobNumber: MasterJobNumber,
    };

    console.log('📄 currentEdocFormValue:', this.currentEdocFormValue);

    const data: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.masterJobSid,
    };

    console.log('🚀 Data being set to commonService:');
    console.log('  - CompanyMasterSid:', data.CompanyMasterSid);
    console.log('  - BranchMasterSid:', data.BranchMasterSid);
    console.log('  - MenuMasterSid:', data.MenuMasterSid);
    console.log('  - DocumentSid:', data.DocumentSid);

    // Check if any values are null/undefined
    const missingFields = [];
    if (!data.CompanyMasterSid) missingFields.push('CompanyMasterSid');
    if (!data.BranchMasterSid) missingFields.push('BranchMasterSid');
    if (!data.MenuMasterSid) missingFields.push('MenuMasterSid');
    if (!data.DocumentSid && data.DocumentSid !== 0) missingFields.push('DocumentSid');

    if (missingFields.length > 0) {
      console.warn('⚠️  Missing fields:', missingFields);
    } else {
      console.log('✅ All fields are present');
    }

    console.log('📤 Setting data to commonService.documentData...');
    this.commonService.documentData.set(data);

    // Verify the data was set
    const currentData = this.commonService.documentData();
    console.log('✅ Data in commonService after set:', currentData);

    console.log('🔍 === syncFormValueWithEdocComponent END ===');
  }

  // Add handler for Edoc data changes
  handleEdocChange(event: any) {
    console.log('📨 === handleEdocChange START ===');
    console.log('Event received:', event);

    this.edocData = event.dataItems || [];
    this.currentEdocFormValue = event.formData;

    console.log('📊 Updated edocData:', this.edocData);
    console.log('📊 Updated currentEdocFormValue:', this.currentEdocFormValue);
    console.log('📨 === handleEdocChange END ===');
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
    console.log("Email data updated:", this.emailData);
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
    console.log('Container Activities received from component:', activities);

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

    console.log('Updated containerActivityData:', this.containerActivityData);
    console.log('Updated form array length:', containerActivitiesFormArray.length);
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
  loadCustomsData() {
    if (!this.masterJobSid) return;

    this.operationService.getCustomsByMasterJobSid(this.masterJobSid).subscribe({
      next: (data: any[]) => {
        this.customsDataArray = data || [];
        this.syncFormValueWithCustomsComponent();
      },
      error: (error) => {
        console.error('Error loading customs data:', error);
        this.customsDataArray = [];
      }
    });
  }

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

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.masterJobSid) return;

    this.operationService.getAuditLogsmasterjob(
      'MasterJob',
      this.masterJobSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['updatedOn', 'updatedBy'];

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key))
            .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
        };

        this.auditLogs = logs
          .map(log => ({
            ...log,
            oldValDisplay: formatFields(log.oldVal),
            newValDisplay: formatFields(log.newVal),
          }))
          .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

        this.auditLogModalRef = this.modalService.open(modal, {
          centered: true,
          scrollable: true,
          windowClass: 'audit-log-modal'
        });
      },
      error: err => console.error('Error fetching audit logs:', err)
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
      BookingHeaderSid: [data?.BookingHeaderSid || ''],
      BookingNo: [data?.BookingNo || '', Validators.required],
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
    console.log('slicedAttachedBookings', this.slicedAttachedBookings)
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
    console.log(shipments, 'shipments')
    shipments.forEach(shipment => {
      const formGrp = this.createShipmentGroup(shipment)
      console.log(formGrp);
      this.attachedBookings.push(formGrp);
    });
    this.totalLengthOfAttachedBookings = this.attachedBookings.length;
    console.log(this.totalLengthOfAttachedBookings, 'totalLengthOfAttachedBookings')
    this.updateAttachedBookingsPagination();
    this.getTranshipmentList();
  }


  transhipmentHouseJobSids: number[] = [];
  getTranshipmentList() {
    // ✅ Reset first
    this.isTranshipment = false;
    this.transhipmentHouseJobSids = [];

    console.log('🔍 Checking bookingItems:', this.bookingItems);

    this.bookingItems.forEach(item => {
      const departmentName = this.getDepartmentName(item.DepartmentMasterSid);

      console.log('📋 Item:', {
        DepartmentMasterSid: item.DepartmentMasterSid,
        DepartmentName: departmentName,
        JobType: item.JobType,
        HouseJobSid: item.HouseJobSid
      });

      // Make comparison case-insensitive and trim whitespace
      const normalizedDepartment = departmentName?.trim().toLowerCase();
      const normalizedJobType = item.JobType?.trim().toLowerCase();

      if (normalizedDepartment === 'lcl import' && normalizedJobType === 'transhipment') {
        this.isTranshipment = true;
        this.transhipmentHouseJobSids.push(item.HouseJobSid);
        console.log('✅ Found transhipment item!');
      }
    });

    console.log('🎯 Final State:', {
      isTranshipment: this.isTranshipment,
      transhipmentHouseJobSids: this.transhipmentHouseJobSids
    });

    if (this.transhipmentHouseJobSids.length) {
      this.loadAllHouses();
    }
  }


  loadedHouses: any[] = [];

  loadAllHouses() {
    this.loadedHouses = [];

    this.transhipmentHouseJobSids.forEach(id => {
      this.operationService.getHouseJobById(id).subscribe((resp: any) => {
        if (resp.status && resp.data) {
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


  detachBooking(shipmentIndex: number, booking: any) {
    const realIndex = ((this.page - 1) * this.pageSize) + shipmentIndex;
    console.log(booking);
    const HouseJobSid = booking.HouseJobSid;
    console.log(HouseJobSid);
    if (HouseJobSid) {
      this.operationService.detachBooking(HouseJobSid).subscribe
        ({
          next: (resp: any) => {
            if (resp.status) {
              this.appSettingsService.showSuccess('Booking detached successfully');
              this.attachedBookings.removeAt(realIndex);
              this.totalLengthOfAttachedBookings = this.attachedBookings.length;
              this.updateAttachedBookingsPagination();
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
    const value = this.masterJobForm.value;
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
      this.modalService.dismissAll();
    });
  }

  hasEveryRequiredFieldsFilled(requiredFields: string[], group: FormGroup): boolean {
    const formValue = group.value;
    return requiredFields.every(field => formValue[field] !== null && formValue[field] !== undefined && group.get(field)?.valid);
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
    console.log(shipment, 'shipment');
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

  /**
   * Open report modal using the generic report system
   * @param reportType Report type ID (e.g., 'master-job-pre-alert')
   */
  openReport(reportType: string): void {
    // const masterJobSid = this.masterJobForm.get('MasterJobSid')?.value;
    const masterJobSid = this.masterJobSid;


    if (!masterJobSid) {
      this.toastr.error('Please save the master job first before generating reports', 'Error');
      return;
    }

    this.reportService.openReportModal(reportType, masterJobSid);
  }
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
  //   console.log(this.getChargeName,"CHARGE ")
  //   if (!ChargeMasterSid || this.chargeList.length === 0) {
  //     return '';
  //   }
  //   return (this.chargeList.find(charge => charge.ChargeMasterSid === ChargeMasterSid)?.chargeCode);
  // }

  // Add this method to your component
  getCurrencyName(CurrencyMasterSid: number): string {
    console.log('🔍 getCurrencyName called with:', CurrencyMasterSid);
    console.log('📋 currencyList:', this.currencyList);

    if (!CurrencyMasterSid || !this.currencyList || this.currencyList.length === 0) {
      return 'N/A';
    }

    const currency = this.currencyList.find(c => c.CurrencyMasterSid === CurrencyMasterSid);
    return currency ? (currency.currencyCode || currency.CurrencyCode || 'N/A') : 'N/A';
  }


  getAgentBranchName(AgentSid: number): string {
    console.log('🔍 Looking up AgentBranchSid:', AgentSid);

    if (!AgentSid || !this.agentList || this.agentList.length === 0) {
      return 'N/A';
    }

    const agent = this.agentList.find(a => a.CustomerMasterSid === AgentSid);

    if (agent) {
      return agent.CustomerName || agent.customerName || 'N/A';
    }

    return 'N/A';
  }

  reportPreAlertModel() {
    if (this.selectedFCLLCL === "FCL" || this.selectedFCLLCL === "LCL") {
    // Check if any products have ContainerMasterSid mapped
    const hasContainerMapping = this.masterJobData?.Products?.some(
      (product: any) => product.MasterJobContainerSid && product.MasterJobContainerSid > 0
    );
    
    if (!hasContainerMapping) {
      this.appSettingService.showWarning(
        'ContainerNo is required. '
        
      );
      return;
    } 
  }
    const modalRef = this.modalService.open(PreAlertComponent, {
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.containerTypeList = this.containerTypeList;
    modalRef.componentInstance.masterJobContainers = this.masterJobData.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
    modalRef.componentInstance.agentList = this.agentList;
    modalRef.componentInstance.yardList = this.yardList;
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL;
  }

  reportcargomanifest() {
    const modalRef = this.modalService.open(CargoManifestComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.containerTypeList = this.containerTypeList;
    modalRef.componentInstance.masterJobContainers = this.masterJobData.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;
    modalRef.componentInstance.agentList = this.agentList;
    modalRef.componentInstance.yardList = this.yardList;
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL;

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
  }

  reportCFSoutturn() {
    const modalRef = this.modalService.open(CfsOutturnComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.cfsList = this.cfsList || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobData?.containers || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.agentList = this.agentList || [];
    modalRef.componentInstance.yardList = this.yardList || [];
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



  reportMBLBill(type:'MBL' | 'MBLDraft') {
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

  }


  calculateChargeWiseProfit() {
    this.profitSummary = [];
    const rateFormValue = this.rateResult || [];
    const data = [...rateFormValue];

    data.forEach(item => {
      console.log(item);
      const costAmt = parseFloat(item.CostLocalAmount);
      const revenueAmt = parseFloat(item.RevenueLocalAmount);
      const charge = this.chargeList.find(c => c.ChargeMasterSid === item.ChargeMasterSid);
      const chargeName = charge ? charge.chargeName : "";

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

    console.log(this.profitSummary);
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
    console.log("Cost Summary:", costHmap);
    console.log("Revenue Summary:", revenueHmap);

    this.customerWiseSummary = {
      cost: Array.from(costHmap.values()),
      revenue: Array.from(revenueHmap.values())
    };
  }
  navigateToHouseJobCreation(): void {
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
      POOCode : this.getPortCode(this.masterJobForm.get('POO')?.value),
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



  loadHSSACLookups() {
    this.operationService.getAllHssac().subscribe({
      next: (resp: any) => {
        this.hssacList = resp || [];
        console.log('HSSAC List loaded:', this.hssacList);
      },
      error: (err) => {
        console.error('Error loading HSSAC data:', err);
        this.hssacList = [];
      }
    });
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
      fileName: `ARAP-Report-MasterJob-${this.masterJobData?.MasterJobNumber || 'Unknown'}`,
      title: 'AR/AP Report'
    });
  }

  printARAPReport() {
    // Implement print functionality
    window.print();
  }

 bookingCreateInMasterJob() {
  const bookingPayload = {
    houses: this.loadedHouses,
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

      // ✅ Case 1: At least one booking created
      if (successList.length > 0) {
        this.appSettingService.showSuccess(
          `${successList.length} booking(s) created successfully`
        );
      }

      // ℹ️ Case 2: All houses already have booking
      else if (duplicateList.length > 0 && successList.length === 0) {
        this.appSettingService.showInfo(
          'All selected house jobs already have bookings'
        );
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
    modalRef.componentInstance.idLabel = 'Booking Id';
    modalRef.componentInstance.idValue = this.masterJobData?.MasterJobSid;
  }
  generateEDIManifest() {
    if (!this.masterJobSid) {
      this.toastr.error('Master Job ID not found');
      return;
    }

    this.spinner.show();
    this.operationService.generateMasterJobEDIManifest(this.masterJobSid).subscribe({
      next: (response: string) => {
        this.spinner.hide();

        // Create blob and download
        const blob = new Blob([response], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EDI_Manifest_${this.masterJobForm.get('MasterJobNumber')?.value || 'MasterJob'}_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.toastr.success('EDI Manifest generated successfully');
      },
      error: (error) => {
        this.spinner.hide();
        this.handleEDIValidationError(error);
      }
    });
  }

  /**
   * Handle EDI Manifest validation errors from backend
   */
  private handleEDIValidationError(error: any) {
    // Check if this is a validation error with field list
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      this.validationErrors = error.error.errors;
      this.groupEDIErrorsByHBL();
      this.showValidationModal = true;
    } else {
      // Generic error
      this.toastr.error(error.error?.message || 'Failed to generate EDI Manifest');
    }
  }

  /**
   * Group validation errors by HBL number first, then by record type for user-friendly display
   */
  private groupEDIErrorsByHBL() {
    this.groupedByHBL = {};
    const recordTypeLabels: { [key: string]: string } = {
      'VOY': 'Voyage Details',
      'BOL': 'Bill of Lading',
      'CON': 'Consignment Details',
      'CTR': 'Container Details'
    };

    for (const error of this.validationErrors) {
      // Use 'Common' for errors without HBL (like VOY record)
      const hblKey = error.hblNo || 'Common Fields';
      const recordLabel = recordTypeLabels[error.recordType] || error.recordType;

      if (!this.groupedByHBL[hblKey]) {
        this.groupedByHBL[hblKey] = {};
      }
      if (!this.groupedByHBL[hblKey][recordLabel]) {
        this.groupedByHBL[hblKey][recordLabel] = [];
      }
      this.groupedByHBL[hblKey][recordLabel].push(error);
    }
  }

  /**
   * Get HBL keys for template iteration (Common Fields first, then HBL numbers)
   */
  getHBLKeys(): string[] {
    const keys = Object.keys(this.groupedByHBL);
    // Sort to put 'Common Fields' first
    return keys.sort((a, b) => {
      if (a === 'Common Fields') return -1;
      if (b === 'Common Fields') return 1;
      return a.localeCompare(b);
    });
  }

  /**
   * Get record type keys for a specific HBL
   */
  getRecordTypeKeys(hblNo: string): string[] {
    if (!this.groupedByHBL[hblNo]) return [];
    // Sort by record type order: VOY, BOL, CON, CTR
    const order = ['Voyage Details', 'Bill of Lading', 'Consignment Details', 'Container Details'];
    return Object.keys(this.groupedByHBL[hblNo]).sort((a, b) => {
      return order.indexOf(a) - order.indexOf(b);
    });
  }

  /**
   * Close validation modal
   */
  closeValidationModal() {
    this.showValidationModal = false;
    this.validationErrors = [];
    this.groupedErrors = {};
    this.groupedByHBL = {};
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
    
    console.log('🔍 Checking invoice status for shipment:', shipment);
    console.log('📋 Shipment HBLNo:', shipment?.HBLNo);
    
    // First, try to find the corresponding house job from masterJobData
    let houseJobData = null;
    
    if (this.masterJobData?.houseJob && shipment?.HBLNo) {
        houseJobData = this.masterJobData.houseJob.find(
            (hj: any) => hj.HBLNo === shipment.HBLNo
        );
        console.log('📊 Found houseJobData:', houseJobData);
    }
    
    // Use houseJobData if found, otherwise use shipment data
    const dataToCheck = houseJobData || shipment;
    
    // Check if costRevenueCharges exists and is an array with items
    if (!dataToCheck || !dataToCheck.costRevenueCharges || !Array.isArray(dataToCheck.costRevenueCharges)) {
        console.log('❌ No costRevenueCharges table available or not an array');
        this.invoiceStatusCache.set(cacheKey, 'no-cost-charges');
        return 'no-cost-charges';
    }
    
    if (dataToCheck.costRevenueCharges.length === 0) {
        console.log('⚠️ costRevenueCharges array is empty');
        this.invoiceStatusCache.set(cacheKey, 'no-cost-charges');
        return 'no-cost-charges';
    }
    
    console.log('📋 costRevenueCharges items:', dataToCheck.costRevenueCharges.length);
    
    // Check each costRevenueCharge for revenue voucher
    let hasRevenueVoucher = false;
    let voucherDetails = null;
    
    for (const charge of dataToCheck.costRevenueCharges) {
        console.log('🔍 Checking charge:', {
            RevenueVoucherHeaderSid: charge.RevenueVoucherHeaderSid,
            revenueVoucherHeader: charge.revenueVoucherHeader
        });
        
        if (charge.RevenueVoucherHeaderSid || charge.revenueVoucherHeader?.VoucherHeaderSid) {
            hasRevenueVoucher = true;
            voucherDetails = charge.revenueVoucherHeader || { VoucherHeaderSid: charge.RevenueVoucherHeaderSid };
            console.log('✅ Found revenue voucher:', voucherDetails);
            break;
        }
    }
    
    if (!hasRevenueVoucher) {
        console.log('⚠️ No revenue voucher found in costRevenueCharges');
        this.invoiceStatusCache.set(cacheKey, 'pending');
        return 'pending';
    }
    
    // Check if revenueVoucherHeader has a value
    const voucherHeaderSid = voucherDetails?.VoucherHeaderSid;
    
    let result: string;
    if (voucherHeaderSid && voucherHeaderSid !== null && voucherHeaderSid !== undefined) {
        console.log('✅ Invoice generated with VoucherHeaderSid:', voucherHeaderSid);
        result = 'generated';
    } else {
        console.log('❌ RevenueVoucherHeaderSid is null/undefined');
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
  /**
   * Get grouped error keys for template iteration
   */
  getGroupedErrorKeys(): string[] {
    return Object.keys(this.groupedErrors);
  }

  getFormattedPort(code: string) {
    console.log(code);
    if (!code) return '';
    const ourPort = (this.portList.find(p => p.PortCode === code))?.PortName;
    console.log(ourPort);
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
  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe((resp: any) => {
      if (resp.status) {
        this.TandCList = resp.data;
        const modelRef = this.modalService.open(TermsAndConditionsComponent, {
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });
        modelRef.componentInstance.terms = this.TandCList;
        modelRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modelRef.componentInstance.DocumentSid = this.masterJobData?.MasterJobSid;
      } else {
        this.appSettingService.showError('Error loading Terms and Conditions');
      }
    }, (error) => {
      this.appSettingService.showError('Error loading Terms and Conditions', error);
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


  navigateToMasterJob() {
    this.router.navigate(['operation/master-job/entry']);
  }
}


interface CustomerProfit {
  CustomerName: string,
  Amount: number
}
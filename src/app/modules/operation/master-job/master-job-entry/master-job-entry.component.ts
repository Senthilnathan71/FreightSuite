import { Component, ViewChild, TemplateRef, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
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
import { CommonModule, NgComponentOutlet } from '@angular/common';
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
import { ReportService } from 'src/app/shared/services/report.service';
import { PreAlertComponent } from '../reports/pre-alert/pre-alert.component';
import { ReleaseLetterComponent } from '../reports/release-letter/release-letter.component';
import { ReleaseOrderComponent } from '../reports/release-order/release-order.component';
import { PackingListComponent } from '../reports/packing-list/packing-list.component';
import { CargoManifestComponent } from '../reports/cargo-manifest/cargo-manifest.component';
import { JobCardComponent } from '../reports/job-card/job-card.component';
import { SailingConfirmationComponent } from '../reports/sailing-confirmation/sailing-confirmation.component';
import { MblComponent } from '../reports/mbl/mbl.component';
@Component({
  selector: 'app-master-job-entry',
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
  templateUrl: './master-job-entry.component.html',
  styleUrls: ['./master-job-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    NgbActiveModal,
    CustomDatePipe
  ],
})
export class MasterJobEntryComponent implements OnInit, OnDestroy {


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

  masterJobForm: FormGroup;
  isEditMode = false;
  masterJobSid: number | null = null;
  isLoading = false;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  filterOption: any;
  isEditContainer = false;
  editingContainerIndex: number | null = null;
  containerFormGroup!: FormGroup;
  currentContainerModal: any;
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
  decimalAfterPrecision = 3;
  chargeList: any[] = [];
  filteredDestinationAgents: any[] = [];
  filteredOriginAgents: any[] = [];
  packageTypeList: any[] = [];

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

  tabs = [
    { name: 'Master', icon: 'fas fa-database' },
    { name: 'Container', icon: 'fas fa-boxes' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
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
    private operationService: OperationService,
    private toastr: ToastrService,
    private appSettingsService: AppSettingsService,
    private cdr: ChangeDetectorRef,
    private datepipe: CustomDatePipe,
    private spinner: NgxSpinnerService,
    private commonService: CommonService,
    private reportService: ReportService,
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
        this.syncFormValueWithFollowUpComponent();
        this.syncFormValueWithEdocComponent();
        this.syncFormValueWithEmailComponent();
        this.syncFormValueWithContainerActivityComponent();
      });

  }

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
      CutOffDate: data.CutOffDate ? new Date(data.CutOffDate) : null,
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
    this.onVesselChange({ VesselName: data.VesselName });
    this.getVoyageForPortsAndVessels();

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

      // Added fields for cut offs
      CutOffDate: [null],
      SICutOff: [''],

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
      ContainerNumber: ['', [Validators.required, Validators.maxLength(11)]],
      LineSeal: ['', Validators.maxLength(10)],
      CustomsSeal: ['', Validators.maxLength(10)],
      HsCode: ['', Validators.maxLength(10)],
      CommodityDescription: ['', Validators.maxLength(500)],
      PkgType: [null],
      NoOfPkg: [0, [Validators.min(0)]],
      GrossWeight: [0, [Validators.min(0)]],
      NetWeight: [0, [Validators.min(0)]],
      ChargeableWeight: [0, [Validators.min(0)]],
      Volume: [0, [Validators.min(0)]],
      IsSoc: [false]
    });
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
    this.operationService.getMasterJobById(masterJobSid).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          const data = response.data;
          this.masterJobData = response.data;
          console.log("Master Job Data", this.masterJobData);
          console.log('API Response Data:', data);
          console.log('Others Data:', data.others);
          console.log('CurrencyCode in others:', data.others?.[0]?.CurrencyCode);
          this.patchFormValues(data);
        }
        this.isLoading = false;
        this.spinner.hide();
      },
      error: (error) => {
        this.toastr.error('Failed to load master job data');
        console.error('Error loading master job:', error);
        this.isLoading = false;
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


    // Patch master job fields
    this.masterJobForm.patchValue({
      DepartmentMasterSid: data.DepartmentMasterSid,
      MasterJobNumber: data.MasterJobNumber,
      MasterJobDate: data.MasterJobDate ? new Date(data.MasterJobDate) : null,
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
    });
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
      // Filter out voyages with null VoyageMasterSid and get the most recent one
      const validVoyages = data.voyages.filter(voyage => voyage.VoyageMasterSid !== null);

      let voyage;
      if (validVoyages.length > 0) {
        // Use the voyage with the highest MasterJobVoyageSid (most recent)
        voyage = validVoyages.reduce((latest, current) =>
          current.MasterJobVoyageSid > latest.MasterJobVoyageSid ? current : latest
        );
      } else {
        // If no voyages with VoyageMasterSid, use the first one
        voyage = data.voyages[0];
      }

      console.log('Selected voyage for patching:', voyage);

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
    if (!pkgTypeSid) return 'Unknown';
    const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
    return packageType ? packageType.UOMName : 'Unknown';
  }

  setAddress(controlName: string, item: any) {
    this.masterJobForm.get(controlName)?.setValue(item ? item.CustomerAddress1 : '');
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
      return;
    }

    this.selectedDepartmentType = department.departmentType?.toUpperCase() || '';
    this.selectedFCLLCL = this.selectedDepartmentType === "SEA" ?
      (department.FCLLCL?.toUpperCase() || "LCL") : "AIR";

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
      return;
    }
    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
    this.masterJobForm.get('POD')?.setValue(selectedPortSid, { emitEvent: false });
    this.triggerVesselSearch();
  }

  private clearVesselAndVoyageData(): void {
    this.masterJobForm.get('VesselName')?.setValue(null);
    this.masterJobForm.get('VoyageNo')?.setValue(null);
    this.masterJobForm.get('ETA')?.setValue('');
    this.masterJobForm.get('ETD')?.setValue('');
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
            // Store original dates for auto-population
            originalETD: vslVoy.ETD,
            originalETA: vslVoy.ETA
          }));

          if (this.headerVesselList.length === 0) {
            this.toastr.warning("No Vessel/Voyage has been scheduled for the requested route.");
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
      this.masterJobForm.get('ETA')?.setValue('');
      this.masterJobForm.get('ETD')?.setValue('');
      return;
    }

    // Set vessel name
    this.masterJobForm.get('VesselName')?.setValue(vessel.VesselName);

    // Get voyages for the selected vessel and ports
    this.getVoyageForPortsAndVessels();

    // If vessel has voyage data, auto-populate
    if (vessel.VoyageNo) {
      this.masterJobForm.patchValue({
        VoyageNo: vessel.VoyageNo,
        ETA: vessel.ETA ? new Date(vessel.ETA) : null,
        ETD: vessel.ETD ? new Date(vessel.ETD) : null
      });
    }
  }

  getVoyageForPortsAndVessels() {
    const POL = this.masterJobForm.get('POL')?.value;
    const POD = this.masterJobForm.get('POD')?.value;
    const vessel = this.masterJobForm.get('VesselName')?.value;

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
            // Format the voyage data similar to booking component
            return {
              VoyageNo: voyage.VoyageNo,
              ETD: voyage.ETD ? new Date(voyage.ETD) : null,
              ETA: voyage.ETA ? new Date(voyage.ETA) : null,
              VoyageMasterHeaderSid: voyage.VoyageMasterHeaderSid,
              VesselName: voyage.VesselName,
              // Include port information for display
              POL: polPort,
              POD: podPort
            };
          });

          // Auto-select if only one voyage exists
          if (this.voyageList.length === 1) {
            this.onVoyageChange(this.voyageList[0]);
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
      this.masterJobForm.get('ETA')?.setValue('');
      this.masterJobForm.get('ETD')?.setValue('');
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

    // Auto-set ETD and ETA from voyage data
    if (voyage.ETD) {
      this.masterJobForm.get('ETD')?.setValue(new Date(voyage.ETD));
    }

    if (voyage.ETA) {
      this.masterJobForm.get('ETA')?.setValue(new Date(voyage.ETA));
      this.minStartDate = new Date(voyage.ETA); // Set min date for connections
    }

    // If voyage has specific port ETD/ETA, use those
    const POL = this.masterJobForm.get('POL')?.value;
    const POD = this.masterJobForm.get('POD')?.value;

    if (voyage.Ports && Array.isArray(voyage.Ports)) {
      const polDetail = voyage.Ports.find((p: any) => p.POLSid === POL);
      const podDetail = voyage.Ports.find((p: any) => p.PODSid === POD);

      if (polDetail?.ETD) {
        this.masterJobForm.get('ETD')?.setValue(new Date(polDetail.ETD));
      }

      if (podDetail?.ETA) {
        this.masterJobForm.get('ETA')?.setValue(new Date(podDetail.ETA));
        this.minStartDate = new Date(podDetail.ETA);
      }
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

    const getPortCode = (portSid: any): string => {
      if (!portSid && portSid !== 0) return '';
      const port = this.portList.find(p => p.PortMasterSid === portSid);
      return port ? port.PortCode : portSid?.toString().substring(0, 100);
    };

    const formValue = this.masterJobForm.value;
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
            this.router.navigate(['/operation/master-job/list']);
          } else {
            this.toastr.error(response.message || 'Failed to create Master Job');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Failed to create Master Job');
          console.error('Error creating master job:', error);
        }
      });
    }
  }


  onContainerSubmit(): void {
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
        });
      } else {
        // Add new container - MasterJobContainerSid will be null for new containers
        this.addContainer(containerData);
      }

      this.currentContainerModal.close();

    } else {
      this.toastr.error('Please fill all required container fields');
      this.containerFormGroup.markAllAsTouched();
    }
  }

  // Helper methods
  getContainerTypeName(ContainerTypeMasterSid: number): string {
    const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
    return containerType ? containerType.ContainerName : 'Unknown';
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

  removeContainer(index: number): void {
    this.masterJobContainers.removeAt(index);
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
    }
  }

  syncFormValueWithRateComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const MasterJobNumber = this.masterJobForm.get('MasterJobNumber')?.value;
    const MBLNo = this.masterJobForm.get('MBLNo')?.value;
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
    }
  }


  syncFormValueWithFollowUpComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;

    this.currentFollowUpFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      DocumentSid: this.masterJobSid || 0, // Use 0 for new records
      MasterJobNumber: this.masterJobForm.get('MasterJobNumber')?.value,
    };
  }

  handleFollowUpChange(event: any) {
    console.log('Follow Up Changed:', event);
    this.followUpData = event.dataItems || [];
    this.currentFollowUpFormValue = event.formData || null;
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
      JobType: [data?.JobType || '']
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

      if (normalizedDepartment === 'lcl export' && normalizedJobType === 'transhipment') {
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
          this.loadedHouses.push(resp.data);
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

  getPortCode(portSid: number) {
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



  reportMBLBill() {
    const modalRef = this.modalService.open(MblComponent, {
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.masterJobData = this.masterJobData;
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
    modalRef.componentInstance.agentList = this.agentList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList;

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
      const customerName = item.costCustomerMaster?.CustomerName || "Unknown";
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
      const customerName = item.revenueCustomerMaster?.CustomerName || "Unknown";
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
  navigateTohouseJob() {
    this.router.navigate(['operation/house-job/entry']);
  }
  

  bookingCreateInMasterJob() {
    const bookingPayload = {
      houses: this.loadedHouses,  // ✅ send all houses
      createdBy: this.appSettingsService.userSettingSource.value['userEmail']
    };

    this.operationService.createBookingFromMasterJob(bookingPayload).subscribe({
      next: (results: any) => {
        this.spinner.hide();

        if (results.status) {
          this.toastr.success('Booking created successfully');
        } else {
          this.toastr.error(results.message || 'Failed to create booking');
        }
      },
      error: () => {
        this.spinner.hide();
        this.toastr.error('Failed to create booking');
      }
    });
  }
}
interface CustomerProfit {
  CustomerName: string,
  Amount: number
}
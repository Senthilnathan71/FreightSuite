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
    NgbPaginationModule
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
  private vesselSearchSubject = new Subject<{POL: string | number, POD: string | number, MovementType: string}>();
  private isLoadingVessels = false;
  private lastVesselSearchParams: {POL: string | number, POD: string | number, MovementType: string} | null = null;

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
  filterOption: any;
  isEditContainer = false;
  editingContainerIndex: number | null = null;
  containerFormGroup!: FormGroup;
  currentContainerModal: any;
  
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
  filteredDestinationAgents: any[] = [];
  filteredOriginAgents: any[] = [];
  packageTypeList: any[] = [];
  
  // Department info
  selectedDepartment: any;
  selectedDepartmentType: string = '';
  selectedFCLLCL: string = '';

  
  connectionResult : any[] =[];
  connectionResetTrigger = false;
  masterjobConnectionArr:any[]=[];
  currentFormValue: any;
  customerList: any[] = []; 
  rateResult: any[] = [];
  masterJobRateArr : any[] = [];
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

  // Shipment related variable declarations
  attachedBookings : FormArray;
  slicedAttachedBookings : any[] = [];
  page = 1;
  pageSize = 5;
  totalLengthOfAttachedBookings : number = 0;
  

  
  tabs = [
    { name: 'Master', icon: 'fas fa-database' },
    { name: 'Container', icon: 'fas fa-boxes' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Mail', icon: 'fas fa-envelope' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Container Activity', icon: 'fas fa-shipping-fast' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
    { name: 'History', icon: 'fas fa-history' },
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
    { name: 'History', icon: 'fas fa-history' },
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
  
  selectedTab = 'Master';
  selectedTab1 = 'Product';

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private operationService: OperationService,
    private toastr: ToastrService,
    private appSettingsService: AppSettingsService,
    private cdr: ChangeDetectorRef,
    private datepipe : CustomDatePipe
  ) {
    this.initForm();
    this.initContainerForm();
    this.attachedBookings = this.fb.array([]);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingsService.decrypt(localStorage.getItem('selected-branch'));

    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };

    // Setup debounced vessel search
    this.setupVesselSearchDebouncing();

    this.loadInitialData().subscribe(() => {
      const loadingPlanData = this.operationService.getLoadingPlanData();
      if(loadingPlanData){
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

  patchLoadingPlanData(data : any){
    console.log(data);
    const selectedDepartment = this.departments.find(dep => dep.DepartmentMasterSid === data.DepartmentMasterSid);
    selectedDepartment ? this.onDeptChange(selectedDepartment) : null;
    const selectedPOL = this.portList.find(port => port.PortCode === data.POL);
    selectedPOL ? this.handlePOLChange(selectedPOL) : null;
    const selectedPOD = this.portList.find(port => port.PortCode === data.POD);
    selectedPOD ? this.handlePODChange(selectedPOD) : null;
    
    this.masterJobForm.patchValue({
      DepartmentMasterSid : data.DepartmentMasterSid,
      POL : selectedPOL.PortMasterSid,
      POD : selectedPOD.PortMasterSid,
      VoyageMasterSid : data.VoyageMasterSid,
      VesselName : data.VesselName,
      VoyageNo : data.VoyageNo,
      CarrierName : data.CarrierName,
      CutOffDate : data.CutOffDate ? new Date(data.CutOffDate) : null,
      ETD : data.ETD ? new Date(data.ETD) : null,
      ETA : data.ETA ? new Date(data.ETA) : null,
      Haz : data.Haz === 'Y',
      NoOfPkg : data.NoofPkg,
      GrossWeight : data.GrossWeight,
      NetWeight : data.NetWeight,
      Volume : data.Volume,
    });

    this.handlePOLChange(selectedPOL);
    this.handlePODChange(selectedPOD);
    this.onVesselChange({VesselName : data.VesselName});
    this.getVoyageForPortsAndVessels();

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
  }

  initForm() {
    this.masterJobForm = this.fb.group({
      // Master Job fields
      DepartmentMasterSid: ['', Validators.required],
      MasterJobNumber: [{ value :'' , disabled : true}],
      MasterJobDate: [{value : null, disabled : true}],
      FreightPPCC: ['Prepaid', Validators.required],
      DestinationAgent: [''],
      DestinationAgentAddress: [''],
      MBLNo: ['', Validators.required],
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
      CommodityDescription: ['', Validators.required],
      MarksandNumber: ['', Validators.required],
      
      // Voyage fields
      VoyageMasterSid: [null],
      VesselName: ['', Validators.required],
      VoyageNo: ['', Validators.required],
      ETA: [null, Validators.required],
      ETD: [null, Validators.required],
      ATA: [null],
      ATD: [null],
      DestinationATA: [null],
      CarrierMasterSid: [null],
      CarrierName: [''],
      
      // Others fields
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
      Coload: [''],
      CoLoader: [''],
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
    return forkJoin({
      departments: this.operationService.getAllDepartments(this.currentCompany?.CompanyMasterSid)
        .pipe(catchError(err => of({ data: [] }))),
      ports: this.operationService.getAllPorts()
        .pipe(catchError(err => of({ data: [] }))),
      vessels: this.operationService.getAllVessels()
        .pipe(catchError(err => of({ data: [] }))),
      agents: this.operationService.getAllAgents(this.currentCompany?.CompanyMasterSid)
        .pipe(catchError(err => of([]))),
      carriers: this.operationService.getAllCarriers(this.currentCompany?.CompanyMasterSid)
        .pipe(catchError(err => of([]))),
      containerTypes: this.operationService.getAllContainerTypes()
        .pipe(catchError(err => of({ data: [] }))),
      currencies: this.operationService.getAllCurrencies()
        .pipe(catchError(err => of({ data: [] }))),
      packageTypes: this.operationService.getPackageTypeUOM() 
        .pipe(catchError(err => of([]))),
        customers: this.operationService.getAllCustomerRelatedLookups(this.filterOption)
      .pipe(catchError(err => of([]))),
    }).pipe(tap(({ departments, ports, vessels, agents, carriers, containerTypes, currencies, packageTypes,customers }) => {
      this.departments = departments.data || [];
      this.portList = ports.data || [];
      this.vesselList = vessels.data || [];
      this.agentList = agents || [];
      this.carrierList = carriers || [];
      this.containerTypeList = containerTypes.data || [];
      this.currencyList = currencies.data || [];
      this.packageTypeList = packageTypes.data || [];
      this.filteredDestinationAgents = [...this.agentList];
      this.filteredOriginAgents = [...this.agentList];
       this.customerList = customers || [];

      // default filtered ports
      this.filteredPorts = [...this.portList];
      this.filteredPOL = [...this.filteredPorts];
      this.filteredPOD = [...this.filteredPorts];
    }));
  }

  loadMasterJobData(masterJobSid: number): void {
    this.isLoading = true;
    this.operationService.getMasterJobById(masterJobSid).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          const data = response.data;
          this.patchFormValues(data);
        }
        this.isLoading = false;
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
    MovementType: data.MovementType, // ✅ Fixed: Ensure MovementType is properly set
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
    
    // ✅ Fixed: Properly handle vessel and voyage data
    VoyageMasterSid: data.VoyageMasterSid || null,
    VesselName: data.VesselName || '', // Ensure VesselName is properly set
    VoyageNo: data.VoyageNo || '', // Ensure VoyageNo is properly set
    ETA: data.ETA ? new Date(data.ETA) : null,
    ETD: data.ETD ? new Date(data.ETD) : null,
    ATA: data.ATA ? new Date(data.ATA) : null, // ✅ Fixed: Ensure ATA is properly set
    ATD: data.ATD ? new Date(data.ATD) : null, // ✅ Fixed: Ensure ATD is properly set
    DestinationATA: data.DestinationATA ? new Date(data.DestinationATA) : null,
    
    // ✅ Fixed: Properly handle carrier data
    CarrierMasterSid: data.CarrierMasterSid || null, // Ensure CarrierMasterSid is set
    CarrierName: data.CarrierName || '', // Ensure CarrierName is properly displayed
    
    Yard: data.Yard || null,
    YardAddress: data.YardAddress || '',
    Transporter: data.Transporter || '',
    HandlingInformation: data.HandlingInformation || '',
    InternalNote: data.InternalNote || '',
    CFS: data.CFS || null,
    CFSAddress: data.CFSAddress || '',
    StuffingStartDate: data.StuffingStartDate ? new Date(data.StuffingStartDate) : null,
    StuffingEndDate: data.StuffingEndDate ? new Date(data.StuffingEndDate) : null,
    CurrencyCode: data.CurrencyCode || '',
    SellExchangeRate: data.SellExchangeRate || null,
    AgentExchangeRate: data.AgentExchangeRate || null,
    Coload: data.Coload || '',
    CoLoader: data.CoLoader || '',
    ExportDoNo: data.ExportDoNo || '',
    ExportDoDate: data.ExportDoDate ? new Date(data.ExportDoDate) : null,
    SOBDate: data.SOBDate ? new Date(data.SOBDate) : null,
    CutOffDate: data.CutOffDate ? new Date(data.CutOffDate) : null,
    SICutOff: data.SICutOff || ''
  });

  // Set department info
    const selectedDepartment = this.departments.find(dep => dep.DepartmentMasterSid === data.DepartmentMasterSid);
    if (selectedDepartment) {
      this.onDeptChange(selectedDepartment);
    }

    // Patch voyage fields if voyage data exists
    if (data.voyages && data.voyages.length > 0) {
      const voyage = data.voyages[0];
      this.masterJobForm.patchValue({
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
        TransactionSid : connection.MasterJobContainerSid,
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
    this.masterJobRateArr = data.costRevenueCharges || [];
    this.rateResult = [...this.masterJobRateArr];


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

  getPackageTypeName(pkgTypeSid: number): string {
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


  private performVesselSearch(params: {POL: string | number, POD: string | number, MovementType: string}): void {
    if (this.isLoadingVessels) {
      return; // Prevent multiple simultaneous calls
    }

    if (!params.POL || !params.POD) {
      return;
    }

    // Check if we already searched for the same parameters
    if (this.lastVesselSearchParams && 
        this.lastVesselSearchParams.POL === params.POL &&
        this.lastVesselSearchParams.POD === params.POD &&
        this.lastVesselSearchParams.MovementType === params.MovementType) {
      return;
    }

    this.isLoadingVessels = true;
    this.lastVesselSearchParams = { ...params };

    const payload = { 
      POL: params.POL, 
      POD: params.POD, 
      MovementType: params.MovementType 
    };
    
    this.operationService.getVesselsBasedOnPorts(payload).subscribe({
      next: (resp: any) => {
        this.isLoadingVessels = false;
        if (resp.status) {
          this.headerVesselList = resp.data;
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

  // Vessel change handler
  onVesselChange(vessel: any) {
    if (!vessel) {
      this.voyageList = [];
      this.masterJobForm.get('VoyageNo')?.setValue(null);
      this.masterJobForm.get('ETA')?.setValue('');
      this.masterJobForm.get('ETD')?.setValue('');
      return;
    }
    
    this.masterJobForm.get('VesselName')?.setValue(vessel.VesselName);
    this.getVoyageForPortsAndVessels();
  }

  getVoyageForPortsAndVessels() {
    const POL = this.masterJobForm.get('POL')?.value;
    const POD = this.masterJobForm.get('POD')?.value;
    const FPD = this.masterJobForm.get('FPD')?.value;
    const MovementType = this.selectedDepartment?.departmentType;
    const vessel = this.masterJobForm.get('VesselName')?.value;
    
    if (!POL || !POD || !vessel) {
      return;
    }
    
    // Use port SIDs in the payload
    const payload = { 
      VesselName: vessel, 
      POL: POL, 
      POD: POD, 
      FPD: FPD, 
      MovementType: MovementType 
    };
    
    this.operationService.getVoyagesBasedOnVesselAndPort(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.voyageList = resp.data.map((voyage: any) => {
            // Convert to SIDs for processing
            const POLSid = (this.portList.find(p => p.PortMasterSid === POL)?.PortMasterSid);
            const PODSid = (this.portList.find(p => p.PortMasterSid === POD)?.PortMasterSid);
            
            const pol = voyage.Ports.find((p: any) => p.POLSid === POLSid);
            const pod = voyage.Ports.find((p: any) => p.PODSid === PODSid || p.POLSid === PODSid);
            
            const polName = this.portList.find(p => p.PortMasterSid === POLSid)?.PortName;
            const podName = this.portList.find(p => p.PortMasterSid === PODSid)?.PortName;
            
            const polWithName = pol ? { ...pol, PortName: polName } : null;
            const podWithName = pod ? { ...pod, PortName: podName } : null;

            return {
              ...voyage,
              POL: polWithName,
              POD: podWithName
            };
          });
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
    
    this.masterJobForm.get('VoyageMasterSid')?.setValue(voyage.VoyageMasterHeaderSid || null);
    const details = voyage.Ports || [];
    const POL = this.masterJobForm.get('POL')?.value;
    const POD = this.masterJobForm.get('POD')?.value;

    const polDetail = details.find((d: any) => d.POLSid === POL);
    const podDetail = details.find((d: any) => d.PODSid === POD || d.POLSid === POD);

    const polETD = polDetail?.ETD || null;
    const podETA = podDetail?.ETA || null;

    if (polETD) {
      this.masterJobForm.get('ETD')?.setValue(new Date(polETD));
    }
    if (podETA) {
      this.masterJobForm.get('ETA')?.setValue(new Date(podETA));
      this.minStartDate = new Date(podETA);
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
    
    // Get the actual port codes instead of SIDs
    const getPortCode = (portSid: any): string => {
      if (!portSid && portSid !== 0) return '';
      const port = this.portList.find(p => p.PortMasterSid === portSid);
      return port ? port.PortCode : portSid?.toString().substring(0, 100);
    };

    const formValue = this.masterJobForm.value;

    const formData: any = {
      ...formValue,
      // Use port codes instead of SIDs
      POO: getPortCode(formValue.POO),
      POL: getPortCode(formValue.POL),
      POD: getPortCode(formValue.POD),
      FPD: getPortCode(formValue.FPD),
      
      // Ensure other string fields don't exceed limits
      DestinationAgentAddress: formValue.DestinationAgentAddress?.substring(0, 200) || '',
      POLTerminal: formValue.POLTerminal?.substring(0, 200) || '',
      PODTerminal: formValue.PODTerminal?.substring(0, 200) || '',
      CommodityDescription: formValue.CommodityDescription?.substring(0, 500) || '',
      MarksandNumber: formValue.MarksandNumber?.substring(0, 200) || '',
      masterJobConnection: this.connectionResult,
      costRevenueCharges: this.rateResult,
      followUps: this.followUpData.map(followUp => ({
        ...followUp,
        status: followUp.status === "Active" ? "A" : "S"
      })),
      edocs: this.edocData.map(edoc => ({ 
        ...edoc,
        status: edoc.status === "Active" ? "A" : "S"
      })),
      emails: this.emailData.map(email => ({ 
        ...email,
        status: email.status === "Active" ? "A" : "S"
      })),
      
      // Map container activities with correct field name and format
      containerActivities: this.containerActivityData.map(activity => ({
        ContainerActivitySid: activity.ContainerActivitySid || null,
        JobMasterSid: this.masterJobSid || null,
        ContainerNumber: activity.ContainerNumber?.substring(0, 11) || '',
        ContainerType: activity.ContainerType,
        ActivityCode: activity.ActivityCode?.substring(0, 5) || '',
        ActivityName: activity.ActivityName?.substring(0, 100) || '',
        ActivityDate: this.formatDate(activity.ActivityDate),
        ActivityFrom: activity.ActivityFrom?.substring(0, 50) || '',
        ActivityTo: activity.ActivityTo?.substring(0, 50) || '',
        Remarks: activity.Remarks?.substring(0, 200) || '',
        Status: activity.Status || "A",
        CreatedBy: this.appSettingsService.userSettingSource.value['userEmail'],
        UpdatedBy: this.isEditMode ? this.appSettingsService.userSettingSource.value['userEmail'] : null
      })),
      
      masterJobContainers: this.formatContainerData(),
      MasterJobDate: this.formatDate(formValue.MasterJobDate),
      MBLDate: this.formatDate(formValue.MBLDate),
      DGBookingDate: this.formatDate(formValue.DGBookingDate),
      DGApprovedDate: this.formatDate(formValue.DGApprovedDate),
      StuffingStartDate: this.formatDate(formValue.StuffingStartDate),
      StuffingEndDate: this.formatDate(formValue.StuffingEndDate),
      ExportDoDate: this.formatDate(formValue.ExportDoDate),
      SOBDate: this.formatDate(formValue.SOBDate),
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
      CutOffDate: this.formatDate(formValue.CutOffDate),
      SICutOff: formValue.SICutOff || ''
    };

    // Format dates in form arrays
    this.formatArrayDates(formData.masterJobConnection, ['ETD', 'ETA', 'ATD', 'ATA']);
    this.formatArrayDates(formData.containerActivities, ['ActivityDate']);

    const allShipments = (this.attachedBookings.getRawValue() || [])
      .filter(ship => !ship.MasterJobSid)
      .map(shipment => shipment.BookingHeaderSid);
    formData['shipmentList'] = [...allShipments];

    // Debug logs
    console.log('Container activity data to be saved:', formData.containerActivities);
    console.log('All form data:', formData);

    if (this.isEditMode && this.masterJobSid) {
      formData.MasterJobSid = this.masterJobSid;
      this.operationService.updateMasterJob(formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.status) {
            this.toastr.success('Master Job updated successfully');
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
    const selectedPOO = this.masterJobForm.get('POO')?.value; // PortMasterSid
    const selectedPOL = this.masterJobForm.get('POL')?.value; // PortMasterSid
    const selectedPOD = this.masterJobForm.get('POD')?.value; // PortMasterSid
    const selectedFPD = this.masterJobForm.get('FPD')?.value; // PortMasterSid
    const MovementType = this.selectedDepartmentType;

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      Segment: this.selectedFCLLCL,
      POO: selectedPOO,
      POL: selectedPOL,
      POD: selectedPOD,
      FPOD: selectedFPD,
      MovementType
    };
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
    const selectedPOO = this.masterJobForm.get('POO')?.value;
    const selectedPOL = this.masterJobForm.get('POL')?.value;
    const selectedPOD = this.masterJobForm.get('POD')?.value;
    const selectedFPD = this.masterJobForm.get('FPD')?.value;
    const EffectiveDate = this.masterJobForm.get('ETA')?.value;
    const ExpiredDate = this.masterJobForm.get('ETD')?.value;
    
    const POOSid = (this.portList.find(p => p.PortMasterSid === selectedPOO)?.PortMasterSid);
    const POLSid = (this.portList.find(p => p.PortMasterSid === selectedPOL)?.PortMasterSid);
    const PODSid = (this.portList.find(p => p.PortMasterSid === selectedPOD)?.PortMasterSid);
    const FPODSid = (this.portList.find(p => p.PortMasterSid === selectedFPD)?.PortMasterSid);

    this.currentRateFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      Segment: this.selectedFCLLCL,
      POO: POOSid,
      POL: POLSid,
      POD: PODSid,
      FPOD: FPODSid,
      EffectiveDate,
      ExpiredDate,
      MasterJobNumber: this.masterJobForm.get('MasterJobNumber')?.value
    };
  }
  
 handleRateChange(allRates: any[]) {
  console.log('Rates changed:', allRates);
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
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.masterJobForm.get('DepartmentMasterSid')?.value;
    
    this.currentEdocFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      DocumentSid: this.masterJobSid || 0,
      MasterJobNumber: this.masterJobForm.get('MasterJobNumber')?.value,
    };
  }

  // Add handler for Edoc data changes
  handleEdocChange(event: any) {
    this.edocData = event.dataItems || [];   
    this.currentEdocFormValue = event.formData; 
    console.log("Edoc updated:", this.edocData);
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
  AuditLogs(modal: TemplateRef<any>) {
    if (!this.masterJobSid) return;

    this.operationService.getAuditLogsmasterjob('MasterJob', this.masterJobSid.toString()).subscribe({
      next: (logs: any[]) => {
        const formatFields = (val: any) => {
          if (!val) return ['NA'];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (obj && obj.updatedOn) delete obj.updatedOn; // Remove updatedOn field if it exists
          if (!obj || Object.keys(obj).length === 0) return ['NA'];
          return Object.entries(obj).map(
            ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
          );
        };

        this.auditLogs = logs.map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal)
        }));

        this.auditLogModalRef = this.modalService.open(modal, { 
          centered: true, 
          scrollable: true, 
          windowClass: 'audit-log-modal',
          size: 'xl'
        });
      },
      error: err => {
        console.error('Error fetching audit logs:', err);
        this.toastr.error('Failed to fetch audit logs');
      }
    });
  }

  exportAuditLogs() {
    if (this.auditLogs.length === 0) {
      this.toastr.warning('No audit logs to export');
      return;
    }
    
    // Simple CSV export implementation
    const headers = ['Changed At', 'Changed By', 'Operation', 'Old Value', 'New Value'];
    const csvData = this.auditLogs.map(log => [
      new Date(log.changedAt).toLocaleString(),
      log.changedBy || '-',
      log.operation,
      JSON.stringify(log.oldVal || {}),
      JSON.stringify(log.newVal || {})
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-masterjob-${this.masterJobForm.get('MasterJobNumber')?.value}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  navigateToBooking(): void {
    this.router.navigate(['operation/booking/entry']);
  }

  navigateBack(): void {
    this.router.navigate(['/operation/master-job/list']);
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
      FreightTerms : [data?.FreightTerms || ''],
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
  }

  detachBooking(shipmentIndex: number, booking: any) {
    const realIndex = ((this.page - 1) * this.pageSize) + shipmentIndex;
    console.log(booking);
    const HouseJobSid = booking.HouseJobSid;
    console.log(HouseJobSid);
    if (HouseJobSid) {
      this.operationService.detachBooking(HouseJobSid).subscribe({
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

  openAttachModal(){
    const modalRef = this.modalService.open(LoadingPlanEntryComponent,{
      size : 'xl',
      backdrop: 'static',
      centered: true,
      windowClass : 'audit-log-modal',
    });
    modalRef.componentInstance.screenName = 'Master Job';
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
      this.modalService.dismissAll();
    });
  }

  getMBLDate(){
    const date = this.masterJobForm.get('MBLDate')?.value;
    return date ? this.datepipe.transform(date) : 'N/A'
  }

}

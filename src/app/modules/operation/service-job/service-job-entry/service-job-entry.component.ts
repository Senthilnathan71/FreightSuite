import { Component, ViewChild, TemplateRef, OnInit, OnDestroy, HostListener } from '@angular/core';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, firstValueFrom, forkJoin, of, Subject, takeUntil, tap } from 'rxjs';
import { OperationService } from '../../operation.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
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
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import html2pdf from 'html2pdf.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { SearchableDropdownModal } from 'src/app/component/searchable-dropdown/searchable-dropdown-modal.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TimeAgoPipe } from 'src/app/core/pipes/timeAgo.pipe';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CommonService } from 'src/app/common/common.service';
import { getDefaultTodayDate, getFormattedPort,toNgbDateStruct } from 'src/app/common/helper';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { ToastrService } from 'ngx-toastr';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { JobCardComponent } from '../../house-job/report/job-card/job-card.component';
import { ProofOfDeliveryComponent } from '../../house-job/report/proof-of-delivery/proof-of-delivery.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { DocReferenceComponent } from '../../doc-reference/doc-reference.component';
import { PerformaInvoiceComponent } from '../../house-job/report/performa-invoice/performa-invoice.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { ExpandTextDirective } from 'src/app/core/Directives/expand-text.directive';



@Component({
  selector: 'app-service-job-entry',
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
    NgxSpinnerModule,
    NgbTooltip,
    SearchableDropdown,
    SearchableDropdownModal,
    NgxSpinnerModule,
    NgbDropdownModule,
    PreventMultiClickDirective,
    TimeAgoPipe,
    FormStateGuardDirective,
    ElementStateGuardDirective,
    ExpandTextDirective
  ],
  templateUrl: './service-job-entry.component.html',
  styleUrl: './service-job-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class ServiceJobEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {


  /**
    |--------------------------------------------------
    |   Section-1 Variable Declaration
    |--------------------------------------------------
  */

  private destroy$ = new Subject<void>();
  @ViewChild('costEntryComponent') costEntryComponent: CostEntryComponent;
  @ViewChild('milestoneComponent') milestoneComponent!: MilestoneComponent;
  @ViewChild('departmentLookup') departmentLookup!: SearchableDropdown;


  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;

  //Variable Declaration - Common 
  serviceJobForm !: FormGroup;
  detailForm !: FormGroup;
  userData: any;
  isPrintLoading: boolean;
  isFormDisabled: boolean = false;
  currentCompany: any;
  currentBranch: any;
  countryOfCompany : string;
  MenuMasterSid: any;
  filterOption: any;
  decimalAfterPrecision = 3;
  public rateComponent = CostEntryComponent;
  isSaving : boolean = false;
  
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

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  // Variable Declaration - Header Part
  HouseJobSid: number;
  currentMenuId: any;
  selectedDepartment: any;
  selectedDepartmentType: string;
  selectedFCLLCL: string = "LCL";
  isEditMode: boolean;
  serviceJobData: any;
  showGenerateJobButton: boolean = false;
  isTermsAndConditionsEnabled: boolean = true;
  departmentList: any[] = [];
  customerList: any[] = [];
  customerBranchList: any[] = [];
  shipperList: any[] = [];
  filteredShipperList: any[] = [];
  consigneeList: any[] = [];
  filteredConsigneeList: any[] = [];
  portList: any[] = [];
  filteredPorts: any[] = [];
  filteredPOO: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  filteredFPOD: any[] = [];
  headerVesselList: any[] = [];
  voyageList: any[] = [];
  private lastPortFilterPayloadKey = '';
  TandCList: any[] = [];
  currencyList : any[] = [];
  houseData: any;
  selectedCustomerBranch: any;


  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

  permissions: any[] = [];
  currentMenuPermissions = {};

  private initialFormValue: any = null;
  isDirty = false;
  houseStatusTimeline : any[];


  // Variable Declaration - Cargo Part
  containerTypeList: any[] = [];
  selectedContainerType: any;
  cargoForm !: FormGroup;
  freightTermsList = [
    { id: 1, name: 'Prepaid' },
    { id: 2, name: 'Collect' }
  ]
  stuffingAt = [
    { id: 1, name: 'Dock' },
    { id: 2, name: 'Factory' }
  ]
  modeOfCargoType = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Haz' },
    { id: 3, name: 'Refer' },
    { id: 4, name: 'Tanker' },
    { id: 5, name: 'OOG' },
  ];
  // Variable Declaration - Rate Part
  resetTriggerRate: boolean;
  serviceJobRateArr : any[] = [];
  serviceJobRateResults : any[] = [];
  currentFormValue: any;
  selectedCustomer : any;
  resetTriggerMilestone: boolean;
  milestoneResult: any[] = [];
  private milestoneSyncInitialized = false;

  today: any;
  minDate: any;
  currentDate = new Date();

  containerTypeLookupConfig = DROPDOWN_CONFIGS.CONTAINER_TYPE;


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

  modeOfTransport = [
    { id: 1, name: 'Rail' },
    { id: 2, name: 'Road' },
    { id: 3, name: 'Flight' },
    { id: 4, name: 'Vessel' },
  ];

  tabs = [
    // { name: 'Shipment', icon: 'fas fa-ship' },
    { name: 'Cargo', icon: 'fas fa-boxes' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' }
  ];
  // Mail content
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  vesselVoyageLookupConfig = DROPDOWN_CONFIGS.VESSEL_VOYAGE;
  userLookupConfig = DROPDOWN_CONFIGS.USER;

  salesmanList: any[] = [];


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
    private datePipe: CustomDatePipe,
    private spinner: NgxSpinnerService,
    private leadService: LeadService,
    public dropdownStore: DropdownStore,
    private commonService: CommonService,
    public mps: MenuPermissionService,
    private ngbModal: NgbModal,
    private commonModalService : ModalService,
     private toastr: ToastrService,
    private emailTriggerService: EmailTriggerService,
  ) {
    this.today = this.calendar.getToday();
  }

  copyDocumentNumber(controlName: string, label: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const documentNo = this.serviceJobForm?.get(controlName)?.value;
    if (!documentNo) {
      return;
    }
    navigator.clipboard.writeText(String(documentNo)).then(() => {
      this.toastr.success(`${label} copied to clipboard.`, '', { timeOut: 1500 });
    });
  }

  /**
    |--------------------------------------------------
    |   Section-3 : NgOnInit Part
    |--------------------------------------------------
    */
  
  ngOnInit(): void {
    this.costRevenueAccess = this.appSettingService.getCostRevenueAccess();
    this.userData = this.appSettingService.getDecryptedUserProfile();
    const fy = this.appSettingService.getCurrentFinancialYear();
        if (fy) {
          this.fyMinDate = toNgbDateStruct(fy.StartDate);
          const fyEnd = new Date(fy.EndDate);
          const today = getDefaultTodayDate();
          this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
        }
    if (this.userData) {
    
    }
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = Number(sessionStorage.getItem('currentMenuId'));
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    this.currentCompany = (
      (this.userData.userCompanyMaster || [])
        .find(ucm => ucm.CompanyMasterSid === currentCompanyId)?.companyMaster
    );
    this.loadTermsAndConditionsConfig();
    this.mps.init().subscribe();

    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid
    };


    this.initServiceJobForm();
    this.initCargoForm();
    this.subscribeToFormChanges();

    this.spinner.show();
    this.loadHeaderMandatoryParts().subscribe(() => {
      this.currentRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe((param) => {
        this.HouseJobSid = +param.get('id');
        if (this.HouseJobSid) {
          this.isEditMode = true;
          this.loadServiceJobById(this.HouseJobSid);
        } else {
          this.isEditMode = false;
          this.captureInitialFormState();
        }
      });

      this.loadCargoLookups();
      this.spinner.hide();
    });
  }

  get isSuspended() : boolean {
    return this.serviceJobData?.status !== 'A';
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

  private parseConfigBoolean(value: any, defaultValue: boolean): boolean {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return defaultValue;
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
    if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
    return defaultValue;
  }



  /**
  |--------------------------------------------------
  |   Section-4 : Main Functions
  |--------------------------------------------------
  */

  // Header Form Initialization
  initServiceJobForm() {
     const today = getDefaultTodayDate();
    const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultMasterJobDate=  fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;
    const defaultMBLDate = fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate))? fyDefault.EndDate : today;
    const defaultHBLDate = fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)); 
    this.serviceJobForm = this.fb.group({
      DepartmentMasterSid: [null, [Validators.required]],
      CustomerMasterSid: [null, [Validators.required]],
      CustomerBranchSid: [''],
      CustomerName: [''],
      CustomerAddress: [null],
      ShipperName: [null],
      ShipperAddress: [null],
      ConsigneeName: [null],
      ConsigneeAddress: [null],
      isShipperFreeText: [false],
      isConsigneeFreeText: [false],
      isVesselFreeText: [false],
      isVoyageFreeText: [false],
      ShipmentNo : [],
      SalesmanSid : [null],
      MasterJobNumber : [{ value: '', disabled: true }],
      HBLNo: [{value: '', disabled: true}],
      JobType: [null],
      HBLDate: [defaultHBLDate],
      MBLNo: [null],
      MBLDate: [defaultMBLDate],
      MasterJobDate: [defaultMasterJobDate],
      status: ['Active'],
      HouseJobSid : [null],
      MasterJobSid : [null],

      POO: [null],
      POL: [""],
      POD: [""],
      FPD: [null],
      VoyageMasterSid: [null],
      VesselName: [''],
      VoyageNo: [''],
      ETD: [null],
      ETA: [null]
    })
    this.serviceJobForm.valueChanges.subscribe(() => {
      this.syncFormValueWithRateComponent();
    })
  }


  // Cargo Form Initiation
  initCargoForm() {
    this.cargoForm = this.fb.group({
      HouseJobCargoSid: [null],
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
      StuffingAt: ['Dock'],
      ExternalNote: [''],
    InternalNote: [''],
    CommodityDescription: [''],
    MarksAndNumber: [''],
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



  /**
   *  Get form Control
  */

 
 get b(): { [key: string]: AbstractControl<any, any> } {
   return this.serviceJobForm.controls || {}
 }
 get c(): { [key: string]: AbstractControl<any, any> } {
   return this.cargoForm.controls || {}
 }


  /**
   *  Load Lookups
  */
  loadHeaderMandatoryParts() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    return forkJoin({
      departments: this.operationService.getAllDepartments(CompanyMasterSid).pipe(catchError(err => of([]))),
      customers: this.operationService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(err => of([]))),
      shippers: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['shipper'] }).pipe(catchError(err => of({ data: [] }))),
      consignees: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['consignee'] }).pipe(catchError(err => of({ data: [] }))),
      ports: this.operationService.getAllPorts().pipe(catchError(err => of([]))),
      userCountry: this.operationService.getCountryById(this.currentCompany.CountryMasterSid).pipe(catchError(err => of({}))),
      currencies : this.operationService.getAllCurrencies().pipe(catchError(err => of([]))),
      salesmen: this.masterService.getAllSalesmans(CompanyMasterSid).pipe(catchError(err => of([]))),

    }).pipe(tap(({
      departments, customers, shippers, consignees, ports, userCountry, currencies, salesmen
    }) => {
      if (!this.isEditMode) {
        this.spinner.hide();
      }
      this.departmentList = departments.data;
      this.customerList = customers;
      this.shipperList = shippers.data || [];
      this.filteredShipperList = [...this.shipperList];
      this.consigneeList = consignees.data || [];
      this.filteredConsigneeList = [...this.consigneeList];
      this.countryOfCompany = String((userCountry?.data?.countryName)).trim().toLowerCase();
      this.portList = (ports.data || []).map(p => ({ ...p, Country: p.countryMaster?.countryName }));
      const rawCurrencies: any[] = Array.isArray(currencies)
        ? currencies
        : currencies?.data || [];
      this.currencyList = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
      this.salesmanList = Array.isArray(salesmen) ? salesmen : [];
    }))
  }


  loadCargoLookups() {
    forkJoin({
      containerTypes: this.operationService.getAllContainerTypes().pipe(catchError(err => of({ data: [] }))),
    }).subscribe(({ containerTypes }) => {
      this.containerTypeList = containerTypes.data;
    })
  }




  loadServiceJobById(houseJobSid: number) {
    this.spinner.show();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      HouseJobSid: houseJobSid,
      CompanyMasterSid,
      BranchMasterSid
    }
    this.operationService.getServiceJobById(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.patchValues(resp.data);
          this.serviceJobData = resp.data;
          this.minDate = undefined;
          this.spinner.hide();
          this.captureInitialFormState();
        } else {
          this.appSettingService.showError('Access denied.');
        }
      }
    )
  }

  patchValues(response: any) {
    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectedCustomer = this.customerList.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
    const shouldDisableForms = (this.isEditMode && response.status !== 'A');
    this.onDeptChange(selectedDepartment);
    this.onCustomerChange(selectedCustomer);
    this.serviceJobForm.patchValue({
      HouseJobSid : this.HouseJobSid,
      MasterJobSid : response.MasterJobSid,
      DepartmentMasterSid: response.DepartmentMasterSid,
      CustomerMasterSid: response.CustomerMasterSid,
      CustomerBranchSid: response.CustomerBranchSid,
      CustomerName: response.CustomerName,
      CustomerAddress: response.CustomerAddress,
      ShipperName: response.ShipperName,
      ShipperAddress: response.ShipperAddress,
      ConsigneeName: response.ConsigneeName,
      ConsigneeAddress: response.ConsigneeAddress,
      isShipperFreeText: !!response.ShipperName && !this.existsInList(this.shipperList, response.ShipperName),
      isConsigneeFreeText: !!response.ConsigneeName && !this.existsInList(this.consigneeList, response.ConsigneeName),
      isVesselFreeText: !!response.VesselName && !this.existsInList(this.headerVesselList, response.VesselName, 'VesselName'),
      isVoyageFreeText: !!response.VoyageNo && !this.existsInList(this.voyageList, response.VoyageNo, 'VoyageNo'),
      MasterJobNumber : response.masterJob?.MasterJobNumber || "",
      HBLNo: response.HBLNo,
      JobType: response.JobType,
      MBLNo: response.MBLNo,
      MBLDate: response.MBLDate ? new Date(response.MBLDate) : '',
      status: response.status === "A" ? "Active" : "Suspended",

      POO: response.POO,
      POL: response.POL,
      POD: response.POD,
      FPD: response.FPD,
      VoyageMasterSid: response.VoyageMasterSid || response.masterJob?.voyages?.[0]?.VoyageMasterSid || null,
      VesselName: response.VesselName || response.masterJob?.voyages?.[0]?.VesselName || '',
      VoyageNo: response.VoyageNo || response.masterJob?.voyages?.[0]?.VoyageNo || '',
      ETD: response.ETD ? new Date(response.ETD) : null,
      ETA: response.ETA ? new Date(response.ETA) : null,
      BookingStatus: response.BookingStatus,
      ShipmentNo: response.ShipmentNo,
      SalesmanSid: response.SalesmanSid ?? null
    })
    this.b['DepartmentMasterSid']?.disable();
    this.b['CustomerMasterSid']?.disable();



    const cargoData = response.Cargo[0];
    const othersData = response.Others?.[0];
    this.cargoForm.patchValue({
      HouseJobCargoSid: cargoData?.HouseJobCargoSid || null,
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
      StuffingAt: cargoData?.StuffingAt,
      CommodityDescription : cargoData?.CommodityDescription,
      MarksAndNumber : cargoData?.MarksAndNumber,
      ExternalNote: othersData?.ExternalNote || '',
      InternalNote: othersData?.InternalNote || ''
    })
    this.selectedFCLLCL = this.resolveSelectedSegment(this.selectedDepartment);
    
    this.serviceJobRateArr = (response.costRevenueCharges || []).map(br => ({
      ...br,
      RateSid : br.CostRevenueChargesSid,
      status : br.status  === "A" ? "Active" : "Suspended"
    }));

    if (shouldDisableForms) {
      this.disableAllForms();
      if (this.isEditMode && response.status !== 'A') {
        this.serviceJobForm.get('status')?.disable();
      }
    }

    
    this.serviceJobRateResults = [...this.serviceJobRateArr];

    if (
      this.isEditMode &&
      this.serviceJobRateArr?.some(rate =>
        rate.CostVoucherHeaderSid !== null || rate.RevenueVoucherHeaderSid !== null
      )
    ) {
      this.serviceJobForm.get('status')?.disable();
    }


    this.syncFormValueWithRateComponent();
  }

  private disableAllForms(): void {
    Object.keys(this.serviceJobForm.controls).forEach(key => {
      if (!['status'].includes(key)) {
        this.serviceJobForm.get(key)?.disable();
      }
    });

    Object.keys(this.cargoForm.controls).forEach(key => {
      this.cargoForm.get(key)?.disable();
    });


    this.isFormDisabled = true;
  }


  handleRateChange(allRates: any[]) {
    console.log(allRates);
    this.serviceJobRateResults = [...allRates];
    this.updateDirtyState();
  }

  handleMilestoneChange(allMilestones: any[]) {
    this.milestoneResult = [...(allMilestones || [])];
    if (!this.milestoneSyncInitialized) {
      this.milestoneSyncInitialized = true;
      this.captureInitialFormState();
      return;
    }
    this.updateDirtyState();
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
      this.onSubmit(resolve);
    });
  }

  async onSubmit(resolve?: (value: boolean) => void) {
   const fy = this.appSettingService.getCurrentFinancialYear();
    if(fy){
      const MBLDate =new Date (this. serviceJobForm.getRawValue().MBLDate);
      const fyStartDate = new Date(fy.StartDate);
      const fyEndDate = new Date(fy.EndDate);
      if(MBLDate < fyStartDate || MBLDate > fyEndDate){
        this.toastr.error('The date of the master job must be between the financial year start date and end date');
        this.serviceJobForm.get('MasterJobDate')?.setErrors({ invalidDate: true });
        if (resolve) resolve(false);
        return;
      }
    }
    console.log('Submit triggered', this.serviceJobForm.value);
    const currentFormState = this.getCurrentFormState();
    if (this.initialFormValue !== null && this.deepEqual(currentFormState, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      if (resolve) resolve(false);
      return;
    }

    if (this.serviceJobForm.invalid) {
      this.serviceJobForm.markAllAsTouched();
      this.serviceJobForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      if (resolve) resolve(false);
      return;
    }

    if (!this.costEntryComponent.validateRateArray()) {
      this.selectedTab = 'Rate';
      if (resolve) resolve(false);
      return;
    }

    // const isRateValid = this.costEntryComponent?.validateRateArray?.();
    // console.log(isRateValid);
    // if (!isRateValid) {
    //   console.warn('Rate validation failed — submission stopped');
    //   return;
    // }
    const serviceFormValue = this.serviceJobForm.getRawValue();
    const cargoFormValue = this.cargoForm.getRawValue();

    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid: serviceFormValue.DepartmentMasterSid,
      POO: serviceFormValue.POO || "",
      POL: serviceFormValue.POL || "",
      POD: serviceFormValue.POD || "",
      FPD: serviceFormValue.FPD || "",
      VesselName: serviceFormValue.VesselName || "",
      VoyageNo: serviceFormValue.VoyageNo || "",
      HBLNo: serviceFormValue.HBLNo,
      JobType: serviceFormValue.JobType,
      MBLNo: serviceFormValue.MBLNo,
      MBLDate: serviceFormValue.MBLDate ? new Date(serviceFormValue.MBLDate) : null,
      HBLDate: serviceFormValue.MBLDate ? new Date(serviceFormValue.MBLDate) : null,
      MasterJobDate: serviceFormValue.MBLDate ? new Date(serviceFormValue.MasterJobDate) : null,
      ETD: serviceFormValue.ETD ? new Date(serviceFormValue.ETD) : null,
      ETA: serviceFormValue.ETA ? new Date(serviceFormValue.ETA) : null,
      CustomerMasterSid: serviceFormValue.CustomerMasterSid,
      CustomerBranchSid: serviceFormValue.CustomerBranchSid || null,
      CustomerName: serviceFormValue.CustomerName,
      CustomerAddress: serviceFormValue.CustomerAddress,
      ShipperName: serviceFormValue.ShipperName,
      ShipperAddress: serviceFormValue.ShipperAddress,
      ConsigneeName: serviceFormValue.ConsigneeName,
      ConsigneeAddress: serviceFormValue.ConsigneeAddress,
      ShipmentNo : serviceFormValue.ShipmentNo || "",
      SalesmanSid: serviceFormValue.SalesmanSid ? Number(serviceFormValue.SalesmanSid) : null,
      FreightPPCC: cargoFormValue.FreightTerms || "Prepaid",
      status: serviceFormValue.status === 'Active' ? 'A' : 'S',
      houseJobCargo: {
         HouseJobCargoSid: this.isEditMode
    ? cargoFormValue.HouseJobCargoSid || null
    : null,
      
        CargoType: cargoFormValue.CargoType || 'General',
        GrossWeight: parseFloat(cargoFormValue.GrossWeight) || 0,
        NetWeight: parseFloat(cargoFormValue.NetWeight) || 0,
        Volume: parseFloat(cargoFormValue.Volume) || 0,
        ChargeableWeight: parseFloat(cargoFormValue.ChargeableWeight) || 0,
        ContainerType: cargoFormValue.ContainerType || null,
        PackageType: null,
        NoOfPackage: parseFloat(cargoFormValue.NoOfPackage) || 0,
        FreightAmount: "0",
        ShipmentTerms: cargoFormValue.ShipmentTerms || "",
        FreightTerms: cargoFormValue.FreightTerms || "",
        ModeOfTransport: cargoFormValue.ModeOfTransport || "",
        MovementType: cargoFormValue.MovementType || "",
        NoofContainers: parseFloat(cargoFormValue.NoofContainers) || 0,
        Qty: 0,
        StuffingAt: cargoFormValue.StuffingAt || 'Dock',
        WeightUnitSid: null,
        CommodityDescription: cargoFormValue.CommodityDescription || "",
        MarksAndNumber: cargoFormValue.MarksAndNumber || ""
      },
      houseJobOthers: {
        ExternalNote: cargoFormValue.ExternalNote || "",
        InternalNote: cargoFormValue.InternalNote || ""
      },
      costRevenueCharges: this.serviceJobRateResults.map(rate => ({
        RateSid: rate.RateSid || null,
        ShipmentNo: serviceFormValue.ShipmentNo || "",
        MasterJobNo: serviceFormValue.MBLNo || "",
        ChargeMasterSid: rate.ChargeMasterSid,
        ChargeDescription: rate.ChargeDescription,
        ChargeUomSid: rate.ChargeUomSid,
        RevenueChargeUomSid: rate.RevenueChargeUomSid,
        CostChargeUomSid: rate.CostChargeUomSid,
        NoOfUnit: parseFloat(rate.NoOfUnit) || 0,
        RevenueNumberOfUnit: parseFloat(rate.RevenueNumberOfUnit) || 0,
        CostNumberOfUnit: parseFloat(rate.CostNumberOfUnit) || 0,
        RevenueCurrencyMasterSid: rate.RevenueCurrencyMasterSid,
        RevenueExchangeRate: parseFloat(rate.RevenueExchangeRate) || 1,
        RevenueRate: parseFloat(rate.RevenueRate) || 0,
        RevenueAmount: rate.RevenueAmount || "0",
        RevenueLocalAmount: rate.RevenueLocalAmount || "0",
        RevenueDrCr: rate.RevenueDrCr || "C",
        RevenueCustomerMasterSid: rate.RevenueCustomerMasterSid,
        RevenueCustomerBranchSid: rate.RevenueCustomerBranchSid,
        RevenuePrepaidCollect: rate.RevenuePrepaidCollect,
        RevenueVoucherHeaderSid: rate.RevenueVoucherHeaderSid || null,
        RevenueVoucherTypeSid: rate.RevenueVoucherTypeSid || null,
        RevenueVoucherHeader: rate.RevenueVoucherHeader || null,
        RevenueVoucherType: rate.RevenueVoucherType || null,
        CostCurrencyMasterSid: rate.CostCurrencyMasterSid,
        CostExchangeRate: parseFloat(rate.CostExchangeRate) || 1,
        CostRate: parseFloat(rate.CostRate) || 0,
        CostAmount: rate.CostAmount || "0",
        CostLocalAmount: rate.CostLocalAmount || "0",
        CostDrCr: rate.CostDrCr || "D",
        CostAgentMasterSid: rate.CostAgentMasterSid,
        CostAgentBranchSid: rate.CostAgentBranchSid,
        CostPrepaidCollect: rate.CostPrepaidCollect,
        CostVoucherHeaderSid: rate.CostVoucherHeaderSid || null,
        CostVoucherTypeSid: rate.CostVoucherTypeSid || null,
        CostVoucherHeader: rate.CostVoucherHeader || null,
        CostVoucherType: rate.CostVoucherType || null,
        status: rate.status || "Active",
        Remarks: rate.Remarks || "",
        QuoteChargeSid: rate.QuoteChargeSid || null,
        TariffDetailSid: rate.TariffDetailSid || null,
        unitQtyBasis: rate.unitQtyBasis || null,
        _costVoucherHeaderSid: rate._costVoucherHeaderSid || null,
        _revenueVoucherHeaderSid: rate._revenueVoucherHeaderSid || null
      })),
      milestones: this.milestoneResult,
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };

    console.log('Final Payload:', payload);

    const duplicateCheckingPayload = {
      CompanyMasterSid: payload.CompanyMasterSid,
      BranchMasterSid: payload.BranchMasterSid,
      DepartmentMasterSid: payload.DepartmentMasterSid,
      HBLNo: payload.HBLNo,
      MBLNo: payload.MBLNo,
      // IsServiceJob:'Y',
      // status: payload.status,
    }
    if (!this.isEditMode) {
      const shouldProceed = await this.performDuplicateCheck(duplicateCheckingPayload);

      if (!shouldProceed) {
        this.isSaving = false;
        if (resolve) resolve(false);
        return; // STOP submission
      }
    }
    this.isSaving = true;
    this.spinner.show();

    if (this.isEditMode && this.HouseJobSid) {
      this.operationService.updateServiceJobById(this.HouseJobSid, payload).subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          this.isSaving = false;
          if (resp.status) {
            this.appSettingService.showSuccess('Service Job successfully updated.');
            this.isDirty = false;
            this.loadServiceJobById(this.HouseJobSid);
            if (resolve) resolve(true);
          } else {
            this.appSettingService.showError('Error updating Service Job.');
            console.error(resp.message);
            if (resolve) resolve(false);
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Failed to update Service Job.');
          console.error(err);
          if (resolve) resolve(false);
        }
      });
    } else {
      this.operationService.createServiceJob(payload).subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          this.isSaving = false;
          if (resp.status) {
            this.appSettingService.showSuccess('Service Job successfully created.');
            this.isDirty = false;
            const houseId = resp.data?.HouseJobSid;
            this.router.navigate(['operation/service-job/entry', houseId]);
            if (resolve) resolve(true);
          } else {
            this.appSettingService.showError('Error creating service job.');
            console.error(resp.message);
            if (resolve) resolve(false);
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Failed to create service job.');
          console.error(err);
          if (resolve) resolve(false);
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
      this.filteredPOO = [];
      this.filteredPOL = [];
      this.filteredPOD = [];
      this.filteredFPOD = [];
      this.b['POO'].setValue(null);
      this.b['POL'].setValue(null);
      this.b['POD'].setValue(null);
      this.b['FPD'].setValue(null);
      this.b['JobType'].setValue(null);
      return;
    }
    this.selectedDepartmentType = this.normalizePortText(department?.departmentType);
    this.selectedFCLLCL = this.resolveSelectedSegment(department);
    this.clearRouteSelections();
    // this.b['JobType'].setValue(department.ExportImport);
    
    this.refreshPortFilters();
    this.syncFormValueWithRateComponent();
    this.autoSetJobType(department);

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
    this.clearVesselAndVoyageData();
  }

  autoSetJobType(department: any): void {
    if (!department) {
      this.b['JobType'].setValue(null);
      return;
    }

    const departmentName = department.departmentName?.toLowerCase();
    const exportImportType = department.ExportImport;
    
    let jobType : 'Import' | 'Export' | 'Transhipment' | '' = '';

    // // Determine JobType based on department name and export/import
    if (departmentName.includes('fcl') || departmentName.includes('lcl')) {
      if (exportImportType === 'Export') {
        // FCL Export with Factory Stuffing -> Container Yard
        jobType = 'Export';
      } else if (exportImportType === 'Import') {
        // FCL Import with Factory Stuffing -> Container Yard
        jobType = 'Import';
      }
    } else {
      // Other departments - enable all job types
      jobType = 'Transhipment';
    }

    
    // Set the JobType value
    this.b['JobType']?.setValue(jobType);
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
    this.triggerVesselSearch();
  }

  private clearVesselAndVoyageData(): void {
    this.b['VoyageMasterSid']?.setValue(null);
    this.b['VesselName']?.setValue('');
    this.b['VoyageNo']?.setValue('');
    this.b['ETD']?.setValue(null);
    this.b['ETA']?.setValue(null);
    this.headerVesselList = [];
    this.voyageList = [];
  }

  private refreshPortFilters(): void {
    const departmentSid = this.b['DepartmentMasterSid']?.value || this.selectedDepartment?.DepartmentMasterSid;
    if (!departmentSid) {
      this.lastPortFilterPayloadKey = '';
      this.filteredPorts = [];
      this.filteredPOO = [];
      this.filteredPOL = [];
      this.filteredPOD = [];
      this.filteredFPOD = [];
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
      this.filteredPorts = [
        ...(data.POO || []),
        ...(data.POL || []),
        ...(data.POD || []),
        ...(data.FPOD || [])
      ];
      this.filteredPOO = data.POO || [];
      this.filteredPOL = data.POL || [];
      this.filteredPOD = data.POD || [];
      this.filteredFPOD = data.FPOD || [];
      },
      error: () => {
        this.lastPortFilterPayloadKey = '';
      }
    });
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

    return ['OTHER', 'OTHERS', 'TRANSPORT', 'SERVICE'].includes(departmentType) || ['OTHER', 'OTHERS', 'TRANSPORT', 'SERVICE'].includes(segment);
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
    if (!customer) {
      this.b['CustomerName']?.setValue('');
      this.b['CustomerAddress']?.setValue(null);
      this.b['CustomerBranchSid']?.setValue(null);
      this.selectedCustomerBranch = null;
      this.customerBranchList = [];
      this.selectedCustomer = null;
      this.b['ShipperName']?.setValue(null);
      this.b['ShipperAddress']?.setValue('');
      this.b['ConsigneeName']?.setValue(null);
      this.b['ConsigneeAddress']?.setValue('');
      this.b['isShipperFreeText']?.setValue(false);
      this.b['isConsigneeFreeText']?.setValue(false);
      this.filteredShipperList = [...this.shipperList];
      this.filteredConsigneeList = [...this.consigneeList];
      return;
    }
    this.b['CustomerName']?.setValue(customer.CustomerName);
    this.b['CustomerAddress']?.setValue(customer.Address);
    this.b['CustomerBranchSid']?.setValue(customer.CustomerBranchSid);
    this.selectedCustomer = customer;
    this.getCustomerBranchByCustomer(customer.CustomerMasterSid);
    this.handleImportExport();
  }


  handlePOLChange(selectedPort: any) {
    if (!selectedPort) {
      this.refreshPortFilters();
      return;
    }
    this.onRouteChange();
  }

  handlePODChange(selectedPort: any) {
    if (!selectedPort) {
      this.b['FPD']?.setValue(null);
      this.refreshPortFilters();
      return;
    }
    this.b['FPD']?.setValue(selectedPort?.PortCode ?? selectedPort);
    this.onRouteChange();
  }

  private getPortSidByCode(portCode: any): number | null {
    if (!portCode) return null;
    const port = this.portList.find(p => String(p.PortCode).trim() === String(portCode).trim());
    return port?.PortMasterSid || null;
  }

  private getVoyageTypeBasedOnDept(): string {
    const deptType = this.normalizePortText(this.selectedDepartment?.departmentType || this.selectedDepartmentType);
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

  private triggerVesselSearch(): void {
    if (this.b['isVesselFreeText']?.value || this.b['isVoyageFreeText']?.value) {
      return;
    }

    const polSid = this.getPortSidByCode(this.b['POL']?.value);
    const podSid = this.getPortSidByCode(this.b['POD']?.value);
    const segment = this.getVoyageTypeBasedOnDept();
    if (!polSid || !podSid || !segment) {
      this.headerVesselList = [];
      this.voyageList = [];
      return;
    }

    this.operationService.getVesselVoyageBasedOnPorts({ POL: polSid, POD: podSid, segment }).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.headerVesselList = (resp.data || []).map((vslVoy: any) => ({
            ...vslVoy,
            ETD: this.datePipe.transform(vslVoy.ETD),
            ETA: this.datePipe.transform(vslVoy.ETA),
            originalETD: vslVoy.ETD,
            originalETA: vslVoy.ETA
          }));
        }
      },
      error: () => {
        this.headerVesselList = [];
      }
    });
  }

  onVesselChange(vessel: any): void {
    if (!vessel) {
      this.voyageList = [];
      this.b['VoyageMasterSid']?.setValue(null);
      this.b['VoyageNo']?.setValue('');
      this.b['ETD']?.setValue(null);
      this.b['ETA']?.setValue(null);
      return;
    }

    this.b['VesselName']?.setValue(vessel.VesselName);
    this.getVoyageForPortsAndVessels(vessel.VesselName);
    if (vessel.VoyageNo) {
      this.onVoyageChange(vessel);
    }
  }

  getVoyageForPortsAndVessels(vesselName?: string): void {
    const polSid = this.getPortSidByCode(this.b['POL']?.value);
    const podSid = this.getPortSidByCode(this.b['POD']?.value);
    const vessel = vesselName || this.b['VesselName']?.value;
    if (!polSid || !podSid || !vessel) {
      return;
    }

    this.operationService.getVoyagesBasedOnVesselAndPort({
      VesselName: vessel,
      POL: polSid,
      POD: podSid,
      MovementType: this.selectedDepartment?.departmentType
    }).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.voyageList = (resp.data || []).map((voyage: any) => ({
            VoyageNo: voyage.VoyageNo,
            ETD: voyage.ETD ? new Date(voyage.ETD) : null,
            ETA: voyage.ETA ? new Date(voyage.ETA) : null,
            VoyageMasterHeaderSid: voyage.VoyageMasterSid,
            VesselName: voyage.VesselName
          }));

          const currentVoyageNo = this.b['VoyageNo']?.value;
          const existingVoyage = currentVoyageNo
            ? this.voyageList.find(v => v.VoyageNo === currentVoyageNo)
            : null;
          if (existingVoyage) {
            this.onVoyageChange(existingVoyage);
          } else if (!this.isEditMode && this.voyageList.length === 1) {
            this.onVoyageChange(this.voyageList[0]);
          }
        }
      },
      error: () => {
        this.voyageList = [];
      }
    });
  }

  onVoyageChange(voyage: any): void {
    if (!voyage) {
      this.b['VoyageMasterSid']?.setValue(null);
      this.b['ETD']?.setValue(null);
      this.b['ETA']?.setValue(null);
      return;
    }

    this.serviceJobForm.patchValue({
      VoyageMasterSid: voyage.VoyageMasterHeaderSid || voyage.VoyageMasterSid || null,
      VesselName: voyage.VesselName || this.b['VesselName']?.value,
      VoyageNo: voyage.VoyageNo || ''
    });

    if (voyage.ETD || voyage.originalETD) {
      this.b['ETD']?.setValue(new Date(voyage.originalETD || voyage.ETD));
    }
    if (voyage.ETA || voyage.originalETA) {
      this.b['ETA']?.setValue(new Date(voyage.originalETA || voyage.ETA));
    }
  }

  handleFPODChange(selectedPort: any) {
    if (!selectedPort) {
      return;
    }
    this.refreshPortFilters();
  }

  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe((resp: any) => {
      if (resp.status) {
        this.customerBranchList = resp.data || [];
        if (this.isEditMode && this.serviceJobData?.CustomerBranchSid) {
          this.selectedCustomerBranch = this.customerBranchList.find(
            branch => branch.CustomerBranchSid === this.serviceJobData.CustomerBranchSid
          ) || null;
        }
      } else {
        this.appSettingService.showError("Error loading customer's branch.");
      }
    });
  }

  onCustomerBranchChange(customerBranch: any) {
    const selectedBranch = typeof customerBranch === 'string'
      ? this.customerBranchList.find(branch => branch.Address === customerBranch)
      : customerBranch;

    if (!selectedBranch) {
      this.b['CustomerAddress']?.setValue(null);
      this.b['CustomerBranchSid']?.setValue(null);
      this.selectedCustomerBranch = null;
      this.handleImportExport();
      return;
    }
    this.b['CustomerAddress']?.setValue(selectedBranch.Address || selectedBranch.CustomerAddress1 || customerBranch || '');
    this.b['CustomerBranchSid']?.setValue(selectedBranch.CustomerBranchSid || null);
    this.selectedCustomerBranch = selectedBranch;
    this.handleImportExport();
  }

  toggleInputType(mainCtrl: string, flagCtrl: string, event: MouseEvent): void {
    event.stopPropagation();
    const value = this.b[flagCtrl]?.value;
    this.b[flagCtrl]?.setValue(!value);
    this.b[mainCtrl]?.reset();
    if (mainCtrl === 'VesselName') {
      this.b['VoyageMasterSid']?.setValue(null);
      this.b['VoyageNo']?.setValue('');
      this.voyageList = [];
    }
    if (mainCtrl === 'VoyageNo') {
      this.b['VoyageMasterSid']?.setValue(null);
    }
  }

  setAddress(controlName: string, item: any) {
    this.b[controlName]?.setValue(item ? (item.CustomerAddress1 || item.Address || '') : '');
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
    if (!this.selectedDepartment) {
      this.b['ShipperName']?.setValue(null);
      this.b['ShipperAddress']?.setValue('');
      this.b['ConsigneeName']?.setValue(null);
      this.b['ConsigneeAddress']?.setValue('');
      this.b['isShipperFreeText']?.setValue(false);
      this.b['isConsigneeFreeText']?.setValue(false);
      this.filteredShipperList = [...this.shipperList];
      this.filteredConsigneeList = [...this.consigneeList];
      this.onShipperChange();
      this.onConsigneeChange();
      return;
    }

    const exportImportType = this.selectedDepartment.ExportImport;
    const customerBranchSid = this.b['CustomerBranchSid']?.value;

    if (exportImportType === 'Export') {
      if (!customerBranchSid) {
        this.b['ShipperName']?.setValue(null);
        this.b['ShipperAddress']?.setValue('');
        this.onShipperChange();
        return;
      }

      const shipperExist = this.shipperList.find(s => s.CustomerBranchSid === customerBranchSid);
      const shipperExistInFiltered = this.filteredShipperList.find(s => s.CustomerBranchSid === customerBranchSid);

      if (shipperExist && shipperExistInFiltered) {
        this.b['ShipperName']?.setValue(shipperExistInFiltered.CustomerName);
        this.b['ShipperAddress']?.setValue(shipperExistInFiltered.Address || shipperExistInFiltered.CustomerAddress1 || '');
        this.onShipperChange(shipperExistInFiltered);
        this.onConsigneeChange();
      } else if (shipperExist) {
        this.b['ShipperName']?.setValue(shipperExist.CustomerName);
        this.b['ShipperAddress']?.setValue(shipperExist.Address || shipperExist.CustomerAddress1 || '');
        this.onShipperChange(shipperExist);
        this.onConsigneeChange();
      } else {
        this.b['ShipperName']?.setValue(null);
        this.b['ShipperAddress']?.setValue('');
        this.onShipperChange();
      }
      return;
    }

    if (exportImportType === 'Import') {
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
        this.b['ConsigneeAddress']?.setValue(consigneeExistInFiltered.Address || consigneeExistInFiltered.CustomerAddress1 || '');
        this.onConsigneeChange(consigneeExistInFiltered);
        this.onShipperChange();
      } else if (consigneeExist) {
        this.b['ConsigneeName']?.setValue(consigneeExist.CustomerName);
        this.b['ConsigneeAddress']?.setValue(consigneeExist.Address || consigneeExist.CustomerAddress1 || '');
        this.onConsigneeChange(consigneeExist);
        this.onShipperChange();
      } else {
        this.b['ConsigneeName']?.setValue(null);
        this.b['ConsigneeAddress']?.setValue('');
        this.onConsigneeChange();
      }
    }
  }


  syncFormValueWithRateComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.b['DepartmentMasterSid']?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const selectedPOO = this.b['POO']?.value;
    const selectedPOL = this.b['POL']?.value;
    const selectedPOD = this.b['POD']?.value;
    const selectedFPD = this.b['FPD']?.value;
    const MBLNo = this.b['MBLNo']?.value;
    const HBLNo = this.b['HBLNo']?.value;
    const EffectiveDate = this.b['MBLDate']?.value;
    const ExpiredDate = this.b['MBLDate']?.value;
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
    const HouseJobSid = this.HouseJobSid || this.serviceJobData?.HouseJobSid || this.b['HouseJobSid']?.value;
    const MasterJobSid = this.serviceJobData?.MasterJobSid || this.b['MasterJobSid']?.value;
    const MasterJobNumber = this.serviceJobData?.masterJob?.MasterJobNumber || this.b['MasterJobNumber']?.value;

    const rawCargo = this.serviceJobData?.Cargo?.[0] || {};
    const containerTypeSid = rawCargo.ContainerType || null;
    const cargoItems = [{
      CargoType: rawCargo.CargoType,
      ContainerType: containerTypeSid,
      ContainerTypeName: this.containerTypeList?.find(
        ct => ct.ContainerTypeMasterSid === containerTypeSid
      )?.ContainerName || null,
      GrossWeight: rawCargo.GrossWeight,
      Volume: rawCargo.Volume,
      NoofContainers: rawCargo.NoofContainers,
      ChargeableWeight: rawCargo.ChargeableWeight,
      ShipmentTerms: rawCargo.ShipmentTerms,
    }];

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      ParentSid : HouseJobSid,
      CustomerMasterSid,
      CustomerBranchSid,
      CustomerName: this.b['CustomerName']?.value || '',
      CustomerAddress: this.b['CustomerAddress']?.value || '',
      ShipperName: this.b['ShipperName']?.value || '',
      ShipperAddress: this.b['ShipperAddress']?.value || '',
      ConsigneeName: this.b['ConsigneeName']?.value || '',
      ConsigneeAddress: this.b['ConsigneeAddress']?.value || '',
      departmentName,
      MBLNo,
      HBLNo,
      ShipmentNo: this.b['ShipmentNo']?.value || '',
      status: this.b['status']?.value || '',
      parentMenuName: 'Service Job',
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
      ContainerType: containerTypeSid,
      CargoType,
      GrossWeight,
      NetWeight,
      Volume,
      NoofContainers,
      ChargeableWeight,
      cargoItems,
      countryOfCompany : this.countryOfCompany,
      MasterJobSid,
      MasterJobNumber
    }
  }


  async sendManualMail(): Promise<void> {
    this.spinner.show();
    const pdfBlob = await this.generatePDFBlob();
    let attachmentFile: File | undefined;
    if (pdfBlob) {
      attachmentFile = new File([pdfBlob], (this.serviceJobData?.ServiceJobNo || 'ServiceJob') + '.pdf', { type: 'application/pdf' });
    }
    const menuMasterSid = this.MenuMasterSid || this.currentMenuId || Number(sessionStorage.getItem('currentMenuId'));
    const customerBranchSid =
      this.serviceJobData?.CustomerBranchSid ||
      this.serviceJobForm?.get('CustomerBranchSid')?.getRawValue() ||
      this.selectedCustomerBranch?.CustomerBranchSid ||
      null;
    const customerMasterSid =
      this.serviceJobData?.CustomerMasterSid ||
      this.serviceJobForm?.get('CustomerMasterSid')?.getRawValue() ||
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
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid,
      action: 'UPDATE',
      attachmentFile,
      context: {
        allowManualEmailEntry: true,
        requireToEmail: false,
        menuMasterSid,
        resourceSid: this.serviceJobData?.HouseJobSid || this.HouseJobSid,
        userName: this.userData?.userName,
        toEmail: organizationEmail,
        ccEmail,
        organizationEmail,
        customerEmail: organizationEmail,
        customerBranchSid,
        customerMasterSid
      }
    });
    const payload = {
        tableName: 'HouseJob',
        recordId: String(this.serviceJobData?.HouseJobSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Email Send'
        },
        newVal: {
          Email: 'Service Job Email Send',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
      this.spinner.hide();
  }

  navigateBack() {
    this.router.navigate(['operation/service-job/list']);
  }
  
  selectedTab = 'Rate';
  isQuickFormExpanded = false;

  resetForm() {
    if(this.isEditMode){
      this.patchValues(this.serviceJobData);
    }else{
      this.serviceJobForm.reset({
        status : 'Active',
        isShipperFreeText: false,
        isConsigneeFreeText: false,
        isVesselFreeText: false,
        isVoyageFreeText: false
      });
      this.clearVesselAndVoyageData();
      this.selectedCustomer = null;
      this.selectedCustomerBranch = null;
      this.customerBranchList = [];
      this.filteredShipperList = [...this.shipperList];
      this.filteredConsigneeList = [...this.consigneeList];
      this.resetTriggerMilestone = !this.resetTriggerMilestone;
      this.milestoneResult = [];
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
        if (!this.serviceJobData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.serviceJobData;
        modalRef.componentInstance.idLabel = 'Service Job Id';
        modalRef.componentInstance.idValue = this.serviceJobData?.HouseJobSid;
    }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const departmentSid = this.serviceJobData?.DepartmentMasterSid;
    const pol = this.serviceJobData?.POL;
    const pod = this.serviceJobData?.POD;
    const carrier = this.serviceJobData?.CarrierSid;
    const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.serviceJobData?.HouseJobSid
  };
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DepartmentMasterSid: departmentSid,
      POL: pol,
      POD: pod,
      Carrier: carrier,
      DocumentSid: this.serviceJobData?.HouseJobSid
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
      (a?.DocumentSid ?? this.serviceJobData?.HouseJobSid ?? null) ===
      (b?.DocumentSid ?? this.serviceJobData?.HouseJobSid ?? null)
    );
     const openModal = (terms: any[]) => {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = terms || [];
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.serviceJobData?.HouseJobSid;
          modalRef.componentInstance.DepartmentMasterSid = departmentSid;
          modalRef.componentInstance.POL = pol;
          modalRef.componentInstance.POD = pod;
          modalRef.componentInstance.Carrier = carrier;
          modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
     }

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
 openEmail() {
    if (!this.serviceJobData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

    openAuthority() {
    const menuMasterSid = Number(this.MenuMasterSid || this.currentMenuId || sessionStorage.getItem('currentMenuId'));
    const documentSid = this.HouseJobSid || this.serviceJobData?.HouseJobSid;
    if (!menuMasterSid || !documentSid) {
      this.appSettingService.showWarning('Please save the service job before viewing authorization.');
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
    modalRef.componentInstance.DepartmentMasterSid =
      this.serviceJobData?.DepartmentMasterSid ?? this.b['DepartmentMasterSid']?.value ?? null;
    modalRef.componentInstance.allowAction = true;
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
  if (!this.serviceJobData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.serviceJobData;
  modalRef.componentInstance.idLabel = 'Service Job Id';
  modalRef.componentInstance.idValue = this.serviceJobData?.headerId;
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.HouseJobSid
  }

      this.commonService.documentData.set(data)
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
    modalRef.componentInstance.DocumentSid = this.HouseJobSid;
  }



  openFollowup() {
     if (!this.serviceJobData) return;
     const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
     modalRef.componentInstance.documentSid = this.serviceJobData?.QuoteHeaderSid;
     modalRef.componentInstance.menuMasterSid = this.MenuMasterSid;
     modalRef.componentInstance.parentEmail = this.serviceJobData.Email;
     modalRef.componentInstance.parentSubject = `Quotation No.${this.serviceJobData.QuoteNumber} Date:${new Date(this.serviceJobData.QuoteDate).toLocaleDateString()}`;
     modalRef.componentInstance.parentMailbody = `
     <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
       <p>Dear Sir/Madam,</p>
       <p>Please find enclosed the quotation as requested.</p>
       <p>Kindly review the details at your convenience.</p>
       <p>Looking forward to your feedback and the opportunity to work together.</p>
       <p>
         Approval Hyperlink: 
         <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
       </p>
       <p>Best Regards,</p>
       <p>${this.userData['userEmail']}</p>
     </div>
   `;
 
   // Optionally, pass the quotation HTML content ID for PDF generation
   modalRef.componentInstance.pdfContentId = 'quotationContent';
   }

  openAuditLogs() {
      if (!this.HouseJobSid) return;
      const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'ServiceJob Logs';
    modalRef.componentInstance.tableName = 'HouseJob';
    modalRef.componentInstance.recordId = this.HouseJobSid.toString();
    modalRef.componentInstance.screenName = 'ServiceJob';
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



  reportAndEmailModel(content: TemplateRef<any>) {
    this.modalService.open(content, {
      size: 'xl',
      scrollable: true,
    });
  }

  reportjobCard() {
    const modalRef = this.modalService.open(JobCardComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.housejobData = this.serviceJobData || [];
    modalRef.componentInstance.masterJobData = this.serviceJobData?.masterJob || null;
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.packageTypeList = [];
    modalRef.componentInstance.agentList = [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.chargeList = this.costEntryComponent?.chargeList || [];
    modalRef.componentInstance.profitSummary = [];
    modalRef.componentInstance.customerWiseSummary = { revenue: [], cost: [] };
    modalRef.componentInstance.chargeWiseSummary = [];
    modalRef.componentInstance.uomList = this.costEntryComponent?.uomList || [];
    modalRef.componentInstance.portList = this.portList || [];
    modalRef.componentInstance.selectedDepartmentType = this.selectedDepartmentType || [];
    modalRef.componentInstance.houseMenuMasterSid =
      this.currentMenuId || Number(sessionStorage.getItem('currentMenuId'));
  }

  reportProofofDelivery() {
    const modalRef = this.modalService.open(ProofOfDeliveryComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.housejobData = this.serviceJobData || [];
    modalRef.componentInstance.masterJobData = this.serviceJobData?.masterJob || null;
    modalRef.componentInstance.masterJobContainers = this.serviceJobData?.containers || [];
    modalRef.componentInstance.packageTypeList = [];
    modalRef.componentInstance.TandCList = this.TandCList || [];
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || 'LCL';
    modalRef.componentInstance.portList = this.portList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.selectedDepartmentType = this.selectedDepartmentType || [];
    modalRef.componentInstance.houseMenuMasterSid =
      this.currentMenuId || Number(sessionStorage.getItem('currentMenuId'));
  }

   reportPerformaInvoice() {
                const modalRef = this.modalService.open(PerformaInvoiceComponent, {
                  size: 'xl',
                  scrollable: true,
                });
                // modalRef.componentInstance.masterJobData = this.masterJobData;
                modalRef.componentInstance.housejobData = this.serviceJobData || [];
                // modalRef.componentInstance.masterJobContainers = this.masterJobContainers.getRawValue() || [];
                modalRef.componentInstance.masterJobContainers = this.serviceJobData?.containers || [];
                // modalRef.componentInstance.packageTypeList = this.packageTypeList;
                modalRef.componentInstance.TandCList = this.TandCList || [];
                modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || 'LCL';
                modalRef.componentInstance.portList = this.portList || [];
                modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
                modalRef.componentInstance.houseMenuMasterSid = this.currentMenuId;
                modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
                modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
              }


  async sendEmail() {
    try {
      this.spinner.show();
      const pdfBlob = await this.generatePDFBlob();

      const formData = new FormData();
      const toEmailSet = new Set<string>();

      if (this.selectedCustomer?.Email) {
        toEmailSet.add(this.selectedCustomer.Email);
      }
      if (toEmailSet.size === 0 && this.selectedCustomer?.CustomerBranchSid) {
        const resp: any = await firstValueFrom(
          this.operationService.getCustomerBranchEmail(this.selectedCustomer.CustomerBranchSid)
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
      const POL = this.houseData?.POL;
      const POD = this.houseData?.POD;
      const FPD = this.houseData?.FPD;
      const formattedPOL = getFormattedPort(this.portList,POL);
      const formattedPOD = getFormattedPort(this.portList,POD);
      const formattedFPD = getFormattedPort(this.portList,FPD);
      formData.append('Subject', `Booking No.${this.houseData.BookingNo} Date:${this.datePipe.transform(this.houseData?.BookingDateTime)} ${formattedPOL} - ${formattedPOD} confirmation`);
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
      formData.append('file', pdfBlob, (this.houseData?.bookingNumber || 'booking') + '.pdf');
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


  ngOnDestroy() {
    this.commonService.clearDocumentData()
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }

  existsInList(list: any[], value: any, field: string = 'CustomerName') {
    if (list) {
      return list.some(item => item?.[field] === value);
    }
    return null;
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
    return this.serviceJobForm.get('status')?.value;
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

  private subscribeToFormChanges(): void {
    this.serviceJobForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.updateDirtyState());

    this.cargoForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.updateDirtyState());
  }

  private updateDirtyState(): void {
    if (this.initialFormValue === null) {
      return;
    }
    this.isDirty = !this.deepEqual(this.initialFormValue, this.getCurrentFormState());
  }

  private captureInitialFormState(): void {
    setTimeout(() => {
      this.initialFormValue = this.getCurrentFormState();
      this.isDirty = false;
    }, 0);
  }

  private getCurrentFormState(): any {
    return {
      bookingForm: this.serviceJobForm?.getRawValue?.(),
      cargoForm: this.cargoForm?.getRawValue?.(),
      rateResult: this.serviceJobRateResults || [],
      milestoneResult: this.milestoneResult || [],
    };
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined || value === '') {
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
      return value.map((v) => this.normalizeValue(v));
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
       
 private async performDuplicateCheck(payload: any): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.operationService.checkDuplicateServiceJob(payload)
      );

      if (response.data) {
        return await this.commonModalService.confirm(
          `Today there was a service job created for this house.\nDo you want to proceed?`,
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
  navigateToServiceJobEntry(): void {
        this.router.navigate(['operation/service-job/entry']);
    }
  
}

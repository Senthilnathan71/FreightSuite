import { Component, ViewChild, TemplateRef, OnInit, Input, OnDestroy } from '@angular/core';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
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
    TimeAgoPipe
  ],
  templateUrl: './service-job-entry.component.html',
  styleUrl: './service-job-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class ServiceJobEntryComponent implements OnInit, OnDestroy {


  /**
    |--------------------------------------------------
    |   Section-1 Variable Declaration
    |--------------------------------------------------
  */

  private destroy$ = new Subject<void>();
  @ViewChild('costEntryComponent') costEntryComponent: CostEntryComponent;
  @ViewChild('departmentLookup') departmentLookup!: SearchableDropdown;


  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;

  //Variable Declaration - Common 
  serviceJobForm !: FormGroup;
  detailForm !: FormGroup;
  userData: any;
  isPrintLoading: boolean;
  currentCompany: any;
  currentBranch: any;
  countryOfCompany : string;
  MenuMasterSid: any;
  filterOption: any;
  decimalAfterPrecision = 3;
  public rateComponent = CostEntryComponent;
  isSaving : boolean = false;
  
  selectTab(tab: string) {
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
  TandCList: any[] = [];
  currencyList : any[] = [];
  houseData: any;
  selectedCustomerBranch: any;


  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

  permissions: any[] = [];
  currentMenuPermissions = {};

  private initialFormValue: string;
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
    { name: 'Rate', icon: 'fas fa-rupee-sign' }
  ];
  // Mail content
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;


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

  /**
    |--------------------------------------------------
    |   Section-3 : NgOnInit Part
    |--------------------------------------------------
    */
  
  ngOnInit(): void {
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

    this.spinner.show();
    this.loadHeaderMandatoryParts().subscribe(() => {
      this.currentRoute.paramMap.subscribe((param) => {
        this.HouseJobSid = +param.get('id');
        if (this.HouseJobSid) {
          this.isEditMode = true;
          this.loadServiceJobById(this.HouseJobSid);
        }
      });

      this.loadCargoLookups();
      this.spinner.hide();
    });
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
      ShipmentNo : [],
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
      FPD: [null]
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

    }).pipe(tap(({
      departments, customers, shippers, consignees, ports, userCountry,currencies
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
      this.currencyList = (currencies.data || []).map(c => ({ ...c, Country: c?.countryMaster?.countryName }));
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
    this.operationService.getServiceJobById(houseJobSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.patchValues(resp.data);
          this.serviceJobData = resp.data;
          this.minDate = undefined;
          this.spinner.hide();
          this.captureInitialFormState();
        }
      }
    )
  }

  patchValues(response: any) {
    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectedCustomer = this.customerList.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
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
      BookingStatus: response.BookingStatus,
      ShipmentNo: response.ShipmentNo
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

    
    this.serviceJobRateResults = [...this.serviceJobRateArr];


    this.syncFormValueWithRateComponent();
  }


  handleRateChange(allRates: any[]) {
    console.log(allRates);
    if (allRates.length > 0) {
      this.serviceJobRateResults = [...allRates];
    }
  }




   async onSubmit() {
   const fy = this.appSettingService.getCurrentFinancialYear();
    if(fy){
      const MBLDate =new Date (this. serviceJobForm.getRawValue().MBLDate);
      const fyStartDate = new Date(fy.StartDate);
      const fyEndDate = new Date(fy.EndDate);
      if(MBLDate < fyStartDate || MBLDate > fyEndDate){
        this.toastr.error('The date of the master job must be between the financial year start date and end date');
        this.serviceJobForm.get('MasterJobDate')?.setErrors({ invalidDate: true });
        return;
      }
    }
    console.log('Submit triggered', this.serviceJobForm.value);
    if (this.isEditMode) {
      const currentFormState = JSON.stringify(this.getCurrentFormState());
      if (this.initialFormValue === currentFormState) {
        this.appSettingService.showWarning('No changes are there to save.');
        return;
      }
    }
    if (this.serviceJobForm.invalid) {
      this.serviceJobForm.markAllAsTouched();
      this.serviceJobForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    if (!this.costEntryComponent.validateRateArray()) {
      this.selectedTab = 'Rate';
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
      HBLNo: serviceFormValue.HBLNo,
      JobType: serviceFormValue.JobType,
      MBLNo: serviceFormValue.MBLNo,
      MBLDate: serviceFormValue.MBLDate ? new Date(serviceFormValue.MBLDate) : null,
      HBLDate: serviceFormValue.MBLDate ? new Date(serviceFormValue.MBLDate) : null,
      MasterJobDate: serviceFormValue.MBLDate ? new Date(serviceFormValue.MasterJobDate) : null,
      CustomerMasterSid: serviceFormValue.CustomerMasterSid,
      CustomerBranchSid: serviceFormValue.CustomerBranchSid || null,
      CustomerName: serviceFormValue.CustomerName,
      CustomerAddress: serviceFormValue.CustomerAddress,
      ShipperName: serviceFormValue.ShipperName,
      ShipperAddress: serviceFormValue.ShipperAddress,
      ConsigneeName: serviceFormValue.ConsigneeName,
      ConsigneeAddress: serviceFormValue.ConsigneeAddress,
      ShipmentNo : serviceFormValue.ShipmentNo || "",
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
        return; // STOP submission
      }
    }
    this.isSaving = true;
    this.spinner.show();

    if (this.isEditMode && this.HouseJobSid) {
      this.operationService.updateServiceJobById(this.HouseJobSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Service Job successfully updated.');
            this.loadServiceJobById(this.HouseJobSid);
          } else {
            this.appSettingService.showError('Error updating Service Job.');
            console.error(resp.message);
          }
        },
        error: (err) => {
          this.appSettingService.showError('Failed to update Service Job.');
          console.error(err);
        }
      });
    } else {
      this.operationService.createServiceJob(payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Service Job successfully created.');
            const houseId = resp.data?.HouseJobSid;
            this.router.navigate(['operation/service-job/entry', houseId]);
          } else {
            this.appSettingService.showError('Error creating service job.');
            console.error(resp.message);
          }
        },
        error: (err) => {
          this.appSettingService.showError('Failed to create service job.');
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
    // this.b['JobType'].setValue(department.ExportImport);
    
    this.onRouteChange()
    this.syncFormValueWithRateComponent();
    this.autoSetJobType(department);

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
    this.filteredPorts = filteredLists.filteredPorts;
    this.filteredPOO = filteredLists.filteredPOO;
    this.filteredPOL = filteredLists.filteredPOL;
    this.filteredPOD = filteredLists.filteredPOD;
    this.filteredFPOD = filteredLists.filteredFPOD;

    if (this.clearInvalidPortSelections(filteredLists)) {
      const updatedLists = this.buildPortFilterLists();
      this.filteredPorts = updatedLists.filteredPorts;
      this.filteredPOO = updatedLists.filteredPOO;
      this.filteredPOL = updatedLists.filteredPOL;
      this.filteredPOD = updatedLists.filteredPOD;
      this.filteredFPOD = updatedLists.filteredFPOD;
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
      fpodPorts = [...foreignPorts];
    } else if (shipmentDirection === 'IMPORT') {
      pooPorts = [...foreignPorts];
      polPorts = [...foreignPorts];
      podPorts = [...companyCountryPorts];
      fpodPorts = [...companyCountryPorts];
    }

    const selectedPOO = this.b['POO']?.value;
    const selectedPOL = this.b['POL']?.value;
    const selectedPOD = this.b['POD']?.value;
    const selectedFPD = this.b['FPD']?.value;

    return {
      filteredPorts: basePorts,
      filteredPOO: pooPorts.filter(port => port.PortCode !== selectedPOD),
      filteredPOL: polPorts.filter(port => port.PortCode !== selectedPOD),
      filteredPOD: podPorts.filter(port => port.PortCode !== selectedPOL),
      filteredFPOD: fpodPorts.filter(port => port.PortCode !== selectedPOO)
    };
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
    const selectedPOL = this.b['POL']?.value;
    const selectedPOD = this.b['POD']?.value;
    const MBLNo = this.b['MBLNo']?.value;
    const HBLNo = this.b['HBLNo']?.value;
    const EffectiveDate = this.b['MBLDate']?.value;
    const ExpiredDate = this.b['MBLDate']?.value;
    const POLSid = (this.portList.find(p => p.PortCode === selectedPOL)?.PortMasterSid)
    const PODSid = (this.portList.find(p => p.PortCode === selectedPOD)?.PortMasterSid)
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
      POLSid,
      PODSid,
      EffectiveDate,
      ExpiredDate,
      CargoType,
      GrossWeight,
      NetWeight,
      Volume,
      NoofContainers,
      ChargeableWeight,
      countryOfCompany : this.countryOfCompany,
      MasterJobSid,
      MasterJobNumber
    }
  }


  async sendManualMail(): Promise<void> {
    const pdfBlob = await this.generatePDFBlob();
    let attachmentFile: File | undefined;
    if (pdfBlob) {
      attachmentFile = new File([pdfBlob], (this.serviceJobData?.ServiceJobNo || 'ServiceJob') + '.pdf', { type: 'application/pdf' });
    }
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: this.MenuMasterSid,
      action: 'UPDATE',
      attachmentFile,
      context: {
        userName: this.userData?.userName,
        menuEmail: ''
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
        isConsigneeFreeText: false
      });
      this.selectedCustomer = null;
      this.selectedCustomerBranch = null;
      this.customerBranchList = [];
      this.filteredShipperList = [...this.shipperList];
      this.filteredConsigneeList = [...this.consigneeList];
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
    const departmentSid = this.serviceJobData?.DepartmentMasterSid;
    const pol = this.serviceJobData?.POL;
    const pod = this.serviceJobData?.POD;
    const carrier = this.serviceJobData?.CarrierSid;
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DepartmentMasterSid: departmentSid,
      POL: pol,
      POD: pod,
      Carrier: carrier,
      DocumentSid: this.serviceJobData?.HouseJobSid
     };
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
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
   const modalRef = this.modalService.open(AuthorityLogComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.HouseJobSid;
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



  openFollowup() {
     if (!this.serviceJobData) return;
     const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
     modalRef.componentInstance.documentSid = this.serviceJobData?.QuoteHeaderSid;
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
    modalRef.componentInstance.chargeList = [];
    modalRef.componentInstance.profitSummary = [];
    modalRef.componentInstance.customerWiseSummary = { revenue: [], cost: [] };
    modalRef.componentInstance.chargeWiseSummary = [];
    modalRef.componentInstance.uomList = this.costEntryComponent?.uomList || [];
    modalRef.componentInstance.portList = this.portList || [];
    modalRef.componentInstance.selectedDepartmentType = this.selectedDepartmentType || [];
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

  existsInList(list: any[], value: any) {
    if (list) {
      return list.some(item => item.CustomerName === value);
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
      bookingForm: this.serviceJobForm.getRawValue(),
      cargoForm: this.cargoForm.getRawValue(),
      rateResult: this.serviceJobRateResults,
    };
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

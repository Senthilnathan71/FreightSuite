import { Component, ViewChild, TemplateRef, OnInit, Input, OnDestroy } from '@angular/core';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, delay, firstValueFrom, forkJoin, of, tap } from 'rxjs';
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
import * as html2pdf from 'html2pdf.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';

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
    NgxSpinnerModule
  ],
  templateUrl: './booking-entry.component.html',
  styleUrls: ['./booking-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class BookingEntryComponent implements OnInit,OnDestroy {


  /**
    |--------------------------------------------------
    |   Section-1 Variable Declaration
    |--------------------------------------------------
  */


  @ViewChild('uploadModal') uploadModal!: BookingUploadComponent;
  parsedBookings: BookingData[] = [];
  showParsedData = false;
  uploadResult: any = null;

  //Variable Declaration - Common 
  detailForm !: FormGroup;
  userData : any;
  isPrintLoading : boolean;
  currentCompany : any;
  currentBranch : any;
  filterOption : any;
    public rateComponent = CostEntryComponent;
    public ArApcomponent = ArApComponent;
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

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
  carrierList: any[] = [];
  notifyList: any[] = [];
  vesselList: any[] = [];
  headerVesselList: any[] = [];
  voyageList: any[] = [];
  portList: any[] = [];
  filteredPorts: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  incoList: any[] = [];
  TandCList: any[]=[];
  bookingHeader: any;
  selectedCustomerBranch : any;
  
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;


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
  selectedContainerType : any;
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

  // Variable Declaration - Other Part
  YardCFSLabel: string = "Yard/CFS"
  forwarderList: any[] = [];
  currencyList: any[] = [];
  imcoList: any[] = [];
  uomList: any[] = [];
  otherForm !: FormGroup;

  // Variable Declaration - Connection Part
  PODandFPODsame : boolean = true;
  minStartDate : Date = new Date();
  resetTriggerConnection : boolean;
  bookingConnectionsArr : any[] = [];
  connectionResult : any[] =[];
    

  // Variable Declaration - Rate Part
  resetTriggerRate : boolean;
  rateResult : any[] = [];
  bookingRateArr : any[] = [];
  currentFormValue : any;
  
  // Variable Declaration - Milestone Part
  resetTriggerMilestone : boolean;
  milestoneResult: any[] =[];

  today : any;
  minDate : any;
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
    { id: 4, name: 'Drat' },
  ];

  tabs = [
    { name: 'Shipment', icon: 'fas fa-ship' },
    { name: 'Cargo', icon: 'fas fa-boxes' },
    // { name: 'Product', icon: 'fas fa-box' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'AR/AP', icon: 'fas fa-file-alt' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
  ];
dataFromQuotation:any
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
    private leadService: LeadService
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
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

  this.filterOption = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid, // fixed: was currentCompany?.BranchMasterSid
  };

  this.initBookingForm();
  this.initCargoForm();
  this.initOtherForm();
  this.initDetailsForm();

  const historyState = history?.state;
  const quotationData = historyState?.dataFromQuotation;

  this.dataFromQuotation = quotationData?.quotation ? quotationData : {};

  // Clear browser state
  if (quotationData?.quotation) history.replaceState({}, '', location.pathname);

  console.log(this.dataFromQuotation, 'dataFromQuotation');

  // Load lookups first
  this.loadHeaderLookups().subscribe(() => {
    this.loadCargoLookups();
    this.loadOtherLookups();

    if (this.dataFromQuotation?.quotation) {
      this.patchBookingFromQuotation(this.dataFromQuotation);
      this.minDate = this.today;
    } else {
      this.currentRoute.paramMap.subscribe((param) => {
        this.BookingHeaderSid = +param.get('id');
        if (this.BookingHeaderSid) {
          this.isEditMode = true;
          this.loadBookingById(this.BookingHeaderSid);
        } else {
          this.minDate = this.today;
        }
      });
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
    this.bookingForm = this.fb.group({
      BookingNo: [{ value: '', disabled: true }],
      BookingDateTime: [{ value: '', disabled: true }],
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
      DestinationAgent : [null, [Validators.required]],
      AgentAddress: [''],
      CarrierName: [null],
      QuotationHeaderSid: [{ value: '', disabled: true }],
      HBLNo: [{ value: '', disabled: true }],
      MBLNo: [{ value: '', disabled: true }],
      MBLDate: [{ value: '', disabled: true }],
      status: ['Active'],

      VesselName: [null],
      VoyageMasterSid: [null],
      VoyageNo: [null],
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
      FreightTerms : [null],
      Coload: [false],
      ShipmentType: [false],
      IncoTerms: [null, [Validators.required]],
      InternalNote: [''],
      GeneralNote: [''],
      NominatedBy: ['Self'],

      ShipmentNo: ['']
    })
    this.bookingForm.valueChanges.subscribe(()=>{
      this.syncFormValueWithRateComponent();
    })
  }

  // Cargo Form Initiation
  initCargoForm() {
    this.cargoForm = this.fb.group({
      BookingCargoSid: [null],
      CargoType: [null],
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
      ModeOfTransport : [null],
      StuffingAt: ['Dock']
    })
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
      ShippingBillNo: ['',isIndianCompany ? [Validators.required] : []],
      ShippingBillDate: [null,isIndianCompany ? [Validators.required] : []],
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
      CargoRecDate : [null]
    })
  }

  initOtherForm() {
    this.otherForm = this.fb.group({
      BookingOthersSid: [null],
      CustomerRefNo: [''],
      YardCFS: [''],
      ReleaseType: [null],
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
      CarrierBookingRef : [''],
      CarrierBookingDate : ['']
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
      ProductName: [data?.ProductName || ''],
      ShippingBillNo: [data?.ShippingBillNo || ''],
      ShippingBillDate: [data?.ShippingBillDate ? new Date(data?.ShippingBillDate) : null],
      ExternaPkg: [data?.ExternaPkg || null, [Validators.required]],
      ExternlQty: [data?.ExternlQty || '', [Validators.required]],
      GrossWeight: [data?.GrossWeight || '', [Validators.required]],
      NetWeight: [data?.NetWeight || '', [Validators.required]],
      Volume: [data?.Volume || '', [Validators.required]],
      IsHaz : [data?.IsHaz ? (data.IsHaz === "Y" ? true : false) : false],
      ImcoClass : [data?.ImcoClass || null],
      UnNo : [data?.UnNo || ''],
      PkgGroup : [data?.PkgGroup || ''],
      Length : [data?.Length || ''],
      Width : [data?.Width || ''],
      Height : [data?.Height || ''],
      UomMasterSid : [data?.UomMasterSid || null],
      CargoRecDate : [data?.CargoRecDate ? new Date(data?.CargoRecDate) : null]
    })
    return productForm;
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

  loadHeaderLookups() {
    return forkJoin({
      allMasters: this.operationService.getBookingHeaderLookups(this.filterOption).pipe(catchError(err => of( {departments: [],vessels: [], ports: [], incos: [] , country : Object }))),
      customerMaster: this.operationService.getAllCustomerRelatedLookups(this.filterOption).pipe(catchError(err => of({ customers: [], salesmans: [], shippers: [], consignees: [], agents: [], carriers: [], forwarder: [], notify: [] }))),
    }).pipe(tap(({ allMasters, customerMaster}) => {
      this.departmentList = allMasters.departments;
      this.customerList = customerMaster.customers;
      this.salesmanList = customerMaster.salesmans;
      this.shipperList = customerMaster.shippers;
      this.filteredShipperList = customerMaster.shippers;
      this.consigneeList = customerMaster.consignees;
      this.filteredConsigneeList = customerMaster.consignees;
      this.agentList = customerMaster.agents;
      this.carrierList = customerMaster.carriers;
      this.forwarderList = customerMaster.forwarder;
      this.notifyList = customerMaster.notify;
      this.vesselList = allMasters.vessels;
      this.portList = allMasters.ports;
      this.incoList = allMasters.incos;
      this.countryOfCompany = (allMasters?.country?.countryMaster?.countryName).trim().toLowerCase();
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
      currencies: this.operationService.getAllCurrencies().pipe(catchError(err => of({ data: [] }))),
    }).subscribe(({ currencies }) => {
      this.currencyList = currencies.data;
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

  loadBookingById(BookingHeaderSid: number) {
    this.operationService.getBookingById(BookingHeaderSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          // this.resetForm();
          this.patchValues(resp.data);
          this.bookingData = resp.data;
          this.minDate = undefined;
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
    this.bookingForm.patchValue({
      BookingNo: response.BookingNo,
      BookingDateTime:response.BookingDateTime ? new Date(response.BookingDateTime) : null,
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
      FreightTerms : response.FreightTerms,
      ShipmentNo: response.ShipmentNo
    })
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
      ModeOfTransport : cargoData?.ModeOfTransport,
      StuffingAt: cargoData?.StuffingAt
    })
    this.handleCFSOrYard();
    const otherData = response.bookingOthers[0];
    this.otherForm.patchValue({
      BookingOthersSid: otherData?.BookingOthersSid,
      CustomerRefNo: otherData?.CustomerRefNo,
      YardCFS: otherData?.YardCFS,
      ReleaseType : otherData?.ReleaseType || null,
      HBLNo: otherData?.HBLNo || null,
      Forwarder: otherData?.Forwarder || null,
      ForwarderAddress: otherData?.ForwarderAddress,
      NotifyParty: otherData?.NotifyParty || null,
      NotifyPartyAddress: otherData?.NotifyPartyAddress,
      Notify2 : otherData?.Notify2 || null,
      NotifyAddress2 : otherData?.NotifyAddress2,
      Coloader : otherData?.Coloader || null,
      PickupPlace: otherData?.PickupPlace,
      DeliveryPlace: otherData?.DeliveryPlace,
      DeliveryDate:otherData?.DeliveryDate ? new Date(otherData?.DeliveryDate) : null,
      CHAName: otherData?.CHAName,
      PickupAddress: otherData?.PickupAddress,
      DeliveryAddress: otherData?.DeliveryAddress,
      CargoCurrency: otherData?.CargoCurrency,
      CargoValue: otherData?.CargoValue,
      SwitchBL: otherData?.SwitchBL === "Y" ? true : false,
      BacktoBack: otherData?.BacktoBack === "Y" ? true : false,
      Depo: otherData?.Depo,
      ROValidity:otherData?.ROValidity ? new Date(otherData?.ROValidity) : null,
      SwitchBLAgent : otherData?.SwitchBLAgent,
      AgentAddress : otherData?.AgentAddress,
      SwitchBLShipper : otherData?.SwitchBLShipper,
      SwitchBLConsignee : otherData?.SwitchBLConsignee,
      SwitchLocation  : otherData?.SwitchLocation,
      CarrierBookingRef : otherData?.CarrierBookingRef,
      CarrierBookingDate :otherData?.CarrierBookingDate ? new Date(otherData?.CarrierBookingDate) : null
    })

    this.bookingProducts.clear();
    const productsFromResponse = response.bookingProduct || [];
    this.productDataLength = productsFromResponse.length;
    for (const productData of productsFromResponse) {
      const formWithData = this.createBookingProductGroup(productData);
      this.bookingProducts.push(formWithData);
    }
    this.updateProductPagination();
    this.handleProductRelatedCalculation();

    this.bookingConnectionsArr = (response.bookingConnection || []).map(connection => {
      return {
        ...connection,
        TransactionSid : connection.BookingConnectionSid,
      }
    }); // for child component
    this.connectionResult = [...this.bookingConnectionsArr]

    this.bookingRateArr = response.bookingRates || [];
    this.rateResult = [...this.bookingRateArr];

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

  onContainerTypeChange(containerType : any){
    if(!containerType){
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
        CargoRecDate : data?.CargoRecDate
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
    if(this.productForm.invalid){
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

  handleConnectionChange(allConnections:any[]){
    console.log(allConnections);
    if(allConnections.length > 0){
      this.connectionResult = [...allConnections];
    }
  }

  handleRateChange(allRates:any[]){
    console.log(allRates);
    if(allRates.length > 0){
      this.rateResult = [...allRates];
    }
  }

  handleMilestoneChange(allmilestones:any[]){
    console.log(allmilestones);
    if(allmilestones.length !== 0){
      this.milestoneResult = [...allmilestones];
    }
  }




  onSubmit() {
    console.log('Submit triggered');
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.bookingForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
    const bookingFormValue = this.bookingForm.getRawValue();
    const cargoFormValue = this.cargoForm.getRawValue();
    const otherFormValue = this.otherForm.getRawValue();
    const detailFormValue = this.detailForm.getRawValue();
    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid : currentMenuId,
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
      FreightTerms : bookingFormValue.FreightTerms || '',
      ShipmentNo: bookingFormValue.ShipmentNo || '',
      bookingCargo: {
        BookingCargoSid : cargoFormValue.BookingCargoSid || null,
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
        ModeOfTransport : cargoFormValue.ModeOfTransport || null,
        StuffingAt: cargoFormValue.StuffingAt || 'Dock',
      },
      bookingOther: {
        BookingOthersSid : otherFormValue.BookingOthersSid || null,
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
        CarrierBookingRef : otherFormValue?.CarrierBookingRef,
        CarrierBookingDate : otherFormValue?.CarrierBookingDate ? new Date(otherFormValue?.CarrierBookingDate) : null
      },
      bookingProducts: detailFormValue.bookingProducts.map((product: any) => ({
        BookingProductSid : product.BookingProductSid || null,
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
        CargoRecDate : product.CargoRecDate
      })),
      bookingConnections: this.connectionResult,
      bookingRates: this.rateResult,
      milestones: this.milestoneResult ,
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };

    console.log('Submitted payload:', payload);

    if (this.isEditMode && this.BookingHeaderSid) {
      this.operationService.updateBookingById(this.BookingHeaderSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Booking successfully updated.');
            this.router.navigate(['operation/booking/list']);
            // this.loadBookingById(this.BookingHeaderSid);
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
            const bookingId = resp.data?.newBooking?.BookingHeaderSid;
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
      this.customerBranchList = [];
      this.handleImportExport();
      return;
    }
    this.b['CustomerName']?.setValue(customer.CustomerName);
    this.b['CustomerAddress']?.setValue(null);
    this.getCustomerBranchByCustomer(customer.CustomerMasterSid);
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
      const customerName = this.b['CustomerName']?.value;

      if (!customerName) {
        this.b['ShipperName']?.setValue(null);
        this.b['ShipperAddress']?.setValue('');
        this.onShipperChange();
        return;
      }

      const shipperExist = this.shipperList.find(s => s.CustomerName === customerName);
      const shipperExistInFiltered = this.filteredShipperList.find(s => s.CustomerName === customerName);

      if(shipperExist && shipperExistInFiltered) {
        this.b['ShipperName']?.setValue(shipperExistInFiltered.CustomerName);
        this.b['ShipperAddress']?.setValue(shipperExistInFiltered.CustomerAddress1);
        this.onShipperChange(shipperExistInFiltered);
        this.onConsigneeChange();
      } else if (shipperExist && !shipperExistInFiltered) {
        this.b['ShipperName']?.setValue(customerName);
        this.b['ShipperAddress']?.setValue(shipperExist.CustomerAddress1);
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
      const customerName = this.b['CustomerName']?.value;

      if (!customerName) {
        this.b['ConsigneeName']?.setValue(null);
        this.b['ConsigneeAddress']?.setValue('');
        this.onConsigneeChange();
        return;
      }

      const consigneeExist = this.consigneeList.find(c => c.CustomerName === customerName);
      const consigneeExistInFiltered = this.filteredConsigneeList.find(c => c.CustomerName === customerName);

      if (consigneeExist && consigneeExistInFiltered) {
        this.b['ConsigneeName']?.setValue(consigneeExistInFiltered.CustomerName);
        this.b['ConsigneeAddress']?.setValue(consigneeExistInFiltered.CustomerAddress1);
        this.onConsigneeChange(consigneeExistInFiltered);
        this.onShipperChange();
      } else if(consigneeExist && !consigneeExistInFiltered) {
        this.b['ConsigneeName']?.setValue(customerName);
        this.b['ConsigneeAddress']?.setValue(consigneeExist.CustomerAddress1);
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
    this.getVesselBasedOnPorts();
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
    this.getVesselBasedOnPorts();
  }

  handleFPODChange(port){
    if(!port){
      this.PODandFPODsame = true;
      return;
    }
    this.PODandFPODsame = this.b['FPD']?.value === this.b['POD']?.value
  }

  onVesselChange(vessel: any) {
    if (!vessel) {
      this.voyageList = [];
      this.b['VoyageNo']?.setValue(null);
      this.b['ETA'].setValue('');
      this.b['ETD'].setValue('');
      return;
    }
    this.getVoyageForPortsAndVessels();
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
    const POLSid = (this.portList.find(port => port.PortCode === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortCode === POD)?.PortMasterSid);
    const details = voyage.Ports || [];

    const polDetail = details.find(d => d.POLSid === POLSid);
    const polETA = polDetail?.ETD || null;


    const podDetail = details.find(d => d.POLSid === PODSid);
    const podETD = podDetail?.ETA || null;

    this.b['ETD'].setValue(new Date(polETA));
    this.b['ETA'].setValue(new Date(podETD));
    this.minStartDate = new Date(podETD);
  }

  getVesselBasedOnPorts() {
    // const POO = this.b['POO']?.value;
    const POL = this.b['POL']?.value;
    const POD = this.b['POD']?.value;
    // const FPOD = this.b['FPD']?.value;
    const MovementType = this.selectedDepartment?.departmentType;
    const POLSid = (this.portList.find(port => port.PortCode === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortCode === POD)?.PortMasterSid);
    if (!POLSid || !PODSid) return;
    const payload = {  POL: POLSid, POD: PODSid, MovementType: MovementType };
    this.operationService.getVesselsBasedOnPorts(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.headerVesselList = resp.data;
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
    // const POOSid = (this.portList.find(port => port.PortCode === POO)?.PortMasterSid);
    const POLSid = (this.portList.find(port => port.PortCode === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortCode === POD)?.PortMasterSid);
    // const FPODSid = (this.portList.find(port => port.PortCode === FPOD)?.PortMasterSid);
    const vessel = this.b['VesselName']?.value;
    const vesselId = (this.vesselList.find(vsl => vsl.VesselName === vessel)?.VesselMasterSid);
    if (!POL || !POD || !vesselId) {
      return;
    }
    const payload = { VesselMasterSid: vesselId,  POL: POLSid, POD: PODSid, MovementType: MovementType }
    this.operationService.getVoyagesBasedOnVesselAndPort(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.voyageList = resp.data.map(voyage => {
            const pol = voyage.Ports.find(p => p.POLSid === payload.POL);
            const pod = voyage.Ports.find(p => p.POLSid === payload.POD || p.PODSid === payload.POD);
            const polName = this.portList.find(p => p.PortMasterSid === payload.POL)?.PortName;
            const podName = this.portList.find(p => p.PortMasterSid === payload.POD)?.PortName;
            const polWithName = pol ? { ...pol, PortName: polName } : null;
            const podWithName = pod ? { ...pod, PortName: podName } : null;

            return {
              ...voyage,
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

  handleProductChange(product: any) {
    if (!product) {
      this.productForm.get('IsHaz')?.setValue(false);
      this.productForm.get('ImcoClass')?.setValue('');
      this.productForm.get('UnNo')?.setValue('');
      this.productForm.get('PkgGroup')?.setValue('');
      return;
    }
    this.productForm.get('IsHaz')?.setValue(product.ProductType === "2");
    this.productForm.get('ImcoClass')?.setValue(product.IMOClass);
    this.productForm.get('UnNo')?.setValue(product.UNNo);
    this.productForm.get('PkgGroup')?.setValue(product.PackingGroup);
  }

  deleteBookingProduct(productIndex: number, BookingProductSid?: number) {
    const productToDelete = this.slicedProductArr[productIndex];
    const realIndex = this.bookingProducts.controls.indexOf(productToDelete);

    if (BookingProductSid) {
      this.operationService.deleteBookingProduct(BookingProductSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.bookingProducts.removeAt(realIndex);
            this.productDataLength = this.bookingProducts.length;
            this.appSettingService.showSuccess('Product Deleted Successfully');
            this.adjustPageAfterDelete();
            this.updateProductPagination();
            this.handleProductRelatedCalculation();
          } else {
            this.appSettingService.showError("Error deleting product.");
          }
        })
    } else {
      this.bookingProducts.removeAt(realIndex);
      this.productDataLength = this.bookingProducts.length;
      this.adjustPageAfterDelete();
      this.handleProductRelatedCalculation();
    }
    this.bookingProducts.updateValueAndValidity();
    this.updateProductPagination();
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

    let totalNoOfPkg = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalVolume = 0;

    let productValue = this.bookingProducts.getRawValue() || [];
    productValue.forEach(product => {
      totalNoOfPkg += Number(product.ExternlQty) || 0;
      totalGrossWeight += Number(product.GrossWeight) || 0;
      totalNetWeight += Number(product.NetWeight) || 0;
      totalVolume += Number(product.Volume) || 0;
    });

    this.c['NoOfPackage']?.setValue(totalNoOfPkg);
    this.c['NoOfPackage']?.disable();
    this.c['GrossWeight']?.setValue(totalGrossWeight);
    this.c['GrossWeight']?.disable();
    this.c['NetWeight']?.setValue(totalNetWeight);
    this.c['NetWeight']?.disable();
    this.c['Volume']?.setValue(totalVolume);
    this.c['Volume']?.disable();
  }

  // ************ END OF PRODUCT RELATED FUNCTIONS *************

  //  Other Form Related Functions

  setAddressOthers(controlName: string, item: any) {
    this.o[controlName]?.setValue(item ? item.CustomerAddress1 : '')
  }

  handleCFSOrYard() {
    const stuffingAt = this.cargoForm.get('StuffingAt')?.value;
    if (!this.selectedDepartment && !stuffingAt && this.selectedDepartmentType !== "SEA") {
      this.YardCFSLabel = "Yard/CFS";
      return;
    }

    if (this.selectedFCLLCL === "FCL" && this.selectedDepartment?.ExportImport === "Export") {
      const map: Record<string, string> = {
        "Dock": "CFS Name",
        "Factory": "Container Yard"
      };
      this.YardCFSLabel = map[stuffingAt] || "Yard/CFS";
      return;
    }
    this.YardCFSLabel = "Yard/CFS";
  }

  // ************ END OF CONNECTION RELATED FUNCTIONS *************

  syncFormValueWithRateComponent(){
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.b['DepartmentMasterSid']?.value;
    const BookingNumber = this.b['BookingNo']?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const selectedPOO = this.b['POO']?.value;
    const selectedPOL = this.b['POL']?.value;
    const selectedPOD = this.b['POD']?.value;
    const selectedFPD = this.b['FPD']?.value;
    const EffectiveDate = this.b['ETA']?.value;
    const ExpiredDate = this.b['ETD']?.value;
    const PORSid = (this.portList.find(p => p.PortCode === selectedPOO)?.PortMasterSid)
    const POLSid = (this.portList.find(p => p.PortCode === selectedPOL)?.PortMasterSid)
    const PODSid = (this.portList.find(p => p.PortCode === selectedPOD)?.PortMasterSid)
    const FPODSid = (this.portList.find(p => p.PortCode === selectedFPD)?.PortMasterSid)
    const CargoType = this.c['CargoType']?.value;
    const NoofContainers = this.c['NoofContainers']?.value;
    const Volume = this.c['Volume']?.value;
    const ChargeableWeight = this.c['ChargeableWeight']?.value;

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      BookingNumber,
      departmentName,
      Segment : this.selectedFCLLCL,
      PORSid,
      POLSid,
      PODSid,
      FPODSid,
      EffectiveDate,
      ExpiredDate,
      CargoType,
      NoofContainers,
      Volume,
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
      if(!this.bookingData) return;
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
    modalRef.componentInstance.parentSubject = `Booking No.${this.bookingHeader.BookingNo} Date:${this.datePipe.transform(this.bookingHeader?.BookingDateTime)} ${ formattedPOL } - ${ formattedPOD }${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`;
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

  this.operationService.getAuditLogsBooking(
    'BookingHeader',
    this.BookingHeaderSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['updatedOn','updatedBy']; // ✅ add more if needed later

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

      this.auditLogModalRef = this.modalService.open(modal, {
        centered: true,
        scrollable: true,
        windowClass: 'audit-log-modal'
      });
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

  toggleMinimizeMaximize(){
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


  getFormattedPort(code:string){
    console.log(code);
    if(!code) return '';
    const ourPort = (this.portList.find(p => p.PortCode === code))?.PortName;
    console.log(ourPort);
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

      const opt = {
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

    const opt = {
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

  ngOnDestroy(){
  this.dataFromQuotation = null;
  }

}

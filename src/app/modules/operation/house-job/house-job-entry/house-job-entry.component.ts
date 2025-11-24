import { Component, ViewChild, TemplateRef, OnInit, Input } from '@angular/core';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, firstValueFrom, forkJoin, of, tap } from 'rxjs';
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
    NgbDropdownModule,
    BoeEntryComponent,
    VehicleComponent,
    CustomsComponent
  ],
  templateUrl: './house-job-entry.component.html',
  styleUrls: ['./house-job-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class HouseJobEntryComponent  implements OnInit {



  /**
    |--------------------------------------------------
    |   Section-1 Variable Declaration
    |--------------------------------------------------
  */


  @ViewChild('uploadModal') uploadModal!: BookingUploadComponent;
  parsedBookings: BookingData[] = [];
  showParsedData = false;
  uploadResult: any = null;
  decimalAfterPrecision = 3;
  digitsAfterDecimal = 3;
boeDataArray: any[] = [];        // for BOE data
resetTriggerBOE: boolean = false; // trigger flag for reset
vehicleDataArray: any[] = [];        // for BOE data
resetTriggerVehicle: boolean = false; // trigger flag for reset
customsDataArray: any[] = [];        // for BOE data
resetTriggerCustoms: boolean = false; // trigger flag for reset

  //Variable Declaration - Common 
  detailForm !: FormGroup;
  userData : any;
  isPrintLoading : boolean;
  currentCompany : any;
  currentBranch : any;
  filterOption : any;
    public rateComponent = CostEntryComponent;
    public ArApcomponent = ArApComponent;
  masterJobData: any;
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
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  incoList: any[] = [];
  TandCList: any[]=[];
  bookingHeader: any;
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

  // Variable Declaration - Other Part
  YardCFSLabel: string = "Yard/CFS"
  forwarderList: any[] = [];
  currencyList: any[] = [];
  imcoList: any[] = [];
  uomList: any[] = [];
    measurementUnitList =[
    { id: 1, name: 'M' },
    { id: 2, name: 'CM' },
    { id: 3, name: 'Inch'}
  ]
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
  housejobData:any;
  departments: any[] = [];
  DepartmentMasterSid: number;
  amountInWords: string = '';
  customerWiseSummary : any;
    profitSummary : any;
      chargeList:any[]=[];
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

  tabs = [
    { name: 'Shipment', icon: 'fas fa-ship' },
    // { name: 'BOE', icon: 'fas fa-box' },
    { name: 'Cargo', icon: 'fas fa-boxes' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
{ name: 'BOE', icon: 'fas fa-file-invoice' },
{ name: 'Vehicle', icon: 'fas fa-truck' },
{ name: 'Customs', icon: 'fas fa-passport' },
    { name: 'AR/AP', icon: 'fas fa-file-alt' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    // { name: 'Mail', icon: 'fas fa-envelope' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
  ];

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
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
     console.log('📋 localStorage currentCompany:', this.currentCompany);  
    this.countryOfCompany = this.currentCompany?.CountryName;
    console.log('📋 countryOfCompany:', this.countryOfCompany);
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentCompany?.BranchMasterSid,
    }
    
    this.initBookingForm();
    this.initCargoForm();
    this.initOtherForm();
    this.initDetailsForm();
    this.spinner.show();
    this.loadHeaderMandatoryParts().subscribe(() => {
    this.loadHeaderLookups().subscribe(() => {
      this.currentRoute.paramMap.subscribe((param) => {
        this.HouseJobSid = +param.get('id');
        if (this.HouseJobSid) {
          this.isEditMode = true;
          this.loadHouseById(this.HouseJobSid);
        } else {
          this.minDate = this.today;
        }
      });
      this.loadCargoLookups();
      if (!this.productLookupsLoaded) {
      this.loadProductLookups();
      }
      this.loadOtherLookups();
    });
    this.spinner.hide();
  });
}
  /**
  |--------------------------------------------------
  |   Section-4 : Main Functions
  |--------------------------------------------------
  */

  // Header Form Initialization
  initBookingForm() {
    this.houseJobForm = this.fb.group({
      MasterJobSid : [null],
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
      AgentName : [''],
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
      JobType: [{value:null, disabled:true}],
      Coload: [false],
      ShipmentType: [false],
      IncoTerms: [null, [Validators.required]],
      InternalNote: [''],
      GeneralNote: [''],
      NominatedBy: ['Self'],
      ShipmentNo: [{value : '',disabled : true}]
    })
    this.houseJobForm.valueChanges.subscribe(()=>{
      this.syncFormValueWithRateComponent();
    })
  }

  // Cargo Form Initiation
  initCargoForm() {
    this.cargoForm = this.fb.group({
      HouseJobCargoSid: [null],
      CargoType: [null],
      ContainerType: [null],
      NoofContainers: [''],
      GrossWeight: [''],
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
      ModeOfTransport : [null],
      StuffingAt: ['Dock']
    })
    this.cargoForm.get('Volume')?.valueChanges.subscribe(() => {
    this.calculateChargeableWeight();
  });
    this.cargoForm.get('Volumetric')?.valueChanges.subscribe(() => {
    this.calculateChargeableWeight(); // Add this
  });
    this.cargoForm.valueChanges.subscribe(() => {
      this.syncFormValueWithRateComponent();
    })
  }

  private calculateChargeableWeight(): void {
  const volumetric = Number(this.c['Volumetric']?.value) || 0;
  const volume  = Number(this.c['Volume']?.value) || 0;
  
  let chargeableWeight = 0;
  
  // Chargeable Weight is the greater of Volumetric or Gross Weight
  if (volumetric > volume ) {
    chargeableWeight = volumetric;
  } else {
    chargeableWeight = volume;
  }
  
  // Update the chargeable weight field
  if (chargeableWeight > 0) {
    this.c['ChargeableWeight']?.setValue(
      Number(chargeableWeight.toFixed(this.decimalAfterPrecision)), 
      { emitEvent: false }
    );
  } else {
    this.c['ChargeableWeight']?.setValue('', { emitEvent: false });
  }
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
      console.log(`IncoTerm "${selectedIncoTerm.IncoName}" selected, FreightTerms remains as: ${this.b['FreightTerms']?.value}`);
    }
  } else {
    // For non-AIR departments, use the original logic
    if (selectedIncoTerm && selectedIncoTerm.OceanFreight) {
      const freightValue = selectedIncoTerm.OceanFreight;
      this.houseJobForm.patchValue({
        FreightTerms: freightValue
      }, { emitEvent: false });
      console.log(`IncoTerm "${selectedIncoTerm.IncoName}" selected, FreightTerms set to: ${freightValue}`);
    }
  }
}

  // Product Form Initialization
  initProductForm() {
    const isIndianCompany = this.countryOfCompany === 'india';
    this.productForm = this.fb.group({
      HouseJobProductSid: [null],
      ProductName: [null],
      ShippingBillNo: ['',isIndianCompany ? [Validators.required] : []],
      ShippingBillDate: [null,isIndianCompany ? [Validators.required] : []],
      ExternaPkg: [null, [Validators.required]],
      ExternlQty: ['', [Validators.required]],
      GrossWeight: ['', [Validators.required]],
      NetWeight: ['', [Validators.required]],
      Volume: [''],
      Volumetric: [''],
      IsHaz: [false],
      ImcoClass: [null],
      UnNo: [''],
      PkgGroup: [''],
      Length: [''],
      Width: [''],
      Height: [''],
      UomMasterSid: [null],
      CargoRecDate : [null],
      ContainerNo : [''],
      MarksAndNumbers : [''],
      DeliveredQty: [null],
      DeliveryDate: ['']
    });
    this.setupImmediateCBMCalculation();
    this.setupImmediateVolumetricCalculation(this.productForm)
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
      CarrierBookingDate : [''],
      DONo : [''],
      DODate : [''],
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

  createBookingProductGroup(data?: any): FormGroup {
    const productForm = this.fb.group({
      HouseJobProductSid: [data?.HouseJobProductSid || null],
      ProductName: [data?.ProductName || ''],
      ShippingBillNo: [data?.ShippingBillNo || ''],
      ShippingBillDate: [data?.ShippingBillDate ? new Date(data?.ShippingBillDate) : null],
      ExternaPkg: [data?.ExternaPkg || null, [Validators.required]],
      ExternlQty: [data?.ExternlQty || '', [Validators.required]],
      GrossWeight: [data?.GrossWeight || '', [Validators.required]],
      NetWeight: [data?.NetWeight || '', [Validators.required]],
      Volume: [data?.Volume || '', [Validators.required]],
      Volumetric: [data?.Volumetric|| ''],
      IsHaz : [data?.IsHaz ? (data.IsHaz === "Y" ? true : false) : false],
      ImcoClass : [data?.ImcoClass || null],
      UnNo : [data?.UnNo || ''],
      PkgGroup : [data?.PkgGroup || ''],
      Length : [data?.Length || ''],
      Width : [data?.Width || ''],
      Height : [data?.Height || ''],
      UomMasterSid : [data?.UomMasterSid || null],
      CargoRecDate : [data?.CargoRecDate ? new Date(data?.CargoRecDate) : null],
      ContainerNo : [data?.ContainerNo || ''],
      MarksAndNumbers : [data?.MarksAndNumbers || ''],
      DeliveryDate: [data?.DeliveryDate ? new Date(data?.DeliveryDate) : null],
      DeliveredQty: [data?.DeliveredQty || null]

    });
    this.setupProductFormImmediateCalculation(productForm);
    this.setupImmediateVolumetricCalculationForFormArray(productForm);
    return productForm;
  }

   private setupProductFormImmediateCalculation(productForm: FormGroup) {
  const dimensionFields = ['ExternlQty', 'Length', 'Width', 'Height', 'UomMasterSid'];
  
  dimensionFields.forEach(field => {
    productForm.get(field)?.valueChanges.subscribe(() => {
      this.calculateProductFormCBMAndVolumetric(productForm);
    });
  });
}

private calculateProductFormCBMAndVolumetric(productForm: FormGroup) {
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
  console.log('Current Company:', this.currentCompany);
  console.log('CountryMasterSid:', this.currentCompany?.CountryMasterSid);
  const countrySid = this.currentCompany?.CountryMasterSid;
  return forkJoin({
    departments: this.operationService.getAllDepartments(CompanyMasterSid).pipe(catchError(err => of([]))),
    customers: this.operationService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(err => of([]))),
    ports: this.operationService.getAllPorts().pipe(catchError(err => of([]))),
     userCountry: countrySid ? 
      this.operationService.getCountryById(countrySid).pipe(catchError(err => of({}))) : 
      of({}),
  }).pipe(tap(({ 
      departments, customers, ports, userCountry 
    }) => {
    if (!this.isEditMode) {
      this.spinner.hide();
    }
    this.departmentList = departments.data;
    this.customerList = customers;
    this.countryOfCompany = (userCountry?.data?.countryCode)?.trim().toLowerCase();
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
    vessels: this.operationService.getAllVessels().pipe(catchError(err => of([]))),
    incos: this.operationService.getAllINCO().pipe(catchError(err => of([]))),
    salesmans: this.operationService.getAllSalesman().pipe(catchError(err => of([]))),
    forwarder: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['forwarder'] }).pipe(catchError(err => of([]))),
  }).pipe(tap(({ shippers, consignees, notify, carriers, vessels, incos, salesmans, agents, forwarder }) => {
    this.shipperList = shippers.data;
    this.filteredShipperList = shippers.data;
    this.consigneeList = consignees.data;
    this.filteredConsigneeList = consignees.data;
    this.notifyList = notify.data;
    this.carrierList = carriers.data;
    this.vesselList = vessels.data;
    this.incoList = incos.data;
    this.salesmanList = salesmans;
    this.agentList = agents.data;
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

  loadOtherLookups() {
    forkJoin({
      currencies: this.operationService.getAllCurrencies().pipe(catchError(err => of({ data: [] }))),
    }).subscribe(({ currencies }) => {
      const rawCurrencies: any[] = Array.isArray(currencies)
        ? currencies
        : currencies?.data || [];
      this.currencyList = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
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
          this.housejobData=resp.data;
          console.log("House Job",this.housejobData)
          this.minDate = undefined;

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
        }
      }
    )
  }

  patchValues(response: any) {
    console.log(response);
    this.bookingHeader = response;
    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectedCustomer = this.customerList.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
    const delivery = this.agentList.find(agent => agent.CustomerMasterSid === response.DestinationAgent);
    const origin = this.agentList.find(agent => agent.CustomerMasterSid === response.CustomerName);
    this.onDeptChange(selectedDepartment);
    this.onCustomerChange(selectedCustomer);
    this.handleDestAgentChange(delivery);
    this.handleOriginAgentChange(origin);
    this.houseJobForm.patchValue({
      MasterJobSid : response.MasterJobSid,
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
      DestinationAgent: response.DestinationAgent || null,
      AgentName : response.AgentName || null,
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
      JobType: response.JobType,
      ShipmentNo: response.ShipmentNo
    })
    this.b['DepartmentMasterSid']?.disable();
    this.b['CustomerMasterSid']?.disable();
    this.quotationNumber = response?.quotationHeader?.QuoteNumber || '';
    this.PODandFPODsame = response.POD === response.FPD;
    this.minStartDate = response.ETA;

    const cargoData = response.Cargo[0];
    this.cargoForm.patchValue({
      HouseJobCargoSid: cargoData?.HouseJobCargoSid,
      CargoType: cargoData?.CargoType,
      ContainerType: cargoData?.ContainerType,
      NoofContainers: cargoData?.NoofContainers,
      GrossWeight: cargoData?.GrossWeight,
      NetWeight: cargoData?.NetWeight,
      Volume: cargoData?.Volume,
      Volumetric: cargoData?.Volumetric,
      ChargeableWeight: cargoData?.ChargeableWeight,
      NoOfPackage: cargoData?.NoOfPackage,
      ShipmentTerms: cargoData?.ShipmentTerms,
      CommodityDescription: cargoData?.CommodityDescription,
      MarksAndNumber: cargoData?.MarksAndNumber,
      MovementType: cargoData?.MovementType,
      FreightTerms: cargoData?.FreightTerms,
      ModeOfTransport : cargoData?.ModeOfTransport,
      StuffingAt: cargoData?.StuffingAt
    })
    this.handleCFSOrYard();
    const otherData = response.Others[0];
    this.otherForm.patchValue({
      HouseJobOthersSid: otherData?.HouseJobOthersSid,
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
      CarrierBookingDate :otherData?.CarrierBookingDate ? new Date(otherData?.CarrierBookingDate) : null,
      DONo: otherData?.DONo || '',
      DODate: otherData?.DODate || '',
      InternalNote: otherData?.InternalNote || '',
      GeneralNote: otherData?.GeneralNote || ''
    })

    this.bookingProducts.clear();
    const productsFromResponse = response.Products || [];
    this.productDataLength = productsFromResponse.length;
    for (const productData of productsFromResponse) {
      const formWithData = this.createBookingProductGroup(productData);
      this.bookingProducts.push(formWithData);
    }
    this.updateProductPagination();
    if(productsFromResponse.length>0){
      this.handleProductRelatedCalculation();
    }

    this.bookingConnectionsArr = (response.Connections || []).map(connection => {
      return {
        ...connection,
        TransactionSid : connection.HouseJobConnectionSid,
      }
    }); // for child component
    this.connectionResult = [...this.bookingConnectionsArr]

    this.bookingRateArr = (response.costRevenueCharges || []).map(br => ({
      ...br,
      RateSid : br.CostRevenueChargesSid,
      status : br.status  === "A" ? "Active" : "Suspended"
    }));
    this.rateResult = [...this.bookingRateArr];
    this.calculateChargeWiseProfit();
    this.calculateCustomerWiseAmount();
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
        ShippingBillDate: new Date(data?.ShippingBillDate),
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
        UomMasterSid: data?.UomMasterSid,
        CargoRecDate : data?.CargoRecDate,
        ContainerNo : data?.ContainerNo,
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
    if (this.houseJobForm.invalid) {
      this.houseJobForm.markAllAsTouched();
      this.houseJobForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
    const houseJobFormValue = this.houseJobForm.getRawValue();
    const cargoFormValue = this.cargoForm.getRawValue();
    const otherFormValue = this.otherForm.getRawValue();
    const detailFormValue = this.detailForm.getRawValue();
    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    console.log('=== FORM DEBUG INFO ===');
console.log('CargoCurrency from form:', otherFormValue.CargoCurrency);
console.log('DoNo from form:', otherFormValue?.DONo);
console.log('DoDate from form:', otherFormValue?.DODate);
console.log('Full otherForm value:', otherFormValue);

    const payload = {
      MasterJobSid : houseJobFormValue.MasterJobSid,
      BookingNo : houseJobFormValue.BookingNo,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid : currentMenuId,
      DepartmentMasterSid: houseJobFormValue.DepartmentMasterSid,
      CustomerMasterSid: houseJobFormValue.CustomerMasterSid,
      CustomerBranchSid: houseJobFormValue.CustomerBranchSid || null,
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
      AgentAddress: houseJobFormValue.AgentAddress || '',
      CarrierName: houseJobFormValue.CarrierName || null,
      QuotationHeaderSid: houseJobFormValue.QuotationHeaderSid || null,
      HBLNo: houseJobFormValue.HBLNo || '',
      MBLNo: houseJobFormValue.MBLNo || '',
      MBLDate: houseJobFormValue.MBLDate ? new Date(houseJobFormValue.MBLDate) : null,
      status: houseJobFormValue.status === 'Active' ? 'A' : 'S',
      VesselName: houseJobFormValue.VesselName || null,
      VoyageMasterSid: houseJobFormValue.VoyageMasterSid || null,
      VoyageNo: houseJobFormValue.VoyageNo || null,
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
      IncoTerms: houseJobFormValue.IncoTerms,
      InternalNote: houseJobFormValue.InternalNote || '',
      GeneralNote: houseJobFormValue.GeneralNote || '',
      NominatedBy: houseJobFormValue.NominatedBy || 'Self',
      FreightTerms : houseJobFormValue.FreightTerms || '',
      JobType: houseJobFormValue.JobType || '',
      ShipmentNo: houseJobFormValue.ShipmentNo || '',
      houseJobCargo: {
        HouseJobCargoSid : cargoFormValue.HouseJobCargoSid || null,
        CargoType: cargoFormValue.CargoType || null,
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
        MovementType: cargoFormValue.MovementType || null,
        FreightTerms: cargoFormValue.FreightTerms || null,
        ModeOfTransport : cargoFormValue.ModeOfTransport || null,
        StuffingAt: cargoFormValue.StuffingAt || 'Dock',
      },
      
      houseJobOthers: {
        HouseJobOthersSid : otherFormValue.HouseJobOthersSid || null,
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
        CargoCurrency: otherFormValue.CargoCurrency?.currencyCode || null,
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
        CarrierBookingDate : otherFormValue?.CarrierBookingDate ? new Date(otherFormValue?.CarrierBookingDate) : null,
        DONo: otherFormValue?.DoNo || otherFormValue?.DONo || '',
       DODate: otherFormValue?.DODate ? new Date(otherFormValue?.DODate) : null,
       InternalNote: otherFormValue?.InternalNote || '',
       GeneralNote: otherFormValue?.GeneralNote || ''
      },
      houseJobProduct: detailFormValue.bookingProducts.map((product: any) => ({
        HouseJobProductSid : product.HouseJobProductSid || null,
        ProductName: product.ProductName || '',
        ShippingBillNo: product.ShippingBillNo || '',
        ShippingBillDate: product.ShippingBillDate ? new Date(product.ShippingBillDate) : null,
        ExternaPkg: product.ExternaPkg || null,
        ExternlQty: String(product.ExternlQty),
        GrossWeight: parseFloat(product.GrossWeight) || 0,
        NetWeight: parseFloat(product.NetWeight) || 0,
        Volume: parseFloat(product.Volume) || 0,
        Volumetric: parseFloat(product.Volumetric) || 0,
        IsHaz: product.IsHaz ? 'Y' : 'N',
        ImcoClass: product.ImcoClass || '',
        UnNo: product.UnNo || '',
        PkgGroup: product.PkgGroup || '',
        Length: Number(product.Length),
        Width: Number(product.Width),
        Height: Number(product.Height),
        UomMasterSid: product.UomMasterSid,
        CargoRecDate : product.CargoRecDate,
        ContainerNo : product.ContainerNo,
        MarksAndNumbers : product.MarksAndNumbers,
        DeliveryDate: product.DeliveryDate,
        DeliveredQty: product.DeliveredQty,
      })),
      houseConnections: this.connectionResult,
      bookingRates: this.rateResult,
      milestones: this.milestoneResult ,
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };

    console.log('Submitted payload:', payload);

    if (this.isEditMode && this.HouseJobSid) {
      this.operationService.updateHouseById(this.HouseJobSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('House Job successfully updated.');
            this.loadHouseById(this.HouseJobSid);
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
    } 
    // else {
    //   this.operationService.createHouse(payload).subscribe({
    //     next: (resp: any) => {
    //       if (resp.status) {
    //         this.appSettingService.showSuccess('Booking successfully created.');
    //         const bookingId = resp.data?.newBooking?.HouseJobSid;
    //         this.router.navigate(['operation/booking/entry', bookingId]);
    //       } else {
    //         this.appSettingService.showError('Error creating booking.');
    //         console.error(resp.message);
    //       }
    //     },
    //     error: (err) => {
    //       this.appSettingService.showError('Failed to create booking.');
    //       console.error(err);
    //     }
    //   });
    // }
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
    if (this.selectedDepartmentType === "AIR") {
    // Set IncoTerms to CIF
    this.b['IncoTerms']?.setValue('CIF');
    
    // Set FreightTerms to Prepaid
    this.b['FreightTerms']?.setValue('Prepaid');
    
    // Set Mode of Transport to Flight
    this.c['ModeOfTransport']?.setValue('Flight');
  } else {
    this.selectedDepartmentType === "SEA" ? this.c['ModeOfTransport']?.setValue('Vessel') : null;
  }
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
      this.houseJobForm.get(`${fieldName}`)?.setValue(element.checked);
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

  deleteBookingProduct(productIndex: number, HouseJobProductSid?: number) {
    const productToDelete = this.slicedProductArr[productIndex];
    const realIndex = this.bookingProducts.controls.indexOf(productToDelete);

    if (HouseJobProductSid) {
      this.operationService.deleteBookingProduct(HouseJobProductSid).subscribe(
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

  syncFormValueWithRateComponent() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const DepartmentMasterSid = this.houseJobForm.get('DepartmentMasterSid')?.value;
    const departmentName = this.selectedDepartment?.departmentName;
    const MasterJobNumber = this.houseJobForm.get('HouseNo')?.value;
    const MBLNo = this.houseJobForm.get('MBLNo')?.value;
    const HBLNo = this.b['HBLNo']?.value;
    const selectedPOO = this.houseJobForm.get('POO')?.value; // PortMasterSid
    const selectedPOL = this.houseJobForm.get('POL')?.value; // PortMasterSid
    const selectedPOD = this.houseJobForm.get('POD')?.value; // PortMasterSid
    const selectedFPD = this.houseJobForm.get('FPD')?.value; // PortMasterSid
    const EffectiveDate = this.houseJobForm.get('MasterJobDate')?.value;
    const ExpiredDate = this.houseJobForm.get('MasterJobDate')?.value;
    const PORSid = (this.portList.find(p => p.PortCode === selectedPOO)?.PortMasterSid)
    const POLSid = (this.portList.find(p => p.PortCode === selectedPOL)?.PortMasterSid)
    const PODSid = (this.portList.find(p => p.PortCode === selectedPOD)?.PortMasterSid)
    const FPODSid = (this.portList.find(p => p.PortCode === selectedFPD)?.PortMasterSid)
    const CargoType = this.cargoForm.get('CargoType')?.value;
    const NetWeight = this.cargoForm.get('NetWeight')?.value;
    const GrossWeight =this.cargoForm.get('GrossWeight')?.value;
    const NoofContainers = this.cargoForm.get('NoofContainers')?.value;
    const Volume = this.cargoForm.get('Volume')?.value;
    const ChargeableWeight = this.cargoForm.get('ChargeableWeight')?.value

    this.currentFormValue = {
      CompanyMasterSid,
      DepartmentMasterSid,
      MasterJobNumber,
      ParentSid: this.HouseJobSid,
      MBLNo,
      HBLNo,
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



  navigateBack() {
    history.back();
  }

  selectedTab = 'Shipment';
  isQuickFormExpanded = false;

resetForm() {
  this.houseJobForm.reset({
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
      modalRef.componentInstance.idValue = this.bookingData?.HouseJobSid;
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
              modalRef.componentInstance.DocumentSid = this.HouseJobSid;
    
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
    modalRef.componentInstance.documentSid = this.bookingHeader?.HouseJobSid;
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

  openAuditLogs(modal: TemplateRef<any>) {
  if (!this.HouseJobSid) return;

  this.operationService.getAuditLogsBooking('BookingHeader', this.HouseJobSid.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
        if (Object.keys(obj).length === 0) return ['NA'];
        return Object.entries(obj).map(
          ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
        );
      };

      this.auditLogs = logs.map(log => ({
        ...log,
        oldValDisplay: formatFields(log.oldVal),
        newValDisplay: formatFields(log.newVal)
      }));

      this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
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
      CargoRecDate: this.datePipe.transform(product.value.CargoRecDate) || '',
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

  // Add handler for Edoc data changes
  handleEdocChange(event: any) {
    this.edocData = event.dataItems || [];   
    this.currentEdocFormValue = event.formData; 
    console.log("Edoc updated:", this.edocData);
  }

   // Add handler for Email data changes
  handleEmailChange(event: any) {
    this.emailData = event.dataItems || [];
    this.currentEmailFormValue = event.formData || null;
    console.log("Email data updated:", this.emailData);
  }

   handleFollowUpChange(event: any) {
    console.log('Follow Up Changed:', event);
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
  }


  reportCargoArrival(withOrWithoutCharge : boolean) {
    
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
  }

       reportBill() {
        const modalRef = this.modalService.open(HblComponent,{
          size: 'xl',
          scrollable: true,
        })
          modalRef.componentInstance.housejobData = this.housejobData || [];
          modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
          modalRef.componentInstance.agentList = this.agentList || [];
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
        modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    }

  reportIndeminty() {
    const modalRef = this.modalService.open(ImdemintyComponent,{
      size: 'xl',
      scrollable: true,
    })
    modalRef.componentInstance.housejobData = this.housejobData || [];
  }
     reportCommericalInvoice() {
      const modalRef=this.modalService.open(CommericalInvoiceComponent,{
         size: 'xl',
        scrollable: true,
      })
       modalRef.componentInstance.housejobData = this.housejobData || [];
        modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    }
       reportCertificateofOrgin() {
        const modalRef=this.modalService.open(CertificateOfOriginComponent,{
          size: 'xl',
      scrollable: true,
        })
        modalRef.componentInstance.housejobData = this.housejobData || [];
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


      reportMilestoneSummary() {
        const modalRef = this.modalService.open(MilestoneComponent,{
          size: 'xl',
          scrollable: true,
        })
        modalRef.componentInstance.housejobData = this.housejobData || [];
        modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
        modalRef.componentInstance.agentList = this.agentList || [];
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

      reportHAWB() {
        const modalRef =this.modalService.open(HAWBComponent,{
          size: 'xl',
          scrollable: true,
        })
    modalRef.componentInstance.masterJobData=this.masterJobData; 
    modalRef.componentInstance.housejobData = this.housejobData || [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.uomList = this.uomList || [];
    modalRef.componentInstance.packageTypeList = this.packageTypeList || [];
    modalRef.componentInstance.containerTypeList = this.containerTypeList || [];
    modalRef.componentInstance.selectedFCLLCL = this.selectedFCLLCL || [];
    modalRef.componentInstance.masterJobContainers = this.masterJobContainers || [];
      }

// Helper Funstion 

 getDepartmentName(DepartmentMasterSid: number) {
  if (!DepartmentMasterSid || !this.departmentList || this.departmentList.length === 0) return '';
  const department = this.departmentList.find(dep => dep.DepartmentMasterSid === DepartmentMasterSid);
  return department ? department.departmentName : '';
}
  
  getUnitCode(ChargeUomSid: number) {
    console.log("GETUNITCODE",{
      currentUOMId : ChargeUomSid,
      uomList : this.uomList
    })
    if (!ChargeUomSid || !this.uomList || this.uomList.length === 0) {
      return '';
    }
    const uom = this.uomList.find(item => item.UOMMasterSid === ChargeUomSid);
    console.log(uom);
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

getChargeName(ChargeMasterSid: number): string {
  if (!ChargeMasterSid) return 'N/A';
  if (!this.chargeList?.length) return 'N/A';

  const charge = this.chargeList.find(c =>
    c.ChargeMasterSid === ChargeMasterSid || c.ChargeMasterSID === ChargeMasterSid
  );

  console.log(charge,"Charge Name")
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
  console.log('BOE Data from child:', event);
  // You can process and save event data here
}

handleVehicleChange(event: any) {
  console.log('BOE Data from child:', event);
  // You can process and save event data here
}
handleCustomsChange(event: any) {
  console.log('BOE Data from child:', event);
  // You can process and save event data here
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
    console.log(ContainerTypeMasterSid);
    if(!ContainerTypeMasterSid || this.containerTypeList.length === 0){
      return "";
    }
    console.log("HERE",this.containerTypeList)
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
    console.log("getPkgMame",{
      PackageTypeMasterSid,
      pkgList:this.packageTypeList
    })
    if(!PackageTypeMasterSid||this.packageTypeList.length===0){
      return "";
    }
    return this.packageTypeList.find(pkg=>pkg.UOMMasterSid===PackageTypeMasterSid)?.UOMName|| "";
  }
 
  
}


interface CustomerProfit {
  CustomerName : string,
  Amount : number
}
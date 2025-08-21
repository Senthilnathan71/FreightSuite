import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { NgbDateAdapter, NgbDateParserFormatter, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { OperationService } from '../../operation.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

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
    NgbPaginationModule
  ],
  templateUrl: './booking-entry.component.html',
  styleUrls: ['./booking-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class BookingEntryComponent implements OnInit {


  /**
    |--------------------------------------------------
    |   Section-1 Variable Declaration
    |--------------------------------------------------
  */

  //Variable Declaration - Common 
  selectedTab = 'Cargo';
  detailForm !: FormGroup;
  currentCompany : any;
  currentBranch : any;
  filterOption : any;
  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  // Variable Declaration - Header Part
  BookingHeaderSid: number;
  selectedDepartment: any;
  selectedDepartmentType: string;
  selectedFCLLCL: string;
  isEditMode: boolean;
  bookingData: any;
  departmentList: any[] = [];
  customerList: any[] = [];
  customerBranchList: any[] = [];
  salesmanList: any[] = [];
  shipperList: any[] = [];
  consigneeList: any[] = [];
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

  // Variable Declaration - Other Part
  YardCFSLabel: string = "Yard/CFS"
  forwarderList: any[] = [];
  currencyList: any[] = [];
  imcoList: any[] = [];
  uomList: any[] = [];
  otherForm !: FormGroup;

  // Variable Declaration - Connection Part
  page1 = 1;
  pageSize1 = 5;
  connectionDataLength: number;
  currentConnectionIndex: number;
  connectionLookupLoaded : boolean;
  connectionForm !: FormGroup;
  slicedConnectionArr: any[];
  filteredPortConnection : any[] = [];
  filteredPOLConnection : any[] = [];
  filteredPODConnection : any[] = [];
  vesselListConnection : any[] = [];
  voyageListConnection : any[] = [];

  typeofmodes = [
    { id: 1, name: "Sea" },
    { id: 2, name: "Air" },
    { id: 3, name: "Road" },
  ]

  // Variable Declaration - Rate Part
  rateForm !: FormGroup;

  // Variable Declaration - Milestone Part
  milestoneForm !: FormGroup;

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
    { name: 'Cargo', icon: 'fas fa-boxes' },
    { name: 'Product', icon: 'fas fa-tags' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-dollar-sign' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'AR/AP', icon: 'fas fa-file-alt' },
  ];

  @ViewChild('connectionModal') connectionModal!: TemplateRef<any>;
  @ViewChild('rateModal') rateModal!: TemplateRef<any>;

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
    private appSettingService: AppSettingsService
  ) { }

  /**
    |--------------------------------------------------
    |   Section-3 : NgOnInit Part
    |--------------------------------------------------
    */
  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentCompany?.BranchMasterSid,
    }

    this.initBookingForm();
    this.initCargoForm();
    this.initOtherForm();
    this.initDetailsForm();
    this.loadHeaderLookups().subscribe(() => {
      this.currentRoute.paramMap.subscribe((param) => {
        this.BookingHeaderSid = +param.get('id');
        if (this.BookingHeaderSid) {
          this.isEditMode = true;
          this.loadBookingById(this.BookingHeaderSid);
        }
        this.loadCargoLookups();
        this.loadOtherLookups();
      })
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
      AgentName: [null, [Validators.required]],
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
      Coload: [false],
      Nominated: [false],
      IncoTerms: [null, [Validators.required]],
      InternalNote: [''],
      GeneralNote: [''],
      NominatedBy: ['Self'],

      ShipmentNo: ['']
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
      StuffingAt: ['Dock']
    })
  }

  // Product Form Initialization
  initProductForm() {
    this.productForm = this.fb.group({
      BookingProductSid: [null],
      ProductName: [null],
      ShippingBillNo: [''],
      ShippingBillDate: [''],
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
      CargoRecDate : ['']
    })
  }

  initOtherForm() {
    this.otherForm = this.fb.group({
      BookingOthersSid: [null],
      CustomerRefNo: [''],
      YardCFS: [''],
      ReleaseType: [null],
      HBLNo: [''],
      Forwarder: [null],
      ForwarderAddress: [''],
      NotifyParty: [null],
      NotifyPartyAddress: [''],
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
      ROValidity: ['']
    })
  }

  initConnectionForm() {
    this.connectionForm = this.fb.group({
      BookingConnectionSid: [null],
      VesselName: [null],
      VoyageNo: [null],
      POL: [null],
      POD: [null],
      ETD: [''],
      ETA: [''],
      status: ['Active']
    })
  }

  initRateForm() {
    this.rateForm = this.fb.group({
      BookingRatesSid: [null],
      SerialNumber: [''],
      ChargeMasterSid: [null],
      ChargeDescription: [''],
      PrepaidCollect: [null],
      ChargeUomSid: [null],
      NumberOfUnit: [''],
      DrCr: [null],
      CurrencyMasterSid: [null],
      ExchangeRate: [''],
      Rate: [''],
      Amount: [''],
      LocalAmount: [''],
      CustomerMasterSid: [''],
      CustomerBranchSid: [null],
      VoucherHeaderSid: [null],
      VoucherTypeSid: [null],
    })
  }

  initMilestoneForm() {
    this.milestoneForm = this.fb.group({
      ShipmentMilestoneSid: [null],
      ShipmentNo: [''],
      MilestoneMasterSid: [null],
      MilestoneName: [''],
      MilestoneDate: [''],
      AutoCaptured: [false]
    })
  }

  initDetailsForm() {
    this.detailForm = this.fb.group({
      bookingProducts: this.fb.array([]),
      bookingConnections: this.fb.array([]),
      bookingRates: this.fb.array([]),
      milestones: this.fb.array([])
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
  get connection(): { [key: string]: AbstractControl<any, any> } {
    return this.connectionForm.controls || {}
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
      ShippingBillDate: [(data?.ShippingBillDate ? new Date(data?.ShippingBillDate) : null) || ''],
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
      CargoRecDate : [(data?.CargoRecDate ? new Date(data?.CargoRecDate) : null) ||  '']
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
      allMasters: this.operationService.getBookingHeaderLookups(this.filterOption).pipe(catchError(err => of( {departments: [],vessels: [], ports: [], incos: [] }))),
      customerMaster: this.operationService.getAllCustomerRelatedLookups(this.filterOption).pipe(catchError(err => of({ customers: [], salesmans: [], shippers: [], consignees: [], agents: [], carriers: [], forwarder: [], notify: [] }))),
    }).pipe(tap(({ allMasters, customerMaster}) => {
      this.departmentList = allMasters.departments;
      this.customerList = customerMaster.customers;
      this.salesmanList = customerMaster.salesmans;
      this.shipperList = customerMaster.shippers;
      this.consigneeList = customerMaster.consignees;
      this.agentList = customerMaster.agents;
      this.carrierList = customerMaster.carriers;
      this.forwarderList = customerMaster.forwarder;
      this.notifyList = customerMaster.notify;
      this.vesselList = allMasters.vessels;
      this.portList = allMasters.ports;
      this.incoList = allMasters.incos;
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
          this.patchValues(resp.data);
          this.bookingData = resp.data;
        }
      }
    )
  }

  patchValues(response: any) {
    console.log(response);
    const selectedDepartment = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectedCustomer = this.customerList.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
    this.onDeptChange(selectedDepartment);
    this.onCustomerChange(selectedCustomer);
    this.bookingForm.patchValue({
      BookingNo: response.BookingNo,
      BookingDateTime: new Date(response.BookingDateTime),
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
      AgentName: response.AgentName,
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
      ETA: new Date(response.ETA),
      ETD: new Date(response.ETD),
      POO: response.POO,
      POL: response.POL,
      POD: response.POD,
      POLTerminal: response.POLTerminal,
      PODTerminal: response.PODTerminal,
      FPD: response.FPD,
      MovementType: response.MovementType,
      DoValid: response.DoValid ? new Date(response.DoValid) : '',
      Coload: response.Coload === "Y" ? true : false,
      Nominated: response.Nominated === "Y" ? true : false,
      IncoTerms: response.IncoTerms,
      InternalNote: response.InternalNote,
      GeneralNote: response.GeneralNote,
      NominatedBy: response.NominatedBy,

      ShipmentNo: response.ShipmentNo
    })
    this.b['DepartmentMasterSid']?.disable();
    this.b['CustomerMasterSid']?.disable();

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
      StuffingAt: cargoData?.StuffingAt
    })
    this.handleCFSOrYard();
    const otherData = response.bookingOthers[0];
    this.otherForm.patchValue({
      BookingOthersSid: otherData?.BookingOthersSid,
      CustomerRefNo: otherData?.CustomerRefNo,
      YardCFS: otherData?.YardCFS,
      ReleaseType : otherData?.ReleaseType,
      HBLNo: otherData?.HBLNo,
      Forwarder: otherData?.Forwarder,
      ForwarderAddress: otherData?.ForwarderAddress,
      NotifyParty: otherData?.NotifyParty,
      NotifyPartyAddress: otherData?.NotifyPartyAddress,
      PickupPlace: otherData?.PickupPlace,
      DeliveryPlace: otherData?.DeliveryPlace,
      DeliveryDate: new Date(otherData?.DeliveryDate),
      CHAName: otherData?.CHAName,
      PickupAddress: otherData?.PickupAddress,
      DeliveryAddress: otherData?.DeliveryAddress,
      CargoCurrency: otherData?.CargoCurrency,
      CargoValue: otherData?.CargoValue,
      SwitchBL: otherData?.SwitchBL === "Y" ? true : false,
      BacktoBack: otherData?.BacktoBack === "Y" ? true : false,
      Depo: otherData?.Depo,
      ROValidity: new Date(otherData?.ROValidity)
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

    this.bookingConnections.clear();
    const connectionFromResponse = response.bookingConnection || [];
    this.connectionDataLength = connectionFromResponse.length;
    for (const connectionData of connectionFromResponse) {
      const formWithData = this.createBookingConnectionGroup(connectionData);
      this.bookingConnections.push(formWithData);
    }
    this.updateConnectionPagination();
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


  openConnectionModal(content: TemplateRef<any>, connectIndex?: number, data?: any) {
    this.initConnectionForm();
    if(data){
      this.connectionForm.patchValue({
        BookingConnectionSid: data?.BookingConnectionSid,
        POL: data?.POL,
        POD: data?.POD ,
        VesselName: data?.VesselName,
        VoyageNo:data?.VoyageNo,
        ETD: new Date(data?.ETD),
        ETA: new Date(data?.ETA),
        status: data.status ? (data.status === "A" ? "Active" : "Suspended") : "Active"
      })
      this.getVesselBasedOnPorts()
    }
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  onConnectionSubmit() {

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

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
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
      AgentName: bookingFormValue.AgentName,
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
      Nominated: bookingFormValue.Nominated ? 'Y' : 'N',
      IncoTerms: bookingFormValue.IncoTerms,
      InternalNote: bookingFormValue.InternalNote || '',
      GeneralNote: bookingFormValue.GeneralNote || '',
      NominatedBy: bookingFormValue.NominatedBy || 'Self',
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
        ROValidity: otherFormValue.ROValidity ? new Date(otherFormValue.ROValidity) : null
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
      bookingConnections: detailFormValue.bookingConnections.map((connection: any) => ({
        BookingConnectionSid : connection.BookingConnectionSid || null,
        VesselName: connection.VesselName || null,
        VoyageNo: connection.VoyageNo || null,
        POL: connection.POL || null,
        POD: connection.POD || null,
        ETD: connection.ETD ? new Date(connection.ETD).toISOString() : null,
        ETA: connection.ETA ? new Date(connection.ETA).toISOString() : null,
        status: connection.status === 'Active' ? 'A' : 'S'
      })),
      bookingRates: detailFormValue.bookingRates.map((rate: any) => ({
        BookingRatesSid : rate.BookingRatesSid || null,
        SerialNumber: parseFloat(rate.SerialNumber) || 0,
        ChargeMasterSid: rate.ChargeMasterSid || null,
        ChargeDescription: rate.ChargeDescription || '',
        PrepaidCollect: rate.PrepaidCollect || null,
        ChargeUomSid: rate.ChargeUomSid || null,
        NumberOfUnit: parseFloat(rate.NumberOfUnit) || 0,
        DrCr: rate.DrCr || null,
        CurrencyMasterSid: rate.CurrencyMasterSid || null,
        ExchangeRate: parseFloat(rate.ExchangeRate) || 0,
        Rate: parseFloat(rate.Rate) || 0,
        Amount: parseFloat(rate.Amount) || 0,
        LocalAmount: parseFloat(rate.LocalAmount) || 0,
        CustomerMasterSid: rate.CustomerMasterSid || '',
        CustomerBranchSid: rate.CustomerBranchSid || null,
        VoucherHeaderSid: rate.VoucherHeaderSid || null,
        VoucherTypeSid: rate.VoucherTypeSid || null
      })),
      milestones: detailFormValue.milestones.map((milestone: any) => ({
        ShipmentMilestoneSid : milestone.ShipmentMilestoneSid || null,
        MilestoneMasterSid: milestone.MilestoneMasterSid || null,
        MilestoneName: milestone.MilestoneName || '',
        MilestoneDate: milestone.MilestoneDate ? new Date(milestone.MilestoneDate).toISOString() : null,
        AutoCaptured: milestone.AutoCaptured || false
      })),
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };

    console.log('Submitted payload:', payload);

    if (this.isEditMode && this.BookingHeaderSid) {
      this.operationService.updateBookingById(this.BookingHeaderSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Booking successfully updated.');
            this.router.navigate(['operation/booking/list']);
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
            this.router.navigate(['operation/booking/list']);
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
      this.b['POO'].setValue(null);
      this.b['POL'].setValue(null);
      this.b['POD'].setValue(null);
      this.b['FPD'].setValue(null);
      this.b['ETA'].setValue('');
      this.b['ETD'].setValue('');
      this.b['MovementType'].setValue(null);
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
    this.selectedDepartmentType === "SEA" ? this.b['MovementType']?.setValue('Vessel') : null;
    this.selectedDepartmentType === "AIR" ? this.b['MovementType']?.setValue('Flight') : null;
    this.handleCFSOrYard()
    this.onRouteChange()
  }

  onRouteChange(): void {
    const polSid = this.b['POL']?.value;
    const podSid = this.b['POD']?.value;
    const segment = this.selectedFCLLCL

    this.filteredPorts = this.getFilteredPortsBySegment(segment);
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== podSid);
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== polSid);
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
      return;
    }
    this.b['CustomerName']?.setValue(customer.CustomerName);
    this.b['CustomerAddress']?.setValue(null);
    this.getCustomerBranchByCustomer(customer.CustomerMasterSid);;
  }

  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe((resp: any) => {
      if (resp.status) {
        this.customerBranchList = resp.data;
      } else {
        this.appSettingService.showError("Error loading customer's branch.")
      }
    })
  }

  onCustomerBranchChange(customerBranch: any) {
    if (!customerBranch) {
      this.b['CustomerAddress']?.setValue(null);
      this.b['CustomerBranchSid']?.setValue(null);
      return;
    }
    this.b['CustomerAddress']?.setValue(customerBranch.Address);
    this.b['CustomerBranchSid']?.setValue(customerBranch.CustomerBranchSid);
  }

  setAddress(controlName: string, item: any) {
    this.b[controlName]?.setValue(item ? item.CustomerAddress1 : '')
  }

  handlePOLChange(selectedPort: any) {
    if (!selectedPort) {
      this.filteredPOD = [...this.filteredPorts];
      this.b['VesselName']?.setValue(null);
      this.b['VoyageNo']?.setValue(null);
      this.b['ETA']?.setValue('');
      this.b['ETD']?.setValue('');
      return;
    }
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.b['ETA']?.setValue(new Date(selectedPort.ETA));
    this.getVesselBasedOnPorts();
  }

  handlePODChange(selectedPort: any) {
    if (!selectedPort) {
      this.filteredPOL = [...this.filteredPorts];
      this.b['FPD']?.setValue(null);
      this.b['VesselName']?.setValue(null);
      this.b['VoyageNo']?.setValue(null);
      this.b['ETA']?.setValue('');
      this.b['ETD']?.setValue('');
      return;
    }
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPort.PortMasterSid);
    this.b['ETD']?.setValue(new Date(selectedPort.ETD));
    this.b['FPD']?.setValue(selectedPort.PortName);
    this.getVesselBasedOnPorts();
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
      return;
    }
    const POL = this.b['POL'].value;
    const POD = this.b['POD'].value;
    const POLSid = (this.portList.find(port => port.PortName === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortName === POD)?.PortMasterSid);
    const details = voyage.Ports || [];

    const polDetail = details.find(d => d.POLSid === POLSid);
    const polETD = polDetail?.ETD || null;


    const podDetail = details.find(d => d.POLSid === PODSid);
    const podETD = podDetail?.ETD || null;

    this.b['ETA'].setValue(new Date(polETD));
    this.b['ETD'].setValue(new Date(podETD));
  }

  getVesselBasedOnPorts() {
    const POO = this.b['POO']?.value;
    const POL = this.b['POL']?.value;
    const POD = this.b['POD']?.value;
    const FPOD = this.b['FPD']?.value;
    const MovementType = this.selectedDepartment?.departmentType;
    const POOSid = (this.portList.find(port => port.PortName === POO)?.PortMasterSid);
    const POLSid = (this.portList.find(port => port.PortName === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortName === POD)?.PortMasterSid);
    const FPODSid = (this.portList.find(port => port.PortName === FPOD)?.PortMasterSid);
    if (!POLSid || !PODSid) return;
    const payload = { POO: POOSid, POL: POLSid, POD: PODSid, FPOD: FPODSid, MovementType: MovementType };
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
    const POOSid = (this.portList.find(port => port.PortName === POO)?.PortMasterSid);
    const POLSid = (this.portList.find(port => port.PortName === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortName === POD)?.PortMasterSid);
    const FPODSid = (this.portList.find(port => port.PortName === FPOD)?.PortMasterSid);
    const vessel = this.b['VesselName']?.value;
    const vesselId = (this.vesselList.find(vsl => vsl.VesselName === vessel).VesselMasterSid);
    if (!POL || !POD || !vesselId) {
      return;
    }
    const payload = { VesselMasterSid: vesselId, POO: POOSid, POL: POLSid, POD: PODSid, FPOD: FPODSid, MovementType: MovementType }
    this.operationService.getVoyagesBasedOnVesselAndPort(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.voyageList = resp.data;
        } else {
          this.appSettingService.showError("Error loading sailing schedules.")
        }
      }
    )
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

  //  Connection Form Related Functions

  onModeChange(item:any){
    
  }

  getVesselBasedOnPortsConnection() {
    const POL = this.connection['POL']?.value;
    const POD = this.connection['POD']?.value;
    const MovementType = this.connection['Mode']?.value;
    const POLSid = (this.portList.find(port => port.PortName === POL)?.PortMasterSid);
    const PODSid = (this.portList.find(port => port.PortName === POD)?.PortMasterSid);
    if (!POLSid || !PODSid) return;
    const payload = { POL: POLSid, POD: PODSid, MovementType: MovementType };
    this.operationService.getVesselsBasedOnPorts(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.vesselListConnection = resp.data;
          console.log(this.vesselListConnection);
          if (this.vesselListConnection.length === 0) {
            this.appSettingService.showWarning("No Vessel/Voyage has been scheduled for the requested connection.")
          }
        } else {
          this.appSettingService.showError("Error loading Vessel")
        }
      }
    )
  }

  onConnectVesselChange(vessel: any) {
    if (!vessel) {
      this.voyageListConnection = [];
      this.connection['VoyageNo']?.setValue(null);
      this.connection['ETA']?.setValue(null);
      this.connection['ETD']?.setValue(null);
      return;
    }
  }

  deleteBookingConnection(connectionIndex: number, BookingConnectionSid?: number) {
    const connectionToDelete = this.slicedConnectionArr[connectionIndex];
    const realIndex = this.bookingConnections.controls.indexOf(connectionToDelete);

    if (BookingConnectionSid) {
      this.operationService.deleteBookingConnection(BookingConnectionSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.bookingConnections.removeAt(realIndex);
            this.connectionDataLength = this.bookingConnections.length;
            this.appSettingService.showSuccess('Connection Deleted Successfully');
            this.adjustConnectionPageAfterDelete();
            this.updateConnectionPagination();
          } else {
            this.appSettingService.showError("Error deleting Connection.");
          }
        })
    } else {
      this.bookingConnections.removeAt(realIndex);
      this.productDataLength = this.bookingConnections.length;
      this.adjustConnectionPageAfterDelete();
    }
    this.bookingConnections.updateValueAndValidity();
    this.updateConnectionPagination();
  }

  adjustConnectionPageAfterDelete() {
    const totalPages = Math.ceil(this.connectionDataLength / this.pageSize1);
    if (this.page1 > totalPages && totalPages > 0) {
      this.page1 = totalPages;
    } else if (this.connectionDataLength === 0) {
      this.page1 = 1;
    }
  }

  updateConnectionPagination() {
    const start = (this.page1 - 1) * this.pageSize1;
    const end = start + this.pageSize1;
    this.slicedConnectionArr = this.bookingConnections.controls.slice(start, end);
  }













  navigateBack() {
    this.router.navigate(['operation/booking/list']);
  }



  saveConnection(modal: any) {
    console.log('Connection saved');
    modal.close();
  }

  openRateModal() {
    this.modalService.open(this.rateModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  saveRate(modal: any) {
    console.log('Rate saved');
    modal.close();
  }
}

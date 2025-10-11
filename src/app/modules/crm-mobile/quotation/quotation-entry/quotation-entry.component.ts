import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import {
  NgbAccordionModule,
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbDropdownModule,
  NgbModal,
  NgbModalRef,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgbAccordionDirective } from '@ng-bootstrap/ng-bootstrap';
import { AbstractControl, Form, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, forkJoin, from, map, merge, Observable, of, Subject, Subscription, tap } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { de, ro } from 'date-fns/locale';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ToastrService } from 'ngx-toastr';
import * as html2pdf from 'html2pdf.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-quotation-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    NgbAccordionModule,
    FeatherModule,
    NgbDatepickerModule,
    NgbAccordionDirective,
    NgbDropdownModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DecimalPrecisionDirective,
    FavoriteStarComponent,
    SearchableDropdown,
    CustomDatePipe,
    NgxSpinnerModule,
    FormsModule,
    NgbTooltip
    // MultiColumnComboboxComponent
  ],
  templateUrl: './quotation-entry.component.html',
  styleUrl: './quotation-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class QuotationEntryComponent implements OnInit {

  private subscription = new Subscription()

  // SECTION1 - VARIABLE DECLARATION
  @ViewChildren('revenueLocalAmountInput') revenueLocalInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('customerCreatedModal') customerCreatedModal!: TemplateRef<any>
  currentDate = new Date()
  selectedCurrency : any;

  actionsDisabled = false;
  approvalDropdownValue = ""
  createdCustomerId : number;
  isLoading : boolean;
  selectedItem : any;
  quotationApproved : boolean;
  authorizerDetails = {
    isAuthorizer: false,
    isAlreadyApproved: false,
    canAuthorize: false,
    AuthorityLevel: null,
    AuthorityDetailSid: null,
    ApprovedBy : ''
  }

  

  QuoteHeaderSid: number;
  currentMenuId: number;
  currentRouteIndex : number;
  currentCarrierIndex : number;
  isEditMode: boolean;
  isAuthorizedUser: boolean;
  isAlreadyApproved: boolean;
  tariffLoading : boolean;
  quotationData: any;
  userData: any;
  currentCompany: any;
  currentBranch: any;
  minEffDate: any;
  permissions: any[] = [];
  currentMenuPermissions = {};
  packageTypes: any[] = [];
  carriers: any[] = [];
  customers: any[] = [];
  departments: any[] = [];
  ports: any[] = [];
  filteredPorts: any[] = [];
  filteredPOLPorts: any[][] = [];
  filteredPODPorts: any[][] = [];
  chargeMaster: any[] = [];
  filteredCharges : any[] = [];
  currencyMaster: any[] = [];
  chargeUnitMaster: any[] = [];
  packageUnitMaster: any[] = [];
  measurementUnitList: any[] = [];
  weightUnitList: any[] = [];
  incoList: any[] = [];
  salesmanList: any[] = [];
  cusBranchList: any[] = [];
  containerTypeList: any[] = []
  TandCList: any[] = []
  tariffDetails : any[] = [];
  filteredUnits: any[][] = [];
  costAgentList : any[] = [];
  vendorSupplierList : any[] = [];
  productList : any[] =[];
  productLookupConfig = ['ProductCode','ProductName'];

  
  quotationForm !: FormGroup;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  enquiryNumber = '';
  allowModifyButton : boolean;
  authStateCache : string = "Pending";
  disableAllModification : boolean;
  
  auditLogs: any[] = []; // Stores audit logs
  leadList : any[] = [];
  auditLogModalRef!: NgbModalRef;

   

  modeOfCargoType = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Haz' },
    { id: 3, name: 'Refer' },
    { id: 4, name: 'Tanker' },
    { id: 5, name: 'OOG' },
  ];

  serviceLevel = [
    { name: 'CFS/CFS' }, { name: 'CY/CFS' },
    { name: 'CFS/CY' }, { name: 'CFS/FO' },
    { name: 'CY/CY' }, { name: 'CY/DOOR' },
    { name: 'CY/FO' }, { name: 'DOOR/CY' },
    { name: 'DOOR/DOOR' }, { name: 'CY/HK' }
  ]

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  allApprovalStatus = [
    { value : "Pending" , name :"Waiting for Approval"},
    { value : "WaitingForFinalApproval" , name :"Waiting for Final Approval"},
    { value : "WaitingForCustomerApproval" , name :"Waiting for Customer Approval"},
    { value : "Approved" , name :"Approved"},
    { value : "Counter" , name :"Counter"},
    { value : "Rejected" , name : "Rejected"}
  ]

  approvalStatus = [
    { value : "Pending" , name :"Waiting for Approval"},
    { value : "Approved" , name :"Approved"},
    { value : "Rejected" , name : "Rejected"},
    {value : "Counter", name : "Counter"}
  ]

  
  
  tabs: string[] = ['Quotation', 'Route Details'];
  requiredFieldsToGetTariff = ['DepartmentMasterSid','POLSid','PODSid','effDate','expDate']
  selectedTab = 'Quotation';
dataFromEnqPage:any;
  imcoList: any[] = [];
  quotationDataApprovedByCustomer: any;
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

   selectedTab1= 'Quotation';
   tabs1 = [
    { name:'Quotation', icon: 'fas fa-file-signature' },
   { name: 'Route Details', icon: 'fas fa-layer-group' }
  ];
  selectTab1(tab: string) {
    this.selectedTab1 = tab;
  }

  // Lookup Configuration
  customerLookupConfig = {
    displayFields : ['CustomerName','BranchName', 'Address'],
    displayLabels : ['Customer','Branch', 'Address'],
    labelFields :['CustomerName']
  };
   portLookupConfig = {
    displayFields : ['PortCode', 'PortName','Country'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['PortCode']
  };
 
  chargeLookupConfig = {
    displayFields : ['chargeCode','chargeName'],
    displayLabels : ['Code','Name'],
    labelFields :['chargeCode']
  };
  unitLookupConfig = {
    displayFields : ['UOMCode','UOMName'],
    displayLabels : ['Code','Name'],
    labelFields :['UOMCode']
  };
  currencyLookupConfig = {
    displayFields : ['currencyCode', 'currencyName','countryName'],
    displayLabels : ['Code','Name','Country'],
    labelFields :['currencyCode']
  };
  incoLookupConfig = {
    displayFields: ['IncoCode', 'IncoName', 'OceanFreight'],
    displayLabels: ['Code', 'Name', 'P/C'],
    labelFields: ['IncoCode']
  }

  // currencyColumns : ComboBoxColumn[] = [
  //   { field: 'currencyCode', header: 'Code', width: '30%' },
  //   { field: 'currencyName', header: 'Name', width: '70%' },
  //   // { field: 'country', header: 'Role', width: '20%' },
  //   // { field: 'department', header: 'Department', width: '25%' },
  // ];


  digitsAfterDecimal = 3;
  truncationLimit = 4;

  // SECTION2 - CONSTRUCTOR
  constructor(
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private leadService: LeadService,
    private calendar: NgbCalendar,
    private modalService: ModalService,
    private ngbModal: NgbModal,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private datePipe : CustomDatePipe
  ) { }

  // SECTION3 - NGONIT
  ngOnInit(): void {
    this.initQuotationForm();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    this.loadAllLookUps().subscribe(() => {
      this.dataFromEnqPage = this.leadService.getQuotationData();
      this.leadService.clearQuotationData();
      if (this.dataFromEnqPage?.rateRequest) {
        console.log(this.dataFromEnqPage,'dataFromEnqPage171')
        this.patchEnqPageValues(this.dataFromEnqPage);
        this.minEffDate = this.todayDate;
        this.f['status']?.disable();
      } else {
        this.activatedRoute.paramMap.subscribe(params => {
          this.QuoteHeaderSid = +params.get('id');
          if (this.QuoteHeaderSid) {
            this.isEditMode = true;
            this.loadQuotation(this.QuoteHeaderSid);
            this.checkAuthorisedPerson(this.userData?.UserMasterSid, this.QuoteHeaderSid);
            this.loadTandC({MenuMasterSid : this.currentMenuId}).subscribe((res)=>{
              this.TandCList = res;
            })
          } else {
            this.minEffDate = this.todayDate;
            this.f['status']?.disable();
          }
        })
      }
    })
    
  }

patchEnqPageValues(enqData: any) { 
  console.log(enqData,'enqData')
  // --- Header form setup ---------------------------------
  this.enquiryNumber = enqData?.EnquiryNumber;
  this.quoteRoutes.clear();

  const headerFields = [
    'EnquirySid',
    'LeadOrCustomer',
    'PreCustomerMasterSid',
    'CustomerMasterSid',
    'CustomerName',
    'CustomerAddress',
    'Email',
    'FreightPPCC'
  ];

  this.quotationForm.patchValue(
    headerFields.reduce(
      (obj, field) => ({ ...obj, [field]: enqData?.[field] }),
      {}
    )
  );

  headerFields.forEach(field => this.quotationForm.get(field)?.disable());

  // --- Routes array check ---------------------------------
  const routes = Array.isArray(enqData?.quoteRoutes)
    ? enqData.quoteRoutes
    : [];

  console.log('quoteRoutes value:', enqData?.quoteRoutes);
  console.log('routes length:', routes.length);

  if (!routes.length) {
    console.warn('No routes to process');
    return;
  }

  // --- Determine segment type -----------------------------
  const segment = enqData?.ShipmentType;

  // --- Process each route ---------------------------------
  for (const [routeIndex, route] of routes.entries()) {
    console.log('Processing route', routeIndex, route);

    // Process cargo data from the route
    const cargoData = this.extractCargoData(route.enquiryCargo);
    
    const routeData = {
      QuoteRouteSid: route?.QuoteRouteSid || null,
      DepartmentMasterSid: enqData.DepartmentMasterSid,
      PORSid: route?.PORSid || null,
      POLSid: route?.POLSid || null,
      PODSid: route?.PODSid || null,
      FPODSid: route?.FPODSid || null, // Use FDPSid from the actual data
      CarrierMasterSid: route?.CarrierMasterSid || null,
      CarrierName: route?.CarrierName || '',
      CargoType: route?.CargoType || 'General',
      ContainerType: route?.ContainerType || null,
      Qty : route?.Qty || 1,
      GrossWeight : route?.GrossWeight || 0,
      NetWeight : route?.NetWeight || 0,
      Volume: route?.Volume || 1,
      ContainerQty: Number(route?.ContainerQty) || 1,
      CBM: route?.CBM || 1,
      ChargeableWeight: route?.ChargeableWeight || 0,
      effDate: new Date(),
      expDate: '', 
      TransitDays: route?.TransitDays || '',
      ServiceLevel: route?.ServiceLevel || null,
      POLFreeDays: route?.POLFreeDays || 0,
      PODFreeDays: route?.PODFreeDays || 0,
      authorizerStatus: route?.authorizerStatus || 'Pending',
      segmentType: segment
    };

    console.log('Processed route data:', routeData);

    // Add the route to the form
    this.addQuoteRoute(routeData);
    const lastAddedQuote = this.quoteRoutes.length - 1;
    this.addQuoteCarrier(lastAddedQuote);

    // Handle additional logic
    // this.addQuoteCharge(routeIndex);
    // this.handleValidationOnDept(routeIndex,segment);
    this.onRouteChange(routeIndex);

    // Disable the patched fields for this route
    const routeGroup = this.quoteRoutes.at(routeIndex);
    const fieldsToDisable = [
      'DepartmentMasterSid', 'PORSid', 'POLSid', 'PODSid', 
      'FPODSid', 'CargoType', 'ContainerType', 'CBM', 'ChargeableWeight'
    ];
    
    fieldsToDisable.forEach(field => {
      if (routeData[field] !== null && routeData[field] !== undefined) {
        routeGroup.get(field)?.disable();
      }
    });
  }
}

private getSegmentTypeFromShipmentType(shipmentType: string): string {
  if (shipmentType?.includes('Air')) {
    return 'AIR';
  } else if (shipmentType?.includes('FCL')) {
    return 'FCL';
  } else if (shipmentType?.includes('LCL')) {
    return 'LCL';
  }
  return 'LCL'; // Default
}

// Helper method to extract cargo data
private extractCargoData(enquiryCargo: any[]): any {
  if (!enquiryCargo || !Array.isArray(enquiryCargo) || enquiryCargo.length === 0) {
    return {};
  }
  
  // Return the first cargo item (you might want to handle multiple cargo items differently)
  return enquiryCargo[0];
}




  checkPermissions() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (this.currentMenuId && userRole) {
      this.leadService
        .getRoleMenuPermissions(this.currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
          },
        });
    }
  }
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
  }
  
  checkAuthorisedPerson(UserMasterSid, QuoteHeaderSid) {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    if (!UserMasterSid || !currentMenuId) {
      return;
    }
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: currentMenuId,
      UserMasterSid: UserMasterSid,
      DocumentSid: QuoteHeaderSid
    }

    

    if(this.quotationApproved){
      return;
    }


    this.leadService.isUserAuthorizer(payload).subscribe(
      (resp: any) => {
        const data = resp.data;
        this.isAuthorizedUser = data?.canAuthorize;
        const currentUserId = this.userData?.UserMasterSid || 'NA';
        this.authorizerDetails = {
          isAuthorizer : data?.canAuthorize,
          isAlreadyApproved : data?.alreadyApproved,
          canAuthorize : data?.canAuthorize && !data?.alreadyApproved,
          AuthorityLevel : data?.AuthorityLevel,
          AuthorityDetailSid : data?.AuthorityDetailSid,
          ApprovedBy : currentUserId
        }
        if(!this.isAuthorizedUser){
          this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
            const carrierArr = this.quoteCarriers(routeIndex);
            carrierArr.controls.forEach((carrier: FormGroup) => {
              carrier.get('authorizerStatus')?.enable();
            })
          })
        } else {
          this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
            const carrierArr = this.quoteCarriers(routeIndex);
            carrierArr.controls.forEach((carrier: FormGroup) => {
              carrier.get('authorizerStatus')?.disable();
            })
          })
        }
      }
    )
  }

  // SECTION4 - FORM AND FORM ARRAY RELATION
  initQuotationForm() {
    this.quotationForm = this.fb.group({
      LeadOrCustomer : [true],
      PreCustomerMasterSid : [null],
      CustomerMasterSid: [null],
      FreightPPCC : ["Prepaid"],
      CustomerRef: [''],
      Email: [''],
      status: ['Active'],
      SalesmanSid: [null],
      quoteRoutes: this.fb.array([]),
      CustomerName: [''],
      CustomerAddress: ['', [Validators.required]],
      CustomerBranchSid : [null],
      QuoteNumber: [''],
      QuoteDate: [null],
      EnquirySid: [''],
      AgreedRate : [false],
    })
    this.addQuoteRoute();
    this.quotationForm.get('EnquirySid')?.disable();
    this.quoteRoutes.controls.forEach((route, index) => {
      route.get('PODSid')?.valueChanges.subscribe(() => this.onRouteChange(index));
      route.get('POLSid')?.valueChanges.subscribe(() => this.onRouteChange(index));
    });
    this.subscribeToLeadCustomerToggle(); 
  }

  subscribeToLeadCustomerToggle() {
    this.quotationForm.get('LeadOrCustomer')?.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(isCustomer => {
      this.toggleCustomerType(isCustomer);
    });
  }

  toggleCustomerType(isCustomer: boolean) {
    this.quotationForm.patchValue({
      PreCustomerMasterSid: null,
      CustomerMasterSid: null,
      customerName: '',
      CustomerAddress: null,
      CustomerBranchSid: null,
      Email: null,
    });
    this.cusBranchList = [];

    const preCustomerControl = this.quotationForm.get('PreCustomerMasterSid');
    const customerControl = this.quotationForm.get('CustomerMasterSid');

    if (isCustomer) {
      customerControl?.setValidators(Validators.required);
      preCustomerControl?.clearValidators();
    } else {
      preCustomerControl?.setValidators(Validators.required);
      customerControl?.clearValidators();
    }

    customerControl?.updateValueAndValidity();
    preCustomerControl?.updateValueAndValidity();
  }

  onSelectionChange(selectedItem: any) {

    if (!selectedItem) {
      this.quotationForm.patchValue({
        CustomerName: '',
        CustomerAddress: null,
        CustomerBranchSid: null,
        Email: null,
      });
      this.cusBranchList = [];
      return;
    }

    const isCustomer = this.quotationForm.get('LeadOrCustomer')?.value;
    if (isCustomer) {
      this.quotationForm.patchValue({
        CustomerName: selectedItem.CustomerName,
        CustomerAddress: selectedItem.Address,
        Email: selectedItem.Email,
        CustomerBranchSid: selectedItem.CustomerBranchSid,
      });
      this.handleCustomerChangeOnCharges(selectedItem);
    } else {
      this.quotationForm.patchValue({
        CustomerName: selectedItem.preCustomerName,
        CustomerAddress: selectedItem.preCustomerAddress1,
        Email: selectedItem.email,
        CustomerBranchSid: null,
      });
    }
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.quotationForm.controls;
  }

  // Quote Route
  get quoteRoutes(): FormArray {
    return this.quotationForm.get('quoteRoutes') as FormArray;
  }

  addQuoteRoute(data?: any) {
    const routeForm = this.fb.group({

      // Route Related Controls
      QuoteRouteSid: [data?.QuoteRouteSid || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null, [Validators.required]],
      POLFreeDays: [data?.POLFreeDays || 0],
      PODFreeDays: [data?.PODFreeDays || 0],
      PORSid: [data?.PORSid ?? null],
      POLSid: [data?.POLSid ?? null, [Validators.required]],
      PODSid: [data?.PODSid ?? null, [Validators.required]],
      FPODSid: [data?.FPODSid ?? data?.FDPSid ?? null, Validators.required],
      effDate: [new Date(data?.effDate) || null, [Validators.required]],
      expDate: [new Date(data?.expdate) || '', [Validators.required]],
      TransitDays: [data?.TransitDays || ''],
      segmentType: [data?.segmentType || 'LCL', [Validators.required]],
      ServiceLevel: [data?.ServiceLevel || null],
      
      // Cargo Related Controls (Route wise single)
      QuoteCargoSid : [data?.QuoteCargoSid || null],
      CargoType: [data?.CargoType || null, [Validators.required]],
      WeightUnitSid: [data?.WeightUnitSid || null],
      GrossWeight: [
        data?.GrossWeight ? 
          Number(data?.GrossWeight).toFixed(this.digitsAfterDecimal) : 
          0 || 0
      ],
      NetWeight: [
        data?.NetWeight ? 
        Number(data?.NetWeight).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      Volume: [
        data?.Volume ? 
        Number(data?.Volume).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      ChargeableWeight: [
        data?.ChargeableWeight ?
        Number(data?.ChargeableWeight).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      ContainerType: [data?.ContainerType || null],
      Qty: [data?.Qty || 1],
      ShipmentTerms: [data?.ShipmentTerms || null],

      // FormArrays (Route wise multiple)
      quoteCarriers : this.fb.array([]),
      quoteProducts : this.fb.array([]),
    })
    const routeIndex = this.quoteRoutes.length;
    this.quoteRoutes.push(routeForm);
    
    this.filteredPOLPorts[routeIndex] = [];
    this.filteredPODPorts[routeIndex] = [];
    this.onRouteChange(routeIndex);
    this.handleValidationOnDept(routeIndex,data?.segmentType || 'LCL');
    if (data === null || data === undefined || !data) {
      this.addQuoteCarrier(this.quoteRoutes.length - 1);
    }

    routeForm.get('GrossWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(routeForm);
    });
    routeForm.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(routeForm);
    });
    this.setupDynamicQtyUpdates(routeIndex);
  }

  setOrResetWeightError(formGroup: FormGroup) {
    const grossCtrl = formGroup.get('GrossWeight');
    const grossValue = formGroup.get('GrossWeight')?.value;
    const netValue = formGroup.get('NetWeight')?.value;

    if (!grossValue || !netValue) {
      grossCtrl.setErrors(null);
      return;
    }
    if(grossCtrl) {
      if(Number(grossValue) <= Number(netValue)) {
        grossCtrl.setErrors({ grossNotGreater: true });
      } else {
        grossCtrl.setErrors(null);
      }
    } 
  }

  removeRoute(routeIndex: number, QuoteRouteSid: number) {
    if (QuoteRouteSid) {
      this.leadService.deleteRoute(QuoteRouteSid).subscribe((resp: any) => {
        if (resp.status) {
          this.removeQuoteRoute(routeIndex)
        } else {
          this.appSettingService.showError("Error deleting route")
        }
      }, error => {
        console.error('Error deleting route:', error);
      });
    } else {
      this.quoteRoutes.removeAt(routeIndex);
    }
  }
  // helper
  removeQuoteRoute(routeIndex: number) {
    this.quoteRoutes.removeAt(routeIndex);
    this.filteredUnits.splice(routeIndex, 1);
    this.filteredPOLPorts.splice(routeIndex, 1);
    this.filteredPODPorts.splice(routeIndex, 1);
  }


  // Quote Carrier
  quoteCarriers(routeIndex: number): FormArray {
    return this.quoteRoutes.at(routeIndex).get('quoteCarriers') as FormArray;
  }

  createQuoteCarrier(data?: any) {
    return this.fb.group({
      QuoteCarrierSid : [data?.QuoteCarrierSid || null],
      CarrierMasterSid : [data?.CarrierMasterSid || null],
      CarrierName : [data?.CarrierName || ''],
      TransitTime : [data?.TransitTime || null],
      authorizerStatus : [data?.authorizerStatus || 'Pending'],

      quoteCharges : this.fb.array([])
    })
  }

  addQuoteCarrier(routeIndex: number, data?: any) {
    const carrierForm = this.fb.group({
      QuoteCarrierSid : [data?.QuoteCarrierSid || null],
      CarrierMasterSid : [data?.CarrierMasterSid || null],
      CarrierName : [data?.CarrierName || ''],
      TransitTime : [data?.TransitTime || null],
      authorizerStatus : [data?.ApprovalStatus || 'Pending'],
      authorizerRemarks : [data?.authorizerRemarks || ''],
      ApprovedBy : [data?.ApprovedBy || ''],

      quoteCharges : this.fb.array([])
    })
    this.quoteCarriers(routeIndex).push(carrierForm);

    if(!data || data === undefined){
      this.addQuoteCharge(routeIndex,this.quoteCarriers(routeIndex).length - 1);
    }

    this.subscription.add(
      carrierForm.get('authorizerStatus')?.valueChanges.subscribe(value => {
        if(value === 'Approved' || value === 'Rejected'){
          carrierForm.get('ApprovedBy').setValidators(Validators.required);
        } else {
          carrierForm.get('ApprovedBy').clearValidators();
        }
        if(value === 'Counter'){
          carrierForm.get('authorizerRemarks').setValidators(Validators.required);
        } else {
          carrierForm.get('authorizerRemarks').clearValidators();
        }
      })
    )
    carrierForm.updateValueAndValidity();
  }

  handleCarrierChange(carrier: any, routeIndex: number, carrierIndex: number) {
    const routeForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
    if (!carrier || carrier === undefined) {
      routeForm.get('CarrierName').setValue('');
      return;
    }
    routeForm.get('CarrierName').setValue(carrier.CustomerName);
  }

  deleteCarrier(routeIndex: number, carrierIndex: number, QuoteCarrierSid: number) {
    const carrierArr = this.quoteCarriers(routeIndex);
    if (QuoteCarrierSid) {
      this.leadService.deleteCarrier(QuoteCarrierSid).subscribe((resp: any) => {
        if (resp.status) {
          carrierArr.removeAt(carrierIndex);
          this.appSettingService.showSuccess("Carrier Deleted Successfully");
          this.quotationForm.updateValueAndValidity();
        } else {
          this.appSettingService.showError("Error deleting carrier");
        }
      })
    } else {
      carrierArr.removeAt(carrierIndex);
      this.appSettingService.showSuccess("Carrier Deleted Successfully");
      this.quotationForm.updateValueAndValidity();
    }
  }

  // Quote Charge
  quoteCharges(routeIndex: number,carrierIndex:number): FormArray {
    return this.quoteCarriers(routeIndex).at(carrierIndex).get('quoteCharges') as FormArray;
  }

  addQuoteCharge(routeIndex: number,carrierIndex:number, data?: any) {
    const chargeForm = this.fb.group({
      QuoteChargeSid : [data?.QuoteChargeSid || null],
      QuoteRouteSid : [data?.QuoteRouteSid || null],
      QuoteHeaderSid : [data?.QuoteHeaderSid || null],
      QuoteCarrierSid : [data?.QuoteCarrierSid || null],

      ChargeUomSid : [data?.ChargeUomSid || null, [Validators.required]],
      ChargeDisplayName : [data?.ChargeDisplayName, [Validators.required]],
      Qty : [data?.Qty || 1],
      unitQtyBasis: [data?.UnitQty || null],  // This is to track Charge Based on Unit Qty

      RevenueChargeUomSid: [data?.RevenueChargeUomSid || null, [Validators.required]],
      RevenuePrepaidCollect: [data?.RevenuePrepaidCollect || "Prepaid"],
      RevenueCurrencyMasterSid: [data?.RevenueCurrencyMasterSid || null, [Validators.required]],
      RevenueExchangeRate: [
        data?.RevenueExchangeRate ? 
        Number(data?.RevenueExchangeRate).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      RevenueRate: [
        data?.RevenueRate ?
        Number(data?.RevenueRate).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      RevenueNumberOfUnit: [data?.RevenueNumberOfUnit || 0],
      RevenueDrCr: [data?.RevenueDrCr || "C"],
      RevenueAmount: [
        data?.RevenueAmount ?
        Number(data?.RevenueAmount).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      RevenueLocalAmount: [
        data?.RevenueLocalAmount ?
        Number(data?.RevenueLocalAmount).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      RevenueCustomerMasterSid: [data?.RevenueCustomerMasterSid || null], // Revenue Vendor
      RevenueCustomerBranchSid: [data?.RevenueCustomerBranchSid || null],

      CostChargeUomSid : [data?.CostChargeUomSid || null, [Validators.required]],  // Cost Unit
      CostPrepaidCollect : [data?.CostPrepaidCollect || "Prepaid"],
      CostCurrencyMasterSid : [data?.CostCurrencyMasterSid || null, [Validators.required]], // Cost Currency
      CostExchangeRate : [
        data?.CostExchangeRate ?
        Number(data?.CostExchangeRate).toFixed(this.digitsAfterDecimal) :
        0 || 0
      ], // Cost Exchange
      CostRate : [
        data?.CostRate ?
        Number(data?.CostRate).toFixed :
        0 || 0
      ],    // Cost Per Unit Rate
      CostNumberOfUnit : [data?.CostNumberOfUnit || 0],  // Count
      CostDrCr : [data?.CostDrCr || "D"],
      CostAmount : [
        data?.CostAmount ? 
        Number(data?.CostAmount).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],   // Cost Amount
      CostLocalAmount : [
        data?.CostLocalAmount ?
        Number(data?.CostLocalAmount).toFixed(this.digitsAfterDecimal) :
        0 || 0
      ], // Cost Local Amount
      CostAgentMasterSid : [data?.CostAgentMasterSid || null],  // Cost Party
      CostAgentBranchSid : [data?.CostAgentBranchSid || null],



      TariffDetailSid : [data?.TariffDetailSid || null] 
    })
    chargeForm.get('ChargeDisplayName')?.disable();
    const costPerUnitCtrl = chargeForm.get('CostRate');
    const costAgentMasterSidCtrl = chargeForm.get('CostAgentMasterSid');

    costAgentMasterSidCtrl?.valueChanges.subscribe(value => {
      if (value) {
        costPerUnitCtrl?.setValidators([Validators.required]);
        costPerUnitCtrl?.markAsTouched();
      } else {
        costPerUnitCtrl?.clearValidators();
      }
      costPerUnitCtrl?.updateValueAndValidity();
    });

    if (costAgentMasterSidCtrl.value) {
      costPerUnitCtrl.setValidators([Validators.required]);
      costPerUnitCtrl.markAsTouched();
      costPerUnitCtrl.updateValueAndValidity();
    }
    this.quoteCharges(routeIndex,carrierIndex).push(chargeForm)
  }

  setupDynamicQtyUpdates(routeIndex: number): void {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if (!routeForm) return;

    const fieldsToWatch = ['GrossWeight', 'Volume', 'ChargeableWeight', 'Qty'];

    this.subscription.add(
      merge(
        ...fieldsToWatch
          .filter(field => routeForm.get(field)) 
          .map(field => routeForm.get(field)!.valueChanges)
      ).pipe(
        debounceTime(150),
        distinctUntilChanged()
      ).subscribe(() => {
        this.updateAllChargeQuantitiesForRoute(routeIndex);
      })
    );
  }

  private updateAllChargeQuantitiesForRoute(routeIndex: number): void {
    const routeForm = this.quoteRoutes.at(routeIndex);
    if (!routeForm) return;

    const carriers = routeForm.get('quoteCarriers') as FormArray;
    carriers.controls.forEach((carrier, carrierIndex) => {
      const charges = (carrier as FormGroup).get('quoteCharges') as FormArray;
      charges.controls.forEach((charge, chargeIndex) => {
        this.updateSingleChargeQty(routeIndex, carrierIndex, chargeIndex);
      });
    });
  }

  updateSingleChargeQty(routeIndex: number, carrierIndex: number, chargeIndex: number): void {
    const chargeGroup = this.quoteCharges(routeIndex, carrierIndex).at(chargeIndex) as FormGroup;
    const routeGroup = this.quoteRoutes.at(routeIndex) as FormGroup;

    const unitQtyBasis = chargeGroup.get('unitQtyBasis')?.value;
    if (!unitQtyBasis) {
      return; 
    }

    const qtySourceField = this.findFieldForQty(unitQtyBasis);
    let newQty = 1;

    if (typeof qtySourceField === 'string' && routeGroup.get(qtySourceField)) {
      newQty = routeGroup.get(qtySourceField)?.value || 1;
    } else if (typeof qtySourceField === 'number') {
      newQty = qtySourceField;
    }

    chargeGroup.get('Qty')?.setValue(newQty);
    this.calculateRevenueTotalAmount(routeIndex, carrierIndex, chargeIndex);
    this.calculateCostTotalAmount(routeIndex, carrierIndex, chargeIndex);
  }

  isRequiredInQuoteRoute(routeIndex:number ,ctrl : string) : boolean {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    return routeForm.get(ctrl)?.hasValidator(Validators.required);
  }

  isCostPerUnitRequired(routeIndex: number,carrierIndex:number): boolean {
    const chargesArray = this.quoteCharges(routeIndex,carrierIndex);
    if (!chargesArray) {
      return false;
    }
    return chargesArray.controls.some(
      chargeCtrl => !!chargeCtrl.get('CostAgentMasterSid')?.value
    );
  }


  removeCharge(routeIndex: number, carrierIndex: number,chargeIndex: number, QuoteChargeSid: number) {
    const chargeArr = this.quoteCharges(routeIndex,carrierIndex);
    if (QuoteChargeSid) {
      this.leadService.deleteCharge(QuoteChargeSid).subscribe((resp: any) => {
        if (resp.status) {
          chargeArr.removeAt(chargeIndex);
          this.quotationForm.updateValueAndValidity();
        } else {
          this.appSettingService.showError("Error deleting quote charge.")
        }
      })
    } else {
      chargeArr.removeAt(chargeIndex);
      this.quotationForm.updateValueAndValidity();
    }
  }




  // Quote Product

  quoteProducts(routeIndex: number): FormArray {
    return this.quoteRoutes.at(routeIndex).get('quoteProducts') as FormArray;
  }

  addQuoteProduct(routeIndex: number, data?: any) {
    const productForm = this.fb.group({
      QuoteProductSid : [data?.QuoteProductSid || null],
      Sno : [data?.Sno || null],
      ProductSid : [data?.ProductSid || null , [Validators.required]],
      ProductName : [data?.ProductName || '' , [Validators.required]],
      PackageType : [data?.PackageType || null ],
      CargoDescription : [data?.CargoDescription || ''],
      ExternalPkg : [data?.ExternalPkg || null ],
      ExternalQty : [data?.ExternalQty || '' ],
      GrossWeight : [
        data?.GrossWeight ? 
        Number(data?.GrossWeight).toFixed(this.digitsAfterDecimal) : 
        0
       ],
      NetWeight : [
        data?.NetWeight ?
        Number(data?.NetWeight).toFixed(this.digitsAfterDecimal) : 
        0
      ],
      Volume : [
        data?.Volume ?
        Number(data?.Volume).toFixed(this.digitsAfterDecimal) : 
        0
      ],
      Length : [data?.Length || ''],
      Width : [data?.Width || ''],
      Height : [data?.Height || ''],
      ProductUnit : [data?.ProductUnit || null],
      ChargeableWeight : [
        data?.ChargeableWeight ? 
        Number(data?.ChargeableWeight).toFixed(this.digitsAfterDecimal) : 
        0
      ],
      IsHaz : [data?.IsHaz === "Y" || false],
      ImcoClass : [{ value : data?.ImcoClass || null, disabled : data?.IsHaz !=="Y" || true }],
      UnNo : [data?.UnNo || ''],
      PkgGroup : [{ value : data?.PkgGroup || null, disabled : data?.IsHaz !=="Y" || true }],
      Remarks : [data?.Remarks || ''],
    });


    this.quoteProducts(routeIndex).push(productForm);
    const productLength = this.quoteProducts(routeIndex).length;
    this.handleSegmentChangeOnProduct(routeIndex, productLength - 1);
    productForm.updateValueAndValidity();
    this.handleCalculation(routeIndex);
    productForm.get("GrossWeight").valueChanges.subscribe(() => {
      this.setOrResetWeightError(productForm);
    });
    productForm.get("NetWeight").valueChanges.subscribe(() => {
      this.setOrResetWeightError(productForm);
    });
  }

  handleSegmentChangeOnAllProducts(routeIndex: number) {
    this.quoteProducts(routeIndex).controls.forEach((product, index) => {
      this.handleSegmentChangeOnProduct(routeIndex, index);
    });
  }

  logProduct(routeIndex:number,productIndex:number){
    const product = this.quoteProducts(routeIndex).at(productIndex) as FormGroup;
    console.log(product.controls);
  }

  handleSegmentChangeOnProduct(routeIndex: number,productIndex:number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if (!routeForm) return;

    const segmentType = routeForm.get('segmentType')?.value;
    if(!segmentType) return;
    const isLCL = segmentType === 'LCL';
    const isFCL = segmentType === "FCL";
    const isAir = segmentType === 'AIR';

    const routeControlsToValidate = {
        ContainerType: isFCL,
        Qty: isFCL,
    };

    for (const [key, isRequired] of Object.entries(routeControlsToValidate)) {
      const control = routeForm.get(key);
      if (control) {
        this.setOrClearRequired(control, isRequired);
      }
    }

    const productControlsToValidate = {
        GrossWeight: isLCL || isFCL,
        NetWeight: isLCL || isFCL,
        Volume: isLCL || isFCL,
        ExternalQty: isLCL || isFCL,
        ExternalPkg: isLCL || isFCL,
        Length: isAir,
        Width: isAir,
        Height: isAir,
        ProductUnit: isAir,
    };

    this.quoteProducts(routeIndex).controls.forEach(productControl => {
        for (const [key, isRequired] of Object.entries(productControlsToValidate)) {
            const control = (productControl as FormGroup).get(key);
            if (control) {
                this.setOrClearRequired(control, isRequired);
            }
        }
    });
    this.quoteProducts(routeIndex).updateValueAndValidity();
  }
  private setOrClearRequired(control: AbstractControl, isRequired: boolean) {
    const validators = control.validator ? [control.validator] : [];
    const hasRequired = validators.includes(Validators.required);

    if (isRequired && !hasRequired) {
      control.addValidators(Validators.required);
    } else if (!isRequired && hasRequired) {
      control.removeValidators(Validators.required);
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  isProductRequired(routeIndex: number, productIndex: number, ctrl: string) {
    const productForm = this.quoteProducts(routeIndex)?.at(productIndex);
    const control = productForm?.get(ctrl);
    return control ? control.hasValidator(Validators.required) : false;
  }

  onHazChange(routeIndex:number,productIndex:number,event:any){
      const element = event.target as HTMLInputElement;
      const control = this.quoteProducts(routeIndex).at(productIndex).get('IsHaz');
      if(event instanceof KeyboardEvent){
        element.checked = !element.checked;
      }
      control.setValue(element.checked);
      this.toggleHazProduct(routeIndex,productIndex);
  }

  toggleHazProduct(routeIndex:number,productIndex:number){
    const isHaz = this.quoteProducts(routeIndex).at(productIndex).get('IsHaz')?.value;
    console.log(isHaz);
    if(isHaz){
      this.quoteProducts(routeIndex).at(productIndex).get('ImcoClass')?.enable();
      this.quoteProducts(routeIndex).at(productIndex).get('PkgGroup')?.enable();
      this.quoteProducts(routeIndex).at(productIndex).get('ImcoClass')?.setValidators(Validators.required);
      this.quoteProducts(routeIndex).at(productIndex).get('PkgGroup')?.setValidators(Validators.required);
    } else {
      this.quoteProducts(routeIndex).at(productIndex).get('ImcoClass')?.setValue(null);
      this.quoteProducts(routeIndex).at(productIndex).get('PkgGroup')?.setValue('');
      this.quoteProducts(routeIndex).at(productIndex).get('ImcoClass')?.clearValidators();
      this.quoteProducts(routeIndex).at(productIndex).get('ImcoClass')?.disable();
      this.quoteProducts(routeIndex).at(productIndex).get('PkgGroup')?.clearValidators();
      this.quoteProducts(routeIndex).at(productIndex).get('PkgGroup')?.disable();
    }
  }

  onImcoChange(routeIndex:number,productIndex,item:any){
    console.log(item);
    const productForm = this.quoteProducts(routeIndex).at(productIndex) as FormGroup;
    if(!item){
      productForm.get('UnNo')?.setValue("");
      productForm.get('PkgGroup')?.setValue("");
      return;
    }
    productForm.get('UnNo')?.setValue(item.ImcoUn);
    productForm.get('PkgGroup')?.setValue(item.PackingGroup);
  }

  deleteQuoteProduct(routeIndex:number, productIndex:number,QuoteProductSid:number){
    const ctrl = this.quoteProducts(routeIndex) as FormArray;
    if(QuoteProductSid){
      this.leadService.deleteProduct(QuoteProductSid).subscribe((resp:any) => {
        if(resp.status){
          ctrl.removeAt(productIndex);
          this.quoteProducts(routeIndex).updateValueAndValidity();
          this.handleCalculation(routeIndex);
          this.appSettingService.showSuccess("Product Deleted Successfully");
        } else {
          this.appSettingService.showError("Error Deleting Product");
        }
      });
    } else {
      ctrl.removeAt(productIndex);
      this.quoteProducts(routeIndex).updateValueAndValidity();
      this.handleCalculation(routeIndex);
      this.appSettingService.showSuccess("Product Deleted Successfully");
    }
  }

  onProductChange(product:any,routeIndex:number,productIndex:number){
    const productForm = this.quoteProducts(routeIndex)?.at(productIndex) as FormGroup;
    console.log(product,'productForm')
    productForm.get('ProductName')?.setValue("");
    productForm.get('IsHaz')?.setValue(false);
    productForm.get('ImcoClass')?.setValue('');
    productForm.get('PkgGroup')?.setValue('');
    if(!product){
      return;
    } else {
      productForm.get('ProductName')?.setValue(product.ProductName);
      const isHaz = product.ProductType === "2";
      productForm.get('IsHaz')?.setValue(isHaz);
      if(isHaz){
        productForm.get('ImcoClass')?.enable();
        productForm.get('UnNo')?.enable();
        productForm.get('PkgGroup')?.enable();
        console.log(product.UNNo);
        productForm.patchValue({
          ImcoClass : product.IMOClass,
          UnNo : product.UNNo,
          PkgGroup : product.PackingGroup
        })
      } else {
        productForm.get('ImcoClass')?.setValue(null);
        productForm.get('UnNo')?.setValue('');
        productForm.get('PkgGroup')?.setValue('');
        productForm.get('ImcoClass')?.disable();
        productForm.get('UnNo')?.disable();
        productForm.get('PkgGroup')?.disable();
      }
    }
  }


  // SECTION5 - MAIN FUNCTIONS

  loadAllLookUps() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const filterOption = { 
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      BranchMasterSid : this.currentBranch?.BranchMasterSid
    }
    return forkJoin({
      cargoTypes: this.leadService.getAllCargoTypes(CompanyMasterSid).pipe(catchError(err => of([]))),
      carriers: this.leadService.getAllCarrier(CompanyMasterSid).pipe(catchError(err => of([]))),
      leads : this.leadService.fetchAllLeads(filterOption).pipe(catchError(err => of([]))),
      customers: this.leadService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(err => of([]))),
      departments: this.leadService.getAllDepartments(CompanyMasterSid).pipe(catchError(err => of([]))),
      ports: this.leadService.getAllPorts().pipe(catchError(err => of([]))),
      incos: this.leadService.getAllIncos().pipe(catchError(err => of([]))),
      salesman: this.leadService.getAllSalesman().pipe(catchError(err => of([]))),
      masters: this.leadService.getAllMasters(CompanyMasterSid).pipe(catchError(err => of({ charges: [], currencies: [], units: [] }))),
      chargeUnits : this.leadService.getUOMsByType('C').pipe(catchError(err => of([]))),
      packageTypes : this.leadService.getUOMsByType('P').pipe(catchError(err => of([]))),
      measurementUnits : this.leadService.getUOMsByType('M').pipe(catchError(err => of([]))),
      weightUnits : this.leadService.getUOMsByType('W').pipe(catchError(err => of([]))),
      vendors: this.leadService.getAllVendorSupplier(CompanyMasterSid).pipe(catchError(err => of([]))),
      containerTypes: this.leadService.getAllContainerTypes().pipe(catchError(err => of([]))),
      products : this.leadService.getAllProducts(CompanyMasterSid).pipe(catchError(err => of([]))),
      imcos : this.leadService.getAllImco().pipe(catchError(err => of([]))),
    }).pipe(tap(({ cargoTypes, carriers, leads, customers, departments, vendors, ports, incos, salesman, masters,chargeUnits, containerTypes , packageTypes,products,imcos,measurementUnits,weightUnits }) => {
      this.packageTypes = cargoTypes || [];
      this.carriers = carriers || [];
      this.leadList = leads.data;
      this.customers = customers || [];
      this.departments = departments || [];
      this.ports = (ports || []).map(p => ({...p,Country : p.countryMaster?.countryName}));
      this.chargeMaster = masters.charges || [];
      this.currencyMaster = masters.currencies || [];
      this.chargeUnitMaster = chargeUnits.data || [];
      this.measurementUnitList = measurementUnits.data || [];
      this.weightUnitList = weightUnits.data || [];
      this.packageTypes = packageTypes.data || [];
      this.incoList = incos || [];
      this.salesmanList = salesman || [];
      this.containerTypeList = containerTypes || [],
      this.vendorSupplierList = vendors || [];
      this.productList = products || [];
      this.imcoList = imcos.data || [];
    })
    );
  }

  loadQuotation(id): void {
    this.spinner.show();
    this.leadService.getQuoteById(id).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.spinner.hide();
          this.patchValues(resp.data)
          this.quotationData = resp.data;
          this.selectedItem = resp.data;
        } else {
          this.spinner.hide();
          this.appSettingService.showError("Error loading Quotation")
          console.error(resp.message);
        }
      });
  }

  patchValues(response: any) {
    
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectedCustomer = this.customers.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
    if (selectedCustomer) {
      this.f['CustomerName']?.setValue(selectedCustomer?.CustomerName);
      this.getCustomerBranches(selectedCustomer?.CustomerMasterSid)
    }
    if (selectedDept?.departmentType === "Sea") {
      this.f['SegmentType']?.setValue(selectedDept?.FCLLCL);
    } else {
      this.f['SegmentType']?.setValue(selectedDept?.departmentType?.toUpperCase());
    }
    this.f['DepartmentMasterSid']?.disable();
    this.f['LeadOrCustomer']?.disable();
    this.f['CustomerMasterSid']?.disable();
    this.f['PreCustomerMasterSid']?.disable();
    this.getEnquiryName(response.EnquirySid);
    this.quotationForm.patchValue({
      ...response,
      LeadOrCustomer : response.LeadOrCustomer === "C",
      AgreedRate : response.AgreedRate === "Y",
      status: response.status === 'A' ? 'Active' : 'Suspended',
      QuoteDate: new Date(response.QuoteDate),
    })
    this.authStateCache = response?.authorizerStatus || 'Pending';
    this.quoteRoutes.clear();
    (response.quoteRoute || []).forEach((route, routeIndex) => {
      const cargo = route.quoteCargo[0];
      const fullRouteData = {
        ...route,
        QuoteCargoSid : cargo?.QuoteCargoSid || null,
        CargoType : cargo?.CargoType,
        WeightUnitSid : cargo?.WeightUnitSid,
        GrossWeight : cargo?.GrossWeight,
        NetWeight : cargo?.NetWeight,
        Volume : cargo?.Volume,
        ChargeableWeight : cargo?.ChargeableWeight,
        ContainerType : cargo?.ContainerType,
        Qty : cargo?.Qty,
        ShipmentTerms : cargo?.ShipmentTerms
      }
      this.addQuoteRoute(fullRouteData)
      this.handleValidationOnDept(routeIndex, route.segmentType)
      this.onRouteChange(routeIndex);

      if (cargo) {
        (cargo.quoteProduct || []).forEach(product => {
          const productUnNo = this.productList.find(prod => prod.ProductMasterSid === product.ProductMasterSid)?.UnNo;

          this.addQuoteProduct(routeIndex, { ...product, UnNo: productUnNo });
        })
      }

      (route?.quoteCarrier || []).forEach((carrier,carrierIndex) => {
        this.addQuoteCarrier(routeIndex,carrier);
        (carrier?.quoteCharge || []).forEach(charge => {
          this.addQuoteCharge(routeIndex,carrierIndex, charge);
        }) 
      })
    })
    this.disableNonEditFields();
    if(this.authStateCache !== 'Pending'){
      this.quotationForm.disable();
      this.disableAllModification = true;
    }

    
    this.quotationApproved = (response.quoteRoute || []).some(route => {
      return (route?.quoteCarrier || []).some(carrier => carrier.ApprovalStatus === "Approved")
    })

    const { quoteRoute, ...header } = response;
    const approvedRoute = (quoteRoute || []).find(route => {
      return (route?.quoteCarrier || []).some(carrier => carrier.ApprovalStatus === "Approved");
    });

    let approvedQuoteCarrier;
    let approvedQuoteCargo;
    let approvedQuoteRoute;

    if (approvedRoute) {
      // Extract only the approved carrier
      const approvedCarrier = (approvedRoute.quoteCarrier || []).find(
        carrier => carrier.ApprovalStatus === "Approved"
      );

      // Prepare copies
      approvedQuoteCarrier = approvedCarrier;
      approvedQuoteCargo = approvedRoute.quoteCargo;

      // Copy route details except arrays
      const { quoteCarrier, quoteCargo, ...routeDetails } = approvedRoute;
      approvedQuoteRoute = {
        ...routeDetails,
        quoteCarrier: approvedQuoteCarrier
      };
    }

    console.log("Approved Route:", approvedRoute);

    let approvedData = {
      ...header,
      quoteRoute: approvedQuoteRoute
    };

    console.log("Approved Data:", approvedData);

    // Approved Data for Quotation
    this.selectedItem = approvedData;

    console.log("Is it approved Quotation",this.quotationApproved);
    console.log("Only Approved Data",this.selectedItem);

  }

  onSubmit() {

    const canLoginUserAuthorize = this.authorizerDetails.canAuthorize;
    if(canLoginUserAuthorize && !this.approvalDropdownValue){
      this.appSettingService.showWarning("Please select approval status");
      return;
    }

    if (this.quoteRoutes.invalid) {
      this.appSettingService.showWarning("Please fill all the Route details correctly");
      this.quoteRoutes.markAllAsTouched();
      this.quoteRoutes.updateValueAndValidity();
      this.selectedTab1 = 'Route Details';
      return;
    }

    this.quoteRoutes.controls.forEach((route:FormGroup,routeIndex:number)=>{
      const carrierArr = this.quoteCarriers(routeIndex);
      carrierArr.controls.forEach((carrier:FormGroup,carrierIndex:number) => {
        carrier.updateValueAndValidity();
        carrier.markAllAsTouched();
      })
    })

    if (this.quotationForm.invalid) {
      this.appSettingService.showWarning("Please fill all the required fields correctly");
      this.quotationForm.markAllAsTouched();
      this.quotationForm.updateValueAndValidity();
      this.selectedTab1 = 'Quotation';
      return;
    }

    const formValue = this.quotationForm.getRawValue();
    let currentCompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    let currentBranchMasterSid = this.currentBranch?.BranchMasterSid;
    let userEmail = this.userData?.userEmail;
    console.log(this.authorizerDetails);

    const payload = {
      CompanyMasterSid: currentCompanyMasterSid,
      BranchMasterSid: currentBranchMasterSid,
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail }),
      UserMasterSid: this.userData?.UserMasterSid,
      LeadOrCustomer : formValue.LeadOrCustomer ? "C" : "L",
      AgreedRate : formValue.AgreedRate ? "Y" : "N",
      PreCustomerMasterSid : formValue.PreCustomerMasterSid,
      CustomerMasterSid: formValue.CustomerMasterSid,
      CustomerRef: formValue.CustomerRef,
      CustomerAddress: formValue.CustomerAddress,
      Email: formValue.Email,
      SalesmanSid: formValue.SalesmanSid,
      CustomerName: formValue.CustomerName,
      QuoteNumber: formValue.QuoteNumber,
      QuoteDate: formValue.QuoteDate,
      EnquirySid: formValue.EnquirySid,
      status: formValue.status === "Active" ? 'A' : 'S',
      authDetails : {
          canAuthorize : this.authorizerDetails?.canAuthorize,
          AuthorityDetailSid :  this.authorizerDetails?.AuthorityDetailSid || null,
          ApprovalStatus : this.approvalDropdownValue,
          ApprovedBy : this.authorizerDetails?.ApprovedBy
      },

      quoteRoutes: (formValue.quoteRoutes || []).map((route, routeIndex) => ({
        // Route Part
        QuoteRouteSid: route.QuoteRouteSid,
        DepartmentMasterSid: route.DepartmentMasterSid,
        POLFreeDays: route.POLFreeDays ? route.POLFreeDays : 0,
        PODFreeDays: route.PODFreeDays ? route.PODFreeDays : 0,
        PORSid: route.PORSid,
        POLSid: route.POLSid,
        PODSid: route.PODSid,
        FPODSid: route.FPODSid,
        effDate: route.effDate,
        expDate: route.expDate,
        TransitDays: route.TransitDays,
        segmentType: route.segmentType || 'LCL',
        ServiceLevel: route.ServiceLevel,

        // Route - Cargo
        QuoteCargoSid : route.QuoteCargoSid,
        CargoType: route.CargoType,
        WeightUnitSid : route.WeightUnitSid,
        GrossWeight : route.GrossWeight,
        NetWeight : route.NetWeight,
        Volume : route.Volume,
        ChargeableWeight : route.ChargeableWeight,
        ContainerType: route.ContainerType,
        Qty: route.Qty,
        ShipmentTerms : route.ShipmentTerms,
        PackageType : route.PackageType,
        PackageQty : route.PackageQty,
        CargoDescription : route.CargoDescription,

        // Route - Cargo - Product
        quoteProducts : (route.quoteProducts || []).map(product => {
          const isHaz = product.ProductType === "2";
          const productUnNo = this.productList.find(prod => prod.ProductMasterSid === product.ProductMasterSid)?.UnNo;
          const imcoUnNo = this.imcoList.find(imco => imco.ImcoMasterSid === product.IMOClass)?.ImcoUn;
          return {
          ...product,
          UnNo : productUnNo || imcoUnNo,
          }
        }),

        // Route - Carrier
        quoteCarriers : (route.quoteCarriers || []).map((carrier) => {
          const canLoginUserAuthorize = this.authorizerDetails?.canAuthorize;
          let approvalLevel = this.authorizerDetails?.AuthorityLevel;

          let finalValue;
          if(this.approvalDropdownValue === "Approved"){
            finalValue = this.statusMapBasedOnAuthLevel.get(String(approvalLevel));
          } else {
            finalValue = "Rejected";
          }
          console.log(finalValue);
          const allCharges = (carrier.quoteCharges || []).map(charge => ({
            ...charge,
          }))
          return {
            ...carrier,
            ...(canLoginUserAuthorize ? {ApprovalStatus : finalValue} : {}),
            quoteCharges : allCharges
          }
        })
      })),
    };

    if (this.isEditMode) {

      this.leadService.updateQuoteById(this.QuoteHeaderSid, payload).subscribe(
        (resp: any) => {

          if (resp.status) {
            this.appSettingService.showSuccess('Quotation is successfully updated');
            const customerId = resp.data?.createdCustomer?.CustomerMasterSid;
            if(customerId){
              this.createdCustomerId = customerId;
              this.ngbModal.open(this.customerCreatedModal, {
                size: 'lg',
                backdrop: 'static',
                centered: true
              });
            }
          } else {
            this.appSettingService.showError(resp.message);

          }
        }
      )
    } else {

      this.leadService.createQuotation(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess("Quotation Created Successfully");
            const id = resp.data?.quoteHeader?.QuoteHeaderSid;
            if(id){
              this.router.navigate(['crm/quotation/entry',id])
            }
          } else {
            this.modalService.openErrorModal("Quotation Creation Failed");
          }
        }
      )
    }
  }

  // SECTION6 - HELPER FUNCTIONS

  disableNonEditFields() {
    const disabledFields = ['QuoteNumber', 'QuoteDate', 'EnquirySid'];
    disabledFields.forEach(field => {
      this.f[field]?.disable();
    });
    this.quoteRoutes.controls.forEach((group:FormGroup)=>{
      
      group.get('DepartmentMasterSid')?.disable();
    })
  }

  handleValidationOnDept(index: number, type: 'FCL' | 'LCL' | 'AIR' | null) {
    const routeForm = this.quoteRoutes.at(index) as FormGroup;

    const validationConfig = {
      FCL: ['ContainerType', 'Qty'],
      LCL: ['GrossWeight', 'NetWeight', 'Volume'],
      AIR: ['GrossWeight', 'ChargeableWeight'],
    };

    let allDynamicFields;
    switch (type) {
      case 'FCL':
        allDynamicFields = ['GrossWeight', 'NetWeight', 'Volume','ChargeableWeight'];
        break;
      case 'LCL':
        allDynamicFields = ['ContainerType', 'Qty','ChargeableWeight'];
        break;
      case 'AIR':
        allDynamicFields = ['ContainerType', 'Qty','NetWeight', 'Volume'];
        break;
      default:
        allDynamicFields = [];
    }

    allDynamicFields.forEach(fieldName => {
      const control = routeForm.get(fieldName);
      if (control) {
        control.setValue(null, { emitEvent: false });
        control.clearValidators();
        control.updateValueAndValidity({ emitEvent: false });
      }
    });

    if (type && validationConfig[type]) {
      const requiredFields = validationConfig[type];

      requiredFields.forEach(fieldName => {
        const control = routeForm.get(fieldName);
        if (control) {
          const newValidators = [Validators.required];

          if (fieldName !== 'ContainerType') {
            newValidators.push(Validators.min(1));
          }

          control.setValidators(newValidators);
          control.updateValueAndValidity({ emitEvent: false });
        }
      });
    }

    routeForm.updateValueAndValidity();
  }

  onDeptChange(dept: any, routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    routeForm.get('PORSid')?.reset();
    routeForm.get('POLSid')?.reset();
    routeForm.get('PODSid')?.reset();
    routeForm.get('FPODSid')?.reset();
    
    if (!dept || dept === undefined) {
      routeForm.get('segmentType').setValue('LCL');
      this.handleValidationOnDept(routeIndex, 'LCL');
      return;
    }
    const deptType = dept?.departmentType;
    console.log(deptType);
    const selectedFCLLCL = deptType === "Sea" ? dept?.FCLLCL : deptType.toUpperCase()
    routeForm.get('segmentType').setValue(selectedFCLLCL);
    this.handleValidationOnDept(routeIndex, selectedFCLLCL);
    console.log(selectedFCLLCL);
    this.onRouteChange(routeIndex);
    this.quoteRoutes.controls.forEach((route:FormGroup)=>{
      this.handleSegmentChangeOnAllProducts(routeIndex);
    })

    this.filterChargesBySegment(routeIndex,selectedFCLLCL);
  }

  onCustomerChange(event: any): void {
    this.quotationForm.get('CustomerName')?.setValue('')
    this.quotationForm.get('CustomerAddress')?.setValue(null);
    this.quotationForm.get('Email')?.setValue('');
    if (!event || event === null || event === undefined) {
      this.cusBranchList = [];
      return;
    }
    const selectedCustomerId = event.CustomerMasterSid;
    this.quotationForm.get('CustomerName').setValue(event.CustomerName);
    this.getCustomerBranches(selectedCustomerId);
  }

  onPODChange(event: any, routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if (!event || event === undefined) {
      routeForm.get('FPODSid')?.setValue(null);
      return;
    }
    routeForm.get('FPODSid')?.setValue(event.PortMasterSid);
  }

  onChargeChange(charge: any, routeIndex: number, carrierIndex: number, chargeIndex: number) {
    const chargeForm = this.quoteCharges(routeIndex, carrierIndex).at(chargeIndex) as FormGroup;

    if (!charge) {
      const clearFields = ['ChargeDisplayName', 'ChargeUomSid', 'Qty', 'RevenueCurrencyMasterSid', 'RevenueExchangeRate', 'RevenueAmount', 'RevenueLocalAmount', 'unitQtyBasis'];
      clearFields.forEach(ctrl => chargeForm.get(ctrl)?.reset());
      return;
    }

    chargeForm.patchValue({
      ChargeDisplayName: charge.chargeName,
      RevenueChargeUomSid: charge.UOM,
      CostChargeUomSid: charge.UOM,
      RevenueCurrencyMasterSid: charge.CurrencyMasterSid,
      CostCurrencyMasterSid: charge.CurrencyMasterSid,
      unitQtyBasis: charge.UnitQty
    });

    this.updateSingleChargeQty(routeIndex, carrierIndex, chargeIndex);

    this.fetchExchangeRate(routeIndex, carrierIndex, chargeIndex, 'revenue');
    this.fetchExchangeRate(routeIndex, carrierIndex, chargeIndex, 'cost');

  }


  onCarrierChange(carrier: any, routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if (!carrier || carrier === undefined) {
      routeForm.get('CarrierName').setValue('');
      return;
    }
    routeForm.get('CarrierName').setValue(carrier.CustomerName);
  }

  getEnquiryName(EnquirySid: number) {
    if (!EnquirySid) return;
    this.leadService.getEnquiryById(EnquirySid).subscribe(
      (resp: any) => {
        if (resp.status) {
          let enquiryData = resp.data;
          if (enquiryData) {
            this.enquiryNumber = enquiryData?.EnquiryNumber;
          }
        } else {
          this.appSettingService.showError('Error Loading Enquiry Data');
        }
      }
    )
  }


  // filterUnitsBasedOnDept(routeIndex: number, type: string) {
  //   this.filteredUnits[routeIndex] = [];
  //   if (!this.unitMaster || this.unitMaster.length === 0 || !type) {
  //     return;
  //   }
  //   if (type === 'FCL') {
  //     this.filteredUnits[routeIndex] = this.unitMaster.filter(unit => (unit.ShipmentType === "FCL" || unit.ShipmentType === "All"));
  //   } else if (type === "LCL") {
  //     this.filteredUnits[routeIndex] = this.unitMaster.filter(unit =>  (unit.ShipmentType === "LCL" || unit.ShipmentType === "All"));
  //   } else if (type === "AIR") {
  //     this.filteredUnits[routeIndex] = this.unitMaster.filter(unit =>  (unit.ShipmentType === "AIR" || unit.ShipmentType === "All"));
  //   }
  // }

  onRouteChange(routeIndex: number): void {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    console.log(this.quoteRoutes,'quoteRoutes')
    const polSid = routeForm.get('POLSid')?.value;
    const podSid = routeForm.get('PODSid')?.value;
    const segment = routeForm.get('segmentType')?.value;

    this.filteredPorts = this.getFilteredPortsBySegment(segment);
    this.filteredPOLPorts[routeIndex] = this.filteredPorts.filter(port => port.PortMasterSid !== podSid);
    this.filteredPODPorts[routeIndex] = this.filteredPorts.filter(port => port.PortMasterSid !== polSid);
    if (polSid && podSid && polSid === podSid) {
      routeForm.get('PODSid')?.setErrors({ samePort: true });
      routeForm.get('POLSid')?.setErrors({ samePort: true });
    } else {
      routeForm.get('PODSid')?.setErrors(null);
      routeForm.get('POLSid')?.setErrors(null);
    }
  }

  getFilteredPortsBySegment(segment: string): any[] {
    if (segment === 'AIR') {
      return this.ports.filter(port => port.PortType === 'Air');
    } else if (segment === 'FCL' || segment === 'LCL') {
      return this.ports.filter(port => port.PortType === 'Sea');
    }
    return [];
  }

  getCustomerBranches(CustomerMasterSid: number) {
    this.leadService.getCustomerBranchByCustomerId(CustomerMasterSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.cusBranchList = resp.data;
        } else {
          this.appSettingService.showError('Error loading customer branches.')
          console.error(resp.message);
        }
      }
    )
  }

  handleQtyForRoutes(routeIndex:number,carrierIndex:number){
    const chargeArr = this.quoteCharges(routeIndex,carrierIndex);
    chargeArr.controls.forEach((_, chargeIndex) => {
      this.handleQty(routeIndex,carrierIndex, chargeIndex);
    });
  }

  handleQty(routeIndex:number,carrierIndex:number,chargeIndex:number){
    const routeCtrl = this.quoteRoutes.at(routeIndex) as FormGroup;
    const chargeCtrl = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const segment = routeCtrl?.get('segmentType').getRawValue();
    if(segment === "FCL"){
      let value = routeCtrl.get('ContainerQty')?.getRawValue()
      chargeCtrl.get('Qty')?.setValue(value);
    } else if(segment === "LCL"){
      chargeCtrl.get('Qty')?.setValue(routeCtrl.get('CBM')?.getRawValue());
    } else if(segment === "AIR"){
      chargeCtrl.get('Qty')?.setValue(routeCtrl.get('ChargeableWeight')?.getRawValue());
    }
    this.calculateRevenueTotalAmount(routeIndex,carrierIndex,chargeIndex);
    this.calculateCostTotalAmount(routeIndex,carrierIndex,chargeIndex);
  }

  calculateTotalAmountForRoute(routeIndex: number,carrierIndex:number) {
    const chargeArr = this.quoteCharges(routeIndex,carrierIndex);
    chargeArr.controls.forEach((_, chargeIndex) => {
      this.calculateRevenueTotalAmount(routeIndex, carrierIndex , chargeIndex);
      this.calculateCostTotalAmount(routeIndex , carrierIndex, chargeIndex);
    });
  }



  calculateRevenueTotalAmount(routeIndex: number,carrierIndex:number, chargeIndex: number) {
    const chargeCtrl = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const qty = Number(chargeCtrl.get('Qty')?.value);
    const revenueRate = Number(chargeCtrl.get('RevenueRate')?.value);
    const revExRate = Number(chargeCtrl.get('RevenueExchangeRate')?.value);
    console.log(this.revenueLocalInputs);
    if (qty && revenueRate) {
      chargeCtrl.get('RevenueAmount')?.setValue((qty * revenueRate).toFixed(this.digitsAfterDecimal));
    } else {
      chargeCtrl.get('RevenueAmount')?.setValue((0).toFixed(this.digitsAfterDecimal));
    }

    if (qty && revenueRate && revExRate) {
      chargeCtrl.get('RevenueLocalAmount')?.setValue((qty * revenueRate * revExRate).toFixed(this.digitsAfterDecimal));
      this.blurRevenueLocalInput(routeIndex, carrierIndex, chargeIndex);
    } else {
      chargeCtrl.get('RevenueLocalAmount')?.setValue((0).toFixed(this.digitsAfterDecimal));
    }
  }

  blurRevenueLocalInput(routeIndex: number, carrierIndex: number, chargeIndex: number) {
    const el = this.revenueLocalInputs.find(ref => {
      const e = ref.nativeElement;
      return +e.getAttribute('data-route') === routeIndex &&
        +e.getAttribute('data-carrier') === carrierIndex &&
        +e.getAttribute('data-charge') === chargeIndex;
    });

    if (el && document.activeElement !== el.nativeElement) {
      el.nativeElement.blur();
    }
  }

  calculateCostTotalAmount(routeIndex: number,carrierIndex:number, chargeIndex: number) {
    const chargeCtrl = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const qty = chargeCtrl.get('Qty')?.value;
    const costRate = chargeCtrl.get('CostRate')?.value;
    const costExRate = chargeCtrl.get('CostExchangeRate')?.value;
    if(qty && costRate){
      chargeCtrl.get('CostAmount')?.setValue(qty * costRate);
    } else {
      chargeCtrl.get('CostAmount')?.setValue('0');
    }

    if (qty && costRate && costExRate) {
      chargeCtrl.get('CostLocalAmount')?.setValue(qty * costRate * costExRate);
    } else {
      chargeCtrl.get('CostLocalAmount')?.setValue('0');
    }
  }

  hasEveryRequiredFieldsFilled(routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;

    for (let index = 0; index < this.requiredFieldsToGetTariff.length; index++) {
      const element = routeForm.get(this.requiredFieldsToGetTariff[index]);
      console.log(element.value);
      if (!element.value) {
        return false
      }
    }
    return true
  }

  // getTariffDetails(routeIndex:number,carrierIndex:number,template:TemplateRef<any>){
  //   const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  //   const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
  //   if(!this.hasEveryRequiredFieldsFilled(routeIndex)){
  //     this.appSettingService.showWarning("Please fill all the required fields to get tariff details.");

  //     this.requiredFieldsToGetTariff.forEach(ctrl => {
  //       if(routeForm.get(ctrl)){
  //         routeForm.get(ctrl).markAsTouched();
  //       }
  //     });
  //     return;
  //   }
  //   this.tariffLoading = true;
  //   this.currentRouteIndex = routeIndex;
  //   this.currentCarrierIndex = carrierIndex;
  //   const routeCtrl = this.quoteRoutes.at(this.currentRouteIndex) as FormGroup;

  //   this.ngbModal.open(template,{
  //     size : 'lg',
  //     centered : true , 
  //     backdrop:'static'
  //   });

  //   const payload = {
  //     CompanyMasterSid : this.currentCompany.CompanyMasterSid,
  //     DepartmentMasterSid : routeForm.get('DepartmentMasterSid')?.value,
  //     PORSid : routeForm.get('PORSid')?.value,
  //     POLSid : routeForm.get('POLSid')?.value,
  //     PODSid : routeForm.get('PODSid')?.value,
  //     FPODSid : routeForm.get('FPODSid')?.value,
  //     CargoType : routeForm.get('CargoType')?.value,
  //     EffectiveDate : routeForm.get('effDate')?.value ? new Date(routeForm.get('effDate')?.value) : null,
  //     ExpiredDate : routeForm.get('expDate')?.value ? new Date(routeForm.get('expDate')?.value) : null,
  //     Carrier : carrierForm.get('CarrierMasterSid')?.value,
  //     IncoTerms : routeForm.get('ServiceLevel')?.value,
  //   }

  //   this.leadService.getTariffDetailsByQuote(payload).subscribe(
  //     (resp:any)=>{
  //       if(resp.status){
  //         const response : any[] = resp.data || [];
  //         const existingValue = routeForm.getRawValue();
  //         const existingTariffDetailId = (existingValue?.quoteCharges || []).map((ch)=> ch.TariffDetailSid)
  //         this.tariffDetails = response
  //           .filter(td => !existingTariffDetailId.includes(td.TariffDetailSid))
  //           .map((td:any)=>{
  //           const charge = this.getCharge(td.ChargeCode);
  //           let qtySourceField = this.findFieldForQty(charge.UnitQty);
  //           let qtyValue;
  //           if (typeof qtySourceField === 'string' && routeForm.get(qtySourceField) && qtySourceField !== '1') {
  //             qtyValue = routeForm.get(qtySourceField)?.value || 1;
  //           } else if (qtySourceField === '1') {
  //             qtyValue = qtySourceField;
  //           }
  //             return {
  //               ...td,
  //               ChargeDisplayName: charge?.chargeName,
  //               chargeCode: charge?.chargeCode,
  //               ChargeUomSid: charge?.ChargeMasterSid,
  //               Qty: Number(qtyValue) || 0,

  //               RevenueChargeUomSid: td?.UOMSid,
  //               RevenuePrepaidCollect: "Prepaid",
  //               RevenueCurrencyMasterSid: td?.SaleCurrency,
  //               RevenueRate: (Number(td?.SalePerUnitPrice) || 0).toFixed(this.digitsAfterDecimal),
  //               RevenueExchangeRate: (Number(td?.revenueExchangeRate) || 0).toFixed(this.digitsAfterDecimal),
  //               RevenueDrCr: "C",
  //               RevenueAmount: ((Number(qtyValue) || 0) * (Number(td?.SalePerUnitPrice) || 0)).toFixed(this.digitsAfterDecimal),
  //               RevenueLocalAmount: ((Number(td?.revenueExchangeRate) || 0) * (Number(qtyValue) || 0) * (Number(td?.SalePerUnitPrice) || 0)).toFixed(this.digitsAfterDecimal),

  //               CostChargeUomSid: td?.UOMSid,
  //               CostPrepaidCollect: "Prepaid",
  //               CostCurrencyMasterSid: td?.BuyCurrency,
  //               CostRate: (Number(td?.BuyPerUnitPrice) || 0).toFixed(this.digitsAfterDecimal),
  //               CostExchangeRate: (Number(td?.costExchangeRate) || 0).toFixed(this.digitsAfterDecimal),
  //               CostDrCr: "D",
  //               CostAmount: ((Number(qtyValue) || 0) * (Number(td?.BuyPerUnitPrice) || 0)).toFixed(this.digitsAfterDecimal),
  //               CostLocalAmount: ((Number(td?.costExchangeRate) || 0) * (Number(qtyValue) || 0) * (Number(td?.BuyPerUnitPrice) || 0)).toFixed(this.digitsAfterDecimal),
  //             };
  //         })
  //         console.log(this.tariffDetails);
  //         this.tariffLoading = false;
  //       } else {
  //         this.appSettingService.showError("Error loading Tariff Details");
  //         this.tariffLoading = false;
  //       }
  //     }
  //   )
  // }

  getTariffDetails(routeIndex: number, carrierIndex: number, template: TemplateRef<any>) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;

    if (!this.hasEveryRequiredFieldsFilled(routeIndex)) {
      this.appSettingService.showWarning("Please fill all the required fields to get tariff details.");
      this.requiredFieldsToGetTariff.forEach(ctrl => {
        if (routeForm.get(ctrl)) {
          routeForm.get(ctrl).markAsTouched();
        }
      });
      return;
    }
    
    this.tariffLoading = true;
    this.currentRouteIndex = routeIndex;
    this.currentCarrierIndex = carrierIndex;

    this.ngbModal.open(template, { size: 'lg', centered: true, backdrop: 'static' });

    const payload = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      DepartmentMasterSid: routeForm.get('DepartmentMasterSid')?.value,
      PORSid: routeForm.get('PORSid')?.value,
      POLSid: routeForm.get('POLSid')?.value,
      PODSid: routeForm.get('PODSid')?.value,
      FPODSid: routeForm.get('FPODSid')?.value,
      CargoType: routeForm.get('CargoType')?.value,
      EffectiveDate: routeForm.get('effDate')?.value ? new Date(routeForm.get('effDate')?.value) : null,
      ExpiredDate: routeForm.get('expDate')?.value ? new Date(routeForm.get('expDate')?.value) : null,
      Carrier: carrierForm.get('CarrierMasterSid')?.value,
      IncoTerms: routeForm.get('ServiceLevel')?.value,
    };

    this.leadService.getTariffDetailsByQuote(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          const response: any[] = resp.data || [];
          const existingCharges = (routeForm.getRawValue().quoteCarriers[carrierIndex]?.quoteCharges || []);
          const existingTariffDetailId = existingCharges.map((ch: any) => ch.TariffDetailSid);

          this.tariffDetails = response
            .filter(td => !existingTariffDetailId.includes(td.TariffDetailSid))
            .map((td: any) => {
              const charge = this.getCharge(td.ChargeCode);
              let qtySourceField = this.findFieldForQty(charge.UnitQty);
              let qtyValue = 1; // Default to 1

              if (typeof qtySourceField === 'string' && routeForm.get(qtySourceField)) {
                qtyValue = routeForm.get(qtySourceField)?.value || 1;
              } else if (typeof qtySourceField === 'number') {
                qtyValue = qtySourceField;
              }
              
              const revenueAmount = (Number(qtyValue) || 1) * (Number(td?.SalePerUnitPrice) || 0);
              const costAmount = (Number(qtyValue) || 1) * (Number(td?.BuyPerUnitPrice) || 0);

              return {
                ...td,
                selected: true, // <-- Property for checkbox binding
                ChargeDisplayName: charge?.chargeName,
                chargeCode: charge?.chargeCode,
                ChargeUomSid: charge?.ChargeMasterSid,
                Qty: Number(qtyValue) || 1,
                
                RevenueChargeUomSid: td?.UOMSid,
                RevenuePrepaidCollect: "Prepaid",
                RevenueCurrencyMasterSid: td?.SaleCurrency,
                RevenueRate: (Number(td?.SalePerUnitPrice) || 0).toFixed(this.digitsAfterDecimal),
                RevenueExchangeRate: (Number(td?.revenueExchangeRate) || 0).toFixed(this.digitsAfterDecimal),
                RevenueDrCr: "C",
                RevenueAmount: revenueAmount.toFixed(this.digitsAfterDecimal),
                RevenueLocalAmount: (revenueAmount * (Number(td?.revenueExchangeRate) || 0)).toFixed(this.digitsAfterDecimal),

                CostChargeUomSid: td?.UOMSid,
                CostPrepaidCollect: "Prepaid",
                CostCurrencyMasterSid: td?.BuyCurrency,
                CostRate: (Number(td?.BuyPerUnitPrice) || 0).toFixed(this.digitsAfterDecimal),
                CostExchangeRate: (Number(td?.costExchangeRate) || 0).toFixed(this.digitsAfterDecimal),
                CostDrCr: "D",
                CostAmount: costAmount.toFixed(this.digitsAfterDecimal),
                CostLocalAmount: (costAmount * (Number(td?.costExchangeRate) || 0)).toFixed(this.digitsAfterDecimal),
              };
            });
          this.tariffLoading = false;
        } else {
          this.appSettingService.showError("Error loading Tariff Details");
          this.tariffLoading = false;
        }
      }
    );
  }

  getCharge(chargeCode){
    if(!chargeCode || !this.chargeMaster || this.chargeMaster.length === 0){
      return {};
    }
    const charge = this.chargeMaster.find(ch => ch.chargeCode === chargeCode);
    return charge;
  }

  isFormValidExcept(form: FormGroup, exceptControlName: string): boolean {
    return Object.entries(form.controls)
      .filter(([name]) => name !== exceptControlName)
      .every(([_, control]) => {
        if (control.validator) {
          const errors = control.validator(control);
          return errors === null;
        }
        return true;
      });
  }


  closeTariffModal(){
    this.currentRouteIndex = undefined;
    this.tariffDetails = [];
    this.ngbModal.dismissAll();
  }

  // applyTariff(tariffData:any){
    
  //   const isEmpty = this.checkIfLastChargeEmpty(this.currentRouteIndex,this.currentCarrierIndex);
  //   let chargeIndex;
  //   if(isEmpty){
  //     chargeIndex = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).length - 1;
  //     const chargeForm = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).at(chargeIndex) as FormGroup;
  //     chargeForm.patchValue({
  //       ...tariffData
  //     })
  //     chargeForm.updateValueAndValidity();
  //   } else {
  //     this.addQuoteCharge(this.currentRouteIndex,this.currentCarrierIndex,tariffData);
  //     chargeIndex = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).length - 1;
  //   }
  //   const customerId = this.quotationForm.get('CustomerMasterSid')?.value;
  //   const customer = this.customers.find(c => c.CustomerMasterSid === customerId);
  //   if (customer) {
  //     this.handleCustomerChangeOnCharges(customer);
  //   }
  //   this.closeTariffModal();
  // }

  applySelectedTariffs(): void {
    const selectedTariffs = this.tariffDetails.filter(tariff => tariff.selected);

    if (selectedTariffs.length === 0) {
      this.appSettingService.showWarning('Please select at least one tariff to apply.');
      return;
    }

    selectedTariffs.forEach(tariffData => {
      const isEmpty = this.checkIfLastChargeEmpty(this.currentRouteIndex, this.currentCarrierIndex);
      let chargeIndex;

      if (isEmpty) {
        chargeIndex = this.quoteCharges(this.currentRouteIndex, this.currentCarrierIndex).length - 1;
        const chargeForm = this.quoteCharges(this.currentRouteIndex, this.currentCarrierIndex).at(chargeIndex) as FormGroup;
        chargeForm.patchValue({ ...tariffData });
        chargeForm.updateValueAndValidity();
      } else {
        this.addQuoteCharge(this.currentRouteIndex, this.currentCarrierIndex, tariffData);
        chargeIndex = this.quoteCharges(this.currentRouteIndex, this.currentCarrierIndex).length - 1;
      }
      
      // After adding/patching, run necessary updates for the new charge
      this.updateSingleChargeQty(this.currentRouteIndex, this.currentCarrierIndex, chargeIndex);
      this.fetchExchangeRate(this.currentRouteIndex, this.currentCarrierIndex, chargeIndex, 'revenue');
      this.fetchExchangeRate(this.currentRouteIndex, this.currentCarrierIndex, chargeIndex, 'cost');
    });

    const customerId = this.quotationForm.get('CustomerMasterSid')?.value;
    const customer = this.customers.find(c => c.CustomerMasterSid === customerId);
    if (customer) {
      this.handleCustomerChangeOnCharges(customer);
    }

    this.closeTariffModal();
  }

  areAllTariffsSelected(): boolean {
    if (!this.tariffDetails || this.tariffDetails.length === 0) {
      return false;
    }
    return this.tariffDetails.every(td => td.selected);
  }

  toggleSelectAllTariffs(event: any): void {
    const checked = event.target.checked;
    if (this.tariffDetails) {
      this.tariffDetails.forEach(td => td.selected = checked);
    }
  }

  getUOMCode(UOMMasterSid:number){
    if(!UOMMasterSid){
      return '';
    }
    return (this.chargeUnitMaster.find(uom => uom.UOMMasterSid === UOMMasterSid))?.UOMCode;
  }

  checkIfLastChargeEmpty(routeIndex,carrierIndex) {
    const chargeLen = this.quoteCharges(routeIndex,carrierIndex).length - 1;
    const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeLen) as FormGroup;
    const rawValue = chargeForm.getRawValue();
    console.log(rawValue);

    const keyHasDefaultValue = {
      "Qty" : 1,
      "RevenuePrepaidCollect" : "Prepaid",
      "RevenueDrCr" : "C",
      "CostPrepaidCollect" : "Prepaid",
      "CostDrCr" : "D",
    }

    const hasDefaultValue = (key:string) => {
      return Object.keys(keyHasDefaultValue).includes(key)
    }

   const isEmpty =  Object.entries(rawValue).every(([key, value]) => {
      let result:boolean;
      if(hasDefaultValue(key)){
        result = keyHasDefaultValue[key] === value;
      } else {
        result = value === null || value === undefined || value === '' || value === 0;
      }

      console.log(key,value,result);
      return result;
      
    });
    console.log("isEmpty",isEmpty);
    return isEmpty;
  }


  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  navigateToBooking(){
    this.router.navigate(['operation/booking/entry'])
  }

  showInfo() {
    if (!this.quotationData) return;
    const modalRef = this.ngbModal.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.quotationData;
    modalRef.componentInstance.idLabel = 'Quotation Id';
    modalRef.componentInstance.idValue = this.quotationData?.QuoteHeaderSid;
  }

  openFollowup() {
    if (!this.quotationData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.quotationData?.QuoteHeaderSid;
    modalRef.componentInstance.parentEmail = this.quotationData.Email;
    modalRef.componentInstance.parentSubject = `Quotation No.${this.quotationData.QuoteNumber} Date:${new Date(this.quotationData.QuoteDate).toLocaleDateString()}`;
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

 openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    if (!this.currentMenuId) {
        this.appSettingService.showError('Error: Menu ID not found.');
        return;
    }

    const payload = { MenuMasterSid: this.currentMenuId };

    const sub = this.loadTandC(payload).subscribe((termsData: any[]) => {
      if (termsData && termsData.length > 0) {
        this.TandCList = termsData;
        const modalRef = this.ngbModal.open(TermsAndConditionsComponent, {
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });
        
        modalRef.componentInstance.terms = this.TandCList;
        modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modalRef.componentInstance.DocumentSid = this.QuoteHeaderSid;
      } else {
        console.warn('No Terms and Conditions data found to display.');
      }
    });

    this.subscription.add(sub);
  }

  loadTandC(payload: { MenuMasterSid: number }): Observable<any[]> {
    return this.leadService.getTandCByCondition(payload).pipe(
      map((resp: any) => {
        if (resp && resp.status) {
          return resp.data;
        }
        this.appSettingService.showError('Failed to load Terms and Conditions: Invalid response');
        return [];
      }),
      catchError((error) => {
        this.appSettingService.showError('Error loading Terms and Conditions');
        return of([]);
      })
    );
  }

  async openEmail() {
    if (!this.quotationData) return;
    if(!this.quotationApproved){
      this.appSettingService.showWarning("Please approve the quotation before sending email");
      return;
    }

    try {
      this.spinner.show();

      await new Promise(resolve => setTimeout(resolve, 100));
      // Generate PDF blob automatically
          const pdfBlob = await this.generatePDFBlob();
    const pdfFileName = (this.quotationData?.QuotationNumber || 'quotation') + '.pdf';
    const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
    await new Promise(resolve => setTimeout(resolve, 100));

    const modalRef = this.ngbModal.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    const toEmailSet = new Set<string>();
    toEmailSet.add(this.selectedItem.Email);

    const toEmail = Array.from(toEmailSet);
    const ccEmail = [this.userData['userEmail']];

    const POL = this.selectedItem?.quoteRoute[0]?.POLSid;
    const POD =  this.selectedItem?.quoteRoute[0]?.PODSid;
    const FPD =  this.selectedItem?.quoteRoute[0]?.FPODSid;
    const formattedPOL = this.getFormattedPort(POL);
    const formattedPOD = this.getFormattedPort(POD);
    const formattedFPD = this.getFormattedPort(FPD);

    const subject = `Quotation No.${this.quotationData?.QuoteNumber} Date: ${this.datePipe.transform(this.quotationData?.QuoteDate)} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`;

    const mailBody = `Dear Sir/Madam,
Please find enclosed the quotation as requested.
Kindly review the details at your convenience.
Looking forward to your feedback and the opportunity to work together.
Approval Hyper link https://xxxxxxxxx
Best Regards,
${this.userData.userName}`;
    
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
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.ngbModal.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.QuoteHeaderSid;
  }

  openEDoc() {
  }

  logFormValue() {
    console.log(this.quotationForm.value)
  }

  back() {
    this.router.navigate(['crm/quotation/list']);
  }
  resetForm() {
  // If editing an existing quotation, reload it from the server to restore original values
  if (this.isEditMode && this.QuoteHeaderSid) {
    this.loadQuotation(this.QuoteHeaderSid);
    return;
  }

  // Reset header-level fields only
  this.quotationForm.reset({
    CustomerMasterSid: null,
    CustomerRef: '',
    Email: '',
    status: 'Active',
    SalesmanSid: null,
    CustomerName: '',
    CustomerAddress: '',
    QuoteNumber: '',
    QuoteDate: null,
    EnquirySid: ''
  });

  // Clear any cached or derived UI state related to routes/charges
  this.quoteRoutes.clear();
  this.filteredUnits = [];
  this.filteredPOLPorts = [];
  this.filteredPODPorts = [];
  this.tariffDetails = [];
  this.enquiryNumber = '';

  // Re-create a single empty route (same as component init)
  this.addQuoteRoute();

  // Ensure the same controls are disabled as on init
  this.quotationForm.get('EnquirySid')?.disable();
  this.f['status']?.disable();

  // If you had flags that disable edits after approval, reset them
  this.disableAllModification = false;
  this.authStateCache = 'Pending';

  // run change detection if needed (optional)
  try { (this as any).cdRef?.detectChanges(); } catch (e) { /* ignore if cdRef not available */ }
}

  openAuditLogs(modal: TemplateRef<any>) {
  if (!this.QuoteHeaderSid) return;

  this.leadService.getAuditLogsQuotation('QuoteHeader', this.QuoteHeaderSid.toString()).subscribe({
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

      this.auditLogModalRef = this.ngbModal.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}

  // patchRevenueExchangeRate(routeIndex,carrierIndex, chargeIndex) {
  //   const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
  //   const revCurrencyMasterSid = chargeForm.get('RevenueCurrencyMasterSid');
  //   const revenueExchangeRate = chargeForm.get('RevenueExchangeRate');
  //   const userCompany = (this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany.CompanyMasterSid);
  //   const fromCurrency = revCurrencyMasterSid.value;
  //   const toCurrency = userCompany.companyMaster.CurrencyMasterSid;
  //   const fromCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode;
  //   const toCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;
  //   const payload = {
  //     fromCurrencyCode: fromCurrencyCode,
  //     toCurrencyCode: toCurrencyCode
  //   }
  //   if (fromCurrencyCode && toCurrencyCode) {
  //     this.leadService.getExchangeRate(payload).subscribe(
  //       (resp: any) => {
  //         if (resp.status) {
  //           const exchangeRate = resp.data;
  //           revenueExchangeRate.setValue(exchangeRate);
  //         } else {
  //           revenueExchangeRate?.setValue('');
  //         }
  //       }
  //     )
  //   } else {
  //     revenueExchangeRate?.setValue('');
  //   }
  //   revenueExchangeRate?.updateValueAndValidity();
  // }

  // patchCostExchangeRate(routeIndex,carrierIndex, chargeIndex) {
  //   const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
  //   const costCurrencyMasterSid = chargeForm.get('CostCurrencyMasterSid');
  //   const costExchangeRate = chargeForm.get('CostExchangeRate');
  //   const userCompany = (this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany.CompanyMasterSid);
  //   const fromCurrency = costCurrencyMasterSid.value;
  //   const toCurrency = userCompany.companyMaster.CurrencyMasterSid;
  //   console.log(fromCurrency, toCurrency);
  //   const fromCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode;
  //   const toCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;
  //   const payload = {
  //     fromCurrencyCode: fromCurrencyCode,
  //     toCurrencyCode: toCurrencyCode
  //   }
  //   console.log(payload);
  //   if (fromCurrencyCode && toCurrencyCode) {
  //     this.leadService.getExchangeRate(payload).subscribe(
  //       (resp: any) => {
  //         if (resp.status) {
  //           const exchangeRate = resp.data;
  //           costExchangeRate.setValue(exchangeRate);
  //         } else {
  //           costExchangeRate?.setValue('');
  //         }
  //       }
  //     )
  //   } else {
  //     costExchangeRate?.setValue('');
  //   }
  //   costExchangeRate?.updateValueAndValidity();
  // }

  handleCalculation(routeIndex:number){
    const routeCtrl = this.quoteRoutes.at(routeIndex) as FormGroup;
    const productFormArr = this.quoteProducts(routeIndex);
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalVolume = 0;
    let totalChargeableWeight = 0;
    if (productFormArr.length === 0) {
      routeCtrl.get('GrossWeight')?.enable();
      routeCtrl.get('NetWeight')?.enable()
      routeCtrl.get('Volume')?.enable();
      routeCtrl.get('ChargeableWeight')?.enable();
      return;
    }
    productFormArr.controls.forEach((productForm:FormGroup)=>{
      totalGrossWeight += Number(productForm.get('GrossWeight')?.value) || 0;
      totalNetWeight += Number(productForm.get('NetWeight')?.value) || 0;
      totalVolume += Number(productForm.get('Volume')?.value) || 0;
      totalChargeableWeight += ((Number(productForm.get('Length')?.value) || 0 ) * (Number(productForm.get('Width')?.value) || 0) * (Number(productForm.get('Height')?.value) || 0)/6000) * Number(productForm.get('ExternalQty')?.value) || 0;
    });
    routeCtrl.get('GrossWeight')?.setValue(totalGrossWeight);
    routeCtrl.get('NetWeight')?.setValue(totalNetWeight);
    routeCtrl.get('Volume')?.setValue(totalVolume);
    routeCtrl.get('ChargeableWeight')?.setValue(totalChargeableWeight);
    routeCtrl.get('GrossWeight')?.updateValueAndValidity();

    routeCtrl.get('GrossWeight')?.disable();
    routeCtrl.get('NetWeight')?.disable()
    routeCtrl.get('Volume')?.disable();
    routeCtrl.get('ChargeableWeight')?.disable();

    this.updateAllChargeQuantitiesForRoute(routeIndex);
  }

  getRouteInfo(routeIndex : number){
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    const POL = routeForm.get('POLSid')?.value;
    const POD = routeForm.get('PODSid')?.value;
    const FPOD = routeForm.get('FPODSid')?.value;
    const portArray : String[] = [];
    const POLName = this.ports.find(p => p.PortMasterSid === POL)?.PortCode;
    const PODName = this.ports.find(p => p.PortMasterSid === POD)?.PortCode;
    const FPODName = this.ports.find(p => p.PortMasterSid === FPOD)?.PortCode;
    if(POLName && PODName){
      portArray.push(POLName);
      portArray.push(PODName);
      const isEqual = PODName === FPODName;
      if(!isEqual && FPODName){
        portArray.push(FPODName);
      }
      return portArray.join(' - ');
    } else {
      return 'Route Details'
    }
  }


  handleCustomerChangeOnCharges(customer:any){
    this.quoteRoutes.controls.forEach((route:FormGroup,routeIndex:number)=>{
      const carrierArr = this.quoteCarriers(routeIndex);
      console.log(carrierArr);
      carrierArr.controls.forEach((carrier:FormGroup,carrierIndex:number)=>{
        const chargeArr = this.quoteCharges(routeIndex,carrierIndex);
        chargeArr.controls.forEach((charge:FormGroup,chargeIndex:number)=>{
          const revCusControl = charge.get('RevenueCustomerMasterSid');
          if (customer) {
            if (!revCusControl.value) {
              revCusControl.setValue(customer.CustomerMasterSid);
            }
          } else {
            revCusControl.setValue(null);
          }
        });
      })
    })
  }

  findFieldForQty(UnitQty:string){
    const trimmedUnitQty = UnitQty.trim();
    switch(trimmedUnitQty){
      case 'GrossWeight':
        return 'GrossWeight';
      case 'CBM':
        return 'Volume';
      case '20ft':
        return 'Qty';
      case '40ft':
        return 'Qty';
      case 'ChargeableWeight':
        return 'ChargeableWeight';
      case 'BL':
        return '1';
      case 'Shipment':
        return '1';
      default:
        return '1';
    }
  }

  statusMapBasedOnAuthLevel = new Map<string, string>([
    ['1', 'WaitingForFinalApproval'],
    ['2', 'WaitingForCustomerApproval'],
    ['C', 'Approved'],
  ]);

  statusMap = new Map<string, string>([
    ['Pending', 'Waiting for Approval'],
    ['Approved', 'Approved'],
    ['Rejected', 'Rejected']
  ]);

  onInternalApprovalStatusChange(status: any) {
    this.approvalDropdownValue = status;
    this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
      const carrierArr = this.quoteCarriers(routeIndex);
      carrierArr.controls.forEach((carrier: FormGroup) => {
        carrier.get('authorizerStatus')?.setValue(status);
      })
    })
  }

  onCustomerApprovalStatusChange(routeIndex:number,carrierIndex:number,status: any) {
    console.log(status);
    this.quoteRoutes.controls.forEach((route: FormGroup, rIndex: number) => {
      const carrierArr = this.quoteCarriers(routeIndex);
      carrierArr.controls.forEach((carrier: FormGroup,cIndex:number) => {
        if (status.value === "Approved") {
          if (routeIndex === rIndex && carrierIndex === cIndex) {
            carrier.get('authorizerStatus')?.setValue(status.value);
          } else {
            carrier.get('authorizerStatus')?.setValue("Rejected");
          }
        } else if (status?.value === "Counter") {
          if (routeIndex === rIndex && carrierIndex === cIndex) {
            carrier.get('authorizerStatus')?.setValue(status.value);
          } else {
            carrier.get('authorizerStatus')?.setValue("Pending");
          }
        } else {
          carrier.get('authorizerStatus')?.setValue(status.value);
        }
      });
    })
  }

  getStatusName(statusValue) {
    const statusObject = this.approvalStatus.find(status => status.value === statusValue);
    return statusObject ? statusObject.name : null;
  }

  getAuthorityStatusForCarrier(routeIndex:number,carrierIndex:number){
    const carrier = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
    const currentStatus = carrier.get('authorizerStatus')?.value
    const currentStatusName = this.getStatusName(currentStatus);
    return  currentStatusName || '';
  }

  isRequiredInQuoteCarrier(routeIndex:number,carrierIndex:number,ctrl:string){
    const carrier = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
    const control = carrier.get(ctrl);
    return control ? control.hasValidator(Validators.required) : false;
  }

  navigateToCustomers(){
    this.router.navigate(['master/organization/entry', this.createdCustomerId]);
    this.ngbModal.dismissAll();
  }

  onClosingCustomerModal(){
    this.createdCustomerId = null;
    this.loadQuotation(this.QuoteHeaderSid);
    this.ngbModal.dismissAll();
  }

  getFormattedPort(PortMasterSid) {
    if (!PortMasterSid || PortMasterSid === undefined || this.ports.length === 0) {
      return '';
    }
    const ourPort = this.ports.find(p => p.PortMasterSid === PortMasterSid);
    return ourPort ? `${ourPort.PortName} (${ourPort.PortCode})` : '';
  }

  getUOMCodeById(id:number){
    if(!id){
      return '';
    } else {
      const uom = this.chargeUnitMaster.find(c => c.UOMMasterSid === id);
      return uom ? uom.UOMCode : '';
    }
  }

  reportAndEmailModel(content: TemplateRef<any>) {
    this.ngbModal.open(content, {
      size: 'xl', // or omit this to avoid interference
      scrollable: false,
      windowClass: 'custom-wide-modal'
    });
  }


  async sendEmail() {
    try {
      this.isLoading = true;

      const pdfBlob = await this.generatePDFBlob();

      const formData = new FormData();
      const toEmailSet = new Set<string>();

      if (this.selectedItem?.Email) {
        // toEmailSet.add(this.selectedItem.Email);
        toEmailSet.add('jdhineshjaisankar@gmail.com');
      }

      if (toEmailSet.size === 0 && this.selectedItem?.CustomerBranchSid) {
        const resp: any = await firstValueFrom(
          this.leadService.getCustomerBranchEmail(this.selectedItem.CustomerBranchSid)
        );

        if (resp?.status && resp.data?.Email) {
          toEmailSet.add(resp.data.Email);
        }
      }

      if (toEmailSet.size === 0) {
        this.appSettingService.showError('To Email is missing.')
        this.isLoading = false;
        return;
      }

      const toEmail = Array.from(toEmailSet);
      toEmail.forEach(email => {
        if (email) {
          formData.append("EmailTo[]", email);
        }
      });

      const ccEmailSet = new Set<string>([this.userData['userEmail']]);
      const ccEmail = Array.from(ccEmailSet);

      ccEmail.forEach(email => {
        if (email) {
          formData.append("EmailCC[]", email);
        }
      });
      formData.append('Subject', `Quotation No.${this.selectedItem.QuoteNumber} Date:${new Date(this.selectedItem.QuoteDate)} ${this.getFormattedPort(this.selectedItem.quoteRoute[0].POLSid)} - ${this.getFormattedPort(this.selectedItem.quoteRoute[0].PODSid)}`);
      formData.append('Mailbody', `
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
      `);
      formData.append('file', pdfBlob, (this.selectedItem?.QuotationName || 'quotation') + '.pdf');

      console.log(formData)
      this.leadService.quotationReport(formData).subscribe((resp: any) => {
        this.isLoading = false;
        if (resp?.data) {
          this.toastr.success('Report Email Sent successfully!');
        }
      }, error => {
        this.isLoading = false;
        this.toastr.error('Failed to send email.');
      });

    } catch (err) {
      this.isLoading = false;
      console.error('PDF generation error:', err);
      this.toastr.error('Error generating PDF.');
    }
  }

  downloadPDF() {
    const element = document.getElementById('pdfContent');
  
    if (!element) {
      console.error('No element found');
      return;
    }
  
    const opt = {
      margin: 0.5,
      filename: (this.selectedItem?.QuotationName || 'quotation') + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
  
    html2pdf().from(element).set(opt).save(); // ✅ this triggers download
  }

  generatePDFBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const element = document.getElementById('pdfContent');

      const opt = {
        margin: 0.5,
        filename: (this.selectedItem?.QuotationName || 'quotation') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      if (!element) return reject('No element found');

      html2pdf().from(element).set(opt).outputPdf('blob')
        .then((blob: Blob) => resolve(blob))
        .catch((err: any) => reject(err));
    });
  }

  getChargeUOMCodeById(UOMMasterSid) {
    if(!UOMMasterSid || this.chargeUnitMaster.length === 0){
      return '';
    } else {
      return (this.chargeUnitMaster.find(uom => uom.UOMMasterSid === UOMMasterSid))?.UOMCode || 'N/A';
    }
  }

  getCurrencyCodeById(CurrencyMasterSid) {
    if(!CurrencyMasterSid || this.currencyMaster.length === 0){
      return '';
    } else {
      return (this.currencyMaster.find(curr => curr.CurrencyMasterSid === CurrencyMasterSid))?.currencyCode || 'N/A';
    }
  }

  //  goForBookingCreation() {
  //   console.log(this.selectedItem, 'this.selectedItem');

  //   // TODO : need to fix this after completion of Authorization
  //   // const approvedRoute = (QuoteData.quoteRoute || []).find(route =>
  //   //   route.quoteCarrier.some(carrier => carrier.ApprovalStatus === "A")
  //   // ) || {};
  //   const approvedRoute = selectedItem.quoteRoute[0] || [];
  //   const POO = this.ports.find(port => port.PortMasterSid === approvedRoute.PORSid);
  //   const POL = this.ports.find(port => port.PortMasterSid === approvedRoute.POLSid);
  //   const POD = this.ports.find(port => port.PortMasterSid === approvedRoute.PODSid);
  //   const FPD = this.ports.find(port => port.PortMasterSid === approvedRoute.FDPSid);


  //   // TODO : need to fix this after completion of Authorization
  //   // const approvedCarrier = (approvedRoute?.quoteCarrier || []).find(
  //   //   carrier => carrier.ApprovalStatus === "A"
  //   // ) || {};
  //   const approvedCarrier = approvedRoute?.quoteCarrier?.[0] || {};

  //   const cargo = approvedRoute?.quoteCargo?.[0] || {};

  //   const data = {
  //     quotation: true,
  //     DepartmentMasterSid: approvedRoute.DepartmentMasterSid || null,
  //     CustomerMasterSid: QuoteData.CustomerMasterSid || null,
  //     CustomerBranchSid: QuoteData.CustomerBranchSid || null,
  //     CustomerName: QuoteData.CustomerName || "",
  //     CustomerAddress: QuoteData.CustomerAddress || "",
  //     SalesmanSid: QuoteData.SalesmanSid || null,
  //     FreightTerms: QuoteData.FreightPPCC || "",
  //     QuotationHeaderSid: QuoteData.QuoteHeaderSid || null,
  //     CarrierName: approvedCarrier?.CarrierName || "",

  //     POO: POO?.PortCode || null,
  //     POL: POL?.PortCode || null,
  //     POD: POD?.PortCode || null,
  //     FPD: FPD?.PortCode || null,

  //     bookingCargo: cargo ? [
  //       {
  //         CargoType: cargo.CargoType,
  //         GrossWeight: cargo.GrossWeight,
  //         NetWeight: cargo.NetWeight,
  //         Volume: cargo.Volume,
  //         ChargeableWeight: cargo.ChargeableWeight,
  //         ContainerType: cargo.ContainerType,
  //         NoofContainers: cargo.Qty,
  //       }
  //     ] : [],

  //     bookingProduct: (cargo?.quoteProduct || []).map(product => ({
  //       ProductName: product.ProductName,
  //       ExternaPkg: product.ExternalPkg,
  //       ExternlQty: product.ExternalQty,
  //       GrossWeight: product.GrossWeight,
  //       NetWeight: product.NetWeight,
  //       Volume: product.Volume,
  //       IsHaz: product.IsHaz,
  //       ImcoClass: product.ImcoClass,
  //       UnNo: product.UnNo,
  //       PkgGroup: product.PkgGroup,
  //       Length: product.Length,
  //       Width: product.Width,
  //       Height: product.Height,
  //       UomMasterSid: product.UomMasterSid,
  //     })),

  //     bookingRates: (approvedCarrier?.quoteCharge || []).map((charge, index) => ({
  //       CompanyMasterSid: charge.CompanyMasterSid,
  //       BranchMasterSid: charge.BranchMasterSid,
  //       SerialNumber: index + 1,
  //       ChargeMasterSid: charge.ChargeUomSid, 
  //       ChargeDescription: charge.ChargeDisplayName,
  //       NoOfUnit: charge.Qty,

  //       CostChargeUomSid: charge.CostChargeUomSid,
  //       CostPrepaidCollect: charge.CostPrepaidCollect,
  //       CostDrCr: charge.CostDrCr,
  //       CostCurrencyMasterSid: charge.CostCurrencyMasterSid,
  //       CostExchangeRate: charge.CostExchangeRate,
  //       CostRate: charge.CostRate,
  //       CostAmount: charge.CostAmount,
  //       CostLocalAmount: charge.CostLocalAmount,

  //       RevenueChargeUomSid: charge.RevenueChargeUomSid,
  //       RevenuePrepaidCollect: charge.RevenuePrepaidCollect,
  //       RevenueDrCr: charge.RevenueDrCr,
  //       RevenueCurrencyMasterSid: charge.RevenueCurrencyMasterSid,
  //       RevenueExchangeRate: charge.RevenueExchangeRate,
  //       RevenueRate: charge.RevenueRate,
  //       RevenueAmount: charge.RevenueAmount,
  //       RevenueLocalAmount: charge.RevenueLocalAmount,
  //     }))
  //   };

  //   this.route.navigate(['operation/booking/entry'], {
  //     state: {
  //       dataFromQuotation: data
  //     }
  //   });
  // }

  filterChargesBySegment(routeIndex: number, segment: 'LCL' | 'FCL' | 'AIR'): void {
    const routeDeptId = this.quoteRoutes.at(routeIndex)?.get('DepartmentMasterSid')?.value;

    this.filteredCharges = (this.chargeMaster || []).filter(charge => {
      const departmentNames = charge.DepartmentMasterSid || []; 

      const fullDepartments = departmentNames
        .map(name => this.departments.find(dept => dept.departmentName === name))
        .filter((dept): dept is any => Boolean(dept)); 

      return fullDepartments.some(dept => {
        if (!dept) return false;
        return dept.DepartmentMasterSid === routeDeptId
      });
    });
    console.log("Filtered Charges",this.filteredCharges);
  }



  fetchExchangeRate(routeIndex : number ,carrierIndex : number , chargeIndex : number,revenueOrCost: 'cost' | 'revenue') {
    const chargeGroup = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    // Take TO currency from userData
    const currentCompanyID = this.currentCompany?.CompanyMasterSid;
    const currentCompany = (this.userData.userCompanyMaster || []).find(ucom => ucom.CompanyMasterSid === currentCompanyID);
    const toCurrency = currentCompany?.companyMaster.CurrencyMasterSid;

    // Take FROM currency from charge
    let fromCurrency;
    let segment;
    let destExRateCtrl;
    if (revenueOrCost === 'cost') {
      fromCurrency = chargeGroup.get('CostCurrencyMasterSid')?.value;
      segment = 'cost'
      destExRateCtrl = chargeGroup.get('CostExchangeRate');
    } else {
      fromCurrency = chargeGroup.get('RevenueCurrencyMasterSid')?.value;
      segment = 'revenue'
      destExRateCtrl = chargeGroup.get('RevenueExchangeRate');
    }

    const fromCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode;
    const toCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;

    if(fromCurrency === toCurrency){
      destExRateCtrl.setValue(1);
      return;
    }
    
    if(fromCurrencyCode && toCurrencyCode && segment){
      const payload = {
        fromCurrencyCode: fromCurrencyCode,
        toCurrencyCode: toCurrencyCode,
        segment: segment
      }
      this.subscription.add(
        this.leadService.getExchangeRate(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              const exchangeRate = resp.data;
              destExRateCtrl.setValue(exchangeRate);
            } else {
              destExRateCtrl?.setValue('');
            }
          },
          (error) => {
            this.appSettingService.showError('Error fetching exchange rate: ' + error.message);
          }
        )
      )
    }

  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


  goForBookingCreation() {
    console.log(this.selectedItem, 'this.selectedItem');
    let QuoteData = this.selectedItem;

    // TODO : need to fix this after completion of Authorization
    // const approvedRoute = (QuoteData.quoteRoute || []).find(route =>
    //   route.quoteCarrier.some(carrier => carrier.ApprovalStatus === "A")
    // ) || {};
    const approvedRoute = this.selectedItem.quoteRoute[0] || [];
    const POO = this.ports.find(port => port.PortMasterSid === approvedRoute.PORSid);
    const POL = this.ports.find(port => port.PortMasterSid === approvedRoute.POLSid);
    const POD = this.ports.find(port => port.PortMasterSid === approvedRoute.PODSid);
    const FPD = this.ports.find(port => port.PortMasterSid === approvedRoute.FDPSid);
    
    
    // TODO : need to fix this after completion of Authorization
    // const approvedCarrier = (approvedRoute?.quoteCarrier || []).find(
      //   carrier => carrier.ApprovalStatus === "A"
    // ) || {};
    const approvedCarrier = approvedRoute?.quoteCarrier?.[0] || {};
    
    const cargo = approvedRoute?.quoteCargo?.[0] || {};
    const containerTypeId = this.containerTypeList.find(type => type.ContainerCode === cargo.ContainerType)?.ContainerTypeMasterSid;

    const data = {
      quotation: true,
      DepartmentMasterSid: approvedRoute.DepartmentMasterSid || null,
      CustomerMasterSid: QuoteData.CustomerMasterSid || null,
      CustomerBranchSid: QuoteData.CustomerBranchSid || null,
      CustomerName: QuoteData.CustomerName || "",
      CustomerAddress: QuoteData.CustomerAddress || "",
      SalesmanSid: QuoteData.SalesmanSid || null,
      FreightTerms: QuoteData.FreightPPCC || "",
      QuotationHeaderSid: QuoteData.QuoteHeaderSid || null,
      CarrierName: approvedCarrier?.CarrierName || "",
      status : 'A',

      POO: POO?.PortCode || null,
      POL: POL?.PortCode || null,
      POD: POD?.PortCode || null,
      FPD: FPD?.PortCode || null,

      bookingCargo: cargo ? [
        {
          CargoType: cargo.CargoType,
          GrossWeight: cargo.GrossWeight,
          NetWeight: cargo.NetWeight,
          Volume: cargo.Volume,
          ChargeableWeight: cargo.ChargeableWeight,
          ContainerType: containerTypeId,
          NoofContainers: cargo.Qty,
        }
      ] : [],

      bookingProduct: (cargo?.quoteProduct || []).map(product => ({
        ProductName: product.ProductName,
        ExternaPkg: product.ExternalPkg,
        ExternlQty: product.ExternalQty,
        GrossWeight: product.GrossWeight,
        NetWeight: product.NetWeight,
        Volume: product.Volume,
        IsHaz: product.IsHaz,
        ImcoClass: product.ImcoClass,
        UnNo: product.UnNo,
        PkgGroup: product.PkgGroup,
        Length: product.Length,
        Width: product.Width,
        Height: product.Height,
        UomMasterSid: product.UomMasterSid,
      })),

      bookingRates: (approvedCarrier?.quoteCharge || []).map((charge, index) => ({
        CompanyMasterSid: charge.CompanyMasterSid,
        BranchMasterSid: charge.BranchMasterSid,
        SerialNumber: index + 1,
        ChargeMasterSid: charge.ChargeUomSid, 
        ChargeDescription: charge.ChargeDisplayName,
        NoOfUnit: charge.Qty,

        CostChargeUomSid: charge.CostChargeUomSid,
        CostPrepaidCollect: charge.CostPrepaidCollect,
        CostDrCr: charge.CostDrCr,
        CostCurrencyMasterSid: charge.CostCurrencyMasterSid,
        CostExchangeRate: charge.CostExchangeRate,
        CostRate: charge.CostRate,
        CostAmount: charge.CostAmount,
        CostLocalAmount: charge.CostLocalAmount,

        RevenueChargeUomSid: charge.RevenueChargeUomSid,
        RevenuePrepaidCollect: charge.RevenuePrepaidCollect,
        RevenueDrCr: charge.RevenueDrCr,
        RevenueCurrencyMasterSid: charge.RevenueCurrencyMasterSid,
        RevenueExchangeRate: charge.RevenueExchangeRate,
        RevenueRate: charge.RevenueRate,
        RevenueAmount: charge.RevenueAmount,
        RevenueLocalAmount: charge.RevenueLocalAmount,
      }))
    };

    this.router.navigate(['operation/booking/entry'], {
      state: {
        dataFromQuotation: data
      }
    });
  }

  copyToCostUnit(routeIndex:number , carrierIndex:number , chargeIndex:number,unit){
    const ctrl = (this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup).get('CostChargeUomSid');
    if(!unit){
      ctrl.setValue(null);
    } else {
      ctrl.setValue(unit.UOMMasterSid);
    }
  }

  setOrResetValidationForCostAmount(routeIndex:number , carrierIndex:number , chargeIndex:number){
    const costAgent = (this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup).get('CostAgentMasterSid').value;
    const costRateCtrl = (this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup).get('CostRate');
    if(!costAgent){
      costRateCtrl.clearValidators();
    } else {
      costRateCtrl.setValidators([Validators.required]);
    }
    costRateCtrl.updateValueAndValidity();
  }

}

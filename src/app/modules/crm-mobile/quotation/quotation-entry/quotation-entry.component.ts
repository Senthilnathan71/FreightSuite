import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgbAccordionDirective } from '@ng-bootstrap/ng-bootstrap';
import { AbstractControl, Form, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, forkJoin, from, of, tap } from 'rxjs';
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
    SearchableDropdown
  ],
  templateUrl: './quotation-entry.component.html',
  styleUrl: './quotation-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class QuotationEntryComponent implements OnInit {


  // SECTION1 - VARIABLE DECLARATION

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
  currencyMaster: any[] = [];
  unitMaster: any[] = [];
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
  measurementUnitList : any[] = [];
  weightUnitList : any[] = [];
  
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

  approvalStatus = [
    { value : "Pending" , name :"Waiting for Approval"},
    { value : "Approved" , name :"Approved"},
    { value : "Rejected" , name : "Rejected"}
  ]

  tabs: string[] = ['Quotation', 'Route Details'];
  selectedTab = 'Quotation';
dataFromEnqPage:any;
  imcoList: any[] = [];
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
  // SECTION2 - CONSTRUCTOR
  constructor(
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private leadService: LeadService,
    private calendar: NgbCalendar,
    private modalService: ModalService,
    private ngbModal: NgbModal
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
            this.loadEnquiry(this.QuoteHeaderSid);
            this.checkAuthorisedPerson(this.userData?.UserMasterSid, this.QuoteHeaderSid);
          } else {
            this.minEffDate = this.todayDate;
            this.f['status']?.disable();
          }
        })
      }
    })
  }

patchEnqPageValues(enqData: any) { 
  // --- Header form setup ---------------------------------
  this.enquiryNumber = enqData?.EnquiryNumber;
  this.quoteRoutes.clear();

  const headerFields = [
    'EnquirySid',
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
      ContainerQty: Number(route?.ContainerQty) || 1,
      CBM: route?.CBM || 1,
      ChargeableWeight: route?.ChargeableWeight || cargoData?.GrossWeight || 0,
      effDate: new Date(),
      expDate: '', 
      TransitDays: route?.TransitDays || '',
      ServiceLevel: route?.ServiceLevel || null,
      POLFreeDays: route?.POLFreeDays || '',
      PODFreeDays: route?.PODFreeDays || '',
      authorizerStatus: route?.authorizerStatus || 'Pending',
      segmentType: segment
    };

    console.log('Processed route data:', routeData);

    // Add the route to the form
    this.addQuoteRoute(routeData);

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
    this.leadService.isUserAuthorizer(payload).subscribe(
      (resp: any) => {
        this.isAuthorizedUser = resp.data?.canAuthorize
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
    console.log(selectedItem);
    if (isCustomer) {
      this.quotationForm.patchValue({
        CustomerName: selectedItem.CustomerName,
        CustomerAddress: selectedItem.Address,
        Email: selectedItem.Email,
        CustomerBranchSid: selectedItem.CustomerBranchSid,
      });
    } else {
      this.quotationForm.patchValue({
        customerName: selectedItem.preCustomerName,
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
      POLFreeDays: [data?.POLFreeDays || ''],
      PODFreeDays: [data?.PODFreeDays || ''],
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
      GrossWeight: [data?.GrossWeight || 0],
      NetWeight: [data?.NetWeight || 0],
      Volume: [data?.Volume || 0],
      ChargeableWeight: [data?.ChargeableWeight || 0],
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
      authorizerStatus : [data?.authorizerStatus || 'Pending'],

      quoteCharges : this.fb.array([])
    })
    this.quoteCarriers(routeIndex).push(carrierForm);

    if(!data || data === undefined){
      this.addQuoteCharge(routeIndex,this.quoteCarriers(routeIndex).length - 1);
    }
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

      RevenueChargeUomSid: [data?.RevenueChargeUomSid || null, [Validators.required]],
      RevenuePrepaidCollect: [data?.RevenuePrepaidCollect || "Prepaid"],
      RevenueCurrencyMasterSid: [data?.RevenueCurrencyMasterSid || null, [Validators.required]],
      RevenueExchangeRate: [data?.RevenueExchangeRate || 0],
      RevenueRate: [data?.RevenueRate || 0],
      RevenueNumberOfUnit: [data?.RevenueNumberOfUnit || 0],
      RevenueDrCr: [data?.RevenueDrCr || "C"],
      RevenueAmount: [data?.RevenueAmount || 0],
      RevenueLocalAmount: [data?.RevenueLocalAmount || 0],
      RevenueCustomerMasterSid: [data?.RevenueCustomerMasterSid || null], // Revenue Vendor
      RevenueCustomerBranchSid: [data?.RevenueCustomerBranchSid || null],

      CostChargeUomSid : [data?.CostChargeUomSid || null, [Validators.required]],  // Cost Unit
      CostPrepaidCollect : [data?.CostPrepaidCollect || "Prepaid"],
      CostCurrencyMasterSid : [data?.CostCurrencyMasterSid || null, [Validators.required]], // Cost Currency
      CostExchangeRate : [data?.CostExchangeRate || 0], // Cost Exchange
      CostRate : [data?.CostRate || 0],    // Cost Per Unit Rate
      CostNumberOfUnit : [data?.CostNumberOfUnit || 0],  // Count
      CostDrCr : [data?.CostDrCr || "D"],
      CostAmount : [data?.CostAmount || 0],   // Cost Amount
      CostLocalAmount : [data?.CostLocalAmount || 0], // Cost Local Amount
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
      GrossWeight : [data?.GrossWeight || '' ],
      NetWeight : [data?.NetWeight || '' ],
      Volume : [data?.Volume || ''],
      Length : [data?.Length || ''],
      Width : [data?.Width || ''],
      Height : [data?.Height || ''],
      ProductUnit : [data?.ProductUnit || null],
      ChargeableWeight : [data?.ChargeableWeight || ''],
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
      units : this.leadService.getAllUOMs().pipe(catchError(err => of([]))),
      vendors: this.leadService.getAllVendorSupplier(CompanyMasterSid).pipe(catchError(err => of([]))),
      containerTypes: this.leadService.getAllContainerTypes().pipe(catchError(err => of([]))),
      packageTypes : this.leadService.getAllPackageTypeUOM().pipe(catchError(err => of([]))),
      products : this.leadService.getAllProducts(CompanyMasterSid).pipe(catchError(err => of([]))),
      imcos : this.leadService.getAllImco().pipe(catchError(err => of([]))),
      measurementUnits : this.leadService.getAllMeasurementUnit().pipe(catchError(err => of([]))),
      weightUnits : this.leadService.getAllWeightUnit().pipe(catchError(err => of([]))),
    }).pipe(tap(({ cargoTypes, carriers, leads, customers, departments, vendors, ports, incos, salesman, masters,units, containerTypes , packageTypes,products,imcos,measurementUnits,weightUnits }) => {
      this.packageTypes = cargoTypes || [];
      this.carriers = carriers || [];
      this.leadList = leads.data;
      this.customers = customers || [];
      this.departments = departments || [];
      this.ports = ports || [];
      this.chargeMaster = masters.charges || [];
      this.currencyMaster = masters.currencies || [];
      this.unitMaster = units.data || [];
      this.incoList = incos || [];
      this.salesmanList = salesman || [];
      this.containerTypeList = containerTypes || [],
      this.vendorSupplierList = vendors || [];
      this.packageTypes = packageTypes.data || [];
      this.productList = products || [];
      this.imcoList = imcos.data || [];
      this.measurementUnitList = measurementUnits.data || [];
      this.weightUnitList = weightUnits.data || [];
    })
    );
  }

  loadEnquiry(id): void {
    this.leadService.getQuoteById(id).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.patchValues(resp.data)
          this.quotationData = resp.data;
        } else {
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
  }

  onSubmit() {

    if (this.quoteRoutes.invalid) {
      this.appSettingService.showWarning("Please fill all the required fields correctly");
      this.quoteRoutes.markAllAsTouched();
      this.quoteRoutes.updateValueAndValidity();
      this.selectedTab1 = 'Route Details';
      return;
    }
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
    console.log(formValue);

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

      quoteRoutes: (formValue.quoteRoutes || []).map((route, routeIndex) => ({
        // Route Part
        QuoteRouteSid: route.QuoteRouteSid,
        DepartmentMasterSid: route.DepartmentMasterSid,
        POLFreeDays: route.POLFreeDays,
        PODFreeDays: route.PODFreeDays,
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
        quoteProducts : (route.quoteProducts || []).map(product => ({
          ...product,
        })),

        // Route - Carrier
        quoteCarriers : (route.quoteCarriers || []).map((carrier) => {
          const allCharges = (carrier.quoteCharges || []).map(charge => ({
            ...charge,
          }))
          return {
            ...carrier,
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
            this.router.navigate(['crm/quotation/list'])
          } else {
            this.appSettingService.showError(resp.message);

          }
        }
      )
    } else {

      this.leadService.createQuotation(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.modalService.openSuccessModal("Quotation Created Successfully");
            this.router.navigate(['crm/quotation/list'])
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

  onChargeChange(charge: any, routeIndex: number, carrierIndex:number, chargeIndex: number) {
    if (!charge || charge === undefined) {
      const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
      const clearFields = ['ChargeDisplayName', 'ChargeUomSid', 'RevenueCurrencyMasterSid', 'RevenueExchangeRate', 'RevenueAmount', 'RevenueLocalAmount'];
      const clearControls = (allCtrl:string[]) => {
        allCtrl.forEach(ctrl => {
          if (chargeForm.get(ctrl)) {
            chargeForm.get(ctrl)?.setValue('');
          }
        })
      }
      clearControls(clearFields);
      return;
    }
    const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const uomCode = (this.unitMaster.find(uom => uom.UOMMasterSid === charge.UOM))?.UOMCode;
    const currCode = (this.currencyMaster.find(curr => curr.CurrencyMasterSid === charge.CurrencyMasterSid))?.currencyCode;

    chargeForm.get('ChargeDisplayName')?.setValue(charge.chargeName);

    chargeForm.get('RevenueChargeUomSid')?.setValue(charge.UOM);
    chargeForm.get('RevenueCurrencyMasterSid')?.setValue(charge.CurrencyMasterSid);
    chargeForm.get('CostChargeUomSid')?.setValue(charge.UOM);
    chargeForm.get('CostCurrencyMasterSid')?.setValue(charge.CurrencyMasterSid);
    this.handleQty(routeIndex,carrierIndex,chargeIndex);
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
    const qty = chargeCtrl.get('Qty')?.value;
    const revenueRate = chargeCtrl.get('RevenueRate')?.value;
    const revExRate = chargeCtrl.get('RevenueExchangeRate')?.value;

    if (qty && revenueRate) {
      chargeCtrl.get('RevenueAmount')?.setValue(qty * revenueRate);
    } else {
      chargeCtrl.get('RevenueAmount')?.setValue('0');
    }

    if (qty && revenueRate && revExRate) {
      chargeCtrl.get('RevenueLocalAmount')?.setValue(qty * revenueRate * revExRate);
    } else {
      chargeCtrl.get('RevenueLocalAmount')?.setValue('0');
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

  hasEveryRequiredFieldsFilled(){
    const data = this.quotationForm.getRawValue();
    return (data.DepartmentMasterSid || data.PORSid || data.POLSid || data.PODSid || data.EffectiveDate || data.ExpiredDate)
  }

  getTariffDetails(routeIndex:number,carrierIndex:number,template:TemplateRef<any>){
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if(this.hasEveryRequiredFieldsFilled()){
      this.appSettingService.showWarning("Please fill all the required fields to get tariff details.");

      const compulsoryFields = ['DepartmentMasterSid','PORSid','POLSid','PODSid','FPODSid','CargoType','effDate','expDate']
      compulsoryFields.forEach(ctrl => {
        if(routeForm.get(ctrl)){
          routeForm.get(ctrl).markAsTouched();
        }
      });
      return;
    }
    this.tariffLoading = true;
    this.currentRouteIndex = routeIndex;
    this.currentCarrierIndex = carrierIndex;
    const routeCtrl = this.quoteRoutes.at(this.currentRouteIndex) as FormGroup;
    const segment = routeCtrl?.get('segmentType').getRawValue();
    console.log(segment);
    let value;
    if(segment === "FCL"){
      value = routeCtrl.get('ContainerQty')?.getRawValue()
    } else if(segment === "LCL"){
      value = routeCtrl.get('CBM')?.getRawValue();
    } else if(segment === "AIR"){
      value = routeCtrl.get('ChargeableWeight')?.getRawValue();
    }
    console.log(value);
    this.ngbModal.open(template,{size : 'lg',centered : true , backdrop:'static'});
    const payload = {
      DepartmentMasterSid : routeForm.get('DepartmentMasterSid')?.value,
      PORSid : routeForm.get('PORSid')?.value,
      POLSid : routeForm.get('POLSid')?.value,
      PODSid : routeForm.get('PODSid')?.value,
      FPODSid : routeForm.get('FPODSid')?.value,
      CargoType : routeForm.get('CargoType')?.value,
      EffectiveDate : routeForm.get('effDate')?.value,
      ExpiredDate : routeForm.get('expDate')?.value,
    }
    this.leadService.getTariffDetailsByQuote(payload).subscribe(
      (resp:any)=>{
        if(resp.status){
          const response : any[] = resp.data || [];
          const existingValue = routeForm.getRawValue();
          const existingTariffDetailId = existingValue?.quoteCharges.map((ch)=> ch.TariffDetailSid)
          this.tariffDetails = response
            .filter(td => !existingTariffDetailId.includes(td.TariffDetailSid))
            .map((td:any)=>{
            const charge = this.getCharge(td.ChargeCode);
            return {
              ...td,
              chargeName : charge?.chargeName,
              chargeCode : charge?.chargeCode,
              ChargeMasterSid : charge?.ChargeMasterSid,
              Qty : Number(value),
              Amount : Number(value) * Number(td?.SalePerUnitPrice)
            }
          })
          console.log(this.tariffDetails);
          this.tariffLoading = false;
        } else {
          this.appSettingService.showError("Error loading Tariff Details");
          this.tariffLoading = false;
        }
      }
    )
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

  applyTariff(tariffData:any){
    
    const data = {
      ChargeUomSid : tariffData?.ChargeMasterSid,
      ChargeDisplayName : tariffData?.chargeName,
      CurrencyMasterSid : tariffData?.SaleCurrency,
      perUnit : Number(tariffData?.SalePerUnitPrice),
      costCurrency : tariffData?.currencyMasterBuy?.currencyCode,
      costPerUnit : Number(tariffData?.BuyPerUnitPrice),
      TariffDetailSid : tariffData?.TariffDetailSid,
      UOMMasterSid : tariffData?.UOMSid,
      costUnit : this.getUOMCode(tariffData?.UOMSid),
      Qty : tariffData?.Qty
    }
    const isEmpty = this.checkIfLastChargeEmpty(this.currentRouteIndex,this.currentCarrierIndex);
    let chargeIndex;
    if(isEmpty){
      chargeIndex = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).length - 1;
      const chargeForm = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).at(chargeIndex) as FormGroup;
      chargeForm.patchValue({
        ...data
      })
      chargeForm.updateValueAndValidity();
    } else {
      this.addQuoteCharge(this.currentRouteIndex,this.currentCarrierIndex,data);
      chargeIndex = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).length - 1;
    }
    
    this.handleQty(this.currentRouteIndex,this.currentCarrierIndex,chargeIndex);
    this.calculateRevenueTotalAmount(this.currentRouteIndex,this.currentCarrierIndex,chargeIndex);
    this.calculateCostTotalAmount(this.currentRouteIndex,this.currentCarrierIndex,chargeIndex);

    const chargeForm = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).at(chargeIndex) as FormGroup;
    Object.keys(data).forEach(field => {
      if(chargeForm.get(field) && field !== "Qty"){
        chargeForm.get(field)?.disable();
      }
    })
    this.closeTariffModal();
  }

  getUOMCode(UOMMasterSid:number){
    if(!UOMMasterSid){
      return '';
    }
    return (this.unitMaster.find(uom => uom.UOMMasterSid === UOMMasterSid))?.UOMCode;
  }

  checkIfLastChargeEmpty(routeIndex,carrierIndex) {
    const chargeLen = this.quoteCharges(routeIndex,carrierIndex).length - 1;
    const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeLen) as FormGroup;
    const rawValue = chargeForm.getRawValue();

    return Object.entries(rawValue).every(([key, value]) => {
      if (key === 'Qty') {
        return value === 1;
      }
      return value === null || value === undefined || value === '' || value === 0;
    });
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
    const payload = { MenuMasterSid: this.currentMenuId };
    this.leadService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.ngbModal.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.QuoteHeaderSid;

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
    if (!this.quotationData) return;
    const modalRef = this.ngbModal.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
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
    this.loadEnquiry(this.QuoteHeaderSid);
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

  patchRevenueExchangeRate(routeIndex,carrierIndex, chargeIndex) {
    const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const revCurrencyMasterSid = chargeForm.get('RevenueCurrencyMasterSid');
    const revenueExchangeRate = chargeForm.get('RevenueExchangeRate');
    const userCompany = (this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany.CompanyMasterSid);
    const fromCurrency = revCurrencyMasterSid.value;
    const toCurrency = userCompany.companyMaster.CurrencyMasterSid;
    const fromCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode;
    const toCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;
    const payload = {
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode
    }
    if (fromCurrencyCode && toCurrencyCode) {
      this.leadService.getExchangeRate(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            const exchangeRate = resp.data;
            revenueExchangeRate.setValue(exchangeRate);
          } else {
            revenueExchangeRate?.setValue('');
          }
        }
      )
    } else {
      revenueExchangeRate?.setValue('');
    }
    revenueExchangeRate?.updateValueAndValidity();
  }

  patchCostExchangeRate(routeIndex,carrierIndex, chargeIndex) {
    const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const costCurrencyMasterSid = chargeForm.get('CostCurrencyMasterSid');
    const costExchangeRate = chargeForm.get('CostExchangeRate');
    const userCompany = (this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany.CompanyMasterSid);
    const fromCurrency = costCurrencyMasterSid.value;
    const toCurrency = userCompany.companyMaster.CurrencyMasterSid;
    console.log(fromCurrency, toCurrency);
    const fromCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode;
    const toCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;
    const payload = {
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode
    }
    console.log(payload);
    if (fromCurrencyCode && toCurrencyCode) {
      this.leadService.getExchangeRate(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            const exchangeRate = resp.data;
            costExchangeRate.setValue(exchangeRate);
          } else {
            costExchangeRate?.setValue('');
          }
        }
      )
    } else {
      costExchangeRate?.setValue('');
    }
    costExchangeRate?.updateValueAndValidity();
  }

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
    routeCtrl.get('GrossWeight')?.disable();
    routeCtrl.get('NetWeight')?.disable()
    routeCtrl.get('Volume')?.disable();
    routeCtrl.get('ChargeableWeight')?.disable();
    
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

  geteCarrierInfo(routeIndex:number,chargeIndex:number){
    const routeForm = this.quoteCarriers(routeIndex).at(chargeIndex) as FormGroup;
    
  }

}

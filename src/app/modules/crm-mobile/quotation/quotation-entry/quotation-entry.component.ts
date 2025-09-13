import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  NgbAccordionModule,
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgbAccordionDirective } from '@ng-bootstrap/ng-bootstrap';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, tap } from 'rxjs';
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
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DecimalPrecisionDirective,
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
  quotationForm !: FormGroup;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  enquiryNumber = '';
  allowModifyButton : boolean;
  authStateCache : string = "Pending";
  disableAllModification : boolean;
  
auditLogs: any[] = []; // Stores audit logs
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

  tabs: string[] = ['Quotation', 'Charge Details'];
  selectedTab = 'Quotation';

  selectTab(tab: string) {
    this.selectedTab = tab;
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
      const dataFromEnqPage = this.leadService.getQuotationData();
      this.leadService.clearQuotationData();
      if (dataFromEnqPage?.rateReq) {
        this.patchEnqPageValues(dataFromEnqPage);
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
    this.enquiryNumber = enqData?.EnquiryNumber;
    this.quoteRoutes.clear();

    const headerFields = ['EnquirySid', 'CustomerMasterSid', 'CustomerName', 'CustomerAddress', 'Email'];
    this.quotationForm.patchValue(
      headerFields.reduce((obj, field) => ({ ...obj, [field]: enqData?.[field] }), {})
    );
    headerFields.forEach(field => this.quotationForm.get(field)?.disable());

    // Process routes
    enqData.enqRoutes.forEach((route, routeIndex) => {
      const routeData = {
        ...route,
        DepartmentMasterSid: enqData.DepartmentMasterSid,
      }
      this.addQuoteRoute({
        ...routeData,
        segmentType: enqData.segment
      });

      this.addQuoteCharge(routeIndex);
      this.handleValidationOnDept(routeIndex, enqData.segment);
      this.onRouteChange(routeIndex);

      // Disable only the fields we actually patched for this route
      const routeGroup = this.quoteRoutes.at(routeIndex);
      Object.keys(routeData).forEach(field => {
        if (routeGroup.get(field)) {
          routeGroup.get(field)?.disable();
        }
      });
    });
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
      // Fields mentioned in Web Design Draft
      CustomerMasterSid: [null, [Validators.required]],
      CustomerRef: [''],
      Email: [''],
      status: ['Active'],
      SalesmanSid: [null],
      quoteRoutes: this.fb.array([]),

      CustomerName: [''],
      CustomerAddress: ['', [Validators.required]],
      QuoteNumber: [''],
      QuoteDate: [null],
      EnquirySid: [''],
    })
    this.addQuoteRoute();
    this.quotationForm.get('EnquirySid')?.disable();
    this.quoteRoutes.controls.forEach((route, index) => {
      route.get('PODSid')?.valueChanges.subscribe(() => this.onRouteChange(index));
      route.get('POLSid')?.valueChanges.subscribe(() => this.onRouteChange(index));
    });
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.quotationForm.controls;
  }

  get quoteRoutes(): FormArray {
    return this.quotationForm.get('quoteRoutes') as FormArray;
  }

  addQuoteRoute(data?: any) {
    const routeForm = this.fb.group({
      QuoteRouteSid: [data?.QuoteRouteSid || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null, [Validators.required]],
      PORSid: [data?.PORSid || null],
      POLSid: [data?.POLSid || null, [Validators.required]],
      PODSid: [data?.PODSid || null, [Validators.required]],
      FPODSid: [data?.FDPSid || data?.FPODSid || null, [Validators.required]],
      CarrierMasterSid: [data?.CarrierMasterSid || null],
      CargoType: [data?.CargoType || null, [Validators.required]],
      ContainerType: [data?.ContainerType || null],
      ContainerQty: [data?.ContainerQty || 1],
      effDate: [new Date(data?.effDate) || null, [Validators.required]],
      expDate: [new Date(data?.expdate) || '', [Validators.required]],
      TransitDays: [data?.TransitDays || ''],
      ServiceLevel: [data?.ServiceLevel || null],
      POLFreeDays: [data?.POLFreeDays || ''],
      PODFreeDays: [data?.PODFreeDays || ''],

      CBM: [data?.CBM || 1],
      ChargeableWeight: [data?.ChargeableWeight || 0],

      quoteCharges: this.fb.array([]),
      authorizerStatus: [data?.authorizerStatus || 'Pending'],
      // For Display purpose
      segmentType: [data?.segmentType || 'LCL', [Validators.required]],
      CarrierName: [data?.CarrierName || ''],
    })
    const routeIndex = this.quoteRoutes.length;
    this.quoteRoutes.push(routeForm);
    this.filteredPOLPorts[routeIndex] = [];
    this.filteredPODPorts[routeIndex] = [];
    this.onRouteChange(routeIndex);
    if (data === null || data === undefined || !data) {
      this.addQuoteCharge(this.quoteRoutes.length - 1);
    }
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

  removeQuoteRoute(routeIndex: number) {
    this.quoteRoutes.removeAt(routeIndex);
    this.filteredUnits.splice(routeIndex, 1);
    this.filteredPOLPorts.splice(routeIndex, 1);
    this.filteredPODPorts.splice(routeIndex, 1);
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

  quoteCharges(routeIndex: number): FormArray {
    return this.quoteRoutes.at(routeIndex).get('quoteCharges') as FormArray;
  }

  addQuoteCharge(routeIndex: number, data?: any) {
    const chargeForm = this.fb.group({
      QuoteChargeSid: [data?.QuoteChargeSid || null],
      ChargeUomSid: [data?.ChargeUomSid || null, [Validators.required]],
      Qty : [data?.Qty || 1 ,[Validators.required]],
      UOMMasterSid: [data?.UOMMasterSid || null, [Validators.required]],
      CurrencyMasterSid: [data?.CurrencyMasterSid || null, [Validators.required]],
      perUnit: [data?.perUnit || '', [Validators.required]],
      Amount: [data?.Amount || '', [Validators.required]],

      costUnit: [data?.costUnit || null, Validators.required],
      costCurrency: [data?.costCurrency || null, Validators.required],
      costPerUnit: [data?.costPerUnit || '', Validators.required],

      // For showing on report
      ChargeDisplayName: [data?.ChargeDisplayName, [Validators.required]],

      TariffDetailSid : [data?.TariffDetailSid || null]  // For filtering purpose
    })
    chargeForm.get('ChargeDisplayName')?.disable();
    chargeForm.get('Amount')?.disable();
    this.quoteCharges(routeIndex).push(chargeForm)
  }


  removeCharge(routeIndex: number, chargeIndex: number, QuoteChargeSid: number) {
    const chargeArr = this.quoteCharges(routeIndex);
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


  // SECTION5 - MAIN FUNCTIONS

  loadAllLookUps() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    return forkJoin({
      cargoTypes: this.leadService.getAllCargoTypes(CompanyMasterSid).pipe(catchError(err => of([]))),
      carriers: this.leadService.getAllCarrier(CompanyMasterSid).pipe(catchError(err => of([]))),
      customers: this.leadService.getAllCustomers(CompanyMasterSid).pipe(catchError(err => of([]))),
      departments: this.leadService.getAllDepartments(CompanyMasterSid).pipe(catchError(err => of([]))),
      ports: this.leadService.getAllPorts().pipe(catchError(err => of([]))),
      incos: this.leadService.getAllIncos().pipe(catchError(err => of([]))),
      salesman: this.leadService.getAllSalesman().pipe(catchError(err => of([]))),
      masters: this.leadService.getAllMasters(CompanyMasterSid).pipe(catchError(err => of({ charges: [], currencies: [], units: [] }))),
      units : this.leadService.getAllUOMs().pipe(catchError(err => of([]))),
      containerTypes: this.leadService.getAllContainerTypes().pipe(catchError(err => of([])))
    }).pipe(tap(({ cargoTypes, carriers, customers, departments, ports, incos, salesman, masters,units, containerTypes }) => {
      this.packageTypes = cargoTypes || [];
      this.carriers = carriers || [];
      this.customers = customers || [];
      this.departments = departments || [];
      this.ports = ports || [];
      this.chargeMaster = masters.charges || [];
      this.currencyMaster = masters.currencies || [];
      this.unitMaster = units.data || [];
      this.incoList = incos || [];
      this.salesmanList = salesman || [];
      this.containerTypeList = containerTypes || []
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
      status: response.status === 'A' ? 'Active' : 'Suspended',
      QuoteDate: new Date(response.QuoteDate),
    })
    this.authStateCache = response?.authorizerStatus || 'Pending';
    this.quoteRoutes.clear();
    response.quoteRoute.forEach((route, routeIndex) => {
      this.addQuoteRoute(route)
      this.handleValidationOnDept(routeIndex, route.segmentType)
      this.onRouteChange(routeIndex);

      route.quoteCharge.forEach(charge => {
        this.addQuoteCharge(routeIndex, charge);
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
      this.selectedTab = 'Charge Details';
      return;
    }
    if (this.quotationForm.invalid) {
      this.appSettingService.showWarning("Please fill all the required fields correctly");
      this.quotationForm.markAllAsTouched();
      this.quotationForm.updateValueAndValidity();
      this.selectedTab = 'Quotation';
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

      routes: formValue.quoteRoutes.map((route, routeIndex) => ({
        QuoteRouteSid: route.QuoteRouteSid,
        DepartmentMasterSid: route.DepartmentMasterSid,
        PORSid: route.PORSid,
        POLSid: route.POLSid,
        PODSid: route.PODSid,
        FPODSid: route.FPODSid,
        CarrierMasterSid: route.CarrierMasterSid,
        CargoType: route.CargoType,
        ContainerType: route.ContainerType,
        ContainerQty: route.ContainerQty,
        effDate: route.effDate,
        expDate: route.expDate,
        TransitDays: route.TransitDays,
        ServiceLevel: route.ServiceLevel,
        POLFreeDays: route.POLFreeDays,
        PODFreeDays: route.PODFreeDays,
        CBM: route.CBM,
        ChargeableWeight : route.ChargeableWeight,
        segmentType: route.segmentType,
        CarrierName: route.CarrierName,
        cargo: route.quoteCharges.map(cargo => ({
          ...cargo,
        }))
      }))
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

  handleValidationOnDept(index, type) {
    const routeForm = this.quoteRoutes.at(index) as FormGroup;

    const resetFields = (fields: string[]) => {
      fields.forEach(f => {
        const ctrl = routeForm.get(f);
        if (ctrl) {
          ctrl.reset();
          ctrl.clearValidators();
          ctrl.updateValueAndValidity();
        }
      });
    };

    const setRequired = (fields: string[]) => {
      fields.forEach(f => {
        const ctrl = routeForm.get(f);
        if (ctrl) {
          ctrl.setValidators([Validators.required]);
          if (f !== 'ContainerType') {
            ctrl.setValidators([Validators.required, Validators.min(1)]);
          }
          ctrl.updateValueAndValidity();
        }
      });
    };
    const FCLRequiredFields = ['ContainerType', 'ContainerQty']
    const LCLRequiredFields = ['CBM']
    const AIRRequiredFields = ['ChargeableWeight']

    // resetFields(allFields);
    if (type === "FCL") {
      const allFields = [...LCLRequiredFields, ...AIRRequiredFields];
      resetFields(allFields)
      setRequired(FCLRequiredFields);
    } else if (type === "LCL") {
      const allFields = [...FCLRequiredFields, ...AIRRequiredFields];
      resetFields(allFields)
      setRequired(LCLRequiredFields);
    } else if (type === "AIR") {
      const allFields = [...FCLRequiredFields, ...LCLRequiredFields];
      resetFields(allFields)
      setRequired(AIRRequiredFields);
    }
    routeForm.updateValueAndValidity();
  }

  onDeptChange(dept: any, routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    routeForm.get('PORSid')?.reset();
    routeForm.get('POLSid')?.reset();
    routeForm.get('PODSid')?.reset();
    routeForm.get('FPODSid')?.reset();
    this.quoteCharges(routeIndex).controls.forEach((group: FormGroup, index) => {
      group.get('UOMMasterSid').setValue(null);
    })
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

  onChargeChange(charge: any, routeIndex: number, chargeIndex: number) {
    if (!charge || charge === undefined) {
      this.quoteCharges(routeIndex).at(chargeIndex).get('ChargeDisplayName')?.setValue('');
      this.quoteCharges(routeIndex).at(chargeIndex).get('UOMMasterSid')?.setValue('');
      this.quoteCharges(routeIndex).at(chargeIndex).get('costUnit')?.setValue('');
      this.quoteCharges(routeIndex).at(chargeIndex).get('CurrencyMasterSid')?.setValue('');
      this.quoteCharges(routeIndex).at(chargeIndex).get('Qty')?.setValue('');
      this.quoteCharges(routeIndex).at(chargeIndex).get('costCurrency')?.setValue('');
      return;
    }
    this.quoteCharges(routeIndex).at(chargeIndex).get('ChargeDisplayName')?.setValue(charge.chargeName);
    this.quoteCharges(routeIndex).at(chargeIndex).get('UOMMasterSid')?.setValue(charge.UOM);
    const uomCode = (this.unitMaster.find(uom => uom.UOMMasterSid === charge.UOM))?.UOMCode;
    this.quoteCharges(routeIndex).at(chargeIndex).get('costUnit')?.setValue(uomCode);
    this.quoteCharges(routeIndex).at(chargeIndex).get('CurrencyMasterSid')?.setValue(charge.CurrencyMasterSid);
    const currCode = (this.currencyMaster.find(curr => curr.CurrencyMasterSid === charge.CurrencyMasterSid))?.currencyCode;
    this.quoteCharges(routeIndex).at(chargeIndex).get('costCurrency')?.setValue(currCode);
    this.handleQty(routeIndex,chargeIndex);
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

  handleQtyForRoutes(routeIndex:number){
    const chargeArr = this.quoteCharges(routeIndex);
    chargeArr.controls.forEach((_, chargeIndex) => {
      this.handleQty(routeIndex, chargeIndex);
    });
  }

  handleQty(routeIndex:number,chargeIndex:number){
    const routeCtrl = this.quoteRoutes.at(routeIndex) as FormGroup;
    const chargeCtrl = this.quoteCharges(routeIndex).at(chargeIndex)
    const segment = routeCtrl?.get('segmentType').getRawValue();
    if(segment === "FCL"){
      let value = routeCtrl.get('ContainerQty')?.getRawValue()
      chargeCtrl.get('Qty')?.setValue(value);
    } else if(segment === "LCL"){
      chargeCtrl.get('Qty')?.setValue(routeCtrl.get('CBM')?.getRawValue());
    } else if(segment === "AIR"){
      chargeCtrl.get('Qty')?.setValue(routeCtrl.get('ChargeableWeight')?.getRawValue());
    }
    this.calculateTotalAmount(routeIndex,chargeIndex);
  }

  calculateTotalAmountForRoute(routeIndex: number) {
    const chargeArr = this.quoteCharges(routeIndex);
    chargeArr.controls.forEach((_, chargeIndex) => {
      this.calculateTotalAmount(routeIndex, chargeIndex);
    });
  }

  calculateTotalAmount(routeIndex: number, chargeIndex: number) {
    const chargeCtrl = this.quoteCharges(routeIndex).at(chargeIndex);
    const qty = chargeCtrl.get('Qty')?.value;
    const perUnit = chargeCtrl.get('perUnit')?.value;
    if (qty && perUnit) {
      chargeCtrl.get('Amount')?.setValue(qty * perUnit);
    } else {
      chargeCtrl.get('Amount')?.setValue('0');
    }
  }

  getTariffDetails(routeIndex:number,template:TemplateRef<any>){
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if(!this.isFormValidExcept(routeForm,'quoteCharges')){
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
    const isEmpty = this.checkIfLastChargeEmpty(this.currentRouteIndex);
    let chargeIndex;
    if(isEmpty){
      chargeIndex = this.quoteCharges(this.currentRouteIndex).length - 1;
      const chargeForm = this.quoteCharges(this.currentRouteIndex).at(chargeIndex) as FormGroup;
      chargeForm.patchValue({
        ...data
      })
      chargeForm.updateValueAndValidity();
    } else {
      this.addQuoteCharge(this.currentRouteIndex,data);
      chargeIndex = this.quoteCharges(this.currentRouteIndex).length - 1;
    }
    
    this.handleQty(this.currentRouteIndex,chargeIndex);
    this.calculateTotalAmount(this.currentRouteIndex,chargeIndex);

    const chargeForm = this.quoteCharges(this.currentRouteIndex).at(chargeIndex) as FormGroup;
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

  checkIfLastChargeEmpty(routeIndex) {
    const chargeLen = this.quoteCharges(routeIndex).length - 1;
    const chargeForm = this.quoteCharges(routeIndex).at(chargeLen) as FormGroup;
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
    this.router.navigate(['crm/booking/entry'])
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

}

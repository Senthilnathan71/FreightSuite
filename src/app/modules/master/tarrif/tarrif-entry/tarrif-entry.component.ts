import { Component, OnInit, TemplateRef, Input } from '@angular/core';
import { NgbAlertModule, NgbCalendar, NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbNavModule, NgbPaginationModule, NgbPopoverModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { Port } from 'src/app/modules/crm-mobile/Interfaces/port.interface';
import { catchError, forkJoin, of } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { Charge } from 'src/app/modules/crm-mobile/Interfaces/charge.interface';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { CommonService } from 'src/app/common/common.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { getDefaultTodayDate } from 'src/app/common/helper';

@Component({
  selector: 'app-tarrif-entry',
  standalone: true,
  imports: [
    FeatherModule,
    NgbTooltip,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    NgSelectModule,
    NgbDatepickerModule,
    FormsModule,
    NgbNavModule,
    NgbAlertModule,
    CommonModule,
    MatDialogModule,
    DatePipe,
    DecimalPrecisionDirective,
    NgbPopoverModule,
    NgbPaginationModule,
    CustomDatePipe,
    SearchableDropdown,
    PreventMultiClickDirective,
    NgbDropdownModule,
    SearchableDropdown,
    PreventMultiClickDirective
  ],
  templateUrl: './tarrif-entry.component.html',
  styleUrl: './tarrif-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class TarrifEntryComponent implements OnInit {
  selectedDepartment: any;
  selectedDepartmentType: string = '';
  selectedFCLLCL: string = '';
  filteredPorts: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  departments: any[] = [];
 
  active = 1;
  modalRef: NgbModalRef;
  tariffHeaderForm!: FormGroup;
  tariffDetailsForm!: FormGroup;
  isEditMode: boolean = false;
  isModalEditMode: boolean = false;
  setErrorMessage: boolean = false;
  TariffHeaderSid: number | null = null;
  TariffDetailSid: number | null = null;
  TariffDetailsList: any[] = [];
  filteredTariffDetail: any[] = [];
  portList: Port[] = [];
  polList: Port[] = [];
  podList: Port[] = [];
  chargeList: any[] = [];
  UOMList: any[] = [];
  departmentList: any[] = [];
  agentList: any[] = [];
  carrierList: any[] = [];
  companyList: any[] = [];
 
  incoList: any[] = [];
  isDataLoading: boolean = false;
  tariffData: any;
  tariffDetailData: any;

  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  filteredCharges: any[] = [];

  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  incoLookupConfig = DROPDOWN_CONFIGS.INCO;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  portLookupConfig = {
    displayFields : ['PortCode', 'PortName','countryName'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['PortCode', 'PortName']
  };

  selectedTab = 'Tariff Details';
  tab = [{ name: 'Tariff Details', icon: 'fas fa-info-circle' }];
  page = 1;
  pageSize = 5;
  totalNumberOfCollection: number = 0;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  minEffectiveDate = this.toNgbDateStruct(this.todayDate);
  minEffectiveFrom: NgbDateStruct | null;
  currentMenuId: number | null = null;
  TandCList: any;
  chargeTaxes: any[] = [];
  btnDisable: boolean = true;

  // Status-only edit flags
  isStatusEditable: boolean = false;
  isModalStatusEditable: boolean = false;

  cargoTypes = ['General', 'Haz', 'Reefer', 'Flexi', 'ODC', 'Empty', 'RORO', 'OOG', 'Tanker'];
  serviceLevel = ['BreakBulk', 'OOG', 'Tanker']
  CurrencyLookupConfig = {
    displayFields : ['currencyCode', 'currencyName','countryName'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['currencyCode'],
  };
   private _currencyList: any[] = [];
  @Input()
set currencyList(value: any[]) {
  this._currencyList = value || [];
  if (this._currencyList.length > 0 && this.currencyConfigService) {
    this.currencyConfigService.initializeConfigurations(this._currencyList);
    console.log(`Initialized currency configurations for ${this._currencyList.length} currencies`);
  }
}
get currencyList(): any[] {
  return this._currencyList;
}


  constructor(
    private masterServ: MasterService,
    private appSettingServ: AppSettingsService,
    private currRoute: ActivatedRoute,
    private appSettingService: AppSettingsService,
    private route: Router,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private matdial: MatDialog,
    private calendar: NgbCalendar,
    private operationServ: OperationService,
    private commonService: CommonService,
    private currencyConfigService: CurrencyConfigurationService,
  private currencyFormatter: CurrencyFormatService,
    public mps: MenuPermissionService,
      private ngbModal: NgbModal,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.initHeaderForm();
    this.loadAllFields();

    this.tariffHeaderForm.statusChanges.subscribe(status => {
      this.btnDisable = status !== 'VALID';
    });

    this.tariffHeaderForm.get('DepartmentMasterSid')?.valueChanges.subscribe((deptValue) => {
      this.onDeptChange(deptValue);
    });
    this.mps.init().subscribe();
    this.currRoute.paramMap.subscribe(param => {
      this.TariffHeaderSid = Number(param.get('id'));
      if (this.TariffHeaderSid) {
        this.isEditMode = true;
        this.minEffectiveDate = undefined as any;
        this.loadTariff(this.TariffHeaderSid);
        this.loadTariffDetails();
      } else {
        this.minEffectiveDate = this.toNgbDateStruct(this.todayDate);
      }
    });

    const userProfile = this.appSettingServ.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
  }

 

  initHeaderForm() {
    this.tariffHeaderForm = this.fb.group({
      DepartmentMasterSid: [null, [Validators.required]],
      POOSid: [],
      POLSid: [, [Validators.required]],
      PODSid: [, [Validators.required]],
      FDCSid: [],
      ViaPortSid: [],
      POLTerminal: [, [Validators.required]],
      PODTerminal: [, [Validators.required]],
      Carrier: [null],
    //   MovementType: [null],
      AgentSid: [null],
      IncoTerms: [null],
      // StuffingAt: [null,[Validators.required]],
      status: ['Active'],
      Remarks: [''],
    });
    this.tariffHeaderForm.get('POLTerminal')?.disable();
    this.tariffHeaderForm.get('PODTerminal')?.disable();
  }

  initDetailsForm() {
    this.tariffDetailsForm = this.fb.group({
      detailisSlabApplicable: [false, [Validators.required]],
      detailSlabFrom: ['', this.slabConditionalValidator()],
      detailSlabTo: ['', this.slabConditionalValidator()],
      // ⬇️ Attach custom validator; it auto-bypasses in edit mode
      detailEffectiveDate: ['', [Validators.required, this.effectiveDateValidator()]],
      detailExpiredOn: ['', [Validators.required]],
      detailChargeCode: [null, [Validators.required]],
      detailDescription: [''],
      detailCargoType: [null, [Validators.required]],
      detailUOMSid: [null, [Validators.required]],
      detailSaleCurrency: [null, Validators.required],
      detailSalePerUnitPrice: ['', [Validators.required]],
      detailBuyCurrency: [null, [Validators.required]],
      detailBuyPerUnitPrice: ['', [Validators.required]],
      detailMinSale: [''],
      detailstatus: ['Active'],
      detailRemarks: [''],
      chargeTaxMasters: this.fb.array([]),
      chargeTds: this.fb.array([])
    });

    this.tariffDetailsForm.get('detailisSlabApplicable')?.valueChanges.subscribe(() => {
      this.updateSlabValidators();
    });

    // Charge code change: only apply "next-day" rule in CREATE mode
    this.tariffDetailsForm.get('detailChargeCode')?.valueChanges.subscribe(chargeCode => {
      if (!chargeCode) {
        if (!this.isModalEditMode) {
          this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(null);
          this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
        }
        return;
      }
      if (!this.isModalEditMode) {
        this.onChargeCodeChange(chargeCode);
      } else {
        // Edit: keep date as-is, just update description/UOM if needed
        this.setChargeDetails(this.chargeList.find(c => c.chargeCode === chargeCode));
      }
    });
  }

  get tariffDetails(): FormArray {
    return this.tariffDetailsForm.get('tariffDetails') as FormArray;
  }

  createTariffDetailFormGroup(tariffData?: any): FormGroup {
    return this.fb.group({
      detailisSlabApplicable: [tariffData?.IsSlabApplicable === 'Y' ? true : false || false, [Validators.required]],
      detailSlabFrom: [tariffData?.SlabFrom || '', this.slabConditionalValidator()],
      detailSlabTo: [tariffData?.SlabTo || '', this.slabConditionalValidator()],
      detailEffectiveDate: [tariffData?.EffectiveDate ? new Date(tariffData.EffectiveDate) : '', [Validators.required, this.effectiveDateValidator()]],
      detailExpiredOn: [tariffData?.ExpiredOn ? new Date(tariffData.ExpiredOn) : '', [Validators.required]],
      detailChargeCode: [tariffData?.ChargeCode || '', [Validators.required]],
      detailDescription: [tariffData?.Description || ''],
      detailCargoType: [tariffData?.CargoType || '', [Validators.required]],
      detailUOMSid: [tariffData?.UOMSid || '', [Validators.required]],
      detailSaleCurrency: [tariffData?.SaleCurrency || '', Validators.required],
      detailSalePerUnitPrice: [tariffData?.SalePerUnitPrice || '', [Validators.required]],
      detailBuyCurrency: [tariffData?.BuyCurrency || '', [Validators.required]],
      detailBuyPerUnitPrice: [tariffData?.BuyPerUnitPrice || '', [Validators.required]],
      detailMinSale: [tariffData?.MinSale || ''],
      detailstatus: [tariffData?.status ? (tariffData.status === 'A' ? 'Active' : 'Suspended') : 'Active'],
      detailRemarks: [tariffData?.Remarks || ''],
      TariffDetailSid: [tariffData?.TariffDetailSid || null]
    });
  }

  slabConditionalValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const parent = control.parent;
      if (!parent) return null;

      const isSlabApplicable = parent.get('detailisSlabApplicable')?.value;
      if (isSlabApplicable && !control.value) {
        return { required: true };
      }
      return null;
    };
  }

  updateSlabValidators() {
    const isApplicable = this.tariffDetailsForm.get('detailisSlabApplicable')?.value;
    const slabFromCtrl = this.tariffDetailsForm.get('detailSlabFrom');
    const slabToCtrl = this.tariffDetailsForm.get('detailSlabTo');

    if (isApplicable) {
      slabFromCtrl?.setValidators([this.slabConditionalValidator()]);
      slabToCtrl?.setValidators([this.slabConditionalValidator()]);
    } else {
      slabFromCtrl?.clearValidators();
      slabToCtrl?.clearValidators();
    }
    slabFromCtrl?.updateValueAndValidity();
    slabToCtrl?.updateValueAndValidity();
  }

  openTariffDetailEntryModal(content: TemplateRef<any>, data?: any) {
  if (!this.TariffHeaderSid) {
    this.appSettingServ.showError('Please save tariff header then try to add charges.');
    return;
  }

  this.isModalEditMode = !!data;
  this.initDetailsForm();
  
  // Load modal fields first, then filter charges after they're loaded
  this.loadModalFields().then(() => {
    this.filterChargeBasedOnDept();

    if (data) {
      // Edit mode logic remains the same...
      this.tariffDetailData = data;
      this.minEffectiveFrom = null;
      
      // Patch form values
      this.tariffDetailsForm.patchValue({
        detailisSlabApplicable: data.IsSlabApplicable === 'Y',
        detailSlabFrom: data.SlabFrom || '',
        detailSlabTo: data.SlabTo || '',
        detailEffectiveDate: new Date(data.EffectiveDate),
        detailExpiredOn: new Date(data.ExpiredOn),
        detailChargeCode: data.ChargeCode,
        detailDescription: data.Description || '',
        detailCargoType: data.CargoType,
        detailUOMSid: data.UOMSid,
        detailSaleCurrency: data.SaleCurrency,
        detailSalePerUnitPrice: data.SalePerUnitPrice,
        detailBuyCurrency: data.BuyCurrency,
        detailBuyPerUnitPrice: data.BuyPerUnitPrice,
        detailMinSale: data.MinSale || '',
        detailstatus: data.status === 'A' ? 'Active' : 'Suspended',
        detailRemarks: data.Remarks || ''
      });

      if (data.TariffDetailSid) this.TariffDetailSid = data.TariffDetailSid;

      this.isModalStatusEditable = false;
      this.setDetailControlsReadOnly(true);
    } else {
      // Create mode - ensure min date is set correctly
        const tomorrow = new Date();
  this.minEffectiveFrom = this.toNgbDateStruct(tomorrow);
  this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(tomorrow);
      
      // Set default effective date based on initially selected charge code (if any)
      const initialChargeCode = this.tariffDetailsForm.get('detailChargeCode')?.value;
      if (initialChargeCode) {
        this.setEffectiveDateBasedOnChargeCode(initialChargeCode);
      }
    }

    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
  });
} 
  // --- LOAD TARIFF AND SET READONLY VIEW ---
  loadTariff(TariffHeaderSid: number) {
    this.masterServ.getTariffById(TariffHeaderSid).subscribe(
      (tariffData) => {
        if (tariffData.data) {
          this.tariffData = tariffData.data;

          this.tariffHeaderForm.patchValue({
            ...tariffData.data,
            DepartmentMasterSid: Number(tariffData.data.DepartmentMasterSid),
            status: tariffData.data.status === 'A' ? 'Active' : 'Suspended'
          });

          const deptSid = Number(tariffData.data.DepartmentMasterSid);
          const deptObj = this.departments?.find(d => Number(d.DepartmentMasterSid) === deptSid) || null;
          this.onDeptChange(deptObj ?? deptSid);

          this.isStatusEditable = false;
          this.setHeaderControlsReadOnly(true);
        }
      },
      (error) => {
        this.appSettingServ.showError('Error Loading Tariff ', error);
      }
    );
  }

  loadAllFields() {
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  forkJoin({
    ports: this.masterServ.getAllPorts(),
    agents: this.operationServ.getCustomerByItsType({ CompanyMasterSid, types: ['vendor', 'transporter', 'agent'] }).pipe(catchError(err => of([]))),
    carriers: this.operationServ.getCustomerByItsType({ CompanyMasterSid, types: ['carrier'] }).pipe(catchError(err => of([]))),
    departments: this.masterServ.getAllDepartments(this.currentCompany?.CompanyMasterSid),
    companies: this.masterServ.getAllCompanies(),
    currencies: this.masterServ.getAllCurrencies(),
    incos: this.masterServ.getAllInco(),
    chargeTax: this.masterServ.getAllChargeTax(CompanyMasterSid)
  }).subscribe(({ ports, agents, carriers, departments, companies, currencies, incos, chargeTax }) => {
    this.departments = departments || [];
    
    // FIX: Properly handle port data structure
    const rawPorts = ports.data || ports || [];
    this.portList = rawPorts.map((p: any) => {
      // Try different possible paths for country name
      const countryName = 
        p.countryName || 
        p.countryMaster?.countryName ||
        p.country?.countryName ||
        p.CountryName || 
        '';

      return {
        ...p,
        PortCode: p.PortCode || p.portCode,
        PortName: p.PortName || p.portName,
        PortMasterSid: p.PortMasterSid || p.portMasterSid,
        PortType: p.PortType || p.portType,
        countryName: countryName
      };
    });

    this.filteredPorts = [...this.portList];
    this.filteredPOL = [...this.filteredPorts];
    this.filteredPOD = [...this.filteredPorts];

    this.polList = [...this.filteredPOL];
    this.podList = [...this.filteredPOD];
    this.agentList = agents.data;
    this.carrierList = carriers.data;
    this.departmentList = departments;
    this.filterChargeBasedOnDept();
    this.companyList = companies;
    
    // FIX: Also update currency mapping for consistency
    const rawCurrencies = currencies.data || currencies || [];
    this.currencyList = rawCurrencies.map((c: any) => ({
      ...c,
      countryName: c.countryName || c?.countryMaster?.countryName || ''
    }));

    this.incoList = incos;
    this.chargeTaxes = chargeTax.data;
    this.isDataLoading = false;

    if (this.isEditMode && this.tariffData?.DepartmentMasterSid) {
      const deptSid = Number(this.tariffData.DepartmentMasterSid);
      const deptObj = this.departments.find(d => Number(d.DepartmentMasterSid) === deptSid) || null;
      this.onDeptChange(deptObj ?? deptSid);
    }
  }, err => console.error('loadAllFields error', err));
}

   openAuditLogs(modal: TemplateRef<any>) {
  if (!this.TariffHeaderSid) return;
 
  this.masterServ.getAuditLogsTariff(
    'TariffHeader',
    this.TariffHeaderSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['UpdatedOn']; // ✅ add more if needed later
 
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
 

  loadModalFields(): Promise<void> {
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  
  return new Promise((resolve, reject) => {
    forkJoin({
      charges: this.masterServ.getAllCharges(CompanyMasterSid),
      UOMs: this.masterServ.getUOMsByType('C'),
    }).subscribe({
      next: ({ charges, UOMs }) => {
        this.chargeList = charges;
        this.UOMList = UOMs.data;
        resolve(); 
      },
      error: (err) => {
        console.error('Error loading modal fields:', err);
        reject(err);
      }
    });
  });
}
  navigateBack() {
    history.back();
  }

  private setHeaderControlsReadOnly(readOnly: boolean) {
    Object.keys(this.tariffHeaderForm.controls).forEach(key => {
      const ctrl = this.tariffHeaderForm.get(key);
      if (!ctrl) return;
      if (readOnly) {
        ctrl.disable({ emitEvent: false });
      } else {
        ctrl.enable({ emitEvent: false });
      }
    });

    this.tariffHeaderForm.get('POLTerminal')?.disable({ emitEvent: false });
    this.tariffHeaderForm.get('PODTerminal')?.disable({ emitEvent: false });

    if (this.isStatusEditable) {
      this.tariffHeaderForm.get('status')?.enable({ emitEvent: false });
    } else {
      this.tariffHeaderForm.get('status')?.disable({ emitEvent: false });
    }
  }

  onEditStatusClick() {
    if (!this.isEditMode) return;
    this.isStatusEditable = true;
    this.setHeaderControlsReadOnly(true);
    this.tariffHeaderForm.get('status')?.enable({ emitEvent: false });
    this.btnDisable = false;
  }

  private setDetailControlsReadOnly(readOnly: boolean) {
    if (!this.tariffDetailsForm) return;
    Object.keys(this.tariffDetailsForm.controls).forEach(key => {
      const ctrl = this.tariffDetailsForm.get(key);
      if (!ctrl) return;
      if (readOnly) ctrl.disable({ emitEvent: false });
      else ctrl.enable({ emitEvent: false });
    });

    if (this.isModalStatusEditable) {
      this.tariffDetailsForm.get('detailstatus')?.enable({ emitEvent: false });
    } else {
      this.tariffDetailsForm.get('detailstatus')?.disable({ emitEvent: false });
    }
  }

  onEditDetailStatusClick() {
    if (!this.isModalEditMode) return;
    this.isModalStatusEditable = true;
    this.setDetailControlsReadOnly(true);
    this.tariffDetailsForm.get('detailstatus')?.enable({ emitEvent: false });
  }

  onSave() {
    if (this.isEditMode && this.isStatusEditable) {
      const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
      const statusVal = this.tariffHeaderForm.get('status')?.value;
      const payload: any = {
        status: statusVal === 'Active' ? 'A' : 'S',
        updatedBy
      };

      this.masterServ.updateTariffById(this.TariffHeaderSid as number, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.isStatusEditable = false;
            this.setHeaderControlsReadOnly(true);
            this.loadTariff(this.TariffHeaderSid as number);
            this.btnDisable = true;
          } else {
            this.appSettingServ.showError(resp.message || 'Error updating status');
          }
        },
        error: (error) => {
          console.error('Error updating status: ', error);
          this.appSettingServ.showError('Error updating status');
        }
      });
      return;
    }

    this.fullOnSaveFlow();
  }

  fullOnSaveFlow() {
    if (this.tariffHeaderForm.invalid) {
      this.tariffHeaderForm.markAllAsTouched();
      this.tariffHeaderForm.updateValueAndValidity();
      this.appSettingServ.showWarning('Please fill all required fields correctly');
      return;
    } else {
      const formValue = this.tariffHeaderForm.getRawValue();
      const payload = this.coerceIntoRequiredFormat(formValue);

      if (this.isEditMode) {
        this.masterServ.updateTariffById(this.TariffHeaderSid as number, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.loadTariff(this.TariffHeaderSid as number);
            } else {
              this.appSettingServ.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error loading Tariff : ', error);
          }
        );
      } else {
        this.masterServ.createTariff(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              const tariffId = resp?.data?.TariffHeaderSid;
              if (tariffId) {
                this.route.navigate(['master/tarrif/entry', tariffId]);
              }
            } else {
              this.appSettingServ.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error loading Tariff : ', error);
          }
        );
      }
    }
  }

  onModalSave() {
    // Detail status-only update in edit mode
    if (this.isModalEditMode && this.isModalStatusEditable) {
      const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
      const statusVal = this.tariffDetailsForm.get('detailstatus')?.value;
      const payload = {
        status: statusVal === 'Active' ? 'A' : 'S',
        updatedBy
      };

      this.masterServ.updateTariffDetailById(this.TariffDetailSid as number, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.tariffDetailsForm.reset();
            this.modalRef.close();
            this.loadTariffDetails();
          } else {
            this.appSettingServ.showError(resp.message || 'Error updating tariff detail status');
          }
        },
        (error) => {
          console.error('Error updating tariff detail status', error);
          this.appSettingServ.showError('Error updating tariff detail status');
        }
      );
      return;
    }

    // Create/update full flow
    if (this.tariffDetailsForm.invalid) {
      this.tariffDetailsForm.markAllAsTouched();
      this.tariffDetailsForm.updateValueAndValidity();
      this.appSettingServ.showWarning('Please fill all the required fields');
      return;
    } else {
      const createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
      const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
      const formValue = this.tariffDetailsForm.getRawValue();
      const payload = {
        TariffHeaderSid: this.TariffHeaderSid || parseInt(formValue.TariffHeaderSid, 10),
        IsSlabApplicable: formValue.detailisSlabApplicable ? 'Y' : 'N',
        SlabFrom: formValue.detailisSlabApplicable ? parseInt(formValue.detailSlabFrom, 10) : null,
        SlabTo: formValue.detailisSlabApplicable ? parseInt(formValue.detailSlabTo, 10) : null,
        EffectiveDate: formValue.detailEffectiveDate,
        ExpiredOn: formValue.detailExpiredOn,
        ChargeCode: formValue.detailChargeCode,
        Description: formValue.detailDescription,
        CargoType: formValue.detailCargoType,
        UOMSid: parseInt(formValue.detailUOMSid, 10),
        SaleCurrency: parseInt(formValue.detailSaleCurrency, 10),
        SalePerUnitPrice: parseFloat(formValue.detailSalePerUnitPrice),
        BuyCurrency: parseInt(formValue.detailBuyCurrency, 10),
        BuyPerUnitPrice: parseFloat(formValue.detailBuyPerUnitPrice),
        MinSale: formValue.detailMinSale,
        status: formValue.detailstatus === 'Active' || formValue.status === 'A' ? 'A' : 'S',
        Remarks: formValue.detailRemarks,
        ...(this.isModalEditMode ? { updatedBy } : { createdBy })
      };

      if (this.isModalEditMode) {
        this.masterServ.updateTariffDetailById(this.TariffDetailSid as number, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.tariffDetailsForm.reset();
              this.modalRef.close();
              this.loadTariffDetails();
            } else {
              this.appSettingServ.showError('Error Updating Tariff Detail');
            }
          },
          (error) => {
            console.error('Error Updating Tariff Detail', error);
          }
        );
      } else {
        this.masterServ.createNewTariffDetail(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.tariffDetailsForm.reset();
              this.modalRef.close();
              this.loadTariffDetails();
            } else {
              this.appSettingServ.showError('Error Creating Tariff Detail');
            }
          },
          (error) => {
            console.error('Error Creating Tariff Detail', error);
          }
        );
      }
    }
  }

  coerceIntoRequiredFormat(formValue: any) {
    const createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
    const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
    return (this.isEditMode) ? {
      ...formValue,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      POOSid: formValue.POOSid,
      POLSid: formValue.POLSid,
      PODSid: formValue.PODSid,
      FDCSid:formValue.FDCSid,
      ViaPortSid: formValue.ViaPortSid,
      AgentSid: formValue.AgentSid,
      Carrier: formValue.Carrier,
      updatedBy,
      status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
    } : {
      ...formValue,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      POOSid: formValue.POOSid,
      POLSid: formValue.POLSid,
      PODSid: formValue.PODSid,
      FDCSid: formValue.FDCSid,
      ViaPortSid: formValue.ViaPortSid,
      AgentSid: formValue.AgentSid,
      Carrier: formValue.Carrier,
      createdBy,
      status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
    };
  }

  deleteTariffDetail(TariffDetailSid: number) {
    const dialRef = this.matdial.open(DeleteWarningComponent);
    dialRef.afterClosed().subscribe(
      (res) => {
        if (res) {
          this.masterServ.deleteTariffDetailById(TariffDetailSid).subscribe(
            (resp) => {
              if (resp.data) {
                this.appSettingServ.showSuccess('Tariff Detail Deleted Successfully');
                this.loadTariffDetails();
              } else {
                this.appSettingServ.showError('Error Deleting Tariff Detail');
              }
            },
            (error) => {
              console.error('Error Deleting Tariff Detail', error);
            }
          );
        }
      }
    );
  }

  onDeptChange(department: any): void {
  if (!department) {
    this.selectedDepartment = null;
    this.selectedDepartmentType = '';
    this.selectedFCLLCL = 'LCL';
    this.filteredPorts = [...(this.portList || [])];
    this.filteredPOL = [...this.filteredPorts];
    this.filteredPOD = [...this.filteredPorts];
    this.polList = [...this.filteredPOL];
    this.podList = [...this.filteredPOD];
    this.tariffHeaderForm.patchValue({
      POOSid: null,
      POLSid: null,
      PODSid: null,
      FDCSid: null,
      POLTerminal: '',
      PODTerminal: '',
      ViaPortSid: null,
      MovementType: null, 
    });
    
    // Clear filtered charges when no department selected
    this.filteredCharges = [];
    return;
  }

  let deptObj = department;
  if (typeof department === 'number' || typeof department === 'string') {
    deptObj = this.departments?.find(d => Number(d.DepartmentMasterSid) === Number(department)) || { departmentType: '', FCLLCL: 'LCL' };
  }
    const isDeptChanged = !this.selectedDepartment || 
    this.selectedDepartment.DepartmentMasterSid !== deptObj.DepartmentMasterSid;
  this.selectedDepartment = deptObj;
  this.selectedDepartmentType = (deptObj.departmentType || '').toUpperCase();
  this.selectedFCLLCL = this.selectedDepartmentType === 'SEA'
    ? (deptObj.FCLLCL?.toUpperCase() || 'LCL')
    : 'AIR';
  if (isDeptChanged && !this.isEditMode) {
    this.clearPortSelections();
  }
  this.filteredPorts = this.getFilteredPortsBySegment(this.selectedFCLLCL);
  this.filteredPOL = [...this.filteredPorts];
  this.filteredPOD = [...this.filteredPorts];
  this.polList = [...this.filteredPOL];
  this.podList = [...this.filteredPOD];

  if (this.selectedDepartmentType === 'SEA') {
    this.tariffHeaderForm.get('MovementType')?.setValue('Sea');
  } else if (this.selectedDepartmentType === 'AIR') {
    this.tariffHeaderForm.get('MovementType')?.setValue('Air');
  }

  // Filter charges based on selected department
  // this.filterChargesByDepartment(deptObj);
  // this.filterChargesByDepartment(this.selectedDepartment);
  this.filterChargeBasedOnDept();
}
clearPortSelections(): void {
  // Clear form values
  this.tariffHeaderForm.patchValue({
    POOSid: null,
    POLSid: null,
    PODSid: null,
    FDCSid: null,
    POLTerminal: '',
    PODTerminal: '',
    ViaPortSid: null,
  });

  // Reset filtered lists
  this.filteredPOL = [...this.filteredPorts];
  this.filteredPOD = [...this.filteredPorts];
  this.polList = [...this.filteredPOL];
  this.podList = [...this.filteredPOD];
}
filterChargesByDepartment(department: any): void {
  if (!department || !this.chargeList || this.chargeList.length === 0) {
    this.filteredCharges = [];
    return;
  }

  const departmentId = department.DepartmentMasterSid;
  
  this.filteredCharges = (this.chargeList || []).filter(charge => {
    const departmentNames = charge.DepartmentMasterSid || [];
    
    // Map department names to full department objects
    const fullDepartments = departmentNames
      .map(name => this.departments.find(dept => dept.departmentName === name))
      .filter((dept): dept is any => Boolean(dept));

    // Check if any department matches the selected department ID
    return fullDepartments.some(dept => {
      if (!dept) return false;
      return dept.DepartmentMasterSid === departmentId;
    });
  });

  console.log("Filtered Charges for Department", this.filteredCharges);
}
  filterChargeBasedOnDept(){
    const deptId = this.tariffHeaderForm.get('DepartmentMasterSid')?.value;
    const departmentName = this.getDepartmentName(deptId);
    if(!departmentName || this.departments.length === 0){
      this.filteredCharges = [];
      return;
    } else {
      this.filteredCharges = this.chargeList.filter(ch =>{
        const departmentNames : any[] = ch.DepartmentMasterSid || [];
        return departmentNames.includes(departmentName);
      })
      console.log(this.filteredCharges,departmentName,this.chargeList)
    }
    
  }

  getDepartmentName(deptId:number){
    if(!deptId || this.departments.length === 0){
      return null;
    } else {
      return (this.departments.find(dep => dep.DepartmentMasterSid === deptId)?.departmentName);
    }
  }

  getFilteredPortsBySegment(segment: string): any[] {
    if (segment === 'AIR') {
      return this.portList.filter(port => port.PortType === 'Air');
    } else if (segment === 'FCL' || segment === 'LCL') {
      return this.portList.filter(port => port.PortType === 'Sea');
    }
    return this.portList;
  }

  handlePOLChange(selectedPort: any): void {
    if (!selectedPort) {
      this.filteredPOD = [...this.filteredPorts];
      return;
    }
    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
    this.tariffHeaderForm.get('POLSid')?.setValue(selectedPortSid, { emitEvent: false });
  }

  handlePODChange(selectedPort: any): void {
  if (!selectedPort) {
    this.filteredPOL = [...this.filteredPorts];
    this.tariffHeaderForm.get('FDCSid')?.setValue(null); // Clear FDC when POD is cleared
    return;
  }
  
  const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
  this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
  this.tariffHeaderForm.get('PODSid')?.setValue(selectedPortSid, { emitEvent: false });
  
  // ✅ Set FDC to the same value as POD
  this.tariffHeaderForm.get('FDCSid')?.setValue(selectedPortSid);
}


  updatePaginationData() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredTariffDetail = this.TariffDetailsList.slice(start, end);
  }

  resetForm() {
    this.filteredPorts = [...this.portList];
    this.filteredPOL = [...this.filteredPorts];
    this.filteredPOD = [...this.filteredPorts];

    if (this.isEditMode && this.TariffHeaderSid) {
      this.loadTariff(this.TariffHeaderSid);
      this.loadTariffDetails();
      return;
    }

    this.tariffHeaderForm.reset({
      DepartmentMasterSid: null,
      POOSid: '',
      POLSid: '',
      PODSid: '',
      FDCSid: '',
      ViaPortSid: '',
      POLTerminal: '',
      PODTerminal: '',
      Carrier: null,
    //   MovementType: null,
      AgentSid: null,
      IncoTerms: null,
    //   StuffingAt: null,
      status: 'Active',
      Remarks: ''
    });

    this.TariffDetailsList = [];
    this.filteredTariffDetail = [];
    this.totalNumberOfCollection = 0;
    this.page = 1;

    this.tariffHeaderForm.markAsUntouched();
    this.tariffHeaderForm.markAsPristine();
    this.tariffHeaderForm.updateValueAndValidity();

    this.tariffData = null;
    this.tariffDetailData = null;
    this.TariffHeaderSid = null;
    this.TariffDetailSid = null;
    this.isModalEditMode = false;
    this.btnDisable = true;

    this.polList = [...this.portList];
    this.podList = [...this.portList];

    this.minEffectiveDate = this.toNgbDateStruct(this.todayDate);
    this.minEffectiveFrom = null;

    this.tariffHeaderForm.get('POLTerminal')?.disable();
    this.tariffHeaderForm.get('PODTerminal')?.disable();
  }

  setPOLTerminal(event: any) {
    if (event) {
      const found = this.portList.find(port => port.PortMasterSid === event);
      const POLTerminal = found ? found.PortCode : '';
      this.tariffHeaderForm.get('POLTerminal')?.setValue(POLTerminal);
    }
  }

  setPODTerminal(event: any) {
    if (event) {
      const found = this.portList.find(port => port.PortMasterSid === event);
      const PODTerminal = found ? found.PortCode : '';
      this.tariffHeaderForm.get('PODTerminal')?.setValue(PODTerminal);
    }
  }

  setChargeCode(chargeCode: any) {
    const requiredCharge = this.chargeList.find(charge => charge.chargeCode === chargeCode);
    // (kept for future use)
  }

  loadTariffDetails() {
    this.masterServ.getAllTariffDetail().subscribe(
      (resp) => {
        const allTariffDetails = resp.data;
        if (this.TariffHeaderSid) {
          this.TariffDetailsList = allTariffDetails.filter(
            tariffDetail => tariffDetail.TariffHeaderSid === this.TariffHeaderSid
          );
        }
        this.totalNumberOfCollection = this.TariffDetailsList.length;
        this.updatePaginationData();
      },
      (error) => {
        console.error('Error Loading All Tariff Details', error);
      }
    );
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
  if (!date) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}

  filterPodList(port: any) {
    if (!port) {
      this.tariffHeaderForm.get('POLTerminal')?.setValue('');
      this.podList = [...(this.filteredPorts || this.portList || [])];
      return;
    }
    this.tariffHeaderForm.get('POLTerminal')?.setValue(port.PortCode);
    this.podList = (this.filteredPorts || this.portList).filter(each => each.PortMasterSid !== port.PortMasterSid);
  }
  
  filterPolList(port: any) {
  if (!port) {
    this.tariffHeaderForm.get('PODTerminal')?.setValue('');
    this.tariffHeaderForm.get('FDCSid')?.setValue(null); // Clear FDC when POD is cleared
    this.polList = [...(this.filteredPorts || this.portList || [])];
    return;
  }
  
  this.tariffHeaderForm.get('PODTerminal')?.setValue(port.PortCode);
  this.polList = (this.filteredPorts || this.portList).filter(each => each.PortMasterSid !== port.PortMasterSid);
  
  // ✅ Set FDC to the same value as POD
  this.tariffHeaderForm.get('FDCSid')?.setValue(port.PortMasterSid);
}

  showHeaderInfo() {
    if (!this.tariffData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.tariffData;
    modalRef.componentInstance.idLabel = 'Tariff Header Id';
    modalRef.componentInstance.idValue = this.tariffData?.TariffHeaderSid;
  }

  showDetailInfo() {
    if (!this.tariffDetailData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.tariffDetailData;
    modalRef.componentInstance.idLabel = 'Tariff Detail Id';
    modalRef.componentInstance.idValue = this.tariffDetailData?.TariffDetailSid;
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterServ.getTandCByCondition(payload).subscribe(
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
          modalRef.componentInstance.DocumentSid = this.TariffHeaderSid;
        } else {
          this.appSettingServ.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingServ.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  openEmail() {
    if (!this.tariffData) return;
    this.modalService.open(EmailEntryComponent, { size: 'lg', centered: true, backdrop: 'static' });
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
    modalRef.componentInstance.documentSid = this.TariffHeaderSid;
  }

  openEDoc() {
    if (!this.tariffData) return;
    this.modalService.open(EdocComponent, { size: 'lg', centered: true, backdrop: 'static' });
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.TariffHeaderSid
  }

      this.commonService.documentData.set(data)
}

 openFollowup() {
    if (!this.tariffData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.tariffData?.QuoteHeaderSid;
    modalRef.componentInstance.parentEmail = this.tariffData.Email;
    modalRef.componentInstance.parentSubject = `Quotation No.${this.tariffData.QuoteNumber} Date:${new Date(this.tariffData.QuoteDate).toLocaleDateString()}`;
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
 ngOnDestroy(): void {
    this.commonService.clearDocumentData()
 }  
  

  setChargeDetails(charge?: any) {
  if (!charge) {
    this.tariffDetailsForm.get('detailDescription')?.setValue('');
    this.tariffDetailsForm.get('detailUOMSid')?.setValue(null);
    return;
  }
  console.log('Charge Object:', charge);
  // Set UOM from charge
  this.tariffDetailsForm.get('detailUOMSid')?.setValue(charge.UOM);

  
  const chargeName = charge.chargeName || '';
  this.tariffDetailsForm.get('detailDescription')?.setValue(chargeName);

 
}

 setEffectiveDateBasedOnChargeCode(chargeCode?: string) {
  if (!chargeCode) {
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(null);
     const tomorrow = new Date(this.todayDate);
    this.minEffectiveFrom = this.toNgbDateStruct(tomorrow);
    return;
  }

  const sameChargeDetails = this.TariffDetailsList.filter(
    detail => detail.ChargeCode === chargeCode && detail.status === 'A'
  );

  if (sameChargeDetails.length === 0) {
    // NEW charge code - set to today's date
    // ✅ FIX: Add one day to compensate for the adapter issue
    const tomorrow = new Date();
    
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(tomorrow);
    this.minEffectiveFrom = this.toNgbDateStruct(tomorrow);
  } else {
    // EXISTING charge code logic remains the same
    const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
    const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
    const nextDay = new Date(maxExpiredDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(nextDay);
    this.minEffectiveFrom = this.toNgbDateStruct(nextDay);
  }
}
 onChargeCodeChange(chargeCode: string) {
  const selectedCharge = this.chargeList.find(c => c.chargeCode === chargeCode);
  
  // Skip auto date logic while editing
  if (this.isModalEditMode) {
    this.setChargeDetails(selectedCharge);
    return;
  }
  
  // CREATE flow - apply the business logic
  this.setEffectiveDateBasedOnChargeCode(chargeCode);
  console.log('Effective Date', this.tariffDetailsForm.get('detailEffectiveDate')?.value);
  this.setChargeDetails(selectedCharge);
}

  calculateMinEffectiveFrom(chargeCode?: string) {
  if (!chargeCode) {
    const tomorrow = new Date(this.todayDate);
    this.minEffectiveFrom = this.toNgbDateStruct(tomorrow);
    return;
  }

  // Filter only active records
  const sameChargeDetails = this.TariffDetailsList.filter(
    detail => detail.ChargeCode === chargeCode && detail.status === 'A'
  );

  if (sameChargeDetails.length === 0) {
    const tomorrow = new Date(this.todayDate);
    this.minEffectiveFrom = this.toNgbDateStruct(tomorrow);
  } else {
    const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
    const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
    const nextDay = new Date(maxExpiredDate);
    nextDay.setDate(nextDay.getDate() + 1);
    this.minEffectiveFrom = this.toNgbDateStruct(nextDay);
  }
}
  effectiveDateValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    // Bypass rule in EDIT mode
    if (this.isModalEditMode) return null;

    if (!control.value) return null;

    const chargeCode = control.parent?.get('detailChargeCode')?.value;
    const effectiveDate = new Date(control.value);
    
    if (!chargeCode) return null;

    // Reset time part for accurate date comparison
    effectiveDate.setHours(0, 0, 0, 0);
    const tomorrow = getDefaultTodayDate();
    tomorrow.setHours(0, 0, 0, 0);

    // For different charge code - must be today or future
    const sameChargeDetails = this.TariffDetailsList.filter(
      detail => detail.ChargeCode === chargeCode && detail.status === 'A'
    );

    if (sameChargeDetails.length === 0) {
      // Different charge code - must be today or future
      if (effectiveDate < tomorrow) {
        return { invalidEffectiveDate: 'Effective date cannot be in the past for new charge codes' };
      }
      return null;
    } else {
      // Same charge code - must be next day after last expired date
      const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
      const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
      maxExpiredDate.setHours(0, 0, 0, 0);
      
      const requiredEffectiveDate = new Date(maxExpiredDate);
      requiredEffectiveDate.setDate(requiredEffectiveDate.getDate() + 1);

      if (effectiveDate < requiredEffectiveDate) {
        return {
          invalidEffectiveDate: `Effective date must be ${requiredEffectiveDate.toLocaleDateString()} or later for this charge code`
        };
      }
      return null;
    }
  };
}

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
public getAmountDecimalPlaces(CurrencyMasterSid: number): number {
  const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
  if (currency) {
    const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
    return config?.amountDecimal || 2;
  }
  return 2;
}

public getFormattedAmount(amount: number, CurrencyMasterSid: number) {
  const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
  const input = {
    value: amount,
    currencyCode: currency?.currencyCode
  }
  return this.currencyFormatter.formatAmount(input, false);
}

  navigateToCreateTariff() {
    this.route.navigate(['master/tarrif/entry']);
  }

  
}

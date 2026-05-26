import { Component, HostListener, OnDestroy, OnInit, TemplateRef, Input } from '@angular/core';
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
import { catchError, forkJoin, of, Subject, debounceTime, takeUntil } from 'rxjs';
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
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

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
export class TarrifEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly containerRequiredUomCodes = new Set(['CON', '20F', '40F', '45F']);
  selectedDepartment: any;
  selectedDepartmentType: string = '';
  selectedFCLLCL: string = '';
  filteredPorts: any[] = [];
filteredPOO: any[] = [];
filteredPOL: any[] = [];
filteredPOD: any[] = [];
filteredFDC: any[] = [];
  departments: any[] = [];
 
  active = 1;
  modalRef: NgbModalRef;
  tariffHeaderForm!: FormGroup;
  tariffDetailsForm!: FormGroup;
  isEditMode: boolean = false;
  isPatchingDetailForm = false;
  isModalEditMode: boolean = false;
  setErrorMessage: boolean = false;
  TariffHeaderSid: number | null = null;
  TariffDetailSid: number | null = null;
  portList: Port[] = [];
  polList: Port[] = [];
  podList: Port[] = [];
  pooList: Port[] = [];
  fdcList: Port[] = [];
  chargeList: any[] = [];
  UOMList: any[] = [];
  departmentList: any[] = [];
  agentList: any[] = [];
  carrierList: any[] = [];
  companyList: any[] = [];
 
  incoList: any[] = [];
  isDataLoading: boolean = false;
  isCopiedTariffMode: boolean = false;
  pendingCopiedTariffData: any = null;
  tariffData: any;
  tariffDetailData: any;

  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  filteredCharges: any[] = [];
  containerTypeList: any[] = [];

  isDetailModalOpen: boolean = false;
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
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  minEffectiveDate = this.toNgbDateStruct(this.todayDate);
  minEffectiveFrom: NgbDateStruct | null;
  currentMenuId: number | null = null;
  TandCList: any;
  chargeTaxes: any[] = [];
  btnDisable: boolean = true;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  private lastPortFilterPayloadKey = '';

  editingDetailIndex: number | null = null;
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
  uomLookupConfig = {
    displayFields: ['UOMCode', 'UOMName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['UOMCode', 'UOMName'],
  };
  containerTypeLookupConfig = {
    displayFields: ['ContainerCode', 'ContainerName', 'ContainerSize'],
    displayLabels: ['Code', 'Name', 'Size'],
    labelFields: ['ContainerCode', 'ContainerName', 'ContainerSize'],
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
      private commonModalService : ModalService,
  ) { }

  ngOnInit(): void {
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  this.MenuMasterSid = sessionStorage.getItem('currentMenuId');

  this.initHeaderForm();
  this.initialFormValue = this.tariffHeaderForm.getRawValue();
  this.subscribeToFormChanges();

  const historyState = history?.state;
  const copiedTariffData = historyState?.copiedTariffData;
  const isCopiedTariff = historyState?.isCopiedTariff;

  if (isCopiedTariff && copiedTariffData) {
    history.replaceState({}, '', location.pathname);

    this.isEditMode = false;
    this.isCopiedTariffMode = true;
    this.TariffHeaderSid = null;
    this.minEffectiveDate = this.toNgbDateStruct(this.todayDate);

    // keep data and patch only after master data is loaded
    this.pendingCopiedTariffData = copiedTariffData;
  }

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
      this.isCopiedTariffMode = false;
      this.pendingCopiedTariffData = null;
      this.minEffectiveDate = undefined as any;
      this.loadTariff(this.TariffHeaderSid);
    } else {
      this.isEditMode = false;
      this.minEffectiveDate = this.toNgbDateStruct(this.todayDate);
    }
  });

  const userProfile = this.appSettingServ.getDecryptedUserProfile();
  if (userProfile) {
    this.userData = userProfile;
  }
}

  getUOMName(uomSid: any): string {
  if (!uomSid || !this.UOMList?.length) return '';
  const uom = this.UOMList.find((item: any) => item.UOMMasterSid === uomSid);
  return uom?.UOMName || uom?.UOMCode || '';
}

getContainerTypeName(sid: any): string {
  if (!sid || !this.containerTypeList?.length) return '';
  const ct = this.containerTypeList.find((c: any) => c.ContainerTypeMasterSid === sid);
  return ct?.ContainerName || '';
}

getCurrencyCode(currencySid: any): string {
  if (!currencySid || !this.currencyList?.length) return '';
  const currency = this.currencyList.find((item: any) => item.CurrencyMasterSid === currencySid);
  return currency?.currencyCode || '';
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
      tariffDetail: this.fb.array([]),
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
      detailContainerType: [null],
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

    this.tariffDetailsForm.get('detailUOMSid')?.valueChanges.subscribe(() => {
      this.updateContainerTypeValidators();
    });

    // Charge code change: only apply "next-day" rule in CREATE mode
    this.tariffDetailsForm.get('detailChargeCode')?.valueChanges.subscribe(chargeCode => {
  if (!chargeCode) {
    if (this.editingDetailIndex === null) {
      this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(null);
      this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    }
    return;
  }

  if (this.editingDetailIndex === null) {
    this.onChargeCodeChange(chargeCode);
  } else {
    this.setChargeDetails(this.chargeList.find(c => c.chargeCode === chargeCode));
  }
});

this.tariffDetailsForm.get('detailCargoType')?.valueChanges.subscribe(() => {
  const chargeCode = this.tariffDetailsForm.get('detailChargeCode')?.value;
  if (chargeCode && this.editingDetailIndex === null) {
    this.setEffectiveDateBasedOnChargeCode(chargeCode);
  }
});

this.tariffDetailsForm.get('detailContainerType')?.valueChanges.subscribe(() => {
  const chargeCode = this.tariffDetailsForm.get('detailChargeCode')?.value;
  if (chargeCode && this.editingDetailIndex === null) {
    this.setEffectiveDateBasedOnChargeCode(chargeCode);
  }
});

    this.updateContainerTypeValidators();
  }

  get tariffDetails(): FormArray {
  return this.tariffHeaderForm.get('tariffDetail') as FormArray;
}

  createTariffDetailFormGroup(detail?: any): FormGroup {
  return this.fb.group({
    TariffDetailSid: [detail?.TariffDetailSid ?? null],
    ChargeCode: [detail?.ChargeCode ?? null, [Validators.required]],
    Description: [detail?.Description ?? ''],
    CargoType: [detail?.CargoType ?? null, [Validators.required]],
    ContainerType: [detail?.ContainerType ?? null],
    UOMSid: [detail?.UOMSid ?? null, [Validators.required]],
    SaleCurrency: [detail?.SaleCurrency ?? null, [Validators.required]],
    SalePerUnitPrice: [detail?.SalePerUnitPrice ?? '', [Validators.required]],
    BuyCurrency: [detail?.BuyCurrency ?? null, [Validators.required]],
    BuyPerUnitPrice: [detail?.BuyPerUnitPrice ?? '', [Validators.required]],
    MinSale: [detail?.MinSale ?? ''],
    IsSlabApplicable: [detail?.IsSlabApplicable ?? 'N'],
    SlabFrom: [detail?.SlabFrom ?? ''],
    SlabTo: [detail?.SlabTo ?? ''],
    EffectiveDate: [detail?.EffectiveDate ? new Date(detail.EffectiveDate) : null, [Validators.required]],
    ExpiredOn: [detail?.ExpiredOn ? new Date(detail.ExpiredOn) : null, [Validators.required]],
    status: [detail?.status ?? 'A'],
    Remarks: [detail?.Remarks ?? ''],
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

  private isSameEffectiveDateGroup(detail: any, chargeCode: string, cargoType: string, containerType: any): boolean {
  if (detail.ChargeCode !== chargeCode) return false;
  if (detail.CargoType !== cargoType) return false;

  // ContainerType should be considered only if available
  const currentContainerType = containerType ?? null;
  const rowContainerType = detail.ContainerType ?? null;

  if (currentContainerType !== null && currentContainerType !== '' &&
      rowContainerType !== null && rowContainerType !== '') {
    return rowContainerType === currentContainerType;
  }

  return true;
}

  isContainerTypeRequiredForSelectedUom(): boolean {
    const uomSid = this.tariffDetailsForm?.get('detailUOMSid')?.value;
    return this.isContainerTypeRequiredForUom(uomSid);
  }

  private isContainerTypeRequiredForUom(uomSid: any): boolean {
    if (uomSid === null || uomSid === undefined || uomSid === '') {
      return false;
    }

    const matchedUom = this.UOMList?.find(
      (item: any) => Number(item.UOMMasterSid) === Number(uomSid)
    );
    const normalizedCode = String(matchedUom?.UOMCode || matchedUom?.UOMName || '')
      .trim()
      .toUpperCase();

    return this.containerRequiredUomCodes.has(normalizedCode);
  }

  private updateContainerTypeValidators(): void {
    const containerTypeControl = this.tariffDetailsForm?.get('detailContainerType');
    if (!containerTypeControl) {
      return;
    }

    if (this.isContainerTypeRequiredForSelectedUom()) {
      containerTypeControl.setValidators([Validators.required]);
    } else {
      containerTypeControl.clearValidators();
      containerTypeControl.setValue(null, { emitEvent: false });
    }

    containerTypeControl.updateValueAndValidity({ emitEvent: false });
  }

  openTariffDetailEntryModal(content: TemplateRef<any>, data?: any, index?: number) {
  if (!this.TariffHeaderSid && this.isEditMode) {
    this.appSettingServ.showError('Please save tariff header then try to add charges.');
    return;
  }

  if (this.isDetailModalOpen) return;

  const isExistingSavedDetail = !!data?.TariffDetailSid && !this.isCopiedTariffMode;
  this.isModalEditMode = isExistingSavedDetail;
  this.editingDetailIndex = index ?? null;
  this.TariffDetailSid = null;
  this.initDetailsForm();

  this.filterChargeBasedOnDept();

  if (data) {
    this.tariffDetailData = data;
    this.isPatchingDetailForm = true;

    this.tariffDetailsForm.patchValue({
      detailisSlabApplicable: data.IsSlabApplicable === 'Y',
      detailSlabFrom: data.SlabFrom || '',
      detailSlabTo: data.SlabTo || '',
      detailEffectiveDate: data.EffectiveDate ? new Date(data.EffectiveDate) : null,
      detailExpiredOn: data.ExpiredOn ? new Date(data.ExpiredOn) : null,
      detailChargeCode: data.ChargeCode ?? null,
      detailDescription: data.Description || '',
      detailCargoType: data.CargoType ?? null,
      detailContainerType: data.ContainerType ?? null,
      detailUOMSid: data.UOMSid ?? null,
      detailSaleCurrency: data.SaleCurrency ?? null,
      detailSalePerUnitPrice: data.SalePerUnitPrice ?? '',
      detailBuyCurrency: data.BuyCurrency ?? null,
      detailBuyPerUnitPrice: data.BuyPerUnitPrice ?? '',
      detailMinSale: data.MinSale || '',
      detailstatus: data.status === 'A' ? 'Active' : 'Suspended',
      detailRemarks: data.Remarks || ''
    },{ emitEvent: false });

    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(
      data.EffectiveDate ? new Date(data.EffectiveDate) : null,
      { emitEvent: false }
    );

    this.tariffDetailsForm.get('detailExpiredOn')?.setValue(
      data.ExpiredOn ? new Date(data.ExpiredOn) : null,
      { emitEvent: false }
    );

    this.isPatchingDetailForm = false;

    if (this.isModalEditMode) {
      this.TariffDetailSid = data.TariffDetailSid;
      this.minEffectiveFrom = null;

      this.isModalStatusEditable = true;
      this.setDetailControlsReadOnly(true);
      this.tariffDetailsForm.get('detailstatus')?.enable({ emitEvent: false });
    } else {
      // copied row / unsaved row -> treat like create mode
      this.TariffDetailSid = null;
      this.isModalStatusEditable = false;
      this.setDetailControlsReadOnly(false);

      this.minEffectiveFrom = data.EffectiveDate
        ? this.toNgbDateStruct(new Date(data.EffectiveDate))
        : this.toNgbDateStruct(new Date());

      this.tariffDetailsForm.get('detailstatus')?.setValue('Active', { emitEvent: false });
      this.tariffDetailsForm.get('detailstatus')?.enable({ emitEvent: false });
    }
  } else {
    // brand new detail
    const today = new Date();
    this.isModalEditMode = false;
    this.isModalStatusEditable = false;
    this.TariffDetailSid = null;

    this.setDetailControlsReadOnly(false);
    this.minEffectiveFrom = this.toNgbDateStruct(today);
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(today);
    this.tariffDetailsForm.get('detailstatus')?.setValue('Active', { emitEvent: false });
    this.tariffDetailsForm.get('detailstatus')?.enable({ emitEvent: false });
  }

  this.isDetailModalOpen = true;
  this.modalRef = this.modalService.open(content, {
    size: 'lg',
    centered: true,
    backdrop: 'static'
  });
  this.modalRef.hidden.subscribe(() => { this.isDetailModalOpen = false; });
}
  loadTariff(TariffHeaderSid: number) {
  this.masterServ.getTariffById(TariffHeaderSid).subscribe(
    (resp) => {
      if (!resp?.data) return;

      const data = resp.data;
      this.tariffData = data;

      const deptSid = Number(data.DepartmentMasterSid);
      const deptObj =
        this.departments?.find(d => Number(d.DepartmentMasterSid) === deptSid) || null;

      // 1. patch department first without firing valueChanges
      this.tariffHeaderForm.patchValue({
        DepartmentMasterSid: deptSid
      }, { emitEvent: false });

      // 2. build port lists based on department
      this.onDeptChange(deptObj ?? deptSid);

      // 3. patch remaining values after lists are ready
      this.tariffHeaderForm.patchValue({
        POOSid: data.POOSid ?? null,
        POLSid: data.POLSid ?? null,
        PODSid: data.PODSid ?? null,
        FDCSid: data.FDCSid ?? null,
        ViaPortSid: data.ViaPortSid ?? null,
        POLTerminal: data.POLTerminal ?? '',
        PODTerminal: data.PODTerminal ?? '',
        Carrier: data.Carrier ?? null,
        AgentSid: data.AgentSid ?? null,
        IncoTerms: data.IncoTerms ?? null,
        status: data.status === 'A' ? 'Active' : 'Suspended',
        Remarks: data.Remarks ?? ''
      }, { emitEvent: false });

      // 4. keep current selected ports inside filtered lists
      this.refreshPortFilters(true);
      this.applyPatchedPortSelections();

      this.tariffDetails.clear();
      (data.tariffDetail || []).forEach((detail: any) => {
        this.tariffDetails.push(this.createTariffDetailFormGroup(detail));
      });

      this.isStatusEditable = true;
      this.setHeaderControlsReadOnly(true);
      this.tariffHeaderForm.get('status')?.enable({ emitEvent: false });
      this.btnDisable = false;
      this.initialFormValue = this.tariffHeaderForm.getRawValue();
      this.isDirty = false;
      this.tariffHeaderForm.markAsPristine();
      this.tariffHeaderForm.markAsUntouched();
    },
    (error) => {
      this.appSettingServ.showError('Error Loading Tariff', error);
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

    const rawPorts = ports.data || ports || [];
    this.portList = rawPorts.map((p: any) => {
      const countryName =
        p.countryName ||
        p.countryMaster?.countryName ||
        p.country?.countryName ||
        p.CountryName ||
        '';

      const countryMasterSid =
        p.CountryMasterSid ||
        p.countryMaster?.CountryMasterSid ||
        p.country?.CountryMasterSid ||
        null;

      return {
        ...p,
        PortCode: p.PortCode || p.portCode,
        PortName: p.PortName || p.portName,
        PortMasterSid: p.PortMasterSid || p.portMasterSid,
        PortType: p.PortType || p.portType,
        CountryMasterSid: countryMasterSid,
        Country: countryName,
        countryName: countryName
      };
    });

    this.filteredPorts = [...this.portList];
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFDC = [];

    this.pooList = [];
    this.polList = [];
    this.podList = [];
    this.fdcList = [];

    this.agentList = agents.data;
    this.carrierList = carriers.data;
    this.departments = (departments || []).filter(
      (department: any) => !this.isServiceJobDepartment(department)
    );

    this.departmentList = [...this.departments];
    this.filterChargeBasedOnDept();
    this.companyList = companies;

    const rawCurrencies = currencies.data || currencies || [];
    this.currencyList = rawCurrencies.map((c: any) => ({
      ...c,
      countryName: c.countryName || c?.countryMaster?.countryName || ''
    }));

    this.incoList = incos;
    this.chargeTaxes = chargeTax.data;
    this.isDataLoading = false;

    this.loadModalFields().catch(err => console.error('loadModalFields error', err));

    // important: patch copied tariff only after all master data is ready
    if (this.pendingCopiedTariffData && !this.TariffHeaderSid) {
      this.patchCopiedTariff(this.pendingCopiedTariffData);
      this.pendingCopiedTariffData = null;
      this.appSettingServ.showSuccess('Tariff copied successfully. Please review and save.');
      return;
    }

    if (this.isEditMode && this.tariffData?.DepartmentMasterSid) {
      const deptSid = Number(this.tariffData.DepartmentMasterSid);
      const deptObj = this.departments.find(d => Number(d.DepartmentMasterSid) === deptSid) || null;
      this.onDeptChange(deptObj ?? deptSid);
    }
  }, err => console.error('loadAllFields error', err));
}

private normalizePortText(value: any): string {
  return String(value ?? '').trim().toUpperCase();
}

private toNumericValue(value: any): number | null {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

private getShipmentDirection(): 'EXPORT' | 'IMPORT' | '' {
  const departmentDirection = this.normalizePortText(this.selectedDepartment?.ExportImport);
  if (departmentDirection === 'EXPORT' || departmentDirection === 'IMPORT') {
    return departmentDirection as 'EXPORT' | 'IMPORT';
  }
  return '';
}

private normalizePortList(ports: any[] = []): any[] {
  return (ports || []).map((p: any) => {
    const countryName =
      p.countryName ||
      p.Country ||
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
      CountryMasterSid: p.CountryMasterSid || p.countryMaster?.CountryMasterSid || p.country?.CountryMasterSid || null,
      Country: countryName,
      countryName: countryName
    };
  });
}

private getLoginCountryMasterSid(): number | null {
  const branchInfo = this.appSettingService.getCurrentBranchInfo?.();
  return this.toNumericValue(
    this.currentBranch?.CountryMasterSid ??
    this.currentBranch?.branchMaster?.CountryMasterSid ??
    branchInfo?.CountryMasterSid ??
    branchInfo?.branchMaster?.CountryMasterSid ??
    this.currentCompany?.CountryMasterSid
  );
}

private applyPatchedPortSelections(): void {
  const pooSid = this.tariffHeaderForm.get('POOSid')?.value;
  const polSid = this.tariffHeaderForm.get('POLSid')?.value;
  const podSid = this.tariffHeaderForm.get('PODSid')?.value;
  const fdcSid = this.tariffHeaderForm.get('FDCSid')?.value;

  const selectedPOL = this.getPortBySid(polSid);
  const selectedPOD = this.getPortBySid(podSid);
  const selectedFDC = this.getPortBySid(fdcSid);

  this.pooList = [...(this.filteredPOO || [])];

  // POL list should contain current POL
  this.polList = [...(this.filteredPOL || [])];
  if (selectedPOL && !this.polList.some(p => Number(p.PortMasterSid) === Number(selectedPOL.PortMasterSid))) {
    this.polList = [selectedPOL, ...this.polList];
  }

  // POD list should contain current POD
  this.podList = [...(this.filteredPOD || [])];
  if (selectedPOD && !this.podList.some(p => Number(p.PortMasterSid) === Number(selectedPOD.PortMasterSid))) {
    this.podList = [selectedPOD, ...this.podList];
  }

  // FDC list should contain current FDC
  this.fdcList = [...(this.filteredFDC || [])];
  if (selectedFDC && !this.fdcList.some(p => Number(p.PortMasterSid) === Number(selectedFDC.PortMasterSid))) {
    this.fdcList = [selectedFDC, ...this.fdcList];
  }

  // terminals
  if (selectedPOL) {
    this.tariffHeaderForm.get('POLTerminal')?.setValue(selectedPOL.PortCode ?? '', { emitEvent: false });
  }
  if (selectedPOD) {
    this.tariffHeaderForm.get('PODTerminal')?.setValue(selectedPOD.PortCode ?? '', { emitEvent: false });
  }

  // re-apply values once lists are ready
  this.tariffHeaderForm.patchValue({
    POOSid: pooSid ?? null,
    POLSid: polSid ?? null,
    PODSid: podSid ?? null,
    FDCSid: fdcSid ?? null
  }, { emitEvent: false });
}

private getPortBySid(portSid: number | string | null | undefined): any | null {
  if (!portSid) {
    return null;
  }

  const allPorts = [
    ...(this.portList || []),
    ...(this.filteredPOO || []),
    ...(this.filteredPOL || []),
    ...(this.filteredPOD || []),
    ...(this.filteredFDC || [])
  ];

  return allPorts.find(
    port => Number(port.PortMasterSid) === Number(portSid)
  ) || null;
}

  private isServiceJobDepartment(department: any): boolean {
    const departmentName = this.normalizePortText(department?.departmentName);
    const departmentCode = this.normalizePortText(department?.DepartmentCode ?? department?.departmentCode);

    return departmentName === 'SERVICE JOB' || departmentCode === 'SJ';
  }

   openAuditLogs() {
      if (!this.tariffData?.TariffHeaderSid) return;
      const modalRef = this.modalService.open(AuditLogComponent, {
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'Tariff Logs';
      modalRef.componentInstance.tableName = 'TariffHeader';
      modalRef.componentInstance.recordId = this.tariffData?.TariffHeaderSid.toString();
      modalRef.componentInstance.screenName = 'Tariff';
    }
 

  loadModalFields(): Promise<void> {
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  
  return new Promise((resolve, reject) => {
    forkJoin({
      charges: this.masterServ.getAllCharges(CompanyMasterSid),
      UOMs: this.masterServ.getUOMsByType('C'),
      containerTypes: this.masterServ.getAllContainerTypes(),
    }).subscribe({
      next: ({ charges, UOMs, containerTypes }) => {
        this.chargeList = charges;
        this.UOMList = UOMs.data;
        this.containerTypeList = containerTypes || [];
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
    this.route.navigate(['/master/tarrif/list']);
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

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSave(resolve);
    });
  }

  onSave(resolve?: (value: boolean) => void) {
  if (this.isSaving) {
    if (resolve) resolve(false);
    return;
  }

  if (this.isEditMode && this.hasNoChangesToSave()) {
    this.appSettingServ.showWarning('No changes to save');
    this.tariffHeaderForm.markAsUntouched();
    if (resolve) resolve(false);
    return;
  }

  if (this.tariffHeaderForm.invalid) {
    this.tariffHeaderForm.markAllAsTouched();
    this.tariffHeaderForm.updateValueAndValidity();
    this.appSettingServ.showWarning('Please fill all required fields correctly');
    if (resolve) resolve(false);
    return;
  }

  if (!this.isEditMode && this.tariffDetails.length === 0) {
    this.appSettingServ.showWarning('Please add at least one tariff detail');
    if (resolve) resolve(false);
    return;
  }

  const formValue = this.tariffHeaderForm.getRawValue();
  const payload = this.coerceIntoRequiredFormat(formValue);

  if (this.isEditMode) {
    this.isSaving = true;
    this.masterServ.updateTariffById(this.TariffHeaderSid as number, payload).subscribe({
      next: (resp: any) => {
        this.isSaving = false;
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.isStatusEditable = false;
          this.setHeaderControlsReadOnly(true);
          this.loadTariff(this.TariffHeaderSid as number);
          this.btnDisable = true;
          if (resolve) resolve(true);
        } else {
          this.appSettingServ.showError(resp.message || 'Error updating tariff');
          if (resolve) resolve(false);
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error updating tariff: ', error);
        this.appSettingServ.showError('Error updating tariff');
        if (resolve) resolve(false);
      }
    });
    return;
  }

  this.isSaving = true;
  this.masterServ.createTariff(payload).subscribe({
    next: (resp: any) => {
      this.isSaving = false;
      if (resp.status) {
        this.appSettingService.showSuccess(resp.message);
        this.resetDirtyTrackingAfterSave();
        this.isCopiedTariffMode = false;
        this.pendingCopiedTariffData = null;
        const tariffId = resp?.data?.TariffHeaderSid;
        if (tariffId) {
          this.route.navigate(['master/tarrif/entry', tariffId]);
        }
        if (resolve) resolve(true);
      } else {
        this.appSettingServ.showError(resp.message);
        if (resolve) resolve(false);
      }
    },
    error: (error) => {
      this.isSaving = false;
      console.error('Error creating tariff : ', error);
      this.appSettingServ.showError('Error creating tariff');
      if (resolve) resolve(false);
    }
  });
}

private resetDirtyTrackingAfterSave(): void {
  this.initialFormValue = this.tariffHeaderForm.getRawValue();
  this.isDirty = false;
  this.tariffHeaderForm.markAsPristine();
  this.tariffHeaderForm.markAsUntouched();
}

  fullOnSaveFlow() {
  if (this.isSaving) return;

  if (this.isEditMode && this.hasNoChangesToSave()) {
    this.appSettingServ.showWarning('No changes to save');
    this.tariffHeaderForm.markAsUntouched();
    return;
  }

  if (this.tariffHeaderForm.invalid) {
    this.tariffHeaderForm.markAllAsTouched();
    this.tariffHeaderForm.updateValueAndValidity();
    this.appSettingServ.showWarning('Please fill all required fields correctly');
    return;
  }

  if (!this.isEditMode && this.tariffDetails.length === 0) {
    this.appSettingServ.showWarning('Please add at least one tariff detail');
    return;
  }

  const formValue = this.tariffHeaderForm.getRawValue();
  const payload = this.coerceIntoRequiredFormat(formValue);

  if (this.isEditMode) {
    this.isSaving = true;
    this.masterServ.updateTariffById(this.TariffHeaderSid as number, payload).subscribe(
      (resp: any) => {
        this.isSaving = false;
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.loadTariff(this.TariffHeaderSid as number);
        } else {
          this.appSettingServ.showError(resp.message);
        }
      },
      (error) => {
        this.isSaving = false;
        console.error('Error loading Tariff : ', error);
        this.appSettingServ.showError('Error updating tariff');
      }
    );
  } else {
    this.isSaving = true;
    this.masterServ.createTariff(payload).subscribe(
      (resp: any) => {
        this.isSaving = false;
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
        this.isSaving = false;
        console.error('Error loading Tariff : ', error);
        this.appSettingServ.showError('Error creating tariff');
      }
    );
  }
}

  onModalSave() {
  if (this.tariffDetailsForm.invalid) {
    this.tariffDetailsForm.markAllAsTouched();
    this.tariffDetailsForm.updateValueAndValidity();
    this.appSettingServ.showWarning('Please fill all the required fields');
    return;
  }

  const formValue = this.tariffDetailsForm.getRawValue();

  const payload = {
    TariffDetailSid: this.TariffDetailSid || null,
    IsSlabApplicable: formValue.detailisSlabApplicable ? 'Y' : 'N',
    // Keep non-slab values aligned with FormArray shape to avoid false dirty state
    SlabFrom: formValue.detailisSlabApplicable ? formValue.detailSlabFrom : '',
    SlabTo: formValue.detailisSlabApplicable ? formValue.detailSlabTo : '',
    EffectiveDate: formValue.detailEffectiveDate,
    ExpiredOn: formValue.detailExpiredOn,
    ChargeCode: formValue.detailChargeCode,
    Description: formValue.detailDescription,
    CargoType: formValue.detailCargoType,
    ContainerType: formValue.detailContainerType,
    UOMSid: formValue.detailUOMSid,
    SaleCurrency: formValue.detailSaleCurrency,
    SalePerUnitPrice: formValue.detailSalePerUnitPrice,
    BuyCurrency: formValue.detailBuyCurrency,
    BuyPerUnitPrice: formValue.detailBuyPerUnitPrice,
    MinSale: formValue.detailMinSale,
    status: formValue.detailstatus === 'Active' ? 'A' : 'S',
    Remarks: formValue.detailRemarks,
  };

  if (this.editingDetailIndex !== null && this.editingDetailIndex > -1) {
    this.tariffDetails.at(this.editingDetailIndex).patchValue(payload);
  } else {
    this.tariffDetails.push(this.createTariffDetailFormGroup(payload));
  }

  this.tariffDetailsForm.reset();
  this.TariffDetailSid = null;
  this.editingDetailIndex = null;
  this.modalRef.close();
}

  coerceIntoRequiredFormat(formValue: any) {
  const createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
  const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];

  const tariffDetail = (formValue.tariffDetail || []).map((detail: any) => ({
    TariffDetailSid: detail.TariffDetailSid || undefined,
    ChargeCode: detail.ChargeCode,
    Description: detail.Description,
    UOMSid: detail.UOMSid,
    SaleCurrency: detail.SaleCurrency,
    SalePerUnitPrice: detail.SalePerUnitPrice,
    SlabFrom: detail.IsSlabApplicable === 'Y' ? detail.SlabFrom : null,
    SlabTo: detail.IsSlabApplicable === 'Y' ? detail.SlabTo : null,
    status: detail.status === 'Active' || detail.status === 'A' ? 'A' : 'S',
    Remarks: detail.Remarks,
    BuyCurrency: detail.BuyCurrency,
    BuyPerUnitPrice: detail.BuyPerUnitPrice,
    CargoType: detail.CargoType,
    ContainerType: detail.ContainerType ?? null,
    EffectiveDate: detail.EffectiveDate,
    IsSlabApplicable: detail.IsSlabApplicable === 'Y' ? 'Y' : 'N',
    ExpiredOn: detail.ExpiredOn,
    MinSale: detail.MinSale,
    ...(detail.TariffDetailSid ? { updatedBy } : { createdBy: updatedBy }),
  }));

  if (this.isEditMode) {
    return {
      status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      updatedBy,
      tariffDetail
    };
  }

  return {
    DepartmentMasterSid: formValue.DepartmentMasterSid,
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    POOSid: formValue.POOSid,
    POLSid: formValue.POLSid,
    PODSid: formValue.PODSid,
    FDCSid: formValue.FDCSid,
    ViaPortSid: formValue.ViaPortSid,
    POLTerminal: formValue.POLTerminal,
    PODTerminal: formValue.PODTerminal,
    AgentSid: formValue.AgentSid,
    Carrier: formValue.Carrier,
    IncoTerms: formValue.IncoTerms,
    Remarks: formValue.Remarks,
    MovementType: formValue.MovementType,
    status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
    createdBy,
    tariffDetail
  };
}

  deleteTariffDetail(index: number) {
  const row = this.tariffDetails.at(index).getRawValue();

  const dialRef = this.matdial.open(DeleteWarningComponent);
  dialRef.afterClosed().subscribe((res) => {
    if (!res) return;

    if (row?.TariffDetailSid && this.isEditMode) {
      this.masterServ.deleteTariffDetailById(row.TariffDetailSid).subscribe(
        (resp) => {
          if (resp.data) {
            this.tariffDetails.removeAt(index);
            this.appSettingServ.showSuccess('Tariff Detail Deleted Successfully');
          } else {
            this.appSettingServ.showError('Error Deleting Tariff Detail');
          }
        },
        (error) => {
          console.error('Error Deleting Tariff Detail', error);
        }
      );
    } else {
      this.tariffDetails.removeAt(index);
    }
  });
}

 onDeptChange(department: any): void {
  if (!department) {
    this.selectedDepartment = null;
    this.selectedDepartmentType = '';
    this.selectedFCLLCL = 'LCL';

    this.filteredPorts = [];
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFDC = [];

    this.pooList = [];
    this.polList = [];
    this.podList = [];
    this.fdcList = [];

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

    this.filteredCharges = [];
    return;
  }

   let deptObj = department;
  if (typeof department === 'number' || typeof department === 'string') {
    deptObj =
      this.departments?.find(
        d => Number(d.DepartmentMasterSid) === Number(department)
      ) || { departmentType: '', FCLLCL: 'LCL' };
  }

  const isDeptChanged =
    !this.selectedDepartment ||
    this.selectedDepartment.DepartmentMasterSid !== deptObj.DepartmentMasterSid;

  this.selectedDepartment = deptObj;
  this.selectedDepartmentType = this.normalizePortText(deptObj.departmentType);
  this.selectedFCLLCL = this.resolveSelectedSegment(deptObj);

  if (isDeptChanged && !this.isEditMode) {
    this.tariffHeaderForm.patchValue({
      POOSid: null,
      POLSid: null,
      PODSid: null,
      FDCSid: null,
      ViaPortSid: null,
      POLTerminal: '',
      PODTerminal: ''
    }, { emitEvent: false });
  }

  if (isDeptChanged) {
    this.filteredPOO = [];
    this.filteredPOL = [];
    this.filteredPOD = [];
    this.filteredFDC = [];
    this.pooList = [];
    this.polList = [];
    this.podList = [];
    this.fdcList = [];
    this.lastPortFilterPayloadKey = '';
  }

  this.refreshPortFilters();

  if (this.selectedDepartmentType === 'SEA') {
    this.tariffHeaderForm.get('MovementType')?.setValue('Sea');
  } else if (this.selectedDepartmentType === 'AIR') {
    this.tariffHeaderForm.get('MovementType')?.setValue('Air');
  } else if (this.selectedDepartmentType === 'ROAD') {
    this.tariffHeaderForm.get('MovementType')?.setValue('Road');
  } else {
    this.tariffHeaderForm.get('MovementType')?.setValue(null);
  }

  this.filterChargeBasedOnDept();
}

private resolveSelectedSegment(department: any): string {
  const departmentType = this.normalizePortText(department?.departmentType);
  const fclLcl = this.normalizePortText(department?.FCLLCL);

  if (departmentType === 'SEA') {
    return fclLcl || 'LCL';
  }

  if (departmentType === 'AIR') {
    return 'AIR';
  }

  if (departmentType === 'ROAD') {
    return 'ROAD';
  }

  if (departmentType === 'TRANSPORT') {
    return 'TRANSPORT';
  }

  if (departmentType === 'OTHER' || departmentType === 'OTHERS') {
    return 'OTHER';
  }

  return fclLcl || departmentType || 'LCL';
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

  this.filteredPOO = [];
  this.filteredPOL = [];
  this.filteredPOD = [];
  this.filteredFDC = [];
  this.pooList = [];
  this.polList = [];
  this.podList = [];
  this.fdcList = [];
  this.lastPortFilterPayloadKey = '';
  this.refreshPortFilters(true);
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

private applyPortFilterLists(filteredLists: any): void {
  this.filteredPorts = filteredLists.filteredPorts;
  this.filteredPOO = filteredLists.filteredPOO;
  this.filteredPOL = filteredLists.filteredPOL;
  this.filteredPOD = filteredLists.filteredPOD;
  this.filteredFDC = filteredLists.filteredFDC;

  this.pooList = [...this.filteredPOO];
  this.polList = [...this.filteredPOL];
  this.podList = [...this.filteredPOD];
  this.fdcList = [...this.filteredFDC];
}

private refreshPortFilters(force: boolean = false): void {
  if (!this.selectedDepartment?.DepartmentMasterSid) {
    this.applyPortFilterLists({
      filteredPorts: [],
      filteredPOO: [],
      filteredPOL: [],
      filteredPOD: [],
      filteredFDC: []
    });
    this.lastPortFilterPayloadKey = '';
    return;
  }

  const payload = {
    DepartmentMasterSid: this.selectedDepartment.DepartmentMasterSid,
    ShipmentType: this.getShipmentDirection(),
    LoginCountryMasterSid: this.getLoginCountryMasterSid(),
    PortFieldType: 'ALL',
    SelectedPOO: this.tariffHeaderForm.get('POOSid')?.value || null,
    SelectedPOL: this.tariffHeaderForm.get('POLSid')?.value || null,
    SelectedPOD: this.tariffHeaderForm.get('PODSid')?.value || null,
    SelectedFPOD: this.tariffHeaderForm.get('FDCSid')?.value || null
  };

  const payloadKey = JSON.stringify(payload);
  if (!force && payloadKey === this.lastPortFilterPayloadKey) {
    return;
  }
  this.lastPortFilterPayloadKey = payloadKey;
  const requestPayloadKey = payloadKey;

  this.operationServ.getFilteredPorts(payload).subscribe({
    next: (resp: any) => {
      if (requestPayloadKey !== this.lastPortFilterPayloadKey) {
        return;
      }
      const data = resp?.data || resp || {};
      this.applyPortFilterLists({
        filteredPorts: this.normalizePortList(data.POO || []),
        filteredPOO: this.normalizePortList(data.POO || []),
        filteredPOL: this.normalizePortList(data.POL || []),
        filteredPOD: this.normalizePortList(data.POD || []),
        filteredFDC: this.normalizePortList(data.FPOD || data.FDC || [])
      });
      this.applyPatchedPortSelections();
    },
    error: (error) => {
      console.error('Error loading filtered tariff ports:', error);
      this.applyPortFilterLists({
        filteredPorts: [],
        filteredPOO: [],
        filteredPOL: [],
        filteredPOD: [],
        filteredFDC: []
      });
    }
  });
}

handlePOOChange(selectedPort: any): void {
  const selectedPortSid = selectedPort?.PortMasterSid ?? selectedPort ?? null;
  this.tariffHeaderForm.get('POOSid')?.setValue(selectedPortSid, { emitEvent: false });
  this.refreshPortFilters();
}

  handlePOLChange(selectedPort: any): void {
  const selectedPortSid = selectedPort?.PortMasterSid ?? selectedPort ?? null;
  this.tariffHeaderForm.get('POLSid')?.setValue(selectedPortSid, { emitEvent: false });
  this.tariffHeaderForm.get('POLTerminal')?.setValue(selectedPort?.PortCode || '', { emitEvent: false });
  this.refreshPortFilters();
}

handlePODChange(selectedPort: any): void {
  const selectedPortSid = selectedPort?.PortMasterSid ?? selectedPort ?? null;
  this.tariffHeaderForm.get('PODSid')?.setValue(selectedPortSid, { emitEvent: false });
  this.tariffHeaderForm.get('PODTerminal')?.setValue(selectedPort?.PortCode || '', { emitEvent: false });

  // Same as your current behavior: FDC defaults to POD
  this.tariffHeaderForm.get('FDCSid')?.setValue(selectedPortSid, { emitEvent: false });

  this.refreshPortFilters();
}

handleFDCChange(selectedPort: any): void {
  const selectedPortSid = selectedPort?.PortMasterSid ?? selectedPort ?? null;
  this.tariffHeaderForm.get('FDCSid')?.setValue(selectedPortSid, { emitEvent: false });
  this.refreshPortFilters();
}


  resetForm() {
  this.filteredPorts = [...this.portList];
  this.filteredPOO = [];
  this.filteredPOL = [];
  this.filteredPOD = [];
  this.filteredFDC = [];

  this.pooList = [];
  this.polList = [];
  this.podList = [];
  this.fdcList = [];
  this.lastPortFilterPayloadKey = '';

  if (this.isEditMode && this.TariffHeaderSid) {
    this.loadTariff(this.TariffHeaderSid);
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
    AgentSid: null,
    IncoTerms: null,
    status: 'Active',
    Remarks: ''
  });

  this.tariffDetails.clear();

  this.tariffHeaderForm.markAsUntouched();
  this.tariffHeaderForm.markAsPristine();
  this.tariffHeaderForm.updateValueAndValidity();
  this.initialFormValue = this.tariffHeaderForm.getRawValue();
  this.isDirty = false;

  this.tariffData = null;
  this.tariffDetailData = null;
  this.TariffHeaderSid = null;
  this.TariffDetailSid = null;
  this.editingDetailIndex = null;
  this.isModalEditMode = false;
  this.btnDisable = true;

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

  

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
  if (!date) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
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

openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.TariffHeaderSid;
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
    const today = new Date(this.todayDate);
    this.minEffectiveFrom = this.toNgbDateStruct(today);
    return;
  }

  const cargoType = this.tariffDetailsForm.get('detailCargoType')?.value;
  const containerType = this.tariffDetailsForm.get('detailContainerType')?.value;

  const sameDetails = this.tariffDetails.getRawValue().filter(
    (detail: any) =>
      detail.status === 'A' &&
      this.isSameEffectiveDateGroup(detail, chargeCode, cargoType, containerType)
  );

  if (sameDetails.length === 0) {
    const today = new Date();
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(today);
    this.minEffectiveFrom = this.toNgbDateStruct(today);
  } else {
    const expiredDates = sameDetails.map((detail: any) => new Date(detail.ExpiredOn));
    const maxExpiredDate = new Date(Math.max(...expiredDates.map((date: Date) => date.getTime())));
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
    const today = new Date(this.todayDate);
    this.minEffectiveFrom = this.toNgbDateStruct(today);
    return;
  }

  const cargoType = this.tariffDetailsForm.get('detailCargoType')?.value;
  const containerType = this.tariffDetailsForm.get('detailContainerType')?.value;

  const sameDetails = this.tariffDetails.getRawValue().filter(
    (detail: any, index: number) =>
      detail.status === 'A' &&
      index !== this.editingDetailIndex &&
      this.isSameEffectiveDateGroup(detail, chargeCode, cargoType, containerType)
  );

  if (sameDetails.length === 0) {
    const today = new Date(this.todayDate);
    this.minEffectiveFrom = this.toNgbDateStruct(today);
  } else {
    const expiredDates = sameDetails.map((detail: any) => new Date(detail.ExpiredOn));
    const maxExpiredDate = new Date(Math.max(...expiredDates.map((date: Date) => date.getTime())));
    const nextDay = new Date(maxExpiredDate);
    nextDay.setDate(nextDay.getDate() + 1);
    this.minEffectiveFrom = this.toNgbDateStruct(nextDay);
  }
}
  effectiveDateValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;

    const chargeCode = control.parent?.get('detailChargeCode')?.value;
    const cargoType = control.parent?.get('detailCargoType')?.value;
    const containerType = control.parent?.get('detailContainerType')?.value;
    const effectiveDate = new Date(control.value);

    if (!chargeCode || !cargoType) return null;

    effectiveDate.setHours(0, 0, 0, 0);
    const today = getDefaultTodayDate();
    today.setHours(0, 0, 0, 0);

    const sameDetails = this.tariffDetails.getRawValue().filter(
      (detail: any, index: number) =>
        detail.status === 'A' &&
        index !== this.editingDetailIndex &&
        this.isSameEffectiveDateGroup(detail, chargeCode, cargoType, containerType)
    );

    if (sameDetails.length === 0) {
      if (effectiveDate < today) {
        return {
          invalidEffectiveDate: 'Effective date cannot be in the past'
        };
      }
      return null;
    }

    const expiredDates = sameDetails.map((detail: any) => new Date(detail.ExpiredOn));
    const maxExpiredDate = new Date(Math.max(...expiredDates.map((date: Date) => date.getTime())));
    maxExpiredDate.setHours(0, 0, 0, 0);

    const requiredEffectiveDate = new Date(maxExpiredDate);
    requiredEffectiveDate.setDate(requiredEffectiveDate.getDate() + 1);

    if (effectiveDate < requiredEffectiveDate) {
      return {
        invalidEffectiveDate: `Effective date must be ${requiredEffectiveDate.toLocaleDateString()} or later`
      };
    }

    return null;
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

  copyTariff(): void {
  if (!this.tariffData) {
    this.appSettingServ.showWarning('No tariff data to copy');
    return;
  }

  this.commonModalService.confirm(
    'Are you sure you want to copy this tariff?',
    'Copy Tariff',
    'Copy'
  )?.then((confirmed) => {
    if (confirmed) {
      this.performTariffCopy();
    }
  });

  // if you don't have confirm in commonService, use your existing modal confirm method instead
}

private performTariffCopy(): void {
  const copiedData = this.prepareCopiedTariffData();

  this.route.navigate(['master/tarrif/entry'], {
    state: {
      copiedTariffData: copiedData,
      isCopiedTariff: true
    }
  });
}

private prepareCopiedTariffData(): any {
  const copiedData = {
    ...this.tariffData
  };

  Object.assign(copiedData, {
    TariffHeaderSid: null,
    status: 'A'
  });

  copiedData.tariffDetail = (copiedData.tariffDetail || []).map((detail: any) => ({
    ...detail,
    TariffDetailSid: null,
    EffectiveDate: null,
    ExpiredOn: null,
    status: 'A'
  }));

  return copiedData;
}

private patchCopiedTariff(data: any): void {
  this.tariffData = data;

  const deptSid = Number(data.DepartmentMasterSid);
  const deptObj =
    this.departments?.find(d => Number(d.DepartmentMasterSid) === deptSid) || null;

  // patch department first
  this.tariffHeaderForm.patchValue({
    DepartmentMasterSid: deptSid
  }, { emitEvent: false });

  this.selectedDepartment = deptObj ?? null;
  this.selectedDepartmentType = this.normalizePortText((deptObj as any)?.departmentType);
  this.selectedFCLLCL = this.resolveSelectedSegment(deptObj ?? {});

  // build fresh filtered lists for copied department
  this.onDeptChange(deptObj ?? deptSid);

  // patch copied selected ports
  this.tariffHeaderForm.patchValue({
    POOSid: data.POOSid ?? null,
    POLSid: data.POLSid ?? null,
    PODSid: data.PODSid ?? null,
    FDCSid: data.FDCSid ?? null,
    ViaPortSid: data.ViaPortSid ?? null,
    POLTerminal: data.POLTerminal ?? '',
    PODTerminal: data.PODTerminal ?? '',
    Carrier: data.Carrier ?? null,
    AgentSid: data.AgentSid ?? null,
    IncoTerms: data.IncoTerms ?? null,
    status: 'Active',
    Remarks: data.Remarks ?? ''
  }, { emitEvent: false });

  // now re-filter based on copied POL/POD
  this.refreshPortFilters(true);
  this.applyPatchedPortSelections();

  this.tariffDetails.clear();
  (data.tariffDetail || []).forEach((detail: any) => {
    this.tariffDetails.push(this.createTariffDetailFormGroup({
      ...detail,
      TariffDetailSid: null,
      EffectiveDate: null,
      ExpiredOn: null,
      status: 'A'
    }));
  });

  this.setHeaderControlsReadOnly(false);
  this.tariffHeaderForm.get('POLTerminal')?.disable({ emitEvent: false });
  this.tariffHeaderForm.get('PODTerminal')?.disable({ emitEvent: false });
  this.tariffHeaderForm.get('status')?.enable({ emitEvent: false });
  this.btnDisable = false;
  this.initialFormValue = this.tariffHeaderForm.getRawValue();
  this.isDirty = false;
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

private subscribeToFormChanges(): void {
  this.tariffHeaderForm.valueChanges
    .pipe(takeUntil(this.destroy$), debounceTime(300))
    .subscribe(() => {
      this.isDirty = !this.deepEqual(this.initialFormValue, this.tariffHeaderForm.getRawValue());
    });
}

private hasNoChangesToSave(): boolean {
  const raw = this.tariffHeaderForm.getRawValue();
  return this.deepEqual(raw, this.initialFormValue) && !this.isDirty;
}

private normalizeValue(value: any): any {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (Array.isArray(value)) return value.map(item => this.normalizeValue(item));
  if (typeof value === 'object') {
    return Object.keys(value).reduce((result: any, key: string) => {
      result[key] = this.normalizeValue(value[key]);
      return result;
    }, {});
  }
  if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
  return value;
}

private deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  this.commonService.clearDocumentData();
}

  
}

import { Component, HostListener, OnDestroy, OnInit,ViewChild  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbDateStruct, NgbDatepickerModule, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { forkJoin, firstValueFrom } from 'rxjs';
import { JournalVoucherService } from '../journal-voucher.service';
import { AccountsService } from '../../accounts.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { CommonService } from 'src/app/common/common.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CompanySettingsManagerService, CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { VoucherPeriodValidationService, VoucherDateConstraints } from 'src/app/common/voucher-period-validation.service';
import { JournalVoucherPrintComponent } from '../print/journal-voucher-print/journal-voucher-print.component';
import { consistentExchangeRatesValidator, getExchangeRateErrorMessage } from 'src/app/core/ValidationFn/exRateConsistency.validators';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import {NgbDateAdapter,NgbDateParserFormatter, NgbDate} from '@ng-bootstrap/ng-bootstrap';
import { getDefaultTodayDate } from 'src/app/common/helper';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { ToastrService } from 'ngx-toastr';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { SearchableDropdown } from "src/app/component/searchable-dropdown/searchable-dropdown.component";
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-journal-voucher-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectModule,
    NgbDropdownModule,
    DecimalPrecisionDirective,
    SearchableDropdown
],
  templateUrl: './journal-voucher-entry.component.html',
  styles: [``],
    providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
  ],

})
export class JournalVoucherEntryComponent implements OnInit,  HasUnsavedChanges, OnDestroy  {

  isDirty: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  currentCompanyCurrency: CurrencySettings;
  currentCompanyCountry: {
    CountryMasterSid: number;
    countryName: string;
    countryCode: string;
  };
  bookingModeCountry: string = 'india';
  currentBranchState: {
    StateMasterSid: number;
    stateName: string;
    stateCode: string;
  };
  currentBranchStateName: string;
  currentBranchCity: {
    CityMasterSid: number;
    cityName: string;
    cityCode: string;
  };
  currentCompanyCountryCode: string;
  currentBranchCityId: number;
  editMode = false;
  voucherHeaderSid: number | null = null;
  isPosted = false;
  todayDateInNgbStruct!: NgbDateStruct;
  isSaving = false;
  isTermsAndConditionsEnabled: boolean = true;
  isAutoPosting: boolean = true;
  formatCurrencyAmountBeforeConcludingLocal: boolean = true;
  currentMenuId: number;
  TandCList: any[] = [];
  customerList: any[] = [];
  currentClauseId: any;
  // Add with other properties
  defaultCurrencyId: number | null = null;
  defaultCurrencyCode: string = '';
  // Add these properties from vendor invoice component
  currentCompany: any;
  filteredChargeList: any[][] = [];
  currentBranch: any;
  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;
  currentFinancialYear: number;
  currentCountry: number;
  currentCurrency: number;
  currentUserCurrency: string;
  currentUserCountry: string;
  currentUserState: string;
  userData: any;
  currUserEmail: string | null = null;
  MenuMasterSid: any;
  // Master Data Lists
  coaList: any[] = [];
  subledgerList: any[] = [];
  currencyList: any[] = [];
  departmentList: any[] = [];
  chargeList: any[] = [];
  masterJobList: any[][] = [];
  houseJobList: any[][] = [];
  costCenterList: any[] = [];
  profitCenterList: any[] = [];
  voucherData: any;
  hssacList: any[][] = [];
  uomList: any[] = [];
  companyCurrency: any;
  currentCurrencyCode: string = '';
  HSSACLookupConfig = {
    displayFields: ['HSSACCode', 'HSSACName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['HSSACCode'],
  };
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;

  LEDGERLookupConfig = {
    displayFields: ['LedgerName', 'SubGroupName'],
    displayLabels: ['Ledger Name', 'SubGroup Name'],
    labelFields: ['LedgerName'],
  };

  statusList = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  drCrList = [
    { id: 'D', name: 'D' },
    { id: 'C', name: 'C' },
  ];

  voucherConstraints: VoucherDateConstraints = {
    isClosed: false, errorMessage: null
  };
  // Gates the inline error label and button-disable: create=after save-click, edit=after date-change
  showVoucherDateError = false;

  get isReadOnly(): boolean {
    if (!this.editMode) return false;
    return this.voucherData?.PostStatus !== 'U' || this.voucherData?.Status !== 'A';
  }
  private showWarningFlags: boolean[] = [];
  manuallyEditedNarrationRows: Set<number> = new Set<number>();
  private isPatchingEditData: boolean = false;
  private copiedVoucherData: any = null;
  private isCopiedVoucher: boolean = false;
  

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private journalVoucherService: JournalVoucherService,
    private accountsService: AccountsService,
    private maasterService: MasterService,
    private dropdownStore: DropdownStore,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    public mps: MenuPermissionService,
    private modalService: NgbModal,
    private commonService: CommonService,
    private masterService: MasterService,
    private companySettings: CompanySettingsManagerService,
    private spinner: NgxSpinnerService,
    private currencyFormatter: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private voucherPeriodService: VoucherPeriodValidationService,
    private toastr: ToastrService,
    private commonModalService: ModalService,
  ) { }

  ngOnInit(): void {
    const currentFinancialYear =
      this.appSettingService.getCurrentFinancialYear();
      if (currentFinancialYear) {
        this.currentFinancialYear = Number(currentFinancialYear.YearMasterSid);
        this.fyMinDate = toNgbDateStruct(currentFinancialYear.StartDate);
        const fyEnd = new Date(currentFinancialYear.EndDate);
        const today = getDefaultTodayDate();
        this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
      }
    this.loadUserAndCompanyData();
    this.mps.init().subscribe();
    this.loadTermsAndConditionsConfig();
    this.checkVoucherPostingMechanism();
    this.initializeForm();
    this.setTodayDate();

    const historyState = history?.state;
    this.copiedVoucherData = historyState?.copiedJournalVoucherData;
    this.isCopiedVoucher = !!historyState?.isCopiedJournalVoucher;
    if (this.isCopiedVoucher && this.copiedVoucherData) {
      history.replaceState({}, '', location.pathname);
    }

    this.loadMasterData();
    this.loadVoucherPeriods();
    this.checkEditMode();
    this.subledgerTypes = [];
    if (!this.editMode) {
    setTimeout(() => {
      this.initialFormValue = this.form.getRawValue();
      this.subscribeToFormChanges();
    }, 0);
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
    this.saveDraftWithCallback(resolve);
  });
}

private subscribeToFormChanges() {
  this.form.valueChanges
    .pipe(takeUntil(this.destroy$), debounceTime(300))
    .subscribe(() => {
      this.isDirty = !this.deepEqual(
        this.initialFormValue,
        this.form.getRawValue()
      );
    });
}

private saveDraftWithCallback(resolve?: (value: boolean) => void) {
  const fy = this.appSettingService.getCurrentFinancialYear();
  if (fy) {
    const voucherDate = new Date(this.form.getRawValue().voucherDate);
    const fyStart = new Date(fy.StartDate);
    const fyEnd = new Date(fy.EndDate);
    if (voucherDate < fyStart || voucherDate > fyEnd) {
      this.appSettingService.showWarning(
        `Voucher date must be within the financial year (${fy.YearName})`
      );
      if (resolve) resolve(false);
      return;
    }
  }
  const raw = this.form.getRawValue();

  this.applyVoucherDateConstraints();
  if (this.voucherConstraints.isClosed) {
    if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
    if (resolve) resolve(false);
    return;
  }

  if (!this.isFormValid()) {
    if (resolve) resolve(false);
    return;
  }

  
  
  if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
    this.appSettingService.showWarning('No changes to save');
    this.form.markAsUntouched();
    if (resolve) resolve(false);
    return;
  }

  this.saveJournalVoucherWithCallback(false, resolve);
}

  private saveJournalVoucherWithCallback(isFinal: boolean, resolve?: (value: boolean) => void) {
  if (this.form.hasError('inconsistentExchangeRates')) {
    const errorMsg = getExchangeRateErrorMessage(this.form, this.currencyList);
    this.appSettingService.showError(errorMsg);
    if (resolve) resolve(false);
    return;
  }

  let hasInvalidExchangeRate = false;
  this.details.controls.forEach((control, index) => {
    const detailGroup = control as FormGroup;
    const currencyId = detailGroup.get('currencyMasterSid')?.value;
    const exchangeRate = detailGroup.get('exchangeRate')?.value;
    const companyCurrencyId = this.currentCompany?.CurrencyMasterSid;
    
    if (currencyId && currencyId !== companyCurrencyId && 
        (!exchangeRate || exchangeRate === 0)) {
      hasInvalidExchangeRate = true;
      this.appSettingService.showError(`Row ${index + 1}: Exchange rate cannot be 0.`);
    }
  });

  if (hasInvalidExchangeRate) {
    if (resolve) resolve(false);
    return;
  }

  if (!this.isFormValid()) {
    if (resolve) resolve(false);
    return;
  }

  const payload = this.preparePayload();

  this.isSaving = true;
  this.spinner.show();

  const saveObservable = this.voucherHeaderSid
    ? this.journalVoucherService.updateJournalVoucherById(this.voucherHeaderSid, payload)
    : this.journalVoucherService.createJournalVoucher(payload);

  saveObservable.subscribe({
    next: async (response: any) => {
      if (response?.status) {
        const voucherHeaderSid = response.data?.VoucherHeaderSid || this.voucherHeaderSid;
        
        this.isDirty = false;
        
        if (isFinal && voucherHeaderSid) {
          await this.postVoucher(voucherHeaderSid);
          if (resolve) resolve(true);
        } else {
          this.spinner.hide();
          this.isSaving = false;
          const message = isFinal ? 'Journal voucher saved and posted successfully!' : 'Journal voucher saved as draft successfully!';
          this.appSettingService.showSuccess(message);
          this.loadVoucherForEdit(voucherHeaderSid);
          if (voucherHeaderSid) {

  if (!this.voucherHeaderSid) {
    // NEW RECORD
    this.voucherHeaderSid = voucherHeaderSid;
    this.router.navigate(['/accounts/journal-voucher/entry', voucherHeaderSid]);
  } else {
    // UPDATE RECORD → Reload latest data
    this.loadVoucherForEdit(voucherHeaderSid);
  }

  this.initialFormValue = this.form.getRawValue();
}
          
          if (resolve) resolve(true);
        }
      } else {
        this.spinner.hide();
        this.isSaving = false;
        const errorMessage = response?.message || 'Error saving journal voucher';
        this.appSettingService.showError(errorMessage);
        if (resolve) resolve(false);
      }
    },
    error: (err) => {
      this.spinner.hide();
      this.isSaving = false;
      console.error('Save journal voucher error', err);
      this.appSettingService.showError('Failed to save journal voucher.');
      if (resolve) resolve(false);
    }
  });
}

  copyJournalVoucher(): void {
    if (!this.voucherData) {
      this.appSettingService.showWarning('No journal voucher data to copy');
      return;
    }

    this.commonModalService.confirm(
      'Are you sure you want to copy this journal voucher?',
      'Copy Journal Voucher',
      'Copy'
    ).then((confirmed) => {
      if (confirmed) {
        this.performJournalVoucherCopy();
      }
    });
  }

  private performJournalVoucherCopy(): void {
    this.spinner.show();
    const copiedData = this.prepareCopiedJournalVoucherData();

    this.router.navigate(['/accounts/journal-voucher/entry'], {
      state: {
        copiedJournalVoucherData: copiedData,
        isCopiedJournalVoucher: true,
      },
    });
  }

  private prepareCopiedJournalVoucherData(): any {
    const copiedData = { ...this.voucherData };

    copiedData.VoucherHeaderSid = null;
    copiedData.VoucherNumber = '';
    copiedData.VoucherDate = getDefaultTodayDate();
    copiedData.PostDate = null;
    copiedData.PostStatus = 'U';
    copiedData.Status = 'A';
    copiedData.PostedOn = null;

    if (Array.isArray(copiedData.VoucherDetail)) {
      copiedData.VoucherDetail = copiedData.VoucherDetail.map((detail: any) => ({
        ...detail,
        VoucherDetailSid: null,
      }));
    }

    return copiedData;
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
    return value.map(v => this.normalizeValue(v));
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


  get debitTotal(): number {
    if (!this.details || this.details.length === 0) {
      return 0;
    }

    const companyCurrencyId = this.currentCompany?.CurrencyMasterSid;

    const total = this.details.controls.reduce((total, control) => {
      if (control.get('IsAutoGenerated')?.value === 'Y') {
        return total;
      }

      if (control.get('drCr')?.value === 'D') {
        const localAmount = toNumber(control.get('localAmount')?.value);
        const taxAmount = toNumber(control.get('taxAmount')?.value);
        return total + localAmount + taxAmount;
      }

      return total;
    }, 0);

    return this.getFormattedAmount(total, companyCurrencyId);
  }

  get creditTotal(): number {
    if (!this.details || this.details.length === 0) {
      return 0;
    }

    const companyCurrencyId = this.currentCompany?.CurrencyMasterSid;

    const total = this.details.controls.reduce((total, control) => {
      if (control.get('IsAutoGenerated')?.value === 'Y') {
        return total;
      }

      if (control.get('drCr')?.value === 'C') {
        const localAmount = toNumber(control.get('localAmount')?.value);
        const taxAmount = toNumber(control.get('taxAmount')?.value);
        return total + localAmount + taxAmount;
      }

      return total;
    }, 0);

    return this.getFormattedAmount(total, companyCurrencyId);
  }

  get difference(): number {
    const companyCurrencyId = this.currentCompany?.CurrencyMasterSid;
    const diff = Math.abs(this.debitTotal - this.creditTotal);

    return this.getFormattedAmount(diff, companyCurrencyId);
  }

  get formattedDebitTotal() {
    return this.debitTotal

  }

  get formattedCreditTotal() {
    return this.creditTotal;
  }

  get formattedDifference() {
    return this.difference
  }

  loadUserAndCompanyData(): void {
    try {
      const userProfile = this.appSettingService.getDecryptedUserProfile();
      if (userProfile) {
        this.userData = userProfile;
        this.currUserEmail = userProfile.userEmail;
      }


      this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
      this.currentBranch = this.appSettingService.getCurrentBranchInfo();
      this.MenuMasterSid = this.mps.getMenuId();
      this.mps.init().subscribe();
      const currentFinancialYear = this.appSettingService.getCurrentFinancialYear();
      this.currentCompanyCountry =
        this.appSettingService.getCurrentCompanyCountry();
      this.currentCompanyCurrency = this.companySettings.getCurrencySettings();
      this.currentBranchState = this.appSettingService.getCurrentBranchState();
      this.currentBranchCity = this.appSettingService.getCurrentBranchCity();
      if (currentFinancialYear) {
        this.currentFinancialYear = Number(currentFinancialYear.YearMasterSid);
      }
      if (this.currentCompanyCountry) {
        this.currentCountry =
          this.currentCompanyCountry.CountryMasterSid ||
          this.currentCompany?.CountryMasterSid;
        this.currentCompanyCountryCode = String(
          this.currentCompanyCountry.countryCode ||
          this.currentCompany?.countryMaster?.countryCode
        ).toLowerCase();
        this.bookingModeCountry = this.currentCompanyCountry.countryName;
      }
      if (this.currentBranchState) {
        this.currentBranchStateName =
          this.currentBranchState?.stateName ||
          this.currentBranch.stateMaster?.stateName;
      }
      if (this.currentBranchCity) {
        this.currentBranchCityId =
          this.currentBranchCity.CityMasterSid ||
          this.currentBranchCity.CityMasterSid;
      }
    } catch (e) {
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }
  }

  initializeForm(): void {
   
     const today = getDefaultTodayDate();
    const fy = this.appSettingService.getCurrentFinancialYear();
    const defaultVoucherDate = fy && (today < new Date(fy.StartDate) || today > new Date(fy.EndDate)) ? fy.EndDate : today;
    this.form = this.fb.group({
      voucherNumber: [{ value: '', disabled: true }],
      voucherDate: [defaultVoucherDate],
      DocumentNumber:[null],
      DocumentDate:[null],
      narration: ['', [Validators.required, Validators.maxLength(200)]],
      remarks: ['', Validators.maxLength(200)],
      Status: ['A', Validators.required],
      PostedOn: [{ value: null, disabled: true }],
      postStatus: [{ value: 'Unposted', disabled: true }],
      details: this.fb.array([]),
    });
    const companyCurrencyId = this.currentCompany?.CurrencyMasterSid ||
      this.currentCompanyCurrency?.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency?.code;
    this.form.get('narration')?.valueChanges.subscribe((newNarration)=>{
      this.propagateHeaderNarrationToDetails(newNarration);
    });
    if (companyCurrencyId && companyCurrencyCode) {
      this.form.setValidators(
        consistentExchangeRatesValidator(companyCurrencyId, companyCurrencyCode)
      );
    }
    
    if (!this.editMode) {
      this.initializeDefaultCurrency();
    }

  }
  private propagateHeaderNarrationToDetails(headerNarration: string): void {
  if (!headerNarration) return;
  
  this.details.controls.forEach((control, index) => {
    const detailGroup = control as FormGroup;
    
    if (this.manuallyEditedNarrationRows.has(index)) return;
    
    if (detailGroup.get('IsAutoGenerated')?.value === 'Y') return;
    
    detailGroup.patchValue({
      narration: headerNarration
    }, { emitEvent: false });
  });
}

  initializeDefaultCurrency(): void {
    const companyCurrencyId = this.currentCompany?.CurrencyMasterSid || this.companyCurrency?.currencyMasterSid;

    if (companyCurrencyId) {

      this.defaultCurrencyId = companyCurrencyId;
      this.defaultCurrencyCode = this.currentCurrencyCode;
    }
  }

  setTodayDate(): void {
    const today = new Date();
    this.todayDateInNgbStruct = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy && (today < new Date(fy.StartDate) || today > new Date(fy.EndDate))) {
      const fyEnd = toNgbDateStruct(fy.EndDate);
      this.form.patchValue({ voucherDate: fyEnd });
    } else {
      this.form.patchValue({ voucherDate: this.todayDateInNgbStruct });
    }
  }

  loadVoucherPeriods(): void {
    this.voucherPeriodService.loadPeriods(
      this.currentCompany?.CompanyMasterSid,
      this.currentBranch?.BranchMasterSid,
      this.currentFinancialYear,
      () => this.applyVoucherDateConstraints()
    );
  }

  applyVoucherDateConstraints(): void {
    // Edit mode AND user hasn't changed the date → skip (allow save without checking).
    if ((this.voucherHeaderSid || this.editMode) && !this.showVoucherDateError) {
      this.voucherConstraints = { isClosed: false, errorMessage: null };
      return;
    }
    // Create mode, or edit mode after user changed the date → validate like create.
    const voucherDate = this.form?.get('voucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'GL');
  }

  onVoucherDateChange(): void {
    this.applyVoucherDateConstraints();
    // Edit mode: reveal error label + gate button-disable now that user has changed the date
    if (this.voucherHeaderSid) this.showVoucherDateError = true;
  }

  loadMasterData(): void {
    this.spinner.show();

    forkJoin({
      currencies: this.operationService.getAllCurrencies(),
      departments: this.dropdownStore.loadDepartments({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid
      }),
      costCenters: this.accountsService.getAllCostCenters(),
      profitCenters: this.accountsService.getAllProfitCenters(),
      uom: this.operationService.getAllUom(),
      coa: this.accountsService.getAllCoaWithLedgerCategory({
        LedgerCategory: 'Ledger',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid
      }),
      subledger: this.maasterService.getAllSuledgermaster(),
      charges: this.accountsService.getAllCharges(this.currentCompany?.CompanyMasterSid),
      customers: this.masterService.getAllCustomers(this.currentCompany?.CompanyMasterSid)
    }).subscribe({
      next: (result) => {
        const rawCurrencies: any[] = Array.isArray(result.currencies)
        ? result.currencies
        : result.currencies?.data || [];
      this.currencyList = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
        this.currencyConfigService.initializeConfigurations(this.currencyList);
        this.departmentList = result.departments;
        this.costCenterList = result.costCenters.data;
        this.profitCenterList = result.profitCenters.data;
        this.uomList = result.uom?.data || [];
        this.coaList = result.coa?.data || [];
        this.subledgerList = result.subledger?.data || [];
        this.chargeList = result.charges || [];
        this.customerList = result.customers || [];

        // console.log('Currency List loaded:', this.currencyList);

        // Find the company currency in the loaded list
        const companyCurrency = this.currencyList.find(
          currency => currency.CurrencyMasterSid === this.currentCurrency
        );

        if (companyCurrency) {
          // console.log('Found company currency in list:', companyCurrency);
          this.companyCurrency = companyCurrency;
          this.currentCurrencyCode = companyCurrency.currencyCode;
        }

        // Apply default currency to all detail lines (for new entries only)
        if (!this.editMode) {
          this.patchDefaultCurrencyToAllDetails();
        }

        // After all data is loaded, load voucher if in edit mode
        if (this.editMode && this.voucherHeaderSid) {
          this.loadVoucherForEdit(this.voucherHeaderSid);
        } else if (this.isCopiedVoucher && this.copiedVoucherData) {
          this.loadCopiedVoucherForNewEntry(this.copiedVoucherData);
        } else {
          this.spinner.hide();
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error loading master data:', err);
        this.appSettingService.showError('Failed to load master data', 'Error');
      },
    });
  }

  patchDefaultCurrencyToAllDetails(): void {
    // Only patch for new entries (not edit mode)
    if (this.editMode || !this.companyCurrency || !this.currencyList.length) return;

    // console.log('Patching default currency to all detail lines:', {
    //   currencyId: this.companyCurrency.CurrencyMasterSid,
    //   currencyCode: this.companyCurrency.currencyCode
    // });

    // Patch currency to all existing detail lines
    this.details.controls.forEach((control, index) => {
      const detailGroup = control as FormGroup;
      const currentCurrencyId = detailGroup.get('currencyMasterSid')?.value;

      // Only patch if no currency is selected
      if (!currentCurrencyId) {
        // console.log(`Patching currency to detail line ${index}`);

        detailGroup.patchValue({
          currencyMasterSid: this.companyCurrency.CurrencyMasterSid,
          currencyCode: this.companyCurrency.currencyCode
        }, { emitEvent: false });

        // Fetch exchange rate for the company currency
        this.fetchExchangeRate(detailGroup, this.companyCurrency.CurrencyMasterSid);
      }
    });
  }

  loadCOAList(): void {
    this.accountsService.getAllCoaWithLedgerCategory({
      LedgerCategory: 'Ledger',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid
    }).subscribe({
      next: (response: any) => {
        this.coaList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading COA list:', err);
      },
    });
  }

  loadSubledgerList(): void {
    this.maasterService.getAllSuledgermaster().subscribe({
      next: (response: any) => {
        this.subledgerList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading subledger list:', err);
      },
    });
  }

  loadChargeList(): void {
    this.accountsService.getAllCharges(this.currentCompany?.CompanyMasterSid).subscribe({
      next: (charges) => {
        this.chargeList = charges;
      },
      error: (err) => {
        console.error('Error loading charge list:', err);
      },
    });
  }

  checkEditMode(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.editMode = true;
        this.voucherHeaderSid = +params['id'];
        this.initializeForm();
        this.form.get('Status')?.enable(); // Enable for edit mode
      } else {
        this.editMode = false;
        this.initializeForm();
        this.form.get('Status')?.disable();
        this.addDetailLine();
      }
    });
  }

  formatDateForDisplay(date: string | Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  loadVoucherForEdit(id: number): void {
    this.journalVoucherService.getJournalVoucherById(id).subscribe({
      next: (response) => {
        this.isPatchingEditData = true;
        const voucher = response.data;
        this.voucherData = voucher;
        if (!voucher) {
          this.appSettingService.showError('Voucher not found', 'Error');
          this.router.navigate(['/accounts/journal-voucher/list']);
          return;
        }

        this.isPosted = voucher.PostStatus === 'P';

        const voucherDate = new Date(voucher.VoucherDate);
        const voucherDateStruct: NgbDateStruct = {
          year: voucherDate.getFullYear(),
          month: voucherDate.getMonth() + 1,
          day: voucherDate.getDate(),
        };
        const documentDate = new Date(voucher.DocumentDate);
        const documentDateStruct: NgbDateStruct = {
          year: documentDate.getFullYear(),
          month: documentDate.getMonth() + 1,
          day: documentDate.getDate(),
        };

        // Create form patch object
        const formPatchData: any = {
          voucherNumber: voucher.VoucherNumber,
          voucherDate: voucher.VoucherDate,
          narration: voucher.Narration,
          DocumentNumber: voucher.DocumentNumber,
          DocumentDate: voucher.DocumentDate, 
          remarks: voucher.Remarks,
          Status: voucher.Status,
          postStatus: voucher.PostStatus === 'P' ? 'Posted' : 'Unposted',
        };

        // Only patch PostedOn if the voucher is actually posted
        if (voucher.PostStatus === 'P' && voucher.PostDate) {
          formPatchData.PostedOn = this.formatDateForDisplay(voucher.PostDate);
        }

        this.form.patchValue(formPatchData);
        this.applyVoucherDateConstraints();
        // Edit mode: restrict the date picker to the original voucher's month so user
        // cannot change the voucher date to a different month.
        const _jvOrigDate = new Date(voucher.VoucherDate);
        if (!isNaN(_jvOrigDate.getTime())) {
          const _y = _jvOrigDate.getFullYear(), _m = _jvOrigDate.getMonth() + 1;
          const _monthEnd = new Date(_y, _m, 0);
          const _today = new Date(); _today.setHours(0, 0, 0, 0);
          const _effectiveEnd = _monthEnd < _today ? _monthEnd : _today;
          this.fyMinDate = { year: _y, month: _m, day: 1 };
          this.fyMaxDate = { year: _effectiveEnd.getFullYear(), month: _effectiveEnd.getMonth() + 1, day: _effectiveEnd.getDate() };
        }
           // Clear the manually edited tracking set
      this.manuallyEditedNarrationRows.clear();
      
      // Store header narration for comparison
      const headerNarration = voucher.Narration;

        // IMPORTANT: Don't disable the entire form for posted vouchers
        // Instead, we'll handle field disabling at the individual control level
        if (this.isPosted || voucher.Status === 'S') {
          // Disable the main form controls but keep subledger selection visible
          this.form.disable();
        } 

        this.details.clear();

        if (voucher.VoucherDetail && Array.isArray(voucher.VoucherDetail)) {
          
          this.subledgerTypes = new Array(voucher.VoucherDetail.length).fill('');

          // Load all details
          const detailPromises = voucher.VoucherDetail.map(async (detail: any, index: number) => {
            const detailGroup = this.createDetailGroup();

            const isAutoGenerated = detail.IsAutoGenerated === 'Y';
            const isPosted = voucher.PostStatus === 'P';
            const isSuspended = voucher.Status === 'S';

            // FOR POSTED VOUCHERS: Initially disable all fields
            if (isPosted || isSuspended) {
              detailGroup.disable({ emitEvent: false });
            }
             if (detail.Narration && detail.Narration !== headerNarration) {
            this.manuallyEditedNarrationRows.add(index);
          }
            // Patch basic values first
            detailGroup.patchValue({
              VoucherDetailSid: detail.VoucherDetailSid,
              coaMasterSid: detail.COAMasterSid,
              ledgerMasterSid: detail.LedgerMasterSid,
              currencyMasterSid: detail.CurrencyMasterSid,
              currencyCode: detail.CurrencyCode,
              exchangeRate: (detail.ExchangeRate) || 1,
              currencyAmount: (detail.Amount) || 0.0,
              localAmount: (detail.LocalAmount) || 0.0,
              drCr: detail.DrCr,
              narration: detail.Narration,
              departmentMasterSid: detail.DepartmentMasterSid,
              chargeMasterSid: detail.ChargeMasterSid,
              chargeDescription: detail.ChargeDescription || '',
              HSSACCode: detail.hSSACMaster?.HSSACCode || detail.HSSACCode || '',
              hssacMasterSid: detail.HSSACMasterSid || null,
              masterJobSid: detail.MasterJobSid,
              IsAutoGenerated: detail.IsAutoGenerated || 'N',
              houseJobSid: detail.HouseJobSid,
              taxPercentage: (detail.TaxPercentage1) || 0,
              taxAmount: (detail.TaxAmount1) || 0,
              costCenterMasterSid: detail.CostCenter,
              profitCenterMasterSid: detail.ProfitCenter,
            });
            this.updateCurrencyControlsForCoa(detailGroup, detail.COAMasterSid);
            this.updateSubledgerValidator(detailGroup, detail.COAMasterSid);

            // For auto-generated rows in posted vouchers
            if (isAutoGenerated) {
              detailGroup.patchValue({
                filteredSubledgers: [detail.subledgerMaster]
              }, { emitEvent: false });
            }

            this.details.push(detailGroup);

            const rowIndex = this.details.length - 1;

            // Handle auto-generated rows
            if (isAutoGenerated) {
              this.subledgerTypes[rowIndex] = detail.subledgerMaster?.SubledgerType || 'Tax';
              this.filteredChargeList[rowIndex] = [];
              this.masterJobList[rowIndex] = [];
              this.houseJobList[rowIndex] = [];
              this.hssacList[rowIndex] = [];

              this.setupDetailCalculations(detailGroup);
              this.disableChargeFieldsForRow(detailGroup);

              // For posted vouchers, keep disabled
              if (isPosted) {
                detailGroup.disable({ emitEvent: false });
              } else {
                detailGroup.get('coaMasterSid')?.disable();
                detailGroup.get('ledgerMasterSid')?.disable();
              }

              return detailGroup;
            }

            // NORMAL ROWS HANDLING
            this.setupDetailCalculations(detailGroup);

            const dept = this.departmentList.find(dep => dep.DepartmentMasterSid === detail.DepartmentMasterSid);

            // Set department first
            if (dept) {
              this.filterDetailsWithDept(dept, rowIndex, true);
            }

            // Handle charge and HSSAC
            if (detail.ChargeMasterSid) {
              await this.handleChargeForEdit(detailGroup, detail);
            }

            // Handle jobs
            if (detail.MasterJobSid) {
              await this.handleJobsForEdit(detailGroup, detail, rowIndex);
            }

            if (detail.COAMasterSid && this.currentCompany?.CompanyMasterSid) {
              const payload = {
                CompanyMasterSid: this.currentCompany.CompanyMasterSid,
                COAMasterSid: detail.COAMasterSid
              };

              try {
                const subledgerResp = await firstValueFrom(
                  this.operationService.getSubledgerMasterById(payload)
                );

                if (subledgerResp && subledgerResp.data) {
                  this.subledgerTypes[rowIndex] = subledgerResp.data.SubledgerType || '';
                  this.updateChargeFieldStates(rowIndex);
                }
              } catch (err) {
                console.error('Error fetching subledger type for edit:', err);
              }
            }

            await this.handleSubledgerForEdit(detailGroup, detail, rowIndex);

            // FOR POSTED VOUCHERS: Re-enable only for viewing (not editing)
            if (isPosted || isSuspended) {
              // Enable form controls but make them readonly for display
              detailGroup.enable({ emitEvent: false });
              // Keep them disabled for editing
              Object.keys(detailGroup.controls).forEach(key => {
                detailGroup.get(key)?.disable({ emitEvent: false });
              });
            }

            return detailGroup;
          });

          Promise.all(detailPromises).then(() => {
            // console.log('Form details after loading:', this.details.value);
            // console.log('subledgerTypes array:', this.subledgerTypes);

            // Call refreshSubledgerFiltersForRow for each row to ensure proper filtering
            this.details.controls.forEach((control, index) => {
              this.refreshSubledgerFiltersForRow(index, true);
            });

            this.spinner.hide();
          }).finally(() => {
            this.isPatchingEditData = false;
            setTimeout(() => {
              this.initialFormValue = this.form.getRawValue();
              this.isDirty = false;
              this.subscribeToFormChanges();
            }, 0);
          });
        } else {
          this.spinner.hide();
          this.isPatchingEditData = false;
          setTimeout(() => {
            this.initialFormValue = this.form.getRawValue();
            this.isDirty = false;
            this.subscribeToFormChanges();
          }, 0);
        }
      },
      error: (err) => {
        console.error('Error loading voucher:', err);
        this.appSettingService.showError('Failed to load voucher details', 'Error');
        this.router.navigate(['/accounts/journal-voucher/list']);
        this.isPatchingEditData = false;
        this.spinner.hide();
      },
    });
  }

  async loadCopiedVoucherForNewEntry(voucher: any): Promise<void> {
    this.isPatchingEditData = true;

    if (!voucher) {
      this.appSettingService.showWarning('No journal voucher data to copy');
      this.spinner.hide();
      this.isPatchingEditData = false;
      return;
    }

    try {
      const copiedVoucher = {
        ...voucher,
        VoucherHeaderSid: null,
        VoucherNumber: '',
        VoucherDate: getDefaultTodayDate(),
        Narration: '',
        PostDate: null,
        PostStatus: 'U',
        Status: 'A',
        PostedOn: null,
        VoucherDetail: Array.isArray(voucher.VoucherDetail)
          ? voucher.VoucherDetail.map((detail: any) => ({
              ...detail,
              VoucherDetailSid: null,
            }))
          : [],
      };

      this.voucherData = copiedVoucher;
      this.voucherHeaderSid = null;
      this.isPosted = false;

      const formPatchData: any = {
        voucherNumber: '',
        voucherDate: '',
        narration: '',
        DocumentNumber: '',
        DocumentDate: '',
        remarks: copiedVoucher.Remarks,
        Status: 'A',
        postStatus: 'Unposted',
      };

      this.form.patchValue(formPatchData, { emitEvent: false });

      this.details.clear();
      this.manuallyEditedNarrationRows.clear();
      this.subledgerTypes = new Array(copiedVoucher.VoucherDetail.length).fill('');

      if (copiedVoucher.VoucherDetail.length) {
        const detailPromises = copiedVoucher.VoucherDetail.map(async (detail: any) => {
          const detailGroup = this.createDetailGroup();

          detailGroup.patchValue({
            VoucherDetailSid: null,
            coaMasterSid: detail.COAMasterSid,
            ledgerMasterSid: detail.LedgerMasterSid,
            currencyMasterSid: detail.CurrencyMasterSid,
            currencyCode: detail.CurrencyCode,
            exchangeRate: detail.ExchangeRate || 1,
            currencyAmount: detail.Amount || 0.0,
            localAmount: detail.LocalAmount || 0.0,
            drCr: detail.DrCr,
            narration: detail.Narration,
            departmentMasterSid: detail.DepartmentMasterSid,
            chargeMasterSid: detail.ChargeMasterSid,
            chargeDescription: detail.ChargeDescription || '',
            HSSACCode: detail.HSSACCode || '',
            hssacMasterSid: detail.HSSACMasterSid || null,
            masterJobSid: detail.MasterJobSid,
            houseJobSid: detail.HouseJobSid,
            taxPercentage: detail.TaxPercentage1 || 0,
            taxAmount: detail.TaxAmount1 || 0,
            costCenterMasterSid: detail.CostCenter,
            profitCenterMasterSid: detail.ProfitCenter,
            IsAutoGenerated: detail.IsAutoGenerated || 'N',
          }, { emitEvent: false });
          this.updateCurrencyControlsForCoa(detailGroup, detail.COAMasterSid);
          this.updateSubledgerValidator(detailGroup, detail.COAMasterSid);

          if (detail.IsAutoGenerated === 'Y') {
            detailGroup.patchValue({
              filteredSubledgers: [detail.subledgerMaster]
            }, { emitEvent: false });
          }

          this.setupDetailCalculations(detailGroup);
          this.details.push(detailGroup);

          const rowIndex = this.details.length - 1;

          if (detail.IsAutoGenerated === 'Y') {
            this.subledgerTypes[rowIndex] = detail.subledgerMaster?.SubledgerType || 'Tax';
            this.filteredChargeList[rowIndex] = [];
            this.masterJobList[rowIndex] = [];
            this.houseJobList[rowIndex] = [];
            this.hssacList[rowIndex] = [];
            this.disableChargeFieldsForRow(detailGroup);
            detailGroup.get('coaMasterSid')?.disable();
            detailGroup.get('ledgerMasterSid')?.disable();
            return detailGroup;
          }

          const dept = this.departmentList.find(dep => dep.DepartmentMasterSid === detail.DepartmentMasterSid);
          if (dept) {
            this.filterDetailsWithDept(dept, rowIndex, true);
          }

          if (detail.ChargeMasterSid) {
            await this.handleChargeForEdit(detailGroup, detail);
          }

          if (detail.MasterJobSid) {
            await this.handleJobsForEdit(detailGroup, detail, rowIndex);
          }

          if (detail.COAMasterSid && this.currentCompany?.CompanyMasterSid) {
            const payload = {
              CompanyMasterSid: this.currentCompany.CompanyMasterSid,
              COAMasterSid: detail.COAMasterSid
            };

            try {
              const subledgerResp = await firstValueFrom(
                this.operationService.getSubledgerMasterById(payload)
              );

              if (subledgerResp && subledgerResp.data) {
                this.subledgerTypes[rowIndex] = subledgerResp.data.SubledgerType || '';
                this.updateChargeFieldStates(rowIndex);
              }
            } catch (err) {
              console.error('Error fetching subledger type for copied voucher:', err);
            }
          }

          await this.handleSubledgerForEdit(detailGroup, detail, rowIndex);
          return detailGroup;
        });

        await Promise.all(detailPromises);

        this.details.controls.forEach((_, index) => {
          this.refreshSubledgerFiltersForRow(index, true);
        });
      }

      this.isDirty = true;
      this.form.markAsDirty();
      this.appSettingService.showSuccess('Journal voucher copied successfully. Please review and save.');
    } catch (err) {
      console.error('Error copying journal voucher:', err);
      this.appSettingService.showError('Failed to copy journal voucher.');
    } finally {
      this.isPatchingEditData = false;
      this.spinner.hide();
    }
  }

  async handleChargeForEdit(detailGroup: FormGroup, detail: any): Promise<void> {
    const chargeId = detail.ChargeMasterSid;
    const rowIndex = this.getRowIndex(detailGroup);

    // First, update the filtered charge list for this department
    if (detail.DepartmentMasterSid) {
      const dept = this.departmentList.find(d => d.DepartmentMasterSid === detail.DepartmentMasterSid);
      if (dept) {
        this.filterChargeByDeptForARow(dept, rowIndex);
      }
    }

    // Fetch HSSAC details for this charge
    if (chargeId) {
      try {
        const res = await firstValueFrom(this.operationService.getChargeTaxForChargeId(chargeId));
        if (res) {
          this.hssacList[rowIndex] = res.data || [];

          // Patch HSSAC data
          detailGroup.patchValue({
            hssacMasterSid: detail.HSSACMasterSid || null,
            hssacCode: detail.HSSACCode || ''
          });
        }
      } catch (err) {
        console.error('Error fetching HSSAC for edit:', err);
        detailGroup.patchValue({
          hssacMasterSid: detail.HSSACMasterSid || null,
          hssacCode: detail.HSSACCode || ''
        });
      }
    }
  }

  async handleJobsForEdit(detailGroup: FormGroup, detail: any, rowIndex: number): Promise<void> {
    // Load master jobs for this department
    if (detail.DepartmentMasterSid) {
      try {
        const masterJobsResp = await firstValueFrom(
          this.accountsService.getMasterJobByDepartment({
            CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
            BranchMasterSid: this.currentBranch?.BranchMasterSid,
            DepartmentMasterSid: detail.DepartmentMasterSid
          })
        );

        this.masterJobList[rowIndex] = masterJobsResp || [];

        // Now load house jobs for this master job
        if (detail.MasterJobSid) {
          const houseJobsResp = await firstValueFrom(
            this.accountsService.getHouseJobByMasterJob({
              CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
              BranchMasterSid: this.currentBranch?.BranchMasterSid,
              MasterJobSid: detail.MasterJobSid
            })
          );

          this.houseJobList[rowIndex] = houseJobsResp || [];
        }
      } catch (err) {
        console.error('Error loading jobs for edit:', err);
        this.masterJobList[rowIndex] = [];
        this.houseJobList[rowIndex] = [];
      }
    }
  }

  get details(): FormArray {
    return this.form.get('details') as FormArray;
  }

  filterDetailsWithDept(dept: any, detailIndex: number, preservePatchedValues: boolean = false) {
    if (!dept) {
      if (preservePatchedValues) {
        this.filteredChargeList[detailIndex] = [];
        this.masterJobList[detailIndex] = [];
        this.houseJobList[detailIndex] = [];
        return;
      }
      const row = this.details.at(detailIndex) as FormGroup;
      row.patchValue({
        ChargeDescription: '',
        HSSACMasterSid: null,
        ChargeUOMSid: null,
        MasterJobSid: null,
        HouseJobSid: null,
        ledgerMasterSid: null,
        filteredSubledgers: [],
        chargeMasterSid: null, // Also clear charge since it's department-dependent
        chargeDescription: '',
        HSSACCode: '',
        taxPercentage: 0,
        taxAmount: 0
      });
      this.filteredChargeList[detailIndex] = [];
      this.masterJobList[detailIndex] = [];
      this.houseJobList[detailIndex] = [];
      return;
    }

    this.filterChargeByDeptForARow(dept, detailIndex);

    if (preservePatchedValues) {
      this.accountsService.getMasterJobByDepartment({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        DepartmentMasterSid: dept?.DepartmentMasterSid
      }).subscribe({
        next: (resp: any) => {
          this.masterJobList[detailIndex] = resp;
        },
        error: (err) => {
          console.error('Failed to load master jobs:', err);
        }
      });
      return;
    }

    // IMPORTANT: Refresh subledger filters which will trigger auto-patching
    this.refreshSubledgerFiltersForRow(detailIndex);

    this.accountsService.getMasterJobByDepartment({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid: dept?.DepartmentMasterSid
    }).subscribe({
      next: (resp: any) => {
        this.masterJobList[detailIndex] = resp;
      },
      error: (err) => {
        console.error('Failed to load master jobs:', err);
      }
    });
  }

  onMasterJobChange(detailIndex: number, masterJob: any) {
    if (!masterJob || !masterJob.MasterJobSid) {
      this.houseJobList[detailIndex] = [];
      return;
    }
    this.accountsService.getHouseJobByMasterJob({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MasterJobSid: masterJob?.MasterJobSid
    }).subscribe({
      next: (resp: any) => {
        this.houseJobList[detailIndex] = resp || [];
      },
      error: (err) => {
        console.error('Failed to load house jobs:', err);
        this.houseJobList[detailIndex] = [];
      }
    });
  }

  filterChargeByDeptForAllRow() {
    this.details.controls.forEach((group: FormGroup, index) => {
      const deptId = group.get('DepartmentMasterSid')?.value;
      const department = this.departmentList.find(dept => dept.DepartmentMasterSid === deptId);

      // console.log("FILTER CHARGE BY DEPT FOR ALL ROW", {
      //   deptId: deptId,
      //   deptObj: department,
      //   deptList: this.departmentList
      // });

      if (department) {
        this.filterChargeByDeptForARow(department, index);
      }
    })
  }

  filterChargeByDeptForARow(dept, rowIndex) {

    // console.log(`Filtering Dept from row ${rowIndex}`, {
    //   department: dept,
    //   chargeList: this.chargeList
    // });

    if (!this.filteredChargeList[rowIndex]) {
      this.filteredChargeList[rowIndex] = [];
    }
    const departmentName = dept.departmentName;
    this.filteredChargeList[rowIndex] = (this.chargeList || []).filter(charge => {
      const allDepartmentNames = charge.DepartmentMasterSid || [];
      return allDepartmentNames.includes(departmentName);
    })
  }

  createDetailGroup(): FormGroup {
    const companyCurrencyId =
      this.currentCompany?.CurrencyMasterSid ||
      this.currentCompanyCurrency?.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency.code;
    const detailGroup = this.fb.group({
      VoucherDetailSid: [null],
      coaMasterSid: [null, Validators.required],
      ledgerMasterSid: [{ value: null }],
      currencyMasterSid: [companyCurrencyId, Validators.required],
      currencyCode: [companyCurrencyCode],
      exchangeRate: [{ value: 1, disabled: true }, [Validators.required, Validators.min(0)]],
      currencyAmount: [0.0, [Validators.required, Validators.min(0.01)]],
      localAmount: [0.0, [Validators.required, Validators.min(0)]],
      drCr: ['D', Validators.required],
      narration: [''],
      departmentMasterSid: [null],
      chargeMasterSid: [null],
      chargeDescription: [''],
      hssacMasterSid: [null],
      HSSACCode: [''],
      masterJobSid: [null],
      houseJobSid: [null],
      taxPercentage: [0],
      taxAmount: [0],
      costCenterMasterSid: [null],
      profitCenterMasterSid: [null],
      filteredSubledgers: [[]],
      IsAutoGenerated: ['N'],
    });
    this.form.setValidators(consistentExchangeRatesValidator(companyCurrencyId, companyCurrencyCode));
    return detailGroup;

  }

  addDetailLine(): void {
    const detailGroup = this.createDetailGroup();
    const headerNarration = this.form.get('narration')?.value;
  if (headerNarration) {
    detailGroup.patchValue({
      narration: headerNarration
    }, { emitEvent: false });
  }
    this.setupDetailCalculations(detailGroup);
    this.details.push(detailGroup);

    // Initialize arrays for the new row
    const newIndex = this.details.length - 1;
    this.filteredChargeList[newIndex] = [];
    this.masterJobList[newIndex] = [];
    this.houseJobList[newIndex] = [];
    this.hssacList[newIndex] = [];
    this.subledgerTypes[newIndex] = '';
    const currencyId = detailGroup.get('currencyMasterSid')?.value;
    if (currencyId) {
      this.fetchExchangeRate(detailGroup, currencyId);
    }
  }

  hasChargeTypeRows(): boolean {
    // Check if any subledgerType is 'Charge'
    // Make sure subledgerTypes is initialized as an array
    if (!this.subledgerTypes || this.subledgerTypes.length === 0) {
      return false;
    }
    return this.subledgerTypes.some(type => type === 'Charge');
  }

   setupDetailCalculations(detailGroup: FormGroup): void {
    const rowIndex = this.getRowIndex(detailGroup);
    detailGroup.get('narration')?.valueChanges.subscribe((value) => {
      if (this.isPatchingEditData) return;
      // Check if this is a user-initiated change (not from header propagation)
      const headerNarration = this.form.get('narration')?.value;

      // If the value is different from header narration and not empty, mark as manually edited
      if (value !== headerNarration && value !== '') {
        this.manuallyEditedNarrationRows.add(rowIndex);
      }
    });
    detailGroup.get('currencyAmount')?.valueChanges.subscribe(() => {
      if (this.isPatchingEditData) return;
      this.calculateLocalAmountByGroup(detailGroup);
    });

    detailGroup.get('coaMasterSid')?.valueChanges.subscribe((coaMasterSid) => {
      if (this.isPatchingEditData) return;

      // console.log('COA value changed:', coaMasterSid, {
      //   isAutoGenerated: detailGroup.get('IsAutoGenerated')?.value
      // });

      // Skip for auto-generated rows
      if (detailGroup.get('IsAutoGenerated')?.value !== 'Y') {
        this.onCoaChange(detailGroup, coaMasterSid);
      }
    });

   detailGroup.get('ledgerMasterSid')?.valueChanges.subscribe((ledgerId) => {
  if (this.isPatchingEditData) return;
  if (!ledgerId) return;

  const subledger = this.subledgerList.find(
    (s: any) => s.SubledgerMasterSid === ledgerId
  );

  console.log('Selected subledger:', subledger);

  if (!subledger) return;

  if (subledger.SubledgerType === 'Customer' && subledger.SubledgerMappingSid) {

    // ✅ ADD THIS PART
    const customer = this.customerList.find(
      (c: any) => c.CustomerMasterSid === subledger.SubledgerMappingSid
    );

    console.log('Customer from list:', customer);

    if (customer?.CurrencyMasterSid) {

      detailGroup.get('currencyMasterSid')?.setValue(
        customer.CurrencyMasterSid,
        { emitEvent: true }
      );

      console.log('Currency updated to:', customer.CurrencyMasterSid);

    }

  }
});

    detailGroup.get('exchangeRate')?.valueChanges.subscribe(() => {
      if (this.isPatchingEditData) return;
      this.applyCurrencyFormatting(detailGroup, 'exchangeRate');
    });

    // REMOVED: drCr value change subscription - not needed with getters
    // detailGroup.get('drCr')?.valueChanges.subscribe(() => {
    //   this.calculateTotals();
    // });

    detailGroup.get('currencyMasterSid')?.valueChanges.subscribe((currencyId) => {
      if (this.isPatchingEditData) return;
        const ledgerId = detailGroup.get('ledgerMasterSid')?.value;

  const subledger = this.subledgerList.find(
    (s: any) => s.SubledgerMasterSid === ledgerId
  );

  if (subledger?.SubledgerType === 'Customer') {

    const customer = this.customerList.find(
      (c: any) => c.CustomerMasterSid === subledger.SubledgerMappingSid
    );

    if (customer && customer.CurrencyMasterSid !== currencyId) {
      this.toastr.warning('Selected currency differs from the customer\'s default currency.', 'Currency Mismatch', { timeOut: 2000 });
 
    }

  }
      if (currencyId) {
        detailGroup.patchValue({
          currencyAmount: this.getFormattedAndPaddedAmount(
            toNumber(detailGroup.get('currencyAmount')?.value),
            currencyId
          ),
          taxAmount: this.getFormattedAndPaddedAmount(
            toNumber(detailGroup.get('taxAmount')?.value),
            currencyId
          ),
        }, { emitEvent: false });
        this.fetchExchangeRate(detailGroup, currencyId);
      }
    });

    detailGroup.get('chargeMasterSid')?.valueChanges.subscribe((chargeId) => {
      if (this.isPatchingEditData) return;

      // console.log('Charge value changed:', chargeId);

      // Skip for auto-generated rows
      if (detailGroup.get('IsAutoGenerated')?.value !== 'Y') {
        if (chargeId) {
          this.onChargeChange(detailGroup, chargeId);
        } else {
          // Reset charge-related fields when charge is cleared
          detailGroup.patchValue({
            chargeDescription: '',
            HSSACCode: '',
            taxPercentage: 0,
            taxAmount: 0
          });
          // Refresh subledger filters
          this.refreshSubledgerFiltersForRow(this.getRowIndex(detailGroup));
        }
        if (this.subledgerTypes[this.getRowIndex(detailGroup)] === 'Charge') {
          this.refreshSubledgerFiltersForRow(this.getRowIndex(detailGroup));
        }
      }
    });

    detailGroup.get('departmentMasterSid')?.valueChanges.subscribe((deptId) => {
      if (this.isPatchingEditData) return;
      // console.log('Department value changed:', deptId);

      // Skip for auto-generated rows
      if (detailGroup.get('IsAutoGenerated')?.value !== 'Y') {
        // Get department object
        const dept = this.departmentList.find(d => d.DepartmentMasterSid === deptId);

        // Call filterDetailsWithDept which will handle all filtering
        this.filterDetailsWithDept(dept, this.getRowIndex(detailGroup));
        if (this.subledgerTypes[this.getRowIndex(detailGroup)] === 'Charge') {
          this.refreshSubledgerFiltersForRow(this.getRowIndex(detailGroup));
        }
      }
    });

    detailGroup.get('taxPercentage')?.valueChanges.subscribe((val) => {
      if (this.isPatchingEditData) return;
      const taxPercentage = Number(val || 0);
      if (taxPercentage === 0) {
        detailGroup.get('taxAmount')?.disable({ emitEvent: false });
      } else {
        detailGroup.get('taxAmount')?.enable({ emitEvent: false });
      }
      this.calculateTaxAmount(detailGroup);
    });

    detailGroup.get('taxAmount')?.valueChanges.subscribe(() => {
      if (this.isPatchingEditData) return;
      this.applyCurrencyFormatting(detailGroup, 'taxAmount');
    });
    const initialTaxPercentage = Number(detailGroup.get('taxPercentage')?.value || 0);

    if (initialTaxPercentage === 0) {
      detailGroup.get('taxAmount')?.disable({ emitEvent: false });
    } else if (initialTaxPercentage >= 1) {
      detailGroup.get('taxAmount')?.enable({ emitEvent: false });
    }
  }
  


  // NEW METHOD: Check if subledger matches the selected COA
  doesSubledgerMatchCOA(subledger: any, coaMasterSid: number): boolean {
    return this.doesSubledgerMatchCOAStrict(subledger, coaMasterSid);
  }

  getSubledgerFilterStatus(rowIndex: number): string {
    const row = this.details.at(rowIndex) as FormGroup;
    const deptId = row.get('departmentMasterSid')?.value;
    const chargeId = row.get('chargeMasterSid')?.value;
    const coaId = row.get('coaMasterSid')?.value;
    const filteredCount = row.get('filteredSubledgers')?.value?.length || 0;

    return `Dept: ${deptId || 'Any'}, Charge: ${chargeId || 'Any'}, COA: ${coaId || 'Any'}, Matches: ${filteredCount}`;
  }
  private updateCurrencyControlsForCoa(detailGroup: FormGroup, coaMasterSid: any): void {
    const coaId = coaMasterSid != null && coaMasterSid !== '' ? Number(coaMasterSid) : null;
    const coa = coaId ? this.coaList.find(c => c.COAMasterSid === coaId) : null;
    const ledgerType = String(coa?.LedgerType || '').trim();
    const shouldDisableCurrency = ledgerType === 'Bank' || ledgerType === 'Cash';

    if (shouldDisableCurrency) {
      detailGroup.get('currencyMasterSid')?.disable({ emitEvent: false });
      detailGroup.get('currencyCode')?.disable({ emitEvent: false });
      return;
    }

    if (!detailGroup.disabled) {
      detailGroup.get('currencyMasterSid')?.enable({ emitEvent: false });
      detailGroup.get('currencyCode')?.enable({ emitEvent: false });
    }
  }
  subledgerTypes: string[] = [];

  showChargeSection(rowIndex: number): boolean {
    return this.subledgerTypes[rowIndex] === 'Charge';
  }

  onCoaChange(detailGroup: FormGroup, coaMasterSid: any): void {
  if (this.isPatchingEditData) return;
  const coaId = coaMasterSid != null && coaMasterSid !== '' ? Number(coaMasterSid) : null;
  const rowIndex = this.getRowIndex(detailGroup);
  this.updateSubledgerValidator(detailGroup, coaId);

  // console.log(`COA changed to: ${coaId} for row ${rowIndex}`, {
  //   isAutoGenerated: detailGroup.get('IsAutoGenerated')?.value,
  //   currentLedgerMasterSid: detailGroup.get('ledgerMasterSid')?.value,
  //   previousSubledgerType: this.subledgerTypes[rowIndex]
  // });

  // Check if we're transitioning from Charge type to non-Charge type
  const wasChargeType = this.subledgerTypes[rowIndex] === 'Charge';
  
  // SKIP FOR AUTO-GENERATED ROWS
  const isAutoGenerated = detailGroup.get('IsAutoGenerated')?.value === 'Y';
  if (isAutoGenerated) {
    // console.log(`Skipping COA change logic for auto-generated row ${rowIndex}`);
    return;
  }

  // Clear previous subledger type
  this.subledgerTypes[rowIndex] = '';

   this.clearRelatedFieldsForRow(detailGroup, rowIndex);

  // Default detail row currency from the COA's configured ledger currency
  if (coaId) {
    const coa = this.coaList.find(c => c.COAMasterSid === coaId);

    if (coa?.LedgerCurrency) {
      detailGroup.patchValue({ currencyMasterSid: coa.LedgerCurrency });
      // currencyCode and exchangeRate are updated via currencyMasterSid.valueChanges subscription
    }
  }
  this.updateCurrencyControlsForCoa(detailGroup, coaId);

  // Fetch subledger details when COA changes
  if (coaId && this.currentCompany?.CompanyMasterSid) {
    const payload = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      COAMasterSid: coaId
    };

    this.operationService.getSubledgerMasterById(payload).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const subledger = response.data;
          const newSubledgerType = subledger.SubledgerType || '';
          
          // If transitioning from Charge to non-Charge, clear charge fields
          if (wasChargeType && newSubledgerType !== 'Charge') {
            this.disableChargeFieldsForRow(detailGroup);
          }
          
          // Store the new subledger type
          this.subledgerTypes[rowIndex] = newSubledgerType;
          
          // console.log(`Subledger type for row ${rowIndex}:`, this.subledgerTypes[rowIndex]);
          this.updateChargeFieldStates(rowIndex);
          
          // Enable subledger field
          detailGroup.get('ledgerMasterSid')?.enable();

          // Refresh filters
          this.refreshSubledgerFiltersForRow(rowIndex);
        } else {
          // No subledger found - if was Charge type, clear fields
          if (wasChargeType) {
            this.disableChargeFieldsForRow(detailGroup);
          }
          
          this.subledgerTypes[rowIndex] = '';
          this.updateChargeFieldStates(rowIndex);
          detailGroup.get('ledgerMasterSid')?.enable();
          detailGroup.patchValue({
            ledgerMasterSid: null
          }, { emitEvent: false });
          this.refreshSubledgerFiltersForRow(rowIndex);
        }
      },
      error: (err) => {
        console.error('Error fetching subledger:', err);
        // If was Charge type, clear fields
        if (wasChargeType) {
          this.disableChargeFieldsForRow(detailGroup);
        }
        
        this.subledgerTypes[rowIndex] = '';
        this.updateChargeFieldStates(rowIndex);
        detailGroup.get('ledgerMasterSid')?.enable();
        detailGroup.patchValue({
          ledgerMasterSid: null
        }, { emitEvent: false });
        this.refreshSubledgerFiltersForRow(rowIndex);
      }
    });
  } else {
    // If COA is cleared and was Charge type, clear fields
    if (wasChargeType) {
      this.disableChargeFieldsForRow(detailGroup);
    }
    
    this.subledgerTypes[rowIndex] = '';
    this.updateChargeFieldStates(rowIndex);
    detailGroup.get('ledgerMasterSid')?.enable();
    detailGroup.patchValue({
      ledgerMasterSid: null
    }, { emitEvent: false });
    this.refreshSubledgerFiltersForRow(rowIndex);
  }
}
private clearRelatedFieldsForRow(detailGroup: FormGroup, rowIndex: number): void {
  // Clear the subledger (ledgerMasterSid)
  detailGroup.patchValue({
    ledgerMasterSid: null,
    filteredSubledgers: []
  }, { emitEvent: false });

  // Clear all charge-related fields
  detailGroup.patchValue({
    departmentMasterSid: null,
    chargeMasterSid: null,
    chargeDescription: '',
    hssacMasterSid: null,
    HSSACCode: '',
    masterJobSid: null,
    houseJobSid: null,
    taxPercentage: 0,
    taxAmount: 0,
    costCenterMasterSid: null,
    profitCenterMasterSid: null
  }, { emitEvent: false });

  // Clear the filtered lists for this row
  this.filteredChargeList[rowIndex] = [];
  this.masterJobList[rowIndex] = [];
  this.houseJobList[rowIndex] = [];
  this.hssacList[rowIndex] = [];

  // Disable charge fields
  this.disableChargeFieldsForRow(detailGroup);
}


  calculateTaxAmount(detailGroup: FormGroup): void {
    if (this.isPatchingEditData) return;
    const localAmount = toNumber(detailGroup.get('localAmount')?.value || 0);
    const taxPercentage = toNumber(detailGroup.get('taxPercentage')?.value || 0);
    const currencyMasterSid =
      detailGroup.get('currencyMasterSid')?.value || this.currentCompany?.CurrencyMasterSid;

    const taxAmount = (localAmount * taxPercentage) / 100;

    const formattedTaxAmount = this.getFormattedAndPaddedAmount(taxAmount, currencyMasterSid);

    detailGroup.patchValue({
      taxAmount: formattedTaxAmount
    }, { emitEvent: false });
  }

  private applyCurrencyFormatting(
    detailGroup: FormGroup,
    changedControl: 'exchangeRate' | 'currencyAmount' | 'taxAmount'
  ): void {
    if (this.isPatchingEditData) return;
    const currencyMasterSid =
      detailGroup.get('currencyMasterSid')?.value || this.currentCompany?.CurrencyMasterSid;

    if (!currencyMasterSid) {
      if (changedControl !== 'taxAmount') {
        this.calculateLocalAmountByGroup(detailGroup);
      }
      return;
    }

    if (changedControl === 'exchangeRate') {
      const exchangeRate = toNumber(detailGroup.get('exchangeRate')?.value);
      detailGroup.patchValue(
        { exchangeRate: this.getFormattedAndPaddedExchangeRate(exchangeRate, currencyMasterSid) },
        { emitEvent: false }
      );
      this.calculateLocalAmountByGroup(detailGroup);
      return;
    }

    if (changedControl === 'currencyAmount') {
      const currencyAmount = toNumber(detailGroup.get('currencyAmount')?.value);
      detailGroup.patchValue(
        { currencyAmount: this.getFormattedAndPaddedAmount(currencyAmount, currencyMasterSid) },
        { emitEvent: false }
      );
      this.calculateLocalAmountByGroup(detailGroup);
      return;
    }

    const taxAmount = toNumber(detailGroup.get('taxAmount')?.value);
    detailGroup.patchValue(
      { taxAmount: this.getFormattedAndPaddedAmount(taxAmount, currencyMasterSid) },
      { emitEvent: false }
    );
  }

  calculateLocalAmountByGroup(detailGroup: FormGroup, formatOnBlur: boolean = false): void {
  const rowIndex = this.details.controls.indexOf(detailGroup);
  if (rowIndex !== -1) {
    this.calculateLocalAmount(rowIndex, formatOnBlur);
  }
}

  calculateLocalAmount(index: number, formatOnBlur: boolean = false): void {
  const detailGroup = this.details.at(index) as FormGroup;
  if (!detailGroup) return;

  const currencyMasterSid =
    detailGroup.get('currencyMasterSid')?.value || this.currentCompany?.CurrencyMasterSid;

  const rawAmount = toNumber(detailGroup.get('currencyAmount')?.value);
  const rawExchangeRate = toNumber(detailGroup.get('exchangeRate')?.value);

  const formattedExchangeRate = this.getFormattedExchangeRate(
    rawExchangeRate,
    currencyMasterSid
  );

  const formattedAmount = this.getFormattedAmount(
    rawAmount,
    currencyMasterSid
  );

  let finalAmount = 0;

  if (this.formatCurrencyAmountBeforeConcludingLocal) {
    finalAmount = Number(formattedAmount) * Number(formattedExchangeRate);
  } else {
    finalAmount = Number(rawAmount) * Number(formattedExchangeRate);
  }

  detailGroup.get('localAmount')?.setValue(
    this.getFormattedAmount(finalAmount, currencyMasterSid),
    { emitEvent: false }
  );

  if (formatOnBlur) {
    detailGroup.get('currencyAmount')?.setValue(
      this.getFormattedAndPaddedAmount(rawAmount, currencyMasterSid),
      { emitEvent: false }
    );

    detailGroup.get('localAmount')?.setValue(
      this.getFormattedAndPaddedAmount(finalAmount, currencyMasterSid),
      { emitEvent: false }
    );
  }
}

  fetchExchangeRate(detailGroup: FormGroup, currencyId: number): void {
    if (this.isPatchingEditData) return;
    if (!currencyId || !this.currencyList?.length) return;

    const companyCurrencyCode = this.companySettings.getCurrencySettings().code;
    const selectedCurrency = this.currencyList.find(
      c => c.CurrencyMasterSid === currencyId
    );

    if (!selectedCurrency) return;

    const fromCurrencyCode = selectedCurrency.currencyCode;
    const toCurrencyCode = companyCurrencyCode;

    // ✅ SAME CURRENCY → Rate = 1 & DISABLE
    if (fromCurrencyCode === toCurrencyCode) {
      detailGroup.patchValue({
        currencyCode: fromCurrencyCode,
        exchangeRate: this.getFormattedAndPaddedExchangeRate(1, currencyId)
      }, { emitEvent: false });

      detailGroup.get('exchangeRate')?.disable({ emitEvent: false });
      this.calculateLocalAmountByGroup(detailGroup);
      return;
    }

    // ✅ DIFFERENT CURRENCY → ENABLE & FETCH RATE
    detailGroup.get('exchangeRate')?.enable({ emitEvent: false });
    const requestedCurrencyId = Number(currencyId);

    // Clear previous/stale rate immediately while latest rate is loading
    detailGroup.patchValue({
      currencyCode: fromCurrencyCode,
      exchangeRate: 0
    }, { emitEvent: false });
    this.calculateLocalAmountByGroup(detailGroup);

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: this.form.get('voucherDate')?.getRawValue()
        ? new Date(this.form.get('voucherDate').getRawValue())
        : new Date(),
      segment: 'revenue'
    };

    this.accountsService.getExchangeRate(payload).subscribe({
      next: (res: any) => {
        const currentCurrencyId = Number(detailGroup.get('currencyMasterSid')?.value);
        if (currentCurrencyId !== requestedCurrencyId) {
          return;
        }

        if (res?.status) {
          if (res.data) {
            const exchangeRate = Number(res.data);
            const formattedRate = this.getFormattedAndPaddedExchangeRate(exchangeRate, currencyId);
            // Exchange rate found
            detailGroup.patchValue({
              currencyCode: fromCurrencyCode,
              exchangeRate: formattedRate
            }, { emitEvent: false });
            this.calculateLocalAmountByGroup(detailGroup);
          } else {
            // Exchange rate not found - DON'T default to 1
            detailGroup.patchValue({
              currencyCode: fromCurrencyCode,
              exchangeRate: 0  // Set to null instead of 1
            }, { emitEvent: false });
            this.calculateLocalAmountByGroup(detailGroup);

            // Show error message
            this.appSettingService.showError(
              res?.message
            );
          }
        } else {
          // API returned error
          detailGroup.patchValue({
            currencyCode: fromCurrencyCode,
            exchangeRate: 0  // Set to null instead of 1
          }, { emitEvent: false });
          this.calculateLocalAmountByGroup(detailGroup);

          this.appSettingService.showError(
            res?.message
          );
        }
      },
      error: (err) => {
        const currentCurrencyId = Number(detailGroup.get('currencyMasterSid')?.value);
        if (currentCurrencyId !== requestedCurrencyId) {
          return;
        }

        console.error('Error fetching exchange rate:', err);
        detailGroup.patchValue({
          currencyCode: fromCurrencyCode,
          exchangeRate: 0  // Set to null instead of 1
        }, { emitEvent: false });
        this.calculateLocalAmountByGroup(detailGroup);
      }
    });
  }


  fetchChargeDetails(detailGroup: FormGroup, chargeId: number): void {
    const rowIndex = this.getRowIndex(detailGroup);
    const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);

    if (charge) {
      const description = charge.ChargeDescription || charge.chargeName || charge.ChargeName || '';

      // Fetch HSSAC details using API
      this.operationService.getChargeTaxForChargeId(chargeId).subscribe({
        next: (res: any) => {
          if (res.status) {
            this.hssacList[rowIndex] = res.data || [];

            let hssacId = null;
            let hssacCode = '';

            // Auto-select the first HSSAC
            if (res.data && res.data.length > 0) {
              hssacId = res.data[0]?.HSSACMasterSid || null;
              hssacCode = res.data[0]?.HSSACCode || res.data[0]?.HSNCode || '';
            }

            const chargeUomId = charge.ChargeUOMSid ?? charge.UOM ?? charge.UOMMasterSid ?? null;

            // Auto-set tax percentage from HSSAC
            let taxPercentage = charge.TaxPercentage || 0;
            if (hssacId) {
              const hssac = res.data.find((h: any) => h.HSSACMasterSid === hssacId);
              taxPercentage = hssac?.TaxRate || taxPercentage;
            }

            // Update the detail group
            detailGroup.patchValue({
              chargeDescription: description,
              hssacMasterSid: hssacId,
              hssacCode: hssacCode,
              taxPercentage: taxPercentage,
              ChargeUOMSid: chargeUomId || null
            });

            this.calculateTaxAmount(detailGroup);
          }
        },
        error: (err) => {
          console.error('Error fetching HSSAC details:', err);
          // Fallback to basic charge info
          detailGroup.patchValue({
            chargeDescription: description,
            hssacMasterSid: null,
            hssacCode: '',
            taxPercentage: charge.TaxPercentage || 0,
            ChargeUOMSid: charge.ChargeUOMSid || null
          });
        }
      });
    }
  }

  fetchHSSACForExistingDetail(detailGroup: FormGroup, chargeId: number, rowIndex: number, detail: any): void {
    this.operationService.getChargeTaxForChargeId(chargeId).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.hssacList[rowIndex] = res.data || [];

          // Find matching HSSAC
          let hssacId = detail.HSSACMasterSid || null;
          let hssacCode = detail.HSSACCode || '';

          // If we have an HSSACMasterSid, use it
          if (hssacId && res.data.length > 0) {
            const matchingHssac = res.data.find((h: any) => h.HSSACMasterSid === hssacId);
            if (matchingHssac) {
              hssacCode = matchingHssac.HSSACCode || matchingHssac.HSNCode || hssacCode;
            }
          }
          // If no HSSACMasterSid but have HSSACCode, find by code
          else if (hssacCode && res.data.length > 0) {
            const matchingHssac = res.data.find((h: any) =>
              h.HSSACCode === hssacCode || h.HSNCode === hssacCode
            );
            if (matchingHssac) {
              hssacId = matchingHssac.HSSACMasterSid;
              hssacCode = matchingHssac.HSSACCode || matchingHssac.HSNCode || '';
            }
          }
          // Otherwise, use the first one
          else if (!hssacId && res.data.length > 0) {
            hssacId = res.data[0]?.HSSACMasterSid || null;
            hssacCode = res.data[0]?.HSSACCode || res.data[0]?.HSNCode || '';
          }

          // Update the form group
          detailGroup.patchValue({
            hssacMasterSid: hssacId,
            hssacCode: hssacCode
          });

          // console.log('HSSAC patched:', { rowIndex, hssacId, hssacCode, hssacList: res.data });
        }
      },
      error: (err) => {
        console.error('Error fetching HSSAC for existing detail:', err);
        detailGroup.patchValue({
          hssacMasterSid: detail.HSSACMasterSid || null,
          hssacCode: detail.HSSACCode || ''
        });
      }
    });
  }

  onChargeChange(detailGroup: FormGroup, chargeId: number): void {
    // console.log('Charge value changed:', chargeId);

    if (chargeId) {
      const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);

      if (charge) {
        const description = charge.ChargeDescription || charge.chargeName || charge.ChargeName || '';

        // Fetch HSSAC details using API (same as invoice component)
        this.fetchHSSACForCharge(detailGroup, chargeId, description);

      }
    } else {
      // Reset charge-related fields when charge is cleared
      detailGroup.patchValue({
        chargeDescription: '',
        hssacMasterSid: null,
        hssacCode: '',
        taxPercentage: 0,
        taxAmount: 0,
        ChargeUOMSid: null
      });

      // Refresh subledger filters - this will clear auto-patched subledger
      this.refreshSubledgerFiltersForRow(this.getRowIndex(detailGroup));
    }

    // Always refresh subledger filters when charge changes (for auto-patching)
    const rowIndex = this.getRowIndex(detailGroup);
    if (this.subledgerTypes[rowIndex] === 'Charge') {
      this.refreshSubledgerFiltersForRow(rowIndex);
    }
  }

  // New method to fetch HSSAC details using API
  fetchHSSACForCharge(detailGroup: FormGroup, chargeId: number, chargeDescription: string): void {
    const rowIndex = this.getRowIndex(detailGroup);
    if (!this.hssacList[rowIndex]) {
      this.hssacList[rowIndex] = [];
    }
    const chargeName = this.chargeList.find((c: any) => c.ChargeMasterSid === chargeId)?.chargeName || '';

    // Call API to get HSSAC details for this charge
    this.operationService.getChargeTaxForChargeId(chargeId).subscribe({
      next: (res: any) => {
        if (res.status) {
          // Store the HSSAC list for this row (similar to invoice component)
          this.hssacList[rowIndex] = res.data || [];

          let hssacId = null;
          let hssacCode = '';

          // Auto-select the first HSSAC if available
          if (res.data && res.data.length > 0) {
            hssacId = res.data[0]?.HSSACMasterSid || null;
            hssacCode = res.data[0]?.HSSACCode || res.data[0]?.HSNCode || '';

            // console.log('DEBUG - HSSAC details fetched from API:', {
            //   rowIndex,
            //   hssacList: res.data,
            //   selectedHssacId: hssacId,
            //   selectedHssacCode: hssacCode
            // });
          }

          const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);
          const chargeUomId = charge?.ChargeUOMSid ?? charge?.UOM ?? charge?.UOMMasterSid ?? null;

          // Auto-set tax percentage from HSSAC
          let taxPercentage = charge?.TaxPercentage || 0;
          if (hssacId) {
            const hssac = res.data.find((h: any) => h.HSSACMasterSid === hssacId);
            taxPercentage = hssac?.TaxRate || taxPercentage;
          }

          // Update the detail group
          detailGroup.patchValue({
            chargeDescription: chargeDescription,
            hssacMasterSid: hssacId,
            hssacCode: hssacCode,
            taxPercentage: taxPercentage,
            ChargeUOMSid: chargeUomId || null
          });

          // Recalculate tax amount
          this.calculateTaxAmount(detailGroup);

        } else {
          console.warn('No HSSAC data returned from API for charge:', chargeId);
          this.appSettingService.showError(`Error fetching HSSAC details for ${chargeName}`);
          this.hssacList[rowIndex] = [];

          // Update with basic charge info
          detailGroup.patchValue({
            chargeDescription: chargeDescription,
            hssacMasterSid: null,
            hssacCode: '',
          });
        }

        // Refresh subledger filters
        this.refreshSubledgerFiltersForRow(rowIndex);
      },
      error: (err: any) => {
        console.error('Error fetching HSSAC details:', err);
        this.appSettingService.showError(`Error fetching HSSAC details for ${chargeName}`);
        this.hssacList[rowIndex] = [];

        // Update with basic charge info
        const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);
        detailGroup.patchValue({
          chargeDescription: chargeDescription,
          hssacMasterSid: null,
          hssacCode: '',
          taxPercentage: charge?.TaxPercentage || 0,
          ChargeUOMSid: charge?.ChargeUOMSid || null
        });

        this.refreshSubledgerFiltersForRow(rowIndex);
      }
    });
  }

  deleteDetailLine(index: number): void {
    if (this.details.length > 1) {
       this.manuallyEditedNarrationRows.delete(index);
    
    // Shift indices for rows after the deleted one
    const updatedSet = new Set<number>();
    this.manuallyEditedNarrationRows.forEach((editedIndex) => {
      if (editedIndex > index) {
        updatedSet.add(editedIndex - 1);
      } else if (editedIndex < index) {
        updatedSet.add(editedIndex);
      }
    });
    this.manuallyEditedNarrationRows = updatedSet;
      this.details.removeAt(index);
      // REMOVED: this.calculateTotals(); - Not needed with getters
    } else {
      this.appSettingService.showWarning('At least one detail line is required', 'Warning');
    }
  }

  // REMOVED: calculateTotals() method - Replaced by getters above
  // calculateTotals(): void {
  //   this.debitTotal = 0;
  //   this.creditTotal = 0;
  //
  //   this.details.controls.forEach((control) => {
  //     const drCr = control.get('drCr')?.value;
  //     const localAmount = control.get('localAmount')?.value || 0;
  //     const taxAmount = control.get('taxAmount')?.value || 0;
  //
  //     // Calculate total amount including tax
  //     const totalAmount = localAmount + taxAmount;
  //
  //     if (drCr === 'D') {
  //       this.debitTotal += totalAmount;
  //     } else if (drCr === 'C') {
  //       this.creditTotal += totalAmount;
  //     }
  //   });
  //
  //   this.difference = Math.abs(this.debitTotal - this.creditTotal);
  // }

  isFormValid(): boolean {
    const missingSubledgerRowIndex = this.details.controls.findIndex((control) => {
      const detailGroup = control as FormGroup;
      if (detailGroup.disabled) return false;
      if (detailGroup.get('IsAutoGenerated')?.value === 'Y') return false;
      if (!this.isSubledgerRequiredForCoa(detailGroup.get('coaMasterSid')?.value)) return false;
      return !detailGroup.get('ledgerMasterSid')?.value;
    });

    if (missingSubledgerRowIndex !== -1) {
      const row = this.details.at(missingSubledgerRowIndex) as FormGroup;
      row.get('ledgerMasterSid')?.markAsTouched();
      this.appSettingService.showError(
        `Row ${missingSubledgerRowIndex + 1}: Subledger is required for selected ledger`,
        'Validation Error'
      );
      return false;
    }

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.appSettingService.showError('Please fill all required fields', 'Validation Error');
      return false;
    }

    if (this.details.length === 0) {
      this.appSettingService.showError('Please add at least one detail line', 'Validation Error');
      return false;
    }

    // Use the getter for difference
    if (this.difference > 0.01) {
      this.appSettingService.showError(
        `Debit and Credit totals must be equal. Difference: ${this.difference.toFixed(2)}`,
        'Validation Error'
      );
      return false;
    }

    return true;
  }

  // NEW: Final Save with Posting functionality
  onFinalSave(): void {
    // Re-validate voucher date constraints at save time (edit mode may have stale state)
    this.applyVoucherDateConstraints();
    // Block save if voucher period grace days exceeded or module closed
    if (this.voucherConstraints.isClosed) {
      if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
      return;
    }

    if (!this.isFormValid()) return;

    this.saveJournalVoucher(true); // true indicates final save with posting
  }

  // NEW: Save Journal Voucher (similar to vendor invoice)
  private saveJournalVoucher(isFinal: boolean): void {
    console.log("isFinal",isFinal)
    if (this.form.hasError('inconsistentExchangeRates')) {
      const errorMsg = getExchangeRateErrorMessage(
        this.form,
        this.currencyList
      );
      this.appSettingService.showError(errorMsg);
      return;
    }
    let hasInvalidExchangeRate = false;
      this.details.controls.forEach((control, index) => {
    const detailGroup = control as FormGroup;
    const currencyId = detailGroup.get('currencyMasterSid')?.value;
    const exchangeRate = detailGroup.get('exchangeRate')?.value;
    const companyCurrencyId = this.currentCompany?.CurrencyMasterSid;
    
    if (currencyId && currencyId !== companyCurrencyId && 
        (!exchangeRate || exchangeRate === 0)) {
      hasInvalidExchangeRate = true;
      this.appSettingService.showError(
        `Row ${index + 1}: Exchange rate cannot be 0.`
      );
    }
  });

  if (hasInvalidExchangeRate) {
    return;
  }

  // Continue with existing validation
  if (!this.isFormValid()) return;
    const payload = this.preparePayload();
    console.log("payload",payload)

    this.isSaving = true;
    this.spinner.show();

    const saveObservable = this.voucherHeaderSid
      ? this.journalVoucherService.updateJournalVoucherById(this.voucherHeaderSid, payload)
      : this.journalVoucherService.createJournalVoucher(payload);

    saveObservable.subscribe({
      next: async (response: any) => {
        if (response?.status) {
          const voucherHeaderSid = response.data?.VoucherHeaderSid || this.voucherHeaderSid;
           this.isDirty = false;
          if (isFinal && voucherHeaderSid) {
            // If final save, post the voucher
            await this.postVoucher(voucherHeaderSid);
          } else {
            this.spinner.hide();
            this.isSaving = false;
            const message = isFinal ? 'Journal voucher saved and posted successfully!' : 'Journal voucher saved as draft successfully!';
            this.appSettingService.showSuccess(message);
            this.loadVoucherForEdit(voucherHeaderSid);
            if (!this.voucherHeaderSid && voucherHeaderSid) {
              this.voucherHeaderSid = voucherHeaderSid;
              this.router.navigate(['/accounts/journal-voucher/entry', voucherHeaderSid]);
            }
          }
        } else {
          this.spinner.hide();
          this.isSaving = false;
          const errorMessage = response?.message || 'Error saving journal voucher';
          this.appSettingService.showError(errorMessage);
        }
      },
      error: (err) => {
        this.spinner.hide();
        this.isSaving = false;
        console.error('Save journal voucher error', err);
        this.appSettingService.showError('Failed to save journal voucher.');
      }
    });
  }

  // NEW: Post Voucher method (similar to vendor invoice)
  private async postVoucher(voucherHeaderSid: number): Promise<void> {
    try {
      this.spinner.show();

      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      const currentCountry = Number(this.currentCompany?.CountryMasterSid);
      const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      const currentCountryName = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      const currentUserEmail = this.userData?.userEmail;

      if (!currentCompany || !currentBranch || !currentFinancialYear || !currentCountry || !currentCurrency) {
        throw new Error('Company, branch, financial year, or currency information is missing');
      }
      const companyCurrency = this.companySettings.getCurrencySettings();
      const postPayload = {
        VoucherHeaderSid: voucherHeaderSid,
        CompanyMasterSid: currentCompany.CompanyMasterSid,
        BranchMasterSid: currentBranch.BranchMasterSid,
        YearMasterSid: currentFinancialYear,
        LocalCurrencyMasterSid: currentCurrency,
        LocalCurrencyCode: companyCurrency.code,
        PostedBy: currentUserEmail,
        TaxDetails: {
          CountryMasterSid: this.currentCompanyCountry,
          countryCode: this.currentCompanyCountryCode,
          TaxCategory: 'Inter',
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output'
        }
      };

      // Use journalVoucherService for posting
      const result = await firstValueFrom(this.operationService.postJournalVoucher(postPayload));

      this.spinner.hide();
      this.isSaving = false;

      if (result.status) {
        this.appSettingService.showSuccess('Journal voucher saved and posted successfully!');
        this.loadVoucherForEdit(voucherHeaderSid);
        this.isPosted = true; // Update local state

        // Force reload of the same entry route so component state is fully refreshed
        this.router.navigateByUrl('/accounts/journal-voucher/list', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/accounts/journal-voucher/entry', voucherHeaderSid]);
        });
      } else {
        this.appSettingService.showError(result.message || 'Failed to post journal voucher.');
      }
    } catch (error) {
      this.spinner.hide();
      this.isSaving = false;
      console.error('Post voucher error:', error);
      this.appSettingService.showError('Failed to post journal voucher. Please try again.');
    }
  }

  // Existing saveDraft method (for draft saving)
  saveDraft(resolve?: (value: boolean) => void, isPostingTrue?: boolean) {
    console.log("saveDraft")
  // Re-validate voucher date constraints at save time (edit mode may have stale state)
  this.applyVoucherDateConstraints();
  // Block save if voucher period grace days exceeded or module closed
  if (this.voucherConstraints.isClosed) {
    if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
    return;
  }

  if (!this.isFormValid()) return;

  
  const raw = this.form.getRawValue();
  const autoPostingButNoPosted = this.isAutoPosting && !this.isPosted;
    if (this.editMode && autoPostingButNoPosted) {
      this.appSettingService.showWarning(
        'Auto Posting is currently enabled.\n\nPlease switch to Manual Posting and post this  voucher first.\nAfter posting, you can switch back to Auto Posting.',
      );
      if (resolve) resolve(false);
      return;
    }
  
  if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
    this.appSettingService.showWarning('No changes to save');
    this.form.markAsUntouched();
    return;
  }
  
  this.saveJournalVoucher(false);
}


  preparePayload(): any {
  const formValue = this.form.getRawValue();
  const voucherDate = formValue.voucherDate;
  const userEmail = this.userData?.userEmail;
  const now = getDefaultTodayDate();

  const VoucherDetail = formValue.details.map((detail: any, index: number) => ({
    VoucherDetailSid: detail.VoucherDetailSid || undefined,
    COAMasterSid: detail.coaMasterSid,
    LedgerMasterSid: detail.ledgerMasterSid || null,

    CurrencyMasterSid: detail.currencyMasterSid,
    CurrencyCode: detail.currencyCode,

    ExchangeRate: this.getFormattedExchangeRate(
      detail.exchangeRate,
      detail.currencyMasterSid
    ),

    Amount: this.getFormattedAmount(
      detail.currencyAmount,
      detail.currencyMasterSid
    ),

    LocalAmount: this.getFormattedAmount(
      detail.localAmount,
      detail.currencyMasterSid
    ),

    DrCr: detail.drCr,
    Narration: detail.narration || null,

    DepartmentMasterSid: detail.departmentMasterSid || null,
    ChargeMasterSid: detail.chargeMasterSid || null,
    ChargeDescription: detail.chargeDescription || null,
    HSSACCode: detail.hssacMasterSid || null,

    MasterJobSid: detail.masterJobSid || null,
    HouseJobSid: detail.houseJobSid || null,

    TaxPercentage1: detail.taxPercentage || null,
    TaxAmount1: this.getFormattedAmount(
      detail.taxAmount,
      detail.currencyMasterSid
    ),

    CostCenterMasterSid: detail.costCenterMasterSid || null,
    ProfitCenterMasterSid: detail.profitCenterMasterSid || null,

    Sno: index + 1
  }));


  const payload: any = {
    VoucherDate: voucherDate,
    Narration: formValue.narration || null,
    Remarks: formValue.remarks || null,

    Status: formValue.Status,
    PostStatus: 'U',

    PartyName: 'System Journal Entry',

    DocumentNumber: formValue.DocumentNumber,
    DocumentDate: formValue.DocumentDate,

    YearMasterSid: this.currentFinancialYear,
    CountryMasterSid: this.currentCompany?.CountryMasterSid,

    Amount: this.debitTotal,
    LocalAmount: this.debitTotal,

    VoucherDetail,

    ...(!this.editMode
      ? {
          CreatedBy: userEmail,
          CreatedOn: now,
        }
      : {
          UpdatedBy: userEmail,
          UpdatedOn: now,
        }),

    ...(!this.voucherHeaderSid && {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    }),
  };

  /*
  ---------------------------------
  Posting Payload (same as reference)
  ---------------------------------
  */

  const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
  const currentCompanyCountry = Number(this.currentCompany?.CountryMasterSid);

  payload.PostingInfo = {
    LocalCurrencyMasterSid: currentCurrency,
    LocalCurrencyCode: this.currentCompanyCurrency?.code,

    TaxDetails: {
      CountryMasterSid: currentCompanyCountry,
      countryCode: this.currentCompanyCountryCode,

      TaxCategory: 'Inter',

      EffectiveFrom:
        this.form.get('voucherDate')?.getRawValue() ??
        new Date().toISOString(),

      TaxType: 'Output',
    },
  };

  return payload;
}

   navigateToBack(): void {
    this.router.navigate(['/accounts/journal-voucher/list']);
}

  private fromNgbDate(s: NgbDateStructLike | null): Date | null {
    if (!s || !s.year) return null;
    return new Date(s.year, (s.month || 1) - 1, s.day || 1);
  }
  showInfo() {
    if (!this.voucherData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.voucherData;
    modalRef.componentInstance.idLabel = 'Journal Voucher Id';
    modalRef.componentInstance.idValue = this.voucherHeaderSid;
  }
  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.voucherData?.VoucherHeaderSid
     };
     const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.voucherData?.VoucherHeaderSid
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
      (a?.DocumentSid ?? this.voucherData?.VoucherHeaderSid ?? null) ===
      (b?.DocumentSid ?? this.voucherData?.VoucherHeaderSid ?? null)
    );
     const openModal = (terms: any[]) => {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = terms || [];
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.voucherData?.VoucherHeaderSid;
          modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
     };
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
    if (!this.voucherData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.voucherData;
    modalRef.componentInstance.idLabel = 'Journal Voucher Id';
    modalRef.componentInstance.idValue = this.voucherHeaderSid;
  }

  openAuthority() {
    if (!this.voucherData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.voucherData;
    modalRef.componentInstance.idLabel = 'Journal Voucher Id';
    modalRef.componentInstance.idValue = this.voucherHeaderSid;
  }

  openEDoc() {
    if (!this.voucherData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.voucherData;
    modalRef.componentInstance.idLabel = 'Journal Voucher Id';
    modalRef.componentInstance.idValue = this.voucherHeaderSid;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.voucherHeaderSid
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
    modalRef.componentInstance.DocumentSid = this.voucherHeaderSid;
  }

  openFollowup() {

  }

  refreshSubledgerFiltersForRow(rowIndex: number, preservePatchedValues: boolean = false): void {
    const row = this.details.at(rowIndex) as FormGroup;
    const isAutoGenerated = row.get('IsAutoGenerated')?.value === 'Y';
    const isPosted = this.isPosted; // Use the component-level flag

    if (isAutoGenerated) {
      // console.log(`Skipping subledger filter for auto-generated row ${rowIndex}`);

      // For posted vouchers, ensure data is properly displayed
      if (isPosted) {
        const voucherDetail = this.voucherData?.VoucherDetail?.[rowIndex];
        if (voucherDetail?.LedgerMasterSid) {
          row.patchValue({
            ledgerMasterSid: voucherDetail.LedgerMasterSid,
            filteredSubledgers: voucherDetail.subledgerMaster ? [voucherDetail.subledgerMaster] : []
          }, { emitEvent: false });
        }
      }

      row.get('ledgerMasterSid')?.disable();
      return;
    }

    // FOR POSTED VOUCHERS: Just display the existing data
    if (isPosted) {
      const voucherDetail = this.voucherData?.VoucherDetail?.[rowIndex];
      if (voucherDetail) {
        // Filter subledgers to only show the one used in this voucher
        const matchingSubledger = this.subledgerList.find(
          sl => sl.SubledgerMasterSid === voucherDetail.LedgerMasterSid
        );

        row.patchValue({
          filteredSubledgers: matchingSubledger ? [matchingSubledger] : [],
          ledgerMasterSid: voucherDetail.LedgerMasterSid
        }, { emitEvent: false });
      }
      return;
    }

    // NORMAL PROCESSING FOR NON-POSTED VOUCHERS
    const deptId = row.get('departmentMasterSid')?.value;
    const chargeId = row.get('chargeMasterSid')?.value;
    const coaId = row.get('coaMasterSid')?.value;
    const subledgerType = this.subledgerTypes[rowIndex];

    // console.log(`Refreshing subledger filters for row ${rowIndex}:`, {
    //   deptId,
    //   chargeId,
    //   coaId,
    //   subledgerType
    // });

    let filteredSubledgers: any[] = [];

    // Start with all subledgers
    filteredSubledgers = this.subledgerList.slice();

    // Apply filters
    if (deptId) {
      filteredSubledgers = filteredSubledgers.filter(subledger =>
        subledger.DepartmentMasterSid === deptId
      );
    }

    if (chargeId) {
      filteredSubledgers = filteredSubledgers.filter(subledger =>
        subledger.SubledgerMappingSid === chargeId
      );
    }

    if (coaId) {
      filteredSubledgers = filteredSubledgers.filter(subledger =>
        this.doesSubledgerMatchCOAStrict(subledger, coaId)
      );
    }

    // Update the filtered subledgers
    row.patchValue({ filteredSubledgers }, { emitEvent: false });

    if (preservePatchedValues) {
      return;
    }

    // Handle Charge type logic
    if (subledgerType === 'Charge') {
      if (filteredSubledgers.length === 1) {
        const singleSubledger = filteredSubledgers[0];

        row.patchValue({
          ledgerMasterSid: singleSubledger.SubledgerMasterSid
        }, { emitEvent: false });

        row.get('ledgerMasterSid')?.disable();
        this.showWarningFlags[rowIndex] = false;

      } else if (filteredSubledgers.length === 0) {
        if (deptId && chargeId && coaId) {
          if (!this.showWarningFlags[rowIndex]) {
            this.showSubledgerWarning(rowIndex);
            this.showWarningFlags[rowIndex] = true;

            setTimeout(() => {
              this.showWarningFlags[rowIndex] = false;
            }, 2000);
          }
        }
        row.patchValue({ ledgerMasterSid: null }, { emitEvent: false });
        row.get('ledgerMasterSid')?.enable();

      } else if (filteredSubledgers.length > 1) {
        const currentSubledgerSid = row.get('ledgerMasterSid')?.value;
        if (currentSubledgerSid) {
          const currentSubledger = filteredSubledgers.find(
            sl => sl.SubledgerMasterSid === currentSubledgerSid
          );
          if (!currentSubledger) {
            row.patchValue({ ledgerMasterSid: null }, { emitEvent: false });
          }
        }
        row.get('ledgerMasterSid')?.enable();
        this.showWarningFlags[rowIndex] = false;
      }
    } else {
      row.get('ledgerMasterSid')?.enable();

      const currentSubledgerSid = row.get('ledgerMasterSid')?.value;
      if (currentSubledgerSid) {
        const currentSubledger = filteredSubledgers.find(
          sl => sl.SubledgerMasterSid === currentSubledgerSid
        );
        if (!currentSubledger) {
          row.patchValue({ ledgerMasterSid: null }, { emitEvent: false });
        }
      }
      this.showWarningFlags[rowIndex] = false;
    }
  }

  // New method to show warning when subledger doesn't exist
  showSubledgerWarning(rowIndex: number): void {
    const row = this.details.at(rowIndex) as FormGroup;
    const deptId = row.get('departmentMasterSid')?.value;
    const chargeId = row.get('chargeMasterSid')?.value;
    const coaId = row.get('coaMasterSid')?.value;

    const departmentName = this.departmentList.find(d => d.DepartmentMasterSid === deptId)?.departmentName || 'N/A';
    const chargeName = this.chargeList.find(c => c.ChargeMasterSid === chargeId)?.chargeName || 'N/A';
    const coaName = this.coaList.find(c => c.COAMasterSid === coaId)?.LedgerName || 'N/A';

    const warningMessage = `No subledger exists for the selected combination:
    -  ${departmentName}
    -  ${chargeName}
    -  ${coaName}`;

    this.appSettingService.showWarning(warningMessage, 'Subledger Not Found');
  }

  async handleSubledgerForEdit(detailGroup: FormGroup, detail: any, rowIndex: number): Promise<void> {
    // Skip for auto-generated rows
    if (detail.IsAutoGenerated === 'Y') {
      return;
    }

    // Fetch subledger details for this COA
    if (detail.COAMasterSid && this.currentCompany?.CompanyMasterSid) {
      try {
        const payload = {
          CompanyMasterSid: this.currentCompany.CompanyMasterSid,
          COAMasterSid: detail.COAMasterSid
        };

        const subledgerResp = await firstValueFrom(
          this.operationService.getSubledgerMasterById(payload)
        );

        if (subledgerResp && subledgerResp.data) {
          const subledger = subledgerResp.data;
          this.subledgerTypes[rowIndex] = subledger.SubledgerType || '';

          // For Charge type in edit mode, check if we should auto-patch
          if (this.subledgerTypes[rowIndex] === 'Charge') {
            // Don't auto-patch yet - wait for all filters to be applied
            detailGroup.get('ledgerMasterSid')?.enable();

            // The refreshSubledgerFiltersForRow will be called after department and charge are set
            // It will handle auto-patching if conditions are met
          } else {
            // For non-Charge types, just enable the field
            detailGroup.get('ledgerMasterSid')?.enable();
          }

          // If we have an existing value from edit mode, keep it temporarily
          // The refreshSubledgerFiltersForRow will validate it later
          if (detail.LedgerMasterSid) {
            detailGroup.patchValue({
              ledgerMasterSid: detail.LedgerMasterSid
            }, { emitEvent: false });
          }
        }
      } catch (err) {
        console.error('Error fetching subledger for edit:', err);
        this.subledgerTypes[rowIndex] = '';
        detailGroup.get('ledgerMasterSid')?.enable();
      }
    }
  }

  doesSubledgerMatchCOAStrict(subledger: any, coaMasterSid: number): boolean {
    if (!subledger || !coaMasterSid) return true; // No filter if no COA selected

    const coaSid = Number(coaMasterSid);

    // Must match EITHER CrCOAMasterSid OR DrCOAMasterSid exactly
    const matchesCrCOA = subledger.CrCOAMasterSid && Number(subledger.CrCOAMasterSid) === coaSid;
    const matchesDrCOA = subledger.DrCOAMasterSid && Number(subledger.DrCOAMasterSid) === coaSid;

    return matchesCrCOA || matchesDrCOA;
  }

  private isSubledgerRequiredForCoa(coaMasterSid: any): boolean {
    const coaId = coaMasterSid != null && coaMasterSid !== '' ? Number(coaMasterSid) : null;
    if (!coaId) return false;

    const coa = this.coaList.find(c => Number(c.COAMasterSid) === coaId);
    return String(coa?.SubledgerName || '').trim().toUpperCase() === 'Y';
  }

  private updateSubledgerValidator(detailGroup: FormGroup, coaMasterSid: any): void {
    const ledgerControl = detailGroup.get('ledgerMasterSid');
    if (!ledgerControl) return;

    if (this.isSubledgerRequiredForCoa(coaMasterSid)) {
      ledgerControl.setValidators([Validators.required]);
    } else {
      ledgerControl.clearValidators();
    }

    ledgerControl.updateValueAndValidity({ emitEvent: false });
  }

  isSubledgerRequiredForSelectedCoa(row: any): boolean {
    const coaMasterSid = row?.get?.('coaMasterSid')?.value;
    return this.isSubledgerRequiredForCoa(coaMasterSid);
  }

  isAnySubledgerRequired(): boolean {
    if (!this.details?.controls?.length) return false;
    return this.details.controls.some((control) =>
      this.isSubledgerRequiredForCoa((control as FormGroup).get('coaMasterSid')?.value)
    );
  }

  // Add this method to your JournalVoucherEntryComponent class
  getRowIndex(detailGroup: FormGroup): number {
    const index = this.details.controls.findIndex(control => control === detailGroup);
    return index;
  }

  updateChargeFieldStates(rowIndex: number): void {
    const row = this.details.at(rowIndex) as FormGroup;
    const isChargeType = this.subledgerTypes[rowIndex] === 'Charge';

    if (this.isPosted || this.voucherData?.Status === 'S') {
      // For posted vouchers, all fields should be disabled
      row.disable({ emitEvent: false });
      return;
    }

    if (isChargeType) {
      // Enable charge fields for Charge type rows (only if not posted)
      row.get('departmentMasterSid')?.enable();
      row.get('chargeMasterSid')?.enable();
      row.get('hssacMasterSid')?.enable();
      row.get('masterJobSid')?.enable();
      row.get('houseJobSid')?.enable();
      row.get('taxPercentage')?.enable();
      row.get('costCenterMasterSid')?.enable();
      row.get('profitCenterMasterSid')?.enable();
    } else {
      // Disable charge fields for non-Charge type rows
      this.disableChargeFieldsForRow(row);
    }
  }
  disableChargeFieldsForRow(row: FormGroup): void {
  // Disable the fields
  row.get('departmentMasterSid')?.disable();
  row.get('chargeMasterSid')?.disable();
  row.get('hssacMasterSid')?.disable();
  row.get('masterJobSid')?.disable();
  row.get('houseJobSid')?.disable();
  row.get('taxPercentage')?.disable();
  row.get('costCenterMasterSid')?.disable();
  row.get('profitCenterMasterSid')?.disable();
  
  // Clear the values
  row.patchValue({
    departmentMasterSid: null,
    chargeMasterSid: null,
    hssacMasterSid: null,
    masterJobSid: null,
    houseJobSid: null,
    taxPercentage: 0,
    taxAmount: 0,
    costCenterMasterSid: null,
    profitCenterMasterSid: null,
    chargeDescription: '',
    HSSACCode: ''
  }, { emitEvent: false });
  
  // Also clear the filtered lists for this row
  const rowIndex = this.getRowIndex(row);
  this.filteredChargeList[rowIndex] = [];
  this.masterJobList[rowIndex] = [];
  this.houseJobList[rowIndex] = [];
  this.hssacList[rowIndex] = [];
}



  reportJournalVoucher() {
    const modalRef = this.modalService.open(JournalVoucherPrintComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.voucherData = this.voucherData || [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.coaList = this.coaList || [];
    modalRef.componentInstance.subledgerList = this.subledgerList || [];
    modalRef.componentInstance.currentMenuId = this.currentMenuId;
  }


  public getFormattedAmount(amount: number | string, currencyMasterSid: number): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === currencyMasterSid
    );

    const input = {
      value: toNumber(amount),
      currencyCode: currency?.currencyCode,
    };

    // Convert formatted string back to number
    const formattedString = this.currencyFormatter.formatAmount(input, false);
    return toNumber(formattedString);
  }

  public getFormattedAndPaddedAmount(amount: number | string, currencyMasterSid: number): string {
    const currency = this.currencyList.find(
      (curr) => curr.CurrencyMasterSid === currencyMasterSid
    );

    const formattedAmount = this.currencyFormatter.formatAmount(
      {
        value: toNumber(amount),
        currencyCode: currency?.currencyCode,
      },
      false
    );

    return Number(formattedAmount).toFixed(this.getAmountDecimalPlaces(currencyMasterSid));
  }

  public getAmountDecimalPlaces(currencyMasterSid: number): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === currencyMasterSid
    );

    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.amountDecimal;
    }

    return 4;
  }

  public getFormattedExchangeRate(rate: number, currencyMasterSid: number): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === currencyMasterSid
    );

    return this.currencyFormatter.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode,
    });
  }

  public getFormattedAndPaddedExchangeRate(rate: number, currencyMasterSid: number): string {
    const currency = this.currencyList.find(
      (curr) => curr.CurrencyMasterSid === currencyMasterSid
    );

    const formattedRate = this.currencyFormatter.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode,
    });

    return Number(formattedRate).toFixed(this.getExchangeRateDecimalPlaces(currencyMasterSid));
  }

  public getExchangeRateDecimalPlaces(currencyMasterSid: number): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === currencyMasterSid
    );

    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.exchangeDecimal || 4;
    }

    return 4;
  }




  isTaxAmountReadonly(index: number): boolean {
  const row = this.details.at(index) as FormGroup;
  const taxPercentage = Number(row.get('taxPercentage')?.value || 0);
  // taxPercentage > 0 => taxAmount readonly
  return taxPercentage === 0;
}
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
resetForm(): void {
  
    if (this.editMode) {
      this.form.patchValue(this.voucherData);
    } else {
      this.initializeForm();
      this.details.clear();
    }
}

 checkVoucherPostingMechanism() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const menuName = 'Journal Voucher';
    if (!companyId || !branchId || !menuName) {
      return;
    }
    console.log('comapny',companyId)
    this.operationService
      .checkVoucherPostingMechanism({
        CompanyMasterSid: companyId,
        BranchMasterSid: branchId,
        MenuName: menuName,
      })
      .subscribe({
        next: (resp) => {
          if (resp.status) {
            this.isAutoPosting = Boolean(resp.data);
          } else {
            this.isAutoPosting = false;
          }
        },
        error: (error: any) => {
          console.error('Error checking voucher posting mechanism:', error);
        },
      });
  }
  formatCurrencyAmount(detailGroup: FormGroup) {
  const currencyMasterSid =
    detailGroup.get('currencyMasterSid')?.value ||
    this.currentCompany?.CurrencyMasterSid;

  const currencyAmount = toNumber(detailGroup.get('currencyAmount')?.value);

  detailGroup.patchValue(
    {
      currencyAmount: this.getFormattedAndPaddedAmount(
        currencyAmount,
        currencyMasterSid
      ),
    },
    { emitEvent: false }
  );
}
  openAuditLogs() {
    if (!this.voucherData?.VoucherHeaderSid) return;
    const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'JournalVoucher Logs';
    modalRef.componentInstance.tableName = 'VoucherHeader';
    modalRef.componentInstance.recordId = this.voucherData?.VoucherHeaderSid.toString();
    modalRef.componentInstance.screenName = 'JournalVoucher';
  }
}


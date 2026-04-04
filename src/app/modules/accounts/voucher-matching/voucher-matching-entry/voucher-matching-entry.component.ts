// Voucher Matching Entry - TS
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { forkJoin, catchError, of, Subject, takeUntil, debounceTime, firstValueFrom } from 'rxjs';
import { AppSettingsService, FinancialYear } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { getDefaultTodayDate, toNumber } from 'src/app/common/helper';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { CompanySettingsManagerService, CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { IMatchingDetail, IVoucherMatching, VoucherMatchingFetchResponse, VoucherMatchingHeaderResponse } from 'src/app/modules/interfaces/voucher-matching.dto';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { FetchVoucherMatchingByIdDto, FetchVoucherMatchingResponse, MatchingDetail, VoucherMatchingCancellationWarnings, VoucherMatchingService } from '../../services/voucher-matching.service';
import { errorLoggerWithToastr, ValidationMessageConfig } from 'src/app/common/error-handling/form-error-handler';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { CommonService } from 'src/app/common/common.service';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

@Component({
  selector: 'app-voucher-matching-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgbDatepickerModule,
    NgbDropdownModule,
    FeatherModule,
    NgSelectModule,
    CustomDatePipe,
    DecimalPrecisionDirective,
    NgxSpinnerModule,
    PreventMultiClickDirective,
  ],
  templateUrl: './voucher-matching-entry.component.html',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class VoucherMatchingEntryComponent implements OnInit, AfterViewInit, OnDestroy {
  // === COMMON ===
  userData: any;
  currentCompany: any;
  currentBranch: any;
  currentMenuId: number;
  currentFinancialYear: FinancialYear;
  currentCompanyCurrency: CurrencySettings;
  isEditMode = false;
  isAutoPosting: boolean = false;
  isPosting: boolean = false;
  postedLocked: boolean = false;
  panelsVisible: boolean = false;

  // === VIEW MODE ===
  voucherMatchingForm!: FormGroup;
  VoucherMatchingHeaderSid!: number;
  voucherMatchingData: any;
  cancellationWarnings: VoucherMatchingCancellationWarnings | null = null;

  // Unsaved changes related varaible declarations
  isDirty: boolean = false;
  isSaving: boolean = false;
  isCancelling: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  private formChangesSub$ = new Subject<void>();

  voucherMatchingFullValidationConfig: ValidationMessageConfig = {
    labels: {
      // ===== Header Fields =====
      VoucherMatchingNo: 'Voucher Matching No',
      VoucherMatchingDate: 'Voucher Matching Date',
      PostDate: 'Post Date',
      Narration: 'Narration',
      Remarks: 'Remarks',
      LedgerName: 'Ledger',
      SubledgerName: 'Subledger',
      PostStatus: 'Post Status',
      Status: 'Status',
      sourceItems: 'Source Items',
      objectItems: 'Object Items',

      // ===== Detail Fields =====
      VoucherNumber: 'Voucher Number',
      VoucherType: 'Voucher Type',
      VoucherDate: 'Voucher Date',
      DrCr: 'Dr/Cr',
      CurrencyCode: 'Currency',
      ExchangeRate: 'Exchange Rate',
      OriginalCurrencyAmount: 'Original Currency Amount',
      OriginalLocalAmount: 'Original Local Amount',
      OutstandingCurrencyAmount: 'Outstanding Currency Amount',
      OutstandingLocalAmount: 'Outstanding Local Amount',
      MatchedCurrencyAmount: 'Matched Currency Amount',
      MatchedLocalAmount: 'Matched Local Amount',
      isTicked: 'Selection'
    },

    messages: {
      required: (label: string) => `${label} is required.`,

      minlength: (label: string, error: any) =>
        `${label} must be at least ${error.requiredLength} characters.`,

      maxlength: (label: string, error: any) =>
        `${label} cannot exceed ${error.requiredLength} characters.`,

      min: (label: string, error: any) =>
        `${label} must be greater than or equal to ${error.min}.`,

      max: (label: string, error: any) =>
        `${label} must be less than or equal to ${error.max}.`,

      pattern: (label: string) =>
        `${label} format is invalid.`,

      default: (label: string) =>
        `${label} is invalid.`
    }
  };

  // === CREATE MODE ===

  ledgerList: any[] = [];
  selectedLedger: any = null;
  selectedLedgerType: 'Sy Cr' | 'Sy Dr' | null;
  subledgerList: any[] = [];
  selectedSubledger: any = null;

  currencyList: any[] = [];
  exchangeDifference: number = 0;
  matchingScenario: 'multi-currency' | 'single-foreign' | 'single-local' | null = null;

  matchedPairs: Array<{ source: any | null, object: any | null, color: string }> = [];
  private readonly PAIR_COLORS = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#e91e63', '#00bcd4'];
  previousMatchingDate: any = null;
  isFullScreen = false;
  vmMinDate: { year: number; month: number; day: number } | null = null;
  vmMaxDate: { year: number; month: number; day: number } | null = null;

  BATCH_SIZE = 10;
  sourceSkip = 0;
  objectSkip = 0;
  hasMoreSourceData = true;
  hasMoreObjectData = true;
  isLoadingSource = false;
  isLoadingObject = false;

  @ViewChild('sourceSentinel') sourceSentinel!: ElementRef;
  @ViewChild('objectSentinel') objectSentinel!: ElementRef;
  @ViewChild('sourceScrollContainer') sourceScrollContainer!: ElementRef;
  @ViewChild('objectScrollContainer') objectScrollContainer!: ElementRef;
  private sourceObserver!: IntersectionObserver;
  private objectObserver!: IntersectionObserver;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private toastr: ToastrService,

    private dropdownStore: DropdownStore,
    private accountsService: AccountsService,
    private voucherMatchingService: VoucherMatchingService,

    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private companySettings: CompanySettingsManagerService,
    private spinner: NgxSpinnerService,
    public mps: MenuPermissionService,
    private modalService: NgbModal,
    private confirmService: ModalService,
    private commonService: CommonService,
  ) { }

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;
    try {
      this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
      this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    } catch (e) {
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }
    this.currentFinancialYear = this.appSettingService.getCurrentFinancialYear();
    this.currentCompanyCurrency = this.companySettings.getCurrencySettings();
    // Create mode: restrict date picker to financial year boundaries
    const fy = this.currentFinancialYear;
    if (fy) {
      const fyStart = new Date(fy.StartDate);
      const today = new Date();
      const fyEnd = new Date(fy.EndDate);
      const effectiveFyEnd = fyEnd > today ? today : fyEnd;
      this.vmMinDate = { year: fyStart.getFullYear(), month: fyStart.getMonth() + 1, day: fyStart.getDate() };
      this.vmMaxDate = { year: effectiveFyEnd.getFullYear(), month: effectiveFyEnd.getMonth() + 1, day: effectiveFyEnd.getDate() };
    }
    this.loadCurrencies();
    this.checkVoucherPostingMechanism();
    this.initForm();
    this.initialFormValue = this.voucherMatchingForm.getRawValue();
    this.currentMenuId = this.mps.getMenuId();
    this.mps.init().subscribe();

    this.route.paramMap.subscribe(params => {
      this.VoucherMatchingHeaderSid = +params.get('VoucherMatchingHeaderSid')!;
      if (this.VoucherMatchingHeaderSid) {
        this.isEditMode = true;
        this.loadVoucherMatchingData(this.VoucherMatchingHeaderSid);
      } else {
        this.isEditMode = false;
        this.subscribeToFormChanges();
        this.loadLedgers();
      }
    });
  }

  //SECTION: Unsaved changes related methods
  subscribeToFormChanges() {
    // Reset any previous subscriptions to avoid duplicates on reload
    this.formChangesSub$.next();
    this.voucherMatchingForm.valueChanges
      .pipe(takeUntil(this.formChangesSub$), takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.voucherMatchingForm.getRawValue()
        );
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) {
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

  deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }


  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue =
        'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    })
  }

  //SECTION: LIFE CYCLE HOOKS
  ngAfterViewInit(): void {
    if (!this.isPosted) this.setupObservers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.sourceObserver?.disconnect();
    this.objectObserver?.disconnect();
  }

  //SECTION: FORM INITIALIZATION
  initForm() {
    this.voucherMatchingForm = this.fb.group({
      VoucherMatchingNo: [{ value: '', disabled: true }],
      VoucherMatchingDate: [getDefaultTodayDate(), [Validators.required]],
      PostDate: [{ value: null, disabled: true }],
      Narration: ['',[Validators.required]],
      Remarks: [''],
      LedgerName: [null, [Validators.required]],
      SubledgerMasterSid : [null, [Validators.required]],
      SubledgerName: [null, [Validators.required]],
      PostStatus: [{ value: 'Unposted', disabled: true }],
      Status: [{ value: 'Active', disabled: true }],
      sourceItems: this.fb.array([]),
      objectItems: this.fb.array([]),
    });
  }


  //SECTION: FORM CONTROLS
  get vm(): { [key: string]: AbstractControl } { return this.voucherMatchingForm.controls; }
  get sourceItems(): FormArray { return this.voucherMatchingForm.get('sourceItems') as FormArray; }
  get objectItems(): FormArray { return this.voucherMatchingForm.get('objectItems') as FormArray; }

  //SECTION: DATA LOADING
  loadVoucherMatchingData(id: number) {
    this.spinner.show();
    const payload: FetchVoucherMatchingByIdDto = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherMatchingHeaderSid: id
    }
    this.voucherMatchingService.getVoucherMatchingByHeaderId(payload).subscribe({
      next: (resp: { status: boolean, data: FetchVoucherMatchingResponse, message: string }) => {
        this.spinner.hide();
        if (resp?.status && resp.data) {
          this.voucherMatchingData = resp.data;
          this.cancellationWarnings = resp.data.cancellationWarnings ?? null;
          this.patchValues(resp.data);
        }
        else this.appSettingService.showError('Error Loading Data');
      },
      error: () => {
        this.spinner.hide();
        this.appSettingService.showError('Error Loading Data');
      },
    });
  }

  //SECTION: DATA PATCHING
  patchValues(data: FetchVoucherMatchingResponse) {
    this.postedLocked = (data?.PostStatus ?? '').toString().trim().toUpperCase() === 'P';
    this.selectedLedger = {
      LedgerName: data?.LedgerName ?? '',
      LedgerSid: data?.SubledgerMasterSid ?? 0,
      COAMasterSid: data?.COAMasterSid ?? null,
    }
    this.selectedLedgerType = data?.LedgerType ?? null;
    this.selectedSubledger = {
      SubledgerName: data?.SubledgerName ?? '',
      SubledgerMasterSid: data?.SubledgerMasterSid ?? 0,
    };

    this.voucherMatchingForm.patchValue({
      VoucherMatchingNo: data.VoucherMatchingNo,
      VoucherMatchingDate: data.VoucherMatchingDate ? new Date(data.VoucherMatchingDate) : null,
      LedgerName: data?.LedgerName ?? null,
      SubledgerMasterSid: data?.SubledgerMasterSid ?? null,
      SubledgerName: data?.SubledgerName ?? null,
      Narration : data?.Narration ?? '',
      Remarks: data?.Remarks ?? '',
      PostDate: data.PostDate ? new Date(data.PostDate) : null,
      PostStatus: data.PostStatus === 'P' ? 'Posted' : 'Unposted',
      Status: data.Status === 'A' ? 'Active' : 'Suspended'
    });

    // Edit mode: restrict date picker to the original document's month
    const _vmOrigDate = new Date(data.VoucherMatchingDate);
    if (!isNaN(_vmOrigDate.getTime())) {
      const _y = _vmOrigDate.getFullYear(), _m = _vmOrigDate.getMonth() + 1;
      const _monthEnd = new Date(_y, _m, 0);
      const _today = new Date(); _today.setHours(0, 0, 0, 0);
      const _effectiveEnd = _monthEnd < _today ? _monthEnd : _today;
      this.vmMinDate = { year: _y, month: _m, day: 1 };
      this.vmMaxDate = { year: _effectiveEnd.getFullYear(), month: _effectiveEnd.getMonth() + 1, day: _effectiveEnd.getDate() };
    }

    this.voucherMatchingForm.get('LedgerName')?.disable();
    this.voucherMatchingForm.get('SubledgerName')?.disable();

    // isPosted getter is accurate now (PostStatus just patched above)
    this.sourceItems.clear();
    data?.MatchingDetail?.filter((item: MatchingDetail) => item.MatchingType === 'Source')
      .forEach((item: MatchingDetail) => this.sourceItems.push(this.createDetailGroup(item, 'Source', this.isPosted)));
    this.objectItems.clear();
    data?.MatchingDetail?.filter((item: MatchingDetail) => item.MatchingType === 'Object')
      .forEach((item: MatchingDetail) => this.objectItems.push(this.createDetailGroup(item, 'Object', this.isPosted)));
    // Show panels if any items loaded (edit mode); panelsVisible stays false for empty records
    this.panelsVisible = this.sourceItems.length > 0 || this.objectItems.length > 0;
    // Prevent "Scroll for more" from showing on saved matching records in edit mode
    if (this.isPosted){ 
      this.computeMatchedPairs();
      this.voucherMatchingForm.disable();
    } else {
      this.hasMoreSourceData = false;
      this.hasMoreObjectData = false;
    }
    this.initialFormValue = this.voucherMatchingForm.getRawValue();
    this.subscribeToFormChanges();
    this.validateMatchingScenario();
  }

  createDetailGroup(item: MatchingDetail, MatchingType: 'Source' | 'Object', readOnly = false): FormGroup {
    const localCurrencyCode = this.currentCompanyCurrency?.code;
    const isBalanceZero =
      (toNumber(item.OutstandingCurrencyAmount ?? 0) - toNumber(item.MatchedCurrencyAmount ?? 0) === 0) &&
      (toNumber(item.OutstandingLocalAmount ?? 0) - toNumber(item.MatchedLocalAmount ?? 0) === 0);
    const isMatchedRecord = !!item.MatchingDetailSid;
    return this.fb.group({
      // Internal fields
      MatchingDetailSid: [item?.MatchingDetailSid ?? null],
      Sno: [item?.Sno ?? null],
      VoucherMatchingHeaderSid: [item?.VoucherMatchingHeaderSid ?? null],
      VoucherHeaderSid: [item?.VoucherHeaderSid ?? null],
      VoucherDetailSid: [item?.VoucherDetailSid ?? null],
      VoucherTransactionSid: [item?.VoucherTransactionSid ?? null],
      MatchingTransactionSid: [item?.MatchingTransactionSid ?? null],

      // Display fields
      VoucherNumber: [{ value: item?.VoucherNumber ?? '', disabled: true }],
      VoucherType: [{ value: item?.VoucherType ?? '', disabled: true }],
      VoucherDate: [{ value: item?.VoucherDate ?? null, disabled: true }],
      DrCr: [{ value: item?.DrCr ?? '', disabled: true }],
      CurrencyCode: [{ value: item?.CurrencyCode ?? '', disabled: true }],
      ExchangeRate: [{
        value: this.getFormattedAndPaddedExchangeRate(toNumber(item?.ExchangeRate), item?.CurrencyCode) ?? '',
        disabled: true
      }],
      OriginalCurrencyAmount: [{
        value: this.getFormattedAndPaddedAmount(item?.OriginalCurrencyAmount, item?.CurrencyCode) ?? '',
        disabled: true
      }],
      OriginalLocalAmount: [{
        value: this.getFormattedAndPaddedAmount(item?.OriginalLocalAmount, localCurrencyCode) ?? '',
        disabled: true
      }],
      OutstandingCurrencyAmount: [{
        value: this.getFormattedAndPaddedAmount(item?.OutstandingCurrencyAmount, item?.CurrencyCode) ?? '',
        disabled: true
      }],
      OutstandingLocalAmount: [{
        value: this.getFormattedAndPaddedAmount(item?.OutstandingLocalAmount, localCurrencyCode) ?? '',
        disabled: true
      }],
      MatchedCurrencyAmount: [{
        value: isMatchedRecord ?
          this.getFormattedAndPaddedAmount(item?.MatchedCurrencyAmount, item?.CurrencyCode) :
          null,
        disabled: readOnly
      }],
      MatchedLocalAmount: [{
        value: isMatchedRecord ?
          this.getFormattedAndPaddedAmount(item?.MatchedLocalAmount, localCurrencyCode) :
          null,
        disabled: readOnly
      }],
      isTicked: [{ value: isBalanceZero ?? false, disabled: readOnly }],
      MatchingType: [item?.MatchingType ?? MatchingType],
    });
  }

  //SECTION: DATA FETCHERS
  loadCurrencies() {
    this.dropdownStore.loadCurrencies().subscribe(currencies => {
      this.currencyList = (currencies || []).map((c: any) => ({ ...c, countryName: c?.countryMaster?.countryName }));
      this.currencyConfigService.initializeConfigurations(this.currencyList);
    });
  }

  loadLedgers() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    forkJoin({
      syDr: this.accountsService.getCOAByLedgerType('Sy Dr', companyId).pipe(catchError(() => of([]))),
      syCr: this.accountsService.getCOAByLedgerType('Sy Cr', companyId).pipe(catchError(() => of([]))),
    }).subscribe(({ syDr, syCr }) => {
      this.ledgerList = [
        ...(syDr || []).map((l: any) => ({ ...l, _ledgerType: 'Sy Dr' })),
        ...(syCr || []).map((l: any) => ({ ...l, _ledgerType: 'Sy Cr' })),
      ];
    });
  }

  loadSourceData() {
    if (this.isPosted || this.isPosting || this.isLoadingSource || !this.hasMoreSourceData) return;
    this.isLoadingSource = true;
    this.voucherMatchingService.searchCustomerOutstandingVouchers({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      LedgerMasterSid: this.selectedSubledger?.SubledgerMasterSid,
      DrCr: this.selectedLedgerType === 'Sy Cr' ? 'D' : 'C',
      Skip: this.sourceSkip,
      Take: this.BATCH_SIZE,
      VoucherMatchingDate: this.voucherMatchingForm.get('VoucherMatchingDate')?.value ?? undefined,
      COAMasterSid: this.selectedLedger?.COAMasterSid ?? undefined,
    }).subscribe({
      next: (resp: any) => {
        if (this.isPosted || this.isPosting) {
          this.isLoadingSource = false;
          return;
        }
        const data = resp?.status ? resp.data : resp;
        if (data?.length) {
          const existingTransactionSid = this.sourceItems.getRawValue().map(tx => tx.VoucherTransactionSid);
          data
          .filter(tx => !existingTransactionSid.includes(tx.VoucherTransactionSid))
          .forEach((tx: any) => this.sourceItems.push(this.createDetailGroup(tx, 'Source')));
          this.sourceSkip += data.length;
          this.hasMoreSourceData = data.length >= this.BATCH_SIZE;
        } else { this.hasMoreSourceData = false; }
        this.isLoadingSource = false;
        if (this.hasMoreSourceData) setTimeout(() => this.reobserveSentinel('source'), 0);
        setTimeout(() => this.fetchMoreIfAtBottom('source'), 0);
      },
      error: () => { this.isLoadingSource = false; },
    });
  }

  loadObjectData() {
    if (this.isPosted || this.isPosting || this.isLoadingObject || !this.hasMoreObjectData) return;
    this.isLoadingObject = true;
    this.voucherMatchingService.searchCustomerOutstandingVouchers({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      LedgerMasterSid: this.selectedSubledger?.SubledgerMasterSid,
      DrCr: this.selectedLedgerType === 'Sy Cr' ? 'C' : 'D',
      Skip: this.objectSkip,
      Take: this.BATCH_SIZE,
      VoucherMatchingDate: this.voucherMatchingForm.get('VoucherMatchingDate')?.value ?? undefined,
      COAMasterSid: this.selectedLedger?.COAMasterSid ?? undefined,
    }).subscribe({
      next: (resp: any) => {
        if (this.isPosted || this.isPosting) {
          this.isLoadingObject = false;
          return;
        }
        const data = resp?.status ? resp.data : resp;
        if (data?.length) {
          const existingTransactionSid = this.objectItems.getRawValue().map(tx => tx.VoucherTransactionSid);
          data
            .filter(tx => !existingTransactionSid.includes(tx.VoucherTransactionSid))
            .forEach((tx: any) => this.objectItems.push(this.createDetailGroup(tx, 'Object')));
          this.objectSkip += data.length;
          this.hasMoreObjectData = data.length >= this.BATCH_SIZE;
        } else { this.hasMoreObjectData = false; }
        this.isLoadingObject = false;
        if (this.hasMoreObjectData) setTimeout(() => this.reobserveSentinel('object'), 0);
        setTimeout(() => this.fetchMoreIfAtBottom('object'), 0);
      },
      error: () => { this.isLoadingObject = false; },
    });
  }

  //SECTION: HANDLERS
  onLedgerChange(ledger: any) {
    this.selectedLedger = ledger;
    this.selectedLedgerType = ledger?._ledgerType || null;
    this.subledgerList = [];
    this.selectedSubledger = null;
    this.voucherMatchingForm.get('SubledgerName')?.setValue(null);
    this.clearCreateDetail();
    if (!ledger) return;
    this.accountsService.getSubledgersByCOA({
      COAMasterSid: ledger.COAMasterSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    }).subscribe({
      next: (resp: any) => { this.subledgerList = resp?.status ? (resp.data || []) : []; },
      error: () => this.appSettingService.showError('Error loading subledgers'),
    });
  }

  async onSubledgerChange(sub: any): Promise<void> {
    const hasRows = this.sourceItems.length > 0 || this.objectItems.length > 0;
    if (hasRows) {
      const confirmed = await this.confirmService.confirm(
        'Changing the party will clear all loaded source and object records. Do you want to proceed?',
        'Confirm Party Change',
        'Clear & Change'
      );
      if (!confirmed) {
        this.voucherMatchingForm.get('SubledgerName')?.setValue(this.selectedSubledger, { emitEvent: false });
        return;
      }
      this.clearCreateDetail();
    }
    this.voucherMatchingForm.get('SubledgerMasterSid')?.setValue(sub.SubledgerMasterSid);
    this.selectedSubledger = sub;
  }

  onGet() {
    if (this.isPosted) { return; }
    if (!this.selectedLedger) { this.appSettingService.showWarning('Please select a Ledger'); return; }
    if (!this.selectedSubledger) { this.appSettingService.showWarning('Please select a Subledger'); return; }
    if (!this.isEditMode) {
      this.clearCreateDetail();
    } else {
      // Remove previously fetched outstanding items (no MatchingDetailSid) but keep saved matched items
      for (let i = this.sourceItems.length - 1; i >= 0; i--) {
        if (!this.sourceItems.at(i).getRawValue().MatchingDetailSid) this.sourceItems.removeAt(i);
      }
      for (let i = this.objectItems.length - 1; i >= 0; i--) {
        if (!this.objectItems.at(i).getRawValue().MatchingDetailSid) this.objectItems.removeAt(i);
      }
      this.sourceSkip = 0;
      this.objectSkip = 0;
      this.hasMoreSourceData = true;
      this.hasMoreObjectData = true;
      this.isLoadingSource = false;
      this.isLoadingObject = false;
    }
    // Show both panels immediately so source and object appear together,
    // each showing its own loading indicator while their requests resolve in parallel.
    this.panelsVisible = true;
    this.loadSourceData();
    this.loadObjectData();
    setTimeout(() => this.setupObservers(), 0);
  }

  //SECTION : SCROLLING RELATED FUNCTIONS
  private reobserveSentinel(panel: 'source' | 'object') {
    if (this.isPosted || this.isPosting) return;
    if (panel === 'source' && this.sourceSentinel?.nativeElement) {
      this.sourceObserver?.disconnect();
      this.sourceObserver = new IntersectionObserver(e => { if (e[0].isIntersecting) this.loadSourceData(); }, { root: this.sourceScrollContainer?.nativeElement, threshold: 0.1 });
      this.sourceObserver.observe(this.sourceSentinel.nativeElement);
    }
    if (panel === 'object' && this.objectSentinel?.nativeElement) {
      this.objectObserver?.disconnect();
      this.objectObserver = new IntersectionObserver(e => { if (e[0].isIntersecting) this.loadObjectData(); }, { root: this.objectScrollContainer?.nativeElement, threshold: 0.1 });
      this.objectObserver.observe(this.objectSentinel.nativeElement);
    }
  }

  private setupObservers() {
    if (this.isPosted || this.isPosting) return;
    this.reobserveSentinel('source');
    this.reobserveSentinel('object');
    this.fetchMoreIfAtBottom('source');
    this.fetchMoreIfAtBottom('object');
  }

  onPanelScroll(panel: 'source' | 'object') {
    this.fetchMoreIfAtBottom(panel);
  }

  private fetchMoreIfAtBottom(panel: 'source' | 'object') {
    const container = panel === 'source'
      ? this.sourceScrollContainer?.nativeElement
      : this.objectScrollContainer?.nativeElement;
    if (!container) return;

    const nearBottom = (container.scrollTop + container.clientHeight) >= (container.scrollHeight - 24);
    if (!nearBottom) return;

    if (panel === 'source') {
      if (!this.isLoadingSource && this.hasMoreSourceData) this.loadSourceData();
      return;
    }
    if (!this.isLoadingObject && this.hasMoreObjectData) this.loadObjectData();
  }

  //SECTION: CALCULATIONS
  onTickMatch(formArray: FormArray, index: number, event: any) {
    const checked = event.target.checked;
    const row = formArray.at(index) as FormGroup;
    const raw = row.getRawValue();
    if (!checked) {
      // Reset to null so deepEqual correctly detects "no change" when user tick-unticks back to original
      row.patchValue({
        isTicked: false,
        MatchedCurrencyAmount: null,
        MatchedLocalAmount: null,
      });
      this.validateMatchingScenario();
      return;
    }
    row.patchValue({
      isTicked: true,
      MatchedCurrencyAmount: toNumber(raw.OutstandingCurrencyAmount),
      MatchedLocalAmount: toNumber(raw.OutstandingLocalAmount),
    });
    this.validateMatchingScenario();
  }

  onMatchAmountChange(fa: FormArray, i: number) {
    this.calculateLocalAmountForRow(fa, i);
    this.validateMatchingScenario();
  }

  calculateLocalAmountForRow(fa: FormArray, i: number) {
    const row = fa.at(i) as FormGroup;
    const raw = row.getRawValue();
    const matchCurrencyAmt = toNumber(raw.MatchedCurrencyAmount);
    const osCurrencyAmt = toNumber(raw.OutstandingCurrencyAmount);
    const osLocalAmt = toNumber(raw.OutstandingLocalAmount);
    // If outstanding has a currency amount but zero local amount, keep local at 0
    if (osCurrencyAmt !== 0 && osLocalAmt === 0) {
      row.get('MatchedLocalAmount')?.setValue(this.getFormattedAndPaddedAmount(0, raw.CurrencyCode));
    } else if (matchCurrencyAmt === osCurrencyAmt) {
      row.get('MatchedLocalAmount')?.setValue(this.getFormattedAndPaddedAmount(osLocalAmt, raw.CurrencyCode));
    } else {
      row.get('MatchedLocalAmount')?.setValue(this.getFormattedAndPaddedAmount(matchCurrencyAmt * (toNumber(raw.ExchangeRate) || 1), raw.CurrencyCode));
    }

    this.validateMatchLimits(fa, i);
  }

  validateMatchLimits(fa: FormArray, i: number) {
    const row = fa.at(i) as FormGroup;
    const rawValue = row.getRawValue();
    const match = toNumber(rawValue.MatchedCurrencyAmount);
    const os = toNumber(rawValue.OutstandingCurrencyAmount);
    row.get('MatchedCurrencyAmount')?.setErrors(match && Math.abs(match) > Math.abs(os) ? { limitExceeded: true } : null);
  }

  validateMatchingScenario(): { valid: boolean; message?: string } {
    const srcRows = this.sourceItems.getRawValue().filter((s: any) => toNumber(s.MatchedCurrencyAmount) !== 0);
    const objRows = this.objectItems.getRawValue().filter((o: any) => toNumber(o.MatchedCurrencyAmount) !== 0);
    const allRows = [...srcRows, ...objRows];

    if (allRows.length === 0) {
      this.matchingScenario = null;
      this.exchangeDifference = 0;
      return { valid: false, message: 'No matching amounts entered.' };
    }

    const currencies = new Set(allRows.map((r: any) => r.CurrencyCode));
    const isSingleCurrency = currencies.size === 1;

    const srcTotalLocal = srcRows.reduce((s: number, r: any) => s + toNumber(r.MatchedLocalAmount), 0);
    const objTotalLocal = objRows.reduce((s: number, r: any) => s + toNumber(r.MatchedLocalAmount), 0);
    const srcTotalCurr = srcRows.reduce((s: number, r: any) => s + toNumber(r.MatchedCurrencyAmount), 0);
    const objTotalCurr = objRows.reduce((s: number, r: any) => s + toNumber(r.MatchedCurrencyAmount), 0);

    const localCurrencyCode = this.currentCompanyCurrency?.code;
    const txCurrencyCode = allRows[0]?.CurrencyCode;
    const localDecimals = this.getAmountDecimalPlaces(localCurrencyCode);
    const txDecimals = this.getAmountDecimalPlaces(txCurrencyCode);
    const roundAmt = (value: number, currencyCode: string): number =>
      toNumber(this.currencyFormatService.formatAmount({ value, currencyCode }, false));

    if (!isSingleCurrency) {
      // Scenario 1: Multi-currency — local totals must match
      this.matchingScenario = 'multi-currency';
      this.exchangeDifference = 0;
      const localDiff = Math.abs(roundAmt(srcTotalLocal - objTotalLocal, localCurrencyCode));
      if (localDiff > 0) {
        return { valid: false, message: `Multi-currency matching requires equal local amount totals. Source: ${srcTotalLocal.toFixed(localDecimals)}, Object: ${objTotalLocal.toFixed(localDecimals)}, Difference: ${localDiff.toFixed(localDecimals)}` };
      }
      return { valid: true };
    }

    // Single currency
    const isLocalCurrency = allRows.every((r: any) => toNumber(r.ExchangeRate) === 1);

    if (isLocalCurrency) {
      // Scenario 3: Single local currency — both totals must match
      this.matchingScenario = 'single-local';
      this.exchangeDifference = 0;
      const currDiff = Math.abs(roundAmt(srcTotalCurr - objTotalCurr, txCurrencyCode));
      const localDiff = Math.abs(roundAmt(srcTotalLocal - objTotalLocal, localCurrencyCode));
      if (currDiff > 0 || localDiff > 0) {
        return { valid: false, message: `Local currency matching requires both currency and local totals to match. Currency diff: ${currDiff.toFixed(txDecimals)}, Local diff: ${localDiff.toFixed(localDecimals)}` };
      }
      return { valid: true };
    }

    // Scenario 2: Single foreign currency — currency totals must match, local diff = Exchange JV
    this.matchingScenario = 'single-foreign';
    const currDiff = Math.abs(roundAmt(srcTotalCurr - objTotalCurr, txCurrencyCode));
    if (currDiff > 0) {
      this.exchangeDifference = 0;
      return { valid: false, message: `Single foreign currency matching requires currency totals to match. Source: ${srcTotalCurr.toFixed(txDecimals)}, Object: ${objTotalCurr.toFixed(txDecimals)}, Difference: ${currDiff.toFixed(txDecimals)}` };
    }
    this.exchangeDifference = roundAmt(srcTotalLocal - objTotalLocal, localCurrencyCode);
    return { valid: true };
  }

  computeMatchedPairs() {
    const sources = this.sourceItems.getRawValue();
    const objects = this.objectItems.getRawValue();

    const result: Array<{ source: any | null, object: any | null, color: string }> = [];

    const allSnos = new Set<number>([
      ...sources.map((s: any) => s.Sno),
      ...objects.map((o: any) => o.Sno)
    ]);

    const sortedSnos = Array.from(allSnos).sort((a, b) => a - b);

    sortedSnos.forEach((sno, index) => {
      const source = sources.find((s: any) => s.Sno === sno) ?? null;
      const object = objects.find((o: any) => o.Sno === sno) ?? null;

      result.push({
        source,
        object,
        color: this.PAIR_COLORS[index % this.PAIR_COLORS.length]
      });
    });

    this.matchedPairs = result;
  }

  clearCreateDetail() {
    this.matchedPairs = [];
    this.sourceItems.clear(); this.objectItems.clear();
    this.sourceSkip = 0; this.objectSkip = 0;
    this.hasMoreSourceData = true; this.hasMoreObjectData = true;
    this.isLoadingSource = false; this.isLoadingObject = false;
    this.exchangeDifference = 0; this.matchingScenario = null;
    this.panelsVisible = false;
  }


  //SECTION GETTERS
  getTotal(fa: FormArray, field: string): number {
    return fa.controls.reduce((s, c) => s + toNumber(c.getRawValue()[field]), 0);
  }

  get isPosted(): boolean {
    return this.voucherMatchingForm.get('PostStatus')?.value === 'Posted';
  }
  get isActive(): boolean {
    return this.voucherMatchingForm.get('Status')?.value === 'Active';
  }
  get sourceTotalCurrAmt() { return this.getTotal(this.sourceItems, 'OriginalCurrencyAmount'); }
  get sourceTotalLocalAmt() { return this.getTotal(this.sourceItems, 'OriginalLocalAmount'); }
  get sourceTotalOsCurrAmt() { return this.getTotal(this.sourceItems, 'OutstandingCurrencyAmount'); }
  get sourceTotalOsLocalAmt() { return this.getTotal(this.sourceItems, 'OutstandingLocalAmount'); }
  get sourceTotalMatchCurrAmt() { return this.getTotal(this.sourceItems, 'MatchedCurrencyAmount'); }
  get sourceTotalMatchLocalAmt() { return this.getTotal(this.sourceItems, 'MatchedLocalAmount'); }
  get objectTotalCurrAmt() { return this.getTotal(this.objectItems, 'OriginalCurrencyAmount'); }
  get objectTotalLocalAmt() { return this.getTotal(this.objectItems, 'OriginalLocalAmount'); }
  get objectTotalOsCurrAmt() { return this.getTotal(this.objectItems, 'OutstandingCurrencyAmount'); }
  get objectTotalOsLocalAmt() { return this.getTotal(this.objectItems, 'OutstandingLocalAmount'); }
  get objectTotalMatchCurrAmt() { return this.getTotal(this.objectItems, 'MatchedCurrencyAmount'); }
  get objectTotalMatchLocalAmt() { return this.getTotal(this.objectItems, 'MatchedLocalAmount'); }
  get isMultiCurrency(): boolean { return this.matchingScenario === 'multi-currency'; }
  get singleCurrencyCode(): string {
    const allRows = [...this.sourceItems.getRawValue(), ...this.objectItems.getRawValue()];
    const matched = allRows.filter((r: any) => toNumber(r.MatchedCurrencyAmount) !== 0);
    return matched.length > 0 ? matched[0].CurrencyCode : '';
  }
  get currencyAmountsMatch(): boolean {
    return Math.abs(this.sourceTotalMatchCurrAmt - this.objectTotalMatchCurrAmt) < 0.005;
  }
  get localAmountsMatch(): boolean {
    return Math.abs(this.sourceTotalMatchLocalAmt - this.objectTotalMatchLocalAmt) < 0.005;
  }

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
  }
  get loadedIsMultiCurrency(): boolean {
    const rows = [
      ...this.sourceItems.getRawValue(),
      ...this.objectItems.getRawValue()
    ];
    if (!rows.length) {
      return false;
    }
    const currencySet = new Set(
      rows
        .filter((r: any) => r.CurrencyCode && (toNumber(r.MatchedCurrencyAmount) > 0 || toNumber(r.MatchedLocalAmount) > 0))
        .map((r: any) => r.CurrencyCode)
    );
    return currencySet.size > 1; // multi currency means more than 1
  }

  // Per-row balance: Outstanding - Matched
  getRowBalance(row: AbstractControl, field: 'currency' | 'local'): number {
    const raw = (row as FormGroup).getRawValue();
    if (field === 'currency') {
      return toNumber(raw.OutstandingCurrencyAmount) - toNumber(raw.MatchedCurrencyAmount ?? 0);
    }
    return toNumber(raw.OutstandingLocalAmount) - toNumber(raw.MatchedLocalAmount ?? 0);
  }

  // Difference between source and object matched totals
  get diffMatchCurrAmt(): number { return this.sourceTotalMatchCurrAmt - this.objectTotalMatchCurrAmt; }
  get diffMatchLocalAmt(): number { return this.sourceTotalMatchLocalAmt - this.objectTotalMatchLocalAmt; }

  // Remaining balance totals (Outstanding - Matched)
  get sourceTotalBalCurrAmt(): number { return this.sourceTotalOsCurrAmt - this.sourceTotalMatchCurrAmt; }
  get sourceTotalBalLocalAmt(): number { return this.sourceTotalOsLocalAmt - this.sourceTotalMatchLocalAmt; }
  get objectTotalBalCurrAmt(): number { return this.objectTotalOsCurrAmt - this.objectTotalMatchCurrAmt; }
  get objectTotalBalLocalAmt(): number { return this.objectTotalOsLocalAmt - this.objectTotalMatchLocalAmt; }

  get hasAtLeaseOneValidSourceItem(): boolean {
    return this.sourceItems.controls.some(c => toNumber(c.get('MatchedCurrencyAmount')?.value) !== 0 || toNumber(c.get('MatchedLocalAmount')?.value) !== 0);
  }

  get hasAtLeaseOneValidObjectItem(): boolean {
    return this.objectItems.controls.some(c => toNumber(c.get('MatchedCurrencyAmount')?.value) !== 0 || toNumber(c.get('MatchedLocalAmount')?.value) !== 0);
  }

  get hasErrors(): boolean {
    return this.sourceItems.controls.some(c => c.get('MatchedCurrencyAmount')?.errors)
      || this.objectItems.controls.some(c => c.get('MatchedCurrencyAmount')?.errors);
  }

  public getCurrencyMasterSid(code: string): number {
    if (!code || !this.currencyList) return 0;
    return this.currencyList.find((c: any) => c.currencyCode?.toUpperCase() === code.toUpperCase())?.CurrencyMasterSid || 0;
  }

  //!SECTION - CURRENCY BASED FORMAT HELPERS

  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  public getFormattedAndPaddedExchangeRate(
    rate: number,
    currency: string | number
  ): string {
    const currencyCode = typeof currency === 'number' ?
      this.currencyList.find((c) => c.currencyCode === currency)?.CurrencyMasterSid
      : currency;
    const formattedExchangeRate = this.currencyFormatService.formatExchangeRate({
      value: rate,
      currencyCode: currencyCode,
    });
    return formattedExchangeRate.toFixed(this.getExchangeRateDecimalPlaces(currencyCode));
  }

  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces('USD') returns 3
   */
  public getExchangeRateDecimalPlaces(currency: string | number): number {
    const currencyCode = typeof currency === 'number' ?
      this.currencyList.find((c) => c.currencyCode === currency)?.CurrencyMasterSid
      : currency;
    if (currencyCode) {
      const config = this.currencyConfigService.getCurrencyConfig(currencyCode);
      return config?.exchangeDecimal;
    }
    return 4;
  }


  public getFormattedAndPaddedAmount(amount: number | string, currency: string | number) {
    const currencyCode = typeof currency === 'number' ?
      this.currencyList.find((c) => c.currencyCode === currency)?.CurrencyMasterSid
      : currency;
    const input = {
      value: toNumber(amount),
      currencyCode,
    };
    const formattedAmount = this.currencyFormatService.formatAmount(input, false);
    const digitForPadding = this.getAmountDecimalPlaces(currencyCode);
    return Number(formattedAmount).toFixed(digitForPadding);
  }

  public getAmountDecimalPlaces(currency: string | number): number {
    const currencyCode = typeof currency === 'number' ?
      this.currencyList.find((c) => c.currencyCode === currency)?.CurrencyMasterSid
      : currency;
    if (currencyCode) {
      const config = this.currencyConfigService.getCurrencyConfig(currencyCode);
      return config?.amountDecimal;
    }
    return 4;
  }

  /** END OF SECTION - CURRENCY BASED FORMAT HELPERS */

  /**SECTION Submit Function */
  onSubmit(resolve?: (value: boolean) => void) {

    const rawValue = this.voucherMatchingForm.getRawValue();
    // Validate voucher date is within financial year
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = new Date(rawValue.VoucherMatchingDate);
      const fyStart = new Date(fy.StartDate);
      const fyEnd = new Date(fy.EndDate);
      if (voucherDate < fyStart || voucherDate > fyEnd) {
        this.appSettingService.showWarning(
          `Voucher Matching date must be within the financial year (${fy.YearName})`
        );
        if (resolve) resolve(false);
        return;
      }
    }

    // Check if there are any changes (edit mode only — create mode always has new data to save)
    if (this.isEditMode && this.deepEqual(rawValue, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.voucherMatchingForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    // check if the ledger is choosed
    if (!this.selectedLedger || !this.selectedSubledger) {
      this.appSettingService.showWarning('Please select a Ledger and Subledger');
      if (resolve) resolve(false);
      return;
    }

    // check if at least one valid source item exists
    if (!this.hasAtLeaseOneValidSourceItem) {
      this.appSettingService.showWarning('Please enter matching amount in atleast one source typed voucher.');
      if (resolve) resolve(false);
      return;
    }

    // check if at least one valid object item exists
    if (!this.hasAtLeaseOneValidObjectItem) {
      this.appSettingService.showWarning('Please enter matching amount in atleast one object typed voucher.');
      if (resolve) resolve(false);
      return;
    }

    if (this.hasErrors) {
      this.appSettingService.showWarning('Please fix matching amount errors (exceeds outstanding)');
      if (resolve) resolve(false);
      return;
    }

    const validation = this.validateMatchingScenario();
    if (!validation.valid) {
      this.appSettingService.showWarning(validation.message!);
      if (resolve) resolve(false);
      return;
    }

    if(this.voucherMatchingForm.invalid) {
      errorLoggerWithToastr(this.voucherMatchingForm, this.toastr, this.voucherMatchingFullValidationConfig);
      // this.appSettingService.showWarning("Please fill all required fields.");
      this.voucherMatchingForm.markAsTouched();
      this.voucherMatchingForm.updateValueAndValidity();
      if (resolve) resolve(false);
      return;
    }

    this.isSaving = true;
    this.spinner.show();
    const sourceItems = this.sourceItems.getRawValue() || [];
    const objectItems = this.objectItems.getRawValue() || [];

    const allDetails = [...sourceItems, ...objectItems];
    const validSource = sourceItems.filter((item) => item.MatchedCurrencyAmount > 0 || item.MatchedLocalAmount > 0);
    const IsSingleSource = validSource.length === 1;
    const voucherMatchings = allDetails.map((item: any, index: number) => {
      const currency = this.currencyList.find(curr => curr.currencyCode === item.CurrencyCode);
      return {
        ...(item.MatchingDetailSid ? { MatchingDetailSid: item.MatchingDetailSid } : {}),
        BranchName: item.BranchName,
        VoucherHeaderSid: item.VoucherHeaderSid,
        VoucherDetailSid: item.VoucherDetailSid,
        VoucherTransactionSid: item.VoucherTransactionSid,
        VoucherType: item.VoucherType,
        CurrencyCode: item.CurrencyCode,
        ExchangeRate: toNumber(item.ExchangeRate),
        DrCr: item.DrCr,
        OriginalCurrencyAmount: toNumber(item.OriginalCurrencyAmount),
        OriginalLocalAmount: toNumber(item.OriginalLocalAmount),
        PartyAmount: 0,
        SourceVoucherHeaderSid: IsSingleSource ? validSource?.[0]?.VoucherHeaderSid : null,
        MatchingCurrency: currency?.CurrencyMasterSid,
        MatchingExRate: toNumber(item.ExchangeRate),
        MatchedCurrencyAmount: toNumber(item.MatchedCurrencyAmount),
        MatchedLocalAmount: toNumber(item.MatchedLocalAmount),
        MatchingTDSAmount: toNumber(item.MatchingTDSAmount),
        MatchingType: item.MatchingType
      }
    })

    const payload: any = {
      ...(this.isEditMode ? { VoucherMatchingHeaderSid: this.VoucherMatchingHeaderSid } : {}),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherMatchingDate: rawValue.VoucherMatchingDate ? rawValue.VoucherMatchingDate : getDefaultTodayDate(),
      VoucherHeaderSid: IsSingleSource ? validSource?.[0]?.VoucherHeaderSid ?? null : null,
      Narration : rawValue.Narration || '',
      Remarks: rawValue.Remarks || rawValue.Narration || '',
      SubledgerName: this.selectedSubledger?.SubledgerName || '',
      YearMasterSid: this.currentFinancialYear?.YearMasterSid,
      LocalCurrencyMasterSid: this.currentCompany?.CurrencyMasterSid,
      LocalCurrencyCode: this.currentCompanyCurrency?.code,
      current_date: getDefaultTodayDate(),
      userEmail: this.userData?.userEmail || '',
      MatchingDetail: voucherMatchings
    };

    if (this.isEditMode && this.VoucherMatchingHeaderSid) {
      this.voucherMatchingService.updateStandaloneVoucherMatching(payload).subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          if (resp?.status) {
            this.isDirty = false;
            this.appSettingService.showSuccess('Voucher matching updated successfully');
            if (resolve) resolve(true);
            this.loadVoucherMatchingData(this.VoucherMatchingHeaderSid);
          }
          else {
            this.appSettingService.showError(resp?.message || 'Error updating voucher matching');
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (err: any) => {
          this.appSettingService.showError(err?.message || 'Error updating voucher matching');
          this.isSaving = false;
          if (resolve) resolve(false);
          this.spinner.hide();
        },
      });
    } else {
      this.voucherMatchingService.createStandaloneVoucherMatching(payload).subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          if (resp?.status) {
            this.isDirty = false;
            this.VoucherMatchingHeaderSid = resp?.data?.VoucherMatchingHeaderSid;
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['accounts/voucher-matching/entry', this.VoucherMatchingHeaderSid]);
          }
          else {
            this.appSettingService.showError(resp?.message || 'Error creating voucher matching');
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          this.appSettingService.showError(err?.message || 'Error creating voucher matching');
          if (resolve) resolve(false);
          this.spinner.hide();
        },
      });
    }
  }


  /**SECTION - Posting Function */
  async postVoucher(): Promise<void> {
    try {
      this.isPosting = true;
      this.spinner.show();
      const payload = {
        VoucherMatchingHeaderSid: this.VoucherMatchingHeaderSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        YearMasterSid: this.currentFinancialYear?.YearMasterSid,
        LocalCurrencyMasterSid: this.currentCompany?.CurrencyMasterSid,
        LocalCurrencyCode: this.currentCompanyCurrency?.code,
        current_date: getDefaultTodayDate(),
        postedBy: this.userData?.userEmail
      };

      const result = await firstValueFrom(
        this.voucherMatchingService.postVoucherMatching(payload)
      );

      this.spinner.hide();
      this.isPosting = false;
      if (result.status) {
        this.appSettingService.showSuccess(result.message);
        this.isDirty = false;
        this.loadVoucherMatchingData(this.VoucherMatchingHeaderSid);
      } else {
        this.appSettingService.showError(result.message);
      }
    } catch (error: any) {
      this.spinner.hide();
      this.isPosting = false;
      this.appSettingService.showError(error?.message || 'Error posting voucher matching');
    }
  }

  onReset() {
    if (this.isEditMode) {
      this.loadVoucherMatchingData(this.VoucherMatchingHeaderSid);
      return;
    }
    this.voucherMatchingForm.patchValue({
      VoucherMatchingDate: getDefaultTodayDate(),
      Remarks: '',
      LedgerName: null,
      SubledgerName: null,
    });
    this.selectedLedger = null;
    this.selectedLedgerType = null;
    this.selectedSubledger = null;
    this.subledgerList = [];
    this.clearCreateDetail();
    this.isDirty = false;
  }

  cancelVoucherMatching() {
    this.confirmService.confirm(
      this.buildCancelVoucherMatchingMessage(),
      'Cancel Voucher Matching',
      'Yes, Proceed'
    ).then((confirmed) => {
      if (!confirmed) return;
      this.isCancelling = true;
      const payload = {
        VoucherMatchingHeaderSid: this.VoucherMatchingHeaderSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        YearMasterSid: this.currentFinancialYear?.YearMasterSid,
        LocalCurrencyMasterSid: this.currentCompany.CurrencyMasterSid ||  this.currentCompanyCurrency?.currencyMasterSid,
        LocalCurrencyCode: this.currentCompanyCurrency?.code,
        cancelledBy: this.userData?.userEmail || '',
      };
      this.voucherMatchingService.cancelVoucherMatching(payload).subscribe({
        next: (resp: any) => {
          this.isCancelling = false;
          if (resp?.status) {
            this.toastr.success('Voucher matching cancelled successfully');
            this.navigateToBack();
          } else {
            this.toastr.error(resp?.message || 'Failed to cancel voucher matching');
          }
        },
        error: (err: any) => {
          this.isCancelling = false;
          this.toastr.error('Failed to cancel voucher matching');
          console.error('Cancel voucher matching error:', err);
        },
      });
    });
  }

  private buildCancelVoucherMatchingMessage(): string {
    const warnings = this.cancellationWarnings;
    if (!warnings?.hasWarning) {
      return 'Are you sure you want to cancel this voucher matching? This action cannot be undone. Any associated Exchange JV will be reversed.';
    }

    const sections: string[] = [];
    const hasAffected = !!warnings.affectedVouchers?.length;
    const hasExchangeJV = !!warnings.exchangeJVs?.length;
    const docType = warnings.documentTypeName || 'Receipt/Payment';

    // Warning header
    sections.push(`<div style="font-size:13px;font-weight:600;color:#664d03;margin-bottom:8px;"><i class="bi bi-exclamation-triangle-fill" style="font-size:13px;margin-right:5px;"></i>Cancelling this matching affects related vouchers.</div>`);

    // Write-Off / Exchange Gain Or Loss section
    if (hasAffected) {
      const pills = warnings.affectedVouchers
        .map((item) => {
          const href = this.getVoucherHref(item.voucherType, item.voucherHeaderSid);
          const label = `${this.escapeConfirmHtml(item.voucherType)} ${this.escapeConfirmHtml(item.voucherNumber)}`;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:4px;background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;font-size:12px;font-weight:600;text-decoration:none;"><i class="bi bi-file-earmark-text" style="font-size:11px;"></i>${label}</a>`;
        })
        .join(' ');

      sections.push(`<div style="border-radius:5px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:6px;">
        <div style="padding:3px 10px;background:#dc3545;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;"><i class="bi bi-exclamation-circle-fill" style="font-size:11px;margin-right:4px;"></i>Write-Off / Exchange Gain or Loss</div>
        <div style="padding:6px 10px;font-size:12px;color:#64748b;">Needs manual attention: ${pills}</div>
      </div>`);
    }

    // Exchange JV section
    if (hasExchangeJV) {
      const pills = warnings.exchangeJVs
        .map((item) => {
          const href = this.getVoucherHref(item.voucherType, item.voucherHeaderSid);
          const label = `${this.escapeConfirmHtml(item.voucherType)} ${this.escapeConfirmHtml(item.voucherNumber)}`;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:4px;background:#fff7ed;border:1px solid #fdba74;color:#c2410c;font-size:12px;font-weight:600;text-decoration:none;"><i class="bi bi-arrow-left-right" style="font-size:11px;"></i>${label}</a>`;
        })
        .join(' ');

      sections.push(`<div style="border-radius:5px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:6px;">
        <div style="padding:3px 10px;background:#e67700;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;"><i class="bi bi-arrow-repeat" style="font-size:11px;margin-right:4px;"></i>Exchange JV — Auto Reversal</div>
        <div style="padding:6px 10px;font-size:12px;color:#64748b;">An Exchange Gain or Loss JV is involved. It will be automatically reversed. ${pills}</div>
      </div>`);
    }

    // Contextual suggestion
    const tips: string[] = [];
    if (hasAffected) {
      tips.push(`Reverse the entire ${this.escapeConfirmHtml(docType)} and create a new one.`);
      tips.push('Pass a Journal Voucher against Write-Off / Exchange Gain or Loss Ledger.');
    }
    if (hasExchangeJV) {
      tips.push('Exchange Gain or Loss JV will be automatically reversed during cancellation.');
    }
    const tipHtml = tips.map((t) => `<li style="margin-bottom:2px;">${t}</li>`).join('');
    sections.push(`<div style="padding:5px 10px;border-radius:5px;background:#f0f9ff;border:1px solid #bae6fd;font-size:12px;color:#0c4a6e;line-height:1.4;">
      <strong style="color:#0369a1;"><i class="bi bi-lightbulb-fill" style="font-size:12px;color:#0ea5e9;margin-right:3px;"></i>Suggestion</strong>
      <ul style="margin:4px 0 0;padding-left:18px;list-style-type:disc;">${tipHtml}</ul>
    </div>`);

    return `<div style="white-space:normal;line-height:1.4;">${sections.join('')}</div>`;
  }

  private getVoucherHref(voucherType: string | number | null | undefined, voucherHeaderSid: string | number | null | undefined): string {
    const route = this.getVoucherEntryLink(voucherType, voucherHeaderSid);
    if (!route?.length) {
      return '#';
    }
    const normalizedRoute = route.join('/');
    return normalizedRoute.startsWith('/') ? normalizedRoute : `/${normalizedRoute}`;
  }

  private escapeConfirmHtml(value: string | number | null | undefined): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  navigateToBack() {
    this.router.navigate(['accounts/voucher-matching/list']);
  }

  getVoucherEntryLink(voucherType: string | number | null | undefined, voucherHeaderSid: string | number | null | undefined): string[] | null {
    const normalizedVoucherType = String(voucherType ?? '').trim().toUpperCase();
    const normalizedHeaderSid = Number(voucherHeaderSid);

    if (!normalizedVoucherType || !Number.isFinite(normalizedHeaderSid) || normalizedHeaderSid <= 0) {
      return null;
    }

    const voucherRouteMap: Record<string, string> = {
      INV: '/operation/invoice/entry',
      INVOICE: '/operation/invoice/entry',
      VIN: '/operation/vendor-invoice/entry',
      'VENDOR INVOICE': '/operation/vendor-invoice/entry',
      RPT: '/accounts/receipt/entry',
      RECEIPT: '/accounts/receipt/entry',
      PMT: '/accounts/payment/entry',
      PAYMENT: '/accounts/payment/entry',
      JV: '/accounts/journal-voucher/entry',
      'JOURNAL VOUCHER': '/accounts/journal-voucher/entry',
      RJV: '/accounts/reverse-voucher/entry',
      'REVERSAL JOURNAL VOUCHER': '/accounts/reverse-voucher/entry',
      CRN: '/operation/credit-note/entry',
      'CREDIT NOTE': '/operation/credit-note/entry',
      VRN: '/operation/vendor-credit-note/entry',
      'VENDOR CREDIT NOTE': '/operation/vendor-credit-note/entry',
    };

    const route = voucherRouteMap[normalizedVoucherType];
    return route ? [route, normalizedHeaderSid.toString()] : null;
  }

  //SECTION: PLUGIN / INFO METHODS
  showInfo() {
    if (!this.voucherMatchingData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.voucherMatchingData;
    modalRef.componentInstance.idLabel = 'Voucher Matching ID';
    modalRef.componentInstance.idValue = this.VoucherMatchingHeaderSid;
  }

  openEmail() {
    if (!this.voucherMatchingData) return;
    this.modalService.open(EmailEntryComponent, { size: 'lg', centered: true, backdrop: 'static' });
  }

  openEDoc() {
    if (!this.voucherMatchingData) return;
    const modalRef = this.modalService.open(EdocComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.screenName = 'Edoc';
    modalRef.componentInstance.formData = this.voucherMatchingData;
    modalRef.componentInstance.resetTrigger = false;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.VoucherMatchingHeaderSid,
    };
    this.commonService.documentData.set(data);
  }

  openTandC() {
    this.modalService.open(TermsAndConditionsComponent, { size: 'lg', centered: true, backdrop: 'static' });
  }

   openAuditLogs() {
    if (!this.voucherMatchingData?.VoucherMatchingHeaderSid) return;
    const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'Voucher Matching Logs';
    modalRef.componentInstance.tableName = 'VoucherMatchingHeader';
    modalRef.componentInstance.recordId = this.voucherMatchingData?.VoucherMatchingHeaderSid.toString();
    modalRef.componentInstance.screenName = 'VoucherMatching';
  }
  openAuthority() {
    if (!this.currentMenuId) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.menuMasterSid = this.currentMenuId;
    modalRef.componentInstance.documentSid = this.VoucherMatchingHeaderSid;
  }

  openFollowup() {
    this.modalService.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
  }

  async onMatchingDateChange(): Promise<void> {
    const hasItems = this.sourceItems.length > 0 || this.objectItems.length > 0;
    if (!hasItems) return;
    const confirmed = await this.confirmService.confirm(
      'Changing the Matching Date will clear all loaded source and object records and reload them with the new date. Do you want to proceed?',
      'Confirm Date Change',
      'Clear & Reload'
    );
    if (confirmed) {
      this.previousMatchingDate = null;
      this.clearCreateDetail();
      this.panelsVisible = false;
      this.onGet();
    } else {
      if (this.previousMatchingDate !== null) {
        this.voucherMatchingForm.get('VoucherMatchingDate')?.setValue(
          this.previousMatchingDate, { emitEvent: false }
        );
      }
    }
  }

  checkVoucherPostingMechanism() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const menuName = 'Voucher Matching';
    if (!companyId || !branchId || !menuName) {
      return;
    }
    this.accountsService
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
}

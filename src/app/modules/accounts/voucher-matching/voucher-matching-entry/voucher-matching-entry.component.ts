// Voucher Matching Entry - TS
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { forkJoin, catchError, of } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { getDefaultTodayDate, toNumber } from 'src/app/common/helper';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';

@Component({
  selector: 'app-voucher-matching-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectModule,
    CustomDatePipe,
    DecimalPrecisionDirective
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
  isEditMode = false;

  // === VIEW MODE ===
  voucherMatchingForm!: FormGroup;
  VoucherMatchingHeaderSid!: number;
  voucherMatchingData: any;

  // === CREATE MODE ===
  headerForm!: FormGroup;
  sourceForm!: FormGroup;
  objectForm!: FormGroup;
  isSaving = false;

  ledgerList: any[] = [];
  selectedLedger: any = null;
  selectedLedgerType = '';
  subledgerList: any[] = [];
  selectedSubledger: any = null;

  currencyList: any[] = [];
  exchangeDifference: number = 0;
  matchingScenario: 'multi-currency' | 'single-foreign' | 'single-local' | null = null;

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
    private accountsService: AccountsService,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private dropdownStore: DropdownStore
  ) {}

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;
    try {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    } catch (e) {
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }
    this.initViewForm();
    this.initCreateForms();

    this.route.paramMap.subscribe(params => {
      this.VoucherMatchingHeaderSid = +params.get('VoucherMatchingHeaderSid')!;
      if (this.VoucherMatchingHeaderSid) {
        this.isEditMode = true;
        this.loadVoucherMatchingData(this.VoucherMatchingHeaderSid);
      } else {
        this.isEditMode = false;
        this.loadLedgers();
        this.loadCurrencies();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isEditMode) this.setupObservers();
  }

  ngOnDestroy(): void {
    this.sourceObserver?.disconnect();
    this.objectObserver?.disconnect();
  }

  // =============================================
  // VIEW MODE
  // =============================================
  initViewForm() {
    this.voucherMatchingForm = this.fb.group({
      VoucherMatchingNo: [{ value: '', disabled: true }],
      VoucherMatchingDate: [{ value: null, disabled: true }],
      LedgerName: [{ value: null, disabled: true }],
      SubledgerName: [{ value: null, disabled: true }],
      PostDate: [{ value: null, disabled: true }],
      Status: [{ value: 'A', disabled: true }],
      voucherMatching: this.fb.array([]),
    });
  }

  get f(): { [key: string]: AbstractControl } { return this.voucherMatchingForm.controls; }
  get detail(): FormArray { return this.voucherMatchingForm.get('voucherMatching') as FormArray; }

  loadVoucherMatchingData(id: number) {
    this.accountsService.getVoucherMatching(id).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) { this.voucherMatchingData = resp.data; this.patchValues(resp.data); }
        else this.appSettingService.showError('Error Loading Data');
      },
      error: () => this.appSettingService.showError('Error Loading Data'),
    });
  }

  createDetailGroup(item: any): FormGroup {
    return this.fb.group({
      BranchName: [{ value: item?.branch?.branchName ?? '', disabled: true }],
      LedgerName: [{ value: item?.CoaMaster?.LedgerName ?? '', disabled: true }],
      SubledgerName: [{ value: item?.subledgerMaster?.SubledgerName ?? '', disabled: true }],
      VoucherNumber: [{ value: item?.VoucherHeader?.VoucherNumber ?? '', disabled: true }],
      VoucherType: [{ value: item?.VoucherHeader?.voucherTypeMaster?.DocumentTypeName ?? '', disabled: true }],
      VoucherDate: [{ value: item?.VoucherHeader?.VoucherDate ? new Date(item.VoucherHeader.VoucherDate) : null, disabled: true }],
      DrCr: [{ value: item?.DrCr ?? '', disabled: true }],
      CurrencyCode: [{ value: item?.CurrencyCode ?? '', disabled: true }],
      ExchangeRate: [{ value: item?.ExchangeRate ?? '', disabled: true }],
      Amount: [{ value: item?.Amount ?? '', disabled: true }],
      LocalAmount: [{ value: item?.LocalAmount ?? '', disabled: true }],
      MatchingType: [{ value: item?.MatchingType ?? '', disabled: true }],
    });
  }

  patchValues(data: any) {
    const sourceRow = data?.voucherMatchings?.find((x: any) => x.MatchingType === 'Source');
    this.voucherMatchingForm.patchValue({
      VoucherMatchingNo: data.VoucherMatchingNo,
      VoucherMatchingDate: data.VoucherMatchingDate ? new Date(data.VoucherMatchingDate) : null,
      LedgerName: sourceRow?.CoaMaster?.LedgerName ?? '',
      SubledgerName: sourceRow?.subledgerMaster?.SubledgerName ?? '',
      PostDate: sourceRow?.VoucherHeader?.PostDate ? new Date(sourceRow.VoucherHeader.PostDate) : null,
      Status: data.Status === 'A' ? 'Active' : 'Suspended'
    });
    this.detail.clear();
    data?.voucherMatchings?.forEach((item: any) => this.detail.push(this.createDetailGroup(item)));
  }

  // =============================================
  // CREATE MODE
  // =============================================
  initCreateForms() {
    this.headerForm = this.fb.group({
      VoucherMatchingNo: [{ value: '', disabled: true }],
      VoucherMatchingDate: [getDefaultTodayDate()],
      PostDate: [{ value: null, disabled: true }],
      Ledger: [null],
      Subledger: [null],
      Status: [{ value: 'Active', disabled: true }],
    });
    this.sourceForm = this.fb.group({ items: this.fb.array([]) });
    this.objectForm = this.fb.group({ items: this.fb.array([]) });
  }

  get sourceItems(): FormArray { return this.sourceForm.get('items') as FormArray; }
  get objectItems(): FormArray { return this.objectForm.get('items') as FormArray; }

  loadCurrencies() {
    this.dropdownStore.loadCurrencies().subscribe(currencies => {
      this.currencyList = (currencies || []).map((c: any) => ({ ...c, countryName: c?.countryMaster?.countryName }));
      this.currencyConfigService.initializeConfigurations(this.currencyList);
    });
  }

  public getAmountDecimalPlaces(sid: number): number {
    const c = this.currencyList.find(x => x.CurrencyMasterSid === sid);
    return c ? (this.currencyConfigService.getCurrencyConfig(c.currencyCode)?.amountDecimal ?? 2) : 2;
  }

  public getExchangeRateDecimalPlaces(sid: number): number {
    if (!this.currencyList?.length) return 4;
    const c = this.currencyList.find(x => x.CurrencyMasterSid === sid);
    return c ? (this.currencyConfigService.getCurrencyConfig(c.currencyCode)?.exchangeDecimal ?? 4) : 4;
  }

  public getCurrencyMasterSid(code: string): number {
    if (!code || !this.currencyList) return 0;
    return this.currencyList.find((c: any) => c.currencyCode?.toUpperCase() === code.toUpperCase())?.CurrencyMasterSid || 0;
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

  onLedgerChange(ledger: any) {
    this.selectedLedger = ledger;
    this.selectedLedgerType = ledger?._ledgerType || '';
    this.subledgerList = [];
    this.selectedSubledger = null;
    this.headerForm.get('Subledger')?.setValue(null);
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

  onSubledgerChange(sub: any) { this.selectedSubledger = sub; }

  onGet() {
    if (!this.selectedLedger) { this.appSettingService.showWarning('Please select a Ledger'); return; }
    if (!this.selectedSubledger) { this.appSettingService.showWarning('Please select a Subledger'); return; }
    this.clearCreateDetail();
    this.loadSourceData();
    this.loadObjectData();
    setTimeout(() => this.setupObservers(), 200);
  }

  loadSourceData() {
    if (this.isLoadingSource || !this.hasMoreSourceData) return;
    this.isLoadingSource = true;
    this.accountsService.searchOutstandingForMatching({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      LedgerMasterSid: this.selectedSubledger?.SubledgerMasterSid,
      IncludeFullyPaid: false,
      DrCr: this.selectedLedgerType === 'Sy Cr' ? 'D' : 'C',
      Skip: this.sourceSkip,
      Take: this.BATCH_SIZE,
    }).subscribe({
      next: (resp: any) => {
        const data = resp?.status ? resp.data : resp;
        if (data?.length) {
          data.forEach((tx: any) => this.sourceItems.push(this.createMatchingRow(tx)));
          this.sourceSkip += data.length;
          this.hasMoreSourceData = data.length >= this.BATCH_SIZE;
        } else { this.hasMoreSourceData = false; }
        this.isLoadingSource = false;
        if (this.hasMoreSourceData) setTimeout(() => this.reobserveSentinel('source'), 100);
      },
      error: () => { this.isLoadingSource = false; },
    });
  }

  loadObjectData() {
    if (this.isLoadingObject || !this.hasMoreObjectData) return;
    this.isLoadingObject = true;
    this.accountsService.searchOutstandingForMatching({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      LedgerMasterSid: this.selectedSubledger?.SubledgerMasterSid,
      IncludeFullyPaid: false,
      DrCr: this.selectedLedgerType === 'Sy Cr' ? 'C' : 'D',
      Skip: this.objectSkip,
      Take: this.BATCH_SIZE,
    }).subscribe({
      next: (resp: any) => {
        const data = resp?.status ? resp.data : resp;
        if (data?.length) {
          data.forEach((tx: any) => this.objectItems.push(this.createMatchingRow(tx)));
          this.objectSkip += data.length;
          this.hasMoreObjectData = data.length >= this.BATCH_SIZE;
        } else { this.hasMoreObjectData = false; }
        this.isLoadingObject = false;
        if (this.hasMoreObjectData) setTimeout(() => this.reobserveSentinel('object'), 100);
      },
      error: () => { this.isLoadingObject = false; },
    });
  }

  private reobserveSentinel(panel: 'source' | 'object') {
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
    this.reobserveSentinel('source');
    this.reobserveSentinel('object');
  }

  createMatchingRow(tx: any): FormGroup {
    const sid = this.getCurrencyMasterSid(tx.CurrencyCode);
    return this.fb.group({
      VoucherHeaderSid: [tx.VoucherHeaderSid], VoucherDetailSid: [tx.VoucherDetailSid],
      VoucherTransactionSid: [tx.VoucherTransactionSid], VoucherTypeMasterSid: [tx.VoucherTypeMasterSid],
      COAMasterSid: [tx.COAMasterSid], LedgerMasterSid: [tx.LedgerMasterSid], CurrencyMasterSid: [sid],
      voucherNo: [{ value: tx.VoucherHeader?.VoucherNumber || tx.VoucherNumber || '', disabled: true }],
      voucherType: [{ value: tx.VoucherHeader?.voucherTypeMaster?.DocumentTypeName || tx.VoucherType || '', disabled: true }],
      voucherDate: [{ value: tx.VoucherHeader?.VoucherDate || tx.VoucherDate || '', disabled: true }],
      drCr: [{ value: tx.DrCr === 'C' ? 'Cr' : 'Dr', disabled: true }],
      curr: [{ value: tx.CurrencyCode, disabled: true }],
      exRate: [{ value: tx.ExchangeRate || 1, disabled: true }],
      currAmt: [{ value: tx.OriginalCurrencyAmount, disabled: true }],
      localAmt: [{ value: tx.OriginalLocalAmount, disabled: true }],
      osCurrAmt: [{ value: tx.OutstandingCurrencyAmount, disabled: true }],
      osLocalAmt: [{ value: tx.OutstandingLocalAmount, disabled: true }],
      matchCurrAmt: [''], matchLocalAmt: [{ value: '', disabled: true }],
    });
  }

  onTickMatch(formArray: FormArray, index: number, event: any) {
    const checked = event.target.checked;
    const row = formArray.at(index) as FormGroup;
    const raw = row.getRawValue();
    if (!checked) {
      row.patchValue({ matchCurrAmt: '', matchLocalAmt: '' });
      this.validateMatchingScenario();
      return;
    }
    row.patchValue({ matchCurrAmt: toNumber(raw.osCurrAmt), matchLocalAmt: toNumber(raw.osLocalAmt) });
    this.validateMatchingScenario();
  }

  calculateLocalAmountForRow(fa: FormArray, i: number) {
    const row = fa.at(i) as FormGroup;
    const raw = row.getRawValue();
    const amt = toNumber(raw.matchCurrAmt);
    row.get('matchLocalAmt')?.setValue(amt ? amt * (toNumber(raw.exRate) || 1) : '');
    this.validateMatchLimits(fa, i);
  }

  validateMatchLimits(fa: FormArray, i: number) {
    const row = fa.at(i) as FormGroup;
    const match = toNumber(row.get('matchCurrAmt')?.value);
    const os = toNumber(row.getRawValue().osCurrAmt);
    row.get('matchCurrAmt')?.setErrors(match && Math.abs(match) > Math.abs(os) ? { limitExceeded: true } : null);
  }

  onMatchAmountChange(fa: FormArray, i: number) {
    this.calculateLocalAmountForRow(fa, i);
    this.validateMatchingScenario();
  }

  validateMatchingScenario(): { valid: boolean; message?: string } {
    const srcRows = this.sourceItems.getRawValue().filter((s: any) => toNumber(s.matchCurrAmt) !== 0);
    const objRows = this.objectItems.getRawValue().filter((o: any) => toNumber(o.matchCurrAmt) !== 0);
    const allRows = [...srcRows, ...objRows];

    if (allRows.length === 0) {
      this.matchingScenario = null;
      this.exchangeDifference = 0;
      return { valid: false, message: 'No matching amounts entered.' };
    }

    const currencies = new Set(allRows.map((r: any) => r.curr));
    const isSingleCurrency = currencies.size === 1;

    const srcTotalLocal = srcRows.reduce((s: number, r: any) => s + toNumber(r.matchLocalAmt), 0);
    const objTotalLocal = objRows.reduce((s: number, r: any) => s + toNumber(r.matchLocalAmt), 0);
    const srcTotalCurr = srcRows.reduce((s: number, r: any) => s + toNumber(r.matchCurrAmt), 0);
    const objTotalCurr = objRows.reduce((s: number, r: any) => s + toNumber(r.matchCurrAmt), 0);

    if (!isSingleCurrency) {
      // Scenario 1: Multi-currency — local totals must match
      this.matchingScenario = 'multi-currency';
      this.exchangeDifference = 0;
      const localDiff = Math.abs(srcTotalLocal - objTotalLocal);
      if (localDiff > 0.01) {
        return { valid: false, message: `Multi-currency matching requires equal local amount totals. Source: ${srcTotalLocal.toFixed(2)}, Object: ${objTotalLocal.toFixed(2)}, Difference: ${localDiff.toFixed(2)}` };
      }
      return { valid: true };
    }

    // Single currency
    const isLocalCurrency = allRows.every((r: any) => toNumber(r.exRate) === 1);

    if (isLocalCurrency) {
      // Scenario 3: Single local currency — both totals must match
      this.matchingScenario = 'single-local';
      this.exchangeDifference = 0;
      const currDiff = Math.abs(srcTotalCurr - objTotalCurr);
      const localDiff = Math.abs(srcTotalLocal - objTotalLocal);
      if (currDiff > 0.01 || localDiff > 0.01) {
        return { valid: false, message: `Local currency matching requires both currency and local totals to match. Currency diff: ${currDiff.toFixed(2)}, Local diff: ${localDiff.toFixed(2)}` };
      }
      return { valid: true };
    }

    // Scenario 2: Single foreign currency — currency totals must match, local diff = Exchange JV
    this.matchingScenario = 'single-foreign';
    const currDiff = Math.abs(srcTotalCurr - objTotalCurr);
    if (currDiff > 0.01) {
      this.exchangeDifference = 0;
      return { valid: false, message: `Single foreign currency matching requires currency totals to match. Source: ${srcTotalCurr.toFixed(2)}, Object: ${objTotalCurr.toFixed(2)}, Difference: ${currDiff.toFixed(2)}` };
    }
    this.exchangeDifference = srcTotalLocal - objTotalLocal;
    return { valid: true };
  }

  clearCreateDetail() {
    this.sourceItems.clear(); this.objectItems.clear();
    this.sourceSkip = 0; this.objectSkip = 0;
    this.hasMoreSourceData = true; this.hasMoreObjectData = true;
    this.isLoadingSource = false; this.isLoadingObject = false;
    this.exchangeDifference = 0; this.matchingScenario = null;
  }

  getTotal(fa: FormArray, field: string): number {
    return fa.controls.reduce((s, c) => s + toNumber(c.getRawValue()[field]), 0);
  }

  get sourceTotalCurrAmt() { return this.getTotal(this.sourceItems, 'currAmt'); }
  get sourceTotalLocalAmt() { return this.getTotal(this.sourceItems, 'localAmt'); }
  get sourceTotalOsCurrAmt() { return this.getTotal(this.sourceItems, 'osCurrAmt'); }
  get sourceTotalOsLocalAmt() { return this.getTotal(this.sourceItems, 'osLocalAmt'); }
  get sourceTotalMatchCurrAmt() { return this.getTotal(this.sourceItems, 'matchCurrAmt'); }
  get sourceTotalMatchLocalAmt() { return this.getTotal(this.sourceItems, 'matchLocalAmt'); }
  get objectTotalCurrAmt() { return this.getTotal(this.objectItems, 'currAmt'); }
  get objectTotalLocalAmt() { return this.getTotal(this.objectItems, 'localAmt'); }
  get objectTotalOsCurrAmt() { return this.getTotal(this.objectItems, 'osCurrAmt'); }
  get objectTotalOsLocalAmt() { return this.getTotal(this.objectItems, 'osLocalAmt'); }
  get objectTotalMatchCurrAmt() { return this.getTotal(this.objectItems, 'matchCurrAmt'); }
  get objectTotalMatchLocalAmt() { return this.getTotal(this.objectItems, 'matchLocalAmt'); }

  get hasMatchingAmounts(): boolean {
    return this.sourceItems.controls.some(c => toNumber(c.get('matchCurrAmt')?.value) !== 0)
        || this.objectItems.controls.some(c => toNumber(c.get('matchCurrAmt')?.value) !== 0);
  }

  get hasErrors(): boolean {
    return this.sourceItems.controls.some(c => c.get('matchCurrAmt')?.errors)
        || this.objectItems.controls.some(c => c.get('matchCurrAmt')?.errors);
  }

  onSubmit() {
    if (!this.selectedLedger || !this.selectedSubledger) { this.appSettingService.showWarning('Please select a Ledger and Subledger'); return; }
    if (!this.hasMatchingAmounts) { this.appSettingService.showWarning('Please enter at least one matching amount'); return; }
    if (this.hasErrors) { this.appSettingService.showWarning('Please fix matching amount errors (exceeds outstanding)'); return; }

    const validation = this.validateMatchingScenario();
    if (!validation.valid) { this.appSettingService.showWarning(validation.message!); return; }

    this.isSaving = true;
    const srcRaw = this.sourceItems.getRawValue().filter((s: any) => toNumber(s.matchCurrAmt) !== 0);
    const partyVoucherDetail = srcRaw.map((s: any, i: number) => ({
      VoucherDetailSid: s.VoucherDetailSid, VoucherTransactionSid: s.VoucherTransactionSid,
      COAMasterSid: s.COAMasterSid, LedgerMasterSid: s.LedgerMasterSid,
      CurrencyCode: s.curr, ExchangeRate: toNumber(s.exRate) || 1,
      DrCr: s.drCr === 'Cr' ? 'C' : 'D', PartyAmount: toNumber(s.matchCurrAmt),
      LocalAmount: toNumber(s.matchLocalAmt), Sno: i + 1,
    }));
    const matchingInvoices = this.objectItems.getRawValue()
      .filter((m: any) => toNumber(m.matchCurrAmt) !== 0)
      .map((m: any) => ({
        VoucherHeaderSid: m.VoucherHeaderSid, VoucherDetailSid: m.VoucherDetailSid,
        VoucherTransactionSid: m.VoucherTransactionSid, VoucherTypeMasterSid: m.VoucherTypeMasterSid,
        COAMasterSid: m.COAMasterSid, LedgerMasterSid: m.LedgerMasterSid,
        CurrencyCode: m.curr, ExchangeRate: toNumber(m.exRate) || 1,
        DrCr: m.drCr === 'Cr' ? 'C' : 'D', PartyAmount: toNumber(m.matchCurrAmt),
        LocalAmount: toNumber(m.matchLocalAmt),
      }));

    const payload: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherHeaderSid: srcRaw[0]?.VoucherHeaderSid,
      VoucherTypeMasterSid: srcRaw[0]?.VoucherTypeMasterSid || 0,
      voucherTypeInName: this.selectedLedgerType === 'Sy Cr' ? 'Payment Voucher' : 'Receipt Voucher',
      SubledgerName: this.selectedSubledger?.SubledgerName || '',
      PostDate: this.headerForm.getRawValue().VoucherMatchingDate || new Date().toISOString(),
      Narration: `Standalone matching for ${this.selectedSubledger?.SubledgerName || ''}`,
      CreatedBy: this.userData?.userEmail || '',
      partyVoucherDetail, matchingInvoices,
    };

    // Scenario 2: single foreign currency with exchange difference — backend will create Exchange JV
    if (this.matchingScenario === 'single-foreign' && Math.abs(this.exchangeDifference) > 0.01) {
      payload.exchangeJvRequired = true;
      payload.exchangeDifference = this.exchangeDifference;
      payload.exchangeCurrencyCode = srcRaw[0]?.curr;
      payload.partyLedgerSid = srcRaw[0]?.COAMasterSid;
      payload.partySubledgerSid = srcRaw[0]?.LedgerMasterSid;
    }

    this.accountsService.createStandaloneVoucherMatching(payload).subscribe({
      next: (resp: any) => {
        this.isSaving = false;
        if (resp?.status) { this.appSettingService.showSuccess('Voucher matching created successfully'); this.router.navigate(['accounts/voucher-matching/list']); }
        else this.appSettingService.showError(resp?.message || 'Error creating voucher matching');
      },
      error: () => { this.isSaving = false; this.appSettingService.showError('Error creating voucher matching'); },
    });
  }

  navigateToBack() { this.router.navigate(['accounts/voucher-matching/list']); }
}

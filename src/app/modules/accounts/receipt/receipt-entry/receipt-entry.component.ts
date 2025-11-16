import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { ToastrService } from 'ngx-toastr';
import { ReceiptService } from '../../services/receipt.service';
import { OutstandingService } from '../../services/outstanding.service';
import {
  CreateReceiptRequest,
  ReceiptDetail,
  OutstandingInvoice,
  PaymentMode,
  SearchOutstandingRequest,
  ReceiptFormData,
} from '../../models/receipt.model';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { catchError, combineLatest, forkJoin, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { AccountsService } from '../../accounts.service';
import { ConfirmationDialogComponent } from 'src/app/component/confirmation-modal/confirmation-modal.component';
import { toNgbDateStruct } from 'src/app/common/helper';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Receipt Entry Component
 * Handles creation and editing of receipt vouchers with:
 * - Invoice matching
 * - Advance receipts
 * - TDS deduction
 * - Multi-currency
 * - Inter-branch receipts with automatic JV
 */
@Component({
  selector: 'app-receipt-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectComponent,
    NgxSpinnerModule,
    FormsModule,
    SearchableDropdown,
    DecimalPrecisionDirective,
    TextWithNumbersDirective,
    OnlyNumbersDirective
  ],
  templateUrl: './receipt-entry.component.html',
  styleUrl: './receipt-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class ReceiptEntryComponent implements OnInit {
  headerId: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  currentUserCountry: string;
  selectedTab = 'Detail';
  isSaving = false;
  isViewMode: boolean = false;
  /**
 * Calculate local amount before round off the Currency Amount
 * 
 * Yes, then Multiply "No.of Unit" with "Per Unit Rate"  before round off 99.1881 x 14.7978 =	 
 * 
 * No, then	Multiply "No.of Unit" with "Per Unit Rate" then after round off  round( 99.1881,2) x 14.7978 
 */
  formatCurrencyAmountBeforeConcludingLocal: boolean = true;
  currentCompany: any;
  currentBranch: any;
  currentYearId: any;
  receiptData: any;
  userData: any;
  searchType: string = 'Party';
  selectedParty: any;
  filterText: any;

  today = new Date();
  todayDateInNgbStruct = toNgbDateStruct(this.today);
  searchOutstandingForm!: FormGroup;
  receiptForm!: FormGroup;
  partyList: any[] = [];
  currencyList: any[] = [];
  coaList: any[] = [];
  ledgerList: any[][] = [];
  bankTypedLedgers: any[] = [];
  cashTypeLedgers: any[] = [];
  costCenterList: any[] = [];
  profitCenterList: any[] = [];
  deptList: any[] = [];
  chargeList: any[] = [];
  filteredChargeList: any[][] = [];
  masterJobList: any[][] = [];
  houseJobList: any[][] = [];
  currentCompanyBranches: any[] = [];


  CustomerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  COALookupConfig = DROPDOWN_CONFIGS.COA_LEDGER;

  outstandingInvoices: OutstandingInvoice[] = [];
  selectedInvoices: OutstandingInvoice[] = [];
  paymentModes: { value: string; label: string }[] = [];

  // Outstanding invoices

  get isEditMode() { return !!this.headerId && !this.isViewMode; }

  @ViewChild('searchModal') searchModal!: TemplateRef<any>;



  // Tabs configuration
  tabs = [
    { name: 'Detail', icon: 'fas fa-address-card' },
    { name: 'Voucher Matching', icon: 'fas fa-code-branch' },
    // { name: 'Interbranch', icon: 'fas fa-flag-checkered' },
  ];

  CrDr = [
    { id: 1, name: "Cr", value: "C" },
    { id: 2, name: "Dr", value: "D" }
  ]
  public searchTypes = [
    { label: 'Party', value: 'Party' },
    { label: 'Invoice', value: 'Invoice' },
    // { label: 'House No.', value: 'HouseNo' },
    // { label: 'HBL No.', value: 'HBLNo' },
    // { label: 'Master No.', value: 'MasterNo' },
    // { label: 'MBL No.', value: 'MBLNo' },
    // { label: 'HAWB', value: 'HAWB' },
    // { label: 'MAWB', value: 'MAWB' }
  ];

  modalSearchType = [
    { id: 1, name: "House No" },
    { id: 2, name: "HBL No" },
    { id: 3, name: "Master No" },
    { id: 4, name: "MBL No" },
    { id: 5, name: "HAWB" },
    { id: 6, name: "MAWB" },
    { id: 7, name: "Party" },
    { id: 8, name: "Invoice" }
  ]

  allPendingCosts: any[] = [];
  selectedCosts: any[] = [];
  private destroy$ = new Subject<void>();


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private receiptService: ReceiptService,
    private appSettingService: AppSettingsService,
    private dropdownStore: DropdownStore,
    private accountService: AccountsService,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService
  ) { }

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();

    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
    this.currentYearId = Number(localStorage.getItem('current-year-id'));
    this.getCurrentCompanyBranches();

    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    console.log("USER DATA", this.userData);
    console.log("CURRENT COMPANY", this.currentCompany);
    console.log("CURRENT BRANCH", this.currentBranch);
    console.log("CURRENT USER COUNTRY", this.currentUserCountry);
    console.log("CURRENT YEAR ID", this.currentYearId);

    this.initSearchOutstandingForm();
    this.initializeForm();
    this.loadPaymentModes();
    this.loadAllLookups();
    this.loadDetailLookups();

    // Check if editing existing receipt
    const receiptId = this.route.snapshot.params['id'];
    if (receiptId) {
      this.headerId = Number(receiptId);
      this.loadReceipt(this.headerId);
    } else {
      this.subscribeToPartyAndBankChanges();
    }
  }

  initSearchOutstandingForm() {
    this.searchOutstandingForm = this.fb.group({
      CompanyMasterSid: [this.currentCompany?.CompanyMasterSid, Validators.required],
      SearchType: ['Party', Validators.required],

      LedgerMasterSid: [null],
      CustomerName: [''],
      InvoiceNumber: [''],
      HouseNumber: [''],

      FilterText: [''],   // generic input for all NON-Party searches
      IncludeFullyPaid: [false]
    });

    this.searchOutstandingForm.get('SearchType')?.valueChanges.subscribe(type => {
      this.clearSearchFields(type);
    });
  }

    /**
   * Initialize the receipt form with validation
   */
  private initializeForm(): void {
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    this.receiptForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],  // Receipt Number
      VoucherDate: [null], // Receipt Date
      MultiBranch: [{value : false, disabled: true}],
      CashOrBank: [false],
      BankCOA: [null, [Validators.required]], // Bank COA or Cash COA
      CurrencyMasterSid: [companyCurrency || null],
      CurrencyCode: ['INR'],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],

      // Party related info
      PartyMasterSid: [null, [Validators.required]],
      PartyName: [''],
      PartyAddress: [''],
      CustomerBranchSid: [null],
      COAMasterSid: [null, [Validators.required]],
      LedgerMasterSid: [null, [Validators.required]],
      GST_VAT: [''],
      BankPartyName: [''],
      Narration: ['', [Validators.required]],
      Remarks: [''],
      InstrumentMode: [PaymentMode.NEFT, Validators.required],
      InstrumentNumber: ['', [Validators.required]],
      InstrumentDate: [null, [Validators.required]],
      ClearanceDate: [null],

      // Form arrays
      detailItems: this.fb.array([]), // charge detail formArray
      voucherMatchings: this.fb.array([]), // voucherMatching formArray
      interBranches: this.fb.array([]), // interBranch formArray
    });
  }

  
  /**
   * Setup form value change listeners
   */
  // private setupFormListeners(): void {
  //   // Recalculate TDS when percentage or amount changes
  //   this.receiptForm.get('TDSPercentage')?.valueChanges.subscribe(() => {
  //     this.calculateTDS();
  //   });

  //   this.receiptForm.get('TotalInvoiceAmount')?.valueChanges.subscribe(() => {
  //     this.calculateTDS();
  //     this.calculateNetAmount();
  //   });

  //   // Show/hide TDS fields
  //   this.receiptForm.get('HasTDS')?.valueChanges.subscribe((hasTDS) => {
  //     if (hasTDS) {
  //       this.receiptForm.get('TDSPercentage')?.setValidators([Validators.required, Validators.min(0)]);
  //       this.receiptForm.get('TDSLedgerMasterSid')?.setValidators([Validators.required]);
  //     } else {
  //       this.receiptForm.get('TDSPercentage')?.clearValidators();
  //       this.receiptForm.get('TDSLedgerMasterSid')?.clearValidators();
  //       this.receiptForm.patchValue({ TDSPercentage: 0, TDSAmount: 0 });
  //     }
  //     this.receiptForm.get('TDSPercentage')?.updateValueAndValidity();
  //     this.receiptForm.get('TDSLedgerMasterSid')?.updateValueAndValidity();
  //   });

  //   // Show/hide inter-branch fields
  //   this.receiptForm.get('IsInterBranch')?.valueChanges.subscribe((isInterBranch) => {
  //     if (isInterBranch) {
  //       this.receiptForm.get('ReceivingBranchMasterSid')?.setValidators([Validators.required]);
  //     } else {
  //       this.receiptForm.get('ReceivingBranchMasterSid')?.clearValidators();
  //     }
  //     this.receiptForm.get('ReceivingBranchMasterSid')?.updateValueAndValidity();
  //   });

  //   // Show cheque fields for cheque payment mode
  //   this.receiptForm.get('PaymentMode')?.valueChanges.subscribe((mode) => {
  //     if (mode === PaymentMode.CHEQUE) {
  //       this.receiptForm.get('ChequeNumber')?.setValidators([Validators.required]);
  //       this.receiptForm.get('ChequeDate')?.setValidators([Validators.required]);
  //     } else {
  //       this.receiptForm.get('ChequeNumber')?.clearValidators();
  //       this.receiptForm.get('ChequeDate')?.clearValidators();
  //     }
  //     this.receiptForm.get('ChequeNumber')?.updateValueAndValidity();
  //     this.receiptForm.get('ChequeDate')?.updateValueAndValidity();
  //   });
  // }

  loadAllLookups() {
    const filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid
    }
    forkJoin({
      parties: this.accountService.getAllDebtorWithCOAMapped(filterOption).pipe(catchError(err => of([]))),
      currencies: this.dropdownStore.loadCurrencies().pipe(catchError(err => of([]))),
      bankTypedLedgers: this.accountService.getAllLedgersByItsType({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        LedgerType: 'Bank'
      }).pipe(catchError(err => of([]))),
      cashTypeLedgers: this.accountService.getAllLedgersByItsType({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        LedgerType: 'Cash'
      }).pipe(catchError(err => of([]))),
    }).subscribe(({ parties, currencies, bankTypedLedgers, cashTypeLedgers }) => {
      this.partyList = parties.data;
      this.currencyList = (currencies || []).map(c => ({ ...c, countryName: c?.countryMaster?.countryName }));
      this.bankTypedLedgers = bankTypedLedgers.data;
      this.cashTypeLedgers = cashTypeLedgers.data;

      const companyCurrency = this.r['CurrencyMasterSid']?.value;
      this.setCurrencyCode(companyCurrency)

      this.currencyConfigService.initializeConfigurations(this.currencyList);
      console.log("CURRENCY CONFIG INITIALIZED", this.currencyConfigService.getAllCurrencyConfigs());
    })
  }

  loadDetailLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = {
      CompanyMasterSid,
      BranchMasterSid
    }
    forkJoin({
      coaWithLedgerCategoryAsLedger: this.accountService.getAllCoaWithLedgerCategory({
        LedgerCategory: 'Ledger',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      }).pipe(catchError(err => of([]))),
      costCenters: this.accountService.getAllCostCenters().pipe(catchError(err => of([]))),
      profitCenters: this.accountService.getAllProfitCenters().pipe(catchError(err => of([]))),
      depts: this.dropdownStore.loadDepartments(filterOption).pipe(catchError(err => of([]))),
      charges: this.accountService.getAllCharges(this.currentCompany?.CompanyMasterSid).pipe(catchError(err => of([])))
    }).subscribe(({ coaWithLedgerCategoryAsLedger, costCenters, profitCenters, depts, charges }) => {
      this.coaList = coaWithLedgerCategoryAsLedger.data;
      this.costCenterList = costCenters.data;
      this.profitCenterList = profitCenters.data;
      this.deptList = depts
      this.chargeList = charges;
      this.filterChargeByDeptForAllRow();
    })
  }

  /**
 * Load payment modes
 */
  private loadPaymentModes(): void {
    this.paymentModes = this.receiptService.getPaymentModes();
  }

  /**
   * Search outstanding invoices for customer
   */

  searchOutstanding() {
    const form = this.searchOutstandingForm.getRawValue();
    console.log("FormValue", form);
    let payload: any = {
      CompanyMasterSid: form.CompanyMasterSid,
      IncludeFullyPaid: form.IncludeFullyPaid
    };

    switch (form.SearchType) {
      case 'Party':
        payload.LedgerMasterSid = form.LedgerMasterSid;
        break;

      case 'Invoice':
        payload.InvoiceNumber = form.FilterText;
        break;

      case 'HouseNo':
        payload.HouseNumber = form.FilterText;
        break;

      default:
        // For HBL, MBL, HAWB, MAWB, MasterNo etc.
        payload.InvoiceNumber = form.FilterText;
    }

    console.log("Payload Sent:", payload);

    this.receiptService.searchOutstandingInvoices(payload).subscribe(
      res => {
        this.patchHeaderValue(res);
        this.patchOutstandingFormArray(res)
    });
  }

  patchHeaderValue(res: any) {
    console.log("RES",res);
    if(res.length > 0 && res[0].LedgerMasterSid && this.searchOutstandingForm.get('SearchType')?.value === "Invoice"){ 
      const party = this.partyList.find(p => p.SubledgerMasterSid === res[0].LedgerMasterSid);
      this.onPartyChange(party);
    } else if(
      res.length > 0 && this.searchOutstandingForm.get('SearchType')?.value === "Party" 
      && this.searchOutstandingForm.get('LedgerMasterSid')?.value
    ){
      const partyIdInSearch = this.searchOutstandingForm.get('LedgerMasterSid')?.value;
      const party = this.partyList.find(p => p.SubledgerMasterSid === partyIdInSearch);
      this.onPartyChange(party);
    }
  }


  
  /**
   * Save receipt
   */
  // async saveReceipt(): Promise<void> {
  //   if (this.receiptForm.invalid) {
  //     this.toastr.warning('Please fill all required fields');
  //     this.markFormGroupTouched(this.receiptForm);
  //     return;
  //   }

  //   this.isSaving = true;

  //   try {
  //     const formValue = this.receiptForm.getRawValue();

  //     // Build receipt details from vouchers
  //     const details: ReceiptDetail[] = this.detailItems.controls.map((control) => ({
  //       VoucherTransactionSid: control.get('VoucherTransactionSid')?.value,
  //       Amount: control.get('MatchedAmount')?.value,
  //       Narration: control.get('Narration')?.value,
  //       IsAdvance: control.get('IsAdvance')?.value || false,
  //     }));

  //     // Add advance amount if any
  //     const advanceAmount = formValue.AdvanceAmount || 0;
  //     if (advanceAmount > 0) {
  //       details.push({
  //         Amount: advanceAmount,
  //         IsAdvance: true,
  //         Description: 'Advance payment',
  //       });
  //     }

  //     const createRequest: CreateReceiptRequest = {
  //       CompanyMasterSid: formValue.CompanyMasterSid,
  //       BranchMasterSid: formValue.BranchMasterSid,
  //       LedgerMasterSid: formValue.LedgerMasterSid,
  //       VoucherDate: this.receiptService.formatDateForAPI(formValue.VoucherDate),
  //       Narration: formValue.Narration,
  //       PaymentMode: formValue.PaymentMode,
  //       ChequeNumber: formValue.ChequeNumber,
  //       ChequeDate: formValue.ChequeDate ? this.receiptService.formatDateForAPI(formValue.ChequeDate) : undefined,
  //       BankName: formValue.BankName,
  //       TotalAmount: formValue.TotalInvoiceAmount,
  //       CurrencyMasterSid: formValue.CurrencyMasterSid,
  //       ExchangeRate: formValue.ExchangeRate,
  //       CurrencyAmount: formValue.TotalCurrencyAmount,
  //       HasTDS: formValue.HasTDS,
  //       TDSLedgerMasterSid: formValue.TDSLedgerMasterSid,
  //       TDSAmount: formValue.TDSAmount,
  //       TDSPercentage: formValue.TDSPercentage,
  //       Details: details,
  //       IsInterBranch: formValue.IsInterBranch,
  //       ReceivingBranchMasterSid: formValue.ReceivingBranchMasterSid,
  //       CreatedBy: 'current-user', // TODO: Get from auth service
  //     };

  //     const response = await this.receiptService.createReceipt(createRequest).toPromise();

  //     this.toastr.success(`Receipt ${response?.VoucherNumber} created successfully`);
  //     this.router.navigate(['/accounts/receipt/list']);
  //   } catch (error: any) {
  //     console.error('Failed to save receipt:', error);
  //     this.toastr.error(error.message || 'Failed to save receipt');
  //   } finally {
  //     this.isSaving = false;
  //   }
  // }

    onSubmit(isPostingTrue?: boolean) {
    const formValue = this.receiptForm.getRawValue();
    const detailItems = this.detailItems.getRawValue();
    if (this.detailItems.length === 0) {
      this.appSettingService.showError('Please add at least one receipt detail');
      return;
    }




    const hasPartyDetail = detailItems.some(d => d.LedgerMasterSid === formValue.LedgerMasterSid);
    if (formValue.LedgerMasterSid && !hasPartyDetail) {
      this.appSettingService.showError('Please add a party detail for the alloted ledger');
      return;
    }

    const hasBankDetail = detailItems.some(d => d.COAMasterSid === formValue.BankCOA);
    if (formValue.BankCOA && !hasBankDetail) {
      this.appSettingService.showError('Please add a bank detail for the alloted COA');
      return;
    }

    const totalDebit = detailItems.filter(d => d.DrCr === 'D')
      .reduce((sum, d) => sum + Number(d.LocalAmount || 0), 0);

    const totalCredit = detailItems.filter(d => d.DrCr === 'C')
      .reduce((sum, d) => sum + Number(d.LocalAmount || 0), 0);


    if (totalDebit !== totalCredit) {
      this.appSettingService.showError('Please make sure the sum of debit amounts and credit amounts are equal');
      return;
    }

    if (this.receiptForm.invalid) {
      this; this.appSettingService.showError('Please fill all required fields');
      this.markFormGroupTouched(this.receiptForm);
      return;
    }
    this.isSaving = true;

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const voucherMatching = this.voucherMatchings.getRawValue()
    .filter(vm => (vm.matchCurrAmt || vm.matchLocalAmt))
    .map((vm)=>({
      ...vm,
      DrCr : vm.drCr ?? '',
      VoucherType : vm.voucherTypeMasterSid,
      CurrencyCode : vm.matchCurr ?? '',
      ExchangeRate : vm.matchExRate || 1,
      Amount : vm.matchCurrAmt ?? 0,
      LocalAmount : vm.matchLocalAmt ?? 0,
    }));
    
    console.log("Only filled voucher matchings", voucherMatching);
    const totalTDSAmount = voucherMatching.reduce((acc, curr) => acc + curr.tdsAmt, 0);
    const totalLocalAmount = voucherMatching.reduce((acc, curr) => acc + curr.matchLocalAmt, 0);
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CashOrBank: formValue.CashOrBank ? "C" : "B",
      MultiBranch: formValue.MultiBranch ? "Y" : "N",
      VoucherDate: formValue.VoucherDate,
      YearMasterSid: this.currentYearId,
      Narration: formValue.Narration,
      PartyMasterSid: formValue.PartyMasterSid,
      PartyName: formValue.PartyName,
      PartyAddress: formValue.PartyAddress,
      CustomerBranchSid: formValue.CustomerBranchSid,
      PlaceOfSupply: formValue.PlaceOfSupply,
      State: formValue.State,
      COAMasterSid: formValue.COAMasterSid,
      BankCOA: formValue.BankCOA,
      BankPartyName: formValue.BankPartyName,
      GST_VAT: formValue.GST_VAT,
      ReversalVoucher: formValue.ReversalVoucher,
      TaxNumber: formValue.TaxNumber,
      GSTType: formValue.GSTType,
      Remarks: formValue.Remarks,
      CurrencyMasterSid: formValue.CurrencyMasterSid,
      CurrencyCode: formValue.CurrencyCode,
      ExchangeRate: formValue.ExchangeRate,
      Amount: 0,
      LocalAmount: 0,
      NetAmount: 0,
      TaxType: this.currentUserCountry === 'india' ? 'GST' : (this.currentUserCountry === 'united arab emirates' ? 'VAT' : ''),
      InstrumentMode: formValue.InstrumentMode,
      InstrumentNumber: formValue.InstrumentNumber,
      InstrumentDate: formValue.InstrumentDate,
      ClearanceDate: formValue.ClearanceDate,
      ...(isPostingTrue ? {
        PostStatus: 'P'
      } : {}),
      detailItems: detailItems.map(d => {
        const isBankRecord = d.COAMasterSid === formValue.BankCOA;
        return {
          ...d,
          ...(isBankRecord ? {
            DrCr: 'D',
            Amount: this.voucherMatchings.length > 0 ? totalLocalAmount - totalTDSAmount : d.Amount,
            LocalAmount: this.voucherMatchings.length > 0 ? totalLocalAmount - totalTDSAmount : d.LocalAmount
          } : {})
        }
      }),
      voucherMatching : voucherMatching,
      ...(this.isEditMode ? {
        UpdatedBy: currentUserEmail
      } : {
        CreatedBy: currentUserEmail
      })
    }

    console.log("PAYLOAD", payload);

    if (this.isEditMode) {
      this.accountService.updateReceiptById(this.headerId, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Receipt updated successfully');
            const id = resp.data?.voucherHeader?.VoucherHeaderSid;
            this.loadReceipt(this.headerId)
          } else {
            this.appSettingService.showError(resp.message);
          }
        }
      );
    } else {
      this.accountService.createReceipt(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Receipt created successfully');
            const id = resp.data?.voucherHeader?.VoucherHeaderSid;
            if (id) {
              this.router.navigate(['accounts/receipt/entry', id]);
            }
          } else {
            this.appSettingService.showError(resp.message);
          }
        }
      )
    }
  }

  /**
 * Load existing receipt for editing
 */
  loadReceipt(receiptId: number) {
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherHeaderSid: receiptId
    }
    this.accountService.getReceiptById(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.patchValues(resp.data);
        } else {
          this.appSettingService.showError(resp.message);
        }
      }
    );
  }

  patchValues(response: any) {
    this.receiptData = response;
    const { VoucherDetail, VoucherTransaction, voucherMatchings, ...headerInfo } = response;
    this.receiptForm.patchValue({
      VoucherNumber: headerInfo.VoucherNumber,
      CashOrBank: headerInfo.CashOrBank === "C",
      MultiBranch: headerInfo.MultiBranch === "Y",
      VoucherDate: headerInfo.VoucherDate,
      BankCOA: headerInfo.BankCOA,
      CurrencyMasterSid: headerInfo.CurrencyMasterSid,
      CurrencyCode: headerInfo.CurrencyCode,
      ExchangeRate: headerInfo.ExchangeRate,
      PartyMasterSid: headerInfo.PartyMasterSid,
      PartyName: headerInfo.PartyName,
      PartyAddress: headerInfo.PartyAddress,
      CustomerBranchSid: headerInfo.CustomerBranchSid,
      COAMasterSid: headerInfo.COAMasterSid,
      LedgerMasterSid: headerInfo.LedgerMasterSid,
      GST_VAT: headerInfo.GST_VAT,
      BankPartyName: headerInfo.BankPartyName,
      Narration: headerInfo.Narration,
      Remarks: headerInfo.Remarks,
      InstrumentMode: headerInfo.InstrumentMode,
      InstrumentNumber: headerInfo.InstrumentNumber,
      InstrumentDate: headerInfo.InstrumentDate,
      ClearanceDate: headerInfo.ClearanceDate,
    })

    const detailItems = response.VoucherDetail || [];
    detailItems.forEach((d, index) => {
      const detailRecord = {
        VoucherDetailSid: d.VoucherDetailSid,
        VoucherHeaderSid: d.VoucherHeaderSid,
        Sno: index + 1,
        Status: String(d.Status).charAt(0),
        COAMasterSid: d.COAMasterSid,
        LedgerMasterSid: d.LedgerMasterSid,
        DrCr: d.DrCr,
        CurrencyMasterSid: d.CurrencyMasterSid,
        CurrencyCode: d.CurrencyCode,
        ExchangeRate: d.ExchangeRate,
        NumberOfUnit: d.NumberOfUnit,
        Rate: d.Rate,
        Amount: d.Amount,
        LocalAmount: d.LocalAmount,
        Narration: d.Narration,
        CostCenter: d.CostCenter,
        ProfitCenter: d.ProfitCenter,
        DepartmentMasterSid: d.DepartmentMasterSid,
        ChargeMasterSid: d.ChargeMasterSid,
        ChargeDescription: d.ChargeDescription,
        HSSACMasterSid: d.HSSACMasterSid,
        ChargeUOMSid: d.ChargeUOMSid,
        HouseJobSid: d.HouseJobSid,
        MasterJobSid: d.MasterJobSid,
        YearMasterSid: d.YearMasterSid,
        VoucherTransactionSid: d.VoucherTransactionSid,
        CostRevenue: d.CostRevenue,
        TaxableAmount: d.TaxableAmount,
        TaxPercentage1: d.TaxPercentage1,
        TaxAmount1: d.TaxAmount1,
        TaxPercentage2: d.TaxPercentage2,
        TaxAmount2: d.TaxAmount2,
        InvoiceType: d.InvoiceType,
        Remarks: d.Remarks,
        PartyAmount: d.PartyAmount
      }

      this.addDetailRow(detailRecord);
      this.handleCOAChange({
        COAMasterSid: d.COAMasterSid,
        SubledgerName: d.LedgerMasterSid !== null ? 'Y' : 'N'
      }, index);
      const dept = this.deptList.find(dep => dep.DepartmentMasterSid === d.DepartmentMasterSid);
      this.filterDetailsWithDept(dept, index);
      this.onMasterJobChange(index, {
        MasterJobSid: d.MasterJobSid
      })
    })

    const voucherMatchingHeader = response.voucherMatchingHeader[0] || [];
    console.log("VOUCHER MATCHING HEADER", voucherMatchingHeader);
    const voucherMatchingRecords = voucherMatchingHeader.voucherMatchings || [];
    console.log("VOUCHER MATCHING RECORDS", voucherMatchingRecords);
    this.patchOutstandingFormArray(voucherMatchingRecords);

  }

  /**
 * Reset form
 */
  resetForm(): void {
    this.receiptForm.reset();
    this.detailItems.clear();
    this.interBranches.clear();
    this.addInterBranch();
    this.selectedInvoices = [];
    this.outstandingInvoices = [];
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    history.back();
  }

  // Section-2 VoucherDetail Related

  get detailItems(): FormArray {
    return this.receiptForm.get('detailItems') as FormArray;
  }

  constructDetailItems(data?: any): FormGroup {
    const detailItem = this.fb.group({
      // Primary & audit fields
      VoucherDetailSid: [data?.VoucherDetailSid || 0],
      VoucherHeaderSid: [data?.VoucherHeaderSid || null],
      Sno: [data?.Sno || 1],
      Status: [data?.Status || 'A'],

      // Foreign keys
      COAMasterSid: [data?.COAMasterSid || null, [Validators.required]],
      LedgerMasterSid: [data?.LedgerMasterSid || null, [Validators.required]],
      DrCr: [data?.DrCr || 'D', Validators.required],
      CurrencyMasterSid: [data?.CurrencyMasterSid || null, Validators.required],
      CurrencyCode: [data?.CurrencyCode || 'INR', Validators.required],
      ExchangeRate: [data?.ExchangeRate || 1.000, Validators.required],
      NumberOfUnit: [data?.NumberOfUnit || 1.000],
      Rate: [data?.Rate || 1],
      Amount: [data?.Amount || 0.000, Validators.required],
      LocalAmount: [data?.LocalAmount || 0.000, Validators.required],

      Narration: [data?.Narration || ''],
      CostCenter: [data?.CostCenter || null],
      ProfitCenter: [data?.ProfitCenter || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null],
      ChargeMasterSid: [data?.ChargeMasterSid || null],
      ChargeDescription: [data?.ChargeDescription || ''],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      ChargeUOMSid: [data?.ChargeUOMSid || null],
      HouseJobSid: [data?.HouseJobSid || null],
      MasterJobSid: [data?.MasterJobSid || null],


      YearMasterSid: [data?.YearMasterSid || null],
      VoucherTransactionSid: [data?.VoucherTransactionSid || null],

      // Transaction details
      CostRevenue: [data?.CostRevenue || ''],
      TaxableAmount: [data?.TaxableAmount || 0.000],
      TaxPercentage1: [data?.TaxPercentage1 || 0.00],
      TaxAmount1: [data?.TaxAmount1 || 0.000],
      TaxPercentage2: [data?.TaxPercentage2 || 0.00],
      TaxAmount2: [data?.TaxAmount2 || 0.000],
      InvoiceType: [data?.InvoiceType || ''],
      Remarks: [data?.Remarks || ''],
      PartyAmount: [data?.PartyAmount || 0.000],

      // Relational objects (used for dropdowns or display)
      coaMaster: [data?.coaMaster || null],              // COA reference
      chargeMaster: [data?.chargeMaster || null],        // Charge reference
      currencyMaster: [data?.currencyMaster || null],    // Currency reference
      departmentMaster: [data?.departmentMaster || null],
      hSSACMaster: [data?.hSSACMaster || null],
      houseJob: [data?.houseJob || null],
      masterJob: [data?.masterJob || null],
      CostCenterMaster: [data?.CostCenterMaster || null],
      ProfitCenterMaster: [data?.ProfitCenterMaster || null],
      VoucherHeader: [data?.VoucherHeader || null],
      voucherTransaction: [data?.voucherTransaction || null],
      yearMaster: [data?.yearMaster || null],
    });
    return detailItem;
  }

  addDetailRow(data?: any) {
    const newRow = this.constructDetailItems(data);
    this.detailItems.push(newRow);
    const lastAddedRow = this.detailItems.length - 1;
    const localAmountTriggeringCtrls = ['Amount', 'ExchangeRate'];
    localAmountTriggeringCtrls.forEach(ctrl => {
      newRow.get(ctrl)?.valueChanges.subscribe(() => {
        this.calculateLocalAmount(lastAddedRow);
      });
    });
  }

  removeDetail(detailIndex: number, VoucherDetailSid?: number) {

    // Case 1 : Row has VoucherDetailSid → call API first
    if (VoucherDetailSid) {
      this.accountService.softDeleteVoucherDetail(VoucherDetailSid).subscribe({
        next: (res) => {
          // On success, remove row from form array
          (this.detailItems as FormArray).removeAt(detailIndex);
        },
        error: (err) => {
          console.error('Error deleting voucher detail:', err);
        }
      });
    }
    // Case 2 : New row (no VoucherDetailSid) → directly remove it
    else {
      (this.detailItems as FormArray).removeAt(detailIndex);
    }
  }

  private subscribeToPartyAndBankChanges(): void {
    combineLatest([
      this.receiptForm.get('CustomerBranchSid').valueChanges,
      this.receiptForm.get('BankCOA').valueChanges
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([partySid, bankCoaSid]) => {
      // Check if both are selected and if the details grid is empty
      if (partySid && bankCoaSid) {
        this.populateInitialDetailRows(partySid, bankCoaSid);
      }
    });
  }

  private populateInitialDetailRows(partySid: number, bankCoaSid: number): void {
    this.detailItems.clear();
    console.log("Selected ITEMS", {
      SelectedPartyId: partySid,
      SelectedBankCoaId: bankCoaSid
    })
    // 1. Find the selected bank/cash ledger
    const isCashMode = this.receiptForm.get('CashOrBank')?.value;
    const bankLedgerSource = isCashMode ? this.cashTypeLedgers : this.bankTypedLedgers;
    const bankLedger = bankLedgerSource.find(ledger => ledger.COAMasterSid === bankCoaSid);

    // 2. Find the selected party ledger
    const partyLedger = this.partyList.find(p => p.CustomerBranchSid === partySid);

    console.log("Selected Full ITEMS", {
      SelectedParty: partyLedger,
      SelectedBank: bankLedger
    })

    if (!bankLedger || !partyLedger) {
      console.error('Could not find the selected bank or party ledger details.');
      return;
    }

    // 3. Create the Party Row (Credit)
    const partyData = {
      Sno: 1,
      COAMasterSid: partyLedger.COAMappedId,
      LedgerMasterSid: partyLedger.SubledgerMasterSid,
      DrCr: 'C',
      CurrencyMasterSid: this.r['CurrencyMasterSid']?.value,
      ExchangeRate: this.r['ExchangeRate']?.value,
    }
    console.log("PartyData", partyData);
    this.addDetailRow(partyData);
    this.fetchLedgerForCOA(partyLedger, 0);

    // 4. Create the Bank Row (Debit)
    const bankData = {
      Sno: 2,
      COAMasterSid: bankLedger.COAMasterSid,
      LedgerMasterSid: bankLedger.LedgerMasterSid,
      DrCr: 'D',
      CurrencyMasterSid: this.r['CurrencyMasterSid']?.value,
      ExchangeRate: this.r['ExchangeRate']?.value,
    }
    console.log("BankData", bankData);
    this.addDetailRow(bankData);
    this.fetchLedgerForCOA(bankLedger, 1);

  }

   handleCOAChange(coa: any, detailIndex: number) {
    console.log("Handle COA Change", coa);
    if (!coa) {
      this.detailItems.at(detailIndex).get('LedgerMasterSid')?.setValue(null);
      return;
    }
    this.fetchLedgerForCOA(coa, detailIndex);
  }

  fetchLedgerForCOA(coa: any, detailIndex: number) {
    const ledgerCtrl = (this.detailItems.at(detailIndex) as FormGroup).get('LedgerMasterSid');
    if (coa.SubledgerName === 'Y') {
      ledgerCtrl.enable();
      ledgerCtrl.setValidators([Validators.required]);
      this.accountService.getLedgerByCOAMasterSid({
        COAMasterSid: coa.COAMasterSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid
      }).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.ledgerList[detailIndex] = resp.data || [];
            const currentValue = ledgerCtrl.getRawValue();
            const exist = this.ledgerList[detailIndex].find(l => l.SubledgerMasterSid === currentValue);
            if (exist) {
              ledgerCtrl.setValue(exist.SubledgerMasterSid);
            } else {
              ledgerCtrl.setValue(null);
            }
          } else {
            this.appSettingService.showError('Error fetching ledger for COA');
          }
        }
      )
    } else {
      ledgerCtrl.disable();
      ledgerCtrl.clearValidators();
    }
    console.log("LEDGER CTRL STATE", ledgerCtrl.enabled)
  }

  onCurrencyChangeForEachRow(selected: any, index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    if (!selected || selected === undefined) {
      row.get('CurrencyCode')?.setValue('');
      row.get('ExchangeRate')?.setValue('');
      return;
    }
    row.get('CurrencyCode')?.setValue(selected.currencyCode);
    this.patchCurrencyExchangeRateForDetail(selected.CurrencyMasterSid, index);
    this.calculateLocalAmount(index);
  }

  patchCurrencyExchangeRateForDetail(currencySid: number, detailIndex: number) {
    this.getExchangeRate(currencySid).subscribe(
      (resp: any) => {
        const row = this.detailItems.at(detailIndex) as FormGroup;
        const currencyCode = this.currencyList.find(c => c.CurrencyMasterSid === currencySid)?.currencyCode;
        row.get('ExchangeRate')?.setValue(this.getFormattedExchangeRate(Number(resp) || 1, currencySid).toFixed(this.getExchangeRateDecimalPlaces(currencyCode)));
      }
    )
  }

  onChargeChange(detailIndex: number, charge: any) {
    const row = this.detailItems.at(detailIndex) as FormGroup;
    if (!charge) {
      row.patchValue({
        ChargeDescription: '',
        HSSACMasterSid: null,
        ChargeUOMSid: null,
      });
      return;
    }
    row.patchValue({
      ChargeDescription: charge.chargeName,
      HSSACMasterSid: charge.HSSACMasterSid || null,
      ChargeUOMSid: charge.UOM,
    })
  }

  filterDetailsWithDept(dept: any, detailIndex: number) {
    if (!dept) {
      const row = this.detailItems.at(detailIndex) as FormGroup;
      row.patchValue({
        ChargeDescription: '',
        HSSACMasterSid: null,
        ChargeUOMSid: null,
        MasterJobSid: null,
        HouseJobSid: null,
      });
      this.filteredChargeList[detailIndex] = [];
      this.masterJobList[detailIndex] = [];
      this.houseJobList[detailIndex] = [];
      return;
    }
    this.filterChargeByDeptForARow(dept, detailIndex);
    this.accountService.getMasterJobByDepartment({
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
    this.accountService.getHouseJobByMasterJob({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MasterJobSid: masterJob?.MasterJobSid
    }).subscribe({
      next: (resp: any) => {
        this.houseJobList[detailIndex] = resp;
      },
      error: (err) => {
        console.error('Failed to load house jobs:', err);
      }
    });
  }

  filterChargeByDeptForAllRow() {
    this.detailItems.controls.forEach((group: FormGroup, index) => {
      const deptId = group.get('DepartmentMasterSid')?.value;
      const department = this.deptList.find(dept => dept.DepartmentMasterSid === deptId);
      console.log("FILTER CHARGE BY DEPT FOR ALL ROW", {
        deptId: deptId,
        deptObj: department,
        deptList: this.deptList
      });
      if (department) {
        this.filterChargeByDeptForARow(department, index);
      }
    })
  }

  filterChargeByDeptForARow(dept, rowIndex) {
    console.log(`Filtering Dept from row ${rowIndex}`, {
      department: dept,
      chargeList: this.chargeList
    });
    const departmentName = dept.departmentName;
    this.filteredChargeList[rowIndex] = (this.chargeList || []).filter(charge => {
      const allDepartmentNames = charge.DepartmentMasterSid || [];
      return allDepartmentNames.includes(departmentName);
    })
  }

  // Section-3 Voucher Matching Related

  get voucherMatchings(): FormArray {
    return this.receiptForm.get('voucherMatchings') as FormArray;
  }

  patchOutstandingFormArray(transactions: any[]) {
    this.voucherMatchings.clear();

    const currencyInHeader = this.r['CurrencyCode']?.value;
    const exchangeRateInHeader = this.r['ExchangeRate']?.value;

    transactions.forEach(tx => {

      const isMatchedRecord = !!tx.VoucherMatchingSid;  // <–– detect matched data

      const form = this.fb.group({
        VoucherMatchingSid: [tx.VoucherMatchingSid || null],
        VoucherTransactionSid: [tx.VoucherTransactionSid],
        VoucherHeaderSid: [tx.VoucherHeaderSid],
        VoucherDetailSid: [tx.VoucherDetailSid],
        LedgerMasterSid: [tx.LedgerMasterSid],
        COAMasterSid: [tx.COAMasterSid],

        // Voucher Info
        voucherNo: [tx.VoucherHeader?.VoucherNumber || tx.VoucherNumber || tx.voucherNo],
        voucherTypeMasterSid: [tx.VoucherType],
        voucherType: [tx.VoucherHeader?.voucherTypeMaster?.DocumentTypeName || tx.VoucherType],
        voucherDate: [new Date(tx.VoucherHeader?.VoucherDate || tx.VoucherDate)],
        drCr: [tx.DrCr === "C" ? "Cr" : "Dr"],

        // System amounts
        curr: [tx.CurrencyCode],
        currAmt: [tx.OriginalCurrencyAmount ?? tx.Amount],
        localAmt: [tx.OriginalAmount ?? tx.LocalAmount],

        osCurrAmt: [tx.OutstandingCurrencyAmount ?? tx.Amount],
        osLocalAmt: [tx.OutstandingAmount ?? tx.LocalAmount],

        exRate: [tx.ExchangeRate || 1],

        // Matching values (either blank or existing)
        matchCurr: [
          isMatchedRecord ? tx.CurrencyCode : currencyInHeader
        ],
        matchExRate: [
          isMatchedRecord ? tx.ExchangeRate : (exchangeRateInHeader || 1)
        ],
        matchCurrAmt: [
          isMatchedRecord ? tx.Amount : null
        ],
        matchLocalAmt: [
          isMatchedRecord ? tx.LocalAmount : null
        ],
        tdsAmt: [
          isMatchedRecord ? tx.TDSAmount ?? null : null
        ],

        balance: [
          isMatchedRecord ? (tx.OutstandingAmount - tx.LocalAmount) : null
        ]
      });

      // Disable fields
      [
        'voucherNo', 'voucherType', 'voucherDate', 'drCr',
        'curr', 'exRate', 'currAmt', 'localAmt', 'osCurrAmt', 'osLocalAmt',
        'balance'
      ].forEach(field => form.get(field)?.disable());
      form.get('matchLocalAmt').valueChanges.subscribe(val => {
        const osLocalAmt = form.get('osLocalAmt')?.value;
        form.get('balance')?.setValue(osLocalAmt - val);
      });
      this.voucherMatchings.push(form);
    });

    console.log("Unified FormArray →", this.voucherMatchings.getRawValue());
  }


  patchExchangeRateForMatchRow(index: number) {
    const row = this.voucherMatchings.at(index) as FormGroup;
    const curr = row.get('matchCurr')?.value;
    this.getExchangeRate(curr).subscribe(rate => {
      row.get('matchExRate')?.setValue(rate);
    })
    this.calculateLocalAmountForMatchRow(index);
  }



  calculateLocalAmountForMatchRow(index: number) {
    const row = this.voucherMatchings.at(index) as FormGroup;
    const amount = Number(row.get('matchCurrAmt')?.value);
    const exchangeRate = Number(row.get('matchExRate')?.value);
    const formattedExchangeRate = this.getFormattedExchangeRate(exchangeRate, row.get('matchCurr')?.value);
    const formattedAmount = this.getFormattedAmount(amount, row.get('matchCurr')?.value);

    let finalAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      finalAmount = Number(formattedAmount) * Number(formattedExchangeRate);
    } else {
      finalAmount = Number(amount) * Number(formattedExchangeRate);
    }
    row.get('matchLocalAmt')?.setValue(this.getFormattedAmount(finalAmount, row.get('matchCurr')?.value));
  }

  
  /**
   * Remove voucher matching row
   */
  removeVoucher(index: number): void {
    this.detailItems.removeAt(index);
    this.recalculateTotalAmount();
  }

  getTotalCurrAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('currAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalLocalAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('localAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalOSCurrAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('osCurrAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalOSLocalAmount() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('osLocalAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalMatchCurrAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('matchCurrAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalMatchLocalAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('matchLocalAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalTdsAmt() {
    return (this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('tdsAmt')?.value || 0), 0).toFixed(2));
  }

  /**
 * Select invoices from outstanding modal
 */
  applySelectedInvoices(): void {
    const selectedInvoices = this.outstandingInvoices.filter((inv) => inv.selected);

    if (selectedInvoices.length === 0) {
      this.toastr.warning('Please select at least one invoice');
      return;
    }

    // Clear existing vouchers
    this.detailItems.clear();

    // Add selected invoices to vouchers
    selectedInvoices.forEach((invoice) => {
      const amountToApply = invoice.amountToApply || invoice.OutstandingAmount;

      this.detailItems.push(
        this.fb.group({
          VoucherTransactionSid: [invoice.VoucherTransactionSid],
          VoucherNumber: [invoice.VoucherNumber],
          VoucherType: [invoice.VoucherType],
          VoucherDate: [invoice.VoucherDate],
          OriginalAmount: [invoice.OriginalAmount],
          OutstandingAmount: [invoice.OutstandingAmount],
          MatchedAmount: [amountToApply, [Validators.required, Validators.min(0)]],
          CurrencyCode: [invoice.CurrencyCode],
          DrCr: [invoice.DrCr],
          Narration: [''],
          IsAdvance: [false],
        }),
      );
    });

    this.recalculateTotalAmount();
    this.modalService.dismissAll();
    this.toastr.success(`${selectedInvoices.length} invoice(s) added`);
  }


  // Section-4 Helper
  getCurrentCompanyBranches() {
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    const currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === currentCompanyId).companyMaster);
    this.currentCompanyBranches = (currentCompany?.userBranchMaster || []).map(ubm => ubm.branchMaster);
    console.log(this.currentCompanyBranches);
  }


  get r(): { [key: string]: AbstractControl } {
    return this.receiptForm.controls || {}
  }

  get interBranches(): FormArray {
    return this.receiptForm.get('interBranches') as FormArray;
  }

  /**
   * Add inter-branch row
   */
  addInterBranch(): void {
    this.interBranches.push(
      this.fb.group({
        BranchMasterSid: [null, Validators.required],
        BranchName: [''],
        Amount: [0, [Validators.required, Validators.min(0)]],
        InterBranchJV: [''],
        VoucherType: [''],
      }),
    );
  }

  /**
   * Remove inter-branch row
   */
  removeInterBranch(index: number): void {
    this.interBranches.removeAt(index);
  }

  /**
   * Tab selection
   */
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  /**
   * Open outstanding modal
   */
  openDubaiModal(content: any): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }







  // async searchOutstanding(modal?: any): Promise<void> {
  //   const customerSid = this.receiptForm.get('LedgerMasterSid')?.value;
  //   if (!customerSid) {
  //     this.toastr.warning('Please select a customer first');
  //     return;
  //   }

  //   try {
  //     // Use receipt service which calls outstanding service
  //     const invoices = await this.receiptService.getCustomerOutstanding(this.CompanyMasterSid, customerSid).toPromise();

  //     if (invoices && invoices.length > 0) {
  //       this.outstandingInvoices = invoices;
  //       this.modalService.open(modal, { size: 'xl', backdrop: 'static' });
  //     } else {
  //       this.toastr.info('No outstanding invoices found for this customer');
  //     }
  //   } catch (error: any) {
  //     console.error('Failed to fetch outstanding:', error);
  //     this.toastr.error(error.message || 'Failed to fetch outstanding invoices');
  //   }
  // }



  /**
   * Calculate total invoice amount from vouchers
   */
  recalculateTotalAmount(): void {
    let total = 0;
    this.detailItems.controls.forEach((control) => {
      const matchedAmount = control.get('MatchedAmount')?.value || 0;
      total += matchedAmount;
    });

    this.receiptForm.patchValue({
      TotalInvoiceAmount: total,
    });
  }

  /**
   * Calculate TDS amount
   */
  calculateTDS(): void {
    const hasTDS = this.receiptForm.get('HasTDS')?.value;
    if (!hasTDS) {
      this.receiptForm.patchValue({ TDSAmount: 0 });
      return;
    }

    const totalAmount = this.receiptForm.get('TotalInvoiceAmount')?.value || 0;
    const tdsPercentage = this.receiptForm.get('TDSPercentage')?.value || 0;

    const tdsAmount = this.receiptService.calculateTDS(totalAmount, tdsPercentage);
    this.receiptForm.patchValue({ TDSAmount: tdsAmount });
  }

  /**
   * Calculate net receipt amount
   */
  calculateNetAmount(): void {
    const totalAmount = this.receiptForm.get('TotalInvoiceAmount')?.value || 0;
    const tdsAmount = this.receiptForm.get('TDSAmount')?.value || 0;

    const netAmount = this.receiptService.calculateNetAmount(totalAmount, tdsAmount);
    this.receiptForm.patchValue({ NetReceiptAmount: netAmount });
  }









  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.receiptForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  onCurrencyChange(selected: any) {
    if (!selected) {
      this.receiptForm.patchValue({
        CurrencyCode: null
      })
      return;
    } else {
      this.receiptForm.patchValue({
        CurrencyCode: selected.currencyCode
      })
    }
    this.patchCurrencyExchangeRate();
  }

  patchCurrencyExchangeRate() {
    const currencySid = this.receiptForm.get('CurrencyMasterSid')?.value;
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    console.log('Entered patchCurrencyExchangeRate', {
      FromCurrencyId: currencySid,
      toCurrencyId: companyCurrency
    });

    if (currencySid === companyCurrency && currencySid !== null) {
      this.receiptForm.patchValue({
        ExchangeRate: 1
      })
      return;
    }

    const fromCurrencyCode = this.receiptForm.get('CurrencyCode')?.value;
    const toCurrencyCode = this.currencyList.find(c => c.CurrencyMasterSid === companyCurrency)?.currencyCode;
    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }
    console.log('FINDING CURRENCY EXCHANGE', {
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode
    })
    const payload = {
      fromCurrencyCode,
      toCurrencyCode,
      segment: 'revenue'
    };
    this.accountService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp?.status && resp.data) {
          console.log('PATCHING EXCHANGE RATE', resp.data);
          this.receiptForm.patchValue({
            ExchangeRate: resp.data
          })
        }
      }
    )
  }

  onPartyChange(party: any) {
    console.log("Selected Party", party);
    this.errorLogger();
    if (!party) {
      this.receiptForm.patchValue({
        PartyMasterSid: null,
        PartyName: '',
        PartyAddress: '',
        CustomerBranchSid: null,
        COAMasterSid: null,
        LedgerMasterSid: null,
        GST_VAT: ''
      })
      return;
    }
    this.receiptForm.patchValue({
      PartyMasterSid: party.SubledgerMasterSid,
      PartyName: party.CustomerName,
      PartyAddress: party.Address,
      CustomerBranchSid: party.CustomerBranchSid,
      COAMasterSid: party.COAMappedId,
      LedgerMasterSid: party.SubledgerMasterSid,
      GST_VAT: party.GSTNo
    })
    if (!this.r['BankPartyName']?.value) {
      this.r['BankPartyName']?.setValue(party.CustomerName);
    }
    console.log("FORM VALUE AFTER CUSTOMER SELECTED", this.receiptForm.value);
  }

  // openSearchModal() {
  //   if (!this.searchModal) {
  //     this.appSettingService.showError('Search modal template not found');
  //     return;
  //   }

  //   this.searchType = 'House No';
  //   this.searchValue = '';
  //   this.allPendingCosts = [];
  //   this.selectedCosts = [];

  //   this.modalService.open(this.searchModal, {
  //     size: 'lg',
  //     backdrop: 'static',
  //     keyboard: false
  //   });
  // }
  // closeSearchModal() {
  //   this.modalService.dismissAll();
  //   this.selectedCosts = [];
  // }

  toggleMultiBranch(event: any): void {
    const ctrl = this.receiptForm.get('MultiBranch');
    const element = event.target as HTMLInputElement;
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      element.checked = !element.checked;
    }
    ctrl.setValue(element.checked);
    if (element.checked) {
      // Only add interBranch tab if not already present
      if (!this.tabs.find(t => t.name === 'Interbranch')) {
        this.tabs.push({ name: 'Interbranch', icon: 'fas fa-flag-checkered' });
      }
      // Do not auto-populate interBranches; only add rows when user clicks "Add"
    } else {
      // Remove interBranch tab and clear form array
      this.tabs = this.tabs.filter(t => t.name !== 'Interbranch');
      this.interBranches.clear();
    }
  }



  toggleCashOrBank(event: any) {
    const element = event.target as HTMLInputElement;
    const ctrl = this.receiptForm.get('CashOrBank');
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      element.checked = !element.checked;
      console.log("KEYBOARD EVENT TRIGGERED", {
        isCheckBoxTicked: element.checked,
        prevValue: ctrl.value,
        newValue: !ctrl.value
      })
    }
    else if (event instanceof PointerEvent) {
      console.log("POINTER EVENT TRIGGERED", {
        isCheckBoxTicked: element.checked,
        prevValue: ctrl.value,
        newValue: !ctrl.value
      })
    }
    this.r['BankCOA']?.setValue(null);
    ctrl.setValue(element.checked);
  }

 

  getExchangeRate(currency: number | string): Observable<number> {
    if (!currency) {
      return of(1);
    }

    if (typeof currency === 'string') {
      currency = this.currencyList.find(curr => curr.currencyCode === currency)?.CurrencyMasterSid;
    }
    const fromCurrencyId = currency as number;
    const toCurrencyId = this.currentCompany?.CurrencyMasterSid;

    console.log("CURRENCY EXCHANGE IDS", { fromCurrencyId, toCurrencyId });

    if (fromCurrencyId === toCurrencyId) {
      console.log("SAME CURRENCY FOUND ON EXCHANGE RATE");
      return of(this.getFormattedExchangeRate(1, fromCurrencyId));
    }

    const fromCurrencyCode = this.currencyList.find(curr => curr.CurrencyMasterSid === fromCurrencyId)?.currencyCode;
    const toCurrencyCode = this.currencyList.find(curr => curr.CurrencyMasterSid === toCurrencyId)?.currencyCode;

    console.log("CURRENCY EXCHANGE CODES", { fromCurrencyCode, toCurrencyCode });

    if (!fromCurrencyCode || !toCurrencyCode) {
      console.log("NO CURRENCY CODE FOUND ON EXCHANGE RATE DEFAULTING TO 1");
      return of(this.getFormattedExchangeRate(1, fromCurrencyId));
    }

    const payload = {
      fromCurrencyCode,
      toCurrencyCode,
      segment: 'sale'
    };

    return this.accountService.getExchangeRate(payload).pipe(
      map((resp: any) => {
        if (resp.status && resp.data != null) {
          console.log("EXCHANGE RATE FOUND", resp.data);
          return this.getFormattedExchangeRate(resp.data, fromCurrencyId);
        } else {
          console.log("Exchange rate not found, defaulting to 1");
          return this.getFormattedExchangeRate(1, fromCurrencyId);
        }
      }),
      catchError((err) => {
        console.error("Error fetching exchange rate", err);
        return of(this.getFormattedExchangeRate(1, fromCurrencyId));
      })
    );
  }


  calculateLocalAmount(index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    const amount = Number(row.get('Amount')?.value);
    const exchangeRate = Number(row.get('ExchangeRate')?.value);
    const formattedExchangeRate = this.getFormattedExchangeRate(exchangeRate, row.get('CurrencyMasterSid')?.value);
    const formattedAmount = this.getFormattedAmount(amount, row.get('CurrencyMasterSid')?.value);

    let finalAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      finalAmount = Number(formattedAmount) * Number(formattedExchangeRate);
    } else {
      finalAmount = Number(amount) * Number(formattedExchangeRate);
    }
    row.get('LocalAmount')?.setValue(this.getFormattedAmount(finalAmount, row.get('CurrencyMasterSid')?.value));
  }

  setCurrencyCode(CurrencyMasterSid: number) {
    if(!CurrencyMasterSid || this.currencyList.length === 0) return;
    const code = this.currencyList.find(c => c.CurrencyMasterSid === CurrencyMasterSid)?.currencyCode;
    this.r['CurrencyCode']?.setValue(code);
  }



  clearSearchFields(type: string) {
    this.searchOutstandingForm.patchValue({
      LedgerMasterSid: null,
      CustomerName: '',
      InvoiceNumber: '',
      HouseNumber: '',
      FilterText: ''
    });
  }


  /**
   * Get the number of decimal places allowed for amounts
   * Used with [decimalDigitsAfter] directive
   * Example: getAmountDecimalPlaces('USD') returns 2
   */
  public getAmountDecimalPlaces(CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.amountDecimal;
    }
    return 2;
  }

  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces('USD') returns 3
   */
  public getExchangeRateDecimalPlaces(CurrencyMasterSid: string): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.exchangeDecimal;
    }
    return 2;
  }
  /**
 * Format an amount with currency symbol and comma separators
 * Example: getFormattedAmount(1234.56, 'USD') returns '$1,234.56'
 */
  public getFormattedAmount(amount: number, CurrencyMasterSid: number) {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    const input = {
      value: amount,
      currencyCode: currency?.currencyCode
    }
    return this.currencyFormatService.formatAmount(input, false);
  }

  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  public getFormattedExchangeRate(rate: number, CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    return this.currencyFormatService.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode
    });
  }




  private findInvalidControlsRecursive(form: FormGroup | FormArray): string[] {
    let invalidControls: string[] = [];
    Object.keys(form.controls).forEach(key => {
      const control = (form as any).get(key);
      if (control.invalid) {
        invalidControls.push(key);
      }
      if (control instanceof FormGroup || control instanceof FormArray) {
        invalidControls = invalidControls.concat(
          this.findInvalidControlsRecursive(control).map(childKey => `${key}.${childKey}`)
        );
      }
    });
    return invalidControls;
  }

  public errorLogger(): void {
    console.log('Form Status:', this.receiptForm.status);
    if (this.receiptForm.invalid) {
      const invalid = this.findInvalidControlsRecursive(this.receiptForm);
      console.log('Invalid controls:', invalid);
    } else {
      console.log('No invalid controls found.');
    }
  }




  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

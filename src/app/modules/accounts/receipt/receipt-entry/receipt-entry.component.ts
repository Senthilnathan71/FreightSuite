import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
  imports: [CommonModule, ReactiveFormsModule, NgbDatepickerModule, FeatherModule, NgSelectComponent],
  templateUrl: './receipt-entry.component.html',
  styleUrl: './receipt-entry.component.scss',
})
export class ReceiptEntryComponent implements OnInit {
  receiptForm!: FormGroup;
  selectedTab = 'Detail';
  isEditMode = false;
  isSaving = false;

  // Master data
  companySid = 1; // TODO: Get from session/auth
  branchSid = 1; // TODO: Get from session/auth
  paymentModes: { value: string; label: string}[] = [];

  // Outstanding invoices
  outstandingInvoices: OutstandingInvoice[] = [];
  selectedInvoices: OutstandingInvoice[] = [];

  // Search modes
  ModeofSearch = [
    { id: 1, name: 'House No' },
    { id: 2, name: 'HBL No' },
    { id: 3, name: 'Master No' },
    { id: 4, name: 'MBL No' },
    { id: 5, name: 'HAWB' },
    { id: 6, name: 'MAWB' },
    { id: 7, name: 'Party' },
    { id: 8, name: 'Invoice' },
  ];

  // Tabs configuration
  tabs = [
    { name: 'Detail', icon: 'fas fa-address-card' },
    { name: 'Voucher', icon: 'fas fa-code-branch' },
    { name: 'Interbranch', icon: 'fas fa-flag-checkered' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private receiptService: ReceiptService,
    private outstandingService: OutstandingService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPaymentModes();
    this.setupFormListeners();

    // Check if editing existing receipt
    const receiptId = this.route.snapshot.params['id'];
    if (receiptId) {
      this.isEditMode = true;
      this.loadReceipt(receiptId);
    } else {
      // Initialize with default values
      this.addVoucher();
      this.addInterBranch();
    }
  }

  /**
   * Initialize the receipt form with validation
   */
  private initializeForm(): void {
    this.receiptForm = this.fb.group({
      // Header section
      CompanyMasterSid: [this.companySid, Validators.required],
      BranchMasterSid: [this.branchSid, Validators.required],
      LedgerMasterSid: [null, Validators.required],
      CustomerName: [''],
      VoucherDate: [new Date(), Validators.required],
      VoucherNumber: [{ value: '', disabled: true }], // Auto-generated
      PaymentMode: [PaymentMode.NEFT, Validators.required],
      ChequeNumber: [''],
      ChequeDate: [null],
      BankName: [''],
      Narration: [''],
      Remarks: [''],

      // Currency
      CurrencyMasterSid: [null],
      CurrencyCode: ['INR'],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],

      // TDS
      HasTDS: [false],
      TDSPercentage: [0, [Validators.min(0), Validators.max(100)]],
      TDSLedgerMasterSid: [null],
      TDSAmount: [0],

      // Inter-branch
      IsInterBranch: [false],
      ReceivingBranchMasterSid: [null],

      // Amounts (calculated)
      TotalInvoiceAmount: [0],
      TotalCurrencyAmount: [0],
      NetReceiptAmount: [0],
      AdvanceAmount: [0],

      // Form arrays
      vouchers: this.fb.array([]), // Invoice matching
      interBranches: this.fb.array([]), // Inter-branch details
    });
  }

  /**
   * Load payment modes
   */
  private loadPaymentModes(): void {
    this.paymentModes = this.receiptService.getPaymentModes();
  }

  /**
   * Setup form value change listeners
   */
  private setupFormListeners(): void {
    // Recalculate TDS when percentage or amount changes
    this.receiptForm.get('TDSPercentage')?.valueChanges.subscribe(() => {
      this.calculateTDS();
    });

    this.receiptForm.get('TotalInvoiceAmount')?.valueChanges.subscribe(() => {
      this.calculateTDS();
      this.calculateNetAmount();
    });

    // Show/hide TDS fields
    this.receiptForm.get('HasTDS')?.valueChanges.subscribe((hasTDS) => {
      if (hasTDS) {
        this.receiptForm.get('TDSPercentage')?.setValidators([Validators.required, Validators.min(0)]);
        this.receiptForm.get('TDSLedgerMasterSid')?.setValidators([Validators.required]);
      } else {
        this.receiptForm.get('TDSPercentage')?.clearValidators();
        this.receiptForm.get('TDSLedgerMasterSid')?.clearValidators();
        this.receiptForm.patchValue({ TDSPercentage: 0, TDSAmount: 0 });
      }
      this.receiptForm.get('TDSPercentage')?.updateValueAndValidity();
      this.receiptForm.get('TDSLedgerMasterSid')?.updateValueAndValidity();
    });

    // Show/hide inter-branch fields
    this.receiptForm.get('IsInterBranch')?.valueChanges.subscribe((isInterBranch) => {
      if (isInterBranch) {
        this.receiptForm.get('ReceivingBranchMasterSid')?.setValidators([Validators.required]);
      } else {
        this.receiptForm.get('ReceivingBranchMasterSid')?.clearValidators();
      }
      this.receiptForm.get('ReceivingBranchMasterSid')?.updateValueAndValidity();
    });

    // Show cheque fields for cheque payment mode
    this.receiptForm.get('PaymentMode')?.valueChanges.subscribe((mode) => {
      if (mode === PaymentMode.CHEQUE) {
        this.receiptForm.get('ChequeNumber')?.setValidators([Validators.required]);
        this.receiptForm.get('ChequeDate')?.setValidators([Validators.required]);
      } else {
        this.receiptForm.get('ChequeNumber')?.clearValidators();
        this.receiptForm.get('ChequeDate')?.clearValidators();
      }
      this.receiptForm.get('ChequeNumber')?.updateValueAndValidity();
      this.receiptForm.get('ChequeDate')?.updateValueAndValidity();
    });
  }

  /**
   * Form array getters
   */
  get vouchers(): FormArray {
    return this.receiptForm.get('vouchers') as FormArray;
  }

  get interBranches(): FormArray {
    return this.receiptForm.get('interBranches') as FormArray;
  }

  /**
   * Add voucher matching row
   */
  addVoucher(): void {
    this.vouchers.push(
      this.fb.group({
        VoucherTransactionSid: [null],
        VoucherNumber: [''],
        VoucherType: [''],
        VoucherDate: [''],
        OriginalAmount: [0],
        OutstandingAmount: [0],
        MatchedAmount: [0, [Validators.required, Validators.min(0)]],
        CurrencyCode: ['INR'],
        DrCr: [''],
        Narration: [''],
        IsAdvance: [false],
      }),
    );
  }

  /**
   * Remove voucher matching row
   */
  removeVoucher(index: number): void {
    this.vouchers.removeAt(index);
    this.recalculateTotalAmount();
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

  /**
   * Search outstanding invoices for customer
   */
  async searchOutstanding(modal: any): Promise<void> {
    const customerSid = this.receiptForm.get('LedgerMasterSid')?.value;
    if (!customerSid) {
      this.toastr.warning('Please select a customer first');
      return;
    }

    try {
      // Use receipt service which calls outstanding service
      const invoices = await this.receiptService.getCustomerOutstanding(this.companySid, customerSid).toPromise();

      if (invoices && invoices.length > 0) {
        this.outstandingInvoices = invoices;
        this.modalService.open(modal, { size: 'xl', backdrop: 'static' });
      } else {
        this.toastr.info('No outstanding invoices found for this customer');
      }
    } catch (error: any) {
      console.error('Failed to fetch outstanding:', error);
      this.toastr.error(error.message || 'Failed to fetch outstanding invoices');
    }
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
    this.vouchers.clear();

    // Add selected invoices to vouchers
    selectedInvoices.forEach((invoice) => {
      const amountToApply = invoice.amountToApply || invoice.OutstandingAmount;

      this.vouchers.push(
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

  /**
   * Calculate total invoice amount from vouchers
   */
  recalculateTotalAmount(): void {
    let total = 0;
    this.vouchers.controls.forEach((control) => {
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
   * Save receipt
   */
  async saveReceipt(): Promise<void> {
    if (this.receiptForm.invalid) {
      this.toastr.warning('Please fill all required fields');
      this.markFormGroupTouched(this.receiptForm);
      return;
    }

    this.isSaving = true;

    try {
      const formValue = this.receiptForm.getRawValue();

      // Build receipt details from vouchers
      const details: ReceiptDetail[] = this.vouchers.controls.map((control) => ({
        VoucherTransactionSid: control.get('VoucherTransactionSid')?.value,
        Amount: control.get('MatchedAmount')?.value,
        Narration: control.get('Narration')?.value,
        IsAdvance: control.get('IsAdvance')?.value || false,
      }));

      // Add advance amount if any
      const advanceAmount = formValue.AdvanceAmount || 0;
      if (advanceAmount > 0) {
        details.push({
          Amount: advanceAmount,
          IsAdvance: true,
          Description: 'Advance payment',
        });
      }

      const createRequest: CreateReceiptRequest = {
        CompanyMasterSid: formValue.CompanyMasterSid,
        BranchMasterSid: formValue.BranchMasterSid,
        LedgerMasterSid: formValue.LedgerMasterSid,
        VoucherDate: this.receiptService.formatDateForAPI(formValue.VoucherDate),
        Narration: formValue.Narration,
        PaymentMode: formValue.PaymentMode,
        ChequeNumber: formValue.ChequeNumber,
        ChequeDate: formValue.ChequeDate ? this.receiptService.formatDateForAPI(formValue.ChequeDate) : undefined,
        BankName: formValue.BankName,
        TotalAmount: formValue.TotalInvoiceAmount,
        CurrencyMasterSid: formValue.CurrencyMasterSid,
        ExchangeRate: formValue.ExchangeRate,
        CurrencyAmount: formValue.TotalCurrencyAmount,
        HasTDS: formValue.HasTDS,
        TDSLedgerMasterSid: formValue.TDSLedgerMasterSid,
        TDSAmount: formValue.TDSAmount,
        TDSPercentage: formValue.TDSPercentage,
        Details: details,
        IsInterBranch: formValue.IsInterBranch,
        ReceivingBranchMasterSid: formValue.ReceivingBranchMasterSid,
        CreatedBy: 'current-user', // TODO: Get from auth service
      };

      const response = await this.receiptService.createReceipt(createRequest).toPromise();

      this.toastr.success(`Receipt ${response?.VoucherNumber} created successfully`);
      this.router.navigate(['/accounts/receipt/list']);
    } catch (error: any) {
      console.error('Failed to save receipt:', error);
      this.toastr.error(error.message || 'Failed to save receipt');
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Load existing receipt for editing
   */
  private async loadReceipt(receiptId: number): Promise<void> {
    try {
      const receipt = await this.receiptService.getReceiptById(receiptId).toPromise();

      // TODO: Populate form with receipt data
      console.log('Loaded receipt:', receipt);
    } catch (error: any) {
      console.error('Failed to load receipt:', error);
      this.toastr.error('Failed to load receipt');
    }
  }

  /**
   * Reset form
   */
  resetForm(): void {
    if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
      this.receiptForm.reset();
      this.vouchers.clear();
      this.interBranches.clear();
      this.addVoucher();
      this.addInterBranch();
      this.selectedInvoices = [];
      this.outstandingInvoices = [];
    }
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    if (this.receiptForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/accounts/receipt/list']);
      }
    } else {
      this.router.navigate(['/accounts/receipt/list']);
    }
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
}

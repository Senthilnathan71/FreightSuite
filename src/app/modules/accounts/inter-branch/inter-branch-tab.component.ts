import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { getVoucherEntryLink, VoucherType } from 'src/app/common/voucher-route';

/**
 * Reusable, lazy-loadable Inter Branch tab for Receipt/Payment entry.
 * The owning `interBranches` FormArray lives on the parent form and is passed in; this component
 * only manages the Multi-Branch switch + per-branch allocation grid and emits add/remove/toggle events.
 */
@Component({
  selector: 'app-inter-branch-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, DecimalPrecisionDirective, RouterModule],
  templateUrl: './inter-branch-tab.component.html',
  styleUrl: './inter-branch-tab.component.scss',
})
export class InterBranchTabComponent implements OnChanges {
  // Voucher-type → entry-route mapping for the Source JV hyperlink (shared util).
  protected readonly getVoucherEntryLink = getVoucherEntryLink;
  protected readonly VoucherType = VoucherType;
  @Input() interBranches!: FormArray;
  @Input() mode: 'Receipt' | 'Payment' = 'Receipt';
  @Input() companyBranches: any[] = [];
  @Input() sourceBranchSid!: number;
  @Input() sourceAmount = 0; // header party amount — for the Σ ≤ source rule
  @Input() partyCurrency: { CurrencyMasterSid: number; currencyCode: string } = {
    CurrencyMasterSid: null as any,
    currencyCode: '',
  };
  @Input() headerExRate = 1;
  @Input() isPosted = false;
  @Input() multiBranch = false;
  @Input() localCurrencyCode = ''; // company local currency code — for Local Amount formatting

  @Output() multiBranchToggled = new EventEmitter<boolean>();
  @Output() branchAdded = new EventEmitter<number>();
  @Output() branchRemoved = new EventEmitter<number>();
  @Output() allocationsChanged = new EventEmitter<void>();

  selectedBranchSid: number | null = null;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private currencyConfig: CurrencyConfigurationService,
  ) {}

  /** Decimal places for the party (transaction) currency — drives amount formatting. */
  get amountDecimals(): number {
    const cfg = this.currencyConfig.getCurrencyConfig(this.partyCurrency?.currencyCode);
    return cfg?.amountDecimal ?? 2;
  }

  /** `digitsInfo` for the number pipe, based on the party currency. */
  get digitsInfo(): string {
    const d = this.amountDecimals;
    return `1.${d}-${d}`;
  }

  /** Decimal places for the company local currency — drives Local Amount formatting/rounding. */
  get localDecimals(): number {
    const cfg = this.localCurrencyCode
      ? this.currencyConfig.getCurrencyConfig(this.localCurrencyCode)
      : null;
    return cfg?.amountDecimal ?? this.amountDecimals;
  }

  /** `digitsInfo` for Local Amount cells, based on the local currency. */
  get localDigitsInfo(): string {
    const d = this.localDecimals;
    return `1.${d}-${d}`;
  }

  get rows() {
    return this.interBranches?.controls || [];
  }

  /** Stable array (NOT a getter) so ng-select doesn't reset its item list every change-detection. */
  availableBranches: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyBranches'] || changes['sourceBranchSid']) {
      this.refreshAvailableBranches();
    }
  }

  /** Branches not yet chosen (and never the source branch) → enforces "added only once". */
  refreshAvailableBranches(): void {
    const chosen = new Set(
      (this.interBranches?.controls || []).map((c) => c.get('BranchMasterSid')!.value),
    );
    this.availableBranches = (this.companyBranches || []).filter(
      (b) => b.BranchMasterSid !== this.sourceBranchSid && !chosen.has(b.BranchMasterSid),
    );
  }

  get totalAllocated(): number {
    return (this.interBranches?.controls || []).reduce(
      (s, c) => s + (Number(c.get('Amount')?.value) || 0),
      0,
    );
  }

  get exceedsSource(): boolean {
    return this.totalAllocated > (Number(this.sourceAmount) || 0) + 0.0001;
  }

  onToggle(checked: boolean) {
    this.multiBranch = checked;
    this.multiBranchToggled.emit(checked);
  }

  addSelectedBranch() {
    if (this.isPosted) return;
    const sid = this.selectedBranchSid;
    if (!sid) {
      this.toastr.warning('Select a branch to add');
      return;
    }
    const branch = (this.companyBranches || []).find((b) => b.BranchMasterSid === sid);
    if (!branch) return;
    if ((this.interBranches.controls || []).some((c) => c.get('BranchMasterSid')!.value === sid)) {
      this.toastr.warning(`Branch '${branch.branchName}' is already added`);
      this.selectedBranchSid = null;
      return;
    }
    this.interBranches.push(
      this.fb.group({
        BranchMasterSid: [sid, Validators.required],
        BranchName: [branch.branchName],
        CurrencyMasterSid: [this.partyCurrency?.CurrencyMasterSid],
        CurrencyCode: [this.partyCurrency?.currencyCode],
        ExchangeRate: [this.headerExRate],
        Amount: [0, [Validators.required, Validators.min(0.001)]],
        LocalAmount: [0],
        MatchedAmount: [{ value: 0, disabled: true }],
        AdvanceAmount: [{ value: 0, disabled: true }],
        InterBranchJV: [''],
        SourceJV: [''],
        SourceJVSid: [null],
      }),
    );
    this.selectedBranchSid = null;
    this.refreshAvailableBranches();
    this.branchAdded.emit(sid);
    this.allocationsChanged.emit();
  }

  removeBranch(i: number) {
    if (this.isPosted) return;
    const sid = this.interBranches.at(i).get('BranchMasterSid')?.value;
    this.interBranches.removeAt(i);
    this.refreshAvailableBranches();
    if (sid) this.branchRemoved.emit(sid);
    this.allocationsChanged.emit();
  }

  onAmountChange(i: number) {
    const row = this.interBranches.at(i);
    const amt = Number(row.get('Amount')?.value) || 0;
    const rate = Number(row.get('ExchangeRate')?.value) || 1;
    row.get('LocalAmount')?.setValue(this.roundTo(amt * rate, this.localDecimals), { emitEvent: false });
    this.allocationsChanged.emit();
  }

  branchName(i: number): string {
    return this.interBranches.at(i).get('BranchName')?.value || '';
  }

  copy(text: string): void {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => this.toastr.success(`Copied ${text}`),
      () => {},
    );
  }

  private roundTo(v: number, decimals: number): number {
    const f = Math.pow(10, decimals ?? 2);
    return Math.round(v * f) / f;
  }
}

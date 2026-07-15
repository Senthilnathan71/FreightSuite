import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormBuilder,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbTooltipModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { VoucherPeriodValidationService } from 'src/app/common/voucher-period-validation.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { ExpandTextDirective } from 'src/app/core/Directives/expand-text.directive';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PdfMakeService } from 'src/app/common/pdf';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { TaxCalculationService } from 'src/app/modules/operation/services/tax-calculation.service';
import { VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import { navigateToVoucherEntry, VoucherType } from 'src/app/common/voucher-route';
import { toNumber } from 'src/app/common/helper';
import { CreditNoteEntryComponent } from 'src/app/modules/operation/credit-note/credit-note-entry/credit-note-entry.component';
import { CreditNoteNonJobService } from '../services/credit-note-non-job.service';

/**
 * Credit Note Non Job (NCN) — reverses a posted Invoice Non Job (NIN).
 *
 * Extends the job {@link CreditNoteEntryComponent} and reuses its entire flow (pull
 * source by number → DrCr-swapped lines → reason → save/post). It only:
 *  - flips `isNonJob` so the SHARED template renders Ledger + Subledger columns
 *    (instead of Charge + Job/House/Dept),
 *  - overrides the persist/fetch SEAMS to hit the NCN backend (never the shared
 *    operationService, which would leak into the job credit note),
 *  - wires the ledger → subledger cascade (mirrors InvoiceNonJobEntryComponent).
 */
@Component({
  selector: 'app-credit-note-non-job-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NumberFormatPipe,
    CustomDatePipe,
    SearchableDropdown,
    NgbDropdownModule,
    DecimalPrecisionDirective,
    FormStateGuardDirective,
    ElementStateGuardDirective,
    ExpandTextDirective,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl:
    '../../operation/credit-note/credit-note-entry/credit-note-entry.component.html',
  styleUrl:
    '../../operation/credit-note/credit-note-entry/credit-note-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService,
  ],
})
export class CreditNoteNonJobEntryComponent extends CreditNoteEntryComponent {
  protected override isNonJob = true;
  override coaList: any[] = [];
  override subledgerListDetail: any[][] = [];
  hssacListForNonJob: any[] = [];

  constructor(
    private ncnRouter: Router,
    route: ActivatedRoute,
    fb: FormBuilder,
    modalService: NgbModal,
    private ncnOperationService: OperationService,
    private ncnAppSettings: AppSettingsService,
    private ncnSpinner: NgxSpinnerService,
    companySettings: CompanySettingsManagerService,
    mps: MenuPermissionService,
    commonService: CommonService,
    masterService: MasterService,
    numberToWords: NumberToWordsService,
    currencyFormatter: CurrencyFormatService,
    currencyConfigService: CurrencyConfigurationService,
    logoService: LogoService,
    voucherPeriodService: VoucherPeriodValidationService,
    datePipe: CustomDatePipe,
    toastr: ToastrService,
    pdfMakeService: PdfMakeService,
    taxCalculationService: TaxCalculationService,
    emailTriggerService: EmailTriggerService,
    voucherActionGuard: VoucherActionGuardService,
    private ncnService: CreditNoteNonJobService,
  ) {
    // 22 args, exact order of CreditNoteEntryComponent's constructor.
    super(
      ncnRouter,
      route,
      fb,
      modalService,
      ncnOperationService,
      ncnAppSettings,
      ncnSpinner,
      companySettings,
      mps,
      commonService,
      masterService,
      numberToWords,
      currencyFormatter,
      currencyConfigService,
      logoService,
      voucherPeriodService,
      datePipe,
      toastr,
      pdfMakeService,
      taxCalculationService,
      emailTriggerService,
      voucherActionGuard,
    );
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadNonJobLedgers();
  }

  // ---------------------------------------------------------------------------
  // Persist / fetch SEAM overrides → route to the NCN backend.
  // ---------------------------------------------------------------------------
  protected override fetchSourceInvoiceByNumber(payload: any): Observable<any> {
    return this.ncnService.fetchSourceInvoice(payload);
  }
  protected override fetchCreditNoteRecord(payload: any): Observable<any> {
    return this.ncnService.getCreditNoteById(payload);
  }
  protected override persistCreateCreditNote(payload: any): Observable<any> {
    return this.ncnService.createCreditNote(this.buildNcnPayload(payload));
  }
  protected override persistUpdateCreditNote(id: number, payload: any): Observable<any> {
    return this.ncnService.updateCreditNoteById(id, this.buildNcnPayload(payload));
  }
  protected override navigateAfterCreate(headerId: number): void {
    navigateToVoucherEntry(this.ncnRouter, VoucherType.NON_JOB_CREDIT_NOTE, headerId, {
      extras: { replaceUrl: true },
    });
  }
  // persistPostVoucher is left as the base (posting is generic by header SID).

  /**
   * Null every job dimension before the payload leaves for the NCN backend, ensure a
   * per-row narration, and coerce money fields with the comma-safe toNumber (masked
   * "20,000.00" via Number() → NaN → null in JSON — see feedback_masked_amount_parse).
   */
  private buildNcnPayload(payload: any): any {
    const headerNarration = payload?.Narration || payload?.Remarks || '';
    return {
      ...payload,
      CustomsDuty: 'N',
      CashOrBank: 'Y',
      MasterJobSid: null,
      HouseJobSid: null,
      DepartmentMasterSid: null,
      BookingHeaderSid: null,
      MBLNo: null,
      HBLNo: null,
      VoucherDetail: (payload?.VoucherDetail || []).map((detail: any) => {
        const rowNarration =
          String(detail?.Narration ?? detail?.ChargeDescription ?? '').trim() || headerNarration;
        return {
          ...detail,
          ChargeMasterSid: null,
          ChargeUOMSid: null,
          NumberOfUnit: 1,
          MasterJobSid: null,
          HouseJobSid: null,
          DepartmentMasterSid: null,
          BookingRatesSid: null,
          CostRevenueChargesSid: null,
          Narration: rowNarration,
          ChargeDescription: rowNarration,
          Amount: toNumber(detail.Amount),
          LocalAmount: toNumber(detail.LocalAmount),
          PartyAmount: toNumber(detail.PartyAmount),
          TaxableAmount: toNumber(detail.TaxableAmount),
        };
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // Ledger → Subledger cascade (mirrors InvoiceNonJobEntryComponent).
  // ---------------------------------------------------------------------------
  override onCOAChange(coa: any, detailIndex: number, resetSubledger: boolean = true): void {
    const ctrl = this.details.at(detailIndex) as FormGroup;
    if (resetSubledger) {
      ctrl.get('LedgerMasterSid')?.setValue(null);
      ctrl.get('LedgerMasterSid')?.disable();
    }
    if (!coa) {
      this.subledgerListDetail[detailIndex] = [];
      return;
    }

    const coaSid = coa.COAMasterSid ?? coa;
    const fullCoa = this.coaList.find((item) => Number(item.COAMasterSid) === Number(coaSid)) || coa;

    if (resetSubledger) {
      const ledgerCurrencyId = fullCoa?.LedgerCurrency;
      if (ledgerCurrencyId) {
        const currency = this.currencyList.find(
          (item: any) => Number(item.CurrencyMasterSid) === Number(ledgerCurrencyId),
        );
        const ledgerCurrencyCode = currency?.currencyCode ?? ctrl.get('CurrencyCode')?.value;
        ctrl.patchValue(
          { CurrencyMasterSid: ledgerCurrencyId, CurrencyCode: ledgerCurrencyCode },
          { emitEvent: false },
        );
        this.patchExchangeRateForDetail(
          ledgerCurrencyCode,
          this.currentCompanyCurrency.code,
          detailIndex,
        );
      }
    }

    if (fullCoa?.SubledgerName === 'Y') {
      ctrl.get('LedgerMasterSid')?.enable();
      this.ncnOperationService
        .getAllSubledgerByCOA({
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          COAMasterSid: coaSid,
        })
        .subscribe({
          next: (resp: any) => {
            this.subledgerListDetail[detailIndex] = resp.status ? resp.data || [] : [];
            if (!resp.status) this.ncnAppSettings.showError('Error fetching subledger for ledger');
          },
          error: () => {
            this.subledgerListDetail[detailIndex] = [];
            ctrl.get('LedgerMasterSid')?.setValue(null);
            ctrl.get('LedgerMasterSid')?.disable();
          },
        });
    } else {
      ctrl.get('LedgerMasterSid')?.disable();
    }
  }

  override onDetailSubledgerChange(subledger: any, detailIndex: number): void {
    if (!subledger) return;
    const ctrl = this.details.at(detailIndex) as FormGroup;
    const currencyId = subledger.CurrencyMasterSid || subledger.currencyMaster?.CurrencyMasterSid;
    if (!currencyId) return;
    const currency = this.currencyList.find(
      (item: any) => Number(item.CurrencyMasterSid) === Number(currencyId),
    );
    if (!currency) return;
    ctrl.patchValue({ CurrencyMasterSid: currencyId, CurrencyCode: currency.currencyCode });
    this.onDetailChange(detailIndex, 'CurrencyCode');
  }

  /**
   * After the pulled source-NIN lines are pushed, populate each row's Subledger
   * dropdown from its saved ledger — resetSubledger=false so the saved
   * LedgerMasterSid isn't wiped (exact InvoiceNonJob pattern).
   */
  protected override afterSourceLinesPatched(_data: any): void {
    this.populateRowSubledgers();
  }

  /** Edit-load: repopulate the Ledger + Subledger dropdowns for every saved row (R4). */
  override patchValues(data: any): void {
    super.patchValues(data);
    // A posted NCN can carry auto-generated (bank/tax/party) rows whose ledger was not in the
    // create-time dropdown set; and headerId is set asynchronously by the base, so the first
    // loadLedgerDropdown may have run without it. If any loaded row's ledger is missing from
    // coaList, re-fetch the NCN ledger dropdown (now with the header sid) so it resolves.
    const loadedDetails = Array.isArray(data?.VoucherDetail) ? data.VoucherDetail : [];
    if (
      loadedDetails.some((d: any) => {
        const sid = Number(d?.COAMasterSid);
        return sid && !this.coaList.some((x: any) => Number(x.COAMasterSid) === sid);
      })
    ) {
      this.loadLedgerDropdown();
    }
    this.populateRowSubledgers();
  }

  private populateRowSubledgers(): void {
    this.details.controls.forEach((control, index) => {
      this.hssacList[index] = this.hssacListForNonJob;
      const group = control as FormGroup;
      const coaSid = group.get('COAMasterSid')?.value;
      if (coaSid) {
        const coa =
          this.coaList.find((item) => Number(item.COAMasterSid) === Number(coaSid)) || {
            COAMasterSid: coaSid,
            SubledgerName: 'Y',
          };
        this.onCOAChange(coa, index, false);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Lookups: Output-tax HSSAC list + NCN-scoped ledger dropdown.
  // ---------------------------------------------------------------------------
  private loadNonJobLedgers(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    const countryMasterSid = Number(
      this.currentCompany?.CountryMasterSid ||
        this.currentCompany?.countryMaster?.CountryMasterSid ||
        0,
    );
    const hssacRequest = countryMasterSid
      ? this.ncnOperationService.getHssacByCountry(countryMasterSid)
      : this.ncnOperationService.getAllHssac();

    hssacRequest.subscribe({
      next: (resp: any) => {
        const hssacRows = Array.isArray(resp) ? resp : [];
        this.hssacListForNonJob = hssacRows.filter((item: any) => this.isOutputTaxHssac(item));
        this.details.controls.forEach((_control, index) => {
          this.hssacList[index] = this.hssacListForNonJob;
        });
      },
      error: () => {
        this.hssacListForNonJob = [];
      },
    });

    this.loadLedgerDropdown();
  }

  private loadLedgerDropdown(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    this.ncnOperationService
      .getAllCoaWithLedgerCategory({
        CompanyMasterSid: companyId,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        LedgerCategory: 'Ledger',
        VoucherType: 'NCN',
        ...(this.headerId ? { VoucherHeaderSid: this.headerId } : {}),
      })
      .subscribe({
        next: (resp: any) => {
          this.coaList = Array.isArray(resp?.data) ? resp.data : [];
        },
        error: () => {
          this.coaList = [];
        },
      });
  }

  private isOutputTaxHssac(item: any): boolean {
    const taxText = String(
      item?.TaxType ||
        item?.TaxGroup ||
        item?.TaxGroupName ||
        item?.taxGroup?.TaxGroup ||
        item?.taxGroup?.TaxGroupName ||
        '',
    ).toUpperCase();
    if (!taxText) return true;
    if (/\b(IP|INPUT)\b/.test(taxText)) return false;
    if (/\b(OP|OUTPUT)\b/.test(taxText)) return true;
    return true;
  }

  // The parent hardcodes the JOB routes for Back (onCancel), the "+ Create new" button
  // (navigateToCreate), and the edit-time source-invoice link (navigateToReversalInvoice).
  // Repoint all three (+ goBack) to the non-job screens.
  override onCancel(): void {
    this.ncnRouter.navigate(['/accounts/credit-note-non-job/list']);
  }
  override goBack(): void {
    this.ncnRouter.navigate(['/accounts/credit-note-non-job/list']);
  }
  override navigateToCreate(): void {
    navigateToVoucherEntry(this.ncnRouter, VoucherType.NON_JOB_CREDIT_NOTE);
  }
  override navigateToReversalInvoice(): void {
    const reversalVoucherSid = Number(this.creditNoteForm.get('ReversalVoucher')?.getRawValue() || 0);
    if (!reversalVoucherSid) {
      this.ncnAppSettings.showWarning('Invoice not available');
      return;
    }
    navigateToVoucherEntry(this.ncnRouter, VoucherType.NON_JOB_INVOICE, reversalVoucherSid);
  }
}

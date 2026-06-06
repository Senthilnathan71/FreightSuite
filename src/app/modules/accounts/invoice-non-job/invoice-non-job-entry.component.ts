import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CommonService } from 'src/app/common/common.service';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { PdfFileSaveService } from 'src/app/common/pdf-file-save.service';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { VoucherPeriodValidationService } from 'src/app/common/voucher-period-validation.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { TaxCalculationService } from 'src/app/modules/operation/services/tax-calculation.service';
import { InvoiceEntryComponent } from 'src/app/modules/operation/Invoice/invoice-entry/invoice-entry.component';
import { InvoiceNonJobService } from '../services/invoice-non-job.service';
import { VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import { toNumber } from 'src/app/common/helper';

@Component({
  selector: 'app-invoice-non-job-entry',
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
    PreventMultiClickDirective,
    DecimalPrecisionDirective,
    ElementStateGuardDirective,
    FormStateGuardDirective,
    RouterModule,
  ],
  templateUrl: './invoice-non-job-entry.component.html',
  styleUrl: '../../operation/Invoice/invoice-entry/invoice-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService,
  ],
})
export class InvoiceNonJobEntryComponent extends InvoiceEntryComponent {
  coaList: any[] = [];
  subledgerListDetail: any[][] = [];
  hssacListForNonJob: any[] = [];
  private payloadWrapperInstalled = false;
  private navigationInterceptorInstalled = false;

  constructor(
    private nonJobRouter: Router,
    route: ActivatedRoute,
    private nonJobFb: FormBuilder,
    modalService: NgbModal,
    private nonJobInvoiceService: InvoiceNonJobService,
    private nonJobOperationService: OperationService,
    masterService: MasterService,
    private nonJobAppSettings: AppSettingsService,
    spinner: NgxSpinnerService,
    companySettings: CompanySettingsManagerService,
    mps: MenuPermissionService,
    commonService: CommonService,
    taxCalculationService: TaxCalculationService,
    currencyConfigService: CurrencyConfigurationService,
    currencyFormatter: CurrencyFormatService,
    pdfService: PdfDownloadService,
    pdfMakeService: PdfMakeService,
    toastr: ToastrService,
    logoService: LogoService,
    numberToWords: NumberToWordsService,
    voucherPeriodService: VoucherPeriodValidationService,
    pdfFileSaveService: PdfFileSaveService,
    emailTriggerService: EmailTriggerService,
    voucherActionGuard: VoucherActionGuardService,
  ) {
    super(
      nonJobRouter,
      route,
      nonJobFb,
      modalService,
      nonJobInvoiceService,
      nonJobOperationService,
      masterService,
      nonJobAppSettings,
      spinner,
      companySettings,
      mps,
      commonService,
      taxCalculationService,
      currencyConfigService,
      currencyFormatter,
      pdfService,
      pdfMakeService,
      toastr,
      logoService,
      numberToWords,
      voucherPeriodService,
      pdfFileSaveService,
      emailTriggerService,
      voucherActionGuard,
    );
  }

  override initForm(): void {
    super.initForm();
    this.invoiceForm.addControl('BillNo', this.nonJobFb.control(''));
    this.invoiceForm.addControl('BillDate', this.nonJobFb.control(null));
    this.invoiceForm.addControl('BillAmt', this.nonJobFb.control(0));
    this.invoiceForm.patchValue({
      Narration: '',
      Remarks: '',
      CustomsDuty: 'N',
    }, { emitEvent: false });
  }

  override ngOnInit(): void {
    this.installNonJobPayloadWrapper();
    this.installNonJobNavigationInterceptor();
    super.ngOnInit();
    this.loadNonJobLedgers();
  }

  override createDetailGroup(data?: any): FormGroup {
    const group = super.createDetailGroup(data);
    group.get('ChargeMasterSid')?.clearValidators();
    group.get('ChargeMasterSid')?.updateValueAndValidity({ emitEvent: false });
    group.get('ChargeDescription')?.clearValidators();
    group.get('ChargeDescription')?.updateValueAndValidity({ emitEvent: false });
    group.get('ChargeUOMSid')?.clearValidators();
    group.get('ChargeUOMSid')?.updateValueAndValidity({ emitEvent: false });
    group.get('NumberOfUnit')?.setValue(data?.NumberOfUnit || 1, { emitEvent: false });
    group.get('NumberOfUnit')?.clearValidators();
    group.get('NumberOfUnit')?.updateValueAndValidity({ emitEvent: false });
    group.get('COAMasterSid')?.setValidators(Validators.required);
    group.get('COAMasterSid')?.updateValueAndValidity({ emitEvent: false });
    return group;
  }

  override addDetailRow(): void {
    if (this.isReadOnly || this.isPosted) return;
    const missingErrors: string[] = [];
    if (!this.invoiceForm.get('CustomerBranchSid')?.value) {
      missingErrors.push('Please select Customer Address.');
      this.invoiceForm.get('CustomerBranchSid')?.markAsTouched();
    }
    if (!this.invoiceForm.get('CurrencyCode')?.value) {
      missingErrors.push('Please select Currency.');
      this.invoiceForm.get('CurrencyCode')?.markAsTouched();
    }
    if (missingErrors.length) {
      this.nonJobAppSettings.showWarning(missingErrors.join('\n'));
      return;
    }
    this.details.push(this.createDetailGroup());
    this.hssacList[this.details.length - 1] = this.hssacListForNonJob;
    this.onDetailChange(this.details.length - 1, 'CurrencyCode');
    this.invoiceForm.updateValueAndValidity();
  }

  onCOAChange(coa: any, detailIndex: number, resetSubledger: boolean = true): void {
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
        const currency = this.currencyList.find((item: any) => Number(item.CurrencyMasterSid) === Number(ledgerCurrencyId));
        ctrl.patchValue({
          CurrencyMasterSid: ledgerCurrencyId,
          CurrencyCode: currency?.currencyCode ?? ctrl.get('CurrencyCode')?.value,
        }, { emitEvent: false });
      }
    }

    if (fullCoa?.SubledgerName === 'Y') {
      ctrl.get('LedgerMasterSid')?.enable();
      this.nonJobOperationService.getAllSubledgerByCOA({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        COAMasterSid: coaSid,
      }).subscribe({
        next: (resp: any) => {
          this.subledgerListDetail[detailIndex] = resp.status ? (resp.data || []) : [];
          if (!resp.status) this.nonJobAppSettings.showError('Error fetching subledger for ledger');
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

  onDetailSubledgerChange(subledger: any, detailIndex: number): void {
    if (!subledger) return;
    const ctrl = this.details.at(detailIndex) as FormGroup;
    const currencyId = subledger.CurrencyMasterSid || subledger.currencyMaster?.CurrencyMasterSid;
    if (!currencyId) return;
    const currency = this.currencyList.find((item: any) => Number(item.CurrencyMasterSid) === Number(currencyId));
    if (!currency) return;
    ctrl.patchValue({
      CurrencyMasterSid: currencyId,
      CurrencyCode: currency.currencyCode,
    });
    this.onDetailChange(detailIndex, 'CurrencyCode');
  }

  override onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean): void {
    const narration = this.invoiceForm.get('Narration')?.value || '';
    this.invoiceForm.get('Remarks')?.setValue(narration, { emitEvent: false });
    this.invoiceForm.get('DocumentNumber')?.setValue(this.invoiceForm.get('BillNo')?.value || '', { emitEvent: false });
    this.details.controls.forEach((control) => {
      const group = control as FormGroup;
      if (!group.get('ChargeDescription')?.value) {
        group.get('ChargeDescription')?.setValue(narration, { emitEvent: false });
      }
      group.patchValue({
        MasterJobSid: null,
        HouseJobSid: null,
        DepartmentMasterSid: null,
        ChargeMasterSid: null,
        ChargeUOMSid: null,
        NumberOfUnit: 1,
      }, { emitEvent: false });
    });
    super.onSubmit(resolve, isPostingTrue);
  }

  override patchValues(data: any): void {
    super.patchValues(data);
    this.invoiceForm.patchValue({
      BillNo: data?.BillNo || data?.DocumentNumber || '',
      BillDate: data?.BillDate || data?.DocumentDate ? new Date(data?.BillDate || data?.DocumentDate) : null,
      DocumentNumber: data?.BillNo || data?.DocumentNumber || '',
      Narration: data?.Narration || data?.Remarks || '',
      Remarks: data?.Narration || data?.Remarks || '',
      CustomsDuty: 'N',
    }, { emitEvent: false });

    this.details.controls.forEach((control, index) => {
      this.hssacList[index] = this.hssacListForNonJob;
      const coaSid = (control as FormGroup).get('COAMasterSid')?.value;
      if (coaSid) {
        const coa = this.coaList.find((item) => Number(item.COAMasterSid) === Number(coaSid)) || { COAMasterSid: coaSid, SubledgerName: 'Y' };
        this.onCOAChange(coa, index, false);
      }
    });
    this.updateBillAmount();
  }

  override goBack(): void {
    this.routerNavigateToList();
  }

  override onReset(): void {
    super.onReset();
    this.invoiceForm.get('CustomsDuty')?.setValue('N', { emitEvent: false });
  }

  private loadNonJobLedgers(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    this.nonJobOperationService.getAllHssac().subscribe({
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
    this.nonJobOperationService.getAllCoaWithLedgerCategory({
      CompanyMasterSid: companyId,
      LedgerCategory: 'Ledger',
    }).subscribe({
      next: (resp: any) => {
        this.coaList = Array.isArray(resp?.data) ? resp.data : [];
      },
      error: () => {
        this.coaList = [];
      },
    });
  }

  private routerNavigateToList(): void {
    this.nonJobRouter.navigate(['/accounts/invoice-non-job/list']);
  }

  private installNonJobPayloadWrapper(): void {
    if (this.payloadWrapperInstalled) return;
    this.payloadWrapperInstalled = true;

    const originalCreate = this.nonJobInvoiceService.createInvoice.bind(this.nonJobInvoiceService);
    const originalUpdate = this.nonJobInvoiceService.updateInvoiceById.bind(this.nonJobInvoiceService);

    this.nonJobInvoiceService.createInvoice = (payload: any) => originalCreate(this.buildNonJobPayload(payload));
    this.nonJobInvoiceService.updateInvoiceById = (voucherHeaderSid: number, payload: any) =>
      originalUpdate(voucherHeaderSid, this.buildNonJobPayload(payload));
  }

  private buildNonJobPayload(payload: any): any {
    const billNo = this.invoiceForm.get('BillNo')?.value || payload?.BillNo || payload?.DocumentNumber || '';
    const billDate = this.invoiceForm.get('BillDate')?.value || payload?.BillDate || payload?.DocumentDate || null;

    return {
      ...payload,
      BillNo: billNo,
      BillDate: billDate,
      DocumentNumber: billNo,
      DocumentDate: billDate,
      TaxType: payload?.TaxType || this.invoiceForm.get('TaxType')?.value || (this.currentCompanyCountryCode === 'in' ? 'GST' : 'VAT'),
      CustomsDuty: 'N',
      MasterJobSid: null,
      HouseJobSid: null,
      DepartmentMasterSid: null,
      VoucherDetail: (payload?.VoucherDetail || []).map((detail: any) => ({
        ...detail,
        ChargeMasterSid: null,
        ChargeUOMSid: null,
        NumberOfUnit: 1,
        MasterJobSid: null,
        HouseJobSid: null,
        DepartmentMasterSid: null,
      })),
    };
  }

  private installNonJobNavigationInterceptor(): void {
    if (this.navigationInterceptorInstalled) return;
    this.navigationInterceptorInstalled = true;

    const originalNavigate = this.nonJobRouter.navigate.bind(this.nonJobRouter);
    this.nonJobRouter.navigate = ((commands: any[], extras?: any) => {
      if (Array.isArray(commands) && commands[0] === 'operation/invoice/entry' && commands[1]) {
        return originalNavigate(['/accounts/invoice-non-job/entry', commands[1]], extras);
      }
      return originalNavigate(commands, extras);
    }) as Router['navigate'];
  }

  override updateBillAmount(): void {
    const totalLocalAmount = this.details.controls.reduce((sum: number, row: any) => {
      const localAmount = toNumber(row.get('LocalAmount')?.value);
      return row.get('DrCr')?.value === 'D' ? sum - localAmount : sum + localAmount;
    }, 0);

    this.invoiceForm.get('BillAmt')?.setValue(this.round(totalLocalAmount), { emitEvent: false });
  }

  private isOutputTaxHssac(item: any): boolean {
    const taxText = String(
      item?.TaxType ||
      item?.TaxGroup ||
      item?.TaxGroupName ||
      item?.taxGroup?.TaxGroup ||
      item?.taxGroup?.TaxGroupName ||
      ''
    ).toUpperCase();

    if (!taxText) return true;
    if (/\b(IP|INPUT)\b/.test(taxText)) return false;
    if (/\b(OP|OUTPUT)\b/.test(taxText)) return true;
    return true;
  }

  override getTotalTaxAmount(): string {
    return this.getFormattedAmount(
      this.details.getRawValue().reduce((sum: number, row: any) => sum + toNumber(row.TaxAmount1) + toNumber(row.TaxAmount2), 0),
      this.currentCompany?.CurrencyMasterSid
    );
  }
}

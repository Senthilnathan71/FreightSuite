import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfMakeService } from 'src/app/common/pdf';
import { PdfFileSaveService } from 'src/app/common/pdf-file-save.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';

@Component({
  selector: 'app-payment-print',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './payment-print.component.html',
  styles: ``
})
export class PaymentPrintComponent implements OnChanges {


  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currency:any[] = [];
  @Input() paymentDataPrint: any;
  @Input() masterJobContainers: any[];
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
    receiptAllowToPrintBeforePosting: boolean = false;
  @Input() containerTypeList: any;
  @Input() coaList : any[] = [];
  @Input() ledgerList : any[] = [];
  @Input() currentMenuId: number | null = null;
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  headerSubledgerAddress = '';
  
    constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private pdfMakeService: PdfMakeService,
    private pdfFileSaveService: PdfFileSaveService,
    private spinner: NgxSpinnerService,
    private numberToWords: NumberToWordsService,
    private companySettings: CompanySettingsManagerService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
     private cdr: ChangeDetectorRef,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
  ) { }
  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.loadCurrencyList();
    this.numberToWords.initializeCurrencies(this.currencyList);
    this.currencyConfigService.initializeConfigurations(this.currencyList || []);
    this.loadHeaderSubledgerAddress();
     this.loadReceiptPrintBeforePostingConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['paymentDataPrint'] || changes['ledgerList']) {
      this.loadHeaderSubledgerAddress();
    }

    if (changes['currencyList'] && changes['currencyList'].currentValue) {
      this.currencyList = changes['currencyList'].currentValue;
      this.numberToWords.initializeCurrencies(this.currencyList);
      this.currencyConfigService.initializeConfigurations(this.currencyList || []);
    }
  }

   private loadReceiptPrintBeforePostingConfig(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.receiptAllowToPrintBeforePosting = false;
      return;
    }

    this.masterService.getConfigurationValue(companyId, 'ReceiptAllowtoprintbeforePosting').subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        this.receiptAllowToPrintBeforePosting = this.parseConfigBoolean(rawValue, false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.receiptAllowToPrintBeforePosting = false;
        this.cdr.markForCheck();
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

  isDraftPayment(): boolean {
  return this.paymentDataPrint?.PostStatus === 'U' && !this.receiptAllowToPrintBeforePosting;

}
  
    loadCurrencyList(): void {
    this.masterService.getAllCurrencies().subscribe({
      next: (response: any) => {
        this.currency = response|| [];
        this.currencyList = this.currency;
        this.numberToWords.initializeCurrencies(this.currency);
        this.currencyConfigService.initializeConfigurations(this.currency);
        console.log('Currency List:', this.currency);
      },
      error: (error) => {
        console.error('Failed to load currencies:', error);
      }
    });
  }

    loadCityName(): void {
    if (!this.currentBranchCityId) return;

 

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {
        console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          console.log("Final City Name:", this.currentBranchCityName);
        }

        
      },
      error: (error) => {
        console.error("Failed to load city:", error);
  
      }
    });
  }

  getLedgerName(COAMasterSid: number): string {
  if (!COAMasterSid || this.coaList.length===0) return '';
  const ledger = this.coaList.find(
    v => v.COAMasterSid === COAMasterSid
  );

  return ledger?.LedgerName || '';
}

getSubledgerName(item: any): string {
  const directName = item?.SubledgerName || item?.subledgerMaster?.SubledgerName || item?.SubledgerMaster?.SubledgerName;
  if (directName) return directName;

  const index = (this.paymentDataPrint?.VoucherDetail || []).findIndex(vd => vd.VoucherDetailSid === item.VoucherDetailSid);

  if (!item?.LedgerMasterSid) return '';

  const indexedLedgers = index > -1 && Array.isArray(this.ledgerList[index]) ? this.ledgerList[index] : [];
  const allLedgers = Array.isArray(this.ledgerList)
    ? this.ledgerList.flatMap((ledger: any) => Array.isArray(ledger) ? ledger : [ledger])
    : [];

  const ledger = [...indexedLedgers, ...allLedgers].find(
    v => Number(v?.SubledgerMasterSid) === Number(item.LedgerMasterSid)
  );

  return ledger?.SubledgerName || ledger?.LedgerName || ledger?.CustomerName || '';
}

private getSubledgerRecord(item: any): any {
  if (!item?.LedgerMasterSid) return null;

  const index = (this.paymentDataPrint?.VoucherDetail || []).findIndex(vd => vd.VoucherDetailSid === item.VoucherDetailSid);
  const indexedLedgers = index > -1 && Array.isArray(this.ledgerList[index]) ? this.ledgerList[index] : [];
  const allLedgers = Array.isArray(this.ledgerList)
    ? this.ledgerList.flatMap((ledger: any) => Array.isArray(ledger) ? ledger : [ledger])
    : [];

  return [...indexedLedgers, ...allLedgers].find(
    v => Number(v?.SubledgerMasterSid) === Number(item.LedgerMasterSid)
  ) || null;
}

private getSubledgerOrganizationId(item: any): number | null {
  const subledger = this.getSubledgerRecord(item);
  const id = Number(
    subledger?.SubledgerMappingSid ||
    subledger?.CustomerMasterSid ||
    subledger?.customerMaster?.CustomerMasterSid ||
    item?.SubledgerMappingSid ||
    item?.CustomerMasterSid ||
    item?.customerMaster?.CustomerMasterSid
  );

  return Number.isFinite(id) && id > 0 ? id : null;
}

private formatOrganizationAddress(organization: any): string {
  const branch = organization?.CustomerBranch?.[0];
  return String(branch?.Address || '').trim();
}

private getHeaderDetailRow(): any {
  return this.getDrDetails()?.[0];
}

loadHeaderSubledgerAddress(): void {
  this.headerSubledgerAddress = '';
  const detailRow = this.getHeaderDetailRow();
  if (!detailRow) return;

  const subledger = this.getSubledgerRecord(detailRow);
  const directAddress = subledger?.Address || subledger?.BranchAddress || detailRow?.BranchAddress || detailRow?.Address;
  if (directAddress) {
    this.headerSubledgerAddress = String(directAddress);
    return;
  }

  const organizationId = this.getSubledgerOrganizationId(detailRow);
  if (!organizationId) {
    this.loadHeaderSubledgerAddressByName(detailRow);
    return;
  }
 const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  this.masterService.getCustomerById({CustomerMasterSid:organizationId,CompanyMasterSid: CompanyMasterSid}).subscribe({
    next: (organization: any) => {
      this.headerSubledgerAddress = this.formatOrganizationAddress(organization);
      if (!this.headerSubledgerAddress) {
        this.loadHeaderSubledgerAddressByName(detailRow);
      }
    },
    error: (error) => {
      console.error('Failed to load subledger address:', error);
      this.loadHeaderSubledgerAddressByName(detailRow);
    }
  });
}

private loadHeaderSubledgerAddressByName(detailRow: any): void {
  const companyId = Number(this.currentCompany?.CompanyMasterSid || this.paymentDataPrint?.CompanyMasterSid);
  const partyName = String(this.getSubledgerName(detailRow) || this.getPaidToDisplay() || '').trim().toLowerCase();

  if (!companyId || !partyName) return;

  this.masterService.getAllCustomersWithCustomerBranch(companyId).subscribe({
    next: (organizations: any[]) => {
      const organization = (organizations || []).find((item: any) =>
        String(item?.CustomerName || '').trim().toLowerCase() === partyName
      );
      this.headerSubledgerAddress = this.formatOrganizationAddress(organization);
    },
    error: (error) => {
      console.error('Failed to load organization address by name:', error);
    }
  });
}
getDisplayLedgerName(item: any): string {
  const subLedger = this.getSubledgerName(item);
  const ledger = this.getLedgerName(item?.COAMasterSid);

  return subLedger ? subLedger : ledger;
}

private getRealPaidToValue(): string {
  const paidTo = this.paymentDataPrint?.PartyName || this.paymentDataPrint?.BankPartyName || '';
  const value = String(paidTo).trim();
  return value && !['NA', 'N/A', '-', 'NULL'].includes(value.toUpperCase()) ? value : '';
}

getPaidToDisplay(): string {
  const paidTo = this.getRealPaidToValue();
  if (paidTo) return paidTo;

  const detailRow = this.getDrDetails()?.[0];
  return detailRow ? this.getDisplayLedgerName(detailRow) : '';
}

getHeaderSubledgerDisplay(): string {
  const detailRow = this.getHeaderDetailRow();
  return detailRow ? this.getSubledgerName(detailRow) : '';
}

getHeaderAddressDisplay(): string {
  const partyAddress = String(this.paymentDataPrint?.PartyAddress || '').trim();
  return partyAddress || this.headerSubledgerAddress;
}

getDrDetails() {
  return this.paymentDataPrint?.VoucherDetail?.filter(
    (item: any) =>
      item?.DrCr === 'D' &&
      item?.IsAutoGenerated !== 'Y' &&
      parseFloat(item?.LocalAmount || 0) !== 0
  );
}

getTotalAmt() {
  return this.paymentDataPrint?.VoucherDetail
    ?.filter((item: any) => item?.DrCr === 'D' && item?.IsAutoGenerated !== 'Y')
    ?.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item?.PartyAmount) || 0);
    }, 0);
}

formatCurrencyAmount(value: any, currencyCode?: string): string {
  return this.currencyFormatService.formatMaskedAmount({
    value: Number(value) || 0,
    currencyCode: currencyCode || this.paymentDataPrint?.CurrencyCode || ''
  });
}

formatPaymentCurrencyAmount(value: any): string {
  return this.formatCurrencyAmount(value, this.paymentDataPrint?.CurrencyCode);
}

  modalClose() {
    this.activeModal.close()
  }

 getTotalMatchingAmount(): number {
  if (!this.paymentDataPrint?.voucherMatchings) return 0;

  return this.paymentDataPrint.voucherMatchings.reduce((sum: number, voucher: any) => {
    return sum + (parseFloat(voucher?.MatchingAmount) || 0);
  }, 0);
}

getTotalMatchingLocalAmount(): number {
  if (!this.paymentDataPrint?.voucherMatchings) return 0;

  return this.paymentDataPrint.voucherMatchings.reduce((sum: number, voucher: any) => {
    return sum + (parseFloat(voucher?.MatchingLocalAmount) || 0);
  }, 0);
}

// getAmountInWords(): string {
//   const total = this.getTotalMatchingLocalAmount();
//   if (total == null) return '';

//   const currencySid = this.currentCompany?.CurrencyMasterSid;
//   if (!currencySid) return '';

//   // 🔥 MAIN AMOUNT
//   let mainWords = this.numberToWords.convert(
//     toNumber(total),
//     currencySid
//   );

  

//   return mainWords;
// }

      
           
 getAmountInWords(): string {
  const total = this.getTotalAmt();
  if (!total) return '';

  const voucherCurrencySid = Number(this.paymentDataPrint?.CurrencyMasterSid);
  const currencySid = Number.isFinite(voucherCurrencySid) && voucherCurrencySid > 0
    ? voucherCurrencySid
    : this.currency.find(
        c => c?.currencyCode === this.paymentDataPrint?.CurrencyCode || c?.CurrencyCode === this.paymentDataPrint?.CurrencyCode
      )?.CurrencyMasterSid;

  return this.numberToWords.convert(total, currencySid);
}


        
printDiv(divId: string): void {
  this.showPrintLogo = true;
  this.showPdfLogo = false;

  setTimeout(() => {
    const printContents = document.getElementById(divId)?.innerHTML;
    if (!printContents) return;

    const popupWin = window.open('', '_blank', 'width=900,height=600');
    if (popupWin) {
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>Print</title>
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);
      popupWin.document.close();
    }
  }, 50); // small timeout so Angular updates DOM
}





  async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;
    this.spinner.show();
    try {
      const companyMasterSid = Number(this.currentCompany?.CompanyMasterSid || 0);
      const saveAsFilePath = await this.pdfFileSaveService.shouldDownloadByFilePath(companyMasterSid);
      if (saveAsFilePath) {
        await this.downloadPDFByFilePath();
      } else {
        await this.downloadPDFInBrowser();
      }
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'VoucherHeader',
        recordId: String(this.paymentDataPrint?.VoucherHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Download'
        },
        newVal: {
          PDF: 'Cash Payment PDF Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        return;
      }
      console.error('Error generating PDF:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  private getPdfGenerationOptions(): {
    paymentType: 'cash';
    coaList: any[];
    ledgerList: any[];
    amountInWords: string;
    currencyList: any[];
    allowPrintBeforePosting: boolean;
    headerSubledgerAddress: string;
    printSettings: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  } {
    return {
      paymentType: 'cash',
      coaList: this.coaList || [],
      ledgerList: this.ledgerList || [],
      amountInWords: String(this.getAmountInWords() || this.paymentDataPrint?.AmountInWords || this.paymentDataPrint?.amountInWords || ''),
      currencyList: this.currencyList || [],
      allowPrintBeforePosting: this.receiptAllowToPrintBeforePosting,
      headerSubledgerAddress: this.headerSubledgerAddress,
      printSettings: this.companySettings.getPrintSettings()
    };
  }

  private async downloadPDFInBrowser(): Promise<void> {
    const logo = this.pdfMakeService.getReportLogo();
    this.pdfMakeService.generatePaymentFromApi(
      this.paymentDataPrint,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      this.getPdfGenerationOptions()
    );
  }

  private async downloadPDFByFilePath(): Promise<void> {
    const logo = this.pdfMakeService.getReportLogo();
    const blob = await this.pdfMakeService.generatePaymentBlobFromApi(
      this.paymentDataPrint,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      this.getPdfGenerationOptions()
    );
    await this.pdfFileSaveService.savePdf(blob, this.getPaymentPdfFilename(), true);
  }

  private getPaymentPdfFilename(): string {
    const voucherNo = this.paymentDataPrint?.VoucherNo || this.paymentDataPrint?.VoucherNumber || 'Payment';
    return `Payment_${voucherNo}.pdf`;
  }


  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();
      const blob = await this.pdfMakeService.generatePaymentBlobFromApi(
        this.paymentDataPrint,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getPdfGenerationOptions()
      );
      return blob;
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
  }

  async openEmailModal(): Promise<void> {
    try {
      const blob = await this.generatePDFBlob();
      if (!blob) {
        this.appSettingService.showError('Error generating PDF. Please try again.');
        return;
      }

      const documentName = 'Cash Payment';
      const documentNo = this.paymentDataPrint?.VoucherNo || this.paymentDataPrint?.VoucherNumber || '';
      const documentDate = this.formatEmailDate(this.paymentDataPrint?.VoucherDate);
      const emailRecipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });

      // When there is no Mail Configuration / organization email for this menu,
      // still open the popup so the user can fill To/CC/Subject/Body manually
      // (recipients pre-fill from the organization email tab when available).
      const attachmentRequired = await this.emailTriggerService.isAttachmentRequiredForMenu(
        this.appSettingService.getCurrentCompanyInfo()?.CompanyMasterSid,
        this.getCurrentMenuMasterSidForEmail()
      );

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Payment No.',
        documentNo,
        documentDate,
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], this.getPaymentPdfFilename(), { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: emailRecipients.toEmail,
        EmailCC: emailRecipients.ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Payment No',
          menuName: documentName,
          documentNo,
          date: documentDate
        },
        attachmentRequired,
        // Print "Send Mail" always carries the generated PDF, even when the
        // menu's Mail Configuration has AttachmentRequire = No.
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Payment email error:', error);
      this.appSettingService.showError('Error preparing email');
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'VoucherHeader',
      recordId: String(this.paymentDataPrint?.VoucherHeaderSid),
      operation: 'EMAIL',
      changedBy: this.appSettingService.userSettingSource.value['userEmail'],
      changes: {
        action: 'Send Mail'
      },
      newVal: {
        Email: `${documentName} Mail Send`
      }
    };

    this.operationService.createAuditLog(payload).subscribe({
      next: () => { },
      error: (err) => console.error(err)
    });
  }

  private getCustomerBranchSidForEmail(): number | null {
    const candidates = [
      this.paymentDataPrint?.CustomerBranchSid,
      this.paymentDataPrint?.customerBranch?.CustomerBranchSid,
      this.paymentDataPrint?.CustomerBranch?.CustomerBranchSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCustomerMasterSidForEmail(): number | null {
    const candidates = [
      this.paymentDataPrint?.CustomerMasterSid,
      this.paymentDataPrint?.customerMaster?.CustomerMasterSid,
      this.paymentDataPrint?.CustomerMaster?.CustomerMasterSid,
      this.paymentDataPrint?.customerBranch?.CustomerMasterSid,
      this.paymentDataPrint?.CustomerBranch?.CustomerMasterSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.currentMenuId ||
      this.paymentDataPrint?.voucherTypeMaster?.MenuMasterSid ||
      this.paymentDataPrint?.MenuMasterSid
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
  }

}

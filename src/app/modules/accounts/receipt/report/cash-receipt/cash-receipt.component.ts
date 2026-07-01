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
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';

@Component({
  selector: 'app-cash-receipt',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './cash-receipt.component.html',
  styles: ``,
})
export class CashReceiptComponent implements OnChanges {
  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();
  currentUserCountry: string;
  currentUserCountryCode: string;
  currentBranchCityName: string | null;
  branchDetails: any;
  currentBranchCityId: number;
  currency: any[] = [];
  
  @Input() receiptPrintData: any;
  @Input() masterJobContainers: any[];
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  receiptAllowToPrintBeforePosting: boolean = false;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() bankTypedLedgers: any;
  @Input() coaList : any[] = [];
  @Input() ledgerList: any[] = [];
  @Input() currentMenuId: number | null = null;
    
 showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
     this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
    this.currentUserCountryCode = this.currentCompany?.countryMaster?.countryCode || 'IN';
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.loadReceiptPrintBeforePostingConfig();
    this.loadCityName()
    this.loadCurrencyList()
    this.numberToWords.initializeCurrencies(this.currencyList);
    this.currencyConfigService.initializeConfigurations(this.currencyList || []);
    // console.log("Current Country Code", this.currentUserCountryCode);
    // console.log("Current Country", this.currentUserCountry);
    // console.log("CURRENT COMPANY", this.currentCompany);
    // console.log("CURRENT BRANCH", this.currentBranch);
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

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private pdfMakeService: PdfMakeService,
    private pdfFileSaveService: PdfFileSaveService,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currencyList'] && changes['currencyList'].currentValue) {
      this.currencyList = changes['currencyList'].currentValue;
      this.numberToWords.initializeCurrencies(this.currencyList);
      this.currencyConfigService.initializeConfigurations(this.currencyList || []);
    }
  }

  getBankName(COAMasterSid: number) {
    const bank = this.bankTypedLedgers.find(
      (b) => b.COAMasterSid == COAMasterSid
    );
    // console.log(bank, 'BANK');
    return bank ? bank.LedgerName : '';
  }

  getTotalMatchingAmount(): number {
    if (!this.receiptPrintData?.voucherMatchings) return 0;

    return this.receiptPrintData.voucherMatchings.reduce(
      (sum: number, voucher: any) => {
        return sum + (parseFloat(voucher?.MatchingAmount) || 0);
      },
      0
    );
  }

  getTotalMatchingLocalAmount(): number {
    if (!this.receiptPrintData?.voucherMatchings) return 0;

    return this.receiptPrintData.voucherMatchings.reduce(
      (sum: number, voucher: any) => {
        return sum + (parseFloat(voucher?.MatchingLocalAmount) || 0);
      },
      0
    );
  }

  // Get GST No or PAN based on country code
  getTaxNumber(): string {
    if (!this.receiptPrintData) return '';

    // For India - show GST No
    if (this.currentUserCountryCode === 'IN') {
      return this.receiptPrintData.GST_VAT || '';
    }
    // For UAE - show PAN
    else if (this.currentUserCountryCode === 'AE') {
      return this.receiptPrintData.GST_VAT || ''; // Assuming GST_VAT field contains PAN for UAE
    }
    // For other countries, show empty or the available value
    return this.receiptPrintData.GST_VAT || '';
  }

  // Get the label for tax number based on country
  getTaxNumberLabel(): string {
    if (this.currentUserCountryCode === 'IN') {
      return 'GST No.';
    } else if (this.currentUserCountryCode === 'AE') {
      return 'PAN';
    }
    return 'Tax No.';
  }


getTotalAmt() {
  return this.receiptPrintData?.VoucherDetail
    ?.filter((item: any) => item?.DrCr === 'D' && item?.IsAutoGenerated !== 'Y')
    ?.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item?.PartyAmount) || 0);
    }, 0);
}

formatCurrencyAmount(value: any, currencyCode?: string): string {
  return this.currencyFormatService.formatMaskedAmount({
    value: Number(value) || 0,
    currencyCode: currencyCode || this.receiptPrintData?.CurrencyCode || ''
  });
}

formatReceiptCurrencyAmount(value: any): string {
  return this.formatCurrencyAmount(value, this.receiptPrintData?.CurrencyCode);
}


getAmountInWords(): string {
  const total = this.getTotalAmt();
  if (!total) return '';

  const currencySid = this.receiptPrintData?.CurrencyMasterSid; this.receiptPrintData?.CurrencyMasterSid;
  return this.numberToWords.convert(total, currencySid);
}

isDraftReceipt(): boolean {
  return this.receiptPrintData?.PostStatus === 'U' && !this.receiptAllowToPrintBeforePosting;
}
  

getDrDetails() {
  return this.receiptPrintData?.VoucherDetail?.filter(
    (item: any) =>
      item?.DrCr === 'D' &&
      item?.IsAutoGenerated !== 'Y' &&
      parseFloat(item?.LocalAmount || 0) !== 0
  );
}


  getLedgerName(COAMasterSid: number): string {
  if (!COAMasterSid || this.coaList.length===0) return '';
  const ledger = this.coaList.find(
    v => v.COAMasterSid === COAMasterSid
  );

  return ledger?.LedgerName || '';
}

  getSubledgerName(ledgerMasterSid: number): string {
    if (!ledgerMasterSid || !Array.isArray(this.ledgerList) || this.ledgerList.length === 0) {
      return '';
    }

    const subledger = this.ledgerList.find(
      (ledger) => Number(ledger?.LedgerMasterSid) === Number(ledgerMasterSid)
    );

    return subledger?.LedgerName || subledger?.SubledgerName || subledger?.CustomerName || '';
  }

  getPrintLedgerDisplay(item: any): string {
    if (!item) return '';

    if (item?.LedgerMasterSid) {
      return this.getSubledgerName(item.LedgerMasterSid) || this.getLedgerName(item?.COAMasterSid);
    }

    return this.getLedgerName(item?.COAMasterSid);
  }

  getHeaderSubledgerOrLedgerDisplay(): string {
    const detailRow = this.receiptPrintData?.VoucherDetail?.find(
      (item: any) => item?.IsAutoGenerated !== 'Y'
    );

    if (detailRow?.LedgerMasterSid) {
      const subledgerName = this.getSubledgerName(detailRow.LedgerMasterSid);
      if (subledgerName) {
        return subledgerName;
      }
    }

    if (detailRow?.COAMasterSid) {
      return this.getLedgerName(detailRow.COAMasterSid);
    }

    return this.getLedgerName(this.receiptPrintData?.COAMasterSid);
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

    loadCurrencyList(): void {
    this.masterService.getAllCurrencies().subscribe({
      next: (response: any) => {
        this.currency = response|| [];
        this.numberToWords.initializeCurrencies(this.currency);
        this.currencyConfigService.initializeConfigurations(this.currency);
        // console.log('Currency List:', this.currency);
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
        // console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          // console.log("Final City Name:", this.currentBranchCityName);
        }


      },
      error: (error) => {
        console.error("Failed to load city:", error);

      }
    });
  }


   shouldShowGSTTypeField(): boolean {
    return this.currentUserCountry === 'india';
  }
  // pdf download


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
        recordId: String(this.receiptPrintData?.VoucherHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Download'
        },
        newVal: {
          PDF: 'Cash Receipt PDF Downloaded',
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
    receiptType: 'cash';
    coaList: any[];
    ledgerList: any[];
    bankTypedLedgers: any[];
    amountInWords: string;
    currentUserCountry: string;
    currencyList: any[];
    allowPrintBeforePosting: boolean;
    printSettings: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  } {
    return {
      receiptType: 'cash',
      coaList: this.coaList || [],
      ledgerList: this.ledgerList || [],
      bankTypedLedgers: this.bankTypedLedgers || [],
      amountInWords: String(this.getAmountInWords() || this.receiptPrintData?.AmountInWords || this.receiptPrintData?.amountInWords || ''),
      currentUserCountry: this.currentUserCountry || '',
      currencyList: this.currencyList || [],
      allowPrintBeforePosting: this.receiptAllowToPrintBeforePosting,
      printSettings: this.companySettings.getPrintSettings()
    };
  }

  private async downloadPDFInBrowser(): Promise<void> {
    const logo = this.pdfMakeService.getReportLogo();
    this.pdfMakeService.generateReceiptFromApi(
      this.receiptPrintData,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      this.getPdfGenerationOptions()
    );
  }

  private async downloadPDFByFilePath(): Promise<void> {
    const logo = this.pdfMakeService.getReportLogo();
    const blob = await this.pdfMakeService.generateReceiptBlobFromApi(
      this.receiptPrintData,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      this.getPdfGenerationOptions()
    );
    await this.pdfFileSaveService.savePdf(blob, this.getReceiptPdfFilename(), true);
  }

  private getReceiptPdfFilename(): string {
    const voucherNo = this.receiptPrintData?.VoucherNo || this.receiptPrintData?.VoucherNumber || 'CashReceipt';
    return `CashReceipt_${voucherNo}.pdf`;
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();
      const blob = await this.pdfMakeService.generateReceiptBlobFromApi(
        this.receiptPrintData,
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

      const documentName = 'Cash Receipt';
      const documentNo = this.receiptPrintData?.VoucherNo || this.receiptPrintData?.VoucherNumber || '';
      const documentDate = this.formatEmailDate(this.receiptPrintData?.VoucherDate);
      const emailRecipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });

      if (emailRecipients.toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Receipt No.',
        documentNo,
        documentDate,
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], this.getReceiptPdfFilename(), { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: emailRecipients.toEmail,
        EmailCC: emailRecipients.ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Receipt No',
          menuName: documentName,
          documentNo,
          date: documentDate
        },
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Cash Receipt email error:', error);
      this.appSettingService.showError('Error preparing email');
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'VoucherHeader',
      recordId: String(this.receiptPrintData?.VoucherHeaderSid),
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
      this.receiptPrintData?.CustomerBranchSid,
      this.receiptPrintData?.customerBranch?.CustomerBranchSid,
      this.receiptPrintData?.CustomerBranch?.CustomerBranchSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCustomerMasterSidForEmail(): number | null {
    const candidates = [
      this.receiptPrintData?.CustomerMasterSid,
      this.receiptPrintData?.customerMaster?.CustomerMasterSid,
      this.receiptPrintData?.CustomerMaster?.CustomerMasterSid,
      this.receiptPrintData?.customerBranch?.CustomerMasterSid,
      this.receiptPrintData?.CustomerBranch?.CustomerMasterSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.currentMenuId ||
      this.receiptPrintData?.voucherTypeMaster?.MenuMasterSid ||
      this.receiptPrintData?.MenuMasterSid
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
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



  modalClose() {
    this.activeModal.close();
  }
  
}

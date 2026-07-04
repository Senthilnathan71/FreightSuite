import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import {
  generateJournalVoucherDocument,
  transformJournalVoucherApiData
} from 'src/app/common/pdf/generators/journal-voucher-pdf.generator';
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

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

@Component({
  selector: 'app-journal-voucher-print',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './journal-voucher-print.component.html',
  styles: ``
})
export class JournalVoucherPrintComponent {
 
  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currency:any[] = [];
  @Input() voucherData: any;
  @Input() masterJobContainers: any[];
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() coaList : any[] = [];
  @Input() subledgerList : any[] = [];
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() VoucherDetail: any;
  @Input() currentMenuId: number | null = null;
  currentUserCountry: string;

   ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    // console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.numberToWords.initializeCurrencies(this.currencyList);
    if (!this.currencyList?.length) {
      this.loadCurrencyList();
    }
    this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();

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


     loadCurrencyList(): void {
    this.masterService.getAllCurrencies().subscribe({
      next: (response: any) => {
        this.currency = response|| [];
        this.numberToWords.initializeCurrencies(this.currency);
        // console.log('Currency List:', this.currency);
      },
      error: (error) => {
        console.error('Failed to load currencies:', error);
      }
    });
  }


  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private spinner: NgxSpinnerService,
    private numberToWords: NumberToWordsService,
    private companySettings: CompanySettingsManagerService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currencyList'] && changes['currencyList'].currentValue) {
      this.currencyList = changes['currencyList'].currentValue;
      this.numberToWords.initializeCurrencies(this.currencyList);
    }
  }

  get totalDebit(): number {
  if (!this.voucherData?.VoucherDetail) return 0;

  return this.voucherData.VoucherDetail
    .filter(v => v.DrCr === 'D')
    .reduce((sum, v) => sum + Number(v.LocalAmount || 0), 0);
}

get totalCredit(): number {
  if (!this.voucherData?.VoucherDetail) return 0;

  return this.voucherData.VoucherDetail
    .filter(v => v.DrCr === 'C')
    .reduce((sum, v) => sum + Number(v.LocalAmount || 0), 0);
}

get difference(): number {
  return Math.abs(this.totalDebit - this.totalCredit);
}


getLedgerName(COAMasterSid: number): string {
  if (!COAMasterSid || this.coaList.length===0) return '';

  // console.log(COAMasterSid,"Ledger Id")
  const ledger = this.coaList.find(
    v => v.COAMasterSid === COAMasterSid
  );

  return ledger?.LedgerName || '';
}

getSubledgerName(SubledgerMasterSid : number){
  if(!SubledgerMasterSid || this.subledgerList.length === 0) return '';

  const ourSubledger = this.subledgerList.find(
    sub => sub.SubledgerMasterSid === SubledgerMasterSid
  );

  return ourSubledger?.SubledgerName || "";
}



  modalClose() {
    this.activeModal.close()
  }


  
//  getTotalMatchingAmount(): number {
//   if (!this.receiptPrintData?.voucherMatchings) return 0;

//   return this.receiptPrintData.voucherMatchings.reduce((sum: number, voucher: any) => {
//     return sum + (parseFloat(voucher?.MatchingAmount) || 0);
//   }, 0);
// }

// getTotalMatchingLocalAmount(): number {
//   if (!this.receiptPrintData?.voucherMatchings) return 0;

//   return this.receiptPrintData.voucherMatchings.reduce((sum: number, voucher: any) => {
//     return sum + (parseFloat(voucher?.MatchingLocalAmount) || 0);
//   }, 0);
// }

// getAmountInWords(): string {
//   const total = this.receiptPrintData?.VoucherDetail?.[0]?.Amount;
//   if (!total) return '';

//   const currencySid = this.currentCompany?.CurrencyMasterSid;
//   return this.numberToWords.convert(total, currencySid);
// }
  


  shouldShowGSTTypeField(): boolean {
    return this.currentUserCountry === 'india';
  }

  // getAmountInWords(): string {
  //   const total = this.getTotalOriginalLocalAmount();
  //   if (!total) return '';

  //   const rupees = Math.floor(total);
  //   const paise = Math.round((total - rupees) * 100);

  //   const rupeesInWords = this.numberToWords.convert(rupees);
  //   const paiseInWords = paise > 0 ? this.numberToWords.convert(paise) : '';

  //   // Get currency code safely from first voucher
  //   const selectedCode = this.receiptPrintData?.voucherMatchings?.[0]?.CurrencyCode;
  //   if (!selectedCode) return `${rupeesInWords}${paise > 0 ? ' and ' + paiseInWords : ''} Only`;

  //   // Find currency in the list
  //   const selectedCurrency = this.currency?.find(
  //     (c: any) => String(c.CurrencyCode).trim() === String(selectedCode).trim()
  //   );

  //   const currencyName = selectedCurrency?.CurrencyUnit || 'Rupees';
  //   const subCurrencyName = selectedCurrency?.CurrencySubUnit || 'Paise';

  //   return paise > 0
  //     ? `${rupeesInWords} ${currencyName} and ${paiseInWords} ${subCurrencyName} Only`
  //     : `${rupeesInWords} ${currencyName} Only`;
  // }





    async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;

    setTimeout(async () => {
      this.spinner.show();
      try {
        const logo = localStorage.getItem('current_report_logo') || undefined;
        const pdfData = transformJournalVoucherApiData(
          this.voucherData,
          this.currentCompany,
          this.currentBranch,
          this.userData,
          logo,
          this.getPdfGenerationOptions()
        );
        const docDefinition = generateJournalVoucherDocument(pdfData);
        const filename = `Journal_Voucher_${pdfData.journalVoucher?.voucherNumber || 'Draft'}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
        this.appSettingService.showSuccess('PDF downloaded successfully!');
        const payload = {
        tableName: 'VoucherHeader',
        recordId: String(this.voucherData?.VoucherHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Download'
        },
        newVal: {
          PDF: 'Journal Voucher PDF Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
      } catch (error) {
        console.error('Journal voucher PDF generation failed:', error);
        this.appSettingService.showError('Error generating PDF. Please try again.');
      } finally {
        this.spinner.hide();
      }
    }, 50);
  }

  private getPdfGenerationOptions(): {
    coaList: any[];
    subledgerList: any[];
    amountInWords: string;
    printSettings: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  } {
    return {
      coaList: this.coaList || [],
      subledgerList: this.subledgerList || [],
      amountInWords: String(this.getAmountInWords() || this.voucherData?.AmountInWords || this.voucherData?.amountInWords || ''),
      printSettings: this.companySettings.getPrintSettings()
    };
  }

  getAmountInWords(): string {
    const total = this.totalDebit || this.totalCredit;
    if (!total) return '';

    const voucherCurrencySid = Number(this.voucherData?.CurrencyMasterSid);
    const currencySid = Number.isFinite(voucherCurrencySid) && voucherCurrencySid > 0
      ? voucherCurrencySid
      : this.currency.find(
          c => c?.currencyCode === this.voucherData?.CurrencyCode || c?.CurrencyCode === this.voucherData?.CurrencyCode
        )?.CurrencyMasterSid;

    return this.numberToWords.convert(total, currencySid);
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = localStorage.getItem('current_report_logo') || undefined;
      const pdfData = transformJournalVoucherApiData(
        this.voucherData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getPdfGenerationOptions()
      );
      const docDefinition = generateJournalVoucherDocument(pdfData);
      return await new Promise<Blob>((resolve, reject) => {
        try {
          pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => resolve(blob));
        } catch (error) {
          reject(error);
        }
      });
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

      const documentName = 'Journal Voucher';
      const documentNo = this.voucherData?.VoucherNo || this.voucherData?.VoucherNumber || '';
      const documentDate = this.formatEmailDate(this.voucherData?.VoucherDate);
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
        documentNoLabel: 'Journal Voucher No.',
        documentNo,
        documentDate,
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], this.getJournalVoucherPdfFilename(), { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: emailRecipients.toEmail,
        EmailCC: emailRecipients.ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Journal Voucher No',
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
      console.error('Journal Voucher email error:', error);
      this.appSettingService.showError('Error preparing email');
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'VoucherHeader',
      recordId: String(this.voucherData?.VoucherHeaderSid),
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

  private getJournalVoucherPdfFilename(): string {
    const voucherNo = this.voucherData?.VoucherNo || this.voucherData?.VoucherNumber || 'Draft';
    return `Journal_Voucher_${voucherNo}.pdf`;
  }

  private getCustomerBranchSidForEmail(): number | null {
    const candidates = [
      this.voucherData?.CustomerBranchSid,
      this.voucherData?.customerBranch?.CustomerBranchSid,
      this.voucherData?.CustomerBranch?.CustomerBranchSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCustomerMasterSidForEmail(): number | null {
    const candidates = [
      this.voucherData?.CustomerMasterSid,
      this.voucherData?.customerMaster?.CustomerMasterSid,
      this.voucherData?.CustomerMaster?.CustomerMasterSid,
      this.voucherData?.customerBranch?.CustomerMasterSid,
      this.voucherData?.CustomerBranch?.CustomerMasterSid,
      this.getCustomerMasterSidFromVoucherDetails()
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCustomerMasterSidFromVoucherDetails(): number | null {
    const details = this.voucherData?.VoucherDetail || [];
    for (const detail of details) {
      const subledger = detail?.subledgerMaster || this.subledgerList.find(
        (item: any) => Number(item?.SubledgerMasterSid) === Number(detail?.LedgerMasterSid)
      );
      if (String(subledger?.SubledgerType || '').trim().toLowerCase() === 'customer') {
        const sid = Number(subledger?.SubledgerMappingSid);
        if (Number.isFinite(sid) && sid > 0) {
          return sid;
        }
      }
    }
    return null;
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.currentMenuId ||
      this.voucherData?.voucherTypeMaster?.MenuMasterSid ||
      this.voucherData?.MenuMasterSid
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
  }

        
showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
        
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

 
        
}

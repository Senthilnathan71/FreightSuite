import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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

@Component({
  selector: 'app-bank-receipt',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './bank-receipt.component.html',
  styles: ``
})
export class BankReceiptComponent implements OnChanges {
  
  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currency:any[] = [];
  @Input() receiptPrintData: any;
  @Input() masterJobContainers: any[];
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() bankTypedLedgers: any;
  @Input() coaList : any[] = [];
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
    private pdfMakeService: PdfMakeService,
    private pdfFileSaveService: PdfFileSaveService,
    private spinner: NgxSpinnerService,
    private numberToWords: NumberToWordsService,
    private companySettings: CompanySettingsManagerService,
    public logoService : LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currencyList'] && changes['currencyList'].currentValue) {
      this.currencyList = changes['currencyList'].currentValue;
      this.numberToWords.initializeCurrencies(this.currencyList);
    }
  }


  modalClose() {
    this.activeModal.close()
  }

   getBankName(COAMasterSid: number ) {
    const bank = this.bankTypedLedgers.find(b => b.COAMasterSid == COAMasterSid);
    // console.log(bank,"BANK")
    return bank ? bank.LedgerName : '';
  }
 getTotalMatchingAmount(): number {
  if (!this.receiptPrintData?.voucherMatchings) return 0;

  return this.receiptPrintData.voucherMatchings.reduce((sum: number, voucher: any) => {
    return sum + (parseFloat(voucher?.MatchingAmount) || 0);
  }, 0);
}

getTotalMatchingLocalAmount(): number {
  if (!this.receiptPrintData?.voucherMatchings) return 0;

  return this.receiptPrintData.voucherMatchings.reduce((sum: number, voucher: any) => {
    return sum + (parseFloat(voucher?.MatchingLocalAmount) || 0);
  }, 0);
}

getTotalAmt() {
  return this.receiptPrintData?.VoucherDetail
    ?.filter((item: any) => item?.DrCr === 'D' && item?.IsAutoGenerated !== 'Y')
    ?.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item?.PartyAmount) || 0);
    }, 0);
}


getAmountInWords(): string {
  const total = this.getTotalAmt();
  if (!total) return '';

  const currencySid = this.receiptPrintData?.CurrencyMasterSid; this.receiptPrintData?.CurrencyMasterSid;
  return this.numberToWords.convert(total, currencySid);
}
  


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
    this.spinner.show();
    try {
      const companyMasterSid = Number(this.currentCompany?.CompanyMasterSid || 0);
      const saveAsFilePath = await this.pdfFileSaveService.shouldDownloadByFilePath(companyMasterSid);
      if (saveAsFilePath) {
        await this.downloadPDFByFilePath();
      } else {
        await this.downloadPDFInBrowser();
      }
      const payload = {
        tableName: 'VoucherHeader',
        recordId: String(this.receiptPrintData?.VoucherHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Download'
        },
        newVal: {
          PDF: 'Bank Receipt PDF Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
      this.appSettingService.showSuccess('PDF downloaded successfully!');
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
    receiptType: 'bank';
    coaList: any[];
    bankTypedLedgers: any[];
    amountInWords: string;
    currentUserCountry: string;
    printSettings: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  } {
    return {
      receiptType: 'bank',
      coaList: this.coaList || [],
      bankTypedLedgers: this.bankTypedLedgers || [],
      amountInWords: String(this.getAmountInWords() || this.receiptPrintData?.AmountInWords || this.receiptPrintData?.amountInWords || ''),
      currentUserCountry: this.currentUserCountry || '',
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
    const voucherNo = this.receiptPrintData?.VoucherNo || this.receiptPrintData?.VoucherNumber || 'BankReceipt';
    return `BankReceipt_${voucherNo}.pdf`;
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


        
}

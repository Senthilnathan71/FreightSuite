import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfMakeService } from 'src/app/common/pdf';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';

@Component({
  selector: 'app-cash-receipt',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './cash-receipt.component.html',
  styles: ``,
})
export class CashReceiptComponent {
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
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() bankTypedLedgers: any;
  @Input() coaList : any[] = [];
    
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
    this.loadCityName()
    this.loadCurrencyList()
    // console.log("Current Country Code", this.currentUserCountryCode);
    // console.log("Current Country", this.currentUserCountry);
    // console.log("CURRENT COMPANY", this.currentCompany);
    // console.log("CURRENT BRANCH", this.currentBranch);
  }

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private pdfMakeService: PdfMakeService,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private numberToWords: NumberToWordsService,
    private companySettings: CompanySettingsManagerService,
    public logoService : LogoService
  ) { }

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
    ?.filter((item: any) => item?.DrCr === 'D')   
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
  

getDrDetails() {
  return this.receiptPrintData?.VoucherDetail?.filter(
    (item: any) =>
      item?.DrCr === 'D' &&
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
      const logo = this.pdfMakeService.getReportLogo();
      this.pdfMakeService.generateReceiptFromApi(
        this.receiptPrintData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          receiptType: 'cash',
          coaList: this.coaList || [],
          bankTypedLedgers: this.bankTypedLedgers || [],
          amountInWords: this.getAmountInWords() || this.receiptPrintData?.AmountInWords || this.receiptPrintData?.amountInWords || '',
          currentUserCountry: this.currentUserCountry,
          printSettings: this.companySettings.getPrintSettings()
        }
      );
      this.appSettingService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
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
        {
          receiptType: 'cash',
          coaList: this.coaList || [],
          bankTypedLedgers: this.bankTypedLedgers || [],
          amountInWords: this.getAmountInWords() || this.receiptPrintData?.AmountInWords || this.receiptPrintData?.amountInWords || '',
          currentUserCountry: this.currentUserCountry,
          printSettings: this.companySettings.getPrintSettings()
        }
      );
      return blob;
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
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

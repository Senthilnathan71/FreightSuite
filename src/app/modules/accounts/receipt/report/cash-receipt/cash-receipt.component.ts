import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NgxSpinnerService } from 'ngx-spinner';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { toNumber } from 'src/app/common/helper';
import { LogoService } from 'src/app/core/services/logo.service';

@Component({
  selector: 'app-cash-receipt',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
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
    console.log("Current Country Code", this.currentUserCountryCode);
    console.log("Current Country", this.currentUserCountry);
    console.log("CURRENT COMPANY", this.currentCompany);
    console.log("CURRENT BRANCH", this.currentBranch);
  }

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private pdfService: PdfDownloadService,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private numberToWords: NumberToWordsService,
    public logoService : LogoService
  ) { }

  getBankName(COAMasterSid: number) {
    const bank = this.bankTypedLedgers.find(
      (b) => b.COAMasterSid == COAMasterSid
    );
    console.log(bank, 'BANK');
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


getAmountInWords(): string {
  const total = this.receiptPrintData?.VoucherDetail?.[0]?.Amount
  if (!total) return '';

  const currencySid = this.receiptPrintData?.CurrencyMasterSid;
  return this.numberToWords.convert(total, currencySid);
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


   shouldShowGSTTypeField(): boolean {
    return this.currentUserCountry === 'india';
  }
  // pdf download


      async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
     try {

    const BankReceiptNo = this.receiptPrintData?.VoucherNumber || 'Receipt';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
         `Cash_Receipt_${BankReceiptNo}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    }finally {
      this.spinner.hide();
    }
  }, 50);
}




  async generatePDFBlob(): Promise<Blob | null> {
    const printContent = document.getElementById('printContent');
    if (!printContent) {
      return null;
    }

    try {
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
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
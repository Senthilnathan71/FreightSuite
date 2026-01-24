import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NgxSpinnerService } from 'ngx-spinner';
import { toNumber } from 'src/app/common/helper';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';

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
    private pdfService: PdfDownloadService,
    private spinner: NgxSpinnerService,
    private numberToWords: NumberToWordsService,
    public logoService : LogoService
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

  console.log(COAMasterSid,"Ledger Id")
  const ledger = this.coaList.find(
    v => v.COAMasterSid === COAMasterSid
  );

  return ledger.LedgerName || '';
}

getSubledgerName(SubledgerMasterSid : number){
  if(!SubledgerMasterSid || this.subledgerList.length === 0) return '';

  const ourSubledger = this.subledgerList.find(
    sub => sub.SubledgerMasterSid === SubledgerMasterSid
  );

  return ourSubledger.SubledgerName || "";
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
      const JournalVoucher = this.voucherData?.VoucherNumber || 'Journal';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `Journal_Voucher_${JournalVoucher}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } finally {
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

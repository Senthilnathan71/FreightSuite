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

@Component({
  selector: 'app-bank-receipt',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './bank-receipt.component.html',
  styles: ``
})
export class BankReceiptComponent {
  
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


     loadCurrencyList(): void {
    this.masterService.getAllCurrencies().subscribe({
      next: (response: any) => {
        this.currency = response|| [];
        console.log('Currency List:', this.currency);
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
    private numberToWords: NumberToWordsService
  ) { }

  modalClose() {
    this.activeModal.close()
  }

   getBankName(COAMasterSid: number ) {
    const bank = this.bankTypedLedgers.find(b => b.COAMasterSid == COAMasterSid);
    console.log(bank,"BANK")
    return bank ? bank.LedgerName : '';
  }
 getTotalOriginalCurrencyAmount(): number {
  if (!this.receiptPrintData?.voucherMatchings) return 0;

  return this.receiptPrintData.voucherMatchings.reduce((sum: number, voucher: any) => {
    return sum + (parseFloat(voucher?.OriginalCurrencyAmount) || 0);
  }, 0);
}

getTotalOriginalLocalAmount(): number {
  if (!this.receiptPrintData?.voucherMatchings) return 0;

  return this.receiptPrintData.voucherMatchings.reduce((sum: number, voucher: any) => {
    return sum + (parseFloat(voucher?.OriginalLocalAmount) || 0);
  }, 0);
}

  getAmountInWords(): string {
    const total = this.getTotalOriginalLocalAmount();
    if (!total) return '';

    const rupees = Math.floor(total);
    const paise = Math.round((total - rupees) * 100);

    const rupeesInWords = this.numberToWords.convert(rupees);
    const paiseInWords = paise > 0 ? this.numberToWords.convert(paise) : '';

    // Get currency code safely from first voucher
    const selectedCode = this.receiptPrintData?.voucherMatchings?.[0]?.CurrencyCode;
    if (!selectedCode) return `${rupeesInWords}${paise > 0 ? ' and ' + paiseInWords : ''} Only`;

    // Find currency in the list
    const selectedCurrency = this.currency?.find(
      (c: any) => String(c.CurrencyCode).trim() === String(selectedCode).trim()
    );

    const currencyName = selectedCurrency?.CurrencyUnit || 'Rupees';
    const subCurrencyName = selectedCurrency?.CurrencySubUnit || 'Paise';

    return paise > 0
      ? `${rupeesInWords} ${currencyName} and ${paiseInWords} ${subCurrencyName} Only`
      : `${rupeesInWords} ${currencyName} Only`;
  }





    async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
   try {
      const BankReceiptNo = this.receiptPrintData?.VoucherNumber || 'Receipt';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `Bank_Receipt_${BankReceiptNo}`,
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

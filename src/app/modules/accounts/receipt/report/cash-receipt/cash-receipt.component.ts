import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

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
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
    this.currentUserCountryCode = this.currentCompany?.countryMaster?.countryCode || 'IN';
    
    console.log("Current Country Code", this.currentUserCountryCode);
    console.log("Current Country", this.currentUserCountry);
    console.log("CURRENT COMPANY", this.currentCompany);
    console.log("CURRENT BRANCH", this.currentBranch);
  }

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService
  ) {}

  getBankName(COAMasterSid: number) {
    const bank = this.bankTypedLedgers.find(
      (b) => b.COAMasterSid == COAMasterSid
    );
    console.log(bank, 'BANK');
    return bank ? bank.LedgerName : '';
  }

  getTotalOriginalCurrencyAmount(): number {
    if (!this.receiptPrintData?.voucherMatchings) return 0;

    return this.receiptPrintData.voucherMatchings.reduce(
      (sum: number, voucher: any) => {
        return sum + (parseFloat(voucher?.OriginalCurrencyAmount) || 0);
      },
      0
    );
  }

  getTotalOriginalLocalAmount(): number {
    if (!this.receiptPrintData?.voucherMatchings) return 0;

    return this.receiptPrintData.voucherMatchings.reduce(
      (sum: number, voucher: any) => {
        return sum + (parseFloat(voucher?.OriginalLocalAmount) || 0);
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

  convertNumberToWords(num: number): string {
    if (!num) return 'Zero';

    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];

    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    function convert(num: number): string {
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
      if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
      if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 !== 0 ? ' ' + convert(num % 1000000) : '');
      return convert(Math.floor(num / 1000000000)) + ' Billion' + (num % 1000000000 !== 0 ? ' ' + convert(num % 1000000000) : '');
    }

    return convert(num);
  }

  modalClose() {
    this.activeModal.close();
  }
}
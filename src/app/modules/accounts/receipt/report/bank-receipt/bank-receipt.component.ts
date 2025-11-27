import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

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
  }


  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
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



}

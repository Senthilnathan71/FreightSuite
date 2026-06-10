// receipt-view.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FeatherModule } from 'angular-feather';
import { ReceiptService } from '../../services/receipt.service';
import { ReceiptDetailView, ReceiptLineView, MatchedInvoice, InterBranchJV } from '../../models/receipt.model';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Receipt View Component
 * Displays complete receipt voucher details in read-only mode
 */
@Component({
  selector: 'app-receipt-view',
  standalone: true,
  imports: [
    CommonModule,
    NgxSpinnerModule,
    FeatherModule,
    CustomDatePipe
  ],
  providers: [CustomDatePipe],
  templateUrl: './receipt-view.component.html',
  styleUrl: './receipt-view.component.scss'
})
export class ReceiptViewComponent implements OnInit {
  receiptId!: number;
  receipt: any = null;
  loading = false;
  currentCompany: any;
  currentBranch: any;

  // Tabs
  selectedTab = 'details';
  tabs = [
    { id: 'details', label: 'Receipt Details', icon: 'fas fa-info-circle' },
    { id: 'vouchers', label: 'Matched Invoices', icon: 'fas fa-file-invoice' },
    { id: 'interbranch', label: 'Inter-Branch', icon: 'fas fa-exchange-alt' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receiptService: ReceiptService,
    private spinner: NgxSpinnerService,
    private appSettingService: AppSettingsService,
    private datePipe: CustomDatePipe
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.route.params.subscribe(params => {
      this.receiptId = +params['id'];
      if (this.receiptId) {
        this.loadReceipt();
      }
    });
  }

  loadReceipt(): void {
    this.spinner.show();
    this.loading = true;

    const CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch.BranchMasterSid;
    const payload = {
      CompanyMasterSid,
      BranchMasterSid,
      VoucherHeaderSid: this.receiptId
    }
    this.receiptService.getReceiptById(payload).subscribe({
      next: (response: any) => {
        this.receipt = this.processReceiptData(response);
        this.spinner.hide();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading receipt:', error);
        this.appSettingService.showError('Access denied');
        this.spinner.hide();
        this.loading = false;
        this.goBack();
      }
    });
  }

  private processReceiptData(data: any): any {
    // Process the receipt data to match ReceiptDetailView interface
    return {
      VoucherHeaderSid: data.VoucherHeaderSid,
      VoucherNumber: data.VoucherNumber,
      VoucherDate: this.datePipe.transform(data.VoucherDate),
      CompanyName: data.company?.companyName || 'N/A',
      BranchName: data.branch?.branchName || 'N/A',
      CustomerName: this.getCustomerName(data),
      PaymentMode: this.getPaymentMode(data),
      ChequeNumber: this.getChequeNumber(data),
      ChequeDate: this.getChequeDate(data),
      BankName: this.getBankName(data),
      TotalAmount: this.calculateTotalAmount(data),
      TDSAmount: this.getTDSAmount(data),
      NetAmount: this.calculateNetAmount(data),
      Narration: data.Narration || 'N/A',
      CreatedBy: data.CreatedBy || 'N/A',
      CreatedOn: this.datePipe.transform(data.CreatedOn),
      Status: data.Status === 'A' ? 'Active' : 'Suspended',
      lines: this.processLines(data.voucherDetails || data.voucherTransactions || []),
      matchedInvoices: this.processMatchedInvoices(data.voucherMatchings || []),
      interBranchJV: this.getInterBranchJV(data),
      ...data
    };
  }

  private getCustomerName(data: any): string {
    // Try to get customer name from various possible locations
    if (data.PartyName) return data.PartyName;
    if (data.CustomerName) return data.CustomerName;

    // From voucher transactions
    if (data.voucherTransactions && data.voucherTransactions.length > 0) {
      const customerTxn = data.voucherTransactions.find((txn: any) =>
        txn.SubledgerMaster && txn.DrCr === 'C'
      );
      if (customerTxn && customerTxn.SubledgerMaster) {
        return customerTxn.SubledgerMaster.SubledgerName;
      }
    }

    return 'N/A';
  }

  private getPaymentMode(data: any): string {
    // Extract payment mode from narration or other fields
    if (data.PaymentMode) return data.PaymentMode;
    if (data.Narration) {
      if (data.Narration.includes('NEFT')) return 'NEFT';
      if (data.Narration.includes('RTGS')) return 'RTGS';
      if (data.Narration.includes('Cheque')) return 'Cheque';
      if (data.Narration.includes('Cash')) return 'Cash';
    }
    return 'N/A';
  }

  private getChequeNumber(data: any): string {
    return data.ChequeNumber || 'N/A';
  }

  private getChequeDate(data: any): string {
    return data.ChequeDate ? this.datePipe.transform(data.ChequeDate) : 'N/A';
  }

  private getBankName(data: any): string {
    return data.BankName || 'N/A';
  }

  private calculateTotalAmount(data: any): number {
    if (data.TotalAmount) return data.TotalAmount;

    // Calculate from voucher details/transactions
    if (data.voucherDetails && data.voucherDetails.length > 0) {
      return data.voucherDetails.reduce((sum: number, detail: any) => {
        if (detail.DrCr === 'C') {
          return sum + (detail.Amount || detail.LocalAmount || 0);
        }
        return sum;
      }, 0);
    }

    if (data.voucherTransactions && data.voucherTransactions.length > 0) {
      return data.voucherTransactions.reduce((sum: number, txn: any) => {
        if (txn.DrCr === 'C') {
          return sum + (txn.Amount || 0);
        }
        return sum;
      }, 0);
    }

    return 0;
  }

  private getTDSAmount(data: any): number {
    if (data.TDSAmount) return data.TDSAmount;

    // Look for TDS entry in voucher details
    if (data.voucherDetails && data.voucherDetails.length > 0) {
      const tdsDetail = data.voucherDetails.find((detail: any) =>
        detail.Narration && detail.Narration.toLowerCase().includes('tds')
      );
      if (tdsDetail) {
        return tdsDetail.Amount || tdsDetail.LocalAmount || 0;
      }
    }

    if (data.voucherTransactions && data.voucherTransactions.length > 0) {
      const tdsTxn = data.voucherTransactions.find((txn: any) =>
        txn.Narration && txn.Narration.toLowerCase().includes('tds')
      );
      if (tdsTxn) {
        return tdsTxn.Amount || 0;
      }
    }

    return 0;
  }

  private calculateNetAmount(data: any): number {
    const totalAmount = this.calculateTotalAmount(data);
    const tdsAmount = this.getTDSAmount(data);
    return totalAmount - tdsAmount;
  }

  private processLines(lines: any[]): ReceiptLineView[] {
    return lines.map((line, index) => ({
      Sno: line.Sno || (index + 1),
      COAName: line.CoaMaster?.LedgerName || line.COAName || 'N/A',
      SubledgerName: line.SubledgerMaster?.SubledgerName || line.SubledgerName || '',
      DrCr: line.DrCr || '',
      Amount: line.Amount || line.LocalAmount || 0,
      CurrencyCode: line.CurrencyCode || 'INR',
      CurrencyAmount: line.CurrencyAmount || 0,
      ExchangeRate: line.ExchangeRate || 1,
      Narration: line.Narration || ''
    }));
  }

  private processMatchedInvoices(matchings: any[]): MatchedInvoice[] {
    return matchings.map(matching => ({
      VoucherTransactionSid: matching.VoucherTransactionSid,
      InvoiceNumber: matching.VoucherNumber || 'N/A',
      InvoiceDate: this.datePipe.transform(matching.VoucherDate) || 'N/A',
      OriginalAmount: matching.OriginalAmount || 0,
      PreviouslyMatched: matching.PreviouslyMatched || 0,
      MatchedAmount: matching.Amount || matching.LocalAmount || 0,
      OutstandingAmount: matching.OutstandingAmount || 0
    }));
  }

  private getInterBranchJV(data: any): InterBranchJV | undefined {
    if (data.InterBranchJV) {
      return data.InterBranchJV;
    }
    return undefined;
  }

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
  }

  goBack(): void {
    this.router.navigate(['accounts/receipt/list']);
  }

  editReceipt(): void {
    this.router.navigate(['accounts/receipt/entry', this.receiptId]);
  }

  printReceipt(): void {
    window.print();
  }

  exportToPDF(): void {
    this.appSettingService.showWarning('PDF export not yet implemented');
  }
}

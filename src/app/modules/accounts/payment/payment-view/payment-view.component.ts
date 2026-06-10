// payment-view.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FeatherModule } from 'angular-feather';
import { PaymentService } from '../../services/payment.service';
import {
  PaymentDetailView,
  PaymentDetailLineView,
  PaymentTDSView,
  MatchedInvoice,
  InterBranchJV,
  ExchangeJV
} from '../../models/payment.model';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Payment View Component
 * Displays complete payment voucher details in read-only mode
 * Supports Cash and Bank payments with TDS, voucher matching, inter-branch JV
 */
@Component({
  selector: 'app-payment-view',
  standalone: true,
  imports: [
    CommonModule,
    NgxSpinnerModule,
    FeatherModule,
    CustomDatePipe
  ],
  providers: [CustomDatePipe],
  templateUrl: './payment-view.component.html',
  styleUrl: './payment-view.component.scss'
})
export class PaymentViewComponent implements OnInit {
  paymentId!: number;
  payment: any = null;
  loading = false;
  currentCompany: any;
  currentBranch: any;

  // Tabs
  selectedTab = 'details';
  tabs = [
    { id: 'details', label: 'Payment Details', icon: 'fas fa-info-circle' },
    { id: 'tds', label: 'TDS Details', icon: 'fas fa-file-invoice-dollar' },
    { id: 'vouchers', label: 'Matched Invoices', icon: 'fas fa-file-invoice' },
    { id: 'interbranch', label: 'Inter-Branch', icon: 'fas fa-exchange-alt' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private spinner: NgxSpinnerService,
    private appSettingService: AppSettingsService,
    private datePipe: CustomDatePipe
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.route.params.subscribe(params => {
      this.paymentId = +params['id'];
      if (this.paymentId) {
        this.loadPayment();
      }
    });
  }

  loadPayment(): void {
    this.spinner.show();
    this.loading = true;
    const CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch.BranchMasterSid;
    const payload = {
      CompanyMasterSid,
      BranchMasterSid,
      VoucherHeaderSid: this.paymentId
    }
    this.paymentService.getPaymentById(payload).subscribe({
      next: (response: any) => {
        this.payment = this.processPaymentData(response);
        this.spinner.hide();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment:', error);
        this.appSettingService.showError('Access denied');
        this.spinner.hide();
        this.loading = false;
        this.goBack();
      }
    });
  }

  private processPaymentData(data: any): any {
    // Process the payment data to match PaymentDetailView interface
    return {
      VoucherHeaderSid: data.VoucherHeaderSid,
      VoucherNumber: data.VoucherNumber,
      VoucherDate: this.datePipe.transform(data.VoucherDate),
      CompanyName: data.CompanyName || data.company?.companyName || 'N/A',
      BranchName: data.BranchName || data.branch?.branchName || 'N/A',
      VendorName: this.getVendorName(data),
      PaidTo: data.PaidTo || 'N/A',
      Address: data.Address || '',
      GSTNumber: data.GSTNumber || '',
      PaymentMode: this.getPaymentMode(data),
      BankName: this.getBankName(data),
      CurrencyCode: data.CurrencyCode || 'INR',
      ExchangeRate: data.ExchangeRate || 1,
      InstrumentMode: data.InstrumentMode || '',
      InstrumentNumber: data.InstrumentNumber || '',
      InstrumentDate: data.InstrumentDate ? this.datePipe.transform(data.InstrumentDate) : '',
      ClearanceDate: data.ClearanceDate ? this.datePipe.transform(data.ClearanceDate) : '',
      TotalAmount: this.calculateTotalAmount(data),
      TDSAmount: this.getTDSAmount(data),
      NetAmount: this.calculateNetAmount(data),
      Narration: data.Narration || '',
      Remarks: data.Remarks || '',
      CreatedBy: data.CreatedBy || 'N/A',
      CreatedOn: this.datePipe.transform(data.CreatedOn),
      Status: data.Status === 'A' ? 'Active' : data.Status === 'S' ? 'Suspended' : 'Reversed',
      details: this.processDetailLines(data.details || data.voucherDetails || []),
      tdsDetails: this.processTDSDetails(data.tdsDetails || data.VoucherTDS || []),
      matchedInvoices: this.processMatchedInvoices(data.matchedInvoices || data.voucherMatchings || []),
      interBranchJVs: this.processInterBranchJVs(data.interBranchJVs || data.InterBranchJVs || []),
      exchangeJV: this.processExchangeJV(data.exchangeJV || data.ExchangeJV),
      ...data
    };
  }

  private getVendorName(data: any): string {
    // Try to get vendor name from various possible locations
    if (data.VendorName) return data.VendorName;
    if (data.PartyName) return data.PartyName;

    // From voucher transactions
    if (data.voucherTransactions && data.voucherTransactions.length > 0) {
      const vendorTxn = data.voucherTransactions.find((txn: any) =>
        txn.SubledgerMaster && txn.DrCr === 'D'
      );
      if (vendorTxn && vendorTxn.SubledgerMaster) {
        return vendorTxn.SubledgerMaster.SubledgerName;
      }
    }

    return 'N/A';
  }

  private getPaymentMode(data: any): string {
    if (data.PaymentMode) return data.PaymentMode;
    if (data.InstrumentMode) return data.InstrumentMode;

    // Extract from narration
    if (data.Narration) {
      if (data.Narration.includes('Cash')) return 'Cash';
      if (data.Narration.includes('Bank')) return 'Bank';
      if (data.Narration.includes('NEFT')) return 'NEFT';
      if (data.Narration.includes('RTGS')) return 'RTGS';
      if (data.Narration.includes('Cheque')) return 'Cheque';
    }

    return 'Bank';
  }

  private getBankName(data: any): string {
    if (data.BankName) return data.BankName;

    // Try to get from voucher details (credit entry)
    if (data.voucherDetails && data.voucherDetails.length > 0) {
      const bankDetail = data.voucherDetails.find((detail: any) =>
        detail.DrCr === 'C' && detail.CoaMaster?.LedgerName
      );
      if (bankDetail) {
        return bankDetail.CoaMaster.LedgerName;
      }
    }

    return 'N/A';
  }

  private calculateTotalAmount(data: any): number {
    if (data.TotalAmount) return Number(data.TotalAmount);

    // Calculate from voucher details (debit entries)
    if (data.details && data.details.length > 0) {
      return data.details.reduce((sum: number, detail: any) => {
        if (detail.DrCr === 'D') {
          return sum + (detail.LocalAmount || detail.Amount || 0);
        }
        return sum;
      }, 0);
    }

    if (data.voucherDetails && data.voucherDetails.length > 0) {
      return data.voucherDetails.reduce((sum: number, detail: any) => {
        if (detail.DrCr === 'D') {
          return sum + (detail.Amount || detail.LocalAmount || 0);
        }
        return sum;
      }, 0);
    }

    return 0;
  }

  private getTDSAmount(data: any): number {
    if (data.TDSAmount) return Number(data.TDSAmount);

    // Sum from TDS details
    if (data.tdsDetails && data.tdsDetails.length > 0) {
      return data.tdsDetails.reduce((sum: number, tds: any) =>
        sum + (tds.TDSAmount || 0), 0);
    }

    if (data.VoucherTDS && data.VoucherTDS.length > 0) {
      return data.VoucherTDS.reduce((sum: number, tds: any) =>
        sum + (tds.TDSAmount || 0), 0);
    }

    // Look for TDS entry in voucher details
    if (data.voucherDetails && data.voucherDetails.length > 0) {
      const tdsDetail = data.voucherDetails.find((detail: any) =>
        detail.Narration && detail.Narration.toLowerCase().includes('tds')
      );
      if (tdsDetail) {
        return tdsDetail.Amount || tdsDetail.LocalAmount || 0;
      }
    }

    return 0;
  }

  private calculateNetAmount(data: any): number {
    const totalAmount = this.calculateTotalAmount(data);
    const tdsAmount = this.getTDSAmount(data);
    return totalAmount - tdsAmount;
  }

  private processDetailLines(details: any[]): PaymentDetailLineView[] {
    return details.map((detail, index) => ({
      Sno: detail.Sno || (index + 1),
      LedgerName: detail.LedgerName || detail.CoaMaster?.LedgerName || detail.subledgerMaster?.SubledgerName || 'N/A',
      BranchName: detail.BranchName || detail.BranchMaster?.BranchName || 'N/A',
      DrCr: detail.DrCr || '',
      CurrencyCode: detail.CurrencyCode || 'INR',
      ExchangeRate: Number(detail.ExchangeRate || 1),
      CurrencyAmount: Number(detail.CurrencyAmount || detail.Amount || 0),
      TaxableAmount: Number(detail.TaxableAmount || 0),
      TaxPercentage: Number(detail.TaxPercentage || 0),
      TaxAmount: Number(detail.TaxAmount || 0),
      LocalAmount: Number(detail.LocalAmount || detail.Amount || 0),
      Narration: detail.Narration || ''
    }));
  }

  private processTDSDetails(tdsDetails: any[]): PaymentTDSView[] {
    if (!tdsDetails || tdsDetails.length === 0) return [];

    return tdsDetails.map(tds => ({
      ITSectionCode: tds.ITSectionCode || '',
      TDSCompanyType: tds.TDSCompanyType || 'Company',
      TDSPercentage: Number(tds.TDSPercentage || tds.TDSRate || 0),
      TaxableAmount: Number(tds.TaxableAmount || 0),
      TDSAmount: Number(tds.TDSAmount || 0),
      CertificateNumber: tds.CertificateNumber || '',
      Reason: tds.Reason || ''
    }));
  }

  private processMatchedInvoices(matchings: any[]): MatchedInvoice[] {
    if (!matchings || matchings.length === 0) return [];

    return matchings.map(matching => ({
      VoucherTransactionSid: matching.VoucherTransactionSid,
      InvoiceNumber: matching.InvoiceNumber || matching.VoucherNumber || 'N/A',
      InvoiceDate: this.datePipe.transform(matching.InvoiceDate || matching.VoucherDate) || 'N/A',
      OriginalAmount: Number(matching.OriginalAmount || 0),
      PreviouslyMatched: Number(matching.PreviouslyMatched || 0),
      MatchedAmount: Number(matching.MatchedAmount || matching.Amount || matching.LocalAmount || 0),
      TDSAmount: Number(matching.TDSAmount || 0),
      OutstandingAmount: Number(matching.OutstandingAmount || 0)
    }));
  }

  private processInterBranchJVs(interBranchJVs: any[]): InterBranchJV[] {
    if (!interBranchJVs || interBranchJVs.length === 0) return [];

    return interBranchJVs.map(jv => ({
      JVHeaderSid: jv.JVHeaderSid,
      JVNumber: jv.JVNumber || '',
      PayingBranchSid: jv.PayingBranchSid,
      ReceivingBranchSid: jv.ReceivingBranchSid,
      Amount: Number(jv.Amount || 0),
      CreatedAt: jv.CreatedAt || ''
    }));
  }

  private processExchangeJV(exchangeJV: any): ExchangeJV | undefined {
    if (!exchangeJV) return undefined;

    return {
      JVHeaderSid: exchangeJV.JVHeaderSid,
      JVNumber: exchangeJV.JVNumber || '',
      ExchangeDifference: Number(exchangeJV.ExchangeDifference || 0),
      IsGain: exchangeJV.IsGain || false,
      CreatedAt: exchangeJV.CreatedAt || ''
    };
  }

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
  }

  goBack(): void {
    this.router.navigate(['accounts/payment/list']);
  }

  editPayment(): void {
    this.router.navigate(['accounts/payment/entry', this.paymentId]);
  }

  printPayment(): void {
    window.print();
  }

  exportToPDF(): void {
    this.appSettingService.showWarning('PDF export not yet implemented');
  }
}

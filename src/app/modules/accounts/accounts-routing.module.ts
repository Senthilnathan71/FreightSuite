import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CurrencyExchangeListComponent } from './currency-exchange/currency-exchange-list/currency-exchange-list.component';
import { CurrencyExchangeEntryComponent } from './currency-exchange/currency-exchange-entry/currency-exchange-entry.component';
import { ApprovalComponent } from './approval/approval/approval.component';
import { ModalComponent } from './modal/modal/modal.component';
import { ChartAccountListComponent } from './chart-account/chart-account-list/chart-account-list.component';
import { ChartAccountEntryComponent } from './chart-account/chart-account-entry/chart-account-entry.component';
import { VendorTdsListComponent } from './vendor-tds/vendor-tds-list/vendor-tds-list.component';
import { VendorTdsEntryComponent } from './vendor-tds/vendor-tds-entry/vendor-tds-entry.component';
import { LedgerMappingComponent } from './ledger-mapping/ledger-mapping/ledger-mapping.component';
import { Dashboard1Component } from './dashboard1/dashboard1/dashboard1.component';
import { ReceiptListComponent } from './receipt/receipt-list/receipt-list.component';
import { ReceiptEntryComponent } from './receipt/receipt-entry/receipt-entry.component';
import { ReceiptViewComponent } from './receipt/receipt-view/receipt-view.component';
import { PrintsComponent } from './print-structure/prints/prints.component';
import { PaymentViewComponent } from './payment/payment-view/payment-view.component';
import { JournalVoucherListComponent } from './journal-voucher/journal-voucher-list/journal-voucher-list.component';

import { VoucherMatchingEntryComponent } from './voucher-matching/voucher-matching-entry/voucher-matching-entry.component';
import { VoucherMatchingViewComponent } from './voucher-matching/voucher-matching-view/voucher-matching-view.component';
import { TrialBalanceReportComponent } from './trial-balance/trial-balance-report.component';
import { BankReconciliationComponent } from './bank-reconciliation/bank-reconciliation.component';
import { AccountsReportsComponent } from '../../accounts/components/accounts-reports/accounts-reports.component';
import { ManagementReportsComponent } from '../../accounts/components/management-reports/management-reports.component';
import { JournalVoucherEntryComponent } from './journal-voucher/journal-voucher-entry/journal-voucher-entry.component';
import { ReverseVoucherEntryComponent } from './reverse-voucher/reverse-voucher-entry/reverse-voucher-entry.component';
import { ReverseVoucherListComponent } from './reverse-voucher/reverse-voucher-list/reverse-voucher-list.component';
import { PaymentListComponent } from './payment/payment-list/payment-list.component';
import { PaymentEntryComponent } from './payment/payment-entry/payment-entry.component';
import { VoucherMatchingListComponent } from './voucher-matching/voucher-matching-list/voucher-matching-list.component';
import { UnsavedChangesGuard } from 'src/app/core/guards/unsaved-changes.guard';
import { AccountsCloseListComponent } from './accounts-close/accounts-close-list/accounts-close-list.component';

export const AccountRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: CurrencyExchangeListComponent
      },
      {
        path: "currency-exchange/list",
        component: CurrencyExchangeListComponent,
        data: {
          title: "Currency Exchange",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Currency Exchange" },
          ],
        },
      },
      {
        path: "currency-exchange/entry",
        component: CurrencyExchangeEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Add Currency Exchange",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Currency Exchange" },
          ],
        },
      },
      {
        path: "currency-exchange/entry/:id",
        component: CurrencyExchangeEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Edit Currency Exchange",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Currency Exchange" },
          ],
        },
      },
      
     
      {
        path: "approval",
        component: ApprovalComponent,
        data: {
          title: "Approval",
          urls: [
            { title: "Approval", url: "/approval" },
            { title: "Approval" },
          ],
        },
      },
      {
        path: "modal",
        component: ModalComponent,
        data: {
          title: "modal",
          urls: [
            { title: "accounts", url: "/modal" },
            { title: "modal" },
          ],
        },
      },

      {
        path: "chart-accounts/list",
        component: ChartAccountListComponent,
        data: {
          title: "Chart Accounts",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Chart Accounts" },
          ],
        },
      },
      {
        path: "chart-accounts/entry",
        component: ChartAccountEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Chart Accounts",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Chart Accounts" },
          ],
        },
      },
      {
        path: "chart-accounts/entry/:id",
        component: ChartAccountEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Chart Accounts",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Chart Accounts" },
          ],
        },
      },
      {
        path: "supplier-tds/list",
        component: VendorTdsListComponent,
        data: {
          title: "Supplier TDS Mapping",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Vendor TDS" },
          ],
        },
      },
      {
        path: "supplier-tds/entry",
        component: VendorTdsEntryComponent,
        data: {
          title: "Supplier TDS Mapping",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Vendor TDS" },
          ],
        },
      },
      {
        path: "supplier-tds/entry/:id",
        component: VendorTdsEntryComponent,
        data: {
          title: "Supplier TDS Mapping",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Vendor TDS" },
          ],
        },
      },
      {
        path: "ledger-mapping/list",
        component: LedgerMappingComponent,
        data: {
          title: "Ledger Mapping",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Ledger Mapping" },
          ],
        },
      },
      {
        path: "dashboard1",
        component: Dashboard1Component,
        data: {
          title: "Dashboard1",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Dashboard1" },
          ],
        },
      },
      {
        path: "receipt/list",
        component: ReceiptListComponent,
        data: {
          title: "Receipt Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Receipt Voucher" },
          ],
        },
      },
      {
        path: "receipt/entry",
        component: ReceiptEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Add Receipt Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Receipt Voucher", url: "/accounts/receipt/list" },
            { title: "Add Receipt" },
          ],
        },
      },
      {
        path: "receipt/entry/:id",
        component: ReceiptEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Edit Receipt Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Receipt Voucher", url: "/accounts/receipt/list" },
            { title: "Edit Receipt" },
          ],
        },
      },
      {
        path: "receipt/view/:id",
        component: ReceiptViewComponent,
        data: {
          title: "View Receipt Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Receipt Voucher", url: "/accounts/receipt/list" },
            { title: "View Receipt" },
          ],
        },
      },
      {
        path: "print",
        component: PrintsComponent,
        data: {
          title: "Print",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Print" },
          ],
        },
      },
      {
        path: "payment/list",
        component: PaymentListComponent,
        data: {
          title: "Payment Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Payment Voucher" },
          ],
        },
      },

      {
        path: "payment/entry",
        component: PaymentEntryComponent,
       canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Add Payment Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Payment Voucher", url: "/accounts/payment/list" },
            { title: "Add Payment" },
          ],
        },
      },
      {
        path: "payment/entry/:id",
        component: PaymentEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Edit Payment Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Payment Voucher", url: "/accounts/payment/list" },
            { title: "Edit Payment" },
          ],
        },
      },
      // {
      //   path: "payment/view/:id",
      //   component: PaymentEntryComponent,
      //   data: {
      //     title: "View Payment Voucher",
      //     urls: [
      //       { title: "Accounts", url: "/accounts" },
      //       { title: "Payment Voucher", url: "/accounts/payment/list" },
      //       { title: "View Payment" },
      //     ],
      //   },
      // },

       {
        path: "journal-voucher/list",
        component: JournalVoucherListComponent,
        data: {
          title: "Journal-Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Journal-Voucher" },
          ],
        },
      },

       {
        path: "journal-voucher/entry",
        component: JournalVoucherEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Journal-Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Journal-Voucher" },
          ],
        },
      },
      {
        path: "journal-voucher/entry/:id",
        component: JournalVoucherEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Journal-Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Journal-Voucher", url: "/accounts/journal-voucher/list" },
            { title: "Journal-Voucher" },
          ],
        },
      },
      {
        path: "reverse-voucher/list",
        component: ReverseVoucherListComponent,
        data: {
          title: "Reverse-Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Reverse-Voucher" },
          ],
        },
      },
      {
        path: "reverse-voucher/entry",
        component: ReverseVoucherEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Reverse-Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Reverse-Voucher" },
          ],
        },
      },
      {
        path: "reverse-voucher/entry/:id",
        component: ReverseVoucherEntryComponent,
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: "Reverse-Voucher",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Reverse-Voucher", url: "/accounts/reverse-voucher/list" },
            { title: "Reverse-Voucher" },
          ],
        },
      },

           {
        path: "voucher-matching/list",
        component:VoucherMatchingListComponent,
        data: {
          title: "Voucher-Matching",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Voucher-Matching" },
          ],
        },
      },


         {
        path: "voucher-matching/entry",
        component:VoucherMatchingEntryComponent,
        data: {
          title: "Voucher-Matching",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Voucher-Matching" },
          ],
        },
      },

      {
        path: "voucher-matching/entry/:VoucherMatchingHeaderSid",
        component: VoucherMatchingEntryComponent,
        data: {
          title: "Voucher-Matching",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Voucher-Matching", url: "/accounts/voucher-matching/list" },
            { title: "Voucher-Matching" },
          ],
        },
      },

      {
        path: "voucher-matching/view/:VoucherMatchingHeaderSid",
        component: VoucherMatchingViewComponent,
        data: {
          title: "View Voucher Matching",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Voucher Matching", url: "/accounts/voucher-matching/list" },
            { title: "View Voucher Matching" },
          ],
        },
      },

      {
        path: "trial-balance/report",
        component: TrialBalanceReportComponent,
        data: {
          title: "Trial Balance",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Trial Balance" },
          ],
        },
      },
      {
        path: "bank-reconciliation",
        component: BankReconciliationComponent,
        data: {
          title: "Bank Reconciliation",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Bank Reconciliation" },
          ],
        },
      },

      {
        path: "reports",
        component: AccountsReportsComponent,
        data: {
          title: "Accounts Reports",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Reports" },
          ],
        },
      },
      {
        path: "management-report",
        component: ManagementReportsComponent,
        data: {
          title: "Management Report",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Management Report" },
          ],
        },
      },

      {
        path: "accounts-close/list",
        component: AccountsCloseListComponent,
        data: {
          title: "Voucher Period",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Voucher Period" },
          ],
        },
      },

    ]
  }
]

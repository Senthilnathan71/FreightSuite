import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CurrencyExchangeListComponent } from './currency-exchange/currency-exchange-list/currency-exchange-list.component';
import { CurrencyExchangeEntryComponent } from './currency-exchange/currency-exchange-entry/currency-exchange-entry.component';
import { TaxGroupListComponent } from './tax-group/tax-group-list/tax-group-list.component';
import { TaxGroupComponent } from './tax-group/tax-group.component';
import { ApprovalComponent } from './approval/approval/approval.component';
import { ModalComponent } from './modal/modal/modal.component';
import { ChartAccountListComponent } from './chart-account/chart-account-list/chart-account-list.component';
import { ChartAccountEntryComponent } from './chart-account/chart-account-entry/chart-account-entry.component';
import { VendorTdsListComponent } from './vendor-tds/vendor-tds-list/vendor-tds-list.component';
import { VendorTdsEntryComponent } from './vendor-tds/vendor-tds-entry/vendor-tds-entry.component';
import { LedgerMappingComponent } from './ledger-mapping/ledger-mapping/ledger-mapping.component';

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
        data: {
          title: "Edit Currency Exchange",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Currency Exchange" },
          ],
        },
      },
      {
        path: "tax-group/list",
        component: TaxGroupListComponent,
        data: {
          title: "Tax Group",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Tax Group" },
          ],
        },
      },
      {
        path: "tax-group/entry",
        component: TaxGroupComponent,
        data: {
          title: "Add Tax Group",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Tax Group" },
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
        data: {
          title: "Chart Accounts",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Chart Accounts" },
          ],
        },
      },
       {
        path: "vendor-tds/list",
        component: VendorTdsListComponent,
        data: {
          title: "Vendor TDS",
          urls: [
            { title: "Accounts", url: "/accounts" },
            { title: "Vendor TDS" },
          ],
        },
      },
      {
        path: "vendor-tds/entry",
        component: VendorTdsEntryComponent,
        data: {
          title: "Vendor TDS",
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
    ]
  }
]
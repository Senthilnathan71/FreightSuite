import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountRoutes } from './accounts-routing.module';
import { OutstandingService } from './services/outstanding.service';
import { ReceiptService } from './services/receipt.service';
import { VoucherPostingService } from './services/voucher-posting.service';
import { PaymentService } from './services/payment.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(AccountRoutes)
  ],
  providers: [
    OutstandingService,
    ReceiptService,
    VoucherPostingService,
    PaymentService
  ]
})

export class AccountsModule { }

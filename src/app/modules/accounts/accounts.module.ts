import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountRoutes } from './accounts-routing.module';
import { VoucherPostingService } from './services/voucher-posting.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(AccountRoutes)
  ],
  providers: [
    VoucherPostingService
  ]
})
export class AccountsModule { }

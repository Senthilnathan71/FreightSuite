import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountRoutes } from './accounts-routing.module';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(AccountRoutes)

  ]
})
export class AccountsModule { }

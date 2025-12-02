import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmailRoutes } from './email-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(EmailRoutes)
  ]
})
export class EmailModule { }

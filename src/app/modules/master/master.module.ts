import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Materroutes } from './master-routing.module';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(Materroutes)
  ]
})
export class MasterModule { }

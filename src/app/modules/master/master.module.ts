import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Materroutes } from './master-routing.module';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MasterService } from './master.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(Materroutes)
  ],
  providers: [MasterService]
})
export class MasterModule { }

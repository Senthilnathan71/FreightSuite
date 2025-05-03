import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MasterRoutes } from './master-routing.module';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MasterService } from './master.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(MasterRoutes)
  ],
  providers: [MasterService]
})
export class MasterModule { }

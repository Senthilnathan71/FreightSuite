import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OperationRoutes } from './operation-routing.module';
import { OperationService } from './operation.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(OperationRoutes)
  ],
  providers: [OperationService]
})
export class OperationModule { }

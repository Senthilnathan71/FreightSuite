import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OperationRoutes } from './operation-routing.module';
import { OperationService } from './operation.service';
import { TaxCalculationService } from './services/tax-calculation.service';
import { MasterDocumentUploadComponent } from './master-document-upload/master-document-upload.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';


@NgModule({
  declarations: [MasterDocumentUploadComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(OperationRoutes),
    SearchableDropdown
  ],
  providers: [OperationService, TaxCalculationService]
})
export class OperationModule { }

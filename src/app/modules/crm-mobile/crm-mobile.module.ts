import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CrmMobileRoutes } from './crm-mobile.routing';
import { LeadService } from './Services/lead.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgSelectModule } from '@ng-select/ng-select'; 
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
     NgSelectModule,
     NgxSpinnerModule,
    RouterModule.forChild(CrmMobileRoutes)
  ],
  providers:[LeadService]
})
export class CrmMobileModule {
  
}

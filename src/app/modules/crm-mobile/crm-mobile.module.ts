import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CrmMobileRoutes } from './crm-mobile.routing';
import { LeadService } from './Services/lead.service';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(CrmMobileRoutes)
  ],
  providers:[LeadService]
})
export class CrmMobileModule {
  
}

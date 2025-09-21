import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CrmMobileRoutes } from './crm-mobile.routing';
import { LeadService } from './Services/lead.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(CrmMobileRoutes)
  ],
  providers:[LeadService]
})
export class CrmMobileModule {
  
}

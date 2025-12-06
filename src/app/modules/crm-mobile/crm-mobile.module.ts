import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CrmMobileRoutes } from './crm-mobile.routing';
import { LeadService } from './Services/lead.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgSelectModule } from '@ng-select/ng-select'; 
import { ActivityAllocationComponent } from './activity-allocation/activity-allocation.component';
import { ActivityAllocationEntryComponent } from './activity-allocation/activity-allocation-entry/activity-allocation-entry.component';
@NgModule({
  declarations: [ ActivityAllocationComponent, ActivityAllocationEntryComponent,],
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

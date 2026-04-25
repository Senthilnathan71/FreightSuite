import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SalesDashboardComponent } from './sales-dashboard/sales-dashboard.component';
import { SalesManagerDashboardComponent } from './sales-manager-dashboard/sales-manager-dashboard.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    DashboardRoutingModule,
    DashboardComponent,
    SalesDashboardComponent,
    SalesManagerDashboardComponent
  ]
})
export class DashboardModule { }

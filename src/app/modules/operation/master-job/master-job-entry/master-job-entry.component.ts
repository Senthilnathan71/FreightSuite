import { Component, ViewChild, TemplateRef } from '@angular/core';
import {
  NgbAccordionModule,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CostEntryComponent } from '../../cost/cost -entry/cost-entry.component';
import { RevenueEntryComponent } from '../../revenue/revenue-entry/revenue-entry.component';
import { ConnectionComponent } from '../../connection/connection/connection.component';
import { ContainerActivityComponent } from '../../container-activity/container-activity/container-activity.component';
import { ArApComponent } from '../../AR-AP/ar-ap/ar-ap.component';

@Component({
  selector: 'app-master-job-entry',
  standalone: true,
  imports: [
    NgbDatepickerModule,
    NgSelectModule,
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CostEntryComponent,
    NgComponentOutlet,
    RevenueEntryComponent,
    ConnectionComponent,
    ContainerActivityComponent,
    ArApComponent,
    NgbAccordionModule,
  ],
  templateUrl: './master-job-entry.component.html',
  styleUrl: './master-job-entry.component.scss',
})
export class MasterJobEntryComponent {
  public ratecomponent = CostEntryComponent;
  public revenuecomponent = RevenueEntryComponent;
  public connectionComponent = ConnectionComponent;
  public containerComponent = ContainerActivityComponent;
  public ARAPcompoent = ArApComponent;

  tabs = [
    { name: 'Master', icon: 'fas fa-database' },
    { name: 'Container', icon: 'fas fa-boxes' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    // { name: 'Revenue', icon: 'fas fa-chart-line' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Mail', icon: 'fas fa-envelope' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Container Activity', icon: 'fas fa-shipping-fast' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
    { name: 'History', icon: 'fas fa-history' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
  ];

  tabs1 = [
    { name: 'Product', icon: 'fas fa-boxes' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Mail', icon: 'fas fa-envelope' },
   { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
    { name: 'History', icon: 'fas fa-history' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
  ];

  modeOfBLReleaseType = [
    { id: 1, name: 'Express' },
    { id: 2, name: 'Original' },
    { id: 3, name: 'Surrendered' },
    { id: 4, name: 'Sea WayBill' },
  ];

  modeOfWeightIn = [
    { id: 1, name: 'Kg(s)' },
    { id: 2, name: 'LB(s)' },
    { id: 3, name: 'Tonne(s)' },
  ];

  modeOfFreightTerms = [
    { id: 1, name: 'Prepaid' },
    { id: 2, name: 'Collect' },
  ];

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  @ViewChild('containerModal') containerModal!: TemplateRef<any>;

  constructor(private router: Router, private modalService: NgbModal) {}

  selectedTab = 'Master';

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  selectedTab1 = 'Product';

  selectTab1(tab1: string) {
    this.selectedTab1 = tab1;
  }

  openContainerModal(content: any) {
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  navigateToBooking() {
    this.router.navigate(['operation/booking/entry']);
  }
}

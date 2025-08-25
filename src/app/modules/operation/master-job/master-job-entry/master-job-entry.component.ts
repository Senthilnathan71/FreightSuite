import { Component, ViewChild, TemplateRef } from '@angular/core';
import { NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { MilestoneComponent } from '../../milestone/milestone/milestone.component';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';

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
    EmailEntryComponent,
    MilestoneComponent,
    FollowUpComponent,
    EdocComponent
  ],
  templateUrl: './master-job-entry.component.html',
  styleUrl: './master-job-entry.component.scss',
})
export class MasterJobEntryComponent {
  public costcomponent = CostEntryComponent;
  public revenuecomponent = RevenueEntryComponent;
  public connectionComponent = ConnectionComponent;
  public containerComponent = ContainerActivityComponent;
  public ARAPcompoent = ArApComponent;
  public milestoneComponent = MilestoneComponent;

  public emailcomponent = EmailEntryComponent;
  public followupComponent = FollowUpComponent;
  public edocComponent = EdocComponent;
  tabs = [
    { name: 'Container', icon: 'fas fa-boxes' },
    { name: 'Connection', icon: 'fas fa-plug' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Mail', icon: 'fas fa-envelope' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'ContainerActivity', icon: 'fas fa-shipping-fast' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
    { name: 'History', icon: 'fas fa-history' },
  ];

  tabs1 = [
    { name: 'Product', icon: 'fas fa-box' } ,
    { name: 'Connection', icon: 'fas fa-plug' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Rate', icon: 'fas fa-rupee-sign' },
    { name: 'AR/AP', icon: 'fas fa-balance-scale' },
    { name: 'Follow Up', icon: 'fas fa-tasks' },
    { name: 'Mail', icon: 'fas fa-envelope' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'Edoc', icon: 'fas fa-file-pdf' },
    { name: 'History', icon: 'fas fa-history' },
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
  @ViewChild('productModal') productModal!: TemplateRef<any>;
  constructor(private router: Router, private modalService: NgbModal) {}
  selectedTab = 'Container';

  selectTab(tab: string) {
    console.log(tab);
    this.selectedTab = tab;
    console.log(this.selectedTab);
  }

  selectedTab1 = 'Product';

  selectTab1(tab1: string) {
    this.selectedTab1 = tab1;
  }
  openContainerModal() {
    this.modalService.open(this.containerModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  openProductModal() {
    this.modalService.open(this.productModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }


  navigateToback() {
    this.router.navigate(['operation/master-job/list']);
  }
}

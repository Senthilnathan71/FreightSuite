import { Component, ViewChild, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './booking-entry.component.html',
  styleUrls: ['./booking-entry.component.scss'],
})
export class BookingEntryComponent {
  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  modeOfShippmentTerms = [
    { id: 1, name: 'LCL' },
    { id: 2, name: 'FCL' },
  ];

  modeOfDept = [
    { id: 1, name: 'LCL' },
    { id: 2, name: 'FCL' },
    { id: 3, name: 'AIR' },
  ];

  modeOfTransport = [
    { id: 1, name: 'Rail' },
    { id: 2, name: 'Road' },
    { id: 3, name: 'Flight' },
    { id: 4, name: 'Vessel' },
  ];

  modeOfShipmentTerms = [
    { id: 1, name: 'FCL/FCL' },
    { id: 2, name: 'FCL/LCL' },
    { id: 3, name: 'LCL/FCL' },
    { id: 4, name: 'LCL/LCL' },
    { id: 5, name: 'LTL' },
    { id: 6, name: 'FTL' },
    { id: 7, name: 'FTL HH' },
  ];

  modeOfMovementType = [
    { id: 1, name: 'CY-CFS' },
    { id: 2, name: 'CFS-FO' },
    { id: 3, name: 'CFS-CY' },
    { id: 4, name: 'CFS-CFS' },
    { id: 5, name: 'FO-FI' },
    { id: 6, name: 'Door-Door' },
    { id: 7, name: 'CY-Door' },
    { id: 8, name: 'CY-FO' },
  ];

  modeOfReleaseType = [
    { id: 1, name: 'Original' },
    { id: 2, name: 'Sea Way BL' },
    { id: 3, name: 'Express' },
    { id: 4, name: 'Drat' },
  ];

  tabs = [
    { name: 'Shipment', icon: 'fas fa-ship' },
    { name: 'Charges', icon: 'fas fa-credit-card' },
    { name: 'Cargo', icon: 'fas fa-boxes' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
    { name: 'Connection', icon: 'fas fa-link' },
    { name: 'Rate', icon: 'fas fa-chart-line' },
    { name: 'Milestone', icon: 'fas fa-flag-checkered' },
    { name: 'AR/AP', icon: 'fas fa-file-alt' },
  ];

  @ViewChild('productModal') productModal!: TemplateRef<any>;
  @ViewChild('connectionModal') connectionModal!: TemplateRef<any>;
  @ViewChild('rateModal') rateModal!: TemplateRef<any>;
  constructor(private router: Router, private modalService: NgbModal) {}

  navigateBack() {
    this.router.navigate(['operation/booking/list']);
  }

  selectedTab = 'Shipment';
  isQuickFormExpanded = false;

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  toggleQuickForm() {
    this.isQuickFormExpanded = !this.isQuickFormExpanded;
  }

  

  openProductModal() {
    this.modalService.open(this.productModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  saveProduct(modal: any) {
    console.log('Product saved');
    modal.close();
  }

  openConnectionModal() {
    this.modalService.open(this.connectionModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  saveConnection(modal: any) {
    console.log('Connection saved');
    modal.close();
  }

  openRateModal() {
    this.modalService.open(this.rateModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  saveRate(modal: any) {
    console.log('Rate saved');
    modal.close();
  }
}

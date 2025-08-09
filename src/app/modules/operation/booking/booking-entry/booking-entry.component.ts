import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-booking-entry',
  standalone: true,
  imports: [NgSelectModule, NgbDatepickerModule, FeatherModule,CommonModule,FormsModule ,ReactiveFormsModule],
  templateUrl: './booking-entry.component.html',
  styleUrl: './booking-entry.component.scss',
})
export class BookingEntryComponent {
  constructor(private router: Router) {}

  navigateBack() {
    this.router.navigate(['operation/booking/list']);
  }

  tabs: string[] = ['LCL', 'FCL', 'AIR'];
  selectedTab = 'LCL';
  selectedDept = 'LCL'; // Default

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
    { id: 3, name: 'AIR' }
  ];

  // Tab click → also update dropdown
  selectTab(tab: string) {
    this.selectedTab = tab;
    if (this.selectedDept !== tab) {
      this.selectedDept = tab;
    }
  }

  // Dropdown change → also update tab
  onDeptChange(event: any) {
    if (this.selectedTab !== this.selectedDept) {
      this.selectedTab = this.selectedDept;
    }
  }
}

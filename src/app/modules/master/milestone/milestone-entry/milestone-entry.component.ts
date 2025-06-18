import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-milestone-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './milestone-entry.component.html',
  styleUrl: './milestone-entry.component.scss',
})
export class MilestoneEntryComponent {
  milestoneForm: FormGroup;


  constructor(private fb: FormBuilder,  private router: Router ) {
    this.initform();
  }

  navigateBack() {
   this.router.navigate(['master/milestone/list']);
  }

  initform() {
    this.milestoneForm = this.fb.group({
      Name: ['', Validators.required],
      ShipmentType: [null, Validators.required],
      DeptType: [null, Validators.required],
      orderBy: [''],
      code: ['', Validators.required],
      status: [null, Validators.required],
      Remarks: [''],
      originalName: ['', Validators.required],
      autoMail: [null, Validators.required],
    });
  }

  onSubmit() {
    if (this.milestoneForm.invalid) {
      this.milestoneForm.markAllAsTouched();
      return;
    }

    console.log('Form Submitted', this.milestoneForm.value);
  }

  modeOfAutomail = [
    { id: '1', name: 'Yes' },
    { id: '2', name: 'No' },
  ];
  modeOfStatus = [
    { id: 'Active', name: 'Active' },
    { id: 'Suspended', name: 'Suspended' },
  ];
  modeOfShipmentType = [
    { id: 'Shipment1', name: 'Shipment1' },
    { id: 'Shipment2', name: 'Shipment2' },
    { id: 'Shipment3', name: 'Shipment3' },
  ];

  modeOfDepartmentType = [
    { id: 'Department1', name: 'Department1' },
    { id: 'Department2', name: 'Department2' },
    { id: 'Department3', name: 'Department3' },
  ];
}

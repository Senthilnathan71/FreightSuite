import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-year-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule],
  templateUrl: './year-entry.component.html',
  styleUrl: './year-entry.component.scss',
})
export class YearEntryComponent {
  yearForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initYearForm();
  }
  initYearForm() {
    this.yearForm = this.fb.group({
      Name: ['', Validators.required],
      Code: ['', Validators.required],
      StartDate: ['', Validators.required],
      EndDate: ['', Validators.required],
      CurrentYear: ['', Validators.required],
      YearEndCompl: ['', Validators.required],
      Remarks: [''],
      Status: [[], Validators.required],
    });
  }

  resetForm() {
  this.yearForm.reset();
}

  
  onSubmit() {
    if (this.yearForm.invalid) {
      this.yearForm.markAllAsTouched();
      return;
    }
    console.log(this.yearForm.value);
  }
  navigateBack() {
    history.back();
  }

  modeOfStatus = [
    { id: '1', name: 'Active' },
    { id: '2', name: 'Suspended' },
  ];
}

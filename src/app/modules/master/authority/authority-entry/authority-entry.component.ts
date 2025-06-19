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
  selector: 'app-authority-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule],
  templateUrl: './authority-entry.component.html',
  styleUrl: './authority-entry.component.scss',
})
export class AuthorityEntryComponent {
  Authorityform: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initform();
  }
  
  
  initform() {
    this.Authorityform = this.fb.group({
      menuname: [null, Validators.required],
      location: [null, Validators.required],
      selectedDepartments: [[], Validators.required],
    });
  }

  navigateBack() {
    history.back();
  }

  onSubmit() {
    if (this.Authorityform.invalid) {
      this.Authorityform.markAllAsTouched();
      return;
    }
    console.log(this.Authorityform.value);
  }
  modeOfDept = [
    { id: '1', name: 'FCL Exp' },
    { id: '2', name: 'LCL Exp' },
  ];
  modeOfLocation = [
    { id: '1', name: 'Chennai' },
    { id: '2', name: 'Bangalore' },
    { id: '3', name: 'Mumbai' },
    { id: '4', name: 'Coimbatore' },
  ];
  modeOfMenu = [
    { id: '1', name: 'Menu 1' },
    { id: '2', name: 'Menu 2' },
  ];
}

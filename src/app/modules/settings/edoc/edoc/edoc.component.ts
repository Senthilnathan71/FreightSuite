import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-edoc',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule],
  templateUrl: './edoc.component.html',
  styleUrl: './edoc.component.scss',
})
export class EdocComponent {
  edocform: FormGroup;
  constructor(private fb: FormBuilder) {
    this.initYearForm();
  }

  initYearForm() {
    this.edocform = this.fb.group({
      DocuNo: ['', Validators.required],
      Date: ['', Validators.required],
      file: ['', Validators.required],
      Filename: ['', Validators.required],
      Type: ['', Validators.required],
      ReceivedDate: ['', Validators.required],
      SentDate: ['', Validators.required],
      FollowupDate: ['', Validators.required],
      FollowupAction: ['', Validators.required],
      Remarks: [''],
      Status: ['', Validators.required],
    });
  }

   onSubmit() {
    if (this.edocform.invalid) {
      this.edocform.markAllAsTouched();
      return;
    }
    console.log(this.edocform.value);
  }

  resetForm() {
  this.edocform.reset();
}

  modeOfType = [
    { id: '1', name: 'Type 1' },
    { id: '2', name: 'Type 2' },
  ];

  modeOfStatus = [
    { id: '1', name: 'Active' },
    { id: '2', name: 'Suspended' },
  ];
}
